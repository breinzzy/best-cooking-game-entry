// LANTERN NOODLE — audio.js
// One job: every sound the game makes, synthesised with WebAudio. No audio files,
// no network. All sounds are short and guarded: if the browser has no audio (or
// the player never interacted), calling a sound is a silent no-op.

let audioCtx = null;
let muted = false;
let sizzleNodes = null;

function audio() {
  if (audioCtx) return audioCtx;
  try {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  } catch {
    return null;
  }
  return audioCtx;
}

/** Call from the first user gesture so later sounds are allowed to play. */
function unlockAudio() {
  const a = audio();
  if (a && a.state === 'suspended') a.resume().catch(() => {});
}

function setMuted(value) {
  muted = value;
  if (muted) stopSizzle();
}
function isMuted() {
  return muted;
}

function tone(freq, dur, type, gain, when = 0, slideTo = null) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  const t0 = a.currentTime + when;
  const osc = a.createOscillator();
  const g = a.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(a.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(dur, gain, filterFreq) {
  if (muted) return;
  const a = audio();
  if (!a) return;
  const len = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.createBufferSource();
  src.buffer = buf;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const g = a.createGain();
  g.gain.value = gain;
  src.connect(filter).connect(g).connect(a.destination);
  src.start();
}

/** A looping filtered-noise sizzle while the bowl simmers. */
function startSizzle() {
  if (muted || sizzleNodes) return;
  const a = audio();
  if (!a) return;
  const len = a.sampleRate;
  const buf = a.createBuffer(1, len, a.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i += 1) data[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const filter = a.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 4200;
  filter.Q.value = 0.6;
  const g = a.createGain();
  g.gain.value = 0.045;
  src.connect(filter).connect(g).connect(a.destination);
  src.start();
  sizzleNodes = { src, g };
}

function stopSizzle() {
  if (!sizzleNodes) return;
  try {
    sizzleNodes.g.gain.value = 0;
    sizzleNodes.src.stop();
  } catch { /* already stopped */ }
  sizzleNodes = null;
}

const sfx = {
  /** Ingredient dropped into the bowl. */
  pop() { tone(520, 0.09, 'sine', 0.16, 0, 760); },
  /** A stir of the bowl. */
  stir() { noise(0.12, 0.2, 2600); },
  /** Bowl finished simmering. */
  ding() { tone(880, 0.35, 'sine', 0.2); tone(1318, 0.4, 'sine', 0.14, 0.09); },
  /** Dish moved to the pass shelf. */
  pass() { tone(392, 0.12, 'triangle', 0.18); tone(523, 0.16, 'triangle', 0.18, 0.08); },
  /** Order served: till cha-ching. */
  coin() {
    tone(987, 0.1, 'square', 0.08);
    tone(1318, 0.12, 'square', 0.08, 0.08);
    tone(1568, 0.22, 'square', 0.09, 0.16);
  },
  /** Order missed or bowl burnt. */
  buzz() { tone(180, 0.3, 'sawtooth', 0.12, 0, 90); },
  /** Button click. */
  click() { tone(660, 0.05, 'sine', 0.1); },
  /** Day complete fanfare. */
  fanfare() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'triangle', 0.16, i * 0.11));
  },
};
