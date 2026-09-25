'use strict';
// ============================================================================
//  Tile & prop art: cliffs, ledges, bridges, floors and walls (baked into the
//  terrain), live overlays (tall grass, flowers, hedges), world props (trees,
//  rocks, lamps, fences...), furniture, buildings and item icons. All painted
//  procedurally with the px.js toolkit: hue-shifted ramps, a single top-left
//  key light and selective dark outlines.
// ============================================================================
G.tiles = (function () {
  const P = G.rgb, R = G.ramp;
  const cache = new Map();
  const get = (key, w, h, fn) => { let c = cache.get(key); if (!c) { const p = new G.Painter(w, h); fn(p); c = p.done(); cache.set(key, c); } return c; };
  const h2 = G.h2;
  const RMP = () => G.RAMPS;

  // ------------------------------------------------------------ palettes --
  const LEAF = {
    grass: R(['#0a2214', '#0f301a', '#154420', '#1d5a27', '#29722d', '#398a32', '#52a43a', '#78be48', '#a8da66']),
    beach: R(['#11301c', '#184224', '#20582b', '#2c7232', '#3c8c38', '#54a840', '#72c24c', '#98d85e', '#c4ec80']),
    dusk: R(['#2a1434', '#3c1c46', '#52265a', '#6c3270', '#884286', '#a4589e', '#c074b6', '#da98cc', '#f0c2e2']),
    snow: R(['#0e2426', '#143232', '#1c4240', '#265650', '#326a60', '#46806e', '#62987e', '#8ab4a0', '#b8d4c4']),
    ash: R(['#1e1814', '#2a221c', '#382e26', '#483c32', '#5a4c3e', '#6e5e4c', '#84725e', '#9c8a74', '#b8a68e']),
  };
  const leafOf = th => LEAF[th] || LEAF.grass;
  const BARK = R(['#1e120c', '#2e1d14', '#43291a', '#5c3a22', '#76502e', '#91683c', '#ad844e']);
  const STONE = R(['#262630', '#3a3a46', '#50505c', '#686874', '#80808a', '#9a9aa2', '#b6b6bc', '#d4d4d8']);
  const STONE_SNOW = R(['#243048', '#34425e', '#485874', '#5e708c', '#7a8ca6', '#98a8c0', '#b8c6d8', '#dce6f0']);
  const STONE_ASH = R(['#1c1616', '#2a2220', '#3a302c', '#4c403a', '#5e5048', '#72625a', '#8a786e', '#a8948a']);
  const CLIFF = {
    grass: R(['#2a1a14', '#3e271c', '#553526', '#6e4631', '#88593d', '#a26f4d', '#bc8a62', '#d4a87e']),
    beach: R(['#34221a', '#4a3222', '#62442e', '#7c583a', '#966e48', '#b0875a', '#c8a270', '#dcbc8a']),
    dusk: R(['#221a2c', '#30263e', '#403452', '#524466', '#66567a', '#7c6a90', '#9482a8', '#b0a0c2']),
    snow: R(['#1e2638', '#2c364c', '#3c4862', '#4e5c78', '#627290', '#7a8aa8', '#96a6c0', '#b8c4d8']),
    ash: R(['#181210', '#241a16', '#32241e', '#423028', '#543e32', '#684e40', '#7e6250', '#987a66']),
    cave: R(['#1a1210', '#261b16', '#34251c', '#443024', '#563e2e', '#6a4e3a', '#806248', '#9a7a5c']),
    crystal: R(['#161428', '#201e38', '#2c2a4a', '#3a385e', '#4a4874', '#5e5c8c', '#7672a6', '#9490c2']),
  };
  const OUT = P('#141020');

  // ----------------------------------------------------- rock face shader --
  // cobbled rock: jittered-grid Voronoi, lit from the top-left per chunk,
  // dark crevices where two chunks meet
  function rockAt(wx, wy, ramp, seed = 0, sx = 7, sy = 5.5) {
    const gx = Math.floor(wx / sx), gy = Math.floor(wy / sy);
    let f1 = 1e9, f2 = 1e9, cx = 0, cy = 0, id = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const X = gx + i, Y = gy + j;
      const px = (X + .15 + h2(X, Y, 31 + seed) * .7) * sx, py = (Y + .15 + h2(X, Y, 37 + seed) * .7) * sy;
      const dx = (wx + .5 - px) / sx, dy = (wy + .5 - py) / sy, d = dx * dx + dy * dy;
      if (d < f1) { f2 = f1; f1 = d; cx = dx; cy = dy; id = h2(X, Y, 41 + seed); } else if (d < f2) f2 = d;
    }
    const edge = Math.sqrt(f2) - Math.sqrt(f1);
    if (edge < .11) return ramp[1];
    let I = .58 - cx * .55 - cy * .75 + (id - .5) * .35;
    if (edge < .2) I -= .22;
    const k = G.clamp(Math.floor(I * 5) + 2, 2, ramp.length - 1);
    return ramp[k];
  }

  // ---------------------------------------------------------- cliff walls --
  // kind: cliff | cave | crystal. info: {n,s,e,w (same), s2, n2, above2}
  function cliffTile(map, c) {
    const same = (dx, dy) => { const q = map.cellAny(c.x + dx, c.y + dy); return !q ? true : q.g === c.g; };
    const n1 = same(0, -1), s1 = same(0, 1), s2 = same(0, 2), n2 = same(0, -2), e1 = same(1, 0), w1 = same(-1, 0);
    const kind = c.g === 'cliff' ? 'cliff' : c.g === 'cavewall' ? 'cave' : 'crystal';
    const th = map.theme;
    const ramp = kind === 'cliff' ? (CLIFF[th] || CLIFF.grass) : CLIFF[kind];
    const type = !s1 ? 'faceB' : (!s2 && n1) ? 'faceU' : 'top';
    const aboveFace = n1 && n2 && !s1;   // faceB directly below a faceU
    const p = new G.Painter(16, 16), X0 = c.x * 16, Y0 = c.y * 16;
    const masonry = kind === 'cliff' && (map.def.cliffStyle === 'stone' || map.def.env === 'city');
    if (masonry) return masonryTile(c, type, n1, e1, w1, X0, Y0);
    const GR = kind === 'cliff' ? (th === 'snow' ? RMP().snow : th === 'ash' ? RMP().ash : th === 'beach' ? RMP().beach : th === 'dusk' ? RMP().dusk : RMP().grass) : null;
    const topFill = (x, y) => {
      const wx = X0 + x, wy = Y0 + y;
      if (GR) { const v = G.fbm(wx / 30, wy / 30, 8, 2); let k = v < .4 ? 4 : v < .62 ? 5 : 6; if (h2(wx, wy, 3) > .9) k--; if (h2(wx, wy, 4) > .95) k = Math.min(7, k + 1); return GR[Math.min(GR.length - 1, k)]; }
      // cave ceiling rock: dark, gently mottled
      const v = G.fbm(wx / 12, wy / 12, 9, 2); return ramp[v < .4 ? 1 : v < .65 ? 2 : 3];
    };
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const wx = X0 + x, wy = Y0 + y;
      let col;
      if (type === 'top') col = topFill(x, y);
      else {
        let lip = 0;
        if (type === 'faceB' && !n1) lip = 5; else if (type === 'faceU' || (type === 'faceB' && n1 && !aboveFace)) lip = type === 'faceU' ? 3 : 0;
        if (y < lip) col = topFill(x, y);
        else {
          col = rockAt(wx, wy, ramp, kind === 'crystal' ? 5 : 0);
          // vertical gradient: darker toward the base of the wall
          const depth = type === 'faceB' ? (y / 16) : (y / 32);
          if (depth > .75) col = G.darkc(col, (depth - .75) * .9);
        }
        // lip edge: dark line with a lit rim above it
        if (lip && y === lip) col = ramp[0];
        if (lip && y === lip - 1) col = GR ? GR[7] : ramp[5];
        if (type === 'faceB' && y >= 14) col = G.darkc(col, y === 15 ? .45 : .25);
      }
      p.set(x, y, col);
    }
    // rims on the plateau top and wall ends
    if (type === 'top' && !n1) { for (let x = 0; x < 16; x++) { p.set(x, 0, ramp[0]); p.set(x, 1, GR ? GR[7] : ramp[5]); } }
    if (!w1) for (let y = 0; y < 16; y++) { p.set(0, y, ramp[0]); if (type !== 'top') p.set(1, y, ramp[2]); else p.shade(1, y, .12); }
    if (!e1) for (let y = 0; y < 16; y++) { p.set(15, y, ramp[0]); p.set(14, y, type !== 'top' ? ramp[1] : G.darkc(p.get(14, y), .2)); }
    // crystals studded in crystal walls
    if (kind === 'crystal' && type !== 'top' && h2(c.x, c.y, 77) > .45) {
      const cx = 3 + Math.floor(h2(c.x, c.y, 78) * 9), cy = 6 + Math.floor(h2(c.x, c.y, 79) * 5), cc = h2(c.x, c.y, 80) > .5 ? R(['#2a6a9a', '#5ab8e8', '#a8f0ff', '#ffffff']) : R(['#5a3a9a', '#9a6ae0', '#d8b8ff', '#ffffff']);
      p.rect(cx, cy, 3, 5, cc[1]); p.rect(cx, cy, 1, 5, cc[2]); p.set(cx + 1, cy - 1, cc[2]); p.set(cx, cy, cc[3]); p.rect(cx + 2, cy + 1, 1, 4, cc[0]);
      p.rect(cx + 3, cy + 2, 2, 3, cc[1]); p.set(cx + 3, cy + 2, cc[2]);
    }
    return p.done();
  }

  // dressed-stone seawall / retaining wall for towns and cities: flagstone top, coursed blocks
  function masonryTile(c, type, n1, e1, w1, X0, Y0) {
    const p = new G.Painter(16, 16), S = STONE;
    const flag = (wx, wy) => { const bx = Math.floor(wx / 8), by = Math.floor(wy / 8), ex = wx % 8, ey = wy % 8; if (ex === 7 || ey === 7) return S[3]; const v = h2(bx, by, 5); return ex === 0 || ey === 0 ? S[6] : S[v > .66 ? 5 : v > .33 ? 5 : 4]; };
    const block = (wx, wy, dark) => {
      const course = Math.floor(wy / 5), yy = wy % 5, off = course % 2 ? 5 : 0, bx = (wx + off) % 10, id = Math.floor((wx + off) / 10) * 7 + course * 3;
      let k = 4 + Math.floor(h2(id, course, 9) * 2);
      if (yy === 4 || bx === 9) k = 1; else if (yy === 0) k = 6; else if (yy === 3 || bx === 8) k = 3;
      return S[Math.max(0, k - dark)];
    };
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const wx = X0 + x, wy = Y0 + y;
      let col;
      if (type === 'top') col = flag(wx, wy);
      else {
        const lip = type === 'faceB' && !n1 ? 4 : type === 'faceU' ? 3 : 0;
        if (y < lip) col = flag(wx, wy);
        else if (lip && y === lip) col = S[7];
        else col = block(wx, wy, type === 'faceB' && y >= 13 ? 1 : 0);
        if (type === 'faceB' && y === 15) col = S[0];
      }
      p.set(x, y, col);
    }
    if (type === 'top' && !n1) for (let x = 0; x < 16; x++) { p.set(x, 0, S[1]); p.set(x, 1, S[7]); }
    if (!w1) for (let y = 0; y < 16; y++) p.set(0, y, S[1]);
    if (!e1) for (let y = 0; y < 16; y++) p.set(15, y, S[1]);
    return p.done();
  }

  // ------------------------------------------------------------- ledges --
  function ledgeTile(map, c, dir) {
    const p = new G.Painter(16, 16);
    const cave = map.type === 'cave';
    const ramp = cave ? CLIFF.cave : (CLIFF[map.theme] || CLIFF.grass);
    const GR = cave ? null : (map.theme === 'beach' ? RMP().beach : map.theme === 'dusk' ? RMP().dusk : map.theme === 'snow' ? RMP().snow : map.theme === 'ash' ? RMP().ash : RMP().grass);
    const same = (dx, dy) => { const q = map.cellAny(c.x + dx, c.y + dy); return q && q.g === c.g; };
    if (dir === 'down') {
      // a low earth step: lit grass edge, short rock face, contact shadow
      for (let x = 0; x < 16; x++) {
        const wx = c.x * 16 + x;
        p.set(x, 9, GR ? GR[7] : ramp[6]); p.set(x, 10, ramp[0]);
        for (let y = 11; y < 15; y++) p.set(x, y, rockAt(wx, c.y * 16 + y, ramp, 2, 5, 3));
        p.set(x, 15, ramp[1]);
      }
      if (!same(-1, 0)) { for (let y = 9; y < 16; y++) p.set(0, y, ramp[0]); }
      if (!same(1, 0)) { for (let y = 9; y < 16; y++) p.set(15, y, ramp[0]); }
    } else {
      const L = dir === 'left', x0 = L ? 0 : 11;
      for (let y = 0; y < 16; y++) {
        for (let i = 0; i < 5; i++) p.set(x0 + i, y, rockAt(c.x * 16 + x0 + i, c.y * 16 + y, ramp, 3, 3, 5));
        p.set(L ? 5 : 10, y, ramp[0]); p.set(L ? 6 : 9, y, GR ? GR[7] : ramp[6]); p.set(L ? 0 : 15, y, ramp[1]);
      }
    }
    return p.done();
  }

  // ------------------------------------------------------------ bridges --
  function bridgeTile(map, c) {
    const p = new G.Painter(16, 16);
    const isB = (dx, dy) => { const q = map.cellAny(c.x + dx, c.y + dy); return q && (q.g === 'bridge' || q.g === 'bridgev'); };
    const land = (dx, dy) => { const q = map.cellAny(c.x + dx, c.y + dy); return q && !q.water; };
    const vert = (isB(0, -1) || isB(0, 1) || land(0, -1) || land(0, 1)) && !(isB(-1, 0) || isB(1, 0));
    const W = R(['#2a1a12', '#46301e', '#62442a', '#7e5a38', '#9a7248', '#b48c5c', '#cca674']);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const u = vert ? x : y, v = vert ? y : x;   // boards run across the walking direction
      const board = Math.floor((v + (vert ? c.y : c.x) * 16) / 4), bv = ((v % 4) + 4) % 4;
      const tone = h2(board, vert ? c.x : c.y, 5);
      let k = tone < .3 ? 3 : tone > .75 ? 5 : 4;
      if (bv === 3) k = 1; else if (bv === 0) k += 1;
      if (h2(x + c.x * 16, y + c.y * 16, 6) > .94 && bv === 1) k -= 1;
      if ((u === 2 || u === 13) && bv === 1) k = 6;   // nail heads
      p.set(x, y, W[G.clamp(k, 0, 6)]);
    }
    // rails along water edges
    const railSide = vert ? [[-1, 0, 0], [1, 0, 15]] : [[0, -1, 0], [0, 1, 15]];
    for (const [dx, dy, e] of railSide) if (!isB(dx, dy) && !land(dx, dy)) {
      for (let t = 0; t < 16; t++) { const x = vert ? e : t, y = vert ? t : e; p.set(x, y, W[0]); const x2 = vert ? (e ? 14 : 1) : t, y2 = vert ? t : (e ? 14 : 1); p.set(x2, y2, W[e ? 2 : 6]); }
      if (vert) { p.rect(e ? 13 : 0, 6, 3, 4, W[1]); p.rect(e ? 13 : 0, 6, 3, 1, W[6]); }
      else { p.rect(6, e ? 13 : 0, 4, 3, W[1]); p.rect(6, e ? 13 : 0, 4, 1, W[6]); }
    }
    return p.done();
  }

  // ------------------------------------------------------ indoor floors --
  function woodFloor(p, X0, Y0, tone = 0) {
    const W = tone === 1 ? R(['#3a2418', '#553622', '#6e4a2e', '#86603c', '#9c744a', '#b2895a', '#c89e6c']) : R(['#4a2c18', '#6a4426', '#865a32', '#a0703e', '#b5844c', '#c8995e', '#dcb074']);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const wx = X0 + x, wy = Y0 + y, row = Math.floor(wy / 5), rv = ((wy % 5) + 5) % 5;
      const off = h2(row, 0, 3) * 24 | 0, seg = Math.floor((wx + off) / 24), su = ((wx + off) % 24 + 24) % 24;
      const tn = h2(seg, row, 4);
      let k = tn < .3 ? 3 : tn > .72 ? 5 : 4;
      if (rv === 4) k = 1; else if (rv === 0) k = Math.min(6, k + 1);
      if (su === 0) k = 2;
      const grain = Math.sin(wx * .9 + row * 7 + Math.sin(wx * .23 + row) * 2);
      if (grain > .93 && rv > 0 && rv < 4) k -= 1;
      p.set(x, y, W[G.clamp(k, 0, 6)]);
    }
  }
  function tileFloor(p, X0, Y0, base = '#e6eaee') {
    const r = G.rampFrom(base, 6, { lo: .28, hi: .1 });
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const u = ((X0 + x) % 16 + 16) % 16, v = ((Y0 + y) % 16 + 16) % 16;
      const checker = (Math.floor((X0 + x) / 16) + Math.floor((Y0 + y) / 16)) & 1;
      let k = checker ? 3 : 4;
      if (u === 15 || v === 15) k = 1; else if (u === 0 || v === 0) k = 5;
      if (u + v === 5 || u + v === 6) if (u < 6 && v < 6 && u > 0 && v > 0) k = 5;
      p.set(x, y, r[k]);
    }
  }
  function gymFloor(p, X0, Y0, base) {
    const r = G.rampFrom(base, 7, { lo: .3, hi: .18 });
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const u = ((X0 + x) % 16 + 16) % 16, v = ((Y0 + y) % 16 + 16) % 16;
      let k = 3;
      if (u === 15 || v === 15) k = 0; else if (u === 14 || v === 14) k = 2; else if (u === 0 || v === 0) k = 5; else if (u === 1 || v === 1) k = 4;
      if (u > 3 && u < 12 && v > 3 && v < 12 && (u + v) % 7 === 0) k = 4;
      p.set(x, y, r[k]);
    }
  }
  function carpet(p, map, c, col) {
    const base = { red: '#b83a3a', blue: '#3a5ab0', green: '#3a8a5a' }[col] || col || '#b83a3a';
    const r = G.rampFrom(base, 6, { lo: .3, hi: .2 });
    const same = (dx, dy) => { const q = map.cell(c.x + dx, c.y + dy); return q && q.g === 'carpet' && (q.carpet || null) === (c.carpet || null); };
    const n = same(0, -1), s = same(0, 1), w = same(-1, 0), e = same(1, 0);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      let k = ((c.x * 16 + x + c.y * 16 + y) % 4 === 0) ? 2 : 3;
      const b = (!n && y < 3) || (!s && y > 12) || (!w && x < 3) || (!e && x > 12);
      if (b) k = 5; if ((!n && y === 0) || (!s && y === 15) || (!w && x === 0) || (!e && x === 15)) k = 1;
      if ((!n && y === 3) || (!s && y === 12) || (!w && x === 3) || (!e && x === 12)) if (!b) k = 1;
      p.set(x, y, r[k]);
    }
  }
  // ------------------------------------------------------------- walls --
  const WALLS = { cream: '#efe2c4', blue: '#c4d8ee', green: '#cfe6c8', lab: '#e8eef4', gym: '#3a4458', wood: '#b88452', stone: '#868a94', rose: '#f0cdd6' };
  function wallTile(map, c) {
    const style = c.wstyle || map.def.wall || 'cream';
    const base = WALLS[style] || WALLS.cream;
    const r = G.rampFrom(base, 7, { lo: .34, hi: .12 });
    const below = map.cell(c.x, c.y + 1), above = map.cell(c.x, c.y - 1);
    const lower = !(below && below.g === 'wall'), top = !(above && above.g === 'wall');
    const p = new G.Painter(16, 16), X0 = c.x * 16;
    const trim = G.rampFrom(style === 'gym' ? '#6a748a' : style === 'wood' ? '#6a4428' : '#8a6a4a', 5, { lo: .3, hi: .2 });
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const wx = X0 + x;
      let col;
      if (style === 'wood') { const plank = Math.floor(wx / 5), pv = wx % 5; col = r[pv === 4 ? 1 : (h2(plank, 0, 2) > .5 ? 3 : 4)]; if (pv === 0) col = r[5]; }
      else if (style === 'stone') { const row = Math.floor((c.y * 16 + y) / 5), sx = wx + (row & 1) * 4, u = sx % 9, v = (c.y * 16 + y) % 5; col = r[u === 8 || v === 4 ? 1 : v === 0 || u === 0 ? 5 : h2(Math.floor(sx / 9), row, 5) > .6 ? 3 : 4]; }
      else if (style === 'gym') { col = r[(Math.floor(wx / 8) + Math.floor((c.y * 16 + y) / 8)) & 1 ? 3 : 4]; if (y % 8 === 0) col = r[5]; }
      else {   // wallpaper: soft vertical stripes with a tiny motif
        const s = wx % 8; col = r[s < 4 ? 4 : 5];
        if (s === 2 && (c.y * 16 + y) % 6 === 0) col = r[3];
      }
      p.set(x, y, col);
    }
    if (top) { p.hline(0, 15, 0, trim[1]); p.hline(0, 15, 1, trim[4]); p.hline(0, 15, 2, trim[3]); p.hline(0, 15, 3, r[2]); }
    if (lower) {   // wainscot panel + baseboard
      for (let y = 8; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, trim[(x === 0 || x === 8) ? 1 : y === 8 ? 4 : y === 9 ? 3 : (x === 1 || x === 9) ? 3 : 2]);
      p.hline(0, 15, 8, trim[4]); p.hline(0, 15, 14, trim[1]); p.hline(0, 15, 15, trim[0]);
      p.hline(0, 15, 7, G.darkc(r[2], .15));
    }
    // decorations
    const wy0 = lower ? 1 : 3;
    if (c.wv === 1) {   // window with curtains and daylight
      const fr = trim, sky = R(['#6aa6d8', '#8cc2ea', '#b4dcf6', '#e2f4ff']);
      p.rect(2, wy0, 12, 10, fr[1]); p.rect(3, wy0 + 1, 10, 8, sky[1]);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 10; x++) if (x + y < 6) p.set(3 + x, wy0 + 1 + y, sky[2]);
      p.line(5, wy0 + 1, 9, wy0 + 5, sky[3]); p.vline(7, wy0 + 1, wy0 + 8, fr[3]); p.hline(3, 12, wy0 + 5, fr[3]);
      const cur = R(['#a83a4a', '#d0566a', '#ec8a98']);
      p.rect(2, wy0, 2, 10, cur[1]); p.vline(2, wy0, wy0 + 9, cur[0]); p.rect(12, wy0, 2, 10, cur[1]); p.vline(13, wy0, wy0 + 9, cur[0]); p.vline(3, wy0, wy0 + 9, cur[2]);
      p.rect(1, wy0 + 10, 14, 2, fr[3]); p.hline(1, 14, wy0 + 11, fr[1]);
    } else if (c.wv === 2) {   // framed painting: seaside with a lighthouse
      p.rect(3, wy0 + 1, 10, 8, P('#6a4426')); p.rect(4, wy0 + 2, 8, 6, P('#8cc8f0'));
      p.rect(4, wy0 + 5, 8, 3, P('#3a78c8')); p.rect(4, wy0 + 7, 8, 1, P('#e8d49a')); p.rect(9, wy0 + 3, 1, 3, P('#f4f4f4')); p.set(9, wy0 + 2, P('#ffd84a'));
      p.hline(3, 12, wy0 + 1, P('#a8743e')); p.hline(4, 12, wy0 + 9, P('#3a2414'));
    } else if (c.wv === 4) {   // brass wall sconce with a frosted glass shade
      p.rect(7, wy0 + 6, 2, 4, P('#8a6a3a')); p.hline(6, 9, wy0 + 9, P('#c8a060'));
      for (let y = 0; y < 5; y++) for (let x = 5 - (y > 2 ? 1 : 0); x < 11 + (y > 2 ? 1 : 0); x++) p.set(x, wy0 + 1 + y, P(y === 0 ? '#fff8e0' : x < 7 ? '#fff0c0' : '#f0d08a'));
    } else if (c.wv === 5) {   // floating shelf with books and a little plant
      p.rect(1, wy0 + 8, 14, 2, P('#6a4426')); p.hline(1, 14, wy0 + 8, P('#a8743e'));
      const bc = ['#c84a4a', '#4a7ac8', '#e8b83a', '#4ab86a'];
      for (let i = 0; i < 4; i++) p.rect(2 + i * 2, wy0 + 3 + (i % 2), 2, 5 - (i % 2), P(bc[i]));
      p.rect(11, wy0 + 5, 3, 3, P('#b45c34')); p.set(12, wy0 + 3, P('#4a9a3a')); p.set(11, wy0 + 4, P('#5aac4a')); p.set(13, wy0 + 4, P('#3a8a2a'));
    } else if (c.wv === 6) {   // calendar
      p.rect(4, wy0 + 1, 8, 10, P('#f8f6f0')); p.rect(4, wy0 + 1, 8, 3, P('#d84a4a'));
      for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) p.set(5 + x * 2, wy0 + 5 + y * 2, P('#6a6a7a'));
      p.set(9, wy0 + 7, P('#d84a4a')); p.set(8, wy0, P('#3a3a3a'));
    } else if (c.wv === 7) {   // poster: a mon silhouette on a bright ground
      p.rect(3, wy0, 10, 12, P('#3a78c8')); p.rect(4, wy0 + 1, 8, 10, P('#8ac8f0'));
      p.circ(8, wy0 + 5, 2.6, P('#ffd84a')); p.rect(6, wy0 + 7, 4, 3, P('#e89a3a')); p.hline(4, 11, wy0 + 10, P('#2a4a8a'));
    } else if (c.wv === 8) {   // cluster of small framed photos
      for (const [x, y, w, hh] of [[2, 1, 5, 4], [8, 0, 6, 5], [4, 6, 6, 5]]) { p.rect(x, wy0 + y, w, hh, P('#5a3a22')); p.rect(x + 1, wy0 + y + 1, w - 2, hh - 2, P(['#e8c8a0', '#a8d0e8', '#c8e0a8'][(x + y) % 3])); }
    } else if (c.wv === 9) {   // cork notice board with pinned notes
      p.rect(1, wy0, 14, 11, P('#6a4426')); p.rect(2, wy0 + 1, 12, 9, P('#c8945a'));
      for (const [x, y, col] of [[3, 2, '#fff6a0'], [8, 2, '#ffffff'], [5, 6, '#a8e0ff'], [10, 6, '#ffc0d0']]) { p.rect(x, wy0 + y, 3, 3, P(col)); p.set(x + 1, wy0 + y, P('#e84a4a')); }
    } else if (c.wv === 3) {   // wall clock
      p.circ(8, wy0 + 5, 4.6, P('#6a4426')); p.circ(8, wy0 + 5, 3.6, P('#f8f4ea')); p.set(8, wy0 + 3, P('#202020')); p.set(8, wy0 + 4, P('#202020')); p.set(9, wy0 + 5, P('#202020')); p.set(8, wy0 + 5, P('#e84a4a'));
    }
    return p.done();
  }

  // ----------------------------------------------------- tall grass -------
  // dense blades with a dark outline and bright tips; frame sways the tips.
  // front=true returns only the lower blades (drawn over a standing sprite).
  function tallgrass(p, frame, theme, mask = 0, front = false) {
    const GR = theme === 'snow' ? LEAF.snow : theme === 'dusk' ? R(['#10282c', '#163a3a', '#1e4e48', '#286458', '#347a68', '#46927a', '#5eac8e', '#80c4a4', '#aadcc0']) : theme === 'ash' ? R(['#241c14', '#32281c', '#443624', '#584630', '#6c563a', '#826a46', '#9a8054', '#b49a66', '#ccb680']) : theme === 'beach' ? LEAF.beach : LEAF.grass;
    const sway = [0, 1, 0, -1][frame % 4];
    // blade clusters: [baseX, baseY, height, lean]
    const rows = [
      [[1, 9, 8, -1], [4, 9, 9, 0], [7, 9, 8, 1], [10, 9, 9, 0], [13, 9, 8, 1]],
      [[2, 13, 7, 0], [5, 13, 8, 1], [8, 13, 7, -1], [11, 13, 8, 0], [14, 13, 7, -1]],
      [[0, 17, 7, 1], [3, 17, 8, 0], [6, 17, 7, -1], [9, 17, 8, 1], [12, 17, 7, 0], [15, 17, 7, -1]],
    ];
    const H = 20, O = 4;   // painter is 16x20, 4px above the tile
    for (let ri = 0; ri < rows.length; ri++) {
      if (front && ri < 2) continue;
      for (const [bx, by, h, lean] of rows[ri]) {
        const y0 = by + O - 4;
        for (let j = 0; j < h; j++) {
          const t = j / h, yy = y0 - j + 3;
          const xx = bx + Math.round(lean * t * 2 + (t > .55 ? sway * (t - .55) * 2.2 : 0));
          const k = t > .82 ? 8 : t > .6 ? 7 : t > .35 ? 5 : ri === 2 ? 4 : 3;
          p.set(xx, yy, GR[k]);
          if (t < .7) p.set(xx + 1, yy, GR[Math.max(1, k - 2)]);
          if (t < .3) p.set(xx - 1, yy, GR[Math.max(1, k - 1)]);
        }
      }
    }
    if (!front) for (let x = 0; x < 16; x++) for (let y = 12; y < H; y++) if (!p.A(x, y)) p.set(x, y, GR[y > 17 ? 1 : 2]);
    p.outline(null, { k: .3 });
  }
  function flowerSprite(p, v, theme, frame) {
    const sets = [['#ff5a6a', '#c02a40', '#ffd0d8'], ['#ffe066', '#d0a020', '#fff6c0'], ['#ffffff', '#b8c4dc', '#ffffff'], ['#ff9ad0', '#c8508c', '#ffd8ec'], ['#8ac0ff', '#3a6ad0', '#d8ecff']];
    const spots = [[3, 4], [11, 3], [7, 9], [2, 12], [12, 11]];
    const leaf = R(['#1c4e28', '#2f7331', '#4a9a3e']);
    spots.forEach(([sx, sy], i) => {
      const pick = sets[(v + i * 2) % sets.length].map(P);
      const wob = (frame % 2) && (i % 2) ? 1 : 0, x = sx + wob, y = sy;
      p.set(sx, y + 2, leaf[1]); p.set(sx, y + 3, leaf[1]); p.set(sx - 1, y + 3, leaf[2]); p.set(sx + 1, y + 2, leaf[0]);
      p.set(x, y - 1, pick[0]); p.set(x - 1, y, pick[0]); p.set(x + 1, y, pick[1]); p.set(x, y + 1, pick[1]);
      p.set(x - 1, y - 1, pick[2], 160); p.set(x, y, P('#ffe070'));
    });
    p.outline(null, { k: .28 });
  }
  // hedge block: raised top of clipped leaves, darker front face
  function hedgeSprite(map, c) {
    const same = (dx, dy) => { const q = map.cellAny(c.x + dx, c.y + dy); return q && q.g === 'hedge'; };
    const n = same(0, -1), s = same(0, 1), e = same(1, 0), w = same(-1, 0);
    const key = `hedge|${map.theme}|${n}${s}${e}${w}|${(c.x + c.y * 3) % 4}`;
    const img = get(key, 16, 24, p => {
      const L = leafOf(map.theme === 'snow' ? 'snow' : map.theme === 'ash' ? 'ash' : 'grass');
      const faceTop = s ? 99 : 13;
      for (let y = n ? 8 : 1; y < 24; y++) for (let x = 0; x < 16; x++) {
        if (!w && x === 0 && (y < 4 || y > 21)) continue;
        if (!e && x === 15 && (y < 4 || y > 21)) continue;
        const wx = c.x * 16 + x, wy = y;
        const blob = G.vnoise(wx / 2.6, wy / 2.6, 17), fine = h2(wx, wy + c.y * 16, 18);
        let k;
        if (y < faceTop) { k = blob > .62 ? 7 : blob > .38 ? 6 : 5; if (fine > .9) k = 8; if (fine < .08) k = 4; if (y < 3 && !n) k = Math.min(8, k + 1); }
        else { k = blob > .6 ? 4 : blob > .35 ? 3 : 2; if (fine > .9) k = 5; if (y > 21) k = 1; }
        if (!w && x < 2) k = Math.max(1, k - 1);
        if (!e && x > 13) k = Math.max(1, k - 2);
        p.set(x, y, L[k]);
      }
      if (!s) for (let x = 0; x < 16; x++) { p.set(x, faceTop, L[2]); p.set(x, faceTop - 1, L[8]); }
      p.outline(null, { k: .3 });
    });
    return { img, ox: 0, oy: -8, base: 1 };
  }

  // ------------------------------------------------------------- trees ---
  // leaf clumps shaded by their own normal blended with the canopy's
  function canopy(p, clumps, C, L, o = {}) {
    const Lg = G.LIGHT, n = L.length;
    clumps.sort((a, b) => a.y - b.y);
    for (const k of clumps) {
      for (let y = Math.floor(k.y - k.r); y <= Math.ceil(k.y + k.r); y++) for (let x = Math.floor(k.x - k.r); x <= Math.ceil(k.x + k.r); x++) {
        const nx = (x + .5 - k.x) / k.r, ny = (y + .5 - k.y) / (k.r * (o.squash || 1)), d2 = nx * nx + ny * ny;
        if (d2 > 1) continue;
        const nz = Math.sqrt(1 - d2), Il = nx * Lg[0] + ny * Lg[1] + nz * Lg[2];
        const gx = (x + .5 - C.x) / C.rx, gy = (y + .5 - C.y) / C.ry, gd = Math.min(1, gx * gx + gy * gy), Ig = gx * Lg[0] + gy * Lg[1] + Math.sqrt(1 - gd) * Lg[2];
        let I = (Il * .45 + Ig * .55) * .55 + .34 + (o.bias || 0);
        I += (h2(x, y, o.seed || 1) - .5) * .09;
        // each leaf clump reads as its own cluster: shadowed underside rim
        if (d2 > .72 && ny > .15) I -= .16 + (d2 - .72) * .5;
        p.set(x, y, L[G.clamp(Math.floor(I * n), 1, n - 1)]);
      }
    }
    // leaf texture: little lit crescents with a shadow under them
    for (let y = 1; y < p.h - 1; y++) for (let x = 1; x < p.w - 1; x++) {
      if (!p.A(x, y) || !p.A(x, y + 1) || h2(x, y, (o.seed || 1) + 9) > .14) continue;
      const c = p.get(x, y); p.set(x, y + 1, G.darkc(c, .22)); p.shade(x, y, .16);
    }
  }
  function broadTree(v, theme) {
    return get(`tree|${v}|${theme}`, 32, 44, p => {
      const L = leafOf(theme === 'beach' ? 'beach' : theme === 'dusk' ? 'dusk' : theme === 'snow' ? 'snow' : 'grass');
      // trunk + roots
      p.cyl(13, 27, 6, 15, BARK);
      p.set(12, 41, BARK[2]); p.set(12, 40, BARK[3]); p.set(19, 41, BARK[1]); p.set(19, 40, BARK[1]); p.set(11, 41, BARK[2]); p.set(20, 41, BARK[0]);
      for (let y = 30; y < 41; y += 3) p.set(14 + (y % 2), y, BARK[1]);
      p.set(16, 33, BARK[6]); p.set(16, 34, BARK[5]);
      const rng = new G.RNG(700 + v * 31);
      const C = { x: 16, y: 16, rx: 14.5, ry: 14 };
      const clumps = [];
      const ring = 9;
      for (let i = 0; i < ring; i++) {
        const a = -Math.PI / 2 + i / ring * Math.PI * 2 + rng.range(-.18, .18);
        clumps.push({ x: C.x + Math.cos(a) * rng.range(8.5, 10.2), y: C.y + Math.sin(a) * rng.range(7.8, 9.2), r: rng.range(5.2, 6.4) });
      }
      for (let i = 0; i < 5; i++) clumps.push({ x: C.x + rng.range(-5.5, 5.5), y: C.y + rng.range(-6, 4), r: rng.range(5.5, 7) });
      canopy(p, clumps, C, L, { seed: v + 3 });
      if (theme === 'dusk') for (let i = 0; i < 9; i++) { const x = rng.int(6, 26), y = rng.int(5, 26); if (p.A(x, y)) { p.set(x, y, P('#fff0f8')); p.set(x + 1, y, P('#ffc0e0')); } }
      if (theme === 'beach' || (theme === 'grass' && v === 2)) for (let i = 0; i < 4; i++) { const x = rng.int(8, 24), y = rng.int(10, 24); if (p.A(x, y)) { p.set(x, y, P('#e8483a')); p.set(x, y - 1, P('#ff8a70')); p.set(x + 1, y + 1, P('#8a1a1a')); } }
      p.outline(null, { k: .26 });
    });
  }
  function pineTree(v, theme) {
    return get(`pine|${v}|${theme}`, 30, 48, p => {
      const snow = theme === 'snow';
      const L = snow ? LEAF.snow : theme === 'dusk' ? R(['#0c1e26', '#102a32', '#16383e', '#1e4a4c', '#285e5a', '#347268', '#468a7a', '#62a490', '#88c0aa']) : R(['#0a2018', '#0e2c1e', '#143c24', '#1c502c', '#266636', '#327c3e', '#46944a', '#62ae58', '#8ac86c']);
      p.cyl(13, 37, 4, 9, BARK); p.set(12, 45, BARK[2]); p.set(17, 45, BARK[0]);
      const cx = 15, tiers = [[2, 13, 6.5], [9, 14, 9], [17, 15, 11.5], [25, 15, 13.5]];
      const Lg = G.LIGHT, n = L.length;
      tiers.forEach(([top, h, hw], ti) => {
        for (let y = top; y < top + h; y++) {
          const t = (y - top) / h, w = hw * Math.pow(t, .85) + .6;
          for (let x = Math.floor(cx - w); x <= Math.ceil(cx + w); x++) {
            const u = (x + .5 - cx) / w; if (Math.abs(u) > 1) continue;
            // scalloped hem: needles droop in points along the bottom edge
            if (y > top + h - 3 && (Math.abs(Math.sin((x + ti * 2) * 1.3)) > .55 + (top + h - y) * .12)) continue;
            const nz = Math.sqrt(Math.max(0, 1 - u * u)), ny = -.45 + t * .5;
            let I = (u * Lg[0] + ny * Lg[1] + nz * Lg[2]) * .55 + .5 - t * .18;
            I += (h2(x, y, 5 + v) - .5) * .12;
            p.set(x, y, L[G.clamp(Math.floor(I * n), 1, n - 1)]);
          }
        }
        // needle strokes
        for (let y = top + 2; y < top + h - 1; y += 2) for (let x = cx - Math.floor(hw * (y - top) / h); x < cx + hw * (y - top) / h; x += 3) if (p.A(x, y) && p.A(x + 1, y + 1)) { p.set(x + 1, y + 1, G.darkc(p.get(x, y), .25)); }
        if (snow) {
          const S = RMP().snow;
          for (let y = top; y < top + Math.max(3, h * .45); y++) { const t = (y - top) / h, w = hw * Math.pow(t, .85); for (let x = Math.floor(cx - w); x <= cx + w * .6; x++) if (p.A(x, y) && h2(x, y, 3) > .15) p.set(x, y, S[x < cx ? 7 : 5]); }
          for (let x = Math.floor(cx - hw * .8); x < cx + hw * .7; x++) if (p.A(x, top + h - 3) && h2(x, ti, 4) > .35) p.set(x, top + h - 3, S[6]);
        }
      });
      p.outline(null, { k: .25 });
    });
  }
  function palmTree(theme) {
    return get(`palm|${theme}`, 32, 46, p => {
      const T = R(['#3a2414', '#5a3a20', '#7a5230', '#9a6c40', '#b88a56', '#d4a870']);
      for (let y = 14; y < 44; y++) { const x = 14 + Math.round(Math.sin(y / 7) * 2); p.set(x, y, T[3]); p.set(x + 1, y, T[4]); p.set(x + 2, y, T[2]); p.set(x + 3, y, T[1]); if (y % 3 === 0) { p.set(x, y, T[2]); p.set(x + 3, y, T[0]); } }
      const L = LEAF.beach;
      const fronds = [[-13, 5], [13, 5], [-10, -3], [10, -4], [-2, -9], [4, 9], [-6, 8]];
      for (const [dx, dy] of fronds) {
        for (let k = 0; k <= 14; k++) {
          const t = k / 14, x = 16 + dx * t, y = 13 + dy * t + t * t * 6;
          const wdt = Math.sin(t * Math.PI) * 2.6;
          for (let s = -wdt; s <= wdt; s += .5) { const yy = Math.round(y + s * .7), xx = Math.round(x - s * .25); p.set(xx, yy, L[s < 0 ? 7 : s > wdt * .5 ? 3 : 5]); }
          p.set(Math.round(x), Math.round(y), L[8]);
        }
      }
      p.circ(14, 15, 2, P('#6a4424')); p.circ(18, 16, 2, P('#5a3a1c')); p.set(13, 14, P('#9a6a3a'));
      p.outline(null, { k: .25 });
    });
  }
  function deadTree(v) {
    return get(`dead|${v}`, 28, 40, p => {
      const T = R(['#161010', '#241a18', '#342624', '#463430', '#58443e', '#6c564e']);
      p.cyl(12, 14, 5, 25, T);
      const br = [[14, 18, 4, 8], [14, 22, 24, 12], [13, 14, 9, 3], [15, 15, 20, 5], [5, 9, 3, 5], [21, 13, 24, 9]];
      for (const [x0, y0, x1, y1] of br) { p.line(x0, y0, x1, y1, T[3]); p.line(x0, y0 + 1, x1, y1 + 1, T[1]); }
      p.set(11, 38, T[2]); p.set(17, 38, T[0]);
      p.outline(null, { k: .3 });
    });
  }
  function smallTree(theme) {
    return get(`st|${theme}`, 18, 22, p => {
      const L = leafOf(theme === 'snow' ? 'snow' : theme === 'beach' ? 'beach' : 'grass');
      p.cyl(8, 15, 3, 6, BARK);
      const C = { x: 9, y: 9, rx: 8, ry: 7.5 };
      canopy(p, [{ x: 9, y: 9, r: 6.5 }, { x: 5.5, y: 10.5, r: 4 }, { x: 12.5, y: 10.5, r: 4 }, { x: 9, y: 5, r: 4.3 }], C, L, { seed: 44 });
      // cut marks so it reads as cuttable
      p.line(11, 16, 14, 13, P('#f4ecd0')); p.line(12, 17, 15, 14, P('#c8b890'));
      p.outline(null, { k: .26 });
    });
  }
  // ------------------------------------------------------------- rocks ---
  function rockSprite(kind, theme) {
    return get(`rock|${kind}|${theme}`, 18, 18, p => {
      const S = theme === 'snow' ? STONE_SNOW : theme === 'ash' ? STONE_ASH : STONE;
      if (kind === 'boulder') {
        p.sphere(9, 9, 7.6, 7.4, S, { bias: .05, jitter: .08 });
        p.line(10, 3, 12, 7, S[2]); p.line(4, 12, 7, 13, S[2]); p.set(5, 5, S[7]); p.set(6, 5, S[6]);
      } else {
        p.sphere(9, 11, 8.2, 6, S, { bias: .04, jitter: .1 });
        p.sphere(6.5, 9, 4.5, 3.5, S, { bias: .1 });
        if (kind === 'crack') { p.line(9, 6, 8, 10, S[0]); p.line(8, 10, 11, 13, S[0]); p.line(8, 10, 4, 12, S[0]); p.line(11, 13, 13, 15, S[0]); p.set(10, 7, S[6]); }
        else { p.line(11, 8, 14, 12, S[2]); p.set(12, 8, S[6]); }
        if (theme !== 'snow' && theme !== 'ash') { p.set(4, 14, P('#3a7a30')); p.set(5, 14, P('#4e9a3a')); p.set(13, 15, P('#3a7a30')); }
        if (theme === 'snow') for (let x = 3; x < 13; x++) if (p.A(x, 6)) { p.set(x, 5 + (x % 3 === 0 ? 1 : 0), RMP().snow[7]); }
      }
      p.outline(null, { k: .3 });
    });
  }
  // ------------------------------------------------------ small props ----
  function fenceSprite(mask, theme) {
    return get(`fence|${mask}|${theme}`, 16, 22, p => {
      const W = theme === 'snow' ? R(['#5a4a3e', '#7a6656', '#a08a76', '#c8b4a0', '#ece2d6']) : R(['#6a6a74', '#9a9aa6', '#c8c8d2', '#e8e8ee', '#ffffff']);
      const hz = (mask & 2) || (mask & 8) || !(mask & 5);
      const post = (x) => { for (let y = 6; y < 21; y++) { p.set(x, y, W[3]); p.set(x + 1, y, W[2]); p.set(x + 2, y, W[1]); } p.set(x + 1, 5, W[3]); p.set(x, 6, W[4]); };
      if (hz) {
        for (let x = 0; x < 16; x++) { p.set(x, 9, W[4]); p.set(x, 10, W[2]); p.set(x, 15, W[4]); p.set(x, 16, W[2]); }
        post(1); post(6); post(11);
      }
      if ((mask & 1) || (mask & 4)) { for (let y = (mask & 1) ? 0 : 6; y < ((mask & 4) ? 22 : 21); y++) { p.set(6, y, W[3]); p.set(7, y, W[2]); p.set(8, y, W[1]); } post(6); }
      if (theme === 'snow') for (let x = 0; x < 16; x++) if (p.A(x, 9)) p.set(x, 8, RMP().snow[7]);
      p.outline(null, { k: .35 });
    });
  }
  function lampSprite(theme) {
    return get(`lamp|${theme}`, 16, 40, p => {
      const I = R(['#101218', '#1c2028', '#2a2f3a', '#3c4250', '#566070', '#7a8494']);
      p.cyl(7, 14, 3, 24, I); p.rect(5, 35, 7, 3, I[2]); p.hline(5, 11, 35, I[4]); p.rect(6, 33, 5, 2, I[3]);
      // lantern head
      p.rect(3, 4, 10, 2, I[2]); p.hline(3, 12, 4, I[4]); p.rect(5, 1, 6, 3, I[1]); p.set(7, 0, I[3]); p.set(8, 0, I[2]);
      const glow = theme === 'dusk' ? R(['#5ab8d8', '#a8ecff', '#ffffff']) : R(['#f0a040', '#ffe08a', '#fffbe0']);
      p.rect(4, 6, 8, 7, I[1]); p.rect(5, 7, 6, 5, glow[1]); p.rect(5, 7, 2, 5, glow[2]); p.set(10, 11, glow[0]); p.hline(5, 10, 11, glow[0]);
      p.vline(8, 7, 11, I[2]); p.rect(4, 13, 8, 1, I[3]);
      p.outline(null, { k: .5 });
    });
  }
  function lanternPost() {
    return get('lanternpost', 16, 22, p => {
      const W = BARK; p.cyl(7, 8, 3, 13, W);
      p.rect(4, 1, 8, 8, P('#2a1c16')); p.rect(5, 2, 6, 6, P('#ff9a3a')); p.rect(5, 2, 3, 3, P('#ffe0a0')); p.rect(6, 5, 4, 3, P('#ffc060')); p.hline(3, 12, 1, P('#4a3024')); p.hline(4, 11, 0, P('#4a3024'));
      p.outline(null, { k: .4 });
    });
  }
  function crystalSprite(v) {
    return get(`crystal|${v % 2}`, 18, 20, p => {
      const c = v % 2 ? R(['#1a4a6a', '#2a7aa8', '#4ab0e0', '#8ae0ff', '#d0f8ff', '#ffffff']) : R(['#3a1e6a', '#5a36a0', '#8a5ad8', '#b88af0', '#e0ccff', '#ffffff']);
      const shard = (x, y, w, h, lean) => {
        for (let j = 0; j < h; j++) { const t = j / h, ww = Math.max(1, Math.round(w * Math.min(1, t * 2.5))), xx = Math.round(x + lean * (1 - t)); for (let i = 0; i < ww; i++) p.set(xx + i, y + j, c[i === 0 ? 4 : i === ww - 1 ? 1 : i < ww / 2 ? 3 : 2]); }
      };
      shard(7, 1, 4, 16, 0); shard(2, 7, 3, 10, -1); shard(12, 5, 3, 12, 1); shard(10, 10, 2, 7, 0);
      p.set(8, 3, c[5]); p.set(8, 4, c[5]); p.set(3, 9, c[5]);
      p.outline(c[0]);
    });
  }
  // generic small props are painted at 16x16..16x24 and share one outline pass
  function prop(kind, frame) {
    const key = `prop|${kind}|${frame}`;
    const sizes = { sign: [16, 18], mailbox: [16, 20], bench: [16, 16], flowerpot: [16, 18], grave: [16, 18], snowman: [16, 22], fountain: [16, 18], statue: [16, 26], tent: [18, 18], stall: [16, 20], crate: [16, 18], barrel: [16, 18], boat: [16, 16], cauldron: [16, 16], orbball: [16, 16] };
    const [w, h] = sizes[kind] || [16, 16];
    const img = get(key, w, h, p => paintProp(p, kind, frame, w, h));
    return { img, ox: 0, oy: 16 - h };
  }
  // a plaza fountain spanning w x h cells: octagonal-ish basin, two tiers and a spray (2D view)
  function fountainBig(cw, ch, frame) {
    const W = cw * 16, H = ch * 16 + 14;
    return get(`fountainBig|${cw}|${ch}|${frame}`, W, H, p => {
      const S = STONE, Wt = RMP().water, cx = W / 2 - .5, by = H - 3;
      const rx = W / 2 - 1, ry = Math.min(ch * 8 - 2, rx * .62);
      const cy = by - ry;
      p.ell(cx, cy + 1.5, rx, ry, S[2]); p.ell(cx, cy, rx, ry, S[5]); p.ell(cx, cy - .5, rx - 1.5, ry - 1.5, S[6]);
      p.ell(cx, cy, rx - 3, ry - 2.6, S[3]); p.ell(cx, cy + .5, rx - 3.6, ry - 3.2, Wt[frame ? 5 : 4]);
      for (let i = 0; i < 7; i++) { const a = i / 7 * Math.PI * 2 + frame * .4; p.set(Math.round(cx + Math.cos(a) * (rx - 6)), Math.round(cy + .5 + Math.sin(a) * (ry - 5)), Wt[8]); }
      // pedestal, lower bowl, upper bowl, jet
      const ph = Math.round(ry * 1.6 + 6), px0 = Math.round(cx) - 1;
      p.rect(px0, cy - ph + 4, 3, ph - 2, S[6]); p.rect(px0 + 2, cy - ph + 4, 1, ph - 2, S[4]);
      const b1 = Math.max(4, rx * .42); p.ell(cx, cy - ph * .55, b1, b1 * .38, S[4]); p.ell(cx, cy - ph * .55 - .6, b1 - .8, b1 * .3, Wt[frame ? 4 : 5]);
      const b2 = Math.max(2.5, rx * .22); p.ell(cx, cy - ph + 4, b2, b2 * .4, S[5]);
      for (let k = 0; k < 4; k++) p.set(Math.round(cx) + (k % 2 ? 1 : 0) - (frame && k > 1 ? 1 : 0), cy - ph + 3 - k, Wt[8 - (k > 2 ? 1 : 0)]);
      // falling sheets from the lower bowl into the basin
      for (let y = Math.round(cy - ph * .55 + 1); y < cy; y++) for (const sx of [-1, 1]) { const x = Math.round(cx + sx * (b1 - .5)); if ((y + frame) % 3) p.set(x, y, Wt[7]); }
    });
  }
  function paintProp(p, kind, frame, w, h) {
    const WD = R(['#2a1a10', '#46301c', '#664628', '#865e36', '#a67a48', '#c4985e', '#dcb47a']);
    const b = h - 16;   // extra height above the tile
    switch (kind) {
      case 'sign': {
        p.cyl(7, b + 9, 2, 7, WD);
        for (let y = b + 1; y < b + 10; y++) for (let x = 1; x < 15; x++) p.set(x, y, WD[y === b + 1 ? 6 : y === b + 9 ? 2 : (x + y) % 5 === 0 ? 4 : 5]);
        p.hline(3, 12, b + 4, WD[3]); p.hline(3, 10, b + 6, WD[3]); p.vline(1, b + 1, b + 9, WD[4]); p.vline(14, b + 1, b + 9, WD[3]);
        break;
      }
      case 'mailbox': {
        p.cyl(7, b + 9, 2, 7, WD);
        const Rr = R(['#5a1414', '#8a2020', '#b83030', '#de4a44', '#f47a6a', '#ffb0a0']);
        for (let y = b + 2; y < b + 9; y++) for (let x = 3; x < 13; x++) p.set(x, y, Rr[y < b + 4 ? 5 : x < 5 ? 4 : x > 11 ? 1 : 3]);
        for (let x = 4; x < 12; x++) p.set(x, b + 1, Rr[4]);
        p.rect(12, b, 1, 5, P('#303038')); p.rect(12, b, 3, 2, P('#ffd84a')); p.hline(4, 11, b + 6, Rr[1]);
        break;
      }
      case 'bench': {
        const Iron = R(['#14161c', '#262a32', '#3a404a']);
        for (let x = 1; x < 15; x++) { p.set(x, 4, WD[6]); p.set(x, 5, WD[4]); p.set(x, 6, WD[3]); p.set(x, 8, WD[5]); p.set(x, 9, WD[4]); p.set(x, 10, WD[2]); }
        p.rect(2, 7, 1, 8, Iron[1]); p.rect(13, 7, 1, 8, Iron[1]); p.rect(2, 3, 1, 4, Iron[2]); p.rect(13, 3, 1, 4, Iron[2]);
        break;
      }
      case 'flowerpot': {
        const T = R(['#5a2a14', '#8a4424', '#b45c34', '#d47a4a', '#ec9c6a']);
        for (let y = b + 9; y < b + 16; y++) { const inset = y > b + 13 ? 1 : 0; for (let x = 4 + inset; x < 12 - inset; x++) p.set(x, y, T[x < 6 ? 4 : x > 9 ? 1 : 3]); }
        p.hline(3, 12, b + 9, T[4]); p.hline(3, 12, b + 10, T[2]);
        const L = LEAF.grass; p.sphere(8, b + 7, 5, 3.6, L, { bias: .05 });
        [[5, b + 5, '#ff5a7a'], [10, b + 5, '#ffd84a'], [8, b + 3, '#ff9ad0'], [11, b + 8, '#ffffff'], [4, b + 8, '#8ac0ff']].forEach(([x, y, c]) => { const q = P(c); p.set(x, y, q); p.set(x + 1, y, q); p.set(x, y + 1, G.darkc(q, .2)); p.set(x, y - 1, G.mixc(q, [255, 255, 255], .5)); });
        break;
      }
      case 'grave': {
        const S = STONE;
        for (let y = b + 3; y < b + 15; y++) for (let x = 4; x < 12; x++) { if (y < b + 5 && (x === 4 || x === 11)) continue; p.set(x, y, S[x < 6 ? 6 : x > 9 ? 3 : 5]); }
        p.rect(7, b + 6, 2, 6, S[2]); p.rect(6, b + 7, 4, 1, S[2]); p.hline(3, 12, b + 15, S[2]);
        break;
      }
      case 'snowman': {
        const S = RMP().snow;
        p.sphere(8, b + 12, 5.6, 5, S, { bias: .15 }); p.sphere(8, b + 5.5, 3.8, 3.5, S, { bias: .15 });
        p.set(7, b + 5, P('#202028')); p.set(9, b + 5, P('#202028')); p.rect(8, b + 6, 3, 1, P('#ff8a3a'));
        p.rect(5, b, 6, 2, P('#2a2a34')); p.rect(4, b + 2, 8, 1, P('#2a2a34')); p.hline(5, 10, b + 8, P('#d83a3a')); p.rect(10, b + 8, 1, 3, P('#b82a2a'));
        break;
      }
      case 'fountain': {
        const S = STONE, Wt = RMP().water;
        p.ell(8, b + 11, 7.6, 4.6, S[3]); p.ell(8, b + 10.5, 7, 4, S[5]); p.ell(8, b + 10.5, 5.8, 3, Wt[frame % 2 ? 5 : 4]);
        p.rect(7, b + 3, 2, 8, S[6]); p.rect(8, b + 3, 1, 8, S[4]); p.ell(8, b + 3, 2.4, 1.2, S[5]);
        p.set(8, b + 1, Wt[8]); p.set(7, b + (frame % 2 ? 2 : 1), Wt[7]); p.set(9, b + (frame % 2 ? 1 : 2), Wt[7]);
        for (let i = 0; i < 4; i++) p.set(4 + i * 3, b + 10 + (i + frame) % 2, Wt[8]);
        break;
      }
      case 'statue': {
        const S = R(['#3a3c46', '#50525e', '#686a76', '#80828e', '#9a9ca6', '#b4b6be', '#d0d2d8']);
        p.rect(3, b + 11, 10, 5, S[3]); p.hline(3, 12, b + 11, S[5]); p.rect(3, b + 15, 10, 1, S[1]);
        p.sphere(8, b + 7, 4, 5, S, { bias: .08 }); p.sphere(8, b + 2, 3, 3, S, { bias: .1 });
        p.ell(8, b + 1.2, 3.6, 1.3, S[5]);
        break;
      }
      case 'tent': {
        const Tn = R(['#5a1a14', '#8a2a1e', '#b43e2a', '#d85a3a', '#f08a5a']);
        for (let y = 1; y < 16; y++) { const hw = y * .55; for (let x = Math.round(9 - hw); x <= Math.round(9 + hw); x++) p.set(x, y, Tn[x < 9 ? ((y >> 1) % 2 ? 4 : 3) : ((y >> 1) % 2 ? 2 : 1)]); }
        for (let y = 8; y < 16; y++) for (let x = 8; x < 11; x++) p.set(x, y, P('#2a120c'));
        break;
      }
      case 'stall': {
        for (let y = b + 8; y < b + 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, WD[y === b + 8 ? 6 : y > b + 14 ? 1 : 4]);
        for (let x = 0; x < 16; x++) for (let y = b + 1; y < b + 6; y++) p.set(x, y, P(((x >> 2) & 1) ? '#f8f4ec' : '#e0404a'));
        p.hline(0, 15, b + 6, P('#8a2a2a')); p.rect(3, b + 9, 3, 3, P('#ff8a3a')); p.rect(9, b + 9, 3, 3, P('#8ae05a')); p.set(3, b + 9, P('#ffc08a')); p.set(9, b + 9, P('#c8f8a0'));
        p.vline(1, b + 5, b + 8, WD[2]); p.vline(14, b + 5, b + 8, WD[2]);
        break;
      }
      case 'crate': {
        for (let y = b + 2; y < b + 16; y++) for (let x = 1; x < 15; x++) p.set(x, y, WD[y < b + 5 ? 6 : x < 3 ? 5 : x > 12 ? 2 : 4]);
        p.hline(1, 14, b + 5, WD[2]); p.line(3, b + 6, 12, b + 14, WD[2]); p.line(12, b + 6, 3, b + 14, WD[2]); p.rect(1, b + 10, 14, 1, WD[3]);
        break;
      }
      case 'barrel': {
        for (let y = b + 2; y < b + 16; y++) { const bulge = Math.round(Math.sin((y - b - 2) / 14 * Math.PI) * 1.5); for (let x = 3 - bulge; x < 13 + bulge; x++) { const u = (x - 8 + .5) / (5 + bulge); p.set(x, y, WD[G.clamp(Math.floor((1 - u) * 2.2 + 2), 1, 6)]); } }
        p.ell(8, b + 2.5, 4.6, 1.6, WD[5]); p.ell(8, b + 2.5, 3.4, 1, WD[3]);
        p.hline(2, 13, b + 6, P('#4a4c56')); p.hline(2, 13, b + 12, P('#4a4c56')); p.hline(3, 12, b + 5, P('#8a8c96'));
        break;
      }
      case 'boat': {
        p.ell(8, 10, 7.6, 4.5, WD[3]); p.ell(8, 9.5, 6.6, 3.2, WD[5]); p.ell(8, 9.8, 5.4, 2.2, WD[2]); p.hline(3, 12, 9, WD[6]);
        break;
      }
      case 'cauldron': {
        const K = R(['#101014', '#1c1c24', '#2a2a36', '#3c3c4a']);
        p.sphere(8, 9, 6.4, 5.4, K, { bias: .1 }); p.ell(8, 5.5, 5.2, 1.8, frame % 2 ? P('#8ae05a') : P('#6ac04a')); p.set(6, 5, P('#d0ffa0'));
        p.rect(3, 13, 2, 3, K[1]); p.rect(11, 13, 2, 3, K[1]);
        break;
      }
      case 'orbball': {
        const Rr = R(['#6a1414', '#a82424', '#d83a3a', '#f45a50', '#ff9a8a']), Wh = R(['#8a8a96', '#b8b8c4', '#dcdce4', '#ffffff']);
        for (let y = 3; y < 15; y++) for (let x = 2; x < 14; x++) {
          const nx = (x + .5 - 8) / 6, ny = (y + .5 - 9) / 6, d = nx * nx + ny * ny; if (d > 1) continue;
          const I = G.clamp((nx * G.LIGHT[0] + ny * G.LIGHT[1] + Math.sqrt(1 - d) * G.LIGHT[2]) * .5 + .5, 0, .99);
          p.set(x, y, y < 9 ? Rr[Math.floor(I * 5)] : Wh[Math.floor(I * 4)]);
        }
        p.hline(2, 13, 9, P('#1c1c22')); p.circ(8, 9.5, 2, P('#1c1c22')); p.circ(8, 9.5, 1.1, P('#ffffff')); p.set(5, 5, P('#ffd0c8'));
        break;
      }
    }
    p.outline(null, { k: .3 });
  }

  // --------------------------------------------------------- furniture ---
  function furniture(kind, frame) {
    const tall = { shelf: 26, plant: 22, pc: 20, machine: 22, healer: 18, counter: 18, statue: 26, tv: 18, dresser: 22, sidetable: 24, armchair: 18, fridge: 28, stove: 20, sink: 20, boxes: 20, floorlamp: 30, vending: 28, display: 20, whiteboard: 26, plant2: 26 };
    const h = tall[kind] || 16;
    const img = get(`fu|${kind}|${frame}`, 16, h, p => paintFurniture(p, kind, frame, h));
    return { img, ox: 0, oy: 16 - h };
  }
  function paintFurniture(p, kind, frame, h) {
    const b = h - 16, WD = R(['#2a1a10', '#46301c', '#664628', '#865e36', '#a67a48', '#c4985e', '#dcb47a']);
    const MET = R(['#1e222a', '#30363f', '#454c58', '#5e6674', '#7a8290', '#9aa2ae', '#c0c6ce', '#e4e8ec']);
    const box = (x, y, w, hh, top, ramp, topK = 5, faceK = 3) => {   // 3/4 box: lit top surface, front face
      for (let j = 0; j < hh; j++) for (let i = 0; i < w; i++) p.set(x + i, y + j, ramp[j < top ? (j === 0 ? topK + 1 : topK) : j === top ? faceK + 1 : i === 0 ? faceK + 1 : i === w - 1 ? faceK - 1 : faceK]);
      p.hline(x, x + w - 1, y + top, ramp[Math.max(0, faceK - 2)]);
    };
    switch (kind) {
      case 'counter': box(0, b + 2, 16, 14, 5, WD, 5, 3); p.hline(0, 15, b + 15, WD[1]); for (let x = 2; x < 16; x += 5) p.vline(x, b + 9, b + 14, WD[2]); break;
      case 'pc': {
        box(1, b + 11, 14, 5, 2, WD, 5, 3);
        p.rect(2, b + 1, 12, 10, MET[2]); p.rect(3, b + 2, 10, 7, frame % 2 ? P('#5ad0ff') : P('#48b8f0')); p.rect(3, b + 2, 4, 2, P('#d8f6ff'));
        p.hline(4, 11, b + 5, P('#2a88c8')); p.hline(4, 9, b + 7, P('#2a88c8')); p.rect(6, b + 10, 4, 1, MET[1]); p.hline(2, 13, b + 1, MET[4]);
        break;
      }
      case 'shelf': {
        box(0, 0, 16, h, 2, WD, 5, 2);
        const cols = ['#c84a4a', '#4a7ac8', '#4ab86a', '#e8b83a', '#9a5ac8', '#e8e0d0', '#3a8a8a'];
        for (let r = 0; r < 3; r++) {
          const y0 = 4 + r * 7;
          p.rect(1, y0, 14, 6, WD[1]);
          for (let x = 2; x < 14;) { const bw = 1 + (h2(x, r, 7) > .6 ? 1 : 0), bh = 4 + (h2(x, r, 8) > .5 ? 1 : 0), col = G.rampFrom(cols[Math.floor(h2(x, r, 9) * cols.length)], 3); for (let i = 0; i < bw; i++) for (let j = 0; j < bh; j++) p.set(x + i, y0 + 6 - bh + j, col[i === 0 ? 2 : 1]); x += bw + (h2(x, r, 10) > .8 ? 1 : 0); }
          p.hline(1, 14, y0 + 6, WD[5]);
        }
        break;
      }
      case 'bed_top': case 'bed_bot': case 'bed': {
        const Bl = R(['#1a2a5a', '#243a7a', '#2e4e9e', '#3c66c0', '#5a86dc', '#86aaf0', '#b8d0ff']);
        const top = kind !== 'bed_bot', bot = kind !== 'bed_top';
        if (top) { box(0, 0, 16, 4, 1, WD, 5, 3); }
        const y0 = top ? 4 : 0, y1 = bot ? 13 : 16;
        for (let y = y0; y < y1; y++) for (let x = 1; x < 15; x++) p.set(x, y, P('#eeeef4'));
        if (top) { for (let y = 5; y < 9; y++) for (let x = 3; x < 13; x++) p.set(x, y, y === 8 ? P('#c8ccd8') : x === 3 ? P('#ffffff') : P('#f4f4fa')); }
        const qy = top ? 10 : 0;
        for (let y = qy; y < y1; y++) for (let x = 1; x < 15; x++) p.set(x, y, Bl[y === qy && top ? 6 : x === 1 ? 5 : x === 14 ? 2 : ((x + y) % 6 === 0 ? 3 : 4)]);
        if (top) p.hline(1, 14, qy + 1, Bl[5]);
        p.vline(0, y0, y1 - 1, WD[3]); p.vline(15, y0, y1 - 1, WD[2]);
        if (bot) box(0, 13, 16, 3, 1, WD, 5, 3);
        break;
      }
      case 'table': box(1, 3, 14, 10, 7, WD, 5, 3); p.rect(2, 13, 2, 3, WD[2]); p.rect(12, 13, 2, 3, WD[1]); p.ell(8, 6, 2.6, 1.6, P('#f4f4f8')); p.ell(8, 6, 1.4, .8, P('#d0d4e0')); break;
      case 'tv': {
        box(1, b + 11, 14, 5, 2, WD, 5, 3);
        p.rect(1, b + 1, 14, 10, MET[1]); p.rect(2, b + 2, 12, 7, frame % 2 ? P('#3a78c8') : P('#4a88d8')); p.rect(3, b + 3, 5, 2, P('#a8d8ff')); p.hline(2, 13, b + 1, MET[3]);
        break;
      }
      case 'plant': {
        const T = R(['#5a2a14', '#8a4424', '#b45c34', '#d47a4a', '#ec9c6a']);
        for (let y = b + 10; y < b + 16; y++) for (let x = 4; x < 12; x++) p.set(x, y, T[x < 6 ? 4 : x > 9 ? 1 : 3]);
        p.hline(3, 12, b + 10, T[4]);
        const L = LEAF.grass;
        for (const [dx, dy, r] of [[0, 0, 5], [-3, 3, 3.6], [3, 3, 3.6], [-1, -4, 3.4], [2, -3, 3]]) p.sphere(8 + dx, b + 5 + dy, r, r * .9, L, { bias: .04 });
        break;
      }
      case 'dresser': {   // three drawers, brass knobs, a vase and a photo on top
        box(0, b + 2, 16, 14, 3, WD, 5, 3);
        for (let r = 0; r < 3; r++) { const y = b + 6 + r * 3; p.hline(1, 14, y + 2, WD[1]); p.set(5, y + 1, P('#e8c060')); p.set(10, y + 1, P('#e8c060')); }
        p.rect(3, b - 3, 3, 5, P('#5a8ac8')); p.set(3, b - 3, P('#8ab8f0')); for (const [x, y] of [[4, b - 5], [3, b - 6], [5, b - 6], [4, b - 7]]) p.set(x, y, P('#ff8aa0'));
        p.rect(9, b - 2, 5, 4, P('#3a2a1a')); p.rect(10, b - 1, 3, 2, P('#e8d8b0'));
        break;
      }
      case 'sidetable': {  // small round-legged table carrying a lamp with a pleated shade
        box(2, b + 8, 12, 5, 2, WD, 5, 3); p.rect(3, b + 13, 1, 3, WD[1]); p.rect(12, b + 13, 1, 3, WD[1]);
        p.rect(7, b + 3, 2, 5, P('#c8a060'));
        const SH = R(['#a8704a', '#e8c890', '#fff0c8']);
        for (let y = 0; y < 5; y++) for (let x = 4 - Math.floor(y / 2); x < 12 + Math.floor(y / 2); x++) p.set(x, b - 2 + y, SH[x < 7 ? 2 : x > 10 ? 0 : 1]);
        p.hline(3, 12, b + 3, SH[0]);
        break;
      }
      case 'armchair': {
        const Up = R(['#3a1a2a', '#5a2a3e', '#7a3a54', '#9a4e6a', '#bc6a86', '#dc90a8']);
        box(1, b + 1, 14, 6, 2, Up, 4, 3);                        // back
        box(0, b + 6, 3, 9, 2, Up, 4, 2); box(13, b + 6, 3, 9, 2, Up, 4, 2);   // arms
        box(3, b + 8, 10, 7, 3, Up, 4, 3);                        // seat cushion
        p.rect(2, b + 15, 2, 1, WD[1]); p.rect(12, b + 15, 2, 1, WD[1]);
        break;
      }
      case 'fridge': {
        const Fr = R(['#5a6a70', '#8a9aa0', '#b8c8cc', '#d8e6e8', '#eef6f6', '#ffffff']);
        box(1, 0, 14, h, 2, Fr, 4, 3);
        p.hline(2, 13, 11, Fr[1]); p.rect(12, 4, 1, 5, Fr[0]); p.rect(12, 14, 1, 7, Fr[0]);
        p.set(4, 6, P('#e84a4a')); p.set(6, 7, P('#4ab86a')); p.rect(4, 15, 3, 4, P('#fff6d8')); p.hline(4, 6, 16, P('#c8a060'));
        break;
      }
      case 'stove': {
        box(0, b + 2, 16, 14, 5, R(['#2a2c34', '#3a3e48', '#50566a', '#6a7286', '#8a92a6', '#aab2c4', '#ccd2de']), 5, 3);
        for (const [x, y] of [[4, b + 3], [11, b + 3], [4, b + 5], [11, b + 5]]) { p.set(x - 1, y, P('#1a1a20')); p.set(x, y, P('#1a1a20')); p.set(x + 1, y, P('#1a1a20')); }
        p.rect(3, b + 10, 10, 4, P('#1c1c24')); p.rect(4, b + 11, 8, 2, frame % 2 ? P('#ff8a3a') : P('#e8702a'));
        p.rect(9, b - 2, 6, 5, P('#b84a3a')); p.hline(9, 14, b - 2, P('#e87a5a')); p.set(8, b - 1, P('#3a2a2a'));
        break;
      }
      case 'sink': {
        box(0, b + 2, 16, 14, 5, WD, 5, 3); p.rect(1, b + 2, 14, 5, P('#d8dce4'));
        p.rect(3, b + 3, 8, 3, P('#8a9aac')); p.rect(4, b + 4, 6, 1, P('#b8d8f0'));
        p.rect(6, b - 1, 1, 4, P('#9aa2ae')); p.hline(6, 8, b - 1, P('#c0c6ce'));
        for (let x = 12; x < 15; x++) p.rect(x, b - 1, 1, 3, x % 2 ? P('#f4f4f8') : P('#8ac8e8'));
        p.vline(8, b + 9, b + 14, WD[2]);
        break;
      }
      case 'boxes': {
        const Cb = R(['#5a3a1c', '#8a5a2c', '#b07a40', '#c89458', '#dcb070', '#ecc888']);
        box(0, b + 6, 10, 10, 3, Cb, 4, 3); p.vline(5, b + 6, b + 15, P('#e8d8a8'));
        box(8, b + 9, 8, 7, 2, Cb, 4, 2);
        box(2, b - 1, 8, 8, 3, Cb, 4, 3); p.hline(2, 9, b + 1, P('#e8d8a8'));
        break;
      }
      case 'floorlamp': {
        p.rect(5, h - 2, 6, 2, MET[1]); p.rect(7, 9, 2, h - 11, MET[3]); p.vline(7, 9, h - 3, MET[5]);
        const SH = R(['#b87a4a', '#f0d098', '#fff4d0']);
        for (let y = 0; y < 8; y++) for (let x = 5 - Math.floor(y / 2); x < 11 + Math.floor(y / 2); x++) p.set(x, 1 + y, SH[x < 6 ? 2 : x > 10 ? 0 : 1]);
        p.hline(2, 13, 8, SH[0]);
        break;
      }
      case 'vending': {
        const Vr = R(['#5a1018', '#8a1a26', '#b82a36', '#d84450', '#f06a74', '#ff9aa2']);
        box(1, 0, 14, h, 2, Vr, 4, 3);
        p.rect(3, 4, 8, 14, P('#20242e'));
        for (let r = 0; r < 4; r++) for (let q = 0; q < 3; q++) p.rect(4 + q * 2 + (q > 0 ? q : 0), 5 + r * 3, 2, 2, P(['#6ad0ff', '#ffd84a', '#6aff9a', '#ff8aa0'][(r + q) % 4]));
        p.rect(12, 6, 2, 4, P('#e8e8f0')); p.rect(3, 21, 8, 3, P('#101218'));
        if (frame % 2) p.rect(3, 4, 8, 1, P('#ffffff'));
        break;
      }
      case 'display': {
        box(0, b + 8, 16, 8, 2, WD, 5, 3);
        for (let y = b; y < b + 8; y++) for (let x = 1; x < 15; x++) p.set(x, y, P(y === b ? '#e8f4ff' : '#b8d8ea'));
        p.rect(3, b + 4, 3, 3, P('#e84a4a')); p.rect(7, b + 5, 2, 2, P('#4a8ae8')); p.rect(10, b + 3, 3, 4, P('#e8c040')); p.line(2, b + 1, 5, b + 4, P('#ffffff'));
        break;
      }
      case 'whiteboard': {
        p.rect(2, b + 18, 1, 8, MET[2]); p.rect(13, b + 18, 1, 8, MET[2]);
        p.rect(0, b, 16, 18, MET[4]); p.rect(1, b + 1, 14, 16, P('#f8fafc'));
        p.line(3, b + 5, 8, b + 3, P('#3a78c8')); p.line(8, b + 3, 12, b + 7, P('#3a78c8')); p.hline(3, 11, b + 10, P('#e84a4a')); p.hline(3, 8, b + 13, P('#2a2a2a')); p.circ(11, b + 13, 1.5, P('#4ab86a'));
        break;
      }
      case 'plant2': {   // tall leafy palm in a ceramic pot
        const T2 = R(['#2a3a5a', '#3a5a8a', '#5a82b8', '#8ab0dc', '#c0d8f0']);
        for (let y = h - 7; y < h; y++) for (let x = 4; x < 12; x++) p.set(x, y, T2[x < 6 ? 3 : x > 9 ? 1 : 2]);
        p.hline(3, 12, h - 7, T2[4]);
        const L = LEAF.grass;
        for (let a = 0; a < 7; a++) { const ang = -Math.PI / 2 + (a - 3) * .42; for (let r = 0; r < 13; r++) { const x = 8 + Math.cos(ang) * r * .75, y = h - 8 + Math.sin(ang) * r + r * r * .045; p.set(Math.round(x), Math.round(y), L[r < 4 ? 3 : r < 9 ? 5 : 6]); p.set(Math.round(x) + 1, Math.round(y), L[2]); } }
        break;
      }
      case 'stairsup': case 'stairsdown': break;
      case 'healer': {
        box(0, b + 2, 16, 14, 4, R(['#8a8e9a', '#a8acb8', '#c4c8d2', '#dde0e8', '#eef0f4', '#fafbfc', '#ffffff']), 5, 3);
        for (let i = 0; i < 3; i++) { const on = (frame + i) % 2; p.circ(3 + i * 5, b + 4, 1.8, on ? P('#ff8aa0') : P('#e04a6a')); p.set(2 + i * 5, b + 3, P('#ffe0e8')); }
        p.rect(5, b + 9, 6, 4, P('#3a8ae0')); p.rect(6, b + 10, 2, 1, P('#b8e0ff'));
        break;
      }
      case 'machine': {
        box(1, b + 1, 14, 21, 3, MET, 5, 3);
        p.rect(3, b + 5, 10, 5, MET[0]); p.rect(4, b + 6, 3, 3, frame % 2 ? P('#6aff9a') : P('#3ac06a')); p.hline(8, 11, b + 6, P('#ff6a6a')); p.hline(8, 10, b + 8, P('#6ad0ff'));
        for (let x = 3; x < 13; x += 3) p.rect(x, b + 12, 2, 6, MET[1]);
        break;
      }
      case 'desk': {
        box(0, 5, 16, 11, 5, WD, 5, 3); p.rect(1, 13, 2, 3, WD[1]); p.rect(13, 13, 2, 3, WD[1]);
        p.rect(3, 1, 6, 5, MET[1]); p.rect(4, 2, 4, 3, P('#6ad0ff')); p.rect(11, 3, 3, 3, P('#f4f4f4')); p.hline(11, 13, 3, P('#ffffff'));
        break;
      }
      case 'rug': {
        const Rg = R(['#2a1650', '#4a2a88', '#6a44b0', '#8a66d0', '#f0d070']);
        p.fill(Rg[2]); p.rect(1, 1, 14, 14, Rg[3]); p.rect(3, 3, 10, 10, Rg[2]); p.rect(6, 6, 4, 4, Rg[4]); for (let x = 1; x < 16; x += 2) { p.set(x, 0, Rg[4]); p.set(x, 15, Rg[4]); }
        return;
      }
      default: {
        const pr = prop(kind, frame); return { img: pr.img };
      }
    }
    p.outline(null, { k: .34 });
  }
  function tableJoin(m) {
    return get(`tbl|${m}`, 16, 16, p => {
      const WD = R(['#2a1a10', '#46301c', '#664628', '#865e36', '#a67a48', '#c4985e', '#dcb47a']);
      const x0 = m & 8 ? 0 : 1, x1 = m & 2 ? 16 : 15, y0 = m & 1 ? 0 : 3, y1 = m & 4 ? 16 : 11;
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) p.set(x, y, WD[(!(m & 1) && y === y0) ? 6 : (x + y * 3) % 11 === 0 ? 4 : 5]);
      if (!(m & 4)) { for (let y = y1; y < y1 + 2; y++) for (let x = x0; x < x1; x++) p.set(x, y, WD[3]); p.hline(x0, x1 - 1, y1 + 1, WD[2]); if (!(m & 8)) p.rect(2, 13, 2, 3, WD[2]); if (!(m & 2)) p.rect(12, 13, 2, 3, WD[1]); }
      if (!(m & 1) && !(m & 4)) { p.ell(8, 6.5, 2.6, 1.5, P('#f4f4f8')); p.ell(8, 6.5, 1.4, .7, P('#d0d4e0')); }
      p.outline(null, { k: .34 });
    });
  }

  // --------------------------------------------------------- buildings ---
  const ROOFS = { red: '#d4483c', blue: '#3c64c4', green: '#3c9a58', teal: '#22a494', purple: '#7a4cc0', orange: '#e0762c', gray: '#6a707c', brown: '#9a5e32', snow: '#dce6f2', black: '#343644' };
  // ---- generated object atlas (art_src/build_world.py): buildings, houses, trees and props
  const WA = { img: null };
  function loadWorld() {
    return new Promise(res => {
      if (!G.WORLD_ATLAS || typeof Image === 'undefined') return res();
      const im = new Image(); im.onload = () => { WA.img = im; res(); }; im.onerror = () => res(); im.src = G.WORLD_ATLAS.src;
    });
  }
  // tint: optional [r, g, b] multipliers baked in once (darker / cooler variants for depth in woods)
  function atlas(key, w, tint) {
    if (!WA.img || !G.WORLD_ATLAS.rects[key]) return null;
    const ck = 'wa|' + key + '|' + (w || 0) + '|' + (tint ? tint.join(',') : '');
    let c = cache.get(ck);
    if (!c) {
      const [x, y, sw, sh] = G.WORLD_ATLAS.rects[key];
      const dw = w || sw, dh = w ? Math.round(sh * w / sw) : sh;
      c = G.makeCanvas(dw, dh); const cx = c.getContext('2d'); cx.imageSmoothingEnabled = false;
      cx.drawImage(WA.img, x, y, sw, sh, 0, 0, dw, dh);
      if (tint) {
        try {
          const im = cx.getImageData(0, 0, dw, dh), d = im.data;
          for (let i = 0; i < d.length; i += 4) { d[i] *= tint[0]; d[i + 1] *= tint[1]; d[i + 2] *= tint[2]; }
          cx.putImageData(im, 0, 0);
        } catch (e) { /* tainted canvas: keep untinted */ }
      }
      cache.set(ck, c);
    }
    return c;
  }
  const HOUSE_ROOF = { red: 'house_red', blue: 'house_blue', teal: 'house_teal', brown: 'house_brown', gray: 'house_gray', grey: 'house_gray', purple: 'house_purple', orange: 'house_orange', snow: 'house_snow', green: 'house_teal', pink: 'house_orange' };
  function building(kind, w, h, o = {}) {
    const ak = kind === 'house' ? (HOUSE_ROOF[o.roof] || 'house_red') : ['haven', 'mart', 'lab', 'gym', 'tower', 'lighthouse'].includes(kind) ? kind : null;
    const im = ak && atlas(ak, w * 16);
    if (im) return { img: im, oy: Math.max(0, im.height - h * 16), atlas: true };
    const extra = kind === 'tower' ? 56 : kind === 'lighthouse' ? 72 : kind === 'gym' ? 22 : 16;
    const key = `bld|${kind}|${w}|${h}|${o.roof || ''}|${o.door}|${o.accent || ''}|${o.label || ''}`;
    return { img: get(key, w * 16, h * 16 + extra, p => paintBuilding(p, kind, w, h, extra, o)), oy: extra };
  }
  function roofRamp(name) { return G.rampFrom(ROOFS[name] || name || ROOFS.red, 8, { lo: .34, hi: .26, mid: 4 }); }
  // hip roof: trapezoid front slope with shingle courses; side hips lit/shaded
  function hipRoof(p, x0, y0, W, H, ramp, o = {}) {
    const inset = o.inset || Math.min(10, Math.floor(W * .14));
    for (let y = 0; y < H; y++) {
      const t = y / Math.max(1, H - 1), a = Math.round(inset * (1 - t)), L = x0 + a - 1, Rt = x0 + W - a;
      const course = Math.floor(y / 4), cv = y % 4;
      for (let x = L; x <= Rt; x++) {
        const u = (x - L) / Math.max(1, Rt - L);
        let k = 4 + (t < .2 ? 1 : 0) - (u > .8 ? 1 : 0) + (u < .15 ? 1 : 0);
        const seam = ((x - x0 + (course & 1) * 4) % 8) === 0;
        if (cv === 3) k -= 2; else if (cv === 0) k += 1;
        if (seam && cv > 0 && cv < 3) k -= 1;
        if (h2(x, y, 3) > .96) k -= 1;
        // hip facets
        if (x - L < 3 + t * 2 && a > 0) k = Math.max(k, 6) - (cv === 3 ? 2 : 0);
        if (Rt - x < 3 + t * 2 && a > 0) k = Math.min(k, 2) - (cv === 3 ? 1 : 0);
        p.set(x, y0 + y, ramp[G.clamp(k, 0, 7)]);
      }
    }
    // ridge cap and eave
    for (let x = x0 + inset; x <= x0 + W - inset - 1; x++) { p.set(x, y0, ramp[7]); p.set(x, y0 + 1, ramp[6]); }
    for (let x = x0 - 1; x <= x0 + W; x++) { p.set(x, y0 + H, ramp[1]); p.set(x, y0 + H + 1, ramp[0]); }
  }
  function window2(p, x, y, w, hh, frame, o = {}) {
    const F = o.frame || R(['#3a2a20', '#f4f0e8', '#ffffff']);
    p.rect(x - 1, y - 1, w + 2, hh + 2, F[0]); p.rect(x, y, w, hh, F[1]);
    const G1 = R(['#3a6aa8', '#5a92d0', '#8cc0ee', '#d8f0ff']);
    for (let j = 1; j < hh - 1; j++) for (let i = 1; i < w - 1; i++) { const d = i + j; p.set(x + i, y + j, G1[d < 4 ? 2 : j > hh - 4 ? 0 : 1]); }
    p.line(x + 2, y + hh - 3, x + Math.min(w - 2, 5), y + 2, G1[3]);
    p.vline(x + (w >> 1), y + 1, y + hh - 2, F[1]); p.hline(x + 1, x + w - 2, y + (hh >> 1), F[1]);
    if (o.box) { const T = R(['#6a3a1c', '#9a5a2c', '#c07a40']); p.rect(x - 1, y + hh + 1, w + 2, 2, T[1]); p.hline(x - 1, x + w, y + hh + 1, T[2]); for (let i = 0; i < w + 2; i += 2) p.set(x - 1 + i, y + hh, P(['#ff5a7a', '#ffd84a', '#ffffff', '#ff9ad0'][(i >> 1) % 4])); }
  }
  function door(p, x, y, style, o = {}) {
    if (style === 'glass') {
      const F = R(['#1e2a3c', '#3a4a64', '#5a6c88']);
      p.rect(x, y, 16, 20, F[0]); p.rect(x + 1, y + 1, 14, 19, F[1]);
      const Gl = R(['#2a6ab8', '#4a92e0', '#8ccaff', '#e0f6ff']);
      for (let j = 2; j < 20; j++) for (let i = 2; i < 14; i++) p.set(x + i, y + j, Gl[j < 6 ? 2 : (i + j) % 9 === 0 ? 3 : 1]);
      p.vline(x + 8, y + 2, y + 19, F[2]); p.line(x + 3, y + 12, x + 6, y + 3, Gl[3]); p.line(x + 10, y + 12, x + 13, y + 3, Gl[3]);
      p.rect(x - 2, y - 3, 20, 3, o.awning || P('#e8484a')); p.hline(x - 2, x + 17, y - 3, G.mixc(o.awning || P('#e8484a'), [255, 255, 255], .4));
      return;
    }
    const WD = R(['#2a160c', '#4a2a16', '#6a4022', '#8a5630', '#a86e40', '#c48a56']);
    p.rect(x + 1, y, 14, 20, WD[0]); p.rect(x + 2, y + 1, 12, 19, WD[3]);
    p.rect(x + 3, y + 3, 4, 6, WD[4]); p.rect(x + 9, y + 3, 4, 6, WD[4]); p.rect(x + 3, y + 11, 4, 6, WD[4]); p.rect(x + 9, y + 11, 4, 6, WD[4]);
    p.hline(x + 3, x + 6, y + 3, WD[5]); p.hline(x + 9, x + 12, y + 3, WD[5]); p.vline(x + 2, y + 1, y + 19, WD[4]);
    p.set(x + 12, y + 10, P('#ffd84a')); p.set(x + 12, y + 11, P('#b88a20'));
    // step
    p.rect(x, y + 20, 16, 0, WD[0]);
    const S = STONE; p.hline(x, x + 15, y + 19, S[5]);
  }
  function paintBuilding(p, kind, w, h, E, o) {
    const W = w * 16, H = h * 16 + E;
    const ramp = roofRamp(o.roof || (kind === 'haven' ? 'red' : kind === 'mart' ? 'blue' : 'red'));
    if (kind === 'tower') return paintTower(p, w, h, E, o);
    if (kind === 'lighthouse') return paintLighthouse(p, w, h, E, o);
    const wallH = kind === 'gym' ? 38 : kind === 'haven' || kind === 'mart' || kind === 'lab' ? 32 : 30;
    const wallY = H - wallH, roofH = wallY + 2;
    const wallBase = kind === 'haven' ? '#f4f2ee' : kind === 'mart' ? '#eef2f6' : kind === 'lab' ? '#e6ecf2' : kind === 'gym' ? '#e8dcc6' : ['#f2e6c8', '#ece0d0', '#e8eef2', '#f4e0d0'][(w * 7 + (o.roof || '').length) % 4];
    const WR = G.rampFrom(wallBase, 7, { lo: .32, hi: .1 });
    // ---- front wall
    const siding = kind === 'house';
    for (let y = wallY; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      let k = 4;
      if (siding) { const r = (y - wallY) % 4; if (r === 3) k = 2; else if (r === 0) k = 5; }
      else if (kind === 'gym') { const r = (y - wallY) % 6, sx = (x + (Math.floor((y - wallY) / 6) & 1) * 6) % 12; if (r === 5 || sx === 0) k = 2; else if (r === 0) k = 5; }
      else if ((x + y) % 13 === 0 && h2(x, y, 2) > .5) k = 3;
      if (x < 3) k = Math.min(6, k + 1); if (x > W - 4) k = Math.max(1, k - 2);
      p.set(x, y, WR[k]);
    }
    // foundation
    for (let x = 1; x < W - 1; x++) { p.set(x, H - 4, STONE[5]); p.set(x, H - 3, STONE[4]); p.set(x, H - 2, STONE[3]); if ((x % 7) === 0) p.set(x, H - 3, STONE[2]); }
    // under-eave shadow
    for (let x = 1; x < W - 1; x++) { p.shade(x, wallY, -.35); p.shade(x, wallY + 1, -.2); p.shade(x, wallY + 2, -.08); }
    // ---- roof
    if (kind === 'lab') {
      const LR = roofRamp(o.roof || 'teal');
      for (let y = 0; y < roofH; y++) for (let x = 0; x < W; x++) { const v = y - E + 2; let k = y < 3 ? 6 : y > roofH - 4 ? 2 : 4; if (x % 12 === 0 && y > 3 && y < roofH - 4) k = 3; p.set(x, y + (E - 8 > 0 ? E - 8 : 0) * 0, LR[k]); }
      for (let y = 0; y < E - 10; y++) for (let x = 0; x < W; x++) p.clear(x, y);
      const top = Math.max(0, E - 10);
      for (let y = top; y < roofH; y++) for (let x = 0; x < W; x++) { let k = y < top + 3 ? 6 : y > roofH - 4 ? 2 : 4; if ((x % 12 === 0) && y > top + 3 && y < roofH - 4) k = 3; if (x < 2) k++; if (x > W - 3) k -= 2; p.set(x, y, LR[G.clamp(k, 0, 7)]); }
      // vents + antenna dish
      for (let i = 0; i < Math.floor(w / 3); i++) { const vx = 8 + i * 22; p.rect(vx, top + 5, 8, 5, STONE[5]); p.hline(vx, vx + 7, top + 5, STONE[7]); p.hline(vx + 1, vx + 6, top + 7, STONE[2]); }
      p.rect(W - 16, 0, 2, top + 6, STONE[3]); p.ell(W - 15, 2, 5, 2.5, STONE[6]); p.ell(W - 15, 2.4, 3.4, 1.4, STONE[4]); p.set(W - 15, 0, P('#ff4a4a'));
      for (let x = 0; x < W; x++) { p.set(x, roofH - 1, LR[1]); p.set(x, roofH, LR[0]); }
    } else {
      const top = kind === 'gym' ? 0 : 2;
      hipRoof(p, 0, top, W, roofH - top, ramp, { inset: kind === 'gym' ? 12 : Math.min(10, Math.floor(W * .13)) });
      if (kind === 'haven' || kind === 'mart') {
        // bright band across the roof with the emblem on a white plate
        const band = Math.floor(roofH * .52);
        for (let x = 4; x < W - 4; x++) { p.set(x, band, P('#ffffff')); p.set(x, band + 1, P('#e8eef4')); p.set(x, band + 2, G.darkc(ramp[3], .1)); }
        const cx = W >> 1, cy = band - 2;
        p.circ(cx, cy, 8.5, P('#1c1c24')); p.circ(cx, cy, 7.5, P('#ffffff'));
        if (kind === 'haven') { for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) if (x * x + y * y <= 56 && y < 0) p.set(cx + x, cy + y, ramp[5]); p.hline(cx - 7, cx + 7, cy, P('#1c1c24')); p.circ(cx, cy, 2.6, P('#1c1c24')); p.circ(cx, cy, 1.6, P('#ffffff')); p.set(cx - 4, cy - 4, P('#ffffff')); }
        else { const B = R(['#18306a', '#2a4ea0', '#4a7ad8']); p.rect(cx - 4, cy - 2, 8, 6, B[1]); p.rect(cx - 3, cy - 5, 6, 3, B[0]); p.rect(cx - 2, cy - 4, 4, 2, P('#ffffff')); p.hline(cx - 4, cx + 3, cy - 2, B[2]); }
      }
      if (kind === 'house') {   // chimney
        const cx = W - 18, CR = R(['#3a1e16', '#5a2e22', '#7a4030', '#9a5640', '#b46e54']);
        for (let y = 0; y < 12; y++) for (let x = 0; x < 7; x++) p.set(cx + x, y, CR[y < 2 ? 4 : x === 0 ? 3 : x === 6 ? 1 : (y % 3 === 0 ? 1 : 2)]);
        p.hline(cx - 1, cx + 7, 0, CR[4]); p.hline(cx - 1, cx + 7, 1, CR[2]);
        // dormer window on wide houses
        if (w >= 5) { const dx = 10, dy = Math.floor(roofH * .35); p.rect(dx, dy, 12, 10, WR[4]); p.rect(dx - 1, dy - 2, 14, 3, ramp[6]); p.hline(dx - 1, dx + 12, dy - 3, ramp[7]); window2(p, dx + 2, dy + 2, 8, 7, 0); }
      }
      if (kind === 'gym') {
        // emblem plaque and pillars
        const cx = W >> 1, acc = P(o.accent || '#ffd84a');
        p.rect(cx - 14, roofH - 14, 28, 11, P('#20242e')); p.rect(cx - 13, roofH - 13, 26, 9, acc); p.hline(cx - 13, cx + 12, roofH - 13, G.mixc(acc, [255, 255, 255], .5));
        p.circ(cx, roofH - 9, 3, P('#ffffff')); p.circ(cx, roofH - 9, 1.5, P('#20242e'));
        for (const px of [6, W - 12]) for (let y = wallY; y < H - 4; y++) for (let x = 0; x < 6; x++) p.set(px + x, y, WR[x === 0 ? 6 : x === 5 ? 1 : x < 3 ? 5 : 3]);
      }
    }
    // ---- door + windows
    const dcol = (o.door !== undefined ? o.door : Math.floor(w / 2));
    const dx = dcol * 16;
    const glass = kind === 'haven' || kind === 'mart' || kind === 'lab';
    door(p, dx, H - 21, glass ? 'glass' : 'wood', { awning: kind === 'mart' ? P('#2a64d0') : kind === 'lab' ? P('#22a494') : P('#e8484a') });
    const winY = kind === 'gym' ? wallY + 10 : wallY + 8;
    const groups = [];
    if (dcol > 0) groups.push([0, dcol]);
    if (dcol < w - 1) groups.push([dcol + 1, w]);
    for (const [a, bb] of groups) {
      const span = (bb - a) * 16;
      if (glass) { const ww = Math.min(span - 8, 28); window2(p, a * 16 + (span - ww) / 2, winY, ww, 12, 0, { frame: R(['#1e2a3c', '#e8eef4', '#ffffff']) }); }
      else if (span >= 32) { window2(p, a * 16 + 5, winY, 10, 10, 0, { box: kind === 'house' }); window2(p, a * 16 + span - 15, winY, 10, 10, 0, { box: kind === 'house' }); }
      else window2(p, a * 16 + (span - 10) / 2, winY, 10, 10, 0, { box: kind === 'house' });
    }
    // corners
    for (let y = wallY; y < H - 1; y++) { p.set(0, y, WR[1]); p.set(W - 1, y, WR[0]); }
    p.outline(null, { k: .3 });
  }
  function paintTower(p, w, h, E, o) {
    const W = w * 16, H = h * 16 + E;
    const Gl = R(['#16263e', '#20385a', '#2c4c78', '#3c6496', '#5a84b4', '#86aed4', '#bcd8f0', '#eaf6ff']);
    const F = R(['#1c222c', '#2c3440', '#3e4856', '#58626e', '#7a8490', '#a4acb6', '#d0d6dc']);
    for (let y = 0; y < H - 18; y++) for (let x = 0; x < W; x++) {
      const col = x % 12, row = y % 10;
      let c = Gl[3 + (x < W * .25 ? 1 : x > W * .75 ? -1 : 0)];
      if (col === 0 || row === 0) c = F[col === 0 && row === 0 ? 5 : 3];
      else if (col + row < 5) c = Gl[6];
      else if ((x - y) % 23 === 0) c = Gl[7];
      p.set(x, y, c);
    }
    for (let x = 0; x < W; x++) { p.set(x, 0, F[6]); p.set(x, 1, F[4]); p.set(x, 2, F[2]); }
    // lobby
    for (let y = H - 18; y < H - 1; y++) for (let x = 0; x < W; x++) p.set(x, y, F[y === H - 18 ? 6 : y === H - 17 ? 1 : 5]);
    door(p, (W >> 1) - 8, H - 21, 'glass', { awning: P('#e8484a') });
    p.rect((W >> 1) - 20, H - 32, 40, 8, P('#e8484a')); for (let i = 0; i < 5; i++) p.rect((W >> 1) - 16 + i * 7, H - 30, 4, 4, P('#ffffff'));
    p.outline(null, { k: .3 });
  }
  function paintLighthouse(p, w, h, E, o) {
    const W = w * 16, H = h * 16 + E, cx = W / 2;
    const Rd = R(['#5a1414', '#8a2020', '#b83030', '#dc4a42', '#f07a6a']), Wh = R(['#8a8e9a', '#b4b8c4', '#d8dce4', '#f2f4f8', '#ffffff']);
    for (let y = 26; y < H - 2; y++) {
      const t = (y - 26) / (H - 28), hw = 8 + t * 10, band = Math.floor((y - 26) / 14) % 2;
      for (let x = Math.round(cx - hw); x < Math.round(cx + hw); x++) { const u = (x - (cx - hw)) / (hw * 2), k = u < .25 ? 4 : u < .6 ? 3 : u < .85 ? 2 : 1; p.set(x, y, band ? Rd[k] : Wh[k]); }
    }
    const I = R(['#101218', '#1c2028', '#2a2f3a', '#3c4250']);
    p.rect(cx - 11, 22, 22, 4, I[1]); p.hline(cx - 11, cx + 10, 22, I[3]);
    p.rect(cx - 9, 10, 18, 12, I[1]); p.rect(cx - 7, 12, 14, 9, P('#fff2a8')); p.rect(cx - 7, 12, 5, 9, P('#ffffff')); p.vline(cx, 12, 20, I[2]);
    for (let y = 2; y < 10; y++) { const hw = (y - 1) * 1.2; for (let x = Math.round(cx - hw); x < Math.round(cx + hw); x++) p.set(x, y, Rd[x < cx ? 3 : 1]); }
    p.rect(cx - 1, 0, 2, 3, I[2]);
    p.rect(cx - 6, H - 18, 12, 16, Rd[0]); p.rect(cx - 5, H - 17, 10, 15, P('#6a4022')); p.rect(cx - 4, H - 16, 3, 5, P('#8a5630'));
    p.outline(null, { k: .3 });
  }

  // ------------------------------------------------------------- icons ---
  function itemIcon(kind, col) {
    return get('icon|' + kind + '|' + col, 16, 16, p => {
      const c = P(col), d = G.col.parse(G.col.dark(col, .35)), l = G.col.parse(G.col.light(col, .45)), O = P('#1e1a24'), Wh = P('#ffffff');
      switch (kind) {
        case 'potion': p.rect(6, 1, 4, 3, P('#c8ccd8')); p.rect(5, 4, 6, 1, P('#8a8e98')); p.ell(8, 10, 5, 5, c); p.ell(7, 9, 2, 2.5, l); p.rect(4, 11, 8, 2, d); break;
        case 'spray': p.rect(5, 4, 6, 10, c); p.rect(5, 4, 2, 10, l); p.rect(6, 1, 4, 3, P('#c8ccd8')); p.rect(10, 2, 3, 1, P('#8a8e98')); p.rect(5, 9, 6, 2, Wh); break;
        case 'revive': p.rect(3, 6, 10, 4, c); p.rect(6, 3, 4, 10, c); p.rect(6, 3, 2, 10, l); p.rect(3, 6, 10, 1, l); break;
        case 'bottle': p.rect(6, 1, 4, 3, P('#8a5a34')); p.rect(5, 4, 6, 10, c); p.rect(5, 4, 2, 10, l); p.rect(5, 8, 6, 3, Wh); break;
        case 'candy': p.ell(8, 8, 4, 3.5, c); p.ell(7, 7, 1.5, 1, Wh); p.rect(1, 6, 3, 4, d); p.rect(12, 6, 3, 4, d); break;
        case 'vitamin': p.rect(5, 3, 6, 11, c); p.rect(5, 3, 6, 3, Wh); p.rect(5, 3, 2, 11, l); p.rect(5, 8, 6, 1, d); break;
        case 'orb': p.circ(8, 8, 6, c); for (let y = 8; y < 15; y++) for (let x = 1; x < 15; x++) if ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 36) p.set(x, y, P('#f0f0f4')); p.rect(2, 7, 12, 1, O); p.circ(8, 8, 2, O); p.circ(8, 8, 1.2, Wh); p.set(5, 4, l); p.set(6, 4, l); break;
        case 'x': p.rect(3, 3, 10, 10, c); p.rect(3, 3, 10, 2, l); p.line(5, 6, 10, 11, Wh); p.line(10, 6, 5, 11, Wh); break;
        case 'doll': p.circ(8, 5, 3, c); p.ell(8, 11, 4, 3.5, c); p.set(7, 4, O); p.set(9, 4, O); p.circ(5, 3, 1.3, d); p.circ(11, 3, 1.3, d); break;
        case 'berry': p.circ(8, 9, 5, c); p.circ(6.5, 7.5, 1.6, l); p.rect(7, 2, 2, 3, P('#3a8a3a')); p.rect(9, 2, 3, 2, P('#5ab05a')); break;
        case 'food': p.ell(8, 10, 6, 4, c); p.ell(8, 8, 5, 2.5, l); p.rect(6, 6, 4, 2, P('#6ac04a')); break;
        case 'gem': for (let y = 0; y < 10; y++) { const ww = y < 3 ? 2 + y * 2 : 7 - (y - 3); p.rect(8 - ww, 3 + y, ww * 2, 1, y < 3 ? l : c); } p.set(6, 5, Wh); break;
        case 'band': p.ell(8, 8, 6, 3.5, c); for (let y = 6; y <= 10; y++) for (let x = 5; x <= 11; x++) if (((x - 8) / 4) ** 2 + ((y - 8) / 1.8) ** 2 < 1) p.clear(x, y); p.rect(3, 6, 10, 1, l); break;
        case 'lens': p.circ(8, 7, 5, P('#3a3c48')); p.circ(8, 7, 3.8, c); p.circ(7, 6, 1.5, Wh); p.rect(11, 11, 3, 3, P('#3a3c48')); break;
        case 'vest': p.rect(3, 3, 10, 11, c); p.rect(7, 3, 2, 3, P('#1e1a24')); p.rect(3, 3, 3, 11, l); break;
        case 'helm': p.ell(8, 9, 6, 5, c); p.rect(2, 10, 12, 3, d); for (let x = 3; x < 14; x += 3) p.set(x, 3 + (x % 2), P('#e0e0e8')); break;
        case 'claw': p.line(4, 12, 7, 3, c); p.line(8, 12, 10, 3, c); p.line(12, 12, 13, 5, c); p.rect(3, 12, 11, 2, d); break;
        case 'bell': p.ell(8, 8, 5, 5, c); p.rect(3, 10, 10, 3, c); p.circ(8, 13, 1.5, d); p.set(6, 5, Wh); break;
        case 'egg': p.ell(8, 9, 4.5, 5.5, c); p.circ(6, 7, 1.2, P('#e84a4a')); p.circ(10, 10, 1, P('#3a8ae0')); break;
        case 'coin': p.circ(8, 8, 6, c); p.circ(8, 8, 4, d); p.circ(8, 8, 3, c); p.set(6, 5, Wh); break;
        case 'stone': p.ell(8, 9, 5.5, 5, c); p.ell(7, 7, 2, 1.5, l); p.line(8, 5, 10, 10, d); break;
        case 'cord': for (let t = 0; t < 12; t++) p.set(2 + t, 8 + Math.round(Math.sin(t / 1.8) * 3), c); p.rect(1, 6, 3, 4, P('#e8c040')); p.rect(12, 6, 3, 4, P('#e8c040')); break;
        case 'leaf': p.ell(8, 8, 5, 3, c); p.line(3, 11, 12, 5, d); break;
        case 'capsule': p.ell(8, 8, 6, 3.5, c); for (let y = 4; y < 12; y++) for (let x = 8; x < 15; x++) if (((x - 8) / 6) ** 2 + ((y - 8) / 3.5) ** 2 < 1) p.set(x, y, Wh); p.set(5, 7, l); break;
        case 'cap': p.circ(8, 8, 6, c); for (let a = 0; a < 16; a++) { const an = a / 16 * Math.PI * 2; p.set(8 + Math.cos(an) * 6.5, 8 + Math.sin(an) * 6.5, d); } p.circ(7, 7, 2, l); break;
        case 'rope': p.circ(8, 8, 5, c); for (let y = 5; y < 12; y++) for (let x = 5; x < 12; x++) if ((x - 7.5) ** 2 + (y - 7.5) ** 2 < 6) p.clear(x, y); break;
        case 'pearl': p.circ(8, 8, 5, c); p.circ(6.5, 6.5, 1.8, Wh); break;
        case 'dust': for (let i = 0; i < 9; i++) p.circ(4 + (i * 5) % 9, 5 + (i * 7) % 8, 1.4, i % 2 ? c : l); break;
        case 'fossil': p.ell(8, 9, 6, 5, c); p.line(5, 7, 11, 9, d); p.line(6, 11, 10, 6, d); p.set(8, 8, Wh); break;
        case 'tm': p.circ(8, 8, 6.5, c); p.circ(8, 8, 4.5, l); p.circ(8, 8, 1.8, P('#1e1a24')); p.rect(8, 2, 5, 3, Wh); break;
        case 'key': p.circ(5, 6, 3.5, c); p.circ(5, 6, 1.5, P('#1e1a24')); p.rect(8, 5, 7, 2, c); p.rect(12, 7, 2, 3, c); p.rect(10, 7, 1, 2, c); break;
        case 'dex': p.rect(3, 2, 10, 12, c); p.rect(3, 2, 3, 12, d); p.circ(10, 6, 2, P('#6ad0ff')); p.rect(8, 10, 4, 2, l); break;
        case 'book': p.rect(3, 2, 10, 12, c); p.rect(4, 3, 8, 10, l); p.rect(3, 2, 2, 12, d); p.rect(6, 5, 5, 1, d); p.rect(6, 7, 5, 1, d); break;
        case 'bike': p.circ(4, 11, 3, P('#2a2a30')); p.circ(12, 11, 3, P('#2a2a30')); p.line(4, 11, 8, 6, c); p.line(8, 6, 12, 11, c); p.line(8, 6, 7, 3, c); p.rect(6, 3, 3, 1, P('#2a2a30')); break;
        case 'knife': p.rect(3, 9, 5, 3, P('#6a4428')); p.line(7, 10, 14, 3, P('#d0d4dc')); p.line(7, 9, 13, 3, P('#f0f4f8')); break;
        case 'hammer': p.rect(7, 5, 2, 10, P('#8a5a34')); p.rect(3, 2, 10, 4, c); p.rect(3, 2, 10, 1, l); break;
        case 'boots': p.rect(4, 3, 5, 8, c); p.rect(4, 10, 9, 4, c); p.rect(4, 13, 10, 1, d); p.rect(4, 3, 2, 8, l); break;
        case 'board': p.ell(8, 8, 3.5, 7, c); p.ell(8, 8, 1, 6, Wh); break;
        case 'whistle': p.ell(9, 9, 5, 4, c); p.rect(1, 7, 6, 3, c); p.circ(10, 8, 1.5, P('#1e1a24')); p.set(8, 6, l); break;
        case 'rod': p.line(2, 14, 13, 2, P('#8a5a34')); p.line(13, 2, 13, 10, P('#e0e0e8')); p.circ(13, 11, 1.2, c); p.circ(5, 11, 1.8, P('#3a3c48')); break;
        case 'share': p.circ(8, 8, 6, c); p.rect(5, 5, 6, 6, Wh); p.rect(6, 6, 4, 4, c); break;
        case 'charm': for (let i = 0; i < 5; i++) { const an = i / 5 * Math.PI * 2 - Math.PI / 2; p.line(8, 8, 8 + Math.cos(an) * 6, 8 + Math.sin(an) * 6, c); } p.circ(8, 8, 2.5, l); break;
        case 'card': p.rect(2, 4, 12, 9, c); p.rect(2, 6, 12, 2, P('#1e1a24')); p.rect(4, 10, 5, 1, Wh); break;
        case 'box': p.rect(2, 4, 12, 10, c); p.rect(2, 4, 12, 2, l); p.rect(7, 4, 2, 10, P('#e8484a')); break;
        case 'lantern': p.rect(5, 3, 6, 10, P('#3a3c48')); p.rect(6, 4, 4, 8, c); p.rect(6, 4, 2, 3, Wh); p.rect(7, 1, 2, 2, P('#3a3c48')); break;
        default: p.circ(8, 8, 5, c);
      }
      p.outline(O);
    });
  }

  // compatibility helpers used by older call sites
  function simple(p, kind, v, frame, theme) {
    if (kind === 'cave') { const r = G.RAMPS.cave; for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, r[3 + (h2(x, y, v) > .7 ? 1 : 0)]); }
    else if (kind === 'gymfloor') gymFloor(p, 0, 0, theme || '#8aa0b8');
    else p.fill(P('#202030'));
  }
  return {
    get, cache, LEAF, CLIFF, STONE, rockAt,
    cliffTile, ledgeTile, bridgeTile, woodFloor, tileFloor, gymFloor, carpet, wallTile,
    tallgrass, flowerSprite, hedgeSprite,
    broadTree, pineTree, palmTree, deadTree, smallTree, rockSprite, fenceSprite, lampSprite, lanternPost, crystalSprite, prop, fountainBig, furniture, tableJoin,
    building, itemIcon, simple, atlas, loadWorld,
  };
})();
