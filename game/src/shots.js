// LANTERN NOODLE — shots.js
// One job: the screenshot scenes behind ?shot=cover|rush|serve|title|gameplay|end. Each scene
// sets the real kitchen state directly — real orders, a real bowl mid-simmer, a
// real pass shelf — so every screenshot is a true render of the game's own code,
// and the same seed always gives the same frame. No title overlay ever covers a
// shot: the cover must show the whole game at a glance.


function ticket(id, dishId, patience, patienceMax) {
  return { id, dishId, patience, patienceMax, born: 0, customer: customerByIndex(id) };
}

/** Set `k` to the named scene and return the screen to draw. */
function stageShot(name, k) {
  startDay(k);
  k.screen = SCREEN_PLAY;
  if (name === 'rush') {
    k.elapsed = 132;
    k.timeLeft = 48;
    k.rush = true;
    k.coins = 720;
    k.combo = 5;
    k.bestCombo = 5;
    k.board.orders = [
      ticket(1, 'mieayam', 8, 42),
      ticket(2, 'laksa', 13, 38),
      ticket(3, 'miegor', 21, 40),
    ];
    k.board.served = 9;
    k.bowl = ['mie', 'telur', 'sayur', 'sambal'];
    k.cooking = true;
    k.cook = 0.85;
    k.dishReady = 'miebalado';
    k.pass = 'miegor';
    k.steam = [
      { x: 230, y: 290, r: 9, life: 0.9 },
      { x: 270, y: 270, r: 12, life: 0.7 },
      { x: 300, y: 300, r: 7, life: 0.8 },
    ];
    return SCREEN_PLAY;
  }
  if (name === 'serve') {
    k.elapsed = 61;
    k.timeLeft = 119;
    k.coins = 490;
    k.combo = 4;
    k.bestCombo = 4;
    k.board.orders = [
      ticket(1, 'mieayam', 30, 48),
      ticket(2, 'miegor', 22, 44),
    ];
    k.board.served = 5;
    // The Fried Noodles ticket was just served (its +140 floats above the now
    // empty pass shelf); the next dish is already in the bowl.
    k.bowl = ['kuah', 'mie'];
    k.cooking = true;
    k.cook = 0.35;
    k.pass = null;
    k.serveFlash = 1;
    k.lastServe = { dish: DISH_BY_ID.miegor, price: 100, tip: 40, total: 140, fraction: 0.8, comboBonus: 30, combo: 4 };
    k.floats = [
      { x: 880, y: 260, text: '+140', color: '#2f8f3e', life: 1.4 },
      { x: 880, y: 296, text: 'COMBO x4!', color: '#e07840', life: 1.4 },
    ];
    return SCREEN_PLAY;
  }
  if (name === 'title') {
    // The title screen over a living kitchen: orders on the board, a bowl
    // mid-simmer behind the panel.
    k.elapsed = 40;
    k.timeLeft = 140;
    k.coins = 210;
    k.combo = 2;
    k.bestCombo = 2;
    k.board.orders = [
      ticket(1, 'mieayam', 32, 48),
      ticket(2, 'laksa', 20, 40),
    ];
    k.board.served = 2;
    k.bowl = ['kuah', 'mie'];
    k.cooking = true;
    k.cook = 0.4;
    k.screen = SCREEN_TITLE;
    return SCREEN_TITLE;
  }
  if (name === 'gameplay') {
    // A different moment from the cover: early in the shift, an early bowl
    // (just the broth, 1/4), two fresh tickets, different customers, no pass yet.
    k.elapsed = 12;
    k.timeLeft = 168;
    k.coins = 60;
    k.combo = 0;
    k.bestCombo = 0;
    k.board.orders = [
      ticket(4, 'laksa', 40, 44),
      ticket(5, 'miebalado', 30, 38),
    ];
    k.board.served = 0;
    k.bowl = ['kuah'];
    k.cooking = true;
    k.cook = 0.15;
    k.steam = [
      { x: 240, y: 295, r: 7, life: 0.9 },
      { x: 275, y: 285, r: 9, life: 0.7 },
    ];
    return SCREEN_PLAY;
  }
  if (name === 'end') {
    k.elapsed = 180;
    k.timeLeft = 0;
    k.coins = 1240;
    k.combo = 0;
    k.bestCombo = 5;
    k.hearts = 2;
    k.board.orders = [ticket(1, 'mieayam', 20, 40)];
    k.board.served = 12;
    k.board.missed = 1;
    k.screen = SCREEN_OVER;
    return SCREEN_OVER;
  }
  // cover (default): the whole game in one glance — board, counter, bowl
  // mid-assembly, timer, and a pass shelf ready to serve.
  k.elapsed = 26;
  k.timeLeft = 154;
  k.coins = 340;
  k.combo = 3;
  k.bestCombo = 3;
  k.board.orders = [
    ticket(1, 'mieayam', 30, 48),
    ticket(2, 'laksa', 18, 40),
    ticket(3, 'miegor', 34, 44),
  ];
  k.board.served = 3;
  k.bowl = ['kuah', 'mie', 'ayam'];
  k.cooking = true;
  k.cook = 0.55;
  k.pass = 'mieayam';
  k.steam = [
    { x: 230, y: 295, r: 8, life: 0.9 },
    { x: 265, y: 280, r: 11, life: 0.7 },
  ];
  return SCREEN_PLAY;
}
