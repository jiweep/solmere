'use strict';
// ============================================================================
//  Map builder: compose tile grids from drawing ops (rects, paths, blobs,
//  organic tree borders, stamps) so maps stay consistent and valid.
// ============================================================================
G.MB = class {
  constructor(w, h, fill = '.', seed = 1) { this.w = w; this.h = h; this.g = Array.from({ length: h }, () => new Array(w).fill(fill)); this.rng = new G.RNG(seed); }
  in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  put(x, y, ch) { if (this.in(x, y)) this.g[y][x] = ch; return this; }
  get(x, y) { return this.in(x, y) ? this.g[y][x] : null; }
  rect(x, y, w, h, ch) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.put(i, j, ch); return this; }
  frame(x, y, w, h, ch) { for (let i = x; i < x + w; i++) { this.put(i, y, ch); this.put(i, y + h - 1, ch); } for (let j = y; j < y + h; j++) { this.put(x, j, ch); this.put(x + w - 1, j, ch); } return this; }
  // fill ellipse; o.only restricts to replacing certain chars
  blob(cx, cy, rx, ry, ch, o = {}) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const n = o.rough ? (this.rng.next() - .5) * o.rough : 0;
      if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1 + n && (!o.only || o.only.includes(this.get(x, y)))) this.put(x, y, ch);
    }
    return this;
  }
  // polyline path of width w (square brush)
  path(pts, ch, w = 2, o = {}) {
    for (let k = 0; k < pts.length - 1; k++) {
      let [x0, y0] = pts[k]; const [x1, y1] = pts[k + 1];
      const dx = G.sign(x1 - x0), dy = G.sign(y1 - y0);
      while (true) {
        for (let a = 0; a < w; a++) for (let b = 0; b < w; b++) if (!o.only || o.only.includes(this.get(x0 + a, y0 + b))) this.put(x0 + a, y0 + b, ch);
        if (x0 === x1 && y0 === y1) break;
        if (x0 !== x1) x0 += dx; else y0 += dy;
      }
    }
    return this;
  }
  // write a literal string row (chars ' ' are transparent)
  text(x, y, rows) { rows.forEach((r, j) => [...r].forEach((c, i) => { if (c !== ' ') this.put(x + i, y + j, c); })); return this; }
  // organic forest edge of thickness t (with ragged inner edge)
  forest(t = 2, ch = 'T', o = {}) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const d = Math.min(x, y, this.w - 1 - x, this.h - 1 - y);
      const skip = o.skip && o.skip(x, y);
      if (skip) continue;
      if (d < t || (d === t && this.rng.chance(o.ragged === undefined ? .45 : o.ragged))) this.put(x, y, ch);
    }
    return this;
  }
  scatter(ch, n, x0 = 0, y0 = 0, w = this.w, h = this.h, onlyOn = '.') {
    for (let i = 0; i < n * 6 && n > 0; i++) { const x = x0 + this.rng.int(0, w - 1), y = y0 + this.rng.int(0, h - 1); if (onlyOn.includes(this.get(x, y))) { this.put(x, y, ch); n--; } }
    return this;
  }
  replace(from, to, x0 = 0, y0 = 0, w = this.w, h = this.h) { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (this.get(x, y) === from) this.put(x, y, to); return this; }
  done() { return this.g.map(r => r.join('')); }
};
// quick helpers for building footprints on outdoor maps
G.bld = (kind, x, y, w, h, o = {}) => ({ type: 'building', kind, x, y, w, h, roof: o.roof || 'red', door: o.door, to: o.to, tx: o.tx, ty: o.ty, accent: o.accent, label: o.label, lockMsg: o.lockMsg, cond: o.cond });
G.haven = (x, y) => G.bld('haven', x, y, 6, 4, { roof: 'red', door: 2, to: 'haven', tx: 7, ty: 6 });
G.mart = (x, y) => G.bld('mart', x, y, 5, 4, { roof: 'blue', door: 2, to: 'mart', tx: 6, ty: 6 });
G.house = (x, y, to, roof = 'red', o = {}) => G.bld('house', x, y, 5, 4, { roof, door: o.door !== undefined ? o.door : 2, to, tx: 5, ty: 6, ...o });
// define a simple house interior from a template with NPC objs
G.defHouse = function (id, name, tpl, objs, o = {}) {
  G.defMap({ id, name, type: 'indoor', wall: o.wall || ['cream', 'blue', 'green', 'rose', 'wood'][G.hash(id) % 5], music: o.music || 'house', grid: G.tpl.house(tpl), warps: [{ x: 5, y: 7, to: '_back' }], objs, spawn: [5, 6], ...o });
};
