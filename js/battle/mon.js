'use strict';
// ============================================================================
//  Mon instances: creation, stats, natures, EXP, moves, evolution
// ============================================================================
G.STATS = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'];
G.STAT_NAMES = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed', acc: 'accuracy', eva: 'evasiveness' };
G.STAT_SHORT = { hp: 'HP', atk: 'Atk', def: 'Def', spa: 'SpA', spd: 'SpD', spe: 'Spe' };
G.NATURES = {
  hardy: [], lonely: ['atk', 'def'], brave: ['atk', 'spe'], adamant: ['atk', 'spa'], naughty: ['atk', 'spd'],
  bold: ['def', 'atk'], docile: [], relaxed: ['def', 'spe'], impish: ['def', 'spa'], lax: ['def', 'spd'],
  timid: ['spe', 'atk'], hasty: ['spe', 'def'], serious: [], jolly: ['spe', 'spa'], naive: ['spe', 'spd'],
  modest: ['spa', 'atk'], mild: ['spa', 'def'], quiet: ['spa', 'spe'], bashful: [], rash: ['spa', 'spd'],
  calm: ['spd', 'atk'], gentle: ['spd', 'def'], sassy: ['spd', 'spe'], careful: ['spd', 'spa'], quirky: [],
};
G.CHARACTERISTICS = {
  hp: ['Loves to eat.', 'Takes plenty of siestas.', 'Nods off a lot.', 'Scatters things often.', 'Likes to relax.'],
  atk: ['Proud of its power.', 'Likes to thrash about.', 'A little quick tempered.', 'Likes to fight.', 'Quick tempered.'],
  def: ['Sturdy body.', 'Capable of taking hits.', 'Highly persistent.', 'Good endurance.', 'Good perseverance.'],
  spa: ['Highly curious.', 'Mischievous.', 'Thoroughly cunning.', 'Often lost in thought.', 'Very finicky.'],
  spd: ['Strong willed.', 'Somewhat vain.', 'Strongly defiant.', 'Hates to lose.', 'Somewhat stubborn.'],
  spe: ['Likes to run.', 'Alert to sounds.', 'Impetuous and silly.', 'Somewhat of a clown.', 'Quick to flee.'],
};
G.mon = {
  expFor(growth, lvl) {
    if (lvl <= 1) return 0;
    const n = lvl;
    switch (growth) {
      case 'fast': return Math.floor(4 * n * n * n / 5);
      case 'mslow': return Math.max(0, Math.floor(6 / 5 * n * n * n - 15 * n * n + 100 * n - 140));
      case 'slow': return Math.floor(5 * n * n * n / 4);
      default: return n * n * n;
    }
  },
  create(spId, lvl, o = {}) {
    const sp = G.SPECIES[spId]; if (!sp) throw new Error('No species ' + spId);
    lvl = G.clamp(Math.round(lvl), 1, 100);
    const ivs = {};
    for (const s of G.STATS) ivs[s] = o.ivs && o.ivs[s] !== undefined ? o.ivs[s] : G.randInt(0, 31);
    if (o.perfectIVs) { const pool = G.shuffle(G.STATS.slice()); for (let i = 0; i < o.perfectIVs; i++) ivs[pool[i]] = 31; }
    if (o.maxIVs) for (const s of G.STATS) ivs[s] = 31;
    const evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0, ...(o.evs || {}) };
    const natures = Object.keys(G.NATURES);
    let shinyRate = 1 / 4096 * (o.shinyMult || 1);
    const m = {
      uid: G.uid(), sp: spId, nick: o.nick || null, lvl, exp: G.mon.expFor(sp.growth, lvl),
      nature: o.nature || G.pick(natures), mint: null,
      abil: o.abil !== undefined ? o.abil : (o.hidden && sp.abil[2] ? 2 : (sp.abil[1] && G.chance(.5) ? 1 : 0)),
      ivs, evs, moves: [], hp: 1, status: null, slp: 0, item: o.item || null,
      gender: sp.gender < 0 ? null : (o.gender || (G.chance(sp.gender) ? 'm' : 'f')),
      shiny: o.shiny !== undefined ? o.shiny : G.chance(shinyRate),
      bond: sp.id === 'orrelume' ? 120 : 70, ot: o.ot || null, otId: o.otId || null, ball: o.ball || 'orb',
      met: o.met || null, dead: false,
    };
    m.moves = o.moves ? o.moves.map(id => G.mon.newMove(id)) : G.mon.defaultMoves(spId, lvl).map(id => G.mon.newMove(id));
    m.hp = G.mon.stats(m).hp;
    return m;
  },
  newMove(id) { return { id, pp: G.MOVES[id].pp, ppup: 0 }; },
  maxPP(mv) { return Math.floor(G.MOVES[mv.id].pp * (1 + .2 * (mv.ppup || 0))); },
  defaultMoves(spId, lvl) {
    const sp = G.SPECIES[spId]; const learned = [];
    for (const [l, mv] of sp.learn) if (l <= lvl && !learned.includes(mv)) learned.push(mv);
    return learned.slice(-4);
  },
  movesAt(spId, lvl) { return G.SPECIES[spId].learn.filter(l => l[0] === lvl).map(l => l[1]); },
  learnableMoves(m) {   // for the move relearner: everything at or below level + evo move
    const sp = G.SPECIES[m.sp]; const out = [];
    for (const [l, mv] of sp.learn) if (l <= m.lvl && !out.includes(mv)) out.push(mv);
    if (sp.evoMove && !out.includes(sp.evoMove)) out.push(sp.evoMove);
    return out.filter(mv => !m.moves.some(x => x.id === mv));
  },
  natureOf(m) { return G.NATURES[m.mint || m.nature] || []; },
  stats(m) {
    const sp = G.SPECIES[m.sp], nat = G.mon.natureOf(m), o = {};
    G.STATS.forEach((s, i) => {
      const b = sp.base[i], iv = m.ivs[s], ev = m.evs[s] || 0;
      if (s === 'hp') o.hp = m.sp === 'shedinja' ? 1 : Math.floor((2 * b + iv + Math.floor(ev / 4)) * m.lvl / 100) + m.lvl + 10;
      else {
        let v = Math.floor((2 * b + iv + Math.floor(ev / 4)) * m.lvl / 100) + 5;
        if (nat[0] === s) v = Math.floor(v * 1.1); else if (nat[1] === s) v = Math.floor(v * .9);
        o[s] = v;
      }
    });
    return o;
  },
  name(m) { return m.nick || G.SPECIES[m.sp].name; },
  ability(m) { const sp = G.SPECIES[m.sp]; return sp.abil[m.abil] || sp.abil[0]; },
  maxHP(m) { return G.mon.stats(m).hp; },
  healFull(m) {
    if (m.dead) return;
    m.hp = G.mon.maxHP(m); m.status = null; m.slp = 0;
    for (const mv of m.moves) mv.pp = G.mon.maxPP(mv);
  },
  characteristic(m) {
    let best = 'hp', bv = -1;
    for (const s of G.STATS) if (m.ivs[s] > bv) { bv = m.ivs[s]; best = s; }
    return G.CHARACTERISTICS[best][bv % 5];
  },
  ivJudge(v) { return v >= 31 ? 'Best' : v >= 30 ? 'Fantastic' : v >= 26 ? 'Very Good' : v >= 16 ? 'Pretty Good' : v >= 1 ? 'Decent' : 'No Good'; },
  totalEVs(m) { return G.STATS.reduce((a, s) => a + (m.evs[s] || 0), 0); },
  addEVs(m, ev, mult = 1) {
    for (const s in ev) {
      const room = 510 - G.mon.totalEVs(m); if (room <= 0) return;
      const add = Math.min(ev[s] * mult, 252 - (m.evs[s] || 0), room);
      if (add > 0) m.evs[s] = (m.evs[s] || 0) + add;
    }
  },
  // add EXP; returns array of new levels reached
  addExp(m, amount, cap = 100) {
    const sp = G.SPECIES[m.sp]; const ups = [];
    const capExp = G.mon.expFor(sp.growth, Math.min(100, cap));
    m.exp = Math.min(m.exp + amount, G.mon.expFor(sp.growth, 100));
    if (cap < 100 && m.exp > capExp && m.lvl >= cap) m.exp = Math.max(G.mon.expFor(sp.growth, m.lvl), Math.min(m.exp, capExp));
    while (m.lvl < 100 && m.exp >= G.mon.expFor(sp.growth, m.lvl + 1)) {
      if (m.lvl >= cap) { m.exp = G.mon.expFor(sp.growth, m.lvl + 1) - 1; break; }
      const oldMax = G.mon.maxHP(m);
      m.lvl++;
      const newMax = G.mon.maxHP(m);
      if (m.hp > 0) m.hp += newMax - oldMax;
      m.bond = Math.min(255, m.bond + (m.bond < 100 ? 5 : m.bond < 200 ? 3 : 2));
      ups.push(m.lvl);
    }
    return ups;
  },
  setLevel(m, lvl) {
    const sp = G.SPECIES[m.sp]; const f = m.hp / G.mon.maxHP(m);
    m.lvl = G.clamp(lvl, 1, 100); m.exp = G.mon.expFor(sp.growth, m.lvl);
    m.hp = Math.max(m.hp > 0 ? 1 : 0, Math.round(G.mon.maxHP(m) * f));
  },
  expProgress(m) {
    const sp = G.SPECIES[m.sp]; if (m.lvl >= 100) return 1;
    const a = G.mon.expFor(sp.growth, m.lvl), b = G.mon.expFor(sp.growth, m.lvl + 1);
    return G.clamp((m.exp - a) / (b - a), 0, 1);
  },
  expToNext(m) { const sp = G.SPECIES[m.sp]; return m.lvl >= 100 ? 0 : G.mon.expFor(sp.growth, m.lvl + 1) - m.exp; },
  // ctx: {trigger:'level'|'item', item, time:'day'|'night', map}
  evoTarget(m, ctx = {}) {
    if (m.item === 'everstone' && ctx.trigger !== 'item') return null;
    if (m.dead) return null;
    const sp = G.SPECIES[m.sp];
    for (const e of sp.evo) {
      if (ctx.trigger === 'item') { if (e.item && e.item === ctx.item) return e.to; continue; }
      if (e.item) continue;
      if (e.lvl && m.lvl < e.lvl) continue;
      if (e.bond && m.bond < e.bond) continue;
      if (e.time && e.time !== ctx.time) continue;
      if (e.lvl || e.bond) return e.to;
    }
    return null;
  },
  evolve(m, to) {
    const oldMax = G.mon.maxHP(m);
    const oldName = G.SPECIES[m.sp].name;
    if (m.nick === oldName) m.nick = null;
    m.sp = to;
    const newMax = G.mon.maxHP(m);
    if (m.hp > 0) m.hp = Math.max(1, m.hp + newMax - oldMax);
  },
  hasMove(m, id) { return m.moves.some(x => x.id === id); },
  // compact display info (for battle scene/network)
  info(m) {
    return { uid: m.uid, sp: m.sp, name: G.mon.name(m), lvl: m.lvl, gender: m.gender, shiny: m.shiny, hp: m.hp, maxhp: G.mon.maxHP(m), status: m.status, ball: m.ball, dead: m.dead };
  },
  clone(m) { return JSON.parse(JSON.stringify(m)); },
  // bst-similar species for randomizer
  isLegend(id) { return !!G.SPECIES[id].legend; },
};
