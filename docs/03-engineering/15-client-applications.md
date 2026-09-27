---
id: KP-ENG-15
title: Client Applications
subtitle: Android, web and white-label clients — architecture, performance on African networks, security and distribution
version: 1.0
owner: Tech Lead — Clients
status: Draft
related: KP-ENG-01 (D1) · KP-ENG-04 Real-time Protocol · KP-PRD-04 UX Flows · KP-ENG-09 §4 Client Integrity
---

# 1. Targets

@widths 1.7,3.3
| Target | Value |
|---|---|
| Devices | Android 8.0+ (API 26), 2 GB RAM, 720 × 1280 screens as the design baseline; tablets supported |
| Networks | Playable on 3G (300 kbps, 300 ms RTT, 2 % loss); tolerant of network switches and short outages |
| App size | APK < 30 MB at install (Android App Bundle splits); additional art packs downloaded on Wi-Fi only by default |
| Data use | < 1 MB per 100 cash hands in data-saver mode (no avatars animations, no chat media) |
| Start-up | Cold start to lobby < 3 s on the baseline device |
| Table rendering | 60 fps on the baseline device for card and chip animations; never drops below 30 fps with 4 tables |
| Battery | < 8 % per hour of single-table play on the baseline device (screen on) |
| Languages | English, French, Portuguese, Swahili at launch; RTL-ready layout |
| Accessibility | Four-colour deck, large-text mode, colour-blind safe palette, haptics for "your turn" |

# 2. Architecture

```
apps/
  mobile/          React Native (New Architecture, Hermes) — Android first, iOS later
  web/             React + Vite PWA (lobby, cashier, account; tables where policy allows)
  admin/           Back-office console (React)
packages/
  client-core/     TypeScript: protocol client, state stores, reconnection, resync, i18n, money formatting
  table-renderer/  Table scene: react-native-skia on mobile, canvas/WebGL on web; shared layout model
  contracts/       Generated types from openapi.yaml and asyncapi.yaml
  engine-poker/    Shared with the server for hand-name display and legal-action preview only (server decides)
  ui-kit/          Design system (tokens per brand for white-label)
```

- **State:** each table is a state machine in `client-core` driven only by server events; the UI never mutates game state.
- **Reconnection:** exponential backoff (0.5 s → 8 s); on reconnect the client sends `table:resync` with the last `seq` for every open table; if the server buffer no longer has the gap, it receives a snapshot. Target: back at the table within 2 s of connectivity returning.
- **Action pre-selection:** "check/fold", "call any", "fold to any bet" are local conveniences; the client sends the action only when it is the player's turn and the pre-selection is still valid.
- **Time sync:** the client estimates clock offset from `session:ready.serverTime` and pings; deadlines are displayed in local time.
- **Offline:** lobby and cashier screens show cached data with clear "offline" state; no action is queued while offline except resync.

# 3. White-Label

Operators (KP-ENG-14) get a branded build or a runtime theme:

- **Runtime theme** (web and embedded): colours, logo, fonts, table felt, card backs from the tenant configuration; same app binary.
- **Branded Android build:** separate package name and signing key per operator where the operator distributes its own app; built from the same source with a brand config in CI.

# 4. Security

- Tokens: refresh token in Android Keystore (hardware-backed where available); access token in memory only.
- TLS with certificate pinning to the edge certificate authority keys (with backup pins and a remote kill-switch for pin rotation).
- Play Integrity attestation (KP-ENG-09 §4); root and emulator detection; code obfuscation (R8) and anti-tamper checks; debug builds cannot connect to Real Money.
- No hole-card data persisted on the device after a hand (hand history is fetched from the server on demand).
- Screenshots are allowed (players share hands) but screen recording APIs are detected for integrity signals only, not blocked.
- The web client stores refresh tokens only in `httpOnly` cookies; strict Content-Security-Policy; Subresource Integrity for static assets.

# 5. Distribution and Updates

- **Android:** Google Play where its real-money gambling policy allows the app in that country and for the licensed entity; otherwise signed APK download from the brand website (with in-app update checks and signature verification). Play Money builds can be distributed on Google Play more widely.
- **iOS:** after the licence and App Store requirements for real-money gaming are met in the target country.
- **Forced updates:** the server can require a minimum app version (`UPGRADE_REQUIRED`), used for security fixes and certified-component changes.
- **Staged rollouts:** 1 % → 10 % → 50 % → 100 % with crash-free and error-rate gates (crash-free sessions ≥ 99.5 %).

# 6. Player Tools in the Client

- Built-in HUD: a limited set of opponent statistics (hands, VPIP, PFR, 3-bet) shown to all players equally, based on hands played together.
- Hand replayer, session results, hand-strength indicator on the player's own cards, pot-odds display, bet-sizing presets (configurable), notes and colour tags, table themes, emoji reactions, multi-table layout (tiles on tablets and web, swipe between tables on phones).
- Responsible-gaming tools one tap away: session timer, reality checks, limits, cool-off, self-exclusion.

# 7. Quality

- Device lab: at least 15 physical Android devices covering the most common models in launch markets (sourced from market data) plus cloud device farms.
- Network-conditioning tests (3G, lossy, high latency, switching Wi-Fi ↔ mobile) in CI for the reconnection flows.
- Visual regression for the table scene; accessibility checks; performance budgets enforced in CI (bundle size, start-up time, frame rate on a reference device).
