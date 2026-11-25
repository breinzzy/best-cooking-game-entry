// DAPUR KILAT — main.js
// One job: run the game — the animation loop, the screen state, the best score,
// and the wiring between input, kitchen and render. Screenshot mode (?shot=)
// stages a fixed scene and freezes it: no ticking, no title screen.

import { VIEW } from './config.js';
import { createKitchen, startDay, addIngredient, stirWok, pourToPlate, servePlate, trashWok, trashPlate, tickKitchen, SCREEN_TITLE, SCREEN_OVER } from './kitchen.js';
import { drawGame } from './render.js';
import { createInput } from './input.js';
import { mulberry32, seedFromLocation } from './random.js';
import { stageShot } from './shots.js';
import { sfx, setMuted, isMuted, unlockAudio, stopSizzle } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
const rng = mulberry32(shotName ? 1 : seedFromLocation());
const kitchen = createKitchen(rng);

let best = 0;
try {
  best = Number(localStorage.getItem('dapur-kilat-best') ?? 0) || 0;
} catch { /* private mode: no best score */ }

let paused = false;
let last = performance.now();

function saveBest() {
  if (kitchen.coins > best) {
    best = kitchen.coins;
    try {
      localStorage.setItem('dapur-kilat-best', String(best));
    } catch { /* ignore */ }
  }
}

function announce() {
  if (!statusEl) return;
  statusEl.textContent = kitchen.screen === SCREEN_TITLE
    ? 'Dapur Kilat: tekan untuk mulai memasak.'
    : `Koin ${kitchen.coins}, kombo x${kitchen.combo}, waktu ${Math.ceil(kitchen.timeLeft)} detik, ${kitchen.board.orders.length} pesanan.`;
}

const actions = {
  addIngredient(id) {
    unlockAudio();
    if (kitchen.screen !== 'play') return;
    addIngredient(kitchen, id);
    announce();
  },
  stir() {
    unlockAudio();
    if (kitchen.screen !== 'play') return;
    stirWok(kitchen);
  },
  pour() {
    unlockAudio();
    if (kitchen.screen !== 'play') return;
    if (pourToPlate(kitchen)) announce();
  },
  serve() {
    unlockAudio();
    if (kitchen.screen !== 'play') return;
    if (servePlate(kitchen)) announce();
  },
  trashWok() {
    if (kitchen.screen !== 'play') return;
    trashWok(kitchen);
  },
  trashPlate() {
    if (kitchen.screen !== 'play') return;
    trashPlate(kitchen);
  },
  toggleMute() {
    setMuted(!isMuted());
  },
  togglePause() {
    if (kitchen.screen !== 'play') return;
    paused = !paused;
    if (paused) stopSizzle();
    sfx.click();
  },
  start() {
    unlockAudio();
    startDay(kitchen);
    paused = false;
    sfx.click();
    announce();
  },
  restart() {
    unlockAudio();
    saveBest();
    startDay(kitchen);
    paused = false;
    sfx.click();
    announce();
  },
  /** Enter: start on the title screen, restart when over, else pour then serve. */
  enter() {
    unlockAudio();
    if (kitchen.screen === SCREEN_TITLE) actions.start();
    else if (kitchen.screen === SCREEN_OVER) actions.restart();
    else if (kitchen.screen === 'play') {
      if (kitchen.dishReady && !kitchen.plate) pourToPlate(kitchen);
      else if (kitchen.plate) servePlate(kitchen);
      announce();
    }
  },
};

createInput(canvas, actions);

// Screenshot mode: stage the scene once and draw it frozen, so the capture is
// exactly the staged frame (the loop still runs for the flame and steam, but
// the kitchen state never advances).
if (shotName) {
  stageShot(shotName, kitchen);
  paused = true;
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!paused && kitchen.screen === 'play' && !shotName) {
    tickKitchen(kitchen, dt);
    if (kitchen.screen === SCREEN_OVER) saveBest();
  }
  // Keep the canvas at the game's own resolution; CSS scales it to the window.
  if (canvas.width !== VIEW.width) canvas.width = VIEW.width;
  if (canvas.height !== VIEW.height) canvas.height = VIEW.height;
  drawGame(ctx, kitchen, now, best, paused && !shotName);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
announce();
