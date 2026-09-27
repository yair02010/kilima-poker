---
id: KP-ENG-12
title: Architecture Decision Log
subtitle: All accepted ADRs, compiled from docs/03-engineering/adr
version: 1.0
owner: CTO / Chief Architect
status: Living document
---

# Index

@widths 0.8,3.4,0.8
| ADR | Title | Status |
|---|---|---|
| 0001 | Record architecture decisions | Accepted |
| 0002 | Modular services with a phased deployment topology | Accepted |
| 0003 | RS256 access tokens verified through JWKS, signing keys in KMS | Accepted |
| 0004 | Phone-first identity with OTP and step-up verification | Accepted |
| 0005 | Double-entry ledger in PostgreSQL with integer minor units | Accepted |
| 0006 | Chips on the table are ledger balances; one settlement per hand | Accepted |
| 0007 | Gameplay only over the real-time protocol; REST is read-only for game data | Accepted |
| 0008 | PostgreSQL, Redis, Kafka and ClickHouse as data stores | Accepted |
| 0009 | Separate Play Money and Real Money deployments | Accepted |
| 0010 | Isolated certified RNG service with deck commitments | Accepted |
| 0011 | Split real-time tier: gateway and table-server | Accepted |
| 0012 | Kubernetes on AWS Cape Town with an EU disaster-recovery region | Accepted |
| 0013 | React Native, Android-first clients with a shared TypeScript core | Accepted |
| 0014 | Jurisdiction Policy Engine with default deny and ring-fenced liquidity pools | Accepted |
| 0015 | Multi-tenant operator network with transfer and seamless wallets | Accepted |
| 0016 | Short Deck ranking: flush beats full house, three of a kind beats a straight | Accepted |
| 0017 | Node.js and TypeScript for the table-server | Accepted |
| 0018 | Rake: percentage with cap, no flop no drop, proportional allocation to pots | Accepted |

New ADRs are added as files in `adr/` using `templates/adr-template.md`, and this index is updated in the same pull request. Decisions that change the Bridge Casino design when Bridge is integrated are noted in the ADR text (ADR-0004, ADR-0005, ADR-0008, ADR-0012).

@include adr
