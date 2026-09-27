---
id: KP-ENG-13
title: RNG and Game Certification
subtitle: Random number generation, shuffling, deck commitments, audit and test-lab certification
version: 1.0
owner: CTO / Chief Architect
status: In review
related: KP-ENG-01 (D6) · KP-ENG-06 Poker Game Engine · KP-QA-05 Certification and Compliance Testing · KP-LEG-07 House Rules
---

# 1. Requirements

- **Unpredictable:** no party — player, operator or Kilima employee — can predict or influence cards before they are dealt.
- **Uniform:** every permutation of the deck is equally likely; every Spin multiplier is drawn exactly with its published probability.
- **Independent:** each hand is independent of previous hands, tables and players.
- **Auditable:** every draw can be traced, and every dealt deck can be verified against a commitment published before the first card.
- **Certified:** the RNG and its use in games are tested and certified by an accredited laboratory (for example GLI, BMM Testlabs or iTech Labs) against the standards required by each licence (typically GLI-19 for interactive gaming systems and the regulator's technical standards).

# 2. Architecture

```
table-server / tournament ──mTLS──► rng service (dedicated pods, dedicated nodes, no shell access)
                                     ├── DRBG instance per pod: HMAC_DRBG (SHA-512), NIST SP 800-90A Rev.1
                                     ├── Entropy: AWS KMS GenerateRandom (FIPS 140 validated HSMs) + OS CSPRNG (getrandom)
                                     ├── Health tests: continuous (SP 800-90B style repetition and adaptive proportion tests on raw input)
                                     └── Audit: rng.audit topic → WORM archive (S3 Object Lock)
```

- The `rng` service is small, isolated and separately versioned, so that changes elsewhere in the platform do not change the certified RNG component. Its container image digest is registered with the test lab.
- **Seeding and reseeding:** each DRBG instance is instantiated with at least 512 bits of entropy from KMS combined with 256 bits from the OS, and a personalisation string (pod id, start time). It reseeds after at most 2^20 generate calls or every 10 minutes, whichever comes first, and on any health-test failure. There is no fixed or stored seed anywhere.
- **Prediction resistance:** a compromise of one pod's internal state does not reveal previous outputs (backtracking resistance of the DRBG) and reseeding restores security for future outputs.
- **Failure behaviour:** if entropy is unavailable or a health test fails, the pod stops serving (fail closed) and the table pauses; it never falls back to a weaker generator.

# 3. From Random Bits to Cards

## 3.1 Unbiased integers

`randBelow(n)`: take `k = ceil(log2(n))` bits; if the value ≥ n, discard and draw again (rejection sampling). Modulo reduction is never used.

## 3.2 Shuffle

The full deck (52 or 36 cards) is shuffled once per hand with the **Fisher–Yates** algorithm using `randBelow`:

```
for i from deck.length − 1 down to 1:
    j = randBelow(i + 1)
    swap(deck[i], deck[j])
```

The complete ordered deck is fixed before the first card is dealt. Cards are then dealt in the fixed order of KP-ENG-06 §4 (hole cards one at a time clockwise from the small blind, burn and board cards in order). No card is ever drawn "on demand" later in the hand, so player actions cannot influence which cards come next. Run it twice uses the next undealt cards of the same deck.

## 3.3 Spin multipliers

The multiplier is drawn when a Spin is full, before the first hand: `r = randBelow(1,000,000)`, mapped to the paytable's cumulative probability ranges (sorted by multiplier). The paytable version is stored with the draw.

# 4. RNG Service Interface

```
POST /internal/rng/decks   { "variant": "nlhe", "tableId": "t_4Kx", "handId": "h_01J9Z…" }
→ 200 { "deckId": "d_…", "cards": ["7c","Ah",…], "salt": "base64(32 bytes)",
        "commitment": "hex(sha256(deckId || '|' || cards.join(',') || '|' || salt))", "drbg": { "pod": "rng-2", "generation": 18231 } }

POST /internal/rng/draws   { "purpose": "spin_multiplier", "range": 1000000, "reference": "trn_…" }
→ 200 { "drawId": "r_…", "value": 734112 }
```

Only `table-server` and `tournament` may call it (service identity + network policy). Responses are never logged in application logs; the audit record (section 6) is the only persistent copy apart from the hand record.

# 5. Deck Commitment and Player Verification

1. At hand start the table publishes `commitment` in `hand:started` (KP-ENG-04). The commitment binds the full deck order before any card is dealt.
2. After the hand, the hand record and `hand:completed` reveal `deckId`, the full deck and the `salt`.
3. Anyone can recompute `sha256(deckId | cards | salt)` and compare it with the commitment. The client offers "verify this hand"; the algorithm is published in the House Rules (KP-LEG-07) with a reference script.

This proves the deck was not changed during the hand. It does not by itself prove the deck was random — that is what certification and statistical monitoring (sections 7–8) prove.

# 6. Audit Trail

For every draw: `drawId`, purpose, requesting service and pod, table/hand/tournament reference, DRBG instance and generation counter, time, and a hash of the output. Records flow to `rng.audit` and are archived in S3 Object Lock (compliance mode) for the retention period of the licence (KP-LEG-06). Health-test results and reseed events are logged the same way.

# 7. Certified Scope and Change Control

@widths 1.6,3.4
| Component | Certified item |
|---|---|
| `rng` service | DRBG implementation, entropy sources, seeding/reseeding, health tests, `randBelow`, shuffle, Spin draw |
| `engine-poker` | Dealing order, hand evaluation, betting rules, pots, rake, run it twice, timeouts |
| `tournament` | Payout calculation, Spin paytables, prize distribution, cancellation rules |
| Game rules | House Rules (KP-LEG-07) as published to players |

- Each certified component has a version and an image digest recorded in the **certification register** (`docs/certification/register.md`, maintained by QA).
- Any change to a certified component goes through a **certification impact assessment** (none / notify lab / re-test) approved by the CTO and Compliance before release. The CI pipeline blocks deployment of a certified component whose digest is not in the register for the target environment.
- The `cert` environment runs the exact certified versions for the lab.

# 8. Statistical Testing and Monitoring

- **Before certification:** 1 × 10^9 raw outputs tested with NIST SP 800-22, Dieharder and TestU01 BigCrush; 1 × 10^8 shuffles tested for uniformity (position-of-card chi-square for every card and position, pair and adjacency tests, permutation-class tests on small decks); 1 × 10^7 Spin draws tested against the paytable probabilities.
- **In production (continuous):** hourly chi-square tests on card frequencies by position and on starting-hand frequencies (e.g. pocket pairs, suited hands) per variant, and on Spin multiplier frequencies; alerts at p < 0.0001 over rolling windows, with manual review (a single low p-value is expected occasionally; persistent deviations are not).
- Results are stored and provided to the regulator and the test lab on request.

# 9. Acceptance Criteria

- All statistical suites pass with the lab-agreed thresholds.
- Fail-closed test: disabling KMS entropy or injecting a health-test failure stops deck issuance within one request and pauses affected tables.
- Every hand record's deck matches its commitment (automated check on 100 % of hands in staging and on a 1 % sample in production, plus on demand).
- The certification register matches the deployed digests in `cert` and `real` (daily check).
