'use strict';
// ============================================================================
//  Maps: Duskmere, Ruins, Route 5, Frostpeak, Mt. Glacia, Skyreach, Crane HQ,
//        Route 6, Tidelight Isle & lighthouse
// ============================================================================
(function () {
  const D = G.defMap;
  // -------------------------------------------------------------- DUSKMERE
  (function () {
    // Lantern Hill (houses, Mart, the path to the Ruins) sits above a mossy retaining wall; the Haven,
    // the Gym and the lamplit lakeside promenade are below, the bridge south crosses the mere
    const m = new G.MB(30, 26, '.', 111);
    m.forest(2, 'T', { skip: (x, y) => (x >= 13 && x <= 16 && y <= 2) || y >= 20 });
    m.rect(0, 20, 30, 1, '.'); m.rect(0, 21, 30, 5, '~'); m.put(0, 20, 'T'); m.put(29, 20, 'T');
    m.rect(23, 0, 7, 4, '#'); m.put(26, 3, 'c');
    m.rect(2, 2, 26, 9, '.'); m.rect(23, 2, 5, 2, '#'); m.put(26, 3, 'c');
    m.path([[13, 0], [13, 19]], ':', 4); m.path([[26, 4], [26, 12]], ':', 2); m.rect(3, 9, 22, 1, ':');
    m.rect(2, 11, 26, 2, '#'); m.rect(14, 11, 2, 2, ':'); m.rect(26, 11, 2, 2, ':');
    m.rect(9, 13, 19, 1, ':'); m.rect(2, 20, 26, 1, 'b');
    m.rect(13, 20, 4, 4, 'I');
    for (const [x, y] of [[12, 6], [17, 6], [12, 15], [17, 15], [8, 18], [21, 19], [3, 19], [27, 18]]) m.put(x, y, 'j');
    m.rect(5, 19, 4, 1, 'f'); m.rect(19, 8, 3, 1, 'f'); m.put(2, 10, 'y'); m.put(20, 10, 'u');
    D({ id: 'duskmere', name: 'Duskmere', subtitle: 'Lanterns on the mist', town: 'duskmere', area: 'duskmere', music: 'duskmere', theme: 'dusk', weather: 'mist', env: 'dusk', grid: m.done(),
      conn: { n: { map: 'route4', off: 3 }, s: { map: 'route5', off: 0 } },
      warps: [{ x: 26, y: 3, to: 'ruins', tx: 11, ty: 19, dir: 'up', kind: 'cave' }],
      enc: { surf: { lv: [26, 30], list: [['lillipad', 40], ['mireel', 30], ['jellume', 20], ['flopfin', 10]] }, fish: { lv: [20, 28], list: [['flopfin', 60], ['mireel', 40]] }, fishpro: { lv: [26, 32], list: [['mireel', 40], ['lillipad', 30], ['riptalon', 10], ['jellume', 20]] } },
      objs: [
        G.haven(3, 14), G.bld('mart', 20, 4, 5, 4, { roof: 'purple', door: 2, to: 'mart', tx: 6, ty: 6 }),
        G.bld('gym', 19, 14, 8, 5, { roof: 'purple', accent: '#8a5ac8', door: 4, to: 'dusk_gym', tx: 7, ty: 14 }),
        G.house(2, 4, 'dusk_house1', 'purple'), G.house(7, 4, 'dusk_house2', 'gray'),
        { type: 'sign', x: 11, y: 14, text: '{p}DUSKMERE{w}\\n"Where the lanterns remember."' },
        { type: 'sign', x: 25, y: 9, text: '↑ Ruins of Echo — Please respect the spirits.' },
        { type: 'sign', x: 18, y: 18, text: '{p}DUSKMERE GYM{w} — Warden: Mireille\\n"Bring your own light."' },
        { type: 'npc', id: 'dm_gguard', x: 23, y: 19, look: 'mystic', dir: 'down', script: 'dusk_gym_guard', cond: '!ruins_done' },
        { type: 'npc', id: 'dm_ode', x: 11, y: 19, look: 'oldman', dir: 'down', script: 'lamplighter' },
        { type: 'npc', id: 'dm_w1', x: 18, y: 9, look: 'woman', dir: 'left', move: 'wander', radius: 2, text: 'The mist never lifts in Duskmere. We light lanterns so lost spirits can find their way home.' },
        { type: 'npc', id: 'dm_rodguy', x: 16, y: 23, look: 'fisher', dir: 'down', script: 'prorod_guy' },
        { type: 'npc', id: 'dm_kid', x: 10, y: 17, look: 'girl', dir: 'up', move: 'look', text: 'My grandma says Wispurr are the ghosts of cats who loved their families too much to leave. I think that\'s nice.' },
        { type: 'sign', id: 'lant1', x: 12, y: 6, invisible: true, script: 'spirit_lantern', lantern: 1 },
        { type: 'sign', id: 'lant2', x: 17, y: 15, invisible: true, script: 'spirit_lantern', lantern: 2 },
        { type: 'sign', id: 'lant3', x: 3, y: 19, invisible: true, script: 'spirit_lantern', lantern: 3 },
        { type: 'sign', id: 'lant4', x: 27, y: 18, invisible: true, script: 'spirit_lantern', lantern: 4 },
        { type: 'item', id: 'dm_h1', x: 2, y: 3, item: 'spelltag', hidden: true },
      ], spawn: [14, 12] });
  })();
  G.defHouse('dusk_house1', 'Duskmere House', 2, [{ type: 'npc', id: 'dh1', x: 6, y: 5, look: 'mystic', dir: 'left', script: 'fortune_teller' }], { wall: 'rose' });
  G.defHouse('dusk_house2', 'Duskmere House', 0, [{ type: 'npc', id: 'dh2', x: 2, y: 4, look: 'oldwoman', dir: 'right', text: 'Twelve years ago the Tidelight flared so bright you could read by it here. Then it went dark for a week. They say a young scientist lost her partner mon that night.' }]);
  D({ id: 'ruins', name: 'Ruins of Echo', subtitle: 'Voices of the old tide', area: 'ruins', type: 'cave', music: 'ruins', env: 'ruins', theme: 'dusk',
    legend: { '=': { g: 'pave', enc: 'cave' }, 'S': { o: 'statue', solid: true }, 'g': { o: 'grave', solid: true } },
    grid: [
      '########################',
      '#########======#########',
      '########==S==S==########',
      '#######====..====#######',
      '######=====..=====######',
      '######==g==..==g==######',
      '######=====..=====######',
      '#####======..======#####',
      '####====S===.==S====####',
      '####=======..=======####',
      '####==###==..==###==####',
      '####==#g#==..==#g#==####',
      '####==###==..==###==####',
      '####=======..=======####',
      '#####=====....=====#####',
      '######====....====######',
      '#######===....===#######',
      '########==....==########',
      '#########......#########',
      '##########....##########',
      '##########.MM.##########',
      '########################'],
    warps: [{ x: 11, y: 20, to: 'duskmere', tx: 26, ty: 4, dir: 'down', kind: 'cave' }, { x: 12, y: 20, to: 'duskmere', tx: 26, ty: 4, dir: 'down', kind: 'cave' }],
    enc: { cave: { lv: [26, 30], list: [['maskling', 25], ['wispurr', 25], ['duskbat', 20], ['coffret', 12], ['gearling', 10], ['snoozle', 8]] } },
    objs: [
      { type: 'trainer', id: 'ru_g1', x: 10, y: 16, look: 'grunt', dir: 'right', sight: 2, trainer: 'ru_grunt1', cond: '!ruins_done' },
      { type: 'trainer', id: 'ru_g2', x: 13, y: 11, look: 'grunt_f', dir: 'left', sight: 2, trainer: 'ru_grunt2', cond: '!ruins_done' },
      { type: 'trainer', id: 'ru_g3', x: 10, y: 6, look: 'grunt', dir: 'right', sight: 2, trainer: 'ru_grunt3', cond: '!ruins_done' },
      { type: 'npc', id: 'ru_grey', x: 11, y: 2, look: 'grey', dir: 'up', script: 'grey1', cond: '!ruins_done' },
      { type: 'trigger', x: 11, y: 4, w: 2, h: 1, script: 'grey1', cond: '!ruins_done' },
      { type: 'sign', x: 12, y: 1, invisible: true, text: 'An empty stone cradle, shaped for a key. Wave patterns are carved all around it. Ancient script reads: "The sea gate opens for the song."' },
      { type: 'sign', x: 8, y: 5, invisible: true, text: 'A worn gravestone: "Here rests Aurel, first Tamer to hear the Tidelight sing."' },
      { type: 'item', id: 'ru_i1', x: 5, y: 9, item: 'duskstone' },
      { type: 'item', id: 'ru_i2', x: 18, y: 9, item: 'tm30' },
      { type: 'item', id: 'ru_trap', x: 7, y: 13, item: 'rarecandy', monTrap: 'coffret', lvl: 28 },
      { type: 'item', id: 'ru_h1', x: 16, y: 13, item: 'maxrevive', hidden: true },
    ], spawn: [11, 19] });
  // Duskmere gym: darkness
  D({ id: 'dusk_gym', name: 'Duskmere Gym', type: 'indoor', music: 'gym', floor: '#2a2440', floor2: '#3a3058', wall: 'gym', env: 'ruins', dark: true,
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' } },
    grid: [
      'WWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWW',
      'j......,......j',
      '.WWWWW.,.WWWWW.',
      '.W...W.,.W...W.',
      '.W.W.W...W.W.W.',
      '...W.......W...',
      'WWWW.WWWWW.WWWW',
      'j....W...W....j',
      '.WWW.W.W.W.WWW.',
      '.....W.W.W.....',
      'WWWW...W...WWWW',
      '.....WWWWW.....',
      '.WWWW.....WWWW.',
      '.......M.......'],
    warps: [{ x: 7, y: 14, to: '_back' }],
    objs: [
      { type: 'npc', id: 'mireille_npc', x: 7, y: 2, look: 'mireille', dir: 'down', script: 'mireille' },
      { type: 'trainer', id: 'dg_1e', x: 0, y: 10, look: 'mystic', dir: 'right', sight: 4, trainer: 'dg_1' },
      { type: 'trainer', id: 'dg_2e', x: 10, y: 6, look: 'mystic', dir: 'left', sight: 3, trainer: 'dg_2' },
      { type: 'trainer', id: 'dg_3e', x: 6, y: 10, look: 'mystic', dir: 'up', sight: 2, trainer: 'dg_3' },
      { type: 'npc', id: 'dg_guide', x: 9, y: 13, look: 'man', dir: 'left', script: 'gym_guide' },
    ], spawn: [7, 13] });
  // --------------------------------------------------------------- ROUTE 5
  (function () {
    const m = new G.MB(30, 46, '~', 121);
    const isle = (cx, cy, rx, ry, grass) => { m.blob(cx, cy, rx + .8, ry + .8, 's'); m.blob(cx, cy, rx, ry, '.'); if (grass) m.blob(cx, cy, rx * .6, ry * .6, '"'); };
    isle(7, 8, 3, 2.4, true); isle(22, 12, 3.5, 2.5, true); isle(10, 20, 2.5, 2, false); isle(21, 26, 3, 3, true); isle(6, 31, 3, 2.5, true);
    m.put(7, 6, 'T'); m.put(24, 11, 'T'); m.put(20, 28, 'T'); m.put(22, 25, 'P'); m.put(4, 31, 'T');
    m.rect(0, 37, 30, 9, '*'); m.rect(0, 36, 30, 1, 's');
    m.forest(2, 'P', { skip: (x, y) => y < 36 || (x >= 12 && x <= 15 && y >= 44) });
    m.path([[12, 37], [12, 45]], ':', 4);
    m.blob(6, 41, 3, 2, '"', { only: '*' }); m.blob(22, 41, 3.5, 2, '"', { only: '*' });
    m.put(18, 39, 'z');
    D({ id: 'route5', name: 'Route 5', subtitle: 'The Misty Mere', area: 'route5', music: 'surf', env: 'water', grid: m.done(),
      conn: { n: { map: 'duskmere', off: 0 }, s: { map: 'frostpeak', off: 0 } },
      legend: { '*': { g: 'snow' }, '"': { g: 'tall', enc: 'grass' } },
      enc: {
        grass: { lv: [28, 32], list: [['oddowl', 20], ['glimmer', 15], ['snoozle', 10], ['lillipad', 20], ['pengrost', 15], ['snowlet', 12], ['shiftail', 8]] },
        surf: { lv: [28, 33], list: [['lillipad', 25], ['mireel', 25], ['jellume', 20], ['clawdle', 15], ['flopfin', 12], ['riptalon', 3]] },
        fish: { lv: [22, 30], list: [['flopfin', 60], ['mireel', 40]] }, fishpro: { lv: [30, 36], list: [['mireel', 30], ['crustank', 25], ['riptalon', 20], ['jellume', 25]] },
        rare: { list: [['shiftail', 2], ['nimbling', 1]] },
      },
      objs: [
        { type: 'trainer', id: 'r5_s1', x: 14, y: 6, look: 'swimmer_f', dir: 'left', sight: 3, trainer: 'r5_swim1' },
        { type: 'trainer', id: 'r5_s2', x: 15, y: 16, look: 'swimmer', dir: 'right', sight: 3, trainer: 'r5_swim2' },
        { type: 'trainer', id: 'r5_s3', x: 14, y: 30, look: 'swimmer_f', dir: 'down', sight: 3, trainer: 'r5_swim3' },
        { type: 'trainer', id: 'r5_f', x: 10, y: 20, look: 'fisher', dir: 'right', sight: 2, trainer: 'r5_fisher' },
        { type: 'trainer', id: 'r5_c', x: 22, y: 26, look: 'lady', dir: 'left', sight: 2, trainer: 'r5_couple' },
        { type: 'trainer', id: 'r5_a', x: 6, y: 30, look: 'ace', dir: 'right', sight: 3, trainer: 'r5_ace' },
        { type: 'npc', id: 'r5_scale', x: 22, y: 13, look: 'girl', dir: 'down', script: 'glowing_scale' },
        { type: 'trigger', x: 12, y: 38, w: 4, h: 1, script: 'rival3', cond: ['badge4', '!rival3_done'] },
        { type: 'sign', x: 17, y: 37, text: '{c}ROUTE 5{w}\\n↑ Duskmere (by water)   ↓ Frostpeak Village' },
        { type: 'item', id: 'r5_i1', x: 8, y: 8, item: 'tm42' },
        { type: 'item', id: 'r5_i2', x: 20, y: 12, item: 'netorb', qty: 3 },
        { type: 'item', id: 'r5_i3', x: 11, y: 20, item: 'mysticwater' },
        { type: 'item', id: 'r5_i4', x: 5, y: 32, item: 'ultraorb', qty: 2 },
        { type: 'item', id: 'r5_i5', x: 25, y: 42, item: 'froststone' },
        { type: 'item', id: 'r5_h1', x: 21, y: 28, item: 'pearl', hidden: true },
        { type: 'item', id: 'r5_h2', x: 9, y: 21, item: 'bottlecap', hidden: true },
      ], spawn: [14, 40] });
  })();
  // ------------------------------------------------------------- FROSTPEAK
  (function () {
    const m = new G.MB(30, 26, '*', 131);
    m.forest(2, 'P', { skip: (x, y) => (x >= 12 && x <= 15 && y <= 1) || (x <= 1 && y >= 10 && y <= 11) });
    m.rect(27, 8, 3, 8, '#'); m.put(28, 12, 'c'); m.put(29, 12, 'c'); m.put(27, 12, ':');
    m.path([[12, 0], [12, 20]], ':', 4); m.path([[0, 10], [27, 10]], ':', 2); m.path([[26, 10], [26, 12], [27, 12]], ':', 2);
    m.put(10, 15, 'z'); m.put(20, 4, 'z'); m.put(11, 6, 'l'); m.put(17, 6, 'l'); m.put(11, 16, 'l'); m.put(17, 16, 'l');
    m.blob(22, 20, 4, 2, 'i'); m.rect(2, 23, 8, 1, '*'); m.put(2, 9, '*');
    D({ id: 'frostpeak', name: 'Frostpeak Village', subtitle: 'Hearths above the clouds', town: 'frostpeak', area: 'frostpeak', music: 'frostpeak', theme: 'snow', weather: 'snow', env: 'snow', grid: m.done(),
      conn: { n: { map: 'route5', off: 0 }, w: { map: 'starfall', off: -14 } },
      warps: [{ x: 29, y: 12, to: 'glaciapass', tx: 1, ty: 14, dir: 'right', kind: 'cave' }, { x: 28, y: 12, to: 'glaciapass', tx: 1, ty: 14, dir: 'right', kind: 'cave' }],
      objs: [
        G.haven(3, 3), G.bld('mart', 18, 12, 5, 4, { roof: 'snow', door: 2, to: 'mart', tx: 6, ty: 6 }),
        G.bld('gym', 18, 3, 8, 5, { roof: 'blue', accent: '#8ad8f8', door: 4, to: 'frost_gym', tx: 7, ty: 15 }),
        G.house(3, 13, 'frost_house1', 'snow'), G.house(3, 19, 'frost_house2', 'brown'),
        { type: 'sign', x: 16, y: 11, text: '{c}FROSTPEAK VILLAGE{w}\\n"Warm hearts, cold toes."' },
        { type: 'sign', x: 26, y: 8, text: '{c}FROSTPEAK GYM{w} — Warden: Sigrid' },
        { type: 'sign', x: 25, y: 13, text: '→ Mt. Glacia Pass · Skyreach City beyond' },
        { type: 'sign', x: 3, y: 9, text: '← Starfall Peak. {r}DANGER{w}: Champions only.' },
        { type: 'npc', id: 'fp_sguard', x: 2, y: 9, look: 'ranger', dir: 'down', script: 'starfall_guard', cond: '!champion' },
        { type: 'trigger', x: 1, y: 10, w: 1, h: 2, script: 'starfall_guard', cond: '!champion' },
        { type: 'npc', id: 'fp_boots', x: 16, y: 20, look: 'veteran', dir: 'up', script: 'grip_boots' },
        { type: 'npc', id: 'fp_kid', x: 20, y: 18, look: 'skier', dir: 'left', move: 'wander', radius: 2, text: 'The pond froze solid! Watch me slide! Wheeee!' },
        { type: 'npc', id: 'fp_w', x: 9, y: 11, look: 'woman', dir: 'down', move: 'look', text: 'Crane Dynamics trucks drove through the pass last week. Heading for Skyreach, loaded with glowing crystals.' },
        { type: 'trainer', id: 'fp_s1', x: 22, y: 21, look: 'skier', dir: 'left', sight: 3, trainer: 'fp_skier1' },
        { type: 'trainer', id: 'fp_s2', x: 8, y: 17, look: 'skier', dir: 'right', sight: 3, trainer: 'fp_skier2' },
        { type: 'item', id: 'fp_h1', x: 27, y: 22, item: 'nevermeltice', hidden: true },
      ], spawn: [13, 11] });
  })();
  G.defHouse('frost_house1', 'Elder Vesna\'s House', 0, [{ type: 'npc', id: 'vesna', x: 7, y: 5, look: 'oldwoman', dir: 'left', script: 'elder_vesna' }], { wall: 'wood' });
  G.defHouse('frost_house2', 'Frostpeak House', 1, [{ type: 'npc', id: 'fh2', x: 1, y: 5, look: 'skier', dir: 'right', script: 'trade_npc_frost' }], { wall: 'wood' });
  // Frostpeak gym: ice sliding
  D({ id: 'frost_gym', name: 'Frostpeak Gym', type: 'indoor', music: 'gym', floor: '#c8e0f0', floor2: '#a8c8e0', wall: 'blue', env: 'snow',
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' }, 'i': { g: 'ice', ice: true }, 'R': { o: 'rock', solid: true, gnd: 'ice' } },
    grid: [
      'WWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWW',
      'W......,......W',
      'WiiiiiiiiiiiiiW',
      'WiiRiiiiiiiRiiW',
      'WiiiiiiiiiiiiiW',
      'WRiiiiiRiiiiiiW',
      'WiiiiiiiiiiiiRW',
      'WiiiiRiiiiiiiiW',
      'WiiiiiiiiRiiiiW',
      'WiRiiiiiiiiiiiW',
      'WiiiiiiiiiiiRiW',
      'W......,......W',
      'W.............W',
      'W,,,,,,,,,,,,,W',
      'W......M......W'],
    warps: [{ x: 7, y: 15, to: '_back' }],
    objs: [
      { type: 'npc', id: 'sigrid_npc', x: 7, y: 2, look: 'sigrid', dir: 'down', script: 'sigrid' },
      { type: 'trainer', id: 'ig_1e', x: 1, y: 13, look: 'skier', dir: 'right', sight: 3, trainer: 'ig_1' },
      { type: 'trainer', id: 'ig_2e', x: 13, y: 2, look: 'skier', dir: 'left', sight: 4, trainer: 'ig_2' },
      { type: 'npc', id: 'ig_guide', x: 10, y: 14, look: 'man', dir: 'left', script: 'gym_guide' },
    ], spawn: [7, 14] });
  // ----------------------------------------------------------- MT. GLACIA
  (function () {
    const m = new G.MB(40, 28, '#', 141);
    m.rect(0, 13, 8, 3, '*'); m.rect(6, 5, 3, 11, '*'); m.rect(6, 5, 12, 3, '*'); m.rect(15, 5, 3, 18, '*'); m.rect(15, 20, 10, 3, '*');
    m.rect(22, 8, 3, 15, '*'); m.rect(22, 8, 12, 3, '*'); m.rect(31, 8, 3, 11, '*'); m.rect(31, 16, 9, 3, '*');
    // ice field
    m.rect(8, 16, 7, 8, 'i'); m.rect(8, 16, 1, 8, '*'); m.put(11, 18, 'R'); m.put(13, 21, 'R'); m.put(10, 22, 'R'); m.put(14, 17, 'R');
    // boulder puzzle across the top corridor
    m.put(10, 6, 'B'); m.put(13, 6, 'o'); m.put(13, 5, '#'); m.put(13, 7, '#');
    m.put(27, 9, 'B'); m.put(29, 9, 'o'); m.put(29, 8, '#'); m.put(29, 10, '#');
    m.blob(4, 22, 3, 3, '*'); m.rect(4, 16, 2, 6, '*');
    m.blob(36, 24, 3, 2.5, '*'); m.rect(35, 18, 2, 5, '*');
    m.put(36, 22, 'k'); m.put(3, 20, 'k');
    D({ id: 'glaciapass', name: 'Mt. Glacia Pass', subtitle: 'The frozen corridor', area: 'glaciapass', type: 'cave', music: 'icecave', theme: 'snow', env: 'snow', grid: m.done(),
      warps: [{ x: 0, y: 13, to: 'frostpeak', tx: 27, ty: 12, dir: 'left', kind: 'cave' }, { x: 0, y: 14, to: 'frostpeak', tx: 27, ty: 12, dir: 'left', kind: 'cave' }, { x: 0, y: 15, to: 'frostpeak', tx: 27, ty: 12, dir: 'left', kind: 'cave' },
        { x: 39, y: 16, to: 'skyreach', tx: 32, ty: 14, dir: 'left', kind: 'cave' }, { x: 39, y: 17, to: 'skyreach', tx: 32, ty: 14, dir: 'left', kind: 'cave' }, { x: 39, y: 18, to: 'skyreach', tx: 32, ty: 14, dir: 'left', kind: 'cave' }],
      enc: { cave: { lv: [34, 38], list: [['icicub', 20], ['pengrost', 18], ['bouldrok', 15], ['duskbat', 12], ['nightwing', 8], ['armadrill', 10], ['snowlet', 12], ['nimbling', 5]] } },
      objs: [
        { type: 'trainer', id: 'mg_h', x: 16, y: 11, look: 'hiker', dir: 'left', sight: 1, trainer: 'mg_hiker' },
        { type: 'trainer', id: 'mg_a', x: 24, y: 15, look: 'ace_f', dir: 'left', sight: 2, trainer: 'mg_ace' },
        { type: 'trainer', id: 'mg_v', x: 33, y: 13, look: 'veteran', dir: 'left', sight: 2, trainer: 'mg_vet' },
        { type: 'npc', id: 'mg_tip', x: 7, y: 14, look: 'hiker', dir: 'down', text: 'Big boulders block the pass. Grip Boots let you shove them into the holes. If you mess up, step outside and they reset!' },
        { type: 'item', id: 'mg_i1', x: 4, y: 22, item: 'tm13' },
        { type: 'item', id: 'mg_i2', x: 36, y: 25, item: 'maxrevive' },
        { type: 'item', id: 'mg_i3', x: 12, y: 23, item: 'nevermeltice' },
        { type: 'item', id: 'mg_h1', x: 23, y: 21, item: 'rarecandy', hidden: true },
      ], spawn: [2, 14] });
  })();
  // --------------------------------------------------------------- SKYREACH
  (function () {
    const m = new G.MB(34, 28, '=', 151);
    m.rect(0, 0, 34, 4, '~'); m.rect(14, 0, 4, 4, 'I');
    m.forest(1, 'T', { skip: (x, y) => y < 4 || (x >= 32 && y >= 13 && y <= 15) });
    m.rect(0, 4, 34, 1, '='); m.put(0, 4, 'T'); m.put(33, 4, 'T');
    m.rect(32, 12, 2, 5, '#'); m.put(33, 14, 'c'); m.put(32, 14, '=');
    m.rect(10, 22, 14, 4, '.'); m.rect(11, 23, 3, 2, 'f'); m.rect(20, 23, 3, 2, 'f'); m.put(17, 23, 'S');
    for (const [x, y] of [[9, 12], [24, 12], [9, 20], [24, 20]]) m.put(x, y, 'l');
    D({ id: 'skyreach', name: 'Skyreach City', subtitle: 'The city above the clouds', town: 'skyreach', area: 'skyreach', music: 'skyreach', env: 'city', grid: m.done(),
      conn: { n: { map: 'route6', off: 2 } },
      warps: [{ x: 33, y: 14, to: 'glaciapass', tx: 38, ty: 17, dir: 'left', kind: 'cave' }],
      objs: [
        G.bld('tower', 12, 5, 9, 6, { door: 4, to: 'hq1', tx: 7, ty: 12 }),
        G.bld('gym', 23, 5, 8, 5, { roof: 'purple', accent: '#6f35fc', door: 4, to: 'sky_gym', tx: 7, ty: 17 }),
        G.haven(3, 6), G.bld('mart', 3, 14, 5, 4, { roof: 'blue', door: 2, to: 'skymart', tx: 6, ty: 6 }),
        G.bld('lab', 25, 14, 6, 4, { roof: 'purple', door: 3, to: 'spire', tx: 6, ty: 8 }),
        G.house(11, 14, 'sky_house1', 'gray'), G.house(18, 14, 'sky_house2', 'teal'),
        { type: 'sign', x: 22, y: 12, text: '{p}SKYREACH CITY{w}\\n"Reach higher."' },
        { type: 'sign', x: 30, y: 11, text: '{p}SKYREACH GYM{w} — Warden: Kaelen\\n"The storm bows to no one."' },
        { type: 'sign', x: 11, y: 11, text: '{c}CRANE DYNAMICS HEADQUARTERS{w}' },
        { type: 'sign', x: 31, y: 18, text: 'BATTLE SPIRE — Opens to Champions.' },
        { type: 'npc', id: 'sk_gguard', x: 27, y: 10, look: 'dragontamer', dir: 'down', script: 'sky_gym_guard', cond: '!hq_done' },
        { type: 'npc', id: 'sk_wren', x: 16, y: 12, look: 'wren', dir: 'down', script: 'hq_wren', cond: ['badge5', '!hq_started'] },
        { type: 'trigger', x: 13, y: 13, w: 7, h: 1, script: 'hq_wren', cond: ['badge5', '!hq_started'] },
        { type: 'npc', id: 'sk_sailor', x: 15, y: 4, look: 'sailor', dir: 'up', script: 'sky_sailor' },
        { type: 'npc', id: 'sk_w1', x: 20, y: 19, look: 'gentleman', dir: 'left', move: 'wander', radius: 2, text: 'Skyreach is the richest city in Solmere. Crane Dynamics pays for everything. Everything has a price, of course.' },
        { type: 'npc', id: 'sk_w2', x: 7, y: 21, look: 'lady', dir: 'right', move: 'look', text: 'Warden Kaelen used to be Champion, you know. Before Sable. They say he still flies his Tempestral over the Mere at dawn.' },
        { type: 'npc', id: 'sk_kid', x: 26, y: 21, look: 'kid', dir: 'down', move: 'wander', radius: 2, text: 'A Link Cord makes Bouldrok evolve! The Skyreach shop sells them. I saved up for a whole year!' },
        { type: 'item', id: 'sk_h1', x: 1, y: 25, item: 'dragonfang', hidden: true },
      ], spawn: [16, 17] });
  })();
  D({ id: 'skymart', name: 'Skyreach Supply', type: 'indoor', wall: 'lab', music: 'mart', canRun: true,
    grid: ['WWWwWWWWWwWWW', 'WWWWWWWWWWWWW', 'KKK...QQ.QQ..', '.K...........', '.K...QQ..QQ..', '.............', 'V..QQ...QQ..V', '......M......'],
    warps: [{ x: 6, y: 7, to: '_back' }],
    objs: [
      { type: 'npc', id: 'clerk', x: 0, y: 3, look: 'clerk', dir: 'right', script: 'mart_clerk' },
      { type: 'npc', id: 'clerk2', x: 0, y: 5, look: 'clerk', dir: 'right', script: 'sky_special' },
      { type: 'npc', id: 'skm1', x: 9, y: 5, look: 'ace', dir: 'up', text: 'Held items change everything at high levels. A Life Gem on a fast attacker? Chef\'s kiss.' },
    ], spawn: [6, 6] });
  G.defHouse('sky_house1', 'Skyreach House', 1, [{ type: 'npc', id: 'skh1', x: 7, y: 5, look: 'scientist', dir: 'left', script: 'iv_judge' }]);
  G.defHouse('sky_house2', 'Skyreach House', 2, [{ type: 'npc', id: 'skh2', x: 3, y: 5, look: 'oldman', dir: 'right', script: 'hidden_power_guy' }]);
  // Crane HQ
  D({ id: 'hq1', name: 'Crane HQ — Lobby', type: 'indoor', wall: 'lab', music: 'hq', floor: '#b8c4d4', canRun: true, env: 'hq', noEscape: false,
    legend: { 'E': { g: 'metal' } },
    grid: [
      'WWWWWWwWWWWWWWW',
      'WWWWWWWWWWWWWWW',
      'q.qq...EE...qqq',
      '...............',
      'KKKKK.....KKKKK',
      '...............',
      '.S...........S.',
      ',,,,,,,,,,,,,,,',
      '..q.........q..',
      ',,,,,,,,,,,,,,,',
      'V.............V',
      ',,,,,,,,,,,,,,,',
      '.......M.......'],
    warps: [{ x: 7, y: 12, to: '_back' }, { x: 7, y: 2, to: 'hq2', tx: 7, ty: 13, dir: 'down', cond: 'hq_card' }, { x: 8, y: 2, to: 'hq2', tx: 7, ty: 13, dir: 'down', cond: 'hq_card' }],
    objs: [
      { type: 'trainer', id: 'hq_g1e', x: 2, y: 5, look: 'grunt', dir: 'right', sight: 4, trainer: 'hq_grunt1', cond: '!hq_done' },
      { type: 'trainer', id: 'hq_g2e', x: 11, y: 8, look: 'grunt_f', dir: 'left', sight: 4, trainer: 'hq_grunt2', cond: '!hq_done' },
      { type: 'npc', id: 'hq_lift', x: 6, y: 2, look: 'grunt', dir: 'down', script: 'hq_elevator_guard', cond: '!hq_card' },
      { type: 'npc', id: 'hq_recep', x: 7, y: 4, look: 'clerk', dir: 'down', script: 'hq_recep' },
    ], spawn: [7, 11], onEnter: 'hq1_enter' });
  D({ id: 'hq2', name: 'Crane HQ — Director\'s Floor', type: 'indoor', wall: 'lab', music: 'hq', floor: '#9aa8bc', floor2: '#7a88a0', canRun: true, env: 'hq',
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' } },
    grid: [
      'WWWWwWWWWWwWWWW',
      'WWWWWWWWWWWWWWW',
      'q..dd..,..dd..q',
      '.......,.......',
      '..S....,....S..',
      'WWWWWW.,.WWWWWW',
      'q.q...........q',
      '...............',
      'WWWW.WWWWW.WWWW',
      '.q...q...q...q.',
      '...............',
      'WWWWWW...WWWWWW',
      '.......,.......',
      '.......E.......'],
    legend2: null,
    warps: [{ x: 7, y: 13, to: 'hq1', tx: 7, ty: 3, dir: 'down' }],
    objs: [
      { type: 'trainer', id: 'hq_s1e', x: 1, y: 10, look: 'scientist', dir: 'right', sight: 3, trainer: 'hq_sci1', cond: '!hq_done' },
      { type: 'trainer', id: 'hq_g3e', x: 12, y: 9, look: 'grunt', dir: 'left', sight: 2, trainer: 'hq_grunt3', cond: '!hq_done' },
      { type: 'trainer', id: 'hq_s2e', x: 13, y: 6, look: 'scientist', dir: 'left', sight: 4, trainer: 'hq_sci2', cond: '!hq_done' },
      { type: 'npc', id: 'hq_grey', x: 6, y: 5, look: 'grey', dir: 'down', script: 'hq_admins', cond: '!hq_admins_done' },
      { type: 'npc', id: 'hq_lark', x: 8, y: 5, look: 'lark', dir: 'down', script: 'hq_admins', cond: '!hq_admins_done' },
      { type: 'npc', id: 'hq_crane', x: 7, y: 2, look: 'crane', dir: 'down', script: 'hq_crane', cond: '!hq_done' },
      { type: 'npc', id: 'hq_kaelen', x: 2, y: 3, look: 'kaelen', dir: 'right', script: 'hq_kaelen', cond: '!hq_done' },
      { type: 'trigger', x: 6, y: 6, w: 3, h: 1, script: 'hq_admins', cond: '!hq_admins_done' },
    ], spawn: [7, 12] });
  // Skyreach gym: the dragon hall (gauntlet)
  D({ id: 'sky_gym', name: 'Skyreach Gym', type: 'indoor', music: 'gym', floor: '#4a3a7a', floor2: '#5a4a90', wall: 'gym', env: 'sky',
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' } },
    grid: [
      'WWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWW',
      'S.....,,,.....S',
      '.......,.......',
      'S......,......S',
      '.......,.......',
      'S......,......S',
      '.......,.......',
      'S......,......S',
      '.......,.......',
      'S......,......S',
      '.......,.......',
      'S......,......S',
      '.......,.......',
      'S......,......S',
      '...............',
      '.......,.......',
      '.......M.......'],
    warps: [{ x: 7, y: 17, to: '_back' }],
    objs: [
      { type: 'npc', id: 'kaelen_npc', x: 7, y: 2, look: 'kaelen', dir: 'down', script: 'kaelen' },
      { type: 'trainer', id: 'sg_1e', x: 5, y: 13, look: 'dragontamer', dir: 'right', sight: 2, trainer: 'sg_1' },
      { type: 'trainer', id: 'sg_2e', x: 9, y: 9, look: 'dragontamer', dir: 'left', sight: 2, trainer: 'sg_2' },
      { type: 'trainer', id: 'sg_3e', x: 5, y: 5, look: 'dragontamer', dir: 'right', sight: 2, trainer: 'sg_3' },
      { type: 'npc', id: 'sg_guide', x: 10, y: 16, look: 'man', dir: 'left', script: 'gym_guide' },
    ], spawn: [7, 16] });
  D({ id: 'spire', name: 'Battle Spire', type: 'indoor', wall: 'gym', music: 'spire', floor: '#3a3060', floor2: '#4a4078', canRun: true,
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' } },
    grid: ['WWWWWWWWWWWWW', 'WWWWWWWWWWWWW', 'S....,,,....S', '.KKK.....KKK.', '.............', 'S...........S', '.....,,,.....', '.............', '......M......'],
    warps: [{ x: 6, y: 8, to: '_back' }],
    objs: [
      { type: 'npc', id: 'spire_recep', x: 2, y: 2, look: 'clerk', dir: 'down', script: 'spire_recep' },
      { type: 'npc', id: 'spire_ex', x: 10, y: 2, look: 'clerk', dir: 'down', script: 'spire_exchange' },
      { type: 'npc', id: 'spire_fan', x: 3, y: 6, look: 'ace', dir: 'right', text: 'Every Spire battle is at Lv. 50, no matter what. Pure strategy!' },
    ], spawn: [6, 7] });
  // --------------------------------------------------------------- ROUTE 6
  (function () {
    const m = new G.MB(32, 38, '~', 161);
    const isle = (cx, cy, rx, ry) => { m.blob(cx, cy, rx + .8, ry + .8, 's'); m.blob(cx, cy, rx, ry, '.'); };
    isle(8, 28, 3, 2); isle(24, 18, 3, 2.5); isle(10, 9, 2.5, 2);
    for (const [x, y] of [[4, 20], [20, 30], [27, 8], [14, 16], [5, 4], [26, 34]]) m.put(x, y, 'R');
    m.put(8, 27, 'Y'); m.put(24, 17, 'Y');
    D({ id: 'route6', name: 'Route 6', subtitle: 'Heart of the Mere', area: 'route6', music: 'surf', env: 'water', grid: m.done(),
      conn: { s: { map: 'skyreach', off: -2 }, n: { map: 'tidelight', off: 3 } },
      enc: { surf: { lv: [38, 44], list: [['jellume', 25], ['crustank', 20], ['riptalon', 15], ['lilyking', 12], ['mireel', 15], ['tidetail', 3], ['bogmaw', 10]] }, fish: { lv: [30, 38], list: [['flopfin', 50], ['crustank', 30], ['mireel', 20]] }, fishpro: { lv: [38, 46], list: [['riptalon', 40], ['crustank', 30], ['jellume', 30]] } },
      objs: [
        { type: 'trainer', id: 'r6_sail', x: 8, y: 29, look: 'sailor', dir: 'up', sight: 3, trainer: 'r6_sailor' },
        { type: 'trainer', id: 'r6_s1', x: 18, y: 24, look: 'swimmer_f', dir: 'left', sight: 4, trainer: 'r6_swim1' },
        { type: 'trainer', id: 'r6_s2', x: 12, y: 18, look: 'swimmer', dir: 'right', sight: 4, trainer: 'r6_swim2' },
        { type: 'trainer', id: 'r6_a', x: 24, y: 19, look: 'ace', dir: 'left', sight: 3, trainer: 'r6_ace' },
        { type: 'trainer', id: 'r6_g', x: 16, y: 8, look: 'grunt', dir: 'down', sight: 4, trainer: 'r6_grunt', cond: '!tidelight_done' },
        { type: 'item', id: 'r6_i1', x: 10, y: 8, item: 'tm27' },
        { type: 'item', id: 'r6_i2', x: 25, y: 18, item: 'maxpotion', qty: 2 },
        { type: 'item', id: 'r6_h2', x: 11, y: 10, item: 'goldcap', hidden: true },
      ], spawn: [8, 28] });
  })();
  // ----------------------------------------------------------- TIDELIGHT
  (function () {
    const m = new G.MB(26, 24, '~', 171);
    m.blob(12.5, 11, 10, 8.5, 's'); m.blob(12.5, 10.5, 8.6, 7, '.');
    m.rect(11, 17, 4, 7, 's'); m.rect(12, 18, 2, 6, 'I');
    m.path([[12, 17], [12, 8]], ':', 2);
    m.blob(6, 9, 2.4, 2, '"', { only: '.' }); m.blob(19, 12, 2.4, 2, '"', { only: '.' });
    for (const [x, y] of [[5, 5], [20, 5], [4, 13], [21, 9], [7, 15], [18, 15]]) m.put(x, y, 'Y');
    m.put(10, 9, 'l'); m.put(15, 9, 'l');
    D({ id: 'tidelight', name: 'Tidelight Isle', subtitle: 'Heart of the Mere', town: 'tidelight', area: 'tidelight', music: () => G.flag('tidelight_done') ? 'tidelight_calm' : 'tidelight', theme: 'beach', env: 'lighthouse', grid: m.done(),
      conn: { s: { map: 'route6', off: -3 } },
      enc: { grass: { lv: [42, 46], list: [['galeclaw', 20], ['hootsage', 20], ['luminelle', 15], ['cinderwing', 15], ['bogmaw', 15], ['chimelle', 15]] }, surf: { lv: [40, 45], list: [['jellume', 40], ['riptalon', 30], ['crustank', 30]] } },
      objs: [
        G.bld('lighthouse', 11, 3, 4, 4, { door: 1, to: 'lh1', tx: 6, ty: 11 }),
        { type: 'npc', id: 'tl_g1', x: 10, y: 11, look: 'grunt', dir: 'right', script: 'tl_grunt', cond: '!tidelight_done' },
        { type: 'npc', id: 'tl_g2', x: 15, y: 11, look: 'grunt_f', dir: 'left', script: 'tl_grunt', cond: '!tidelight_done' },
        { type: 'npc', id: 'tl_hale', x: 9, y: 14, look: 'hale', dir: 'right', script: 'tl_hale', cond: 'tidelight_done' },
        { type: 'sign', x: 14, y: 16, text: '{c}TIDELIGHT ISLE{w}\\nThe lighthouse at the heart of the Mere.' },
        { type: 'item', id: 'tl_h1', x: 20, y: 13, item: 'tidestone', hidden: true },
      ], spawn: [12, 15] });
  })();
  const LH = { type: 'indoor', wall: 'stone', floor: '#8a8e9a', floor2: '#6a6e7a', env: 'lighthouse', music: () => G.flag('tidelight_done') ? 'tidelight_calm' : 'lighthouse', legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' } }, noEscape: true };
  D({ id: 'lh1', name: 'Tidelight Lighthouse 1F', ...LH,
    grid: ['WWWWWWWWWWWWW', 'WWWWWWWWWWWWW', 'q.q.......^.q', '.............', '..,,,,,,,,,..', '..,.......,..', '..,.q...q.,..', '..,.......,..', '..,,,,,,,,,..', '.............', 'o...........k', '......M......'],
    legend: { ...LH.legend, 'k': { o: 'crate', solid: true } },
    warps: [{ x: 6, y: 11, to: 'tidelight', tx: 12, ty: 7, dir: 'down' }, { x: 10, y: 2, to: 'lh2', tx: 8, ty: 2, dir: 'left' }],
    objs: [
      { type: 'trainer', id: 'lh_g1e', x: 1, y: 7, look: 'grunt', dir: 'right', sight: 4, trainer: 'lh_grunt1', cond: '!tidelight_done' },
      { type: 'trainer', id: 'lh_g2e', x: 11, y: 5, look: 'grunt_f', dir: 'left', sight: 4, trainer: 'lh_grunt2', cond: '!tidelight_done' },
      { type: 'npc', id: 'lh_grey', x: 9, y: 2, look: 'grey', dir: 'down', script: 'lh_grey', cond: '!lh_grey_done' },
      { type: 'item', id: 'lh1_i', x: 0, y: 3, item: 'fullrestore' },
    ], spawn: [6, 10] });
  D({ id: 'lh2', name: 'Tidelight Lighthouse 2F', ...LH,
    grid: ['WWWWWWWWWWWWW', 'WWWWWWWWWWWWW', 'q.^......v..q', '.............', '.WWWW...WWWW.', '.W.........W.', '.W.q.....q.W.', '.W.........W.', '.WWWW...WWWW.', '.............', 'q...........q'],
    warps: [{ x: 9, y: 2, to: 'lh1', tx: 10, ty: 3, dir: 'down' }, { x: 2, y: 2, to: 'lhtop', tx: 6, ty: 9, dir: 'up', cond: 'lh_lark_done' }],
    objs: [
      { type: 'trainer', id: 'lh_se', x: 6, y: 9, look: 'scientist', dir: 'up', sight: 3, trainer: 'lh_sci', cond: '!tidelight_done' },
      { type: 'npc', id: 'lh_lark', x: 3, y: 2, look: 'lark', dir: 'down', script: 'lh_lark', cond: '!lh_lark_done' },
      { type: 'item', id: 'lh2_i', x: 6, y: 6, item: 'maxrevive' },
    ], spawn: [9, 3] });
  D({ id: 'lhtop', name: 'Tidelight Summit', ...LH, dark: false, env: 'lighthouse',
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' }, 'E': { o: 'machine', solid: true, light: 'screen' }, 'O': { o: 'statue', solid: true } },
    grid: ['nnnnnnnnnnnnn', 'nnnnnnnnnnnnn', 'nnnnnEOEnnnnn', 'nn..E...E..nn', 'n...........n', 'n...,,,,,...n', 'n...,...,...n', 'n...,,,,,...n', 'n...........n', 'nn.........nn', 'nnnnn.^.nnnnn'],
    warps: [{ x: 6, y: 10, to: 'lh2', tx: 2, ty: 3, dir: 'down' }],
    objs: [
      { type: 'npc', id: 'top_crane', x: 6, y: 4, look: 'crane', dir: 'up', script: 'top_crane', cond: '!tidelight_done' },
      { type: 'trigger', x: 4, y: 7, w: 5, h: 1, script: 'top_crane', cond: '!tidelight_done' },
    ], spawn: [6, 9] });
})();
