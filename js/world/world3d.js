'use strict';
// ============================================================================
//  3D world renderer (WebGL, three.js). Presentation only: the game still runs
//  on the 2D tile grid (movement, collision, scripts); this draws that grid as a
//  DS-style 3D scene. Terrain gets real height levels (cliffs become walls,
//  ramps become slopes), buildings become textured low-poly models, and
//  characters, trees and props stand in the scene as upright pixel sprites.
//  Rendered at a low internal resolution and scaled up with nearest filtering
//  so it keeps the pixel-art look. Units: 1 = one tile; x east, z south, y up.
// ============================================================================
G.W3 = (function () {
  const T = window.THREE;
  const LEVEL_H = 1.1;          // height of one cliff level, in tiles
  let bufW = 0, bufH = 0;       // drawing buffer follows the display (native resolution, MSAA)
  let camY = null, night = 0;
  const SUN_OFF = [-10, 22, 6];
  const _d = T ? new T.Vector3() : null, _r = T ? new T.Vector3() : null, _u = T ? new T.Vector3() : null, _p = T ? new T.Vector3() : null;
  let R = null, cv = null, scene, camera, sun, hemi, cache = new Map(), cur = null, ok = !!T;

  // ------------------------------------------------------------- setup
  function init() {
    if (R || !ok) return !!R;
    try {
      cv = document.createElement('canvas'); cv.id = 'w3';
      Object.assign(cv.style, { position: 'fixed', left: '0', top: '0', zIndex: '0', display: 'none' });
      document.body.insertBefore(cv, document.body.firstChild);
      R = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: false, powerPreference: 'high-performance' });
      R.setPixelRatio(1);
      R.shadowMap.enabled = true; R.shadowMap.type = T.PCFShadowMap;
      R.outputColorSpace = T.SRGBColorSpace;
      scene = new T.Scene();
      camera = new T.PerspectiveCamera(26, G.W / G.H, 8, 140);
      hemi = new T.HemisphereLight(0xdfeeff, 0x4a5a3a, .9); scene.add(hemi);
      sun = new T.DirectionalLight(0xfff0d8, 1.7);
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      const sc = sun.shadow.camera; sc.left = -22; sc.right = 22; sc.top = 22; sc.bottom = -22; sc.near = 1; sc.far = 80;
      sun.shadow.bias = -.0015; sun.shadow.normalBias = .02;
      scene.add(sun); scene.add(sun.target);
      return true;
    } catch (e) { console.warn('3D unavailable', e); ok = false; R = null; return false; }
  }
  const tex = (canvas) => { const t = new T.CanvasTexture(canvas); t.magFilter = T.NearestFilter; t.minFilter = T.LinearMipmapLinearFilter; t.generateMipmaps = true; t.anisotropy = R ? Math.min(8, R.capabilities.getMaxAnisotropy()) : 1; t.colorSpace = T.SRGBColorSpace; return t; };

  // ------------------------------------------------------------- heights
  // Levels come from the cliffs: cliff cells separate regions, the region north of a cliff is one
  // level above the region south of it. Walkable cells cut through a cliff line are ramps.
  // world base level per map: breadth-first over the map connections from the first town, matching
  // the ground level along each shared edge (cached; maps are static)
  let bases = null;
  function worldBase(id) {
    if (!bases) {
      bases = {}; const edges = {}, OPP = { n: 's', s: 'n', e: 'w', w: 'e' };
      const E = mid => { if (!(mid in edges)) { try { const d = G.MAPDEFS[mid]; edges[mid] = d && (d.type || 'outdoor') === 'outdoor' ? levels(G.maps.get(mid), true).edge : null; } catch (e) { edges[mid] = null; } } return edges[mid]; };
      const q = [];
      for (const root of ['brinehollow', ...Object.keys(G.MAPDEFS)]) {
        if (root in bases || !E(root)) continue;
        bases[root] = 0; q.push(root);
        while (q.length) {
          const a = q.shift(), ea = E(a), conn = G.MAPDEFS[a].conn || {};
          for (const d of ['n', 's', 'e', 'w']) { const c = conn[d]; if (!c || c.map in bases) continue; const eb = E(c.map); if (!eb) continue; bases[c.map] = bases[a] + (ea[d] || 0) - (eb[OPP[d]] || 0); q.push(c.map); }
        }
      }
    }
    return bases[id] || 0;
  }
  function levels(map, raw) {
    const vertical = !!(map.def && (map.def.town || map.def.env === 'city'));
    const W = map.w, H = map.h, N = W * H;
    const cliff = c => c && (c.g === 'cliff' || c.g === 'cavewall' || c.g === 'crystalwall');
    const isRamp = (x, y) => { const c = map.cell(x, y); if (!c || cliff(c) || c.solid && !c.ledge) return false; return cliff(map.cell(x - 1, y)) || cliff(map.cell(x + 1, y)) || (cliff(map.cell(x - 2, y)) && !cliff(map.cell(x - 1, y)) && isRampLine(x - 1, y)) || (cliff(map.cell(x + 2, y)) && isRampLine(x + 1, y)); };
    const isRampLine = (x, y) => { const c = map.cell(x, y); return c && !cliff(c) && !(c.solid && !c.ledge) && (cliff(map.cell(x - 1, y)) || cliff(map.cell(x + 1, y))); };
    const kind = new Uint8Array(N);   // 0 ground, 1 cliff, 2 ramp
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = map.cell(x, y); kind[y * W + x] = cliff(c) ? 1 : isRamp(x, y) ? 2 : 0; }
    // ramps spanning a whole cliff gap: every walkable cell in a row between cliff cells
    for (let y = 0; y < H; y++) {
      let x = 0;
      while (x < W) {
        if (kind[y * W + x] === 1) { let e = x + 1; while (e < W && kind[y * W + e] !== 1 && map.cell(e, y) && !map.cell(e, y).solid) e++; if (e < W && kind[y * W + e] === 1 && e - x - 1 <= 8) for (let k = x + 1; k < e; k++) kind[y * W + k] = 2; x = e; } else x++;
      }
    }
    // regions flood through walkable ground only, so a tree or rock border running past the end
    // of a cliff doesn't join the levels; solid cells then take the level of the nearest walkable cell
    const walk = new Uint8Array(N);
    for (let i = 0; i < N; i++) { const c = map.cells[i]; walk[i] = kind[i] === 0 && c && (!c.solid || c.water) ? 1 : 0; }
    const reg = new Int32Array(N).fill(-1); let nr = 0;
    const D4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < N; i++) if (walk[i] && reg[i] < 0) {
      const q = [i]; reg[i] = nr;
      while (q.length) { const p = q.pop(), x = p % W, y = (p / W) | 0; for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const n = ny * W + nx; if (walk[n] && reg[n] < 0) { reg[n] = nr; q.push(n); } } }
      nr++;
    }
    { let q = []; for (let i = 0; i < N; i++) if (reg[i] >= 0) q.push(i);
      while (q.length) { const nq = []; for (const p of q) { const x = p % W, y = (p / W) | 0; for (const [dx, dy] of D4) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue; const n = ny * W + nx; if (kind[n] === 0 && reg[n] < 0) { reg[n] = reg[p]; nq.push(n); } } } q = nq; }
      for (let i = 0; i < N; i++) if (kind[i] === 0 && reg[i] < 0) reg[i] = nr++; }
    // constraints from cliff and ramp cells: region above (north) = region below (south) + 1
    const edges = [];
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!kind[i]) continue;
      let up = -1, dn = -1;
      for (let k = 1; k <= 3 && up < 0; k++) { const yy = y - k; if (yy < 0) break; const j = yy * W + x; if (kind[j] === 0) up = reg[j]; else if (kind[j] !== kind[i]) break; }
      for (let k = 1; k <= 3 && dn < 0; k++) { const yy = y + k; if (yy >= H) break; const j = yy * W + x; if (kind[j] === 0) dn = reg[j]; else if (kind[j] !== kind[i]) break; }
      if (up >= 0 && dn >= 0 && up !== dn) edges.push([up, dn]);
    }
    const lv = new Array(nr).fill(null);
    for (let r0 = 0; r0 < nr; r0++) {
      if (lv[r0] !== null) continue;
      lv[r0] = 0; const q = [r0];
      while (q.length) { const r = q.shift(); for (const [u, d] of edges) { if (u === r && lv[d] === null) { lv[d] = lv[r] - 1; q.push(d); } if (d === r && lv[u] === null) { lv[u] = lv[r] + 1; q.push(u); } } }
    }
    // raw levels start at 0; each map then gets a world base so every seam meets its neighbour flush
    const minL = Math.min(0, ...lv.filter(v => v !== null));
    const edge = {};
    { const side = (cells) => { const cnt = new Map(); for (const [x, y] of cells) { const i = y * W + x; if (walk[i] && lv[reg[i]] !== null) { const l = lv[reg[i]] - minL; cnt.set(l, (cnt.get(l) || 0) + 1); } } let best = null, bc = 0; for (const [l, c] of cnt) if (c > bc) { bc = c; best = l; } return best; };
      const row = y => Array.from({ length: W }, (_, x) => [x, y]), col = x => Array.from({ length: H }, (_, y) => [x, y]);
      edge.n = side(row(0)); edge.s = side(row(H - 1)); edge.w = side(col(0)); edge.e = side(col(W - 1)); }
    if (raw) return { edge };
    const base = worldBase(map.id);
    // per-cell corner heights (NW, NE, SW, SE)
    const flat = new Float32Array(N);
    for (let i = 0; i < N; i++) if (kind[i] === 0) flat[i] = (lv[reg[i]] - minL + base) * LEVEL_H;
    const upDn = (x, y) => {
      let up = null, dn = null;
      for (let k = 1; k <= 4 && up === null; k++) { const yy = y - k; if (yy < 0) break; if (kind[yy * W + x] === 0) up = flat[yy * W + x]; }
      for (let k = 1; k <= 4 && dn === null; k++) { const yy = y + k; if (yy >= H) break; if (kind[yy * W + x] === 0) dn = flat[yy * W + x]; }
      if (up === null) up = dn || 0; if (dn === null) dn = up;
      return [up, dn];
    };
    const corner = new Float32Array(N * 4);
    const band = new Float32Array(N * 2);   // for sloped cells: [fraction of the drop already done at the north edge, at the south edge]
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (kind[i] === 0) { corner.fill(flat[i], i * 4, i * 4 + 4); continue; }
      // a vertical run of cliff/ramp cells spreads the drop over its length
      let top = y; while (top > 0 && kind[(top - 1) * W + x] === kind[i]) top--;
      let bot = y; while (bot < H - 1 && kind[(bot + 1) * W + x] === kind[i]) bot++;
      const [u, d] = upDn(x, top), n = bot - top + 1, a = (y - top) / n, b = (y - top + 1) / n;
      let hn = u + (d - u) * a, hs = u + (d - u) * b;
      // towns: retaining walls stand vertical (flat top, sheer front face); stairs keep their slope
      if (vertical && kind[i] === 1) hn = hs = Math.max(u, d);
      corner[i * 4] = corner[i * 4 + 1] = hn; corner[i * 4 + 2] = corner[i * 4 + 3] = hs;
    }
    const at = (fx, fy) => {   // smooth elevation at a fractional tile position
      const x = Math.floor(fx), y = Math.floor(fy);
      if (x < 0 || y < 0 || x >= W || y >= H) { const cx = G.clamp(x, 0, W - 1), cy = G.clamp(y, 0, H - 1); return corner[(cy * W + cx) * 4]; }
      const i = (y * W + x) * 4, u = fx - x, v = fy - y;
      const n = corner[i] + (corner[i + 1] - corner[i]) * u, s = corner[i + 2] + (corner[i + 3] - corner[i + 2]) * u;
      return n + (s - n) * v;
    };
    return { kind, corner, at, W, H };
  }

  // ------------------------------------------------------------- terrain mesh
  function buildTerrain(map, hv, group) {
    const CT = G.terrain.CT, W = map.w, H = map.h, PADT = 14;
    // water sits a little lower than land. A vertex drops only when all four cells around it are water,
    // so shores slope down instead of leaving a crack; cells past the edge come from the connected map
    const wcache = new Map();
    const isWater = (x, y) => {
      const key = x + ',' + y; if (wcache.has(key)) return wcache.get(key);
      let c;
      if (x >= 0 && y >= 0 && x < W && y < H) c = map.cell(x, y);
      else { const rr = map.resolve(x, y); c = rr ? rr.map.cells[rr.y * rr.map.w + rr.x] : G.borderCell(map, x, y); }
      const v = !!(c && c.water && c.g !== 'bridge' && c.g !== 'bridgev'); wcache.set(key, v); return v;
    };
    const vdrop = (vx, vy) => (isWater(vx - 1, vy - 1) && isWater(vx, vy - 1) && isWater(vx - 1, vy) && isWater(vx, vy)) ? -.14 : 0;
    group.userData.vdrop = vdrop;
    const stairs = !!(map.def.town || map.def.env === 'city');
    // chunks cover the map plus a border ring of trees/water
    for (let cy = Math.floor(-PADT / CT); cy <= Math.floor((H + PADT) / CT); cy++) for (let cx = Math.floor(-PADT / CT); cx <= Math.floor((W + PADT) / CT); cx++) {
      const ch = G.terrain.chunk(map, cx, cy);
      const cvs = G.makeCanvas(ch.gnd.width, ch.gnd.height), c2 = cvs.getContext('2d');
      c2.drawImage(ch.gnd, 0, 0); if (ch.shadow) { c2.globalAlpha = .55; c2.drawImage(ch.shadow, 0, 0); }
      const t = tex(cvs);
      const pos = [], uv = [], idx = [], col = [];
      for (let j = 0; j < CT; j++) for (let i = 0; i < CT; i++) {
        const x = cx * CT + i, y = cy * CT + j;
        const inside = x >= 0 && y >= 0 && x < W && y < H;
        // town stairs: a ramp cell becomes treads and risers instead of a smooth slope
        if (stairs && inside && hv.kind[y * W + x] === 2) {
          const k = (y * W + x) * 4, hn = (hv.corner[k] + hv.corner[k + 1]) / 2, hs = (hv.corner[k + 2] + hv.corner[k + 3]) / 2;
          if (Math.abs(hn - hs) > .05) {
            const n = Math.max(2, Math.round(Math.abs(hn - hs) / .16)), u0 = i / CT, u1 = (i + 1) / CT;
            for (let s2 = 0; s2 < n; s2++) {
              const z0 = y + s2 / n, z1 = y + (s2 + 1) / n, ht = hn + (hs - hn) * (s2 + 1) / n, hp = hn + (hs - hn) * s2 / n;
              const v0 = 1 - (j + s2 / n) / CT, v1 = 1 - (j + (s2 + 1) / n) / CT;
              let b = pos.length / 3;   // riser (vertical face at the front of the previous tread)
              pos.push(x, hp, z0, x + 1, hp, z0, x, ht, z0, x + 1, ht, z0);
              uv.push(u0, v0, u1, v0, u0, v0 - .002, u1, v0 - .002); col.push(.5, .5, .56, .5, .5, .56, .38, .38, .44, .38, .38, .44);
              idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
              b = pos.length / 3;       // tread
              pos.push(x, ht, z0, x + 1, ht, z0, x, ht, z1, x + 1, ht, z1);
              uv.push(u0, v0, u1, v0, u0, v1, u1, v1); col.push(1, 1, 1, 1, 1, 1, .9, .9, .9, .9, .9, .9);
              idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
            }
            continue;
          }
        }
        let h = [0, 0, 0, 0];
        if (inside) { const k = (y * W + x) * 4; h = [hv.corner[k], hv.corner[k + 1], hv.corner[k + 2], hv.corner[k + 3]]; }
        else {   // outside: follow the nearest edge column/row so level changes stay continuous (no gaps)
          const X = G.clamp(x + .5, .01, W - .01), yn = G.clamp(y, .01, H - .01), ys = G.clamp(y + 1, .01, H - .01);
          const xw = G.clamp(x, .01, W - .01), xe = G.clamp(x + 1, .01, W - .01), Y = G.clamp(y + .5, .01, H - .01);
          if (y >= 0 && y < H) { const n = hv.at(X, yn), s2 = hv.at(X, ys); h = [n, n, s2, s2]; }
          else if (x >= 0 && x < W) { const w = hv.at(xw, Y), e = hv.at(xe, Y); h = [w, e, w, e]; }
          else h.fill(hv.at(X, Y));
        }
        const b = pos.length / 3; col.push(1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1);
        pos.push(x, h[0] + vdrop(x, y), y, x + 1, h[1] + vdrop(x + 1, y), y, x, h[2] + vdrop(x, y + 1), y + 1, x + 1, h[3] + vdrop(x + 1, y + 1), y + 1);
        uv.push(i / CT, 1 - j / CT, (i + 1) / CT, 1 - j / CT, i / CT, 1 - (j + 1) / CT, (i + 1) / CT, 1 - (j + 1) / CT);
        idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
      }
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
      const mesh = new T.Mesh(g, new T.MeshLambertMaterial({ map: t, vertexColors: true }));
      mesh.receiveShadow = true; group.add(mesh);
    }
    // water shimmer: a scrolling layer of pixel glints and wave dashes over every water cell
    { const wp = [], wu = [], wi = [];
      for (let y = -PADT; y < H + PADT; y++) for (let x = -PADT; x < W + PADT; x++) {
        const inside = x >= 0 && y >= 0 && x < W && y < H, rr = inside ? null : map.resolve(x, y);
        const c = inside ? map.cell(x, y) : rr ? rr.map.cells[rr.y * rr.map.w + rr.x] : G.borderCell(map, x, y);
        if (!c || !c.water) continue;
        const hh = (vx, vy) => hv.at(G.clamp(vx, .01, W - .01), G.clamp(vy, .01, H - .01)) + vdrop(vx, vy) + .012, b = wp.length / 3;
        wp.push(x, hh(x, y), y, x + 1, hh(x + 1, y), y, x, hh(x, y + 1), y + 1, x + 1, hh(x + 1, y + 1), y + 1);
        wu.push(x / 4, -y / 4, (x + 1) / 4, -y / 4, x / 4, -(y + 1) / 4, (x + 1) / 4, -(y + 1) / 4);
        wi.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
      }
      if (wp.length) {
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(wp, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(wu, 2)); g.setIndex(wi);
        const mk = (seed, op) => { const t = glintTexture(seed); const m = new T.Mesh(g, new T.MeshBasicMaterial({ map: t, transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false })); m.renderOrder = 1; group.add(m); return t; };
        group.userData.water = [mk(1, .55), mk(2, .35)];
      }
    }
    // cliff walls: vertical rock faces where a cell is higher than its east/west/south neighbour
    const rock = rockTexture(map.def.cliffStyle || (map.def.town ? 'stone' : 'rock'));
    const pos = [], uv = [], idx = [];
    const face = (x0, z0, x1, z1, yTop0, yTop1, yBot) => {
      const b = pos.length / 3, hgt = Math.max(yTop0, yTop1) - yBot;
      pos.push(x0, yTop0, z0, x1, yTop1, z1, x0, yBot, z0, x1, yBot, z1);
      const L = Math.hypot(x1 - x0, z1 - z0);
      uv.push(0, hgt, L, hgt, 0, 0, L, 0); idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = (y * W + x) * 4, C = hv.corner;
      // south face
      if (y + 1 < H) { const k2 = ((y + 1) * W + x) * 4, bot = Math.min(C[k2], C[k2 + 1]); if (C[k + 2] - bot > .2) face(x, y + 1, x + 1, y + 1, C[k + 2], C[k + 3], bot); }
      if (x + 1 < W) { const k2 = (y * W + x + 1) * 4; const hA = Math.max(C[k + 1], C[k + 3]), hB = Math.max(C[k2], C[k2 + 2]); if (hA - hB > .2) face(x + 1, y + 1, x + 1, y, C[k + 3], C[k + 1], Math.min(C[k2], C[k2 + 2])); }
      if (x > 0) { const k2 = (y * W + x - 1) * 4; const hA = Math.max(C[k], C[k + 2]), hB = Math.max(C[k2 + 1], C[k2 + 3]); if (hA - hB > .2) face(x, y, x, y + 1, C[k], C[k + 2], Math.min(C[k2 + 1], C[k2 + 3])); }
    }
    if (pos.length) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
      const m = new T.Mesh(g, new T.MeshLambertMaterial({ map: rock, side: T.DoubleSide })); m.receiveShadow = true; m.castShadow = true; group.add(m);
    }
  }
  // 64x64 tile of sparse glints and short wave dashes, pixel-exact, for the scrolling water layers
  function glintTexture(seed) {
    const cv = G.makeCanvas(64, 64), c = cv.getContext('2d'), rnd = new G.RNG(seed * 97 + 5);
    for (let i = 0; i < 26; i++) { const x = Math.floor(rnd.next() * 64), y = Math.floor(rnd.next() * 64), l = 2 + Math.floor(rnd.next() * 4); c.fillStyle = `rgba(200,235,255,${.35 + rnd.next() * .4})`; c.fillRect(x, y, l, 1); }
    for (let i = 0; i < 10; i++) { const x = Math.floor(rnd.next() * 64), y = Math.floor(rnd.next() * 64); c.fillStyle = 'rgba(255,255,255,.9)'; c.fillRect(x, y, 1, 1); }
    const t = new T.CanvasTexture(cv); t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace;
    return t;
  }
  const rockTex = {};
  function rockTexture(style = 'rock') {
    if (rockTex[style]) return rockTex[style];
    const p = new G.Painter(16, 16);
    if (style === 'stone') {
      // dressed stone courses: offset blocks, dark mortar, lit top edges, a grass lip
      const C = ['#8a8478', '#9a9486', '#a8a292', '#b6b09e'], mortar = G.rgb('#4e4a44'), hi = G.rgb('#cfc8b4'), lo = G.rgb('#6e685e');
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const course = Math.floor((y - 2) / 5), yy = (y - 2) % 5, off = course % 2 ? 4 : 0, bx = (x + off) % 8;
        const block = Math.floor((x + off) / 8) + course * 3, base = G.rgb(C[((block * 7 + 3) % 4 + 4) % 4]);
        let col = base;
        if (yy === 4 || bx === 7) col = mortar; else if (yy === 0) col = hi; else if (yy === 3 || bx === 6) col = lo;
        else if (((x * 13 + y * 7) % 11) === 0) col = lo;
        p.set(x, y, col);
      }
    } else {
      const Rm = G.ramp(['#4a3a2e', '#5e4a3a', '#735c48', '#8a7058', '#a0866a']);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) p.set(x, y, G.tiles.rockAt(x, y, Rm.concat([Rm[4], Rm[4], Rm[4]]), 7, 7, 5.5));
    }
    for (let x = 0; x < 16; x++) { p.set(x, 0, G.rgb('#5aa446')); p.set(x, 1, G.rgb(x % 3 ? '#3e7a34' : '#5aa446')); }
    const t = tex(p.done()); t.wrapS = t.wrapT = T.RepeatWrapping;
    return (rockTex[style] = t);
  }

  // ------------------------------------------------------------- billboards
  // upright sprite whose bottom-centre sits on the ground; tilted back to face the camera so the
  // pixel art reads exactly as drawn
  const PITCH = .8;   // radians the camera looks down from horizontal
  const PITCH_CAM = .8;
  function billboard(img, opts = {}) {
    const t = tex(img);
    const mat = new T.MeshLambertMaterial({ map: t, alphaTest: .5, alphaToCoverage: true, transparent: false, side: T.DoubleSide });
    const g = new T.PlaneGeometry(img.width / 16, img.height / 16); g.translate(0, img.height / 32, 0);
    const m = new T.Mesh(g, mat);
    m.rotation.x = -(Math.PI / 2 - PITCH) * (opts.lean === undefined ? .55 : opts.lean);
    m.castShadow = opts.shadow !== false;
    m.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: t, alphaTest: .5 });
    m.userData.tex = t; m.userData.img = img;
    return m;
  }
  function setBillboardImage(m, img) {
    if (m.userData.img === img) return;
    const t = tex(img); m.material.map = t; m.material.needsUpdate = true; m.customDepthMaterial.map = t; m.customDepthMaterial.needsUpdate = true;
    if (m.userData.w !== img.width || m.userData.h !== img.height) { m.geometry.dispose(); m.geometry = new T.PlaneGeometry(img.width / 16, img.height / 16); m.geometry.translate(0, img.height / 32, 0); m.userData.w = img.width; m.userData.h = img.height; }
    if (m.userData.tex) m.userData.tex.dispose(); m.userData.tex = t; m.userData.img = img;
  }

  // ------------------------------------------------------------- props
  function buildProps(map, hv, group) {
    const W = map.w, H = map.h, PADT = 12;
    for (let y = -PADT; y < H + PADT; y++) for (let x = -PADT; x < W + PADT; x++) {
      const inside = x >= 0 && y >= 0 && x < W && y < H;
      // beyond the edge: the connected map's own cell if there is one, otherwise the border fill
      const rr = inside ? null : map.resolve(x, y);
      const c = inside ? map.cell(x, y) : rr ? rr.map.cells[rr.y * rr.map.w + rr.x] : G.borderCell(map, x, y);
      if (c && (c.g === 'tall' || c.g === 'flowers' || c.g === 'hedge')) {
        // live ground (tall grass, flower beds, hedges) stands up out of the terrain
        let lt = null; const cm = rr ? rr.map : map; try { lt = c.g === 'hedge' ? G.tiles.hedgeSprite(cm, c) : G.liveTile(cm, c, 0); } catch (e) { }
        if (lt && lt.img) {
          const m = billboard(lt.img, { lean: c.g === 'hedge' ? .6 : .85, shadow: c.g !== 'flowers' });
          const bz = y + (16 + (lt.oy || 0) + lt.img.height - 16) / 16;
          m.position.set(x + .5, hv.at(G.clamp(x + .5, 0, W - .01), G.clamp(y + .5, 0, H - .01)) + .01, Math.min(bz, y + 1) - .02);
          if (c.g === 'flowers') { m.rotation.x = -Math.PI / 2; m.position.z = y + .5 + lt.img.height / 32; m.position.y += .02; }
          group.add(m);
        }
      }
      if (c && c.light && inside) (group.userData.lights || (group.userData.lights = [])).push({ x: x + .5, z: y + .6, y: hv.at(x + .5, y + .5), kind: c.light, ground: !c.o });
      if (!c || !c.o || c.o === 'table' || c.o === 'bed' || c.o === 'rug') continue;
      if (c.cut || c.smash || c.push || c.solidIf) continue;   // stateful props stay dynamic (drawn as ents below)
      let oi; try { oi = G.objImg(rr ? rr.map : map, c, 0); } catch (e) { oi = null; }
      if (!oi || !oi.img || oi.flat) continue;
      const m = billboard(oi.img);
      const bx = x + ((oi.ox || 0) + oi.img.width / 2) / 16, bz = y + ((oi.oy || 0) + oi.img.height) / 16;
      m.position.set(bx, hv.at(G.clamp(bx, 0, W - .01), G.clamp(bz - .2, 0, H - .01)), bz - .12);
      group.add(m);
      if (oi.img.height > 24) { m.userData.hw = oi.img.width / 32; m.userData.ht = oi.img.height / 16; m.userData.fade = 1; (group.userData.tall || (group.userData.tall = [])).push(m); }
    }
  }

  // ------------------------------------------------------------- buildings
  // a box body plus a pitched roof, textured by cutting the building's art into facade and roof
  const WALL = { house: .44, haven: .48, mart: .48, lab: .46, gym: .5 };
  const FLAT_ROOF = new Set(['lab']);
  function buildBuildings(map, hv, group) {
    const list = map.buildings.map(b => b);
    for (const cn of map.conns) { const nm = cn.map; if (nm) for (const b of nm.buildings) list.push({ ...b, x: b.x + cn.ox, y: b.y + cn.oy }); }
    for (const b of list) {
      const bi = G.tiles.building(b.kind, b.w, b.h, { roof: b.roof, door: b.door, accent: b.accent, label: b.label });
      const img = bi.img, ax = bi.atlas ? G.bldAlign(b) : 0;
      const baseY = hv.at(b.x + b.w / 2, Math.min(map.h - .01, b.y + b.h - .5));
      const x0 = b.x + ax / 16, x1 = x0 + b.w, zF = b.y + b.h, zB = b.y + .3;
      const g = new T.Group(); group.add(g);
      if (b.kind === 'tower' || b.kind === 'lighthouse') {
        // tall landmarks: stand the art up as a thick cut-out with side walls
        const m = billboard(img, { lean: 0 }); m.position.set(x0 + b.w / 2, baseY, zF - .05); g.add(m);
        continue;
      }
      const f = WALL[b.kind] || .45, wallPx = Math.round(img.height * f), roofPx = img.height - wallPx;
      const facade = G.makeCanvas(img.width, wallPx); facade.getContext('2d').drawImage(img, 0, roofPx, img.width, wallPx, 0, 0, img.width, wallPx);
      const roof = G.makeCanvas(img.width, roofPx); roof.getContext('2d').drawImage(img, 0, 0, img.width, roofPx, 0, 0, img.width, roofPx);
      // side walls: the facade's average wall colour, a shade darker, with a plinth
      const side = G.makeCanvas(8, 16); {
        let r = 0, gg = 0, bb = 0, n = 0; const d = facade.getContext('2d').getImageData(0, 0, facade.width, facade.height).data;
        for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; }
        const sc = side.getContext('2d'), col = n ? [r / n, gg / n, bb / n] : [200, 190, 170];
        sc.fillStyle = `rgb(${col[0] * .82 | 0},${col[1] * .82 | 0},${col[2] * .82 | 0})`; sc.fillRect(0, 0, 8, 16);
        sc.fillStyle = `rgb(${col[0] * .6 | 0},${col[1] * .6 | 0},${col[2] * .6 | 0})`; sc.fillRect(0, 13, 8, 3);
      }
      const wallH = Math.min(1.9, wallPx / 16), depth = zF - zB;
      const mFac = new T.MeshLambertMaterial({ map: tex(facade), alphaTest: .4, alphaToCoverage: true, side: T.DoubleSide });
      const mSide = new T.MeshLambertMaterial({ map: tex(side) });
      const mRoof = new T.MeshLambertMaterial({ map: tex(roof), alphaTest: .4, alphaToCoverage: true, side: T.DoubleSide });
      // body
      const body = new T.Mesh(new T.BoxGeometry(b.w - .1, wallH, depth - .05), [mSide, mSide, mSide, mSide, mFac, mSide]);
      body.position.set(x0 + b.w / 2, baseY + wallH / 2, zB + depth / 2); body.castShadow = body.receiveShadow = true; g.add(body);
      if (FLAT_ROOF.has(b.kind)) {
        // modern flat roof: a shallow slab carrying the roof art on top, with a lit parapet edge
        const slab = new T.Mesh(new T.BoxGeometry(b.w + .1, .32, depth + .12), [mSide, mSide, mRoof, mSide, mSide, mSide]);
        slab.position.set(x0 + b.w / 2, baseY + wallH + .16, zB + depth / 2); slab.castShadow = slab.receiveShadow = true; g.add(slab);
        continue;
      }
      // one closed wedge: a single roof plane from the front eave up to the back ridge carries the whole
      // roof art; its rise is solved so that, seen from the camera, it is as tall as the art draws it.
      // Triangular gables and a back wall close it, so every edge meets another face.
      const want = roofPx / 16, sp = Math.sin(PITCH_CAM), cp = Math.cos(PITCH_CAM);
      const rise = G.clamp((want - depth * sp) / cp, .35, 2.6);
      const ov = .14, X0 = x0 + .05 - ov, X1 = x1 - .05 + ov, Y0 = baseY + wallH, Y1 = Y0 + rise, ZF = zF - .025 + ov, ZB = zB + .025;
      const quad = (P, U, mat, shadow = true) => {
        const g2 = new T.BufferGeometry(); g2.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g2.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
        g2.setIndex(P.length === 12 ? [0, 2, 1, 1, 2, 3] : [0, 1, 2]); g2.computeVertexNormals();
        const m = new T.Mesh(g2, mat); m.castShadow = shadow; m.receiveShadow = true; g.add(m); return m;
      };
      // roof (eave at the front, overhanging a little on three sides)
      quad([X0, Y0 - ov * .45, ZF, X1, Y0 - ov * .45, ZF, X0, Y1, ZB - .02, X1, Y1, ZB - .02], [0, 0, 1, 0, 0, 1, 1, 1], mRoof);
      // gables: triangles under the roof plane on both sides, and the back wall up to the ridge
      const gx0 = x0 + .05, gx1 = x1 - .05, gzF = zF - .025, gzB = zB + .025;
      quad([gx0, Y0, gzF, gx0, Y0, gzB, gx0, Y1 - .01, gzB], [0, 0, 1, 0, 1, 1], mSide);
      quad([gx1, Y0, gzF, gx1, Y1 - .01, gzB, gx1, Y0, gzB], [0, 0, 1, 1, 1, 0], mSide);
      quad([gx0, Y0, gzB, gx1, Y0, gzB, gx0, Y1 - .01, gzB, gx1, Y1 - .01, gzB], [0, 0, 1, 0, 0, 1, 1, 1], mSide);
    }
  }

  // ------------------------------------------------------------- railings
  // towns get dark iron railings along every retaining-wall top (leaving the stair openings free)
  // and down both sides of each staircase: posts every tile, a top rail and a mid rail
  function buildRailings(map, hv, group) {
    if (!(map.def.town || map.def.env === 'city')) return;
    const W = map.w, H = map.h, K = hv.kind;
    const walk = (x, y) => { const c = map.cell(x, y); return c && !c.solid; };
    const pos = [], idx = [];
    const box = (x0, y0, z0, x1, y1, z1) => {
      const b = pos.length / 3;
      pos.push(x0, y0, z0, x1, y0, z0, x1, y1, z0, x0, y1, z0, x0, y0, z1, x1, y0, z1, x1, y1, z1, x0, y1, z1);
      idx.push(b, b + 1, b + 2, b, b + 2, b + 3, b + 5, b + 4, b + 7, b + 5, b + 7, b + 6, b + 4, b, b + 3, b + 4, b + 3, b + 7,
               b + 1, b + 5, b + 6, b + 1, b + 6, b + 2, b + 3, b + 2, b + 6, b + 3, b + 6, b + 7);
    };
    // a rail between two points (sloped rails for stairs): a chain of short boxes
    const rail = (xa, ya, za, xb, yb, zb, r) => {
      const n = Math.max(1, Math.ceil(Math.hypot(xb - xa, zb - za) * 4));
      for (let k = 0; k < n; k++) {
        const t0 = k / n, t1 = (k + 1) / n;
        const x0 = xa + (xb - xa) * t0, x1 = xa + (xb - xa) * t1, z0 = za + (zb - za) * t0, z1 = za + (zb - za) * t1, y0 = ya + (yb - ya) * t0, y1 = ya + (yb - ya) * t1;
        box(Math.min(x0, x1) - r, Math.min(y0, y1) - r, Math.min(z0, z1) - r, Math.max(x0, x1) + r, Math.max(y0, y1) + r, Math.max(z0, z1) + r);
      }
    };
    const post = (x, y, z) => box(x - .035, y, z - .035, x + .035, y + .5, z + .035);
    for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      // wall top: a cliff cell with walkable upper ground directly north
      if (K[i] === 1 && K[i - W] === 0 && walk(x, y - 1)) {
        const h = hv.corner[(y * W + x) * 4], z = y + .06;
        post(x + .02, h, z); rail(x, h + .48, z, x + 1, h + .48, z, .028); rail(x, h + .26, z, x + 1, h + .26, z, .018);
        if (!(K[i + 1] === 1 && K[i + 1 - W] === 0)) post(x + .98, h, z);
      }
      // stair sides: a ramp cell next to a wall cell
      if (K[i] === 2) for (const [dx, ex] of [[-1, .06], [1, .94]]) {
        const nb = K[i + dx];
        if (x + dx < 0 || x + dx >= W || nb !== 1) continue;
        const k = i * 4, hn = hv.corner[k + (dx < 0 ? 0 : 1)], hs = hv.corner[k + (dx < 0 ? 2 : 3)];
        const xx = x + ex;
        post(xx, hn, y + .05); post(xx, hs, y + .95);
        rail(xx, hn + .48, y, xx, hs + .48, y + 1, .028); rail(xx, hn + .26, y, xx, hs + .26, y + 1, .018);
      }
    }
    if (!pos.length) return;
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new T.Mesh(g, new T.MeshLambertMaterial({ color: 0x2c303c })); m.castShadow = true; m.receiveShadow = true; group.add(m);
  }

  // ------------------------------------------------------------- lights
  // every lamp, lantern, crystal and lava cell gets an additive glow sprite (faded in by night, lava
  // always on); a small pool of point lights follows the nearest ones so they light the ground
  const LIGHT_COL = { lamp: 0xffc47a, lantern: 0xffb060, crystal: 0x7ae0ff, lava: 0xff6a2a, screen: 0x7ab0ff };
  const LIGHT_LIFT = { lamp: 1.9, lantern: 1.25, crystal: .7, lava: .15, screen: .8 };
  let glowTex = null;
  function glowTexture() {
    if (glowTex) return glowTex;
    const c = G.makeCanvas(64, 64), x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.18, 'rgba(255,255,255,.55)'); g.addColorStop(.5, 'rgba(255,255,255,.14)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    glowTex = new T.CanvasTexture(c); glowTex.colorSpace = T.SRGBColorSpace;
    return glowTex;
  }
  function buildGlows(group) {
    const L = group.userData.lights || []; group.userData.glows = [];
    for (const l of L) {
      const mat = new T.SpriteMaterial({ map: glowTexture(), color: LIGHT_COL[l.kind] || 0xffc47a, blending: T.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0 });
      const sp = new T.Sprite(mat), sz = l.kind === 'lava' ? 2.2 : l.kind === 'crystal' ? 1.8 : 1.5;
      sp.scale.set(sz, sz, 1); sp.position.set(l.x, l.y + (LIGHT_LIFT[l.kind] || 1), l.z - (l.ground ? 0 : .1));
      sp.userData.l = l; group.add(sp); group.userData.glows.push(sp);
    }
  }
  const POOL = [];
  function updateLights(E, fx, fz) {
    if (!POOL.length) for (let i = 0; i < 6; i++) { const pl = new T.PointLight(0xffc47a, 0, 6, 1.6); scene.add(pl); POOL.push(pl); }
    const glows = E.group.userData.glows || [];
    for (const g of glows) { const on = g.userData.l.kind === 'lava' ? .75 : night * .9; g.material.opacity = on * (.85 + Math.sin(G.realTime * 3 + g.position.x * 1.7) * .15); }
    const near = glows.filter(g => g.userData.l.kind === 'lava' || night > .05).map(g => [g, (g.position.x - fx) ** 2 + (g.position.z - fz) ** 2]).sort((a, b) => a[1] - b[1]).slice(0, POOL.length);
    POOL.forEach((pl, i) => {
      const n = near[i];
      if (!n || n[1] > 400) { pl.intensity = 0; return; }
      const l = n[0].userData.l; pl.color.setHex(LIGHT_COL[l.kind] || 0xffc47a);
      pl.position.set(l.x, l.y + (LIGHT_LIFT[l.kind] || 1) * .8, l.z);
      pl.intensity = (l.kind === 'lava' ? 1.2 : night * 2.2) * (.9 + Math.sin(G.realTime * 4 + i) * .1);
    });
  }

  // ------------------------------------------------------------- build / cache
  function build(map) {
    if (cache.has(map.id)) return cache.get(map.id);
    const group = new T.Group(), hv = levels(map);
    buildTerrain(map, hv, group);
    buildProps(map, hv, group);
    buildBuildings(map, hv, group);
    buildRailings(map, hv, group);
    buildGlows(group);
    const dyn = new T.Group(); group.add(dyn);
    const entry = { map, group, hv, dyn, sprites: new Map() };
    cache.set(map.id, entry);
    if (cache.size > 4) { const k = cache.keys().next().value; if (k !== map.id) { dispose(cache.get(k).group); cache.delete(k); } }
    return entry;
  }
  function dispose(obj) { obj.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); }); }); }

  // ------------------------------------------------------------- per-frame
  function entImage(w, e) {
    if (e.kind === 'item') { if (e.hidden) return null; return G.tiles.get('fu|orbball|0', 16, 16, p => G.tiles.furniture(p, 'orbball', 0)); }
    if (e.kind === 'sign') { if (e.invisible && !e.deco) return null; return e.deco ? null : (G.tiles.atlas && G.tiles.atlas('sign')); }
    if (e.monSprite) return G.monArt.overworld(e.monSprite, !!e.shiny, e.dir, Math.floor(w.frame / 16) % 2);
    if (!e.look) return null;
    const sh = G.chars.sheet(e.look), surf = e === w.player && w.surfing;
    const set = sh[e.dir + (surf ? '_surf' : '')] || sh.down, fr = surf ? 0 : e.animFrame();
    return set[Math.min(fr, set.length - 1)];
  }
  function syncEnts(w, E) {
    const seen = new Set(), H = E.hv;
    const place = (key, img, px, py, lift = 0) => {
      seen.add(key);
      let m = E.sprites.get(key);
      if (!img) { if (m) m.visible = false; return; }
      if (!m) { m = billboard(img, { lean: .5 }); E.sprites.set(key, m); E.dyn.add(m); }
      setBillboardImage(m, img); m.visible = true;
      const fx = px / 16 + .5, fz = py / 16 + 1;
      m.position.set(fx, H.at(G.clamp(fx, 0, H.W - .01), G.clamp(fz - .5, 0, H.H - .01)) + lift / 16, fz - .3);
    };
    for (const e of w.ents) if (e.visible && !e.hidden) {
      // swimmers sink to the chest: the opaque water surface hides the rest
      const c = w.map.cell(e.x, e.y), swim = c && c.water && c.g !== 'bridge' && c.g !== 'bridgev';
      const img = entImage(w, e);
      place('e:' + e.id + ':' + e.x0id, img, e.px, e.py, swim && img ? -img.height * .5 + Math.sin(w.frame / 14 + e.x) : (e.hop || 0));
    }
    if (w.player) place('player', entImage(w, w.player), w.player.px, w.player.py, w.player.hop || 0);
    const f = w.follower; if (f && !f.hidden) place('follower', G.monArt.overworld(f.mon.sp, f.mon.shiny, f.dir, Math.floor(w.frame / 10) % 2), f.px, f.py, f.hop || 0);
    for (const [k, m] of E.sprites) if (!seen.has(k)) m.visible = false;
  }
  function lighting(w) {
    const h = G.clock.hourF(), m = w.map;
    const indoor = m.type !== 'outdoor';
    const day = indoor ? 1 : h >= 7 && h <= 17 ? 1 : h > 17 && h < 19.5 ? 1 - (h - 17) / 2.5 : h > 5 && h < 7 ? (h - 5) / 2 : 0;
    const dusk = !indoor && ((h > 16.5 && h < 20) || (h > 5 && h < 7.5));
    night = indoor ? 0 : 1 - day;
    sun.intensity = .35 + 1.45 * day; sun.color.set(dusk ? 0xffb070 : day > .5 ? 0xfff0d8 : 0x9ab0ff);
    hemi.intensity = .45 + .55 * day; hemi.color.set(day > .3 ? 0xdfeeff : 0x5a6aa8); hemi.groundColor.set(day > .3 ? 0x4a5a3a : 0x1a1e30);
    const sky = indoor ? 0x08080e : dusk ? 0xe8a88a : day > .3 ? 0x9cc8f0 : 0x0a1030;
    scene.background = new T.Color(sky);
    scene.fog = indoor ? null : new T.Fog(sky, 26, 60);
  }
  function render(w) {
    if (!init()) return false;
    const map = w.map;
    if (!cur || cur.map !== map) { if (cur) scene.remove(cur.group); cur = build(map); scene.add(cur.group); }
    syncEnts(w, cur);
    lighting(w);
    // camera: behind and above the player, a fixed DS-like pitch
    const p = w.player, fx = p.px / 16 + .5, fz = p.py / 16 + .5, fy = cur.hv.at(G.clamp(fx, 0, map.w - .01), G.clamp(fz, 0, map.h - .01));
    // tall props standing between the camera and the player fade out, so a lower tier stays readable
    for (const m of cur.group.userData.tall || []) {
      const dz = m.position.z - fz, dx = Math.abs(m.position.x - fx);
      const occ = dz > .35 && dz < m.userData.ht * 1.3 + .4 && dx < m.userData.hw + .55 && (m.position.y + m.userData.ht * .5 > fy);
      const f = m.userData.fade = m.userData.fade + ((occ ? .38 : 1) - m.userData.fade) * .18;
      const tr = f < .98;
      if (m.material.transparent !== tr) { m.material.transparent = tr; m.material.depthWrite = !tr; m.material.alphaTest = tr ? .12 : .5; m.material.needsUpdate = true; }
      m.material.opacity = tr ? f : 1;
    }
    updateLights(cur, fx, fz);
    const wt = cur.group.userData.water; if (wt) { const tt = G.realTime; wt[0].offset.set((tt * .05) % 1, (Math.sin(tt * .4) * .03)); wt[1].offset.set((-tt * .035) % 1, (tt * .02) % 1); }
    camY = camY === null || Math.abs(camY - fy) > 4 ? fy : camY + (fy - camY) * .12;
    const dist = 30, cy = Math.sin(PITCH) * dist, cz = Math.cos(PITCH) * dist;
    camera.position.set(fx, camY + cy, fz + cz); camera.lookAt(fx, camY + .6, fz);
    // shadow camera snapped to its own texel grid, so shadows don't crawl as the player moves
    { const off = SUN_OFF, dir = _d.set(off[0], off[1], off[2]).normalize();
      const rt = _r.set(0, 1, 0).cross(dir).normalize(), up = _u.copy(dir).cross(rt).normalize();
      const P = _p.set(fx, fy, fz), texel = 44 / 2048;
      const a = Math.round(P.dot(rt) / texel) * texel, b = Math.round(P.dot(up) / texel) * texel, c = P.dot(dir);
      P.copy(rt).multiplyScalar(a).addScaledVector(up, b).addScaledVector(dir, c);
      sun.position.set(P.x + off[0], P.y + off[1], P.z + off[2]); sun.target.position.copy(P); }
    // canvas placed exactly over the game viewport, drawn at the display's native resolution
    const S = G.gfx.S, dpr = window.devicePixelRatio || 1;
    const bw = Math.round(G.W * S), bh = Math.round(G.H * S);
    if (bw !== bufW || bh !== bufH) { bufW = bw; bufH = bh; R.setSize(bw, bh, false); }
    Object.assign(cv.style, { display: 'block', left: (G.gfx.ox / dpr) + 'px', top: (G.gfx.oy / dpr) + 'px', width: (G.W * S / dpr) + 'px', height: (G.H * S / dpr) + 'px' });
    R.render(scene, camera);
    return true;
  }
  function hide() { if (cv) cv.style.display = 'none'; }
  // world pixel position -> screen position in game units (for UI overlays such as emotes)
  function project(px, py, lift = 0) {
    if (!cur) return null;
    const fx = px / 16, fz = py / 16, v = new T.Vector3(fx, cur.hv.at(G.clamp(fx, 0, cur.map.w - .01), G.clamp(fz, 0, cur.map.h - .01)) + lift, fz).project(camera);
    return { x: (v.x + 1) / 2 * G.W, y: (1 - v.y) / 2 * G.H };
  }
  // world pixel -> screen on a flat plane at the camera focus height (weather, drifting particles)
  const _v = T ? new T.Vector3() : null;
  function projectFlat(px, py) {
    if (!cur || camY === null) return null;
    _v.set(px / 16, camY, py / 16).project(camera);
    return { x: (_v.x + 1) / 2 * G.W, y: (1 - _v.y) / 2 * G.H };
  }
  const active = (s) => ok && s && s.isWorld && G.settings.render3d && s.map && s.map.type === 'outdoor';
  return { _cur: () => cur, _bases: () => bases, levels, active, render, hide, project, projectFlat, invalidate: id => { const e = cache.get(id); if (e) { if (cur === e) { scene.remove(e.group); cur = null; } dispose(e.group); cache.delete(id); } } };
})();
