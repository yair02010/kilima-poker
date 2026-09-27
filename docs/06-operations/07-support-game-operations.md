---
id: KP-OPS-07
title: Customer Support and Game Operations
subtitle: Player support, tournament direction, table and schedule management, player care and escalations
version: 1.0
owner: Head of Operations
status: Draft
related: KP-LEG-07 House Rules · KP-LEG-05 Responsible Gaming · KP-ENG-07 Tournaments · KP-SEC-04 Fraud
---

# 1. Support Model

@widths 1.4,3.6
| Item | Design |
|---|---|
| Channels | In-app chat (primary), WhatsApp Business, email; phone call-back for account recovery and player care |
| Languages | English, French, Portuguese, Swahili; more by market |
| Hours | 07:00–01:00 local time at Beta; 24/7 at Real Money launch for chat and payments |
| Tiers | Tier 1 agents (general, cashier questions); Tier 2 specialists (payments, KYC, game disputes); escalations to risk, integrity, game ops, compliance |
| Tools | Ticketing with the back-office 360° view, hand replayer, cashier status, macros, support copilot (KP-ENG-16 §6) |
| SLAs | Chat first response < 2 min (80 %); email < 4 h; payment issues resolved < 24 h; game disputes < 48 h |

Support agents cannot: change phone numbers without KYC re-verification, raise limits, reverse results, release integrity holds, or reveal other players' hole cards or integrity information.

# 2. Common Procedures

- **Missing deposit:** check payment status and provider reference; trigger status re-query; if confirmed by provider, credit is automatic; otherwise escalate to payments with the M-Pesa/MoMo transaction code from the player.
- **Withdrawal delay:** explain review steps without revealing risk rules; escalate after SLA.
- **Game dispute:** retrieve the hand; explain the rule (House Rules reference); decisions on malfunctions are made by game ops.
- **Disconnection complaints:** explain the no-all-in-protection rule; check platform incidents for that time; compensation only per the malfunction policy.
- **Account recovery:** KP-SEC-04 §3 and RB-09.
- **Responsible gaming:** any sign of harm (player says they cannot stop, chasing losses, distress) → player-care escalation; agents can apply cooling-off at the player's request immediately.

# 3. Game Operations

@widths 1.4,3.6
| Function | Responsibilities |
|---|---|
| Schedule management | Tournament schedule per pool, guarantees within budget, series planning, satellite ladders, Spin paytable activation (certified versions only) |
| Tournament directors | Live monitoring of running tournaments, pauses, rulings (House Rules), cancellations with four-eyes, communication to players |
| Table management | Table templates, stakes, minimum open tables, fast-fold pool sizes by hour, private club limits |
| Liquidity analytics | Waitlists, fill rates, peak/off-peak, recommendations (with data team) |
| Malfunction handling | Decide voiding/compensation per House Rules, document every decision |

Tournament directors work in shifts covering all scheduled tournaments; a senior TD is on call for escalations.

# 4. Player Care (responsible gaming operations)

- Monitor alerts from the responsible-gaming model; contact players with high risk markers in a supportive way; offer limits and cooling-off; apply mandatory measures where regulations require.
- Handle self-exclusion requests immediately; confirm in writing; stop marketing.
- Staff training on recognising harm and on local support resources in each country.

# 5. Quality and Training

- Onboarding training: products, House Rules, payments per country, security/fraud awareness, responsible gaming, data protection.
- Quality assurance: 5 % of interactions reviewed weekly; CSAT after contacts; monthly calibration.
- Knowledge base maintained with every release (KP-QA-02 §4).

# 6. Metrics

Contacts per 1,000 active players, top contact reasons, first-contact resolution, CSAT, SLA attainment, payment-issue resolution time, dispute outcomes, player-care interventions and outcomes, tournament incidents per 1,000 tournaments.
