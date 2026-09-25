'use strict';
// ============================================================================
//  Pause menu and sub-screens
// ============================================================================
G.openPauseMenu = async function () {
  const w = G.world.scene; if (!w) return;
  w.busy++; G.audio && G.audio.sfx('menu_open');
  try {
    let start = G.pauseIndex || 0;
    while (true) {
      const items = [];
      if (G.bag.has('dex')) items.push({ id: 'dex', label: 'Dex', icon: 'dex', col: '#e8484a' });
      if (G.save.party.length) items.push({ id: 'party', label: 'Party', icon: 'orb', col: '#e8484a' });
      items.push({ id: 'bag', label: 'Bag', icon: 'box', col: '#b0892a' });
      items.push({ id: 'card', label: G.save.name, icon: 'card', col: '#3b82e0' });
      if (G.bag.has('journal')) items.push({ id: 'quests', label: 'Journal', icon: 'book', col: '#b0892a' });
      items.push({ id: 'map', label: 'Map', icon: 'whistle', col: '#a98ff3' });
      items.push({ id: 'enc', label: 'Encounters', icon: 'leaf', col: '#2aa86a' });
      items.push({ id: 'save', label: 'Save', icon: 'book', col: '#1ba7b8' });
      items.push({ id: 'options', label: 'Options', icon: 'gem', col: '#9b5de5' });
      if (location.protocol.startsWith('http')) items.push({ id: 'link', label: 'Link (Co-op)', icon: 'cord', col: '#2bb3a3' });
      if (G.save.settings.god) items.push({ id: 'debug', label: 'God Mode', icon: 'charm', col: '#f2d23b' });
      items.push({ id: 'close', label: 'Close' });
      const r = await new Promise(res => G.push(new G.PauseScene(items, Math.min(start, items.length - 1), res)));
      if (r === null || items[r].id === 'close') return;
      G.pauseIndex = start = r;
      const id = items[r].id;
      if (id === 'dex') await G.openDex();
      if (id === 'party') await G.openParty({ mode: 'field' });
      if (id === 'bag') await G.openBag({ mode: 'field' });
      if (id === 'card') await G.openTrainerCard();
      if (id === 'quests') await G.openQuests();
      if (id === 'map') { const flew = await G.openTownMap({ fly: G.bag.has('wingwhistle') }); if (flew) return; }
      if (id === 'enc') await G.openEncounters();
      if (id === 'save') { await G.saveFlow(); }
      if (id === 'options') await G.openOptions();
      if (id === 'link') await G.net.openLinkMenu();
      if (id === 'debug') { const done = await G.openDebugMenu(); if (done) return; }
    }
  } finally { w.busy--; }
};
G.PauseScene = class {
  constructor(items, i, res) { this.items = items; this.i = i; this.res = res; this.lowres = false; this.t = 0; }
  update(top) {
    this.t++; if (!top) return;
    const I = G.input, n = this.items.length;
    if (I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
    if (I.pressed('a')) { I.consume('a'); G.audio && G.audio.sfx('select'); G.pop(this); this.res(this.i); }
    if (I.pressed('b') || I.pressed('start')) { I.consume('b'); I.consume('start'); G.audio && G.audio.sfx('back'); G.pop(this); this.res(null); }
  }
  drawUI() {
    const U = G.ui, k = Math.min(1, this.t / 8), x = G.W - 96 * G.ease.outCubic(k) - 4, w = 92;
    const h = this.items.length * 14 + 10;
    U.panel(x, 6, w, h, 'light', { r: 7 });
    this.items.forEach((it, j) => {
      const y = 11 + j * 14, sel = j === this.i;
      if (sel) { U.rrect(x + 3, y - 1, w - 6, 13, 4); U.c.fillStyle = 'rgba(59,130,224,.18)'; U.c.fill(); }
      if (it.icon) U.img(G.tiles.itemIcon(it.icon, it.col), x + 6, y - .5, { scale: .75 });
      U.text(it.label, x + 21, y + 1.4, { size: 7.4, weight: sel ? 800 : 700, color: sel ? '#1e3a70' : '#283040' });
    });
    // info strip
    const lead = G.party.lead();
    U.panel(6, 6, 150, 30, 'glass', { r: 6 });
    U.text(G.world.scene.map.name, 12, 9, { size: 7, color: '#fff', weight: 800 });
    U.text(`${G.clock.label()}  ·  $${G.save.money.toLocaleString()}  ·  ${G.save.badges.length} badges`, 12, 20, { size: 5.8, color: '#cde' });
    if (G.save.repel > 0) U.text(`Repel: ${G.save.repel} steps`, 12, 28, { size: 5, color: '#9fe8b0' });
    if (G.save.settings.nuzlocke) { U.panel(6, 40, 150, 14, 'red', { r: 5 }); U.text(`NUZLOCKE · ${G.save.graveyard.length} fallen · ${Object.keys(G.save.nuz.enc).length} areas`, 81, 43, { size: 5.4, color: '#fff', weight: 800, align: 'center' }); }
    if (G.save.settings.levelCap !== 'off') U.text(`Level cap: ${G.levelCapNow()}`, 12, G.save.settings.nuzlocke ? 58 : 42, { size: 5.4, color: '#ffe08a', weight: 800, outline: 'rgba(0,0,0,.5)' });
  }
};
// ---------------------------------------------------------- trainer card --
G.openTrainerCard = function () {
  return new Promise(res => G.push({
    opaque: true, t: 0, page: 0,
    update(top) { this.t++; if (!top) return; if (G.input.pressed('left') || G.input.pressed('right')) { this.page ^= 1; G.audio && G.audio.sfx('page'); } if (G.input.pressed('b') || G.input.pressed('a')) { G.input.consume('b'); G.input.consume('a'); G.pop(this); res(); } },
    draw(b) { G.menuBG(b, '#2f6fd6', '#12305e', this.t / 60); const img = G.chars.portrait(G.LOOKS[G.save.look], 'hip'); b.drawImage(img, 290 - (img.width - 72) / 2, 60); },
    drawUI() {
      const U = G.ui, s = G.save, d = G.dexCount();
      U.panel(10, 10, 270, 196, 'light', { r: 8 });
      U.panel(10, 10, 270, 20, 'blue', { r: 8 }); U.text('TAMER CARD', 20, 14.5, { size: 8, weight: 900, color: '#fff' });
      U.text(`ID No. ${String(s.otId).padStart(5, '0')}`, 270, 15, { size: 6.4, weight: 800, color: '#fff', align: 'right' });
      if (this.page === 0) {
        const rows = [['Name', s.name], ['Money', '$' + s.money.toLocaleString()], ['Dex', `${d.caught} caught / ${d.seen} seen`], ['Time', G.fmtTime(s.playtime)], ['Difficulty', G.DIFF[s.settings.difficulty].name + (s.settings.nuzlocke ? ' · Nuzlocke' : '') + (s.settings.randomizer && s.settings.randomizer.on ? ' · Random' : '')], ['Started', new Date(s.created).toLocaleDateString()]];
        rows.forEach(([k, v], i) => { U.text(k, 22, 38 + i * 14, { size: 7, weight: 800, color: '#6a7080' }); U.text(v, 100, 38 + i * 14, { size: 7.2, weight: 700 }); });
        U.text('BADGES', 22, 128, { size: 6.4, weight: 900, color: '#6a7080' });
        G.BADGE_ORDER.forEach((id, i) => { const x = 36 + i * 40, y = 158; U.panel(x - 16, y - 16, 32, 32, 'dark', { r: 16, noShadow: true }); if (s.badges.includes(id)) G.drawBadge(G.BADGES[id], x, y, 11, this.t); });
        if (G.flag('champion')) U.text('★ CHAMPION ★', 150, 190, { size: 7, weight: 900, color: '#d99a14', align: 'center' });
      } else {
        const st = s.stats;
        const rows = [['Battles', st.battles], ['Wild battles', st.wild], ['Trainers beaten', st.trainers], ['Mons caught', st.caught], ['Shinies found', st.shinies], ['Evolutions', st.evolutions], ['Steps taken', st.steps], ['Money earned', '$' + st.earned.toLocaleString()], ['Highest level', st.highestLvl], ['Battle Spire best', s.spire.best]];
        rows.forEach(([k, v], i) => { U.text(k, 22, 38 + i * 15.5, { size: 7, weight: 800, color: '#6a7080' }); U.text(String(v), 262, 38 + i * 15.5, { size: 7.2, weight: 700, align: 'right' }); });
      }
      U.text('◀ ▶ flip card', 145, 198, { size: 5.4, align: 'center', color: '#8a90a0' });
    },
  }));
};
// ------------------------------------------------------------- options --
G.openOptions = function () {
  const S = G.settings, sv = G.save;
  const opts = [
    { k: 'textSpeed', label: 'Text Speed', vals: [0, 1, 2, 3], names: ['Slow', 'Mid', 'Fast', 'Instant'] },
    { k: 'battleAnims', label: 'Battle Animations', vals: [true, false], names: ['On', 'Off'] },
    { k: 'battleSpeed', label: 'Battle Speed', vals: [1, 1.5, 2, 3], names: ['1x', '1.5x', '2x', '3x'] },
    { k: 'ffSpeed', label: 'Fast-Forward Speed', vals: [2, 3, 4, 6, 8, 12, 16, 24], names: ['2x', '3x', '4x', '6x', '8x', '12x', '16x', '24x'] },
    { k: 'ffMode', label: 'Fast-Forward Key (Tab)', vals: ['toggle', 'hold'], names: ['Toggle', 'Hold'] },
    { k: 'battleStyle', label: 'Battle Style', vals: ['switch', 'set'], names: ['Switch', 'Set'], save: true, apply: v => sv.settings.setMode = v === 'set', get: () => sv.settings.setMode ? 'set' : 'switch' },
    { k: 'expShare', label: 'EXP Share', vals: [true, false], names: ['On', 'Off'], save: true, get: () => sv.settings.expShare, apply: v => sv.settings.expShare = v },
    { k: 'hints', label: 'Effectiveness Hints', vals: [true, false], names: ['On', 'Off'] },
    { k: 'dmgPreview', label: 'Damage Preview', vals: [false, true], names: ['Off', 'On'] },
    { k: 'autosave', label: 'Autosave', vals: [true, false], names: ['On (on map change)', 'Off'] },
    { k: 'autoRun', label: 'Always Run', vals: [false, true], names: ['Off', 'On'] },
    { k: 'follower', label: 'Walking Buddy', vals: [true, false], names: ['On', 'Off'], save: true, get: () => sv.follower, apply: v => { sv.follower = v; G.world.scene && G.world.scene.placeFollower(); } },
    { k: 'music', label: 'Music Volume', vals: [0, .2, .4, .6, .7, .8, 1], names: ['0', '2', '4', '6', '7', '8', '10'] },
    { k: 'sfx', label: 'Sound Volume', vals: [0, .2, .4, .6, .8, 1], names: ['0', '2', '4', '6', '8', '10'] },
    { k: 'clock', label: 'Day/Night Clock', vals: ['accel', 'real'], names: ['Fast (48 min day)', 'Real time'] },
    { k: 'fill', label: 'Screen Scaling', vals: [false, true], names: ['Pixel-perfect', 'Fill window'] },
  ];
  return new Promise(res => G.push({
    opaque: true, i: 0, t: 0,
    val(o) { return o.get ? o.get() : S[o.k]; },
    set(o, v) { if (o.apply) o.apply(v); else S[o.k] = v; if (o.k === 'music' || o.k === 'sfx') G.audio && G.audio.setVolumes(); if (o.k === 'fill') { G.gfx.fill = v; G.gfx.resize(); } G.persist.saveSettings(); },
    update(top) {
      this.t++; if (!top) return; const I = G.input, n = opts.length;
      if (I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
      const o = opts[this.i]; let vi = o.vals.indexOf(this.val(o)); if (vi < 0) vi = 0;
      if (I.repeat('left')) { this.set(o, o.vals[(vi + o.vals.length - 1) % o.vals.length]); G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('right') || I.pressed('a')) { I.consume('a'); this.set(o, o.vals[(vi + 1) % o.vals.length]); G.audio && G.audio.sfx('cursor'); }
      if (I.pressed('b')) { I.consume('b'); G.audio && G.audio.sfx('back'); G.pop(this); res(); }
    },
    draw(b) { G.menuBG(b, '#6e44d6', '#2a1560', this.t / 60); },
    drawUI() {
      const U = G.ui;
      U.panel(20, 8, G.W - 40, 200, 'light', { r: 8 });
      U.text('Options', G.W / 2, 13, { size: 9, weight: 900, align: 'center' });
      opts.forEach((o, k) => {
        const y = 27 + k * 12.2, sel = k === this.i;
        if (sel) { U.rrect(26, y - 1.5, G.W - 52, 11.6, 3); U.c.fillStyle = 'rgba(155,93,229,.18)'; U.c.fill(); }
        U.text(o.label, 34, y + .6, { size: 7, weight: 700 });
        const vi = Math.max(0, o.vals.indexOf(this.val(o)));
        U.text('◀  ' + o.names[vi] + '  ▶', G.W - 36, y + .6, { size: 7, weight: 800, align: 'right', color: sel ? '#6e44d6' : '#4a5060' });
      });
      U.text('Settings save automatically.  ◀ ▶ change · X back', G.W / 2, 199, { size: 5.4, color: '#8a90a0', align: 'center' });
    },
  }));
};
// ------------------------------------------------------------- saving ---
G.saveFlow = async function () {
  const sum = `${G.save.name} · ${G.save.badges.length} badges · Dex ${G.dexCount().caught} · ${G.fmtTime(G.save.playtime)}`;
  if (!await G.yesno(`Save your progress?\\n{k}${sum}{w}`)) return;
  G.audio && G.audio.sfx('save');
  const ok = G.persist.write();
  await G.say(ok ? `${G.save.name} saved the game!` : 'The save failed! (Browser storage may be full or blocked.)');
  if (ok && await G.yesno('Also download a backup save file?')) G.persist.exportFile();
};
// ------------------------------------------------------------- quests ---
G.openQuests = function () {
  const ids = Object.keys(G.save.quests).filter(id => G.QUESTS[id]);
  const active = ids.filter(id => G.save.quests[id].step !== 'done'), done = ids.filter(id => G.save.quests[id].step === 'done');
  const list = [...active, ...done];
  return new Promise(res => G.push({
    opaque: true, i: 0, t: 0,
    update(top) { this.t++; if (!top) return; const I = G.input, n = Math.max(1, list.length); if (I.repeat('up')) this.i = (this.i + n - 1) % n; if (I.repeat('down')) this.i = (this.i + 1) % n; if (I.pressed('b') || I.pressed('a')) { I.consume('b'); I.consume('a'); G.pop(this); res(); } },
    draw(b) { G.menuBG(b, '#b0892a', '#4a3410', this.t / 60); },
    drawUI() {
      const U = G.ui;
      U.panel(8, 8, 150, 200, 'paper', { r: 7 });
      U.text('Tamer\'s Journal', 83, 13, { size: 8.4, weight: 900, align: 'center', color: '#4a3a20' });
      if (!list.length) U.text('No entries yet.', 83, 100, { size: 7, color: '#8a7550', align: 'center' });
      list.slice(0, 13).forEach((id, k) => {
        const Q = G.QUESTS[id], dn = G.save.quests[id].step === 'done', y = 28 + k * 13.5, sel = k === this.i;
        if (sel) { U.rrect(12, y - 1.5, 142, 12.5, 3); U.c.fillStyle = 'rgba(176,137,42,.25)'; U.c.fill(); }
        U.text((dn ? '✓ ' : Q.main ? '★ ' : '• ') + Q.name, 18, y + .5, { size: 6.6, weight: 700, color: dn ? '#8a9a70' : Q.main ? '#8a3a20' : '#4a3a20' });
      });
      const id = list[this.i];
      U.panel(164, 8, 212, 200, 'paper', { r: 7 });
      if (id) {
        const Q = G.QUESTS[id], st = G.save.quests[id].step;
        U.text(Q.name, 172, 14, { size: 8.4, weight: 900, color: '#4a3a20' });
        U.text(Q.main ? 'Main story' : 'Side quest' + (Q.giver ? ' · from ' + Q.giver : ''), 172, 26, { size: 5.6, color: '#8a7550' });
        const txt = st === 'done' ? (Q.doneText || 'Completed!') : (Q.steps && Q.steps[st]) || Q.desc;
        G.ui.wrap(txt, 196, 6.4).slice(0, 12).forEach((l, k) => U.text(l, 172, 40 + k * 10, { size: 6.4, color: '#5a4a30' }));
        if (Q.reward && st !== 'done') U.text('Reward: ' + Q.reward, 172, 190, { size: 6, color: '#2a7a4a', weight: 800 });
      }
    },
  }));
};
// ----------------------------------------------------------- encounters --
G.openEncounters = function () {
  const w = G.world.scene, m = w.map, E = m.def.enc || {};
  const tables = [['grass', 'Grass (day)'], ['night', 'Grass (night)'], ['surf', 'Surfing'], ['fish', 'Fishing'], ['fishpro', 'Pro Rod'], ['cave', 'Cave floor'], ['rare', 'Sparkling grass'], ['rock', 'Smashed rocks']].filter(([k]) => E[k]);
  return new Promise(res => G.push({
    opaque: true, t: 0,
    update(top) { this.t++; if (top && (G.input.pressed('b') || G.input.pressed('a'))) { G.input.consume('b'); G.input.consume('a'); G.pop(this); res(); } },
    draw(b) { G.menuBG(b, '#2aa86a', '#0f4a26', this.t / 60); },
    drawUI() {
      const U = G.ui;
      U.panel(8, 8, G.W - 16, 200, 'light', { r: 7 });
      U.text(`Encounters — ${m.name}`, G.W / 2, 13, { size: 8.4, weight: 900, align: 'center' });
      if (G.save.settings.nuzlocke) { const e = G.save.nuz.enc[G.nuzArea(m)]; U.text(e ? `Nuzlocke: used (${G.SPECIES[e.sp].name} — ${e.result})` : 'Nuzlocke: first encounter still available!', G.W / 2, 24, { size: 6, align: 'center', weight: 800, color: e ? '#c83a3a' : '#2aa86a' }); }
      if (!tables.length) U.text('No wild mons live here.', G.W / 2, 100, { size: 7.4, align: 'center', color: '#8a90a0' });
      let y = 34;
      for (const [k, label] of tables) {
        const T = E[k]; U.text(`${label}  (Lv ${T.lv[0]}–${T.lv[1]})`, 18, y, { size: 6.4, weight: 800, color: '#3a6a4a' }); y += 9;
        const tot = T.list.reduce((a, e) => a + e[1], 0);
        T.list.forEach(([sp0, wgt], i) => {
          const sp = G.randomizeSpecies(sp0, 'wild');
          const x = 18 + (i % 6) * 58, yy = y + Math.floor(i / 6) * 26;
          const seen = G.save.dex.seen[sp], caught = G.save.dex.caught[sp];
          U.img(seen ? G.monArt.icon(sp, false, 0) : G.monArt.silhouette(sp), x, yy - 4, { scale: seen ? .6 : .225 });
          U.text(seen ? G.SPECIES[sp].name : '???', x + 23, yy + 2, { size: 5.6, weight: 700, color: caught ? '#2aa86a' : '#4a5060' });
          U.text(Math.round(wgt / tot * 100) + '%' + (caught ? ' ●' : ''), x + 23, yy + 10, { size: 5, color: '#8a90a0' });
        });
        y += Math.ceil(T.list.length / 6) * 26 + 3;
        if (y > 190) break;
      }
    },
  }));
};
// ------------------------------------------------------------ controls --
G.showControls = function () {
  return new Promise(res => G.push({
    lowres: false, t: 0,
    update(top) { this.t++; if (top && this.t > 5 && G.input.anyKeyThisFrame) { G.input.consumeAll(); G.pop(this); res(); } },
    drawUI() {
      const U = G.ui; U.panel(40, 16, G.W - 80, 180, 'glass', { r: 8 });
      U.text('Controls', G.W / 2, 22, { size: 9, color: '#fff', weight: 900, align: 'center' });
      const rows = [['Arrows / WASD', 'Move (tap to turn)'], ['Z / Space / Enter', 'Confirm · Talk · Interact'], ['X / Esc', 'Cancel · Open menu'], ['Shift (hold)', 'Run  (Options: Always Run)'], ['F', 'Hop on / off the Bike'], ['Tab', 'Turbo mode (3x speed)'], ['Q / E', 'Switch bag pockets · Q: battle info'], ['R (in Fight menu)', 'Toggle Resonance'], ['P', 'Photo mode (hide UI, Z to save)'], ['H', 'This help'], ['` (backtick)', 'God Mode menu (if enabled)'], ['Gamepad', 'A/B/Start, X = run, Y = bike']];
      rows.forEach(([k, v], i) => { U.text(k, 60, 38 + i * 12.5, { size: 6.6, color: '#ffe08a', weight: 800 }); U.text(v, 170, 38 + i * 12.5, { size: 6.6, color: '#e8eef8' }); });
    },
  }));
};
// ----------------------------------------------------------- town map ---
G.openTownMap = function (o = {}) {
  const towns = G.TOWNS.filter(t => t.fly);
  const cur = G.world.scene.map;
  return new Promise(res => G.push({
    opaque: true, t: 0, i: Math.max(0, towns.findIndex(t => t.id === (cur.def.town || cur.def.region))),
    update(top) {
      this.t++; if (!top) return; const I = G.input, n = towns.length;
      if (I.repeat('left') || I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('right') || I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.pressed('b')) { I.consume('b'); G.pop(this); res(false); }
      if (I.pressed('a') && o.fly) {
        I.consume('a'); const t = towns[this.i];
        if (!G.save.visited[t.id]) { G.audio && G.audio.sfx('buzz'); return; }
        if (G.world.scene.map.type !== 'outdoor') { G.toast('You can only call the Sky Taxi from outdoors.'); G.audio && G.audio.sfx('buzz'); return; }
        G.pop(this);
        G.run(async () => { const ok = await G.yesno(`Call the Sky Taxi to ${t.name}?`); if (!ok) { res(false); return; } G.audio && G.audio.sfx('fly'); await G.world.scene.warpTo(t.map, t.fx, t.fy, 'down'); res(true); });
      }
    },
    draw(b) {
      b.fillStyle = '#3a78c8'; b.fillRect(0, 0, G.W, G.H);
      for (let i = 0; i < 300; i++) { b.fillStyle = 'rgba(255,255,255,.05)'; b.fillRect((i * 37) % G.W, (i * 53) % G.H, 3, 1); }
      // landmasses
      b.fillStyle = '#7fc861'; for (const L of G.REGION.land) { b.beginPath(); L.forEach(([x, y], k) => k ? b.lineTo(x, y) : b.moveTo(x, y)); b.closePath(); b.fill(); }
      b.fillStyle = '#3a78c8'; for (const L of G.REGION.sea || []) { b.beginPath(); L.forEach(([x, y], k) => k ? b.lineTo(x, y) : b.moveTo(x, y)); b.closePath(); b.fill(); }
      b.fillStyle = '#7fc861'; for (const L of G.REGION.islands || []) { b.beginPath(); L.forEach(([x, y], k) => k ? b.lineTo(x, y) : b.moveTo(x, y)); b.closePath(); b.fill(); }
      b.fillStyle = '#e8f2fc'; for (const L of G.REGION.snow || []) { b.beginPath(); L.forEach(([x, y], k) => k ? b.lineTo(x, y) : b.moveTo(x, y)); b.closePath(); b.fill(); }
      b.fillStyle = '#9a8070'; for (const L of G.REGION.ash || []) { b.beginPath(); L.forEach(([x, y], k) => k ? b.lineTo(x, y) : b.moveTo(x, y)); b.closePath(); b.fill(); }
      b.strokeStyle = '#f4e0a8'; b.lineWidth = 3; b.lineCap = 'round';
      for (const [a, c] of G.REGION.routes) { const A = G.TOWNS.find(t => t.id === a), C = G.TOWNS.find(t => t.id === c); if (!A || !C) continue; b.beginPath(); b.moveTo(A.x, A.y); b.lineTo(C.x, C.y); b.stroke(); }
      for (const t of G.TOWNS) { const v = G.save.visited[t.id]; b.fillStyle = v ? (t.fly ? '#e8484a' : '#f4d040') : '#6a7080'; b.fillRect(t.x - 4, t.y - 4, 8, 8); b.fillStyle = '#ffffff'; b.fillRect(t.x - 2, t.y - 2, 4, 4); }
    },
    drawUI() {
      const U = G.ui, t = towns[this.i];
      const here = G.TOWNS.find(x => x.id === (cur.def.town || cur.def.region));
      if (here) { const bob = Math.sin(this.t / 8) * 1.5; U.img(G.chars.sheet(G.LOOKS[G.save.look]).down[0], here.x - 8, here.y - 26 + bob); }
      const bob = Math.sin(this.t / 6) * 1.5;
      U.rrect(t.x - 7, t.y - 7 + bob, 14, 14, 3); U.c.lineWidth = G.gfx.S * 1.2; U.c.strokeStyle = '#ffd35c'; U.c.stroke();
      U.panel(8, G.H - 34, 250, 28, 'light', { r: 6 });
      U.text(G.save.visited[t.id] ? t.name : '???', 16, G.H - 30, { size: 8.4, weight: 900 });
      U.text(G.save.visited[t.id] ? t.desc : 'You haven\'t been here yet.', 16, G.H - 19, { size: 5.8, color: '#5a6070' });
      if (o.fly) U.text('Z: Fly here  ·  X: close', G.W - 10, G.H - 10, { size: 5.6, color: '#fff', align: 'right', outline: 'rgba(0,0,0,.5)' });
      U.text('SOLMERE', G.W - 12, 8, { size: 10, weight: 900, color: '#fff', align: 'right', outline: 'rgba(0,0,0,.35)' });
    },
  }));
};
