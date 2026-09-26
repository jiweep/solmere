'use strict';
// ============================================================================
//  Maps: Galvan Harbor, Route 3, Glimmer Cave, Cindervale, Route 4
// ============================================================================
(function () {
  const D = G.defMap;
  // -------------------------------------------------------- GALVAN HARBOR
  (function () {
    // A port city in two tiers. Up on the seawall: three piers, the quay promenade, the Crane Dynamics
    // tower, the museum, the fountain plaza where Crane speaks, the Gym on its own square and the
    // boulevard east to Route 3. A grand staircase (and a service ramp) drop to the market town: a round
    // garden plaza with radial walks, the Haven, Mart, bike shop and houses, a canal with three bridges,
    // a small park, and the south road to Whisperwood.
    const m = new G.MB(46, 38, '=', 61);
    m.rect(0, 0, 46, 4, '~'); m.rect(6, 1, 2, 3, 'I'); m.rect(22, 1, 2, 3, 'I'); m.rect(37, 1, 2, 3, 'I');
    m.forest(1, 'T', { skip: (x, y) => y < 4 || (x >= 44 && y >= 13 && y <= 14) || (x >= 20 && x <= 23 && y >= 36) });
    m.put(0, 4, 'T'); m.put(45, 4, 'T');
    // harbour quarter
    for (const x of [4, 12, 28, 34, 42]) m.put(x, 5, 'l');
    m.rect(21, 9, 3, 2, 'o'); m.put(19, 8, 'y'); m.put(25, 8, 'y'); m.put(18, 11, 'u'); m.put(26, 11, 'u');
    m.rect(9, 12, 4, 1, 'f'); m.rect(27, 12, 3, 1, 'f'); m.text(40, 6, ['QO', 'O ']); m.put(29, 9, 'T'); m.put(39, 10, 'T');
    for (const x of [8, 16, 28, 36, 42]) m.put(x, 15, 'l');
    // the seawall: grand staircase in the middle, a service ramp in the east
    m.rect(1, 16, 44, 2, '#'); m.rect(20, 16, 4, 2, '='); m.rect(40, 16, 2, 2, '=');
    // market town: the round garden plaza
    m.blob(22, 23, 3.2, 2.2, 'f'); m.rect(21, 22, 3, 3, 'o'); m.put(18, 21, 'T'); m.put(26, 21, 'T'); m.put(18, 25, 'T'); m.put(26, 25, 'T');
    m.put(16, 23, 'u'); m.put(28, 23, 'u'); m.put(15, 20, 'l'); m.put(29, 20, 'l'); m.put(15, 26, 'l'); m.put(29, 26, 'l');
    m.put(2, 24, 'Q'); m.put(2, 25, 'O'); m.put(9, 25, 'y'); m.put(35, 25, 'y');
    // the canal and its bridges
    m.rect(1, 28, 44, 1, '~'); m.rect(4, 28, 2, 1, 'b'); m.rect(20, 28, 4, 1, 'b'); m.rect(38, 28, 2, 1, 'b');
    // south: a park and the road out
    m.rect(11, 30, 8, 5, '.'); m.rect(12, 31, 3, 2, 'f'); m.put(11, 30, 'T'); m.put(18, 30, 'T'); m.put(11, 34, 'T'); m.put(18, 34, 'T'); m.put(16, 32, 'u');
    m.rect(26, 30, 8, 5, '.'); m.rect(29, 31, 3, 2, 'f'); m.put(26, 30, 'T'); m.put(33, 30, 'T'); m.put(26, 34, 'T'); m.put(33, 34, 'T');
    m.rect(20, 29, 4, 9, ':');
    D({ id: 'galvan', name: 'Galvan Harbor', subtitle: 'City of sparks and sails', town: 'galvan', area: 'galvan', music: 'galvan', env: 'city', borders: { n: 'water' }, grid: m.done(),
      conn: { s: { map: 'whisperwood', off: 1 }, e: { map: 'route3', off: 3 } },
      enc: { surf: { lv: [15, 20], list: [['flopfin', 50], ['clawdle', 30], ['jellume', 20]] }, fish: { lv: [10, 18], list: [['flopfin', 70], ['clawdle', 30]] }, fishpro: { lv: [18, 26], list: [['clawdle', 40], ['jellume', 35], ['flopfin', 20], ['riptalon', 5]] } },
      objs: [
        G.bld('tower', 2, 7, 6, 5, { door: 3, to: 'crane_lobby', tx: 6, ty: 7 }),
        G.bld('lab', 10, 8, 6, 4, { roof: 'brown', door: 3, to: 'museum', tx: 6, ty: 7 }),
        G.bld('gym', 31, 7, 8, 5, { roof: 'orange', accent: '#f4d040', door: 4, to: 'galvan_gym', tx: 7, ty: 15 }),
        G.haven(3, 19), G.mart(10, 19),
        G.bld('house', 30, 19, 5, 4, { roof: 'teal', door: 2, to: 'bikeshop', tx: 5, ty: 6 }),
        G.house(37, 19, 'galvan_house1', 'gray'), G.house(3, 30, 'galvan_house2', 'brown'), G.house(38, 30, 'galvan_house3', 'blue'),
        { type: 'sign', x: 19, y: 19, text: '{b}GALVAN HARBOR{w}\\n"Where the current carries you."' },
        { type: 'sign', x: 39, y: 12, text: '{y}GALVAN GYM{w}\\nWarden: Ione\\n"Feel the current, drop the beat!"' },
        { type: 'sign', x: 8, y: 12, text: '{c}CRANE DYNAMICS{w} — Galvan Office\\n"Bonds Built to Last."' },
        { type: 'sign', x: 16, y: 12, text: 'Galvan Harbor Museum of Natural History. Fossil Revival Lab inside!' },
        { type: 'sign', x: 24, y: 34, text: '↓ Whisperwood    → Route 3' },
        { type: 'sign', x: 30, y: 27, text: '{c}THE OLD CANAL{w}\\nPaper-boat races every Sunday. No Echoes in the water, please.' },
        { type: 'npc', id: 'gv_marv', x: 7, y: 3, look: 'fisher', dir: 'up', script: 'old_salt_marv' },
        { type: 'npc', id: 'gv_rhoda', x: 9, y: 34, look: 'oldwoman', dir: 'left', script: 'rhoda' },
        { type: 'npc', id: 'gv_w1', x: 13, y: 25, look: 'worker', dir: 'right', move: 'wander', radius: 3, text: 'Crane built the power plant, the docks, the tram... This city runs on Crane. Now they want our bonds too. Tell me that\'s normal.' },
        { type: 'npc', id: 'gv_w2', x: 41, y: 9, look: 'woman', dir: 'left', move: 'look', text: 'Director Crane was a brilliant scientist before she ran the company. She never smiles in photos. Like she\'s waiting for someone.' },
        { type: 'npc', id: 'gv_kid', x: 22, y: 32, look: 'kid', dir: 'down', move: 'wander', radius: 2, text: 'Zipsquee glide between the power poles at night! Their cheeks glow like fireflies! My score\'s 12. I don\'t care. I love my Zipsquee.' },
        { type: 'npc', id: 'gv_canal', x: 27, y: 27, look: 'sailor', dir: 'down', move: 'look', text: 'Kids race paper boats down the canal every Sunday. Crane wants to pave it over for a Chorus billboard. Over my soggy body.' },
        { type: 'npc', id: 'gv_vsr', x: 8, y: 24, look: 'officer', dir: 'right', script: 'vsrecorder_npc' },
        { type: 'npc', id: 'gv_quay', x: 30, y: 5, look: 'gentleman', dir: 'up', move: 'look', text: 'The ferries used to run out to the Lodestar. Nobody\'s gone out there in twelve years. Nobody talks about why.' },
        { type: 'trainer', id: 'gv_sailor_e', x: 23, y: 3, look: 'sailor', dir: 'down', sight: 1, trainer: 'gv_sailor' },
        { type: 'trainer', id: 'gv_worker_e', x: 42, y: 24, look: 'worker', dir: 'left', sight: 3, trainer: 'gv_worker' },
        { type: 'trigger', x: 14, y: 13, w: 18, h: 2, script: 'crane_speech', cond: '!crane_speech' },
        { type: 'item', id: 'gv_h1', x: 44, y: 6, item: 'magnet', hidden: true },
        { type: 'item', id: 'gv_i1', x: 40, y: 10, item: 'xspeed', qty: 2 },
      ], spawn: [22, 19] });
  })();
  G.defHouse('galvan_house1', 'Galvan House', 0, [{ type: 'npc', id: 'gh1', x: 2, y: 5, look: 'scientist', dir: 'right', script: 'ev_trainer' }]);
  G.defHouse('galvan_house2', 'Galvan House', 2, [{ type: 'npc', id: 'gh2', x: 6, y: 4, look: 'woman', dir: 'down', script: 'move_tutor' }]);
  G.defHouse('galvan_house3', 'Galvan House', 1, [{ type: 'npc', id: 'gh3', x: 7, y: 5, look: 'oldman', dir: 'left', script: 'trade_npc_galvan' }]);
  D({ id: 'bikeshop', name: 'Spoke & Sprocket Bikes', type: 'indoor', wall: 'blue', music: 'mart', grid: G.tpl.house(0).map((r, i) => i === 2 ? 'QQ..K......' : r), warps: [{ x: 5, y: 7, to: '_back' }],
    objs: [{ type: 'npc', id: 'bikeguy', x: 4, y: 3, look: 'punk', dir: 'down', script: 'bike_shop' }], spawn: [5, 6] });
  D({ id: 'crane_lobby', name: 'Crane Dynamics — Galvan Office', type: 'indoor', wall: 'lab', music: 'crane', floor: '#dfe6ee', canRun: true,
    grid: ['WWwWWwWWwWWwW', 'WWWWWWWWWWWWW', 'V.qq.KKK.qq.V', '.............', '.S.........S.', ',,,,,,,,,,,,,', ',,,,,,,,,,,,,', '......M......'],
    warps: [{ x: 6, y: 7, to: '_back' }],
    objs: [
      { type: 'npc', id: 'cl_recep', x: 6, y: 3, look: 'clerk', dir: 'down', script: 'crane_reception' },
      { type: 'npc', id: 'cl_sci', x: 3, y: 5, look: 'scientist', dir: 'right', move: 'look', text: 'Our Chorus bands measure Resonance in real time! Soon every Tamer in Solmere will wear one! The terms of service are... thorough.' },
      { type: 'npc', id: 'cl_g', x: 10, y: 5, look: 'grunt', dir: 'left', text: 'I\'m security. Just security. Nothing to see here. Especially not in the basement. Forget I said basement.' },
      { type: 'sign', x: 1, y: 4, invisible: true, text: 'A display: "The Chorus Initiative — harmonizing every bond in Solmere." A diagram shows the Lodestar wired to a massive machine.' },
    ], spawn: [6, 6] });
  D({ id: 'museum', name: 'Galvan Harbor Museum', type: 'indoor', wall: 'wood', music: 'lab', floor: '#c8b8a0', canRun: true,
    grid: ['WWpWWpWWpWWpW', 'WWWWWWWWWWWWW', 'S..S..q..S..S', '.............', '..Y.......Y..', '.............', ',,,,,,,,,,,,,', '......M......'],
    warps: [{ x: 6, y: 7, to: '_back' }],
    objs: [
      { type: 'npc', id: 'orla', x: 6, y: 3, look: 'scientist', dir: 'down', script: 'dr_orla' },
      { type: 'sign', x: 0, y: 2, invisible: true, text: 'Exhibit: The Great Pterock. Its shriek could shatter glass. Revived specimens are, thankfully, much friendlier.' },
      { type: 'sign', x: 3, y: 2, invisible: true, text: 'Exhibit: Raptorix skull. A Claw Fossil holds the memory of its terrible bite.' },
      { type: 'sign', x: 9, y: 2, invisible: true, text: 'Exhibit: "The Lodestar Legend." A mural shows a luminous whale singing beneath a lighthouse while Echoes and people hold hands.' },
      { type: 'sign', x: 12, y: 2, invisible: true, text: 'Exhibit: The Starfall Comet. Centuries ago a comet crashed north of Frostpeak. Locals say something came with it.' },
      { type: 'npc', id: 'mu_v', x: 2, y: 5, look: 'gentleman', dir: 'up', text: 'The mural says Orrelume\'s song IS Resonance. Poetic nonsense or ancient science? The gift shop sells mugs for both.' },
    ], spawn: [6, 6] });
  // Galvan gym: switch barriers
  D({ id: 'galvan_gym', name: 'Galvan Gym', type: 'indoor', music: 'gym', floor: '#3a4458', floor2: '#4a5470', wall: 'gym', env: 'gym',
    legend: { 'E': { o: 'barrier', solidIf: '!gsw_a' }, 'F': { o: 'barrier2', solidIf: '!gsw_b' }, 'a': { g: 'switch', sw: 'gsw_a' }, 'b': { g: 'switch', sw: 'gsw_b' }, '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' } },
    grid: [
      'WWWWWWWWWWWWWWW',
      'WWWWWWWWWWWWWWW',
      'q......,......q',
      '.......,.......',
      'WWWWWWWFWWWWWWW',
      'W.............W',
      'W.q.........q.W',
      'W......b......W',
      'W.............W',
      'WWWWWWWEWWWWWWW',
      'q.............q',
      '...............',
      '.a.............',
      ',,,,,,,,,,,,,,,',
      '.....,,,,,.....',
      '.......M.......'],
    warps: [{ x: 7, y: 15, to: '_back' }],
    objs: [
      { type: 'npc', id: 'ione_npc', x: 7, y: 2, look: 'ione', dir: 'down', script: 'ione' },
      { type: 'trainer', id: 'gg_1e', x: 13, y: 11, look: 'punk', dir: 'left', sight: 4, trainer: 'gg_1' },
      { type: 'trainer', id: 'gg_2e', x: 1, y: 5, look: 'punk', dir: 'right', sight: 4, trainer: 'gg_2' },
      { type: 'trainer', id: 'gg_3e', x: 13, y: 8, look: 'scientist', dir: 'left', sight: 4, trainer: 'gg_3' },
      { type: 'npc', id: 'gg_guide', x: 9, y: 14, look: 'man', dir: 'left', script: 'gym_guide' },
    ], spawn: [7, 14] });
  // --------------------------------------------------------------- ROUTE 3
  (function () {
    const m = new G.MB(48, 22, '.', 71);
    m.rect(0, 0, 48, 4, '~'); m.rect(0, 4, 48, 2, 's'); m.blob(20, 3, 6, 2.5, '~');
    m.forest(2, 'T', { skip: (x, y) => y < 6 || (x <= 1 && y >= 10 && y <= 11) });
    m.path([[0, 10], [10, 10], [10, 15], [24, 15], [24, 9], [34, 9], [34, 13], [43, 13]], ':', 2);
    m.blob(15, 11, 3, 2, '"', { only: '.' }); m.blob(30, 17, 5, 2.5, '"', { only: '.' }); m.blob(6, 16, 3, 3, '"', { only: '.' }); m.blob(38, 8, 3, 2, '"', { only: '.' });
    m.rect(16, 7, 6, 1, 'v'); m.rect(26, 12, 6, 1, 'v');
    // cliff block with cave at the east end
    m.rect(42, 6, 6, 16, '#'); m.rect(44, 12, 2, 3, 'c');
    m.put(45, 12, '#'); m.put(44, 14, '#'); m.put(45, 14, '#'); m.put(45, 13, '#');
    m.rect(42, 12, 2, 3, ':'); m.put(44, 13, 'c');
    m.put(37, 17, 't'); m.put(37, 18, 't'); m.rect(38, 16, 3, 4, '.'); m.rect(36, 19, 1, 2, 'T');
    m.scatter('T', 10, 3, 7, 38, 13); m.scatter(',', 10, 3, 6, 38, 14);
    m.put(12, 4, 'Y'); m.put(33, 5, 'Y'); m.put(40, 4, 'Y');
    D({ id: 'route3', name: 'Route 3', subtitle: 'The Sunward Cliffs', area: 'route3', music: 'route3', theme: 'beach', env: 'beach', grid: m.done(),
      conn: { w: { map: 'galvan', off: -3 } },
      warps: [{ x: 44, y: 13, to: 'glimmercave', tx: 2, ty: 15, dir: 'right', kind: 'cave' }],
      enc: {
        grass: { lv: [14, 17], list: [['clawdle', 18], ['gustling', 16], ['digmole', 18], ['zipsquee', 16], ['lillipad', 14], ['pipwing', 10], ['stingle', 8]] },
        night: { lv: [14, 17], list: [['rascoon', 25], ['duskbat', 20], ['digmole', 18], ['oddowl', 17], ['zipsquee', 12], ['jellume', 8]] },
        rare: { list: [['shiftail', 2], ['armadrill', 1], ['snoozle', 1]] },
        surf: { lv: [16, 20], list: [['jellume', 35], ['clawdle', 30], ['flopfin', 25], ['lillipad', 10]] },
        fish: { lv: [12, 18], list: [['flopfin', 65], ['clawdle', 35]] }, fishpro: { lv: [18, 24], list: [['jellume', 40], ['clawdle', 30], ['flopfin', 25], ['riptalon', 5]] },
      },
      objs: [
        { type: 'sign', x: 3, y: 9, text: '{b}ROUTE 3{w} — The Sunward Cliffs\\n→ Glimmer Cave · Cindervale beyond' },
        { type: 'trainer', id: 'r3_swim1_e', x: 10, y: 2, look: 'swimmer', dir: 'down', sight: 3, trainer: 'r3_swim1' },
        { type: 'trainer', id: 'r3_swim2_e', x: 29, y: 2, look: 'swimmer_f', dir: 'down', sight: 3, trainer: 'r3_swim2' },
        { type: 'trainer', id: 'r3_fisher_e', x: 20, y: 6, look: 'fisher', dir: 'up', sight: 0, trainer: 'r3_fisher' },
        { type: 'trainer', id: 'r3_hiker_e', x: 18, y: 17, look: 'hiker', dir: 'up', sight: 2, trainer: 'r3_hiker' },
        { type: 'trainer', id: 'r3_ace_e', x: 36, y: 11, look: 'ace_f', dir: 'left', sight: 3, trainer: 'r3_ace' },
        { type: 'trainer', id: 'r3_kid_e', x: 26, y: 7, look: 'kid', dir: 'down', sight: 2, trainer: 'r3_kid' },
        { type: 'npc', id: 'r3_old', x: 8, y: 7, look: 'oldman', dir: 'down', move: 'look', text: 'The cave ahead sings when the wind blows. Crystals, they say. People in gray coats keep hauling crates out. Very quietly. Very loudly.' },
        { type: 'item', id: 'r3_i1', x: 39, y: 18, item: 'tm40' },
        { type: 'item', id: 'r3_i2', x: 45, y: 5, item: 'stardust' },
        { type: 'item', id: 'r3_i3', x: 3, y: 17, item: 'greatorb', qty: 3 },
        { type: 'item', id: 'r3_h1', x: 22, y: 4, item: 'pearl', hidden: true },
        { type: 'item', id: 'r3_h2', x: 39, y: 19, item: 'nugget', hidden: true },
      ], spawn: [3, 10] });
  })();
  // --------------------------------------------------------- GLIMMER CAVE
  (function () {
    const m = new G.MB(38, 30, '#', 81);
    m.rect(0, 14, 9, 3, '.'); m.rect(6, 6, 3, 9, '.'); m.rect(6, 6, 14, 3, '.'); m.rect(17, 6, 3, 16, '.'); m.rect(17, 19, 12, 3, '.');
    m.rect(26, 9, 3, 13, '.'); m.rect(26, 9, 10, 3, '.'); m.blob(31, 15, 4.2, 3.6, ','); m.rect(34, 14, 4, 3, '.');
    m.put(35, 14, 'r'); m.put(35, 15, 'r'); m.put(35, 16, 'r'); m.put(35, 13, '#'); m.put(35, 17, '#'); m.put(34, 13, '#'); m.put(34, 17, '#');
    m.rect(7, 16, 2, 6, '.'); m.blob(10, 23, 4, 2.8, '.');
    m.rect(20, 12, 2, 2, '.'); m.blob(23, 13, 3, 2.4, '.'); m.blob(24, 13, 1.4, 1.2, '~');
    m.rect(11, 4, 2, 2, '.'); m.blob(12, 3, 3.4, 1.6, '.');
    for (const [x, y] of [[8, 12], [11, 21], [13, 23], [19, 6], [28, 20], [35, 10], [28, 13], [33, 18], [6, 8]]) m.put(x, y, 'k');
    m.put(9, 15, 'R'); m.put(18, 12, 'R');
    D({ id: 'glimmercave', name: 'Glimmer Cave', subtitle: 'The singing crystals', area: 'glimmercave', type: 'cave', music: 'cave', crystal: true, env: 'crystal', grid: m.done(),
      warps: [0, 1, 2].flatMap(k => [{ x: 0, y: 14 + k, to: 'route3', tx: 43, ty: 13, dir: 'left', kind: 'cave' }, { x: 37, y: 14 + k, to: 'cindervale', tx: 2, ty: 18, dir: 'right', kind: 'cave' }]),
      enc: { cave: { lv: [16, 20], list: [['pebblin', 25], ['duskbat', 25], ['digmole', 18], ['gearling', 12], ['armadrill', 6], ['magmite', 8], ['coffret', 6]] }, rock: { lv: [17, 21], list: [['pebblin', 70], ['armadrill', 30]] }, surf: { lv: [18, 22], list: [['jellume', 60], ['mireel', 40]] } },
      objs: [
        { type: 'trainer', id: 'gc_hiker_e', x: 6, y: 11, look: 'hiker', dir: 'right', sight: 2, trainer: 'gc_hiker' },
        { type: 'trainer', id: 'gc_g1', x: 13, y: 6, look: 'grunt', dir: 'down', sight: 2, trainer: 'gc_grunt1' },
        { type: 'trainer', id: 'gc_g2', x: 19, y: 15, look: 'grunt_f', dir: 'left', sight: 2, trainer: 'gc_grunt2' },
        { type: 'trainer', id: 'gc_sci_e', x: 28, y: 17, look: 'scientist', dir: 'left', sight: 2, trainer: 'gc_sci' },
        { type: 'npc', id: 'gc_lark', x: 34, y: 15, look: 'lark', dir: 'left', script: 'lark1', cond: '!lark1_done' },
        { type: 'npc', id: 'gc_rocco', x: 30, y: 17, look: 'hiker', dir: 'up', script: 'rocco_hammer' },
        { type: 'npc', id: 'gc_dig', x: 10, y: 24, look: 'scientist', dir: 'up', script: 'fossil_dig' },
        { type: 'item', id: 'gc_i1', x: 12, y: 2, item: 'hardstone' },
        { type: 'item', id: 'gc_i2', x: 24, y: 11, item: 'tm39' },
        { type: 'item', id: 'gc_i3', x: 8, y: 21, item: 'escaperope' },
        { type: 'item', id: 'gc_trap', x: 14, y: 3, item: 'nugget', monTrap: 'coffret', lvl: 19 },
        { type: 'item', id: 'gc_h1', x: 18, y: 20, item: 'stardust', hidden: true },
        { type: 'item', id: 'gc_h2', x: 30, y: 12, item: 'rarecandy', hidden: true },
        { type: 'trigger', x: 32, y: 12, w: 1, h: 7, script: 'lark1', cond: '!lark1_done' },
      ], spawn: [2, 15] });
  })();
  // ----------------------------------------------------------- CINDERVALE
  (function () {
    // Three shelves up the volcano's flank. Top: the Forge between two glowing lava channels, lava
    // pools and lanterns. A wall and stair down to the middle shelf: the cave mouth from Glimmer Cave,
    // the Haven and Mart, a smiths' market and a statue square. A second wall down to the valley floor:
    // an open-air hot spring ringed with rocks (it steams), the bathhouse, homes and the road south.
    const m = new G.MB(44, 36, 'a', 91);
    m.forest(2, 'X', { skip: (x, y) => (x >= 20 && x <= 23 && y >= 34) || (x <= 1 && y >= 17 && y <= 19) });
    m.rect(0, 0, 44, 2, '#');
    // the Forge shelf
    m.rect(2, 2, 40, 10, 'a'); m.rect(20, 7, 4, 5, '='); m.rect(15, 2, 1, 8, 'm'); m.rect(28, 2, 1, 8, 'm');
    m.blob(9, 4, 2.2, 1.3, 'm'); m.blob(36, 4, 2.2, 1.3, 'm'); m.put(13, 8, 'j'); m.put(30, 8, 'j'); m.put(12, 3, 'j'); m.put(33, 3, 'j');
    m.rect(4, 10, 16, 1, ':'); m.rect(24, 10, 14, 1, ':'); m.put(2, 3, 'R'); m.put(41, 7, 'R'); m.put(39, 10, 'R'); m.text(34, 7, ['QO']);
    // first wall: the main stair and a ramp in the east
    m.rect(2, 12, 40, 2, '#'); m.rect(20, 12, 4, 2, '='); m.rect(38, 12, 2, 2, ':');
    // middle shelf
    m.rect(2, 14, 40, 11, 'a'); m.rect(0, 16, 2, 5, '#'); m.rect(0, 17, 2, 3, 'c');
    m.rect(2, 17, 18, 2, ':'); m.rect(20, 14, 4, 22, ':'); m.rect(24, 14, 15, 1, ':'); m.rect(38, 14, 2, 1, ':');
    m.rect(27, 19, 12, 4, '='); m.put(32, 20, 'S'); m.put(27, 19, 'l'); m.put(38, 19, 'l'); m.put(27, 22, 'j'); m.put(38, 22, 'j');
    m.put(27, 16, 'p'); m.put(30, 16, 'p'); m.put(33, 16, 'p'); m.put(36, 16, 'Q'); m.put(37, 16, 'O');
    m.rect(3, 24, 38, 1, ':'); m.put(18, 15, 'j'); m.put(25, 16, 'l'); m.put(10, 15, 'R');
    // second wall: the main stair and a west stair
    m.rect(2, 25, 40, 2, '#'); m.rect(20, 25, 4, 2, '='); m.rect(8, 25, 2, 2, ':');
    // valley floor: the hot spring
    m.rect(2, 27, 40, 7, 'a'); m.blob(29, 31, 4.6, 2, '~');
    for (const [x, y] of [[24, 30], [24, 32], [34, 29], [34, 33], [27, 29], [31, 33]]) m.put(x, y, 'R');
    m.rect(3, 32, 38, 1, ':'); m.put(17, 28, 'j'); m.put(26, 28, 'l'); m.put(3, 27, 'X');
    D({ id: 'cindervale', name: 'Cindervale', subtitle: 'Forge of the north', town: 'cindervale', area: 'cindervale', music: 'cindervale', theme: 'ash', weather: 'ash', env: 'volcano', hotspring: true, grid: m.done(),
      conn: { s: { map: 'route4', off: 10 } },
      warps: [17, 18, 19].map(y => ({ x: 0, y, to: 'glimmercave', tx: 36, ty: 15, dir: 'left', kind: 'cave' })),
      objs: [
        G.haven(4, 20), G.mart(12, 20),
        G.bld('gym', 18, 2, 8, 5, { roof: 'red', accent: '#ee6030', door: 4, to: 'cinder_gym', tx: 7, ty: 15 }),
        G.house(4, 6, 'cinder_house1', 'brown'), G.house(4, 28, 'cinder_house2', 'red'), G.house(11, 28, 'cinder_house3', 'gray'),
        G.bld('house', 36, 27, 5, 3, { roof: 'orange', door: 2, to: 'hotspring', tx: 5, ty: 6 }),
        { type: 'sign', x: 24, y: 33, text: '{o}CINDERVALE{w}\\n"Temper your steel, warm your heart."' },
        { type: 'sign', x: 26, y: 7, text: '{r}CINDERVALE GYM{w} — The Forge\\nWarden: Brann' },
        { type: 'sign', x: 35, y: 30, text: 'Ember Springs — Rest your weary bones! (Bathhouse on the left. Towels provided.)' },
        { type: 'sign', x: 26, y: 17, text: '{o}SMITHS\' ROW{w}\\nHammers from dawn to dusk. Earplugs sold separately.' },
        { type: 'npc', id: 'cv_smith', x: 11, y: 9, look: 'worker', dir: 'down', move: 'look', text: 'Brann forged every Warden\'s badge case himself. He says a badge is just metal until someone earns it. Then he yells about it.' },
        { type: 'npc', id: 'cv_old', x: 35, y: 21, look: 'oldwoman', dir: 'left', move: 'look', text: 'The volcano sleeps because the Volcanoth colony under us sleeps. Don\'t wake them. Please. I\'ve just repainted.' },
        { type: 'npc', id: 'cv_kid', x: 12, y: 18, look: 'boy', dir: 'right', move: 'wander', radius: 3, text: 'Water types feel weaker in Cindervale! It\'s the ash! Probably! I\'m eight!' },
        { type: 'npc', id: 'cv_bath', x: 23, y: 29, look: 'oldman', dir: 'right', move: 'look', text: 'Ahh. The spring comes up hot from the mountain\'s heart. My knees are forty years younger. The rest of me has not been informed.' },
        { type: 'npc', id: 'cv_row', x: 31, y: 17, look: 'blackbelt', dir: 'down', move: 'look', text: 'Every blade on this row was tempered in lava. Don\'t touch the lava channels. People keep touching the lava channels.' },
        { type: 'trigger', x: 2, y: 17, w: 1, h: 3, script: 'rival2', cond: ['lark1_done', '!rival2_done'] },
        { type: 'item', id: 'cv_i1', x: 40, y: 15, item: 'charcoal' },
        { type: 'item', id: 'cv_h1', x: 3, y: 33, item: 'flamestone', hidden: true },
      ], spawn: [21, 20] });
  })();
  G.defHouse('cinder_house1', 'Cindervale House', 1, [{ type: 'npc', id: 'ch1', x: 1, y: 5, look: 'veteran', dir: 'right', script: 'name_rater_cinder' }]);
  G.defHouse('cinder_house2', 'Cindervale House', 0, [{ type: 'npc', id: 'ch2', x: 7, y: 5, look: 'woman', dir: 'left', script: 'mint_lady' }]);
  G.defHouse('cinder_house3', 'Cindervale House', 1, [
    { type: 'npc', id: 'ch3', x: 1, y: 5, look: 'hiker', dir: 'right', text: 'I climbed to the crater rim once. You can hear the Volcanoth breathing down there. Slow. Like a lullaby. I didn\'t sleep for a week.' },
    { type: 'npc', id: 'ch3b', x: 8, y: 5, monSprite: 'kindlet', dir: 'left', text: 'Kindlet is warming its paws by the stove.' },
  ], { wall: 'wood' });
  D({ id: 'hotspring', name: 'Ember Springs', type: 'indoor', wall: 'wood', music: 'house', floor: '#b88a5a',
    grid: ['WWwWWWWWwWW', 'WWWWWWWWWWW', 'V.~~~~~~~.V', '..~~~~~~~..', '..~~~~~~~..', '...........', 'Y.........Y', '.....M.....'],
    warps: [{ x: 5, y: 7, to: '_back' }],
    objs: [
      { type: 'npc', id: 'kiko', x: 8, y: 5, look: 'nurse', dir: 'left', script: 'kiko' },
      { type: 'npc', id: 'hs_old', x: 1, y: 3, look: 'oldman', dir: 'right', text: 'Ahh... the springs heal body and soul. Mostly body. The soul is a work in progress.' },
      { type: 'npc', id: 'hs_m1', x: 5, y: 3, monSprite: 'sealet', dir: 'down', text: 'A wild Sealet is floating on its back, blissfully.' },
    ], spawn: [5, 6] });
  // Cindervale gym: forge with lava
  D({ id: 'cinder_gym', name: 'Cindervale Gym', type: 'indoor', music: 'gym', floor: '#5a4038', floor2: '#6a4a40', wall: 'stone', env: 'volcano',
    legend: { '.': { g: 'gymfloor' }, ',': { g: 'gymfloor2' } },
    grid: [
      'nnnnnnnnnnnnnnn',
      'nnnnnnnnnnnnnnn',
      'L.....,,,.....L',
      'L.LLLL...LLLL.L',
      'L.L..L...L..L.L',
      'L...LL.L.LL...L',
      'LLL.L..L..L.LLL',
      'L...L.LLL.L...L',
      'L.LLL.....LLL.L',
      'L.....LLL.....L',
      'LLLL.LL.LL.LLLL',
      'L.......L.....L',
      'L.LLLLL.L.LLL.L',
      'L.....L...L...L',
      'L..,,,,,,,,,..L',
      'LLLLLLLMLLLLLLL'],
    warps: [{ x: 7, y: 15, to: '_back' }],
    objs: [
      { type: 'npc', id: 'brann_npc', x: 7, y: 2, look: 'brann', dir: 'down', script: 'brann' },
      { type: 'trainer', id: 'cg_1e', x: 3, y: 11, look: 'worker', dir: 'right', sight: 3, trainer: 'cg_1' },
      { type: 'trainer', id: 'cg_2e', x: 13, y: 7, look: 'artist', dir: 'left', sight: 2, trainer: 'cg_2' },
      { type: 'trainer', id: 'cg_3e', x: 1, y: 4, look: 'blackbelt', dir: 'down', sight: 1, trainer: 'cg_3' },
      { type: 'npc', id: 'cg_guide', x: 9, y: 14, look: 'man', dir: 'left', script: 'gym_guide' },
    ], spawn: [7, 14] });
  // --------------------------------------------------------------- ROUTE 4
  (function () {
    const m = new G.MB(26, 44, 'a', 101);
    m.forest(2, 'X', { skip: (x, y) => (x >= 10 && x <= 13 && (y <= 1 || y >= 42)) });
    m.path([[10, 0], [10, 8], [5, 8], [5, 18], [16, 18], [16, 28], [8, 28], [8, 36], [10, 36], [10, 43]], ':', 2); m.rect(10, 0, 4, 2, ':'); m.rect(10, 42, 4, 2, ':');
    m.blob(18, 10, 4, 3, '"', { only: 'a' }); m.blob(8, 23, 3, 3, '"', { only: 'a' }); m.blob(19, 34, 3, 4, '"', { only: 'a' }); m.blob(5, 40, 2.5, 2, '"', { only: 'a' });
    m.rect(3, 13, 1, 1, 'm'); m.blob(20, 22, 2.5, 1.5, 'm'); m.blob(4, 31, 1.5, 1.5, 'm');
    m.rect(12, 14, 6, 1, 'v'); m.rect(2, 33, 5, 1, 'v');
    m.put(15, 8, 'r'); m.rect(16, 5, 5, 4, 'a'); m.rect(20, 3, 2, 3, 'a');
    m.scatter('R', 8, 3, 3, 20, 38, 'a'); m.scatter('X', 6, 3, 3, 20, 38, 'a');
    D({ id: 'route4', name: 'Route 4', subtitle: 'The Ashen Way', area: 'route4', music: 'route4', theme: 'ash', weather: 'ash', env: 'volcano', grid: m.done(),
      conn: { n: { map: 'cindervale', off: -10 }, s: { map: 'duskmere', off: -3 } },
      enc: {
        grass: { lv: [22, 26], list: [['magmite', 20], ['emberjay', 18], ['digmole', 14], ['pebblin', 10], ['bouldrok', 8], ['scrapmonk', 12], ['rascoon', 8], ['snoozle', 5], ['stingle', 5]] },
        night: { lv: [22, 26], list: [['magmite', 22], ['duskbat', 20], ['rascoon', 16], ['maskling', 12], ['emberjay', 12], ['wispurr', 10], ['scrapmonk', 8]] },
        rare: { list: [['shiftail', 2], ['snoozle', 2], ['armadrill', 1]] }, rock: { lv: [24, 26], list: [['pebblin', 50], ['magmite', 30], ['armadrill', 20]] },
      },
      objs: [
        { type: 'sign', x: 13, y: 3, text: '{o}ROUTE 4{w} — The Ashen Way\\n↑ Cindervale   ↓ Duskmere' },
        { type: 'trainer', id: 'r4_hiker_e', x: 9, y: 10, look: 'hiker', dir: 'left', sight: 3, trainer: 'r4_hiker' },
        { type: 'trainer', id: 'r4_ace_e', x: 14, y: 20, look: 'ace', dir: 'down', sight: 3, trainer: 'r4_ace' },
        { type: 'trainer', id: 'r4_punk_e', x: 19, y: 26, look: 'punk', dir: 'left', sight: 2, trainer: 'r4_punk' },
        { type: 'trainer', id: 'r4_bb_e', x: 12, y: 30, look: 'blackbelt', dir: 'left', sight: 3, trainer: 'r4_bb' },
        { type: 'trainer', id: 'r4_mystic_e', x: 13, y: 38, look: 'mystic', dir: 'left', sight: 2, trainer: 'r4_mystic' },
        { type: 'npc', id: 'r4_ranger', x: 7, y: 16, look: 'ranger', dir: 'right', move: 'look', text: 'Volcano ash turns the grass gold here. Fire-type Echoes wander all the way to Duskmere. Nobody told them to stop.' },
        { type: 'item', id: 'r4_i1', x: 19, y: 5, item: 'tm38' },
        { type: 'item', id: 'r4_i2', x: 21, y: 37, item: 'hyperpotion' },
        { type: 'item', id: 'r4_i3', x: 4, y: 26, item: 'burnheal', qty: 2 },
        { type: 'item', id: 'r4_h1', x: 17, y: 12, item: 'flamestone', hidden: true },
        { type: 'item', id: 'r4_h2', x: 3, y: 38, item: 'ppup', hidden: true },
      ], spawn: [11, 2] });
  })();
})();
