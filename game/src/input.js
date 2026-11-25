// LANTERN NOODLE — input.js
// One job: turn mouse clicks and key presses into kitchen actions. It owns the
// hit-test (which rect was clicked) and the key map; the game logic lives in
// kitchen.js and the drawing lives in render.js.


/**
 * Wire the canvas and the window to `actions`:
 *   { addIngredient, stir, pour, serve, trashBowl, trashPass, toggleMute,
 *     togglePause, start, restart }
 * Returns a function that reads a click position in canvas pixels.
 */
function createInput(canvas, actions) {
  function hitAt(x, y) {
    const areas = getHitAreas();
    for (let i = areas.length - 1; i >= 0; i -= 1) {
      const a = areas[i];
      if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return a.id;
    }
    return null;
  }

  function clickAt(x, y) {
    const id = hitAt(x, y);
    if (!id) return;
    if (id === HIT.start) actions.start();
    else if (id === HIT.again) actions.restart();
    else if (id === HIT.mute) actions.toggleMute();
    else if (id === HIT.bowl) actions.stir();
    else if (id === HIT.pindah) actions.pour();
    else if (id === HIT.pass || id === HIT.sajikan) actions.serve();
    else if (id === HIT.buangBowl) actions.trashBowl();
    else if (id === HIT.buangPass) actions.trashPass();
    else if (id.startsWith('ingredient:')) actions.addIngredient(id.slice('ingredient:'.length));
  }

  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 1280;
    const y = ((event.clientY - rect.top) / rect.height) * 720;
    clickAt(x, y);
  });

  window.addEventListener('keydown', (event) => {
    if (event.repeat) return;
    const key = event.key.toLowerCase();
    const ing = INGREDIENTS.find((i) => i.key === key);
    if (ing) {
      actions.addIngredient(ing.id);
      return;
    }
    if (key === ' ') { event.preventDefault(); actions.stir(); }
    else if (key === 'enter') actions.enter();
    else if (key === 'delete' || key === 'backspace') actions.trashBowl();
    else if (key === 'p') actions.togglePause();
    else if (key === 'm') actions.toggleMute();
    else if (key === 'r') actions.restart();
  });

  return { clickAt };
}
