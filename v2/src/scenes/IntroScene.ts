// First-run intro: wake → name → meet Cipher → build BYTE → into the world.
// NOTE: this is the compact v2 opening; the full v1 story beats (summon
// animation, relight-the-world commands, Spark badge) port on top of this
// flow during the parity pass. Returning players never see this — saves with
// introDone skip straight to the Overworld.

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { SaveV2 } from '../core/types';
import { dialogue } from '../ui/dialogue';
import { uiLayer, clearLayer } from '../ui/overlay';
import { sfx } from '../core/sfx';
import { T } from '../ui/fonts';
import { buddyTint } from '../core/buddy';

const BUDDY_COLORS: Record<string, string> = {
  cyan: '#3df2ff', violet: '#9b3bff', magenta: '#ff3da6', gold: '#ffd24a'
};

export interface IntroConfig {
  save: SaveV2;
  persist: () => void;
}

export class IntroScene extends Phaser.Scene {
  private cfg!: IntroConfig;
  private ui!: HTMLElement;

  constructor() { super('Intro'); }

  init(data: IntroConfig) { this.cfg = data; }

  create() {
    this.cameras.main.setBackgroundColor('#06080f');
    this.ui = uiLayer('intro');

    // matrix drips on the canvas while she wakes the world
    const glyphs = '01<>{}#*+';
    this.time.addEvent({
      delay: 220, loop: true, callback: () => {
        const t = this.add.text(Math.random() * GAME_W, -8, glyphs[(Math.random() * glyphs.length) | 0], T.glyph(9));
        this.tweens.add({ targets: t, y: GAME_H + 10, alpha: 0.1, duration: 2600, onComplete: () => t.destroy() });
      }
    });

    const wake = document.createElement('div');
    wake.className = 'wakescreen';
    wake.innerHTML = '<div class="wakedot"></div><div class="waketext">tap to wake the world</div>';
    wake.onclick = () => {
      sfx.unlock(); sfx.chirp();
      wake.remove();
      this.nameEntry();
    };
    this.ui.appendChild(wake);
  }

  private nameEntry() {
    const s = this.cfg.save;
    const p = document.createElement('div');
    p.className = 'panel intropanel';
    p.innerHTML = `
      <div class="ptitle">Hello,</div>
      <input id="pname" maxlength="12" placeholder="your name" autocomplete="off">
      <button id="pgo" class="bigbtn">▶ THAT’S ME</button>`;
    this.ui.appendChild(p);
    const input = p.querySelector('#pname') as HTMLInputElement;
    input.value = s.player.name || '';
    (p.querySelector('#pgo') as HTMLButtonElement).onclick = () => {
      const name = input.value.trim().toUpperCase() || 'HERO';
      s.player.name = name;
      this.cfg.persist();
      sfx.win();
      p.remove();
      this.meetCipher();
    };
  }

  private meetCipher() {
    const s = this.cfg.save;
    dialogue({
      layer: this.ui,
      speaker: 'CIPHER',
      lines: [
        s.player.name + '... at last.',
        'I’m Cipher. The GLITCH KING has scrambled the eight knowledge realms.',
        'Math. Words. The stars themselves. All glitched.',
        'You’re going to take them back — by OUT-SMARTING him.',
        'But first... every hero needs a buddy.'
      ],
      onDone: () => this.buddyCreator()
    });
  }

  private buddyCreator() {
    const s = this.cfg.save;
    const p = document.createElement('div');
    p.className = 'panel intropanel creatorpanel';
    const colors = Object.keys(BUDDY_COLORS);
    const FORMS: Record<string, string> = { puff: '🐣', bolt: '⚡', fin: '🐟', star: '⭐', orb: '🔮' };
    const EYES: Record<string, string> = { sparkle: '✨', round: '👀', happy: '😊', sleepy: '😌' };
    const MARKS: Record<string, string> = { none: '◻️', spots: '🔴', stripes: '〰️', glow: '🌟' };
    const row = (label: string, key: 'form' | 'eyes' | 'marks', opts: Record<string, string>) =>
      `<div class="rowlabel">${label}</div>
       <div class="pickrow" data-k="${key}">${Object.entries(opts).map(([v, e]) =>
        `<button class="pickopt${s.buddy[key] === v ? ' sel' : ''}" data-v="${v}">${e}</button>`).join('')}</div>`;
    p.innerHTML = `
      <div class="ptitle">Build your buddy!</div>
      <div class="buddyprev" id="bprev">●</div>
      ${row('shape', 'form', FORMS)}
      ${row('eyes', 'eyes', EYES)}
      ${row('pattern', 'marks', MARKS)}
      <div class="rowlabel">color</div>
      <div class="pickrow" id="bcolors">${colors.map(c => `<button data-c="${c}" style="background:${BUDDY_COLORS[c]}"></button>`).join('')}</div>
      <div class="rowlabel">name</div>
      <input id="bname" maxlength="10" autocomplete="off">
      <button id="bgo" class="bigbtn">✦ SUMMON ✦</button>`;
    this.ui.appendChild(p);

    const prev = p.querySelector('#bprev') as HTMLElement;
    const nameIn = p.querySelector('#bname') as HTMLInputElement;
    nameIn.value = s.buddy.name || 'BYTE';
    const apply = () => {
      const col = BUDDY_COLORS[s.buddy.color] || BUDDY_COLORS.cyan;
      prev.style.color = col;
      prev.style.textShadow = '0 0 18px ' + col;
      prev.textContent = FORMS[s.buddy.form] || '●';
    };
    apply();
    p.querySelectorAll<HTMLElement>('.pickrow[data-k]').forEach(rowEl => {
      const key = rowEl.dataset.k as 'form' | 'eyes' | 'marks';
      rowEl.querySelectorAll<HTMLButtonElement>('.pickopt').forEach(b => {
        b.onclick = () => {
          s.buddy[key] = b.dataset.v!;
          rowEl.querySelectorAll('.pickopt').forEach(x => x.classList.remove('sel'));
          b.classList.add('sel');
          sfx.blip();
          apply();
        };
      });
    });
    p.querySelectorAll<HTMLButtonElement>('#bcolors button').forEach(b => {
      b.onclick = () => { s.buddy.color = b.dataset.c!; sfx.blip(); apply(); };
    });
    (p.querySelector('#bgo') as HTMLButtonElement).onclick = () => {
      s.buddy.name = nameIn.value.trim().toUpperCase() || 'BYTE';
      this.cfg.persist();
      p.remove();
      this.summon();
    };
  }

  private summon() {
    const s = this.cfg.save;
    sfx.fanfare();
    // sparkle burst on canvas
    for (let i = 0; i < 22; i++) {
      const t = this.add.text(GAME_W / 2, GAME_H / 2, '✦', T.glyph(12, '#aef6ff')).setOrigin(0.5);
      this.tweens.add({
        targets: t,
        x: GAME_W / 2 + (Math.random() * 180 - 90),
        y: GAME_H / 2 + (Math.random() * 180 - 90),
        alpha: 0,
        duration: 800 + Math.random() * 500,
        onComplete: () => t.destroy()
      });
    }
    const byte = this.add.sprite(GAME_W / 2, GAME_H / 2, 'byte').setScale(0.2).setAlpha(0).setTint(buddyTint(s.buddy.color));
    this.tweens.add({ targets: byte, scale: 4, alpha: 1, duration: 900, ease: 'back.out' });

    this.time.delayedCall(1100, () => {
      dialogue({
        layer: this.ui,
        speaker: s.buddy.name,
        lines: [
          '✦ ' + s.buddy.name + ' ONLINE! ✦',
          'Hi ' + s.player.name + '! Let’s go un-scramble some worlds!',
          'Tap a realm on the map — I’ll be right beside you the whole way.'
        ],
        onDone: () => {
          s.introDone = true;
          this.cfg.persist();
          clearLayer('intro');
          this.scene.start('Overworld', { save: s, persist: this.cfg.persist });
        }
      });
    });
  }
}
