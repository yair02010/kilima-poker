---
id: KP-LEG-06
title: Data Retention Policy
subtitle: How long each type of record is kept, where, and how it is deleted
version: 0.1
owner: Data Protection Officer / Legal Counsel
status: DRAFT for counsel review
banner: **DRAFT — not legal advice.** Periods marked [ ] must be confirmed against the licence conditions, AML law, tax law and data-protection law of each jurisdiction. When laws differ, the longest mandatory period applies only to the data it covers.
---

# 1. Principles

- Keep data only as long as needed for its purpose or as required by law.
- Records required by regulators (hands, ledger, audit, RNG) are immutable (WORM) for their retention period.
- Deletion is automated where possible; legal holds suspend deletion for data related to investigations, disputes or litigation.

# 2. Retention Schedule

@widths 1.7,1.4,1.9
| Record | Retention | Storage |
|---|---|---|
| Hand histories (full, incl. hole cards and deck) | [5–7] years (licence) | ClickHouse 13 months; S3 Object Lock thereafter |
| RNG audit logs | [5–7] years (licence) | S3 Object Lock |
| Ledger transactions and entries | [7] years after account closure (tax/AML) | PostgreSQL + archive partitions + WORM exports |
| Payment records | [7] years | Ledger cluster + archive |
| KYC results and CDD records | [5] years after relationship ends (AML) | compliance DB; documents at provider under contract |
| AML alerts, investigations, STRs | [5+] years | compliance DB (restricted) |
| Integrity cases and evidence | [5] years after case closure | integrity DB + archive |
| Audit logs (staff and security) | [7] years | audit DB + WORM |
| Security logs (SIEM) | 1 year online, [3] years archive | SIEM + archive |
| Responsible-gaming records | [5] years after account closure | compliance DB |
| Support tickets and chat | 3 years | ticketing |
| Table chat | 12 months (longer if part of a case) | ClickHouse |
| Integrity telemetry (summaries) | 24 months; raw batches 90 days | ClickHouse |
| Marketing consent and history | Consent life + proof period [2 years] | CRM |
| Application logs | 30–90 days | Loki |
| Backups | Per KP-OPS-05 §2 | Backup account |
| Play Money data | Account life + 2 years; hands 12 months | Play deployment |

# 3. Deletion and Anonymisation

- On a valid erasure request, personal data not under mandatory retention is deleted; data under retention is restricted (access limited to compliance) and deleted when the period ends.
- Anonymisation for analytics: identifiers replaced with irreversible tokens; free text removed.
- Deletion jobs run monthly with reports; WORM data is deleted automatically by lifecycle rules after retention.

# 4. Responsibilities

DPO owns this policy; data owners (service owners) implement retention; compliance manages legal holds; internal audit verifies yearly.
