/**
 * @kilima/eslint-plugin — the six CI-blocking rules of KP-ENG-11 §2.1.
 * Where each rule applies (which folders) is decided in the root eslint.config.js.
 */
import type { TSESLint } from "@typescript-eslint/utils";
import { noDirectDbCrossSchema } from "./rules/no-direct-db-cross-schema.ts";
import { noFloatMoney } from "./rules/no-float-money.ts";
import { noHoleCardsInLogs } from "./rules/no-hole-cards-in-logs.ts";
import { noIoInEngine } from "./rules/no-io-in-engine.ts";
import { noMathRandom } from "./rules/no-math-random.ts";
import { noRawLedgerEntries } from "./rules/no-raw-ledger-entries.ts";

export const rules = {
  "no-float-money": noFloatMoney,
  "no-math-random": noMathRandom,
  "no-io-in-engine": noIoInEngine,
  "no-raw-ledger-entries": noRawLedgerEntries,
  "no-hole-cards-in-logs": noHoleCardsInLogs,
  "no-direct-db-cross-schema": noDirectDbCrossSchema,
};

const plugin = {
  meta: { name: "@kilima/eslint-plugin", version: "0.0.0" },
  rules,
} satisfies TSESLint.FlatConfig.Plugin;

export default plugin;
