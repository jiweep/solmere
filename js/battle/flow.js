'use strict';
// ============================================================================
//  Battle flow: building battles from the world, encounters, trainers,
//  difficulty & challenge rules, post-battle processing, evolution scene.
// ============================================================================
G.TRAINERS = G.TRAINERS || {};
G.DIFF = {
  easy: { lvl: .9, add: 0, iv: 10, ai: -1, exp: 1.5, name: 'Easy' },
  normal: { lvl: 1, add: 0, iv: 16, ai: 0, exp: 1, name: 'Normal' },
  hard: { lvl: 1.07, add: 1, iv: 26, ai: 1, exp: 1, name: 'Hard' },
  master: { lvl: 1.12, add: 2, iv: 31, ai: 2, exp: .9, name: 'Master' },
};
G.LEVEL_CAPS = [14, 20, 26, 32, 39, 45, 53, 57, 100];
G.levelCapNow = function () {
  const b = G.save.badges.length;
  if (G.flag('champion')) return 100;
  if (b >= 6) return G.flag('elite4_done') ? 57 : 53;
  return G.LEVEL_CAPS[b];
};
G.diff = () => G.DIFF[G.save.settings.difficulty] || G.DIFF.normal;
// ------------------------------------------------------------ randomizer --
G.randomizeSpecies = function (sp, ctx) {
  const R = G.save.settings.randomizer; if (!R || !R.on) return sp;
  if (ctx === 'wild' && !R.wild) return sp; if (ctx === 'trainer' && !R.trainers) return sp; if (ctx === 'starter' && !R.starters) return sp;
  const base = G.SPECIES[sp]; if (!base || base.legend) return sp;
  const rng = new G.RNG((R.seed || 1) + ':' + ctx + ':' + sp);
  const pool = G.DEX.filter(id => !G.SPECIES[id].legend && (!R.similar || Math.abs(G.SPECIES[id].bst - base.bst) < 70) && (ctx !== 'starter' || G.SPECIES[id].stage === 1));
  return pool.length ? rng.pick(pool) : sp;
};
// --------------------------------------------------------- mon building --
G.buildTrainerMon = function (spec, tr, o = {}) {
  const D = G.diff();
  let sp = G.randomizeSpecies(spec.sp, 'trainer');
  let lvl = Math.max(1, Math.round(spec.lvl * D.lvl + (spec.lvl >= 10 ? D.add : 0)));
  if (o.scaleTo) lvl = o.scaleTo;
  const boss = tr.boss;
  const ivAll = Math.min(31, D.iv + (boss ? 6 : 0));
  const m = G.mon.create(sp, lvl, { ivs: Object.fromEntries(G.STATS.map(s => [s, ivAll])), nature: spec.nature, abil: spec.abil, item: spec.item || null, shiny: !!spec.shiny, gender: spec.gender });
  if (spec.moves && sp === spec.sp) m.moves = spec.moves.map(id => G.mon.newMove(id));
  if (G.save.settings.difficulty === 'master' || (G.save.settings.difficulty === 'hard' && boss)) {
    const sB = G.SPECIES[sp].base; const order = G.STATS.slice(1).sort((a, b) => sB[G.STATS.indexOf(b)] - sB[G.STATS.indexOf(a)]);
    const k = boss ? 1 : .5; m.evs = { hp: Math.round(84 * k), atk: 0, def: 0, spa: 0, spd: 0, spe: 0 }; m.evs[order[0]] = Math.round(252 * k); m.evs[order[1]] = Math.round(172 * k);
    if (!m.item && boss && G.save.settings.difficulty === 'master') m.item = G.pick(['sunberry', 'lumenberry', 'leftovers', 'lifegem', 'expertbelt']);
  }
  m.hp = G.mon.maxHP(m);
  m.ot = tr.name; m.otId = -1;
  return m;
};
G.makeWild = function (sp, lvl, o = {}) {
  sp = o.noRandom ? sp : G.randomizeSpecies(sp, 'wild');
  let shinyMult = G.bag.has('shinycharm') ? 3 : 1;
  if (o.echo) shinyMult *= 8;
  const m = G.mon.create(sp, lvl, { shinyMult, perfectIVs: o.echo ? 3 : o.legend ? 3 : 0, hidden: o.echo ? G.chance(.4) : false, shiny: o.shiny });
  if (o.moves) m.moves = o.moves.map(id => G.mon.newMove(id));
  return m;
};
G.encounterTable = function (map, table) {
  const E = map.def.enc; if (!E) return null;
  let T = E[table];
  if (table === 'grass' && G.clock.isNight() && E.night) T = E.night;
  if (table === 'fish' && G.bag.has('prorod') && E.fishpro) T = E.fishpro;
  return T;
};
G.rollEncounter = function (map, table) {
  const T = G.encounterTable(map, table); if (!T || !T.list || !T.list.length) return null;
  const total = T.list.reduce((a, e) => a + e[1], 0); let r = G.rand() * total;
  let pick = T.list[0][0];
  for (const [sp, w] of T.list) { r -= w; if (r <= 0) { pick = sp; break; } }
  const [lo, hi] = T.lv; return { sp: pick, lvl: G.randInt(lo, hi) };
};
// ------------------------------------------------------------ nuzlocke --
G.nuzArea = map => map.def.area || map.id;
G.nuzCanCatch = function (map, mon) {
  const S = G.save.settings; if (!S.nuzlocke) return { ok: true };
  const area = G.nuzArea(map), used = G.save.nuz.enc[area];
  if (S.nuzRules.shiny && mon.shiny) return { ok: true, shiny: true };
  if (used) return { ok: false, msg: `You already had your encounter in this area (${G.SPECIES[used.sp] ? G.SPECIES[used.sp].name : '?'})! Nuzlocke rules forbid catching another.` };
  if (S.nuzRules.dupes) { const line = G.evoLine(mon.sp).map(x => x.id); if (G.party.allMons().concat(G.save.graveyard).some(x => line.includes(x.sp))) return { ok: true, dupe: true }; }
  return { ok: true, first: true };
};
// ------------------------------------------------------------ controllers
G.makeTrainerCfg = function (id, o = {}) {
  const T = G.TRAINERS[id]; if (!T) throw new Error('Unknown trainer ' + id);
  const D = G.diff();
  const party = T.party.map(p => G.buildTrainerMon(p, T));
  const aiLvl = G.clamp((T.ai !== undefined ? T.ai : 2) + D.ai, 1, 4);
  const cfg = { name: T.name, cls: T.cls, sprite: G.LOOKS[T.look] || T.look, party, controller: G.AI.controller(aiLvl, T), items: { ...(T.items || {}) }, resonance: !!T.resonate, trainerId: id, boss: T.boss };
  if (T.ace !== undefined && party[T.ace]) cfg.aceUid = party[T.ace].uid; else if (T.resonate) cfg.aceUid = party[party.length - 1].uid;
  if (G.save.settings.difficulty === 'easy') cfg.items = {};
  if (G.save.settings.difficulty === 'master' && T.boss) cfg.items.fullrestore = (cfg.items.fullrestore || 0) + 1;
  return cfg;
};
G.playerTrainer = function (scene) {
  const S = G.save.settings, cap = S.levelCap === 'hard' ? G.levelCapNow() : 100;
  return {
    name: G.save.name, isPlayer: true, party: G.save.party, controller: scene, sprite: G.LOOKS[G.save.look],
    resonance: G.bag.has('resonanceband'), expShare: S.expShare && G.bag.has('expshare'), expMult: G.diff().exp,
    levelCap: cap, softCap: S.levelCap === 'soft' ? G.levelCapNow() : null, otId: G.save.otId,
  };
};
G.envForMap = function (map) {
  if (map.def.env) return map.def.env;
  if (map.type === 'cave') return map.theme === 'snow' ? 'snow' : map.def.crystal ? 'crystal' : map.theme === 'ash' ? 'volcano' : 'cave';
  if (map.type === 'indoor') return 'gym';
  return { grass: 'grass', snow: 'snow', ash: 'volcano', dusk: 'dusk', beach: 'beach' }[map.theme] || 'grass';
};
// ------------------------------------------------------- core run battle
G.runBattle = async function (cfg) {
  const w = G.world.scene;
  if (w) w.busy++;
  try {
    const scene = new G.BattleScene({ env: cfg.env || (w ? G.envForMap(w.map) : 'grass'), phase: w && w.map.type === 'outdoor' ? G.clock.phase() : 'day', format: cfg.format, partnerName: cfg.partnerName });
    const player = G.playerTrainer(scene);
    if (cfg.playerParty) { player.party = cfg.playerParty; player.expShare = false; }
    const sides = [{ trainers: [player, ...(cfg.allies || [])] }, { trainers: cfg.foes }];
    const S = G.save.settings;
    const rules = { nuzlocke: S.nuzlocke, setMode: S.setMode || (S.nuzlocke && S.nuzRules.hardcore), noItems: S.noItems || (S.nuzlocke && S.nuzRules.hardcore), noCatch: cfg.noCatch, noCatchMsg: cfg.noCatchMsg };
    const bt = new G.Battle({ format: cfg.format || 'single', wild: !!cfg.wild, sides, displays: [scene, ...(cfg.extraDisplays || [])], exp: cfg.exp !== false, rules, env: scene.env, weather: cfg.weather, night: G.clock.isNight(), godPlayer: G.save.settings.god && G.save.god.invincible, godCatch: G.save.settings.god && G.save.god.catch100, noRun: cfg.noRun });
    if (G.save.settings.god && G.save.god.ohko) bt.o.godOHKO = true;
    scene.bt = bt;
    G.save.stats.battles++;
    // transition
    if (G.audio) G.audio.music(cfg.music || (cfg.wild ? 'wild' : 'trainer'));
    await G.battleTransition(cfg.wild ? 'wild' : cfg.boss ? 'boss' : 'trainer', cfg);
    G.push(scene);
    await G.fadeIn(10);
    let result;
    try { result = await bt.run(); }
    catch (e) { G.reportError(e); result = { outcome: 'draw', leveled: [], fainted: [] }; }
    await scene.wait(10);
    // victory music + money
    if (result.outcome === 'win' && !cfg.wild) {
      G.audio && G.audio.music(cfg.victory || (cfg.boss ? 'victory_gym' : 'victory_trainer'));
      for (const f of cfg.foes) {
        const T = G.TRAINERS[f.trainerId];
        if (T && T.defeat) await scene.message(T.defeat.replace(/\{PLAYER\}/g, G.save.name), { press: true });
      }
      const last = cfg.foes.flatMap(f => f.party).reduce((a, m) => Math.max(a, m.lvl), 1);
      let prize = cfg.foes.reduce((a, f) => a + ((G.TRAINERS[f.trainerId] || {}).money || 40) * last, 0);
      if (G.save.party.some(m => m.item === 'amuletcoin')) prize *= 2;
      if (prize > 0 && !cfg.noMoney) { G.save.money += prize; G.save.stats.earned += prize; await scene.message(`You got $${prize.toLocaleString()} for winning!`, { press: true }); }
    } else if (result.outcome === 'win' && cfg.wild) { G.audio && G.audio.music('victory_wild'); await scene.wait(40); }
    await G.fadeOut(16);
    G.pop(scene);
    if (w && G.audio) { const m = w.map.def.music; G.audio.music(typeof m === 'function' ? m() : m); }
    await G.postBattle(result, cfg);
    return result;
  } finally { if (w) w.busy--; }
};
// Encounter transition: white flashes, a storm of skewed colour slashes and shattering shards, then
// (for Tamers) a VS cut-in with both fighters on slanted panels before the battle field opens.
G.battleTransition = async function (kind, cfg = {}) {
  const ACC = { wild: ['#1ec8b8', '#0b3b48'], trainer: ['#ff3b4e', '#3a0a18'], boss: ['#ffc83a', '#2a0a4a'] }[kind] || ['#ff3b4e', '#3a0a18'];
  const foe = cfg.foes && cfg.foes[0], T = foe && G.TRAINERS[foe.trainerId];
  const vs = kind !== 'wild' && foe && foe.sprite;
  const shards = []; for (let i = 0; i < 26; i++) shards.push({ x: G.rand() * G.W, y: G.rand() * G.H, vx: (G.rand() - .5) * 9, vy: (G.rand() - .5) * 7, r: G.rand() * 6, vr: (G.rand() - .5) * .4, s: 10 + G.rand() * 26 });
  const total = vs ? 118 : 56;
  const sc = {
    t: 0, lowres: false, noAnim: true, update() { this.t++; }, drawUI() {
      const U = G.ui, c = U.c, S = G.gfx.S, t = this.t, X = U.X.bind(U), Y = U.Y.bind(U);
      const quad = (x0, y0, x1, y1, x2, y2, x3, y3, col) => { c.fillStyle = col; c.beginPath(); c.moveTo(X(x0), Y(y0)); c.lineTo(X(x1), Y(y1)); c.lineTo(X(x2), Y(y2)); c.lineTo(X(x3), Y(y3)); c.closePath(); c.fill(); };
      if (t < 10) { c.fillStyle = `rgba(255,255,255,${(t % 5) < 3 ? .8 : 0})`; c.fillRect(G.gfx.ox, G.gfx.oy, G.W * S, G.H * S); return; }
      // skewed slashes sweeping in, staggered, alternating accent / black
      const k = G.clamp((t - 10) / 24, 0, 1);
      for (let i = 0; i < 9; i++) {
        const e = G.ease.outCubic(G.clamp(k * 1.6 - i * .07, 0, 1)); if (e <= 0) continue;
        const y = -30 + i * 30, len = (G.W + 140) * e, fromL = i % 2 === 0, sk = 34;
        const x0 = fromL ? -80 : G.W + 80 - len;
        quad(x0, y, x0 + len, y, x0 + len - sk, y + 34, x0 - sk, y + 34, i % 3 === 1 ? ACC[0] : '#07060c');
        if (i % 3 === 1) quad(x0, y + 30, x0 + len, y + 30, x0 + len - sk * .1, y + 34, x0 - sk * .1, y + 34, '#ffffff');
      }
      // shards flying off with the glass-break sound
      if (t > 16 && t < 60) for (const sh of shards) {
        const u = t - 16, x = sh.x + sh.vx * u, y = sh.y + sh.vy * u + .12 * u * u, r = sh.r + sh.vr * u;
        c.save(); c.translate(X(x), Y(y)); c.rotate(r); c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.moveTo(0, -sh.s * S / 3); c.lineTo(sh.s * S / 4, sh.s * S / 3); c.lineTo(-sh.s * S / 4, sh.s * S / 4); c.closePath(); c.fill(); c.restore();
      }
      if (!vs || t < 34) return;
      // VS cut-in
      const v = t - 34, inE = G.ease.outBack ? G.ease.outBack(G.clamp(v / 16, 0, 1)) : G.ease.outCubic(G.clamp(v / 16, 0, 1));
      const bgE = G.ease.outCubic(G.clamp(v / 10, 0, 1));
      quad(0, 30, G.W * bgE, 30, G.W * bgE - 20, 186, -20, 186, ACC[1]);
      for (let i = 0; i < 14; i++) { const yy = 34 + ((i * 37 + v * 6) % 150); quad(-10, yy, G.W, yy - 8, G.W, yy - 7, -10, yy + 1, 'rgba(255,255,255,.07)'); }   // speed lines
      // foe panel from the right, player panel from the left
      const fx = G.W - 190 * inE, px = -190 + 190 * inE;
      quad(fx + 40, 34, fx + 200, 34, fx + 180, 182, fx + 10, 182, ACC[0]);
      quad(px - 10, 34, px + 150, 34, px + 120, 182, px - 30, 182, '#22335a');
      const draw = (look, x, flip) => {
        const lk = typeof look === 'string' ? G.LOOKS[look] : look, im = G.chars.battleSprite && (G.chars.battleSprite(lk, 'e5') || G.chars.battleSprite(lk, 'a') || G.chars.battleSprite(lk, 'i'));
        if (!im) return; c.save(); c.imageSmoothingEnabled = false; const sc2 = 1.7;
        if (flip) { c.translate(X(x + im.width * sc2), Y(182 - im.height * sc2)); c.scale(-1, 1); c.drawImage(im, 0, 0, im.width * sc2 * S, im.height * sc2 * S); }
        else c.drawImage(im, X(x), Y(182 - im.height * sc2), im.width * sc2 * S, im.height * sc2 * S);
        c.restore();
      };
      draw(foe.sprite, fx + 70, false);
      draw(G.save.look, px + 20, true);
      // names and the VS mark
      const nm = ((T && T.cls) ? T.cls + ' ' : '') + (foe.name || '');
      U.text(nm.toUpperCase(), fx + 176, 150, { size: 12, weight: 900, align: 'right', color: '#fff', outline: '#07060c', outlineW: 2.2 });
      U.text((G.save.name || '').toUpperCase(), px + 24, 150, { size: 12, weight: 900, color: '#fff', outline: '#07060c', outlineW: 2.2 });
      const vk = G.clamp((v - 8) / 8, 0, 1), vsS = 34 * (2 - G.ease.outCubic(vk));
      if (vk > 0) { c.save(); c.globalAlpha = vk; U.text('VS', G.W / 2 + 2, 92 - vsS / 2 + 2, { size: vsS, weight: 900, align: 'center', color: '#07060c', shadow: false }); U.text('VS', G.W / 2, 92 - vsS / 2, { size: vsS, weight: 900, align: 'center', color: '#fff4c0', outline: ACC[0], outlineW: 2.4, shadow: false }); c.restore(); }
      if (v > 70) { const w = G.clamp((v - 70) / 12, 0, 1); c.fillStyle = '#05050a'; c.fillRect(G.gfx.ox, G.gfx.oy, G.W * S * w, G.H * S); }
    },
  };
  G.push(sc);
  G.audio && G.audio.sfx('battle_start');
  setTimeout(() => G.audio && G.audio.sfx('shatter'), 260);
  await G.wait(total);
  G.fade.a = 1;
  G.pop(sc);
};
// ------------------------------------------------------------ post battle
G.postBattle = async function (r, cfg) {
  const w = G.world.scene;
  const S = G.save.settings;
  if (cfg.noPost) { if (w) await G.fadeIn(10); return; }
  // nuzlocke deaths
  if (S.nuzlocke) {
    const dead = G.party.cleanupDead();
    if (dead.length) { await G.fadeIn(10); await G.say(dead.map(m => `${G.mon.name(m)} has fallen. It will be remembered in the Graveyard.`).join('\\p')); }
  }
  if (cfg.canLose && r.outcome === 'lose') { G.party.healAll(); if (w) await G.fadeIn(10); return; }
  if (r.outcome === 'lose' || G.party.alive().length === 0) {
    if (S.nuzlocke && G.save.party.length === 0) { await G.nuzlockeFailed(); return; }
    await G.blackout(cfg); return;
  }
  if (cfg.wild) G.save.stats.wild++; else if (r.outcome === 'win') G.save.stats.trainers++;
  if (w) { await G.fadeIn(10); }
  // caught
  if (r.outcome === 'caught' && r.caught) {
    const m = r.caught.mon;
    m.met = { loc: w ? w.map.name : '?', lvl: m.lvl, t: Date.now() };
    m.ot = G.save.name; m.otId = G.save.otId;
    if (r.caught.ball === 'healorb') G.mon.healFull(m);
    if (r.caught.ball === 'bondorb') m.bond = 150;
    m.status = null; m.hp = Math.max(1, m.hp);
    G.save.stats.caught++; if (m.shiny) G.save.stats.shinies++;
    const isNew = !G.save.dex.caught[m.sp];
    if (S.nuzlocke && w) G.save.nuz.enc[G.nuzArea(w.map)] = { sp: m.sp, result: 'caught' };
    if (isNew) await G.dexRegister(m);
    const force = S.nuzlocke;
    if (force || await G.yesno(`Give a nickname to the ${G.SPECIES[m.sp].name} you caught?`)) {
      const n = await G.askName({ title: `${G.SPECIES[m.sp].name}'s nickname?`, start: '', max: 12, def: G.SPECIES[m.sp].name, allowCancel: !force, icon: () => G.monArt.front(m.sp, m.shiny, Math.floor(G.realTime * 4) % 4) });
      if (n && n !== G.SPECIES[m.sp].name) m.nick = n;
    }
    const where = G.party.add(m);
    if (where !== 'party') await G.say(`${G.mon.name(m)} was sent to ${G.save.boxNames[where]} in the PC.`);
    if (w) w.placeFollower();
  } else if (cfg.wild && S.nuzlocke && w && cfg.nuzFirst) {
    const area = G.nuzArea(w.map);
    if (!G.save.nuz.enc[area]) { G.save.nuz.enc[area] = { sp: cfg.foes[0].party[0].sp, result: r.outcome === 'win' ? 'fainted' : 'fled' }; G.toast('Nuzlocke: encounter for this area used.'); }
  }
  // pickup
  for (const m of G.save.party) if (G.mon.ability(m) === 'pickup' && !m.item && G.chance(.1)) {
    m.item = G.pick(['potion', 'superpotion', 'orb', 'greatorb', 'ether', 'repel', 'fullheal', 'oranberry', 'sunberry', 'nugget', 'rarecandy', 'ppup', 'stardust'].slice(0, 6 + Math.floor(m.lvl / 10)));
    await G.say(`${G.mon.name(m)} picked up something! It's holding a ${G.ITEMS[m.item].name}.`);
  }
  // remote partner exp
  if (cfg.onExpLog && r.expLog) cfg.onExpLog(r.expLog);
  // evolution
  for (const uid of r.leveled || []) {
    const m = G.save.party.find(x => x.uid === uid); if (!m || m.hp <= 0) continue;
    await G.checkEvolution(m, { trigger: 'level' });
  }
  G.save.stats.highestLvl = Math.max(G.save.stats.highestLvl, G.party.highestLevel());
  if (w) w.placeFollower();
};
G.blackout = async function (cfg) {
  const lost = Math.min(G.save.money, Math.floor(G.save.money / 2));
  if (G.save.lastHeal && G.save.lastHeal.back) G.save.returnTo = G.save.lastHeal.back;
  if (G.flag('league_entered') && !G.flag('hof_pending')) for (const f of ['e1_done', 'e2_done', 'e3_done', 'e4_done', 'league_entered', 'elite4_done']) G.setFlag(f, false);
  G.save.money -= lost;
  G.fade.a = 1;
  await G.say(`You have no more mons that can fight!\\pYou panicked and dropped $${lost.toLocaleString()}...\\p...\\p... ... ...\\pYou scurried to a Haven, protecting your exhausted mons from further harm...`, { box: { style: 'dark' } });
  G.party.healAll();
  const h = G.save.lastHeal;
  const w = G.world.scene;
  if (w) { w.enterMap(h.map, h.x, h.y, 'up', { noBanner: true }); w.surfing = false; w.biking = false; }
  await G.fadeIn(20);
  await G.say('Welcome back. Your mons have been fully restored. Please be careful out there.', { speaker: 'Nurse' });
};
G.nuzlockeFailed = async function () {
  G.fade.a = 1; G.audio && G.audio.stopMusic();
  const n = G.save.graveyard.length;
  await G.say(`Every one of your companions has fallen.\\pYour Nuzlocke run has ended after ${G.fmtTime(G.save.playtime)}, with ${G.save.badges.length} badge${G.save.badges.length === 1 ? '' : 's'} and ${n} mon${n === 1 ? '' : 's'} laid to rest.`, { box: { style: 'dark' } });
  const k = await G.ask('What will you do?', ['Continue (rules off)', 'Return to title'], { box: { style: 'dark' }, cancel: 0 });
  if (k === 0) {
    G.save.settings.nuzlocke = false; G.save.nuz.failed = true;
    for (const m of G.save.graveyard) { m.dead = false; }
    const revive = G.save.graveyard.splice(0, 3); for (const m of revive) { G.mon.healFull(m); G.save.party.push(m); }
    G.party.healAll();
    const h = G.save.lastHeal; if (G.world.scene) G.world.scene.enterMap(h.map, h.x, h.y, 'up');
    await G.fadeIn(20); await G.say('Three of your fallen friends have been revived. The journey continues, rules off.');
  } else { location.reload(); }
};
// --------------------------------------------------------- wild battles --
G.startWild = async function (table, o = {}) {
  const w = G.world.scene; if (!w) return;
  if (w.battling) return; w.battling = true;
  try {
    let enc;
    if (o.species) enc = { sp: o.species, lvl: o.lvl || 5 };
    else if (o.echo) {
      const T = G.encounterTable(w.map, 'grass'); if (!T) return;
      const rare = (w.map.def.enc.rare || T).list; const pick = G.pick(rare); enc = { sp: pick[0], lvl: T.lv[1] + 1 };
      await G.say('The grass is sparkling with a strange light...!');
    } else enc = G.rollEncounter(w.map, table || 'grass');
    if (enc && o.rustle) {
      const T = G.encounterTable(w.map, 'grass');
      if (T && w.map.def.enc.rare && G.rand() < .3) enc = { sp: G.pick(w.map.def.enc.rare.list)[0], lvl: enc.lvl };
      enc.lvl += 2;
    }
    if (!enc) return;
    const lead = G.party.lead();
    if (!o.species && !o.echo && G.save.repel > 0 && lead && enc.lvl < lead.lvl) return;
    let second = null;
    const coop = G.net && G.net.coopAvailable && G.net.coopAvailable();
    if (coop && !o.species) second = G.rollEncounter(w.map, table || 'grass');
    const m = G.makeWild(enc.sp, enc.lvl, { echo: o.echo, shiny: o.shiny, noRandom: o.noRandom, legend: o.legend, moves: o.moves });
    if (o.hidden) m.abil = 2;
    const foes = [m]; if (second) foes.push(G.makeWild(second.sp, second.lvl));
    G.dexMark(m.sp, 'seen'); if (second) G.dexMark(foes[1].sp, 'seen');
    const nz = G.nuzCanCatch(w.map, m);
    const cfg = {
      wild: true, format: foes.length > 1 ? 'double' : 'single', foes: [{ name: null, party: foes, controller: G.AI.controller(0) }],
      noCatch: !nz.ok, noCatchMsg: nz.msg, nuzFirst: nz.first, music: o.music || (o.legend ? 'legend' : m.shiny ? 'wild' : 'wild'), boss: o.legend, noRun: o.noRun, weather: G.weatherForBattle(w),
    };
    if (coop && G.net) return await G.net.hostCoopBattle(cfg);
    return await G.runBattle(cfg);
  } finally { w.battling = false; }
};
G.weatherForBattle = function (w) {
  const x = w.weather;
  return x === 'rain' || x === 'storm' ? 'rain' : x === 'snow' || x === 'blizzard' ? 'snow' : x === 'sand' ? 'sand' : x === 'sun' ? 'sun' : null;
};
// ------------------------------------------------------------- fishing ---
G.fish = async function () {
  const w = G.world.scene; if (!w) return;
  w.busy++;
  try {
    const enc = w.map.def.enc && w.map.def.enc.fish;
    G.audio && G.audio.sfx('cast');
    await G.say('You cast your line...', { auto: 30 });
    if (!enc) { await G.wait(40); await G.say('Not even a nibble...'); return; }
    const waitT = G.randInt(50, 150); let t = 0; let dots = 0;
    const box = new G.DialogScene('', { auto: 99999 }, () => { }); box.box.set('...'); box.box.chars = 99; box.box.state = 'wait';
    G.push(box);
    while (t < waitT) { await G.wait(1); t++; if (t % 40 === 0) { dots++; box.box.set('...'.repeat(Math.min(3, dots + 1))); box.box.chars = 99; box.box.state = 'wait'; } if (G.input.pressed('a')) { G.input.consume('a'); G.pop(box); await G.say('You reeled in too soon... Nothing.'); return; } }
    box.box.set('{r}!{w} Something\'s biting! Press Z!'); box.box.chars = 99; box.box.state = 'wait';
    G.audio && G.audio.sfx('exclaim');
    let hooked = false;
    for (let f = 0; f < 32; f++) { await G.wait(1); if (G.input.pressed('a')) { G.input.consume('a'); hooked = true; break; } }
    G.pop(box);
    if (!hooked) { await G.say('It got away...'); return; }
    await G.say('You landed a mon!', { auto: 20 });
    w.battling = false;
    await G.startWild('fish');
  } finally { w.busy--; }
};
// ------------------------------------------------------------ trainers ---
G.canRematch = function (tid) {
  const T = G.TRAINERS[tid]; if (!T || T.boss || T.noRematch) return false;
  if (!G.bag.has('vsrecorder')) return false;
  const rec = G.save.trainers[tid]; if (!rec) return false;
  const at = typeof rec === 'object' ? rec.badges : 0;
  return G.save.badges.length > at;
};
G.trainerSpotted = async function (e, dist) {
  const w = G.world.scene; w.busy++;
  try {
    const p = w.player;
    e.emote = '!'; e.emoteT = 0; e.emoteLife = 40;
    G.audio && G.audio.sfx('exclaim');
    const T = G.TRAINERS[e.trainer];
    if (G.audio) G.audio.music(T && T.encounterMusic || (T && T.boss ? 'encounter_boss' : 'encounter'));
    await G.wait(36);
    const d0 = e.dir, hx = e.x, hy = e.y;
    // the trainer walks up to YOU: a follower standing in the way (or beside you on the trainer's side)
    // steps round behind you first, so the trainer never stops in front of it
    const f = w.follower, [ddx, ddy] = G.DIRS[e.dir];
    if (f && !f.hidden) {
      const onPath = k => f.x === e.x + ddx * k && f.y === e.y + ddy * k;
      let inWay = false; for (let k = 1; k <= dist; k++) if (onPath(k)) inWay = true;
      if (inWay) {
        const spots = [[p.x + ddx, p.y + ddy], [p.x + ddy, p.y + ddx], [p.x - ddy, p.y - ddx]];
        const s = spots.find(([x, y]) => !w.blocked(x, y, null)) || [p.x, p.y];
        f.x = s[0]; f.y = s[1]; f.px = f.x * 16; f.py = f.y * 16; f.moving = false; f.hidden = s[0] === p.x && s[1] === p.y;
      }
    }
    for (let i = 1; i < dist; i++) { e.startMove(e.dir, 1); while (e.moving) await G.wait(1); }
    // face each other exactly (the trainer looks at the player's tile, not along its old heading)
    const fx = G.sign(p.x - e.x), fy = G.sign(p.y - e.y);
    e.dir = Math.abs(p.x - e.x) >= Math.abs(p.y - e.y) ? (fx > 0 ? 'right' : 'left') : (fy > 0 ? 'down' : 'up');
    p.dir = G.OPP[e.dir];
    if (f && !f.hidden && !f.moving) f.dir = p.dir;
    await G.trainerBattleFromEnt(e);
    // walk back to their post so they never block a corridor
    if ((e.x !== hx || e.y !== hy) && G.world.scene.ents.includes(e)) {
      const back = G.OPP[d0];
      while (e.x !== hx || e.y !== hy) { const [dx, dy] = G.DIRS[back]; if (w.blocked(e.x + dx, e.y + dy, e)) break; e.startMove(back, 1); while (e.moving) await G.wait(1); }
      e.dir = d0;
    }
  } finally { w.busy--; }
};
G.trainerBattleFromEnt = async function (e, rematch) {
  const T = G.TRAINERS[e.trainer]; if (!T) return;
  const w = G.world.scene;
  if (!G.save.party.some(m => m.hp > 0 && !m.dead)) { await G.say('You have no mons that can fight!'); return; }
  if (T.intro && !rematch) await G.say(T.intro, { speaker: T.name });
  else if (rematch) await G.say(T.rematchIntro || 'Here we go again!', { speaker: T.name });
  // double with partner trainer?
  const foes = [G.makeTrainerCfg(e.trainer)];
  let pairEnt = null;
  if (T.pair) { const pe = w.ents.find(x => x.trainer === T.pair); if (pe && !pe.defeated) { pairEnt = pe; foes.push(G.makeTrainerCfg(T.pair)); if (G.TRAINERS[T.pair].intro) await G.say(G.TRAINERS[T.pair].intro, { speaker: G.TRAINERS[T.pair].name }); } }
  if (rematch) { const lvl = Math.min(100, G.party.highestLevel() + 1); for (const f of foes) { f.party = G.TRAINERS[f.trainerId].party.map(pp => G.buildTrainerMon(pp, G.TRAINERS[f.trainerId], { scaleTo: Math.max(pp.lvl, lvl - G.randInt(0, 3)) })); } }
  const double = foes.length > 1 || T.double;
  const r = await G.runBattle({ foes, format: double ? 'double' : 'single', music: T.music, victory: T.victory, boss: T.boss, env: T.env, weather: T.weather || G.weatherForBattle(w), coopTrainer: e.trainer });
  if (r && r.outcome === 'win') {
    for (const f of foes) G.save.trainers[f.trainerId] = { badges: G.save.badges.length, t: Date.now() };
    e.defeated = true; if (pairEnt) pairEnt.defeated = true;
    if (G.net) G.net.shareTrainerWin(foes.map(f => f.trainerId));
    if (T.onWin) await G.runScript(T.onWin, { ent: e });
    else if (T.after) await G.say(T.after, { speaker: T.name });
  }
  return r;
};
// run a scripted trainer battle (story), returns true on win
G.storyBattle = async function (id, o = {}) {
  const T = G.TRAINERS[id];
  const foes = [G.makeTrainerCfg(id)];
  if (o.withTrainer) foes.push(G.makeTrainerCfg(o.withTrainer));
  const allies = o.ally ? [{ ...G.makeTrainerCfg(o.ally), isPartner: true }] : [];
  const r = await G.runBattle({ foes, allies, format: (o.double || foes.length > 1 || allies.length) ? 'double' : 'single', music: o.music || T.music, victory: T.victory, boss: T.boss, env: o.env || T.env, weather: T.weather, noRun: true, canLose: o.canLose, partnerName: o.ally ? G.TRAINERS[o.ally].name : null });
  const won = r && r.outcome === 'win';
  if (won) { G.save.trainers[id] = { badges: G.save.badges.length, t: Date.now() }; if (o.withTrainer) G.save.trainers[o.withTrainer] = { badges: G.save.badges.length }; if (G.net) G.net.shareTrainerWin([id]); }
  return won;
};

// ------------------------------------------------------------- evolution --
G.checkEvolution = async function (m, ctx) {
  const to = G.mon.evoTarget(m, { ...ctx, time: G.clock.dayTime() });
  if (to) await G.evolveMon(m, to, ctx);
};
G.evolveMon = async function (m, to, o = {}) {
  const from = m.sp, oldName = G.mon.name(m);
  const sc = {
    opaque: true, t: 0, stage: 0, k: 0, cancel: false, parts: new G.Particles(), showNew: false,
    update(top) {
      this.t++; this.parts.update();
      if (top && this.stage === 1 && !o.item && G.input.pressed('b')) { G.input.consume('b'); this.cancel = true; }
      if (this.t % 4 === 0) this.parts.add({ x: G.W / 2 + (G.rand() - .5) * 200, y: G.H + 4, vy: -1 - G.rand() * 1.5, life: 140, size: 1 + G.rand() * 1.5, color: G.pick(['#bff8ff', '#ffffff', '#ffe8a0']), blend: 'lighter' });
    },
    draw(b) {
      const g = b.createRadialGradient(G.W / 2, G.H / 2 - 20, 10, G.W / 2, G.H / 2, 240); g.addColorStop(0, this.stage >= 1 ? '#3a5a9a' : '#2a3a5a'); g.addColorStop(1, '#0a0e1a');
      b.fillStyle = g; b.fillRect(0, 0, G.W, G.H);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2 + this.t / 90; b.fillStyle = 'rgba(255,255,255,.04)'; b.beginPath(); b.moveTo(G.W / 2, G.H / 2 - 20); b.arc(G.W / 2, G.H / 2 - 20, 300, a, a + .12); b.fill(); }
      this.parts.draw(b);
      const cur = this.showNew ? to : from;
      const img = G.monArt.front(cur, m.shiny, Math.floor(this.t / 12) % 4);
      const x = G.W / 2 - 48, y = G.H / 2 - 84;
      if (this.stage === 1) {
        b.drawImage(G.pix.silhouette(img, '#ffffff'), x, y);
      } else b.drawImage(img, x, y);
      if (this.flash > 0) { b.fillStyle = `rgba(255,255,255,${this.flash})`; b.fillRect(0, 0, G.W, G.H); }
    },
  };
  G.push(sc); await G.fadeIn(12);
  G.audio && G.audio.music('evolution');
  await G.say(`What? ${oldName} is evolving!`);
  sc.stage = 1;
  // alternate silhouettes, speeding up
  let period = 40;
  for (let i = 0; i < 16 && !sc.cancel; i++) { sc.showNew = !sc.showNew; G.audio && G.audio.sfx('evo_pulse'); await G.wait(Math.max(4, period)); period *= .82; }
  if (sc.cancel) {
    sc.showNew = false; sc.stage = 0;
    await G.say(`Huh? ${oldName} stopped evolving!`);
    G.pop(sc); return false;
  }
  sc.showNew = true; sc.flash = 1;
  G.audio && G.audio.sfx('evo_done');
  await G.tween(sc, { flash: 0 }, 30);
  sc.stage = 2;
  G.audio && G.audio.cry(to);
  G.mon.evolve(m, to);
  G.dexMark(to, 'caught', m.shiny);
  G.save.stats.evolutions++;
  G.audio && G.audio.jingle('evolved');
  await G.say(`Congratulations! Your ${oldName} evolved into {b}${G.SPECIES[to].name}{w}!`);
  const sp = G.SPECIES[to];
  if (sp.evoMove) await G.learnWithPrompt(m, sp.evoMove);
  for (const mv of G.mon.movesAt(to, m.lvl)) if (!G.mon.hasMove(m, mv)) await G.learnWithPrompt(m, mv);
  await G.fadeOut(12); G.pop(sc); await G.fadeIn(12);
  const w = G.world.scene; if (w && G.audio) { const mm = w.map.def.music; G.audio.music(typeof mm === 'function' ? mm() : mm); }
  return true;
};
// ----------------------------------------------------- dex registration --
G.dexRegister = async function (m) {
  const sp = G.SPECIES[m.sp];
  const sc = {
    opaque: false, lowres: false, t: 0, update() { this.t++; },
    drawUI() {
      const U = G.ui;
      U.panel(40, 14, G.W - 80, 132, 'red', { r: 8 });
      U.panel(48, 30, 110, 108, 'light', { r: 6 });
      U.img(G.monArt.front(m.sp, m.shiny, Math.floor(this.t / 12) % 4), 55, 34);
      U.text('Registered to the Dex!', G.W / 2, 18, { size: 8, weight: 800, color: '#fff', align: 'center' });
      U.panel(164, 30, 172, 108, 'light', { r: 6 });
      U.text(`#${String(sp.num).padStart(3, '0')} ${sp.name}`, 172, 36, { size: 9, weight: 800 });
      U.text(`The ${sp.cat} Mon`, 172, 48, { size: 6.4, color: '#6a7080' });
      U.typeBadge(sp.types[0], 172, 58, 34, 9); if (sp.types[1]) U.typeBadge(sp.types[1], 210, 58, 34, 9);
      U.text(`Ht ${sp.h} m   Wt ${sp.w} kg`, 172, 71, { size: 6, color: '#4a5060' });
      G.ui.wrap(sp.dex, 156, 5.8).slice(0, 6).forEach((l, k) => U.text(l, 172, 82 + k * 8.4, { size: 5.8, color: '#4a5060' }));
    },
  };
  G.push(sc); G.audio && G.audio.jingle('dex');
  await G.wait(20);
  await G.say(`${sp.name}'s data was added to the Dex.`);
  G.pop(sc);
};
