import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { createRule, keyName, memberName } from "../util.ts";

/**
 * Math.random is forbidden in services and engines. Game randomness comes only from the rng
 * service (ADR-0010); non-game ids use node:crypto (CLAUDE.md non-negotiable 4, KP-ENG-11 §2.1).
 */
export const noMathRandom = createRule({
  name: "no-math-random",
  meta: {
    type: "problem",
    docs: {
      description: "Forbid Math.random; use the rng service for game randomness or node:crypto for ids",
    },
    messages: {
      forbidden:
        "Math.random is forbidden. Game randomness comes only from the rng service (ADR-0010); use node:crypto randomUUID/randomInt for non-game ids.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const isMath = (n: TSESTree.Node): boolean =>
      (n.type === AST_NODE_TYPES.Identifier && n.name === "Math") ||
      (n.type === AST_NODE_TYPES.MemberExpression &&
        ["globalThis", "window", "global", "self"].includes(
          n.object.type === AST_NODE_TYPES.Identifier ? n.object.name : "",
        ) &&
        memberName(n) === "Math");
    return {
      MemberExpression(node) {
        if (isMath(node.object) && memberName(node) === "random") {
          context.report({ node, messageId: "forbidden" });
        }
      },
      VariableDeclarator(node) {
        // const { random } = Math
        if (node.id.type === AST_NODE_TYPES.ObjectPattern && node.init && isMath(node.init)) {
          for (const p of node.id.properties) {
            if (p.type === AST_NODE_TYPES.Property && keyName(p.key) === "random") {
              context.report({ node: p, messageId: "forbidden" });
            }
          }
        }
      },
    };
  },
});
