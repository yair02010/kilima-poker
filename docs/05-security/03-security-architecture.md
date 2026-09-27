---
id: KP-SEC-03
title: Security Architecture and Controls
subtitle: Network, identity, workload, data, supply-chain and detection controls
version: 1.0
owner: Head of Security (CISO)
status: Draft
related: KP-ENG-01 Architecture · KP-SEC-01 Threat Model · KP-SEC-02 Security Policy · KP-OPS-01 CI/CD
---

# 1. Principles

- **Zero trust:** no implicit trust based on network location; every request is authenticated and authorised.
- **Defence in depth:** edge, network, workload, application and data controls each assume the others may fail.
- **Least privilege and separation:** money (wallet, cashier), randomness (rng) and identity have dedicated identities, databases, node pools and policies.
- **Immutable and verifiable:** infrastructure as code, signed images, append-only money and audit data.

# 2. Edge

@widths 1.4,3.6
| Control | Implementation |
|---|---|
| CDN and WAF | Managed CDN with African points of presence; WAF (OWASP core rules + custom rules for the API); bot management on REST; TLS 1.3 |
| DDoS | Always-on volumetric protection at the CDN; AWS Shield Advanced for origin endpoints; rate limits at edge and ingress |
| WebSocket protection | Connection rate limits per IP/ASN, handshake token check at the gateway, message size and rate limits |
| Origin protection | Origins accept traffic only from the CDN (mTLS / allow-listed ranges); no direct public access to the cluster |
| Geo controls | Country-level blocking at the edge for blocked jurisdictions (first line; the Jurisdiction Policy Engine is authoritative) |

# 3. Network and Cluster

- Separate AWS accounts per environment (organisation with service control policies); production accounts have no human IAM users.
- VPC per environment with private subnets for workloads and data; egress through NAT with domain allow-lists for third-party APIs.
- Service mesh (Istio or Linkerd) with mTLS between all pods; Kubernetes NetworkPolicies default-deny; only declared service-to-service paths allowed.
- Dedicated node pools with taints for `rng`, `wallet`/`cashier` and `identity`; no other workloads scheduled there.
- PodSecurity "restricted", non-root, read-only root filesystem, no privilege escalation, seccomp default; Kyverno policies enforce them and verify image signatures.
- Runtime detection (Falco or cloud-native equivalent) for shells in containers, unexpected network connections and file changes.

# 4. Identity and Access

@widths 1.4,3.6
| Subject | Mechanism |
|---|---|
| Players | RS256 JWT (KMS-signed), refresh rotation, device binding, step-up (KP-ENG-02) |
| Staff | Company IdP SSO (OIDC), FIDO2 keys, device posture, IP allow-lists, short sessions, JIT elevation |
| Services | Mesh identities (SPIFFE IDs) + short-lived service tokens with scopes; IAM roles for service accounts (IRSA) for AWS APIs |
| Operators (B2B) | mTLS client certificates + HMAC-signed requests with timestamps and nonces (replay protection) |
| Providers (callbacks) | Signature verification / mTLS / IP allow-lists + status re-query (KP-FIN-02 §2) |
| CI/CD | GitHub OIDC federation to AWS (no long-lived keys); environment protection rules; signed commits |

# 5. Data Protection

- Encryption at rest with KMS keys per data domain (core, ledger, analytics, archives); key policies restrict decrypt to the owning service roles.
- Field-level encryption and blind indexes for phone, email, date of birth, KYC name, payout details (KP-ENG-05 §9).
- Ledger database: insert-only roles, posting function with `SECURITY DEFINER`, no superuser use by applications, audit of DDL.
- Archives in S3 Object Lock (compliance mode) for hands, RNG audit, ledger exports and audit logs.
- Backups encrypted and copied to a separate account (protection against account compromise and ransomware).
- Data-loss prevention: exports from back-office are watermarked, logged, size-limited and require approval above thresholds.

# 6. Application Security Controls

- Input validation from contract schemas; output encoding in web clients; CSP, HSTS, secure cookies.
- Authorisation checks in every handler through a shared policy library (tested with permission matrices).
- Idempotency and replay protection on all money endpoints and socket actions.
- Anti-automation on registration, login and OTP endpoints (KP-ENG-02 §8).
- Server-side request forgery protection for any outbound calls configured by staff (allow-lists).
- Mobile: certificate pinning, attestation, obfuscation, tamper detection (KP-ENG-15 §4).

# 7. Supply Chain

@widths 1.4,3.6
| Stage | Control |
|---|---|
| Source | Protected `main`, required reviews (two for critical components), signed commits, CODEOWNERS |
| Dependencies | Lockfiles, Renovate, SCA blocking critical/high, licence checks, private registry proxy |
| Build | Ephemeral GitHub-hosted or hardened self-hosted runners; SLSA provenance; SBOM per image |
| Artifacts | Images signed with cosign; stored in ECR with immutable tags; vulnerability scan on push and daily |
| Deploy | Argo CD pulls only signed images listed in Git; admission verification; certified-component digests checked (KP-ENG-13 §7) |

# 8. Detection and Response

- SIEM with correlation rules (KP-SEC-02 §8); cloud-native threat detection (GuardDuty, Security Hub) with findings routed to on-call.
- Honeytokens: fake credentials and fake high-value records that alert when used.
- Game-specific detections: hole-card field in a room event (gateway filter), ledger imbalance, RNG health failure, sudden changes of rake or jurisdiction configuration, mass payout approvals.
- Playbooks for account takeover waves, credential stuffing, DDoS, provider compromise, insider access anomalies (KP-OPS-03, KP-OPS-04).

# 9. Security Testing Programme

- Continuous: SAST, SCA, secrets, IaC, container, DAST (staging), mobile scans.
- Before Real Money launch: external pentest (web, API, socket protocol, mobile, cloud), cryptographic review of the RNG and token handling, configuration review of the ledger database.
- Yearly: pentest, red team from GA, disaster-recovery and incident simulations, ISO 27001 internal audit.
