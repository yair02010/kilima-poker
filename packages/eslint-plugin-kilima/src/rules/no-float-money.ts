import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { createRule, keyName, memberName } from "../util.ts";

/**
 * Money is bigint minor units with a currency (packages/money). Never number or float
 * (CLAUDE.md non-negotiable 1, KP-ENG-11 §2.1, ADR-0005).
 *
 * The rule is syntactic and name-based: identifiers and properties whose name denotes money
 * (amount, balance, stake, rake, pot, bet, fee, …) must not be typed `number`, initialised from
 * number values, or combined with fractional literals.
 */

export const DEFAULT_MONEY_WORDS = [
  "amount",
  "balance",
  "stake",
  "stakes",
  "rake",
  "pot",
  "pots",
  "bet",
  "bets",
  "fee",
  "fees",
  "price",
  "payout",
  "payouts",
  "buyIn",
  "buyin",
  "cashout",
  "cashOut",
  "chips",
  "stack",
  "jackpot",
  "bounty",
  "prize",
  "prizes",
  "prizePool",
  "wager",
  "deposit",
  "withdrawal",
  "credit",
  "debit",
  "blind",
  "blinds",
  "ante",
  "antes",
  "minor",
  "minorUnits",
  "total",
  "winnings",
  "bonus",
  "cost",
];

type Options = [{ extraWords?: string[]; ignoreNames?: string[] }];

function buildMatcher(words: string[], ignore: Set<string>): (name: string) => boolean {
  const lower = new Set(words.map((w) => w.toLowerCase()));
  return (name: string) => {
    if (ignore.has(name)) return false;
    // Split camelCase, PascalCase, snake_case and SCREAMING_CASE into words; check the last word
    // and the last two words joined (e.g. buyIn, prizePool, minorUnits).
    const parts = name
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .split(/[\s_$]+/)
      .filter(Boolean)
      .map((p) => p.toLowerCase());
    const last = parts.at(-1);
    if (last === undefined) return false;
    const lastTwo = parts.length >= 2 ? `${parts.at(-2) ?? ""}${last}` : undefined;
    return lower.has(last) || (lastTwo !== undefined && lower.has(lastTwo));
  };
}

function containsNumberType(t: TSESTree.TypeNode | undefined): boolean {
  if (!t) return false;
  switch (t.type) {
    case AST_NODE_TYPES.TSNumberKeyword:
      return true;
    case AST_NODE_TYPES.TSUnionType:
    case AST_NODE_TYPES.TSIntersectionType:
      return t.types.some(containsNumberType);
    case AST_NODE_TYPES.TSArrayType:
      return containsNumberType(t.elementType);
    case AST_NODE_TYPES.TSTypeOperator:
      return containsNumberType(t.typeAnnotation);
    case AST_NODE_TYPES.TSLiteralType:
      return t.literal.type === AST_NODE_TYPES.Literal && typeof t.literal.value === "number";
    default:
      return false;
  }
}

/** True when the expression certainly produces a JS number (not bigint). */
function isNumberValue(e: TSESTree.Node | null | undefined): boolean {
  if (!e) return false;
  switch (e.type) {
    case AST_NODE_TYPES.Literal:
      return typeof e.value === "number";
    case AST_NODE_TYPES.UnaryExpression:
      return e.operator === "+" || (e.operator === "-" && isNumberValue(e.argument));
    case AST_NODE_TYPES.CallExpression: {
      const c = e.callee;
      if (c.type === AST_NODE_TYPES.Identifier) return ["Number", "parseFloat", "parseInt"].includes(c.name);
      if (c.type === AST_NODE_TYPES.MemberExpression) {
        const obj = c.object.type === AST_NODE_TYPES.Identifier ? c.object.name : undefined;
        const prop = memberName(c);
        if (obj === "Math") return true;
        if (obj === "Number" && (prop === "parseFloat" || prop === "parseInt")) return true;
      }
      return false;
    }
    case AST_NODE_TYPES.TSAsExpression:
    case AST_NODE_TYPES.TSSatisfiesExpression:
    case AST_NODE_TYPES.TSNonNullExpression:
      return isNumberValue(e.expression);
    default:
      return false;
  }
}

function isFractionalLiteral(e: TSESTree.Node): boolean {
  return e.type === AST_NODE_TYPES.Literal && typeof e.value === "number" && !Number.isInteger(e.value);
}

export const noFloatMoney = createRule<
  Options,
  "numberType" | "numberValue" | "floatArithmetic" | "mathOnMoney"
>({
  name: "no-float-money",
  meta: {
    type: "problem",
    docs: { description: "Money must be bigint minor units (Money type), never number or float" },
    messages: {
      numberType:
        "'{{name}}' looks like money but is typed number. Use Money / bigint minor units (packages/money).",
      numberValue: "'{{name}}' looks like money but gets a number value. Use a bigint (e.g. 100n) or Money.",
      floatArithmetic:
        "Fractional arithmetic on money ('{{name}}'). Use integer basis points and bigint math in packages/money.",
      mathOnMoney: "Math.{{fn}} on money ('{{name}}') implies number arithmetic. Use packages/money helpers.",
    },
    schema: [
      {
        type: "object",
        properties: {
          extraWords: { type: "array", items: { type: "string" } },
          ignoreNames: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
  },
  defaultOptions: [{}],
  create(context, [options]) {
    const isMoney = buildMatcher(
      [...DEFAULT_MONEY_WORDS, ...(options.extraWords ?? [])],
      new Set(options.ignoreNames ?? []),
    );

    const nameOfTarget = (n: TSESTree.Node): string | undefined => {
      if (n.type === AST_NODE_TYPES.Identifier) return n.name;
      if (n.type === AST_NODE_TYPES.MemberExpression) return memberName(n);
      return undefined;
    };

    const checkAnnotated = (
      id: TSESTree.Node,
      name: string | undefined,
      ann: TSESTree.TSTypeAnnotation | undefined,
    ) => {
      if (name && isMoney(name) && containsNumberType(ann?.typeAnnotation)) {
        context.report({ node: id, messageId: "numberType", data: { name } });
      }
    };

    const checkValue = (
      node: TSESTree.Node,
      name: string | undefined,
      value: TSESTree.Node | null | undefined,
    ) => {
      if (name && isMoney(name) && isNumberValue(value)) {
        context.report({ node, messageId: "numberValue", data: { name } });
      }
    };

    const checkParam = (p: TSESTree.Parameter) => {
      if (p.type === AST_NODE_TYPES.Identifier) checkAnnotated(p, p.name, p.typeAnnotation);
      else if (p.type === AST_NODE_TYPES.AssignmentPattern && p.left.type === AST_NODE_TYPES.Identifier) {
        checkAnnotated(p.left, p.left.name, p.left.typeAnnotation);
        checkValue(p, p.left.name, p.right);
      } else if (
        p.type === AST_NODE_TYPES.TSParameterProperty &&
        p.parameter.type === AST_NODE_TYPES.Identifier
      ) {
        checkAnnotated(p.parameter, p.parameter.name, p.parameter.typeAnnotation);
      }
    };

    const fn = (node: TSESTree.FunctionLike) => {
      for (const p of node.params) checkParam(p);
    };

    return {
      VariableDeclarator(node) {
        if (node.id.type === AST_NODE_TYPES.Identifier) {
          checkAnnotated(node.id, node.id.name, node.id.typeAnnotation);
          checkValue(node, node.id.name, node.init);
        }
      },
      FunctionDeclaration: fn,
      FunctionExpression: fn,
      ArrowFunctionExpression: fn,
      TSDeclareFunction: fn,
      TSEmptyBodyFunctionExpression: fn,
      TSPropertySignature(node) {
        checkAnnotated(node, keyName(node.key), node.typeAnnotation);
      },
      PropertyDefinition(node) {
        const name = keyName(node.key);
        checkAnnotated(node, name, node.typeAnnotation);
        checkValue(node, name, node.value);
      },
      Property(node) {
        if (node.parent.type === AST_NODE_TYPES.ObjectExpression)
          checkValue(node, keyName(node.key), node.value);
      },
      AssignmentExpression(node) {
        const name = nameOfTarget(node.left);
        if (node.operator === "=") checkValue(node, name, node.right);
        else if (name && isMoney(name) && isFractionalLiteral(node.right)) {
          context.report({ node, messageId: "floatArithmetic", data: { name } });
        }
      },
      BinaryExpression(node) {
        if (!["*", "/", "+", "-", "%"].includes(node.operator)) return;
        const pairs: [TSESTree.Node, TSESTree.Node][] = [
          [node.left, node.right],
          [node.right, node.left],
        ];
        for (const [a, b] of pairs) {
          const name = nameOfTarget(a);
          if (name && isMoney(name) && isFractionalLiteral(b)) {
            context.report({ node, messageId: "floatArithmetic", data: { name } });
            return;
          }
        }
      },
      CallExpression(node) {
        const c = node.callee;
        if (
          c.type !== AST_NODE_TYPES.MemberExpression ||
          c.object.type !== AST_NODE_TYPES.Identifier ||
          c.object.name !== "Math"
        )
          return;
        for (const arg of node.arguments) {
          const name = nameOfTarget(arg);
          if (name && isMoney(name)) {
            context.report({ node, messageId: "mathOnMoney", data: { fn: memberName(c) ?? "?", name } });
            return;
          }
        }
      },
    };
  },
});
