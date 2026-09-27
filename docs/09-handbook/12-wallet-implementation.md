---
id: KP-HBK-12
title: Implementing the Wallet
subtitle: Ledger schema, the posting function, locking, idempotency and posting helpers
version: 1.0
owner: Tech Lead — Payments
status: Approved
related: KP-ENG-08 Wallet and Ledger · KP-ENG-05 §5 · ADR-0005 · ADR-0006 · KP-FIN-03
---

# 1. The One Way to Move Money

All postings go through one database function, called only by the `wallet` service role. Application code builds entries with helpers in `packages/ledger-postings`; nobody writes `INSERT INTO ledger.entries` anywhere else (lint rule + database grants).

# 2. Posting Function (sketch)

```sql
CREATE FUNCTION ledger.post(p_type text, p_key text, p_request_hash text, p_ref_kind text, p_ref_id text,
                            p_initiator jsonb, p_reason text, p_entries jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_tx uuid; v_existing record; e record;
BEGIN
  SELECT id, request_hash INTO v_existing FROM ledger.transactions WHERE idempotency_key = p_key;
  IF FOUND THEN
    IF v_existing.request_hash <> p_request_hash THEN RAISE EXCEPTION 'IDEMPOTENCY_MISMATCH'; END IF;
    RETURN v_existing.id;                                  -- replay: same result, no effect
  END IF;
  -- entries must sum to zero per currency
  IF EXISTS (SELECT 1 FROM jsonb_to_recordset(p_entries) AS x(account_id uuid, currency text, amount bigint)
             GROUP BY currency HAVING sum(amount) <> 0) THEN RAISE EXCEPTION 'UNBALANCED'; END IF;
  -- lock balances in a deterministic order to avoid deadlocks
  PERFORM 1 FROM ledger.balances b
    WHERE b.account_id IN (SELECT (x->>'account_id')::uuid FROM jsonb_array_elements(p_entries) x)
    ORDER BY b.account_id FOR UPDATE;
  INSERT INTO ledger.transactions(id, type, idempotency_key, request_hash, reference_kind, reference_id, initiated_by, reason, status)
    VALUES (gen_uuid_v7(), p_type, p_key, p_request_hash, p_ref_kind, p_ref_id, p_initiator, p_reason, 'posted')
    RETURNING id INTO v_tx;
  FOR e IN SELECT * FROM jsonb_to_recordset(p_entries) AS x(account_id uuid, currency text, amount bigint) ORDER BY account_id LOOP
    UPDATE ledger.balances SET balance = balance + e.amount, version = version + 1, updated_at = now()
      WHERE account_id = e.account_id;
    IF (SELECT guard_non_negative FROM ledger.accounts WHERE id = e.account_id)
       AND (SELECT balance FROM ledger.balances WHERE account_id = e.account_id) < 0 THEN
      RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
    END IF;
    INSERT INTO ledger.entries(id, tx_id, account_id, currency, amount, balance_after)
      SELECT gen_uuid_v7(), v_tx, e.account_id, e.currency, e.amount, balance FROM ledger.balances WHERE account_id = e.account_id;
  END LOOP;
  INSERT INTO ledger.outbox(topic, key, payload) VALUES ('wallet.tx.posted', v_tx::text, jsonb_build_object('txId', v_tx, 'type', p_type));
  RETURN v_tx;
END $$;
```

The unique index on `idempotency_key` also protects against two concurrent first attempts: the loser gets a unique violation, and the service re-reads and returns the winner's transaction.

# 3. Posting Helpers

```ts
export function settleHand(p: { handId: string; tableId: string; currency: Currency;
                                net: Record<AccountId, bigint>; rake: bigint }): PostingCmd {
  const entries = Object.entries(p.net).filter(([, v]) => v !== 0n)
    .map(([acc, v]) => entry(tableAccount(p.tableId, acc), p.currency, v));
  if (p.rake > 0n) entries.push(entry(houseRake(p.currency), p.currency, p.rake));
  assertSumZero(entries);                                            // fail before the database does
  return { type: "hand_settlement", key: `hand:${p.handId}`, ref: { kind: "hand", id: p.handId }, entries };
}
```

One helper per posting type in KP-ENG-08 §4; each has unit tests with the worked examples from that document.

# 4. Account Creation

Accounts are created lazily by the posting helpers through `ledger.ensure_accounts(codes[])` (idempotent) inside the same transaction; `guard_non_negative` is true for player, table and tournament accounts.

# 5. Performance

- Hot rows: `house:{ccy}:rake` is updated by every hand. To avoid a single hot row, use **sharded house accounts** (`house:USD:rake:0..15`, chosen by hash of the table id) and sum them in reports.
- Batch nothing across hands: one hand = one transaction keeps failure isolation simple.
- Targets: NFR-05; measure with `pnpm bench:wallet` against a production-sized database.

# 6. Reconciliation Jobs

`recon-hand` (stream, per `hand.completed`), `recon-nightly` (balances vs entries, sums, closed tables, tournament pools), `recon-providers` (three-way, KP-FIN-03 §2.2). Each job writes results to `ledger.recon_runs` and raises alerts per KP-OPS-02 §4.

# 7. Definition of Done for Wallet Changes

- [ ] New posting type documented in KP-ENG-08 with a worked example approved by finance
- [ ] Helper + unit tests; property test updated; concurrency integration test
- [ ] Reconciliation covers the new accounts
- [ ] Two approvals (Payments tech lead + finance systems owner)
