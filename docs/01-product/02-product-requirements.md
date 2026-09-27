---
id: KP-PRD-02
title: Product Requirements
subtitle: Epics, user stories and acceptance criteria
version: 1.0
owner: Head of Product
status: Draft
related: KP-PRD-03 Roadmap · KP-PRD-04 UX · KP-ENG-03 API · KP-ENG-06 Engine · KP-ENG-07 Lobby and Tournaments
---

# 1. How to Use This Document

Stories use `KP-US-nn`. Each has acceptance criteria (AC) written as testable statements. Release tags: **B** = Play Money Beta, **R1** = first Real Money launch, **R2** = network/B2B, **R3** = later. Detailed rules live in the engineering documents; this document states what the player or staff member must be able to do.

# 2. Epics

@widths 0.5,1.7,2,0.8
| # | Epic | Summary | Release |
|---|---|---|---|
| E1 | Account and security | Phone registration, login, devices, step-up, recovery | B |
| E2 | Lobby and discovery | Pools, filters, favourites, search, quick seat | B |
| E3 | Cash games | Tables, seating, buy-in, top-up, multi-table | B |
| E4 | Fast formats | Fast-fold, AOF, Spins | B (Spins R1 where permitted) |
| E5 | Tournaments | SNG, MTT, re-entry, PKO, satellites, schedule | B |
| E6 | Player tools | Stats, HUD, notes, replayer, hand history, verify hand | B |
| E7 | Wallet and cashier | Balances, deposits, withdrawals, statements | R1 (Play top-up at B) |
| E8 | Compliance and responsible gaming | KYC, jurisdiction, limits, reality checks, exclusion | R1 (limits at B) |
| E9 | Rewards and social | Summit Rewards, missions, leaderboards, clubs | B/R1 |
| E10 | Integrity | Reports, protections, enforcement notices | B |
| E11 | Back-office | Support, game ops, risk, finance, compliance tools | B/R1 |
| E12 | Operator network | Skins, launch, wallets, operator back-office | R2 |

# 3. E1 — Account and Security

- **KP-US-01** As a new player, I register with my phone number and an OTP so that I can play within 2 minutes.
  - AC: OTP by SMS or WhatsApp; screen name uniqueness checked live; terms acceptance recorded with version; logged in on success.
- **KP-US-02** As a player, I log in on a new phone and confirm with an OTP or passkey.
- **KP-US-03** As a player, I see and remove my active devices and can log out everywhere.
- **KP-US-04** As a player, I recover my password with an OTP; my withdrawals are paused for 24 h for safety and I am told why.
- **KP-US-05** As a Real Money player, I confirm sensitive actions (withdrawal, new payout number) with step-up verification.

# 4. E2 — Lobby and Discovery

- **KP-US-10** As a player, I see only games available in my country, grouped by format, with stakes in my pool currency and an approximate local-currency hint.
- **KP-US-11** As a player, I tap "Quick seat" and am seated at a suitable table for my chosen game and stake within 10 s.
- **KP-US-12** As a player, I filter by variant, stakes, table size and speed; I save favourites.
- **KP-US-13** As a player, I see tournament schedules in my local time with guarantees, buy-ins, late-reg status and my registrations.

# 5. E3 — Cash Games

- **KP-US-20** As a player, I sit at a table with a buy-in within the allowed range; rathole rules are explained if they apply.
- **KP-US-21** As a player, I act with fold/check/call/bet/raise, bet presets and a slider; I see time left and time bank.
- **KP-US-22** As a player, I pre-select actions (check/fold, call any) that apply only when still valid.
- **KP-US-23** As a player, if my connection drops, I return to the same table state automatically.
- **KP-US-24** As a player, I play up to 4 tables on my phone and switch with a swipe; I am alerted when it is my turn at another table.
- **KP-US-25** As a player, I can agree to run it twice at tables that offer it.
- **KP-US-26** As a player, I top up between hands and stand up; my stack returns to my balance immediately after the hand.

# 6. E4 — Fast Formats

- **KP-US-30** As a player, I join a fast-fold pool and, when I fold, I get a new hand at another table in under 3 s.
- **KP-US-31** As a player, I play All-in or Fold with a fixed stack and only two buttons.
- **KP-US-32** As a player, I register for a Spin, see the multiplier revealed, and see the published paytable and RTP before I play.

# 7. E5 — Tournaments

- **KP-US-40** As a player, I register (cash or ticket), unregister before the start, and re-enter during late registration.
- **KP-US-41** As a player, I see my rank, average stack, blind level, next break and payouts at any time.
- **KP-US-42** As a player, in a PKO I see bounties on each opponent and receive my share instantly when I eliminate someone.
- **KP-US-43** As a player, I win satellite tickets that appear in my wallet and can be used for the target event.
- **KP-US-44** As a tournament director, I pause, resume and (with approval) cancel a tournament, and players are informed automatically.

# 8. E6 — Player Tools

- **KP-US-50** As a player, I see a built-in HUD with basic statistics for opponents, the same for everyone.
- **KP-US-51** As a player, I add notes and colour tags to opponents.
- **KP-US-52** As a player, I replay any of my hands, see my session results and download my hand history.
- **KP-US-53** As a player, I verify a hand's fairness with one tap (deck commitment check) and see the explanation.
- **KP-US-54** As a player, I see my statistics by game and period (VPIP, PFR, results, rake paid).

# 9. E7 — Wallet and Cashier

- **KP-US-60** As a player, I deposit with M-Pesa/MoMo/Airtel Money by confirming a prompt on my phone; my balance updates within seconds.
- **KP-US-61** As a player, I see any fee, FX rate and tax before I confirm a deposit or withdrawal.
- **KP-US-62** As a player, I withdraw to my verified mobile-money number; typical withdrawals arrive within 15 minutes.
- **KP-US-63** As a player, I see a clear statement: deposits, withdrawals, sessions, tournaments, rewards, taxes.
- **KP-US-64** As a Play Money player, I get free chips when my balance is low (limited frequency).

# 10. E8 — Compliance and Responsible Gaming

- **KP-US-70** As a player, I complete KYC in the app with my ID and a selfie; I see my status and what is missing.
- **KP-US-71** As a player, I set deposit, loss and session-time limits; decreases apply immediately, increases after the cooling period.
- **KP-US-72** As a player, I receive reality checks showing time played and net result; I can take a break (cool-off) or self-exclude in two taps.
- **KP-US-73** As a compliance officer, I change a jurisdiction policy with a second approver and it takes effect within a minute.

# 11. E9 — Rewards and Social

- **KP-US-80** As a player, I see my Summit Rewards tier, points and next weekly cash-back.
- **KP-US-81** As a player, I complete missions and claim rewards.
- **KP-US-82** As a club owner, I create a private club, invite friends and run private tables within allowed limits.
- **KP-US-83** As a player, I use emoji reactions and filtered chat, and I can mute anyone.

# 12. E10 — Integrity

- **KP-US-90** As a player, I report a suspicious player from the table or hand history with a category and comment.
- **KP-US-91** As a player, I am never seated with accounts linked to me, and I receive refunds when cheaters who played against me are confirmed.
- **KP-US-92** As an integrity analyst, I review cases with full replays, metrics and the account graph and record decisions with reasons.

# 13. E11 — Back-office

- **KP-US-100** As a support agent, I see a 360° view of a player (with masked personal data) and act within my permissions.
- **KP-US-101** As a risk analyst, I review withdrawals with the triggered rules and decide with a note.
- **KP-US-102** As game ops, I manage table templates, schedules and guarantees within budget.
- **KP-US-103** As finance, I see daily reconciliation, coverage and GGR reports.

# 14. E12 — Operator Network (R2)

- **KP-US-110** As an operator, I launch poker for my logged-in players without a second login.
- **KP-US-111** As an operator, I integrate a seamless wallet and my players use one balance.
- **KP-US-112** As an operator, I see my players' activity, revenue and monthly settlement statements.

# 15. Out of Scope (for now)

Fixed-limit games, Hi-Lo variants, Stud and Draw games, bomb pots, all-in insurance/cash-out, crypto payments, in-game real-time coaching in Real Money, desktop downloadable client, spectator betting, Bridge (after poker launch, gate G4).
