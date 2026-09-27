# ADR-0018: Rake: percentage with cap, no flop no drop, proportional allocation to pots

**Status:** Accepted · **Date:** September 2026 · **Deciders:** Finance, Tech Lead Game

## Context

Rake is the main revenue and must be transparent, fair across side pots and exactly reproducible for audits.

## Decision

Rake = floor(total pots × percentage), capped per stake and number of players dealt; no rake if the hand ends before the flop; the rake is allocated to pots proportionally (remainder from the main pot) and posted in the hand's settlement. Schedules are configuration approved by finance and published to players.

## Consequences

- Transparent, reproducible and fair across side pots.
- Players see the rake in every hand history.

## Alternatives considered

Rake only from the main pot (unfair to short stacks); time-based table fees (unfamiliar in target markets).
