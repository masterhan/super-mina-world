// Arcade Cabinets — Mina's pure-fun reward arcade, ported from v1 minigames.
// A gallery of 4 glowing cabinets: Flappy Flyer, Dino Jump, Star Catcher and
// Maze Run. Tap a cabinet to play on a portrait canvas; BACK returns to the
// gallery and DONE leaves the arcade. Kind rules: there are no fail screens —
// bumping into things just restarts the run (with a wobble + a kind word) and
// your best score sticks for the whole visit. Each completed play (BACK with
// a score, or a maze solve) records one code.sequences mastery round. Juice:
// particle puffs on every score, a screen nudge on every bump, sfx everywhere.

import '../styles/arcade.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

interface Palette { bg: string; glow: string; gold: string; pink: string; }

interface Kit {
  cv: HTMLCanvasElement;
  g: CanvasRenderingContext2D;
  w: number;
  h: number;
  col: Palette;
  font: string;                   // canvas font family, from --arc-font in arcade.css
  puffs: Puffs;
  setScore: (n: number) => void;  // updates "SCORE n · BEST m" (best auto-kept)
  say: (t: string) => void;       // kind hint line under the canvas
  nudge: () => void;              // screen bump on collisions
  pad: HTMLElement;               // slot below the canvas (maze puts its d-pad here)
}

type Game = (k: Kit) => () => void; // returns cleanup

interface Cabinet { key: string; name: string; ico: string; sub: string; run: Game; }

// ---- particle puffs (score sparkles + bump fizzles) ----

interface Puff { x: number; y: number; vx: number; vy: number; life: number; max: number; col: string; }

interface Puffs {
  burst: (x: number, y: number, col: string, n?: number) => void;
  stepDraw: (g: CanvasRenderingContext2D) => void;
}

function makePuffs(): Puffs {
  const ps: Puff[] = [];
  return {
    burst(x, y, col, n = 10) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 0.8 + Math.random() * 2.4;
        const max = 26 + Math.random() * 14;
        ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.6, life: max, max, col });
      }
    },
    stepDraw(g) {
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--;
        if (p.life <= 0) { ps.splice(i, 1); continue; }
        g.globalAlpha = Math.max(0, p.life / p.max);
        g.fillStyle = p.col;
        const s = 2 + (p.life / p.max) * 4;
        g.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      }
      g.globalAlpha = 1;
    }
  };
}

// ---- the four games ----

function flappy(k: Kit): () => void {
  const { g, w, h } = k;
  const GAP = 132, PW = 40, SPEED = 2.1, GRAV = 0.34, JUMP = -5.8, BX = w * 0.3, BR = 13;
  let by = h / 2, vy = 0, t = 0, score = 0, raf = 0;
  let pipes: { x: number; top: number; passed: boolean }[] = [];

  const reset = (text: string) => {
    by = h / 2; vy = 0; pipes = []; t = 0; score = 0;
    k.setScore(0); k.say(text);
  };

  const crash = () => {
    sfx.buzz(); k.nudge();
    k.puffs.burst(BX, by, k.col.pink, 14);
    reset('Bonk! No worries — flying again. Your best is safe!');
  };

  const draw = () => {
    g.fillStyle = k.col.bg; g.fillRect(0, 0, w, h);
    g.fillStyle = k.col.glow;
    for (const p of pipes) {
      g.fillRect(p.x, 0, PW, p.top);
      g.fillRect(p.x, p.top + GAP, PW, h - p.top - GAP);
    }
    g.font = `30px ${k.font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('🐦', BX, by);
    k.puffs.stepDraw(g);
  };

  const loop = () => {
    t++;
    if (t % 95 === 0) pipes.push({ x: w, top: 30 + Math.random() * (h - GAP - 90), passed: false });
    vy += GRAV; by += vy;
    for (const p of pipes) p.x -= SPEED;
    pipes = pipes.filter(p => p.x > -PW);
    for (const p of pipes) {
      if (!p.passed && p.x + PW < BX) {
        p.passed = true; score++; k.setScore(score);
        sfx.chirp(); k.puffs.burst(BX, by, k.col.gold, 8);
      }
      if (BX + BR > p.x && BX - BR < p.x + PW && (by - BR < p.top || by + BR > p.top + GAP)) {
        crash();
        break;
      }
    }
    if (by > h - 8 || by < 6) crash();
    draw();
    raf = requestAnimationFrame(loop);
  };

  const tap = () => { vy = JUMP; sfx.blip(); };
  k.cv.addEventListener('pointerdown', tap);
  reset('Tap anywhere to fly through the gaps!');
  loop();
  return () => { cancelAnimationFrame(raf); k.cv.removeEventListener('pointerdown', tap); };
}

function jumper(k: Kit): () => void {
  const { g, w, h } = k;
  const GY = h - 72, GRAV = 0.5, JUMP = -9.2, SPEED = 2.5, CX = w * 0.24;
  let y = GY, vy = 0, t = 0, score = 0, raf = 0, grounded = true;
  let obs: { x: number; passed: boolean }[] = [];

  const draw = () => {
    g.fillStyle = k.col.bg; g.fillRect(0, 0, w, h);
    g.fillStyle = k.col.glow; g.fillRect(0, GY + 18, w, 3);
    g.font = `26px ${k.font}`; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    for (const o of obs) g.fillText('🌵', o.x, GY + 16);
    g.font = `32px ${k.font}`;
    g.fillText('🦖', CX, y + 10);
    k.puffs.stepDraw(g);
  };

  const loop = () => {
    t++;
    if (t % 80 === 0) obs.push({ x: w + 10, passed: false });
    vy += GRAV; y += vy;
    if (y >= GY) { y = GY; vy = 0; grounded = true; }
    for (const o of obs) o.x -= SPEED;
    obs = obs.filter(o => o.x > -24);
    for (const o of obs) {
      if (!o.passed && o.x + 16 < CX) {
        o.passed = true; score++; k.setScore(score);
        sfx.chirp(); k.puffs.burst(CX, y - 12, k.col.gold, 8);
      }
      if (Math.abs(o.x - CX) < 17 && y > GY - 24) {
        sfx.buzz(); k.nudge();
        k.puffs.burst(CX, GY, k.col.pink, 14);
        obs = []; score = 0; k.setScore(0);
        k.say('Oof, a cactus! Running again — your best is safe!');
        break;
      }
    }
    draw();
    raf = requestAnimationFrame(loop);
  };

  const tap = () => { if (grounded) { vy = JUMP; grounded = false; sfx.blip(); } };
  k.cv.addEventListener('pointerdown', tap);
  k.setScore(0); k.say('Tap to jump over the cactus!');
  loop();
  return () => { cancelAnimationFrame(raf); k.cv.removeEventListener('pointerdown', tap); };
}

function catcher(k: Kit): () => void {
  const { g, w, h } = k;
  let bx = w / 2, t = 0, score = 0, raf = 0;
  let items: { x: number; y: number; v: number }[] = [];

  const draw = () => {
    g.fillStyle = k.col.bg; g.fillRect(0, 0, w, h);
    g.font = `24px ${k.font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const it of items) g.fillText('⭐', it.x, it.y);
    g.font = `34px ${k.font}`;
    g.fillText('🧺', bx, h - 26);
    k.puffs.stepDraw(g);
  };

  const loop = () => {
    t++;
    if (t % 48 === 0) items.push({ x: 24 + Math.random() * (w - 48), y: -12, v: 1.6 + Math.random() * 1.4 });
    for (const it of items) it.y += it.v;
    items = items.filter(it => {
      if (it.y > h - 44 && Math.abs(it.x - bx) < 30) {
        score++; k.setScore(score);
        sfx.chirp(); k.puffs.burst(it.x, h - 44, k.col.gold, 8);
        return false;
      }
      return it.y < h + 14; // missed stars drift away kindly — no penalty
    });
    draw();
    raf = requestAnimationFrame(loop);
  };

  const move = (e: PointerEvent) => {
    const r = k.cv.getBoundingClientRect();
    bx = Math.max(20, Math.min(w - 20, (e.clientX - r.left) * (w / r.width)));
  };
  k.cv.addEventListener('pointermove', move);
  k.cv.addEventListener('pointerdown', move);
  k.setScore(0); k.say('Slide your finger to catch the falling stars!');
  loop();
  return () => {
    cancelAnimationFrame(raf);
    k.cv.removeEventListener('pointermove', move);
    k.cv.removeEventListener('pointerdown', move);
  };
}

// Three hand-checked solvable 6x6 layouts; 1 = wall. Start (0,0), door (5,5).
const MAZES: number[][][] = [
  [
    [0, 0, 0, 1, 0, 0],
    [1, 1, 0, 1, 0, 1],
    [0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 0],
    [0, 0, 0, 0, 1, 0],
    [1, 1, 1, 0, 0, 0]
  ],
  [
    [0, 1, 0, 0, 0, 0],
    [0, 1, 0, 1, 1, 0],
    [0, 0, 0, 1, 0, 0],
    [1, 1, 0, 1, 0, 1],
    [0, 0, 0, 1, 0, 0],
    [0, 1, 1, 1, 1, 0]
  ],
  [
    [0, 0, 0, 0, 1, 0],
    [1, 1, 1, 0, 1, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 1, 1, 1, 1, 1],
    [0, 0, 1, 0, 0, 0],
    [1, 0, 0, 0, 1, 0]
  ]
];

function maze(k: Kit): () => void {
  const { g, w, h } = k;
  const N = 6;
  const cell = Math.floor(Math.min(w, h) / N);
  const ox = Math.floor((w - cell * N) / 2);
  const oy = Math.floor((h - cell * N) / 2);
  let mi = 0, px = 0, py = 0, solved = 0, raf = 0, hopping = false, tmr = 0;

  const draw = () => {
    g.fillStyle = k.col.bg; g.fillRect(0, 0, w, h);
    const M = MAZES[mi % MAZES.length];
    g.fillStyle = k.col.glow;
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        if (M[r][c]) g.fillRect(ox + c * cell + 2, oy + r * cell + 2, cell - 4, cell - 4);
      }
    }
    g.font = `${Math.floor(cell * 0.66)}px ${k.font}`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('🚪', ox + (N - 1) * cell + cell / 2, oy + (N - 1) * cell + cell / 2);
    g.fillText('👻', ox + px * cell + cell / 2, oy + py * cell + cell / 2);
    k.puffs.stepDraw(g);
    raf = requestAnimationFrame(draw);
  };

  const move = (dx: number, dy: number) => {
    if (hopping) return;
    const M = MAZES[mi % MAZES.length];
    const nx = px + dx, ny = py + dy;
    if (nx < 0 || ny < 0 || nx >= N || ny >= N || M[ny][nx]) {
      sfx.buzz(); k.nudge();
      k.say('A wall! Try another way. 🧱');
      return;
    }
    px = nx; py = ny; sfx.blip();
    if (px === N - 1 && py === N - 1) {
      solved++; k.setScore(solved);
      sfx.fanfare();
      k.puffs.burst(ox + px * cell + cell / 2, oy + py * cell + cell / 2, k.col.gold, 18);
      k.say('You found the door! ⭐');
      hopping = true;
      tmr = window.setTimeout(() => {
        mi++; px = 0; py = 0; hopping = false;
        k.say('A brand new maze — go!');
      }, 1300);
    }
  };

  const dirs: [string, number, number, string][] = [
    ['⬆', 0, -1, 'up'],
    ['⬅', -1, 0, 'left'],
    ['⬇', 0, 1, 'down'],
    ['➡', 1, 0, 'right']
  ];
  for (const [txt, dx, dy, slot] of dirs) {
    const b = document.createElement('button');
    b.className = 'arcdir arcdir-' + slot;
    b.textContent = txt;
    b.onclick = () => move(dx, dy);
    k.pad.appendChild(b);
  }
  k.pad.classList.add('arcpad-on');

  k.setScore(0); k.say('Walk the ghost to the door 🚪');
  draw();
  return () => {
    cancelAnimationFrame(raf);
    window.clearTimeout(tmr);
    k.pad.innerHTML = '';
    k.pad.classList.remove('arcpad-on');
  };
}

const CABINETS: Cabinet[] = [
  { key: 'flappy', name: 'Flappy Flyer', ico: '🐦', sub: 'tap to fly', run: flappy },
  { key: 'jumper', name: 'Dino Jump', ico: '🦖', sub: 'tap to jump', run: jumper },
  { key: 'catch', name: 'Star Catcher', ico: '🧺', sub: 'slide to catch', run: catcher },
  { key: 'maze', name: 'Maze Run', ico: '👻', sub: 'find the door', run: maze }
];

// ---- the arcade shell ----

export function runArcade(ctx: MechContext) {
  const bests: Record<string, number> = {};
  for (const c of CABINETS) bests[c.key] = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech arcademech';
  ctx.host.appendChild(wrap);

  // palette lives in arcade.css on .arcademech (white/black structural fallbacks)
  const cssVars = getComputedStyle(wrap);
  const col: Palette = {
    bg: cssVars.getPropertyValue('--arc-bg').trim() || '#000',
    glow: cssVars.getPropertyValue('--arc-glow').trim() || '#fff',
    gold: cssVars.getPropertyValue('--arc-gold').trim() || '#fff',
    pink: cssVars.getPropertyValue('--arc-pink').trim() || '#fff'
  };
  const font = cssVars.getPropertyValue('--arc-font').trim() || 'serif';

  let cleanup: (() => void) | null = null;
  let roundsPlayed = 0;

  // Mastery credit per contract.ts: each completed cabinet play is one round —
  // a synthetic code.sequences question, correct first try, with ramping tier.
  const creditRound = (cab: Cabinet) => {
    const n = roundsPlayed;
    recordAttempt(ctx.save, {
      id: `mech.arcade.r${n}.${cab.key}`,
      skill: 'code.sequences',
      tier: n < 2 ? 1 : n < 4 ? 2 : 3,
      q: cab.name,
      options: ['', '', '', ''],
      why: 'You read the pattern and timed your moves — that is sequencing!'
    }, true, Date.now());
    ctx.persist();
    roundsPlayed++;
  };

  const finish = () => {
    if (cleanup) { cleanup(); cleanup = null; }
    wrap.remove();
    ctx.onDone({ rounds: roundsPlayed, flawless: roundsPlayed });
  };

  const gallery = () => {
    wrap.innerHTML = `
      <div class="mechhead">
        <div class="mechtitle">🕹️ Arcade Cabinets</div>
        <div class="dots">★ FREE PLAY</div>
      </div>
      <div class="mechmsg">Pick a cabinet! Bumping just restarts the run — your best score sticks. 😄</div>
      <div class="arccabs">
        ${CABINETS.map(c => `
          <button class="arccab" data-key="${c.key}">
            <span class="arcico">${c.ico}</span>
            <span class="arcname">${c.name}</span>
            <span class="arcsub">${c.sub}</span>
            <span class="arcbest">BEST ${bests[c.key]}</span>
          </button>`).join('')}
      </div>
      <div class="mechbtns"><button class="arcdone">✅ DONE</button></div>`;

    wrap.querySelectorAll<HTMLButtonElement>('.arccab').forEach(btn => {
      btn.onclick = () => {
        const cab = CABINETS.find(c => c.key === btn.dataset.key);
        if (!cab) return;
        sfx.blip();
        play(cab);
      };
    });
    const done = wrap.querySelector('.arcdone') as HTMLButtonElement | null;
    if (done) done.onclick = () => { sfx.fanfare(); finish(); };
  };

  const play = (cab: Cabinet) => {
    wrap.innerHTML = `
      <div class="mechhead">
        <div class="mechtitle">${cab.ico} ${cab.name}</div>
        <div class="dots arcscore">SCORE 0 · BEST ${bests[cab.key]}</div>
      </div>
      <div class="arcframe"><canvas class="arccv" width="340" height="420"></canvas></div>
      <div class="arcpad"></div>
      <div class="mechmsg arcmsg">${cab.sub}!</div>
      <div class="mechbtns"><button class="arcback">↩ BACK</button></div>`;

    const cv = wrap.querySelector('.arccv') as HTMLCanvasElement | null;
    const frame = wrap.querySelector('.arcframe') as HTMLElement | null;
    const score = wrap.querySelector('.arcscore') as HTMLElement | null;
    const msg = wrap.querySelector('.arcmsg') as HTMLElement | null;
    const pad = wrap.querySelector('.arcpad') as HTMLElement | null;
    const back = wrap.querySelector('.arcback') as HTMLButtonElement | null;
    const g = cv ? cv.getContext('2d') : null;
    if (!cv || !frame || !score || !msg || !pad || !back || !g) { gallery(); return; }

    let playScore = 0;
    const kit: Kit = {
      cv, g, w: cv.width, h: cv.height, col, font,
      puffs: makePuffs(),
      setScore: (n) => {
        if (cab.key === 'maze' && n > playScore) creditRound(cab); // each maze solve = a round
        playScore = n;
        if (n > bests[cab.key]) bests[cab.key] = n;
        score.textContent = `SCORE ${n} · BEST ${bests[cab.key]}`;
      },
      say: (t) => { msg.textContent = t; },
      nudge: () => {
        frame.classList.remove('arcbump');
        void frame.offsetWidth; // restart the shake animation
        frame.classList.add('arcbump');
      },
      pad
    };
    cleanup = cab.run(kit);

    back.onclick = () => {
      sfx.blip();
      if (cab.key !== 'maze' && playScore > 0) creditRound(cab); // completed play = a round
      if (cleanup) { cleanup(); cleanup = null; }
      gallery();
    };
  };

  gallery();
}
