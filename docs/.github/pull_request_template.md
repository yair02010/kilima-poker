## What and why
<!-- Link the ticket: US-xx / KP-xxx -->

## How to test

## Checklist (KP-QA-02)
- [ ] Tests added/updated; CI green
- [ ] Contracts updated (openapi.yaml / asyncapi.yaml) — no unplanned breaking change
- [ ] Input validation, authorisation, rate limits for new endpoints/events
- [ ] Logs/metrics added; no secrets or personal data in logs
- [ ] Feature flags set for play/real
- [ ] Docs updated (dossier section, README, runbook, ADR if a decision was made)
- [ ] Screenshots/video for UI changes
- [ ] Poker engine / wallet / auth / infra change → second approval requested
- [ ] Certified scope touched (engine rules, RNG, House Rules, payouts)? Certification impact assessment recorded (KP-ENG-13 §7)
- [ ] Money path touched? Postings via helpers; idempotency keys deterministic; finance reviewer added
