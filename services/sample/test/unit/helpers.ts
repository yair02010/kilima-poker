import { Writable } from "node:stream";
import { createLogger } from "@kilima/shared/logger";
import { readConfig } from "../../src/config.js";
import { Readiness, type DependencyCheck } from "../../src/domain/readiness.js";
import { createMetrics } from "../../src/http/metrics.js";
import { buildMetricsServer, buildServer } from "../../src/http/server.js";

export const testEnv = {
  SERVICE_NAME: "sample",
  NODE_ENV: "test",
  HTTP_PORT: "3999",
  METRICS_PORT: "9464",
  BUILD_VERSION: "1.2.3",
  BUILD_COMMIT: "abc1234",
  BUILD_TIME: "2026-09-27T00:00:00Z",
};

export function silentLogger() {
  const sink = new Writable({
    write(_c, _e, cb) {
      cb();
    },
  });
  return createLogger({ service: "sample", level: "silent", destination: sink });
}

export function setup(checks: DependencyCheck[] = []) {
  const config = readConfig(testEnv);
  const logger = silentLogger();
  const metrics = createMetrics(config.SERVICE_NAME);
  const readiness = new Readiness(checks);
  const app = buildServer({ config, logger, readiness, metrics });
  const internal = buildMetricsServer({ metrics });
  return { config, logger, metrics, readiness, app, internal };
}
