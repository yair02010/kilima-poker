---
id: KP-ENG-05
title: Data Model
subtitle: PostgreSQL schemas, Redis keyspace, ClickHouse tables and event topics
version: 1.0
owner: Tech Lead — Platform
status: In review
related: KP-ENG-01 (D7, D12) · KP-ENG-08 Wallet and Ledger · KP-LEG-06 Data Retention · KP-SEC-03 Security Architecture
---

# 1. Conventions

- **Engines:** PostgreSQL 16 (Aurora PostgreSQL in production) in two clusters: `core` and `ledger`. Redis 7 Cluster. ClickHouse for hand histories and analytics. Kafka for events. S3 with Object Lock (compliance mode) for archives.
- **Separate deployments per mode:** Play Money and Real Money have separate clusters, buckets and topics. No table ever mixes modes.
- **Naming:** schemas per owning service; tables `snake_case` plural; columns `snake_case`.
- **Keys:** UUIDv7 (`uuid`) for internal ids (time-ordered, index friendly); public ids use prefixes in the API (`acc_`, `h_`…) mapped in the API layer.
- **Time:** `timestamptz`, UTC.
- **Money:** `bigint` minor units + `char(3)` currency (or `KPC`). `numeric`/`float` for money is forbidden (linted in migrations).
- **Tenancy:** every player-facing table has `tenant_id`; row-level security (RLS) policies restrict operator back-office queries to their tenant.
- **Migrations:** `node-pg-migrate`, forward-only, reviewed; every migration is tested against a production-sized snapshot in staging; destructive changes use expand–migrate–contract.
- **Personal data** is marked in the schema catalogue (column comments `pii:<category>`) and encrypted at the application layer where listed (section 9).

## Ownership map

@widths 1.2,1,2.8
| Schema | Cluster | Owner service |
|---|---|---|
| `identity` | core | identity |
| `player` | core | player |
| `lobby` | core | lobby |
| `tournament` | core | tournament |
| `compliance` | core | compliance |
| `integrity` | core | integrity |
| `operator` | core | operator-gateway |
| `backoffice` | core | backoffice (config, promotions, announcements) |
| `notify` | core | notify |
| `ledger` | ledger | wallet |
| `cashier` | ledger | cashier |
| `audit` | core (separate DB, append-only) | all services write through the audit library; nobody updates or deletes |

# 2. Identity (`identity`)

@widths 1.3,1.4,0.5,2.3
| Table | Column | Type | Notes |
|---|---|---|---|
| `accounts` | `id` | uuid PK | `sub` claim |
| | `tenant_id` | text | Operator |
| | `screen_name` | citext UNIQUE | Network-wide unique |
| | `phone_e164` | text | Unique per tenant; encrypted + blind index |
| | `email` | citext | Optional; encrypted + blind index |
| | `password_hash` | text | Argon2id |
| | `status` | enum | `active`, `restricted`, `suspended`, `closed`, `banned` |
| | `roles` | text[] | See KP-ENG-02 §5 |
| | `date_of_birth` | date | From registration; KYC value prevails |
| | `created_at`, `updated_at`, `password_changed_at` | timestamptz | |
| `devices` | `id`, `account_id`, `platform`, `model`, `app_version`, `attestation_verdict`, `attested_at`, `fingerprint_hash`, `trusted_until`, `first_seen`, `last_seen`, `last_ip` | | `fingerprint_hash` shared with integrity |
| `credentials` | `id`, `account_id`, `type`, `public_data`, `created_at`, `last_used_at` | | TOTP secrets encrypted with KMS |
| `sessions` | `sid`, `account_id`, `device_id`, `created_at`, `last_refresh_at`, `ip`, `risk_level`, `revoked_at`, `revoke_reason` | | |
| `status_history` | `account_id`, `from_status`, `to_status`, `reason`, `actor`, `at` | | |

Indexes: `accounts (tenant_id, phone_blind_idx) UNIQUE`, `accounts (screen_name)`, `devices (fingerprint_hash)`, `sessions (account_id) WHERE revoked_at IS NULL`.

# 3. Player (`player`)

@widths 1.4,3.6
| Table | Key columns |
|---|---|
| `profiles` | `account_id` PK, `tenant_id`, `screen_name` (copy), `avatar_id`, `country`, `locale`, `preferences` jsonb (deck colours, sounds, auto-actions, data saver) |
| `stats_daily` | `account_id`, `day`, `game`, `format`, `hands`, `vpip_hands`, `pfr_hands`, `threebet_opps`, `threebet_hands`, `wtsd`, `wsd`, `net_units`, `rake_units`, `currency` — PK (`account_id`, `day`, `game`, `format`, `currency`) |
| `notes` | `owner_id`, `target_id`, `text`, `colour`, `updated_at` — PK (`owner_id`, `target_id`) |
| `rewards_accounts` | `account_id`, `tier`, `points`, `rakeback_bp`, `period_start` |
| `rewards_ledger` | Insert-only points movements (`account_id`, `delta`, `reason`, `reference`, `at`) — points are not money; paying a reward is a wallet posting |
| `missions`, `mission_progress` | Mission definitions and per-player progress |
| `clubs`, `club_members` | Private clubs |

# 4. Lobby and Tournaments (`lobby`, `tournament`)

@widths 1.4,3.6
| Table | Key columns |
|---|---|
| `lobby.pools` | `id`, `mode`, `currency`, `allowed_jurisdictions` text[], `allowed_tenants` text[], `status` |
| `lobby.table_templates` | `id`, `pool_id`, `variant`, `structure`, `format`, `max_seats`, `sb`, `bb`, `ante`, `min_buyin_bb`, `max_buyin_bb`, `rake_schedule_id`, `features` jsonb, `active_hours` |
| `lobby.tables` | `id`, `template_id`, `pool_id`, `status` (`open`, `closing`, `closed`), `shard`, `created_at`, `closed_at` |
| `lobby.seat_sessions` | `id`, `table_id`, `account_id`, `seat`, `buyin_units`, `cashout_units`, `started_at`, `ended_at`, `end_reason` — used for rathole rules and reconciliation |
| `lobby.fastfold_entries` | `id`, `pool_id`, `account_id`, `buyin_units`, `cashout_units`, `started_at`, `ended_at` |
| `lobby.sng_queues` | `id`, `pool_id`, `kind` (`sng`, `spin`), `buyin`, `fee`, `seats`, `structure_id`, `paytable_version?` |
| `tournament.tournaments` | `id`, `pool_id`, `name`, `type`, `variant`, `structure_id`, `buyin`, `fee`, `bounty`, `guarantee`, `starting_stack`, `late_reg_until`, `reentry_max`, `status`, `scheduled_start`, `started_at`, `completed_at`, `payout_curve_id`, `satellite_target_id` |
| `tournament.entries` | `id`, `tournament_id`, `account_id`, `entry_no`, `payment` (`cash`, `ticket`), `ledger_tx_id`, `status`, `chips`, `place`, `prize_units`, `bounty_won_units`, `eliminated_at`, `eliminated_by` — unique (`tournament_id`, `account_id`, `entry_no`) |
| `tournament.structures` | Blind levels (`level`, `sb`, `bb`, `ante`, `minutes`), breaks |
| `tournament.payout_curves` | Field-size bands → percentages |
| `tournament.spin_draws` | `tournament_id`, `paytable_version`, `multiplier`, `rng_draw_id`, `prize_pool_units` |

# 5. Ledger and Cashier (`ledger`, `cashier`)

Detailed rules in KP-ENG-08.

@widths 1.4,3.6
| Table | Key columns |
|---|---|
| `ledger.accounts` | `id` uuid, `code` text UNIQUE (e.g. `player:{id}:USD:cash`), `kind`, `owner_id?`, `currency`, `guard_non_negative` bool, `created_at` |
| `ledger.balances` | `account_id` PK, `balance` bigint, `version` bigint, `updated_at` — `CHECK (NOT guard OR balance >= 0)` enforced in the posting function |
| `ledger.transactions` | `id`, `type`, `idempotency_key` UNIQUE, `request_hash`, `reference_kind`, `reference_id`, `initiated_by_kind`, `initiated_by_id`, `reason`, `status` (`posted`, `reversed`), `reverses_tx_id?`, `created_at` |
| `ledger.entries` | `id`, `tx_id`, `account_id`, `currency`, `amount` bigint (≠ 0), `balance_after`, `created_at` — partitioned monthly |
| `ledger.fx_rates` | `id`, `pair`, `rate` (numeric(18,8), rate only, never money), `source`, `quoted_at`, `spread_bp` |
| `ledger.tax_rules` | `jurisdiction`, `kind`, `basis`, `rate_bp`, `threshold_units`, `valid_from`, `valid_to`, `approved_by` |
| `cashier.payments` | `id`, `account_id`, `direction` (`deposit`, `withdrawal`), `method_id`, `provider`, `provider_ref`, `amount`, `currency`, `credit_amount`, `credit_currency`, `fx_rate_id`, `status`, `failure_code`, `ledger_tx_id`, `created_at`, `updated_at` — unique (`provider`, `provider_ref`) |
| `cashier.instruments` | `id`, `account_id`, `type` (`mobile_money`, `bank`, `card_token`), `provider`, `masked`, `token_ref`, `holder_name_match` (`matched`, `mismatch`, `unknown`), `verified_at` |
| `cashier.withdrawal_reviews` | `payment_id`, `rules_triggered` text[], `decision`, `decided_by`, `second_approver`, `note`, `decided_at` |
| `cashier.provider_statements` | Imported settlement files per provider and day, for reconciliation |

Database roles: `wallet_rw` (insert on ledger tables, update on `balances` only, via stored posting function), `cashier_rw` (own schema), `reporting_ro` (read replicas only). No role can `UPDATE`/`DELETE` `ledger.transactions` or `ledger.entries`.

# 6. Compliance, Integrity, Operator

@widths 1.6,3.4
| Table | Key columns |
|---|---|
| `compliance.kyc_records` | `account_id` PK, `provider`, `provider_ref`, `status` (`not_started`, `pending`, `verified`, `rejected`, `expired`), `level`, `name_hash`, `dob`, `nationality`, `document_country`, `verified_at`, `expires_at` (documents stay with the provider) |
| `compliance.jurisdictions` | `code`, `real_money_enabled`, `games_allowed`, `formats_allowed`, `min_age`, `kyc_threshold_units`, `currencies`, `pools`, `geolocation_mode`, `licence_ref`, `version`, `approved_by` |
| `compliance.jurisdiction_decisions` | `account_id`, `jurisdiction`, `inputs` jsonb (IP country, device location, SIM country, KYC country), `decision`, `at` |
| `compliance.limits` | `account_id`, `kind`, `period`, `amount_units`, `pending_amount_units`, `pending_effective_at` |
| `compliance.exclusions` | `account_id`, `kind` (`cool_off`, `self_exclusion`, `external_register`), `from`, `until`, `source` |
| `compliance.aml_alerts` | `id`, `account_id`, `rule`, `score`, `status`, `assigned_to`, `str_filed_at?` |
| `integrity.cases` | `id`, `type`, `severity`, `score`, `status`, `account_ids` uuid[], `evidence` jsonb, `assigned_to`, `decision`, `actions` jsonb, `created_at`, `decided_at` |
| `integrity.links` | `account_a`, `account_b`, `kind` (`device`, `ip`, `instrument`, `kyc`, `household`, `play_graph`), `strength`, `first_seen`, `last_seen` |
| `integrity.restrictions` | Active same-table restrictions (materialised for the lobby) |
| `operator.operators` | `id`, `name`, `wallet_mode` (`transfer`, `seamless`), `pools` text[], `revshare_bp`, `status`, `keys` (public keys only) |
| `operator.player_links` | `tenant_id`, `operator_player_id`, `account_id` UNIQUE |

# 7. Audit (`audit`)

`audit.events(id, at, actor_kind, actor_id, action, target_kind, target_id, tenant_id, ip, user_agent, request_id, details jsonb, prev_hash, hash)` — append-only, hash-chained (each row includes the hash of the previous row per partition); daily export to S3 Object Lock. Retention per KP-LEG-06.

# 8. Redis Keyspace

@widths 1.9,0.8,1.6,0.7
| Key pattern | Type | Purpose | TTL |
|---|---|---|---|
| `otp:{challengeId}` | hash | OTP challenge | 5 min |
| `rt:{sid}`, `rtfam:{familyId}` | hash, set | Refresh tokens and reuse detection | 30 d |
| `denysid:{sid}` | string | Revoked session | 10 min |
| `rl:{limiter}:{key}` | string | Rate-limit counters | window |
| `tbl:{tableId}:state` | hash | Latest table snapshot (for fail-over and resync) | 24 h |
| `tbl:{tableId}:events` | stream | Last 1,000 table events for `table:resync` | 24 h |
| `tbl:{tableId}:owner` | string | Owning table-server pod (lease, renewed every 2 s) | 6 s |
| `seatres:{reservationId}` | hash | Seat reservation during buy-in | 30 s |
| `wl:{tableId or templateId}` | list | Waitlist | — |
| `ffq:{poolId}` | sorted set | Fast-fold waiting players (score = enqueue time) | — |
| `sngq:{queueId}` | sorted set | Sit & Go / Spin registrations | — |
| `presence:{accountId}` | hash | Gateway, tables, last seen | 60 s |
| `lobby:{poolId}:summary` | hash | Lobby table summaries | 5 s refresh |
| `trn:{tid}:clock` | hash | Tournament clock (authoritative copy in PostgreSQL) | — |

Redis is never the only copy of money or of a completed hand. Losing Redis voids hands in progress (stacks are safe in the ledger) and forces clients to reconnect.

# 9. Field-Level Encryption

Encrypted with envelope encryption (AWS KMS data keys, per-tenant key contexts) and searchable through HMAC blind indexes where needed: phone number, email, date of birth, KYC name, payout instrument details, TOTP secrets. Hole cards in the hand archive are not personal data but are integrity-sensitive; the ClickHouse `hands` table is readable only by the integrity and data-science roles; players read their own hands through the API.

# 10. ClickHouse (analytics and hand histories)

@widths 1.4,3.6
| Table | Content |
|---|---|
| `hands` | One row per hand: ids, pool, variant, format, stakes, currency, times, board, pots, rake, settlement tx (ReplacingMergeTree by `hand_id`) |
| `hand_players` | One row per player per hand: seat, position, hole cards, stack start/end, net, showdown, VPIP/PFR flags, all-in EV |
| `hand_actions` | One row per action: street, type, amount, pot before, decision ms, time-bank use, auto flag |
| `sessions` | Cash and fast-fold sessions, tournaments played |
| `client_signals` | Telemetry summaries for integrity (KP-ENG-09 §4) |
| `payments_fact`, `ledger_fact` | CDC from the ledger for finance and AML analytics (read-only copy) |

Partitioning by month; ordering keys by (`pool`, `started_at`) or (`account_id`, `started_at`). Retention and deletion rules in KP-LEG-06.

# 11. Kafka Topics

@widths 1.6,1,0.9,1.5
| Topic | Key | Retention | Schema |
|---|---|---|---|
| `hand.completed` | `tableId` | 7 d (archived to S3) | Hand record (KP-ENG-06 §11) |
| `table.session` | `accountId` | 7 d | Seat and fast-fold sessions |
| `tournament.lifecycle` | `tournamentId` | 30 d | Tournament events |
| `wallet.tx.posted` | `accountId` | 30 d | Transaction summary |
| `payment.status` | `paymentId` | 30 d | Payment state changes |
| `identity.account` | `accountId` | 30 d (compacted copy) | Account lifecycle |
| `compliance.decision` | `accountId` | 30 d | KYC, limits, exclusion, jurisdiction |
| `integrity.action` | `accountId` | 30 d | Enforcement actions |
| `rng.audit` | `drawId` | 30 d (archived to WORM) | RNG draws and health tests |

Schemas are Avro in a schema registry with backward-compatible evolution enforced in CI.

# 12. Capacity Estimates (GA year 1, Real Money)

@widths 2,1.5,1.5
| Item | Estimate | Storage |
|---|---|---|
| Hands per day | 3 M (average 35 hands/s, peak ~ 100 hands/s) | ClickHouse ~ 1.5 KB/hand compressed → ~1.6 TB/year |
| Ledger entries per day | ~ 12 M (settlements, buy-ins, cash-outs) | PostgreSQL ~ 150 B/entry + indexes → ~ 1 TB/year, partitioned |
| Payments per day | 50,000 | small |
| Kafka throughput | peak ~ 5 MB/s | 3 brokers, replication 3 |

The ledger's monthly partitions older than 13 months move to a read-only archive tablespace; totals are kept in `ledger.balances` and monthly snapshots.
