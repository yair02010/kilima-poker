# @kilima/engine-poker

The pure poker engine (KP-ENG-06, KP-HBK-11). **Certified scope** — changes to evaluation, dealing order, pots or rake need a certification impact assessment (KP-ENG-13 §7). No I/O, clock or randomness: the `kilima/no-io-in-engine` lint rule enforces it.

Status: WP-05 slice 1 — cards and Hold'em evaluation. Omaha and Short Deck (slice 2), frequency and differential tests (slice 3), betting and pots (WP-06) follow.

| Module             | What                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `cards.ts`         | Card id `rank * 4 + suit` (0–51), parse/format `"Ah"`, `DECK_52`, `DECK_36`               |
| `rules/ranking.ts` | Categories and their order: `standard`, `shortdeck_trips` (default), `shortdeck_straight` |
| `eval/five.ts`     | `evaluate5` → one comparable integer (`strength << 24 \| category << 20 \| tiebreak`)     |
| `eval/best.ts`     | `bestOfAny` (best five of 5–7 cards), `evaluateHoldem`, `winners`                         |

`best5` reproduces the reference exactly: combinations are visited in lexicographic order over `hole ++ board` and the first strictly best one is kept.

Commands: `pnpm vectors` (all supported vectors in `docs/03-engineering/reference/test_vectors.json`), `pnpm --filter @kilima/engine-poker test`, `pnpm --filter @kilima/engine-poker bench`.
