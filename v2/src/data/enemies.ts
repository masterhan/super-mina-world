// Glitch monsters. Friendly-spooky, never scary — they taunt, they fizzle,
// they dissolve back into code when out-smarted. spriteKey binds to a texture
// loaded in BootScene from the CC0 Ninja Adventure monster sheets; emoji is the
// always-works fallback until each sprite is bound.

export interface EnemyDef {
  id: string;
  name: string;
  hp: number;          // ATTACK deals ~hp/6, MAGIC double — a fight is 4-8 questions
  attack: number;      // party HP lost when a question is missed
  spriteKey?: string;  // Phaser texture key (bound after asset inspection)
  emoji: string;       // fallback + map icon
  taunts: string[];    // battle start + idle sass
  hurt: string[];      // when a hit lands on them
  defeat: string;      // final line as they dissolve
}

export const ENEMIES: Record<string, EnemyDef> = {
  // ---- minions (random world encounters / quest battles) ----
  glitchSlime: {
    id: 'glitchSlime', name: 'GLITCH SLIME', hp: 18, attack: 4, emoji: '🟢',
    taunts: ['Blub blub! Bet you can’t out-think ME!', 'My slime ate your homework!'],
    hurt: ['Blorp!! That stung!', 'Hey!! No fair being SMART!'],
    defeat: 'Nooo... dissolving... back... into... cooode...'
  },
  staticBat: {
    id: 'staticBat', name: 'STATIC BAT', hp: 18, attack: 4, emoji: '🦇',
    taunts: ['Screee! Your brain is full of fuzz!', 'I scramble EVERY answer!'],
    hurt: ['Eep! My static is slipping!', 'Too bright! Too SMART!'],
    defeat: 'My signal... is... breaking... uppp...'
  },
  bitWisp: {
    id: 'bitWisp', name: 'BIT WISP', hp: 24, attack: 5, emoji: '👻',
    taunts: ['Oooooo I am made of forgotten answers!', 'You’ll never remember!'],
    hurt: ['Oh no, you DO remember!', 'My bits! My beautiful bits!'],
    defeat: 'Remembered... at last... goodbye...'
  },

  // ---- world bosses ----
  countTron: {
    id: 'countTron', name: 'COUNT-TRON', hp: 36, attack: 5, emoji: '🤖',
    taunts: ['I am the FINAL EXAM! Beep boop!', 'My abacus arms know EVERY number you don’t!'],
    hurt: ['ERROR! ERROR! She CAN multiply!', 'Recalculating... recalculating...!'],
    defeat: 'Does... not... compute... you are... too... smart...'
  },
  scrambler: {
    id: 'scrambler', name: 'THE SCRAMBLER', hp: 36, attack: 5, emoji: '🌀',
    taunts: ['Wrods aer mnie now! Hahaha!', 'I’ll mix up every letter you love!'],
    hurt: ['My letters! They’re going back in order!', 'S-t-o-p s-p-e-l-l-i-n-g!'],
    defeat: 'Y-o-u... w-i-n... fair... and... square...'
  },
  chompworm: {
    id: 'chompworm', name: 'CHOMPWORM', hp: 36, attack: 5, emoji: '🐛',
    taunts: ['I chomped the food chain ALL out of order!', 'Munch munch! Plants eat lions now!'],
    hurt: ['Ouch! The chain is linking back up!', 'My beautiful mess!'],
    defeat: 'Back... to... the... garden... I... go...'
  },
  staticus: {
    id: 'staticus', name: 'STATICUS', hp: 36, attack: 5, emoji: '🐉',
    taunts: ['I am the storm that never makes sense!', 'My clouds rain UP! Deal with it!'],
    hurt: ['My thunder is fizzling!', 'The forecast says... OW!'],
    defeat: 'The skies... clear... at... last...'
  },
  eclipsor: {
    id: 'eclipsor', name: 'ECLIPSOR', hp: 36, attack: 5, emoji: '🌑',
    taunts: ['I blocked out your sun! Forever night!', 'The planets spin for MEEEE!'],
    hurt: ['Too much light! TOO MUCH LIGHT!', 'My shadow is shrinking!'],
    defeat: 'The dawn... breaks... how... bright...'
  },
  glitchergoo: {
    id: 'glitchergoo', name: 'GLITCHERGOO', hp: 36, attack: 5, emoji: '🫧',
    taunts: ['Am I solid? Liquid? GAS? You’ll never know!', 'I flicker faster than you think!'],
    hurt: ['I’m condensing! NOOO!', 'My particles! They’re behaving!'],
    defeat: 'Freezing... melting... settling... down...'
  },
  foggle: {
    id: 'foggle', name: 'FOGGLE', hp: 36, attack: 5, emoji: '🌫️',
    taunts: ['I hid every map in the world! Lost yet?', 'North is south now! Probably!'],
    hurt: ['My fog is lifting! Stop knowing places!', 'You found... THE WAY?!'],
    defeat: 'The maps... glow... again... farewell...'
  },
  theBug: {
    id: 'theBug', name: 'THE BUG', hp: 36, attack: 5, emoji: '🪲',
    taunts: ['I crawled into every program and broke step 2!', 'Loops? I un-looped them ALL!'],
    hurt: ['Debugged?! By a KID?!', 'My broken steps! Fixed!'],
    defeat: 'Program... restored... exiting... gracefully...'
  },

  // ---- the finale ----
  glitchKing: {
    id: 'glitchKing', name: 'THE GLITCH KING', hp: 48, attack: 6, emoji: '👑',
    taunts: ['I scrambled EIGHT worlds and I’d do it again!', 'No kid has ever out-smarted ME!', 'My crown is made of wrong answers!'],
    hurt: ['Impossible! IMPOSSIBLE!', 'My static! My beautiful static!', 'Who TAUGHT you all this?!'],
    defeat: 'Fine... FINE! That was... actually fun... meow.'
  }
};
