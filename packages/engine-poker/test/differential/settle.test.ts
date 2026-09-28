import { describe, expect, it } from "vitest";
import { compareSettlement } from "./settle.js";

describe("settlement differential vs poker_reference.py (quick profile)", () => {
  it("1,000 random finished hands: returned, pots, rake and winnings agree; chips conserved", () => {
    const { hands, showdowns, mismatches } = compareSettlement(1_000, 11);
    expect(hands).toBe(1_000);
    expect(showdowns).toBeGreaterThan(100);
    expect(mismatches.slice(0, 3)).toEqual([]);
  }, 60_000);
});
