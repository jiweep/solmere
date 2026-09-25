'use strict';
// ============================================================================
//  HD battle backdrops. A painted, layered landscape at twice the old art
//  density (768x432 art pixels), upscaled crisply to the screen: sky glow and
//  layered clouds, hazy mountain ridges, a lake or sea with shimmer and far
//  lights, a conifer forest band, a rocky cliff, a meadow with a dirt clearing
//  where the mons stand, and dark foreground foliage. Hand-made images in
//  img/battle/<env>_<phase>.png (e.g. from the art prompts) replace these when
//  present. Cached per environment + time of day.
// ============================================================================
(function () {
  const AW = 768, AH = 432;
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const shade = (a, k) => k >= 0 ? mix(a, [255, 255, 255], k) : mix(a, [0, 0, 0], -k);
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => v / 16 - .5);

  class Canvas2 {
    constructor() { this.d = new Uint8ClampedArray(AW * AH * 4); }
    set(x, y, c, a = 1) {
      x |= 0; y |= 0; if (x < 0 || y < 0 || x >= AW || y >= AH) return;
      const i = (y * AW + x) * 4, d = this.d;
      if (a >= 1) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
      d[i] += (c[0] - d[i]) * a; d[i + 1] += (c[1] - d[i + 1]) * a; d[i + 2] += (c[2] - d[i + 2]) * a; d[i + 3] = 255;
    }
    get(x, y) { x = G.clamp(x | 0, 0, AW - 1); y = G.clamp(y | 0, 0, AH - 1); const i = (y * AW + x) * 4; return [this.d[i], this.d[i + 1], this.d[i + 2]]; }
    // quantised to a small palette step with ordered dither: keeps the painted look pixel-crisp
    q(x, y, c, levels = 24) {
      const b = BAYER[(y & 3) * 4 + (x & 3)], s = 255 / levels;
      this.set(x, y, [Math.round(c[0] / s + b) * s, Math.round(c[1] / s + b) * s, Math.round(c[2] / s + b) * s]);
    }
    canvas() { const cv = G.makeCanvas(AW, AH); cv.getContext('2d').putImageData(new ImageData(this.d, AW, AH), 0, 0); return cv; }
  }

  // ----------------------------------------------------------- palettes
  const PH = {
    day: { skyT: '#3f7fd6', skyB: '#bfe2fa', glow: '#fff4d6', cloud: '#ffffff', cloudS: '#b7c9e6', haze: '#a8cbe8', light: .0, sun: [590, 70], stars: 0 },
    dusk: { skyT: '#2a2a6a', skyB: '#ff9a62', glow: '#ffcf8a', cloud: '#ffb48a', cloudS: '#7a4a7a', haze: '#b06a78', light: .35, sun: [520, 150], stars: .35 },
    night: { skyT: '#070b24', skyB: '#1e2e62', glow: '#3a4a8a', cloud: '#3a4676', cloudS: '#1a2046', haze: '#223060', light: 1, moon: [600, 64], stars: 1 },
  };
  const ENV = {
    grass: { lake: true, forest: true, cliff: true, fence: true, ground: ['#3f8f3a', '#63b24c'], dirt: ['#b08a5a', '#cfaa74'], mtn: ['#5e7fa6', '#7aa0c0'] },
    dusk: { lake: true, forest: true, cliff: false, fence: true, mist: true, ground: ['#3c6f55', '#5d9270'], dirt: ['#8c7a6a', '#a8927c'], mtn: ['#4d4a78', '#6a6594'] },
    forest: { forest: true, dense: true, cliff: true, shafts: true, ground: ['#2f6a34', '#4c8c3e'], dirt: ['#8a6a44', '#a8845a'], mtn: ['#46705e', '#5e8a70'] },
    beach: { sea: true, palms: true, ground: ['#d9bd84', '#f0d9a4'], dirt: ['#c8a870', '#dcc088'], mtn: ['#6f9ec8', '#8cb6dc'] },
    water: { sea: true, onWater: true, ground: ['#2c6fc0', '#4a8fdc'], dirt: ['#3a80d0', '#5aa0e6'], mtn: ['#6f9ec8', '#8cb6dc'] },
    snow: { forest: true, snowy: true, cliff: true, ground: ['#c9d8ea', '#eef4fb'], dirt: ['#aebfd6', '#cad8ea'], mtn: ['#8ea6c6', '#d6e2f0'] },
    volcano: { volcano: true, ground: ['#4a3530', '#6a4b40'], dirt: ['#3a2a26', '#54403a'], mtn: ['#3a2a2c', '#56403e'] },
    city: { city: true, lake: true, ground: ['#8b90a0', '#a9aebb'], dirt: ['#9ca0ac', '#bcc0ca'], mtn: ['#7486a6', '#94a6c2'] },
  };
  G.BATTLE_HD_ENVS = Object.keys(ENV);

  // ----------------------------------------------------------- layers
  function skyLayer(p, P, hz, rng) {
    const T = hex(P.skyT), B = hex(P.skyB), Gl = hex(P.glow);
    const [gx, gy] = P.sun || P.moon || [384, hz];
    for (let y = 0; y < hz + 40; y++) {
      const t = Math.pow(y / (hz + 40), 1.25);
      for (let x = 0; x < AW; x++) {
        let c = mix(T, B, t);
        const d = Math.hypot((x - gx) / 1.6, y - gy) / 420;
        c = mix(c, Gl, Math.max(0, .55 - d) * (P.sun ? 1 : .5));
        p.q(x, y, c, 28);
      }
    }
    if (P.stars) for (let i = 0; i < 420 * P.stars; i++) {
      const x = rng.int(0, AW - 1), y = rng.int(0, hz - 30), b = rng.next();
      p.set(x, y, b > .85 ? [255, 255, 255] : [190, 205, 245], .45 + b * .55 * P.stars);
      if (b > .97) { p.set(x - 1, y, [160, 180, 235], .5); p.set(x + 1, y, [160, 180, 235], .5); p.set(x, y - 1, [160, 180, 235], .5); p.set(x, y + 1, [160, 180, 235], .5); }
    }
    if (P.sun) { const [sx, sy] = P.sun; for (let r = 30; r >= 0; r--) { const k = 1 - r / 30; for (let a = 0; a < 360; a += 1.2) { const x = sx + Math.cos(a / 57.3) * r, y = sy + Math.sin(a / 57.3) * r * .95; p.set(x, y, mix(Gl, [255, 255, 250], k), r < 14 ? 1 : .08); } } }
    if (P.moon) { const [mx, my] = P.moon; for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) { const d = Math.hypot(x, y); if (d > 16) continue; const cut = Math.hypot(x - 6, y + 4) < 14; if (!cut) p.set(mx + x, my + y, d > 14 ? [220, 214, 190] : [248, 242, 220]); } for (let r = 16; r < 60; r++) for (let a = 0; a < 360; a += 3) p.set(mx + Math.cos(a / 57.3) * r, my + Math.sin(a / 57.3) * r, [120, 140, 220], .012); }
  }
  function cloud(p, cx, cy, w, h, C, S, rng, alpha = 1) {
    // a flattened stack of puffs: lit tops, a shaded belly, a flat base
    const n = Math.max(3, Math.round(w / 22));
    const puffs = [];
    for (let i = 0; i < n; i++) { const u = (i + .5) / n; puffs.push([cx - w / 2 + u * w + rng.range(-6, 6), cy - Math.sin(u * Math.PI) * h * .55 - rng.range(0, h * .2), h * rng.range(.45, .8)]); }
    for (const [px, py, r] of puffs) for (let y = Math.floor(py - r); y <= cy; y++) for (let x = Math.floor(px - r * 1.35); x <= px + r * 1.35; x++) {
      const dx = (x - px) / 1.35, dy = y - py, d = Math.hypot(dx, dy);
      if (d > r) continue;
      const lit = (-dx * .35 - dy) / r;       // light from above-left
      const base = (y - (cy - h * .25)) / (h * .25);
      let c = lit > .45 ? C : lit > -.1 ? mix(C, S, .35) : mix(C, S, .7);
      if (base > 0) c = mix(c, S, Math.min(1, base) * .8);
      p.set(x, y, c, alpha);
    }
  }
  function cloudLayer(p, P, hz, rng) {
    const C = hex(P.cloud), S = hex(P.cloudS);
    for (let i = 0; i < 9; i++) {
      const y = rng.int(40, hz - 70), w = rng.int(90, 220) * (1 - y / hz * .4), h = w * rng.range(.18, .28);
      cloud(p, rng.int(-40, AW + 40), y, w, h, C, S, rng, P.moon ? .7 : 1);
    }
    for (let i = 0; i < 6; i++) {            // long thin streaks low in the sky
      const y = rng.int(hz - 70, hz - 26), x0 = rng.int(-60, AW), L = rng.int(120, 260);
      for (let x = x0; x < x0 + L; x++) { const t = (x - x0) / L, th = Math.sin(t * Math.PI) * 3; for (let yy = -th; yy <= th; yy++) p.set(x, y + yy, mix(hex(P.cloud), hex(P.haze), .35), .55); }
    }
  }
  function ridge(p, base, amp, freq, seed, col, top, haze, hazeK) {
    for (let x = 0; x < AW; x++) {
      const h = G.fbm(x / freq, seed, seed, 4) * amp + (G.fbm(x / (freq / 5), seed + 3, seed, 2) - .5) * amp * .25;
      const y0 = Math.round(base - h), yN = Math.round(base - G.fbm((x + 1) / freq, seed, seed, 4) * amp);
      for (let y = y0; y < base + 60; y++) {
        let c = col;
        if (y - y0 < 2) c = top; else if (yN > y0) c = shade(col, -.12);
        c = mix(c, haze, hazeK * Math.min(1, (y - y0) / 60 + .4));
        p.q(x, y, c, 30);
      }
    }
  }
  function waterBand(p, P, E, y0, y1, rng) {
    const T = hex(P.skyB), W0 = mix(hex(P.skyB), hex('#2a5e9e'), P.moon ? .3 : .55), W1 = mix(hex(P.skyT), hex('#16407a'), .5);
    for (let y = y0; y < y1; y++) {
      const t = (y - y0) / Math.max(1, y1 - y0);
      for (let x = 0; x < AW; x++) {
        let c = mix(W0, W1, t);
        if (G.h2(x >> 2, y, 7) > .93 - t * .05) c = mix(c, T, .6);          // glints
        p.q(x, y, c, 28);
      }
    }
    // the sun / moon's path on the water
    const src = P.sun || P.moon;
    if (src) for (let y = y0 + 1; y < y1; y += 2) { const w = 10 + (y - y0) * .9; for (let x = src[0] - w; x < src[0] + w; x += 1) if (G.h2(x >> 1, y, 3) > .55) p.set(x, y, hex(P.glow), .5); }
    // far shore with village lights at dusk / night
    for (let x = 0; x < AW; x++) { const h = 3 + G.fbm(x / 40, 11, 2, 3) * 8; for (let y = y0 - h; y < y0 + 1; y++) p.q(x, y, mix(hex(P.haze), hex('#1c3a38'), .55), 30); }
    if (P.light > .2) for (let i = 0; i < 36; i++) {
      const x = rng.int(20, AW - 20), y = y0 - rng.int(1, 6);
      p.set(x, y, [255, 214, 140]); p.set(x + 1, y, [255, 190, 110], .7);
      for (let k = 2; k < 14; k += 2) p.set(x, y0 + k, [255, 200, 120], .45 - k * .03);
    }
  }
  function pine(p, cx, base, h, C, snowy) {
    const tiers = Math.max(3, Math.round(h / 14));
    for (let y = base - h; y < base; y++) {
      const t = (y - (base - h)) / h, tier = (t * tiers) % 1, hw = (t * .42 + tier * .22) * h * .45;
      for (let x = Math.floor(cx - hw); x <= cx + hw; x++) {
        const u = (x - cx) / Math.max(1, hw);
        let c = u < -.35 ? C[2] : u < .25 ? C[1] : C[0];
        if (tier > .82) c = C[0];
        if (snowy && tier < .3 && u > -.8) c = [238, 244, 250];
        p.set(x, y, c);
      }
    }
    for (let y = base - 3; y < base + 2; y++) p.set(cx, y, [60, 40, 30]);
  }
  function forestBand(p, E, P, base, rng, dense) {
    const dark = P.light > .9;
    const C = dark ? [hex('#0c1a1e'), hex('#132826'), hex('#1b3530')] : P.light > .2 ? [hex('#1f3a3a'), hex('#2c4f44'), hex('#3e6650')] : [hex('#1d4d33'), hex('#2d6a40'), hex('#44894e')];
    const haze = hex(P.haze);
    const rows = dense ? 3 : 2;
    for (let r = 0; r < rows; r++) {
      const hk = (rows - 1 - r) * .28;
      const Cr = C.map(c => mix(c, haze, hk));
      let x = -20 + rng.int(0, 12);
      while (x < AW + 20) {
        const h = rng.int(38, 70) * (dense ? 1.35 : 1) * (1 - r * .12) * (1 + r * .08);
        if (!(E.lake && !dense && x > 250 && x < 520 && r === rows - 1 && rng.next() < .75)) pine(p, x, base + r * 10, h, Cr, E.snowy);
        x += rng.int(9, 20) * (dense ? .8 : 1);
      }
    }
  }
  function cliff(p, P, x0, x1, top, bottom, rng) {
    const R = P.light > .9 ? [hex('#2a2a3a'), hex('#3a3a4c'), hex('#4a4a60')] : [hex('#6a5646'), hex('#86705a'), hex('#a08a70')];
    const grass = P.light > .9 ? hex('#1c3a2c') : hex('#4c8e3e');
    for (let x = x0; x < x1; x++) {
      const t = (x - x0) / (x1 - x0), tp = top + Math.round(Math.pow(t, 2.2) * (bottom - top) + (G.fbm(x / 30, 5, 5, 2) - .5) * 14);
      for (let y = tp; y < bottom; y++) {
        // faceted rock: jittered cells lit from the upper left, dark cracks where cells meet
        const cw = 26, ch = 15, gx0 = Math.floor(x / cw), gy0 = Math.floor(y / ch);
        let f1 = 1e9, f2 = 1e9, lx = 0, ly = 0, id = 0;
        for (let j = -1; j <= 1; j++) for (let i2 = -1; i2 <= 1; i2++) {
          const X = gx0 + i2, Y = gy0 + j, px = (X + .2 + G.h2(X, Y, 31) * .6) * cw, py = (Y + .2 + G.h2(X, Y, 37) * .6) * ch;
          const dx = (x - px) / cw, dy = (y - py) / ch, d = dx * dx + dy * dy;
          if (d < f1) { f2 = f1; f1 = d; lx = dx; ly = dy; id = G.h2(X, Y, 41); } else if (d < f2) f2 = d;
        }
        const edge = Math.sqrt(f2) - Math.sqrt(f1), I = .2 - lx * .9 - ly * 1.1 + (id - .5) * .5;
        let c = edge < .06 ? shade(R[0], -.35) : R[I > .35 ? 2 : I > -.15 ? 1 : 0];
        if (edge < .12 && edge >= .06) c = shade(c, -.12);
        if (y - tp < 8) c = grass;
        else if (y - tp < 11) c = shade(grass, -.3);
        p.q(x, y, mix(c, hex(P.haze), .1), 30);
      }
    }
  }
  function volcanoLayer(p, P, hz, rng) {
    const cx = 520;
    for (let y = 120; y < hz + 10; y++) { const hw = (y - 120) * 1.3 + 22; for (let x = cx - hw; x < cx + hw; x++) { const lit = x < cx - hw * .2; p.q(x, y, lit ? [96, 70, 62] : [66, 46, 44], 28); } }
    for (let y = 120; y < 136; y++) for (let x = cx - 22; x < cx + 22; x++) if (G.h2(x >> 1, y >> 1, 4) > .45) p.set(x, y, y < 126 ? [255, 214, 120] : [255, 120, 50]);
    for (let i = 0; i < 70; i++) { const y = 118 - i * 1.4, x = cx + Math.sin(i * .25) * (6 + i * .5); for (let a = 0; a < 360; a += 12) { const r = 5 + i * .22; p.set(x + Math.cos(a / 57) * r, y + Math.sin(a / 57) * r, P.light > .9 ? [60, 50, 60] : [140, 124, 120], .35); } }
    for (let y = 136; y < hz; y++) { const x = cx - 8 + Math.round(Math.sin(y * .12) * 3 + (y - 136) * .35); p.set(x, y, [255, 140, 60]); p.set(x + 1, y, [255, 200, 110]); }
  }
  function cityLayer(p, P, base, rng) {
    const dark = P.light > .5;
    for (let i = 0; i < 26; i++) {
      const x = i * 32 + rng.int(-8, 8) - 10, w = rng.int(22, 40), h = rng.int(50, 150), top = base - h;
      const B = dark ? [hex('#141a2e'), hex('#1e2640'), hex('#283254')] : [hex('#7c8eaa'), hex('#98aac4'), hex('#b8c8dc')];
      for (let y = top; y < base; y++) for (let xx = x; xx < x + w; xx++) p.q(xx, y, mix(B[xx < x + 4 ? 2 : xx > x + w - 5 ? 0 : 1], hex(P.haze), .25), 30);
      for (let wy = top + 6; wy < base - 6; wy += 8) for (let wx = x + 4; wx < x + w - 5; wx += 6) {
        const lit = dark ? G.h2(wx, wy, 3) > .45 : true;
        for (let yy = 0; yy < 4; yy++) for (let xx = 0; xx < 3; xx++) p.set(wx + xx, wy + yy, lit ? (dark ? [255, 214, 138] : [214, 232, 250]) : B[0]);
      }
    }
  }
  function ground(p, E, P, hz, rng) {
    const dark = P.light > .9, lt = dark ? -.55 : P.light > .2 ? -.15 : 0;
    const g0 = shade(hex(E.ground[0]), lt), g1 = shade(hex(E.ground[1]), lt);
    const d0 = shade(hex(E.dirt[0]), lt), d1 = shade(hex(E.dirt[1]), lt);
    const warm = P.light > .2 && !dark ? hex('#ff9a62') : null;
    for (let y = hz; y < AH; y++) {
      const t = (y - hz) / (AH - hz);
      for (let x = 0; x < AW; x++) {
        let c = mix(g0, g1, Math.min(1, t * 1.4));
        if (warm) c = mix(c, warm, .1 * (1 - t));
        // texture: blade strokes grow with nearness
        const s = 1 + Math.floor(t * 4), hsh = G.h2(Math.floor(x / s), Math.floor(y / s), 17);
        if (hsh > .9) c = shade(c, .08); else if (hsh < .1) c = shade(c, -.1);
        // the clearing: a wide perspective ellipse where the battle happens
        const cy = hz + (AH - hz) * .55, ex = (x - AW * .52) / (AW * .5), ey = (y - cy) / ((AH - hz) * .42);
        const e = ex * ex + ey * ey + (G.fbm(x / 26, y / 26, 3, 2) - .5) * .35;
        if (e < 1 && !E.onWater) { const k = Math.min(1, (1 - e) * 3); c = mix(c, mix(d0, d1, t), k); if (G.h2(x >> 1, y >> 1, 23) > .985) c = shade(c, -.25); }
        if (E.onWater) { if (G.h2(Math.floor(x / (3 + s)), y, 13) > .93) c = shade(c, .35); }
        p.q(x, y, c, 30);
      }
    }
    // a soft haze line where the ground meets the distance
    for (let y = hz - 6; y < hz + 8; y++) for (let x = 0; x < AW; x++) p.set(x, y, hex(P.haze), .18 * (1 - Math.abs(y - hz) / 8));
  }
  function fence(p, P, y, x0, x1) {
    const wood = P.light > .9 ? hex('#3a3440') : hex('#8a6a4a'), top = shade(wood, .2);
    for (let x = x0; x < x1; x += 34) { for (let yy = y - 22; yy < y; yy++) for (let xx = 0; xx < 5; xx++) p.set(x + xx, yy, xx < 2 ? top : wood); }
    for (const ry of [y - 17, y - 9]) for (let x = x0; x < x1; x++) { p.set(x, ry, top); p.set(x, ry + 1, wood); p.set(x, ry + 2, shade(wood, -.25)); }
  }
  function foreground(p, E, P, rng) {
    const dark = P.light > .9;
    const C = E.snowy ? [hex('#8fa6c2'), hex('#b8cadf')] : E.sea && !E.onWater ? [hex('#6a8a4a'), hex('#8aa85a')] : [hex(dark ? '#0e2018' : '#1f4a26'), hex(dark ? '#16301f' : '#2f6a33')];
    // bushy tufts along the bottom edge, heavier at the corners
    for (let x = -10; x < AW + 10; x += 3) {
      const corner = Math.max(0, 1 - Math.min(x, AW - x) / 220);
      const h = 10 + corner * 50 + G.fbm(x / 18, 4, 7, 2) * 18;
      for (let y = AH - h; y < AH; y++) {
        const blade = G.h2(x, y >> 2, 5) > .5;
        p.set(x + (y % 3 === 0 ? 1 : 0), y, blade ? C[1] : C[0]);
      }
    }
    // a rock in the lower right
    const rx = AW - 170, ry = AH - 10;
    for (let y = ry - 46; y < AH; y++) for (let x = rx - 70; x < rx + 70; x++) {
      const dx = (x - rx) / 70, dy = (y - ry) / 46; if (dx * dx + dy * dy > 1) continue;
      const lit = -dx * .5 - dy * .8 + (G.h2(x >> 2, y >> 2, 3) - .5) * .4;
      const R = dark ? [hex('#26263a'), hex('#34344a'), hex('#46465e')] : [hex('#5a5a66'), hex('#747480'), hex('#92929c')];
      p.set(x, y, R[lit > .4 ? 2 : lit > -.1 ? 1 : 0]);
    }
  }
  function palm(p, x, base, h, dark) {
    const trunk = dark ? [40, 34, 40] : [120, 90, 60], leaf = dark ? [20, 40, 34] : [46, 120, 60];
    for (let y = 0; y < h; y++) { const xx = x + Math.round(Math.sin(y / h * 1.4) * 10); for (let k = -2; k <= 2; k++) p.set(xx + k, base - y, trunk); }
    const tx = x + Math.round(Math.sin(1.4) * 10), ty = base - h;
    for (let a = 0; a < 7; a++) { const ang = -Math.PI * .9 + a * .3; for (let r = 0; r < 44; r++) { const yy = ty + Math.sin(ang) * r * .5 + r * r * .012, xx = tx + Math.cos(ang) * r; for (let k = -2; k <= 2; k++) p.set(xx, yy + k * (1 - r / 44), leaf); } }
  }

  // ----------------------------------------------------------- compose
  function paint(env, phase) {
    const E = ENV[env], P = PH[phase] || PH.day, rng = new G.RNG(env + '|' + phase), p = new Canvas2();
    const hz = E.sea ? 200 : 214;
    skyLayer(p, P, hz, rng);
    cloudLayer(p, P, hz, rng);
    const haze = hex(P.haze);
    ridge(p, hz - 20, 90, 180, 3, hex(E.mtn[0]), shade(hex(E.mtn[1]), .15), haze, .45);
    ridge(p, hz - 4, 50, 110, 7, shade(hex(E.mtn[0]), -.12), hex(E.mtn[1]), haze, .25);
    if (E.volcano) volcanoLayer(p, P, hz, rng);
    if (E.city) cityLayer(p, P, hz + 6, rng);
    if (E.sea) waterBand(p, P, E, hz, E.onWater ? AH : hz + 90, rng);
    else if (E.lake) waterBand(p, P, E, hz, hz + 26, rng);
    if (E.forest) forestBand(p, E, P, hz + (E.lake ? 30 : 16), rng, E.dense);
    if (E.cliff) cliff(p, P, 0, 300, hz - 70, hz + 70, rng);
    const gy = E.sea ? hz + 90 : hz + (E.lake ? 40 : 26);
    if (!E.onWater) ground(p, E, P, gy, rng);
    else ground(p, E, P, hz + 60, rng);
    if (E.fence) fence(p, P, gy + 12, 300, 560);
    if (E.palms) { palm(p, 60, gy + 20, 150, P.light > .9); palm(p, 700, gy + 10, 130, P.light > .9); }
    if (E.mist || E.shafts) for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
      if (E.mist && y > hz - 20 && y < hz + 70) p.set(x, y, [200, 190, 230], .1 * Math.sin((y - hz + 20) / 90 * Math.PI));
      if (E.shafts && P.light < .9) { const u = (x + y * .45) % 190; if (u < 26 && y < gy + 40) p.set(x, y, [255, 246, 200], .06); }
    }
    foreground(p, E, P, rng);
    return p.canvas();
  }

  // ----------------------------------------------------------- public
  const cache = {}, imgs = {};
  // optional hand-made art: img/battle/<env>_<phase>.png (loaded once, silently skipped if missing)
  G.loadBattleArt = function () {
    for (const env of G.BATTLE_HD_ENVS) for (const ph of ['day', 'dusk', 'night']) {
      const im = new Image(); im.onload = () => { imgs[env + '|' + ph] = im; }; im.onerror = () => { }; im.src = `img/battle/${env}_${ph}.png`;
    }
  };
  G.battleHD = function (env, phase) {
    const ph = phase === 'dawn' ? 'dusk' : phase === 'night' ? 'night' : phase === 'dusk' ? 'dusk' : 'day';
    const e = ENV[env] ? env : null; if (!e) return null;
    const key = e + '|' + ph;
    if (imgs[key]) return imgs[key];
    return cache[key] || (cache[key] = paint(e, ph));
  };
})();
