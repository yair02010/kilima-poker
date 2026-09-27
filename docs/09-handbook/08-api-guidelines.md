---
id: KP-HBK-08
title: API and Protocol Guidelines
subtitle: Conventions for REST endpoints, socket events, Kafka events, errors, versioning and money
version: 1.0
owner: Tech Lead — Platform
status: Approved
related: KP-ENG-03 API · KP-ENG-04 Real-time Protocol · KP-ENG-05 §11 Kafka · KP-HBK-07 Service Blueprint
---

# 1. Choosing the Channel

@widths 1.8,3.2
| Need | Channel |
|---|---|
| Player action at a table (sit, act, top-up, fast fold, rebuy) | Socket event with ack (KP-ENG-04) |
| Read or commerce operation (profile, cashier, registration) | REST `/api/v1` |
| State change other services must react to | Kafka event (via outbox) |
| Synchronous internal command (post to ledger, draw a deck) | Internal REST over mTLS with a scoped service token |

# 2. REST Conventions

- Plural resource nouns: `/tournaments/{id}/registrations`; actions that are not CRUD use a verb sub-resource: `/withdrawals/{id}/cancel`.
- `GET` never changes state; `POST` creates or acts; `PUT` replaces idempotently; `PATCH` for partial updates; `DELETE` removes.
- IDs are prefixed strings; timestamps ISO-8601 UTC; enums lower-snake-case strings.
- Lists are cursor-paginated (`limit`, `cursor`, `nextCursor`); max 100.
- Money: `{ amount: <int minor units>, currency }`. Never floats, never formatted strings.
- Every money or create operation requires `Idempotency-Key`.
- Responses never include fields the caller is not allowed to see; do not rely on the client to hide them.

# 3. Socket Event Conventions

- Names `domain:verb_or_noun` in lower snake case: `table:sit`, `hand:completed`.
- Client → server events always take an ack; the ack is the only success signal.
- Table events carry the envelope (`tableId`, `seq`, `ts`, `gameFamily`, `handId`).
- Private data only on `acct:{id}` rooms; mark such events `x-private` in AsyncAPI.
- Keep payloads small: numbers not strings, no repeated static data (it is in the snapshot).

# 4. Errors

Codes are `UPPER_SNAKE_CASE`, stable and documented; messages are for humans and may change. Add new codes to the spec and to client translations. Do not leak internal detail (stack traces, SQL, provider responses). Security-sensitive denials use generic codes (`SEATING_RESTRICTED`, `INVALID_CREDENTIALS`).

# 5. Versioning and Compatibility

- REST: additive changes are fine; breaking changes need `/api/v2` for the resource or an ADR with a migration plan. CI runs oasdiff.
- Socket: additive fields fine; removing or renaming needs a protocol minor version bump and support for the previous version for 2 client releases.
- Kafka: Avro with backward compatibility enforced by the schema registry; new required fields need defaults.
- Deprecation: mark in the spec (`deprecated: true`), announce in `#releases`, remove after the notice period (REST 90 days, internal 30 days).

# 6. Kafka Event Conventions

- Topic per aggregate stream (`hand.completed`, `wallet.tx.posted`); key = aggregate id for ordering.
- Envelope: `eventId` (UUIDv7), `type`, `version`, `occurredAt`, `tenantId`, `mode`, `payload`.
- Events are facts in the past tense; they are never commands.
- Consumers are idempotent and tolerate re-delivery and out-of-order events across keys.

# 7. Review Checklist for API Changes

- [ ] Spec changed first; `gen_specs`/`check_api_consistency` green
- [ ] Roles (`x-roles`), mode (`x-mode`), step-up (`x-step-up`) declared
- [ ] Validation schema rejects unknown fields
- [ ] Rate limit class chosen
- [ ] Error codes documented and translated
- [ ] Backward compatible or versioned
