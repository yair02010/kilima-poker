import { describe, expect, it } from "vitest";
import {
  type Action,
  applyAction,
  createHand,
  DECK_52,
  type HandState,
  legalActions,
  potTotal,
} from "../../src/index.js";
import { type BettingVector, vectors } from "./load.js";

/**
 * The vectors do not store the number of players; the reference builds each case with seats(n).
 * This table mirrors poker_reference.py main() §4 exactly.
 */
const PLAYERS: Record<string, number> = {
  "PLO 50/100, 6-max, first to act pre-flop: pot-size raise": 6,
  "PLO: after a pot raise to 350, next player's pot raise": 6,
  "NL 50/100: open 300, 3-bet to 900; minimum 4-bet is to 1500": 6,
  "NL: open 1000, short all-in to 1400 (incomplete raise); opener may only call or fold": 4,
  "Heads-up NL: button posts SB and acts first pre-flop": 2,
  "NL 3-handed: limp, SB completes; big blind has the option": 3,
  "Tournament big-blind ante: BB posts 100 blind + 100 ante (dead)": 6,
};

function setUp(v: BettingVector): HandState {
  const n = v.stacks?.length ?? PLAYERS[v.case];
  if (n === undefined) throw new Error(`no player count for vector "${v.case}"`);
  const players = Array.from({ length: n }, (_, i) => ({
    seatNo: i + 1,
    stack: BigInt(v.stacks?.[i] ?? 10_000),
  }));
  // Seat 1 must be index 0 (small blind): button = last seat (3+ players) or seat 1 (heads-up).
  const button = n === 2 ? 1 : n;
  let s = createHand(
    {
      game: v.structure === "PL" ? "plo4" : "nlhe",
      structure: v.structure,
      smallBlind: BigInt(v.blinds[0]),
      bigBlind: BigInt(v.blinds[1]),
      ...(v.bb_ante ? { bigBlindAnte: BigInt(v.bb_ante) } : {}),
    },
    players,
    button,
    DECK_52,
  ).state;
  for (const [type, to] of v.actions ?? []) {
    const seatNo = legalActions(s)!.seatNo;
    const action = (to === null ? { type } : { type, to: BigInt(to) }) as Action;
    const r = applyAction(s, seatNo, action);
    if (!r.ok) throw new Error(`${type} ${String(to)}: ${r.code} ${r.message}`);
    s = r.state;
  }
  return s;
}

describe("engine-vectors: betting legality (test_vectors.json)", () => {
  it("every betting vector has a known player count", () => {
    for (const v of vectors.betting) expect(v.stacks?.length ?? PLAYERS[v.case]).toBeGreaterThanOrEqual(2);
  });

  it.each(vectors.betting)("$case", (v) => {
    const s = setUp(v);
    const legal = legalActions(s)!;
    expect({
      fold: legal.fold,
      check: legal.check,
      call: legal.call === null ? null : Number(legal.call),
      raise:
        legal.raise === null
          ? null
          : { min_to: Number(legal.raise.minTo), max_to: Number(legal.raise.maxTo) },
      ...(legal.betOrRaise ? { bet_or_raise: legal.betOrRaise } : {}),
    }).toEqual(v.legal);
    if (v.to_act_index !== undefined) expect(s.toAct).toBe(v.to_act_index);
    if (v.pot_before_action !== undefined) expect(potTotal(s)).toBe(BigInt(v.pot_before_action));
  });
});
