/* map.js — the bright OVERWORLD. After the intro she lands here and just taps a place
   to jump into a playable learning game. Each node returns to the map with a star.
   No "build later" — every node is hands-on. Lots of life: bobbing nodes, a "tap me"
   pulse on un-played spots, BYTE hopping, a celebration when the castle finally lights. */
window.PR = window.PR || {};

PR.map = (function () {
  const NODES = [
    { id: 'atlas', label: 'The Atlas', emoji: '🗺️', x: 18, y: 35, mech: 'quiz', cfg: { count: 12 },
      badge: 2, badgeName: 'ATLAS', icon: '🗺',
      intro: ['This is the ATLAS — the whole world on a giant map.', 'Name each land and its light comes back. A wrong tap just teaches you — no losing!'] },
    { id: 'potions', label: 'Potions Lab', emoji: '⚗️', x: 50, y: 24, mech: 'potions', cfg: {},
      badge: 5, badgeName: 'POTIONS', icon: '⚗️',
      intro: ['Welcome to the POTIONS LAB!', 'Mix two color drops to brew the potion on the recipe. That\'s real science!'] },
    { id: 'web', label: 'Webville', emoji: '🌐', x: 82, y: 35, mech: 'webbuilder', cfg: {},
      badge: 3, badgeName: 'WEB', icon: '🌐',
      intro: ['WEBVILLE wants a web page!', 'Stack the blocks and BUILD a real webpage that actually works.'] },
    { id: 'splash', label: 'Splash Lab', emoji: '💧', x: 50, y: 50, mech: 'floatsink', cfg: { count: 6 },
      badge: 7, badgeName: 'SPLASH', icon: '💧',
      intro: ['The SPLASH LAB — more science!', 'Guess if a thing will FLOAT or SINK... then drop it in and watch what happens!'] },
    { id: 'logic', label: 'Logic Lake', emoji: '🐸', x: 22, y: 66, mech: 'sequencer', cfg: {},
      badge: 4, badgeName: 'LOGIC', icon: '🔁',
      intro: (s) => ['LOGIC LAKE! Deep water, stepping-stones.', 'Tell ' + s.buddy.name + ' the steps IN ORDER to hop across. Find the LOOP!'] },
    { id: 'arcade', label: 'Arcade', emoji: '🎮', x: 78, y: 66, mech: '__arcade', cfg: {},
      badge: 6, badgeName: 'ARCADE', icon: '🎮',
      intro: ['The ARCADE — real games to PLAY!', 'Flap, jump, catch, or race a maze. Pick one and go!'] }
  ];

  let A, lastDone = null, bigWin = false;
  function isDone(id) { return !!(PR.state.stars && PR.state.stars[id]); }

  function show(api) {
    A = api;
    const layer = api.layer;
    layer.innerHTML = ''; PR.world.clear(); api.rain.surge(0.5);

    const map = document.createElement('div'); map.className = 'worldmap';
    map.innerHTML =
      '<div class="mapwater"></div>' +
      '<div class="mapcloud" style="left:8%;top:6%"></div><div class="mapcloud" style="left:64%;top:4%"></div>' +
      '<div class="maptitle">' + PR.state.player.name + '’S WORLD</div>';

    const allDone = NODES.every(n => isDone(n.id));
    const castle = document.createElement('div');
    castle.className = 'castle' + (allDone ? ' lit' : '');
    castle.style.left = '50%'; castle.style.top = '9%'; castle.textContent = '🏰';
    if (allDone) { // tapping the lit castle replays the games (keeps BYTE + name; never re-does the intro)
      castle.style.cursor = 'pointer'; castle.title = 'Play again!';
      castle.onclick = () => { PR.audio.fanfare(); PR.creature.sparkleBurst(A.device, 16); PR.state.stars = {}; lastDone = null; A.save(); show(A); };
    }
    map.appendChild(castle);

    NODES.forEach(n => {
      const el = document.createElement('button');
      el.className = 'mapnode' + (isDone(n.id) ? ' done' : ' fresh');
      el.style.left = n.x + '%'; el.style.top = n.y + '%';
      el.innerHTML = '<span class="ni">' + n.emoji + '</span><span class="nl">' + n.label + '</span>' +
        (isDone(n.id) ? '<span class="nstar' + (n.id === lastDone ? ' pop' : '') + '">⭐</span>' : '');
      el.onclick = () => enter(n);
      map.appendChild(el);
    });

    layer.appendChild(map);

    const buddy = PR.creature.node(PR.state.buddy);
    buddy.classList.remove('float'); buddy.classList.add('mapbuddy');
    buddy.style.bottom = '4%';
    map.appendChild(buddy);

    PR.audio.tone(660, 0.08, 'sine'); PR.audio.tone(880, 0.1, 'sine', 0.08);

    // big payoff the moment the whole World is lit
    if (bigWin) {
      bigWin = false;
      setTimeout(() => {
        PR.audio.fanfare(); setTimeout(() => PR.audio.fanfare(), 420);
        PR.creature.sparkleBurst(A.device, 40); A.rain.surge(3);
      }, 450);
    }
  }

  function enter(n) {
    PR.audio.tone(880, 0.08); PR.audio.tone(1180, 0.1, 'square', 0.07);
    if (A.flashGo) A.flashGo();
    const first = !isDone(n.id);
    setTimeout(() => {
      A.layer.innerHTML = ''; PR.world.clear();
      if (first && n.intro) {
        const lines = (typeof n.intro === 'function') ? n.intro(PR.state) : n.intro;
        PR.dialogue({ speaker: 'CIPHER', character: 'cipher', lines: lines, layer: A.layer, device: A.device, api: A, onDone: () => play(n) });
      } else play(n);
    }, 320);
  }

  function play(n) {
    A.layer.innerHTML = '';
    if (n.mech === '__arcade') return arcade(n);
    PR.mechanics[n.mech].run(A, n.cfg || {}, () => complete(n));
  }

  function complete(n) {
    const firstTime = !isDone(n.id);
    if (firstTime) {
      const before = NODES.every(x => isDone(x.id));
      PR.state.stars = PR.state.stars || {};
      PR.state.stars[n.id] = true;
      lastDone = n.id;
      A.save();
      if (!before && NODES.every(x => isDone(x.id))) bigWin = true; // just lit the whole World
      if (n.badge) return PR.badge.award({ index: n.badge, name: n.badgeName, icon: n.icon, total: 7 }, A, () => show(A));
    }
    show(A);
  }

  // arcade: pick one of the four games and PLAY it, with a back button (no "build later")
  function arcade(n) {
    const M = PR.mechanics.minigames;
    gallery();
    function gallery() {
      A.layer.innerHTML = '';
      const s = document.createElement('div'); s.className = 'stage';
      s.innerHTML = '<div class="stage-title">Pick a game to play!</div>';
      const g = document.createElement('div'); g.className = 'gallery';
      M.ARCHETYPES.forEach(a => {
        const c = document.createElement('div'); c.className = 'gcard';
        c.innerHTML = '<div class="ico">' + a.ico + '</div><div class="gname">' + a.name + '</div><div class="gsub">' + a.sub + '</div>';
        c.onclick = () => { PR.audio.tone(880, 0.06); PR.audio.tone(1150, 0.08, 'square', 0.06); playGame(a); };
        g.appendChild(c);
      });
      s.appendChild(g);
      const back = document.createElement('button'); back.className = 'summon'; back.style.maxWidth = '240px'; back.textContent = '🗺️ Back to the Map';
      back.onclick = () => complete(n);
      s.appendChild(back);
      A.layer.appendChild(s);
    }
    function playGame(a) { M.play(A, { key: a.key, theme: a.themes[0].name }, { onBack: gallery }); }
  }

  return { show, NODES };
})();
