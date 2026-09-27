---
id: KP-HBK-16
title: Feature Flags and Jurisdiction Rollouts
subtitle: Flag types, naming, targeting by jurisdiction, tenant and mode, and cleanup
version: 1.0
owner: Tech Lead — Platform
status: Approved
related: KP-OPS-01 §5 · ADR-0014 Jurisdiction Policy Engine · KP-HBK-15 Release Guide
---

# 1. Flags vs Policy

@widths 1.5,3.5
| Mechanism | Use for |
|---|---|
| Feature flag (OpenFeature) | Rolling out code: unfinished features, experiments, kill switches, gradual exposure |
| Jurisdiction policy (compliance) | What is legally allowed where: games, formats, currencies, limits, taxes. Never implement legal rules as feature flags |
| Business configuration (back-office) | Rake schedules, table templates, tournaments, promotions |

# 2. Flag Types and Naming

`<team>.<feature>.<type>` — types: `release` (temporary), `ops` (kill switch, long-lived), `experiment` (A/B), `permission` (staff tools). Example: `gam.run-it-twice.release`, `pay.mtn-momo-payouts.ops`.

# 3. Targeting

Contexts available in every evaluation: `mode` (play/real), `jurisdiction`, `tenantId`, `accountId` (hashed for percentage rollouts), `appVersion`, `platform`, `staff`. Typical rollout: staff → Play Money 10 % → Play 100 % → Real Money in one jurisdiction → all permitted jurisdictions.

# 4. Rules

- A release flag has an owner and a removal date (max 90 days); CI warns on expired flags.
- Engine and money logic behind a flag must be tested in both states.
- Flags that change game rules or payouts are also certified-scope changes; the flag state per environment is part of the certification register.
- Kill switches exist for: each payment provider, each game format, Spins, fast-fold, chat, new-device logins, withdrawals (global and per jurisdiction).

# 5. Experiments

A/B tests on UX, onboarding and lobby only. No experiments on rake, payouts, RNG or anything that changes a player's odds or costs. Responsible-gaming review for experiments affecting session length or deposits.
