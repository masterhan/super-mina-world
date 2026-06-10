// The shared question card — ONE renderer used by quiz stations AND battles
// (ported from v1 quiz.js, the pattern proven with the actual kid).
//   mode 'teach'   — stations: a wrong tap teaches + the right answer glows;
//                    she keeps going until she taps it. Kind, no losing.
//   mode 'oneshot' — battles: the FIRST tap decides (hit or miss), then the
//                    teaching line shows either way and the card resolves.
// Wrong answers always show a fact about the thing she tapped, not just "no".

import { Question } from '../core/types';
import { sfx } from '../core/sfx';
import { ATLAS_PIX } from '../data/banks/atlas-classic';

export interface AskOpts {
  mode: 'teach' | 'oneshot';
  // resolved when the card is done: teach mode always ends correct=true on the
  // final tap; oneshot reports the first tap. wrongTaps counts misses either way.
  onDone: (result: { correct: boolean; wrongTaps: number }) => void;
  holdMs?: number; // how long the teaching line stays before resolving (default 1300)
}

function shuffle<T>(a: T[]): T[] {
  for (let i = a.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function drawPixGrid(grid: string[], glow: string, cell = 9): HTMLCanvasElement {
  const cols = grid[0].length, rows = grid.length;
  const cv = document.createElement('canvas');
  cv.width = cols * cell; cv.height = rows * cell;
  cv.className = 'qart';
  const ctx = cv.getContext('2d')!;
  ctx.fillStyle = glow;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    if (grid[r][c] === '#') ctx.fillRect(c * cell + 1, r * cell + 1, cell - 1, cell - 1);
  }
  return cv;
}

export function askQuestion(host: HTMLElement, item: Question, opts: AskOpts): void {
  const hold = opts.holdMs ?? 1300;
  (document.activeElement as HTMLElement | null)?.blur?.(); // no leftover highlight

  const card = document.createElement('div');
  card.className = 'qcard';

  const qel = document.createElement('div');
  qel.className = 'qtitle';
  qel.textContent = item.q;
  card.appendChild(qel);

  if (item.art && ATLAS_PIX[item.art]) {
    const glow = getComputedStyle(document.documentElement).getPropertyValue('--glow').trim() || '#3df2ff';
    card.appendChild(drawPixGrid(ATLAS_PIX[item.art], glow));
  }
  if (item.flag) {
    const f = document.createElement('div');
    f.className = 'qflag';
    f.textContent = item.flag;
    card.appendChild(f);
  }

  const list = document.createElement('div');
  list.className = 'qopts';
  const msg = document.createElement('div');
  msg.className = 'qmsg';

  const correctText = item.options[0];
  const entries = shuffle(item.options.map((t, i) => ({ t, correct: i === 0 })));
  let resolved = false;
  let wrongTaps = 0;
  let correctBtn: HTMLButtonElement | null = null;

  const factFor = (text: string) => item.facts?.[text];

  for (const op of entries) {
    const b = document.createElement('button');
    b.className = 'qopt';
    b.textContent = op.t;
    if (op.correct) correctBtn = b;
    b.onclick = () => {
      if (resolved) return;
      if (op.correct) {
        resolved = true;
        b.classList.add('right');
        msg.textContent = 'Yes! ' + (item.why || factFor(correctText) || 'That’s right!');
        sfx.win();
        window.setTimeout(() => { card.remove(); opts.onDone({ correct: wrongTaps === 0 || opts.mode === 'teach', wrongTaps }); }, hold);
      } else {
        wrongTaps++;
        sfx.buzz();
        b.disabled = true;
        b.classList.add('dim');
        if (opts.mode === 'teach') {
          correctBtn?.classList.add('hint');
          msg.textContent = 'Not quite! ' + (factFor(op.t) || item.why || 'That’s not the one — tap the glowing answer.');
        } else {
          // battle: first tap decides — teach, reveal, resolve as a miss
          resolved = true;
          correctBtn?.classList.add('hint');
          msg.textContent = (factFor(op.t) ? 'Not quite! ' + factFor(op.t) + ' ' : 'Not quite! ') + item.why;
          window.setTimeout(() => { card.remove(); opts.onDone({ correct: false, wrongTaps }); }, hold + 500);
        }
      }
    };
    list.appendChild(b);
  }

  card.appendChild(list);
  card.appendChild(msg);
  host.appendChild(card);
}
