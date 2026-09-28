/**
 * Hand categories and their order per ranking rule (KP-ENG-06 §8, ADR-0016).
 */

export const CATEGORIES = [
  "high_card",
  "pair",
  "two_pair",
  "three_of_a_kind",
  "straight",
  "flush",
  "full_house",
  "four_of_a_kind",
  "straight_flush",
] as const;

export type Category = (typeof CATEGORIES)[number];

/**
 * - standard: Hold'em and Omaha.
 * - shortdeck_trips: Kilima default for Short Deck — flush beats full house, trips beat a straight.
 * - shortdeck_straight: table option `shortdeck.straightBeatsTrips` — flush beats full house only.
 */
export type RankingRule = "standard" | "shortdeck_trips" | "shortdeck_straight";

/** Weakest → strongest. */
export const CATEGORY_ORDER: Readonly<Record<RankingRule, readonly Category[]>> = {
  standard: CATEGORIES,
  shortdeck_trips: [
    "high_card",
    "pair",
    "two_pair",
    "straight",
    "three_of_a_kind",
    "full_house",
    "flush",
    "four_of_a_kind",
    "straight_flush",
  ],
  shortdeck_straight: [
    "high_card",
    "pair",
    "two_pair",
    "three_of_a_kind",
    "straight",
    "full_house",
    "flush",
    "four_of_a_kind",
    "straight_flush",
  ],
};

/** strength[rule][categoryIndex] = position of that category in the rule's order (0 = weakest). */
export const STRENGTH: Readonly<Record<RankingRule, readonly number[]>> = {
  standard: CATEGORIES.map((c) => CATEGORY_ORDER.standard.indexOf(c)),
  shortdeck_trips: CATEGORIES.map((c) => CATEGORY_ORDER.shortdeck_trips.indexOf(c)),
  shortdeck_straight: CATEGORIES.map((c) => CATEGORY_ORDER.shortdeck_straight.indexOf(c)),
};

/** Rank value the ace takes when it plays low in a straight: A-2-3-4-5, or A-6-7-8-9 in Short Deck. */
export function lowAceValue(rule: RankingRule): number {
  return rule === "standard" ? 1 : 5;
}
