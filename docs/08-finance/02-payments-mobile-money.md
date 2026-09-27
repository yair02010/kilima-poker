---
id: KP-FIN-02
title: Payments and Mobile Money
subtitle: Deposit and withdrawal methods, provider integrations, payout pipeline, fraud and failure handling
version: 1.0
owner: Head of Payments
status: Draft
related: KP-ENG-08 Wallet and Ledger · KP-ENG-03 §9 Cashier API · KP-FIN-01 Treasury · KP-SEC-04 Fraud · KP-LEG-04 AML/KYC
---

# 1. Payment Methods

@widths 1.4,1.6,2
| Type | Examples (by market) | Notes |
|---|---|---|
| Mobile money | M-Pesa (Kenya, Tanzania), MTN MoMo (Ghana, Uganda and others), Airtel Money (several markets), other local wallets | Primary method. Deposit by payment request to the player's phone (e.g. STK push), withdrawal by disbursement to the verified number |
| Cards | Visa, Mastercard, local card schemes through aggregators (e.g. Flutterwave, Paystack, Cellulant, DPO) | Hosted or tokenised checkout only (PCI DSS SAQ A). Card withdrawals where the scheme and acquirer allow, otherwise to another verified method |
| Bank transfer | Local instant payment systems and bank transfers | For large amounts and B2B settlements |
| Vouchers / agents | Where licensed providers offer them | Optional per market; subject to AML review |

The methods shown to a player come from the Jurisdiction Policy Engine and the cashier configuration: jurisdiction, currency, KYC level, operator and risk score. Crypto-assets are **not** offered in v1 (licensing, AML and consumer-protection risk); any future addition requires an ADR and counsel approval.

# 2. Provider Integration Architecture

```
cashier
  ├── provider adapters (one per provider): request, callback, status query, payout, statement import
  ├── routing: choose provider by method, country, currency, amount, health and cost
  ├── state machine per payment (below)
  ├── idempotency: our paymentId is sent as the provider's merchant reference where supported
  └── wallet postings via the internal API (deposit, fee, fx, withdraw_hold, withdraw, withdraw_release)
```

- **Callbacks** are authenticated (signature, mutual TLS or IP allow-list plus a status re-query to the provider before crediting, depending on what each provider supports). A callback is never trusted alone for crediting when the provider offers a status API.
- **Status polling** covers lost callbacks: pending payments are re-queried at 30 s, 2 min, 10 min, 1 h, then hourly up to 72 h.
- **Adapters are certified** in a provider sandbox and with a small live pilot before a method is enabled.

## Payment state machine

```
deposit:     initiated → awaiting_customer → pending → completed | failed | cancelled | expired
                                                     completed → reversed (chargeback / provider reversal)
withdrawal:  requested → review? → approved → sent → completed | failed → released
                          └→ rejected → released
```

Ledger postings happen only on terminal or money-moving transitions (KP-ENG-08 §4).

# 3. Deposits

1. The player chooses a method and amount; the cashier shows limits, fees, FX rate (if converting) and any deposit tax before confirmation.
2. Pre-checks: KYC level vs deposit threshold, deposit limits (responsible gaming), self-exclusion, jurisdiction, velocity and fraud score, and — for mobile money — that the paying number is the player's verified number or an instrument already verified to the player (third-party deposits are not accepted).
3. Payment request to the provider (e.g. STK push to the phone); the player confirms with their PIN on the handset.
4. Confirmation → `deposit` posting → `wallet:balance` pushed to the client.
5. Failure messages are specific and localised (insufficient funds at the wallet, PIN timeout, cancelled by user, provider unavailable).

**Name and number ownership:** where the provider returns the payer's registered name, it is compared with the KYC name (fuzzy match with transliteration rules); mismatches are flagged, and funds from unverified third-party instruments are returned to source where possible.

# 4. Withdrawals

1. Request with step-up (KP-ENG-02 §4.3) to a **verified instrument in the player's own name** → `withdraw_hold`.
2. Automated checks (all must pass for auto-approval):
  - KYC verified; no open AML alert or integrity case with a hold; no SIM-swap signal in the last 72 hours; phone or password not changed in the last 24–72 hours.
  - Amount within auto-approval limit (e.g. ≤ 500 USD eq. per day, configurable per jurisdiction and risk tier).
  - "Deposit-and-withdraw" check: withdrawals of recently deposited funds with little or no play go to review (AML).
  - Bonus wagering satisfied for bonus-derived funds.
3. Otherwise → **manual review** by a risk analyst (four-eyes above a higher threshold) with the reasons listed.
4. Approved → disbursement via the provider → `sent` → provider confirmation → `withdraw` posting; failure → `withdraw_release` and notification.
5. Taxes on withdrawal (where the tax rule is at withdrawal time) are posted and shown on the statement.

**Instrument ownership before the first payout:** where the provider offers an account-holder name lookup, the name is verified before paying; otherwise the first payout is capped at a small amount and the name returned by the provider is checked before larger payouts are allowed.

Service levels: auto-approved mobile-money withdrawals complete in under 15 minutes (p95) when providers are healthy; reviewed withdrawals are decided within 24 hours (business days 8 hours).

# 5. Fees

- Provider fees are recorded per transaction (`provider_fee`); whether they are absorbed by Kilima or charged to the player is a per-method configuration shown before confirmation.
- Free-withdrawal allowances (e.g. first N per month) are configurable promotions funded from the promotions budget.

# 6. Failure Handling

@widths 1.7,3.3
| Situation | Handling |
|---|---|
| Callback never arrives | Status polling; after 72 h the payment is marked for manual investigation, never auto-credited or auto-failed without provider evidence |
| Duplicate callbacks | Idempotent by (provider, provider reference) |
| Credit confirmed after we marked the deposit failed | Late credit is posted (no loss to the player), flagged for reconciliation |
| Provider outage | Health checks mark the provider degraded; routing switches to an alternative; deposits show "method temporarily unavailable"; queued withdrawals are sent when the provider recovers or re-routed with player consent |
| Payout sent but result unknown | Status query; never re-send the payout until the first is confirmed failed by the provider (prevents double payouts) |
| Reversal / chargeback | `deposit_reversal`; if funds were already used, the account is restricted and the balance goes negative only in a separate receivable account handled by collections (never the player cash account) |

# 7. Fraud Controls

- Fraud score on every deposit and withdrawal (device, velocity, instrument age, geolocation, account age, behaviour; KP-SEC-04).
- Stolen-wallet and account-takeover patterns: new device + phone change + withdrawal to a new instrument → blocked and reviewed.
- Promotion abuse: bonus eligibility requires verified identity and one account per person; bonus-derived withdrawals need wagering.
- Collusion-driven cash-out (chip dumping then withdrawal) → integrity signal triggers a hold (KP-ENG-09).

# 8. Provider Onboarding Checklist

- Licence and regulatory status; contract with settlement terms, fees, SLAs, dispute handling; data-processing agreement.
- Technical: sandbox integration, callback security, status API, statement files, name lookup support, idempotency support, rate limits.
- Operational: support contacts, incident process, settlement calendar, float requirements.
- Certification: 100 % of the adapter test suite passes; live pilot with staff accounts; finance sign-off on reconciliation of the pilot.

# 9. Metrics

Deposit success rate by method and provider (target ≥ 85 % for mobile money after customer confirmation), time to credit, withdrawal auto-approval rate, time to payout (p50/p95), review backlog, failed payouts, reversals, fraud losses (bps of volume), provider cost per transaction.
