'use strict';
// ============================================================================
//  Rewards for curiosity (solmere-game-design rule 12): hidden items in each town's dead ends and nooks,
//  found by tools (dead-end tiles: walkable, reachable, one way in), scaled to the point in the story.
//  Plus a few people for long empty stretches. Added to the map definitions before any map is built.
// ============================================================================
(function () {
  const HIDDEN = {
    // (none in Brinehollow or Fernwick: the first hour keeps a few finds that someone points you to)
    galvan: [[15, 36, 'superpotion'], [44, 18, 'greatorb', 2], [1, 31, 'pearl']],
    cindervale: [[30, 33, 'revive'], [2, 2, 'superpotion'], [41, 27, 'nugget']],
    duskmere: [[28, 20, 'duskorb', 2], [2, 16, 'hyperpotion']],
    frostpeak: [[2, 19, 'revive'], [27, 2, 'ultraorb'], [18, 16, 'hyperpotion']],
    skyreach: [[22, 26, 'ppup'], [1, 4, 'ultraorb', 2], [32, 22, 'rarecandy']],
  };
  const PEOPLE = {
    route6: [{ type: 'npc', id: 'r6_castaway', x: 9, y: 10, look: 'fisher', dir: 'down', move: 'look',
      text: 'Swam out here to watch the Lodestar and missed the tide home. Look at it, though. Every night the light turns a little slower. Something out there is waking up.' }],
  };
  for (const id in HIDDEN) {
    const d = G.MAPDEFS[id]; if (!d) continue; d.objs = d.objs || [];
    HIDDEN[id].forEach(([x, y, item, qty], k) => d.objs.push({ type: 'item', id: `${id}_secret${k + 1}`, x, y, item, qty: qty || 1, hidden: true }));
  }
  for (const id in PEOPLE) { const d = G.MAPDEFS[id]; if (d) (d.objs = d.objs || []).push(...PEOPLE[id]); }
  // Story gates (found by tools/goldenpath.js: these roads let a player skip a gym or run the story out of
  // order). Each is a person at the exit plus a row that turns you back, gone once the flag is set.
  const GATES = [
    { map: 'whisperwood', cond: '!wood_done', npc: { id: 'ww_gate', x: 22, y: 2, look: 'ranger', dir: 'down' }, row: { x: 20, y: 3, w: 3, h: 1 }, back: 'up',
      stop: 'Hold on! Something is wrong at the Heartroot Shrine, deeper in the wood. Nobody goes north to Galvan until it\'s safe. Juniper\'s orders.', talk: 'The shrine is south-east of here. Once it\'s safe, the road north to Galvan Harbor is yours.', who: 'Ranger' },
    { map: 'galvan', cond: '!badge2', npc: { id: 'gv_gate', x: 44, y: 12, look: 'sailor', dir: 'down' }, row: { x: 44, y: 13, w: 1, h: 2 }, back: 'right',
      stop: 'Route 3 runs along the sea cliffs, and the wild Echoes out there are fierce. Only Tamers with Warden Ione\'s badge may pass.', talk: 'Warden Ione\'s gym is right here in the harbour. Earn the Current Badge, then Route 3 is open to you.', who: 'Harbour Guard' },
    { map: 'cindervale', cond: '!badge3', npc: { id: 'cv_gate', x: 19, y: 33, look: 'hiker', dir: 'right' }, row: { x: 20, y: 33, w: 4, h: 1 }, back: 'down',
      stop: 'Rockslides on Route 4 again! Brann says nobody goes south without the Forge Badge. Prove yourself at his gym first.', talk: 'Warden Brann\'s forge is the big building in town. His badge, then Route 4.', who: 'Lookout' },
    { map: 'skyreach', cond: '!badge6', npc: { id: 'sk_gate', x: 13, y: 4, look: 'sailor', dir: 'down' }, row: { x: 0, y: 3, w: 34, h: 1 }, back: 'up',
      stop: 'Warden Kaelen has closed the harbour. The Mere around the Lodestar is wild tonight, and nobody sails for it without his Wyrm Badge.', talk: 'The Skyreach Gym is up the hill. Show Kaelen you can handle the Mere, and the harbour is yours.', who: 'Harbour Master' },
  ];
  for (const g of GATES) {
    const d = G.MAPDEFS[g.map]; if (!d) continue; d.objs = d.objs || [];
    d.objs.push({ type: 'npc', ...g.npc, cond: g.cond, script: g.npc.id + '_talk' }, { type: 'trigger', ...g.row, cond: g.cond, script: g.npc.id + '_stop' });
    G.SCRIPTS[g.npc.id + '_talk'] = async S => { S.facePlayer(g.npc.id); await S.say(g.talk, g.who); };
    G.SCRIPTS[g.npc.id + '_stop'] = async S => { await S.say(g.stop, g.who); await S.move('player', { up: 'd', down: 'u', left: 'r', right: 'l' }[g.back], 1); };
  }
})();
