// Food Chain Falls — hands-on food chains. Mina BUILDS chains by tapping
// organisms in energy order: sun feeds plants, plants feed eaters, eaters
// feed bigger eaters. Wrong taps wobble back with WHY ("a rabbit cannot eat
// a fox!"). A finished chain runs an ENERGY PULSE down the links and reveals
// each organism's role (PRODUCER / CONSUMER / DECOMPOSER). Final round adds
// a role quiz: herbivore, carnivore or omnivore?

import '../styles/foodchain.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

interface Org {
  e: string;        // emoji
  name: string;
  role: string;     // ENERGY / PRODUCER / CONSUMER / DECOMPOSER
  placed?: string;  // teaching line when this card snaps in
}

type QuizRole = 'HERBIVORE' | 'CARNIVORE' | 'OMNIVORE';

interface Quiz {
  target: number;   // chain index to highlight
  answer: QuizRole;
  ask: string;
  lines: Record<QuizRole, string>; // teaching line per tapped role
}

interface Round {
  key: string;
  habitat: string;
  chain: Org[];     // correct energy order, sun first
  tier: 1 | 2 | 3;
  why: string;
  quiz?: Quiz;
}

const SUN: Org = {
  e: '☀️', name: 'Sun', role: 'ENERGY',
  placed: '☀️ The Sun! Every food chain starts with its energy.'
};
const GRASS: Org = { e: '🌱', name: 'Grass', role: 'PRODUCER' };
const RABBIT: Org = { e: '🐰', name: 'Rabbit', role: 'CONSUMER' };
const MUSHROOM: Org = {
  e: '🍄', name: 'Mushroom', role: 'DECOMPOSER',
  placed: '🍄 The cleanup crew! Decomposers break down what’s left and feed the soil.'
};

function makeRounds(n: number): Round[] {
  const base: Round[] = [
    {
      key: 'meadow3', habitat: '🌾 The Meadow', tier: 1,
      chain: [SUN, GRASS, RABBIT],
      why: 'Energy flows ☀️ → 🌱 → 🐰. Plants MAKE food, animals EAT it!'
    },
    {
      key: 'meadow4', habitat: '🌾 The Meadow at Cleanup Time', tier: 1,
      chain: [SUN, GRASS, RABBIT, MUSHROOM],
      why: '🍄 Decomposers are the cleanup crew — they break down what’s left and feed the soil!'
    },
    {
      key: 'ocean4', habitat: '🌊 The Ocean', tier: 2,
      chain: [
        SUN,
        { e: '🌿', name: 'Seaweed', role: 'PRODUCER' },
        { e: '🐟', name: 'Fish', role: 'CONSUMER' },
        { e: '🦈', name: 'Shark', role: 'CONSUMER' }
      ],
      why: 'Ocean chains work the same — 🌿 seaweed makes food, 🐟 fish eat it, 🦈 sharks eat fish!'
    },
    {
      key: 'grassland5', habitat: '🌾 The Grassland', tier: 2,
      chain: [
        SUN,
        GRASS,
        { e: '🐭', name: 'Mouse', role: 'CONSUMER' },
        { e: '🐍', name: 'Snake', role: 'CONSUMER' },
        { e: '🦅', name: 'Hawk', role: 'CONSUMER' }
      ],
      why: 'Five links! ☀️ → 🌱 → 🐭 → 🐍 → 🦅 — every eater gets energy from the eaten.'
    },
    {
      key: 'forest4quiz', habitat: '🌲 The Forest', tier: 3,
      chain: [
        SUN,
        GRASS,
        { e: '🦌', name: 'Deer', role: 'CONSUMER' },
        { e: '🐺', name: 'Wolf', role: 'CONSUMER' }
      ],
      why: '🦌 Deer eat ONLY plants — that makes them HERBIVORES!',
      quiz: {
        target: 2,
        answer: 'HERBIVORE',
        ask: 'The 🦌 Deer is a CONSUMER — but what KIND of eater is it? Tap its role!',
        lines: {
          HERBIVORE: '🦌 Deer eat ONLY plants — that makes them HERBIVORES!',
          CARNIVORE: 'Carnivores eat other animals — the deer only munches plants. Try again!',
          OMNIVORE: 'Omnivores eat plants AND animals — the deer sticks to plants. Try again!'
        }
      }
    }
  ];
  return base.slice(0, Math.max(3, Math.min(n, base.length)));
}

function shuffle<T>(a: T[]): T[] {
  const b = a.slice();
  for (let k = b.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [b[k], b[j]] = [b[j], b[k]];
  }
  return b;
}

function el<T extends HTMLElement>(root: HTMLElement, sel: string): T {
  const n = root.querySelector(sel);
  if (!n) throw new Error('foodchain: missing ' + sel);
  return n as T;
}

export function runFoodchain(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech fcmech';
  ctx.host.appendChild(wrap);

  const finish = () => {
    sfx.fanfare();
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const next = () => {
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    let filled = 0;
    let mistakes = 0;
    let solved = false;

    const chainHtml = r.chain.map((_, k) =>
      `${k > 0 ? '<div class="fcarrow">▼</div>' : ''}<div class="fcslot"><span class="fcq">?</span></div>`
    ).join('');

    wrap.innerHTML = `
      <div class="mechhead">
        <div class="mechtitle">🦊 Food Chain Falls</div>
        <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
      </div>
      <div class="fchabitat">${r.habitat}</div>
      <div class="fcchain">${chainHtml}<div class="fcdot"></div></div>
      <div class="mechmsg">Tap the cards in energy order. Who goes FIRST?</div>
      <div class="fcsupply"></div>`;

    const msg = el<HTMLElement>(wrap, '.mechmsg');
    const supply = el<HTMLElement>(wrap, '.fcsupply');
    const slots = Array.from(wrap.querySelectorAll<HTMLElement>('.fcslot'));
    const dot = el<HTMLElement>(wrap, '.fcdot');

    const roundDone = () => {
      sfx.win();
      msg.textContent = '⭐ ' + r.why;
      recordAttempt(ctx.save, {
        id: `mech.foodchain.r${i}.${r.key}`, skill: 'bio.foodchains', tier: r.tier,
        q: 'foodchain', options: ['', '', '', ''], why: r.why
      }, mistakes === 0, Date.now());
      ctx.persist();
      if (mistakes === 0) flawless++;
      i++;
      setTimeout(next, 2300);
    };

    const startQuiz = (qz: Quiz) => {
      const slot = slots[qz.target];
      slot.classList.add('quizhl');
      msg.textContent = qz.ask;
      const btns = document.createElement('div');
      btns.className = 'mechbtns fcquiz';
      const icons: Record<QuizRole, string> = { HERBIVORE: '🌿', CARNIVORE: '🍖', OMNIVORE: '🍽️' };
      (Object.keys(icons) as QuizRole[]).forEach(role => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = `${icons[role]} ${role}`;
        b.addEventListener('click', () => {
          if (role === qz.answer) {
            slot.classList.remove('quizhl');
            btns.remove();
            roundDone();
          } else {
            mistakes++;
            sfx.buzz();
            b.classList.add('wobble');
            window.setTimeout(() => b.classList.remove('wobble'), 460);
            msg.textContent = qz.lines[role];
          }
        });
        btns.appendChild(b);
      });
      wrap.appendChild(btns);
    };

    // the reward: a glowing energy pulse travels down the finished chain,
    // lighting each link and revealing its role label
    const energyPulse = () => {
      msg.textContent = '⚡ Chain complete! Watch the energy flow…';
      const place = (s: HTMLElement) => {
        dot.style.top = `${s.offsetTop + s.offsetHeight / 2 - 9}px`;
      };
      place(slots[0]);
      dot.classList.add('on');
      slots.forEach((s, k) => {
        window.setTimeout(() => {
          place(s);
          s.classList.add('zap');
          const role = el<HTMLElement>(s, '.fcrole');
          role.textContent = r.chain[k].role;
          role.classList.add('show');
          sfx.chirp();
        }, 250 + k * 480);
      });
      window.setTimeout(() => {
        dot.classList.remove('on');
        if (r.quiz) startQuiz(r.quiz); else roundDone();
      }, 250 + slots.length * 480 + 350);
    };

    let order = shuffle(r.chain.map((_, k) => k));
    if (order.every((v, idx) => v === idx)) order = order.slice().reverse();

    order.forEach(k => {
      const o = r.chain[k];
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'fccard';
      b.innerHTML = `<span class="fce">${o.e}</span>${o.name}`;
      b.addEventListener('click', () => {
        if (solved || b.classList.contains('used')) return;
        if (k === filled) {
          sfx.blip();
          b.classList.add('used');
          const slot = slots[filled];
          slot.classList.add('full');
          slot.innerHTML = `<span class="fcemoji">${o.e}</span><span class="fcname">${o.name}</span><span class="fcrole"></span>`;
          msg.textContent = o.placed ?? `${o.e} ${o.name} snaps in — who eats next?`;
          filled++;
          if (filled === r.chain.length) {
            solved = true;
            window.setTimeout(energyPulse, 350);
          }
        } else {
          mistakes++;
          sfx.buzz();
          b.classList.add('wobble');
          window.setTimeout(() => b.classList.remove('wobble'), 460);
          const expected = r.chain[filled];
          msg.textContent =
            filled === 0 ? 'Every food chain starts with the ☀️ Sun — all energy comes from it!'
            : o.role === 'DECOMPOSER' ? 'The 🍄 cleanup crew comes LAST — decomposers break down what’s left!'
            : `A ${expected.name.toLowerCase()} cannot eat a ${o.name.toLowerCase()}! Energy flows from eaten TO eater.`;
        }
      });
      supply.appendChild(b);
    });
  };

  next();
}
