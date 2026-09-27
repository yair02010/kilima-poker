---
id: KP-HBK-01
title: Start Here
subtitle: How engineering works at Kilima Poker, and your first 30 days
version: 1.0
owner: CTO
status: Approved
related: KP-GOV-01 Document Management · KP-HBK-02 Development Environment · KP-HBK-03 SDLC
---

# 1. What This Handbook Is

The dossier (KP-GOV to KP-FIN) describes **what** we build and **why**. This handbook describes **how** we build it: the processes, conventions and step-by-step guides that let 25 engineers in seven teams ship a real-money game platform safely every week.

Three rules sit above everything else:

1. **Money and fairness are never traded for speed.** Anything touching the ledger, the RNG, the engine or payouts follows the stricter path in every process.
2. **Written decisions win.** If it is not in an ADR, an RFC or this dossier, it is not decided. If two documents disagree, KP-ENG-01 and the ADRs win.
3. **You build it, you run it.** Teams own their services in production, including on-call, dashboards and runbooks.

# 2. Reading Path

@widths 0.6,2.2,2.2
| Day | Read | Why |
|---|---|---|
| 1 | KP-PRD-01 Vision, KP-ENG-01 Architecture, this page | The product, the platform and the rules of the game |
| 1 | KP-GOV-02 Glossary | Poker and payments vocabulary used everywhere |
| 2 | KP-HBK-02 Development Environment | Get the platform running on your laptop |
| 2 | KP-HBK-03 SDLC, KP-HBK-14 Git and Code Review | How work flows from idea to production |
| 3 | Your team's core documents (table below) | Your domain in depth |
| 4–5 | KP-HBK-09 Coding Guide, KP-HBK-10 Testing Guide | How we write and test code |
| Week 2 | KP-HBK-19 On-Call, KP-OPS-03 Runbooks | How we run what we build |

@widths 1.2,3.8
| Team | Core documents |
|---|---|
| Game | KP-ENG-06 Engine, KP-ENG-07 Lobby and Tournaments, KP-ENG-04 Protocol, KP-ENG-13 RNG, KP-HBK-11 Engine guide |
| Platform | KP-ENG-02 Identity, KP-ENG-03 API, KP-ENG-05 Data Model, KP-HBK-07 Service Blueprint |
| Payments | KP-ENG-08 Wallet, KP-FIN-01 to KP-FIN-03, KP-HBK-12 Wallet guide |
| Trust | KP-ENG-09 Integrity, KP-SEC-04 Fraud, KP-LEG-04 AML, KP-LEG-05 Responsible Gaming |
| Clients | KP-ENG-15 Clients, KP-PRD-04 UX, KP-ENG-04 Protocol |
| Data | KP-ENG-16 Data Platform and AI, KP-ENG-05 §10 ClickHouse |
| SRE / Security | KP-OPS-01 to KP-OPS-05, KP-SEC-01 to KP-SEC-03 |

# 3. Your First 30 Days

@widths 0.9,4.1
| When | Outcome |
|---|---|
| Day 1 | Laptop enrolled (MDM, disk encryption, EDR), SSO and hardware key set up, GitHub access, Slack channels joined, buddy assigned |
| Day 2 | Local platform running; you played a hand against bots on your machine |
| Week 1 | First pull request merged (a "good first issue" from your team's board); you shadowed a stand-up, a refinement and a release |
| Week 2 | You completed security and AML awareness training; you shadowed on-call for one shift |
| Week 3 | You delivered a small story end to end: design note, code, tests, dashboard, release |
| Day 30 | Check-in with your manager: what is unclear, what slowed you down; you fix one thing in this handbook |

# 4. Access You Will Get (and Will Not)

- **Yes:** source code, `dev` and `staging` environments, dashboards, logs without personal data, the dossier, the design system.
- **On request, time-limited:** production read access through just-in-time elevation (KP-SEC-02 §4), with a reason and approval.
- **Never by default:** write access to production databases, ledger data, live hole cards, KYC documents, bank portals.

Staff and their household members may not play Kilima Poker for real money (KP-LEG-03).

# 5. Where Things Live

@widths 1.4,3.6
| Thing | Location |
|---|---|
| Code | `kilima-poker` monorepo (KP-ENG-11 §1) |
| Infrastructure | `kilima-infra` repository (Terraform) |
| Dossier and this handbook | `docs/` in the monorepo (today: `kilima-poker-docs`) and this site |
| Work tracking | Jira (or Linear): one board per team, one programme board |
| Decisions | ADRs in `docs/03-engineering/adr/`, RFCs in `docs/rfcs/` |
| Dashboards and alerts | Grafana; incident platform for paging |
| Conversations | Slack: `#eng-<team>`, `#releases`, `#incidents`, `#rfc`, `#ask-security`, `#ask-payments` |

# 6. Asking for Help

Ask early and in public channels so answers help the next person. A question that takes you more than 30 minutes to answer alone is worth asking. If the answer is not written down anywhere, add it to this handbook in the same week.
