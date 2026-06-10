// The live session: ONE save object + persist fn, set at boot, shared by every
// scene and the minutes tracker — so nothing ever works from a stale copy.

import { SaveV2 } from './types';

interface Session { save: SaveV2; persist: () => void }
let current: Session | null = null;

export function setSession(s: Session) { current = s; }
export function session(): Session | null { return current; }
