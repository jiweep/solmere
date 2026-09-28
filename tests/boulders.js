// Boulder puzzles must be solvable: from each way into a map with pushable boulders, search every sequence of
// walks and pushes (the game's rules: walk into a boulder to push it one tile; into a hole it drops and fills
// it; boulders can't go into walls, water, people or other boulders) and check every door and stair can be
// reached. Boulders reset when you leave, so each entrance is solved on its own. Needs the Grip Boots in play.
// Run: node server.js & NODE_PATH=/opt/node22/lib/node_modules node tests/boulders.js
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const pg = await br.newPage();
  await pg.goto('http://localhost:8080/?mute'); await pg.waitForFunction(() => window.G && G.MAPDEFS && G.scenes.length);
  const r = await pg.evaluate(() => {
    G.save = G.repairSave(G.newSave({ name: 'A', look: 'player_a' }));
    const ids = Object.keys(G.MAPDEFS), maps = {}; for (const id of ids) maps[id] = G.maps.get(id);
    const out = [];
    for (const id of ids) {
      const m = maps[id], B0 = m.cells.filter(c => c.push).map(c => c.y * m.w + c.x);
      if (!B0.length) continue;
      const entries = [];
      if (m.def.spawn) entries.push(m.def.spawn);
      for (const oid of ids) for (const w of maps[oid].warps) if (w.to === id) entries.push([w.tx, w.ty]);
      for (const cn of m.conns) for (let i = 0; i < Math.max(m.w, m.h); i++) { const x = cn.dir === 'e' ? m.w - 1 : cn.dir === 'w' ? 0 : i, y = cn.dir === 's' ? m.h - 1 : cn.dir === 'n' ? 0 : i; const c = m.cell(x, y); if (c && !c.solid) entries.push([x, y]); }
      const people = new Set(m.objs.filter(o => o.x != null && !o.cond && (o.type === 'npc' || o.type === 'sign' || o.type === 'trainer')).map(o => o.y * m.w + o.x));
      const holes0 = m.cells.filter(c => c.g === 'hole').map(c => c.y * m.w + c.x);
      const floor = i => { const c = m.cells[i]; if (!c || people.has(i)) return false; if (c.push) return true; if (c.solid && !(c.cut || c.smash || c.solidIf)) return false; return true; };   // water: surfable later, counts as floor for walking
      const targets = m.warps.map(w => w.y * m.w + w.x);
      const reachedAll = new Set();
      const seenEntry = new Set();
      for (const [ex, ey] of entries) {
        const e0 = ey * m.w + ex; if (seenEntry.has(e0) || !m.cells[e0]) continue; seenEntry.add(e0);
        // state: player tile, boulder tiles (sorted), filled holes
        const key = (p, B, F) => p + '|' + B.join(',') + '|' + F.join(',');
        const start = [e0, B0.slice().sort((a, b) => a - b), []];
        const seen = new Set([key(...start)]), q = [start]; let n = 0;
        while (q.length && n < 200000) {
          const [p, B, F] = q.shift(); n++;
          reachedAll.add(p);
          const px = p % m.w, py = (p / m.w) | 0;
          for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const nx = px + dx, ny = py + dy; if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
            const ni = ny * m.w + nx, c = m.cells[ni];
            const isHole = c.g === 'hole' && !F.includes(ni);
            if (B.includes(ni)) {   // push
              const bx = nx + dx, by = ny + dy; if (bx < 0 || by < 0 || bx >= m.w || by >= m.h) continue;
              const bi = by * m.w + bx, bc = m.cells[bi];
              if (B.includes(bi) || people.has(bi) || bc.water) continue;
              let B2 = B.filter(b => b !== ni), F2 = F;
              if (bc.g === 'hole' && !F.includes(bi)) F2 = F.concat(bi).sort((a, b) => a - b);
              else { if (!floor(bi) || (bc.solid && !bc.push)) continue; B2 = B2.concat(bi).sort((a, b) => a - b); }
              const s = [ni, B2, F2], k = key(...s); if (!seen.has(k)) { seen.add(k); q.push(s); }
            } else {
              if (isHole || !floor(ni)) continue;
              const s = [ni, B, F], k = key(...s); if (!seen.has(k)) { seen.add(k); q.push(s); }
            }
          }
        }
        if (n >= 200000) out.push(`${id}: search from ${ex},${ey} hit the state limit (too many boulders to prove)`);
      }
      const miss = targets.filter(t => !reachedAll.has(t)).map(t => `${t % m.w},${(t / m.w) | 0}`);
      out.push(`${miss.length ? 'FAIL' : 'ok  '} ${id}: ${B0.length} boulders, ${holes0.length} holes, ${targets.length} doors/stairs${miss.length ? '; never reachable: ' + miss.join(' ') : ''}`);
    }
    return out;
  });
  console.log(r.join('\n'));
  await br.close();
})();
