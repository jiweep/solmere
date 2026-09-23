// Validate every map: geometry, connections, warps, objects, references, reachability.
const { load } = require('./harness');
const FILES = ['js/engine/core.js', 'js/engine/input.js', 'js/engine/gfx.js', 'js/engine/audio.js', 'js/data/types.js', 'js/data/moves.js', 'js/data/abilities.js', 'js/data/items.js', 'js/data/species.js',
  'js/art/tiles.js', 'js/art/charart.js', 'js/art/monart.js', 'js/art/monart_species1.js', 'js/art/monart_species2.js', 'js/art/monart_species3.js',
  'js/battle/mon.js', 'js/battle/engine.js', 'js/battle/ai.js', 'js/ui/dialog.js', 'js/world/state.js', 'js/world/world.js', 'js/world/overworld.js', 'js/world/script.js',
  'js/battle/scene.js', 'js/battle/anims.js', 'js/battle/ui.js', 'js/battle/flow.js', 'js/ui/party.js', 'js/ui/bag.js', 'js/ui/menus.js', 'js/ui/pcshopdex.js', 'js/ui/title.js',
  'js/story/common.js', 'js/story/builder.js', 'js/story/trainers.js', 'js/story/maps_south.js', 'js/story/maps_north.js', 'js/story/maps_east.js', 'js/story/maps_league.js', 'js/story/scripts.js', 'js/net/net.js', 'js/engine/game.js'];
const G = load(FILES);
G.save = G.newSave({}); G.save.flags = {};
G.defineRivals();
let errors = 0, warns = 0;
const err = (m) => { errors++; console.log('ERROR', m); };
const warn = (m) => { warns++; console.log('warn ', m); };
const maps = Object.keys(G.MAPDEFS);
const W = id => G.maps.get(id);
for (const id of maps) {
  const def = G.MAPDEFS[id];
  const widths = new Set(def.grid.map(r => r.length));
  if (widths.size > 1) err(`${id}: uneven row widths ${[...widths]}`);
  let m; try { m = W(id); } catch (e) { err(`${id}: failed to build: ${e.message}`); continue; }
  const passable = (x, y) => { const c = m.cell(x, y); return c && !c.solid && !c.water; };
  // connections
  for (const [dir, c] of Object.entries(def.conn || {})) {
    const nd = G.MAPDEFS[c.map]; if (!nd) { err(`${id}: conn ${dir} -> missing ${c.map}`); continue; }
    const back = { n: 's', s: 'n', e: 'w', w: 'e' }[dir];
    const rc = nd.conn && nd.conn[back];
    if (!rc || rc.map !== id) err(`${id}: conn ${dir}->${c.map} has no reciprocal ${back}`);
    else if ((rc.off || 0) !== -(c.off || 0)) err(`${id}: conn ${dir}->${c.map} offset ${c.off} vs reciprocal ${rc.off}`);
    // walkable crossings
    const nm = W(c.map); let cross = 0;
    const cn = m.conns.find(q => q.dir === dir);
    const len = dir === 'n' || dir === 's' ? m.w : m.h;
    for (let k = 0; k < len; k++) {
      let a, b;
      if (dir === 'n') { a = m.cell(k, 0); b = m.cellAny(k, -1); }
      if (dir === 's') { a = m.cell(k, m.h - 1); b = m.cellAny(k, m.h); }
      if (dir === 'w') { a = m.cell(0, k); b = m.cellAny(-1, k); }
      if (dir === 'e') { a = m.cell(m.w - 1, k); b = m.cellAny(m.w, k); }
      if (a && b && ((!a.solid && !b.solid) || (a.water && b.water))) cross++;
    }
    if (!cross) err(`${id}: conn ${dir}->${c.map} has NO walkable crossing`);
  }
  // warps
  for (const w of m.warps) {
    if (!m.cell(w.x, w.y)) err(`${id}: warp at ${w.x},${w.y} out of bounds`);
    if (w.to === '_back') continue;
    const td = G.MAPDEFS[w.to]; if (!td) { err(`${id}: warp -> missing map ${w.to}`); continue; }
    const tm = W(w.to); const tc = tm.cell(w.tx, w.ty);
    if (!tc) err(`${id}: warp -> ${w.to} ${w.tx},${w.ty} out of bounds`);
    else if (tc.solid && !tc.door) err(`${id}: warp -> ${w.to} ${w.tx},${w.ty} lands on solid '${tc.ch}'`);
  }
  // buildings: tile below door
  for (const b of m.buildings) {
    const dx = b.x + (b.door !== undefined ? b.door : Math.floor(b.w / 2)), dy = b.y + b.h;
    const c = m.cell(dx, dy); if (b.to && (!c || c.solid)) err(`${id}: building ${b.kind}@${b.x},${b.y} door exit ${dx},${dy} blocked (${c ? c.ch : 'oob'})`);
    if (b.to && !G.MAPDEFS[b.to]) err(`${id}: building -> missing map ${b.to}`);
    for (let yy = b.y; yy < b.y + b.h; yy++) for (let xx = b.x; xx < b.x + b.w; xx++) { const cc = m.cell(xx, yy); if (!cc) err(`${id}: building ${b.kind} out of bounds`); else if (['T', 'P', 'X', '#', '~'].includes(cc.ch)) warn(`${id}: building ${b.kind}@${b.x},${b.y} over '${cc.ch}' at ${xx},${yy}`); }
  }
  // objects
  for (const o of def.objs || []) {
    if (o.type === 'building') continue;
    const c = m.cell(o.x, o.y);
    if (!c) { err(`${id}: ${o.type} ${o.id || ''} out of bounds ${o.x},${o.y}`); continue; }
    if ((o.type === 'npc' || o.type === 'trainer') && c.solid && !c.counter) warn(`${id}: ${o.type} ${o.id} on solid '${c.ch}' at ${o.x},${o.y}`);
    if (o.type === 'trainer' && !G.TRAINERS[o.trainer]) err(`${id}: trainer ${o.trainer} missing`);
    if (o.script && !G.SCRIPTS[o.script]) err(`${id}: script ${o.script} missing`);
    if (o.type === 'item' && !G.ITEMS[o.item]) err(`${id}: item ${o.item} missing`);
    if (o.look && typeof o.look === 'string' && !G.LOOKS[o.look]) err(`${id}: look ${o.look} missing`);
    if (o.monSprite && !G.SPECIES[o.monSprite]) err(`${id}: monSprite ${o.monSprite} missing`);
    if (o.type === 'item' && c.solid && !o.hidden) warn(`${id}: item ${o.id} on solid tile`);
    if (o.type === 'trainer' && o.sight) {
      const [dx, dy] = G.DIRS[o.dir]; let seen = 0;
      for (let k = 1; k <= o.sight; k++) { const cc = m.cell(o.x + dx * k, o.y + dy * k); if (!cc || cc.solid) break; seen++; }
      if (!seen) warn(`${id}: trainer ${o.id} sight blocked immediately`);
    }
  }
  for (const k of ['onEnter']) if (def[k] && !G.SCRIPTS[def[k]]) err(`${id}: ${k} script ${def[k]} missing`);
  // encounters
  for (const [k, T] of Object.entries(def.enc || {})) for (const [sp] of T.list || []) if (!G.SPECIES[sp]) err(`${id}: enc ${k} species ${sp} missing`);
  // spawn
  if (def.spawn && !passable(def.spawn[0], def.spawn[1])) err(`${id}: spawn ${def.spawn} not passable`);
  // reachability with all field abilities (surf/cut/smash) from spawn (or first warp target)
  const start = def.spawn || (m.warps[0] && [m.warps[0].x, m.warps[0].y]);
  if (start) {
    const seen = new Set([start.join(',')]); const q = [start];
    const ok = (x, y, fx, fy) => {
      const c = m.cell(x, y); if (!c) return false;
      if (c.ledge) return false;
      if (c.solid && !(c.cut || c.smash || c.push || c.solidIf)) return false;
      return true;
    };
    while (q.length) {
      const [x, y] = q.shift();
      for (const [dx, dy, d] of [[0, 1, 'down'], [0, -1, 'up'], [1, 0, 'right'], [-1, 0, 'left']]) {
        let nx = x + dx, ny = y + dy; const c = m.cell(nx, ny);
        if (c && c.ledge && c.ledge === d) { nx += dx; ny += dy; }
        else if (!ok(nx, ny)) continue;
        const k = nx + ',' + ny; if (seen.has(k) || !m.cell(nx, ny)) continue;
        seen.add(k); q.push([nx, ny]);
      }
    }
    for (const w of m.warps) if (!seen.has(w.x + ',' + w.y)) warn(`${id}: warp at ${w.x},${w.y} -> ${w.to} unreachable from spawn`);
    for (const o of def.objs || []) {
      if (o.type === 'trigger') { let any = false; for (let yy = o.y; yy < o.y + (o.h || 1); yy++) for (let xx = o.x; xx < o.x + (o.w || 1); xx++) if (seen.has(xx + ',' + yy)) any = true; if (!any) warn(`${id}: trigger ${o.script} unreachable`); }
      if (o.type === 'npc' || o.type === 'trainer' || o.type === 'item' || o.type === 'sign') {
        const adj = [[0, 1], [0, -1], [1, 0], [-1, 0], [0, 2], [0, -2], [2, 0], [-2, 0]].some(([dx, dy]) => seen.has((o.x + dx) + ',' + (o.y + dy)));
        if (!adj && !seen.has(o.x + ',' + o.y)) warn(`${id}: ${o.type} ${o.id || o.script || ''} at ${o.x},${o.y} unreachable`);
      }
    }
  }
}
// scripts referenced from story that must exist
for (const t of Object.values(G.TRAINERS)) for (const p of t.party) if (!G.SPECIES[p.sp]) err(`trainer ${t.name} species ${p.sp} missing`); else for (const mv of p.moves || []) if (!G.MOVES[mv]) err(`trainer ${t.name} move ${mv} missing`);
for (const c of G.CHAPTERS) { if (!G.MAPDEFS[c.map]) err(`chapter ${c.name} map missing`); for (const [sp] of c.party || []) if (!G.SPECIES[sp]) err(`chapter species ${sp}`); for (const i of c.items || []) if (!G.ITEMS[i]) err(`chapter item ${i}`); }
for (const t of G.TOWNS) if (t.fly) { const m = W(t.map); const c = m.cell(t.fx, t.fy); if (!c || c.solid) err(`town ${t.id} fly point blocked`); }
console.log(`\n${maps.length} maps checked: ${errors} errors, ${warns} warnings`);
process.exit(errors ? 1 : 0);
