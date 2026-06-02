/* world.js — the neon wireframe Realm that starts dark and lights up as the
   player acts. The visible payoff of "I gave an order and the world woke up." */
window.PR = window.PR || {};

PR.world = (function () {
  const SCENE =
    '<div class="scene" id="scene">' +
      '<div class="horizon"></div>' +
      '<div class="tree t1"><div class="leaf"></div><div class="trunk"></div></div>' +
      '<div class="tree t2"><div class="leaf"></div><div class="trunk"></div></div>' +
      '<div class="tree t3"><div class="leaf"></div><div class="trunk"></div></div>' +
      '<div class="nstruct hut"><div class="roof"></div><div class="door"></div></div>' +
    '</div>';

  function el() { return document.getElementById('world'); }
  function scene() { return document.getElementById('scene'); }

  return {
    build() { el().innerHTML = SCENE; },
    show()  { const s = scene(); if (s) s.classList.add('show'); },
    lit()   { const s = scene(); if (s) s.classList.add('lit'); },
    clear() { el().innerHTML = ''; },

    // Light just one side first — used by a choose-your-own-adventure choice so
    // her pick visibly lights part of the world before the rest.
    sparkSide(side) {
      const s = scene(); if (!s) return;
      const left  = s.querySelectorAll('.t1, .t3');
      const right = s.querySelectorAll('.t2, .hut');
      (side === 'west' ? left : right).forEach(n => {
        n.style.transition = '.6s';
        n.classList.add('side-lit');
        n.querySelectorAll('*').forEach(c => { c.style.borderColor = 'var(--glow)'; c.style.boxShadow = '0 0 12px var(--glow)'; });
      });
    },

    // Expanding neon ring from the device centre.
    ring(device) {
      const r = document.createElement('div');
      r.className = 'ring';
      r.style.left = '50%'; r.style.top = '50%'; r.style.transform = 'translate(-50%,-50%)';
      device.appendChild(r);
      setTimeout(() => r.remove(), 1100);
    }
  };
})();
