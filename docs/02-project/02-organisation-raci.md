---
id: KP-PRJ-02
title: Organisation, Roles and RACI
subtitle: Team structure, hiring plan, responsibilities and escalation
version: 1.0
owner: CEO / Programme Director
status: Draft
related: KP-PRJ-01 Plan · KP-ENG-11 §9 Engineering Teams · KP-SEC-02 §2 Security Roles
---

# 1. Organisation and Hiring Plan

@widths 1.6,1,1,1,1.4
| Function | Month 1 | Month 6 | Month 12 | Key roles |
|---|---|---|---|---|
| Leadership | 4 | 5 | 6 | CEO, CTO, CFO, Head of Poker, Compliance Officer/MLRO, CISO (by month 6) |
| Engineering | 8 | 18 | 25 | Tech leads (Game, Platform, Payments, Trust, Clients, Data, SRE), engineers, QA |
| Product and design | 2 | 4 | 5 | Head of Product, designers, product analysts |
| Game integrity | 0 | 2 | 5 | Head of Game Integrity, analysts, data scientist, red team |
| Compliance, risk, AML | 1 | 3 | 6 | MLRO, KYC/AML analysts, risk analysts, DPO |
| Finance and treasury | 1 | 2 | 4 | Financial controller, treasury, payments ops |
| Operations | 0 | 6 | 14 | Support (multilingual), tournament directors, player care |
| Marketing and B2B | 1 | 3 | 5 | Marketing lead, community, B2B partnerships |
| **Total** | **17** | **43** | **70** | Contractors where useful (security testing, localisation) |

Location: hub in a launch-market capital (e.g. Nairobi or Lagos) plus remote engineers; key compliance roles as required by licences (some regulators require local key persons).

# 2. Decision Roles

@widths 1.6,3.4
| Role | Decides |
|---|---|
| CEO | Strategy, markets, budget, gates G0/G3/G4 |
| CTO | Architecture, technology, engineering priorities, technical gate criteria |
| Head of Poker / Product | Game portfolio, formats, product roadmap, rake proposals (with CFO) |
| CFO | Rake and fees approval, treasury, payments, budget control |
| Compliance Officer / MLRO | Jurisdiction policies, KYC/AML decisions, responsible-gaming measures, regulatory reporting |
| CISO | Security policies, risk acceptance, security incidents |
| Head of Game Integrity | Integrity policies, confiscation above thresholds |

# 3. RACI Matrix

R = responsible, A = accountable, C = consulted, I = informed. Product = Head of Poker / Product; Compl. = Compliance Officer; Integr. = Head of Game Integrity.

@widths 2.2,0.55,0.55,0.75,0.55,0.7,0.55,0.7
| Activity | CEO | CTO | Product | CFO | Compl. | CISO | Integr. |
|---|---|---|---|---|---|---|---|
| Market and licence strategy | A | C | C | C | R | I | I |
| Architecture and ADRs | I | A | C | C | C | C | C |
| Game rules and House Rules | I | C | A | C | R | I | C |
| Rake, fees, paytables | C | I | R | A | C | I | I |
| Jurisdiction policy changes | I | C | I | I | A | I | I |
| Payments and treasury | I | C | I | A | C | C | I |
| Security programme | I | C | I | I | C | A | I |
| Integrity enforcement | I | I | C | I | C | I | A |
| Release to Real Money | I | A | R | C | C | C | C |
| Certification | I | A | C | I | R | C | I |
| Incident response (P1) — CISO is R for security incidents | I | A | I | C | C | R | C |

# 4. Escalation

Team lead → function head → steering committee. Money-at-risk, fairness and security issues skip levels to the CTO/CFO/CISO immediately. Regulatory questions go to the Compliance Officer, who involves counsel.
