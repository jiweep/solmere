// Every door, stair and item ball must be reachable from somewhere you can enter the map. Optimistic about
// progress (water, cut trees, cracked rocks, switch gates and boulder holes all open eventually) and strict about things that
// never move: people, signs and props with no condition are solid, ledges only go one way.
// Wind currents carry you the way they blow. (It found the Frostpeak gym walled off by its own sign.)
// Run: node server.js & NODE_PATH=/opt/node22/lib/node_modules node tests/doors_reachable.js
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const pg = await br.newPage();
  await pg.goto('http://localhost:8080/?mute'); await pg.waitForFunction(() => window.G && G.MAPDEFS && G.scenes.length);
  const r = await pg.evaluate(() => {
    G.save = G.repairSave(G.newSave({ name: 'A', look: 'player_a' }));
    const ids = Object.keys(G.MAPDEFS), maps = {}; for (const id of ids) maps[id] = G.maps.get(id);
    // where you can arrive on each map
    const starts = {}; const add = (id, x, y) => (starts[id] = starts[id] || []).push([x, y]);
    for (const id of ids) {
      const m = maps[id];
      if (m.def.spawn) add(id, m.def.spawn[0], m.def.spawn[1]);
      for (const w of m.warps) if (w.to && w.to !== '_back' && maps[w.to]) add(w.to, w.tx, w.ty);
      for (const cn of m.conns) { const nm = maps[cn.id]; if (!nm) continue;   // seam tiles: along the shared edge
        for (let i = 0; i < Math.max(m.w, m.h); i++) { const x = cn.dir === 'e' ? m.w - 1 : cn.dir === 'w' ? 0 : i, y = cn.dir === 's' ? m.h - 1 : cn.dir === 'n' ? 0 : i; const c = m.cell(x, y); if (c && !c.solid) add(id, x, y); } }
    }
    const out = [];
    for (const id of ids) {
      const m = maps[id], S = starts[id] || [];
      if (!S.length) continue;
      const STEPS_ASIDE = new Set(['league_guard', 'elite_battle']);   // these step out of the doorway by script (and again after a reload)
      const block = new Set(m.objs.filter(o => o.x != null && !o.cond && !STEPS_ASIDE.has(o.script) && (o.type === 'npc' || o.type === 'sign' || o.type === 'trainer')).map(o => o.x + ',' + o.y));
      const pass = (x, y) => { const c = m.cell(x, y); if (!c || block.has(x + ',' + y)) return false; if (c.solid) return !!(c.cut || c.smash || c.solidIf || c.push); return true; };
      const seen = new Set(), q = [];
      for (const [x, y] of S) if (m.cell(x, y) && !seen.has(x + ',' + y)) { seen.add(x + ',' + y); q.push([x, y]); }
      while (q.length) {
        const [x, y] = q.shift();
        for (const [dx, dy, d] of [[1, 0, 'right'], [-1, 0, 'left'], [0, 1, 'down'], [0, -1, 'up']]) {
          let nx = x + dx, ny = y + dy; const c = m.cell(nx, ny); if (!c) continue;
          if (c.ledge) { if (c.ledge !== d) continue; nx += dx; ny += dy; if (!pass(nx, ny)) continue; }
          else if (!pass(nx, ny)) continue;
          // a wind current (Skyreach Gym) carries you on until you land somewhere still or hit something
          for (let n = 0, g; (g = m.cell(nx, ny)) && g.wind && n < 64; n++) { const [wx, wy] = G.DIRS[g.wind]; if (!pass(nx + wx, ny + wy)) break; nx += wx; ny += wy; }
          const k = nx + ',' + ny; if (seen.has(k)) continue; seen.add(k); q.push([nx, ny]);
        }
      }
      const near = (x, y) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => seen.has((x + dx) + ',' + (y + dy)));
      const nearCounter = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => { const c = m.cell(x + dx, y + dy); return c && (c.counter || c.o === 'table') && seen.has((x + 2 * dx) + ',' + (y + 2 * dy)); });
      for (const w of m.warps) if (!seen.has(w.x + ',' + w.y)) out.push(`${id}: ${w.kind || 'warp'} at ${w.x},${w.y} to ${w.to} can't be reached`);
      for (const o of m.objs) if (o.type === 'item' && !o.hidden && !o.tidal && !near(o.x, o.y)) out.push(`${id}: item ${o.item} at ${o.x},${o.y} can't be reached`);
      for (const o of m.objs) if (o.type === 'npc' && o.script && !o.cond && !near(o.x, o.y) && !nearCounter(o.x, o.y)) out.push(`${id}: ${o.id || o.script} at ${o.x},${o.y} can't be talked to`);
    }
    return out;
  });
  console.log(r.length ? r.join('\n') : 'ok: every door, item ball and person with something to say can be reached');
  await br.close();
})();
