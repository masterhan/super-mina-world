// QuestionSource — the single place battles & stations draw questions from.
// Order of duty: (1) missed questions come back first, (2) otherwise draw at the
// kid's current adaptive tier for one of the requested skills, (3) never repeat
// a question within the same encounter. Math skills generate from templates
// (always a fresh variant); curated skills draw from banks.

import { Question, SaveV2 } from './types';
import { currentTier } from './mastery';
import { generate, rng, MATH_SKILLS } from '../data/math-templates';

let BANKS: Question[] = [];
const byId = new Map<string, Question>();

// banks register once at boot (keeps data files lazy-loadable later)
export function registerBank(qs: Question[]) {
  BANKS = BANKS.concat(qs);
  for (const q of qs) byId.set(q.id, q);
}

export function bankBySkill(skill: string, tier?: 1 | 2 | 3): Question[] {
  return BANKS.filter(q => q.skill === skill && (tier === undefined || q.tier === tier));
}

export class QuestionSource {
  private served = new Set<string>();
  private r = rng((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0);

  constructor(private save: SaveV2, private skills: string[]) {}

  // tierBoost: +1 for MAGIC / boss phases (capped at 3)
  draw(tierBoost = 0): Question | null {
    // 1) misses first (only ones belonging to this encounter's skills)
    for (const qid of this.save.mastery.missQueue) {
      if (this.served.has(qid)) continue;
      const q = byId.get(qid);
      if (q && this.skills.includes(q.skill)) {
        this.served.add(q.id);
        return q;
      }
    }

    // 2) fresh draw at adaptive tier (Remix Mode after beating the Glitch King:
    //    everything starts at tier 2 minimum — full strength, as promised)
    const skill = this.skills[Math.floor(this.r() * this.skills.length)];
    const floor = this.save.citadel?.remix ? 2 : 1;
    const tier = Math.min(3, Math.max(floor, currentTier(this.save, skill)) + tierBoost) as 1 | 2 | 3;

    if (MATH_SKILLS.includes(skill)) {
      const q = generate(skill, tier, this.r); // templates: every draw is a fresh variant
      this.served.add(q.id);
      return q;
    }

    const exact = bankBySkill(skill, tier).filter(q => !this.served.has(q.id));
    const any = bankBySkill(skill).filter(q => !this.served.has(q.id));
    const pool = exact.length ? exact : any;
    if (!pool.length) return null;
    const q = pool[Math.floor(this.r() * pool.length)];
    this.served.add(q.id);
    return q;
  }
}
