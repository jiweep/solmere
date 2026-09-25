'use strict';
// ============================================================================
//  Title screen, new game setup, continue, debug (God Mode) menu
// ============================================================================
// stepped pixel glow: concentric rings in a few discrete strengths (no smooth gradients, so light
// reads as pixel art like the rest of the game)
G.pxGlow = function (b, x, y, r, rgb, a, steps = 4) {
  b.save(); b.globalCompositeOperation = 'lighter';
  for (let i = 0; i < steps; i++) {
    const rr = Math.round(r * (1 - i / steps));
    b.fillStyle = `rgba(${rgb},${(a / steps).toFixed(3)})`; b.beginPath(); b.arc(Math.round(x), Math.round(y), rr, 0, Math.PI * 2); b.fill();
  }
  b.restore();
};
G.TitleScene = class {
  constructor() { this.opaque = true; this.t = 0; this.stage = 'press'; this.parts = new G.Particles(); this.menu = null; }
  enter() { G.audio && G.audio.music('title'); }
  update(top) {
    this.t++; this.parts.update();
    if (this.t % 4 === 0) this.parts.add({ x: G.rand() * G.W, y: 150 + G.rand() * 60, vx: -.1, vy: -.18, life: 220, size: 1, color: G.pick(['#bff8ff', '#ffe0b0']), fadeIn: 60, blend: 'lighter' });
    if (!top) return;
    if (this.stage === 'press' && this.t > 40 && G.input.anyKeyThisFrame) { G.input.consumeAll(); G.audio && G.audio.sfx('select'); this.stage = 'menu'; G.run(() => this.mainMenu()); }
  }
  async mainMenu() {
    while (true) {
      const slots = [1, 2, 3].map(s => G.persist.summary(s));
      const has = slots.some(Boolean);
      const items = [];
      if (has) items.push({ id: 'cont', label: 'Continue' });
      items.push({ id: 'new', label: 'New Game' }, { id: 'showcase', label: 'Showcase' }, { id: 'opts', label: 'Options' }, { id: 'music', label: 'Music Room' }, { id: 'import', label: 'Import Save File' }, { id: 'help', label: 'How to Play' }, { id: 'credits', label: 'Credits' });
      // menu on the left, clear of the sea where Orrelume breaches
      const k = await G.choose(items, { x: 18, y: 96, w: 100, cancel: -1 });
      if (k < 0) { this.stage = 'press'; return; }
      const id = items[k].id;
      if (id === 'cont') { const s = await G.pickSlot('Continue which journey?', true); if (s) { await G.startFromSave(G.persist.read(s)); return; } }
      if (id === 'new') { const ok = await G.newGameFlow(); if (ok) return; }
      if (id === 'opts') { const prev = G.save; if (!G.save) G.save = G.newSave(); await G.openOptions(); if (!prev) G.save = null; }
      if (id === 'import') await G.importSave();
      if (id === 'help') await G.howToPlay();
      if (id === 'credits') await G.rollCredits(false);
      if (id === 'showcase') { await G.runTour(); return; }
      if (id === 'music') { await G.musicRoom(); G.audio && G.audio.music('title'); }
    }
  }
  // ------------------------------------------------------------------ scene
  // the painted HD seascape (js/art/titlehd.js) drawn at native resolution under the UI
  draw(b) { }
  drawBack(c) {
    let breach = null;
    const k = this.breachK !== undefined && this.breachK !== null ? this.breachK : (this.t % 1100) / 1100;
    if (k > .2 && k < .5) breach = { p: (k - .2) / .3, glow: !!this.glowBreach };
    G.titleHD.draw(c, { t: this.t, lamp: this.lampLevel === undefined ? 1 : this.lampLevel, breach, night: this.night || 0 });
  }
  drawUI() {
    const U = G.ui, t = this.t, k = Math.min(1, t / 60);
    const y = 26 - (1 - G.ease.outCubic(k)) * 30;
    const c = U.c, S = G.gfx.S;
    c.save(); c.globalAlpha = k;
    U.font(38, 900); c.textAlign = 'center'; c.textBaseline = 'top';
    // extruded depth: stacked copies stepping down-right, darkening
    for (let d = 5; d >= 1; d--) { c.fillStyle = d > 3 ? '#0a0e22' : '#3a2448'; c.fillText('SOLMERE', U.X(G.W / 2 + d * .5), U.Y(y + d * .7)); }
    c.lineJoin = 'round'; c.lineWidth = S * 2.4; c.strokeStyle = '#2a1830'; c.strokeText('SOLMERE', U.X(G.W / 2), U.Y(y));
    // face: warm gradient with a light band sweeping across every few seconds
    const sh = ((t % 300) / 300) * 1.6 - .3;
    const g = c.createLinearGradient(U.X(G.W / 2 - 110), U.Y(y), U.X(G.W / 2 + 110), U.Y(y + 38));
    g.addColorStop(0, '#ffe7a8'); g.addColorStop(Math.max(0, Math.min(1, sh - .06)), '#ffd27a'); g.addColorStop(Math.max(0, Math.min(1, sh)), '#fffdf4'); g.addColorStop(Math.max(0, Math.min(1, sh + .06)), '#ffc766'); g.addColorStop(1, '#f59a58');
    c.fillStyle = g; c.fillText('SOLMERE', U.X(G.W / 2), U.Y(y));
    c.restore();
    U.text('— TIDELIGHT —', G.W / 2, y + 44, { size: 9, weight: 800, align: 'center', color: '#8af0e0', alpha: k, outline: 'rgba(0,0,0,.5)' });
    if (this.stage === 'press' && t > 40 && Math.floor(t / 30) % 2 === 0) U.text('Press any key or click', G.W / 2, 150, { size: 8, weight: 800, align: 'center', color: '#fff', outline: 'rgba(0,0,0,.6)' });
    // browsers hold sound until the first click or key press; say so rather than seeming silent
    if (G.audio && G.audio.suspended && G.audio.suspended()) U.text('♪ Sound starts with your first click or key press', G.W / 2, 162, { size: 5.5, weight: 700, align: 'center', color: 'rgba(255,255,255,.75)', outline: 'rgba(0,0,0,.5)' });
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
      U.pick(22, y - 1.4, G.W - 44, 9.2, sel, () => { this.i = k; }, () => { this.i = k; G.input.tap(r.start ? 'a' : 'right'); });
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
      if ((I.pressed('left') || I.pressed('right')) && this.playing && F[this.playing + '@night']) this.toggleNight();
      if (I.pressed('b')) { I.consume('b'); G.audio && G.audio.sfx('back'); G.pop(this); res(); }
    },
    draw(b) { G.menuBG(b, '#1f4f7a', '#0b0c16', this.t / 60); },
    toggleNight() {
      if (!(this.playing && F[this.playing + '@night'])) { G.audio && G.audio.sfx('buzz'); return; }
      this.night = !this.night; if (G.audio) { G.audio.forceVariant = this.night ? 'night' : 'day'; G.audio.switchVariantNow && G.audio.switchVariantNow(); } G.audio && G.audio.sfx('cursor');
    },
    drawUI() {
      const U = G.ui, t = this.t, ease = G.ease;
      U.c.globalAlpha = .55; U.para(214, 0, 260, G.H, -40, '#07060c'); U.c.globalAlpha = 1;
      U.pHeader('MUSIC ROOM', 6, 4, { sub: `${list.length} tracks` });
      list.slice(this.scroll, this.scroll + this.rows).forEach((id, k) => {
        const j = k + this.scroll, sel = j === this.i, m = F[id], y = 26 + k * 14.4, playing = id === this.playing;
        const e = ease.outBack(G.clamp((t - k * 1.1) / 8, 0, 1)), x = 8 + k * 1.2 + (1 - e) * -120 + (sel ? 5 : 0);
        if (sel) { U.para(x + 3, y + 3, 196, 12, 4, '#07060c'); U.para(x, y, 196, 12, 4, '#ff3b4e'); } else U.para(x, y, 196, 12, 4, 'rgba(12,13,22,.88)');
        U.text(String(j + 1).padStart(2, '0'), x + 8, y + 2.6, { size: 6, weight: 800, color: sel ? '#ffe0e4' : '#8a8fa0', shadow: false });
        U.text((playing ? '♪ ' : '') + (m.title || id), x + 24, y + 2.2, { size: 6.6, weight: sel ? 800 : 700, color: playing && !sel ? '#8af0e0' : '#fff', shadow: sel ? '#7a0f1c' : false });
        if (F[id + '@night']) U.text('☾', x + 190, y + 2.2, { size: 6.5, align: 'right', color: sel ? '#fff' : '#9aa0d0', shadow: false });
        U.pick(8, y, 200, 14, sel, () => { this.i = j; });
      });
      if (this.scroll > 0) U.text('▲', 108, 20, { size: 5, align: 'center', color: '#ff3b4e' });
      if (this.scroll + this.rows < list.length) U.text('▼', 108, 200, { size: 5, align: 'center', color: '#ff3b4e' });
      // now playing card
      const cx = 226, cw = G.W - 234;
      U.para(cx - 4, 10, cw + 4, 100, 6, '#07060c'); U.para(cx - 4, 10, cw + 4, 2, 6, '#ff3b4e');
      U.text('NOW PLAYING', cx + 6, 15, { size: 6, weight: 800, color: '#ff3b4e', shadow: false });
      const np = G.audio && G.audio.nowPlaying && G.audio.nowPlaying();
      if (np) {
        const m = F[np.id] || {};
        G.ui.wrap(m.title || np.id, cw - 12, 8).slice(0, 2).forEach((l, k) => U.text(l, cx + 6, 27 + k * 11, { size: 8, weight: 800, color: '#fff' }));
        const frac = np.loopEnd ? Math.min(1, np.pos / np.loopEnd) : 0;
        U.para(cx + 6, 58, cw - 16, 4, 1, 'rgba(255,255,255,.15)'); U.para(cx + 6, 58, (cw - 16) * frac, 4, 1, '#8af0e0');
        const fmt = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
        U.text(fmt(np.pos), cx + 6, 65, { size: 5.5, color: '#b8bccb', shadow: false });
        if (m.bpm) U.text(`${Math.round(m.bpm)} bpm`, cx + cw - 10, 65, { size: 5.5, align: 'right', color: '#b8bccb', shadow: false });
      } else U.text('Pick a track to play it', cx + cw / 2, 40, { size: 6.5, align: 'center', color: '#b8bccb' });
      // buttons: day/night and back
      const btn = (x, y, w, label, on, click, dis) => {
        U.para(x + 2, y + 2, w, 13, 4, '#07060c'); U.para(x, y, w, 13, 4, dis ? '#2a2a34' : on ? '#ff3b4e' : '#12131c');
        U.text(label, x + w / 2 + 2, y + 3, { size: 6.4, weight: 800, align: 'center', color: dis ? '#6a6e7c' : '#fff', shadow: false });
        U.hot(x, y, w + 4, 14, null, click);
      };
      const hasNight = this.playing && F[this.playing + '@night'];
      btn(cx + 4, 80, 50, '☀ Day', !this.night, () => { if (this.night) this.toggleNight(); }, !hasNight);
      btn(cx + 60, 80, 50, '☾ Night', this.night, () => { if (!this.night) this.toggleNight(); }, !hasNight);
      btn(cx + 4, 118, 50, 'Stop', false, () => { this.playing = null; G.audio && G.audio.stopMusic(); });
      btn(cx + 60, 118, 50, 'Back', false, () => G.input.tap('b'));
      U.panel(cx, 142, cw - 4, 66, 'glass', { r: 6 });
      ['Original soundtrack in the DS-era style:', 'sequenced MIDI through a sampled GS', 'sound bank, mixed for seamless loops.'].forEach((l, k) => U.text(l, cx + 8, 149 + k * 10, { size: 5.6, color: '#dfe6f2' }));
      U.text(`${Object.keys(F).filter(k => k.includes('@night')).length} night arrangements`, cx + 8, 186, { size: 5.6, weight: 800, color: '#8af0e0' });
      U.text('Click or Z play · ◀ ▶ day/night · X back', cx + 8, 197, { size: 5, color: '#8a90a0' });
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

// ------------------------------------------------------------------ prologue --
// A cold open before the Professor: the night the Tidelight went dark and something in the Mere sang.
G.PrologueScene = class extends G.TitleScene {
  constructor() { super(); this.caption = ''; this.capA = 0; this.lampLevel = 1; this.breachK = 0; this.glowBreach = true; this.skip = false; this.night = 0; }
  enter() { }
  update(top) {
    this.t++; this.parts.update();
    if (top && (G.input.pressed('b') || G.input.pressed('start'))) { G.input.consumeAll(); this.skip = true; }
  }
  draw(b) {
    super.draw(b);
    if (this.night > 0) { b.fillStyle = `rgba(6,8,34,${(.5 * this.night).toFixed(3)})`; b.fillRect(0, 0, G.W, G.H); }
  }
  drawUI() {
    const U = G.ui;
    if (this.capA > 0) U.text(this.caption, G.W / 2, G.H - 40, { size: 8.4, weight: 700, align: 'center', color: '#f4ecd8', alpha: this.capA, outline: 'rgba(0,0,10,.8)', outlineW: 1.6 });
    U.text('X: skip', G.W - 8, G.H - 10, { size: 5, align: 'right', color: 'rgba(255,255,255,.35)' });
  }
};
G.runPrologue = async function () {
  const sc = new G.PrologueScene(); G.push(sc);
  G.audio && G.audio.music('tidelight_calm');
  const SKIP = {};
  const wait = async n => { for (let i = 0; i < n; i++) { if (sc.skip) throw SKIP; await G.wait(1); } };
  const cap = async (text, hold = 170) => { sc.caption = text; for (let i = 0; i <= 20; i++) { sc.capA = i / 20; await wait(1); } await wait(hold); for (let i = 20; i >= 0; i--) { sc.capA = i / 20; await wait(1); } };
  try {
    await G.fadeIn(50);
    await cap('Twelve years ago...', 110);
    for (let i = 0; i <= 60; i++) { sc.night = i / 60; await wait(1); }
    await cap('On the night of the spring tide, the Tidelight went dark.', 40);
    for (let i = 0; i < 70; i++) { sc.lampLevel = i > 55 ? 0 : (G.rand() < .45 ? 0 : .4 + G.rand() * .6); await wait(1); }
    sc.lampLevel = 0; await wait(40);
    const rise = (async () => { for (let i = 0; i <= 260; i++) { sc.breachK = .2 + .3 * i / 260; if (i === 110) { G.audio && G.audio.cry('orrelume'); } await wait(1); } })();
    await cap('And from the black water, something rose... and sang.', 140);
    await rise;
    await cap('Every mon in Solmere heard that song. Every person who loved one felt it.', 170);
    await cap('Some say it was saying goodbye.', 110);
    await cap('Others say... it was calling someone.', 150);
  } catch (e) { if (e !== SKIP) throw e; }
  await G.fadeOut(40, '#eaf6ff');
  G.pop(sc);
};
