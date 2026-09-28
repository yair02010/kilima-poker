/**
 * Hand state types (KP-HBK-11 §3, KP-ENG-06 §3–§6). Amounts are bigint minor units (ADR-0005).
 */
import type { Card } from "../cards.js";
import type { Game } from "../eval/game.js";

export type Structure = "NL" | "PL";
export type Street = "preflop" | "flop" | "turn" | "river" | "showdown";
/** betting: a player must act · showdown: all betting done, cards to be compared · complete: one player left. */
export type HandStatus = "betting" | "showdown" | "complete";

export interface TableConfig {
  game: Game;
  structure: Structure;
  smallBlind: bigint;
  bigBlind: bigint;
  /** Ante paid by every player (dead money). */
  ante?: bigint;
  /** Big-blind ante: the big blind pays this ante for the whole table (tournaments). */
  bigBlindAnte?: bigint;
}

export interface PlayerInput {
  /** Table seat number 1–9 (clockwise). */
  seatNo: number;
  stack: bigint;
}

export interface SeatState {
  readonly seatNo: number;
  readonly stack: bigint;
  /** Chips put in on the current street (live bets only; antes excluded). */
  readonly streetBet: bigint;
  /** All chips put in this hand, antes included. */
  readonly committed: bigint;
  readonly folded: boolean;
  readonly allIn: boolean;
  /** The current bet this player last acted on this street; null = has not acted (KP-HBK-11 §3). */
  readonly actedLevel: bigint | null;
  readonly hole: readonly Card[];
}

export type ActionType = "fold" | "check" | "call" | "bet" | "raise" | "allin";

export type Action =
  | { type: "fold" }
  | { type: "check" }
  | { type: "call" }
  | { type: "bet"; to: bigint }
  | { type: "raise"; to: bigint }
  | { type: "allin" };

export interface ActionRecord {
  readonly street: Street;
  readonly seatNo: number;
  readonly type: ActionType | "post_sb" | "post_bb" | "post_ante" | "timeout_check" | "timeout_fold";
  /** Chips moved by this action. */
  readonly amount: bigint;
  /** Street total of the player after the action. */
  readonly to: bigint;
}

export interface HandState {
  readonly config: TableConfig;
  /** Full ordered deck from the rng service. Never sent to clients. */
  readonly deck: readonly Card[];
  readonly deckIndex: number;
  /** Seats in acting order: index 0 = first seat left of the button (heads-up: the button). */
  readonly seats: readonly SeatState[];
  readonly buttonSeatNo: number;
  readonly street: Street;
  readonly status: HandStatus;
  readonly board: readonly Card[];
  readonly currentBet: bigint;
  /** Size of the last full bet or raise on this street (minimum raise increment). */
  readonly lastFullRaise: bigint;
  /** Index into `seats` of the player to act, or null. */
  readonly toAct: number | null;
  readonly actions: readonly ActionRecord[];
}

export interface LegalActions {
  seatNo: number;
  fold: boolean;
  check: boolean;
  /** Amount to call, or null when there is nothing to call. */
  call: bigint | null;
  /** Street totals allowed for a bet/raise, or null when raising is not allowed. */
  raise: { minTo: bigint; maxTo: bigint } | null;
  betOrRaise: "bet" | "raise" | null;
}

export type HandEvent =
  | { type: "hand_started"; buttonSeatNo: number; seats: { seatNo: number; stack: bigint }[] }
  | { type: "hole_cards"; seatNo: number; cards: readonly Card[] }
  | { type: "action"; record: ActionRecord }
  | { type: "street_dealt"; street: Street; cards: readonly Card[]; board: readonly Card[] }
  | { type: "to_act"; seatNo: number; legal: LegalActions }
  | { type: "betting_complete"; status: HandStatus };

export type EngineErrorCode = "ILLEGAL_ACTION" | "ILLEGAL_AMOUNT" | "NOT_YOUR_TURN" | "HAND_NOT_IN_BETTING";

export interface EngineError {
  ok: false;
  code: EngineErrorCode;
  message: string;
}

export interface EngineOk {
  ok: true;
  state: HandState;
  events: HandEvent[];
}

export type EngineResult = EngineOk | EngineError;
