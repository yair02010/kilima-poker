/**
 * Hand result (KP-ENG-06 §7, §9–§10, §12 `result(state)`): uncalled bets, pots, rake, winners, final stacks
 * and the showdown order. Pure: computed from a finished HandState.
 */
import type { Card } from "../cards.js";
import { evaluateHand } from "../eval/game.js";
import type { Category } from "../rules/ranking.js";
import { buildPots, computeRake, distribute, returnUncalled } from "./pots.js";
import type { HandState, SeatState } from "./types.js";

export interface SeatResult {
  seatNo: number;
  stackStart: bigint;
  committed: bigint;
  returned: bigint;
  won: bigint;
  stackEnd: bigint;
  folded: boolean;
  /** Hole cards are exposed (winner at showdown, or all-in showdown). Others may muck. */
  mustShow: boolean;
  category?: Category;
  best5?: readonly Card[];
}

export interface PotResult {
  amount: bigint;
  eligible: number[];
  rake: bigint;
  winners: { seatNo: number; amount: bigint }[];
}

export interface HandResult {
  status: "showdown" | "complete";
  returned: { seatNo: number; amount: bigint }[];
  pots: PotResult[];
  rake: { total: bigint; percentBp: number; cap: bigint };
  seats: SeatResult[];
  /** Seats in the order they show down (§7); empty when the hand ended without showdown. */
  showOrder: number[];
}

/** Seats clockwise starting with the first seat left of the button. */
function orderFromButton(s: HandState): SeatState[] {
  const [first, second] = s.seats;
  return s.seats.length === 2 && first && second ? [second, first] : [...s.seats];
}

function showOrder(s: HandState, live: SeatState[]): number[] {
  if (s.status !== "showdown") return [];
  const order = orderFromButton(s).filter((p) => live.includes(p));
  // Last aggressor on the river shows first (§7); otherwise the first active seat left of the button.
  let aggressor: number | null = null;
  let high = 0n;
  for (const a of s.actions) {
    if (a.street !== "river") continue;
    const raising = a.type === "bet" || a.type === "raise" || (a.type === "allin" && a.to > high);
    if (raising) aggressor = a.seatNo;
    if (a.to > high) high = a.to;
  }
  const start = Math.max(
    0,
    order.findIndex((p) => p.seatNo === aggressor),
  );
  return [...order.slice(start), ...order.slice(0, start)].map((p) => p.seatNo);
}

export function handResult(s: HandState): HandResult {
  if (s.status === "betting") throw new RangeError("the hand is still in betting");
  const status = s.status;
  const live = s.seats.filter((p) => !p.folded);

  const contributions = new Map(s.seats.map((p) => [p.seatNo, p.committed]));
  const { contrib, returned } = returnUncalled(contributions);
  const folded = new Set(s.seats.filter((p) => p.folded).map((p) => p.seatNo));
  const pots = buildPots(contrib, folded);
  const sawFlop = s.board.length >= 3;
  const rake = computeRake(pots, s.config.rake, sawFlop);

  const evals = new Map<number, ReturnType<typeof evaluateHand>>();
  const strengths = new Map<number, number>();
  if (status === "showdown") {
    for (const p of live) {
      const e = evaluateHand(s.config.game, p.hole, s.board, {
        straightBeatsTrips: s.config.straightBeatsTrips ?? false,
      });
      evals.set(p.seatNo, e);
      strengths.set(p.seatNo, e.value);
    }
  } else {
    for (const p of live) strengths.set(p.seatNo, 0);
  }
  const order = orderFromButton(s).map((p) => p.seatNo);
  const { won, awards } = distribute(pots, rake.perPot, strengths, order);

  const allInShowdown = status === "showdown" && live.some((p) => p.allIn);
  const winners = new Set(awards.flatMap((a) => a.winners));
  const seats: SeatResult[] = s.seats.map((p) => {
    const back = returned.get(p.seatNo) ?? 0n;
    const gain = won.get(p.seatNo) ?? 0n;
    const e = evals.get(p.seatNo);
    return {
      seatNo: p.seatNo,
      stackStart: p.stack + p.committed,
      committed: p.committed,
      returned: back,
      won: gain,
      stackEnd: p.stack + back + gain,
      folded: p.folded,
      mustShow: status === "showdown" && !p.folded && (allInShowdown || winners.has(p.seatNo)),
      ...(e ? { category: e.category, best5: e.best5 } : {}),
    };
  });

  return {
    status,
    returned: [...returned.entries()].map(([seatNo, amount]) => ({ seatNo, amount })),
    pots: awards.map((a) => ({
      amount: a.pot.amount,
      eligible: a.pot.eligible,
      rake: a.rake,
      winners: a.winners.map((w) => ({ seatNo: w, amount: a.won.get(w) ?? 0n })),
    })),
    rake: { total: rake.rake, percentBp: s.config.rake?.percentBp ?? 0, cap: s.config.rake?.cap ?? 0n },
    seats,
    showOrder: showOrder(s, live),
  };
}
