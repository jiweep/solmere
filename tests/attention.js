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
// The third gym (Brann, Cindervale) carries them on again. Brann lights the forge (Sunshine halves Water) and keeps
// a Scrapmonk for Rock: careless fights who blocks the road, straight also catches the Water Echo everyone reaches for
// (a Clawdle on Route 3), prepared talks to Fisher Bo and the cave hiker and uses what they point at: the Rain Call
// Disc behind the little trees and the Rock Slide Disc in the Hollow's tunnel.
// The fourth gym (Mireille, Duskmere) and the fifth (Sigrid, Frostpeak) carry them on; see journey() for who brings what.
//   node tests/attention.js [runs=150] [gym=juniper|ione|brann|mireille|sigrid|all]   (exits 1 if careless wins too often or prepared too rarely)
const { load, CORE } = require('./harness');
const G = load(CORE);
G.rng = new G.RNG(+(process.env.SEED || 20260930));   // seeded, so a result near a threshold doesn't flip from run to run
G.TRAINERS = {}; G.rivalOf = { budling: 'kindlet', kindlet: 'sealet', sealet: 'budling' };
new Function('G', require('fs').readFileSync(require('path').join(__dirname, '../js/story/trainers.js'), 'utf8'))(G);
const N = +(process.argv[2] || 150);
// JUNIPER='[["shroomie",10,{"moves":[...]}],...]' tries another team without editing trainers.js
for (const id of ['juniper', 'ione', 'brann', 'grey1', 'mireille', 'sigrid']) if (process.env[id.toUpperCase()]) G.TRAINERS[id].party = JSON.parse(process.env[id.toUpperCase()]).map(([sp, lvl, x]) => ({ sp, lvl, ...(x || {}) }));
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
  if (gym === 'ione') return team.slice(0, 6).map(m => [m.sp, Math.min(20, m.lvl)]);   // the level cap after one badge (G.LEVEL_CAPS, flow.js)
  beat(team, 'ione');
  // Route 3 and Glimmer Cave: the Kid, the Hiker and the Ace stand on the road, as do the cave's hiker, grunts,
  // scientist and Lark; Wren waits at the cave mouth in Cindervale (gustling 20, voltpup 20, their starter at 22)
  for (const id of ['r3_kid', 'r3_hiker', 'r3_ace', 'gc_hiker', 'gc_grunt1', 'gc_grunt2', 'gc_sci', 'lark1']) beat(team, id);
  for (const [sp, l] of [['gustling', 20], ['voltpup', 20], [G.evoLine(G.rivalOf[starter])[1].id, 22]]) gain(team, sp, l, true);
  const teach = {};
  if (style !== 'careless') team.push(G.mon.create('clawdle', 16));
  if (style === 'prepared') {
    for (const id of ['r3_swim1', 'r3_swim2', 'r3_fisher']) beat(team, id);
    teach.clawdle = ['raincall']; teach.crustank = ['raincall'];
    const g = team.findIndex(m => m.sp === 'shroomie'); if (g >= 0) team.splice(g, 1);   // a Grass Echo stays in the box for a fire gym
    for (const sp of ['digmole', 'terramole']) teach[sp] = ['rockslide'];
  }
  wild(team, style === 'careless' ? 3 : style === 'straight' ? 6 : 12, 1, ['clawdle', 'digmole', 'pebblin', 'gustling'], 15);
  evolve(team); for (const id of ['cg_1', 'cg_2', 'cg_3']) beat(team, id); evolve(team);
  if (style === 'prepared') for (const mv of ['rockslide', 'raincall']) { const c = team.findIndex(m => teach[m.sp] && teach[m.sp][0] === mv); if (c > 0) team.unshift(team.splice(c, 1)[0]); }   // the rain-caller leads, the rock-thrower next
  if (gym === 'brann') return team.slice(0, 6).map(m => [m.sp, Math.min(26, m.lvl), teach[m.sp]]);   // the level cap after two badges
  beat(team, 'brann');
  // Route 4, the Ruins and Duskmere: Rin, Taro and Luz stand on the road, the grunts and Grey in the Ruins. Straight catches
  // what the gold grass throws at it (a Magmite); prepared listened to Vic and the Duskmere kid and brings a Dark Echo
  // (a Duskbat from the Ruins, a Nightwing by the gym) and to Rin: a Normal Echo Hex can't touch (a Snoozle from Route 4).
  for (const id of ['r4_ace', 'r4_bb', 'r4_mystic', 'ru_grunt1', 'ru_grunt2', 'ru_grunt3']) beat(team, id);
  if (style !== 'careless') team.push(G.mon.create('magmite', 24));
  if (style === 'prepared') {
    for (const id of ['r4_hiker', 'r4_punk']) beat(team, id);
    const drop = team.findIndex(m => m.sp === 'magmite'); if (drop >= 0) team.splice(drop, 1);
    team.unshift(G.mon.create('duskbat', 26), G.mon.create('snoozle', 25));   // both come along to the gym, so they lead the list the level cap cuts
  }
  wild(team, style === 'careless' ? 3 : style === 'straight' ? 6 : 12, 1, ['magmite', 'maskling', 'duskbat', 'rascoon'], 24);
  evolve(team);
  if (gym === 'grey1') return team.slice(0, 6).map(m => [m.sp, Math.min(32, m.lvl), teach[m.sp]]);   // Grey is measured, not gated: node tests/attention.js 100 grey1
  beat(team, 'grey1');
  evolve(team); for (const id of ['dg_1', 'dg_2', 'dg_3']) beat(team, id); evolve(team);
  if (gym === 'mireille') return team.slice(0, 6).map(m => [m.sp, Math.min(32, m.lvl), teach[m.sp]]);   // the level cap after three badges
  beat(team, 'mireille');
  // Route 5 and Frostpeak: the swimmers stand in the water lanes, Wren waits at the snow line, the skiers in the gym.
  // Straight catches a Mireel on the way over; prepared listened to Halvard (rain: the Rain Call it already carries, or
  // buys in the specialty shop), Bjorn (the Wall Breaker in the snow by the gym door) and Anya (the bears hate the
  // ground shaking: a Mireel too, for its Ground moves), and fought the two skiers in the village.
  for (const id of ['r5_swim1', 'r5_swim2', 'r5_swim3']) beat(team, id);
  for (const [sp, l] of [['gustling', 35], ['stormhound', 35], ['bouldrok', 36], [G.evoLine(G.rivalOf[starter]).slice(-1)[0].id, 38]]) gain(team, sp, l, true);
  if (style !== 'careless') team.splice(Math.min(team.length, 5), 0, G.mon.create('mireel', 30));
  if (style === 'prepared') {
    for (const id of ['r5_fisher', 'r5_ace', 'fp_skier1', 'fp_skier2']) beat(team, id);
    for (const sp of ['slumbruin', 'snoozle', 'brinewhisk', 'tidalrus', 'pyrolynx', 'solarynx', 'grandmonk']) teach[sp] = [...(teach[sp] || []), 'wallbreaker'];
  }
  wild(team, style === 'careless' ? 3 : style === 'straight' ? 6 : 12, 1, ['pengrost', 'snowlet', 'mireel', 'lillipad'], 30);
  evolve(team); for (const id of ['ig_1', 'ig_2']) beat(team, id); evolve(team);
  if (style === 'prepared') {   // the rain-caller leads, the wall-breakers next, and the Echoes ice cuts through stay home
    const rank = m => (teach[m.sp] || []).includes('raincall') ? 0 : (teach[m.sp] || []).includes('wallbreaker') ? 1 : ['nightwing', 'terramole'].includes(m.sp) ? 3 : 2;
    team.sort((a, b) => rank(a) - rank(b));
  }
  return team.slice(0, 6).map(m => [m.sp, Math.min(39, m.lvl), teach[m.sp]]);   // the level cap after four badges
}
function foe(id) {
  const T = G.TRAINERS[id];
  const party = T.party.map(p => { const m = G.mon.create(p.sp, p.lvl, { ivs: Object.fromEntries(G.STATS.map(s => [s, 16 + (T.boss ? 6 : 0)])), item: p.item || null, abil: p.abil }); if (p.moves) m.moves = p.moves.map(x => G.mon.newMove(x)); return m; });
  // as G.makeTrainerCfg (flow.js): a Warden who can Resonate does it with the last Echo
  return { name: T.name, cls: T.cls, party, controller: G.AI.controller(Math.min(4, T.ai || 2), T), items: { ...(T.items || {}) }, resonance: !!T.resonate, amplified: !!T.amplified, aceUid: T.resonate ? party[party.length - 1].uid : undefined };
}
async function rate(team, ai, items, gym) {
  let won = 0;
  for (let i = 0; i < N; i++) {
    const party = team.map(([sp, l, extra]) => {   // a taught Disc replaces the weakest move
      const m = G.mon.create(sp, l);
      for (const mv of extra || []) { if (m.moves.length < 4) m.moves.push(G.mon.newMove(mv)); else { const w = m.moves.reduce((a, b, i) => (G.MOVES[b.id].pow || 0) < (G.MOVES[m.moves[a].id].pow || 0) ? i : a, 0); m.moves[w] = G.mon.newMove(mv); } }
      return m;
    });
    const player = { name: 'P', party, isPlayer: true, controller: G.AI.controller(ai), items: { ...items }, resonance: gym !== 'juniper' };   // Hale's band comes in Whisperwood
    // a player who went and found the Rain Call Disc uses it the moment the forge is lit or the snow comes down (the bots never weigh weather that high)
    const think = player.controller.decide.bind(player.controller);
    player.controller.decide = (bt, req) => { const rc = req.moves.find(m => m.id === 'raincall' && !m.dis); return (bt.weather === 'sun' || bt.weather === 'snow') && rc ? { type: 'move', moveIdx: rc.idx } : think(bt, req); };
    const bt = new G.Battle({ format: 'single', wild: false, sides: [{ trainers: [player] }, { trainers: [foe(gym)] }], displays: [display], exp: false, env: 'gym' });
    let guard = 0; const run = bt.collectActions.bind(bt); bt.collectActions = async function () { if (++guard > 200) { this.end('draw'); return []; } return run(); };
    if ((await bt.run()).outcome === 'win') won++;
  }
  return won / N;
}
(async () => {
  const fail = [];
  for (const gym of GYM === 'all' ? ['juniper', 'ione', 'brann', 'mireille', 'sigrid'] : [GYM]) {
    const rows = {};
    console.log(`\n${G.TRAINERS[gym].name}: ${G.TRAINERS[gym].party.map(p => p.sp + ' ' + p.lvl).join(', ')}`);
    for (const s of ['budling', 'kindlet', 'sealet']) {
      for (const style of ['careless', 'straight', 'prepared']) {
        const team = journey(s, style, gym), items = style === 'careless' ? {} : gym === 'brann' ? { superpotion: 3 } : gym === 'ione' ? { superpotion: 2 } : { potion: 2 };
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
