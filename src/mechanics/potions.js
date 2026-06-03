/* potions.js — "Potions Lab" science mini-game. She mixes PRIMARY color drops
   (red/blue/yellow) in a bubbling cauldron to make the SECONDARY color on the recipe
   (red+blue=purple, blue+yellow=green, red+yellow=orange). Real color science +
   following a recipe + predict/observe. Lots of pour/bubble/steam animation + sounds. */
window.PR = window.PR || {};
PR.mechanics = PR.mechanics || {};

PR.mechanics.potions = (function () {
  const PRIM = { red: '#ff3b3b', blue: '#3b7bff', yellow: '#ffe23b' };
  const MIX = {
    'red': '#ff3b3b', 'blue': '#3b7bff', 'yellow': '#ffe23b',
    'blue,red': '#9b3bff',       // purple
    'blue,yellow': '#33cc55',    // green
    'red,yellow': '#ff8c1a',     // orange
    'blue,red,yellow': '#7a5230' // brown — too many!
  };
  const ROUNDS = [
    { name: 'PURPLE', color: '#9b3bff', recipe: 'Red + Blue = PURPLE!' },
    { name: 'GREEN',  color: '#33cc55', recipe: 'Blue + Yellow = GREEN!' },
    { name: 'ORANGE', color: '#ff8c1a', recipe: 'Red + Yellow = ORANGE!' }
  ];

  function run(api, config, done) {
    const layer = api.layer; layer.innerHTML = '';
    let ri = 0, set = new Set(), busy = false;
    const lab = document.createElement('div'); lab.className = 'lab'; layer.appendChild(lab);
    render();

    function render() {
      set = new Set(); busy = false;
      const r = ROUNDS[ri];
      lab.innerHTML =
        '<div class="target">Make a <b style="color:' + r.color + ';text-shadow:0 0 10px ' + r.color + '">' + r.name +
          '</b> potion <span class="tswatch" style="background:' + r.color + '"></span> <span class="rcount">' + (ri + 1) + '/3</span></div>' +
        '<div class="cauldron"><div class="rim"></div><div class="brew empty" id="brew"></div><div class="bubz" id="bubz"></div><div class="steamz" id="steam"></div></div>' +
        '<div class="bottles" id="bottles"></div>' +
        '<button class="summon" id="dump" style="max-width:220px;margin-top:30px">↻ Pour it out</button>' +
        '<div class="labmsg" id="msg">Tap two color bottles to mix them!</div>';
      const bottles = lab.querySelector('#bottles');
      Object.entries(PRIM).forEach(([k, c]) => {
        const b = document.createElement('div'); b.className = 'bottle'; b.style.background = c;
        b.innerHTML = '<div class="neck"></div><div class="lab-name">' + k.toUpperCase() + '</div>';
        b.onclick = () => addDrop(k, c);
        bottles.appendChild(b);
      });
      lab.querySelector('#dump').onclick = dump;
    }

    function colorNow() { if (!set.size) return null; return MIX[[...set].sort().join(',')] || '#7a5230'; }

    function addDrop(k, c) {
      if (busy || set.has(k)) return;
      busy = true; // lock the whole pour so a fast double-tap can't double-resolve a round
      set.add(k); glug(k);
      const caul = lab.querySelector('.cauldron');
      const drop = document.createElement('div'); drop.className = 'pourdrop'; drop.style.background = c;
      drop.style.left = 'calc(50% - 8px)'; drop.style.top = '-24px';
      caul.appendChild(drop);
      requestAnimationFrame(() => { drop.style.transition = 'top .45s cubic-bezier(.5,0,1,1)'; drop.style.top = '34px'; });
      setTimeout(() => { drop.remove(); applyColor(); }, 470);
    }

    function applyColor() {
      const brew = lab.querySelector('#brew');
      brew.classList.remove('empty'); brew.style.background = colorNow();
      spawnBubbles(6); pop();
      const won = check();
      if (!won) busy = false; // win() keeps the lock through the round transition
    }

    function check() {
      const r = ROUNDS[ri];
      if (colorNow() === r.color) { win(r); return true; }
      if (set.size >= 3) { msg('Whoa — too many colors makes BROWN! Tap "Pour it out" and try again.'); PR.audio.tone(300, 0.16, 'sine'); PR.audio.tone(220, 0.18, 'sine', 0.08); }
      else { msg('Nice! Now add ONE more color...'); PR.audio.tone(760, 0.07, 'sine'); }
      return false;
    }

    function win(r) {
      busy = true; msg('✨ ' + r.recipe + ' ✨');
      PR.audio.fanfare(); steamBurst(); spawnBubbles(16); PR.creature.sparkleBurst(api.device, 18);
      if (api.flashGo) api.flashGo();
      setTimeout(() => { ri++; if (ri >= ROUNDS.length) { lab.remove(); done(true); } else render(); }, 1900);
    }

    function dump() {
      if (busy) return;
      set = new Set();
      const brew = lab.querySelector('#brew'); brew.classList.add('empty'); brew.style.background = '';
      msg('Poured it out! Try again.'); PR.audio.tone(320, 0.18, 'sine'); PR.audio.tone(220, 0.2, 'sine', 0.1);
    }

    function msg(t) { const m = lab.querySelector('#msg'); if (m) m.textContent = t; }
    function spawnBubbles(n) {
      const z = lab.querySelector('#bubz'); if (!z) return;
      for (let i = 0; i < n; i++) {
        const b = document.createElement('div'); b.className = 'bubble';
        b.style.left = (16 + Math.random() * 66) + '%';
        b.style.animationDuration = (0.8 + Math.random() * 0.8) + 's';
        const s = (8 + Math.random() * 12) | 0; b.style.width = b.style.height = s + 'px';
        z.appendChild(b); setTimeout(() => b.remove(), 1700);
      }
    }
    function steamBurst() {
      const z = lab.querySelector('#steam'); if (!z) return;
      for (let i = 0; i < 6; i++) {
        const s = document.createElement('div'); s.className = 'steam';
        s.style.left = (12 + i * 14) + '%'; s.style.animationDelay = (i * 0.08) + 's';
        z.appendChild(s); setTimeout(() => s.remove(), 2100);
      }
    }
    function glug(k) { const base = k === 'red' ? 480 : k === 'blue' ? 560 : 660; PR.audio.tone(base, 0.08, 'sine'); PR.audio.tone(base - 150, 0.1, 'sine', 0.08); PR.audio.tone(base - 250, 0.12, 'sine', 0.16); }
    function pop() { PR.audio.tone(900, 0.04, 'sine'); PR.audio.tone(1200, 0.04, 'sine', 0.05); }
  }

  return { run };
})();
