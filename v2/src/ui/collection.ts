// The Collection Book — rewards with no store and no currency. Every item is
// EARNED at a learning milestone and nothing is missable or purchasable.

import { SaveV2 } from '../core/types';
import { WORLDS, WORLD_ORDER } from '../data/worlds';

interface Item { id: string; emoji: string; name: string; how: string }

function allItems(): Item[] {
  const relics: Item[] = WORLD_ORDER.map(id => ({
    id: id + '-relic',
    emoji: WORLDS[id].emoji,
    name: WORLDS[id].name + ' RELIC',
    how: 'Beat ' + WORLDS[id].name + '’s boss'
  }));
  return [
    ...relics,
    { id: 'crown', emoji: '👑', name: 'THE GLITCH CROWN', how: 'Beat the Glitch King' }
  ];
}

export function openCollection(host: HTMLElement, save: SaveV2, onClose: () => void) {
  const wrap = document.createElement('div');
  wrap.className = 'gpanel';
  const items = allItems();
  const owned = items.filter(i => save.collection.includes(i.id)).length;
  wrap.innerHTML = `
    <div class="gtitle">Collection Book</div>
    <div class="gbody">${owned} of ${items.length} treasures found</div>
    <div class="colgrid">${items.map(i => {
      const got = save.collection.includes(i.id);
      return `<div class="colitem${got ? ' got' : ''}">
        <div class="colemoji">${got ? i.emoji : '❓'}</div>
        <div class="colname">${got ? i.name : '???'}</div>
        <div class="colhow">${i.how}</div>
      </div>`;
    }).join('')}</div>
    <div class="growbtns"><button class="gbtn gclose">Back to the game</button></div>`;
  host.appendChild(wrap);
  (wrap.querySelector('.gclose') as HTMLButtonElement).onclick = () => { wrap.remove(); onClose(); };
}
