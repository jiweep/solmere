// Nemesis trainers: losing to a Tamer marks them; coming back gets a (kind) taunt; beating them pays double,
// gives an item and a REVENGE! moment. Battles are stubbed (Battle.run returns a fixed outcome).
// Run: node server.js & NODE_PATH=/opt/node22/lib/node_modules node tests/nemesis.js
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const pg = await br.newPage({ viewport: { width: 768, height: 432 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8080/?mute'); await pg.waitForFunction(() => window.G && G.scenes.length > 0); await pg.waitForTimeout(500);
  const r = await pg.evaluate(async () => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    G.settings.render3d = false; G.settings.clips = false; G.simSpeed = 8;
    G.save = G.repairSave(G.newSave({ name: 'Ash', look: 'player_a' })); G.save.party = [G.mon.create('kindlet', 8)];
    for (const s of G.scenes.slice()) G.pop(s);
    const w = new G.WorldScene(); G.push(w); w.enterMap('route1', 10, 20, 'down', { noScript: true });
    // auto-advance every message and choice
    const said = []; G.say = async (t, o) => { said.push((o && o.speaker ? o.speaker + ': ' : '') + t); };
    const pump = setInterval(() => { const top = G.top(); if (top && top.msgQ !== undefined) { } G.input.tap && G.input.tap('a'); }, 30);
    let outcome = 'lose'; G.Battle.prototype.run = async function () { await G.wait(5); return { outcome, leveled: [], fainted: [] }; };
    const e = w.ents.find(x => x.kind === 'trainer' && x.trainer === 'r1_bug'); ok(!!e, 'Route 1 bug catcher present');
    const T = G.TRAINERS.r1_bug;
    await G.trainerBattleFromEnt(e);
    ok((G.save.nemesis || {}).r1_bug === 1, 'a loss marks them (1 star)');
    ok(!G.save.trainers.r1_bug, 'still undefeated');
    said.length = 0; outcome = 'win'; const money0 = G.save.money, orbs0 = G.bag.count('greatorb');
    w.enterMap('route1', 10, 20, 'down', { noScript: true });
    const e2 = w.ents.find(x => x.trainer === 'r1_bug');
    await G.trainerBattleFromEnt(e2);
    ok(said[0] && said[0].startsWith(T.name + ':') && said[0] !== T.name + ': ' + T.intro, 'the rematch opens with a taunt: ' + (said[0] || '').slice(0, 90));
    const base = (T.money || 40) * Math.max(...T.party.map(p => p.lvl !== undefined ? p.lvl : p[1]));
    ok(G.save.money - money0 === base * 2, `revenge pays double (${G.save.money - money0} vs ${base})`);
    ok(G.bag.count('greatorb') === orbs0 + 2, 'and hands over 2 Great Orbs');
    ok(!G.save.nemesis.r1_bug && G.save.stats.revenges === 1, 'the grudge is settled');
    // no nemeses from the Daily Tide or Spire (their battles pass playerParty)
    outcome = 'lose'; await G.runBattle({ foes: [G.makeTrainerCfg('r1_boy')], format: 'single', playerParty: G.save.party, noMoney: true, noPost: true, canLose: true });
    ok(!G.save.nemesis.r1_boy, 'Spire/Daily Tide losses leave no nemesis');
    // bosses: an encouraging line on the retry
    ok(/came back/.test(G.nemesisLine(G.TRAINERS.juniper, 1)), 'Wardens encourage you instead');
    clearInterval(pump);
    return out;
  });
  console.log(r.join('\n')); if (errs.length) console.log('ERRORS', errs);
  await br.close();
})();
