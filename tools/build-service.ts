/**
 * Production bundle for a service (KP-OPS-01 §3 stage 6): one ESM file with every dependency
 * inlined, so the runtime image needs no node_modules. Run from a service folder:
 *   node ../../tools/build-service.ts
 * Output: dist/main.mjs (+ source map).
 */
import { build } from "esbuild";
import { rmSync } from "node:fs";
import { resolve } from "node:path";

const cwd = process.cwd();
const outdir = resolve(cwd, "dist");
rmSync(outdir, { recursive: true, force: true });

const result = await build({
  entryPoints: [resolve(cwd, "src/main.ts")],
  outfile: resolve(outdir, "main.mjs"),
  bundle: true,
  platform: "node",
  target: "node24",
  format: "esm",
  sourcemap: true,
  minify: false,
  legalComments: "linked",
  metafile: true,
  logLevel: "warning",
  // Some dependencies are CommonJS and call require(); give the ESM bundle a real require.
  banner: {
    js: 'import { createRequire as __kilimaCreateRequire } from "node:module"; const require = __kilimaCreateRequire(import.meta.url);',
  },
});

const bytes = Object.values(result.metafile.outputs).reduce((n, o) => n + o.bytes, 0);
process.stdout.write(
  `bundled ${cwd.split(/[\\/]/).at(-1) ?? "service"} → dist/main.mjs (${(bytes / 1024).toFixed(0)} KiB incl. map)\n`,
);
