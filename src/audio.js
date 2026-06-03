/* audio.js — tiny WebAudio chiptune. No sound files; every blip/chirp/fanfare
   is synthesized on the fly. There is ALWAYS a sound toggle.

   Phones + Safari start the audio engine ASLEEP and only allow it to wake inside a
   real tap. So we (a) resume the engine on the FIRST touch/click anywhere, and
   (b) resume-if-asleep on every tone. state() lets us confirm it's actually running. */
window.PR = window.PR || {};

PR.audio = (function () {
  let SOUND = true;
  let actx = null;

  function ensure() {
    try {
      if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === 'suspended' && actx.resume) actx.resume();
    } catch (e) { /* no audio available */ }
    return actx;
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

  // One-time unlock on the first real user interaction (mobile autoplay policy).
  if (typeof window !== 'undefined') {
    function unlockOnce() {
      ensure();
      ['pointerdown', 'touchend', 'mousedown', 'keydown'].forEach(ev => window.removeEventListener(ev, unlockOnce));
    }
    ['pointerdown', 'touchend', 'mousedown', 'keydown'].forEach(ev => window.addEventListener(ev, unlockOnce, { passive: true }));
  }

  return {
    tone,
    unlock()  { ensure(); },
    state()   { return actx ? actx.state : 'none'; },
    blip()    { tone(1200, 0.015, 'square'); },
    chirp()   { [760, 920, 1180, 980].forEach((f, i) => tone(f, 0.09, 'sine', i * 0.06)); },
    fanfare() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.2, 'triangle', i * 0.12)); },
    win()     { [523, 659, 784].forEach((f, i) => tone(f, 0.12, 'square', i * 0.07)); },
    buzz()    { tone(150, 0.18, 'sawtooth'); },
    toggle()  { SOUND = !SOUND; if (SOUND) { ensure(); this.blip(); } return SOUND; },
    set(on)   { SOUND = !!on; },
    get on()  { return SOUND; }
  };
})();
