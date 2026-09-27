---
id: KP-HBK-18
title: Secure Development Checklist
subtitle: Security practices every engineer applies — per story, per PR and per release
version: 1.0
owner: CISO
status: Approved
related: KP-SEC-02 Security Policy · KP-SEC-03 Security Architecture · KP-SEC-01 Threat Model
---

# 1. Per Story (design)

- [ ] What data classes are touched (KP-SEC-02 §3)? Is any new personal data collected, and is it necessary?
- [ ] Who can call this and what can they see? Write the permission rule first.
- [ ] Could it move money, reveal cards, or change odds? If yes → critical risk class.
- [ ] Abuse cases: how would a cheater, fraudster or bot use this feature?

# 2. Per Pull Request

- [ ] Inputs validated by generated schemas; unknown fields rejected
- [ ] Authorisation checked in the handler (not only in the UI)
- [ ] No secrets, tokens, OTPs, phone numbers or hole cards in logs, errors or analytics
- [ ] Queries parameterised; no string-built SQL
- [ ] Outbound calls use allow-listed hosts and timeouts
- [ ] Idempotency and replay protection for money actions
- [ ] Dependencies justified; SCA clean
- [ ] Tests for the denied paths (wrong role, wrong tenant, wrong mode, expired token)

# 3. Per Release

- [ ] SAST/SCA/container/IaC scans clean (critical/high block)
- [ ] New endpoints appear in DAST scope
- [ ] Threat model updated for new components or integrations
- [ ] Security sign-off for critical changes

# 4. Secrets Handling

Secrets come from the secret store at runtime. If a secret is ever committed or pasted in chat: rotate it immediately (KP-OPS-03 RB-10), then clean history; report in `#ask-security`.

# 5. Reporting Vulnerabilities

Found something? Post privately to the security team (not a public channel) with steps to reproduce. There is no blame for reporting, including your own mistakes.
