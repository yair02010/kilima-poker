/**
 * Uncalled bets, side pots, rake and awarding (KP-ENG-06 §9–§10, ADR-0018, KP-HBK-11 §6).
 * Ported from poker_reference.py: return_uncalled, build_pots, compute_rake, distribute.
 * All amounts are bigint minor units; seats are table seat numbers.
 */

export interface Pot {
  amount: bigint;
  /** Seats that can win this pot (not folded, contributed at least this layer), ascending. */
  eligible: number[];
}

export type Contributions = ReadonlyMap<number, bigint>;

/**
 * The part of the largest contribution that nobody matched is returned to its owner (§9.1).
 * Returns the adjusted contributions and the returned amounts.
 */
export function returnUncalled(contrib: Contributions): {
  contrib: Map<number, bigint>;
  returned: Map<number, bigint>;
} {
  const c = new Map(contrib);
  const returned = new Map<number, bigint>();
  const entries = [...c.entries()].sort((a, b) => (b[1] > a[1] ? 1 : b[1] < a[1] ? -1 : a[0] - b[0]));
  const [top, second] = entries;
  if (top && second && top[1] > second[1]) {
    const back = top[1] - second[1];
    c.set(top[0], top[1] - back);
    returned.set(top[0], back);
  }
  return { contrib: c, returned };
}

/** Layered side pots, main pot first; adjacent layers with the same eligible seats are merged (§9.2). */
export function buildPots(contrib: Contributions, folded: ReadonlySet<number>): Pot[] {
  const live = [...contrib.entries()].filter(([s, v]) => v > 0n && !folded.has(s)).map(([, v]) => v);
  const levels = [...new Set(live)].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
  const pots: Pot[] = [];
  let prev = 0n;
  for (const level of levels) {
    let amount = 0n;
    for (const v of contrib.values()) {
      const layer = (v < level ? v : level) - prev;
      if (layer > 0n) amount += layer;
    }
    const eligible = [...contrib.entries()]
      .filter(([s, v]) => !folded.has(s) && v >= level)
      .map(([s]) => s)
      .sort((a, b) => a - b);
    if (amount > 0n) {
      const last = pots.at(-1);
      if (last && last.eligible.join(",") === eligible.join(",")) last.amount += amount;
      else pots.push({ amount, eligible });
    }
    prev = level;
  }
  // Chips of folded players above the highest live level (cannot happen after returnUncalled; kept for safety).
  let rest = 0n;
  for (const v of contrib.values()) if (v > prev) rest += v - prev;
  const last = pots.at(-1);
  if (rest > 0n && last) last.amount += rest;
  return pots;
}

export interface RakeConfig {
  /** Rake percentage in basis points (500 = 5 %). */
  percentBp: number;
  /** Maximum rake for the hand, minor units. */
  cap: bigint;
}

/**
 * rake = min(floor(total × percentBp / 10000), cap); no flop, no drop; allocated to pots proportionally
 * (floor), remaining units from the main pot onwards (§10).
 */
export function computeRake(
  pots: readonly Pot[],
  rake: RakeConfig | undefined,
  sawFlop: boolean,
): { rake: bigint; perPot: bigint[] } {
  const sum = pots.reduce((x, p) => x + p.amount, 0n);
  if (!rake || !sawFlop || sum === 0n) return { rake: 0n, perPot: pots.map(() => 0n) };
  if (!Number.isInteger(rake.percentBp) || rake.percentBp < 0 || rake.percentBp > 10_000 || rake.cap < 0n) {
    throw new RangeError("bad rake configuration");
  }
  const byPercent = (sum * BigInt(rake.percentBp)) / 10_000n;
  const taken = byPercent < rake.cap ? byPercent : rake.cap;
  const perPot = pots.map((p) => (taken * p.amount) / sum);
  let rem = taken - perPot.reduce((x, y) => x + y, 0n);
  for (let k = 0; rem > 0n; k = (k + 1) % pots.length) {
    const part = perPot[k] ?? 0n;
    if (part < (pots[k]?.amount ?? 0n)) {
      perPot[k] = part + 1n;
      rem -= 1n;
    }
  }
  return { rake: taken, perPot };
}

export interface PotAward {
  pot: Pot;
  rake: bigint;
  /** Winning seats, in odd-chip order (first seat left of the button first). */
  winners: number[];
  /** Amount won per seat from this pot. */
  won: Map<number, bigint>;
}

/**
 * Awards each pot to the best eligible hand; ties split, odd units one at a time to the tied winners in
 * seat order starting left of the button (§9.3). `strengths` holds hand values of the seats that can win
 * (showdown hands, or the single remaining player). Higher value = better.
 */
export function distribute(
  pots: readonly Pot[],
  rakePerPot: readonly bigint[],
  strengths: ReadonlyMap<number, number>,
  seatOrderFromButton: readonly number[],
): { won: Map<number, bigint>; awards: PotAward[] } {
  const won = new Map<number, bigint>();
  const awards: PotAward[] = [];
  pots.forEach((pot, k) => {
    const rake = rakePerPot[k] ?? 0n;
    const net = pot.amount - rake;
    const contenders = pot.eligible.filter((s) => strengths.has(s));
    const award: PotAward = { pot, rake, winners: [], won: new Map() };
    awards.push(award);
    if (contenders.length === 0) return;
    const best = Math.max(...contenders.map((s) => strengths.get(s) ?? -1));
    const winners = seatOrderFromButton.filter((s) => contenders.includes(s) && strengths.get(s) === best);
    const n = BigInt(winners.length);
    const share = net / n;
    const odd = Number(net % n);
    winners.forEach((w, i) => {
      const amount = share + (i < odd ? 1n : 0n);
      award.won.set(w, amount);
      won.set(w, (won.get(w) ?? 0n) + amount);
    });
    award.winners = winners;
  });
  return { won, awards };
}
