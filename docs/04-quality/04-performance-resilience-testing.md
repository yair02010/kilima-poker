---
id: KP-QA-04
title: Performance, Load and Resilience Testing
subtitle: Load models, bot players, scale tests, soak, chaos and disaster-recovery drills
version: 1.0
owner: Head of QA / SRE Lead
status: Draft
related: KP-ENG-10 NFR · KP-OPS-05 Backup and DR · KP-OPS-02 SLOs
---

# 1. Goals

Prove, before each stage (Beta, Launch, GA), that the platform meets the capacity, latency and availability targets of KP-ENG-10 with realistic player behaviour, and that failures of any component lose no money and void as few hands as possible.

# 2. Load Model

@widths 1.8,3.2
| Parameter | Model (from Beta data once available; initial assumptions) |
|---|---|
| Player mix | 55 % cash (of which 40 % fast-fold), 25 % SNG/Spins, 20 % MTT |
| Tables per player | 1.4 average on mobile, 3 on web |
| Decision time | Log-normal, median 3 s, 95th percentile 12 s; 3 % timeouts |
| Hands per table per hour | 70 (6-max cash), 180 (fast-fold per player) |
| Network profile | 60 % 4G, 30 % 3G, 10 % Wi-Fi; 1–3 % packet loss; 5 % of sessions with a reconnect per hour |
| Peak factor | 3× average, evening local time; tournament starts create step loads (5,000 registrations in 10 minutes) |
| Cashier | 1 deposit per 20 active players per hour at peak; withdrawals 1/5 of deposits |

# 3. Bot Players (`simbots`)

- Headless socket clients implementing the full protocol, with configurable strategies (random legal, tight/loose, all-in heavy, timeouts, disconnect/reconnect).
- Assertions inside every bot: `seq` continuity, own-card privacy (a bot must never receive another player's hole cards), legal-action consistency, balance changes match hand results.
- Distributed runner on Kubernetes: up to 60,000 bots from multiple regions (including African cloud regions) to include real network latency.

# 4. Test Catalogue

@widths 1.5,2.2,1.3
| Test | Description | Pass criteria |
|---|---|---|
| Baseline | Nightly on `staging`, 10 % of Beta load | Latency within 10 % of last baseline |
| Stage load | Target concurrency of the stage for 2 h | NFR-01..05, NFR-10..19 met |
| Stress | Increase until SLOs break | Breaking point ≥ 1.5× stage target; graceful degradation (no data loss) |
| Soak | Stage load for 24 h | No memory growth > 10 %; no latency drift; no ledger or table reconciliation errors |
| Spike | 0 → 80 % target in 5 minutes; tournament mass start | Autoscaling within 3 minutes; no voided hands from overload |
| Tournament scale | 10,000 / 50,000 bot entrants, full MTT to completion at accelerated levels | Balancing times (NFR-19), correct payouts, pool = 0 |
| Settlement throughput | Wallet benchmark at NFR-05 | p99 < 50 ms, zero deadlocks |
| Mobile network | Real devices on 3G profiles in the device lab | Reconnect p95 (NFR-18), data per 100 hands |

# 5. Resilience (Chaos) Experiments

Run monthly in `perf` and quarterly (reduced blast radius) in Play Money production:

@widths 2,3
| Experiment | Expected behaviour |
|---|---|
| Kill random table-server pods during hands | Affected hands voided (< NFR-22), tables resume on another pod within NFR-26, no money lost |
| Kill gateway pods | Clients reconnect and resync within NFR-18 |
| Wallet unavailable 60 s | Tables pause between hands; resume automatically; no hand dealt without confirmed stacks |
| Redis primary failover | Brief pause; tables rebuilt from ledger and snapshots; no duplicate settlements |
| Kafka broker loss | Producers retry via outbox; consumers catch up; no lost `hand.completed` |
| PostgreSQL failover (core, ledger) | Writes resume within 60 s; idempotent retries succeed |
| Payment provider timeout / outage | Routing to alternatives; queued payouts; no double payouts |
| RNG pod entropy failure | Fail closed, tables on that pod pause, traffic moves to healthy RNG pods |
| AZ loss | Service continues within availability targets |

# 6. Disaster-Recovery Drills

- Region failover drill to the EU standby: quarterly from Launch; measured RPO/RTO against NFR-23/24; includes restoring the ledger and verifying invariants before reopening Real Money.
- Point-in-time restore drill of the ledger to a separate environment: monthly, with reconciliation.

# 7. Reporting

Each test produces a report: configuration, load, results against targets, graphs, bottlenecks found, tickets created. Stage gates (G1, G3) require the latest stage-load, soak and chaos reports to pass.
