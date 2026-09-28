/**
 * Hand invariants (KP-ENG-06 §13, WP-06 slice 3). One random hand is generated from a seed, played with
 * random legal actions (and random illegal attempts), and checked after every step and at settlement:
 *  - chips are conserved (stacks + committed = start; final stacks + rake = start)
 *  - no negative stacks or contributions
 *  - only legal actions are accepted; a rejected action leaves the state untouched
 *  - the hand terminates; showdown has a full board; fold-out has one live player
 *  - every card is dealt at most once
 *  - no pot is awarded to a folded player or to a seat that is not eligible
 *  - rake: zero without a flop, never above the cap or the percentage
 * Randomness here is a seeded generator for test data only (never game randomness).
 */
import {
  type Action,
  applyAction,
  type Card,
  createHand,
  DECK_36,
  DECK_52,
  type Game,
  handResult,
  type HandState,
  legalActions,
  potTotal,
  type Structure,
  type TableConfig,
} from "../../src/index.js";
import { seeded } from "../differential/seeded.js";

export interface HandReport {
  actions: number;
  illegalTried: number;
  status: "showdown" | "complete";
  game: Game;
  /** Nanoseconds spent in applyAction per accepted action. */
  applyNs: number[];
}

export class InvariantError extends Error {
  constructor(seed: number, message: string) {
    super(`seed ${seed}: ${message}`);
    this.name = "InvariantError";
  }
}

const GAMES: Game[] = ["nlhe", "nlhe", "nlhe", "plo4", "plo4", "plo5", "plo6", "shortdeck"];

function randomConfig(next: (n: number) => number): { config: TableConfig; n: number } {
  const game = GAMES[next(GAMES.length)]!;
  const maxPlayers = game === "plo6" ? 6 : game === "plo5" ? 8 : 9;
  const n = 2 + next(maxPlayers - 1);
  const structure: Structure = game.startsWith("plo") ? "PL" : next(3) === 0 ? "PL" : "NL";
  const bb = BigInt([2, 10, 100, 200, 1000][next(5)]!);
  const antes = next(5);
  const config: TableConfig = {
    game,
    structure,
    smallBlind: bb / 2n,
    bigBlind: bb,
    ...(antes === 1 ? { ante: bb / 2n } : antes === 2 ? { bigBlindAnte: bb } : {}),
    ...(next(3) !== 0
      ? { rake: { percentBp: [0, 250, 500, 1000][next(4)]!, cap: bb * BigInt(next(6)) } }
      : {}),
    ...(game === "shortdeck" && next(2) === 0 ? { straightBeatsTrips: true } : {}),
  };
  return { config, n };
}

function randomIllegal(s: HandState, next: (n: number) => number): { seat: number; action: Action } {
  const legal = legalActions(s)!;
  const other = s.seats[next(s.seats.length)]!.seatNo;
  const candidates: { seat: number; action: Action }[] = [
    { seat: other === legal.seatNo ? legal.seatNo + 100 : other, action: { type: "call" } },
    { seat: legal.seatNo, action: { type: "raise", to: -1n } },
    { seat: legal.seatNo, action: { type: "bet", to: (legal.raise?.maxTo ?? s.currentBet) + 1n } },
  ];
  if (!legal.check) candidates.push({ seat: legal.seatNo, action: { type: "check" } });
  if (legal.check) candidates.push({ seat: legal.seatNo, action: { type: "fold" } });
  if (legal.raise)
    candidates.push({ seat: legal.seatNo, action: { type: legal.betOrRaise!, to: legal.raise.minTo - 1n } });
  return candidates[next(candidates.length)]!;
}

function pickLegal(s: HandState, next: (n: number) => number): Action {
  const legal = legalActions(s)!;
  const opts: Action[] = [];
  if (legal.fold) opts.push({ type: "fold" });
  if (legal.check) opts.push({ type: "check" }, { type: "check" });
  if (legal.call !== null) opts.push({ type: "call" }, { type: "call" });
  if (legal.raise && legal.betOrRaise) {
    const { minTo, maxTo } = legal.raise;
    const t = legal.betOrRaise;
    const span = maxTo - minTo;
    const mid = span > 0n ? minTo + BigInt(next(Number(span > 1_000_000n ? 1_000_000n : span) + 1)) : minTo;
    opts.push({ type: t, to: minTo }, { type: t, to: mid }, { type: t, to: maxTo });
  }
  const p = s.seats[s.toAct!]!;
  if (legal.raise || (legal.call !== null && p.stack <= legal.call)) opts.push({ type: "allin" });
  return opts[next(opts.length)]!;
}

const same = (a: HandState, b: HandState) =>
  JSON.stringify(a, (_, v: unknown) => (typeof v === "bigint" ? `${v}n` : v)) ===
  JSON.stringify(b, (_, v: unknown) => (typeof v === "bigint" ? `${v}n` : v));

export function checkHand(seed: number, opts: { timing?: boolean; illegalEvery?: number } = {}): HandReport {
  const next = seeded(seed);
  const fail = (m: string): never => {
    throw new InvariantError(seed, m);
  };
  const { config, n } = randomConfig(next);
  const deck: Card[] = [...(config.game === "shortdeck" ? DECK_36 : DECK_52)];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = next(i + 1);
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  const bb = config.bigBlind;
  const players = Array.from({ length: n }, (_, i) => ({
    seatNo: i + 1,
    stack: next(5) === 0 ? 1n + BigInt(next(Number(bb) * 3)) : bb * BigInt(5 + next(300)),
  }));
  const start = players.reduce((x, p) => x + p.stack, 0n);
  let s = createHand(config, players, players[next(n)]!.seatNo, deck).state;
  const applyNs: number[] = [];
  let actions = 0;
  let illegalTried = 0;
  const illegalEvery = opts.illegalEvery ?? 4;

  const conserve = (where: string) => {
    let sum = 0n;
    for (const p of s.seats) {
      if (p.stack < 0n || p.committed < 0n || p.streetBet < 0n)
        fail(`${where}: negative amount at seat ${p.seatNo}`);
      sum += p.stack;
    }
    if (sum + potTotal(s) !== start) fail(`${where}: chips not conserved`);
  };
  conserve("start");

  while (s.status === "betting") {
    if (actions > 1_000) fail("hand did not terminate");
    if (next(illegalEvery) === 0) {
      const { seat, action } = randomIllegal(s, next);
      const r = applyAction(s, seat, action);
      illegalTried++;
      if (r.ok) fail(`illegal action accepted: ${action.type} by ${seat}`);
    }
    const legal = legalActions(s);
    if (!legal) fail("betting without a player to act");
    const before = s;
    const a = pickLegal(s, next);
    const t0 = opts.timing ? process.hrtime.bigint() : 0n;
    const r = applyAction(s, legal!.seatNo, a);
    if (opts.timing) applyNs.push(Number(process.hrtime.bigint() - t0));
    if (!r.ok) fail(`legal action rejected: ${a.type} (${r.code} ${r.message})`);
    if (!same(before, s)) fail("input state was mutated");
    s = r.ok ? r.state : s;
    actions++;
    conserve(`after action ${actions}`);
  }

  const dealt = [...s.seats.flatMap((p) => p.hole), ...s.board];
  if (new Set(dealt).size !== dealt.length) fail("a card was dealt twice");
  if (s.status === "showdown" && s.board.length !== 5) fail("showdown without a full board");
  const live = s.seats.filter((p) => !p.folded);
  if (s.status === "complete" && live.length !== 1) fail("complete with more than one live player");

  const result = handResult(s);
  const end = result.seats.reduce((x, p) => x + p.stackEnd, 0n) + result.rake.total;
  if (end !== start) fail(`settlement not conserved: ${start} → ${end}`);
  const folded = new Set(s.seats.filter((p) => p.folded).map((p) => p.seatNo));
  for (const pot of result.pots) {
    for (const w of pot.winners) {
      if (folded.has(w.seatNo)) fail("pot awarded to a folded player");
      if (!pot.eligible.includes(w.seatNo)) fail("pot awarded to an ineligible seat");
    }
    const paid = pot.winners.reduce((x, w) => x + w.amount, 0n);
    if (paid + pot.rake !== pot.amount) fail("pot not fully paid");
  }
  const potSum = result.pots.reduce((x, p) => x + p.amount, 0n);
  const rakeCfg = config.rake;
  if (s.board.length < 3 && result.rake.total !== 0n) fail("rake without a flop");
  if (rakeCfg && result.rake.total > rakeCfg.cap) fail("rake above the cap");
  if (rakeCfg && result.rake.total > (potSum * BigInt(rakeCfg.percentBp)) / 10_000n)
    fail("rake above the percentage");
  if (!rakeCfg && result.rake.total !== 0n) fail("rake without a rake configuration");
  if (result.returned.length > 1) fail("more than one uncalled bet returned");

  return { actions, illegalTried, status: result.status, game: config.game, applyNs };
}
