/* chapter2.js — THE ATLAS (Region 2). Game type: geography quiz (for a Texas
   kindergartner). Lesson: where we live + the world — states, countries, continents.
   Framed in-story as relighting the lands of the Atlas by naming them. */
window.PR = window.PR || {};
PR.chapters = PR.chapters || {};

PR.chapters.chapter2 = {
  chapterNum: 2,
  next: 'chapter3',
  scenes: [
    { type: 'title', chapter: 'CHAPTER TWO', title: 'THE\nATLAS', region: '~ NAME THE WORLD ~', press: 'ENTER' },

    { type: 'world', action: 'build' },
    { type: 'world', action: 'lit' },
    { type: 'buddy', action: 'show' },

    { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
      'This is the Atlas, ' + s.player.name + ' — the room that shows the WHOLE world on a giant map. Every place, big and small.',
      'When the World went dark, the Atlas forgot the names of the lands. The map went black.',
      'Here\'s the good news: a Builder knows where she lives and what\'s out there. Name each land right, and its light comes back.',
      'Don\'t worry — there\'s no losing here. Pick the best answer; if it\'s not right, I\'ll help you find it. Ready?'
    ] },

    { type: 'mechanic', name: 'quiz', config: { count: 12 }, store: 'lastQuizScore' },

    { type: 'world', action: 'lit' },
    { type: 'buddy', action: 'show' },
    { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
      'The map is GLOWING again! You lit it up, ' + s.player.name + '.',
      'You know your state — Texas. Your country — the United States. Your continent — North America. And a whole world beyond it.',
      'That\'s real Builder knowledge: know where you stand, and you can go anywhere.'
    ] },

    { type: 'badge', index: 2, name: 'ATLAS', icon: '🗺' },

    { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
      'Two regions awake. The grid\'s noticing you.',
      'Next stop — WEBVILLE. The whole town wants a page of their own on the great web, and only a Builder can make one.',
      'Time to build a real website, ' + s.player.name + '. Let\'s move.'
    ] },

    { type: 'end', title: 'WEBVILLE\nAWAITS', sub: 'Chapter 2 complete', press: 'GO' }
  ]
};
