---
id: KP-SEC-04
title: Fraud and Account Protection
subtitle: Account takeover, identity fraud, multi-accounting, bonus abuse and payment fraud
version: 1.0
owner: Head of Risk
status: Draft
related: KP-ENG-02 Identity · KP-FIN-02 Payments · KP-ENG-09 Game Integrity · KP-LEG-04 AML/KYC
---

# 1. Scope

This document covers fraud against the platform and its players outside the poker game itself: account takeover (ATO), synthetic and stolen identities, multi-accounting for bonuses, payment fraud and money-mule activity. In-game cheating is covered by KP-ENG-09; money-laundering obligations by KP-LEG-04. The three functions share signals and the account graph.

# 2. Risk Engine

A shared risk engine in `compliance`/`integrity` scores events in real time:

@widths 1.5,3.5
| Event | Signals |
|---|---|
| Registration | Phone intelligence (line type, carrier, age where available), device attestation and fingerprint, IP/ASN reputation, velocity per device/IP/subnet, jurisdiction |
| Login | Known device, attestation, geovelocity, failed attempts, credential-stuffing patterns, new network |
| Profile change (phone, password, instrument) | Recent login risk, SIM-swap check, time since last change, device age |
| Deposit | Instrument ownership (name match), velocity, amount vs history, first deposit, bonus claimed |
| Withdrawal | Recent changes, deposit-play-withdraw pattern, integrity/AML flags, new instrument, amount |

Decisions: `allow`, `step_up`, `review`, `block`. Each decision stores the score, contributing signals and model/rule versions for audit and tuning.

# 3. Account Takeover

- Device binding and step-up on new devices (KP-ENG-02 §4.2).
- After a phone, password or 2FA change: 24–72 h cool-down on withdrawals and on adding payout instruments; notification to all verified channels.
- SIM-swap API checks where mobile operators offer them; otherwise heuristics (sudden OTP failures, new device + phone change).
- Session anomaly detection: token used from two countries within an impossible time → revoke all sessions.
- Player-facing security centre: list of devices and sessions, one-tap "log out everywhere", login alerts.

# 4. Identity Fraud and Multi-Accounting

- One verified identity per network in Real Money (KYC deduplication across tenants using name + DOB + document hashes).
- Liveness checks at KYC; document authenticity checks by the provider; manual review for mismatches.
- Account graph (devices, instruments, phones, emails, IP ranges, addresses) with clustering; linked accounts cannot share tables (KP-ENG-07 §3.2), cannot both claim welcome offers, and are reviewed.
- Minors: age verification in KYC; age-restricted marketing; accounts found to belong to minors are closed and deposits returned (KP-LEG-05).

# 5. Bonus and Promotion Abuse

- Welcome offers require verified identity and a first deposit from an instrument in the player's name.
- Bonuses release only with rake paid; withdrawal before release forfeits unreleased bonus funds (per Terms).
- Referral rewards only after the referred player is verified and has paid a minimum amount of rake; referral rings detected in the graph.
- Freeroll farming: freeroll entries limited per verified identity and per device.

# 6. Payment Fraud and Money Mules

- Deposits only from instruments in the player's name; third-party deposits refused or returned.
- Withdrawals only to verified own instruments; the first payout to a new instrument is capped until ownership is confirmed (KP-FIN-02 §4).
- Mule indicators: many deposits from different instruments, rapid deposit-withdraw cycles, withdrawals soon after receiving chips from others at the table (chip dumping), shared instruments across accounts.
- Chargebacks and reversals handled per KP-FIN-02 §6; repeat offenders blocked network-wide.

# 7. Operations

- Risk analysts review the `review` queue with SLAs (high-value withdrawals first); decisions and reasons recorded.
- Weekly tuning meeting (risk, integrity, AML, payments) with metrics: fraud loss (bps of deposits), false-positive rate (legitimate withdrawals delayed), ATO incidents, review backlog.
- Intelligence sharing with payment providers and, where lawful, industry fraud networks.

# 8. Targets

@widths 2.5,2.5
| Metric | Target |
|---|---|
| Fraud losses | < 10 bps of deposit volume |
| Confirmed ATO incidents | < 1 per 100,000 active accounts per month |
| Legitimate withdrawals sent to manual review | < 10 % |
| Review decision time | 95 % within 24 h |
