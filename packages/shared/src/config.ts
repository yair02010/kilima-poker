/**
 * Typed configuration (KP-ENG-11 §2, KP-HBK-07 §3): read once at start-up, validated with zod,
 * fail fast on missing or invalid values. Business code never reads process.env.
 */
import { z } from "zod";

export class ConfigError extends Error {
  readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(`Invalid configuration:\n  - ${issues.join("\n  - ")}`);
    this.name = "ConfigError";
    this.issues = issues;
  }
}

/** Variables every service understands. Services extend this with their own fields. */
export const baseConfigSchema = z.object({
  SERVICE_NAME: z.string().min(1),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  /** Play Money and Real Money are separate deployments (ADR-0009). */
  APP_MODE: z.enum(["play", "real"]).default("play"),
  HTTP_HOST: z.string().default("0.0.0.0"),
  HTTP_PORT: z.coerce.number().int().min(1).max(65535),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(30_000),
  BUILD_VERSION: z.string().default("0.0.0-dev"),
  BUILD_COMMIT: z.string().default("unknown"),
  BUILD_TIME: z.string().default("unknown"),
});

export type BaseConfig = z.infer<typeof baseConfigSchema>;

/**
 * Parses and freezes configuration from an environment-like record.
 * Throws ConfigError listing every problem at once.
 */
export function loadConfig<S extends z.ZodType>(
  schema: S,
  env: Readonly<Record<string, string | undefined>> = process.env,
): Readonly<z.infer<S>> {
  const result = schema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => {
      const key = i.path.join(".") || "(root)";
      return `${key}: ${i.message}`;
    });
    throw new ConfigError(issues);
  }
  return Object.freeze(result.data);
}
