---
id: KP-HBK-06
title: Build Plan
subtitle: The work breakdown to build Kilima Poker — milestones, work packages, owners, dependencies and done criteria
version: 1.0
owner: Programme Director / CTO
status: Living document — updated at every quarterly planning
related: KP-PRJ-01 Project Plan · KP-PRD-03 Roadmap · KP-HBK-05 Planning · KP-OPS-06 Gates
---

# 1. How to Use

Each work package (WP) is an epic-sized unit (2–8 engineer-weeks) with an owning team, dependencies and a demoable done criterion. Teams create stories under each WP in their board. Status is tracked on the programme board; this page is the plan of record and is updated at quarterly planning.

Teams: **GAM** Game · **PLT** Platform · **PAY** Payments · **TRU** Trust · **CLI** Clients · **DAT** Data · **SRE** SRE/Security.

# 2. Milestone M1 — Foundations (months 1–2)

@widths 0.6,1.9,0.5,0.7,1.8
| WP | Work package | Team | Depends on | Done when |
|---|---|---|---|---|
| WP-01 | Monorepo, pnpm/Turborepo, lint rules (money, RNG, engine purity), CI pipeline stages 1–7 | PLT | — | A sample service passes the full pipeline and produces a signed image |
| WP-02 | AWS accounts, VPCs, EKS `dev` and `staging`, Argo CD, External Secrets | SRE | — | `dev` preview environments created per PR |
| WP-03 | Local dev stack (compose), seed tooling, `simbots` skeleton | PLT | WP-01 | New engineer runs the platform in < 1 h (KP-HBK-02) |
| WP-04 | `packages/contracts`: OpenAPI/AsyncAPI generation, validators, mocks | PLT | WP-01 | Types and mock servers generated in CI |
| WP-05 | `engine-poker` v0: cards, evaluator (Hold'em, Omaha, Short Deck), vectors harness | GAM | WP-01 | All evaluation and comparison vectors pass; frequency self-check passes |
| WP-06 | `engine-poker` betting: NL/PL legality, incomplete raises, blinds/antes, pots, rake, odd chips | GAM | WP-05 | All betting, pot and rake vectors pass; 10^6-hand property test green |
| WP-07 | `identity` v1: phone registration, OTP (mock provider), login, refresh, JWKS via KMS (localstack) | PLT | WP-04 | E2E register → login → refresh; token tests (KP-ENG-02 §12) |
| WP-08 | Observability baseline: OpenTelemetry, logging, metrics, Grafana dashboards as code | SRE | WP-02 | Traces across two services visible in staging |
| WP-09 | Design system and app shell (React Native + web), `client-core` protocol client | CLI | WP-04 | App logs in against staging and shows a lobby stub |

# 3. Milestone M2 — Game Core (months 3–4)

@widths 0.6,1.9,0.5,0.7,1.8
| WP | Work package | Team | Depends on | Done when |
|---|---|---|---|---|
| WP-10 | `rng` service (dev DRBG → HMAC_DRBG with KMS entropy), deck commitments, audit topic | GAM | WP-02 | Fisher–Yates with rejection sampling; commitment verification test on 10^5 hands |
| WP-11 | `gateway`: handshake auth, rooms, private routing, outbound hole-card filter, resync buffer | GAM | WP-07 | Socket E2E: two players, private cards never leak (fuzz test) |
| WP-12 | `table-server`: table actors, leases, timers, time bank, hand records, drain | GAM | WP-06, WP-10, WP-11 | Bots play 100k hands in staging with zero conservation errors |
| WP-13 | `wallet` Play Money: ledger schema, posting function, helpers (buy-in, settlement, cash-out) | PAY | WP-01 | Property test 10^6 postings; settlement p99 < 50 ms locally |
| WP-14 | Hand settlement integration table-server ↔ wallet; pause on wallet failure; voided hands | GAM+PAY | WP-12, WP-13 | Chaos test: kill pods during 10k hands, no money lost |
| WP-15 | `lobby`: pools, templates, table creation by demand, waitlists, seating restrictions v0 | GAM | WP-12 | Quick seat < 10 s with 200 bots |
| WP-16 | Fast-fold pools and AOF | GAM | WP-15 | Fold → next hand < 3 s p95 with 300 bots |
| WP-17 | Client table (Skia): actions, presets, animations budget, multi-table, reconnect | CLI | WP-11 | Playable on the 2 GB baseline device at 60 fps |
| WP-18 | `player` v1: profiles, preferences, stats pipeline from `hand.completed` | PLT | WP-12 | Stats visible in app after hands |
| WP-19 | Kafka (MSK) + outbox library + schema registry | SRE+PLT | WP-02 | `hand.completed` consumed by two services idempotently |

# 4. Milestone M3 — Tournaments and Alpha (months 5–6)

@widths 0.6,1.9,0.5,0.7,1.8
| WP | Work package | Team | Depends on | Done when |
|---|---|---|---|---|
| WP-20 | `tournament`: lifecycle, clock, levels, breaks, late reg, re-entry | GAM | WP-12, WP-13 | 1,000-bot MTT completes with correct payouts |
| WP-21 | Balancing, table breaking, hand-for-hand, simultaneous eliminations | GAM | WP-20 | Bubble scenarios pass (KP-QA-01 §4.1) |
| WP-22 | SNG and Spins (Play Money), paytable engine, RNG multiplier draw | GAM | WP-20, WP-10 | 10^6 simulated draws within bounds |
| WP-23 | PKO bounties, satellites, tickets | GAM+PAY | WP-20 | Ticket issued and redeemed end to end |
| WP-24 | Back-office v1: accounts, kick/restrict, tables and tournaments admin, audit log | PLT | WP-15, WP-20 | Game ops can run a scheduled tournament |
| WP-25 | Integrity MVP: links graph, seating restrictions, timing profile, co-occurrence, case tool with replays | TRU | WP-18, WP-19 | Red-team collusion pair flagged in staging |
| WP-26 | Responsible-gaming tools (time limits, reality checks, cool-off, self-exclusion) | TRU+CLI | WP-07 | Self-exclusion effective < 60 s |
| WP-27 | Localisation EN/FR/PT/SW; help centre; in-app support chat | CLI | WP-17 | Language QA passed |
| WP-28 | ClickHouse hand store, basic BI dashboards | DAT | WP-19 | Game health dashboard live |
| **M3** | **Alpha release** | All | WP-10…28 | Internal Play Money with 200 invited players |

# 5. Milestone M4 — Beta Hardening (months 7–8)

@widths 0.6,1.9,0.5,0.7,1.8
| WP | Work package | Team | Depends on | Done when |
|---|---|---|---|---|
| WP-30 | Load, soak, spike and chaos to Beta targets (KP-QA-04) | SRE+GAM | Alpha | Reports pass NFR Beta targets |
| WP-31 | Edge: CDN/WAF, DDoS, WebSocket proxying, African PoPs; RTT measurement per country | SRE | WP-11 | RTT dashboard per country |
| WP-32 | Rewards (Play), missions, leaderboards, clubs (Play) | PLT+CLI | WP-18 | Missions claimable in app |
| WP-33 | Security: pentest of external surface, threat-model review, fixes | SRE | Alpha | No open high findings |
| WP-34 | Support and game-ops runbooks rehearsed; on-call rotation | SRE | WP-08 | KP-OPS-06 G1 operations items done |
| **M4** | **Public Play Money Beta (G1)** | All | WP-30…34 | Gate G1 signed |

# 6. Milestone M5 — Real Money Build (months 7–10)

@widths 0.6,1.9,0.5,0.7,1.8
| WP | Work package | Team | Depends on | Done when |
|---|---|---|---|---|
| WP-40 | Real Money deployment (separate accounts, keys, ledger cluster, WORM archives) | SRE | WP-02 | `staging-real` and `real` environments exist |
| WP-41 | `compliance`: KYC provider SDK + webhooks, sanctions/PEP, Jurisdiction Policy Engine | TRU | WP-07 | Blocked jurisdiction cannot deposit or sit (E2E) |
| WP-42 | Geolocation (IP, device location, SIM country, VPN detection) | TRU+CLI | WP-41 | Policy decisions logged with inputs |
| WP-43 | `cashier`: state machines, M-Pesa adapter (sandbox), MTN MoMo adapter, card aggregator adapter | PAY | WP-13 | Deposits and payouts in sandboxes incl. lost callbacks |
| WP-44 | Withdrawal pipeline: holds, rules, review queue, instrument ownership, step-up | PAY+TRU | WP-43 | Auto-approved payout < 15 min in sandbox |
| WP-45 | Multi-currency, FX quotes and postings, tax rules engine | PAY | WP-13 | Finance-approved worked examples pass |
| WP-46 | Reconciliation (per hand, nightly, three-way), coverage report, finance pack | PAY+DAT | WP-43 | Injected one-unit error detected |
| WP-47 | AML monitoring rules, alerts, STR workflow | TRU | WP-41, WP-46 | MLRO walkthrough signed |
| WP-48 | Integrity for Real Money: attestation enforcement, telemetry, solver-proximity, soft-play, holds, confiscation workflow | TRU+CLI | WP-25 | Red-team bot detected within 2,000 hands |
| WP-49 | RNG certification build (HSM/KMS entropy, health tests, audit archive), statistical test suite | GAM | WP-10 | Internal pre-certification tests pass (KP-QA-05 §3) |
| WP-50 | Regulatory reporting feeds for the first jurisdiction | DAT | WP-46 | Sample files accepted by regulator test portal |
| WP-51 | Short Deck, run it twice, straddle in engine and client | GAM+CLI | WP-06 | Vectors and UX states done |

# 7. Milestone M6 — Launch Readiness (months 10–12)

@widths 0.6,1.9,0.5,0.7,1.8
| WP | Work package | Team | Depends on | Done when |
|---|---|---|---|---|
| WP-60 | Certification submission (`cert` frozen), lab findings fixed (G2) | GAM+QA | WP-49 | Certificates for deployed digests |
| WP-61 | External pentest (web, API, sockets, mobile, cloud) and fixes | SRE | M5 | All high findings closed |
| WP-62 | DR: Aurora Global DB, standby EKS, failover drill | SRE | WP-40 | Drill meets Launch RPO/RTO |
| WP-63 | Real Money pilot in staging with finance, compliance and support | All | M5 | Pilot reconciled end to end |
| WP-64 | Launch operations: 24/7 support, risk and treasury rotations | Ops | — | KP-OPS-06 G3 launch-plan items done |
| **M6** | **Real Money launch (G3)** | All | Licence | Gate G3 signed |

# 8. Milestone M7 — Network (R2)

@widths 0.6,1.9,0.5,0.7,1.8
| WP | Work package | Team | Depends on | Done when |
|---|---|---|---|---|
| WP-70 | `operator-gateway`: launch tokens, status pushes, transfer wallet | PLT+PAY | G3 | Sandbox operator certified (KP-ENG-14 §7) |
| WP-71 | Seamless wallet adapter and retries | PAY | WP-70 | Operator outage test passes |
| WP-72 | Operator back-office, RLS tenant isolation tests | PLT | WP-70 | Tenant isolation test suite green |
| WP-73 | Network settlement statements and rake attribution | PAY+DAT | WP-46 | Statement matches seeded operator records |
| WP-74 | White-label runtime themes and branded Android builds | CLI | WP-17 | Second brand shipped from CI |
| WP-75 | PLO6, second jurisdiction pools | GAM+TRU | G3 | Jurisdiction matrix complete |

# 9. Critical Path

WP-05 → WP-06 → WP-12 → WP-14 → WP-20 → Alpha → WP-30 → G1, in parallel with WP-40 → WP-41 → WP-43 → WP-46 → WP-63, and WP-49 → WP-60 → G3 (with the licence as the external dependency).
