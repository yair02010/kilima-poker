# ADR-0016: Short Deck ranking: flush beats full house, three of a kind beats a straight

**Status:** Accepted · **Date:** September 2026 · **Deciders:** Tech Lead Game, Game Operations

## Context

Short Deck (36 cards) changes hand frequencies. Different sites use different rankings for straights versus trips.

## Decision

Default ranking: flush above full house, three of a kind above straight, `A-6-7-8-9` as the lowest straight. The alternative (straight above trips) is a table option shown in the lobby. The choice is justified by seven-card frequencies (straights more frequent than trips; flushes rarer than full houses) and matches common online practice.

## Consequences

- Clear, published rule; both variants supported by the evaluator.
- Players moving from other sites must see the rule clearly (lobby and table info).

## Alternatives considered

Only one hard-coded ranking.
