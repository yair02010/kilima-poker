/**
 * @kilima/engine-poker — pure poker engine (KP-ENG-06). No I/O, clock or randomness (CLAUDE.md §3).
 * v0 (WP-05 slice 1): cards and Hold'em evaluation.
 */
export * from "./cards.js";
export * from "./rules/ranking.js";
export { categoryOf, evaluate5, type HandValue } from "./eval/five.js";
export { bestOfAny, evaluateHoldem, winners, type Evaluation } from "./eval/best.js";
