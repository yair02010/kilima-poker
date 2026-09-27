# Kilima Poker — instructions for Claude

You are building Kilima Poker, a mobile-first poker platform for African markets. The full design is in docs/ (the dossier). This file is the fixed architecture contract: follow it in every session. It changes only through an ADR that the product owner approves.

## Where things are
- docs/ — the dossier. The index is docs/00-governance/00-dossier-index.md. Engineering decisions: docs/03-engineering/ and docs/03-engineering/adr/. If two documents disagree, KP-ENG-01 and the ADRs win.
- docs/09-handbook/23-build-with-claude.md and docs/09-handbook/data/beta-path.yaml — the ordered plan to Beta: every work package (WP), its slices, reading list and done criteria.
- docs/delivery/progress-log.md — what has been done, newest first. Read the top entries at the start of every session.
- docs/delivery/decisions.md — small decisions taken in sessions that are not ADRs.

## Fixed architecture (do not change without an approved ADR)
- Monorepo: pnpm workspaces + Turborepo; Node.js 24 LTS; TypeScript strict everywhere; Python 3.12 only for data/ML and the reference implementation.
- Layout: apps/ (mobile, web, admin), services/ (gateway, table-server, lobby, tournament, rng, identity, player, wallet, cashier, compliance, integrity, backoffice, notify, operator-gateway), packages/ (engine-poker, engine-api, client-core, table-renderer, contracts, money, ledger-postings, policy, shared), data/, infra/, tools/ (simbots), docs/.
- Every service follows KP-HBK-07: src/main.ts, config.ts, http/, realtime/, domain/, repo/, events/, clients/; migrations/; test/unit, test/int, test/contract. Dependency direction http/realtime/events → domain → repo/clients. The domain never imports Fastify, Kafka or pg.
- HTTP: Fastify. Validation: zod schemas generated from packages/contracts. SQL: Kysely or typed pg queries; node-pg-migrate. Logs: pino via packages/shared. Tests: Vitest and fast-check; simbots for load.
- Data stores: PostgreSQL (core and ledger clusters), Redis, Kafka (redpanda locally), ClickHouse. Each service owns its schema and never queries another's.
- Real-time: clients speak only the socket protocol of KP-ENG-04 through the gateway; REST is read-only for game data (ADR-0007).
- Clients: React Native (Android first) and web sharing packages/client-core (ADR-0013).

## Non-negotiables
1. Money is bigint minor units with a currency (packages/money). Never number or float.
2. Ledger entries are built only in packages/ledger-postings through the posting function; every posting sums to zero; one hand_settlement posting per hand (ADR-0005, ADR-0006).
3. Engine packages are pure: no I/O, no timers, no Date.now, no Math.random. Time and randomness are inputs.
4. Game randomness comes only from the rng service (HMAC_DRBG, Fisher–Yates with rejection sampling, deck commitments) (ADR-0010).
5. A player never receives another player's hole cards; hole cards never appear in logs.
6. Contract first: change openapi.yaml / asyncapi.yaml in packages/contracts before code; no breaking change without a new version.
7. Every change has tests. Engine and wallet changes keep all vectors in docs/03-engineering/reference/test_vectors.json green.
8. No secrets in code, chat or logs. Configuration through the typed config module only.

## Session contract
- One session = one slice of one WP = one branch = one pull request. Branch name: wp-NN/<slice-number>-<short-name>.
- Start: read this file, the top of the progress log, and the WP entry in beta-path.yaml with its reading list. Check that the WP's dependencies are merged; if not, stop and say so.
- Plan: before writing code, show a short plan (files to add or change, tests, risks, open questions) and wait for the product owner's OK.
- Build: small commits; run pnpm lint, pnpm typecheck and the relevant tests before finishing. Fix failures; never skip or delete a failing test to get green.
- Finish: open the PR (gh pr create) and write the session report (template in KP-HBK-23 Appendix B); append it to the top of docs/delivery/progress-log.md in the same PR.

## Stop and ask before
- Changing anything in "Fixed architecture" or "Non-negotiables", or adding a new top-level dependency or service.
- Changing money, RNG, engine rules or security behaviour beyond what the slice says.
- Anything that costs money or touches cloud accounts (terraform apply, paid services), or deletes data.
- Merging to main — the product owner merges.

## Style of reporting
- Short and concrete: what was built, what was tested (with numbers), what is left, what you need from the product owner.
- The product owner reads Hebrew best: write the session report's "Summary for the product owner" section in Hebrew; everything in code, commits and docs stays in English.
