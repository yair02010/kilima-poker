import { describe, expect, it } from "vitest";
import { z } from "zod";
import { baseConfigSchema, ConfigError, loadConfig } from "../../src/config.js";

const minimal = { SERVICE_NAME: "sample", HTTP_PORT: "3000" };

describe("loadConfig", () => {
  it("parses, coerces and applies defaults", () => {
    const cfg = loadConfig(baseConfigSchema, minimal);
    expect(cfg.HTTP_PORT).toBe(3000);
    expect(cfg.APP_MODE).toBe("play");
    expect(cfg.NODE_ENV).toBe("development");
    expect(cfg.SHUTDOWN_TIMEOUT_MS).toBe(30_000);
  });

  it("returns a frozen object", () => {
    const cfg = loadConfig(baseConfigSchema, minimal);
    expect(Object.isFrozen(cfg)).toBe(true);
  });

  it("fails fast listing every missing value", () => {
    try {
      loadConfig(baseConfigSchema, {});
      expect.fail("should throw");
    } catch (err) {
      expect(err).toBeInstanceOf(ConfigError);
      const issues = (err as ConfigError).issues.join("\n");
      expect(issues).toContain("SERVICE_NAME");
      expect(issues).toContain("HTTP_PORT");
    }
  });

  it("rejects invalid values", () => {
    expect(() => loadConfig(baseConfigSchema, { ...minimal, HTTP_PORT: "99999" })).toThrow(ConfigError);
    expect(() => loadConfig(baseConfigSchema, { ...minimal, APP_MODE: "casino" })).toThrow(/APP_MODE/);
  });

  it("supports service-specific extensions", () => {
    const schema = baseConfigSchema.extend({ TABLE_LIMIT: z.coerce.number().int() });
    expect(loadConfig(schema, { ...minimal, TABLE_LIMIT: "12" }).TABLE_LIMIT).toBe(12);
    expect(() => loadConfig(schema, minimal)).toThrow(/TABLE_LIMIT/);
  });
});
