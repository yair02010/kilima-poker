---
id: KP-PRJ-04
title: Budget and Vendors
subtitle: Cost structure, vendor categories, selection criteria and decision log
version: 1.0
owner: CFO / Programme Director
status: Template — amounts to be filled from current quotes
related: KP-PRD-01 Business Case · KP-PRJ-02 Hiring Plan · KP-FIN-02 Payments · KP-SEC-02 §11 Vendors
---

# 1. How to Use

Amounts are entered from current quotes and salary benchmarks for the chosen hiring locations; the table structure below is the baseline for the financial model. Values in brackets are placeholders.

# 2. Budget Structure

## 2.1 One-time and project costs

@widths 2,1,2
| Item | Amount (USD) | Notes |
|---|---|---|
| Licences and application fees (first jurisdiction) | [ ] | Per regulator schedule |
| Legal counsel (market opinions, entity set-up, documents) | [ ] | Per jurisdiction |
| RNG and game certification (lab) | [ ] | Initial certification + per-jurisdiction reports |
| Penetration tests (pre-launch) | [ ] | Web, API, mobile, cloud |
| Brand and design (KILIMA identity, design system) | [ ] | |
| Device lab (physical Android devices) | [ ] | ~15 devices |
| Recruitment | [ ] | |

## 2.2 Monthly running costs

@widths 2,1,2
| Item | Amount (USD / month) | Notes |
|---|---|---|
| Staff (by function, per KP-PRJ-02) | [ ] | Largest cost |
| Cloud (AWS: EKS, Aurora, ElastiCache, MSK, S3, data transfer) | [ ] | Scales with players; DR standby |
| CDN, WAF, DDoS protection | [ ] | |
| Observability (metrics, logs, traces, incident platform) | [ ] | |
| ClickHouse / data platform | [ ] | |
| KYC and AML screening | [ ] | Per verification and per screening |
| SMS / WhatsApp OTP | [ ] | Per message by country |
| Payment providers | [ ] | % of volume + fixed fees |
| Geolocation and device intelligence | [ ] | |
| Support tooling | [ ] | Per agent |
| Licence fees (annual, pro rata) and gaming taxes | [ ] | Per jurisdiction |
| Marketing | [ ] | Tests until retention targets met |
| Promotions and rewards | [ ] | % of GGR (KP-FIN-04) |

# 3. Vendor Categories and Selection Criteria

@widths 1.5,1.6,1.9
| Category | Candidates (examples, to evaluate) | Criteria |
|---|---|---|
| Cloud | AWS (Cape Town region) | African region, managed services, compliance |
| CDN / DDoS | Cloudflare, Akamai, AWS CloudFront + Shield | African PoPs, WebSocket support, DDoS capacity |
| Mobile money / PSP | M-Pesa (Safaricom, Vodacom), MTN MoMo, Airtel Money, Flutterwave, Paystack, Cellulant, DPO | Gaming-merchant acceptance, coverage, payouts, name lookup, APIs, settlement terms |
| KYC / AML | Smile ID, Sumsub, Onfido, Veriff; screening providers | African ID document coverage, liveness, pricing, data location |
| SMS / WhatsApp | Africa's Talking, Twilio, Infobip, Meta WhatsApp Business | Delivery rates per country, fraud controls, cost |
| Test laboratory | GLI, BMM Testlabs, iTech Labs | Accepted by target regulators, timelines |
| Geolocation | IP intelligence and mobile location SDK vendors | Accuracy in Africa, VPN detection |
| Observability | Grafana Cloud, Datadog | Cost at scale, OpenTelemetry support |

Common criteria: security certifications (ISO 27001, SOC 2, PCI DSS where relevant), data-processing terms, SLAs, financial stability, references in African gaming, exit options.

# 4. Vendor Decision Log

@widths 1.2,1.2,1,1.6
| Date | Category | Decision | Reason / alternatives |
|---|---|---|---|
| | | | |
