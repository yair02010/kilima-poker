#!/usr/bin/env python3
"""Generate KP-HBK-23 "Building with Claude — Path to Beta" from 09-handbook/data/beta-path.yaml
and 09-handbook/data/CLAUDE.md, and expose the same data (with ready-made prompts) to the site.

    python3 tools/make_playbook.py      → 09-handbook/23-build-with-claude.md
"""
import os, re, sys, yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "09-handbook", "data")
OUT = os.path.join(ROOT, "09-handbook", "23-build-with-claude.md")
sys.path.insert(0, os.path.join(ROOT, "tools"))

WHO = {"claude": "Claude builds, you review and merge", "you": "Only you (a person) can do this",
       "both": "Claude prepares, you execute or approve"}
WHO_SHORT = {"claude": "Claude", "you": "You", "both": "Both"}


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")[:40]


def wp_titles():
    import work_seed
    return {w["code"]: w for w in work_seed.work_packages()}


def load():
    d = yaml.safe_load(open(os.path.join(DATA, "beta-path.yaml"), encoding="utf-8"))
    wps = wp_titles()
    for st in d["stages"]:
        for step in st["steps"]:
            if "wp" in step:
                w = wps[step["wp"]]
                step["id"] = step["wp"]
                step["title"] = w["title"]
                step["teams"] = w["teams"]
                step["dependsOn"] = w["dependsOn"]
                step["dependsNote"] = w["dependsNote"]
                step["doneWhen"] = w["doneWhen"]
            step["stage"] = st["id"]
            for n, sl in enumerate(step.get("slices", []), 1):
                sl["n"] = n
                sl["prompt"] = full_prompt(step, sl)
                sl["short"] = f"/kilima-build-wp {step['id']} {n}"
    return d


def full_prompt(step, sl):
    code = step["id"]
    total = len(step["slices"])
    reads = ", ".join(step.get("read", []))
    deps = step.get("dependsOn") or []
    dep_line = ("Dependencies that must be merged: " + ", ".join(deps) + ".") if deps else "No work-package dependencies."
    num = re.sub(r"\D", "", code) or "00"
    branch = f"wp-{num}/{sl['n']}-{slug(sl['title'])}" if code.startswith("WP-") else f"{code.lower()}/{slug(sl['title'])}"
    extra = ("\n" + step["prompt_extra"]) if step.get("prompt_extra") else ""
    return (f"Kilima build session — {code}, slice {sl['n']} of {total}: {sl['title']}.\n\n"
            f"Read first: CLAUDE.md, the top of docs/delivery/progress-log.md, the {code} entry in "
            f"docs/09-handbook/data/beta-path.yaml, and {reads}.\n"
            f"{dep_line}\n\n"
            f"Goal: {sl['goal']}\n"
            f"Done when: {sl['done']}{extra}\n\n"
            f"Work the Kilima way (CLAUDE.md, Session contract):\n"
            f"1. Confirm the dependencies are merged; if not, stop and tell me.\n"
            f"2. Show me a short plan (files, tests, risks, questions) and wait for my OK.\n"
            f"3. Build on branch {branch}; run lint, typecheck and tests.\n"
            f"4. Open the PR and finish with the session report (summary for me in Hebrew); "
            f"add it to the top of docs/delivery/progress-log.md.")


INTRO = r"""---
id: KP-HBK-23
title: Building with Claude — Path to Beta
subtitle: How the product owner and Claude build Kilima Poker together, session by session, from an empty repository to the Play Money Beta (G1)
version: 1.0
owner: Product Owner / CTO
status: Living document — generated from 09-handbook/data/beta-path.yaml
related: KP-HBK-06 Build Plan · KP-HBK-05 Planning · KP-OPS-06 Gates · KP-ENG-11 Standards · KP-QA-02 Definition of Done
---

# 1. What This Is

KP-HBK-06 lists **what** has to be built. This document says **in which order, who does each step, and exactly what to say to Claude** to get it built — from an empty repository to the Play Money Beta (gate G1, KP-OPS-06 §2). It covers milestones M1–M4: {nwp} work packages cut into {nslices} build sessions, plus the steps only a person can take.

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
{stage_rows}
"""

APPENDIX = r"""
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
{claude_md}
```

# Appendix B — Session Report Template

```
## {{date}} — {{WP}} slice {{n}}: {{title}}   (PR #{{number}})
Summary for the product owner (Hebrew): 2–4 sentences — what now works.
Built:        main files and packages
Tested:       commands run and results with numbers (e.g. "412 vectors pass, 10^6 hands, 0 errors")
Done when:    met / not met — evidence
Decisions:    small decisions taken (also in docs/delivery/decisions.md)
Open:         what is left, known issues
Needs you:    anything you must do or decide
Next:         the next slice or WP that is now ready
Hub:          {{WP}} → status, progress %
```

# Appendix C — Progress Log

`docs/delivery/progress-log.md` holds every session report, newest first. It is the memory between sessions and the input to the sprint review, which reads it and updates the Delivery hub (status, progress, notes) so the site always matches the repository.
"""


def stage_block(st):
    out = [f"## Stage {st['id']} — {st['title']}", "", st["goal"], ""]
    for step in st["steps"]:
        head = f"{step['id']} · {step['title']}"
        out.append(f"### {head}")
        out.append("")
        meta = [f"**Who:** {WHO[step['who']]}"]
        if step.get("teams"):
            meta.append(f"**Team:** {' + '.join(step['teams'])}")
        if "dependsOn" in step:
            deps = ", ".join(step["dependsOn"]) or step.get("dependsNote") or "—"
            meta.append(f"**Depends on:** {deps}")
        if step.get("doneWhen"):
            meta.append(f"**WP done when:** {step['doneWhen']}")
        out.append(" · ".join(meta))
        out.append("")
        if step.get("read"):
            out.append("**Read:** " + ", ".join(step["read"]))
            out.append("")
        if step.get("tasks"):
            for t in step["tasks"]:
                out.append(f"- {t}")
            out.append("")
            if step.get("done"):
                out.append(f"**Done when:** {step['done']}")
                out.append("")
        if step.get("slices"):
            out += ["@widths 0.3,1.3,2.2,1.6", "| # | Slice | Goal | Done when |", "|---|---|---|---|"]
            for sl in step["slices"]:
                g = sl["goal"].replace("|", "\\|")
                out.append(f"| {sl['n']} | {sl['title']} | {g} | {sl['done'].replace('|', chr(92) + '|')} |")
            out.append("")
            for sl in step["slices"]:
                out.append(f"**Slice {sl['n']} — short command:** `{sl['short']}` — or paste the full prompt:")
                out.append("")
                out.append("```")
                out += sl["prompt"].split("\n")
                out.append("```")
                out.append("")
        if step.get("you_verify"):
            out.append(f"> **You check:** {step['you_verify']}")
            out.append("")
    if st.get("checkpoint"):
        out.append(f"> **Checkpoint {st['id']}:** {st['checkpoint']}")
        out.append("")
    return out


def build():
    d = load()
    nwp = sum(1 for st in d["stages"] for s in st["steps"] if s["id"].startswith("WP-"))
    nsl = sum(len(s.get("slices", [])) for st in d["stages"] for s in st["steps"])
    rows = []
    for st in d["stages"]:
        n = sum(len(s.get("slices", [])) for s in st["steps"])
        rows.append(f"| {st['id']} | {st['title']} | {st['goal']} | {n} | {st.get('checkpoint', '')} |")
    md = INTRO.replace("{nwp}", str(nwp)).replace("{nslices}", str(nsl)).replace("{stage_rows}", "\n".join(rows))
    md += "\n"
    for st in d["stages"]:
        md += "\n".join(stage_block(st)) + "\n"
    claude_md = open(os.path.join(DATA, "CLAUDE.md"), encoding="utf-8").read().strip()
    md += APPENDIX.replace("{claude_md}", claude_md).replace("{{", "{").replace("}}", "}")
    open(OUT, "w", encoding="utf-8").write(md)
    print(f"KP-HBK-23: {nwp} work packages, {nsl} sessions → {os.path.relpath(OUT, ROOT)}")
    return d


if __name__ == "__main__":
    build()
