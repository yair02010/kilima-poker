/**
 * Settlement differential: random complete hands played by the engine; uncalled bets, pots, rake and the
 * amounts won must equal poker_reference.py (return_uncalled, build_pots, compute_rake, distribute).
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  type Action,
  applyAction,
  type Card,
  createHand,
  DECK_36,
  DECK_52,
  formatCards,
  type Game,
  handResult,
  type HandResult,
  type HandState,
  legalActions,
  type Structure,
} from "../../src/index.js";
import { seeded } from "./seeded.js";

interface Played {
  state: HandState;
  result: HandResult;
  sbt: boolean;
}

export function playToEnd(seed: number): Played {
  const next = seeded(seed);
  const game = (["nlhe", "nlhe", "plo4", "plo5", "shortdeck"] as Game[])[next(5)]!;
  const structure: Structure = game.startsWith("plo") ? "PL" : next(2) ? "NL" : "PL";
  const n = 2 + next(game === "plo5" ? 7 : 8);
  const sbt = game === "shortdeck" && next(3) === 0;
  const deck: Card[] = [...(game === "shortdeck" ? DECK_36 : DECK_52)];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = next(i + 1);
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }
  const rake =
    next(3) === 0
      ? undefined
      : { percentBp: [250, 500, 700][next(3)]!, cap: BigInt([0, 30, 300, 100_000][next(4)]!) };
  const ante = next(4) === 0 ? 10n : 0n;
  const players = Array.from({ length: n }, (_, i) => ({
    seatNo: i + 1,
    stack: next(4) === 0 ? BigInt(1 + next(400)) : BigInt(200 * (5 + next(100))),
  }));
  let s = createHand(
    {
      game,
      structure,
      smallBlind: 50n,
      bigBlind: 100n,
      ...(ante ? { ante } : {}),
      ...(rake ? { rake } : {}),
      ...(sbt ? { straightBeatsTrips: true } : {}),
    },
    players,
    n === 2 ? 1 : n,
    deck,
  ).state;
  for (let guard = 0; s.status === "betting" && guard < 400; guard++) {
    const legal = legalActions(s)!;
    const opts: Action[] = [];
    if (legal.fold) opts.push({ type: "fold" });
    if (legal.check) opts.push({ type: "check" }, { type: "check" });
    if (legal.call !== null) opts.push({ type: "call" }, { type: "call" }, { type: "call" });
    if (legal.raise && legal.betOrRaise) {
      opts.push(
        { type: legal.betOrRaise, to: legal.raise.minTo },
        { type: legal.betOrRaise, to: legal.raise.maxTo },
      );
    }
    const r = applyAction(s, legal.seatNo, opts[next(opts.length)]!);
    if (!r.ok) throw new Error(r.message);
    s = r.state;
  }
  return { state: s, result: handResult(s), sbt };
}

const BRIDGE = fileURLToPath(new URL("./settle_bridge.py", import.meta.url));

interface RefSettle {
  returned: Record<string, number>;
  pots: { amount: number; eligible: number[] }[];
  rake: number;
  perPot: number[];
  won: Record<string, number>;
}

export function compareSettlement(
  hands: number,
  seed = 1,
): { hands: number; showdowns: number; mismatches: string[] } {
  const played = Array.from({ length: hands }, (_, k) => playToEnd(seed * 7_919 + k));
  const input = played.map(({ state: s, result, sbt }) => {
    const order =
      s.seats.length === 2 ? [s.seats[1]!.seatNo, s.seats[0]!.seatNo] : s.seats.map((p) => p.seatNo);
    return {
      game: s.config.game,
      sbt,
      status: result.status,
      contrib: Object.fromEntries(s.seats.map((p) => [String(p.seatNo), Number(p.committed)])),
      folded: s.seats.filter((p) => p.folded).map((p) => p.seatNo),
      holes: Object.fromEntries(s.seats.map((p) => [String(p.seatNo), formatCards(p.hole)])),
      board: formatCards(s.board),
      rakeBp: s.config.rake?.percentBp ?? null,
      cap: s.config.rake ? Number(s.config.rake.cap) : null,
      sawFlop: s.board.length >= 3,
      order,
    };
  });
  const res = spawnSync("python3", [BRIDGE], {
    input: JSON.stringify(input),
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  });
  if (res.status !== 0) throw new Error(`settle bridge failed: ${res.stderr || String(res.error)}`);
  const ref = JSON.parse(res.stdout) as RefSettle[];
  const mismatches: string[] = [];
  let showdowns = 0;
  played.forEach(({ state: s, result }, h) => {
    if (result.status === "showdown") showdowns++;
    const r = ref[h]!;
    const mine = {
      returned: Object.fromEntries(result.returned.map((x) => [String(x.seatNo), Number(x.amount)])),
      pots: result.pots.map((p) => ({ amount: Number(p.amount), eligible: p.eligible })),
      rake: Number(result.rake.total),
      perPot: result.pots.map((p) => Number(p.rake)),
      won: Object.fromEntries(
        result.seats.filter((x) => x.won > 0n).map((x) => [String(x.seatNo), Number(x.won)]),
      ),
    };
    const theirs = { ...r, won: Object.fromEntries(Object.entries(r.won).filter(([, v]) => v > 0)) };
    const sort = (o: Record<string, number>) => JSON.stringify(Object.entries(o).sort());
    const same =
      sort(mine.returned) === sort(theirs.returned) &&
      JSON.stringify(mine.pots) === JSON.stringify(theirs.pots) &&
      mine.rake === theirs.rake &&
      JSON.stringify(mine.perPot) === JSON.stringify(theirs.perPot) &&
      sort(mine.won) === sort(theirs.won);
    const start = result.seats.reduce((x, p) => x + p.stackStart, 0n);
    const end = result.seats.reduce((x, p) => x + p.stackEnd, 0n) + result.rake.total;
    if (!same)
      mismatches.push(
        `hand ${h} (${s.config.game}): engine ${JSON.stringify(mine)} vs reference ${JSON.stringify(theirs)}`,
      );
    if (start !== end) mismatches.push(`hand ${h}: chips not conserved ${start} → ${end}`);
  });
  return { hands, showdowns, mismatches };
}
