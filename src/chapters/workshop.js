/* workshop.js — THE WORKSHOP (capstone / "what we build next").
   She plays simple, themeable game archetypes live, then picks ONE + a style as the
   thing WE build next time. The literal bridge to future "build your own game" chapters. */
window.PR = window.PR || {};
PR.chapters = PR.chapters || {};

(function () {
  function runWorkshop(api, next) {
    const M = PR.mechanics.minigames;
    gallery();

    function gallery() {
      const s = document.createElement('div'); s.className = 'stage';
      s.innerHTML = '<div class="stage-title">Play a game — then choose what WE build next</div>';
      const g = document.createElement('div'); g.className = 'gallery';
      M.ARCHETYPES.forEach(a => {
        const c = document.createElement('div'); c.className = 'gcard';
        c.innerHTML = '<div class="ico">' + a.ico + '</div><div class="gname">' + a.name + '</div><div class="gsub">' + a.sub + '</div>';
        c.onclick = () => { PR.audio.tone(880, 0.06); s.remove(); demo(a); };
        g.appendChild(c);
      });
      s.appendChild(g); api.layer.appendChild(s);
    }

    function demo(a) {
      M.play(api, { key: a.key, theme: a.themes[0].name }, { onBack: gallery, onPick: () => chooseTheme(a) });
    }

    function chooseTheme(a) {
      const s = document.createElement('div'); s.className = 'stage';
      s.innerHTML = '<div class="stage-title">' + a.name + ' — pick your style</div>';
      const g = document.createElement('div'); g.className = 'gallery';
      a.themes.forEach(t => {
        const c = document.createElement('div'); c.className = 'gcard';
        c.innerHTML = '<div class="ico">' + t.char + '</div><div class="gname">' + t.name + '</div>';
        c.onclick = () => {
          PR.audio.fanfare(); api.flashGo(); api.sparkle(14);
          api.state.nextBuild = { key: a.key, game: a.name, theme: t.name, char: t.char };
          api.save(); s.remove(); next();
        };
        g.appendChild(c);
      });
      s.appendChild(g); api.layer.appendChild(s);
    }
  }

  PR.chapters.workshop = {
    chapterNum: 5,
    next: null, // no further chapters yet → tapping the final card loops back to the start
    scenes: [
      { type: 'title', chapter: 'THE WORKSHOP', title: 'BUILD\nYOUR GAME', region: '~ WHAT WE MAKE NEXT ~', press: 'ENTER' },

      { type: 'world', action: 'build' },
      { type: 'world', action: 'lit' },
      { type: 'buddy', action: 'show' },

      { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
        'This is the Workshop, ' + s.player.name + ' — where Builders make their OWN games.',
        'I\'ve got a few simple ones warming up. Play each. Feel how they work.',
        'Then tell me which one we BUILD for real — and make it yours.'
      ] },

      { type: 'fn', run: runWorkshop },

      { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
        'THAT one — a ' + (s.nextBuild ? (s.nextBuild.theme + ' ' + s.nextBuild.game) : 'game') + '. Your idea, your style.',
        'Here\'s the real secret, ' + s.player.name + ': every game you just played, somebody BUILT — with blocks, pixels, pages, and steps in the right order. The exact stuff you learned today.',
        'So next time we open the World, we build YOUR ' + (s.nextBuild ? s.nextBuild.game : 'game') + ' for real. You and ' + s.buddy.name + '.'
      ] },

      { type: 'badge', index: 5, name: 'BUILDER', icon: '🛠' },

      { type: 'dialogue', speaker: 'CIPHER', character: 'cipher', lines: (s) => [
        'Five badges lit! Three regions are still sleeping — a tricky riddle room, a place of word-puzzles, and deep sparkly caves. We\'ll wake those next time.',
        'You walked in not knowing you could command a machine. You\'re walking out a BUILDER.',
        'Rest up, ' + s.player.name + '. The World will be here when you\'re ready to build the next thing.'
      ] },

      { type: 'end', title: 'TO BE\nCONTINUED', sub: 'You are a Builder.', press: 'PLAY AGAIN' }
    ]
  };
})();
