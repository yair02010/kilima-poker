# Kilima Poker

Mobile-first online poker platform for African markets: Play Money and licensed Real Money play, a B2C brand and a B2B operator network.

## Start here

- **[CLAUDE.md](CLAUDE.md)** — the fixed architecture contract. Changes only through an approved ADR.
- **[docs/](docs/README.md)** — the project dossier. Index: [docs/00-governance/00-dossier-index.md](docs/00-governance/00-dossier-index.md). If two documents disagree, KP-ENG-01 and the ADRs win.
- **[Path to Beta](docs/09-handbook/23-build-with-claude.md)** — the ordered plan; single source of truth is [docs/09-handbook/data/beta-path.yaml](docs/09-handbook/data/beta-path.yaml).
- **[Progress log](docs/delivery/progress-log.md)** — what has been done, newest first.
- **[Decisions](docs/delivery/decisions.md)** — small session decisions that are not ADRs.

## Status

Stage S1 (engine first). WP-01 is in place: workspace, `packages/shared`, the reference service `services/sample`, the Kilima lint rules (`packages/eslint-plugin-kilima`) and CI (`.github/workflows/ci.yml`).

```
corepack enable          # pnpm 9
pnpm install
pnpm lint && pnpm typecheck && pnpm test
pnpm build               # production bundles (dist/main.mjs per service)
pnpm dev                 # starts services/sample on http://localhost:3999 (/healthz, /readyz, /version; /metrics on :9464)
```

## Toolchain

Versions are pinned in [.tool-versions](.tool-versions): Node.js 24 LTS, pnpm 9, Python 3.12. See [KP-HBK-02 Development Environment](docs/09-handbook/02-development-environment.md).

## How work happens

One session = one slice of one work package = one branch = one pull request. Branch names: `wp-NN/<slice>-<short-name>`. The product owner approves every plan and merges every PR. See KP-HBK-23 §2–§5.

Private and confidential.
