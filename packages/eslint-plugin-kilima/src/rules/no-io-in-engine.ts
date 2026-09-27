import { AST_NODE_TYPES, type TSESTree } from "@typescript-eslint/utils";
import { createRule, memberName } from "../util.ts";

/**
 * Engine packages (packages/engine-*) are pure: no I/O, timers, crypto, network, clocks or
 * process access. Time and randomness are inputs (CLAUDE.md non-negotiable 3, KP-ENG-11 §2.1).
 * Apply this rule to packages/engine-* files through the ESLint config.
 */

const NODE_BUILTINS = new Set([
  "assert",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "domain",
  "events",
  "fs",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "perf_hooks",
  "process",
  "readline",
  "repl",
  "sqlite",
  "stream",
  "timers",
  "tls",
  "trace_events",
  "tty",
  "url",
  "util",
  "v8",
  "vm",
  "wasi",
  "worker_threads",
  "zlib",
]);

/** Allowed even though they are Node builtins: pure helpers with no side effects. */
const PURE_BUILTINS = new Set(["assert"]);

const IO_PACKAGES = [
  "pg",
  "kysely",
  "ioredis",
  "redis",
  "kafkajs",
  "@confluentinc/",
  "fastify",
  "express",
  "undici",
  "axios",
  "node-fetch",
  "ws",
  "socket.io",
  "@aws-sdk/",
  "pino",
  "@kilima/shared",
];

const FORBIDDEN_GLOBAL_CALLS = new Set([
  "setTimeout",
  "setInterval",
  "setImmediate",
  "clearTimeout",
  "clearInterval",
  "clearImmediate",
  "queueMicrotask",
  "fetch",
  "require",
]);

const FORBIDDEN_GLOBAL_OBJECTS = new Set(["process", "performance", "crypto", "console", "globalThis"]);

function importViolation(source: string): string | undefined {
  const bare = source.startsWith("node:") ? source.slice(5) : source;
  const root = bare.split("/")[0] ?? bare;
  if (source.startsWith("node:") || NODE_BUILTINS.has(root)) {
    return PURE_BUILTINS.has(root) ? undefined : source;
  }
  if (
    IO_PACKAGES.some((p) =>
      p.endsWith("/") ? source.startsWith(p) : source === p || source.startsWith(`${p}/`),
    )
  ) {
    return source;
  }
  return undefined;
}

export const noIoInEngine = createRule({
  name: "no-io-in-engine",
  meta: {
    type: "problem",
    docs: { description: "Keep engine packages pure: no I/O, timers, crypto, clocks or network" },
    messages: {
      importForbidden:
        "Engine packages are pure: importing '{{source}}' is forbidden (no I/O, timers, crypto or network).",
      globalForbidden:
        "Engine packages are pure: '{{name}}' is forbidden. Pass time and randomness in as inputs.",
      clockForbidden: "Engine packages are pure: '{{name}}' reads the clock. Pass the time in as an input.",
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const isShadowed = (node: TSESTree.Identifier): boolean => {
      let scope: ReturnType<typeof context.sourceCode.getScope> | null = context.sourceCode.getScope(node);
      while (scope) {
        const v = scope.set.get(node.name);
        if (v && v.defs.length > 0) return true;
        scope = scope.upper;
      }
      return false;
    };
    const checkSource = (node: TSESTree.Node, source: string): void => {
      const v = importViolation(source);
      if (v) context.report({ node, messageId: "importForbidden", data: { source: v } });
    };
    return {
      ImportDeclaration(node) {
        if (node.importKind === "type") return;
        checkSource(node.source, node.source.value);
      },
      ImportExpression(node) {
        if (node.source.type === AST_NODE_TYPES.Literal && typeof node.source.value === "string") {
          checkSource(node.source, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        checkSource(node.source, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) checkSource(node.source, node.source.value);
      },
      CallExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          FORBIDDEN_GLOBAL_CALLS.has(node.callee.name) &&
          !isShadowed(node.callee)
        ) {
          context.report({
            node: node.callee,
            messageId: "globalForbidden",
            data: { name: node.callee.name },
          });
        }
      },
      MemberExpression(node) {
        if (node.object.type !== AST_NODE_TYPES.Identifier) return;
        const obj = node.object.name;
        const prop = memberName(node);
        if (obj === "Date" && prop === "now" && !isShadowed(node.object)) {
          context.report({ node, messageId: "clockForbidden", data: { name: "Date.now" } });
        } else if (FORBIDDEN_GLOBAL_OBJECTS.has(obj) && !isShadowed(node.object)) {
          context.report({ node: node.object, messageId: "globalForbidden", data: { name: obj } });
        }
      },
      NewExpression(node) {
        if (
          node.callee.type === AST_NODE_TYPES.Identifier &&
          node.callee.name === "Date" &&
          node.arguments.length === 0 &&
          !isShadowed(node.callee)
        ) {
          context.report({ node, messageId: "clockForbidden", data: { name: "new Date()" } });
        }
      },
    };
  },
});
