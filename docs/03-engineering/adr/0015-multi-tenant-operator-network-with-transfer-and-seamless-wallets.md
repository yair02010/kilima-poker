# ADR-0015: Multi-tenant operator network with transfer and seamless wallets

**Status:** Accepted · **Date:** September 2026 · **Deciders:** CTO, Head of B2B

## Context

In several African markets, licensed sportsbooks hold the customers. A network model increases liquidity, which is the main success factor in poker.

## Decision

Every account belongs to a tenant; Kilima B2C is one tenant. Operators integrate through the Operator API with a transfer wallet or a seamless wallet; table and tournament money always sits in Kilima's ledger; network settlement statements are generated from the ledger (KP-ENG-14).

## Consequences

- Shared liquidity across brands; B2B revenue.
- Tenant isolation must be enforced everywhere (row-level security, token tenant claim, tests).

## Alternatives considered

B2C only (low liquidity); separate deployments per operator (no shared liquidity).
