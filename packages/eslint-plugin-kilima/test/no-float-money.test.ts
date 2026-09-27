import { noFloatMoney } from "../src/rules/no-float-money.ts";
import { ruleTester } from "./setup.ts";

ruleTester.run("no-float-money", noFloatMoney, {
  valid: [
    "const amount: bigint = 100n;",
    "const amount: Money = money(100n, 'KES');",
    "let balance = 0n;",
    "interface Seat { stack: Money; seatNo: number; }",
    "function post(amount: Money, count: number) { return [amount, count]; }",
    "const rakeBps = 500; const betCount = 3; const potIndex = 0;",
    "const hotspot = 1.5; const spot: number = 2;",
    "const rake = (pot * 500n) / 10000n;",
    "const x = { amount: 100n, seats: 6 };",
    "class Table { stake: Money = ZERO; maxSeats = 9; }",
    { code: "const total: number = 3;", options: [{ ignoreNames: ["total"] }] },
    "const err = new Error(); const s: string = err.stack ?? '';",
  ],
  invalid: [
    {
      code: "const amount: number = 100;",
      errors: [{ messageId: "numberType" }, { messageId: "numberValue" }],
    },
    { code: "let balance: number;", errors: [{ messageId: "numberType" }] },
    { code: "interface Seat { stack: number; }", errors: [{ messageId: "numberType" }] },
    { code: "type Bet = { betAmount: number | null };", errors: [{ messageId: "numberType" }] },
    { code: "function pay(payout: number) { return payout; }", errors: [{ messageId: "numberType" }] },
    { code: "const f = (buyIn: number) => buyIn;", errors: [{ messageId: "numberType" }] },
    {
      code: "class Pot { potTotal: number = 0; }",
      errors: [{ messageId: "numberType" }, { messageId: "numberValue" }],
    },
    { code: "const fee = parseFloat(input);", errors: [{ messageId: "numberValue" }] },
    { code: "const deposit = Number(req.body.deposit);", errors: [{ messageId: "numberValue" }] },
    { code: "const x = { amount: 12.5 };", errors: [{ messageId: "numberValue" }] },
    { code: "wallet.balance = 0;", errors: [{ messageId: "numberValue" }] },
    { code: "const rake = pot * 0.05;", errors: [{ messageId: "floatArithmetic" }] },
    { code: "prize *= 0.5;", errors: [{ messageId: "floatArithmetic" }] },
    { code: "const r = Math.round(amount);", errors: [{ messageId: "mathOnMoney" }] },
    {
      code: "const bounty_minor: number = 1;",
      errors: [{ messageId: "numberType" }, { messageId: "numberValue" }],
    },
    { code: "const stakes: number[] = [];", errors: [{ messageId: "numberType" }] },
    {
      code: "const points: number = 1;",
      options: [{ extraWords: ["points"] }],
      errors: [{ messageId: "numberType" }, { messageId: "numberValue" }],
    },
  ],
});
