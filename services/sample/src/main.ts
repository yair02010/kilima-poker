/**
 * Bootstrap (KP-HBK-07 §2): config → telemetry → (db) → server → graceful shutdown.
 */
import { createLogger } from "@kilima/shared/logger";
import { readConfig } from "./config.js";
import { Readiness } from "./domain/readiness.js";
import { createMetrics } from "./http/metrics.js";
import { buildMetricsServer, buildServer } from "./http/server.js";
import { installShutdown } from "./shutdown.js";

async function main(): Promise<void> {
  const config = readConfig();
  const logger = createLogger({
    service: config.SERVICE_NAME,
    level: config.LOG_LEVEL,
    mode: config.APP_MODE,
  });
  const metrics = createMetrics(config.SERVICE_NAME);
  const readiness = new Readiness();

  const app = buildServer({ config, logger, readiness, metrics });
  const internal = buildMetricsServer({ metrics });

  await app.listen({ host: config.HTTP_HOST, port: config.HTTP_PORT });
  await internal.listen({ host: config.METRICS_HOST, port: config.METRICS_PORT });
  logger.info({ port: config.HTTP_PORT, metricsPort: config.METRICS_PORT }, "service started");

  installShutdown({
    logger,
    readiness,
    timeoutMs: config.SHUTDOWN_TIMEOUT_MS,
    closers: [() => app.close(), () => internal.close()],
  });
}

main().catch((err: unknown) => {
  // The logger may not exist yet (e.g. invalid config), so write the reason to stderr and exit.
  process.stderr.write(`${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
