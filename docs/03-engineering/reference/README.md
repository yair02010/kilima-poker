# Poker engine reference

`poker_reference.py` is the normative reference for KP-ENG-06 (hand evaluation for Hold'em, Omaha 4/5/6 and
Short Deck; No-Limit and Pot-Limit betting legality including incomplete all-in raises; uncalled bets; side pots;
rake with cap and proportional allocation; odd-chip rule; Spin paytable RTP).

    python3 poker_reference.py          # full run: enumerates all 2,598,960 five-card hands (~20 s)
    python3 poker_reference.py --fast   # vectors only

A full run self-checks the evaluator against the published five-card frequency table, enumerates the 36-card
Short Deck frequencies, and regenerates `test_vectors.json`.

The production engine (`packages/engine-poker`, TypeScript) must pass every vector in `test_vectors.json`
(CI job `engine-vectors`). If a vector is wrong, fix the reference first, in the same pull request.
