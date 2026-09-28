import { Counter, collectDefaultMetrics, Histogram, Registry } from "prom-client";

/** Prometheus registry with process metrics and RED metrics for HTTP (KP-HBK-17). */
export interface Metrics {
  registry: Registry;
  httpRequests: Counter<"method" | "route" | "status">;
  httpDuration: Histogram<"method" | "route" | "status">;
}

export function createMetrics(service: string): Metrics {
  const registry = new Registry();
  registry.setDefaultLabels({ service });
  collectDefaultMetrics({ register: registry });
  const httpRequests = new Counter({
    name: "http_requests_total",
    help: "HTTP requests by method, route and status",
    labelNames: ["method", "route", "status"] as const,
    registers: [registry],
  });
  const httpDuration = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP request duration in seconds",
    labelNames: ["method", "route", "status"] as const,
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5],
    registers: [registry],
  });
  return { registry, httpRequests, httpDuration };
}
