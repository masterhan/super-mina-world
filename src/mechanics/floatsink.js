/* floatsink.js — "Splash Lab" science game. She PREDICTS whether an object will float
   or sink, then drops it in the water tank (splash!) and sees what really happens.
   Teaches buoyancy + the science habit of predict → test → observe. Kind: a wrong
   guess still shows the truth and explains why. Splash / bob / bubble animations + sounds. */
window.PR = window.PR || {};
PR.mechanics = PR.mechanics || {};

PR.mechanics.floatsink = (function () {
  const OBJ = [
    { e: '🍎', n: 'apple', f: true }, { e: '🪨', n: 'rock', f: false },
    { e: '🦆', n: 'rubber duck', f: true }, { e: '🔑', n: 'key', f: false },
    { e: '🍂', n: 'leaf', f: true }, { e: '⚓', n: 'anchor', f: false },
    { e: '🧊', n: 'ice cube', f: true }, { e: '🪙', n: 'coin', f: false },
    { e: '🚤', n: 'boat', f: true }, { e: '🥄', n: 'metal spoon', f: false },
    { e: '🪵', n: 'log', f: true }, { e: '🧱', n: 'brick', f: false },
    { e: '🏀', n: 'ball', f: true }, { e: '🔩', n: 'bolt', f: false },
    { e: '🥥', n: 'coconut', f: true }
  ];
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function run(api, config, done) {
    const layer = api.layer; layer.innerHTML = '';
    const N = Math.min(config.count || 6, OBJ.length);
    const items = shuffle(OBJ.slice()).slice(0, N);
    let idx = 0, got = 0, busy = false;
    const root = document.createElement('div'); root.className = 'splash'; layer.appendChild(root);
    render();

    function render() {
      busy = false;
      const it = items[idx];
      root.innerHTML =
        '<div class="case" id="dots"></div>' +
        '<div class="ask">Will the <b>' + it.n + '</b> ' + it.e + ' FLOAT or SINK?</div>' +
        '<div class="tank"><div class="tankwater"></div><div class="bub" id="bub"></div><div class="dropobj" id="obj">' + it.e + '</div></div>' +
        '<div class="opts">' +
          '<button id="float" style="font-family:VT323,monospace;font-size:24px;padding:14px 20px;border-radius:12px;border:3px solid #fff;cursor:pointer;color:#06243a;background:#5bdc7a">🛟 FLOATS</button>' +
          '<button id="sink" style="font-family:VT323,monospace;font-size:24px;padding:14px 20px;border-radius:12px;border:3px solid #fff;cursor:pointer;color:#fff;background:#3b7bff">⬇️ SINKS</button>' +
        '</div>' +
        '<div class="labmsg" id="msg">Make your guess!</div>';
      const dots = root.querySelector('#dots');
      for (let i = 0; i < N; i++) { const d = document.createElement('div'); d.className = 'slot' + (i < got ? ' on' : ''); dots.appendChild(d); }
      root.querySelector('#float').onclick = () => guess(true);
      root.querySelector('#sink').onclick = () => guess(false);
    }

    function guess(pred) {
      if (busy) return; busy = true;
      const it = items[idx];
      root.querySelectorAll('.opts button').forEach(b => b.disabled = true);
      const obj = root.querySelector('#obj');
      PR.audio.tone(700, 0.06);
      setTimeout(() => {
        splashFX(); PR.audio.tone(320, 0.12, 'sine'); PR.audio.tone(210, 0.14, 'sine', 0.06);
        if (it.f) { obj.style.top = '40%'; obj.classList.add('bob'); }
        else { obj.style.top = '70%'; bubbles(9); }
      }, 140);
      const correct = (pred === it.f);
      if (correct) got++;
      setTimeout(() => {
        const m = root.querySelector('#msg');
        if (correct) { PR.audio.win(); PR.creature.sparkleBurst(api.device, 10); m.textContent = 'Yes! The ' + it.n + (it.f ? ' FLOATS! 🎉' : ' SINKS! 🎉'); }
        else { PR.audio.buzz(); m.textContent = 'Ooh! The ' + it.n + (it.f ? ' actually FLOATS — light and full of air.' : ' actually SINKS — it\'s heavy and solid.'); }
        const dots = root.querySelectorAll('#dots .slot'); if (dots[idx] && correct) dots[idx].classList.add('on');
      }, 1150);
      setTimeout(() => { idx++; if (idx >= N) { root.remove(); done(got); } else render(); }, 2700);
    }

    function splashFX() {
      const tank = root.querySelector('.tank'); if (!tank) return;
      for (let i = 0; i < 10; i++) {
        const d = document.createElement('div'); d.className = 'droplet';
        d.style.left = '50%'; d.style.top = '38%';
        d.style.setProperty('--dx', ((Math.random() - 0.5) * 130) + 'px');
        d.style.setProperty('--dy', (-28 - Math.random() * 44) + 'px');
        tank.appendChild(d); setTimeout(() => d.remove(), 640);
      }
    }
    function bubbles(n) {
      const z = root.querySelector('#bub'); if (!z) return;
      for (let i = 0; i < n; i++) {
        const b = document.createElement('div'); b.className = 'bubble';
        b.style.left = (34 + Math.random() * 32) + '%';
        const s = (6 + Math.random() * 9) | 0; b.style.width = b.style.height = s + 'px';
        b.style.animationDuration = (0.9 + Math.random() * 0.6) + 's';
        z.appendChild(b); setTimeout(() => b.remove(), 1600);
      }
    }
  }
  return { run };
})();
