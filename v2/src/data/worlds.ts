// World definitions — each world is one core school subject: a walkable hub
// with 3 station doors (hands-on games), an NPC, a chest, and a boss door that
// only opens when the world's skills are MASTERED (90% over the last 10 — the
// honest gate). Grids are strings; legend chars map to tiles + events.
//
// Tile chars: . grass  P path  T tree  W water  # wall  1-3 station doors
//             B boss door  C chest  N npc  E exit (back to overworld)

export interface StationDef {
  label: string;
  emoji: string;
  kind: 'quiz' | 'mech';   // quiz = question rounds; mech = hands-on mini-game id
  mech?: string;            // mechanic key when kind = 'mech'
  skills?: string[];        // skills quizzed when kind = 'quiz'
  rounds?: number;
}

export interface WorldDef {
  id: string;
  name: string;
  subject: string;
  emoji: string;
  mapX: number; mapY: number;   // % position on the overworld
  music: string;
  skills: string[];             // mastery gate for the boss door
  bossId: string;
  badge: { index: number; name: string; icon: string };
  minionId: string;             // wandering minion battle in the hub
  grid: string[];
  stations: Record<'1' | '2' | '3', StationDef>;
  npc: { name: string; lines: string[] };
  intro: string[];              // Cipher's first-visit lines
}

// A standard 14x12 hub shell — worlds share the bone structure, themes differ.
// (Shared on purpose: one proven layout, no 8 bespoke navigation puzzles.)
const SHELL = [
  'TTTTTT#B#TTTTT',
  'T.....#.#....T',
  'T.....P......T',
  'T.1PPPP...2..T',
  'T..P..P.PPP..T',
  'W..P..PPP....T',
  'WW.P....P..C.T',
  'T..PPP..P....T',
  'T....P..PPP..T',
  'T.3..P..N....T',
  'T....PPPP....T',
  'TTTTTT#E#TTTTT'
];

export const WORLDS: Record<string, WorldDef> = {
  mathrix: {
    id: 'mathrix', name: 'MATHRIX', subject: 'Math', emoji: '🔢',
    mapX: 18, mapY: 34, music: 'world_a',
    skills: ['math.mult.facts', 'math.div.facts', 'math.fractions'],
    bossId: 'countTron', minionId: 'glitchSlime',
    badge: { index: 2, name: 'NUMBERS', icon: '🔢' },
    grid: SHELL,
    stations: {
      '1': { label: 'Times-Table Cave', emoji: '✖️', kind: 'quiz', skills: ['math.mult.facts', 'math.div.facts'], rounds: 8 },
      '2': { label: 'Pizza Splitter', emoji: '🍕', kind: 'mech', mech: 'fractions', skills: ['math.fractions'], rounds: 6 },
      '3': { label: 'Number Forge', emoji: '🔨', kind: 'mech', mech: 'numberline', skills: ['math.placevalue'], rounds: 5 }
    },
    npc: { name: 'REX', lines: ['Pfft. COUNT-TRON says no kid knows 7×8.', '...you DO? Then go show that rust-bucket.'] },
    intro: ['MATHRIX — the number realm.', 'COUNT-TRON scrambled every times table!', 'Master the caves, then knock on his big door.']
  },

  lexicon: {
    id: 'lexicon', name: 'LEXICON', subject: 'Reading', emoji: '📚',
    mapX: 50, mapY: 34, music: 'world_b',
    skills: ['ela.wordparts', 'ela.synonyms', 'ela.grammar'],
    bossId: 'scrambler', minionId: 'staticBat',
    badge: { index: 3, name: 'WORDS', icon: '📚' },
    grid: SHELL,
    stations: {
      '1': { label: 'Word Forge', emoji: '🔤', kind: 'mech', mech: 'wordforge', skills: ['ela.wordparts'], rounds: 5 },
      '2': { label: 'Synonym Springs', emoji: '🌊', kind: 'quiz', skills: ['ela.synonyms'], rounds: 7 },
      '3': { label: 'Grammar Grove', emoji: '🌳', kind: 'quiz', skills: ['ela.grammar'], rounds: 7 }
    },
    npc: { name: 'ORACLE', lines: ['The Scrambler mixed up evrey wrod in my books.', 'Olny a raeder like you can fix tihs.'] },
    intro: ['LEXICON — the realm of words.', 'THE SCRAMBLER shuffled every letter!', 'Forge words, find their twins, fix the grammar — then face the imp.']
  },

  biodome: {
    id: 'biodome', name: 'BIODOME', subject: 'Life Science', emoji: '🦋',
    mapX: 82, mapY: 34, music: 'world_a',
    skills: ['bio.foodchains', 'bio.lifecycles', 'bio.habitats'],
    bossId: 'chompworm', minionId: 'glitchSlime',
    badge: { index: 4, name: 'LIFE', icon: '🦋' },
    grid: SHELL,
    stations: {
      '1': { label: 'Food Chain Falls', emoji: '🦊', kind: 'mech', mech: 'foodchain', skills: ['bio.foodchains'], rounds: 5 },
      '2': { label: 'Life Cycle Garden', emoji: '🐛', kind: 'mech', mech: 'lifecycle', skills: ['bio.lifecycles'], rounds: 5 },
      '3': { label: 'Habitat Haven', emoji: '🏔️', kind: 'quiz', skills: ['bio.habitats'], rounds: 7 }
    },
    npc: { name: 'REX', lines: ['CHOMPWORM ate the food chain. ALL of it.', 'Now the rabbits hunt the foxes. It’s weird out there.'] },
    intro: ['BIODOME — the living realm.', 'CHOMPWORM chewed the food chains out of order!', 'Re-link the chains, regrow the cycles, rehome the animals.']
  },

  stormbyte: {
    id: 'stormbyte', name: 'STORMBYTE', subject: 'Earth & Weather', emoji: '⛈️',
    mapX: 18, mapY: 56, music: 'world_b',
    skills: ['earth.watercycle', 'earth.weather', 'earth.rocks'],
    bossId: 'staticus', minionId: 'staticBat',
    badge: { index: 5, name: 'STORM', icon: '⛈️' },
    grid: SHELL,
    stations: {
      '1': { label: 'Water Cycle Run', emoji: '💧', kind: 'mech', mech: 'watercycle', skills: ['earth.watercycle'], rounds: 4 },
      '2': { label: 'Forecast Forge', emoji: '🌪️', kind: 'quiz', skills: ['earth.weather'], rounds: 7 },
      '3': { label: 'Rock Tumbler', emoji: '🪨', kind: 'quiz', skills: ['earth.rocks'], rounds: 7 }
    },
    npc: { name: 'ORACLE', lines: ['STATICUS made the rain fall UP.', 'The clouds are very confused. So are the fish.'] },
    intro: ['STORMBYTE — the weather realm.', 'STATICUS the static dragon broke the water cycle!', 'Ride the droplet, read the skies, tumble the rocks.']
  },

  orbital: {
    id: 'orbital', name: 'ORBITAL', subject: 'Space', emoji: '🪐',
    mapX: 50, mapY: 56, music: 'world_a',
    skills: ['space.solarsystem', 'space.moon', 'space.daynight'],
    bossId: 'eclipsor', minionId: 'bitWisp',
    badge: { index: 6, name: 'SPACE', icon: '🪐' },
    grid: SHELL,
    stations: {
      '1': { label: 'Planet Parade', emoji: '🪐', kind: 'mech', mech: 'planets', skills: ['space.solarsystem', 'space.moon'], rounds: 5 },
      '2': { label: 'Moon Phaser', emoji: '🌙', kind: 'quiz', skills: ['space.moon'], rounds: 7 },
      '3': { label: 'Spin & Tilt', emoji: '🌍', kind: 'quiz', skills: ['space.daynight'], rounds: 7 }
    },
    npc: { name: 'REX', lines: ['ECLIPSOR blocked the sun. AGAIN.', 'My tomatoes are NOT happy about it.'] },
    intro: ['ORBITAL — the space realm.', 'ECLIPSOR shoved the planets out of order!', 'March the planets, phase the moon, spin the Earth true.']
  },

  matterworks: {
    id: 'matterworks', name: 'MATTERWORKS', subject: 'Physical Science', emoji: '⚗️',
    mapX: 82, mapY: 56, music: 'world_b',
    skills: ['phys.matter', 'phys.circuits', 'phys.forces'],
    bossId: 'glitchergoo', minionId: 'glitchSlime',
    badge: { index: 7, name: 'MATTER', icon: '⚗️' },
    grid: SHELL,
    stations: {
      '1': { label: 'Particle Chamber', emoji: '🧪', kind: 'mech', mech: 'particles', skills: ['phys.matter'], rounds: 5 },
      '2': { label: 'Circuit Works', emoji: '💡', kind: 'mech', mech: 'circuits', skills: ['phys.circuits'], rounds: 5 },
      '3': { label: 'Push, Pull & Poles', emoji: '🧲', kind: 'mech', mech: 'forces', skills: ['phys.forces'], rounds: 6 }
    },
    npc: { name: 'ORACLE', lines: ['GLITCHERGOO can’t decide if it’s solid, liquid or gas.', 'Honestly? Same. But it’s breaking the lab.'] },
    intro: ['MATTERWORKS — the matter realm.', 'GLITCHERGOO flickers between solid, liquid and gas!', 'Heat the particles, close the circuits, feel the forces.']
  },

  atlas: {
    id: 'atlas', name: 'ATLAS ISLES', subject: 'Geography', emoji: '🗺️',
    mapX: 32, mapY: 78, music: 'world_a',
    skills: ['geo.classic', 'geo.continents', 'geo.usa'],
    bossId: 'foggle', minionId: 'bitWisp',
    badge: { index: 8, name: 'ATLAS', icon: '🗺️' },
    grid: SHELL,
    stations: {
      '1': { label: 'Continent Cove', emoji: '🌍', kind: 'quiz', skills: ['geo.continents', 'geo.classic'], rounds: 8 },
      '2': { label: 'Texas Trail', emoji: '⭐', kind: 'quiz', skills: ['geo.usa'], rounds: 7 },
      '3': { label: 'World Wharf', emoji: '⛵', kind: 'quiz', skills: ['geo.world', 'geo.classic'], rounds: 7 }
    },
    npc: { name: 'REX', lines: ['FOGGLE hid every map on the islands.', 'I’ve been lost in my own backyard for a WEEK.'] },
    intro: ['ATLAS ISLES — the realm of maps.', 'FOGGLE rolled fog over every land and flag!', 'Name the lands and the fog burns away.']
  },

  mainframe: {
    id: 'mainframe', name: 'MAINFRAME', subject: 'Coding & Logic', emoji: '💾',
    mapX: 68, mapY: 78, music: 'world_b',
    skills: ['code.sequences', 'code.loops', 'code.debugging'],
    bossId: 'theBug', minionId: 'staticBat',
    badge: { index: 9, name: 'CODE', icon: '💾' },
    grid: SHELL,
    stations: {
      '1': { label: 'Webwright Workshop', emoji: '🌐', kind: 'mech', mech: 'webbuilder', skills: ['code.sequences'], rounds: 2 },
      '2': { label: 'Loop Lagoon', emoji: '🔁', kind: 'mech', mech: 'sequencer', skills: ['code.sequences', 'code.loops'], rounds: 4 },
      '3': { label: 'Bug Hunt', emoji: '🔎', kind: 'quiz', skills: ['code.debugging'], rounds: 7 }
    },
    npc: { name: 'CIPHER', lines: ['THE BUG crawled into the great programs.', 'Step 2 now happens before step 1. Chaos.'] },
    intro: ['MAINFRAME — the realm of code.', 'THE BUG broke every program’s steps!', 'Order the steps, spot the loops, squash the bug.']
  }
};

export const WORLD_ORDER = ['mathrix', 'lexicon', 'biodome', 'stormbyte', 'orbital', 'matterworks', 'atlas', 'mainframe'] as const;
