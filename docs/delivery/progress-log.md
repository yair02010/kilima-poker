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

## 2026-09-27 — WP-01 slice 2: Custom lint rules   (PR pending)
Summary for the product owner (Hebrew): ששת כללי ה-lint של Kilima פעילים ומכשילים את הבנייה: כסף כ-number/float, ‏Math.random, ‏I/O או שעון בתוך מנוע המשחק, כתיבה ישירה לטבלאות ה-ledger, קלפים בלוגים, ושאילתה לסכמה של שירות אחר. לכל כלל יש דוגמאות שעוברות ודוגמאות שנכשלות – 113 בדיקות ירוקות, ושירות הדוגמה עובר נקי.
Built:        packages/eslint-plugin-kilima (no-float-money, no-math-random, no-io-in-engine, no-raw-ledger-entries, no-hole-cards-in-logs, no-direct-db-cross-schema; README); root eslint.config.js wires each rule to its folders
Tested:       pnpm test ✓ 141 tests (eslint-plugin 113: 44 valid + 67 invalid fixtures + 2 plugin checks; shared 15; sample 13) · pnpm lint ✓ 0 problems · pnpm typecheck ✓ 3/3 · end-to-end probe files through the real config: all 6 rules fire (then removed)
Done when:    met — each rule has passing and failing fixtures; the sample service passes
Decisions:    4 entries in docs/delivery/decisions.md (TS via Node type stripping, syntactic rules, rule-tester deps, simbots/engine-test exemptions)
Open:         hand-record writer exemption for no-hole-cards-in-logs is added when that writer exists; type-aware money checks after packages/money
Needs you:    push the branch; merge WP-01/1 then this PR
Next:         WP-01 slice 3 — CI pipeline (GitHub Actions)
Hub:          WP-01 → In progress, 67%

## 2026-09-27 — WP-01 slice 1: Workspace skeleton   (PR pending)
Summary for the product owner (Hebrew): שלד ה-monorepo עובד: pnpm + Turborepo, TypeScript strict, ESLint + Prettier ו-Vitest. נוספה ספרייה משותפת (לוגר שמסתיר סיסמאות, טלפונים וקלפים; קונפיגורציה שנכשלת מיד אם חסר ערך; שגיאות סטנדרטיות) ושירות דוגמה עם בדיקות בריאות, גרסה ומטריקות וכיבוי מסודר. כל הבדיקות ירוקות.
Built:        root workspace (package.json, pnpm-workspace.yaml, turbo.json, tsconfig.base.json, eslint.config.js, .prettierrc.json, vitest.config.ts); packages/shared (logger, config, errors); services/sample (KP-HBK-07 layout: main.ts, config.ts, http/, domain/readiness.ts, shutdown.ts)
Tested:       pnpm install ✓ · pnpm lint ✓ (0 problems, Prettier clean) · pnpm typecheck ✓ (2/2 packages) · pnpm test ✓ 28 tests (shared 15, sample 13) · pnpm dev → /healthz 200, /readyz 200, /version 200, /metrics on :9464 with http_requests_total · SIGTERM → draining → shutdown complete, exit 0
Done when:    met — install, lint, typecheck and test pass; pnpm dev starts the sample service
Decisions:    6 entries in docs/delivery/decisions.md (TS 5.9, source-exported packages + tsx, prom-client on internal port, lint baseline, `code` redaction scope, stacked branch)
Open:         Kilima custom lint rules (slice 2); CI, container image and production build (slice 3)
Needs you:    merge the SETUP-2 PR, then this PR (base: main)
Next:         WP-01 slice 2 — Custom lint rules
Hub:          WP-01 → In progress, 33%

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
