---
id: KP-ENG-08
title: Wallet and Ledger
subtitle: Multi-currency double-entry ledger, table accounts, hand settlement and posting rules
version: 1.0
owner: Tech Lead — Payments
status: In review
related: KP-ENG-01 (D7, D8) · KP-ENG-05 Data Model · KP-FIN-01 Treasury · KP-FIN-02 Payments · KP-FIN-03 Financial Controls · KP-LEG-04 AML/KYC
---

# 1. Scope and Principles

The `wallet` service is the only component that changes balances. `cashier` (payments) and `wallet` share the ledger cluster but only `wallet` writes ledger entries; `cashier` asks `wallet` to post.

- **Double entry.** Every transaction consists of two or more entries that sum to exactly zero **per currency**.
- **Insert-only.** Ledger rows are never updated or deleted (the database role has no `UPDATE`/`DELETE` on ledger tables). Corrections are reversal transactions.
- **Integer minor units.** `bigint` amounts; USD 1.00 = 100 units. Every amount carries its ISO 4217 currency (or `KPC` in Play Money). No floating point anywhere in the money path.
- **Idempotent.** Every posting has an idempotency key; retries never double-post.
- **Atomic and serialisable.** Entries and cached balances are written in one PostgreSQL transaction with row locks on the affected balances (`SELECT … FOR UPDATE` in a deterministic account order to avoid deadlocks).
- **Chips on the table are money** (KP-ENG-01 D8): stacks are ledger balances.
- **Mode isolation.** Play Money runs a separate ledger; `KPC` never exists in the Real Money ledger.

# 2. Chart of Accounts

@widths 2.1,0.9,2
| Account | Type | Purpose |
|---|---|---|
| `player:{id}:{ccy}:cash` | liability | Withdrawable balance |
| `player:{id}:{ccy}:bonus` | liability | Bonus funds with wagering requirements (not withdrawable) |
| `player:{id}:{ccy}:pending_withdrawal` | liability | Funds held for a withdrawal in progress |
| `player:{id}:{ccy}:locked` | liability | Funds frozen by compliance or integrity (not playable, not withdrawable) |
| `player:{id}:{ccy}:tickets` | liability | Tournament tickets held, at face value |
| `receivable:{id}:{ccy}` | asset | Amounts a player owes after a reversal of funds already spent |
| `table:{tableId}:{id}` | liability | Player's stack at a cash table (one per seat session) |
| `fastfold:{entryId}` | liability | Player's stack in a fast-fold pool entry |
| `tournament:{tid}:pool` | liability | Prize pool of a tournament |
| `tournament:{tid}:bounty` | liability | Bounty money of a bounty tournament |
| `house:{ccy}:rake` | revenue | Cash-game rake |
| `house:{ccy}:fees` | revenue | Tournament and SNG fees |
| `house:{ccy}:promo` | expense | Bonuses, guarantee overlays, freerolls, promotions |
| `house:{ccy}:rakeback` | expense | Loyalty and rakeback payments |
| `house:{ccy}:adjustments` | equity/expense | Manual adjustments (four-eyes) |
| `house:{ccy}:integrity` | liability | Confiscated funds awaiting redistribution to affected players (KP-ENG-09 §7); must return to 0 when a case closes |
| `clearing:{provider}:{ccy}` | asset | Money in transit with a payment provider (deposits in, payouts out) |
| `fees:{provider}:{ccy}` | expense | Provider fees charged per transaction |
| `fx:{ccyA}_{ccyB}` | clearing | Currency conversion counterpart (one per currency on each side) |
| `tax:{jur}:{kind}:{ccy}` | liability | Taxes withheld or payable (e.g. withholding tax on winnings, excise on deposits), per jurisdiction |
| `operator:{oid}:{ccy}:network` | clearing | B2B network position of an operator (KP-ENG-14) |
| `operator:{oid}:{ccy}:seamless` | clearing | Seamless-wallet counterpart for an operator's players |
| `play:faucet` | Play Money only | Source of free play chips |

Invariants (checked in every transaction and nightly): the sum of all entries per currency is 0; player accounts, table accounts and tournament accounts are never negative.

# 3. Transactions and Entries

```
ledger.transactions(id, type, idempotency_key UNIQUE, reference_kind, reference_id, currency,
                    initiated_by_kind, initiated_by_id, reason, status, created_at)
ledger.entries(id, tx_id, account_id, amount, balance_after, created_at)
ledger.balances(account_id PRIMARY KEY, currency, balance, version, updated_at)
```

Every posting API takes a posting **type** and business parameters; helper functions build the entries (`buyIn`, `settleHand`, `cashOut`, `enterTournament`, `payPrizes`, `deposit`, `withdrawHold`, …). Callers never send raw entries.

# 4. Posting Rules

Amounts below are in USD for readability; the ledger stores units.

## 4.1 Deposit

1. `cashier` creates a payment (`initiated`) and asks the provider for a payment request (e.g. M-Pesa STK push). Nothing is posted.
2. Provider confirmation (signed callback or status poll) → `deposit`:

```
player:A:USD:cash          +20.00
clearing:mpesa:USD         −20.00      (when the provider settles in KES, see 4.9 FX)
```

3. Provider fee (if charged to the house): `provider_fee` `fees:mpesa:USD +0.30 / clearing:mpesa:USD −0.30`. Fees charged to the player are shown before confirmation and posted as part of the deposit.
4. Excise or deposit taxes where a jurisdiction requires them: `tax_deposit` from `player:A:cash` to `tax:{jur}:excise`, shown to the player before confirmation.
5. Chargeback or provider reversal → `deposit_reversal`: the reversed amount is taken from `player:cash`; any part already spent is moved to `receivable:{id}:{ccy}` (never a negative player balance), the account is restricted, and collections handles the receivable (KP-FIN-02 §6).

## 4.2 Cash-table buy-in, hand settlement and cash-out

Buy-in 10.00 at table T (`table_buyin`, key `sit:{reservationId}`):

```
player:A:USD:cash      −10.00
table:T:A              +10.00
```

**Hand settlement** (`hand_settlement`, key `hand:{handId}`): one transaction per hand that moved chips. The helper computes the **net change per seat** = amount won − amount committed (after uncalled bets are returned) and adds the rake entry, so the entries always sum to zero. Example: A, B and C each commit 2.00; A wins the 6.00 pot; rake 0.30:

```
table:T:A      +3.70       (6.00 − 0.30 − 2.00)
table:T:B      −2.00
table:T:C      −2.00
house:USD:rake +0.30
```

Cash-out when A stands up with 13.70 (`table_cashout`, key `stand:{sessionId}`):

```
table:T:A             −13.70
player:A:USD:cash     +13.70
```

## 4.3 Fast-fold

Buy-in goes to `fastfold:{entryId}`; every hand settles between the entries of the players involved; leaving the pool posts `fastfold_cashout`. Virtual tables have no accounts of their own.

## 4.4 Tournaments

@widths 1.5,3.5
| Type | Entries |
|---|---|
| `tournament_entry` | `player:cash −(buyIn + fee)` · `tournament:{tid}:pool +prizePart` · `tournament:{tid}:bounty +bountyPart` · `house:fees +fee` |
| `tournament_overlay` | `house:promo −overlay` · `tournament:{tid}:pool +overlay` |
| `tournament_bounty` | `tournament:{tid}:bounty −x` · `player:eliminator:cash +x` |
| `tournament_prize` | `tournament:{tid}:pool −Σ` · `player:winner_i:cash +prize_i` (and taxes withheld, 4.8) |
| `tournament_refund` | reverse of the entry, including the fee, when a player unregisters or a tournament is cancelled |
| `ticket_issue` / `ticket_redeem` | tickets are liabilities in `player:{id}:{ccy}:tickets`; issued from satellite pools or `house:promo`, redeemed into a tournament entry |

Rounding: prize percentages are computed on units with floor; the remainder goes to the first place so the pool ends at exactly 0.

## 4.5 Withdrawal

1. Request (step-up verified) → `withdraw_hold`: `player:cash −X`, `player:pending_withdrawal +X`.
2. Approved and paid by the provider → `withdraw`: `player:pending_withdrawal −X`, `clearing:{provider} +X`.
3. Rejected, cancelled or failed → `withdraw_release`: back to `player:cash`.

## 4.6 Bonuses and rakeback

- Bonus credit: `bonus_credit` `house:promo −x / player:bonus +x`. Bonus funds are released to `cash` in steps as wagering (rake contributed) is met: `bonus_release`.
- Rakeback and loyalty rewards (weekly or instant): `rakeback` `house:rakeback −x / player:cash +x`, computed from posted rake only.
- Playing with bonus funds: bonus funds are not used for buy-ins in v1 (simpler and safer); they convert to cash as they are released.

## 4.7 Adjustments

`adjustment` between a player account and `house:adjustments` with a mandatory reason, ticket reference and four-eyes approval above 50.00 USD (configurable). Never directly on table or tournament accounts; those are corrected with reversals of the original hand or tournament transaction.

## 4.8 Taxes on winnings

Where a jurisdiction requires withholding tax on winnings, the rule (basis, rate, threshold, per-hand or per-session or on withdrawal) is configured per jurisdiction by finance and counsel (`tax_rules`). The wallet posts `tax_withholding` from the player's winnings to `tax:{jur}:wht:{ccy}` in the same transaction as the settlement or prize, and the player's statement shows the gross win, the tax and the net. Tax rates are never hard-coded.

## 4.9 Currency conversion

Tables run in the pool currency. When a player deposits or withdraws in another currency, the conversion is an explicit `fx` transaction at a rate recorded with the transaction (rate source, timestamp, spread):

```
player:A:KES:cash    −2,600.00     fx:KES_USD:KES   +2,600.00
player:A:USD:cash    +19.85        fx:KES_USD:USD   −19.85
```

The `fx` accounts are settled by treasury (KP-FIN-01). The player always sees the rate and the amount before confirming.

# 5. Concurrency, Idempotency and Failure Handling

## 5.1 Idempotency

- Unique index on `transactions.idempotency_key`. A repeated posting with the same key and the same body returns the original transaction; the same key with a different body returns `409 IDEMPOTENCY_MISMATCH`.
- Deterministic keys for internal callers: `hand:{handId}`, `sit:{reservationId}`, `stand:{sessionId}`, `tentry:{tid}:{accountId}:{n}`, `prize:{tid}:{place}`, `dep:{paymentId}`, `wd:{withdrawalId}:{step}`.

## 5.2 Locking

A transaction locks the balance rows of all its accounts in ascending account-id order, checks non-negativity, inserts entries with `balance_after`, updates the cached balances and commits. Serialisation failures retry up to 3 times with jitter.

## 5.3 Hand settlement latency

`table-server` sends the settlement at hand end and waits for the commit before starting the next hand at that table (target p99 < 50 ms). If the wallet is unavailable, the table pauses (players see "table paused") rather than dealing a hand whose stacks are not confirmed.

## 5.4 Voided hands

If a table-server fails during a hand, the hand is **voided**: nothing was posted for it, so all stacks are the balances after the previous settled hand. The hand record is stored with status `voided`, and the affected players are notified. Voided-hand rate is an SLO (KP-ENG-10).

## 5.5 Holds from integrity and compliance

`lock` / `unlock` postings move funds between `cash` and `locked` (for example during a collusion investigation or a source-of-funds review). Table stacks of a banned player are cashed out to `locked`, not to `cash`.

# 6. Reconciliation (summary)

- **Continuous:** every transaction sums to zero per currency before commit.
- **Per hand:** `hand.completed` totals (pots, rake, returned bets) must equal the settlement transaction; a mismatch raises a P1 alert and pauses the table.
- **Nightly:** cached balances = sum of entries; sum of all balances per currency = 0; table accounts of closed sessions = 0; completed tournament pools = 0; `clearing:{provider}` matches provider statements (three-way reconciliation with bank statements, KP-FIN-03).
- **Player funds protection:** total player liabilities (cash, bonus, pending withdrawals, locked, tables, tournaments) are reported daily to treasury and must be covered by segregated bank and mobile-money balances (KP-FIN-01).

# 7. Internal API

```
POST /internal/wallet/postings
{ "type": "hand_settlement", "idempotencyKey": "hand:h_01J9Z…",
  "reference": { "kind": "hand", "id": "h_01J9Z…" }, "currency": "USD",
  "params": { "tableId": "t_4Kx", "net": { "01J..A": 370, "01J..B": -200, "01J..C": -200 }, "rake": 30 } }
→ 201 { "txId": "tx_…", "status": "posted", "balances": { … } }
→ 409 IDEMPOTENCY_MISMATCH | 402 INSUFFICIENT_FUNDS | 422 UNBALANCED | 423 ACCOUNT_LOCKED
```

Reachable only inside the cluster (network policy + mTLS) with a service token carrying the scope for that posting type (`wallet:post:hand`, `wallet:post:tournament`, `wallet:post:payment`, …). Each caller may only use the posting types in its scope.

# 8. Acceptance Criteria

- Property test: 1,000,000 random postings across all types, including concurrent postings on shared accounts: the ledger stays balanced per currency, no guarded account ever becomes negative.
- Replaying any posting with the same key returns the same `txId` and changes nothing.
- Chaos test: killing `table-server` and `wallet` pods at random points during 100,000 hands never loses or duplicates money; every hand is either settled once or voided.
- Nightly reconciliation passes on a seeded dataset and detects an injected one-unit error in any account type.
- Settlement p99 < 50 ms at 2,000 settlements per second (GA load test).
