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
    this.objs = (def.objs || []).map(o => ({ ...o }));
    this.buildings = this.objs.filter(o => o.type === 'building');
    this.warps = (def.warps || []).map(w => ({ ...w }));
    for (const b of this.buildings) {
      for (let yy = b.y; yy < b.y + b.h; yy++) for (let xx = b.x; xx < b.x + b.w; xx++) { const c = this.cell(xx, yy); if (c) { c.solid = true; c.bld = b; } }
      const dx = b.x + (b.door !== undefined ? b.door : Math.floor(b.w / 2)), dy = b.y + b.h - 1;
      if (b.to) { const c = this.cell(dx, dy); if (c) { c.solid = false; c.door = true; } this.warps.push({ x: dx, y: dy, to: b.to, tx: b.tx, ty: b.ty, dir: 'up', kind: 'door', cond: b.cond, locked: b.locked }); }
      else { const c = this.cell(dx, dy); if (c) c.lockedDoor = b.lockMsg || 'The door is locked.'; }
    }
    this.conns = [];
    this.computeMasks();
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
G.tileImg = function (map, c, frame) {
  const T = G.tiles, th = map.theme;
  switch (c.g) {
    case 'grass': return T.get(`g|${c.v}|${th}`, 16, 16, p => T.grass(p, c.v, th));
    case 'flowers': return T.get(`fl|${c.v}|${frame % 2}|${th}`, 16, 16, p => T.flowers(p, c.v, th, frame % 2));
    case 'tall': return T.get(`tg|${frame % 4}|${th}|${c.mask & 1}`, 16, 16, p => T.tallgrass(p, frame % 4, th, c.mask));
    case 'path': return T.get(`pa|${c.mask}|${th}|${c.v}`, 16, 16, p => T.path(p, c.mask, th, 'path', c.v * 16, c.v * 7));
    case 'sand': return T.get(`sa|${c.mask}|${c.v}`, 16, 16, p => T.path(p, c.mask, th, 'sand', c.v * 16, 0));
    case 'pave': return T.get(`pv|${c.v % 2}`, 16, 16, p => T.path(p, 255, th, 'pave', c.v * 8, 0));
    case 'water': return T.get(`wa|${c.mask}|${frame % 4}|${c.shore}|${th}`, 16, 16, p => T.water(p, c.mask, frame % 4, th, c.shore));
    case 'hedge': return T.get(`he|${c.mask}|${th}`, 16, 16, p => { T.grass(p, 0, th); T.hedge(p, c.mask, th); });
    case 'ledge': return T.get(`le|${c.v}|${th}|${map.type}`, 16, 16, p => { if (map.type === 'cave') { T.simple(p, 'cave', c.v, 0, th); const cc = [G.col.parse('#66523f'), G.col.parse('#523f30'), G.col.parse('#9a8068')]; p.rect(0, 10, 16, 6, cc[0]); p.rect(0, 10, 16, 1, cc[2]); p.rect(0, 15, 16, 1, cc[1]); } else T.ledge(p, c.v, th, 'down'); });
    case 'ledgel': return T.get(`lel|${c.v}|${th}`, 16, 16, p => T.ledge(p, c.v, th, 'left'));
    case 'ledger': return T.get(`ler|${c.v}|${th}`, 16, 16, p => T.ledge(p, c.v, th, 'right'));
    case 'cliff': return T.get(`cl|${c.mask}|${th}`, 16, 16, p => T.cliff(p, c.mask, th, 'cliff'));
    case 'cavewall': return T.get(`cw|${c.mask}`, 16, 16, p => T.cliff(p, c.mask, th, 'cave'));
    case 'crystalwall': return T.get(`crw|${c.mask}`, 16, 16, p => T.cliff(p, c.mask, th, 'crystal'));
    case 'wall': return T.get(`wl|${c.wv}|${c.wstyle || map.def.wall || 'cream'}`, 16, 16, p => T.wall(p, c.wv, c.wstyle || map.def.wall || 'cream'));
    case 'gymfloor': return T.get(`gf|${map.def.floor || '#8aa0b8'}`, 16, 16, p => T.simple(p, 'gymfloor', 0, 0, map.def.floor || '#8aa0b8'));
    case 'gymfloor2': return T.get(`gf|${map.def.floor2 || '#6a809a'}`, 16, 16, p => T.simple(p, 'gymfloor', 0, 0, map.def.floor2 || '#6a809a'));
    case 'carpet': return T.get(`cp|${map.def.carpet || 'red'}`, 16, 16, p => T.simple(p, 'carpet', 0, 0, map.def.carpet || 'red'));
    case 'stairsup': case 'stairsdown': return T.get(c.g, 16, 16, p => T.furniture(p, c.g, 0));
    case 'ladderup': return T.get('ladder', 16, 16, p => { T.simple(p, 'cave', 0, 0, th); const w = G.col.parse('#8a5a34'), d = G.col.parse('#5a3a20'); p.rect(3, 0, 2, 16, w); p.rect(11, 0, 2, 16, w); for (let y = 2; y < 16; y += 4) p.rect(3, y, 10, 2, y % 8 ? w : d); });
    case 'hole': return T.get('hole', 16, 16, p => { T.simple(p, 'cave', 0, 0, th); p.ell(8, 8.5, 6.5, 5.5, G.col.parse('#1a1210')); p.ell(8, 7.5, 5.5, 4, G.col.parse('#0a0808')); });
    case 'mat': return T.get('mat|' + (map.def.matCol || ''), 16, 16, p => T.simple(p, 'mat', 0, 0, th));
    case 'lava': return T.get(`lv|${frame % 4}|${c.v}`, 16, 16, p => T.simple(p, 'lava', c.v, frame % 4, th, c.x * 3, c.y * 3));
    case 'switch': { const on = G.flag(c.sw); return T.get(`sw|${on ? 1 : 0}|${map.def.floor || ''}`, 16, 16, p => { T.simple(p, 'gymfloor', 0, 0, map.def.floor || '#8aa0b8'); p.circ(8, 8, 6, G.col.parse('#2a2e38')); p.circ(8, 8, 4.6, G.col.parse(on ? '#6aff9a' : '#ffd84a')); p.circ(7, 7, 1.6, G.col.parse('#ffffff')); }); }
    case 'none': return null;
    default: return T.get(`s|${c.g}|${c.v}|${th}`, 16, 16, p => T.simple(p, c.g, c.v, 0, th, c.v * 16, c.v * 5));
  }
};
G.objImg = function (map, c, frame) {
  const T = G.tiles, th = map.theme;
  switch (c.o) {
    case 'tree': return { img: T.get(`tr|${c.v % 2}|${th}`, 16, 32, p => T.tree(p, c.v % 2, th, 'broad')), oy: -16 };
    case 'pine': return { img: T.get(`pi|${th}`, 16, 32, p => T.tree(p, 0, th === 'snow' ? 'snow' : th, 'pine')), oy: -16 };
    case 'palm': return { img: T.get(`pm|${th}`, 16, 32, p => T.tree(p, 0, 'beach', 'palm')), oy: -16 };
    case 'deadtree': return { img: T.get(`dt|${th}`, 16, 32, p => T.tree(p, 0, 'ash', 'dead')), oy: -16 };
    case 'smalltree': return { img: T.get(`st|${th}`, 16, 16, p => T.smallTree(p, th)), oy: 0 };
    case 'rock': return { img: T.get(`rk|${th}`, 16, 16, p => T.rock(p, 'rock', th)), oy: 0 };
    case 'crackrock': return { img: T.get(`rc|${th}`, 16, 16, p => T.rock(p, 'crack', th)), oy: 0 };
    case 'boulder': return { img: T.get(`bo|${th}`, 16, 16, p => T.rock(p, 'boulder', th)), oy: 0 };
    case 'fence': return { img: T.get(`fe|${c.mask || 0}|${th}`, 16, 16, p => T.fence(p, c.mask || 0, th)), oy: 0 };
    case 'table': {
      const n = (dx, dy) => { const q = map.cell(c.x + dx, c.y + dy); return q && q.o === 'table'; };
      const m = (n(0, -1) ? 1 : 0) | (n(1, 0) ? 2 : 0) | (n(0, 1) ? 4 : 0) | (n(-1, 0) ? 8 : 0);
      return { img: T.get(`tbl|${m}`, 16, 16, p => T.tableJoin(p, m)), oy: 0 };
    }
    case 'bed': { // vertical pairs of bed tiles render as one long bed
      const up = map.cell(c.x, c.y - 1), dn = map.cell(c.x, c.y + 1);
      const kind = up && up.o === 'bed' ? 'bed_bot' : dn && dn.o === 'bed' ? 'bed_top' : 'bed';
      return { img: T.get(`fu|${kind}`, 16, 16, p => T.furniture(p, kind, 0)), oy: 0 };
    }
    case 'lamp': return { img: T.get(`la|${th}`, 16, 32, p => T.lamp(p, th)), oy: -16 };
    case 'crystal': return { img: T.get(`cr|${c.v % 2}`, 16, 16, p => T.crystal(p, c.v)), oy: 0 };
    case 'barrier': case 'barrier2': { const col = c.o === 'barrier' ? '#ffe070' : '#8ae8ff'; return { img: T.get(`bar|${c.o}|${frame % 2}`, 16, 16, p => { const K = G.col.parse('#3a3e4a'), L = G.col.parse(col); p.rect(1, 2, 2, 13, K); p.rect(13, 2, 2, 13, K); for (let y = 4; y < 14; y += 3) for (let x = 3; x < 13; x++) p.set(x, y + ((x + frame) % 2), L); p.rect(0, 1, 4, 2, K); p.rect(12, 1, 4, 2, K); }), oy: 0 }; }
    default: return { img: T.get(`fu|${c.o}|${['pc', 'tv', 'healer', 'machine', 'fountain', 'cauldron'].includes(c.o) ? frame % 2 : 0}`, 16, 16, p => T.furniture(p, c.o, frame % 2)), oy: 0, flat: c.o === 'rug' };
  }
};
G.borderCell = function (map, x, y) {
  const b = map.border();
  if (b === 'tree' || b === 'pine' || b === 'palm') return { g: map.ground === 'snow' ? 'snow' : 'grass', o: b, v: (x * 7 + y * 13) & 3, mask: 0, solid: true, x, y };
  if (b === 'water') return { g: 'water', mask: 255, shore: 'sand', v: 0, solid: true, water: true, x, y };
  return { g: b, mask: 255, v: 0, solid: true, x, y };
};
