---
id: KP-HBK-07
title: Service Blueprint
subtitle: How to create and structure a backend service — layout, required endpoints, config, telemetry and production checklist
version: 1.0
owner: Tech Lead — Platform
status: Approved
related: KP-ENG-11 Engineering Standards · KP-HBK-08 API Guidelines · KP-HBK-17 Observability
---

# 1. Create a Service

```
pnpm new:service <name>       # scaffolds from templates/service, registers in turbo, helm, argocd, CODEOWNERS
```

Never copy another service by hand; improve the template instead so every service benefits.

# 2. Layout

```
services/<name>/
  src/
    main.ts                 # bootstrap: config → telemetry → db → server → graceful shutdown
    config.ts               # typed config (zod), read once
    http/                   # Fastify routes; one file per resource; handlers are thin
    realtime/               # socket handlers (gateway/table-server only)
    domain/                 # business logic; pure where possible; no framework imports
    repo/                   # SQL (Kysely or pg + typed queries); one repository per aggregate
    events/                 # Kafka producers (outbox) and consumers (idempotent)
    clients/                # typed clients for other services (generated from contracts)
  migrations/               # node-pg-migrate files
  test/unit/  test/int/  test/contract/
  Dockerfile  helm/values.yaml  README.md  RUNBOOK.md
```

Dependency direction: `http/realtime/events → domain → repo/clients`. The domain layer never imports Fastify, Kafka or pg.

# 3. Required Behaviour (every service)

@widths 1.8,3.2
| Item | Requirement |
|---|---|
| `/healthz` | Process alive; no dependency checks |
| `/readyz` | Dependencies reachable; returns 503 while draining |
| `/version` | Version, commit, build time, mode |
| `/metrics` | Prometheus, internal port only |
| Graceful shutdown | SIGTERM → readiness false → stop consuming → finish in-flight work (max 30 s; table-server uses drain) → close pools |
| Config | Fail fast on missing values; secrets only from the secret store |
| Auth | Shared middleware: JWT verify via JWKS cache, `sid` deny-list, permission check; service tokens for internal routes |
| Errors | `AppError` → standard error body (KP-ENG-03 §2.3); unknown errors → 500 with request id only |
| Idempotency | Middleware for `Idempotency-Key` on money/create endpoints (Redis + DB record) |
| Events | Outbox table in the same transaction as the state change; relay publishes to Kafka |
| Telemetry | Traces, RED metrics, structured logs with request id (KP-HBK-17) |
| Rate limits | Redis-backed per route class |

# 4. Minimal Handler Example

```ts
// services/player/src/http/notes.ts
export const putNote: Route = {
  method: "PUT", url: "/players/me/notes/:playerId",
  schema: contracts.putPlayersMeNotesPlayerId,          // generated from openapi.yaml
  preHandler: [requireAuth(), requirePermission("player.notes.write")],
  handler: async (req, reply) => {
    const note = await notes.upsert(req.user.id, req.params.playerId, req.body);   // domain call
    return reply.code(200).send(note);
  },
};
```

# 5. Kafka Consumer Example (idempotent)

```ts
consumer.on("hand.completed", async (evt, tx) => {
  if (await processed.seen(tx, evt.eventId)) return;          // dedupe table, same transaction
  await stats.applyHand(tx, evt.payload);
  await processed.mark(tx, evt.eventId);
});
```

# 6. Production Readiness Checklist

- [ ] Contract merged and consumers informed
- [ ] Owner team and on-call rotation in the service catalogue
- [ ] Dashboards (RED + business metrics) and alerts linked to runbook entries
- [ ] SLOs defined (KP-OPS-02 §2) where the service is user-facing
- [ ] Load test for expected peak × 2
- [ ] Threat model entry (KP-SEC-01) and security review for sensitive/critical services
- [ ] Data classification of every table; retention implemented (KP-LEG-06)
- [ ] Backups and restore tested for any new data store
- [ ] Network policies declare every caller; IAM role scoped to what the service needs
- [ ] README and RUNBOOK complete
