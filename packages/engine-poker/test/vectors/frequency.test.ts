import { describe, expect, it } from "vitest";
import {
  type Card,
  CATEGORIES,
  categoryOf,
  DECK_36,
  DECK_52,
  evaluate5,
  type RankingRule,
} from "../../src/index.js";
import { vectors } from "./load.js";

/** Enumerates every 5-card hand of a deck and counts categories (KP-ENG-06 §8 evaluator self-check). */
function frequencies(deck: readonly Card[], rule: RankingRule): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  const n = deck.length;
  const hand: Card[] = new Array<Card>(5);
  for (let a = 0; a < n - 4; a++) {
    hand[0] = deck[a]!;
    for (let b = a + 1; b < n - 3; b++) {
      hand[1] = deck[b]!;
      for (let c = b + 1; c < n - 2; c++) {
        hand[2] = deck[c]!;
        for (let d = c + 1; d < n - 1; d++) {
          hand[3] = deck[d]!;
          for (let e = d + 1; e < n; e++) {
            hand[4] = deck[e]!;
            counts[categoryOf(evaluate5(hand, rule))]!++;
          }
        }
      }
    }
  }
  return counts;
}

describe("engine-vectors: exhaustive frequency self-check", () => {
  it("52-card deck: all 2,598,960 hands match the published table", () => {
    const f = frequencies(DECK_52, "standard");
    expect(Object.values(f).reduce((x, y) => x + y, 0)).toBe(2_598_960);
    expect(f).toEqual(vectors.frequency.standard_52);
  }, 60_000);

  it("36-card Short Deck: all 376,992 hands match the reference (flush 480 < full house 1,728)", () => {
    const f = frequencies(DECK_36, "shortdeck_trips");
    expect(Object.values(f).reduce((x, y) => x + y, 0)).toBe(376_992);
    expect(f).toEqual(vectors.frequency.shortdeck_36);
  }, 60_000);
});
