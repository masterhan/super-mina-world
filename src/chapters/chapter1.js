/* chapter1.js — THE SPARK (Region 1). The prototype, retold as data.
   Beats: wake → boot → title → name → recruit → build BYTE → summon →
   first orders → a LIVE choose-your-own-adventure ("which way do we wake first?")
   → relight → Spark badge → cliffhanger. */
window.PR = window.PR || {};
PR.chapters = PR.chapters || {};

(function () {
  function cheer(api) {
    const c = api.layer.querySelector('.creature');
    if (c) { c.classList.add('cheer'); setTimeout(() => c.classList.remove('cheer'), 600); }
  }
  function spark(side) {
    return function (api) {
      api.world.sparkSide(side);
      api.world.ring(api.device);
      api.rain.surge(2.6);
      api.sparkle(8);
      api.audio.chirp();
      cheer(api);
    };
  }

  PR.chapters.chapter1 = {
    chapterNum: 1,
    next: null,
    scenes: [
      { type: 'wake' },
      { type: 'boot' },
      { type: 'title', chapter: 'CHAPTER ONE', title: 'SUPER\nMINA WORLD', region: '~ THE SPARK ~', press: 'PRESS START' },
      { type: 'nameEntry', prompt: 'Hello,' },

      { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
        'Hello, ' + s.player.name + '. I\'m Cipher. I\'ve been waiting for you.',
        'Most people look around and just see trees, towns, lights. Normal stuff.',
        'But me? I see the secret hiding underneath. This whole World is made of CODE — magic raindrops of it, falling everywhere.',
        'People who can read the code and tell it what to do are called BUILDERS. Builders can change ANYTHING.',
        'But the World is going dark, and the old Builders are gone. I need a new one. I\'m looking at her — you, ' + s.player.name + '.',
        'First rule: a Builder never goes alone. You\'ll pull a COMPANION right out of the code — yours, and it listens only to YOU.',
        'Let\'s make yours. Step up.'
      ] },

      { type: 'creator' },
      { type: 'summon' },

      { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
        '...There it is. Pulled straight out of the code. First new light this place has seen in a long time.',
        'And YOU called it. Say hi to ' + s.buddy.name + '.',
        'It won\'t talk — it\'s a tool, YOUR tool — but it\'ll do anything you command. That\'s the power, ' + s.player.name + '.'
      ] },

      { type: 'world', action: 'build' },

      // LIVE choose-your-own-adventure: her pick lights that side of the world on screen.
      { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', remember: 'firstPath',
        lines: (s) => ['Builders pick their own path. ' + s.buddy.name + ' is ready. Which way do we wake the World first?'],
        choices: [
          { label: 'EAST — toward the old hut', effect: spark('east'),
            lines: ['East it is. Watch — that\'s the first light it\'s seen in years. You did that.'] },
          { label: 'WEST — into the dark trees', effect: spark('west'),
            lines: ['Into the trees. Bold. They\'re glowing because YOU said so.'] }
        ] },

      { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) =>
        ['Now finish it. Give ' + s.buddy.name + ' the orders and watch the rest of the dark wake up.'] },

      { type: 'command', count: 3 },

      { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
        'Ha! Look at it glow. One corner of the World, awake again — because a Builder finally showed up.',
        'You gave the orders. ' + s.buddy.name + ' obeyed. That light belongs to you now, ' + s.player.name + '.'
      ] },

      { type: 'badge', index: 1, name: 'SPARK', icon: '✦' },

      { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
        'Whoa — you lit the first spark!',
        'And look... the whole WORLD just opened up. A MAP!',
        'Every glowing spot is a game to play.',
        'Tap any one and jump right in, ' + s.player.name + '. You and ' + s.buddy.name + ' go wherever you want!'
      ] },

      { type: 'map' }
    ]
  };
})();
