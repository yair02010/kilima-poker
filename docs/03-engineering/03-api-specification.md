---
id: KP-ENG-03
title: API Specification
subtitle: REST API reference — /api/v1
version: 1.0
owner: Tech Lead — Platform
status: In review
related: KP-ENG-01 · KP-ENG-02 Identity · KP-ENG-04 Real-time Protocol · KP-ENG-14 Operator Network · specs/openapi.yaml
---

# 1. Scope

This document lists every public and staff REST endpoint with its method, path, required role and purpose, and gives request and response bodies for the main flows. The machine-readable contract is `03-engineering/specs/openapi.yaml` (OpenAPI 3.1); CI checks that the two agree (`tools/check_api_consistency.py`).

- Base URLs: `https://api.kilima.poker/api/v1` (Real Money), `https://api.play.kilima.poker/api/v1` (Play Money). Operator skins use their own domain mapped to the same ingress with a tenant binding.
- Gameplay and seating are **not** REST operations (KP-ENG-01 D4); REST is read-only for tables and hands.

# 2. Conventions

## 2.1 Authentication and roles

- `Authorization: Bearer <accessToken>` (RS256 JWT, KP-ENG-02). The tenant (operator) is taken from the token; it is never a request parameter for player endpoints.
- Roles in this document: `public` (no token), `user` (any authenticated account), `player`, `support`, `risk_analyst`, `integrity_analyst`, `game_ops`, `finance`, `compliance_officer`, `operator_admin`, `admin`. `self` means the caller must own the resource. `step-up` means the token must carry a fresh verification (KP-ENG-02 §4.3).

## 2.2 Requests and responses

- JSON, UTF-8. Timestamps ISO-8601 UTC. IDs are prefixed strings (`acc_`, `t_`, `h_`, `trn_`, `pay_`, `wd_`, `tx_`).
- **Money** is always `{ "amount": 1050, "currency": "USD" }` in integer minor units (= 10.50 USD).
- **Pagination:** cursor-based `?limit=20&cursor=…` → `{ "items": [...], "nextCursor": "…" | null }`; max limit 100.
- **Idempotency:** every POST that moves money or creates a resource requires `Idempotency-Key: <uuid>`. A repeated key with the same body returns the original response for 24 h; with a different body → `409 IDEMPOTENCY_MISMATCH`.
- **Localisation:** `Accept-Language` (`en`, `fr`, `pt`, `sw`) for messages; amounts are never localised in the payload.
- **Request id:** every response carries `X-Request-Id`.
- **Rate limits:** `RateLimit-*` headers (draft 7); `429` with `Retry-After`.

## 2.3 Error format

```
HTTP/1.1 403 Forbidden
{ "error": { "code": "KYC_REQUIRED", "message": "Verify your identity to withdraw",
             "details": { "kycStatus": "pending" }, "requestId": "req_01J9…" } }
```

@widths 0.5,2.2,2.3
| HTTP | Typical codes | Meaning |
|---|---|---|
| 400 | `VALIDATION_FAILED`, `INVALID_*` | Bad input |
| 401 | `UNAUTHORIZED`, `TOKEN_EXPIRED` | Missing or invalid authentication |
| 402 | `INSUFFICIENT_FUNDS` | Not enough available balance |
| 403 | `FORBIDDEN`, `STEP_UP_REQUIRED`, `KYC_REQUIRED`, `JURISDICTION_BLOCKED`, `SELF_EXCLUDED`, `LIMIT_REACHED`, `ACCOUNT_SUSPENDED` | Not allowed |
| 404 | `NOT_FOUND` | Missing, or hidden from this caller |
| 409 | `CONFLICT`, `IDEMPOTENCY_MISMATCH`, `ALREADY_REGISTERED` | State conflict |
| 422 | `BUSINESS_RULE` | Valid input that breaks a rule (e.g. late registration closed) |
| 423 | `ACCOUNT_LOCKED`, `FUNDS_LOCKED` | Temporary lock |
| 429 | `RATE_LIMITED` | Too many requests |
| 5xx | `INTERNAL`, `UNAVAILABLE`, `PROVIDER_UNAVAILABLE` | Server or provider failure; idempotent calls are safe to retry |

## 2.4 Mode availability

Endpoints marked **[Real]** return 404 in Play Money; **[Play]** return 404 in Real Money.

# 3. Auth — /auth

Owned by `identity`. Full list and flows: KP-ENG-02 §9. Summary: registration (`/auth/register/start|verify|complete`), login and step-up (`/auth/login`, `/auth/otp/send`, `/auth/otp/verify`, `/auth/step-up`), passkeys and TOTP, refresh, logout, sessions, password flows, B2B launch (`/auth/launch`) and JWKS.

# 4. Players — /players

Owned by `player`.

@widths 0.6,2.2,0.9,2.3
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/players/me` | user | Own profile: screen name, avatar, country, preferences, verification flags, rewards tier |
| PATCH | `/players/me` | user | Update preferences (language, four-colour deck, sounds, table theme, auto-actions, data-saver) |
| PUT | `/players/me/avatar` | user | Choose a stock avatar or upload (max 512 KB; moderated; re-encoded) |
| GET | `/players/{id}` | user | Public profile: screen name, avatar, country flag, achievements |
| GET | `/players/me/stats` | self | Own statistics by game and period (hands, VPIP, PFR, 3-bet, WTSD, W$SD, bb/100, net result, rake paid) |
| GET | `/players/me/sessions` | self | Session history (cash and tournaments) with results |
| GET | `/players/me/notes` | self | Notes and colour tags on other players |
| PUT | `/players/me/notes/{playerId}` | self | Create or update a note `{ text, colour }` (max 1,000 chars) |
| GET | `/players/me/blocklist` | self | Players blocked from chat |
| PUT | `/players/me/blocklist/{playerId}` | self | Block or unblock chat |

**Shared statistics policy:** Kilima provides a built-in HUD with a limited set of opponent statistics to **every** player equally (KP-PRD-02 §6); third-party real-time HUDs and solvers are prohibited (KP-LEG-07).

# 5. Lobby — /lobby

Read-only; live updates come over the real-time protocol.

@widths 0.6,2.2,0.9,2.3
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/lobby/pools` | user | Pools available to the caller (jurisdiction and operator filtered) |
| GET | `/lobby/pools/{poolId}/cash` | user | Cash tables and templates (stakes, seats, averages) |
| GET | `/lobby/pools/{poolId}/fastfold` | user | Fast-fold pools with player counts |
| GET | `/lobby/pools/{poolId}/sng` | user | Sit & Go and Spin queues |
| GET | `/lobby/pools/{poolId}/tournaments?status=&from=&to=` | user | Tournament schedule |
| GET | `/lobby/search?q=` | user | Find a table or tournament by name or id |

# 6. Tables and Hands — /tables, /hands

@widths 0.6,2.2,1.1,2.1
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/tables/{tableId}` | user | Table configuration and public state summary |
| GET | `/hands?from=&to=&tableId=&tournamentId=` | self | Own hand history list (paginated) |
| GET | `/hands/{handId}` | participant, integrity_analyst | Hand record. Participants see only cards that were shown plus their own; analysts see all |
| GET | `/hands/{handId}/replay` | participant, integrity_analyst | Replay data ordered for the replayer |
| GET | `/hands/{handId}/verify` | participant | Deck, salt and commitment for fairness verification |
| POST | `/hands/export` | self | Export own hand histories (text format) for a date range; async job → download link |

A hand in progress returns 404. Tournament hands of other players are visible only to analysts.

# 7. Wallet — /wallet

Owned by `wallet`. Read-only for players; money moves through the cashier, tables and tournaments.

@widths 0.6,2.2,0.9,2.3
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/wallet/balances` | player | `[{ currency, cash, bonus, locked, pendingWithdrawal, onTables, inTournaments, tickets }]` |
| GET | `/wallet/transactions?type=&from=&to=&currency=` | player | Own statement (paginated), including hand settlements aggregated per session |
| GET | `/wallet/transactions/{txId}` | self | One transaction with its entries (player's own entries only) |
| GET | `/wallet/tickets` | player | Tournament tickets |
| POST | `/wallet/play-topup` [Play] | player | Free play-chip top-up (once per 4 h when the balance is below the threshold) |

# 8. Tournaments — /tournaments

@widths 0.6,2.4,0.9,2.1
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/tournaments/{id}` | user | Details: structure, prize pool, guarantee, entrants, payouts, status |
| GET | `/tournaments/{id}/standings?cursor=` | user | Live standings (chips, rank) |
| GET | `/tournaments/{id}/payouts` | user | Payout table for the current field size |
| GET | `/tournaments/{id}/tables` | user | Tables with player counts (observers can open delayed streams) |
| POST | `/tournaments/{id}/registrations` | player | Register `{ payment: "cash" \| "ticket" }` — `Idempotency-Key` required; also used for re-entry |
| DELETE | `/tournaments/{id}/registrations/me` | player | Unregister before the start; entry and fee refunded |
| GET | `/tournaments/me` | player | Own registrations and active tournaments |
| POST | `/sng/{queueId}/registrations` | player | Register for a Sit & Go or Spin queue — `Idempotency-Key` required |
| DELETE | `/sng/{queueId}/registrations/me` | player | Leave the queue before start |

Staff management (`game_ops`): section 14.

# 9. Cashier — /cashier [Real]

Owned by `cashier`. See KP-FIN-02 for provider behaviour.

@widths 0.6,2.4,1.1,1.9
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/cashier/methods?direction=deposit\|withdrawal` | player | Methods available for the player's jurisdiction and currency, with limits and fees |
| POST | `/cashier/deposits` | player | Start a deposit `{ methodId, amount, currency, msisdn? }` → payment request (STK push or redirect) |
| GET | `/cashier/deposits/{paymentId}` | self | Deposit status |
| GET | `/cashier/instruments` | player | Saved payout instruments (masked), with ownership-verification status |
| POST | `/cashier/instruments` | player + step-up | Add a payout instrument (mobile-money number, bank account); ownership check is started |
| DELETE | `/cashier/instruments/{id}` | player + step-up | Remove an instrument |
| POST | `/cashier/withdrawals` | player + step-up | Request `{ instrumentId, amount }` → `withdraw_hold` |
| GET | `/cashier/withdrawals` | player | Own withdrawals and statuses |
| POST | `/cashier/withdrawals/{id}/cancel` | self | Cancel while pending review |
| GET | `/cashier/fx-quote?from=&to=&amount=` | player | Conversion quote (rate, spread, expiry 60 s) |
| POST | `/cashier/webhooks/{provider}` | provider signature | Provider callbacks (signature or mutual-TLS verified; processed idempotently) |

Deposit example (M-Pesa STK push):

```
POST /api/v1/cashier/deposits          Idempotency-Key: 6c1e…
{ "methodId": "mpesa_ke", "amount": { "amount": 250000, "currency": "KES" }, "msisdn": "+2547XXXXXXXX", "creditCurrency": "USD" }
→ 202 { "paymentId": "pay_01J9…", "status": "awaiting_customer",
        "instructions": "Enter your M-Pesa PIN on your phone", "expiresAt": "…",
        "fxQuote": { "rate": "0.00763", "credit": { "amount": 1908, "currency": "USD" } } }
→ 403 KYC_REQUIRED | 403 JURISDICTION_BLOCKED | 403 SELF_EXCLUDED | 422 LIMIT_REACHED | 503 PROVIDER_UNAVAILABLE
```

Funds are credited only after the provider confirms; the client listens for `wallet:balance`.

# 10. Compliance — /compliance

Owned by `compliance`.

@widths 0.6,2.4,0.9,2.1
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/compliance/status` | player | `{ kycStatus, jurisdiction, ageVerified, requiredSteps: [...] }` |
| POST | `/compliance/kyc/session` [Real] | player | Start a KYC provider session → `{ sdkToken \| url }` |
| POST | `/compliance/kyc/webhooks/{provider}` | provider signature | KYC results |
| POST | `/compliance/geolocation` [Real] | player | Submit a signed device location proof (mobile SDK) when the policy requires it |
| GET | `/compliance/limits` | player | Deposit, loss, wager and session-time limits; cooling-off and self-exclusion state |
| PUT | `/compliance/limits` | player (+ step-up to raise) | Set limits. Decreases apply immediately; increases after 24 h (or the jurisdiction's period) |
| POST | `/compliance/cool-off` | player | `{ period: "24h" \| "7d" \| "30d" }` — cannot be reversed early |
| POST | `/compliance/self-exclusion` | player | `{ period: "6m" \| "1y" \| "5y" \| "permanent" }` — cannot be reversed early; also blocks marketing |
| PUT | `/compliance/reality-check` | player | Reality-check interval (default 60 min) |
| GET | `/compliance/activity-statement?from=&to=` | player | Deposits, withdrawals, net result, time played |

# 11. Rewards and Clubs

@widths 0.6,2.4,0.9,2.1
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/rewards/me` | player | Loyalty tier ("Summit Rewards"), points, rakeback rate, next payout |
| GET | `/rewards/missions` | player | Active missions and progress |
| POST | `/rewards/missions/{id}/claim` | player | Claim a completed mission reward — `Idempotency-Key` required |
| GET | `/promotions` | player | Active promotions for the player's jurisdiction |
| POST | `/promotions/{code}/redeem` | player | Redeem a promo code (subject to terms) |
| GET | `/leaderboards/{id}` | user | Leaderboard standings |
| GET | `/clubs/me` | player | Clubs the player belongs to |
| POST | `/clubs` | club_owner | Create a club (Play Money freely; Real Money where permitted) |
| POST | `/clubs/{id}/members` | club_owner | Invite `{ screenName }` or generate an invite code |
| POST | `/clubs/join` | player | Join with an invite code |

# 12. Integrity — /integrity

@widths 0.6,2.4,1.1,1.9
| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/integrity/reports` | player | Report `{ reportedPlayerId, handId?, category: "collusion" \| "bot" \| "rta" \| "chip_dumping" \| "abuse" \| "other", text }` (10 per day) |
| GET | `/integrity/cases?status=&severity=&type=` | integrity_analyst | Case queue |
| GET | `/integrity/cases/{id}` | integrity_analyst | Case with evidence, linked accounts, hands |
| POST | `/integrity/cases/{id}/decision` | integrity_analyst (four-eyes for confiscation) | `{ decision: "dismissed" \| "confirmed", actions: [...], note }` |
| GET | `/integrity/accounts/{id}/graph` | integrity_analyst | Linked accounts (devices, instruments, IPs, KYC, play graph) |
| POST | `/integrity/spot-checks` | integrity_analyst | Create a manual review of a player or table |

# 13. Notifications — /notifications

@widths 0.6,2.4,0.9,2.1
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/notifications` | user | In-app inbox |
| POST | `/notifications/{id}/read` | self | Mark read |
| PUT | `/notifications/preferences` | user | Channels and topics (marketing consent separate) |
| PUT | `/notifications/push-token` | user | Register FCM/APNs token for the device |

# 14. Back-office — /admin

All staff endpoints require staff SSO tokens, a reason on every change, and write to the audit log. Four-eyes approval is marked (4E). `support+` means `support` and every staff role with a superset of its permissions.

@widths 0.6,2.5,1.2,1.7
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/admin/accounts?q=&status=` | support+ | Search accounts |
| GET | `/admin/accounts/{id}` | support+ | 360° view: identity, KYC, wallet, limits, sessions, cases, notes |
| POST | `/admin/accounts/{id}/status` | support (restrict), compliance_officer, admin | `{ status, reason, until? }` |
| POST | `/admin/accounts/{id}/kick` | support+ | Remove from all tables after the current hand |
| POST | `/admin/wallet/adjustments` | finance (4E above threshold) | Manual adjustment `{ accountId, amount, reason, ticket }` |
| POST | `/admin/wallet/locks` | risk_analyst, integrity_analyst | Lock or unlock funds |
| GET | `/admin/withdrawals?status=review` | risk_analyst | Withdrawal review queue |
| POST | `/admin/withdrawals/{id}/decision` | risk_analyst (4E above threshold) | Approve or reject |
| GET/POST | `/admin/pools`, `/admin/table-templates` | game_ops | Pools and table templates |
| GET/POST/PATCH | `/admin/tournaments` | game_ops | Create and edit tournaments and schedules |
| POST | `/admin/tournaments/{id}/pause` · `/resume` · `/cancel` | game_ops (cancel 4E) | Tournament director actions |
| GET/PUT | `/admin/rake-schedules` | finance (4E) | Rake schedules |
| GET/PUT | `/admin/jurisdictions/{code}` | compliance_officer (4E) | Jurisdiction policy |
| GET/PUT | `/admin/spin-paytables` | finance + compliance_officer (4E) | Spin paytables (certified versions only) |
| POST | `/admin/promotions` | admin (promotions permission) | Promotions and bonus campaigns |
| POST | `/admin/announcements` | admin | Announcements (also pushed in real time) |
| GET | `/admin/reports/{report}` | finance, compliance_officer | Financial and regulatory reports (KP-FIN-03) |
| GET | `/admin/audit?actor=&target=&action=&from=&to=` | admin, compliance_officer | Audit log search; signed export |

# 15. Operator API — /operator/v1

Server-to-server API for B2B operators (mTLS + HMAC-signed requests, per-operator keys). Summary; full definition in KP-ENG-14:

@widths 0.6,2.5,2.9
| Method | Path | Purpose |
|---|---|---|
| POST | `/operator/v1/sessions` | Create a player launch session (token exchange) |
| POST | `/operator/v1/players/{operatorPlayerId}/status` | Push KYC, limits, self-exclusion and account status changes |
| GET | `/operator/v1/players/{operatorPlayerId}/balance` | Poker balance (transfer-wallet mode) |
| POST | `/operator/v1/transfers` | Transfer in or out (transfer-wallet mode; idempotent) |
| GET | `/operator/v1/reports/{report}` | Rake, GGR, player activity, settlement statements |

Seamless-wallet operators implement Kilima's callback contract (`debit`, `credit`, `rollback`, `balance`), described in KP-ENG-14.

# 16. Health

@widths 0.6,2.2,0.9,2.3
| Method | Path | Role | Purpose |
|---|---|---|---|
| GET | `/healthz` | public | Liveness |
| GET | `/readyz` | public | Readiness (dependencies) |
| GET | `/version` | public | Build version, commit, mode, protocol version |
| GET | `/status` | public | Public status summary (maintenance, degraded features) |
