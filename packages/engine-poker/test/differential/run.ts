/**
 * Full differential run: `pnpm differential [count] [seed]` — `count` evaluation hands (default 100,000)
 * plus count/5 random betting hands replayed in poker_reference.Hand.
 * Exit code 1 on any mismatch. Used by CI (step "Engine differential").
 */
import { compareBetting } from "./betting.js";
import { compareSettlement } from "./settle.js";
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
const bettingHands = Math.max(1, Math.round(count / 5));
const t1 = process.hrtime.bigint();
const betting = compareBetting(bettingHands, seed);
process.stdout.write(
  `betting differential: ${betting.hands} hands, ${betting.actions} actions ` +
    `in ${(Number(process.hrtime.bigint() - t1) / 1e9).toFixed(1)} s — mismatches: ${betting.mismatches.length}\n`,
);
for (const m of betting.mismatches.slice(0, 20)) process.stdout.write(`  ${m}\n`);
const t2 = process.hrtime.bigint();
const settle = compareSettlement(bettingHands, seed);
process.stdout.write(
  `settlement differential: ${settle.hands} finished hands (${settle.showdowns} showdowns) ` +
    `in ${(Number(process.hrtime.bigint() - t2) / 1e9).toFixed(1)} s — mismatches: ${settle.mismatches.length}\n`,
);
for (const m of settle.mismatches.slice(0, 20)) process.stdout.write(`  ${m}\n`);
process.exitCode =
  mismatches.length === 0 && betting.mismatches.length === 0 && settle.mismatches.length === 0 ? 0 : 1;
