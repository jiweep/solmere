// The Skyreach Gym's wind currents, played for real: the game's own step code, from the entrance, with the gym's
// Tamers already beaten so no battle interrupts. The way west then north must reach Kaelen; the current east of the
// entrance must blow you onto the near ledge and its only way off must blow you home again; and you must get back
// out from Kaelen's hall after the badge.
// Run: node server.js & NODE_PATH=/opt/node22/lib/node_modules node tests/wind.js
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const pg = await br.newPage();
  pg.on('pageerror', e => console.log('page error:', e.message));
  await pg.goto('http://localhost:8080/?mute'); await pg.waitForFunction(() => window.G && G.MAPDEFS && G.scenes.length);
  const r = await pg.evaluate(async () => {
    G.save = G.repairSave(G.newSave({ name: 'A', look: 'player_a' })); G.save.party = [G.mon.create('kindlet', 40)];
    for (const t of ['sg_1', 'sg_2', 'sg_3']) G.save.trainers[t] = { badges: 5 };
    for (const s of G.scenes.slice()) G.pop(s); G.maps.reset();
    const w = new G.WorldScene(); w.enterMap('sky_gym', 7, 16, 'up', { noScript: true, noBanner: true }); G.push(w);
    const p = w.player, D = { u: 'up', d: 'down', l: 'left', r: 'right' };
    const settle = async () => { for (let i = 0; i < 600 && (p.moving || w.sliding || w.busy); i++) await new Promise(res => setTimeout(res, 16)); };
    const walk = async (path) => { for (const ch of path) { await settle(); w.tryStep(D[ch]); await settle(); } return [p.x, p.y]; };
    const out = [];
    // the decoy: east onto the current, which lands on the near ledge; its current down blows you back home
    let at = await walk('urrrr');   // up a row (the guide stands at 10,16), east onto the current at 11,15
    if (at.join() !== '12,12') out.push(`east current landed at ${at} (want 12,12)`);
    at = await walk('ld');   // along the ledge and onto its down current at 11,13
    if (at.join() !== '10,14') out.push(`near ledge's current left you at ${at} (want 10,14, back on the entrance platform)`);
    // the way up: west current to the first Tamer's ledge, east over the gap, north round to the third, then Kaelen
    at = await walk('llllll');
    if (at.join() !== '2,12') out.push(`west current landed at ${at} (want 2,12)`);
    at = await walk('uurrr');
    if (at.join() !== '10,10') out.push(`east current over the gap landed at ${at} (want 10,10)`);
    at = await walk('rruu');
    if (at.join() !== '5,5') out.push(`north current landed at ${at} (want 5,5)`);
    at = await walk('llu');
    if (at.join() !== '3,3') out.push(`last current landed at ${at} (want 3,3)`);
    at = await walk('rrrr');
    if (at.join() !== '7,3') out.push(`couldn't walk to Kaelen: at ${at}`);
    // and back out after the badge: down to the third Tamer's ledge, the first's, then home along the west edge
    at = await walk('llld');
    if (at.join() !== '4,5') out.push(`the way down from Kaelen landed at ${at} (want 4,5)`);
    at = await walk('dllld');
    if (at.join() !== '1,9') out.push(`the drop from the third ledge landed at ${at} (want 1,9)`);
    at = await walk('dddd');
    if (at.join() !== '5,15') out.push(`the west current home landed at ${at} (want 5,15)`);
    // no trap anywhere: from every tile you can reach, you can get back to the door (the bot found Kaelen's hall had none)
    const m = w.map, people = new Set(m.objs.filter(o => o.type === 'npc' || o.type === 'trainer').map(o => o.x + ',' + o.y));
    const pass = (x, y) => { const c = m.cell(x, y); return c && !c.solid && !people.has(x + ',' + y); };
    const reach = (x0, y0) => { const seen = new Set([x0 + ',' + y0]), q = [[x0, y0]]; while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { let nx = x + dx, ny = y + dy; if (!pass(nx, ny)) continue; for (let n = 0, g; (g = m.cell(nx, ny)) && g.wind && n < 64; n++) { const [wx, wy] = G.DIRS[g.wind]; if (!pass(nx + wx, ny + wy)) break; nx += wx; ny += wy; } const k = nx + ',' + ny; if (!seen.has(k)) { seen.add(k); q.push([nx, ny]); } } } return seen; };
    const door = m.warps[0], all = reach(7, 16), traps = [...all].filter(k => { const [x, y] = k.split(',').map(Number); return !reach(x, y).has(door.x + ',' + door.y); });
    if (traps.length) out.push(`no way back to the door from ${traps.slice(0, 6).join(' ')}`);
    return out;
  });
  console.log(r.length ? 'FAIL\n' + r.join('\n') : 'ok: the Skyreach currents carry you up to Kaelen, the near ledge only blows you home, and the way back out works');
  await br.close();
  process.exit(r.length ? 1 : 0);
})();
