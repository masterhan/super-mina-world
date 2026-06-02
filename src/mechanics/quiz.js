/* quiz.js — Ch2 "The Atlas" mechanic. A real, friendly geography quiz for a Texas
   kindergartner. Pixel-art continents + Texas to identify, flags, and easy
   state/country/continent questions. Draws 10 from a ~50-question bank, shuffles
   the answer order, and is KIND: a wrong tap just nudges toward the right one — no
   score, no losing. Framed in-story as relighting the lands of The Atlas. */
window.PR = window.PR || {};
PR.mechanics = PR.mechanics || {};

PR.mechanics.quiz = (function () {
  // pixel-art silhouettes ('#' = land). Stylized, but consistent so the shape↔name
  // association sticks. Used for "which continent/state is this?" questions.
  const PIX = {
    south_america: ['..#####......','.#######.....','.########....','.########....','..#######....','..######.....','...#####.....','...####......','...###.......','....##.......','....#........'],
    africa:        ['..######.....','.#########...','.##########..','.#########...','..########...','..#######....','...######....','...#####.....','....####.....','....###......','.....#.......'],
    north_america: ['.##...####...','.###.######..','.##########..','.##########..','..########...','...######....','....####.....','....###......','.....##......','.....#.......','.....#.......'],
    australia:     ['.............','..#######....','.#########...','.##########..','.#########...','..#######....','...####......','.............'],
    antarctica:    ['.............','.............','.............','.............','.###########.','.###########.','..#########..','.............','.............'],
    texas:         ['##...........','##...........','########.....','########.....','#########....','#########....','.#######.....','..####.......','...##........']
  };

  // answer is always index 0 here; option order is shuffled on screen.
  const BANK = [
    { q: 'What state do we live in?',            o: ['Texas', 'California', 'Florida'] },
    { q: 'What country do we live in?',          o: ['United States', 'Mexico', 'Canada'] },
    { q: 'What continent do we live on?',        o: ['North America', 'Europe', 'Asia'] },
    { q: 'What planet do we live on?',           o: ['Earth', 'Mars', 'the Moon'] },
    { q: 'Which one is a country?',              o: ['United States', 'Texas', 'Dallas'] },
    { q: 'Which one is a state?',                o: ['Texas', 'United States', 'North America'] },
    { q: 'Which one is a city?',                 o: ['Houston', 'Texas', 'Earth'] },
    { q: 'Which is bigger, a country or a city?', o: ['A whole country', 'One city'] },
    { q: 'The United States is on which continent?', o: ['North America', 'South America', 'Africa'] },
    { q: 'Our neighbor country to the SOUTH is?',o: ['Mexico', 'Canada', 'Brazil'] },
    { q: 'Our neighbor country to the NORTH is?',o: ['Canada', 'Mexico', 'France'] },
    { q: 'Texas is a ____.',                     o: ['State', 'Country', 'Planet'] },
    { q: 'How many continents are there?',       o: ['7', '3', '100'] },
    { q: 'Which continent is the coldest and iciest?', o: ['Antarctica', 'Africa', 'Australia'] },
    { q: 'Penguins live on this icy continent. Which?', o: ['Antarctica', 'Europe', 'Asia'] },
    { q: 'Lions and elephants roam wild here. Which continent?', o: ['Africa', 'Antarctica', 'North America'] },
    { q: 'Kangaroos hop around this place. Which?', o: ['Australia', 'Canada', 'Egypt'] },
    { q: 'The giant Amazon rainforest is on this continent.', o: ['South America', 'Europe', 'Australia'] },
    { q: 'Most of the Earth is covered in...',   o: ['Water', 'Land', 'Sand'] },
    { q: 'Which is bigger, the Earth or the Moon?', o: ['The Earth', 'The Moon'] },
    { q: 'A map shows you...',                    o: ['Places on Earth', 'What time it is', 'Your dinner'] },
    { q: 'A globe is shaped like a...',           o: ['Ball', 'Box', 'Star'] },
    { q: 'Which one is NOT a country?',           o: ['Texas', 'Mexico', 'Japan'] },
    { q: 'Pick the country.',                     o: ['Canada', 'Dallas', 'North America'] },
    { q: 'All 50 states together make up the...', o: ['United States', 'Whole world', 'State of Texas'] },
    { q: 'The North Pole is very...',             o: ['Cold', 'Hot', 'Sandy'] },
    { q: 'A desert is very...',                   o: ['Dry and sandy', 'Wet and rainy'] },
    { q: 'The sun is very...',                    o: ['Hot', 'Cold', 'Wet'] },
    { q: 'The ocean is full of...',              o: ['Water', 'Sand', 'Fire'] },
    { q: 'Which animal lives in the ocean?',      o: ['A fish', 'A lion', 'A kangaroo'] },
    { q: 'Which is the SMALLEST continent?',      o: ['Australia', 'Asia', 'Africa'] },
    { q: 'On most maps, which way is UP?',        o: ['North', 'South'] },
    { q: 'Earth is sometimes called the ___ planet.', o: ['Blue', 'Red', 'Green'] },
    { q: 'Which one is a continent?',             o: ['Africa', 'Texas', 'Houston'] },
    { q: 'Which one is an OCEAN?',                o: ['The Pacific', 'Texas', 'Asia'] },
    { q: 'We can see the whole world on a flat...', o: ['Map', 'Plate', 'Clock'] },
    { q: 'Texas is famous for...',                o: ['Cowboys', 'Penguins', 'Pyramids'] },
    { q: 'Which is hotter, the sun or an ice cube?', o: ['The sun', 'An ice cube'] },
    { q: 'A country is made of many...',          o: ['Cities and towns', 'Planets', 'Suns'] },
    { q: 'Pick the planet.',                      o: ['Earth', 'Texas', 'Asia'] },
    // ---- pixel-art identification (continents + our state) ----
    { q: 'Which continent is this?', art: 'south_america', o: ['South America', 'Africa', 'Europe'] },
    { q: 'Which continent is this?', art: 'africa',        o: ['Africa', 'Australia', 'North America'] },
    { q: 'Which continent is this?', art: 'australia',     o: ['Australia', 'Asia', 'South America'] },
    { q: 'Which icy continent is this?', art: 'antarctica', o: ['Antarctica', 'Africa', 'Europe'] },
    { q: 'Which continent is this?', art: 'north_america', o: ['North America', 'South America', 'Africa'] },
    { q: 'Which state is this? (it\'s ours!)', art: 'texas', o: ['Texas', 'Florida', 'California'] },
    // ---- flags ----
    { q: 'Whose flag is this?', flag: '🇺🇸', o: ['United States', 'Mexico', 'Brazil'] },
    { q: 'Whose flag is this?', flag: '🇲🇽', o: ['Mexico', 'Canada', 'United States'] },
    { q: 'Whose flag is this?', flag: '🇨🇦', o: ['Canada', 'France', 'Mexico'] },
    { q: 'Whose flag is this?', flag: '🇧🇷', o: ['Brazil', 'United States', 'Japan'] },
    { q: 'Whose flag is this?', flag: '🇯🇵', o: ['Japan', 'Canada', 'Egypt'] }
  ];

  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }

  function run(api, config, done) {
    const layer = api.layer; layer.innerHTML = '';
    const N = Math.min(config.count || 10, BANK.length);
    const qs = shuffle(BANK.slice()).slice(0, N);
    let idx = 0, got = 0;

    const wrap = document.createElement('div');
    wrap.className = 'quizwrap';
    wrap.style.cssText = 'position:absolute;left:10px;right:10px;top:8%;bottom:14px;z-index:7;display:flex;flex-direction:column;align-items:center;gap:12px;padding:6px;overflow:auto';
    layer.appendChild(wrap);
    render();

    function render() {
      wrap.innerHTML = '';
      const item = qs[idx];

      // progress dots
      const dots = document.createElement('div'); dots.className = 'case';
      for (let i = 0; i < N; i++) { const d = document.createElement('div'); d.className = 'slot' + (i < got ? ' on' : ''); dots.appendChild(d); }
      wrap.appendChild(dots);

      const qel = document.createElement('div'); qel.className = 'stage-title'; qel.textContent = item.q;
      wrap.appendChild(qel);

      if (item.art) wrap.appendChild(drawPix(PIX[item.art]));
      if (item.flag) { const f = document.createElement('div'); f.style.cssText = 'font-size:56px;line-height:1'; f.textContent = item.flag; wrap.appendChild(f); }

      const correctText = item.o[0];
      const opts = shuffle(item.o.map((t, i) => ({ t, correct: i === 0 })));
      const list = document.createElement('div');
      list.style.cssText = 'display:flex;flex-direction:column;gap:9px;width:100%;max-width:320px;margin-top:4px';
      let answered = false; let correctBtn = null;
      opts.forEach(op => {
        const b = document.createElement('button');
        b.className = 'qopt';
        b.textContent = op.t;
        b.style.cssText = 'font-size:20px;padding:13px;width:100%';
        if (op.correct) correctBtn = b;
        b.onclick = () => {
          if (answered) return;
          if (op.correct) {
            answered = true;
            b.style.borderColor = 'var(--glow)'; b.style.boxShadow = '0 0 16px var(--glow)'; b.style.color = 'var(--glow)';
            PR.audio.win(); PR.creature.sparkleBurst(api.device, 8); PR.rain.surge(2);
            got++;
            setTimeout(() => { idx++; if (idx >= N) win(); else render(); }, 750);
          } else {
            PR.audio.buzz();
            b.disabled = true; b.style.opacity = '0.35';
            if (correctBtn) { correctBtn.style.boxShadow = '0 0 14px var(--glow)'; correctBtn.style.borderColor = 'var(--glow)'; }
          }
        };
        list.appendChild(b);
      });
      wrap.appendChild(list);
    }

    function drawPix(grid) {
      const cell = 9, cols = grid[0].length, rows = grid.length;
      const cv = document.createElement('canvas'); cv.width = cols * cell; cv.height = rows * cell;
      cv.style.cssText = 'border:2px solid var(--glow);border-radius:8px;box-shadow:0 0 16px var(--glow);background:#06080f';
      const ctx = cv.getContext('2d');
      const g = getComputedStyle(document.documentElement).getPropertyValue('--glow').trim() || '#3df2ff';
      ctx.fillStyle = g;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
        if (grid[r][c] === '#') ctx.fillRect(c * cell + 1, r * cell + 1, cell - 1, cell - 1);
      }
      return cv;
    }

    function win() {
      wrap.remove();
      PR.audio.fanfare(); PR.rain.surge(3); PR.creature.sparkleBurst(api.device, 18);
      setTimeout(() => done(got), 700);
    }
  }

  return { run };
})();
