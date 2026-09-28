/**
 * Omaha 4/5/6 (KP-ENG-06 §8.2): exactly two hole cards and exactly three board cards.
 *
 * Visits hole pairs (outer) and board triples (inner) in lexicographic order and keeps the first strictly
 * best combination — the same order as the reference implementation, so `best5` matches it exactly.
 */
import type { Card } from "../cards.js";
import type { RankingRule } from "../rules/ranking.js";
import type { Evaluation } from "./best.js";
import { categoryOf, evaluate5 } from "./five.js";

export function evaluateOmaha(
  hole: readonly Card[],
  board: readonly Card[],
  rule: RankingRule = "standard",
): Evaluation {
  const h = hole.length;
  const b = board.length;
  if (h < 4 || h > 6) throw new RangeError(`Omaha needs 4–6 hole cards, got ${h}`);
  if (b < 3 || b > 5) throw new RangeError(`Omaha needs 3–5 board cards, got ${b}`);
  if (new Set([...hole, ...board]).size !== h + b) throw new RangeError("duplicate card");

  let bestValue = -1;
  let best: [number, number, number, number, number] = [0, 1, 0, 1, 2];
  const combo: Card[] = new Array<Card>(5);
  for (let i = 0; i < h - 1; i++)
    for (let j = i + 1; j < h; j++)
      for (let x = 0; x < b - 2; x++)
        for (let y = x + 1; y < b - 1; y++)
          for (let z = y + 1; z < b; z++) {
            combo[0] = hole[i] as Card;
            combo[1] = hole[j] as Card;
            combo[2] = board[x] as Card;
            combo[3] = board[y] as Card;
            combo[4] = board[z] as Card;
            const v = evaluate5(combo, rule);
            if (v > bestValue) {
              bestValue = v;
              best = [i, j, x, y, z];
            }
          }
  const [i, j, x, y, z] = best;
  const best5 = [hole[i], hole[j], board[x], board[y], board[z]] as Card[];
  return { value: bestValue, category: categoryOf(bestValue), best5 };
}
