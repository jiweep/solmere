// Attention check (docs/GRAVITY_PLAN.md): the first gym should reward a player who paid attention and stop one
// who didn't. Three players walk from the lab to Juniper, their levels worked out from what they fought:
//   careless  skips every line and everything off the road: no catch (tips off, so no tutorial catch), only the
//             Tamers who stand on the road, a few wild Echoes that bump into them. Must NOT usually win.
//   straight  just walks the road like a normal first-timer: catches the first bird it meets, fights what's in
//             the way, no plan for the gym. Should win about half the time.
//   prepared  listened: every Route 1 Tamer, a proper look through the grass, and the Emberjay Mira talked about
//             (caught at its roost). Should win comfortably.
// Each is simulated many times per starter with a competent (AI 3) and a novice (AI 1) player bot at Normal.
// The second gym (Ione, Galvan) gets the same three players carried on from the first: careless fights only who
// blocks the road, straight fights the road, prepared also fights the Tamers off it and catches the Digmole the
// Galvan lineworker grumbles about (Ground: Ione's Electric moves can't touch it, but her lead flies over it).
//   node tests/attention.js [runs=150] [gym=juniper|ione|all]   (exits 1 if careless wins too often or prepared too rarely)
const { load, CORE } = require('./harness');
const G = load(CORE);
G.TRAINERS = {}; G.rivalOf = { budling: 'kindlet', kindlet: 'sealet', sealet: 'budling' };
new Function('G', require('fs').readFileSync(require('path').join(__dirname, '../js/story/trainers.js'), 'utf8'))(G);
const N = +(process.argv[2] || 150);
// JUNIPER='[["shroomie",10,{"moves":[...]}],...]' tries another team without editing trainers.js
for (const id of ['juniper', 'ione']) if (process.env[id.toUpperCase()]) G.TRAINERS[id].party = JSON.parse(process.env[id.toUpperCase()]).map(([sp, lvl, x]) => ({ sp, lvl, ...(x || {}) }));
const GYM = process.argv[3] || 'all';
const display = { async play() { } };
// engine.js awardExp (as tests/level_curve.js): the fighter gets it all, the rest of the team .75 (EXP Share)
const gainOne = (m, sp, L, trainer, k) => { const b = G.SPECIES[sp].exp; let e = (b * L / 5) * Math.pow((2 * L + 10) / (L + m.lvl + 10), 2.5) + 1; e *= (trainer ? 1.5 : 1) * k; G.mon.addExp(m, Math.max(1, Math.floor(e))); };
const gain = (team, sp, L, trainer, k = 1) => team.forEach((m, i) => gainOne(m, sp, L, trainer, (i === 0 ? 1 : .75) * k));
const beat = (team, id) => { for (const p of G.TRAINERS[id].party) gain(team, p.sp, p.lvl, true); };
const wild = (team, n, k = 1, list = ['pipwing', 'nibbit', 'mossbun', 'grubbit'], lo = 3) => { for (let i = 0; i < n; i++) gain(team, list[i % 4], lo + ((i * 7) % 4), false, k); };
const evolve = team => team.forEach((m, i) => { const e = (G.SPECIES[m.sp].evo || []).find(x => x.lvl && m.lvl >= x.lvl); if (e) { const o = G.mon.create(e.to, m.lvl); o.exp = m.exp; team[i] = o; } });
function journey(starter, style, gym) {
  const team = [G.mon.create(starter, 5)];
  gain(team, G.rivalOf[starter], 4, true);                            // Wren in the lab
  if (style !== 'careless') team.push(G.mon.create('pipwing', 4));   // the first catch
  for (const id of ['r1_kid', 'r1_lass', 'r1_boy']) beat(team, id);   // the three who stand on the road
  if (style === 'prepared') beat(team, 'r1_bug');                     // up the east slope
  wild(team, style === 'careless' ? 3 : style === 'straight' ? 5 : 10);
  if (style === 'prepared') { wild(team, 8, .5); team.push(G.mon.create('emberjay', 10)); }
  beat(team, 'fg_1'); beat(team, 'fg_2'); evolve(team);
  if (gym === 'juniper') return team.map(m => [m.sp, m.lvl]);
  beat(team, 'juniper');
  // Route 2 and Whisperwood: every Route 2 Tamer stands on the road, as do the Ranger, the Mystic and the grunts
  for (const id of ['r2_kid', 'r2_bug', 'r2_hiker', 'r2_lass', 'r2_twins', 'ww_ranger', 'ww_mystic', 'ww_grunt1', 'ww_grunt2']) beat(team, id);
  if (style !== 'careless') { team.push(G.mon.create(style === 'prepared' ? 'mossbun' : 'nibbit', 8)); team.push(G.mon.create('shroomie', 10)); }   // a catch on Route 2, one in Whisperwood
  if (style === 'prepared') { beat(team, 'ww_bug'); beat(team, 'gv_sailor'); beat(team, 'gv_worker'); team.push(G.mon.create('digmole', 11)); }
  wild(team, style === 'careless' ? 3 : style === 'straight' ? 6 : 12, 1, ['grubbit', 'beetlet', 'shroomie', 'stingle'], 8);
  evolve(team); for (const id of ['gg_1', 'gg_2', 'gg_3']) beat(team, id); evolve(team);
  return team.slice(0, 6).map(m => [m.sp, Math.min(20, m.lvl)]);   // the level cap after one badge (G.LEVEL_CAPS, flow.js)
}
function foe(id) {
  const T = G.TRAINERS[id];
  const party = T.party.map(p => { const m = G.mon.create(p.sp, p.lvl, { ivs: Object.fromEntries(G.STATS.map(s => [s, 16 + (T.boss ? 6 : 0)])), item: p.item || null }); if (p.moves) m.moves = p.moves.map(x => G.mon.newMove(x)); return m; });
  return { name: T.name, cls: T.cls, party, controller: G.AI.controller(Math.min(4, T.ai || 2), T), items: { ...(T.items || {}) } };
}
async function rate(team, ai, items, gym) {
  let won = 0;
  for (let i = 0; i < N; i++) {
    const party = team.map(([sp, l]) => G.mon.create(sp, l));
    const player = { name: 'P', party, isPlayer: true, controller: G.AI.controller(ai), items: { ...items }, resonance: gym !== 'juniper' };   // Hale's band comes in Whisperwood
    const bt = new G.Battle({ format: 'single', wild: false, sides: [{ trainers: [player] }, { trainers: [foe(gym)] }], displays: [display], exp: false, env: 'gym' });
    let guard = 0; const run = bt.collectActions.bind(bt); bt.collectActions = async function () { if (++guard > 200) { this.end('draw'); return []; } return run(); };
    if ((await bt.run()).outcome === 'win') won++;
  }
  return won / N;
}
(async () => {
  const fail = [];
  for (const gym of GYM === 'all' ? ['juniper', 'ione'] : [GYM]) {
    const rows = {};
    console.log(`\n${G.TRAINERS[gym].name}: ${G.TRAINERS[gym].party.map(p => p.sp + ' ' + p.lvl).join(', ')}`);
    for (const s of ['budling', 'kindlet', 'sealet']) {
      for (const style of ['careless', 'straight', 'prepared']) {
        const team = journey(s, style, gym), items = style === 'careless' ? {} : gym === 'ione' ? { superpotion: 2 } : { potion: 2 };
        const c = await rate(team, 3, items, gym), n = await rate(team, 1, items, gym);
        (rows[style] = rows[style] || []).push(c, n);
        console.log(`${s.padEnd(8)} ${style.padEnd(9)} ${team.map(t => t.join(' ')).join(', ').padEnd(64)} competent ${(100 * c).toFixed(0).padStart(3)}%   novice ${(100 * n).toFixed(0).padStart(3)}%`);
        if (style === 'careless' && c > .35) fail.push(`${gym}, ${s}: a careless player wins ${(100 * c).toFixed(0)}% of the time`);
        if (style === 'prepared' && c < .75) fail.push(`${gym}, ${s}: a prepared player wins only ${(100 * c).toFixed(0)}% of the time`);
      }
    }
    const avg = a => (100 * a.reduce((x, y) => x + y, 0) / a.length).toFixed(0);
    console.log(`average   careless ${avg(rows.careless)}%   straight ${avg(rows.straight)}%   prepared ${avg(rows.prepared)}%   (aim: under a third, about half, most)`);
  }
  if (fail.length) { console.log('\nFAIL\n  ' + fail.join('\n  ')); process.exit(1); }
  console.log('ok');
})();
