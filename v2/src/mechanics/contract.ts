// The hands-on station contract. A mechanic is direct manipulation —
// tap/drag/build/watch — NOT multiple choice. Each module exports one
// `run(ctx)` and owns its DOM inside ctx.host (overlay layer). Rounds ramp.
// Kind rules: wrong moves animate WHY they're wrong, retries are unlimited,
// finishing always celebrates. Mastery credit flows through recordAttempt
// with synthetic per-skill "questions" (one per round, correct = first try).

import { SaveV2 } from '../core/types';

export interface MechContext {
  host: HTMLElement;          // cleared overlay layer to render into
  save: SaveV2;
  persist: () => void;
  rounds: number;             // how many rounds to play
  onDone: (result: { rounds: number; flawless: number }) => void;
}

export type MechRun = (ctx: MechContext) => void;
