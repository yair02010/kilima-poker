---
id: KP-ENG-14
title: Operator Network (B2B)
subtitle: Skins, player onboarding, wallet integration, shared liquidity and network settlement
version: 1.0
owner: Head of B2B / Tech Lead — Platform
status: Draft
related: KP-ENG-01 (D10, D11) · KP-ENG-02 §7 · KP-ENG-08 Wallet · KP-FIN-03 Financial Controls · KP-LEG-01 Regulatory Assessment
---

# 1. Model

Kilima Poker can be offered by licensed operators (typically sportsbooks and casinos) inside their own brand. Each operator is a **tenant**. Players of all tenants in the same liquidity pool play at the same tables. Kilima runs the games, the RNG, integrity and (depending on the contract) KYC and payments; the operator owns the customer relationship in its brand.

@widths 1.5,1.7,1.8
| Responsibility | Kilima | Operator |
|---|---|---|
| Game servers, RNG, certification | ✓ | — |
| Game integrity (network-wide) | ✓ (decisions binding network-wide) | Receives notices; may add own restrictions |
| Licence for its players | Where Kilima is the licensee (B2C) | Operator's own licence for its players |
| KYC and AML | Configurable: Kilima or operator | Configurable; at least one party must, per contract and licence |
| Payments | Transfer wallet: Kilima cashier; seamless: operator | Seamless: operator cashier |
| Responsible gaming | Enforces limits it receives and its own game-level limits | Owns player-level limits and exclusions; pushes them to Kilima |
| Branding and marketing | White-label client themes | Brand, promotions (funded by operator) |

# 2. Onboarding an Operator

1. Contract, licence check (the operator's licence must cover poker in the jurisdictions it brings), due diligence (KP-LEG-04).
2. Configuration in the back-office: tenant id, brand theme (logo, colours, domain), jurisdictions, pools, wallet mode, revenue share, KYC responsibility, API keys (public keys; mTLS certificates).
3. Integration in a sandbox (`operator-sandbox` environment with Play Money pools and a mock wallet), certification test suite (section 7), go-live approval.

# 3. Player Launch

Operators authenticate their players and launch the poker client with a one-time token (KP-ENG-02 §7):

```
POST /operator/v1/sessions          (mTLS + X-Signature: HMAC-SHA256 over body and timestamp)
{ "operatorPlayerId": "op-98231", "screenNameHint": "lion_king", "currency": "USD",
  "jurisdiction": "KE", "kyc": { "status": "verified", "level": "full", "verifiedAt": "…" },
  "limits": { "dailyDeposit": 5000 }, "locale": "sw" }
→ 201 { "launchToken": "lt_…", "expiresIn": 60, "launchUrl": "https://poker.operator.example/?lt=lt_…" }
```

The Kilima account is created on first launch and linked (`operator.player_links`). Screen names are network-unique; if the hint is taken, the player chooses another on first launch.

# 4. Wallet Modes

## 4.1 Transfer wallet

The player moves funds from the operator wallet to the Kilima poker wallet and back (`POST /operator/v1/transfers`, idempotent). Kilima holds the poker balance as in B2C; ledger: `operator:{oid}:{ccy}:network` is the counterpart of transfers. Simple and robust; the player sees two balances.

## 4.2 Seamless wallet

The operator holds the only balance. Kilima calls the operator's wallet API at money events:

@widths 1.1,2,1.9
| Call | When | Semantics |
|---|---|---|
| `debit` | Table buy-in, top-up, tournament entry, rebuy | Idempotent by `transactionId`; must answer within 2 s; on timeout Kilima retries and never seats the player until confirmed |
| `credit` | Cash-out, tournament prize, bounty, refund | Idempotent; Kilima retries with exponential backoff for up to 72 h; unconfirmed credits are listed in the daily reconciliation |
| `rollback` | A debit whose outcome is unknown and the action was cancelled | Idempotent reversal of a specific debit |
| `balance` | Display only | Never used for decisions |

Chips on tables and in tournaments are held in Kilima's ledger (table and tournament accounts) exactly as in B2C; the counterpart is `operator:{oid}:{ccy}:seamless`. Hand settlements never call the operator; only entering and leaving the poker product does.

# 5. Shared Liquidity and Ring-Fencing

- A pool lists allowed tenants and jurisdictions. A tenant can join a pool only if its licence and contract allow it; a player can join only if their jurisdiction is allowed for that pool (KP-ENG-01 D10).
- Screen names and avatars are the only information shown across tenants; operator names are not shown at tables (optional small brand badge where contracts require it).
- Integrity decisions are network-wide: a player banned for collusion is banned on all tenants that share the KYC identity.

# 6. Network Settlement

Players of different operators win and lose to each other. Each operator's **network position** is tracked in its ledger clearing account:

- Transfer wallet: `operator:{oid}:network` accumulates transfers in and out; poker results are inside Kilima's player accounts.
- Seamless: `operator:{oid}:seamless` accumulates debits and credits; its balance over a period equals the net amount the operator's players won from (negative) or lost to (positive) the network, plus rake.

**Monthly (or weekly) settlement statement per operator:** gross rake and fees generated by its players, revenue share due to the operator (e.g. a percentage of net rake after network costs, bonuses and taxes, per contract), net player winnings from other operators' players, and the resulting net payment (one bank transfer per currency). Statements are generated from the ledger (KP-FIN-03), signed, and available in the operator back-office and via `GET /operator/v1/reports/settlement`.

Rake attribution: rake of a hand is attributed to tenants in proportion to each player's contribution to the pot (the "contributed" method), the common method in poker networks; the alternative "dealt" method is available per contract.

# 7. Operator Integration Tests (certification suite)

A tenant goes live only after its integration passes, in the sandbox:

- Launch flow, expired and replayed launch tokens rejected.
- Seamless: duplicate debit/credit handling, timeouts, rollbacks, out-of-order callbacks, operator downtime for 1 hour (credits queued and delivered later), balance mismatches reported.
- Player status pushes: self-exclusion and suspension take effect within 60 seconds (player removed after the current hand, no new seats).
- Reports and settlement statement match the operator's own records for a seeded test period.

# 8. Operator Back-office

Operators see (only for their tenant, enforced by row-level security): players and their activity, poker revenue and rake, settlement statements, integrity notices for their players, responsible-gaming status, support views of hand histories for tickets, and the brand configuration. They cannot see other tenants' players, hole cards of live hands, or integrity evidence about other tenants' players.
