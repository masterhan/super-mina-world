// The learning engine — the Alpha School bar, in ~100 lines:
//   mastery  = ~90% over the last 10 attempts on a skill (gates boss doors)
//   adaptive = 3 silent tiers per skill: 3-in-a-row right steps up, 2-in-a-row wrong steps down
//   misses   = wrong questions re-queue this session and at next session start
// No shaming, no announcements — the game just quietly meets the kid where they are.

import { Attempt, Question, SaveV2 } from './types';

const WINDOW = 10;          // attempts considered for mastery
const NEED = 9;             // of WINDOW that must be correct (90%)
const LOG_CAP = 2000;       // rolling attempt log cap (~weeks of play, small in storage)
const UP_STREAK = 3;
const DOWN_STREAK = 2;

export function recordAttempt(save: SaveV2, q: Question, correct: boolean, at: number) {
  const m = save.mastery;
  m.attempts.push({ qid: q.id, skill: q.skill, tier: q.tier, correct, at });
  if (m.attempts.length > LOG_CAP) m.attempts.splice(0, m.attempts.length - LOG_CAP);

  // signed streak: positive = consecutive right, negative = consecutive wrong
  const prev = m.streakBySkill[q.skill] || 0;
  m.streakBySkill[q.skill] = correct ? Math.max(1, prev + 1) : Math.min(-1, prev - 1);

  // silent tier movement
  const tier = m.tierBySkill[q.skill] || 1;
  const streak = m.streakBySkill[q.skill];
  if (streak >= UP_STREAK && tier < 3) {
    m.tierBySkill[q.skill] = (tier + 1) as 1 | 2 | 3;
    m.streakBySkill[q.skill] = 0;
  } else if (streak <= -DOWN_STREAK && tier > 1) {
    m.tierBySkill[q.skill] = (tier - 1) as 1 | 2 | 3;
    m.streakBySkill[q.skill] = 0;
  }

  // misses come back
  if (!correct) {
    if (!m.missQueue.includes(q.id)) m.missQueue.push(q.id);
  } else {
    m.missQueue = m.missQueue.filter(id => id !== q.id);
  }
}

export function skillAttempts(save: SaveV2, skill: string): Attempt[] {
  return save.mastery.attempts.filter(a => a.skill === skill);
}

export function isMastered(save: SaveV2, skill: string): boolean {
  const recent = skillAttempts(save, skill).slice(-WINDOW);
  if (recent.length < WINDOW) return false;
  return recent.filter(a => a.correct).length >= NEED;
}

// Boss door check: every required skill mastered.
export function allMastered(save: SaveV2, skills: string[]): boolean {
  return skills.every(s => isMastered(save, s));
}

export function currentTier(save: SaveV2, skill: string): 1 | 2 | 3 {
  return save.mastery.tierBySkill[skill] || 1;
}

// Progress for the Grown-Ups screen: accuracy + state per skill.
export function skillReport(save: SaveV2, skill: string) {
  const all = skillAttempts(save, skill);
  const recent = all.slice(-WINDOW);
  const correct = recent.filter(a => a.correct).length;
  return {
    skill,
    attempts: all.length,
    recentAccuracy: recent.length ? correct / recent.length : 0,
    state: all.length === 0 ? 'not-started' : isMastered(save, skill) ? 'mastered' : 'in-progress'
  } as const;
}
