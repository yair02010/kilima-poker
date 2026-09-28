// Root ESLint flat config (KP-ENG-11 §2) with the six CI-blocking Kilima rules (§2.1).
import js from "@eslint/js";
import kilima from "@kilima/eslint-plugin";
import prettier from "eslint-config-prettier";
import security from "eslint-plugin-security";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/node_modules/**", "**/dist/**", "**/coverage/**", "**/.turbo/**", "docs/**"],
  },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  security.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      "no-console": "error",
      "no-restricted-properties": [
        "error",
        {
          object: "process",
          property: "env",
          message: "Read configuration only through the typed config module (KP-ENG-11 §2).",
        },
      ],
    },
  },
  {
    files: ["**/config.ts", "**/config/*.ts"],
    rules: { "no-restricted-properties": "off" },
  },
  // Kilima rules (KP-ENG-11 §2.1) — every TypeScript source in the product.
  {
    files: ["apps/**/*.ts", "apps/**/*.tsx", "services/**/*.ts", "packages/**/*.ts", "tools/**/*.ts"],
    plugins: { kilima },
    rules: {
      "kilima/no-float-money": "error",
      "kilima/no-math-random": "error",
      "kilima/no-raw-ledger-entries": "error",
      "kilima/no-hole-cards-in-logs": "error",
    },
  },
  {
    files: ["packages/engine-*/**/*.ts"],
    ignores: ["packages/engine-*/test/**", "packages/engine-*/**/*.test.ts"],
    rules: { "kilima/no-io-in-engine": "error" },
  },
  {
    files: ["services/**/*.ts"],
    rules: { "kilima/no-direct-db-cross-schema": "error" },
  },
  // Simulation bots may use non-cryptographic randomness; they never deal real cards (KP-QA-04).
  {
    files: ["tools/simbots/**/*.ts"],
    rules: { "kilima/no-math-random": "off" },
  },
  // The rule tests hold forbidden code as fixture strings.
  {
    files: ["packages/eslint-plugin-kilima/test/**/*.ts"],
    rules: {
      "kilima/no-raw-ledger-entries": "off",
      "kilima/no-hole-cards-in-logs": "off",
      "kilima/no-float-money": "off",
      "kilima/no-math-random": "off",
    },
  },
  {
    files: ["**/*.test.ts", "**/test/**/*.ts"],
    rules: {
      "@typescript-eslint/no-non-null-assertion": "off",
      "security/detect-object-injection": "off",
    },
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    ...tseslint.configs.disableTypeChecked,
  },
  prettier,
);
