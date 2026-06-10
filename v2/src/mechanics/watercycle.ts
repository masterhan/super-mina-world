// Water Cycle Run — hands-on earth science. Mina guides Drip the droplet
// around the water cycle by tapping the SCENE itself: the open sky
// (evaporation), the cloud (condensation), the rain zone (precipitation)
// and the ocean (collection). The journey IS the lesson: correct taps
// animate the stage, wrong taps gently explain the physics. Later rounds
// drop the hints, flip to name-the-stage, and end with a freezing SNOW day.

import '../styles/watercycle.css';
import { MechContext } from './contract';
import { recordAttempt } from '../core/mastery';
import { sfx } from '../core/sfx';

type Stage = 'evaporation' | 'condensation' | 'precipitation' | 'collection';
type Kind = 'guided' | 'solo' | 'name' | 'snow';

interface Round {
  kind: Kind;
  tier: 1 | 2 | 3;
  intro: string;
  why: string;
}

interface StageInfo {
  name: string;        // big banner word
  zone: string;        // data-zone of the correct tap target
  ask: string;
  coldAsk?: string;
  hint: string;        // shown on a wrong tap
  teach: string;       // shown after the correct tap
  coldTeach?: string;
  nameHint: string;    // name round: wrong chip (doesn't give it away)
  nameTeach: string;   // name round: after the correct chip
}

const STAGES: Stage[] = ['evaporation', 'condensation', 'precipitation', 'collection'];

const INFO: Record<Stage, StageInfo> = {
  evaporation: {
    name: 'EVAPORATION',
    zone: 'sky',
    ask: 'Drip is in the ocean and the sun is shining — where does Drip go next?',
    coldAsk: 'Even on cold days the sun shines! Drip is in the ocean — where does Drip go next?',
    hint: 'When the sun heats water, it rises UP as vapor — tap the open sky!',
    teach: 'The sun heats the water — Drip rises up, up, up as invisible vapor!',
    nameHint: 'The sun heated the water and Drip floated UP — which word means water rising as vapor?',
    nameTeach: 'EVAPORATION — the sun heats water and it rises as vapor!'
  },
  condensation: {
    name: 'CONDENSATION',
    zone: 'cloud',
    ask: 'Drip is floating way up high as vapor... where to now?',
    coldAsk: 'Drip is floating up high... brrr, it is EXTRA cold up there! Where to now?',
    hint: 'High up it gets chilly — vapor squeezes together into a CLOUD. Tap the cloud!',
    teach: 'Way up high it is cold — vapor squeezes together and becomes a cloud!',
    nameHint: 'Vapor squeezed together into a cloud — which word means cloud-making?',
    nameTeach: 'CONDENSATION — vapor cools and squeezes into a cloud!'
  },
  precipitation: {
    name: 'PRECIPITATION',
    zone: 'rain',
    ask: 'The cloud is big and heavy with water... what happens next?',
    coldAsk: 'The cloud is heavy AND freezing cold... what happens next?',
    hint: 'Heavy clouds drop their water! Tap right below the cloud, over the mountains.',
    teach: 'The cloud got too heavy — the water falls back down as rain!',
    coldTeach: 'It is FREEZING — so Drip falls as fluffy SNOW instead of rain!',
    nameHint: 'Water fell down from the cloud — which word means falling rain or snow?',
    nameTeach: 'PRECIPITATION — the heavy cloud lets the water fall!'
  },
  collection: {
    name: 'COLLECTION',
    zone: 'ocean',
    ask: 'Drip landed on the mountain. Where does the water go now?',
    coldAsk: 'Drip landed on the mountain as snow! When it melts, where does the water go?',
    hint: 'Water runs downhill in streams and rivers — tap the ocean!',
    teach: 'Streams and rivers carry the water back to the ocean. Ready to go again!',
    coldTeach: 'The snow melts into the stream and flows all the way back to the ocean!',
    nameHint: 'The water gathered back in the ocean — which word means gathering together?',
    nameTeach: 'COLLECTION — streams carry the water back to the ocean!'
  }
};

function makeRounds(n: number): Round[] {
  const base: Round[] = [
    {
      kind: 'guided', tier: 1,
      intro: 'Help Drip travel the whole water cycle! The glowing spot shows the way.',
      why: 'Evaporation → condensation → precipitation → collection — water goes round and round!'
    },
    {
      kind: 'solo', tier: 2,
      intro: 'Round 2 — no glowing hints this time! You know the way.',
      why: 'Evaporation → condensation → precipitation → collection — water goes round and round!'
    },
    {
      kind: 'name', tier: 2,
      intro: '👀 Now watch Drip move... then tap the NAME of the stage!',
      why: 'Each stage has a name: evaporation, condensation, precipitation, collection.'
    },
    {
      kind: 'snow', tier: 3,
      intro: '❄ Brrr — a freezing cold day! Guide Drip again... something surprising might fall!',
      why: 'When it is freezing, precipitation falls as SNOW — the cycle keeps going!'
    }
  ];
  return base.slice(0, Math.max(3, Math.min(n, base.length)));
}

const SPOTS = ['ocean', 'sky', 'cloud', 'peak', 'stream'] as const;

export function runWatercycle(ctx: MechContext) {
  const rounds = makeRounds(ctx.rounds);
  let i = 0;
  let flawless = 0;

  const wrap = document.createElement('div');
  wrap.className = 'mech watercyclemech';
  ctx.host.appendChild(wrap);

  const finish = () => {
    wrap.remove();
    ctx.onDone({ rounds: rounds.length, flawless });
  };

  const next = () => {
    if (i >= rounds.length) {
      sfx.fanfare();
      return finish();
    }
    const r = rounds[i];
    const cold = r.kind === 'snow';
    let step = 0;
    let mistakes = 0;
    let busy = false;

    wrap.innerHTML = `
      <div class="mechhead">
        <div class="mechtitle">💧 Water Cycle Run</div>
        <div class="dots">${'●'.repeat(i)}${'○'.repeat(rounds.length - i)}</div>
      </div>
      <div class="watercycle-scene${cold ? ' watercycle-scene--cold' : ''}${r.kind === 'name' ? ' watercycle-scene--watch' : ''}">
        <div class="watercycle-sun"></div>
        <div class="watercycle-cloud"></div>
        <div class="watercycle-peak watercycle-peak--a"></div>
        <div class="watercycle-peak watercycle-peak--b"></div>
        <div class="watercycle-stream"></div>
        <div class="watercycle-ocean"></div>
        <button class="watercycle-zone watercycle-zone--sky" data-zone="sky" aria-label="the open sky"></button>
        <button class="watercycle-zone watercycle-zone--cloud" data-zone="cloud" aria-label="the cloud"></button>
        <button class="watercycle-zone watercycle-zone--rain" data-zone="rain" aria-label="below the cloud"></button>
        <button class="watercycle-zone watercycle-zone--ocean" data-zone="ocean" aria-label="the ocean"></button>
        <div class="watercycle-fx"></div>
        <div class="watercycle-drip">
          <span class="watercycle-face">
            <span class="watercycle-eye watercycle-eye--l"></span>
            <span class="watercycle-eye watercycle-eye--r"></span>
            <span class="watercycle-smile"></span>
            <span class="watercycle-flake">❄</span>
          </span>
        </div>
        <div class="watercycle-banner"></div>
      </div>
      <div class="mechmsg"></div>
      <div class="watercycle-names"></div>`;

    const pick = <T extends HTMLElement>(sel: string): T => {
      const el = wrap.querySelector(sel) as T | null;
      if (!el) throw new Error('watercycle: missing ' + sel);
      return el;
    };
    const drip = pick<HTMLElement>('.watercycle-drip');
    const cloud = pick<HTMLElement>('.watercycle-cloud');
    const stream = pick<HTMLElement>('.watercycle-stream');
    const fx = pick<HTMLElement>('.watercycle-fx');
    const banner = pick<HTMLElement>('.watercycle-banner');
    const msg = pick<HTMLElement>('.mechmsg');
    const namesBox = pick<HTMLElement>('.watercycle-names');
    const zones = Array.from(wrap.querySelectorAll<HTMLButtonElement>('.watercycle-zone'));

    const setDrip = (spot: typeof SPOTS[number]) => {
      for (const s of SPOTS) drip.classList.remove('watercycle-drip--at-' + s);
      drip.classList.add('watercycle-drip--at-' + spot);
    };
    setDrip('ocean');

    const showBanner = (text: string) => {
      banner.textContent = text;
      banner.classList.remove('watercycle-banner--show');
      void banner.offsetWidth;
      banner.classList.add('watercycle-banner--show');
    };

    const spawnVapor = () => {
      for (let v = 0; v < 3; v++) {
        const s = document.createElement('span');
        s.className = 'watercycle-vapor';
        s.style.left = (20 + v * 9) + '%';
        s.style.animationDelay = (v * 0.18) + 's';
        s.textContent = '~';
        fx.appendChild(s);
        setTimeout(() => s.remove(), 2000);
      }
    };

    const spawnFall = () => {
      for (let d = 0; d < 7; d++) {
        const s = document.createElement('span');
        s.className = 'watercycle-fall' + (cold ? ' watercycle-fall--snow' : '');
        s.style.left = (58 + Math.random() * 30) + '%';
        s.style.animationDelay = (Math.random() * 0.5).toFixed(2) + 's';
        if (cold) s.textContent = '❄';
        fx.appendChild(s);
        setTimeout(() => s.remove(), 2400);
      }
    };

    // Moves Drip + scenery for one stage, then calls cb. The banner is NOT
    // shown here — tap rounds show it on the correct tap, the name round
    // only after the correct chip (no spoilers).
    const animateStage = (st: Stage, cb: () => void) => {
      if (st === 'evaporation') {
        spawnVapor();
        drip.classList.add('watercycle-drip--vapor');
        setDrip('sky');
        setTimeout(cb, 1400);
      } else if (st === 'condensation') {
        setDrip('cloud');
        setTimeout(() => {
          drip.classList.remove('watercycle-drip--vapor');
          drip.classList.add('watercycle-drip--hidden');
          cloud.classList.add('watercycle-cloud--full');
        }, 1100);
        setTimeout(cb, 1600);
      } else if (st === 'precipitation') {
        spawnFall();
        drip.classList.remove('watercycle-drip--hidden');
        if (cold) drip.classList.add('watercycle-drip--flake');
        drip.classList.add('watercycle-drip--fall');
        setDrip('peak');
        setTimeout(() => {
          cloud.classList.remove('watercycle-cloud--full');
          drip.classList.remove('watercycle-drip--fall');
        }, 1200);
        setTimeout(cb, 1500);
      } else {
        stream.classList.add('watercycle-stream--flow');
        drip.classList.remove('watercycle-drip--flake'); // snow melts into the stream
        setDrip('stream');
        setTimeout(() => setDrip('ocean'), 800);
        setTimeout(() => stream.classList.remove('watercycle-stream--flow'), 2000);
        setTimeout(cb, 2000);
      }
    };

    const roundDone = () => {
      msg.textContent = '⭐ ' + (mistakes === 0 ? 'Flawless! ' : '') + r.why;
      recordAttempt(ctx.save, {
        id: `mech.watercycle.r${i}.${r.kind}`, skill: 'earth.watercycle', tier: r.tier,
        q: 'watercycle', options: ['', '', '', ''], why: r.why
      }, mistakes === 0, Date.now());
      ctx.persist();
      if (mistakes === 0) flawless++;
      i++;
      sfx.win();
      setTimeout(next, 2300);
    };

    // ---- tap rounds (guided / solo / snow) ----
    const ask = () => {
      const inf = INFO[STAGES[step]];
      msg.textContent = (step === 0 ? r.intro + ' ' : '') + ((cold && inf.coldAsk) || inf.ask);
      for (const z of zones) z.classList.remove('watercycle-zone--hint');
      if (r.kind === 'guided') {
        const target = zones.find(z => z.dataset.zone === inf.zone);
        if (target) target.classList.add('watercycle-zone--hint');
      }
      busy = false;
    };

    for (const z of zones) {
      z.addEventListener('click', () => {
        if (busy || r.kind === 'name') return;
        sfx.blip();
        const st = STAGES[step];
        const inf = INFO[st];
        if (z.dataset.zone === inf.zone) {
          busy = true;
          z.classList.remove('watercycle-zone--hint');
          sfx.chirp();
          showBanner(inf.name + '!');
          animateStage(st, () => {
            msg.textContent = (cold && inf.coldTeach) || inf.teach;
            step++;
            if (step >= STAGES.length) setTimeout(roundDone, 1400);
            else setTimeout(ask, 1500);
          });
        } else {
          mistakes++;
          sfx.buzz();
          z.classList.add('watercycle-zone--wrong');
          setTimeout(() => z.classList.remove('watercycle-zone--wrong'), 500);
          msg.textContent = '🤔 ' + inf.hint;
        }
      });
    }

    // ---- name round (watch the stage, tap its name) ----
    const startNameRound = () => {
      const order = [...STAGES].sort(() => Math.random() - 0.5);
      namesBox.innerHTML = order
        .map(s => `<button class="watercycle-chip" data-stage="${s}">${INFO[s].name}</button>`)
        .join('');
      const chips = Array.from(namesBox.querySelectorAll<HTMLButtonElement>('.watercycle-chip'));
      const setChips = (on: boolean) => { for (const c of chips) c.disabled = !on; };

      const watchStep = () => {
        setChips(false);
        msg.textContent = step === 0 ? r.intro : '👀 Watch closely...';
        setTimeout(() => {
          animateStage(STAGES[step], () => {
            msg.textContent = 'Which stage was that? Tap its name!';
            setChips(true);
          });
        }, step === 0 ? 1600 : 600);
      };

      for (const c of chips) {
        c.addEventListener('click', () => {
          sfx.blip();
          const inf = INFO[STAGES[step]];
          if (c.dataset.stage === STAGES[step]) {
            setChips(false);
            sfx.chirp();
            showBanner(inf.name + '!');
            c.classList.add('watercycle-chip--right');
            msg.textContent = inf.nameTeach;
            setTimeout(() => {
              c.classList.remove('watercycle-chip--right');
              step++;
              if (step >= STAGES.length) roundDone();
              else watchStep();
            }, 1700);
          } else {
            mistakes++;
            sfx.buzz();
            c.classList.add('watercycle-chip--wrong');
            setTimeout(() => c.classList.remove('watercycle-chip--wrong'), 500);
            msg.textContent = '🤔 ' + inf.nameHint;
          }
        });
      }

      watchStep();
    };

    if (r.kind === 'name') startNameRound();
    else ask();
  };

  next();
}
