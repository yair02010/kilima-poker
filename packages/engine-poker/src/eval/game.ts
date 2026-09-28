/**
 * Game dispatch (KP-ENG-06 §2, §8): which cards may be used and which ranking rule applies.
 */
import { type Card, rankValue } from "../cards.js";
import type { RankingRule } from "../rules/ranking.js";
import { type Evaluation, evaluateHoldem } from "./best.js";
import { evaluateOmaha } from "./omaha.js";

export type Game = "nlhe" | "plo4" | "plo5" | "plo6" | "shortdeck";

export const HOLE_CARDS: Readonly<Record<Game, number>> = {
  nlhe: 2,
  plo4: 4,
  plo5: 5,
  plo6: 6,
  shortdeck: 2,
};

export interface EvaluateOptions {
  /** Short Deck table option `shortdeck.straightBeatsTrips` (ADR-0016). Default false. */
  straightBeatsTrips?: boolean;
}

export function rankingRuleFor(game: Game, opts: EvaluateOptions = {}): RankingRule {
  if (game !== "shortdeck") return "standard";
  return opts.straightBeatsTrips ? "shortdeck_straight" : "shortdeck_trips";
}

/** Evaluates a player's hand for the given game. Throws RangeError on an impossible hand. */
export function evaluateHand(
  game: Game,
  hole: readonly Card[],
  board: readonly Card[],
  opts: EvaluateOptions = {},
): Evaluation {
  if (hole.length !== HOLE_CARDS[game]) {
    throw new RangeError(`${game} needs ${HOLE_CARDS[game]} hole cards, got ${hole.length}`);
  }
  const rule = rankingRuleFor(game, opts);
  switch (game) {
    case "nlhe":
      return evaluateHoldem(hole, board, rule);
    case "shortdeck":
      if ([...hole, ...board].some((c) => rankValue(c) < 6)) {
        throw new RangeError("Short Deck uses only ranks 6 to A");
      }
      return evaluateHoldem(hole, board, rule);
    case "plo4":
    case "plo5":
    case "plo6":
      return evaluateOmaha(hole, board, rule);
  }
}
