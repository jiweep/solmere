'use strict';
// ============================================================================
//  SOLMERE — core utilities, RNG, math, color, timing, async helpers
// ============================================================================
var G = globalThis.G || (globalThis.G = {});
G.W = 384; G.H = 216; G.T = 16;
G.VERSION = '1.0.0';
G.frame = 0;          // update ticks since boot
G.time = 0;           // seconds (game-time, affected by turbo)
G.realTime = 0;

// ---------------------------------------------------------------- math ----
G.clamp = (v, a, b) => v < a ? a : v > b ? b : v;
G.lerp = (a, b, t) => a + (b - a) * t;
G.inv = (a, b, v) => (v - a) / (b - a);
G.sign = v => v < 0 ? -1 : v > 0 ? 1 : 0;
G.dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
G.ease = {
  linear: t => t,
  inQuad: t => t * t,
  outQuad: t => t * (2 - t),
  inOut: t => t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  outCubic: t => (--t) * t * t + 1,
  inCubic: t => t * t * t,
  outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
  outElastic: t => t === 0 || t === 1 ? t : Math.pow(2, -10 * t) * Math.sin((t * 10 - .75) * (2 * Math.PI) / 3) + 1,
  outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; },
  sine: t => -(Math.cos(Math.PI * t) - 1) / 2,
};

// ---------------------------------------------------------------- RNG -----
G.hash = function (str) {
  let h = 2166136261 >>> 0;
  str = String(str);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
};
G.RNG = class {
  constructor(seed) { this.s = (typeof seed === 'string' ? G.hash(seed) : (seed >>> 0)) || 1; }
  next() { let t = this.s += 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  int(a, b) { return a + Math.floor(this.next() * (b - a + 1)); }
  range(a, b) { return a + this.next() * (b - a); }
  pick(arr) { return arr[Math.floor(this.next() * arr.length)]; }
  chance(p) { return this.next() < p; }
  shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(this.next() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
};
G.rng = new G.RNG((Date.now() ^ (Math.random() * 1e9)) >>> 0);
G.rand = () => G.rng.next();
G.randInt = (a, b) => G.rng.int(a, b);
G.pick = arr => G.rng.pick(arr);
G.chance = p => G.rng.next() < p;
G.shuffle = arr => G.rng.shuffle(arr);
G.uid = () => (Date.now().toString(36) + Math.floor(Math.random() * 1e9).toString(36)).slice(-12);

// value noise (seeded, for textures)
G.noise2 = function (x, y, seed = 0) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
};
G.smoothNoise = function (x, y, seed = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const s = t => t * t * (3 - 2 * t);
  const a = G.noise2(xi, yi, seed), b = G.noise2(xi + 1, yi, seed), c = G.noise2(xi, yi + 1, seed), d = G.noise2(xi + 1, yi + 1, seed);
  return G.lerp(G.lerp(a, b, s(xf)), G.lerp(c, d, s(xf)), s(yf));
};

// --------------------------------------------------------------- color ----
G.col = {
  parse(c) {
    if (Array.isArray(c)) return c;
    if (c[0] === '#') {
      if (c.length === 4) return [parseInt(c[1] + c[1], 16), parseInt(c[2] + c[2], 16), parseInt(c[3] + c[3], 16), 255];
      return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16), c.length > 7 ? parseInt(c.slice(7, 9), 16) : 255];
    }
    const m = c.match(/[\d.]+/g); return [+m[0], +m[1], +m[2], m[3] !== undefined ? Math.round(+m[3] * 255) : 255];
  },
  hex(r, g, b) { if (Array.isArray(r)) [r, g, b] = r; const h = v => G.clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0'); return '#' + h(r) + h(g) + h(b); },
  mix(a, b, t) { a = G.col.parse(a); b = G.col.parse(b); return G.col.hex(G.lerp(a[0], b[0], t), G.lerp(a[1], b[1], t), G.lerp(a[2], b[2], t)); },
  light(c, t) { return G.col.mix(c, '#ffffff', t); },
  dark(c, t) { return G.col.mix(c, '#000000', t); },
  rgba(c, a) { c = G.col.parse(c); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; },
  toHsl(c) {
    let [r, g, b] = G.col.parse(c); r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let h, s, l = (mx + mn) / 2;
    if (mx === mn) { h = s = 0; } else {
      const d = mx - mn; s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6;
    }
    return [h * 360, s, l];
  },
  fromHsl(h, s, l) {
    h = ((h % 360) + 360) % 360 / 360;
    let r, g, b;
    if (s === 0) r = g = b = l; else {
      const f = (p, q, t) => { if (t < 0) t += 1; if (t > 1) t -= 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; };
      const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
      r = f(p, q, h + 1 / 3); g = f(p, q, h); b = f(p, q, h - 1 / 3);
    }
    return G.col.hex(r * 255, g * 255, b * 255);
  },
  hue(c, deg, sMul = 1, lAdd = 0) { const [h, s, l] = G.col.toHsl(c); return G.col.fromHsl(h + deg, G.clamp(s * sMul, 0, 1), G.clamp(l + lAdd, 0, 1)); },
};

// ------------------------------------------------------- timers / async ---
G._timers = [];
G.wait = function (frames) {
  return new Promise(res => { G._timers.push({ t: Math.max(0, Math.round(frames)), res }); });
};
G.waitSec = s => G.wait(s * 60);
G.nextFrame = () => G.wait(1);
G._tweens = [];
G.tween = function (obj, props, frames, ease = G.ease.outQuad) {
  return new Promise(res => {
    const from = {}; for (const k in props) from[k] = obj[k];
    G._tweens.push({ obj, from, to: props, t: 0, n: Math.max(1, frames), ease, res });
  });
};
G.updateTimers = function () {
  for (let i = G._timers.length - 1; i >= 0; i--) {
    const tm = G._timers[i];
    if (tm.t-- <= 0) { G._timers.splice(i, 1); tm.res(); }
  }
  for (let i = G._tweens.length - 1; i >= 0; i--) {
    const tw = G._tweens[i]; tw.t++;
    const k = tw.ease(Math.min(1, tw.t / tw.n));
    for (const p in tw.to) tw.obj[p] = G.lerp(tw.from[p], tw.to[p], k);
    if (tw.t >= tw.n) { G._tweens.splice(i, 1); tw.res(); }
  }
};

// ----------------------------------------------------------- text utils ---
G.cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
G.plural = (n, word) => n === 1 ? word : word + 's';
G.fmtTime = function (sec) {
  sec = Math.floor(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec / 60) % 60;
  return h + ':' + String(m).padStart(2, '0');
};
G.deepCopy = o => JSON.parse(JSON.stringify(o));
G.DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
G.OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
G.dirFrom = (dx, dy) => Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');

G.log = (...a) => { if (G.DEBUG_LOG) console.log('[SOL]', ...a); };
