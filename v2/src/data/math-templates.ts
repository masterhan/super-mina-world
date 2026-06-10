// Math = parameterized templates: one template generates hundreds of distinct
// items, so retries are always a VARIANT (never the same numbers — no
// answer-memorizing). Distractors are plausible near-misses, not random noise.

import { Question } from '../core/types';

// small seeded RNG so tests are reproducible; gameplay seeds from the clock
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(r: () => number, arr: T[]) => arr[Math.floor(r() * arr.length)];
const int = (r: () => number, lo: number, hi: number) => lo + Math.floor(r() * (hi - lo + 1));

// 4 unique numeric options, correct first
function numOptions(correct: number, wrongs: number[]): [string, string, string, string] {
  const seen = new Set([correct]);
  const out: number[] = [];
  for (const w of wrongs) {
    if (w >= 0 && !seen.has(w)) { seen.add(w); out.push(w); }
    if (out.length === 3) break;
  }
  let bump = 1;
  while (out.length < 3) { // backstop if distractors collided
    for (const c of [correct + bump, correct - bump, correct + bump + 10]) {
      if (c >= 0 && !seen.has(c) && out.length < 3) { seen.add(c); out.push(c); }
    }
    bump++;
  }
  return [String(correct), String(out[0]), String(out[1]), String(out[2])];
}

export interface Template {
  id: string;
  skill: string;
  tier: 1 | 2 | 3;
  gen(r: () => number): Question;
}

let n = 0;
const qid = (tpl: string, key: string) => `${tpl}:${key}:${n++}`;

export const MATH_TEMPLATES: Template[] = [
  // ── multiplication facts ──────────────────────────────────────────────
  {
    id: 'mult.easy', skill: 'math.mult.facts', tier: 1,
    gen(r) {
      const a = int(r, 2, 5), b = int(r, 2, 9);
      return {
        id: qid('mult.easy', `${a}x${b}`), skill: 'math.mult.facts', tier: 1,
        q: `${a} × ${b} = ?`,
        options: numOptions(a * b, [a * b + a, a * b - a, a * (b + 1) + 1]),
        why: `${a} × ${b} means ${a} groups of ${b} — count by ${b}s ${a} times to get ${a * b}.`
      };
    }
  },
  {
    id: 'mult.hard', skill: 'math.mult.facts', tier: 2,
    gen(r) {
      const a = int(r, 6, 9), b = int(r, 6, 9);
      return {
        id: qid('mult.hard', `${a}x${b}`), skill: 'math.mult.facts', tier: 2,
        q: `${a} × ${b} = ?`,
        options: numOptions(a * b, [a * b + a, a * b - b, (a + 1) * b]),
        why: `${a} × ${b} = ${a * b}. Trick: ${a} × ${b} is ${a} × 10 = ${a * 10}, minus ${a} × ${10 - b} = ${a * (10 - b)}.`
      };
    }
  },
  {
    id: 'mult.missing', skill: 'math.mult.facts', tier: 3,
    gen(r) {
      const a = int(r, 3, 9), b = int(r, 3, 9);
      return {
        id: qid('mult.missing', `${a}x${b}`), skill: 'math.mult.facts', tier: 3,
        q: `${a} × ? = ${a * b}`,
        options: numOptions(b, [b + 1, b - 1, a]),
        why: `Think backwards: ${a * b} ÷ ${a} = ${b}. Multiplication and division undo each other.`
      };
    }
  },

  // ── division facts ────────────────────────────────────────────────────
  {
    id: 'div.facts', skill: 'math.div.facts', tier: 1,
    gen(r) {
      const b = int(r, 2, 9), q = int(r, 2, 9);
      return {
        id: qid('div.facts', `${b * q}/${b}`), skill: 'math.div.facts', tier: 1,
        q: `${b * q} ÷ ${b} = ?`,
        options: numOptions(q, [q + 1, q - 1, b]),
        why: `${b * q} ÷ ${b} asks: how many ${b}s fit in ${b * q}? Answer: ${q}, because ${b} × ${q} = ${b * q}.`
      };
    }
  },
  {
    id: 'div.share', skill: 'math.div.facts', tier: 2,
    gen(r) {
      const kids = int(r, 3, 8), each = int(r, 3, 9);
      const total = kids * each;
      const thing = pick(r, ['stickers', 'marbles', 'berries', 'gems', 'cards']);
      return {
        id: qid('div.share', `${total}/${kids}`), skill: 'math.div.facts', tier: 2,
        q: `${total} ${thing} are shared equally by ${kids} kids. How many does each kid get?`,
        options: numOptions(each, [each + 1, each - 1, total - kids]),
        why: `Share ${total} into ${kids} equal groups: ${total} ÷ ${kids} = ${each} each.`
      };
    }
  },

  // ── fractions ─────────────────────────────────────────────────────────
  {
    id: 'frac.identify', skill: 'math.fractions', tier: 1,
    gen(r) {
      const den = pick(r, [2, 3, 4, 6, 8]);
      const num = int(r, 1, den - 1);
      return {
        id: qid('frac.identify', `${num}/${den}`), skill: 'math.fractions', tier: 1,
        q: `A pizza is cut into ${den} equal slices. You eat ${num}. What fraction did you eat?`,
        options: [`${num}/${den}`, `${den}/${num}`, `${num}/${den + 1}`, `${num + 1}/${den}`] as [string, string, string, string],
        why: `The bottom number is the total slices (${den}); the top is how many you took (${num}).`
      };
    }
  },
  {
    id: 'frac.equiv', skill: 'math.fractions', tier: 2,
    gen(r) {
      const base = pick(r, [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4]]);
      const k = int(r, 2, 4);
      const [a, b] = base;
      return {
        id: qid('frac.equiv', `${a}/${b}x${k}`), skill: 'math.fractions', tier: 2,
        q: `Which fraction is the SAME amount as ${a}/${b}?`,
        options: [`${a * k}/${b * k}`, `${a + k}/${b + k}`, `${a}/${b * k}`, `${a * k}/${b}`] as [string, string, string, string],
        why: `Multiply top AND bottom by ${k}: ${a}/${b} = ${a * k}/${b * k}. Same pizza, smaller slices!`
      };
    }
  },
  {
    id: 'frac.compare', skill: 'math.fractions', tier: 3,
    gen(r) {
      const den1 = pick(r, [3, 4, 5, 6, 8]);
      let den2 = pick(r, [3, 4, 5, 6, 8]);
      if (den2 === den1) den2 = den1 === 8 ? 4 : den1 + 1;
      const bigger = den1 < den2 ? `1/${den1}` : `1/${den2}`;
      const smaller = den1 < den2 ? `1/${den2}` : `1/${den1}`;
      return {
        id: qid('frac.compare', `${den1}v${den2}`), skill: 'math.fractions', tier: 3,
        q: `Which is BIGGER: 1/${den1} or 1/${den2}?`,
        options: [bigger, smaller, 'They are equal', 'Cannot tell'] as [string, string, string, string],
        why: `Fewer slices = bigger slices. Cutting into ${Math.min(den1, den2)} pieces makes each piece bigger than cutting into ${Math.max(den1, den2)}.`
      };
    }
  },

  // ── place value & rounding ────────────────────────────────────────────
  {
    id: 'pv.digit', skill: 'math.placevalue', tier: 1,
    gen(r) {
      const num = int(r, 102, 989);
      const places = ['ones', 'tens', 'hundreds'] as const;
      const pi = int(r, 0, 2);
      const digit = Math.floor(num / Math.pow(10, pi)) % 10;
      const others = String(num).split('').map(Number).filter(d => d !== digit);
      return {
        id: qid('pv.digit', `${num}@${pi}`), skill: 'math.placevalue', tier: 1,
        q: `In the number ${num}, which digit is in the ${places[pi]} place?`,
        options: numOptions(digit, [others[0] ?? digit + 1, others[1] ?? digit + 2, digit + 3]),
        why: `Reading ${num} right to left: ones, tens, hundreds. The ${places[pi]} digit is ${digit}.`
      };
    }
  },
  {
    id: 'pv.round', skill: 'math.placevalue', tier: 2,
    gen(r) {
      const num = int(r, 11, 94);
      const rounded = Math.round(num / 10) * 10;
      return {
        id: qid('pv.round', `${num}`), skill: 'math.placevalue', tier: 2,
        q: `Round ${num} to the nearest ten.`,
        options: numOptions(rounded, [rounded + 10, rounded - 10, num]),
        why: `Look at the ones digit (${num % 10}): ${num % 10 >= 5 ? '5 or more rounds UP' : 'less than 5 rounds DOWN'}, so ${num} → ${rounded}.`
      };
    }
  },

  // ── multi-step word problems (boss tier) ─────────────────────────────
  {
    id: 'word.twostep', skill: 'math.wordproblems', tier: 3,
    gen(r) {
      const boxes = int(r, 3, 6), per = int(r, 4, 8), eaten = int(r, 2, 9);
      const total = boxes * per - eaten;
      const thing = pick(r, ['cookies', 'crayons', 'acorns', 'coins', 'apples']);
      return {
        id: qid('word.twostep', `${boxes}x${per}-${eaten}`), skill: 'math.wordproblems', tier: 3,
        q: `There are ${boxes} boxes with ${per} ${thing} each. ${eaten} get used up. How many ${thing} are left?`,
        options: numOptions(total, [boxes * per, total + eaten, boxes * per + eaten]),
        why: `Two steps: ${boxes} × ${per} = ${boxes * per} ${thing}, then take away ${eaten} → ${total}.`
      };
    }
  }
];

// Draw a question for a skill at (or below) the kid's current tier.
export function generate(skill: string, tier: 1 | 2 | 3, r: () => number): Question {
  const pool = MATH_TEMPLATES.filter(t => t.skill === skill && t.tier === tier);
  const fallback = MATH_TEMPLATES.filter(t => t.skill === skill);
  const tpl = pool.length ? pick(r, pool) : pick(r, fallback);
  return tpl.gen(r);
}

export const MATH_SKILLS = [...new Set(MATH_TEMPLATES.map(t => t.skill))];
