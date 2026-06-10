// Loop Lagoon — hands-on sequencing & loops. Mina PROGRAMS BYTE across
// stepping stones by stacking move blocks in ORDER, taps RUN, and WATCHES
// the program play out stone by stone. A wrong step is a gentle splash and
// a retry — that's debugging, not failure. Round 3 limits the program row
// to 3 slots so the 🔁 REPEAT block becomes the real discovery: ONE block
// doing the work of many. Port of v1 sequencer.js to the v2 contract.

import '../styles/sequencer.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

type Dir = 'L' | 'R' | 'U' | 'D';
type Block = { t: 'move'; dir: Dir } | { t: 'loop'; dir: Dir; n: number };

const STEP = 56, SZ = 48, PAD = 10, WO = (SZ - 34) / 2; // SZ must match .seqstone in sequencer.css
const LAKE = PAD * 2 + 4 * STEP + SZ;                   // fits the 5×5 grid exactly
const DELTA: Record<Dir, [number, number]> = { L: [-1, 0], R: [1, 0], U: [0, -1], D: [0, 1] };
const GLYPH: Record<Dir, string> = { L: '⬅', R: '➡', U: '⬆', D: '⬇' };
const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'];

interface Round {
  title: string;
  start: [number, number];
  goal: string;                       // 'x,y' stone key
  stones: string[];
  slots: number;                      // program row capacity — round 3's limit makes the loop NECESSARY
  loops?: { dir: Dir; n: number }[];  // 🔁 REPEAT blocks offered this round
  skill: string;
  tier: 1 | 2 | 3;
  hint: string;
  why: string;
}

function makeRounds(n: number): Round[] {
  const base: Round[] = [
    {
      title: 'The short hop — stack the steps, then RUN!',
      start: [0, 2], goal: '3,2',
      stones: ['0,2', '1,2', '2,2', '3,2'],
      slots: 3, skill: 'code.sequences', tier: 1,
      hint: 'Tap move blocks to build BYTE’s program, then ▶ RUN to watch it go!',
      why: 'You gave BYTE 3 steps in order — that’s a program!'
    },
    {
      title: 'The bend — this path turns a corner!',
      start: [0, 4], goal: '2,2',
      stones: ['0,4', '1,4', '2,4', '2,3', '2,2'],
      slots: 4, skill: 'code.sequences', tier: 1,
      hint: 'BYTE turns exactly when YOU say — the ORDER of the blocks is the secret.',
      why: 'Right, right, UP, UP — the order was the answer, and you nailed it!'
    },
    {
      title: 'The long crossing — only 3 slots?!',
      start: [0, 2], goal: '4,2',
      stones: ['0,2', '1,2', '2,2', '3,2', '4,2'],
      slots: 3, loops: [{ dir: 'R', n: 4 }], skill: 'code.loops', tier: 2,
      hint: '4 hops but only 3 slots... the new 🔁 block repeats a hop FOUR times in ONE slot!',
      why: 'ONE 🔁 block did 4 hops — that’s a LOOP!'
    },
    {
      title: 'The big climb — TWO patterns!',
      start: [0, 4], goal: '3,1',
      stones: ['0,4', '1,4', '2,4', '3,4', '3,3', '3,2', '3,1'],
      slots: 3, loops: [{ dir: 'R', n: 3 }, { dir: 'U', n: 3 }], skill: 'code.loops', tier: 3,
      hint: '6 hops, 3 slots. Spot the two patterns — two 🔁 blocks can do it all!',
      why: 'Two loops crossed the whole lagoon — loops are coder POWER!'
    }
  ];
  return base.slice(0, Math.max(3, Math.min(n, base.length)));
}

function px(c: number): number { return PAD + c * STEP; }

export function runSequencer(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech seqmech';
  ctx.host.appendChild(wrap);

  const finish = () => {
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const next = () => {
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    const stones = new Set(r.stones);
    const prog: Block[] = [];
    let mistakes = 0;
    let solved = false;

    wrap.innerHTML = `
      <div class="mechhead">
        <div class="mechtitle">🌀 Loop Lagoon</div>
        <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
      </div>
      <div class="seqgoal">${r.title}</div>
      <div class="seqlake"></div>
      <div class="seqprog"></div>
      <div class="mechmsg seqmsg">${r.hint}</div>
      <div class="seqtools"></div>
      <div class="mechbtns"><button class="seqrun">▶ RUN</button></div>`;

    const lake = wrap.querySelector('.seqlake') as HTMLElement;
    const progEl = wrap.querySelector('.seqprog') as HTMLElement;
    const msg = wrap.querySelector('.seqmsg') as HTMLElement;
    const tools = wrap.querySelector('.seqtools') as HTMLElement;
    const runBtn = wrap.querySelector('.seqrun') as HTMLButtonElement;

    // ---- the lagoon: stones + BYTE ----
    lake.style.width = LAKE + 'px';
    lake.style.height = LAKE + 'px';
    r.stones.forEach(key => {
      const [x, y] = key.split(',').map(Number);
      const st = document.createElement('div');
      st.className = 'seqstone' + (key === r.goal ? ' seqgoalstone' : '');
      st.style.left = px(x) + 'px';
      st.style.top = px(y) + 'px';
      if (key === r.goal) st.textContent = '⭐';
      lake.appendChild(st);
    });
    const byte = document.createElement('div');
    byte.className = 'seqbyte';
    const place = (p: [number, number]) => {
      byte.style.left = (px(p[0]) + WO) + 'px';
      byte.style.top = (px(p[1]) + WO) + 'px';
    };
    place(r.start);
    lake.appendChild(byte);

    // ---- program row ----
    const renderProg = () => {
      progEl.innerHTML = '';
      for (let s = 0; s < r.slots; s++) {
        const cell = document.createElement('div');
        const b = prog[s];
        if (b) {
          cell.className = 'seqblk' + (b.t === 'loop' ? ' seqrep' : '');
          cell.textContent = b.t === 'loop' ? `🔁${GLYPH[b.dir]}×${b.n}` : GLYPH[b.dir];
        } else {
          cell.className = 'seqslot';
        }
        progEl.appendChild(cell);
      }
    };
    renderProg();

    const highlight = (bi: number) => {
      Array.from(progEl.children).forEach((c, idx) => c.classList.toggle('seqactive', idx === bi));
    };

    const add = (b: Block, isLoop: boolean) => {
      if (prog.length >= r.slots) {
        sfx.buzz();
        progEl.classList.remove('seqshake');
        void progEl.offsetWidth;
        progEl.classList.add('seqshake');
        msg.textContent = r.loops
          ? `The row is FULL — only ${r.slots} slots! The 🔁 block does many hops in ONE slot.`
          : `The row is FULL — only ${r.slots} slots! Tap ⌫ to remove a block.`;
        return;
      }
      prog.push(b);
      if (isLoop) sfx.chirp(); else sfx.blip();
      renderProg();
    };

    // ---- tools ----
    (['L', 'R', 'U', 'D'] as Dir[]).forEach(d => {
      const b = document.createElement('button');
      b.className = 'seqtool';
      b.textContent = GLYPH[d];
      b.onclick = () => add({ t: 'move', dir: d }, false);
      tools.appendChild(b);
    });
    (r.loops || []).forEach(lp => {
      const b = document.createElement('button');
      b.className = 'seqtool seqlooptool';
      b.textContent = `🔁${GLYPH[lp.dir]}×${lp.n}`;
      b.onclick = () => add({ t: 'loop', dir: lp.dir, n: lp.n }, true);
      tools.appendChild(b);
    });
    const undo = document.createElement('button');
    undo.className = 'seqtool';
    undo.textContent = '⌫';
    undo.onclick = () => {
      if (!prog.length) return;
      prog.pop();
      sfx.blip();
      renderProg();
    };
    tools.appendChild(undo);

    const setRunning = (on: boolean) => {
      wrap.querySelectorAll('button').forEach(b => { b.disabled = on; });
    };

    // ---- run the program: BYTE walks it stone by stone ----
    const expand = (): { dir: Dir; bi: number }[] => {
      const out: { dir: Dir; bi: number }[] = [];
      prog.forEach((b, bi) => {
        if (b.t === 'loop') { for (let k = 0; k < b.n; k++) out.push({ dir: b.dir, bi }); }
        else out.push({ dir: b.dir, bi });
      });
      return out;
    };

    const splash = (into: [number, number], k: number) => {
      mistakes++;
      place(into);
      byte.classList.add('seqfall');
      sfx.buzz();
      msg.textContent = k === 0
        ? '💦 Splash! BYTE fell in the water on the very first hop — which way should it start?'
        : `💦 So close! BYTE fell in the water at step ${k + 1} — check what comes after the ${ORD[k - 1]} hop.`;
      setTimeout(() => {
        byte.classList.remove('seqfall');
        place(r.start);
        highlight(-1);
        setRunning(false);
      }, 950);
    };

    const arrive = (pos: [number, number]) => {
      if (pos.join(',') === r.goal) {
        solved = true;
        byte.classList.add('seqglow');
        msg.textContent = '⭐ ' + r.why;
        recordAttempt(ctx.save, {
          id: `mech.sequencer.r${i}.${r.skill}`, skill: r.skill, tier: r.tier,
          q: 'stones', options: ['', '', '', ''], why: r.why
        }, mistakes === 0, Date.now());
        ctx.persist();
        if (mistakes === 0) flawless++;
        i++;
        if (i >= rounds.length) sfx.fanfare(); else sfx.win();
        setTimeout(next, 2100);
      } else {
        mistakes++;
        sfx.buzz();
        const usedLoop = prog.some(b => b.t === 'loop');
        msg.textContent = 'So close — BYTE landed on a stone, but not the ⭐!' +
          (r.loops && !usedLoop
            ? ' Single hops can’t fit... the 🔁 block does many hops in ONE slot!'
            : ' Tweak the order and RUN again.');
        setTimeout(() => { place(r.start); setRunning(false); }, 800);
      }
    };

    runBtn.onclick = () => {
      if (solved) return;
      const steps = expand();
      if (!steps.length) {
        msg.textContent = 'Stack some blocks first, then ▶ RUN!';
        return;
      }
      setRunning(true);
      let pos: [number, number] = [r.start[0], r.start[1]];
      let k = 0;
      const tick = () => {
        if (k >= steps.length) {
          highlight(-1);
          return arrive(pos);
        }
        const st = steps[k];
        highlight(st.bi);
        const d = DELTA[st.dir];
        const nx: [number, number] = [pos[0] + d[0], pos[1] + d[1]];
        if (!stones.has(nx.join(','))) return splash(nx, k);
        pos = nx;
        place(pos);
        sfx.tone(620 + k * 40, 0.05);
        k++;
        setTimeout(tick, 380);
      };
      setTimeout(tick, 250);
    };
  };

  next();
}
