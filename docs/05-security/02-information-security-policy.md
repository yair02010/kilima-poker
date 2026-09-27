---
id: KP-SEC-02
title: Information Security Policy
subtitle: Governance, access control, secrets, secure development, vulnerabilities, data protection, vendors and training
version: 1.0
owner: Head of Security (CISO)
status: Draft — to be approved by the board
related: KP-SEC-01 Threat Model · KP-SEC-03 Security Architecture · KP-OPS-04 Incident Response · KP-LEG-06 Data Retention
---

# 1. Purpose and Scope

This policy sets the mandatory security rules for Kilima Poker: all employees, contractors, systems, data and vendors. It is the top document of an ISMS aligned with ISO/IEC 27001:2022 (certification target within 18 months of the first Real Money launch, NFR-37) and supports licence requirements for technical and security standards in each jurisdiction. Breaches of this policy may lead to disciplinary action.

# 2. Governance and Roles

@widths 1.6,3.4
| Role | Responsibilities |
|---|---|
| Board / CEO | Approves this policy and the risk appetite; receives quarterly security reports |
| CISO (Head of Security) | Owns the ISMS, risk register (security), policies, audits, incident command for security incidents |
| Security engineering | Cloud, application and detection engineering; security reviews; pentest coordination |
| Data Protection Officer | Privacy compliance, DPIAs, data-subject requests, breach notification decisions (with legal) |
| Engineering leads | Secure design and code in their area; fix vulnerabilities within SLAs |
| Every staff member | Follow this policy; report incidents and suspicious activity immediately |

A security steering group (CISO, CTO, DPO, compliance officer, CFO) meets monthly.

# 3. Asset Management and Classification

@widths 1.1,2.4,1.5
| Class | Examples | Handling |
|---|---|---|
| Restricted | Signing keys, RNG seeding, provider credentials, live hole cards, KYC results, ledger admin access | Only in KMS/HSM or secret manager; no human export; access logged and reviewed |
| Confidential | Personal data, hand histories with hole cards, integrity models, financial reports, source code | Need-to-know; encrypted at rest and in transit; no personal devices |
| Internal | Internal docs, dashboards without personal data | Staff only |
| Public | Marketing, House Rules, public status | — |

An asset inventory (cloud resources, repositories, SaaS, devices) is maintained automatically where possible and reviewed quarterly.

# 4. Access Control

- Single sign-on for all staff systems with phishing-resistant MFA (FIDO2 hardware keys); no shared accounts.
- Least privilege and role-based access; access requests approved by the asset owner; automatic removal on leaving (same day).
- **Production access:** no standing access. Just-in-time elevation (max 4 h) with approval, recorded sessions, and alerts. No one has write access to ledger tables (KP-ENG-05 §5).
- **Privileged break-glass accounts:** sealed credentials, two-person retrieval, immediate alert and post-use review.
- Quarterly access reviews for production, back-office, finance and bank portals.
- Staff and their household members may not hold Real Money accounts on the network (KYC match check).

# 5. Secrets and Cryptography

- Secrets in AWS Secrets Manager; keys in KMS (CloudHSM where a licence requires dedicated HSMs). Never in code, images, tickets, chat or logs; secret scanning on every commit.
- Rotation: service credentials 90 days (automatic where supported); signing keys yearly and on suspicion; provider API keys per provider guidance.
- Encryption: TLS 1.2+ (1.3 preferred) externally; mTLS internally; AES-256 at rest for all stores; field-level encryption for sensitive personal data (KP-ENG-05 §9).
- Approved algorithms only (a crypto standard lists them); no custom cryptography.

# 6. Secure Development

- Security requirements in every epic; threat-model update for architecture changes (KP-SEC-01).
- Secure coding standard (OWASP ASVS L2, L3 for identity, wallet, cashier, rng); mandatory lint rules (KP-ENG-11 §2.1).
- Automated checks in CI: SAST, SCA, secrets, IaC, container scanning; DAST in staging weekly; mobile app scanning (MASVS).
- Security review (by security engineering) for changes to auth, payments, ledger, RNG, integrity and infrastructure permissions.
- Yearly security training for all engineers; secure-coding training at onboarding.

# 7. Vulnerability Management

@widths 1.2,1.4,2.4
| Severity (CVSS / context) | Fix deadline | Notes |
|---|---|---|
| Critical | 48 hours | Exploitable in production or affecting money/cards/RNG: incident process |
| High | 7 days | |
| Medium | 30 days | |
| Low | 90 days or accepted | Risk acceptance by the CISO, recorded |

- External penetration tests before each Real Money launch and yearly; mobile app tests; red-team exercise yearly from GA.
- Public vulnerability disclosure policy (`security.txt`) and a bug bounty programme after GA.

# 8. Logging and Monitoring

- Security-relevant logs from all services, cloud control planes, identity provider, CI/CD and back-office go to a SIEM; retention at least 1 year online (longer where licences require).
- Detection use cases: impossible travel for staff, privilege elevation, mass data access, ledger anomalies, RNG health failures, new admin roles, disabled logging, unusual payout patterns.
- 24/7 alert coverage from launch through an on-call rotation and, at GA, a managed detection and response partner.

# 9. Data Protection

- Privacy by design; DPIA for new processing of personal data (e.g. telemetry, ML models).
- Data minimisation; retention per KP-LEG-06; KYC documents held by the KYC provider.
- Cross-border transfers assessed against each country's data-protection law (e.g. Kenya, Nigeria, Ghana, Uganda, Angola); contractual safeguards with vendors.
- Personal-data breaches follow KP-OPS-04 §4 with regulator notification within legal deadlines.

# 10. Endpoints and Workplace

- Company-managed laptops with disk encryption, EDR, automatic updates and screen lock; production access only from managed devices.
- No personal data or source code on personal devices; mobile access to email and chat through managed apps.
- Clean-desk and screen-privacy rules for staff handling KYC, payments and integrity cases.

# 11. Vendors

- Security and privacy due diligence before contracting (questionnaire, certifications such as ISO 27001/SOC 2/PCI DSS where relevant, pen-test summaries).
- Contracts include data-processing terms, breach notification, audit rights and sub-processor controls.
- Critical vendors (payments, KYC, cloud, CDN, SMS) are reviewed yearly and monitored for incidents.

# 12. Business Continuity

- Business impact analysis for key processes (play, payments, support, integrity); continuity plans tested yearly.
- Disaster recovery per KP-OPS-05; crisis communication per KP-OPS-04.

# 13. Compliance and Review

This policy is reviewed yearly and after major incidents or regulatory changes. Compliance is checked through internal audits, the ISO 27001 programme and regulator audits. Exceptions require CISO approval with an expiry date.
