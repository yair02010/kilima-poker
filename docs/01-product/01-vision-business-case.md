---
id: KP-PRD-01
title: Vision and Business Case
subtitle: Why Kilima Poker exists, who it serves, how it wins and how it makes money
version: 1.0
owner: CEO / Head of Poker
status: Draft — market figures and financials are assumptions to validate
related: KP-FIN-04 Revenue Model · KP-LEG-01 Regulatory Assessment · KP-PRD-03 Roadmap
---

# 1. Vision

**The home of fair, fast, mobile poker for Africa.** Kilima Poker gives African players a world-class poker experience built for their phones, their networks and their payment methods, with games they can trust.

## Product principles

1. **Mobile first, network aware:** every feature works on a mid-range Android phone on 3G.
2. **Fair and provably so:** certified RNG, verifiable hands, visible integrity enforcement.
3. **Local by default:** mobile money, local languages, local currencies where required, local support hours.
4. **Recreational-friendly economy:** fast formats, transparent rake, rewards for all, protection from predatory play.
5. **Compliant by design:** only where licensed; responsible gaming built in, not bolted on.
6. **Poker first, platform always:** built so Bridge and future skill games plug in later.

# 2. Problem and Opportunity

- African online gambling is growing quickly and is mobile-dominated; licensed operators focus on sports betting, where poker is a small share (industry analyses put poker at a low single-digit percentage of online gambling revenue in most African markets) and is often offered only through foreign networks without local payments or language support.
- Players who want poker today often use offshore sites or networks that are not licensed in their country, with poor payment options and limited recourse.
- Licensed sportsbooks need retention products; a poker network with shared liquidity and local payments is a B2B opportunity.
- The Bridge Casino dossier showed that liquidity is the main risk for card-game platforms. A network model (B2B skins) addresses liquidity directly.

## Strategy

@widths 1.2,3.8
| Pillar | How |
|---|---|
| Liquidity | B2C in licensed markets plus B2B network with licensed operators; fast formats that need fewer players (fast-fold, Spins, AOF); Play Money funnel |
| Trust | Certification, deck commitments, integrity report, fast withdrawals to mobile money |
| Product | Best-in-class mobile table, data-saver mode, local languages, social features (clubs) |
| Economics | Transparent rake with generous rewards for recreational players; controlled promotions |
| Compliance | Jurisdiction Policy Engine; launch only where licensed; strong AML and responsible gaming |

# 3. Target Users

@widths 1.3,3.7
| Segment | Description and needs |
|---|---|
| Recreational mobile players | 21–40, urban, Android, play in short sessions; want quick games, small stakes, instant mobile-money deposits and withdrawals |
| Sports bettors (via operators) | Discover poker inside their sportsbook; need simple formats (Spins, AOF) and a familiar wallet |
| Regular grinders | Play many hands; care about rake, rewards, tools, reliable software |
| Home-game communities | Want private clubs with friends (where permitted) |
| Operators (B2B) | Licensed sportsbooks and casinos needing a poker product with liquidity and low integration effort |

# 4. Business Model

- Revenue: cash-game rake, tournament fees, Spin edge, FX spread, B2B platform fees and share of network rake (KP-FIN-04).
- Costs: rewards and promotions, payment costs, gaming taxes, KYC/SMS, cloud and CDN, certification and licences, staff (engineering, integrity, support, compliance, finance), marketing.

## Unit economics (planning model — all values are assumptions)

@widths 2.5,1.2,1.3
| Metric | Assumption | Validate with |
|---|---|---|
| Monthly GGR per active Real Money player | 8–15 USD | Beta cohorts, operator data |
| Rewards + promotions | 25–35 % of GGR | KP-FIN-04 |
| Payment + KYC + SMS cost per active player | 1–2 USD / month | Provider quotes |
| Gaming taxes | per jurisdiction | Counsel, tax advisers |
| CAC (B2C, paid) | 15–40 USD | Marketing tests |
| CAC (B2B players) | ~0 direct; revenue share instead | Operator contracts |
| Month-3 retention of depositing players | 25–35 % | Beta and pilot |

The financial model (spreadsheet maintained by finance) combines these with the roadmap and headcount plan (KP-PRJ-02) and shows scenarios (B2C only, B2B only, both) with sensitivity on liquidity and retention.

# 5. Success Metrics

@widths 1.6,1.6,1.8
| Stage | North-star metric | Supporting metrics |
|---|---|---|
| Beta (Play Money) | Weekly active players playing ≥ 50 hands | D7/D30 retention, sessions/week, time to first hand, crash-free sessions |
| Real Money launch | Monthly depositing players | Deposit success rate, withdrawal time, GGR, NGR, fraud losses, support CSAT |
| GA (network) | Peak concurrent Real Money players | Liquidity per stake, operator count, rake per player, integrity KPIs |

# 6. Key Risks (summary)

Regulatory changes and licensing timelines, liquidity, payment-provider dependency, cheating (bots/RTA/collusion), app-store distribution, and competition from established international networks. Full list: KP-PRJ-03.

# 7. Go / No-Go Gates

@widths 0.6,2.2,2.2
| Gate | Decision | Criteria (summary) |
|---|---|---|
| G0 | Start the programme | Funding secured; first-market legal opinion shows a viable licence path; key hires identified |
| G1 | Public Play Money Beta | KP-OPS-06 §2 |
| G2 | Submit for certification and licence | KP-OPS-06 §3; Beta KPIs trending to targets |
| G3 | Real Money launch in a jurisdiction | Licence granted; KP-OPS-06 §4 |
| G4 | Open B2B network / add Bridge | First operator contract signed; network settlement proven; Bridge integration plan approved |
