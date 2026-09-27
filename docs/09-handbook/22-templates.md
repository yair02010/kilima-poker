---
id: KP-HBK-22
title: Templates
subtitle: Copy-ready templates for design notes, service READMEs, runbook entries, test plans and handovers
version: 1.0
owner: Programme Director
status: Approved
related: KP-HBK-04 RFC template · templates/ (ADR, postmortem, release notes, change request, test charter)
---

# 1. Design Note (sensitive changes, in the ticket)

```
Problem:            what and for whom
Approach:           how it works (diagram link if useful)
Contracts:          endpoints / events added or changed
Data:               tables/columns, retention, data class
Risks:              money, fairness, security, compliance, performance
Test plan:          unit / integration / E2E / load
Rollout:            flag, jurisdictions, metrics to watch
```

# 2. Service README

```
# <service>
Purpose · Owner team · On-call rotation · Slack channel
Run locally:        pnpm dev --filter=<service>
Configuration:      table of env vars (name, meaning, default, secret?)
Dependencies:       services, data stores, providers
Contracts:          links to spec sections
Dashboards:         links
Runbook:            ./RUNBOOK.md
```

# 3. Runbook Entry

```
## RB-<svc>-NN <symptom>
Trigger:        alert name / report
Impact:         who is affected and how
Immediate:      protective steps (with required approvals)
Diagnose:       queries, dashboards, commands
Resolve:        steps
Communicate:    templates (KP-OPS-04 §5)
Follow-up:      tickets, postmortem if P1/P2
```

# 4. Test Plan (feature)

```
Scope and risk class · Environments · Test data
Scenarios:      happy paths, edge cases, denied paths, failure of each dependency
Automation:     which suites, which new tests
Non-functional: performance, security, accessibility, localisation
Exit criteria:  what must pass before release
```

# 5. On-Call Handover

```
Week:           YYYY-MM-DD → YYYY-MM-DD      From → To
Open incidents / follow-ups:
Noisy alerts (with tickets):
Risky changes this week:
Big tournaments / promotions:
Provider status notes:
```

# 6. Existing Templates in `templates/`

ADR (`adr-template.md`), postmortem, release notes, change request, exploratory test charter; GitHub PR and issue templates in `.github/`.
