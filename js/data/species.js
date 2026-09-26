'use strict';
// ============================================================================
//  Species of the Solmere region (90 mons). base: [HP, Atk, Def, SpA, SpD, Spe]
// ============================================================================
G.MOVES.flop = { id: 'flop', name: 'Flop', type: 'normal', cat: 'status', pow: 0, acc: true, pp: 40, pri: 0, target: 'self', fx: 'flop', desc: 'Flops around energetically. Nothing happens. Ever.' };
G.SPECIES = {};
G.DEX = [];
(function () {
  const S = (id, name, types, base, abil, o) => {
    const sp = { id, name, types, base, abil, stage: 1, gender: .5, growth: 'mfast', learn: [], evo: [], tmx: [], h: 1, w: 10, ...o };
    sp.bst = base.reduce((a, b) => a + b, 0);
    if (!sp.exp) sp.exp = Math.round(sp.bst * sp.bst / 1450);
    if (!sp.catch) sp.catch = sp.legend ? 5 : sp.stage === 1 && sp.bst < 330 ? 190 : sp.stage === 1 ? 120 : sp.stage === 2 && !sp.final ? 90 : 45;
    if (!sp.ev) { const i = base.indexOf(Math.max(...base)); const K = ['hp', 'atk', 'def', 'spa', 'spd', 'spe']; sp.ev = { [K[i]]: Math.min(3, sp.stage + (sp.legend ? 2 : 0)) }; }
    sp.num = G.DEX.length + 1;
    G.SPECIES[id] = sp; G.DEX.push(id);
    return sp;
  };
  const L = (...pairs) => { const out = []; for (let i = 0; i < pairs.length; i += 2) out.push([pairs[i], pairs[i + 1]]); return out; };

  // ================================================================ STARTERS
  const budL = L(1, 'tackle', 1, 'growl', 4, 'vinewhip', 7, 'leechseed', 10, 'absorb', 13, 'razorleaf', 16, 'charmleaf', 19, 'sleeppowder', 22, 'megadrain', 25, 'seedbomb', 28, 'photosynth', 32, 'energyball', 36, 'gigadrain', 40, 'verdantbloom', 44, 'calmmind', 48, 'moonblast', 52, 'leafstorm');
  S('budling', 'Budling', ['grass'], [48, 50, 52, 52, 58, 50], ['overgrowth', null, 'naturalcure'], { growth: 'mslow', gender: .875, learn: budL, evo: [{ to: 'fawnbloom', lvl: 16 }], tmx: ['normal', 'ground', 'fairy'], h: .5, w: 7.2, cat: 'Sprout Fawn', color: 'green',
    dex: 'A shy fawn with a sapling growing from its brow. It naps in sunbeams, and the bud opens a little more each warm afternoon.' });
  S('fawnbloom', 'Fawnbloom', ['grass'], [63, 64, 67, 70, 74, 67], ['overgrowth', null, 'naturalcure'], { stage: 2, growth: 'mslow', gender: .875, learn: budL, evo: [{ to: 'sylvantler', lvl: 36 }], tmx: ['normal', 'ground', 'fairy'], h: 1.0, w: 28, cat: 'Blossom Deer', color: 'green',
    dex: 'Flowers bloom along its antlers in spring. Where it treads, grass grows back twice as thick, so farmers leave gates open for it.' });
  S('sylvantler', 'Sylvantler', ['grass', 'fairy'], [85, 82, 85, 100, 98, 80], ['overgrowth', null, 'naturalcure'], { stage: 3, final: true, growth: 'mslow', gender: .875, learn: budL, evoMove: 'moonblast', tmx: ['normal', 'ground', 'fairy', 'psychic'], h: 1.8, w: 96, cat: 'Grove Guardian', color: 'green',
    dex: 'Its antlers are a living grove that hums with pollen-light. Legends say a forest never burns while a Sylvantler sleeps within it.' });

  const kinL = L(1, 'scratch', 1, 'leer', 4, 'ember', 7, 'quickstrike', 10, 'bite', 13, 'emberdash', 16, 'firefang', 20, 'flamerush', 24, 'slash', 28, 'psybeam', 32, 'flamethrower', 36, 'psychic', 40, 'solarflare', 44, 'calmmind', 47, 'sunshine', 50, 'fireblast', 55, 'overheat');
  S('kindlet', 'Kindlet', ['fire'], [44, 54, 43, 58, 45, 66], ['kindle', null, 'flashfire'], { growth: 'mslow', gender: .875, learn: kinL, evo: [{ to: 'pyrolynx', lvl: 16 }], tmx: ['normal', 'dark', 'fighting'], h: .4, w: 6.5, cat: 'Ember Kit', color: 'red',
    dex: 'The tufts on its ears are tiny, flickering flames. When it is happy they crackle like a campfire; when it sulks they smoke.' });
  S('pyrolynx', 'Pyrolynx', ['fire'], [58, 70, 57, 78, 60, 82], ['kindle', null, 'flashfire'], { stage: 2, growth: 'mslow', gender: .875, learn: kinL, evo: [{ to: 'solarynx', lvl: 36 }], tmx: ['normal', 'dark', 'fighting', 'psychic'], h: 1.0, w: 32, cat: 'Blaze Lynx', color: 'red',
    dex: 'It stalks through tall grass without a sound, but its burning mane gives it away at night. It leaves scorched pawprints on stone.' });
  S('solarynx', 'Solarynx', ['fire', 'psychic'], [76, 84, 70, 110, 82, 108], ['kindle', null, 'flashfire'], { stage: 3, final: true, growth: 'mslow', gender: .875, learn: kinL, evoMove: 'psychic', tmx: ['normal', 'dark', 'fighting', 'psychic', 'electric'], h: 1.5, w: 64, cat: 'Sun Lynx', color: 'red',
    dex: 'A corona of sunfire circles its mane. Ancient Solmerans believed it carried the dawn across the sea each morning on its back.' });

  const seaL = L(1, 'tackle', 1, 'tailwhip', 4, 'watergun', 7, 'aquadart', 10, 'bite', 13, 'bubblejet', 16, 'headbutt', 20, 'crushwave', 23, 'iceshard', 26, 'bodyslam', 30, 'braceup', 33, 'cascade', 36, 'ironhead', 40, 'anchorslam', 44, 'icicledrop', 47, 'ironwall', 52, 'hydropump');
  S('sealet', 'Sealet', ['water'], [53, 50, 55, 48, 50, 54], ['riptide', null, 'thickfat'], { growth: 'mslow', gender: .875, learn: seaL, evo: [{ to: 'brinewhisk', lvl: 16 }], tmx: ['normal', 'ice'], h: .5, w: 9.5, cat: 'Pup Seal', color: 'blue',
    dex: 'It balances pebbles on its nose to impress friends. Its whiskers can feel the rumble of a storm three islands away.' });
  S('brinewhisk', 'Brinewhisk', ['water'], [68, 68, 72, 60, 64, 73], ['riptide', null, 'thickfat'], { stage: 2, growth: 'mslow', gender: .875, learn: seaL, evo: [{ to: 'tidalrus', lvl: 36 }], tmx: ['normal', 'ice', 'fighting'], h: 1.1, w: 58, cat: 'Surf Seal', color: 'blue',
    dex: 'Its tusks start to harden into metal. It rides rip currents for fun and drags stranded swimmers back to shore.' });
  S('tidalrus', 'Tidalrus', ['water', 'steel'], [95, 108, 100, 72, 85, 70], ['riptide', null, 'thickfat'], { stage: 3, final: true, growth: 'mslow', gender: .875, learn: seaL, evoMove: 'metalclaw', tmx: ['normal', 'ice', 'fighting', 'ground', 'rock', 'steel'], h: 1.9, w: 240, cat: 'Anchor Walrus', color: 'blue',
    dex: 'Its tusks are harder than a ship\'s anchor. Sailors say a Tidalrus once held a sinking ferry steady until the rescue boats came.' });

  // ================================================================ EARLY ROUTES
  const pipL = L(1, 'peck', 1, 'growl', 5, 'quickstrike', 8, 'gust', 12, 'wingslash', 16, 'aerialace', 20, 'focusup', 24, 'airslash', 28, 'tailwind', 32, 'drillpeck', 38, 'bravedive', 42, 'roost');
  S('pipwing', 'Pipwing', ['normal', 'flying'], [40, 45, 40, 35, 35, 56], ['keeneye', 'superluck', 'reckless'], { learn: pipL, evo: [{ to: 'gustling', lvl: 14 }], tmx: ['normal', 'flying', 'dark'], h: .3, w: 1.8, cat: 'Chirp Bird', color: 'brown',
    dex: 'Flocks of Pipwing wake the coast every morning with a racket of chirps. They steal crumbs with surprising cheek.' });
  S('gustling', 'Gustling', ['normal', 'flying'], [58, 62, 55, 45, 48, 77], ['keeneye', 'superluck', 'reckless'], { stage: 2, learn: pipL, evo: [{ to: 'galeclaw', lvl: 32 }], tmx: ['normal', 'flying', 'dark'], h: .8, w: 12, cat: 'Swift Bird', color: 'brown',
    dex: 'It rides sea breezes for hours without flapping, scanning the waves for fish. Its crest stands up when it is ready to dive.' });
  S('galeclaw', 'Galeclaw', ['normal', 'flying'], [78, 95, 72, 55, 65, 105], ['keeneye', 'superluck', 'reckless'], { stage: 3, final: true, learn: pipL, tmx: ['normal', 'flying', 'dark', 'steel'], h: 1.5, w: 38, cat: 'Storm Raptor', color: 'brown',
    dex: 'It dives at speeds that make the air scream. Galeclaw pairs mate for life and circle each other through thunderstorms.' });

  const nibL = L(1, 'tackle', 1, 'tailwhip', 4, 'quickstrike', 8, 'bite', 11, 'furyswipes', 15, 'headbutt', 18, 'crunch', 24, 'slash', 28, 'facade', 32, 'doubleedge', 36, 'wardance');
  S('nibbit', 'Nibbit', ['normal'], [35, 52, 38, 25, 35, 65], ['runaway', 'pickup', 'strongjaw'], { learn: nibL, evo: [{ to: 'gnawmaw', lvl: 18 }], tmx: ['normal', 'dark', 'electric'], h: .3, w: 3.1, cat: 'Nibbler', color: 'purple',
    dex: 'Its front teeth never stop growing, so it gnaws on anything: fences, sandals, the occasional bicycle tire.' });
  S('gnawmaw', 'Gnawmaw', ['normal', 'dark'], [70, 85, 62, 45, 62, 96], ['runaway', 'pickup', 'strongjaw'], { stage: 2, final: true, learn: nibL, evoMove: 'crunch', tmx: ['normal', 'dark', 'electric', 'ice', 'ground', 'water'], h: .8, w: 21, cat: 'Chomper', color: 'purple',
    dex: 'It can bite through steel cable. Gnawmaw colonies dig tunnel towns under farmland and are a nightmare for carrot growers.' });

  const grubL = L(1, 'tackle', 1, 'silkspray', 5, 'bugbite', 10, 'fairybreeze', 12, 'confusion', 14, 'stunspore', 16, 'sleeppowder', 18, 'psybeam', 22, 'signalbeam', 25, 'kissdrain', 30, 'flutterdance', 34, 'bugbuzz', 38, 'moonblast');
  S('grubbit', 'Grubbit', ['bug'], [42, 30, 38, 20, 30, 40], ['shedskin', null, 'runaway'], { learn: grubL.slice(0, 3), evo: [{ to: 'cocoonet', lvl: 7 }], tmx: [], h: .3, w: 2.4, cat: 'Grub', color: 'green', exp: 39, catch: 255,
    dex: 'It munches leaves nonstop to store up energy for its big change. A full Grubbit sleeps curled up like a pastry.' });
  S('cocoonet', 'Cocoonet', ['bug'], [48, 20, 58, 25, 55, 30], ['shedskin', null, 'shedskin'], { stage: 2, learn: L(1, 'ironwall', 1, 'tackle'), evoMove: 'ironwall', evo: [{ to: 'aurorymoth', lvl: 10 }], tmx: [], h: .5, w: 8, cat: 'Cocoon', color: 'white', exp: 72, catch: 120,
    dex: 'Inside its silk shell, its body melts and reforms. Faint pastel light leaks out as the moment of emergence nears.' });
  S('aurorymoth', 'Aurorymoth', ['bug', 'fairy'], [70, 45, 60, 95, 80, 85], ['compoundeyes', null, 'serenegrace'], { stage: 3, final: true, learn: grubL, evoMove: 'fairybreeze', tmx: ['bug', 'fairy', 'psychic', 'grass', 'flying'], h: 1.1, w: 12.5, cat: 'Aurora Moth', color: 'pink',
    dex: 'Its wings scatter scales that shimmer like the northern lights. Couples in Fernwick consider it lucky to see one on a first date.' });

  const beeL = L(1, 'tackle', 1, 'leer', 6, 'bugbite', 10, 'headbutt', 13, 'rapidjab', 16, 'pinbarrage', 20, 'braceup', 24, 'crosscut', 28, 'wallbreaker', 32, 'rockslide', 36, 'closecombat', 42, 'megahorn');
  S('beetlet', 'Beetlet', ['bug'], [50, 60, 65, 20, 40, 35], ['shellarmor', null, 'momentum'], { learn: beeL, evo: [{ to: 'scarabrute', lvl: 24 }], tmx: ['bug', 'fighting', 'rock'], h: .4, w: 9, cat: 'Beetle', color: 'blue',
    dex: 'Kids in Whisperwood hold Beetlet sumo tournaments. The winner gets bragging rights and the loser gets a nap.' });
  S('scarabrute', 'Scarabrute', ['bug', 'fighting'], [80, 110, 100, 30, 70, 60], ['shellarmor', null, 'momentum'], { stage: 2, final: true, learn: beeL, evoMove: 'closecombat', tmx: ['bug', 'fighting', 'rock', 'ground', 'steel'], h: 1.3, w: 68, cat: 'Brawler Beetle', color: 'blue',
    dex: 'It can lift fifty times its own weight with its horn. It respects only opponents who can push it back.' });

  const volL = L(1, 'tackle', 1, 'growl', 5, 'zap', 8, 'bite', 11, 'joltnuzzle', 14, 'spark', 18, 'thunderfang', 21, 'staticwave', 26, 'crunch', 30, 'voltdash', 34, 'surgetackle', 38, 'thunderbolt', 44, 'thunder');
  S('voltpup', 'Voltpup', ['electric'], [45, 55, 40, 50, 40, 70], ['static', null, 'strongjaw'], { learn: volL, evo: [{ to: 'stormhound', lvl: 26 }], tmx: ['electric', 'normal', 'dark'], h: .5, w: 8.8, cat: 'Spark Pup', color: 'yellow',
    dex: 'It wags its tail so hard it builds up static. Petting a happy Voltpup is a hair-raising experience.' });
  S('stormhound', 'Stormhound', ['electric', 'dark'], [70, 95, 65, 85, 65, 105], ['static', null, 'strongjaw'], { stage: 2, final: true, learn: volL, evoMove: 'crunch', tmx: ['electric', 'normal', 'dark', 'fire', 'ice'], h: 1.2, w: 45, cat: 'Thunder Hound', color: 'yellow',
    dex: 'It howls before lightning strikes. Packs of Stormhound race across the plains during storms, bolts dancing on their fur.' });

  const mosL = L(1, 'tackle', 1, 'tailwhip', 4, 'vinewhip', 7, 'quickstrike', 11, 'bulletseed', 15, 'lowsweep', 19, 'seedbomb', 22, 'drainpunch', 28, 'leafblade', 32, 'braceup', 38, 'closecombat', 44, 'timberslam');
  S('mossbun', 'Mossbun', ['grass'], [45, 50, 42, 40, 45, 60], ['herbivore', 'runaway', 'grit'], { learn: mosL, evo: [{ to: 'thornhare', lvl: 22 }], tmx: ['grass', 'normal', 'fighting'], h: .4, w: 4, cat: 'Moss Bunny', color: 'green',
    dex: 'Soft moss grows on its back. It sits perfectly still in meadows, and more than one hiker has tried to sit on it.' });
  S('thornhare', 'Thornhare', ['grass', 'fighting'], [75, 100, 70, 55, 65, 100], ['herbivore', 'runaway', 'grit'], { stage: 2, final: true, learn: mosL, evoMove: 'drainpunch', tmx: ['grass', 'normal', 'fighting', 'ground'], h: 1.1, w: 30, cat: 'Kickboxer', color: 'green',
    dex: 'Its powerful legs are wrapped in thorny vines. A single kick from a Thornhare can knock down a fence post.' });

  // ================================================================ WHISPERWOOD & BEYOND
  const bloL = L(1, 'poisonsting', 1, 'tackle', 5, 'acidspray', 8, 'mudsplash', 12, 'sludge', 16, 'toxic', 20, 'venomshock', 24, 'acidarmor', 30, 'sludgebomb', 34, 'venomspikes', 40, 'gunkshot');
  S('blotch', 'Blotch', ['poison'], [55, 50, 50, 55, 50, 35], ['poisonpoint', null, 'regenerator'], { learn: bloL, evo: [{ to: 'sludgor', lvl: 28 }], tmx: ['poison', 'dark', 'ground'], h: .4, w: 12, cat: 'Ink Blob', color: 'purple',
    dex: 'A blob of living ink that seeps from polluted puddles. Oddly, it cleans the water it lives in over time.' });
  S('sludgor', 'Sludgor', ['poison'], [95, 80, 85, 90, 85, 45], ['poisonpoint', null, 'regenerator'], { stage: 2, final: true, learn: bloL, tmx: ['poison', 'dark', 'ground', 'fire', 'normal'], h: 1.2, w: 80, cat: 'Sludge', color: 'purple',
    dex: 'It absorbs toxins and grows larger. Galvan Harbor employs a few to keep the docks clean, and pays them in old batteries.' });

  const gliL = L(1, 'fairybreeze', 1, 'growl', 5, 'charm', 9, 'kissdrain', 12, 'sweetkiss', 16, 'charmvoice', 20, 'lightscreen', 23, 'psybeam', 27, 'moonlight', 31, 'radiantflash', 36, 'calmmind', 40, 'moonblast');
  S('glimmer', 'Glimmer', ['fairy'], [45, 30, 45, 55, 60, 50], ['cutecharm', 'illuminate', 'magicguard'], { learn: gliL, evo: [{ to: 'luminelle', bond: 200 }], tmx: ['fairy', 'psychic', 'normal'], h: .3, w: 1.2, cat: 'Twinkle', color: 'pink', gender: .25,
    dex: 'It glows softly when it trusts someone. Lost children in Whisperwood tell of a small light that led them home.' });
  S('luminelle', 'Luminelle', ['fairy'], [75, 45, 70, 100, 105, 80], ['cutecharm', 'illuminate', 'magicguard'], { stage: 2, final: true, learn: gliL, tmx: ['fairy', 'psychic', 'normal', 'fire', 'electric'], h: 1.0, w: 8, cat: 'Starlight', color: 'pink', gender: .25,
    dex: 'Its dance leaves ribbons of light in the air. It evolves only when it has come to truly love its Tamer.' });

  const digL = L(1, 'scratch', 1, 'mudsplash', 6, 'furyswipes', 10, 'bulldoze', 14, 'rocktomb', 18, 'slash', 24, 'drillrun', 28, 'spikes', 34, 'earthquake', 40, 'stoneedge');
  S('digmole', 'Digmole', ['ground'], [45, 65, 45, 30, 40, 60], ['sandrush', null, 'toughclaws'], { learn: digL, evo: [{ to: 'terramole', lvl: 26 }], tmx: ['ground', 'rock', 'normal'], h: .4, w: 7, cat: 'Mole', color: 'brown',
    dex: 'It surfaces with a pop and a spray of dirt, blinks at the sun, and dives right back down. It is terribly nearsighted.' });
  S('terramole', 'Terramole', ['ground'], [70, 105, 70, 45, 65, 95], ['sandrush', null, 'toughclaws'], { stage: 2, final: true, learn: digL, tmx: ['ground', 'rock', 'normal', 'steel', 'dark'], h: 1.0, w: 40, cat: 'Driller', color: 'brown',
    dex: 'Its spade claws spin like drills. Terramole tunnels have been used as shortcuts by miners for generations.' });

  const pebL = L(1, 'tackle', 1, 'ironwall', 5, 'rockthrow', 8, 'mudsplash', 12, 'rocktomb', 16, 'bulldoze', 20, 'rockbarrage', 24, 'shardtrap', 28, 'rockslide', 36, 'earthquake', 42, 'stoneedge', 48, 'skullcrash');
  S('pebblin', 'Pebblin', ['rock', 'ground'], [40, 80, 100, 30, 30, 20], ['sturdy', null, 'sandspout'], { gender: -1, learn: pebL, evo: [{ to: 'bouldrok', lvl: 25 }], tmx: ['rock', 'ground'], h: .3, w: 20, cat: 'Pebble', color: 'gray', growth: 'mslow',
    dex: 'Often mistaken for an ordinary rock, until it rolls off. Pebblin gather in piles to gossip in the sun.' });
  S('bouldrok', 'Bouldrok', ['rock', 'ground'], [55, 95, 115, 45, 45, 35], ['sturdy', null, 'sandspout'], { stage: 2, gender: -1, learn: pebL, evo: [{ to: 'craggolem', item: 'linkcord' }], tmx: ['rock', 'ground', 'fighting'], h: 1.0, w: 105, cat: 'Boulder', color: 'gray', growth: 'mslow',
    dex: 'It rolls down mountain paths at frightening speed. A Link Cord is said to rouse the ancient power sleeping in its core.' });
  S('craggolem', 'Craggolem', ['rock', 'ground'], [80, 120, 130, 55, 65, 45], ['sturdy', null, 'sandspout'], { stage: 3, final: true, gender: -1, learn: pebL, tmx: ['rock', 'ground', 'fighting', 'steel', 'fire'], h: 1.7, w: 300, cat: 'Crag Golem', color: 'gray', growth: 'mslow',
    dex: 'A walking cliffside. It sheds its outer stone once a year, and the shed shells are prized as building material.' });

  const scrL = L(1, 'scratch', 1, 'leer', 5, 'rapidjab', 9, 'lowsweep', 13, 'chop', 17, 'focusup', 21, 'braceup', 25, 'drainpunch', 30, 'zenstrike', 34, 'mindblade', 40, 'closecombat');
  S('scrapmonk', 'Scrapmonk', ['fighting'], [55, 70, 45, 35, 45, 60], ['innerfocus', null, 'ironfist'], { learn: scrL, evo: [{ to: 'grandmonk', lvl: 30 }], tmx: ['fighting', 'normal', 'rock', 'dark'], h: .6, w: 18, cat: 'Scrapper', color: 'brown',
    dex: 'A rowdy monkey that picks fights to prove itself. It trains by punching waterfalls, and usually loses.' });
  S('grandmonk', 'Grandmonk', ['fighting', 'psychic'], [80, 110, 70, 70, 75, 85], ['innerfocus', null, 'ironfist'], { stage: 2, final: true, learn: scrL, evoMove: 'zenstrike', tmx: ['fighting', 'normal', 'rock', 'dark', 'psychic', 'ground'], h: 1.4, w: 60, cat: 'Sage Fist', color: 'brown',
    dex: 'After years of training it found inner peace, and hits harder than ever. It meditates atop mountain shrines for weeks.' });

  S('flopfin', 'Flopfin', ['water'], [30, 15, 50, 15, 25, 70], ['swiftswim', null, 'swiftswim'], { learn: L(1, 'flop', 15, 'tackle'), evo: [{ to: 'riptalon', lvl: 20 }], tmx: [], h: .6, w: 7, cat: 'Flounder', color: 'orange', catch: 255, exp: 40, growth: 'slow',
    dex: 'Famously useless. It flops. It flops some more. Fishermen toss it back out of pity. Scholars insist it has a secret.' });
  S('riptalon', 'Riptalon', ['water', 'dragon'], [95, 125, 79, 60, 100, 81], ['menace', null, 'momentum'], { stage: 2, final: true, growth: 'slow', learn: L(1, 'bite', 20, 'bite', 23, 'dragonbreath', 26, 'tidelash', 30, 'cascade', 34, 'crunch', 38, 'wyrmdance', 42, 'dragonrush', 48, 'outrage', 52, 'hydropump'), evoMove: 'bite', tmx: ['water', 'dragon', 'dark', 'ice', 'ground', 'fire', 'electric'], h: 5.8, w: 210, cat: 'Maelstrom', color: 'blue',
    dex: 'The Flopfin\'s secret: a furious sea dragon that churns whirlpools with its tail. It never forgives the fishers who laughed.' });

  const gearL = L(1, 'tackle', 1, 'zap', 6, 'metalclaw', 10, 'staticwave', 14, 'spark', 18, 'ironhead', 22, 'voltdash', 26, 'flashcannon', 30, 'ironwall', 34, 'thunderbolt', 38, 'discharge', 44, 'thunder');
  S('gearling', 'Gearling', ['steel', 'electric'], [50, 55, 70, 70, 50, 45], ['levitate_steel', null, 'clearbody'], { gender: -1, learn: gearL, evo: [{ to: 'dynamech', lvl: 30 }], tmx: ['steel', 'electric', 'normal'], h: .4, w: 15, cat: 'Cog', color: 'gray',
    dex: 'Gearling spin constantly to generate electricity. Engineers at Crane Dynamics study them to build better batteries.' });
  S('dynamech', 'Dynamech', ['steel', 'electric'], [70, 75, 105, 105, 75, 70], ['levitate_steel', null, 'clearbody'], { stage: 2, final: true, gender: -1, learn: gearL, tmx: ['steel', 'electric', 'normal', 'psychic'], h: 1.2, w: 95, cat: 'Dynamo', color: 'gray',
    dex: 'Its interlocking gears generate enough power for a small town. It hums a single low note when it is content.' });

  const wisL = L(1, 'scratch', 1, 'astonish', 5, 'lick', 9, 'confuseray', 13, 'shadowsneak', 17, 'bite', 21, 'hex', 25, 'shadowclaw', 29, 'wispflame', 33, 'shadowball', 37, 'nightslash', 41, 'darkpulse', 45, 'foulplay');
  S('wispurr', 'Wispurr', ['ghost'], [45, 55, 40, 55, 45, 70], ['frisk', null, 'prankster'], { learn: wisL, evo: [{ to: 'phantomane', item: 'duskstone' }], tmx: ['ghost', 'dark', 'normal', 'psychic'], h: .4, w: 2.2, cat: 'Ghost Cat', color: 'purple',
    dex: 'A cat that wandered too far one foggy night and never quite came back. It still purrs, but it makes no sound.' });
  S('phantomane', 'Phantomane', ['ghost', 'dark'], [75, 100, 70, 95, 70, 100], ['frisk', null, 'prankster'], { stage: 2, final: true, learn: wisL, evoMove: 'darkpulse', tmx: ['ghost', 'dark', 'normal', 'psychic', 'fire'], h: 1.4, w: 45, cat: 'Phantom Lion', color: 'purple',
    dex: 'Its mane is made of shadow and cold flame. It prowls ruins at midnight, guarding treasures only it remembers.' });

  const maskL = L(1, 'astonish', 1, 'confusion', 7, 'nightshade', 11, 'hypnosis', 15, 'psybeam', 19, 'hex', 24, 'calmmind', 28, 'extrasense', 32, 'shadowball', 36, 'psychic', 40, 'twistroom', 44, 'storedpower');
  S('maskling', 'Maskling', ['ghost', 'psychic'], [40, 40, 55, 65, 55, 55], ['synchronize', null, 'magicguard'], { gender: -1, learn: maskL, evo: [{ to: 'masquerail', lvl: 34 }], tmx: ['ghost', 'psychic', 'fairy', 'dark'], h: .5, w: 1.5, cat: 'Mask', color: 'white',
    dex: 'A festival mask that came alive after decades of dances. It tries on different expressions to match your mood.' });
  S('masquerail', 'Masquerail', ['ghost', 'psychic'], [70, 60, 90, 110, 95, 70], ['synchronize', null, 'magicguard'], { stage: 2, final: true, gender: -1, learn: maskL, tmx: ['ghost', 'psychic', 'fairy', 'dark'], h: 1.6, w: 20, cat: 'Masquerade', color: 'white',
    dex: 'It wears a mask for every emotion it has ever felt. No one knows what is beneath them, and it prefers it that way.' });

  // ================================================================ FROSTPEAK
  const penL = L(1, 'peck', 1, 'growl', 5, 'iceshard', 9, 'icygust', 13, 'wingslash', 17, 'icefang', 21, 'rapidjab', 25, 'iciclebarrage', 29, 'drainpunch', 32, 'closecombat', 36, 'icicledrop', 40, 'braceup');
  S('pengrost', 'Pengrost', ['ice'], [50, 55, 50, 45, 50, 55], ['slushrush', null, 'innerfocus'], { learn: penL, evo: [{ to: 'frostemper', lvl: 32 }], tmx: ['ice', 'water', 'normal'], h: .6, w: 12, cat: 'Penguin', color: 'blue',
    dex: 'It toboggans down snowy slopes on its belly, squawking with joy. Pengrost chicks huddle in circles that slowly rotate.' });
  S('frostemper', 'Frostemper', ['ice', 'fighting'], [80, 105, 75, 60, 70, 95], ['slushrush', null, 'innerfocus'], { stage: 2, final: true, learn: penL, evoMove: 'closecombat', tmx: ['ice', 'water', 'normal', 'fighting'], h: 1.5, w: 60, cat: 'Emperor', color: 'blue',
    dex: 'A proud penguin warrior with fists of solid ice. It challenges blizzards to fistfights, and claims to win every one.' });

  const icuL = L(1, 'scratch', 1, 'growl', 6, 'furyswipes', 10, 'icefang', 14, 'bulldoze', 18, 'slash', 22, 'iceshard', 26, 'icicledrop', 30, 'braceup', 34, 'earthquake', 40, 'drumup', 46, 'closecombat');
  S('icicub', 'Icicub', ['ice'], [60, 65, 55, 30, 45, 40], ['thickfat', null, 'icebody'], { learn: icuL, evo: [{ to: 'glaciursa', lvl: 34 }], tmx: ['ice', 'normal', 'ground'], h: .6, w: 25, cat: 'Snow Cub', color: 'white',
    dex: 'Its nose is always runny, and the drip freezes into icicles. It loves honey, but it has never actually found any.' });
  S('glaciursa', 'Glaciursa', ['ice', 'ground'], [100, 115, 85, 45, 75, 60], ['thickfat', null, 'icebody'], { stage: 2, final: true, learn: icuL, evoMove: 'earthquake', tmx: ['ice', 'normal', 'ground', 'fighting', 'rock', 'dark'], h: 2.4, w: 290, cat: 'Glacier Bear', color: 'white',
    dex: 'A colossal bear whose back is a slab of glacier. When it stomps, avalanches follow. It is gentle with its cubs.' });

  const snoL = L(1, 'fairybreeze', 1, 'growl', 5, 'icygust', 9, 'kissdrain', 13, 'auroraray', 17, 'charmvoice', 21, 'frostbreath', 25, 'moonlight', 29, 'icebeam', 33, 'radiantflash', 37, 'auroraveil', 41, 'moonblast', 45, 'blizzard');
  S('snowlet', 'Snowlet', ['ice', 'fairy'], [45, 30, 45, 55, 65, 55], ['icebody', null, 'frostcall'], { learn: snoL, evo: [{ to: 'aurorelle', item: 'froststone' }], tmx: ['ice', 'fairy', 'water'], h: .3, w: .8, cat: 'Snowflake', color: 'white', gender: .3,
    dex: 'It drifts down with the first snow of winter. No two Snowlet have the same crystal pattern on their skirts.' });
  S('aurorelle', 'Aurorelle', ['ice', 'fairy'], [70, 50, 70, 100, 105, 90], ['icebody', null, 'frostcall'], { stage: 2, final: true, learn: snoL, tmx: ['ice', 'fairy', 'water', 'psychic'], h: 1.3, w: 11, cat: 'Aurora', color: 'white', gender: .3,
    dex: 'Its gown ripples like the aurora. On clear winter nights it dances above Frostpeak, and the sky dances with it.' });

  // ================================================================ PSEUDO-LEGENDARY
  const nimL = L(1, 'tackle', 1, 'leer', 5, 'twister', 10, 'dragonbreath', 14, 'headbutt', 20, 'dragonclaw', 24, 'agility', 28, 'dragonpulse', 34, 'wyrmdance', 38, 'dragonrush', 44, 'airslash', 52, 'hurricane', 56, 'outrage', 60, 'dracometeor');
  S('nimbling', 'Nimbling', ['dragon'], [45, 60, 45, 50, 45, 55], ['naturalcure', null, 'multiscale'], { growth: 'slow', learn: nimL, evo: [{ to: 'stratowyrm', lvl: 30 }], tmx: ['dragon', 'normal', 'water', 'fire'], h: .6, w: 9, cat: 'Cloud Wyrm', color: 'blue',
    dex: 'A baby dragon born inside a cumulus cloud. It sometimes falls out on windy days and has to be carried back up.' });
  S('stratowyrm', 'Stratowyrm', ['dragon'], [65, 85, 70, 75, 65, 70], ['naturalcure', null, 'multiscale'], { stage: 2, growth: 'slow', learn: nimL, evo: [{ to: 'tempestral', lvl: 50 }], tmx: ['dragon', 'normal', 'water', 'fire', 'electric'], h: 2.0, w: 60, cat: 'Stratus Wyrm', color: 'blue',
    dex: 'It coils through the sky trailing mist. Watching it grow its wings is a lifelong dream for Skyreach\'s dragon tamers.' });
  S('tempestral', 'Tempestral', ['dragon', 'flying'], [91, 124, 90, 110, 85, 100], ['naturalcure', null, 'multiscale'], { stage: 3, final: true, growth: 'slow', learn: nimL, evoMove: 'airslash', tmx: ['dragon', 'normal', 'water', 'fire', 'electric', 'flying', 'ground', 'steel'], h: 3.9, w: 190, cat: 'Tempest', color: 'blue',
    dex: 'The sovereign of storms. A single beat of its wings can disperse a hurricane, or summon one. It answers only to the worthy.' });

  const owlL = L(1, 'peck', 1, 'growl', 5, 'confusion', 9, 'hypnosis', 12, 'gust', 16, 'psybeam', 22, 'airslash', 26, 'reflect', 30, 'extrasense', 34, 'roost', 38, 'psychic', 42, 'calmmind', 48, 'hurricane');
  S('oddowl', 'Oddowl', ['psychic', 'flying'], [55, 40, 45, 55, 55, 50], ['insomnia', 'keeneye', 'tintedlens'], { learn: owlL, evo: [{ to: 'hootsage', lvl: 28 }], tmx: ['psychic', 'flying', 'normal', 'ghost'], h: .5, w: 5, cat: 'Owlet', color: 'brown',
    dex: 'It tilts its head at impossible angles. Oddowl can read the thoughts of whoever looks it in the eye.' });
  S('hootsage', 'Hootsage', ['psychic', 'flying'], [85, 55, 70, 95, 90, 85], ['insomnia', 'keeneye', 'tintedlens'], { stage: 2, final: true, learn: owlL, tmx: ['psychic', 'flying', 'normal', 'ghost', 'dark', 'fairy'], h: 1.4, w: 30, cat: 'Sage Owl', color: 'brown',
    dex: 'Its spectacle-like markings amplify its psychic power. Scholars in Duskmere consult Hootsage before writing books.' });

  const rasL = L(1, 'scratch', 1, 'leer', 1, 'quickstrike', 6, 'bite', 10, 'furyswipes', 14, 'knockaway', 18, 'taunt', 22, 'nightslash', 26, 'slash', 30, 'ambush', 34, 'partingtaunt', 38, 'foulplay', 42, 'doubleedge');
  S('rascoon', 'Rascoon', ['dark'], [45, 55, 45, 45, 45, 60], ['pickup', null, 'prankster'], { learn: rasL, evo: [{ to: 'banditoon', lvl: 26 }], tmx: ['dark', 'normal', 'water'], h: .5, w: 7, cat: 'Masked', color: 'gray',
    dex: 'It sneaks into campsites to steal snacks, then washes them carefully in a stream before eating. Very polite thief.' });
  S('banditoon', 'Banditoon', ['dark', 'normal'], [75, 90, 70, 65, 70, 100], ['pickup', null, 'prankster'], { stage: 2, final: true, learn: rasL, tmx: ['dark', 'normal', 'water', 'ground', 'ice', 'fighting'], h: 1.1, w: 30, cat: 'Bandit', color: 'gray',
    dex: 'It runs a network of Rascoon thieves and takes a cut of every heist. It always leaves a small trinket in exchange.' });

  S('armadrill', 'Armadrill', ['steel', 'ground'], [70, 95, 120, 40, 60, 45], ['sturdy', null, 'ironbarbs'], { learn: L(1, 'scratch', 1, 'ironwall', 6, 'metalclaw', 10, 'bulldoze', 14, 'rapidspin', 18, 'rocktomb', 24, 'ironhead', 30, 'drillrun', 36, 'shardtrap', 42, 'earthquake', 48, 'irontail'), tmx: ['steel', 'ground', 'rock', 'normal', 'fighting'], h: .9, w: 88, cat: 'Armored', color: 'gray', catch: 90,
    dex: 'It curls into a steel ball and rolls through rock like it\'s butter. Miners follow Armadrill to find ore veins.' });

  const magL = L(1, 'ember', 1, 'tackle', 5, 'rockthrow', 9, 'flamerush', 13, 'ancientpower', 17, 'lavasurge', 21, 'rocktomb', 25, 'powergem', 30, 'flamethrower', 36, 'earthpower', 42, 'fireblast', 48, 'shellbreak');
  S('magmite', 'Magmite', ['fire', 'rock'], [50, 45, 65, 60, 55, 20], ['flamebody', 'magmaarmor', 'sturdy'], { learn: magL, evo: [{ to: 'volcanoth', lvl: 30 }], tmx: ['fire', 'rock', 'ground'], h: .4, w: 30, cat: 'Lava Slug', color: 'red',
    dex: 'A slug of cooling lava. It leaves a trail of fresh obsidian wherever it crawls. Its body is hot enough to fry eggs.' });
  S('volcanoth', 'Volcanoth', ['fire', 'rock'], [80, 70, 110, 100, 85, 35], ['flamebody', 'magmaarmor', 'sturdy'], { stage: 2, final: true, learn: magL, tmx: ['fire', 'rock', 'ground', 'normal'], h: 1.6, w: 250, cat: 'Volcano', color: 'red',
    dex: 'A living volcano that erupts when angered. The hot springs of Cindervale are warmed by a colony slumbering beneath.' });

  const ejL = L(1, 'peck', 1, 'ember', 6, 'quickstrike', 10, 'gust', 14, 'flamerush', 18, 'wingslash', 22, 'aerialace', 26, 'heatwave', 30, 'airslash', 35, 'bravedive', 40, 'flamethrower', 46, 'blazecharge');
  S('emberjay', 'Emberjay', ['fire', 'flying'], [45, 55, 40, 45, 40, 65], ['flamebody', null, 'sunchaser'], { learn: ejL, evo: [{ to: 'cinderwing', lvl: 30 }], tmx: ['fire', 'flying', 'normal'], h: .4, w: 3, cat: 'Spark Jay', color: 'red',
    dex: 'Its tail feathers smoulder like incense. Emberjay nest in chimneys, which homeowners find either charming or alarming.' });
  S('cinderwing', 'Cinderwing', ['fire', 'flying'], [75, 90, 65, 85, 65, 100], ['flamebody', null, 'sunchaser'], { stage: 2, final: true, learn: ejL, tmx: ['fire', 'flying', 'normal', 'dark'], h: 1.4, w: 28, cat: 'Cinder Bird', color: 'red',
    dex: 'It flies through volcanic plumes to bathe in the heat. Its wingbeats scatter glowing cinders like fireworks.' });

  const clwL = L(1, 'scratch', 1, 'watergun', 5, 'tailwhip', 8, 'bubblejet', 12, 'metalclaw', 16, 'rocktomb', 20, 'crushwave', 24, 'crosscut', 28, 'rockslide', 32, 'shellbreak', 36, 'stoneedge', 42, 'tidelash');
  S('clawdle', 'Clawdle', ['water'], [45, 65, 70, 35, 35, 40], ['hypercutter', 'shellarmor', 'toughclaws'], { learn: clwL, evo: [{ to: 'crustank', lvl: 28 }], tmx: ['water', 'rock', 'normal'], h: .3, w: 6, cat: 'Pincer', color: 'orange',
    dex: 'It waves its big claw to challenge anything that moves: gulls, waves, its own reflection.' });
  S('crustank', 'Crustank', ['water', 'rock'], [75, 110, 120, 45, 60, 50], ['hypercutter', 'shellarmor', 'toughclaws'], { stage: 2, final: true, learn: clwL, tmx: ['water', 'rock', 'normal', 'ground', 'steel', 'dark', 'ice'], h: 1.2, w: 120, cat: 'Fortress Crab', color: 'orange',
    dex: 'Its shell is thicker than a castle wall. Crustank pinch-fight over the best tide pools every spring.' });

  S('jellume', 'Jellume', ['water', 'electric'], [80, 40, 55, 90, 90, 65], ['voltsponge', 'absorbent', 'raindish'], { learn: L(1, 'watergun', 1, 'zap', 6, 'staticwave', 10, 'bubblejet', 18, 'scald', 22, 'voltdash', 26, 'thunderbolt', 30, 'recover', 34, 'surf', 38, 'discharge', 44, 'hydropump', 50, 'thunder'), tmx: ['water', 'electric', 'ice', 'psychic', 'poison'], h: 1.0, w: 12, cat: 'Glowjelly', color: 'blue', catch: 90, gender: -1,
    dex: 'Blooms of Jellume light up the harbor on summer nights. Touching one feels like licking a battery.' });

  const dbL = L(1, 'bite', 1, 'leer', 5, 'gust', 9, 'quickstrike', 13, 'wingslash', 17, 'snarl', 21, 'airslash', 25, 'nightslash', 29, 'taunt', 32, 'acrobatics', 36, 'darkpulse', 41, 'bravedive', 46, 'hurricane');
  S('duskbat', 'Duskbat', ['dark', 'flying'], [40, 45, 35, 40, 35, 70], ['innerfocus', null, 'tintedlens'], { learn: dbL, evo: [{ to: 'nightwing', lvl: 27 }], tmx: ['dark', 'flying', 'normal'], h: .3, w: 2, cat: 'Dusk Bat', color: 'purple',
    dex: 'Clouds of Duskbat leave caves at sunset. They navigate by echoes and by an uncanny sense for where snacks are.' });
  S('nightwing', 'Nightwing', ['dark', 'flying'], [75, 85, 65, 80, 70, 115], ['innerfocus', null, 'tintedlens'], { stage: 2, final: true, learn: dbL, tmx: ['dark', 'flying', 'normal', 'poison', 'ghost'], h: 1.5, w: 26, cat: 'Night Flyer', color: 'purple',
    dex: 'It hunts on moonless nights, gliding so quietly that its prey only notices the shadow passing over the stars.' });

  const shrL = L(1, 'absorb', 1, 'poisonsting', 5, 'stunspore', 8, 'leechseed', 11, 'megadrain', 14, 'sleeppowder', 17, 'sludge', 21, 'seedbomb', 25, 'gigadrain', 30, 'venomshock', 34, 'sludgebomb', 42, 'energyball', 46, 'gunkshot');
  S('shroomie', 'Shroomie', ['grass', 'poison'], [55, 55, 55, 55, 55, 30], ['poisonpoint', null, 'regenerator'], { learn: shrL, evo: [{ to: 'fungore', lvl: 28 }], tmx: ['grass', 'poison', 'normal'], h: .3, w: 3, cat: 'Mushroom', color: 'red',
    dex: 'It pretends to be an ordinary toadstool, then puffs spores in the face of anyone who tries to pick it.' });
  S('fungore', 'Fungore', ['grass', 'poison'], [85, 90, 85, 80, 85, 50], ['poisonpoint', null, 'regenerator'], { stage: 2, final: true, learn: shrL, tmx: ['grass', 'poison', 'normal', 'dark', 'ground'], h: 1.2, w: 50, cat: 'Sporecap', color: 'red',
    dex: 'Its cap is covered in glowing spores. The underground mycelium of a single Fungore can span a whole forest.' });

  const lilL = L(1, 'absorb', 1, 'watergun', 5, 'growl', 9, 'bubblejet', 13, 'megadrain', 17, 'raincall', 21, 'charmleaf', 25, 'gigadrain', 29, 'surf', 33, 'energyball', 37, 'hydropump', 41, 'leafstorm');
  S('lillipad', 'Lillipad', ['water', 'grass'], [50, 40, 50, 55, 60, 50], ['swiftswim', 'raindish', 'absorbent'], { learn: lilL, evo: [{ to: 'lilyking', item: 'leafstone' }], tmx: ['water', 'grass', 'ice'], h: .4, w: 5, cat: 'Pad Frog', color: 'green',
    dex: 'A frog wearing a lily pad as a hat. In rain it dances and sings in croaky choruses that go on all night.' });
  S('lilyking', 'Lilyking', ['water', 'grass'], [85, 60, 75, 95, 100, 70], ['swiftswim', 'raindish', 'absorbent'], { stage: 2, final: true, learn: lilL, tmx: ['water', 'grass', 'ice', 'fairy', 'normal'], h: 1.3, w: 45, cat: 'Pond King', color: 'green',
    dex: 'The blossom on its head is its crown. Lilyking rule over ponds benevolently and settle disputes between Lillipad.' });

  const snzL = L(1, 'tackle', 4, 'growl', 8, 'headbutt', 12, 'rest', 16, 'bodyslam', 20, 'facade', 24, 'braceup', 28, 'crunch', 32, 'drumup', 36, 'doubleedge', 42, 'gigaimpact');
  S('snoozle', 'Snoozle', ['normal'], [110, 60, 40, 30, 60, 15], ['thickfat', 'immunity', 'grit'], { growth: 'slow', learn: snzL, evo: [{ to: 'slumbruin', lvl: 30 }], tmx: ['normal', 'fighting', 'ground', 'ice', 'fire', 'electric'], h: .7, w: 90, cat: 'Napper', color: 'brown', catch: 50,
    dex: 'It eats, sleeps, and eats in its sleep. A Snoozle can nap through a thunderstorm on a cliff edge without rolling off.' });
  S('slumbruin', 'Slumbruin', ['normal'], [160, 110, 65, 65, 110, 30], ['thickfat', 'immunity', 'grit'], { stage: 2, final: true, growth: 'slow', learn: snzL, tmx: ['normal', 'fighting', 'ground', 'ice', 'fire', 'electric', 'dark', 'rock', 'water'], h: 2.2, w: 460, cat: 'Sleeping Giant', color: 'brown', catch: 25,
    dex: 'When one naps across a road, traffic simply waits. It has been known to sleep for a whole season and wake up grumpy.' });

  // ================================================================ SHIFTAIL FAMILY
  const shL = L(1, 'tackle', 1, 'tailwhip', 5, 'quickstrike', 10, 'bite', 15, 'swift', 20, 'headbutt', 25, 'bondstrike', 30, 'doubleedge');
  S('shiftail', 'Shiftail', ['normal'], [55, 55, 50, 45, 65, 55], ['runaway', null, 'adaptability'], {
    gender: .875, growth: 'mfast', learn: shL, tmx: ['normal'], h: .4, w: 6, cat: 'Adaptation', color: 'brown', catch: 45,
    evo: [{ to: 'emberail', item: 'flamestone' }, { to: 'tidetail', item: 'tidestone' }, { to: 'stormtail', item: 'voltstone' }, { to: 'leaftail', item: 'leafstone' }, { to: 'frosttail', item: 'froststone' }, { to: 'lumitail', bond: 220, time: 'day' }, { to: 'umbratail', bond: 220, time: 'night' }],
    dex: 'Its unstable genes let it adapt to any environment. Seven different evolutions are known, and researchers suspect more.' });
  const eeon = (id, name, type, base, abil, mv, dex, tmx) => S(id, name, [type], base, abil, {
    stage: 2, final: true, gender: .875, learn: shL.concat(mv), evoMove: mv[0][1], tmx: ['normal', type].concat(tmx || []), h: 1, w: 25, cat: 'Adaptation', color: 'brown', catch: 45, dex });
  eeon('emberail', 'Emberail', 'fire', [65, 115, 60, 95, 90, 100], ['flashfire', null, 'grit'], L(0, 'ember', 20, 'firefang', 25, 'flamerush', 30, 'wispflame', 35, 'flamethrower', 40, 'blazecharge'),
    'Its tail burns at 900 degrees but its fur stays fluffy. It curls its flaming tail around cold travelers.', ['dark']);
  eeon('tidetail', 'Tidetail', 'water', [130, 65, 60, 110, 95, 65], ['absorbent', null, 'raindish'], L(0, 'watergun', 20, 'bubblejet', 25, 'raincall', 30, 'scald', 35, 'surf', 40, 'hydropump'),
    'It can melt into water and become invisible. Fishermen feel it brush their boats like a friendly current.', ['ice']);
  eeon('stormtail', 'Stormtail', 'electric', [65, 65, 60, 110, 95, 130], ['voltsponge', null, 'lightningrod'], L(0, 'zap', 20, 'spark', 25, 'staticwave', 30, 'voltdash', 35, 'thunderbolt', 40, 'thunder'),
    'Its fur stands on end in needles of static. It is so fast it arrives before the thunder of its own footsteps.', ['flying']);
  eeon('leaftail', 'Leaftail', 'grass', [65, 110, 130, 60, 65, 95], ['herbivore', null, 'sunchaser'], L(0, 'vinewhip', 20, 'razorleaf', 25, 'leechseed', 30, 'leafblade', 35, 'wardance', 40, 'timberslam'),
    'Leaves sprout from its fur and turn with the sun. Its tail is a sharp frond that can slice a falling apple.', ['ground']);
  eeon('frosttail', 'Frosttail', 'ice', [65, 60, 110, 130, 95, 65], ['icebody', null, 'slushrush'], L(0, 'icygust', 20, 'auroraray', 25, 'frostbreath', 30, 'icebeam', 35, 'snowfall', 40, 'blizzard'),
    'It lowers the air around it to freezing and grows crystal spines. Snowflakes land on it and never melt.', ['water']);
  eeon('lumitail', 'Lumitail', 'psychic', [65, 65, 60, 130, 95, 110], ['synchronize', null, 'magicguard'], L(0, 'confusion', 20, 'psybeam', 25, 'calmmind', 30, 'extrasense', 35, 'psychic', 40, 'storedpower'),
    'Born from a Shiftail\'s deep love under the sun. The gem on its brow glows when it senses its Tamer\'s feelings.', ['fairy']);
  eeon('umbratail', 'Umbratail', 'dark', [95, 65, 110, 60, 130, 65], ['synchronize', null, 'innerfocus'], L(0, 'snarl', 20, 'payback', 25, 'taunt', 30, 'darkpulse', 35, 'foulplay', 40, 'moonlight'),
    'Born from a Shiftail\'s deep love under the moon. The rings on its fur glow softly and keep watch while its Tamer sleeps.', ['ghost']);

  // ================================================================ FOSSILS & SPECIALS
  S('pterock', 'Pterock', ['rock', 'flying'], [80, 105, 65, 60, 75, 130], ['pressure', null, 'toughclaws'], { stage: 1, final: true, growth: 'slow', learn: L(1, 'wingslash', 1, 'rockthrow', 1, 'bite', 10, 'rocktomb', 20, 'aerialace', 30, 'rockslide', 38, 'crunch', 44, 'stoneedge', 50, 'bravedive'), tmx: ['rock', 'flying', 'dragon', 'dark', 'ground', 'fire', 'ice', 'electric'], h: 1.8, w: 59, cat: 'Fossil Wing', color: 'gray', catch: 45, exp: 180,
    dex: 'An ancient sky predator revived from a Wing Fossil. Its shriek once terrified the whole region, or so the museum claims.' });
  S('raptorix', 'Raptorix', ['rock', 'dragon'], [85, 115, 85, 60, 70, 100], ['strongjaw', null, 'roughskin'], { stage: 1, final: true, growth: 'slow', learn: L(1, 'bite', 1, 'rockthrow', 10, 'rocktomb', 20, 'dragonclaw', 30, 'crunch', 36, 'rockslide', 42, 'dragonrush', 48, 'stoneedge', 54, 'outrage'), tmx: ['rock', 'dragon', 'ground', 'dark', 'fire', 'electric'], h: 2.0, w: 110, cat: 'Fossil Claw', color: 'brown', catch: 45, exp: 180,
    dex: 'A tyrant lizard revived from a Claw Fossil. It is extremely affectionate toward whoever revives it, and very bitey toward everyone else.' });
  const stgL = L(1, 'poisonsting', 1, 'silkspray', 5, 'bugbite', 9, 'pinbarrage', 13, 'focusup', 20, 'hitandrun', 24, 'agility', 28, 'crosscut', 32, 'poisonjab', 38, 'toxic', 44, 'gunkshot');
  S('stingle', 'Stingle', ['bug', 'poison'], [40, 55, 35, 20, 30, 60], ['swarm', null, 'poisonpoint'], { learn: stgL, evo: [{ to: 'waspear', lvl: 20 }], tmx: ['bug', 'poison'], h: .3, w: 2, cat: 'Stinger', color: 'yellow',
    dex: 'It buzzes loudly as a warning. Only foolish Tamers ignore it. Its stinger is tiny but surprisingly effective.' });
  S('waspear', 'Waspear', ['bug', 'poison'], [70, 95, 50, 45, 70, 110], ['swarm', null, 'poisonpoint'], { stage: 2, final: true, learn: stgL, evoMove: 'hitandrun', tmx: ['bug', 'poison', 'flying', 'dark'], h: 1.0, w: 25, cat: 'Lance Wasp', color: 'yellow',
    dex: 'It charges with lance-like stingers at blinding speed. Waspear hives are defended by a rotating guard of twenty.' });
  S('chimelle', 'Chimelle', ['steel', 'fairy'], [60, 70, 90, 80, 90, 60], ['prankster', null, 'soundproof'], { learn: L(1, 'charm', 1, 'metalclaw', 7, 'fairybreeze', 13, 'reflect', 17, 'lightscreen', 21, 'kissdrain', 25, 'flashcannon', 31, 'staticwave', 35, 'playrough', 41, 'soothingchime', 45, 'moonblast'), tmx: ['steel', 'fairy', 'psychic', 'electric'], h: .4, w: 3, cat: 'Bell Fairy', color: 'yellow', catch: 75, gender: .3,
    dex: 'It hangs from eaves like a wind chime and rings to warn of danger. Its song is said to soothe even a raging Riptalon.' });
  const mirL = L(1, 'watergun', 1, 'mudsplash', 5, 'tailwhip', 9, 'mudshot', 13, 'bubblejet', 17, 'bulldoze', 21, 'crushwave', 25, 'recover', 30, 'earthpower', 36, 'earthquake', 40, 'rest', 44, 'hydropump');
  S('mireel', 'Mireel', ['water', 'ground'], [60, 65, 60, 50, 55, 45], ['absorbent', null, 'unaware'], { learn: mirL, evo: [{ to: 'bogmaw', lvl: 30 }], tmx: ['water', 'ground', 'ice', 'normal'], h: .6, w: 14, cat: 'Mud Eel', color: 'blue',
    dex: 'It burrows into riverbank mud and waits, grinning, for snacks to drift by. It has absolutely no worries.' });
  S('bogmaw', 'Bogmaw', ['water', 'ground'], [100, 95, 90, 75, 80, 60], ['absorbent', null, 'unaware'], { stage: 2, final: true, learn: mirL, tmx: ['water', 'ground', 'ice', 'normal', 'poison', 'rock'], h: 1.5, w: 95, cat: 'Bog', color: 'blue',
    dex: 'It lounges in swamps with only its eyes above water. It is too relaxed to be bothered by anything, even boosts.' });
  S('zipsquee', 'Zipsquee', ['electric', 'flying'], [60, 55, 60, 75, 70, 100], ['static', null, 'lightningrod'], { learn: L(1, 'zap', 1, 'quickstrike', 5, 'tailwhip', 9, 'joltnuzzle', 13, 'spark', 17, 'aerialace', 21, 'voltdash', 25, 'airslash', 29, 'thunderbolt', 33, 'agility', 37, 'discharge', 43, 'thunder'), tmx: ['electric', 'flying', 'normal'], h: .4, w: 3.5, cat: 'Glider', color: 'yellow', catch: 120,
    dex: 'It glides between power poles on skin flaps, snacking on stray current. Galvan Harbor\'s grid engineers consider it a pest.' });
  S('coffret', 'Coffret', ['ghost', 'steel'], [55, 90, 110, 50, 80, 35], ['shellarmor', null, 'ironbarbs'], { gender: -1, learn: L(1, 'astonish', 1, 'bite', 8, 'metalclaw', 14, 'shadowsneak', 20, 'confuseray', 26, 'ironhead', 32, 'shadowclaw', 38, 'ironwall', 44, 'crunch'), tmx: ['ghost', 'steel', 'dark'], h: .6, w: 35, cat: 'Mimic Chest', color: 'brown', catch: 90,
    dex: 'It poses as a treasure chest in old ruins. When greedy hands reach in, it snaps shut. It keeps the coins it collects.' });

  // ================================================================ LEGENDARIES
  S('orrelume', 'Orrelume', ['water', 'psychic'], [120, 85, 105, 135, 130, 105], ['tidelight', null, 'tidelight'], {
    legend: true, stage: 1, final: true, gender: -1, growth: 'slow', catch: 10, exp: 320,
    learn: L(1, 'watergun', 1, 'confusion', 10, 'bubblejet', 20, 'psybeam', 30, 'surf', 40, 'calmmind', 45, 'psychic', 50, 'tidalhymn', 55, 'recover', 60, 'icebeam', 70, 'hydropump'),
    tmx: ['water', 'psychic', 'ice', 'fairy', 'normal', 'electric'], h: 12.4, w: 880, cat: 'Lodestar', color: 'blue',
    dex: 'The leviathan whose song is the Resonance itself. It sleeps beneath the Lodestar, and every bond between Echo and person echoes in its heart.' });
  S('nyxalis', 'Nyxalis', ['dark', 'dragon'], [100, 140, 95, 125, 95, 125], ['voidaura', null, 'voidaura'], {
    legend: true, stage: 1, final: true, gender: -1, growth: 'slow', catch: 5, exp: 330,
    learn: L(1, 'bite', 1, 'dragonbreath', 20, 'nightslash', 30, 'dragonclaw', 40, 'darkpulse', 50, 'wyrmdance', 60, 'voidrend', 65, 'dragonpulse', 70, 'outrage', 75, 'dracometeor'),
    tmx: ['dark', 'dragon', 'flying', 'fire', 'ground', 'rock', 'steel', 'psychic', 'ghost'], h: 6.6, w: 520, cat: 'Starless', color: 'black',
    dex: 'A dragon that fell with a comet long ago. It devours starlight, and on the night it wakes the sky above Starfall Crater goes dark.' });

  // ------------------------------------------------ validation / helpers
  for (const sp of Object.values(G.SPECIES)) {
    for (const [, mv] of sp.learn) if (!G.MOVES[mv]) throw new Error(sp.id + ' learns missing move ' + mv);
    for (const e of sp.evo) if (!G.SPECIES[e.to] && !['emberail', 'tidetail', 'stormtail', 'leaftail', 'frosttail', 'lumitail', 'umbratail'].includes(e.to)) throw new Error('bad evo ' + e.to);
    for (const a of sp.abil) if (a && !G.ABILITIES[a]) throw new Error(sp.id + ' missing ability ' + a);
  }
  // prevolution map
  for (const sp of Object.values(G.SPECIES)) for (const e of sp.evo) if (G.SPECIES[e.to]) G.SPECIES[e.to].pre = sp.id;
  G.baseForm = function (id) { let s = G.SPECIES[id]; while (s.pre) s = G.SPECIES[s.pre]; return s.id; };
  G.evoLine = function (id) {
    const root = G.baseForm(id), out = []; const walk = (x, d) => { out.push({ id: x, depth: d }); for (const e of G.SPECIES[x].evo) walk(e.to, d + 1); }; walk(root, 0); return out;
  };
  G.canLearnTM = function (spId, mv) {
    const sp = G.SPECIES[spId], m = G.MOVES[mv]; if (!sp || !m) return false;
    if (spId === 'flopfin' || spId === 'grubbit' || spId === 'cocoonet') return false;
    const universal = ['protect', 'rest', 'decoy', 'facade', 'toxic', 'bondstrike', 'raincall', 'sunshine'];
    if (universal.includes(mv)) return !(mv === 'toxic' && sp.types.includes('steel'));
    if ((mv === 'hyperbeam' || mv === 'gigaimpact')) return !!sp.final || sp.bst >= 420;
    if (sp.learn.some(l => l[1] === mv)) return true;
    const types = sp.types.concat(sp.tmx || []);
    if (!types.includes(m.type)) return false;
    // physical-only mons skip special coverage of non-STAB types and vice versa (keeps lists sensible)
    if (!sp.types.includes(m.type) && m.cat !== 'status') {
      const [, atk, , spa] = sp.base;
      if (m.cat === 'spec' && atk - spa > 35) return false;
      if (m.cat === 'phys' && spa - atk > 35) return false;
    }
    return true;
  };
})();
