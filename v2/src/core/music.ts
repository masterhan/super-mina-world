// Music player — looping CC0 chiptune tracks (Ninja Adventure + Juhani Junkala,
// see CREDITS.md), kept deliberately simple: one HTMLAudio element, one track at
// a time, low volume under the synth SFX. Starts only after a user tap (iOS rule)
// and respects the global sound toggle.

import { sfx } from './sfx';

const TRACKS: Record<string, string> = {
  // filled in as assets land in public/assets/music/
  overworld: 'assets/music/overworld.ogg',
  battle: 'assets/music/battle.ogg',
  boss: 'assets/music/boss.ogg',
  victory: 'assets/music/victory.ogg',
  world_a: 'assets/music/world_a.ogg',
  world_b: 'assets/music/world_b.ogg'
};

let el: HTMLAudioElement | null = null;
let current: string | null = null;
let unlocked = false;
let wanted: string | null = null;

function play(id: string) {
  const src = TRACKS[id];
  if (!src) return;
  if (!el) {
    el = new Audio();
    el.loop = true;
    el.volume = 0.35;
  }
  if (current === id && !el.paused) return;
  current = id;
  el.src = src;
  void el.play().catch(() => { /* not unlocked yet — retried on next gesture */ });
}

// first real tap unlocks audio playback on iOS; replay whatever was requested
if (typeof window !== 'undefined') {
  const unlock = () => {
    unlocked = true;
    if (wanted && sfx.on) play(wanted);
  };
  for (const ev of ['touchend', 'pointerup', 'keydown']) {
    window.addEventListener(ev, unlock, { passive: true, capture: true });
  }
}

export const music = {
  play(id: string) {
    wanted = id;
    if (!sfx.on) return;
    if (unlocked) play(id);
  },
  stop() {
    wanted = null;
    current = null;
    el?.pause();
  },
  // called by the sound toggle
  setEnabled(on: boolean) {
    if (!on) el?.pause();
    else if (wanted) play(wanted);
  }
};
