/* minigames.js — the "Next Build" archetypes: tiny, REAL, playable games she can try
   right now, then pick one (and a theme) as the thing WE build next. Each is a simple,
   themeable canvas toy — Flappy flyer, jumper, catcher, maze. These double as the seeds
   for future "build your own game" chapters. Keep them simple. */
window.PR = window.PR || {};
PR.mechanics = PR.mechanics || {};

PR.mechanics.minigames = (function () {
  const ARCHETYPES = [
    { key: 'flappy', name: 'Flappy Flyer', ico: '🐦', sub: 'tap to fly',
      themes: [ { name: 'Birdie', char: '🐦' }, { name: 'Alien', char: '👾' }, { name: 'Rocket', char: '🚀' } ] },
    { key: 'jumper', name: 'Jumper', ico: '🦖', sub: 'tap to jump',
      themes: [ { name: 'Dino', char: '🦖', item: '🌵' }, { name: 'Runner', char: '🏃', item: '🔥' }, { name: 'Cat', char: '🐱', item: '📦' } ] },
    { key: 'catch', name: 'Catcher', ico: '🧺', sub: 'slide to catch',
      themes: [ { name: 'Apples', char: '🧺', item: '🍎' }, { name: 'Stars', char: '🥅', item: '⭐' }, { name: 'Candy', char: '🥣', item: '🍬' } ] },
    { key: 'maze', name: 'Maze Run', ico: '🌀', sub: 'find the exit',
      themes: [ { name: 'Ghost', char: '👻' }, { name: 'Mouse', char: '🐭' }, { name: 'Bot', char: '🤖' } ] }
  ];

  function glow() { return getComputedStyle(document.documentElement).getPropertyValue('--glow').trim() || '#3df2ff'; }

  // play a demo. cbs = { onBack, onPick }
  function play(api, sel, cbs) {
    const A = ARCHETYPES.find(a => a.key === sel.key);
    const theme = (A.themes.find(t => t.name === sel.theme)) || A.themes[0];

    const mg = document.createElement('div'); mg.className = 'mg';
    const hud = document.createElement('div'); hud.className = 'mghud'; hud.textContent = A.name;
    const cv = document.createElement('canvas'); cv.className = 'mgc'; cv.width = 250; cv.height = 250;
    const hint = document.createElement('div'); hint.className = 'mgtap'; hint.textContent = A.sub;
    const bar = document.createElement('div'); bar.className = 'panel'; bar.style.cssText = 'display:flex;gap:8px';
    bar.innerHTML = '<button id="back" style="flex:1">↺ TRY ANOTHER</button><button id="pick" class="summon" style="flex:1;margin:0">✓ BUILD THIS</button>';
    mg.appendChild(hud); mg.appendChild(cv); mg.appendChild(hint);
    api.layer.appendChild(mg); api.layer.appendChild(bar);

    const ctx = cv.getContext('2d');
    const setHud = (t) => hud.textContent = t;
    const stop = GAMES[sel.key](cv, ctx, cv.width, cv.height, theme, setHud, mg);

    function cleanup() { stop(); mg.remove(); bar.remove(); }
    bar.querySelector('#back').onclick = () => { PR.audio.tone(500, 0.05); cleanup(); cbs.onBack(); };
    bar.querySelector('#pick').onclick = () => { PR.audio.tone(880, 0.08); cleanup(); cbs.onPick(theme); };
  }

  // ===================== the games =====================
  const GAMES = {
    flappy(cv, ctx, w, h, theme, hud) {
      let by = h / 2, vy = 0, pipes = [], score = 0, t = 0, raf;
      const GAP = 86, PW = 32, SPEED = 1.6, G = 0.34, JUMP = -5.4, BX = w * 0.3, BR = 11;
      function reset() { by = h / 2; vy = 0; pipes = []; score = 0; t = 0; hud('Tap to fly!'); }
      function loop() {
        t++; if (t % 92 === 0) pipes.push({ x: w, top: 24 + Math.random() * (h - GAP - 60), s: false });
        vy += G; by += vy;
        pipes.forEach(p => p.x -= SPEED); pipes = pipes.filter(p => p.x > -PW);
        pipes.forEach(p => {
          if (!p.s && p.x + PW < BX) { p.s = true; score++; hud('Score ' + score); PR.audio.tone(1000, 0.04); }
          if (BX + BR > p.x && BX - BR < p.x + PW && (by - BR < p.top || by + BR > p.top + GAP)) dead();
        });
        if (by > h - 6 || by < 4) dead();
        draw(); raf = requestAnimationFrame(loop);
      }
      function dead() { PR.audio.buzz(); reset(); }
      function draw() {
        ctx.fillStyle = '#06080f'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = glow();
        pipes.forEach(p => { ctx.fillRect(p.x, 0, PW, p.top); ctx.fillRect(p.x, p.top + GAP, PW, h - p.top - GAP); });
        ctx.font = '26px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(theme.char, BX, by);
      }
      const tap = () => { vy = JUMP; PR.audio.tone(720, 0.04); };
      cv.addEventListener('pointerdown', tap);
      reset(); loop();
      return () => { cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', tap); };
    },

    jumper(cv, ctx, w, h, theme, hud) {
      const GY = h - 34; let y = GY, vy = 0, obs = [], score = 0, t = 0, raf, ground = true;
      const G = 0.5, JUMP = -8.4, SPEED = 2.1, CX = w * 0.22;
      function loop() {
        t++; if (t % 78 === 0) obs.push({ x: w, s: false });
        vy += G; y += vy; if (y >= GY) { y = GY; vy = 0; ground = true; }
        obs.forEach(o => o.x -= SPEED); obs = obs.filter(o => o.x > -22);
        obs.forEach(o => {
          if (!o.s && o.x + 14 < CX) { o.s = true; score++; hud('Score ' + score); PR.audio.tone(1000, 0.04); }
          if (Math.abs(o.x - CX) < 15 && y > GY - 20) { PR.audio.buzz(); obs = []; score = 0; hud('Score 0'); }
        });
        draw(); raf = requestAnimationFrame(loop);
      }
      function draw() {
        ctx.fillStyle = '#06080f'; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = glow(); ctx.fillRect(0, GY + 16, w, 3);
        ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
        obs.forEach(o => ctx.fillText(theme.item, o.x, GY + 14));
        ctx.font = '28px serif'; ctx.fillText(theme.char, CX, y + 8);
      }
      const tap = () => { if (ground) { vy = JUMP; ground = false; PR.audio.tone(700, 0.05); } };
      cv.addEventListener('pointerdown', tap);
      hud('Tap to jump!'); loop();
      return () => { cancelAnimationFrame(raf); cv.removeEventListener('pointerdown', tap); };
    },

    catch(cv, ctx, w, h, theme, hud) {
      let bx = w / 2, items = [], score = 0, t = 0, raf;
      function loop() {
        t++; if (t % 46 === 0) items.push({ x: 22 + Math.random() * (w - 44), y: -10, v: 1.4 + Math.random() * 1.2 });
        items.forEach(it => it.y += it.v);
        items = items.filter(it => {
          if (it.y > h - 28 && Math.abs(it.x - bx) < 26) { score++; hud('Caught ' + score); PR.audio.tone(1000, 0.04); return false; }
          return it.y < h + 12;
        });
        draw(); raf = requestAnimationFrame(loop);
      }
      function draw() {
        ctx.fillStyle = '#06080f'; ctx.fillRect(0, 0, w, h);
        ctx.font = '22px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        items.forEach(it => ctx.fillText(theme.item, it.x, it.y));
        ctx.font = '30px serif'; ctx.fillText(theme.char, bx, h - 18);
      }
      const move = (e) => { const r = cv.getBoundingClientRect(); bx = Math.max(16, Math.min(w - 16, (e.clientX - r.left) * (w / r.width))); };
      cv.addEventListener('pointermove', move); cv.addEventListener('pointerdown', move);
      hud('Caught 0'); loop();
      return () => { cancelAnimationFrame(raf); cv.removeEventListener('pointermove', move); cv.removeEventListener('pointerdown', move); };
    },

    maze(cv, ctx, w, h, theme, hud, container) {
      const N = 6, cell = Math.floor(Math.min(w, h) / N);
      const M = [
        [0,0,0,1,0,0],
        [1,1,0,1,0,1],
        [0,0,0,0,0,0],
        [0,1,1,1,1,0],
        [0,0,0,0,1,0],
        [1,1,1,0,0,0]
      ];
      let px = 0, py = 0; const gx = 5, gy = 5; let won = false, raf;
      function draw() {
        ctx.fillStyle = '#06080f'; ctx.fillRect(0, 0, w, h);
        const g = glow(); const off = 2;
        for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
          if (M[r][c]) { ctx.fillStyle = g; ctx.fillRect(c * cell + off, r * cell + off, cell - 2 * off, cell - 2 * off); }
        }
        ctx.font = Math.floor(cell * 0.7) + 'px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('🚪', gx * cell + cell / 2, gy * cell + cell / 2);
        ctx.fillText(theme.char, px * cell + cell / 2, py * cell + cell / 2);
        raf = requestAnimationFrame(draw);
      }
      function move(dx, dy) {
        if (won) return;
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || M[ny][nx]) { PR.audio.buzz(); return; }
        px = nx; py = ny; PR.audio.tone(720, 0.04);
        if (px === gx && py === gy) { won = true; PR.audio.fanfare(); hud('You made it! 🌟'); }
      }
      // raise the maze canvas and hide the generic tap-hint so the d-pad has clear room below it
      cv.style.top = '32%';
      const tip = container.querySelector('.mgtap'); if (tip) tip.style.display = 'none';
      // on-screen dpad, placed BELOW the canvas (not over it)
      const dp = document.createElement('div');
      dp.style.cssText = 'position:absolute;top:60%;left:50%;transform:translateX(-50%);z-index:9;display:grid;grid-template-columns:repeat(3,42px);grid-auto-rows:42px;gap:4px';
      const mk = (txt, dx, dy, col, row) => {
        const b = document.createElement('button'); b.textContent = txt;
        b.style.cssText = 'grid-column:' + col + ';grid-row:' + row + ';padding:0';
        b.onclick = () => move(dx, dy); return b;
      };
      dp.appendChild(mk('⬆', 0, -1, 2, 1));
      dp.appendChild(mk('⬅', -1, 0, 1, 2));
      dp.appendChild(mk('⬇', 0, 1, 2, 2));
      dp.appendChild(mk('➡', 1, 0, 3, 2));
      container.appendChild(dp);
      hud('Reach the door 🚪'); draw();
      return () => { cancelAnimationFrame(raf); dp.remove(); };
    }
  };

  return { ARCHETYPES, play };
})();
