import type { TSESTree } from "@typescript-eslint/utils";
import {
  calleeMethodName,
  createRule,
  isSqlLike,
  KYSELY_TABLE_METHODS,
  serviceOf,
  staticText,
} from "../util.ts";

/**
 * A service may only query its own schema (KP-ENG-11 §2.1), checked against the ownership map of
 * KP-ENG-05 §1. Other services' data is reached through their API or events.
 */

/** KP-ENG-05 ownership map: schema → owning service. `null` = nobody queries it directly. */
export const DEFAULT_OWNERSHIP: Record<string, string | null> = {
  identity: "identity",
  player: "player",
  lobby: "lobby",
  tournament: "tournament",
  compliance: "compliance",
  integrity: "integrity",
  operator: "operator-gateway",
  backoffice: "backoffice",
  notify: "notify",
  ledger: "wallet",
  cashier: "cashier",
  audit: null,
};

type Options = [{ ownership?: Record<string, string | null> }];

export const noDirectDbCrossSchema = createRule<Options, "foreignSchema" | "auditDirect">({
  name: "no-direct-db-cross-schema",
  meta: {
    type: "problem",
    docs: { description: "A service may only query its own database schema (KP-ENG-05 ownership map)" },
    messages: {
      foreignSchema:
        "Service '{{service}}' may not query schema '{{schema}}' (owned by '{{owner}}'). Use that service's API or events.",
      auditDirect:
        "Schema 'audit' is written only through the audit library; no service queries it directly.",
    },
    schema: [
      {
        type: "object",
        properties: {
          ownership: { type: "object", additionalProperties: { type: ["string", "null"] } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const service = serviceOf(context.filename);
    if (!service) return {};
    const ownership = new Map(Object.entries({ ...DEFAULT_OWNERSHIP, ...(options.ownership ?? {}) }));
    const schemas = [...ownership.keys()].map((k) => k.replace(/[^a-z0-9_]/gi, "")).join("|");
    // Schema names come from the ownership map (config), sanitised above to [a-z0-9_].
    // eslint-disable-next-line security/detect-non-literal-regexp
    const qualified = new RegExp(`(?<![\\w."])"?(${schemas})"?\\s*\\.\\s*"?[a-z_][a-z0-9_]*`, "gi");
    const reported = new WeakSet<TSESTree.Node>();

    const check = (node: TSESTree.Node, text: string, bareSchema = false) => {
      const found = new Set<string>();
      if (bareSchema) {
        const s = text.trim().toLowerCase();
        if (ownership.has(s)) found.add(s);
      }
      for (const m of text.matchAll(qualified)) {
        const s = m[1]?.toLowerCase();
        if (s) found.add(s);
      }
      for (const schema of found) {
        const owner = ownership.get(schema);
        if (owner === service) continue;
        reported.add(node);
        if (owner === null) context.report({ node, messageId: "auditDirect" });
        else
          context.report({
            node,
            messageId: "foreignSchema",
            data: { service, schema, owner: owner ?? "?" },
          });
      }
    };

    const checkSqlText = (node: TSESTree.Node) => {
      if (reported.has(node)) return;
      const text = staticText(node);
      if (text !== undefined && isSqlLike(text)) check(node, text);
    };

    return {
      CallExpression(node) {
        const m = calleeMethodName(node);
        const first = node.arguments[0];
        if (!m || !KYSELY_TABLE_METHODS.has(m) || !first) return;
        const text = staticText(first);
        if (text !== undefined) check(first, text, m === "withSchema");
      },
      Literal: checkSqlText,
      TemplateLiteral: checkSqlText,
    };
  },
});
