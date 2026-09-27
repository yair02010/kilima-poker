---
id: KP-SEC-01
title: Threat Model
subtitle: Assets, adversaries, trust boundaries, STRIDE analysis and abuse cases
version: 1.0
owner: Head of Security
status: Draft — reviewed every release train and before each Real Money launch
related: KP-SEC-03 Security Architecture · KP-ENG-09 Game Integrity · KP-SEC-04 Fraud · KP-ENG-08 Wallet
---

# 1. Scope and Method

Scope: all Kilima Poker services, clients, data stores, CI/CD, staff tools and third-party integrations in both modes. Method: STRIDE per trust boundary, plus abuse cases for game integrity and payments, rated by likelihood × impact (1–5 each; ≥ 15 = high). The model is updated when a new component, integration or jurisdiction is added (checklist item in the PR template for architecture changes).

# 2. Assets

@widths 1.6,2.6,0.8
| Asset | Why it matters | Impact |
|---|---|---|
| Player funds and ledger | Direct financial loss, licence loss | 5 |
| Hole cards and deck of live hands | Instant, undetectable cheating at scale | 5 |
| RNG state and seeding | Predictable deals = total loss of trust | 5 |
| Access-token signing keys (KMS) | Impersonate any player or staff member | 5 |
| Payment provider credentials and float accounts | Theft of float, fraudulent payouts | 5 |
| Player personal data and KYC results | Privacy harm, regulatory fines | 4 |
| Staff back-office access | Adjustments, unlocks, data exfiltration | 5 |
| Integrity models and thresholds | Evasion by cheaters if leaked | 3 |
| Source code, CI/CD pipeline, images | Supply-chain compromise of everything above | 5 |
| Availability of tables and tournaments | Revenue, player trust, tournament cancellations | 4 |

# 3. Adversaries

@widths 1.5,3.5
| Adversary | Capability and goal |
|---|---|
| Cheating players and rings | Bots, RTA, collusion, multi-accounting; moderate technical skill; profit from other players |
| Organised fraud | Stolen identities and mobile-money accounts, SIM swap, account takeover, bonus abuse, money laundering |
| External attackers | Credential stuffing, API abuse, DDoS extortion, exploitation of vulnerabilities |
| Malicious or careless insiders | Staff or contractors with access to hole cards, data or money tools |
| Compromised vendors | Payment, KYC, SMS, CDN or library supply chain |
| Competitors / griefers | DDoS during tournaments, scraping, reputation attacks |

# 4. Trust Boundaries

1. Player device ↔ edge (internet): untrusted client, possibly rooted, emulated or automated.
2. Edge ↔ cluster: CDN/WAF to ingress and gateway.
3. Service ↔ service inside the cluster: mTLS; not implicitly trusted (zero-trust network policies).
4. Services ↔ data stores (core, ledger, Redis, Kafka, ClickHouse).
5. Cluster ↔ third parties (payments, KYC, SMS, geolocation, regulators).
6. Staff ↔ back-office (SSO, privileged operations).
7. CI/CD ↔ production (build, sign, deploy).

# 5. STRIDE Analysis (main threats)

@widths 0.5,1.7,1.6,1.9,0.5
| # | Threat | Boundary | Controls | Risk |
|---|---|---|---|---|
| S1 | Account takeover through credential stuffing or SIM swap | 1 | Rate limits, breached-password check, device binding, step-up for money actions, SIM-swap checks, withdrawal cool-downs after changes | M |
| S2 | Forged or replayed access tokens | 1, 3 | RS256 via KMS, short TTL, pinned algorithms/audience, sid deny-list, TLS | L |
| S3 | Spoofed payment callbacks crediting fake deposits | 5 | Signature/mTLS, status re-query before credit, idempotency, amount/currency checks | L |
| S4 | Service impersonation inside the cluster | 3 | mTLS identities (mesh), network policies, scoped service tokens per posting type | L |
| T1 | Tampering with game actions or client-side game state | 1 | Server authority, schema validation, legal-action checks, idempotent action ids | L |
| T2 | Tampering with ledger rows | 4 | Insert-only DB role, posting function, hash-chained audit, nightly reconciliation, no human write access | L |
| T3 | Malicious dependency or build tampering | 7 | Lockfiles, SCA, signed images (cosign), admission verification, SLSA provenance, protected branches | M |
| R1 | Staff deny a harmful action (adjustment, unlock) | 6 | Hash-chained audit log, four-eyes, SSO identities, session recording for privileged access | L |
| I1 | Hole cards leak to other players | 1, 2 | Per-socket private events, outbound gateway filter, delayed observer rooms, protocol tests, production canary | L |
| I2 | Hole cards of live hands seen by staff | 6 | Not stored anywhere readable during the hand; integrity sees completed hands only; access logs | L |
| I3 | Personal/KYC data exfiltration | 4, 6 | Field encryption, least privilege, data masking, DLP on exports, KYC documents kept at provider | M |
| I4 | RNG state disclosure | 3, 4 | Isolated `rng` pods, no shell, no logging of outputs, DRBG backtracking resistance, frequent reseeding | L |
| D1 | DDoS during peak tournaments | 1, 2 | CDN/WAF, rate limits, autoscaling, tournament pause rules, provider DDoS protection | M |
| D2 | Resource exhaustion by abusive sockets | 1 | Per-socket and per-account limits, payload size limits, connection caps per IP/ASN | L |
| D3 | Payment provider outage | 5 | Multi-provider routing, queued payouts, player messaging | M |
| E1 | Privilege escalation in back-office | 6 | RBAC + ABAC, permission tests, JIT elevation, break-glass alarms | L |
| E2 | Container escape / cluster compromise | 3 | Hardened nodes, non-root read-only containers, PodSecurity restricted, runtime detection (Falco), separate node pools for `rng`/`wallet` | L |

# 6. Abuse Cases

@widths 1.6,2.1,1.3
| Abuse case | Detection / prevention | Owner doc |
|---|---|---|
| Bot farm on micro stakes | Attestation, timing and solver-proximity detectors, challenge checks | KP-ENG-09 |
| Collusion ring across operators | Network-wide graph, co-occurrence, soft-play detectors, KYC dedup across tenants | KP-ENG-09 |
| Chip dumping to launder deposits | Chip-flow graph, deposit-withdraw rules, AML alerts, withdrawal holds | KP-ENG-09, KP-LEG-04 |
| Bonus farming with multiple accounts | One KYC identity per network, device and instrument links, wagering | KP-SEC-04 |
| Stolen mobile-money wallet used to deposit then withdraw elsewhere | Instruments must be in the KYC name; withdrawals only to verified own instruments | KP-FIN-02 |
| Insider releasing holds for friends | Four-eyes, conflict checks, audit review, staff play ban | KP-SEC-02 |
| Fake support calls to change phone number | Support cannot change phone without KYC re-verification; call-back procedures | KP-OPS-07 |
| Tournament DDoS to force cancellation | DDoS protection; tournament pause/resume; cancellation rules in House Rules | KP-OPS-03 |

# 7. Residual Risks and Follow-ups

- RTA on a second device (phone camera pointed at the screen) cannot be prevented technically; detection relies on behavioural and solver-proximity analysis (KP-ENG-09 §5.1).
- Players in markets without SIM-swap APIs remain exposed; mitigated by cool-downs and device binding.
- Third-party KYC and payment providers are outside our control; mitigated by due diligence, contracts and monitoring.
- Follow-ups are tracked as security backlog items with owners and due dates; high risks block Real Money launch until mitigated (KP-OPS-06 G3).
