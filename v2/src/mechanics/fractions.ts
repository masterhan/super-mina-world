// Pizza Splitter — hands-on fractions. Mina SLICES a pizza by tapping the
// cutter, then taps slices to serve them, matching a target fraction.
// The interaction IS the lesson: the bottom number = how many cuts you made,
// the top = how many you served. Later rounds: equivalent fractions (a pizza
// cut differently can serve the SAME amount — see it side by side).

import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

interface Round {
  den: number;          // slices the pizza must be cut into
  num: number;          // slices to serve
  equivalent?: { den: number; num: number }; // round shows an equal pizza
}

function makeRounds(n: number): Round[] {
  const base: Round[] = [
    { den: 2, num: 1 },
    { den: 4, num: 1 },
    { den: 4, num: 3 },
    { den: 3, num: 2 },
    { den: 6, num: 2, equivalent: { den: 3, num: 1 } },
    { den: 8, num: 4, equivalent: { den: 2, num: 1 } },
    { den: 6, num: 4, equivalent: { den: 3, num: 2 } },
    { den: 8, num: 6, equivalent: { den: 4, num: 3 } }
  ];
  return base.slice(0, Math.max(3, Math.min(n, base.length)));
}

export function runFractions(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech fracmech';
  ctx.host.appendChild(wrap);

  const finish = () => {
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const next = () => {
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    let cuts = 1;            // a whole pizza = 1 piece
    let served = new Set<number>();
    let mistakes = 0;
    let phase: 'cut' | 'serve' = 'cut';

    wrap.innerHTML = `
      <div class="mechhead">
        <div class="mechtitle">🍕 Pizza Splitter</div>
        <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
      </div>
      <div class="fractarget">Serve <b>${r.num}/${r.den}</b> of the pizza!</div>
      <div class="pizzabox"><svg class="pizza" viewBox="-110 -110 220 220"></svg></div>
      <div class="fracmsg">First, CUT the pizza into ${r.den} equal slices. Tap ✂️!</div>
      <div class="fracbtns">
        <button class="cutbtn">✂️ CUT</button>
        <button class="servebtn" disabled>🍽️ SERVE</button>
      </div>`;

    const svg = wrap.querySelector('.pizza') as unknown as SVGSVGElement;
    const msg = wrap.querySelector('.fracmsg') as HTMLElement;
    const cutBtn = wrap.querySelector('.cutbtn') as HTMLButtonElement;
    const serveBtn = wrap.querySelector('.servebtn') as HTMLButtonElement;

    const draw = () => {
      const ns = 'http://www.w3.org/2000/svg';
      svg.innerHTML = '';
      for (let s = 0; s < cuts; s++) {
        const a0 = (s / cuts) * Math.PI * 2 - Math.PI / 2;
        const a1 = ((s + 1) / cuts) * Math.PI * 2 - Math.PI / 2;
        const p = document.createElementNS(ns, 'path');
        const x0 = Math.cos(a0) * 100, y0 = Math.sin(a0) * 100;
        const x1 = Math.cos(a1) * 100, y1 = Math.sin(a1) * 100;
        const large = 1 / cuts > 0.5 ? 1 : 0;
        p.setAttribute('d', cuts === 1
          ? 'M 0 -100 A 100 100 0 1 1 -0.01 -100 Z'
          : `M 0 0 L ${x0} ${y0} A 100 100 0 ${large} 1 ${x1} ${y1} Z`);
        p.setAttribute('class', 'slice' + (served.has(s) ? ' served' : ''));
        p.dataset.idx = String(s);
        p.addEventListener('click', () => {
          if (phase !== 'serve' || served.has(s)) return;
          served.add(s);
          sfx.chirp();
          draw();
          msg.textContent = `Served ${served.size}/${cuts}` + (served.size === r.num ? ' — that’s it! Tap 🍽️ SERVE!' : '');
        });
        svg.appendChild(p);
      }
    };
    draw();

    cutBtn.onclick = () => {
      if (phase !== 'cut') return;
      cuts++;
      sfx.blip();
      draw();
      if (cuts === r.den) {
        phase = 'serve';
        cutBtn.disabled = true;
        serveBtn.disabled = false;
        msg.textContent = `${r.den} equal slices! Now tap ${r.num} of them, then SERVE.`;
        sfx.win();
      } else if (cuts > r.den) {
        // can't happen (button disabled at target) — guard anyway
      } else {
        msg.textContent = `${cuts} slices... keep cutting to ${r.den}!`;
      }
    };

    serveBtn.onclick = () => {
      if (phase !== 'serve') return;
      if (served.size === r.num) {
        sfx.fanfare();
        const why = r.equivalent
          ? `${r.num}/${r.den} is the SAME amount as ${r.equivalent.num}/${r.equivalent.den} — smaller slices, same pizza!`
          : `You cut ${r.den} pieces and served ${r.num} — that’s ${r.num}/${r.den}!`;
        msg.textContent = '⭐ ' + why;
        recordAttempt(ctx.save, {
          id: `mech.fractions.r${i}.${r.num}-${r.den}`, skill: 'math.fractions', tier: r.equivalent ? 2 : 1,
          q: 'pizza', options: ['', '', '', ''], why
        }, mistakes === 0, Date.now());
        ctx.persist();
        if (mistakes === 0) flawless++;
        i++;
        setTimeout(next, 2100);
      } else {
        mistakes++;
        sfx.buzz();
        const diff = served.size < r.num ? 'that’s not enough yet' : 'that’s too many';
        msg.textContent = `You served ${served.size}/${r.den} — ${diff}. The TOP number says serve ${r.num}!`;
      }
    };
  };

  next();
}
