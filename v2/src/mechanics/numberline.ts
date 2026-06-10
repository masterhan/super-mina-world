// Number Forge — hands-on place value on a 0–100 number line. The line IS the
// lesson: Mina taps WHERE a number lives (rounds 1-2), bounces a frog to the
// nearest ten to feel rounding (rounds 3-5), then picks out which number keeps
// its 4 in the TENS place. Wrong taps never block — she gets a nudge and
// retries until it lands (only the first try counts toward the star).

import '../styles/numberline.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

type RoundDef =
  | { kind: 'place'; target: number }
  | { kind: 'hop'; start: number }
  | { kind: 'tens'; nums: number[]; answer: number };

function makeRounds(n: number): RoundDef[] {
  const base: RoundDef[] = [
    { kind: 'place', target: 37 },
    { kind: 'place', target: 62 },
    { kind: 'hop', start: 42 },
    { kind: 'hop', start: 67 },
    { kind: 'hop', start: 85 },
    { kind: 'tens', nums: [14, 47, 74], answer: 47 }
  ];
  const n2 = Math.max(3, Math.min(n, base.length));
  const order =
    n2 === 3 ? [0, 3, 5] :
    n2 === 4 ? [0, 2, 3, 5] :
    n2 === 5 ? [0, 1, 2, 3, 5] :
    [0, 1, 2, 3, 4, 5];
  return order.map(idx => base[idx]);
}

function tenRule(ones: number): string {
  return ones >= 5 ? `${ones} is 5 or more, so it rounds UP` : `${ones} is less than 5, so it rounds DOWN`;
}

export function runNumberline(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech numberline-mech';
  ctx.host.appendChild(wrap);

  const finish = () => {
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const el = <T extends HTMLElement>(sel: string): T => {
    const node = wrap.querySelector(sel);
    if (!node) throw new Error(`numberline: missing ${sel}`);
    return node as T;
  };

  const ticks = () => {
    let h = '';
    for (let t = 0; t <= 100; t += 10) {
      h += `<div class="numberline-tick" style="left:${t}%"></div>` +
           `<div class="numberline-ticklabel" data-t="${t}" style="left:${t}%">${t}</div>`;
    }
    return h;
  };

  const lineHtml = (inner: string) => `
    <div class="numberline-strip">
      <div class="numberline-rail">
        <div class="numberline-track"></div>
        ${ticks()}
        <div class="numberline-spot numberline-hidden"></div>
        ${inner}
      </div>
    </div>`;

  const next = () => {
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    let mistakes = 0;
    let done = false;

    const head = `
      <div class="mechhead">
        <div class="mechtitle">🔨 Number Forge</div>
        <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
      </div>`;

    const endRound = (msgEl: HTMLElement, why: string, tier: 1 | 2 | 3, idSuffix: string, wait: number) => {
      recordAttempt(ctx.save, {
        id: `mech.numberline.r${i}.${idSuffix}`, skill: 'math.placevalue', tier,
        q: 'numberline', options: ['', '', '', ''], why
      }, mistakes === 0, Date.now());
      ctx.persist();
      if (mistakes === 0) flawless++;
      msgEl.textContent = (mistakes === 0 ? '⭐ ' : '') + why;
      i++;
      if (i >= rounds.length) {
        setTimeout(() => {
          sfx.fanfare();
          msgEl.textContent = '🏅 Number Forge complete — you placed them ALL!';
        }, wait);
        setTimeout(next, wait + 1700);
      } else {
        setTimeout(next, wait);
      }
    };

    const pulseAt = (v: number) => {
      const spot = el<HTMLElement>('.numberline-spot');
      spot.style.left = `${v}%`;
      spot.classList.remove('numberline-hidden');
      spot.classList.remove('numberline-pulse');
      void spot.offsetWidth; // restart animation
      spot.classList.add('numberline-pulse');
    };

    const tapValue = (ev: MouseEvent): number => {
      const rect = el<HTMLElement>('.numberline-rail').getBoundingClientRect();
      const raw = ((ev.clientX - rect.left) / rect.width) * 100;
      return Math.round(Math.min(100, Math.max(0, raw)));
    };

    const wobble = (node: Element) => {
      node.classList.remove('numberline-wobble');
      void (node as HTMLElement).offsetWidth;
      node.classList.add('numberline-wobble');
    };

    if (r.kind === 'place') {
      const lo = Math.floor(r.target / 10) * 10;
      const hi = lo + 10;
      const ones = r.target % 10;
      const closer = ones === 5 ? `exactly in the middle of ${lo} and ${hi}`
        : ones < 5 ? `between ${lo} and ${hi}, closer to ${lo}`
        : `between ${lo} and ${hi}, closer to ${hi}`;

      wrap.innerHTML = `${head}
        <div class="numberline-target">Where does <b>${r.target}</b> live?</div>
        ${lineHtml('<div class="numberline-marker numberline-hidden"><span>📍</span></div>')}
        <div class="mechmsg">Tap the spot on the line where ${r.target} lives!</div>`;

      const msg = el<HTMLElement>('.mechmsg');
      const marker = el<HTMLElement>('.numberline-marker');
      const strip = el<HTMLElement>('.numberline-strip');

      strip.addEventListener('click', (ev) => {
        if (done) return;
        const v = tapValue(ev);
        sfx.blip();
        marker.style.left = `${v}%`;
        marker.classList.remove('numberline-hidden');
        marker.classList.remove('numberline-dropping');
        void marker.offsetWidth; // restart drop animation on retries
        marker.classList.add('numberline-dropping');
        if (Math.abs(v - r.target) <= 5) {
          done = true;
          setTimeout(() => {
            marker.style.left = `${r.target}%`;
            pulseAt(r.target);
            sfx.win();
          }, 350);
          endRound(msg, `${r.target} lives right there — ${closer}!`, 1, `place-${r.target}`, 2400);
        } else {
          mistakes++;
          sfx.buzz();
          msg.textContent = v < r.target
            ? `Not quite — ${r.target} is ${closer}. Try a tap further right!`
            : `Not quite — ${r.target} is ${closer}. Try a tap further left!`;
        }
      });
    } else if (r.kind === 'hop') {
      const lo = Math.floor(r.start / 10) * 10;
      const hi = lo + 10;
      const ones = r.start % 10;
      const correct = ones >= 5 ? hi : lo;

      wrap.innerHTML = `${head}
        <div class="numberline-target">Round <b>${r.start}</b> to the nearest ten!</div>
        ${lineHtml(`
          <div class="numberline-flag" style="left:${r.start}%">${r.start}</div>
          <div class="numberline-frog" style="left:${r.start}%"><span>🐸</span></div>`)}
        <div class="mechmsg">The frog sits on ${r.start}. Tap the ten it should hop to!</div>`;

      const msg = el<HTMLElement>('.mechmsg');
      const frog = el<HTMLElement>('.numberline-frog');
      const strip = el<HTMLElement>('.numberline-strip');

      const hopTo = (ten: number) => {
        frog.classList.add('numberline-hop');
        frog.style.left = `${ten}%`;
        setTimeout(() => frog.classList.remove('numberline-hop'), 750);
      };

      strip.addEventListener('click', (ev) => {
        if (done) return;
        const ten = Math.round(tapValue(ev) / 10) * 10;
        sfx.blip();
        if (ten === correct) {
          done = true;
          hopTo(correct);
          setTimeout(() => { pulseAt(correct); sfx.win(); }, 750);
          endRound(msg, `Boing! The ones digit of ${r.start} is ${ones} — ${tenRule(ones)} to ${correct}!`, 2, `hop-${r.start}`, 2700);
        } else if (ten === lo || ten === hi) {
          mistakes++;
          sfx.buzz();
          const lbl = wrap.querySelector(`.numberline-ticklabel[data-t="${ten}"]`);
          if (lbl) wobble(lbl);
          msg.textContent = `The ones digit is ${ones} — ${tenRule(ones)}. Try the other ten!`;
        } else {
          mistakes++;
          sfx.buzz();
          const lbl = wrap.querySelector(`.numberline-ticklabel[data-t="${ten}"]`);
          if (lbl) wobble(lbl);
          msg.textContent = `${r.start} lives between ${lo} and ${hi} — tap one of those tens!`;
        }
      });
    } else {
      wrap.innerHTML = `${head}
        <div class="numberline-target">Tap the number with a <b>4</b> in the TENS place!</div>
        ${lineHtml(r.nums.map(n =>
          `<button class="numberline-badge" data-n="${n}" style="left:${n}%">${n}</button>`).join(''))}
        <div class="mechmsg">Each number sits where it lives. Which one has 4 TENS?</div>`;

      const msg = el<HTMLElement>('.mechmsg');
      const badges = Array.from(wrap.querySelectorAll<HTMLButtonElement>('.numberline-badge'));

      for (const b of badges) {
        b.addEventListener('click', () => {
          if (done) return;
          const n = Number(b.dataset.n);
          sfx.blip();
          if (n === r.answer) {
            done = true;
            b.classList.add('numberline-badge-win');
            for (const other of badges) { if (other !== b) other.classList.add('numberline-badge-dim'); }
            pulseAt(n);
            sfx.win();
            endRound(msg, `${r.answer} = 4 tens and ${r.answer % 10} ones — the FIRST digit is the tens place!`, 3, `tens-${r.answer}`, 2700);
          } else {
            mistakes++;
            sfx.buzz();
            wobble(b);
            const t = Math.floor(n / 10);
            const o = n % 10;
            msg.textContent = `${n} has ${t} ten${t === 1 ? '' : 's'} and ${o} one${o === 1 ? '' : 's'} — its 4 is in the ONES place. Try another!`;
          }
        });
      }
    }
  };

  next();
}
