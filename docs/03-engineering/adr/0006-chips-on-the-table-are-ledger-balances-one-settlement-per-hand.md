# ADR-0006: Chips on the table are ledger balances; one settlement per hand

**Status:** Accepted · **Date:** September 2026 · **Deciders:** Tech Lead Payments, Tech Lead Game

## Context

Many poker platforms move money to a table and only reconcile at cash-out. A crash or bug can then make the ledger disagree with what players see, which is hard to prove to a regulator.

## Decision

A buy-in moves funds to a per-seat table account; every completed hand posts one balanced `hand_settlement` transaction (idempotency key `hand:{handId}`) before the next hand starts; a failed server voids only the unfinished hand.

## Consequences

- The ledger shows exactly what is on every table at every moment.
- Settlement latency is on the critical path between hands (target p99 < 50 ms).
- Higher posting volume (sized in NFR-05).

## Alternatives considered

Settle only at cash-out (weaker guarantees); per-action postings (too many writes, no benefit).
