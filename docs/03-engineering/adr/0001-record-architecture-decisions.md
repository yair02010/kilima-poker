# ADR-0001: Record architecture decisions

**Status:** Accepted · **Date:** September 2026 · **Deciders:** Tech Lead team, CTO

## Context

Kilima Poker has many consequential technical decisions (money, fairness, compliance) and a growing team. Decisions made in meetings get lost and are re-argued.

## Decision

Record every significant technical decision as an ADR in `docs/03-engineering/adr/` using `templates/adr-template.md`. An accepted ADR is not edited except for its status; a new ADR supersedes it. The index is KP-ENG-12.

## Consequences

- Decisions are traceable and reviewable in pull requests.
- Regulators and test labs can see why the platform is built as it is.
- About 30–60 minutes of writing per decision.

## Alternatives considered

Decisions only in the architecture document (loses reasoning and history); a wiki outside code review.
