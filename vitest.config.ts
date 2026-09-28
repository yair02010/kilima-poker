import { defineConfig } from "vitest/config";

// Root Vitest config: `pnpm vitest` from the root runs every workspace project.
export default defineConfig({
  test: {
    projects: ["packages/*", "services/*"],
  },
});
