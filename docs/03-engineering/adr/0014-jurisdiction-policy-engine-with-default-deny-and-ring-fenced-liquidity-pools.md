# ADR-0014: Jurisdiction Policy Engine with default deny and ring-fenced liquidity pools

**Status:** Accepted · **Date:** September 2026 · **Deciders:** Compliance, CTO

## Context

The legal status of online poker differs between African countries and changes over time. Hard-coded country logic would be wrong quickly and hard to audit.

## Decision

A policy engine in `compliance` decides, from KYC country, geolocation signals and operator, which pools, games, currencies, limits and taxes apply to a player. Unknown or unapproved jurisdictions are denied for Real Money. Policies are versioned data changed with four-eyes approval and applied platform-wide within 60 seconds.

## Consequences

- Compliance changes without code releases; auditable history.
- Every seating and money action depends on a policy check (cached, with fail-closed behaviour).

## Alternatives considered

Country lists in code or configuration files per service (drift, no audit).
