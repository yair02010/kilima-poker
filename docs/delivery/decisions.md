# Session Decisions

Small decisions taken during build sessions that do not need an ADR (KP-HBK-23 §5.2). Newest first. Anything that changes the fixed architecture in CLAUDE.md needs an ADR instead (KP-HBK-04).

| Date | WP / slice | Decision | Why | Revisit when |
|---|---|---|---|---|
| 2026-09-27 | SETUP-2/1 | The dossier's own `.github/` (CODEOWNERS, PR and issue templates) stays inside `docs/.github/` unchanged; the repository-level `.github/` is created in WP-01 with CI. | CODEOWNERS paths are relative to the dossier root, and the slice forbids changing document content. GitHub ignores `.github/` below the root. | WP-01 slice 3 (CI pipeline) |
| 2026-09-27 | SETUP-2/1 | Imported only git-tracked dossier files; generated `dist/` (PDFs) and `site/` are not committed and are ignored. | They are build output of `docs/tools/build.py` and `build_site.py`. | — |
| 2026-09-27 | SETUP-2/1 | Repository created locally first (`git init`, branch `main`); GitHub remote is added when SETUP-1 is complete. | No GitHub organisation yet. | SETUP-1 done |
| 2026-09-27 | SETUP-2/1 | Added `.gitattributes` forcing LF line endings. | Product owner works on Windows; avoids CRLF churn in diffs and scripts. | — |
