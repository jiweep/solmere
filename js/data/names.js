'use strict';
// ============================================================================
//  Original names. Solmere's moves, abilities and items started from familiar genre names; the ones that
//  are distinctive to another franchise are renamed here, display text only: ids (and so saves, scripts,
//  learnsets and mechanics) stay the same. Plain words (Tackle, Ember, Earthquake, Potion) stay as they are.
//  Loaded after moves.js, abilities.js and items.js; any description or later text that mentions an old
//  name is rewritten through G.renameText.
// ============================================================================
(function () {
  const MOVES = {
    furyswipes: 'Frenzy Swipes', hypervoice: 'Booming Voice', hyperbeam: 'Overdrive Beam', gigaimpact: 'Colossal Impact',
    rapidspin: 'Whirl Spin', tailwhip: 'Tail Wag', hydropump: 'Torrent Blast', vinewhip: 'Vine Lash', megadrain: 'Deep Drain',
    gigadrain: 'Grand Drain', razorleaf: 'Keen Leaf', bulletseed: 'Seed Volley', seedbomb: 'Seed Burst', energyball: 'Verdant Sphere',
    leafblade: 'Leaf Saber', solarbeam: 'Sun Lance', leafstorm: 'Leaf Tempest', leechseed: 'Siphon Seed', sleeppowder: 'Drowse Dust',
    stunspore: 'Numb Spore', icebeam: 'Frost Beam', auroraveil: 'Polar Veil', drainpunch: 'Siphon Punch', focusblast: 'Focus Burst',
    sludgebomb: 'Sludge Lob', gunkshot: 'Muck Shot', drillrun: 'Drill Dive', earthpower: 'Ground Force', aerialace: 'Sky Strike',
    airslash: 'Wind Slice', drillpeck: 'Spiral Peck', psybeam: 'Psi Ray', storedpower: 'Pent-up Power', lightscreen: 'Light Wall',
    signalbeam: 'Signal Ray', bugbuzz: 'Wing Drone', megahorn: 'Great Horn', stickyweb: 'Snare Web', rocktomb: 'Rock Crypt',
    ancientpower: 'Primal Power', powergem: 'Gem Flare', stoneedge: 'Stone Spire', rockpolish: 'Stone Polish', shadowsneak: 'Shade Creep',
    shadowclaw: 'Shade Claw', shadowball: 'Gloom Sphere', nightshade: 'Dusk Shade', confuseray: 'Daze Ray', dragonpulse: 'Wyrm Pulse',
    dracometeor: 'Wyrm Meteor', nightslash: 'Dusk Slash', darkpulse: 'Umbral Pulse', foulplay: 'Dirty Trick', flashcannon: 'Steel Cannon',
    playrough: 'Roughhouse', moonblast: 'Moon Burst', sweetkiss: 'Sweet Wink', firefang: 'Flame Fang', thunderfang: 'Spark Fang',
    icefang: 'Frost Fang', poisonjab: 'Venom Jab', ironhead: 'Steel Skull', irontail: 'Steel Tail', heatwave: 'Heat Surge',
    fireblast: 'Fire Burst', watergun: 'Water Jet', closecombat: 'All-Out Brawl', calmmind: 'Still Mind', helpinghand: 'Lend a Hand',
    bodyslam: 'Body Press', doubleedge: 'Reckless Charge', headbutt: 'Head Ram', takedown: 'Bowl Over',
  };
  const ABILITIES = {
    swiftswim: 'Fleet Swim', sandrush: 'Dune Dash', slushrush: 'Sleet Dash', speedboost: 'Quicken', strongjaw: 'Iron Jaw',
    toughclaws: 'Hard Claws', adaptability: 'Attunement', tintedlens: 'Prism Lens', superluck: 'Lucky Streak', skilllink: 'Chain Mastery',
    serenegrace: 'Gentle Grace', compoundeyes: 'Many Eyes', scrappy: 'Brawler', prankster: 'Trickster', unaware: 'Unshaken',
    flashfire: 'Fire Catch', thickfat: 'Blubber', multiscale: 'Layered Scales', shellarmor: 'Shell Guard', magicguard: 'Warded',
    clearbody: 'Pure Body', keeneye: 'Sharp Eye', hypercutter: 'Iron Pincers', flamebody: 'Ember Skin', poisonpoint: 'Venom Barb',
    roughskin: 'Coarse Hide', ironbarbs: 'Steel Barbs', waterveil: 'Dampen', magmaarmor: 'Lava Coat', owntempo: 'Own Rhythm',
    innerfocus: 'Steady Mind', naturalcure: 'Self-Mend', regenerator: 'Regrowth', shedskin: 'Molt', raindish: 'Rain Drinker',
    icebody: 'Frost Body', runaway: 'Fleet Foot', pickup: 'Scavenger', cutecharm: 'Allure', illuminate: 'Glow', synchronize: 'Kindred',
    lightningrod: 'Storm Rod', ironfist: 'Heavy Fists', hover: 'Hover', voltsponge: 'Volt Sponge', absorbent: 'Absorbent',
  };
  const ITEMS = {
    potion: 'Salve', superpotion: 'Fine Salve', hyperpotion: 'Grand Salve', maxpotion: 'Full Salve', fullrestore: 'Panacea',
    parlyzheal: 'Numb Cure', awakening: 'Wake Salts', burnheal: 'Burn Balm', iceheal: 'Thaw Balm', fullheal: 'Cure-All',
    revive: 'Rekindle', maxrevive: 'Full Rekindle', ether: 'Focus Drop', maxether: 'Focus Vial', elixir: 'Focus Tonic',
    rarecandy: 'Star Sweet', expcandy: 'Growth Drop', hpup: 'Vigor Tonic', protein: 'Might Tonic', iron: 'Guard Tonic',
    calcium: 'Wit Tonic', zinc: 'Will Tonic', carbos: 'Swift Tonic', ppup: 'Mastery Drop',
    greatorb: 'Fine Orb', ultraorb: 'Grand Orb', netorb: 'Snare Orb', duskorb: 'Night Orb', quickorb: 'Swift Orb', timerorb: 'Patient Orb', healorb: 'Mend Orb',
    xattack: 'Boost Atk', xdefense: 'Boost Def', xspatk: 'Boost Sp.Atk', xspdef: 'Boost Sp.Def', xspeed: 'Boost Speed',
    oranberry: 'Bluesap Berry', cheriberry: 'Jolt Berry', chestoberry: 'Wake Berry', rawstberry: 'Cool Berry', pechaberry: 'Clean Berry', leppaberry: 'Focus Berry',
    abilitycapsule: 'Trait Capsule', abilitypatch: 'Trait Patch', bottlecap: 'Shine Cap', goldcap: 'Gold Shine Cap', pokedoll: 'Fluff Doll',
    repel: 'Ward Spray', superrepel: 'Super Ward', maxrepel: 'Max Ward', escaperope: 'Guide Rope', linkcord: 'Link Cord',
  };
  const pairs = [];   // old -> new, longest first, for rewriting text
  const apply = (table, T) => { for (const id in table) { const o = T[id]; if (!o || o.name === table[id]) continue; pairs.push([o.name, table[id]]); o.name = table[id]; } };
  apply(MOVES, G.MOVES); apply(ABILITIES, G.ABILITIES || {});
  const byName = {};
  for (const id in G.ITEMS) byName[G.ITEMS[id].name] = id;
  for (const id in ITEMS) {
    const o = G.ITEMS[id] || G.ITEMS[byName[Object.keys(byName).find(n => n.toLowerCase().replace(/[^a-z]/g, '') === id)]];
    if (!o || o.name === ITEMS[id]) continue; pairs.push([o.name, ITEMS[id]]); o.name = ITEMS[id];
  }
  // TMs are Skill Discs
  for (const id in G.ITEMS) {
    const it = G.ITEMS[id]; if (it.pocket !== 'tm' || !it.tm) continue;
    const n = id.replace(/^tm/, '');
    it.name = 'SD' + n + ' ' + G.MOVES[it.tm].name;
    it.desc = `Teaches ${G.MOVES[it.tm].name}. Skill Discs can be used again and again.`;
  }
  if (G.POCKETS) for (const p of G.POCKETS) if (p.id === 'tm') p.name = 'Discs';
  pairs.push(['TMs', 'Skill Discs'], ['TM', 'Skill Disc']);
  pairs.sort((a, b) => b[0].length - a[0].length);
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const KEEP_IN_TEXT = new Set(['Iron', 'Awakening']);   // plain words that also appear inside other names and prose
  const RX = [[/\bTM(\d+)/g, 'SD$1']].concat(pairs.filter(([o]) => !KEEP_IN_TEXT.has(o)).map(([o, n]) => [new RegExp('\\b' + esc(o) + '\\b', 'g'), n]));
  G.renameText = s => { if (typeof s !== 'string') return s; for (const [rx, n] of RX) s = s.replace(rx, n); return s; };
  for (const T of [G.MOVES, G.ABILITIES || {}, G.ITEMS]) for (const id in T) { const o = T[id]; if (o.desc) o.desc = G.renameText(o.desc); }
})();
