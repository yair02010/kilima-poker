# ADR-0005: Double-entry ledger in PostgreSQL with integer minor units

**Status:** Accepted · **Date:** September 2026 · **Deciders:** CTO, Tech Lead Payments, Finance

## Context

Real money requires provable balances, strict transactions and auditability. The Bridge design used MongoDB transactions; poker has far more money events (every hand) and heavier reconciliation and reporting.

## Decision

All money movements are double-entry, insert-only transactions in a dedicated PostgreSQL cluster (`ledger`), with bigint minor units per currency, idempotency keys, serialisable posting functions with deterministic row locking, and cached balances with versions (KP-ENG-08).

## Consequences

- Strong ACID guarantees and constraints; mature tooling for finance and audits.
- A second database technology compared with the Bridge dossier (Bridge will use this ledger when integrated).
- Partitioning and archiving needed for entry volume (planned).

## Alternatives considered

MongoDB transactions (weaker relational integrity for accounting queries); an external ledger SaaS (vendor lock-in, latency on every hand).
