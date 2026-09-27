---
id: KP-HBK-11
title: Implementing the Poker Engine
subtitle: Step-by-step guide to building packages/engine-poker from the specification and the reference
version: 1.0
owner: Tech Lead — Game
status: Approved
related: KP-ENG-06 Poker Game Engine · reference/poker_reference.py · KP-HBK-10 Testing Guide · ADR-0017
---

# 1. Principles Recap

The engine is a pure TypeScript library: no I/O, no clock, no randomness, no mutation of inputs (return new state). It is part of the certified scope, so every change follows the critical path (KP-HBK-03 §2).

# 2. Module Plan

@widths 1.6,3.4
| Module | Responsibility |
|---|---|
| `cards.ts` | Card encoding (`rank * 4 + suit` in 0–51), parse/format `"Ah"`, deck constants (52, 36) |
| `eval/five.ts` | 5-card evaluation to a single comparable `number` (category in high bits, kickers below) |
| `eval/seven.ts` | Hold'em/Short Deck best of 7 (lookup-table evaluator; see §4) |
| `eval/omaha.ts` | Best of C(n,2) × C(5,3) combinations; worker-thread friendly |
| `rules/ranking.ts` | Category order tables: standard, shortdeck_trips, shortdeck_straight |
| `betting.ts` | Legal actions, min raise, pot-limit max, reopening rules (KP-ENG-06 §6) |
| `pots.ts` | Uncalled return, layered side pots, rake allocation, odd-chip distribution (§9–10) |
| `hand.ts` | The hand state machine: start → blinds → streets → showdown → result |
| `record.ts` | Immutable hand record (§11) |
| `index.ts` | `GameEngine` implementation (§12) |

# 3. State Shape

```ts
interface HandState {
  readonly config: TableConfig;              // variant, structure, blinds, antes, rake schedule snapshot
  readonly deck: readonly Card[];            // full ordered deck from rng (never sent to clients)
  readonly seats: readonly SeatState[];      // stack, committed, streetBet, folded, allIn, actedLevel, hole
  readonly button: SeatNo;
  readonly street: Street;
  readonly board: readonly Card[];
  readonly currentBet: bigint;
  readonly lastFullRaise: bigint;
  readonly toAct: SeatNo | null;
  readonly actions: readonly ActionRecord[];
  readonly deckIndex: number;                // next card to deal
}
```

`actedLevel` implements the incomplete-raise rule: a player may raise only if `currentBet − actedLevel ≥ lastFullRaise` (or they have not acted this street).

# 4. Evaluator Approach

- Hold'em: use a precomputed lookup-table evaluator (e.g. perfect-hash tables in the style of the widely used "two plus two"/Cactus Kev methods), generated at build time by a script and shipped as a typed array (~130 MB tables are too large for clients; use the compact hash-based variant ≈ 1–2 MB).
- Short Deck: separate tables generated with the Short Deck category order and the `A-6-7-8-9` straight.
- Omaha: iterate combinations using the 5-card evaluator; PLO6 showdowns (15 × 10 = 150 evaluations per player) run in a worker when more than 3 players reach showdown.
- **Differential test** against the Python reference and one independent open-source evaluator on 10^6 random hands (KP-ENG-06 §13).

# 5. Porting from the Reference

1. Read the reference function and its vectors; port logic, not syntax (bigint for money, integers for cards).
2. Run `pnpm vectors`; all vectors for that area must pass before moving on.
3. Add property tests for the invariants of the area.
4. When you find a disagreement, decide which is right using KP-ENG-06. If the reference is wrong, fix the reference first, regenerate vectors, and get a second approval (both are in the certified scope).

# 6. Pot Algorithm (from KP-ENG-06 §9)

```
contrib = committed per seat (after returnUncalled)
levels  = sorted distinct contributions of seats still in the hand
prev = 0
for level in levels:
    amount   = Σ over all seats of max(0, min(contrib, level) − prev)
    eligible = seats not folded with contrib ≥ level
    merge with the previous pot if eligible is identical, else push new pot
    prev = level
rake     = min(floor(total × bp / 10000), cap) if flop seen else 0
rakePart = floor(rake × pot / total) per pot, remainder from the main pot onwards
award each pot to best eligible hands; odd units to winners from the first seat left of the button
```

# 7. Performance Budget

- `apply()` for a betting action: < 20 µs p99; showdown NLHE 9 players: < 50 µs; PLO6 6 players: < 2 ms (worker).
- Avoid allocations in hot loops (reuse typed arrays); benchmark with `pnpm bench:engine` in CI (informational until GA gate).

# 8. Definition of Done for Engine Changes

- [ ] KP-ENG-06 updated if behaviour changed (with Head of Poker and compliance approval)
- [ ] Reference updated and vectors regenerated
- [ ] TypeScript passes vectors, property tests (nightly 10^6), differential tests
- [ ] House Rules (KP-LEG-07) reviewed for player-facing impact
- [ ] Certification impact assessment recorded (KP-ENG-13 §7)
