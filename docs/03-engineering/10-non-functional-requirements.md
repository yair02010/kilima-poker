---
id: KP-ENG-10
title: Non-Functional Requirements
subtitle: Capacity, performance, availability, security, quality and compliance targets
version: 1.0
owner: CTO / Chief Architect
status: In review
related: KP-OPS-02 Observability and SLOs · KP-QA-01 Test Strategy · KP-QA-04 Performance and Resilience Testing
---

# 1. How to Read This Document

Each requirement has an ID (`NFR-xx`), a measurable target per stage, and how it is verified. **Beta** = public Play Money launch; **Launch** = first Real Money jurisdiction; **GA** = network scale (12 months after launch). Latency targets are measured from players in the launch markets on 4G unless stated otherwise.

# 2. Capacity

@widths 0.8,2.4,0.7,0.7,0.7,1.4
| ID | Requirement | Beta | Launch | GA | Verified by |
|---|---|---|---|---|---|
| NFR-01 | Concurrent connected players | 5,000 | 10,000 | 50,000 | Load test (k6 + socket.io clients, headless bots) |
| NFR-02 | Concurrent active tables (incl. virtual fast-fold tables) | 1,000 | 2,000 | 10,000 | Load test |
| NFR-03 | Hands dealt per second (sustained) | 50 | 100 | 400 | Load test |
| NFR-04 | Largest tournament (entrants) | 2,000 | 5,000 | 50,000 | Tournament load test with bots |
| NFR-05 | Ledger postings per second (sustained, p99 < 50 ms) | 300 | 800 | 2,000 | Wallet benchmark |
| NFR-06 | Registered accounts | 200 k | 500 k | 5 M | Data-volume test |

# 3. Performance

@widths 0.8,2.4,0.7,0.7,0.7,1.4
| ID | Requirement | Beta | Launch | GA | Verified by |
|---|---|---|---|---|---|
| NFR-10 | Server processing of a game action (receive → events emitted), p99 | 20 ms | 15 ms | 10 ms | Tracing |
| NFR-11 | Action round trip (client emit → ack) on 4G, p95 | 350 ms | 300 ms | 250 ms | Real-user monitoring |
| NFR-12 | Event fan-out to all players at a table, p95 (server side) | 30 ms | 25 ms | 20 ms | Tracing |
| NFR-13 | Time between hands at a cash table (settlement + next deal), p95 | 2.5 s | 2 s | 1.5 s | Table metrics (includes animation time budget) |
| NFR-14 | Fast-fold: fold → next hand dealt, p95 | 3 s | 2 s | 1.5 s | Pool metrics |
| NFR-15 | REST reads p95 / writes p95 | 300 / 600 ms | 250 / 500 ms | 200 / 400 ms | APM |
| NFR-16 | Deposit confirmation shown after provider callback, p95 | 5 s | 3 s | 3 s | Payment metrics |
| NFR-17 | App cold start to lobby on baseline device | 4 s | 3 s | 3 s | Device lab |
| NFR-18 | Reconnect to table after network returns, p95 | 3 s | 2 s | 2 s | E2E with network conditioning |
| NFR-19 | Tournament table balancing after a hand at 5,000 tables | 300 ms | 200 ms | 200 ms | Tournament load test |

# 4. Availability and Recovery

@widths 0.8,2.4,0.7,0.7,0.7,1.4
| ID | Requirement | Beta | Launch | GA | Verified by |
|---|---|---|---|---|---|
| NFR-20 | Monthly availability: login, lobby, play | 99.5 % | 99.9 % | 99.95 % | SLO dashboards |
| NFR-21 | Monthly availability: wallet and cashier (excluding third-party providers) | — | 99.9 % | 99.95 % | SLO dashboards |
| NFR-22 | Voided hands due to platform failures | < 0.1 % | < 0.02 % | < 0.01 % | Hand records |
| NFR-23 | RPO — ledger and completed hands | 5 min | 0 (synchronous multi-AZ) | 0 in region; ≤ 1 min cross-region | DR drill |
| NFR-24 | RTO — region failure | 24 h | 4 h | 1 h | DR drill |
| NFR-25 | Deploys without interrupting hands | Graceful drain | same | same | Deploy tests |
| NFR-26 | Tournament resilience: a table-server pod failure resumes affected tournament tables within | 60 s | 30 s | 15 s | Chaos test |

# 5. Security

@widths 0.8,3.4,0.8,1.4
| ID | Requirement | Stage | Verified by |
|---|---|---|---|
| NFR-30 | OWASP ASVS Level 2 for all services; Level 3 for identity, wallet, cashier, rng | Launch (L1 at Beta) | Checklist + pentest |
| NFR-31 | No open critical/high vulnerabilities at release | Beta | CI scans (SAST, SCA, container, IaC) |
| NFR-32 | TLS 1.2+ (1.3 preferred), HSTS preload, mTLS inside the cluster | Beta | Scans, mesh policy |
| NFR-33 | Secrets never in code, images or logs | Beta | Secret scanning, log canaries |
| NFR-34 | Independent penetration test (web, API, mobile, infrastructure) with all high findings fixed; repeated yearly and after major changes | Launch | Pentest report |
| NFR-35 | All staff and money actions audited in a tamper-evident log | Beta | Audit review |
| NFR-36 | Card data never touches Kilima systems (hosted/tokenised by PSPs) | Launch | PCI DSS SAQ A attestation |
| NFR-37 | ISO/IEC 27001-aligned ISMS; certification targeted within 18 months of launch | GA | External audit |
| NFR-38 | DDoS resilience: service remains available under a 100 Gbps volumetric attack (edge) and application-layer floods | Launch | Provider SLA + game-day test |

# 6. Game Integrity and Fairness

@widths 0.8,3.4,0.8,1.4
| ID | Requirement | Stage | Verified by |
|---|---|---|---|
| NFR-40 | RNG and game certified by an accredited lab for every Real Money jurisdiction | Launch | Certificates |
| NFR-41 | 100 % of hands verifiable against their deck commitment | Beta | Automated checks |
| NFR-42 | Integrity: critical case first action ≤ 1 h; red-team bots detected within 2,000 hands (90 % recall) | Launch | Integrity KPIs |
| NFR-43 | Chip conservation: zero ledger imbalances; every table reconciles after every hand | Beta | Continuous checks |

# 7. Quality and Maintainability

@widths 0.8,3.4,0.8,1.4
| ID | Requirement | Stage | Verified by |
|---|---|---|---|
| NFR-50 | Line coverage ≥ 80 % overall; ≥ 95 % for `engine-poker`, `wallet`, `rng`, `tournament` payouts | Beta | CI |
| NFR-51 | All engine test vectors and property tests pass | Beta | CI |
| NFR-52 | CI pipeline (build + test + scan) under 20 minutes | Beta | CI metrics |
| NFR-53 | Every service has runbooks, dashboards, alerts and an on-call owner | Beta | Go-live checklist |
| NFR-54 | Distributed tracing across gateway, table-server, wallet and cashier for every action and payment | Beta | Observability review |

# 8. Client and Accessibility

@widths 0.8,3.4,0.8,1.4
| ID | Requirement | Stage | Verified by |
|---|---|---|---|
| NFR-60 | Android 8+ on 2 GB RAM devices; 3G-playable; APK < 30 MB | Beta | Device lab |
| NFR-61 | Crash-free sessions ≥ 99.5 %; ANR rate < 0.3 % | Beta | Crash reporting |
| NFR-62 | Languages: EN, FR, PT, SW | Launch | Localisation QA |
| NFR-63 | WCAG 2.2 AA for non-table screens; four-colour deck and large-text table mode | Launch | Accessibility audit |

# 9. Compliance and Data

@widths 0.8,3.4,0.8,1.4
| ID | Requirement | Stage | Verified by |
|---|---|---|---|
| NFR-70 | Personal data processed according to KP-LEG-02 and local laws (e.g. Kenya Data Protection Act 2019, Nigeria Data Protection Act 2023); cross-border transfers assessed | Beta | Privacy review (DPIA) |
| NFR-71 | Hand histories, ledger and audit logs retained and exportable per licence (WORM) | Launch | Export test |
| NFR-72 | Jurisdiction policy change takes effect in ≤ 60 s across all services | Launch | E2E test |
| NFR-73 | Self-exclusion effective in ≤ 60 s: player removed from tables after the current hand, no new seats or deposits | Launch | E2E test |
| NFR-74 | Regulatory reporting feeds delivered on time with ≥ 99.9 % completeness | Launch | Report monitoring |
