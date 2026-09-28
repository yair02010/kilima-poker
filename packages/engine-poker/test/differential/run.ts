/**
 * Full differential run: `pnpm differential [count] [seed]` (default 100,000 hands).
 * Exit code 1 on any mismatch. Used by CI (step "Engine differential").
 */
import { compare, generateCases } from "./differential.js";

const count = Number(process.argv[2] ?? 100_000);
const seed = Number(process.argv[3] ?? 20260928);
const t0 = process.hrtime.bigint();
const { handCount, mismatches, byGame } = compare(generateCases(count, seed));
const secs = Number(process.hrtime.bigint() - t0) / 1e9;
process.stdout.write(
  `differential: ${handCount} hands (seed ${seed}) in ${secs.toFixed(1)} s — ${JSON.stringify(byGame)}\n`,
);
process.stdout.write(`mismatches: ${mismatches.length}\n`);
for (const m of mismatches.slice(0, 20)) process.stdout.write(`  ${JSON.stringify(m)}\n`);
process.exitCode = mismatches.length === 0 ? 0 : 1;
