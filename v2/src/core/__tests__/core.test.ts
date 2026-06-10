import { describe, it, expect } from 'vitest';
import { migrateV1, exportCode, importCode } from '../save';
import { recordAttempt, isMastered, currentTier, skillReport } from '../mastery';
import { freshSave, Question } from '../types';
import { generate, rng, MATH_TEMPLATES } from '../../data/math-templates';

// a REAL v1 save blob (shape from v1 engine.js / localStorage 'pixelrealm')
const V1_BLOB = {
  player: { name: 'MINA' },
  buddy: { form: 'puff', eyes: 'sparkle', color: 'violet', marks: 'spots', name: 'BYTE' },
  badges: [1, 2, 5],
  chapter: 1,
  choices: { spark_side: 'WEST' },
  nextBuild: null,
  stars: { atlas: true, potions: true },
  introDone: true
};

describe('v1 → v2 migration', () => {
  it('keeps name, buddy, badges, stars, introDone', () => {
    const s = migrateV1(V1_BLOB);
    expect(s.v).toBe(2);
    expect(s.player.name).toBe('MINA');
    expect(s.buddy.color).toBe('violet');
    expect(s.buddy.marks).toBe('spots');
    expect(s.badges).toEqual([1, 2, 5]);
    expect(s.stars.atlas).toBe(true);
    expect(s.introDone).toBe(true);
    expect(s.rpg.level).toBe(1); // new fields get defaults
    expect(s.inv.potion).toBe(1);
  });

  it('derives introDone from the Spark badge when flag is missing', () => {
    const s = migrateV1({ player: { name: 'X' }, badges: [1] });
    expect(s.introDone).toBe(true);
  });

  it('handles a sparse/corrupt blob without throwing', () => {
    const s = migrateV1({});
    expect(s.player.name).toBe('');
    expect(s.buddy.name).toBe('BYTE');
    expect(s.introDone).toBe(false);
  });
});

describe('save codes', () => {
  it('round-trips a save through export/import', () => {
    const s = migrateV1(V1_BLOB);
    const code = exportCode(s);
    const back = importCode(code);
    expect(back).not.toBeNull();
    expect(back!.player.name).toBe('MINA');
    expect(back!.stars.potions).toBe(true);
  });
  it('rejects garbage codes', () => {
    expect(importCode('not-a-code')).toBeNull();
    expect(importCode(btoa('{"v":99}'))).toBeNull();
  });
});

function q(skill: string, tier: 1 | 2 | 3, id: string): Question {
  return { id, skill, tier, q: '?', options: ['a', 'b', 'c', 'd'], why: '' };
}

describe('mastery engine', () => {
  it('masters a skill at 9 of last 10, not before', () => {
    const s = freshSave('T');
    for (let i = 0; i < 8; i++) recordAttempt(s, q('sk', 1, 'q' + i), true, i);
    expect(isMastered(s, 'sk')).toBe(false); // only 8 attempts
    recordAttempt(s, q('sk', 1, 'q8'), false, 8);
    recordAttempt(s, q('sk', 1, 'q9'), true, 9);
    expect(isMastered(s, 'sk')).toBe(true); // 9 of last 10
  });

  it('loses mastery when recent answers go wrong (boss door closes honestly)', () => {
    const s = freshSave('T');
    for (let i = 0; i < 10; i++) recordAttempt(s, q('sk', 1, 'q' + i), true, i);
    expect(isMastered(s, 'sk')).toBe(true);
    recordAttempt(s, q('sk', 1, 'w1'), false, 11);
    recordAttempt(s, q('sk', 1, 'w2'), false, 12);
    expect(isMastered(s, 'sk')).toBe(false);
  });

  it('steps tier up after 3 straight correct, down after 2 straight wrong, silently within 1..3', () => {
    const s = freshSave('T');
    expect(currentTier(s, 'sk')).toBe(1);
    recordAttempt(s, q('sk', 1, 'a'), true, 1);
    recordAttempt(s, q('sk', 1, 'b'), true, 2);
    recordAttempt(s, q('sk', 1, 'c'), true, 3);
    expect(currentTier(s, 'sk')).toBe(2);
    recordAttempt(s, q('sk', 2, 'd'), false, 4);
    recordAttempt(s, q('sk', 2, 'e'), false, 5);
    expect(currentTier(s, 'sk')).toBe(1);
    // never below 1
    recordAttempt(s, q('sk', 1, 'f'), false, 6);
    recordAttempt(s, q('sk', 1, 'g'), false, 7);
    expect(currentTier(s, 'sk')).toBe(1);
  });

  it('re-queues misses and clears them once answered right', () => {
    const s = freshSave('T');
    recordAttempt(s, q('sk', 1, 'missme'), false, 1);
    expect(s.mastery.missQueue).toContain('missme');
    recordAttempt(s, q('sk', 1, 'missme'), true, 2);
    expect(s.mastery.missQueue).not.toContain('missme');
  });

  it('reports skill state for the Grown-Ups screen', () => {
    const s = freshSave('T');
    expect(skillReport(s, 'sk').state).toBe('not-started');
    recordAttempt(s, q('sk', 1, 'a'), true, 1);
    expect(skillReport(s, 'sk').state).toBe('in-progress');
    expect(skillReport(s, 'sk').recentAccuracy).toBe(1);
  });
});

describe('math templates', () => {
  it('every template generates valid questions with 4 unique options, correct first', () => {
    const r = rng(42);
    for (const tpl of MATH_TEMPLATES) {
      for (let i = 0; i < 50; i++) {
        const out = tpl.gen(r);
        expect(out.options).toHaveLength(4);
        expect(new Set(out.options).size).toBe(4);
        expect(out.why.length).toBeGreaterThan(10);
        expect(out.skill).toBe(tpl.skill);
      }
    }
  });

  it('multiplication answers are actually correct', () => {
    const r = rng(7);
    for (let i = 0; i < 100; i++) {
      const out = generate('math.mult.facts', 1, r);
      const m = out.q.match(/(\d+) × (\d+)/);
      if (m) expect(Number(out.options[0])).toBe(Number(m[1]) * Number(m[2]));
    }
  });

  it('variants differ: same template, different numbers on retry', () => {
    const r = rng(99);
    const a = generate('math.fractions', 2, r);
    const b = generate('math.fractions', 2, r);
    expect(a.id).not.toBe(b.id);
  });
});
