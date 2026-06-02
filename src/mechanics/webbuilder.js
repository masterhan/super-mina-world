/* webbuilder.js — Ch3 "Webville" mechanic. She assembles a real webpage from blocks
   (title, picture, button + what it does, background). A live preview updates as she
   chooses (choose-your-own-adventure, literally). BUILD IT renders HER page full-screen
   with a working button — and downloads it as a real .html file she can keep / a grown-up
   can put online. Lesson: a website is just blocks I chose, and it WORKS. */
window.PR = window.PR || {};
PR.mechanics = PR.mechanics || {};

PR.mechanics.webbuilder = (function () {
  const PICS = ['🚀', '🐱', '🌟', '🦖', '🌈', '🍩'];
  const ACTIONS = [
    { k: 'confetti', t: '🎉 confetti' },
    { k: 'color',    t: '🎨 new color' },
    { k: 'grow',     t: '🔍 grow it' }
  ];
  const BGS = ['#1a1140', '#06223a', '#3a0a2a', '#0a2a1a', '#2a1a06', '#10131f'];

  function glowHex() {
    return getComputedStyle(document.documentElement).getPropertyValue('--glow').trim() || '#3df2ff';
  }

  function run(api, config, done) {
    const layer = api.layer;
    layer.innerHTML = '';
    const page = { title: (api.state.player.name + '’S PAGE'), pic: '🚀', label: 'Tap me!', action: 'confetti', bg: BGS[0], glow: glowHex() };

    // ---- preview (top) ----
    const stage = document.createElement('div'); stage.className = 'stage'; stage.style.bottom = '224px';
    stage.innerHTML = '<div class="stage-title">Your page — building live</div>';
    const prev = document.createElement('div'); prev.className = 'webprev';
    prev.innerHTML = '<div class="bar"><i></i><i></i><i></i></div><div class="body"></div>';
    stage.appendChild(prev);
    layer.appendChild(stage);

    function draw() {
      const body = prev.querySelector('.body');
      body.style.background = page.bg;
      body.innerHTML =
        '<div class="wt">' + esc(page.title) + '</div>' +
        '<div class="wpic">' + page.pic + '</div>' +
        '<button class="wbtn" style="background:' + page.glow + '">' + esc(page.label) + '</button>';
    }
    draw();

    // ---- controls (bottom, scrollable) ----
    const p = document.createElement('div'); p.className = 'panel';
    p.style.cssText = 'max-height:200px;overflow:auto';
    p.innerHTML =
      '<div class="q">TITLE:</div><input id="wt" maxlength="14" value="' + esc(page.title) + '">' +
      '<div class="q" style="margin-top:7px">PICTURE:</div><div class="opts" id="wp"></div>' +
      '<div class="q" style="margin-top:7px">BUTTON SAYS:</div><input id="wl" maxlength="12" value="' + esc(page.label) + '">' +
      '<div class="q" style="margin-top:7px">BUTTON DOES:</div><div class="opts" id="wa"></div>' +
      '<div class="q" style="margin-top:7px">BACKGROUND:</div><div class="opts" id="wb"></div>' +
      '<button class="summon" id="build">⚡ BUILD IT ⚡</button>';
    layer.appendChild(p);

    p.querySelector('#wt').addEventListener('input', e => { page.title = e.target.value || 'MY PAGE'; draw(); });
    p.querySelector('#wl').addEventListener('input', e => { page.label = e.target.value || 'TAP ME'; draw(); });

    const wp = p.querySelector('#wp');
    PICS.forEach(em => {
      const b = document.createElement('button'); b.textContent = em; b.style.fontSize = '22px';
      if (em === page.pic) b.classList.add('sel');
      b.onclick = () => { page.pic = em; PR.audio.tone(880, 0.05); sel(wp, b); draw(); };
      wp.appendChild(b);
    });
    const wa = p.querySelector('#wa');
    ACTIONS.forEach(a => {
      const b = document.createElement('button'); b.textContent = a.t;
      if (a.k === page.action) b.classList.add('sel');
      b.onclick = () => { page.action = a.k; PR.audio.tone(820, 0.05); sel(wa, b); };
      wa.appendChild(b);
    });
    const wb = p.querySelector('#wb');
    BGS.forEach(bg => {
      const b = document.createElement('button'); b.className = 'swatch'; b.style.background = bg;
      if (bg === page.bg) b.classList.add('sel');
      b.onclick = () => { page.bg = bg; PR.audio.tone(700, 0.06); sel(wb, b); draw(); };
      wb.appendChild(b);
    });

    p.querySelector('#build').onclick = () => { PR.audio.fanfare(); api.flashGo(); stage.remove(); p.remove(); buildReal(); };

    // ---- the real, working page, full-screen ----
    function buildReal() {
      let grown = 1, bgIdx = BGS.indexOf(page.bg);
      const rp = document.createElement('div'); rp.className = 'realpage'; rp.style.background = page.bg;
      rp.innerHTML =
        '<h1>' + esc(page.title) + '</h1>' +
        '<div class="big" id="rpic">' + page.pic + '</div>' +
        '<button class="pbtn" id="rbtn" style="background:' + page.glow + '">' + esc(page.label) + '</button>' +
        '<div style="display:flex;gap:10px">' +
          '<button id="rsave">⬇ SAVE MY PAGE</button>' +
          '<button id="rdone">✓ I MADE THIS!</button>' +
        '</div>' +
        '<div class="by">a real page, built by ' + esc(api.state.player.name) + '</div>';
      api.layer.appendChild(rp);
      PR.creature.sparkleBurst(api.device, 18);

      const pic = rp.querySelector('#rpic');
      rp.querySelector('#rbtn').onclick = () => {
        PR.audio.chirp();
        if (page.action === 'confetti') confetti(api.device);
        else if (page.action === 'color') { bgIdx = (bgIdx + 1) % BGS.length; rp.style.background = BGS[bgIdx]; }
        else if (page.action === 'grow') { grown = grown >= 2.2 ? 1 : grown + 0.4; pic.style.transform = 'scale(' + grown + ')'; pic.style.transition = '.25s'; }
      };
      rp.querySelector('#rsave').onclick = () => { download(page, api.state.player.name); PR.audio.tone(880, 0.1); };
      rp.querySelector('#rdone').onclick = () => { PR.audio.tone(659); rp.remove(); done(page.title); };
    }

    function sel(row, btn) { row.querySelectorAll('button').forEach(x => x.classList.remove('sel')); btn.classList.add('sel'); }
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function confetti(device) {
    const ems = ['🎉', '✦', '🌟', '💜', '⚡'];
    for (let i = 0; i < 16; i++) {
      const s = document.createElement('div'); s.className = 'sp'; s.style.fontSize = '20px';
      s.textContent = ems[(Math.random() * ems.length) | 0];
      s.style.left = (20 + Math.random() * 60) + '%'; s.style.top = (30 + Math.random() * 30) + '%';
      s.style.animationDelay = (Math.random() * 0.4) + 's';
      device.appendChild(s); setTimeout(() => s.remove(), 1000);
    }
  }

  // Build a real, standalone, openable .html file of her page and download it.
  function download(page, who) {
    const actScript = {
      confetti: "for(let i=0;i<24;i++){const s=document.createElement('div');s.textContent=['🎉','✦','🌟','⚡'][i%4];s.style.cssText='position:fixed;font-size:24px;left:'+(Math.random()*100)+'%;top:'+(Math.random()*60)+'%;transition:1s;pointer-events:none';document.body.appendChild(s);requestAnimationFrame(()=>{s.style.top='110%';s.style.opacity='0';});setTimeout(()=>s.remove(),1100);}",
      color: "var b=['#1a1140','#06223a','#3a0a2a','#0a2a1a','#2a1a06','#10131f'];if(window._i===undefined)window._i=b.indexOf('" + page.bg + "');window._i=(window._i+1)%b.length;document.body.style.background=b[window._i];",
      grow: "var p=document.getElementById('pic');window._g=(window._g||1);window._g=window._g>=2.2?1:window._g+0.4;p.style.transform='scale('+window._g+')';"
    }[page.action];

    const html =
'<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
'<title>' + esc(page.title) + '</title>' +
'<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">' +
'<style>html,body{height:100%;margin:0}body{background:' + page.bg + ';color:#fff;font-family:VT323,monospace;' +
'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:24px;text-align:center;transition:.4s}' +
'h1{font-family:"Press Start 2P",monospace;font-size:22px;line-height:1.6}#pic{font-size:96px;transition:.25s}' +
'button{font-family:VT323,monospace;font-size:28px;padding:14px 30px;border:none;border-radius:12px;cursor:pointer;' +
'background:' + page.glow + ';color:#06080f;box-shadow:0 6px 0 #0005}.by{font-size:18px;opacity:.7}</style></head>' +
'<body><h1>' + esc(page.title) + '</h1><div id="pic">' + page.pic + '</div>' +
'<button onclick="' + esc(actScript) + '">' + esc(page.label) + '</button>' +
'<div class="by">a real page, built by ' + esc(who) + '</div></body></html>';

    const blob = new Blob([html], { type: 'text/html' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (who || 'my') .toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-webville.html';
    document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  return { run };
})();
