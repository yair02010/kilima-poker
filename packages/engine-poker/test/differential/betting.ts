/**
 * Betting differential: random legal action sequences played by the engine and replayed in the
 * reference betting model (poker_reference.Hand); legal actions must agree at every step.
 */
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  type Action,
  applyAction,
  createHand,
  DECK_52,
  type HandState,
  legalActions,
  type LegalActions,
  potTotal,
  type Structure,
} from "../../src/index.js";
import { seeded } from "./seeded.js";

export interface BettingCase {
  stacks: number[];
  sb: number;
  bb: number;
  structure: Structure;
  // eslint-disable-next-line kilima/no-float-money -- integer JSON exchanged with poker_reference.py
  ante: number;
  // eslint-disable-next-line kilima/no-float-money -- integer JSON exchanged with poker_reference.py
  bbAnte: number;
  actions: [string, number | null][];
}

interface RefStep {
  toAct: number | null;
  legal: {
    fold: boolean;
    check: boolean;
    call: number | null;
    raise: { min_to: number; max_to: number } | null;
  };
}
interface RefResult {
  steps: RefStep[];
  end: string | null;
  // eslint-disable-next-line kilima/no-float-money -- integer JSON exchanged with poker_reference.py
  pot: number;
  stacks: number[];
}

function pick(legal: LegalActions, stack: bigint, next: (n: number) => number): Action {
  const options: Action[] = [];
  if (legal.fold) options.push({ type: "fold" });
  if (legal.check) options.push({ type: "check" }, { type: "check" });
  if (legal.call !== null) options.push({ type: "call" }, { type: "call" });
  if (legal.raise && legal.betOrRaise) {
    const { minTo, maxTo } = legal.raise;
    const span = Number(maxTo - minTo);
    const t = legal.betOrRaise;
    options.push(
      { type: t, to: minTo },
      { type: t, to: maxTo },
      { type: t, to: minTo + BigInt(next(span + 1)) },
    );
  }
  if (legal.raise || (legal.call !== null && stack <= legal.call)) options.push({ type: "allin" });
  return options[next(options.length)]!;
}

/** Plays one random hand with the engine; returns the case (for the reference) and engine snapshots. */
export function playRandom(seed: number): {
  c: BettingCase;
  steps: (LegalActions | null)[];
  final: HandState;
} {
  const next = seeded(seed);
  const n = 2 + next(8);
  const bb = [4, 100, 200][next(3)]!;
  const sb = bb / 2;
  const structure: Structure = next(2) === 0 ? "NL" : "PL";
  const anteMode = next(4); // 0: none, 1: ante, 2: big-blind ante, 3: none
  const ante = anteMode === 1 ? bb / 4 : 0;
  const bbAnte = anteMode === 2 ? bb : 0;
  const stacks = Array.from({ length: n }, () => (next(5) === 0 ? 1 + next(bb * 3) : bb * (10 + next(200))));
  const players = stacks.map((s, i) => ({ seatNo: i + 1, stack: BigInt(s) }));
  let s = createHand(
    {
      game: "nlhe",
      structure,
      smallBlind: BigInt(sb),
      bigBlind: BigInt(bb),
      ...(ante ? { ante: BigInt(ante) } : {}),
      ...(bbAnte ? { bigBlindAnte: BigInt(bbAnte) } : {}),
    },
    players,
    n === 2 ? 1 : n,
    DECK_52,
  ).state;
  const actions: [string, number | null][] = [];
  const steps: (LegalActions | null)[] = [];
  for (let guard = 0; s.status === "betting" && guard < 500; guard++) {
    const legal = legalActions(s)!;
    steps.push(legal);
    const a = pick(legal, s.seats[s.toAct!]!.stack, next);
    const r = applyAction(s, legal.seatNo, a);
    if (!r.ok)
      throw new Error(
        `engine rejected its own legal action ${JSON.stringify(a, (_, v: unknown) => (typeof v === "bigint" ? String(v) : v))}: ${r.message}`,
      );
    actions.push([a.type, "to" in a ? Number(a.to) : null]);
    s = r.state;
  }
  steps.push(legalActions(s));
  return { c: { stacks, sb, bb, structure, ante, bbAnte, actions }, steps, final: s };
}

const BRIDGE = fileURLToPath(new URL("./betting_bridge.py", import.meta.url));

/**
 * Known reference defect R1 (docs/delivery/decisions.md): heads-up, poker_reference.Hand gives the action to the
 * button even when posting the small blind (and ante) put them all-in. The engine skips all-in players, as
 * KP-ENG-06 §6.1 requires. Such hands are excluded until the reference is fixed.
 */
export function referenceDefectR1(c: BettingCase): boolean {
  if (c.stacks.length !== 2) return false;
  const buttonPosts = c.sb + (c.bbAnte ? 0 : c.ante);
  return c.stacks[0]! <= buttonPosts;
}

export function compareBetting(
  hands: number,
  seed = 1,
): { hands: number; skipped: number; actions: number; mismatches: string[] } {
  const played = Array.from({ length: hands }, (_, k) => playRandom(seed * 1_000_003 + k));
  const res = spawnSync("python3", [BRIDGE], {
    input: JSON.stringify(played.map((p) => p.c)),
    encoding: "utf8",
    maxBuffer: 512 * 1024 * 1024,
  });
  if (res.status !== 0) throw new Error(`betting bridge failed: ${res.stderr || String(res.error)}`);
  const ref = JSON.parse(res.stdout) as RefResult[];
  const mismatches: string[] = [];
  let actions = 0;
  let skipped = 0;
  played.forEach((p, h) => {
    const r = ref[h]!;
    if (referenceDefectR1(p.c)) {
      skipped++;
      return;
    }
    actions += p.c.actions.length;
    const where = `hand ${h} ${JSON.stringify(p.c)}`;
    if (r.end?.startsWith("error")) {
      mismatches.push(`${where}: reference rejected: ${r.end}`);
      return;
    }
    const engineEnd = p.final.status;
    if (r.end !== engineEnd) mismatches.push(`${where}: end ${engineEnd} vs reference ${String(r.end)}`);
    if (BigInt(r.pot) !== potTotal(p.final))
      mismatches.push(`${where}: pot ${potTotal(p.final)} vs ${r.pot}`);
    r.steps.forEach((rs, k) => {
      const e = p.steps[k];
      if (rs.toAct === null) return;
      const got = e
        ? {
            fold: e.fold,
            check: e.check,
            call: e.call === null ? null : Number(e.call),
            raise: e.raise ? { min_to: Number(e.raise.minTo), max_to: Number(e.raise.maxTo) } : null,
          }
        : null;
      const want = { fold: rs.legal.fold, check: rs.legal.check, call: rs.legal.call, raise: rs.legal.raise };
      if (JSON.stringify(got) !== JSON.stringify(want)) {
        mismatches.push(
          `${where}: step ${k}: engine ${JSON.stringify(got)} vs reference ${JSON.stringify(want)}`,
        );
      }
    });
  });
  return { hands: hands - skipped, skipped, actions, mismatches };
}
