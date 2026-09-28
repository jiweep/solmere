// Level curve: the levels a player reaches by just playing (every trainer on the way, a few wild battles and
// sweeps, no grinding), with the EXP Share from the lab, compared with each Warden's team. A gap of more than a
// couple of levels means the game quietly asks for grinding (solmere-game-design rules 9 and 14).
//   node tests/level_curve.js
const { load, CORE } = require('./harness');
const G = load(CORE);
G.TRAINERS = {}; G.rivalOf = { budling: 'kindlet', kindlet: 'sealet', sealet: 'budling' };
new Function('G', require('fs').readFileSync(require('path').join(__dirname, '../js/story/trainers.js'), 'utf8'))(G);
// engine.js awardExp: the Echo that fought gets it all, the rest half (EXP Share); sweeps give half and a quarter
const gainOne = (m, sp, L, trainer, k) => { const b = G.SPECIES[sp].exp; let e = (b * L / 5) * Math.pow((2 * L + 10) / (L + m.lvl + 10), 2.5) + 1; e *= (trainer ? 1.5 : 1) * k; G.mon.addExp(m, Math.max(1, Math.floor(e))); };
const gain = (team, sp, L, trainer, k = 1) => team.forEach((m, i) => gainOne(m, sp, L, trainer, (i === 0 ? 1 : .75) * k));
const beat = (team, id) => { for (const p of G.TRAINERS[id].party) gain(team, p.sp, p.lvl, true); };
const wild = (team, list, lv, n, k = 1) => { for (let i = 0; i < n; i++) gain(team, list[i % list.length], Math.round(lv[0] + (lv[1] - lv[0]) * ((i * 7) % 5) / 4), false, k); };
const report = (tag, team, id) => { const T = G.TRAINERS[id], lv = T.party.map(p => p.lvl), ace = Math.max(...lv); console.log(`${tag.padEnd(36)} team L${team.map(m => m.lvl).join('/')}   ${T.name}: ${lv.join('/')}   lead vs ace: ${team[0].lvl - ace >= 0 ? '+' : ''}${team[0].lvl - ace}`); };
const r1 = ['pipwing', 'nibbit', 'mossbun', 'grubbit'];
for (const [style, wildN, sweepN] of [['light (4 wild fights, 4 sweeps)', 4, 4], ['typical (8 wild, 8 sweeps)', 8, 8], ['thorough (14 wild, 12 sweeps)', 14, 12]]) {
  const team = [G.mon.create('kindlet', 5)];
  const ev = () => team.forEach((m, i) => { const e = (G.SPECIES[m.sp].evo || []).find(x => x.lvl && m.lvl >= x.lvl); if (e) { const o = G.mon.create(e.to, m.lvl); o.exp = m.exp; team[i] = o; } });
  gain(team, 'sealet', 4, true);                                  // rival 1
  team.push(G.mon.create('pipwing', 3));                          // the first catch on Route 1
  beat(team, 'r1_kid'); beat(team, 'r1_lass'); beat(team, 'r1_bug'); beat(team, 'r1_boy');
  wild(team, r1, [3, 6], wildN); wild(team, r1, [3, 6], sweepN, .5);
  team.push(G.mon.create('emberjay', 10));                        // Tamer Mira's gift
  beat(team, 'fg_1'); beat(team, 'fg_2');
  report(style + ' at gym 1', team, 'juniper');
  beat(team, 'juniper'); ev();
  for (const id of ['r2_bug', 'r2_hiker', 'r2_lass', 'r2_twins', 'r2_kid']) beat(team, id);
  wild(team, ['pipwing', 'mossbun', 'grubbit', 'beetlet', 'stingle', 'nibbit'], [6, 9], wildN); wild(team, ['beetlet'], [6, 9], sweepN, .5); ev();
  for (const id of ['ww_bug', 'ww_ranger', 'ww_mystic', 'ww_grunt1', 'ww_grunt2']) beat(team, id);
  wild(team, ['grubbit', 'beetlet', 'shroomie', 'stingle', 'digmole', 'glimmer'], [8, 12], wildN); wild(team, ['shroomie'], [8, 12], sweepN, .5); ev();
  for (const id of ['gv_sailor', 'gv_worker', 'gg_1', 'gg_2', 'gg_3']) beat(team, id); ev();
  report(style + ' at gym 2', team, 'ione');
  console.log('   team: ' + team.map(m => m.sp + ' ' + m.lvl).join(', '));
}
