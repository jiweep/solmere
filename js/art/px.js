'use strict';
// ============================================================================
//  Pixel-art toolkit: an ImageData painter with hue-shifted colour ramps,
//  volume shading (lit spheres/cylinders/boxes from a top-left key light),
//  selective outlines and cheap hash noise. Every sprite and tile in the game
//  is painted with these helpers.
// ============================================================================
G.LIGHT = (() => { const l = [-.52, -.68, .52], n = Math.hypot(...l); return l.map(v => v / n); })();

// ---------------------------------------------------------------- hashing --
G.h2 = function (x, y, s = 0) {   // integer hash -> [0,1)
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
// smooth value noise on the integer lattice (fast, deterministic)
G.vnoise = function (x, y, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = G.h2(xi, yi, s), b = G.h2(xi + 1, yi, s), c = G.h2(xi, yi + 1, s), d = G.h2(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
};
G.fbm = function (x, y, s = 0, oct = 3) { let a = 0, amp = .5, f = 1, n = 0; for (let i = 0; i < oct; i++) { a += amp * G.vnoise(x * f, y * f, s + i * 17); n += amp; amp *= .5; f *= 2.03; } return a / n; };

// ------------------------------------------------------------------ ramps --
// A ramp is an array of [r,g,b] from darkest to lightest. rampFrom() builds a
// hue-shifted ramp around a base colour: shadows cool toward blue-violet,
// highlights warm toward yellow, the way pixel artists shade by hand.
G.ramp = (list) => list.map(c => G.col.parse(c));
G.rampFrom = function (base, n = 5, o = {}) {
  const [h, s, l] = G.col.toHsl(base);
  const lo = o.lo !== undefined ? o.lo : .30, hi = o.hi !== undefined ? o.hi : .22, shift = o.shift !== undefined ? o.shift : 18;
  const out = [];
  const mid = o.mid !== undefined ? o.mid : Math.floor((n - 1) * .6);
  for (let i = 0; i < n; i++) {
    const t = i < mid ? -(mid - i) / mid : i > mid ? (i - mid) / (n - 1 - mid) : 0;
    let hh = h, ss = s, ll = l;
    if (t < 0) {   // shadow: darker, cooler, a little more saturated
      const cool = ((240 - h + 540) % 360) - 180; hh = h + G.clamp(cool, -shift, shift) * -t;
      ll = l - lo * -t; ss = Math.min(1, s * (1 + .15 * -t));
    } else if (t > 0) {   // light: brighter, warmer, slightly less saturated
      const warm = ((55 - h + 540) % 360) - 180; hh = h + G.clamp(warm, -shift, shift) * t * .8;
      ll = l + hi * t; ss = s * (1 - .18 * t);
    }
    out.push(G.col.parse(G.col.fromHsl(hh, G.clamp(ss, 0, 1), G.clamp(ll, .02, .97))));
  }
  return out;
};
G.rgb = c => G.col.parse(c);
G.mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
G.darkc = (a, t) => [a[0] * (1 - t), a[1] * (1 - t), a[2] * (1 - t)];

// ---------------------------------------------------------------- painter --
G.Painter = class {
  constructor(w, h) {
    this.w = w; this.h = h; this.cv = G.makeCanvas(w, h); this.c = this.cv.getContext('2d');
    this.id = this.c.createImageData(w, h); this.d = this.id.data;
    this.tag = null;   // optional per-pixel tag layer (Uint8Array) for masks
  }
  in(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  set(x, y, col, a = 255) {
    x |= 0; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4, d = this.d;
    if (a >= 255) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = 255; }
    else if (d[i + 3] === 0) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = a; }
    else { const k = a / 255; d[i] = d[i] * (1 - k) + col[0] * k; d[i + 1] = d[i + 1] * (1 - k) + col[1] * k; d[i + 2] = d[i + 2] * (1 - k) + col[2] * k; d[i + 3] = Math.max(d[i + 3], a); }
  }
  // darken/lighten an existing opaque pixel
  shade(x, y, k) {
    x |= 0; y |= 0; if (!this.in(x, y)) return; const i = (y * this.w + x) * 4, d = this.d; if (!d[i + 3]) return;
    if (k < 0) { d[i] *= 1 + k; d[i + 1] *= 1 + k; d[i + 2] *= 1 + k * .85; }
    else { d[i] += (255 - d[i]) * k; d[i + 1] += (255 - d[i + 1]) * k; d[i + 2] += (235 - d[i + 2]) * k * .9; }
  }
  tint(x, y, col, t) { x |= 0; y |= 0; if (!this.in(x, y)) return; const i = (y * this.w + x) * 4, d = this.d; if (!d[i + 3]) return; d[i] += (col[0] - d[i]) * t; d[i + 1] += (col[1] - d[i + 1]) * t; d[i + 2] += (col[2] - d[i + 2]) * t; }
  get(x, y) { if (!this.in(x | 0, y | 0)) return [0, 0, 0, 0]; const i = ((y | 0) * this.w + (x | 0)) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2], this.d[i + 3]]; }
  A(x, y) { return this.in(x | 0, y | 0) ? this.d[((y | 0) * this.w + (x | 0)) * 4 + 3] : 0; }
  clear(x, y) { if (this.in(x, y)) this.d[(y * this.w + x) * 4 + 3] = 0; }
  rect(x, y, w, h, col, a) { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) this.set(i, j, col, a); }
  fill(col) { this.rect(0, 0, this.w, this.h, col); }
  hline(x0, x1, y, col, a) { for (let x = x0; x <= x1; x++) this.set(x, y, col, a); }
  vline(x, y0, y1, col, a) { for (let y = y0; y <= y1; y++) this.set(x, y, col, a); }
  circ(cx, cy, r, col, a) { for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) if ((x - cx + .5) ** 2 + (y - cy + .5) ** 2 <= r * r) this.set(x, y, col, a); }
  ell(cx, cy, rx, ry, col, a) { for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) if (((x - cx + .5) / rx) ** 2 + ((y - cy + .5) / ry) ** 2 <= 1) this.set(x, y, col, a); }
  line(x0, y0, x1, y1, col, a) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    for (; ;) { this.set(x0, y0, col, a); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  poly(pts, col, a) {   // even-odd scanline fill
    let y0 = 1e9, y1 = -1e9; for (const p of pts) { y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
    for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
      const yc = y + .5, xs = [];
      for (let i = 0; i < pts.length; i++) { const a0 = pts[i], b0 = pts[(i + 1) % pts.length]; if ((a0[1] <= yc) !== (b0[1] <= yc)) xs.push(a0[0] + (yc - a0[1]) / (b0[1] - a0[1]) * (b0[0] - a0[0])); }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, col, a);
    }
  }
  // lit ellipsoid: each pixel's normal is dotted with the key light and
  // quantized onto the ramp. o.bias shifts brightness, o.flatten squashes z,
  // o.test(x,y) can reject pixels, o.rim adds a cool reflected light on the
  // shadow edge.
  sphere(cx, cy, rx, ry, ramp, o = {}) {
    const L = o.light || G.LIGHT, n = ramp.length, bias = o.bias || 0, fz = o.flatten || 1;
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d2 = nx * nx + ny * ny;
      if (d2 > 1) continue;
      if (o.test && !o.test(x, y)) continue;
      const nz = Math.sqrt(1 - d2) * fz;
      let I = nx * L[0] + ny * L[1] + nz * L[2];
      I = I * .5 + .5 + bias;
      if (o.jitter) I += (G.h2(x, y, o.seed || 3) - .5) * o.jitter;
      let k = Math.floor(G.clamp(I, 0, .999) * n);
      if (o.rim && d2 > .72 && nx > .2 && ny > -.2) k = Math.min(n - 1, k + 1);
      this.set(x, y, ramp[k], o.a);
    }
  }
  // vertical cylinder (posts, trunks, barrels): shading varies across x only
  cyl(x, y, w, h, ramp, o = {}) {
    const n = ramp.length;
    for (let i = 0; i < w; i++) {
      const u = (i + .5) / w * 2 - 1, nz = Math.sqrt(Math.max(0, 1 - u * u));
      const I = G.clamp((u * G.LIGHT[0] + nz * G.LIGHT[2]) * .5 + .5 + (o.bias || 0), 0, .999);
      for (let j = 0; j < h; j++) this.set(x + i, y + j, ramp[Math.floor(I * n)]);
    }
  }
  // outline every transparent pixel that touches an opaque one (4-neighbourhood)
  outline(col, o = {}) {
    const W = this.w, H = this.h, src = new Uint8ClampedArray(this.d), d = this.d;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4; if (src[i + 3] > 40) continue;
      let n = -1;
      if (x > 0 && src[i - 1] > 40) n = i - 4; else if (x < W - 1 && src[i + 7] > 40) n = i + 4;
      else if (y > 0 && src[i - W * 4 + 3] > 40) n = i - W * 4; else if (y < H - 1 && src[i + W * 4 + 3] > 40) n = i + W * 4;
      if (n < 0) continue;
      if (col) { d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; }
      else {   // selective outline: a deep, cool version of the neighbouring colour
        const k = o.k || .32;
        d[i] = src[n] * k + 10; d[i + 1] = src[n + 1] * k + 8; d[i + 2] = src[n + 2] * (k + .08) + 22;
      }
      d[i + 3] = 255;
    }
  }
  // darken opaque pixels along the lower/right silhouette (core shadow) and
  // lighten the upper/left rim; used after flat fills to add volume
  rimLight(up = .18, down = -.16) {
    const W = this.w, H = this.h, a = new Uint8Array(W * H);
    for (let p = 0; p < W * H; p++) a[p] = this.d[p * 4 + 3] > 40 ? 1 : 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const p = y * W + x; if (!a[p]) continue;
      const U = y > 0 ? a[p - W] : 0, Lf = x > 0 ? a[p - 1] : 0, D = y < H - 1 ? a[p + W] : 0, R = x < W - 1 ? a[p + 1] : 0;
      if (!U || !Lf) this.shade(x, y, up); else if (!D || !R) this.shade(x, y, down);
    }
  }
  // copy another painter/canvas-like pixel source in (with optional flip)
  blit(src, ox, oy, o = {}) {
    for (let y = 0; y < src.h; y++) for (let x = 0; x < src.w; x++) {
      const i = (y * src.w + x) * 4; if (!src.d[i + 3]) continue;
      this.set(ox + (o.flip ? src.w - 1 - x : x), oy + y, [src.d[i], src.d[i + 1], src.d[i + 2]], src.d[i + 3]);
    }
  }
  done() { this.c.putImageData(this.id, 0, 0); return this.cv; }
};

// flattened drop-shadow silhouette of a sprite: used for baked cast shadows
G.shadowOf = (function () {
  const cache = new WeakMap();
  return function (img) {
    let s = cache.get(img); if (s) return s;
    const cv = G.makeCanvas(img.width, img.height), c = cv.getContext('2d');
    c.drawImage(img, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = '#0a0c24'; c.fillRect(0, 0, cv.width, cv.height);
    cache.set(img, cv); return cv;
  };
})();
