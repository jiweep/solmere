'use strict';
// ============================================================================
//  Maps: Brinehollow, Route 1, Fernwick, Route 2, Whisperwood (+interiors)
// ============================================================================
(function () {
  const D = G.defMap;
  // ------------------------------------------------------------ HOME ----
  D({ id: 'home2f', name: 'Your Room', type: 'indoor', wall: 'blue', music: 'home', canRun: true,
    grid: ['WWwWWWpWW', 'WWWWWWWWW', 'UQC.....^', 'U........', '......Z..', '.........', '.........'],
    warps: [{ x: 8, y: 2, to: 'home1f', tx: 9, ty: 2, dir: 'left' }],
    objs: [
      { type: 'sign', x: 1, y: 2, invisible: true, text: 'Your bookshelf: "Tamer Basics," "Type Matchups for Beginners," and a dog-eared comic called "Captain Resonance."' },
      { type: 'item', id: 'room_potion', x: 7, y: 5, item: 'potion', hidden: true },
    ], spawn: [3, 4], noFollower: true });
  D({ id: 'home1f', name: 'Your House', type: 'indoor', wall: 'cream', music: 'home', canRun: true,
    grid: ['WwWWWWpWWwW', 'WWWWWWWWWWW', 'QQ.KK..Z..^', '...........', '...YY......', '...YY....V.', '...........', '.....M.....'],
    warps: [{ x: 10, y: 2, to: 'home2f', tx: 7, ty: 2, dir: 'left' }, { x: 5, y: 7, to: 'brinehollow', tx: 10, ty: 8, dir: 'down' }],
    objs: [{ type: 'npc', id: 'mom', x: 6, y: 4, look: 'mom', dir: 'left', script: 'mom' }],
    spawn: [5, 6] });
  D({ id: 'wrenhouse', name: 'Wren\'s House', type: 'indoor', wall: 'green', music: 'home',
    grid: G.tpl.house(1), warps: [{ x: 5, y: 7, to: 'brinehollow', tx: 26, ty: 8, dir: 'down' }],
    objs: [
      { type: 'npc', id: 'wrenmom', x: 7, y: 4, look: 'woman', dir: 'left', script: 'wren_mom' },
      { type: 'sign', x: 5, y: 2, invisible: true, text: 'A framed photo: a young Wren on the shoulders of their older sibling Sable, both grinning. The frame says "Future Champions!"' },
    ], spawn: [5, 6] });
  D({ id: 'lab', name: 'Hale Lab', type: 'indoor', wall: 'lab', music: 'lab', floor: '#dfe6ee', canRun: true,
    grid: ['WWwWWWWWWwWW', 'WWWWWWWWWWWW', 'QQQ.qq.dd.QQ', '............', '....YYYY....', '....YYYY....', '............', 'V.,,,,,,,,.V', ',,,,,,,,,,,,', '.....M......'],
    warps: [{ x: 5, y: 9, to: 'brinehollow', tx: 25, ty: 28, dir: 'down' }],
    objs: [
      { type: 'npc', id: 'hale', x: 6, y: 3, look: 'hale', dir: 'down', script: 'hale' },
      { type: 'npc', id: 'wren_lab', x: 3, y: 6, look: 'wren', dir: 'right', script: 'wren_lab', cond: '!got_starter' },
      { type: 'npc', id: 'aide', x: 10, y: 6, look: 'scientist', dir: 'left', move: 'look', script: 'lab_aide' },
      { type: 'sign', x: 4, y: 5, invisible: true, deco: 'orbball:#5ad06a', script: 'starter_budling', cond: '!got_starter' },
      { type: 'sign', x: 5, y: 5, invisible: true, deco: 'orbball:#ff7a3a', script: 'starter_kindlet', cond: '!got_starter' },
      { type: 'sign', x: 6, y: 5, invisible: true, deco: 'orbball:#4aa8ff', script: 'starter_sealet', cond: '!got_starter' },
      { type: 'sign', x: 10, y: 2, invisible: true, text: 'Research notes: "Resonance field strength rises near the Tidelight each spring. Correlation with bond intensity: 0.91. V. Crane\'s old calibration data attached."' },
    ], spawn: [5, 8], onEnter: 'lab_enter' });
  // --------------------------------------------------------- BRINEHOLLOW -
  // Three tiers down to the sea: Seacliff Heights (homes, the fountain plaza, the road north), a
  // stone wall and grand staircase down to Market Row (stalls, the café, a little park), and a second
  // wall with two stairways down to the harbour: a sandy cove, the lab on the quay, and the pier.
  (function () {
    const m = new G.MB(38, 34, '.', 17);
    m.forest(2, 'T', { skip: (x, y) => (x >= 17 && x <= 20 && y <= 1) || y >= 24 });
    // Seacliff Heights
    m.rect(2, 2, 34, 11, '.'); m.rect(17, 0, 4, 13, ':'); m.rect(3, 9, 32, 2, ':');
    m.rect(15, 10, 8, 3, '='); m.put(18, 11, 'o'); m.put(15, 12, 'u'); m.put(22, 12, 'u'); m.put(14, 11, 'l'); m.put(23, 11, 'l');
    m.rect(3, 3, 4, 3, 'f'); m.rect(31, 3, 4, 3, 'f'); m.put(14, 3, 'T'); m.put(30, 7, 'T'); m.put(7, 8, 'y'); m.put(29, 8, 'y'); m.put(33, 11, 'u');
    // wall + grand staircase
    m.rect(2, 13, 34, 2, '#'); m.rect(17, 13, 4, 2, '=');
    // Market Row
    m.rect(2, 15, 34, 7, '.'); m.rect(3, 17, 32, 2, ':'); m.rect(17, 15, 4, 7, ':');
    m.put(5, 16, 'p'); m.put(8, 16, 'p'); m.put(11, 16, 'p'); m.text(3, 20, ['QO', 'O ']); m.put(16, 16, 'l'); m.put(21, 16, 'l');
    m.rect(30, 19, 4, 2, 'f'); m.put(29, 16, 'T'); m.put(34, 16, 'T'); m.put(31, 16, 'u'); m.put(13, 20, 'y');
    // second wall: stairs to the beach (west) and to the quay (east)
    m.rect(2, 22, 34, 2, '#'); m.rect(8, 22, 2, 2, ':'); m.rect(28, 22, 2, 2, '=');
    // harbour
    m.rect(0, 24, 38, 5, 's'); m.rect(20, 24, 18, 5, '=');
    m.rect(0, 29, 38, 5, '~'); m.rect(30, 29, 2, 4, 'I'); m.rect(20, 28, 18, 1, 'b');
    m.put(2, 25, 'Y'); m.put(13, 25, 'Y'); m.put(6, 27, 'Y'); m.put(0, 28, 'R'); m.put(15, 28, 'R'); m.put(10, 25, 'p');
    m.put(26, 31, 'A'); m.put(35, 30, 'A'); m.put(21, 25, 'l'); m.put(34, 25, 'l'); m.text(35, 26, ['QO']);
    D({ id: 'brinehollow', name: 'Brinehollow', subtitle: 'Where the tide begins', town: 'brinehollow', area: 'brinehollow', music: 'brinehollow', theme: 'beach', env: 'beach',
      grid: m.done(), borders: { s: 'water', w: 'water', e: 'water' },
      conn: { n: { map: 'route1', off: 8 } },
      objs: [
        G.house(8, 4, 'home1f', 'red'), G.bld('house', 24, 4, 5, 4, { roof: 'green', door: 2, to: 'wrenhouse', tx: 5, ty: 6 }),
        G.house(24, 15, 'bh_cafe', 'teal'),
        G.bld('lab', 22, 24, 7, 4, { roof: 'teal', door: 3, to: 'lab', tx: 5, ty: 8 }),
        { type: 'sign', x: 16, y: 11, text: '{b}Brinehollow{w}\\n"Where the tide begins."' },
        { type: 'sign', x: 21, y: 27, text: '{c}HALE RESONANCE LAB{w}\\nProf. Marisol Hale — Visitors welcome (knock loudly, she\'s usually underwater)' },
        { type: 'sign', x: 3, y: 15, text: '{o}MARKET ROW{w}\\nFresh catch at dawn · Shells, charms & bad jokes all day' },
        { type: 'sign', x: 23, y: 18, text: '{c}THE DRIFTWOOD CAFÉ{w}\\nSea-salt cocoa and the best view in town.' },
        { type: 'npc', id: 'bh_girl', x: 20, y: 10, look: 'girl', dir: 'down', move: 'wander', radius: 2, text: 'Professor Hale studies how mons and people bond. She says the Tidelight lighthouse out on the Mere is the key to everything!' },
        { type: 'npc', id: 'bh_fisher', x: 31, y: 32, look: 'fisher', dir: 'down', script: 'bh_fisher' },
        { type: 'npc', id: 'bh_old', x: 4, y: 26, look: 'oldman', dir: 'right', move: 'look', text: 'Every spring the Tidelight glows brighter... but last year it flickered. Old bones like mine notice these things.' },
        { type: 'npc', id: 'bh_boy', x: 11, y: 10, look: 'boy', dir: 'left', move: 'wander', radius: 2, text: 'Did you know? If you hold Shift you can run! And Tab makes EVERYTHING faster! You can even click menus!' },
        { type: 'npc', id: 'bh_vendor', x: 8, y: 15, look: 'woman', dir: 'down', move: 'look', text: 'Shells! Lucky charms! ...No, I don\'t sell Orbs, love. Kids these days want everything.' },
        { type: 'npc', id: 'bh_sailor', x: 20, y: 26, look: 'sailor', dir: 'right', move: 'look', text: 'Stairs by the market run down to the cove, and the big ones to the quay. Mind the gulls, they steal sandwiches.' },
        { type: 'npc', id: 'bh_look', x: 33, y: 10, look: 'lady', dir: 'down', move: 'look', text: 'On a clear day you can see the Tidelight from this bench. Just a speck of light, way out on the Mere.' },
        { type: 'npc', id: 'bh_kid2', x: 10, y: 26, look: 'kid', dir: 'up', move: 'wander', radius: 2, text: 'I found a shell shaped like a Sealet! ...Okay, it\'s shaped like a rock. But a Sealet-ish rock!' },
        { type: 'trigger', x: 17, y: 0, w: 4, h: 1, script: 'bh_block', cond: '!got_starter' },
        { type: 'item', id: 'bh_hidden1', x: 1, y: 27, item: 'pearl', hidden: true },
        { type: 'item', id: 'bh_park', x: 33, y: 20, item: 'oranberry' },
      ], spawn: [18, 9] });
  })();
  G.defHouse('bh_cafe', 'The Driftwood Café', 2, [
    { type: 'npc', id: 'cafe_owner', x: 9, y: 4, look: 'clerk', dir: 'left', text: 'Welcome in! Sea-salt cocoa is on the house for anyone starting their journey. ...What, you haven\'t started yet? Then it\'s on the house twice.' },
    { type: 'npc', id: 'cafe_old', x: 2, y: 5, look: 'oldwoman', dir: 'right', text: 'I watched your mother set out from this very table, you know. She ordered two cocoas and forgot to drink either.' },
  ], { wall: 'wood', music: 'house' });
  // ------------------------------------------------------------- ROUTE 1 -
  (function () {
    const m = new G.MB(22, 40, '.', 21);
    m.forest(2, 'T', { skip: (x, y) => (x >= 9 && x <= 12 && (y <= 2 || y >= 37)) });
    m.rect(9, 32, 4, 8, ':'); m.path([[9, 32], [13, 32], [13, 22]], ':', 2); m.path([[13, 22], [9, 22], [9, 0]], ':', 2); m.rect(9, 0, 4, 3, ':');
    m.blob(5, 35, 3.2, 2.6, '"', { only: '.' }); m.blob(17, 35, 2.8, 2.6, '"', { only: '.' });
    m.blob(5.5, 21, 3, 3.5, '"', { only: '.' }); m.blob(16, 5, 3, 2.6, '"', { only: '.' }); m.blob(17, 26, 2.5, 2.5, '"', { only: '.' });
    m.blob(17.5, 16.5, 2.8, 2.6, '~');
    m.rect(2, 29, 6, 1, 'v'); m.rect(15, 29, 5, 1, 'v');
    m.rect(0, 14, 5, 5, '.'); // gate clearing
    m.rect(2, 3, 5, 5, '.'); m.frame(1, 8, 7, 5, 'F'); m.rect(2, 9, 5, 3, 'f'); m.put(4, 12, '.'); m.put(4, 8, '.');
    m.scatter('T', 8, 2, 13, 6, 18); m.scatter(',', 10, 2, 2, 18, 36);
    m.rect(7, 17, 2, 1, '.'); m.put(18, 6, '"');
    D({ id: 'route1', name: 'Route 1', subtitle: 'Brinehollow ↔ Fernwick', area: 'route1', music: 'route1', grid: m.done(),
      conn: { s: { map: 'brinehollow', off: -8 }, n: { map: 'fernwick', off: -11 } },
      enc: {
        grass: { lv: [2, 4], list: [['pipwing', 35], ['nibbit', 35], ['mossbun', 22], ['grubbit', 8]] },
        night: { lv: [2, 4], list: [['nibbit', 45], ['oddowl', 20], ['pipwing', 15], ['grubbit', 10], ['rascoon', 10]] },
        rare: { list: [['shiftail', 1], ['glimmer', 1]] },
        surf: { lv: [5, 10], list: [['flopfin', 70], ['lillipad', 30]] }, fish: { lv: [3, 8], list: [['flopfin', 100]] },
      },
      objs: [
        G.bld('house', 2, 3, 5, 4, { roof: 'brown', door: 2, to: 'hollis_house', tx: 5, ty: 6 }),
        G.bld('lab', 0, 14, 4, 3, { roof: 'gray', door: 1, to: 'victorygate', tx: 5, ty: 6 }),
        { type: 'sign', x: 8, y: 36, text: '{b}ROUTE 1{w}\\n↑ Fernwick Town   ↓ Brinehollow' },
        { type: 'sign', x: 4, y: 18, text: '{r}VICTORY GATE{w}\\nOnly Tamers with all six Warden badges may pass.' },
        { type: 'sign', x: 8, y: 13, text: 'Hollis Farm — Fresh berries & naps. "Please close the gate, Snoozle escapes!"' },
        { type: 'trainer', id: 'r1_kid_e', x: 15, y: 30, look: 'kid', dir: 'left', sight: 3, trainer: 'r1_kid' },
        { type: 'trainer', id: 'r1_lass_e', x: 7, y: 17, look: 'lass', dir: 'right', sight: 3, trainer: 'r1_lass' },
        { type: 'trigger', x: 9, y: 37, w: 4, h: 1, script: 'route1_tutorial', cond: ['got_starter', '!route1_tut'] },
        { type: 'npc', id: 'r1_man', x: 14, y: 12, look: 'man', dir: 'down', move: 'wander', radius: 2, text: 'Tall grass is where wild mons hide. Lower their HP and throw an Orb! Sleep or paralysis makes it easier, too.' },
        { type: 'npc', id: 'snoozle_lost', x: 17, y: 4, monSprite: 'snoozle', dir: 'down', script: 'lostcub_found', cond: ['lostcub_active', '!lostcub_done'] },
        { type: 'item', id: 'r1_potion', x: 3, y: 36, item: 'potion' },
        { type: 'item', id: 'r1_orb', x: 18, y: 6, item: 'orb', qty: 2 },
        { type: 'item', id: 'r1_hid', x: 19, y: 20, item: 'oranberry', hidden: true },
      ], spawn: [10, 36] });
  })();
  G.defHouse('hollis_house', 'Hollis Farmhouse', 2, [
    { type: 'npc', id: 'hollis', x: 6, y: 4, look: 'farmer', dir: 'left', script: 'hollis' },
    { type: 'npc', id: 'snoozle_home', x: 3, y: 5, monSprite: 'snoozle', dir: 'down', text: 'Snoozle is snoring contentedly. "Zzz... zzz..."', cond: 'lostcub_done' },
  ], { wall: 'wood' });
  D({ id: 'victorygate', name: 'Victory Gate', type: 'indoor', wall: 'stone', music: 'gate', floor: '#b8b0a0',
    grid: ['WWWWW:WWWWW', 'WWWWW:WWWWW', 'S....:....S', '.....:.....', 'K...........'.slice(0, 11), '.....:.....', '.....:.....', '.....M.....'],
    legend: { ':': { g: 'carpet' } }, carpet: 'red',
    warps: [{ x: 5, y: 7, to: 'route1', tx: 1, ty: 17, dir: 'down' }, { x: 5, y: 0, to: 'victoryroad', tx: 5, ty: 30, dir: 'up' }],
    objs: [{ type: 'npc', id: 'gateguard', x: 5, y: 2, look: 'officer', dir: 'down', script: 'gate_guard' }], spawn: [5, 6] });

  // ------------------------------------------------------------ FERNWICK -
  // Three tiers, XY-style: the Gym Terrace up top (statues, a lamp-lit promenade, flower beds, a
  // lookout), a grand staircase down to Blossom Square (fountain plaza between the Haven and the Mart,
  // market stalls, the east road to Route 2, three houses), and a second wall with three stairways
  // down to the Sunken Garden (koi pond, hedges) and the flower meadow by the south gate.
  (function () {
    const m = new G.MB(44, 38, '.', 31);
    m.forest(2, 'T', { skip: (x, y) => (x >= 20 && x <= 23 && y >= 36) || (x >= 42 && y >= 18 && y <= 19) });
    // Gym Terrace
    m.rect(2, 2, 40, 10, '.'); m.rect(20, 7, 4, 5, '='); m.rect(4, 9, 36, 2, '=');
    m.rect(3, 3, 7, 4, 'f'); m.rect(34, 3, 7, 4, 'f'); m.put(12, 3, 'P'); m.put(31, 3, 'P'); m.put(2, 2, 'P'); m.put(41, 2, 'P');
    m.put(17, 7, 'S'); m.put(26, 7, 'S'); m.put(8, 8, 'l'); m.put(15, 8, 'l'); m.put(28, 8, 'l'); m.put(35, 8, 'l');
    m.put(11, 11, 'u'); m.put(32, 11, 'u'); m.put(3, 8, 'y'); m.put(40, 8, 'y'); m.rect(12, 5, 4, 2, 'f'); m.rect(28, 5, 4, 2, 'f');
    // wall with the grand staircase (and a ramp in the west)
    m.rect(2, 12, 40, 2, '#'); m.rect(20, 12, 4, 2, '='); m.rect(3, 12, 2, 2, ':');
    // Blossom Square
    m.rect(2, 14, 40, 12, '.'); m.rect(14, 14, 16, 4, '='); m.put(21, 15, 'o');
    m.put(15, 15, 'u'); m.put(28, 15, 'u'); m.put(14, 14, 'l'); m.put(29, 14, 'l'); m.put(14, 17, 'y'); m.put(29, 17, 'y');
    m.rect(2, 18, 42, 2, ':'); m.rect(20, 14, 4, 24, ':'); m.rect(20, 14, 4, 4, '='); m.put(21, 15, 'o');
    m.put(16, 21, 'p'); m.put(18, 21, 'p'); m.put(25, 21, 'p'); m.put(27, 21, 'p'); m.rect(16, 22, 3, 1, 'f'); m.rect(25, 22, 3, 1, 'f');
    m.rect(30, 20, 3, 3, 'f'); m.put(2, 20, 'T'); m.put(41, 21, 'T'); m.put(15, 20, 'y'); m.put(28, 20, 'y');
    m.rect(3, 24, 38, 2, ':');
    // second wall: stairs west, centre (grand) and east
    m.rect(2, 26, 40, 2, '#'); m.rect(20, 26, 4, 2, '='); m.rect(6, 26, 2, 2, ':'); m.rect(36, 26, 2, 2, ':');
    // Sunken Garden (west) and the meadow (east)
    m.rect(2, 28, 40, 8, '.'); m.rect(6, 28, 2, 3, ':'); m.rect(4, 30, 13, 1, ':'); m.rect(36, 28, 2, 3, ':'); m.rect(27, 30, 11, 1, ':');
    m.blob(10, 33, 3.4, 1.8, '~'); m.put(4, 32, 'u'); m.put(15, 32, 'u'); m.rect(2, 35, 17, 1, 'h'); m.rect(12, 28, 5, 2, 'f'); m.put(17, 34, 'T'); m.put(3, 34, 'P');
    m.blob(31, 33, 5, 1.8, 'f'); m.blob(38, 33, 1.6, 1.2, '~'); m.put(26, 34, 'T'); m.put(40, 29, 'P'); m.put(25, 28, 'y');
    D({ id: 'fernwick', name: 'Fernwick Town', subtitle: 'Petals on every breeze', town: 'fernwick', area: 'fernwick', music: 'fernwick', weather: 'petals', grid: m.done(),
      conn: { s: { map: 'route1', off: 11 }, e: { map: 'route2', off: 14 } },
      objs: [
        { type: 'trigger', x: 20, y: 35, w: 4, h: 1, script: 'race_finish', cond: ['route1_tut', '!race_done'] },
        G.haven(5, 14), G.mart(34, 14), G.bld('gym', 18, 2, 8, 5, { roof: 'green', accent: '#6ccc52', door: 4, to: 'fernwick_gym', tx: 7, ty: 13 }),
        G.house(5, 20, 'fern_house1', 'orange'), G.house(34, 20, 'fern_house2', 'purple'), G.house(9, 20, 'fern_house3', 'blue'),
        { type: 'sign', x: 24, y: 7, text: '{g}FERNWICK GYM{w}\\nWarden: Juniper\\n"Gentle roots, unbreakable bloom."' },
        { type: 'sign', x: 24, y: 34, text: '{b}FERNWICK TOWN{w}\\nThe town where flowers never close.' },
        { type: 'sign', x: 40, y: 20, text: '→ Route 2 · Whisperwood beyond' },
        { type: 'sign', x: 8, y: 29, text: '{g}SUNKEN GARDEN{w}\\nMind the steps. Mind the koi. Mind Granny Ivy\'s tulips.' },
        { type: 'sign', x: 19, y: 16, text: '{o}BLOSSOM SQUARE{w}\\nFountain restored by the Fernwick Garden Club.' },
        { type: 'npc', id: 'fw_guard', x: 41, y: 17, look: 'ranger', dir: 'left', script: 'fern_guard_talk', cond: '!badge1' },
        { type: 'trigger', x: 40, y: 18, w: 1, h: 2, script: 'fern_guard', cond: '!badge1' },
        { type: 'npc', id: 'fw_bea', x: 17, y: 22, look: 'lady', dir: 'down', script: 'florist_bea' },
        { type: 'npc', id: 'fw_kid', x: 12, y: 19, look: 'kid', dir: 'right', move: 'wander', radius: 2, text: 'The Warden\'s gym is a big hedge maze! I always get lost and have to be rescued.' },
        { type: 'npc', id: 'fw_man', x: 26, y: 16, look: 'man', dir: 'left', move: 'look', text: 'Crane Dynamics put up posters everywhere. "The Resonance Project: Bonds Built to Last." What does that even mean?' },
        { type: 'npc', id: 'fw_dowse', x: 8, y: 31, look: 'hiker', dir: 'left', script: 'dowsing_man' },
        { type: 'npc', id: 'fw_view', x: 37, y: 10, look: 'girl', dir: 'down', move: 'look', text: 'From up here you can see the whole square. When the petals blow just right, the fountain looks like it\'s snowing pink.' },
        { type: 'npc', id: 'fw_gard', x: 13, y: 32, look: 'oldwoman', dir: 'left', move: 'look', text: 'Those koi are older than I am. Well. Nearly.' },
        { type: 'npc', id: 'fw_stall', x: 26, y: 22, look: 'farmer', dir: 'down', move: 'look', text: 'Tulips, twelve colours! ...The thirteenth is a secret, grown only in the Sunken Garden.' },
        { type: 'item', id: 'fw_hid1', x: 40, y: 33, item: 'superpotion', hidden: true },
        { type: 'item', id: 'fw_garden', x: 3, y: 33, item: 'oranberry', qty: 2 },
      ], spawn: [21, 21] });
  })();
  G.defHouse('fern_house1', 'Fernwick House', 0, [
    { type: 'npc', id: 'fh1', x: 2, y: 4, look: 'oldwoman', dir: 'right', text: 'Juniper was the shyest girl in Fernwick. Then she met her first Budling, and she\'s been blooming ever since.' },
    { type: 'npc', id: 'fh1b', x: 7, y: 5, monSprite: 'glimmer', dir: 'left', text: 'Glimmer is glowing softly. It seems very happy here.' },
  ]);
  G.defHouse('fern_house2', 'Fernwick House', 1, [
    { type: 'npc', id: 'fh2', x: 7, y: 4, look: 'man', dir: 'left', script: 'nickname_rater' },
  ]);
  G.defHouse('fern_house3', 'Fernwick House', 2, [
    { type: 'npc', id: 'fh3', x: 3, y: 5, look: 'woman', dir: 'right', text: 'The Garden Club meets on the square every morning. We argue about tulips. Mostly I win.' },
    { type: 'npc', id: 'fh3b', x: 9, y: 5, monSprite: 'budling', dir: 'left', text: 'Budling is sunbathing by the window.' },
  ]);
  // Fernwick Gym: hedge maze
  (function () {
    const g = [
      'hhhhhhhhhhhhhhh',
      'hhhhhhhhhhhhhhh',
      'h......J......h',
      'h.hhhhh.hhhhh.h',
      'h.h.......f.h.h',
      'h.h.hhhhhhh.h.h',
      'h...h.....h...h',
      'hhh.h.hhh.h.hhh',
      'h...h.h.h...h.h',
      'h.hhh.h.hhhhh.h',
      'h.....h.......h',
      'hhhhh.hhh.hhhhh',
      'hff.......h.ffh',
      'h.....:...h...h',
      'hhhhhh:M:hhhhhh'.replace('M', ':'),
    ];
    // make the entrance row a mat
    g[14] = 'hhhhhhhMhhhhhhh';
    D({ id: 'fernwick_gym', name: 'Fernwick Gym', type: 'indoor', music: 'gym', env: 'forest', legend: { '.': { g: 'grass' }, 'f': { g: 'flowers' }, ':': { g: 'path' }, 'J': { g: 'flowers' } }, ground: 'grass', theme: 'grass',
      grid: g, warps: [{ x: 7, y: 14, to: '_back' }],
      objs: [
        { type: 'npc', id: 'juniper_npc', x: 7, y: 2, look: 'juniper', dir: 'down', script: 'juniper' },
        { type: 'trainer', id: 'fg_1e', x: 2, y: 6, look: 'farmer', dir: 'right', sight: 1, trainer: 'fg_1' },
        { type: 'trainer', id: 'fg_2e', x: 11, y: 4, look: 'farmer', dir: 'left', sight: 4, trainer: 'fg_2' },
        { type: 'npc', id: 'fg_guide', x: 9, y: 13, look: 'man', dir: 'left', script: 'gym_guide' },
      ], spawn: [7, 13] });
  })();
  // ------------------------------------------------------------- ROUTE 2 -
  (function () {
    const m = new G.MB(42, 20, '.', 41);
    m.forest(2, 'T', { skip: (x, y) => (x <= 1 && y >= 3 && y <= 6) || (x >= 40 && y >= 8 && y <= 11) });
    m.path([[0, 4], [8, 4], [8, 12], [22, 12], [22, 7], [34, 7], [34, 9], [41, 9]], ':', 2);
    m.blob(15, 7, 5, 3, '"', { only: '.' }); m.blob(29, 14, 6, 3, '"', { only: '.' }); m.blob(5, 14, 3, 3, '"', { only: '.' }); m.blob(37, 4, 3, 2, '"', { only: '.' });
    m.rect(24, 3, 6, 1, 'v');
    m.blob(19, 16, 3, 1.8, '~');
    m.rect(12, 14, 1, 4, 'T'); m.put(11, 17, 't');
    m.scatter('T', 12, 3, 2, 36, 16); m.scatter(',', 12, 2, 2, 38, 16);
    D({ id: 'route2', name: 'Route 2', subtitle: 'Fernwick ↔ Whisperwood', area: 'route2', music: 'route2', grid: m.done(),
      conn: { w: { map: 'fernwick', off: -14 }, e: { map: 'whisperwood', off: 0 } },
      enc: {
        grass: { lv: [6, 9], list: [['pipwing', 20], ['mossbun', 20], ['grubbit', 20], ['beetlet', 14], ['stingle', 14], ['nibbit', 12]] },
        night: { lv: [6, 9], list: [['oddowl', 25], ['nibbit', 20], ['rascoon', 20], ['stingle', 15], ['wispurr', 10], ['grubbit', 10]] },
        rare: { list: [['glimmer', 3], ['shiftail', 2], ['snoozle', 1]] },
        fish: { lv: [5, 10], list: [['flopfin', 80], ['lillipad', 20]] },
      },
      objs: [
        { type: 'trainer', id: 'r2_bug_e', x: 15, y: 10, look: 'bugmaniac', dir: 'down', sight: 2, trainer: 'r2_bug' },
        { type: 'trainer', id: 'r2_hiker_e', x: 25, y: 9, look: 'hiker', dir: 'up', sight: 2, trainer: 'r2_hiker' },
        { type: 'trainer', id: 'r2_lass_e', x: 31, y: 5, look: 'lass', dir: 'down', sight: 2, trainer: 'r2_lass' },
        { type: 'trainer', id: 'r2_twins_e', x: 36, y: 11, look: 'twins', dir: 'up', sight: 2, trainer: 'r2_twins' },
        { type: 'trainer', id: 'r2_kid_e', x: 6, y: 9, look: 'boy', dir: 'right', sight: 3, trainer: 'r2_kid' },
        { type: 'sign', x: 3, y: 3, text: '{b}ROUTE 2{w}\\n← Fernwick   → Whisperwood' },
        { type: 'npc', id: 'r2_berry', x: 20, y: 14, look: 'woman', dir: 'up', script: 'berry_lady' },
        { type: 'item', id: 'r2_i1', x: 9, y: 16, item: 'greatorb' },
        { type: 'item', id: 'r2_i2', x: 38, y: 16, item: 'repel', qty: 2 },
        { type: 'item', id: 'r2_i3', x: 10, y: 15, item: 'tm09' },
        { type: 'item', id: 'r2_h1', x: 27, y: 2, item: 'ether', hidden: true },
      ], spawn: [4, 4] });
  })();
  // --------------------------------------------------------- WHISPERWOOD -
  (function () {
    const m = new G.MB(38, 34, 'T', 51);
    // winding forest trail
    m.path([[0, 9], [6, 9], [6, 24], [16, 24], [16, 14], [26, 14], [26, 28], [33, 28], [33, 5], [20, 5], [20, 0]], '.', 3);
    m.path([[6, 17], [12, 17], [12, 8]], '.', 2); m.path([[26, 20], [31, 20]], '.', 2);
    m.blob(10, 27, 4, 3, '.'); m.blob(29, 9, 3.4, 3, '.');
    m.blob(8, 21, 2, 3, '"', { only: '.' }); m.blob(20, 15, 3, 1.4, '"', { only: '.' }); m.blob(27, 25, 1.5, 3, '"', { only: '.' }); m.blob(33, 17, 1.5, 4, '"', { only: '.' }); m.blob(22, 5, 3, 1.5, '"', { only: '.' }); m.blob(11, 28, 2.5, 2, '"', { only: '.' });
    // shrine clearing
    m.blob(16, 29, 5, 3.5, '.'); m.text(13, 27, ['  S S  ', ' ::::: ', ' :::::: ']);
    m.put(16, 27, 'k');
    m.rect(19, 0, 3, 2, ':');
    m.put(12, 8, 't'); m.put(19, 20, '.');
    D({ id: 'whisperwood', name: 'Whisperwood', subtitle: 'The forest remembers', area: 'whisperwood', music: 'forest', env: 'forest', weather: 'leaves', grid: m.done(),
      conn: { w: { map: 'route2', off: 0 }, n: { map: 'galvan', off: 5 } },
      enc: {
        grass: { lv: [8, 12], list: [['grubbit', 18], ['cocoonet', 10], ['beetlet', 16], ['shroomie', 16], ['stingle', 14], ['glimmer', 8], ['mossbun', 10], ['oddowl', 8]] },
        night: { lv: [9, 12], list: [['wispurr', 22], ['oddowl', 22], ['shroomie', 16], ['rascoon', 16], ['duskbat', 12], ['glimmer', 12]] },
        rare: { list: [['glimmer', 3], ['shiftail', 2], ['beetlet', 1]] },
      },
      objs: [
        { type: 'trainer', id: 'ww_bug_e', x: 8, y: 13, look: 'bugmaniac', dir: 'down', sight: 3, trainer: 'ww_bug' },
        { type: 'trainer', id: 'ww_ranger_e', x: 19, y: 20, look: 'ranger', dir: 'left', sight: 3, trainer: 'ww_ranger' },
        { type: 'trainer', id: 'ww_mystic_e', x: 28, y: 18, look: 'mystic', dir: 'left', sight: 3, trainer: 'ww_mystic' },
        { type: 'npc', id: 'ww_g1', x: 14, y: 26, look: 'grunt', dir: 'up', script: 'wood_grunts', cond: '!wood_done' },
        { type: 'npc', id: 'ww_g2', x: 18, y: 26, look: 'grunt_f', dir: 'up', script: 'wood_grunts', cond: '!wood_done' },
        { type: 'npc', id: 'ww_ash', x: 16, y: 29, look: 'ranger', dir: 'up', script: 'ranger_ash', name: 'Ranger Ash' },
        { type: 'trigger', x: 13, y: 25, w: 7, h: 1, script: 'wood_grunts', cond: '!wood_done' },
        { type: 'sign', x: 5, y: 8, text: '{g}WHISPERWOOD{w}\\n"Speak softly. The trees are listening."' },
        { type: 'sign', x: 18, y: 27, text: 'Heartroot Shrine. A crystal the size of a fist glows in a cradle of roots. Something has been pried out of it.' },
        { type: 'item', id: 'ww_i1', x: 10, y: 27, item: 'awakening', qty: 2 },
        { type: 'item', id: 'ww_i2', x: 29, y: 9, item: 'silverpowder' },
        { type: 'item', id: 'ww_i3', x: 31, y: 21, item: 'greatorb', qty: 2 },
        { type: 'item', id: 'ww_trap', x: 12, y: 18, item: 'potion', monTrap: 'coffret', lvl: 12 },
        { type: 'item', id: 'ww_h1', x: 6, y: 23, item: 'lumenberry', hidden: true },
        { type: 'item', id: 'ww_h2', x: 34, y: 6, item: 'rarecandy', hidden: true },
      ], spawn: [2, 10] });
  })();
})();
