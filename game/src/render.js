// LANTERN NOODLE — render.js
// One job: draw the whole game on the canvas — the night-market stall, the order
// board, the bowl, the pass shelf, the ingredient counter and the title /
// game-over panels — and remember where the clickable things are, so input.js
// can hit-test them.
// Layout is fixed at 1280x720 (VIEW) and scaled to the window by main.js.


const HIT = {
  bowl: 'bowl', pindah: 'pindah', pass: 'pass', sajikan: 'sajikan',
  buangBowl: 'buang-bowl', buangPass: 'buang-pass',
  mute: 'mute', pause: 'pause', start: 'start', again: 'again',
};

let hitAreas = [];
/** The clickable rects from the last frame: [{id, x, y, w, h}]. */
function getHitAreas() {
  return hitAreas;
}

// Night-market palette: deep indigo sky, warm lantern amber, cream light text.
const INK = '#2b1c10';        // dark text, on cream panels
const LIGHT = '#f5ead2';      // light text, on the dark night background
const MUTED_LIGHT = '#c9b18a'; // dim light text on dark
const NIGHT = '#1c2340';
const PANEL_DARK = '#232a4a';
const WOOD = '#7a5230';
const WOOD_DARK = '#5a3a20';
const AMBER = '#f7c948';
const TEAL = '#2ec4b6';

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

function drawLantern(ctx, x, y, r, color, glow) {
  // Warm paper lantern: glowing body, dark caps, a tassel below.
  if (glow) {
    ctx.fillStyle = 'rgba(247,201,72,0.14)';
    ctx.beginPath();
    ctx.arc(x, y, r * 2.1, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 1.15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(x, y, r * 0.55, r * 1.15, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#2b1c10';
  ctx.fillRect(x - r * 0.28, y - r * 1.28, r * 0.56, r * 0.22);
  ctx.fillRect(x - r * 0.28, y + r * 1.06, r * 0.56, r * 0.22);
  ctx.fillStyle = '#f7c948';
  ctx.fillRect(x - 2, y + r * 1.28, 4, r * 0.5);
}

function drawWall(ctx, k, now) {
  // Deep indigo night sky.
  ctx.fillStyle = NIGHT;
  ctx.fillRect(0, 0, 1280, 720);
  // Stars.
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  const stars = [[60, 90], [150, 76], [330, 92], [420, 78], [700, 84], [820, 72], [960, 92], [1080, 80], [1200, 96], [240, 108], [560, 100], [900, 108], [1160, 110]];
  for (const [x, y] of stars) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Striped stall awning along the top of the wall, scalloped at its edge.
  for (let i = 0; i < 20; i += 1) {
    ctx.fillStyle = i % 2 === 0 ? '#c0392b' : '#f5ead2';
    const x = i * 64;
    ctx.fillRect(x, 60, 64, 22);
    ctx.beginPath();
    ctx.arc(x + 32, 82, 32, 0, Math.PI);
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(43,28,16,0.35)';
  ctx.fillRect(0, 60, 1280, 3);
  // Paper lanterns hanging from the awning's edge.
  drawLantern(ctx, 140, 104, 20, '#e74c3c', true);
  drawLantern(ctx, 330, 110, 16, '#f7c948', true);
  drawLantern(ctx, 950, 110, 16, '#f7c948', true);
  drawLantern(ctx, 1140, 104, 20, '#e74c3c', true);
  // Dark wooden floor.
  ctx.fillStyle = '#2e2118';
  ctx.fillRect(0, 480, 1280, 240);
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  for (let y = 528; y < 720; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1280, y);
    ctx.stroke();
  }
  // Hanging wooden stall sign, on chains from the awning.
  ctx.strokeStyle = '#2b1c10';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(520, 88);
  ctx.lineTo(520, 96);
  ctx.moveTo(760, 88);
  ctx.lineTo(760, 96);
  ctx.stroke();
  ctx.fillStyle = WOOD_DARK;
  rr(ctx, 490, 96, 300, 32, 8);
  ctx.fill();
  ctx.strokeStyle = '#2b1c10';
  ctx.lineWidth = 2;
  rr(ctx, 490, 96, 300, 32, 8);
  ctx.stroke();
  text(ctx, '★ LANTERN NOODLE ★', 640, 113, 19, AMBER, 'bold', 'center');
  // Back-wall shelf between the order board and the MOVE button: stacked bowls,
  // a hanging ladle, chopsticks and a jar — the working kitchen, on the wall.
  ctx.fillStyle = WOOD;
  ctx.fillRect(400, 226, 320, 12);
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(400, 226, 320, 4);
  // Brackets under the shelf.
  ctx.fillStyle = WOOD_DARK;
  ctx.beginPath();
  ctx.moveTo(414, 238);
  ctx.lineTo(428, 238);
  ctx.lineTo(414, 254);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(706, 238);
  ctx.lineTo(692, 238);
  ctx.lineTo(706, 254);
  ctx.closePath();
  ctx.fill();
  // Three stacked bowls on the shelf.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = '#1f6f6b';
    ctx.beginPath();
    ctx.arc(445, 214 - i * 7, 17, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#155e5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(445, 214 - i * 7, 17, 0, Math.PI);
    ctx.stroke();
  }
  // A small amber jar on the shelf.
  ctx.fillStyle = '#e8912d';
  rr(ctx, 688, 204, 24, 22, 4);
  ctx.fill();
  ctx.fillStyle = WOOD_DARK;
  ctx.fillRect(688, 204, 24, 6);
  // Ladle hanging from a hook under the shelf.
  ctx.strokeStyle = '#c9c9c9';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(545, 240);
  ctx.lineTo(545, 272);
  ctx.stroke();
  ctx.fillStyle = '#c9c9c9';
  ctx.beginPath();
  ctx.arc(545, 282, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a8f98';
  ctx.beginPath();
  ctx.arc(545, 282, 7, 0, Math.PI * 2);
  ctx.fill();
  // Chopsticks hanging in a bundle under the shelf.
  ctx.strokeStyle = '#d9a05b';
  ctx.lineWidth = 3;
  for (const dx of [-6, 0, 6]) {
    ctx.beginPath();
    ctx.moveTo(640 + dx, 240);
    ctx.lineTo(640 + dx, 282);
    ctx.stroke();
  }
  ctx.fillStyle = '#c0392b';
  ctx.fillRect(632, 252, 18, 6);
  // Customer window on the left: one face per ticket on the board, each with
  // its own look and a mood bubble that follows the ticket's patience.
  ctx.fillStyle = PANEL_DARK;
  rr(ctx, 16, 228, 116, 118, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(247,201,72,0.5)';
  ctx.lineWidth = 2;
  rr(ctx, 16, 228, 116, 118, 10);
  ctx.stroke();
  text(ctx, 'CUSTOMERS', 74, 244, 11, AMBER, 'bold', 'center');
  drawCustomers(ctx, k);
}

/** One face per active order: varied look, and a mood bubble that changes as the ticket waits. */
function drawCustomers(ctx, k) {
  const orders = k.board.orders.slice(0, 3);
  if (!orders.length) {
    text(ctx, '…', 74, 296, 24, MUTED_LIGHT, 'bold', 'center');
    return;
  }
  const xs = orders.length === 1 ? [74] : orders.length === 2 ? [46, 102] : [36, 74, 112];
  orders.forEach((order, i) => {
    const x = xs[i];
    const c = order.customer ?? { skin: '#f2c79b', hair: '#2b1c10', shirt: '#d9392b', hairStyle: 0 };
    const frac = Math.max(0, order.patience / order.patienceMax);
    const mood = frac > 0.5 ? 'happy' : frac > 0.25 ? 'worried' : 'impatient';
    const cy = 292;
    // Mood bubble: green smile, amber flat line, red "!" as patience runs out.
    const bubbleColor = mood === 'happy' ? '#58b368' : mood === 'worried' ? '#f7c948' : '#d9392b';
    ctx.fillStyle = bubbleColor;
    ctx.beginPath();
    ctx.arc(x + 13, 263, 8, 0, Math.PI * 2);
    ctx.fill();
    if (mood === 'impatient') {
      text(ctx, '!', x + 13, 264, 12, '#fff', 'bold', 'center');
    } else {
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      if (mood === 'happy') ctx.arc(x + 13, 261, 3.5, 0.15 * Math.PI, 0.85 * Math.PI);
      else { ctx.moveTo(x + 9, 263); ctx.lineTo(x + 17, 263); }
      ctx.stroke();
    }
    // Shirt.
    ctx.fillStyle = c.shirt;
    rr(ctx, x - 14, 308, 28, 18, 6);
    ctx.fill();
    // Face.
    ctx.fillStyle = c.skin;
    ctx.beginPath();
    ctx.arc(x, cy, 15, 0, Math.PI * 2);
    ctx.fill();
    // Hair, by style: short cap, bun, or long sides.
    ctx.fillStyle = c.hair;
    ctx.beginPath();
    ctx.arc(x, cy - 4, 15, Math.PI, 0);
    ctx.fill();
    if (c.hairStyle === 1) {
      ctx.beginPath();
      ctx.arc(x, cy - 18, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (c.hairStyle === 2) {
      ctx.fillRect(x - 15, cy - 4, 5, 16);
      ctx.fillRect(x + 10, cy - 4, 5, 16);
    }
    // Eyes.
    ctx.fillStyle = '#2b1c10';
    ctx.beginPath();
    ctx.arc(x - 5, cy, 1.8, 0, Math.PI * 2);
    ctx.arc(x + 5, cy, 1.8, 0, Math.PI * 2);
    ctx.fill();
    // Mouth follows the mood: smile, flat, or frown.
    ctx.strokeStyle = '#2b1c10';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    if (mood === 'happy') ctx.arc(x, cy + 4, 5, 0.15 * Math.PI, 0.85 * Math.PI);
    else if (mood === 'worried') { ctx.moveTo(x - 4, cy + 7); ctx.lineTo(x + 4, cy + 7); }
    else ctx.arc(x, cy + 9, 5, 1.15 * Math.PI, 1.85 * Math.PI);
    ctx.stroke();
  });
}

/** The stove under the MOVE button: a big simmering broth pot, animated steam, and a stack of bowls on the right burner. */
function drawStove(ctx, now) {
  // Stove body, standing on the floor line.
  ctx.fillStyle = '#3a3f47';
  rr(ctx, 400, 420, 320, 60, 8);
  ctx.fill();
  ctx.fillStyle = '#2b2f36';
  ctx.fillRect(400, 420, 320, 10);
  // Burner rings on the stove top.
  for (const bx of [450, 670]) {
    ctx.strokeStyle = '#22252b';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(bx, 422, 42, 7, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  // Control knobs on the stove front.
  for (const kx of [520, 560, 600]) {
    ctx.fillStyle = '#c9c9c9';
    ctx.beginPath();
    ctx.arc(kx, 452, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3f47';
    ctx.beginPath();
    ctx.arc(kx, 452, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  // The big broth pot on the left burner: steel body, rim, handles, broth surface.
  const flick = 1 + Math.sin(now / 110) * 0.1;
  ctx.fillStyle = `rgba(224,120,64,${0.25 + flick * 0.1})`;
  ctx.beginPath();
  ctx.ellipse(450, 422, 52, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a8f98';
  rr(ctx, 405, 355, 90, 65, 8);
  ctx.fill();
  ctx.fillStyle = '#6e7278';
  ctx.fillRect(400, 350, 100, 12);
  ctx.fillRect(400, 350, 100, 4);
  ctx.fillStyle = '#5a5e66';
  ctx.fillRect(392, 362, 14, 8);
  ctx.fillRect(494, 362, 14, 8);
  ctx.fillStyle = '#e8912d';
  ctx.beginPath();
  ctx.ellipse(450, 358, 42, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#f7b500';
  ctx.beginPath();
  ctx.ellipse(450, 357, 30, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // Animated steam rising from the pot (loops with the clock, so it never stops).
  for (let i = 0; i < 3; i += 1) {
    const cycle = ((now / 16 + i * 37) % 60) / 60;
    const sx = 450 + Math.sin((now / 300) + i * 2.1) * 8 + (i - 1) * 14;
    const sy = 348 - cycle * 52;
    ctx.globalAlpha = Math.max(0, (1 - cycle) * 0.4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx, sy, 5 + cycle * 9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  // A stack of bowls waiting on the right burner.
  for (let i = 0; i < 3; i += 1) {
    ctx.fillStyle = '#1f6f6b';
    ctx.beginPath();
    ctx.arc(670, 414 - i * 6, 16, 0, Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#155e5a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(670, 414 - i * 6, 16, 0, Math.PI);
    ctx.stroke();
  }
}

function drawHUD(ctx, k, best) {
  ctx.fillStyle = '#2b1c10';
  ctx.fillRect(0, 0, 1280, 60);
  text(ctx, 'LANTERN NOODLE', 20, 22, 26, AMBER);
  text(ctx, 'Noodle Stall', 20, 46, 14, LIGHT, 'normal');
  // Shift timer, big in the middle.
  const urgent = k.timeLeft <= 30;
  text(ctx, 'SHIFT', 560, 20, 13, '#c9b18a', 'bold', 'center');
  text(ctx, fmtTime(k.timeLeft), 560, 44, 30, urgent ? '#ff6b5e' : '#fff6e0', 'bold', 'center');
  if (k.rush && k.screen === SCREEN_PLAY) {
    text(ctx, 'RUSH HOUR!', 700, 30, 18, '#ff6b5e', 'bold', 'center');
  }
  text(ctx, `COINS ${k.coins}`, 900, 30, 22, '#fff6e0', 'bold', 'center');
  if (k.combo >= 2) text(ctx, `COMBO x${k.combo}`, 1040, 30, 22, '#f7c948', 'bold', 'center');
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
  text(ctx, isMuted() ? 'MUTE' : 'SOUND', 1242, 31, 12, '#fff6e0', 'bold', 'center');
  hitAreas.push({ id: HIT.mute, x: 1220, y: 12, w: 44, h: 36 });
}

function drawOrderBoard(ctx, k) {
  text(ctx, 'ORDERS', 20, 118, 18, LIGHT);
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
      text(ctx, 'Waiting for orders…', x + 20, y + 32, 16, '#8a7a5f', 'normal');
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
    if (frac <= 0.25) text(ctx, 'HURRY!', x + 200, y + 20, 13, '#d9392b', 'bold');
  }
}

function drawBowl(ctx, k, now) {
  const cx = 260;
  const cy = 350;
  text(ctx, 'BOWL  •  click / Space = stir', cx, 208, 17, LIGHT, 'bold', 'center');
  // Flame under the bowl (the stall stove).
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
  // The bowl itself: teal ceramic, broth surface on top.
  const shakeX = k.shake > 0 ? Math.sin(now / 18) * 4 : 0;
  ctx.fillStyle = '#1f6f6b';
  ctx.beginPath();
  ctx.arc(cx + shakeX, cy, 118, 0, Math.PI);
  ctx.fill();
  ctx.fillStyle = '#e8912d';
  ctx.beginPath();
  ctx.ellipse(cx + shakeX, cy - 6, 112, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  // A lighter patch on the broth so it reads as liquid, not a flat disc.
  ctx.fillStyle = '#f2a93b';
  ctx.beginPath();
  ctx.ellipse(cx + shakeX, cy - 12, 72, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#155e5a';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx + shakeX, cy, 118, 0, Math.PI);
  ctx.stroke();
  // Food inside the bowl: a finished dish draws as a mound, otherwise every
  // added ingredient stacks as its own coloured layer — the bowl fills visibly.
  if (k.bowl.length) {
    const dish = k.dishReady ? dishById(k.dishReady) : null;
    if (dish && k.dishReady !== 'acak') {
      drawDish(ctx, dish, cx + shakeX, cy - 34, 92);
    } else if (!k.burnt) {
      // The bowl's contents as recognisable layers on the broth: swirled
      // noodles when the bowl holds any, then each topping placed on top.
      // Broth itself (kuah) is the amber surface already drawn under this.
      if (k.bowl.includes('mie')) {
        ctx.strokeStyle = '#ffe9a8';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        for (let i = 0; i < 3; i += 1) {
          const yy = cy - 22 + i * 9;
          ctx.beginPath();
          for (let px = -78; px <= 78; px += 6) {
            const py = yy + Math.sin(px * 0.11 + i * 1.7) * 4;
            if (px === -78) ctx.moveTo(cx + shakeX + px, py); else ctx.lineTo(cx + shakeX + px, py);
          }
          ctx.stroke();
        }
      }
      const spots = [[-56, -16], [0, -28], [56, -16], [-30, -4], [30, -4]];
      let placed = 0;
      for (const id of k.bowl) {
        if (id === 'kuah' || id === 'mie') continue;
        if (id === 'kecap') {
          // Soy sauce: a dark drizzle across the broth, not a bottle on it.
          ctx.strokeStyle = '#4a2c1a';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(cx + shakeX - 40, cy - 10);
          ctx.quadraticCurveTo(cx + shakeX, cy - 22, cx + shakeX + 40, cy - 10);
          ctx.stroke();
          continue;
        }
        const [dx, dy] = spots[placed % spots.length];
        drawIcon(ctx, id, cx + shakeX + dx, cy + dy, 36);
        placed += 1;
      }
    }
  }
  if (k.burnt) {
    text(ctx, 'BURNT!', cx, cy - 58, 26, '#ff6b5e', 'bold', 'center');
    ctx.fillStyle = 'rgba(60,60,60,0.5)';
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.arc(cx - 50 + i * 25, cy - 70 - (i % 2) * 14, 12, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // Simmer progress ring (kept clear of the BOWL label above it).
  if (k.cooking && !k.burnt) {
    const frac = Math.min(1, k.cook);
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, 124, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = k.dishReady ? '#58b368' : AMBER;
    ctx.beginPath();
    ctx.arc(cx, cy, 124, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.stroke();
    // Progress tag: simmer % plus layers added vs the recipe size ("2/4").
    const target = DISH_BY_ID[Object.keys(DISH_BY_ID).find((d) => {
      const needs = DISH_BY_ID[d].needs;
      return k.bowl.every((id) => needs.includes(id));
    }) ?? 'mieayam'];
    const layers = `${k.bowl.length}/${target.needs.length}`;
    ctx.fillStyle = PANEL_DARK;
    rr(ctx, cx - 78, cy + 70, 156, 30, 15);
    ctx.fill();
    ctx.strokeStyle = 'rgba(247,201,72,0.6)';
    ctx.lineWidth = 2;
    rr(ctx, cx - 78, cy + 70, 156, 30, 15);
    ctx.stroke();
    text(ctx, k.dishReady ? `READY! ${layers}` : `${Math.round(frac * 100)}%  •  ${layers}`, cx, cy + 86, 19, k.dishReady ? '#58b368' : LIGHT, 'bold', 'center');
  }
  if (!k.bowl.length) text(ctx, 'Empty bowl — click an ingredient below', cx, cy + 94, 15, LIGHT, 'normal', 'center');
  // Trash bowl button.
  ctx.fillStyle = WOOD_DARK;
  rr(ctx, 150, 452, 220, 34, 8);
  ctx.fill();
  text(ctx, 'EMPTY BOWL (Del)', 260, 470, 15, LIGHT, 'bold', 'center');
  hitAreas.push({ id: HIT.buangBowl, x: 150, y: 452, w: 220, h: 34 });
  hitAreas.push({ id: HIT.bowl, x: cx - 130, y: cy - 140, w: 260, h: 240 });
}

function drawPindah(ctx, k) {
  const x = 500;
  const y = 300;
  const ready = !!k.dishReady && !k.pass;
  ctx.fillStyle = ready ? '#2f8f3e' : '#5a5348';
  rr(ctx, x, y, 120, 64, 10);
  ctx.fill();
  text(ctx, 'MOVE →', x + 60, y + 26, 20, LIGHT, 'bold', 'center');
  text(ctx, 'Enter', x + 60, y + 48, 13, LIGHT, 'normal', 'center');
  hitAreas.push({ id: HIT.pindah, x, y, w: 120, h: 64 });
}

function drawPass(ctx, k) {
  const cx = 880;
  const cy = 350;
  text(ctx, 'PASS SHELF', cx, 222, 17, LIGHT, 'bold', 'center');
  // Pass shelf.
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
  // The plate itself, glowing amber while a dish waits on the shelf.
  if (k.pass) {
    ctx.fillStyle = 'rgba(247,201,72,0.18)';
    ctx.beginPath();
    ctx.arc(cx, cy, 122, 0, Math.PI * 2);
    ctx.fill();
  }
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
  if (k.pass) {
    const dish = dishById(k.pass);
    drawDish(ctx, dish, cx, cy - 10, 110);
    // The name sits on the white plate itself, never under the serve button.
    text(ctx, dish.name, cx, cy + 74, 20, INK, 'bold', 'center');
    // READY tag pinned on the plate's top-right rim.
    ctx.fillStyle = '#2f8f3e';
    rr(ctx, 928, 238, 104, 28, 14);
    ctx.fill();
    text(ctx, 'READY ✓', 980, 253, 15, '#fff', 'bold', 'center');
  } else {
    text(ctx, 'Shelf empty', cx, cy, 16, '#8a7a5f', 'normal', 'center');
  }
  // Serve button, with the bell to ring.
  const ready = !!k.pass;
  ctx.fillStyle = ready ? '#2f8f3e' : '#5a5348';
  rr(ctx, 760, 452, 240, 40, 10);
  ctx.fill();
  drawBell(ctx, 788, 472, 26, ready);
  text(ctx, ready ? 'SERVE! (Enter)' : 'SERVE', 890, 473, 19, LIGHT, 'bold', 'center');
  hitAreas.push({ id: HIT.sajikan, x: 760, y: 452, w: 240, h: 40 });
  hitAreas.push({ id: HIT.pass, x: cx - 120, y: cy - 120, w: 240, h: 240 });
  // Trash pass.
  ctx.fillStyle = WOOD_DARK;
  rr(ctx, 1010, 452, 130, 34, 8);
  ctx.fill();
  text(ctx, 'TRASH', 1075, 470, 14, LIGHT, 'bold', 'center');
  hitAreas.push({ id: HIT.buangPass, x: 1010, y: 452, w: 130, h: 34 });
}

function drawRecipes(ctx) {
  const x = 1150;
  const y = 204;
  ctx.fillStyle = 'rgba(35,42,74,0.95)';
  rr(ctx, x, y, 114, 292, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(247,201,72,0.5)';
  ctx.lineWidth = 2;
  rr(ctx, x, y, 114, 292, 10);
  ctx.stroke();
  text(ctx, 'RECIPES', x + 57, y + 22, 15, LIGHT, 'bold', 'center');
  const dishes = Object.values(DISH_BY_ID);
  dishes.forEach((dish, i) => {
    const yy = y + 48 + i * 60;
    text(ctx, dish.name, x + 57, yy, 12, LIGHT, 'bold', 'center');
    dish.needs.forEach((id, j) => {
      drawIcon(ctx, id, x + 22 + j * 24, yy + 18, 20);
    });
    text(ctx, `Rp${dish.price}`, x + 57, yy + 42, 11, '#58b368', 'bold', 'center');
  });
}

function drawBins(ctx, k) {
  text(ctx, 'COUNTER  •  click an ingredient (or press 1–7) to add to the bowl', 20, 516, 17, LIGHT, 'bold');
  const w = 160;
  const gap = 12;
  INGREDIENTS.forEach((ing, i) => {
    const x = 16 + i * (w + gap);
    const y = 528;
    const h = 118;
    const inBowl = k.bowl.filter((id) => id === ing.id).length;
    ctx.fillStyle = PANEL_DARK;
    rr(ctx, x, y, w, h, 12);
    ctx.fill();
    ctx.strokeStyle = ing.color;
    ctx.lineWidth = 4;
    rr(ctx, x, y, w, h, 12);
    ctx.stroke();
    drawIcon(ctx, ing.icon, x + w / 2, y + 44, 62);
    text(ctx, ing.name, x + w / 2, y + 88, 18, LIGHT, 'bold', 'center');
    // Key badge.
    ctx.fillStyle = AMBER;
    rr(ctx, x + 8, y + 8, 26, 26, 6);
    ctx.fill();
    text(ctx, ing.key, x + 21, y + 22, 15, INK, 'bold', 'center');
    if (inBowl > 0) {
      ctx.fillStyle = '#d9392b';
      ctx.beginPath();
      ctx.arc(x + w - 16, y + 16, 14, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, `x${inBowl}`, x + w - 16, y + 17, 14, '#fff', 'bold', 'center');
    }
    hitAreas.push({ id: `ingredient:${ing.id}`, x, y, w, h });
  });
  text(ctx, 'Space = stir  •  Enter = move / serve  •  Del = trash  •  P = pause  •  M = sound', 640, 672, 15, MUTED_LIGHT, 'normal', 'center');
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
  text(ctx, 'LANTERN NOODLE', 640, 180, 64, '#d9392b', 'bold', 'center');
  text(ctx, '— Noodle Stall —', 640, 226, 26, INK, 'bold', 'center');
  text(ctx, 'Night-market noodle stand: read the orders, fill the bowl,', 640, 286, 20, INK, 'normal', 'center');
  text(ctx, 'stir until simmered, move it to the pass, ring the bell!', 640, 314, 20, INK, 'normal', 'center');
  text(ctx, 'Click ingredients 1–7  •  Space stirs  •  Enter moves & serves', 640, 362, 18, '#6b4423', 'bold', 'center');
  text(ctx, 'Do not let it burn — customers who wait', 640, 392, 18, '#6b4423', 'normal', 'center');
  text(ctx, 'too long will leave and you will lose a heart.', 640, 418, 18, '#6b4423', 'normal', 'center');
  ctx.fillStyle = '#2f8f3e';
  rr(ctx, 480, 452, 320, 56, 12);
  ctx.fill();
  text(ctx, 'START COOKING', 640, 481, 26, '#fff', 'bold', 'center');
  if (best > 0) text(ctx, `Best score: ${best} coins`, 640, 540, 18, INK, 'bold', 'center');
  text(ctx, 'Click anywhere to start', 640, 572, 16, '#8a7a5f', 'normal', 'center');
  hitAreas.push({ id: HIT.start, x: 0, y: 0, w: 1280, h: 720 });
}

function drawOver(ctx, k, best) {
  panel(ctx, 340, 130, 600, 460);
  text(ctx, 'SHIFT OVER!', 640, 196, 48, '#d9392b', 'bold', 'center');
  const served = k.board.served;
  const missed = k.board.missed;
  const stars = served >= 14 && missed === 0 ? 3 : served >= 10 ? 2 : served >= 6 ? 1 : 0;
  let starText = '';
  for (let i = 0; i < 3; i += 1) starText += i < stars ? '★ ' : '☆ ';
  text(ctx, starText.trim(), 640, 252, 40, '#f7c948', 'bold', 'center');
  text(ctx, `Coins tonight: ${k.coins}`, 640, 312, 24, INK, 'bold', 'center');
  text(ctx, `Orders served: ${served}   •   Walked out: ${missed}   •   Best combo: x${k.bestCombo}`, 640, 352, 18, INK, 'normal', 'center');
  text(ctx, `Best score: ${Math.max(best, k.coins)} coins`, 640, 386, 18, INK, 'bold', 'center');
  ctx.fillStyle = '#2f8f3e';
  rr(ctx, 480, 420, 320, 56, 12);
  ctx.fill();
  text(ctx, 'PLAY AGAIN (R)', 640, 449, 24, '#fff', 'bold', 'center');
  text(ctx, '3-minute shift — it gets busier at night!', 640, 516, 16, '#8a7a5f', 'normal', 'center');
  hitAreas.push({ id: HIT.again, x: 0, y: 0, w: 1280, h: 720 });
}

function drawPaused(ctx) {
  ctx.fillStyle = 'rgba(43,28,16,0.55)';
  ctx.fillRect(0, 0, 1280, 720);
  text(ctx, 'PAUSED — press P to continue', 640, 360, 36, '#fff6e0', 'bold', 'center');
}

/** Draw one frame of the kitchen. `now` is a millisecond clock for animation. */
function drawGame(ctx, k, now, best, paused) {
  hitAreas = [];
  drawWall(ctx, k, now);
  drawStove(ctx, now);
  drawHUD(ctx, k, best);
  drawOrderBoard(ctx, k);
  drawBowl(ctx, k, now);
  drawPindah(ctx, k);
  drawPass(ctx, k);
  drawRecipes(ctx);
  drawBins(ctx, k);
  drawSteam(ctx, k);
  drawFloats(ctx, k);
  if (k.screen === SCREEN_TITLE) drawTitle(ctx, k, best);
  if (k.screen === SCREEN_OVER) drawOver(ctx, k, best);
  if (paused && k.screen === SCREEN_PLAY) drawPaused(ctx);
}
