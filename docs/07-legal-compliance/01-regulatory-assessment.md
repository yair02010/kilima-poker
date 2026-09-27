---
id: KP-LEG-01
title: Regulatory Assessment — Africa
subtitle: Legal questions, jurisdiction landscape, licence options and required controls
version: 0.1
owner: Compliance Officer / Legal Counsel
status: DRAFT for counsel review
banner: **DRAFT — not legal advice.** This document frames questions for qualified counsel and summarises public information as of September 2026. The legal position in each country must be confirmed by lawyers licensed there before any Real Money feature is enabled. Laws in this area change frequently.
---

# 1. Why This Matters

Online poker for real money is gambling in most legal systems. Operating without the required licence can lead to criminal liability, blocked payments, seized funds and permanent reputational damage. Kilima's architecture is built to operate **only** where licensed (default-deny Jurisdiction Policy Engine, ADR-0014); this document decides where that is.

# 2. Key Questions for Counsel (per country)

1. Is online poker (peer-to-peer, with rake) permitted, and under which licence category? Is poker treated differently from casino games or betting?
2. Can a foreign-owned company hold the licence? Local entity, local directors, key persons, minimum capital?
3. Are shared international liquidity pools allowed, or must play be ring-fenced to the country?
4. Currency rules: may tables run in USD, or must they be in local currency? Capital controls on withdrawals?
5. Player-funds protection: trust accounts, guarantees, bonds?
6. Technical standards: certification lab, server location, real-time regulator integrations, data residency.
7. Taxes: GGR tax, excise on deposits/stakes, withholding tax on winnings, VAT on fees; who withholds and when.
8. AML obligations: reporting entity status, thresholds, FIU reporting (STR/CTR), record keeping.
9. Responsible gaming: mandatory limits, national self-exclusion register, advertising rules, age (18+ or higher).
10. Is a Spin-style format with random prize multipliers permitted? Are private clubs permitted?
11. B2B: may Kilima supply poker to local licensees as a supplier (supplier/platform licence)? Network liquidity with operators licensed elsewhere?
12. Home jurisdiction: where are the company, founders and staff located, and does that country's law restrict offering or supporting online gambling abroad? (For example, founders or operations based in Israel must obtain Israeli counsel's view, since Israeli law restricts organising gambling.)

# 3. Landscape (public information — to be verified)

@widths 1,1.6,2.4
| Country | Regulator (public information) | Poker position to verify with counsel |
|---|---|---|
| South Africa | National Gambling Board; provincial boards | Online poker and casino are **prohibited** under the National Gambling Act 2004 (only online sports betting is licensed provincially). A Remote Gambling Bill has been proposed but not passed. **Not a launch market** unless the law changes |
| Kenya | Betting Control and Licensing Board (BCLB); reform of the gambling law under way | Licenses online operators; confirm whether poker is covered and the status of the new gambling legislation and taxes (excise and withholding) |
| Nigeria | State regulators (e.g. Lagos State Lotteries and Gaming Authority); National Lottery Regulatory Commission | A 2024 Supreme Court decision placed most gaming regulation with the states; confirm which licences cover online poker and whether a national scheme exists |
| Ghana | Gaming Commission of Ghana | Licenses gaming operators; confirm online poker coverage and requirements |
| Uganda | National Lotteries and Gaming Regulatory Board | Licenses online and offline gambling; confirm poker |
| Tanzania | Gaming Board of Tanzania | Licenses online casino and sportsbook; industry sources indicate poker may not be a permitted game — confirm |
| Angola | Instituto de Supervisão de Jogos (ISJ) | Industry sources report that Gaming Law 17/24 provides for licensed online poker — confirm scope, local-entity and currency rules |
| Zambia, Malawi, others | Various | Assess on demand |

# 4. Licence Options (shortlist for counsel)

@widths 1.4,3.6
| Option | Description |
|---|---|
| A — B2C licence in one first market | Kilima holds an operator licence (e.g. where poker is clearly licensable) and launches its own brand with ring-fenced or permitted shared liquidity |
| B — B2B supplier to licensed operators | Kilima holds a supplier/platform licence (or certification) and provides the network to local licensees; operators hold the player relationship |
| C — Combination | B2B in several markets for liquidity + B2C where a licence is obtained |

Offshore licences (e.g. Curaçao) do not authorise offering real-money games to players in countries that require a local licence; they are not a substitute for local licensing in this plan.

# 5. Controls Already in the Design

- Default-deny Jurisdiction Policy Engine with pools, currencies, games and taxes per jurisdiction (ADR-0014).
- Geolocation (IP, device location, SIM country, KYC country) with VPN detection.
- KYC with age verification; sanctions/PEP screening; AML monitoring and STR workflow (KP-LEG-04).
- Player-funds protection and daily coverage (KP-FIN-01).
- Certified RNG and games with change control (KP-ENG-13, KP-QA-05).
- Responsible-gaming tools and harm detection (KP-LEG-05).
- Tamper-evident audit logs and data retention per licence (KP-LEG-06).
- Regulator reporting feeds from the data platform (KP-ENG-16).

# 6. Next Steps

1. Engage counsel in 3 priority markets (proposal: Kenya, Nigeria (Lagos), Angola) for written opinions on the questions in section 2.
2. Decide the launch model (A, B or C) and first market at gate G0/G2.
3. Build the jurisdiction matrix (KP-QA-05 §4) for the chosen market.
4. Prepare the licence application pack: corporate documents, key persons, business plan, AML and responsible-gaming programmes, technical documentation (this dossier), certification plan.
5. Home-jurisdiction opinion for the company and founders.
