---
id: KP-HBK-19
title: On-Call Handbook
subtitle: Rotations, what to do when paged, escalation, handover and wellbeing
version: 1.0
owner: SRE Lead
status: Approved
related: KP-OPS-02 §5 On-call · KP-OPS-03 Runbooks · KP-OPS-04 Incident Response
---

# 1. Rotations

@widths 1.4,3.6
| Rotation | Covers |
|---|---|
| SRE primary/secondary | Platform, infrastructure, edge, data stores |
| Game | gateway, table-server, lobby, tournament, rng |
| Payments | wallet, cashier, providers, reconciliation |
| Trust | compliance, integrity services (business hours + escalation) |
| Game ops / payments ops (non-engineering) | Tournament direction, payment queues during peak hours |

Weekly rotations, handover Monday 10:00. Nobody is on call more than one week in four; compensation per HR policy.

# 2. When Paged

1. Acknowledge (P1 within 5 min, P2 within 15 min).
2. Open the alert's runbook; follow it.
3. If players or money are affected, declare an incident in the incident platform (KP-OPS-04) — declaring early is always right.
4. Use protective switches first (pause tables, pause withdrawals, disable a provider) when the runbook says so; fix second.
5. Write what you did in the incident channel as you go.

# 3. Escalation

Escalate after 15 minutes without clear progress, or immediately for money-at-risk, card leak, RNG or security events: secondary → component tech lead → CTO/CISO. Waking someone up is expected for P1.

# 4. Handover

Open incidents and follow-ups, noisy alerts (with tickets to fix them), upcoming risky changes and tournaments, provider status.

# 5. Wellbeing

After a night page, start late the next day. If a rotation had more than 5 pages outside hours, the team fixes alert noise before new feature work (error-budget policy).
