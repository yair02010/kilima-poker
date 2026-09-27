import { baseConfigSchema, loadConfig } from "@kilima/shared/config";
import { z } from "zod";

/** Sample service configuration: the shared base plus the internal metrics port (KP-HBK-07 §3). */
export const configSchema = baseConfigSchema.extend({
  METRICS_HOST: z.string().default("0.0.0.0"),
  METRICS_PORT: z.coerce.number().int().min(1).max(65535),
});

export type Config = z.infer<typeof configSchema>;

export function readConfig(
  env: Readonly<Record<string, string | undefined>> = process.env,
): Readonly<Config> {
  return loadConfig(configSchema, env);
}
