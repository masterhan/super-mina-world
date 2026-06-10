// The Static Citadel — the finale. Eight doors, one per beaten world boss,
// rematched at full difficulty (MAGIC-tier questions). Then the GLITCH KING,
// who pulls questions from EVERY subject. Progress persists door by door, the
// no-game-over rule still holds, and beating him unlocks Remix Mode — plus he
// deflates into a sulky pixel cat, as he deserves.

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { WORLDS, WORLD_ORDER } from '../data/worlds';
import { SaveV2 } from '../core/types';
import { dialogue } from '../ui/dialogue';
import { uiLayer, clearLayer } from '../ui/overlay';
import { sfx } from '../core/sfx';
import { music } from '../core/music';
import { T } from '../ui/fonts';

export interface CitadelConfig {
  save: SaveV2;
  persist: () => void;
}

const ALL_SKILLS = WORLD_ORDER.flatMap(id => WORLDS[id].skills);

export class CitadelScene extends Phaser.Scene {
  private cfg!: CitadelConfig;
  private ui!: HTMLElement;

  constructor() { super('Citadel'); }

  init(data: CitadelConfig) { this.cfg = data; }

  create() {
    const s = this.cfg.save;
    this.cameras.main.setBackgroundColor('#0d0714');
    this.cameras.main.fadeIn(350);
    music.play('boss');

    // TV-static walls: flickering glyphs
    this.time.addEvent({
      delay: 130, loop: true, callback: () => {
        const t = this.add.text(Math.random() * GAME_W, Math.random() * GAME_H, '▓', T.glyph(8, '#3a2a4a'));
        this.time.delayedCall(320, () => t.destroy());
      }
    });
    this.add.text(GAME_W / 2, 28, 'THE STATIC CITADEL', T.title(11, '#c9a0ff')).setOrigin(0.5);

    this.ui = uiLayer('citadel');
    if (s.citadel.done) return this.hall(true);

    if (s.citadel.defeated === 0) {
      dialogue({
        layer: this.ui, speaker: 'CIPHER',
        lines: [
          'This is it. His fortress.',
          'Eight doors — behind each, a boss you already beat... at FULL strength now.',
          'Clear them all and the throne room opens.',
          'Everything you mastered got you here. Go.'
        ],
        onDone: () => this.hall()
      });
    } else this.hall();
  }

  private hall(victoryLap = false) {
    const s = this.cfg.save;
    const wrap = document.createElement('div');
    wrap.className = 'citadelhall';
    const doors = WORLD_ORDER.map((id, i) => {
      const w = WORLDS[id];
      const beaten = i < s.citadel.defeated;
      const next = i === s.citadel.defeated && !victoryLap;
      return `<button class="cdoor${beaten ? ' beaten' : ''}${next ? ' next' : ''}" data-i="${i}" ${next ? '' : 'disabled'}>
        <span>${beaten ? '⭐' : w.emoji}</span><span class="cdl">${w.name}</span></button>`;
    }).join('');
    const throne = s.citadel.defeated >= 8
      ? `<button class="cthrone${victoryLap ? ' beaten' : ''}" ${victoryLap ? 'disabled' : ''}>👑 THE THRONE ROOM</button>`
      : `<div class="clocked">👑 ${s.citadel.defeated}/8 doors cleared</div>`;
    wrap.innerHTML = `<div class="chall">${doors}</div>${throne}<button class="cback">🗺️ Back to the map</button>`;
    this.ui.appendChild(wrap);

    wrap.querySelectorAll<HTMLButtonElement>('.cdoor.next').forEach(b => {
      b.onclick = () => {
        sfx.tone(220, 0.2, 'sawtooth');
        const i = Number(b.dataset.i);
        this.fight(WORLD_ORDER[i], false);
      };
    });
    const throneBtn = wrap.querySelector<HTMLButtonElement>('.cthrone:not(.beaten)');
    if (throneBtn) throneBtn.onclick = () => { sfx.fanfare(); this.fight('glitchKing', true); };
    (wrap.querySelector('.cback') as HTMLButtonElement).onclick = () => {
      clearLayer('citadel');
      this.scene.start('Overworld', { save: s, persist: this.cfg.persist });
    };

    if (victoryLap) {
      dialogue({
        layer: this.ui, speaker: 'CIPHER',
        lines: ['The Citadel is quiet now. The cat naps on the throne.', 'Remix Mode is open on every world — everything, at FULL strength. When you want it.'],
        onDone: () => {}
      });
    }
  }

  private fight(worldOrKing: string, isKing: boolean) {
    const s = this.cfg.save;
    clearLayer('citadel');
    const cfg = isKing
      ? { enemyId: 'glitchKing', skills: ALL_SKILLS, rewards: { xp: 200 }, boss: true }
      : { enemyId: WORLDS[worldOrKing].bossId, skills: WORLDS[worldOrKing].skills, rewards: { xp: 50 }, boss: true };

    this.scene.start('Battle', {
      ...cfg,
      save: s,
      persist: this.cfg.persist,
      onEnd: (won: boolean) => {
        if (won && !isKing) {
          s.citadel.defeated += 1;
          this.cfg.persist();
          this.scene.start('Citadel', this.cfg);
        } else if (won && isKing) {
          s.citadel.done = true;
          s.citadel.remix = true;
          if (!s.collection.includes('crown')) s.collection.push('crown');
          this.cfg.persist();
          this.ending();
        } else {
          this.scene.start('Citadel', this.cfg);
        }
      }
    });
  }

  private ending() {
    const s = this.cfg.save;
    this.scene.start('Citadel', this.cfg); // background returns to the hall
    const ui = uiLayer('ending');
    music.play('victory');
    dialogue({
      layer: ui, speaker: 'THE GLITCH KING',
      lines: [
        'Fine... FINE! You un-scrambled EVERYTHING.',
        'Math. Words. The entire water cycle. Who DOES that?!',
        '...that was actually fun. Best loss ever.',
        'meow.'
      ],
      onDone: () => {
        dialogue({
          layer: ui, speaker: s.buddy.name || 'BYTE',
          lines: [
            '✦ HE TURNED INTO A CAT! ✦',
            s.player.name + ', you saved all eight realms. You really, truly know this stuff.',
            '🏆 REMIX MODE unlocked — every world, full strength, whenever you want.',
            'I’m so proud of you. Let’s go play!'
          ],
          onDone: () => {
            clearLayer('ending');
            clearLayer('citadel');
            this.scene.start('Overworld', { save: s, persist: this.cfg.persist });
          }
        });
      }
    });
  }
}
