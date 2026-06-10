// The bright overworld — Mario-style world select. Eight realms, a castle that
// lights when all eight stars shine, and BYTE bobbing along beside the picks.
// Node buttons are DOM (big, tappable, labeled); the sky/ground is Phaser.

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { WORLDS, WORLD_ORDER } from '../data/worlds';
import { SaveV2 } from '../core/types';
import { uiLayer, clearLayer } from '../ui/overlay';
import { sfx } from '../core/sfx';
import { music } from '../core/music';
import { T } from '../ui/fonts';
import { openGrownUps } from '../ui/grownups';
import { openSaveCode, openPlayers } from '../ui/tools';
import { openCollection } from '../ui/collection';
import { MECHANICS } from '../mechanics/index';

export interface OverworldConfig {
  save: SaveV2;
  persist: () => void;
  justWon?: string; // world id just beaten → celebrate
}

export class OverworldScene extends Phaser.Scene {
  private cfg!: OverworldConfig;

  constructor() { super('Overworld'); }

  init(data: OverworldConfig) { this.cfg = data; }

  create() {
    const s = this.cfg.save;
    this.cameras.main.fadeIn(300);
    music.play('overworld');

    // sky → grass painted backdrop
    const g = this.add.graphics();
    g.fillGradientStyle(0x7ec8e8, 0x7ec8e8, 0xa8e6b8, 0xa8e6b8, 1);
    g.fillRect(0, 0, GAME_W, GAME_H);
    g.fillStyle(0x58b86c, 1);
    g.fillRect(0, GAME_H * 0.22, GAME_W, GAME_H);
    // winding path hint
    g.fillStyle(0xd8c08a, 0.8);
    for (const id of WORLD_ORDER) {
      const w = WORLDS[id];
      g.fillCircle((w.mapX / 100) * GAME_W, (w.mapY / 100) * GAME_H, 4);
    }

    // castle
    const allDone = WORLD_ORDER.every(id => s.stars[id]);
    const castle = this.add.text(GAME_W / 2, GAME_H * 0.08, '🏰', T.emoji(34)).setOrigin(0.5);
    if (allDone) {
      this.tweens.add({ targets: castle, scale: 1.15, duration: 800, yoyo: true, repeat: -1 });
    } else {
      castle.setAlpha(0.55);
    }

    const stars = WORLD_ORDER.filter(id => s.stars[id]).length;
    this.add.text(GAME_W / 2, GAME_H * 0.155, '★ ' + stars + ' / 8', T.title(8, '#3a2c10')).setOrigin(0.5);

    // ---- DOM node buttons ----
    const ui = uiLayer('overworld');
    const wrap = document.createElement('div');
    wrap.className = 'owmap';
    ui.appendChild(wrap);

    const title = document.createElement('div');
    title.className = 'owtitle';
    title.textContent = (s.player.name || 'MINA') + '’S WORLD';
    wrap.appendChild(title);

    for (const id of WORLD_ORDER) {
      const w = WORLDS[id];
      const done = !!s.stars[id];
      const b = document.createElement('button');
      b.className = 'ownode' + (done ? ' done' : '');
      b.style.left = w.mapX + '%';
      b.style.top = w.mapY + '%';
      b.innerHTML = `<span class="oni">${w.emoji}</span><span class="onl">${w.name}</span>` + (done ? '<span class="onstar">⭐</span>' : '');
      b.onclick = () => {
        sfx.tone(880, 0.08); sfx.tone(1180, 0.1, 'square', 0.07);
        clearLayer('overworld');
        this.scene.start('Hub', { world: w, save: s, persist: this.cfg.persist });
      };
      wrap.appendChild(b);
    }

    // castle tap → finale (boss rush) once all 8 stars shine
    if (allDone) {
      const cb = document.createElement('button');
      cb.className = 'ownode castle';
      cb.style.left = '50%';
      cb.style.top = '6%';
      cb.innerHTML = '<span class="oni">👑</span><span class="onl">THE CITADEL</span>';
      cb.onclick = () => {
        sfx.fanfare();
        clearLayer('overworld');
        this.scene.start('Citadel', { save: s, persist: this.cfg.persist });
      };
      wrap.appendChild(cb);
    }

    // footer utilities: grown-ups report, save-code backup, player profiles
    const foot = document.createElement('div');
    foot.className = 'owfoot';
    foot.innerHTML = `
      <button class="owtool" data-t="arcade">🕹️ arcade</button>
      <button class="owtool" data-t="book">📖 treasures</button>
      <button class="owtool" data-t="grownups">👪 grown-ups</button>
      <button class="owtool" data-t="save">💾 save</button>
      <button class="owtool" data-t="players">👤 players</button>`;
    wrap.appendChild(foot);
    foot.querySelectorAll<HTMLButtonElement>('.owtool').forEach(b => {
      b.onclick = () => {
        sfx.blip();
        if (b.dataset.t === 'arcade' && MECHANICS.arcade) {
          const layer = uiLayer('arcade');
          MECHANICS.arcade({ host: layer, save: s, persist: this.cfg.persist, rounds: 1, onDone: () => clearLayer('arcade') });
        }
        else if (b.dataset.t === 'book') openCollection(ui, s, () => {});
        else if (b.dataset.t === 'grownups') openGrownUps(ui, s, () => {});
        else if (b.dataset.t === 'save') openSaveCode(ui, s, () => {});
        else openPlayers(ui, () => {});
      };
    });

    // victory celebration when returning from a boss win
    if (this.cfg.justWon) {
      const w = WORLDS[this.cfg.justWon];
      sfx.fanfare();
      this.time.delayedCall(380, () => sfx.fanfare());
      for (let i = 0; i < 24; i++) {
        const star = this.add.text(
          (w.mapX / 100) * GAME_W, (w.mapY / 100) * GAME_H, '✦', T.glyph(10, '#ffd24a')
        ).setOrigin(0.5);
        this.tweens.add({
          targets: star,
          x: star.x + (Math.random() * 120 - 60),
          y: star.y - Math.random() * 90,
          alpha: 0,
          duration: 900 + Math.random() * 600,
          onComplete: () => star.destroy()
        });
      }
    }
  }
}
