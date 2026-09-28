import { describe, expect, it } from "vitest";
import { compare, generateCases } from "./differential.js";

/** Fast profile on every test run; the full 10^5-hand run is `pnpm differential` (CI step). */
describe("differential test vs poker_reference.py (quick profile)", () => {
  it("2,000 random hands across all games agree on category and exact best5", () => {
    const { handCount, mismatches } = compare(generateCases(2_000, 7));
    expect(handCount).toBe(2_000);
    expect(mismatches.slice(0, 5)).toEqual([]);
  }, 60_000);
});
