/**
 * Card encoding (KP-HBK-11 §2): `rank * 4 + suit`, 0–51.
 * rank 0–12 = 2,3,4,5,6,7,8,9,T,J,Q,K,A · suit 0–3 = s,h,d,c. Notation "Ah", "Td" (KP-ENG-06 §2).
 * Deck order is rank-major (2s 2h 2d 2c 3s …), identical to the reference implementation.
 */

declare const cardBrand: unique symbol;
/** A card id 0–51. Construct only with `card`, `parseCard` or the deck constants. */
export type Card = number & { readonly [cardBrand]: true };

export const RANK_CHARS = "23456789TJQKA";
export const SUIT_CHARS = "shdc";
export const RANK_COUNT = 13;
export const SUIT_COUNT = 4;

/** Rank value used in comparisons: 2–14 (ace high). */
export const rankValue = (c: Card): number => (c >> 2) + 2;
export const rankOf = (c: Card): number => c >> 2;
export const suitOf = (c: Card): number => c & 3;

export class CardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CardError";
  }
}

export function card(rank: number, suit: number): Card {
  if (!Number.isInteger(rank) || rank < 0 || rank >= RANK_COUNT) throw new CardError(`bad rank ${rank}`);
  if (!Number.isInteger(suit) || suit < 0 || suit >= SUIT_COUNT) throw new CardError(`bad suit ${suit}`);
  return (rank * 4 + suit) as Card;
}

export function isCard(n: number): n is Card {
  return Number.isInteger(n) && n >= 0 && n < 52;
}

export function parseCard(text: string): Card {
  if (text.length !== 2) throw new CardError(`bad card "${text}"`);
  const rank = RANK_CHARS.indexOf(text.charAt(0));
  const suit = SUIT_CHARS.indexOf(text.charAt(1));
  if (rank < 0 || suit < 0) throw new CardError(`bad card "${text}"`);
  return card(rank, suit);
}

/** Parses "Ah Kd" or ["Ah", "Kd"]. Rejects duplicates. */
export function parseCards(input: string | readonly string[]): Card[] {
  const parts = typeof input === "string" ? input.split(/\s+/).filter(Boolean) : input;
  const out = parts.map(parseCard);
  if (new Set(out).size !== out.length) throw new CardError(`duplicate card in "${parts.join(" ")}"`);
  return out;
}

export function formatCard(c: Card): string {
  if (!isCard(c)) throw new CardError(`bad card id ${String(c)}`);
  return RANK_CHARS.charAt(rankOf(c)) + SUIT_CHARS.charAt(suitOf(c));
}

export function formatCards(cs: readonly Card[]): string {
  return cs.map(formatCard).join(" ");
}

export type DeckVariant = "standard" | "shortdeck";

function buildDeck(lowestRank: number): readonly Card[] {
  const out: Card[] = [];
  for (let r = lowestRank; r < RANK_COUNT; r++) for (let s = 0; s < SUIT_COUNT; s++) out.push(card(r, s));
  return Object.freeze(out);
}

/** 52-card deck in canonical order. */
export const DECK_52: readonly Card[] = buildDeck(0);
/** 36-card Short Deck (6+): ranks 2–5 removed. */
export const DECK_36: readonly Card[] = buildDeck(4);

export function deckFor(variant: DeckVariant): readonly Card[] {
  return variant === "shortdeck" ? DECK_36 : DECK_52;
}
