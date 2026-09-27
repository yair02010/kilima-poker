---
id: KP-OPS-03
title: Runbooks
subtitle: Step-by-step procedures for common operational events
version: 1.0
owner: SRE Lead (with Payments, Game Ops, Integrity and Treasury)
status: Draft — every runbook is rehearsed in staging before Beta and reviewed quarterly
related: KP-OPS-02 Alerts · KP-OPS-04 Incident Response · KP-OPS-05 Backup and DR · KP-FIN-01 Treasury
---

# 1. How to Use

Each runbook has: trigger, impact, immediate actions, diagnosis, resolution, communication, follow-up. Actions that move money or change player status need the approvals stated in the runbook even during incidents. Record every action in the incident channel with timestamps.

# 2. RB-01 Ledger imbalance or settlement mismatch (P1)

1. **Freeze risk:** pause affected tables (or all Real Money tables if the scope is unknown) via the back-office "pause tables" switch; pause withdrawals.
2. Identify the transaction(s): reconciliation report shows account set, currency and first failing transaction id.
3. Compare the hand record (`hand.completed`) with the settlement; check engine and wallet versions deployed at that time.
4. Correct only with reversal and re-posting transactions approved by the Financial Controller and CTO; never edit rows.
5. Re-run reconciliation; resume tables and withdrawals when clean.
6. Postmortem mandatory; regulator notification if the licence requires it.

# 3. RB-02 Game degradation (latency, voided hands, disconnects)

1. Check dashboards: which pool/country/pod? Recent deploy? → roll back if correlated.
2. Table-server CPU/event-loop lag high → scale out; drain hot pods; check for a pathological table (e.g. PLO6 showdown storms) and move it.
3. Gateway reconnect storm in one country → check CDN/PoP status and mobile-operator incidents; fail over PoP.
4. Redis or wallet latency → see RB-05 / pause tables between hands automatically (built-in).
5. Communicate in-app if player-visible for > 5 minutes.

# 4. RB-03 Tournament incident

1. Tables stuck or mass disconnects during a tournament → **pause the tournament** (all tables finish the current hand).
2. Fix the underlying issue (RB-02, RB-05).
3. Resume within 30 minutes if possible; announce expected resume time in the lobby and to registered players.
4. If the tournament cannot continue, cancel under House Rules (KP-LEG-07 §7) — requires four-eyes (game ops lead + compliance); settlement runs automatically and is verified by finance.

# 5. RB-04 OTP / SMS delivery failure

1. Identify country and provider from OTP metrics; switch primary provider for the affected country; offer WhatsApp channel.
2. If all providers fail: allow trusted-device logins only (no new devices), show a banner, pause registrations in that country.
3. Watch for SMS pumping (verification rate drop): tighten per-prefix budgets, add CAPTCHA.

# 6. RB-05 Data store problems

- PostgreSQL failover: automatic; verify writes resume; check idempotent retries; watch for replication lag on read replicas used by reports.
- Redis failover/loss: tables pause; table-servers rebuild state from the ledger (stacks) and the last snapshots; players reconnect; hands in progress are voided (no money impact).
- Kafka: producers buffer through the outbox; check consumer lag after recovery; ensure `hand.completed` consumers caught up before reports run.

# 7. RB-06 Payment provider outage or anomalies

1. Provider health below threshold → routing marks it degraded (automatic); confirm alternative routes are active.
2. Communicate to players in the cashier ("M-Pesa deposits are delayed; your funds are safe").
3. Payouts: keep queued, never re-send payouts with unknown status (KP-FIN-02 §6).
4. After recovery: status re-query sweep for all pending payments; reconciliation run for the outage window.
5. Suspicious callbacks (signature failures, amount mismatches) → block the endpoint source, involve security (possible provider compromise).

# 8. RB-07 Float low / coverage below target

1. Treasury receives alert; check forecast vs actual withdrawals.
2. Top up float per KP-FIN-01 §7 approvals; if top-up is delayed, prioritise small withdrawals and inform players of delays over the SLA.
3. Coverage < 100 %: P1 — CFO and compliance officer; stop promotions; follow KP-FIN-01 §3.

# 9. RB-08 Suspected cheating wave

1. Integrity on-call reviews the spike (detector or reports); identify the pool/stake and accounts.
2. Apply protective actions: seating restrictions, silent monitoring, withdrawal holds for implicated accounts.
3. If a vulnerability is suspected (e.g. information leak), escalate to P1 security incident; consider closing affected pools.
4. Communicate carefully (no accusations before decisions); publish a summary after enforcement.

# 10. RB-09 Account takeover reports

1. Lock the account (support action), revoke sessions, hold withdrawals.
2. Verify the owner through KYC re-verification (liveness); restore access with new credentials.
3. Investigate: device, IP, SIM-swap indicators; reverse fraudulent in-platform actions where possible (e.g. cancel pending withdrawals).
4. Report to the provider if a payout went to a fraudster's instrument.

# 11. RB-10 Key and secret rotation

- JWT signing key: publish new `kid` in JWKS 24 h ahead → switch signing → keep old public key 24 h.
- Provider API keys: create new key → deploy → verify → revoke old.
- Suspected compromise: rotate immediately, revoke sessions if signing keys are affected, incident process.

# 12. RB-11 Jurisdiction change (urgent block)

1. Compliance officer requests an urgent block (e.g. new legal instruction).
2. Update jurisdiction policy (four-eyes: compliance officer + CTO/admin); takes effect within 60 s.
3. Affected players are removed from tables after the current hand; stacks return to balances; tournaments registered are handled per House Rules; withdrawals remain possible.
4. Notify affected players and operators; log the legal basis.

# 13. RB-12 Planned maintenance

Announce 48 h ahead; no tournaments across the window; `system:maintenance` at T-15 min; drain tables; perform work; smoke tests with bots; reopen; post-maintenance note.
