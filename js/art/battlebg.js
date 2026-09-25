'use strict';
// ============================================================================
//  Battle scenery, painted as pixel art: a banded sky with pixel clouds, a
//  shaded far layer per environment (tree lines, hills, sea, skyline, cave
//  rock, crystal spires, volcano), a textured ground plane, and grassy /
//  sandy / stone platforms with lit rims. Cached per environment and time.
// ============================================================================
(function () {
  const W = () => G.W, H = () => G.H;
  const P = G.rgb;
  const mix = (a, b, t) => G.mixc(P(a), P(b), t);
  // sky: gradient quantised into bands, with checker dither on band seams
  function sky(p, top, bot, y1, bands = 9) {
    const a = P(top), b = P(bot);
    for (let y = 0; y < y1; y++) {
      const t = y / y1, k = Math.min(bands - 1, Math.floor(t * bands)), f = t * bands - k;
      const c0 = G.mixc(a, b, k / (bands - 1)), c1 = G.mixc(a, b, Math.min(1, (k + 1) / (bands - 1)));
      for (let x = 0; x < W(); x++) p.set(x, y, f > .82 && ((x + y) & 1) ? c1 : c0);
    }
  }
  function cloud(p, cx, cy, w, rng, col, night) {
    const L = night ? [P('#4a5478'), P('#5e6a90'), P('#7680a6')] : [mix(col, '#9ab4d8', .55), P('#e8f0fa'), P('#ffffff')];
    const puffs = [];
    const n = 3 + Math.floor(w / 14);
    for (let i = 0; i < n; i++) puffs.push([cx - w / 2 + (i + .5) * w / n + rng.range(-3, 3), cy - rng.range(0, 6) - (i > 0 && i < n - 1 ? 4 : 0), rng.range(5, 9)]);
    for (const [x, y, r] of puffs) for (let yy = Math.floor(y - r); yy <= cy + 2; yy++) for (let xx = Math.floor(x - r); xx <= x + r; xx++) {
      if ((xx - x) ** 2 + (yy - y) ** 2 > r * r && yy < cy) continue;
      if (yy > cy + 2) continue;
      const shade = yy > cy - 1 ? 0 : ((xx - x) + (yy - y) * 1.3) < -r * .35 ? 2 : 1;
      p.set(xx, yy, L[shade]);
    }
  }
  function ridge(p, base, amp, freq, seed, ramp, o = {}) {
    // a far silhouette lit from the left: slope decides the tone
    const hts = [];
    for (let x = 0; x <= W(); x++) {
      let h = G.fbm(x / freq, seed, seed, 3) * amp;
      if (o.jag) h += (G.h2(x >> 2, seed, 3) - .5) * o.jag;
      hts.push(Math.round(base - h));
    }
    for (let x = 0; x < W(); x++) {
      const slope = hts[x + 1] - hts[x];
      for (let y = hts[x]; y < (o.to || base + 30); y++) {
        const d = y - hts[x];
        let k = slope > 0 ? 2 : slope < 0 ? 1 : 1;
        if (d > 6) k = 0; else if (d < 2) k = Math.min(ramp.length - 1, k + 1);
        p.set(x, y, ramp[k]);
      }
    }
  }
  function treeLine(p, base, ramp, seed, size = 9) {
    const rng = new G.RNG(seed);
    let x = -10;
    while (x < W() + 10) {
      const r = size * rng.range(.7, 1.15), cx = x, cy = base - r * .6 - rng.range(0, 4);
      for (let y = Math.floor(cy - r); y < base + 20; y++) for (let xx = Math.floor(cx - r); xx <= cx + r; xx++) {
        const inside = (xx - cx) ** 2 + (y - cy) ** 2 <= r * r || y > cy;
        if (!inside || xx < 0 || xx >= W()) continue;
        const lx = (xx - cx) / r, ly = (y - cy) / r;
        const I = -lx * .5 - ly * .7 + (G.h2(xx, y, seed) - .5) * .4;
        p.set(xx, y, ramp[I > .35 ? 3 : I > -.1 ? 2 : I > -.6 ? 1 : 0]);
      }
      x += r * rng.range(1.1, 1.5);
    }
  }
  const ENV_PAINT = {
    grass(p, E, ph) { ridge(p, 100, 22, 70, 2, G.ramp(ph.dark ? ['#20344a', '#2a4458', '#345266'] : ['#6aa888', '#7cbc98', '#94d0aa'])); treeLine(p, 108, G.ramp(ph.dark ? ['#0c1a1c', '#122622', '#1a322a', '#22402e'] : ['#2a6a3a', '#3a8444', '#4e9e50', '#6ab85e']), 5, 8); },
    forest(p, E, ph) { treeLine(p, 96, G.ramp(ph.dark ? ['#08140f', '#0e1e16', '#14281c', '#1a3222'] : ['#1a4a2e', '#24603a', '#327844', '#44904e']), 3, 13); treeLine(p, 110, G.ramp(ph.dark ? ['#0a1a12', '#10241a', '#163020', '#1e3a28'] : ['#22583a', '#2e7044', '#3e8a4e', '#56a45c']), 7, 10); },
    dusk(p, E, ph) { ridge(p, 98, 24, 60, 4, G.ramp(['#4a3a5e', '#5a4a70', '#6c5c84'])); treeLine(p, 108, G.ramp(['#2a2240', '#3a3052', '#4c4064', '#604e78']), 9, 9); },
    beach(p, E, ph) { sea(p, 104, ph); },
    water(p, E, ph) { sea(p, 104, ph); },
    snow(p, E, ph) { ridge(p, 96, 40, 50, 6, G.ramp(ph.dark ? ['#2a3450', '#3a4668', '#4c5a80'] : ['#9ab0cc', '#bccce0', '#e4ecf6']), { jag: 3 }); ridge(p, 108, 18, 30, 9, G.ramp(ph.dark ? ['#34405c', '#46547a', '#5a6a94'] : ['#c4d4e6', '#dce6f2', '#f4f8fc'])); },
    volcano(p, E, ph) {
      ridge(p, 104, 26, 50, 4, G.ramp(['#3a2626', '#4a3232', '#5c403c']));
      const cx = 250; for (let y = 30; y < 110; y++) { const hw = (y - 30) * .9 + 8; for (let x = Math.round(cx - hw); x < cx + hw; x++) { const lit = x < cx - hw * .2; p.set(x, y, P(lit ? '#6a4a42' : '#4a3230')); } }
      for (let y = 30; y < 40; y++) for (let x = cx - 10; x < cx + 10; x++) if (G.h2(x, y, 4) > .5) p.set(x, y, P(y < 34 ? '#ffd070' : '#ff7a2a'));
      for (let i = 0; i < 40; i++) { const y = 30 - i * .8, x = cx + Math.sin(i * .4) * (4 + i * .3); p.circ(x, y, 3 + i * .12, P(ph.dark ? '#3a3036' : '#8a7a78'), 160); }
      for (let y = 38; y < 104; y += 1) { const x = cx - 4 + Math.round(Math.sin(y * .3) * 2 + (y - 38) * .4); p.set(x, y, P('#ff8a3a')); p.set(x + 1, y, P('#ffc060')); }
    },
    city(p, E, ph) {
      const rng = new G.RNG(11);
      for (let i = 0; i < 18; i++) {
        const x = i * 22 + rng.int(-4, 4), w = rng.int(16, 24), h = rng.int(24, 70), top = 110 - h;
        const B = ph.dark ? G.ramp(['#1a2034', '#232a44', '#2e3654']) : G.ramp(['#7a8ca8', '#96a8c2', '#b4c4da']);
        for (let y = top; y < 112; y++) for (let xx = x; xx < x + w; xx++) p.set(xx, y, B[xx < x + 3 ? 2 : xx > x + w - 3 ? 0 : 1]);
        for (let wy = top + 4; wy < 106; wy += 6) for (let wx = x + 3; wx < x + w - 3; wx += 5) { const lit = ph.dark ? G.h2(wx, wy, 3) > .45 : true; p.rect(wx, wy, 2, 3, lit ? P(ph.dark ? '#ffd88a' : '#dcecff') : B[0]); }
      }
    },
    cave(p, E, ph) { rockWall(p, G.ramp(['#1c1612', '#2a2018', '#3a2e22', '#4c3c2c', '#5e4c38']), 3); },
    crystal(p, E, ph) {
      rockWall(p, G.ramp(['#141228', '#1e1c38', '#2a284a', '#3a385e', '#4c4a74']), 5);
      const rng = new G.RNG(8); const C = G.ramp(['#2a6a9a', '#4ab0e0', '#8ae0ff', '#e0fbff']), V = G.ramp(['#5a3a9a', '#8a5ad8', '#c8a0ff', '#f0e0ff']);
      for (let i = 0; i < 9; i++) { const x = rng.int(10, 370), b = rng.int(96, 112), h = rng.int(14, 36), w = rng.int(4, 8), R = i % 2 ? C : V; for (let y = 0; y < h; y++) { const hw = Math.max(1, Math.round(w * (y / h))); for (let xx = -hw; xx <= hw; xx++) p.set(x + xx, b - h + y, R[xx < 0 ? 2 : xx === 0 ? 3 : 1]); } }
    },
    ruins(p, E, ph) { indoorWall(p, G.ramp(['#3a3648', '#4a465a', '#5c586e', '#6e6a82']), 'column'); },
    gym(p, E, ph) { indoorWall(p, G.ramp(['#1e2638', '#28324a', '#34405c', '#44506e']), 'panel'); },
    hq(p, E, ph) { indoorWall(p, G.ramp(['#141c28', '#1c2636', '#263246', '#304058']), 'tech'); },
    league(p, E, ph) { indoorWall(p, G.ramp(['#1a1238', '#261a4c', '#34245e', '#443072']), 'column'); },
    sky(p, E, ph) { for (let i = 0; i < 6; i++) cloud(p, 30 + i * 66, 104 + (i % 2) * 4, 60, new G.RNG(i + 40), '#ffffff', ph.dark); },
    lighthouse(p, E, ph) { sea(p, 104, ph); const x = 300; for (let y = 36; y < 104; y++) { const hw = 5 + (y - 36) * .05; for (let xx = Math.round(x - hw); xx < x + hw; xx++) p.set(xx, y, P(Math.floor((y - 36) / 9) % 2 ? '#c83a3a' : '#f0f0f0')); } p.rect(x - 6, 28, 12, 8, P('#2a2c36')); p.rect(x - 4, 29, 8, 6, P('#fff2a8')); },
  };
  function sea(p, hz, ph) {
    const S = ph.dark ? G.ramp(['#0a1638', '#10204a', '#182c5e', '#8aa0d0']) : G.ramp(['#1e5ab0', '#2e74cc', '#4a92e2', '#e8f6ff']);
    for (let y = hz - 10; y < hz + 4; y++) for (let x = 0; x < W(); x++) { const k = y < hz - 6 ? 2 : y < hz ? 1 : 0; p.set(x, y, S[k]); if (G.h2(x, y, 5) > .985) p.set(x, y, S[3]); }
    for (let x = 0; x < W(); x++) if (G.h2(x >> 3, 0, 2) > .5) p.set(x, hz - 10, S[3]);
  }
  function rockWall(p, R, seed) {
    for (let y = 0; y < 112; y++) for (let x = 0; x < W(); x++) {
      const c = G.tiles.rockAt(x, y, R.concat([R[4], R[4], R[4]]), seed, 11, 9);
      p.set(x, y, c);
    }
    for (let i = 0; i < 14; i++) { const x = 14 + i * 27 + (i * 7) % 11, len = 10 + (i * 13) % 22; for (let y = 0; y < len; y++) { const hw = Math.max(0, Math.round(3 * (1 - y / len))); for (let xx = -hw; xx <= hw; xx++) p.set(x + xx, y, R[xx < 0 ? 3 : 1]); } }
    for (let y = 80; y < 112; y++) for (let x = 0; x < W(); x++) p.shade(x, y, -(y - 80) / 32 * .45);
  }
  function indoorWall(p, R, kind) {
    for (let y = 0; y < 112; y++) for (let x = 0; x < W(); x++) {
      let k = 1;
      if (kind === 'panel') { const u = x % 48, v = y % 36; k = u === 0 || v === 0 ? 3 : u === 47 || v === 35 ? 0 : 1; }
      if (kind === 'tech') { const u = x % 32; k = u < 2 ? 3 : (y % 12 === 0 ? 2 : 1); if (u === 16 && (y + (x >> 5) * 7) % 20 < 3) k = 3; }
      p.set(x, y, R[k]);
    }
    if (kind === 'column') for (let c = 0; c < 7; c++) { const x = 16 + c * 58; for (let y = 6; y < 112; y++) for (let xx = 0; xx < 16; xx++) p.set(x + xx, y, R[xx < 3 ? 3 : xx > 12 ? 0 : 2]); p.rect(x - 3, 4, 22, 5, R[3]); p.rect(x - 3, 106, 22, 6, R[3]); }
    for (let y = 96; y < 112; y++) for (let x = 0; x < W(); x++) p.shade(x, y, -(y - 96) / 16 * .35);
  }
  const GROUND = {
    grass: ['#5aa446', '#6ab852', '#7cc85e', '#96d872'], forest: ['#3a7a36', '#4a8e40', '#5ca24c', '#74b85e'], dusk: ['#4a7a5a', '#5a8e6a', '#6ea27c', '#88b892'],
    beach: ['#d8b878', '#e6c88c', '#f0d8a2', '#faeac0'], water: ['#2a64b8', '#3478cc', '#4a90e0', '#6aa8ee'], snow: ['#b8c8dc', '#ccdaea', '#e0eaf4', '#f4f8fc'],
    volcano: ['#4a3430', '#5a4038', '#6c4e44', '#825e50'], city: ['#8a90a0', '#9aa0b0', '#acb2c0', '#c0c6d2'], cave: ['#4a3c30', '#5c4a3a', '#6e5a46', '#846c54'],
    crystal: ['#3a3860', '#46447a', '#56548e', '#6a68a6'], ruins: ['#5a566a', '#6a667c', '#7c788e', '#9290a4'], gym: ['#34405c', '#3e4c6a', '#4a5a7a', '#5a6c8e'],
    hq: ['#26303e', '#2e3a4c', '#38465c', '#44546e'], league: ['#241a44', '#2e2256', '#3a2c68', '#4a3a7e'], sky: ['#c8dcf4', '#d8e8fa', '#e8f2fe', '#ffffff'], lighthouse: ['#6a6e7a', '#7a7e8a', '#8e929e', '#a4a8b4'],
  };
  G._bgCache = {};
  G.battleBG = function (env, phase) {
    const key = env + '|' + phase;
    if (G._bgCache[key]) return G._bgCache[key];
    const E = G.BATTLE_ENVS[env] || G.BATTLE_ENVS.grass;
    const night = phase === 'night', dusk = phase === 'dusk' || phase === 'dawn';
    const ph = { dark: night && !E.indoor, dusk };
    const p = new G.Painter(W(), H());
    const hz = E.horizon || 104;
    // sky
    const s0 = night ? E.nsky[0] : dusk ? '#6a5a9a' : E.sky[0], s1 = night ? E.nsky[1] : dusk ? '#ffb88a' : E.sky[1];
    sky(p, s0, s1, hz + 12);
    const rng = new G.RNG(env + phase);
    if (!E.indoor) {
      if (night || E.stars) for (let i = 0; i < 70; i++) { const x = rng.int(0, W() - 1), y = rng.int(0, hz - 30), b = rng.next(); p.set(x, y, P(b > .8 ? '#ffffff' : '#b8c4e8')); if (b > .95) { p.set(x - 1, y, P('#8898c8')); p.set(x + 1, y, P('#8898c8')); } }
      if (E.sun && !night) { for (let r = 22; r > 0; r -= 4) p.circ(320, 26, r, mix(s0, '#fff8d8', 1 - r / 26), 255); }
      if (night) { p.circ(312, 28, 9, P('#f4f0dc')); p.circ(316, 25, 8, P(s0)); }
      if (E.clouds && !night) for (let i = 0; i < 5; i++) cloud(p, rng.int(20, 360), rng.int(22, hz - 40), rng.int(30, 60), rng, s1, false);
      else if (E.clouds && night) for (let i = 0; i < 3; i++) cloud(p, rng.int(20, 360), rng.int(22, hz - 40), rng.int(30, 50), rng, s1, true);
    }
    (ENV_PAINT[env] || ENV_PAINT.grass)(p, E, ph);
    // ground plane: bands brighten toward the viewer, texture grows with distance
    const Gr = G.ramp(GROUND[env] || GROUND.grass).map(c => night && !E.indoor ? G.darkc(c, .45) : dusk ? G.mixc(c, P('#ff9a6a'), .12) : c);
    for (let y = hz + 2; y < H(); y++) {
      const t = (y - hz) / (H() - hz), k = t < .15 ? 0 : t < .45 ? 1 : 2;
      for (let x = 0; x < W(); x++) {
        let c = Gr[k];
        const s = Math.max(1, Math.round(1 + t * 3));
        const hsh = G.h2(Math.floor(x / s), Math.floor(y / Math.max(1, s - 1)), 17);
        if (hsh > .93) c = Gr[Math.min(3, k + 1)]; else if (hsh < .06) c = Gr[Math.max(0, k - 1)];
        p.set(x, y, c);
      }
    }
    for (let x = 0; x < W(); x++) { p.set(x, hz + 2, G.darkc(Gr[0], .2)); }
    const cv = p.done();
    G._bgCache[key] = cv;
    return cv;
  };
  const PLAT = {
    grass: ['#2e6a2e', '#3e8638', '#56a444', '#74c05a', '#9ada78', '#6a4a2e'], forest: ['#24562a', '#306c32', '#44883e', '#5ea252', '#80be6c', '#5a3e26'],
    dusk: ['#2e5a46', '#3a7054', '#4e8a66', '#68a47e', '#8ac09c', '#4a3a4e'], beach: ['#a88450', '#c09c64', '#d8b87e', '#ecd09a', '#fae6be', '#8a6a3e'],
    water: ['#1e4c94', '#2a64b0', '#3e82cc', '#62a2e2', '#9ac8f4', '#16386e'], snow: ['#8aa0bc', '#a8bcd4', '#c8d8ea', '#e4eef8', '#ffffff', '#6a7a94'],
    volcano: ['#3a2622', '#4e342c', '#664438', '#80584a', '#9c7060', '#2a1c18'], city: ['#5e6472', '#747a8a', '#8c92a2', '#a6acba', '#c4c8d4', '#4a4e5a'],
    cave: ['#3a2c22', '#4c3a2c', '#624c3a', '#7a624c', '#947a62', '#2a2018'], crystal: ['#2e2c54', '#3c3a6c', '#4e4c86', '#6664a2', '#8a88c4', '#201e3c'],
    ruins: ['#46425a', '#57536c', '#6a6680', '#807c96', '#9c98b0', '#342f44'], gym: ['#2e3a58', '#3a4a6c', '#4a5c84', '#5e72a0', '#7c90bc', '#1e2640'],
    hq: ['#1e5a5e', '#28747a', '#349096', '#46aeb2', '#6acece', '#16383c'], league: ['#8a6418', '#a87e24', '#c89a34', '#e6b84c', '#fcd878', '#5a3e10'],
    sky: ['#8aa4c8', '#a4bcdc', '#c0d4ec', '#dce8f8', '#ffffff', '#6a84a8'], lighthouse: ['#6a6e7a', '#80848e', '#989ca6', '#b2b6be', '#cccfd6', '#4a4e58'],
  };
  G._platCache = {};
  G.battlePlatform = function (env, w, mine) {
    const key = env + '|' + w + '|' + mine; if (G._platCache[key]) return G._platCache[key];
    const E = G.BATTLE_ENVS[env] || G.BATTLE_ENVS.grass;
    const C = G.ramp(PLAT[env] || PLAT.grass);
    const h = Math.round(w * .28), side = Math.round(w * .06);
    const p = new G.Painter(w + 4, h + side + 6);
    const cx = (w + 4) / 2, cy = h / 2 + 1, rx = w / 2, ry = h / 2;
    const tufts = ['grass', 'forest', 'dusk'].includes(env);
    // soft drop shadow
    p.ell(cx + 2, cy + side + 2, rx, ry, P('#000000'), 60);
    // earthen side wall under the rim
    for (let y = 0; y < side; y++) p.ell(cx, cy + y + 1, rx, ry, C[5]);
    for (let x = 0; x < w + 4; x++) for (let y = Math.floor(cy); y < cy + side + ry; y++) if (p.A(x, y) === 255 && G.h2(x, y, 3) > .85) p.shade(x, y, .12);
    // top surface: outer ring, inner disc, light toward the upper-left
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const nx = (x + .5 - cx) / rx, ny = (y + .5 - cy) / ry, d = nx * nx + ny * ny;
      if (d > 1) continue;
      let k = d > .78 ? 1 : 2;
      if (d < .5 && nx + ny < -.2) k = 3;
      if (d < .12 && nx + ny < -.25) k = 4;
      if (d > .92) k = 0;
      if (d > .78 && d < .92 && ny < -.2) k = 3;
      const hs = G.h2(x, y, 9);
      if (hs > .9 && k > 0) k = Math.max(1, k - 1); else if (hs < .05) k = Math.min(4, k + 1);
      p.set(x, y, C[k]);
    }
    if (E.platDetail && !tufts) for (let a = 0; a < 64; a++) { const t = a / 64 * Math.PI * 2, x = cx + Math.cos(t) * rx * .7, y = cy + Math.sin(t) * ry * .7; if (a % 2) p.set(x, y, C[4]); }
    if (tufts) {
      const rng = new G.RNG(w + (mine ? 1 : 0));
      for (let i = 0; i < 26; i++) {
        const t = rng.next() * Math.PI * 2, rr = rng.range(.2, .98), x = Math.round(cx + Math.cos(t) * rx * rr), y = Math.round(cy + Math.sin(t) * ry * rr);
        p.set(x, y - 1, C[4]); p.set(x - 1, y, C[3]); p.set(x + 1, y, C[3]); p.set(x, y, C[1]);
      }
      // blades breaking the silhouette along the front edge
      for (let a = 0; a < 40; a++) { const t = Math.PI * (.05 + .9 * a / 40), x = Math.round(cx + Math.cos(t) * rx), y = Math.round(cy + Math.sin(t) * ry); if (a % 3 === 0) { p.set(x, y - 1, C[2]); p.set(x, y - 2, C[3]); } }
    }
    const cv = p.done();
    G._platCache[key] = cv; return cv;
  };
})();
