'use strict';
// ============================================================================
//  Shared story data: interior templates, Havens, marts, region, quests,
//  chapter checkpoints (God Mode), rival team builder.
// ============================================================================
G.TOWNS = [
  { id: 'brinehollow', name: 'Brinehollow', x: 72, y: 178, map: 'brinehollow', fx: 12, fy: 12, fly: true, desc: 'A sleepy seaside village where every journey starts.' },
  { id: 'fernwick', name: 'Fernwick Town', x: 58, y: 120, map: 'fernwick', fx: 9, fy: 15, fly: true, desc: 'A town of flowers, home of Warden Juniper.' },
  { id: 'whisperwood', name: 'Whisperwood', x: 92, y: 80, map: 'whisperwood', fly: false, desc: 'An old forest guarding the Heartroot Shrine.' },
  { id: 'galvan', name: 'Galvan Harbor', x: 140, y: 58, map: 'galvan', fx: 16, fy: 14, fly: true, desc: 'A bustling port powered by Crane Dynamics.' },
  { id: 'glimmer', name: 'Glimmer Cave', x: 196, y: 44, map: 'glimmercave', fly: false, desc: 'A cave lined with singing crystals.' },
  { id: 'cindervale', name: 'Cindervale', x: 246, y: 38, map: 'cindervale', fx: 14, fy: 13, fly: true, desc: 'Hot springs and forges at the foot of a volcano.' },
  { id: 'duskmere', name: 'Duskmere', x: 318, y: 92, map: 'duskmere', fx: 14, fy: 12, fly: true, desc: 'A lantern-lit lake town wrapped in mist.' },
  { id: 'frostpeak', name: 'Frostpeak Village', x: 326, y: 168, map: 'frostpeak', fx: 13, fy: 12, fly: true, desc: 'A snowy mountain village of skiers and legends.' },
  { id: 'skyreach', name: 'Skyreach City', x: 232, y: 186, map: 'skyreach', fx: 17, fy: 19, fly: true, desc: 'A gleaming plateau city. Crane Dynamics HQ towers here.' },
  { id: 'tidelight', name: 'Tidelight Isle', x: 190, y: 116, map: 'tidelight', fx: 11, fy: 17, fly: true, desc: 'The island lighthouse at the heart of the Mere.' },
  { id: 'conclave', name: 'The Conclave', x: 22, y: 92, map: 'conclave', fx: 9, fy: 13, fly: true, desc: 'Where Solmere\'s finest Tamers are tested.' },
];
G.REGION = {
  land: [[[10, 200], [8, 60], [40, 30], [120, 18], [220, 10], [320, 12], [372, 40], [378, 150], [350, 208], [200, 212], [90, 212]]],
  sea: [[[112, 150], [104, 106], [136, 84], [196, 76], [262, 84], [292, 118], [276, 156], [220, 168], [160, 166]]],
  islands: [[[176, 108], [196, 102], [206, 116], [192, 126], [178, 122]]],
  snow: [[[296, 150], [360, 140], [372, 190], [330, 204], [292, 188]]],
  ash: [[[214, 20], [276, 18], [290, 50], [240, 60], [210, 48]]],
  routes: [['brinehollow', 'fernwick'], ['fernwick', 'whisperwood'], ['whisperwood', 'galvan'], ['galvan', 'glimmer'], ['glimmer', 'cindervale'], ['cindervale', 'duskmere'], ['duskmere', 'frostpeak'], ['frostpeak', 'skyreach'], ['skyreach', 'tidelight'], ['fernwick', 'conclave']],
};
// ------------------------------------------------------ interior templates
G.tpl = {
  house(v = 0) {
    const T = [
      ['WWwWWWWpWWW', 'WWWWWWWWWWW', 'QQ.....ZU..', '.......U...', '...YY......', '...YY...V..', '...........', '.....M.....'],
      ['WWpWWWwWWWW', 'WWWWWWWWWWW', 'V....QQ...V', '...........', '..YY....Z..', '..YY.......', '...........', '.....M.....'],
      ['WcWWwWWwWWW', 'WWWWWWWWWWW', 'Q.U.....QQ.', '..U........', '.......YY..', '.V.....YY..', '...........', '.....M.....'],
    ];
    return T[v % T.length];
  },
};
// generic interiors reused by every town
G.defMap({
  id: 'haven', name: 'Tamer Haven', type: 'indoor', wall: 'cream', isHaven: true, music: 'haven', canRun: true,
  grid: [
    'WWWWwWWWWWwWWWW',
    'WWWWWWWWWWWWWWW',
    'V.C.....H....VV',
    '....KKKKKKK....',
    ',,,,,,,,,,,,,,,',
    ',,,,,,,,,,,,,,,',
    'Y.,,,,,,,,,,,.Y',
    ',,,,,,,M,,,,,,,',
  ],
  warps: [{ x: 7, y: 7, to: '_back' }],
  objs: [
    { type: 'npc', id: 'nurse', x: 7, y: 2, look: 'nurse', dir: 'down', script: 'nurse' },
    { type: 'npc', id: 'board', x: 11, y: 3, look: 'clerk', dir: 'down', script: 'haven_board', noTurn: false },
    { type: 'npc', id: 'hv1', x: 2, y: 5, look: 'oldman', dir: 'right', move: 'look', script: 'haven_tips' },
    { type: 'npc', id: 'hv2', x: 12, y: 5, look: 'girl', dir: 'left', move: 'look', script: 'haven_chat' },
  ],
  spawn: [7, 6],
});
G.defMap({
  id: 'mart', name: 'Supply Shop', type: 'indoor', wall: 'blue', music: 'mart', canRun: true,
  grid: [
    'WWWwWWWWWwWWW',
    'WWWWWWWWWWWWW',
    'KKK...QQ.QQ..',
    '.K...........',
    '.K...QQ..QQ..',
    '.............',
    'V..QQ...QQ..V',
    '......M......',
  ],
  warps: [{ x: 6, y: 7, to: '_back' }],
  objs: [
    { type: 'npc', id: 'clerk', x: 0, y: 3, look: 'clerk', dir: 'right', script: 'mart_clerk' },
    { type: 'npc', id: 'clerk2', x: 0, y: 5, look: 'clerk', dir: 'right', script: 'mart_special' },
    { type: 'npc', id: 'mt1', x: 8, y: 5, look: 'woman', dir: 'up', move: 'wander', radius: 2, script: 'mart_chat' },
  ],
  spawn: [6, 6],
});
// ------------------------------------------------------------- quests ----
Object.assign(G.QUESTS, {
  main1: { name: 'A Sunlit Start', main: true, desc: 'Visit Professor Hale\'s lab on the Brinehollow pier.', steps: { lab: 'Visit Professor Hale\'s lab on the Brinehollow pier.', parcel: 'Deliver the Lab Parcel to Warden Juniper in Fernwick Town, north along Route 1.', badge1: 'Challenge Warden Juniper at the Fernwick Gym!' }, doneText: 'You earned your first badge!' },
  main2: { name: 'Whispers in the Wood', main: true, desc: 'Juniper asked you to check on the Heartroot Shrine deep in Whisperwood, east along Route 2.', doneText: 'You drove off the Hollow and received the Resonance Band.' },
  main3: { name: 'The Harbor City', main: true, desc: 'Head north-east to Galvan Harbor and challenge Warden Ione.', doneText: 'Galvan\'s Current Badge is yours.' },
  main4: { name: 'Crystals in the Dark', main: true, desc: 'Travel east along Route 3 and through Glimmer Cave to reach Cindervale.', doneText: 'You made it through Glimmer Cave and earned the Forge Badge.' },
  main5: { name: 'The Ruins of Echo', main: true, desc: 'The Hollow is heading for the Ruins of Echo near Duskmere. Follow Route 4 south.', doneText: 'The Tide Key was stolen, but you earned the Veil Badge.' },
  main6: { name: 'Over the Mere', main: true, desc: 'Surf across Route 5 to Frostpeak Village and earn the Rime Badge.', doneText: 'The Rime Badge sparkles in your case.' },
  main7: { name: 'Skyreach Rising', main: true, desc: 'Cross Mt. Glacia to Skyreach City. Something is wrong at Crane Dynamics HQ.', doneText: 'Crane fled to the Tidelight. Kaelen\'s Wyrm Badge is yours.' },
  main8: { name: 'The Tidelight', main: true, desc: 'Sail Route 6 to Tidelight Isle and stop Director Crane.', doneText: 'The song of Orrelume is free again.' },
  main9: { name: 'The Conclave', main: true, desc: 'Victory Road waits west of Route 1. Challenge the Conclave!', doneText: 'You are the Champion of Solmere!' },
  post1: { name: 'Starlight Stolen', main: true, desc: 'Something is devouring the stars above Starfall Peak, north of Frostpeak.', doneText: 'The stars returned to Starfall Peak.' },
  side_lostcub: { name: 'Lost Cub', giver: 'Farmer Hollis', desc: 'A Snoozle has wandered off from Hollis\'s farm on Route 1. It was last seen heading into the tall grass north of the pond.', reward: 'Soothe Bell', doneText: 'You helped Snoozle find its way home.' },
  side_petals: { name: 'Petal Post', giver: 'Florist Bea', desc: 'Deliver a bouquet from Fernwick to Bea\'s sister Rhoda in Galvan Harbor.', reward: 'Miracle Seed', doneText: 'The bouquet arrived fresh.' },
  side_fish: { name: 'The One That Got Away', giver: 'Old Salt Marv', desc: 'Show Marv in Galvan Harbor a Riptalon. "Everyone laughs at Flopfin. Prove them wrong!"', reward: 'Pro Rod... eventually!', doneText: 'Marv wept tears of joy.' },
  side_fossil: { name: 'Bones of the Past', giver: 'Dr. Orla', desc: 'Bring a fossil from Glimmer Cave to the Galvan Harbor Museum to be revived.', reward: 'An ancient mon', doneText: 'An ancient mon lives again.' },
  side_spring: { name: 'Hot Spring Hopper', giver: 'Attendant Kiko', desc: 'Kiko at the Cindervale hot springs wants to see a Fire, Water, and Ice mon relax together. Show her one of each type in your party.', reward: 'Leftovers', doneText: 'The springs have never been cozier.' },
  side_lanterns: { name: 'Lantern Festival', giver: 'Lamplighter Ode', desc: 'Relight the four spirit lanterns around Duskmere after dark (7 PM - 5 AM).', reward: 'Spell Tag + Dusk Stone', doneText: 'The spirits of Duskmere are at peace.' },
  side_scale: { name: 'The Glowing Scale', giver: 'Elder Vesna', desc: 'A strange glowing scale washed up on the lake. Bring it to Elder Vesna in Frostpeak.', reward: 'Frost Stone + story', doneText: 'Vesna told you of the old song.' },
  side_dex: { name: 'Research Assistant', giver: 'Professor Hale', desc: 'Catch 40 different species, then 70, and report to Professor Hale in Brinehollow.', reward: 'EXP Candies, then the Shiny Charm', doneText: 'The Shiny Charm is yours!' },
});
// --------------------------------------------------- rival team builder --
G.STARTERS = ['budling', 'kindlet', 'sealet'];
G.rivalOf = { budling: 'kindlet', kindlet: 'sealet', sealet: 'budling' };
G.thirdOf = { budling: 'sealet', kindlet: 'budling', sealet: 'kindlet' };
G.lineAt = (base, lvl) => { const L = G.evoLine(base).map(x => x.id); return lvl >= 36 ? L[2] : lvl >= 16 ? L[1] : L[0]; };
G.defineRivals = function () {
  const mine = G.getVar('starter', 'kindlet'); const r = G.rivalOf[mine], third = G.thirdOf[mine];
  const W = (id, lines, party, o = {}) => { G.TRAINERS[id] = { cls: 'Rival', name: G.save ? G.save.rival : 'Wren', look: o.look || 'wren', ai: o.ai || 2, money: 60, music: 'rival', victory: 'victory_trainer', boss: !!o.boss, party, resonate: !!o.resonate, noRematch: true, ...lines }; };
  W('rival1', { intro: 'Ha! Let\'s see which of us picked better!', defeat: 'Whoa... we both just started, right? Right?!' }, [{ sp: r, lvl: 5 }]);
  W('rival2', { intro: 'There you are! I\'ve been training nonstop. Watch this!', defeat: 'Tch. You\'re still a step ahead...' }, [{ sp: 'gustling', lvl: 20 }, { sp: 'voltpup', lvl: 20 }, { sp: G.lineAt(r, 22), lvl: 22 }], { boss: true });
  W('rival3', { intro: 'Crane gave me an Amplifier. Now I\'ll show you what real power looks like!', defeat: 'That look on its face... was it hurting? Was I... hurting it?' }, [{ sp: 'gustling', lvl: 33 }, { sp: 'stormhound', lvl: 33 }, { sp: 'bouldrok', lvl: 34 }, { sp: G.lineAt(r, 36), lvl: 36 }], { look: 'wren_crane', boss: true, resonate: true, ai: 3 });
  W('rival4', { intro: 'No amplifiers. No shortcuts. Just me and my team, the way it should have been from the start. Let\'s go!', defeat: 'Ha... hahaha! That was the best battle of my life. Go on. Sable\'s waiting.' }, [{ sp: 'galeclaw', lvl: 50 }, { sp: 'stormhound', lvl: 50 }, { sp: 'craggolem', lvl: 51 }, { sp: 'lilyking', lvl: 51 }, { sp: 'banditoon', lvl: 51 }, { sp: G.lineAt(r, 53), lvl: 53 }], { boss: true, resonate: true, ai: 3 });
  W('wren_ally', { intro: '' }, [{ sp: 'gustling', lvl: 38 }, { sp: 'stormhound', lvl: 39 }, { sp: G.lineAt(r, 40), lvl: 40 }], { ai: 3 });
  G.TRAINERS.sable = { cls: 'Champion', name: 'Sable', look: 'sable', ai: 4, money: 200, music: 'champion', victory: 'victory_champion', boss: true, resonate: true, noRematch: true, env: 'league',
    intro: '', defeat: 'Magnificent. The Tidelight shines brighter for having you in Solmere.',
    party: [{ sp: 'galeclaw', lvl: 55, item: 'sharpbeak' }, { sp: 'glaciursa', lvl: 55, item: 'sunberry' }, { sp: 'volcanoth', lvl: 56, item: 'leftovers' }, { sp: 'lilyking', lvl: 56, item: 'sunberry' }, { sp: 'dynamech', lvl: 56, item: 'magnet' }, { sp: G.lineAt(third, 58), lvl: 58, item: 'lifegem' }] };
  G.TRAINERS.sable_rematch = { ...G.TRAINERS.sable, party: G.TRAINERS.sable.party.map(p => ({ ...p, lvl: p.lvl + 17 })) };
};
// ------------------------------------------------------------ chapters ---
G.CHAPTERS = [
  { name: '1 · Just got a starter (Brinehollow)', map: 'brinehollow', x: 12, y: 12, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done'], items: ['dex', 'journal', 'orb', 'potion'], party: [['kindlet', 6]], freshParty: true, lvl: 6 },
  { name: '2 · Fernwick (deliver parcel)', map: 'fernwick', x: 9, y: 15, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut'], items: ['dex', 'journal', 'parcel'], party: [['kindlet', 11], ['pipwing', 9]], freshParty: true, lvl: 11, visited: ['brinehollow', 'fernwick'] },
  { name: '3 · Whisperwood (after badge 1)', map: 'fernwick', x: 9, y: 15, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut', 'parcel_given', 'badge1'], badges: ['bloom'], items: ['dex', 'journal'], party: [['pyrolynx', 16], ['gustling', 14], ['mossbun', 13]], freshParty: true, lvl: 14, visited: ['brinehollow', 'fernwick'] },
  { name: '4 · Galvan Harbor (gym 2)', map: 'galvan', x: 16, y: 14, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut', 'parcel_given', 'badge1', 'wood_done', 'crane_speech'], badges: ['bloom'], items: ['dex', 'journal', 'resonanceband', 'expshare', 'trailknife'], party: [['pyrolynx', 19], ['gustling', 18], ['voltpup', 17], ['aurorymoth', 17]], freshParty: true, lvl: 18, visited: ['brinehollow', 'fernwick', 'galvan'] },
  { name: '5 · Route 3 / Glimmer Cave', map: 'galvan', x: 16, y: 14, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut', 'parcel_given', 'badge1', 'wood_done', 'crane_speech', 'badge2', 'got_bike'], badges: ['bloom', 'current'], items: ['dex', 'journal', 'resonanceband', 'expshare', 'trailknife', 'bike', 'rod'], party: [['pyrolynx', 22], ['gustling', 21], ['voltpup', 21], ['aurorymoth', 20], ['digmole', 19]], freshParty: true, lvl: 21, visited: ['brinehollow', 'fernwick', 'galvan'] },
  { name: '6 · Cindervale (gym 3)', map: 'cindervale', x: 14, y: 13, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut', 'parcel_given', 'badge1', 'wood_done', 'crane_speech', 'badge2', 'got_bike', 'lark1_done', 'rival2_done'], badges: ['bloom', 'current'], items: ['dex', 'journal', 'resonanceband', 'expshare', 'trailknife', 'bike', 'rod', 'pickhammer'], party: [['pyrolynx', 25], ['gustling', 24], ['stormhound', 26], ['aurorymoth', 24], ['digmole', 23], ['lillipad', 23]], freshParty: true, lvl: 24, visited: ['brinehollow', 'fernwick', 'galvan', 'cindervale'] },
  { name: '7 · Duskmere & the Ruins', map: 'duskmere', x: 14, y: 12, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut', 'parcel_given', 'badge1', 'wood_done', 'crane_speech', 'badge2', 'got_bike', 'lark1_done', 'rival2_done', 'badge3'], badges: ['bloom', 'current', 'forge'], items: ['dex', 'journal', 'resonanceband', 'expshare', 'trailknife', 'bike', 'rod', 'pickhammer', 'wingwhistle'], party: [['pyrolynx', 29], ['gustling', 28], ['stormhound', 29], ['aurorymoth', 28], ['terramole', 28], ['lillipad', 27]], freshParty: true, lvl: 28, visited: ['brinehollow', 'fernwick', 'galvan', 'cindervale', 'duskmere'] },
  { name: '8 · Route 5 to Frostpeak (surf)', map: 'duskmere', x: 14, y: 12, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut', 'parcel_given', 'badge1', 'wood_done', 'crane_speech', 'badge2', 'got_bike', 'lark1_done', 'rival2_done', 'badge3', 'ruins_done', 'badge4', 'got_surf'], badges: ['bloom', 'current', 'forge', 'veil'], items: ['dex', 'journal', 'resonanceband', 'expshare', 'trailknife', 'bike', 'rod', 'pickhammer', 'wingwhistle', 'tideboard', 'lantern'], party: [['pyrolynx', 33], ['galeclaw', 33], ['stormhound', 33], ['aurorymoth', 32], ['terramole', 32], ['lilyking', 32]], freshParty: true, lvl: 32, visited: ['brinehollow', 'fernwick', 'galvan', 'cindervale', 'duskmere'] },
  { name: '9 · Skyreach & Crane HQ', map: 'skyreach', x: 15, y: 16, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut', 'parcel_given', 'badge1', 'wood_done', 'crane_speech', 'badge2', 'got_bike', 'lark1_done', 'rival2_done', 'badge3', 'ruins_done', 'badge4', 'got_surf', 'rival3_done', 'badge5', 'got_boots'], badges: ['bloom', 'current', 'forge', 'veil', 'rime'], items: ['dex', 'journal', 'resonanceband', 'expshare', 'trailknife', 'bike', 'rod', 'pickhammer', 'wingwhistle', 'tideboard', 'lantern', 'gripboots'], party: [['solarynx', 40], ['galeclaw', 39], ['stormhound', 39], ['aurorymoth', 38], ['terramole', 38], ['lilyking', 38]], freshParty: true, lvl: 39, visited: ['brinehollow', 'fernwick', 'galvan', 'cindervale', 'duskmere', 'frostpeak', 'skyreach'] },
  { name: '10 · The Tidelight', map: 'skyreach', x: 15, y: 16, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut', 'parcel_given', 'badge1', 'wood_done', 'crane_speech', 'badge2', 'got_bike', 'lark1_done', 'rival2_done', 'badge3', 'ruins_done', 'badge4', 'got_surf', 'rival3_done', 'badge5', 'got_boots', 'hq_done', 'badge6'], badges: ['bloom', 'current', 'forge', 'veil', 'rime', 'wyrm'], items: ['dex', 'journal', 'resonanceband', 'expshare', 'trailknife', 'bike', 'rod', 'pickhammer', 'wingwhistle', 'tideboard', 'lantern', 'gripboots'], party: [['solarynx', 46], ['galeclaw', 45], ['stormhound', 45], ['aurorymoth', 44], ['terramole', 44], ['lilyking', 44]], freshParty: true, lvl: 45, visited: ['brinehollow', 'fernwick', 'galvan', 'cindervale', 'duskmere', 'frostpeak', 'skyreach'] },
  { name: '11 · Victory Road & Conclave', map: 'route1', x: 3, y: 14, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut', 'parcel_given', 'badge1', 'wood_done', 'crane_speech', 'badge2', 'got_bike', 'lark1_done', 'rival2_done', 'badge3', 'ruins_done', 'badge4', 'got_surf', 'rival3_done', 'badge5', 'got_boots', 'hq_done', 'badge6', 'tidelight_done'], badges: ['bloom', 'current', 'forge', 'veil', 'rime', 'wyrm'], items: ['dex', 'journal', 'resonanceband', 'expshare', 'trailknife', 'bike', 'rod', 'prorod', 'pickhammer', 'wingwhistle', 'tideboard', 'lantern', 'gripboots'], party: [['solarynx', 52], ['galeclaw', 51], ['stormhound', 51], ['aurorymoth', 50], ['terramole', 50], ['orrelume', 50]], freshParty: true, lvl: 51, visited: ['brinehollow', 'fernwick', 'galvan', 'cindervale', 'duskmere', 'frostpeak', 'skyreach', 'tidelight'] },
  { name: '12 · Post-game (Champion)', map: 'brinehollow', x: 12, y: 12, flags: ['intro_done', 'mom_talk', 'got_starter', 'rival1_done', 'route1_tut', 'parcel_given', 'badge1', 'wood_done', 'crane_speech', 'badge2', 'got_bike', 'lark1_done', 'rival2_done', 'badge3', 'ruins_done', 'badge4', 'got_surf', 'rival3_done', 'badge5', 'got_boots', 'hq_done', 'badge6', 'tidelight_done', 'rival4_done', 'elite4_done', 'champion'], badges: ['bloom', 'current', 'forge', 'veil', 'rime', 'wyrm'], items: ['dex', 'journal', 'resonanceband', 'expshare', 'trailknife', 'bike', 'rod', 'prorod', 'pickhammer', 'wingwhistle', 'tideboard', 'lantern', 'gripboots', 'vsrecorder'], party: [['solarynx', 60], ['galeclaw', 58], ['stormhound', 58], ['aurorymoth', 57], ['terramole', 57], ['orrelume', 58]], freshParty: true, lvl: 58, visited: ['brinehollow', 'fernwick', 'galvan', 'cindervale', 'duskmere', 'frostpeak', 'skyreach', 'tidelight', 'conclave'] },
];
// mart stock grows with badges
G.martStock = function () {
  const b = G.save.badges.length;
  const s = ['orb', 'potion', 'antidote', 'parlyzheal', 'repel', 'escaperope'];
  if (b >= 1) s.push('greatorb', 'superpotion', 'awakening', 'burnheal', 'iceheal');
  if (b >= 2) s.push('netorb', 'quickorb', 'superrepel', 'fullheal', 'revive', 'xattack', 'xdefense', 'xspeed', 'xspatk', 'xspdef');
  if (b >= 3) s.push('duskorb', 'timerorb', 'hyperpotion', 'pokedoll');
  if (b >= 4) s.push('ultraorb', 'maxrepel');
  if (b >= 5) s.push('maxpotion', 'bondorb');
  if (b >= 6) s.push('fullrestore', 'maxrevive');
  return s;
};
