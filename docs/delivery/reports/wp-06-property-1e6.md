# WP-06 slice 3 — 10^6-hand property run

Date: 2026-09-29 · Engine: `packages/engine-poker` (branch `wp-06/3-property-tests-at-scale`) · Machine: Cowork build VM, 2 vCPU, Node 24.21
Command: `pnpm --filter @kilima/engine-poker property 200000 <firstSeed>` × 5 (seeds 1–1,000,000; the nightly workflow runs the million in one job)

| Measure | Result |
|---|---|
| Random hands | **1,000,000** (seeds 1–1,000,000) |
| Variants | nlhe 374,692 · plo4 250,377 · plo5 125,789 · plo6 124,519 · short deck 124,623 |
| Outcomes | showdown 882,737 · won without showdown 117,263 |
| Legal actions applied | 9,518,030 |
| Illegal attempts (all rejected, state unchanged) | 2,380,030 |
| Invariants broken | **0** |
| `applyAction` latency (5 % sample, 475,742 actions) | p50 ≤ 1.24 µs · p99 ≤ 5.62 µs (budget p99 < 20 µs) |
| Wall time | 368.2 s |

Invariants checked on every hand (test/property/invariants.ts): chips conserved after every action and at settlement (final stacks + rake = start); no negative stacks or contributions; only legal actions accepted and a rejected action never changes the state; inputs never mutated; the hand terminates; showdown has a full board and a fold-out exactly one live player; every card dealt at most once; no pot awarded to a folded or ineligible seat; every pot fully paid (winners + rake); no rake without a flop, never above the cap or the percentage; at most one uncalled bet returned.

Configurations are random per hand: 2–9 players (≤ 6 for PLO6), NL and PL, blinds 1/2 to 500/1000, none / per-player ante / big-blind ante, rake 0–10 % with caps 0–5 BB or none, Short Deck with and without `straightBeatsTrips`, and one stack in five between 1 chip and 3 BB (short-stack all-ins).
