#!/usr/bin/env python3
"""Generate 03-engineering/specs/openapi.yaml (OpenAPI 3.1) and asyncapi.yaml (AsyncAPI 3.1) for Kilima Poker.

The endpoint and event catalogues below are the machine-readable contract behind KP-ENG-03 and KP-ENG-04.
Run:  python3 tools/gen_specs.py   (then tools/check_api_consistency.py)"""
import os, re, yaml

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "03-engineering", "specs")

# ------------------------------------------------------------------------------------------------ schemas
S = {
    "Money": {"type": "object", "required": ["amount", "currency"], "additionalProperties": False,
              "properties": {"amount": {"type": "integer", "format": "int64", "description": "Minor units"},
                             "currency": {"type": "string", "pattern": "^([A-Z]{3}|KPC)$"}}},
    "Error": {"type": "object", "required": ["error"], "properties": {"error": {"type": "object", "required": ["code", "message"],
              "properties": {"code": {"type": "string"}, "message": {"type": "string"}, "details": {"type": "object"},
                             "requestId": {"type": "string"}}}}},
    "Page": {"type": "object", "properties": {"items": {"type": "array", "items": {}}, "nextCursor": {"type": ["string", "null"]}}},
    "Tokens": {"type": "object", "properties": {"accessToken": {"type": "string"}, "expiresIn": {"type": "integer"},
               "refreshToken": {"type": "string", "description": "Apps only; web receives an httpOnly cookie"}}},
    "Challenge": {"type": "object", "properties": {"challengeId": {"type": "string"}, "methods": {"type": "array", "items": {"type": "string",
                  "enum": ["otp_sms", "otp_whatsapp", "totp", "passkey"]}}, "expiresAt": {"type": "string", "format": "date-time"}}},
    "Profile": {"type": "object", "properties": {"id": {"type": "string"}, "screenName": {"type": "string"}, "avatarId": {"type": "string"},
                "country": {"type": "string"}, "locale": {"type": "string"}, "preferences": {"type": "object"},
                "verification": {"type": "object", "properties": {"phone": {"type": "boolean"}, "kyc": {"type": "string"}}},
                "rewardsTier": {"type": "string"}}},
    "Pool": {"type": "object", "properties": {"id": {"type": "string"}, "currency": {"type": "string"}, "name": {"type": "string"},
             "formats": {"type": "array", "items": {"type": "string"}}}},
    "TableSummary": {"type": "object", "properties": {"tableId": {"type": "string"}, "name": {"type": "string"},
                     "variant": {"type": "string", "enum": ["nlhe", "plo4", "plo5", "plo6", "shortdeck"]},
                     "structure": {"type": "string", "enum": ["NL", "PL"]}, "stakes": {"type": "object"}, "currency": {"type": "string"},
                     "maxSeats": {"type": "integer"}, "seated": {"type": "integer"}, "waitlist": {"type": "integer"},
                     "avgPot": {"type": "integer"}, "playersPerFlop": {"type": "integer"}, "handsPerHour": {"type": "integer"},
                     "features": {"type": "array", "items": {"type": "string"}}}},
    "HandRecord": {"type": "object", "description": "KP-ENG-06 §11", "properties": {"handId": {"type": "string"}, "tableId": {"type": "string"},
                   "variant": {"type": "string"}, "format": {"type": "string"}, "currency": {"type": "string"}, "board": {"type": "object"},
                   "seats": {"type": "array", "items": {"type": "object"}}, "actions": {"type": "array", "items": {"type": "object"}},
                   "pots": {"type": "array", "items": {"type": "object"}}, "rake": {"type": "object"}, "rng": {"type": "object"}}},
    "Balance": {"type": "object", "properties": {"currency": {"type": "string"}, "cash": {"type": "integer"}, "bonus": {"type": "integer"},
                "locked": {"type": "integer"}, "pendingWithdrawal": {"type": "integer"}, "onTables": {"type": "integer"},
                "inTournaments": {"type": "integer"}, "tickets": {"type": "integer"}}},
    "Transaction": {"type": "object", "properties": {"txId": {"type": "string"}, "type": {"type": "string"}, "createdAt": {"type": "string"},
                    "entries": {"type": "array", "items": {"type": "object", "properties": {"account": {"type": "string"}, "amount": {"$ref": "#/components/schemas/Money"}}}}}},
    "Tournament": {"type": "object", "properties": {"id": {"type": "string"}, "name": {"type": "string"}, "type": {"type": "string"},
                   "variant": {"type": "string"}, "buyIn": {"$ref": "#/components/schemas/Money"}, "fee": {"$ref": "#/components/schemas/Money"},
                   "guarantee": {"$ref": "#/components/schemas/Money"}, "status": {"type": "string"}, "entrants": {"type": "integer"},
                   "scheduledStart": {"type": "string", "format": "date-time"}}},
    "Registration": {"type": "object", "properties": {"entryId": {"type": "string"}, "entryNo": {"type": "integer"}, "txId": {"type": "string"}}},
    "PaymentMethod": {"type": "object", "properties": {"methodId": {"type": "string"}, "type": {"type": "string", "enum": ["mobile_money", "card", "bank"]},
                      "provider": {"type": "string"}, "currencies": {"type": "array", "items": {"type": "string"}},
                      "min": {"$ref": "#/components/schemas/Money"}, "max": {"$ref": "#/components/schemas/Money"}, "fee": {"type": "object"}}},
    "Payment": {"type": "object", "properties": {"paymentId": {"type": "string"}, "direction": {"type": "string"}, "status": {"type": "string",
                "enum": ["initiated", "awaiting_customer", "pending", "review", "approved", "completed", "failed", "rejected", "cancelled", "reversed"]},
                "amount": {"$ref": "#/components/schemas/Money"}, "credit": {"$ref": "#/components/schemas/Money"}, "instructions": {"type": "string"}}},
    "Instrument": {"type": "object", "properties": {"id": {"type": "string"}, "type": {"type": "string"}, "masked": {"type": "string"},
                   "holderNameMatch": {"type": "string", "enum": ["matched", "mismatch", "unknown"]}}},
    "Limits": {"type": "object", "properties": {"deposit": {"type": "object"}, "loss": {"type": "object"}, "wager": {"type": "object"},
               "sessionMinutes": {"type": "integer"}, "coolOffUntil": {"type": ["string", "null"]}, "selfExcludedUntil": {"type": ["string", "null"]}}},
    "ComplianceStatus": {"type": "object", "properties": {"kycStatus": {"type": "string"}, "jurisdiction": {"type": "string"},
                         "ageVerified": {"type": "boolean"}, "requiredSteps": {"type": "array", "items": {"type": "string"}}}},
    "Case": {"type": "object", "properties": {"id": {"type": "string"}, "type": {"type": "string"}, "severity": {"type": "string"},
             "score": {"type": "number"}, "status": {"type": "string"}, "accounts": {"type": "array", "items": {"type": "string"}}, "evidence": {"type": "object"}}},
    "Generic": {"type": "object"},
}

# ------------------------------------------------------------------------------------------------ endpoints
# (method, path, roles, summary, tag, request schema, response schema, flags)
# flags: I = Idempotency-Key required, R = [Real] only, P = [Play] only, U = step-up, L = paginated list
E = [
    # auth
    ("post", "/auth/register/start", "public", "Start registration; sends OTP", "Auth", "Generic", "Challenge", ""),
    ("post", "/auth/register/verify", "public", "Verify OTP; returns a registration token", "Auth", "Generic", "Generic", ""),
    ("post", "/auth/register/complete", "registration-token", "Create account; returns tokens", "Auth", "Generic", "Tokens", ""),
    ("post", "/auth/login", "public", "Password login; returns tokens or a step-up challenge", "Auth", "Generic", "Tokens", ""),
    ("post", "/auth/otp/send", "challenge", "Send or resend an OTP for a challenge", "Auth", "Generic", "Challenge", ""),
    ("post", "/auth/otp/verify", "challenge", "Complete a login or step-up challenge", "Auth", "Generic", "Tokens", ""),
    ("post", "/auth/passkey/options", "public", "WebAuthn registration or login options", "Auth", "Generic", "Generic", ""),
    ("post", "/auth/passkey/verify", "public", "Verify a WebAuthn response", "Auth", "Generic", "Tokens", ""),
    ("post", "/auth/totp/enroll", "user", "Start TOTP enrolment", "Auth", "Generic", "Generic", "U"),
    ("post", "/auth/totp/confirm", "user", "Confirm TOTP", "Auth", "Generic", "Generic", ""),
    ("post", "/auth/step-up", "user", "Start a step-up challenge", "Auth", "Generic", "Challenge", ""),
    ("post", "/auth/refresh", "refresh-token", "Rotate the refresh token", "Auth", None, "Tokens", ""),
    ("post", "/auth/logout", "user", "Revoke the current session", "Auth", None, None, ""),
    ("post", "/auth/logout-all", "user", "Revoke all sessions", "Auth", None, None, ""),
    ("get", "/auth/sessions", "user", "Active sessions and devices", "Auth", None, "Page", "L"),
    ("delete", "/auth/sessions/{sid}", "user", "Revoke one session", "Auth", None, None, ""),
    ("get", "/auth/me", "user", "Identity, roles, status", "Auth", None, "Generic", ""),
    ("post", "/auth/password/forgot", "public", "Start password reset (always 202)", "Auth", "Generic", None, ""),
    ("post", "/auth/password/reset", "challenge", "Reset password with OTP proof", "Auth", "Generic", None, ""),
    ("post", "/auth/password/change", "user", "Change password", "Auth", "Generic", None, "U"),
    ("post", "/auth/launch", "launch-token", "Exchange a B2B launch token", "Auth", "Generic", "Tokens", ""),
    ("get", "/auth/.well-known/jwks.json", "public", "Public signing keys", "Auth", None, "Generic", ""),
    # players
    ("get", "/players/me", "user", "Own profile", "Players", None, "Profile", ""),
    ("patch", "/players/me", "user", "Update preferences", "Players", "Generic", "Profile", ""),
    ("put", "/players/me/avatar", "user", "Choose or upload an avatar", "Players", "Generic", "Profile", ""),
    ("get", "/players/{id}", "user", "Public profile", "Players", None, "Profile", ""),
    ("get", "/players/me/stats", "self", "Own statistics", "Players", None, "Generic", ""),
    ("get", "/players/me/sessions", "self", "Session history", "Players", None, "Page", "L"),
    ("get", "/players/me/notes", "self", "Notes on other players", "Players", None, "Page", "L"),
    ("put", "/players/me/notes/{playerId}", "self", "Create or update a note", "Players", "Generic", "Generic", ""),
    ("get", "/players/me/blocklist", "self", "Chat blocklist", "Players", None, "Page", "L"),
    ("put", "/players/me/blocklist/{playerId}", "self", "Block or unblock chat", "Players", "Generic", None, ""),
    # lobby
    ("get", "/lobby/pools", "user", "Pools available to the caller", "Lobby", None, "Page", "L"),
    ("get", "/lobby/pools/{poolId}/cash", "user", "Cash tables and templates", "Lobby", None, "Page", "L"),
    ("get", "/lobby/pools/{poolId}/fastfold", "user", "Fast-fold pools", "Lobby", None, "Page", "L"),
    ("get", "/lobby/pools/{poolId}/sng", "user", "Sit & Go and Spin queues", "Lobby", None, "Page", "L"),
    ("get", "/lobby/pools/{poolId}/tournaments", "user", "Tournament schedule", "Lobby", None, "Page", "L"),
    ("get", "/lobby/search", "user", "Find a table or tournament", "Lobby", None, "Page", "L"),
    # tables & hands
    ("get", "/tables/{tableId}", "user", "Table configuration and summary", "Hands", None, "TableSummary", ""),
    ("get", "/hands", "self", "Own hand history list", "Hands", None, "Page", "L"),
    ("get", "/hands/{handId}", "participant,integrity_analyst", "Hand record", "Hands", None, "HandRecord", ""),
    ("get", "/hands/{handId}/replay", "participant,integrity_analyst", "Replay data", "Hands", None, "HandRecord", ""),
    ("get", "/hands/{handId}/verify", "participant", "Deck, salt and commitment", "Hands", None, "Generic", ""),
    ("post", "/hands/export", "self", "Export own hand histories (async)", "Hands", "Generic", "Generic", ""),
    # wallet
    ("get", "/wallet/balances", "player", "Balances by currency", "Wallet", None, "Balance", ""),
    ("get", "/wallet/transactions", "player", "Own statement", "Wallet", None, "Page", "L"),
    ("get", "/wallet/transactions/{txId}", "self", "One transaction", "Wallet", None, "Transaction", ""),
    ("get", "/wallet/tickets", "player", "Tournament tickets", "Wallet", None, "Page", "L"),
    ("post", "/wallet/play-topup", "player", "Free play-chip top-up", "Wallet", None, "Balance", "P I"),
    # tournaments
    ("get", "/tournaments/{id}", "user", "Tournament details", "Tournaments", None, "Tournament", ""),
    ("get", "/tournaments/{id}/standings", "user", "Live standings", "Tournaments", None, "Page", "L"),
    ("get", "/tournaments/{id}/payouts", "user", "Payout table", "Tournaments", None, "Generic", ""),
    ("get", "/tournaments/{id}/tables", "user", "Tournament tables", "Tournaments", None, "Page", "L"),
    ("post", "/tournaments/{id}/registrations", "player", "Register or re-enter", "Tournaments", "Generic", "Registration", "I"),
    ("delete", "/tournaments/{id}/registrations/me", "player", "Unregister before start", "Tournaments", None, None, ""),
    ("get", "/tournaments/me", "player", "Own registrations", "Tournaments", None, "Page", "L"),
    ("post", "/sng/{queueId}/registrations", "player", "Register for a Sit & Go or Spin", "Tournaments", "Generic", "Registration", "I"),
    ("delete", "/sng/{queueId}/registrations/me", "player", "Leave a Sit & Go or Spin queue", "Tournaments", None, None, ""),
    # cashier
    ("get", "/cashier/methods", "player", "Available payment methods", "Cashier", None, "Page", "R L"),
    ("post", "/cashier/deposits", "player", "Start a deposit", "Cashier", "Generic", "Payment", "R I"),
    ("get", "/cashier/deposits/{paymentId}", "self", "Deposit status", "Cashier", None, "Payment", "R"),
    ("get", "/cashier/instruments", "player", "Payout instruments", "Cashier", None, "Page", "R L"),
    ("post", "/cashier/instruments", "player", "Add a payout instrument", "Cashier", "Generic", "Instrument", "R I U"),
    ("delete", "/cashier/instruments/{id}", "player", "Remove a payout instrument", "Cashier", None, None, "R U"),
    ("post", "/cashier/withdrawals", "player", "Request a withdrawal", "Cashier", "Generic", "Payment", "R I U"),
    ("get", "/cashier/withdrawals", "player", "Own withdrawals", "Cashier", None, "Page", "R L"),
    ("post", "/cashier/withdrawals/{id}/cancel", "self", "Cancel a pending withdrawal", "Cashier", None, "Payment", "R"),
    ("get", "/cashier/fx-quote", "player", "Conversion quote", "Cashier", None, "Generic", "R"),
    ("post", "/cashier/webhooks/{provider}", "provider-signature", "Payment provider callbacks", "Cashier", "Generic", None, "R"),
    # compliance
    ("get", "/compliance/status", "player", "Verification and jurisdiction status", "Compliance", None, "ComplianceStatus", ""),
    ("post", "/compliance/kyc/session", "player", "Start a KYC session", "Compliance", None, "Generic", "R"),
    ("post", "/compliance/kyc/webhooks/{provider}", "provider-signature", "KYC provider callbacks", "Compliance", "Generic", None, "R"),
    ("post", "/compliance/geolocation", "player", "Submit a signed location proof", "Compliance", "Generic", "Generic", "R"),
    ("get", "/compliance/limits", "player", "Responsible-gaming limits", "Compliance", None, "Limits", ""),
    ("put", "/compliance/limits", "player", "Set limits (raises need step-up)", "Compliance", "Limits", "Limits", ""),
    ("post", "/compliance/cool-off", "player", "Start a cooling-off period", "Compliance", "Generic", "Limits", ""),
    ("post", "/compliance/self-exclusion", "player", "Self-exclude", "Compliance", "Generic", "Limits", ""),
    ("put", "/compliance/reality-check", "player", "Reality-check interval", "Compliance", "Generic", "Limits", ""),
    ("get", "/compliance/activity-statement", "player", "Activity statement", "Compliance", None, "Generic", ""),
    # rewards & clubs
    ("get", "/rewards/me", "player", "Loyalty status", "Rewards", None, "Generic", ""),
    ("get", "/rewards/missions", "player", "Missions", "Rewards", None, "Page", "L"),
    ("post", "/rewards/missions/{id}/claim", "player", "Claim a mission reward", "Rewards", None, "Generic", "I"),
    ("get", "/promotions", "player", "Active promotions", "Rewards", None, "Page", "L"),
    ("post", "/promotions/{code}/redeem", "player", "Redeem a promo code", "Rewards", None, "Generic", "I"),
    ("get", "/leaderboards/{id}", "user", "Leaderboard standings", "Rewards", None, "Page", "L"),
    ("get", "/clubs/me", "player", "Own clubs", "Clubs", None, "Page", "L"),
    ("post", "/clubs", "club_owner", "Create a club", "Clubs", "Generic", "Generic", "I"),
    ("post", "/clubs/{id}/members", "club_owner", "Invite a member", "Clubs", "Generic", "Generic", ""),
    ("post", "/clubs/join", "player", "Join a club with a code", "Clubs", "Generic", "Generic", ""),
    # integrity
    ("post", "/integrity/reports", "player", "Report a player", "Integrity", "Generic", "Generic", ""),
    ("get", "/integrity/cases", "integrity_analyst", "Case queue", "Integrity", None, "Page", "L"),
    ("get", "/integrity/cases/{id}", "integrity_analyst", "Case details", "Integrity", None, "Case", ""),
    ("post", "/integrity/cases/{id}/decision", "integrity_analyst", "Decide a case", "Integrity", "Generic", "Case", ""),
    ("get", "/integrity/accounts/{id}/graph", "integrity_analyst", "Linked accounts graph", "Integrity", None, "Generic", ""),
    ("post", "/integrity/spot-checks", "integrity_analyst", "Create a manual review", "Integrity", "Generic", "Case", ""),
    # notifications
    ("get", "/notifications", "user", "In-app inbox", "Notifications", None, "Page", "L"),
    ("post", "/notifications/{id}/read", "self", "Mark read", "Notifications", None, None, ""),
    ("put", "/notifications/preferences", "user", "Notification preferences", "Notifications", "Generic", "Generic", ""),
    ("put", "/notifications/push-token", "user", "Register a push token", "Notifications", "Generic", None, ""),
    # admin
    ("get", "/admin/accounts", "support", "Search accounts", "Admin", None, "Page", "L"),
    ("get", "/admin/accounts/{id}", "support", "Account 360° view", "Admin", None, "Generic", ""),
    ("post", "/admin/accounts/{id}/status", "support,compliance_officer,admin", "Change account status", "Admin", "Generic", "Generic", ""),
    ("post", "/admin/accounts/{id}/kick", "support", "Remove from all tables", "Admin", "Generic", None, ""),
    ("post", "/admin/wallet/adjustments", "finance", "Manual adjustment (four-eyes above threshold)", "Admin", "Generic", "Transaction", "I"),
    ("post", "/admin/wallet/locks", "risk_analyst,integrity_analyst", "Lock or unlock funds", "Admin", "Generic", "Transaction", "I"),
    ("get", "/admin/withdrawals", "risk_analyst", "Withdrawal review queue", "Admin", None, "Page", "L"),
    ("post", "/admin/withdrawals/{id}/decision", "risk_analyst", "Approve or reject a withdrawal", "Admin", "Generic", "Payment", ""),
    ("get", "/admin/pools", "game_ops", "List pools", "Admin", None, "Page", "L"),
    ("post", "/admin/pools", "game_ops", "Create or update a pool", "Admin", "Generic", "Pool", ""),
    ("get", "/admin/table-templates", "game_ops", "List table templates", "Admin", None, "Page", "L"),
    ("post", "/admin/table-templates", "game_ops", "Create or update a table template", "Admin", "Generic", "Generic", ""),
    ("get", "/admin/tournaments", "game_ops", "List tournaments", "Admin", None, "Page", "L"),
    ("post", "/admin/tournaments", "game_ops", "Create a tournament", "Admin", "Generic", "Tournament", ""),
    ("patch", "/admin/tournaments", "game_ops", "Bulk edit schedule", "Admin", "Generic", "Generic", ""),
    ("post", "/admin/tournaments/{id}/pause", "game_ops", "Pause a tournament", "Admin", "Generic", "Tournament", ""),
    ("post", "/admin/tournaments/{id}/resume", "game_ops", "Resume a tournament", "Admin", "Generic", "Tournament", ""),
    ("post", "/admin/tournaments/{id}/cancel", "game_ops", "Cancel a tournament (four-eyes)", "Admin", "Generic", "Tournament", ""),
    ("get", "/admin/rake-schedules", "finance", "Rake schedules", "Admin", None, "Page", "L"),
    ("put", "/admin/rake-schedules", "finance", "Update rake schedules (four-eyes)", "Admin", "Generic", "Generic", ""),
    ("get", "/admin/jurisdictions/{code}", "compliance_officer", "Jurisdiction policy", "Admin", None, "Generic", ""),
    ("put", "/admin/jurisdictions/{code}", "compliance_officer", "Update jurisdiction policy (four-eyes)", "Admin", "Generic", "Generic", ""),
    ("get", "/admin/spin-paytables", "finance,compliance_officer", "Spin paytables", "Admin", None, "Page", "L"),
    ("put", "/admin/spin-paytables", "finance,compliance_officer", "Activate a certified paytable (four-eyes)", "Admin", "Generic", "Generic", ""),
    ("post", "/admin/promotions", "admin", "Create a promotion", "Admin", "Generic", "Generic", ""),
    ("post", "/admin/announcements", "admin", "Create an announcement", "Admin", "Generic", "Generic", ""),
    ("get", "/admin/reports/{report}", "finance,compliance_officer", "Financial and regulatory reports", "Admin", None, "Generic", ""),
    ("get", "/admin/audit", "admin,compliance_officer", "Audit log search", "Admin", None, "Page", "L"),
    # operator
    ("post", "/operator/v1/sessions", "operator-signature", "Create a player launch session", "Operator", "Generic", "Generic", "I"),
    ("post", "/operator/v1/players/{operatorPlayerId}/status", "operator-signature", "Push player status changes", "Operator", "Generic", None, ""),
    ("get", "/operator/v1/players/{operatorPlayerId}/balance", "operator-signature", "Poker balance (transfer wallet)", "Operator", None, "Balance", ""),
    ("post", "/operator/v1/transfers", "operator-signature", "Transfer in or out (transfer wallet)", "Operator", "Generic", "Transaction", "I"),
    ("get", "/operator/v1/reports/{report}", "operator-signature", "Operator reports and settlement", "Operator", None, "Generic", ""),
    # health
    ("get", "/healthz", "public", "Liveness", "Health", None, None, ""),
    ("get", "/readyz", "public", "Readiness", "Health", None, None, ""),
    ("get", "/version", "public", "Build version", "Health", None, "Generic", ""),
    ("get", "/status", "public", "Public status summary", "Health", None, "Generic", ""),
]

# ------------------------------------------------------------------------------------------------ events
# (name, direction C2S|S2C, private, summary, payload fields, ack fields)
EV = [
    ("session:ready", "S2C", True, "Session established", ["accountId", "screenName", "mode", "serverTime", "tables", "fastfold", "tournaments"], None),
    ("session:refresh", "C2S", False, "Refresh the access token on an open socket", ["token"], ["expiresAt"]),
    ("session:replaced", "S2C", True, "Another connection took over", [], None),
    ("session:revoked", "S2C", True, "Session revoked; socket closed", ["reason"], None),
    ("system:announcement", "S2C", False, "Announcement", ["id", "title", "body", "level"], None),
    ("system:maintenance", "S2C", False, "Planned maintenance", ["startsAt", "message"], None),
    ("wallet:balance", "S2C", True, "Balance changed", ["currency", "cash", "bonus", "locked", "onTables"], None),
    ("limits:warning", "S2C", True, "Responsible-gaming reality check or limit warning", ["kind", "used", "limit", "sessionMinutes", "netResult"], None),
    ("lobby:subscribe", "C2S", False, "Subscribe to a pool's lobby", ["poolId", "format", "variant", "stakes"], ["snapshot"]),
    ("lobby:update", "S2C", False, "Lobby delta", ["poolId", "upserts", "removals"], None),
    ("lobby:unsubscribe", "C2S", False, "Unsubscribe", ["poolId"], []),
    ("lobby:waitlist_join", "C2S", False, "Join a waitlist", ["tableId", "templateId"], ["position"]),
    ("lobby:waitlist_leave", "C2S", False, "Leave a waitlist", ["tableId", "templateId"], []),
    ("lobby:seat_offer", "S2C", True, "A seat is offered", ["tableId", "seat", "expiresAt"], None),
    ("table:open", "C2S", False, "Open (observe) a table", ["tableId"], ["snapshot"]),
    ("table:close", "C2S", False, "Close a table view", ["tableId"], []),
    ("table:sit", "C2S", False, "Sit with a buy-in", ["tableId", "seat", "buyIn", "waitForBigBlind", "clientActionId"], ["seat", "stack"]),
    ("table:topup", "C2S", False, "Top up between hands", ["tableId", "amount", "clientActionId"], ["pendingAmount"]),
    ("table:sit_out", "C2S", False, "Sit out", ["tableId"], []),
    ("table:sit_in", "C2S", False, "Sit back in", ["tableId"], []),
    ("table:stand", "C2S", False, "Leave the table", ["tableId"], ["standsAfterHand"]),
    ("table:settings", "C2S", False, "Per-table settings", ["tableId", "autoMuck", "autoPostBlinds", "autoRebuy", "runItTwice"], []),
    ("table:chat", "C2S", False, "Chat message", ["tableId", "text"], []),
    ("table:resync", "C2S", False, "Recover missed events", ["tableId", "lastSeq"], ["events", "snapshot"]),
    ("table:snapshot", "S2C", True, "Full table state for the receiver", ["tableId", "seq", "config", "seats", "yourSeat", "hand"], None),
    ("table:player_joined", "S2C", False, "Player joined", ["seat", "screenName", "avatarId", "stack"], None),
    ("table:player_left", "S2C", False, "Player left", ["seat"], None),
    ("table:player_status", "S2C", False, "Player status", ["seat", "status"], None),
    ("table:stack_changed", "S2C", False, "Stack changed", ["seat", "stack", "reason"], None),
    ("table:paused", "S2C", False, "Table paused", ["reason"], None),
    ("table:resumed", "S2C", False, "Table resumed", ["reason"], None),
    ("table:chat_message", "S2C", False, "Chat message", ["seat", "text"], None),
    ("hand:started", "S2C", False, "Hand started, with deck commitment", ["handId", "button", "sb", "bb", "ante", "straddle", "seats", "commitment"], None),
    ("hand:hole_cards", "S2C", True, "Own hole cards", ["handId", "cards"], None),
    ("turn:start", "S2C", False, "A player's turn", ["handId", "seat", "deadline", "timeBank"], None),
    ("turn:legal", "S2C", True, "Legal actions for the player to act", ["handId", "toCall", "canCheck", "minTo", "maxTo", "presets"], None),
    ("action:submit", "C2S", False, "Submit an action", ["handId", "type", "to", "clientActionId"], ["accepted"]),
    ("action:made", "S2C", False, "Action applied", ["handId", "seat", "type", "to", "added", "stack", "pot", "auto"], None),
    ("action:timebank", "S2C", False, "Time bank in use", ["handId", "seat", "timeBankRemaining"], None),
    ("street:dealt", "S2C", False, "Board cards dealt", ["handId", "street", "cards", "pots"], None),
    ("hand:rit_offer", "S2C", True, "Run it twice offer", ["handId", "expiresAt"], None),
    ("hand:rit_response", "C2S", False, "Run it twice answer", ["handId", "accept"], []),
    ("hand:showdown", "S2C", False, "Showdown", ["handId", "shows", "mucks"], None),
    ("hand:completed", "S2C", False, "Hand result with deck reveal", ["handId", "board", "pots", "returned", "stacks", "reveal"], None),
    ("hand:voided", "S2C", False, "Hand voided", ["handId", "reason"], None),
    ("ff:join", "C2S", False, "Join a fast-fold pool", ["poolId", "buyIn", "clientActionId"], ["entryId", "stack"]),
    ("ff:seated", "S2C", True, "Seated at a virtual table", ["entryId", "tableId", "seat"], None),
    ("ff:fold_now", "C2S", False, "Fast fold", ["entryId", "handId"], ["nextHandInMs"]),
    ("ff:leave", "C2S", False, "Leave the pool", ["entryId"], ["leavesAfterHand"]),
    ("ff:status", "S2C", False, "Pool status", ["poolId", "players", "avgWaitMs"], None),
    ("tourn:starting", "S2C", True, "Tournament starting soon", ["tournamentId", "startsAt"], None),
    ("tourn:table_assigned", "S2C", True, "Table assignment", ["tournamentId", "tableId", "seat"], None),
    ("tourn:moved", "S2C", True, "Moved by balancing", ["tournamentId", "fromTableId", "toTableId", "seat"], None),
    ("tourn:level", "S2C", False, "Blind level", ["tournamentId", "level", "sb", "bb", "ante", "nextLevelAt"], None),
    ("tourn:break", "S2C", False, "Break", ["tournamentId", "until"], None),
    ("tourn:hand_for_hand", "S2C", False, "Hand-for-hand state", ["tournamentId", "active"], None),
    ("tourn:rebuy_offer", "S2C", True, "Rebuy or add-on offer", ["tournamentId", "kind", "cost", "chips", "expiresAt"], None),
    ("tourn:rebuy", "C2S", False, "Accept rebuy or add-on", ["tournamentId", "kind", "clientActionId"], ["chips"]),
    ("tourn:bounty", "S2C", True, "Bounty won", ["tournamentId", "amount", "eliminatedScreenName"], None),
    ("tourn:eliminated", "S2C", True, "Eliminated", ["tournamentId", "place", "prize"], None),
    ("tourn:completed", "S2C", True, "Tournament completed", ["tournamentId", "place", "prize"], None),
    ("spin:multiplier", "S2C", False, "Spin multiplier revealed", ["tournamentId", "multiplier", "prizePool", "split"], None),
    ("mod:warning", "S2C", True, "Moderator warning", ["message"], None),
    ("mod:removed", "S2C", True, "Removed from a table", ["tableId", "reason"], None),
    ("client:telemetry", "C2S", False, "Batched integrity telemetry", ["batch"], []),
]


def op_id(method, path):
    parts = [p for p in re.split(r"[/{}.\-]", path) if p]
    return method + "".join(w[:1].upper() + w[1:] for w in parts)


def openapi():
    paths = {}
    for method, path, roles, summary, tag, req, resp, flags in E:
        fl = flags.split()
        op = {"operationId": op_id(method, path), "summary": summary, "tags": [tag], "x-roles": roles.split(",")}
        if "R" in fl: op["x-mode"] = "real"
        if "P" in fl: op["x-mode"] = "play"
        if "U" in fl: op["x-step-up"] = True
        params = [{"name": n, "in": "path", "required": True, "schema": {"type": "string"}} for n in re.findall(r"{(\w+)}", path)]
        if "I" in fl:
            params.append({"$ref": "#/components/parameters/IdempotencyKey"})
        if "L" in fl:
            params += [{"$ref": "#/components/parameters/Limit"}, {"$ref": "#/components/parameters/Cursor"}]
        if params: op["parameters"] = params
        if req:
            op["requestBody"] = {"required": True, "content": {"application/json": {"schema": {"$ref": f"#/components/schemas/{req}"}}}}
        ok = "201" if (method == "post" and "I" in fl) else ("204" if resp is None else "200")
        responses = {ok: {"description": "Success"} if resp is None else
                     {"description": "Success", "content": {"application/json": {"schema": {"$ref": f"#/components/schemas/{resp}"}}}}}
        if roles not in ("public",):
            responses["401"] = {"$ref": "#/components/responses/Error"}
        responses["default"] = {"$ref": "#/components/responses/Error"}
        op["responses"] = responses
        if roles in ("public", "provider-signature", "operator-signature", "refresh-token", "challenge", "registration-token", "launch-token"):
            op["security"] = [] if roles in ("public", "refresh-token", "challenge", "registration-token", "launch-token") else [{"signedRequest": []}]
        paths.setdefault(path, {})[method] = op
    return {
        "openapi": "3.1.0",
        "info": {"title": "Kilima Poker API", "version": "1.0.0",
                 "description": "REST API v1 (KP-ENG-03). Gameplay and seating are on the real-time protocol (asyncapi.yaml). Money in integer minor units."},
        "servers": [{"url": "https://api.kilima.poker/api/v1", "description": "Real Money"},
                    {"url": "https://api.play.kilima.poker/api/v1", "description": "Play Money"}],
        "security": [{"bearerAuth": []}],
        "paths": paths,
        "components": {
            "securitySchemes": {"bearerAuth": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"},
                                "signedRequest": {"type": "apiKey", "in": "header", "name": "X-Signature",
                                                  "description": "HMAC-SHA256 signature (operators, providers) plus mTLS"}},
            "parameters": {"IdempotencyKey": {"name": "Idempotency-Key", "in": "header", "required": True, "schema": {"type": "string", "format": "uuid"}},
                           "Limit": {"name": "limit", "in": "query", "schema": {"type": "integer", "minimum": 1, "maximum": 100, "default": 20}},
                           "Cursor": {"name": "cursor", "in": "query", "schema": {"type": "string"}}},
            "responses": {"Error": {"description": "Error", "content": {"application/json": {"schema": {"$ref": "#/components/schemas/Error"}}}}},
            "schemas": S,
        },
    }


def asyncapi():
    channels, operations, messages = {}, {}, {}
    for name, direction, private, summary, fields, ack in EV:
        mid = name.replace(":", "_")
        props = {f: {} for f in fields}
        payload = {"type": "object", "additionalProperties": False, "properties": props}
        msg = {"name": name, "summary": summary, "payload": payload}
        if private: msg["x-private"] = True
        if ack is not None: msg["x-ack-data"] = ack
        messages[mid] = msg
        channels[mid] = {"address": name, "messages": {mid: {"$ref": f"#/components/messages/{mid}"}}}
        operations[mid] = {"action": "receive" if direction == "C2S" else "send",
                           "channel": {"$ref": f"#/channels/{mid}"}, "summary": summary}
    return {"asyncapi": "3.1.0",
            "info": {"title": "Kilima Poker real-time protocol", "version": "1.0.0",
                     "description": "Socket.IO v4 namespace /play, MessagePack encoding (KP-ENG-04). 'send' = server to client; 'receive' = client to server. x-private = only the owner's socket; x-ack-data = fields of a successful acknowledgement."},
            "servers": {"real": {"host": "play.kilima.poker", "pathname": "/play", "protocol": "wss"},
                        "play": {"host": "play.play.kilima.poker", "pathname": "/play", "protocol": "wss"}},
            "channels": channels, "operations": operations, "components": {"messages": messages}}


class NoAlias(yaml.SafeDumper):
    def ignore_aliases(self, data):
        return True


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for fn, doc in (("openapi.yaml", openapi()), ("asyncapi.yaml", asyncapi())):
        with open(os.path.join(OUT, fn), "w") as f:
            f.write("# Generated by tools/gen_specs.py — do not edit by hand.\n")
            yaml.dump(doc, f, Dumper=NoAlias, sort_keys=False, allow_unicode=True, width=120)
    print("openapi paths:", len({p for _, p, *_ in E}), "operations:", len(E), "| asyncapi events:", len(EV))
