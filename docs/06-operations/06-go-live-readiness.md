---
id: KP-OPS-06
title: Go-Live Readiness Checklist
subtitle: Gate checklists for Play Money Beta (G1), certification readiness (G2) and Real Money launch (G3)
version: 1.0
owner: Programme Director
status: Draft — completed and signed at each gate
related: KP-PRD-03 Roadmap · KP-PRJ-01 Project Plan · KP-QA-01 §6 Exit Criteria · KP-QA-05 Certification
---

# 1. How to Use

At each gate, every item is marked done with evidence (link) or explicitly waived by the gate owner with a reason and a date. A gate is passed only when all mandatory items are done and sign-off (section 5) is complete.

# 2. G1 — Play Money Beta

## Product and game

- [ ] All launch formats playable: cash (NLHE, PLO4/5), fast-fold, SNG, Spins (play), MTT with late reg and re-entry
- [ ] House Rules (Play Money version) published in EN/FR/PT/SW
- [ ] Onboarding, lobby, table, tournaments, profile, support flows usability-tested in two launch markets

## Engineering and quality

- [ ] NFR Beta targets met (stage load, soak, chaos reports)
- [ ] Engine vectors, property tests and differential tests green; deck commitment verification on 100 % of staging hands
- [ ] Crash-free sessions ≥ 99.5 % in Alpha; APK < 30 MB

## Security and integrity

- [ ] Threat model reviewed; no open high risks for Play Money scope
- [ ] Integrity: seating restrictions, link graph, timing profile, chip-flow graph, case tool live
- [ ] Pentest of public endpoints (at least external surface) done

## Operations

- [ ] SLO dashboards and alerts live; runbooks rehearsed; on-call rotation staffed
- [ ] Support team trained; help centre articles; in-app support live

## Legal (Play Money)

- [ ] Terms, Privacy Policy, House Rules approved for Play Money in launch countries
- [ ] Play Money not purchasable/redeemable; no prizes of value (unless counsel approves sweepstakes rules)

# 3. G2 — Certification Readiness

- [ ] Certified components frozen in `cert`; certification package submitted (KP-QA-05 §2)
- [ ] Internal pre-certification tests passed
- [ ] Jurisdiction matrix complete for the first Real Money jurisdiction
- [ ] Licence application complete, including key persons, AML programme, responsible-gaming programme, technical documentation

# 4. G3 — Real Money Launch (per jurisdiction)

## Licence and compliance

- [ ] Licence granted; conditions mapped to controls; regulator integrations/reporting live and tested
- [ ] RNG and game certificates for the deployed digests; certification register matches `real`
- [ ] KYC provider live; sanctions/PEP screening; AML transaction monitoring; MLRO appointed; STR procedure tested
- [ ] Responsible-gaming tools and messaging live; self-exclusion within 60 s; national exclusion register integrated if one exists
- [ ] Jurisdiction policy approved; geolocation controls tested; blocked jurisdictions verified

## Money

- [ ] Player-funds accounts opened and documented; coverage report automated and tested
- [ ] At least two payment routes per main method; pilot deposits/withdrawals reconciled end to end
- [ ] Rake schedules, fees, paytables, FX spread and taxes configured and approved (four-eyes)
- [ ] Nightly reconciliation and month-end dry run completed

## Security and resilience

- [ ] External pentest (web, API, sockets, mobile, cloud): all high findings fixed
- [ ] DR failover drill passed at Launch targets
- [ ] NFR Launch targets met (stage load, soak, chaos)

## Launch plan

- [ ] Pilot plan, go/no-go criteria and rollback (disable Real Money per jurisdiction) documented
- [ ] Support, risk, integrity, treasury and game-ops staffing for extended hours during the first 4 weeks
- [ ] Communication plan (players, operators, regulator)

# 5. Sign-off

@widths 1.6,1.6,1.8
| Role | Name | Date / signature |
|---|---|---|
| Programme Director | | |
| CTO | | |
| CISO | | |
| Compliance Officer / MLRO | | |
| CFO (G3) | | |
| Head of Poker / Product | | |
| CEO (G3) | | |
