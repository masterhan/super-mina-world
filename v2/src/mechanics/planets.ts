// Planet Parade — hands-on solar system. Mina BUILDS the sky: tap planet
// chips in order from the Sun and watch each one fly to its ring and start
// orbiting (closer = faster — real orbital mechanics!). Wrong taps wobble and
// teach that planet's place. Later rounds: Moon phases — name the phase you
// SEE, then place the Moon where it makes a FULL (or NEW) moon.

import '../styles/planets.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

interface PlanetDef { name: string; cls: string; size: number; fact: string; }

const PLANETS: PlanetDef[] = [
  { name: 'Mercury', cls: 'mercury', size: 8,  fact: 'the 1st planet — small, gray, and baked by the Sun' },
  { name: 'Venus',   cls: 'venus',   size: 12, fact: 'the 2nd planet — the HOTTEST one, wrapped in thick clouds' },
  { name: 'Earth',   cls: 'earth',   size: 13, fact: 'the 3rd planet — our blue home' },
  { name: 'Mars',    cls: 'mars',    size: 10, fact: 'the 4th planet — the red one, the last rocky one' },
  { name: 'Jupiter', cls: 'jupiter', size: 24, fact: 'the 5th planet — the BIGGEST of them all' },
  { name: 'Saturn',  cls: 'saturn',  size: 20, fact: 'the 6th planet — famous for its rings' },
  { name: 'Uranus',  cls: 'uranus',  size: 15, fact: 'the 7th planet — it spins lying on its side' },
  { name: 'Neptune', cls: 'neptune', size: 15, fact: 'the 8th planet — the farthest, a windy blue giant' }
];

const ORDS = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];

type PhaseKey = 'crescent' | 'half' | 'gibbous' | 'full' | 'new';

const PHASES: Record<PhaseKey, { label: string; look: string }> = {
  crescent: { label: 'Crescent', look: 'just a thin sliver of light glows' },
  half:     { label: 'Half',     look: 'exactly half the face glows' },
  gibbous:  { label: 'Gibbous',  look: 'MORE than half glows — almost full' },
  full:     { label: 'Full',     look: 'the whole face glows' },
  new:      { label: 'New',      look: 'all dark — no glow at all' }
};

interface OrderRound { kind: 'order'; start: number; count: number; tier: 1 | 2 | 3; intro: string; mnemo: string; }
interface MoonRound { kind: 'moon'; phase: PhaseKey; stones: PhaseKey[]; target: 'full' | 'new'; tier: 1 | 2 | 3; }
type Round = OrderRound | MoonRound;

const ALL_ROUNDS: Round[] = [
  { kind: 'order', start: 0, count: 4, tier: 1,
    intro: 'Build the inner solar system! Tap the planet CLOSEST to the Sun first.',
    mnemo: '<b>M</b>y <b>V</b>ery <b>E</b>xcellent <b>M</b>other — Mercury, Venus, Earth, Mars!' },
  { kind: 'order', start: 4, count: 4, tier: 2,
    intro: 'Now the giants! Which planet comes right after Mars?',
    mnemo: '…<b>J</b>ust <b>S</b>erved <b>U</b>s <b>N</b>oodles — Jupiter, Saturn, Uranus, Neptune!' },
  { kind: 'order', start: 0, count: 8, tier: 3,
    intro: 'The whole parade! All 8 planets, in order from the Sun.',
    mnemo: '<b>M</b>y <b>V</b>ery <b>E</b>xcellent <b>M</b>other <b>J</b>ust <b>S</b>erved <b>U</b>s <b>N</b>oodles!' },
  { kind: 'moon', phase: 'crescent', stones: ['crescent', 'half', 'full', 'new'], target: 'full', tier: 2 },
  { kind: 'moon', phase: 'gibbous', stones: ['gibbous', 'crescent', 'half', 'full'], target: 'new', tier: 3 }
];

// sky geometry: the Sun peeks in from the left edge, rings fan out rightward
const SUN_X = 4;
const SUN_Y = 120;
const R_MIN = 34;
const R_MAX = 112;

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let k = a.length - 1; k > 0; k--) {
    const j = Math.floor(Math.random() * (k + 1));
    [a[k], a[j]] = [a[j], a[k]];
  }
  return a;
}

export function runPlanets(ctx: MechContext) {
  const rounds = ALL_ROUNDS.slice(0, Math.max(3, Math.min(ctx.rounds, ALL_ROUNDS.length)));
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech planetsmech';
  ctx.host.appendChild(wrap);

  function finish() {
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  }

  function head() {
    return `
      <div class="mechhead">
        <div class="mechtitle">🪐 Planet Parade</div>
        <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
      </div>`;
  }

  function wobble(el: HTMLElement) {
    el.classList.add('planets-wrong');
    setTimeout(() => el.classList.remove('planets-wrong'), 500);
  }

  // shown after a round records: lets the kid admire the running sky
  function showNext() {
    const bar = wrap.querySelector('.planets-next') as HTMLElement;
    const btn = wrap.querySelector('.planets-nextbtn') as HTMLButtonElement;
    const last = i >= rounds.length;
    btn.textContent = last ? 'FINISH ⭐' : 'NEXT ▶';
    bar.hidden = false;
    btn.onclick = () => {
      if (last) {
        btn.disabled = true;
        sfx.fanfare();
        const msg = wrap.querySelector('.mechmsg') as HTMLElement;
        msg.textContent = '⭐ Parade complete! You know your way around the sky!';
        setTimeout(finish, 1300);
      } else {
        sfx.blip();
        next();
      }
    };
  }

  function next() {
    if (i >= rounds.length) return finish();
    const r = rounds[i];
    if (r.kind === 'order') runOrder(r);
    else runMoon(r);
  }

  // ---- PART A: order the planets (skill space.solarsystem) ----
  function runOrder(r: OrderRound) {
    const seq = PLANETS.slice(r.start, r.start + r.count);
    let placed = 0;
    let mistakes = 0;

    wrap.innerHTML = `
      ${head()}
      <div class="planets-sky"><div class="planets-sun"></div></div>
      <div class="planets-mnemo" hidden></div>
      <div class="mechmsg">${r.intro}</div>
      <div class="planets-tray"></div>
      <div class="mechbtns planets-next" hidden><button class="planets-nextbtn">NEXT ▶</button></div>`;

    const sky = wrap.querySelector('.planets-sky') as HTMLElement;
    const tray = wrap.querySelector('.planets-tray') as HTMLElement;
    const msg = wrap.querySelector('.mechmsg') as HTMLElement;
    const mnemo = wrap.querySelector('.planets-mnemo') as HTMLElement;

    const radius = (slot: number) =>
      R_MIN + (slot * (R_MAX - R_MIN)) / Math.max(1, r.count - 1);

    const rings: HTMLElement[] = [];
    for (let s = 0; s < r.count; s++) {
      const ring = document.createElement('div');
      ring.className = 'planets-ring';
      const rad = radius(s);
      ring.style.left = `${SUN_X - rad}px`;
      ring.style.top = `${SUN_Y - rad}px`;
      ring.style.width = `${rad * 2}px`;
      ring.style.height = `${rad * 2}px`;
      sky.appendChild(ring);
      rings.push(ring);
    }
    rings[0].classList.add('planets-expect');

    const spawnOrbiter = (slot: number, p: PlanetDef) => {
      const rad = radius(slot);
      const orb = document.createElement('div');
      orb.className = 'planets-orb';
      orb.style.left = `${SUN_X}px`;
      orb.style.top = `${SUN_Y}px`;
      orb.style.setProperty('--per', `${5 + slot * 3}s`); // closer = faster!
      const dot = document.createElement('div');
      dot.className = `planets-orbdot planets-pl-${p.cls}`;
      dot.style.width = `${p.size}px`;
      dot.style.height = `${p.size}px`;
      dot.style.left = `${rad - p.size / 2}px`;
      dot.style.top = `${-p.size / 2}px`;
      orb.appendChild(dot);
      sky.appendChild(orb);
    };

    const fly = (chip: HTMLElement, slot: number, p: PlanetDef) => {
      const dotEl = chip.querySelector('.planets-chipdot') as HTMLElement;
      const from = dotEl.getBoundingClientRect();
      const wrapBox = wrap.getBoundingClientRect();
      const skyBox = sky.getBoundingClientRect();
      const flyer = document.createElement('div');
      flyer.className = `planets-flyer planets-pl-${p.cls}`;
      flyer.style.width = `${from.width}px`;
      flyer.style.height = `${from.height}px`;
      flyer.style.left = `${from.left - wrapBox.left + wrap.scrollLeft}px`;
      flyer.style.top = `${from.top - wrapBox.top + wrap.scrollTop}px`;
      wrap.appendChild(flyer);
      void flyer.offsetWidth; // commit start position so the transition runs
      const rad = radius(slot);
      flyer.style.width = `${p.size}px`;
      flyer.style.height = `${p.size}px`;
      flyer.style.left = `${skyBox.left - wrapBox.left + wrap.scrollLeft + SUN_X + rad - p.size / 2}px`;
      flyer.style.top = `${skyBox.top - wrapBox.top + wrap.scrollTop + SUN_Y - p.size / 2}px`;
      setTimeout(() => {
        flyer.remove();
        spawnOrbiter(slot, p);
      }, 580);
    };

    for (const p of shuffle(seq)) {
      const chip = document.createElement('button');
      chip.className = 'planets-chip';
      chip.innerHTML = `<span class="planets-chipdot planets-pl-${p.cls}"></span><span class="planets-chipname">${p.name}</span>`;
      const cd = chip.querySelector('.planets-chipdot') as HTMLElement;
      const cs = Math.max(13, Math.round(p.size * 1.7));
      cd.style.width = `${cs}px`;
      cd.style.height = `${cs}px`;
      chip.addEventListener('click', () => {
        if (chip.classList.contains('planets-placed') || placed >= seq.length) return;
        const want = seq[placed];
        if (p.name === want.name) {
          fly(chip, placed, p);
          chip.classList.add('planets-placed');
          rings[placed].classList.remove('planets-expect');
          placed++;
          if (placed < seq.length) {
            sfx.chirp();
            rings[placed].classList.add('planets-expect');
            msg.textContent = `✓ ${p.name} is ${p.fact}. Next: the ${ORDS[r.start + placed]} planet!`;
          } else {
            sfx.win();
            mnemo.innerHTML = r.mnemo;
            mnemo.hidden = false;
            msg.textContent = '🌟 Every planet in its place — watch them go! Closer planets orbit FASTER.';
            recordAttempt(ctx.save, {
              id: `mech.planets.r${i}.order-${r.start}-${r.count}`, skill: 'space.solarsystem', tier: r.tier,
              q: 'planet parade', options: ['', '', '', ''],
              why: 'Order from the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune.'
            }, mistakes === 0, Date.now());
            ctx.persist();
            if (mistakes === 0) flawless++;
            i++;
            showNext();
          }
        } else {
          mistakes++;
          sfx.buzz();
          wobble(chip);
          msg.textContent = `Not yet — ${p.name} is ${p.fact}. Find the ${ORDS[r.start + placed]} planet from the Sun!`;
        }
      });
      tray.appendChild(chip);
    }
  }

  // ---- PART B: moon phases (skill space.moon) ----
  function runMoon(r: MoonRound) {
    let mistakes = 0;

    // step B: place the Moon on the Earth-orbit diagram
    const stepB = () => {
      const prompt = r.target === 'full'
        ? 'Now build it: tap the spot where the Moon makes a FULL moon — opposite the Sun!'
        : 'Trickier: tap the spot where the Moon makes a NEW moon — hiding its bright side from us!';
      wrap.innerHTML = `
        ${head()}
        <div class="planets-diag">
          <div class="planets-dsun"></div>
          <div class="planets-dorbit"></div>
          <div class="planets-dearth"></div>
          <button class="planets-spot planets-spot-left"><span class="planets-spotdot"></span></button>
          <button class="planets-spot planets-spot-right"><span class="planets-spotdot"></span></button>
          <button class="planets-spot planets-spot-top"><span class="planets-spotdot"></span></button>
          <button class="planets-spot planets-spot-bottom"><span class="planets-spotdot"></span></button>
        </div>
        <div class="mechmsg">${prompt}</div>
        <div class="mechbtns planets-next" hidden><button class="planets-nextbtn">NEXT ▶</button></div>`;

      const msg = wrap.querySelector('.mechmsg') as HTMLElement;
      const wantPos = r.target === 'full' ? 'right' : 'left';
      const TEACH: Record<'left' | 'right' | 'top' | 'bottom', string> = {
        left: 'Between the Sun and Earth, the bright side faces AWAY from us — that spot makes a NEW moon.',
        right: 'Opposite the Sun, the whole sunlit face shines at us — that spot makes a FULL moon!',
        top: 'From there we see half lit, half dark — that makes a HALF moon.',
        bottom: 'From there we see half lit, half dark — that makes a HALF moon.'
      };
      let solved = false;
      for (const pos of ['left', 'right', 'top', 'bottom'] as const) {
        const spot = wrap.querySelector(`.planets-spot-${pos}`) as HTMLButtonElement;
        spot.addEventListener('click', () => {
          if (solved) return;
          if (pos === wantPos) {
            solved = true;
            sfx.win();
            spot.classList.add(r.target === 'full' ? 'planets-lit' : 'planets-dark');
            const why = r.target === 'full'
              ? 'FULL moon: Sun → Earth → Moon in a line, so we see the whole sunlit face.'
              : 'NEW moon: the Moon sits between Earth and the Sun, so its bright side faces away.';
            msg.textContent = '⭐ ' + why;
            recordAttempt(ctx.save, {
              id: `mech.planets.r${i}.moon-${r.phase}-${r.target}`, skill: 'space.moon', tier: r.tier,
              q: 'moon phase', options: ['', '', '', ''], why
            }, mistakes === 0, Date.now());
            ctx.persist();
            if (mistakes === 0) flawless++;
            i++;
            showNext();
          } else {
            mistakes++;
            sfx.buzz();
            wobble(spot);
            msg.textContent = TEACH[pos];
          }
        });
      }
    };

    // step A: name the phase you see
    wrap.innerHTML = `
      ${head()}
      <div class="planets-moonwrap">
        <div class="planets-moonbox planets-phase-${r.phase}">
          <div class="planets-moondisc"></div>
          <div class="planets-moonshade"></div>
        </div>
      </div>
      <div class="mechmsg">Moon time! What phase is this? Tap its name-stone.</div>
      <div class="planets-stones"></div>
      <div class="mechbtns planets-next" hidden><button class="planets-nextbtn">NEXT ▶</button></div>`;

    const msg = wrap.querySelector('.mechmsg') as HTMLElement;
    const stonesBox = wrap.querySelector('.planets-stones') as HTMLElement;
    let named = false;

    for (const key of shuffle(r.stones)) {
      const stone = document.createElement('button');
      stone.className = 'planets-stone';
      const def = PHASES[key];
      stone.textContent = def.label;
      stone.addEventListener('click', () => {
        if (named) return;
        if (key === r.phase) {
          named = true;
          sfx.chirp();
          stone.classList.add('planets-lit');
          for (const other of Array.from(stonesBox.children)) {
            if (other !== stone) other.classList.add('planets-dim');
          }
          msg.textContent = `✓ ${def.label} moon — ${def.look}!`;
          setTimeout(stepB, 1500);
        } else {
          mistakes++;
          sfx.buzz();
          wobble(stone);
          msg.textContent = `Not quite — a ${def.label} moon means ${def.look}. Look at the glow again!`;
        }
      });
      stonesBox.appendChild(stone);
    }
  }

  next();
}
