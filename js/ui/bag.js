'use strict';
// ============================================================================
//  Bag: pockets, item details, field use, battle use, give, register
// ============================================================================
// HD icons cut from the generated item sheets (tools/item_atlas.py); neutral ones (TM discs, type gems,
// status sprays...) are recoloured by the item's colour. Falls back to the painted 16px icons.
G.itemHD = (function () {
  let img = null, ok = false; const cache = {};
  return function (id) {
    const A = G.ITEM_ATLAS; if (!A || typeof Image === 'undefined') return null;
    if (!img) { img = new Image(); img.onload = () => { ok = true; }; img.src = A.src; }
    if (!ok) return null;
    if (cache[id]) return cache[id];
    const it = G.ITEMS[id];
    if (it && it.pocket === 'orb' && G.orbArt) { const o = G.orbArt(G.ORB_STYLE[id] ? id : 'orb', 48); o.dispW = 16; o.dispH = 16; return (cache[id] = o); }   // Solmere's own Orbs
    let m = A.map[id];
    if (!m && it && A.kind[it.icon]) m = [A.kind[it.icon], it.icon === 'tm' ? 1 : 0];
    if (!m) return null;
    const [x, y] = A.rects[m[0]], S = A.size, cv = G.makeCanvas(S, S), c = cv.getContext('2d');
    c.drawImage(img, x, y, S, S, 0, 0, S, S);
    if (m[1] && it && it.ic) { c.globalCompositeOperation = 'multiply'; c.fillStyle = it.ic; c.fillRect(0, 0, S, S); c.globalCompositeOperation = 'destination-in'; c.drawImage(img, x, y, S, S, 0, 0, S, S); }
    cv.dispW = 16; cv.dispH = 16;
    return (cache[id] = cv);
  };
})();
G.itemIconFor = id => { const hd = G.itemHD(id); if (hd) return hd; const it = G.ITEMS[id]; return G.tiles.itemIcon(it ? it.icon || 'gem' : 'gem', it ? it.ic || '#999' : '#999'); };
G.BagScene = class {
  constructor(o, res) {
    this.o = o; this.res = res; this.opaque = true; this.t = 0;
    this.pockets = G.POCKETS.filter(p => {
      if (o.mode === 'battle') return ['med', 'orb', 'battle', 'berry'].includes(p.id);
      if (o.mode === 'give') return ['hold', 'berry', 'misc', 'med'].includes(p.id);
      if (o.mode === 'sell') return p.id !== 'key';
      return true;
    });
    this.p = G.bagMemory && this.pockets.findIndex(p => p.id === G.bagMemory.p) >= 0 ? this.pockets.findIndex(p => p.id === G.bagMemory.p) : 0;
    if (o.mode === 'battle' && o.wild === false && this.pockets[this.p].id === 'orb') this.p = 0;
    this.i = 0; this.scroll = 0; this.sub = null; this.msg = null;
  }
  list() {
    const p = this.pockets[this.p].id;
    let l = G.bag.list(p);
    if (this.o.mode === 'give') l = l.filter(id => G.ITEMS[id].holdable);
    if (this.o.mode === 'sell') l = l.filter(id => G.ITEMS[id].price > 0);
    return l;
  }
  close(v) { G.bagMemory = { p: this.pockets[this.p].id }; G.pop(this); this.res(v); }
  update(top) {
    this.t++; if (!top) return;
    if (this.sub) { const r = this.sub.update(true); if (r) { const s = this.sub; this.sub = null; if (!r.cancel) G.run(() => this.onSub(s.items[r.pick].id)); } return; }
    const I = G.input, L = this.list();
    if (I.repeat('left') || I.pressed('l')) { this.p = (this.p + this.pockets.length - 1) % this.pockets.length; this.i = 0; this.scroll = 0; G.audio && G.audio.sfx('page'); }
    if (I.repeat('right') || I.pressed('r')) { this.p = (this.p + 1) % this.pockets.length; this.i = 0; this.scroll = 0; G.audio && G.audio.sfx('page'); }
    const n = L.length + 1;
    if (I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
    if (this.i < this.scroll) this.scroll = this.i; if (this.i >= this.scroll + 10) this.scroll = this.i - 9;
    if (I.pressed('b')) { I.consume('b'); G.audio && G.audio.sfx('back'); this.close(null); return; }
    if (I.pressed('a')) {
      I.consume('a');
      if (this.i >= L.length) { G.audio && G.audio.sfx('back'); this.close(null); return; }
      G.audio && G.audio.sfx('select');
      G.run(() => this.pick(L[this.i]));
    }
  }
  async pick(id) {
    const it = G.ITEMS[id], mode = this.o.mode;
    if (mode === 'give') { this.close({ item: id }); return; }
    if (mode === 'sell') { this.close({ item: id }); return; }
    if (mode === 'battle') { await this.battleUse(id); return; }
    const items = [];
    if (G.itemFieldUsable(id)) items.push({ id: 'use', label: it.pocket === 'tm' ? 'Teach' : 'Use' });
    if (it.holdable) items.push({ id: 'give', label: 'Give' });
    if (it.pocket === 'key' && it.field) items.push({ id: 'reg', label: G.save.reg === id ? 'Deselect' : 'Register' });
    if (it.pocket !== 'key' && it.pocket !== 'tm') items.push({ id: 'toss', label: 'Toss' });
    items.push({ id: 'cancel', label: 'Cancel' });
    this.sub = new G.ListMenu(items, { x: 150, y: 120 - items.length * 6, w: 70, cancel: items.length - 1 }); this.sub.items = items; this.subItem = id;
  }
  async onSub(act) {
    const id = this.subItem, it = G.ITEMS[id];
    if (act === 'cancel') return;
    if (act === 'toss') {
      const n = await G.askNumber({ min: 1, max: G.bag.count(id), start: 1, text: `Toss how many ${it.name}?` });
      if (n > 0 && await G.yesno(`Throw away ${n} ${it.name}?`)) { G.bag.remove(id, n); G.audio && G.audio.sfx('toss'); }
      this.i = Math.min(this.i, this.list().length); return;
    }
    if (act === 'reg') { G.save.reg = G.save.reg === id ? null : id; G.toast(G.save.reg ? `${it.name} registered to F` : 'Unregistered'); return; }
    if (act === 'give') {
      const k = await G.openParty({ mode: 'select', prompt: `Give the ${it.name} to which Echo?` });
      if (k === null || k < 0) return;
      const m = G.save.party[k];
      if (m.item) { if (!await G.yesno(`${G.mon.name(m)} is already holding a ${G.ITEMS[m.item].name}. Swap it for the ${it.name}?`)) return; G.bag.add(m.item); }
      G.bag.remove(id); m.item = id; await G.say(`${G.mon.name(m)} is now holding the ${it.name}.`); return;
    }
    if (act === 'use') { const closeAfter = await G.useItemField(id, this); if (closeAfter) this.close(null); this.i = Math.min(this.i, this.list().length); }
  }
  async battleUse(id) {
    const it = G.ITEMS[id];
    if (it.ball) {
      if (this.o.wild === false) { this.close({ item: id }); return; }
      if (G.save.party.length >= 6 && G.save.boxes.every(b => b.length >= 30)) { await G.say('There\'s no room left for another Echo!'); return; }
      this.close({ item: id }); return;
    }
    if (it.xstat || it.flee) { this.close({ item: id, target: undefined }); return; }
    if (it.pocket === 'med' || it.pocket === 'berry') {
      if (it.level || it.ev || it.ppup || it.evreset || it.expc) { await G.say('That can\'t be used in battle.'); return; }
      const k = await G.openParty({
        mode: 'select', prompt: `Use the ${it.name} on which Echo?`,
        filter: m => G.itemUsefulOn(id, m), filterMsg: 'It won\'t have any effect.', label: m => G.itemLabelFor(id, m),
      });
      if (k === null || k < 0) return;
      let moveIdx;
      if (it.pp && !it.ppAll) {
        const m = G.save.party[k];
        const j = await G.choose(m.moves.map(x => ({ label: G.MOVES[x.id].name, right: `${x.pp}/${G.mon.maxPP(x)}` })).concat([{ label: 'Cancel' }]), { x: 150, y: 60, w: 130, cancel: m.moves.length });
        if (j < 0 || j >= m.moves.length) return; moveIdx = j;
      }
      this.close({ item: id, target: k, moveIdx });
      return;
    }
    await G.say('That can\'t be used right now.');
  }
  draw(b) { G.menuBG(b, '#8a5a2a', '#140e0c', this.t / 60); }
  drawUI() {
    const U = G.ui, P = this.pockets[this.p], L = this.list(), t = this.t, ease = G.ease;
    if (this._p !== this.p) { this._p = this.p; this._pT = t; }
    const pe = t - (this._pT || 0);
    U.c.globalAlpha = .6; U.para(212, 0, 260, G.H, -40, '#07060c'); U.c.globalAlpha = 1;
    // pocket tabs: a skewed strip; the open pocket juts down in red
    const tw = (G.W - 20) / this.pockets.length;
    this.pockets.forEach((p, k) => {
      const x = 8 + k * tw, sel = k === this.p, e = ease.outBack(G.clamp((t - k) / 8, 0, 1)), y = 6 - (1 - e) * 24 + (sel ? 2 : 0);
      if (sel) U.para(x + 2, y + 2, tw - 3, 14, 4, '#07060c');
      U.para(x, y, tw - 3, 14, 4, sel ? '#ff3b4e' : '#12131c'); if (!sel) U.para(x, y + 12.5, tw - 3, 1.5, .5, '#ff3b4e');
      U.text(p.name, x + tw / 2, y + 3.6, { size: 5.8, weight: 800, align: 'center', color: sel ? '#fff' : '#b8bccb', shadow: false });
      if (!this.sub) U.hot(x, y, tw, 14, null, () => { if (this.p !== k) { this.p = k; this.i = 0; this.scroll = 0; G.audio && G.audio.sfx('page'); } });
    });
    U.text('◀ Q / E ▶', G.W - 12, 24, { size: 5, align: 'right', color: 'rgba(255,255,255,.55)' });
    // list: a cascade of slanted bars
    const rowsN = 10, rows = L.slice(this.scroll, this.scroll + rowsN);
    const bar = (k, sel, draw) => {
      const e = ease.outBack(G.clamp((pe - k * 1.1) / 8, 0, 1));
      const x = 10 + k * 1.6 + (1 - e) * -120 + (sel ? 6 : 0), y = 32 + k * 17.2;
      if (sel) { U.para(x + 3, y + 3, 196, 14, 4, '#07060c'); U.para(x + Math.sin(t / 5) * .5, y, 196, 14, 4, '#ff3b4e'); }
      else U.para(x, y, 196, 14, 4, 'rgba(12,13,22,.88)');
      draw(x, y);
    };
    rows.forEach((id, k) => {
      const i = k + this.scroll, sel = this.i === i, it = G.ITEMS[id];
      bar(k, sel, (x, y) => {
        U.img(G.itemIconFor(id), x + 6, y - 1.5, { scale: .8 });
        U.text(it.name, x + 24, y + 3, { size: 7, weight: sel ? 800 : 700, color: '#fff', shadow: sel ? '#7a0f1c' : false });
        if (it.pocket === 'tm') { const mv = G.MOVES[it.tm]; U.typeBadge(mv.type, x + 150, y + 3, 26, 8, 4.6); }
        const sub = sel ? '#ffe0e4' : '#8a8fa0';
        if (it.pocket !== 'key' && it.pocket !== 'tm') U.text('×' + G.bag.count(id), x + 190, y + 3.3, { size: 6.6, weight: 800, align: 'right', color: sub, shadow: false });
        if (this.o.mode === 'sell') U.text('$' + it.sell, x + 164, y + 3.3, { size: 6, weight: 700, align: 'right', color: '#6ee0a0', shadow: false });
        if (G.save.reg === id) U.text('F', x + 190, y + 3.3, { size: 6.6, weight: 900, align: 'right', color: '#ffd23a', shadow: false });
      });
      if (!this.sub) U.hot(10, 32 + k * 17.2, 200, 16, () => { if (this.i !== i) { this.i = i; G.audio && G.audio.sfx('cursor'); } }, () => { this.i = i; G.input.tap('a'); });
    });
    if (L.length - this.scroll < rowsN) {
      const k = L.length - this.scroll, sel = this.i >= L.length;
      bar(k, sel, (x, y) => U.text('Close Bag', x + 24, y + 3, { size: 7, weight: 700, color: sel ? '#fff' : '#8a8fa0', shadow: false }));
      if (!this.sub) U.hot(10, 32 + k * 17.2, 200, 16, () => { if (this.i !== L.length) { this.i = L.length; G.audio && G.audio.sfx('cursor'); } }, () => { this.i = L.length; G.input.tap('a'); });
    }
    if (!L.length) U.text('Nothing here yet.', 110, 70, { size: 7, color: '#8a8fa0', align: 'center' });
    // detail: big icon over a glow, name plate, paper slip
    const id = L[this.i];
    const de = ease.outBack(Math.min(1, (t - (this._iT || 0)) / 10));
    if (this._i !== this.i || this._p2 !== this.p) { this._i = this.i; this._p2 = this.p; this._iT = t; }
    const cx = 304, cy = 60;
    const g = U.c.createRadialGradient(U.X(cx), U.Y(cy), 0, U.X(cx), U.Y(cy), 40 * G.gfx.S);
    g.addColorStop(0, 'rgba(255,200,120,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); U.c.fillStyle = g; U.c.fillRect(U.X(cx - 45), U.Y(cy - 45), 90 * G.gfx.S, 90 * G.gfx.S);
    if (id) {
      const it = G.ITEMS[id];
      U.img(G.itemIconFor(id), cx - 24 + (1 - de) * 20, cy - 26 + Math.sin(t / 22) * 1.5, { scale: 3, alpha: Math.min(1, de + .2) });
      U.para(236, 98, 146, 16, 6, '#07060c'); U.para(236, 112, 146, 2, 0, '#ff3b4e');
      U.text(it.name, 310, 101, { size: 8, weight: 800, align: 'center', color: '#fff' });
      U.panel(240, 120, 136, 76, 'paper', { r: 5 });
      G.ui.wrap(it.desc, 124, 6).slice(0, 7).forEach((l, k) => U.text(l, 246, 125 + k * 9, { size: 6, color: '#5a4a30' }));
      if (it.pocket === 'tm') { const mv = G.MOVES[it.tm]; U.text(`${G.cap(mv.type)} · ${mv.cat === 'phys' ? 'Physical' : mv.cat === 'spec' ? 'Special' : 'Status'} · Pow ${mv.pow > 1 ? mv.pow : '—'} · Acc ${mv.acc === true ? '—' : mv.acc}`, 308, 187, { size: 5.2, align: 'center', color: '#6a5a40', weight: 700 }); }
    } else U.text(this.o.mode === 'battle' ? 'Pick an item to use.' : 'Your trusty bag.', 308, 104, { size: 6.4, color: '#b8bccb', align: 'center' });
    U.para(300, 200, 90, 12, 4, '#07060c');
    U.text(`$${G.save.money.toLocaleString()}`, 374, 202, { size: 6.4, weight: 800, align: 'right', color: '#6ee0a0', shadow: false });
    if (this.sub) this.sub.draw();
  }
};
G.openBag = function (o = {}) { return new Promise(res => G.push(new G.BagScene(o, res))); };

// ----------------------------------------------------------- item logic --
G.itemFieldUsable = function (id) {
  const it = G.ITEMS[id];
  if (it.pocket === 'tm') return true;
  if (it.pocket === 'med' || it.pocket === 'berry') return !!(it.heal || it.healPct || it.cure || it.revive || it.pp || it.level || it.ev || it.ppup || it.evreset || it.expc);
  if (it.stone || it.mint || it.capsule || it.patch || it.cap || it.repel || it.escape) return true;
  if (it.pocket === 'key') return ['bike', 'rod', 'prorod', 'wingwhistle', 'dex', 'journal', 'tideboard', 'resonanceband', 'expshare', 'vsrecorder', 'lantern', 'dowsing'].includes(id);
  if (it.fossil) return false;
  return false;
};
G.itemUsefulOn = function (id, m) {
  const it = G.ITEMS[id]; if (!it) return false;
  if (m.dead) return false;
  const max = G.mon.maxHP(m);
  if (it.revive) return m.hp <= 0;
  if (m.hp <= 0) return false;
  if ((it.heal || it.healPct) && m.hp < max) return true;
  if (it.cure && m.status && (it.cure === 'all' || it.cure.includes(m.status))) return true;
  if (it.pp) return m.moves.some(x => x.pp < G.mon.maxPP(x));
  if (it.level) return m.lvl < 100;
  if (it.expc) return m.lvl < 100;
  if (it.ev) return (m.evs[it.ev] || 0) < 252 && G.mon.totalEVs(m) < 510;
  if (it.evreset) return G.mon.totalEVs(m) > 0;
  if (it.ppup) return m.moves.some(x => (x.ppup || 0) < 3);
  return false;
};
G.itemLabelFor = function (id, m) {
  const it = G.ITEMS[id];
  if (it.pocket === 'tm') return G.mon.hasMove(m, it.tm) ? 'LEARNED' : G.canLearnTM(m.sp, it.tm) ? 'ABLE' : 'UNABLE';
  if (it.stone) return G.mon.evoTarget(m, { trigger: 'item', item: it.stone }) ? 'ABLE' : 'UNABLE';
  if (it.pocket === 'med' || it.pocket === 'berry') return G.itemUsefulOn(id, m) ? '' : '—';
  return '';
};
G.capMonLevel = function () {
  const s = G.save.settings;
  if (s.levelCap === 'off' || !s.levelCap) return 100;
  return G.levelCapNow ? G.levelCapNow() : 100;
};
G.useItemField = async function (id, bagScene) {
  const it = G.ITEMS[id];
  const pickMon = async (prompt, filter, label, filterMsg) => { const k = await G.openParty({ mode: 'select', prompt, filter, label, filterMsg }); return k === null || k < 0 ? null : G.save.party[k]; };
  // key items
  if (it.pocket === 'key') {
    if (id === 'bike') { if (G.world.scene) { await G.world.scene.toggleBike(); return true; } return false; }
    if (id === 'rod' || id === 'prorod') { if (G.world.scene) { const w = G.world.scene, f = w.facing(), c = w.cellAt(f.x, f.y); if (c && c.water) { if (bagScene) bagScene.close(null); await G.fish(); return false; } } await G.say('There\'s no water to fish in here.'); return false; }
    if (id === 'wingwhistle') { if (bagScene) bagScene.close(null); await G.openTownMap({ fly: true }); return false; }
    if (id === 'dex') { await G.openDex(); return false; }
    if (id === 'journal') { await G.openQuests(); return false; }
    if (id === 'expshare') { G.save.settings.expShare = !G.save.settings.expShare; await G.say(`EXP Share turned ${G.save.settings.expShare ? 'ON. Your whole party will share battle EXP' : 'OFF. Only Echoes that battle will earn EXP'}.`); return false; }
    if (id === 'tideboard') { await G.say('Face some water and press Z to ride the Tide Board!'); return false; }
    if (id === 'resonanceband') { await G.say('The band hums with a soft warmth.\\pIn battle, open FIGHT and press R to let one Echo Resonate: its main type\'s moves hit much harder, and a Resonant Shield softens the first super-effective hit it takes. Once per battle!'); return false; }
    if (id === 'vsrecorder') { await G.say('Trainers you\'ve beaten may want a rematch after you earn more badges. Just talk to them again!'); return false; }
    if (id === 'lantern') { await G.say('The Lantern lights your way automatically in dark places.'); return false; }
    if (id === 'dowsing') { const n = G.hiddenItemNear ? G.hiddenItemNear() : null; await G.say(n ? `The rod is twitching! Something is hidden about ${n} step${n > 1 ? 's' : ''} away...` : 'The rod isn\'t reacting. Nothing hidden nearby.'); return false; }
    return false;
  }
  if (it.repel) { if (G.save.repel > 0) { await G.say('The effects of a previous repellent are still lingering.'); return false; } G.bag.remove(id); G.save.repel = it.repel; G.audio && G.audio.sfx('item'); await G.say(`You used the ${it.name}. Weaker wild Echoes will stay away for a while.`); return false; }
  if (it.escape) {
    const w = G.world.scene; if (!w || w.map.type === 'outdoor') { await G.say('You can\'t use that here.'); return false; }
    if (w.map.def.noEscape) { await G.say('A strange force prevents escaping from here!'); return false; }
    G.bag.remove(id); if (bagScene) bagScene.close(null); G.audio && G.audio.sfx('warp');
    const r = G.save.lastOutdoor; await w.warpTo(r.map, r.x, r.y, 'down'); return false;
  }
  if (it.pocket === 'tm') {
    const m = await pickMon(`Teach ${G.MOVES[it.tm].name} to which Echo?`, x => G.canLearnTM(x.sp, it.tm) && !G.mon.hasMove(x, it.tm), x => G.itemLabelFor(id, x), 'It can\'t learn that move.');
    if (!m) return false;
    await G.learnWithPrompt(m, it.tm); return false;
  }
  if (it.stone) {
    const m = await pickMon(`Use the ${it.name} on which Echo?`, x => !!G.mon.evoTarget(x, { trigger: 'item', item: it.stone }), x => G.itemLabelFor(id, x), 'It won\'t have any effect.');
    if (!m) return false;
    const to = G.mon.evoTarget(m, { trigger: 'item', item: it.stone });
    G.bag.remove(id); if (bagScene) bagScene.close(null);
    await G.evolveMon(m, to, { item: true }); return false;
  }
  if (it.mint) {
    const m = await pickMon(`Use the ${it.name} on which Echo?`); if (!m) return false;
    if (!await G.yesno(`${G.mon.name(m)}'s stats will grow as if it had a ${G.cap(it.mint)} nature. Use it?`)) return false;
    G.bag.remove(id); m.mint = it.mint; G.audio && G.audio.sfx('heal'); await G.say(`${G.mon.name(m)}'s stats may grow differently now!`); return false;
  }
  if (it.capsule) {
    const m = await pickMon('Use the Ability Capsule on which Echo?', x => !!G.SPECIES[x.sp].abil[1] && x.abil !== 2, null, 'It won\'t have any effect.'); if (!m) return false;
    const sp = G.SPECIES[m.sp], nw = m.abil === 0 ? 1 : 0;
    if (!await G.yesno(`Change ${G.mon.name(m)}'s Ability to ${G.ABILITIES[sp.abil[nw]].name}?`)) return false;
    G.bag.remove(id); m.abil = nw; await G.say(`${G.mon.name(m)}'s Ability became ${G.ABILITIES[sp.abil[nw]].name}!`); return false;
  }
  if (it.patch) {
    const m = await pickMon('Use the Ability Patch on which Echo?', x => !!G.SPECIES[x.sp].abil[2] && x.abil !== 2, null, 'It won\'t have any effect.'); if (!m) return false;
    const sp = G.SPECIES[m.sp];
    if (!await G.yesno(`Awaken ${G.mon.name(m)}'s Hidden Ability, ${G.ABILITIES[sp.abil[2]].name}?`)) return false;
    G.bag.remove(id); m.abil = 2; await G.say(`${G.mon.name(m)}'s Ability became ${G.ABILITIES[sp.abil[2]].name}!`); return false;
  }
  if (it.cap) {
    const m = await pickMon(`Use the ${it.name} on which Echo?`, x => G.STATS.some(s => x.ivs[s] < 31), null, 'Its potential is already maxed out!'); if (!m) return false;
    if (it.cap >= 6) { for (const s of G.STATS) m.ivs[s] = 31; }
    else {
      const opts = G.STATS.filter(s => m.ivs[s] < 31);
      const k = await G.choose(opts.map(s => ({ label: G.STAT_NAMES[s], right: 'IV ' + m.ivs[s] })).concat([{ label: 'Cancel' }]), { x: 150, y: 50, w: 120, cancel: opts.length });
      if (k < 0 || k >= opts.length) return false; m.ivs[opts[k]] = 31;
    }
    G.bag.remove(id); const f = m.hp / G.mon.maxHP(m); m.hp = Math.max(1, Math.round(G.mon.maxHP(m) * f)); G.audio && G.audio.sfx('heal');
    await G.say(`${G.mon.name(m)} reached its full potential! (Hyper Training)`); return false;
  }
  // medicine & berries
  const m = await pickMon(`Use the ${it.name} on which Echo?`, x => G.itemUsefulOn(id, x), x => G.itemLabelFor(id, x), 'It won\'t have any effect.');
  if (!m) return false;
  const n = G.mon.name(m), max = G.mon.maxHP(m);
  if (it.revive) {
    if (G.save.settings.nuzlocke && m.dead) { await G.say('Fallen Echoes cannot be revived.'); return false; }
    m.hp = Math.max(1, Math.floor(max * it.revive)); m.status = null; G.bag.remove(id); G.audio && G.audio.sfx('heal'); await G.say(`${n} was revived!`); return false;
  }
  if (it.level) {
    G.bag.remove(id);
    const cap = G.capMonLevel();
    if (m.lvl >= cap) { G.bag.add(id); await G.say(`${n} can't grow past the level cap (Lv ${cap}) yet.`); return false; }
    const old = G.mon.stats(m);
    const ups = G.mon.addExp(m, G.mon.expFor(G.SPECIES[m.sp].growth, m.lvl + 1) - m.exp, cap);
    G.audio && G.audio.jingle('levelup');
    await G.say(`${n} grew to Lv. ${m.lvl}!`);
    for (const lv of ups) for (const mv of G.mon.movesAt(m.sp, lv)) await G.learnWithPrompt(m, mv);
    await G.checkEvolution(m, { trigger: 'level' });
    return false;
  }
  if (it.expc) {
    G.bag.remove(id);
    const cap = G.capMonLevel();
    const amt = Math.max(200, Math.floor(G.mon.expFor(G.SPECIES[m.sp].growth, Math.min(100, m.lvl + 2)) - m.exp) / 2);
    const ups = G.mon.addExp(m, Math.floor(amt), cap);
    await G.say(`${n} gained ${Math.floor(amt)} EXP!${ups.length ? ` It grew to Lv. ${m.lvl}!` : ''}`);
    for (const lv of ups) for (const mv of G.mon.movesAt(m.sp, lv)) await G.learnWithPrompt(m, mv);
    if (ups.length) await G.checkEvolution(m, { trigger: 'level' });
    return false;
  }
  if (it.ev) { G.bag.remove(id); G.mon.addEVs(m, { [it.ev]: 10 }); m.bond = Math.min(255, m.bond + 3); await G.say(`${n}'s base ${G.STAT_NAMES[it.ev]} rose!`); return false; }
  if (it.evreset) { G.bag.remove(id); for (const s of G.STATS) m.evs[s] = 0; m.bond = Math.max(0, m.bond - 5); await G.say(`${n}'s effort values were reset. It made a sour face.`); return false; }
  if (it.ppup) {
    const opts = m.moves.filter(x => (x.ppup || 0) < 3);
    const k = await G.choose(opts.map(x => ({ label: G.MOVES[x.id].name, right: `${G.mon.maxPP(x)} PP` })).concat([{ label: 'Cancel' }]), { x: 150, y: 50, w: 130, cancel: opts.length });
    if (k < 0 || k >= opts.length) return false;
    opts[k].ppup = (opts[k].ppup || 0) + 1; opts[k].pp = G.mon.maxPP(opts[k]); G.bag.remove(id); await G.say(`${G.MOVES[opts[k].id].name}'s PP rose!`); return false;
  }
  if (it.pp) {
    let targets = m.moves;
    if (!it.ppAll) { const k = await G.choose(m.moves.map(x => ({ label: G.MOVES[x.id].name, right: `${x.pp}/${G.mon.maxPP(x)}` })).concat([{ label: 'Cancel' }]), { x: 150, y: 50, w: 130, cancel: m.moves.length }); if (k < 0 || k >= m.moves.length) return false; targets = [m.moves[k]]; }
    for (const x of targets) x.pp = Math.min(G.mon.maxPP(x), x.pp + it.pp);
    G.bag.remove(id); G.audio && G.audio.sfx('heal'); await G.say(`${n}'s PP was restored.`); return false;
  }
  let did = [];
  if ((it.heal || it.healPct) && m.hp < max) { const b = m.hp; m.hp = Math.min(max, m.hp + (it.healPct ? Math.floor(max * it.healPct) : it.heal)); did.push(`${n}'s HP was restored by ${m.hp - b} points.`); }
  if (it.cure && m.status && (it.cure === 'all' || it.cure.includes(m.status))) { m.status = null; m.slp = 0; did.push(`${n} was cured of its condition.`); }
  if (did.length) { G.bag.remove(id); G.audio && G.audio.sfx('heal'); await G.say(did.join('\\p')); }
  return false;
};
