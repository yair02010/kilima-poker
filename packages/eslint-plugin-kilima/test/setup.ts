import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;
RuleTester.itOnly = it.only;

export const ruleTester = new RuleTester();

/** File names used to place fixtures inside the monorepo layout. */
export const files = {
  engine: "/repo/packages/engine-poker/src/hand.ts",
  lobby: "/repo/services/lobby/src/repo/tables.ts",
  wallet: "/repo/services/wallet/src/repo/accounts.ts",
  ledgerPostings: "/repo/packages/ledger-postings/src/build.ts",
  sample: "/repo/services/sample/src/main.ts",
  windowsLobby: "C:\\repo\\services\\lobby\\src\\repo\\tables.ts",
};
