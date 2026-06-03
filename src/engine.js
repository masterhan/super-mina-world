/* engine.js — the heart. A chapter is DATA: an ordered list of `scenes`. The engine
   walks them; each scene `type` has a handler that renders, waits for the player, then
   calls next(). New chapters = new data files; new kinds of beats = new handlers here.

   Bespoke one-off beats can be authored inline as { type:'fn', run(api, next) } so a
   chapter file stays in charge of its own special moments without bloating the engine. */
window.PR = window.PR || {};
PR.chapters = PR.chapters || {};

PR.engine = (function () {
  // ---- shared state (persisted on-device via save.js) ----
  PR.state = {
    player: { name: 'BUILDER' },
    buddy:  { form: 'puff', eyes: 'sparkle', color: 'cyan', marks: 'none', name: 'BYTE' },
    badges: [],
    chapter: 1,
    choices: {},
    nextBuild: null,
    stars: {}
  };

  let device, layer, flash, A;

  function persist() {
    PR.save.write({
      player: PR.state.player, buddy: PR.state.buddy,
      badges: PR.state.badges, chapter: PR.state.chapter,
      choices: PR.state.choices, nextBuild: PR.state.nextBuild,
      stars: PR.state.stars
    });
  }

  function loadSaved() {
    const s = PR.save.load();
    if (!s) return;
    if (s.player) PR.state.player = s.player;
    if (s.buddy)  PR.state.buddy  = Object.assign(PR.state.buddy, s.buddy);
    // clamp persisted creature config to known options (guards a stale/garbled save)
    const B = PR.state.buddy, S = PR.creature.SETS;
    if (!S.form.includes(B.form)) B.form = 'puff';
    if (!S.eyes.includes(B.eyes)) B.eyes = 'sparkle';
    if (!S.marks.includes(B.marks)) B.marks = 'none';
    if (!PR.creature.COLORS[B.color]) B.color = 'cyan';
    if (Array.isArray(s.badges)) PR.state.badges = s.badges;
    if (s.choices) PR.state.choices = s.choices;
    if (s.nextBuild) PR.state.nextBuild = s.nextBuild;
    if (s.stars && typeof s.stars === 'object') PR.state.stars = s.stars;
  }

  // ---- BYTE on screen (persists across scenes once summoned) ----
  function showBuddy(extra) {
    let c = layer.querySelector('.creature');
    if (!c) { c = PR.creature.node(PR.state.buddy, extra || ''); layer.appendChild(c); }
    return c;
  }
  function hideBuddy() { const c = layer.querySelector('.creature'); if (c) c.remove(); }
  function nameTag() {
    let t = layer.querySelector('.name-pill');
    if (!t) { t = document.createElement('div'); t.className = 'name-pill'; layer.appendChild(t); }
    t.textContent = PR.state.buddy.name;
    return t;
  }

  function center(cls, inner) {
    const c = document.createElement('div');
    c.className = 'center ' + cls;
    c.innerHTML = inner;
    layer.appendChild(c);
    return c;
  }
  function flashGo() { flash.classList.add('go'); setTimeout(() => flash.classList.remove('go'), 550); }

  // =========================================================================
  // scene handlers — each: (scene, next) => void
  // =========================================================================
  const handlers = {
    wake(scene, next) {
      layer.innerHTML = ''; PR.world.clear(); PR.rain.surge(0.4);
      const c = center('wake', '<div class="dot"></div><div class="tap">▶ tap to wake the Realm</div>');
      c.onclick = () => { PR.audio.tone(220, 0.3, 'sine'); c.remove(); next(); };
    },

    boot(scene, next) {
      PR.rain.surge(6);
      let beat = 0;
      const id = setInterval(() => { PR.audio.tone(300 + beat * 90, 0.06, 'square'); beat++; if (beat > 6) clearInterval(id); }, 90);
      setTimeout(() => { flashGo(); PR.audio.fanfare(); next(); }, 1500);
    },

    title(scene, next) {
      layer.innerHTML = '';
      const html =
        (scene.chapter ? '<div class="ch">' + scene.chapter + '</div>' : '') +
        '<h1>' + (scene.title || '').replace(/\n/g, '<br>') + '</h1>' +
        (scene.region ? '<div class="ch">' + scene.region + '</div>' : '') +
        '<div class="press">▶ ' + (scene.press || 'PRESS START') + '</div>';
      const t = center('title', html);
      t.onclick = () => { PR.audio.tone(523); PR.audio.tone(784, 0.14, 'square', 0.1); t.remove(); next(); };
    },

    nameEntry(scene, next) {
      layer.innerHTML = ''; PR.rain.surge(1.2);
      const npc = PR.npc.show('cipher', layer);
      const p = document.createElement('div'); p.className = 'panel';
      p.innerHTML =
        '<div class="speaker">CIPHER</div>' +
        '<div class="line" style="margin-bottom:9px">' + (scene.prompt || 'Hello,') + '</div>' +
        '<input id="pn" maxlength="10" placeholder="type your name">' +
        '<button class="summon" id="ok">OK ▶</button>';
      layer.appendChild(p);
      const pn = p.querySelector('#pn'); pn.focus();
      const go = () => {
        const v = pn.value.trim(); if (!v) return;
        PR.state.player.name = v.toUpperCase(); persist();
        PR.audio.tone(659); npc.remove(); p.remove(); next();
      };
      p.querySelector('#ok').onclick = go;
      pn.addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
    },

    dialogue(scene, next) {
      PR.dialogue({
        speaker: scene.speaker, lines: lines(scene.lines), character: scene.character,
        choices: scene.choices, layer, device, api: A,
        onDone: (chosen) => { if (chosen && scene.remember) PR.state.choices[scene.remember] = chosen.label; persist(); next(); }
      });
    },

    creator(scene, next) {
      layer.innerHTML = ''; PR.creature.applyGlow(PR.state.buddy.color);
      placePreview();
      const p = document.createElement('div'); p.className = 'panel';
      p.style.cssText = 'top:30%;bottom:10px;overflow:auto';   // scroll so every option + SUMMON is reachable on a phone
      p.innerHTML =
        '<div class="q">FORM:</div><div class="opts" data-k="form"></div>' +
        '<div class="q" style="margin-top:7px">EYES:</div><div class="opts" data-k="eyes"></div>' +
        '<div class="q" style="margin-top:7px">MARKINGS:</div><div class="opts" data-k="marks"></div>' +
        '<div class="q" style="margin-top:7px">LIGHT:</div><div class="opts" data-k="color"></div>' +
        '<div class="q" style="margin-top:7px">NAME:</div><input id="nm" maxlength="8" value="' + PR.state.buddy.name + '">' +
        '<button class="summon" id="go">✦ SUMMON ✦</button>';
      layer.appendChild(p);

      ['form', 'eyes', 'marks'].forEach(k => {
        const row = p.querySelector('[data-k="' + k + '"]');
        PR.creature.SETS[k].forEach(v => {
          const b = document.createElement('button'); b.textContent = v.toUpperCase();
          if (PR.state.buddy[k] === v) b.classList.add('sel');
          b.onclick = () => {
            PR.state.buddy[k] = v; PR.audio.tone(880, 0.05);
            row.querySelectorAll('button').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
            redrawCreature();
          };
          row.appendChild(b);
        });
      });
      const crow = p.querySelector('[data-k="color"]');
      Object.entries(PR.creature.COLORS).forEach(([k, c]) => {
        const b = document.createElement('button'); b.className = 'swatch';
        b.style.background = c[0]; b.style.boxShadow = '0 0 12px ' + c[0];
        if (PR.state.buddy.color === k) b.classList.add('sel');
        b.onclick = () => {
          PR.state.buddy.color = k; PR.creature.applyGlow(k); PR.audio.tone(700, 0.06);
          crow.querySelectorAll('button').forEach(x => x.classList.remove('sel')); b.classList.add('sel');
          redrawCreature();
        };
        crow.appendChild(b);
      });

      const nm = p.querySelector('#nm');
      nm.addEventListener('input', () => { PR.state.buddy.name = (nm.value.trim() || 'BYTE').toUpperCase(); });
      p.querySelector('#go').onclick = () => {
        PR.state.buddy.name = (nm.value.trim() || 'BYTE').toUpperCase();
        PR.audio.tone(523); persist(); p.remove(); next();
      };

      function placePreview() {
        const c = PR.creature.node(PR.state.buddy);
        c.style.bottom = 'auto'; c.style.top = '8px';   // pin the live preview to the top, clear of the scrolling panel
        layer.appendChild(c);
      }
      function redrawCreature() {
        const old = layer.querySelector('.creature'); if (old) old.remove();
        placePreview();
      }
    },

    summon(scene, next) {
      layer.innerHTML = ''; PR.creature.applyGlow(PR.state.buddy.color); PR.rain.surge(4);
      const crit = PR.creature.node(PR.state.buddy, 'spawn');
      crit.classList.remove('float'); layer.appendChild(crit);
      for (let i = 0; i < 8; i++) PR.audio.tone(400 + i * 80, 0.07, 'sine', i * 0.12);
      setTimeout(() => {
        flashGo(); PR.audio.chirp(); PR.creature.sparkleBurst(device, 16);
        crit.classList.add('float'); nameTag();
      }, 1400);
      setTimeout(next, 2400);
    },

    world(scene, next) {
      if (scene.action === 'build') { PR.world.build(); PR.world.show(); }
      else if (scene.action === 'show') PR.world.show();
      else if (scene.action === 'lit') PR.world.lit();
      next();
    },

    command(scene, next) {
      const count = scene.count || 3;
      showBuddy(); // guarantee BYTE is on screen (and reachable for the LEAP animation)
      const p = document.createElement('div'); p.className = 'panel';
      p.innerHTML = '<div class="q">' + (scene.prompt || ('Tap a command for ' + PR.state.buddy.name + '!  (try them all)')) + '</div><div class="opts" id="cmd"></div>';
      layer.appendChild(p);
      const cmds = [
        { t: '✦ SPARK', run() { PR.world.ring(device); PR.audio.chirp(); } },
        { t: '⬆ LEAP',  run() { const crit = layer.querySelector('.creature'); if (crit) { crit.classList.add('cheer'); setTimeout(() => crit.classList.remove('cheer'), 600); } PR.audio.tone(523, 0.1); PR.audio.tone(880, 0.14, 'sine', 0.1); } },
        { t: '☀ SHINE', run() { PR.world.ring(device); PR.audio.tone(700, 0.1); PR.audio.tone(1100, 0.16, 'triangle', 0.1); } }
      ];
      let lit = 0;
      const wrap = p.querySelector('#cmd');
      cmds.forEach(c => {
        const b = document.createElement('button'); b.textContent = c.t;
        b.onclick = () => {
          c.run(); PR.creature.sparkleBurst(device, 6); PR.rain.surge(2.4); lit++;
          if (lit >= count) { PR.world.lit(); setTimeout(() => { p.remove(); next(); }, 900); }
        };
        wrap.appendChild(b);
      });
    },

    mechanic(scene, next) {
      layer.innerHTML = '';
      const m = PR.mechanics[scene.name];
      if (!m) { console.error('unknown mechanic', scene.name); next(); return; }
      m.run(A, scene.config || {}, (result) => {
        if (scene.store) { PR.state[scene.store] = result; persist(); }
        next();
      });
    },

    badge(scene, next) {
      PR.badge.award({ index: scene.index, name: scene.name, icon: scene.icon }, A, next);
    },

    buddy(scene, next) {
      if (scene.action === 'hide') hideBuddy();
      else showBuddy();   // no name-pill here — it would overlap the Cipher avatar during dialogue
      next();
    },

    end(scene, next) {
      layer.innerHTML = '';
      const html =
        '<h1 style="font-size:14px">' + (scene.title || 'TO BE<br>CONTINUED').replace(/\n/g, '<br>') + '</h1>' +
        (scene.sub ? '<div class="ch">' + scene.sub + '</div>' : '') +
        '<div class="ch" style="margin-top:6px">' + PR.state.buddy.name + ' &amp; ' + PR.state.player.name + '</div>' +
        '<div class="press" style="margin-top:10px;font-size:9px">▶ ' + (scene.press || 'CONTINUE') + '</div>';
      const t = center('title', html);
      t.onclick = () => { PR.audio.tone(659); t.remove(); next(); };
    },

    fn(scene, next) { scene.run(A, next); },

    map(scene, next) { PR.map.show(A); }   // the overworld map takes over the flow from here
  };

  // lines may be an array, or a function(state) returning an array (for name interpolation)
  function lines(l) { return (typeof l === 'function') ? l(PR.state) : l; }

  // =========================================================================
  // scene loop + chapter chaining
  // =========================================================================
  let cur = null;
  function newGamePlus() {
    PR.state.badges = []; PR.state.nextBuild = null; PR.state.chapter = 1; PR.state.stars = {};
    persist(); run(PR.chapters.chapter1);
  }
  function run(chapter) {
    cur = chapter;
    if (chapter.chapterNum) PR.state.chapter = chapter.chapterNum;
    persist();
    step(0);
  }
  function step(i) {
    if (i >= cur.scenes.length) {
      if (cur.next && PR.chapters[cur.next]) return run(PR.chapters[cur.next]);
      return newGamePlus(); // no further content yet → New Game+ (reset progress so the badge case fills from empty again)
    }
    const scene = cur.scenes[i];
    const h = handlers[scene.type];
    if (!h) { console.error('unknown scene type', scene.type); return step(i + 1); }
    h(scene, () => step(i + 1));
  }

  // =========================================================================
  // boot
  // =========================================================================
  function boot() {
    device = document.getElementById('device');
    layer  = document.getElementById('layer');
    flash  = document.getElementById('flash');

    A = {
      state: PR.state, device, layer,
      audio: PR.audio, rain: PR.rain, world: PR.world,
      creature: PR.creature, npc: PR.npc, badge: PR.badge,
      dialogue: (o) => PR.dialogue(Object.assign({ layer, device, api: A }, o)),
      save: persist,
      clearLayer: () => { layer.innerHTML = ''; },
      flashGo, showBuddy, hideBuddy, nameTag,
      sparkle: (n) => PR.creature.sparkleBurst(device, n),
      goto: (id) => { if (PR.chapters[id]) run(PR.chapters[id]); },
      restart: newGamePlus
    };

    loadSaved();
    PR.creature.applyGlow(PR.state.buddy.color);
    PR.rain.init(document.getElementById('rain'), device);

    const snd = document.getElementById('snd');
    if (snd) snd.onclick = function () { this.textContent = PR.audio.toggle() ? '♪ ON' : '♪ OFF'; };

    run(PR.chapters.chapter1);
  }

  return { boot, run, get api() { return A; } };
})();
