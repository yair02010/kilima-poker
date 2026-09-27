---
id: KP-LEG-07
title: House Rules and Fair Play
subtitle: Player-facing poker rules, prohibited tools, malfunctions, tournament rules and fairness verification
version: 0.1
owner: Head of Poker / Compliance Officer
status: DRAFT for counsel and test-lab review
banner: **DRAFT.** Player-facing summary of the normative engine rules (KP-ENG-06) and tournament rules (KP-ENG-07). This document is part of the certified scope (KP-ENG-13 §7) once approved.
---

# 1. General

- Games: No-Limit Hold'em, Pot-Limit Omaha (4, 5 and 6 cards), Short Deck Hold'em. Formats: cash, fast-fold, All-in or Fold, Sit & Go, Spins, tournaments, private clubs (where permitted).
- The software enforces all rules; actions out of turn or illegal amounts are not possible.
- English is the governing language of these rules; translations are provided for convenience.

# 2. Dealing and Fairness

- Cards are shuffled by a certified random number generator before each hand; the whole deck is fixed before the first card is dealt.
- **Verify any hand:** at the start of each hand we publish a fingerprint (commitment) of the shuffled deck. After the hand, you can see the full deck and check that it matches. The app has a "Verify" button; the method is: `SHA-256(deckId | cards | salt)` must equal the commitment.

# 3. Betting

- No-Limit: bet any amount up to your stack. Minimum raise = the size of the last full bet or raise on the street.
- Pot-Limit: maximum raise = the pot after you call.
- An all-in that is less than a full raise does not reopen betting for players who already acted.
- Big blind has the option to raise when players limp. Heads-up: the button is the small blind and acts first before the flop.

# 4. Hand Rankings

Standard rankings apply. Omaha hands use exactly two hole cards and three board cards. Short Deck: flush beats full house, three of a kind beats straight (unless the table shows "straight beats trips"), and A-6-7-8-9 is a straight.

# 5. Showdown, Pots and Rake

- The last aggressor shows first; otherwise the first player left of the button. Losing hands may be mucked; hands in an all-in are shown.
- Side pots are formed when players are all-in for different amounts. Odd chips go to the first winner left of the button.
- Rake: [5 %] of pots that see a flop, capped per stake and number of players (table in the lobby). No flop, no drop. Tournament fees are shown with the buy-in (e.g. 10 + 1).

# 6. Time, Disconnection and Sitting Out

- You have [15] seconds per action plus a time bank. When time runs out, you check if possible, otherwise fold.
- There is no all-in protection for disconnections. Keep your app updated and your connection stable.
- In cash games you are removed after [10] minutes sitting out; your chips return to your balance.

# 7. Tournaments

- Late registration, re-entry, rebuys, add-ons and bounties as stated in each tournament's lobby.
- Players eliminated in the same hand finish in order of their chip counts at the start of the hand; ties share the prizes.
- Hand-for-hand play applies near the money.
- **Cancellation:** if a tournament cannot continue because of a technical problem, [players still in receive a share of the remaining prize pool based on chip counts, with a minimum of the next pay jump for those in the money; players out before the cancellation keep their winnings]; refunds are made for tournaments cancelled before the start.
- Deals at final tables are allowed only where offered and when all remaining players agree.

# 8. Spins

The prize multiplier is drawn by the certified RNG when the Spin is full. The paytable and return to player are shown in the lobby.

# 9. Fair Play

@widths 1.6,3.4
| Allowed | Not allowed |
|---|---|
| Kilima's built-in HUD, notes and statistics | Bots, scripts or automation of any kind |
| Studying your own hand histories after play | Real-time assistance tools, solvers or AI while playing |
| Post-session review tools that import your own hands | Third-party real-time HUDs or data-mining of hands you did not play |
| Playing up to the allowed number of tables | Sharing hole cards or strategy during a hand (collusion) |
| | Letting another person play your account; having more than one account |
| | Deliberately losing chips to another player (chip dumping) |

Suspected breaches can be reported from the table or hand history. Confirmed cheating leads to account closure, confiscation of unfair winnings and their redistribution to affected players.

# 10. Malfunctions

A malfunction voids all plays and payouts of the affected hand; chips committed are returned. We publish a notice for significant incidents and make players whole according to these rules.
