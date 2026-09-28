import { AST_NODE_TYPES, ESLintUtils, type TSESTree } from "@typescript-eslint/utils";

export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/yair02010/kilima-poker/blob/main/packages/eslint-plugin-kilima/README.md#${name}`,
);

/** Normalises a file path to forward slashes so path checks work on Windows too. */
export function normalizePath(filename: string): string {
  return filename.replace(/\\/g, "/");
}

/** Returns the service name for files under services/<name>/, otherwise undefined. */
export function serviceOf(filename: string): string | undefined {
  return /(?:^|\/)services\/([^/]+)\//.exec(normalizePath(filename))?.[1];
}

/** Name of an identifier or a non-computed / string-literal property key. */
export function keyName(node: TSESTree.Node | null | undefined): string | undefined {
  if (!node) return undefined;
  if (node.type === AST_NODE_TYPES.Identifier) return node.name;
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") return node.value;
  return undefined;
}

/** Name of the property accessed by a member expression (`a.b` and `a["b"]`). */
export function memberName(node: TSESTree.MemberExpression): string | undefined {
  if (!node.computed) return keyName(node.property);
  if (node.property.type === AST_NODE_TYPES.Literal && typeof node.property.value === "string")
    return node.property.value;
  if (node.property.type === AST_NODE_TYPES.TemplateLiteral && node.property.expressions.length === 0) {
    return node.property.quasis[0]?.value.cooked ?? undefined;
  }
  return undefined;
}

/** Static text of a string literal or template literal (expressions replaced by a placeholder). */
export function staticText(node: TSESTree.Node): string | undefined {
  if (node.type === AST_NODE_TYPES.Literal && typeof node.value === "string") return node.value;
  if (node.type === AST_NODE_TYPES.TemplateLiteral)
    return node.quasis.map((q) => q.value.cooked ?? q.value.raw).join("?");
  return undefined;
}

export function isSqlLike(text: string): boolean {
  return /\b(select|insert|update|delete|from|join|into|merge|truncate|copy)\b/i.test(text);
}

/** Kysely query builder methods whose first argument names a table (optionally schema-qualified). */
export const KYSELY_TABLE_METHODS = new Set([
  "selectFrom",
  "insertInto",
  "updateTable",
  "deleteFrom",
  "mergeInto",
  "replaceInto",
  "innerJoin",
  "leftJoin",
  "rightJoin",
  "fullJoin",
  "crossJoin",
  "withSchema",
]);

export function calleeMethodName(node: TSESTree.CallExpression): string | undefined {
  const c = node.callee;
  if (c.type === AST_NODE_TYPES.MemberExpression) return memberName(c);
  if (c.type === AST_NODE_TYPES.Identifier) return c.name;
  return undefined;
}
