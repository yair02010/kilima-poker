# Session Decisions

Small decisions taken during build sessions that do not need an ADR (KP-HBK-23 §5.2). Newest first. Anything that changes the fixed architecture in CLAUDE.md needs an ADR instead (KP-HBK-04).

| Date | WP / slice | Decision | Why | Revisit when |
|---|---|---|---|---|
| 2026-09-27 | WP-01/2 | The lint plugin is written in TypeScript with erasable syntax only and loaded by ESLint through Node 24's built-in type stripping (no build step). | Keeps "TypeScript everywhere" without a compile step for tooling. | If Node type stripping changes |
| 2026-09-27 | WP-01/2 | Rules are syntactic and name-based (no type-aware linting). `no-float-money` recognises money by identifier words (amount, balance, stake, rake, pot, bet, fee, buyIn, prize, …). | Fast on every file; `number`-typed money is caught where it is declared. Type-aware checks can be added once packages/money exists. | WP for packages/money |
| 2026-09-27 | WP-01/2 | Added dev dependencies `@typescript-eslint/utils`, `@typescript-eslint/rule-tester`, `@typescript-eslint/parser` (same family and version as typescript-eslint). | Standard way to write and test typed ESLint rules. | — |
| 2026-09-27 | WP-01/2 | `no-math-random` is off for `tools/simbots`; `no-io-in-engine` is off for engine tests. | Bots never deal real cards (KP-QA-04); tests may use Node test helpers. | — |
| 2026-09-27 | WP-01/1 | TypeScript pinned to 5.9 (`~5.9.3`), not 7.x. | KP-ENG-11 says TypeScript 5.x, and typescript-eslint supports `<6.1`. | typescript-eslint supports TS 7 |
| 2026-09-27 | WP-01/1 | Internal packages export their TypeScript source (`exports` → `src/*.ts`); services run with `tsx`. No build step yet. | Fastest feedback loop, no stale `dist/`. The production build (bundle + container image) is designed in WP-01 slice 3. | WP-01 slice 3 |
| 2026-09-27 | WP-01/1 | Added `prom-client` (approved by the product owner) for `/metrics`; metrics served on a separate internal port (`METRICS_PORT`). | KP-HBK-07 §3: "/metrics — Prometheus, internal port only". | — |
| 2026-09-27 | WP-01/1 | Root ESLint uses `typescript-eslint` strict-type-checked + `eslint-plugin-security`; `process.env` is forbidden outside `config.ts` files; `console` is forbidden. | KP-ENG-11 §2 (typed config only, structured logs). | WP-01 slice 2 adds the six Kilima rules |
| 2026-09-27 | WP-01/1 | Logger redacts `code` only under `body` (OTP submissions), not everywhere. | Error objects carry a `code` that must stay visible in logs. | Identity service (OTP) is built |
| 2026-09-27 | WP-01/1 | WP-01 branch is stacked on `setup-2/1-import-dossier`, because the SETUP-2 PR was not merged yet. | Avoid waiting; the PR diff becomes clean once SETUP-2 is merged. | SETUP-2 merged |
| 2026-09-27 | SETUP-2/1 | The dossier's own `.github/` (CODEOWNERS, PR and issue templates) stays inside `docs/.github/` unchanged; the repository-level `.github/` is created in WP-01 with CI. | CODEOWNERS paths are relative to the dossier root, and the slice forbids changing document content. GitHub ignores `.github/` below the root. | WP-01 slice 3 (CI pipeline) |
| 2026-09-27 | SETUP-2/1 | Imported only git-tracked dossier files; generated `dist/` (PDFs) and `site/` are not committed and are ignored. | They are build output of `docs/tools/build.py` and `build_site.py`. | — |
| 2026-09-27 | SETUP-2/1 | Repository created locally first (`git init`, branch `main`); GitHub remote is added when SETUP-1 is complete. | No GitHub organisation yet. | SETUP-1 done |
| 2026-09-27 | SETUP-2/1 | Added `.gitattributes` forcing LF line endings. | Product owner works on Windows; avoids CRLF churn in diffs and scripts. | — |
