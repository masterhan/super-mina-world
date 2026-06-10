// Shared data shapes. Questions are the atom of the learning engine:
// every question belongs to a named skill and a difficulty tier.

export interface Question {
  id: string;          // stable id (template id + params, or bank id)
  skill: string;       // e.g. 'math.mult.facts'
  tier: 1 | 2 | 3;     // 1 = ATTACK, 2-3 = MAGIC / boss phase
  q: string;
  options: [string, string, string, string]; // options[0] is correct; shuffle at render
  why: string;         // one-line kid-readable explanation, shown right or wrong
  art?: string;        // key into pixel-art grids (continent/state silhouettes)
  flag?: string;       // emoji flag shown above the question
  facts?: Record<string, string>; // per-option teaching lines (wrong tap → fact about THAT place)
}

export interface Attempt {
  qid: string;
  skill: string;
  tier: 1 | 2 | 3;
  correct: boolean;
  at: number; // epoch ms
}

// One kid's saved game (per profile).
export interface SaveV2 {
  v: 2;
  player: { name: string };
  buddy: { form: string; eyes: string; color: string; marks: string; name: string };
  badges: number[];
  stars: Record<string, boolean>;
  introDone: boolean;
  choices: Record<string, string>;
  rpg: { xp: number; level: number; hp: number; maxHp: number };
  inv: { potion: number; gems: Record<string, number> };
  worlds: Record<string, { stations: Record<string, boolean>; chest?: boolean; boss?: boolean; visited?: boolean }>;
  mastery: {
    attempts: Attempt[];                 // rolling log, capped
    tierBySkill: Record<string, 1 | 2 | 3>; // current adaptive tier per skill
    missQueue: string[];                 // question ids to re-ask (this session + next session start)
    streakBySkill: Record<string, number>; // signed: +n correct streak, -n wrong streak
  };
  collection: string[]; // collection-book item ids, in earn order
  minutes: Record<string, number>; // play minutes per YYYY-MM-DD (Grown-Ups screen)
  citadel: { defeated: number; done: boolean; remix: boolean }; // finale boss-rush progress
}

export const DEFAULT_BUDDY = { form: 'puff', eyes: 'sparkle', color: 'cyan', marks: 'none', name: 'BYTE' };

export function freshSave(name = ''): SaveV2 {
  return {
    v: 2,
    player: { name },
    buddy: { ...DEFAULT_BUDDY },
    badges: [],
    stars: {},
    introDone: false,
    choices: {},
    rpg: { xp: 0, level: 1, hp: 24, maxHp: 24 },
    inv: { potion: 1, gems: {} },
    worlds: {},
    mastery: { attempts: [], tierBySkill: {}, missQueue: [], streakBySkill: {} },
    collection: [],
    minutes: {},
    citadel: { defeated: 0, done: false, remix: false }
  };
}
