// Fuzz the battle engine: thousands of AI vs AI battles in singles, doubles and multi formats.
const { load, CORE } = require('./harness');
const G = load(CORE);
const N = +(process.argv[2] || 1500);
const ids = G.DEX.slice();
const EV_TYPES = new Set(['intro', 'send', 'withdraw', 'msg', 'move', 'hit', 'hp', 'faint', 'status', 'stat', 'weather', 'popup', 'item', 'exp', 'levelup', 'throw', 'caught', 'resonate', 'screen', 'hazard', 'state', 'end', 'sfx', 'statusAnim', 'charge', 'protectAnim', 'subMake', 'subBreak', 'shieldBreak', 'field', 'partyUpdate']);
let stats = { win: 0, lose: 0, ran: 0, caught: 0, turns: 0, events: 0, maxTurns: 0 };
const display = { async play(evs) { for (const e of evs) { if (!EV_TYPES.has(e.t)) throw new Error('Unknown event ' + e.t); if (e.t === 'msg' && /undefined|NaN/.test(e.f)) throw new Error('Bad msg: ' + e.f); if (e.t === 'hp' && (isNaN(e.hp) || e.hp < 0 || e.hp > e.max)) throw new Error('Bad hp ' + JSON.stringify(e)); } stats.events += evs.length; } };
function randTeam(n, lvlLo, lvlHi) {
  const t = [];
  for (let i = 0; i < n; i++) {
    const sp = G.pick(ids); const m = G.mon.create(sp, G.randInt(lvlLo, lvlHi));
    if (G.chance(.5)) m.item = G.pick(['leftovers', 'lifegem', 'powerband', 'focuslens', 'swiftscarf', 'gritsash', 'guardvest', 'spikedhelm', 'sunberry', 'lumenberry', 'quickclaw', 'shellbell', 'charcoal', 'evocrystal', 'leppaberry', 'blacksludge', 'expertbelt']);
    // give some random TM moves
    if (G.chance(.5)) { const tm = G.pick(G.TM_LIST); if (G.canLearnTM(sp, tm) && !m.moves.some(x => x.id === tm)) { if (m.moves.length >= 4) m.moves[G.randInt(0, 3)] = G.mon.newMove(tm); else m.moves.push(G.mon.newMove(tm)); } }
    t.push(m);
  }
  return t;
}
async function one(i) {
  const fmt = G.pick(['single', 'single', 'double', 'multi']);
  const wild = fmt !== 'multi' && G.chance(.3);
  const lvl = G.randInt(3, 80);
  const mk = (party, isPlayer, lvlAI) => ({ name: isPlayer ? 'Tester' : 'Foe', cls: isPlayer ? null : 'Ace Tamer', party, isPlayer, controller: G.AI.controller(lvlAI), items: { hyperpotion: 2 }, resonance: G.chance(.5), expShare: true });
  let sides;
  if (fmt === 'multi') sides = [{ trainers: [mk(randTeam(3, lvl, lvl + 5), true, 3), mk(randTeam(3, lvl, lvl + 5), false, 2)] }, { trainers: [mk(randTeam(4, lvl, lvl + 5), false, 3)] }];
  else if (wild) sides = [{ trainers: [mk(randTeam(G.randInt(1, 6), lvl, lvl + 5), true, 3)] }, { trainers: [{ name: null, party: randTeam(fmt === 'double' ? 2 : 1, lvl, lvl + 3), controller: G.AI.controller(0) }] }];
  else sides = [{ trainers: [mk(randTeam(G.randInt(1, 6), lvl, lvl + 5), true, G.randInt(1, 4))] }, { trainers: [mk(randTeam(G.randInt(1, 6), lvl, lvl + 5), false, G.randInt(1, 4))] }];
  if (wild && G.chance(.5)) sides[0].trainers[0].controller.decide = function (bt, req) { return G.chance(.3) ? { type: 'item', item: G.pick(['orb', 'greatorb', 'ultraorb', 'quickorb', 'duskorb', 'timerorb', 'netorb']) } : G.AI.controller(3).decide(bt, req); };
  const bt = new G.Battle({ format: fmt === 'multi' ? 'double' : fmt, wild, sides, displays: [display], exp: true, weather: G.chance(.15) ? G.pick(['rain', 'sun', 'sand', 'snow']) : null, env: 'grass' });
  let guard = 0; const origRun = bt.collectActions.bind(bt);
  bt.collectActions = async function () { if (++guard > 300) { this.end('draw'); return []; } return origRun(); };
  const r = await bt.run();
  if (!r) throw new Error('no result');
  stats[r.outcome] = (stats[r.outcome] || 0) + 1; stats.turns += r.turns; stats.maxTurns = Math.max(stats.maxTurns, r.turns);
}
(async () => {
  const t0 = Date.now();
  for (let i = 0; i < N; i++) {
    try { await one(i); }
    catch (e) { console.error('Battle', i, 'crashed:', e.stack); process.exit(1); }
  }
  console.log('OK', N, 'battles in', Date.now() - t0, 'ms', JSON.stringify(stats), 'avg turns', (stats.turns / N).toFixed(1));
})();
