// Living tides: flats flip only off screen or behind a warp, never under the player; finds only at low tide;
// Brinehollow's flats reachable on foot from the beach; pages found and counted.
// Run: node server.js & NODE_PATH=/opt/node22/lib/node_modules node tests/tides.js
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const pg = await br.newPage({ viewport: { width: 768, height: 432 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8080/?mute'); await pg.waitForFunction(() => window.G && G.scenes.length > 0); await pg.waitForTimeout(500);
  const r = await pg.evaluate(async () => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    G.settings.render3d = false;
    G.save = G.repairSave(G.newSave({ name: 'Ash', look: 'player_a' })); G.save.party = [G.mon.create('kindlet', 20)];
    for (const s of G.scenes.slice()) G.pop(s);
    const w = new G.WorldScene(); G.push(w);
    G.save.vars.forceTide = 'high'; w.enterMap('brinehollow', 18, 9, 'down', { noScript: true });
    const m = w.map, c = (x, y) => m.cell(x, y);
    ok(m.tidalCells.length > 20, `brinehollow has flats (${m.tidalCells.length} cells)`);
    ok(c(10, 32).water && !w.ents.some(e => e.page), 'high tide: sea, no page');
    G.save.vars.forceTide = 'low'; w.enterMap('brinehollow', 18, 9, 'down', { noScript: true });
    ok(!c(10, 32).water && c(10, 32).g === 'sand', 'low tide after a warp: sand');
    ok(w.ents.some(e => e.page === 1), 'low tide: page 1 washed up');
    // walk from the beach to the page without surfing
    const seen = new Set(['5,28']), q = [[5, 28]]; let reach = false;
    while (q.length) { const [x, y] = q.shift(); if (x === 10 && y === 32) { reach = true; break; } for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy, k = nx + ',' + ny, n = c(nx, ny); if (!n || seen.has(k) || n.water || n.solid) continue; seen.add(k); q.push([nx, ny]); } }
    ok(reach, 'the page is reachable on foot from the beach');
    ok(G.wilds.tableAt(w, 8, 30) === 'tide', 'low-tide Echoes on the flats');
    // standing on the flats when the tide turns: stays sand under you
    w.enterMap('brinehollow', 8, 30, 'down', { noScript: true }); G.save.vars.forceTide = 'high'; w.enterMap('brinehollow', 8, 30, 'down', { noScript: true });
    ok(!c(8, 30).water, 'never flooded under the player');
    w.enterMap('brinehollow', 18, 9, 'down', { noScript: true });
    ok(c(8, 30).water, 'back to sea once you step off and warp');
    // crossing a seam: the map you're on and its neighbours keep their state; far maps turn
    G.save.vars.forceTide = 'low'; w.enterMap('route6', 8, 28, 'down', { noScript: true });
    const r6 = w.map; ok(r6.tideLow, 'route6 low');
    w.enterMap('route5', 14, 40, 'down', { noScript: true }); const r5 = w.map, dm = G.maps.get('duskmere'); G.tide.set(dm, true);
    G.save.vars.forceTide = 'high'; G.tide.refresh(w, 'cross');
    ok(r5.tideLow && dm.tideLow, 'seam crossing: current and neighbouring maps untouched');
    ok(!r6.tideLow, 'seam crossing: far-off map turned');
    // the page
    G.save.vars.forceTide = 'low'; w.enterMap('brinehollow', 18, 9, 'down', { noScript: true }); Object.assign(w.player, { x: 10, y: 31 });
    const pe = w.ents.find(e => e.page === 1);
    const said = []; const say0 = G.say; G.say = async t => { said.push(t); };
    await w.pickItem(pe); G.say = say0;
    ok(G.flag('keeperpage1') && G.save.quests.keeperlog && G.save.quests.keeperlog.step === 'go', 'page 1 found, the log quest starts');
    ok(said.some(t => /1 of 6/.test(t)), 'counted 1 of 6');
    ok(/1 of 6 pages/.test(G.QUESTS.keeperlog.live()), 'Journal shows the count');
    w.enterMap('brinehollow', 18, 9, 'down', { noScript: true });
    ok(!w.ents.some(e => e.page === 1), 'a found page stays found');
    // every find sits on the flats
    for (const id of ['brinehollow', 'duskmere', 'route5', 'route6', 'tidelight']) {
      const mm = G.maps.get(id), finds = mm.objs.filter(o => o.tidal);
      ok(mm.tidalCells.length > 5 && finds.every(o => mm.cell(o.x, o.y) && mm.cell(o.x, o.y).tidal), `${id}: ${mm.tidalCells.length} flat cells, ${finds.length} finds all on them`);
      const edge = mm.tidalCells.filter(t => Object.keys(mm.def.conn || {}).some(d => (d === 'n' && t.y < 3) || (d === 's' && t.y > mm.h - 4) || (d === 'w' && t.x < 3) || (d === 'e' && t.x > mm.w - 4)));
      ok(!edge.length, `${id}: no flats within 3 tiles of a connected edge`);
    }
    return out;
  });
  console.log(r.join('\n')); if (errs.length) console.log('ERRORS', errs);
  await br.close();
})();
