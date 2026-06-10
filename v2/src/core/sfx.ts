// Synth SFX — ported from v1 audio.js (the charming oscillator blips stay for UI;
// real CC0 music tracks handle songs). iPhone Safari rules unchanged: the audio
// engine starts asleep and only wakes if, inside a real tap, we resume it AND
// play a silent sample. The physical mute switch silences web audio entirely.

let SOUND = true;
let actx: AudioContext | null = null;
let primed = false;

function ensure(): AudioContext | null {
  try {
    if (!actx) actx = new AudioContext();
    if (actx.state === 'suspended') void actx.resume();
  } catch { /* no audio available */ }
  return actx;
}

function prime() {
  if (primed || !actx) return;
  try {
    const buf = actx.createBuffer(1, 1, 22050);
    const src = actx.createBufferSource();
    src.buffer = buf;
    src.connect(actx.destination);
    src.start(0);
    primed = true;
  } catch { /* ignore */ }
}

export function tone(f: number, d = 0.1, type: OscillatorType = 'square', when = 0, gain = 0.1) {
  if (!SOUND) return;
  const ctx = ensure();
  if (!ctx) return;
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const s = ctx.currentTime + when;
    o.type = type;
    o.frequency.setValueAtTime(f, s);
    o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.0001, s);
    g.gain.exponentialRampToValueAtTime(gain, s + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, s + d);
    o.start(s); o.stop(s + d);
  } catch { /* silent */ }
}

// wake on every interaction — required for iOS
if (typeof window !== 'undefined') {
  const wake = () => { ensure(); prime(); };
  for (const ev of ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown']) {
    window.addEventListener(ev, wake, { passive: true, capture: true });
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) ensure(); });
}

export const sfx = {
  tone,
  unlock() { ensure(); prime(); },
  state() { return actx ? actx.state : 'none'; },
  blip() { tone(1200, 0.015, 'square'); },
  chirp() { [760, 920, 1180, 980].forEach((f, i) => tone(f, 0.09, 'sine', i * 0.06)); },
  fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.12)); },
  win() { [523, 659, 784].forEach((f, i) => tone(f, 0.12, 'square', i * 0.07)); },
  buzz() { tone(150, 0.18, 'sawtooth'); },
  toggle() { SOUND = !SOUND; if (SOUND) { ensure(); prime(); this.blip(); } return SOUND; },
  set(on: boolean) { SOUND = on; },
  get on() { return SOUND; }
};
