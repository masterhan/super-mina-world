// Word Forge — hands-on word parts. Mina FORGES words on an anvil from
// prefix / root / suffix tiles. The interaction IS the lesson: the target is
// a MEANING ("not happy"), and snapping UN- onto HAPPY shows how a prefix
// changes meaning. Wrong combos crumble gently and explain what the parts
// really say. Finale: forge TWO different real words from the SAME root.

import '../styles/wordforge.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

type Kind = 'prefix' | 'root' | 'suffix';

const KIND: Record<string, Kind> = {
  un: 'prefix', re: 'prefix', pre: 'prefix', dis: 'prefix',
  ful: 'suffix', less: 'suffix', er: 'suffix',
  happy: 'root', play: 'root', heat: 'root', read: 'root', agree: 'root',
  care: 'root', sun: 'root', flower: 'root', rain: 'root', bow: 'root', appear: 'root'
};

const MEANING: Record<string, string> = {
  un: 'UN- means NOT',
  re: 'RE- means AGAIN',
  pre: 'PRE- means BEFORE',
  dis: 'DIS- means NOT, the opposite',
  ful: '-FUL means FULL OF',
  less: '-LESS means WITHOUT',
  er: '-ER means a person who'
};

interface Goal {
  target: string;     // the meaning to forge, e.g. 'NOT HAPPY'
  answer: string[];   // part keys in order, e.g. ['un', 'happy']
  teach: string;      // celebrated line on success
}

interface Round {
  tray: string[];     // part keys offered (unique per round)
  goals: Goal[];      // 1 goal normally; the finale forges 2 from one root
  tier: 1 | 2 | 3;
  wrongLines?: Record<string, string>; // known wrong builds → kind teach line
}

function makeRounds(n: number): Round[] {
  const base: Round[] = [
    { tier: 1, tray: ['un', 're', 'happy', 'play'],
      goals: [{ target: 'NOT HAPPY', answer: ['un', 'happy'],
        teach: 'UN- means NOT — so UNHAPPY = not happy!' }] },
    { tier: 1, tray: ['re', 'un', 'heat', 'read'],
      goals: [{ target: 'HEAT AGAIN', answer: ['re', 'heat'],
        teach: 'RE- means AGAIN — REHEAT = heat it again!' }] },
    { tier: 1, tray: ['read', 'play', 'er', 'ful'],
      goals: [{ target: 'A PERSON WHO READS', answer: ['read', 'er'],
        teach: '-ER means a person who — a READER is a person who reads!' }] },
    { tier: 2, tray: ['care', 'play', 'less', 'ful'],
      goals: [{ target: 'WITHOUT CARE', answer: ['care', 'less'],
        teach: '-LESS means WITHOUT — CARELESS = without care!' }] },
    { tier: 2, tray: ['sun', 'rain', 'flower', 'bow'],
      goals: [{ target: 'A FLOWER THAT LOVES THE SUN', answer: ['sun', 'flower'],
        teach: 'Two whole words can join — SUN + FLOWER = SUNFLOWER!' }],
      wrongLines: {
        rainbow: 'RAINBOW is a real word — nice forging! But we need a FLOWER that loves the sun.'
      } },
    { tier: 2, tray: ['dis', 'un', 'agree', 'appear'],
      goals: [{ target: 'NOT AGREE', answer: ['dis', 'agree'],
        teach: 'DIS- means NOT — DISAGREE = to not agree!' }],
      wrongLines: {
        unagree: 'Good thinking — UN- does mean NOT! But UNAGREE isn’t a real word. English uses DIS- here.',
        unappear: 'UN- does mean NOT — good thinking! But UNAPPEAR isn’t a real word. English pairs DIS- with AGREE.',
        disappear: 'DISAPPEAR is a real word — but it means to vanish! We want NOT AGREE.'
      } },
    { tier: 3, tray: ['pre', 're', 'heat', 'read'],
      goals: [{ target: 'HEAT BEFORE', answer: ['pre', 'heat'],
        teach: 'PRE- means BEFORE — you PREHEAT the oven before baking!' }],
      wrongLines: {
        reheat: 'REHEAT is a real word — but RE- means AGAIN. We want heat BEFORE — that’s PRE-!',
        reread: 'REREAD is a real word — read AGAIN! But we want heat BEFORE.'
      } },
    { tier: 3, tray: ['re', 'un', 'play', 'ful', 'less'],
      goals: [
        { target: 'PLAY AGAIN', answer: ['re', 'play'],
          teach: 'RE- means AGAIN — REPLAY = play it again!' },
        { target: 'FULL OF PLAY', answer: ['play', 'ful'],
          teach: '-FUL means FULL OF — PLAYFUL = full of play. Same root, two words!' }
      ],
      wrongLines: {
        playful: 'PLAYFUL is a real word — full of play! Save it for later. First we want PLAY AGAIN.',
        replay: 'You already forged REPLAY! Now we want FULL OF PLAY — try a SUFFIX on the end.'
      } }
  ];
  return base.slice(0, Math.max(3, Math.min(n, base.length)));
}

function label(key: string): string {
  const k = KIND[key];
  if (k === 'prefix') return key.toUpperCase() + '-';
  if (k === 'suffix') return '-' + key.toUpperCase();
  return key.toUpperCase();
}

function explainWrong(built: string[], goal: Goal, wrongLines?: Record<string, string>): string {
  const word = built.join('');
  if (wrongLines && wrongLines[word]) return wrongLines[word];

  // right pieces, wrong order → teach where prefixes/suffixes live
  const sorted = (a: string[]) => [...a].sort().join('|');
  if (sorted(built) === sorted(goal.answer)) {
    const affix = goal.answer.find(p => KIND[p] !== 'root');
    if (affix && KIND[affix] === 'prefix') {
      return `Right pieces — wrong order! ${label(affix)} is a PREFIX, it goes at the FRONT.`;
    }
    if (affix && KIND[affix] === 'suffix') {
      return `Right pieces — wrong order! ${label(affix)} is a SUFFIX, it goes at the END.`;
    }
    return 'Right pieces — try swapping their order!';
  }

  // used an affix that doesn't belong → say what it really means
  const stray = built.find(p => MEANING[p] !== undefined && !goal.answer.includes(p));
  if (stray) return `${MEANING[stray]} — but we want: ${goal.target}. Try a different piece!`;

  // the affix is right, the other piece is off
  const kept = built.find(p => MEANING[p] !== undefined && goal.answer.includes(p));
  if (kept) return `${MEANING[kept]} — that part is right! Now check the other piece. We want: ${goal.target}.`;

  return `Hmm, “${word.toUpperCase()}” doesn’t say ${goal.target}. Look at what each piece means!`;
}

export function runWordForge(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech wfmech';
  ctx.host.appendChild(wrap);

  const finish = () => {
    sfx.fanfare();
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const next = () => {
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    let g = 0;             // which goal in this round (finale has 2)
    let mistakes = 0;

    const startGoal = () => {
      const goal = r.goals[g];
      const slots: (string | null)[] = goal.answer.map(() => null);
      let locked = false;

      const hello = r.goals.length > 1
        ? (g === 0 ? 'Finale! Forge word 1 of 2.' : 'Word 2 — same root, NEW word!')
        : 'Tap tiles to place them on the anvil.';

      wrap.innerHTML = `
        <div class="mechhead">
          <div class="mechtitle">🔨 Word Forge</div>
          <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
        </div>
        <div class="wfgoal">Make a word that means:<b>${goal.target}</b></div>
        <div class="wfanvil">
          <div class="wfhammer">🔨</div>
          <div class="wfslots"></div>
          <div class="wfsparks"></div>
          <div class="wfbase"></div>
        </div>
        <div class="mechmsg wfmsg">${hello}</div>
        <div class="wflegend">
          <span class="wf-prefix">PREFIX</span><span class="wf-root">ROOT</span><span class="wf-suffix">SUFFIX</span>
        </div>
        <div class="wftray"></div>
        <div class="mechbtns"><button class="wfforge" disabled>🔨 FORGE</button></div>`;

      const slotBox = wrap.querySelector('.wfslots') as HTMLElement;
      const sparkBox = wrap.querySelector('.wfsparks') as HTMLElement;
      const anvil = wrap.querySelector('.wfanvil') as HTMLElement;
      const tray = wrap.querySelector('.wftray') as HTMLElement;
      const msg = wrap.querySelector('.wfmsg') as HTMLElement;
      const forgeBtn = wrap.querySelector('.wfforge') as HTMLButtonElement;

      const draw = () => {
        slotBox.innerHTML = '';
        slots.forEach((part, idx) => {
          const d = document.createElement('button');
          d.className = 'wfslot' + (part ? ' filled' : '');
          d.textContent = part ? label(part) : '·';
          d.addEventListener('click', () => {
            if (locked || !part) return;
            slots[idx] = null;   // tap a placed tile → back to the tray
            sfx.blip();
            draw();
          });
          slotBox.appendChild(d);
        });
        tray.innerHTML = '';
        for (const key of r.tray) {
          const used = slots.includes(key);
          const t = document.createElement('button');
          t.className = `wftile wf-${KIND[key]}` + (used ? ' used' : '');
          t.textContent = label(key);
          t.disabled = used;
          t.addEventListener('click', () => {
            if (locked || used) return;
            const empty = slots.indexOf(null);
            if (empty === -1) return;
            slots[empty] = key;  // snap onto the next open anvil slot
            sfx.blip();
            draw();
          });
          tray.appendChild(t);
        }
        forgeBtn.disabled = slots.includes(null);
      };
      draw();

      forgeBtn.onclick = () => {
        if (locked || slots.includes(null)) return;
        locked = true;
        forgeBtn.disabled = true;
        sfx.blip();
        anvil.classList.add('hammering');
        setTimeout(() => {
          anvil.classList.remove('hammering');
          const built = slots.map(s => s as string);
          const word = built.join('');
          if (word === goal.answer.join('')) {
            // fuse the tiles into one glowing word + sparks fly
            slotBox.innerHTML = `<div class="wfword">${word.toUpperCase()}</div>`;
            for (let s = 0; s < 8; s++) {
              const sp = document.createElement('span');
              sp.className = `wfspark wfspark${s}`;
              sparkBox.appendChild(sp);
            }
            msg.textContent = '⭐ ' + goal.teach;
            if (g === r.goals.length - 1) {
              sfx.win();
              recordAttempt(ctx.save, {
                id: `mech.wordforge.r${i}.${word}`, skill: 'ela.wordparts', tier: r.tier,
                q: 'forge', options: ['', '', '', ''], why: goal.teach
              }, mistakes === 0, Date.now());
              ctx.persist();
              if (mistakes === 0) flawless++;
              i++;
              setTimeout(next, 2100);
            } else {
              sfx.chirp();
              g++;
              setTimeout(startGoal, 2100);
            }
          } else {
            // gentle crumble — the word falls apart, the parts explain why
            mistakes++;
            sfx.buzz();
            slotBox.classList.add('wfcrumble');
            msg.textContent = explainWrong(built, goal, r.wrongLines);
            setTimeout(() => {
              slotBox.classList.remove('wfcrumble');
              for (let s = 0; s < slots.length; s++) slots[s] = null;
              locked = false;
              draw();
            }, 900);
          }
        }, 450);
      };
    };

    startGoal();
  };

  next();
}
