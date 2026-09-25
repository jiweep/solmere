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
  const U3 = T ? { uTime: { value: 0 }, uWind: { value: 0 }, uRustle: { value: [new T.Vector4(), new T.Vector4(), new T.Vector4(), new T.Vector4()] } } : null;   // shared by every swaying / animated material
  const texPx = (canvas) => { const t = new T.CanvasTexture(canvas); t.magFilter = T.NearestFilter; t.minFilter = T.NearestFilter; t.generateMipmaps = false; t.colorSpace = T.SRGBColorSpace; return t; };
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
    { const wp = [], wu = [], wi = [], ws = [];
      const shoreV = (vx, vy) => (isWater(vx - 1, vy - 1) && isWater(vx, vy - 1) && isWater(vx - 1, vy) && isWater(vx, vy)) ? 0 : 1;
      for (let y = -PADT; y < H + PADT; y++) for (let x = -PADT; x < W + PADT; x++) {
        const inside = x >= 0 && y >= 0 && x < W && y < H, rr = inside ? null : map.resolve(x, y);
        const c = inside ? map.cell(x, y) : rr ? rr.map.cells[rr.y * rr.map.w + rr.x] : G.borderCell(map, x, y);
        if (!c || !c.water) continue;
        const hh = (vx, vy) => hv.at(G.clamp(vx, .01, W - .01), G.clamp(vy, .01, H - .01)) + vdrop(vx, vy) + .012, b = wp.length / 3;
        wp.push(x, hh(x, y), y, x + 1, hh(x + 1, y), y, x, hh(x, y + 1), y + 1, x + 1, hh(x + 1, y + 1), y + 1);
        wu.push(x / 4, -y / 4, (x + 1) / 4, -y / 4, x / 4, -(y + 1) / 4, (x + 1) / 4, -(y + 1) / 4);
        ws.push(shoreV(x, y), shoreV(x + 1, y), shoreV(x, y + 1), shoreV(x + 1, y + 1));
        wi.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
      }
      if (wp.length) {
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(wp, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(wu, 2));
        g.setAttribute('shore', new T.Float32BufferAttribute(ws, 1)); g.setIndex(wi);
        const m = new T.Mesh(g, waterMaterial()); m.renderOrder = 1; group.add(m);
        { const ys = []; for (let i = 1; i < wp.length; i += 3) ys.push(wp[i]); ys.sort((a, b) => a - b); group.userData.waterY = ys[ys.length >> 1]; group.userData.waterMeshes = [m]; }
        // a faint layer of pixel glints keeps some of the DS sparkle on top
        const gt = glintTexture(1), gm = new T.Mesh(g, new T.MeshBasicMaterial({ map: gt, transparent: true, opacity: .3, blending: T.AdditiveBlending, depthWrite: false })); gm.renderOrder = 2; group.add(gm);
        group.userData.waterMeshes.push(gm);
        group.userData.water = [gt];
      }
    }
    // lava: a flowing, self-lit surface over every lava cell (crust plates drifting on a bright melt)
    { const lp = [], li = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        const c = map.cell(x, y); if (!c || c.g !== 'lava') continue;
        const k = (y * W + x) * 4, b = lp.length / 3, C = hv.corner;
        lp.push(x, C[k] + .03, y, x + 1, C[k + 1] + .03, y, x, C[k + 2] + .03, y + 1, x + 1, C[k + 3] + .03, y + 1);
        li.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
      }
      if (lp.length) {
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(lp, 3)); g.setIndex(li);
        group.add(new T.Mesh(g, lavaMaterial()));
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
  // Water surface: layered travelling waves give a normal; the sky reflects by Fresnel, the sun leaves a
  // bright glitter path, caustic bands drift through the shallows and foam laps along every shore.
  // It is translucent over the painted water below, so each map's water colour still shows.
  const WU = T ? { uSky: { value: new T.Color(0x9cc8f0) }, uSun: { value: new T.Color(0xfff0d8) }, uSunDir: { value: new T.Vector3(-.35, .55, -.76).normalize() }, uCam: { value: new T.Vector3() }, uNight: { value: 0 }, uDeep: { value: new T.Color(0x1c5a8a) } } : null;
  let waterMat = null;
  // Planar reflections: each frame the scene is rendered once more from a camera mirrored in the water
  // plane (at half resolution, everything below the water clipped away); the water samples it through a
  // projective texture matrix, rippled by the wave normals, and blends it in by a Fresnel term.
  const REFL = T ? { uRefl: { value: null }, uTexMat: { value: new T.Matrix4() }, uReflOn: { value: 0 } } : null;
  let reflRT = null, mirrorCam = null, waterPlain = null;
  function waterMaterial(plain) {
    if (plain) { if (!waterPlain) waterPlain = makeWater(true); return waterPlain; }
    if (waterMat) return waterMat;
    return (waterMat = makeWater(false));
  }
  function makeWater(plain) {
    return new T.ShaderMaterial({
      uniforms: Object.assign({}, WU, { uTime: U3.uTime }, plain ? { uRefl: { value: null }, uTexMat: { value: new T.Matrix4() }, uReflOn: { value: 0 } } : REFL), transparent: true, depthWrite: false,
      vertexShader: `attribute float shore; uniform mat4 uTexMat; varying float vShore; varying vec3 vW; varying vec4 vRefl;
        void main() { vShore = shore; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; vRefl = uTexMat * w; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uTime; uniform vec3 uSky; uniform vec3 uSun; uniform vec3 uSunDir; uniform vec3 uCam; uniform float uNight; uniform vec3 uDeep;
        uniform sampler2D uRefl; uniform float uReflOn;
        varying float vShore; varying vec3 vW; varying vec4 vRefl;
        vec2 wave(vec2 p, vec2 d, float f, float sp, float a) { float ph = dot(p, d) * f + uTime * sp; return d * cos(ph) * a * f; }
        float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        void main() {
          vec2 p = vW.xz, g = vec2(0.0);
          g += wave(p, normalize(vec2(.8, .6)), 1.7, 1.1, .05);
          g += wave(p, normalize(vec2(-.45, .9)), 2.9, 1.6, .03);
          g += wave(p, normalize(vec2(.95, -.3)), 5.3, 2.3, .016);
          g += wave(p, normalize(vec2(-.7, -.7)), 8.9, 3.1, .008);
          vec3 n = normalize(vec3(-g.x, 1.0, -g.y));
          vec3 V = normalize(uCam - vW);
          float fr = pow(1.0 - max(dot(n, V), 0.0), 4.0);
          vec3 R = reflect(-V, n);
          float sp = pow(max(dot(R, normalize(uSunDir)), 0.0), 700.0);
          // glitter: tiny sparks where the surface catches the sun
          vec2 cell = floor(p * 11.0); float tw = h2(cell + floor(uTime * 2.0 + h2(cell) * 7.0));
          float glit = step(.975, tw) * pow(max(dot(R, normalize(uSunDir)), 0.0), 6.0);
          float ca = sin(p.x * 3.1 + uTime * .9 + sin(p.y * 1.7 + uTime * .5)) + sin(p.y * 2.6 - uTime * .7 + sin(p.x * 1.3));
          float caust = pow(clamp(1.0 - abs(ca) * .45, 0.0, 1.0), 3.0);
          float fn = sin(p.x * 4.3 + uTime * 1.7) * sin(p.y * 3.7 - uTime * 1.3) * .5 + .5;
          float foam = .6 * smoothstep(.8, 1.0, vShore + (fn - .5) * .2) * (.6 + .4 * sin(uTime * 2.0 + p.x * 2.0 + p.y));
          // the body of the water: turquoise over the shallows, deep blue further out
          vec3 body = mix(uDeep, mix(uDeep, vec3(.16, .62, .66), .75), clamp(vShore * .8, 0.0, 1.0) * (1.0 - uNight * .6));
          vec3 col = mix(body, uSky, .2 + fr * .5);
          if (uReflOn > .5) {
            vec4 uvw = vRefl; uvw.xy += n.xz * .09 * uvw.w;
            vec3 refl = texture2DProj(uRefl, uvw).rgb;
            float rk = .38 + .5 * pow(1.0 - max(dot(n, V), 0.0), 2.0);
            col = mix(body, refl * vec3(.86, .94, 1.0), rk);
          }
          col *= 1.0 + .07 * sin(dot(p, vec2(.35, .9)) * .9 - uTime * .6);   // long swells rolling in
          col += caust * .07 * (1.0 - uNight);
          col += uSun * (sp * 1.6 + glit * 2.6) * (1.0 - uNight * .7);
          col = mix(col, vec3(.95, .98, 1.0), foam * .85);
          float a = clamp(.22 + fr * .45 + caust * .04 + foam * .55 + sp, 0.0, .92);
          if (uReflOn > .5) a = clamp(.72 + fr * .2 + foam * .3 + sp, 0.0, .96);
          gl_FragColor = vec4(col, a);
          #include <colorspace_fragment>
        }`,
    });
  }
  let lavaMat = null;
  function lavaMaterial() {
    if (lavaMat) return lavaMat;
    lavaMat = new T.ShaderMaterial({
      uniforms: { uTime: U3.uTime },
      vertexShader: `varying vec3 vW; void main() { vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform float uTime; varying vec3 vW;
        float h2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(h2(i), h2(i + vec2(1, 0)), f.x), mix(h2(i + vec2(0, 1)), h2(i + vec2(1, 1)), f.x), f.y); }
        void main() {
          vec2 p = vW.xz * 1.6 + vec2(uTime * .12, uTime * .05);
          float n = vn(p) * .55 + vn(p * 2.3 - uTime * .2) * .3 + vn(p * 5.1 + uTime * .3) * .15;
          float crust = smoothstep(.46, .62, n);
          float pulse = .85 + .15 * sin(uTime * 2.0 + vW.x * 1.3 + vW.z);
          vec3 melt = mix(vec3(1.0, .82, .32), vec3(1.0, .42, .08), smoothstep(.2, .55, n)) * pulse;
          vec3 col = mix(melt * 1.25, vec3(.18, .07, .05), crust * .9);
          gl_FragColor = vec4(col, 1.0);
          #include <colorspace_fragment>
        }`,
    });
    return lavaMat;
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
  const PITCH = .95;   // radians the camera looks down from horizontal (steep, like the DS games)
  const PITCH_CAM = PITCH;
  function billboard(img, opts = {}) {
    const t = tex(img);
    const mat = new T.MeshLambertMaterial({ map: t, alphaTest: .5, alphaToCoverage: true, transparent: false, side: T.DoubleSide });
    const g = new T.PlaneGeometry(img.width / 16, img.height / 16); g.translate(0, img.height / 32, 0);
    const m = new T.Mesh(g, mat);
    m.rotation.x = -(Math.PI / 2 - PITCH) * (opts.lean === undefined ? .55 : opts.lean);
    m.castShadow = opts.shadow !== false;
    m.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: t, alphaTest: .5 });
    m.userData.tex = t; m.userData.img = img;
    if (opts.sway) sway(mat, opts.sway, img.height / 16);
    return m;
  }
  // wind: the top of a plant bends with a slow gust plus a faster flutter, its base stays planted
  function sway(mat, amt, h) {
    const u = { uSway: { value: amt }, uH: { value: Math.max(.3, h) } };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U3, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uWind; uniform float uSway; uniform float uH; uniform vec4 uRustle[4];')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { vec4 o = modelMatrix * vec4(0.0, 0.0, 0.0, 1.0); float ph = o.x * .71 + o.z * .43;
            float k = clamp(position.y / uH, 0.0, 1.0); k *= k;
            float gust = 1.0 + 1.1 * max(0.0, sin(uTime * .8 - (o.x * .9 + o.z * .5) * .22));   // gusts rolling across the field
            float s = (sin(uTime * 1.6 + ph) * .55 + sin(uTime * 3.7 + ph * 2.3) * .2) * gust + uWind * (.8 + .4 * sin(uTime * .9 + ph));
            transformed.x += s * uSway * k; transformed.z += cos(uTime * 1.3 + ph) * uSway * .25 * k;
            // a tuft being rustled (something moving in it, or someone walking through) shakes hard
            float rs = 0.0; for (int i = 0; i < 4; i++) { vec2 d = o.xz - uRustle[i].xy; rs += uRustle[i].w * exp(-dot(d, d) * 6.0); }
            if (uSway > .05) { transformed.x += sin(uTime * 38.0 + ph) * .07 * rs * k; transformed.y += abs(sin(uTime * 31.0)) * .02 * rs * k; } }`);
    };
    mat.customProgramCacheKey = () => 'sway';
  }

  // ------------------------------------------------------------- characters
  // Characters stand upright (so they never sink into a wall behind them), at DS proportions: a person
  // is about as tall as a tile is wide on screen, a house wall two to three people tall. The plane is
  // stretched by the camera's foreshortening so the pixel art reads as drawn, sampled nearest. They are
  // lit like the ground they stand on (Lambert with an upward-facing normal, receiving the sun's
  // shadows and the lamps' light), and the silhouette gets a little rounding: faces turned toward the
  // sun (estimated from the alpha edges) are a touch brighter, the feet a touch darker.
  // Characters share the world's pixel grid: one sprite pixel is exactly one world texel wide, and the
  // camera squashes it vertically by the same sin(pitch) as the ground and the walls (the plane stands
  // tan(pitch)/16 per pixel), so a person and the house behind them read as one piece of pixel art
  const STRETCH = Math.tan(PITCH), ENT_SC = 1;
  let blobMat = null, blobGeo = null;
  function blob() {
    if (!blobMat) {
      const c = G.makeCanvas(32, 32), x = c.getContext('2d'), g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
      g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(.62, 'rgba(0,0,0,.5)'); g.addColorStop(.8, 'rgba(0,0,0,.22)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, 32, 32);
      const t = new T.CanvasTexture(c);
      blobMat = new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, color: 0x101828 });
      blobGeo = new T.PlaneGeometry(1, 1); blobGeo.rotateX(-Math.PI / 2);
    }
    const m = new T.Mesh(blobGeo, blobMat); m.renderOrder = 2; return m;
  }
  function entGeo(img) {
    const w = img.width / 16 * ENT_SC, h = img.height / 16 * ENT_SC * STRETCH, g = new T.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
    const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0);   // lit exactly like the ground they stand on
    return g;
  }
  function entSprite(img) {
    const t = texPx(img);
    const u = { uTexel: { value: new T.Vector2(1 / img.width, 1 / img.height) } };
    const mat = new T.MeshLambertMaterial({ map: t, alphaTest: .5, side: T.DoubleSide });

    const m = new T.Mesh(entGeo(img), mat);
    m.castShadow = false; m.receiveShadow = true;   // a round contact shadow instead of a card's long one
    m.customDepthMaterial = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: t, alphaTest: .5 });
    const b = blob(); m.add(b); m.userData.blob = b;
    m.userData.u = u; m.userData.tex = t; m.userData.img = img; m.userData.w = img.width; m.userData.h = img.height; m.userData.ent = true;
    return m;
  }

  function setBillboardImage(m, img) {
    if (m.userData.img === img) return;
    const ent = m.userData.ent, t = ent ? texPx(img) : tex(img);
    if (ent) m.userData.u.uTexel.value.set(1 / img.width, 1 / img.height);
    m.material.map = t; m.material.needsUpdate = true; m.customDepthMaterial.map = t; m.customDepthMaterial.needsUpdate = true;
    if (m.userData.w !== img.width || m.userData.h !== img.height) { m.geometry.dispose(); if (ent) m.geometry = entGeo(img); else { m.geometry = new T.PlaneGeometry(img.width / 16, img.height / 16); m.geometry.translate(0, img.height / 32, 0); } m.userData.w = img.width; m.userData.h = img.height; }
    if (m.userData.tex) m.userData.tex.dispose(); m.userData.tex = t; m.userData.img = img;
  }

  // ------------------------------------------------------------- props
  function buildProps(map, hv, group) {
    const W = map.w, H = map.h, PADT = 12, trees = {};
    for (let y = -PADT; y < H + PADT; y++) for (let x = -PADT; x < W + PADT; x++) {
      const inside = x >= 0 && y >= 0 && x < W && y < H;
      // beyond the edge: the connected map's own cell if there is one, otherwise the border fill
      const rr = inside ? null : map.resolve(x, y);
      const c = inside ? map.cell(x, y) : rr ? rr.map.cells[rr.y * rr.map.w + rr.x] : G.borderCell(map, x, y);
      if (c && (c.g === 'tall' || c.g === 'flowers' || c.g === 'hedge')) {
        // live ground (tall grass, flower beds, hedges) stands up out of the terrain
        let lt = null; const cm = rr ? rr.map : map; try { lt = c.g === 'hedge' ? G.tiles.hedgeSprite(cm, c) : G.liveTile(cm, c, 0); } catch (e) { }
        if (lt && lt.img) {
          const m = billboard(lt.img, { lean: c.g === 'hedge' ? .6 : .85, shadow: c.g !== 'flowers', sway: c.g === 'tall' ? .09 : c.g === 'hedge' ? .025 : 0 });
          const bz = y + (16 + (lt.oy || 0) + lt.img.height - 16) / 16;
          m.position.set(x + .5, hv.at(G.clamp(x + .5, 0, W - .01), G.clamp(y + .5, 0, H - .01)) + .01, Math.min(bz, y + 1) - .02);
          if (c.g === 'flowers') { m.rotation.x = -Math.PI / 2; m.position.z = y + .5 + lt.img.height / 32; m.position.y += .02; }
          group.add(m);
        }
      }
      if (c && c.light && inside) (group.userData.lights || (group.userData.lights = [])).push({ x: x + .5, z: y + .6, y: hv.at(x + .5, y + .5), kind: c.light, ground: !c.o });
      if (!c || !c.o || c.o === 'table' || c.o === 'bed' || c.o === 'rug') continue;
      if (c.cut || c.smash || c.push || c.solidIf) continue;   // stateful props stay dynamic (drawn as ents below)
      // trees and lamps are real 3D models
      const tk = treeKind(rr ? rr.map : map, c, x, y);
      if (tk) { const gy = hv.at(G.clamp(x + .5, 0, W - .01), G.clamp(y + .55, 0, H - .01)); (trees[tk] || (trees[tk] = [])).push([x + .5 + (G.h2(x, y, 5) - .5) * .25, gy, y + .6 + (G.h2(x, y, 6) - .5) * .2, G.h2(x, y, 7), c]); continue; }
      if (c.o === 'fountain' && inside) { group.add(fountainModel(x + .5, hv.at(G.clamp(x + .5, 0, W - .01), G.clamp(y + .5, 0, H - .01)), y + .5)); continue; }
      if (c.o === 'lamp' || c.o === 'lanternpost') { group.add(lampModel(c.o, x + .5, hv.at(G.clamp(x + .5, 0, W - .01), G.clamp(y + .5, 0, H - .01)), y + .55)); continue; }
      let oi; try { oi = G.objImg(rr ? rr.map : map, c, 0); } catch (e) { oi = null; }
      if (!oi || !oi.img || oi.flat) continue;
      const leafy = /tree|palm|pine|bush|shrub|reed|fern|plant|willow|sapling|blossom|flower/.test(c.o);
      const m = billboard(oi.img, { sway: leafy ? (oi.img.height > 24 ? .05 : .07) : 0 });
      const bx = x + ((oi.ox || 0) + oi.img.width / 2) / 16, bz = y + ((oi.oy || 0) + oi.img.height) / 16;
      m.position.set(bx, hv.at(G.clamp(bx, 0, W - .01), G.clamp(bz - .2, 0, H - .01)), bz - .12);
      group.add(m);
      if (oi.img.height > 24) { m.userData.hw = oi.img.width / 32; m.userData.ht = oi.img.height / 16; m.userData.fade = 1; (group.userData.tall || (group.userData.tall = [])).push(m); }
    }
    for (const k in trees) plantTrees(group, k, trees[k], map);
  }

  // ------------------------------------------------------------- 3D trees
  // Stylised low-poly trees, instanced per kind so a whole forest is a handful of draw calls:
  // broadleaf crowns built from several lumpy, faceted leaf clusters (dark underneath, sunlit on top,
  // a leaf pattern on every facet), conifers from stacked jagged cones (snow-capped in the north),
  // palms with a leaning ringed trunk and drooping fronds, and bare dead trees. Crowns sway in the
  // wind, and any tree between the camera and the player dissolves (screen-door dither) so the player
  // is never hidden. Unit: tiles; a grown tree is about three and a half tiles tall.
  const TREE_CACHE = {};
  let leafTex = null, barkTex = null;
  // a clump of leaves with an alpha edge: one "card" of a crown. Greyscale; the crown's vertex colours tint it
  function leafTexture() {
    if (leafTex) return leafTex;
    const c = G.makeCanvas(64, 64), x = c.getContext('2d'), rng = new G.RNG(404);
    for (let i = 0; i < 70; i++) {
      const a = rng.next() * Math.PI * 2, r = Math.sqrt(rng.next()) * 22, px = 32 + Math.cos(a) * r, py = 32 + Math.sin(a) * r;
      const lr = 4 + rng.next() * 3.5, ang = rng.next() * Math.PI, v = 150 + ((py < 32 ? 1 : 0) * 40) + rng.int(0, 65);
      x.fillStyle = `rgb(${v},${v},${v})`; x.beginPath(); x.ellipse(px, py, lr, lr * .5, ang, 0, Math.PI * 2); x.fill();
      x.fillStyle = 'rgba(255,255,255,.35)'; x.beginPath(); x.ellipse(px - 1, py - 1, lr * .5, lr * .2, ang, 0, Math.PI * 2); x.fill();
    }
    leafTex = new T.CanvasTexture(c); leafTex.colorSpace = T.SRGBColorSpace; leafTex.anisotropy = 4;
    return leafTex;
  }
  function barkTexture() {
    if (barkTex) return barkTex;
    const c = G.makeCanvas(32, 64), x = c.getContext('2d'), rng = new G.RNG(77);
    x.fillStyle = '#c8c8c8'; x.fillRect(0, 0, 32, 64);
    for (let i = 0; i < 26; i++) { const px = rng.next() * 32, v = 90 + rng.int(0, 80); x.fillStyle = `rgb(${v},${v},${v})`; x.fillRect(px, 0, 1 + rng.int(0, 2), 64); }
    for (let i = 0; i < 30; i++) { x.fillStyle = 'rgba(40,40,40,.4)'; x.fillRect(rng.next() * 32, rng.next() * 64, 3, 1); }
    barkTex = new T.CanvasTexture(c); barkTex.wrapS = barkTex.wrapT = T.RepeatWrapping; barkTex.colorSpace = T.SRGBColorSpace;
    return barkTex;
  }
  // non-indexed merge of simple geometries (position, normal, uv, color)
  function merge(list) {
    const P = [], N = [], U = [], C = [];
    for (const g0 of list) {
      const g = g0.index ? g0.toNonIndexed() : g0;
      P.push(...g.attributes.position.array); N.push(...g.attributes.normal.array);
      U.push(...(g.attributes.uv ? g.attributes.uv.array : new Float32Array(g.attributes.position.count * 2)));
      C.push(...(g.attributes.color ? g.attributes.color.array : new Float32Array(g.attributes.position.count * 3).fill(1)));
    }
    const o = new T.BufferGeometry();
    o.setAttribute('position', new T.Float32BufferAttribute(P, 3)); o.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
    o.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); o.setAttribute('color', new T.Float32BufferAttribute(C, 3));
    return o;
  }
  // colour every vertex from a function of its position; flat facets
  function paint(g, fn) {
    g = g.index ? g.toNonIndexed() : g;
    const p = g.attributes.position, col = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) { const c = fn(p.getX(i), p.getY(i), p.getZ(i), i); col[i * 3] = c[0]; col[i * 3 + 1] = c[1]; col[i * 3 + 2] = c[2]; }
    g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.computeVertexNormals();
    return g;
  }
  function lumpy(g, amp, seed) {
    const p = g.attributes.position, rng = new G.RNG(seed), seen = new Map();
    for (let i = 0; i < p.count; i++) {
      const key = p.getX(i).toFixed(3) + ',' + p.getY(i).toFixed(3) + ',' + p.getZ(i).toFixed(3);
      if (!seen.has(key)) seen.set(key, 1 + (rng.next() - .5) * amp);
      const k = seen.get(key); p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k);
    }
    return g;
  }
  const hexc = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255].map(v => Math.pow(v, 1.6)); };   // between display and linear: saturated, not murky
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  function treeGeo(kind, v) {
    const key = kind + v; if (TREE_CACHE[key]) return TREE_CACHE[key];
    const rng = new G.RNG(key.length * 131 + v * 17 + kind.charCodeAt(0));
    let trunk, crown;
    const barkC = kind === 'dead' ? hexc('#8a7a6a') : kind === 'palm' ? hexc('#a88a64') : hexc('#6a4a32');
    if (kind === 'broad' || kind === 'fruit') {
      const t = new T.CylinderGeometry(.08, .15, 2.0, 7, 1); t.translate(0, 1.0, 0);
      const br = new T.CylinderGeometry(.03, .06, .6, 5, 1); br.rotateZ(.9); br.translate(.2, 1.75, 0);
      const br2 = new T.CylinderGeometry(.03, .05, .55, 5, 1); br2.rotateZ(-.8); br2.rotateY(1.9); br2.translate(-.1, 1.7, .15);
      trunk = merge([paint(t, () => barkC), paint(br, () => barkC), paint(br2, () => barkC)]);
      // crown: leaf-cluster cards scattered through a few overlapping lumps, each card's normal pointing
      // out from the crown centre so the whole crown shades like one soft rounded mass; a dark core
      // behind them fills any gap
      const base = kind === 'fruit' ? hexc('#56a83e') : [hexc('#3e9a36'), hexc('#52aa3c'), hexc('#2f8a3e')][v % 3];
      const cy0 = 2.45, lumps = [[0, cy0, 0, .62]];
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + rng.next() * .6; lumps.push([Math.cos(a) * .38, cy0 - .15 + rng.next() * .35, Math.sin(a) * .38, .42 + rng.next() * .12]); }
      lumps.push([0, cy0 + .45, 0, .4]);
      const P = [], N = [], U = [], C = [];
      const quad = (cx, cy, cz, sz, rot) => {
        const n = new T.Vector3(cx, cy - cy0, cz).normalize(), up = Math.abs(n.y) > .9 ? new T.Vector3(1, 0, 0) : new T.Vector3(0, 1, 0);
        const t1 = new T.Vector3().crossVectors(n, up).normalize(), t2 = new T.Vector3().crossVectors(n, t1).normalize();
        const cs = Math.cos(rot), sn = Math.sin(rot), A = t1.clone().multiplyScalar(cs).addScaledVector(t2, sn), B = t1.clone().multiplyScalar(-sn).addScaledVector(t2, cs);
        const h = (cy - (cy0 - .9)) / 1.8, col = mixc(mixc(base, [.02, .12, .06], .6), mixc(base, [.9, 1, .6], .28), G.clamp(h, 0, 1));
        const pts = [[-1, -1], [1, -1], [1, 1], [-1, -1], [1, 1], [-1, 1]], uvs = [[0, 0], [1, 0], [1, 1], [0, 0], [1, 1], [0, 1]];
        pts.forEach(([u2, v2], k) => { P.push(cx + (A.x * u2 + B.x * v2) * sz, cy + (A.y * u2 + B.y * v2) * sz, cz + (A.z * u2 + B.z * v2) * sz); N.push(n.x, n.y, n.z); U.push(...uvs[k]); C.push(...col); });
      };
      for (const [lx, ly, lz, lr] of lumps) for (let i = 0; i < 22; i++) {
        const u = rng.next() * 2 - 1, th = rng.next() * Math.PI * 2, rr = lr * (.72 + rng.next() * .3), sq = Math.sqrt(1 - u * u);
        quad(lx + Math.cos(th) * sq * rr, ly + u * rr * .85, lz + Math.sin(th) * sq * rr, .3 + rng.next() * .12, rng.next() * 6.28);
      }
      const cards = new T.BufferGeometry();
      cards.setAttribute('position', new T.Float32BufferAttribute(P, 3)); cards.setAttribute('normal', new T.Float32BufferAttribute(N, 3));
      cards.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); cards.setAttribute('color', new T.Float32BufferAttribute(C, 3));
      cards.userData.cards = true;
      const core = new T.IcosahedronGeometry(.5, 1); core.translate(0, cy0 + .05, 0);
      const coreP = paint(core, () => mixc(base, [0, .06, .03], .7)); coreP.deleteAttribute('uv'); coreP.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(coreP.attributes.position.count * 2).fill(.5), 2));
      crown = merge([coreP, cards]); crown.userData.cards = true;
    } else if (kind === 'pine' || kind === 'pinesnow') {
      const t = new T.CylinderGeometry(.07, .13, 1.0, 6, 1); t.translate(0, .5, 0); trunk = paint(t, () => barkC);
      const parts = [], base = [hexc('#2a6a4a'), hexc('#2f7550'), hexc('#255e44')][v % 3];
      const tiers = [[.8, 1.0, .6], [.66, .95, 1.15], [.5, .9, 1.65], [.34, .8, 2.12], [.2, .65, 2.55]];
      for (const [r, h, y0] of tiers) {
        const g = new T.ConeGeometry(r, h, 9, 1); g.translate(0, y0 + h / 2, 0);
        const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) < y0 + .01) { const a = Math.atan2(p.getZ(i), p.getX(i)); const j = 1 + Math.sin(a * 9 + y0 * 7) * .12 + (rng.next() - .5) * .1; p.setXYZ(i, p.getX(i) * j, p.getY(i) - rng.next() * .12, p.getZ(i) * j); }
        parts.push(paint(g, (x, y, z) => { const loc = (y - y0) / h; let c = mixc(mixc(base, [0, .08, .06], .5), mixc(base, [.7, .9, .6], .25), loc); if (kind === 'pinesnow' && loc > .35) c = mixc(c, [.93, .96, 1], .75); return c; }));
      }
      crown = merge(parts);
    } else if (kind === 'palm') {
      const segs = [], H = 2.9, bend = .5;
      for (let i = 0; i < 7; i++) { const y0 = i / 7 * H, c = new T.CylinderGeometry(.1 - i * .006, .13 - i * .006, H / 7 + .02, 7, 1); const xo = bend * Math.pow(y0 / H, 2); c.translate(xo, y0 + H / 14, 0); segs.push(paint(c, () => i % 2 ? barkC : mixc(barkC, [0, 0, 0], .2))); }
      trunk = merge(segs);
      const tx = bend, ty = H, fr = [];
      for (let k = 0; k < 8; k++) {
        const a = k / 8 * Math.PI * 2 + rng.next() * .3, P = [], L = 1.5 + rng.next() * .4;
        for (let s2 = 0; s2 <= 6; s2++) {
          const t = s2 / 6, w = .32 * Math.sin(Math.PI * Math.min(1, t * 1.1 + .05)), d = t * L, y = ty + .15 + t * .5 - t * t * 1.2;
          const cx = tx + Math.cos(a) * d, cz = Math.sin(a) * d, px = -Math.sin(a) * w, pz = Math.cos(a) * w;
          P.push([cx + px, y, cz + pz], [cx - px, y, cz - pz], [cx, y + .06, cz]);
        }
        const pos = []; for (let s2 = 0; s2 < 6; s2++) { const A = P[s2 * 3], B = P[s2 * 3 + 1], M = P[s2 * 3 + 2], A2 = P[s2 * 3 + 3], B2 = P[s2 * 3 + 4], M2 = P[s2 * 3 + 5]; pos.push(...A, ...M, ...A2, ...A2, ...M, ...M2, ...M, ...B, ...M2, ...M2, ...B, ...B2); }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(pos.length / 3 * 2), 2));
        fr.push(paint(g, (x, y, z) => mixc(hexc('#2f7a36'), hexc('#7ab84a'), Math.min(1, Math.max(0, (y - ty + .6) / 1.2)))));
      }
      crown = merge(fr);
    } else {   // dead
      const t = new T.CylinderGeometry(.08, .17, 2.2, 6, 1); t.translate(0, 1.1, 0);
      const bs = [paint(t, () => barkC)];
      for (let k = 0; k < 4; k++) { const b = new T.CylinderGeometry(.03, .07, .9, 5, 1); b.rotateZ(.7 + rng.next() * .5); b.rotateY(k * 1.6 + rng.next()); b.translate(0, 1.3 + k * .22, 0); bs.push(paint(b, () => barkC)); }
      trunk = merge(bs); crown = null;
    }
    // leaf-pattern UVs: planar from the side, tiled
    { const p = trunk.attributes.position, uv = trunk.attributes.uv; for (let i = 0; i < p.count; i++) uv.setXY(i, Math.atan2(p.getZ(i), p.getX(i)) / Math.PI, p.getY(i) * 1.5); }
    return (TREE_CACHE[key] = { trunk, crown, h: kind === 'palm' ? 3.4 : kind === 'dead' ? 2.6 : 3.5 });
  }
  function treeKind(map, c, x, y) {
    if (!c || !c.o) return null;
    const th = map.theme, snow = th === 'snow';
    if (c.o === 'pine') return snow ? 'pinesnow' : 'pine';
    if (c.o === 'palm') return 'palm';
    if (c.o === 'deadtree') return 'dead';
    if (c.o === 'tree') { if (snow) return 'pinesnow'; const hh = G.h2(c.x | 0, c.y | 0, 77); if ((!th || th === 'grass') && hh < .3) return 'pine'; return hh > .93 ? 'fruit' : 'broad'; }
    return null;
  }
  const TU = T ? { uPlayer: { value: new T.Vector3() }, uCamP: { value: new T.Vector3() } } : null;
  function treeMaterial(map, crown, h, cards) {
    const m = cards ? new T.MeshLambertMaterial({ map: leafTexture(), vertexColors: true, alphaTest: .5, alphaToCoverage: true, side: T.DoubleSide })
      : new T.MeshLambertMaterial({ map: crown ? null : barkTexture(), vertexColors: true, flatShading: !!crown, side: crown ? T.DoubleSide : T.FrontSide });
    const u = { uH: { value: h } };
    m.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, U3, TU, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float uTime; uniform float uWind; uniform float uH; varying vec3 vWP;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          { vec4 o = modelMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0); float ph = o.x * .71 + o.z * .43;
            float k = clamp(position.y / uH, 0.0, 1.0); k = k * k;
            float gust = 1.0 + 1.1 * max(0.0, sin(uTime * .8 - (o.x * .9 + o.z * .5) * .22));
            float s = (sin(uTime * 1.3 + ph) * .5 + sin(uTime * 3.1 + ph * 2.3) * .15) * gust + uWind * .6;
            transformed.x += s * .09 * k; transformed.z += cos(uTime * 1.1 + ph) * .03 * k; }`)
        .replace('#include <project_vertex>', '#include <project_vertex>\n vWP = (modelMatrix * instanceMatrix * vec4(transformed, 1.0)).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uPlayer; uniform vec3 uCamP; varying vec3 vWP;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          { vec3 toC = normalize(uCamP - uPlayer), toP = vWP - (uPlayer + vec3(0.0, .6, 0.0)); float al = dot(toP, toC);
            float d = length(toP - toC * al), occ = step(.8, al) * (1.0 - smoothstep(.65, 1.3, d));
            float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(.06711056, .00583715))));
            if (ign < occ * .78) discard; }`);
    };
    m.customProgramCacheKey = () => 'tree' + (crown ? 1 : 0) + (cards ? 'c' : '');
    return m;
  }
  function plantTrees(group, kind, list, map) {
    const variants = kind === 'palm' || kind === 'dead' ? 2 : 3;
    for (let v = 0; v < variants; v++) {
      const L = list.filter(t => Math.floor(t[3] * variants) === v); if (!L.length) continue;
      const geo = treeGeo(kind, v), mats = [];
      for (const [g, crown] of [[geo.trunk, false], [geo.crown, true]]) {
        if (!g) continue;
        const cards = !!(g.userData && g.userData.cards), mesh = new T.InstancedMesh(g, treeMaterial(map, crown, geo.h, cards), L.length);
        const M = new T.Matrix4(), Q = new T.Quaternion(), S = new T.Vector3(), Pv = new T.Vector3(), E = new T.Euler();
        L.forEach((t, i) => {
          const sc = (.88 + G.h2(t[0] * 10 | 0, t[2] * 10 | 0, 3) * .3) * .82, ry = t[3] * 40;
          E.set(0, ry, 0); Q.setFromEuler(E); S.set(sc, sc * (.95 + t[3] * .12), sc); Pv.set(t[0], t[1], t[2]);
          M.compose(Pv, Q, S); mesh.setMatrixAt(i, M);
          if (crown) { const sh = G.h2(t[4].x | 0, t[4].y | 0, 91), k = sh < .4 ? .78 : sh < .75 ? .9 : 1; mesh.setColorAt(i, new T.Color(k, k, k)); }
        });
        mesh.castShadow = true; mesh.receiveShadow = true;
        mesh.customDepthMaterial = new T.MeshDepthMaterial(cards ? { depthPacking: T.RGBADepthPacking, map: leafTexture(), alphaTest: .5 } : { depthPacking: T.RGBADepthPacking });
        group.add(mesh); mats.push(mesh);
      }
    }
  }

  // ------------------------------------------------------------- fountain
  // an octagonal limestone basin with a moulded rim, a fluted pedestal carrying two bowls, and water that
  // actually falls: each bowl overflows in a thin animated curtain that lands in a ring of foam
  let fountainKit = null;
  function fountainTex() {
    const c = G.makeCanvas(32, 32), x = c.getContext('2d'), rng = new G.RNG(71);
    x.fillStyle = '#cfc6b2'; x.fillRect(0, 0, 32, 32);
    for (let r = 0; r < 4; r++) { const off = r % 2 ? 8 : 0; for (let k = -1; k < 3; k++) { const bx = k * 16 + off; const v = 196 + rng.int(-14, 14); x.fillStyle = `rgb(${v + 10},${v},${v - 18})`; x.fillRect(bx + 1, r * 8 + 1, 14, 6); } x.fillStyle = '#9a917e'; x.fillRect(0, r * 8, 32, 1); }
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(80,70,50,${.08 + rng.next() * .1})`; x.fillRect(rng.int(0, 31), rng.int(0, 31), 1, 1); }
    const t = texPx(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t;
  }
  function curtainMaterial() {
    return new T.ShaderMaterial({
      uniforms: { uTime: U3.uTime }, transparent: true, depthWrite: false, side: T.DoubleSide,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uTime; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        void main(){
          float x = floor(vUv.x * 64.0), band = h(vec2(x, 3.0));
          float flow = fract(vUv.y * 3.0 + uTime * (1.4 + band * .8) + band);
          float streak = smoothstep(.0, .25, flow) * (1.0 - smoothstep(.55, 1.0, flow));
          float a = (.35 + .45 * streak) * smoothstep(0.0, .15, vUv.y) * (0.6 + 0.4 * band);
          vec3 col = mix(vec3(.62, .82, .96), vec3(1.0), streak * .7);
          gl_FragColor = vec4(col, a * .8);
        }` });
  }
  function foamMaterial() {
    return new T.ShaderMaterial({
      uniforms: { uTime: U3.uTime }, transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform float uTime; varying vec2 vUv;
        void main(){ vec2 p = vUv - .5; float r = length(p) * 2.0, a = atan(p.y, p.x);
          float ring = smoothstep(.62, .78, r) * (1.0 - smoothstep(.86, 1.0, r));
          float n = .5 + .5 * sin(a * 23.0 + uTime * 5.0) * sin(a * 7.0 - uTime * 3.0);
          gl_FragColor = vec4(vec3(1.0), ring * (.35 + .5 * n)); }` });
  }
  function fountainModel(x, y, z) {
    if (!fountainKit) {
      const t = fountainTex();
      fountainKit = { st: new T.MeshLambertMaterial({ map: t }), stD: new T.MeshLambertMaterial({ map: t, color: 0xb0a898 }), bed: new T.MeshLambertMaterial({ color: 0x3a6e9e }), curtain: curtainMaterial(), foam: foamMaterial() };
    }
    const K = fountainKit, g = new T.Group();
    const add = (geo, mat, py, cast = true) => { const m = new T.Mesh(geo, mat); m.position.y = py; m.castShadow = cast; m.receiveShadow = true; g.add(m); return m; };
    // basin: an octagonal wall, a wider rim and the water inside
    const oct = (r0, r1, h) => new T.CylinderGeometry(r1, r0, h, 8, 1, false, Math.PI / 8);
    add(oct(1.02, 1.0, .36), K.stD, .18);
    add(oct(1.1, 1.1, .1), K.st, .41);
    const inner = new T.Mesh(oct(.92, .92, .5), K.stD); inner.position.y = .2; inner.scale.set(-1, 1, 1); g.add(inner);
    const bed = new T.Mesh(new T.CircleGeometry(.92, 8, Math.PI / 8), K.bed); bed.rotation.x = -Math.PI / 2; bed.position.y = .12; g.add(bed);
    const w = new T.Mesh(new T.CircleGeometry(.92, 8, Math.PI / 8), waterMaterial(true)); w.rotation.x = -Math.PI / 2; w.position.y = .33; w.renderOrder = 1; g.add(w);
    // pedestal and two bowls turned on a lathe
    add(oct(.24, .2, .12), K.st, .38);
    add(new T.CylinderGeometry(.12, .16, .72, 12), K.st, .78);
    const bowl = (r, yb, h) => {
      const pr = [new T.Vector2(.08, 0), new T.Vector2(r * .45, h * .15), new T.Vector2(r * .85, h * .55), new T.Vector2(r, h), new T.Vector2(r * .92, h * 1.05), new T.Vector2(r * .85, h * .7), new T.Vector2(.05, h * .55)];
      const m = add(new T.LatheGeometry(pr, 16), K.st, yb); m.material = K.st;
      const wa = new T.Mesh(new T.CircleGeometry(r * .86, 16), waterMaterial(true)); wa.rotation.x = -Math.PI / 2; wa.position.y = yb + h * .9; wa.renderOrder = 1; g.add(wa);
      return m;
    };
    bowl(.62, 1.12, .2); add(new T.CylinderGeometry(.07, .09, .36, 10), K.st, 1.48); bowl(.3, 1.64, .14);
    add(new T.SphereGeometry(.07, 8, 6), K.st, 1.86);
    // falling curtains (open cylinders) and foam rings where they land
    const curtain = (rTop, rBot, yTop, yBot) => { const m = new T.Mesh(new T.CylinderGeometry(rTop, rBot, yTop - yBot, 24, 1, true), K.curtain); m.position.y = (yTop + yBot) / 2; m.renderOrder = 2; g.add(m); };
    curtain(.62, .7, 1.3, .34); curtain(.3, .36, 1.8, 1.3);
    const ring = (r, yy) => { const m = new T.Mesh(new T.PlaneGeometry(r * 2.4, r * 2.4), K.foam); m.rotation.x = -Math.PI / 2; m.position.y = yy; m.renderOrder = 3; g.add(m); };
    ring(.72, .345); ring(.4, 1.315);
    g.position.set(x, y, z); g.scale.setScalar(1.2);
    return g;
  }

  // ------------------------------------------------------------- street lamps
  // cast-iron lamp posts about two people tall (a plinth, a fluted pole, a lantern with glowing panes and
  // a cap), and low stone lanterns for the old quarters; the panes light up at dusk
  const LAMP_GLASS = new Set(), LAMP_SC = .8;
  let lampParts = null;
  function lampModel(kind, x, y, z) {
    if (!lampParts) {
      const iron = new T.MeshLambertMaterial({ color: 0x23262e }), stone = new T.MeshLambertMaterial({ color: 0x8a8478 }), stoneD = new T.MeshLambertMaterial({ color: 0x5e5a52 });
      const glass = new T.MeshLambertMaterial({ color: 0xfff0c0, emissive: 0xffc870, emissiveIntensity: .2 }); LAMP_GLASS.add(glass);
      lampParts = { iron, stone, stoneD, glass };
    }
    const g = new T.Group(), L = lampParts, add = (geo, mat, px, py, pz) => { const m = new T.Mesh(geo, mat); m.position.set(px, py, pz); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    if (kind === 'lamp') {
      add(new T.CylinderGeometry(.16, .2, .28, 8), L.iron, 0, .14, 0);
      add(new T.CylinderGeometry(.045, .065, 2.35, 8), L.iron, 0, 1.45, 0);
      add(new T.CylinderGeometry(.09, .06, .12, 8), L.iron, 0, 2.62, 0);
      add(new T.BoxGeometry(.3, .38, .3), L.glass, 0, 2.86, 0);
      for (const [dx, dz] of [[-.15, -.15], [.15, -.15], [-.15, .15], [.15, .15]]) add(new T.BoxGeometry(.035, .42, .035), L.iron, dx, 2.86, dz);
      add(new T.ConeGeometry(.26, .22, 4), L.iron, 0, 3.16, 0).rotation.y = Math.PI / 4;
      add(new T.SphereGeometry(.04, 6, 4), L.iron, 0, 3.3, 0);
    } else {
      add(new T.BoxGeometry(.5, .22, .5), L.stoneD, 0, .11, 0);
      add(new T.BoxGeometry(.2, .55, .2), L.stone, 0, .5, 0);
      add(new T.BoxGeometry(.42, .08, .42), L.stoneD, 0, .81, 0);
      add(new T.BoxGeometry(.3, .3, .3), L.glass, 0, 1.0, 0);
      add(new T.ConeGeometry(.36, .26, 4), L.stone, 0, 1.28, 0).rotation.y = Math.PI / 4;
    }
    g.position.set(x, y, z); g.scale.setScalar(LAMP_SC);
    return g;
  }

  // ------------------------------------------------------------- buildings
  // a box body plus a pitched roof, textured by cutting the building's art into facade and roof
  const SIDES = new Set();   // building side walls: lifted out of the black by an emissive fill that follows daylight
  const WALL = { house: .44, haven: .48, mart: .48, lab: .46, gym: .5, tower: .78 };
  const FLAT_ROOF = new Set(['lab', 'tower']);
  function buildBuildings(map, hv, group) {
    const list = map.buildings.map(b => b);
    for (const cn of map.conns) { const nm = cn.map; if (nm) for (const b of nm.buildings) list.push({ ...b, x: b.x + cn.ox, y: b.y + cn.oy }); }
    for (const b of list) {
      const bi = G.tiles.building(b.kind, b.w, b.h, { roof: b.roof, door: b.door, accent: b.accent, label: b.label });
      const img = bi.img, ax = bi.atlas ? G.bldAlign(b) : 0;
      const baseY = hv.at(b.x + b.w / 2, Math.min(map.h - .01, b.y + b.h - .5));
      const x0 = b.x + ax / 16, x1 = x0 + b.w, zF = b.y + b.h;
      const g = new T.Group(); group.add(g);
      if (b.kind === 'lighthouse') { g.add(latheLandmark(img, x0 + b.w / 2, baseY, zF - img.width / 32)); continue; }
      if (b.kind === 'tower') { g.add(stackLandmark(img, x0, baseY, zF, Math.min(b.h - .2, 1.5))); continue; }
      const f = WALL[b.kind] || .45, wallPx = Math.round(img.height * f), roofPx = img.height - wallPx;
      // Sized to its sprite: seen from the camera the building covers exactly the screen area its art
      // would. The front wall stands wallPx tall in art pixels (foreshortened walls: x tan(pitch)); the
      // roof's depth equals the roof art's height in tiles and its pitch just hides the back slope, so the
      // ridge is the top of the silhouette and nothing rises above the sprite.
      const TANP = Math.tan(PITCH_CAM);
      const zB = zF - Math.max(1, Math.min(b.h - .12, roofPx / 16));
      const facade = G.makeCanvas(img.width, wallPx); facade.getContext('2d').drawImage(img, 0, roofPx, img.width, wallPx, 0, 0, img.width, wallPx);
      const roof = G.makeCanvas(img.width, roofPx); roof.getContext('2d').drawImage(img, 0, 0, img.width, roofPx, 0, 0, img.width, roofPx);
      // side walls: the facade's typical wall colour (the most common light tone, not the average of
      // doors and trim), dressed per tile with siding, a corner post, a small window and a stone plinth
      let wallCol = [200, 190, 170], trimCol = [110, 80, 60]; {
        const d = facade.getContext('2d').getImageData(0, 0, facade.width, facade.height).data, bins = new Map();
        for (let i = 0; i < d.length; i += 8) if (d[i + 3] > 200) { const k = (d[i] >> 4) << 8 | (d[i + 1] >> 4) << 4 | (d[i + 2] >> 4); bins.set(k, (bins.get(k) || 0) + 1); }
        const ranked = [...bins.entries()].sort((a, b) => b[1] - a[1]), unb = k => [((k >> 8) & 15) * 16 + 8, ((k >> 4) & 15) * 16 + 8, (k & 15) * 16 + 8];
        const lum = c => c[0] * .3 + c[1] * .59 + c[2] * .11;
        const light = ranked.map(r => unb(r[0])).filter(c => lum(c) > 90); if (light.length) wallCol = light[0];
        const dark = ranked.map(r => unb(r[0])).filter(c => lum(c) < 90 && lum(c) > 25); if (dark.length) trimCol = dark[0];
      }
      const rgbS = (c, k) => `rgb(${Math.min(255, c[0] * k) | 0},${Math.min(255, c[1] * k) | 0},${Math.min(255, c[2] * k) | 0})`;
      const side = G.makeCanvas(8, 16); { const sc = side.getContext('2d'); sc.fillStyle = rgbS(wallCol, .8); sc.fillRect(0, 0, 8, 16); sc.fillStyle = rgbS(trimCol, .8); sc.fillRect(0, 13, 8, 3); }
      const wside = G.makeCanvas(16, 32); {
        const sc = wside.getContext('2d');
        sc.fillStyle = rgbS(wallCol, .9); sc.fillRect(0, 0, 16, 32);
        sc.fillStyle = rgbS(wallCol, .8); for (let y = 2; y < 26; y += 3) sc.fillRect(0, y, 16, 1);            // siding courses
        sc.fillStyle = rgbS(trimCol, 1); sc.fillRect(0, 0, 2, 26); sc.fillRect(0, 0, 16, 1);                     // corner post, eave trim
        sc.fillStyle = rgbS(trimCol, .9); sc.fillRect(6, 7, 7, 9); sc.fillStyle = '#9ec8e0'; sc.fillRect(7, 8, 5, 7);   // window
        sc.fillStyle = '#d8ecf8'; sc.fillRect(7, 8, 2, 3); sc.fillStyle = rgbS(trimCol, .9); sc.fillRect(9, 8, 1, 7); sc.fillRect(7, 11, 5, 1);
        sc.fillStyle = rgbS(trimCol, 1.15); sc.fillRect(5, 16, 9, 1);                                              // sill
        sc.fillStyle = '#7a7468'; sc.fillRect(0, 26, 16, 6); sc.fillStyle = '#5e594f'; for (let x = 0; x < 16; x += 5) sc.fillRect(x, 26, 1, 6); sc.fillRect(0, 29, 16, 1);   // plinth
      }
      // roof ends: the roof's own average colour, darker, with shingle courses, so the sloped ends read as roof
      const rside = G.makeCanvas(16, 16); {
        let r = 0, gg = 0, bb = 0, n = 0; const d = roof.getContext('2d').getImageData(0, 0, roof.width, roof.height).data;
        for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; }
        const sc = rside.getContext('2d'), col = n ? [r / n, gg / n, bb / n] : [150, 60, 50];
        sc.fillStyle = `rgb(${col[0] * .78 | 0},${col[1] * .78 | 0},${col[2] * .78 | 0})`; sc.fillRect(0, 0, 16, 16);
        sc.fillStyle = `rgb(${col[0] * .58 | 0},${col[1] * .58 | 0},${col[2] * .58 | 0})`; for (let y = 3; y < 16; y += 4) sc.fillRect(0, y, 16, 1);
        sc.fillStyle = `rgb(${Math.min(255, col[0] * 1.02) | 0},${Math.min(255, col[1] * 1.02) | 0},${Math.min(255, col[2] * 1.02) | 0})`; for (let y = 0; y < 16; y += 4) sc.fillRect(0, y, 16, 1);
      }
      const rt = tex(rside); rt.wrapS = rt.wrapT = T.RepeatWrapping; const mRoofEnd = new T.MeshLambertMaterial({ map: rt, emissive: 0xffffff }); mRoofEnd.emissiveMap = mRoofEnd.map; SIDES.add(mRoofEnd);
      // walls stand taller than the art draws them (a house is two to three people tall), the facade
      // stretched to fit; the art's transparent margins are filled with its own colours so no face is holey
      const wallH = wallPx / 16 * TANP, depth = zF - zB;
      const solid = (cv, col) => { const o = G.makeCanvas(cv.width, cv.height), c2 = o.getContext('2d'); c2.fillStyle = col; c2.fillRect(0, 0, o.width, o.height); c2.drawImage(cv, 0, 0); return o; };
      const roofAvg = (() => { let r = 0, gg = 0, bb = 0, n = 0; const d = roof.getContext('2d').getImageData(0, 0, roof.width, roof.height).data; for (let i = 0; i < d.length; i += 16) if (d[i + 3] > 200) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; } return n ? [r / n, gg / n, bb / n] : [150, 70, 60]; })();
      const DOOR = { house: [14, 20, 'swing'], haven: [22, 18, 'slide'], mart: [22, 18, 'slide'], gym: [20, 22, 'swing2'], lab: [18, 16, 'slide'], tower: [16, 18, 'slide'] }[b.kind];
      let doorLeaf = null;
      if (DOOR && b.door !== undefined) {
        const [dw, dh] = DOOR, fx = Math.round(facade.width / 2 - dw / 2), fy = Math.max(0, facade.height - dh - 2);
        doorLeaf = G.makeCanvas(dw, dh); doorLeaf.getContext('2d').drawImage(facade, fx, fy, dw, dh, 0, 0, dw, dh);
        const fc = facade.getContext('2d'), gr = fc.createLinearGradient(0, fy, 0, fy + dh);
        gr.addColorStop(0, '#120c0a'); gr.addColorStop(.7, '#2a1c14'); gr.addColorStop(1, '#5a3e26');
        fc.fillStyle = gr; fc.fillRect(fx, fy, dw, dh);
        doorLeaf.fx = fx; doorLeaf.fy = fy;
      }
      const mFac = new T.MeshLambertMaterial({ map: tex(solid(facade, rgbS(wallCol, .9))) });
      const mSide = new T.MeshLambertMaterial({ map: tex(side), emissive: 0xffffff, emissiveIntensity: .0 }); mSide.emissiveMap = mSide.map; SIDES.add(mSide);
      // the roof is cut along the art's own outline (no filled corners above the roofline)
      const roofT = tex(roof), mRoof = new T.MeshLambertMaterial({ map: roofT, side: T.DoubleSide, alphaTest: .5 });
      mRoof.userData = { depth: new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, map: roofT, alphaTest: .5 }) };
      const wt2 = tex(wside); wt2.wrapS = T.RepeatWrapping; wt2.repeat.set(Math.max(1, Math.round(depth)), 1);
      const mWall = new T.MeshLambertMaterial({ map: wt2, emissive: 0xffffff }); mWall.emissiveMap = wt2; SIDES.add(mWall);
      const body = new T.Mesh(new T.BoxGeometry(b.w - .1, wallH, depth), [mWall, mWall, mSide, mSide, mFac, mSide]);
      body.position.set(x0 + b.w / 2, baseY + wallH / 2, zB + depth / 2); body.castShadow = body.receiveShadow = true; g.add(body);
      if (FLAT_ROOF.has(b.kind)) {
        // modern flat roof: a shallow slab carrying the roof art on top, with a lit parapet edge
        const slab = new T.Mesh(new T.BoxGeometry(b.w + .06, .14, depth + .06), [mSide, mSide, mRoof, mSide, mSide, mSide]);
        slab.position.set(x0 + b.w / 2, baseY + wallH + .07, zB + depth / 2); slab.castShadow = slab.receiveShadow = true; g.add(slab);
        if (doorLeaf) addDoor(g, b, doorLeaf, DOOR[2], x0, baseY, zF, wallH, wallPx, facade.width, trimCol, rgbS);
        continue;
      }
      // a proper gable roof: two slopes meeting at a ridge along the middle of the footprint, closed at
      // both ends by triangular gable walls, so nothing stands proud of the house from any side. The roof
      // art is laid across both slopes in proportion to how tall each looks from the camera (the back
      // slope is mostly hidden, so the art's top sliver lands there and the ridge falls where it's drawn).
      const sp = Math.sin(PITCH_CAM), cp = Math.cos(PITCH_CAM), half = depth / 2, R = Math.max(.3, half * TANP * 1.04);
      const ov = .16, X0 = x0 + .05 - ov, X1 = x1 - .05 + ov, Y0 = baseY + wallH, YR = Y0 + R, zM = zB + half, ZF = zF + ov, ZB = zB - ov;
      const hF = half * sp + R * cp, hB = Math.max(0, half * sp - R * cp), vr = hF / (hF + hB);
      const quad = (P, U, mat, shadow = true) => {
        const g2 = new T.BufferGeometry(); g2.setAttribute('position', new T.Float32BufferAttribute(P, 3)); g2.setAttribute('uv', new T.Float32BufferAttribute(U, 2));
        g2.setIndex(P.length === 12 ? [0, 2, 1, 1, 2, 3] : [0, 1, 2]); g2.computeVertexNormals();
        const m = new T.Mesh(g2, mat); m.castShadow = shadow; m.receiveShadow = true; if (mat.userData && mat.userData.depth) m.customDepthMaterial = mat.userData.depth; g.add(m); return m;
      };
      const dropF = ov * R / half, dropB = ov * R / half;   // eaves continue the slope past the walls
      quad([X0, Y0 - dropF, ZF, X1, Y0 - dropF, ZF, X0, YR, zM, X1, YR, zM], [0, 0, 1, 0, 0, vr, 1, vr], mRoof);   // front slope
      quad([X0, YR, zM, X1, YR, zM, X0, Y0 - dropB, ZB, X1, Y0 - dropB, ZB], [0, vr, 1, vr, 0, 1, 1, 1], mRoof);   // back slope
      // gable ends: wall-coloured triangles closing the roof at both sides
      const gx0 = x0 + .05, gx1 = x1 - .05, rv = R;
      quad([gx0, Y0, zF, gx0, YR, zM, gx0, Y0, zB], [0, 0, .5, rv / wallH, 1, 0], mWall);
      quad([gx1, Y0, zF, gx1, Y0, zB, gx1, YR, zM], [0, 0, 1, 0, .5, rv / wallH], mWall);
      if (doorLeaf) addDoor(g, b, doorLeaf, DOOR[2], x0, baseY, zF, wallH, wallPx, facade.width, trimCol, rgbS);
      // a real chimney where the art draws one (a stone-grey block at the top of the roof art); smoke rises from it
      if (b.kind === 'house') {
        const d = roof.getContext('2d').getImageData(0, 0, roof.width, Math.max(1, Math.round(roof.height * .5))).data;
        let sx = 0, n = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 200) continue;
          const r = d[i], gg = d[i + 1], bb = d[i + 2], sat = Math.max(r, gg, bb) - Math.min(r, gg, bb);
          if (sat < 40 && Math.abs(r - roofAvg[0]) + Math.abs(gg - roofAvg[1]) + Math.abs(bb - roofAvg[2]) > 90) { sx += (i / 4) % roof.width; n++; }
        }
        if (n > 8) {
          const cxw = x0 + .05 + (sx / n) / roof.width * (b.w - .1), cz = zM + .35, top = YR + .45;
          const ch = new T.Mesh(new T.BoxGeometry(.42, top - Y0, .42), new T.MeshLambertMaterial({ color: 0x8a847c }));
          ch.position.set(cxw, (top + Y0) / 2, cz); ch.castShadow = ch.receiveShadow = true; g.add(ch);
          const capm = new T.Mesh(new T.BoxGeometry(.52, .1, .52), new T.MeshLambertMaterial({ color: 0x5e5850 })); capm.position.set(cxw, top + .05, cz); g.add(capm);
          (group.userData.chimneys = group.userData.chimneys || []).push({ x: cxw, y: top + .12, z: cz });
        }
      }
    }
  }
  // a door leaf in a trimmed frame with a stone step: it swings (houses, double doors for gyms) or slides
  // apart (glass doors) as someone walks up to it; the doorway behind it is dark
  function addDoor(g, b, leaf, type, x0, baseY, zF, wallH, wallPx, fw, trimCol, rgbS) {
    const pxW = (b.w - .1) / fw, dw = leaf.width * pxW, dh = leaf.height / wallPx * wallH;
    const cx = x0 + .05 + (leaf.fx + leaf.width / 2) * pxW, y0 = baseY + wallH * (1 - (leaf.fy + leaf.height) / wallPx), zf = zF + .004;
    const t = texPx(leaf), halves = type === 'slide' || type === 'swing2' ? 2 : 1, parts = [];
    for (let h = 0; h < halves; h++) {
      const w = dw / halves, geo = new T.PlaneGeometry(w, dh);
      const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, (h + uv.getX(i)) / halves);
      // hinge at the outer edge: the geometry hangs off its pivot
      geo.translate(h === 0 ? w / 2 : -w / 2, dh / 2, 0);
      const m = new T.Mesh(geo, new T.MeshLambertMaterial({ map: t, side: T.DoubleSide }));
      const px = halves === 1 ? cx - dw / 2 : h === 0 ? cx - dw / 2 : cx + dw / 2;
      m.position.set(px, y0, zf); m.castShadow = false; m.receiveShadow = true; g.add(m); parts.push({ m, h, px, w });
    }
    // frame: jambs and a lintel standing proud of the wall, and a step
    const trim = new T.MeshLambertMaterial({ color: new T.Color(rgbS(trimCol, .95)) }), stone = new T.MeshLambertMaterial({ color: 0x9a948a });
    const add = (geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); };
    add(new T.BoxGeometry(.07, dh + .04, .09), trim, cx - dw / 2 - .035, y0 + dh / 2, zF + .03);
    add(new T.BoxGeometry(.07, dh + .04, .09), trim, cx + dw / 2 + .035, y0 + dh / 2, zF + .03);
    add(new T.BoxGeometry(dw + .2, .08, .12), trim, cx, y0 + dh + .04, zF + .045);
    add(new T.BoxGeometry(dw + .3, .06, .34), stone, cx, baseY + .03, zF + .17);
    const doors = g.parent.userData.doors || (g.parent.userData.doors = []);
    doors.push({ parts, type, open: 0, x: b.x + b.door, y: b.y + b.h - 1, dw });
  }
  // an irregular landmark (the Crane Tower) as a stack of slices that follow its outline row by row: each
  // slice is as wide as the art's opaque run on that row and a set depth deep, so stepped wings, spires and
  // setbacks get real sides and ledges; the front faces carry the art, the rest the art's edge colours
  function stackLandmark(img, x0, baseY, zF, D) {
    const c = img.getContext ? img : (() => { const k = G.makeCanvas(img.width, img.height); k.getContext('2d').drawImage(img, 0, 0); return k; })();
    const W = c.width, H = c.height, d = c.getContext('2d').getImageData(0, 0, W, H).data, TANP = Math.tan(PITCH_CAM), RS = 2;
    const P = [], U = [], C = [], gF = [], gS = [];
    const px = (x, y) => { const i = (y * W + x) * 4; return [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255, d[i + 3]]; };
    const quad = (A, B, Cc, Dd, uv, col, front) => {   // A B top edge (left, right), Cc Dd bottom edge
      const base = P.length / 3;
      P.push(...A, ...B, ...Cc, ...Cc, ...B, ...Dd);
      if (uv) U.push(uv[0], uv[1], uv[2], uv[1], uv[0], uv[3], uv[0], uv[3], uv[2], uv[1], uv[2], uv[3]); else U.push(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
      for (let k = 0; k < 6; k++) C.push(...(col || [1, 1, 1]));
      (front ? gF : gS).push(base);
    };
    let prev = null;
    for (let y = 0; y < H; y += RS) {
      let lo = W, hi = -1;
      for (let x = 0; x < W; x++) if (px(x, Math.min(H - 1, y + 1))[3] > 128) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
      if (hi < 0) { prev = null; continue; }
      const X0 = x0 + lo / 16, X1 = x0 + (hi + 1) / 16, Yt = baseY + (H - y) / 16 * TANP, Yb = baseY + (H - y - RS) / 16 * TANP, zf = zF, zb = zF - D;
      const edgeL = px(lo, Math.min(H - 1, y + 1)), edgeR = px(hi, Math.min(H - 1, y + 1));
      quad([X0, Yt, zf], [X1, Yt, zf], [X0, Yb, zf], [X1, Yb, zf], [lo / W, 1 - y / H, (hi + 1) / W, 1 - (y + RS) / H], null, true);
      quad([X0, Yt, zb], [X0, Yt, zf], [X0, Yb, zb], [X0, Yb, zf], null, edgeL.slice(0, 3).map(v => v * .62), false);
      quad([X1, Yt, zf], [X1, Yt, zb], [X1, Yb, zf], [X1, Yb, zb], null, edgeR.slice(0, 3).map(v => v * .5), false);
      // a ledge where this slice is wider than the one above it (or the top of the stack)
      const top = px(Math.round((lo + hi) / 2), y).slice(0, 3).map(v => v * .8);
      quad([X0, Yt, zb], [X1, Yt, zb], [X0, Yt, zf], [X1, Yt, zf], null, top, false);
      prev = [lo, hi];
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(P, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(U, 2)); geo.setAttribute('color', new T.Float32BufferAttribute(C, 3));
    geo.computeVertexNormals();
    const idx = []; for (const b0 of gF) for (let k = 0; k < 6; k++) idx.push(b0 + k); const nF = idx.length; for (const b0 of gS) for (let k = 0; k < 6; k++) idx.push(b0 + k);
    geo.setIndex(idx); geo.addGroup(0, nF, 0); geo.addGroup(nF, idx.length - nF, 1);
    const t = texPx(c);
    const m = new T.Mesh(geo, [new T.MeshLambertMaterial({ map: t, alphaTest: .5, side: T.DoubleSide }), new T.MeshLambertMaterial({ vertexColors: true, side: T.DoubleSide })]);
    m.castShadow = m.receiveShadow = true;
    return m;
  }
  // a round landmark turned on a lathe from its own silhouette: each art row's half-width becomes the
  // radius at that height, and the art is projected onto it from the front (lighthouses)
  function latheLandmark(img, cx, baseY, cz) {
    const c = img.getContext ? img : (() => { const k = G.makeCanvas(img.width, img.height); k.getContext('2d').drawImage(img, 0, 0); return k; })();
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data, W = c.width, H = c.height, TANP = Math.tan(PITCH_CAM);
    const prof = [];
    for (let y = H - 1; y >= 0; y -= 2) {
      let lo = W, hi = -1;
      for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 128) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
      const r = hi < 0 ? 0 : Math.max(Math.abs(hi + 1 - W / 2), Math.abs(W / 2 - lo));
      prof.push(new T.Vector2(Math.max(.02, r / 16 * .96), (H - 1 - y) / 16 * TANP));
    }
    const geo = new T.LatheGeometry(prof, 16);
    const pos = geo.attributes.position, uv = geo.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, .5 + pos.getX(i) * 16 / W, pos.getY(i) / (H / 16 * TANP));
    const t = texPx(c), m = new T.Mesh(geo, new T.MeshLambertMaterial({ map: t, alphaTest: .5, side: T.DoubleSide }));
    m.position.set(cx, baseY, cz); m.castShadow = m.receiveShadow = true;
    return m;
  }
  // doors open for whoever walks up to them (the player, or a partner in co-op)
  function updateDoors(w, grp) {
    const D = grp.userData.doors; if (!D || !w.player) return;
    const p = w.player, px = p.px / 16, py = p.py / 16;
    for (const d of D) {
      const near = Math.abs(px - d.x) < .9 && py > d.y - .2 && py < d.y + 1.6;
      d.open += ((near ? 1 : 0) - d.open) * .14;
      for (const q of d.parts) {
        if (d.type === 'slide') q.m.position.x = q.px + (q.h === 0 ? -1 : 1) * d.open * q.w * .92;
        else q.m.rotation.y = (q.h === 0 ? -1 : 1) * d.open * 1.75;
      }
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

  // ------------------------------------------------------------- particles
  // Step dust, leaves, pollen, butterflies and fireflies live in the 3D scene as depth-tested points,
  // so a puff behind the player stays behind them. Two batches: normal and additive (glows).
  const PMAX = 1600;
  let PB = null;
  function particleBatch(additive) {
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(new Float32Array(PMAX * 3), 3).setUsage(T.DynamicDrawUsage));
    g.setAttribute('pcol', new T.BufferAttribute(new Float32Array(PMAX * 4), 4).setUsage(T.DynamicDrawUsage));
    g.setAttribute('pdat', new T.BufferAttribute(new Float32Array(PMAX * 3), 3).setUsage(T.DynamicDrawUsage));   // size (px), kind, rotation
    const mat = new T.ShaderMaterial({
      uniforms: { uScale: { value: 1 }, uTime: U3.uTime }, transparent: true, depthWrite: false, blending: additive ? T.AdditiveBlending : T.NormalBlending,
      vertexShader: `attribute vec4 pcol; attribute vec3 pdat; varying vec4 vC; varying float vK; varying float vR; uniform float uScale;
        void main() { vC = pcol; vK = pdat.y; vR = pdat.z; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_Position = projectionMatrix * mv; gl_PointSize = max(1.5, pdat.x * uScale / -mv.z); }`,
      fragmentShader: `varying vec4 vC; varying float vK; varying float vR; uniform float uTime;
        void main() {
          vec2 q = gl_PointCoord * 2.0 - 1.0; float a = 0.0;
          if (vK < .5) a = smoothstep(1.0, .55, length(q));                                   // puff
          else if (vK < 1.5) { vec2 e = vec2(q.x, q.y * 2.6); float r = length(e); a = smoothstep(.16, 0.0, abs(r - .8)); }   // ground ring
          else if (vK < 2.5) { float c = cos(vR), s = sin(vR); vec2 r = vec2(c * q.x - s * q.y, s * q.x + c * q.y); a = step(length(vec2(r.x, r.y * 2.2)), .95); }   // leaf
          else if (vK < 3.5) { float r = length(q); a = exp(-r * r * 5.0) + smoothstep(.25, 0.0, r) * .6; }                   // glow mote
          else if (vK < 4.5) { float f = abs(sin(uTime * 14.0 + vR)); vec2 w = vec2(abs(q.x) - .45 * f, q.y); a = step(length(w * vec2(2.2 / max(f, .25), 1.8)), .9); if (abs(q.x) < .08 && abs(q.y) < .5) a = 1.0; }   // butterfly
          else a = step(max(abs(q.x), abs(q.y)), .8);                                           // square
          if (a * vC.a < .01) discard;
          gl_FragColor = vec4(vC.rgb, vC.a * a);
          #include <colorspace_fragment>
        }`,
    });
    const pts = new T.Points(g, mat); pts.frustumCulled = false; pts.renderOrder = 3;
    return { pts, g, mat, n: 0 };
  }
  const _col = T ? new T.Color() : null;
  function pushP(B, x, y, z, col, alpha, size, kind, rot) {
    if (B.n >= PMAX) return; const i = B.n++;
    B.g.attributes.position.array.set([x, y, z], i * 3);
    let c = _col;
    try { if (typeof col === 'string' && col.startsWith('rgba')) { const m = col.match(/rgba\(([^,]+),([^,]+),([^,]+),([^)]+)\)/); c.setRGB(m[1] / 255, m[2] / 255, m[3] / 255, T.SRGBColorSpace); alpha *= +m[4]; } else c.set(col || '#ffffff'); } catch (e) { c.set('#ffffff'); }
    B.g.attributes.pcol.array.set([c.r, c.g, c.b, alpha], i * 4);
    B.g.attributes.pdat.array.set([size, kind, rot || 0], i * 3);
  }
  const KIND = { circle: 0, ring: 1, leaf: 2, bfly: 4, star: 3 };
  function syncParticles(w, H) {
    if (!PB) { PB = [particleBatch(false), particleBatch(true)]; for (const b of PB) scene.add(b.pts); }
    for (const b of PB) b.n = 0;
    const scale = bufH / (2 * Math.tan(camera.fov * Math.PI / 360)) / 16;
    for (const b of PB) b.mat.uniforms.uScale.value = scale;
    const alphaOf = p => { const k = p.t / p.life; return p.alpha * (p.fade === false ? 1 : (p.fadeIn ? Math.min(1, p.t / p.fadeIn) : 1) * (1 - Math.max(0, (k - (p.fadeStart || .6)) / (1 - (p.fadeStart || .6))))); };
    const hAt = (X, Z) => H.at(G.clamp(X, 0, H.W - .01), G.clamp(Z, 0, H.H - .01));
    // effects on the ground: height comes from how far the particle rose above where it started
    for (const p of w.fx.list) {
      if (p.z0 === undefined) p.z0 = p.y;
      const a = alphaOf(p); if (a <= .01) continue;
      const lift = Math.max(0, p.z0 - p.y) / 16, Z = (p.z0 + Math.max(0, p.y - p.z0) * .5) / 16, X = p.x / 16;
      const s = p.grow ? p.size * (1 + p.grow * p.t / p.life) : p.size;
      const kind = p.type in KIND ? KIND[p.type] : 5, add = p.blend === 'lighter' || p.glow;
      pushP(PB[add ? 1 : 0], X, hAt(X, Z) + lift + (kind === 1 ? .03 : .12), Z, p.color, a, s * 2 * (kind === 1 ? 2 : 1.2), kind, p.rot);
    }
    // drifting life (leaves, petals, pollen, butterflies, fireflies, snow): each floats at its own height
    for (const p of w.parts.list) {
      if (p.type === 'line') continue;
      if (p.h3 === undefined) p.h3 = p.glow ? .3 + Math.random() * 1.6 : p.type === 'bfly' ? .5 + Math.random() * 1.2 : 1 + Math.random() * 3;
      const a = alphaOf(p); if (a <= .01) continue;
      if (p.abs) {   // placed in the world by absolute position (chimney smoke): x drifts, h3 rises
        pushP(PB[0], p.x / 16, p.abs.y + p.h3, p.abs.z, p.color, alphaOf(p), (p.grow ? (p.size || 1) * (1 + p.grow * p.t / p.life) : (p.size || 1)) * 2.6, 5, p.rot);
        continue;
      }
      const X = p.x / 16, Z = p.y / 16 + 1.5;
      const kind = p.glow || p.blend === 'lighter' ? 3 : p.type in KIND ? KIND[p.type] : 5, add = kind === 3;
      pushP(PB[add ? 1 : 0], X, (camY === null ? 0 : camY) + p.h3 + Math.sin(p.t / 40 + p.x) * .15, Z, p.color, a, (p.grow ? (p.size || 1) * (1 + p.grow * p.t / p.life) : (p.size || 1)) * (kind === 3 ? 6 : kind === 4 ? 5 : 2.6), kind, p.rot + (kind === 4 ? p.x : 0));
    }
    for (const b of PB) { b.g.setDrawRange(0, b.n); for (const k of ['position', 'pcol', 'pdat']) b.g.attributes[k].needsUpdate = true; }
  }

  // ------------------------------------------------------------- light shafts
  // long additive planes slanting down from the sun around the player; each fades in and out on its
  // own slow cycle. Warm and stronger in forests and at golden hour.
  let rays = null;
  function rayTexture() {
    const c = G.makeCanvas(32, 128), x = c.getContext('2d');
    for (let yy = 0; yy < 128; yy++) for (let xx = 0; xx < 32; xx++) {
      const v = yy / 127, u = Math.abs(xx / 31 - .5) * 2;
      const ss = (e0, e1, q) => { const k = Math.min(1, Math.max(0, (q - e0) / (e1 - e0))); return k * k * (3 - 2 * k); };
      const a = Math.pow(1 - u, 1.8) * ss(0, .3, v) * (1 - ss(.55, 1, v));
      x.fillStyle = `rgba(255,255,255,${a.toFixed(3)})`; x.fillRect(xx, 127 - yy, 1, 1);
    }
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
  }
  function updateRays(w, fx, fy, fz) {
    const m = w.map, h = G.clock.hourF();
    const day = h >= 7 && h <= 17 ? 1 : h > 17 && h < 19 ? (19 - h) / 2 : h > 6 && h < 7 ? h - 6 : 0;
    const on = G.settings.fancy !== false && m.type === 'outdoor' && !(w.weather && w.weather !== 'petals' && w.weather !== 'leaves') && day > 0;
    if (!rays) {
      rays = new T.Group(); scene.add(rays);
      const t = rayTexture();
      for (let i = 0; i < 9; i++) {
        const len = 9, wd = 1 + (i % 3) * .8, g = new T.PlaneGeometry(wd, len); g.translate(0, len / 2, 0);
        const mt = new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, blending: T.AdditiveBlending, opacity: 0, fog: false, side: T.DoubleSide });
        const r = new T.Mesh(g, mt); r.userData.i = i; r.renderOrder = 4; rays.add(r);
      }
    }
    rays.visible = on; if (!on) return;
    const forest = /wood|forest|grove/.test(m.id), warm = h > 16 || h < 8;
    const base = (forest ? .3 : .16) * day * (warm ? 1.35 : 1);
    const dir = new T.Vector3(-.5, 1, -.3).normalize();   // slanting down-right across the view, like light through a canopy
    const t = G.realTime;
    for (const r of rays.children) {
      const i = r.userData.i, phase = t / (38 + i * 7) + i * 1.9, life = Math.max(0, Math.sin(phase));
      r.material.opacity = base * life * (.6 + (i % 2) * .4);
      r.material.color.setHex(warm ? 0xffc27a : 0xfff2c8);
      // anchored in the world (drift slowly), spread around the view
      const wrap = (v, n) => ((v % n) + n) % n;
      const ax = fx + wrap(i * 5.3 + t * .05 - fx, 26) - 13, az = fz - 6 + wrap(i * 3.7 - fz * .0, 13);
      r.position.set(ax, H0(ax, az) - .2, az);
      // plane's long axis points up toward the sun; face the camera around that axis
      r.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
      const cam = new T.Vector3().subVectors(camera.position, r.position); cam.addScaledVector(dir, -cam.dot(dir));
      const nrm = new T.Vector3(0, 0, 1).applyQuaternion(r.quaternion); const ang = Math.atan2(new T.Vector3().crossVectors(nrm, cam).dot(dir), nrm.dot(cam));
      r.rotateY(ang);
    }
  }
  const H0 = (x, z) => cur ? cur.hv.at(G.clamp(x, 0, cur.map.w - .01), G.clamp(z, 0, cur.map.h - .01)) : 0;

  // ------------------------------------------------------------- lights
  // every lamp, lantern, crystal and lava cell gets an additive glow sprite (faded in by night, lava
  // always on); a small pool of point lights follows the nearest ones so they light the ground
  const LIGHT_COL = { lamp: 0xffc47a, lantern: 0xffb060, crystal: 0x7ae0ff, lava: 0xff6a2a, screen: 0x7ab0ff };
  const LIGHT_LIFT = { lamp: 2.29, lantern: .8, crystal: .7, lava: .15, screen: .8 };
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
  function dispose(obj) { obj.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { SIDES.delete(m); if (m.map) m.map.dispose(); m.dispose(); }); }); }

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
      if (!m) { m = entSprite(img); E.sprites.set(key, m); E.dyn.add(m); }
      setBillboardImage(m, img); m.visible = true;
      const fx = px / 16 + .5, fz = py / 16 + 1, gy = H.at(G.clamp(fx, 0, H.W - .01), G.clamp(fz - .5, 0, H.H - .01));
      m.position.set(fx, gy + lift / 16 * ENT_SC, fz - .45);
      // contact shadow stays on the ground (hops lift the figure, not the shadow)
      const bl = m.userData.blob; bl.position.set(0, gy - m.position.y + .03, .05); const bw = img.width / 16 * .7 * ENT_SC; bl.scale.set(bw, 1, bw * .55); bl.visible = lift > -2;
    };
    for (const e of w.ents) if (e.visible && !e.hidden) {
      // swimmers sink to the chest: the opaque water surface hides the rest
      const c = w.map.cell(e.x, e.y), swim = c && c.water && c.g !== 'bridge' && c.g !== 'bridgev';
      const img = entImage(w, e);
      place('e:' + e.id + ':' + e.x0id, img, e.px, e.py, swim && img ? -img.height * .5 * STRETCH + Math.sin(w.frame / 14 + e.x) : (e.hop || 0));
    }
    if (w.player) place('player', entImage(w, w.player), w.player.px, w.player.py, w.player.hop || 0);
    const f = w.follower; if (f && !f.hidden) place('follower', G.monArt.overworld(f.mon.sp, f.mon.shiny, f.dir, Math.floor(w.frame / 10) % 2), f.px, f.py, f.hop || 0);
    for (const [k, m] of E.sprites) if (!seen.has(k)) m.visible = false;
  }
  const entTint = T ? new T.Color(1, 1, 1) : null, entRim = T ? new T.Color() : null;
  function lighting(w) {
    const h = G.clock.hourF(), m = w.map;
    const indoor = m.type !== 'outdoor';
    const day = indoor ? 1 : h >= 7 && h <= 17 ? 1 : h > 17 && h < 19.5 ? 1 - (h - 17) / 2.5 : h > 5 && h < 7 ? (h - 5) / 2 : 0;
    const dusk = !indoor && ((h > 16.5 && h < 20) || (h > 5 && h < 7.5));
    night = indoor ? 0 : 1 - day;
    // clouds passing over: the sun dims and returns slowly
    const cl = indoor ? 1 : .86 + .14 * Math.max(-1, Math.min(1, Math.sin(G.realTime * .13) * 1.6 + Math.sin(G.realTime * .047 + 1.3)));
    sun.intensity = (.35 + 1.45 * day) * cl; sun.color.set(dusk ? 0xffb070 : day > .5 ? 0xfff0d8 : 0x9ab0ff);
    hemi.intensity = .45 + .55 * day; hemi.color.set(day > .3 ? 0xdfeeff : 0x5a6aa8); hemi.groundColor.set(day > .3 ? 0x4a5a3a : 0x1a1e30);
    const sky = indoor ? 0x08080e : dusk ? 0xe8a88a : day > .3 ? 0x9cc8f0 : 0x0a1030;
    scene.background = new T.Color(sky);
    for (const m of SIDES) m.emissiveIntensity = .34 * day + .04;
    for (const m of LAMP_GLASS) m.emissiveIntensity = .15 + 1.6 * night;
    WU.uSky.value.set(dusk ? 0xffc8a0 : day > .3 ? 0xcfe8ff : 0x28386a); WU.uSun.value.copy(sun.color).multiplyScalar(day > .1 ? 1 : .35);
    WU.uNight.value = night; WU.uDeep.value.set(day > .3 ? 0x1c5a8a : 0x0c1a38);
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
    updateDoors(w, cur.group);
    { const R = U3.uRustle.value; let n = 0;
      for (const r of w.rustles || []) { if (n >= 3 || r.map !== w.map.id) continue; const on = Math.sin(w.frame / 16 + r.x * 1.7) >= .1 ? 1 : 0; R[n++].set(r.x + .5, r.y + 1, 0, on); }
      const p = w.player, pc = p && w.map.cell(p.x, p.y);
      if (p && pc && pc.g === 'tall') R[n++].set(p.px / 16 + .5, p.py / 16 + 1, 0, p.moving ? 1 : .35);
      for (; n < 4; n++) R[n].w = 0; }
    const wt = cur.group.userData.water; if (wt) { const tt = G.realTime; wt[0].offset.set((tt * .05) % 1, (Math.sin(tt * .4) * .03)); }
    U3.uTime.value = G.realTime; U3.uWind.value = G.wind ? G.wind(w.frame) : 0;
    camY = camY === null || Math.abs(camY - fy) > 4 ? fy : camY + (fy - camY) * .12;
    const dist = 23.5, cy = Math.sin(PITCH) * dist, cz = Math.cos(PITCH) * dist;
    camera.position.set(fx, camY + cy, fz + cz); camera.lookAt(fx, camY + .6, fz);
    WU.uCam.value.copy(camera.position); TU.uCamP.value.copy(camera.position); TU.uPlayer.value.set(fx, fy, fz + .1);
    syncParticles(w, cur.hv);
    updateRays(w, fx, fy, fz);
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
    renderReflection();
    R.render(scene, camera);
    return true;
  }
  const _plane = T ? new T.Plane(new T.Vector3(0, 1, 0), 0) : null, _tgt = T ? new T.Vector3() : null;
  const BIAS = T ? new T.Matrix4().set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1) : null;
  function renderReflection() {
    const ud = cur && cur.group.userData, wy = ud && ud.waterY;
    REFL.uReflOn.value = 0;
    if (wy === undefined || G.settings.fancy === false || G.settings.reflections === false) return;
    if (!reflRT) { reflRT = new T.WebGLRenderTarget(2, 2, { type: T.HalfFloatType }); mirrorCam = camera.clone(); }
    const w = Math.max(2, bufW >> 1), h = Math.max(2, bufH >> 1);
    if (reflRT.width !== w || reflRT.height !== h) reflRT.setSize(w, h);
    camera.updateMatrixWorld();
    mirrorCam.projectionMatrix.copy(camera.projectionMatrix); mirrorCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    mirrorCam.position.set(camera.position.x, 2 * wy - camera.position.y, camera.position.z);
    camera.getWorldDirection(_tgt); _tgt.multiplyScalar(10).add(camera.position); _tgt.y = 2 * wy - _tgt.y;
    mirrorCam.up.set(0, -1, 0); mirrorCam.lookAt(_tgt); mirrorCam.updateMatrixWorld();
    REFL.uTexMat.value.copy(BIAS).multiply(mirrorCam.projectionMatrix).multiply(mirrorCam.matrixWorldInverse);
    const hide = ud.waterMeshes || []; for (const m of hide) m.visible = false;
    const rv = rays && rays.visible; if (rays) rays.visible = false;
    _plane.constant = -(wy - .02);
    R.clippingPlanes = [_plane]; R.setRenderTarget(reflRT); R.render(scene, mirrorCam); R.setRenderTarget(null); R.clippingPlanes = [];
    for (const m of hide) m.visible = true; if (rays) rays.visible = rv;
    REFL.uRefl.value = reflRT.texture; REFL.uReflOn.value = 1;
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
  return { _rays: () => rays, _cur: () => cur, _bases: () => bases, chimneys: () => (cur && cur.group.userData.chimneys) || [], levels, active, render, hide, project, projectFlat, invalidate: id => { const e = cache.get(id); if (e) { if (cur === e) { scene.remove(e.group); cur = null; } dispose(e.group); cache.delete(id); } } };
})();
