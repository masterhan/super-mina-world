/* dialogue.js — Pokémon-style dialogue box: typewriter text + blip, ▼ to advance,
   tap-to-complete, an optional character avatar, and BRANCHING CHOICES.

   Choices are the heart of the choose-your-own-adventure: each choice can run an
   `effect(api)` that changes the world LIVE (recolor, light a side, make BYTE leap),
   then optionally play its own follow-up lines. The learning outcome is the same
   across branches — only the experience differs. */
window.PR = window.PR || {};

PR.dialogue = function (opts) {
  const layer   = opts.layer  || document.getElementById('layer');
  const api     = opts.api    || {};
  const onDone  = opts.onDone || function () {};
  const npc     = opts.character ? PR.npc.show(opts.character, layer) : null;

  const box = document.createElement('div');
  box.className = 'dbox';
  box.innerHTML =
    '<div class="speaker">' + (opts.speaker || '') + '</div>' +
    '<div class="line" id="ln"></div>' +
    '<div class="arrow" id="ar" style="display:none">▼</div>';
  layer.appendChild(box);

  const ln = box.querySelector('#ln');
  const ar = box.querySelector('#ar');
  let typing = false, full = '', timer = null;

  function finish(chosen) {
    box.remove();
    if (npc) npc.remove();
    onDone(chosen);
  }

  // Play a list of lines, then call `after`.
  function play(lines, after) {
    let i = 0;
    function type() {
      typing = true; ar.style.display = 'none';
      full = lines[i]; let c = 0; ln.textContent = '';
      timer = setInterval(() => {
        ln.textContent = full.slice(0, c);
        if (c % 2 === 0) PR.audio.blip();
        c++;
        if (c > full.length) { clearInterval(timer); typing = false; ar.style.display = 'block'; }
      }, 32);
    }
    box.onclick = function () {
      if (typing) { clearInterval(timer); ln.textContent = full; typing = false; ar.style.display = 'block'; return; }
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
    opts.choices.forEach((ch) => {
      const b = document.createElement('button');
      b.textContent = ch.label;
      b.onclick = function () {
        PR.audio.tone(880, 0.06);
        wrap.remove();
        if (typeof ch.effect === 'function') ch.effect(api);
        if (ch.lines && ch.lines.length) {
          box.onclick = null;
          play(ch.lines, () => finish(ch));
        } else {
          finish(ch);
        }
      };
      wrap.appendChild(b);
    });
    box.appendChild(wrap);
  }

  // Main: play the base lines, then branch into choices (if any) or end.
  play(opts.lines || [''], () => {
    if (opts.choices && opts.choices.length) renderChoices();
    else finish(null);
  });
};
