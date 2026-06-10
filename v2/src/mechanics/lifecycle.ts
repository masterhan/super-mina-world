// Life Cycle Garden — hands-on life cycles. Stage cards appear shuffled in a
// tray and Mina taps them in LIFE ORDER to fill a wheel that runs clockwise.
// The wheel IS the lesson: every correct stage snaps in and nudges the wheel
// alive, and a finished wheel spins all the way around with a traveling
// arrow — because life cycles repeat! Final round: spot METAMORPHOSIS.

import '../styles/lifecycle.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

interface Stage { e: string; name: string; teach: string }

interface SeqRound {
  kind: 'seq';
  key: string;
  title: string;
  center: string;
  tier: 1 | 2 | 3;
  stages: Stage[];
  cycleNote: string;     // celebration line — always points back to the start
}

interface PickOption { label: string; stages: string[]; right: boolean; teach: string }

interface PickRound {
  kind: 'pick';
  key: string;
  tier: 1 | 2 | 3;
  options: PickOption[];
  why: string;
}

type Round = SeqRound | PickRound;

function makeRounds(n: number): Round[] {
  const base: Round[] = [
    {
      kind: 'seq', key: 'butterfly', title: 'BUTTERFLY', center: '🦋', tier: 1,
      cycleNote: 'The butterfly lays new eggs — the cycle starts all over again!',
      stages: [
        { e: '🥚', name: 'egg', teach: 'The EGG comes first — every butterfly starts as a tiny egg on a leaf.' },
        { e: '🐛', name: 'caterpillar', teach: 'The caterpillar hatches from the egg — then it munches and munches!' },
        { e: '🛡️', name: 'chrysalis', teach: 'The chrysalis comes AFTER the caterpillar — that is where the big change happens!' },
        { e: '🦋', name: 'butterfly', teach: 'The butterfly comes LAST — it climbs out of the chrysalis with brand-new wings!' }
      ]
    },
    {
      kind: 'seq', key: 'frog', title: 'FROG', center: '🐸', tier: 1,
      cycleNote: 'The frog lays new eggs in the pond — around it goes!',
      stages: [
        { e: '🫧', name: 'eggs', teach: 'The EGGS come first — they float in the pond like tiny bubbles.' },
        { e: '🐟', name: 'tadpole', teach: 'The tadpole hatches from the eggs — it swims with a tail and has NO legs yet.' },
        { e: '🦎', name: 'froglet', teach: 'The froglet comes AFTER the tadpole — it grows legs but still keeps a bit of tail.' },
        { e: '🐸', name: 'frog', teach: 'The grown frog comes LAST — four legs, no tail, ready to hop!' }
      ]
    },
    {
      kind: 'seq', key: 'plant', title: 'PLANT', center: '🌻', tier: 2,
      cycleNote: 'The flower makes brand-new seeds — back to the very start!',
      stages: [
        { e: '🌰', name: 'seed', teach: 'The SEED comes first — every plant begins as a little seed in the soil.' },
        { e: '🌱', name: 'sprout', teach: 'The sprout pops out of the seed — a tiny green shoot reaching for the sun.' },
        { e: '🌿', name: 'plant', teach: 'The plant comes AFTER the sprout — taller stem, more leaves.' },
        { e: '🌸', name: 'flower', teach: 'The flower blooms LAST — and it makes the NEW seeds!' }
      ]
    },
    {
      kind: 'seq', key: 'chicken', title: 'CHICKEN', center: '🐔', tier: 2,
      cycleNote: 'The hen lays new eggs — the circle never stops!',
      stages: [
        { e: '🥚', name: 'egg', teach: 'The EGG comes first — it all starts inside the shell.' },
        { e: '🐣', name: 'chick', teach: 'The chick hatches out of the egg — peep peep!' },
        { e: '🐔', name: 'hen', teach: 'The hen comes LAST — she is the grown-up who lays new eggs.' }
      ]
    },
    {
      kind: 'pick', key: 'metamorphosis', tier: 3,
      why: 'The butterfly TRANSFORMS — caterpillar, chrysalis, then wings. That is metamorphosis!',
      options: [
        { label: 'butterfly', stages: ['🥚', '🐛', '🛡️', '🦋'], right: true, teach: '' },
        { label: 'chicken', stages: ['🥚', '🐣', '🐔'], right: false, teach: 'Close! A chick just grows BIGGER into a hen — same body shape the whole time. No metamorphosis.' },
        { label: 'plant', stages: ['🌰', '🌱', '🌿', '🌸'], right: false, teach: 'A plant grows from seed to flower — but it never builds a chrysalis and transforms. Find the one that DOES!' }
      ]
    }
  ];
  return base.slice(0, Math.max(3, Math.min(n, base.length)));
}

export function runLifecycle(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech lcmech';
  ctx.host.appendChild(wrap);

  const finish = () => {
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const q = (sel: string): HTMLElement => {
    const el = wrap.querySelector(sel);
    if (!el) throw new Error('lifecycle: missing ' + sel);
    return el as HTMLElement;
  };

  const shuffle = <T>(arr: T[]): T[] => {
    const a = arr.slice();
    for (let k = a.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    return a;
  };

  const sparkle = (box: HTMLElement) => {
    for (let s = 0; s < 10; s++) {
      const sp = document.createElement('span');
      sp.className = 'lcspark';
      sp.textContent = '✨';
      sp.style.left = (8 + Math.random() * 84).toFixed(1) + '%';
      sp.style.top = (8 + Math.random() * 84).toFixed(1) + '%';
      sp.style.animationDelay = (Math.random() * 0.6).toFixed(2) + 's';
      box.appendChild(sp);
    }
  };

  const award = (r: Round, mistakes: number, why: string) => {
    recordAttempt(ctx.save, {
      id: `mech.lifecycle.r${i}.${r.key}`, skill: 'bio.lifecycles', tier: r.tier,
      q: 'lifecycle', options: ['', '', '', ''], why
    }, mistakes === 0, Date.now());
    ctx.persist();
    if (mistakes === 0) flawless++;
    i++;
    if (i >= rounds.length) sfx.fanfare(); else sfx.win();
    setTimeout(next, 2600);
  };

  const head = () => `
    <div class="mechhead">
      <div class="mechtitle">🌼 Life Cycle Garden</div>
      <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
    </div>`;

  const playSeq = (r: SeqRound) => {
    let nextIdx = 0;
    let mistakes = 0;

    wrap.innerHTML = `
      ${head()}
      <div class="lctarget">Build the <b>${r.title}</b> cycle!</div>
      <div class="lcwheelbox">
        <div class="lcwheel">
          <div class="lccenter">${r.center}</div>
          <div class="lcring"><span class="lcarrowtip">➤</span></div>
        </div>
      </div>
      <div class="mechmsg lcmsg">The wheel goes around ⟳ — tap the stage that comes FIRST!</div>
      <div class="lctray"></div>`;

    const wheel = q('.lcwheel');
    const ring = q('.lcring');
    const msg = q('.lcmsg');
    const tray = q('.lctray');

    const n = r.stages.length;
    const slots: HTMLElement[] = r.stages.map((_, idx) => {
      const a = (idx / n) * Math.PI * 2 - Math.PI / 2;
      const slot = document.createElement('div');
      slot.className = 'lcslot';
      slot.style.left = (50 + Math.cos(a) * 41).toFixed(1) + '%';
      slot.style.top = (50 + Math.sin(a) * 41).toFixed(1) + '%';
      slot.textContent = String(idx + 1);
      wheel.appendChild(slot);
      return slot;
    });

    for (const st of shuffle(r.stages.map((s, idx) => ({ s, idx })))) {
      const card = document.createElement('button');
      card.className = 'lccard';
      card.innerHTML = `<span class="lccarde">${st.s.e}</span><span class="lccardname">${st.s.name}</span>`;
      card.addEventListener('click', () => {
        if (card.classList.contains('placed') || nextIdx >= n) return;
        sfx.blip();
        if (st.idx === nextIdx) {
          const slot = slots[st.idx];
          slot.textContent = st.s.e;
          slot.classList.add('filled');
          card.classList.add('placed');
          card.disabled = true;
          nextIdx++;
          if (nextIdx === n) {
            wheel.classList.add('lcspin');
            ring.classList.add('lcgo');
            sparkle(q('.lcwheelbox'));
            msg.textContent = '⭐ ' + r.cycleNote;
            award(r, mistakes, r.cycleNote);
          } else {
            sfx.chirp();
            wheel.classList.remove('lcnudge');
            void wheel.offsetWidth; // restart the alive-nudge animation
            wheel.classList.add('lcnudge');
            msg.textContent = `${st.s.name.toUpperCase()} — yes! The wheel turns... what comes next?`;
          }
        } else {
          mistakes++;
          sfx.buzz();
          card.classList.remove('lcwobble');
          void card.offsetWidth;
          card.classList.add('lcwobble');
          msg.textContent = st.s.teach;
        }
      });
      tray.appendChild(card);
    }
  };

  const playPick = (r: PickRound) => {
    let mistakes = 0;
    let solved = false;

    wrap.innerHTML = `
      ${head()}
      <div class="lctarget">Which one goes through <b>METAMORPHOSIS</b>?</div>
      <div class="lcpicks"></div>
      <div class="mechmsg lcmsg">Metamorphosis means the body TRANSFORMS into a whole new shape. Tap that wheel!</div>`;

    const msg = q('.lcmsg');
    const picks = q('.lcpicks');

    for (const opt of shuffle(r.options)) {
      const b = document.createElement('button');
      b.className = 'lcmini';
      const ringHtml = opt.stages.map((e, idx) => {
        const a = (idx / opt.stages.length) * Math.PI * 2 - Math.PI / 2;
        return `<span class="lcminis" style="left:${(50 + Math.cos(a) * 38).toFixed(1)}%;top:${(50 + Math.sin(a) * 38).toFixed(1)}%">${e}</span>`;
      }).join('');
      b.innerHTML = `<span class="lcminiwheel">${ringHtml}</span><span class="lcminilabel">${opt.label}</span>`;
      b.addEventListener('click', () => {
        if (solved) return;
        sfx.blip();
        if (opt.right) {
          solved = true;
          b.classList.add('lcwin');
          sparkle(picks);
          msg.textContent = '⭐ ' + r.why;
          award(r, mistakes, r.why);
        } else {
          mistakes++;
          sfx.buzz();
          b.classList.remove('lcwobble');
          void b.offsetWidth;
          b.classList.add('lcwobble');
          msg.textContent = opt.teach;
        }
      });
      picks.appendChild(b);
    }
  };

  const next = () => {
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    if (r.kind === 'seq') playSeq(r);
    else playPick(r);
  };

  next();
}
