#!/usr/bin/env python3
"""Differential-test bridge: evaluates hands with the normative reference (poker_reference.py).

stdin:  JSON list of [game, hole, board, straightBeatsTrips]
stdout: JSON list of [category, best5] in the same order
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "..", "docs", "03-engineering", "reference"))
import poker_reference as P  # noqa: E402

out = []
for game, hole, board, sbt in json.load(sys.stdin):
    if game == "shortdeck" and sbt:
        k, combo = P.best_holdem(hole, board, "shortdeck_straight")
    else:
        k, combo = P.best_hand(game, hole, board)
    out.append([k[2], P.fmt(combo)])
json.dump(out, sys.stdout)
