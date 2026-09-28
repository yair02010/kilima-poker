import { describe, expect, it } from "vitest";
import { evaluateHand, evaluateOmaha, formatCards, parseCards, rankingRuleFor } from "../../src/index.js";

const hand = (
  game: Parameters<typeof evaluateHand>[0],
  hole: string,
  board: string,
  straightBeatsTrips = false,
) => evaluateHand(game, parseCards(hole), parseCards(board), { straightBeatsTrips });

describe("Omaha", () => {
  it("uses exactly two hole cards: four hearts on board and one in hand is no flush", () => {
    expect(hand("plo4", "Ah Kc 2c 3d", "Qh Jh Th 2h 8s").category).not.toBe("flush");
  });

  it("uses exactly three board cards: a board straight does not play", () => {
    expect(hand("plo4", "2c 2d 7s 7h", "8h 9d Tc Js Qh").category).toBe("pair");
  });

  it("supports 5 and 6 hole cards", () => {
    expect(hand("plo5", "Ah Ad 7c 8c 9s", "Ts Jd 2h 3c 6c").category).toBe("pair");
    expect(hand("plo6", "Ah Ks Qd Jc 3h 2h", "Th 9h 8h 4c 4d").category).toBe("flush");
  });

  it("works on the flop and turn", () => {
    expect(evaluateOmaha(parseCards("Ah Ad Kc Kd"), parseCards("As 7h 2c")).category).toBe("three_of_a_kind");
    expect(evaluateOmaha(parseCards("Ah Ad Kc Kd"), parseCards("As 7h 2c 7c")).category).toBe("full_house");
  });

  it("rejects wrong sizes and duplicates", () => {
    expect(() => hand("plo4", "Ah Kd Qc", "2c 3d 4s")).toThrow(RangeError);
    expect(() => hand("plo4", "Ah Kd Qc Jc", "Ah 3d 4s")).toThrow(/duplicate/);
    expect(() => evaluateOmaha(parseCards("Ah Kd Qc Jc"), parseCards("2c 3d"))).toThrow(RangeError);
  });
});

describe("Short Deck (ADR-0016)", () => {
  it("A-6-7-8-9 is the lowest straight", () => {
    const r = hand("shortdeck", "Ah 6c", "7d 8s 9h Kc Qd");
    expect(r.category).toBe("straight");
    expect(formatCards(r.best5)).toBe("Ah 6c 7d 8s 9h");
    expect(r.value).toBeLessThan(hand("shortdeck", "Th 6c", "7d 8s 9h Kc Qd").value);
  });

  it("default rule: flush beats full house and trips beat a straight", () => {
    const flush = hand("shortdeck", "As 6s", "Ks 9s 7s Th Td").value;
    const fullHouse = hand("shortdeck", "Tc Th", "Ts 9d 9c 7d 6d").value;
    expect(flush).toBeGreaterThan(fullHouse);
    const trips = hand("shortdeck", "Ks Kh", "Kd 8s 9h Td 6c").value;
    const straight = hand("shortdeck", "Js 7h", "8d 9s Th 6c Ac").value;
    expect(trips).toBeGreaterThan(straight);
  });

  it("table option straightBeatsTrips: straight beats trips, flush still beats full house", () => {
    expect(rankingRuleFor("shortdeck", { straightBeatsTrips: true })).toBe("shortdeck_straight");
    const trips = hand("shortdeck", "Ks Kh", "Kd 8s 9h Qd 6c", true).value;
    const straight = hand("shortdeck", "Js 7h", "8d 9s Th 6c Ac", true).value;
    expect(straight).toBeGreaterThan(trips);
    const flush = hand("shortdeck", "As 6s", "Ks 9s 7s Th Td", true).value;
    const fullHouse = hand("shortdeck", "Tc Th", "Ts 9d 9c 7d 6d", true).value;
    expect(flush).toBeGreaterThan(fullHouse);
  });

  it("rejects cards below 6", () => {
    expect(() => hand("shortdeck", "Ah 5c", "7d 8s 9h Kc Qd")).toThrow(/ranks 6 to A/);
  });

  it("standard games keep the standard order", () => {
    expect(rankingRuleFor("nlhe")).toBe("standard");
    expect(rankingRuleFor("plo6", { straightBeatsTrips: true })).toBe("standard");
  });
});
