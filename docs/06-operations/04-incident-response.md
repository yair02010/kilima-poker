---
id: KP-OPS-04
title: Incident Response
subtitle: Severity levels, roles, process, regulatory and personal-data incidents, communication and postmortems
version: 1.0
owner: SRE Lead / CISO
status: Draft
related: KP-OPS-03 Runbooks · KP-SEC-02 Security Policy · KP-LEG-02 Privacy Policy · KP-LEG-01 Regulatory Assessment
---

# 1. Severity Levels

@widths 0.6,2.7,1.7
| Level | Definition | Examples |
|---|---|---|
| P1 | Money at risk, fairness compromised, security breach, or Real Money play/cashier unavailable | Ledger imbalance, card leak, RNG failure, data breach, platform down |
| P2 | Major degradation or one core function unavailable | High voided-hand rate, tournaments stuck, one payment method down in a country |
| P3 | Partial degradation with workaround | Slow reports, one provider delayed, minor client bug spike |
| P4 | Low impact | Cosmetic issues, internal tooling |

# 2. Roles

@widths 1.4,3.6
| Role | Responsibility |
|---|---|
| Incident commander (IC) | Leads the response, decides, keeps the timeline; on-call SRE by default, CISO for security incidents |
| Technical lead(s) | Diagnose and fix in their domain |
| Communications lead | Player, operator and internal updates (support lead or product) |
| Compliance liaison | Regulatory notifications, legal holds, evidence preservation (P1 always) |
| Finance liaison | Money impact assessment, reconciliation (money incidents) |
| Scribe | Timeline and actions in the incident record |

# 3. Process

1. **Detect** (alert, report, provider notice) → create the incident in the incident platform, assign IC, open a dedicated channel.
2. **Assess** severity and scope; for P1, page the domain leads, compliance and finance liaisons.
3. **Contain**: protective switches (pause tables/tournaments, pause withdrawals, block a jurisdiction, disable a provider, revoke sessions).
4. **Resolve**: fix or roll back; verify with bots and reconciliation.
5. **Recover**: reopen gradually; monitor for 1 hour; close when stable.
6. **Learn**: postmortem within 5 business days (P1/P2).

Status updates: P1 every 30 minutes, P2 every hour, internally and on the public status page where player-visible.

# 4. Regulatory, Security and Personal-Data Incidents

- **Regulatory notification:** each licence defines reportable incidents (e.g. outages beyond a duration, player-fund shortfalls, security breaches, game malfunctions) and deadlines. The jurisdiction matrix (KP-QA-05 §4) lists them; the compliance liaison files notifications.
- **Personal-data breaches:** assessed by the DPO; notification to data-protection authorities and affected people within the deadlines of the applicable laws (for example 72 hours under the Kenya Data Protection Act and the Nigeria Data Protection Act) when required.
- **Evidence:** preserve logs, images and database snapshots; legal hold on relevant data; chain of custody for forensic material.
- **Game malfunctions:** hands affected by a malfunction are voided or corrected per House Rules; affected players are informed and made whole.

# 5. Communication Templates

- **In-app / status page (degradation):** "Some players in {country} are experiencing {issue}. Your balances and table chips are safe. Next update at {time}."
- **Tournament pause:** "{Tournament} is paused because of a technical issue. All chip counts are saved. We expect to resume at {time}."
- **Payment delay:** "{Method} {deposits/withdrawals} are delayed by our provider. Your funds are safe; pending payments will complete automatically."
- **Post-incident:** what happened, impact, what we did for affected players, what we are changing.

# 6. Postmortem

Blameless format (`templates/postmortem-template.md`): summary, impact (players, money, hands, duration), timeline, root cause and contributing factors, what went well/poorly, action items with owners and dates. P1 postmortems are reviewed by the CTO and shared with compliance; action items are tracked to completion.
