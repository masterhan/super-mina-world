// Circuit Works — hands-on circuits. Mina BUILDS the loop: tap a part in the
// tray, then tap a gap on the board. Conductors close the loop and the bulb
// LIGHTS (glow + current animation); insulators fizzle in the gap and teach
// why ("rubber is an insulator"). A switch round lets her flip the power
// herself. The interaction IS the lesson: electricity only flows around a
// COMPLETE loop of conductors.

import '../styles/circuits.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

type PartKey = 'wire' | 'switch' | 'paperclip' | 'rubberband' | 'spoon' | 'stick';

interface PartDef {
  emoji: string;
  name: string;
  conducts: boolean;
  why: string;
}

const PARTS: Record<PartKey, PartDef> = {
  wire:       { emoji: '〰️', name: 'WIRE',          conducts: true,  why: 'Copper wire is a conductor — electricity flows right through it!' },
  switch:     { emoji: '🎚️', name: 'SWITCH',        conducts: true,  why: 'A switch is a gate: closed lets electricity flow, open stops it.' },
  paperclip:  { emoji: '📎', name: 'PAPERCLIP',     conducts: true,  why: 'A paperclip is METAL — metal conducts electricity!' },
  rubberband: { emoji: '➿', name: 'RUBBER BAND',   conducts: false, why: 'Rubber is an insulator — electricity cannot flow through it.' },
  spoon:      { emoji: '🥄', name: 'PLASTIC SPOON', conducts: false, why: 'Plastic is an insulator — electricity cannot flow through it.' },
  stick:      { emoji: '🪵', name: 'WOODEN STICK',  conducts: false, why: 'Wood is an insulator — electricity cannot flow through it.' }
};

interface Round {
  slots: number;          // gaps in the loop (1 or 2)
  tray: PartKey[];
  switchPlay?: boolean;   // after it lights, flip the switch OFF and ON to finish
  intro: string;
  win: string;            // celebration teaching line
  tier: 1 | 2 | 3;
}

function makeRounds(n: number): Round[] {
  const base: Round[] = [
    { slots: 1, tray: ['wire'], tier: 1,
      intro: 'The loop has a GAP! Tap the wire, then tap the gap.',
      win: 'You closed the loop! Electricity flows in a CIRCLE — battery to bulb and back.' },
    { slots: 2, tray: ['wire', 'switch'], switchPlay: true, tier: 1,
      intro: 'Two gaps! Build the loop with the wire AND the switch.',
      win: 'The switch opens and closes the loop — YOU control the electricity!' },
    { slots: 1, tray: ['rubberband', 'paperclip', 'spoon'], tier: 2,
      intro: 'No wire left! Which one lets electricity through?',
      win: 'Metal conducts! The paperclip closed the loop just like a wire.' },
    { slots: 1, tray: ['stick', 'spoon', 'paperclip', 'rubberband'], tier: 2,
      intro: 'Trickier! Only ONE of these is a conductor…',
      win: 'Wood, plastic, rubber = insulators. Metal = conductor. You found it!' },
    { slots: 2, tray: ['rubberband', 'wire', 'stick', 'paperclip'], tier: 3,
      intro: 'TWO gaps now! Fill BOTH with conductors to light the bulb.',
      win: 'Every piece of the loop must conduct — one insulator stops it all!' }
  ];
  return base.slice(0, Math.max(3, Math.min(n, base.length)));
}

export function runCircuits(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech circmech';
  ctx.host.appendChild(wrap);

  const finish = () => {
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const next = () => {
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    let mistakes = 0;
    let selected: number | null = null;   // index into r.tray
    let switchClosed = false;             // a placed switch starts OPEN
    let litOnce = false;
    let toggles = 0;
    let roundOver = false;
    const placed: (PartKey | null)[] = new Array(r.slots).fill(null);

    wrap.innerHTML = `
      <div class="mechhead">
        <div class="mechtitle">🔌 Circuit Works</div>
        <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
      </div>
      <div class="circboard">
        <div class="circtrack circtrack-top"></div>
        <div class="circtrack circtrack-right"></div>
        <div class="circtrack circtrack-bottom"></div>
        <div class="circtrack circtrack-left"></div>
        <div class="circnode circbulb">💡</div>
        <div class="circnode circbattery">🔋<span class="circlabel">BATTERY</span></div>
      </div>
      <div class="mechmsg circmsg">${r.intro}</div>
      <div class="circtray"></div>`;

    const board = wrap.querySelector('.circboard') as HTMLElement;
    const msg = wrap.querySelector('.circmsg') as HTMLElement;
    const tray = wrap.querySelector('.circtray') as HTMLElement;
    const slotEls: HTMLElement[] = [];
    const trayEls: HTMLButtonElement[] = [];

    const drawSlot = (s: number) => {
      const el = slotEls[s];
      const key = placed[s];
      el.classList.toggle('filled', key !== null);
      el.classList.remove('circswitch', 'open');
      if (!key) { el.textContent = '?'; return; }
      const p = PARTS[key];
      if (key === 'switch') {
        el.classList.add('circswitch');
        el.classList.toggle('open', !switchClosed);
        el.innerHTML = `<span class="circpart-emoji">${p.emoji}</span><span class="circlabel">${switchClosed ? 'ON' : 'OFF'}</span>`;
      } else {
        el.innerHTML = `<span class="circpart-emoji">${p.emoji}</span>`;
      }
    };

    const loopComplete = () => placed.every(k => k !== null && PARTS[k].conducts);
    const isLit = () => loopComplete() && (!placed.includes('switch') || switchClosed);
    const updateLight = () => {
      const lit = isLit();
      board.classList.toggle('lit', lit);
      return lit;
    };

    const finishRound = (why: string) => {
      roundOver = true;
      const last = i === rounds.length - 1;
      if (last) sfx.fanfare(); else sfx.win();
      msg.textContent = '⭐ ' + why;
      recordAttempt(ctx.save, {
        id: `mech.circuits.r${i}.${r.slots}gap${r.switchPlay ? '-switch' : ''}`, skill: 'phys.circuits', tier: r.tier,
        q: 'circuit', options: ['', '', '', ''], why
      }, mistakes === 0, Date.now());
      ctx.persist();
      if (mistakes === 0) flawless++;
      i++;
      setTimeout(next, 2100);
    };

    const toggleSwitch = (s: number) => {
      switchClosed = !switchClosed;
      sfx.blip();
      drawSlot(s);
      const lit = updateLight();
      if (!loopComplete()) {
        msg.textContent = switchClosed ? 'Switch ON! Now fill the other gap.' : 'Switch OFF. Fill the other gap too!';
        return;
      }
      if (lit) {
        if (!r.switchPlay) return finishRound(r.win);
        if (!litOnce) {
          litOnce = true;
          sfx.chirp();
          msg.textContent = '💡 It LIGHTS! Now tap the switch again — turn it OFF.';
        } else {
          toggles++;
          if (toggles >= 2) {
            finishRound(r.win);
          } else {
            sfx.chirp();
            msg.textContent = '💡 Back ON! Flip it once more…';
          }
        }
      } else if (litOnce) {
        toggles++;
        msg.textContent = 'Dark! The OPEN switch breaks the loop — electricity stops. Tap it again!';
      } else {
        msg.textContent = 'The switch is OFF — the loop is still open. Tap it!';
      }
    };

    const onSlotTap = (s: number) => {
      if (roundOver) return;
      if (placed[s] === 'switch') return toggleSwitch(s);
      if (placed[s] !== null) {
        sfx.blip();
        msg.textContent = 'That gap is already filled!';
        return;
      }
      if (selected === null) {
        sfx.blip();
        msg.textContent = 'Pick a part from the tray first!';
        return;
      }
      const t = selected;
      const key = r.tray[t];
      const p = PARTS[key];
      if (!p.conducts) {
        // it fits in the gap, but no light — wobble, teach, bounce back to tray
        mistakes++;
        selected = null;
        trayEls[t].classList.remove('sel');
        placed[s] = key;
        drawSlot(s);
        const el = slotEls[s];
        el.classList.add('fizzle');
        sfx.buzz();
        msg.textContent = p.why + ' Try something else!';
        setTimeout(() => {
          if (roundOver) return;
          placed[s] = null;
          el.classList.remove('fizzle');
          drawSlot(s);
        }, 1200);
        return;
      }
      // conductor placed — it stays
      placed[s] = key;
      selected = null;
      trayEls[t].classList.remove('sel');
      trayEls[t].disabled = true;
      if (key === 'switch') switchClosed = false;
      drawSlot(s);
      sfx.chirp();
      const lit = updateLight();
      if (lit) {
        if (r.switchPlay && !litOnce) {
          litOnce = true;
          msg.textContent = '💡 It LIGHTS! Now tap the switch — turn it OFF and ON!';
        } else {
          finishRound(r.win);
        }
      } else if (loopComplete()) {
        msg.textContent = 'The loop is built — but the switch is OFF! Tap the switch!';
      } else {
        msg.textContent = 'Nice! One more gap to fill…';
      }
    };

    for (let s = 0; s < r.slots; s++) {
      const el = document.createElement('div');
      el.className = 'circnode circslot ' + (s === 0 ? 'circslot-right' : 'circslot-left');
      el.textContent = '?';
      el.addEventListener('click', () => onSlotTap(s));
      board.appendChild(el);
      slotEls.push(el);
    }

    r.tray.forEach((key, ti) => {
      const p = PARTS[key];
      const b = document.createElement('button');
      b.className = 'circpart';
      b.innerHTML = `<span class="circpart-emoji">${p.emoji}</span><span class="circpart-name">${p.name}</span>`;
      b.addEventListener('click', () => {
        if (roundOver || b.disabled) return;
        sfx.blip();
        selected = selected === ti ? null : ti;
        trayEls.forEach((el, j) => el.classList.toggle('sel', selected === j));
        msg.textContent = selected === null ? r.intro : `${p.name} picked! Now tap a gap on the board.`;
      });
      tray.appendChild(b);
      trayEls.push(b);
    });
  };

  next();
}
