---
id: KP-HBK-02
title: Development Environment
subtitle: Tools, bootstrapping the monorepo, running the platform locally and playing against bots
version: 1.0
owner: Tech Lead — Platform
status: Approved
related: KP-ENG-11 Engineering Standards · KP-HBK-07 Service Blueprint · KP-OPS-01 Environments
---

# 1. Required Tools

@widths 1.6,1.2,2.2
| Tool | Version | Notes |
|---|---|---|
| Node.js | 24 LTS (via `mise` or `nvm`) | Version pinned in `.tool-versions` |
| pnpm | 9.x | `corepack enable` |
| Docker Desktop / OrbStack / Colima | Current | Runs local data stores |
| Python | 3.12 | Reference implementation, data jobs |
| Java 17 + Android SDK | For mobile work only | Android Studio, an emulator image API 26 and API 34 |
| Terraform | 1.x | SRE only |
| kubectl, helm, argocd CLI | Current | SRE and debugging staging |
| GitHub CLI (`gh`) | Current | PRs from the terminal |

# 2. Bootstrap

```
git clone git@github.com:kilima/kilima-poker.git && cd kilima-poker
mise install            # Node, pnpm, Python versions from .tool-versions
pnpm install            # workspace dependencies
pnpm dev:infra          # docker compose: postgres (core + ledger), redis, kafka (redpanda), clickhouse, mailpit, localstack (KMS/S3)
pnpm db:migrate         # all service migrations
pnpm db:seed            # pools, table templates, test accounts, Play Money balances
pnpm dev                # all services in watch mode (Turborepo), web app on http://localhost:5173
```

Test accounts after seeding: `player1` … `player20` (password `Kilima-dev-1`), staff accounts `support@dev`, `gameops@dev`, `finance@dev` (SSO mocked locally). OTP codes are printed in the service log and visible in Mailpit/SMS mock at `http://localhost:8025`.

# 3. Local Topology

```
web (5173) ─┐                 identity (3001)   player (3002)   lobby (3003)   tournament (3004)
mobile ─────┼─► gateway (3000, /play) ─► table-server (3010)   rng (3011, dev DRBG seeded from OS)
            └─► api (3100, REST ingress) ─► wallet (3020)  cashier (3021, provider mocks)  compliance (3030)
                                           integrity (3040)  backoffice (3050)  notify (3060)
Data: postgres-core 5432, postgres-ledger 5433, redis 6379, kafka 9092, clickhouse 8123
```

Run only what you need: `pnpm dev --filter=table-server --filter=gateway --filter=wallet...` (Turborepo filters include dependencies).

# 4. Playing Against Bots Locally

```
pnpm simbots --table nlhe-6max-5-10 --bots 5 --strategy tight   # five bots at a Play Money table
pnpm dev:web                                                      # log in as player1, open the same table
```

Useful flags: `--strategy random|tight|loose|allin|timeout`, `--disconnect-rate 0.05`, `--hands 1000 --headless` (runs without you, asserts chip conservation at the end).

# 5. Everyday Commands

@widths 2.2,2.8
| Command | Does |
|---|---|
| `pnpm test` | Unit tests for changed packages |
| `pnpm test:int --filter=wallet` | Integration tests with Testcontainers |
| `pnpm vectors` | Runs `engine-poker` against `test_vectors.json` |
| `pnpm lint` / `pnpm typecheck` | Static checks (same as CI) |
| `pnpm contracts:gen` | Regenerates types and validators from OpenAPI/AsyncAPI |
| `pnpm db:new <service> <name>` | New migration file |
| `pnpm reset` | Drops local data and re-seeds |
| `pnpm docs:build` | Builds dossier PDFs and this site |

# 6. Mobile Development

- `pnpm dev:mobile` starts Metro; `pnpm android` installs on the emulator or a USB device.
- Point the app at your laptop with the dev menu (`API base URL`); for physical devices use your LAN IP.
- Use the network link conditioner profile "3G Africa" (in `apps/mobile/tools/netem.json`) when working on reconnection or payloads.

# 7. Preview Environments

Every pull request gets a namespace in `dev` (`pr-1234.dev.kilima.internal`) with seeded data and bots. The PR bot comments the URL. Previews are deleted when the PR closes.

# 8. Troubleshooting

@widths 2,3
| Symptom | Fix |
|---|---|
| `ECONNREFUSED 5433` | Ledger database not up: `pnpm dev:infra` and wait for health checks |
| Table never deals | `rng` not running or wallet unreachable (tables pause without wallet); check `pnpm dev` output |
| OTP never arrives | Look at the identity log or Mailpit; the SMS provider is mocked locally |
| Type errors after pulling | `pnpm contracts:gen && pnpm install` |
| Kafka consumer lag locally | `pnpm dev:infra --reset kafka` |
