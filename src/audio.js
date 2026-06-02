/* audio.js — tiny WebAudio chiptune. No sound files; every blip/chirp/fanfare
   is synthesized on the fly. There is ALWAYS a sound toggle. */
window.PR = window.PR || {};

PR.audio = (function () {
  let SOUND = true;
  let actx = null;

  function tone(f, d = 0.1, type = 'square', when = 0) {
    if (!SOUND) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator();
      const g = actx.createGain();
      const s = actx.currentTime + when;
      o.type = type;
      o.frequency.setValueAtTime(f, s);
      o.connect(g); g.connect(actx.destination);
      g.gain.setValueAtTime(0.0001, s);
      g.gain.exponentialRampToValueAtTime(0.1, s + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, s + d);
      o.start(s); o.stop(s + d);
    } catch (e) { /* audio not available — silent */ }
  }

  return {
    tone,
    blip()    { tone(1200, 0.015, 'square'); },
    chirp()   { [760, 920, 1180, 980].forEach((f, i) => tone(f, 0.09, 'sine', i * 0.06)); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.12)); },
    win()     { [523, 659, 784].forEach((f, i) => tone(f, 0.12, 'square', i * 0.07)); },
    buzz()    { tone(150, 0.18, 'sawtooth'); },
    toggle()  { SOUND = !SOUND; if (SOUND) this.blip(); return SOUND; },
    set(on)   { SOUND = !!on; },
    get on()  { return SOUND; }
  };
})();
