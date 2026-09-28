/** Mulberry32 — small seeded PRNG for reproducible test data only (never game randomness). */
export function seeded(seed: number): (n: number) => number {
  let s = seed >>> 0;
  return (n: number) => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) % n) >>> 0;
  };
}
