# ADR-0002: Modular services with a phased deployment topology

**Status:** Accepted · **Date:** September 2026 · **Deciders:** CTO, Tech Leads

## Context

The platform has very different workloads: long-lived sockets, table actors, money, payments, compliance, analytics. Real Money requires isolation of money and RNG. The team will grow from about 8 to 25 engineers.

## Decision

Build clear service boundaries from the start (KP-ENG-01 §5) in one monorepo. Deploy them in phases: at Alpha, `lobby` and `tournament` run in one deployable, and `player`, `notify` and `backoffice` in another (same images, different entry points). `wallet`, `cashier`, `rng` and `identity` are always separate deployables with their own database roles. Split further when load or team ownership requires it.

## Consequences

- Security and certification isolation where it matters from day one.
- Lower operational load early; no code changes needed to split later.
- Requires discipline: no cross-schema queries (lint rule).

## Alternatives considered

A single monolith (mixes money and sockets, larger certification scope); full microservices from day one (too much operational overhead early).
