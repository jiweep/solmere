'use strict';
// ============================================================================
//  Maps: Victory Road, the Conclave, Starfall Peak (post-game)
// ============================================================================
(function () {
  const D = G.defMap;
  // ---------------------------------------------------------- VICTORY ROAD
  (function () {
    const m = new G.MB(36, 32, '#', 181);
    m.rect(3, 26, 6, 5, '.'); m.rect(5, 31, 2, 1, '.');
    m.rect(4, 14, 3, 12, '.'); m.rect(4, 14, 14, 3, '.'); m.rect(15, 6, 3, 11, '.'); m.rect(15, 6, 16, 3, '.'); m.rect(28, 0, 3, 9, '.');
    m.put(8, 15, 'B'); m.put(12, 15, 'o'); m.put(12, 14, '#'); m.put(12, 16, '#');
    m.put(22, 7, 'B'); m.put(25, 7, 'o'); m.put(25, 6, '#'); m.put(25, 8, '#');
    m.blob(25, 17, 7, 5, '.'); m.blob(25, 17, 5.2, 3.4, '~'); m.blob(25, 17, 1.6, 1.2, '.'); m.rect(18, 15, 3, 2, '.');
    m.blob(10, 22, 3, 2.5, '.'); m.rect(7, 22, 2, 2, '.'); m.put(11, 23, 'r'); m.put(9, 21, 'k'); m.put(31, 20, 'k'); m.put(19, 20, 'k');
    m.rect(29, 24, 4, 4, '.'); m.rect(30, 21, 2, 3, '.');
    m.put(3, 27, 'R'); m.put(8, 29, 'R');
    D({ id: 'victoryroad', name: 'Victory Road', subtitle: 'The last trial', area: 'victoryroad', type: 'cave', music: 'victoryroad', env: 'cave', grid: m.done(),
      warps: [{ x: 5, y: 31, to: 'victorygate', tx: 5, ty: 1, dir: 'down', kind: 'cave' }, { x: 6, y: 31, to: 'victorygate', tx: 5, ty: 1, dir: 'down', kind: 'cave' },
        { x: 28, y: 0, to: 'conclave', tx: 9, ty: 16, dir: 'up', kind: 'cave' }, { x: 29, y: 0, to: 'conclave', tx: 9, ty: 16, dir: 'up', kind: 'cave' }, { x: 30, y: 0, to: 'conclave', tx: 9, ty: 16, dir: 'up', kind: 'cave' }],
      enc: { cave: { lv: [44, 48], list: [['craggolem', 10], ['bouldrok', 15], ['nightwing', 18], ['terramole', 15], ['scarabrute', 12], ['grandmonk', 10], ['stratowyrm', 5], ['armadrill', 15]] }, surf: { lv: [44, 48], list: [['riptalon', 40], ['crustank', 30], ['bogmaw', 30]] }, rock: { lv: [45, 47], list: [['bouldrok', 60], ['armadrill', 40]] } },
      objs: [
        { type: 'trainer', id: 'vr1', x: 4, y: 20, look: 'ace', dir: 'right', sight: 2, trainer: 'vr_ace1' },
        { type: 'trainer', id: 'vr2', x: 15, y: 11, look: 'ace_f', dir: 'right', sight: 2, trainer: 'vr_ace2' },
        { type: 'trainer', id: 'vr3', x: 20, y: 6, look: 'veteran', dir: 'down', sight: 2, trainer: 'vr_vet' },
        { type: 'trainer', id: 'vr4', x: 30, y: 5, look: 'blackbelt', dir: 'left', sight: 2, trainer: 'vr_bb' },
        { type: 'trainer', id: 'vr5', x: 25, y: 17, look: 'dragontamer', dir: 'left', sight: 0, trainer: 'vr_dt' },
        { type: 'trigger', x: 28, y: 3, w: 3, h: 1, script: 'rival4', cond: '!rival4_done' },
        { type: 'item', id: 'vr_i1', x: 10, y: 23, item: 'fullrestore' },
        { type: 'item', id: 'vr_i2', x: 31, y: 26, item: 'tm48' },
        { type: 'item', id: 'vr_i3', x: 26, y: 17, item: 'maxrevive' },
        { type: 'item', id: 'vr_i4', x: 17, y: 16, item: 'ultraorb', qty: 3 },
        { type: 'item', id: 'vr_h1', x: 8, y: 27, item: 'rarecandy', hidden: true },
      ], spawn: [5, 29] });
  })();
  // --------------------------------------------------------------- CONCLAVE
  (function () {
    const m = new G.MB(20, 18, '=', 191);
    m.forest(2, 'T', { skip: (x, y) => y >= 16 && x >= 8 && x <= 11 });
    m.rect(8, 16, 4, 2, '=');
    for (const [x, y] of [[4, 10], [15, 10], [4, 14], [15, 14]]) m.put(x, y, 'l');
    m.rect(3, 12, 2, 2, 'f'); m.rect(15, 12, 2, 2, 'f'); m.rect(5, 2, 10, 6, '=');
    D({ id: 'conclave', name: 'The Conclave', subtitle: 'Where legends are tested', town: 'conclave', area: 'conclave', music: 'conclave', env: 'league', grid: m.done(),
      warps: [{ x: 8, y: 17, to: 'victoryroad', tx: 29, ty: 1, dir: 'down', kind: 'cave' }, { x: 9, y: 17, to: 'victoryroad', tx: 29, ty: 1, dir: 'down', kind: 'cave' }, { x: 10, y: 17, to: 'victoryroad', tx: 29, ty: 1, dir: 'down', kind: 'cave' }, { x: 11, y: 17, to: 'victoryroad', tx: 29, ty: 1, dir: 'down', kind: 'cave' }],
      objs: [
        G.bld('gym', 5, 2, 10, 6, { roof: 'purple', accent: '#f4d040', door: 5, to: 'conclave_lobby', tx: 6, ty: 7 }),
        { type: 'sign', x: 12, y: 9, text: '{y}THE CONCLAVE{w}\\n"Here the Tidelight\'s finest are tested, and remembered."' },
        { type: 'npc', id: 'cc_vet', x: 6, y: 12, look: 'veteran', dir: 'right', move: 'look', text: 'Beyond those doors, there\'s no turning back. Four of the Conclave, then the Champion. Heal up and stock up!' },
      ], spawn: [9, 13] });
  })();
  const room = (id, name, floor, floor2, elite, next, flag, music, wall = 'gym') => D({
    id, name, type: 'indoor', wall, music, floor, floor2, env: 'league', noEscape: true,
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' } },
    grid: ['WWWWW,WWWWW', 'WWWWW,WWWWW', 'S....,....S', '.....,.....', 'S....,....S', '.....,.....', 'S....,....S', '.....,.....', 'S....,....S', '.....,.....'],
    warps: [{ x: 5, y: 0, to: next, tx: 5, ty: 8, dir: 'up', cond: flag }],
    objs: [{ type: 'npc', id: 'elite_' + id, x: 5, y: 2, look: G.TRAINERS[elite] ? G.TRAINERS[elite].look : 'ace', dir: 'down', script: 'elite_battle', elite, flag }],
    spawn: [5, 8], onEnter: 'elite_room_enter',
  });
  D({ id: 'conclave_lobby', name: 'Conclave Hall', type: 'indoor', wall: 'gym', music: 'conclave', floor: '#3a3068', floor2: '#4a4088', canRun: true,
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' } },
    grid: ['WWWWWW,WWWWWW', 'WWWWWW,WWWWWW', 'V.....,.....V', 'KHK...,...KKK', '......,......', 'S.....,.....S', '......,......', '......M......'],
    warps: [{ x: 6, y: 7, to: 'conclave', tx: 10, ty: 8, dir: 'down' }, { x: 6, y: 0, to: 'e1', tx: 5, ty: 8, dir: 'up', cond: 'league_entered' }],
    objs: [
      { type: 'npc', id: 'nurse', x: 1, y: 2, look: 'nurse', dir: 'down', script: 'nurse' },
      { type: 'npc', id: 'cl_shop', x: 11, y: 2, look: 'clerk', dir: 'down', script: 'league_shop' },
      { type: 'npc', id: 'cl_guard', x: 6, y: 2, look: 'officer', dir: 'down', script: 'league_guard' },
    ], spawn: [6, 6] });
  room('e1', 'Conclave — Chamber of Stone', '#6a4a3a', '#7a5a48', 'rook', 'e2', 'e1_done', 'elite_room', 'stone');
  room('e2', 'Conclave — Chamber of Visions', '#8a4a7a', '#a05a90', 'seraphine', 'e3', 'e2_done', 'elite_room', 'rose');
  room('e3', 'Conclave — Chamber of Shadow', '#1e1a2a', '#2a2438', 'nyx', 'e4', 'e3_done', 'elite_room', 'gym');
  room('e4', 'Conclave — Chamber of Steel', '#6a707e', '#7e8494', 'ferrum', 'champ', 'e4_done', 'elite_room', 'stone');
  D({ id: 'champ', name: 'Champion\'s Sanctum', type: 'indoor', wall: 'gym', music: 'champ_room', floor: '#2a2a5a', floor2: '#3a3a7a', env: 'league', noEscape: true,
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' }, 'G': { o: 'statue', solid: true } },
    grid: ['WWWWWW,WWWWWW', 'WWWWWW,WWWWWW', 'G.....,.....G', '......,......', 'G.....,.....G', '......,......', '......,......', 'G.....,.....G', '......,......', '......,......', 'G.....,.....G', '......,......'],
    warps: [{ x: 6, y: 0, to: 'hof', tx: 6, ty: 8, dir: 'up', cond: 'champion' }],
    objs: [{ type: 'npc', id: 'sable_npc', x: 6, y: 2, look: 'sable', dir: 'down', script: 'champion_sable', cond: '!champion_scene_done' }],
    spawn: [6, 10] });
  D({ id: 'hof', name: 'Hall of Fame', type: 'indoor', wall: 'gym', music: 'halloffame', floor: '#e8c860', floor2: '#f4d880', env: 'league', noEscape: true,
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' }, 'G': { o: 'statue', solid: true } },
    grid: ['WWWWWWWWWWWWW', 'WWWWWWWWWWWWW', 'G....qqq....G', '.............', 'G...........G', '.............', 'G...........G', '.............', '.............'],
    warps: [], objs: [], spawn: [6, 8], onEnter: 'hall_of_fame' });
  // ---------------------------------------------------------- STARFALL PEAK
  (function () {
    const m = new G.MB(26, 30, '*', 201);
    m.forest(2, 'P', { skip: (x, y) => x >= 24 && y >= 24 && y <= 25 });
    m.path([[25, 24], [17, 24], [17, 18], [6, 18], [6, 10], [14, 10], [14, 3]], ':', 2);
    m.rect(11, 1, 8, 4, '*'); m.put(14, 2, 'S');
    m.blob(19, 11, 4, 3, '.'); m.blob(19, 11, 2.2, 1.6, 'a');
    m.rect(8, 21, 6, 1, 'v'); m.rect(2, 14, 4, 1, 'v');
    m.blob(8, 26, 3, 2, '"', { only: '*' }); m.blob(20, 20, 2, 2, '"', { only: '*' }); m.blob(10, 6, 2, 2, '"', { only: '*' });
    m.scatter('R', 6, 3, 3, 20, 24, '*'); m.rect(19, 25, 4, 3, '*');
    D({ id: 'starfall', name: 'Starfall Peak', subtitle: 'Where the comet fell', area: 'starfall', music: 'starfall', theme: 'snow', weather: 'snow', env: 'snow', grid: m.done(),
      conn: { e: { map: 'frostpeak', off: 14 } },
      legend: { 'a': { g: 'ash' } },
      enc: { grass: { lv: [55, 62], list: [['glaciursa', 20], ['frostemper', 20], ['aurorelle', 15], ['tempestral', 3], ['stratowyrm', 12], ['nightwing', 15], ['craggolem', 15]] }, rare: { list: [['tempestral', 2], ['shiftail', 2]] } },
      objs: [
        { type: 'npc', id: 'sf_wanderer', x: 14, y: 3, look: 'wanderer', dir: 'down', script: 'wanderer', cond: '!wanderer_done' },
        { type: 'npc', id: 'sf_nyx', x: 19, y: 11, monSprite: 'nyxalis', dir: 'left', script: 'nyxalis_encounter', cond: ['champion', '!nyxalis_done'] },
        { type: 'sign', x: 22, y: 23, text: '{c}STARFALL PEAK{w}\\nWhere a comet fell, long ago. The stars seem... dimmer here.' },
        { type: 'item', id: 'sf_i1', x: 3, y: 12, item: 'abilitypatch' },
        { type: 'item', id: 'sf_i2', x: 21, y: 27, item: 'goldcap' },
        { type: 'item', id: 'sf_h1', x: 8, y: 7, item: 'dawnstone', hidden: true },
      ], spawn: [22, 24] });
  })();
})();
