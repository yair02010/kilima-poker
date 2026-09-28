import { describe, expect, it } from "vitest";
import { buildPots, computeRake, distribute, type Pot, returnUncalled } from "../../src/index.js";
import { vectors } from "./load.js";

const toMap = (o: Record<string, number>) =>
  new Map(Object.entries(o).map(([k, v]) => [Number(k), BigInt(v)]));
const fromMap = (m: Map<number, bigint>) =>
  Object.fromEntries([...m.entries()].map(([k, v]) => [String(k), Number(v)]));
const potsOf = (ps: { amount: number; eligible: number[] }[]): Pot[] =>
  ps.map((p) => ({ amount: BigInt(p.amount), eligible: [...p.eligible] }));
const plain = (ps: Pot[]) => ps.map((p) => ({ amount: Number(p.amount), eligible: p.eligible }));

/** "1 > (2 = 3) > 4" → strengths: seat 1 = 3, seats 2 and 3 = 2, seat 4 = 1. */
function parseStrengths(text: string): Map<number, number> {
  const groups = text.split(">").map((g) =>
    g
      .replace(/[()\s]/g, "")
      .split("=")
      .map(Number),
  );
  const out = new Map<number, number>();
  groups.forEach((g, i) => {
    for (const seat of g) out.set(seat, groups.length - i);
  });
  return out;
}

describe("engine-vectors: pots and side pots (test_vectors.json)", () => {
  it.each(vectors.pots)("$case", (v) => {
    const { contrib, returned } = returnUncalled(toMap(v.contrib));
    expect(fromMap(returned)).toEqual(v.returned);
    expect(plain(buildPots(contrib, new Set(v.folded)))).toEqual(v.pots);
  });
});

describe("engine-vectors: rake and distribution (test_vectors.json)", () => {
  it.each(vectors.rake)("$case", (v) => {
    const pots = potsOf(v.pots);
    const r = computeRake(pots, { percentBp: v.rake_bp, cap: BigInt(v.cap) }, v.saw_flop);
    expect(Number(r.rake)).toBe(v.rake);
    expect(r.perPot.map(Number)).toEqual(v.rake_per_pot);
    if (v.won && v.button_order) {
      const strengths = v.winners_by_strength
        ? parseStrengths(v.winners_by_strength)
        : new Map(v.button_order.map((s) => [s, 1])); // split between everyone listed
      const { won } = distribute(pots, r.perPot, strengths, v.button_order);
      expect(fromMap(won)).toEqual(v.won);
      const paid = [...won.values()].reduce((x, y) => x + y, 0n) + r.rake;
      expect(paid).toBe(pots.reduce((x, p) => x + p.amount, 0n));
    }
  });
});
