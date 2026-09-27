import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { calleeMethodName, createRule, normalizePath, staticText } from "../util.ts";

/**
 * Only packages/ledger-postings may build ledger entries; everything else goes through the
 * posting function (CLAUDE.md non-negotiable 2, ADR-0005, ADR-0006, KP-HBK-12).
 */

const LEDGER_TABLES = "(?:entries|transactions|balances)";
const RAW_SQL = new RegExp(
  `\\b(?:insert\\s+into|update|delete\\s+from|merge\\s+into|truncate(?:\\s+table)?|copy)\\s+"?ledger"?\\s*\\.\\s*"?${LEDGER_TABLES}\\b`,
  "i",
);
const KYSELY_WRITE = new Set(["insertInto", "updateTable", "deleteFrom", "mergeInto", "replaceInto"]);
const KYSELY_TABLE = new RegExp(`^\\s*ledger\\.${LEDGER_TABLES}\\b`, "i");
const DEFAULT_ENTRY_TYPES = ["LedgerEntry", "LedgerEntryDraft", "LedgerPosting", "PostingLine"];

type Options = [{ entryTypes?: string[] }];

export const noRawLedgerEntries = createRule<Options, "rawSql" | "kyselyWrite" | "entryConstruction">({
  name: "no-raw-ledger-entries",
  meta: {
    type: "problem",
    docs: {
      description: "Ledger entries are built only in packages/ledger-postings, through the posting function",
    },
    messages: {
      rawSql:
        "Direct write to ledger tables. Build entries in packages/ledger-postings and post through the posting function (ADR-0005).",
      kyselyWrite:
        "Direct write to '{{table}}'. Only packages/ledger-postings may build ledger entries (ADR-0005).",
      entryConstruction:
        "'{{type}}' objects may only be built in packages/ledger-postings (ADR-0005, ADR-0006).",
    },
    schema: [
      {
        type: "object",
        properties: { entryTypes: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    if (/(?:^|\/)packages\/ledger-postings\//.test(normalizePath(context.filename))) return {};
    const entryTypes = new Set([...DEFAULT_ENTRY_TYPES, ...(options.entryTypes ?? [])]);

    const typeName = (t: TSESTree.TypeNode | undefined): string | undefined => {
      if (!t) return undefined;
      if (t.type === AST_NODE_TYPES.TSTypeReference && t.typeName.type === AST_NODE_TYPES.Identifier) {
        if (entryTypes.has(t.typeName.name)) return t.typeName.name;
        // Array<LedgerEntry>, ReadonlyArray<LedgerEntry>
        const inner = t.typeArguments?.params[0];
        return inner ? typeName(inner) : undefined;
      }
      if (t.type === AST_NODE_TYPES.TSArrayType) return typeName(t.elementType);
      if (t.type === AST_NODE_TYPES.TSTypeOperator) return typeName(t.typeAnnotation);
      return undefined;
    };
    const isLiteralValue = (e: TSESTree.Node | null | undefined): boolean =>
      !!e && (e.type === AST_NODE_TYPES.ObjectExpression || e.type === AST_NODE_TYPES.ArrayExpression);

    const checkText = (node: TSESTree.Node) => {
      const text = staticText(node);
      if (text !== undefined && RAW_SQL.test(text)) context.report({ node, messageId: "rawSql" });
    };

    return {
      Literal: checkText,
      TemplateLiteral: checkText,
      CallExpression(node) {
        const m = calleeMethodName(node);
        const first = node.arguments[0];
        if (!m || !KYSELY_WRITE.has(m) || !first) return;
        const text = staticText(first);
        if (text !== undefined && KYSELY_TABLE.test(text)) {
          context.report({ node: first, messageId: "kyselyWrite", data: { table: text.trim() } });
        }
      },
      VariableDeclarator(node) {
        if (node.id.type !== AST_NODE_TYPES.Identifier) return;
        const t = typeName(node.id.typeAnnotation?.typeAnnotation);
        if (t && isLiteralValue(node.init))
          context.report({ node, messageId: "entryConstruction", data: { type: t } });
      },
      TSAsExpression(node) {
        const t = typeName(node.typeAnnotation);
        if (t && isLiteralValue(node.expression))
          context.report({ node, messageId: "entryConstruction", data: { type: t } });
      },
      TSSatisfiesExpression(node) {
        const t = typeName(node.typeAnnotation);
        if (t && isLiteralValue(node.expression))
          context.report({ node, messageId: "entryConstruction", data: { type: t } });
      },
      NewExpression(node) {
        if (node.callee.type === AST_NODE_TYPES.Identifier && entryTypes.has(node.callee.name)) {
          context.report({ node, messageId: "entryConstruction", data: { type: node.callee.name } });
        }
      },
    };
  },
});
