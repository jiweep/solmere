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
      const tb = G.dailyTide && G.dailyTide.best();
      items.push({ id: 'new', label: 'New Game' });
      if (G.dailyTide) items.push({ id: 'tide', label: 'Daily Tide', right: tb ? tb.marks.slice(0, 14) : '#' + G.dailyTide.dayNo() });
      items.push({ id: 'showcase', label: 'Showcase' }, { id: 'opts', label: 'Options' }, { id: 'music', label: 'Music Room' }, { id: 'import', label: 'Import Save File' }, { id: 'help', label: 'How to Play' }, { id: 'credits', label: 'Credits' });
      // menu on the left, clear of the sea where Orrelume breaches
      const k = await G.choose(items, { x: 18, y: 88, w: 118, cancel: -1 });
      if (k < 0) { this.stage = 'press'; return; }
      const id = items[k].id;
      if (id === 'cont') { const s = await G.pickSlot('Continue which journey?', true); if (s) { await G.startFromSave(G.persist.read(s)); return; } }
      if (id === 'new') { const ok = await G.newGameFlow(); if (ok) return; }
      if (id === 'opts') { const prev = G.save; if (!G.save) G.save = G.newSave(); await G.openOptions({ side: true }); if (!prev) G.save = null; }
      if (id === 'import') await G.importSave();
      if (id === 'help') await G.howToPlay();
      if (id === 'credits') await G.rollCredits(false);
      if (id === 'showcase') { await G.runTour(); return; }
      if (id === 'tide') { await G.dailyTide.start(); G.audio && G.audio.music('title'); }
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
    G.drawLogo(G.W / 2, 14, t, { alpha: k, menu: this.stage === 'menu' });
    if (this.stage === 'press' && t > 40 && Math.floor(t / 30) % 2 === 0) U.text('Press any key or click', G.W / 2, 150, { size: 8, weight: 800, align: 'center', color: '#fff', outline: 'rgba(0,0,0,.6)' });
    // browsers hold sound until the first click or key press; say so rather than seeming silent
    if (G.audio && G.audio.suspended && G.audio.suspended()) U.text('♪ Sound starts with your first click or key press', G.W / 2, 162, { size: 5.5, weight: 700, align: 'center', color: 'rgba(255,255,255,.75)', outline: 'rgba(0,0,0,.5)' });
    U.text('v' + G.VERSION + '  ·  an original monster-taming adventure', G.W - 6, G.H - 9, { size: 4.8, align: 'right', color: 'rgba(255,255,255,.5)' });
  }
};
// ------------------------------------------------------------------ the wordmark
// SOLMERE in hand-set pixel letters: chunky, slanted, a sunset gradient on the faces, a deep plum extrusion,
// and the O is the setting sun, striped where it meets the sea. The letters drop in one by one, then bob
// like buoys; a glint sweeps across now and then, and a wave rolls along underneath.
G.LOGO_GLYPHS = {
  S: ['..#######..', '.#########.', '####....###', '###........', '#####......', '.########..', '..########.', '......#####', '........###', '###....####', '.#########.', '..#######..'],
  O: ['....####....', '..########..', '.##########.', '############', '############', '############', '............', '############', '............', '.##########.', '............', '....####....'],
  L: ['###......', '###......', '###......', '###......', '###......', '###......', '###......', '###......', '###......', '###......', '#########', '#########'],
  M: ['###.......###', '####.....####', '#####...#####', '######.######', '###.#####.###', '###..###..###', '###...#...###', '###.......###', '###.......###', '###.......###', '###.......###', '###.......###'],
  E: ['##########', '##########', '###.......', '###.......', '###.......', '########..', '########..', '###.......', '###.......', '###.......', '##########', '##########'],
  R: ['#########..', '##########.', '###....####', '###.....###', '###....####', '##########.', '#########..', '###...###..', '###....###.', '###.....###', '###.....###', '###.....###'],
};
G.drawLogo = function (cx, top, t, o = {}) {
  const word = 'SOLMERE', GL = G.LOGO_GLYPHS, H = 12, GAP = 2, PAD = 6, EX = 2, SK = 4;
  const widths = [...word].map(ch => GL[ch][0].length), W = widths.reduce((a, b) => a + b, 0) + GAP * (word.length - 1) + SK;
  const CW = W + PAD * 2, CH = H + PAD * 2 + EX + 4;
  const cv = G.drawLogo._cv || (G.drawLogo._cv = G.makeCanvas(CW, CH)), c = cv.getContext('2d');
  const img = c.createImageData(CW, CH), D = img.data;
  const mask = new Int8Array(CW * CH).fill(-1);   // letter index per pixel
  let x0 = PAD;
  [...word].forEach((ch, li) => {
    const g = GL[ch], drop = Math.max(0, 1 - G.ease.outBack(Math.min(1, Math.max(0, (t - li * 6) / 26))));
    const bob = Math.round(Math.sin(t / 26 - li * .8) * .9 - drop * 18);
    for (let y = 0; y < H; y++) for (let x = 0; x < g[y].length; x++) if (g[y][x] === '#') {
      const X = x0 + x + Math.floor((H - 1 - y) / 3), Y = PAD + y + bob;
      if (X >= 0 && X < CW && Y >= 0 && Y < CH) mask[Y * CW + X] = li;
    }
    x0 += widths[li] + GAP;
  });
  const put = (i, r, g, b, a = 255) => { D[i * 4] = r; D[i * 4 + 1] = g; D[i * 4 + 2] = b; D[i * 4 + 3] = a; };
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const FACE = ['#fffbe8', '#fff3c4', '#ffe79a', '#ffd878', '#ffc864', '#ffb456', '#ffa04e', '#ff8c4c', '#fb7a52', '#f06a5a', '#e25a66', '#cf4e72'].map(hex);
  const SUNF = ['#fff8c0', '#ffee90', '#ffdc6a', '#ffc452', '#ffa848', '#ff8c4a', '#ff7452', '#ff6a5c', '#ff6068', '#ff5a74', '#f8527c', '#ee4e84'].map(hex);
  const EXT = ['#7a2456', '#3e1036'].map(hex), OUT = hex('#1a0818');
  const at = (x, y) => x < 0 || y < 0 || x >= CW || y >= CH ? -1 : mask[y * CW + x];
  // extrusion (straight down, darkening), then the outline round letters and extrusion together
  const solid = new Uint8Array(CW * CH);
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) if (at(x, y) >= 0) for (let e = 0; e <= EX; e++) if (y + e < CH) solid[(y + e) * CW + x] = 1;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const i = y * CW + x;
    if (solid[i]) { if (at(x, y) < 0) { let e = 1; while (e <= EX && at(x, y - e) < 0) e++; const q = EXT[Math.min(EXT.length - 1, e - 1)]; put(i, ...q); } continue; }
    let edge = false; for (let dy = -1; dy <= 1 && !edge; dy++) for (let dx = -1; dx <= 1 && !edge; dx++) if (x + dx >= 0 && y + dy >= 0 && x + dx < CW && y + dy < CH && solid[(y + dy) * CW + x + dx]) edge = true;
    if (edge) put(i, ...OUT);
  }
  // faces: gradient by row, bright top edges, and a glint band sweeping across every few seconds
  const gp = (t % 260) * .9 - 30;
  for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
    const li = at(x, y); if (li < 0) continue;
    let row = 0; { let yy = y;   // row within its letter
      while (yy > 0 && at(x, yy - 1) === li) yy--; row = y - yy; }
    const ramp = word[li] === 'O' ? SUNF : FACE, q = ramp[Math.max(0, Math.min(11, row))].slice();
    if (at(x, y - 1) !== li) { q[0] = 255; q[1] = 255; q[2] = Math.min(255, q[2] + 60); }
    else if (at(x - 1, y) !== li && row < 8) { q[0] = Math.min(255, q[0] + 18); q[1] = Math.min(255, q[1] + 18); q[2] = Math.min(255, q[2] + 18); }
    const gd = x + y * .6 - gp; if (gd > 0 && gd < 3.5) { q[0] = 255; q[1] = 255; q[2] = 248; }
    put(y * CW + x, ...q);
  }
  c.putImageData(img, 0, 0);
  // draw it: whole screen pixels per logo pixel, no smoothing
  const U = G.ui, S = G.gfx.S, L = Math.max(1, Math.round(S * 2.25)) / S, ctx = U.c;
  const lx = cx - CW * L / 2, ly = top;
  ctx.save(); ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, Math.round(U.X(lx)), Math.round(U.Y(ly)), Math.round(CW * L * S), Math.round(CH * L * S));
  // the wave swash under the word: two rows of pixel water rolling left to right
  const wy = ly + (PAD + H + EX + 3) * L, px = Math.round(L * S);
  for (let x = 6; x < CW - 4; x++) {
    const ph = (x - t * .35) / 3.2, h = Math.round(Math.sin(ph) * 1.2), crest = Math.sin(ph) > .75;
    ctx.fillStyle = crest ? '#ffffff' : '#5ae8e0'; ctx.fillRect(Math.round(U.X(lx + x * L)), Math.round(U.Y(wy + h * L)), px, px);
    ctx.fillStyle = '#1a6a8a'; ctx.fillRect(Math.round(U.X(lx + x * L)), Math.round(U.Y(wy + (h + 1) * L)), px, px);
  }
  ctx.restore();
  // a sparkle or two winking on the letters
  const sp = Math.floor(t / 40), k = (t % 40) / 40;
  if (k < .5) { const sx = lx + ((sp * 37) % (CW - 20) + 10) * L, sy = ly + (PAD + 1 + (sp * 5) % 4) * L, a = Math.sin(k * 2 * Math.PI);
    ctx.save(); ctx.globalAlpha = a * (o.alpha === undefined ? 1 : o.alpha); ctx.fillStyle = '#ffffff';
    for (const [dx, dy, n] of [[0, 0, 1], [-1, 0, a > .6], [1, 0, a > .6], [0, -1, a > .6], [0, 1, a > .6], [-2, 0, a > .9], [2, 0, a > .9], [0, -2, a > .9], [0, 2, a > .9]]) if (n) ctx.fillRect(Math.round(U.X(sx + dx * L)), Math.round(U.Y(sy + dy * L)), px, px);
    ctx.restore(); }
};
G.pickSlot = async function (title, mustExist) {
  const items = [1, 2, 3].map(s => { const S = G.persist.summary(s); return { label: S ? `${s}: ${S.name} · ${S.badges}★ · ${S.time} · ${S.loc}` : `${s}: — empty —`, disabled: mustExist && !S, slot: s }; });
  items.push({ label: 'Back' });
  const k = await G.choose(items, { x: 18, y: 96, w: 212, title, cancel: 3 });
  if (k < 0 || k >= 3) return null;
  return items[k].slot;
};
G.importSave = async function () {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  // Cancelling the file dialog fires no change event: listen for 'cancel' (modern browsers) and, as a
  // fallback, the window regaining focus with nothing picked, so the menu comes straight back
  const file = await new Promise(res => {
    let done = false; const fin = f => { if (done) return; done = true; window.removeEventListener('focus', onFocus); res(f); };
    const onFocus = () => setTimeout(() => { if (!inp.files || !inp.files.length) fin(null); }, 400);
    inp.onchange = () => fin(inp.files[0] || null);
    inp.addEventListener('cancel', () => fin(null));
    inp.click();
    setTimeout(() => window.addEventListener('focus', onFocus), 50);
  });
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
      { k: 'levelCap', label: 'Level Caps', vals: ['off', 'soft', 'hard'], names: ['Off', 'Soft', 'Hard'], desc: ['No level caps.', 'EXP drops to 10% above the next Warden\'s ace level.', 'Echoes cannot level past the next Warden\'s ace level (shown in the menu).'] },
      { k: 'setMode', label: 'Battle Style', vals: [false, true], names: ['Switch', 'Set'], desc: ['You may switch when the foe sends a new Echo.', 'No free switch when the foe sends a new Echo (competitive rules).'] },
      { k: 'nuzlocke', label: 'Nuzlocke Mode', vals: [false, true], names: ['Off', 'On'], desc: ['Standard rules.', 'Only the first encounter per area may be caught. Fainted Echoes are gone forever. You must nickname everything. Ends if your whole party falls.'] },
      { k: 'dupes', label: '  · Dupes Clause', vals: [true, false], names: ['On', 'Off'], dep: 'nuzlocke', desc: ['Encounters of lines you already own don\'t use up the area.', 'Every first encounter counts.'] },
      { k: 'shinyc', label: '  · Shiny Clause', vals: [true, false], names: ['On', 'Off'], dep: 'nuzlocke', desc: ['Shinies can always be caught.', 'Shinies follow normal rules.'] },
      { k: 'hardcore', label: '  · Hardcore', vals: [false, true], names: ['Off', 'On'], dep: 'nuzlocke', desc: ['Items allowed in battle.', 'No items in battle, Set mode forced, no PC healing.'] },
      { k: 'random', label: 'Randomizer', vals: [false, true], names: ['Off', 'On'], desc: ['Species appear as designed.', 'Shuffle species, seeded per save. A fresh adventure every time!'] },
      { k: 'rwild', label: '  · Wild Echoes', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Randomize wild encounters.', 'Keep wild encounters.'] },
      { k: 'rtrain', label: '  · Trainers', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Randomize trainer teams.', 'Keep trainer teams.'] },
      { k: 'rstart', label: '  · Starters', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Randomize the starter choices.', 'Keep the classic three.'] },
      { k: 'rsimilar', label: '  · Similar strength', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Replacements have similar base stat totals.', 'Anything goes. Chaos.'] },
      { k: 'god', label: 'God Mode (testing)', vals: [false, true], names: ['Off', 'On'], desc: ['Off.', 'Adds a God Mode menu (pause menu, or ` key): invincibility, one-hit KOs, noclip, warps, chapter skips, give Echoes/items and more.'] },
      { k: 'start', label: '▶  BEGIN JOURNEY', start: true, desc: ['All set? Your adventure in Solmere awaits.'] },
    ];
  }
  visible() { return this.rows.filter(r => !r.dep || this.v[r.dep]); }
};
// the challenge setup, as a compact list at the side of the title (the sea stays in view)
G.newGameSetup = function () {
  const ng = new G.NewGameScene(null), v = ng.v;
  const rows = () => ng.visible().map(r => r.start ? { label: '▶ Begin Journey', start: true, desc: () => r.desc[0] } : {
    label: r.label.replace(/^  · /, '· '), name: () => r.names[Math.max(0, r.vals.indexOf(v[r.k]))],
    step: d => { const i = r.vals.indexOf(v[r.k]); v[r.k] = r.vals[(i + d + r.vals.length) % r.vals.length]; },
    desc: () => r.desc[Math.max(0, r.vals.indexOf(v[r.k]))] || r.desc[0],
  });
  return new Promise(res => G.push(new G.SideList({ title: 'New Journey', rows, y: 78, w: 196, maxRows: 7 }, ok => res(ok ? v : null))));
};
G.newGameFlow = async function () {
  const slot = await G.pickSlot('Save your journey in which slot?', false); if (!slot) return false;
  if (G.persist.exists(slot) && !await G.yesno('There\'s already a journey in that slot. Overwrite it forever?')) return false;
  const v = await G.newGameSetup(); if (!v) return false;
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
    'Welcome to Solmere! You\'re a brand-new Tamer. Six Warden badges, the Conclave, then the Champion. Easy. (It is not easy.)',
    'Wild Echoes roam the grass, water and caves. Bump into one to battle it. Wear it down, then throw an Orb. Much weaker ones you already own get Swept, and chained sweeps pay bonus EXP.',
    'Tamers who spot you will battle you. Win for money and EXP. Lose and you\'ll wake up at a Haven, poorer and wiser.',
    'The deep stuff is all here: natures, IVs & EVs (Summary ▸ Stats), abilities, held items, weather, hazards, doubles, and the physical/special split.',
    'Resonance: once per battle, press R in the Fight menu to let an Echo Resonate. Its main type hits much harder, and a shield blunts the first super-effective hit.',
    'No HMs (key items clear obstacles), a free move relearner (Party ▸ Moves), Always Run, and Turbo on Tab.',
    'Co-op: run the included server and choose Link in the menu to explore, trade and battle with a friend.',
    'Press H in the overworld for controls any time. Go be legendary.',
  ]);
};
G.rollCredits = async function (ending) {
  const lines = ['SOLMERE', '', 'A monster-taming adventure', '', '— Design, Story, Code, Art & Music —', 'Built with care, one pixel at a time', '', '— Starring —', ...G.DEX.map(id => G.SPECIES[id].name), '', '— Special Thanks —', 'Every Tamer who ever talked to their follower', 'Nuzlocke veterans everywhere', 'You, for playing', '', ending ? 'Thank you for playing!' : ''];
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
  const A = () => G.audio;
  // the secret list: every track (auditions included) by when it was last worked on, newest first
  const recent = Object.keys(F).filter(id => !id.includes('@') && !id.startsWith('j_') && F[id].worked).sort((x, y) => F[y].worked - F[x].worked).slice(0, 14);
  const ago = t => { const s = Date.now() / 1000 - t; return s < 3600 ? Math.max(1, Math.round(s / 60)) + ' min ago' : s < 86400 ? Math.round(s / 3600) + ' h ago' : Math.round(s / 86400) + ' d ago'; };
  return new Promise(res => G.push({
    opaque: true, i: 0, scroll: 0, t: 0, night: false, playing: null, rows: 12, secret: false, si: 0, drag: false, dragPos: null,
    enter() { if (A()) A().forceVariant = 'day'; G.input.keyHook = e => G.top() === this && this.onKey(e); },
    exit() { if (A()) A().forceVariant = null; G.input.keyHook = null; },
    play(id) { this.playing = id; if (A()) { A().forceVariant = this.night ? 'night' : 'day'; A().stopMusic(); A().music(id); } },
    step(d) { const n = list.length; this.i = ((list.indexOf(this.playing) >= 0 ? list.indexOf(this.playing) : this.i) + d + n) % n; this.play(list[this.i]); },
    seekBy(ds) { const np = A() && A().nowPlaying(); if (np) A().seek(np.pos + ds); },
    togglePause() { const au = A(); if (!au) return; if (au.isPaused()) au.resume(); else if (au.nowPlaying()) au.pause(); else this.play(list[this.i]); },
    // music-player keys (claimed before the normal key map): Space/K pause, ←/→ seek 5 s (Shift 15 s),
    // J/L seek 10 s, , and . previous / next track, N day/night, 0 or Home restart, W the secret list
    onKey(e) {
      if (e.repeat && !['ArrowLeft', 'ArrowRight', 'KeyJ', 'KeyL'].includes(e.code)) return ['Space', 'KeyK'].includes(e.code);
      switch (e.code) {
        case 'Space': case 'KeyK': this.togglePause(); return true;
        case 'ArrowLeft': case 'ArrowRight': { if (this.secret || !(A() && A().nowPlaying())) return false; this.seekBy((e.code === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 15 : 5)); return true; }
        case 'KeyJ': this.seekBy(-10); return true;
        case 'KeyL': this.seekBy(10); return true;
        case 'Comma': this.step(-1); return true;
        case 'Period': this.step(1); return true;
        case 'KeyN': this.toggleNight(); return true;
        case 'Digit0': case 'Home': if (A() && A().nowPlaying()) A().seek(0); return true;
        case 'KeyW': this.secret = !this.secret; this.si = 0; A() && A().sfx(this.secret ? 'select' : 'back'); return true;
      }
      return false;
    },
    update(top) {
      this.t++; if (!top) return; const I = G.input, n = list.length, M = I.mouse;
      if (this.secret) {
        if (I.repeat('up')) this.si = (this.si + recent.length - 1) % recent.length;
        if (I.repeat('down')) this.si = (this.si + 1) % recent.length;
        if (I.pressed('a')) { I.consume('a'); this.play(recent[this.si]); }
        if (I.pressed('b')) { I.consume('b'); this.secret = false; A() && A().sfx('back'); }
        return;
      }
      if (I.repeat('up')) { this.i = (this.i + n - 1) % n; A() && A().sfx('cursor'); }
      if (I.repeat('down')) { this.i = (this.i + 1) % n; A() && A().sfx('cursor'); }
      if (this.i < this.scroll) this.scroll = this.i;
      if (this.i >= this.scroll + this.rows) this.scroll = this.i - this.rows + 1;
      if (I.pressed('a')) { I.consume('a'); this.play(list[this.i]); }
      if (I.pressed('b')) { I.consume('b'); A() && A().sfx('back'); G.pop(this); res(); }
      // the seek bar: click or drag anywhere on it; the audio follows on release (and every few frames while dragging)
      const np = A() && A().nowPlaying(), B = this.bar;
      if (np && B && M.down && (this.drag || (M.x >= B.x - 2 && M.x <= B.x + B.w + 2 && M.y >= B.y - 5 && M.y <= B.y + B.h + 5))) {
        this.drag = true; this.dragPos = G.clamp((M.x - B.x) / B.w, 0, 1) * np.loopEnd;
        if (this.t % 8 === 0) A().seek(this.dragPos);
      } else if (this.drag) { this.drag = false; if (np && this.dragPos !== null) A().seek(this.dragPos); this.dragPos = null; }
    },
    draw(b) { G.menuBG(b, '#1f4f7a', '#0b0c16', this.t / 60); },
    toggleNight() {
      if (!(this.playing && F[this.playing + '@night'])) { A() && A().sfx('buzz'); return; }
      this.night = !this.night; if (A()) { A().forceVariant = this.night ? 'night' : 'day'; A().switchVariantNow && A().switchVariantNow(); } A() && A().sfx('cursor');
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
        U.pick(8, y, 200, 14, sel, () => { if (this.i === j) this.play(id); else this.i = j; });
      });
      if (this.scroll > 0) U.text('▲', 108, 20, { size: 5, align: 'center', color: '#ff3b4e' });
      if (this.scroll + this.rows < list.length) U.text('▼', 108, 200, { size: 5, align: 'center', color: '#ff3b4e' });
      // now playing card with a seek bar and transport buttons
      const cx = 226, cw = G.W - 234;
      U.para(cx - 4, 10, cw + 4, 100, 6, '#07060c'); U.para(cx - 4, 10, cw + 4, 2, 6, '#ff3b4e');
      U.text('NOW PLAYING', cx + 6, 15, { size: 6, weight: 800, color: '#ff3b4e', shadow: false });
      const np = A() && A().nowPlaying();
      const fmt = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
      this.bar = { x: cx + 6, y: 56, w: cw - 16, h: 5 };
      const B = this.bar;
      if (np) {
        const m = F[np.id] || F[np.id.split('@')[0]] || {};
        G.ui.wrap(m.title || np.id, cw - 12, 8).slice(0, 2).forEach((l, k) => U.text(l, cx + 6, 25 + k * 11, { size: 8, weight: 800, color: '#fff' }));
        const pos = this.dragPos !== null && this.drag ? this.dragPos : np.pos, len = np.loopEnd || 1, frac = Math.min(1, pos / len);
        U.para(B.x, B.y, B.w, B.h, 1, 'rgba(255,255,255,.15)'); U.para(B.x, B.y, B.w * frac, B.h, 1, np.paused ? '#b8bccb' : '#8af0e0');
        if (np.loopStart) { const lx = B.x + B.w * np.loopStart / len; U.para(lx, B.y - 1, .7, B.h + 2, 0, 'rgba(255,255,255,.45)'); }   // where the loop begins
        const hx = B.x + B.w * frac; U.para(hx - 2, B.y - 2, 4, B.h + 4, 1, '#fff');
        U.text(fmt(pos) + ' / ' + fmt(len), cx + 6, B.y + 8, { size: 5.5, color: '#b8bccb', shadow: false });
        if (m.bpm) U.text(`${Math.round(m.bpm)} bpm`, cx + cw - 10, B.y + 8, { size: 5.5, align: 'right', color: '#b8bccb', shadow: false });
        U.hot(B.x - 2, B.y - 5, B.w + 4, B.h + 10, null, () => { const M = G.input.mouse; A().seek(G.clamp((M.x - B.x) / B.w, 0, 1) * len); });   // click to jump; dragging is followed in update
      } else U.text('Pick a track to play it', cx + cw / 2, 36, { size: 6.5, align: 'center', color: '#b8bccb' });
      const btn = (x, y, w, label, on, click, dis) => {
        U.para(x + 2, y + 2, w, 13, 4, '#07060c'); U.para(x, y, w, 13, 4, dis ? '#2a2a34' : on ? '#ff3b4e' : '#12131c');
        U.text(label, x + w / 2 + 2, y + 3, { size: 6.4, weight: 800, align: 'center', color: dis ? '#6a6e7c' : '#fff', shadow: false });
        U.hot(x, y, w + 4, 14, null, click);
      };
      const paused = A() && A().isPaused && A().isPaused();
      const tw = (cw - 14) / 5;
      [['|◀', () => this.step(-1)], ['◀◀', () => this.seekBy(-10)], [paused || !np ? '▶' : 'II', () => this.togglePause()], ['▶▶', () => this.seekBy(10)], ['▶|', () => this.step(1)]]
        .forEach(([l, fn], k) => btn(cx + 4 + k * tw, 74, tw - 4, l, k === 2 && !paused && !!np, fn));
      const hasNight = this.playing && F[this.playing + '@night'];
      btn(cx + 4, 94, 50, '☀ Day', !this.night, () => { if (this.night) this.toggleNight(); }, !hasNight);
      btn(cx + 60, 94, 50, '☾ Night', this.night, () => { if (!this.night) this.toggleNight(); }, !hasNight);
      btn(cx + 4, 118, 50, 'Stop', false, () => { this.playing = null; A() && A().stopMusic(); });
      btn(cx + 60, 118, 50, 'Back', false, () => G.input.tap('b'));
      U.panel(cx, 142, cw - 4, 66, 'glass', { r: 6 });
      ['Space pause · ← → seek (Shift 15 s)', 'J / L jump 10 s · , . prev / next', 'N day / night · 0 restart · X back'].forEach((l, k) => U.text(l, cx + 8, 149 + k * 10, { size: 5.4, color: '#dfe6f2' }));
      U.text(`${Object.keys(F).filter(k => k.includes('@night')).length} night arrangements`, cx + 8, 186, { size: 5.6, weight: 800, color: '#8af0e0' });
      U.text('Click the bar to jump anywhere', cx + 8, 197, { size: 5, color: '#8a90a0' });
      // the secret list (W)
      if (this.secret) {
        U.para(0, 0, G.W, G.H, 0, 'rgba(5,6,12,.72)');
        const x0 = 40, y0 = 18, w = G.W - 80;
        U.para(x0 + 3, y0 + 3, w, 180, 6, '#000'); U.para(x0, y0, w, 180, 6, '#101226'); U.para(x0, y0, w, 3, 6, '#8af0e0');
        U.text('RECENTLY WORKED ON', x0 + 10, y0 + 8, { size: 7.5, weight: 900, color: '#8af0e0' });
        U.text('newest first · W to close', x0 + w - 10, y0 + 9, { size: 5.4, align: 'right', color: '#8a90a0', shadow: false });
        recent.forEach((id, k) => {
          const y = y0 + 22 + k * 11, sel = k === this.si, m = F[id];
          if (sel) U.para(x0 + 6, y - 1, w - 12, 10, 3, '#ff3b4e');
          U.text((id === (np && np.id.split('@')[0]) ? '♪ ' : '') + (m.title || id), x0 + 12, y, { size: 6.2, weight: sel ? 800 : 700, color: '#fff', shadow: false });
          if (m.hidden) U.text('AUDITION', x0 + w - 70, y + .5, { size: 5, weight: 900, color: sel ? '#fff' : '#ffb84a', shadow: false });
          U.text(ago(m.worked), x0 + w - 12, y + .5, { size: 5.2, align: 'right', color: sel ? '#ffe0e4' : '#8a90a0', shadow: false });
          U.hot(x0 + 6, y - 1, w - 12, 10, () => { this.si = k; }, () => { this.si = k; this.play(id); });
        });
      }
    },
  }));
};
// ------------------------------------------------------------ god mode ---
G.openDebugMenu = async function () {
  const g = G.save.god;
  while (true) {
    const tog = (k, l) => ({ id: 't_' + k, label: `${l}: ${g[k] ? 'ON' : 'off'}` });
    const items = [tog('invincible', 'Invincible'), tog('ohko', 'One-hit KOs'), tog('noclip', 'Walk through walls'), tog('noEnc', 'No encounters'), tog('catch100', '100% catch'), tog('speed', 'Fast walk'),
      { id: 'heal', label: 'Heal party' }, { id: 'chapter', label: 'Jump to chapter…' }, { id: 'warp', label: 'Warp to map…' }, { id: 'mon', label: 'Give Echo…' }, { id: 'item', label: 'Give item…' },
      { id: 'kit', label: 'Give key items + Skill Discs + $' }, { id: 'lvl', label: 'Party +10 levels' }, { id: 'dex', label: 'Complete Dex' }, { id: 'time', label: 'Set time of day…' }, { id: 'trainer', label: 'Battle trainer…' }, { id: 'badges', label: 'Give all badges' }, { id: 'close', label: 'Close' }];
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
// A cold open before the Professor: the night the Lodestar went dark and something in the Mere sang.
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
    await cap('Twelve years ago, two scientists tried to record a song.', 130);
    for (let i = 0; i <= 60; i++) { sc.night = i / 60; await wait(1); }
    await cap('"Thirty more seconds," one of them said.', 110);
    await cap('Then the Lodestar went dark.', 40);
    for (let i = 0; i < 70; i++) { sc.lampLevel = i > 55 ? 0 : (G.rand() < .45 ? 0 : .4 + G.rand() * .6); await wait(1); }
    sc.lampLevel = 0; await wait(40);
    const rise = (async () => { for (let i = 0; i <= 260; i++) { sc.breachK = .2 + .3 * i / 260; if (i === 110) { G.audio && G.audio.cry('orrelume'); } await wait(1); } })();
    await cap('And from the black water, something rose... and sang.', 140);
    await rise;
    await cap('Every Echo in Solmere heard it. Every person who loved one felt it.', 160);
    await cap('Hidden in the song was a name.', 120);
    await cap('Somebody has spent twelve years trying to answer it.', 160);
  } catch (e) { if (e !== SKIP) throw e; }
  await G.fadeOut(40, '#eaf6ff');
  G.pop(sc);
};
