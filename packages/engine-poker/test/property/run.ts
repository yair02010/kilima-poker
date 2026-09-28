/**
 * Scale profile (WP-06 slice 3): `pnpm --filter @kilima/engine-poker property [hands] [firstSeed] [reportFile]`
 * Default 1,000,000 hands. Checks every invariant in invariants.ts and measures applyAction latency
 * against the KP-HBK-11 §7 budget (p99 < 20 µs). Exit code 1 on the first broken invariant.
 */
import { writeFileSync } from "node:fs";
import { checkHand } from "./invariants.js";

const hands = Number(process.argv[2] ?? 1_000_000);
const first = Number(process.argv[3] ?? 1);
const reportFile = process.argv[4];

const byGame: Record<string, number> = {};
const byStatus: Record<string, number> = {};
let actions = 0;
let illegal = 0;
const samples: number[] = [];
const t0 = process.hrtime.bigint();
for (let k = 0; k < hands; k++) {
  const seed = first + k;
  const timing = k % 20 === 0; // latency sample on 5 % of hands
  const r = checkHand(seed, { timing });
  byGame[r.game] = (byGame[r.game] ?? 0) + 1;
  byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
  actions += r.actions;
  illegal += r.illegalTried;
  if (timing) samples.push(...r.applyNs);
  if ((k + 1) % 100_000 === 0) process.stdout.write(`  ${k + 1} hands…\n`);
}
const secs = Number(process.hrtime.bigint() - t0) / 1e9;
samples.sort((a, b) => a - b);
const q = (p: number) => (samples[Math.min(samples.length - 1, Math.floor(p * samples.length))] ?? 0) / 1000;
const report = {
  hands,
  seeds: [first, first + hands - 1],
  seconds: Number(secs.toFixed(1)),
  actions,
  illegalAttemptsRejected: illegal,
  byGame,
  byStatus,
  applyActionMicros: { samples: samples.length, p50: q(0.5), p99: q(0.99), max: q(1), budgetP99: 20 },
  invariantsBroken: 0,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (reportFile) writeFileSync(reportFile, `${JSON.stringify(report, null, 2)}\n`);
