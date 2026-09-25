'use strict';
// ============================================================================
//  Dialogue: typewriter text boxes, choices, number pickers, naming keyboard
// ============================================================================
G.settings = G.settings || { textSpeed: 2, music: .7, sfx: .8, battleAnims: true, battleStyle: 'switch', battleSpeed: 1, autoRun: false, fill: false, hints: true, dmgPreview: false, clock: 'accel', autosave: true, ffSpeed: 3, ffMode: 'toggle' };
G.fmtText = function (s) {
  const sv = G.save;
  return String(s).replace(/\{PLAYER\}/g, sv ? sv.name : 'You').replace(/\{RIVAL\}/g, sv ? sv.rival || 'Wren' : 'Wren')
    .replace(/\{THEY\}/g, 'they');
};
G.TextBox = class {
  constructor(o = {}) {
    this.x = o.x !== undefined ? o.x : 6; this.w = o.w || G.W - 12; this.h = o.h || 46; this.y = o.y !== undefined ? o.y : G.H - this.h - 5;
    this.style = o.style || 'light'; this.size = o.size || 8.4; this.lh = o.lh || 11.6; this.maxLines = o.lines || 3;
    this.pages = []; this.page = 0; this.chars = 0; this.speaker = null; this.state = 'idle'; this.color = o.color;
  }
  set(text, speaker) {
    text = G.fmtText(text);
    this.speaker = speaker || null;
    const parts = text.split('\\p');
    this.pages = [];
    for (const part of parts) {
      const lines = G.ui.wrap(part, this.w - 22, this.size, 600);
      for (let i = 0; i < lines.length; i += this.maxLines) this.pages.push(lines.slice(i, i + this.maxLines));
    }
    this.page = 0; this.chars = 0; this.state = 'typing'; this.t = 0;
  }
  pageLen() { return this.pages[this.page].reduce((a, l) => a + G.ui.stripCodes(l).length, 0); }
  speed() { const s = G.settings.textSpeed; return s >= 3 ? 999 : [0.5, 1, 2.5][s] || 1; }
  // returns true when the whole text has been read (A pressed on the final page)
  update(top, allowAdvance = true) {
    if (this.state === 'idle' || !this.pages.length) return false;
    this.t++;
    const I = G.input;
    if (this.state === 'typing') {
      const before = Math.floor(this.chars);
      this.chars += this.speed();
      // voice blips: a soft tick every few letters while text types out
      if (G.audio && Math.floor(this.chars / 3) > Math.floor(before / 3) && this.chars < this.pageLen() && !G.turbo) G.audio.sfx('text');
      if (top && (I.pressed('a') || I.pressed('b'))) { this.chars = 9999; I.consume('a'); I.consume('b'); }
      if (this.chars >= this.pageLen()) { this.chars = 9999; this.state = 'wait'; this.waitT = 0; }
      return false;
    }
    if (this.state === 'wait') {
      this.waitT++;
      if (!allowAdvance) return this.page >= this.pages.length - 1;
      if (top && (I.pressed('a') || I.pressed('b'))) {
        I.consume('a'); I.consume('b');
        if (this.page < this.pages.length - 1) { this.page++; this.chars = 0; this.state = 'typing'; if (G.audio) G.audio.sfx('text'); return false; }
        this.state = 'done'; return true;
      }
    }
    return this.state === 'done';
  }
  typed() { return this.state === 'wait' || this.state === 'done'; }
  lastPage() { return this.page >= this.pages.length - 1; }
  draw(showArrow = true) {
    const U = G.ui;
    U.panel(this.x, this.y, this.w, this.h, this.style, { r: 5 });
    // inner decorative line
    if (this.style === 'light') { U.rrect(this.x + 3, this.y + 3, this.w - 6, this.h - 6, 3); U.c.lineWidth = G.gfx.S * .45; U.c.strokeStyle = 'rgba(42,48,64,.18)'; U.c.stroke(); }
    if (this.speaker) {
      // slanted name tag that snaps in with a little overshoot
      const c = U.c, X = v => U.X(v), Y = v => U.Y(v), nm = this.speaker.toUpperCase();
      const e = G.ease.outBack(Math.min(1, (this.t || 0) / 9)), sw = U.measure(nm, 7.2, 900) + 20, tx = this.x + 6 - (1 - e) * 30, ty = this.y - 11;
      const para = (px, py, pw, ph, sk, f) => { c.fillStyle = f; c.beginPath(); c.moveTo(X(px + sk), Y(py)); c.lineTo(X(px + pw + sk), Y(py)); c.lineTo(X(px + pw), Y(py + ph)); c.lineTo(X(px), Y(py + ph)); c.closePath(); c.fill(); };
      para(tx + 2, ty + 2, sw, 13, 5, '#07060c');
      para(tx, ty, sw, 13, 5, '#ff3b4e');
      para(tx, ty + 10, sw, 3, 5, '#07060c');
      U.text(nm, tx + 10, ty + 2, { size: 7.2, weight: 900, color: '#fff', shadow: false });
    }
    const lines = this.pages[this.page] || [];
    let left = Math.floor(this.chars);
    const tc = this.color || (this.style === 'dark' || this.style === 'glass' ? '#f2f4f8' : '#283040');
    lines.forEach((ln, i) => {
      if (left <= 0) return;
      const vis = G.TextBox.cut(ln, left);
      left -= G.ui.stripCodes(ln).length;
      U.rich(vis, this.x + 11, this.y + 7 + i * this.lh, { size: this.size, color: tc, weight: 600 });
    });
    if (showArrow && this.state === 'wait') {
      const bob = Math.sin(G.realTime * 7) * 1.2;
      const ax = this.x + this.w - 12, ay = this.y + this.h - 10 + bob;
      const c = U.c, S = G.gfx.S;
      c.fillStyle = '#e8484a'; c.beginPath(); c.moveTo(U.X(ax - 3.5), U.Y(ay)); c.lineTo(U.X(ax + 3.5), U.Y(ay)); c.lineTo(U.X(ax), U.Y(ay + 4)); c.fill();
    }
  }
  static cut(line, n) {
    let out = '', cnt = 0;
    const parts = line.split(/(\{[a-z]\})/);
    for (const p of parts) {
      if (/^\{[a-z]\}$/.test(p)) { out += p; continue; }
      if (cnt + p.length <= n) { out += p; cnt += p.length; } else { out += p.slice(0, n - cnt); cnt = n; break; }
    }
    return out;
  }
};

// ------------------------------------------------------------ list menu ---
G.ListMenu = class {
  constructor(items, o = {}) {
    this.items = items; this.i = o.start || 0; this.o = o;
    this.w = o.w || Math.max(56, ...items.map(s => G.ui.measure(typeof s === 'string' ? s : s.label, 7.5, 700) + 26));
    this.rowH = o.rowH || 12.5;
    this.h = items.length * this.rowH + 8;
    this.x = o.x !== undefined ? o.x : G.W - this.w - 8;
    this.y = o.y !== undefined ? o.y : G.H - 52 - this.h - 4;
    this.scroll = 0; this.maxRows = o.maxRows || 12;
    if (items.length > this.maxRows) this.h = this.maxRows * this.rowH + 8;
  }
  update(top) {
    if (!top) return null;
    const I = G.input, n = this.items.length;
    if (I.repeat('up')) { this.i = (this.i - 1 + n) % n; G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
    if (this.i < this.scroll) this.scroll = this.i;
    if (this.i >= this.scroll + this.maxRows) this.scroll = this.i - this.maxRows + 1;
    if (I.pressed('a')) {
      const it = this.items[this.i];
      if (it && it.disabled) { G.audio && G.audio.sfx('buzz'); return null; }
      I.consume('a'); G.audio && G.audio.sfx('select'); return { pick: this.i };
    }
    if (I.pressed('b') && this.o.cancel !== false) { I.consume('b'); G.audio && G.audio.sfx('back'); return { pick: this.o.cancel !== undefined ? this.o.cancel : -1, cancel: true }; }
    return null;
  }
  draw() {
    // Persona-style: a black slab that unfolds from the right, rows cascade in, the pick is a red bar that juts out
    const U = G.ui;
    if (this._t0 === undefined) this._t0 = G.realTime;
    const age = (G.realTime - this._t0) * 60, e0 = G.ease.outCubic(Math.min(1, age / 7));
    const x = this.x + (1 - e0) * 30, y = this.y, w = this.w, h = this.h;
    U.c.globalAlpha = e0;
    U.para(x + 3, y + 3, w, h, 5, 'rgba(0,0,0,.45)');
    U.para(x, y, w, h, 5, '#0c0d16'); U.para(x, y, w, 1.5, 5, '#ff3b4e');
    const rows = this.items.slice(this.scroll, this.scroll + this.maxRows);
    rows.forEach((it, k) => {
      const i = k + this.scroll, ry = y + 4 + k * this.rowH, sel = i === this.i;
      const re = G.ease.outBack(G.clamp((age - 2 - k * 1.2) / 8, 0, 1));
      const sk = 5 * (1 - (ry - y + this.rowH / 2) / h);   // follow the slab's lean
      const rx = x + sk + (1 - re) * 24;
      const label = typeof it === 'string' ? it : it.label;
      U.hot(this.x + 2, ry, this.w - 4, this.rowH, () => { if (this.i !== i) { this.i = i; G.audio && G.audio.sfx('cursor'); } }, () => { this.i = i; G.input.tap('a'); });
      if (sel) {
        const j = Math.sin(G.realTime * 8) * .6;
        U.para(rx - 2 + 2, ry + 1.5, w - 2, this.rowH - 1.5, 3, '#07060c');
        U.para(rx - 5 + j, ry, w - 2, this.rowH - 1.5, 3, '#ff3b4e');
      }
      U.c.globalAlpha = e0 * re;
      U.text(label, rx + 7 + (sel ? 1 : 0), ry + 2.3, { size: 7.5, weight: sel ? 800 : 700, color: it.disabled ? '#5c606c' : '#ffffff', shadow: sel ? '#7a0f1c' : false });
      if (it.right) U.text(it.right, rx + w - 9, ry + 2.7, { size: 6.5, weight: 700, align: 'right', color: sel ? '#ffe0e4' : '#8a8fa0', shadow: false });
      U.c.globalAlpha = e0;
    });
    if (this.items.length > this.maxRows) {
      if (this.scroll > 0) U.text('▲', x + w / 2, y - 1, { size: 5, align: 'center', color: '#ff3b4e' });
      if (this.scroll + this.maxRows < this.items.length) U.text('▼', x + w / 2, y + h - 5, { size: 5, align: 'center', color: '#ff3b4e' });
    }
    U.c.globalAlpha = 1;
  }
};

// --------------------------------------------------------- dialog scene ---
G.DialogScene = class {
  constructor(text, o, res) {
    this.o = o || {}; this.res = res; this.lowres = false;
    this.box = new G.TextBox(this.o.box || {});
    const arr = Array.isArray(text) ? text : [text];
    this.queue = arr.slice(); this.box.set(this.queue.shift(), this.o.speaker);
    this.menu = null; this.t = 0;
  }
  update(top) {
    this.t++;
    if (this.menu) {
      const r = this.menu.update(top);
      if (r) { G.pop(this); this.res(r.pick); }
      return;
    }
    const lastText = this.queue.length === 0;
    const hasMenu = lastText && this.o.options;
    const done = this.box.update(top, !(hasMenu && this.box.lastPage()));
    if (hasMenu && this.box.typed() && this.box.lastPage()) {
      this.menu = new G.ListMenu(this.o.options, { cancel: this.o.cancel !== undefined ? this.o.cancel : this.o.options.length - 1, x: this.o.mx, y: this.o.my, start: this.o.start });
      return;
    }
    if (this.o.auto && this.box.typed() && this.box.lastPage() && this.t > this.o.auto) { G.pop(this); this.res(); return; }
    if (done) {
      if (this.queue.length) { this.box.set(this.queue.shift(), this.o.speaker); return; }
      G.pop(this); this.res();
    }
  }
  drawUI() { this.box.draw(!this.menu); if (this.menu) this.menu.draw(); }
};
G.say = function (text, o = {}) {
  if (typeof o === 'string') o = { speaker: o };
  return new Promise(res => G.push(new G.DialogScene(text, o, res)));
};
G.ask = function (text, options, o = {}) {
  if (typeof o === 'string') o = { speaker: o };
  return new Promise(res => G.push(new G.DialogScene(text, { ...o, options }, res)));
};
G.yesno = async function (text, o = {}) { return (await G.ask(text, ['Yes', 'No'], o)) === 0; };

G.MenuScene = class {
  constructor(items, o, res) { this.menu = new G.ListMenu(items, o); this.res = res; this.lowres = false; this.o = o; }
  update(top) { const r = this.menu.update(top); if (r) { G.pop(this); this.res(r.pick); } }
  drawUI() {
    const U = G.ui, o = this.o, m = this.menu;
    if (o.title) { const tw = U.measure(o.title, 7, 800) + 16; U.para(m.x + 2, m.y - 11, tw, 10, 4, '#07060c'); U.para(m.x, m.y - 12, tw, 10, 4, '#ff3b4e'); U.text(o.title, m.x + 8, m.y - 10.3, { size: 7, weight: 800, color: '#fff', shadow: false }); }
    m.draw();
  }
};
G.choose = function (items, o = {}) { return new Promise(res => G.push(new G.MenuScene(items, o, res))); };

// --------------------------------------------------------- number picker --
G.NumberScene = class {
  constructor(o, res) { this.o = o; this.res = res; this.v = o.start || o.min || 1; this.lowres = false; this.box = new G.TextBox(); if (o.text) { this.box.set(o.text); this.box.chars = 9999; this.box.state = 'wait'; } }
  update(top) {
    if (!top) return; const I = G.input, o = this.o;
    const step = (d) => { this.v = this.v + d; if (this.v > o.max) this.v = o.min; if (this.v < o.min) this.v = o.max; G.audio && G.audio.sfx('cursor'); };
    if (I.repeat('up')) step(1); if (I.repeat('down')) step(-1);
    if (I.repeat('right')) { this.v = Math.min(o.max, this.v + 10); G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('left')) { this.v = Math.max(o.min, this.v - 10); G.audio && G.audio.sfx('cursor'); }
    if (I.pressed('a')) { I.consume('a'); G.audio && G.audio.sfx('select'); G.pop(this); this.res(this.v); }
    if (I.pressed('b')) { I.consume('b'); G.audio && G.audio.sfx('back'); G.pop(this); this.res(-1); }
  }
  drawUI() {
    const U = G.ui, o = this.o; if (o.text) this.box.draw(false);
    const w = 70, x = G.W - w - 8, y = G.H - 52 - 30;
    U.panel(x, y, w, 26, 'light');
    U.text('×' + String(this.v).padStart(2, '0'), x + 10, y + 5, { size: 10, weight: 800 });
    if (o.price) U.text('$' + (o.price * this.v).toLocaleString(), x + w - 7, y + 8, { size: 7, align: 'right', weight: 700, color: '#2aa86a' });
    U.text('▲', x + 22, y - 1, { size: 5, color: '#e8484a', align: 'center' }); U.text('▼', x + 22, y + 21, { size: 5, color: '#e8484a', align: 'center' });
  }
};
G.askNumber = function (o) { return new Promise(res => G.push(new G.NumberScene(o, res))); };

// --------------------------------------------------------- naming screen --
G.NamingScene = class {
  constructor(o, res) {
    this.o = o; this.res = res; this.v = (o.start || '').slice(0, o.max || 10); this.opaque = true;
    this.rows = ['ABCDEFGHIJ', 'KLMNOPQRST', 'UVWXYZ .-\'', 'abcdefghij', 'klmnopqrst', 'uvwxyz!?&#', '0123456789'];
    // cursor starts on OK so mashing through dialogue accepts the default instead of spelling "AAAA"
    this.cx = 7; this.cy = this.rows.length; this.t = 0;
    this.gridMode = true;   // Z/Space/X drive the on-screen grid until the player starts typing letters
    G.input.setTextListener(e => {
      if (this.t < 20) return true;   // swallow keys still held/mashed from the previous dialogue
      if (e.key === 'Enter') { this.finish(); return true; }
      if (e.key === 'Backspace') { this.v = this.v.slice(0, -1); this.gridMode = false; G.audio && G.audio.sfx('back'); return true; }
      if (this.gridMode && !e.shiftKey && (e.code === 'KeyZ' || e.code === 'KeyX' || e.code === 'Space')) return false;
      if (e.key.length === 1 && /[A-Za-z0-9 .\-'!?&#]/.test(e.key) && this.v.length < (this.o.max || 10)) { this.v += e.key; this.gridMode = false; G.audio && G.audio.sfx('cursor'); return true; }
      if (e.key === 'Escape') return false;
      return false;
    });
  }
  finish() {
    const val = this.v.trim() || this.o.def || '';
    if (!val) { G.audio && G.audio.sfx('buzz'); return; }
    G.input.setTextListener(null); G.pop(this); this.res(val);
  }
  update(top) {
    if (!top) return; this.t++;
    const I = G.input;
    if (this.t < 20) { I.consumeAll(); return; }
    const rows = this.rows.length + 1;
    if (['up', 'down', 'left', 'right'].some(d => I.pressed(d))) this.gridMode = true;
    if (I.repeat('up')) { this.cy = (this.cy - 1 + rows) % rows; G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('down')) { this.cy = (this.cy + 1) % rows; G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('left')) { this.cx = (this.cx + 9) % 10; G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('right')) { this.cx = (this.cx + 1) % 10; G.audio && G.audio.sfx('cursor'); }
    if (I.pressed('a')) {
      I.consume('a');
      if (this.cy === this.rows.length) {
        const opt = Math.floor(this.cx / 3.34);
        if (opt === 0) { this.v = this.v.slice(0, -1); G.audio && G.audio.sfx('back'); }
        else if (opt === 1) { this.v = this.o.def || ''; }
        else this.finish();
      } else if (this.v.length < (this.o.max || 10)) { this.v += this.rows[this.cy][this.cx]; G.audio && G.audio.sfx('cursor'); }
    }
    if (I.pressed('b')) { I.consume('b'); if (this.v.length) { this.v = this.v.slice(0, -1); G.audio && G.audio.sfx('back'); } else if (this.o.allowCancel) { G.input.setTextListener(null); G.pop(this); this.res(null); } }
    if (I.pressed('start')) this.finish();
  }
  draw(b) {
    const g = b.createLinearGradient(0, 0, 0, G.H); g.addColorStop(0, '#20344f'); g.addColorStop(1, '#0f1a2b'); b.fillStyle = g; b.fillRect(0, 0, G.W, G.H);
    for (let i = 0; i < 40; i++) { b.fillStyle = 'rgba(255,255,255,' + (0.03 + 0.03 * Math.sin(i + G.realTime)) + ')'; b.fillRect((i * 53 + G.realTime * 6) % G.W, (i * 29) % G.H, 2, 2); }
    if (this.o.icon) { const im = this.o.icon(); if (im) b.drawImage(im, 24, 18 + Math.sin(G.realTime * 3) * 2); }
  }
  drawUI() {
    const U = G.ui, o = this.o;
    U.text(o.title || 'Name?', 84, 16, { size: 9, color: '#fff', weight: 800 });
    U.panel(84, 30, 200, 20, 'light');
    const s = this.v + (Math.floor(this.t / 25) % 2 ? '_' : ' ');
    if (!this.v && o.def) U.text(o.def, 92, 34, { size: 10, weight: 800, color: 'rgba(60,70,90,.32)' });
    U.text(s, 92, 34, { size: 10, weight: 800 });
    U.text(`${this.v.length}/${o.max || 10}`, 278, 36, { size: 6, align: 'right', color: '#6a7080' });
    const gx = 60, gy = 60, cw = 26, ch = 16;
    U.panel(gx - 8, gy - 6, cw * 10 + 16, ch * (this.rows.length + 1) + 12, 'dark');
    this.rows.forEach((r, y) => [...r].forEach((chx, x) => {
      const sel = this.cx === x && this.cy === y;
      if (sel) { U.rrect(gx + x * cw, gy + y * ch, cw - 3, ch - 3, 3); U.c.fillStyle = '#ffd35c'; U.c.fill(); }
      U.text(chx === ' ' ? '␣' : chx, gx + x * cw + (cw - 3) / 2, gy + y * ch + 2.5, { size: 8, weight: 700, align: 'center', color: sel ? '#3a2800' : '#dfe6f2' });
    }));
    const by = gy + this.rows.length * ch;
    ['Delete', 'Reset', 'OK'].forEach((l, i) => {
      const sel = this.cy === this.rows.length && Math.floor(this.cx / 3.34) === i;
      U.rrect(gx + i * 88, by + 1, 80, ch - 3, 3); U.c.fillStyle = sel ? '#ffd35c' : (i === 2 ? '#2bb3a3' : '#3a4a66'); U.c.fill();
      U.text(l, gx + i * 88 + 40, by + 3.5, { size: 7.5, weight: 800, align: 'center', color: sel ? '#3a2800' : '#fff' });
    });
    U.text(this.v || !o.def ? 'Type on your keyboard, or use arrows + Z.  Enter = done' : `Type a name, or press Enter to go with "${o.def}".`, G.W / 2, G.H - 10, { size: 5.8, align: 'center', color: '#9fb2cc' });
  }
};
G.askName = function (o) { return new Promise(res => G.push(new G.NamingScene(o, res))); };
