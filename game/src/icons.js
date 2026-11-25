// DAPUR KILAT — icons.js
// One job: draw every food icon as vector shapes on the canvas. No emoji and no
// image files (the machine has no colour-emoji font), so the art is the game's own
// and reads the same in every browser. Each icon is drawn centred on (x, y) inside
// a square of side `size`.

function circle(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

/** A bowl under the food, so every ingredient reads as "a portion". */
function bowl(ctx, x, y, s, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y + s * 0.18, s * 0.42, 0, Math.PI);
  ctx.fill();
  ctx.fillRect(x - s * 0.42, y + s * 0.16, s * 0.84, s * 0.1);
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.fillRect(x - s * 0.42, y + s * 0.16, s * 0.84, s * 0.05);
}

const ICONS = {
  // Steamed rice: white mound in a blue bowl, spring-onion sprinkle.
  nasi(ctx, x, y, s) {
    bowl(ctx, x, y, s, '#3d6fb4');
    ellipse(ctx, x, y - s * 0.08, s * 0.34, s * 0.26, '#fff8e7');
    circle(ctx, x - s * 0.12, y - s * 0.2, s * 0.045, '#58b368');
    circle(ctx, x + s * 0.1, y - s * 0.16, s * 0.045, '#58b368');
    circle(ctx, x + s * 0.02, y - s * 0.26, s * 0.04, '#8fce62');
  },
  // Noodles: yellow wavy strands in a red bowl.
  mie(ctx, x, y, s) {
    bowl(ctx, x, y, s, '#c0392b');
    ctx.strokeStyle = '#f7c948';
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i += 1) {
      const yy = y - s * 0.22 + i * s * 0.11;
      ctx.beginPath();
      for (let px = -s * 0.3; px <= s * 0.3; px += s * 0.06) {
        const py = yy + Math.sin(px * 18 / s) * s * 0.045;
        if (px === -s * 0.3) ctx.moveTo(x + px, py); else ctx.lineTo(x + px, py);
      }
      ctx.stroke();
    }
    circle(ctx, x + s * 0.2, y - s * 0.26, s * 0.05, '#58b368');
  },
  // Chicken drumstick: brown meat, pale bone.
  ayam(ctx, x, y, s) {
    ctx.strokeStyle = '#f3e3c8';
    ctx.lineWidth = s * 0.09;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x + s * 0.16, y + s * 0.05);
    ctx.lineTo(x + s * 0.34, y + s * 0.24);
    ctx.stroke();
    circle(ctx, x + s * 0.36, y + s * 0.26, s * 0.07, '#f3e3c8');
    circle(ctx, x + s * 0.3, y + s * 0.32, s * 0.06, '#f3e3c8');
    ellipse(ctx, x - s * 0.06, y - s * 0.06, s * 0.3, s * 0.24, '#b45a1b');
    ellipse(ctx, x - s * 0.1, y - s * 0.1, s * 0.22, s * 0.16, '#d97b2f');
  },
  // Fried egg: white blob (outlined, so it reads on white bins and plates), glossy yolk.
  telur(ctx, x, y, s) {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.ellipse(x, y, s * 0.4, s * 0.32, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d8c9a8';
    ctx.lineWidth = s * 0.03;
    ctx.stroke();
    circle(ctx, x + s * 0.04, y - s * 0.02, s * 0.17, '#f7b500');
    circle(ctx, x - s * 0.01, y - s * 0.07, s * 0.06, '#ffd94d');
  },
  // Greens: three leaves in a bunch.
  sayur(ctx, x, y, s) {
    ctx.fillStyle = '#2f8f3e';
    for (const [dx, dy, rot] of [[-0.16, 0.05, -0.6], [0, -0.1, 0], [0.16, 0.05, 0.6]]) {
      ctx.save();
      ctx.translate(x + dx * s, y + dy * s);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 0.13, s * 0.26, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = '#8fce62';
    for (const [dx, dy, rot] of [[-0.16, 0.05, -0.6], [0, -0.1, 0], [0.16, 0.05, 0.6]]) {
      ctx.save();
      ctx.translate(x + dx * s, y + dy * s);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, -s * 0.04, s * 0.05, s * 0.16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  },
  // Red chilli: curved pod, green stem.
  sambal(ctx, x, y, s) {
    ctx.strokeStyle = '#d9392b';
    ctx.lineWidth = s * 0.16;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(x, y - s * 0.05, s * 0.3, Math.PI * 1.15, Math.PI * 1.95);
    ctx.stroke();
    ctx.strokeStyle = '#2f8f3e';
    ctx.lineWidth = s * 0.07;
    ctx.beginPath();
    ctx.moveTo(x + s * 0.24, y - s * 0.28);
    ctx.lineTo(x + s * 0.34, y - s * 0.38);
    ctx.stroke();
    circle(ctx, x + s * 0.3, y - s * 0.3, s * 0.05, '#8fce62');
  },
  // Soy sauce: dark bottle, cream label.
  kecap(ctx, x, y, s) {
    ctx.fillStyle = '#3a1f0e';
    ctx.fillRect(x - s * 0.14, y - s * 0.28, s * 0.28, s * 0.62);
    ctx.beginPath();
    ctx.moveTo(x - s * 0.14, y - s * 0.28);
    ctx.lineTo(x - s * 0.08, y - s * 0.42);
    ctx.lineTo(x + s * 0.08, y - s * 0.42);
    ctx.lineTo(x + s * 0.14, y - s * 0.28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(x - s * 0.09, y - s * 0.46, s * 0.18, s * 0.08);
    ctx.fillStyle = '#f5ead2';
    ctx.fillRect(x - s * 0.14, y - s * 0.08, s * 0.28, s * 0.26);
    ctx.fillStyle = '#3a1f0e';
    ctx.font = `bold ${Math.round(s * 0.16)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KECAP', x, y + s * 0.05);
  },
};

/** Draw the icon named `name` centred on (x, y) at size `s`. Unknown names draw a dot. */
export function drawIcon(ctx, name, x, y, s) {
  const draw = ICONS[name];
  if (!draw) {
    circle(ctx, x, y, s * 0.2, '#999');
    return;
  }
  ctx.save();
  draw(ctx, x, y, s);
  ctx.restore();
}

/** The dish on a plate: a mound in the dish colour with its ingredient icons on top. */
export function drawDish(ctx, dish, x, y, s) {
  ellipse(ctx, x, y + s * 0.28, s * 0.46, s * 0.14, dish.color);
  ellipse(ctx, x, y + s * 0.12, s * 0.38, s * 0.2, dish.color);
  const n = dish.needs.length;
  dish.needs.forEach((id, i) => {
    const dx = (i - (n - 1) / 2) * s * 0.3;
    drawIcon(ctx, id, x + dx, y - s * 0.06, s * 0.34);
  });
}
