import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { createRule, keyName, memberName } from "../util.ts";

/**
 * Logging calls may not include fields named hole, cards or deck (KP-ENG-11 §2.1). A player
 * never receives another player's hole cards and hole cards never appear in logs
 * (CLAUDE.md non-negotiable 5). The hand-record writer is exempted in the ESLint config.
 */

export const DEFAULT_FORBIDDEN_FIELDS = [
  "hole",
  "holes",
  "holeCards",
  "cards",
  "deck",
  "deckOrder",
  "shuffledDeck",
];
const LOG_METHODS = new Set(["trace", "debug", "info", "warn", "error", "fatal", "log", "child"]);
const LOGGER_NAME = /^(?:log|logger|console|\w*Logger|\w*Log)$/i;

type Options = [{ fields?: string[] }];

export const noHoleCardsInLogs = createRule<Options, "forbiddenField">({
  name: "no-hole-cards-in-logs",
  meta: {
    type: "problem",
    docs: { description: "Forbid hole cards and deck contents in log calls" },
    messages: {
      forbiddenField: "Do not log '{{field}}': hole cards and deck contents must never appear in logs.",
    },
    schema: [
      {
        type: "object",
        properties: { fields: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const fields = new Set([...DEFAULT_FORBIDDEN_FIELDS, ...(options.fields ?? [])]);

    const isLoggerObject = (o: TSESTree.Node): boolean => {
      if (o.type === AST_NODE_TYPES.Identifier) return LOGGER_NAME.test(o.name);
      if (o.type === AST_NODE_TYPES.MemberExpression) {
        const n = memberName(o);
        return n !== undefined && LOGGER_NAME.test(n);
      }
      if (o.type === AST_NODE_TYPES.ThisExpression) return false;
      // log.child({...}).info(...)
      if (o.type === AST_NODE_TYPES.CallExpression && o.callee.type === AST_NODE_TYPES.MemberExpression) {
        return memberName(o.callee) === "child" && isLoggerObject(o.callee.object);
      }
      return false;
    };

    const report = (node: TSESTree.Node, field: string) => {
      context.report({ node, messageId: "forbiddenField", data: { field } });
    };

    const inspect = (e: TSESTree.Node | undefined, depth = 0): void => {
      if (!e || depth > 6) return;
      switch (e.type) {
        case AST_NODE_TYPES.Identifier:
          if (fields.has(e.name)) report(e, e.name);
          return;
        case AST_NODE_TYPES.MemberExpression: {
          const n = memberName(e);
          if (n && fields.has(n)) report(e, n);
          return;
        }
        case AST_NODE_TYPES.ObjectExpression:
          for (const p of e.properties) {
            if (p.type === AST_NODE_TYPES.Property) {
              const k = keyName(p.key);
              if (k && fields.has(k)) report(p, k);
              else inspect(p.value, depth + 1);
            } else {
              inspect(p.argument, depth + 1);
            }
          }
          return;
        case AST_NODE_TYPES.ArrayExpression:
          for (const el of e.elements) if (el) inspect(el, depth + 1);
          return;
        case AST_NODE_TYPES.TemplateLiteral:
          for (const x of e.expressions) inspect(x, depth + 1);
          return;
        case AST_NODE_TYPES.CallExpression:
          // JSON.stringify(hand.cards), String(deck)
          for (const a of e.arguments) inspect(a, depth + 1);
          return;
        case AST_NODE_TYPES.TSAsExpression:
        case AST_NODE_TYPES.TSNonNullExpression:
          inspect(e.expression, depth + 1);
          return;
        case AST_NODE_TYPES.SpreadElement:
          inspect(e.argument, depth + 1);
          return;
        default:
          return;
      }
    };

    return {
      CallExpression(node) {
        const c = node.callee;
        if (c.type !== AST_NODE_TYPES.MemberExpression) return;
        const method = memberName(c);
        if (!method || !LOG_METHODS.has(method) || !isLoggerObject(c.object)) return;
        for (const a of node.arguments) inspect(a);
      },
    };
  },
});
