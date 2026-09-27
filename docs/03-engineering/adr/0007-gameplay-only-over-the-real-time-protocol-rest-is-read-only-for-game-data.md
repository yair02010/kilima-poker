# ADR-0007: Gameplay only over the real-time protocol; REST is read-only for game data

**Status:** Accepted · **Date:** September 2026 · **Deciders:** Tech Lead Game

## Context

Two write paths for one table state machine cause races and duplicated validation.

## Decision

All seating and game actions (sit, top-up, act, rebuy, fast-fold) go over Socket.IO `/play` with acknowledgements and idempotent `clientActionId`. REST provides read-only table and hand data. Tournament registration and the cashier are REST because they are commerce operations outside a table.

## Consequences

- One authoritative path; simpler testing.
- Clients must keep a socket to play (already required).

## Alternatives considered

REST writes plus socket notifications (two paths).
