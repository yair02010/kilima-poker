/**
 * Best five-card hand from 5–7 cards (Hold'em, Short Deck) — KP-ENG-06 §8.
 *
 * Combinations are visited in lexicographic index order over `hole ++ board`, and the first combination
 * with the strictly highest value is kept. This reproduces the reference implementation exactly, including
 * which equal-valued five cards are reported as `best5`.
 */
import type { Card } from "../cards.js";
import type { RankingRule } from "../rules/ranking.js";
import { categoryOf, evaluate5, type HandValue } from "./five.js";
import type { Category } from "../rules/ranking.js";

export interface Evaluation {
  value: HandValue;
  category: Category;
  best5: readonly Card[];
}

export function bestOfAny(cards: readonly Card[], rule: RankingRule = "standard"): Evaluation {
  const n = cards.length;
  if (n < 5 || n > 7) throw new RangeError(`need 5–7 cards, got ${n}`);
  if (new Set(cards).size !== n) throw new RangeError("duplicate card");
  let bestValue = -1;
  let bestIdx = 0;
  const combo: Card[] = new Array<Card>(5);
  for (let a = 0; a < n - 4; a++)
    for (let b = a + 1; b < n - 3; b++)
      for (let c = b + 1; c < n - 2; c++)
        for (let d = c + 1; d < n - 1; d++)
          for (let e = d + 1; e < n; e++) {
            combo[0] = cards[a] as Card;
            combo[1] = cards[b] as Card;
            combo[2] = cards[c] as Card;
            combo[3] = cards[d] as Card;
            combo[4] = cards[e] as Card;
            const v = evaluate5(combo, rule);
            if (v > bestValue) {
              bestValue = v;
              bestIdx = (((((((a << 3) | b) << 3) | c) << 3) | d) << 3) | e;
            }
          }
  const best5: Card[] = [];
  for (let k = 4; k >= 0; k--) best5.push(cards[(bestIdx >> (3 * k)) & 7] as Card);
  return { value: bestValue, category: categoryOf(bestValue), best5 };
}

/** Hold'em: any five of the two hole cards and the board (3–5 cards). */
export function evaluateHoldem(
  hole: readonly Card[],
  board: readonly Card[],
  rule: RankingRule = "standard",
): Evaluation {
  if (hole.length !== 2) throw new RangeError(`Hold'em needs 2 hole cards, got ${hole.length}`);
  return bestOfAny([...hole, ...board], rule);
}

/** Indices of the best hands (ties included), in input order. */
export function winners(values: readonly HandValue[]): number[] {
  let max = -1;
  for (const v of values) if (v > max) max = v;
  const out: number[] = [];
  values.forEach((v, i) => {
    if (v === max) out.push(i);
  });
  return out;
}
