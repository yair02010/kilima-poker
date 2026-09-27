---
id: KP-HBK-17
title: Observability Guide
subtitle: How to instrument services — traces, metric naming, logs, dashboards and alerts as code
version: 1.0
owner: SRE Lead
status: Approved
related: KP-OPS-02 Observability and SLOs · KP-HBK-07 Service Blueprint
---

# 1. Traces

- Auto-instrumentation for HTTP, pg, Redis, Kafka; manual spans for domain steps (`engine.apply`, `wallet.post`, `rng.deck`).
- Socket actions: the gateway starts a trace per `action:submit` and propagates it to table-server and wallet; `handId` and `tableId` are span attributes.
- Never put personal data or card values in span attributes.

# 2. Metric Naming

`kp_<service>_<thing>_<unit>` with labels from a fixed set (no account ids, no free text):

@widths 2.4,2.6
| Metric | Labels |
|---|---|
| `kp_table_actions_total` | variant, format, pool, result |
| `kp_table_action_duration_seconds` (histogram) | variant, format |
| `kp_table_hands_voided_total` | reason |
| `kp_wallet_postings_total` / `_duration_seconds` | type, result |
| `kp_cashier_payments_total` | provider, method, direction, status |
| `kp_gateway_connections` (gauge) | country, platform |
| `kp_integrity_cases_open` (gauge) | type, severity |

Cardinality budget: < 10,000 series per service; CI checks new metrics.

# 3. Logs

Structured JSON; levels: `error` (needs action), `warn` (unexpected but handled), `info` (business events, sparse), `debug` (off in production by default, can be enabled per service for 30 minutes). Every log line has `service`, `env`, `requestId`/`traceId`.

# 4. Dashboards and Alerts as Code

Dashboards (Grafana JSON via Jsonnet) and alert rules live in `infra/observability/<service>/`, reviewed like code. Every alert has: severity, summary, runbook link, owner team, and a test (unit test with synthetic series).

# 5. Business Observability

Money and game metrics are first-class: hands per minute, settlement lag, ledger imbalance (must be 0), deposit success per provider, withdrawal time, seated players per stake. Product analytics use the data platform, not Prometheus.
