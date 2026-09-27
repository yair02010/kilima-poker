---
id: KP-ENG-16
title: Data Platform and AI
subtitle: Hand-history store, analytics, reporting, machine-learning pipelines and AI assistants
version: 1.0
owner: Head of Data
status: Draft
related: KP-ENG-05 Data Model · KP-ENG-09 Game Integrity · KP-FIN-03 Reporting · KP-LEG-02 Privacy · KP-LEG-05 Responsible Gaming
---

# 1. Purpose

The data platform turns every hand, payment and session into: (1) the permanent hand-history record, (2) financial and regulatory reports, (3) product analytics, and (4) machine-learning features and models for integrity, fraud and responsible gaming. It is read-only with respect to money: it never posts to the ledger or changes player state directly; models produce scores and recommendations that operational services and humans act on.

# 2. Architecture

```
Kafka topics ──► Kafka Connect ──► ClickHouse (hot, 13 months)  ──► BI (Superset), notebooks, feature jobs
     │                            └► S3 (Parquet, Iceberg tables; WORM copies for regulated data)
PostgreSQL (CDC, Debezium) ──────►  same
Airflow ──► batch jobs (reports, features, model training) ──► model registry (MLflow) ──► scoring services
```

- **Hot store:** ClickHouse for hand histories, actions, sessions, telemetry summaries and CDC facts.
- **Lake:** S3 + Apache Iceberg for long-term, low-cost storage and training sets.
- **Orchestration:** Airflow; data quality checks (row counts, freshness, reconciliation against the ledger) block downstream reports on failure.
- **Access control:** role-based access per dataset (finance, integrity, data science, product); personal data columns masked for roles that do not need them; every query on hole-card datasets is logged.

# 3. Reporting

@widths 1.6,1.2,2.2
| Report | Audience | Content |
|---|---|---|
| Daily finance pack | Finance, treasury | Player liabilities by currency, deposits, withdrawals, rake, fees, promotions, provider balances, reconciliation status |
| GGR / NGR by jurisdiction | Finance, tax, regulators | Gross gaming revenue (rake + fees), bonuses, taxes by jurisdiction and period |
| Regulatory feeds | Regulators | As required by each licence (e.g. daily transaction files, real-time bet/settlement feeds, player registers) |
| Operator statements | Operators | Rake, revenue share, network settlement (KP-ENG-14 §6) |
| Game health | Game ops | Seats, waitlists, liquidity by stake, tournament fill, player winners/losers distribution, rake per 100 hands |
| Integrity dashboard | Integrity | Detector volumes, case backlog, precision/recall, enforcement |
| Responsible gaming | Compliance | Limits usage, reality checks, exclusions, risk-model alerts and interventions |

Financial reports are reproducible: every figure can be traced to ledger transactions (report runs store their query versions and input watermarks).

# 4. Machine-Learning Use Cases

@widths 1.4,1.7,1.9
| Model | Consumer | Output and action |
|---|---|---|
| Bot / RTA classifier | integrity | Risk score per account per day → cases above threshold |
| Collusion graph model | integrity | Suspicious clusters and pairs → cases; seating restrictions |
| Payment fraud score | cashier, risk | Score per deposit/withdrawal → allow, step-up, review |
| AML transaction monitoring (rules + anomaly model) | compliance | Alerts → AML analysts; suspicious transaction reports are human decisions |
| Responsible-gaming risk model | compliance, player care | Markers of harm (loss chasing, session length growth, night play, repeated deposits after losses, limit changes) → interventions (message, cooling-off suggestion, contact by player care) |
| Churn and value models | CRM | Offers within responsible-marketing rules; never targeted at excluded or at-risk players |
| Table health / liquidity forecasting | game ops | Recommended table templates and tournament guarantees |

# 5. Model Governance

- Every model has a **model card**: purpose, training data and period, features, metrics (precision, recall, calibration), fairness checks (no protected attributes; checks for proxy effects by country and device class), known limitations, owner and review date.
- Models affecting players' access to games or funds (integrity, fraud, AML) are **decision support**: automated actions are limited to protective, reversible steps (review queue, withdrawal hold, step-up); final adverse decisions are human.
- Shadow mode before activation; champion/challenger evaluation; drift monitoring on features and scores with alerts; retraining through the pipeline with approval.
- Training sets exclude players who have requested erasure where the law requires it (subject to AML and regulatory retention exceptions, KP-LEG-06).

# 6. AI Assistants

Large-language-model assistants help staff work faster; they do not take decisions and are not exposed to players for game advice.

@widths 1.4,3.6
| Assistant | Function and guardrails |
|---|---|
| Integrity case summariser | Drafts a structured summary of a case from detector outputs, hand statistics and graph data ("12 of 14 river decisions matched the solver line, expected 5 ± 2 for the rating band"). Cites the hands and metrics it used; the analyst edits and decides. No hole cards leave the platform; the model runs in a private deployment or under a data-processing agreement that forbids training on Kilima data |
| Support copilot | Suggests replies and relevant hand-history excerpts for support tickets in the player's language (English, French, Portuguese, Swahili); agents send the reply. Never reveals other players' hole cards or integrity information |
| AML narrative drafting | Drafts the narrative part of an internal AML case file from alerts and transactions; the MLRO reviews and decides on any report |
| Game-ops assistant | Answers questions over approved dashboards ("which stakes had waitlists above 10 yesterday?") with the SQL it used |

All prompts and outputs are logged for audit; personal data in prompts is minimised; the assistants are evaluated before use with test sets for accuracy and leakage.

# 7. Player-Facing Data Products

- Personal statistics, session history, hand replayer and leaderboards (from ClickHouse through the `player` service).
- "Verify this hand" data (KP-ENG-13 §5).
- Activity statements and responsible-gaming summaries (KP-LEG-05).
- No player-facing AI coaching during play in Real Money (it would be real-time assistance); post-session learning content in Play Money may be offered later with review by integrity.
