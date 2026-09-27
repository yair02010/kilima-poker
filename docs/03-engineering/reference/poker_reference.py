#!/usr/bin/env python3
"""Kilima Poker — normative reference implementation for KP-ENG-06 (Poker Game Engine).

Covers: card notation, hand evaluation (Hold'em, Omaha 4/5/6, Short Deck 6+), betting-round legality
(No-Limit and Pot-Limit, including incomplete all-in raises), pot and side-pot construction, uncalled-bet
return, rake (percentage + cap, no flop no drop, proportional allocation), odd-chip rule, and the
Spin & Go prize-multiplier paytable check.

Running this file:
  1. self-checks the evaluator against the published 5-card hand-frequency table (2,598,960 hands),
  2. runs every scenario below, and
  3. writes test_vectors.json next to this file.

The production engine (packages/engine-poker, TypeScript) must reproduce every vector (CI job `engine-vectors`).
All amounts are integers in minor units. No floating point is used anywhere in the money path.
"""
import itertools, json, os, sys
from collections import Counter
from fractions import Fraction

RANKS = "23456789TJQKA"
SUITS = "shdc"
RV = {r: i + 2 for i, r in enumerate(RANKS)}          # '2' -> 2 ... 'A' -> 14

# ----------------------------------------------------------------------------------------------------
# Cards and decks
# ----------------------------------------------------------------------------------------------------

def parse(cards):
    if isinstance(cards, str):
        cards = cards.split()
    out = []
    for c in cards:
        if len(c) != 2 or c[0] not in RANKS or c[1] not in SUITS:
            raise ValueError("bad card " + c)
        out.append((RV[c[0]], c[1]))
    if len(set(out)) != len(out):
        raise ValueError("duplicate card")
    return out


def deck(variant="holdem"):
    ranks = RANKS[4:] if variant == "shortdeck" else RANKS      # short deck removes 2-5 (36 cards)
    return [r + s for r in ranks for s in SUITS]


def fisher_yates(cards, rand_below):
    """Uniform shuffle. rand_below(n) must return an unbiased integer in [0, n) from a CSPRNG
    (rejection sampling, see KP-ENG-13). Returns a new list."""
    a = list(cards)
    for i in range(len(a) - 1, 0, -1):
        j = rand_below(i + 1)
        a[i], a[j] = a[j], a[i]
    return a

# ----------------------------------------------------------------------------------------------------
# Hand evaluation
# ----------------------------------------------------------------------------------------------------

CATEGORY_NAMES = ["high_card", "pair", "two_pair", "three_of_a_kind", "straight", "flush",
                  "full_house", "four_of_a_kind", "straight_flush"]

# Order of categories from weakest to strongest, per ranking rule.
ORDER = {
    "standard":            ["high_card", "pair", "two_pair", "three_of_a_kind", "straight", "flush",
                            "full_house", "four_of_a_kind", "straight_flush"],
    # Short Deck (6+), default Kilima rule: flush beats full house AND three of a kind beats a straight.
    "shortdeck_trips":     ["high_card", "pair", "two_pair", "straight", "three_of_a_kind",
                            "full_house", "flush", "four_of_a_kind", "straight_flush"],
    # Short Deck alternative (configurable per table): flush beats full house, straight beats trips.
    "shortdeck_straight":  ["high_card", "pair", "two_pair", "three_of_a_kind", "straight",
                            "full_house", "flush", "four_of_a_kind", "straight_flush"],
}


def _straight_high(values, low_ace_as):
    """Return the high card of a straight in the 5 distinct values, or None.
    low_ace_as: the rank the ace plays as when low (1 for A-2-3-4-5, 5 for short deck A-6-7-8-9)."""
    v = sorted(set(values))
    if len(v) != 5:
        return None
    if v[4] - v[0] == 4:
        return v[4]
    if 14 in v:
        low = sorted([x for x in v if x != 14] + [low_ace_as])
        if low[4] - low[0] == 4:
            return low[4]
    return None


def eval5(cards, rule="standard"):
    """cards: 5 parsed cards. Returns a comparable key (category_index, tiebreak tuple)."""
    vals = [r for r, _ in cards]
    suits = [s for _, s in cards]
    flush = len(set(suits)) == 1
    low_ace = 5 if rule.startswith("shortdeck") else 1
    sh = _straight_high(vals, low_ace)
    cnt = Counter(vals)
    groups = sorted(cnt.items(), key=lambda kv: (kv[1], kv[0]), reverse=True)   # by count, then rank
    shape = [c for _, c in groups]
    ranks_by_group = tuple(r for r, _ in groups)
    if sh and flush:
        cat, tb = "straight_flush", (sh,)
    elif shape == [4, 1]:
        cat, tb = "four_of_a_kind", ranks_by_group
    elif shape == [3, 2]:
        cat, tb = "full_house", ranks_by_group
    elif flush:
        cat, tb = "flush", tuple(sorted(vals, reverse=True))
    elif sh:
        cat, tb = "straight", (sh,)
    elif shape == [3, 1, 1]:
        cat, tb = "three_of_a_kind", ranks_by_group
    elif shape == [2, 2, 1]:
        cat, tb = "two_pair", ranks_by_group
    elif shape == [2, 1, 1, 1]:
        cat, tb = "pair", ranks_by_group
    else:
        cat, tb = "high_card", tuple(sorted(vals, reverse=True))
    return (ORDER[rule].index(cat), tb, cat)


def key(k):
    return (k[0], k[1])


def best_holdem(hole, board, rule="standard"):
    cards = parse(hole) + parse(board)
    best = None
    for combo in itertools.combinations(cards, 5):
        k = eval5(list(combo), rule)
        if best is None or key(k) > key(best[0]):
            best = (k, combo)
    return best


def best_omaha(hole, board, rule="standard"):
    """Exactly two hole cards and exactly three board cards (Omaha 4, 5 and 6)."""
    h, b = parse(hole), parse(board)
    best = None
    for hc in itertools.combinations(h, 2):
        for bc in itertools.combinations(b, 3):
            k = eval5(list(hc + bc), rule)
            if best is None or key(k) > key(best[0]):
                best = (k, hc + bc)
    return best


def best_hand(game, hole, board):
    if game in ("nlhe", "holdem"):
        return best_holdem(hole, board)
    if game in ("plo4", "plo5", "plo6"):
        return best_omaha(hole, board)
    if game == "shortdeck":
        return best_holdem(hole, board, "shortdeck_trips")
    raise ValueError(game)


def fmt(combo):
    inv = {v: k for k, v in RV.items()}
    return " ".join(inv[r] + s for r, s in combo)

# ----------------------------------------------------------------------------------------------------
# Betting round (No-Limit / Pot-Limit) — legality only; the engine adds timers and events.
# ----------------------------------------------------------------------------------------------------

class Hand:
    """Minimal but complete betting model for one hand.

    seats: list of dicts {seat, stack}; order = clockwise starting from the seat left of the button
           (i.e. index 0 = small blind in ring games with 3+ players).
    Heads-up: index 0 is the button/small blind and acts first pre-flop, last post-flop.
    """

    def __init__(self, seats, sb, bb, structure="NL", ante=0, bb_ante=0, heads_up=False):
        self.structure, self.bb, self.heads_up = structure, bb, heads_up
        self.p = [dict(seat=s["seat"], stack=s["stack"], street=0, total=0, folded=False,
                       allin=False, acted_level=None) for s in seats]
        self.street_no = 0
        self.current_bet = 0
        self.last_full_raise = bb          # minimum raise increment
        self.pot_before_street = 0
        self.log = []
        # antes (dead money, not part of the street bet)
        for i, pl in enumerate(self.p):
            a = ante if not bb_ante else (bb_ante if i == self._bb_index() else 0)
            if a:
                self._put(pl, min(a, pl["stack"]), dead=True)
        self._post(self._sb_index(), sb)
        self._post(self._bb_index(), bb)
        self.current_bet = bb
        self.to_act = self._first_preflop()

    # --- seat helpers
    def _sb_index(self):
        return 0

    def _bb_index(self):
        return 1

    def _first_preflop(self):
        if self.heads_up:
            return 0
        return self._next_active(1)

    def _first_postflop(self):
        if self.heads_up:
            return self._next_active(0)          # big blind (non-button) acts first after the flop
        return self._next_active(len(self.p) - 1)

    def _next_active(self, i, include_self=False):
        n = len(self.p)
        for k in range(0 if include_self else 1, n + 1):
            j = (i + k) % n
            pl = self.p[j]
            if not pl["folded"] and not pl["allin"]:
                return j
        return None

    def _put(self, pl, amount, dead=False):
        amount = min(amount, pl["stack"])
        pl["stack"] -= amount
        pl["total"] += amount
        if not dead:
            pl["street"] += amount
        if pl["stack"] == 0:
            pl["allin"] = True
        return amount

    def _post(self, i, amount):
        self._put(self.p[i], amount)

    def pot_total(self):
        return sum(pl["total"] for pl in self.p)

    # --- legality
    def legal(self):
        i = self.to_act
        pl = self.p[i]
        call_amt = min(self.current_bet - pl["street"], pl["stack"])
        acts = {"fold": call_amt > 0, "check": call_amt == 0, "call": call_amt if call_amt > 0 else None}
        max_to = pl["street"] + pl["stack"]                       # all-in, as a street total
        # may this player raise? Not if the action was not reopened to them by a full raise.
        reopened = pl["acted_level"] is None or (self.current_bet - pl["acted_level"]) >= self.last_full_raise
        if pl["stack"] > call_amt and reopened and self._others_can_act(i):
            min_to = self.current_bet + self.last_full_raise if self.current_bet > 0 else self.bb
            if self.structure == "PL":
                pot_after_call = self.pot_total() + call_amt
                cap = self.current_bet + pot_after_call
                max_to = min(max_to, cap)
            min_to = min(min_to, pl["street"] + pl["stack"])      # an all-in below the minimum is allowed
            acts["raise"] = {"min_to": min_to, "max_to": max_to}
            acts["bet_or_raise"] = "bet" if self.current_bet == 0 else "raise"
        else:
            acts["raise"] = None
        return acts

    def _others_can_act(self, i):
        return any(not q["folded"] and not q["allin"] for j, q in enumerate(self.p) if j != i)

    def act(self, action, to=None):
        i = self.to_act
        pl = self.p[i]
        L = self.legal()
        self.log.append((pl["seat"], action, to))
        if action == "fold":
            if not L["fold"]:
                raise ValueError("ILLEGAL_ACTION: fold when check is available (auto-converted by client)")
            pl["folded"] = True
        elif action == "check":
            if not L["check"]:
                raise ValueError("ILLEGAL_ACTION: cannot check")
        elif action == "call":
            if L["call"] is None:
                raise ValueError("ILLEGAL_ACTION: nothing to call")
            self._put(pl, L["call"])
        elif action in ("bet", "raise", "allin"):
            r = L["raise"]
            if action == "allin":
                to = pl["street"] + pl["stack"]
                if r is None:          # all-in as a call
                    self._put(pl, pl["stack"]); pl["acted_level"] = self.current_bet
                    return self._advance(i)
                to = min(to, r["max_to"]) if self.structure == "PL" else to
            if r is None:
                raise ValueError("ILLEGAL_ACTION: raising not allowed (action not reopened)")
            if to is None or to > r["max_to"] or (to < r["min_to"]) or to <= self.current_bet:
                raise ValueError("ILLEGAL_AMOUNT: raise to %s outside [%s, %s]" % (to, r["min_to"], r["max_to"]))
            increment = to - self.current_bet
            self._put(pl, to - pl["street"])
            if increment >= self.last_full_raise:
                self.last_full_raise = increment                   # a full raise: reopens the betting
            self.current_bet = to
        else:
            raise ValueError(action)
        pl["acted_level"] = self.current_bet
        return self._advance(i)

    def _advance(self, i):
        live = [q for q in self.p if not q["folded"]]
        if len(live) == 1:
            self.to_act = None
            return "hand_over"
        pending = [j for j, q in enumerate(self.p) if not q["folded"] and not q["allin"] and
                   (q["acted_level"] is None or q["street"] < self.current_bet)]
        if not pending:
            self.to_act = None
            return "street_over"
        self.to_act = self._next_active(i)
        while self.to_act not in pending:
            self.to_act = self._next_active(self.to_act)
        return "continue"

    def next_street(self):
        self.street_no += 1
        for q in self.p:
            q["street"] = 0
            q["acted_level"] = None
        self.current_bet = 0
        self.last_full_raise = self.bb
        active = [q for q in self.p if not q["folded"] and not q["allin"]]
        if len(active) <= 1:
            self.to_act = None
            return "runout"
        self.to_act = self._first_postflop()
        return "continue"

# ----------------------------------------------------------------------------------------------------
# Pots, rake and distribution
# ----------------------------------------------------------------------------------------------------

def return_uncalled(contrib):
    """contrib: {seat: total put in}. The part of the largest contribution that nobody matched is returned.
    Returns (adjusted_contrib, {seat: returned})."""
    c = dict(contrib)
    ordered = sorted(c.values(), reverse=True)
    if len(ordered) >= 2 and ordered[0] > ordered[1]:
        top = max(c, key=lambda s: c[s])
        back = ordered[0] - ordered[1]
        c[top] -= back
        return c, {top: back}
    return c, {}


def build_pots(contrib, folded):
    """Layered side pots. contrib: {seat: amount}; folded: set of seats (their money stays in, they cannot win).
    Returns [{amount, eligible:[seats]}] main pot first. Adjacent layers with the same eligible set are merged."""
    levels = sorted(set(v for s, v in contrib.items() if v > 0 and s not in folded))
    pots, prev = [], 0
    for lv in levels:
        amount = sum(max(0, min(v, lv) - prev) for v in contrib.values())
        elig = sorted(s for s, v in contrib.items() if s not in folded and v >= lv)
        if amount > 0:
            if pots and pots[-1]["eligible"] == elig:
                pots[-1]["amount"] += amount
            else:
                pots.append({"amount": amount, "eligible": elig})
        prev = lv
    # money from folded players above the highest live level (cannot happen after return_uncalled, kept for safety)
    rest = sum(max(0, v - prev) for v in contrib.values())
    if rest:
        pots[-1]["amount"] += rest
    return pots


def compute_rake(pots, percent_bp, cap, saw_flop):
    """percent_bp: rake in basis points (500 = 5 %). cap: maximum rake in minor units for this hand
    (depends on stake and players dealt in; config). No flop, no drop. Rake = floor(total × pct), capped.
    The rake is taken from the pots proportionally to their size (floor), remainder units from the main pot
    onwards. Returns (rake_total, [rake per pot])."""
    total = sum(p["amount"] for p in pots)
    if not saw_flop or total == 0:
        return 0, [0] * len(pots)
    rake = min(total * percent_bp // 10000, cap)
    parts = [rake * p["amount"] // total for p in pots]
    rem = rake - sum(parts)
    k = 0
    while rem > 0:
        if parts[k] < pots[k]["amount"]:
            parts[k] += 1; rem -= 1
        k = (k + 1) % len(pots)
    return rake, parts


def distribute(pots, rake_parts, strengths, seat_order_from_button):
    """strengths: {seat: comparable key} for seats at showdown (or the single remaining player).
    seat_order_from_button: seats clockwise starting with the first seat LEFT of the button.
    Odd chips go one by one to winners in that order (first seat left of the button first).
    Returns {seat: amount won}."""
    won = Counter()
    for pot, rk in zip(pots, rake_parts):
        net = pot["amount"] - rk
        elig = [s for s in pot["eligible"] if s in strengths]
        if not elig:
            continue
        best = max(strengths[s] for s in elig)
        winners = [s for s in seat_order_from_button if s in elig and strengths[s] == best]
        share, odd = divmod(net, len(winners))
        for w in winners:
            won[w] += share
        for w in winners[:odd]:
            won[w] += 1
    return dict(won)

# ----------------------------------------------------------------------------------------------------
# Spin & Go paytable
# ----------------------------------------------------------------------------------------------------

def spin_rtp(buy_in, fee, paytable):
    """paytable: [{multiplier, per_million, split:[percent of prize for 1st, 2nd, 3rd]}].
    The prize pool for a multiplier m is m × buy_in. Players pay buy_in + fee.
    Returns the exact return-to-player (prize paid / total paid by 3 players) as a Fraction and float."""
    assert sum(r["per_million"] for r in paytable) == 1_000_000, "probabilities must sum to 1,000,000"
    expected_prize = sum(Fraction(r["per_million"], 1_000_000) * r["multiplier"] * buy_in for r in paytable)
    paid = 3 * (buy_in + fee)
    return expected_prize / paid

# ----------------------------------------------------------------------------------------------------
# Self-check and vectors
# ----------------------------------------------------------------------------------------------------

PUBLISHED_5CARD = {"straight_flush": 40, "four_of_a_kind": 624, "full_house": 3744, "flush": 5108,
                   "straight": 10200, "three_of_a_kind": 54912, "two_pair": 123552, "pair": 1098240,
                   "high_card": 1302540}


def frequency(variant, rule):
    d = parse(deck(variant))
    cnt = Counter()
    for combo in itertools.combinations(d, 5):
        cnt[eval5(list(combo), rule)[2]] += 1
    return dict(cnt)


def main(fast=False):
    vectors = {"version": "1.0", "notation": "rank AKQJT98765432 + suit shdc, e.g. 'Ah', 'Td'; amounts in minor units",
               "evaluation": [], "comparison": [], "betting": [], "pots": [], "rake": [], "spin": []}

    # 1. evaluator frequency self-check
    if not fast:
        f52 = frequency("holdem", "standard")
        assert f52 == PUBLISHED_5CARD, f52
        f36 = frequency("shortdeck", "shortdeck_trips")
        vectors["frequency"] = {"standard_52": f52, "shortdeck_36": f36}
        print("5-card frequencies (52 cards) match the published table:", sum(f52.values()), "hands")
        print("short deck (36 cards) frequencies:", f36)

    # 2. evaluation vectors
    EVAL = [
        ("nlhe", "Ah Kh", "Qh Jh Th 2c 3d", "straight_flush", "Ah Kh Qh Jh Th"),
        ("nlhe", "5c 4d", "Ah 2s 3h 9c Kd", "straight", "5c 4d Ah 2s 3h"),
        ("nlhe", "9s 9h", "9d 9c 2s 2h Kd", "four_of_a_kind", "9s 9h 9d 9c Kd"),
        ("nlhe", "Ks Kh", "Kd 2s 2h 2d 7c", "full_house", "Ks Kh Kd 2s 2h"),
        ("nlhe", "As 3s", "Ks 8s 2s Qh Qd", "flush", "As 3s Ks 8s 2s"),
        ("nlhe", "7c 7d", "Ah Ad 7s 2c 3c", "full_house", "7c 7d Ah Ad 7s"),
        ("nlhe", "Qc Jd", "Ah Kh 5c 5d 2s", "pair", "Qc Ah Kh 5c 5d"),
        ("nlhe", "2c 3d", "As Kh Qd Jc 9s", "high_card", "As Kh Qd Jc 9s"),
        ("nlhe", "Tc Td", "Ts 4h 4d 4c Kd", "full_house", "Tc Td Ts 4h 4d"),
        ("nlhe", "Ah Qh", "Kh Jh 9h 8h 2h", "flush", "Ah Qh Kh Jh 9h"),
        ("plo4", "Ah Kh 2c 3d", "Qh Jh Th 9s 8s", "straight_flush", "Ah Kh Qh Jh Th"),
        ("plo4", "As Ad Ac 2h", "Kd Ks 7h 8c 9d", "two_pair", "As Ad Kd Ks 9d"),   # only two hole cards: no full house
        ("plo4", "Ah 2c 3d 4s", "Kh Qh Jh Th 5c", "high_card", "Ah 4s Kh Qh Jh"),   # Broadway needs 4 board cards: not allowed
        ("plo4", "As Ks 2d 3c", "Qs Js 8s 7h 6d", "flush", "As Ks Qs Js 8s"),
        ("plo4", "Kc Kd 4h 5h", "Ks Kh 7c 2d 9s", "four_of_a_kind", "Kc Kd Ks Kh 9s"),
        ("plo5", "Ah Ad 7c 8c 9s", "Ts Jd 2h 3c 6c", "pair", "Ah Ad Jd Ts 6c"),   # 7-8-9 need three hole cards
        ("plo6", "Ah Ks Qd Jc 3h 2h", "Th 9h 8h 4c 4d", "flush", "Ah 3h Th 9h 8h"),
        ("shortdeck", "Ah 6c", "7d 8s 9h Kc Kd", "straight", "9h 8s 7d 6c Ah"),
        ("shortdeck", "Ks Kh", "Kd 8s 9h Td Jc", "three_of_a_kind", "Ks Kh Kd Jc Td"),
        ("shortdeck", "As 9s", "Ks 7s 6s 9h 9d", "flush", "As Ks 9s 7s 6s"),
    ]
    for game, hole, board, cat, cards in EVAL:
        (k, combo) = best_hand(game, hole, board)
        assert k[2] == cat, (game, hole, board, k, fmt(combo))
        assert sorted(parse(cards)) == sorted(combo), (game, hole, board, fmt(combo))
        vectors["evaluation"].append({"game": game, "hole": hole, "board": board, "category": cat, "best5": cards})

    # 3. comparison vectors (winner or split)
    CMP = [
        ("nlhe", "Jh 5h Th 8c Ac", {"A": "Ah Kd", "B": "As Qd"}, ["A"], "pair of aces, kicker K beats Q"),
        ("nlhe", "2s 3s 4s 5d 6d", {"A": "Ah Kh", "B": "7c 7d"}, ["B"], "7-high straight beats 6-high board straight"),
        ("nlhe", "Ah Kh Qh Jh Th", {"A": "2c 3c", "B": "4d 5d"}, ["A", "B"], "royal flush on board: split"),
        ("nlhe", "Ks Kd 7h 7c 2d", {"A": "Ac 3c", "B": "Ad 4d"}, ["A", "B"], "two pair, ace kicker: split"),
        ("nlhe", "9h 9d 5s 5c 2h", {"A": "Ts 8s", "B": "Th 3h"}, ["A", "B"], "kicker T plays for both"),
        ("plo4", "Ah Kh 7c 2d 9s", {"A": "Qh Jh 3s 4s", "B": "As Ad Kc Kd"}, ["B"], "two hearts on board only: no flush for A; B has trips aces"),
        ("shortdeck", "Kh Kd 8s 9c Tc", {"A": "Ks Qc", "B": "Js 7d"}, ["A"], "trips beat straight in short deck"),
        ("shortdeck", "As Ks 9s 9h 7d", {"A": "Qs 6s", "B": "9d 7h"}, ["A"], "flush beats full house in short deck"),
    ]
    for game, board, hands, winners, note in CMP:
        keys = {p: key(best_hand(game, h, board)[0]) for p, h in hands.items()}
        best = max(keys.values())
        got = sorted(p for p, k in keys.items() if k == best)
        assert got == winners, (board, hands, got)
        vectors["comparison"].append({"game": game, "board": board, "hands": hands, "winners": winners, "note": note})

    # 4. betting legality vectors
    def seats(n, stack=10000):
        return [{"seat": i + 1, "stack": stack} for i in range(n)]

    B = []
    h = Hand(seats(6), 50, 100, "PL")
    B.append({"case": "PLO 50/100, 6-max, first to act pre-flop: pot-size raise", "structure": "PL",
              "blinds": [50, 100], "actions": [], "legal": h.legal()})
    assert h.legal()["raise"] == {"min_to": 200, "max_to": 350}
    h.act("raise", 350)
    L = h.legal()
    B.append({"case": "PLO: after a pot raise to 350, next player's pot raise", "structure": "PL", "blinds": [50, 100],
              "actions": [["raise", 350]], "legal": L})
    assert L["raise"] == {"min_to": 600, "max_to": 1200}, L        # pot 500 + call 350 = 850; 350 + 850 = 1200
    h = Hand(seats(6), 50, 100, "NL")
    h.act("raise", 300); h.act("raise", 900)
    L = h.legal()
    assert L["raise"]["min_to"] == 1500 and L["raise"]["max_to"] == 10000
    B.append({"case": "NL 50/100: open 300, 3-bet to 900; minimum 4-bet is to 1500", "structure": "NL",
              "blinds": [50, 100], "actions": [["raise", 300], ["raise", 900]], "legal": L})
    # incomplete all-in raise does not reopen
    st = [{"seat": 1, "stack": 10000}, {"seat": 2, "stack": 10000}, {"seat": 3, "stack": 10000}, {"seat": 4, "stack": 1400}]
    h = Hand(st, 50, 100, "NL")
    h.act("raise", 1000)       # seat 3 opens to 1000 (raise of 900)
    h.act("allin")             # seat 4 all-in 1400: raise of only 400 < 900 → incomplete
    h.act("fold"); h.act("fold")     # SB, BB fold
    L = h.legal()              # back to seat 3: may call 400 more but NOT re-raise
    assert L["call"] == 400 and L["raise"] is None, L
    B.append({"case": "NL: open 1000, short all-in to 1400 (incomplete raise); opener may only call or fold",
              "structure": "NL", "blinds": [50, 100], "stacks": [10000, 10000, 10000, 1400],
              "actions": [["raise", 1000], ["allin", None], ["fold", None], ["fold", None]], "legal": L})
    # heads-up: button is SB and acts first pre-flop
    h = Hand(seats(2), 50, 100, "NL", heads_up=True)
    L = h.legal()
    assert h.to_act == 0 and L["call"] == 50 and L["raise"]["min_to"] == 200
    B.append({"case": "Heads-up NL: button posts SB and acts first pre-flop", "structure": "NL", "blinds": [50, 100],
              "actions": [], "to_act_index": 0, "legal": L})
    # BB option: limped pot, BB can check or raise
    h = Hand(seats(3), 50, 100, "NL")
    h.act("call"); h.act("call")
    L = h.legal()
    assert L["check"] and L["raise"]["min_to"] == 200
    B.append({"case": "NL 3-handed: limp, SB completes; big blind has the option", "structure": "NL", "blinds": [50, 100],
              "actions": [["call", None], ["call", None]], "legal": L})
    # BB ante
    h = Hand(seats(6), 50, 100, "NL", bb_ante=100)
    assert h.pot_total() == 250 and h.legal()["raise"]["min_to"] == 200
    B.append({"case": "Tournament big-blind ante: BB posts 100 blind + 100 ante (dead)", "structure": "NL",
              "blinds": [50, 100], "bb_ante": 100, "pot_before_action": 250, "legal": h.legal()})
    vectors["betting"] = B

    # 5. pots and side pots
    P = []
    contrib = {1: 1000, 2: 3000, 3: 5000, 4: 5000}
    c2, returned = return_uncalled(contrib)
    pots = build_pots(c2, folded=set())
    assert pots == [{"amount": 4000, "eligible": [1, 2, 3, 4]}, {"amount": 6000, "eligible": [2, 3, 4]},
                    {"amount": 4000, "eligible": [3, 4]}] and returned == {}
    P.append({"case": "Three all-ins of different sizes", "contrib": contrib, "folded": [], "returned": returned, "pots": pots})
    contrib = {1: 200, 2: 200, 3: 1500}
    c2, returned = return_uncalled(contrib)
    pots = build_pots(c2, folded=set())
    assert returned == {3: 1300} and pots == [{"amount": 600, "eligible": [1, 2, 3]}]
    P.append({"case": "Uncalled bet returned", "contrib": contrib, "folded": [], "returned": returned, "pots": pots})
    contrib = {1: 500, 2: 2000, 3: 2000, 4: 800}
    pots = build_pots(contrib, folded={4})
    assert pots == [{"amount": 2000, "eligible": [1, 2, 3]}, {"amount": 3300, "eligible": [2, 3]}], pots
    P.append({"case": "Folded player's chips stay in the pots they reached", "contrib": contrib, "folded": [4], "returned": {}, "pots": pots})
    vectors["pots"] = P

    # 6. rake + distribution
    R = []
    pots = [{"amount": 4000, "eligible": [1, 2, 3, 4]}, {"amount": 6000, "eligible": [2, 3, 4]}, {"amount": 4000, "eligible": [3, 4]}]
    rake, parts = compute_rake(pots, 500, 300, True)
    assert rake == 300 and parts == [86, 129, 85], parts
    strengths = {1: (8, (14,)), 2: (1, (9, 14, 13, 2)), 3: (1, (9, 14, 13, 2)), 4: (0, (14, 13, 9, 7, 2))}
    won = distribute(pots, parts, strengths, [1, 2, 3, 4])
    assert won == {1: 3914, 2: 2936, 3: 6850}, won
    assert sum(won.values()) + rake == 14000
    R.append({"case": "5 % rake capped at 300 over three pots; seat 1 wins the main pot, seats 2 and 3 split side pot 1, seat 3 wins side pot 2",
              "pots": pots, "rake_bp": 500, "cap": 300, "saw_flop": True, "rake": rake, "rake_per_pot": parts,
              "winners_by_strength": "1 > (2 = 3) > 4", "button_order": [1, 2, 3, 4], "won": won})
    rake, parts = compute_rake([{"amount": 350, "eligible": [1, 2]}], 500, 300, False)
    assert rake == 0
    R.append({"case": "No flop, no drop", "pots": [{"amount": 350, "eligible": [1, 2]}], "rake_bp": 500, "cap": 300,
              "saw_flop": False, "rake": 0, "rake_per_pot": [0]})
    pots = [{"amount": 1001, "eligible": [1, 2]}]
    rake, parts = compute_rake(pots, 500, 300, True)
    won = distribute(pots, parts, {1: (1, (5,)), 2: (1, (5,))}, [2, 1])
    assert rake == 50 and won == {2: 476, 1: 475}, won
    R.append({"case": "Split pot with an odd unit: goes to the first winner left of the button", "pots": pots,
              "rake_bp": 500, "cap": 300, "saw_flop": True, "rake": rake, "rake_per_pot": parts,
              "button_order": [2, 1], "won": won})
    vectors["rake"] = R

    # 7. Spin & Go paytable (illustrative; the certified paytable is configuration approved per jurisdiction)
    paytable = [
        {"multiplier": 2, "per_million": 750_000, "split": [100]},
        {"multiplier": 3, "per_million": 180_000, "split": [100]},
        {"multiplier": 5, "per_million": 50_000, "split": [100]},
        {"multiplier": 10, "per_million": 15_000, "split": [100]},
        {"multiplier": 25, "per_million": 4_000, "split": [80, 10, 10]},
        {"multiplier": 100, "per_million": 900, "split": [80, 10, 10]},
        {"multiplier": 1000, "per_million": 100, "split": [80, 10, 10]},
    ]
    rtp = spin_rtp(1000, 0, paytable)
    vectors["spin"].append({"case": "Illustrative Summit Spins paytable, buy-in 1000 (fee included in multiplier edge)",
                            "buy_in": 1000, "fee": 0, "paytable": paytable,
                            "rtp_exact": "%d/%d" % (rtp.numerator, rtp.denominator), "rtp": round(float(rtp), 6)})

    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "test_vectors.json")
    if fast and os.path.exists(path):            # keep the enumerated frequencies from the last full run
        prev = json.load(open(path))
        if "frequency" in prev:
            vectors["frequency"] = prev["frequency"]
    with open(path, "w") as fh:
        json.dump(vectors, fh, indent=1, sort_keys=False)
    print("wrote", path, "—", sum(len(v) for k, v in vectors.items() if isinstance(v, list)), "vectors; spin RTP",
          round(float(rtp) * 100, 3), "%")


if __name__ == "__main__":
    main(fast="--fast" in sys.argv)
