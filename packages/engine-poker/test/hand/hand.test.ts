import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  type Action,
  applyAction,
  createHand,
  DECK_36,
  DECK_52,
  formatCards,
  type HandState,
  legalActions,
  potTotal,
  type TableConfig,
  timeout,
} from "../../src/index.js";

const NL: TableConfig = { game: "nlhe", structure: "NL", smallBlind: 50n, bigBlind: 100n };
const players = (n: number, stack = 10_000n) =>
  Array.from({ length: n }, (_, i) => ({ seatNo: i + 1, stack }));

function act(s: HandState, a: Action): HandState {
  const legal = legalActions(s)!;
  const r = applyAction(s, legal.seatNo, a);
  if (!r.ok) throw new Error(`${a.type}: ${r.message}`);
  return r.state;
}
const seatsInOrder = (s: HandState) => s.seats.map((p) => p.seatNo);

describe("createHand: positions, blinds, dealing (KP-ENG-06 §4–§5)", () => {
  it("orders seats from left of the button, posts blinds, first to act is left of the big blind", () => {
    const { state: s } = createHand(NL, players(4), 2, DECK_52);
    expect(seatsInOrder(s)).toEqual([3, 4, 1, 2]);
    expect(s.seats.map((p) => p.streetBet)).toEqual([50n, 100n, 0n, 0n]);
    expect(legalActions(s)!.seatNo).toBe(1);
    expect(potTotal(s)).toBe(150n);
  });

  it("works with gaps in seat numbers", () => {
    const { state: s } = createHand(
      NL,
      [
        { seatNo: 2, stack: 500n },
        { seatNo: 5, stack: 500n },
        { seatNo: 9, stack: 500n },
      ],
      9,
      DECK_52,
    );
    expect(seatsInOrder(s)).toEqual([2, 5, 9]);
    expect(legalActions(s)!.seatNo).toBe(9);
  });

  it("deals hole cards one at a time clockwise from left of the button", () => {
    const { state: s } = createHand(NL, players(3), 3, DECK_52);
    // seats in order 1 (SB), 2 (BB), 3 (button): cards 0,3 / 1,4 / 2,5 of the deck
    expect(s.seats.map((p) => formatCards(p.hole))).toEqual(["2s 2c", "2h 3s", "2d 3h"]);
    expect(s.deckIndex).toBe(6);
  });

  it("heads-up: button posts the small blind, acts first pre-flop; big blind is dealt first", () => {
    const { state: s } = createHand(NL, players(2), 1, DECK_52);
    expect(seatsInOrder(s)).toEqual([1, 2]);
    expect(s.seats[0]!.streetBet).toBe(50n);
    expect(legalActions(s)!.seatNo).toBe(1);
    expect(formatCards(s.seats[1]!.hole)).toBe("2s 2d");
    expect(formatCards(s.seats[0]!.hole)).toBe("2h 2c");
  });

  it("Omaha deals four cards each; Short Deck needs the 36-card deck", () => {
    const { state: s } = createHand({ ...NL, game: "plo4", structure: "PL" }, players(3), 3, DECK_52);
    expect(s.seats.every((p) => p.hole.length === 4)).toBe(true);
    expect(() => createHand({ ...NL, game: "shortdeck" }, players(3), 3, DECK_52)).toThrow(/36/);
    expect(createHand({ ...NL, game: "shortdeck" }, players(3), 3, DECK_36).ok).toBe(true);
  });

  it("antes are dead money; short stacks post what they have and are all-in", () => {
    const { state: s } = createHand(
      { ...NL, ante: 25n },
      [...players(2), { seatNo: 3, stack: 20n }],
      3,
      DECK_52,
    );
    expect(potTotal(s)).toBe(50n + 20n + 150n);
    expect(s.seats.find((p) => p.seatNo === 3)!.allIn).toBe(true);
    expect(s.seats[1]!.streetBet).toBe(100n); // the ante is not part of the big blind's street bet
  });

  it("rejects bad inputs", () => {
    expect(() => createHand(NL, players(1), 1, DECK_52)).toThrow(RangeError);
    expect(() => createHand(NL, players(3), 7, DECK_52)).toThrow(/button/);
    expect(() => createHand(NL, [...players(2), { seatNo: 2, stack: 1n }], 1, DECK_52)).toThrow(/duplicate/);
    expect(() => createHand(NL, players(3), 1, DECK_52.slice(1))).toThrow(/deck/);
    expect(() => createHand({ ...NL, smallBlind: 200n }, players(3), 1, DECK_52)).toThrow(/blinds/);
  });
});

describe("betting rounds and streets (KP-ENG-06 §6)", () => {
  it("plays a full hand: flop, turn, river with burn cards, then showdown", () => {
    let s = createHand(NL, players(3), 3, DECK_52).state;
    s = act(s, { type: "call" }); // button
    s = act(s, { type: "call" }); // SB completes
    s = act(s, { type: "check" }); // BB option
    expect(s.street).toBe("flop");
    expect(s.board).toEqual([DECK_52[7], DECK_52[8], DECK_52[9]]); // 6 hole cards, burn #6
    expect(legalActions(s)!.seatNo).toBe(1); // first active left of the button
    s = act(s, { type: "check" });
    s = act(s, { type: "bet", to: 200n });
    s = act(s, { type: "call" });
    s = act(s, { type: "fold" }); // three players, one folds: two remain
    expect(s.street).toBe("turn");
    expect(s.board).toHaveLength(4);
    for (const street of ["turn", "river"]) {
      expect(s.street).toBe(street);
      s = act(s, { type: "check" });
      s = act(s, { type: "check" });
    }
    expect(s.status).toBe("showdown");
    expect(s.board).toHaveLength(5);
    expect(s.deckIndex).toBe(6 + 4 + 2 + 2);
  });

  it("everyone folds to one player: complete without showdown", () => {
    let s = createHand(NL, players(3), 3, DECK_52).state;
    s = act(s, { type: "raise", to: 300n });
    s = act(s, { type: "fold" });
    s = act(s, { type: "fold" });
    expect(s.status).toBe("complete");
    expect(s.toAct).toBeNull();
    expect(s.board).toEqual([]);
  });

  it("all-in and call: the rest of the board is run out without betting", () => {
    let s = createHand(NL, players(2), 1, DECK_52).state;
    s = act(s, { type: "allin" });
    s = act(s, { type: "call" });
    expect(s.status).toBe("showdown");
    expect(s.board).toHaveLength(5);
  });

  it("heads-up: big blind acts first after the flop", () => {
    let s = createHand(NL, players(2), 1, DECK_52).state;
    s = act(s, { type: "call" });
    s = act(s, { type: "check" });
    expect(s.street).toBe("flop");
    expect(legalActions(s)!.seatNo).toBe(2);
  });

  it("bet on an empty street: minimum is the big blind; minimum raise tracks the last full raise", () => {
    let s = createHand(NL, players(3), 3, DECK_52).state;
    s = act(s, { type: "call" });
    s = act(s, { type: "call" });
    s = act(s, { type: "check" });
    expect(legalActions(s)!.raise).toEqual({ minTo: 100n, maxTo: 9_900n });
    expect(legalActions(s)!.betOrRaise).toBe("bet");
    s = act(s, { type: "bet", to: 250n });
    expect(legalActions(s)!.raise!.minTo).toBe(500n);
  });

  it("pot-limit all-in is capped at the pot-size raise", () => {
    let s = createHand({ ...NL, game: "plo4", structure: "PL" }, players(3), 3, DECK_52).state;
    s = act(s, { type: "allin" });
    expect(s.seats.find((p) => p.seatNo === 3)!.streetBet).toBe(350n);
  });
});

describe("errors leave the state unchanged", () => {
  const s0 = createHand(NL, players(3), 3, DECK_52).state;
  const bad = (seat: number, a: Action) => {
    const r = applyAction(s0, seat, a);
    return r.ok ? "ok" : r.code;
  };
  it.each([
    [2, { type: "call" }, "NOT_YOUR_TURN"],
    [3, { type: "check" }, "ILLEGAL_ACTION"],
    [3, { type: "bet", to: 300n }, "ILLEGAL_ACTION"],
    [3, { type: "raise", to: 150n }, "ILLEGAL_AMOUNT"],
    [3, { type: "raise", to: 20_000n }, "ILLEGAL_AMOUNT"],
  ] as [number, Action, string][])("seat %i %o → %s", (seat, a, code) => {
    expect(bad(seat, a)).toBe(code);
  });

  it("fold when a check is possible is rejected; nothing to call", () => {
    let s = createHand(NL, players(3), 3, DECK_52).state;
    s = act(s, { type: "call" });
    s = act(s, { type: "call" });
    const bb = legalActions(s)!.seatNo;
    expect(applyAction(s, bb, { type: "fold" })).toMatchObject({ ok: false, code: "ILLEGAL_ACTION" });
    expect(applyAction(s, bb, { type: "call" })).toMatchObject({ ok: false, code: "ILLEGAL_ACTION" });
  });

  it("all-in is rejected when raising is not allowed and the stack exceeds the call", () => {
    let s = createHand(NL, [...players(3), { seatNo: 4, stack: 1_400n }], 2, DECK_52).state; // seat 4 is BB? no: order 3,4,1,2
    // order: 3 (SB), 4 (BB), 1, 2(button). Make seat 1 open, seat 2 fold, SB fold, BB short all-in raise.
    s = act(s, { type: "raise", to: 1_000n }); // seat 1
    s = act(s, { type: "fold" }); // seat 2
    s = act(s, { type: "fold" }); // seat 3
    s = act(s, { type: "allin" }); // seat 4: to 1400, incomplete raise
    const legal = legalActions(s)!;
    expect(legal).toMatchObject({ seatNo: 1, call: 400n, raise: null });
    expect(applyAction(s, 1, { type: "allin" })).toMatchObject({ ok: false, code: "ILLEGAL_ACTION" });
  });

  it("no action after the hand is over", () => {
    let s = createHand(NL, players(2), 1, DECK_52).state;
    s = act(s, { type: "fold" });
    expect(applyAction(s, 2, { type: "check" })).toMatchObject({ ok: false, code: "HAND_NOT_IN_BETTING" });
    expect(legalActions(s)).toBeNull();
  });

  it("inputs are never mutated", () => {
    const snapshot = JSON.stringify(s0, (_, v: unknown) => (typeof v === "bigint" ? `${v}n` : v));
    applyAction(s0, 3, { type: "raise", to: 300n });
    applyAction(s0, 3, { type: "fold" });
    expect(JSON.stringify(s0, (_, v: unknown) => (typeof v === "bigint" ? `${v}n` : v))).toBe(snapshot);
  });
});

describe("timeout (KP-ENG-06 §6.8)", () => {
  it("checks when possible, otherwise folds, and records it", () => {
    let s = createHand(NL, players(3), 3, DECK_52).state;
    let r = timeout(s, 3);
    expect(r.ok && r.state.actions.at(-1)?.type).toBe("timeout_fold");
    s = act(s, { type: "call" });
    s = act(s, { type: "call" });
    r = timeout(s, 2);
    expect(r.ok && r.state.actions.at(-1)?.type).toBe("timeout_check");
    expect(timeout(s, 1)).toMatchObject({ ok: false, code: "NOT_YOUR_TURN" });
  });
});

describe("properties (random legal play)", () => {
  const handArb = fc.record({
    n: fc.integer({ min: 2, max: 9 }),
    structure: fc.constantFrom("NL" as const, "PL" as const),
    stacks: fc.array(fc.bigInt({ min: 1n, max: 20_000n }), { minLength: 9, maxLength: 9 }),
    choices: fc.array(fc.nat(), { minLength: 200, maxLength: 200 }),
    ante: fc.constantFrom(0n, 10n),
  });

  it("chips are conserved, stacks never negative, cards unique, and the hand always ends", () => {
    fc.assert(
      fc.property(handArb, ({ n, structure, stacks, choices, ante }) => {
        const ps = Array.from({ length: n }, (_, i) => ({ seatNo: i + 1, stack: stacks[i]! }));
        const start = ps.reduce((x, p) => x + p.stack, 0n);
        let s = createHand({ ...NL, structure, ante }, ps, n, DECK_52).state;
        let k = 0;
        while (s.status === "betting") {
          expect(k).toBeLessThan(choices.length);
          const legal = legalActions(s)!;
          const opts: Action[] = [];
          if (legal.fold) opts.push({ type: "fold" });
          if (legal.check) opts.push({ type: "check" });
          if (legal.call !== null) opts.push({ type: "call" });
          if (legal.raise && legal.betOrRaise)
            opts.push(
              { type: legal.betOrRaise, to: legal.raise.minTo },
              { type: legal.betOrRaise, to: legal.raise.maxTo },
            );
          const r = applyAction(s, legal.seatNo, opts[choices[k++]! % opts.length]!);
          expect(r.ok).toBe(true);
          if (r.ok) s = r.state;
          const onTable = s.seats.reduce((x, p) => x + p.stack, 0n);
          expect(onTable + potTotal(s)).toBe(start);
          expect(s.seats.every((p) => p.stack >= 0n)).toBe(true);
        }
        const dealt = [...s.seats.flatMap((p) => p.hole), ...s.board];
        expect(new Set(dealt).size).toBe(dealt.length);
        if (s.status === "showdown") expect(s.board).toHaveLength(5);
        if (s.status === "complete") expect(s.seats.filter((p) => !p.folded)).toHaveLength(1);
      }),
      { numRuns: 1_000 },
    );
  });
});
