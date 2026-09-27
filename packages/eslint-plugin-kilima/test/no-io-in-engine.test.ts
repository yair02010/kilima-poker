import { noIoInEngine } from "../src/rules/no-io-in-engine.ts";
import { files, ruleTester } from "./setup.ts";

const engine = (code: string) => ({ code, filename: files.engine });

ruleTester.run("no-io-in-engine", noIoInEngine, {
  valid: [
    engine('import { evaluate } from "./evaluator.js"; export const x = evaluate([]);'),
    engine('import type { Readable } from "node:stream"; export type R = Readable;'),
    engine('import { strict as assert } from "node:assert"; assert.ok(true);'),
    engine("export function act(state: { now: number }, nowMs: number) { return { ...state, now: nowMs }; }"),
    engine("const d = new Date(1700000000000); export default d;"),
    engine("function setTimeout(x: number) { return x; } setTimeout(1);"),
  ],
  invalid: [
    { ...engine('import fs from "node:fs";'), errors: [{ messageId: "importForbidden" }] },
    { ...engine('import { readFileSync } from "fs";'), errors: [{ messageId: "importForbidden" }] },
    { ...engine('import { randomBytes } from "node:crypto";'), errors: [{ messageId: "importForbidden" }] },
    { ...engine('import pg from "pg";'), errors: [{ messageId: "importForbidden" }] },
    {
      ...engine('import { createLogger } from "@kilima/shared/logger";'),
      errors: [{ messageId: "importForbidden" }],
    },
    { ...engine('export * from "node:timers";'), errors: [{ messageId: "importForbidden" }] },
    { ...engine('const m = await import("node:http");'), errors: [{ messageId: "importForbidden" }] },
    { ...engine("setTimeout(() => {}, 10);"), errors: [{ messageId: "globalForbidden" }] },
    { ...engine("setInterval(() => {}, 10);"), errors: [{ messageId: "globalForbidden" }] },
    { ...engine('await fetch("https://x");'), errors: [{ messageId: "globalForbidden" }] },
    { ...engine("const t = Date.now();"), errors: [{ messageId: "clockForbidden" }] },
    { ...engine("const t = new Date();"), errors: [{ messageId: "clockForbidden" }] },
    { ...engine("const t = performance.now();"), errors: [{ messageId: "globalForbidden" }] },
    { ...engine("const e = process.env.X;"), errors: [{ messageId: "globalForbidden" }] },
    { ...engine('console.log("x");'), errors: [{ messageId: "globalForbidden" }] },
    { ...engine("crypto.getRandomValues(new Uint8Array(4));"), errors: [{ messageId: "globalForbidden" }] },
  ],
});
