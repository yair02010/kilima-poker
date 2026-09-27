---
id: KP-ENG-07
title: Lobby, Tables and Tournaments
subtitle: Liquidity pools, seating, fast-fold, Sit & Go, Spins and multi-table tournaments
version: 1.0
owner: Tech Lead — Game
status: In review
related: KP-ENG-06 Poker Game Engine · KP-ENG-04 Real-time Protocol · KP-ENG-08 Wallet · KP-ENG-09 Integrity · KP-FIN-04 Rake and Revenue
---

# 1. Goals

- Put players into good games fast: a cash seat in under 10 s, a fast-fold hand in under 3 s, a Spin in under 60 s at target liquidity.
- Keep games healthy: prevent predatory seating, table-hopping abuse, ratholing and collusion-friendly seating.
- Scale from one small pool to a network of operators without changing the design.
- Keep every rule a configuration value owned by Game Operations (`game_ops` role), changed through the back-office with an audit trail.

# 2. Liquidity Pools and Jurisdictions

A **pool** is the unit of shared liquidity: `{ id, currency, mode, allowedJurisdictions[], allowedOperators[], games[] }`.

- Every table, fast-fold pool, Sit & Go queue and tournament belongs to exactly one pool.
- A player sees and joins only pools where their jurisdiction (from `compliance`) and operator are allowed. The check is repeated on every seat, registration and re-entry, not only in the lobby.
- Play Money has its own pools in the Play deployment.
- Example launch set (to be confirmed with counsel, KP-LEG-01): `usd-intl` (USD, all enabled jurisdictions that allow shared international liquidity) and one local-currency pool per jurisdiction that requires ring-fenced play.

# 3. Cash Games

## 3.1 Table catalogue

- Stakes, variants, max players (2, 6, 9), buy-in range (default 40–100 big blinds; deep tables up to 200), rake schedule and optional features (straddle, run it twice) are configured per pool as **table templates**.
- The `lobby` service keeps enough tables open: for each template, when fewer than 1 table has at least 2 free seats, a new table is created; empty tables close after 10 minutes. Minimum one open table per template during configured hours.
- The lobby list shows: stakes, players seated / max, average pot, players per flop, hands per hour and waitlist. Values are computed by `table-server` over the last 30 minutes.

## 3.2 Seating rules

@widths 1.8,3.2
| Rule | Default |
|---|---|
| Seat choice | Random free seat by default ("quick seat"); manual seat choice enabled per pool |
| Tables per player | Up to 4 cash tables simultaneously on mobile, 8 on web (configurable); fast-fold counts as one table per pool entry, maximum 2 entries |
| Same-table restrictions | Two accounts that share a device, a payment instrument, a KYC identity, a household (address), or an open integrity link cannot sit at the same table (KP-ENG-09) |
| Waitlist | FIFO per table or per template ("first available"); a seat offer is held 20 s |
| Rathole protection | A player who leaves a table and returns to the same stake within 60 minutes must buy in for at least the stack they left with |
| Top-up | Between hands only; up to the maximum buy-in |
| Seat-hopping | A player may not take a seat directly to the left of the same player more than 3 times in 24 h at the same stake (anti-bumhunting/anti-collusion heuristic, configurable) |
| Heads-up tables | Players must play at least 10 hands or 5 minutes before leaving a heads-up table they opened, to reduce "hit and run" predation (configurable) |

## 3.3 Buy-in and cash-out

1. `table:sit { tableId, seat?, buyIn }` → `lobby` reserves the seat for 20 s → `compliance` check (jurisdiction, limits, self-exclusion) → `wallet` posts `table_buyin` (available → `table:{tableId}:{accountId}`) with idempotency key `sit:{reservationId}` → the table actor seats the player.
2. Leaving (`table:stand`) or removal after sitting out → at the end of the current hand the actor asks `wallet` to post `table_cashout` of the current stack.
3. A table-server crash never loses chips: stacks are the ledger balances after the last settled hand; the unfinished hand is voided and its bets returned (KP-ENG-08 §5.4).

# 4. Fast-Fold ("Kilima Flow")

- A fast-fold pool has one stake and variant and many virtual tables. Players buy into the **pool**, not a table.
- On fold (even before their turn, "fast fold"), the player is immediately removed from the hand and placed in the queue for the next hand; their future actions in the old hand are ignored.
- **Seating algorithm (every 250 ms per pool):** take waiting players in FIFO order; form tables of the configured size (6); randomise seats; enforce same-table restrictions; assign the button to the player who waited longest for a big blind balance; deal.
- Blinds: each player's blind obligation is tracked per pool entry so that blinds are paid in fair rotation even though tables change every hand.
- Minimum pool size to start: 12 players (configurable). Below that, the pool shows "gathering players".
- Fast-fold hands are normal hands for settlement: each has its own virtual table account; stacks move between virtual tables through the pool account `fastfold:{poolEntryId}` without leaving the ledger.

# 5. All-in or Fold (AOF)

Heads-up and 6-max tables with a fixed stack (e.g. 10 big blinds); legal actions are `fold` and `allin` (big blind may check when unraised). A player re-buys to the fixed stack automatically between hands if they choose. Fast-fold AOF pools are supported with the same algorithm as section 4.

# 6. Sit & Go and Spins

## 6.1 Sit & Go

- Formats: heads-up, 6-max, 9-max; speeds regular, turbo, hyper; configurable blind structures and payouts.
- Registration posts `tournament_entry` (buy-in to the SNG prize pool account, fee to rake). The SNG starts when full; unregistering before the start refunds the entry and the fee.
- Players are seated randomly with same-table restrictions; a group that would violate restrictions waits for the next SNG.

## 6.2 Spins ("Summit Spins")

- Three-handed hyper-turbo SNGs with a **prize multiplier drawn by the certified RNG** when the Spin is full, before the first hand.
- The paytable (multipliers and probabilities per million, prize split) is configuration approved by finance and compliance and certified by the test lab. Its return to player (RTP) is computed exactly by the reference implementation and published in the lobby.
- The multiplier draw is logged in the RNG audit log together with the Spin id and the paytable version.

@widths 1.2,1.4,1.4,1
| Multiplier | Probability (per million) | Prize split | Note |
|---|---|---|---|
| 2× | 750,000 | Winner takes all | Illustrative paytable in `test_vectors.json` |
| 3× | 180,000 | Winner takes all | |
| 5× | 50,000 | Winner takes all | |
| 10× | 15,000 | Winner takes all | |
| 25× | 4,000 | 80 / 10 / 10 % | |
| 100× | 900 | 80 / 10 / 10 % | |
| 1000× | 100 | 80 / 10 / 10 % | |

The illustrative paytable has an RTP of 91.0 % of buy-ins (the fee is inside the multiplier edge). Spins have a lottery element; they are offered only in jurisdictions where counsel confirms they are permitted.

# 7. Multi-Table Tournaments

## 7.1 Types and options

@widths 1.5,3.5
| Option | Values |
|---|---|
| Entry | Freeze-out, re-entry (max N, until the end of late registration), rebuy + add-on |
| Bounty | None, fixed bounty, progressive knock-out (PKO: 50 % of the bounty paid in cash on elimination, 50 % added to the eliminator's own bounty) |
| Guarantee | Guaranteed prize pool (overlay paid by the house promotion account, KP-FIN-04) |
| Satellites | Prize = tickets (seats) to a target tournament; excess value paid in cash or tournament money |
| Structure | Starting stack, level duration, blind/ante schedule, breaks (5 min per hour, synchronised), late registration period |
| Payouts | Percentage of the field paid (default 15 %), payout curve by field size (config table), min-cash ≥ 1.5× buy-in |
| Final table | Optional deal-making (ICM or chip-chop) in cash tournaments when all players agree and the pool allows it |

## 7.2 Lifecycle

`scheduled → registering → late_registration → running → final_table → completed` (or `cancelled`).

- **Start:** the tournament service creates tables (randomised seating with restrictions), and each table actor starts hands on the same level clock.
- **Clock:** the tournament service owns one clock per tournament; levels change between hands at every table (a hand in progress finishes at the old level).
- **Table balancing:** after each hand, tables whose player count differs by more than 1 from the others are balanced by moving the player who will be big blind next from the largest table to the position at the smallest table that pays blinds most fairly (TDA practice). Tables are broken when players fit into one fewer table, breaking the table with the fewest players.
- **Hand-for-hand:** near the money bubble (and for satellites near the last seat), all tables play hand-for-hand: each table waits after every hand until all tables have finished; players eliminated in the same hand-for-hand hand share the prizes of their places.
- **Elimination order:** players eliminated in the same hand at the same table are ranked by chips at the start of the hand (more chips → better place).
- **Disconnection:** a disconnected player is dealt in and folded on timeout; blinds and antes are posted automatically.
- **Pause and cancellation:** game ops can pause a tournament (all tables finish the current hand). A cancelled tournament is settled according to KP-LEG-07: refund for players who are out early, and a chip-proportional distribution of the remaining prize pool, as configured.

## 7.3 Money flows

- Entry, re-entry, rebuy and add-on: `tournament_entry` (buy-in → `tournament:{id}:pool`, fee → house rake).
- Bounties: the bounty part of the entry goes to `tournament:{id}:bounty`; each knock-out posts `tournament_bounty` to the eliminator.
- Prizes: `tournament_prize` from the pool to the winners when the tournament ends (and progressively as players cash in large-field events, configurable to "pay on elimination").
- Guarantee overlay: `tournament_overlay` from `house:promo` to the pool before prizes are calculated.
- The pool account must be exactly 0 after the tournament is completed (reconciliation check).

## 7.4 Scale targets

- 10,000 entrants per tournament at Beta load test, 50,000 at GA (table actors spread across table-server pods; the tournament service coordinates through commands and events, not shared memory).
- Balancing decision time < 200 ms after each hand at 5,000 tables.

# 8. Private Clubs and Home Games

- A `club_owner` can create private tables and SNGs for club members with an invitation code.
- Real Money clubs are available only where the licence permits them; they use the same pools, restrictions, rake and integrity controls as public games (no private rake set by the owner; any club reward is paid by Kilima from rakeback rules).
- Play Money clubs are unrestricted within anti-abuse limits.

# 9. Monitoring

- Per template/pool: seats occupied, waitlist length, time to seat (p50/p95), hands per hour, average pot, rake per 100 hands, pool size (fast-fold), Spin fill time.
- Tournaments: registrations, late-reg entries, levels, table count, balancing moves, hand-for-hand duration, stuck tables.
- Alerts: time to seat p95 > 60 s for 15 min with waitlists; tournament table without a hand for > 3 minutes while running; pool account not zero after completion.
