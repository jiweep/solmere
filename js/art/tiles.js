'use strict';
// ============================================================================
//  Procedural tileset: every tile is painted pixel-by-pixel from palettes,
//  with autotiling masks, seeded variation and animation frames.
// ============================================================================
G.Painter = class {
  constructor(w, h) {
    this.w = w; this.h = h; this.cv = G.makeCanvas(w, h); this.c = this.cv.getContext('2d');
    this.id = this.c.createImageData(w, h); this.d = this.id.data;
  }
  set(x, y, col, a = 255) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, d = this.d;
    if (a >= 255) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; }
    else { const k = a / 255; d[i] = d[i] * (1 - k) + col[0] * k; d[i + 1] = d[i + 1] * (1 - k) + col[1] * k; d[i + 2] = d[i + 2] * (1 - k) + col[2] * k; d[i + 3] = Math.max(d[i + 3], a); }
  }
  get(x, y) { const i = (y * this.w + x) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]]; }
  rect(x, y, w, h, col, a) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, col, a); }
  fill(col) { this.rect(0, 0, this.w, this.h, col); }
  circ(cx, cy, r, col, a) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx + .5) ** 2 + (y - cy + .5) ** 2 <= r * r) this.set(x, y, col, a); }
  ell(cx, cy, rx, ry, col, a) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx + .5) / rx) ** 2 + ((y - cy + .5) / ry) ** 2 <= 1) this.set(x, y, col, a); }
  line(x0, y0, x1, y1, col, a) {
    x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0; const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (; ;) { this.set(x0, y0, col, a); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  // outline every opaque pixel's transparent neighbours
  outline(col) {
    const src = new Uint8ClampedArray(this.d);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = (y * this.w + x) * 4; if (src[i + 3]) continue;
      const n = (xx, yy) => xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && src[(yy * this.w + xx) * 4 + 3] > 0;
      if (n(x - 1, y) || n(x + 1, y) || n(x, y - 1) || n(x, y + 1)) this.set(x, y, col);
    }
  }
  done() { this.c.putImageData(this.id, 0, 0); return this.cv; }
};
G.tiles = (function () {
  const P = c => G.col.parse(c);
  const cache = new Map();
  const get = (key, w, h, fn) => { let c = cache.get(key); if (!c) { const p = new G.Painter(w, h); fn(p); c = p.done(); cache.set(key, c); } return c; };
  const rng = (seed) => new G.RNG(seed);
  const THEMES = {
    grass: { g: ['#7fcf57', '#71c24c', '#5eae3f', '#4b9535', '#a0e071'], tall: ['#4f9f3b', '#3f8a31', '#2f6f28', '#79c653', '#9ee06c'], leaf: ['#3c8f3a', '#2f7a32', '#225e2a', '#5ab04a', '#7fd060'], trunk: ['#8a5a36', '#6a4428'], path: ['#e3c68d', '#d4b273', '#c29d5e', '#efd8a8'], cliff: ['#b08a60', '#96714c', '#7a5a3c', '#5c4430'] },
    snow: { g: ['#f2f7fc', '#e6eef8', '#d3e0ee', '#bccde0', '#ffffff'], tall: ['#c9dbe9', '#b1c6da', '#92abc4', '#e3eef7', '#ffffff'], leaf: ['#3e7a6a', '#2f6558', '#224c44', '#e8f2fa', '#ffffff'], trunk: ['#6e5040', '#503828'], path: ['#dfe6ee', '#cad5e2', '#b6c4d4', '#eef3f8'], cliff: ['#9aa8ba', '#7f8ea2', '#66758a', '#4d5a6c'] },
    ash: { g: ['#9a8a7e', '#8c7c72', '#7a6b62', '#665850', '#b2a298'], tall: ['#8a7a4a', '#766838', '#5e522a', '#a8985e', '#c4b270'], leaf: ['#5e4a3e', '#4c3a30', '#3a2c24', '#7a6252', '#94786a'], trunk: ['#4a3a34', '#342824'], path: ['#6e5e58', '#62524c', '#544642', '#7e6e66'], cliff: ['#6a5a52', '#574944', '#463a36', '#342a28'] },
    dusk: { g: ['#6fae7c', '#62a070', '#548f63', '#437a53', '#8ccb96'], tall: ['#4c8a62', '#3e7654', '#2f5e44', '#6aac7c', '#8ccb96'], leaf: ['#8a4f7a', '#733f66', '#5a3052', '#b06c9c', '#d48cc0'], trunk: ['#5a4050', '#40303a'], path: ['#b8a8b8', '#a696a8', '#948498', '#ccbccc'], cliff: ['#8a7a8a', '#766676', '#625262', '#4c3e4c'] },
    beach: { g: ['#8fd462', '#80c655', '#6db448', '#5a9c3c', '#aee47e'], tall: ['#5aa844', '#4a9238', '#3a782e', '#80c85a', '#a4e27a'], leaf: ['#4aa048', '#3a8a3c', '#2c6e30', '#6cc05a', '#90dc70'], trunk: ['#a0703e', '#7a5430'], path: ['#f1dfad', '#e6cf95', '#d8bc7c', '#fbefcc'], cliff: ['#c8a070', '#ae8658', '#926c44', '#745434'] },
  };
  const th = t => THEMES[t] || THEMES.grass;
  const pal = arr => arr.map(P);

  // --------------------------------------------------------- ground ----
  function grass(p, v, theme, x0 = 0, y0 = 0, seedBase = 0) {
    const g = pal(th(theme).g); const r = rng(1000 + v * 77 + seedBase);
    p.fill(g[0]);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = G.smoothNoise((x + x0) / 5, (y + y0) / 5, 3 + v);
      if (n > .66) p.set(x, y, g[1]); else if (n < .2) p.set(x, y, g[4], 90);
    }
    const blades = 5 + r.int(0, 4);
    for (let i = 0; i < blades; i++) {
      const x = r.int(0, 15), y = r.int(1, 15);
      p.set(x, y, g[2]); p.set(x, y - 1, g[1]);
      if (r.chance(.4)) p.set(x + 1, y, g[3]);
    }
    for (let i = 0; i < 3; i++) p.set(r.int(0, 15), r.int(0, 15), g[4]);
    if (theme === 'snow') { for (let i = 0; i < 4; i++) p.set(r.int(0, 15), r.int(0, 15), P('#c6d6e8')); }
    if (v === 3 && theme !== 'snow' && theme !== 'ash') {
      const fx = r.int(3, 12), fy = r.int(3, 12); const fc = P(r.pick(['#ffffff', '#fff27a', '#ffb3d0']));
      p.set(fx, fy, fc); p.set(fx + 1, fy, fc); p.set(fx, fy + 1, fc); p.set(fx + 1, fy + 1, P('#e8a830'));
    }
  }
  function flowers(p, v, theme, frame) {
    grass(p, 1, theme);
    const r = rng(500 + v); const cols = [['#ff5a6a', '#c82a3a'], ['#ffe066', '#d9a520'], ['#ffffff', '#c8d0e0'], ['#ff9ad0', '#d05a98'], ['#9ad0ff', '#4a8ad0']];
    const pick = cols[v % cols.length];
    const spots = [[3, 4], [11, 3], [7, 10], [2, 12], [12, 12]];
    for (const [sx, sy] of spots) {
      const ox = (frame % 2) && (sx + sy) % 2 ? 1 : 0;
      const x = sx + ox, y = sy;
      p.set(x, y + 2, P('#3f8a31')); p.set(x, y + 3, P('#3f8a31'));
      const c1 = P(pick[0]), c2 = P(pick[1]);
      p.set(x, y, c1); p.set(x - 1, y + 1, c1); p.set(x + 1, y + 1, c1); p.set(x, y + 2, c2); p.set(x, y + 1, P('#fff4a0'));
      p.set(x - 1, y, c2, 120); p.set(x + 1, y, c2, 120);
    }
  }
  function tallgrass(p, frame, theme, mask = 0, front = false) {
    const t = pal(th(theme).tall);
    if (!front) { p.fill(t[0]); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x * 7 + y * 3) % 11 === 0) p.set(x, y, t[1]); }
    const sway = [0, 1, 0, -1][frame % 4];
    // clumps of blades in a 2x2 grid
    for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) {
      const bx = cx * 8, by = cy * 8;
      const bladesX = [1, 3, 5, 6];
      for (let k = 0; k < bladesX.length; k++) {
        const x = bx + bladesX[k], h = 5 + ((k + cx + cy) % 2) * 2, base = by + 8;
        for (let j = 0; j < h; j++) {
          const yy = base - j, xx = x + (j > h - 3 ? sway : 0);
          if (front && yy < 9) continue;
          p.set(xx, yy, j > h - 2 ? t[4] : j > h - 4 ? t[3] : k % 2 ? t[2] : t[1]);
        }
        if (!front) p.set(x - 1, base, t[2]);
      }
    }
    if (!front) {
      // soft top-edge fringe when nothing tall above
      if (!(mask & 1)) for (let x = 0; x < 16; x++) if (x % 3 !== 1) p.set(x, 0, t[3], 150);
    }
  }
  function path(p, mask, theme, kind = 'path', x0 = 0, y0 = 0) {
    const pc = kind === 'sand' ? pal(['#f4e2b0', '#ead39a', '#dcc080', '#fff2cc']) : kind === 'pave' ? pal(['#d6d2c8', '#c8c3b8', '#b4aea2', '#e6e2d8']) : pal(th(theme).path);
    const g = pal(th(theme).g);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = G.smoothNoise((x + x0) / 3.5, (y + y0) / 3.5, 9);
      p.set(x, y, n > .7 ? pc[1] : n < .18 ? pc[3] : pc[0]);
    }
    if (kind === 'pave') {
      // flagstone grid
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const row = Math.floor(y / 8), off = row % 2 ? 4 : 0;
        if (y % 8 === 7 || (x + off) % 8 === 7) p.set(x, y, pc[2]);
        else if (y % 8 === 0 || (x + off) % 8 === 0) p.set(x, y, pc[3]);
      }
    } else {
      const r = rng(77 + mask + x0 * 3);
      for (let i = 0; i < 5; i++) { const x = r.int(1, 14), y = r.int(1, 14); p.set(x, y, pc[2]); p.set(x + 1, y, pc[1]); }
    }
    // blend edges into grass (mask bit: 1 N, 2 E, 4 S, 8 W: set = same terrain)
    if (kind === 'pave') return;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const w = 2.2 + G.noise2(x + x0, y + y0, 4) * 1.6;
      let edge = false;
      if (!(mask & 1) && y < w) edge = true;
      if (!(mask & 4) && 15 - y < w) edge = true;
      if (!(mask & 8) && x < w) edge = true;
      if (!(mask & 2) && 15 - x < w) edge = true;
      // concave corners
      if ((mask & 1) && (mask & 8) && !(mask & 16) && x + y < 3) edge = true;
      if ((mask & 1) && (mask & 2) && !(mask & 32) && (15 - x) + y < 3) edge = true;
      if ((mask & 4) && (mask & 8) && !(mask & 128) && x + (15 - y) < 3) edge = true;
      if ((mask & 4) && (mask & 2) && !(mask & 64) && (15 - x) + (15 - y) < 3) edge = true;
      if (edge) p.set(x, y, kind === 'sand' ? g[0] : g[(x + y) % 5 === 0 ? 2 : 0]);
      else {
        // darker rim just inside the edge
        const near = (!(mask & 1) && y < w + 1) || (!(mask & 4) && 15 - y < w + 1) || (!(mask & 8) && x < w + 1) || (!(mask & 2) && 15 - x < w + 1);
        if (near) p.set(x, y, pc[2], kind === 'sand' ? 90 : 160);
      }
    }
  }
  function water(p, mask, frame, theme, shore = 'sand') {
    const deep = P('#3a78d8'), mid = P('#4f93ea'), lt = P('#78b6f6'), hi = P('#c8e6ff'), foam = P('#ffffff');
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = G.smoothNoise(x / 6 + frame * .25, y / 5, 21);
      p.set(x, y, n > .62 ? mid : deep);
    }
    // travelling ripples
    for (let k = 0; k < 3; k++) {
      const yy = (k * 5 + 2 + Math.floor(frame / 2)) % 16, xs = (k * 7 + frame * 2) % 16;
      for (let i = 0; i < 4; i++) p.set((xs + i) % 16, yy, i === 0 || i === 3 ? lt : hi, 200);
    }
    const sc = shore === 'grass' ? pal(th(theme).g) : pal(['#f4e2b0', '#ead39a', '#dcc080', '#fff2cc']);
    const edgeCol = shore === 'grass' ? P(th(theme).cliff[1]) : P('#d8bc80');
    const f = frame % 4, fw = [1, 2, 2, 1][f];
    const edge = (d) => d;
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let d = 99;
      if (!(mask & 1)) d = Math.min(d, y); if (!(mask & 4)) d = Math.min(d, 15 - y);
      if (!(mask & 8)) d = Math.min(d, x); if (!(mask & 2)) d = Math.min(d, 15 - x);
      if ((mask & 1) && (mask & 8) && !(mask & 16)) d = Math.min(d, Math.hypot(x, y) - 1);
      if ((mask & 1) && (mask & 2) && !(mask & 32)) d = Math.min(d, Math.hypot(15 - x, y) - 1);
      if ((mask & 4) && (mask & 8) && !(mask & 128)) d = Math.min(d, Math.hypot(x, 15 - y) - 1);
      if ((mask & 4) && (mask & 2) && !(mask & 64)) d = Math.min(d, Math.hypot(15 - x, 15 - y) - 1);
      const wob = G.noise2(x, y, 2) * 1.2;
      if (d < 2 + wob) p.set(x, y, sc[(x + y) % 4 === 0 ? 1 : 0]);
      else if (d < 3 + wob) p.set(x, y, edgeCol);
      else if (d < 3 + wob + fw) p.set(x, y, foam, 230);
      else if (d < 5 + wob + fw) p.set(x, y, lt, 150);
    }
  }
  function simple(p, kind, v, frame, theme, x0 = 0, y0 = 0) {
    const r = rng(v * 31 + 7);
    switch (kind) {
      case 'snow': grass(p, v, 'snow', x0, y0); break;
      case 'ice': {
        p.fill(P('#bfe6f6'));
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (G.smoothNoise((x + x0) / 4, (y + y0) / 4, 5) > .6) p.set(x, y, P('#d8f2fc'));
        for (let i = 0; i < 16; i++) { const x = (i + v * 5) % 16, y = (i * 3 + v) % 16; if (i % 5 === 0) { p.line(x, y, x + 3, y - 3, P('#ffffff')); } }
        p.rect(0, 15, 16, 1, P('#a8d4e8'), 120);
        break;
      }
      case 'ash': grass(p, v, 'ash', x0, y0); for (let i = 0; i < 4; i++) p.set(r.int(0, 15), r.int(0, 15), P('#4a3c38')); break;
      case 'lava': {
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
          const n = G.smoothNoise((x + x0) / 4 + frame * .15, (y + y0) / 4, 8);
          p.set(x, y, n > .7 ? P('#ffe070') : n > .5 ? P('#ffa030') : n > .3 ? P('#f06020') : P('#c83a18'));
        }
        break;
      }
      case 'cave': {
        const c = pal(['#8c7a68', '#7e6c5c', '#6e5e50', '#a08c78']);
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const n = G.smoothNoise((x + x0) / 4, (y + y0) / 4, 11); p.set(x, y, n > .66 ? c[1] : n < .22 ? c[3] : c[0]); }
        for (let i = 0; i < 3; i++) { const x = r.int(1, 14), y = r.int(1, 14); p.set(x, y, c[2]); p.set(x + 1, y + 1, c[2]); }
        break;
      }
      case 'crystalfloor': {
        const c = pal(['#6c6a90', '#62608a', '#56547a', '#8886b0']);
        for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const n = G.smoothNoise((x + x0) / 4, (y + y0) / 4, 12); p.set(x, y, n > .66 ? c[1] : n < .22 ? c[3] : c[0]); }
        if (v % 3 === 0) { p.set(r.int(2, 13), r.int(2, 13), P('#a8f0ff')); }
        break;
      }
      case 'wood': {
        const c = pal(['#c89058', '#b87e4a', '#a06a3c', '#dca470']);
        for (let y = 0; y < 16; y++) {
          const plank = Math.floor(y / 4);
          for (let x = 0; x < 16; x++) {
            const seam = (x + plank * 5) % 16 === 0;
            p.set(x, y, y % 4 === 3 ? c[2] : seam ? c[2] : (G.noise2(x, y, plank) > .8 ? c[1] : y % 4 === 0 ? c[3] : c[0]));
          }
        }
        break;
      }
      case 'tilefloor': {
        const a = P(v % 2 ? '#e8ecef' : '#dfe4e8'), b = P('#c4ccd4'), hl = P('#f8fafc');
        p.fill(a); p.rect(0, 15, 16, 1, b); p.rect(15, 0, 1, 16, b); p.rect(0, 0, 16, 1, hl); p.rect(0, 0, 1, 16, hl);
        break;
      }
      case 'carpet': {
        const c = theme === 'blue' ? pal(['#4a6ab8', '#3a5aa0', '#6a8ad0']) : theme === 'green' ? pal(['#4a9a6a', '#3a8058', '#6ab888']) : pal(['#c84a4a', '#a83a3a', '#e06a6a']);
        p.fill(c[0]); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if ((x + y) % 4 === 0) p.set(x, y, c[1]);
        break;
      }
      case 'gymfloor': {
        const base = P(theme || '#8aa0b8'); const dk = G.col.parse(G.col.dark(theme || '#8aa0b8', .18)); const lt = G.col.parse(G.col.light(theme || '#8aa0b8', .25));
        p.fill(base); p.rect(0, 0, 16, 1, lt); p.rect(0, 0, 1, 16, lt); p.rect(0, 15, 16, 1, dk); p.rect(15, 0, 1, 16, dk);
        p.set(7, 7, lt); p.set(8, 8, dk);
        break;
      }
      case 'metal': {
        const c = pal(['#9aa4b0', '#8894a2', '#b8c2cc', '#6a7684']);
        p.fill(c[0]); for (let y = 0; y < 16; y += 4) p.rect(0, y, 16, 1, c[1]);
        p.set(2, 2, c[3]); p.set(13, 2, c[3]); p.set(2, 13, c[3]); p.set(13, 13, c[3]); p.rect(0, 0, 16, 1, c[2]);
        break;
      }
      case 'bridge': {
        const c = pal(['#b88a52', '#9c7040', '#7c5630', '#d4a86c']);
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) p.set(x, y, x % 4 === 3 ? c[2] : y < 2 || y > 13 ? c[1] : (G.noise2(x, y, 3) > .85 ? c[1] : c[0]));
        p.rect(0, 0, 16, 1, c[3]); p.rect(0, 15, 16, 1, c[2]);
        for (let x = 1; x < 16; x += 4) { p.set(x, 1, c[2]); p.set(x, 14, c[2]); }
        break;
      }
      case 'bridgev': {
        const c = pal(['#b88a52', '#9c7040', '#7c5630', '#d4a86c']);
        for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) p.set(x, y, y % 4 === 3 ? c[2] : x < 2 || x > 13 ? c[1] : (G.noise2(x, y, 3) > .85 ? c[1] : c[0]));
        p.rect(0, 0, 1, 16, c[3]); p.rect(15, 0, 1, 16, c[2]);
        break;
      }
      case 'dark': p.fill(P('#0a0a12')); break;
      case 'mat': {
        p.fill(P('#c84a4a')); p.rect(1, 1, 14, 14, P('#e06a5a')); p.rect(3, 3, 10, 10, P('#c84a4a'));
        for (let x = 2; x < 14; x += 2) { p.set(x, 0, P('#f0d070')); p.set(x, 15, P('#f0d070')); }
        break;
      }
    }
  }
  // ------------------------------------------------------ tall objects --
  function tree(p, v, theme, kind) {
    // 16 x 32, trunk at the bottom tile
    const t = th(theme), L = pal(t.leaf), T = pal(t.trunk);
    const out = P(theme === 'snow' ? '#1a3a38' : theme === 'dusk' ? '#3a1a34' : theme === 'ash' ? '#241a16' : '#173d1c');
    p.ell(8, 29.5, 6, 2.2, P('#000000'), 60);
    if (kind === 'pine' || theme === 'snow') {
      p.rect(7, 22, 3, 8, T[0]); p.rect(9, 22, 1, 8, T[1]);
      const layers = [[18, 7.5], [13, 6], [8, 4.5], [4, 3]];
      for (const [cy, r] of layers) {
        for (let y = 0; y < 8; y++) { const w = r * (y / 8) + 1.2; for (let x = Math.floor(8 - w); x <= 8 + w; x++) p.set(x, cy - 4 + y, y > 5 ? L[1] : L[0]); }
      }
      if (theme === 'snow') for (const [cy, r] of layers) for (let x = Math.floor(8 - r * .6); x <= 8 + r * .6; x++) { p.set(x, cy - 2, L[3]); p.set(x, cy - 3, L[4]); }
      p.outline(out);
      return;
    }
    if (kind === 'palm') {
      for (let y = 10; y < 30; y++) { const x = 7 + Math.round(Math.sin(y / 5) * 1.5); p.set(x, y, T[0]); p.set(x + 1, y, T[1]); if (y % 3 === 0) p.set(x, y, T[1]); }
      const fronds = [[-7, 2], [7, 2], [-5, -3], [5, -3], [0, -5]];
      for (const [dx, dy] of fronds) for (let k = 0; k <= 10; k++) { const x = 8 + dx * k / 10, y = 10 + dy * k / 10 + (k * k) / 40 * 3; p.set(x, y, L[k < 4 ? 3 : 0]); p.set(x, y + 1, L[1]); }
      p.circ(7, 11, 1.5, P('#7a5430')); p.circ(9.5, 11.5, 1.5, P('#7a5430'));
      p.outline(out);
      return;
    }
    if (kind === 'dead') {
      p.rect(7, 12, 3, 18, T[0]);
      p.line(8, 14, 3, 8, T[0]); p.line(8, 16, 13, 9, T[0]); p.line(4, 9, 3, 6, T[1]); p.line(12, 10, 14, 7, T[1]); p.line(8, 12, 8, 6, T[0]);
      p.outline(out); return;
    }
    // broadleaf: trunk + cluster canopy
    p.rect(6, 21, 4, 9, T[0]); p.rect(9, 21, 1, 9, T[1]); p.set(5, 29, T[0]); p.set(10, 29, T[1]);
    const blobs = v % 2 ? [[8, 12, 7.4], [4.5, 16, 4.2], [11.5, 16, 4.2], [8, 7, 5], [8, 18, 5]] : [[8, 11, 7.2], [5, 15.5, 4.5], [11, 15.5, 4.5], [8, 6.5, 4.8], [7.5, 18, 4.8]];
    for (const [cx, cy, r] of blobs) p.circ(cx, cy, r, L[1]);
    for (const [cx, cy, r] of blobs) p.circ(cx - .8, cy - 1, r - 1.4, L[0]);
    for (const [cx, cy, r] of blobs) p.circ(cx - 1.8, cy - 2.2, r * .38, L[3]);
    // leaf texture specks
    const r2 = rng(v * 13 + 5);
    for (let i = 0; i < 26; i++) { const x = r2.int(1, 14), y = r2.int(2, 21); const c = p.get(x, y); if (c[3]) p.set(x, y, r2.chance(.5) ? L[2] : L[4]); }
    for (let x = 2; x < 15; x++) for (let y = 17; y < 23; y++) { const c = p.get(x, y); if (c[3] && y > 19) p.set(x, y, L[2]); }
    if (theme === 'dusk' && v % 3 === 0) { p.set(5, 12, P('#ffe0f0')); p.set(10, 8, P('#ffe0f0')); p.set(9, 15, P('#ffe0f0')); }
    p.outline(out);
  }
  function smallTree(p, theme) {
    const L = pal(th(theme).leaf);
    p.ell(8, 14.5, 5.5, 1.8, P('#000000'), 60);
    p.rect(7, 10, 2, 5, P('#7a5030'));
    p.circ(8, 7, 5.5, L[1]); p.circ(7.2, 6.2, 4.3, L[0]); p.circ(6, 5, 1.8, L[3]);
    // cut marks (it's cuttable!)
    p.line(10, 11, 12, 9, P('#e8e0c0')); p.line(11, 12, 13, 10, P('#e8e0c0'));
    p.outline(P('#173d1c'));
  }
  function rock(p, kind, theme) {
    const c = theme === 'snow' ? pal(['#a8b8c8', '#8898aa', '#6a7a8c', '#d8e4f0']) : theme === 'ash' ? pal(['#5a4e4a', '#4a403c', '#3a3230', '#7a6c66']) : pal(['#a8a49c', '#8e8a82', '#706c66', '#cfcbc2']);
    p.ell(8, 14.5, 6.5, 2, P('#000000'), 60);
    if (kind === 'boulder') {
      p.circ(8, 8.5, 6.8, c[1]); p.circ(7.3, 7.5, 5.8, c[0]); p.circ(5.5, 5.5, 2.2, c[3]);
      p.line(9, 3, 11, 6, c[2]); p.line(4, 11, 7, 12, c[2]);
    } else {
      p.ell(8, 10, 7, 5.5, c[1]); p.ell(7.3, 9, 6, 4.4, c[0]); p.ell(5, 7.5, 2.2, 1.4, c[3]);
      if (kind === 'crack') { p.line(8, 5, 7, 9, c[2]); p.line(7, 9, 9, 11, c[2]); p.line(7, 9, 4, 10, c[2]); p.line(9, 11, 11, 13, c[2]); }
      else { p.line(10, 7, 12, 10, c[2]); }
    }
    p.outline(P('#2a2622'));
  }
  function fence(p, mask, theme) {
    const c = theme === 'snow' ? pal(['#c8a880', '#a88860', '#86684a', '#f0f4f8']) : pal(['#d8b07a', '#b88c58', '#8a643c', '#f0d2a0']);
    const hz = (mask & 2) || (mask & 8) || !(mask & 5);
    if (hz) {
      p.rect(0, 5, 16, 2, c[0]); p.rect(0, 10, 16, 2, c[0]); p.rect(0, 7, 16, 1, c[2]); p.rect(0, 12, 16, 1, c[2]);
      p.rect(6, 2, 4, 13, c[1]); p.rect(6, 2, 4, 1, c[3]); p.rect(9, 3, 1, 12, c[2]);
    }
    if ((mask & 1) || (mask & 4)) { p.rect(6, 0, 4, 16, c[1]); p.rect(9, 0, 1, 16, c[2]); p.rect(6, 0, 1, 16, c[3]); }
    if (theme === 'snow') p.rect(6, 2, 4, 1, c[3]);
    p.ell(8, 15, 4, 1, P('#000000'), 50);
  }
  function hedge(p, mask, theme) {
    const L = pal(th(theme).leaf);
    p.rect(0, 2, 16, 13, L[1]);
    for (let y = 2; y < 15; y++) for (let x = 0; x < 16; x++) if (G.noise2(x, y, 6) > .55) p.set(x, y, L[0]);
    for (let x = 0; x < 16; x++) { p.set(x, 2, L[3]); if (x % 3 === 0) p.set(x, 3, L[4]); p.set(x, 14, L[2]); }
    if (!(mask & 8)) for (let y = 2; y < 15; y++) p.set(0, y, L[2]);
    if (!(mask & 2)) for (let y = 2; y < 15; y++) p.set(15, y, L[2]);
    p.rect(0, 15, 16, 1, P('#1e4a22'));
  }
  function ledge(p, v, theme, dir = 'down') {
    grass(p, v, theme);
    const c = pal(th(theme).cliff), g = pal(th(theme).g);
    if (dir === 'down') {
      p.rect(0, 10, 16, 6, c[1]); p.rect(0, 10, 16, 1, g[3]); p.rect(0, 11, 16, 1, c[0]); p.rect(0, 15, 16, 1, c[3]);
      for (let x = 1; x < 16; x += 5) p.rect(x, 12, 1, 3, c[2]);
    } else {
      const L = dir === 'left';
      const x0 = L ? 0 : 10;
      p.rect(x0, 0, 6, 16, c[1]); p.rect(L ? 5 : 10, 0, 1, 16, g[3]); p.rect(L ? 0 : 15, 0, 1, 16, c[3]);
      for (let y = 2; y < 16; y += 5) p.rect(x0 + 2, y, 2, 1, c[2]);
    }
  }
  function cliff(p, mask, theme, kind) {
    // mask: 1=N same, 2=E same, 4=S same, 8=W same
    const c = kind === 'cave' ? pal(['#7a6452', '#66523f', '#523f30', '#9a8068']) : kind === 'crystal' ? pal(['#5a5680', '#4a466c', '#3a3658', '#7a76a8']) : pal(th(theme).cliff);
    const g = pal(th(theme).g);
    p.fill(c[1]);
    // rock strata
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const n = G.smoothNoise(x / 4, y / 3, kind === 'cave' ? 14 : 13);
      if (n > .68) p.set(x, y, c[0]); else if (n < .25) p.set(x, y, c[2]);
      if ((y + Math.floor(x / 5)) % 6 === 0) p.set(x, y, c[2]);
    }
    if (!(mask & 1)) {
      if (kind === 'cave' || kind === 'crystal') { p.rect(0, 0, 16, 3, c[3]); p.rect(0, 3, 16, 1, c[0]); }
      else { p.rect(0, 0, 16, 3, g[0]); for (let x = 0; x < 16; x++) { p.set(x, 3, x % 3 ? g[2] : g[1]); if (x % 4 === 1) p.set(x, 4, g[2]); } p.rect(0, 0, 16, 1, g[4]); }
    }
    if (!(mask & 4)) { p.rect(0, 14, 16, 2, c[3]); p.rect(0, 13, 16, 1, c[2]); }
    if (!(mask & 8)) { p.rect(0, 0, 1, 16, c[3]); p.rect(1, 0, 1, 16, c[0]); }
    if (!(mask & 2)) { p.rect(15, 0, 1, 16, c[3]); p.rect(14, 0, 1, 16, c[2]); }
    if (kind === 'crystal' && (mask & 1) && G.noise2(mask, 3) > .4) { p.rect(6, 5, 2, 5, P('#a8f0ff')); p.set(6, 4, P('#ffffff')); p.rect(9, 7, 2, 4, P('#c8a8ff')); }
  }
  function lamp(p, theme) {
    p.ell(8, 30, 3, 1.2, P('#000000'), 60);
    p.rect(7, 12, 2, 18, P('#3a3f4a')); p.rect(7, 12, 1, 18, P('#5a606c'));
    p.rect(6, 28, 4, 2, P('#2a2e36'));
    p.rect(4, 5, 8, 7, P('#2a2e36')); p.rect(5, 6, 6, 5, P('#fff2a8')); p.rect(5, 6, 2, 5, P('#ffffff'));
    p.rect(3, 4, 10, 1, P('#2a2e36')); p.rect(6, 2, 4, 2, P('#2a2e36'));
    if (theme === 'dusk') { p.rect(5, 6, 6, 5, P('#b8f0ff')); }
  }
  function crystal(p, v) {
    p.ell(8, 14.5, 6, 1.8, P('#000000'), 60);
    const c = v % 2 ? pal(['#a8f0ff', '#6ad0f0', '#ffffff', '#3a9ac0']) : pal(['#d8b8ff', '#a888e8', '#ffffff', '#6a4ab0']);
    p.rect(6, 3, 4, 12, c[0]); p.rect(6, 3, 2, 12, c[1]); p.set(7, 2, c[2]); p.set(8, 2, c[0]);
    p.rect(2, 8, 3, 7, c[0]); p.rect(2, 8, 1, 7, c[1]); p.set(3, 7, c[2]);
    p.rect(11, 6, 3, 9, c[0]); p.rect(11, 6, 1, 9, c[1]); p.set(12, 5, c[2]);
    p.rect(8, 5, 1, 4, c[2]);
    p.outline(c[3]);
  }
  // --------------------------------------------------- interior pieces --
  function wall(p, v, style) {
    const S = { cream: ['#f4ead2', '#e2d4b4', '#c8b490', '#8a6a4a'], blue: ['#cfe0f4', '#b8cde6', '#98b0d0', '#4a5e80'], green: ['#d4ecd0', '#bcdcb6', '#9cc494', '#3e6a44'], lab: ['#eef2f6', '#dde4ec', '#c4ced8', '#5a6a7c'], gym: ['#3a4458', '#2e3648', '#242a3a', '#10141c'], wood: ['#c8965e', '#b0804c', '#946a3c', '#5a3c20'], stone: ['#8a8e98', '#767a84', '#62666e', '#3a3c42'], rose: ['#f4d4dc', '#e6bcc8', '#d0a0b0', '#7a4a5a'] }[style] || ['#f4ead2', '#e2d4b4', '#c8b490', '#8a6a4a'];
    const c = pal(S);
    p.fill(c[0]);
    if (style === 'wood') { for (let x = 0; x < 16; x += 4) p.rect(x, 0, 1, 16, c[2]); }
    else if (style === 'stone') { for (let y = 0; y < 16; y += 5) { p.rect(0, y, 16, 1, c[2]); for (let x = (y / 5 % 2) * 4; x < 16; x += 8) p.rect(x, y, 1, 5, c[2]); } }
    else for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++) if ((x + (y >> 2) * 2) % 8 === 0 && y % 4 < 2) p.set(x, y, c[1]);
    p.rect(0, 12, 16, 1, c[2]); p.rect(0, 13, 16, 3, c[3]); p.rect(0, 13, 16, 1, G.col.parse(G.col.light(S[3], .3)));
    if (v === 1) { // window
      p.rect(3, 2, 10, 8, P('#5a4630')); p.rect(4, 3, 8, 6, P('#9ad8ff')); p.rect(4, 3, 3, 2, P('#e6f6ff')); p.rect(7, 3, 1, 6, P('#5a4630')); p.rect(4, 6, 8, 1, P('#5a4630'));
      p.rect(2, 10, 12, 1, P('#7a6040'));
    }
    if (v === 2) { p.rect(4, 3, 8, 6, P('#6a4a2a')); p.rect(5, 4, 6, 4, P('#e8d8a8')); p.rect(6, 5, 2, 2, P('#e05a5a')); p.rect(8, 6, 2, 1, P('#4a8a4a')); } // painting
    if (v === 3) { p.rect(6, 2, 4, 4, P('#f0f0f0')); p.circ(8, 4, 2, P('#ffffff')); p.set(8, 3, P('#303030')); p.set(8, 4, P('#303030')); p.set(9, 4, P('#303030')); } // clock
  }
  // joined table: m bits 1=up 2=right 4=down 8=left neighbour is also a table
  function tableJoin(p, m) {
    const O = P('#2a2230'), x0 = m & 8 ? 0 : 1, x1 = m & 2 ? 16 : 15, y0 = m & 1 ? 0 : 4, y1 = m & 4 ? 16 : 12;
    if (!(m & 4)) p.ell(8, 15, 7, 1.5, P('#000000'), 50);
    p.rect(x0, y0, x1 - x0, y1 - y0, P('#b87e4a'));
    if (!(m & 1)) p.rect(x0, y0, x1 - x0, 2, P('#d8a068'));
    if (!(m & 4)) { p.rect(x0, y1 - 1, x1 - x0, 1, P('#8a5a30')); if (!(m & 8)) p.rect(2, 12, 2, 3, P('#8a5a30')); if (!(m & 2)) p.rect(12, 12, 2, 3, P('#8a5a30')); }
    const cy = Math.round((y0 + y1) / 2); p.circ(8, cy, 2.2, P('#f4f4f8')); p.circ(8, cy, 1.2, P('#e0e0ea'));
    p.outline(O);
  }
  function furniture(p, kind, frame) {
    const O = P('#2a2230');
    const sh = () => p.ell(8, 15, 7, 1.5, P('#000000'), 50);
    switch (kind) {
      case 'counter': p.rect(0, 3, 16, 12, P('#c89058')); p.rect(0, 3, 16, 3, P('#e8c088')); p.rect(0, 14, 16, 2, P('#8a5a30')); p.rect(0, 6, 16, 1, P('#a06a3c')); break;
      case 'pc': sh(); p.rect(2, 4, 12, 11, P('#5a6474')); p.rect(3, 5, 10, 6, frame % 2 ? P('#6ad0ff') : P('#58c0f0')); p.rect(4, 6, 3, 1, P('#e0f8ff')); p.rect(3, 12, 10, 2, P('#3a4250')); p.rect(6, 14, 4, 1, P('#2a303a')); p.outline(O); break;
      case 'shelf': p.rect(1, 0, 14, 15, P('#8a5a34')); for (let y = 1; y < 14; y += 5) { p.rect(2, y, 12, 4, P('#5a3a20')); for (let x = 2; x < 14; x += 2) p.rect(x, y + (x % 4 ? 1 : 0), 2, 4 - (x % 4 ? 1 : 0), P(['#c84a4a', '#4a7ac8', '#4ab86a', '#e8b83a', '#9a5ac8'][(x + y) % 5])); } p.outline(O); break;
      case 'bed_top': // head of a two-tile bed: headboard, pillow, turned-down blanket
        p.rect(1, 0, 14, 16, P('#e8e8f0')); p.rect(0, 0, 16, 3, P('#8a5a34')); p.rect(0, 0, 16, 1, P('#a8703c'));
        p.rect(3, 4, 10, 4, P('#ffffff')); p.rect(3, 7, 10, 1, P('#d0d4e0'));
        p.rect(1, 10, 14, 6, P('#4a7ac8')); p.rect(1, 10, 14, 2, P('#e8ecf6')); p.rect(1, 12, 14, 1, P('#6a9ae0')); p.outline(O); break;
      case 'bed_bot': // foot of a two-tile bed
        p.rect(1, 0, 14, 13, P('#4a7ac8')); p.rect(2, 0, 1, 12, P('#6a9ae0')); p.rect(13, 0, 1, 12, P('#3a64aa'));
        for (let x = 3; x < 13; x += 3) p.set(x, 6, P('#6a9ae0'));
        p.rect(0, 12, 16, 3, P('#8a5a34')); p.rect(0, 12, 16, 1, P('#a8703c')); p.ell(8, 15.5, 7, 1, P('#000000'), 50); p.outline(O); break;
      case 'bed': p.rect(1, 1, 14, 14, P('#e8e8f0')); p.rect(1, 6, 14, 9, P('#4a7ac8')); p.rect(1, 6, 14, 2, P('#6a9ae0')); p.rect(3, 2, 10, 3, P('#ffffff')); p.rect(0, 0, 16, 2, P('#8a5a34')); p.outline(O); break;
      case 'table': sh(); p.rect(1, 4, 14, 8, P('#b87e4a')); p.rect(1, 4, 14, 2, P('#d8a068')); p.rect(2, 12, 2, 3, P('#8a5a30')); p.rect(12, 12, 2, 3, P('#8a5a30')); p.circ(8, 6, 1.6, P('#f0f0f0')); p.outline(O); break;
      case 'tv': sh(); p.rect(1, 3, 14, 10, P('#2a2a34')); p.rect(2, 4, 12, 7, frame % 2 ? P('#4a8ac8') : P('#5a9ad8')); p.rect(3, 5, 4, 2, P('#a8d8ff')); p.rect(5, 13, 6, 2, P('#3a3a44')); p.outline(O); break;
      case 'plant': sh(); p.rect(5, 10, 6, 5, P('#c86a3a')); p.rect(5, 10, 6, 1, P('#e88a5a')); p.circ(8, 6, 4, P('#3a8a3a')); p.circ(6, 4, 2.5, P('#5ab05a')); p.circ(10, 5, 2.5, P('#4aa04a')); p.outline(O); break;
      case 'stairsup': for (let i = 0; i < 4; i++) { p.rect(0, i * 4, 16, 4, P(i % 2 ? '#a88a6a' : '#c8a882')); p.rect(0, i * 4, 16, 1, P('#e0c8a0')); } p.rect(0, 0, 1, 16, P('#6a5040')); p.rect(15, 0, 1, 16, P('#6a5040')); break;
      case 'stairsdown': p.fill(P('#3a2e28')); for (let i = 0; i < 4; i++) { p.rect(1, i * 4, 14, 3, P(['#8a7058', '#76604a', '#62503e', '#4e4032'][i])); } break;
      case 'healer': p.rect(0, 2, 16, 13, P('#e8e8f0')); p.rect(0, 2, 16, 3, P('#ffffff')); for (let i = 0; i < 3; i++) { p.circ(3 + i * 5, 8, 1.8, frame % 2 ? P('#ff8aa0') : P('#e85a78')); } p.rect(0, 13, 16, 2, P('#b0b0c0')); p.outline(O); break;
      case 'crate': sh(); p.rect(1, 2, 14, 13, P('#c8965a')); p.rect(1, 2, 14, 1, P('#e8b87a')); p.line(1, 2, 14, 14, P('#8a6034')); p.line(14, 2, 1, 14, P('#8a6034')); p.rect(1, 8, 14, 1, P('#8a6034')); p.outline(O); break;
      case 'barrel': sh(); p.ell(8, 8, 6, 7, P('#a8703c')); p.rect(2, 4, 12, 1, P('#5a5a64')); p.rect(2, 11, 12, 1, P('#5a5a64')); p.ell(8, 2.5, 5, 1.5, P('#c89058')); p.outline(O); break;
      case 'machine': sh(); p.rect(1, 1, 14, 14, P('#6a7484')); p.rect(2, 2, 12, 5, P('#2a303a')); p.rect(3, 3, 3, 3, frame % 2 ? P('#6aff9a') : P('#3ac06a')); p.rect(8, 3, 5, 1, P('#ff6a6a')); p.rect(8, 5, 4, 1, P('#6ad0ff')); for (let x = 3; x < 13; x += 3) p.rect(x, 9, 2, 4, P('#4a5260')); p.outline(O); break;
      case 'statue': sh(); p.rect(4, 11, 8, 4, P('#8a8e98')); p.rect(5, 3, 6, 8, P('#b8bcc8')); p.circ(8, 3, 3, P('#c8ccd8')); p.rect(5, 3, 2, 8, P('#d8dce8')); p.outline(O); break;
      case 'sign': p.ell(8, 15, 4, 1, P('#000000'), 60); p.rect(7, 9, 2, 6, P('#7a5030')); p.rect(2, 2, 12, 8, P('#c8965a')); p.rect(3, 3, 10, 6, P('#e8c088')); p.rect(4, 4, 8, 1, P('#8a6034')); p.rect(4, 6, 6, 1, P('#8a6034')); p.outline(O); break;
      case 'mailbox': p.ell(8, 15, 3, 1, P('#000000'), 60); p.rect(7, 8, 2, 7, P('#6a4a2a')); p.rect(3, 3, 10, 6, P('#e05050')); p.rect(3, 3, 10, 2, P('#ff7a7a')); p.rect(12, 1, 1, 4, P('#3a3a3a')); p.rect(12, 1, 3, 2, P('#ffd84a')); p.outline(O); break;
      case 'bench': sh(); p.rect(1, 5, 14, 3, P('#b87e4a')); p.rect(1, 9, 14, 2, P('#a06a3c')); p.rect(2, 11, 2, 4, P('#3a3a44')); p.rect(12, 11, 2, 4, P('#3a3a44')); p.rect(1, 5, 14, 1, P('#d8a068')); p.outline(O); break;
      case 'flowerpot': sh(); p.rect(4, 9, 8, 6, P('#c86a3a')); p.rect(4, 9, 8, 1, P('#e88a5a')); p.circ(6, 6, 2, P('#ff5a7a')); p.circ(10, 6, 2, P('#ffd84a')); p.circ(8, 4, 2, P('#ff9ad0')); p.rect(7, 7, 2, 2, P('#3a8a3a')); p.outline(O); break;
      case 'grave': p.ell(8, 15, 5, 1.2, P('#000000'), 60); p.rect(4, 4, 8, 11, P('#8a8e98')); p.circ(8, 5, 4, P('#8a8e98')); p.rect(4, 4, 2, 11, P('#a8acb8')); p.rect(7, 6, 2, 5, P('#62666e')); p.rect(6, 7, 4, 1, P('#62666e')); p.outline(O); break;
      case 'lanternpost': p.ell(8, 15, 3, 1, P('#000000'), 60); p.rect(7, 6, 2, 9, P('#3a2e28')); p.rect(5, 1, 6, 6, P('#3a2e28')); p.rect(6, 2, 4, 4, P('#ffb04a')); p.rect(6, 2, 2, 2, P('#ffe0a0')); p.outline(O); break;
      case 'snowman': p.ell(8, 15, 5, 1.2, P('#000000'), 50); p.circ(8, 11, 4.5, P('#ffffff')); p.circ(8, 5, 3.2, P('#f4f8fc')); p.set(7, 4, P('#202020')); p.set(9, 4, P('#202020')); p.rect(8, 5, 2, 1, P('#ff8a3a')); p.rect(5, 1, 6, 2, P('#303040')); p.rect(6, 0, 4, 1, P('#303040')); p.outline(P('#6a7a90')); break;
      case 'fountain': {
        p.ell(8, 11, 7.5, 4.5, P('#a8acb8')); p.ell(8, 10.5, 6, 3.3, P(frame % 2 ? '#6aa8f0' : '#78b6f6'));
        p.rect(7, 3, 2, 8, P('#c8ccd8')); p.circ(8, 3, 1.5 + (frame % 2) * .5, P('#c8e6ff'));
        for (let i = 0; i < 4; i++) p.set(4 + i * 3, 9 + (i + frame) % 2, P('#ffffff'));
        p.outline(P('#4a4e58')); break;
      }
      case 'boat': p.ell(8, 11, 7.5, 4, P('#b8603a')); p.ell(8, 10, 6.5, 2.8, P('#8a4a2a')); p.rect(2, 8, 12, 1, P('#e8e0c8')); p.outline(O); break;
      case 'tent': p.ell(8, 15, 7, 1.2, P('#000000'), 50); for (let y = 0; y < 14; y++) { const w = y * .55; p.rect(Math.round(8 - w), y + 1, Math.round(w * 2) + 1, 1, P(y % 4 < 2 ? '#e06a4a' : '#f08a6a')); } p.rect(7, 8, 3, 7, P('#5a2a1a')); p.outline(O); break;
      case 'stall': p.rect(0, 7, 16, 8, P('#a8703c')); p.rect(0, 7, 16, 2, P('#c89058')); for (let x = 0; x < 16; x += 4) { p.rect(x, 1, 4, 5, P(x % 8 ? '#ffffff' : '#e84a5a')); } p.rect(0, 6, 16, 1, P('#8a3a3a')); p.rect(3, 9, 3, 3, P('#ff8a3a')); p.rect(9, 9, 3, 3, P('#8ae05a')); p.outline(O); break;
      case 'cauldron': sh(); p.ell(8, 10, 6, 5, P('#3a3a44')); p.ell(8, 6, 5, 1.8, P(frame % 2 ? '#8ae05a' : '#6ac04a')); p.rect(3, 13, 2, 2, P('#2a2a30')); p.rect(11, 13, 2, 2, P('#2a2a30')); p.outline(O); break;
      case 'rug': p.fill(P('#6a4ab0')); p.rect(1, 1, 14, 14, P('#8a6ad0')); p.rect(3, 3, 10, 10, P('#6a4ab0')); p.rect(6, 6, 4, 4, P('#f0d070')); break;
      case 'window': wall(p, 1, 'cream'); break;
      case 'desk': sh(); p.rect(0, 5, 16, 7, P('#8a5a34')); p.rect(0, 5, 16, 2, P('#a8703c')); p.rect(1, 12, 2, 3, P('#5a3a20')); p.rect(13, 12, 2, 3, P('#5a3a20')); p.rect(3, 2, 6, 4, P('#2a303a')); p.rect(4, 3, 4, 2, P('#6ad0ff')); p.rect(11, 3, 3, 3, P('#f0f0f0')); p.outline(O); break;
      case 'orbball': {
        p.ell(8, 14, 4, 1.3, P('#000000'), 60);
        p.circ(8, 8.5, 5, P('#e8484a')); for (let y = 9; y < 14; y++) for (let x = 3; x < 14; x++) if ((x - 7.5) ** 2 + (y - 8) ** 2 < 25) p.set(x, y, P('#f4f4f4'));
        p.rect(3, 8, 11, 1, P('#2a2a2a')); p.circ(8, 8.5, 1.8, P('#2a2a2a')); p.circ(8, 8.5, 1, P('#ffffff')); p.set(6, 5, P('#ffc0c0'));
        p.outline(O); break;
      }
    }
  }

  // --------------------------------------------------------- buildings --
  // w,h in tiles. Returns {img, oy} where oy is extra pixels above the footprint
  function building(kind, w, h, o = {}) {
    const key = `bld|${kind}|${w}|${h}|${o.roof || ''}|${o.theme || ''}|${o.label || ''}|${o.frame || 0}`;
    const extra = kind === 'tower' ? 48 : kind === 'lighthouse' ? 64 : 10;
    return {
      img: get(key, w * 16, h * 16 + extra, p => paintBuilding(p, kind, w, h, extra, o)), oy: extra,
    };
  }
  function paintBuilding(p, kind, w, h, E, o) {
    const W = w * 16, H = h * 16 + E;
    const roofCols = { red: ['#e0584a', '#c0443a', '#9a342c', '#f48a74'], blue: ['#4a7ad0', '#3a64b4', '#2c4e90', '#7aa4ec'], green: ['#4aa864', '#3a9052', '#2c7040', '#7ccc8a'], teal: ['#2bb3a3', '#1e9486', '#157468', '#6ad8c8'], purple: ['#8a5ac8', '#7048ac', '#56368a', '#b08ae4'], orange: ['#e88a3a', '#cc702a', '#a4581e', '#f4b070'], gray: ['#7a808c', '#666c78', '#50565e', '#a0a6b0'], brown: ['#a86a3a', '#8e562c', '#704220', '#c89060'], snow: ['#e8f0f8', '#d0dcea', '#b0c0d4', '#ffffff'], black: ['#3a3c48', '#2c2e38', '#1e2028', '#5a5c6a'] };
    const R = pal(roofCols[o.roof] || roofCols.red);
    const O = P('#2a2230');
    const wallC = kind === 'haven' ? pal(['#fafafa', '#e8e8ee', '#ccccd8']) : kind === 'mart' ? pal(['#f4f6fa', '#e0e6f0', '#c4ccdc']) : kind === 'lab' ? pal(['#eef2f6', '#dce4ec', '#bcc8d4']) : kind === 'gym' ? pal(['#e8e0d0', '#d4c8b4', '#b4a68e']) : pal(['#f4e8cc', '#e4d4b0', '#c8b490']);
    // body
    const roofH = kind === 'tower' || kind === 'lighthouse' ? 0 : Math.max(18, Math.floor(h * 16 * .48));
    const bodyTop = E + roofH - 4;
    // shadow
    p.rect(2, H - 3, W - 4, 3, P('#000000'), 50);
    if (kind === 'tower') {
      const g = pal(['#8ab4dc', '#6a94c0', '#4a74a0', '#c8e4ff']);
      p.rect(0, 0, W, H - 2, g[1]);
      for (let y = 4; y < H - 20; y += 8) for (let x = 3; x < W - 3; x += 7) { p.rect(x, y, 5, 6, g[0]); p.rect(x, y, 2, 6, g[3]); p.rect(x, y + 5, 5, 1, g[2]); }
      p.rect(0, 0, W, 3, P('#3a4a64')); p.rect(0, 0, 2, H, P('#3a4a64')); p.rect(W - 2, 0, 2, H, P('#2a3448'));
      p.rect(0, H - 20, W, 18, P('#e8ecf2')); p.rect(0, H - 20, W, 2, P('#b0bccc'));
      const dx = Math.floor(W / 2) - 8; p.rect(dx, H - 18, 16, 16, P('#3a4a64')); p.rect(dx + 1, H - 17, 14, 15, P('#9ad8ff')); p.rect(dx + 7, H - 17, 1, 15, P('#3a4a64'));
      p.rect(dx - 10, H - 30, 36, 8, P('#e8484a')); for (let i = 0; i < 5; i++) p.rect(dx - 7 + i * 7, H - 28, 4, 4, P('#ffffff'));
      p.outline(O); return;
    }
    if (kind === 'lighthouse') {
      const cx = W / 2;
      for (let y = 20; y < H - 2; y++) { const t = (y - 20) / (H - 22); const hw = 7 + t * 9; p.rect(Math.round(cx - hw), y, Math.round(hw * 2), 1, P(Math.floor((y - 20) / 14) % 2 ? '#e84a4a' : '#f4f4f4')); p.set(Math.round(cx - hw), y, P('#ffffff')); p.set(Math.round(cx + hw) - 1, y, P('#b0b0b8')); }
      p.rect(cx - 9, 10, 18, 10, P('#3a3c48')); p.rect(cx - 7, 11, 14, 8, P('#fff2a8')); p.rect(cx - 7, 11, 4, 8, P('#ffffff'));
      p.rect(cx - 10, 8, 20, 2, P('#2a2c36')); p.rect(cx - 6, 3, 12, 5, P('#e84a4a')); p.rect(cx - 2, 0, 4, 3, P('#2a2c36'));
      p.rect(cx - 11, 20, 22, 2, P('#2a2c36'));
      p.rect(cx - 5, H - 16, 10, 14, P('#5a3a20')); p.rect(cx - 4, H - 15, 8, 13, P('#7a5030'));
      p.outline(O); return;
    }
    p.rect(1, bodyTop, W - 2, H - bodyTop - 2, wallC[0]);
    p.rect(1, H - 5, W - 2, 3, wallC[2]); p.rect(1, bodyTop, 2, H - bodyTop - 2, wallC[1]); p.rect(W - 3, bodyTop, 2, H - bodyTop - 2, wallC[2]);
    if (kind === 'house' || kind === 'gym') for (let y = bodyTop + 3; y < H - 5; y += 4) for (let x = 3; x < W - 3; x++) if ((x + y) % 11 === 0) p.set(x, y, wallC[1]);
    // roof
    if (kind === 'haven' || kind === 'mart' || kind === 'lab') {
      // flat modern roof with overhang band
      p.rect(0, E, W, roofH - 2, R[1]); p.rect(0, E, W, 3, R[3]); p.rect(0, E + roofH - 5, W, 3, R[2]);
      for (let x = 2; x < W - 2; x += 6) p.rect(x, E + 4, 3, roofH - 10, R[0]);
      if (kind === 'lab') { p.rect(W - 18, E - 8, 2, 10, P('#8a8e98')); p.circ(W - 17, E - 9, 3, P('#c8ccd8')); p.rect(W - 18, E - 9, 3, 1, P('#e8484a')); }
    } else {
      // gabled shingle roof
      const top = E - (kind === 'gym' ? 4 : 0);
      for (let y = top; y < E + roofH; y++) {
        const t = (y - top) / (roofH + E - top);
        const inset = Math.max(0, Math.round((1 - t) * 3));
        const row = Math.floor((y - top) / 4);
        for (let x = inset; x < W - inset; x++) {
          let c = row % 2 ? R[0] : R[1];
          if ((x + (row % 2) * 3) % 6 === 0) c = R[2];
          if (y === top) c = R[3];
          if ((y - top) % 4 === 3) c = R[2];
          p.set(x, y, c);
        }
      }
      // ridge highlight & eave
      p.rect(0, E + roofH - 3, W, 2, R[2]); p.rect(0, E + roofH - 1, W, 1, P('#000000'), 70);
      if (kind === 'house') { // chimney
        const cx = W - 14; p.rect(cx, E - 6, 6, 12, P('#a86a4a')); p.rect(cx, E - 6, 6, 2, P('#6a4a3a')); p.rect(cx + 1, E - 4, 1, 10, P('#c88a6a'));
      }
    }
    // door
    const dx = (o.door !== undefined ? o.door : Math.floor(w / 2)) * 16;
    if (kind === 'haven' || kind === 'mart' || kind === 'lab') {
      p.rect(dx + 1, H - 20, 14, 18, P('#3a4a64')); p.rect(dx + 2, H - 19, 12, 17, P('#9ad8ff')); p.rect(dx + 7, H - 19, 2, 17, P('#3a4a64')); p.rect(dx + 2, H - 19, 4, 5, P('#e6f6ff'));
      p.rect(dx - 1, H - 22, 18, 2, P('#3a4a64'));
    } else {
      p.rect(dx + 2, H - 19, 12, 17, P('#6a4428')); p.rect(dx + 3, H - 18, 10, 16, P('#8a5a36')); p.rect(dx + 3, H - 18, 10, 1, P('#a8703c'));
      p.rect(dx + 4, H - 16, 3, 6, P('#a8703c')); p.rect(dx + 9, H - 16, 3, 6, P('#a8703c')); p.set(dx + 11, H - 9, P('#ffd84a'));
      p.rect(dx + 1, H - 20, 14, 1, P('#5a3a20'));
    }
    // windows
    const winY = kind === 'gym' ? H - 26 : H - 18;
    const nWin = [];
    for (let tx = 0; tx < w; tx++) if (tx * 16 !== dx && Math.abs(tx * 16 - dx) > 8 && tx > 0 && tx < w - 1 || (w <= 3 && tx !== Math.floor(dx / 16))) nWin.push(tx);
    for (const tx of nWin) {
      const x = tx * 16 + 3;
      if (kind === 'haven' || kind === 'mart' || kind === 'lab') { p.rect(x - 1, winY - 1, 12, 10, P('#3a4a64')); p.rect(x, winY, 10, 8, P('#9ad8ff')); p.rect(x, winY, 3, 3, P('#e6f6ff')); }
      else {
        p.rect(x, winY, 10, 9, P('#5a3a20')); p.rect(x + 1, winY + 1, 8, 7, P('#9ad8ff')); p.rect(x + 1, winY + 1, 3, 2, P('#e6f6ff')); p.rect(x + 4, winY + 1, 1, 7, P('#5a3a20')); p.rect(x + 1, winY + 4, 8, 1, P('#5a3a20'));
        p.rect(x - 1, winY + 9, 12, 2, P('#c89058')); p.set(x + 1, winY + 8, P('#ff6a8a')); p.set(x + 7, winY + 8, P('#ffd84a'));
      }
    }
    // signage
    if (kind === 'haven') {
      const sx = Math.floor(W / 2) - 12; p.rect(sx, E + 3, 24, 10, P('#ffffff')); p.rect(sx, E + 3, 24, 1, P('#e0e0e8'));
      p.rect(sx + 9, E + 4, 6, 8, P('#e8484a')); p.rect(sx + 7, E + 6, 10, 4, P('#e8484a')); p.rect(sx + 10, E + 5, 4, 6, P('#ff8a8a'));
    }
    if (kind === 'mart') {
      const sx = Math.floor(W / 2) - 14; p.rect(sx, E + 3, 28, 10, P('#ffffff'));
      // simple "bag" icon + stripes
      p.rect(sx + 3, E + 6, 6, 5, P('#3a64b4')); p.rect(sx + 4, E + 4, 4, 2, P('#3a64b4')); p.rect(sx + 5, E + 5, 2, 1, P('#ffffff'));
      for (let i = 0; i < 4; i++) p.rect(sx + 11 + i * 4, E + 6, 3, 5, P('#3a64b4'));
    }
    if (kind === 'gym') {
      const sx = Math.floor(W / 2) - 10; p.rect(sx, E + roofH - 2, 20, 8, P('#2a2e38')); p.rect(sx + 1, E + roofH - 1, 18, 6, P(o.accent || '#ffd84a'));
      p.circ(Math.floor(W / 2), E + roofH + 2, 2.5, P('#ffffff'));
      p.rect(0, H - 8, W, 1, P('#8a7a60'));
    }
    p.outline(O);
  }

  // --------------------------------------------------------- icons ------
  function itemIcon(kind, col) {
    return get('icon|' + kind + '|' + col, 16, 16, p => {
      const c = P(col), d = G.col.parse(G.col.dark(col, .35)), l = G.col.parse(G.col.light(col, .45)), O = P('#1e1a24'), W = P('#ffffff');
      switch (kind) {
        case 'potion': p.rect(6, 1, 4, 3, P('#c8ccd8')); p.rect(5, 4, 6, 1, P('#8a8e98')); p.ell(8, 10, 5, 5, c); p.ell(7, 9, 2, 2.5, l); p.rect(4, 11, 8, 2, d); break;
        case 'spray': p.rect(5, 4, 6, 10, c); p.rect(5, 4, 2, 10, l); p.rect(6, 1, 4, 3, P('#c8ccd8')); p.rect(10, 2, 3, 1, P('#8a8e98')); p.rect(5, 9, 6, 2, W); break;
        case 'revive': p.rect(3, 6, 10, 4, c); p.rect(6, 3, 4, 10, c); p.rect(6, 3, 2, 10, l); p.rect(3, 6, 10, 1, l); break;
        case 'bottle': p.rect(6, 1, 4, 3, P('#8a5a34')); p.rect(5, 4, 6, 10, c); p.rect(5, 4, 2, 10, l); p.rect(5, 8, 6, 3, W); break;
        case 'candy': p.ell(8, 8, 4, 3.5, c); p.ell(7, 7, 1.5, 1, W); p.rect(1, 6, 3, 4, d); p.rect(12, 6, 3, 4, d); break;
        case 'vitamin': p.rect(5, 3, 6, 11, c); p.rect(5, 3, 6, 3, W); p.rect(5, 3, 2, 11, l); p.rect(5, 8, 6, 1, d); break;
        case 'orb': p.circ(8, 8, 6, c); for (let y = 8; y < 15; y++) for (let x = 1; x < 15; x++) if ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 36) p.set(x, y, P('#f0f0f4')); p.rect(2, 7, 12, 1, O); p.circ(8, 8, 2, O); p.circ(8, 8, 1.2, W); p.set(5, 4, l); p.set(6, 4, l); break;
        case 'x': p.rect(3, 3, 10, 10, c); p.rect(3, 3, 10, 2, l); p.line(5, 6, 10, 11, W); p.line(10, 6, 5, 11, W); break;
        case 'doll': p.circ(8, 5, 3, c); p.ell(8, 11, 4, 3.5, c); p.set(7, 4, O); p.set(9, 4, O); p.circ(5, 3, 1.3, d); p.circ(11, 3, 1.3, d); break;
        case 'berry': p.circ(8, 9, 5, c); p.circ(6.5, 7.5, 1.6, l); p.rect(7, 2, 2, 3, P('#3a8a3a')); p.rect(9, 2, 3, 2, P('#5ab05a')); break;
        case 'food': p.ell(8, 10, 6, 4, c); p.ell(8, 8, 5, 2.5, l); p.rect(6, 6, 4, 2, P('#6ac04a')); break;
        case 'gem': for (let y = 0; y < 10; y++) { const w = y < 3 ? 2 + y * 2 : 7 - (y - 3); p.rect(8 - w, 3 + y, w * 2, 1, y < 3 ? l : c); } p.set(6, 5, W); break;
        case 'band': p.ell(8, 8, 6, 3.5, c); p.ell(8, 8, 4, 1.8, P('#000000'), 0); for (let y = 6; y <= 10; y++) for (let x = 5; x <= 11; x++) if (((x - 8) / 4) ** 2 + ((y - 8) / 1.8) ** 2 < 1) p.set(x, y, P('#ffffff'), 0); p.rect(3, 6, 10, 1, l); break;
        case 'lens': p.circ(8, 7, 5, P('#3a3c48')); p.circ(8, 7, 3.8, c); p.circ(7, 6, 1.5, W); p.rect(11, 11, 3, 3, P('#3a3c48')); break;
        case 'vest': p.rect(3, 3, 10, 11, c); p.rect(6, 3, 4, 4, P('#000000'), 0); p.rect(7, 3, 2, 3, P('#1e1a24')); p.rect(3, 3, 3, 11, l); break;
        case 'helm': p.ell(8, 9, 6, 5, c); p.rect(2, 10, 12, 3, d); for (let x = 3; x < 14; x += 3) p.set(x, 3 + (x % 2), P('#e0e0e8')); break;
        case 'claw': p.line(4, 12, 7, 3, c); p.line(8, 12, 10, 3, c); p.line(12, 12, 13, 5, c); p.rect(3, 12, 11, 2, d); break;
        case 'bell': p.ell(8, 8, 5, 5, c); p.rect(3, 10, 10, 3, c); p.circ(8, 13, 1.5, d); p.set(6, 5, W); break;
        case 'egg': p.ell(8, 9, 4.5, 5.5, c); p.circ(6, 7, 1.2, P('#e84a4a')); p.circ(10, 10, 1, P('#3a8ae0')); break;
        case 'coin': p.circ(8, 8, 6, c); p.circ(8, 8, 4, d); p.circ(8, 8, 3, c); p.set(6, 5, W); break;
        case 'stone': p.ell(8, 9, 5.5, 5, c); p.ell(7, 7, 2, 1.5, l); p.line(8, 5, 10, 10, d); break;
        case 'cord': for (let t = 0; t < 12; t++) p.set(2 + t, 8 + Math.round(Math.sin(t / 1.8) * 3), c); p.rect(1, 6, 3, 4, P('#e8c040')); p.rect(12, 6, 3, 4, P('#e8c040')); break;
        case 'leaf': p.ell(8, 8, 5, 3, c); p.line(3, 11, 12, 5, d); break;
        case 'capsule': p.ell(8, 8, 6, 3.5, c); for (let y = 4; y < 12; y++) for (let x = 8; x < 15; x++) if (((x - 8) / 6) ** 2 + ((y - 8) / 3.5) ** 2 < 1) p.set(x, y, W); p.set(5, 7, l); break;
        case 'cap': p.circ(8, 8, 6, c); for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2; p.set(8 + Math.cos(an) * 6.5, 8 + Math.sin(an) * 6.5, d); } p.circ(7, 7, 2, l); break;
        case 'rope': p.circ(8, 8, 5, c); p.circ(8, 8, 3, P('#000000'), 0); for (let y = 5; y < 12; y++) for (let x = 5; x < 12; x++) if ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 6) p.set(x, y, P('#000000'), 0); break;
        case 'pearl': p.circ(8, 8, 5, c); p.circ(6.5, 6.5, 1.8, W); break;
        case 'dust': for (let i = 0; i < 9; i++) p.circ(4 + (i * 5) % 9, 5 + (i * 7) % 8, 1.4, i % 2 ? c : l); break;
        case 'fossil': p.ell(8, 9, 6, 5, c); p.line(5, 7, 11, 9, d); p.line(6, 11, 10, 6, d); p.set(8, 8, W); break;
        case 'tm': p.circ(8, 8, 6.5, c); p.circ(8, 8, 4.5, l); p.circ(8, 8, 1.8, P('#1e1a24')); p.rect(8, 2, 5, 3, W); break;
        case 'key': p.circ(5, 6, 3.5, c); p.circ(5, 6, 1.5, P('#1e1a24')); p.rect(8, 5, 7, 2, c); p.rect(12, 7, 2, 3, c); p.rect(10, 7, 1, 2, c); break;
        case 'dex': p.rect(3, 2, 10, 12, c); p.rect(3, 2, 3, 12, d); p.circ(10, 6, 2, P('#6ad0ff')); p.rect(8, 10, 4, 2, l); break;
        case 'book': p.rect(3, 2, 10, 12, c); p.rect(4, 3, 8, 10, l); p.rect(3, 2, 2, 12, d); p.rect(6, 5, 5, 1, d); p.rect(6, 7, 5, 1, d); break;
        case 'bike': p.circ(4, 11, 3, P('#2a2a30')); p.circ(12, 11, 3, P('#2a2a30')); p.circ(4, 11, 1.5, P('#000000'), 0); p.line(4, 11, 8, 6, c); p.line(8, 6, 12, 11, c); p.line(8, 6, 7, 3, c); p.rect(6, 3, 3, 1, P('#2a2a30')); break;
        case 'knife': p.rect(3, 9, 5, 3, P('#6a4428')); p.line(7, 10, 14, 3, P('#d0d4dc')); p.line(7, 9, 13, 3, P('#f0f4f8')); break;
        case 'hammer': p.rect(7, 5, 2, 10, P('#8a5a34')); p.rect(3, 2, 10, 4, c); p.rect(3, 2, 10, 1, l); break;
        case 'boots': p.rect(4, 3, 5, 8, c); p.rect(4, 10, 9, 4, c); p.rect(4, 13, 10, 1, d); p.rect(4, 3, 2, 8, l); break;
        case 'board': p.ell(8, 8, 3.5, 7, c); p.ell(8, 8, 1, 6, W); break;
        case 'whistle': p.ell(9, 9, 5, 4, c); p.rect(1, 7, 6, 3, c); p.circ(10, 8, 1.5, P('#1e1a24')); p.set(8, 6, l); break;
        case 'rod': p.line(2, 14, 13, 2, P('#8a5a34')); p.line(13, 2, 13, 10, P('#e0e0e8')); p.circ(13, 11, 1.2, c); p.circ(5, 11, 1.8, P('#3a3c48')); break;
        case 'share': p.circ(8, 8, 6, c); p.rect(5, 5, 6, 6, W); p.rect(6, 6, 4, 4, c); break;
        case 'charm': for (let i = 0; i < 5; i++) { const an = i / 5 * Math.PI * 2 - Math.PI / 2; p.line(8, 8, 8 + Math.cos(an) * 6, 8 + Math.sin(an) * 6, c); } p.circ(8, 8, 2.5, l); break;
        case 'card': p.rect(2, 4, 12, 9, c); p.rect(2, 6, 12, 2, P('#1e1a24')); p.rect(4, 10, 5, 1, W); break;
        case 'box': p.rect(2, 4, 12, 10, c); p.rect(2, 4, 12, 2, l); p.rect(7, 4, 2, 10, P('#e8484a')); break;
        case 'lantern': p.rect(5, 3, 6, 10, P('#3a3c48')); p.rect(6, 4, 4, 8, c); p.rect(6, 4, 2, 3, W); p.rect(7, 1, 2, 2, P('#3a3c48')); break;
        default: p.circ(8, 8, 5, c);
      }
      p.outline(O);
    });
  }
  return {
    get, cache, THEMES, th, tableJoin, grass, flowers, tallgrass, path, water, simple, tree, smallTree, rock, fence, hedge, ledge, cliff, lamp, crystal, wall, furniture, building, itemIcon,
  };
})();
