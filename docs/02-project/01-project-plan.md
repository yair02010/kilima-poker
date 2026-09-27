---
id: KP-PRJ-01
title: Project Plan and Milestones
subtitle: Phases, workstreams, milestones, critical path and governance
version: 1.0
owner: Programme Director
status: Draft — baseline plan, re-planned monthly
related: KP-PRD-03 Roadmap · KP-PRJ-02 Organisation · KP-PRJ-03 Risks · KP-OPS-06 Gates
---

# 1. Planning Assumptions

- Team ramps from ~17 people (month 1) to ~70 (month 12) per KP-PRJ-02; engineering from 8 to ~25.
- Two-week sprints; quarterly planning; release trains weekly from Alpha.
- Licence timelines are outside our control; the plan keeps Real Money work parallel so that R1 is technically ready at month 12, and launch follows the licence.
- Bridge work is out of scope until gate G4, except keeping interfaces game-agnostic (KP-ENG-01 §12).

# 2. Phases and Milestones

@widths 0.8,1.3,2.9
| Month | Milestone | Content |
|---|---|---|
| 0 | G0 — Programme start | Funding, first-market legal opinion, core hires (CTO, Head of Poker, Compliance) |
| 1–2 | Foundations | Monorepo, CI/CD, EKS environments, identity, engine-poker with reference vectors, table-server prototype, design system |
| 3–4 | Game core | Cash tables, fast-fold, lobby, wallet (Play), Android client table, gateway, observability |
| 5–6 | Tournaments + Alpha | SNG, Spins (Play), MTT engine, integrity MVP, back-office; **Alpha** (month 6) |
| 7–8 | Beta hardening | Load/soak/chaos to Beta targets, localisation, support tooling; **G1 Beta** (month 8) |
| 7–10 | Real Money build | Cashier + mobile-money adapters, KYC, compliance engine, ledger for Real Money, treasury tooling, reports, RNG service certification package |
| 10 | **G2** | Certification submission, licence application complete, pentest round 1 |
| 11–12 | Launch readiness | Lab findings fixed, pentest fixes, DR drill, Real Money pilot in staging, operations staffing |
| 12–15 | **G3 R1** | Real Money launch in first jurisdiction (after licence) |
| R1 + 3–6 | R2 Network | Operator API, seamless wallet, second jurisdiction |

## Parallel non-engineering workstreams

@widths 1.4,3.6
| Workstream | Key deliverables |
|---|---|
| Legal and licensing | Jurisdiction opinions, entity set-up, licence applications, Terms/Privacy/House Rules, regulator relationships |
| Compliance | AML programme, MLRO, KYC vendor, responsible-gaming programme, jurisdiction matrices |
| Finance and treasury | Banking (player-funds accounts), payment providers, FX, tax registrations, finance processes |
| Operations | Support hiring and training, game operations, integrity team, player care |
| Marketing | Brand (KILIMA), Beta community, operator partnerships, app distribution |

# 3. Critical Path

1. Licence in the first jurisdiction (legal) → G3.
2. Payment providers contracted and certified (finance/payments) → Real Money pilot.
3. RNG and game certification (engineering + lab) → G3.
4. Engine + table-server + client table quality (game) → Alpha/Beta.
5. Integrity capability calibrated on Beta data → Real Money safety.

Dependencies are tracked in the programme board; any slip on the critical path is escalated in the weekly programme review.

# 4. Governance

@widths 1.5,1,2.5
| Forum | Frequency | Purpose |
|---|---|---|
| Programme review | Weekly | Status, risks, decisions, critical path |
| Steering committee (CEO, CTO, CFO, Compliance, Head of Poker) | Monthly | Scope, budget, gates, licence strategy |
| Architecture review | Bi-weekly | ADRs, cross-team designs |
| Risk review | Monthly | KP-PRJ-03 update |
| Gate reviews | At G1–G4 | KP-OPS-06 sign-off |

## Reporting and tools

Programme dashboard (milestones, burn-up per epic, risks, budget vs actual), Jira (or Linear) for work items, this dossier for decisions and specifications, a shared calendar of regulatory deadlines.

# 5. Change Control

Scope, schedule or budget changes above thresholds use a change request (`templates/change-request.md`) approved by the steering committee; the affected documents are updated in the same pull request.
