/**
 * @kilima/engine-poker — pure poker engine (KP-ENG-06). No I/O, clock or randomness (CLAUDE.md §3).
 * v0 (WP-05 slices 1–2): cards; Hold'em, Omaha 4/5/6 and Short Deck evaluation.
 */
export * from "./cards.js";
export * from "./rules/ranking.js";
export { categoryOf, evaluate5, type HandValue } from "./eval/five.js";
export { bestOfAny, evaluateHoldem, winners, type Evaluation } from "./eval/best.js";
export { evaluateOmaha } from "./eval/omaha.js";
export { evaluateHand, HOLE_CARDS, rankingRuleFor, type EvaluateOptions, type Game } from "./eval/game.js";
export * from "./hand/types.js";
export { applyAction, createHand, isComplete, legalActions, potTotal, timeout } from "./hand/hand.js";
