---
id: KP-ENG-11
title: Engineering Standards
subtitle: Repository, code, contracts, Git workflow, reviews, dependencies and certified components
version: 1.0
owner: CTO / Chief Architect
status: In review
related: KP-QA-02 Definition of Done · KP-OPS-01 Environments and CI/CD · KP-ENG-13 §7 Certified Scope
---

# 1. Repository

One monorepo for all services, clients and shared packages; separate repositories only for infrastructure state (Terraform) and for this dossier until it moves into `docs/`.

```
kilima-poker/
  apps/          mobile/  web/  admin/  operator-backoffice/
  services/      gateway/  table-server/  lobby/  tournament/  rng/  identity/  player/
                 wallet/  cashier/  compliance/  integrity/  operator-gateway/  backoffice/  notify/
  packages/      engine-poker/  engine-api/  client-core/  table-renderer/  contracts/  money/
                 ledger-postings/  policy/  shared/ (logger, config, errors, auth, telemetry)
  data/          airflow/  dbt/  ml/  clickhouse-migrations/
  infra/         helm/  argocd/  k8s-policies/  (Terraform in kilima-infra repo)
  docs/          this dossier
  .github/       workflows, CODEOWNERS, templates
```

Tooling: pnpm workspaces + Turborepo; Node.js 24 LTS; TypeScript 5.x everywhere (services, clients, engine); Python 3.12 for data and ML; Terraform 1.x.

# 2. Code Standards

- **TypeScript** `strict: true`; no `any` without a justification comment; ESLint (typescript-eslint, security plugin, custom rules below) and Prettier enforced in pre-commit and CI.
- **Validation:** every external input (HTTP, socket, webhook, Kafka message) is validated against schemas generated from the contracts; unknown fields rejected.
- **Errors:** shared `AppError(code, status, message, details)`; stack traces never reach clients.
- **Config:** typed config module, read once at start-up, fail fast on missing values; no `process.env` in business code.
- **Logging:** shared pino logger; structured fields; redaction list (tokens, OTPs, passwords, phone numbers, instrument details, hole cards of live hands).
- **Time:** UTC; the engine receives time as an input (no `Date.now()` in `engine-*`).

## 2.1 Custom lint rules (CI-blocking)

@widths 1.8,3.2
| Rule | Why |
|---|---|
| `no-float-money` | Money must use the `Money` type (`bigint` + currency); arithmetic on money with `number` fails the build |
| `no-math-random` | `Math.random` is forbidden in services and engines; randomness only through the `rng` service or `crypto` for non-game ids |
| `no-io-in-engine` | `packages/engine-*` may not import I/O, timers, `crypto`, or network modules |
| `no-raw-ledger-entries` | Only `packages/ledger-postings` may build ledger entries |
| `no-hole-cards-in-logs` | Logging calls may not include fields named `hole`, `cards`, `deck` outside the hand-record writer |
| `no-direct-db-cross-schema` | A service may only query its own schema (checked against the ownership map) |

# 3. Contract-First

1. Change `packages/contracts/openapi.yaml`, `asyncapi.yaml` or the Avro event schemas first.
2. CI lints the specs, generates types, validators, clients and mock servers, and blocks breaking changes (oasdiff for REST, a custom differ for AsyncAPI and Avro compatibility in the schema registry). A breaking change needs a new version or an ADR.
3. The dossier's API documents (KP-ENG-03, KP-ENG-04) and the specs are checked for consistency (`tools/check_api_consistency.py`).

# 4. Git Workflow

- Trunk-based development; short-lived branches (`feat/KP-123-…`, `fix/…`); `main` always deployable.
- Conventional Commits; release notes and versions generated automatically (release-please); SemVer per deployable.
- Pull requests: small (target < 400 changed lines), linked to a ticket, PR template, squash-merge, signed commits, required checks, linear history.
- Feature flags (OpenFeature with a server-side provider) for unfinished features and for per-jurisdiction rollouts.

# 5. Code Review

@widths 2,3
| Area | Required approvals |
|---|---|
| Default | 1 approving review from a code owner |
| `engine-poker`, `rng`, `wallet`, `ledger-postings`, `cashier`, `identity`, `tournament` payouts | 2 approvals, one from the component's tech lead; security review for auth and payments |
| Certified components (KP-ENG-13 §7) | Above + certification impact assessment recorded in the PR |
| Infrastructure permissions, network policies, IAM | 2 approvals including platform/security |
| Database migrations on `ledger` | 2 approvals + DBA/finance-systems owner |

Reviewers check correctness, tests, security (inputs, auth, secrets, injection), contract changes, observability, performance and the Definition of Done (KP-QA-02). Review response target: same working day.

# 6. Dependencies and Supply Chain

- New runtime dependencies need a justification (maintenance, licence, size, alternatives).
- Allowed licences: MIT, Apache-2.0, BSD, ISC, MPL-2.0; GPL/AGPL in shipped code requires legal review.
- Renovate weekly; security updates immediately. `pnpm audit`, Trivy/Grype (containers), Semgrep (SAST), Gitleaks (secrets), Checkov (IaC) run on every PR; critical/high findings block merges.
- Container images: minimal distroless bases, non-root, read-only root filesystem, SBOM generated (CycloneDX), images signed (Sigstore cosign) and verified at admission (Kyverno).
- Lockfiles committed; CI installs with `--frozen-lockfile`; build provenance (SLSA level 3 target).

# 7. Testing Standards (summary)

Full strategy in KP-QA-01. Every change includes unit tests; services include integration tests against real PostgreSQL/Redis/Kafka in containers (Testcontainers); engine changes include vectors and property tests; protocol changes include contract tests; UI changes include component tests and, for flows, E2E tests.

# 8. Documentation

- This dossier lives in `docs/` and changes by pull request (KP-GOV-01).
- Significant decisions are ADRs (`docs/03-engineering/adr/`).
- Every service has a README (purpose, local run, configuration, dashboards, runbook links); public functions in `packages/` have TSDoc.

# 9. Team Structure (engineering)

@widths 1.6,3.4
| Team | Scope |
|---|---|
| Game | engine-poker, table-server, lobby, tournament, rng |
| Platform | gateway, identity, player, notify, shared packages, developer experience |
| Payments | wallet, cashier, ledger postings, reconciliation tooling |
| Trust | compliance, integrity services, back-office risk tools (with the integrity and compliance functions) |
| Clients | mobile, web, table renderer, white-label |
| Data | data platform, reports, ML |
| SRE / Security | infrastructure, CI/CD, observability, security engineering |

Headcount and hiring plan: KP-PRJ-02.
