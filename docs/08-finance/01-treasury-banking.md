---
id: KP-FIN-01
title: Treasury and Banking Operations
subtitle: Player-funds protection, bank and mobile-money accounts, liquidity, float, FX and payment approvals
version: 1.0
owner: CFO / Head of Treasury
status: Draft
related: KP-ENG-08 Wallet and Ledger · KP-FIN-02 Payments · KP-FIN-03 Financial Controls · KP-LEG-04 AML/KYC
banner: **Draft for finance and counsel review.** Account structures, protection levels and tax treatment depend on each licence and on local banking rules; the values here are the design baseline to be confirmed per jurisdiction.
---

# 1. Objectives

1. **Player money is always safe and available:** every unit players hold on Kilima (cash balances, pending withdrawals, table stacks, tournament pools, tickets at face value) is covered by money in protected accounts at all times.
2. **Withdrawals are paid fast:** enough float is available at each payout provider to pay approved withdrawals within the service level (mobile money: target under 15 minutes after approval).
3. **Company money and player money never mix:** revenue is swept from player-funds accounts to operating accounts only after it is earned and reconciled.
4. **Every movement is controlled:** no single person can move money; all bank and provider movements are reconciled with the ledger daily.

# 2. Account Structure

@widths 1.5,1.2,2.3
| Account | Type | Purpose |
|---|---|---|
| Player-funds account (per currency, per licensed entity) | Segregated / trust bank account at a licensed bank, as the licence requires | Holds player liabilities; receives provider settlements of deposits; funds payout floats |
| Payout float accounts | Mobile-money business accounts (e.g. B2C / disbursement wallets) and PSP balances | Pre-funded balances used to pay withdrawals; topped up from the player-funds account |
| Collection accounts | Mobile-money collection (paybill / merchant) accounts, PSP merchant accounts | Receive deposits; settle to the player-funds account daily (or per provider cycle) |
| Operating account | Company bank account | Receives earned revenue sweeps; pays salaries, vendors, taxes |
| Tax reserve account | Company bank account | Holds withheld and payable gaming taxes until remittance |
| Promotions reserve | Company bank account (or ring-fenced part of operating) | Funds guarantees, bonuses and freerolls approved in the budget |
| B2B settlement accounts | Per-currency accounts for operator settlements | Net network settlements and revenue shares (KP-ENG-14 §6) |

Rules:

- One legal entity per licence holds the player-funds accounts for that licence; accounts are titled and documented so that player funds are protected if the company becomes insolvent, to the level required by the licence (for example a trust arrangement or a regulator-approved segregation).
- Mobile-money and PSP balances that hold player money count as player-funds assets only up to amounts in the provider's settlement terms; exposures per provider are limited (section 5).

# 3. Player-Funds Coverage

Computed hourly from the ledger and daily from bank and provider statements:

```
Player liabilities (per currency) =
      Σ player cash + bonus (if withdrawable per terms) + pending_withdrawal + locked
    + Σ table accounts + fast-fold entries + tournament pools + bounty pools + tickets (face value)
    + Σ operator transfer-wallet positions owed to players

Protected assets (per currency) =
      player-funds bank balances + collections in transit (confirmed, not yet settled)
    + payout float balances − payouts in transit

Coverage ratio = Protected assets / Player liabilities      target ≥ 105 %, hard minimum 100 %
```

- Below 105 %: treasury tops up from the operating or reserve account the same day and investigates.
- Below 100 %: P1 incident; the CFO and compliance officer are notified immediately; new promotions pause; regulator notification if the licence requires it.
- The daily coverage report is signed off by treasury and filed (KP-FIN-03 §3).

# 4. Daily Treasury Cycle

@widths 0.9,4.1
| Time (EAT) | Step |
|---|---|
| 06:00 | Import provider and bank statements for the previous day (automated where APIs exist, otherwise file upload); run three-way reconciliation (KP-FIN-03) |
| 07:00 | Review exceptions; coverage report; float forecast for the day per provider |
| 08:00 | Float top-ups (dual approval), FX conversions if needed, sweep of earned revenue (after reconciliation passes) |
| 12:00, 18:00 | Intraday float checks (automated alerts at 30 % of the day's forecast payouts) |
| Continuous | Automated alerts: float below threshold, provider settlement delayed, coverage below 105 % |

Earned revenue that may be swept = reconciled net rake + tournament fees − rakeback and promotions paid − provider fees − taxes payable, for completed periods only.

# 5. Liquidity and Float Management

- **Forecast:** withdrawals per provider per day are forecast from the last 28 days (weekday and payday seasonality); float target = forecast × 1.5 + largest single approved withdrawal.
- **Top-up path:** player-funds bank account → provider float (bank transfer or provider-specific top-up). Lead times per provider are recorded; top-ups are scheduled before float falls below one day of forecast.
- **Provider exposure limits:** maximum balance at any single provider = the lesser of 3 days of payouts or a limit set by the risk committee after provider due diligence. Excess is settled back to the bank.
- **Weekend and holiday planning:** floats for bank holidays are pre-funded on the last business day.
- **Provider outage:** withdrawals are routed to an alternative provider for the same instrument type where possible; otherwise they queue with player notification (KP-FIN-02 §6).

# 6. Currencies and FX

- Pools and tables run in a pool currency (USD at launch; local currencies where a licence requires ring-fenced local play).
- Players deposit and withdraw in local currency (KES, NGN, GHS, UGX, TZS, AOA, …) with conversion at deposit and withdrawal time; the rate and spread are disclosed before confirmation (KP-ENG-08 §4.9).
- **Rate source:** a regulated FX provider or bank feed; quotes valid 60 seconds; spread policy (e.g. 1.5–3 %) approved by the CFO and published in the Terms.
- **Exposure:** because player liabilities in USD pools are backed by USD in the player-funds account, treasury keeps the currency of protected assets aligned with the currency of liabilities; net FX positions from deposits and withdrawals are closed daily (or when above a threshold) through the FX provider.
- **Capital controls:** some markets restrict converting or moving foreign currency. The licence and banking set-up for each jurisdiction must confirm that player withdrawals can always be paid in the local currency; if not, a local-currency pool is required.

# 7. Payment Approvals and Segregation of Duties

@widths 2,1.3,1.7
| Movement | Initiator | Approver(s) |
|---|---|---|
| Float top-up up to 25,000 USD eq. | Treasury analyst | Treasury manager |
| Float top-up above 25,000 USD eq., any sweep, any FX above 50,000 USD eq. | Treasury manager | CFO (or delegate) |
| B2B operator settlement | Finance (settlement) | Treasury manager + CFO |
| Tax remittance | Tax / finance | CFO |
| Manual player adjustment | Support / finance (KP-ENG-08 §4.7) | Second finance user above threshold |
| Change of bank or provider beneficiary details | Treasury manager | CFO + call-back verification to a known number |

- Bank portal users have individual credentials with hardware tokens; no shared logins.
- Beneficiary changes are verified out-of-band (call-back) to prevent payment-diversion fraud.
- Treasury staff cannot approve their own initiations; system roles enforce this (KP-ENG-02 §5).

# 8. Banking Relationships

- At least two banks per licensed entity (primary and backup) and at least two payout providers per payment type per country, to avoid a single point of failure.
- Due diligence on every provider: licence, financial strength, settlement terms, data protection, security certifications, incident history.
- Bank and provider contacts, escalation paths and settlement calendars are kept in the treasury runbook (KP-OPS-03).

# 9. Treasury Reporting

@widths 1.6,1,2.4
| Report | Frequency | Content |
|---|---|---|
| Coverage report | Daily | Liabilities vs protected assets per currency; exceptions |
| Cash position | Daily | Balances per bank and provider, in-transit, forecast |
| FX report | Daily / monthly | Conversions, spreads earned, open positions |
| Float utilisation | Weekly | Per provider: forecast accuracy, top-ups, idle float |
| Treasury pack | Monthly | Above, plus bank fees, provider costs, incidents; reviewed by the CFO and board finance committee |
