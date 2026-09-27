---
id: KP-HBK-09
title: TypeScript Coding Guide
subtitle: Patterns for money, time, randomness, errors, results, logging and dependency injection
version: 1.0
owner: CTO
status: Approved
related: KP-ENG-11 §2 Code Standards · KP-HBK-10 Testing Guide
---

# 1. Money

```ts
// packages/money
export type Currency = "USD" | "KES" | "NGN" | "GHS" | "UGX" | "TZS" | "AOA" | "KPC";
export interface Money { readonly units: bigint; readonly currency: Currency }

export const money = (units: bigint, currency: Currency): Money => ({ units, currency });
export function add(a: Money, b: Money): Money {
  assertSameCurrency(a, b);
  return money(a.units + b.units, a.currency);
}
export function percentFloor(m: Money, basisPoints: bigint): Money {   // e.g. rake 500 bp = 5 %
  return money((m.units * basisPoints) / 10_000n, m.currency);          // bigint division floors toward zero
}
export function splitEven(m: Money, parts: number): Money[] {           // remainder goes to the first shares
  const n = BigInt(parts), base = m.units / n, rem = m.units % n;
  return Array.from({ length: parts }, (_, i) => money(base + (BigInt(i) < rem ? 1n : 0n), m.currency));
}
```

Rules: money is `bigint` units plus currency; JSON serialises units as numbers only at API boundaries after a safe-integer check; formatting for display lives only in clients (`Intl.NumberFormat`).

# 2. Results Instead of Exceptions in the Domain

```ts
export type Result<T, E extends { code: string }> = { ok: true; value: T } | { ok: false; error: E };

function sit(table: Table, req: SitRequest): Result<Seat, SeatError> {
  if (table.isFull()) return err({ code: "TABLE_FULL" });
  if (req.buyIn.units < table.minBuyIn(req.accountId).units) return err({ code: "RATHOLE_MIN_BUYIN" });
  return ok(table.reserve(req));
}
```

Expected business outcomes are `Result`s; exceptions are for bugs and infrastructure failures. Handlers map `Result` errors to protocol error codes.

# 3. Time and Randomness

- Inject a `Clock` (`now(): Instant`); tests use a fake clock. The engine receives time as input.
- Never use `Math.random`. Game randomness comes from the `rng` service; ids use `crypto.randomUUID()` / UUIDv7.

# 4. Dependency Injection

Plain constructor or factory injection; no DI framework. `main.ts` wires concrete implementations; tests pass fakes.

```ts
export function createWithdrawals(deps: { ledger: LedgerClient; rules: RiskRules; clock: Clock; outbox: Outbox }) {
  return { request: async (cmd: WithdrawCmd) => { /* … */ } };
}
```

# 5. Logging

```ts
log.info({ tableId, handId, seat, action: "raise", toUnits: 300 }, "action applied");   // structured fields, short message
```

Never log tokens, OTPs, passwords, phone numbers, instrument numbers, or hole cards of live hands (lint rule). Use `log.child({ requestId })` per request.

# 6. Concurrency

- One writer per aggregate: a table actor owns its table state; the wallet owns balances (row locks).
- Avoid shared mutable state across requests; use Redis or the database with explicit ownership.
- All external calls have timeouts and bounded retries with jitter; retries only for idempotent operations.

# 7. Naming and Style

Files `kebab-case.ts`; types `PascalCase`; functions and variables `camelCase`; constants `UPPER_SNAKE_CASE`; boolean names read as questions (`isAllIn`, `hasActed`). Prefer small pure functions; keep modules under ~400 lines; explain *why* in comments, not *what*.
