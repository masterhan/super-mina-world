import Phaser from 'phaser';
import './styles/game.css';
import './styles/mechanics.css';
import { BootScene } from './scenes/BootScene';
import { IntroScene } from './scenes/IntroScene';
import { OverworldScene } from './scenes/OverworldScene';
import { HubScene } from './scenes/HubScene';
import { BattleScene } from './scenes/BattleScene';
import { CitadelScene } from './scenes/CitadelScene';
import { session } from './core/session';

// Portrait-first: kids hold phones upright. 270x480 internal pixels,
// scaled up crisp (pixelArt) to fill the screen — authentic 16-bit AND fast.
export const GAME_W = 270;
export const GAME_H = 480;

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  pixelArt: true,
  roundPixels: true,
  backgroundColor: '#06080f',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H
  },
  scene: [BootScene, IntroScene, OverworldScene, HubScene, BattleScene, CitadelScene]
});

// play-minutes tracker for the Grown-Ups screen: +1 to today's count each
// minute the tab is actually visible. Uses the LIVE session save (no races).
setInterval(() => {
  if (document.hidden) return;
  const s = session();
  if (!s) return;
  try {
    const day = new Date().toISOString().slice(0, 10);
    s.save.minutes[day] = (s.save.minutes[day] || 0) + 1;
    s.persist();
  } catch { /* never let bookkeeping crash play */ }
}, 60000);
