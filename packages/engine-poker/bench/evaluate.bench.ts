/**
 * Evaluator benchmark (KP-HBK-11 §7: NLHE 9-player showdown < 50 µs). Informational until the GA gate.
 * Run: pnpm --filter @kilima/engine-poker bench
 */
import { bestOfAny, DECK_52, type Card } from "../src/index.js";

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
