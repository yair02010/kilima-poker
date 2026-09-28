import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The normative vectors produced by docs/03-engineering/reference/poker_reference.py. */
export const VECTORS_PATH = fileURLToPath(
  new URL("../../../../docs/03-engineering/reference/test_vectors.json", import.meta.url),
);

export interface EvaluationVector {
  game: string;
  hole: string;
  board: string;
  category: string;
  best5: string;
}
export interface ComparisonVector {
  game: string;
  board: string;
  hands: Record<string, string>;
  winners: string[];
  note: string;
}
export interface BettingVector {
  case: string;
  structure: "NL" | "PL";
  blinds: [number, number];
  stacks?: number[];
  // eslint-disable-next-line kilima/no-float-money -- integer JSON exchanged with poker_reference.py
  bb_ante?: number;
  actions?: [string, number | null][];
  to_act_index?: number;
  pot_before_action?: number;
  legal: {
    fold: boolean;
    check: boolean;
    call: number | null;
    raise: { min_to: number; max_to: number } | null;
    bet_or_raise?: "bet" | "raise";
  };
}
export interface Vectors {
  betting: BettingVector[];
  version: string;
  evaluation: EvaluationVector[];
  comparison: ComparisonVector[];
  frequency: Record<string, Record<string, number>>;
}

export const vectors = JSON.parse(readFileSync(VECTORS_PATH, "utf8")) as Vectors;

/** Games covered by the engine. */
export const SUPPORTED_GAMES = new Set(["nlhe", "plo4", "plo5", "plo6", "shortdeck"]);
