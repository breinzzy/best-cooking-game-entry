// DAPUR KILAT — kitchen.js
// One job: the kitchen state — the wok, the plate, the coins, the combo, the
// shift clock and the hearts. It takes player actions, advances time, and reports
// events; it never draws and never reads input.

import {
  BURN_AFTER, DISH_BY_ID, INGREDIENT_BY_ID, MAX_HEARTS, SHIFT_SECONDS,
  WOK_SLOTS, matchDish,
} from './config.js';
import { createOrderBoard, resetBoard, serveOrder, tickBoard } from './orders.js';
import { sfx, startSizzle, stopSizzle } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

/** A brand-new kitchen, on the title screen. */
export function createKitchen(rng) {
  return {
    rng,
    screen: SCREEN_TITLE,
    board: createOrderBoard(rng),
    wok: [],            // ingredient ids in the wok, in add order
    cook: 0,            // 0..1 while cooking; past 1 the wok overcooks
    cooking: false,
    burnt: false,
    dishReady: null,    // dish id the wok holds once cooked, else null
    plate: null,        // dish id sitting on the serving counter
    coins: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    elapsed: 0,         // seconds into the shift
    timeLeft: SHIFT_SECONDS,
    rush: false,
    floats: [],         // {x, y, text, color, life}
    steam: [],          // {x, y, r, life} particles above the wok
    shake: 0,           // wok shake timer after a stir
    lastServe: null,    // the last payment, for the serve flash
    serveFlash: 0,
  };
}

/** Start (or restart) a shift: empty wok and plate, fresh board, full hearts. */
export function startDay(k) {
  k.screen = SCREEN_PLAY;
  k.wok = [];
  k.cook = 0;
  k.cooking = false;
  k.burnt = false;
  k.dishReady = null;
  k.plate = null;
  k.coins = 0;
  k.combo = 0;
  k.bestCombo = 0;
  k.hearts = MAX_HEARTS;
  k.elapsed = 0;
  k.timeLeft = SHIFT_SECONDS;
  k.rush = false;
  k.floats = [];
  k.steam = [];
  k.lastServe = null;
  k.serveFlash = 0;
  resetBoard(k.board, 0);
}

function addFloat(k, x, y, text, color) {
  k.floats.push({ x, y, text, color, life: 1.4 });
}

/** Drop an ingredient into the wok. Returns false when the wok is full or burnt. */
export function addIngredient(k, id) {
  if (k.screen !== SCREEN_PLAY || k.burnt) return false;
  if (!INGREDIENT_BY_ID[id] || k.wok.length >= WOK_SLOTS) return false;
  k.wok.push(id);
  k.cooking = true;
  sfx.pop();
  if (k.cooking && !k.dishReady) startSizzle();
  return true;
}

/** Stir: cooking jumps ahead, the wok shakes, and burning is held off a touch. */
export function stirWok(k) {
  if (k.screen !== SCREEN_PLAY || !k.cooking || k.burnt || k.dishReady) return false;
  k.cook += 0.09;
  k.shake = 0.22;
  sfx.stir();
  return true;
}

/** Pour a cooked wok onto the plate. Returns false unless a dish is ready. */
export function pourToPlate(k) {
  if (k.screen !== SCREEN_PLAY || !k.dishReady || k.plate) return false;
  k.plate = k.dishReady;
  k.dishReady = null;
  k.wok = [];
  k.cook = 0;
  k.cooking = false;
  stopSizzle();
  sfx.plate();
  return true;
}

/** Throw the wok's contents away (and clear a burnt wok). */
export function trashWok(k) {
  if (k.screen !== SCREEN_PLAY || k.wok.length === 0) return false;
  k.wok = [];
  k.cook = 0;
  k.cooking = false;
  k.burnt = false;
  k.dishReady = null;
  stopSizzle();
  sfx.click();
  return true;
}

/** Clear the plate without serving. */
export function trashPlate(k) {
  if (k.screen !== SCREEN_PLAY || !k.plate) return false;
  k.plate = null;
  sfx.click();
  return true;
}

/**
 * Serve the plated dish. A matching ticket pays price + tip and grows the combo;
 * with no matching ticket the dish is refused, the combo breaks and a heart is
 * not lost — the customer just waits. Returns the payment or null.
 */
export function servePlate(k) {
  if (k.screen !== SCREEN_PLAY || !k.plate) return null;
  const dishId = k.plate;
  const pay = serveOrder(k.board, dishId);
  k.plate = null;
  if (!pay) {
    k.combo = 0;
    addFloat(k, 880, 300, 'TIDAK ADA YANG PESAN!', '#d9392b');
    sfx.buzz();
    return null;
  }
  k.combo += 1;
  k.bestCombo = Math.max(k.bestCombo, k.combo);
  const comboBonus = (k.combo - 1) * 10;
  k.coins += pay.total + comboBonus;
  k.lastServe = { ...pay, comboBonus, combo: k.combo };
  k.serveFlash = 0.9;
  addFloat(k, 880, 300, `+${pay.total + comboBonus}`, '#2f8f3e');
  if (comboBonus > 0) addFloat(k, 880, 336, `KOMBO x${k.combo}!`, '#e07840');
  sfx.coin();
  return pay;
}

/** Lose a heart when a customer walks out; the day ends at zero hearts. */
function loseHeart(k, order) {
  k.hearts -= 1;
  k.combo = 0;
  addFloat(k, 640, 130, `${DISH_BY_ID[order.dishId].name} DITINGGAL!`, '#d9392b');
  sfx.buzz();
  if (k.hearts <= 0) endDay(k);
}

function endDay(k) {
  k.screen = SCREEN_OVER;
  stopSizzle();
  sfx.fanfare();
}

/** Advance the kitchen by `dt` seconds (real play only). */
export function tickKitchen(k, dt) {
  if (k.screen !== SCREEN_PLAY) return;
  k.elapsed += dt;
  k.timeLeft = Math.max(0, SHIFT_SECONDS - k.elapsed);
  k.rush = k.timeLeft <= 45;

  // Cooking: the wok fills its progress from the dish's own cook time.
  if (k.cooking && !k.burnt) {
    const dish = matchDish(k.wok);
    const cookTime = dish ? dish.cook : 6;
    k.cook += dt / cookTime;
    if (k.cook >= 1 && !k.dishReady) {
      k.dishReady = dish ? dish.id : 'acak';
      if (dish) sfx.ding();
    }
    if (k.cook >= BURN_AFTER) {
      k.burnt = true;
      k.dishReady = null;
      stopSizzle();
      addFloat(k, 320, 300, 'GOSONG! BUANG!', '#d9392b');
      sfx.buzz();
    }
  }

  // Steam particles above a cooking wok.
  if (k.cooking && !k.burnt && k.rng() < 0.35) {
    k.steam.push({ x: 300 + (k.rng() - 0.5) * 90, y: 300, r: 5 + k.rng() * 7, life: 1 });
  }
  for (const p of k.steam) {
    p.y -= dt * 46;
    p.r += dt * 9;
    p.life -= dt * 0.9;
  }
  k.steam = k.steam.filter((p) => p.life > 0);

  for (const f of k.floats) {
    f.y -= dt * 34;
    f.life -= dt;
  }
  k.floats = k.floats.filter((f) => f.life > 0);
  if (k.shake > 0) k.shake -= dt;
  if (k.serveFlash > 0) k.serveFlash -= dt;

  const expired = tickBoard(k.board, dt, k.elapsed);
  for (const order of expired) loseHeart(k, order);
  if (k.screen === SCREEN_PLAY && k.timeLeft <= 0) endDay(k);
}
