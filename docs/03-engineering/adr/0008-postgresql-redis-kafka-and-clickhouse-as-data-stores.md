# ADR-0008: PostgreSQL, Redis, Kafka and ClickHouse as data stores

**Status:** Accepted · **Date:** September 2026 · **Deciders:** CTO, Tech Leads

## Context

Workloads: relational system of record (identity, tournaments, compliance), money (ledger), low-latency live state, durable event streams for many consumers, and large-scale analytical queries over billions of hand actions.

## Decision

PostgreSQL 16 (two clusters: `core`, `ledger`) as the system of record; Redis 7 Cluster for live state, queues, sessions and fan-out; Kafka for durable domain events; ClickHouse for hand histories and analytics; S3 Object Lock for archives. This supersedes Bridge Casino ADR-0008 for the combined platform.

## Consequences

- Best tool per workload; ledger isolated.
- More technologies to operate; mitigated by managed services (Aurora, ElastiCache, MSK, ClickHouse Cloud).
- Data engineers needed from Beta.

## Alternatives considered

MongoDB for everything (weak for analytics at this scale and for accounting); Redis Streams as the only bus (limited retention and consumer tooling).
