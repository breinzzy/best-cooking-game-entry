// DAPUR KILAT — shots.js
// One job: the screenshot scenes behind ?shot=cover|rush|serve|end. Each scene
// sets the real kitchen state directly — real orders, a real wok mid-cook, a real
// plate — so every screenshot is a true render of the game's own code, and the
// same seed always gives the same frame. No title overlay ever covers a shot:
// the cover must show the whole game at a glance.

import { DISH_BY_ID } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, startDay } from './kitchen.js';

function ticket(id, dishId, patience, patienceMax) {
  return { id, dishId, patience, patienceMax, born: 0 };
}

/** Set `k` to the named scene and return the screen to draw. */
export function stageShot(name, k) {
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
      ticket(1, 'nasgor', 8, 42),
      ticket(2, 'miegor', 13, 38),
      ticket(3, 'ayamkecap', 21, 40),
    ];
    k.board.served = 9;
    k.wok = ['mie', 'telur', 'sayur', 'sambal'];
    k.cooking = true;
    k.cook = 0.85;
    k.dishReady = 'miegor';
    k.plate = 'telurbalado';
    k.steam = [
      { x: 250, y: 290, r: 9, life: 0.9 },
      { x: 290, y: 270, r: 12, life: 0.7 },
      { x: 320, y: 300, r: 7, life: 0.8 },
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
      ticket(1, 'nasgor', 30, 48),
      ticket(2, 'ayamkecap', 22, 44),
    ];
    k.board.served = 5;
    // The Mie Goreng ticket was just served (its +150 floats above the now
    // empty plate); the next dish is already in the wok.
    k.wok = ['nasi', 'telur'];
    k.cooking = true;
    k.cook = 0.35;
    k.plate = null;
    k.serveFlash = 1;
    k.lastServe = { dish: DISH_BY_ID.miegor, price: 110, tip: 40, total: 150, fraction: 0.8, comboBonus: 30, combo: 4 };
    k.floats = [
      { x: 880, y: 260, text: '+150', color: '#2f8f3e', life: 1.4 },
      { x: 880, y: 296, text: 'KOMBO x4!', color: '#e07840', life: 1.4 },
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
    k.board.orders = [ticket(1, 'nasgor', 20, 40)];
    k.board.served = 12;
    k.board.missed = 1;
    k.screen = SCREEN_OVER;
    return SCREEN_OVER;
  }
  // cover (default): the whole game in one glance — board, counter, wok
  // mid-assembly, timer, and a plate ready to serve.
  k.elapsed = 26;
  k.timeLeft = 154;
  k.coins = 340;
  k.combo = 3;
  k.bestCombo = 3;
  k.board.orders = [
    ticket(1, 'nasgor', 30, 48),
    ticket(2, 'miegor', 18, 40),
    ticket(3, 'ayamkecap', 34, 44),
  ];
  k.board.served = 3;
  k.wok = ['nasi', 'telur', 'ayam'];
  k.cooking = true;
  k.cook = 0.55;
  k.plate = 'nasgor';
  k.steam = [
    { x: 250, y: 295, r: 8, life: 0.9 },
    { x: 285, y: 280, r: 11, life: 0.7 },
  ];
  return SCREEN_PLAY;
}
