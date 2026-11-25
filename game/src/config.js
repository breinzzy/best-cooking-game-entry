// DAPUR KILAT — config.js
// One job: every number, name and recipe the game uses. No drawing, no input here,
// so tuning the game means editing this file only.

export const VIEW = { width: 1280, height: 720 };

// Seven ingredients on the counter. `key` is the keyboard shortcut, `color` is the
// bin's accent, `icon` names the vector drawing in icons.js.
export const INGREDIENTS = [
  { id: 'nasi',   name: 'Nasi',   key: '1', color: '#f5ead2', icon: 'nasi' },
  { id: 'mie',    name: 'Mie',    key: '2', color: '#f7c948', icon: 'mie' },
  { id: 'ayam',   name: 'Ayam',   key: '3', color: '#e07840', icon: 'ayam' },
  { id: 'telur',  name: 'Telur',  key: '4', color: '#fff3c4', icon: 'telur' },
  { id: 'sayur',  name: 'Sayur',  key: '5', color: '#58b368', icon: 'sayur' },
  { id: 'sambal', name: 'Sambal', key: '6', color: '#d9392b', icon: 'sambal' },
  { id: 'kecap',  name: 'Kecap',  key: '7', color: '#4a2c1a', icon: 'kecap' },
];
export const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// Four warung dishes. `needs` lists the ingredients, in the order the ticket shows
// them; a wok that holds exactly these (no more, no less) cooks into this dish.
export const DISHES = [
  { id: 'nasgor', name: 'Nasi Goreng', needs: ['nasi', 'telur', 'ayam', 'kecap'], price: 120, cook: 6, color: '#e07840' },
  { id: 'miegor', name: 'Mie Goreng',  needs: ['mie', 'telur', 'sayur', 'sambal'], price: 110, cook: 6, color: '#f7c948' },
  { id: 'ayamkecap', name: 'Ayam Kecap', needs: ['ayam', 'kecap', 'sayur'],      price: 100, cook: 5, color: '#8a5a2b' },
  { id: 'telurbalado', name: 'Telur Balado', needs: ['telur', 'sambal', 'sayur'], price: 90, cook: 5, color: '#d9392b' },
];
export const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

// A wok whose mix matches no recipe cooks into this mess: nobody ordered it,
// serving it is refused, so the player learns to follow the tickets.
export const MESS_DISH = { id: 'acak', name: 'Campuran Acak', needs: [], price: 0, cook: 6, color: '#8a8a8a' };
export function dishById(id) {
  return DISH_BY_ID[id] ?? (id === 'acak' ? MESS_DISH : null);
}

/** Find the dish whose ingredient set matches `ids` exactly (order-free). */
export function matchDish(ids) {
  const sorted = [...ids].sort().join(',');
  return DISHES.find((d) => [...d.needs].sort().join(',') === sorted) ?? null;
}

// Shift and difficulty. Orders arrive faster and lose patience sooner as the day
// goes on; `rushAt` marks the last-minute service rush.
export const SHIFT_SECONDS = 180;
export const MAX_ORDERS = 3;
export const MAX_HEARTS = 3;
export const WOK_SLOTS = 5;
export const BURN_AFTER = 1.35; // cooked past 135% and the wok burns
export const ORDER = {
  patienceStart: 55,
  patienceMin: 30,
  spawnStart: 14,
  spawnMin: 7,
  rushAt: 45, // seconds left when the rush starts
};

/** Patience (seconds) for an order spawned with `elapsed` seconds gone. */
export function patienceFor(elapsed) {
  const t = Math.min(1, elapsed / SHIFT_SECONDS);
  return ORDER.patienceStart - (ORDER.patienceStart - ORDER.patienceMin) * t;
}

/** Seconds between order spawns with `elapsed` seconds gone. */
export function spawnEveryFor(elapsed) {
  const t = Math.min(1, elapsed / SHIFT_SECONDS);
  const base = ORDER.spawnStart - (ORDER.spawnStart - ORDER.spawnMin) * t;
  return elapsed > SHIFT_SECONDS - ORDER.rushAt ? base * 0.6 : base;
}

/** Tip for serving with `fraction` of patience left: up to +50%. */
export function tipFor(price, fraction) {
  return Math.round(price * 0.5 * Math.max(0, fraction));
}

/** Stars (0-3) for a finished day. */
export function starsFor(served, missed) {
  if (served >= 14 && missed === 0) return 3;
  if (served >= 10) return 2;
  if (served >= 6) return 1;
  return 0;
}
