# sample

Reference service that follows the service blueprint (KP-HBK-07). It has no business logic: it exists so the workspace, lint, tests and CI have a real service to run, and it is the starting point for the `pnpm new:service` template.

| Endpoint       | Port                                         | Behaviour                                                                 |
| -------------- | -------------------------------------------- | ------------------------------------------------------------------------- |
| `GET /healthz` | `HTTP_PORT` (3999 locally)                   | Process alive; no dependency checks                                       |
| `GET /readyz`  | `HTTP_PORT`                                  | 200 when all dependency checks pass; 503 when one fails or while draining |
| `GET /version` | `HTTP_PORT`                                  | Service, version, commit, build time, mode                                |
| `GET /metrics` | `METRICS_PORT` (9464 locally, internal only) | Prometheus: process metrics and RED metrics                               |

Run: `pnpm dev --filter=@kilima/sample` (reads `.env.example`, then `.env` if present). SIGTERM or SIGINT → `/readyz` turns 503 → servers close in-flight work → exit (bounded by `SHUTDOWN_TIMEOUT_MS`).

Layout: `src/main.ts` (bootstrap), `src/config.ts` (typed config), `src/http/` (Fastify routes, metrics), `src/domain/` (readiness; no framework imports), `src/shutdown.ts`, `test/unit/`.
