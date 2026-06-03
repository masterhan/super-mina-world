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
    south_america: ['..###.............', '..#######.........', '..########........', '.###########......', '##############....', '#################.', '.#################', '.################.', '..##############..', '....############..', '....############..', '....###########...', '....#########.....', '....########......', '....#######.......', '...######.........', '...######.........', '...###............', '...###............', '..####............', '..###.............', '...##.............'],
    africa: ['...#.###............', '..########.#........', '..#############.....', '.##############.....', '################....', '################....', '#################...', '##################..', '.###################', '.......############.', '........##########..', '........#########...', '.........#######....', '.........########...', '.........########..#', '.........########.##', '.........######...#.', '.........######...#.', '.........######.....', '..........####......', '..........###.......'],
    north_america: ['..#......###...###....', '.###############..##..', '.#############........', '..#...########...###..', '.......#########.####.', '........############..', '........############..', '........##########....', '.........########.....', '.........########.....', '...........####.......', '...........##...#.....', '............#.........', '.............##.......', '...............#......', '......................'],
    australia: ['......................', '..........###...#.....', '.......#.###....#.....', '......########.###....', '.....#############....', '...################...', '.###################..', '.####################.', '.#####################', '.#####################', '..####################', '..#######.###########.', '..####......#.#######.', '..............######..', '...............#####..', '......................', '.................##...', '..................#...'],
    antarctica: ['........#.................', '................##.#####..', '........#...#############.', '...##.##....#############.', '..#####..################.', '..######..###############.', '#..#######################', '##########################'],
    usa: ['.###########..........', '###############.....#.', '################..###.', '####################..', '###################...', '.##################...', '.#################....', '..###############.....', '.....###########......', '.........####..#......', '.........#......#.....', '................#.....'],
    texas: ['.....####.........', '.....####.........', '.....####.........', '.....#####........', '.....###########..', '.....############.', '.....############.', '##################', '.#################', '..################', '...###############', '....#...########..', '.........######...', '.........####.....', '..........###.....', '..........###.....', '...........##.....']
  };

  // answer is always index 0 here; option order is shuffled on screen.
  const BANK = [
    { q: 'What state do we live in?', o: ['Texas', 'California', 'Florida', 'New York'] },
    { q: 'What country do we live in?', o: ['United States', 'Mexico', 'Canada', 'Brazil'] },
    { q: 'What continent do we live on?', o: ['North America', 'South America', 'Europe', 'Asia'] },
    { q: 'What planet do we live on?', o: ['Earth', 'Mars', 'the Moon', 'the Sun'] },
    { q: 'Which one is a country?', o: ['United States', 'Texas', 'Dallas', 'North America'] },
    { q: 'Which one is a state?', o: ['Texas', 'United States', 'North America', 'Houston'] },
    { q: 'Which one is a city?', o: ['Houston', 'Texas', 'Earth', 'North America'] },
    { q: 'Which is bigger, a country or a city?', o: ['A whole country', 'One city', 'A single house', 'They are the same'] },
    { q: 'The United States is on which continent?', o: ['North America', 'South America', 'Africa', 'Asia'] },
    { q: 'Our neighbor country to the SOUTH is?', o: ['Mexico', 'Canada', 'Brazil', 'France'] },
    { q: 'Our neighbor country to the NORTH is?', o: ['Canada', 'Mexico', 'France', 'Japan'] },
    { q: 'Texas is a ____.', o: ['State', 'Country', 'Planet', 'City'] },
    { q: 'How many continents are there?', o: ['7', '3', '5', '100'] },
    { q: 'Which continent is the coldest and iciest?', o: ['Antarctica', 'Africa', 'Australia', 'South America'] },
    { q: 'Penguins live on this icy continent. Which?', o: ['Antarctica', 'Europe', 'Asia', 'Africa'] },
    { q: 'Lions and elephants roam wild here. Which continent?', o: ['Africa', 'Antarctica', 'North America', 'Europe'] },
    { q: 'Kangaroos hop around this place. Which?', o: ['Australia', 'Canada', 'Egypt', 'Japan'] },
    { q: 'The giant Amazon rainforest is on this continent.', o: ['South America', 'Europe', 'Australia', 'North America'] },
    { q: 'Most of the Earth is covered in...', o: ['Water', 'Land', 'Sand', 'Ice'] },
    { q: 'Which is bigger, the Earth or the Moon?', o: ['The Earth', 'The Moon', 'The same size', 'The Sun'] },
    { q: 'A map shows you...', o: ['Places on Earth', 'What time it is', 'Your dinner', 'A song'] },
    { q: 'A globe is shaped like a...', o: ['Ball', 'Box', 'Star', 'Pancake'] },
    { q: 'Which one is NOT a country?', o: ['Texas', 'Mexico', 'Japan', 'Canada'] },
    { q: 'Pick the country.', o: ['Canada', 'Dallas', 'North America', 'Texas'] },
    { q: 'All 50 states together make up the...', o: ['United States', 'Whole world', 'State of Texas', 'A city'] },
    { q: 'The North Pole is very...', o: ['Cold', 'Hot', 'Sandy', 'Rainy'] },
    { q: 'A desert is very...', o: ['Dry and sandy', 'Wet and rainy', 'Cold and snowy', 'Full of trees'] },
    { q: 'The sun is very...', o: ['Hot', 'Cold', 'Wet', 'Tiny'] },
    { q: 'The ocean is full of...', o: ['Water', 'Sand', 'Fire', 'Trees'] },
    { q: 'Which animal lives in the ocean?', o: ['A fish', 'A lion', 'A kangaroo', 'A camel'] },
    { q: 'Which is the SMALLEST continent?', o: ['Australia', 'Asia', 'Africa', 'North America'] },
    { q: 'On most maps, which way is UP?', o: ['North', 'South', 'East', 'West'] },
    { q: 'Earth is sometimes called the ___ planet.', o: ['Blue', 'Red', 'Green', 'Yellow'] },
    { q: 'Which one is a continent?', o: ['Africa', 'Texas', 'Houston', 'Dallas'] },
    { q: 'Which one is an OCEAN?', o: ['The Pacific', 'Texas', 'Asia', 'Egypt'] },
    { q: 'We can see the whole world on a flat...', o: ['Map', 'Plate', 'Clock', 'Door'] },
    { q: 'Texas is famous for...', o: ['Cowboys', 'Penguins', 'Pyramids', 'Volcanoes'] },
    { q: 'Which is hotter, the sun or an ice cube?', o: ['The sun', 'An ice cube', 'The same', 'Neither one'] },
    { q: 'A country is made of many...', o: ['Cities and towns', 'Planets', 'Suns', 'Oceans'] },
    { q: 'Pick the planet.', o: ['Earth', 'Texas', 'Asia', 'The Pacific'] },
    { q: 'What is the very cold place at the BOTTOM of the Earth called?', o: ['The South Pole', 'The beach', 'A desert', 'A jungle'] },
    { q: 'What is the very cold place at the TOP of the Earth called?', o: ['The North Pole', 'A jungle', 'A city', 'A desert'] },
    { q: 'A really big body of salty water is an...', o: ['Ocean', 'Puddle', 'Cup', 'Pond'] },
    { q: 'Which is closer to us?', o: ['The Moon', 'The Sun', 'Mars', 'Jupiter'] },
    { q: 'A dry place with lots of sand is a...', o: ['Desert', 'Forest', 'Ocean', 'Lake'] },
    { q: 'A place with LOTS of trees is a...', o: ['Forest', 'Desert', 'Beach', 'Ocean'] },
    { q: 'Tall and rocky with snow on top — that\'s a...', o: ['Mountain', 'River', 'Lake', 'Beach'] },
    { q: 'Water flowing in a long line across the land is a...', o: ['River', 'Mountain', 'Cloud', 'Desert'] },
    { q: 'When it is nighttime, the sky is...', o: ['Dark', 'Bright yellow', 'Green', 'On fire'] },
    { q: 'Which country has the Eiffel Tower?', o: ['France', 'United States', 'Japan', 'Mexico'] },
    { q: 'Which country is shaped like a boot?', o: ['Italy', 'Canada', 'Brazil', 'Egypt'] },
    { q: 'The famous pyramids are in this country.', o: ['Egypt', 'Mexico', 'Canada', 'Japan'] },
    { q: 'Pandas come from this country.', o: ['China', 'France', 'Australia', 'Brazil'] },
    { q: 'Polar bears live where it is very...', o: ['Cold and snowy', 'Hot and sandy', 'Wet and rainy', 'Dry and dusty'] },
    { q: 'Camels carry people across the hot, sandy...', o: ['Desert', 'Ocean', 'Forest', 'River'] },
    { q: 'Which can you walk on?', o: ['Land', 'The deep ocean', 'A cloud', 'The sky'] },
    { q: 'Which is bigger, Texas or the whole United States?', o: ['The whole United States', 'Texas', 'The same size', 'A city'] },
    { q: 'Which is bigger, the United States or the whole Earth?', o: ['The whole Earth', 'The United States', 'The same size', 'Texas'] },
    { q: 'Most maps are colored BLUE where there is...', o: ['Water', 'Grass', 'Sand', 'Roads'] },
    { q: 'Maps are often colored GREEN where there is...', o: ['Land and grass', 'Deep water', 'The sky', 'Fire'] },
    { q: 'How many oceans are on Earth?', o: ['5', '1', '100', '2'] },
    { q: 'Which animal lives where it is icy and cold?', o: ['Penguin', 'Camel', 'Monkey', 'Lion'] },
    { q: 'Which one is a planet?', o: ['Mars', 'Texas', 'The Pacific', 'Houston'] },
    { q: 'The big star that gives us light and heat is the...', o: ['Sun', 'Moon', 'Cloud', 'Map'] },
    { q: 'What is the opposite of North?', o: ['South', 'Up', 'East', 'Down'] },
    { q: 'What is the opposite of East?', o: ['West', 'Down', 'North', 'Up'] },
    { q: 'Houston and Austin are cities in which state?', o: ['Texas', 'Florida', 'Ohio', 'California'] },
    { q: 'Which is a country in North America?', o: ['Canada', 'France', 'China', 'Egypt'] },
    { q: 'Which is a country in Asia?', o: ['Japan', 'Mexico', 'Brazil', 'Canada'] },
    { q: 'Koalas and kangaroos come from...', o: ['Australia', 'Canada', 'Egypt', 'France'] },
    { q: 'The Sahara is the biggest, hottest ___ on Earth.', o: ['Desert', 'Forest', 'Lake', 'Ocean'] },
    { q: 'A whole country is made of lots of...', o: ['Cities and towns', 'Suns', 'Moons', 'Planets'] },
    { q: 'The ground we stand on, not the water, is called...', o: ['Land', 'Sky', 'Rain', 'Cloud'] },
    { q: 'Which is a continent AND a country?', o: ['Australia', 'Texas', 'Paris', 'Egypt'] },
    // ---- pixel-art identification (continents + our state, from real map data) ----
    { q: 'Which continent is this?', art: 'south_america', o: ['South America', 'Africa', 'Europe', 'Australia'] },
    { q: 'Which continent is this?', art: 'africa', o: ['Africa', 'Australia', 'North America', 'Europe'] },
    { q: 'Which continent is this?', art: 'australia', o: ['Australia', 'Asia', 'South America', 'Africa'] },
    { q: 'Which icy continent is this?', art: 'antarctica', o: ['Antarctica', 'Africa', 'Europe', 'Australia'] },
    { q: 'Which continent is this?', art: 'north_america', o: ['North America', 'South America', 'Africa', 'Asia'] },
    { q: 'Which state is this? (it\'s ours!)', art: 'texas', o: ['Texas', 'Florida', 'California', 'Ohio'] },
    { q: 'Which country is this?', art: 'usa', o: ['United States', 'Canada', 'Mexico', 'Brazil'] },
    // ---- flags ----
    { q: 'Whose flag is this?', flag: '🇺🇸', o: ['United States', 'Mexico', 'Brazil', 'Canada'] },
    { q: 'Whose flag is this?', flag: '🇲🇽', o: ['Mexico', 'Canada', 'United States', 'Japan'] },
    { q: 'Whose flag is this?', flag: '🇨🇦', o: ['Canada', 'France', 'Mexico', 'China'] },
    { q: 'Whose flag is this?', flag: '🇧🇷', o: ['Brazil', 'United States', 'Japan', 'Italy'] },
    { q: 'Whose flag is this?', flag: '🇯🇵', o: ['Japan', 'Canada', 'Egypt', 'China'] },
    { q: 'Whose flag is this?', flag: '🇫🇷', o: ['France', 'Italy', 'Egypt', 'Japan'] },
    { q: 'Whose flag is this?', flag: '🇨🇳', o: ['China', 'Canada', 'Brazil', 'France'] }
  ];

  // One friendly fact per place. When she taps a WRONG answer we show that place's fact,
  // so a wrong tap teaches her what that place actually is (e.g. tap Mexico → it's our SOUTHERN neighbor).
  const FACTS = {
    'United States': 'The United States is OUR country — 50 states together, in North America.',
    'Mexico': 'Mexico is the country on the SOUTHERN border of the United States.',
    'Canada': 'Canada is the big country on the NORTHERN border of the United States.',
    'Brazil': 'Brazil is the biggest country in South America — home of the Amazon rainforest.',
    'France': 'France is a country in Europe — it has the Eiffel Tower.',
    'Italy': 'Italy is a country in Europe, shaped like a boot.',
    'Egypt': 'Egypt is a country in Africa — it has the famous pyramids.',
    'Japan': 'Japan is a country in Asia, made of islands.',
    'China': 'China is a huge country in Asia — pandas come from there.',
    'North America': 'North America is OUR continent — the USA, Canada and Mexico are all on it.',
    'South America': 'South America is the continent below us — it has the Amazon rainforest.',
    'Africa': 'Africa is a big continent with lions, elephants and the Sahara desert.',
    'Europe': 'Europe is a continent across the ocean — France and Italy are there.',
    'Asia': 'Asia is the BIGGEST continent — China and Japan are there.',
    'Australia': 'Australia is BOTH a country and a continent — home of kangaroos and koalas.',
    'Antarctica': 'Antarctica is the coldest, iciest continent — penguins live there.',
    'Texas': 'Texas is OUR state — a state inside the United States.',
    'California': 'California is another state in the United States, way out west.',
    'Florida': 'Florida is a state in the United States, down in the southeast.',
    'Ohio': 'Ohio is a state up in the middle of the United States.',
    'Houston': 'Houston is a city — it\'s in our state, Texas.',
    'Dallas': 'Dallas is a city in Texas.',
    'Paris': 'Paris is a city — the capital of France.',
    'Earth': 'Earth is OUR planet — the one we live on.',
    'Mars': 'Mars is a different planet — the red one.',
    'the Moon': 'The Moon circles the Earth — it is not a planet.',
    'the Sun': 'The Sun is the giant star that gives us light and heat.',
    'The Sun': 'The Sun is the giant star that gives us light and heat.',
    'The Moon': 'The Moon circles the Earth — it is not a planet.',
    'The Pacific': 'The Pacific is the biggest OCEAN — not a country or a planet.',
    'The South Pole': 'The South Pole is the icy bottom of the Earth.',
    'The North Pole': 'The North Pole is the icy top of the Earth.',
    'Desert': 'A desert is a dry, sandy place with very little water.',
    'Forest': 'A forest is a place with lots and lots of trees.',
    'Mountain': 'A mountain is tall and rocky, often with snow on top.',
    'River': 'A river is water that flows in a long line across the land.',
    'Ocean': 'An ocean is a giant body of salty water.',
    'Land': 'Land is the ground we walk on — not the water.',
    'Water': 'Most of the Earth is covered in water — the oceans.',
    'South': 'South is the opposite of North — Mexico is south of us.',
    'North': 'North is the opposite of South — Canada is north of us.',
    'West': 'West is the opposite of East — where the sun sets.',
    'East': 'East is the opposite of West — where the sun rises.',
    'New York': 'New York is another state in the United States, up in the northeast.',
    'Jupiter': 'Jupiter is the BIGGEST planet — it is very far away, not close to us.',
    'Lake': 'A lake is water with land all around it — smaller than an ocean.'
  };

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
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); // no leftover highlight on the new question
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
      list.style.cssText = 'display:flex;flex-direction:column;gap:9px;width:100%;max-width:330px;margin-top:4px';
      // explanation line — fills in with a fact about whatever WRONG place she taps
      const msg = document.createElement('div');
      msg.style.cssText = 'font-family:"VT323",monospace;font-size:20px;line-height:1.3;color:var(--glow-soft);text-align:center;max-width:340px;min-height:56px;margin-top:2px';
      let answered = false; let correctBtn = null;
      opts.forEach(op => {
        const b = document.createElement('button');
        b.className = 'qopt';
        b.textContent = op.t;
        b.style.cssText = 'font-size:25px;padding:16px;width:100%';
        if (op.correct) correctBtn = b;
        b.onclick = () => {
          if (answered) return;
          if (op.correct) {
            answered = true;
            b.style.borderColor = 'var(--glow)'; b.style.boxShadow = '0 0 16px var(--glow)'; b.style.color = 'var(--glow)';
            msg.textContent = 'Yes! ' + (FACTS[correctText] || 'That’s right!');
            PR.audio.win(); PR.creature.sparkleBurst(api.device, 10); PR.rain.surge(2.4);
            got++;
            setTimeout(() => { idx++; if (idx >= N) win(); else render(); }, 1300);
          } else {
            PR.audio.buzz();
            b.disabled = true; b.style.opacity = '0.35';
            if (correctBtn) { correctBtn.style.boxShadow = '0 0 14px var(--glow)'; correctBtn.style.borderColor = 'var(--glow)'; }
            msg.textContent = 'Not quite! ' + (FACTS[op.t] || 'That’s not the one — tap the glowing answer.');
          }
        };
        list.appendChild(b);
      });
      wrap.appendChild(list);
      wrap.appendChild(msg);
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
