---
id: KP-OPS-01
title: Environments and CI/CD
subtitle: Environments, infrastructure as code, pipelines, GitOps deployment, configuration and migrations
version: 1.0
owner: SRE Lead
status: Draft
related: KP-ENG-11 Engineering Standards · KP-QA-03 Release Process · KP-SEC-03 §7 Supply Chain · ADR-0012
---

# 1. Environments

@widths 1.3,1.2,2.5
| Environment | Account / cluster | Purpose |
|---|---|---|
| `dev` | dev account, shared EKS | Developer namespaces and per-PR preview environments (auto-deleted after merge) |
| `staging-play` | staging account | Integration, E2E, performance baselines for Play Money |
| `staging-real` | staging account | Real Money features with provider sandboxes and KYC stubs |
| `cert` | cert account | Frozen certified versions for test labs; change-controlled |
| `operator-sandbox` | staging account | B2B operator integrations |
| `perf` | perf account (on demand) | Full-scale load and chaos |
| `play` | prod-play account, `af-south-1` | Play Money production |
| `real` | prod-real account, `af-south-1` + EU standby | Real Money production |

Each production environment has its own AWS account, VPC, KMS keys, data stores and secrets (ADR-0009).

## Domains

`kilima.poker` (brand), `api.kilima.poker`, `play.kilima.poker` (sockets), `id.kilima.poker` (identity), `admin.kilima.poker` (staff, IP-restricted), and the `play.` sub-domains for Play Money; operator skins map their own domains to the edge.

# 2. Infrastructure as Code

- Terraform (separate `kilima-infra` repository) for AWS accounts, networking, EKS, data stores, KMS, IAM, CDN/WAF; state in encrypted S3 with locking; changes by pull request with `terraform plan` output reviewed by two engineers.
- Kubernetes manifests as Helm charts in the monorepo `infra/helm`; environments as Argo CD applications in `infra/argocd`.
- Policy as code: Checkov/tfsec on Terraform; Kyverno policies in clusters.

# 3. CI Pipeline (GitHub Actions)

@widths 0.5,1.6,2.9
| # | Stage | Details |
|---|---|---|
| 1 | Install | pnpm with frozen lockfile; Turborepo remote cache; only affected packages built |
| 2 | Static checks | ESLint (incl. custom money/RNG rules), Prettier, TypeScript, spec lint, `check_api_consistency.py`, Avro compatibility |
| 3 | Unit + vectors | Vitest; `engine-vectors`; property tests (reduced run on PRs, full nightly) |
| 4 | Integration | Testcontainers (PostgreSQL, Redis, Kafka) per affected service |
| 5 | Security | Semgrep, Gitleaks, SCA, Checkov |
| 6 | Build | Docker images (distroless), SBOM, SLSA provenance, cosign signature, push to ECR |
| 7 | Image scan | Trivy/Grype; critical/high block |
| 8 | Deploy preview | PR namespace in `dev` with seeded data; E2E smoke with bots |
| 9 | Main branch | Deploy to staging via Argo CD (image tag bump PR by bot); full E2E and performance smoke |
| 10 | Release | Tag → promotion PRs for `play` then `real` (approval required); canary with automated analysis (Argo Rollouts) |

Mobile: separate workflow (Gradle/EAS) producing signed AABs/APKs, uploaded to internal testing tracks; staged rollout controlled by release management.

# 4. Deployment

- **GitOps:** Argo CD syncs the desired state from Git; no manual `kubectl apply` in production.
- **Progressive delivery:** Argo Rollouts canaries with metric analysis (error rate, p99 latency, voided hands, deposit success); automatic rollback.
- **Graceful drain:** table-server pods receive a drain signal, stop starting new hands, finish current hands, hand over table leases; gateway pods close sockets gradually so clients reconnect elsewhere.
- **Certified components:** the promotion job checks image digests against the certification register for `cert` and `real` (KP-ENG-13 §7).

# 5. Configuration

- Static configuration per environment in Helm values (non-secret); secrets from AWS Secrets Manager through the External Secrets Operator.
- Business configuration (pools, table templates, rake schedules, jurisdictions, tournaments, promotions, paytables) lives in databases, changed through the back-office with audit and four-eyes; exported daily to Git for review history.
- Feature flags through OpenFeature with per-jurisdiction and per-tenant targeting.

# 6. Database Migrations

- Forward-only migrations run as a pre-deploy job; expand–migrate–contract for breaking schema changes.
- Ledger migrations need two approvals (KP-ENG-11 §5), a staging run on a production-sized snapshot, and a rollback/forward-fix plan.
- Long-running data migrations run as background jobs with progress metrics, never in the deploy path.

# 7. Versioning

SemVer per deployable, generated from Conventional Commits; protocol version negotiated with clients (KP-ENG-04 §1); API version in the path (`/api/v1`).
