/**
 * Evaluator benchmarks (KP-HBK-11 §7: NLHE 9-player showdown < 50 µs; PLO6 6 players < 2 ms).
 * Informational until the GA gate.
 * Run: pnpm --filter @kilima/engine-poker bench
 */
import {
  applyAction,
  bestOfAny,
  createHand,
  DECK_52,
  evaluateOmaha,
  legalActions,
  type Card,
} from "../src/index.js";

// Deterministic sample of 7-card hands (LCG; benchmarks only — never game randomness).
function sample(count: number): Card[][] {
  let s = 12345;
  const next = (n: number) => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s % n;
  };
  const out: Card[][] = [];
  for (let i = 0; i < count; i++) {
    const d = [...DECK_52];
    for (let k = d.length - 1; k > 0; k--) {
      const j = next(k + 1);
      [d[k], d[j]] = [d[j]!, d[k]!];
    }
    out.push(d.slice(0, 7));
  }
  return out;
}

const hands = sample(50_000);
for (const h of hands.slice(0, 5_000)) bestOfAny(h); // warm-up

const start = process.hrtime.bigint();
let sink = 0;
for (const h of hands) sink ^= bestOfAny(h).value;
const perHandUs = Number(process.hrtime.bigint() - start) / hands.length / 1000;
const showdownUs = perHandUs * 9;

process.stdout.write(
  `best-of-7: ${perHandUs.toFixed(2)} µs/hand · 9-player showdown ≈ ${showdownUs.toFixed(1)} µs ` +
    `(budget 50 µs: ${showdownUs < 50 ? "within" : "OVER"}) [${sink & 1}]\n`,
);

// PLO6: 6 hole + 5 board cards per player.
const ploHands = sample(20_000).map((h, i) => {
  return {
    hole: h.slice(0, 6),
    board: [...DECK_52].filter((c) => !h.slice(0, 6).includes(c)).slice(i % 40, (i % 40) + 5),
  };
});
for (const p of ploHands.slice(0, 2_000)) evaluateOmaha(p.hole, p.board);
const t2 = process.hrtime.bigint();
for (const p of ploHands) sink ^= evaluateOmaha(p.hole, p.board).value;
const ploUs = Number(process.hrtime.bigint() - t2) / ploHands.length / 1000;
process.stdout.write(
  `PLO6 best hand: ${ploUs.toFixed(1)} µs/player · 6-player showdown ≈ ${(ploUs * 6).toFixed(0)} µs ` +
    `(budget 2000 µs: ${ploUs * 6 < 2000 ? "within" : "OVER"}) [${sink & 1}]\n`,
);

// apply(): 6-max NLHE, every seat calls/checks through the streets (KP-HBK-11 §7: < 20 µs).
let applied = 0;
const t3 = process.hrtime.bigint();
for (let h = 0; h < 5_000; h++) {
  let s = createHand(
    { game: "nlhe", structure: "NL", smallBlind: 50n, bigBlind: 100n },
    [1, 2, 3, 4, 5, 6].map((seatNo) => ({ seatNo, stack: 10_000n })),
    6,
    DECK_52,
  ).state;
  while (s.status === "betting") {
    const legal = legalActions(s)!;
    const r = applyAction(s, legal.seatNo, legal.check ? { type: "check" } : { type: "call" });
    if (!r.ok) throw new Error(r.message);
    s = r.state;
    applied++;
  }
}
const applyUs = Number(process.hrtime.bigint() - t3) / applied / 1000;
process.stdout.write(
  `apply(): ${applyUs.toFixed(1)} µs/action over ${applied} actions (budget 20 µs: ${applyUs < 20 ? "within" : "OVER"})\n`,
);
