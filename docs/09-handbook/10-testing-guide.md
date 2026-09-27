---
id: KP-HBK-10
title: Testing Guide
subtitle: Practical recipes — vectors, property tests, integration with Testcontainers, contract tests, bots and E2E
version: 1.0
owner: Head of QA
status: Approved
related: KP-QA-01 Test Strategy · KP-HBK-11 Engine Guide · KP-HBK-12 Wallet Guide
---

# 1. What to Write for Each Change

@widths 1.8,3.2
| Change | Tests |
|---|---|
| Pure function / domain rule | Unit tests with examples + edge cases |
| Engine rule | Reference first (`poker_reference.py`) → regenerate vectors → TS passes; property test if a new invariant |
| Ledger posting type | Helper unit test + property test (balanced, non-negative) + integration test with concurrency |
| Endpoint / socket event | Contract test from the spec + integration test (auth, validation, happy path, main errors) |
| Provider adapter | Recorded sandbox fixtures + failure scenarios (timeouts, duplicates, late callbacks) |
| Client screen | Component test + E2E for the flow if it is in KP-PRD-04 §3 |

# 2. Engine Vectors

```ts
import vectors from "../../../docs/03-engineering/reference/test_vectors.json";
describe.each(vectors.evaluation)("evaluation $game $hole | $board", (v) => {
  it("finds the best hand", () => {
    const best = bestHand(v.game, parse(v.hole), parse(v.board));
    expect(best.category).toBe(v.category);
    expect(sortCards(best.cards)).toEqual(sortCards(parse(v.best5)));
  });
});
```

# 3. Property Tests (fast-check)

```ts
it("conserves chips in random hands", () => {
  fc.assert(fc.property(arbTable(), arbDeck(), arbActionSeed(), (table, deck, seed) => {
    const start = totalStacks(table);
    const end = playRandomLegalHand(table, deck, seed);           // uses legalActions only
    return totalStacks(end.table) + end.rake === start;           // uncalled bets are already back in stacks
  }), { numRuns: 20_000 });                                          // nightly: 1,000,000
});
```

Write invariants, not examples: chip conservation, no folded winner, each card dealt once, ledger sums to zero, balances never negative.

# 4. Integration Tests with Real Dependencies

```ts
const pg = await new PostgreSqlContainer("postgres:16").start();
await migrate(pg.getConnectionUri());
const wallet = createWallet({ db: pool(pg), clock: fakeClock() });
await Promise.all(range(50).map((i) => wallet.post(settleHandCmd(`hand:${i % 10}`))));   // duplicates on purpose
expect(await countTransactions()).toBe(10);
```

# 5. Contract Tests

- REST: Schemathesis runs against the service in CI using `openapi.yaml` (fuzzes inputs, checks responses match the schema).
- Sockets: the AsyncAPI validator checks every event the test bots receive.
- Operators and providers: Pact contracts for mocks we depend on.

# 6. Bots and E2E

- `simbots` scenarios live in `tools/simbots/scenarios/*.yaml` (players, strategies, duration, assertions).
- E2E web tests with Playwright; Android with Maestro flows (`apps/mobile/e2e/*.yaml`).
- Every E2E test cleans up via APIs, not the database.

# 7. Flaky Tests

A flaky test is a bug. Quarantine it (tagged, still reported) within one day, fix within a week, and never retry blindly in CI for money or engine suites.
