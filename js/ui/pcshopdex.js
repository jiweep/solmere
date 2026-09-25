'use strict';
// ============================================================================
//  PC storage, shop, Dex
// ============================================================================
G.openPC = async function () {
  G.audio && G.audio.sfx('pc_on');
  await G.say('You booted up the PC.', { auto: 20 });
  while (true) {
    const opts = ['Organize Boxes', 'Heal Party (Tamer Plus)'];
    if (G.save.graveyard.length) opts.push('Graveyard');
    opts.push('Log Off');
    const k = await G.ask('Tamer Storage System. What would you like to do?', opts);
    const o = opts[k];
    if (!o || o === 'Log Off') { G.audio && G.audio.sfx('pc_off'); return; }
    if (o === 'Organize Boxes') await new Promise(res => G.push(new G.PCScene(res)));
    if (o === 'Heal Party (Tamer Plus)') { if (G.save.settings.nuzlocke && G.save.settings.nuzRules.hardcore) await G.say('Hardcore rules: PC healing is disabled.'); else { await G.S.heal(); await G.say('Your party was fully restored!'); } }
    if (o === 'Graveyard') await new Promise(res => G.push(new G.PCScene(res, { grave: true })));
  }
};
G.PCScene = class {
  constructor(res, o = {}) { this.res = res; this.o = o; this.opaque = true; this.box = G.pcBox || 0; this.side = 'box'; this.i = 0; this.held = null; this.t = 0; this.sub = null; this.msg = ''; }
  get boxList() { return this.o.grave ? G.save.graveyard : G.save.boxes[this.box]; }
  cur() { return this.side === 'party' ? G.save.party[this.i] : this.boxList[this.i]; }
  update(top) {
    this.t++; if (!top) return;
    if (this.sub) { const r = this.sub.update(true); if (r) { const s = this.sub; this.sub = null; if (!r.cancel) G.run(() => this.onSub(s.items[r.pick])); } return; }
    const I = G.input;
    if (this.side === 'box') {
      const col = this.i % 6, row = Math.floor(this.i / 6);
      if (I.repeat('left')) { if (col === 0) { this.side = 'party'; this.i = Math.min(G.save.party.length, row); } else this.i--; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('right')) { if (col < 5) this.i++; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('up')) { if (row > 0) this.i -= 6; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('down')) { if (row < 4) this.i += 6; G.audio && G.audio.sfx('cursor'); }
      if (!this.o.grave && (I.pressed('l') || I.pressed('r'))) { this.box = (this.box + (I.pressed('r') ? 1 : 11)) % 12; G.pcBox = this.box; G.audio && G.audio.sfx('page'); }
    } else {
      const n = G.save.party.length + 1;
      if (I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('right')) { this.side = 'box'; this.i = 0; G.audio && G.audio.sfx('cursor'); }
    }
    if (I.pressed('b')) { I.consume('b'); if (this.held) { this.dropBack(); return; } G.audio && G.audio.sfx('back'); G.pop(this); this.res(); return; }
    if (I.pressed('a')) { I.consume('a'); G.run(() => this.press()); }
  }
  dropBack() { const h = this.held; this.held = null; (h.from === 'party' ? G.save.party : h.list).splice(Math.min(h.idx, (h.from === 'party' ? G.save.party : h.list).length), 0, h.m); this.msg = ''; }
  async press() {
    if (this.side === 'party' && this.i >= G.save.party.length && !this.held) { G.audio && G.audio.sfx('back'); G.pop(this); this.res(); return; }
    if (this.held) {
      // drop
      if (this.o.grave) { this.dropBack(); return; }
      const list = this.side === 'party' ? G.save.party : this.boxList;
      if (this.side === 'party' && list.length >= 6 && !list[this.i]) { G.audio && G.audio.sfx('buzz'); return; }
      const target = list[this.i];
      if (this.side === 'box' && this.i >= list.length) list.push(this.held.m);
      else if (this.side === 'party' && this.i >= list.length) list.push(this.held.m);
      else { list[this.i] = this.held.m; if (target) { const src = this.held.from === 'party' ? G.save.party : this.held.list; src.splice(Math.min(this.held.idx, src.length), 0, target); } }
      this.held = null; G.audio && G.audio.sfx('swap'); this.msg = '';
      if (G.world.scene) G.world.scene.placeFollower();
      return;
    }
    const m = this.cur(); if (!m) return;
    const items = this.o.grave ? ['Summary', 'Cancel'] : ['Move', 'Summary', 'Release', 'Cancel'];
    this.sub = new G.ListMenu(items, { x: 150, y: 110, w: 70, cancel: items.length - 1 }); this.sub.items = items;
  }
  async onSub(op) {
    const m = this.cur(); if (!m) return;
    if (op === 'Summary') { const list = this.side === 'party' ? G.save.party : this.boxList; await G.openSummary(list, this.i); }
    if (op === 'Move') {
      if (this.side === 'party' && G.save.party.filter(x => x.hp > 0 && !x.dead).length <= 1 && m.hp > 0) { this.msg = 'That\'s your last mon able to battle!'; G.audio && G.audio.sfx('buzz'); return; }
      if (this.side === 'party' && G.save.party.length <= 1) { this.msg = 'You can\'t leave with an empty party!'; G.audio && G.audio.sfx('buzz'); return; }
      const list = this.side === 'party' ? G.save.party : this.boxList;
      list.splice(this.i, 1); this.held = { m, from: this.side, idx: this.i, list }; this.msg = 'Place it where?'; G.audio && G.audio.sfx('select');
    }
    if (op === 'Release') {
      if (this.side === 'party' && G.save.party.length <= 1) { this.msg = 'That\'s your last mon!'; return; }
      if (await G.yesno(`Release ${G.mon.name(m)}? You won't be able to get it back.`)) {
        const list = this.side === 'party' ? G.save.party : this.boxList; list.splice(this.i, 1);
        if (m.item) G.bag.add(m.item);
        await G.say(`${G.mon.name(m)} was released. Bye-bye, ${G.mon.name(m)}!`);
        if (G.world.scene) G.world.scene.placeFollower();
      }
    }
  }
  draw(b) { G.menuBG(b, this.o.grave ? '#3a3a4a' : '#2bb3a3', this.o.grave ? '#141418' : '#0e4a44', this.t / 60); }
  drawUI() {
    const U = G.ui;
    // party column
    U.panel(6, 6, 64, 200, 'dark', { r: 6 });
    U.text('PARTY', 38, 9, { size: 6, weight: 900, color: '#bfe', align: 'center' });
    for (let k = 0; k < 7; k++) {
      const y = 20 + k * 26, sel = this.side === 'party' && this.i === k; const m = G.save.party[k];
      if (!this.sub && k <= G.save.party.length && k < 6 + (this.held ? 0 : 1)) U.pick(10, y, 56, 22, sel, () => { this.side = 'party'; this.i = k; });
      if (k === 6 || (k === G.save.party.length && !this.held)) { if (k === G.save.party.length) { U.panel(10, y, 56, 22, sel ? 'select' : 'glass', { r: 5 }); U.text(this.held ? 'Place' : 'Close', 38, y + 7, { size: 6.4, weight: 800, align: 'center', color: sel ? '#3a2800' : '#dde' }); } break; }
      U.panel(10, y, 56, 22, sel ? 'select' : 'glass', { r: 5 });
      if (m) { U.img(G.monArt.icon(m.sp, m.shiny, sel ? Math.floor(this.t / 10) % 2 : 0), 12, y - 6, { scale: .75 }); U.text('Lv' + m.lvl, 62, y + 12, { size: 5.4, weight: 800, align: 'right', color: sel ? '#3a2800' : '#dde' }); }
    }
    // box grid
    const bx = 76, by = 6;
    U.panel(bx, by, 196, 180, 'light', { r: 6 });
    U.panel(bx, by, 196, 18, this.o.grave ? 'dark' : 'teal', { r: 6 });
    U.text(this.o.grave ? '✝ Graveyard ✝' : `◀  ${G.save.boxNames[this.box]}  ▶`, bx + 98, by + 4, { size: 7.6, weight: 900, color: '#fff', align: 'center' });
    if (!this.o.grave && !this.sub) { U.hot(bx, by, 60, 18, null, () => G.input.tap('l')); U.hot(bx + 136, by, 60, 18, null, () => G.input.tap('r')); }
    const list = this.boxList;
    for (let k = 0; k < 30; k++) {
      const x = bx + 6 + (k % 6) * 31, y = by + 24 + Math.floor(k / 6) * 30, sel = this.side === 'box' && this.i === k;
      if (!this.sub) U.pick(x, y, 28, 27, sel, () => { this.side = 'box'; this.i = k; });
      U.rrect(x, y, 28, 27, 4); U.c.fillStyle = sel ? 'rgba(255,211,92,.6)' : 'rgba(40,48,64,.07)'; U.c.fill();
      const m = list[k]; if (m) U.img(G.monArt.icon(m.sp, m.shiny, sel ? Math.floor(this.t / 10) % 2 : 0), x - 4, y - 5, { scale: 1, alpha: this.o.grave ? .6 : 1 });
    }
    U.text(this.o.grave ? `${list.length} remembered` : `${list.length}/30   ·   Q/E change box`, bx + 98, 176, { size: 5.4, color: '#6a7080', align: 'center' });
    // info
    const m = this.held ? this.held.m : this.cur();
    U.panel(278, 6, 100, 200, 'light', { r: 6 });
    if (m) {
      const sp = G.SPECIES[m.sp];
      U.img(G.monArt.front(m.sp, m.shiny, Math.floor(this.t / 14) % 4), 280, 10);
      U.text(G.mon.name(m), 328, 106, { size: 7.6, weight: 900, align: 'center' });
      U.text(`Lv ${m.lvl}  ${m.gender === 'm' ? '♂' : m.gender === 'f' ? '♀' : ''}${m.shiny ? ' ★' : ''}`, 328, 116, { size: 6.4, align: 'center', color: '#5a6070' });
      U.typeBadge(sp.types[0], sp.types[1] ? 294 : 313, 126, 30, 8.6, 5); if (sp.types[1]) U.typeBadge(sp.types[1], 330, 126, 30, 8.6, 5);
      U.text(G.cap(m.nature) + ' nature', 328, 140, { size: 5.8, align: 'center' });
      U.text((G.ABILITIES[G.mon.ability(m)] || {}).name || '', 328, 150, { size: 5.8, align: 'center', color: m.abil === 2 ? '#9b5de5' : '#283040' });
      U.text(m.item ? '@ ' + G.ITEMS[m.item].name : 'No item', 328, 160, { size: 5.6, align: 'center', color: '#6a7080' });
      U.text('IVs ' + G.STATS.map(s => m.ivs[s]).join('/'), 328, 172, { size: 5, align: 'center', color: '#8a90a0' });
    }
    if (this.held) U.text('Holding: ' + G.mon.name(this.held.m), 174, 196, { size: 6.2, weight: 800, align: 'center', color: '#fff', outline: 'rgba(0,0,0,.5)' });
    else if (this.msg) U.text(this.msg, 174, 196, { size: 6.2, weight: 800, align: 'center', color: '#ffe08a', outline: 'rgba(0,0,0,.5)' });
    if (this.sub) this.sub.draw();
  }
};
// ---------------------------------------------------------------- shop --
G.openShop = async function (stock, o = {}) {
  while (true) {
    const k = await G.ask(o.greet || 'Welcome! How may I help you?', ['Buy', 'Sell', 'See ya!'], { speaker: o.speaker || 'Clerk' });
    if (k === 0) await new Promise(res => G.push(new G.ShopScene(stock, res)));
    else if (k === 1) {
      while (true) {
        const r = await G.openBag({ mode: 'sell' }); if (!r) break;
        const it = G.ITEMS[r.item];
        const n = await G.askNumber({ min: 1, max: G.bag.count(r.item), start: 1, price: it.sell, text: `How many ${it.name} will you sell?` });
        if (n > 0 && await G.yesno(`I can pay $${(it.sell * n).toLocaleString()}. Is that okay?`)) { G.bag.remove(r.item, n); G.save.money += it.sell * n; G.audio && G.audio.sfx('money'); await G.say(`Turned over the ${it.name} and received $${(it.sell * n).toLocaleString()}.`); }
      }
    } else { await G.say('Please come again!', { speaker: o.speaker || 'Clerk' }); return; }
  }
};
G.ShopScene = class {
  constructor(stock, res) { this.stock = stock; this.res = res; this.i = 0; this.scroll = 0; this.opaque = true; this.t = 0; }
  update(top) {
    this.t++; if (!top) return;
    const I = G.input, n = this.stock.length + 1;
    if (I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
    if (this.i < this.scroll) this.scroll = this.i; if (this.i >= this.scroll + 10) this.scroll = this.i - 9;
    if (I.pressed('b')) { I.consume('b'); G.pop(this); this.res(); return; }
    if (I.pressed('a')) { I.consume('a'); if (this.i >= this.stock.length) { G.pop(this); this.res(); return; } G.run(() => this.buy(this.stock[this.i])); }
  }
  async buy(id) {
    const it = G.ITEMS[id], price = it.price;
    if (G.save.money < price) { await G.say('You don\'t have enough money.'); return; }
    const max = it.pocket === 'tm' || it.pocket === 'key' ? 1 : Math.min(99, Math.floor(G.save.money / price));
    if ((it.pocket === 'tm') && G.bag.has(id)) { await G.say('You already have that TM. TMs never break!'); return; }
    const n = max === 1 ? 1 : await G.askNumber({ min: 1, max, start: 1, price, text: `${it.name}? How many?` });
    if (n <= 0) return;
    if (!await G.yesno(`${it.name}${n > 1 ? ' ×' + n : ''} will be $${(price * n).toLocaleString()}. OK?`)) return;
    G.save.money -= price * n; G.bag.add(id, n); G.audio && G.audio.sfx('money');
    let bonus = '';
    if (it.ball && n >= 10) { const b = Math.floor(n / 10); G.bag.add('healorb', b); bonus = `\\pHere, have ${b} Heal Orb${b > 1 ? 's' : ''} as a thank-you bonus!`; }
    await G.say('Here you are! Thank you!' + bonus);
  }
  draw(b) { G.menuBG(b, '#2a4a8a', '#0b0c16', this.t / 60); }
  drawUI() {
    const U = G.ui, t = this.t, ease = G.ease;
    U.c.globalAlpha = .6; U.para(212, 0, 260, G.H, -40, '#07060c'); U.c.globalAlpha = 1;
    U.pHeader('SHOP', 6, 4);
    const bar = (k, sel, draw) => {
      const e = ease.outBack(G.clamp((t - k * 1.1) / 8, 0, 1)), x = 10 + k * 1.6 + (1 - e) * -120 + (sel ? 6 : 0), y = 28 + k * 17;
      if (sel) { U.para(x + 3, y + 3, 196, 14, 4, '#07060c'); U.para(x, y, 196, 14, 4, '#ff3b4e'); } else U.para(x, y, 196, 14, 4, 'rgba(12,13,22,.88)');
      draw(x, y, sel);
      U.pick(10, y, 200, 16, sel, () => { this.i = k + this.scroll; });
    };
    this.stock.slice(this.scroll, this.scroll + 10).forEach((id, k) => {
      const i = k + this.scroll, it = G.ITEMS[id];
      bar(k, i === this.i, (x, y, sel) => {
        U.img(G.itemIconFor(id), x + 6, y - 1.5, { scale: .8 });
        U.text(it.name, x + 24, y + 3, { size: 7, weight: sel ? 800 : 700, color: '#fff', shadow: sel ? '#7a0f1c' : false });
        U.text('$' + it.price.toLocaleString(), x + 190, y + 3.3, { size: 6.6, weight: 800, align: 'right', color: G.save.money >= it.price ? (sel ? '#e8fff0' : '#6ee0a0') : '#ff9aa6', shadow: false });
      });
    });
    const k = Math.min(10, this.stock.length - this.scroll);
    if (this.stock.length - this.scroll < 10) bar(k, this.i >= this.stock.length, (x, y, sel) => U.text('Done', x + 24, y + 3, { size: 7, weight: 700, color: sel ? '#fff' : '#8a8fa0', shadow: false }));
    U.para(236, 8, 146, 34, 6, '#07060c'); U.para(236, 40, 146, 2, 0, '#ff3b4e');
    U.text('Money', 246, 12, { size: 6, color: '#b8bccb', shadow: false }); U.text('$' + G.save.money.toLocaleString(), 372, 24, { size: 10, weight: 800, color: '#6ee0a0', align: 'right' });
    const id = this.stock[this.i];
    U.panel(240, 52, 136, 156, 'paper', { r: 5, slab: true });
    if (id) {
      const it = G.ITEMS[id];
      U.img(G.itemIconFor(id), 284, 58 + Math.sin(t / 22) * 1.5, { scale: 2.5 });
      U.text(it.name, 308, 102, { size: 7.4, weight: 800, align: 'center', color: '#4a3a20' });
      G.ui.wrap(it.desc, 124, 6).slice(0, 7).forEach((l, k2) => U.text(l, 246, 114 + k2 * 9, { size: 6, color: '#5a4a30' }));
      U.text(`In bag: ${G.bag.count(id)}`, 308, 196, { size: 6, align: 'center', color: '#8a7550', weight: 700 });
    }
  }
};
// ----------------------------------------------------------------- dex --
G.dexHabitats = function (sp) {
  const out = [];
  for (const d of Object.values(G.MAPDEFS)) {
    if (!d.enc) continue;
    for (const k in d.enc) if (d.enc[k].list && d.enc[k].list.some(e => e[0] === sp)) { if (!out.includes(d.name)) out.push(d.name); }
  }
  return out;
};
G.openDex = function () { return new Promise(res => G.push(new G.DexScene(res))); };
G.DexScene = class {
  constructor(res) { this.res = res; this.opaque = true; this.i = G.dexIndex || 0; this.scroll = Math.max(0, this.i - 5); this.t = 0; this.detail = false; this.page = 0; this.shiny = false; }
  update(top) {
    this.t++; if (!top) return;
    const I = G.input, n = G.DEX.length;
    if (!this.detail) {
      if (I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('left') || I.repeat('l')) { this.i = Math.max(0, this.i - 10); G.audio && G.audio.sfx('page'); }
      if (I.repeat('right') || I.repeat('r')) { this.i = Math.min(n - 1, this.i + 10); G.audio && G.audio.sfx('page'); }
      if (this.i < this.scroll) this.scroll = this.i; if (this.i >= this.scroll + 11) this.scroll = this.i - 10;
      if (I.pressed('a')) { I.consume('a'); if (G.save.dex.seen[G.DEX[this.i]]) { this.detail = true; this.page = 0; G.audio && G.audio.cry(G.DEX[this.i]); } else G.audio && G.audio.sfx('buzz'); }
      if (I.pressed('b')) { I.consume('b'); G.dexIndex = this.i; G.pop(this); this.res(); }
    } else {
      if (I.repeat('left')) { this.page = (this.page + 3) % 4; G.audio && G.audio.sfx('page'); }
      if (I.repeat('right')) { this.page = (this.page + 1) % 4; G.audio && G.audio.sfx('page'); }
      const step = d => { let j = this.i; for (let k = 0; k < n; k++) { j = (j + d + n) % n; if (G.save.dex.seen[G.DEX[j]]) break; } this.i = j; this.scroll = Math.max(0, Math.min(this.i, this.scroll)); if (this.i >= this.scroll + 11) this.scroll = this.i - 10; G.audio && G.audio.cry(G.DEX[this.i]); };
      if (I.repeat('up')) step(-1); if (I.repeat('down')) step(1);
      if (I.pressed('a')) { I.consume('a'); if (G.save.dex.shiny[G.DEX[this.i]]) this.shiny = !this.shiny; else G.audio && G.audio.cry(G.DEX[this.i]); }
      if (I.pressed('b')) { I.consume('b'); this.detail = false; }
    }
  }
  draw(b) { G.menuBG(b, '#e8484a', '#6a1818', this.t / 60); }
  drawUI() {
    const U = G.ui, d = G.dexCount();
    const id = G.DEX[this.i], sp = G.SPECIES[id], seen = G.save.dex.seen[id], caught = G.save.dex.caught[id];
    if (!this.detail) {
      U.panel(10, 22, 148, 186, 'light', { r: 6, slab: true });
      U.pHeader('DEX', 6, 4, { sub: `Seen ${d.seen} · Caught ${d.caught} / ${d.total}` });
      G.DEX.slice(this.scroll, this.scroll + 11).forEach((sid, k) => {
        const i = k + this.scroll, y = 28 + k * 16, sel = i === this.i, S2 = G.SPECIES[sid], sn = G.save.dex.seen[sid], ct = G.save.dex.caught[sid];
        if (sel) { U.para(15, y, 144, 13.5, 3, '#07060c'); U.para(12, y - 1.5, 144, 13.5, 3, '#ff3b4e'); }
        U.hot(12, y - 1.5, 144, 15, () => { if (this.i !== i) { this.i = i; G.audio && G.audio.sfx('cursor'); } }, () => { this.i = i; G.input.tap('a'); });
        U.text(String(S2.num).padStart(3, '0'), 18, y + 2, { size: 6.4, weight: 800, color: sel ? '#ffe0e4' : '#8a90a0', shadow: false });
        if (ct) U.img(G.tiles.itemIcon('orb', '#e8484a'), 38, y + 1, { scale: .55 });
        U.text(sn ? S2.name : '— — —', 50, y + 1.6, { size: 7, weight: sel ? 800 : 700, color: sel ? '#fff' : sn ? '#283040' : '#aab', shadow: sel ? '#7a0f1c' : false });
        if (G.save.dex.shiny[sid]) U.text('★', 150, y + 1.6, { size: 6, color: '#d99a14', align: 'right' });
      });
      U.panel(170, 22, 206, 186, 'light', { r: 6, slab: true });
      if (seen) {
        U.img(G.monArt.front(id, false, Math.floor(this.t / 14) % 4), 222, 24 + Math.sin(this.t / 20) * 1.5);
        U.para(196, 118, 156, 16, 6, '#07060c'); U.text(sp.name, 276, 120, { size: 10, weight: 800, align: 'center', color: '#fff' });
        U.text(`The ${sp.cat} Mon`, 272, 138, { size: 6.4, color: '#6a7080', align: 'center' });
        U.typeBadge(sp.types[0], sp.types[1] ? 234 : 253, 148, 34, 9); if (sp.types[1]) U.typeBadge(sp.types[1], 272, 148, 34, 9);
        U.text(caught ? 'Press Z for details' : 'Catch it to learn more!', 272, 166, { size: 6, color: '#8a90a0', align: 'center' });
      } else { U.img(G.monArt.silhouette(id, '#3a3a48'), 222, 24); U.text('???', 272, 122, { size: 10, weight: 900, align: 'center', color: '#8a90a0' }); }
      return;
    }
    // detail pages
    U.panel(8, 8, 150, 200, 'light', { r: 6, slab: true });
    U.img(G.monArt.front(id, this.shiny, Math.floor(this.t / 14) % 4), 35, 14);
    U.text(`#${String(sp.num).padStart(3, '0')} ${sp.name}${this.shiny ? ' ★' : ''}`, 83, 112, { size: 8.6, weight: 900, align: 'center' });
    U.typeBadge(sp.types[0], sp.types[1] ? 47 : 66, 124, 34, 9); if (sp.types[1]) U.typeBadge(sp.types[1], 85, 124, 34, 9);
    U.text(`Ht ${sp.h} m   Wt ${sp.w} kg`, 83, 138, { size: 6.4, align: 'center', color: '#5a6070' });
    const tabs = ['Entry', 'Stats', 'Evolution', 'Moves'];
    tabs.forEach((t, k) => { const sel = this.page === k; if (sel) U.para(16 + k * 35, 153.5, 33, 12, 3, '#07060c'); U.para(14 + k * 35, 152 - (sel ? 1 : 0), 33, 12, 3, sel ? '#ff3b4e' : '#12131c'); U.text(t, 32 + k * 35, 154.4 - (sel ? 1 : 0), { size: 5.2, weight: 800, align: 'center', color: sel ? '#fff' : '#b8bccb', shadow: false }); U.hot(14 + k * 35, 152, 33, 12, null, () => { this.page = k; G.audio && G.audio.sfx('page'); }); });
    U.text('◀ ▶ pages · ▲ ▼ browse' + (G.save.dex.shiny[id] ? ' · Z shiny' : ' · Z cry'), 83, 196, { size: 5, align: 'center', color: '#8a90a0' });
    U.panel(166, 8, 210, 200, 'paper', { r: 6, slab: true });
    const X = 172; let y = 16;
    if (!caught && this.page > 0) { U.text('Catch this mon to unlock this page.', 270, 100, { size: 6.6, color: '#8a7550', align: 'center' }); return; }
    if (this.page === 0) {
      if (caught) { const lines = G.ui.wrap(sp.dex, 196, 6.2); lines.forEach((l, k) => U.text(l, X, 16 + k * 9.4, { size: 6.2, color: '#4a3a20' })); y = 24 + lines.length * 9.4; }
      else { U.text('Not enough data. Catch one to learn more!', X, y, { size: 6.2, color: '#4a3a20' }); y = 30; }
      const hab = G.dexHabitats(id);
      U.text('Habitat', X, y + 4, { size: 6.4, weight: 900, color: '#8a5a20' });
      (hab.length ? hab : [sp.legend ? 'Unknown... a legend.' : 'Not found in the wild']).slice(0, 8).forEach((h, k) => U.text('• ' + h, X + 4, y + 15 + k * 9, { size: 6, color: '#5a4a30' }));
      if (caught) { const a = sp.abil.filter(Boolean).map((ab, k) => G.ABILITIES[ab].name + (k === 2 ? ' (H)' : '')); U.text('Abilities: ' + [...new Set(a)].join(', '), X, 186, { size: 5.6, color: '#5a4a30', weight: 700 }); }
    }
    if (this.page === 1) {
      const names = ['HP', 'Atk', 'Def', 'SpA', 'SpD', 'Spe'];
      sp.base.forEach((v, k) => { const yy = 20 + k * 16; U.text(names[k], X, yy, { size: 6.6, weight: 800, color: '#6a5a40' }); U.text(String(v), X + 30, yy, { size: 6.6, weight: 800, align: 'right' }); U.bar(X + 36, yy + 1.5, 150, 5, v / 160, v >= 100 ? '#3ed16b' : v >= 70 ? '#f5c02b' : '#ef8b4b', '#e6dcc4'); });
      U.text(`Total: ${sp.bst}`, X, 120, { size: 7, weight: 900, color: '#4a3a20' });
      U.text(`Catch rate ${sp.catch} · Growth: ${{ fast: 'Fast', mfast: 'Medium Fast', mslow: 'Medium Slow', slow: 'Slow' }[sp.growth]}`, X, 134, { size: 5.8, color: '#5a4a30' });
      U.text(`EV yield: ${Object.entries(sp.ev).map(([k, v]) => v + ' ' + G.STAT_SHORT[k]).join(', ')}`, X, 144, { size: 5.8, color: '#5a4a30' });
      U.text(`Gender: ${sp.gender < 0 ? 'Unknown' : Math.round(sp.gender * 100) + '% ♂'}`, X, 154, { size: 5.8, color: '#5a4a30' });
      const prof = G.defProfile(sp.types); const weak = G.TYPES.filter(t => prof[t] > 1), res = G.TYPES.filter(t => prof[t] < 1 && prof[t] > 0), imm = G.TYPES.filter(t => prof[t] === 0);
      U.text('Weak: ' + weak.map(t => G.cap(t) + (prof[t] >= 4 ? '×4' : '')).join(', '), X, 166, { size: 5.4, color: '#c83a3a' });
      U.text('Resists: ' + res.map(G.cap).join(', ') + (imm.length ? '  Immune: ' + imm.map(G.cap).join(', ') : ''), X, 176, { size: 5.4, color: '#2a7a4a' });
    }
    if (this.page === 2) {
      const line = G.evoLine(id);
      line.forEach((e, k) => {
        const S3 = G.SPECIES[e.id], yy = 16 + k * 22 - (line.length > 8 ? k * 2 : 0);
        const known = G.save.dex.seen[e.id];
        U.img(known ? G.monArt.icon(e.id, false, 0) : G.monArt.silhouette(e.id, '#6a5a40'), X + e.depth * 18, yy - 6, { scale: known ? .6 : .225 });
        U.text(known ? S3.name : '???', X + 24 + e.depth * 18, yy, { size: 6.6, weight: 800, color: e.id === id ? '#c83a3a' : '#4a3a20' });
        const pre = S3.pre ? G.SPECIES[S3.pre].evo.find(x => x.to === e.id) : null;
        if (pre) U.text(pre.lvl ? `Lv ${pre.lvl}${pre.time ? ' (' + pre.time + ')' : ''}` : pre.item ? G.ITEMS[pre.item].name : pre.bond ? `High bond${pre.time ? ' (' + pre.time + ')' : ''}` : '', X + 120, yy, { size: 5.6, color: '#8a7550' });
      });
    }
    if (this.page === 3) {
      const L = sp.learn.filter(l => l[0] > 0).slice(0, 18);
      L.forEach(([lv, mv], k) => { const M = G.MOVES[mv], col = Math.floor(k / 9), yy = 16 + (k % 9) * 19; U.text('Lv' + lv, X + col * 102, yy, { size: 5.6, weight: 800, color: '#8a7550' }); U.text(M.name, X + 22 + col * 102, yy, { size: 6, weight: 700, color: '#4a3a20' }); U.typeBadge(M.type, X + 22 + col * 102, yy + 7.5, 24, 6.4, 4); });
      if (sp.evoMove) U.text('On evolving: ' + G.MOVES[sp.evoMove].name, X, 190, { size: 5.6, color: '#8a5a20', weight: 800 });
    }
  }
};
