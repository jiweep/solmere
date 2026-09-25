'use strict';
// ============================================================================
//  Maps: definitions, legends, runtime cells, autotiling, seamless
//  connections and tile rendering.
// ============================================================================
G.MAPDEFS = {};
G.defMap = function (def) { G.MAPDEFS[def.id] = def; return def; };
G.LEGENDS = {
  outdoor: {
    '.': { g: 'grass' }, ',': { g: 'grass', v: 3 }, 'f': { g: 'flowers' }, '"': { g: 'tall', enc: 'grass' },
    ':': { g: 'path' }, '=': { g: 'pave' }, 's': { g: 'sand' }, '~': { g: 'water', water: true, enc: 'surf' },
    'T': { o: 'tree', solid: true }, 'P': { o: 'pine', solid: true }, 'Y': { o: 'palm', solid: true, gnd: 'sand' }, 'X': { o: 'deadtree', solid: true },
    't': { o: 'smalltree', solid: true, cut: true }, 'R': { o: 'rock', solid: true }, 'r': { o: 'crackrock', solid: true, smash: true }, 'B': { o: 'boulder', solid: true, push: true },
    'F': { o: 'fence', solid: true }, 'h': { g: 'hedge', solid: true }, 'v': { g: 'ledge', ledge: 'down', solid: true }, '<': { g: 'ledgel', ledge: 'left', solid: true }, '>': { g: 'ledger', ledge: 'right', solid: true },
    '#': { g: 'cliff', solid: true }, 'l': { o: 'lamp', solid: true, light: 'lamp' }, 'b': { g: 'bridge' }, 'I': { g: 'bridgev' }, 'w': { g: 'bridge' },
    '*': { g: 'snow' }, 'i': { g: 'ice', ice: true }, 'a': { g: 'ash' }, 'm': { g: 'lava', solid: true, light: 'lava' }, 'x': { solid: true }, 'n': { g: 'path', solid: true },
    'k': { o: 'crystal', solid: true, light: 'crystal' }, 'g': { o: 'grave', solid: true }, 'j': { o: 'lanternpost', solid: true, light: 'lantern' },
    'c': { g: 'cave' }, 'D': { g: 'dark', solid: true }, 'q': { g: 'pave', solid: true }, 'u': { o: 'bench', solid: true }, 'y': { o: 'flowerpot', solid: true },
    'o': { o: 'fountain', solid: true }, 'z': { o: 'snowman', solid: true }, 'e': { o: 'tent', solid: true }, 'p': { o: 'stall', solid: true }, 'Q': { o: 'crate', solid: true }, 'O': { o: 'barrel', solid: true },
    'S': { o: 'statue', solid: true }, 'A': { o: 'boat', solid: true, gnd: 'water' }, 'H': { g: 'tall', enc: 'grass', rare: true },
  },
  indoor: {
    '.': { g: 'wood' }, ',': { g: 'tilefloor' }, '_': { g: 'carpet' }, 'W': { g: 'wall', solid: true }, 'w': { g: 'wall', wv: 1, solid: true }, 'p': { g: 'wall', wv: 2, solid: true }, 'c': { g: 'wall', wv: 3, solid: true },
    'K': { o: 'counter', solid: true, counter: true }, 'C': { o: 'pc', solid: true, pc: true }, 'Q': { o: 'shelf', solid: true }, 'U': { o: 'bed', solid: true }, 'Y': { o: 'table', solid: true }, 'Z': { o: 'tv', solid: true },
    'V': { o: 'plant', solid: true }, '^': { g: 'stairsup' }, 'v': { g: 'stairsdown' }, 'M': { g: 'mat' }, 'H': { o: 'healer', solid: true, counter: true }, 'x': { solid: true }, '#': { g: 'dark', solid: true },
    'g': { g: 'gymfloor' }, 'G': { g: 'gymfloor2' }, 'r': { o: 'rug' }, 'k': { o: 'crate', solid: true }, 'o': { o: 'barrel', solid: true }, 'q': { o: 'machine', solid: true, light: 'screen' }, 'S': { o: 'statue', solid: true },
    'd': { o: 'desk', solid: true }, 'i': { g: 'ice', ice: true }, 'm': { g: 'metal' }, 'B': { o: 'boulder', solid: true, push: true }, '~': { g: 'water', water: true }, 'L': { g: 'lava', solid: true, light: 'lava' },
    'T': { o: 'tree', solid: true, gnd: 'grass' }, '"': { g: 'tall', enc: null, gnd: 'grass' }, 'f': { g: 'flowers' }, 'h': { g: 'hedge', solid: true }, ':': { g: 'path' }, 's': { g: 'sand' },
    'R': { o: 'rock', solid: true, gnd: 'cave' }, 'j': { o: 'lanternpost', solid: true, light: 'lantern' }, 'l': { o: 'lamp', solid: true, light: 'lamp' }, 'n': { g: 'wall', wstyle: 'stone', solid: true },
    'X': { o: 'cauldron', solid: true }, 'O': { o: 'orbball', solid: true }, 'a': { g: 'ash' }, 'c2': null,
  },
  cave: {
    '.': { g: 'cave', enc: 'cave' }, ',': { g: 'crystalfloor', enc: 'cave' }, ':': { g: 'cave' }, '#': { g: 'cavewall', solid: true }, '%': { g: 'crystalwall', solid: true },
    'R': { o: 'rock', solid: true }, 'r': { o: 'crackrock', solid: true, smash: true }, 'B': { o: 'boulder', solid: true, push: true }, '~': { g: 'water', water: true, enc: 'surf' },
    'k': { o: 'crystal', solid: true, light: 'crystal' }, '^': { g: 'ladderup' }, 'v': { g: 'ledge', ledge: 'down', solid: true, gnd: 'cave' }, 'x': { solid: true }, 'i': { g: 'ice', ice: true },
    '*': { g: 'snow', enc: 'cave' }, 'm': { g: 'lava', solid: true, light: 'lava' }, 'D': { g: 'dark', solid: true }, 'o': { g: 'hole' }, 'a': { g: 'ash', enc: 'cave' }, 'h': { g: 'cave' },
    'b': { g: 'bridge' }, 'I': { g: 'bridgev' }, 'O': { o: 'orbball', solid: true }, 'j': { o: 'lanternpost', solid: true, light: 'lantern' }, 'M': { g: 'mat' }, '=': { g: 'pave' }, 'w': { g: 'metal' },
  },
};

G.WorldMap = class {
  constructor(def) {
    this.def = def; this.id = def.id; this.name = def.name; this.type = def.type || 'outdoor';
    this.theme = def.theme || 'grass'; this.ground = def.ground || (this.type === 'cave' ? 'cave' : this.theme === 'snow' ? 'snow' : this.theme === 'ash' ? 'ash' : this.type === 'indoor' ? 'wood' : 'grass');
    const rows = def.grid;
    this.h = rows.length; this.w = Math.max(...rows.map(r => r.length));
    const L = { ...G.LEGENDS[this.type === 'indoor' ? 'indoor' : this.type === 'cave' ? 'cave' : 'outdoor'], ...(def.legend || {}) };
    this.cells = [];
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const ch = rows[y][x] || (this.type === 'indoor' ? '#' : this.type === 'cave' ? '#' : 'T');
      const e = L[ch] || L['.'];
      const cell = { ch, g: e.g || e.gnd || this.ground, o: e.o || null, solid: !!e.solid, enc: e.enc === undefined ? null : e.enc, water: !!e.water, ledge: e.ledge || null, ice: !!e.ice, light: e.light || null, cut: !!e.cut, smash: !!e.smash, push: !!e.push, pc: !!e.pc, counter: !!e.counter, rare: !!e.rare, wv: e.wv || 0, wstyle: e.wstyle || null, solidIf: e.solidIf || null, sw: e.sw || null, v: G.hash(this.id + x + ',' + y) % 4, x, y };
      if (e.gnd) cell.g = e.gnd;
      if (cell.o && !e.g) cell.g = e.gnd || this.ground;
      if (ch === 'x' && !e.g) cell.g = this.ground;
      this.cells.push(cell);
    }
    // props without their own ground stand on whatever surrounds them (sand, paving, snow...), not the map default
    if (this.type === 'outdoor') {
      const walkG = new Set(['grass', 'path', 'pave', 'sand', 'snow', 'ash', 'cave']);
      for (const c of this.cells) {
        if (!c.o || c.ch === 'T' || c.ch === 'P' || c.ch === 'Y' || L[c.ch] && (L[c.ch].g || L[c.ch].gnd)) continue;
        const cnt = {};
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
          const n = this.cells[(c.y + dy) * this.w + c.x + dx];
          if (n && !n.o && walkG.has(n.g) && Math.abs(dx) + Math.abs(dy) > 0 && n.x === c.x + dx) cnt[n.g] = (cnt[n.g] || 0) + (dx && dy ? 1 : 2);
        }
        const best = Object.keys(cnt).sort((a, b) => cnt[b] - cnt[a])[0];
        if (best) c.g = best;
      }
    }
    this.objs = (def.objs || []).map(o => ({ ...o }));
    this.buildings = this.objs.filter(o => o.type === 'building');
    this.warps = (def.warps || []).map(w => ({ ...w }));
    for (const b of this.buildings) {
      const cov = G.bldCoverage(b);
      for (let yy = b.y; yy < b.y + b.h; yy++) for (let xx = b.x; xx < b.x + b.w; xx++) {
        const c = this.cell(xx, yy); if (!c) continue;
        // generated art does not always fill its footprint: only cells the sprite actually covers are walls
        if (cov && cov[(yy - b.y) * b.w + (xx - b.x)] < .3) continue;
        c.solid = true; c.bld = b;
      }
      const dx = b.x + (b.door !== undefined ? b.door : Math.floor(b.w / 2)), dy = b.y + b.h - 1;
      if (b.to) { const c = this.cell(dx, dy); if (c) { c.solid = false; c.door = true; } this.warps.push({ x: dx, y: dy, to: b.to, tx: b.tx, ty: b.ty, dir: 'up', kind: 'door', cond: b.cond, locked: b.locked }); }
      else { const c = this.cell(dx, dy); if (c) c.lockedDoor = b.lockMsg || 'The door is locked.'; }
    }
    this.conns = [];
    this.computeMasks();
    if (G.dressInterior) G.dressInterior(this);
  }
  cell(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h ? this.cells[y * this.w + x] : null; }
  computeMasks() {
    const fam = (g, f) => {
      if (!g) return false;
      switch (f) {
        case 'path': return g === 'path' || g === 'pave' || g === 'bridge' || g === 'bridgev' || g === 'water' || g === 'sand' || g === 'mat' || g === 'stairsup';
        case 'sand': return g === 'sand' || g === 'water' || g === 'path' || g === 'pave' || g === 'bridge' || g === 'bridgev';
        case 'water': return g === 'water' || g === 'bridge' || g === 'bridgev';
        default: return g === f;
      }
    };
    for (const c of this.cells) {
      let f = c.g;
      if (f === 'tall' || f === 'cliff' || f === 'cavewall' || f === 'crystalwall' || f === 'hedge' || f === 'path' || f === 'sand' || f === 'water' || c.o === 'fence') {
        const same = (dx, dy) => { const n = this.cellAny(c.x + dx, c.y + dy); if (!n) return f === 'water' || f === 'cliff' || f === 'cavewall' || f === 'path'; return c.o === 'fence' ? n.o === 'fence' : fam(n.g, f); };
        let m = 0;
        if (same(0, -1)) m |= 1; if (same(1, 0)) m |= 2; if (same(0, 1)) m |= 4; if (same(-1, 0)) m |= 8;
        if (same(-1, -1)) m |= 16; if (same(1, -1)) m |= 32; if (same(1, 1)) m |= 64; if (same(-1, 1)) m |= 128;
        c.mask = m;
        if (f === 'water') {
          // choose shoreline material
          let sand = 0, grass = 0;
          for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) { const n = this.cellAny(c.x + dx, c.y + dy); if (!n || n.g === 'water') continue; if (n.g === 'sand' || n.g === 'path' || n.g === 'pave') sand++; else grass++; }
          c.shore = this.type === 'cave' ? 'cave' : sand >= grass ? 'sand' : 'grass';
        }
      }
    }
  }
  // cell lookup across connections (one level)
  cellAny(x, y) {
    const c = this.cell(x, y); if (c) return c;
    for (const cn of this.conns) {
      const m = cn.map; const lx = x - cn.ox, ly = y - cn.oy;
      if (lx >= 0 && ly >= 0 && lx < m.w && ly < m.h) return m.cells[ly * m.w + lx];
    }
    return null;
  }
  resolve(x, y) {
    if (x >= 0 && y >= 0 && x < this.w && y < this.h) return { map: this, x, y };
    for (const cn of this.conns) { const m = cn.map, lx = x - cn.ox, ly = y - cn.oy; if (lx >= 0 && ly >= 0 && lx < m.w && ly < m.h) return { map: m, x: lx, y: ly, cn }; }
    return null;
  }
  border() { return this.def.border || (this.type === 'indoor' ? 'dark' : this.type === 'cave' ? 'cavewall' : this.theme === 'snow' ? 'pine' : this.theme === 'beach' ? 'water' : 'tree'); }
};

G.maps = {
  loaded: {},
  get(id) {
    if (this.loaded[id]) return this.loaded[id];
    const def = G.MAPDEFS[id]; if (!def) throw new Error('Unknown map ' + id);
    const m = new G.WorldMap(def); this.loaded[id] = m;
    // connections
    for (const dirk of ['n', 's', 'e', 'w']) {
      const cdef = def.conn && def.conn[dirk]; if (!cdef) continue;
      const nd = G.MAPDEFS[cdef.map]; if (!nd) continue;
      const nh = nd.grid.length, nw = Math.max(...nd.grid.map(r => r.length));
      const off = cdef.off || 0;
      const cn = { dir: dirk, id: cdef.map, ox: 0, oy: 0 };
      if (dirk === 'n') { cn.ox = off; cn.oy = -nh; } if (dirk === 's') { cn.ox = off; cn.oy = m.h; }
      if (dirk === 'e') { cn.ox = m.w; cn.oy = off; } if (dirk === 'w') { cn.ox = -nw; cn.oy = off; }
      m.conns.push(cn);
    }
    // resolve neighbour maps lazily (avoid infinite recursion)
    for (const cn of m.conns) { Object.defineProperty(cn, 'map', { get: () => this.loaded[cn.id] || this.getShallow(cn.id), configurable: true }); }
    m.computeMasks();
    return m;
  },
  getShallow(id) {
    // build a neighbour without resolving its own connections' masks first
    if (this.loaded[id]) return this.loaded[id];
    const m = this.get(id); return m;
  },
  reset() { this.loaded = {}; },
};

// --------------------------------------------------------- tile images ----
// Man-made and state-dependent ground tiles. Natural ground (grass, dirt,
// sand, water, snow, ash, cave floor) is baked pixel by pixel in terrain.js;
// these are painted on top of it. Tiles that depend on world position are not
// cached here because the terrain bake caches the finished chunk instead.
G.tileImg = function (map, c, frame) {
  const T = G.tiles, th = map.theme, X0 = c.x * 16, Y0 = c.y * 16;
  const fresh = (fn) => { const p = new G.Painter(16, 16); fn(p); return p.done(); };
  switch (c.g) {
    case 'cliff': case 'cavewall': case 'crystalwall': return T.cliffTile(map, c);
    case 'ledge': return T.ledgeTile(map, c, 'down');
    case 'ledgel': return T.ledgeTile(map, c, 'left');
    case 'ledger': return T.ledgeTile(map, c, 'right');
    case 'bridge': case 'bridgev': return T.bridgeTile(map, c);
    case 'wall': return T.wallTile(map, c);
    case 'wood': return fresh(p => T.woodFloor(p, X0, Y0, map.def.woodTone || 0));
    case 'tilefloor': return fresh(p => T.tileFloor(p, X0, Y0, map.def.floor || '#e4e8ec'));
    case 'carpet': return fresh(p => T.carpet(p, map, c, c.carpet || map.def.carpet || 'red'));
    case 'gymfloor': return fresh(p => T.gymFloor(p, X0, Y0, map.def.floor || '#8aa0b8'));
    case 'gymfloor2': return fresh(p => T.gymFloor(p, X0, Y0, map.def.floor2 || '#6a809a'));
    case 'pave': return fresh(p => T.tileFloor(p, X0, Y0, '#b8b4ac'));
    case 'metal': return fresh(p => { const M = G.ramp(['#4a525e', '#5e6874', '#76808c', '#8e98a4', '#a8b2bc', '#c8d0d8']); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const u = (X0 + x) % 16, v = (Y0 + y) % 16; p.set(x, y, M[u === 15 || v === 15 ? 0 : u === 0 || v === 0 ? 5 : (u - v + 32) % 6 === 0 ? 4 : 3]); } for (const [x, y] of [[2, 2], [13, 2], [2, 13], [13, 13]]) { p.set(x, y, M[5]); p.set(x + 1, y + 1, M[1]); } });
    case 'stairsup': return T.get('stairsup', 16, 16, p => { const W = G.ramp(['#4a2c18', '#6a4426', '#865a32', '#a0703e', '#b5844c', '#c8995e', '#dcb074']); for (let i = 0; i < 4; i++) for (let y = 0; y < 4; y++) for (let x = 0; x < 16; x++) p.set(x, i * 4 + y, W[y === 0 ? 6 : y === 3 ? 1 : 4 - (i > 1 ? 1 : 0)]); for (let y = 0; y < 16; y++) { p.set(0, y, W[0]); p.set(15, y, W[0]); p.set(1, y, W[5]); } });
    case 'stairsdown': return T.get('stairsdown', 16, 16, p => { const W = G.ramp(['#140c08', '#2a1c14', '#46301e', '#62442a', '#7e5a38', '#9a7248']); p.fill(W[0]); for (let i = 0; i < 4; i++) for (let y = 0; y < 3; y++) for (let x = 1; x < 15; x++) p.set(x, i * 4 + y, W[5 - i - (y === 2 ? 1 : 0)]); });
    case 'ladderup': return T.get('ladder', 16, 16, p => { const W = G.ramp(['#2a1a10', '#4a2e1a', '#6a4426', '#8a5c34', '#a87446']); for (let y = 0; y < 16; y++) { p.set(3, y, W[3]); p.set(4, y, W[2]); p.set(11, y, W[3]); p.set(12, y, W[2]); } for (let y = 2; y < 16; y += 4) { for (let x = 3; x < 13; x++) { p.set(x, y, W[4]); p.set(x, y + 1, W[1]); } } p.outline(null, { k: .4 }); });
    case 'hole': return T.get('hole', 16, 16, p => { const K = G.ramp(['#050404', '#0e0a08', '#1c1410', '#3a2c22']); p.ell(8, 8.5, 6.8, 5.8, K[3]); p.ell(8, 8.8, 6, 5, K[1]); p.ell(8, 9.4, 4.6, 3.8, K[0]); for (let x = 3; x < 13; x++) if (p.A(x, 3)) p.set(x, 3, K[3]); });
    case 'mat': return T.get('mat|' + (map.def.matCol || '') + '|' + map.type, 16, 16, p => { if (map.type === 'indoor') T.woodFloor(p, 0, 0, map.def.woodTone || 0); const Rm = G.rampFrom(map.def.matCol || '#b83a3a', 6, { lo: .3, hi: .2 }); for (let y = 2; y < 14; y++) for (let x = 1; x < 15; x++) p.set(x, y, Rm[(y === 2 || y === 13 || x === 1 || x === 14) ? 1 : (y === 4 || y === 11) && x > 2 && x < 13 ? 5 : 3]); for (let x = 2; x < 14; x += 2) { p.set(x, 14, Rm[4]); p.set(x, 1, Rm[4]); } });
    case 'crystalfloor': return T.get('crysf|' + (c.v % 4), 16, 16, p => { if (c.v % 2) return; const Cc = G.ramp(['#3a9ac0', '#8ae0ff', '#ffffff']); const x = 3 + (c.v * 5) % 9, y = 4 + (c.v * 3) % 8; p.set(x, y, Cc[1]); p.set(x + 1, y, Cc[0]); p.set(x, y - 1, Cc[2]); p.set(x + 5, y + 4, Cc[1]); });
    case 'dark': return T.get('dark', 16, 16, p => p.fill(G.rgb('#06060c')));
    case 'lava': return T.get(`lava|${frame % 4}|${c.v}`, 16, 16, p => { const Lr = G.ramp(['#6a1408', '#a8240c', '#d84a14', '#f47a1c', '#ffae3a', '#ffe070', '#fff8c0']); for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const n = G.fbm((X0 + x) / 9 + frame * .08, (Y0 + y) / 9 - frame * .05, 8, 2); const cr = G.vnoise((X0 + x) / 4, (Y0 + y) / 4, 9); p.set(x, y, Lr[cr > .72 ? 1 : G.clamp(Math.floor(n * 7), 2, 6)]); } });
    case 'switch': { const on = G.flag(c.sw); return T.get(`sw|${on ? 1 : 0}|${map.def.floor || ''}`, 16, 16, p => { T.gymFloor(p, 0, 0, map.def.floor || '#8aa0b8'); p.circ(8, 8, 6, G.rgb('#20242e')); p.circ(8, 8, 4.6, G.rgb(on ? '#6aff9a' : '#ffd84a')); p.circ(7, 7, 1.6, G.rgb('#ffffff')); }); }
    default: return null;
  }
};
// live ground overlays drawn every frame on top of the baked terrain
G.liveTile = function (map, c, frame) {
  const T = G.tiles, th = map.theme;
  switch (c.g) {
    case 'tall': return { img: T.get(`tg|${frame % 4}|${th}`, 16, 20, p => T.tallgrass(p, frame % 4, th, 0, false)), oy: -4 };
    case 'flowers': return { img: T.get(`fl|${c.v}|${frame % 2}`, 16, 16, p => T.flowerSprite(p, c.v, th, frame % 2)), oy: 0 };
    case 'lava': case 'switch': return { img: G.tileImg(map, c, frame), oy: 0 };
    default: return null;
  }
};
// world props: {img, ox, oy} places the sprite relative to the tile's top-left
const TREE_DEEP = [.62, .74, .8], TREE_MID = [.8, .88, .9];
// generated sprites stand on their tile: centred, feet 2px into the tile
const atlasObj = (key, extra = {}, tint) => { const im = G.tiles.atlas(key, 0, tint); return im ? { img: im, ox: Math.round(8 - im.width / 2), oy: 18 - im.height, base: 3, aoW: 7, ...extra } : null; };
// A fountain can span several cells (a plaza's centrepiece): the connected block of fountain cells is one
// fountain, drawn once from its bottom-left cell (2D) or centred on the block (3D). Cached per map.
G.fountainOf = function (map, x, y) {
  const F = map._fnt || (map._fnt = {}), k = x + ',' + y;
  if (F[k]) return F[k];
  const seen = new Set([k]), q = [[x, y]]; let x0 = x, x1 = x, y0 = y, y1 = y;
  while (q.length) { const [cx, cy] = q.pop(); x0 = Math.min(x0, cx); x1 = Math.max(x1, cx); y0 = Math.min(y0, cy); y1 = Math.max(y1, cy);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nk = (cx + dx) + ',' + (cy + dy), n = map.cell(cx + dx, cy + dy); if (!seen.has(nk) && n && n.o === 'fountain') { seen.add(nk); q.push([cx + dx, cy + dy]); } } }
  const comp = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  for (const kk of seen) F[kk] = comp;
  return comp;
};
G.objImg = function (map, c, frame) {
  const T = G.tiles, th = map.theme;
  const A = G.tiles.atlas && G.WORLD_ATLAS;
  if (A) {
    let r = null;
    const snow = th === 'snow';
    switch (c.o) {
      case 'tree': {
        if (snow) { r = atlasObj('pine_snow'); break; }
        // woods: broadleaf and conifer, in three depths of shade so a tree wall reads as layered canopy
        const hh = G.h2(c.x | 0, c.y | 0, 77), shade = G.h2(c.x | 0, c.y | 0, 91);
        const tint = shade < .4 ? TREE_DEEP : shade < .75 ? TREE_MID : null;
        if ((!th || th === 'grass') && hh < .3) r = atlasObj(c.v % 2 ? 'pine2' : 'pine', {}, tint);
        else r = atlasObj(hh > .93 ? 'tree_fruit' : 'tree', {}, tint);
        break;
      }
      case 'pine': r = atlasObj(snow ? 'pine_snow' : c.v % 2 ? 'pine2' : 'pine'); break;
      case 'palm': r = atlasObj('palm'); break;
      case 'deadtree': r = atlasObj('deadtree'); break;
      case 'smalltree': r = atlasObj('smalltree', { base: 2, aoW: 5 }); break;
      case 'rock': r = atlasObj('rock', { base: 2 }); break;
      case 'crackrock': r = atlasObj('crackrock', { base: 2 }); break;
      case 'boulder': r = atlasObj('boulder', { base: 2 }); break;
      case 'lamp': r = atlasObj('lamp', { base: 2, aoW: 4 }); break;
      case 'sign': r = atlasObj('sign', { base: 1, aoW: 4 }); break;
      case 'mailbox': r = atlasObj('mailbox', { base: 1, aoW: 3 }); break;
      case 'bench': r = atlasObj('bench', { base: 1, aoW: 6 }); break;
    }
    if (r) return r;
  }
  switch (c.o) {
    case 'tree':
      // woods mix broadleaf and conifer, like the DS routes
      if ((!th || th === 'grass') && G.h2(c.x | 0, c.y | 0, 77) < .3) return { img: T.pineTree(c.v % 2, th), ox: -7, oy: -32, base: 3, aoW: 6 };
      return { img: T.broadTree(c.v % 3, th === 'snow' ? 'snow' : th), ox: -8, oy: -28, base: 3, aoW: 7 };
    case 'pine': return { img: T.pineTree(c.v % 2, th), ox: -7, oy: -32, base: 3, aoW: 6 };
    case 'palm': return { img: T.palmTree(th), ox: -8, oy: -30, base: 3, aoW: 5 };
    case 'deadtree': return { img: T.deadTree(c.v % 2), ox: -6, oy: -24, base: 2, aoW: 5 };
    case 'smalltree': return { img: T.smallTree(th), ox: -1, oy: -6, base: 2, aoW: 5 };
    case 'rock': return { img: T.rockSprite('rock', th), ox: -1, oy: -2, base: 2, aoW: 7 };
    case 'crackrock': return { img: T.rockSprite('crack', th), ox: -1, oy: -2, base: 2, aoW: 7 };
    case 'boulder': return { img: T.rockSprite('boulder', th), ox: -1, oy: -2, base: 2, aoW: 7 };
    case 'fence': return { img: T.fenceSprite(c.mask || 0, th), ox: 0, oy: -6, base: 1, ao: false };
    case 'lamp': return { img: T.lampSprite(th), ox: 0, oy: -24, base: 2, aoW: 4 };
    case 'lanternpost': return { img: T.lanternPost(), ox: 0, oy: -6, base: 1, aoW: 4 };
    case 'crystal': return { img: T.crystalSprite(c.v), ox: -1, oy: -4, base: 2, aoW: 6 };
    case 'table': {
      const n = (dx, dy) => { const q = map.cell(c.x + dx, c.y + dy); return q && q.o === 'table'; };
      const m = (n(0, -1) ? 1 : 0) | (n(1, 0) ? 2 : 0) | (n(0, 1) ? 4 : 0) | (n(-1, 0) ? 8 : 0);
      return { img: T.tableJoin(m), ox: 0, oy: 0, ao: false };
    }
    case 'bed': {   // vertical pairs of bed tiles render as one long bed
      const up = map.cell(c.x, c.y - 1), dn = map.cell(c.x, c.y + 1);
      const kind = up && up.o === 'bed' ? 'bed_bot' : dn && dn.o === 'bed' ? 'bed_top' : 'bed';
      return { ...T.furniture(kind, 0), ao: false };
    }
    case 'barrier': case 'barrier2': { const col = c.o === 'barrier' ? '#ffe070' : '#8ae8ff'; return { img: T.get(`bar|${c.o}|${frame % 2}`, 16, 16, p => { const K = G.rgb('#3a3e4a'), L = G.rgb(col); p.rect(1, 2, 2, 13, K); p.rect(13, 2, 2, 13, K); for (let y = 4; y < 14; y += 3) for (let x = 3; x < 13; x++) p.set(x, y + ((x + frame) % 2), L); p.rect(0, 1, 4, 2, K); p.rect(12, 1, 4, 2, K); }), ox: 0, oy: 0, ao: false }; }
    case 'rug': return { img: T.furniture('rug', 0).img, ox: 0, oy: 0, flat: true };
    case 'counter': case 'pc': case 'shelf': case 'tv': case 'plant': case 'healer': case 'machine': case 'desk': case 'statue':
    case 'dresser': case 'sidetable': case 'armchair': case 'fridge': case 'stove': case 'sink': case 'boxes': case 'floorlamp': case 'vending': case 'display': case 'whiteboard': case 'plant2':
      return { ...T.furniture(c.o, ['pc', 'tv', 'healer', 'machine', 'vending'].includes(c.o) ? frame % 2 : 0), ao: !['counter', 'shelf', 'fridge', 'stove', 'sink', 'dresser'].includes(c.o) };
    case 'orbball': return { img: G.orbArt('orb', 14), ox: 1, oy: 1, aoW: 5 };
    case 'fountain': {
      const F = G.fountainOf(map, c.x | 0, c.y | 0);
      if (F.w === 1 && F.h === 1) return { ...T.prop('fountain', frame % 2), aoW: 6 };
      if ((c.x | 0) !== F.x0 || (c.y | 0) !== F.y0 + F.h - 1) return null;   // drawn once, from the bottom-left cell
      const img = T.fountainBig(F.w, F.h, frame % 2);
      return { img, ox: 0, oy: 16 - img.height, aoW: F.w * 8 };
    }
    default: return { ...T.prop(c.o, ['cauldron'].includes(c.o) ? frame % 2 : 0), aoW: 6 };
  }
};
// share of each footprint cell covered by the building's generated sprite (null for code-drawn art)
G._bldCov = {};
G.bldAlign = b => b.door !== undefined ? Math.round((b.door + .5) * 16 - b.w * 8) : 0;
G.bldCoverage = function (b) {
  if (typeof document === 'undefined' || !G.tiles || !G.tiles.building) return null;
  const bi = G.tiles.building(b.kind, b.w, b.h, { roof: b.roof, door: b.door, accent: b.accent, label: b.label });
  if (!bi.atlas) return null;
  const key = [b.kind, b.w, b.h, b.roof, b.door].join('|');
  if (G._bldCov[key]) return G._bldCov[key];
  const im = bi.img, W = b.w * 16, H = b.h * 16, sx = G.bldAlign(b);
  let d; try { d = im.getContext('2d').getImageData(0, im.height - H, im.width, H).data; } catch (e) { return null; }
  const cov = new Float32Array(b.w * b.h);
  for (let cy = 0; cy < b.h; cy++) for (let cx = 0; cx < b.w; cx++) {
    let n = 0, t = 0;
    for (let y = cy * 16; y < cy * 16 + 16; y += 2) for (let x = cx * 16; x < cx * 16 + 16; x += 2) { const ix = x - sx; t++; if (ix >= 0 && ix < im.width && d[(y * im.width + ix) * 4 + 3] > 100) n++; }
    cov[cy * b.w + cx] = n / t;
  }
  return (G._bldCov[key] = cov);
};
G.borderCell = function (map, x, y) {
  // per-side fill (def.borders = { n: 'water' }) so a harbour opens onto the sea, else the map's default
  const bs = map.def.borders, side = y < 0 ? 'n' : y >= map.h ? 's' : x < 0 ? 'w' : 'e';
  const b = (bs && bs[side]) || map.border();
  if (b === 'tree' || b === 'pine' || b === 'palm') return { g: map.ground === 'snow' ? 'snow' : 'grass', o: b, v: (x * 7 + y * 13) & 3, mask: 0, solid: true, x, y };
  if (b === 'water') return { g: 'water', mask: 255, shore: 'sand', v: 0, solid: true, water: true, x, y };
  return { g: b, mask: 255, v: 0, solid: true, x, y };
};
