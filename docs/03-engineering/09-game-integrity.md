---
id: KP-ENG-09
title: Game Integrity and Anti-Cheat
subtitle: Bots, real-time assistance, collusion, multi-accounting and chip dumping — prevention, detection, review and enforcement
version: 1.0
owner: Head of Game Integrity
status: In review
related: KP-ENG-07 Seating Rules · KP-ENG-08 Wallet (locks) · KP-ENG-16 Data Platform and AI · KP-SEC-04 Fraud · KP-LEG-07 House Rules
---

# 1. Why This Matters

A poker economy survives only if recreational players trust it. The biggest threats are not hackers reading cards (the server design prevents that) but players who gain an unfair edge: **bots**, **real-time assistance (RTA) software**, **collusion** between players at the same table, **multi-accounting**, and **chip dumping** used for money laundering or bonus abuse. Kilima treats game integrity as a product and an operations function, not only a detection model.

# 2. Threats

@widths 1.5,2.5,1
| Threat | Description | Severity |
|---|---|---|
| Bot | Software plays the account, fully or partly | Critical |
| Real-time assistance (RTA) | A human plays while a solver or AI tool suggests actions | Critical |
| Collusion (information sharing) | Two or more players at one table share hole cards (chat app, phone, same room) | Critical |
| Soft play | Colluders avoid betting against each other | High |
| Chip dumping | Deliberately losing to transfer money (laundering, bonus conversion, stake transfer) | Critical |
| Multi-accounting | One person controls several accounts (seats at one table, bonus farming, ban evasion) | High |
| Ghosting / account sharing | Another, stronger person plays the account (often at final tables) | High |
| Seat-scripting / bumhunting | Automated or predatory seat selection to target weak players | Medium |
| Prohibited tools | Third-party real-time HUDs, trackers with real-time data, data mining of hands not played | Medium |
| Stalling and angle shooting | Abuse of time bank, disconnect abuse, collusive tournament stalling | Medium |
| Insider threat | Staff with access to hole cards or player data misusing them | Critical |

# 3. Layered Defence

@widths 1.2,3.8
| Layer | Controls |
|---|---|
| 1. Design | Server authority; hole cards only to owners; delayed observer streams; no player-to-player transfers; random seating by default; limited tables per player; no third-party HUD data export in real time |
| 2. Access | KYC in Real Money (one person, one account per operator network); device attestation; device, instrument, IP and household links; same-table restrictions (KP-ENG-07 §3.2) |
| 3. Real-time signals | Risk score per session from device integrity, client telemetry, timing and link signals; high risk → step-up, restricted pools or silent monitoring |
| 4. Post-hand detection | Statistical, graph and machine-learning detectors running on every hand (section 5) |
| 5. Human review | Integrity analysts with full-hand replays, account graphs and case tools; four-eyes on confiscation |
| 6. Enforcement | Warnings, restrictions, bans, fund locks, redistribution of confirmed ill-gotten winnings to affected players, publication of an integrity report |

# 4. Client Integrity and Telemetry

- **App attestation:** Android Play Integrity API verdict (device integrity, app recognised) at login and refreshed every 30 minutes; Real Money requires a passing verdict (configurable per jurisdiction, with a support path for legitimate devices). iOS App Attest when iOS launches. Web: bot-detection challenge and browser integrity signals; the web client is allowed only in pools where the policy permits it.
- **Tamper and emulator detection:** root/jailbreak, hooking frameworks, emulators, virtual devices, accessibility services that read the screen, screen-overlay apps active during play (Android), automation frameworks. The response is policy-driven: block Real Money play, require step-up, or monitor silently.
- **Telemetry** (`client:telemetry`, KP-ENG-04 §9): app focus and background changes during a decision, time-to-first-touch after `turn:start`, touch position buckets on action buttons, bet-slider interaction patterns, number of tables open, network type. Raw coordinates are bucketed on the device; no screen content, contacts or unrelated app data is collected. The data processing is described in the privacy policy (KP-LEG-02) and reviewed by the DPO.
- **Server-side timing** (authoritative): decision time per action measured by the server, including time-bank use.

# 5. Detection

Detectors run in the `integrity` service (streaming, triggered by `hand.completed`) and in nightly batch jobs in the data platform (KP-ENG-16). Each detector produces a score with evidence; scores are combined into cases.

## 5.1 Bots and RTA

@widths 1.6,2.6,0.9
| Detector | Method | Minimum data |
|---|---|---|
| Timing profile | Distribution of decision times by street, action and situation complexity versus the population and the player's own history; very low variance or no correlation between difficulty and time is suspicious | 2,000 decisions |
| Solver proximity | Compare decisions in common, solver-covered spots (pre-flop ranges, flop c-bet frequencies, bet sizing) with a library of equilibrium strategies; flag frequencies and sizing precision far above the player's rating band and far above human baselines | 5,000 hands |
| Sizing fingerprint | Use of non-standard bet sizes exactly matching solver outputs (e.g. 33 %/75 %/125 % pot with high precision) | 1,000 bets |
| Session behaviour | Session length, number of tables, 24/7 activity patterns, reaction to breaks, identical behaviour across accounts | 30 days |
| Input telemetry | Touch/click position entropy, time-to-first-touch, app focus loss during decisions (possible RTA consultation) | 500 decisions |
| Challenge questions | Randomised, low-friction human checks (CAPTCHA-like) for sessions with high bot score; failure → review | on demand |
| Supervised model | Gradient-boosted classifier trained on confirmed bot/RTA cases and synthetic bot play generated internally (red team) | continuous |

## 5.2 Collusion and chip dumping

@widths 1.6,2.6,0.9
| Detector | Method | Minimum data |
|---|---|---|
| Co-occurrence | Pairs and groups that sit together far more often than random seating predicts, across tables and stakes | 14 days |
| Soft play | Pairs that rarely bet or raise against each other relative to their aggression against others; folding strong hands to a partner's bet | 300 shared hands |
| Information advantage | Win rate, fold decisions and all-in calls when a suspected partner is at the table versus when not; "superuser" style decisions that are only correct with knowledge of a partner's cards (checked with full hole-card data) | 500 shared hands |
| Squeeze play / whipsaw | Two players repeatedly raising with a third player trapped in between | 200 shared hands |
| Chip-flow graph | Directed graph of money flowing between accounts through pots and tournaments; flag one-way flows, flows following deposits, flows to accounts that withdraw soon after, and clusters (community detection) | 30 days |
| Dumping patterns | Large calls or shoves with weak hands against one opponent; heads-up tables between linked accounts; tournament "dumping" near the money | real time + 30 days |
| Linked accounts | Device, IP/ASN, instrument, KYC, household, behaviour-similarity links (graph) | real time |

## 5.3 Multi-accounting and ghosting

- Identity graph: shared devices, payment instruments (mobile-money number), KYC data, phone numbers, emails, addresses, IP ranges.
- Behavioural biometrics: a player whose playing style, timing and input profile changes abruptly (e.g. at a final table) is a ghosting candidate.
- Login from a new device during a deep tournament run triggers step-up and a review flag.

## 5.4 Thresholds and quality

- Detector thresholds are configuration, tuned on Beta data and red-team datasets before Real Money launch.
- Targets: fewer than 0.5 % of active Real Money players with an open case per month; at least 40 % of reviewed cases confirmed (precision); detection of internal red-team bots within 2,000 hands (recall target 90 %).
- Each detector has a model card (data, features, performance, known biases, review date) in the data platform (KP-ENG-16).

# 6. Cases and Review

1. Detectors create or update a **case** (`integrity.cases`) with type, severity, score and evidence (hands, metrics, graphs, telemetry summaries).
2. **Automatic protective actions** for critical scores: silent restriction to monitored tables, withdrawal hold (`lock` posting of the amount under review, not the whole balance unless justified), and seating restrictions against linked accounts. Players are not told about silent monitoring.
3. **Review:** analysts work a queue ordered by severity and money at risk. The review tool shows full-hand replays with all hole cards, decision-time overlays, solver-deviation overlays, the account graph and prior cases. An LLM assistant (KP-ENG-16 §6) drafts a case summary from the evidence; it never makes the decision.
4. **Decision:** `dismissed` or `confirmed` with actions. Confiscation and redistribution need a second analyst (four-eyes) and, above a threshold, the Head of Game Integrity.
5. **Appeal:** the player may appeal once; a different analyst reviews it within 14 days.

# 7. Enforcement

@widths 1.5,3.5
| Action | Effect |
|---|---|
| Warning | Message to the player; case stays in history |
| Restriction | Limited formats, stakes, tables or pools; manual withdrawal review |
| Temporary suspension | Sessions revoked; login blocked until a date |
| Permanent closure | Account closed network-wide (all operators); KYC identity blocked from re-registering |
| Fund lock | `lock` posting of the relevant funds while the case is open |
| Confiscation and redistribution | Confirmed ill-gotten winnings are removed and **returned to the affected players** in proportion to their losses to the offenders (ledger postings `integrity_confiscation` and `integrity_redistribution`); deposits that were not won unfairly are returned to the offender subject to the Terms and AML obligations |
| Reporting | Where required: suspicious transaction reports (AML, KP-LEG-04) and notifications to the regulator; confirmed bot and collusion statistics published quarterly in an integrity report |

All decisions and actions are written to the audit log.

# 8. Insider Threat

- Hole cards of live hands are available only in table-server memory and to the owning player; integrity staff see hole cards **only for completed hands**.
- Access to completed-hand hole cards is logged per request, limited to assigned cases, and reviewed monthly; bulk export requires two approvals.
- Staff accounts cannot hold Real Money player accounts on the platform (KYC match check); staff and their households are excluded from play under the Terms.
- Production database access is just-in-time, approved, recorded, and never includes the ability to change ledger rows (KP-SEC-03).

# 9. Integrity Team and Operations

- Roles: Head of Game Integrity, integrity analysts (follow-the-sun coverage at GA), data scientists, red team (builds test bots and collusion scenarios), and a liaison to compliance/AML.
- SLAs: critical case first action within 1 hour; review within 24 hours; high within 72 hours.
- Weekly calibration: sampled closed cases are re-reviewed; detector precision and recall are tracked; thresholds are changed only through a reviewed configuration change.
- Operators (B2B) receive enforcement notices for their players and cannot override network-wide closures.

# 10. Roadmap

@widths 1.2,3.8
| Stage | Scope |
|---|---|
| Alpha / Beta (Play Money) | Seating restrictions, device and link graph, timing profiles, co-occurrence, chip-flow graph, case tool with replays, player reports; red-team bots to calibrate |
| Real Money launch | Attestation enforcement, telemetry, solver-proximity, soft-play and information-advantage detectors, withdrawal holds, confiscation and redistribution workflow, LLM case summaries |
| GA + 6 months | Supervised bot/RTA model on confirmed cases, behavioural biometrics for ghosting, cross-operator intelligence sharing (with legal basis), quarterly integrity report |
