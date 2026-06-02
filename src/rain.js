/* rain.js — the signature full-screen Matrix code rain.
   Recolors to the player's chosen glow (reads the live --glow CSS variable)
   and SURGES on magic beats, then settles back to a calm ambient drizzle. */
window.PR = window.PR || {};

PR.rain = (function () {
  let cvs, ctx, device;
  let cols, drops;
  const fs = 14;
  let intensity = 1;
  const glyphs = '01ｱｶｻﾀﾅﾊﾏﾔﾗ0123456789<>/{}[]*+'.split('');

  function getGlow() {
    return getComputedStyle(document.documentElement).getPropertyValue('--glow').trim() || '#3df2ff';
  }

  function size() {
    const r = device.getBoundingClientRect();
    cvs.width = r.width;
    cvs.height = r.height;
    cols = Math.floor(cvs.width / fs);
    drops = Array(cols).fill(0).map(() => Math.random() * -40);
  }

  function draw() {
    ctx.fillStyle = 'rgba(6,8,15,' + (0.10 / intensity) + ')';
    ctx.fillRect(0, 0, cvs.width, cvs.height);
    ctx.font = fs + 'px monospace';
    const g = getGlow();
    for (let i = 0; i < cols; i++) {
      const ch = glyphs[(Math.random() * glyphs.length) | 0];
      const x = i * fs, y = drops[i] * fs;
      ctx.fillStyle = g;   ctx.globalAlpha = Math.min(1, 0.5 * intensity);  ctx.fillText(ch, x, y);
      ctx.fillStyle = '#fff'; ctx.globalAlpha = Math.min(1, 0.25 * intensity); ctx.fillText(ch, x, y); // bright head
      if (y > cvs.height && Math.random() > 0.975) drops[i] = Math.random() * -20;
      drops[i] += 0.55 * intensity;
    }
    ctx.globalAlpha = 1;
    intensity += (1 - intensity) * 0.03; // settle back to ambient
    requestAnimationFrame(draw);
  }

  return {
    init(canvasEl, deviceEl) {
      cvs = canvasEl; ctx = cvs.getContext('2d'); device = deviceEl;
      window.addEventListener('resize', size);
      size(); draw();
    },
    surge(n) { intensity = n; }
  };
})();
