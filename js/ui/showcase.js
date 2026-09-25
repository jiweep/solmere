'use strict';
// ============================================================================
//  Showcase: a design review mode from the title screen. Jump straight to any
//  town or route (free roam, no encounters), any battle setting or boss fight,
//  and the key story scenes, without playing through or using God Mode.
//  Esc / X / right-click in the world returns to the Showcase menu.
// ============================================================================
G.showcase = false;
G.SHOWCASE = {
  towns: [
    ['Brinehollow (hometown)', 'brinehollow', 18, 9], ['Route 1', 'route1', 10, 30], ['Fernwick Town', 'fernwick', 21, 21], ['Route 2', 'route2', 10, 10],
    ['Whisperwood', 'whisperwood', 12, 14], ['Galvan Harbor', 'galvan', 22, 19], ['Route 3', 'route3', 10, 10], ['Glimmer Cave', 'glimmercave', 5, 5],
    ['Cindervale', 'cindervale', 21, 20], ['Route 4', 'route4', 10, 10], ['Duskmere', 'duskmere', 14, 12], ['Route 5', 'route5', 10, 10],
    ['Frostpeak', 'frostpeak', 12, 12], ['Skyreach', 'skyreach', 15, 16], ['Route 6', 'route6', 10, 10], ['The Tidelight', 'tidelight', 12, 12],
    ['Victory Road', 'victoryroad', 5, 28], ['Conclave', 'conclave', 10, 10], ['Starfall Peak', 'starfall', 8, 8],
    ['Hale Lab (interior)', 'lab', 5, 8], ['Your house (interior)', 'home1f', 5, 5], ['Fernwick Gym', 'fernwick_gym', 7, 13],
  ],
  battles: [
    ['Wild · grass (day)', { wild: 'pipwing', env: 'grass', phase: 'day' }], ['Wild · grass (dusk)', { wild: 'mossbun', env: 'grass', phase: 'dusk' }],
    ['Wild · grass (night)', { wild: 'oddowl', env: 'grass', phase: 'night' }], ['Wild · forest', { wild: 'grubbit', env: 'forest' }],
    ['Wild · beach', { wild: 'clawdle', env: 'beach' }], ['Wild · surfing', { wild: 'jellume', env: 'water' }], ['Wild · cave', { wild: 'pebblin', env: 'cave' }],
    ['Wild · crystal cave', { wild: 'glimmer', env: 'crystal' }], ['Wild · snow', { wild: 'icicub', env: 'snow' }], ['Wild · volcano', { wild: 'magmite', env: 'volcano' }],
    ['Wild · city', { wild: 'gearling', env: 'city' }], ['Wild · ruins', { wild: 'maskling', env: 'ruins' }],
    ['Trainer · Lass (Route 1)', { trainer: 'r1_lass' }], ['Rival · Wren', { trainer: 'rival1' }], ['Warden · Juniper', { trainer: 'juniper' }],
    ['Warden · Ione', { trainer: 'ione' }], ['Warden · Brann', { trainer: 'brann' }], ['Warden · Mireille', { trainer: 'mireille' }],
    ['Warden · Sigrid', { trainer: 'sigrid' }], ['Warden · Kaelen', { trainer: 'kaelen' }], ['Admin · Lark', { trainer: 'lark1' }],
    ['Boss · Vesper Crane', { trainer: 'crane2' }], ['Elite · Rook', { trainer: 'rook' }], ['Elite · Seraphine', { trainer: 'seraphine' }],
    ['Elite · Nyx', { trainer: 'nyx' }], ['Elite · Ferrum', { trainer: 'ferrum' }], ['??? · The Wanderer', { trainer: 'wanderer' }],
    ['Legend · Orrelume', { wild: 'orrelume', env: 'lighthouse', legend: true, lvl: 50 }],
  ],
  events: [
    ['Title screen', 'title'], ['Prologue (cold open)', 'prologue'], ['Professor introduction', 'professor'],
    ['Choosing a starter (lab)', 'starter'], ['Route 1 race start', 'race'],
  ],
};
// a save with the whole region open and a strong team, so every place can be walked
G.showcaseSave = function () {
  G.save = G.repairSave(G.newSave({ name: 'Ash', look: 'player_a' }));
  const ch = G.CHAPTERS[G.CHAPTERS.length - 1];
  for (const f of ch.flags) G.save.flags[f] = true;
  G.save.badges = ch.badges.slice();
  for (const it of ch.items || []) G.bag.add(it);
  G.save.party = [['solarynx', 60], ['galeclaw', 58], ['stormhound', 58], ['aurorymoth', 57], ['terramole', 57], ['lilyking', 56]].map(([sp, l]) => G.mon.create(sp, l, { perfectIVs: 3 }));
  G.save.settings.god = true; G.save.god.noEnc = true; G.save.god.invincible = true;
  G.defineRivals && G.defineRivals();
};
G.openShowcase = async function () {
  G.showcase = true;
  while (true) {
    const k = await G.choose([{ label: 'Towns & routes' }, { label: 'Battles' }, { label: 'Story scenes' }, { label: 'Back to title' }], { x: G.W / 2 - 60, y: 70, w: 120, title: 'SHOWCASE', cancel: 3 });
    if (k === 0) { const r = await G.showcaseTowns(); if (r) return; }
    if (k === 1) await G.showcaseBattles();
    if (k === 2) { const r = await G.showcaseEvents(); if (r) return; }
    if (k === 3 || k < 0) {
      G.showcase = false;
      if (!G.findScene(G.TitleScene)) { await G.fadeOut(10); scClear(); G.save = null; G.push(new G.TitleScene()); await G.fadeIn(10); }
      return;
    }
  }
};
const scClear = () => { for (const s of G.scenes.slice()) if (!(s instanceof G.TitleScene)) G.pop(s); };
G.showcaseTowns = async function () {
  const L = G.SHOWCASE.towns.filter(t => G.MAPDEFS[t[1]]);
  const k = await G.choose(L.map(t => ({ label: t[0] })), { x: G.W / 2 - 80, y: 16, w: 160, maxRows: 13, title: 'TOWNS & ROUTES', cancel: -1 });
  if (k < 0) return false;
  const [, id, x, y] = L[k];
  G.showcaseSave();
  await G.fadeOut(12);
  scClear(); const t = G.findScene(G.TitleScene); if (t) G.pop(t);
  G.maps.reset();
  const w = new G.WorldScene(); G.push(w);
  const m = G.maps.get(id);
  // nearest walkable cell to the suggested spot
  let best = [x, y], bd = 1e9;
  for (let yy = 0; yy < m.h; yy++) for (let xx = 0; xx < m.w; xx++) { const c = m.cell(xx, yy); if (!c || c.solid || c.water || c.door) continue; const d = Math.abs(xx - x) + Math.abs(yy - y); if (d < bd) { bd = d; best = [xx, yy]; } }
  w.enterMap(id, best[0], best[1], 'down', { noScript: true });
  await G.fadeIn(12);
  G.toast('Showcase · Esc for the Showcase menu · N toggles noclip', { life: 220 });
  return true;
};
G.showcaseBattles = async function () {
  const L = G.SHOWCASE.battles;
  const k = await G.choose(L.map(b => ({ label: b[0] })), { x: G.W / 2 - 90, y: 16, w: 180, maxRows: 13, title: 'BATTLES', cancel: -1 });
  if (k < 0) return;
  const b = L[k][1];
  const hadSave = G.save;
  G.showcaseSave();
  if (!G.world.scene) { G.maps.reset(); const w = new G.WorldScene(); w.enterMap('brinehollow', 18, 9, 'down', { noScript: true, noBanner: true }); w.hiddenForShowcase = true; G.push(w); }
  G.save.vars.forceHour = b.phase === 'night' ? 22 : b.phase === 'dusk' ? 18 : 12;
  try {
    if (b.trainer) await G.storyBattle(b.trainer, { canLose: true, env: b.env });
    else {
      const m = G.makeWild(b.wild, b.lvl || 30, { legend: b.legend });
      await G.runBattle({ wild: true, format: 'single', foes: [{ name: null, party: [m], controller: G.AI.controller(0) }], music: b.legend ? 'legend' : 'wild', boss: b.legend, env: b.env, canLose: true });
    }
  } catch (e) { G.reportError(e); }
  delete G.save.vars.forceHour;
  const w = G.world.scene; if (w && w.hiddenForShowcase) G.pop(w);
  if (!hadSave) G.save = null;
};
G.showcaseEvents = async function () {
  const L = G.SHOWCASE.events;
  const k = await G.choose(L.map(e => ({ label: e[0] })), { x: G.W / 2 - 80, y: 40, w: 160, title: 'STORY SCENES', cancel: -1 });
  if (k < 0) return false;
  const id = L[k][1];
  if (id === 'title') { G.showcase = false; return true; }
  if (id === 'prologue') { await G.runPrologue(); return false; }
  G.save = G.repairSave(G.newSave({ name: 'Ash', look: 'player_a' }));
  if (id === 'professor') { scClear(); const t = G.findScene(G.TitleScene); if (t) G.pop(t); G.showcase = true; await G.runScript('intro_professor'); return true; }
  const t = G.findScene(G.TitleScene); if (t) G.pop(t);
  G.maps.reset(); const w = new G.WorldScene(); G.push(w);
  if (id === 'starter') { Object.assign(G.save.flags, { intro_done: true, mom_talk: true }); w.enterMap('lab', 5, 9, 'up'); }
  if (id === 'race') { Object.assign(G.save.flags, { intro_done: true, mom_talk: true, got_starter: true, rival1_done: true, lab_intro: true, parcel_given: false }); G.save.party = [G.mon.create('kindlet', 6)]; G.save.vars.starter = 'kindlet'; G.defineRivals(); w.enterMap('route1', 10, 38, 'up', { noScript: true }); }
  return true;
};

// ============================================================================
//  Quick tour: the showcase opens as a short run of live slides (title, towns
//  at different hours, a night scene, an interior, battles with moves going
//  off) that you flip through with ◀ ▶ or a click. The last slide opens the
//  full free-roam showcase menu above.
// ============================================================================
G.TOUR = [
  { k: 'title', label: 'Title screen' },
  { k: 'map', id: 'brinehollow', x: 18, y: 10, hour: 10, label: 'Brinehollow · the hometown' },
  { k: 'map', id: 'fernwick', x: 21, y: 21, hour: 13, label: 'Fernwick Town · Blossom Square' },
  { k: 'map', id: 'galvan', x: 22, y: 8, hour: 18, label: 'Galvan Harbor · dusk on the quay' },
  { k: 'map', id: 'route1', x: 12, y: 20, hour: 11, label: 'Route 1 · tall grass and the pond' },
  { k: 'battle', env: 'grass', phase: 'day', mine: 'kindlet', foe: 'mossbun', moves: ['ember', 'vinewhip'], label: 'Wild battle · meadow' },
  { k: 'map', id: 'cindervale', x: 21, y: 20, hour: 16, label: 'Cindervale · lava channels and the hot spring' },
  { k: 'map', id: 'brinehollow', x: 14, y: 10, hour: 22, label: 'Night · lamps, fireflies, the sea' },
  { k: 'map', id: 'tidelight', x: 12, y: 12, hour: 19, label: 'The Tidelight' },
  { k: 'map', id: 'home1f', x: 5, y: 5, hour: 12, label: 'Indoors · your house' },
  { k: 'battle', env: 'crystal', phase: 'day', mine: 'solarynx', foe: 'glimmer', moves: ['flamethrower', 'watergun'], label: 'Crystal cave battle' },
  { k: 'battle', env: 'league', phase: 'day', mine: 'galeclaw', foe: 'stormhound', trainer: 'sable', moves: ['thunderbolt', 'flamethrower'], label: 'Champion Sable · the League hall' },
  { k: 'free', label: 'Free explore · every town, route, battle and story scene' },
];
G.runTour = async function () {
  G.showcase = true;
  let i = 0;
  const tour = new G.TourScene();
  const show = async (k) => {
    i = (k + G.TOUR.length) % G.TOUR.length;
    const s = G.TOUR[i];
    tour.i = i; tour.t = 0;
    await G.fadeOut(8);
    for (const sc of G.scenes.slice()) G.pop(sc);
    G.showcaseSave(); if (s.hour !== undefined) G.save.vars.forceHour = s.hour;
    if (s.k === 'title') { G.save = null; G.push(new G.TitleScene()); }
    else if (s.k === 'map') {
      G.maps.reset(); const w = new G.WorldScene(); G.push(w);
      const m = G.maps.get(s.id);
      let best = [s.x, s.y], bd = 1e9;
      for (let yy = 0; yy < m.h; yy++) for (let xx = 0; xx < m.w; xx++) { const c = m.cell(xx, yy); if (!c || c.solid || c.water || c.door) continue; const d = Math.abs(xx - s.x) + Math.abs(yy - s.y); if (d < bd) { bd = d; best = [xx, yy]; } }
      w.enterMap(s.id, best[0], best[1], 'down', { noScript: true });
    } else if (s.k === 'battle') {
      const sc = new G.BattleScene({ env: s.env, phase: s.phase, format: 'single' });
      sc.hudShow = { 0: 1, 1: 1 }; sc.tour = s; sc.intro = 1; G.tween(sc, { intro: 0 }, 38, G.ease.outCubic);
      const mk = (sp, side) => { const m = G.mon.create(sp, 40); const P = sc.pos(side, 0, 1); return Object.assign({}, m, P, { name: G.mon.name(m), lvl: m.lvl, dispHp: Math.round(m.hp * (side ? .62 : .88)), maxhp: m.hp, visible: true, scale: 1, alpha: 1, offx: 0, offy: 0, flash: 0, shake: 0, frame: 0, side, slot: 0, anim: 0 }); };
      sc.slots['0:0'] = mk(s.mine, 0); sc.slots['1:0'] = mk(s.foe, 1);
      if (s.trainer) { const T = G.TRAINERS[s.trainer]; sc.trainers = [{ side: 1, look: T && (T.look || T.sprite) || s.trainer, x: 292, y: 143, alpha: 1, off: 54, backed: true, name: T ? T.name : '' }]; }
      G.push(sc);
      // moves go off on their own every few seconds, each side in turn
      let turn = 0;
      sc.tourTimer = setInterval(() => {
        if (!G.scenes.includes(sc)) { clearInterval(sc.tourTimer); return; }
        const side = turn++ % 2, mv = s.moves[side];
        sc.play([{ t: 'move', move: mv, ref: { s: side, i: 0 }, targets: [{ s: 1 - side, i: 0 }] }, { t: 'hit', ref: { s: 1 - side, i: 0 }, eff: 1 }]);
      }, 3200);
    } else if (s.k === 'free') {
      G.push(new G.TitleScene());
    }
    G.push(tour);
    await G.fadeIn(8);
  };
  tour.go = d => {
    if (tour.busy) { tour.queued = (tour.queued || 0) + d; return; }   // quick presses during a fade still count
    tour.busy = true;
    show(i + d).finally(() => { tour.busy = false; const q = tour.queued; tour.queued = 0; if (q) tour.go(q); });
  };
  tour.pick = async () => {
    if (G.TOUR[i].k !== 'free') { tour.go(1); return; }
    G.pop(tour); G.save = null;
    await G.openShowcase();
  };
  await show(0);
};
G.TourScene = class {
  constructor() { this.i = 0; this.t = 0; this.noTurbo = true; this.noGhost = true; }
  update(top) {
    this.t++;
    if (!top) return;
    const I = G.input;
    if (I.pressed('right') || I.pressed('r')) { I.consume('right'); this.go(1); }
    else if (I.pressed('left') || I.pressed('l')) { I.consume('left'); this.go(-1); }
    else if (I.pressed('a')) { I.consume('a'); this.pick(); }
    else if (I.pressed('b')) {
      I.consume('b'); G.showcase = false;
      G.run(async () => { await G.fadeOut(8); for (const s of G.scenes.slice()) G.pop(s); G.save = null; G.push(new G.TitleScene()); await G.fadeIn(8); });
    }
  }
  drawUI() {
    const U = G.ui, s = G.TOUR[this.i], n = G.TOUR.length, k = Math.min(1, this.t / 12);
    const y = G.H - 22 + (1 - G.ease.outCubic(k)) * 24, w = Math.max(200, U.measure(s.label, 7, 800) + 90), x = G.W / 2 - w / 2;
    U.c.globalAlpha = .88; U.para(x, y, w, 17, 6, '#0e1019'); U.c.globalAlpha = 1; U.para(x, y + 15.5, w, 1.5, 6, '#ff3b4e');
    U.text(s.label, G.W / 2, y + 2.5, { size: 7, weight: 800, align: 'center', color: '#fff', shadow: false });
    U.text(`${this.i + 1} / ${n}   ·   ◀ ▶ or click   ·   ${s.k === 'free' ? 'Z to open' : 'Z next'}   ·   Esc to leave`, G.W / 2, y + 10.2, { size: 4.6, weight: 700, align: 'center', color: '#9aa0b8', shadow: false });
    const arrow = (ax, dir) => {
      const hov = U.hot(ax - 9, y - 1, 18, 19, null, () => this.go(dir));
      U.para(ax - 8, y, 16, 17, 4, '#ff3b4e');
      U.text(dir < 0 ? '◀' : '▶', ax, y + 4, { size: 8, weight: 900, align: 'center', color: '#fff', shadow: false });
    };
    arrow(x - 14, -1); arrow(x + w + 14, 1);
    if (s.k === 'free') U.hot(x, y, w, 17, null, () => this.pick());
  }
};
