/**
 * Five-card evaluation to one comparable integer (KP-HBK-11 §2).
 *
 * value = strength << 24 | category << 20 | tiebreak (five 4-bit rank values, most significant first)
 * - strength: position of the category in the ranking rule (decides between categories)
 * - category: index in CATEGORIES (lets us decode the name)
 * - tiebreak: ranks grouped by count then rank (e.g. full house KKK22 → K,2), or the straight's high card
 * Higher value = better hand. Values are exact small integers (< 2^28).
 */
import { type Card, rankValue } from "../cards.js";
import { type Category, CATEGORIES, lowAceValue, type RankingRule, STRENGTH } from "../rules/ranking.js";

export type HandValue = number;

const CAT = {
  high_card: 0,
  pair: 1,
  two_pair: 2,
  three_of_a_kind: 3,
  straight: 4,
  flush: 5,
  full_house: 6,
  four_of_a_kind: 7,
  straight_flush: 8,
} as const satisfies Record<Category, number>;

/** High card of the straight formed by five distinct values (sorted descending), or 0. */
function straightHigh(v: readonly number[], lowAce: number): number {
  const [a = 0, b = 0, , d = 0, e = 0] = v;
  if (a - e === 4) return a;
  // Ace plays low: A-2-3-4-5 is 5-high; in Short Deck A-6-7-8-9 is 9-high.
  if (a === 14 && b - e === 3 && e === lowAce + 1 && d === e + 1) return b;
  return 0;
}

function pack(rule: RankingRule, cat: number, tb: number): HandValue {
  return ((STRENGTH[rule][cat] ?? 0) << 24) | (cat << 20) | tb;
}

/**
 * Evaluates exactly five distinct cards. Allocation-light: the hot path of every showdown
 * (KP-HBK-11 §7 performance budget).
 */
export function evaluate5(cards: readonly Card[], rule: RankingRule = "standard"): HandValue {
  if (cards.length !== 5) throw new RangeError(`evaluate5 needs 5 cards, got ${cards.length}`);
  const c0 = cards[0] as Card;
  const c1 = cards[1] as Card;
  const c2 = cards[2] as Card;
  const c3 = cards[3] as Card;
  const c4 = cards[4] as Card;
  const flush = ((c0 ^ c1) | (c0 ^ c2) | (c0 ^ c3) | (c0 ^ c4)) & 3 ? false : true;

  // Rank values 2–14, sorted descending (insertion sort on five locals).
  const v = [rankValue(c0), rankValue(c1), rankValue(c2), rankValue(c3), rankValue(c4)];
  for (let i = 1; i < 5; i++) {
    const x = v[i] as number;
    let j = i - 1;
    while (j >= 0 && (v[j] as number) < x) {
      v[j + 1] = v[j] as number;
      j--;
    }
    v[j + 1] = x;
  }

  // Runs of equal ranks, encoded len*16 + value, then ordered by length (then value) descending.
  const runs: number[] = [];
  let start = 0;
  for (let i = 1; i <= 5; i++) {
    if (i === 5 || v[i] !== v[start]) {
      runs.push((i - start) * 16 + (v[start] as number));
      start = i;
    }
  }
  runs.sort((x, y) => y - x);
  const lead = (runs[0] as number) >> 4;
  const second = runs.length > 1 ? (runs[1] as number) >> 4 : 0;
  let byGroup = 0;
  for (const r of runs) byGroup = (byGroup << 4) | (r & 15);
  byGroup <<= 4 * (5 - runs.length);
  const allFive =
    ((((((((v[0] as number) << 4) | (v[1] as number)) << 4) | (v[2] as number)) << 4) | (v[3] as number)) <<
      4) |
    (v[4] as number);

  const high = runs.length === 5 ? straightHigh(v, lowAceValue(rule)) : 0;
  if (high && flush) return pack(rule, CAT.straight_flush, high << 16);
  if (lead === 4) return pack(rule, CAT.four_of_a_kind, byGroup);
  if (lead === 3 && second === 2) return pack(rule, CAT.full_house, byGroup);
  if (flush) return pack(rule, CAT.flush, allFive);
  if (high) return pack(rule, CAT.straight, high << 16);
  if (lead === 3) return pack(rule, CAT.three_of_a_kind, byGroup);
  if (lead === 2 && second === 2) return pack(rule, CAT.two_pair, byGroup);
  if (lead === 2) return pack(rule, CAT.pair, byGroup);
  return pack(rule, CAT.high_card, allFive);
}

export function categoryOf(value: HandValue): Category {
  const c = CATEGORIES[(value >> 20) & 0xf];
  if (c === undefined) throw new RangeError(`bad hand value ${value}`);
  return c;
}
