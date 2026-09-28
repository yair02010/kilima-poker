import { defineProject } from "vitest/config";

export default defineProject({
  test: { name: "sample", include: ["test/**/*.test.ts"] },
});
