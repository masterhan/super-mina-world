// Push, Pull & Poles — hands-on forces. PART A: Mina PREDICTS whether an
// object will float or sink, then drops it in the tank and WATCHES the truth
// (splash, bob, bubbles). Shape and material decide — a huge boat floats, a
// tiny coin sinks. PART B: two bar magnets on a track; she predicts PUSH or
// PULL from the facing poles, then lets go. Like poles repel, opposites
// attract — and magnets do it without even touching.

import '../styles/forces.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

type Pole = 'N' | 'S';

interface FloatItem { e: string; n: string; floats: boolean; why: string }
interface FloatRound { kind: 'float'; items: FloatItem[] }
interface MagnetRound { kind: 'magnet'; left: [Pole, Pole]; right: [Pole, Pole]; flip?: boolean }
type Round = FloatRound | MagnetRound;

function makeRounds(n: number): Round[] {
  const base: Round[] = [
    { kind: 'float', items: [
      { e: '🪨', n: 'rock', floats: false, why: 'Solid stone all the way through — heavier than the water it pushes away.' },
      { e: '🦆', n: 'rubber duck', floats: true, why: 'Hollow and full of air — air loves to float!' }
    ] },
    { kind: 'float', items: [
      { e: '⚓', n: 'anchor', floats: false, why: 'Solid heavy metal — sinking is its whole job!' },
      { e: '🧊', n: 'ice cube', floats: true, why: 'Frozen water is a tiny bit lighter than liquid water. That is why icebergs bob!' }
    ] },
    { kind: 'float', items: [
      { e: '🪙', n: 'coin', floats: false, why: 'Tiny, but solid metal — SMALL things can still sink!' },
      { e: '🚤', n: 'boat', floats: true, why: 'HUGE, but its shape pushes lots of water aside. Shape matters, not just weight!' }
    ] },
    { kind: 'magnet', left: ['N', 'S'], right: ['N', 'S'] },
    { kind: 'magnet', left: ['N', 'S'], right: ['S', 'N'] },
    { kind: 'magnet', left: ['S', 'N'], right: ['N', 'S'], flip: true }
  ];
  return base.slice(0, Math.max(4, Math.min(n, base.length)));
}

export function runForces(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech forcesmech';
  ctx.host.appendChild(wrap);

  const el = <T extends Element>(sel: string): T => {
    const node = wrap.querySelector(sel);
    if (!node) throw new Error(`forces: missing ${sel}`);
    return node as T;
  };

  const finish = () => {
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const head = (ask: string) => `
    <div class="mechhead">
      <div class="mechtitle">🧲 Push, Pull &amp; Poles</div>
      <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
    </div>
    <div class="forcesask">${ask}</div>`;

  const endRound = (r: Round, mistakes: number, why: string) => {
    recordAttempt(ctx.save, {
      id: `mech.forces.r${i}.${r.kind}`, skill: 'phys.forces', tier: i < 2 ? 1 : i < 4 ? 2 : 3,
      q: r.kind === 'float' ? 'float or sink' : 'magnet poles', options: ['', '', '', ''], why
    }, mistakes === 0, Date.now());
    ctx.persist();
    if (mistakes === 0) flawless++;
    i++;
    const allDone = i >= rounds.length;
    setTimeout(() => { if (allDone) sfx.fanfare(); else sfx.win(); }, 420);
    setTimeout(next, 2200);
  };

  const splash = (tank: HTMLElement) => {
    for (let k = 0; k < 10; k++) {
      const d = document.createElement('div');
      d.className = 'forcesdroplet';
      d.style.setProperty('--dx', `${(Math.random() - 0.5) * 130}px`);
      d.style.setProperty('--dy', `${-30 - Math.random() * 46}px`);
      tank.appendChild(d);
      setTimeout(() => d.remove(), 650);
    }
  };

  const bubbles = (zone: HTMLElement) => {
    for (let k = 0; k < 8; k++) {
      const b = document.createElement('div');
      b.className = 'forcesbubble';
      b.style.left = `${34 + Math.random() * 32}%`;
      const s = 6 + Math.floor(Math.random() * 9);
      b.style.width = `${s}px`;
      b.style.height = `${s}px`;
      b.style.animationDuration = `${0.9 + Math.random() * 0.6}s`;
      zone.appendChild(b);
      setTimeout(() => b.remove(), 1600);
    }
  };

  const floatRound = (r: FloatRound) => {
    let j = 0;
    let mistakes = 0;

    const show = () => {
      const it = r.items[j];
      wrap.innerHTML = `
        ${head(`Will the <b>${it.n}</b> ${it.e} FLOAT or SINK?`)}
        <div class="forcestank">
          <div class="forceswater"></div>
          <div class="forcesbub"></div>
          <div class="forcesobj">${it.e}</div>
        </div>
        <div class="mechmsg">Make your prediction... then watch what REALLY happens!</div>
        <div class="mechbtns">
          <button class="forcesguess forcesfloatbtn">🛟 FLOAT</button>
          <button class="forcesguess forcessinkbtn">⬇️ SINK</button>
        </div>`;

      const msg = el<HTMLElement>('.mechmsg');
      const tank = el<HTMLElement>('.forcestank');
      const obj = el<HTMLElement>('.forcesobj');
      const bub = el<HTMLElement>('.forcesbub');
      const bFloat = el<HTMLButtonElement>('.forcesfloatbtn');
      const bSink = el<HTMLButtonElement>('.forcessinkbtn');

      const guess = (pred: boolean) => {
        sfx.blip();
        bFloat.disabled = true;
        bSink.disabled = true;
        msg.textContent = `You predicted ${pred ? 'FLOAT' : 'SINK'}... Tap the tank to drop it in!`;
        tank.classList.add('forcestappable');
        tank.addEventListener('click', () => {
          tank.classList.remove('forcestappable');
          obj.classList.add(it.floats ? 'forcesfloating' : 'forcessinking');
          splash(tank);
          if (!it.floats) bubbles(bub);
          setTimeout(() => {
            const correct = pred === it.floats;
            const verb = it.floats ? 'FLOATS' : 'SINKS';
            if (correct) {
              sfx.chirp();
              msg.textContent = `⭐ Yes! The ${it.n} ${verb}! ${it.why}`;
            } else {
              mistakes++;
              sfx.buzz();
              tank.classList.add('forceswobble');
              msg.textContent = `Ooh — look! The ${it.n} actually ${verb}. ${it.why}`;
            }
            j++;
            if (j >= r.items.length) endRound(r, mistakes, it.why);
            else setTimeout(show, 2400);
          }, 1150);
        }, { once: true });
      };
      bFloat.onclick = () => guess(true);
      bSink.onclick = () => guess(false);
    };
    show();
  };

  const magnetRound = (r: MagnetRound) => {
    let mistakes = 0;
    const poleHtml = (poles: [Pole, Pole]) =>
      poles.map(p => `<span class="forcespole forcespole-${p.toLowerCase()}">${p}</span>`).join('');

    wrap.innerHTML = `
      ${head('Will the magnets <b>PUSH</b> apart or <b>PULL</b> together?')}
      <div class="forcestrack">
        <div class="forcesrail"></div>
        <div class="forcesmag forcesmag-left">${poleHtml(r.left)}</div>
        <div class="forcesmag forcesmag-right">${poleHtml(r.right)}</div>
        <div class="forcesspark">✨</div>
      </div>
      <div class="mechmsg">Look at the two poles facing each other!</div>
      <div class="mechbtns">
        <button class="forcesguess forcespushbtn">🙌 PUSH APART</button>
        <button class="forcesguess forcespullbtn">🧲 PULL TOGETHER</button>
      </div>`;

    const msg = el<HTMLElement>('.mechmsg');
    const track = el<HTMLElement>('.forcestrack');
    const leftMag = el<HTMLElement>('.forcesmag-left');
    const rightMag = el<HTMLElement>('.forcesmag-right');
    const spark = el<HTMLElement>('.forcesspark');
    const bPush = el<HTMLButtonElement>('.forcespushbtn');
    const bPull = el<HTMLButtonElement>('.forcespullbtn');

    let rightPoles: [Pole, Pole] = [r.right[0], r.right[1]];
    const setButtons = (on: boolean) => { bPush.disabled = !on; bPull.disabled = !on; };

    if (r.flip) {
      setButtons(false);
      msg.textContent = 'Watch closely — flipping the right magnet around!';
      setTimeout(() => {
        sfx.blip();
        rightMag.classList.add('forcesflipping');
        setTimeout(() => {
          rightPoles = [rightPoles[1], rightPoles[0]];
          rightMag.innerHTML = poleHtml(rightPoles);
          rightMag.classList.remove('forcesflipping');
        }, 480);
        setTimeout(() => {
          setButtons(true);
          msg.textContent = 'It flipped! NOW which poles face each other?';
        }, 1100);
      }, 900);
    }

    const guess = (predPull: boolean) => {
      sfx.blip();
      setButtons(false);
      const attract = r.left[1] !== rightPoles[0];
      const facing = `${r.left[1]} faces ${rightPoles[0]}`;
      msg.textContent = `You predicted ${predPull ? 'PULL' : 'PUSH'}... Tap the magnets to let them go!`;
      track.classList.add('forcestappable');
      track.addEventListener('click', () => {
        track.classList.remove('forcestappable');
        leftMag.classList.add(attract ? 'forcespull-l' : 'forcespush-l');
        rightMag.classList.add(attract ? 'forcespull-r' : 'forcespush-r');
        if (attract) setTimeout(() => spark.classList.add('forcesclink'), 550);
        setTimeout(() => {
          const correct = predPull === attract;
          const why = attract
            ? `${facing} — OPPOSITE poles PULL together. Click!`
            : `${facing} — LIKE poles PUSH apart... without even touching!`;
          if (correct) {
            sfx.chirp();
            msg.textContent = `⭐ Yes! ${why}`;
          } else {
            mistakes++;
            sfx.buzz();
            msg.classList.add('forceswobble');
            msg.textContent = `Ooh — watch again! ${why}`;
          }
          endRound(r, mistakes, why);
        }, 1200);
      }, { once: true });
    };
    bPush.onclick = () => guess(false);
    bPull.onclick = () => guess(true);
  };

  const next = () => {
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    if (r.kind === 'float') floatRound(r);
    else magnetRound(r);
  };

  next();
}
