import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  bestOfAny,
  categoryOf,
  DECK_52,
  evaluate5,
  evaluateHoldem,
  formatCards,
  parseCards,
  type Card,
} from "../../src/index.js";

const v5 = (s: string) => evaluate5(parseCards(s));

describe("evaluate5", () => {
  it.each([
    ["As Ks Qs Js Ts", "straight_flush"],
    ["5d 4d 3d 2d Ad", "straight_flush"],
    ["9s 9h 9d 9c Kd", "four_of_a_kind"],
    ["Ks Kh Kd 2s 2h", "full_house"],
    ["As 3s Ks 8s 2s", "flush"],
    ["5c 4d Ah 2s 3h", "straight"],
    ["Ts Th Td 4c 2h", "three_of_a_kind"],
    ["Ts Th 4d 4c 2h", "two_pair"],
    ["Ts Th 5d 4c 2h", "pair"],
    ["As Kh Qd Jc 9s", "high_card"],
  ])("%s is %s", (hand, category) => {
    expect(categoryOf(v5(hand))).toBe(category);
  });

  it("orders categories and kickers", () => {
    const ladder = [
      "As Kh Qd Jc 9s",
      "2s 2h 3d 4c 5h",
      "2s 2h 3d 3c 4h",
      "2s 2h 2d 3c 4h",
      "Ah 2s 3d 4c 5h",
      "6h 2s 3d 4c 5h",
      "2s 3s 4s 5s 7s",
      "2s 2h 2d 3c 3h",
      "2s 2h 2d 2c 3h",
      "Ah 2h 3h 4h 5h",
      "Ah Kh Qh Jh Th",
    ].map(v5);
    for (let i = 1; i < ladder.length; i++) expect(ladder[i]!).toBeGreaterThan(ladder[i - 1]!);
    expect(v5("Ah Ad Kc 7s 2h")).toBeGreaterThan(v5("Ah Ad Qc Js Th"));
    expect(v5("Ks Kh Kd 2s 2h")).toBeGreaterThan(v5("Qs Qh Qd As Ah"));
    expect(v5("As Kh Qd Jc 9s")).toBe(v5("Ah Kd Qc Js 9h"));
  });

  it("wheel is the lowest straight; no wrap-around", () => {
    expect(v5("Ah 2s 3d 4c 5h")).toBeLessThan(v5("2h 3s 4d 5c 6h"));
    expect(categoryOf(v5("Qh Ks Ad 2c 3h"))).toBe("high_card");
  });

  it("rejects the wrong number of cards", () => {
    expect(() => evaluate5(parseCards("As Ks"))).toThrow(RangeError);
  });
});

describe("Hold'em best of seven", () => {
  it("plays the board when the board is best", () => {
    const r = evaluateHoldem(parseCards("2c 3d"), parseCards("As Kh Qd Jc 9s"));
    expect(formatCards(r.best5)).toBe("As Kh Qd Jc 9s");
  });

  it("works with a flop or turn (5 or 6 cards)", () => {
    expect(evaluateHoldem(parseCards("Ah Ad"), parseCards("Ac 7s 2d")).category).toBe("three_of_a_kind");
    expect(evaluateHoldem(parseCards("Ah Ad"), parseCards("Ac 7s 2d 7h")).category).toBe("full_house");
  });

  it("rejects duplicates and bad sizes", () => {
    expect(() => evaluateHoldem(parseCards("Ah Kd"), parseCards("Ah 2c 3d 4s 5h"))).toThrow(/duplicate/);
    expect(() => evaluateHoldem(parseCards("Ah"), parseCards("2c 3d 4s 5h 6h"))).toThrow(RangeError);
    expect(() => bestOfAny(parseCards("Ah Kd"))).toThrow(RangeError);
  });
});

const sevenCards = fc.shuffledSubarray([...DECK_52], { minLength: 7, maxLength: 7 });

describe("properties", () => {
  it("the value of 7 cards does not depend on their order", () => {
    fc.assert(
      fc.property(sevenCards, (cards) => {
        const reversed = [...cards].reverse();
        expect(bestOfAny(reversed).value).toBe(bestOfAny(cards).value);
      }),
      { numRuns: 2000 },
    );
  });

  it("best of 7 is at least as good as every 5-card subset and equals one of them", () => {
    fc.assert(
      fc.property(sevenCards, fc.integer({ min: 0, max: 20 }), (cards, k) => {
        const best = bestOfAny(cards);
        expect(evaluate5(best.best5)).toBe(best.value);
        expect(best.best5.every((c) => cards.includes(c))).toBe(true);
        // drop two cards chosen by k → a 5-card subset
        const i = k % 7;
        const j = (i + 1 + (k % 6)) % 7;
        const subset = cards.filter((_, idx) => idx !== i && idx !== j);
        expect(best.value).toBeGreaterThanOrEqual(evaluate5(subset));
      }),
      { numRuns: 2000 },
    );
  });

  it("suits are symmetric: permuting suits keeps the value", () => {
    fc.assert(
      fc.property(sevenCards, (cards) => {
        const swap = [1, 2, 3, 0];
        const permuted = cards.map((c) => ((c & ~3) | swap[c & 3]!) as Card);
        expect(bestOfAny(permuted).value).toBe(bestOfAny(cards).value);
      }),
      { numRuns: 2000 },
    );
  });
});
