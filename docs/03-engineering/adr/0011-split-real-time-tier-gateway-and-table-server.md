# ADR-0011: Split real-time tier: gateway and table-server

**Status:** Accepted · **Date:** September 2026 · **Deciders:** Tech Lead Game, SRE

## Context

Connection count and game logic scale differently; a player plays several tables whose actors may be on different pods; deploys must not drop tables.

## Decision

Stateless `gateway` pods hold client sockets, authenticate and route; `table-server` pods host table actors sharded by table id with leases in Redis; they communicate through Redis pub/sub and streams. Table actors can move between pods at hand boundaries (drain).

## Consequences

- Independent scaling and deployments; multi-tabling across pods.
- More moving parts than a single Socket.IO server with an adapter.

## Alternatives considered

Single Socket.IO tier with the Redis adapter (Bridge design) — simpler but couples connection and game scaling.
