// Saving and continuing must work at every point of the story. For each chapter checkpoint: save to a slot,
// open a fresh page (nothing left over in memory), Continue from that slot the way the title does, then check
// the save came back whole, you stand where you saved, the Journal has a goal, and every Tamer the story can
// put in front of you (map Tamers, story battles, the rival and the Champion) can actually be built.
// (It guards the bug where Continue lost the rival's teams and the Champion.)
// Run: node server.js & NODE_PATH=/opt/node22/lib/node_modules node tests/save_roundtrip.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
(async () => {
  const src = ['scripts.js', 'secrets.js', 'tides.js'].map(f => fs.readFileSync(path.join(__dirname, '../js/story', f), 'utf8')).join('\n');
  const storyIds = [...new Set([...src.matchAll(/storyBattle\('(\w+)'/g)].map(m => m[1]))];
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const ctx = await br.newContext();
  const open = async () => { const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('  page error:', e.message)); await pg.goto('http://localhost:8080/?mute'); await pg.waitForFunction(() => window.G && G.scenes.length > 0 && G.CHAPTERS); await pg.waitForTimeout(300); return pg; };
  const n = await (await open()).evaluate(() => G.CHAPTERS.length);
  let fails = 0;
  for (let k = 0; k < n; k++) {
    const a = await open();
    const saved = await a.evaluate(async k => {
      G.settings.render3d = false;
      G.save = G.repairSave(G.newSave({ slot: 3, name: 'Ash', look: 'player_a' })); G.setVar('starter', 'sealet');
      for (const s of G.scenes.slice()) G.pop(s); const w = new G.WorldScene(); G.push(w); w.enterMap('brinehollow', 18, 9, 'down', { noScript: true });
      await G.jumpToChapter(G.CHAPTERS[k]);
      for (let i = 0; i < 100 && G.world.scene.busy; i++) await new Promise(r => setTimeout(r, 50));
      G.persist.write(3);
      return { name: G.CHAPTERS[k].name, json: localStorage.getItem(G.persist.key(3)) };
    }, k);
    await a.close();
    const b = await open();
    const res = await b.evaluate(async ([storyIds]) => {
      G.settings.render3d = false;
      const data = G.persist.read(3); if (!data) return ['FAIL no save in slot 3'];
      await G.startFromSave(data);
      for (let i = 0; i < 100 && !(G.world.scene && !G.world.scene.busy); i++) await new Promise(r => setTimeout(r, 50));
      const out = [], ok = (c, m) => { if (!c) out.push('FAIL ' + m); };
      const w = G.world.scene;
      ok(w && w.map && w.map.id === data.pos.map && w.player.x === data.pos.x && w.player.y === data.pos.y, `standing where saved (${data.pos.map} ${data.pos.x},${data.pos.y}; now ${w && w.map && w.map.id} ${w && w.player && w.player.x},${w && w.player && w.player.y})`);
      const strip = s => { const o = JSON.parse(JSON.stringify(s)); delete o.savedAt; delete o.settingsGlobal; delete o.playtime; return o; };
      const A = strip(data), B = strip(G.save), diff = Object.keys(A).filter(k => JSON.stringify(A[k]) !== JSON.stringify(B[k]) && !['pos', 'lastOutdoor', 'stats', 'vars'].includes(k));
      ok(!diff.length, 'save came back whole (changed: ' + diff.join(', ') + ')');
      ok(G.save.party.length && G.save.party.every(m => G.SPECIES[m.sp] && m.moves.length), 'party intact');
      const post = G.flag('champion');
      ok(post || !!(G.currentGoal && G.currentGoal()), 'the Journal has a goal');
      const ids = new Set(storyIds);
      for (const id of Object.keys(G.MAPDEFS)) for (const o of (G.MAPDEFS[id].objs || [])) if (o.type === 'trainer') ids.add(o.trainer);
      const bad = [];
      for (const id of ids) { try { const c = G.makeTrainerCfg(id); if (!c.party.length) bad.push(id + ' (empty)'); } catch (e) { bad.push(id + ': ' + e.message); } }
      ok(!bad.length, 'every Tamer can be built: ' + bad.join('; '));
      return out;
    }, [storyIds]);
    await b.close();
    fails += res.length;
    console.log(`${res.length ? 'FAIL' : 'ok  '} ${saved.name}${res.length ? '\n   ' + res.join('\n   ') : ''}`);
  }
  console.log(fails ? `${fails} problem(s)` : `ok: saving and continuing works at all ${n} chapters (${storyIds.length} story battles checked)`);
  await br.close();
})();
