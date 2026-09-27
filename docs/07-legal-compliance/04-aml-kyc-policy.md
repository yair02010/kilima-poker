---
id: KP-LEG-04
title: AML/CTF and KYC Policy
subtitle: Risk-based customer due diligence, monitoring, reporting, record keeping and training
version: 0.1
owner: MLRO / Compliance Officer
status: DRAFT for counsel review
banner: **DRAFT — not legal advice.** Framework based on FATF recommendations and common practice in regulated online gaming. Thresholds, reporting deadlines and procedures must be set by the MLRO under the AML law of each licensing jurisdiction and the regulator's guidance.
---

# 1. Purpose and Scope

To prevent Kilima Poker from being used for money laundering, terrorist financing or sanctions evasion. Applies to all Real Money players, operators (B2B due diligence), staff and payment flows. Poker-specific risk: players can transfer value to each other through play (chip dumping), so game integrity and AML work together (KP-ENG-09).

# 2. Governance

- Board-approved policy; MLRO (Money Laundering Reporting Officer) appointed and registered where required; deputy MLRO.
- Business-wide risk assessment yearly (customers, countries, payment methods, products, channels).
- Independent AML audit yearly.

# 3. Customer Due Diligence (CDD)

@widths 1.2,3.8
| Level | Requirements |
|---|---|
| Standard CDD (before any withdrawal and before deposits above [threshold] or as the licence requires) | Name, date of birth, address, nationality; government ID verification with liveness; age check; sanctions and PEP screening; phone ownership |
| Enhanced due diligence (EDD) | High-risk country, PEP, high deposit volume ([> X per month]), unusual patterns: source of funds/wealth documents, senior approval, closer monitoring |
| Ongoing monitoring | Re-screening daily against sanctions lists and periodically for PEP/adverse media; ID expiry refresh; re-verification after major profile changes |
| Operators (B2B) | Licence verification, ownership and directors screening, AML programme review, contract obligations for KYC where the operator performs it |

Players who do not complete required CDD cannot deposit above the limit or withdraw; funds remain safe in their account.

# 4. Transaction Monitoring Rules (initial set)

@widths 0.5,3,1.5
| # | Rule | Action |
|---|---|---|
| AML-01 | Deposit followed by withdrawal with minimal play (e.g. rake paid < [x] % of deposit) | Review withdrawal |
| AML-02 | Many deposits just below thresholds; structuring patterns | Alert |
| AML-03 | Deposits from multiple instruments or third parties | Block + review |
| AML-04 | Chip-dumping indicators from integrity (one-way flows between linked players) | Joint integrity/AML case; hold |
| AML-05 | Rapid increase in volume inconsistent with profile | EDD trigger |
| AML-06 | Winnings concentrated from a small set of opponents followed by withdrawal | Review |
| AML-07 | Use of VPN/proxy or location mismatch on money actions | Step-up / block |
| AML-08 | Sanctions or PEP match | Freeze pending review |

Rules and thresholds are configuration owned by the MLRO; an anomaly-detection model adds alerts (KP-ENG-16 §4). All alerts are reviewed and documented.

# 5. Reporting

- Suspicious Transaction/Activity Reports (STR/SAR) to the national Financial Intelligence Unit within the legal deadline; decisions by the MLRO only.
- Threshold-based reports (e.g. cash or large transaction reports) where the law requires.
- **No tipping-off:** staff must not tell a player about a report or investigation.
- Sanctions hits: freeze and report per sanctions law.

# 6. Record Keeping

CDD records, transaction records, alerts, investigations and reports kept for at least [5] years after the end of the relationship (or longer if required), in tamper-evident storage (KP-LEG-06).

# 7. Training

AML training at onboarding and yearly for all staff; advanced training for support, risk, integrity, payments and finance; records of completion kept.
