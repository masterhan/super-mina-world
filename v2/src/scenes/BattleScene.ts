// Turn-based battle — "Final Fantasy meets flash cards."
// Questions ARE the combat: ATTACK asks one at your level, MAGIC asks a harder
// one for double damage, ITEM drinks a potion (free action). A right answer
// lands a hit (damage number, flash, screen shake); a wrong one teaches the
// why, then the monster counterattacks. At 0 HP, BYTE revives you with a pep
// talk and a full heal — there is NO game over, only retries until the win.

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { EnemyDef, ENEMIES } from '../data/enemies';
import { QuestionSource } from '../core/questions';
import { recordAttempt } from '../core/mastery';
import { SaveV2 } from '../core/types';
import { askQuestion } from '../ui/questionCard';
import { dialogue } from '../ui/dialogue';
import { uiLayer, clearLayer } from '../ui/overlay';
import { sfx } from '../core/sfx';
import { music } from '../core/music';
import { T } from '../ui/fonts';

export interface BattleConfig {
  enemyId: string;
  skills: string[];          // which skills this fight quizzes
  rewards: { xp: number; item?: string };
  boss?: boolean;
  save: SaveV2;
  persist: () => void;       // host writes the save
  onEnd: (won: boolean) => void;
}

const pickLine = (arr: string[]) => arr[(Math.random() * arr.length) | 0];

export class BattleScene extends Phaser.Scene {
  private cfg!: BattleConfig;
  private enemy!: EnemyDef;
  private enemyHp = 0;
  private enemySprite!: Phaser.GameObjects.Sprite | Phaser.GameObjects.Text;
  private src!: QuestionSource;
  private ui!: HTMLElement;
  private panel!: HTMLElement;

  constructor() { super('Battle'); }

  init(data: BattleConfig) {
    this.cfg = data;
    this.enemy = ENEMIES[data.enemyId];
    this.enemyHp = this.enemy.hp;
    this.src = new QuestionSource(data.save, data.skills);
  }

  create() {
    const cam = this.cameras.main;
    cam.setBackgroundColor(this.cfg.boss ? '#160a1e' : '#0a1018');
    cam.fadeIn(350);
    music.play(this.cfg.boss ? 'boss' : 'battle');

    // enemy: bound sprite if the texture exists, else a big crisp emoji
    const ex = GAME_W / 2, ey = GAME_H * 0.30;
    if (this.enemy.spriteKey && this.textures.exists(this.enemy.spriteKey)) {
      this.enemySprite = this.add.sprite(ex, ey, this.enemy.spriteKey).setScale(3);
      const animKey = this.enemy.spriteKey + '-idle';
      if (this.anims.exists(animKey)) (this.enemySprite as Phaser.GameObjects.Sprite).play(animKey);
    } else {
      this.enemySprite = this.add.text(ex, ey, this.enemy.emoji, T.emoji(64)).setOrigin(0.5);
    }
    this.tweens.add({ targets: this.enemySprite, y: ey - 6, duration: 1100, yoyo: true, repeat: -1, ease: 'sine.inout' });

    this.add.text(ex, ey - 56, this.enemy.name, T.title(10)).setOrigin(0.5);

    // HTML overlay: HP panel + menu + question area
    this.ui = uiLayer('battle');
    this.panel = document.createElement('div');
    this.panel.className = 'battlepanel';
    this.ui.appendChild(this.panel);

    this.renderPanel();
    this.intro();
  }

  private hpRatio() { return Math.max(0, this.cfg.save.rpg.hp) / this.cfg.save.rpg.maxHp; }

  private renderPanel(menu = false) {
    const s = this.cfg.save;
    const potions = s.inv.potion;
    this.panel.innerHTML =
      `<div class="pstats">
        <div class="pbox">
          <div class="pname">${s.player.name || 'MINA'}</div>
          <div class="hpbar"><div class="hpfill" style="width:${this.hpRatio() * 100}%"></div></div>
          <div class="pnum">HP ${Math.max(0, s.rpg.hp)}/${s.rpg.maxHp} · Lv ${s.rpg.level}</div>
        </div>
        <div class="pbox">
          <div class="pname">${s.buddy.name || 'BYTE'}</div>
          <div class="pnum">cheering you on! ✦</div>
        </div>
        <div class="pbox ebox">
          <div class="pname">${this.enemy.name}</div>
          <div class="hpbar foe"><div class="hpfill" style="width:${(this.enemyHp / this.enemy.hp) * 100}%"></div></div>
        </div>
      </div>` +
      (menu ? `<div class="bmenu">
        <button class="bact" data-act="attack">⚔️ ATTACK</button>
        <button class="bact" data-act="magic">✨ MAGIC<span class="bsub">harder = stronger</span></button>
        <button class="bact" data-act="item" ${potions ? '' : 'disabled'}>🧪 POTION ×${potions}</button>
      </div>` : '');
    if (menu) {
      this.panel.querySelectorAll<HTMLButtonElement>('.bact').forEach(b => {
        b.onclick = () => { sfx.tone(880, 0.06); this.act(b.dataset.act as 'attack' | 'magic' | 'item'); };
      });
    }
  }

  private intro() {
    dialogue({
      layer: this.ui,
      speaker: this.enemy.name,
      lines: [pickLine(this.enemy.taunts)],
      onDone: () => this.menu()
    });
  }

  private menu() { this.renderPanel(true); }

  private act(kind: 'attack' | 'magic' | 'item') {
    if (kind === 'item') {
      const s = this.cfg.save;
      if (s.inv.potion > 0) {
        s.inv.potion--;
        s.rpg.hp = Math.min(s.rpg.maxHp, s.rpg.hp + 12);
        this.cfg.persist();
        sfx.chirp();
        this.renderPanel(true); // free action — straight back to the menu
      }
      return;
    }

    const boost = kind === 'magic' ? 1 : 0;
    const q = this.src.draw(boost);
    if (!q) { this.win(); return; } // bank exhausted — be kind, end the fight

    this.renderPanel(false);
    const qhost = document.createElement('div');
    qhost.className = 'bquestion';
    this.ui.appendChild(qhost);

    askQuestion(qhost, q, {
      mode: 'oneshot',
      onDone: ({ correct }) => {
        recordAttempt(this.cfg.save, q, correct, Date.now());
        this.cfg.persist();
        qhost.remove();
        if (correct) this.hit(kind === 'magic' ? 2 : 1);
        else this.enemyTurn();
      }
    });
  }

  private hit(mult: number) {
    const dmg = Math.ceil(this.enemy.hp / 6) * mult;
    this.enemyHp = Math.max(0, this.enemyHp - dmg);

    // damage number + flash + shake
    const dn = this.add.text(this.enemySprite.x + 24, this.enemySprite.y - 20, String(dmg), T.title(mult > 1 ? 16 : 12, '#ffd24a')).setOrigin(0.5);
    this.tweens.add({ targets: dn, y: dn.y - 24, alpha: 0, duration: 700, onComplete: () => dn.destroy() });
    this.tweens.add({ targets: this.enemySprite, alpha: 0.2, duration: 70, yoyo: true, repeat: 2 });
    this.cameras.main.shake(mult > 1 ? 220 : 130, 0.008 * mult);
    sfx.win();

    this.renderPanel(false);
    if (this.enemyHp <= 0) {
      this.time.delayedCall(450, () => this.win());
    } else {
      const line = pickLine(this.enemy.hurt);
      this.time.delayedCall(350, () =>
        dialogue({ layer: this.ui, speaker: this.enemy.name, lines: [line], onDone: () => this.menu() })
      );
    }
  }

  private enemyTurn() {
    // counterattack: lunge + shake + HP loss
    const s = this.cfg.save;
    this.tweens.add({ targets: this.enemySprite, y: '+=26', duration: 140, yoyo: true, ease: 'quad.in' });
    this.cameras.main.shake(180, 0.012);
    sfx.buzz();
    s.rpg.hp -= this.enemy.attack;
    this.cfg.persist();
    this.renderPanel(false);

    if (s.rpg.hp <= 0) {
      // BYTE revive — never a game over
      s.rpg.hp = s.rpg.maxHp;
      this.cfg.persist();
      this.time.delayedCall(420, () =>
        dialogue({
          layer: this.ui,
          speaker: s.buddy.name || 'BYTE',
          lines: ['✦ ' + (s.player.name || 'hero') + '! I’ve got you! ✦', 'Shake it off — you KNOW this stuff. Let’s go again!'],
          onDone: () => { this.renderPanel(true); }
        })
      );
    } else {
      this.time.delayedCall(420, () => this.menu());
    }
  }

  private win() {
    const s = this.cfg.save;
    clearLayer('battle');
    music.play('victory');

    // dissolve into code rain: glyph particles burst from the sprite
    const { x, y } = this.enemySprite;
    this.tweens.add({ targets: this.enemySprite, alpha: 0, scale: 0.1, angle: 25, duration: 900, ease: 'quad.in' });
    const glyphs = '01<>{}#*+';
    for (let i = 0; i < 26; i++) {
      const g = this.add.text(x, y, glyphs[(Math.random() * glyphs.length) | 0], T.glyph(12)).setOrigin(0.5);
      this.tweens.add({
        targets: g,
        x: x + (Math.random() * 160 - 80),
        y: y + (Math.random() * 140 - 40),
        alpha: 0,
        duration: 700 + Math.random() * 500,
        onComplete: () => g.destroy()
      });
    }
    sfx.fanfare();

    // XP + level-up
    s.rpg.xp += this.cfg.rewards.xp;
    const newLevel = 1 + Math.floor(Math.sqrt(s.rpg.xp / 40));
    const leveled = newLevel > s.rpg.level;
    if (leveled) {
      s.rpg.level = newLevel;
      s.rpg.maxHp = 24 + (newLevel - 1) * 4;
      s.rpg.hp = s.rpg.maxHp;
    }
    if (this.cfg.rewards.item) s.inv.potion += 1;
    this.cfg.persist();

    const ui = uiLayer('battle-end');
    const lines = [this.enemy.defeat, 'You won! +' + this.cfg.rewards.xp + ' XP!'];
    if (leveled) lines.push('⭐ LEVEL UP! You reached Level ' + s.rpg.level + '!');
    if (this.cfg.rewards.item) lines.push('You found a 🧪 potion!');
    this.time.delayedCall(1000, () =>
      dialogue({
        layer: ui,
        speaker: s.buddy.name || 'BYTE',
        lines,
        onDone: () => { clearLayer('battle-end'); this.cfg.onEnd(true); }
      })
    );
  }
}
