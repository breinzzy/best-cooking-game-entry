// DAPUR KILAT — random.js
// One job: a tiny seeded random generator, so the same seed always deals the
// same orders and the screenshots are reproducible.

/** mulberry32: a small deterministic PRNG. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A seed from the URL (?seed=) or the clock, for real play. */
export function seedFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const seed = Number(params.get('seed'));
  return Number.isFinite(seed) && seed > 0 ? Math.floor(seed) : (Date.now() % 2147483647);
}
