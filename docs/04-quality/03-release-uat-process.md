---
id: KP-QA-03
title: Release and UAT Process
subtitle: From merged code to players — release trains, canaries, Alpha, Beta and Real Money pilots
version: 1.0
owner: Head of QA / Head of Product
status: Draft
related: KP-OPS-01 CI/CD · KP-OPS-06 Go-Live Readiness · KP-QA-01 Test Strategy · KP-QA-05 Certification
---

# 1. Release Types

@widths 1.3,3.7
| Type | Description |
|---|---|
| Release train | Weekly for services and web (Tuesday); clients every 2 weeks through staged rollout |
| Hotfix | S1/S2 fixes, any day, with the same pipeline and an expedited approval |
| Config change | Rake, jurisdictions, pools, tournaments, promotions: through the back-office with four-eyes where required; no deploy |
| Certified change | Change to a certified component: follows the lab process (notify or re-test) before Real Money deploy |

# 2. Release Steps

1. Release branch cut from `main` (or tag) → automated suites in staging.
2. QA regression (automated + targeted exploratory) → release candidate sign-off.
3. Deploy to Play Money production with a **canary** (5 % of gateway and table-server pods, new tables only) for 30–60 minutes with automatic analysis of SLOs, error rates and business metrics (hands/min, voided hands, deposit success).
4. Promote to 100 % in Play Money.
5. For Real Money: approval by the release manager and, for rule/policy changes, compliance; canary in Real Money; promote.
6. Post-release verification (synthetic players play hands, deposit/withdraw in sandbox-backed test accounts in production where providers allow), then release notes published.

Rollback is automatic on canary failure and one command otherwise; table-servers drain between hands so rollbacks do not void hands.

# 3. Maintenance Windows

Planned maintenance is avoided for tournaments: windows are scheduled in the lowest-traffic hours (measured), announced 48 hours ahead in the app, and no tournament is scheduled across a window. `system:maintenance` stops new hands at the start time.

# 4. Alpha Programme (Play Money, internal)

- Staff, friends and 200 invited players; all game formats at small scale; bug bounty for game-rule defects.
- Goals: stability, UX on real devices and networks in launch markets, first integrity calibration with red-team bots.

# 5. Beta Programme (public Play Money)

- Open registration in selected countries; marketing limited; community channels (WhatsApp/Telegram groups, forums) for feedback.
- Goals: liquidity patterns, performance at Beta targets, retention, tournament operations, support processes, integrity baselines.
- Exit: KP-OPS-06 G1 criteria and Beta KPIs in KP-PRD-03.

# 6. Real Money Pilot

- In the first licensed jurisdiction: a limited pilot (for example capped deposits and invited verified players, where the licence permits a pilot) to prove payments, reconciliation, withdrawals and support end to end.
- Daily go/no-go reviews during the pilot (finance, compliance, integrity, SRE).
- Full launch after G3 (KP-OPS-06).

# 7. User Acceptance for Real Money Features

Product owner, finance (money features), compliance (rules, limits, jurisdictions) and integrity (game-affecting features) accept features in `staging-real` against written scenarios before the feature flag is enabled in Real Money.
