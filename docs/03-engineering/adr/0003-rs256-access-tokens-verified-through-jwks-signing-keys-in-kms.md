# ADR-0003: RS256 access tokens verified through JWKS, signing keys in KMS

**Status:** Accepted · **Date:** September 2026 · **Deciders:** Tech Lead Platform, Security

## Context

Every service and every gateway must verify player identity on each request and socket event without a network call, and a leaked verification key must not allow forging tokens.

## Decision

The identity service signs 10-minute access tokens with RS256 using a key held in AWS KMS (sign operation via KMS API); services verify with public keys from JWKS, pinning algorithm, issuer and audience. Refresh tokens are opaque, hashed in Redis, rotated with reuse detection.

## Consequences

- Private keys never leave KMS.
- Key rotation without downtime.
- KMS sign latency (~5–10 ms) only on token issuance, not verification.

## Alternatives considered

HS256 shared secret (blast radius); opaque tokens with introspection (network call per event).
