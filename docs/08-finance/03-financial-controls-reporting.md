---
id: KP-FIN-03
title: Financial Controls, Reconciliation and Reporting
subtitle: Three-way reconciliation, month-end close, revenue recognition, taxes and audit
version: 1.0
owner: CFO / Financial Controller
status: Draft
related: KP-ENG-08 Wallet and Ledger · KP-FIN-01 Treasury · KP-FIN-02 Payments · KP-ENG-16 §3 Reporting
banner: **Draft for finance, tax and audit review.** Revenue recognition, tax bases and reporting formats must be confirmed with the external auditor and tax advisers for each licensed entity.
---

# 1. Control Objectives

@widths 0.5,4.5
| # | Objective |
|---|---|
| C1 | Completeness: every real-world money movement (provider, bank) has exactly one matching ledger transaction, and vice versa |
| C2 | Accuracy: amounts, currencies and FX rates in the ledger equal the provider and bank records |
| C3 | Existence of player funds: player liabilities are covered by protected assets (KP-FIN-01 §3) |
| C4 | Game money integrity: chips are conserved; rake equals the published schedule applied to each hand |
| C5 | Authorisation: no money moves without the required approvals (four-eyes, segregation of duties) |
| C6 | Reporting: financial, tax and regulatory reports are complete, on time and reproducible |

# 2. Reconciliations

## 2.1 Automated, per event

- Every ledger transaction sums to zero per currency (database-enforced in the posting function).
- Every hand: pots + returned bets = chips committed; rake = schedule applied; settlement transaction totals = hand record (KP-ENG-08 §6).
- Every tournament: entries − refunds + overlay = prizes + bounties paid; pool = 0 when completed.

## 2.2 Daily three-way reconciliation

```
Ledger (clearing:{provider}:{ccy} movements)  ⇄  Provider statement / API report  ⇄  Bank statement (settlements)
```

@widths 1.4,3.6
| Check | Rule |
|---|---|
| Ledger ↔ provider | Match on provider reference; amounts and currencies equal; unmatched items listed by age |
| Provider ↔ bank | Provider settlement batches equal bank credits (net of provider fees per contract) |
| Balances | Clearing account balance = funds in transit per provider; float balances per provider statement = float per ledger |
| Players | Σ player accounts = liabilities in the coverage report |

Exceptions are worked in a reconciliation tool with an owner, a reason code (timing, provider error, our error, fraud) and a resolution posting reference. Exceptions older than 3 business days escalate to the Financial Controller; any unexplained difference above 0.01 % of daily volume is a P2 incident; a ledger imbalance is a P1 (KP-OPS-03).

## 2.3 Monthly

- Cached balances = sum of entries for 100 % of accounts.
- Table and fast-fold accounts of closed sessions = 0; `house:integrity` returns to 0 for closed cases.
- Bonus liability roll-forward (opening + granted − released − expired = closing).
- Operator network positions agree with operator statements (signed by both parties).

# 3. Daily Controls Checklist

- [ ] Statements imported for all providers and banks
- [ ] Three-way reconciliation run; exceptions assigned
- [ ] Coverage report ≥ 105 % per currency, signed
- [ ] Manual adjustments of the previous day reviewed against tickets (sample 100 % above threshold, 10 % below)
- [ ] Withdrawal review decisions sampled (5 %) by a second reviewer
- [ ] Failed and pending payments older than 24 h reviewed

# 4. Revenue Recognition (baseline, to confirm with the auditor)

@widths 1.6,3.4
| Revenue | Recognised |
|---|---|
| Cash-game rake | When the hand settles (the `hand_settlement` posting) |
| Tournament and SNG fees | When the tournament starts (fees of players who unregister before the start are refunded and never recognised) |
| Spin fee | Included in the multiplier edge: recognised when the Spin completes as buy-ins minus prizes paid |
| FX spread | When the conversion is executed |
| B2B revenue | Kilima's share of network rake per contract; operator revenue share is a cost of revenue |

Gross Gaming Revenue (GGR) for poker = rake + fees (+ Spin edge). Net Gaming Revenue (NGR) = GGR − bonuses, rakeback and promotions − gaming taxes (definitions per jurisdiction may differ and override these for tax purposes).

Promotions: guarantees' overlays, freerolls and bonuses are costs when paid (posted); granted but unreleased bonus funds are a liability only if the terms make them withdrawable.

# 5. Taxes

- Tax rules (GGR tax, excise on deposits or stakes, withholding tax on winnings, VAT on fees where applicable) are **configuration per jurisdiction** (`ledger.tax_rules`) approved by the CFO with tax advisers; rates are never hard-coded (KP-ENG-08 §4.8).
- Withheld and payable taxes accumulate in `tax:{jur}:{kind}` accounts; remittance posts from the tax reserve bank account and clears the liability.
- Monthly tax returns are produced from the ledger with a reconciliation between the return, the ledger and the payment.
- Where a regulator or tax authority requires real-time or daily data feeds, they are produced by the data platform from the ledger and monitored for completeness (NFR-74).

# 6. Month-End Close (target: business day 5)

@widths 0.6,4.4
| Day | Steps |
|---|---|
| BD 1 | Final statements; complete daily reconciliations; cut-off of pending payments |
| BD 2 | Monthly reconciliations (2.3); bonus and ticket roll-forwards; FX revaluation of non-functional-currency balances |
| BD 3 | Operator settlement statements issued; revenue and tax schedules; accruals (provider fees, KYC and SMS costs) |
| BD 4 | Management accounts, GGR/NGR by jurisdiction, KPI pack |
| BD 5 | CFO review and sign-off; regulatory financial reports where due |

# 7. Dormant Accounts and Unclaimed Funds

- Accounts with no login for 12 months are marked dormant; the player is notified before (at 11 months) through all verified channels.
- Balances are never taken as revenue without a legal basis: they remain player liabilities, or are handled as unclaimed property where the law and licence require it. Any dormancy fee must be permitted by the licence and disclosed in the Terms (default: none).

# 8. Audit and Evidence

- The ledger, audit log and hand archive are immutable and retained per licence (KP-LEG-06).
- External financial audit yearly; regulator audits as required; internal audit of treasury and payments controls every 6 months.
- Evidence packs (reconciliations, sign-offs, approvals) are stored per day and month in a controlled repository.
- Access to financial systems follows least privilege and is reviewed quarterly.

# 9. Financial Reports

@widths 1.7,1,2.3
| Report | Frequency | Owner |
|---|---|---|
| Daily finance pack (liabilities, coverage, deposits, withdrawals, rake, fees, promotions, reconciliation status) | Daily | Treasury |
| GGR/NGR by jurisdiction, product and operator | Monthly | Financial Controller |
| Operator settlement statements | Monthly (or weekly) | Finance – B2B |
| Tax returns and remittances | Per jurisdiction | Tax |
| Regulatory financial returns | Per licence | Compliance + finance |
| Management accounts and KPIs | Monthly | CFO |
