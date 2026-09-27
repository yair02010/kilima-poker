---
id: KP-HBK-14
title: Git, Pull Requests and Code Review
subtitle: Branching, commits, PR size and description, review etiquette and merge rules
version: 1.0
owner: CTO
status: Approved
related: KP-ENG-11 §4–5 · KP-QA-02 §3 PR Checklist
---

# 1. Branching

Trunk-based. Branch from `main`, merge back within 1–2 days. Names: `feat/KP-123-quick-seat`, `fix/KP-456-rit-odd-chip`, `chore/…`, `docs/…`. Unfinished work is merged behind a feature flag, not kept on a long branch.

# 2. Commits

Conventional Commits: `feat(lobby): add quick seat`, `fix(engine): odd chip goes left of button`, `docs(eng-06): clarify straddle`. Scope = package or service. Breaking changes add `!` and a `BREAKING CHANGE:` footer.

# 3. Pull Requests

- Target under 400 changed lines; split refactors from behaviour changes.
- Description: what and why, link the ticket/RFC, how to test, screenshots for UI, risk class.
- Use the PR template checklist (money, certified scope, contracts, telemetry, docs).
- Draft PRs are welcome early for direction.

# 4. Review

@widths 1.6,3.4
| As an author | As a reviewer |
|---|---|
| Self-review the diff first | Respond the same working day |
| Keep the PR small and focused | Review correctness, tests, security, contracts, operability — then style |
| Answer every comment | Mark comments as `blocking:` or `nit:` |
| Do not merge with unresolved blocking comments | Approve when it is good enough and safe, not perfect |
| Request the right reviewers (CODEOWNERS adds some automatically) | For critical code, run it locally or in the preview |

Disagreements go to the component tech lead after two rounds; do not argue for days in comments.

# 5. Merge Rules

Squash-merge; required checks green; approvals per KP-ENG-11 §5; signed commits; linear history. The merge commit title is the Conventional Commit used for changelogs.

# 6. Pairing and Mob Review

For critical changes (engine rules, postings, auth), a 30-minute walkthrough with the second approver often replaces long comment threads. Record the outcome in the PR.
