# @kilima/engine-poker

The pure poker engine (KP-ENG-06, KP-HBK-11). **Certified scope** — changes to evaluation, dealing order, pots or rake need a certification impact assessment (KP-ENG-13 §7). No I/O, clock or randomness: the `kilima/no-io-in-engine` lint rule enforces it.

Status: WP-05 complete — cards; Hold'em, Omaha 4/5/6 and Short Deck evaluation; exhaustive frequency self-check; differential test against the reference. Betting and pots follow in WP-06.

| Module             | What                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------- |
| `cards.ts`         | Card id `rank * 4 + suit` (0–51), parse/format `"Ah"`, `DECK_52`, `DECK_36`               |
| `rules/ranking.ts` | Categories and their order: `standard`, `shortdeck_trips` (default), `shortdeck_straight` |
| `eval/five.ts`     | `evaluate5` → one comparable integer (`strength << 24 \| category << 20 \| tiebreak`)     |
| `eval/best.ts`     | `bestOfAny` (best five of 5–7 cards), `evaluateHoldem`, `winners`                         |

`best5` reproduces `poker_reference.py` exactly (same combination order, first strictly best kept). The vectors file lists `best5` in a readable order and is compared as a set, as the reference itself does.

Commands: `pnpm vectors` (vectors + exhaustive 52/36-card frequencies), `pnpm --filter @kilima/engine-poker differential [count] [seed]` (default 100,000 random hands vs `poker_reference.py`, needs `python3`), `pnpm --filter @kilima/engine-poker test`, `pnpm --filter @kilima/engine-poker bench`.
