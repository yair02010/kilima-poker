# ADR-0013: React Native, Android-first clients with a shared TypeScript core

**Status:** Accepted · **Date:** September 2026 · **Deciders:** Tech Lead Clients, Product

## Context

Most target players use Android phones of modest specification; the team works in TypeScript; web and white-label clients are needed too.

## Decision

Build the mobile app in React Native (New Architecture, Hermes) with a Skia table renderer, a web PWA in React, and share `client-core`, contracts and the engine's display helpers across them.

## Consequences

- One language across clients and server; shared protocol code.
- Rendering performance must be proven on 2 GB devices (budget tests in CI).

## Alternatives considered

Native Kotlin + Swift (two code bases); Unity/Cocos (heavier apps, different skills); Flutter (strong, but no code sharing with the TypeScript server and engine).
