---
id: KP-PRJ-03
title: Risk Register
subtitle: Strategic, regulatory, product, technical, security and financial risks
version: 1.0
owner: Programme Director
status: Living document — reviewed monthly by the steering committee
related: KP-SEC-01 Threat Model · KP-LEG-01 Regulatory Assessment · KP-PRD-01 Business Case
---

# 1. Scoring

Likelihood (L) and impact (I) from 1 to 5; score = L × I. High ≥ 15, medium 8–14, low ≤ 7.

# 2. Register

@widths 0.5,1.8,0.3,0.3,0.4,2.1,0.6
| # | Risk | L | I | Score | Mitigation | Owner |
|---|---|---|---|---|---|---|
| R01 | Licence for the first jurisdiction delayed or refused | 3 | 5 | 15 | Parallel applications in two jurisdictions; B2B route through licensed operators; Play Money Beta continues | CEO |
| R02 | Law changes restrict online poker in a launch market | 2 | 5 | 10 | Jurisdiction Policy Engine (fast blocks); diversified markets; regulatory monitoring | Compliance |
| R03 | Insufficient liquidity (empty tables) | 4 | 4 | 16 | Fast formats; B2B network; Play Money funnel; scheduled guarantees; limited stake ladder at launch | Head of Poker |
| R04 | Mobile-money provider refuses gaming merchants or changes terms | 3 | 4 | 12 | Two providers per method; aggregators; direct relationships; compliance documentation ready | CFO |
| R05 | Bots/RTA/collusion damage player trust | 4 | 5 | 20 | KP-ENG-09 layered defence; red team; public integrity report; refunds to victims | Integrity |
| R06 | App-store rejection for real-money app | 3 | 3 | 9 | Direct APK distribution; web app; comply with store policies where eligible | Product |
| R07 | Certification findings delay launch | 3 | 4 | 12 | Early lab engagement; pre-certification testing; frozen `cert` environment | CTO |
| R08 | Hiring senior engineers and integrity specialists | 3 | 4 | 12 | Remote hiring; competitive packages; contractors for peaks | CTO |
| R09 | Latency for West African players from Cape Town | 3 | 3 | 9 | Edge PoPs; protocol efficiency; measure RTT in Beta; option for a second region | CTO |
| R10 | Player-funds shortfall (operational error or provider failure) | 1 | 5 | 5 | Coverage ≥ 105 %; provider exposure limits; daily reconciliation | CFO |
| R11 | Security breach (ATO wave, data breach) | 2 | 5 | 10 | KP-SEC-02/03/04; pentests; monitoring; incident response | CISO |
| R12 | FX/capital controls prevent withdrawals in a market | 2 | 4 | 8 | Local-currency pools and banking in that market; legal and banking review before launch | CFO |
| R13 | Problem gambling harm and reputational damage | 2 | 5 | 10 | Responsible-gaming programme; model-based detection; marketing rules | Compliance |
| R14 | Competitor networks with established liquidity | 4 | 3 | 12 | Local payments and languages; mobile experience; B2B partnerships | CEO |
| R15 | Scope too large for timeline | 3 | 4 | 12 | Phased roadmap; strict MVP; monthly re-planning; change control | Programme Director |
| R16 | Tax changes (e.g. new excise on deposits) reduce margins | 3 | 3 | 9 | Configurable tax engine; pricing review; scenario planning | CFO |
| R17 | Vendor lock-in or outage (cloud, KYC, SMS) | 2 | 3 | 6 | Abstractions (adapters); secondary vendors for SMS/KYC; multi-region DR | CTO |

# 3. Closed or Accepted Risks

None at version 1.0. Accepted risks are recorded with the approver, reason and review date.
