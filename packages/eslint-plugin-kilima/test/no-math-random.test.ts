import { noMathRandom } from "../src/rules/no-math-random.ts";
import { ruleTester } from "./setup.ts";

ruleTester.run("no-math-random", noMathRandom, {
  valid: [
    'import { randomUUID } from "node:crypto"; const id = randomUUID();',
    "const r = rng.next();",
    "const random = () => 4; random();",
    "Math.floor(3.2);",
    "const obj = { random: 1 }; obj.random;",
  ],
  invalid: [
    { code: "const x = Math.random();", errors: [{ messageId: "forbidden" }] },
    { code: 'const x = Math["random"]();', errors: [{ messageId: "forbidden" }] },
    { code: "const f = Math.random; f();", errors: [{ messageId: "forbidden" }] },
    { code: "const { random } = Math;", errors: [{ messageId: "forbidden" }] },
    { code: "globalThis.Math.random();", errors: [{ messageId: "forbidden" }] },
  ],
});
