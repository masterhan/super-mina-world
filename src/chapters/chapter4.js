/* chapter4.js — LOGIC LAKE (Region 4). Game type: sequencing puzzle + loops.
   Lesson: sequence, order, cause/effect, loops, debugging — the core of all code. */
window.PR = window.PR || {};
PR.chapters = PR.chapters || {};

PR.chapters.chapter4 = {
  chapterNum: 4,
  next: 'workshop',
  scenes: [
    { type: 'title', chapter: 'CHAPTER FOUR', title: 'LOGIC\nLAKE', region: '~ THINK IN STEPS ~', press: 'ENTER' },

    { type: 'world', action: 'build' },
    { type: 'world', action: 'lit' },
    { type: 'buddy', action: 'show' },

    { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
      'Logic Lake. Deep water, scattered stones. ' + s.buddy.name + ' can only step where YOU tell it.',
      'Here\'s the whole secret of programming, ' + s.player.name + ': the machine does EXACTLY what you say, in EXACTLY the order you say it. No more, no less.',
      'Stack your steps in order, then hit RUN. Wrong order? Splash — and you try again. That\'s called debugging, and every Builder does it.',
      'Pick a route and get it across.'
    ] },

    { type: 'mechanic', name: 'sequencer', config: {} },

    { type: 'world', action: 'lit' },
    { type: 'buddy', action: 'show' },
    { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
      'Across! And did you feel that on the long crossing? One 🔁 LOOP block did the work of four steps.',
      'That\'s the Builder\'s superpower: when something repeats, you don\'t do it over and over — you tell the machine \'do this N times\' ONCE.',
      'Sequence, order, loops, debugging. You think like a Builder now, ' + s.player.name + '.'
    ] },

    { type: 'badge', index: 4, name: 'LOGIC', icon: '🔁' },

    { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
      'Four badges. Half the World awake. And here\'s the part I\'ve been waiting for.',
      'You\'ve fixed pictures and pages and puzzles. Next, we don\'t FIX someone else\'s thing...',
      '...we BUILD our own. A real game. Flappy fliers, jumpers, catchers, mazes — your idea, your way.',
      'Come to THE WORKSHOP, ' + s.player.name + '. Pick what WE build next.'
    ] },

    { type: 'end', title: 'THE\nWORKSHOP', sub: 'Chapter 4 complete', press: 'ENTER' }
  ]
};
