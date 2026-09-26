'use strict';
// ============================================================================
//  HD title scene. A painted dusk seascape at 768x432 art pixels, drawn at the
//  display's native resolution: a banded sunset sky with sun-lit clouds, far
//  islands and a lit harbour town, a live per-pixel sea that reflects the sky
//  with a glittering sun path, and on the left a faceted rock headland with the
//  Lodestar (an octagonal lighthouse with gallery, lantern room and cap), the
//  keeper's cottage and pines. Animated on top: the lantern's beam, drifting
//  clouds, gulls, a sailboat, chimney smoke, surf, sea sparkle, fireflies,
//  shooting stars and, now and then, Orrelume breaching with a real waterline,
//  splash crown and rings.
// ============================================================================
(function () {
  const AW = 768, AH = 432, HZ = 262, M = 72;   // M: margin painted beyond each side (the 3D camera drifts)
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const shade = (a, k) => k >= 0 ? mix(a, [255, 255, 255], k) : mix(a, [0, 0, 0], -k);
  const sst = (e0, e1, x) => { const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };

  // RGBA layer with coverage blending
  class Layer {
    constructor(w = AW, h = AH, ox = 0) { this.ox = ox; this.w = w + ox * 2; this.h = h; this.d = new Uint8ClampedArray(this.w * h * 4); }
    copy() { const L = new Layer(this.w - this.ox * 2, this.h, this.ox); L.d.set(this.d); return L; }
    set(x, y, c, a = 1) {
      x = (x | 0) + this.ox; y |= 0; if (x < 0 || y < 0 || x >= this.w || y >= this.h || a <= 0) return;
      const i = (y * this.w + x) * 4, d = this.d, da = d[i + 3] / 255, oa = a + da * (1 - a);
      if (oa <= 0) return;
      d[i] = (c[0] * a + d[i] * da * (1 - a)) / oa; d[i + 1] = (c[1] * a + d[i + 1] * da * (1 - a)) / oa; d[i + 2] = (c[2] * a + d[i + 2] * da * (1 - a)) / oa; d[i + 3] = oa * 255;
    }
    canvas() { const cv = G.makeCanvas(this.w, this.h); cv.getContext('2d').putImageData(new ImageData(this.d, this.w, this.h), 0, 0); return cv; }
  }

  // ------------------------------------------------------------- sky
  const SKY = [[0, '#0a0e2c'], [.3, '#1f1d52'], [.55, '#4a2f72'], [.74, '#9a4a7e'], [.87, '#e2707a'], [.95, '#ff9e6e'], [1, '#ffd08c']].map(([k, c]) => [k, hex(c)]);
  function skyAt(u) { u = Math.min(1, Math.max(0, u)); for (let i = 1; i < SKY.length; i++) if (u <= SKY[i][0]) { const [k0, c0] = SKY[i - 1], [k1, c1] = SKY[i]; return mix(c0, c1, (u - k0) / (k1 - k0)); } return SKY[SKY.length - 1][1]; }
  const SUN = [540, HZ - 4], SUNR = 30;
  function paintSky() {
    const L = new Layer(AW, AH, M);
    for (let y = 0; y < AH; y++) {
      const u = Math.pow(Math.min(1, y / HZ), 1.15);
      for (let x = -M; x < AW + M; x++) {
        let c = skyAt(u);
        const d = Math.hypot((x - SUN[0]) / 1.7, (y - SUN[1]) * 1.2);
        c = mix(c, hex('#ffd9a0'), Math.max(0, .5 - d / 380) * 1.3);
        L.set(x, y, c);
      }
    }
    const rng = new G.RNG(71);
    for (let i = 0; i < 520; i++) {
      const x = rng.int(-M, AW + M - 1), y = rng.int(0, HZ - 60), b = rng.next(), fade = 1 - sst(40, HZ - 90, y);
      if (fade <= .02) continue;
      L.set(x, y, b > .8 ? [255, 250, 235] : [200, 210, 255], (.3 + b * .7) * fade);
      if (b > .96) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) L.set(x + dx, y + dy, [200, 210, 255], .45 * fade);
    }
    // the sun, sitting on the horizon, with banded heat shimmer
    for (let y = SUN[1] - SUNR; y <= HZ; y++) for (let x = SUN[0] - SUNR; x <= SUN[0] + SUNR; x++) {
      const d = Math.hypot(x - SUN[0], y - SUN[1]); if (d > SUNR) continue;
      const band = (HZ - y) < 14 && ((HZ - y) % 4) < 1.2;
      L.set(x, y, band ? hex('#ff9a5a') : mix(hex('#fff6d8'), hex('#ffc070'), d / SUNR * .8), Math.min(1, SUNR - d));
    }
    return L.canvas();
  }
  // clouds: stacks of puffs, lit from the sun (warm rim toward it, violet underside), soft edges
  function paintClouds(seed, n, yMin, yMax, scale) {
    const W = 1024, L = new Layer(W, 300), rng = new G.RNG(seed);
    const lit = hex('#ffc8a0'), body = hex('#b8668a'), dark = hex('#4a3070'), rim = hex('#ffe6c0');
    for (let k = 0; k < n; k++) {
      const cx = rng.int(40, W - 40), cy = rng.int(yMin, yMax), w = rng.int(110, 240) * scale, h = w * rng.range(.22, .32);
      const puffs = [];
      const m = Math.max(4, Math.round(w / 26));
      for (let i = 0; i < m; i++) { const u = (i + .5) / m; puffs.push([cx - w / 2 + u * w + rng.range(-8, 8), cy - Math.sin(u * Math.PI) * h * .6 - rng.range(0, h * .25), h * rng.range(.4, .7)]); }
      for (let y = Math.floor(cy - h * 1.3); y <= cy + 4; y++) for (let x = Math.floor(cx - w / 2 - h); x <= cx + w / 2 + h; x++) {
        let best = -1e9, nx = 0, ny = 0;
        for (const [px, py, r] of puffs) { const dx = (x - px) / 1.3, dy = y - py, v = r - Math.hypot(dx, dy); if (v > best) { best = v; nx = dx / r; ny = dy / r; } }
        const edge = best + (G.fbm(x / 9, y / 9, 3, 2) - .5) * 7;
        if (edge <= 0 || y > cy + 2) continue;
        const a = Math.min(1, edge / 2.2) * (y > cy - 2 ? sst(cy + 3, cy - 2, y) : 1);
        // light from the sun (lower right in the sky): facing it = lit, else body / dark underside
        const sdx = SUN[0] - (x + 0), sdy = SUN[1] - y + 200, sl = Math.hypot(sdx, sdy);
        const I = nx * sdx / sl + ny * sdy / sl;
        let c = I > .35 ? lit : I > -.1 ? mix(body, lit, (I + .1) / .45) : mix(body, dark, Math.min(1, (-I - .1) * 1.6));
        if (edge < 3 && I > .2) c = rim;                                   // bright silver lining
        c = mix(c, dark, sst(cy - h * .25, cy + 2, y) * .6);                 // flat shaded base
        L.set(x, y, c, a * .96);
      }
    }
    return L.canvas();
  }
  // far islands, the harbour town on the right and the horizon haze
  function paintFar() {
    const L = new Layer(AW, AH, M), haze = hex('#e08a86');
    const ridge = (base, amp, freq, seed, col, x0, x1) => {
      for (let x = x0; x < x1; x++) {
        const t = (x - x0) / (x1 - x0), env = Math.sin(t * Math.PI) ** .6;
        const h = (G.fbm(x / freq, seed, 3, 4) * amp + (G.fbm(x / (freq / 6), seed + 1, 2, 2) - .5) * amp * .3) * env;
        for (let y = Math.round(base - h); y < base; y++) L.set(x, y, mix(col, haze, .35 * (1 - (y - (base - h)) / Math.max(1, h)) + .15), 1);
      }
    };
    ridge(HZ, 44, 120, 3, hex('#6a4a86'), 240, 520);
    ridge(HZ, 26, 70, 9, hex('#4e3a74'), 300, 470);
    ridge(HZ, 60, 150, 5, hex('#5a3e7c'), 590, AW + M);
    // the town climbing the right-hand hill: stepped houses with pitched roofs and warm windows
    const rng = new G.RNG(17);
    for (let i = 0; i < 26; i++) {
      const x = 604 + rng.int(0, 150), hillY = HZ - Math.max(0, (x - 590) * .32 - Math.max(0, (x - 700) * .5)) - 2, w = rng.int(8, 15), h = rng.int(7, 13), y = Math.round(hillY - rng.int(0, 10));
      const wall = mix(hex('#3a2c5a'), haze, .25), roof = hex('#2a1e44');
      for (let yy = y - h; yy < y; yy++) for (let xx = x; xx < x + w; xx++) L.set(xx, yy, xx === x ? shade(wall, .12) : wall);
      for (let r = 0; r < 5; r++) for (let xx = x - 1 + r; xx < x + w + 1 - r; xx++) L.set(xx, y - h - r, roof);
      for (let k = 0; k < 2; k++) if (rng.next() < .75) { const wx = x + 2 + k * 5, wy = y - h + 3; L.set(wx, wy, [255, 212, 130]); L.set(wx + 1, wy, [255, 190, 110]); L.set(wx, wy + 1, [255, 190, 110]); }
    }
    // a church spire and a harbour light
    for (let yy = HZ - 62; yy < HZ - 30; yy++) { const hw = Math.max(0, (yy - (HZ - 62)) * .2); for (let xx = 690 - hw; xx <= 690 + hw; xx++) L.set(xx, yy, hex('#2e2250')); }
    for (let y = HZ - 10; y < HZ; y++) L.set(0, y, haze, 0);
    return L.canvas();
  }
  // the headland: faceted cliff, grass cap, pines, cottage and the Lodestar
  const LAMP = [152, 58];
  function paintHead(bare) {
    const L = new Layer(AW, AH, M), rng = new G.RNG(5);
    const R = [hex('#171228'), hex('#2a2040'), hex('#3c2e54'), hex('#5a4064'), hex('#a0607a')];
    const topAt = x => x < 200 ? 214 + (G.fbm(x / 40, 2, 2, 3) - .5) * 10 : 214 + Math.pow((x - 200) / 70, 2.2) * 60 + (G.fbm(x / 30, 2, 2, 3) - .5) * 10;
    for (let x = -M; x < 300; x++) {
      const tp = Math.round(topAt(x)); if (tp >= AH) continue;
      for (let y = tp; y < AH; y++) {
        // a sea cliff: tall narrow facets (vertical jointing) cut by horizontal strata, lit on the
        // faces turned toward the low sun on the right, cool violet in shadow
        const cw = 16, ch = 46, sx = x + (G.fbm(y / 40, x / 60, 5, 2) - .5) * 14, gx0 = Math.floor(sx / cw), gy0 = Math.floor(y / ch);
        let f1 = 1e9, f2 = 1e9, id = 0, nx = 0;
        for (let j = -1; j <= 1; j++) for (let i2 = -1; i2 <= 1; i2++) {
          const X = gx0 + i2, Y = gy0 + j, px = (X + .15 + G.h2(X, Y, 31) * .7) * cw, py = (Y + .15 + G.h2(X, Y, 37) * .7) * ch;
          const dx = (sx - px) / cw, dy = (y - py) / ch, d = dx * dx + dy * dy;
          if (d < f1) { f2 = f1; f1 = d; id = G.h2(X, Y, 41); nx = G.h2(X, Y, 43) * 2 - 1; } else if (d < f2) f2 = d;
        }
        const edge = Math.sqrt(f2) - Math.sqrt(f1), strata = Math.abs(((y + G.fbm(x / 50, 1, 4, 2) * 16) % 19) - 9.5) < .7;
        const face = x > 200 ? .35 : 0;                                    // the seaward end catches the sun
        const I = nx * .5 + (id - .5) * .4 + face - (y - tp) / 260;
        let c = R[I > .6 ? 4 : I > .2 ? 3 : I > -.25 ? 2 : 1];
        if (edge < .05) c = mix(c, R[0], .8); else if (strata) c = shade(c, -.18);
        c = mix(c, hex('#1a1230'), sst(260, AH, y) * .55);                 // darker toward the sea
        // grass cap
        if (y - tp < 7) c = y - tp < 2 ? hex('#5a8a5a') : hex('#2e5a48');
        else if (y - tp < 10 && G.h2(x, 3, 9) > .4) c = hex('#244838');
        L.set(x, y, c);
      }
      // grass tufts on top
      if (G.h2(x, 1, 5) > .6) for (let k = 1; k < 3 + G.h2(x, 2, 5) * 4; k++) L.set(x, tp - k, hex('#3e6e52'));
    }
    // pines (angular tiers, dark teal, lit edge toward the sun)
    const pine = (cx, base, h) => {
      const tiers = Math.max(3, Math.round(h / 12));
      for (let y = base - h; y < base; y++) {
        const t = (y - (base - h)) / h, tier = (t * tiers) % 1, hw = (t * .4 + tier * .25) * h * .42;
        for (let x = Math.floor(cx - hw); x <= cx + hw; x++) { const u = (x - cx) / Math.max(1, hw); L.set(x, y, u > .45 ? hex('#5a5a6a') : u > -.2 ? hex('#1c3038') : hex('#122028')); }
      }
      for (let y = base - 4; y < base + 1; y++) { L.set(cx, y, hex('#2a1a1a')); L.set(cx + 1, y, hex('#2a1a1a')); }
    };
    pine(22, 218, 70); pine(44, 216, 52); pine(8, 222, 48); pine(262, 236, 46); pine(284, 246, 38); pine(-30, 220, 58); pine(-56, 224, 44);
    // keeper's cottage: plastered walls, a steep slate roof, a chimney, warm windows
    { const x0 = 60, x1 = 112, base = 214, wallTop = 190;
      for (let y = wallTop; y < base; y++) for (let x = x0; x < x1; x++) L.set(x, y, x > 98 ? hex('#8a6a7a') : hex('#c8a8a0'));
      for (let y = 0; y < 26; y++) for (let x = x0 - 4 + y * .55; x < x1 + 4 - y * .55; x++) L.set(x, wallTop - y, y % 5 === 0 ? hex('#1e1a2e') : x > (x0 + x1) / 2 + 8 ? hex('#2a2440') : hex('#3e3456'));
      for (let y = 160; y < 176; y++) for (let x = 96; x < 102; x++) L.set(x, y, hex('#4a3040'));
      for (const wx of [68, 84]) { for (let y = 196; y < 205; y++) for (let x = wx; x < wx + 8; x++) L.set(x, y, (x === wx + 3 || y === 200) ? hex('#6a4430') : hex('#ffcf7a')); }
      for (let y = 200; y < 214; y++) for (let x = 102; x < 108; x++) L.set(x, y, hex('#4a3040')); }
    // path down from the cottage and a little fence
    for (let x = 112; x < 142; x += 6) for (let y = 204; y < 214; y++) L.set(x, y, hex('#3a2a30'));
    for (let x = 112; x < 142; x++) { L.set(x, 207, hex('#6a4a4a')); L.set(x, 210, hex('#4a3438')); }
    if (!bare) paintLighthouse(L);
    return L;
  }
  // the painted Lodestar (the flat title, and what the 3D sea reflects)
  function paintLighthouse(L) {
    // the Lodestar: octagonal tapered tower, red and white bands, lit facets toward the sun
    const bx = LAMP[0], base = 216, top = 84;
    for (let y = top; y < base; y++) {
      const t = (y - top) / (base - top), hw = 11 + t * 6;
      const band = Math.floor(t * 5.5) % 2 === 0;
      for (let x = Math.floor(bx - hw); x <= bx + hw; x++) {
        const u = (x - bx) / hw, facet = Math.min(3, Math.floor((u + 1) * 2));   // four visible faces
        const k = [-.42, -.22, .02, .22][facet];
        let c = band ? hex('#e8e2ea') : hex('#c83a48');
        c = shade(c, k);
        if (Math.abs(u - (-.5)) < .04 || Math.abs(u) < .03 || Math.abs(u - .5) < .04) c = shade(c, -.2);   // facet edges
        L.set(x, y, c);
      }
    }
    // door and small windows
    for (let y = 196; y < 216; y++) for (let x = bx - 4; x < bx + 4; x++) L.set(x, y, y < 199 ? hex('#3a2a30') : hex('#2a1e2a'));
    for (const wy of [120, 158]) for (let y = wy; y < wy + 7; y++) for (let x = bx + 2; x < bx + 6; x++) L.set(x, y, hex('#ffd890'));
    // gallery deck with railing
    for (let y = 78; y < 84; y++) for (let x = bx - 18; x <= bx + 18; x++) L.set(x, y, y < 80 ? hex('#5a5a6e') : hex('#24222e'));
    for (let x = bx - 17; x <= bx + 17; x += 3) for (let y = 70; y < 78; y++) L.set(x, y, hex('#1c1a26'));
    for (let x = bx - 18; x <= bx + 18; x++) { L.set(x, 69, hex('#3a3848')); L.set(x, 70, hex('#1c1a26')); }
    // lantern room: glazed panes (lit), mullions
    for (let y = 48; y < 70; y++) for (let x = bx - 11; x <= bx + 11; x++) { const mull = (x - bx + 11) % 7 === 0; L.set(x, y, mull ? hex('#1c1a26') : mix(hex('#fff4c0'), hex('#ffc860'), Math.abs(x - bx) / 11)); }
    // cap: faceted cone, a vent ball and a vane
    for (let y = 30; y < 48; y++) { const hw = (y - 30) * .75 + 1; for (let x = Math.floor(bx - hw); x <= bx + hw; x++) L.set(x, y, x > bx + 2 ? hex('#a03a44') : x > bx - 3 ? hex('#7a2a38') : hex('#4a1a2a')); }
    for (let y = 24; y < 30; y++) for (let x = bx - 2; x <= bx + 2; x++) L.set(x, y, hex('#2a2230'));
    for (let y = 12; y < 24; y++) L.set(bx, y, hex('#1c1a26')); for (let x = bx - 6; x <= bx + 5; x++) L.set(x, 16, hex('#1c1a26'));
    return L;
  }
  // foreground: a timber pier from the right with lamp posts, and dark rocks framing the bottom corners
  const PIER_LAMP = [610, 348];
  function paintFore() {
    const L = new Layer(AW, AH, M);
    // pier deck in perspective
    for (let y = 356; y < AH; y++) {
      const t = (y - 356) / (AH - 356), x0 = 600 - t * 180, x1 = 640 + t * 40;
      for (let x = Math.floor(x0); x < x1; x++) { const plank = Math.floor((y - 356) / (2 + t * 5)) % 2; L.set(x, y, plank ? hex('#6a4a4a') : hex('#7e5a54')); }
      for (let x = Math.floor(x0); x < x0 + 2 + t * 3; x++) L.set(x, y, hex('#3a2a34'));
    }
    for (const [px, py, h] of [[604, 356, 30], [548, 380, 44], [470, 412, 60]]) for (let y = py; y < py + h && y < AH; y++) for (let x = px; x < px + 3 + h / 20; x++) L.set(x, y, hex('#2a1e2a'));
    // lamp post at the pier end
    for (let y = PIER_LAMP[1]; y < 358; y++) L.set(PIER_LAMP[0], y, hex('#1c1822'));
    for (let y = PIER_LAMP[1] - 8; y < PIER_LAMP[1]; y++) for (let x = PIER_LAMP[0] - 3; x <= PIER_LAMP[0] + 3; x++) L.set(x, y, Math.abs(x - PIER_LAMP[0]) < 2 ? hex('#ffe0a0') : hex('#1c1822'));
    // rocks bottom-left under the headland and bottom-right past the pier
    const rock = (cx, cy, rx, ry) => {
      for (let y = Math.floor(cy - ry); y < AH; y++) for (let x = Math.floor(cx - rx); x < cx + rx; x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry, e = dx * dx + dy * dy + (G.fbm(x / 14, y / 14, 7, 2) - .5) * .5; if (e > 1) continue;
        const lit = dx * .7 - dy * .4 + (G.h2(x >> 3, y >> 3, 3) - .5) * .5;
        L.set(x, y, lit > .45 ? hex('#8a5068') : lit > 0 ? hex('#3a2c48') : hex('#1a1428'));
      }
    };
    rock(350, 424, 60, 22); rock(720, 420, 80, 34); rock(700, 404, 34, 20); rock(800, 430, 60, 40);
    return L.canvas();
  }

  // ------------------------------------------------------------- live sea
  let seaData = null, seaCv = null, seaCx = null, skyRow = null;
  function drawSea(t, night) {
    const rows = AH - HZ;
    if (!seaData) {
      seaCv = G.makeCanvas(AW, rows); seaCx = seaCv.getContext('2d'); seaData = seaCx.createImageData(AW, rows);
      skyRow = []; for (let y = 0; y <= HZ; y++) skyRow.push(skyAt(Math.pow(y / HZ, 1.15)));
    }
    const d = new Uint32Array(seaData.data.buffer), f = 420, camH = 26, tt = t * .02;
    const deep = hex('#0e1638'), sunc = hex('#ffe4a8');
    for (let j = 0; j < rows; j++) {
      const dy = j + .6, z = f * camH / dy, near = j / rows, fres = .18 + .82 * Math.pow(1 - near, 2.2);
      const w = 5 + dy * .62;
      for (let x = 0; x < AW; x++) {
        const wx = (x - AW / 2) * z / f, wz = z + t * .6;
        const s1 = Math.cos(wz * .11 + wx * .03 - tt * 2.2), s2 = Math.cos(wz * .23 - wx * .09 + tt * 2.9), s3 = Math.cos(wx * .21 + wz * .07 + tt * 1.7), s4 = Math.cos(wx * .5 - wz * .31 - tt * 3.3);
        const sl = s1 * .45 + s2 * .28 + s3 * .17 + s4 * .1;
        // mirrored sky: nearer rows reflect higher (darker) sky, slope wobbles the reflection
        const ry = Math.max(0, Math.min(HZ, Math.round(HZ - dy * (1.25 + sl * .45) - 2)));
        const sk = skyRow[ry];
        let r = deep[0] + (sk[0] - deep[0]) * fres, g = deep[1] + (sk[1] - deep[1]) * fres, b = deep[2] + (sk[2] - deep[2]) * fres;
        const k = 1 + sl * (.1 + near * .12); r *= k; g *= k; b *= k;
        // the sun's glitter path
        const ux = Math.abs(x - SUN[0]) / w;
        if (ux < 1) { const s = Math.pow(1 - ux, 1.4) * sst(.05 + ux * .5, .5 + ux * .4, sl + .15 * Math.sin(x * 1.7 + j * 2.3 + t * .3)); const m = s * (1 - night * .8); r += (sunc[0] - r) * m; g += (sunc[1] - g) * m; b += (sunc[2] - b) * m; }
        // crest highlights
        if (sl > .82 - near * .1) { r += 30; g += 26; b += 30; }
        r = r > 255 ? 255 : r; g = g > 255 ? 255 : g; b = b > 255 ? 255 : b;
        d[j * AW + x] = (255 << 24) | (b << 16) | (g << 8) | r;
      }
    }
    seaCx.putImageData(seaData, 0, 0);
    return seaCv;
  }

  // ------------------------------------------------------------- runtime
  let L0 = null;
  function layers() {
    if (!L0) {
      const bare = paintHead(true), lit = paintLighthouse(bare.copy());
      L0 = { sky: paintSky(), far: paintFar(), headBare: bare.canvas(), head: lit.canvas(), fore: paintFore(), cf: paintClouds(11, 7, 40, 150, .8), cn: paintClouds(29, 5, 90, 200, 1.15) };
    }
    return L0;
  }
  const gulls = Array.from({ length: 7 }, (_, i) => ({ x: 300 + i * 70, y: 110 + (i * 37) % 70, s: .6 + (i % 3) * .25, ph: i * 1.7, v: .18 + (i % 4) * .05 }));
  const P = new G.Particles();
  G.titleHD = {
    K: { AW, AH, HZ, M, SUN, SUNR, LAMP, PIER_LAMP, skyAt, hex, mix }, layers, P, gulls,
    prewarm() { layers(); if (G.title3d) G.title3d.prewarm(); },
    // st: { t, lamp (0..1), breach: null | { p, glow } , night }
    draw(c, st) {
      if (G.title3d && G.settings.title3d !== false && G.title3d.draw(c, st)) return;
      const Ls = layers(), gx = G.gfx, S = gx.S, t = st.t;
      const k = G.W * S / AW;
      // intro: fade from black and a slow settle of the camera
      const intro = G.ease.outCubic(Math.min(1, t / 150)), zoom = 1 + (1 - intro) * .08, pan = Math.sin(t / 900) * 6;
      c.save();
      c.beginPath(); c.rect(gx.ox, gx.oy, G.W * S, G.H * S); c.clip();
      c.translate(gx.ox + G.W * S / 2, gx.oy + G.H * S * .6); c.scale(k * zoom, k * zoom); c.translate(-AW / 2 + pan, -AH * .6);
      c.imageSmoothingEnabled = true;
      c.drawImage(Ls.sky, -M, 0);
      // sun glow breathing, slow crepuscular rays
      c.globalCompositeOperation = 'lighter';
      const gl = c.createRadialGradient(SUN[0], SUN[1], 4, SUN[0], SUN[1], 220); gl.addColorStop(0, `rgba(255,220,160,${.35 + .05 * Math.sin(t / 40)})`); gl.addColorStop(1, 'rgba(255,160,120,0)');
      c.fillStyle = gl; c.fillRect(SUN[0] - 240, SUN[1] - 240, 480, 260);
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * .26 + Math.sin(t / 300 + i) * .03, len = 330, w = .05 + (i % 3) * .02;
        c.fillStyle = `rgba(255,214,160,${(.045 + .03 * Math.sin(t / 90 + i * 2)).toFixed(3)})`;
        c.beginPath(); c.moveTo(SUN[0], SUN[1]); c.lineTo(SUN[0] + Math.cos(a - w) * len, SUN[1] + Math.sin(a - w) * len); c.lineTo(SUN[0] + Math.cos(a + w) * len, SUN[1] + Math.sin(a + w) * len); c.fill();
      }
      c.globalCompositeOperation = 'source-over';
      // shooting star now and then
      const ss = t % 700; if (ss < 34) { const q = ss / 34, sx = 120 + q * 220, sy = 40 + q * 60; const g2 = c.createLinearGradient(sx - 40, sy - 11, sx, sy); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, `rgba(255,255,240,${(1 - q) * .9})`); c.strokeStyle = g2; c.lineWidth = 1.2; c.beginPath(); c.moveTo(sx - 40, sy - 11); c.lineTo(sx, sy); c.stroke(); }
      // clouds (two parallax layers wrapping around)
      const cloudDraw = (cv, v, y0, a) => { const x = -((t * v) % cv.width); c.globalAlpha = a; c.drawImage(cv, x, y0); c.drawImage(cv, x + cv.width, y0); c.globalAlpha = 1; };
      cloudDraw(Ls.cf, .05, -20, .85);
      c.drawImage(Ls.far, -M, 0);
      // the sea
      c.drawImage(drawSea(t, st.night || 0), 0, HZ);
      // horizon mist
      const mg = c.createLinearGradient(0, HZ - 16, 0, HZ + 18); mg.addColorStop(0, 'rgba(255,190,170,0)'); mg.addColorStop(.5, 'rgba(255,190,170,.28)'); mg.addColorStop(1, 'rgba(255,190,170,0)');
      c.fillStyle = mg; c.fillRect(0, HZ - 16, AW, 34);
      cloudDraw(Ls.cn, .12, 10, .92);
      // a sailboat crossing far out with its lantern
      { const bxp = ((t * .08) % (AW + 200)) - 100, by = HZ + 9;
        c.fillStyle = '#1e1630'; c.beginPath(); c.moveTo(bxp - 12, by); c.lineTo(bxp + 12, by); c.lineTo(bxp + 8, by + 4); c.lineTo(bxp - 9, by + 4); c.fill();
        c.fillStyle = '#e8d8e0'; c.beginPath(); c.moveTo(bxp, by - 26); c.lineTo(bxp, by - 2); c.lineTo(bxp + 11, by - 3); c.fill();
        c.fillStyle = '#b8a0b8'; c.beginPath(); c.moveTo(bxp - 1, by - 22); c.lineTo(bxp - 1, by - 2); c.lineTo(bxp - 9, by - 3); c.fill();
        c.fillStyle = 'rgba(255,220,150,.9)'; c.fillRect(bxp - 11, by - 3, 2, 2); }
      // Orrelume breaching
      if (st.breach) this.breach(c, st.breach, t);
      // headland, then the beam over it
      c.drawImage(Ls.head, -M, 0);
      // surf breaking at the foot of the cliff
      for (let i = 0; i < 30; i++) { const y = HZ + 2 + i * 5.6, x = 200 + 70 * Math.pow(Math.max(0, (y - 214) / 60), 1 / 2.2) + 4 + Math.sin(t / 30 + i) * 3 + (i % 3) * 3, a = Math.max(0, Math.sin(t / 22 + i * 1.3)); if (a > .15) { c.fillStyle = `rgba(240,236,255,${(a * .7).toFixed(2)})`; c.fillRect(x, y, 4 + a * 5, 1.4); } }
      const lamp = st.lamp === undefined ? 1 : st.lamp;
      if (lamp > 0) {
        const phi = t / 70, dx = Math.cos(phi), dz = Math.sin(phi), toward = Math.max(0, -dz);
        const Lb = 760 * (1 - Math.max(0, dz) * .7), ex = LAMP[0] + dx * Lb, ey = LAMP[1] + 4 + dz * 50, bw = 26 + 90 * (1 - Math.abs(dz)) + 120 * toward;
        c.globalCompositeOperation = 'lighter';
        const g3 = c.createLinearGradient(LAMP[0], LAMP[1], ex, ey); g3.addColorStop(0, `rgba(255,240,190,${(.4 * lamp).toFixed(3)})`); g3.addColorStop(1, 'rgba(255,240,190,0)');
        c.fillStyle = g3; c.beginPath(); c.moveTo(LAMP[0], LAMP[1] - 3); c.lineTo(ex, ey - bw / 2); c.lineTo(ex, ey + bw / 2); c.lineTo(LAMP[0], LAMP[1] + 3); c.fill();
        const hl = c.createRadialGradient(LAMP[0], LAMP[1], 1, LAMP[0], LAMP[1], 30 + toward * 80); hl.addColorStop(0, `rgba(255,248,210,${(.9 * lamp).toFixed(3)})`); hl.addColorStop(1, 'rgba(255,220,150,0)');
        c.fillStyle = hl; c.fillRect(LAMP[0] - 120, LAMP[1] - 120, 240, 240);
        c.globalCompositeOperation = 'source-over';
      }
      // chimney smoke
      if (t % 9 === 0) P.add({ x: 99, y: 158, vx: .12, vy: -.25, life: 200, size: 3, grow: 2.5, color: 'rgba(200,180,210,1)', alpha: .22, fadeIn: 20, type: 'circle' });
      // fireflies over the headland, sparkles on the sea
      if (t % 12 === 0) P.add({ x: 20 + G.rand() * 240, y: 150 + G.rand() * 70, life: 180, size: 1.1, color: '#e8ff9a', blend: 'lighter', fadeIn: 40, type: 'circle', upd: p => { p.vx = Math.sin(p.t / 17 + p.y) * .2; p.vy = Math.cos(p.t / 23 + p.x) * .15; } });
      if (t % 3 === 0) P.add({ x: 300 + G.rand() * 460, y: HZ + 4 + G.rand() * 150, life: 26, size: .9 + G.rand(), color: '#fff2c8', blend: 'lighter', type: 'star', vr: .1 });
      P.update(); P.draw(c);
      // gulls
      c.strokeStyle = '#2a1e36'; c.lineWidth = 1.3;
      for (const gu of gulls) {
        const x = ((gu.x + t * gu.v) % (AW + 80)) - 40, y = gu.y + Math.sin(t / 60 + gu.ph) * 8, fl = Math.sin(t / 7 + gu.ph) * 3 * gu.s, s = 5 * gu.s;
        c.beginPath(); c.moveTo(x - s, y - fl); c.quadraticCurveTo(x - s * .4, y - fl * .2 - 1, x, y); c.quadraticCurveTo(x + s * .4, y - fl * .2 - 1, x + s, y - fl); c.stroke();
      }
      c.drawImage(Ls.fore, -M, 0);
      // pier lamp
      c.globalCompositeOperation = 'lighter';
      const pl = c.createRadialGradient(PIER_LAMP[0], PIER_LAMP[1] - 4, 1, PIER_LAMP[0], PIER_LAMP[1] - 4, 40); pl.addColorStop(0, 'rgba(255,220,150,.7)'); pl.addColorStop(1, 'rgba(255,200,120,0)');
      c.fillStyle = pl; c.fillRect(PIER_LAMP[0] - 40, PIER_LAMP[1] - 44, 80, 80);
      for (let k2 = 0; k2 < 6; k2++) { c.fillStyle = `rgba(255,210,140,${(.2 - k2 * .03).toFixed(2)})`; c.fillRect(PIER_LAMP[0] - 2 + Math.sin(t / 20 + k2) * 2, 362 + k2 * 6, 4, 2); }
      c.globalCompositeOperation = 'source-over';
      // lens vignette
      const vg = c.createRadialGradient(AW / 2, AH / 2, AH * .35, AW / 2, AH / 2, AW * .75); vg.addColorStop(0, 'rgba(0,0,10,0)'); vg.addColorStop(1, 'rgba(0,0,16,.55)');
      c.fillStyle = vg; c.fillRect(-20, -20, AW + 40, AH + 40);
      if (intro < 1) { c.fillStyle = `rgba(0,0,0,${(1 - intro).toFixed(3)})`; c.fillRect(-20, -20, AW + 40, AH + 40); }
      c.restore();
    },
    // arc out of the water: the body follows its trajectory, everything below the waterline is hidden
    breach(c, b, t) {
      // it rises out of the sea nearly upright, hangs, and slides back: the waterline hides whatever is
      // still under the surface, water pours off it, a crown of spray marks where it broke through
      const p = b.p, img = G.monArt.front('orrelume', false, 0), sc = b.glow ? 1.7 : 1.25;
      const x0 = b.glow ? 420 : 452, yw = HZ + (b.glow ? 46 : 36), Hh = img.height * sc;
      const rise = Math.pow(Math.sin(p * Math.PI), .6), x = x0 + (p - .5) * 26, y = yw + Hh * .5 - rise * Hh * (b.glow ? .95 : .8);
      const ang = (p - .5) * .5 + Math.sin(t / 20) * .02;
      c.save();
      c.beginPath(); c.rect(x - 300, -50, 600, yw + 50); c.clip();
      c.translate(x, y); c.rotate(ang); c.scale(sc, sc); c.imageSmoothingEnabled = false;
      if (b.glow) { c.drawImage(G.pix.silhouette(img, '#0c1640'), -img.width / 2, -img.height / 2); c.globalAlpha = .9; }
      c.drawImage(img, -img.width / 2, -img.height / 2);
      if (b.glow) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = .45; c.drawImage(img, -img.width / 2, -img.height / 2); }
      c.restore();
      c.imageSmoothingEnabled = true;
      const w = img.width * sc * .45;
      // churned water where the body cuts the surface
      c.fillStyle = `rgba(235,244,255,${(.35 + .25 * rise).toFixed(2)})`; c.beginPath(); c.ellipse(x, yw + 1, w * (.8 + .3 * rise), 3 + 2 * rise, 0, 0, Math.PI * 2); c.fill();
      // spray crown on the way up and the way down; streams pouring off while it hangs
      if ((p < .22 || p > .8) && t % 2 === 0) for (let i = 0; i < 5; i++) P.add({ x: x + (G.rand() - .5) * w * 2, y: yw, vx: (G.rand() - .5) * 2, vy: -1.6 - G.rand() * 2.8, ay: .09, life: 44, size: 1.2 + G.rand() * 1.8, color: '#eef6ff', type: 'circle' });
      if (rise > .3 && t % 2 === 0) P.add({ x: x + (G.rand() - .5) * w * 1.6, y: yw - rise * Hh * .5 + G.rand() * rise * Hh * .4, vy: .6, ay: .14, life: 26, size: .9, color: '#d8ecff', type: 'circle' });
      for (let r = 0; r < 3; r++) { const q = ((t / 55 + r / 3) % 1); c.strokeStyle = `rgba(230,240,255,${((1 - q) * .4 * (.4 + rise)).toFixed(2)})`; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, yw + 2, w + q * 80, 3 + q * 11, 0, 0, Math.PI * 2); c.stroke(); }
      if (b.glow) { c.globalCompositeOperation = 'lighter'; const hg = c.createRadialGradient(x, yw - 40, 4, x, yw - 40, 140); hg.addColorStop(0, `rgba(120,200,255,${(.5 * rise).toFixed(3)})`); hg.addColorStop(1, 'rgba(120,200,255,0)'); c.fillStyle = hg; c.fillRect(x - 150, yw - 190, 300, 300); c.globalCompositeOperation = 'source-over'; }
    },
  };
})();
