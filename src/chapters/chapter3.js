/* chapter3.js — WEBVILLE (Region 3). Game type: web constructor.
   Lesson: a website is just blocks I chose — and it WORKS. Peak "I built this." */
window.PR = window.PR || {};
PR.chapters = PR.chapters || {};

PR.chapters.chapter3 = {
  chapterNum: 3,
  next: 'chapter4',
  scenes: [
    { type: 'title', chapter: 'CHAPTER THREE', title: 'WEBVILLE', region: '~ BUILD A REAL PAGE ~', press: 'ENTER' },

    { type: 'world', action: 'build' },
    { type: 'world', action: 'lit' },
    { type: 'buddy', action: 'show' },

    { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
      'Webville, ' + s.player.name + '. Every town on the great web has a PAGE — a little window the whole world can open.',
      'Webville never got one. Nobody here knew how. But a Builder does.',
      'A page is just blocks you stack: a title, a picture, a button that DOES something. Choose your blocks and I\'ll make it real.',
      'Build it your way. There\'s no wrong page — only YOUR page.'
    ] },

    { type: 'mechanic', name: 'webbuilder', config: {}, store: 'lastPage' },

    { type: 'world', action: 'lit' },
    { type: 'buddy', action: 'show' },
    { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
      'You. Built. A website. A real one — title, picture, a button that actually works.',
      'That \'SAVE MY PAGE\' button? It made a real file you can keep, and a grown-up can put it on the internet for the whole world to visit.',
      'You did the real thing today, ' + s.player.name + ' — a page that actually works.'
    ] },

    { type: 'badge', index: 3, name: 'WEB', icon: '🌐' },

    { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
      'Three down. Halfway to waking the whole World.',
      'But building is only half of being a Builder. The other half? Thinking in steps — telling the machine EXACTLY what to do, in the right order.',
      'LOGIC LAKE is next. ' + s.buddy.name + ' will have to cross deep water on your commands alone. Get the order wrong... splash.',
      'Let\'s go teach it to think.'
    ] },

    { type: 'end', title: 'LOGIC LAKE\nAWAITS', sub: 'Chapter 3 complete', press: 'GO' }
  ]
};
