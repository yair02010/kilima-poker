import { describe, expect, it } from "vitest";
import {
  card,
  CardError,
  DECK_36,
  DECK_52,
  deckFor,
  formatCard,
  formatCards,
  parseCard,
  parseCards,
  rankOf,
  rankValue,
  suitOf,
} from "../../src/index.js";

describe("cards", () => {
  it("encodes rank * 4 + suit", () => {
    expect(parseCard("2s")).toBe(0);
    expect(parseCard("2c")).toBe(3);
    expect(parseCard("Ah")).toBe(12 * 4 + 1);
    expect(card(12, 3)).toBe(51);
    const kd = parseCard("Kd");
    expect([rankOf(kd), suitOf(kd), rankValue(kd)]).toEqual([11, 2, 13]);
  });

  it("round-trips every card", () => {
    for (const c of DECK_52) expect(parseCard(formatCard(c))).toBe(c);
  });

  it("parses lists and rejects bad or duplicate cards", () => {
    expect(formatCards(parseCards("Ah  Kd Tc"))).toBe("Ah Kd Tc");
    expect(formatCards(parseCards(["2s", "3h"]))).toBe("2s 3h");
    for (const bad of ["", "A", "1h", "Ax", "ah", "10h", "Ahh"])
      expect(() => parseCard(bad)).toThrow(CardError);
    expect(() => parseCards("Ah Kd Ah")).toThrow(/duplicate/);
    expect(() => card(13, 0)).toThrow(CardError);
    expect(() => card(0, 4)).toThrow(CardError);
  });

  it("builds 52- and 36-card decks in canonical rank-major order", () => {
    expect(DECK_52).toHaveLength(52);
    expect(new Set(DECK_52).size).toBe(52);
    expect(formatCards(DECK_52.slice(0, 5))).toBe("2s 2h 2d 2c 3s");
    expect(DECK_36).toHaveLength(36);
    expect(formatCard(DECK_36[0]!)).toBe("6s");
    expect(DECK_36.every((c) => rankValue(c) >= 6)).toBe(true);
    expect(deckFor("shortdeck")).toBe(DECK_36);
    expect(deckFor("standard")).toBe(DECK_52);
    expect(Object.isFrozen(DECK_52)).toBe(true);
  });
});
