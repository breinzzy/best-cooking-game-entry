// LANTERN NOODLE — config.js
// One job: every number, name and recipe the game uses. No drawing, no input here,
// so tuning the game means editing this file only.

const VIEW = { width: 1280, height: 720 };

// Seven ingredients on the counter. `key` is the keyboard shortcut, `color` is the
// bin's accent, `icon` names the vector drawing in icons.js.
const INGREDIENTS = [
  { id: 'kuah',   name: 'Broth',   key: '1', color: '#e8912d', icon: 'kuah' },
  { id: 'mie',    name: 'Noodles',    key: '2', color: '#f7c948', icon: 'mie' },
  { id: 'ayam',   name: 'Chicken',   key: '3', color: '#e07840', icon: 'ayam' },
  { id: 'telur',  name: 'Egg',  key: '4', color: '#fff3c4', icon: 'telur' },
  { id: 'sayur',  name: 'Greens',  key: '5', color: '#58b368', icon: 'sayur' },
  { id: 'sambal', name: 'Chilli', key: '6', color: '#d9392b', icon: 'sambal' },
  { id: 'kecap',  name: 'Soy Sauce',  key: '7', color: '#4a2c1a', icon: 'kecap' },
];
const INGREDIENT_BY_ID = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i]));

// Four noodle-stall dishes. `needs` lists the ingredients, in the order the ticket
// shows them; a bowl that holds exactly these (no more, no less) simmers into this dish.
const DISHES = [
  { id: 'mieayam', name: 'Chicken Noodles',  needs: ['kuah', 'mie', 'ayam', 'sayur'],  price: 120, cook: 6, color: '#e07840' },
  { id: 'laksa',   name: 'Spicy Laksa', needs: ['kuah', 'mie', 'telur', 'sambal'], price: 110, cook: 6, color: '#d9392b' },
  { id: 'miegor',  name: 'Fried Noodles', needs: ['mie', 'telur', 'ayam', 'kecap'], price: 100, cook: 5, color: '#f7c948' },
  { id: 'miebalado', name: 'Balado Noodles', needs: ['mie', 'telur', 'sambal', 'sayur'], price: 90, cook: 5, color: '#c0392b' },
];
const DISH_BY_ID = Object.fromEntries(DISHES.map((d) => [d.id, d]));

// A bowl whose mix matches no recipe simmers into this mess: nobody ordered it,
// serving it is refused, so the player learns to follow the tickets.
const MESS_DISH = { id: 'acak', name: 'Random Mix', needs: [], price: 0, cook: 6, color: '#8a8a8a' };
function dishById(id) {
  return DISH_BY_ID[id] ?? (id === 'acak' ? MESS_DISH : null);
}

/** Find the dish whose ingredient set matches `ids` exactly (order-free). */
function matchDish(ids) {
  const sorted = [...ids].sort().join(',');
  return DISHES.find((d) => [...d.needs].sort().join(',') === sorted) ?? null;
}

// Shift and difficulty. Orders arrive faster and lose patience sooner as the day
// goes on; `rushAt` marks the last-minute service rush.
const SHIFT_SECONDS = 180;
const MAX_ORDERS = 3;
const MAX_HEARTS = 3;
const BOWL_SLOTS = 5;
const BURN_AFTER = 1.35; // simmered past 135% and the bowl burns
const ORDER = {
  patienceStart: 55,
  patienceMin: 30,
  spawnStart: 14,
  spawnMin: 7,
  rushAt: 45, // seconds left when the rush starts
};

/** Patience (seconds) for an order spawned with `elapsed` seconds gone. */
function patienceFor(elapsed) {
  const t = Math.min(1, elapsed / SHIFT_SECONDS);
  return ORDER.patienceStart - (ORDER.patienceStart - ORDER.patienceMin) * t;
}

/** Seconds between order spawns with `elapsed` seconds gone. */
function spawnEveryFor(elapsed) {
  const t = Math.min(1, elapsed / SHIFT_SECONDS);
  const base = ORDER.spawnStart - (ORDER.spawnStart - ORDER.spawnMin) * t;
  return elapsed > SHIFT_SECONDS - ORDER.rushAt ? base * 0.6 : base;
}

/** Tip for serving with `fraction` of patience left: up to +50%. */
function tipFor(price, fraction) {
  return Math.round(price * 0.5 * Math.max(0, fraction));
}

/** Stars (0-3) for a finished day. */
function starsFor(served, missed) {
  if (served >= 14 && missed === 0) return 3;
  if (served >= 10) return 2;
  if (served >= 6) return 1;
  return 0;
}
