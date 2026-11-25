// LANTERN NOODLE — kitchen.js
// One job: the kitchen state — the bowl, the pass, the coins, the combo, the
// shift clock and the hearts. It takes player actions, advances time, and reports
// events; it never draws and never reads input.


const SCREEN_TITLE = 'title';
const SCREEN_PLAY = 'play';
const SCREEN_OVER = 'over';

/** A brand-new kitchen, on the title screen. */
function createKitchen(rng) {
  return {
    rng,
    screen: SCREEN_TITLE,
    board: createOrderBoard(rng),
    bowl: [],            // ingredient ids in the bowl, in add order
    cook: 0,            // 0..1 while cooking; past 1 the bowl overcooks
    cooking: false,
    burnt: false,
    dishReady: null,    // dish id the bowl holds once cooked, else null
    pass: null,        // dish id sitting on the serving counter
    coins: 0,
    combo: 0,
    bestCombo: 0,
    hearts: MAX_HEARTS,
    elapsed: 0,         // seconds into the shift
    timeLeft: SHIFT_SECONDS,
    rush: false,
    floats: [],         // {x, y, text, color, life}
    steam: [],          // {x, y, r, life} particles above the bowl
    shake: 0,           // bowl shake timer after a stir
    lastServe: null,    // the last payment, for the serve flash
    serveFlash: 0,
  };
}

/** Start (or restart) a shift: empty bowl and pass, fresh board, full hearts. */
function startDay(k) {
  k.screen = SCREEN_PLAY;
  k.bowl = [];
  k.cook = 0;
  k.cooking = false;
  k.burnt = false;
  k.dishReady = null;
  k.pass = null;
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

/** Drop an ingredient into the bowl. Returns false when the bowl is full or burnt. */
function addIngredient(k, id) {
  if (k.screen !== SCREEN_PLAY || k.burnt) return false;
  if (!INGREDIENT_BY_ID[id] || k.bowl.length >= BOWL_SLOTS) return false;
  k.bowl.push(id);
  k.cooking = true;
  sfx.pop();
  if (k.cooking && !k.dishReady) startSizzle();
  return true;
}

/** Stir: cooking jumps ahead, the bowl shakes, and burning is held off a touch. */
function stirBowl(k) {
  if (k.screen !== SCREEN_PLAY || !k.cooking || k.burnt || k.dishReady) return false;
  k.cook += 0.09;
  k.shake = 0.22;
  sfx.stir();
  return true;
}

/** Pour a cooked bowl onto the pass. Returns false unless a dish is ready. */
function pourToPass(k) {
  if (k.screen !== SCREEN_PLAY || !k.dishReady || k.pass) return false;
  k.pass = k.dishReady;
  k.dishReady = null;
  k.bowl = [];
  k.cook = 0;
  k.cooking = false;
  stopSizzle();
  sfx.pass();
  return true;
}

/** Throw the bowl's contents away (and clear a burnt bowl). */
function trashBowl(k) {
  if (k.screen !== SCREEN_PLAY || k.bowl.length === 0) return false;
  k.bowl = [];
  k.cook = 0;
  k.cooking = false;
  k.burnt = false;
  k.dishReady = null;
  stopSizzle();
  sfx.click();
  return true;
}

/** Clear the pass without serving. */
function trashPass(k) {
  if (k.screen !== SCREEN_PLAY || !k.pass) return false;
  k.pass = null;
  sfx.click();
  return true;
}

/**
 * Serve the plated dish. A matching ticket pays price + tip and grows the combo;
 * with no matching ticket the dish is refused, the combo breaks and a heart is
 * not lost — the customer just waits. Returns the payment or null.
 */
function servePass(k) {
  if (k.screen !== SCREEN_PLAY || !k.pass) return null;
  const dishId = k.pass;
  const pay = serveOrder(k.board, dishId);
  k.pass = null;
  if (!pay) {
    k.combo = 0;
    addFloat(k, 880, 300, 'NO ONE ORDERED THAT!', '#d9392b');
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
  if (comboBonus > 0) addFloat(k, 880, 336, `COMBO x${k.combo}!`, '#e07840');
  sfx.coin();
  return pay;
}

/** Lose a heart when a customer walks out; the day ends at zero hearts. */
function loseHeart(k, order) {
  k.hearts -= 1;
  k.combo = 0;
  addFloat(k, 640, 130, `${DISH_BY_ID[order.dishId].name} WALKED OUT!`, '#d9392b');
  sfx.buzz();
  if (k.hearts <= 0) endDay(k);
}

function endDay(k) {
  k.screen = SCREEN_OVER;
  stopSizzle();
  sfx.fanfare();
}

/** Advance the kitchen by `dt` seconds (real play only). */
function tickKitchen(k, dt) {
  if (k.screen !== SCREEN_PLAY) return;
  k.elapsed += dt;
  k.timeLeft = Math.max(0, SHIFT_SECONDS - k.elapsed);
  k.rush = k.timeLeft <= 45;

  // Cooking: the bowl fills its progress from the dish's own cook time.
  if (k.cooking && !k.burnt) {
    const dish = matchDish(k.bowl);
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
      addFloat(k, 260, 300, 'BURNT! TRASH IT!', '#d9392b');
      sfx.buzz();
    }
  }

  // Steam particles above a cooking bowl.
  if (k.cooking && !k.burnt && k.rng() < 0.35) {
    k.steam.push({ x: 260 + (k.rng() - 0.5) * 90, y: 300, r: 5 + k.rng() * 7, life: 1 });
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
