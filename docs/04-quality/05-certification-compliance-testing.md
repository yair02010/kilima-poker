---
id: KP-QA-05
title: Certification and Compliance Testing
subtitle: Test-lab certification of RNG and games, regulatory technical standards and change control
version: 1.0
owner: Head of QA / Compliance Officer
status: Draft
related: KP-ENG-13 RNG and Certification · KP-ENG-06 Game Engine · KP-LEG-01 Regulatory Assessment · KP-LEG-07 House Rules
---

# 1. What Must Be Certified

@widths 1.6,3.4
| Item | Typical requirement (per licence) |
|---|---|
| RNG | Statistical randomness, unpredictability, seeding, scaling (shuffle), implementation review (e.g. GLI-19 chapter on RNG) |
| Games | Rules match House Rules; hand evaluation; pots and rake; timeouts; disconnection; tournament payouts; Spin paytable RTP |
| Platform | Account management, responsible-gaming tools, reporting, data retention, security controls — per the regulator's technical standards |
| Change control | Registered versions (digests) of certified components; notification or re-test procedure |

Laboratories: an accredited lab accepted by each regulator (for example GLI, BMM Testlabs, iTech Labs). One lab may cover several jurisdictions with jurisdiction-specific reports.

# 2. Certification Package

- System description and architecture (KP-ENG-01, KP-ENG-13), source code access for certified components, build instructions and reproducible builds.
- House Rules and game descriptions (KP-LEG-07) in the player-facing languages.
- RNG documentation: algorithm, seeding, reseeding, health tests, scaling (rejection sampling), shuffle.
- Test evidence: statistical results (KP-ENG-13 §8), engine vectors and property-test reports, tournament payout tests, Spin draw distribution.
- Access to the `cert` environment and test accounts; hand-history exports for sample sessions.

# 3. Internal Pre-Certification Tests

@widths 1.6,2.4,1
| Test | Method | Pass |
|---|---|---|
| Raw RNG output | NIST SP 800-22, Dieharder, TestU01 BigCrush on 10^9 outputs | Lab thresholds |
| Shuffle uniformity | 10^8 shuffles: card-position chi-square (52×52 and 36×36), pair/adjacency tests, permutation tests on small decks | p-values uniform; no systematic bias |
| Dealing | Starting-hand frequencies over 10^8 hands per variant vs combinatorial expectations | Within 99.99 % bounds |
| Rules conformance | Engine vectors + scripted scenarios matching every rule in KP-LEG-07 | 100 % |
| Evaluation | Exhaustive 5-card enumeration; 10^6 random 7-card and Omaha differential tests | 100 % agreement |
| Tournament | Payout tables, ties on the bubble, cancellation settlement, PKO bounty splits | Matches worked examples |
| Spins | 10^7 draws vs paytable; RTP computation reproduces the published value | Within statistical bounds; exact RTP |
| Commitments | 100 % of hands in test runs verify | 100 % |

# 4. Regulatory Technical Standards Checklist (per jurisdiction)

A matrix per licence maps each requirement of the regulator's technical standard to the document, control and test that satisfies it (`docs/certification/<jurisdiction>-matrix.md`). Typical areas: player registration and verification, limits and self-exclusion, reality checks, game information display (rules, rake, RTP), transaction and game history for players, data retention and export, regulator reporting, security testing, change management, incident reporting.

# 5. Change Control After Certification

1. Every PR touching a certified component records an impact assessment: `none`, `notify`, or `re-test` (KP-ENG-13 §7).
2. `notify`/`re-test` changes are bundled into certification releases; the lab receives the diff and evidence.
3. The certification register is updated with the new digests only after lab approval; CI blocks deploying unregistered digests of certified components to `real`.
4. Emergency security fixes follow the lab's emergency procedure (deploy then notify within the agreed time), documented in the register.

# 6. Ongoing Compliance Testing

- Monthly: RNG production statistics reviewed; sample of hands verified; responsible-gaming controls E2E.
- Quarterly: jurisdiction matrix re-verification after policy changes; report completeness checks.
- Yearly: full internal audit of certified scope and change-control records; external audits as required by licences.
