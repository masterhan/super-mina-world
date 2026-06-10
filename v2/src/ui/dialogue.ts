// Pokémon-style dialogue box — ported from v1 dialogue.js, same class names
// (.dbox/.speaker/.line/.arrow/.choices) so v1's CSS carries over.
// Typewriter text + blip, tap-to-complete, ▼ to advance, branching choices
// whose effect() can change the world live.

import { sfx } from '../core/sfx';

export interface Choice {
  label: string;
  effect?: () => void;
  lines?: string[];
}

export interface DialogueOpts {
  layer: HTMLElement;
  speaker?: string;
  lines: string[];
  choices?: Choice[];
  avatar?: HTMLElement; // optional pre-built character element
  onDone?: (chosen: Choice | null) => void;
}

export function dialogue(opts: DialogueOpts) {
  const layer = opts.layer;
  const onDone = opts.onDone || (() => {});
  if (opts.avatar) layer.appendChild(opts.avatar);

  const box = document.createElement('div');
  box.className = 'dbox';
  box.innerHTML =
    '<div class="speaker">' + (opts.speaker || '') + '</div>' +
    '<div class="line"></div>' +
    '<div class="arrow" style="display:none">▼</div>';
  layer.appendChild(box);

  const ln = box.querySelector('.line') as HTMLElement;
  const ar = box.querySelector('.arrow') as HTMLElement;
  let typing = false;
  let full = '';
  let timer: ReturnType<typeof setInterval> | null = null;

  function finish(chosen: Choice | null) {
    box.remove();
    opts.avatar?.remove();
    onDone(chosen);
  }

  function play(lines: string[], after: () => void) {
    let i = 0;
    function type() {
      typing = true; ar.style.display = 'none';
      full = lines[i]; let c = 0; ln.textContent = '';
      timer = setInterval(() => {
        ln.textContent = full.slice(0, c);
        if (c % 2 === 0) sfx.blip();
        c++;
        if (c > full.length) { if (timer) clearInterval(timer); typing = false; ar.style.display = 'block'; }
      }, 32);
    }
    box.onclick = () => {
      if (typing) { if (timer) clearInterval(timer); ln.textContent = full; typing = false; ar.style.display = 'block'; return; }
      i++;
      if (i < lines.length) type();
      else after();
    };
    type();
  }

  function renderChoices() {
    ar.style.display = 'none';
    box.onclick = null;
    const wrap = document.createElement('div');
    wrap.className = 'choices';
    for (const ch of opts.choices!) {
      const b = document.createElement('button');
      b.textContent = ch.label;
      b.onclick = () => {
        sfx.tone(880, 0.06);
        wrap.remove();
        ch.effect?.();
        if (ch.lines?.length) {
          box.onclick = null;
          play(ch.lines, () => finish(ch));
        } else {
          finish(ch);
        }
      };
      wrap.appendChild(b);
    }
    box.appendChild(wrap);
  }

  play(opts.lines.length ? opts.lines : [''], () => {
    if (opts.choices?.length) renderChoices();
    else finish(null);
  });
}
