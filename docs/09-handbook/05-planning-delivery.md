---
id: KP-HBK-05
title: Planning and Delivery
subtitle: Roadmap, quarterly planning, sprints, estimation, ceremonies and capacity
version: 1.0
owner: Programme Director / Engineering Managers
status: Approved
related: KP-PRD-03 Roadmap · KP-PRJ-01 Project Plan · KP-HBK-06 Build Plan
---

# 1. Planning Layers

@widths 1.2,1.2,1.2,1.4
| Layer | Horizon | Owner | Artefact |
|---|---|---|---|
| Roadmap | 12–18 months | Head of Product + CTO | KP-PRD-03 releases and gates |
| Quarter plan | 3 months | Each team with product | Quarterly objectives (OKRs) + epics with owners |
| Sprint | 2 weeks | Team | Sprint goal + committed stories |
| Day | 1 day | Engineer | Board updates, PRs |

# 2. Quarterly Planning

1. Two weeks before the quarter: product and tech leads draft objectives from the roadmap and the build plan (KP-HBK-06).
2. Teams estimate epics (T-shirt sizes) and list cross-team dependencies.
3. Planning day: dependencies are resolved on a shared board; each team commits to objectives with 70 % of capacity, keeping 20 % for reliability/tech debt and 10 % for unplanned work.
4. The programme director publishes the quarter plan and risk changes (KP-PRJ-03).

# 3. Sprint Cadence

@widths 1.4,1.1,2.5
| Ceremony | Length | Purpose |
|---|---|---|
| Sprint planning | 1 h | Sprint goal, stories that meet Definition of Ready |
| Daily stand-up | 15 min | Blockers first; walk the board right to left |
| Refinement | 1 h weekly | Split, clarify, risk-classify and estimate upcoming stories |
| Sprint review | 45 min | Demo working software in staging (bots at tables are welcome) |
| Retrospective | 45 min | One or two improvements with owners |
| Release sync | 15 min Monday | What rides Tuesday's train; flags and approvals |

# 4. Estimation and Flow

- Stories are estimated in points (1, 2, 3, 5, 8); anything above 8 is split.
- Work-in-progress limit: at most 2 stories in progress per engineer.
- A story is done only when it meets KP-QA-02 §2 (tests, telemetry, docs, product acceptance).
- Track cycle time per story; investigate anything above 10 working days.

# 5. Cross-Team Work

- Contract-first: the providing team merges the contract (OpenAPI/AsyncAPI/Avro) before the consuming team starts; mocks are generated from it.
- Dependencies are tickets on both boards with the same epic.
- Integration milestones are demoed jointly (e.g. "table-server settles a hand through wallet").

# 6. Reporting

- Weekly programme review: milestone status (green/amber/red), critical path, top risks.
- Monthly: DORA metrics, quality (escaped defects, S1/S2 count), SLOs, hiring.
