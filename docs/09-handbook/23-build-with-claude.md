---
id: KP-HBK-23
title: Building with Claude — Path to Beta
subtitle: How the product owner and Claude build Kilima Poker together, session by session, from an empty repository to the Play Money Beta (G1)
version: 1.0
owner: Product Owner / CTO
status: Living document — generated from 09-handbook/data/beta-path.yaml
related: KP-HBK-06 Build Plan · KP-HBK-05 Planning · KP-OPS-06 Gates · KP-ENG-11 Standards · KP-QA-02 Definition of Done
---

# 1. What This Is

KP-HBK-06 lists **what** has to be built. This document says **in which order, who does each step, and exactly what to say to Claude** to get it built — from an empty repository to the Play Money Beta (gate G1, KP-OPS-06 §2). It covers milestones M1–M4: 33 work packages cut into 61 build sessions, plus the steps only a person can take.

> The whole plan lives in one data file, `09-handbook/data/beta-path.yaml`. This document, the "Build with Claude" page of the site, the prompt shown on every work package in the Delivery hub and the `kilima-build-wp` skill all read it. Change the plan there, never in three places.

# 2. Operating Model

## 2.1 Roles

@widths 1.1,2.6,1.9
| Role | Does | Never does |
|---|---|---|
| **You — product owner** | Chooses what is next, approves every plan, merges every PR, runs anything that costs money, signs gates, talks to people (players, lawyers, vendors) | Writes code by hand to "save time"; approves a plan you do not understand — ask Claude to explain first |
| **Claude — builder** | Reads the dossier, plans, writes code and tests, runs them, opens PRs, writes reports, updates docs, prepares everything you must execute | Merges to `main`; changes the fixed architecture without an ADR; touches money or cloud accounts without your OK |
| **Engineers (when hired)** | Review Claude's PRs in their area, own production, run on-call | Work outside the same session contract — they use the same prompts and log |

## 2.2 Three places, three jobs

@widths 1.3,1.9,2.4
| Place | What lives there | Used for |
|---|---|---|
| **The code repository** (`kilima-poker` on GitHub and your computer) | Code, `docs/` (this dossier), `CLAUDE.md`, `docs/delivery/progress-log.md` | Build sessions — Claude works inside it with a terminal (Claude Code), so it can run commands, tests and git |
| **The Claude project "poker for Africa"** | Summary of the project, decisions, specs | Planning, reviews, questions, gate checks, documents — sessions that do not write code |
| **The documentation site — Delivery hub** | Status of every WP, owners, sprints, gates, risks | Seeing where we are; updated at the end of every session and in the sprint review |

## 2.3 The loop

1. **Pick** the next step from §9 (the Overview page of the Delivery hub shows what is ready to start).
2. **Start a new session** in the repository and paste the prompt (or the short skill command).
3. **Approve the plan** Claude shows you — or ask questions until it is clear.
4. **Let Claude build** — it runs lint, typecheck and tests itself.
5. **Read the session report**, look at the PR on GitHub, **merge** when checks are green.
6. **Update the hub** — move the WP card, or leave it for the weekly sprint review, which does it for you.

> One session = one slice = one branch = one pull request. A fresh session for every slice keeps Claude fast and accurate: the repository, `CLAUDE.md` and the progress log carry the memory, not the chat.

# 3. The Fixed Architecture Contract

Architecture drifts when every session makes its own small choices. Kilima prevents drift with a single file at the root of the repository, `CLAUDE.md`, that Claude reads at the start of every session (full text in Appendix A). It fixes:

@widths 1.4,3.6
| Area | Fixed choice |
|---|---|
| Repository | One monorepo, pnpm + Turborepo, layout of KP-ENG-11 §1 |
| Languages | TypeScript strict everywhere; Python only for data/ML and the reference implementation |
| Service shape | KP-HBK-07 blueprint for every service; domain never imports frameworks |
| Data | PostgreSQL (core + ledger), Redis, Kafka, ClickHouse; each service owns its schema |
| Protocol | Gameplay only over the socket protocol (ADR-0007); contracts first (KP-ENG-03, KP-ENG-04) |
| Money | bigint minor units; ledger entries only through the posting function (ADR-0005, ADR-0006) |
| Fairness | Pure engine; randomness only from the `rng` service with deck commitments (ADR-0010) |
| Clients | React Native Android first + web, shared `client-core` (ADR-0013) |

!> Changing any of these requires an ADR (KP-HBK-04) that you approve. If Claude believes a change is needed, it stops, explains why, and drafts the ADR — it never changes the architecture quietly inside a feature.

# 4. How to Talk to Claude — Session Types

Every interaction is one of seven session types. Each has a fixed opening line; the three most frequent ones are skills, so you type one short command.

@widths 1.2,1.5,1.7,1.9
| Session type | When | What you type | What you get back |
|---|---|---|---|
| **Build** | Every slice in §9 | `/kilima-build-wp WP-05 1` (or the full prompt from §9) | Plan → code + tests → PR → session report |
| **Fix / change** | A PR needs changes, a bug appears | "Fix in PR #12: …" + what you saw (screenshot, log) | Updated PR and a short report |
| **Explain** | Before approving something you do not understand | "Explain the plan / this PR as if I am not an engineer: what, why, risks" | Plain-language explanation in Hebrew |
| **Sprint review** | Every second Friday and at every stage checkpoint | `/kilima-sprint-review` | Hub updated from the progress log, summary, risks, next sprint proposal |
| **Gate check** | Before Alpha and before Beta | `/kilima-gate-check G1` | Every gate item checked against evidence, ticked in the hub, gaps listed |
| **Decision (ADR)** | Claude or you want to change a fixed choice | "Draft an ADR for …: options, trade-offs, recommendation" | An ADR in `docs/03-engineering/adr/` for your approval |
| **Prepare for me** | A step only you can do (AWS, Play Store, pentest vendor) | "Prepare step CLOUD-0 for me: exact clicks and checks" | A step-by-step checklist you follow |

## 4.1 Writing your own prompt

When a situation is not covered, use the same five parts Claude's prompts use:

```
Context:  which WP / PR / screen this is about
Goal:     the outcome, in one sentence
Done when: how we will both know it is finished (a test, a number, a screen)
Limits:   what must not change (e.g. "no new dependency", "do not touch the wallet")
Process:  "plan first and wait for my OK" — always
```

# 5. A Build Session, Step by Step

@widths 0.4,1.5,3.1
| # | Step | What happens |
|---|---|---|
| 1 | Open | New Claude Code session in the repository folder; paste the prompt |
| 2 | Orient | Claude reads `CLAUDE.md`, the top of the progress log, the WP entry and its reading list; checks dependencies are merged |
| 3 | Plan | Claude shows: files it will add/change, tests it will write, risks, questions. **Stop point — you answer "OK" or adjust** |
| 4 | Build | Claude writes code and tests in small commits on the slice branch |
| 5 | Verify | Claude runs `pnpm lint`, `pnpm typecheck`, the tests (and vectors/simbots when relevant) and fixes failures |
| 6 | Deliver | Claude opens the PR and writes the session report (Appendix B) at the top of the progress log |
| 7 | Close | You read the report, check the PR on GitHub, merge. Move the card in the hub (or leave it to the sprint review) |

## 5.1 Stop points — Claude always asks before

- changing the fixed architecture or a non-negotiable, adding a top-level dependency or a new service;
- changing money, RNG, engine rules or security behaviour beyond the slice;
- anything that costs money or touches cloud accounts; deleting data;
- merging — **you** merge.

## 5.2 When a session goes wrong

- **Tests will not go green after two attempts:** Claude stops and reports what it tried. Ask for an Explain session, or split the slice.
- **The slice is bigger than expected:** Claude proposes a split; you approve; the YAML file is updated in the same PR.
- **Claude and the dossier disagree with reality** (a library does not work as the doc assumed): Claude records it in `docs/delivery/decisions.md` or drafts an ADR — the dossier stays true.

# 6. Ready and Done for a Slice

Adapted from KP-QA-02 for Claude-built slices.

@widths 1,4
| | Checklist |
|---|---|
| **Ready** | WP dependencies merged · goal and "done when" written in the YAML · reading list exists · any step only you can do is finished |
| **Done** | Code and tests merged to `main` · CI green · lint rules pass · done-when criterion shown with numbers in the report · docs updated if behaviour changed · progress log entry · hub card moved |

# 7. What Only You Can Do

Claude cannot create accounts, pay, sign, or judge how the game feels in the hand. These steps are marked **You** in §9, and Claude prepares each of them with a checklist when asked.

@widths 1.6,3.4
| Area | Your part |
|---|---|
| Accounts and money | GitHub organisation, AWS accounts and billing, domain, Google Play developer account, paid vendors |
| Secrets | Creating and storing credentials — never paste them into a chat |
| Approvals | Plans, merges, `terraform apply`, gate sign-off, go/no-go |
| People | Lawyers and compliance adviser, translators, pentest firm, Alpha players, hiring |
| Feel and quality | Playing on a real low-end phone, usability sessions, deciding "this is good enough" |

# 8. Working Efficiently

- **Follow the order in §9.** It is sorted by the critical path (KP-HBK-06 §9): engine first, then the local platform spine, then the app, then the cloud — so nothing waits and nothing is built twice.
- **Local before cloud.** Stages S1–S3 need no AWS spending at all; the cloud starts in S4 when there is something worth deploying.
- **A fresh session per slice.** Long chats get slow and expensive; the repository is the memory.
- **Two lanes at most.** When two ready WPs do not depend on each other (e.g. WP-07 and WP-10), run two sessions in parallel on separate branches. More lanes than you can review is waste.
- **Review daily, plan fortnightly.** Merge PRs the same day; run the sprint review every second Friday.
- **Ask for explanations freely.** An "Explain" session costs minutes; merging something you do not understand costs weeks.
- **Hire for review, not typing.** From stage S2, a senior engineer who reviews Claude's PRs (especially wallet, RNG, gateway) is the best-value hire before Beta.

# 9. The Sequence to Beta

@widths 0.5,1.3,2.4,0.7,1.6
| Stage | Name | Goal | Sessions | Checkpoint |
|---|---|---|---|---|
| S0 | Set-up | A private repository on your computer and GitHub, with the dossier inside it and the fixed architecture contract (CLAUDE.md) in place. | 1 |  |
| S1 | Engine first | The monorepo, CI and a complete, fully tested poker engine — no servers or cloud needed yet. This is the heart of the product and the first item on the critical path. | 11 | Engine complete: every vector in test_vectors.json passes and 10^6 random hands conserve chips. Run the sprint review. |
| S2 | Platform spine (local) | Everything a hand needs, running on your computer with Docker — identity, wallet, RNG, events, gateway and table server — until bots play 100,000 hands with zero money errors. | 18 | Bots play 100,000 hands locally with real settlement and zero conservation errors. Run the sprint review. |
| S3 | The app and the lobby | You can install the app on an Android phone, log in, pick a table and play against bots. | 9 | You play Hold'em, Omaha, fast-fold and AOF on your phone against bots. Run the sprint review. |
| S4 | Cloud staging | The same platform running in AWS (af-south-1) in `dev` and `staging`, with dashboards, so other people can play. | 4 | The app on your phone plays against bots in `staging`. Run the sprint review. |
| S5 | Tournaments and Alpha | Tournaments, back-office, integrity, responsible gaming and languages — then an internal Alpha with invited players. | 11 | Alpha running with invited players. Run the sprint review. |
| S6 | Beta hardening and G1 | Load, security, operations and polish until every G1 checklist item has evidence — then open the Play Money Beta. | 7 | Play Money Beta is live. |

## Stage S0 — Set-up

A private repository on your computer and GitHub, with the dossier inside it and the fixed architecture contract (CLAUDE.md) in place.

### SETUP-1 · Accounts and tools (you)

**Who:** Only you (a person) can do this

- Create a GitHub organisation (e.g. kilima-poker) and a private repository `kilima-poker`; enable branch protection on `main` (PR required, 1 approval, status checks).
- Install on your computer: Git, Node.js 24 LTS, pnpm (corepack enable), Docker Desktop, Python 3.12, GitHub CLI (`gh auth login`).
- Clone the empty repository to a folder you will keep (e.g. Documents\\kilima-poker).
- Open that folder in a Claude coding session (Claude Code in the desktop app or terminal) — build sessions run there so Claude can run commands, tests and git.

**Done when:** `git status` works in the folder and `node -v` prints v24.

### SETUP-2 · Bootstrap the repository

**Who:** Claude builds, you review and merge

**Read:** KP-ENG-11, KP-HBK-02, KP-HBK-14, KP-HBK-20

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Import the dossier and install the architecture contract | Copy the dossier into `docs/` (kilima-poker-docs content), add `CLAUDE.md` exactly as in KP-HBK-23 Appendix A, `.tool-versions`, `.editorconfig`, `.gitignore`, root `README.md`, `docs/delivery/progress-log.md` (empty log with the report template) and `docs/delivery/decisions.md`. | Repository has `docs/`, `CLAUDE.md` and the delivery log on `main` via a merged PR. |

**Slice 1 — short command:** `/kilima-build-wp SETUP-2 1` — or paste the full prompt:

```
Kilima build session — SETUP-2, slice 1 of 1: Import the dossier and install the architecture contract.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the SETUP-2 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-11, KP-HBK-02, KP-HBK-14, KP-HBK-20.
No work-package dependencies.

Goal: Copy the dossier into `docs/` (kilima-poker-docs content), add `CLAUDE.md` exactly as in KP-HBK-23 Appendix A, `.tool-versions`, `.editorconfig`, `.gitignore`, root `README.md`, `docs/delivery/progress-log.md` (empty log with the report template) and `docs/delivery/decisions.md`.
Done when: Repository has `docs/`, `CLAUDE.md` and the delivery log on `main` via a merged PR.
The dossier is in the kilima-poker-docs folder I will give you. Do not change any document content while importing.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch setup-2/import-the-dossier-and-install-the-archi; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

## Stage S1 — Engine first

The monorepo, CI and a complete, fully tested poker engine — no servers or cloud needed yet. This is the heart of the product and the first item on the critical path.

### WP-01 · Monorepo, pnpm/Turborepo, lint rules (money, RNG, engine purity), CI pipeline stages 1–7

**Who:** Claude builds, you review and merge · **Team:** PLT · **Depends on:** — · **WP done when:** A sample service passes the full pipeline and produces a signed image

**Read:** KP-ENG-11, KP-OPS-01, KP-HBK-07, KP-HBK-09, KP-HBK-15

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Workspace skeleton | pnpm workspaces + Turborepo, shared tsconfig (strict), ESLint + Prettier, Vitest, `packages/shared` (logger, config, errors), and `services/sample` following the service blueprint (/healthz, /readyz, /version, /metrics). | `pnpm install && pnpm lint && pnpm typecheck && pnpm test` pass; `pnpm dev` starts the sample service. |
| 2 | Custom lint rules | ESLint plugin `packages/eslint-plugin-kilima` implementing the six CI-blocking rules of KP-ENG-11 §2.1 (no-float-money, no-math-random, no-io-in-engine, no-raw-ledger-entries, no-hole-cards-in-logs, no-direct-db-cross-schema), each with tests. | Each rule has passing and failing fixtures; the sample service passes. |
| 3 | CI pipeline | GitHub Actions workflow with the pipeline stages of KP-OPS-01 §3 that apply before cloud exists (install, lint, typecheck, unit, contract, build, container image + SBOM + signature); cache; required checks on main. | A PR shows all checks green and produces a signed image artifact. |

**Slice 1 — short command:** `/kilima-build-wp WP-01 1` — or paste the full prompt:

```
Kilima build session — WP-01, slice 1 of 3: Workspace skeleton.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-01 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-11, KP-OPS-01, KP-HBK-07, KP-HBK-09, KP-HBK-15.
No work-package dependencies.

Goal: pnpm workspaces + Turborepo, shared tsconfig (strict), ESLint + Prettier, Vitest, `packages/shared` (logger, config, errors), and `services/sample` following the service blueprint (/healthz, /readyz, /version, /metrics).
Done when: `pnpm install && pnpm lint && pnpm typecheck && pnpm test` pass; `pnpm dev` starts the sample service.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-01/1-workspace-skeleton; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-01 2` — or paste the full prompt:

```
Kilima build session — WP-01, slice 2 of 3: Custom lint rules.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-01 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-11, KP-OPS-01, KP-HBK-07, KP-HBK-09, KP-HBK-15.
No work-package dependencies.

Goal: ESLint plugin `packages/eslint-plugin-kilima` implementing the six CI-blocking rules of KP-ENG-11 §2.1 (no-float-money, no-math-random, no-io-in-engine, no-raw-ledger-entries, no-hole-cards-in-logs, no-direct-db-cross-schema), each with tests.
Done when: Each rule has passing and failing fixtures; the sample service passes.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-01/2-custom-lint-rules; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 3 — short command:** `/kilima-build-wp WP-01 3` — or paste the full prompt:

```
Kilima build session — WP-01, slice 3 of 3: CI pipeline.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-01 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-11, KP-OPS-01, KP-HBK-07, KP-HBK-09, KP-HBK-15.
No work-package dependencies.

Goal: GitHub Actions workflow with the pipeline stages of KP-OPS-01 §3 that apply before cloud exists (install, lint, typecheck, unit, contract, build, container image + SBOM + signature); cache; required checks on main.
Done when: A PR shows all checks green and produces a signed image artifact.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-01/3-ci-pipeline; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Open the PR on GitHub, see the green checks, merge.

### WP-04 · `packages/contracts`: OpenAPI/AsyncAPI generation, validators, mocks

**Who:** Claude builds, you review and merge · **Team:** PLT · **Depends on:** WP-01 · **WP done when:** Types and mock servers generated in CI

**Read:** KP-ENG-03, KP-ENG-04, KP-HBK-08, docs/03-engineering/specs/

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Contracts package | `packages/contracts` holding openapi.yaml and asyncapi.yaml, generating TypeScript types and zod validators for every operation and event; a typed client generator for service-to-service calls. | Generated code compiles; a validator test per event family passes. |
| 2 | Mocks and breaking-change check | Mock HTTP server and mock socket event fixtures from the specs; CI step that fails on breaking contract changes (diff against main). | Mocks start with one command; a deliberately breaking change fails CI. |

**Slice 1 — short command:** `/kilima-build-wp WP-04 1` — or paste the full prompt:

```
Kilima build session — WP-04, slice 1 of 2: Contracts package.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-04 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-03, KP-ENG-04, KP-HBK-08, docs/03-engineering/specs/.
Dependencies that must be merged: WP-01.

Goal: `packages/contracts` holding openapi.yaml and asyncapi.yaml, generating TypeScript types and zod validators for every operation and event; a typed client generator for service-to-service calls.
Done when: Generated code compiles; a validator test per event family passes.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-04/1-contracts-package; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-04 2` — or paste the full prompt:

```
Kilima build session — WP-04, slice 2 of 2: Mocks and breaking-change check.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-04 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-03, KP-ENG-04, KP-HBK-08, docs/03-engineering/specs/.
Dependencies that must be merged: WP-01.

Goal: Mock HTTP server and mock socket event fixtures from the specs; CI step that fails on breaking contract changes (diff against main).
Done when: Mocks start with one command; a deliberately breaking change fails CI.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-04/2-mocks-and-breaking-change-check; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge after green CI.

### WP-05 · `engine-poker` v0: cards, evaluator (Hold'em, Omaha, Short Deck), vectors harness

**Who:** Claude builds, you review and merge · **Team:** GAM · **Depends on:** WP-01 · **WP done when:** All evaluation and comparison vectors pass; frequency self-check passes

**Read:** KP-ENG-06, KP-HBK-11, KP-QA-01, ADR-0016, docs/03-engineering/reference/

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Cards and Hold'em evaluator | `packages/engine-poker`: card and deck types, 5- and 7-card evaluator for Hold'em (approach of KP-HBK-11 §4), and a vectors harness that runs `test_vectors.json`. | All Hold'em evaluation and comparison vectors pass. |
| 2 | Omaha and Short Deck | Omaha (exactly two hole + three board cards, PLO4/5/6) and Short Deck rankings (flush beats full house, trips beat straight, A-6-7-8-9 straight). | All Omaha and Short Deck vectors pass. |
| 3 | Frequency self-check and differential test | Exhaustive 2,598,960-hand frequency test, Short Deck 36-card frequencies, and a differential test comparing 10^5 random hands against `poker_reference.py`. | Frequencies match KP-HBK-11 exactly; differential test shows zero mismatches. |

**Slice 1 — short command:** `/kilima-build-wp WP-05 1` — or paste the full prompt:

```
Kilima build session — WP-05, slice 1 of 3: Cards and Hold'em evaluator.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-05 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-06, KP-HBK-11, KP-QA-01, ADR-0016, docs/03-engineering/reference/.
Dependencies that must be merged: WP-01.

Goal: `packages/engine-poker`: card and deck types, 5- and 7-card evaluator for Hold'em (approach of KP-HBK-11 §4), and a vectors harness that runs `test_vectors.json`.
Done when: All Hold'em evaluation and comparison vectors pass.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-05/1-cards-and-hold-em-evaluator; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-05 2` — or paste the full prompt:

```
Kilima build session — WP-05, slice 2 of 3: Omaha and Short Deck.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-05 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-06, KP-HBK-11, KP-QA-01, ADR-0016, docs/03-engineering/reference/.
Dependencies that must be merged: WP-01.

Goal: Omaha (exactly two hole + three board cards, PLO4/5/6) and Short Deck rankings (flush beats full house, trips beat straight, A-6-7-8-9 straight).
Done when: All Omaha and Short Deck vectors pass.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-05/2-omaha-and-short-deck; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 3 — short command:** `/kilima-build-wp WP-05 3` — or paste the full prompt:

```
Kilima build session — WP-05, slice 3 of 3: Frequency self-check and differential test.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-05 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-06, KP-HBK-11, KP-QA-01, ADR-0016, docs/03-engineering/reference/.
Dependencies that must be merged: WP-01.

Goal: Exhaustive 2,598,960-hand frequency test, Short Deck 36-card frequencies, and a differential test comparing 10^5 random hands against `poker_reference.py`.
Done when: Frequencies match KP-HBK-11 exactly; differential test shows zero mismatches.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-05/3-frequency-self-check-and-differential-te; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Read the test summary in the session report; merge.

### WP-06 · `engine-poker` betting: NL/PL legality, incomplete raises, blinds/antes, pots, rake, odd chips

**Who:** Claude builds, you review and merge · **Team:** GAM · **Depends on:** WP-05 · **WP done when:** All betting, pot and rake vectors pass; 10^6-hand property test green

**Read:** KP-ENG-06, KP-HBK-11, KP-FIN-04, ADR-0018

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Hand state machine and legality | Pure reducer `applyAction(state, action) → Result`: streets, blinds and antes, action order (incl. heads-up), NL and PL legality, minimum raise, incomplete all-in raises and re-opening rules. | All betting-legality vectors pass. |
| 2 | Pots, rake and showdown | Main and side pots (KP-HBK-11 §6), rake as % with cap and no flop no drop, proportional rake allocation, odd chip left of the button, showdown order, uncalled bets. | All pot, rake and odd-chip vectors pass. |
| 3 | Property tests at scale | fast-check property tests: chip conservation, no negative stacks, legal actions only, termination; 10^6 random hands in the nightly profile; per-action latency within the KP-HBK-11 §7 budget. | 10^6-hand run green; report attached to the PR. |

**Slice 1 — short command:** `/kilima-build-wp WP-06 1` — or paste the full prompt:

```
Kilima build session — WP-06, slice 1 of 3: Hand state machine and legality.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-06 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-06, KP-HBK-11, KP-FIN-04, ADR-0018.
Dependencies that must be merged: WP-05.

Goal: Pure reducer `applyAction(state, action) → Result`: streets, blinds and antes, action order (incl. heads-up), NL and PL legality, minimum raise, incomplete all-in raises and re-opening rules.
Done when: All betting-legality vectors pass.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-06/1-hand-state-machine-and-legality; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-06 2` — or paste the full prompt:

```
Kilima build session — WP-06, slice 2 of 3: Pots, rake and showdown.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-06 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-06, KP-HBK-11, KP-FIN-04, ADR-0018.
Dependencies that must be merged: WP-05.

Goal: Main and side pots (KP-HBK-11 §6), rake as % with cap and no flop no drop, proportional rake allocation, odd chip left of the button, showdown order, uncalled bets.
Done when: All pot, rake and odd-chip vectors pass.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-06/2-pots-rake-and-showdown; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 3 — short command:** `/kilima-build-wp WP-06 3` — or paste the full prompt:

```
Kilima build session — WP-06, slice 3 of 3: Property tests at scale.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-06 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-06, KP-HBK-11, KP-FIN-04, ADR-0018.
Dependencies that must be merged: WP-05.

Goal: fast-check property tests: chip conservation, no negative stacks, legal actions only, termination; 10^6 random hands in the nightly profile; per-action latency within the KP-HBK-11 §7 budget.
Done when: 10^6-hand run green; report attached to the PR.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-06/3-property-tests-at-scale; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge. Critical-path item — do not start WP-12 before this is merged.

> **Checkpoint S1:** Engine complete: every vector in test_vectors.json passes and 10^6 random hands conserve chips. Run the sprint review.

## Stage S2 — Platform spine (local)

Everything a hand needs, running on your computer with Docker — identity, wallet, RNG, events, gateway and table server — until bots play 100,000 hands with zero money errors.

### WP-03 · Local dev stack (compose), seed tooling, `simbots` skeleton

**Who:** Claude builds, you review and merge · **Team:** PLT · **Depends on:** WP-01 · **WP done when:** New engineer runs the platform in < 1 h (KP-HBK-02)

**Read:** KP-HBK-02, KP-HBK-13, KP-QA-04

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Local stack and seeds | `pnpm dev:infra` docker compose (postgres core + ledger, redis, redpanda, clickhouse, mailpit, localstack), `pnpm db:migrate`, `pnpm db:seed` with the test accounts of KP-HBK-02 §2. | From a clean clone the stack is up in under 15 minutes following README steps. |
| 2 | simbots skeleton | `tools/simbots`: scenario YAML loader, bot strategies (random, tight, loose), socket client using client-core types, assertions (chip conservation). | `pnpm simbots --help` works; a dry-run scenario runs against mocks. |

**Slice 1 — short command:** `/kilima-build-wp WP-03 1` — or paste the full prompt:

```
Kilima build session — WP-03, slice 1 of 2: Local stack and seeds.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-03 entry in docs/09-handbook/data/beta-path.yaml, and KP-HBK-02, KP-HBK-13, KP-QA-04.
Dependencies that must be merged: WP-01.

Goal: `pnpm dev:infra` docker compose (postgres core + ledger, redis, redpanda, clickhouse, mailpit, localstack), `pnpm db:migrate`, `pnpm db:seed` with the test accounts of KP-HBK-02 §2.
Done when: From a clean clone the stack is up in under 15 minutes following README steps.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-03/1-local-stack-and-seeds; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-03 2` — or paste the full prompt:

```
Kilima build session — WP-03, slice 2 of 2: simbots skeleton.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-03 entry in docs/09-handbook/data/beta-path.yaml, and KP-HBK-02, KP-HBK-13, KP-QA-04.
Dependencies that must be merged: WP-01.

Goal: `tools/simbots`: scenario YAML loader, bot strategies (random, tight, loose), socket client using client-core types, assertions (chip conservation).
Done when: `pnpm simbots --help` works; a dry-run scenario runs against mocks.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-03/2-simbots-skeleton; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Follow the README on your own machine from a fresh clone; tell Claude every step that failed.

### WP-13 · `wallet` Play Money: ledger schema, posting function, helpers (buy-in, settlement, cash-out)

**Who:** Claude builds, you review and merge · **Team:** PAY · **Depends on:** WP-01 · **WP done when:** Property test 10^6 postings; settlement p99 < 50 ms locally

**Read:** KP-ENG-08, KP-HBK-12, KP-ENG-05, KP-FIN-03, ADR-0005, ADR-0006

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Money package and ledger schema | `packages/money` (bigint minor units, currency-safe ops) and `services/wallet` ledger migrations on the ledger database: accounts, transactions, postings, balances, constraints. | Migrations apply and roll back; money package 100% branch coverage. |
| 2 | Posting function and helpers | The single posting function of KP-HBK-12 §2 (double-entry, sum zero, idempotency key, balance locks in a fixed order) in `packages/ledger-postings`, and helpers buy-in, hand settlement, cash-out, Play Money grant; HTTP endpoints from the contracts. | Integration tests for every helper; illegal postings rejected. |
| 3 | Property and performance tests | Property test of 10^6 random postings (balances always equal the sum of postings, no negative player balance); settlement benchmark. | Property test green; settlement p99 < 50 ms locally. |

**Slice 1 — short command:** `/kilima-build-wp WP-13 1` — or paste the full prompt:

```
Kilima build session — WP-13, slice 1 of 3: Money package and ledger schema.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-13 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-08, KP-HBK-12, KP-ENG-05, KP-FIN-03, ADR-0005, ADR-0006.
Dependencies that must be merged: WP-01.

Goal: `packages/money` (bigint minor units, currency-safe ops) and `services/wallet` ledger migrations on the ledger database: accounts, transactions, postings, balances, constraints.
Done when: Migrations apply and roll back; money package 100% branch coverage.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-13/1-money-package-and-ledger-schema; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-13 2` — or paste the full prompt:

```
Kilima build session — WP-13, slice 2 of 3: Posting function and helpers.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-13 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-08, KP-HBK-12, KP-ENG-05, KP-FIN-03, ADR-0005, ADR-0006.
Dependencies that must be merged: WP-01.

Goal: The single posting function of KP-HBK-12 §2 (double-entry, sum zero, idempotency key, balance locks in a fixed order) in `packages/ledger-postings`, and helpers buy-in, hand settlement, cash-out, Play Money grant; HTTP endpoints from the contracts.
Done when: Integration tests for every helper; illegal postings rejected.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-13/2-posting-function-and-helpers; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 3 — short command:** `/kilima-build-wp WP-13 3` — or paste the full prompt:

```
Kilima build session — WP-13, slice 3 of 3: Property and performance tests.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-13 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-08, KP-HBK-12, KP-ENG-05, KP-FIN-03, ADR-0005, ADR-0006.
Dependencies that must be merged: WP-01.

Goal: Property test of 10^6 random postings (balances always equal the sum of postings, no negative player balance); settlement benchmark.
Done when: Property test green; settlement p99 < 50 ms locally.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-13/3-property-and-performance-tests; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Money path — read the session report carefully, ask Claude to explain anything unclear before merging.

### WP-07 · `identity` v1: phone registration, OTP (mock provider), login, refresh, JWKS via KMS (localstack)

**Who:** Claude builds, you review and merge · **Team:** PLT · **Depends on:** WP-04 · **WP done when:** E2E register → login → refresh; token tests (KP-ENG-02 §12)

**Read:** KP-ENG-02, KP-SEC-03, KP-HBK-18, ADR-0003, ADR-0004

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Registration and OTP | `services/identity`: phone registration, OTP via a mock SMS provider (Mailpit), password with argon2id, login, lockout and rate limits. | E2E register → verify OTP → login passes. |
| 2 | Tokens and JWKS | RS256 access tokens signed through KMS (localstack), JWKS endpoint, refresh-token rotation with reuse detection, `sid` deny-list, shared auth middleware in `packages/shared/auth`. | All token tests of KP-ENG-02 §12 pass. |

**Slice 1 — short command:** `/kilima-build-wp WP-07 1` — or paste the full prompt:

```
Kilima build session — WP-07, slice 1 of 2: Registration and OTP.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-07 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-02, KP-SEC-03, KP-HBK-18, ADR-0003, ADR-0004.
Dependencies that must be merged: WP-04.

Goal: `services/identity`: phone registration, OTP via a mock SMS provider (Mailpit), password with argon2id, login, lockout and rate limits.
Done when: E2E register → verify OTP → login passes.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-07/1-registration-and-otp; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-07 2` — or paste the full prompt:

```
Kilima build session — WP-07, slice 2 of 2: Tokens and JWKS.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-07 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-02, KP-SEC-03, KP-HBK-18, ADR-0003, ADR-0004.
Dependencies that must be merged: WP-04.

Goal: RS256 access tokens signed through KMS (localstack), JWKS endpoint, refresh-token rotation with reuse detection, `sid` deny-list, shared auth middleware in `packages/shared/auth`.
Done when: All token tests of KP-ENG-02 §12 pass.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-07/2-tokens-and-jwks; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge after green CI.

### WP-10 · `rng` service (dev DRBG → HMAC_DRBG with KMS entropy), deck commitments, audit topic

**Who:** Claude builds, you review and merge · **Team:** GAM · **Depends on:** WP-02 · **WP done when:** Fisher–Yates with rejection sampling; commitment verification test on 10^5 hands

**Read:** KP-ENG-13, ADR-0010

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | DRBG and shuffle | `services/rng`: DRBG interface with a dev implementation and HMAC_DRBG (entropy from KMS/localstack), Fisher–Yates shuffle with rejection sampling, health tests. | Uniformity test on 10^6 shuffles within bounds. |
| 2 | Deck commitments and audit | Deck commitment SHA-256(deckId\|cards\|salt) published before the deal, reveal after the hand, audit events to the `rng.audit` topic, verification tool. | Commitment verification passes on 10^5 hands. |

**Slice 1 — short command:** `/kilima-build-wp WP-10 1` — or paste the full prompt:

```
Kilima build session — WP-10, slice 1 of 2: DRBG and shuffle.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-10 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-13, ADR-0010.
Dependencies that must be merged: WP-02.

Goal: `services/rng`: DRBG interface with a dev implementation and HMAC_DRBG (entropy from KMS/localstack), Fisher–Yates shuffle with rejection sampling, health tests.
Done when: Uniformity test on 10^6 shuffles within bounds.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-10/1-drbg-and-shuffle; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-10 2` — or paste the full prompt:

```
Kilima build session — WP-10, slice 2 of 2: Deck commitments and audit.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-10 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-13, ADR-0010.
Dependencies that must be merged: WP-02.

Goal: Deck commitment SHA-256(deckId|cards|salt) published before the deal, reveal after the hand, audit events to the `rng.audit` topic, verification tool.
Done when: Commitment verification passes on 10^5 hands.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-10/2-deck-commitments-and-audit; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge.

### WP-19 · Kafka (MSK) + outbox library + schema registry

**Who:** Claude builds, you review and merge · **Team:** SRE + PLT · **Depends on:** WP-02 · **WP done when:** `hand.completed` consumed by two services idempotently

**Read:** KP-ENG-01, KP-ENG-05, KP-HBK-07, ADR-0008

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Outbox and idempotent consumers | `packages/shared/events`: outbox table helper (same transaction), relay to Kafka (redpanda locally), idempotent consumer base with a processed-events table, schema naming and versioning rules. | `hand.completed` test event consumed exactly once by two consumers under redelivery. |

**Slice 1 — short command:** `/kilima-build-wp WP-19 1` — or paste the full prompt:

```
Kilima build session — WP-19, slice 1 of 1: Outbox and idempotent consumers.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-19 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-01, KP-ENG-05, KP-HBK-07, ADR-0008.
Dependencies that must be merged: WP-02.

Goal: `packages/shared/events`: outbox table helper (same transaction), relay to Kafka (redpanda locally), idempotent consumer base with a processed-events table, schema naming and versioning rules.
Done when: `hand.completed` test event consumed exactly once by two consumers under redelivery.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-19/1-outbox-and-idempotent-consumers; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge. (The managed Kafka in AWS comes in stage S4.)

### WP-11 · `gateway`: handshake auth, rooms, private routing, outbound hole-card filter, resync buffer

**Who:** Claude builds, you review and merge · **Team:** GAM · **Depends on:** WP-07 · **WP done when:** Socket E2E: two players, private cards never leak (fuzz test)

**Read:** KP-ENG-04, KP-HBK-08, KP-SEC-01

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Handshake and rooms | `services/gateway`: socket handshake with JWT, session registry in Redis, room join/leave, heartbeat, backpressure. | Two clients connect, join a table room and receive public events. |
| 2 | Private routing and hole-card filter | Per-seat private channel, outbound filter that strips other players' hole cards from every message, rate limits per message type. | Unit tests prove a player can never receive another player's hole cards. |
| 3 | Resync and fuzz | Sequence numbers, resync buffer, reconnect within the grace period, and a fuzz test sending random protocol traffic. | Fuzz test of 10^5 messages: zero leaks, zero crashes. |

**Slice 1 — short command:** `/kilima-build-wp WP-11 1` — or paste the full prompt:

```
Kilima build session — WP-11, slice 1 of 3: Handshake and rooms.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-11 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-04, KP-HBK-08, KP-SEC-01.
Dependencies that must be merged: WP-07.

Goal: `services/gateway`: socket handshake with JWT, session registry in Redis, room join/leave, heartbeat, backpressure.
Done when: Two clients connect, join a table room and receive public events.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-11/1-handshake-and-rooms; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-11 2` — or paste the full prompt:

```
Kilima build session — WP-11, slice 2 of 3: Private routing and hole-card filter.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-11 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-04, KP-HBK-08, KP-SEC-01.
Dependencies that must be merged: WP-07.

Goal: Per-seat private channel, outbound filter that strips other players' hole cards from every message, rate limits per message type.
Done when: Unit tests prove a player can never receive another player's hole cards.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-11/2-private-routing-and-hole-card-filter; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 3 — short command:** `/kilima-build-wp WP-11 3` — or paste the full prompt:

```
Kilima build session — WP-11, slice 3 of 3: Resync and fuzz.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-11 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-04, KP-HBK-08, KP-SEC-01.
Dependencies that must be merged: WP-07.

Goal: Sequence numbers, resync buffer, reconnect within the grace period, and a fuzz test sending random protocol traffic.
Done when: Fuzz test of 10^5 messages: zero leaks, zero crashes.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-11/3-resync-and-fuzz; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge. Security-sensitive — Claude must show the leak test output in the report.

### WP-12 · `table-server`: table actors, leases, timers, time bank, hand records, drain

**Who:** Claude builds, you review and merge · **Team:** GAM · **Depends on:** WP-06, WP-10, WP-11 · **WP done when:** Bots play 100k hands in staging with zero conservation errors

**Read:** KP-ENG-07, KP-ENG-06, KP-ENG-04, ADR-0011, ADR-0017

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Table actor and timers | `services/table-server`: one actor per table driving engine-poker, action timers, time bank, sit-out rules, events to the gateway. | A local table plays hands between simbots. |
| 2 | Leases, hand records and drain | Table leases in Redis (one owner), hand records to Postgres and `hand.completed` via outbox, graceful drain moving tables between pods. | Killing a table-server process moves its tables without losing a hand. |
| 3 | 100k-hand bot run | simbots scenario of 100,000 hands across 20 tables with conservation assertions; report. | Zero conservation errors in the report. |

**Slice 1 — short command:** `/kilima-build-wp WP-12 1` — or paste the full prompt:

```
Kilima build session — WP-12, slice 1 of 3: Table actor and timers.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-12 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-ENG-06, KP-ENG-04, ADR-0011, ADR-0017.
Dependencies that must be merged: WP-06, WP-10, WP-11.

Goal: `services/table-server`: one actor per table driving engine-poker, action timers, time bank, sit-out rules, events to the gateway.
Done when: A local table plays hands between simbots.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-12/1-table-actor-and-timers; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-12 2` — or paste the full prompt:

```
Kilima build session — WP-12, slice 2 of 3: Leases, hand records and drain.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-12 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-ENG-06, KP-ENG-04, ADR-0011, ADR-0017.
Dependencies that must be merged: WP-06, WP-10, WP-11.

Goal: Table leases in Redis (one owner), hand records to Postgres and `hand.completed` via outbox, graceful drain moving tables between pods.
Done when: Killing a table-server process moves its tables without losing a hand.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-12/2-leases-hand-records-and-drain; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 3 — short command:** `/kilima-build-wp WP-12 3` — or paste the full prompt:

```
Kilima build session — WP-12, slice 3 of 3: 100k-hand bot run.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-12 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-ENG-06, KP-ENG-04, ADR-0011, ADR-0017.
Dependencies that must be merged: WP-06, WP-10, WP-11.

Goal: simbots scenario of 100,000 hands across 20 tables with conservation assertions; report.
Done when: Zero conservation errors in the report.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-12/3-100k-hand-bot-run; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Run `pnpm simbots` yourself once and watch the tables play.

### WP-14 · Hand settlement integration table-server ↔ wallet; pause on wallet failure; voided hands

**Who:** Claude builds, you review and merge · **Team:** GAM + PAY · **Depends on:** WP-12, WP-13 · **WP done when:** Chaos test: kill pods during 10k hands, no money lost

**Read:** KP-ENG-08, KP-HBK-12, KP-QA-04

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Settlement integration | table-server → wallet hand settlement (one posting per hand), table pause on wallet failure, voided-hand procedure, buy-in and cash-out from the table. | Integration tests including wallet outage. |
| 2 | Chaos test | Chaos scenario killing wallet and table-server processes during 10,000 hands; ledger vs hand-record reconciliation. | No money lost or created; report attached. |

**Slice 1 — short command:** `/kilima-build-wp WP-14 1` — or paste the full prompt:

```
Kilima build session — WP-14, slice 1 of 2: Settlement integration.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-14 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-08, KP-HBK-12, KP-QA-04.
Dependencies that must be merged: WP-12, WP-13.

Goal: table-server → wallet hand settlement (one posting per hand), table pause on wallet failure, voided-hand procedure, buy-in and cash-out from the table.
Done when: Integration tests including wallet outage.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-14/1-settlement-integration; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-14 2` — or paste the full prompt:

```
Kilima build session — WP-14, slice 2 of 2: Chaos test.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-14 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-08, KP-HBK-12, KP-QA-04.
Dependencies that must be merged: WP-12, WP-13.

Goal: Chaos scenario killing wallet and table-server processes during 10,000 hands; ledger vs hand-record reconciliation.
Done when: No money lost or created; report attached.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-14/2-chaos-test; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Money path — read the reconciliation numbers in the report.

> **Checkpoint S2:** Bots play 100,000 hands locally with real settlement and zero conservation errors. Run the sprint review.

## Stage S3 — The app and the lobby

You can install the app on an Android phone, log in, pick a table and play against bots.

### WP-09 · Design system and app shell (React Native + web), `client-core` protocol client

**Who:** Claude builds, you review and merge · **Team:** CLI · **Depends on:** WP-04 · **WP done when:** App logs in against staging and shows a lobby stub

**Read:** KP-ENG-15, KP-PRD-04, ADR-0013

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Design system and app shell | `apps/mobile` (React Native, Android first) and `apps/web` sharing a design system in the Kilima brand (navy #10213D, blue #3A6FD8, gold #FFD166), navigation, auth screens. | App runs in the Android emulator and on web. |
| 2 | client-core protocol client | `packages/client-core`: typed socket client from contracts, reconnect/resync, auth token refresh, lobby stub screen. | App logs in against the local stack and shows the lobby stub. |

**Slice 1 — short command:** `/kilima-build-wp WP-09 1` — or paste the full prompt:

```
Kilima build session — WP-09, slice 1 of 2: Design system and app shell.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-09 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-15, KP-PRD-04, ADR-0013.
Dependencies that must be merged: WP-04.

Goal: `apps/mobile` (React Native, Android first) and `apps/web` sharing a design system in the Kilima brand (navy #10213D, blue #3A6FD8, gold #FFD166), navigation, auth screens.
Done when: App runs in the Android emulator and on web.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-09/1-design-system-and-app-shell; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-09 2` — or paste the full prompt:

```
Kilima build session — WP-09, slice 2 of 2: client-core protocol client.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-09 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-15, KP-PRD-04, ADR-0013.
Dependencies that must be merged: WP-04.

Goal: `packages/client-core`: typed socket client from contracts, reconnect/resync, auth token refresh, lobby stub screen.
Done when: App logs in against the local stack and shows the lobby stub.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-09/2-client-core-protocol-client; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Install the debug APK on your phone (Claude gives the steps) and log in.

### WP-17 · Client table (Skia): actions, presets, animations budget, multi-table, reconnect

**Who:** Claude prepares, you execute or approve · **Team:** CLI · **Depends on:** WP-11 · **WP done when:** Playable on the 2 GB baseline device at 60 fps

**Read:** KP-ENG-15, KP-PRD-04, KP-ENG-04

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Table renderer | `packages/table-renderer` (Skia): seats, cards, chips, pot, animations within budget, 6-max and 9-max layouts. | Renderer storybook shows every table state. |
| 2 | Actions and presets | Action bar, bet slider and presets, pre-actions, timers, hand history panel. | Full hand playable from the app against bots. |
| 3 | Multi-table and reconnect | Up to 4 tables, switching, reconnect after network loss, low-end device performance mode. | 60 fps on the 2 GB baseline device profile. |

**Slice 1 — short command:** `/kilima-build-wp WP-17 1` — or paste the full prompt:

```
Kilima build session — WP-17, slice 1 of 3: Table renderer.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-17 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-15, KP-PRD-04, KP-ENG-04.
Dependencies that must be merged: WP-11.

Goal: `packages/table-renderer` (Skia): seats, cards, chips, pot, animations within budget, 6-max and 9-max layouts.
Done when: Renderer storybook shows every table state.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-17/1-table-renderer; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-17 2` — or paste the full prompt:

```
Kilima build session — WP-17, slice 2 of 3: Actions and presets.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-17 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-15, KP-PRD-04, KP-ENG-04.
Dependencies that must be merged: WP-11.

Goal: Action bar, bet slider and presets, pre-actions, timers, hand history panel.
Done when: Full hand playable from the app against bots.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-17/2-actions-and-presets; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 3 — short command:** `/kilima-build-wp WP-17 3` — or paste the full prompt:

```
Kilima build session — WP-17, slice 3 of 3: Multi-table and reconnect.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-17 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-15, KP-PRD-04, KP-ENG-04.
Dependencies that must be merged: WP-11.

Goal: Up to 4 tables, switching, reconnect after network loss, low-end device performance mode.
Done when: 60 fps on the 2 GB baseline device profile.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-17/3-multi-table-and-reconnect; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** You test on a real low-end Android phone (2 GB RAM). Only a person can judge feel — send Claude screenshots or a screen recording of problems.

### WP-15 · `lobby`: pools, templates, table creation by demand, waitlists, seating restrictions v0

**Who:** Claude builds, you review and merge · **Team:** GAM · **Depends on:** WP-12 · **WP done when:** Quick seat < 10 s with 200 bots

**Read:** KP-ENG-07, KP-PRD-02

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Pools and templates | `services/lobby`: table templates, pools, table creation by demand, lobby list API and live updates. | Lobby shows live tables in the app. |
| 2 | Seating and waitlists | Quick seat, waitlists, seating restrictions v0 (same device / IP rules). | Quick seat < 10 s with 200 bots. |

**Slice 1 — short command:** `/kilima-build-wp WP-15 1` — or paste the full prompt:

```
Kilima build session — WP-15, slice 1 of 2: Pools and templates.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-15 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-PRD-02.
Dependencies that must be merged: WP-12.

Goal: `services/lobby`: table templates, pools, table creation by demand, lobby list API and live updates.
Done when: Lobby shows live tables in the app.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-15/1-pools-and-templates; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-15 2` — or paste the full prompt:

```
Kilima build session — WP-15, slice 2 of 2: Seating and waitlists.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-15 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-PRD-02.
Dependencies that must be merged: WP-12.

Goal: Quick seat, waitlists, seating restrictions v0 (same device / IP rules).
Done when: Quick seat < 10 s with 200 bots.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-15/2-seating-and-waitlists; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Play from the lobby on your phone.

### WP-18 · `player` v1: profiles, preferences, stats pipeline from `hand.completed`

**Who:** Claude builds, you review and merge · **Team:** PLT · **Depends on:** WP-12 · **WP done when:** Stats visible in app after hands

**Read:** KP-ENG-05, KP-PRD-02

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Player profiles and stats | `services/player`: profile, avatar, preferences, stats pipeline consuming `hand.completed` idempotently, stats screen. | Stats update in the app after hands. |

**Slice 1 — short command:** `/kilima-build-wp WP-18 1` — or paste the full prompt:

```
Kilima build session — WP-18, slice 1 of 1: Player profiles and stats.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-18 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-05, KP-PRD-02.
Dependencies that must be merged: WP-12.

Goal: `services/player`: profile, avatar, preferences, stats pipeline consuming `hand.completed` idempotently, stats screen.
Done when: Stats update in the app after hands.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-18/1-player-profiles-and-stats; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge.

### WP-16 · Fast-fold pools and AOF

**Who:** Claude builds, you review and merge · **Team:** GAM · **Depends on:** WP-15 · **WP done when:** Fold → next hand < 3 s p95 with 300 bots

**Read:** KP-ENG-07, KP-PRD-02

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Fast-fold pools and AOF | Fast-fold pool manager (fold → new table), All-or-Fold variant with its engine rules, client support. | Fold → next hand < 3 s p95 with 300 bots. |

**Slice 1 — short command:** `/kilima-build-wp WP-16 1` — or paste the full prompt:

```
Kilima build session — WP-16, slice 1 of 1: Fast-fold pools and AOF.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-16 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-PRD-02.
Dependencies that must be merged: WP-15.

Goal: Fast-fold pool manager (fold → new table), All-or-Fold variant with its engine rules, client support.
Done when: Fold → next hand < 3 s p95 with 300 bots.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-16/1-fast-fold-pools-and-aof; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Play a few fast-fold hands on the phone.

> **Checkpoint S3:** You play Hold'em, Omaha, fast-fold and AOF on your phone against bots. Run the sprint review.

## Stage S4 — Cloud staging

The same platform running in AWS (af-south-1) in `dev` and `staging`, with dashboards, so other people can play.

### CLOUD-0 · AWS account and budget (you)

**Who:** Only you (a person) can do this

- Create the AWS organisation with separate accounts for `dev` and `staging` (Claude gives the exact list), enable MFA on the root user, set a billing alarm.
- Buy the domain and create the Route 53 hosted zone.
- Give Claude nothing secret in chat — credentials stay in your terminal / GitHub OIDC.

**Done when:** You can run `aws sts get-caller-identity` for both accounts.

### WP-02 · AWS accounts, VPCs, EKS `dev` and `staging`, Argo CD, External Secrets

**Who:** Claude prepares, you execute or approve · **Team:** SRE · **Depends on:** — · **WP done when:** `dev` preview environments created per PR

**Read:** KP-OPS-01, KP-SEC-03, KP-ENG-01, KP-PRJ-04, ADR-0009, ADR-0012

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Terraform foundations | `kilima-infra` repository: VPCs, EKS (dev, staging), Aurora PostgreSQL core + ledger, ElastiCache, S3, KMS keys, IAM with GitHub OIDC; cost estimate before apply. | `terraform plan` clean; you run `terraform apply` with Claude guiding step by step. |
| 2 | GitOps and secrets | Argo CD, External Secrets, Helm charts for every service built so far, per-PR preview environments in `dev`. | A PR creates a preview environment automatically. |
| 3 | Managed Kafka | MSK (or the chosen managed Kafka), schema registry, topics as code; switch services from redpanda config. | `hand.completed` flows in staging. |

**Slice 1 — short command:** `/kilima-build-wp WP-02 1` — or paste the full prompt:

```
Kilima build session — WP-02, slice 1 of 3: Terraform foundations.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-02 entry in docs/09-handbook/data/beta-path.yaml, and KP-OPS-01, KP-SEC-03, KP-ENG-01, KP-PRJ-04, ADR-0009, ADR-0012.
No work-package dependencies.

Goal: `kilima-infra` repository: VPCs, EKS (dev, staging), Aurora PostgreSQL core + ledger, ElastiCache, S3, KMS keys, IAM with GitHub OIDC; cost estimate before apply.
Done when: `terraform plan` clean; you run `terraform apply` with Claude guiding step by step.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-02/1-terraform-foundations; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-02 2` — or paste the full prompt:

```
Kilima build session — WP-02, slice 2 of 3: GitOps and secrets.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-02 entry in docs/09-handbook/data/beta-path.yaml, and KP-OPS-01, KP-SEC-03, KP-ENG-01, KP-PRJ-04, ADR-0009, ADR-0012.
No work-package dependencies.

Goal: Argo CD, External Secrets, Helm charts for every service built so far, per-PR preview environments in `dev`.
Done when: A PR creates a preview environment automatically.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-02/2-gitops-and-secrets; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 3 — short command:** `/kilima-build-wp WP-02 3` — or paste the full prompt:

```
Kilima build session — WP-02, slice 3 of 3: Managed Kafka.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-02 entry in docs/09-handbook/data/beta-path.yaml, and KP-OPS-01, KP-SEC-03, KP-ENG-01, KP-PRJ-04, ADR-0009, ADR-0012.
No work-package dependencies.

Goal: MSK (or the chosen managed Kafka), schema registry, topics as code; switch services from redpanda config.
Done when: `hand.completed` flows in staging.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-02/3-managed-kafka; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** You run every `apply` yourself after reading Claude's plan summary and cost estimate.

### WP-08 · Observability baseline: OpenTelemetry, logging, metrics, Grafana dashboards as code

**Who:** Claude builds, you review and merge · **Team:** SRE · **Depends on:** WP-02 · **WP done when:** Traces across two services visible in staging

**Read:** KP-OPS-02, KP-HBK-17

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Observability baseline | OpenTelemetry in every service, log shipping, Prometheus metrics, Grafana dashboards and SLO alerts as code. | Traces across gateway → table-server → wallet visible in staging. |

**Slice 1 — short command:** `/kilima-build-wp WP-08 1` — or paste the full prompt:

```
Kilima build session — WP-08, slice 1 of 1: Observability baseline.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-08 entry in docs/09-handbook/data/beta-path.yaml, and KP-OPS-02, KP-HBK-17.
Dependencies that must be merged: WP-02.

Goal: OpenTelemetry in every service, log shipping, Prometheus metrics, Grafana dashboards and SLO alerts as code.
Done when: Traces across gateway → table-server → wallet visible in staging.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-08/1-observability-baseline; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Open the Grafana link and look at a live trace.

> **Checkpoint S4:** The app on your phone plays against bots in `staging`. Run the sprint review.

## Stage S5 — Tournaments and Alpha

Tournaments, back-office, integrity, responsible gaming and languages — then an internal Alpha with invited players.

### WP-20 · `tournament`: lifecycle, clock, levels, breaks, late reg, re-entry

**Who:** Claude builds, you review and merge · **Team:** GAM · **Depends on:** WP-12, WP-13 · **WP done when:** 1,000-bot MTT completes with correct payouts

**Read:** KP-ENG-07, KP-FIN-04

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Tournament lifecycle | `services/tournament`: registration, clock, levels and breaks, late registration, re-entry, payouts from payout tables. | 100-bot MTT completes with correct payouts. |
| 2 | Scale run | 1,000-bot MTT scenario in staging with ledger reconciliation. | 1,000-bot MTT completes with correct payouts. |

**Slice 1 — short command:** `/kilima-build-wp WP-20 1` — or paste the full prompt:

```
Kilima build session — WP-20, slice 1 of 2: Tournament lifecycle.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-20 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-FIN-04.
Dependencies that must be merged: WP-12, WP-13.

Goal: `services/tournament`: registration, clock, levels and breaks, late registration, re-entry, payouts from payout tables.
Done when: 100-bot MTT completes with correct payouts.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-20/1-tournament-lifecycle; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-20 2` — or paste the full prompt:

```
Kilima build session — WP-20, slice 2 of 2: Scale run.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-20 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-FIN-04.
Dependencies that must be merged: WP-12, WP-13.

Goal: 1,000-bot MTT scenario in staging with ledger reconciliation.
Done when: 1,000-bot MTT completes with correct payouts.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-20/2-scale-run; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Register for a bot tournament from your phone.

### WP-21 · Balancing, table breaking, hand-for-hand, simultaneous eliminations

**Who:** Claude builds, you review and merge · **Team:** GAM · **Depends on:** WP-20 · **WP done when:** Bubble scenarios pass (KP-QA-01 §4.1)

**Read:** KP-ENG-07, KP-QA-01

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Balancing and hand-for-hand | Table balancing and breaking, hand-for-hand on the bubble, simultaneous eliminations and place ties. | Bubble scenarios of KP-QA-01 §4.1 pass. |

**Slice 1 — short command:** `/kilima-build-wp WP-21 1` — or paste the full prompt:

```
Kilima build session — WP-21, slice 1 of 1: Balancing and hand-for-hand.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-21 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-QA-01.
Dependencies that must be merged: WP-20.

Goal: Table balancing and breaking, hand-for-hand on the bubble, simultaneous eliminations and place ties.
Done when: Bubble scenarios of KP-QA-01 §4.1 pass.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-21/1-balancing-and-hand-for-hand; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge.

### WP-22 · SNG and Spins (Play Money), paytable engine, RNG multiplier draw

**Who:** Claude builds, you review and merge · **Team:** GAM · **Depends on:** WP-20, WP-10 · **WP done when:** 10^6 simulated draws within bounds

**Read:** KP-ENG-07, KP-ENG-13, KP-FIN-04

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | SNG and Spins | Sit & Go and Spins (Play Money), paytable engine, prize multiplier drawn from the RNG service with audit. | 10^6 simulated draws within paytable bounds. |

**Slice 1 — short command:** `/kilima-build-wp WP-22 1` — or paste the full prompt:

```
Kilima build session — WP-22, slice 1 of 1: SNG and Spins.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-22 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-ENG-13, KP-FIN-04.
Dependencies that must be merged: WP-20, WP-10.

Goal: Sit & Go and Spins (Play Money), paytable engine, prize multiplier drawn from the RNG service with audit.
Done when: 10^6 simulated draws within paytable bounds.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-22/1-sng-and-spins; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge.

### WP-23 · PKO bounties, satellites, tickets

**Who:** Claude builds, you review and merge · **Team:** GAM + PAY · **Depends on:** WP-20 · **WP done when:** Ticket issued and redeemed end to end

**Read:** KP-ENG-07, KP-ENG-08

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | PKO, satellites and tickets | Progressive knockout bounties, satellites, tournament tickets as ledger assets. | Ticket issued and redeemed end to end. |

**Slice 1 — short command:** `/kilima-build-wp WP-23 1` — or paste the full prompt:

```
Kilima build session — WP-23, slice 1 of 1: PKO, satellites and tickets.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-23 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-07, KP-ENG-08.
Dependencies that must be merged: WP-20.

Goal: Progressive knockout bounties, satellites, tournament tickets as ledger assets.
Done when: Ticket issued and redeemed end to end.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-23/1-pko-satellites-and-tickets; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge.

### WP-24 · Back-office v1: accounts, kick/restrict, tables and tournaments admin, audit log

**Who:** Claude builds, you review and merge · **Team:** PLT · **Depends on:** WP-15, WP-20 · **WP done when:** Game ops can run a scheduled tournament

**Read:** KP-OPS-07, KP-SEC-02, KP-PRJ-02

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Back-office v1 | `apps/admin` + `services/backoffice`: staff SSO, roles, player search, kick/restrict, tables and tournament admin, immutable audit log. | Game ops can schedule and run a tournament from the back-office. |

**Slice 1 — short command:** `/kilima-build-wp WP-24 1` — or paste the full prompt:

```
Kilima build session — WP-24, slice 1 of 1: Back-office v1.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-24 entry in docs/09-handbook/data/beta-path.yaml, and KP-OPS-07, KP-SEC-02, KP-PRJ-02.
Dependencies that must be merged: WP-15, WP-20.

Goal: `apps/admin` + `services/backoffice`: staff SSO, roles, player search, kick/restrict, tables and tournament admin, immutable audit log.
Done when: Game ops can schedule and run a tournament from the back-office.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-24/1-back-office-v1; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** You schedule a tournament yourself in the back-office.

### WP-25 · Integrity MVP: links graph, seating restrictions, timing profile, co-occurrence, case tool with replays

**Who:** Claude builds, you review and merge · **Team:** TRU · **Depends on:** WP-18, WP-19 · **WP done when:** Red-team collusion pair flagged in staging

**Read:** KP-ENG-09, KP-SEC-04, KP-LEG-07

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Integrity data and rules | `services/integrity`: account link graph (device, IP, payment later), seating restrictions, timing profile, co-occurrence and chip-flow graph. | Signals computed from staging hands. |
| 2 | Case tool and red team | Case management with hand replays in the back-office; red-team collusion bot pair in simbots. | Red-team collusion pair flagged in staging. |

**Slice 1 — short command:** `/kilima-build-wp WP-25 1` — or paste the full prompt:

```
Kilima build session — WP-25, slice 1 of 2: Integrity data and rules.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-25 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-09, KP-SEC-04, KP-LEG-07.
Dependencies that must be merged: WP-18, WP-19.

Goal: `services/integrity`: account link graph (device, IP, payment later), seating restrictions, timing profile, co-occurrence and chip-flow graph.
Done when: Signals computed from staging hands.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-25/1-integrity-data-and-rules; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-25 2` — or paste the full prompt:

```
Kilima build session — WP-25, slice 2 of 2: Case tool and red team.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-25 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-09, KP-SEC-04, KP-LEG-07.
Dependencies that must be merged: WP-18, WP-19.

Goal: Case management with hand replays in the back-office; red-team collusion bot pair in simbots.
Done when: Red-team collusion pair flagged in staging.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-25/2-case-tool-and-red-team; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Open a flagged case and watch the replay.

### WP-26 · Responsible-gaming tools (time limits, reality checks, cool-off, self-exclusion)

**Who:** Claude prepares, you execute or approve · **Team:** TRU + CLI · **Depends on:** WP-07 · **WP done when:** Self-exclusion effective < 60 s

**Read:** KP-LEG-05, KP-PRD-04

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Responsible-gaming tools | Time limits, reality checks, cool-off and self-exclusion enforced across identity, gateway and lobby. | Self-exclusion takes effect in < 60 s (E2E). |

**Slice 1 — short command:** `/kilima-build-wp WP-26 1` — or paste the full prompt:

```
Kilima build session — WP-26, slice 1 of 1: Responsible-gaming tools.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-26 entry in docs/09-handbook/data/beta-path.yaml, and KP-LEG-05, KP-PRD-04.
Dependencies that must be merged: WP-07.

Goal: Time limits, reality checks, cool-off and self-exclusion enforced across identity, gateway and lobby.
Done when: Self-exclusion takes effect in < 60 s (E2E).

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-26/1-responsible-gaming-tools; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Your lawyer or compliance adviser reviews the wording of the screens.

### WP-27 · Localisation EN/FR/PT/SW; help centre; in-app support chat

**Who:** Claude prepares, you execute or approve · **Team:** CLI · **Depends on:** WP-17 · **WP done when:** Language QA passed

**Read:** KP-ENG-15, KP-OPS-07, KP-LEG-07

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Localisation and support | i18n for EN/FR/PT/SW (Claude drafts all strings and help articles), help centre, in-app support chat integration. | All screens translated; support chat reachable from the app. |

**Slice 1 — short command:** `/kilima-build-wp WP-27 1` — or paste the full prompt:

```
Kilima build session — WP-27, slice 1 of 1: Localisation and support.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-27 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-15, KP-OPS-07, KP-LEG-07.
Dependencies that must be merged: WP-17.

Goal: i18n for EN/FR/PT/SW (Claude drafts all strings and help articles), help centre, in-app support chat integration.
Done when: All screens translated; support chat reachable from the app.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-27/1-localisation-and-support; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** A native speaker per language reviews the strings (Claude prepares a review sheet).

### WP-28 · ClickHouse hand store, basic BI dashboards

**Who:** Claude builds, you review and merge · **Team:** DAT · **Depends on:** WP-19 · **WP done when:** Game health dashboard live

**Read:** KP-ENG-16, KP-ENG-05

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Hand store and BI | ClickHouse hand store fed from Kafka, migrations, game-health dashboard (tables, players, hands/hour, rake-equivalent). | Game health dashboard live. |

**Slice 1 — short command:** `/kilima-build-wp WP-28 1` — or paste the full prompt:

```
Kilima build session — WP-28, slice 1 of 1: Hand store and BI.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-28 entry in docs/09-handbook/data/beta-path.yaml, and KP-ENG-16, KP-ENG-05.
Dependencies that must be merged: WP-19.

Goal: ClickHouse hand store fed from Kafka, migrations, game-health dashboard (tables, players, hands/hour, rake-equivalent).
Done when: Game health dashboard live.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-28/1-hand-store-and-bi; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Look at the dashboard.

### ALPHA · Internal Alpha (you)

**Who:** Only you (a person) can do this

- Publish the Android build to a Google Play internal/closed testing track (Claude prepares the store listing and the signed build pipeline).
- Invite up to 200 players; run scheduled tournaments for two weeks.
- Collect crashes and feedback; hand them to Claude in the sprint review session.

**Done when:** Two weeks of Alpha with crash-free sessions measured.

> **Checkpoint S5:** Alpha running with invited players. Run the sprint review.

## Stage S6 — Beta hardening and G1

Load, security, operations and polish until every G1 checklist item has evidence — then open the Play Money Beta.

### WP-30 · Load, soak, spike and chaos to Beta targets (KP-QA-04)

**Who:** Claude builds, you review and merge · **Team:** SRE + GAM · **Depends on:** Alpha · **WP done when:** Reports pass NFR Beta targets

**Read:** KP-QA-04, KP-ENG-10

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Load and soak | k6 + simbots load, soak and spike tests to the Beta targets of KP-ENG-10; fixes for bottlenecks found. | Load and soak reports meet Beta targets. |
| 2 | Chaos | Chaos experiments (pod kills, AZ loss simulation, Kafka and Redis failures) with expected behaviour documented. | Chaos report passes. |

**Slice 1 — short command:** `/kilima-build-wp WP-30 1` — or paste the full prompt:

```
Kilima build session — WP-30, slice 1 of 2: Load and soak.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-30 entry in docs/09-handbook/data/beta-path.yaml, and KP-QA-04, KP-ENG-10.
No work-package dependencies.

Goal: k6 + simbots load, soak and spike tests to the Beta targets of KP-ENG-10; fixes for bottlenecks found.
Done when: Load and soak reports meet Beta targets.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-30/1-load-and-soak; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-30 2` — or paste the full prompt:

```
Kilima build session — WP-30, slice 2 of 2: Chaos.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-30 entry in docs/09-handbook/data/beta-path.yaml, and KP-QA-04, KP-ENG-10.
No work-package dependencies.

Goal: Chaos experiments (pod kills, AZ loss simulation, Kafka and Redis failures) with expected behaviour documented.
Done when: Chaos report passes.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-30/2-chaos; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Read the summary table of the reports.

### WP-31 · Edge: CDN/WAF, DDoS, WebSocket proxying, African PoPs; RTT measurement per country

**Who:** Claude prepares, you execute or approve · **Team:** SRE · **Depends on:** WP-11 · **WP done when:** RTT dashboard per country

**Read:** KP-SEC-03, KP-OPS-01, KP-ENG-10

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Edge and latency | CDN/WAF, DDoS protection, WebSocket proxying, African points of presence, RTT measurement per country dashboard. | RTT dashboard per country. |

**Slice 1 — short command:** `/kilima-build-wp WP-31 1` — or paste the full prompt:

```
Kilima build session — WP-31, slice 1 of 1: Edge and latency.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-31 entry in docs/09-handbook/data/beta-path.yaml, and KP-SEC-03, KP-OPS-01, KP-ENG-10.
Dependencies that must be merged: WP-11.

Goal: CDN/WAF, DDoS protection, WebSocket proxying, African points of presence, RTT measurement per country dashboard.
Done when: RTT dashboard per country.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-31/1-edge-and-latency; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** You approve the CDN vendor and its cost.

### WP-32 · Rewards (Play), missions, leaderboards, clubs (Play)

**Who:** Claude builds, you review and merge · **Team:** PLT + CLI · **Depends on:** WP-18 · **WP done when:** Missions claimable in app

**Read:** KP-PRD-05, KP-FIN-04

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Rewards and missions | Play Money rewards, missions, leaderboards and clubs (Play). | Missions claimable in the app. |

**Slice 1 — short command:** `/kilima-build-wp WP-32 1` — or paste the full prompt:

```
Kilima build session — WP-32, slice 1 of 1: Rewards and missions.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-32 entry in docs/09-handbook/data/beta-path.yaml, and KP-PRD-05, KP-FIN-04.
Dependencies that must be merged: WP-18.

Goal: Play Money rewards, missions, leaderboards and clubs (Play).
Done when: Missions claimable in the app.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-32/1-rewards-and-missions; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** Merge.

### WP-33 · Security: pentest of external surface, threat-model review, fixes

**Who:** Claude prepares, you execute or approve · **Team:** SRE · **Depends on:** Alpha · **WP done when:** No open high findings

**Read:** KP-SEC-01, KP-SEC-03, KP-HBK-18

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Threat-model review and internal scan | Update the threat model for what was built, run dependency, container and DAST scans, fix findings. | No open high findings from internal scans. |
| 2 | External pentest fixes | Fix the findings of the external pentest report. | No open high findings. |

**Slice 1 — short command:** `/kilima-build-wp WP-33 1` — or paste the full prompt:

```
Kilima build session — WP-33, slice 1 of 2: Threat-model review and internal scan.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-33 entry in docs/09-handbook/data/beta-path.yaml, and KP-SEC-01, KP-SEC-03, KP-HBK-18.
No work-package dependencies.

Goal: Update the threat model for what was built, run dependency, container and DAST scans, fix findings.
Done when: No open high findings from internal scans.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-33/1-threat-model-review-and-internal-scan; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

**Slice 2 — short command:** `/kilima-build-wp WP-33 2` — or paste the full prompt:

```
Kilima build session — WP-33, slice 2 of 2: External pentest fixes.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-33 entry in docs/09-handbook/data/beta-path.yaml, and KP-SEC-01, KP-SEC-03, KP-HBK-18.
No work-package dependencies.

Goal: Fix the findings of the external pentest report.
Done when: No open high findings.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-33/2-external-pentest-fixes; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** You hire the external pentest firm (Claude writes the scope document).

### WP-34 · Support and game-ops runbooks rehearsed; on-call rotation

**Who:** Claude prepares, you execute or approve · **Team:** SRE · **Depends on:** WP-08 · **WP done when:** KP-OPS-06 G1 operations items done

**Read:** KP-OPS-03, KP-OPS-04, KP-OPS-07, KP-HBK-19

@widths 0.3,1.3,2.2,1.6
| # | Slice | Goal | Done when |
|---|---|---|---|
| 1 | Runbooks and rehearsal | Runbooks for every alert, incident drill scripts, support macros and game-ops procedures. | One incident drill rehearsed and written up. |

**Slice 1 — short command:** `/kilima-build-wp WP-34 1` — or paste the full prompt:

```
Kilima build session — WP-34, slice 1 of 1: Runbooks and rehearsal.

Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the WP-34 entry in docs/09-handbook/data/beta-path.yaml, and KP-OPS-03, KP-OPS-04, KP-OPS-07, KP-HBK-19.
Dependencies that must be merged: WP-08.

Goal: Runbooks for every alert, incident drill scripts, support macros and game-ops procedures.
Done when: One incident drill rehearsed and written up.

Work the Kilima way (CLAUDE.md, Session contract):
1. Confirm the dependencies are merged; if not, stop and tell me.
2. Show me a short plan (files, tests, risks, questions) and wait for my OK.
3. Build on branch wp-34/1-runbooks-and-rehearsal; run lint, typecheck and tests.
4. Open the PR and finish with the session report (summary for me in Hebrew); add it to the top of docs/delivery/progress-log.md.
```

> **You check:** You name the people on the on-call and support rotations.

### G1 · G1 gate review and Beta launch

**Who:** Claude prepares, you execute or approve

- Run the gate check session (kilima-gate-check G1) — Claude collects the evidence for every G1 item and ticks it in the Delivery hub.
- You and your advisers sign the legal items; you take the go/no-go decision.
- Promote the build to the open testing track — Play Money Beta is live.

**Done when:** All 13 G1 items ticked with evidence.

> **Checkpoint S6:** Play Money Beta is live.


# 10. Rhythm

@widths 1.2,3.8
| When | What |
|---|---|
| Every working day | One to three build sessions; merge finished PRs; 5 minutes on the hub Overview |
| Every second Friday | `/kilima-sprint-review` in the project — hub synced, summary, next sprint agreed |
| End of every stage | Checkpoint demo (you try it yourself) + sprint review |
| Before Alpha and Beta | `/kilima-gate-check G1` — evidence collected, gaps become WPs or slices |
| Monthly | Risk review on the hub's Risk tracker |

# Appendix A — CLAUDE.md

Put this file at the root of the repository (step SETUP-2 does it). It is the fixed architecture contract.

```
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
```

# Appendix B — Session Report Template

```
## {date} — {WP} slice {n}: {title}   (PR #{number})
Summary for the product owner (Hebrew): 2–4 sentences — what now works.
Built:        main files and packages
Tested:       commands run and results with numbers (e.g. "412 vectors pass, 10^6 hands, 0 errors")
Done when:    met / not met — evidence
Decisions:    small decisions taken (also in docs/delivery/decisions.md)
Open:         what is left, known issues
Needs you:    anything you must do or decide
Next:         the next slice or WP that is now ready
Hub:          {WP} → status, progress %
```

# Appendix C — Progress Log

`docs/delivery/progress-log.md` holds every session report, newest first. It is the memory between sessions and the input to the sprint review, which reads it and updates the Delivery hub (status, progress, notes) so the site always matches the repository.
