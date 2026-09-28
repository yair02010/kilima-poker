/**
 * The hand state machine (KP-ENG-06 §4–§6, KP-HBK-11 §3): start → antes and blinds → dealing →
 * betting rounds → run-out → showdown / complete. A pure reducer: inputs are never mutated and every
 * call returns a new state. Ported from the betting model of poker_reference.py (class Hand).
 *
 * Pots, rake and awarding the pot are WP-06 slice 2.
 */
import { type Card, DECK_36, DECK_52 } from "../cards.js";
import { HOLE_CARDS } from "../eval/game.js";
import type {
  Action,
  ActionRecord,
  EngineError,
  EngineErrorCode,
  EngineOk,
  EngineResult,
  HandEvent,
  HandState,
  LegalActions,
  PlayerInput,
  SeatState,
  Street,
  TableConfig,
} from "./types.js";

type MutableSeat = { -readonly [K in keyof SeatState]: SeatState[K] };
interface Draft {
  config: TableConfig;
  deck: readonly Card[];
  deckIndex: number;
  seats: MutableSeat[];
  buttonSeatNo: number;
  street: Street;
  status: HandState["status"];
  board: Card[];
  currentBet: bigint;
  lastFullRaise: bigint;
  toAct: number | null;
  actions: ActionRecord[];
}

const NEXT_STREET: Record<Street, Street> = {
  preflop: "flop",
  flop: "turn",
  turn: "river",
  river: "showdown",
  showdown: "showdown",
};
const BOARD_CARDS: Record<Street, number> = { preflop: 0, flop: 3, turn: 1, river: 1, showdown: 0 };

const min = (a: bigint, b: bigint): bigint => (a < b ? a : b);
const fail = (code: EngineErrorCode, message: string): EngineError => ({ ok: false, code, message });

function draftOf(s: HandState): Draft {
  return {
    ...s,
    seats: s.seats.map((x) => ({ ...x })),
    board: [...s.board],
    actions: [...s.actions],
  };
}

function freeze(d: Draft): HandState {
  return { ...d, seats: d.seats.map((x) => ({ ...x })), board: [...d.board], actions: [...d.actions] };
}

// ---------------------------------------------------------------------------------------------------
// Seat helpers — index 0 is the small blind (heads-up: the button, who posts the small blind).
// ---------------------------------------------------------------------------------------------------

/** Element access that fails loudly instead of returning undefined (indexes come from the state itself). */
function must<T>(v: T | undefined, what: string): T {
  if (v === undefined) throw new RangeError(`engine invariant broken: missing ${what}`);
  return v;
}
function seatAt<S extends { seats: readonly unknown[] }>(s: S, i: number): S["seats"][number] {
  return must(s.seats[i] as S["seats"][number] | undefined, `seat index ${i}`);
}

const canAct = (p: MutableSeat | SeatState): boolean => !p.folded && !p.allIn;

function nextActive(d: Draft, i: number): number | null {
  const n = d.seats.length;
  for (let k = 1; k <= n; k++) {
    const j = (i + k) % n;
    if (canAct(seatAt(d, j))) return j;
  }
  return null;
}

const headsUp = (d: Draft): boolean => d.seats.length === 2;

function firstPreflop(d: Draft): number | null {
  if (headsUp(d)) return canAct(seatAt(d, 0)) ? 0 : nextActive(d, 0);
  return nextActive(d, 1);
}

function firstPostflop(d: Draft): number | null {
  // Heads-up: the big blind (non-button) acts first after the flop. Otherwise first active left of the button.
  return headsUp(d) ? nextActive(d, 0) : nextActive(d, d.seats.length - 1);
}

function put(d: Draft, i: number, amount: bigint, dead = false): bigint {
  const p = seatAt(d, i);
  const a = min(amount, p.stack);
  p.stack -= a;
  p.committed += a;
  if (!dead) p.streetBet += a;
  if (p.stack === 0n) p.allIn = true;
  return a;
}

function record(d: Draft, i: number, type: ActionRecord["type"], amount: bigint): ActionRecord {
  const p = seatAt(d, i);
  const r: ActionRecord = { street: d.street, seatNo: p.seatNo, type, amount, to: p.streetBet };
  d.actions.push(r);
  return r;
}

export function potTotal(s: Pick<HandState, "seats">): bigint {
  return s.seats.reduce((sum, p) => sum + p.committed, 0n);
}

// ---------------------------------------------------------------------------------------------------
// Legal actions (KP-ENG-06 §6.2–§6.5)
// ---------------------------------------------------------------------------------------------------

function legalFor(d: Draft | HandState, i: number): LegalActions {
  const p = seatAt(d, i);
  const toCall = min(d.currentBet - p.streetBet, p.stack);
  const reopened = p.actedLevel === null || d.currentBet - p.actedLevel >= d.lastFullRaise;
  const othersCanAct = d.seats.some((q, j) => j !== i && canAct(q));
  let raise: LegalActions["raise"] = null;
  if (p.stack > toCall && reopened && othersCanAct) {
    const allInTo = p.streetBet + p.stack;
    let minTo = d.currentBet > 0n ? d.currentBet + d.lastFullRaise : d.config.bigBlind;
    let maxTo = allInTo;
    if (d.config.structure === "PL") {
      const cap = d.currentBet + potTotal(d) + toCall;
      maxTo = min(maxTo, cap);
    }
    minTo = min(minTo, allInTo); // an all-in below the minimum is always allowed
    raise = { minTo, maxTo };
  }
  return {
    seatNo: p.seatNo,
    fold: toCall > 0n,
    check: toCall === 0n,
    call: toCall > 0n ? toCall : null,
    raise,
    betOrRaise: raise ? (d.currentBet === 0n ? "bet" : "raise") : null,
  };
}

/** Legal actions for the player to act, or null when nobody is to act. */
export function legalActions(s: HandState): LegalActions | null {
  return s.toAct === null ? null : legalFor(s, s.toAct);
}

// ---------------------------------------------------------------------------------------------------
// Dealing (KP-ENG-06 §4): hole cards one at a time clockwise from left of the button; burn + board.
// ---------------------------------------------------------------------------------------------------

function draw(d: Draft, count: number): Card[] {
  const out = d.deck.slice(d.deckIndex, d.deckIndex + count);
  if (out.length !== count) throw new RangeError("deck exhausted");
  d.deckIndex += count;
  return out;
}

function dealStreet(d: Draft, street: Street, events: HandEvent[]): void {
  const count = BOARD_CARDS[street];
  if (count === 0) return;
  draw(d, 1); // burn
  const cards = draw(d, count);
  d.board.push(...cards);
  events.push({ type: "street_dealt", street, cards, board: [...d.board] });
}

// ---------------------------------------------------------------------------------------------------
// Advancing (KP-ENG-06 §6.7)
// ---------------------------------------------------------------------------------------------------

function pending(d: Draft): number[] {
  const out: number[] = [];
  d.seats.forEach((q, j) => {
    if (canAct(q) && (q.actedLevel === null || q.streetBet < d.currentBet)) out.push(j);
  });
  return out;
}

function endBetting(d: Draft, status: "showdown" | "complete", events: HandEvent[]): void {
  d.toAct = null;
  d.status = status;
  events.push({ type: "betting_complete", status });
}

/** Moves to the next street(s) until someone must act, the hand is over, or showdown is reached. */
function startNextStreet(d: Draft, events: HandEvent[]): void {
  for (;;) {
    if (d.street === "river") {
      d.street = "showdown";
      endBetting(d, "showdown", events);
      return;
    }
    d.street = NEXT_STREET[d.street];
    for (const q of d.seats) {
      q.streetBet = 0n;
      q.actedLevel = null;
    }
    d.currentBet = 0n;
    d.lastFullRaise = d.config.bigBlind;
    dealStreet(d, d.street, events);
    const active = d.seats.filter(canAct).length;
    if (active <= 1) continue; // run-out: deal the rest without betting
    d.toAct = firstPostflop(d);
    announce(d, events);
    return;
  }
}

function announce(d: Draft, events: HandEvent[]): void {
  if (d.toAct !== null)
    events.push({ type: "to_act", seatNo: seatAt(d, d.toAct).seatNo, legal: legalFor(d, d.toAct) });
}

function advance(d: Draft, from: number, events: HandEvent[]): void {
  const live = d.seats.filter((q) => !q.folded);
  if (live.length === 1) {
    endBetting(d, "complete", events);
    return;
  }
  const waiting = pending(d);
  if (waiting.length === 0) {
    d.toAct = null;
    startNextStreet(d, events);
    return;
  }
  let next = nextActive(d, from);
  while (next !== null && !waiting.includes(next)) next = nextActive(d, next);
  d.toAct = next;
  announce(d, events);
}

// ---------------------------------------------------------------------------------------------------
// Public API (KP-ENG-06 §12)
// ---------------------------------------------------------------------------------------------------

/**
 * Starts a hand. `players` are the seats dealt in (any order); `buttonSeatNo` must be one of them.
 * The deck is the full ordered deck from the rng service.
 */
export function createHand(
  config: TableConfig,
  players: readonly PlayerInput[],
  buttonSeatNo: number,
  deck: readonly Card[],
): EngineOk {
  if (players.length < 2 || players.length > 9) throw new RangeError("a hand needs 2–9 players");
  if (new Set(players.map((p) => p.seatNo)).size !== players.length) throw new RangeError("duplicate seat");
  if (!players.some((p) => p.seatNo === buttonSeatNo)) throw new RangeError("button must be a dealt-in seat");
  if (players.some((p) => p.stack <= 0n)) throw new RangeError("every player needs chips");
  if (config.smallBlind < 0n || config.bigBlind <= 0n || config.smallBlind > config.bigBlind) {
    throw new RangeError("bad blinds");
  }
  const expected = config.game === "shortdeck" ? DECK_36.length : DECK_52.length;
  if (deck.length !== expected || new Set(deck).size !== expected)
    throw new RangeError(`deck must be ${expected} distinct cards`);

  // Clockwise order starting left of the button; heads-up starts at the button (button = small blind).
  const sorted = [...players].sort((a, b) => a.seatNo - b.seatNo);
  const b = sorted.findIndex((p) => p.seatNo === buttonSeatNo);
  const start = sorted.length === 2 ? b : (b + 1) % sorted.length;
  const ordered = sorted.map((_, k) => must(sorted[(start + k) % sorted.length], "player"));

  const d: Draft = {
    config,
    deck,
    deckIndex: 0,
    seats: ordered.map((p) => ({
      seatNo: p.seatNo,
      stack: p.stack,
      streetBet: 0n,
      committed: 0n,
      folded: false,
      allIn: false,
      actedLevel: null,
      hole: [],
    })),
    buttonSeatNo,
    street: "preflop",
    status: "betting",
    board: [],
    currentBet: 0n,
    lastFullRaise: config.bigBlind,
    toAct: null,
    actions: [],
  };
  const events: HandEvent[] = [
    { type: "hand_started", buttonSeatNo, seats: ordered.map((p) => ({ seatNo: p.seatNo, stack: p.stack })) },
  ];

  // Antes are dead money (not part of the street bet).
  const sbIndex = 0;
  const bbIndex = 1;
  d.seats.forEach((_, i) => {
    const ante = config.bigBlindAnte ? (i === bbIndex ? config.bigBlindAnte : 0n) : (config.ante ?? 0n);
    if (ante > 0n) events.push({ type: "action", record: record(d, i, "post_ante", put(d, i, ante, true)) });
  });
  if (config.smallBlind > 0n) {
    events.push({
      type: "action",
      record: record(d, sbIndex, "post_sb", put(d, sbIndex, config.smallBlind)),
    });
  }
  events.push({ type: "action", record: record(d, bbIndex, "post_bb", put(d, bbIndex, config.bigBlind)) });
  d.currentBet = config.bigBlind;

  // Hole cards: one at a time, clockwise from the seat left of the button.
  const n = d.seats.length;
  const firstDealt = n === 2 ? 1 : 0;
  const holes: Card[][] = d.seats.map(() => []);
  for (let round = 0; round < HOLE_CARDS[config.game]; round++) {
    for (let k = 0; k < n; k++) must(holes[(firstDealt + k) % n], "hole").push(...draw(d, 1));
  }
  d.seats.forEach((p, i) => {
    p.hole = must(holes[i], "hole");
    events.push({ type: "hole_cards", seatNo: p.seatNo, cards: p.hole });
  });

  d.toAct = firstPreflop(d);
  if (d.toAct === null || pending(d).length === 0) {
    d.toAct = null;
    startNextStreet(d, events);
  } else {
    announce(d, events);
  }
  return { ok: true, state: freeze(d), events };
}

/** Applies one player action. Returns a new state, or an error and leaves the state unchanged. */
export function applyAction(s: HandState, seatNo: number, action: Action): EngineResult {
  if (s.status !== "betting" || s.toAct === null) return fail("HAND_NOT_IN_BETTING", "no action is expected");
  const i = s.toAct;
  if (seatAt(s, i).seatNo !== seatNo) return fail("NOT_YOUR_TURN", `seat ${seatAt(s, i).seatNo} is to act`);
  const d = draftOf(s);
  const p = seatAt(d, i);
  const legal = legalFor(d, i);
  const events: HandEvent[] = [];

  switch (action.type) {
    case "fold":
      if (!legal.fold) return fail("ILLEGAL_ACTION", "cannot fold when checking is possible");
      p.folded = true;
      events.push({ type: "action", record: record(d, i, "fold", 0n) });
      break;
    case "check":
      if (!legal.check) return fail("ILLEGAL_ACTION", "cannot check facing a bet");
      events.push({ type: "action", record: record(d, i, "check", 0n) });
      break;
    case "call":
      if (legal.call === null) return fail("ILLEGAL_ACTION", "nothing to call");
      events.push({ type: "action", record: record(d, i, "call", put(d, i, legal.call)) });
      break;
    case "allin":
    case "bet":
    case "raise": {
      let to: bigint;
      if (action.type === "allin") {
        to = p.streetBet + p.stack;
        if (legal.raise === null) {
          // Without a raise option, all-in is only legal as a call for the whole stack.
          if (p.stack > (legal.call ?? 0n)) {
            return fail(
              "ILLEGAL_ACTION",
              legal.call === null
                ? "raising is not allowed; check instead"
                : "raising is not allowed; call instead",
            );
          }
          events.push({ type: "action", record: record(d, i, "allin", put(d, i, p.stack)) });
          p.actedLevel = d.currentBet;
          advance(d, i, events);
          return { ok: true, state: freeze(d), events };
        }
        if (d.config.structure === "PL") to = min(to, legal.raise.maxTo);
      } else {
        if (legal.raise === null)
          return fail("ILLEGAL_ACTION", "raising is not allowed (action not reopened)");
        if (legal.betOrRaise !== action.type) {
          return fail("ILLEGAL_ACTION", `use "${legal.betOrRaise ?? "call"}" here, not "${action.type}"`);
        }
        to = action.to;
      }
      const r = legal.raise;
      if (to < r.minTo || to > r.maxTo || to <= d.currentBet) {
        return fail("ILLEGAL_AMOUNT", `to must be in [${r.minTo}, ${r.maxTo}]`);
      }
      const increment = to - d.currentBet;
      const moved = put(d, i, to - p.streetBet);
      if (increment >= d.lastFullRaise) d.lastFullRaise = increment; // a full raise reopens the betting
      d.currentBet = to;
      events.push({ type: "action", record: record(d, i, action.type, moved) });
      break;
    }
  }
  p.actedLevel = d.currentBet;
  advance(d, i, events);
  return { ok: true, state: freeze(d), events };
}

/** Action timer expired (KP-ENG-06 §6.8): check if possible, otherwise fold. */
export function timeout(s: HandState, seatNo: number): EngineResult {
  const legal = legalActions(s);
  if (legal === null || legal.seatNo !== seatNo) return fail("NOT_YOUR_TURN", "no timer runs for this seat");
  const res = applyAction(s, seatNo, legal.check ? { type: "check" } : { type: "fold" });
  if (!res.ok) return res;
  // The timed-out action is the last record (advancing adds events, never action records).
  const actions = [...res.state.actions];
  const orig = must(actions[actions.length - 1], "timed-out action");
  const marked: ActionRecord = { ...orig, type: legal.check ? "timeout_check" : "timeout_fold" };
  actions[actions.length - 1] = marked;
  return {
    ok: true,
    state: { ...res.state, actions },
    events: res.events.map((e) =>
      e.type === "action" && e.record === orig ? { type: "action", record: marked } : e,
    ),
  };
}

export const isComplete = (s: HandState): boolean => s.status !== "betting";
