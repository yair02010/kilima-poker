#!/usr/bin/env python3
"""Betting differential bridge: replays action sequences in poker_reference.Hand.

stdin:  JSON list of {stacks, sb, bb, structure, ante, bbAnte, actions: [[type, to|null], ...]}
stdout: JSON list (one per case) of {steps: [{toAct, legal}], end: "complete"|"showdown"|error string}
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "..", "docs", "03-engineering", "reference"))
import poker_reference as P  # noqa: E402


def run(case):
    n = len(case["stacks"])
    seats = [{"seat": i + 1, "stack": s} for i, s in enumerate(case["stacks"])]
    h = P.Hand(seats, case["sb"], case["bb"], case["structure"], ante=case["ante"], bb_ante=case["bbAnte"],
               heads_up=(n == 2))
    steps, streets = [], 0

    def settle(result):
        nonlocal streets
        while result == "street_over" or result == "runout":
            if streets == 3:
                return "showdown"
            streets += 1
            result = h.next_street()
            if result == "runout":
                continue
        return None if result == "continue" else ("complete" if result == "hand_over" else result)

    end = None
    if h.to_act is None or not any(not q["folded"] and not q["allin"] and
                                   (q["acted_level"] is None or q["street"] < h.current_bet) for q in h.p):
        end = settle("street_over")
    for typ, to in case["actions"]:
        if end is not None:
            break
        steps.append({"toAct": h.to_act, "legal": h.legal()})
        try:
            result = h.act(typ, to)
        except ValueError as e:
            end = "error: " + str(e)
            break
        end = settle(result)
    if end is None:
        steps.append({"toAct": h.to_act, "legal": h.legal()})
    return {"steps": steps, "end": end, "pot": h.pot_total(), "stacks": [q["stack"] for q in h.p]}


json.dump([run(c) for c in json.load(sys.stdin)], sys.stdout)
