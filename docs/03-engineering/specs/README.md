# API contracts

| File | Describes | Validate |
|---|---|---|
| `openapi.yaml` | REST API v1 (OpenAPI 3.1) — KP-ENG-03 | `openapi-spec-validator openapi.yaml` or `npx @redocly/cli lint openapi.yaml` |
| `asyncapi.yaml` | Socket.IO `/play` protocol (AsyncAPI 3.1) — KP-ENG-04 | `npx @asyncapi/cli validate asyncapi.yaml` |

Both files are **generated** by `tools/gen_specs.py` from the endpoint and event catalogues in that script.
`tools/check_api_consistency.py` checks that every endpoint and event in KP-ENG-02/03/04 exists in the
specs and vice versa (CI job `api-consistency`). Change the catalogue and the document in the same pull request.

Conventions: `x-roles` = roles allowed; `x-mode` = `real` or `play` only; `x-step-up` = fresh verification
required; `x-ack-data` = fields in a successful Socket.IO acknowledgement; `x-private` = event sent only to the
owning player's socket.

When the code monorepo is created, these files move to `packages/contracts`; CI generates TypeScript types,
validators and mock servers from them and blocks breaking changes (KP-ENG-11 §3).
