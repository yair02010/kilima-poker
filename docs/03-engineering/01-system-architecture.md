---
id: KP-ENG-01
title: System Architecture
subtitle: Platform design, key decisions, services and data flows
version: 1.0
owner: CTO / Chief Architect
status: In review
related: KP-ENG-02 to KP-ENG-16 · KP-ENG-12 Architecture Decision Log · KP-LEG-01 Regulatory Assessment · KP-FIN-01 Treasury
banner: **Source of truth.** Section 3 (Key Decisions) is binding for every document in the dossier. When another document disagrees with section 3 or with an accepted ADR, this document wins and the other document is corrected in the same pull request.
---

# 1. Executive Summary

Kilima Poker is a real-time, mobile-first online poker platform built for African markets. It offers cash games, fast-fold, All-in or Fold, Sit & Go, Spins and multi-table tournaments in No-Limit Hold'em, Pot-Limit Omaha (4, 5 and 6 cards) and Short Deck, with a full player toolset, a double-entry wallet, mobile-money payments, a multi-layer game-integrity system and a certified random number generator.

The platform is designed to run in two business models from one code base:

- **B2C** — Kilima operates its own brand where it holds a licence.
- **B2B network** — licensed operators (typically sportsbooks) plug Kilima Poker into their product as a "skin" and share player liquidity with the network, with ring-fencing per jurisdiction.

Bridge (from the Bridge Casino dossier) is planned as a second game family after the poker launch. Every engine, protocol and data structure in this document is game-agnostic at its boundaries so that Bridge can be added as a new engine plug-in without re-architecting (section 12).

## Operating modes

@widths 1.2,2,2
| | Play Money | Real Money |
|---|---|---|
| Currency | `KPC` play chips, no monetary value | Licensed currencies per pool (USD pool at launch; local-currency pools where a licence requires it) |
| Deposits | Free daily top-up | Mobile money (M-Pesa, MTN MoMo, Airtel Money), cards and bank transfer through licensed payment providers |
| Withdrawals | Disabled | Enabled after KYC; paid only to instruments in the player's verified name |
| Player-to-player transfers | Disabled | Disabled (anti-collusion, AML) |
| Identity checks | Phone OTP | Phone OTP + KYC (identity, age 18+ or local minimum), sanctions/PEP screening, geolocation |
| Jurisdictions | Any country not blocked by policy | Only jurisdictions enabled in the Jurisdiction Policy Engine after licensing (default deny) |
| Deployment | Separate deployment, data stores and secrets | Separate deployment, data stores and secrets |
| Purpose | Acquisition, learning, QA, marketing | Licensed real-money play |

!> **Compliance gate.** Real-money online poker is prohibited or unregulated in several African countries (for example, South Africa prohibits online poker under the National Gambling Act; several markets license online gambling but have no specific poker framework). Real-money play is enabled per jurisdiction only after counsel confirms the legal basis and the licence, KYC/AML, responsible-gaming, tax and reporting obligations are met (KP-LEG-01). The architecture enforces this with a default-deny Jurisdiction Policy Engine; it does not replace legal advice. Kilima does not design features to bypass any country's law.

# 2. Quality Goals

@widths 0.4,1.4,3.2
| # | Goal | What it means |
|---|---|---|
| Q1 | Integrity | Every hand is dealt by a certified RNG, every action is validated by the server, and every chip movement is a balanced ledger posting that can be replayed and audited years later |
| Q2 | Mobile-first performance | Playable on 2 GB Android phones over 3G/4G; small payloads; fast reconnect without losing the table |
| Q3 | Availability | 99.95 % monthly for play and wallet at GA; a failed server never loses money or a completed hand |
| Q4 | Security | Real money and identity data protected to OWASP ASVS L2 (L3 for wallet, cashier and auth), ISO/IEC 27001-aligned ISMS |
| Q5 | Compliance by configuration | Jurisdictions, limits, taxes, liquidity pools and game availability are policy data, not code |
| Q6 | Scalability | From 500 to 50,000 concurrent players by adding instances, without a redesign |
| Q7 | Extensibility | New game families (Bridge) and new operators are plug-ins |

# 3. Key Decisions

@widths 0.45,2.8,1.75
| # | Decision | Rationale |
|---|---|---|
| D1 | **Mobile-first clients**: Android app (React Native) first, responsive web app (PWA), iOS after licensing allows; one shared TypeScript client core | Most African players are on Android phones with variable networks |
| D2 | **Phone-first identity**: registration with phone number + OTP (SMS or WhatsApp), password, device binding; step-up verification (OTP, TOTP or passkey) for new devices and every money action | Mobile money is tied to the phone number; email is not universal |
| D3 | Access tokens are **RS256 JWTs (10 min)** issued by the Identity Service and verified by all services through **JWKS**; refresh tokens are opaque, hashed, rotated on every use with reuse detection | Services never hold signing keys; revocable sessions |
| D4 | REST API under **`/api/v1`**; all gameplay and seating actions only over the **real-time protocol** (Socket.IO v4, WebSocket only, MessagePack encoding) in namespace `/play`. REST is read-only for game data | One authoritative write path for game state |
| D5 | **Server authority**: game engines are pure, deterministic libraries (`(state, action) → (state, events)`) executed only on the server; the client receives legal actions but never decides them | Prevents client-side cheating; enables replay |
| D6 | **Certified RNG service**: an isolated service with a NIST SP 800-90A DRBG seeded from cloud HSM/KMS entropy; one full shuffle per hand; a deck commitment hash published at the start of each hand and revealed afterwards | Certification by an accredited lab; provable fairness |
| D7 | **Money is integer minor units in a double-entry, insert-only ledger in PostgreSQL**. Every hand that moves chips posts one balanced `hand_settlement` transaction; balances are derived and cached, never edited | Auditability, no floating point, no lost updates |
| D8 | **Chips on the table are real ledger balances**: buy-in moves funds from `available` to a per-table account; each completed hand settles between table accounts; leaving the table returns the stack | The ledger always shows exactly what is on every table |
| D9 | **Play Money and Real Money are separate deployments** with separate data stores, keys and token audiences (`kilima:play`, `kilima:real`), selected by `APP_MODE` | Play chips can never become money |
| D10 | **Jurisdiction Policy Engine (default deny)**: each account has a jurisdiction (KYC + geolocation); each table and tournament belongs to a liquidity pool; a player can only see and join pools allowed for their jurisdiction and operator | Ring-fenced liquidity and licence compliance |
| D11 | **Multi-tenant by operator**: every account belongs to one operator (Kilima B2C is operator 1). Operators use a transfer wallet or a seamless-wallet adapter; liquidity is shared inside a pool across operators | B2B network model |
| D12 | **Data stores**: PostgreSQL 16 (system of record; separate `core` and `ledger` clusters), Redis 7 Cluster (live state, queues, rate limits, sessions, fan-out), Kafka (durable domain events), ClickHouse (hand histories and analytics), object storage with WORM retention (archives) | Right store per workload; ledger isolated |
| D13 | **Split real-time tier**: stateless `gateway` nodes terminate client connections; `table-server` nodes host table actors sharded by table id; they communicate through Redis pub/sub and streams | Connections scale independently of game logic |
| D14 | **Game integrity in depth**: prevention (seating rules, device attestation), real-time risk scoring, post-hand detectors, machine-learning models, a human review team and enforcement with fund protection | Bots, RTA and collusion are the main threats to a poker economy |
| D15 | **Kubernetes on AWS** (Cape Town `af-south-1` primary region, EU region for disaster recovery), infrastructure as code (Terraform), GitOps (Argo CD); edge WebSocket termination through a CDN with African points of presence | Latency to African players; one deployment model from Beta onwards |
| D16 | **All ratings, stats, rake, rakeback and prize calculations are server-side**. No endpoint accepts a balance, a result or a statistic from a client | Prevents manipulation |
| D17 | **Game families are plug-ins** behind a common engine interface, table protocol envelope and hand-record format (poker first, Bridge later) | Bridge integration without re-architecture |

The reasoning, alternatives and consequences of each decision are recorded as ADRs (KP-ENG-12).

# 4. Context

@widths 1.5,3.5
| Actor / system | Interaction |
|---|---|
| Player | Android app, web app; plays, deposits, withdraws, contacts support |
| Operator (B2B) | Integrates its players and wallet through the Operator API; uses the operator back-office |
| Kilima staff | Back-office: support, risk and integrity analysts, game operations (tournament directors), finance, compliance, administrators |
| Payment providers | Mobile-money APIs (for example M-Pesa, MTN MoMo, Airtel Money), card and bank aggregators (for example Flutterwave, Paystack); deposits, payouts, webhooks, settlement files |
| KYC / AML providers | Identity and document verification, liveness, sanctions and PEP screening |
| Geolocation provider | IP intelligence, VPN/proxy detection; device location on mobile with consent |
| Messaging providers | SMS and WhatsApp OTP, push notifications (FCM/APNs), email |
| Regulators and tax authorities | Reporting feeds, data exports, audits; real-time integrations where a licence requires them |
| Test laboratory | RNG and game certification (for example GLI, BMM Testlabs, iTech Labs) |

# 5. High-Level Architecture

@diagram arch

## Deployable services

@widths 1.25,1.15,2.3,1.3
| Service | Tech | Responsibility | Owns data |
|---|---|---|---|
| `gateway` | Node.js, Socket.IO | Terminates client WebSocket connections, authenticates the handshake, rate-limits, routes table and lobby traffic, fans out events | — (stateless) |
| `table-server` | Node.js, engine plug-ins | Table actors: seating, blinds, dealing, betting, timers, showdown, hand persistence; fast-fold pools | `hands` (via events), live state in Redis |
| `lobby` | Node.js | Table catalogue, waitlists, seat reservation, Sit & Go and Spin queues, table creation by demand | `lobby.*` |
| `tournament` | Node.js | Tournament lifecycle: registration, late registration, re-entry, clocks, table balancing, breaks, hand-for-hand, bounties, payouts, satellites | `tournament.*` |
| `rng` | Node.js + native crypto | Certified DRBG, shuffles, deck commitments, Spin multiplier draws | RNG audit log |
| `identity` | Node.js | Registration, OTP, login, devices, sessions, tokens, RBAC, account status | `identity.*` |
| `player` | Node.js | Profiles, avatars, preferences, notes, statistics, player tools, clubs, rewards, missions | `player.*` |
| `wallet` | Node.js | Ledger, balances, holds, table accounts, hand settlement, fees, prizes, rake, rakeback, FX | `ledger.*` (separate cluster) |
| `cashier` | Node.js | Deposits and withdrawals, payment-provider adapters, payout pipeline, instrument ownership checks | `cashier.*` (ledger cluster) |
| `compliance` | Node.js | KYC, AML monitoring, sanctions/PEP, responsible-gaming limits, self-exclusion, Jurisdiction Policy Engine, geolocation decisions | `compliance.*` |
| `integrity` | Node.js + Python ML | Real-time risk scoring, detectors, device and account graph, cases, enforcement | `integrity.*`, ClickHouse features |
| `operator-gateway` | Node.js | Operator API, seamless-wallet adapters, operator back-office API, network settlement | `operator.*` |
| `backoffice` | Node.js + React | Staff console API: support, CRM, promotions, game operations, reports, audit | `backoffice.*` |
| `notify` | Node.js | Push, SMS, WhatsApp, email, in-app inbox | `notify.*` |
| `data-platform` | Kafka Connect, ClickHouse, Airflow, Python | Hand-history store, analytics, finance and regulatory reports, ML pipelines | ClickHouse, object storage |

Service-to-service calls use internal HTTP with mTLS (service mesh) and short-lived service tokens carrying scopes (for example `wallet:post`). Asynchronous integration uses Kafka topics (section 8). The phased rollout of services (fewer deployables at Alpha) is described in ADR-0002.

## Ownership rule

Each table or collection has exactly one owning service. Other services read it through the owner's API or its events and never write it. The ledger database accepts writes only from `wallet` and `cashier`, each with its own database role; no other service has credentials for it.

# 6. Game Domain Model

@widths 1.2,3.8
| Term | Meaning |
|---|---|
| Game family | `poker` (launch), `bridge` (later). Selects the engine plug-in |
| Variant | `nlhe`, `plo4`, `plo5`, `plo6`, `shortdeck` |
| Betting structure | `NL` (no-limit), `PL` (pot-limit); `FL` reserved |
| Format | `cash`, `fastfold`, `aof`, `sng`, `spin`, `mtt`, `private` (club and home games) |
| Pool | A ring-fenced liquidity pool: currency + allowed jurisdictions + allowed operators |
| Table | A live game room with 2–9 seats. Cash tables persist while in demand; tournament tables are created and broken by the tournament director |
| Hand | One deal from shuffle to pot award. The unit of settlement, history, replay and integrity analysis |
| Session | A player's continuous stay at one cash table, from buy-in to leaving (for rathole rules and statistics) |
| Tournament | A competition with a prize pool (freeze-out, re-entry, rebuy/add-on, bounty, satellite, Spin) |
| Stake | Blind level of a cash game, e.g. `0.05/0.10` in the pool currency |

Notation used in all documents: cards are rank `A K Q J T 9 8 7 6 5 4 3 2` plus suit `s h d c` (`Ah` = ace of hearts, `Td` = ten of diamonds). Seats are numbered 1–9 clockwise. Amounts are integers in minor units of the pool currency (1 USD = 100 units).

# 7. Real-Time Communication

- Clients connect to `wss://play.<brand>/play` (namespace `/play`) with the access token in the handshake (`auth.token`), never in event payloads.
- Every table event carries a monotonically increasing `seq` per table; clients detect gaps and send `table:resync`.
- Client actions use acknowledgements: `{ ok: true, data }` or `{ ok: false, error: { code, message } }`, and an idempotent `clientActionId`.
- Private data (hole cards) is sent only to the owning player's socket. Observers receive public events; in tournaments and on request, observer streams are delayed.
- Encoding: MessagePack; a typical action event is under 200 bytes. Full contract: KP-ENG-04 and `specs/asyncapi.yaml`.

# 8. Events and Data Flows

## Domain events (Kafka)

@widths 1.6,1.2,2.2
| Topic | Producer | Main consumers |
|---|---|---|
| `hand.completed` | table-server | wallet (settlement confirmation), player (stats), integrity, data-platform |
| `table.session` | table-server | wallet (reconciliation), integrity, compliance (session limits) |
| `tournament.lifecycle` | tournament | wallet (fees, prizes), notify, player |
| `wallet.tx.posted` | wallet | cashier, compliance (AML), player (rewards), data-platform |
| `payment.status` | cashier | wallet, compliance, notify |
| `identity.account` | identity | all services (status changes, bans, logout) |
| `compliance.decision` | compliance | identity, lobby, cashier, gateway (blocks) |
| `integrity.action` | integrity | identity, wallet (holds), gateway (kick), backoffice |
| `rng.audit` | rng | data-platform (WORM archive) |

Events use a common envelope (`eventId`, `type`, `version`, `occurredAt`, `tenantId`, `mode`, `payload`), are keyed by the aggregate id for ordering, and are consumed idempotently (outbox pattern on the producer side).

## Registration and first deposit

1. Player enters phone number → OTP by SMS or WhatsApp → sets password and screen name → account `active` (Play Money is available immediately).
2. For Real Money the player completes KYC in the app (document + liveness through the provider); `compliance` screens sanctions/PEP and decides the jurisdiction.
3. Deposit: the player chooses mobile money; `cashier` starts an STK push / payment request; the provider callback (signature verified) confirms; `wallet` posts `deposit`.
4. The Jurisdiction Policy Engine now shows the pools and games the player may join.

## Playing a cash hand

1. Player opens a table from the lobby (`lobby:open_table`) and sits (`table:sit` with a buy-in). `wallet` posts `table_buyin` (available → table account).
2. At hand start the table actor requests a shuffled deck and commitment from `rng`, posts blinds and antes, and deals. Hole cards go only to their owners.
3. Each action is validated by the engine; events are published with `seq` to the table room through the gateway.
4. At showdown the engine builds pots, computes rake and awards pots. The table actor persists the hand record and calls `wallet` to post one `hand_settlement` transaction (idempotency key `hand:{handId}`).
5. `hand.completed` is published; integrity, statistics and analytics consume it.
6. When the player stands up, `wallet` posts `table_cashout` (table account → available).

## Tournament

Registration posts `tournament_entry` (available → tournament pool + fee to rake). The tournament service seats players, runs the level clock, balances and breaks tables, and at the end posts `tournament_prize` from the pool. Chips inside a tournament are tournament chips, not money; only entries, bounties and prizes are ledger postings.

## Withdrawal

Request → `withdraw_hold` → automated checks (KYC, name match with the payout instrument, AML rules, open integrity cases, bonus wagering) → manual review when required → provider payout → provider confirmation → `withdraw` posting. Failures post `withdraw_release`.

# 9. Security and Integrity (summary)

- TLS 1.3 at the edge, mTLS inside the cluster, HSTS, strict CORS, WAF and DDoS protection at the CDN.
- RBAC and ABAC: roles `player`, `support`, `risk_analyst`, `integrity_analyst`, `game_ops`, `finance`, `compliance_officer`, `operator_admin`, `admin`, `super_admin`; sensitive actions require four-eyes approval; every staff action goes to the append-only audit log.
- Secrets in AWS Secrets Manager and KMS; signing keys and RNG seeding in KMS/CloudHSM.
- Game integrity: KP-ENG-09. RNG: KP-ENG-13. Security architecture and threat model: KP-SEC-01 and KP-SEC-03.

# 10. Scalability and Deployment

@widths 1,1.6,2.4
| Stage | Platform | Notes |
|---|---|---|
| Alpha (internal) | One EKS cluster in `af-south-1`; single-AZ data stores | Play Money only; reduced set of deployables (ADR-0002) |
| Beta (public Play Money) | EKS, multi-AZ; managed PostgreSQL (Aurora), ElastiCache Redis Cluster, MSK Kafka, ClickHouse Cloud or self-managed | Full service set; load-tested to NFR Beta targets |
| GA (Real Money) | Multi-AZ primary region + warm standby in an EU region; per-jurisdiction regulatory nodes where required | 99.95 % target; tested DR; certified RNG and game |

- Table actors are sharded by `tableId` with consistent hashing across `table-server` pods; a pod drains gracefully before shutdown (no new hands, finish the current hand, hand over the table).
- Gateways scale on connection count; the CDN terminates TLS near the player and proxies WebSockets to the region.
- CI/CD: GitHub Actions (build, test, scan, sign images) → Argo CD (GitOps) → staging → automated game-integrity and payment smoke tests → approval → Production. Details: KP-OPS-01.
- Environments: `dev`, `staging-play`, `play`, `staging-real`, `real`, plus a certification environment (`cert`) frozen for the test lab.
- Observability: OpenTelemetry traces, Prometheus metrics, structured logs (Loki), with alerts on ledger imbalance (must always be 0), hand-settlement lag, RNG health, action latency, disconnect storms, payment-provider error rates and fraud signals. Details: KP-OPS-02.

# 11. Cross-Cutting Invariants

These are tested continuously and alerted on:

1. The sum of all ledger entries per currency is zero.
2. For every table, the sum of seated stacks equals the table accounts in the ledger after the last settled hand.
3. Every completed hand has exactly one `hand_settlement` transaction (or none, if no chips moved), and the pot awarded plus rake equals the chips committed.
4. No hole card is ever sent to a socket that does not belong to its owner (verified by protocol tests and a production canary that inspects outbound events).
5. Every deck used in a hand matches the commitment published at the start of that hand.
6. A player can only join tables of pools allowed by the Jurisdiction Policy Engine at the moment of joining.

# 12. Bridge Integration Path

Bridge will be added after the poker launch, reusing the platform:

- **Engine plug-in:** the Bridge rules engine (Bridge Casino BC-ENG-06, pure and deterministic) implements the common `GameEngine` interface (KP-ENG-06 §12).
- **Protocol:** Bridge events use the same `/play` envelope (`tableId`, `seq`, `gameFamily: "bridge"`), with bridge-specific event names (`auction:*`, `play:*`).
- **Ledger:** Bridge match stakes and tournament fees use the same wallet posting helpers (holds, settlements, fees, prizes).
- **Identity, cashier, compliance, integrity and back-office** are shared. Bridge-specific detectors (double-dummy accuracy) are added to the integrity service.
- The Bridge Casino dossier's decisions that differ from this platform (MongoDB, Render, email-first login) are superseded by this document when Bridge is integrated.

# 13. Open Questions

- Launch jurisdictions and licence path (KP-LEG-01): which countries first, and whether the launch is B2C, B2B, or both.
- Pool currency strategy per jurisdiction (USD pool vs local-currency pools) and FX policy (KP-FIN-01).
- Rake, rakeback and fee levels per stake and format (KP-FIN-04).
- Whether Spins (random prize multipliers) are permitted in each launch jurisdiction.
- Data-residency requirements per licence (in-country regulatory node or replication).
- iOS availability, which depends on App Store policy for licensed real-money gaming in each country.
