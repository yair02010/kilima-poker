# Progress Log

What has been done, newest first. Every build session adds one entry at the top, in the same PR (CLAUDE.md, Session contract). Read the top entries at the start of every session.

<!-- Template — KP-HBK-23 Appendix B
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
-->

## 2026-09-27 — SETUP-2 slice 1: Import the dossier and install the architecture contract   (PR pending — no GitHub remote yet)
Summary for the product owner (Hebrew): נוצר ריפו הקוד kilima-poker. כל התיק (128 קבצים) הועתק ל-docs/ בלי שינוי תוכן — אומת בהשוואת SHA-1 לכל קובץ. CLAUDE.md, יומן ההתקדמות וקובץ ההחלטות במקומם. הריפו מקומי בלבד עד שתקים את GitHub (SETUP-1).
Built:        docs/ (dossier, 128 tracked files; dist/ and site/ excluded), CLAUDE.md (identical to docs/09-handbook/data/CLAUDE.md = KP-HBK-23 Appendix A), .tool-versions, .editorconfig, .gitattributes, .gitignore, README.md, docs/delivery/progress-log.md, docs/delivery/decisions.md
Tested:       sha1sum of all 128 files identical to kilima-poker-docs; CLAUDE.md identical to Appendix A source; python3 docs/tools/check_references.py → "78 documents, 18 ADRs, 99 files checked — OK"
Done when:    partly met — branch ready with docs/, CLAUDE.md and the delivery log; "merged PR on main" waits for the GitHub remote
Decisions:    4 entries in docs/delivery/decisions.md (docs/.github kept in place, generated output excluded, local-first repo, LF endings)
Open:         push to GitHub and open the PR
Needs you:    SETUP-1 — create the GitHub organisation and private repo kilima-poker, then tell me; review and merge the PR
Next:         WP-01 slice 1 — Workspace skeleton (needs Node 24 + pnpm)
Hub:          SETUP-2 → In review, 90%
