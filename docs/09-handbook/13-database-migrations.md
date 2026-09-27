---
id: KP-HBK-13
title: Database and Migrations Guide
subtitle: Schema ownership, migration rules, zero-downtime changes, indexing and data fixes
version: 1.0
owner: Tech Lead — Platform
status: Approved
related: KP-ENG-05 Data Model · KP-OPS-01 §6 · KP-HBK-12 Wallet Guide
---

# 1. Rules

1. A service touches only its own schema (lint + database roles).
2. Migrations are forward-only files in `services/<name>/migrations`, run by a pre-deploy job.
3. Every migration is backward compatible with the currently deployed code (expand–migrate–contract).
4. No data fixes by hand in production. Fixes are reviewed scripts run as jobs; ledger corrections are reversal postings only.

# 2. Expand–Migrate–Contract

@widths 1,4
| Step | Example: rename `players.nick` to `screen_name` |
|---|---|
| Expand | Add `screen_name` (nullable); code writes both columns |
| Migrate | Backfill job copies `nick` → `screen_name` in batches; add NOT NULL once complete |
| Switch | Code reads `screen_name` only |
| Contract | Next release drops `nick` |

# 3. Safe Operations Cheat Sheet (PostgreSQL 16)

@widths 2.2,2.8
| Operation | Safe way |
|---|---|
| Add column | Nullable or with a constant default (instant) |
| Add NOT NULL | Add `CHECK (col IS NOT NULL) NOT VALID`, validate, then set NOT NULL |
| Add index | `CREATE INDEX CONCURRENTLY` (migration marked non-transactional) |
| Add foreign key | `NOT VALID` then `VALIDATE CONSTRAINT` |
| Change column type | New column + backfill + switch |
| Large backfill | Batches of 5–10k rows with sleeps; progress metric; resumable |
| Drop column/table | Only in a later release after no code reads it |

Set `lock_timeout = '3s'` and `statement_timeout` in migration sessions so a blocked migration fails instead of stalling traffic.

# 4. Indexing

Every query in a hot path has an index plan reviewed in the PR (`EXPLAIN (ANALYZE, BUFFERS)` on a staging snapshot). Monthly partitions for `ledger.entries` and other append-heavy tables; partition creation is automated ahead of time.

# 5. Ledger Specifics

- Migrations on the `ledger` cluster need two approvals and a staging run on a production-sized snapshot.
- Never add triggers that modify ledger rows; never grant `UPDATE`/`DELETE` on ledger tables.

# 6. ClickHouse

Schema changes via `data/clickhouse-migrations`; prefer adding columns with defaults and materialised views; backfills from the S3 lake, never by re-reading production PostgreSQL.
