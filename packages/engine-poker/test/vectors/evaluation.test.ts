import { describe, expect, it } from "vitest";
import { evaluateHoldem, formatCards, parseCards, winners } from "../../src/index.js";
import { SUPPORTED_GAMES, vectors } from "./load.js";

describe("engine-vectors: evaluation (test_vectors.json)", () => {
  const cases = vectors.evaluation.filter((v) => SUPPORTED_GAMES.has(v.game));
  const pending = vectors.evaluation.filter((v) => !SUPPORTED_GAMES.has(v.game));

  it("covers at least the ten Hold'em evaluation vectors", () => {
    expect(cases.length).toBeGreaterThanOrEqual(10);
  });

  it.each(cases)("$game $hole | $board → $category ($best5)", (v) => {
    const r = evaluateHoldem(parseCards(v.hole), parseCards(v.board));
    expect(r.category).toBe(v.category);
    expect(formatCards(r.best5)).toBe(v.best5);
  });

  it.todo(`${pending.length} Omaha / Short Deck evaluation vectors — WP-05 slice 2`);
});

describe("engine-vectors: comparison (test_vectors.json)", () => {
  const cases = vectors.comparison.filter((v) => SUPPORTED_GAMES.has(v.game));
  const pending = vectors.comparison.filter((v) => !SUPPORTED_GAMES.has(v.game));

  it.each(cases)("$game: $note", (v) => {
    const board = parseCards(v.board);
    const names = Object.keys(v.hands);
    const values = names.map((n) => evaluateHoldem(parseCards(v.hands[n] ?? ""), board).value);
    expect(winners(values).map((i) => names[i])).toEqual(v.winners);
  });

  it.todo(`${pending.length} Omaha / Short Deck comparison vectors — WP-05 slice 2`);
});
