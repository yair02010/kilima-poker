import { describe, expect, it } from "vitest";
import plugin from "../src/index.ts";

describe("@kilima/eslint-plugin", () => {
  it("exports exactly the six KP-ENG-11 §2.1 rules", () => {
    expect(Object.keys(plugin.rules).sort()).toEqual([
      "no-direct-db-cross-schema",
      "no-float-money",
      "no-hole-cards-in-logs",
      "no-io-in-engine",
      "no-math-random",
      "no-raw-ledger-entries",
    ]);
  });

  it("marks every rule as a problem with docs and messages", () => {
    for (const rule of Object.values(plugin.rules)) {
      expect(rule.meta.type).toBe("problem");
      expect(rule.meta.docs?.description.length ?? 0).toBeGreaterThan(10);
      expect(Object.keys(rule.meta.messages).length).toBeGreaterThan(0);
    }
  });
});
