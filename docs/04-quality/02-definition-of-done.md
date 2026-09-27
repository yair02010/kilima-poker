---
id: KP-QA-02
title: Definition of Ready and Done
subtitle: Shared quality bar for stories, pull requests and releases
version: 1.0
owner: Head of QA / Engineering Managers
status: Draft
related: KP-QA-01 Test Strategy · KP-ENG-11 Engineering Standards · KP-QA-03 Release Process
---

# 1. Definition of Ready (a story can enter a sprint)

- [ ] User story with acceptance criteria written as testable examples (including money amounts and edge cases)
- [ ] UX designs available (mobile first) and reviewed, including error, offline and loading states
- [ ] API/socket contract changes drafted in the specs
- [ ] Jurisdiction, responsible-gaming and integrity impacts considered (checklist in the ticket)
- [ ] Dependencies (providers, other teams, legal texts) identified
- [ ] Estimated and small enough for one sprint

# 2. Definition of Done — Story

- [ ] Code merged to `main` behind a feature flag if not yet releasable
- [ ] Acceptance criteria automated (unit/integration/E2E as appropriate)
- [ ] Coverage thresholds met for the component (KP-QA-01 §3)
- [ ] Contracts updated; `check_api_consistency.py` passes; docs updated
- [ ] Metrics, logs and traces added; alerts added or updated if the story adds a failure mode
- [ ] Security checklist: input validation, authorisation, secrets, logging redaction
- [ ] Localisation strings added for EN/FR/PT/SW (translations can follow before release)
- [ ] Accessibility checked for new screens
- [ ] Product owner accepted the story in staging

# 3. Pull Request Checklist

- [ ] Small and focused; linked ticket; description explains why
- [ ] Tests added/updated; CI green
- [ ] Money: no `number` for money; postings through helpers only; idempotency keys deterministic
- [ ] Game: engine remains pure; vectors updated if rules changed (reference first)
- [ ] Certified component touched? Certification impact assessment recorded (KP-ENG-13 §7)
- [ ] Database migrations are backward compatible (expand–migrate–contract)
- [ ] Feature flag and rollout plan for risky changes

# 4. Definition of Done — Release

- [ ] Exit criteria of KP-QA-01 §6 met for the target mode
- [ ] Release notes (player-facing where relevant) in all launch languages
- [ ] Runbooks updated for new failure modes
- [ ] Rollback tested; database changes reversible or forward-fixable
- [ ] Support briefed (FAQ, macros) for player-visible changes
- [ ] Compliance sign-off when House Rules, limits, promotions or jurisdictions change

# 5. Code Review Guidelines

Reviews follow KP-ENG-11 §5: correctness, tests, security, contracts, observability, performance, readability. Comments distinguish blocking issues from suggestions. Authors respond to every comment; disagreements are escalated to the component's tech lead rather than argued at length in the PR.
