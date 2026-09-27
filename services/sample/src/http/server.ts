import { randomUUID } from "node:crypto";
import type { Logger } from "@kilima/shared/logger";
import { Errors, toErrorResponse } from "@kilima/shared/errors";
import Fastify, { type FastifyInstance } from "fastify";
import type { Config } from "../config.js";
import type { Readiness } from "../domain/readiness.js";
import type { Metrics } from "./metrics.js";

export interface ServerDeps {
  config: Readonly<Config>;
  logger: Logger;
  readiness: Readiness;
  metrics: Metrics;
}

const REQUEST_ID_HEADER = "x-request-id";

/** Public HTTP server: /healthz, /readyz, /version and the service's own routes (KP-HBK-07 §3). */
export function buildServer({ config, logger, readiness, metrics }: ServerDeps) {
  const app = Fastify({
    loggerInstance: logger,
    requestIdHeader: REQUEST_ID_HEADER,
    genReqId: () => randomUUID(),
  });

  app.addHook("onSend", async (req, reply) => {
    void reply.header(REQUEST_ID_HEADER, req.id);
  });

  app.addHook("onResponse", async (req, reply) => {
    const labels = {
      method: req.method,
      route: req.routeOptions.url ?? "unmatched",
      status: String(reply.statusCode),
    };
    metrics.httpRequests.inc(labels);
    metrics.httpDuration.observe(labels, reply.elapsedTime / 1000);
  });

  app.setErrorHandler((err, req, reply) => {
    const { status, body } = toErrorResponse(err, req.id);
    if (status >= 500) req.log.error({ err }, "request failed");
    return reply.code(status).send(body);
  });

  app.setNotFoundHandler((req, reply) => {
    const { status, body } = toErrorResponse(Errors.notFound("Route"), req.id);
    return reply.code(status).send(body);
  });

  app.get("/healthz", (_req, reply) => reply.send({ status: "ok" }));

  app.get("/readyz", async (_req, reply) => {
    const report = await readiness.report();
    return reply.code(report.ready ? 200 : 503).send(report);
  });

  app.get("/version", (_req, reply) =>
    reply.send({
      service: config.SERVICE_NAME,
      version: config.BUILD_VERSION,
      commit: config.BUILD_COMMIT,
      buildTime: config.BUILD_TIME,
      mode: config.APP_MODE,
    }),
  );

  return app;
}

export type App = ReturnType<typeof buildServer>;

/** Internal-only server exposing /metrics for Prometheus (never routed publicly). */
export function buildMetricsServer({ metrics }: Pick<ServerDeps, "metrics">): FastifyInstance {
  const app = Fastify({ logger: false });
  app.get("/metrics", async (_req, reply) => {
    return reply.header("content-type", metrics.registry.contentType).send(await metrics.registry.metrics());
  });
  return app;
}
