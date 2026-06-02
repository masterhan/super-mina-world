/* creatures.js — BYTE: the player's cute glowing companion (a TOOL, never a robot,
   never speaks). This renders the creature from the player's config and owns the
   one neon color that relights the whole world. */
window.PR = window.PR || {};

PR.creature = (function () {
  // The four player-choosable lights. [glow, glow-soft]
  const COLORS = {
    cyan:    ['#3df2ff', '#aef6ff'],
    violet:  ['#b06bff', '#e3ccff'],
    magenta: ['#ff5db8', '#ffc2e4'],
    gold:    ['#ffce3d', '#ffe9a3']
  };

  // Customizer option sets (expanded from the prototype's 3 forms / 4 eyes).
  const SETS = {
    form:  ['puff', 'bolt', 'fin', 'star', 'orb'],
    eyes:  ['sparkle', 'round', 'happy', 'sleepy'],
    marks: ['none', 'spots', 'stripes', 'glow']
  };

  function applyGlow(colorKey) {
    const c = COLORS[colorKey] || COLORS.cyan;
    document.documentElement.style.setProperty('--glow', c[0]);
    document.documentElement.style.setProperty('--glow-soft', c[1]);
  }

  function html(buddy, extra = '') {
    return (
      '<div class="creature float ' + extra + '" data-form="' + buddy.form +
        '" data-eyes="' + buddy.eyes + '" data-marks="' + (buddy.marks || 'none') + '">' +
        '<div class="shadow"></div>' +
        '<div class="crit">' +
          '<div class="earL"></div><div class="earR"></div>' +
          '<div class="crest"></div><div class="finTail"></div>' +
          '<div class="horns"></div><div class="ring2"></div>' +
          '<div class="blob">' +
            '<div class="marks"></div>' +
            '<div class="eyes"><div class="eye"></div><div class="eye"></div></div>' +
            '<div class="mouth"></div><div class="cheekL"></div><div class="cheekR"></div>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }

  // Build a fresh creature node from an HTML string.
  function node(buddy, extra = '') {
    const tmp = document.createElement('div');
    tmp.innerHTML = html(buddy, extra);
    return tmp.firstChild;
  }

  function sparkleBurst(device, n = 12) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'sp';
      s.textContent = '✦';
      s.style.left = (28 + Math.random() * 44) + '%';
      s.style.top = (30 + Math.random() * 32) + '%';
      s.style.animationDelay = (Math.random() * 0.4) + 's';
      device.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  return { COLORS, SETS, applyGlow, html, node, sparkleBurst };
})();
