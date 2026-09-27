---
id: KP-ENG-02
title: Identity and Auth Service
subtitle: Phone-first registration, OTP, devices, step-up, tokens and RBAC
version: 1.0
owner: Tech Lead — Platform
status: In review
related: KP-ENG-01 (D2, D3, D9, D11) · KP-ENG-03 API · KP-ENG-05 Data Model · KP-SEC-04 Fraud and Account Protection
---

# 1. Purpose and Scope

The `identity` service is the single owner of player and staff identity for Kilima Poker.

- **Owns:** registration, phone and email verification, one-time passwords (OTP), login, devices, sessions, access and refresh tokens, step-up verification, logout, password reset and change, TOTP and passkeys, roles and permissions, account status (active, restricted, suspended, closed, banned), screen names, tenant (operator) membership, security audit events, and the public signing keys (JWKS).
- **Does not own:** profiles and statistics (`player`), KYC and geolocation decisions (`compliance`), balances (`wallet`), game logic (`table-server`).
- **Stack:** Node.js 24 LTS, TypeScript, Fastify, PostgreSQL 16 (`identity` schema, `core` cluster), Redis 7, `jose` (JWT/JWKS), Argon2id, WebAuthn (`@simplewebauthn/server`), OpenTelemetry, Vitest + Supertest.

# 2. Identity Model

@widths 1.4,3.6
| Concept | Rule |
|---|---|
| Tenant (operator) | Every account belongs to exactly one operator (`tenantId`). Kilima's own brand is tenant `kilima`. The same phone number may exist once per tenant |
| Account | Internal id (UUIDv7). Never shown to other players |
| Screen name | 3–16 characters `[A-Za-z0-9_.-]`, unique across the whole network (all tenants) because players meet across skins; profanity and impersonation filter; one free change per 12 months |
| Phone number | E.164, verified by OTP; primary login identifier. Changing it requires step-up and a 72-hour withdrawal cool-down |
| Email | Optional; verified by link; used for receipts and recovery |
| Password | Argon2id (m = 64 MiB, t = 3, p = 1); minimum 8 characters, checked against breached-password lists; not required when a passkey is registered |
| Device | A registered installation or browser, identified by a device id and an attestation result (Android Play Integrity, Apple App Attest) or a browser fingerprint |
| Session | One logged-in device; has a session id (`sid`), a refresh-token family and a risk level |
| Mode | Play Money and Real Money are separate deployments with separate account databases; there is no shared account (KP-ENG-01 D9) |

# 3. Architecture

```
Client ──► Edge/WAF ──► API ingress ──► identity (Fastify, stateless, N replicas)
                                         ├── PostgreSQL  identity.* (accounts, devices, credentials, roles, audit)
                                         ├── Redis       OTP challenges, refresh tokens, rate limits, lockouts, sid deny-list
                                         ├── notify      SMS / WhatsApp / email delivery (with provider failover)
                                         ├── compliance  risk and jurisdiction checks at registration and login
                                         └── Kafka       identity.account (registered, status_changed, logged_out, …)
All services ──► GET /api/v1/auth/.well-known/jwks.json   (verify access tokens locally, cached 10 min)
```

- Stateless apart from PostgreSQL and Redis; horizontally scaled.
- Play Money and Real Money deployments have different issuers, audiences and keys: a Play token is rejected by Real Money services.
- Operators with their own identity (B2B single sign-on) authenticate players through the Operator API token exchange (section 7); Kilima still issues its own tokens for the game.

# 4. Flows

## 4.1 Registration (phone first)

1. `POST /auth/register/start` with `{ phone, tenant, locale, referralCode? }` → risk check (IP reputation, device, velocity, jurisdiction blocklist) → OTP challenge created and sent by SMS; WhatsApp is offered as an alternative channel where the player chooses it.
2. `POST /auth/register/verify` with `{ challengeId, code }` → returns a short-lived `registrationToken`.
3. `POST /auth/register/complete` with `{ registrationToken, screenName, password, dateOfBirth, acceptTermsVersion, marketingConsent }` → account `active`; the player is logged in (tokens returned, device registered).
4. Real Money: the player is `active` but `unverified`. Deposits up to the jurisdiction's pre-KYC limit (often zero) and any withdrawal require `compliance` KYC status `verified` (KP-LEG-04).

Anti-abuse: one account per phone per tenant; disposable and VoIP numbers rejected where detectable (number-intelligence lookup); maximum 3 registrations per device per 30 days; CAPTCHA on anomaly; referral codes are validated but never grant money without the promotions rules (KP-PRD-05).

## 4.2 Login

1. `POST /auth/login` with `{ phone | email | screenName, password, device }`.
2. The risk engine scores the attempt (known device, attestation, IP/ASN, geovelocity, failed attempts).
3. **Known device, low risk:** tokens are issued immediately.
4. **New device or elevated risk:** a step-up challenge is required (`{ challengeId, methods: ["otp_sms","otp_whatsapp","totp","passkey"] }`); after success the device is registered and trusted for 90 days.
5. Passkey login (`/auth/passkey/*`) replaces steps 1–4 on supported devices.

Anti-enumeration: unknown identifier and wrong password return the same `401 INVALID_CREDENTIALS` in the same time; account-state errors are returned only after the password is verified.

## 4.3 Step-up for sensitive actions

The following require a fresh verification (step-up) within the last 5 minutes, proved by an `amr` and `auth_time` claim in the access token or a one-time `stepUpToken`:

@widths 2.2,2.8
| Action | Step-up |
|---|---|
| Withdrawal request, adding a payout instrument | Always |
| Changing phone, email, password, 2FA methods | Always |
| Raising a responsible-gaming limit | Always (and the raise takes effect after the cooling period) |
| Login on a new device | Always |
| Staff: role changes, manual adjustments, releasing holds | Hardware key (WebAuthn) — staff accounts cannot use SMS |

## 4.4 Tokens and refresh

- Access token: RS256 JWT, 10-minute lifetime, claims below. Signed with a key in AWS KMS (the private key never leaves KMS).
- Refresh token: 32 random bytes, delivered in an `httpOnly; Secure; SameSite=Strict` cookie for the web and in the secure keystore (Android Keystore / iOS Keychain) for apps; stored only as SHA-256 in Redis; rotated on every use; reuse of an already rotated token revokes the whole family and emits `identity.session_revoked`.
- Refresh lifetime: 30 days sliding, 90 days absolute; Real Money sessions idle for 24 hours need step-up to refresh.

```
{ "iss": "https://id.kilima.poker", "aud": "kilima:real", "sub": "01J9...", "tid": "kilima",
  "sid": "s_7Hq...", "roles": ["player"], "mode": "real", "jur": "KE", "kyc": "verified",
  "dev": "d_91c...", "amr": ["pwd","otp"], "auth_time": 1790500000,
  "iat": 1790500000, "exp": 1790500600, "jti": "..." }
header: { "alg": "RS256", "kid": "2026-09-a" }
```

`jur` and `kyc` are hints for the UI and fast pre-checks only; money and seating decisions always re-check `compliance` (KP-ENG-01 D10).

## 4.5 Logout, revocation and bans

- `/auth/logout` revokes the current session; `/auth/logout-all` revokes every session.
- Revocation adds `sid` to a Redis deny-list for the remaining access-token lifetime; gateways subscribe to `identity.session_revoked` and disconnect the socket within 1 second.
- A ban or suspension (from integrity or compliance) revokes all sessions, closes open table seats through the table-server (the player is folded and stood up; the stack returns to the wallet unless a hold applies).

## 4.6 Recovery

- Forgot password: OTP to the verified phone, plus email link if verified; resets revoke all sessions and start a 24-hour withdrawal cool-down.
- Lost phone number: support-assisted recovery with KYC re-verification (liveness) for Real Money accounts; never by chat alone.

# 5. Roles and Permissions

Roles are coarse; permissions are fine-grained and checked by every service from the token plus a cached permission map.

@widths 1.3,3.7
| Role | Typical permissions |
|---|---|
| `player` | Play, cashier, own data |
| `club_owner` | Create and manage private club tables within limits set by game ops |
| `support` | Read accounts, reset limits (not raise), view hand histories of a ticket, restrict accounts |
| `risk_analyst` | Payments risk queue, withdrawal review, AML alerts |
| `integrity_analyst` | Integrity cases, full-hand replays with all hole cards, account links |
| `game_ops` | Tables, stakes, tournaments schedule, tournament director actions |
| `finance` | Ledger reports, reconciliation, manual postings (four-eyes) |
| `compliance_officer` | KYC decisions, SAR/STR workflow, jurisdiction policy changes (four-eyes) |
| `operator_admin` | Operator back-office limited to its own tenant |
| `admin` | User and role administration, configuration |
| `super_admin` | Break-glass only; time-limited, requires two approvals, every use alerts security |

Staff accounts authenticate through the company identity provider (SSO, OIDC) with phishing-resistant MFA (hardware keys), are restricted by IP allow-lists and device posture, and receive short-lived tokens (15 minutes, no refresh beyond 8 hours).

# 6. Data Model (summary)

Full schema in KP-ENG-05. Key tables in schema `identity`:

@widths 1.5,3.5
| Table | Content |
|---|---|
| `accounts` | id, tenant_id, screen_name, phone_e164, phone_verified_at, email, email_verified_at, password_hash, status, roles, date_of_birth, created_at, updated_at |
| `devices` | id, account_id, platform, model, os_version, app_version, attestation (verdict, at), fingerprint_hash, trusted_until, first_seen, last_seen, last_ip |
| `credentials` | account_id, type (`totp`, `passkey`), public data, created_at, last_used_at |
| `sessions` | sid, account_id, device_id, created_at, last_refresh_at, ip, risk_level, revoked_at |
| `status_history` | account_id, from, to, reason, actor, at |
| `security_events` | append-only: login success/failure, step-up, OTP sent/failed, lockout, password change, session revoked |

Redis keys: `otp:{challengeId}` (code hash, attempts, channel; TTL 5 min), `rt:{sid}` (refresh hash, family; TTL 30 d), `rtfam:{familyId}` (rotated hashes), `denysid:{sid}` (TTL 10 min), `lock:{accountId}`, `rl:*`.

# 7. Operator Token Exchange (B2B)

Operators that already authenticate their players do not send them through Kilima's password login:

1. The operator back-end calls `POST /operator/v1/sessions` with a signed request (mTLS + HMAC) containing the operator's player id, screen-name suggestion, KYC status and jurisdiction.
2. `identity` creates or links the Kilima account for that tenant and returns a one-time `launchToken` (60 s).
3. The operator opens the poker client with the launch token; the client exchanges it at `POST /auth/launch` for normal Kilima tokens.
4. The operator remains responsible for KYC where the contract says so; `compliance` still enforces jurisdiction and pool rules (KP-ENG-14).

# 8. Security Controls

@widths 1.8,1.8,1.4
| Control | Limit (Real Money defaults) | Key |
|---|---|---|
| OTP send | 3 per 10 min, 10 per day per phone; 20 per hour per IP | phone, IP |
| OTP verify | 5 attempts per challenge; code 6 digits, 5-minute expiry | challenge |
| Login | 10 per 15 min per IP; 5 failures per account then progressive delay | IP, account |
| Account lockout | 10 failed logins or step-ups in 1 h → locked 30 min + notification | account |
| Registration | 5 per hour per IP; 3 per device per 30 days | IP, device |
| SIM-swap signal | Where the mobile operator offers a SIM-swap check, a recent swap blocks withdrawals for 72 h and forces step-up | phone |

- SMS pumping protection: country allow-list for OTP, per-prefix budgets, provider fraud controls, conversion monitoring (alert when OTP verification rate drops below 60 %).
- OTP codes and tokens are never logged; phone numbers are masked in logs.
- JWT verification pins `algorithms: ["RS256"]`, `iss`, `aud`; tokens issued before `password_changed_at` or before a ban are rejected.
- Key rotation: new `kid` published in JWKS 24 h before use; old key kept 24 h after last use.

# 9. API Contract (summary)

Base URL `/api/v1/auth`. Full definitions in KP-ENG-03 and `specs/openapi.yaml`.

@widths 0.6,2.2,0.8,2.4
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register/start` | — | Start registration; sends OTP |
| POST | `/auth/register/verify` | — | Verify OTP → registration token |
| POST | `/auth/register/complete` | reg. token | Create account; returns tokens |
| POST | `/auth/login` | — | Password login → tokens or step-up challenge |
| POST | `/auth/otp/send` | challenge | Send or resend an OTP for a challenge (channel choice) |
| POST | `/auth/otp/verify` | challenge | Complete a login or step-up challenge |
| POST | `/auth/passkey/options` | — / user | WebAuthn registration or login options |
| POST | `/auth/passkey/verify` | — / user | Verify WebAuthn response |
| POST | `/auth/totp/enroll` | user + step-up | Start TOTP enrolment |
| POST | `/auth/totp/confirm` | user | Confirm TOTP with a code |
| POST | `/auth/step-up` | user | Start a step-up challenge for a sensitive action |
| POST | `/auth/refresh` | refresh | Rotate refresh token; new access token |
| POST | `/auth/logout` | user | Revoke current session |
| POST | `/auth/logout-all` | user | Revoke all sessions |
| GET | `/auth/sessions` | user | Active sessions and devices |
| DELETE | `/auth/sessions/{sid}` | user | Revoke one session |
| GET | `/auth/me` | user | Identity, roles, status, verification flags |
| POST | `/auth/password/forgot` | — | Always 202 |
| POST | `/auth/password/reset` | challenge | Reset with OTP proof |
| POST | `/auth/password/change` | user + step-up | Change password |
| POST | `/auth/launch` | launch token | B2B launch-token exchange |
| GET | `/auth/.well-known/jwks.json` | — | Public signing keys |

# 10. Errors

@widths 0.5,2,2.5
| HTTP | Code | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Schema failure; `details` lists fields |
| 400 | `INVALID_OTP` | Wrong code; `details.attemptsLeft` |
| 401 | `INVALID_CREDENTIALS` | Unknown identifier or wrong password |
| 401 | `UNAUTHORIZED` / `TOKEN_EXPIRED` | Missing, invalid, expired or revoked token |
| 401 | `REFRESH_REUSED` | Rotated refresh token presented again (family revoked) |
| 403 | `STEP_UP_REQUIRED` | Sensitive action without fresh verification; `details.challengeId` |
| 403 | `ACCOUNT_SUSPENDED` / `ACCOUNT_BANNED` / `SELF_EXCLUDED` | Status blocks the action |
| 403 | `JURISDICTION_BLOCKED` | Registration or login from a blocked jurisdiction |
| 409 | `PHONE_TAKEN` / `SCREEN_NAME_TAKEN` | Uniqueness |
| 410 | `CHALLENGE_EXPIRED` | OTP challenge expired or exhausted |
| 423 | `ACCOUNT_LOCKED` | Lockout; `details.retryAfter` |
| 429 | `RATE_LIMITED` | With `Retry-After` |

# 11. Observability

- Metrics: registrations started/completed (funnel), OTP sent/delivered/verified per channel and country, login success/failure, step-up rate, lockouts, refresh-reuse detections, passkey adoption, SMS cost per verified user.
- Alerts: OTP delivery rate < 90 % per country for 10 min (provider failover), verification rate < 60 % (SMS pumping), login failure spike (credential stuffing), refresh-reuse spike, JWKS endpoint errors.
- Security events stream to the SIEM (KP-SEC-03).

# 12. Testing

- Unit and integration tests for every flow above, including concurrency (two registrations racing for one screen name or phone).
- Token tests: `alg: none` and HS256 rejected; wrong `aud` (Play token on Real Money) rejected; rotation with overlapping keys.
- Refresh reuse detection revokes the family; deny-list effective within one access-token lifetime; socket disconnect within 1 s of revocation (end-to-end test).
- OTP brute force blocked; enumeration timing test (response-time difference < 20 ms at p95).
- Coverage ≥ 90 % lines for this service (security-critical, KP-ENG-10).

# 13. Configuration (excerpt)

```
APP_MODE=real                         # play | real
TENANCY_DEFAULT=kilima
JWT_ISSUER=https://id.kilima.poker
JWT_AUDIENCE=kilima:real
JWT_KMS_KEY_ID=arn:aws:kms:af-south-1:...:key/...
JWT_ACCESS_TTL=10m
REFRESH_TTL=30d  REFRESH_ABSOLUTE_TTL=90d  REFRESH_ROTATION_GRACE=10s
OTP_TTL=5m  OTP_MAX_ATTEMPTS=5  OTP_CHANNELS=sms,whatsapp
OTP_COUNTRY_ALLOWLIST=KE,NG,GH,UG,TZ,AO,...   # from the Jurisdiction Policy Engine
ARGON2_MEMORY_KIB=65536  ARGON2_ITERATIONS=3
STEPUP_MAX_AGE=5m
DEVICE_TRUST_DAYS=90
```

Secrets come from AWS Secrets Manager; nothing secret is committed or placed in container images.
