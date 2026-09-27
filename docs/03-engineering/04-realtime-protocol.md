---
id: KP-ENG-04
title: Real-time Protocol
subtitle: Socket.IO /play namespace — lobby, tables, hands, fast-fold and tournaments
version: 1.0
owner: Tech Lead — Game
status: In review
related: KP-ENG-01 (D4, D13) · KP-ENG-06 Poker Game Engine · KP-ENG-07 Lobby and Tournaments · specs/asyncapi.yaml
---

# 1. Transport

@widths 1.4,3.6
| Item | Value |
|---|---|
| Library | Socket.IO v4 server and client; WebSocket transport only (no long-polling in Real Money) |
| Endpoint | `wss://play.<brand-domain>/play` through the CDN edge |
| Encoding | MessagePack (`socket.io-msgpack-parser`); JSON is accepted in `dev` only |
| Compression | Per-message deflate off for small events (CPU and latency); snapshots above 4 KB are compressed |
| Heartbeat | ping every 20 s, timeout 20 s (mobile-friendly) |
| Versioning | Client sends `protocolVersion` in the handshake; the server supports the current and previous minor version and rejects older clients with `UPGRADE_REQUIRED` |

# 2. Connection and Session

```
const socket = io("wss://play.kilima.poker/play", {
  transports: ["websocket"], parser: msgpackParser,
  auth: { token: accessToken, device: deviceId, protocolVersion: "1.0", app: "android/1.3.0" }
});
```

- The gateway verifies the token (signature, `aud` for the mode, `sid` not revoked, account not banned or self-excluded) and the device attestation freshness for Real Money. Failures reject the connection with `connect_error` and `err.data.code` = `UNAUTHORIZED`, `TOKEN_EXPIRED`, `BANNED`, `JURISDICTION_BLOCKED`, `UPGRADE_REQUIRED`.
- `TOKEN_EXPIRED`: the client refreshes over REST and reconnects; seats are unaffected.
- **One game connection per account.** A new connection takes over; the old one receives `session:replaced` and is closed. Multi-tabling happens inside one connection.
- After connecting, the gateway joins the socket to `acct:{accountId}` and to the rooms of every table where the player is seated or observing, then emits `session:ready`.
- Access tokens expire while connected: the client sends `session:refresh { token }` before expiry; the gateway re-validates without reconnecting.

## Lifecycle (reserved events)

@widths 1.3,3.7
| Event | Behaviour |
|---|---|
| `connect` | Wait for `session:ready` before sending actions |
| `disconnect` | Seats are kept. The action timer and time bank keep running (KP-ENG-06 §6.8). Other players see `table:player_status { status: "disconnected" }` |
| `connect_error` | See `err.data.code` |

# 3. Conventions

## 3.1 Acknowledgements

Every client → server event takes an acknowledgement callback:

```
{ "ok": true,  "data": { ... } }
{ "ok": false, "error": { "code": "NOT_YOUR_TURN", "message": "Waiting for seat 4" } }
```

Actions carry `clientActionId` (UUID). A retry with the same id returns the original result; for money-moving actions (`table:sit`, `table:topup`, `tourn:rebuy`, `ff:join`) it is also the idempotency key of the ledger posting.

## 3.2 Table envelope (server → client)

```
{ "tableId": "t_4Kx", "seq": 1842, "ts": 1790500123456, "gameFamily": "poker", "handId": "h_01J9Z…" | null, ...fields }
```

`seq` increases by 1 for every event of a table, including private events (the private event occupies a `seq` for every recipient; other recipients receive a `seq`-only placeholder so gaps stay detectable). On a gap the client sends `table:resync`.

## 3.3 Rooms and privacy

@widths 1.5,3.5
| Room | Receives |
|---|---|
| `table:{id}` | Public events of a table (seated players and observers without delay) |
| `table:{id}:delayed` | Public events delayed by one full hand (tournament observers, streaming, "rail" in Real Money) |
| `acct:{accountId}` | Private events: own hole cards, own legal actions, balance changes, notifications |

Hole cards are **never** emitted to a table room; the gateway sends them to the owner's socket only. An outbound filter in the gateway drops and alerts on any event with hole-card fields addressed to a room (defence in depth, KP-ENG-01 §11).

## 3.4 Error codes

@widths 2,3
| Code | Meaning |
|---|---|
| `UNAUTHORIZED`, `TOKEN_EXPIRED`, `BANNED`, `UPGRADE_REQUIRED` | Session |
| `VALIDATION_FAILED` | Payload schema invalid (unknown fields rejected) |
| `RATE_LIMITED` | Too many events (default 15/s per socket; chat 1 per 2 s) |
| `TABLE_NOT_FOUND`, `NOT_SEATED`, `SEAT_TAKEN`, `TABLE_FULL` | Table context |
| `NOT_YOUR_TURN`, `STALE_HAND`, `ILLEGAL_ACTION`, `ILLEGAL_AMOUNT` | Action validation |
| `BUYIN_OUT_OF_RANGE`, `RATHOLE_MIN_BUYIN`, `MAX_TABLES_REACHED` | Seating rules |
| `SEATING_RESTRICTED` | Same-table restriction (no details, to avoid revealing links) |
| `INSUFFICIENT_FUNDS`, `LIMIT_REACHED`, `SELF_EXCLUDED`, `JURISDICTION_BLOCKED`, `KYC_REQUIRED` | Money and compliance |
| `TABLE_PAUSED` | Wallet or table recovery in progress |
| `INTERNAL` | Server error; safe to retry with the same `clientActionId` |

# 4. Session Events

@widths 1.7,0.6,2.7
| Event | Dir | Payload |
|---|---|---|
| `session:ready` | S→C | `{ accountId, screenName, mode, serverTime, tables: [{tableId, seat?, role}], fastfold: [...], tournaments: [...] }` |
| `session:refresh` | C→S | `{ token }` → ack `{ expiresAt }` |
| `session:replaced` | S→C | `{}` then disconnect |
| `session:revoked` | S→C | `{ reason: "logout" \| "banned" \| "suspended" \| "self_excluded" \| "password_changed" }` then disconnect |
| `system:announcement` | S→C | `{ id, title, body, level }` |
| `system:maintenance` | S→C | `{ startsAt, message }` — no new hands after `startsAt` |
| `wallet:balance` | S→C | `{ currency, cash, bonus, locked, onTables }` after any posting for the account |
| `limits:warning` | S→C | Responsible-gaming reality check or limit approaching `{ kind, used, limit, sessionMinutes, netResult }` |

# 5. Lobby Events

@widths 1.8,0.6,2.6
| Event | Dir | Payload |
|---|---|---|
| `lobby:subscribe` | C→S | `{ poolId, format, variant?, stakes? }` → ack `{ snapshot: [TableSummary] }` |
| `lobby:update` | S→C | Delta `{ poolId, upserts: [TableSummary], removals: [tableId] }`, at most 1 per second |
| `lobby:unsubscribe` | C→S | `{ poolId }` |
| `lobby:waitlist_join` | C→S | `{ tableId \| templateId }` → ack `{ position }` |
| `lobby:waitlist_leave` | C→S | `{ tableId \| templateId }` |
| `lobby:seat_offer` | S→C | `{ tableId, seat, expiresAt }` (20 s) |

`TableSummary = { tableId, name, variant, structure, stakes, currency, maxSeats, seated, waitlist, avgPot, playersPerFlop, handsPerHour, features: ["rit","straddle"] }`

# 6. Table Events

## 6.1 Seating (client → server)

@widths 1.6,3.4
| Event | Payload and ack |
|---|---|
| `table:open` | `{ tableId }` → ack `{ snapshot }` (observe; delayed room in tournaments) |
| `table:close` | `{ tableId }` |
| `table:sit` | `{ tableId, seat?, buyIn, waitForBigBlind, clientActionId }` → ack `{ seat, stack }` |
| `table:topup` | `{ tableId, amount, clientActionId }` → ack `{ pendingAmount }` (applied between hands) |
| `table:sit_out` / `table:sit_in` | `{ tableId }` |
| `table:stand` | `{ tableId }` → ack `{ standsAfterHand: bool }` |
| `table:settings` | `{ tableId, autoMuck, autoPostBlinds, autoRebuy?, runItTwice }` |
| `table:chat` | `{ tableId, text }` (filtered; players can mute; Real Money pools may restrict to presets) |
| `table:resync` | `{ tableId, lastSeq }` → ack `{ events: [...] }` or `{ snapshot }` |

## 6.2 Table state (server → client)

@widths 1.8,3.2
| Event | Payload |
|---|---|
| `table:snapshot` | Full state for the receiver (section 6.4) |
| `table:player_joined` / `table:player_left` | `{ seat, screenName, avatarId, stack }` / `{ seat }` |
| `table:player_status` | `{ seat, status: "active" \| "sitting_out" \| "disconnected" \| "waiting_bb" }` |
| `table:stack_changed` | `{ seat, stack, reason: "topup" \| "settlement" }` |
| `table:paused` / `table:resumed` | `{ reason }` |
| `table:chat_message` | `{ seat, text }` |

## 6.3 Hand events

@widths 1.6,0.6,2.8
| Event | Dir | Payload |
|---|---|---|
| `hand:started` | S→C | `{ handId, button, sb, bb, ante, straddle?, seats: [{seat, stack}], commitment }` |
| `hand:hole_cards` | S→C private | `{ handId, cards: ["Ah","Kd"] }` |
| `turn:start` | S→C | `{ handId, seat, deadline, timeBank }` (public) |
| `turn:legal` | S→C private | `{ handId, toCall, canCheck, minTo, maxTo, presets: [ {label:"½ pot", to}, … ] }` |
| `action:submit` | C→S | `{ handId, type: "fold"\|"check"\|"call"\|"bet"\|"raise"\|"allin", to?, clientActionId }` → ack `{ accepted: true }` |
| `action:made` | S→C | `{ handId, seat, type, to?, added, stack, pot, auto?: true }` |
| `action:timebank` | S→C | `{ handId, seat, timeBankRemaining }` |
| `street:dealt` | S→C | `{ handId, street: "flop"\|"turn"\|"river", cards, pots: [{amount}] }` |
| `hand:rit_offer` | S→C private | `{ handId, expiresAt }` → reply `hand:rit_response { handId, accept }` |
| `hand:showdown` | S→C | `{ handId, shows: [{ seat, cards, handName }], mucks: [seat] }` |
| `hand:completed` | S→C | `{ handId, board, pots: [{amount, rake, winners: [{seat, amount, handName}]}], returned, stacks: [{seat, stack}], reveal: { deck, salt } }` |
| `hand:voided` | S→C | `{ handId, reason }` — stacks restored to the last settled state |

The `reveal` field lets any player verify the deck against the `commitment` from `hand:started` (KP-ENG-13 §5). The client app offers a "verify this hand" button.

## 6.4 Snapshot (private to the receiver)

```
{ "tableId": "t_4Kx", "seq": 1842, "config": { "variant": "plo4", "structure": "PL", "sb": 5, "bb": 10,
    "currency": "USD", "maxSeats": 6, "features": ["rit"] },
  "seats": [ { "seat": 1, "screenName": "simba_07", "stack": 1880, "status": "active", "bet": 0 }, ... ],
  "yourSeat": 3, "hand": { "handId": "h_…", "button": 6, "street": "turn", "board": ["2s","7d","Kc","9h"],
    "pots": [ { "amount": 420 } ], "yourCards": ["As","Ad","Kh","Qh"],
    "turn": { "seat": 3, "deadline": 1790500130000, "timeBank": 30 }, "legal": { ... } } }
```

# 7. Fast-Fold Events

@widths 1.6,0.6,2.8
| Event | Dir | Payload |
|---|---|---|
| `ff:join` | C→S | `{ poolId, buyIn, clientActionId }` → ack `{ entryId, stack }` |
| `ff:seated` | S→C private | `{ entryId, tableId, seat }` — the client opens the virtual table (a normal table stream follows) |
| `ff:fold_now` | C→S | `{ entryId, handId }` — fast fold before the player's turn; ack `{ nextHandInMs }` |
| `ff:leave` | C→S | `{ entryId }` → ack `{ leavesAfterHand }` |
| `ff:status` | S→C | `{ poolId, players, avgWaitMs }` |

# 8. Tournament and Spin Events

Registration, unregistration and ticket use are REST operations (KP-ENG-03 §8). Real-time events go to `acct:{accountId}`:

@widths 1.8,0.6,2.6
| Event | Dir | Payload |
|---|---|---|
| `tourn:starting` | S→C | `{ tournamentId, startsAt }` (5 min and 1 min before) |
| `tourn:table_assigned` | S→C | `{ tournamentId, tableId, seat }` — client opens the table |
| `tourn:moved` | S→C | `{ tournamentId, fromTableId, toTableId, seat }` (balancing) |
| `tourn:level` | S→C | `{ tournamentId, level, sb, bb, ante, nextLevelAt }` |
| `tourn:break` | S→C | `{ tournamentId, until }` |
| `tourn:hand_for_hand` | S→C | `{ tournamentId, active: bool }` |
| `tourn:rebuy_offer` | S→C | `{ tournamentId, kind: "rebuy" \| "addon", cost, chips, expiresAt }` |
| `tourn:rebuy` | C→S | `{ tournamentId, kind, clientActionId }` → ack `{ chips }` |
| `tourn:bounty` | S→C | `{ tournamentId, amount, eliminatedScreenName }` |
| `tourn:eliminated` | S→C | `{ tournamentId, place, prize? }` |
| `tourn:completed` | S→C | `{ tournamentId, place, prize? }` |
| `spin:multiplier` | S→C | `{ tournamentId, multiplier, prizePool, split }` — revealed with an animation before the first hand |

Standings are read over REST (`GET /tournaments/{id}/standings`) to keep socket traffic small.

# 9. Moderation and Integrity Events

@widths 1.8,0.6,2.6
| Event | Dir | Payload |
|---|---|---|
| `mod:warning` | S→C | `{ message }` |
| `mod:removed` | S→C | `{ tableId, reason }` — player removed from a table; stack handled per KP-ENG-08 §5.5 |
| `client:telemetry` | C→S | Batched, privacy-reviewed interaction signals (focus/background changes, input timing buckets, app integrity verdict refresh) at most every 30 s (KP-ENG-09 §4) |

# 10. Sequence Example (cash hand)

```
C: connect (auth.token)                          S: session:ready
C: lobby:subscribe {poolId:"usd-intl", format:"cash"}   S: ack {snapshot}
C: table:sit {tableId:"t_4Kx", buyIn:1000}       S: ack {seat:3, stack:1000}
S: hand:started {handId, button:6, commitment}
S: hand:hole_cards {cards:["As","Kd"]}          (private)
S: turn:start {seat:3} + turn:legal {...}        (legal is private)
C: action:submit {type:"raise", to:30}           S: ack {accepted}   S: action:made {seat:3, type:"raise", to:30}
S: street:dealt {street:"flop", cards:["2s","7d","Kc"]}
...                                              S: hand:showdown {...}
S: hand:completed {pots, stacks, reveal}         S: wallet:balance {...}
```

# 11. Security Notes

- Payloads are validated against the AsyncAPI-generated schemas; unknown fields are rejected.
- Per-socket and per-account rate limits in Redis; abusive clients are disconnected and flagged.
- Decision timing (`ms` per action) is measured on the server from `turn:start` emission to `action:submit` receipt and stored in the hand record for integrity analysis; client-reported timings are informational only.
- Real Money gateways re-check jurisdiction, self-exclusion and limits on `table:sit`, `ff:join`, `tourn:rebuy` and on `session:ready`.
- Observers of Real Money tables do not see hole cards ever; tournament and streamed tables are delayed by at least one hand.
