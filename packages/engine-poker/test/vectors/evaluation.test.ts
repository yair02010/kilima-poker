import { describe, expect, it } from "vitest";
import { evaluateHand, parseCards, winners, type Game } from "../../src/index.js";
import { SUPPORTED_GAMES, vectors } from "./load.js";

describe("engine-vectors: evaluation (test_vectors.json)", () => {
  it("every vector is for a supported game", () => {
    expect(vectors.evaluation.filter((v) => !SUPPORTED_GAMES.has(v.game))).toEqual([]);
    expect(vectors.comparison.filter((v) => !SUPPORTED_GAMES.has(v.game))).toEqual([]);
  });

  it.each(vectors.evaluation)("$game $hole | $board → $category ($best5)", (v) => {
    const r = evaluateHand(v.game as Game, parseCards(v.hole), parseCards(v.board));
    expect(r.category).toBe(v.category);
    // The reference asserts best5 as a set (sorted(parse(cards)) == sorted(combo)); the listed order is for reading.
    expect([...r.best5].sort((a, b) => a - b)).toEqual(parseCards(v.best5).sort((a, b) => a - b));
  });
});

describe("engine-vectors: comparison (test_vectors.json)", () => {
  it.each(vectors.comparison)("$game: $note", (v) => {
    const board = parseCards(v.board);
    const names = Object.keys(v.hands);
    const values = names.map((n) => evaluateHand(v.game as Game, parseCards(v.hands[n] ?? ""), board).value);
    expect(winners(values).map((i) => names[i])).toEqual(v.winners);
  });
});
