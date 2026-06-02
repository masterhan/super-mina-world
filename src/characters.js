/* characters.js — the human/NPC cast (Cipher the mentor; Rex the rival; the Oracle).
   Unlike BYTE, these are CHARACTERS with personality — all dialogue lives with them.
   Each renders an on-screen pixel avatar at the top of the screen. */
window.PR = window.PR || {};

PR.npc = {
  // which: 'cipher' | 'rex' | 'oracle'  (class drives the look; cipher is the default)
  show(which, layer) {
    const n = document.createElement('div');
    n.className = 'npc ' + (which || 'cipher');
    n.innerHTML =
      '<div class="hood"></div>' +
      '<div class="visor"></div>' +
      '<div class="jacket"><span></span><span></span></div>';
    (layer || document.getElementById('layer')).appendChild(n);
    return n;
  }
};
