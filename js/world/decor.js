'use strict';
// ============================================================================
//  Interior dressing. Rooms are authored as small grids with the essentials
//  (counters, beds, tables, NPCs); this pass furnishes them the way a lived-in
//  room looks: pictures, sconces, shelves, calendars and clocks along the wall;
//  a rug under every table group and a runner from the door; and furniture
//  (kitchen units, dressers, lamps, armchairs, plants, boxes...) against the
//  walls. Every piece is checked so it never blocks a door, a person, an item
//  or a path. Deterministic per map. def.dress === false opts a room out.
// ============================================================================
(function () {
  const FLOOR = new Set(['wood', 'tilefloor', 'carpet']);
  const RUG = { home: ['#8a3a4a', '#3a5a8a', '#4a7a5a', '#8a6a3a'], lab: ['#3a6a8a'], haven: ['#c8505a'], shop: ['#3a7a6a'], cafe: ['#8a4a3a', '#5a3a6a'] };
  const SETS = {
    home: ['dresser', 'sidetable', 'armchair', 'plant', 'floorlamp', 'shelf', 'boxes', 'plant2'],
    lab: ['machine', 'boxes', 'whiteboard', 'plant', 'sidetable', 'machine'],
    haven: ['plant', 'armchair', 'vending', 'sidetable', 'plant2'],
    shop: ['boxes', 'plant', 'display', 'boxes'],
    cafe: ['plant', 'sidetable', 'armchair', 'floorlamp', 'plant2'],
  };
  const WALLDECOR = { home: [2, 4, 5, 6, 8, 3, 9, 4], lab: [9, 4, 7, 5, 3, 4], haven: [4, 7, 2, 5, 4], shop: [7, 4, 5, 9, 4], cafe: [4, 2, 5, 8, 4, 6] };

  G.dressInterior = function (map) {
    const d = map.def;
    if (map.type !== 'indoor' || d.dress === false) return;
    const W = map.w, H = map.h, cell = (x, y) => map.cell(x, y), isWall = c => c && c.g === 'wall';
    if (!isWall(cell(0, 0)) && !isWall(cell(W >> 1, 0))) return;
    if (map.cells.some(c => c.g === 'gymfloor' || c.g === 'gymfloor2' || c.g === 'water' || c.g === 'lava' || c.o === 'tree' || c.g === 'ice')) return;
    const id = map.id;
    const kind = d.isHaven ? 'haven' : d.wall === 'lab' ? 'lab' : /mart|shop|store|boutique/.test(id) ? 'shop' : /cafe|diner|inn/.test(id) ? 'cafe' : 'home';
    const rnd = new G.RNG('dress|' + id);
    const busy = new Set(), key = (x, y) => x + ',' + y;
    for (const w of map.warps) busy.add(key(w.x, w.y));
    for (const o of map.objs) busy.add(key(o.x, o.y));
    if (d.spawn) busy.add(key(d.spawn[0], d.spawn[1]));
    const nearBusy = (x, y) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (busy.has(key(x + dx, y + dy))) return true; return false; };
    map.decor = { kind, lamps: [], windows: [], wb: [] };

    // ---- wall decor on the upper wall row (the lower row carries the wainscot)
    const pal = WALLDECOR[kind];
    let k = rnd.int(0, pal.length - 1), last = -9;
    for (let x = 0; x < W; x++) {
      let yb = -1; for (let y = 0; y < H - 1; y++) if (isWall(cell(x, y)) && !isWall(cell(x, y + 1))) { yb = y; break; }
      if (yb < 0) continue;
      map.decor.wb[x] = yb;
      const y = yb > 0 && isWall(cell(x, yb - 1)) ? yb - 1 : yb, c = cell(x, y);
      if (c.wv) { last = x; if (c.wv === 1) map.decor.windows.push({ x, y }); continue; }
      const below = cell(x, yb + 1);
      if (x - last < 2 || (below && (below.g === 'stairsup' || below.g === 'stairsdown'))) continue;
      if (rnd.next() < .8) { c.wv = pal[k++ % pal.length]; last = x; if (c.wv === 4) map.decor.lamps.push({ x, y, kind: 'sconce' }); }
    }
    // ---- rugs under table groups, and a runner in from the door mat
    const rugCol = RUG[kind][rnd.int(0, RUG[kind].length - 1)];
    const seen = new Set();
    for (const c0 of map.cells) {
      if (c0.o !== 'table' || seen.has(c0)) continue;
      let x0 = c0.x, x1 = c0.x, y0 = c0.y, y1 = c0.y; const st = [c0]; seen.add(c0);
      while (st.length) { const c = st.pop(); x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); y0 = Math.min(y0, c.y); y1 = Math.max(y1, c.y); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = cell(c.x + dx, c.y + dy); if (n && n.o === 'table' && !seen.has(n)) { seen.add(n); st.push(n); } } }
      for (let y = y0 - 1; y <= y1 + 1; y++) for (let x = x0 - 1; x <= x1 + 1; x++) {
        const c = cell(x, y); if (!c || !FLOOR.has(c.g) || (c.o && c.o !== 'table') || c.g === 'mat') continue;
        if (map.warps.some(w => w.x === x && w.y === y)) continue;
        c.g = 'carpet'; c.carpet = rugCol;
      }
    }
    for (const c of map.cells) if (c.g === 'mat' && kind !== 'shop') {
      for (let dy = 1; dy <= 2; dy++) { const n = cell(c.x, c.y - dy); if (!n || !FLOOR.has(n.g) || n.o || n.g === 'carpet') break; n.g = 'carpet'; n.carpet = kind === 'haven' ? '#c8505a' : '#6a4a7a'; }
    }
    // ---- furniture against the walls and in the corners, never blocking anything
    const walkable = c => c && !c.solid && !(c.o && c.o !== 'rug');
    const start = d.spawn ? cell(d.spawn[0], d.spawn[1]) : map.warps.length ? cell(map.warps[0].x, map.warps[0].y) : null;
    if (!start) return;
    const reach = () => {
      const R = new Set([start]), q = [start];
      while (q.length) { const c = q.pop(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const n = cell(c.x + dx, c.y + dy); if (n && !R.has(n) && (walkable(n) || busy.has(key(n.x, n.y)))) { R.add(n); q.push(n); } } }
      return R;
    };
    const base = reach();
    const ok = (placed) => {
      const R = reach();
      if (R.size < base.size - placed) return false;                             // nothing cut off
      for (const o of map.objs) {                                                 // people and things still reachable
        const adj = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].some(([dx, dy]) => { const n = cell(o.x + dx, o.y + dy); return n && R.has(n); });
        if (!adj) return false;
      }
      for (const w of map.warps) { const n = cell(w.x, w.y); if (n && !R.has(n)) return false; }
      return true;
    };
    const cand = [];
    for (let y = 1; y < H; y++) for (let x = 0; x < W; x++) {
      const c = cell(x, y), up = cell(x, y - 1);
      if (!c || !FLOOR.has(c.g) || c.o || c.solid || c.g === 'carpet' || busy.has(key(x, y)) || nearBusy(x, y)) continue;
      const againstWall = isWall(up), side = x === 0 || x === W - 1, corner = y === H - 1 && side;
      if (!againstWall && !side) continue;
      const dn = cell(x, y + 1); if (dn && (dn.g === 'stairsup' || dn.g === 'stairsdown' || dn.g === 'mat')) continue;
      cand.push({ c, x, y, againstWall, corner, side });
    }
    // a kitchen run in homes: three free cells in a row against the wall
    let placed = 0;
    const put = (cc, o) => { cc.c.o = o; cc.c.solid = true; placed++; if (!ok(placed)) { cc.c.o = null; cc.c.solid = false; placed--; return false; } if (o === 'floorlamp' || o === 'sidetable') map.decor.lamps.push({ x: cc.x, y: cc.y, kind: o }); return true; };
    const used = new Set();
    if (kind === 'home' || kind === 'cafe') {
      const run = cand.filter(q => q.againstWall);
      for (let i = 0; i + 2 < run.length; i++) {
        const a = run[i], b = run[i + 1], c = run[i + 2];
        if (b.x !== a.x + 1 || c.x !== a.x + 2 || b.y !== a.y || c.y !== a.y) continue;
        if (put(a, 'fridge') && put(b, 'stove') && put(c, 'sink')) { used.add(a); used.add(b); used.add(c); break; }
        for (const q of [a, b, c]) if (q.c.o) { q.c.o = null; q.c.solid = false; placed--; }
      }
    }
    const set = SETS[kind];
    const limit = Math.max(2, Math.floor(W / 3)) + (kind === 'home' ? 1 : 0);
    let n = used.size, si = rnd.int(0, set.length - 1);
    const order = cand.filter(q => !used.has(q)).sort((a, b) => (b.corner - a.corner) || (G.h2(a.x, a.y, 3) - G.h2(b.x, b.y, 3)));
    let lastX = -9, lastY = -9;
    for (const q of order) {
      if (n >= limit) break;
      if (Math.abs(q.x - lastX) < 2 && q.y === lastY) continue;
      const o = q.corner ? (rnd.next() < .6 ? 'plant' : 'plant2') : set[si++ % set.length];
      if (put(q, o)) { n++; lastX = q.x; lastY = q.y; }
    }
  };
})();
