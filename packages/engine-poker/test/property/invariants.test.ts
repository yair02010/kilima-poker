import { describe, expect, it } from "vitest";
import { checkHand } from "./invariants.js";

/** Quick profile on every test run; the 10^6-hand profile is `pnpm --filter @kilima/engine-poker property`. */
describe("hand invariants (quick profile)", () => {
  it("5,000 random hands across all games, structures, antes and rake keep every invariant", () => {
    let actions = 0;
    let illegal = 0;
    let showdowns = 0;
    for (let seed = 1; seed <= 5_000; seed++) {
      const r = checkHand(seed);
      actions += r.actions;
      illegal += r.illegalTried;
      if (r.status === "showdown") showdowns++;
    }
    expect(actions).toBeGreaterThan(20_000);
    expect(illegal).toBeGreaterThan(3_000);
    expect(showdowns).toBeGreaterThan(1_000);
  }, 120_000);
});
