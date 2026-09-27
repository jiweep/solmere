// Play Together: players roam freely. Checks: both see each other (also in 3D), the host going into a house doesn't
// move the guest, the guest can go into another house alone, and the menu's "Go to" puts the guest beside the host
// (not on their tile). Needs `node server.js` on 8080. Slow: two software-GL pages.
// Run: NODE_PATH=/opt/node22/lib/node_modules node tests/coop_doors.js
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const mk = async tag => { const ctx = await br.newContext({ viewport: { width: 768, height: 432 } }); const pg = await ctx.newPage(); pg.on('pageerror', e => console.log(tag, 'ERR', e.message));
    await pg.goto('http://localhost:8080/?mute'); await pg.waitForFunction(() => window.G && G.scenes.length > 0); await pg.waitForTimeout(600); return pg; };
  const A = await mk('A'), B = await mk('B');
  await A.evaluate(() => { G.settings.render3d = false; G.save = G.repairSave(G.newSave({ name: 'Ash', look: 'player_a' })); G.save.party = [G.mon.create('kindlet', 14)]; Object.assign(G.save.flags, { intro_done: 1, got_starter: 1 });
    for (const s of G.scenes.slice()) G.pop(s); const w = new G.WorldScene(); w.enterMap('brinehollow', 18, 9, 'down', { noScript: true }); G.push(w); G.run(() => G.net.hostRoom()); });
  const pressA = setInterval(() => A.keyboard.press('z').catch(() => {}), 500);
  await A.waitForFunction(() => G.net.connected, null, { timeout: 30000 });
  const code = await A.evaluate(() => G.net.room); clearInterval(pressA);
  const pressB = setInterval(() => B.keyboard.press('z').catch(() => {}), 500);
  await B.evaluate(async code => { G.settings.render3d = false; G.save = G.repairSave(G.newSave({ name: 'Robin', look: 'player_b' })); G.save.party = [G.mon.create('sealet', 5)];
    const ok = await G.net.joinRoom(code); if (ok) { for (const s of G.scenes.slice()) G.pop(s); await G.startFromSave(G.save); } return ok; }, code);
  await B.waitForTimeout(5000); clearInterval(pressB);
  const st = pg => pg.evaluate(() => { const w = G.world.scene, c = G.W3._cur(), s = c && c.sprites.get('partner'); return JSON.stringify({ map: w.map.id, me: [w.player.x, w.player.y], partner: w.partner ? [w.partner.x, w.partner.y, w.partner.map] : null, drawn3d: !!(s && s.visible) }); });
  const report = async label => { console.log(label, 'A', await st(A), ' B', await st(B)); };
  await A.evaluate(() => { G.settings.render3d = true; }); await B.evaluate(() => { G.settings.render3d = true; }); await B.waitForTimeout(4000);
  await report('start');
  await A.screenshot({ path: '/tmp/c3_A1.png' }); await B.screenshot({ path: '/tmp/c3_B1.png' });
  await A.evaluate(() => { G.settings.render3d = false; }); await B.evaluate(() => { G.settings.render3d = false; });
  const dismiss = setInterval(() => { for (const pg of [A, B]) pg.evaluate(() => G.top() !== G.world.scene).then(b => b && pg.keyboard.press('z')).catch(() => {}); }, 400);
  const door = await A.evaluate(() => G.world.scene.map.warps.find(x => x.to && !x.to.startsWith('route')));
  // the host goes into a house: the guest stays where they are
  await A.evaluate(d => { const w = G.world.scene; w.enterMap(d.to, d.tx, d.ty, d.dir || 'up', { noScript: true }); G.net.sendPos(true); }, door);
  await B.waitForTimeout(10000);
  await report('host went into ' + door.to);
  // the guest goes into a different house on their own
  const door2 = await B.evaluate(() => G.world.scene.map.warps.filter(x => x.to && !x.to.startsWith('route'))[1]);
  await B.evaluate(d => { const w = G.world.scene; w.enterMap(d.to, d.tx, d.ty, d.dir || 'up', { noScript: true }); G.net.sendPos(true); }, door2);
  await B.waitForTimeout(8000);
  await report('guest went into ' + door2.to);
  // "Go to ..." from the menu: the guest appears beside the host
  await B.evaluate(() => G.net.pullTo(G.net.partner.pos));
  await B.waitForTimeout(12000);
  await report('guest used Go to');
  clearInterval(dismiss);
  await br.close();
})();
