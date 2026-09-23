'use strict';
// ============================================================================
//  Title screen, new game setup, continue, debug (God Mode) menu
// ============================================================================
G.TitleScene = class {
  constructor() { this.opaque = true; this.t = 0; this.stage = 'press'; this.parts = new G.Particles(); this.menu = null; }
  enter() { G.audio && G.audio.music('title'); }
  update(top) {
    this.t++; this.parts.update();
    if (this.t % 3 === 0) this.parts.add({ x: G.rand() * G.W, y: 130 + G.rand() * 20, vx: 0, vy: -.12, life: 200, size: 1, color: '#bff8ff', fadeIn: 60, blend: 'lighter' });
    if (!top) return;
    if (this.stage === 'press' && this.t > 40 && G.input.anyKeyThisFrame) { G.input.consumeAll(); G.audio && G.audio.sfx('select'); this.stage = 'menu'; G.run(() => this.mainMenu()); }
  }
  async mainMenu() {
    while (true) {
      const slots = [1, 2, 3].map(s => G.persist.summary(s));
      const has = slots.some(Boolean);
      const items = [];
      if (has) items.push({ id: 'cont', label: 'Continue' });
      items.push({ id: 'new', label: 'New Game' }, { id: 'opts', label: 'Options' }, { id: 'music', label: 'Music Room' }, { id: 'import', label: 'Import Save File' }, { id: 'help', label: 'How to Play' }, { id: 'credits', label: 'Credits' });
      const k = await G.choose(items, { x: G.W / 2 - 50, y: 124, w: 100, cancel: -1 });
      if (k < 0) { this.stage = 'press'; return; }
      const id = items[k].id;
      if (id === 'cont') { const s = await G.pickSlot('Continue which journey?', true); if (s) { await G.startFromSave(G.persist.read(s)); return; } }
      if (id === 'new') { const ok = await G.newGameFlow(); if (ok) return; }
      if (id === 'opts') { const prev = G.save; if (!G.save) G.save = G.newSave(); await G.openOptions(); if (!prev) G.save = null; }
      if (id === 'import') await G.importSave();
      if (id === 'help') await G.howToPlay();
      if (id === 'credits') await G.rollCredits(false);
      if (id === 'music') { await G.musicRoom(); G.audio && G.audio.music('title'); }
    }
  }
  draw(b) {
    const t = this.t;
    // night sky gradient with aurora
    const g = b.createLinearGradient(0, 0, 0, 140); g.addColorStop(0, '#081028'); g.addColorStop(.6, '#1a2a5a'); g.addColorStop(1, '#3a4a8a'); b.fillStyle = g; b.fillRect(0, 0, G.W, 140);
    for (let i = 0; i < 90; i++) { const tw = .4 + .6 * Math.abs(Math.sin(t / 40 + i)); b.fillStyle = `rgba(255,255,255,${tw * .7})`; b.fillRect((i * 97) % G.W, (i * 41) % 110, 1, 1); }
    b.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 3; k++) { b.beginPath(); for (let x = 0; x <= G.W; x += 6) { const y = 40 + k * 12 + Math.sin(x / 50 + t / 90 + k) * 10; x ? b.lineTo(x, y) : b.moveTo(x, y); } for (let x = G.W; x >= 0; x -= 6) b.lineTo(x, 70 + k * 12 + Math.sin(x / 40 + t / 80 + k) * 12); b.closePath(); b.fillStyle = ['rgba(90,255,200,.07)', 'rgba(140,120,255,.06)', 'rgba(90,200,255,.05)'][k]; b.fill(); }
    b.globalCompositeOperation = 'source-over';
    // moon
    b.fillStyle = '#f4f0dc'; b.beginPath(); b.arc(310, 34, 12, 0, Math.PI * 2); b.fill();
    // sea
    const sg = b.createLinearGradient(0, 130, 0, G.H); sg.addColorStop(0, '#1a3a7a'); sg.addColorStop(1, '#081830'); b.fillStyle = sg; b.fillRect(0, 130, G.W, G.H);
    for (let i = 0; i < 40; i++) { const y = 134 + (i * 7) % 80, x = ((i * 53) + t * (.3 + (i % 3) * .1)) % (G.W + 40) - 20; b.fillStyle = 'rgba(140,200,255,.18)'; b.fillRect(x, y, 10 + (i % 4) * 4, 1); }
    // moon reflection
    for (let y = 134; y < G.H; y += 3) { const w = 6 + Math.sin(y / 3 + t / 10) * 3; b.fillStyle = 'rgba(255,250,220,.18)'; b.fillRect(310 - w, y, w * 2, 1); }
    // lighthouse on islet
    b.fillStyle = '#10182a'; b.beginPath(); b.ellipse(70, 134, 46, 8, 0, Math.PI, 0); b.fill();
    b.fillStyle = '#e8e8f0'; b.fillRect(62, 84, 14, 48); for (let y = 90; y < 132; y += 12) { b.fillStyle = '#d84a4a'; b.fillRect(62, y, 14, 6); }
    b.fillStyle = '#2a2e38'; b.fillRect(60, 76, 18, 8); b.fillStyle = '#fff4a0'; b.fillRect(63, 77, 12, 6);
    // lighthouse beam
    const a = t / 60;
    b.save(); b.globalCompositeOperation = 'lighter'; b.translate(69, 80);
    b.rotate(Math.sin(a) * .9);
    const bg = b.createLinearGradient(0, 0, 260, 0); bg.addColorStop(0, 'rgba(255,245,190,.35)'); bg.addColorStop(1, 'rgba(255,245,190,0)');
    b.fillStyle = bg; b.beginPath(); b.moveTo(0, 0); b.lineTo(260, -24); b.lineTo(260, 24); b.closePath(); b.fill(); b.restore();
    // Orrelume silhouette breaching
    const k = (t % 900) / 900;
    if (k > .15 && k < .55) {
      const p = (k - .15) / .4, x = 150 + p * 150, y = 150 - Math.sin(p * Math.PI) * 50;
      b.save(); b.globalAlpha = Math.sin(p * Math.PI) * .9; b.translate(x, y); b.rotate(-Math.cos(p * Math.PI) * .5);
      b.drawImage(G.pix.silhouette(G.monArt.front('orrelume', false, 0), '#0a1830'), -48, -48);
      b.restore();
      if (p > .9 || p < .1) for (let i = 0; i < 3; i++) this.parts.add({ x, y: 140, vx: (G.rand() - .5) * 2, vy: -1 - G.rand() * 2, ay: .08, life: 30, size: 1.5, color: '#bfe8ff' });
    }
    this.parts.draw(b);
  }
  drawUI() {
    const U = G.ui, t = this.t, k = Math.min(1, t / 60);
    const y = 26 - (1 - G.ease.outCubic(k)) * 30;
    U.text('SOLMERE', G.W / 2 + 1.5, y + 1.5, { size: 38, weight: 900, align: 'center', color: '#0a1428', shadow: false, alpha: k });
    U.text('SOLMERE', G.W / 2, y, { size: 38, weight: 900, align: 'center', color: '#fff4d0', shadow: false, alpha: k, outline: '#3a2a10', outlineW: 2.4 });
    U.text('— TIDELIGHT —', G.W / 2, y + 44, { size: 9, weight: 800, align: 'center', color: '#8af0e0', alpha: k, outline: 'rgba(0,0,0,.5)' });
    if (this.stage === 'press' && t > 40 && Math.floor(t / 30) % 2 === 0) U.text('Press Z / Enter', G.W / 2, 150, { size: 8, weight: 800, align: 'center', color: '#fff', outline: 'rgba(0,0,0,.6)' });
    U.text('v' + G.VERSION + '  ·  an original monster-taming adventure', G.W - 6, G.H - 9, { size: 4.8, align: 'right', color: 'rgba(255,255,255,.5)' });
  }
};
G.pickSlot = async function (title, mustExist) {
  const items = [1, 2, 3].map(s => { const S = G.persist.summary(s); return { label: S ? `${s}: ${S.name} · ${S.badges}★ · ${S.time} · ${S.loc}` : `${s}: — empty —`, disabled: mustExist && !S, slot: s }; });
  items.push({ label: 'Back' });
  const k = await G.choose(items, { x: 60, y: 96, w: 264, title, cancel: 3 });
  if (k < 0 || k >= 3) return null;
  return items[k].slot;
};
G.importSave = async function () {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  const file = await new Promise(res => { inp.onchange = () => res(inp.files[0]); inp.click(); setTimeout(() => res(null), 60000); });
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || !data.party) throw new Error('bad');
    const s = await G.pickSlot('Import into which slot?', false); if (!s) return;
    data.slot = s; localStorage.setItem(G.persist.key(s), JSON.stringify(data));
    await G.say('Save imported!');
  } catch (e) { await G.say('That file doesn\'t look like a Solmere save.'); }
};
// ------------------------------------------------------------- new game --
G.NewGameScene = class {
  constructor(res) {
    this.res = res; this.opaque = true; this.t = 0; this.i = 0;
    this.v = { difficulty: 'normal', nuzlocke: false, dupes: true, shinyc: true, hardcore: false, random: false, rwild: true, rtrain: true, rstart: true, rsimilar: true, levelCap: 'off', setMode: false, god: false, look: 'player_a' };
    this.rows = [
      { k: 'difficulty', label: 'Difficulty', vals: ['easy', 'normal', 'hard', 'master'], names: ['Easy', 'Normal', 'Hard', 'Master'], desc: ['Gentle: +50% EXP, weaker trainers, damage hints on.', 'The classic experience, tuned for players who know type matchups.', 'Smarter AI that switches and heals, stronger trainers with better IVs. Bosses are trained.', 'For veterans: max-IV trained teams, held items, the smartest AI. Bring a plan.'] },
      { k: 'levelCap', label: 'Level Caps', vals: ['off', 'soft', 'hard'], names: ['Off', 'Soft', 'Hard'], desc: ['No level caps.', 'EXP drops to 10% above the next Warden\'s ace level.', 'Mons cannot level past the next Warden\'s ace level (shown in the menu).'] },
      { k: 'setMode', label: 'Battle Style', vals: [false, true], names: ['Switch', 'Set'], desc: ['You may switch when the foe sends a new mon.', 'No free switch when the foe sends a new mon (competitive rules).'] },
      { k: 'nuzlocke', label: 'Nuzlocke Mode', vals: [false, true], names: ['Off', 'On'], desc: ['Standard rules.', 'Only the first encounter per area may be caught. Fainted mons are gone forever. You must nickname everything. Ends if your whole party falls.'] },
      { k: 'dupes', label: '  · Dupes Clause', vals: [true, false], names: ['On', 'Off'], dep: 'nuzlocke', desc: ['Encounters of lines you already own don\'t use up the area.', 'Every first encounter counts.'] },
      { k: 'shinyc', label: '  · Shiny Clause', vals: [true, false], names: ['On', 'Off'], dep: 'nuzlocke', desc: ['Shinies can always be caught.', 'Shinies follow normal rules.'] },
      { k: 'hardcore', label: '  · Hardcore', vals: [false, true], names: ['Off', 'On'], dep: 'nuzlocke', desc: ['Items allowed in battle.', 'No items in battle, Set mode forced, no PC healing.'] },
      { k: 'random', label: 'Randomizer', vals: [false, true], names: ['Off', 'On'], desc: ['Species appear as designed.', 'Shuffle species, seeded per save. A fresh adventure every time!'] },
      { k: 'rwild', label: '  · Wild mons', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Randomize wild encounters.', 'Keep wild encounters.'] },
      { k: 'rtrain', label: '  · Trainers', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Randomize trainer teams.', 'Keep trainer teams.'] },
      { k: 'rstart', label: '  · Starters', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Randomize the starter choices.', 'Keep the classic three.'] },
      { k: 'rsimilar', label: '  · Similar strength', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Replacements have similar base stat totals.', 'Anything goes. Chaos.'] },
      { k: 'god', label: 'God Mode (testing)', vals: [false, true], names: ['Off', 'On'], desc: ['Off.', 'Adds a God Mode menu (pause menu, or ` key): invincibility, one-hit KOs, noclip, warps, chapter skips, give mons/items and more.'] },
      { k: 'start', label: '▶  BEGIN JOURNEY', start: true, desc: ['All set? Your adventure in Solmere awaits.'] },
    ];
  }
  visible() { return this.rows.filter(r => !r.dep || this.v[r.dep]); }
  update(top) {
    this.t++; if (!top) return;
    const I = G.input, R = this.visible(), n = R.length;
    if (I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
    const r = R[Math.min(this.i, n - 1)];
    if (r.start) { if (I.pressed('a')) { I.consume('a'); G.audio && G.audio.sfx('select'); G.pop(this); this.res(this.v); } }
    else {
      const vi = r.vals.indexOf(this.v[r.k]);
      if (I.repeat('left')) { this.v[r.k] = r.vals[(vi + r.vals.length - 1) % r.vals.length]; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('right') || I.pressed('a')) { I.consume('a'); this.v[r.k] = r.vals[(vi + 1) % r.vals.length]; G.audio && G.audio.sfx('cursor'); }
    }
    if (this.i >= this.visible().length) this.i = this.visible().length - 1;
    if (I.pressed('b')) { I.consume('b'); G.pop(this); this.res(null); }
  }
  draw(b) { G.menuBG(b, '#1e9486', '#0e3a44', this.t / 60); }
  drawUI() {
    const U = G.ui, R = this.visible();
    U.panel(16, 8, G.W - 32, 150, 'light', { r: 8 });
    U.text('New Journey — Challenge Setup', G.W / 2, 12, { size: 8.4, weight: 900, align: 'center' });
    R.forEach((r, k) => {
      const y = 26 + k * 9.4, sel = k === this.i;
      if (sel) { U.rrect(22, y - 1.4, G.W - 44, 9.2, 3); U.c.fillStyle = r.start ? 'rgba(42,168,106,.3)' : 'rgba(27,167,184,.18)'; U.c.fill(); }
      U.text(r.label, 30, y, { size: 6.4, weight: r.start ? 900 : 700, color: r.start ? '#2a7a4a' : r.dep ? '#5a6070' : '#283040' });
      if (!r.start) { const vi = r.vals.indexOf(this.v[r.k]); U.text('◀ ' + r.names[vi] + ' ▶', G.W - 30, y, { size: 6.4, weight: 800, align: 'right', color: sel ? '#1e9486' : '#4a5060' }); }
    });
    const r = R[this.i];
    U.panel(16, 162, G.W - 32, 46, 'dark', { r: 8 });
    const vi = r.start ? 0 : r.vals.indexOf(this.v[r.k]);
    G.ui.wrap(r.desc[vi] || r.desc[0], G.W - 56, 6.6).slice(0, 4).forEach((l, k) => U.text(l, 26, 168 + k * 9.5, { size: 6.6, color: '#e8f0f8' }));
  }
};
G.newGameFlow = async function () {
  const slot = await G.pickSlot('Save your journey in which slot?', false); if (!slot) return false;
  if (G.persist.exists(slot) && !await G.yesno('There\'s already a journey in that slot. Overwrite it forever?')) return false;
  const v = await new Promise(res => G.push(new G.NewGameScene(res))); if (!v) return false;
  const settings = {
    difficulty: v.difficulty, levelCap: v.levelCap, setMode: v.setMode || (v.nuzlocke && v.hardcore), noItems: v.nuzlocke && v.hardcore,
    nuzlocke: v.nuzlocke, nuzRules: { dupes: v.dupes, shiny: v.shinyc, hardcore: v.hardcore }, god: v.god,
    randomizer: v.random ? { on: true, seed: Math.floor(Math.random() * 1e9), wild: v.rwild, trainers: v.rtrain, starters: v.rstart, similar: v.rsimilar } : null,
    expShare: true,
  };
  if (v.difficulty === 'easy') G.settings.dmgPreview = true;
  G.save = G.newSave({ slot, settings });
  await G.fadeOut(20);
  G.pop(G.findScene(G.TitleScene));
  await G.runScript('intro_professor');
  return true;
};
G.startFromSave = async function (data) {
  if (!data) return;
  G.save = G.repairSave(data);
  if (data.settingsGlobal) Object.assign(G.settings, data.settingsGlobal);
  await G.fadeOut(20);
  const t = G.findScene(G.TitleScene); if (t) G.pop(t);
  G.maps.reset();
  const w = new G.WorldScene(); G.push(w);
  const p = G.save.pos;
  w.enterMap(p.map, p.x, p.y, p.dir);
  await G.fadeIn(20);
  G.toast(`Welcome back, ${G.save.name}!`);
};
G.howToPlay = async function () {
  await G.say([
    'Welcome to Solmere! You\'re a new Tamer setting out to earn the six Warden badges and challenge the Conclave.',
    'Walk into tall grass to meet wild mons. Weaken them, then throw Orbs to catch them. Battle Tamers who spot you to earn money and EXP.',
    'Everything seasoned players expect is here: natures, IVs & EVs (see Summary ▸ Stats), abilities, held items, weather, hazards, doubles, and the physical/special split.',
    'Resonance: once per battle, press R in the Fight menu to let a mon Resonate. Its main type hits much harder and a shield blunts the first super-effective blow.',
    'Quality of life: free move relearner (Party ▸ Moves), no HMs (key items clear obstacles), Always Run and Turbo (Tab), and an encounter list for every area in the menu.',
    'Co-op: run the included server and choose Link in the menu. You and a friend can explore together, team up in double battles, trade, and battle each other.',
    'Press H in the overworld any time for the controls. Good luck, Tamer!',
  ]);
};
G.rollCredits = async function (ending) {
  const lines = ['SOLMERE: TIDELIGHT', '', 'A monster-taming adventure', '', '— Design, Story, Code, Art & Music —', 'Built with care, one pixel at a time', '', '— Starring —', ...G.DEX.map(id => G.SPECIES[id].name), '', '— Special Thanks —', 'Every Tamer who ever talked to their follower', 'Nuzlocke veterans everywhere', 'You, for playing', '', ending ? 'Thank you for playing!' : ''];
  G.audio && G.audio.music(ending ? 'credits' : 'title');
  await new Promise(res => G.push({
    opaque: true, t: 0,
    update(top) { this.t++; if (top && (G.input.pressed('b') || this.t > lines.length * 30 + 400)) { G.input.consume('b'); G.pop(this); res(); } },
    draw(b) { b.fillStyle = '#060a16'; b.fillRect(0, 0, G.W, G.H); for (let i = 0; i < 60; i++) { b.fillStyle = 'rgba(255,255,255,.4)'; b.fillRect((i * 97) % G.W, (i * 41 + this.t * .1) % G.H, 1, 1); } },
    drawUI() {
      const U = G.ui; const y0 = G.H - this.t * .45;
      lines.forEach((l, k) => { const y = y0 + k * 14; if (y < -10 || y > G.H + 10) return; U.text(l, G.W / 2, y, { size: k === 0 ? 11 : 7.4, weight: k === 0 || l.startsWith('—') ? 900 : 600, align: 'center', color: l.startsWith('—') ? '#8af0e0' : '#f0f4ff' }); });
      U.text('X to skip', G.W - 6, G.H - 9, { size: 5, align: 'right', color: 'rgba(255,255,255,.4)' });
    },
  }));
};
// ------------------------------------------------------------ music room -
// The whole soundtrack in story order. Z plays, ◀ ▶ flips day/night arrangements (they crossfade in sync).
G.MUSIC_ORDER = ['title', 'intro', 'home', 'brinehollow', 'lab', 'route1', 'wild', 'encounter', 'trainer', 'victory_wild', 'victory_trainer', 'haven', 'mart',
  'fernwick', 'house', 'route2', 'forest', 'gym', 'encounter_boss', 'gym_battle', 'victory_gym', 'galvan', 'encounter_villain', 'villain_battle', 'hq', 'crane',
  'route3', 'cave', 'cindervale', 'rival', 'route4', 'duskmere', 'ruins', 'evolution', 'surf', 'bike', 'frostpeak', 'icecave', 'skyreach', 'spire', 'spire_battle',
  'admin_battle', 'tidelight', 'lighthouse', 'crane_battle', 'legend', 'tidelight_calm', 'victoryroad', 'gate', 'conclave', 'elite_room', 'elite', 'champ_room',
  'champion', 'victory_champion', 'halloffame', 'credits', 'wanderer', 'starfall'];
G.musicRoom = function () {
  const F = G.MUSIC_FILES || {};
  const list = G.MUSIC_ORDER.filter(id => F[id]);
  if (!list.length) return G.say('The soundtrack files are missing. (Run the game through Play.command so the music can load.)');
  return new Promise(res => G.push({
    opaque: true, i: 0, scroll: 0, t: 0, night: false, playing: null, rows: 12,
    enter() { if (G.audio) G.audio.forceVariant = 'day'; },
    exit() { if (G.audio) G.audio.forceVariant = null; },
    update(top) {
      this.t++; if (!top) return; const I = G.input, n = list.length;
      if (I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (this.i < this.scroll) this.scroll = this.i;
      if (this.i >= this.scroll + this.rows) this.scroll = this.i - this.rows + 1;
      if (I.pressed('a')) { I.consume('a'); this.playing = list[this.i]; if (G.audio) { G.audio.forceVariant = this.night ? 'night' : 'day'; G.audio.stopMusic(); G.audio.music(this.playing); } }
      if ((I.pressed('left') || I.pressed('right')) && this.playing && F[this.playing + '@night']) {
        this.night = !this.night; if (G.audio) G.audio.forceVariant = this.night ? 'night' : 'day';
        G.audio && G.audio.sfx('cursor');
      }
      if (I.pressed('b')) { I.consume('b'); G.audio && G.audio.sfx('back'); G.pop(this); res(); }
    },
    draw(b) { G.menuBG(b, '#1f5f7a', '#0e2436', this.t / 60); },
    drawUI() {
      const U = G.ui;
      U.panel(10, 8, 200, 200, 'light', { r: 8 });
      U.text('Music Room', 110, 13, { size: 9, weight: 900, align: 'center' });
      list.slice(this.scroll, this.scroll + this.rows).forEach((id, k) => {
        const j = k + this.scroll, y = 28 + k * 14.2, sel = j === this.i, m = F[id];
        if (sel) { U.rrect(16, y - 2, 188, 13, 3); U.c.fillStyle = 'rgba(40,150,180,.2)'; U.c.fill(); }
        U.text(String(j + 1).padStart(2, '0'), 22, y + .5, { size: 6, weight: 700, color: '#8a90a0' });
        U.text(m.title || id, 38, y, { size: 6.8, weight: sel ? 800 : 600, color: id === this.playing ? '#1f8aa8' : '#2a3040' });
        if (F[id + '@night']) U.text('☾', 198, y, { size: 6.5, align: 'right', color: '#6a70a0' });
      });
      if (this.scroll > 0) U.text('▲', 110, 22, { size: 5, align: 'center', color: '#e8484a' });
      if (this.scroll + this.rows < list.length) U.text('▼', 110, 199, { size: 5, align: 'center', color: '#e8484a' });
      // now playing
      U.panel(218, 8, G.W - 226, 110, 'dark', { r: 8 });
      U.text('NOW PLAYING', 218 + (G.W - 226) / 2, 14, { size: 6, weight: 900, align: 'center', color: '#8af0e0' });
      const np = G.audio && G.audio.nowPlaying && G.audio.nowPlaying();
      if (np) {
        const m = F[np.id] || {};
        G.ui.wrap(m.title || np.id, G.W - 240, 8).slice(0, 2).forEach((l, k) => U.text(l, 226, 30 + k * 11, { size: 8, weight: 800, color: '#fff' }));
        U.text(np.id.includes('@night') ? 'Night arrangement' : (F[np.id.split('@')[0] + '@night'] ? 'Day arrangement' : ''), 226, 56, { size: 6, color: '#bcd' });
        const frac = np.loopEnd ? Math.min(1, np.pos / np.loopEnd) : 0;
        U.rrect(226, 72, G.W - 242, 5, 2); U.c.fillStyle = 'rgba(255,255,255,.15)'; U.c.fill();
        U.rrect(226, 72, (G.W - 242) * frac, 5, 2); U.c.fillStyle = '#8af0e0'; U.c.fill();
        const fmt = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
        U.text(fmt(np.pos), 226, 81, { size: 5.5, color: '#bcd' });
        if (m.bpm) U.text(`${Math.round(m.bpm)} bpm`, G.W - 16, 81, { size: 5.5, align: 'right', color: '#bcd' });
      } else U.text('Press Z to play a track', 218 + (G.W - 226) / 2, 50, { size: 6.5, align: 'center', color: '#bcd' });
      U.text('Z play  ·  ◀ ▶ day / night  ·  X back', 218 + (G.W - 226) / 2, 106, { size: 5.4, align: 'center', color: '#8a90a0' });
      U.panel(218, 124, G.W - 226, 84, 'glass', { r: 8 });
      ['An original soundtrack in the style of the', 'DS era: sequenced MIDI played through a', 'sampled Roland GS sound bank, mixed and', 'mastered for loops that never seam.'].forEach((l, k) => U.text(l, 226, 132 + k * 10, { size: 5.6, color: '#dfe6f2' }));
      U.text(`${list.length} tracks  ·  ${Object.keys(F).filter(k => k.includes('@night')).length} night arrangements`, 226, 178, { size: 5.6, weight: 800, color: '#8af0e0' });
    },
  }));
};
// ------------------------------------------------------------ god mode ---
G.openDebugMenu = async function () {
  const g = G.save.god;
  while (true) {
    const tog = (k, l) => ({ id: 't_' + k, label: `${l}: ${g[k] ? 'ON' : 'off'}` });
    const items = [tog('invincible', 'Invincible'), tog('ohko', 'One-hit KOs'), tog('noclip', 'Walk through walls'), tog('noEnc', 'No encounters'), tog('catch100', '100% catch'), tog('speed', 'Fast walk'),
      { id: 'heal', label: 'Heal party' }, { id: 'chapter', label: 'Jump to chapter…' }, { id: 'warp', label: 'Warp to map…' }, { id: 'mon', label: 'Give mon…' }, { id: 'item', label: 'Give item…' },
      { id: 'kit', label: 'Give key items + TMs + $' }, { id: 'lvl', label: 'Party +10 levels' }, { id: 'dex', label: 'Complete Dex' }, { id: 'time', label: 'Set time of day…' }, { id: 'trainer', label: 'Battle trainer…' }, { id: 'badges', label: 'Give all badges' }, { id: 'close', label: 'Close' }];
    const k = await G.choose(items, { x: 8, y: 8, w: 150, maxRows: 14, title: 'GOD MODE', cancel: items.length - 1 });
    if (k < 0 || items[k].id === 'close') return false;
    const id = items[k].id;
    if (id.startsWith('t_')) { const key = id.slice(2); g[key] = !g[key]; G.toast(`${key}: ${g[key] ? 'ON' : 'off'}`); continue; }
    if (id === 'heal') { G.party.healAll(); G.toast('Party healed'); }
    if (id === 'chapter') { const cs = G.CHAPTERS.map(c => ({ label: c.name })); const j = await G.choose(cs.concat([{ label: 'Cancel' }]), { x: 60, y: 8, w: 250, maxRows: 14, cancel: cs.length }); if (j >= 0 && j < cs.length) { await G.jumpToChapter(G.CHAPTERS[j]); return true; } }
    if (id === 'warp') {
      const ids = Object.keys(G.MAPDEFS).filter(m => G.MAPDEFS[m].spawn);
      const j = await G.choose(ids.map(m => ({ label: G.MAPDEFS[m].name, right: m })).concat([{ label: 'Cancel' }]), { x: 60, y: 8, w: 250, maxRows: 14, cancel: ids.length });
      if (j >= 0 && j < ids.length) { const d = G.MAPDEFS[ids[j]]; await G.world.scene.warpTo(ids[j], d.spawn[0], d.spawn[1], 'down'); return true; }
    }
    if (id === 'mon') {
      const j = await G.choose(G.DEX.map(s => ({ label: G.SPECIES[s].name, right: '#' + G.SPECIES[s].num })).concat([{ label: 'Cancel' }]), { x: 60, y: 8, w: 200, maxRows: 14, cancel: G.DEX.length });
      if (j >= 0 && j < G.DEX.length) { const lv = await G.askNumber({ min: 1, max: 100, start: 30, text: 'Level?' }); if (lv > 0) { const sh = await G.yesno('Shiny?'); const m = G.mon.create(G.DEX[j], lv, { shiny: sh, perfectIVs: 6 }); m.ot = G.save.name; m.otId = G.save.otId; G.party.add(m); G.world.scene.placeFollower(); G.toast('Added ' + G.SPECIES[G.DEX[j]].name); } }
    }
    if (id === 'item') {
      const all = Object.keys(G.ITEMS);
      const j = await G.choose(all.map(i => ({ label: G.ITEMS[i].name, right: G.ITEMS[i].pocket })).concat([{ label: 'Cancel' }]), { x: 60, y: 8, w: 220, maxRows: 14, cancel: all.length });
      if (j >= 0 && j < all.length) { const n = await G.askNumber({ min: 1, max: 99, start: 10, text: 'How many?' }); if (n > 0) { G.bag.add(all[j], n); G.toast('Got ' + G.ITEMS[all[j]].name); } }
    }
    if (id === 'kit') { for (const i of ['dex', 'journal', 'resonanceband', 'bike', 'trailknife', 'pickhammer', 'gripboots', 'tideboard', 'wingwhistle', 'rod', 'prorod', 'expshare', 'vsrecorder', 'lantern', 'dowsing']) G.bag.add(i); for (let i = 1; i <= G.TM_LIST.length; i++) G.bag.add('tm' + String(i).padStart(2, '0')); G.bag.add('rarecandy', 50); G.bag.add('ultraorb', 50); G.bag.add('maxpotion', 30); G.bag.add('fullrestore', 20); G.bag.add('maxrevive', 20); G.save.money += 500000; for (const t of G.TOWNS) G.save.visited[t.id] = true; G.toast('Kit granted'); }
    if (id === 'lvl') { for (const m of G.save.party) { G.mon.setLevel(m, Math.min(100, m.lvl + 10)); m.hp = G.mon.maxHP(m); } G.toast('+10 levels'); }
    if (id === 'dex') { for (const s of G.DEX) { G.save.dex.seen[s] = true; G.save.dex.caught[s] = Date.now(); } G.toast('Dex completed'); }
    if (id === 'time') { const opts = ['Morning (7)', 'Day (12)', 'Dusk (18)', 'Night (22)', 'Normal clock']; const j = await G.choose(opts, { x: 120, y: 60, w: 120, cancel: 4 }); const hs = [7, 12, 18, 22]; if (j >= 0 && j < 4) G.save.vars.forceHour = hs[j]; else delete G.save.vars.forceHour; }
    if (id === 'trainer') {
      const ids = Object.keys(G.TRAINERS);
      const j = await G.choose(ids.map(t => ({ label: (G.TRAINERS[t].cls || '') + ' ' + G.TRAINERS[t].name, right: t })).concat([{ label: 'Cancel' }]), { x: 40, y: 8, w: 290, maxRows: 14, cancel: ids.length });
      if (j >= 0 && j < ids.length) { await G.storyBattle(ids[j]); return true; }
    }
    if (id === 'badges') { for (const b of G.BADGE_ORDER) if (!G.save.badges.includes(b)) G.save.badges.push(b); G.toast('All badges'); }
  }
};
G.jumpToChapter = async function (ch) {
  G.save.flags = {}; for (const f of ch.flags || []) G.save.flags[f] = true;
  G.save.badges = (ch.badges || []).slice();
  for (const it of ch.items || []) G.bag.add(it);
  if (!G.save.party.length || ch.freshParty) {
    G.save.party = [];
    for (const [sp, lv] of ch.party || [['kindlet', 5]]) { const m = G.mon.create(sp, lv, { perfectIVs: 3 }); m.ot = G.save.name; m.otId = G.save.otId; G.save.party.push(m); }
  } else for (const m of G.save.party) { if (m.lvl < ch.lvl) { G.mon.setLevel(m, ch.lvl); m.hp = G.mon.maxHP(m); } }
  for (const t of ch.visited || []) G.save.visited[t] = true;
  G.save.money = Math.max(G.save.money, ch.money || 3000);
  G.party.healAll();
  G.maps.reset();
  await G.world.scene.warpTo(ch.map, ch.x, ch.y, ch.dir || 'down');
  G.toast('Jumped to: ' + ch.name);
};
