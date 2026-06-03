/* badges.js — the 8-slot badge case. Each chapter ends with a badge: a concrete
   "I made this happen" trophy. Fanfare + sparkle + the case visibly filling. */
window.PR = window.PR || {};

PR.badge = {
  // opts = { index:1..8, name:'SPARK', icon:'✦', total:8 }
  award(opts, api, onDone) {
    const total = opts.total || 7;
    if (!PR.state.badges.includes(opts.index)) PR.state.badges.push(opts.index);
    if (api && api.save) api.save();

    PR.audio.fanfare();
    if (api && api.device) PR.creature.sparkleBurst(api.device, 18);

    const slots = Array.from({ length: total }, (_, i) =>
      '<div class="slot ' + (PR.state.badges.includes(i + 1) ? 'on' : '') + '"></div>'
    ).join('');

    const bp = document.createElement('div');
    bp.className = 'badge-pop';
    bp.innerHTML =
      '<div class="badge">' + (opts.icon || '✦') + '</div>' +
      '<h2>You earned the<br>' + opts.name + ' BADGE!</h2>' +
      '<div class="sub">Badge ' + opts.index + ' of ' + total + '</div>' +
      '<div class="case">' + slots + '</div>' +
      '<div class="press" style="margin-top:8px;font-size:9px;color:var(--glow);animation:blink 1.1s steps(1) infinite">▼ TAP</div>';
    (api && api.layer ? api.layer : document.getElementById('layer')).appendChild(bp);

    bp.onclick = function () {
      PR.audio.tone(659);
      bp.remove();
      if (onDone) onDone();
    };
  }
};
