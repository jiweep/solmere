// Headless screenshots: node tests/shots.js out_dir [spec...]
// spec: "map:<id>:<x>:<y>[:hour]"  |  "battle:<env>:<foeSpecies>:<mySpecies>[:trainerLook]"  |  "title"  |  "intro"
// Needs the static server running (node server.js 8080).
const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const [out, ...specs] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1152, height: 648 } });
  page.on('pageerror', e => console.log('PAGEERROR', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
  await page.goto('http://localhost:8080/?mute', { waitUntil: 'load' });
  await page.waitForFunction(() => window.G && G.scenes && G.scenes.length > 0, null, { timeout: 30000 });
  await page.waitForTimeout(800);
  await page.evaluate(() => { const b = document.getElementById('ff'); if (b) b.style.display = 'none'; });
  let n = 0;
  for (const spec of specs) {
    const [kind, ...a] = spec.split(':');
    try {
      if (kind === 'map') {
        await page.evaluate(async ([id, x, y, hour]) => {
          if (!G.world || !G.world.scene) {
            G.save = G.repairSave(G.newSave({ name: 'Ash', look: 'player_a' }));
            for (const s of G.scenes.slice()) G.pop(s);
            G.maps.reset(); const w = new G.WorldScene(); w.enterMap('brinehollow', 12, 12, 'down', { noScript: true, noBanner: true }); G.push(w);
            await G.jumpToChapter(G.CHAPTERS[2]);
          }
          while (G.top() !== G.world.scene) G.pop(G.top());
          if (hour) G.save.vars.forceHour = +hour; else delete G.save.vars.forceHour;
          G.world.scene.enterMap(id, +x, +y, 'down', { noScript: true, noBanner: true });
        }, a);
        await page.waitForTimeout(700);
      } else if (kind === 'battle') {
        await page.evaluate(([env, foe, mine, look]) => {
          if (!G.save) G.save = G.repairSave(G.newSave({ name: 'Ash', look: 'player_a' }));
          const sc = new G.BattleScene({ format: 'single', env, trainer: look ? { look, name: 'Test' } : null });
          G.push(sc); sc.intro = 0;
          const mk = (sp, s) => { const mon = G.mon.create(sp, 30); const P = sc.pos(s, 0, 1); return { ...mon, ...P, dispHp: G.mon.maxHP(mon), maxhp: G.mon.maxHP(mon), hp: G.mon.maxHP(mon), visible: true, scale: 1, alpha: 1, offx: 0, offy: 0, flash: 0, shake: 0, frame: 0, side: s, slot: 0, anim: 0, uid: mon.uid, status: null, name: G.SPECIES[sp].name }; };
          sc.slots['0:0'] = mk(mine, 0); sc.slots['1:0'] = mk(foe, 1);
        }, a);
        await page.waitForTimeout(900);
      } else if (kind === 'title') {
        await page.waitForTimeout(300);
      } else if (kind === 'wait') {
        await page.waitForTimeout(+a[0]);
      } else if (kind === 'key') {
        for (const k of a[0].split(',')) { await page.keyboard.press(k); await page.waitForTimeout(250); }
        await page.waitForTimeout(400);
      } else if (kind === 'eval') {
        await page.evaluate(a.join(':'));
        await page.waitForTimeout(900);
      }
      const f = path.join(out, `${String(n++).padStart(2, '0')}_${spec.replace(/[^a-z0-9_]+/gi, '_').slice(0, 60)}.png`);
      await page.screenshot({ path: f });
      console.log('shot', f);
      if (kind === 'battle') await page.evaluate(() => { const b = G.scenes.find(s => s instanceof G.BattleScene); if (b) G.pop(b); });
    } catch (e) { console.log('FAIL', spec, e.message); }
  }
  const errs = await page.evaluate(() => (G.errors || []).slice(0, 10));
  if (errs.length) console.log('G.errors', errs);
  await browser.close();
})();
