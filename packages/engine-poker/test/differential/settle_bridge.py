#!/usr/bin/env python3
"""Settlement differential bridge: uncalled bets, pots, rake and awarding with poker_reference.py.

stdin:  JSON list of {game, sbt, status, contrib: {seat: n}, folded: [seat], holes: {seat: "Ah Kd"}, board,
                      rakeBp|null, cap|null, sawFlop, order: [seat]}
stdout: JSON list of {returned, pots, rake, perPot, won}
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "..", "docs", "03-engineering", "reference"))
import poker_reference as P  # noqa: E402


def run(c):
    contrib = {int(k): v for k, v in c["contrib"].items()}
    folded = set(c["folded"])
    adj, returned = P.return_uncalled(contrib)
    pots = P.build_pots(adj, folded)
    if c["rakeBp"] is None:
        rake, parts = 0, [0] * len(pots)
    else:
        rake, parts = P.compute_rake(pots, c["rakeBp"], c["cap"], c["sawFlop"])
    live = [s for s in contrib if s not in folded]
    if c["status"] == "complete":
        strengths = {s: 0 for s in live}
    else:
        strengths = {}
        for s in live:
            hole = c["holes"][str(s)]
            if c["game"] == "shortdeck" and c["sbt"]:
                k, _ = P.best_holdem(hole, c["board"], "shortdeck_straight")
            else:
                k, _ = P.best_hand(c["game"], hole, c["board"])
            strengths[s] = P.key(k)
    won = P.distribute(pots, parts, strengths, c["order"])
    return {"returned": {str(k): v for k, v in returned.items()}, "pots": pots, "rake": rake, "perPot": parts,
            "won": {str(k): v for k, v in won.items()}}


json.dump([run(c) for c in json.load(sys.stdin)], sys.stdout)
