// Particle Chamber — hands-on states of matter. Mina HEATS 🔥 and COOLS ❄️ a
// chamber of ~40 particles and WATCHES them change: locked in a vibrating grid
// (SOLID), sliding past each other in the bottom (LIQUID), flying everywhere
// (GAS). Reach the target state and hold it to win. Final rounds: two colors
// pour in and STIR into a mixture — the particles mix but never change.
// The simulation IS the lesson.

import '../styles/particles.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

type StateName = 'solid' | 'liquid' | 'gas';

interface Round {
  kind: 'state' | 'mix';
  target?: StateName;
  startE: number;
  tier: 1 | 2 | 3;
  intro: string;
  why: string;
  mixNeed?: number;     // mixture rounds: how mixed (0..1) counts as done
}

interface P { x: number; y: number; vx: number; vy: number; hx: number; hy: number; c: 0 | 1; }

const N = 40;           // particles in the chamber
const R = 5;            // particle radius (css px)
const W = 330;          // sim size (css px)
const H = 250;
const HOLD_MS = 1500;   // hold the target state this long to win

const LABEL: Record<StateName, string> = { solid: 'SOLID 🧊', liquid: 'LIQUID 💧', gas: 'GAS 💨' };
const BAND: Record<StateName, [number, number]> = { solid: [0, 0.34], liquid: [0.34, 0.67], gas: [0.67, 1] };
const TRANSITION: Record<string, string> = {
  'solid-liquid': 'MELTING! Heat = energy — the particles speed up and break free of the grid.',
  'liquid-gas': 'BOILING! So much energy the particles fly free in every direction.',
  'gas-liquid': 'CONDENSING! Less energy — the particles slow down and huddle together.',
  'liquid-solid': 'FREEZING! Almost no energy — the particles lock into a vibrating grid.'
};

function stateOf(e: number): StateName { return e < 0.34 ? 'solid' : e < 0.67 ? 'liquid' : 'gas'; }

// distance from an energy level to the target state's band (0 = inside it)
function distTo(e: number, t: StateName): number {
  const [lo, hi] = BAND[t];
  return e < lo ? lo - e : e > hi ? e - hi : 0;
}

function makeRounds(n: number): Round[] {
  const base: Round[] = [
    { kind: 'state', target: 'liquid', startE: 0.12, tier: 1,
      intro: 'The particles are locked in a grid — that is a SOLID. Tap 🔥 HEAT and watch!',
      why: 'Heat gave the particles energy — they broke free of the grid and started to FLOW. That is melting!' },
    { kind: 'state', target: 'gas', startE: 0.5, tier: 1,
      intro: 'Now they slide past each other — a LIQUID. Give them even MORE energy!',
      why: 'With lots of energy the particles fly everywhere, even up! That is boiling — liquid to GAS.' },
    { kind: 'state', target: 'solid', startE: 0.9, tier: 2,
      intro: 'They are zooming everywhere — a GAS! Take their energy AWAY to freeze it.',
      why: 'Cooling took energy away — the particles slowed down and locked back into a grid. That is freezing!' },
    { kind: 'mix', startE: 0.5, tier: 2, mixNeed: 0.55,
      intro: 'Two kinds of particles pour in! Tap 🌀 STIR and watch them mix.',
      why: 'A mixture stirs TOGETHER — but every particle kept its own color. You could still pick them apart!' },
    { kind: 'mix', startE: 0.5, tier: 3, mixNeed: 0.65,
      intro: 'One more mixture — stir this one really, REALLY well!',
      why: 'Even mixed super well, they are still the same particles — stirring makes a MIXTURE, never new stuff!' }
  ];
  return base.slice(0, Math.max(3, Math.min(n, base.length)));
}

export function runParticles(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;
  let raf = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech partmech';
  ctx.host.appendChild(wrap);

  const finish = () => {
    cancelAnimationFrame(raf);
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const next = () => {
    cancelAnimationFrame(raf);
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    const mix = r.kind === 'mix';
    let energy = r.startE;
    let mistakes = 0;
    let stirs = 0;
    let swirl = 0;          // frames of stir force remaining
    let swirlDir = 1;       // alternate stir direction — shears mix better
    let holdSince = 0;      // when the target state was first held (0 = not holding)
    let msgLock = 0;        // until this time, transition lines don't overwrite a mistake line
    let lastState: StateName = mix ? 'liquid' : stateOf(energy);
    let done = false;

    wrap.classList.toggle('partmix', mix);
    wrap.innerHTML = `
      <div class="mechhead">
        <div class="mechtitle">🧪 Particle Chamber</div>
        <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
      </div>
      <div class="parttarget">${mix ? 'Stir it into a <b>MIXTURE 🌀</b>!' : `Make it a <b>${LABEL[r.target as StateName]}</b>!`}</div>
      <div class="partframe"><canvas class="partcanvas"></canvas></div>
      <div class="partstatus">
        <div class="partstate"></div>
        <div class="parthold"><div class="partholdfill"></div></div>
      </div>
      <div class="parttemp">
        <div class="parttempbar"><div class="parttempmark"></div></div>
        <div class="parttempzones"><span>SOLID</span><span>LIQUID</span><span>GAS</span></div>
      </div>
      <div class="mechmsg">${r.intro}</div>
      <div class="mechbtns">${mix
        ? '<button class="stirbtn">🌀 STIR</button>'
        : '<button class="coolbtn">❄️ COOL</button><button class="heatbtn">🔥 HEAT</button>'}</div>`;

    const canvas = wrap.querySelector('.partcanvas') as HTMLCanvasElement;
    const frame = wrap.querySelector('.partframe') as HTMLElement;
    const stateEl = wrap.querySelector('.partstate') as HTMLElement;
    const holdFill = wrap.querySelector('.partholdfill') as HTMLElement;
    const tempMark = wrap.querySelector('.parttempmark') as HTMLElement;
    const msg = wrap.querySelector('.mechmsg') as HTMLElement;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    const g = canvas.getContext('2d');
    if (!g) return finish();
    g.scale(dpr, dpr);

    // colors come from the stylesheet (CSS variables; named fallbacks only)
    const css = getComputedStyle(wrap);
    const cvar = (name: string, fb: string) => css.getPropertyValue(name).trim() || fb;
    const colBg = cvar('--part-bg', 'black');
    const colState: Record<StateName, string> = {
      solid: cvar('--part-solid', 'lightskyblue'),
      liquid: cvar('--part-liquid', 'deepskyblue'),
      gas: cvar('--part-gas', 'orange')
    };
    const colA = cvar('--part-a', 'cyan');
    const colB = cvar('--part-b', 'violet');
    const colRing = cvar('--part-ring', 'white');

    // grid home positions — the solid's lattice, bottom-center of the chamber
    const cols = 8, rows = Math.ceil(N / cols), gap = 18;
    const gx = (W - (cols - 1) * gap) / 2;
    const gy = H - 16 - (rows - 1) * gap;
    const ps: P[] = [];
    for (let k = 0; k < N; k++) {
      const hx = gx + (k % cols) * gap, hy = gy + Math.floor(k / cols) * gap;
      let x = hx, y = hy;
      if (mix) {            // two colored streams pour in from above
        x = (k % 2 === 0 ? W * 0.25 : W * 0.75) + (Math.random() - 0.5) * 36;
        y = -12 - Math.random() * 140;
      } else if (energy >= 0.67) { x = Math.random() * W; y = Math.random() * H; }
      else if (energy >= 0.34) { x = Math.random() * W; y = H * 0.55 + Math.random() * (H * 0.4); }
      ps.push({
        x, y,
        vx: (Math.random() - 0.5) * (1 + energy * 4),
        vy: (Math.random() - 0.5) * (1 + energy * 4),
        hx, hy, c: mix && k % 2 === 1 ? 1 : 0
      });
    }

    tempMark.style.left = `${energy * 100}%`;

    // how mixed are the two colors? average color balance across grid cells
    const mixScore = (): number => {
      const cx = 4, cy = 3;
      const cells: Array<[number, number]> = Array.from({ length: cx * cy }, (): [number, number] => [0, 0]);
      for (const p of ps) {
        if (p.y < 0) return 0;            // still pouring in
        const a = Math.min(cx - 1, Math.max(0, Math.floor((p.x / W) * cx)));
        const b = Math.min(cy - 1, Math.max(0, Math.floor((p.y / H) * cy)));
        cells[b * cx + a][p.c]++;
      }
      let used = 0, sum = 0;
      for (const [a, b] of cells) {
        const total = a + b;
        if (total < 3) continue;
        sum += 1 - Math.abs(a / total - 0.5) * 2;
        used++;
      }
      return used ? sum / used : 0;
    };

    const shake = () => {
      frame.classList.remove('partshake');
      void frame.offsetWidth;
      frame.classList.add('partshake');
    };

    const winRound = () => {
      done = true;
      wrap.querySelectorAll('button').forEach(b => { b.disabled = true; });
      holdFill.style.width = '100%';
      if (i === rounds.length - 1) sfx.fanfare(); else sfx.win();
      msg.textContent = '⭐ ' + r.why;
      recordAttempt(ctx.save, {
        id: `mech.particles.r${i}.${mix ? 'mix' : r.target}`, skill: 'phys.matter', tier: r.tier,
        q: 'chamber', options: ['', '', '', ''], why: r.why
      }, mistakes === 0, Date.now());
      ctx.persist();
      if (mistakes === 0) flawless++;
      i++;
      setTimeout(next, 2600);
    };

    const tap = (d: number) => {
      if (done) return;
      const t = r.target as StateName;
      const ne = Math.max(0.02, Math.min(0.98, energy + d));
      if (ne === energy) {
        sfx.blip();
        msg.textContent = d > 0 ? 'It cannot get any hotter!' : 'It cannot get any colder!';
        return;
      }
      const before = distTo(energy, t);
      const after = distTo(ne, t);
      energy = ne;
      tempMark.style.left = `${energy * 100}%`;
      if (after > before + 0.001) {
        mistakes++;
        sfx.buzz();
        shake();
        msgLock = performance.now() + 1600;
        msg.textContent = before === 0
          ? `Whoa — you HAD a ${t.toUpperCase()}! That pushed it too far. Go back the other way!`
          : d > 0
            ? `🔥 Heat ADDS energy — see them speed up? But a ${t.toUpperCase()} needs LESS energy. Try ❄️ COOL!`
            : `❄️ Cool TAKES energy away — see them slow down? But a ${t.toUpperCase()} needs MORE energy. Try 🔥 HEAT!`;
      } else {
        sfx.blip();
      }
    };

    const heatBtn = wrap.querySelector('.heatbtn') as HTMLButtonElement | null;
    const coolBtn = wrap.querySelector('.coolbtn') as HTMLButtonElement | null;
    const stirBtn = wrap.querySelector('.stirbtn') as HTMLButtonElement | null;
    if (heatBtn) heatBtn.onclick = () => tap(+0.11);
    if (coolBtn) coolBtn.onclick = () => tap(-0.11);
    if (stirBtn) stirBtn.onclick = () => {
      if (done) return;
      stirs++;
      swirl = 90;
      swirlDir = stirs % 2 === 1 ? 1 : -1;
      sfx.blip();
      if (stirs >= 4) for (const p of ps) p.vx += (Math.random() - 0.5) * 6;  // extra shuffle so it always mixes
      if (stirs === 1) msg.textContent = 'Round and round! Watch the two colors swirl together...';
      else if (stirs === 2) { sfx.chirp(); msg.textContent = 'Keep stirring until the colors are all mixed up!'; }
    };

    const stepSim = (st: StateName) => {
      if (swirl > 0) swirl--;
      for (const p of ps) {
        if (st === 'solid') {
          // spring back to the lattice + vibration that grows with energy
          p.vx += (p.hx - p.x) * 0.12 + (Math.random() - 0.5) * (0.4 + energy * 2.6);
          p.vy += (p.hy - p.y) * 0.12 + (Math.random() - 0.5) * (0.4 + energy * 2.6);
          p.vx *= 0.72; p.vy *= 0.72;
        } else if (st === 'liquid') {
          // gravity + jostle: flows and pools in the bottom half
          p.vy += 0.22;
          p.vx += (Math.random() - 0.5) * 0.5;
          if (swirl > 0) {
            const dx = p.x - W / 2, dy = p.y - H * 0.62;
            p.vx += -dy * 0.028 * swirlDir;
            p.vy += dx * 0.028 * swirlDir - 0.1;
          }
          p.vx *= 0.96; p.vy *= 0.96;
          const cap = swirl > 0 ? 4.6 : 2.4;
          const sp = Math.hypot(p.vx, p.vy);
          if (sp > cap) { p.vx = (p.vx / sp) * cap; p.vy = (p.vy / sp) * cap; }
        } else {
          // gas: hold a fast target speed, bounce everywhere
          const want = 2.5 + energy * 3.5;
          const sp = Math.hypot(p.vx, p.vy) || 0.01;
          const sc = 1 + ((want - sp) / sp) * 0.08;
          p.vx = p.vx * sc + (Math.random() - 0.5) * 0.6;
          p.vy = p.vy * sc + (Math.random() - 0.5) * 0.6;
        }
        p.x += p.vx; p.y += p.vy;
        const k = st === 'gas' ? 1 : 0.35;
        if (p.x < R) { p.x = R; p.vx = Math.abs(p.vx) * k; }
        if (p.x > W - R) { p.x = W - R; p.vx = -Math.abs(p.vx) * k; }
        if (p.y < R && p.vy < 0) { p.y = R; p.vy = Math.abs(p.vy) * k; }  // pouring particles fall through the top
        if (p.y > H - R) { p.y = H - R; p.vy = -Math.abs(p.vy) * k; }
      }
      if (st === 'liquid') {              // liquids slide past each other but don't overlap
        const min = R * 2.1, min2 = min * min;
        for (let a = 0; a < ps.length; a++) {
          for (let b = a + 1; b < ps.length; b++) {
            const A = ps[a], B = ps[b];
            const dx = B.x - A.x, dy = B.y - A.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > 0.01 && d2 < min2) {
              const d = Math.sqrt(d2), push = ((min - d) / d) * 0.16;
              A.x -= dx * push; A.y -= dy * push;
              B.x += dx * push; B.y += dy * push;
            }
          }
        }
      }
    };

    const draw = (st: StateName) => {
      g.fillStyle = colBg;
      g.fillRect(0, 0, W, H);
      for (const p of ps) {
        g.fillStyle = mix ? (p.c ? colB : colA) : colState[st];
        g.beginPath();
        g.arc(p.x, p.y, R, 0, Math.PI * 2);
        g.fill();
      }
      if (mix && done) {                  // "you could still pick them apart" — ring a few of each
        g.strokeStyle = colRing;
        g.lineWidth = 2;
        let ringsA = 0, ringsB = 0;
        for (const p of ps) {
          if (p.c === 0 && ringsA >= 3) continue;
          if (p.c === 1 && ringsB >= 3) continue;
          if (p.c === 0) ringsA++; else ringsB++;
          g.beginPath();
          g.arc(p.x, p.y, R + 3, 0, Math.PI * 2);
          g.stroke();
          if (ringsA >= 3 && ringsB >= 3) break;
        }
      }
    };

    const loop = (now: number) => {
      const st: StateName = mix ? 'liquid' : stateOf(energy);
      stepSim(st);

      if (!mix && st !== lastState) {     // live teaching line on every transition
        const line = TRANSITION[`${lastState}-${st}`];
        if (line && !done && now > msgLock) { msg.textContent = line; sfx.chirp(); }
        lastState = st;
      }

      let score = 0;
      if (mix) {
        score = mixScore();
        stateEl.textContent = `MIXED ${Math.round(score * 100)}%`;
        stateEl.dataset.state = 'mix';
      } else {
        stateEl.textContent = LABEL[st];
        stateEl.dataset.state = st;
      }

      if (!done) {
        const onTarget = mix ? stirs >= 2 && score >= (r.mixNeed ?? 0.55) : st === r.target;
        if (onTarget) {
          if (!holdSince) holdSince = now;
          const frac = Math.min(1, (now - holdSince) / HOLD_MS);
          holdFill.style.width = `${frac * 100}%`;
          if (frac >= 1) winRound();
        } else {
          holdSince = 0;
          holdFill.style.width = '0%';
        }
      }

      draw(st);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
  };

  next();
}
