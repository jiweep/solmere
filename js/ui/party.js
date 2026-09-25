'use strict';
// ============================================================================
//  Party screen, Summary screen, move teaching / relearning
// ============================================================================
G.menuBG = function (b, col1 = '#2a4a7a', col2 = '#16283f', t = G.realTime) {
  const g = b.createLinearGradient(0, 0, G.W, G.H); g.addColorStop(0, col1); g.addColorStop(1, col2); b.fillStyle = g; b.fillRect(0, 0, G.W, G.H);
  b.globalAlpha = .07; b.fillStyle = '#ffffff';
  const off = (t * 12) % 24;
  for (let x = -G.H; x < G.W + 24; x += 24) { b.beginPath(); b.moveTo(x + off, 0); b.lineTo(x + off + 12, 0); b.lineTo(x + off + 12 + G.H, G.H); b.lineTo(x + off + G.H, G.H); b.fill(); }
  b.globalAlpha = 1;
};
G.statusBadge = function (st, x, y) {
  if (!st) return;
  const U = G.ui, col = { brn: '#ee8130', par: '#e8c020', psn: '#a33ea1', tox: '#7a2a78', slp: '#8a8a9a', frz: '#78d0d0', fnt: '#c83a3a', dead: '#2a2a34' }[st];
  U.rrect(x, y, 18, 6.6, 2); U.c.fillStyle = col; U.c.fill();
  U.text({ brn: 'BRN', par: 'PAR', psn: 'PSN', tox: 'TOX', slp: 'SLP', frz: 'FRZ', fnt: 'FNT', dead: 'RIP' }[st], x + 9, y + .9, { size: 4.6, weight: 800, color: '#fff', align: 'center', shadow: false });
};

G.PartyScene = class {
  constructor(o, res) {
    this.o = o; this.res = res; this.opaque = true; this.i = o.start || 0; this.t = 0; this.swapFrom = -1; this.sub = null;
    this.msg = o.msg || (o.forced ? 'Choose a mon to send out.' : o.mode === 'battle' ? 'Choose a mon.' : o.mode === 'select' ? (o.prompt || 'Choose a mon.') : 'Choose a mon.');
    this.party = G.save.party;
    if (this.i >= this.party.length) this.i = 0;
  }
  close(v) { G.pop(this); this.res(v); }
  update(top) {
    this.t++; if (!top) return;
    if (this.sub) { const r = this.sub.update(true); if (r) { const s = this.sub; this.sub = null; G.run(() => this.onSub(s.items[r.pick] && !r.cancel ? s.items[r.pick].id : null)); } return; }
    const I = G.input, n = this.party.length + (this.o.forced ? 0 : 1);
    const mv = d => { this.i = (this.i + d + n) % n; G.audio && G.audio.sfx('cursor'); };
    const i0 = this.i;
    if (I.repeat('up') || I.repeat('left')) mv(-1); if (I.repeat('down') || I.repeat('right')) mv(1);
    if (this.i !== i0) this._selT = this.t;
    if (I.pressed('b')) {
      I.consume('b');
      if (this.swapFrom >= 0) { this.swapFrom = -1; this.msg = 'Choose a mon.'; G.audio && G.audio.sfx('back'); return; }
      if (!this.o.forced) { G.audio && G.audio.sfx('back'); this.close(null); }
      else G.audio && G.audio.sfx('buzz');
    }
    if (I.pressed('a')) { I.consume('a'); G.run(() => this.pick()); }
  }
  async pick() {
    if (this.i >= this.party.length) { G.audio && G.audio.sfx('back'); this.close(null); return; }
    const m = this.party[this.i];
    G.audio && G.audio.sfx('select');
    if (this.swapFrom >= 0) {
      const a = this.swapFrom, b = this.i; [this.party[a], this.party[b]] = [this.party[b], this.party[a]];
      this.swapFrom = -1; this.msg = 'Choose a mon.'; G.audio && G.audio.sfx('swap');
      if (G.world.scene) G.world.scene.placeFollower();
      return;
    }
    if (this.o.mode === 'select') {
      if (this.o.filter && !this.o.filter(m)) { G.audio && G.audio.sfx('buzz'); this.msg = this.o.filterMsg || 'That mon can\'t be chosen.'; return; }
      this.close(this.i); return;
    }
    const items = [];
    if (this.o.mode === 'battle') {
      items.push({ id: 'switch', label: this.o.forced ? 'Send Out' : 'Switch In' }, { id: 'summary', label: 'Summary' });
      if (!this.o.forced) items.push({ id: 'cancel', label: 'Cancel' });
    } else {
      items.push({ id: 'summary', label: 'Summary' }, { id: 'swap', label: 'Switch' }, { id: 'item', label: 'Item' }, { id: 'moves', label: 'Moves' }, { id: 'nick', label: 'Nickname' });
      if (G.save.follower) items.push({ id: 'lead', label: 'Walk Together' });
      items.push({ id: 'cancel', label: 'Cancel' });
    }
    this.sub = new G.ListMenu(items, { x: 96, y: Math.max(4, G.H - 34 - items.length * 12.5 - 12), w: 88, cancel: items.length - 1 });
    this.sub.items = items;
  }
  async onSub(id) {
    const m = this.party[this.i];
    if (!id || id === 'cancel') return;
    if (id === 'summary') { await G.openSummary(this.party, this.i); return; }
    if (id === 'switch') {
      if (m.dead) { this.msg = `${G.mon.name(m)} has fallen and can't battle.`; G.audio && G.audio.sfx('buzz'); return; }
      if (m.hp <= 0) { this.msg = `${G.mon.name(m)} has no energy left to battle!`; G.audio && G.audio.sfx('buzz'); return; }
      if ((this.o.activeUids || []).includes(m.uid)) { this.msg = `${G.mon.name(m)} is already in battle!`; G.audio && G.audio.sfx('buzz'); return; }
      if ((this.o.exclude || []).includes(this.i)) { this.msg = `${G.mon.name(m)} is already being sent out!`; G.audio && G.audio.sfx('buzz'); return; }
      this.close(this.i); return;
    }
    if (id === 'swap') { this.swapFrom = this.i; this.msg = 'Move to where?'; return; }
    if (id === 'nick') { const n = await G.askName({ title: `Nickname for ${G.SPECIES[m.sp].name}?`, start: m.nick || G.SPECIES[m.sp].name, max: 12, def: G.SPECIES[m.sp].name, allowCancel: true, icon: () => G.monArt.front(m.sp, m.shiny, Math.floor(G.realTime * 4) % 4) }); if (n) m.nick = n === G.SPECIES[m.sp].name ? null : n; return; }
    if (id === 'moves') { await G.moveRelearner(m); return; }
    if (id === 'lead') { if (this.i > 0) { const [x] = this.party.splice(this.i, 1); this.party.unshift(x); this.i = 0; } if (G.world.scene) G.world.scene.placeFollower(); this.msg = `${G.mon.name(this.party[0])} will walk with you!`; return; }
    if (id === 'item') {
      const opts = ['Give', 'Take', 'Cancel'];
      const k = await G.choose(opts, { x: G.W - 96, y: G.H - 70, w: 88 });
      if (k === 0) {
        const r = await G.openBag({ mode: 'give' });
        if (r) { if (m.item) G.bag.add(m.item); G.bag.remove(r.item); m.item = r.item; this.msg = `${G.mon.name(m)} is now holding the ${G.ITEMS[r.item].name}.`; G.audio && G.audio.sfx('item'); }
      } else if (k === 1) {
        if (!m.item) { this.msg = `${G.mon.name(m)} isn't holding anything.`; return; }
        G.bag.add(m.item); this.msg = `Took the ${G.ITEMS[m.item].name} from ${G.mon.name(m)}.`; m.item = null;
      }
    }
  }
  draw(b) {
    const m = this.party[Math.min(this.i, this.party.length - 1)], sp = G.SPECIES[m.sp];
    G.menuBG(b, G.col.dark(G.TYPE_COLORS[sp.types[0]], .35), '#0b0c16', this.t / 60);
  }
  drawUI() {
    // Persona-style: the highlighted mon posed large on the left over a type-coloured sweep,
    // the team as a diagonal cascade of skewed cards on the right that snap in one after another
    const U = G.ui, t = this.t, ease = G.ease;
    const cur = this.party[Math.min(this.i, this.party.length - 1)], csp = G.SPECIES[cur.sp];
    const tc = G.TYPE_COLORS[csp.types[0]], tc2 = G.TYPE_COLORS[csp.types[1] || csp.types[0]];
    const e0 = ease.outCubic(Math.min(1, t / 10));
    // big diagonal sweeps
    U.c.globalAlpha = .9; U.para(-60, 0, 250 * e0, G.H, 60, G.col.dark(tc, .15)); U.c.globalAlpha = 1;
    U.para(-60 + 250 * e0 - 8, 0, 8, G.H, 60, tc2);
    U.c.globalAlpha = .55; U.para(176, 0, 260, G.H, -30, '#07060c'); U.c.globalAlpha = 1;
    // header
    const hx = -20 + 24 * e0;
    U.para(hx - 4, 16, 96, 20, 6, '#07060c'); U.para(hx, 14, 92, 18, 6, '#ff3b4e');
    U.text(this.o.mode === 'battle' ? 'SWITCH' : this.o.mode === 'select' ? 'CHOOSE' : 'PARTY', hx + 12, 16.5, { size: 12, weight: 800, color: '#fff', shadow: '#07060c' });
    U.text(`${this.party.filter(q => q.hp > 0 && !q.dead).length}/${this.party.length} ready`, hx + 14, 35, { size: 5.8, weight: 800, color: 'rgba(255,255,255,.8)' });
    // portrait: glow, sprite, name plate
    if (this.i < this.party.length) {
      const cx = 78, cy = 100, pulse = 1 + Math.sin(t / 20) * .04;
      const g = U.c.createRadialGradient(U.X(cx), U.Y(cy), 0, U.X(cx), U.Y(cy), 58 * G.gfx.S * pulse);
      g.addColorStop(0, G.col.light(tc, .35) + ''); g.addColorStop(1, 'rgba(0,0,0,0)');
      U.c.globalAlpha = .55; U.c.fillStyle = g; U.c.fillRect(U.X(cx - 70), U.Y(cy - 70), 140 * G.gfx.S, 140 * G.gfx.S); U.c.globalAlpha = 1;
      const pe = ease.outBack(Math.min(1, (t - (this._selT || 0)) / 12));
      const img = G.monArt.front(cur.sp, cur.shiny, Math.floor(t / 12) % 4);
      U.img(img, cx - 48 - (1 - pe) * 30, cy - 58 + Math.sin(t / 18) * 1.5, { alpha: (cur.dead ? .45 : 1) * Math.min(1, pe + .2) });
      const nx = 10 + (1 - pe) * -40;
      U.para(nx - 12, 142, 150, 17, 7, '#07060c');
      U.text(G.mon.name(cur), nx, 144, { size: 10, weight: 800, color: '#fff' });
      U.text('Lv' + cur.lvl, nx + 128, 147, { size: 6.5, weight: 800, color: '#ffd23a', align: 'right' });
      U.typeBadge(csp.types[0], nx + 2, 162, 30, 8); if (csp.types[1]) U.typeBadge(csp.types[1], nx + 35, 162, 30, 8);
    }
    // cards
    const n = this.party.length;
    for (let k = 0; k < 6; k++) {
      const e = ease.outBack(G.clamp((t - 2 - k * 1.6) / 10, 0, 1)), sel = this.i === k;
      const x = 188 + k * 3 + (1 - e) * 220 - (sel ? 12 : 0), y = 8 + k * 28, w = 186, h = 24;
      if (k >= n) { U.c.globalAlpha = .35; U.para(x, y, w, h, 7, '#12131c'); U.c.globalAlpha = 1; continue; }
      const m = this.party[k], sp = G.SPECIES[m.sp], col = G.TYPE_COLORS[sp.types[0]];
      const dead = m.dead, fnt = m.hp <= 0;
      if (this.swapFrom === k) U.para(x - 3, y - 2, w + 6, h + 4, 7, '#ff3b4e');
      if (sel) U.para(x + 3, y + 3, w, h, 7, '#07060c');
      U.para(x, y, w, h, 7, sel ? '#f4f1ea' : dead ? '#1b1b22' : fnt ? '#3a1418' : '#12131c');
      U.para(x, y, 5, h, 7, sel ? '#ff3b4e' : col);
      if (!sel) U.para(x, y + h - 1.5, w, 1.5, .5, col);
      const txt = sel ? '#07060c' : '#fff', sub = sel ? '#5a5560' : 'rgba(255,255,255,.65)';
      const bob = sel ? Math.sin(t / 6) * 1.2 - 1 : 0;
      U.img(G.monArt.icon(m.sp, m.shiny, sel ? Math.floor(t / 10) % 2 : 0), x + 6, y - 9 + bob, { alpha: dead ? .45 : 1 });
      U.text(G.mon.name(m), x + 44, y + 3, { size: 8, weight: 800, color: txt, shadow: sel ? false : undefined });
      if (m.gender) U.text(m.gender === 'm' ? '♂' : '♀', x + 46 + U.measure(G.mon.name(m), 8, 800), y + 3, { size: 7, weight: 800, color: m.gender === 'm' ? '#3a8ae8' : '#e8508a', shadow: false });
      U.text('Lv ' + m.lvl, x + w - 6, y + 3.5, { size: 6.4, weight: 800, color: sub, align: 'right', shadow: false });
      const max = G.mon.maxHP(m), f = m.hp / max;
      U.bar(x + 44, y + 14, 88, 4, f, U.hpColor(f));
      U.text(`${m.hp}/${max}`, x + w - 6, y + 13, { size: 5.8, weight: 800, color: sub, align: 'right', shadow: false });
      G.statusBadge(dead ? 'dead' : fnt ? 'fnt' : m.status, x + 136, y + 13.2);
      if (m.item) U.img(G.tiles.itemIcon(G.ITEMS[m.item].icon || 'gem', G.ITEMS[m.item].ic || '#999'), x + 30, y + 12, { scale: .5 });
      if (m.shiny) U.text('★', x + 8, y + 14, { size: 6, color: '#ffd23a', weight: 800 });
      let tag = null;
      if (this.o.mode === 'select' && this.o.label) tag = this.o.label(m);
      else if (this.o.mode === 'battle' && (this.o.activeUids || []).includes(m.uid)) tag = 'IN BATTLE';
      if (tag) { const tw = U.measure(tag, 5.4, 800) + 8; U.para(x + w - tw - 34, y - 4, tw, 7, 2, '#ffd23a'); U.text(tag, x + w - tw / 2 - 33, y - 3.4, { size: 5.4, weight: 800, color: '#07060c', align: 'center', shadow: false }); }
      if (!this.sub) U.hot(x, y, w, h, () => { if (this.i !== k) { this.i = k; this._selT = t; G.audio && G.audio.sfx('cursor'); } }, () => { this.i = k; G.input.tap('a'); });
    }
    // message slab + cancel
    const my = G.H - 28;
    U.para(-12, my, 196, 24, 8, '#07060c'); U.para(-12, my, 196, 2, 8, '#ff3b4e');
    const lines = U.wrap ? U.wrap(this.msg, 164, 7) : [this.msg];
    lines.slice(0, 2).forEach((l, j) => U.text(l, 10, my + 5 + j * 9 - (lines.length > 1 ? 0 : -4), { size: 7, weight: 700, color: '#fff' }));
    if (!this.o.forced) {
      const sel = this.i >= n, e = ease.outBack(G.clamp((t - 12) / 10, 0, 1));
      const x = 300 + (1 - e) * 120 - (sel ? 8 : 0), y = G.H - 30;
      if (sel) U.para(x + 3, y + 3, 76, 22, 7, '#07060c');
      U.para(x, y, 76, 22, 7, sel ? '#ff3b4e' : '#12131c'); if (!sel) U.para(x, y + 20.5, 76, 1.5, .5, '#ff3b4e');
      U.text(this.swapFrom >= 0 ? 'STOP' : 'BACK', x + 42, y + 6.5, { size: 8.5, weight: 800, color: '#fff', align: 'center' });
      if (!this.sub) U.hot(x, y, 80, 22, () => { if (this.i !== n) { this.i = n; G.audio && G.audio.sfx('cursor'); } }, () => { this.i = n; G.input.tap('a'); });
    }
    if (this.sub) this.sub.draw();
  }
};
G.openParty = function (o = {}) { return new Promise(res => G.push(new G.PartyScene(o, res))); };

// ------------------------------------------------------------- summary --
G.SummaryScene = class {
  constructor(list, i, res, o = {}) { this.list = list; this.i = i; this.res = res; this.opaque = true; this.page = 0; this.t = 0; this.mi = 0; this.o = o; }
  get m() { return this.list[this.i]; }
  update(top) {
    this.t++; if (!top) return;
    const I = G.input;
    if (I.repeat('left')) { this.page = (this.page + 2) % 3; G.audio && G.audio.sfx('page'); }
    if (I.repeat('right')) { this.page = (this.page + 1) % 3; G.audio && G.audio.sfx('page'); }
    if (this.page === 2 && this.moveMode) {
      if (I.repeat('up')) this.mi = (this.mi + this.m.moves.length - 1) % this.m.moves.length;
      if (I.repeat('down')) this.mi = (this.mi + 1) % this.m.moves.length;
    } else {
      if (I.repeat('up') && this.list.length > 1) { this.i = (this.i + this.list.length - 1) % this.list.length; G.audio && G.audio.cry(this.m.sp); }
      if (I.repeat('down') && this.list.length > 1) { this.i = (this.i + 1) % this.list.length; G.audio && G.audio.cry(this.m.sp); }
    }
    if (I.pressed('a') && this.page === 2) { I.consume('a'); if (!this.moveMode) { this.moveMode = true; this.mi = 0; } else if (this.swapMove === undefined) { this.swapMove = this.mi; } else { const mv = this.m.moves; [mv[this.swapMove], mv[this.mi]] = [mv[this.mi], mv[this.swapMove]]; this.swapMove = undefined; G.audio && G.audio.sfx('swap'); } }
    if (I.pressed('b')) { I.consume('b'); if (this.moveMode) { this.moveMode = false; this.swapMove = undefined; return; } G.audio && G.audio.sfx('back'); G.pop(this); this.res(); }
  }
  draw(b) {
    const sp = G.SPECIES[this.m.sp];
    G.menuBG(b, G.col.dark(G.TYPE_COLORS[sp.types[0]], .35), '#0b0c16', this.t / 60);
  }
  drawUI() {
    const U = G.ui, m = this.m, sp = G.SPECIES[m.sp], t = this.t, ease = G.ease;
    const tc = G.TYPE_COLORS[sp.types[0]], tc2 = G.TYPE_COLORS[sp.types[1] || sp.types[0]];
    if (this._mon !== m) { this._mon = m; this._selT = t; }
    const e0 = ease.outCubic(Math.min(1, t / 10)), pe = ease.outBack(Math.min(1, (t - (this._selT || 0)) / 12));
    // type sweep + portrait
    U.c.globalAlpha = .9; U.para(-60, 0, 210 * e0, G.H, 50, G.col.dark(tc, .15)); U.c.globalAlpha = 1;
    U.para(-60 + 210 * e0 - 7, 0, 7, G.H, 50, tc2);
    const cx = 68, cy = 96, g = U.c.createRadialGradient(U.X(cx), U.Y(cy), 0, U.X(cx), U.Y(cy), 56 * G.gfx.S);
    g.addColorStop(0, G.col.light(tc, .35)); g.addColorStop(1, 'rgba(0,0,0,0)');
    U.c.globalAlpha = .55; U.c.fillStyle = g; U.c.fillRect(U.X(cx - 70), U.Y(cy - 70), 140 * G.gfx.S, 140 * G.gfx.S); U.c.globalAlpha = 1;
    U.img(G.monArt.front(m.sp, m.shiny, Math.floor(t / 14) % 4), cx - 48 - (1 - pe) * 30, cy - 56 + Math.sin(t / 20) * 1.5, { alpha: (m.dead ? .45 : 1) * Math.min(1, pe + .2) });
    // name plate
    const nx = 8 - (1 - pe) * 40;
    U.para(nx - 14, 14, 138, 30, 8, '#07060c'); U.para(nx - 14, 42, 138, 2, 0, '#ff3b4e');
    U.text(G.mon.name(m), nx, 16, { size: 9.5, weight: 800, color: '#fff' });
    if (m.gender) U.text(m.gender === 'm' ? '♂' : '♀', nx + 2 + U.measure(G.mon.name(m), 9.5, 800), 16, { size: 8, color: m.gender === 'm' ? '#6ab8ff' : '#ff8ab8', weight: 800 });
    U.text('Lv' + m.lvl, nx + 118, 17.5, { size: 7, weight: 800, align: 'right', color: '#ffd23a' });
    U.typeBadge(sp.types[0], nx + 1, 30, 32, 8.5); if (sp.types[1]) U.typeBadge(sp.types[1], nx + 36, 30, 32, 8.5);
    if (m.shiny) U.text('★', nx + 96, 30, { size: 7, color: '#ffd23a', weight: 800 });
    U.img(G.tiles.itemIcon('orb', (G.ITEMS[m.ball] || G.ITEMS.orb).ic), nx + 110, 27, { scale: .7 });
    if (m.dead) { U.para(4, 150, 124, 14, 5, '#07060c'); U.text('Fallen — rests in memory', 66, 153.5, { size: 6, color: '#ccd', align: 'center' }); }
    // tabs: skewed slabs, the open page juts up in red
    ['INFO', 'STATS', 'MOVES'].forEach((lb, k) => {
      const sel = this.page === k, e = ease.outBack(G.clamp((t - k * 1.5) / 9, 0, 1));
      const x = 146 + k * 78, y = 4 + (1 - e) * -20 - (sel ? 2 : 0);
      if (sel) U.para(x + 2, y + 2, 72, 15, 5, '#07060c');
      U.para(x, y, 72, 15, 5, sel ? '#ff3b4e' : '#12131c'); if (!sel) U.para(x, y + 13.5, 72, 1.5, .5, '#ff3b4e');
      U.text(lb, x + 39, y + 3.6, { size: 7.4, weight: 800, align: 'center', color: sel ? '#fff' : '#b8bccb' });
      U.hot(x, y, 76, 15, null, () => { if (this.page !== k) { this.page = k; this.moveMode = false; this.swapMove = undefined; G.audio && G.audio.sfx('page'); } });
    });
    const px = 140, py = 24, pw = 238, ph = 186;
    // page card: the paper sheet on a black slab that leans, sliding in on each page flip
    if (this._pg !== this.page) { this._pg = this.page; this._pgT = t; }
    const ce = ease.outCubic(Math.min(1, (t - this._pgT) / 8));
    U.c.save(); U.c.globalAlpha = ce; U.c.translate((1 - ce) * 18 * G.gfx.S, 0);
    U.para(px - 6, py - 2 + 4, pw + 8, ph + 2, 6, '#07060c');
    U.panel(px, py, pw, ph, 'light', { r: 6, noShadow: true });
    if (this.page === 0) this.drawInfo(px, py, m, sp);
    if (this.page === 1) this.drawStats(px, py, m, sp);
    if (this.page === 2) this.drawMoves(px, py, m, sp);
    U.c.restore();
    // held item and exp: black slab
    U.para(-10, 168, 142, 34, 7, '#07060c'); U.para(-10, 168, 142, 1.5, 7, tc2);
    U.text('Item  ' + (m.item ? G.ITEMS[m.item].name : 'None'), 8, 172, { size: 6.4, weight: 800, color: '#fff' });
    const nxt = G.mon.expToNext(m);
    U.text(m.lvl >= 100 ? 'Max level' : `To next Lv  ${nxt.toLocaleString()}`, 8, 182, { size: 5.8, weight: 700, color: '#b8bccb' });
    U.bar(8, 192, 112, 3, G.mon.expProgress(m), '#4ab0f4', '#2a2c3a', { border: false });
    U.text('◀ ▶ pages   ▲ ▼ mons', 66, 208, { size: 5, color: 'rgba(255,255,255,.55)', align: 'center' });
  }
  drawInfo(px, py, m, sp) {
    const U = G.ui; let y = py + 8;
    const row = (k, v, col) => { U.text(k, px + 10, y, { size: 6.4, weight: 800, color: '#6a7080' }); U.text(v, px + 80, y, { size: 6.8, weight: 700, color: col || '#283040' }); y += 12; };
    row('Dex No.', '#' + String(sp.num).padStart(3, '0') + '  ' + sp.name);
    row('OT', (m.ot || G.save.name) + (m.otId !== undefined && m.otId !== G.save.otId ? '  (traded)' : ''));
    const nat = G.NATURES[m.nature]; const natTxt = G.cap(m.nature) + (nat.length ? `  (+${G.STAT_SHORT[nat[0]]} −${G.STAT_SHORT[nat[1]]})` : '  (neutral)');
    row('Nature', natTxt + (m.mint ? `  → ${G.cap(m.mint)} mint` : ''));
    const ab = G.ABILITIES[G.mon.ability(m)] || {}; row('Ability', (ab.name || '?') + (m.abil === 2 ? '  (Hidden)' : ''), m.abil === 2 ? '#9b5de5' : null);
    U.text(G.ui.wrap(ab.desc || '', 150, 5.6).slice(0, 2).join(' '), px + 80, y - 2, { size: 5.6, color: '#5a6070' }); y += 12;
    row('Met', m.met ? `${m.met.loc || 'Unknown'} at Lv ${m.met.lvl}` : 'A fateful encounter');
    row('Trait', G.mon.characteristic(m));
    row('Bond', m.bond >= 220 ? 'Unbreakable ♥♥♥' : m.bond >= 150 ? 'Close ♥♥' : m.bond >= 100 ? 'Friendly ♥' : 'Getting acquainted', '#e8487a');
    U.text(G.ui.wrap(sp.dex, 218, 5.8).join(' '), px + 10, y + 2, { size: 5.8, color: '#4a5060' });
    const lines = G.ui.wrap(sp.dex, 218, 5.8);
    lines.forEach((l, k) => { });
  }
  drawStats(px, py, m, sp) {
    const U = G.ui, st = G.mon.stats(m), nat = G.mon.natureOf(m);
    const rows = [['hp', 'HP'], ['atk', 'Attack'], ['def', 'Defense'], ['spa', 'Sp. Atk'], ['spd', 'Sp. Def'], ['spe', 'Speed']];
    let y = py + 8;
    U.text('Stat', px + 10, y, { size: 5.6, weight: 800, color: '#8a90a0' }); U.text('Value', px + 84, y, { size: 5.6, weight: 800, color: '#8a90a0', align: 'right' });
    U.text('Base', px + 108, y, { size: 5.6, weight: 800, color: '#8a90a0', align: 'right' }); U.text('IV', px + 128, y, { size: 5.6, weight: 800, color: '#8a90a0', align: 'right' }); U.text('EV', px + 150, y, { size: 5.6, weight: 800, color: '#8a90a0', align: 'right' });
    y += 10;
    rows.forEach(([k, lbl], i) => {
      const col = nat[0] === k ? '#e8484a' : nat[1] === k ? '#3b82e0' : '#283040';
      U.text(lbl + (nat[0] === k ? ' ▲' : nat[1] === k ? ' ▼' : ''), px + 10, y, { size: 6.6, weight: 700, color: col });
      U.text(k === 'hp' ? `${m.hp}/${st.hp}` : String(st[k]), px + 84, y, { size: 6.6, weight: 800, align: 'right' });
      U.text(String(sp.base[i]), px + 108, y, { size: 6, weight: 600, align: 'right', color: '#6a7080' });
      const iv = m.ivs[k]; U.text(String(iv), px + 128, y, { size: 6, weight: 800, align: 'right', color: iv === 31 ? '#d99a14' : iv >= 26 ? '#2aa86a' : '#6a7080' });
      U.text(String(m.evs[k] || 0), px + 150, y, { size: 6, weight: 700, align: 'right', color: '#6a7080' });
      U.bar(px + 10, y + 7.6, 140, 1.6, Math.min(1, st[k] / (k === 'hp' ? 350 : 300)), col === '#283040' ? '#6ab0e8' : col, '#dde0e8', { border: false });
      y += 14;
    });
    U.text(`Total EVs ${G.mon.totalEVs(m)}/510   ·   BST ${sp.bst}`, px + 10, y + 1, { size: 5.8, weight: 700, color: '#6a7080' });
    {  // the Judge's verdict: overall potential, then the standout stat
      const keys = ['hp', 'atk', 'def', 'spa', 'spd', 'spe'], names = { hp: 'HP', atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed' };
      const tot = keys.reduce((a, k) => a + m.ivs[k], 0), top = Math.max(...keys.map(k => m.ivs[k]));
      const overall = tot >= 151 ? 'Outstanding potential!' : tot >= 121 ? 'Relatively superior potential.' : tot >= 91 ? 'Above-average potential.' : 'Decent potential.';
      const best = keys.filter(k => m.ivs[k] === top).map(k => names[k]).join(' & ');
      U.text(`Judge: ${overall}`, px + 10, y + 11, { size: 5.4, weight: 700, color: '#6a7080' });
      U.text(`Best: ${best} (${G.mon.ivJudge(top)})`, px + 10, y + 19, { size: 5.4, color: '#8a90a0' });
    }
    // hexagon chart of IVs
    const cx = px + 196, cy = py + 62, R = 32, c = U.c, S = G.gfx.S;
    const pt = (i, r) => [U.X(cx + Math.cos(-Math.PI / 2 + i * Math.PI / 3) * r), U.Y(cy + Math.sin(-Math.PI / 2 + i * Math.PI / 3) * r)];
    const order = ['hp', 'atk', 'def', 'spe', 'spd', 'spa'];
    for (const f of [1, .66, .33]) { c.beginPath(); for (let i = 0; i < 6; i++) { const [x, yy] = pt(i, R * f); i ? c.lineTo(x, yy) : c.moveTo(x, yy); } c.closePath(); c.strokeStyle = 'rgba(40,48,64,.2)'; c.lineWidth = S * .5; c.stroke(); }
    c.beginPath(); order.forEach((k, i) => { const [x, yy] = pt(i, R * (st[k] / Math.max(...Object.values(st)))); i ? c.lineTo(x, yy) : c.moveTo(x, yy); }); c.closePath(); c.fillStyle = 'rgba(59,130,224,.35)'; c.fill(); c.strokeStyle = '#3b82e0'; c.lineWidth = S * .8; c.stroke();
    c.beginPath(); order.forEach((k, i) => { const [x, yy] = pt(i, R * (m.ivs[k] + 1) / 32); i ? c.lineTo(x, yy) : c.moveTo(x, yy); }); c.closePath(); c.strokeStyle = '#d99a14'; c.lineWidth = S * .8; c.setLineDash([S * 1.5, S]); c.stroke(); c.setLineDash([]);
    order.forEach((k, i) => { const [x, yy] = pt(i, R + 7); U.text(G.STAT_SHORT[k], (x - G.gfx.ox) / S, (yy - G.gfx.oy) / S - 2.5, { size: 5, weight: 800, align: 'center', color: nat[0] === k ? '#e8484a' : nat[1] === k ? '#3b82e0' : '#5a6070' }); });
    U.text('— stats   ··· IVs', cx, cy + R + 14, { size: 4.8, align: 'center', color: '#8a90a0' });
  }
  drawMoves(px, py, m, sp) {
    const U = G.ui;
    m.moves.forEach((mv, k) => {
      const M = G.MOVES[mv.id], y = py + 8 + k * 24, sel = this.moveMode && this.mi === k, sw = this.swapMove === k;
      U.pick(px + 8, y, 222, 21, sel, () => { if (!this.moveMode) { this.moveMode = true; } this.mi = k; }, () => { if (!this.moveMode) { this.moveMode = true; this.mi = k; } else { this.mi = k; G.input.tap('a'); } });
      U.rrect(px + 8, y, 222, 21, 4); U.c.fillStyle = sel ? 'rgba(255,211,92,.5)' : sw ? 'rgba(255,90,90,.25)' : 'rgba(40,48,64,.06)'; U.c.fill();
      U.typeBadge(M.type, px + 12, y + 3, 30, 8.6, 5.2); U.catBadge(M.cat, px + 12, y + 12.4);
      U.text(M.name, px + 48, y + 3, { size: 7.4, weight: 800 });
      U.text(`PP ${mv.pp}/${G.mon.maxPP(mv)}`, px + 224, y + 3.6, { size: 6, weight: 700, align: 'right' });
      U.text(`Pow ${M.pow > 1 ? M.pow : '—'}   Acc ${M.acc === true ? '—' : M.acc}${M.pri ? '   Pri ' + (M.pri > 0 ? '+' : '') + M.pri : ''}${M.contact ? '   Contact' : ''}`, px + 48, y + 12.6, { size: 5.4, color: '#6a7080' });
    });
    const M = this.moveMode ? G.MOVES[m.moves[this.mi].id] : null;
    U.panel(px + 8, py + 108, 222, 70, 'paper', { r: 5 });
    if (M) U.text(G.ui.wrap(M.desc, 206, 6).slice(0, 5).join('\n'), px + 16, py + 114, { size: 6, color: '#4a3a20' });
    if (M) G.ui.wrap(M.desc, 206, 6).slice(0, 5).forEach((l, k) => U.text(l, px + 16, py + 114 + k * 9, { size: 6, color: '#4a3a20' }));
    else U.text('Press Z to inspect or reorder moves.', px + 16, py + 114, { size: 6, color: '#8a7550' });
  }
};
// the summary's wrapped text uses repeated U.text calls; avoid newline joins
G.SummaryScene.prototype.drawMoves = (function (orig) {
  return function (px, py, m, sp) {
    const U = G.ui;
    m.moves.forEach((mv, k) => {
      const M = G.MOVES[mv.id], y = py + 8 + k * 24, sel = this.moveMode && this.mi === k, sw = this.swapMove === k;
      U.pick(px + 8, y, 222, 21, sel, () => { if (!this.moveMode) { this.moveMode = true; } this.mi = k; }, () => { if (!this.moveMode) { this.moveMode = true; this.mi = k; } else { this.mi = k; G.input.tap('a'); } });
      U.rrect(px + 8, y, 222, 21, 4); U.c.fillStyle = sel ? 'rgba(255,211,92,.5)' : sw ? 'rgba(255,90,90,.25)' : 'rgba(40,48,64,.06)'; U.c.fill();
      U.typeBadge(M.type, px + 12, y + 3, 30, 8.6, 5.2); U.catBadge(M.cat, px + 12, y + 12.4);
      U.text(M.name, px + 48, y + 3, { size: 7.4, weight: 800 });
      U.text(`PP ${mv.pp}/${G.mon.maxPP(mv)}`, px + 224, y + 3.6, { size: 6, weight: 700, align: 'right' });
      U.text(`Pow ${M.pow > 1 ? M.pow : '—'}   Acc ${M.acc === true ? '—' : M.acc}${M.pri ? '   Pri ' + (M.pri > 0 ? '+' : '') + M.pri : ''}${M.contact ? '   Contact' : ''}`, px + 48, y + 12.6, { size: 5.4, color: '#6a7080' });
    });
    const M = this.moveMode ? G.MOVES[m.moves[this.mi].id] : null;
    U.panel(px + 8, py + 108, 222, 70, 'paper', { r: 5 });
    if (M) G.ui.wrap(M.desc, 206, 6).slice(0, 6).forEach((l, k) => U.text(l, px + 16, py + 114 + k * 9, { size: 6, color: '#4a3a20' }));
    else U.text('Press Z to inspect moves; Z again to reorder.', px + 16, py + 114, { size: 6, color: '#8a7550' });
  };
})();
G.SummaryScene.prototype.drawInfo = (function () {
  return function (px, py, m, sp) {
    const U = G.ui; let y = py + 8;
    const row = (k, v, col) => { U.text(k, px + 10, y, { size: 6.2, weight: 800, color: '#6a7080' }); U.text(v, px + 70, y, { size: 6.6, weight: 700, color: col || '#283040' }); y += 11.5; };
    row('Dex No.', '#' + String(sp.num).padStart(3, '0') + '  ' + sp.name + '  ·  ' + (sp.cat || '') + ' Mon');
    row('OT', (m.ot || G.save.name) + (m.otId !== undefined && m.otId !== G.save.otId ? '  (traded)' : ''));
    const nat = G.NATURES[m.nature]; row('Nature', G.cap(m.nature) + (nat.length ? `  (+${G.STAT_SHORT[nat[0]]} −${G.STAT_SHORT[nat[1]]})` : '  (neutral)') + (m.mint ? `  · ${G.cap(m.mint)} mint` : ''));
    const ab = G.ABILITIES[G.mon.ability(m)] || {};
    row('Ability', (ab.name || '?') + (m.abil === 2 ? '  (Hidden)' : ''), m.abil === 2 ? '#9b5de5' : null);
    G.ui.wrap(ab.desc || '', 156, 5.4).slice(0, 2).forEach(l => { U.text(l, px + 70, y - 1.5, { size: 5.4, color: '#5a6070' }); y += 7.5; });
    y += 2;
    row('Met', m.met ? `${m.met.loc || 'Unknown'}, Lv ${m.met.lvl}` : 'A fateful encounter');
    row('Trait', G.mon.characteristic(m));
    row('Bond', m.bond >= 220 ? 'Unbreakable ♥♥♥' : m.bond >= 150 ? 'Close ♥♥' : m.bond >= 100 ? 'Friendly ♥' : 'Getting acquainted', '#e8487a');
    y += 3;
    G.ui.wrap(sp.dex, 218, 5.8).forEach(l => { U.text(l, px + 10, y, { size: 5.8, color: '#4a5060' }); y += 8.5; });
  };
})();
G.openSummary = function (list, i, o) { return new Promise(res => G.push(new G.SummaryScene(list, i, res, o))); };

// ---------------------------------------------------- move teaching UI --
G.MoveForgetScene = class {
  constructor(m, newMove, res) { this.m = m; this.nm = newMove; this.res = res; this.i = 0; this.lowres = false; this.t = 0; }
  update(top) {
    if (!top) return; this.t++;
    const I = G.input;
    if (I.repeat('up')) { this.i = (this.i + 4) % 5; G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % 5; G.audio && G.audio.sfx('cursor'); }
    if (I.pressed('a')) { I.consume('a'); G.audio && G.audio.sfx('select'); G.pop(this); this.res(this.i === 4 ? -1 : this.i); }
    if (I.pressed('b')) { I.consume('b'); G.audio && G.audio.sfx('back'); G.pop(this); this.res(-1); }
  }
  drawUI() {
    const U = G.ui;
    U.panel(20, 10, G.W - 40, 150, 'light', { r: 7 });
    U.text(`Which move should ${G.mon.name(this.m)} forget?`, G.W / 2, 15, { size: 8, weight: 800, align: 'center' });
    const all = [...this.m.moves.map(x => x.id), this.nm];
    all.forEach((id, k) => {
      const M = G.MOVES[id], y = 28 + k * 19 + (k === 4 ? 4 : 0), sel = this.i === k;
      U.pick(28, y, 200, 17, sel, () => { this.i = k; });
      U.rrect(28, y, 200, 17, 4); U.c.fillStyle = sel ? 'rgba(255,211,92,.55)' : k === 4 ? 'rgba(42,168,106,.15)' : 'rgba(40,48,64,.06)'; U.c.fill();
      U.typeBadge(M.type, 32, y + 4, 28, 8.6, 5); U.text(M.name, 64, y + 4, { size: 7, weight: 800 });
      U.text(k === 4 ? 'NEW' : `PP ${this.m.moves[k].pp}`, 222, y + 4.5, { size: 5.8, align: 'right', weight: 800, color: k === 4 ? '#2aa86a' : '#6a7080' });
    });
    const M = G.MOVES[all[this.i]];
    U.panel(234, 28, 122, 96, 'paper', { r: 5 });
    U.catBadge(M.cat, 240, 33); U.text(`Pow ${M.pow > 1 ? M.pow : '—'}  Acc ${M.acc === true ? '—' : M.acc}`, 266, 34, { size: 5.8, weight: 700 });
    G.ui.wrap(M.desc, 110, 5.6).slice(0, 8).forEach((l, k) => U.text(l, 240, 46 + k * 8.4, { size: 5.6, color: '#4a3a20' }));
  }
};
G.teachMoveUI = async function (m, moveId, o = {}) {
  const n = G.mon.name(m), mv = G.MOVES[moveId].name;
  while (true) {
    const ok = await G.yesno(`${n} wants to learn {b}${mv}{w}. But ${n} already knows four moves. Should a move be forgotten to make room for ${mv}?`);
    if (ok) {
      const slot = await new Promise(res => G.push(new G.MoveForgetScene(m, moveId, res)));
      if (slot >= 0) return slot;
    }
    if (await G.yesno(`Give up on learning ${mv}?`)) return -1;
  }
};
G.learnWithPrompt = async function (m, moveId) {
  if (G.mon.hasMove(m, moveId)) { await G.say(`${G.mon.name(m)} already knows ${G.MOVES[moveId].name}.`); return false; }
  if (m.moves.length < 4) { m.moves.push(G.mon.newMove(moveId)); G.audio && G.audio.jingle('learn'); await G.say(`${G.mon.name(m)} learned {b}${G.MOVES[moveId].name}{w}!`); return true; }
  const slot = await G.teachMoveUI(m, moveId);
  if (slot < 0) { await G.say(`${G.mon.name(m)} did not learn ${G.MOVES[moveId].name}.`); return false; }
  const old = G.MOVES[m.moves[slot].id].name;
  m.moves[slot] = G.mon.newMove(moveId);
  G.audio && G.audio.jingle('learn');
  await G.say(`1, 2, and... Poof!\\p${G.mon.name(m)} forgot ${old}... and learned {b}${G.MOVES[moveId].name}{w}!`);
  return true;
};
// free move relearner (QoL: available from the party menu anytime)
G.moveRelearner = async function (m) {
  const list = G.mon.learnableMoves(m);
  if (!list.length) { await G.say(`There are no moves ${G.mon.name(m)} can remember right now.`); return; }
  const items = list.map(id => ({ label: G.MOVES[id].name, right: G.cap(G.MOVES[id].type) })).concat([{ label: 'Cancel' }]);
  const k = await G.choose(items, { x: 120, y: 12, w: 150, maxRows: 11, title: 'Remember which move?', cancel: items.length - 1 });
  if (k < 0 || k >= list.length) return;
  await G.learnWithPrompt(m, list[k]);
};
