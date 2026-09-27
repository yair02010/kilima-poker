# ADR-0010: Isolated certified RNG service with deck commitments

**Status:** Accepted · **Date:** September 2026 · **Deciders:** CTO, Compliance

## Context

Certification labs test the RNG and its use. If the RNG is embedded in a frequently changing game server, every release risks re-certification; players increasingly expect verifiable fairness.

## Decision

A dedicated `rng` service implements a NIST SP 800-90A HMAC_DRBG seeded from KMS/HSM and OS entropy, performs Fisher–Yates shuffles with rejection sampling, logs every draw to a WORM archive, and returns a SHA-256 commitment that is published at hand start and revealed after the hand (KP-ENG-13).

## Consequences

- Small, stable certified component.
- Players can verify each hand was not altered.
- One extra network hop per hand (< 2 ms in-cluster).

## Alternatives considered

RNG library inside table-server (larger certified scope); external RNG vendor (latency, dependency).
