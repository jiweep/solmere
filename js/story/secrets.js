'use strict';
// ============================================================================
//  Rewards for curiosity (solmere-game-design rule 12): hidden items in each town's dead ends and nooks,
//  found by tools (dead-end tiles: walkable, reachable, one way in), scaled to the point in the story.
//  Plus a few people for long empty stretches. Added to the map definitions before any map is built.
// ============================================================================
(function () {
  const HIDDEN = {
    brinehollow: [[21, 24, 'oranberry'], [29, 7, 'orb', 2], [2, 21, 'potion']],
    fernwick: [[7, 34, 'repel'], [28, 14, 'potion', 2], [10, 14, 'greatorb']],
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
})();
