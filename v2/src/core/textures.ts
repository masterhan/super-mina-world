// Generated pixel textures — the game is fully playable before any art pack
// lands. Every key here can later be re-bound to real CC0 sprite-sheet art
// (Ninja Adventure / Kenney) in BootScene without touching the scenes.
// Drawn at 16x16 (tiles) / 12x16 (walker frames), rendered crisp by pixelArt mode.

import Phaser from 'phaser';

type Px = [number, number, number, number, number]; // x, y, w, h, colorIndex shortcut

function paint(scene: Phaser.Scene, key: string, w: number, h: number, draw: (g: Phaser.GameObjects.Graphics) => void) {
  if (scene.textures.exists(key)) return;
  const g = scene.add.graphics();
  draw(g);
  g.generateTexture(key, w, h);
  g.destroy();
}

const rect = (g: Phaser.GameObjects.Graphics, color: number, x: number, y: number, w: number, h: number) => {
  g.fillStyle(color, 1); g.fillRect(x, y, w, h);
};

export function makeTextures(scene: Phaser.Scene) {
  // ---- tiles (16x16) ----
  paint(scene, 'tile-grass', 16, 16, g => {
    rect(g, 0x1d7a33, 0, 0, 16, 16);
    rect(g, 0x2a9445, 2, 3, 1, 1); rect(g, 0x2a9445, 9, 7, 1, 1);
    rect(g, 0x2a9445, 13, 12, 1, 1); rect(g, 0x176328, 5, 11, 1, 1);
  });
  paint(scene, 'tile-path', 16, 16, g => {
    rect(g, 0xb89b6a, 0, 0, 16, 16);
    rect(g, 0xa3875a, 3, 4, 2, 1); rect(g, 0xcbb083, 10, 9, 2, 1);
    rect(g, 0xa3875a, 7, 13, 1, 1);
  });
  paint(scene, 'tile-tree', 16, 16, g => {
    rect(g, 0x1d7a33, 0, 0, 16, 16);
    rect(g, 0x0c3f1a, 2, 1, 12, 10);
    rect(g, 0x14552a, 3, 2, 10, 8);
    rect(g, 0x2a9445, 5, 3, 3, 2); // light spot
    rect(g, 0x5b3a1e, 7, 11, 3, 4); // trunk
  });
  paint(scene, 'tile-water', 16, 16, g => {
    rect(g, 0x103a5c, 0, 0, 16, 16);
    rect(g, 0x1b5a8a, 2, 3, 4, 1); rect(g, 0x1b5a8a, 9, 8, 4, 1);
    rect(g, 0x2a7ab8, 5, 12, 3, 1);
  });
  paint(scene, 'tile-wall', 16, 16, g => {
    rect(g, 0x3a4154, 0, 0, 16, 16);
    rect(g, 0x2a3040, 0, 7, 16, 1); rect(g, 0x2a3040, 0, 15, 16, 1);
    rect(g, 0x2a3040, 7, 0, 1, 7); rect(g, 0x2a3040, 3, 8, 1, 7); rect(g, 0x2a3040, 11, 8, 1, 7);
    rect(g, 0x4a5268, 1, 1, 5, 5);
  });
  paint(scene, 'tile-door', 16, 16, g => {
    rect(g, 0xb89b6a, 0, 0, 16, 16);
    rect(g, 0x2a3040, 2, 1, 12, 14);
    rect(g, 0x5b3a1e, 4, 3, 8, 12);
    rect(g, 0x8a5c30, 5, 4, 6, 10);
    rect(g, 0xffd24a, 9, 9, 1, 2); // handle
  });
  paint(scene, 'tile-bossdoor', 16, 16, g => {
    rect(g, 0x2a3040, 0, 0, 16, 16);
    rect(g, 0x160a1e, 2, 2, 12, 13);
    rect(g, 0x6a2a8a, 4, 4, 8, 11);
    rect(g, 0x9b3bff, 6, 6, 4, 4); // glow sigil
    rect(g, 0xffd24a, 7, 11, 2, 2);
  });
  paint(scene, 'tile-chest', 16, 16, g => {
    rect(g, 0x1d7a33, 0, 0, 16, 16);
    rect(g, 0x5b3a1e, 3, 6, 10, 7);
    rect(g, 0x8a5c30, 4, 7, 8, 5);
    rect(g, 0xffd24a, 7, 8, 2, 3); // latch
    rect(g, 0x3a2412, 3, 9, 10, 1);
  });
  paint(scene, 'tile-chest-open', 16, 16, g => {
    rect(g, 0x1d7a33, 0, 0, 16, 16);
    rect(g, 0x3a2412, 3, 5, 10, 3);
    rect(g, 0x5b3a1e, 3, 8, 10, 5);
    rect(g, 0x101418, 4, 9, 8, 3);
  });
  paint(scene, 'tile-exit', 16, 16, g => {
    rect(g, 0xb89b6a, 0, 0, 16, 16);
    rect(g, 0x3df2ff, 5, 3, 6, 10);
    rect(g, 0xaef6ff, 7, 5, 2, 6); // shimmer
  });

  // ---- Mina walker (12x16, 4 frames: down x2, up x2; sides = flipX of down) ----
  const mina = (g: Phaser.GameObjects.Graphics, legPhase: number, back: boolean) => {
    rect(g, 0x4a2c12, 2, 0, 8, 4);                 // hair
    if (!back) {
      rect(g, 0xf0c8a0, 3, 3, 6, 4);               // face
      rect(g, 0x101418, 4, 4, 1, 1); rect(g, 0x101418, 7, 4, 1, 1); // eyes
    } else {
      rect(g, 0x4a2c12, 3, 3, 6, 4);               // back of hair
    }
    rect(g, 0x9b3bff, 2, 7, 8, 5);                 // dress (BYTE-violet)
    rect(g, 0x3df2ff, 2, 7, 8, 1);                 // glow scarf
    rect(g, 0xf0c8a0, 1, 8, 1, 2); rect(g, 0xf0c8a0, 10, 8, 1, 2); // arms
    if (legPhase === 0) { rect(g, 0xf0c8a0, 3, 12, 2, 3); rect(g, 0xf0c8a0, 7, 12, 2, 3); }
    else { rect(g, 0xf0c8a0, 2, 12, 2, 3); rect(g, 0xf0c8a0, 8, 12, 2, 3); }
  };
  paint(scene, 'mina-down-0', 12, 16, g => mina(g, 0, false));
  paint(scene, 'mina-down-1', 12, 16, g => mina(g, 1, false));
  paint(scene, 'mina-up-0', 12, 16, g => mina(g, 0, true));
  paint(scene, 'mina-up-1', 12, 16, g => mina(g, 1, true));

  // ---- NPC (12x16, hooded figure) ----
  paint(scene, 'npc-hood', 12, 16, g => {
    rect(g, 0x202a3a, 2, 0, 8, 6);
    rect(g, 0x101720, 3, 2, 6, 3);
    rect(g, 0x3df2ff, 4, 3, 4, 1);  // visor glow
    rect(g, 0x202a3a, 1, 6, 10, 9); // cloak
    rect(g, 0x2c3a52, 5, 7, 2, 7);  // seam
  });

  // ---- BYTE buddy (10x10 bobbing blob) ----
  paint(scene, 'byte', 10, 10, g => {
    rect(g, 0x3df2ff, 2, 1, 6, 8);
    rect(g, 0xaef6ff, 3, 2, 4, 3);
    rect(g, 0x101418, 3, 4, 1, 1); rect(g, 0x101418, 6, 4, 1, 1);
    rect(g, 0x3df2ff, 1, 3, 1, 3); rect(g, 0x3df2ff, 8, 3, 1, 3);
  });
}

export const TILE_KEYS: Record<string, string> = {
  '.': 'tile-grass',
  'P': 'tile-path',
  'T': 'tile-tree',
  'W': 'tile-water',
  '#': 'tile-wall',
  '1': 'tile-door',
  '2': 'tile-door',
  '3': 'tile-door',
  'B': 'tile-bossdoor',
  'C': 'tile-chest',
  'N': 'tile-grass', // npc stands on grass; sprite drawn separately
  'E': 'tile-exit'
};

export const WALKABLE = new Set(['.', 'P', '1', '2', '3', 'B', 'C', 'N', 'E']);
