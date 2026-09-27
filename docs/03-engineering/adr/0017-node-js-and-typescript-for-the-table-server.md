# ADR-0017: Node.js and TypeScript for the table-server

**Status:** Accepted · **Date:** September 2026 · **Deciders:** CTO, Tech Lead Game

## Context

The table-server is latency-sensitive and CPU-heavy at scale (Omaha evaluation). Go or Rust would give more headroom; TypeScript allows one engine shared with clients and faster delivery by the team.

## Decision

Implement `table-server` and `engine-poker` in TypeScript on Node.js, one event loop per pod with table actors, evaluator lookup tables, and worker threads for heavy evaluation (PLO6 showdowns, equity). Benchmarks are release gates (KP-ENG-06 §13). Revisit if a pod cannot sustain 400 active tables at p99 < 10 ms processing.

## Consequences

- One language, shared engine with clients and the reference test vectors.
- Needs careful performance engineering; the revisit trigger is explicit.

## Alternatives considered

Go table-server (faster, but duplicate engine implementation); Rust engine compiled to WebAssembly for both sides (strong option for later).
