'use strict';
// ============================================================================
//  Terrain: the ground is baked per map into 128px chunks, pixel by pixel.
//  Natural materials (grass, dirt, sand, water, snow, ash, cave floor) are
//  sampled through a noise-warped grid so every boundary is organic; raised
//  grass gets a dark rim and casts a lip shadow onto paths; water shades from
//  foam to deep blue by distance to shore. Man-made tiles (cliffs, bridges,
//  floors, walls) are painted on top. Static objects bake a projected cast
//  shadow into a separate layer whose strength follows the time of day.
//  Water sparkle, shore foam, flowers and tall grass animate per frame.
// ============================================================================
G.terrain = (function () {
  const CT = 8, CS = CT * 16, PAD = 10, BW = CS + PAD * 2;
  const M = { NONE: 0, GRASS: 1, PATH: 2, SAND: 3, WATER: 4, SNOW: 5, ASH: 6, CAVE: 7, ICE: 8, PAVE: 9, STRUCT: 10 };
  const WARP = [0, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0];
  const LEVEL = [2, 3, 2, 2, 0, 3, 3, 2, 2, 2, 2];
  const R = G.ramp;
  const RAMPS = {
    grass: R(['#143822', '#1c5026', '#28692a', '#377f2c', '#4a9632', '#63ae3a', '#86c64a', '#b6de6e']),
    beach: R(['#22502c', '#2f6c31', '#428a37', '#5aa83f', '#77c24b', '#96d65a', '#bce874', '#e0f6a0']),
    dusk: R(['#1c3a44', '#244e50', '#2f665c', '#3f7f6c', '#54997e', '#70b392', '#98ceae', '#c6e6d0']),
    snowgrass: R(['#26464e', '#33605e', '#46796c', '#5e947e', '#7cae94', '#a2c8b0', '#cae2d4', '#eef8f2']),
    ashgrass: R(['#35302c', '#463e38', '#584e45', '#6c6052', '#827462', '#9a8b76', '#b8a88e', '#d6c8ae']),
    path: R(['#5c3c24', '#7a5332', '#9a6c40', '#b88a55', '#cea46a', '#dfba80', '#ecd09c', '#f7e6c0']),
    sand: R(['#8e6c44', '#ae8a58', '#c9a66c', '#dcbc80', '#e9cf96', '#f2dfae', '#f9ecc8', '#fff8e6']),
    water: R(['#0b2560', '#10357e', '#16479c', '#1e5cb8', '#2a74d0', '#3f8fe2', '#65aef0', '#a6d4fa', '#eaf6ff']),
    snow: R(['#58698c', '#7486a8', '#94a6c4', '#b4c4dc', '#cfdcee', '#e4ecf7', '#f3f7fc', '#ffffff']),
    ash: R(['#2e2826', '#3e3532', '#50453f', '#62564e', '#766a5f', '#8c8073', '#a49889', '#c2b6a6']),
    cave: R(['#2c2320', '#3e312a', '#524034', '#675140', '#7c634f', '#937861', '#ab8f77', '#c8ae94']),
    ice: R(['#4e8cb4', '#6aa8cc', '#88c2e0', '#a6d8ee', '#c2e8f6', '#dcf4fb', '#f2fcff', '#ffffff']),
    pave: R(['#4a4c56', '#62646e', '#7c7e86', '#95979d', '#adaeb2', '#c4c4c6', '#d8d8d8', '#ececea']),
    pavewarm: R(['#54483e', '#6e6052', '#887866', '#a2917c', '#b8a892', '#ccbea8', '#ded2be', '#efe6d6']),
  };
  G.RAMPS = RAMPS;
  const grassRamp = (map) => map.theme === 'beach' ? RAMPS.beach : map.theme === 'dusk' ? RAMPS.dusk : map.theme === 'snow' ? RAMPS.snowgrass : map.theme === 'ash' ? RAMPS.ashgrass : RAMPS.grass;

  // natural material under a cell (what the ground is made of)
  function natMat(map, c) {
    if (!c) return M.STRUCT;
    const g = c.g, cave = map.type === 'cave';
    switch (g) {
      case 'grass': case 'flowers': case 'tall': case 'hedge': return cave ? M.CAVE : M.GRASS;
      case 'ledge': case 'ledgel': case 'ledger': return cave ? M.CAVE : M.GRASS;
      case 'cliff': return M.GRASS;
      case 'path': return cave ? M.CAVE : M.PATH;
      case 'sand': return M.SAND;
      case 'water': case 'bridge': case 'bridgev': return M.WATER;
      case 'snow': return M.SNOW;
      case 'ash': case 'lava': return M.ASH;
      case 'cave': case 'crystalfloor': case 'hole': case 'ladderup': case 'cavewall': case 'crystalwall': return M.CAVE;
      case 'mat': case 'stairsup': case 'stairsdown': return cave ? M.CAVE : M.STRUCT;
      case 'ice': return M.ICE;
      case 'pave': return map.type === 'indoor' ? M.STRUCT : M.PAVE;
      default: return M.STRUCT;
    }
  }
  // cells whose tile is painted over the natural bake
  const STRUCT_TILES = new Set(['cliff', 'cavewall', 'crystalwall', 'ledge', 'ledgel', 'ledger', 'bridge', 'bridgev', 'hole', 'ladderup', 'dark', 'mat', 'crystalfloor', 'wall', 'wood', 'tilefloor', 'carpet', 'gymfloor', 'gymfloor2', 'stairsup', 'stairsdown', 'metal', 'none']);
  // cells animated or state-dependent: drawn each frame instead of baked
  const LIVE_TILES = new Set(['lava', 'switch', 'tall', 'flowers', 'hedge']);

  // --------------------------------------------------------------- caches
  const store = new Map();   // map id -> { chunks: Map, lru }
  let lruTick = 0, total = 0;
  function mapStore(map) { let s = store.get(map.id); if (!s) { s = { chunks: new Map() }; store.set(map.id, s); } return s; }
  function invalidate(mapId) { if (mapId) { const s = store.get(mapId); if (s) { total -= s.chunks.size; s.chunks.clear(); } } else { store.clear(); total = 0; } }
  function evict() {
    if (total < 180) return;
    const all = [];
    for (const [id, s] of store) for (const [k, ch] of s.chunks) all.push([ch.used, id, k]);
    all.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < all.length - 140; i++) { const s = store.get(all[i][1]); s.chunks.delete(all[i][2]); total--; }
  }

  // cell lookup with border fill, relative to the reference map
  function cellFor(map, tx, ty) {
    const r = map.resolve(tx, ty);
    if (r) return { c: r.map.cells[r.y * r.map.w + r.x], m: r.map, lx: r.x, ly: r.y };
    return { c: G.borderCell(map, tx, ty), m: map, lx: tx, ly: ty, border: true };
  }

  // ----------------------------------------------------------------- bake
  function bake(map, cx, cy) {
    const tx0 = cx * CT, ty0 = cy * CT, X0 = tx0 * 16, Y0 = ty0 * 16;
    // cell grid covering the chunk plus a 1-tile margin
    const GT = CT + 2, cells = new Array(GT * GT);
    for (let j = 0; j < GT; j++) for (let i = 0; i < GT; i++) cells[j * GT + i] = cellFor(map, tx0 - 1 + i, ty0 - 1 + j);
    const cellAtPx = (wx, wy) => { const i = Math.floor(wx / 16) - tx0 + 1, j = Math.floor(wy / 16) - ty0 + 1; return cells[G.clamp(j, 0, GT - 1) * GT + G.clamp(i, 0, GT - 1)]; };
    const matOf = (e) => natMat(e.m, e.c);
    // ---- material buffer (with padding) through a warped lookup
    const mat = new Uint8Array(BW * BW);
    for (let y = 0; y < BW; y++) for (let x = 0; x < BW; x++) {
      const wx = X0 - PAD + x, wy = Y0 - PAD + y;
      const e0 = cellAtPx(wx, wy), m0 = matOf(e0);
      let m = m0;
      if (WARP[m0]) {
        const ox = (G.vnoise(wx / 7, wy / 7, 11) - .5) * 7 + (G.vnoise(wx / 3, wy / 3, 13) - .5) * 2;
        const oy = (G.vnoise(wx / 7, wy / 7, 12) - .5) * 7 + (G.vnoise(wx / 3, wy / 3, 14) - .5) * 2;
        const m1 = matOf(cellAtPx(wx + ox, wy + oy));
        if (WARP[m1]) m = m1;
      }
      mat[y * BW + x] = m;
    }
    // ---- distance fields: to land (for water) and to water (for land), chamfer 3-4
    const dW = new Uint8Array(BW * BW), dL = new Uint8Array(BW * BW);
    for (let p = 0; p < BW * BW; p++) { const w = mat[p] === M.WATER; dW[p] = w ? 255 : 0; dL[p] = w ? 0 : 255; }
    const chamfer = (D) => {
      for (let y = 0; y < BW; y++) for (let x = 0; x < BW; x++) {
        const p = y * BW + x; let v = D[p]; if (!v) continue;
        if (x > 0) v = Math.min(v, D[p - 1] + 3); if (y > 0) { v = Math.min(v, D[p - BW] + 3); if (x > 0) v = Math.min(v, D[p - BW - 1] + 4); if (x < BW - 1) v = Math.min(v, D[p - BW + 1] + 4); }
        D[p] = v;
      }
      for (let y = BW - 1; y >= 0; y--) for (let x = BW - 1; x >= 0; x--) {
        const p = y * BW + x; let v = D[p]; if (!v) continue;
        if (x < BW - 1) v = Math.min(v, D[p + 1] + 3); if (y < BW - 1) { v = Math.min(v, D[p + BW] + 3); if (x < BW - 1) v = Math.min(v, D[p + BW + 1] + 4); if (x > 0) v = Math.min(v, D[p + BW - 1] + 4); }
        D[p] = v;
      }
    };
    chamfer(dW); chamfer(dL);   // dW: water pixels' distance to land; dL: land pixels' distance to water
    // ---- colour pass
    const gnd = G.makeCanvas(CS, CS), gx = gnd.getContext('2d');
    const img = gx.createImageData(CS, CS), d = img.data;
    const foamA = new Uint8ClampedArray(CS * CS * 4), foamB = new Uint8ClampedArray(CS * CS * 4), wm = new Uint8ClampedArray(CS * CS * 4);
    const GR = grassRamp(map);
    const MB = (x, y) => (x < -PAD || y < -PAD || x >= CS + PAD || y >= CS + PAD) ? M.STRUCT : mat[(y + PAD) * BW + x + PAD];
    for (let y = 0; y < CS; y++) for (let x = 0; x < CS; x++) {
      const p = (y + PAD) * BW + x + PAD, m = mat[p], wx = X0 + x, wy = Y0 + y, o = (y * CS + x) * 4;
      let col = null;
      const lv = LEVEL[m];
      // edge analysis: nearest lower neighbour (raised rim) and raised pixels above (lip shadow)
      let lowN = 0, low2 = 0, lowAbove = 0;
      if (m !== M.STRUCT) {
        const n1 = [MB(x, y - 1), MB(x + 1, y), MB(x, y + 1), MB(x - 1, y)];
        for (let k = 0; k < 4; k++) if (LEVEL[n1[k]] < lv && n1[k] !== M.STRUCT) { lowN = 1; if (k === 0) lowAbove = 1; }
        if (!lowN) { const n2 = [MB(x, y - 2), MB(x + 2, y), MB(x, y + 2), MB(x - 2, y)]; for (let k = 0; k < 4; k++) if (LEVEL[n2[k]] < lv && n2[k] !== M.STRUCT) { low2 = k === 0 ? 2 : 1; } }
      }
      let raisedAbove = 0;
      for (let k = 1; k <= 3; k++) { const q = MB(x, y - k); if (LEVEL[q] > lv && q !== M.STRUCT && m !== M.STRUCT) { raisedAbove = k; break; } }
      const nMacro = G.fbm(wx / 56, wy / 56, 3, 2), nMid = G.vnoise(wx / 9, wy / 9, 5), nFine = G.h2(wx, wy, 7);
      switch (m) {
        case M.GRASS: case M.SNOW: case M.ASH: {
          const RR = m === M.GRASS ? GR : m === M.SNOW ? RAMPS.snow : RAMPS.ash;
          const v = nMacro * .72 + nMid * .28;
          let k = v < .36 ? 3 : v < .6 ? 4 : 5;
          if (m === M.SNOW) k += 1;
          if (lowN) k = 1; else if (low2 === 2) k = Math.min(RR.length - 1, k + 2); else if (low2 === 1) k = 2;
          col = RR[k];
          break;
        }
        case M.PATH: case M.SAND: case M.CAVE: {
          const RR = m === M.PATH ? RAMPS.path : m === M.SAND ? RAMPS.sand : RAMPS.cave;
          const v = nMacro * .55 + nMid * .45;
          let k = v < .34 ? 3 : v < .66 ? 4 : 5;
          if (m === M.SAND) { const rip = Math.sin(wx * .35 + Math.sin(wy * .21) * 2.2 + wy * .9); if (rip > .92) k = Math.min(k + 1, 6); k = Math.min(k + 1, 6); }
          if (nFine > .93) k = Math.max(1, k - 1); else if (nFine < .04) k = Math.min(6, k + 1);
          // wet band near water
          if (dL[p] < 12 && dL[p] > 0) k = Math.max(1, k - (dL[p] <= 4 ? 2 : 1));
          if (lowN) k = Math.max(1, k - 1);
          if (raisedAbove) k = Math.max(0, k - (raisedAbove === 1 ? 3 : raisedAbove === 2 ? 2 : 1));
          col = RR[k];
          break;
        }
        case M.ICE: {
          const s = Math.sin((wx - wy) * .35 + G.vnoise(wx / 12, wy / 12, 2) * 4);
          let k = s > .85 ? 6 : nMid > .6 ? 4 : 5; if (nFine > .985) k = 7;
          if (raisedAbove) k = Math.max(1, k - (4 - raisedAbove));
          col = RAMPS.ice[k]; break;
        }
        case M.PAVE: {
          // staggered cut stones, 8x8 with a half offset every other row
          const RR = map.theme === 'ash' || map.theme === 'dusk' ? RAMPS.pavewarm : RAMPS.pave;
          const row = Math.floor(wy / 8), sx = wx + (row & 1) * 4, u = ((sx % 8) + 8) % 8, v = ((wy % 8) + 8) % 8;
          const sid = G.h2(Math.floor(sx / 8), row, 21);
          let k = 4 + (sid < .3 ? -1 : sid > .8 ? 1 : 0);
          if (u === 7 || v === 7) k = 1; else if (u === 0 || v === 0) k = Math.min(7, k + 2); else if (u === 6 || v === 6) k -= 1;
          if (nFine > .96 && u > 0 && v > 0 && u < 6 && v < 6) k -= 1;
          if (raisedAbove) k = Math.max(0, k - (raisedAbove === 1 ? 3 : raisedAbove === 2 ? 2 : 1));
          col = RR[G.clamp(k, 0, 7)]; break;
        }
        case M.WATER: {
          const RR = RAMPS.water, dist = dW[p] / 3;
          let k;
          if (dist <= 1.01) k = 7; else if (dist <= 2.4) k = 6; else if (dist <= 4.5) k = 5; else if (dist <= 8) k = 4; else k = nMacro < .45 ? 2 : 3;
          if (dist > 8 && nMid > .72) k = 3;
          // banks cast a shadow onto the water right below them
          let bank = 0; for (let kk = 1; kk <= 4; kk++) { const q = MB(x, y - kk); if (q !== M.WATER && q !== M.STRUCT) { bank = kk; break; } }
          if (bank && dist > 1.01) k = Math.max(1, Math.min(k, 2 + bank - 1));
          col = RR[k];
          if (dist <= 1.01 && !bank) { foamA[o] = foamA[o + 1] = foamA[o + 2] = 255; foamA[o + 3] = 255; }
          if (dist > 1.01 && dist <= 2.6 && !bank) { foamB[o] = foamB[o + 1] = foamB[o + 2] = 255; foamB[o + 3] = 255; }
          if (dist > 2.2) { wm[o] = wm[o + 1] = wm[o + 2] = 255; wm[o + 3] = 255; }
          break;
        }
        default: col = [20, 18, 28];
      }
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
    // ---- stamps: grass tufts, pebbles, snow glints (jittered grid, world-stable)
    const put = (x, y, col) => { if (x < 0 || y < 0 || x >= CS || y >= CS) return; const o = (y * CS + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; };
    const matAt = (x, y) => MB(x, y);
    const safe = (x, y, m) => { for (let j = -1; j <= 1; j++) for (let i = -2; i <= 2; i++) if (matAt(x + i, y + j) !== m) return false; return matAt(x, y + 2) === m && matAt(x, y - 2) === m; };
    const GS = 5;
    for (let gy = Math.floor((Y0 - 8) / GS); gy <= Math.floor((Y0 + CS + 8) / GS); gy++) for (let gxx = Math.floor((X0 - 8) / GS); gxx <= Math.floor((X0 + CS + 8) / GS); gxx++) {
      const hsh = G.h2(gxx, gy, 99), hx = gxx * GS + Math.floor(G.h2(gxx, gy, 98) * GS), hy = gy * GS + Math.floor(G.h2(gxx, gy, 97) * GS);
      const x = hx - X0, y = hy - Y0, m = matAt(x, y);
      if (m === M.GRASS && hsh < .8 && safe(x, y, m)) {
        const base = G.fbm(hx / 56, hy / 56, 3, 2) * .72 + G.vnoise(hx / 9, hy / 9, 5) * .28, k = base < .36 ? 3 : base < .6 ? 4 : 5;
        if (hsh < .5) {   // leafy tuft: two light blades over a dark base
          put(x - 1, y - 1, GR[k + 1]); put(x + 1, y - 1, GR[k + 1]); put(x, y - 2, GR[k + 2]);
          put(x - 2, y, GR[k - 1]); put(x - 1, y, GR[k - 2]); put(x, y, GR[k - 1]); put(x + 1, y, GR[k - 2]); put(x + 2, y, GR[k - 1]);
          put(x, y - 1, GR[k]);
        } else if (hsh < .7) {   // small 'v' blade mark
          put(x - 1, y - 1, GR[k - 1]); put(x + 1, y - 1, GR[k - 1]); put(x, y, GR[k - 2]); put(x - 1, y - 2, GR[k + 1]);
        } else if (hsh < .745 && map.theme !== 'ash') {   // tiny wildflower
          const fc = [[255, 255, 255], [255, 236, 120], [150, 200, 255], [255, 170, 200]][Math.floor(G.h2(gxx, gy, 96) * 4)];
          put(x, y - 1, fc); put(x - 1, y, fc); put(x + 1, y, fc); put(x, y + 1, fc); put(x, y, [255, 214, 90]); put(x, y + 2, GR[k - 2]);
        } else { put(x, y, GR[k + 2]); put(x + 1, y + 1, GR[k - 1]); }
      } else if ((m === M.PATH || m === M.CAVE || m === M.ASH) && hsh < .22 && safe(x, y, m)) {
        const RR = m === M.PATH ? RAMPS.path : m === M.CAVE ? RAMPS.cave : RAMPS.ash;
        // pebble: lit top-left, shadowed bottom-right
        put(x, y, RR[6]); put(x + 1, y, RR[5]); put(x, y + 1, RR[4]); put(x + 1, y + 1, RR[2]); put(x + 2, y + 1, RR[1]); put(x + 1, y + 2, RR[1]);
      } else if (m === M.SAND && hsh < .07 && safe(x, y, m)) {
        put(x, y, [255, 250, 240]); put(x + 1, y, [240, 190, 170]); put(x, y + 1, [200, 150, 130]);   // shell
      } else if (m === M.SNOW && hsh < .3 && safe(x, y, m)) {
        put(x, y, RAMPS.snow[7]); put(x - 1, y + 1, RAMPS.snow[4]); put(x, y + 1, RAMPS.snow[3]); put(x + 1, y + 1, RAMPS.snow[4]);
      } else if (m === M.ASH && hsh > .96 && safe(x, y, m)) {
        put(x, y, [255, 150, 70]); put(x + 1, y, [200, 90, 40]);
      }
    }
    gx.putImageData(img, 0, 0);
    // ---- structural tiles on top
    for (let j = 0; j < CT; j++) for (let i = 0; i < CT; i++) {
      const e = cells[(j + 1) * GT + i + 1], c = e.c;
      if (!STRUCT_TILES.has(c.g) && !(e.m.type === 'indoor' && natMat(e.m, c) === M.STRUCT && !LIVE_TILES.has(c.g))) continue;
      if (LIVE_TILES.has(c.g)) continue;
      const im = G.tileImg(e.m, c, 0);
      if (im) gx.drawImage(im, i * 16, j * 16);
    }
    // ---- contact occlusion under static objects (baked into the ground)
    const shadow = G.makeCanvas(CS, CS), sx = shadow.getContext('2d');
    sx.imageSmoothingEnabled = false;
    const objs = [];
    for (let ty = ty0 - 2; ty < ty0 + CT + 4; ty++) for (let tx = tx0 - 4; tx < tx0 + CT + 2; tx++) {
      const e = (tx >= tx0 - 1 && tx < tx0 + CT + 1 && ty >= ty0 - 1 && ty < ty0 + CT + 1) ? cells[(ty - ty0 + 1) * GT + tx - tx0 + 1] : cellFor(map, tx, ty);
      const c = e.c;
      if (c.o && !c.cut && !c.smash && !c.push && !c.solidIf && c.o !== 'rug') objs.push({ tx, ty, e });
      if (c.g === 'hedge') objs.push({ tx, ty, e, hedge: true });
    }
    for (const ob of objs) {
      const c = ob.e.c;
      let oi = null;
      try { oi = ob.hedge ? G.tiles.hedgeSprite(ob.e.m, c) : G.objImg(ob.e.m, c, 0); } catch (err) { oi = null; }
      if (!oi || !oi.img || oi.flat) continue;
      const bx = ob.tx * 16 - X0 + (oi.ox || 0), baseY = ob.ty * 16 + 16 - Y0 - (oi.base || 1);
      const top = ob.ty * 16 - Y0 + (oi.oy || 0);
      castShadow(sx, oi.img, bx, top, baseY, oi.sh);
      if (oi.ao !== false && ob.tx >= tx0 - 1 && ob.tx <= tx0 + CT && ob.ty >= ty0 - 1 && ob.ty <= ty0 + CT) {
        gx.fillStyle = 'rgba(12,16,36,.28)'; gx.beginPath(); gx.ellipse(ob.tx * 16 - X0 + 8 + (oi.aoX || 0), baseY + 1, oi.aoW || 6, 2.2, 0, 0, Math.PI * 2); gx.fill();
      }
    }
    // buildings of this map and its neighbours
    const blds = [];
    for (const b of map.buildings) blds.push([b, 0, 0]);
    for (const cn of map.conns) { const nm = cn.map; if (nm) for (const b of nm.buildings) blds.push([b, cn.ox, cn.oy]); }
    for (const [b, ox, oy] of blds) {
      const x = (b.x + ox) * 16 - X0, y = (b.y + oy) * 16 - Y0;
      if (x > CS + 16 || y > CS + 140 || x + b.w * 16 + 120 < 0 || y + b.h * 16 < -16) continue;
      const bi = G.tiles.building(b.kind, b.w, b.h, { roof: b.roof, door: b.door, accent: b.accent, label: b.label });
      castShadow(sx, bi.img, x, y - bi.oy, y + b.h * 16 - 1, { kx: .3, ky: .14 });
      // foundation occlusion line
      gx.fillStyle = 'rgba(12,16,36,.32)'; gx.fillRect(x + 1, y + b.h * 16, b.w * 16 - 2, 2);
    }
    // ---- assemble
    const mk = (arr) => { const cv = G.makeCanvas(CS, CS), c2 = cv.getContext('2d'), id = c2.createImageData(CS, CS); id.data.set(arr); c2.putImageData(id, 0, 0); return cv; };
    let hasWater = false; for (let i = 3; i < wm.length; i += 64) if (wm[i]) { hasWater = true; break; }
    let hasFoam = false; for (let i = 3; i < foamA.length; i += 16) if (foamA[i] || foamB[i]) { hasFoam = true; break; }
    return { gnd, shadow, foamA: hasFoam ? mk(foamA) : null, foamB: hasFoam ? mk(foamB) : null, wmask: hasWater ? mk(wm) : null, used: 0 };
  }
  // project a sprite's silhouette onto the ground away from a front-left sun:
  // shadow point = (x + kx*h, base - ky*h) for a pixel h above the base line
  function castShadow(sx, img, x, y, baseY, o = {}) {
    const kx = (o && o.kx) || .62, ky = (o && o.ky) || .38;
    const sil = G.shadowOf(img);
    sx.save();
    sx.setTransform(1, 0, -kx, ky, kx * baseY, (1 - ky) * baseY);
    sx.drawImage(sil, x, y);
    sx.restore();
  }

  // ------------------------------------------------------ animated layers
  // world-tiled water glints: 64x64, 16 frames
  let waterTex = null;
  function waterFrames() {
    if (waterTex) return waterTex;
    waterTex = [];
    const N = 16, S = 64, RR = RAMPS.water;
    const glints = [], waves = [];
    const rng = new G.RNG(4242);
    for (let i = 0; i < 12; i++) glints.push({ x: rng.int(0, S - 1), y: rng.int(0, S - 1), ph: rng.int(0, N - 1), big: rng.chance(.35) });
    for (let i = 0; i < 16; i++) waves.push({ x: rng.int(0, S - 1), y: rng.int(0, S - 1), len: rng.int(3, 7), ph: rng.next() * N, sp: rng.chance(.5) ? 1 : 2 });
    for (let f = 0; f < N; f++) {
      const p = new G.Painter(S, S);
      for (const w of waves) {
        const t = ((f + w.ph) % N) / N, a = Math.sin(t * Math.PI);
        if (a < .2) continue;
        const x0 = w.x + Math.round(t * 6 * w.sp), col = a > .7 ? RR[7] : RR[6];
        for (let i = 0; i < w.len; i++) p.set(((x0 + i) % S + S) % S, w.y, col, Math.round(170 * a));
        p.set(((x0 + 1) % S + S) % S, (w.y + 1) % S, RR[5], Math.round(90 * a));
      }
      for (const g of glints) {
        const t = (f - g.ph + N) % N; if (t > 5) continue;
        const a = [120, 255, 255, 200, 110, 50][t], c = RR[8];
        p.set(g.x, g.y, c, a);
        if (g.big && t >= 1 && t <= 3) { p.set(g.x - 1, g.y, c, a * .6); p.set(g.x + 1, g.y, c, a * .6); p.set(g.x, g.y - 1, c, a * .6); p.set(g.x, g.y + 1, c, a * .6); if (t === 2) { p.set(g.x - 2, g.y, c, 90); p.set(g.x + 2, g.y, c, 90); } }
      }
      waterTex.push(p.done());
    }
    return waterTex;
  }
  let vmask = null, vpat = null;
  return {
    CT, CS, M, natMat, invalidate, RAMPS,
    chunk(map, cx, cy) {
      const s = mapStore(map), k = cx + ',' + cy;
      let ch = s.chunks.get(k);
      if (!ch) { ch = bake(map, cx, cy); s.chunks.set(k, ch); total++; evict(); }
      ch.used = ++lruTick;
      return ch;
    },
    has(map, cx, cy) { const s = store.get(map.id); return !!(s && s.chunks.has(cx + ',' + cy)); },
    // draw baked ground + animated water for the view
    drawGround(b, map, ox, oy, frame, shadowA) {
      const cx0 = Math.floor(ox / CS), cy0 = Math.floor(oy / CS), cx1 = Math.floor((ox + G.W) / CS), cy1 = Math.floor((oy + G.H) / CS);
      const list = [];
      for (let cy = cy0; cy <= cy1; cy++) for (let cx = cx0; cx <= cx1; cx++) list.push([cx, cy, this.chunk(map, cx, cy)]);
      for (const [cx, cy, ch] of list) b.drawImage(ch.gnd, cx * CS - ox, cy * CS - oy);
      // water glints masked to open water
      const anyWater = list.some(l => l[2].wmask);
      if (anyWater) {
        if (!vmask) { vmask = G.makeCanvas(G.W, G.H); vpat = G.makeCanvas(G.W, G.H); }
        const mc = vmask.getContext('2d'), pc = vpat.getContext('2d');
        mc.clearRect(0, 0, G.W, G.H); pc.clearRect(0, 0, G.W, G.H);
        for (const [cx, cy, ch] of list) if (ch.wmask) mc.drawImage(ch.wmask, cx * CS - ox, cy * CS - oy);
        const tex = waterFrames()[Math.floor(frame / 7) % 16];
        const sx = ((ox % 64) + 64) % 64, sy = ((oy % 64) + 64) % 64;
        for (let y = -sy; y < G.H; y += 64) for (let x = -sx; x < G.W; x += 64) pc.drawImage(tex, x, y);
        // second, slower layer offset for parallax shimmer
        const tex2 = waterFrames()[(Math.floor(frame / 11) + 8) % 16];
        pc.globalAlpha = .55;
        for (let y = -((sy + 32) % 64); y < G.H; y += 64) for (let x = -((sx + 21) % 64); x < G.W; x += 64) pc.drawImage(tex2, x, y);
        pc.globalAlpha = 1;
        pc.globalCompositeOperation = 'destination-in'; pc.drawImage(vmask, 0, 0); pc.globalCompositeOperation = 'source-over';
        b.drawImage(vpat, 0, 0);
      }
      // lapping shore foam: two bands breathing out of phase
      const t = frame / 60;
      const aA = .55 + .45 * Math.sin(t * 2.1), aB = .5 + .5 * Math.sin(t * 2.1 - 1.9);
      for (const [cx, cy, ch] of list) if (ch.foamA) {
        b.globalAlpha = .35 + aA * .6; b.drawImage(ch.foamA, cx * CS - ox, cy * CS - oy);
        b.globalAlpha = aB * .55; b.drawImage(ch.foamB, cx * CS - ox, cy * CS - oy);
      }
      b.globalAlpha = 1;
      return list;
    },
    drawShadows(b, list, ox, oy, a) {
      if (a <= .01) return;
      b.globalAlpha = a;
      for (const [cx, cy, ch] of list) b.drawImage(ch.shadow, cx * CS - ox, cy * CS - oy);
      b.globalAlpha = 1;
    },
    // bake chunks around the camera ahead of time (a small budget per frame)
    prefetch(map, ox, oy, budget = 1) {
      const cx0 = Math.floor((ox - CS) / CS), cy0 = Math.floor((oy - CS) / CS), cx1 = Math.floor((ox + G.W + CS) / CS), cy1 = Math.floor((oy + G.H + CS) / CS);
      for (let cy = cy0; cy <= cy1 && budget > 0; cy++) for (let cx = cx0; cx <= cx1 && budget > 0; cx++) if (!this.has(map, cx, cy)) { this.chunk(map, cx, cy); budget--; }
    },
    castShadow,
  };
})();
