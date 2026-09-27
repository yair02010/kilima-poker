---
id: KP-PRD-03
title: MVP Scope and Release Roadmap
subtitle: What ships in each release, and the gates between them
version: 1.0
owner: Head of Product
status: Draft
related: KP-PRD-02 Requirements · KP-PRJ-01 Project Plan · KP-OPS-06 Go-Live Readiness
---

# 1. Release Strategy

1. **Alpha (internal Play Money):** prove the engine, table experience and infrastructure with staff and invited players.
2. **Beta (public Play Money, gate G1):** build an audience and liquidity patterns in target markets; calibrate integrity; refine UX.
3. **R1 — Real Money launch (gate G3):** first licensed jurisdiction; B2C; mobile money.
4. **R2 — Network:** first B2B operators, shared liquidity, more jurisdictions.
5. **R3 — Expansion:** more formats and markets, iOS, Bridge integration (gate G4).

# 2. MVP (Beta) Scope

## In scope

- Android app and web app; EN/FR/PT/SW.
- Phone registration, login, devices, step-up; Play Money wallet with free top-ups.
- Cash: NLHE, PLO4, PLO5 (2, 6, 9-max); fast-fold NLHE and PLO4; AOF.
- SNG (heads-up, 6-max, 9-max), Spins (Play Money), MTT (freeze-out, re-entry, PKO, satellites for Play Money tickets).
- Built-in HUD, notes, replayer, hand history, verify-hand, statistics.
- Summit Rewards (Play Money points and cosmetic rewards), missions, leaderboards, clubs.
- Responsible-gaming tools (limits on time, reality checks, cool-off, self-exclusion) even in Play Money.
- Integrity MVP (KP-ENG-09 §10), player reports, back-office for support, game ops and integrity.

## Explicitly not in MVP

Real Money, KYC, cashier, B2B, Short Deck, PLO6, run it twice, straddle, iOS app.

## Beta exit criteria (towards G2/G3)

@widths 2.5,2.5
| KPI | Target |
|---|---|
| Weekly active players (≥ 50 hands) | 10,000 |
| D30 retention of new players | ≥ 15 % |
| Peak concurrent players | ≥ 2,000 |
| Crash-free sessions | ≥ 99.5 % |
| Voided hands (platform) | < 0.05 % |
| Integrity red-team bot detection | ≥ 90 % within 2,000 hands |

# 3. Roadmap

@widths 0.9,1.3,2.8
| Release | Target window | Content |
|---|---|---|
| Alpha | Month 6 | Core engine and formats (cash, fast-fold, SNG, MTT), Android app, back-office basics |
| Beta (G1) | Month 8 | MVP scope above; public in selected countries |
| G2 | Month 10 | Certification package submitted; licence application complete |
| R1 (G3) | Month 12–15 (licence dependent) | Real Money in first jurisdiction: KYC, cashier (mobile money + cards), Real Money Spins where permitted, Short Deck, run it twice, taxes, regulator reporting |
| R2 | R1 + 3–6 months | Operator network (transfer then seamless wallet), second and third jurisdictions, PLO6, operator back-office |
| R3 | R2 + 6 months | iOS, advanced tournaments (mystery bounty, series tooling), ML integrity models in production, Bridge integration (G4) |

Target windows depend on hiring (KP-PRJ-02) and licensing timelines (KP-LEG-01); the plan in KP-PRJ-01 is the working schedule.

# 4. Prioritisation Rules

1. Anything required for fairness, money safety or compliance comes first.
2. Liquidity features (fast formats, network) before depth features.
3. Mobile experience before web; low-end devices before high-end polish.
4. Measure before scaling marketing: no paid acquisition beyond tests before retention targets are met.
