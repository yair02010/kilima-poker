---
id: KP-GOV-02
title: Glossary
subtitle: Poker, platform, payments and compliance terms used across the dossier
version: 1.0
owner: Programme Director
status: Living document
---

# 1. Poker Terms

@widths 1.3,3.7
| Term | Meaning |
|---|---|
| Ante / big-blind ante | Forced dead bet from every player / paid by the big blind for the whole table (tournaments) |
| AOF (All-in or Fold) | Format where the only actions are all-in and fold |
| Blinds | Forced bets by the two players left of the button (small and big blind) |
| Board | Community cards: flop (3), turn (1), river (1) |
| Button | Dealer position; moves clockwise each hand |
| Fast-fold | Cash format where a folding player moves immediately to a new hand at another table ("Kilima Flow") |
| Hand-for-hand | Tournament mode where all tables wait for each other after every hand near the money |
| Incomplete raise | All-in raise smaller than a full raise; does not reopen betting for players who already acted |
| MTT | Multi-table tournament |
| Omaha (PLO4/5/6) | Four, five or six hole cards; exactly two must be used with three board cards |
| PKO | Progressive knock-out: bounty tournament where part of each bounty is added to the eliminator's own bounty |
| Pot-limit | Maximum bet or raise equals the pot after calling |
| Rake / cap / no flop no drop | Platform fee as a percentage of the pot / maximum per hand / no rake when a hand ends pre-flop |
| Rathole | Leaving with winnings and returning with a smaller stack; prevented by minimum buy-in rules |
| Run it twice | Dealing the remaining board twice after an all-in, splitting each pot between the runs |
| Satellite | Tournament whose prizes are tickets to another tournament |
| Short Deck (6+) | Hold'em with cards 2–5 removed (36 cards) and changed rankings |
| Side pot | Pot contested only by players with chips beyond an all-in player's contribution |
| SNG | Sit & Go: tournament that starts when full |
| Spin | Three-player hyper-turbo SNG with a random prize multiplier ("Summit Spins") |
| Straddle | Optional blind (2 × BB) posted by the player left of the big blind |
| Time bank | Extra time available when the action timer runs out |
| VPIP / PFR | Percentage of hands voluntarily put money in / raised pre-flop |

# 2. Platform Terms

@widths 1.3,3.7
| Term | Meaning |
|---|---|
| Pool | Ring-fenced liquidity: currency + allowed jurisdictions + allowed operators |
| Tenant / operator / skin | A brand offering Kilima Poker to its players; Kilima B2C is one tenant |
| Play Money / Real Money | Separate deployments: `KPC` play chips vs licensed real money |
| Table account | Ledger account holding a player's stack at a table |
| Hand settlement | The single ledger transaction that records the chip movements of a completed hand |
| Deck commitment | SHA-256 fingerprint of the shuffled deck published before dealing and revealed after the hand |
| Jurisdiction Policy Engine | Service that decides what a player may play, where, in which currency and with which limits and taxes |
| Seamless / transfer wallet | Operator integration where the operator holds the balance / players move funds into the poker wallet |
| Summit Rewards | Loyalty programme (points, tiers, weekly cash-back) |
| `seq` | Sequence number of table events for ordering and resynchronisation |
| Voided hand | Hand cancelled by a malfunction; committed chips return |

# 3. Engineering and Operations Terms

@widths 1.3,3.7
| Term | Meaning |
|---|---|
| ADR | Architecture Decision Record |
| DRBG | Deterministic Random Bit Generator (NIST SP 800-90A) seeded with true entropy |
| JWKS | Public keys used to verify access tokens |
| mTLS | Mutual TLS between services |
| RPO / RTO | Maximum data loss / maximum time to restore |
| SLO / SLI / error budget | Service objective / its measured indicator / allowed unreliability |
| WORM | Write once, read many (S3 Object Lock) storage |
| Canary | Gradual release to a small share of traffic with automatic analysis |
| Drain | Stop starting new hands on a server, finish current ones, then hand over tables |

# 4. Payments and Compliance Terms

@widths 1.3,3.7
| Term | Meaning |
|---|---|
| Mobile money | Phone-based wallets (e.g. M-Pesa, MTN MoMo, Airtel Money) |
| STK push | Payment prompt sent to the player's phone to approve a deposit with their PIN |
| Float | Pre-funded balance at a payout provider used to pay withdrawals |
| Coverage ratio | Protected assets ÷ player liabilities (target ≥ 105 %) |
| Three-way reconciliation | Matching ledger, provider and bank records |
| GGR / NGR | Gross gaming revenue (rake + fees) / net of bonuses, rewards and gaming taxes |
| KYC / CDD / EDD | Know your customer / customer due diligence / enhanced due diligence |
| AML / CTF | Anti-money laundering / counter-terrorist financing |
| MLRO | Money Laundering Reporting Officer |
| PEP | Politically exposed person |
| STR / SAR | Suspicious transaction / activity report to the financial intelligence unit |
| RTA | Real-time assistance: using a solver or AI while playing (prohibited) |
| Chip dumping | Deliberately losing to transfer money |
| Self-exclusion / cool-off | Binding block from play for a long / short period |
| Reality check | Periodic reminder of time played and net result |
| RTP | Return to player: expected share of buy-ins paid out as prizes (Spins) |
