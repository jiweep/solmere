'use strict';
// ============================================================================
//  Save state, flags, bag, party & boxes, dex, clock, persistence
// ============================================================================
G.save = null;
G.SAVE_KEY = 'solmere_save_';
G.newSave = function (o = {}) {
  const s = {
    v: 1, slot: o.slot || 1, name: o.name || 'Alex', look: o.look || 'player_a', rival: 'Wren', created: Date.now(), playtime: 0,
    money: 3000, badges: [], party: [], boxes: Array.from({ length: 12 }, () => []), boxNames: Array.from({ length: 12 }, (_, i) => 'Box ' + (i + 1)), graveyard: [],
    bag: { potion: 2 }, reg: null, flags: {}, vars: {},
    pos: { map: 'home2f', x: 4, y: 4, dir: 'down' }, lastHeal: { map: 'home1f', x: 5, y: 6 }, returnTo: null, lastOutdoor: { map: 'brinehollow', x: 11, y: 12 },
    dex: { seen: {}, caught: {}, shiny: {} }, trainers: {}, items: {}, cleared: {},
    settings: { difficulty: 'normal', nuzlocke: false, nuzRules: { dupes: true, shiny: true, hardcore: false }, randomizer: null, levelCap: 'off', setMode: false, noItems: false, god: false, expShare: true, ...(o.settings || {}) },
    god: { invincible: false, ohko: false, noclip: false, noEnc: false, catch100: false, speed: false },
    nuz: { enc: {}, dead: 0, failed: false },
    quests: {}, stats: { battles: 0, wild: 0, trainers: 0, caught: 0, shinies: 0, steps: 0, evolutions: 0, fainted: 0, earned: 0, highestLvl: 0 }, ach: {},
    visited: { brinehollow: true }, repel: 0, follower: true, clockStart: 8, spire: { best: 0, streak: 0 },
    otId: Math.floor(Math.random() * 65536),
  };
  return s;
};
G.flag = n => !!(G.save && G.save.flags[n]);
G.setFlag = (n, v = true) => { if (G.save) { if (v) G.save.flags[n] = v; else delete G.save.flags[n]; } };
G.getVar = (n, d = 0) => G.save && G.save.vars[n] !== undefined ? G.save.vars[n] : d;
G.setVar = (n, v) => { if (G.save) G.save.vars[n] = v; };
G.checkCond = function (cond) {
  if (!cond) return true;
  if (typeof cond === 'function') return !!cond();
  if (Array.isArray(cond)) return cond.every(G.checkCond);
  if (cond[0] === '!') return !G.flag(cond.slice(1));
  if (cond.startsWith('badge>=')) return G.save.badges.length >= +cond.slice(7);
  if (cond.startsWith('badge<')) return G.save.badges.length < +cond.slice(6);
  return G.flag(cond);
};
// ------------------------------------------------------------------ bag --
G.bag = {
  count: id => (G.save.bag[id] || 0),
  has: id => (G.save.bag[id] || 0) > 0,
  add(id, n = 1) { if (!G.ITEMS[id]) { console.warn('bad item', id); return; } G.save.bag[id] = Math.min(999, (G.save.bag[id] || 0) + n); if (G.ITEMS[id].pocket === 'key' || G.ITEMS[id].pocket === 'tm') G.save.bag[id] = 1; },
  remove(id, n = 1) { const c = G.save.bag[id] || 0; if (c <= n) delete G.save.bag[id]; else G.save.bag[id] = c - n; },
  list(pocket) {
    const out = Object.keys(G.save.bag).filter(id => G.ITEMS[id] && G.ITEMS[id].pocket === pocket && G.save.bag[id] > 0);
    if (pocket === 'tm') out.sort(); else out.sort((a, b) => Object.keys(G.ITEMS).indexOf(a) - Object.keys(G.ITEMS).indexOf(b));
    return out;
  },
};
// ---------------------------------------------------------------- party --
G.party = {
  get list() { return G.save.party; },
  alive() { return G.save.party.filter(m => m.hp > 0 && !m.dead); },
  lead() { return G.save.party.find(m => m.hp > 0 && !m.dead) || G.save.party[0]; },
  healAll() { for (const m of G.save.party) G.mon.healFull(m); },
  // add a mon to party or first box with room; returns 'party' | box index
  add(m) {
    if (!m.ot) { m.ot = G.save.name; m.otId = G.save.otId; }
    G.dexMark(m.sp, 'caught', m.shiny);
    if (G.save.party.length < 6) { G.save.party.push(m); return 'party'; }
    for (let i = 0; i < G.save.boxes.length; i++) if (G.save.boxes[i].length < 30) { G.save.boxes[i].push(m); return i; }
    G.save.boxes[G.save.boxes.length - 1].push(m); return G.save.boxes.length - 1;
  },
  allMons() { return [...G.save.party, ...G.save.boxes.flat()]; },
  hasSpecies(id) { return this.allMons().some(m => m.sp === id); },
  highestLevel() { return Math.max(1, ...G.save.party.map(m => m.lvl)); },
  cleanupDead() {
    // Nuzlocke: move dead party mons to the graveyard
    const dead = G.save.party.filter(m => m.dead);
    if (!dead.length) return [];
    G.save.graveyard.push(...dead); G.save.party = G.save.party.filter(m => !m.dead);
    G.save.nuz.dead += dead.length;
    return dead;
  },
};
G.dexMark = function (sp, kind, shiny) {
  if (!G.save || !G.SPECIES[sp]) return;
  G.save.dex.seen[sp] = true;
  if (kind === 'caught') { if (!G.save.dex.caught[sp]) G.save.dex.caught[sp] = Date.now(); if (shiny) G.save.dex.shiny[sp] = true; }
};
G.dexCount = () => ({ seen: Object.keys(G.save.dex.seen).length, caught: Object.keys(G.save.dex.caught).length, total: G.DEX.length });

// ---------------------------------------------------------------- clock --
G.clock = {
  hourF() {
    if (!G.save) return 12;
    if (G.save.vars.forceHour !== undefined) return G.save.vars.forceHour;
    if (G.settings.clock === 'real') { const d = new Date(); return d.getHours() + d.getMinutes() / 60; }
    return (G.save.clockStart + G.save.playtime / 120) % 24; // 1 game hour = 2 real minutes
  },
  hour() { return Math.floor(this.hourF()); },
  phase() { const h = this.hourF(); return h < 5 ? 'night' : h < 7.5 ? 'dawn' : h < 17 ? 'day' : h < 19.5 ? 'dusk' : 'night'; },
  isNight() { const p = this.phase(); return p === 'night'; },
  label() { const h = this.hourF(); const hh = Math.floor(h), mm = Math.floor((h - hh) * 60); const ap = hh >= 12 ? 'PM' : 'AM'; return `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${ap}`; },
  dayTime() { return this.isNight() ? 'night' : 'day'; },
};

// ------------------------------------------------------------- persistence
G.persist = {
  key: slot => G.SAVE_KEY + slot,
  write(slot = G.save.slot) {
    try {
      G.save.savedAt = Date.now();
      G.save.settingsGlobal = G.settings;
      localStorage.setItem(this.key(slot), JSON.stringify(G.save));
      return true;
    } catch (e) { G.reportError(e); return false; }
  },
  read(slot) {
    try { const s = localStorage.getItem(this.key(slot)); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  },
  exists(slot) { try { return !!localStorage.getItem(this.key(slot)); } catch (e) { return false; } },
  del(slot) { try { localStorage.removeItem(this.key(slot)); } catch (e) { } },
  summary(slot) {
    const s = this.read(slot); if (!s) return null;
    return { name: s.name, badges: s.badges.length, time: G.fmtTime(s.playtime), dex: Object.keys(s.dex.caught).length, loc: s.pos && G.MAPDEFS[s.pos.map] ? G.MAPDEFS[s.pos.map].name : '?', difficulty: s.settings.difficulty, nuzlocke: s.settings.nuzlocke, party: s.party.map(m => ({ sp: m.sp, shiny: m.shiny, lvl: m.lvl })) };
  },
  exportFile() {
    const blob = new Blob([JSON.stringify(G.save)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `solmere_${G.save.name}_${new Date().toISOString().slice(0, 10)}.json`; a.click();
  },
  globalSettings() { try { const s = localStorage.getItem('solmere_settings'); if (s) Object.assign(G.settings, JSON.parse(s)); } catch (e) { } },
  saveSettings() { try { localStorage.setItem('solmere_settings', JSON.stringify(G.settings)); } catch (e) { } },
};
// migrate / repair loaded saves so older or partial saves never crash
G.repairSave = function (s) {
  const d = G.newSave({});
  for (const k in d) if (s[k] === undefined) s[k] = d[k];
  for (const k in d.settings) if (s.settings[k] === undefined) s.settings[k] = d.settings[k];
  for (const k in d.stats) if (s.stats[k] === undefined) s.stats[k] = 0;
  s.party = (s.party || []).filter(m => m && G.SPECIES[m.sp]);
  for (const box of s.boxes) for (let i = box.length - 1; i >= 0; i--) if (!box[i] || !G.SPECIES[box[i].sp]) box.splice(i, 1);
  for (const m of G.party ? [...s.party, ...s.boxes.flat()] : []) {
    m.moves = (m.moves || []).filter(x => x && G.MOVES[x.id]);
    if (!m.moves.length) m.moves = [G.mon.newMove('tackle')];
    if (!m.evs) m.evs = { hp: 0, atk: 0, def: 0, spa: 0, spd: 0, spe: 0 };
  }
  for (const id in s.bag) if (!G.ITEMS[id]) delete s.bag[id];
  if (!G.MAPDEFS[s.pos.map]) s.pos = { map: 'brinehollow', x: 11, y: 12, dir: 'down' };
  return s;
};
