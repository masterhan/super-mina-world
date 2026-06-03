/* audio.js — tiny WebAudio chiptune. No sound files; every blip/chirp/fanfare
   is synthesized on the fly. There is ALWAYS a sound toggle.

   iPhone Safari is strict: the audio engine starts ASLEEP and only truly wakes if,
   inside a real tap, we (1) resume it AND (2) play a silent blip to "prime" it. iOS
   also re-sleeps it when you leave the tab, so we re-wake on every tap + on return.
   NOTE: iPhone's physical mute switch silences web audio even when desktop works. */
window.PR = window.PR || {};

PR.audio = (function () {
  let SOUND = true;
  let actx = null;
  let primed = false;

  function ensure() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended' && actx.resume) actx.resume();
    } catch (e) { /* no audio available */ }
    return actx;
  }

  // iOS: play one silent sample inside a user gesture to fully unlock the engine.
  function prime() {
    if (primed || !actx) return;
    try {
      const buf = actx.createBuffer(1, 1, 22050);
      const src = actx.createBufferSource();
      src.buffer = buf;
      src.connect(actx.destination);
      if (src.start) src.start(0); else if (src.noteOn) src.noteOn(0);
      primed = true;
    } catch (e) { /* ignore */ }
  }

  function tone(f, d = 0.1, type = 'square', when = 0) {
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
      g.gain.exponentialRampToValueAtTime(0.1, s + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, s + d);
      o.start(s); o.stop(s + d);
    } catch (e) { /* silent */ }
  }

  // Wake (and keep awake) on every user interaction — required for iOS.
  if (typeof window !== 'undefined') {
    var wake = function () { ensure(); prime(); };
    ['touchstart', 'touchend', 'pointerdown', 'mousedown', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, wake, { passive: true, capture: true });
    });
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', function () { if (!document.hidden) ensure(); });
    }
  }

  return {
    tone,
    unlock()  { ensure(); prime(); },
    state()   { return actx ? actx.state : 'none'; },
    blip()    { tone(1200, 0.015, 'square'); },
    chirp()   { [760, 920, 1180, 980].forEach((f, i) => tone(f, 0.09, 'sine', i * 0.06)); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.12)); },
    win()     { [523, 659, 784].forEach((f, i) => tone(f, 0.12, 'square', i * 0.07)); },
    buzz()    { tone(150, 0.18, 'sawtooth'); },
    toggle()  { SOUND = !SOUND; if (SOUND) { ensure(); prime(); this.blip(); } return SOUND; },
    set(on)   { SOUND = !!on; },
    get on()  { return SOUND; }
  };
})();
