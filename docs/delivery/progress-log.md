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

## 2026-09-29 — Fix: reference defects R1 and R2   (PR pending)
Summary for the product owner (Hebrew): לפי אישורך תיקנתי את שני מקרי הקצה במימוש הייחוס ב-Python: ראש בראש, דילר שנכנס all-in מהבליינד כבר לא מקבל תור; ו-all-in כשמותר רק להשוות נדחה. קובץ הווקטורים נוצר מחדש ויצא זהה לגמרי, והמנוע לא השתנה. ההשוואה בין המנוע לייחוס רצה עכשיו על כל הידיים בלי שום החרגה – אפס הבדלים.
Built:        docs/03-engineering/reference/poker_reference.py (_first_preflop heads-up skips an all-in button; act("allin") without a raise option only as a call for the whole stack; two regression asserts in the self-check); engine betting differential without exclusions
Tested:       python3 poker_reference.py (full: 2,598,960-hand frequency self-check, all vectors, regression asserts) ✓ — test_vectors.json byte-identical · betting differential 20,000 hands / 180,311 actions, 0 excluded, 0 mismatches · settlement 20,000 and evaluation 100,000 hands 0 mismatches · 112 engine tests ✓
Done when:    met — reference agrees with KP-ENG-06 and the engine on every generated hand
Decisions:    R1/R2 resolved (decisions.md); certification impact: reference only, vectors unchanged
Open:         second review of the reference change when an engineer joins (certified scope)
Needs you:    push, PR, merge
Next:         Stage S1 sprint review, then S2
Hub:          WP-06 note updated

## 2026-09-29 — WP-06 slice 3: Property tests at scale   (PR pending)
Summary for the product owner (Hebrew): הרצנו מיליון ידיים אקראיות בכל המשחקים ובכל ההגדרות (2–9 שחקנים, NL/PL, אנטה, rake, סטאקים קצרים) ובדקנו אחרי כל פעולה: אף צ'יפ לא נוצר ולא נעלם, אין יתרה שלילית, רק פעולות חוקיות מתקבלות (2.4 מיליון ניסיונות לא חוקיים – כולם נדחו), כל יד מסתיימת, אין קלף כפול, קופה לא הולכת למי שקיפל, וה-rake תמיד בגבולות. אפס הפרות. זמן פעולה: p99 כ-5.6 מיקרו-שניות (התקציב 20). עם זה WP-06 ושלב המנוע (S1) גמורים.
Built:        test/property/invariants.ts (random hand generator + 14 invariants), quick profile test (5,000 hands in pnpm test), test/property/run.ts (`property` script, latency p50/p99, JSON report), .github/workflows/nightly.yml (10^6 hands + full differential + bench, nightly and on demand), docs/delivery/reports/wp-06-property-1e6.{md,json}
Tested:       10^6 random hands (seeds 1–1,000,000): nlhe 374,692 · plo4 250,377 · plo5 125,789 · plo6 124,519 · short deck 124,623; 882,737 showdowns; 9,518,030 legal actions; 2,380,030 illegal attempts rejected; 0 invariants broken; applyAction p50 ≤ 1.24 µs, p99 ≤ 5.62 µs (budget 20 µs); 368 s on the 2-vCPU build VM · 112 engine tests · lint ✓ typecheck ✓ · actionlint ✓
Done when:    met — 10^6-hand run green; report attached (docs/delivery/reports/wp-06-property-1e6.md)
Decisions:    nightly vs PR profile; latency sampling
Open:         reference defect R1 fix (needs approval); run-it-twice, straddle, button blind with table configuration
Needs you:    push, PR, merge; after merging, the Nightly engine workflow can also be started from the Actions tab (Run workflow)
Next:         Stage S1 checkpoint — sprint review; then S2: WP-04 contracts, WP-03 local stack, identity, wallet, rng, gateway, table-server
Hub:          WP-06 → Done, 100%

## 2026-09-29 — WP-06 slice 2: Pots, rake and showdown   (PR pending)
Summary for the product owner (Hebrew): המנוע משחק עכשיו יד שלמה עד הסוף: מחזיר הימור שאף אחד לא השווה, בונה קופה ראשית וקופות צד כשיש all-in בגדלים שונים, לוקח rake לפי אחוז עם תקרה (ובלי rake אם אין פלופ), מכריע מי ניצח בכל קופה, מחלק תיקו כולל יחידה אי-זוגית לשחקן הראשון משמאל לדילר, ומחשב את היתרות הסופיות. כל וקטורי הקופות וה-rake עוברים, ו-20,000 ידיים שלמות תואמות למימוש הייחוס עד היחידה האחרונה.
Built:        packages/engine-poker/src/hand/pots.ts (returnUncalled, buildPots, computeRake, distribute), src/hand/result.ts (handResult, show order, mustShow); TableConfig.rake and straightBeatsTrips; pots/rake vectors harness; settlement differential (Python bridge)
Tested:       engine-vectors: 3/3 pots + 3/3 rake/distribution vectors ✓ (all 41 vectors in test_vectors.json except spin now pass) · 111 engine tests (fold-out no rake + uncalled return, showdown with rake, split with odd unit, side pots with all-ins and exposure, river-aggressor show order) · settlement differential: 20,000 random finished hands (17,755 showdowns; nlhe, plo4, plo5, short deck ± straightBeatsTrips; with/without rake and antes) → 0 mismatches in returned, pots, rake per pot and amounts won; chips conserved in every hand · evaluation 100,000 and betting 19,889 hands still 0 mismatches
Done when:    met — all pot, rake and odd-chip vectors pass
Decisions:    3 entries (show rules, rake config per hand, JSON-number harness override)
Open:         10^6-hand property profile and latency budget report (slice 3); spin paytable vector (tournaments WP)
Needs you:    push, PR, green, merge; approval for reference defect R1 fix still open
Next:         WP-06 slice 3 — Property tests at scale
Hub:          WP-06 → In progress, 67%

## 2026-09-29 — WP-06 slice 1: Hand state machine and legality   (PR pending)
Summary for the product owner (Hebrew): המנוע יודע עכשיו לנהל יד שלמה: מיקומים ודילר, בליינדים ואנטה, חלוקת קלפים לפי הסדר הנכון, סבבי הימורים ברחובות (פלופ, טרן, ריבר), תור נכון (כולל ראש בראש), מה מותר לכל שחקן (NL ו-PL, רייז מינימלי, all-in קצר שלא פותח מחדש), ריצה אוטומטית של הלוח כשכולם all-in, וטיימאאוט. כל 7 וקטורי ההימורים עוברים, ו-20,000 ידיים אקראיות תואמות למימוש הייחוס בכל צעד. מצאתי שני מקרי קצה שבהם מימוש הייחוס טועה – המנוע פועל לפי המסמכים, וצריך את אישורך לתקן את הייחוס.
Built:        packages/engine-poker/src/hand (types.ts, hand.ts): createHand, legalActions, applyAction, timeout, potTotal, isComplete; betting vectors harness; betting differential (Python bridge to poker_reference.Hand); benchmark for apply()
Tested:       engine-vectors: 7/7 betting-legality vectors ✓ · 98 engine tests (positions and gaps, dealing order incl. heads-up, antes/short stacks, streets with burns, fold-out, all-in run-out, heads-up post-flop order, min bet/raise, PL all-in cap, errors leave state unchanged, immutability, timeouts; fast-check 1,000 random hands: chips conserved, no negative stacks, unique cards, always terminates) · betting differential: 19,889 random hands / 180,206 actions vs poker_reference.Hand → 0 mismatches (111 skipped: reference defect R1) · evaluation differential still 0/100,000 · apply() ≈ 1.2 µs per action (budget 20 µs)
Done when:    met — all betting-legality vectors pass
Decisions:    5 entries (reference defect R1, all-in without raise option, bet vs raise, player-count table, optional table features later)
Open:         pots, uncalled bets, rake, showdown and awarding (slice 2); 10^6-hand property run (slice 3)
Needs you:    approve fixing reference defect R1 (and the all-in semantics) in poker_reference.py — certified scope, second review
Next:         WP-06 slice 2 — Pots, rake and showdown
Hub:          WP-06 → In progress, 33%

## 2026-09-28 — WP-05 slice 3: Frequency self-check and differential test   (PR pending)
Summary for the product owner (Hebrew): המעריך נבדק על כל 2,598,960 הידיים האפשריות בחפיסה רגילה ועל כל 376,992 הידיים ב-Short Deck – הספירה לכל קטגוריה זהה בדיוק לטבלה הרשמית. בנוסף, 100,000 ידיים אקראיות בכל המשחקים הושוו למימוש הייחוס ב-Python – אפס הבדלים. שתי הבדיקות רצות אוטומטית ב-CI. חבילת WP-05 (מעריך הידיים) הושלמה.
Built:        test/vectors/frequency.test.ts; test/differential (reference_bridge.py, differential.ts, run.ts, quick-profile test); `differential` script; CI step "Engine differential"
Tested:       52-card: 2,598,960 hands, all 9 category counts equal KP-HBK-11/test_vectors (0.8 s) · 36-card: 376,992 hands equal (flush 480, full house 1,728) · differential 100,000 hands (nlhe 40k, shortdeck 15k + 5k straightBeatsTrips, plo4 20k, plo5 10k, plo6 10k; seed 20260928) → 0 mismatches in category and exact best5 (19.9 s) · 65 engine tests · lint ✓ typecheck ✓
Done when:    met — frequencies match exactly; differential test shows zero mismatches
Decisions:    reference bridge at test time; quick vs full profile
Open:         second independent open-source evaluator for the differential test (KP-HBK-11 §4) — not in this slice's goal
Needs you:    push, PR, green, merge
Next:         WP-06 slice 1 — Hand state machine and legality (critical path); WP-04 can run in parallel
Hub:          WP-05 → Done, 100%

## 2026-09-28 — WP-05 slice 2: Omaha and Short Deck   (PR pending)
Summary for the product owner (Hebrew): המנוע מעריך עכשיו גם Omaha (4, 5 ו-6 קלפים – בדיוק שניים מהיד ושלושה מהלוח) ו-Short Deck (צבע מנצח פול האוס, שלישייה מנצחת רצף, A-6-7-8-9 הרצף הנמוך), כולל האפשרות לשולחנות שבהם רצף מנצח שלישייה. כל 28 וקטורי ההערכה וההשוואה בקובץ הרשמי עוברים, ו-20,000 ידיים אקראיות תואמות למימוש הייחוס בלי אף הבדל.
Built:        packages/engine-poker: eval/omaha.ts, eval/game.ts (evaluateHand, HOLE_CARDS, rankingRuleFor); vectors harness now runs every game; bench adds PLO6
Tested:       engine-vectors: 20/20 evaluation + 8/8 comparison vectors ✓ (no todo left) · 62 engine tests (Omaha two-plus-three rule, flop/turn, sizes; Short Deck order, A-6-7-8-9, straightBeatsTrips option, rank check) · ad-hoc differential vs poker_reference.py: 4,000 hands each for plo4, plo5, plo6, shortdeck, shortdeck+straightBeatsTrips → 0 mismatches (category and exact best5) · bench: NLHE 9-player ≈ 43 µs (budget 50), PLO6 6-player ≈ 164 µs (budget 2 ms)
Done when:    met — all Omaha and Short Deck vectors pass
Decisions:    best5 compared as a set in the harness (as the reference does)
Open:         exhaustive frequency self-check and committed differential test (slice 3)
Needs you:    push, open the PR, wait for green, merge
Next:         WP-05 slice 3 — Frequency self-check and differential test
Hub:          WP-05 → In progress, 67%

## 2026-09-28 — WP-05 slice 1: Cards and Hold'em evaluator   (PR pending)
Summary for the product owner (Hebrew): התחלנו את מנוע הפוקר. יש ייצוג קלפים וחפיסות (52 ו-36), ומעריך ידיים ל-Hold'em שמוצא את חמשת הקלפים הטובים ביותר מתוך 7 ומשווה בין שחקנים. כל וקטורי ה-Hold'em מהקובץ הרשמי עוברים, ובבדיקה מול מימוש הייחוס ב-Python על 20,000 ידיים אקראיות – אפס הבדלים. זמן: כ-40 מיקרו-שניות ל-showdown של 9 שחקנים (התקציב 50).
Built:        packages/engine-poker: cards.ts, rules/ranking.ts, eval/five.ts, eval/best.ts, index.ts, README, bench/evaluate.bench.ts; test/vectors harness (`pnpm vectors`, CI step "Engine vectors")
Tested:       engine-vectors: 10/10 Hold'em evaluation vectors (category + exact best5) and 5/5 Hold'em comparison vectors ✓ (10 Omaha/Short Deck evaluation + 3 comparison vectors pending, marked todo for slice 2) · 39 engine tests incl. fast-check properties (order invariance, best ≥ any subset, suit symmetry; 2,000 runs each) · ad-hoc differential run: 20,000 random 7-card hands vs poker_reference.py → 0 mismatches in category and best5 · bench ≈ 4.5 µs per 7-card hand · pnpm lint ✓ typecheck ✓ · all 180 tests green
Done when:    met — all Hold'em evaluation and comparison vectors pass
Decisions:    4 entries in docs/delivery/decisions.md (combinatorial evaluator within budget, value encoding, import style, stacked branch)
Open:         Omaha and Short Deck vectors (slice 2); exhaustive frequency and committed differential test (slice 3)
Needs you:    push; merge WP-01 PRs first, then this one
Next:         WP-05 slice 2 — Omaha and Short Deck
Hub:          WP-05 → In progress, 33%

## 2026-09-28 — WP-01 slice 3: CI pipeline   (PR pending)
Summary for the product owner (Hebrew): נבנה תהליך CI ב-GitHub Actions שרץ על כל PR ועל main: בדיקות סטטיות (כולל ששת כללי Kilima), בדיקות יחידה, בדיקות התיעוד, סריקת סודות ותלויות, ובניית image לשירות הדוגמה – עם בדיקת עשן, סריקת Trivy, ‏SBOM, חתימת cosign ו-provenance. ה-image נשמר ב-GHCR. אחרי ה-push תראה ב-PR חמישה checks; צריך רק להפעיל הגנה על main.
Built:        .github/workflows/ci.yml (jobs: Static checks, Unit tests, Dossier checks, Security, Image (sample)); tools/build-service.ts (esbuild bundle); services/sample/Dockerfile (distroless Node 24 (Debian 13), non-root) + .dockerignore; `pnpm build` via Turborepo; tools/requirements-docs.txt
Tested:       actionlint 1.7.12 ✓ · pnpm lint ✓ · typecheck ✓ · 141 tests ✓ · pnpm audit --prod: 0 known vulnerabilities · bundle runs alone from an empty folder (no node_modules): /healthz 200, SIGTERM → exit clean · Docker build steps rehearsed locally (frozen install with filters + bundle) — the real image build runs first in GitHub Actions (no Docker in the build VM)
Done when:    pending — needs the first run on GitHub: all checks green and a signed image in GHCR
Decisions:    6 entries in docs/delivery/decisions.md (bundle + distroless, GHCR until ECR, publish on same-repo PRs, keyless signing + SBOM + provenance, stages deferred, docs tool deps)
Open:         integration/contract/Semgrep stages when there is something to check; root .github CODEOWNERS and PR template for code
Needs you:    push the branch, open the PR; after it is green, turn on branch protection for main (checklist in the session reply)
Next:         WP-04 slice 1 — Contracts package (and WP-05 slice 1 can run in parallel)
Hub:          WP-01 → In review, 100% once CI is green

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
