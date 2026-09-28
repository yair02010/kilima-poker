import { describe, expect, it } from "vitest";
import {
  type Action,
  applyAction,
  type Card,
  createHand,
  DECK_52,
  handResult,
  type HandState,
  legalActions,
  parseCards,
  type TableConfig,
} from "../../src/index.js";

const NL: TableConfig = {
  game: "nlhe",
  structure: "NL",
  smallBlind: 50n,
  bigBlind: 100n,
  rake: { percentBp: 500, cap: 300n },
};

/** Builds a deck that deals the given hole cards (in seat order from left of the button) and board. */
function stacked(holes: string[], board: string): Card[] {
  const n = holes.length;
  const hc = holes.map((h) => parseCards(h));
  const dealt: Card[] = [];
  const first = n === 2 ? 1 : 0;
  for (let r = 0; r < 2; r++) for (let k = 0; k < n; k++) dealt.push(hc[(first + k) % n]![r]!);
  const b = parseCards(board);
  const used = new Set([...dealt, ...b]);
  const spare = DECK_52.filter((c) => !used.has(c));
  const deck = [...dealt, spare[0]!, b[0]!, b[1]!, b[2]!, spare[1]!, b[3]!, spare[2]!, b[4]!];
  return [...deck, ...spare.slice(3)];
}

function play(s: HandState, actions: Action[]): HandState {
  for (const a of actions) {
    const r = applyAction(s, legalActions(s)!.seatNo, a);
    if (!r.ok) throw new Error(r.message);
    s = r.state;
  }
  return s;
}

describe("handResult", () => {
  it("fold before the flop: no rake, uncalled raise returned, winner does not show", () => {
    let s = createHand(
      NL,
      [1, 2, 3].map((seatNo) => ({ seatNo, stack: 10_000n })),
      3,
      DECK_52,
    ).state;
    s = play(s, [{ type: "raise", to: 300n }, { type: "fold" }, { type: "fold" }]);
    const r = handResult(s);
    expect(r.status).toBe("complete");
    expect(r.rake.total).toBe(0n);
    expect(r.returned).toEqual([{ seatNo: 3, amount: 200n }]);
    expect(r.pots).toEqual([
      { amount: 250n, eligible: [3], rake: 0n, winners: [{ seatNo: 3, amount: 250n }] },
    ]);
    expect(r.seats.find((x) => x.seatNo === 3)).toMatchObject({ stackEnd: 10_150n, mustShow: false });
    expect(r.showOrder).toEqual([]);
  });

  it("showdown: best hand wins the pot minus rake; hands are evaluated from hole + board", () => {
    // order: seat 1 (SB), 2 (BB), 3 (button)
    const deck = stacked(["Ah Ad", "Kh Kd", "2c 7s"], "As 9c 5h 3d Jc");
    let s = createHand(
      NL,
      [1, 2, 3].map((seatNo) => ({ seatNo, stack: 1_000n })),
      3,
      deck,
    ).state;
    s = play(s, [{ type: "call" }, { type: "call" }, { type: "check" }]);
    while (s.status === "betting") s = play(s, [{ type: "check" }]);
    const r = handResult(s);
    expect(r.status).toBe("showdown");
    expect(r.rake.total).toBe(15n); // 5 % of 300
    const winner = r.seats.find((x) => x.seatNo === 1)!;
    expect(winner).toMatchObject({
      won: 285n,
      stackEnd: 1_185n,
      category: "three_of_a_kind",
      mustShow: true,
    });
    expect(r.seats.find((x) => x.seatNo === 2)!.mustShow).toBe(false); // loser may muck
    expect(r.showOrder).toEqual([1, 2, 3]); // no river bet: first active left of the button
  });

  it("split pot: odd unit to the first winner left of the button", () => {
    const deck = stacked(["2c 3d", "4c 5d"], "Ah Kh Qh Jh Th"); // heads-up: seat 1 button, both play the board
    let s = createHand(
      { ...NL, rake: { percentBp: 0, cap: 0n } },
      [
        { seatNo: 1, stack: 1_000n },
        { seatNo: 2, stack: 1_000n },
      ],
      1,
      deck,
    ).state;
    s = play(s, [{ type: "raise", to: 301n }, { type: "call" }]);
    while (s.status === "betting") s = play(s, [{ type: "check" }]);
    const r = handResult(s);
    expect(r.pots[0]!.amount).toBe(602n);
    expect(r.seats.find((x) => x.seatNo === 2)!.won).toBe(301n); // BB is first left of the button
    expect(r.seats.find((x) => x.seatNo === 1)!.won).toBe(301n);
  });

  it("all-ins of different sizes build side pots; all live hands are exposed", () => {
    const deck = stacked(["Ah Ad", "Kh Kd", "Qh Qd"], "2s 7c 9d Tc 3h");
    let s = createHand(
      NL,
      [
        { seatNo: 1, stack: 1_000n },
        { seatNo: 2, stack: 3_000n },
        { seatNo: 3, stack: 5_000n },
      ],
      3,
      deck,
    ).state;
    s = play(s, [{ type: "allin" }, { type: "allin" }, { type: "call" }]);
    const r = handResult(s);
    expect(r.pots.map((p) => [p.amount, p.eligible])).toEqual([
      [3_000n, [1, 2, 3]],
      [4_000n, [2, 3]],
    ]);
    expect(r.returned).toEqual([{ seatNo: 3, amount: 2_000n }]);
    expect(r.seats.every((x) => x.mustShow)).toBe(true);
    // rake 300 (cap): floor 128 / 171, remaining unit to the main pot → 129 / 171
    expect(r.pots.map((p) => p.rake)).toEqual([129n, 171n]);
    const total = r.seats.reduce((x, p) => x + p.stackEnd, 0n) + r.rake.total;
    expect(total).toBe(9_000n);
  });

  it("last aggressor on the river shows first", () => {
    const deck = stacked(["Ah Ad", "Kh Kd", "Qh Qd"], "2s 7c 9d Tc 3h");
    let s = createHand(
      NL,
      [1, 2, 3].map((seatNo) => ({ seatNo, stack: 10_000n })),
      3,
      deck,
    ).state;
    s = play(s, [{ type: "call" }, { type: "call" }, { type: "check" }]);
    s = play(s, [{ type: "check" }, { type: "check" }, { type: "check" }]); // flop
    s = play(s, [{ type: "check" }, { type: "check" }, { type: "check" }]); // turn
    s = play(s, [{ type: "check" }, { type: "bet", to: 200n }, { type: "call" }, { type: "call" }]); // river
    expect(handResult(s).showOrder).toEqual([2, 3, 1]);
  });

  it("refuses a hand still in betting", () => {
    const s = createHand(
      NL,
      [1, 2].map((seatNo) => ({ seatNo, stack: 1_000n })),
      1,
      DECK_52,
    ).state;
    expect(() => handResult(s)).toThrow(/betting/);
  });
});
