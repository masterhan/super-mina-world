// Webwright Workshop — Mina BUILDS a real webpage by choosing its
// instructions: title, picture, button label, what the button DOES, and
// background. A live preview obeys every choice, then BUILD IT renders her
// page full-screen with a WORKING button she can tap and tap. The
// interaction IS the lesson: a webpage is just instructions somebody chose —
// change the instructions, change the page. That is what coding is.

import '../styles/webbuilder.css';
import { webpageStyle } from '../styles/webpage-template';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

const PICS = ['🚀', '🐱', '🌟', '🦖', '🌈', '🍩'];
const ACTIONS = [
  { k: 'confetti', t: '🎉 confetti' },
  { k: 'color', t: '🎨 new color' },
  { k: 'grow', t: '🔍 grow it' }
] as const;
type ActionKey = (typeof ACTIONS)[number]['k'];
const BG_COUNT = 6; // .webbg0 … .webbg5 classes in webbuilder.css

const ACTION_TEACH: Record<ActionKey, string> = {
  confetti: '🎉 confetti: now a tap throws a party. You wrote that rule — it is the button’s INSTRUCTION!',
  color: '🎨 new color: now a tap changes the background. Your instruction, the button’s job!',
  grow: '🔍 grow it: now a tap makes the picture bigger. The button does what YOU told it!'
};

interface Round {
  goal: string;
  need?: ActionKey;       // challenge round: the button MUST do this
  startAction: ActionKey; // preselected action (challenge starts on a different one)
}

function makeRounds(n: number): Round[] {
  const base: Round[] = [
    { goal: 'Build YOUR page! Every pick below is an INSTRUCTION — the preview obeys.', startAction: 'confetti' },
    { goal: 'CHALLENGE: build a page with a button that makes 🎉 CONFETTI!', need: 'confetti', startAction: 'color' },
    { goal: 'CHALLENGE: build a page with a button that paints a 🎨 NEW COLOR!', need: 'color', startAction: 'grow' },
    { goal: 'CHALLENGE: build a page with a button that makes the picture 🔍 GROW!', need: 'grow', startAction: 'confetti' }
  ];
  return base.slice(0, Math.max(1, Math.min(n, base.length)));
}

function confettiBurst(host: HTMLElement) {
  const ems = ['🎉', '✦', '🌟', '💜', '⚡'];
  for (let n = 0; n < 14; n++) {
    const s = document.createElement('div');
    s.className = 'webconfet';
    s.textContent = ems[n % ems.length];
    s.style.left = `${8 + Math.random() * 84}%`;
    s.style.top = `${10 + Math.random() * 40}%`;
    s.style.animationDelay = `${Math.random() * 0.3}s`;
    host.appendChild(s);
    setTimeout(() => s.remove(), 1400);
  }
}

// hex values behind the .webbg0…webbg5 classes — keep in sync with webbuilder.css
const BG_HEX = ['#1a1140', '#06223a', '#3a0a2a', '#0a2a1a', '#2a1a06', '#10131f'];

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function glowHex(): string {
  return getComputedStyle(document.documentElement).getPropertyValue('--glow').trim() || '#3df2ff';
}

// Build a real, standalone, openable .html file of her page and download it.
// Ported from v1 webbuilder.js download() — the keep-it half of the lesson:
// a real file she can keep / a grown-up can put online.
function download(page: { title: string; pic: string; label: string; action: ActionKey; bg: number }, who: string) {
  const actScript: Record<ActionKey, string> = {
    confetti: "for(let i=0;i<24;i++){const s=document.createElement('div');s.textContent=['🎉','✦','🌟','⚡'][i%4];s.style.cssText='position:fixed;font-size:24px;left:'+(Math.random()*100)+'%;top:'+(Math.random()*60)+'%;transition:1s;pointer-events:none';document.body.appendChild(s);requestAnimationFrame(()=>{s.style.top='110%';s.style.opacity='0';});setTimeout(()=>s.remove(),1100);}",
    color: "var b=['#1a1140','#06223a','#3a0a2a','#0a2a1a','#2a1a06','#10131f'];if(window._i===undefined)window._i=" + page.bg + ";window._i=(window._i+1)%b.length;document.body.style.background=b[window._i];",
    grow: "var p=document.getElementById('pic');window._g=(window._g||1);window._g=window._g>=2.2?1:window._g+0.4;p.style.transform='scale('+window._g+')';"
  };

  const html =
    '<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<title>' + esc(page.title || 'MY PAGE') + '</title>' +
    '<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap" rel="stylesheet">' +
    '<style>' + webpageStyle(BG_HEX[page.bg % BG_HEX.length], glowHex()) + '</style></head>' +
    '<body><h1>' + esc(page.title || 'MY PAGE') + '</h1><div id="pic">' + page.pic + '</div>' +
    '<button onclick="' + esc(actScript[page.action]) + '">' + esc(page.label || 'TAP ME') + '</button>' +
    '<div class="by">a real page, built by ' + esc(who) + '</div></body></html>';

  const blob = new Blob([html], { type: 'text/html' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = (who || 'my').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-webville.html';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export function runWebbuilder(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech webmech';
  ctx.host.appendChild(wrap);

  const q = <T extends Element>(sel: string): T => {
    const el = wrap.querySelector(sel);
    if (!el) throw new Error('webbuilder: missing ' + sel);
    return el as T;
  };

  const finish = () => {
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const next = () => {
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    let mistakes = 0;
    const kid = ctx.save.player.name || 'MINA';
    const needLabel = r.need ? ACTIONS.find(a => a.k === r.need)!.t : '';
    const page: { title: string; pic: string; label: string; action: ActionKey; bg: number } = {
      title: (kid + '’S PAGE').toUpperCase().slice(0, 14),
      pic: PICS[0],
      label: 'TAP ME!',
      action: r.startAction,
      bg: i % BG_COUNT
    };

    wrap.innerHTML = `
      <div class="mechhead">
        <div class="mechtitle">🛠️ Webwright Workshop</div>
        <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
      </div>
      <div class="webgoal"></div>
      <div class="webprev">
        <div class="webbar"><i></i><i></i><i></i></div>
        <div class="webbody">
          <div class="webprevtitle"></div>
          <div class="webprevpic"></div>
          <button class="webprevbtn" type="button"></button>
        </div>
      </div>
      <div class="mechmsg webmsg"></div>
      <div class="webctrls">
        <div class="weblabel">TITLE:</div>
        <input class="webinput webtitlein" maxlength="14">
        <div class="weblabel">PICTURE:</div>
        <div class="webrow webpics"></div>
        <div class="weblabel">BUTTON SAYS:</div>
        <input class="webinput weblabelin" maxlength="12">
        <div class="weblabel">BUTTON DOES:</div>
        <div class="webrow webacts"></div>
        <div class="weblabel">BACKGROUND:</div>
        <div class="webrow webbgs"></div>
        <button class="webbuild" type="button">⚡ BUILD IT ⚡</button>
      </div>`;

    const msg = q<HTMLElement>('.webmsg');
    const body = q<HTMLElement>('.webbody');
    const prevTitle = q<HTMLElement>('.webprevtitle');
    const prevPic = q<HTMLElement>('.webprevpic');
    const prevBtn = q<HTMLButtonElement>('.webprevbtn');

    q<HTMLElement>('.webgoal').textContent = r.goal;
    msg.textContent = r.need
      ? 'Set the right BUTTON DOES instruction, then ⚡ BUILD IT!'
      : 'Type a title, pick a picture — make it YOURS. Then ⚡ BUILD IT!';

    const draw = () => {
      body.className = 'webbody webbg' + page.bg;
      prevTitle.textContent = page.title || 'MY PAGE';
      prevPic.textContent = page.pic;
      prevBtn.textContent = page.label || 'TAP ME';
    };
    draw();

    prevBtn.onclick = () => {
      sfx.blip();
      msg.textContent = 'The button wakes up for REAL after ⚡ BUILD IT!';
    };

    const select = (row: HTMLElement, btn: HTMLElement) => {
      row.querySelectorAll('button').forEach(b => b.classList.remove('websel'));
      btn.classList.add('websel');
    };

    const titleIn = q<HTMLInputElement>('.webtitlein');
    titleIn.value = page.title;
    titleIn.addEventListener('input', () => {
      page.title = titleIn.value;
      draw();
      msg.textContent = 'You changed the TITLE instruction — the page followed it!';
    });

    const labelIn = q<HTMLInputElement>('.weblabelin');
    labelIn.value = page.label;
    labelIn.addEventListener('input', () => {
      page.label = labelIn.value;
      draw();
      msg.textContent = 'New BUTTON SAYS instruction — the button shows YOUR words.';
    });

    const picsRow = q<HTMLElement>('.webpics');
    PICS.forEach(em => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'webpick' + (em === page.pic ? ' websel' : '');
      b.textContent = em;
      b.onclick = () => {
        page.pic = em;
        sfx.blip();
        select(picsRow, b);
        draw();
        msg.textContent = `PICTURE instruction set to ${em} — the page obeys!`;
      };
      picsRow.appendChild(b);
    });

    const actsRow = q<HTMLElement>('.webacts');
    ACTIONS.forEach(a => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'webact' + (a.k === page.action ? ' websel' : '');
      b.textContent = a.t;
      b.onclick = () => {
        page.action = a.k;
        sfx.blip();
        select(actsRow, b);
        actsRow.classList.remove('webwrong');
        msg.textContent = ACTION_TEACH[a.k];
      };
      actsRow.appendChild(b);
    });

    const bgsRow = q<HTMLElement>('.webbgs');
    for (let bIdx = 0; bIdx < BG_COUNT; bIdx++) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `webswatch webbg${bIdx}` + (bIdx === page.bg ? ' websel' : '');
      b.onclick = () => {
        page.bg = bIdx;
        sfx.blip();
        select(bgsRow, b);
        draw();
        msg.textContent = 'BACKGROUND instruction changed — same page, new look!';
      };
      bgsRow.appendChild(b);
    }

    // ---- her page, for real, full-screen in the overlay ----
    const buildReal = () => {
      const real = document.createElement('div');
      real.className = 'webreal webbg' + page.bg;
      let bgIdx = page.bg;
      let grown = 1;
      let taps = 0;

      const h = document.createElement('h1');
      h.className = 'webrealtitle';
      h.textContent = page.title || 'MY PAGE';
      const pic = document.createElement('div');
      pic.className = 'webrealpic';
      pic.textContent = page.pic;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'webrealbtn';
      btn.textContent = page.label || 'TAP ME';
      const hint = document.createElement('div');
      hint.className = 'webhint';
      hint.textContent = 'It WORKS — tap your button!';
      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.className = 'webdone';
      saveBtn.textContent = '⬇ SAVE MY PAGE';
      const doneBtn = document.createElement('button');
      doneBtn.type = 'button';
      doneBtn.className = 'webdone';
      doneBtn.textContent = '✓ I MADE THIS!';
      const btnRow = document.createElement('div');
      btnRow.className = 'webbtnrow webhidden';
      btnRow.append(saveBtn, doneBtn);
      const by = document.createElement('div');
      by.className = 'webby';
      by.textContent = 'a real page, built by ' + kid;

      btn.onclick = () => {
        taps++;
        sfx.blip();
        if (page.action === 'confetti') {
          confettiBurst(real);
        } else if (page.action === 'color') {
          bgIdx = (bgIdx + 1) % BG_COUNT;
          real.className = 'webreal webbg' + bgIdx;
        } else {
          grown = grown >= 2.2 ? 1 : grown + 0.4;
          pic.style.transform = `scale(${grown})`;
        }
        if (taps === 3) {
          sfx.chirp();
          hint.textContent = 'YOUR instruction runs on every tap. Keep going, or finish!';
          btnRow.classList.remove('webhidden');
        }
      };

      doneBtn.onclick = () => {
        const last = i === rounds.length - 1;
        const why = r.need
          ? `You picked the ${needLabel} instruction and the button obeyed — coders choose what buttons do!`
          : 'You changed the page by changing its INSTRUCTIONS — that is what coding is!';
        // Deliberate: the free-build round has no failable step, so it logs NO
        // attempt — an unfailable correct=true would pad the 90% mastery gate.
        // Only challenge rounds (r.need) feed code.sequences mastery.
        if (r.need) {
          recordAttempt(ctx.save, {
            id: `mech.webbuilder.r${i}.${page.action}`, skill: 'code.sequences', tier: 2,
            q: 'webpage', options: ['', '', '', ''], why
          }, mistakes === 0, Date.now());
          ctx.persist();
        }
        if (mistakes === 0) flawless++;
        if (last) sfx.fanfare(); else sfx.win();
        real.innerHTML = '';
        const star = document.createElement('div');
        star.className = 'webcelebrate';
        star.textContent = (last ? '🏆 ' : '⭐ ') + why;
        real.appendChild(star);
        i++;
        setTimeout(() => {
          real.remove();
          next();
        }, 2100);
      };

      saveBtn.onclick = () => {
        download(page, kid);
        sfx.chirp();
        hint.textContent = 'Saved! A real .html file you can keep — a grown-up can put it online.';
      };

      real.append(h, pic, btn, hint, btnRow, by);
      wrap.appendChild(real);
    };

    q<HTMLButtonElement>('.webbuild').onclick = () => {
      if (r.need && page.action !== r.need) {
        mistakes++;
        sfx.buzz();
        actsRow.classList.remove('webwrong');
        void actsRow.offsetWidth; // restart the wobble animation
        actsRow.classList.add('webwrong');
        const picked = ACTIONS.find(a => a.k === page.action);
        msg.textContent = `Almost! Your button’s instruction says ${picked ? picked.t : 'something else'} — the challenge needs ${needLabel}. Change BUTTON DOES and build again!`;
        return;
      }
      sfx.chirp();
      buildReal();
    };
  };

  next();
}
