// Early-game balance check: the opening's key fights, simulated many times with a competent player bot
// (AI 3) and a novice one (AI 1), at the levels a player is likely to have. Prints win rates and how much
// HP the player's team has left, per starter.
//   node tests/early_balance.js [runs]
const { load, CORE } = require('./harness');
const G = load(CORE);
G.TRAINERS = {}; G.rivalOf = { budling: 'kindlet', kindlet: 'sealet', sealet: 'budling' };
new Function('G', require('fs').readFileSync(require('path').join(__dirname, '../js/story/trainers.js'), 'utf8'))(G);
const N = +(process.argv[2] || 200);
const display = { async play() { } };
const D = { lvl: 1, iv: 16 };   // Normal difficulty
function foe(id) {
  const T = G.TRAINERS[id];
  const party = T.party.map(p => { const m = G.mon.create(p.sp, Math.round(p.lvl * D.lvl), { ivs: Object.fromEntries(G.STATS.map(s => [s, D.iv + (T.boss ? 6 : 0)])), item: p.item || null }); if (p.moves) m.moves = p.moves.map(x => G.mon.newMove(x)); return m; });
  return { name: T.name, cls: T.cls, party, controller: G.AI.controller(Math.min(4, T.ai || 2), T), items: { ...(T.items || {}) }, resonance: !!T.resonate };
}
function rivalCfg(mine, lvl, party) { return { name: 'Wren', cls: 'Rival', party: party.map(([sp, l]) => G.mon.create(sp, l, { ivs: Object.fromEntries(G.STATS.map(s => [s, 22])) })), controller: G.AI.controller(2), items: {} }; }
async function fight(team, foeCfg, ai, o = {}) {
  let won = 0, hp = 0, turns = 0;
  for (let i = 0; i < N; i++) {
    const party = team().map(([sp, l]) => G.mon.create(sp, l));
    const player = { name: 'P', party, isPlayer: true, controller: G.AI.controller(ai), items: o.items ? { ...o.items } : {}, resonance: !!o.resonance };
    const bt = new G.Battle({ format: 'single', wild: false, sides: [{ trainers: [player] }, { trainers: [foeCfg()] }], displays: [display], exp: false, env: 'grass' });
    let guard = 0; const run = bt.collectActions.bind(bt); bt.collectActions = async function () { if (++guard > 200) { this.end('draw'); return []; } return run(); };
    const r = await bt.run();
    if (r.outcome === 'win') { won++; hp += party.reduce((a, m) => a + Math.max(0, m.hp), 0) / party.reduce((a, m) => a + G.mon.maxHP(m), 0); }
    turns += r.turns;
  }
  return `${(100 * won / N).toFixed(0).padStart(3)}% win · ${won ? (100 * hp / won).toFixed(0) : '-'}% HP left · ${(turns / N).toFixed(1)} turns`;
}
(async () => {
  const starters = ['budling', 'kindlet', 'sealet'];
  const line = (s, l) => G.evoLine(s).map(x => x.id)[l >= 36 ? 2 : l >= 16 ? 1 : 0];
  for (const s of starters) {
    const r = G.rivalOf[s];
    console.log(`\n== ${s} (rival: ${r})`);
    for (const ai of [3, 1]) {
      const who = ai === 3 ? 'competent' : 'novice  ';
      console.log(`  ${who} rival1  L5 vs L5 :`, await fight(() => [[s, 5]], () => rivalCfg(s, 5, [[r, 5]]), ai));
      console.log(`  ${who} Juniper L13+10+10:`, await fight(() => [[line(s, 13), 13], ['pipwing', 11], ['nibbit', 10]], () => foe('juniper'), ai, { items: { potion: 2 } }));
      console.log(`  ${who} Juniper L11+9     :`, await fight(() => [[line(s, 11), 11], ['pipwing', 9]], () => foe('juniper'), ai, { items: { potion: 2 } }));
      console.log(`  ${who} Ione    L19+16+15:`, await fight(() => [[line(s, 19), 19], ['pipwing', 16], ['digmole', 15]], () => foe('ione'), ai, { items: { superpotion: 2 }, resonance: true }));
      console.log(`  ${who} rival2  L21+18+17:`, await fight(() => [[line(s, 21), 21], ['pipwing', 18], ['digmole', 17]], () => rivalCfg(s, 22, [['gustling', 20], ['voltpup', 20], [line(r, 22), 22]]), ai, { items: { superpotion: 2 }, resonance: true }));
    }
  }
})();
