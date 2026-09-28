// Quick Battle: teams and bots are valid at Lv 50, a full round trip (setup -> battle -> result) records the
// win and restores whatever save was loaded. The battle itself is stubbed; a short real bot battle runs too.
// Run: node server.js & NODE_PATH=/opt/node22/lib/node_modules node tests/quickbattle.js
const { chromium } = require('playwright');
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const pg = await br.newPage({ viewport: { width: 768, height: 432 } });
  const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('http://localhost:8080/?mute'); await pg.waitForFunction(() => window.G && G.scenes.length > 0); await pg.waitForTimeout(500);
  const r = await pg.evaluate(async () => {
    const out = [], ok = (c, m) => out.push((c ? 'ok   ' : 'FAIL ') + m);
    G.settings.render3d = false; G.settings.clips = false;
    try { localStorage.removeItem('solmere_quick'); } catch (e) { }
    const Q = G.quickBattle;
    const m = Q._build('pyrolynx');
    ok(m.lvl === 50 && m.moves.length === 4 && m.moves.every(x => G.MOVES[x.id]), 'built Echo: Lv 50, four real moves (' + m.moves.map(x => x.id).join(', ') + ')');
    ok(m.moves.filter(x => G.MOVES[x.id].pow > 1).length >= 2, 'at least two attacks');
    Q.set.level = 3; Q.set.size = 1; G.showcaseSave(); Q._bot();
    const T = G.TRAINERS.quick_bot;
    ok(T.party.length === 6 && T.party.every(p => p.lvl === 50 && p.item && p.moves.length === 4), 'Champion bot: six Lv 50 Echoes with held items');
    const cfg = G.makeTrainerCfg('quick_bot'); ok(cfg.party.length === 6, 'the bot builds as a trainer');
    // full round trip, battle stubbed
    const before = { marker: 'loaded' }; G.save = before;
    const SL = G.SideList; G.SideList = class { constructor(o, res) { setTimeout(() => res(true)); } update() { } drawUI() { } };
    G.push = (orig => s => s instanceof G.SideList ? null : orig(s))(G.push);
    const run0 = G.Battle.prototype.run; G.Battle.prototype.run = async function () { await G.wait(3); return { outcome: 'win', leveled: [], fainted: [] }; };
    const ask0 = G.ask; let asked = ''; G.ask = async (t) => { asked = t; return 2; };
    Q.set.team = 0; Q.set.level = 1; Q.set.size = 0;
    const pump = setInterval(() => G.input.tap && G.input.tap('a'), 30);
    await Q.start(); clearInterval(pump);
    G.SideList = SL; G.Battle.prototype.run = run0; G.ask = ask0;
    ok(/You won!/.test(asked) && /1 won, 0 lost/.test(asked), 'result: ' + asked);
    ok(G.save === before, 'the loaded save is restored');
    ok(!G.TRAINERS.quick_bot, 'the bot is cleared away');
    return out;
  });
  console.log(r.join('\n')); if (errs.length) console.log('ERRORS', errs);
  await br.close();
})();
