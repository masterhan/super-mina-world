// A world hub — the Dragon Quest part. Mina walks a tile map (tap a tile to
// path-walk there, arrows/swipe for steps). Doors open stations, the NPC talks,
// the chest pays out a potion, and the BOSS door only unlocks when the world's
// skills are mastered (90% over last 10 — checked honestly, shown kindly).

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../main';
import { WorldDef, StationDef } from '../data/worlds';
import { TILE_KEYS, WALKABLE } from '../core/textures';
import { SaveV2 } from '../core/types';
import { allMastered, isMastered, recordAttempt, skillReport } from '../core/mastery';
import { QuestionSource } from '../core/questions';
import { askQuestion } from '../ui/questionCard';
import { dialogue } from '../ui/dialogue';
import { uiLayer, clearLayer } from '../ui/overlay';
import { sfx } from '../core/sfx';
import { music } from '../core/music';
import { T } from '../ui/fonts';
import { MECHANICS } from '../mechanics/index';
import { buddyTint } from '../core/buddy';

const TILE = 16;

export interface HubConfig {
  world: WorldDef;
  save: SaveV2;
  persist: () => void;
}

export class HubScene extends Phaser.Scene {
  private cfg!: HubConfig;
  private grid: string[] = [];
  private cols = 0;
  private rows = 0;
  private player!: Phaser.GameObjects.Sprite;
  private chestSprite?: Phaser.GameObjects.Image;
  private bossGlow?: Phaser.GameObjects.Image;
  private px = 7;
  private py = 10;
  private walking = false;
  private queue: { x: number; y: number }[] = [];
  private busy = false; // an event (dialogue/station/battle) is running
  private ui!: HTMLElement;

  constructor() { super('Hub'); }

  init(data: HubConfig) {
    this.cfg = data;
    this.grid = data.world.grid;
    this.rows = this.grid.length;
    this.cols = this.grid[0].length;
  }

  private ws() {
    const s = this.cfg.save;
    s.worlds[this.cfg.world.id] = s.worlds[this.cfg.world.id] || { stations: {} };
    return s.worlds[this.cfg.world.id];
  }

  create() {
    const w = this.cfg.world;
    this.cameras.main.fadeIn(300);
    this.cameras.main.setBackgroundColor('#0a1018');
    music.play(w.music);

    // ---- tile layer, drawn once ----
    for (let y = 0; y < this.rows; y++) {
      for (let x = 0; x < this.cols; x++) {
        const ch = this.grid[y][x];
        let key = TILE_KEYS[ch] || 'tile-grass';
        if (ch === 'C' && this.ws().chest) key = 'tile-chest-open';
        const img = this.add.image(x * TILE + 8, y * TILE + 8, key);
        if (ch === 'C') this.chestSprite = img;
        if (ch === 'B') {
          this.bossGlow = img;
          this.tweens.add({ targets: img, alpha: 0.65, duration: 900, yoyo: true, repeat: -1 });
        }
      }
    }

    // door labels (station emoji floating over each door)
    for (const [ch, st] of Object.entries(w.stations)) {
      const pos = this.findTile(ch);
      if (pos) {
        const cleared = this.ws().stations[ch];
        const e = this.add.text(pos.x * TILE + 8, pos.y * TILE - 4, cleared ? '⭐' : st.emoji, T.emoji(10)).setOrigin(0.5).setDepth(5);
        this.tweens.add({ targets: e, y: e.y - 3, duration: 1200, yoyo: true, repeat: -1, ease: 'sine.inout' });
      }
    }

    // NPC sprite
    const npcPos = this.findTile('N');
    if (npcPos) this.add.image(npcPos.x * TILE + 8, npcPos.y * TILE + 6, 'npc-hood').setDepth(5);

    // ---- Mina ----
    const spawn = this.findTile('E') || { x: 7, y: 10 };
    this.px = spawn.x; this.py = Math.max(1, spawn.y - 1);
    this.player = this.add.sprite(this.px * TILE + 8, this.py * TILE + 6, 'mina-down-0').setDepth(10);

    for (const dir of ['down', 'up'] as const) {
      const key = 'mina-walk-' + dir;
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: [{ key: `mina-${dir}-0` }, { key: `mina-${dir}-1` }],
          frameRate: 6,
          repeat: -1
        });
      }
    }

    // BYTE trails behind, in her chosen color
    const byte = this.add.sprite(this.player.x - 12, this.player.y - 8, 'byte').setDepth(9).setTint(buddyTint(this.cfg.save.buddy.color));
    this.tweens.add({ targets: byte, y: byte.y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'sine.inout' });
    this.events.on('update', () => {
      byte.x += (this.player.x - 12 - byte.x) * 0.06;
      byte.y += (this.player.y - 10 - byte.y) * 0.06;
    });

    // ---- camera ----
    this.cameras.main.setBounds(0, 0, this.cols * TILE, this.rows * TILE);
    this.cameras.main.startFollow(this.player, true, 0.12, 0.12);
    // FILL the screen (JRPG feel): zoom so the world covers the whole canvas
    // and the camera-follow does the exploring.
    const zoom = Math.max(GAME_W / (this.cols * TILE), GAME_H / (this.rows * TILE));
    this.cameras.main.setZoom(zoom);

    // ---- HUD overlay ----
    this.ui = uiLayer('hub');
    this.renderHud();

    // ---- input ----
    const tapTile = (tx: number, ty: number) => {
      if (this.busy) return;
      const path = this.findPath(this.px, this.py, tx, ty);
      if (path) { this.queue = path; this.stepNext(); sfx.blip(); }
    };
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const wp = this.cameras.main.getWorldPoint(p.x, p.y);
      tapTile(Math.floor(wp.x / TILE), Math.floor(wp.y / TILE));
    });
    // deterministic seam for the Playwright play-through (harmless in prod)
    (window as unknown as Record<string, unknown>).__smw = {
      tapTile,
      pos: () => ({ x: this.px, y: this.py }),
      busy: () => this.busy
    };
    this.input.keyboard?.on('keydown', (e: KeyboardEvent) => {
      if (this.busy || this.walking) return;
      const d: Record<string, [number, number]> = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
      const v = d[e.key];
      if (v && this.walkable(this.px + v[0], this.py + v[1])) {
        this.queue = [{ x: this.px + v[0], y: this.py + v[1] }];
        this.stepNext();
      }
    });

    // first visit: Cipher's intro
    if (!this.ws().visited) {
      this.ws().visited = true;
      this.cfg.persist();
      this.runDialogue('CIPHER', w.intro);
    }
  }

  private renderHud() {
    const s = this.cfg.save;
    const w = this.cfg.world;
    const mastered = w.skills.filter(k => isMastered(s, k)).length;
    const hud = this.ui.querySelector('.hubhud') || (() => {
      const el = document.createElement('div');
      el.className = 'hubhud';
      this.ui.appendChild(el);
      return el;
    })();
    hud.innerHTML =
      `<button class="hudback">🗺️</button>
       <div class="hudright">${w.emoji} 📖${mastered}/${w.skills.length} 🧪${s.inv.potion} Lv${s.rpg.level}</div>`;
    (hud.querySelector('.hudback') as HTMLButtonElement).onclick = () => this.exit();
  }

  private findTile(ch: string): { x: number; y: number } | null {
    for (let y = 0; y < this.rows; y++) {
      const x = this.grid[y].indexOf(ch);
      if (x >= 0) return { x, y };
    }
    return null;
  }

  private walkable(x: number, y: number) {
    if (x < 0 || y < 0 || x >= this.cols || y >= this.rows) return false;
    return WALKABLE.has(this.grid[y][x]);
  }

  // event tiles (doors/NPC/chest/boss/exit) block pathing UNLESS they're the
  // destination — so walking across the room never hijacks her into a door.
  private passable(x: number, y: number, tx: number, ty: number) {
    if (!this.walkable(x, y)) return false;
    const ch = this.grid[y][x];
    if ('123BCNE'.includes(ch)) return x === tx && y === ty;
    return true;
  }

  private findPath(sx: number, sy: number, tx: number, ty: number) {
    if (!this.walkable(tx, ty) || (sx === tx && sy === ty)) return null;
    const key = (x: number, y: number) => y * this.cols + x;
    const prev = new Map<number, number>();
    const seen = new Set([key(sx, sy)]);
    const q: [number, number][] = [[sx, sy]];
    while (q.length) {
      const [cx, cy] = q.shift()!;
      if (cx === tx && cy === ty) {
        const path: { x: number; y: number }[] = [];
        let k = key(tx, ty);
        while (k !== key(sx, sy)) {
          path.unshift({ x: k % this.cols, y: Math.floor(k / this.cols) });
          k = prev.get(k)!;
        }
        return path;
      }
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]] as const) {
        const nx = cx + dx, ny = cy + dy;
        if (this.passable(nx, ny, tx, ty) && !seen.has(key(nx, ny))) {
          seen.add(key(nx, ny));
          prev.set(key(nx, ny), key(cx, cy));
          q.push([nx, ny]);
        }
      }
    }
    return null;
  }

  private stepNext() {
    if (this.walking || this.busy) return;
    const next = this.queue.shift();
    if (!next) {
      this.player.anims.stop();
      this.player.setTexture('mina-down-0');
      return;
    }
    this.walking = true;
    const dx = next.x - this.px, dy = next.y - this.py;
    if (dy > 0) { this.player.play('mina-walk-down', true); this.player.setFlipX(false); }
    else if (dy < 0) { this.player.play('mina-walk-up', true); this.player.setFlipX(false); }
    else { this.player.play('mina-walk-down', true); this.player.setFlipX(dx < 0); }
    this.px = next.x; this.py = next.y;
    this.tweens.add({
      targets: this.player,
      x: this.px * TILE + 8,
      y: this.py * TILE + 6,
      duration: 190,
      onComplete: () => {
        this.walking = false;
        const ch = this.grid[this.py][this.px];
        // events fire only when this tile was the DESTINATION of the walk
        if ('123BCNE'.includes(ch) && this.queue.length === 0) this.onTile(ch);
        else this.stepNext();
      }
    });
  }

  // ---- events ----

  private onTile(ch: string) {
    const w = this.cfg.world;
    if (ch === '1' || ch === '2' || ch === '3') return this.station(ch, w.stations[ch]);
    if (ch === 'N') return this.npc();
    if (ch === 'C') return this.chest();
    if (ch === 'B') return this.bossDoor();
    if (ch === 'E') return this.exit();
  }

  private runDialogue(speaker: string, lines: string[], after?: () => void) {
    this.busy = true;
    dialogue({
      layer: this.ui, speaker, lines,
      onDone: () => { this.busy = false; after?.(); }
    });
  }

  private npc() {
    this.runDialogue(this.cfg.world.npc.name, this.cfg.world.npc.lines);
  }

  private chest() {
    const ws = this.ws();
    if (ws.chest) return;
    ws.chest = true;
    this.cfg.save.inv.potion += 1;
    this.cfg.persist();
    this.chestSprite?.setTexture('tile-chest-open');
    sfx.fanfare();
    this.renderHud();
    this.runDialogue(this.cfg.save.buddy.name || 'BYTE', ['✦ A treasure chest! ✦', 'You found a 🧪 potion — it heals you in battles!']);
  }

  // A station: a hands-on mechanic (kind 'mech') or question rounds in teach
  // mode (kind 'quiz'). Both feed mastery and end in the same celebration.
  private setHudVisible(on: boolean) {
    const hud = this.ui.querySelector<HTMLElement>('.hubhud');
    if (hud) hud.style.display = on ? '' : 'none';
  }

  private station(ch: '1' | '2' | '3', st: StationDef) {
    this.busy = true;
    const s = this.cfg.save;
    const ui = uiLayer('station');
    const total = st.rounds || 6;
    this.setHudVisible(false);

    // gentle escape hatch — a stuck kid can always step back out (no credit, no shame)
    const leave = document.createElement('button');
    leave.className = 'stationleave';
    leave.textContent = '✕';
    leave.onclick = () => {
      sfx.blip();
      clearLayer('station');
      this.busy = false;
      this.setHudVisible(true);
      this.renderHud();
    };
    ui.appendChild(leave);

    const finish = (flawless: number, played: number) => {
      clearLayer('station');
      const ws = this.ws();
      const first = !ws.stations[ch];
      ws.stations[ch] = true;
      this.cfg.persist();
      sfx.fanfare();
      this.setHudVisible(true);
      this.renderHud();
      this.busy = false;
      const msg = flawless === played
        ? ['⭐ PERFECT! ' + flawless + ' out of ' + played + '!', 'The ' + st.label + ' is glowing again!']
        : ['You lit up the ' + st.label + '!', flawless + ' first-try wins out of ' + played + '. Misses come back later — that’s how we master them!'];
      this.runDialogue(this.cfg.save.buddy.name || 'BYTE', msg, () => {
        if (first) this.scene.restart(this.cfg); // re-render door stars
      });
    };

    if (st.kind === 'mech' && st.mech && MECHANICS[st.mech]) {
      MECHANICS[st.mech]({
        host: ui,
        save: s,
        persist: this.cfg.persist,
        rounds: total,
        onDone: ({ rounds, flawless }) => finish(flawless, rounds)
      });
      return;
    }

    // quiz station (teach mode — kind, no losing)
    const src = new QuestionSource(s, st.skills || []);
    let i = 0, flawless = 0;
    const header = document.createElement('div');
    header.className = 'stationhead';
    ui.appendChild(header);
    const host = document.createElement('div');
    host.className = 'stationbody';
    ui.appendChild(host);

    const next = () => {
      header.innerHTML = `<div class="hudtitle">${st.emoji} ${st.label}</div><div class="dots">${'●'.repeat(i)}${'○'.repeat(total - i)}</div>`;
      if (i >= total) return finish(flawless, total);
      const q = src.draw();
      if (!q) return finish(flawless, i);
      askQuestion(host, q, {
        mode: 'teach',
        onDone: ({ wrongTaps }) => {
          recordAttempt(s, q, wrongTaps === 0, Date.now());
          this.cfg.persist();
          if (wrongTaps === 0) flawless++;
          i++;
          next();
        }
      });
    };

    next();
  }

  private bossDoor() {
    const w = this.cfg.world;
    const s = this.cfg.save;
    if (allMastered(s, w.skills)) {
      this.runDialogue('CIPHER', ['The door feels your mastery.', 'It opens. Go get ’em, ' + (s.player.name || 'hero') + '.'], () => this.startBoss());
    } else {
      // honest gate, kind words: show exactly what's left
      const left = w.skills.filter(k => !isMastered(s, k));
      const reports = left.map(k => {
        const r = skillReport(s, k);
        const st = Object.values(w.stations).find(x => x.skills?.includes(k));
        return (st ? st.label : k) + (r.attempts === 0 ? ' — not visited yet' : ' — almost! keep practicing');
      });
      this.runDialogue('CIPHER', [
        'This door only opens for TRUE mastery.',
        'Still to master: ' + reports.join(' · '),
        'Visit those stations — when you really know it, the door will feel it.'
      ]);
    }
  }

  private startBoss() {
    const w = this.cfg.world;
    this.busy = true;
    clearLayer('hub');
    this.scene.start('Battle', {
      enemyId: w.bossId,
      skills: w.skills,
      rewards: { xp: 80, item: 'potion' },
      boss: true,
      save: this.cfg.save,
      persist: this.cfg.persist,
      onEnd: (won: boolean) => {
        if (won) {
          const ws = this.ws();
          ws.boss = true;
          this.cfg.save.stars[w.id] = true;
          if (!this.cfg.save.badges.includes(w.badge.index)) this.cfg.save.badges.push(w.badge.index);
          if (!this.cfg.save.collection.includes(w.id + '-relic')) this.cfg.save.collection.push(w.id + '-relic');
          this.cfg.persist();
        }
        this.scene.start('Overworld', { save: this.cfg.save, persist: this.cfg.persist, justWon: won ? w.id : undefined });
      }
    });
  }

  private exit() {
    clearLayer('hub');
    music.play('overworld');
    this.scene.start('Overworld', { save: this.cfg.save, persist: this.cfg.persist });
  }
}
