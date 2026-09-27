---
id: KP-PRD-04
title: UX Flows and Screens
subtitle: Screen inventory, key flows, table specification and required states
version: 1.0
owner: Head of Product / Lead Designer
status: Draft — wireframes and prototypes to be produced from this specification
related: KP-PRD-02 Requirements · KP-ENG-15 Client Applications · KP-LEG-05 Responsible Gaming
---

# 1. Design Principles

- **Thumb-first:** all table actions reachable with one thumb in portrait mode; landscape optional.
- **Clarity over decoration:** stack sizes, pot, amounts to call and time left are always readable; four-colour deck option.
- **Honest money:** every amount shows its currency; fees, FX and taxes appear before confirmation.
- **Light on data:** data-saver mode is one toggle; avatars and animations degrade gracefully.
- **Kilima brand:** navy (#10213D), mountain blue (#3A6FD8), sun gold (#FFD166); calm, confident tone.

# 2. Screen Inventory

@widths 0.5,1.6,2.9
| # | Screen | Notes |
|---|---|---|
| S01 | Splash / update | Forced update, maintenance banner |
| S02 | Welcome and language | EN/FR/PT/SW, Play vs Real mode explanation |
| S03 | Register (phone, OTP, profile) | WhatsApp OTP option; age confirmation |
| S04 | Login / step-up | Passkey, OTP, new-device notice |
| S05 | Home / lobby | Format tabs (Cash, Fast-fold, Spins, SNG, Tournaments), quick seat, balances |
| S06 | Game list and filters | Stakes, variant, size, speed, favourites |
| S07 | Tournament lobby | Schedule, details, structure, payouts, entrants, tables, registration |
| S08 | Table | Section 4 |
| S09 | Multi-table switcher | Swipe, turn indicators, mini-tables |
| S10 | Hand history and replayer | Verify-hand action |
| S11 | Profile and statistics | HUD settings, notes |
| S12 | Cashier — deposit | Methods by country, amount presets, STK push waiting state |
| S13 | Cashier — withdraw | Verified instruments, step-up, status timeline |
| S14 | Wallet statement | Filters, export |
| S15 | Verification (KYC) | Provider SDK, status and missing steps |
| S16 | Responsible gaming | Limits, reality checks, cool-off, self-exclusion, activity statement |
| S17 | Rewards and missions | Tier, points, cash-back, missions, leaderboards |
| S18 | Clubs | Create, invite, club tables |
| S19 | Notifications inbox | |
| S20 | Help and support | Articles, chat, WhatsApp |
| S21 | Settings | Language, deck, sounds, data saver, security centre |

# 3. Key Flows

## F1 — First hand (target: under 2 minutes)

Welcome → phone → OTP → screen name + password → Play Money chips credited → quick seat at a Play Money fast-fold table → tutorial overlays on the first hand (skippable).

## F2 — First deposit (Real Money)

Cashier → method (M-Pesa) → amount → summary (fee, FX, tax) → "Check your phone" state with countdown → success animation and balance → suggested game. Failure states: cancelled on phone, insufficient funds, timeout, provider down — each with a clear next step.

## F3 — Withdrawal

Cashier → withdraw → instrument (verified) → amount → step-up → status timeline (requested → checks → sent → completed) with push notifications.

## F4 — Reconnect

Connection lost banner within 2 s → automatic retry → table restored with a "you missed" summary (actions that happened while away) → if the player timed out, a clear note.

## F5 — Report a player

From the table seat menu or hand history → category → optional comment → confirmation that the team will review (no promise of outcome).

## F6 — Take a break

From anywhere: profile → responsible gaming → cool-off 24 h / 7 d / 30 d → confirmation that explains the effect (cannot be undone) → logout of tables after current hands.

# 4. Table Screen Specification (S08)

## Layout (portrait, 6-max)

- Seats around an oval table; hero seat at the bottom centre; opponents show avatar, screen name, stack, HUD badge (optional), timer ring.
- Centre: board cards, pot(s) with side-pot labels, rake not shown during the hand (shown in history).
- Bottom: hole cards (large), hand-strength label, action bar (Fold / Check-Call / Bet-Raise), bet presets (½ pot, ⅔ pot, pot, all-in; configurable), slider with numeric entry.
- Top bar: table name and stakes, leave/stand, menu (settings, rules, rake info, report, verify last hand), multi-table indicator.

## States that must be designed

Waiting for players; waiting for big blind; sitting out; your turn (with haptics); time bank running; all-in and run-out (with equity display only after all-in, if enabled by policy); run it twice offer; showdown; win animation; hand voided; table paused; disconnected/reconnecting; tournament break; hand-for-hand; moved to new table; eliminated; balance insufficient for top-up; limit reached; reality check dialog.

# 5. Content and Tone

- Plain language, short sentences, localised idioms reviewed by native speakers.
- Never pressure players ("last chance", countdowns for deposits); never imply that poker is a way to earn income.
- Error messages say what happened and what to do next; they never blame the player.

# 6. Deliverables from Design

Design system (tokens per brand), interactive prototype of F1–F6 and the table, animation specifications (with low-data variants), accessibility annotations, localisation length tests (FR and PT expansion), white-label theming examples.
