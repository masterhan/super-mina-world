// The Grown-Ups screen — the honest progress report, no account needed.
// Behind a tiny adult gate (solve 7×8). Shows, per subject: skills mastered /
// in progress / not started, recent accuracy, play minutes this week, and
// "practice together" suggestions for whatever is closest to mastery.
// This screen is why a parent recommends the game: it tells the truth.

import { SaveV2 } from '../core/types';
import { skillReport } from '../core/mastery';
import { WORLDS, WORLD_ORDER } from '../data/worlds';
import { sfx } from '../core/sfx';

const SKILL_NAMES: Record<string, string> = {
  'math.mult.facts': 'Multiplication facts',
  'math.div.facts': 'Division facts',
  'math.fractions': 'Fractions',
  'math.placevalue': 'Place value & rounding',
  'math.wordproblems': 'Word problems',
  'ela.wordparts': 'Prefixes & suffixes',
  'ela.synonyms': 'Synonyms & antonyms',
  'ela.grammar': 'Grammar basics',
  'bio.foodchains': 'Food chains',
  'bio.lifecycles': 'Life cycles',
  'bio.habitats': 'Habitats & animal groups',
  'earth.watercycle': 'The water cycle',
  'earth.weather': 'Weather',
  'earth.rocks': 'Rocks & erosion',
  'space.solarsystem': 'The solar system',
  'space.moon': 'Moon phases',
  'space.daynight': 'Day, night & seasons',
  'phys.matter': 'States of matter',
  'phys.circuits': 'Electricity & circuits',
  'phys.forces': 'Forces & magnets',
  'geo.classic': 'Map basics',
  'geo.continents': 'Continents & oceans',
  'geo.usa': 'The United States',
  'geo.world': 'Countries & landmarks',
  'code.sequences': 'Sequences (coding)',
  'code.loops': 'Loops (coding)',
  'code.debugging': 'Debugging'
};

function weekMinutes(save: SaveV2): number {
  const now = Date.now();
  let total = 0;
  for (const [day, mins] of Object.entries(save.minutes)) {
    const t = new Date(day + 'T12:00:00').getTime();
    if (now - t < 7 * 86400000) total += mins;
  }
  return total;
}

export function openGrownUps(host: HTMLElement, save: SaveV2, onClose: () => void) {
  const wrap = document.createElement('div');
  wrap.className = 'gpanel';
  host.appendChild(wrap);

  // adult gate
  const a = 7, b = 8;
  wrap.innerHTML = `
    <div class="gtitle">For grown-ups</div>
    <div class="gbody">Quick check: what is ${a} × ${b}?</div>
    <input class="ginput" inputmode="numeric" maxlength="3">
    <div class="growbtns"><button class="gbtn ggo">Enter</button><button class="gbtn gclose">Back to the game</button></div>`;
  const input = wrap.querySelector('.ginput') as HTMLInputElement;
  (wrap.querySelector('.gclose') as HTMLButtonElement).onclick = () => { wrap.remove(); onClose(); };
  (wrap.querySelector('.ggo') as HTMLButtonElement).onclick = () => {
    if (input.value.trim() === String(a * b)) { sfx.win(); report(); }
    else { sfx.buzz(); input.value = ''; input.placeholder = 'try again'; }
  };

  const report = () => {
    const rows = WORLD_ORDER.map(id => {
      const w = WORLDS[id];
      const reports = w.skills.map(k => ({ k, r: skillReport(save, k) }));
      const items = reports.map(({ k, r }) => {
        const name = SKILL_NAMES[k] || k;
        const badge = r.state === 'mastered' ? '✅ mastered'
          : r.state === 'in-progress' ? `🔸 ${Math.round(r.recentAccuracy * 100)}% lately (${r.attempts} tries)`
          : '◻️ not started';
        return `<div class="gskill"><span>${name}</span><span>${badge}</span></div>`;
      }).join('');
      return `<div class="gworld"><div class="gworldname">${w.emoji} ${w.subject}${save.stars[id] ? ' ⭐' : ''}</div>${items}</div>`;
    }).join('');

    // practice-together: in-progress skills closest to mastery
    const inProgress = WORLD_ORDER.flatMap(id => WORLDS[id].skills)
      .map(k => ({ k, r: skillReport(save, k) }))
      .filter(x => x.r.state === 'in-progress')
      .sort((x, y) => y.r.recentAccuracy - x.r.recentAccuracy)
      .slice(0, 3);
    const practice = inProgress.length
      ? `<div class="gworldname">Practice together next</div>` + inProgress.map(x =>
        `<div class="gskill"><span>${SKILL_NAMES[x.k] || x.k}</span><span>${Math.round(x.r.recentAccuracy * 100)}% — almost there</span></div>`).join('')
      : '';

    wrap.innerHTML = `
      <div class="gtitle">For grown-ups</div>
      <div class="gbody">Mastered = 9 of the last 10 answers right. Missed questions come back until they're beaten — finishing a world means actually knowing it, not clicking through it.</div>
      <div class="gbody">⏱ About ${weekMinutes(save)} minutes played this week · ⭐ ${WORLD_ORDER.filter(id => save.stars[id]).length}/8 worlds saved</div>
      <div class="greport">${rows}${practice}</div>
      <div class="gbody gfine">No ads · no accounts · no purchases · no data leaves this device. Progress lives in this browser — the Save Code (map screen) backs it up.</div>
      <div class="growbtns"><button class="gbtn gclose2">Back to the game</button></div>`;
    (wrap.querySelector('.gclose2') as HTMLButtonElement).onclick = () => { wrap.remove(); onClose(); };
  };
}
