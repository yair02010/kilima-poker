---
id: KP-QA-01
title: Test Strategy and Plan
subtitle: Test levels, tools, environments, key scenarios and entry/exit criteria
version: 1.0
owner: Head of QA
status: Draft
related: KP-QA-02 Definition of Done · KP-QA-04 Performance and Resilience · KP-QA-05 Certification Testing · KP-ENG-10 NFR
---

# 1. Principles

- **Money and fairness first:** the engine, wallet, RNG, tournaments payouts and cashier have the strictest tests (≥ 95 % coverage, property tests, differential tests).
- **Automate everything repeatable;** exploratory testing focuses on player experience, new features and risk areas.
- **Test like production:** real PostgreSQL, Redis and Kafka in containers; production-like data volumes in staging; real devices and real networks for clients.
- **Shift left and right:** contract tests before code; synthetic monitoring and canary analysis after release.

# 2. Test Levels

@widths 1.3,2.1,1.6
| Level | Scope | Tools |
|---|---|---|
| Unit | Functions, engine rules, posting helpers, policy rules | Vitest, fast-check (property tests) |
| Engine vectors | Every vector from `test_vectors.json` in the TypeScript engine | Vitest (CI job `engine-vectors`) |
| Differential | Engine evaluator vs an independent evaluator; ledger helpers vs a reference model | Custom harness, 10^6 cases |
| Integration | Service + its data stores + Kafka | Testcontainers, Supertest |
| Contract | REST and socket payloads vs OpenAPI/AsyncAPI; Avro compatibility; provider adapter contracts | Schemathesis, AsyncAPI validators, Pact for operator/provider mocks |
| Component (client) | React Native / React components | Jest, React Native Testing Library |
| End-to-end | Real flows across services with headless bots and real clients | Playwright (web), Maestro/Detox (Android), socket bots |
| Simulation | Millions of hands and thousands of tournaments played by bots with chip-conservation and ledger checks | Bot framework (`tools/simbots`) |
| Performance and resilience | KP-QA-04 | k6, custom socket load generators, chaos tooling |
| Security | SAST, SCA, DAST, pentest (KP-SEC-03 §9) | Semgrep, Trivy, ZAP, external testers |
| Certification | RNG statistics, game rules conformance, lab test scripts (KP-QA-05) | NIST STS, Dieharder, TestU01, lab scripts |
| Usability and localisation | Moderated sessions in launch markets; language QA for EN/FR/PT/SW | Device lab, local testers |

# 3. Coverage Targets

@widths 2.5,1.2,1.3
| Component | Line coverage | Additional |
|---|---|---|
| `engine-poker`, `rng`, `ledger-postings`, `wallet`, tournament payouts | ≥ 95 % | Property + differential tests mandatory |
| `identity`, `cashier`, `compliance` | ≥ 90 % | Security test cases per flow |
| Other services | ≥ 80 % | |
| Clients | ≥ 70 % logic in `client-core` | E2E for all critical flows |

# 4. Key Scenarios (must be automated)

## 4.1 Game

- Every variant and structure: blinds, straddle, antes, heads-up rules, min-raise, pot-limit max, incomplete all-in, side pots with 2–9 all-ins, split pots with odd units, run it twice, rake caps and no-flop-no-drop.
- Timeouts, time bank, sitting out, disconnect/reconnect mid-hand with resync, table pause on wallet unavailability, voided hands after table-server failure.
- Fast-fold seating fairness and blind rotation over 100,000 hands; restriction rules never violated.
- Tournaments: late registration, re-entry, rebuy/add-on, PKO bounties, balancing and table breaking, hand-for-hand bubble with simultaneous eliminations, pause/resume, cancellation settlement, satellites with ticket awards, final table deal.
- Spins: multiplier distribution over 10^6 simulated draws within statistical bounds; prize split correctness.
- Deck commitment verification for every hand in staging.

## 4.2 Money

- Every posting type with idempotent retries and concurrent execution; negative-balance prevention; per-currency balance.
- Buy-in → hands → cash-out with random crashes (chaos) never loses or duplicates money.
- Deposits and withdrawals through every provider adapter in sandbox, including lost callbacks, duplicates, late credits, reversals and payouts with unknown results.
- FX conversions and tax withholding calculations against worked examples approved by finance.
- Nightly reconciliation detects injected one-unit errors in each account type.

## 4.3 Security, compliance and access

- Permission matrix: every endpoint and socket event × every role (allowed/denied).
- Jurisdiction policy: blocked jurisdictions cannot register for Real Money, deposit, sit, or register for tournaments; policy change applies within 60 s.
- Self-exclusion and cool-off: effective within 60 s; no marketing; operator pushes honoured.
- Tenant isolation: operator back-office cannot read another tenant's data (row-level security tests).
- Hole cards never appear in room events (protocol fuzzing + outbound filter tests).

# 5. Environments and Test Data

@widths 1.3,3.7
| Environment | Use |
|---|---|
| `dev` | Per-developer and preview environments per pull request (ephemeral namespaces) |
| `staging-play`, `staging-real` | Integration, E2E, performance baselines; provider sandboxes; synthetic players |
| `cert` | Frozen certified versions for the test lab |
| `operator-sandbox` | Operator integrations (KP-ENG-14 §7) |
| `perf` | Full-scale load and chaos tests (created on demand from IaC) |

Test data is synthetic (generated players, KYC stubs, sandbox instruments). Production personal data is never copied to test environments; anonymised aggregates may be used for load models.

# 6. Entry and Exit Criteria

## 6.1 Release to Play Money (each release)

- All automated suites green; no open critical/high defects; performance smoke within 10 % of baseline; security scans clean; release notes approved.

## 6.2 Release to Real Money (each release)

- Everything in 6.1, plus: certification impact assessment done for changed certified components; payment adapter regression passed; reconciliation dry-run on staging passed; compliance sign-off for rule or policy changes; rollback plan tested; canary release with automatic rollback on SLO breach.

## 6.3 First Real Money launch (gate G3)

KP-QA-05 certification complete, KP-QA-04 GA-scale tests passed at Launch targets, pentest high findings closed, operational readiness (KP-OPS-06).

# 7. Defect Management

@widths 1,2.5,1.5
| Severity | Definition | Fix target |
|---|---|---|
| S1 | Money loss or duplication, unfairness (wrong winner, card leak), security breach, platform down | Immediately; hotfix; incident process |
| S2 | Major feature broken without workaround (e.g. tournaments cannot start) | 24 h |
| S3 | Feature broken with workaround; significant UX issue | Next release |
| S4 | Minor issue, cosmetic | Backlog |

Every S1/S2 gets a regression test and, if production was affected, a postmortem (KP-OPS-04).
