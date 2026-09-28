import { describe, expect, it } from "vitest";
import { compareBetting } from "./betting.js";

describe("betting differential vs poker_reference.Hand (quick profile)", () => {
  it("500 random hands: legal actions agree at every step; same end state and pot", () => {
    const { hands, skipped, actions, mismatches } = compareBetting(500, 3);
    expect(hands + skipped).toBe(500);
    expect(skipped).toBeLessThan(25); // reference defect R1 cases only
    expect(actions).toBeGreaterThan(1_000);
    expect(mismatches.slice(0, 3)).toEqual([]);
  }, 60_000);
});
