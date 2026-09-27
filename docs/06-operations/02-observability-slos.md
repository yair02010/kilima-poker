---
id: KP-OPS-02
title: Observability and SLOs
subtitle: Telemetry, service level objectives, dashboards, alerts and on-call
version: 1.0
owner: SRE Lead
status: Draft
related: KP-ENG-10 NFR · KP-OPS-03 Runbooks · KP-OPS-04 Incident Response
---

# 1. Telemetry

@widths 1.2,3.8
| Signal | Implementation |
|---|---|
| Traces | OpenTelemetry SDK in every service; propagated through REST, socket actions (trace id per action) and Kafka headers; sampling 100 % for errors and money operations, 5 % otherwise |
| Metrics | Prometheus (managed); RED metrics per endpoint/event; business metrics (hands/min, seats, deposits, withdrawals, rake) |
| Logs | Structured JSON (pino) to Loki; request id, trace id, account id (pseudonymised), table id; redaction rules (KP-ENG-11 §2) |
| Real-user monitoring | Client SDK: action round trip, reconnect time, frame rate, crashes, ANRs, by country, network type and device class |
| Synthetic monitoring | Bots in each launch country playing Play Money hands and exercising login and cashier (sandbox) every minute |

# 2. Service Level Objectives

@widths 1.7,2,1.3
| SLO | SLI | Target (Real Money, 30 days) |
|---|---|---|
| Play availability | Share of minutes where synthetic bots can log in, sit and complete a hand | 99.95 % |
| Action latency | Server processing p99 < 15 ms and client round trip p95 < 300 ms | 99 % of 5-min windows |
| Hand integrity | Hands completed without platform-caused void | ≥ 99.98 % |
| Settlement | Hand settlements committed within 100 ms | 99.9 % |
| Wallet/cashier availability | Successful internal wallet API calls; cashier API success excluding provider errors | 99.95 % |
| Deposit credit time | Provider confirmation → balance update within 5 s | 99 % |
| Withdrawal time | Auto-approved mobile-money payouts completed within 15 minutes | 95 % |
| Tournament punctuality | Tournaments starting within 60 s of scheduled time | 99.5 % |

Error budgets: when a service consumes more than 50 % of its monthly budget, feature releases for that service pause in favour of reliability work until the burn rate recovers.

# 3. Dashboards

- **Executive/live:** players online, tables, hands/min, deposits/withdrawals, rake today, incidents.
- **Game:** per pool and format — seats, waitlists, voided hands, action latency, timeouts, reconnects, tournaments running.
- **Money:** ledger postings/s and latency, settlement lag, reconciliation status, coverage ratio, provider success rates and float levels.
- **Integrity:** detector volumes, open cases, holds, attestation failures.
- **Platform:** per service RED metrics, Kafka lag, database health, Redis memory, node utilisation.
- **Client:** crash-free sessions, round-trip by country/network, app versions.

# 4. Alerts

@widths 1.7,2.3,1
| Alert | Condition | Priority |
|---|---|---|
| Ledger imbalance | Any transaction or account-set sum ≠ 0 | P1 |
| Hand settlement mismatch | Hand totals ≠ settlement | P1 |
| Hole-card leak filter triggered | Any occurrence | P1 |
| RNG health failure | Any pod fails health tests or entropy source | P1 |
| Coverage ratio < 100 % | Treasury report | P1 |
| Play availability burn | 2 % budget in 1 h or 5 % in 6 h | P1/P2 |
| Voided hands | > 0.05 % over 15 min | P2 |
| Action latency | p99 server > 30 ms for 10 min | P2 |
| Disconnect storm | Reconnect rate 3× baseline for 5 min in a country | P2 |
| Provider degraded | Deposit success < 70 % for 10 min or payout failures > 5 % | P2 |
| Tournament stuck | Running table with no hand for > 3 minutes | P2 |
| Kafka consumer lag | `hand.completed` lag > 60 s | P3 |
| Certificate expiry | < 21 days | P3 |

Every alert links to its runbook (KP-OPS-03).

# 5. On-Call

- Follow-the-sun from GA; before GA, a 24/7 rotation of SRE plus one engineer per critical domain (game, payments) with a secondary.
- Paging via an incident platform; acknowledgement targets: P1 5 min, P2 15 min.
- Handover notes each shift; weekly on-call review of pages (noise reduction).
- Game operations (tournament directors) and payments operations have their own rotations during peak hours and escalate to engineering.
