/**
 * Differential test (KP-ENG-06 §13, KP-HBK-11 §4): random hands evaluated by the engine and by
 * poker_reference.py must agree on category and on the exact five cards.
 * Deterministic: a seeded generator (not game randomness) so failures reproduce.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  type Card,
  DECK_36,
  DECK_52,
  evaluateHand,
  formatCards,
  type Game,
  HOLE_CARDS,
  parseCards,
} from "../../src/index.js";

export interface DiffCase {
  game: Game;
  hole: string;
  board: string;
  straightBeatsTrips: boolean;
}

/** Mulberry32 — small seeded PRNG for reproducible test data only. */
function seeded(seed: number): (n: number) => number {
  let s = seed >>> 0;
  return (n: number) => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) % n) >>> 0;
  };
}

/** Mix per 100 hands: 40 nlhe, 20 shortdeck (5 of them with straightBeatsTrips), 20 plo4, 10 plo5, 10 plo6. */
const MIX: [Game, number, boolean][] = [
  ["nlhe", 40, false],
  ["shortdeck", 15, false],
  ["shortdeck", 5, true],
  ["plo4", 20, false],
  ["plo5", 10, false],
  ["plo6", 10, false],
];

export function generateCases(handCount: number, seed = 20260928): DiffCase[] {
  const next = seeded(seed);
  const out: DiffCase[] = [];
  for (let i = 0; out.length < handCount; i++) {
    for (const [game, share, sbt] of MIX) {
      for (let k = 0; k < share && out.length < handCount; k++) {
        const deck: Card[] = [...(game === "shortdeck" ? DECK_36 : DECK_52)];
        const need = HOLE_CARDS[game] + 5;
        for (let j = 0; j < need; j++) {
          const r = j + next(deck.length - j);
          [deck[j], deck[r]] = [deck[r]!, deck[j]!];
        }
        out.push({
          game,
          hole: formatCards(deck.slice(0, HOLE_CARDS[game])),
          board: formatCards(deck.slice(HOLE_CARDS[game], need)),
          straightBeatsTrips: sbt,
        });
      }
    }
  }
  return out;
}

const BRIDGE = fileURLToPath(new URL("./reference_bridge.py", import.meta.url));

export function referenceResults(cases: readonly DiffCase[]): [string, string][] {
  const input = JSON.stringify(cases.map((c) => [c.game, c.hole, c.board, c.straightBeatsTrips]));
  const res = spawnSync("python3", [BRIDGE], {
    input,
    encoding: "utf8",
    maxBuffer: 256 * 1024 * 1024,
  });
  if (res.status !== 0) throw new Error(`reference bridge failed: ${res.stderr || String(res.error)}`);
  return JSON.parse(res.stdout) as [string, string][];
}

export interface Mismatch extends DiffCase {
  expected: [string, string];
  actual: [string, string];
}

export function compare(cases: readonly DiffCase[]): {
  handCount: number;
  mismatches: Mismatch[];
  byGame: Record<string, number>;
} {
  const expected = referenceResults(cases);
  const mismatches: Mismatch[] = [];
  const byGame: Record<string, number> = {};
  cases.forEach((c, i) => {
    const key = c.game + (c.straightBeatsTrips ? "+sbt" : "");
    byGame[key] = (byGame[key] ?? 0) + 1;
    const r = evaluateHand(c.game, parseCards(c.hole), parseCards(c.board), {
      straightBeatsTrips: c.straightBeatsTrips,
    });
    const actual: [string, string] = [r.category, formatCards(r.best5)];
    const exp = expected[i]!;
    if (actual[0] !== exp[0] || actual[1] !== exp[1]) mismatches.push({ ...c, expected: exp, actual });
  });
  return { handCount: cases.length, mismatches, byGame };
}
