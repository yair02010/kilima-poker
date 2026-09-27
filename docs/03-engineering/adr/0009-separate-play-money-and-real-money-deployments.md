# ADR-0009: Separate Play Money and Real Money deployments

**Status:** Accepted · **Date:** September 2026 · **Deciders:** CTO, Compliance

## Context

Mixing play chips and real money in one database risks play chips becoming money and complicates certification and regulatory scope.

## Decision

Play Money and Real Money are separate deployments with separate data stores, keys, token audiences and pools; the same code and images run in both, with `APP_MODE` enabling or disabling features.

## Consequences

- Play chips can never leak into real balances.
- Duplicate infrastructure (Play can be smaller).
- Players register separately for Real Money (KYC anyway).

## Alternatives considered

One deployment with a currency flag (one bug from mixing funds).
