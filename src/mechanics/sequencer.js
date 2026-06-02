/* sequencer.js — Ch4 "Logic Lake" mechanic. She programs BYTE across stepping-stones
   by stacking move blocks in the right ORDER, then RUN. Wrong order = a gentle splash
   and a retry (debugging). A long final crossing reveals the REPEAT block — one block
   doing the work of many (loops). Lesson: sequence, order, cause/effect, loops. */
window.PR = window.PR || {};
PR.mechanics = PR.mechanics || {};

PR.mechanics.sequencer = (function () {
  const STEP = 44, SZ = 38, PAD = 8, WO = (SZ - 30) / 2;
  const LAKE = PAD * 2 + (5 - 1) * STEP + SZ; // fits a 5-wide grid exactly
  const DELTA = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
  const GLYPH = { L: '⬅', R: '➡', U: '⬆', D: '⬇' };

  // Level 1 has two routes she can choose between (the live CYOA).
  const ROUTES = {
    east: { title: 'The low road', start: [0, 4], goal: [2, 2],
            stones: ['0,4', '1,4', '2,4', '2,3', '2,2'], sol: 'R R U U' },
    west: { title: 'The high road', start: [0, 4], goal: [2, 2],
            stones: ['0,4', '0,3', '0,2', '1,2', '2,2'], sol: 'U U R R' }
  };
  // Level 2: a long straight crossing — the loop level.
  const LOOP_LEVEL = { title: 'The long crossing', start: [0, 2], goal: [4, 2],
                       stones: ['0,2', '1,2', '2,2', '3,2', '4,2'], loop: { dir: 'R', n: 4 } };

  function run(api, config, done) {
    const layer = api.layer;
    layer.innerHTML = '';
    chooser();

    function chooser() {
      const s = document.createElement('div'); s.className = 'stage';
      s.innerHTML = '<div class="stage-title">' + api.state.buddy.name + ' must cross. Which way?</div>';
      const g = document.createElement('div'); g.className = 'gallery';
      [['east', '🪨➡'], ['west', '🪨⬆']].forEach(([k, ico]) => {
        const c = document.createElement('div'); c.className = 'gcard';
        c.innerHTML = '<div class="ico">' + ico + '</div><div class="gname">' + ROUTES[k].title + '</div>';
        c.onclick = () => { PR.audio.tone(880, 0.06); s.remove(); playLevel(ROUTES[k], false, () => intermission()); };
        g.appendChild(c);
      });
      s.appendChild(g); layer.appendChild(s);
    }

    function intermission() {
      const s = document.createElement('div'); s.className = 'stage';
      s.innerHTML =
        '<div class="stage-title">One crossing left — and it\'s LONG!<br>' +
        'A Builder doesn\'t tap the same step over and over.<br>' +
        'Use the 🔁 LOOP block to do it all at once.</div>' +
        '<button class="summon" id="go" style="max-width:240px">NEXT CROSSING ▶</button>';
      layer.appendChild(s);
      s.querySelector('#go').onclick = () => { PR.audio.tone(659); s.remove(); playLevel(LOOP_LEVEL, true, () => finish()); };
    }

    function finish() { PR.rain.surge(3); PR.creature.sparkleBurst(api.device, 18); setTimeout(() => done(true), 700); }

    // ---- play one crossing ----
    function playLevel(level, withRepeat, onWin) {
      const stones = new Set(level.stones);
      const prog = []; // blocks: {t:'move',dir} | {t:'loop',dir,n}
      let solved = false; // latch so a double-tap on RUN after a win can't fire onWin twice

      const s = document.createElement('div'); s.className = 'stage';
      // top-to-bottom + scrollable so the lake never overlaps the controls
      s.style.cssText = 'top:7%;bottom:12px;justify-content:flex-start;overflow-y:auto;gap:7px;padding:8px 6px';
      s.innerHTML = '<div class="stage-title">' + level.title + ' — stack the steps, then RUN</div>';

      const lake = document.createElement('div'); lake.className = 'lake';
      lake.style.width = LAKE + 'px'; lake.style.height = LAKE + 'px'; lake.style.flex = '0 0 auto';
      lake.style.setProperty('--sz', SZ + 'px');
      stones.forEach(key => {
        const [x, y] = key.split(',').map(Number);
        const st = document.createElement('div');
        st.className = 'stone path' + (key === level.goal.join(',') ? ' goal' : '');
        st.style.left = px(x) + 'px'; st.style.top = px(y) + 'px';
        lake.appendChild(st);
      });
      const walker = document.createElement('div'); walker.className = 'walker';
      placeWalker(level.start);
      lake.appendChild(walker);

      const strip = document.createElement('div'); strip.className = 'program';
      const tools = document.createElement('div'); tools.className = 'opts'; tools.style.justifyContent = 'center';

      if (!withRepeat) {
        // normal crossing: stack single moves in order
        ['L', 'R', 'U', 'D'].forEach(d => {
          const b = document.createElement('button'); b.textContent = GLYPH[d];
          b.onclick = () => { prog.push({ t: 'move', dir: d }); PR.audio.tone(700, 0.04); renderStrip(); };
          tools.appendChild(b);
        });
      } else {
        // loop crossing: the 🔁 LOOP block is the ONLY tool — so discovering loops is the real solution
        const b = document.createElement('button'); b.textContent = '🔁 ' + GLYPH[level.loop.dir] + ' ×' + level.loop.n;
        b.style.borderColor = 'var(--glow-soft)';
        b.onclick = () => { prog.push({ t: 'loop', dir: level.loop.dir, n: level.loop.n }); PR.audio.tone(1000, 0.06); renderStrip(); };
        tools.appendChild(b);
      }
      const undo = document.createElement('button'); undo.textContent = '⌫';
      undo.onclick = () => { prog.pop(); PR.audio.tone(400, 0.04); renderStrip(); };
      tools.appendChild(undo);

      const run = document.createElement('button'); run.className = 'summon'; run.textContent = '▶ RUN'; run.style.maxWidth = '160px';
      const ctrls = document.createElement('div'); ctrls.style.cssText = 'display:flex;gap:8px;align-items:center;margin-top:6px';
      ctrls.appendChild(run);

      s.appendChild(lake); s.appendChild(strip); s.appendChild(tools); s.appendChild(ctrls);
      layer.appendChild(s);

      function renderStrip() {
        strip.innerHTML = '';
        prog.forEach(b => {
          const e = document.createElement('div');
          e.className = 'blk' + (b.t === 'loop' ? ' rep' : '');
          e.textContent = b.t === 'loop' ? ('🔁' + GLYPH[b.dir] + '×' + b.n) : GLYPH[b.dir];
          strip.appendChild(e);
        });
      }

      function expand() {
        const out = [];
        prog.forEach(b => { if (b.t === 'loop') for (let i = 0; i < b.n; i++) out.push(b.dir); else out.push(b.dir); });
        return out;
      }

      function setRunning(on) { tools.querySelectorAll('button').forEach(b => b.disabled = on); run.disabled = on; }

      run.onclick = () => {
        if (solved) return;
        const steps = expand();
        if (!steps.length) return;
        setRunning(true);
        let pos = level.start.slice(), i = 0;
        const tick = () => {
          if (i >= steps.length) { setRunning(false); return arrive(pos); }
          const d = DELTA[steps[i]];
          const nx = [pos[0] + d[0], pos[1] + d[1]];
          if (!stones.has(nx.join(','))) { return splash(nx, pos); }
          pos = nx; placeWalker(pos); PR.audio.tone(620 + i * 40, 0.05); i++;
          setTimeout(tick, 380);
        };
        setTimeout(tick, 200);
      };

      function arrive(pos) {
        if (pos.join(',') === level.goal.join(',')) {
          if (solved) return; solved = true;
          PR.audio.fanfare(); walker.style.boxShadow = '0 0 26px var(--glow)';
          PR.creature.sparkleBurst(api.device, 12);
          setTimeout(() => { s.remove(); onWin(); }, 900);
        } else {
          // valid stones but not the goal — gentle nudge, keep her program to edit (debug)
          PR.audio.buzz();
          flashMsg(s, 'So close — that\'s not the star yet. Tweak the order!');
          setTimeout(() => { placeWalker(level.start); setRunning(false); }, 700);
        }
      }
      function splash(into, from) {
        placeWalker(into); walker.classList.add('fall'); PR.audio.buzz();
        flashMsg(s, '💦 Splash! No stone there. Fix the steps and try again.');
        setTimeout(() => { walker.classList.remove('fall'); placeWalker(level.start); setRunning(false); }, 750);
      }

      function placeWalker(p) { walker.style.left = (px(p[0]) + WO) + 'px'; walker.style.top = (px(p[1]) + WO) + 'px'; }
    }
  }

  function px(c) { return PAD + c * STEP; }

  function flashMsg(stage, text) {
    let m = stage.querySelector('.seqmsg');
    if (!m) { m = document.createElement('div'); m.className = 'seqmsg stage-title'; m.style.fontSize = '15px'; stage.insertBefore(m, stage.children[1]); }
    m.textContent = text;
    setTimeout(() => { if (m) m.textContent = ''; }, 2200);
  }

  return { run };
})();
