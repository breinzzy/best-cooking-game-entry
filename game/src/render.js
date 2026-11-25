// DAPUR KILAT — render.js
// One job: draw the whole game on the canvas — the kitchen, the order board, the
// wok, the plate, the ingredient counter and the title / game-over panels — and
// remember where the clickable things are, so input.js can hit-test them.
// Layout is fixed at 1280x720 (VIEW) and scaled to the window by main.js.

import { DISH_BY_ID, INGREDIENTS, dishById } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './kitchen.js';
import { drawDish, drawIcon } from './icons.js';
import { isMuted } from './audio.js';

export const HIT = {
  wok: 'wok', tuang: 'tuang', plate: 'plate', sajikan: 'sajikan',
  buangWok: 'buang-wok', buangPiring: 'buang-piring',
  mute: 'mute', pause: 'pause', start: 'start', again: 'again',
};

let hitAreas = [];
/** The clickable rects from the last frame: [{id, x, y, w, h}]. */
export function getHitAreas() {
  return hitAreas;
}

const INK = '#2b1c10';
const CREAM = '#fff6e0';
const WOOD = '#8a5a2b';
const WOOD_DARK = '#6b4423';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, str, x, y, size, color, weight = 'bold', align = 'left', baseline = 'middle') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(str, x, y);
}

function bar(ctx, x, y, w, h, frac, color) {
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  if (frac > 0) {
    ctx.fillStyle = color;
    rr(ctx, x, y, Math.max(h, w * Math.min(1, frac)), h, h / 2);
    ctx.fill();
  }
}

function patienceColor(frac) {
  if (frac > 0.5) return '#58b368';
  if (frac > 0.25) return '#f7c948';
  return '#d9392b';
}

function fmtTime(seconds) {
  const s = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function drawWall(ctx) {
  ctx.fillStyle = '#f3dfb8';
  ctx.fillRect(0, 0, 1280, 720);
  // Tile lines on the wall.
  ctx.strokeStyle = 'rgba(139,90,43,0.16)';
  ctx.lineWidth = 2;
  for (let y = 64; y < 480; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }
  for (let x = 0; x < 1280; x += 96) {
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x, 480);
    ctx.stroke();
  }
  // Wooden floor.
  ctx.fillStyle = '#b5763f';
  ctx.fillRect(0, 480, 1280, 240);
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  for (let y = 528; y < 720; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }
  // Hanging sign.
  ctx.fillStyle = '#2b1c10';
  rr(ctx, 500, 66, 280, 34, 8);
  ctx.fill();
  text(ctx, '★ WARUNG DAPUR KILAT ★', 640, 84, 20, '#f7c948', 'bold', 'center');
}

function drawHUD(ctx, k, best) {
  ctx.fillStyle = '#2b1c10';
  ctx.fillRect(0, 0, 1280, 60);
  text(ctx, 'DAPUR KILAT', 20, 22, 26, '#f7c948');
  text(ctx, 'Wok Rush', 20, 46, 14, '#f5ead2', 'normal');
  // Shift timer, big in the middle.
  const urgent = k.timeLeft <= 30;
  text(ctx, 'SHIFT', 560, 20, 13, '#c9b18a', 'bold', 'center');
  text(ctx, fmtTime(k.timeLeft), 560, 44, 30, urgent ? '#ff6b5e' : '#fff6e0', 'bold', 'center');
  if (k.rush && k.screen === SCREEN_PLAY) {
    text(ctx, 'JAM RAMAI!', 700, 30, 18, '#ff6b5e', 'bold', 'center');
  }
  text(ctx, `KOIN ${k.coins}`, 900, 30, 22, '#fff6e0', 'bold', 'center');
  if (k.combo >= 2) text(ctx, `KOMBO x${k.combo}`, 1040, 30, 22, '#f7c948', 'bold', 'center');
  // Hearts.
  for (let i = 0; i < 3; i += 1) {
    const x = 1130 + i * 30;
    ctx.fillStyle = i < k.hearts ? '#ff5e7a' : 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.arc(x, 26, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x - 9, 30);
    ctx.lineTo(x, 42);
    ctx.lineTo(x + 9, 30);
    ctx.closePath();
    ctx.fill();
  }
  // Mute / pause buttons.
  ctx.fillStyle = '#4a2c1a';
  rr(ctx, 1220, 12, 44, 36, 8);
  ctx.fill();
  text(ctx, isMuted() ? 'BISU' : 'SUARA', 1242, 31, 12, '#fff6e0', 'bold', 'center');
  hitAreas.push({ id: HIT.mute, x: 1220, y: 12, w: 44, h: 36 });
}

function drawOrderBoard(ctx, k) {
  text(ctx, 'PAPAN ORDER', 20, 118, 18, INK);
  const tickets = k.board.orders;
  for (let i = 0; i < 3; i += 1) {
    const x = 16 + i * 424;
    const y = 132;
    const w = 408;
    const h = 62;
    const order = tickets[i];
    ctx.fillStyle = order ? '#fffdf5' : 'rgba(255,253,245,0.45)';
    rr(ctx, x, y, w, h, 10);
    ctx.fill();
    ctx.strokeStyle = 'rgba(43,28,16,0.25)';
    ctx.lineWidth = 2;
    rr(ctx, x, y, w, h, 10);
    ctx.stroke();
    if (!order) {
      text(ctx, 'Menunggu pesanan…', x + 20, y + 32, 16, '#8a7a5f', 'normal');
      continue;
    }
    const dish = DISH_BY_ID[order.dishId];
    const frac = Math.max(0, order.patience / order.patienceMax);
    ctx.fillStyle = dish.color;
    rr(ctx, x, y, 10, h, 5);
    ctx.fill();
    text(ctx, dish.name, x + 24, y + 20, 19, INK);
    text(ctx, `Rp${dish.price}`, x + w - 16, y + 20, 17, '#2f8f3e', 'bold', 'right');
    dish.needs.forEach((id, j) => {
      drawIcon(ctx, id, x + 40 + j * 34, y + 46, 26);
    });
    text(ctx, '→', x + 24 + dish.needs.length * 34 + 8, y + 46, 18, INK, 'bold');
    bar(ctx, x + 200, y + 40, 180, 12, frac, patienceColor(frac));
    if (frac <= 0.25) text(ctx, 'CEPAT!', x + 200, y + 20, 13, '#d9392b', 'bold');
  }
}

function drawWok(ctx, k, now) {
  const cx = 260;
  const cy = 350;
  text(ctx, 'WOK  •  klik / Spasi = aduk', cx, 208, 17, INK, 'bold', 'center');
  // Flame under the wok.
  const flick = 1 + Math.sin(now / 90) * 0.08;
  ctx.fillStyle = '#e07840';
  ctx.beginPath();
  ctx.moveTo(cx - 70 * flick, cy + 78);
  ctx.quadraticCurveTo(cx - 30, cy + 30, cx, cy + 62);
  ctx.quadraticCurveTo(cx + 30, cy + 30, cx + 70 * flick, cy + 78);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7c948';
  ctx.beginPath();
  ctx.moveTo(cx - 40 * flick, cy + 78);
  ctx.quadraticCurveTo(cx - 15, cy + 48, cx, cy + 66);
  ctx.quadraticCurveTo(cx + 15, cy + 48, cx + 40 * flick, cy + 78);
  ctx.closePath();
  ctx.fill();
  // Wok body.
  const shakeX = k.shake > 0 ? Math.sin(now / 18) * 4 : 0;
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.arc(cx + shakeX, cy, 118, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#232323';
  ctx.beginPath();
  ctx.ellipse(cx + shakeX, cy - 6, 112, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  // Food inside the wok.
  if (k.wok.length) {
    const dish = k.dishReady ? dishById(k.dishReady) : null;
    if (dish && k.dishReady !== 'acak') {
      drawDish(ctx, dish, cx + shakeX, cy - 34, 92);
    } else {
      k.wok.forEach((id, i) => {
        const dx = (i - (k.wok.length - 1) / 2) * 40;
        drawIcon(ctx, id, cx + shakeX + dx, cy - 26, 44);
      });
    }
  }
  if (k.burnt) {
    text(ctx, 'GOSONG!', cx, cy - 58, 26, '#d9392b', 'bold', 'center');
    ctx.fillStyle = 'rgba(60,60,60,0.5)';
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(cx - 50 + i * 25, cy - 70 - (i % 2) * 14, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Cook progress ring (kept clear of the WOK label above it).
  if (k.cooking && !k.burnt) {
    const frac = Math.min(1, k.cook);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 124, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = k.dishReady ? '#58b368' : '#f7c948';
    ctx.beginPath();
    ctx.arc(cx, cy, 124, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
    // The percentage sits on the dark wok, so it gets a cream pill behind it.
    ctx.fillStyle = '#fff6e0';
    rr(ctx, cx - 48, cy + 78, 96, 30, 15);
    ctx.fill();
    text(ctx, k.dishReady ? 'SIAP!' : `${Math.round(frac * 100)}%`, cx, cy + 94, 20, k.dishReady ? '#2f8f3e' : INK, 'bold', 'center');
  }
  if (!k.wok.length) text(ctx, 'Wok kosong — klik bahan di bawah', cx, cy + 94, 15, '#fff6e0', 'normal', 'center');
  // Trash wok button.
  ctx.fillStyle = '#6b4423';
  rr(ctx, 150, 452, 220, 34, 8);
  ctx.fill();
  text(ctx, 'BUANG ISI WOK (Del)', 260, 470, 15, '#fff6e0', 'bold', 'center');
  hitAreas.push({ id: HIT.buangWok, x: 150, y: 452, w: 220, h: 34 });
  hitAreas.push({ id: HIT.wok, x: cx - 130, y: cy - 140, w: 260, h: 240 });
}

function drawTuang(ctx, k) {
  const x = 500;
  const y = 300;
  const ready = !!k.dishReady && !k.plate;
  ctx.fillStyle = ready ? '#2f8f3e' : '#9a8a76';
  rr(ctx, x, y, 120, 64, 10);
  ctx.fill();
  text(ctx, 'TUANG →', x + 60, y + 26, 20, '#fff6e0', 'bold', 'center');
  text(ctx, 'Enter', x + 60, y + 48, 13, '#fff6e0', 'normal', 'center');
  hitAreas.push({ id: HIT.tuang, x, y, w: 120, h: 64 });
}

function drawPlate(ctx, k) {
  const cx = 880;
  const cy = 350;
  text(ctx, 'PIRING SAJI', cx, 222, 17, INK, 'bold', 'center');
  // Serving counter.
  ctx.fillStyle = WOOD;
  rr(ctx, 700, 400, 360, 60, 10);
  ctx.fill();
  ctx.fillStyle = '#a9743f';
  ctx.fillRect(700, 400, 360, 12);
  if (k.serveFlash > 0) {
    ctx.strokeStyle = `rgba(88,179,104,${Math.min(1, k.serveFlash)})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 128, 0, Math.PI * 2);
    ctx.stroke();
  }
  // The plate itself.
  ctx.fillStyle = '#fffdf5';
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#d8c9a8';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 108, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 78, 0, Math.PI * 2);
  ctx.stroke();
  if (k.plate) {
    const dish = dishById(k.plate);
    drawDish(ctx, dish, cx, cy - 10, 110);
    // The name sits on the white plate itself, never under the serve button.
    text(ctx, dish.name, cx, cy + 74, 20, INK, 'bold', 'center');
  } else {
    text(ctx, 'Piring kosong', cx, cy, 16, '#8a7a5f', 'normal', 'center');
  }
  // Serve button.
  const ready = !!k.plate;
  ctx.fillStyle = ready ? '#2f8f3e' : '#9a8a76';
  rr(ctx, 760, 452, 240, 40, 10);
  ctx.fill();
  text(ctx, ready ? 'SAJIKAN! (Enter)' : 'SAJIKAN', 880, 473, 19, '#fff6e0', 'bold', 'center');
  hitAreas.push({ id: HIT.sajikan, x: 760, y: 452, w: 240, h: 40 });
  hitAreas.push({ id: HIT.plate, x: cx - 120, y: cy - 120, w: 240, h: 240 });
  // Trash plate.
  ctx.fillStyle = '#6b4423';
  rr(ctx, 1010, 452, 130, 34, 8);
  ctx.fill();
  text(ctx, 'BUANG', 1075, 470, 14, '#fff6e0', 'bold', 'center');
  hitAreas.push({ id: HIT.buangPiring, x: 1010, y: 452, w: 130, h: 34 });
}

function drawRecipes(ctx) {
  const x = 1150;
  const y = 204;
  ctx.fillStyle = 'rgba(255,253,245,0.9)';
  rr(ctx, x, y, 114, 292, 10);
  ctx.fill();
  text(ctx, 'RESEP', x + 57, y + 22, 15, INK, 'bold', 'center');
  const dishes = Object.values(DISH_BY_ID);
  dishes.forEach((dish, i) => {
    const yy = y + 48 + i * 60;
    text(ctx, dish.name, x + 57, yy, 12, INK, 'bold', 'center');
    dish.needs.forEach((id, j) => {
      drawIcon(ctx, id, x + 22 + j * 24, yy + 18, 20);
    });
    text(ctx, `Rp${dish.price}`, x + 57, yy + 42, 11, '#2f8f3e', 'bold', 'center');
  });
}

function drawBins(ctx, k) {
  text(ctx, 'BAHAN DI COUNTER  •  klik bahan (atau tekan 1–7) untuk masuk wajan', 20, 516, 17, INK, 'bold');
  const w = 160;
  const gap = 12;
  INGREDIENTS.forEach((ing, i) => {
    const x = 16 + i * (w + gap);
    const y = 528;
    const h = 118;
    const inWok = k.wok.filter((id) => id === ing.id).length;
    ctx.fillStyle = '#fffdf5';
    rr(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = 4;
    rr(ctx, x, y, w, h, 12);
    ctx.stroke();
    drawIcon(ctx, ing.icon, x + w / 2, y + 44, 62);
    text(ctx, ing.name, x + w / 2, y + 88, 18, INK, 'bold', 'center');
    // Key badge.
    ctx.fillStyle = INK;
    rr(ctx, x + 8, y + 8, 26, 26, 6);
    ctx.fill();
    text(ctx, ing.key, x + 21, y + 22, 15, '#fff6e0', 'bold', 'center');
    if (inWok > 0) {
      ctx.fillStyle = '#d9392b';
      ctx.beginPath();
      ctx.arc(x + w - 16, y + 16, 14, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, `x${inWok}`, x + w - 16, y + 17, 14, '#fff', 'bold', 'center');
    }
    hitAreas.push({ id: `ingredient:${ing.id}`, x, y, w, h });
  });
  text(ctx, 'Spasi = aduk  •  Enter = tuang / sajikan  •  Del = buang  •  P = jeda  •  M = suara', 640, 672, 15, '#5a4632', 'normal', 'center');
}

function drawFloats(ctx, k) {
  for (const f of k.floats) {
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
    text(ctx, f.text, f.x, f.y, 24, f.color, 'bold', 'center');
    ctx.globalAlpha = 1;
  }
}

function drawSteam(ctx, k) {
  for (const p of k.steam) {
    ctx.globalAlpha = Math.max(0, p.life * 0.35);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(43,28,16,0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = '#fff6e0';
  rr(ctx, x, y, w, h, 16);
  ctx.fill();
  ctx.strokeStyle = '#8a5a2b';
  ctx.lineWidth = 4;
  rr(ctx, x, y, w, h, 16);
  ctx.stroke();
}

function drawTitle(ctx, k, best) {
  panel(ctx, 290, 110, 700, 500);
  text(ctx, 'DAPUR KILAT', 640, 180, 64, '#d9392b', 'bold', 'center');
  text(ctx, '— Wok Rush —', 640, 226, 26, INK, 'bold', 'center');
  text(ctx, 'Warung masak cepat: baca pesanan, isi wajan,', 640, 286, 20, INK, 'normal', 'center');
  text(ctx, 'aduk sampai matang, tuang ke piring, sajikan!', 640, 314, 20, INK, 'normal', 'center');
  text(ctx, 'Klik bahan 1–7  •  Spasi aduk  •  Enter tuang & sajikan', 640, 362, 18, '#6b4423', 'bold', 'center');
  text(ctx, 'Jangan sampai gosong — pelanggan yang menunggu', 640, 392, 18, '#6b4423', 'normal', 'center');
  text(ctx, 'terlalu lama akan pergi dan hatimu berkurang.', 640, 418, 18, '#6b4423', 'normal', 'center');
  ctx.fillStyle = '#2f8f3e';
  rr(ctx, 480, 452, 320, 56, 12);
  ctx.fill();
  text(ctx, 'MULAI MASAK', 640, 481, 26, '#fff', 'bold', 'center');
  if (best > 0) text(ctx, `Skor terbaik: ${best} koin`, 640, 540, 18, INK, 'bold', 'center');
  text(ctx, 'Klik di mana saja untuk mulai', 640, 572, 16, '#8a7a5f', 'normal', 'center');
  hitAreas.push({ id: HIT.start, x: 0, y: 0, w: 1280, h: 720 });
}

function drawOver(ctx, k, best) {
  panel(ctx, 340, 130, 600, 460);
  text(ctx, 'HARI SELESAI!', 640, 196, 48, '#d9392b', 'bold', 'center');
  const served = k.board.served;
  const missed = k.board.missed;
  const stars = served >= 14 && missed === 0 ? 3 : served >= 10 ? 2 : served >= 6 ? 1 : 0;
  let starText = '';
  for (let i = 0; i < 3; i += 1) starText += i < stars ? '★ ' : '☆ ';
  text(ctx, starText.trim(), 640, 252, 40, '#f7c948', 'bold', 'center');
  text(ctx, `Koin hari ini: ${k.coins}`, 640, 312, 24, INK, 'bold', 'center');
  text(ctx, `Pesanan selesai: ${served}   •   Ditinggal: ${missed}   •   Kombo terbaik: x${k.bestCombo}`, 640, 352, 18, INK, 'normal', 'center');
  text(ctx, `Skor terbaik: ${Math.max(best, k.coins)} koin`, 640, 386, 18, INK, 'bold', 'center');
  ctx.fillStyle = '#2f8f3e';
  rr(ctx, 480, 420, 320, 56, 12);
  ctx.fill();
  text(ctx, 'MAIN LAGI (R)', 640, 449, 24, '#fff', 'bold', 'center');
  text(ctx, 'Shift 3 menit — makin sore makin ramai!', 640, 516, 16, '#8a7a5f', 'normal', 'center');
  hitAreas.push({ id: HIT.again, x: 0, y: 0, w: 1280, h: 720 });
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,28,16,0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'JEDA — tekan P untuk lanjut', 640, 360, 36, '#fff6e0', 'bold', 'center');
}

/** Draw one frame of the kitchen. `now` is a millisecond clock for animation. */
export function drawGame(ctx, k, now, best, paused) {
  hitAreas = [];
  drawWall(ctx);
  drawHUD(ctx, k, best);
  drawOrderBoard(ctx, k);
  drawWok(ctx, k, now);
  drawTuang(ctx, k);
  drawPlate(ctx, k);
  drawRecipes(ctx);
  drawBins(ctx, k);
  drawSteam(ctx, k);
  drawFloats(ctx, k);
  if (k.screen === SCREEN_TITLE) drawTitle(ctx, k, best);
  if (k.screen === SCREEN_OVER) drawOver(ctx, k, best);
  if (paused && k.screen === SCREEN_PLAY) drawPaused(ctx);
}
