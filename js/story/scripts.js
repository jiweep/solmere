'use strict';
// ============================================================================
//  Story scripts. Each is async (S, ctx) => { ... } using the G.S helper API.
// ============================================================================
(function () {
  const SC = G.SCRIPTS;
  const P = () => G.save.name, R = () => G.save.rival;
  const HALE = 'Prof. Hale', WREN = () => G.save.rival, MOM = 'Mom';
  const pushBack = async (S, dir) => { await S.move('player', { up: 'd', down: 'u', left: 'r', right: 'l' }[dir] || 'd', 1); };
  const starterName = sp => G.SPECIES[sp].name;

  // ------------------------------------------------------ backdrop scenes
  G.IntroBackdrop = class {
    constructor() { this.opaque = true; this.t = 0; this.show = { hale: 0, mon: 0, player: 0 }; this.parts = new G.Particles(); }
    update() { this.t++; this.parts.update(); if (this.t % 5 === 0) this.parts.add({ x: G.rand() * G.W, y: G.H + 4, vy: -.3 - G.rand() * .4, life: 400, size: 1 + G.rand(), color: G.pick(['#8af0e0', '#c8a0ff', '#ffffff']), blend: 'lighter', fadeIn: 60 }); }
    draw(b) {
      const g = b.createRadialGradient(G.W / 2, G.H / 2, 20, G.W / 2, G.H / 2, 260); g.addColorStop(0, '#2a4a7a'); g.addColorStop(1, '#0a1020');
      b.fillStyle = g; b.fillRect(0, 0, G.W, G.H); this.parts.draw(b);
      b.fillStyle = 'rgba(255,255,255,.06)'; b.beginPath(); b.ellipse(G.W / 2, 160, 110, 16, 0, 0, Math.PI * 2); b.fill();
      if (this.show.hale > 0) { b.globalAlpha = this.show.hale; { const im = G.chars.portrait(G.LOOKS.hale, 'point'); b.drawImage(im, G.W / 2 - 40 - (im.width - 72) / 2 - (1 - this.show.hale) * 20, 74); }; b.globalAlpha = 1; }
      if (this.show.mon > 0) { const im = G.monArt.front('glimmer', false, Math.floor(this.t / 12) % 4); b.globalAlpha = this.show.mon; b.drawImage(im, G.W / 2 + 26, 60 + Math.sin(this.t / 20) * 3); b.globalAlpha = 1; }
      if (this.show.player > 0) { b.globalAlpha = this.show.player; { const im = G.chars.portrait(G.LOOKS[G.save.look], 'hip'); b.drawImage(im, G.W / 2 - 36 - (im.width - 72) / 2, 74); }; b.globalAlpha = 1; }
      if (this.show.wren > 0) { b.globalAlpha = this.show.wren; { const im = G.chars.portrait(G.LOOKS.wren, 'point'); b.drawImage(im, G.W / 2 - 36 - (im.width - 72) / 2, 74); }; b.globalAlpha = 1; }
    }
  };
  G.pickLook = function () {
    const looks = ['player_a', 'player_b', 'player_c', 'player_d'];
    return new Promise(res => G.push({
      lowres: false, i: 0, t: 0,
      update(top) { this.t++; if (!top) return; const I = G.input; if (I.repeat('left')) { this.i = (this.i + 3) % 4; G.audio && G.audio.sfx('cursor'); } if (I.repeat('right')) { this.i = (this.i + 1) % 4; G.audio && G.audio.sfx('cursor'); } if (I.pressed('a')) { I.consume('a'); G.audio && G.audio.sfx('select'); G.pop(this); res(looks[this.i]); } },
      drawUI() {
        const U = G.ui;
        U.panel(30, 8, G.W - 60, 150, 'glass', { r: 8 });
        U.text('Which one is you?', G.W / 2, 14, { size: 9, weight: 900, color: '#fff', align: 'center' });
        looks.forEach((k, j) => {
          const x = 52 + j * 72, sel = j === this.i;
          U.panel(x - 4, 30, 64, 116, sel ? 'select' : 'dark', { r: 6 });
          U.img(G.chars.portrait(G.LOOKS[k], sel ? 'hip' : 'stand'), x - 4 - (G.chars.portrait(G.LOOKS[k], 'stand').width - 72) / 2 * .88, 38 + (sel ? Math.sin(this.t / 8) * 1.5 : 0), { scale: .88 });
          const sheet = G.chars.sheet(G.LOOKS[k]);
          U.img(sheet[['down', 'left', 'up', 'right'][Math.floor(this.t / 30) % 4]][Math.floor(this.t / 10) % 3], x + 20, 122, { scale: 1 });
        });
        U.text('◀ ▶ choose · Z confirm', G.W / 2, 150, { size: 6, color: '#bcd', align: 'center' });
      },
    }));
  };
  // ------------------------------------------------------------- INTRO
  SC.intro_professor = async (S) => {
    if (G.runPrologue) await G.runPrologue();
    const bd = new G.IntroBackdrop(); G.push(bd);
    G.audio && G.audio.music('intro');
    await G.fadeIn(30);
    await G.tween(bd.show, { hale: 1 }, 30);
    const say = (t) => G.say(t, { speaker: HALE });
    await say('Hello there! Welcome to the region of Solmere!');
    await say('My name is Marisol Hale, but everyone around here just calls me "the Professor." I study Resonance: the invisible song that connects mons and the people who love them.');
    G.audio && G.audio.cry('glimmer');
    await G.tween(bd.show, { mon: 1 }, 24);
    await say('This little one is Glimmer. When it trusts someone, it glows. And look! It\'s glowing at you. That\'s a very good sign.');
    await say('Solmere is a ring of land around a great inland sea we call the Mere. At its heart stands the Tidelight, the oldest lighthouse in the world.');
    await say('The old stories say a great leviathan sleeps beneath it, and that its song is what lets mons and people understand one another.\\pI\'ve spent my whole life trying to prove those stories true.');
    await say('Now then! Tell me a little about yourself.');
    await G.tween(bd.show, { hale: 0, mon: 0 }, 16);
    G.save.look = await G.pickLook();
    if (G.world.scene) G.world.scene.player = null;
    await G.tween(bd.show, { player: 1 }, 20);
    const name = await G.askName({ title: 'What\'s your name?', start: '', max: 10, def: ['Alex', 'Robin', 'Kai', 'Sky'][['player_a', 'player_b', 'player_c', 'player_d'].indexOf(G.save.look)] || 'Alex', icon: () => G.chars.sheet(G.LOOKS[G.save.look]).down[Math.floor(G.realTime * 4) % 3] });
    G.save.name = name;
    await say(`${name}! What a wonderful name.`);
    await G.tween(bd.show, { player: 0, wren: 1 }, 20);
    await say('And this is your neighbor and best friend since forever. What was their name again?');
    const rn = await G.askName({ title: 'Your best friend\'s name?', start: 'Wren', max: 10, def: 'Wren', icon: () => G.chars.sheet(G.LOOKS.wren).down[Math.floor(G.realTime * 4) % 3] });
    G.save.rival = rn;
    await say(`Right! ${rn}. The two of you have been waiting for this day for years.`);
    await G.tween(bd.show, { wren: 0, hale: 1 }, 20);
    await say(`Today, you'll each receive your very first partner mon. ${name}, your story begins now. Come find me at my lab on the Brinehollow pier!`);
    await say('Oh, and one more thing... Out there, bonds are everything. Take care of your partners, and they\'ll take care of you.');
    await G.fadeOut(40);
    G.pop(bd);
    G.setFlag('intro_done');
    G.maps.reset();
    const w = new G.WorldScene(); G.push(w);
    w.enterMap('home2f', 3, 4, 'down');
    G.defineRivals();
    G.persist.write();
    await G.fadeIn(30);
    await G.say('Sunlight spills through the window. Today\'s the day!\\p{k}(Press X or Esc for the menu, and H for controls anytime.){w}');
  };
  // ------------------------------------------------------------- HOME
  SC.mom = async (S) => {
    S.facePlayer('mom');
    if (!G.flag('mom_talk')) {
      await S.say(`Good morning, sleepyhead! Today\'s the big day!`, MOM);
      await S.say(`Professor Hale called. She\'s expecting you at her lab on the pier. And ${R()} ran past the window an hour ago, practically bouncing.`, MOM);
      await S.say('Here, take this. It\'s a Tamer\'s Journal. It keeps track of your goals so you never lose your way.', MOM);
      await S.give('journal');
      S.quest('main1', 'lab');
      await S.say('And remember: you can run by holding Shift! Your mother knows things. Now go on, don\'t keep the Professor waiting!', MOM);
      S.set('mom_talk'); return;
    }
    const b = G.save.badges.length;
    if (G.flag('champion')) { await S.say(`My child, the Champion! The whole town watched on TV. I cried. Twice. Let me make you something warm.`, MOM); await S.heal(); return; }
    await S.say(G.pick([`You look tired, sweetie. Let\'s get you and your team some rest.`, `${b ? `${b} badge${b > 1 ? 's' : ''} already! ` : ''}Take a break and have some soup.`, 'Don\'t forget to change your underwear. And to heal your mons!']), MOM);
    await S.heal();
    await S.say('There! Everyone\'s good as new. Be careful out there!', MOM);
  };
  SC.wren_mom = async (S) => {
    S.facePlayer('wrenmom');
    if (G.flag('champion')) { await S.say(`${R()} told me everything. Thank you for looking out for my kid. Both of my kids, actually.`, 'Wren\'s Mom'); return; }
    if (G.flag('rival3_done') && !G.flag('hq_done')) { await S.say(`${R()} hasn\'t called in weeks. Ever since that Crane Fellowship... If you see them, tell them their mother misses them, will you?`, 'Wren\'s Mom'); return; }
    await S.say(`${R()} left for the lab at dawn. That kid wants to be Champion like their big sibling Sable so badly... I just hope they remember to have fun.`, 'Wren\'s Mom');
  };
  // ------------------------------------------------------------- BRINEHOLLOW
  SC.bh_block = async (S) => {
    await S.say(`"Heeey! ${P()}! You can\'t go out there without a partner! The Professor\'s lab is on the pier, remember?!"`, WREN());
    await pushBack(S, 'up');
  };
  SC.bh_fisher = async (S) => {
    S.facePlayer('bh_fisher');
    await S.say('They say you can fish off this pier for Flopfin. Nobody wants a Flopfin. They just... flop.', 'Fisherman');
    if (G.bag.has('rod')) await S.say('Oh, you\'ve got a rod? Face the water and press Z. When you see the {r}!{w}, reel it in quick!', 'Fisherman');
  };
  // ------------------------------------------------------------- LAB
  SC.lab_enter = async (S) => {
    if (G.flag('lab_intro') || G.flag('got_starter')) return;
    await G.wait(10);
    await S.emote('wren_lab', '!');
    await S.say(`${P()}! Finally! The Professor wouldn\'t let me pick until you got here!`, WREN());
    await S.say(`Ah, you made it! Come in, come in. Mind the cables, and the puddles. I was testing a Sealet\'s splash radius.`, HALE);
    await S.walkTo('player', 5, 6);
    S.face('player', 'up');
    await S.say('On the table are three Orbs, each holding a young mon who\'s been waiting for a partner.', HALE);
    await S.say('{g}Budling{w}, a Grass-type fawn with a sapling on its brow. {r}Kindlet{w}, a Fire-type kit with flames in its ears. And {b}Sealet{w}, a Water-type pup with the best whiskers in Solmere.', HALE);
    await S.say(`${P()}, you arrived second, but ${R()} insisted... you get to choose first! Go ahead, take a look at each of them.`, HALE);
    await S.say('Hmph. Fine. But I\'m picking the one that beats yours!', WREN());
    S.set('lab_intro');
  };
  const starterPreview = (sp) => new Promise(res => G.push({
    lowres: false, t: 0, update() { this.t++; if (this.t === 1) G.audio && G.audio.cry(sp); },
    drawUI() {
      const U = G.ui, s = G.SPECIES[sp];
      U.panel(40, 8, G.W - 80, 146, 'light', { r: 8 });
      U.panel(48, 16, 110, 110, 'dark', { r: 6 });
      U.img(G.monArt.front(sp, false, Math.floor(this.t / 12) % 4), 55, 22);
      U.text(s.name, 166, 20, { size: 11, weight: 900 });
      U.text(`The ${s.cat} Mon`, 166, 34, { size: 6.4, color: '#6a7080' });
      U.typeBadge(s.types[0], 166, 44, 36, 10);
      G.ui.wrap(s.dex, 170, 6.2).forEach((l, k) => U.text(l, 166, 60 + k * 9.4, { size: 6.2, color: '#4a5060' }));
      U.text('Final form learns a signature move!', 166, 116, { size: 5.6, weight: 800, color: G.TYPE_COLORS[s.types[0]] });
      this.res = res;
    },
  })).then(() => { });
  const chooseStarter = async (S, sp) => {
    if (G.flag('got_starter')) return;
    if (!G.flag('lab_intro')) { await SC.lab_enter(S); }
    const sc = { lowres: false, t: 0, update() { this.t++; }, drawUI() {
      const U = G.ui, s = G.SPECIES[sp]; U.panel(40, 8, G.W - 80, 146, 'light', { r: 8 }); U.panel(48, 16, 110, 110, 'dark', { r: 6 });
      U.img(G.monArt.front(sp, false, Math.floor(this.t / 12) % 4), 55, 22); U.text(s.name, 166, 20, { size: 11, weight: 900 }); U.text(`The ${s.cat} Mon`, 166, 34, { size: 6.4, color: '#6a7080' });
      U.typeBadge(s.types[0], 166, 44, 36, 10); G.ui.wrap(s.dex, 170, 6.2).forEach((l, k) => U.text(l, 166, 60 + k * 9.4, { size: 6.2, color: '#4a5060' }));
      const fin = G.SPECIES[G.evoLine(sp).slice(-1)[0].id]; U.text(`Evolves into ${G.SPECIES[G.evoLine(sp)[1].id].name}, then ${fin.name} (${fin.types.map(G.cap).join('/')}).`, 166, 112, { size: 5.6, weight: 800, color: G.TYPE_COLORS[s.types[0]] });
    } };
    G.push(sc); G.audio && G.audio.cry(sp);
    const shown = G.randomizeSpecies(sp, 'starter');
    const ok = await G.yesno(`So, you want ${starterName(sp)}, the ${G.cap(G.SPECIES[sp].types[0])}-type mon?`);
    G.pop(sc);
    if (!ok) return;
    G.setVar('starter', sp);
    G.defineRivals();
    await S.giveMon(sp, 5, { starter: true, bond: 120, ball: 'orb', text: `${starterName(shown)} seems happy to meet you!` });
    S.set('got_starter');
    for (const id of ['starter_budling', 'starter_kindlet', 'starter_sealet']) { }
    S.w.spawnEnts();
    const rsp = G.rivalOf[sp];
    await S.say(`Then I\'ll take ${starterName(rsp)}! It\'s got the type advantage. Heh!`, WREN());
    await S.say(`${R()} received ${starterName(G.randomizeSpecies(rsp, 'starter'))}!`);
    await S.say(`Wonderful! Oh, and before I forget — take this. It\'s a Dex. It records every mon you see and catch. I built it myself! Mostly!`, HALE);
    await S.give('dex');
    await S.say(`${P()}! Let\'s battle! Right now, right here!`, WREN());
    await S.say('In my lab?! ...Oh, fine. Just don\'t knock over the Resonance meter.', HALE);
    const won = await G.storyBattle('rival1', { canLose: true });
    S.set('rival1_done');
    await S.say(won ? 'Aw, man! You got lucky! Next time I\'ll win for sure!' : 'Hah! Did you see that?! I won! Don\'t worry, you\'ll get better. Probably!', WREN());
    await S.say('What a battle! Here, let me patch your mons up.', HALE);
    await S.heal();
    await S.say(`Now, I have a favor to ask. Warden Juniper in Fernwick Town, just north along Route 1, has been waiting on my latest Resonance research. Would you deliver this to her?`, HALE);
    await S.give('parcel');
    S.quest('main1', 'parcel');
    await S.say(`And ${P()}... Juniper is a Warden. Wardens lead the gyms. Beat all six, and the Conclave will invite you to challenge the Champion. Just saying!`, HALE);
    await S.say(`I\'ll meet you on Route 1! Don\'t keep me waiting!`, WREN());
    const wr = S.npc('wren_lab');
    if (wr) { await S.move('wren_lab', 'dddr', 2); S.remove('wren_lab'); G.audio && G.audio.sfx('door'); }
  };
  SC.starter_budling = S => chooseStarter(S, 'budling');
  SC.starter_kindlet = S => chooseStarter(S, 'kindlet');
  SC.starter_sealet = S => chooseStarter(S, 'sealet');
  SC.wren_lab = async (S) => { S.facePlayer('wren_lab'); await S.say(G.flag('lab_intro') ? 'Go on, pick one already! I\'ve been waiting since sunrise!' : `${P()}! Get over here!`, WREN()); };
  SC.lab_aide = async (S) => {
    S.facePlayer('aide');
    const lines = ['The Professor\'s Resonance meter spikes whenever a mon evolves. Fascinating stuff!', 'Did you know? A mon\'s nature changes how its stats grow. Check the summary screen: red arrows go up, blue ones go down!', 'Every mon has hidden potential called IVs. The summary shows them plainly. We scientists love transparency!', 'Walking with your partner builds bond. Some mons even evolve from a strong bond!'];
    await S.say(G.pick(lines), 'Lab Aide');
  };
  SC.hale = async (S) => {
    S.facePlayer('hale');
    if (!G.flag('got_starter')) { await S.say('Take a look at the three Orbs on the table. Choose the partner who calls to you!', HALE); return; }
    const d = G.dexCount();
    if (d.caught >= 40 && !G.flag('dex40')) { await S.say(`${d.caught} species already?! You\'re a natural researcher! Here, a little something for your team.`, HALE); await S.give('expcandy', 5); S.set('dex40'); S.quest('side_dex', 'part2'); }
    if (d.caught >= 70 && !G.flag('dex70')) { await S.say(`${d.caught} species... This is incredible. Take this — the Shiny Charm. It triples your chances of meeting a shiny mon!`, HALE); await S.give('shinycharm'); S.set('dex70'); S.quest('side_dex', 'done'); return; }
    if (!G.save.quests.side_dex) S.quest('side_dex', 'part1');
    const tips = G.flag('champion') ? `Champion ${P()}! I heard strange reports from Starfall Peak, north-west of Frostpeak. The stars are going out there... one by one.` : `You\'ve caught ${d.caught} of ${d.total} species. Keep exploring! Different mons appear at night, while surfing, and when fishing.`;
    await S.say(tips, HALE);
    if (G.flag('champion') && !G.save.quests.post1) S.quest('post1', 'start');
  };
  // ------------------------------------------------------------- ROUTE 1
  SC.route1_tutorial = async (S) => {
    const w = S.w;
    await S.approach('r1w', 'wren', { prefer: ['up', 'left', 'right'] });
    await S.emote('r1w', '!');
    await S.say(`There you are! Before you go charging into the tall grass, let me show you something!`, WREN());
    await S.say('When you meet a wild mon, weaken it first. The lower its HP, the easier it is to catch. Sleep or paralysis helps a ton, too!', WREN());
    await S.say('Then you throw one of these!', WREN());
    await S.give('orb', 5);
    await S.say(`Oh, and the Professor says your Dex tracks every area\'s wild mons. Check "Encounters" in the menu! Now... race you to Fernwick! Loser buys the Sun Berries!`, WREN());
    await S.fadeOut(10); S.remove('r1w'); await S.fadeIn(10);
    S.set('route1_tut');
    // a real race: the clock only runs while you're walking the route (battles pause it)
    await S.say('{k}Race to Fernwick! Reach the town entrance before the timer runs out. Hold Shift to run!{w}');
    G.setVar('raceLeft', 60 * 22); S.set('race_active');
    G.audio && G.audio.sfx('exclaim');
  };
  SC.race_finish = async (S) => {
    const won = G.flag('race_active');
    S.set('race_done'); G.clearFlag ? G.clearFlag('race_active') : (G.save.flags.race_active = false);
    await S.approach('rw', 'wren', { prefer: ['up', 'left', 'right'] });
    if (won) {
      await S.emote('rw', '!');
      await S.say(`Huff... huff... No way! You actually beat me?! I took a shortcut and everything!`, WREN());
      await S.say('Fine, a deal\'s a deal. Sun Berries, as promised. Give one to your partner to hold. It\'ll patch them up mid-battle.', WREN());
      await S.give('sunberry', 2);
      G.save.stats.raceWins = (G.save.stats.raceWins || 0) + 1;
    } else {
      await S.say(`Hah! Too slow, ${P()}! You owe me Sun Berries! ...I\'ll put it on your tab.`, WREN());
    }
    await S.say('The gym\'s at the top of town. Warden Juniper\'s tough. See you in there!', WREN());
    await S.fadeOut(10); S.remove('rw'); await S.fadeIn(10);
  };
  SC.hollis = async (S) => {
    S.facePlayer('hollis');
    if (!G.flag('lostcub_active')) {
      await S.say('Oh, a young Tamer! Could you help an old farmer? My Snoozle wandered off again. Last I saw, it was headed for the tall grass up north on Route 1.', 'Farmer Hollis');
      S.set('lostcub_active'); S.quest('side_lostcub', 'find'); S.w.spawnEnts(); return;
    }
    if (!G.flag('lostcub_found')) { await S.say('Any sign of my Snoozle? It naps in tall grass... look for a big snoring lump!', 'Farmer Hollis'); return; }
    if (!G.flag('lostcub_done')) {
      await S.say('Snoozle! You found it! Oh, thank you, thank you. It must\'ve followed its nose to the wild berries again.', 'Farmer Hollis');
      await S.say('Please, take this Soothe Bell. A mon holding it bonds with you faster.', 'Farmer Hollis');
      await S.give('soothebell');
      await S.say('And... Snoozle\'s little brother has been following you around the whole time you\'ve been standing here. I think he wants to go with you. Would you take him along?', 'Farmer Hollis');
      if (await G.yesno('Take the young Snoozle?')) await S.giveMon('snoozle', 8, { text: 'The little Snoozle yawned and climbed into an Orb!', bond: 140 });
      else await S.say('No worries. He\'ll be here if you change your mind.', 'Farmer Hollis');
      S.set('lostcub_done'); S.quest('side_lostcub', 'done'); S.w.spawnEnts(); return;
    }
    if (!G.flag('lostcub_gift') && !G.party.hasSpecies('snoozle')) { if (await G.yesno('Snoozle\'s little brother still wants to come with you. Take him?')) { await S.giveMon('snoozle', 10, { bond: 140 }); S.set('lostcub_gift'); } return; }
    await S.say('Snoozle sleeps sixteen hours a day. Honestly, I\'m jealous.', 'Farmer Hollis');
  };
  SC.lostcub_found = async (S) => {
    await S.say('A big, fluffy Snoozle is snoring in the tall grass. It smells faintly of berries.');
    G.audio && G.audio.cry('snoozle');
    await S.emote('snoozle_lost', 'zzz', 40);
    await S.say('Snoozle woke up! It seems to recognize the smell of Hollis\'s farm on you... It waddled off toward the farmhouse!');
    S.remove('snoozle_lost'); S.set('lostcub_found'); S.quest('side_lostcub', 'return');
  };
  G.QUESTS.side_lostcub.steps = { find: G.QUESTS.side_lostcub.desc, return: 'Snoozle headed home. Go see Farmer Hollis at his farmhouse on Route 1.' };
  SC.gate_guard = async (S) => {
    S.facePlayer('gateguard');
    const b = G.save.badges.length;
    if (b < 6) { await S.say(`Halt! Only Tamers who hold all six Warden badges may walk Victory Road. You have ${b}. Come back when you have them all!`, 'Guard'); return; }
    if (!G.flag('tidelight_done')) { await S.say('Six badges... impressive. But the Tidelight has gone dark, and the Conclave has sealed Victory Road until it shines again.', 'Guard'); return; }
    await S.say('The Tidelight shines once more, thanks to you. Victory Road is open. Go forth, Tamer!', 'Guard');
    await S.move('gateguard', 'l', 1); S.face('gateguard', 'right');
    S.set('vr_open');
  };
  // ------------------------------------------------------------- FERNWICK
  SC.fern_guard = async (S) => {
    await S.say('Hold on! Rangers spotted suspicious folks in Whisperwood. Nobody goes east without a Warden\'s badge. Juniper\'s orders!', 'Ranger');
    await pushBack(S, 'right');
  };
  SC.fern_guard_talk = async (S) => { S.facePlayer('fw_guard'); await S.say('Earn Warden Juniper\'s badge, then I\'ll let you through to Route 2.', 'Ranger'); };
  SC.florist_bea = async (S) => {
    S.facePlayer('fw_bea');
    if (!G.save.quests.side_petals) {
      await S.say('Oh, a traveler! Are you headed toward Galvan Harbor, by chance? My sister Rhoda lives there. Could you tell her that her birthday bouquet is coming by boat?', 'Florist Bea');
      await S.say('Here, take a flower for the road. Well... a seed.', 'Florist Bea');
      await S.give('oranberry', 2); S.quest('side_petals', 'go'); S.set('bouquet'); return;
    }
    if (G.save.quests.side_petals.step === 'done') { await S.say('Rhoda sent me a letter! She loved the bouquet. Thank you, dear.', 'Florist Bea'); return; }
    await S.say('Rhoda lives in the south-east corner of Galvan Harbor. Tell her the bouquet\'s coming!', 'Florist Bea');
  };
  SC.dowsing_man = async (S) => {
    S.facePlayer('fw_dowse');
    if (!G.bag.has('dowsing')) { await S.say('Treasure! It\'s everywhere, hidden in the ground! Take my spare Dowsing Rod. Use it from the Bag to sniff out hidden items!', 'Treasure Hunter'); await S.give('dowsing'); return; }
    await S.say('Tip: hidden items often sit at the dead ends of paths and behind trees. Search everywhere!', 'Treasure Hunter');
  };
  SC.nickname_rater = async (S) => {
    S.facePlayer('fh2');
    const m = G.party.lead(); if (!m) return;
    await S.say(`Ah, ${G.mon.name(m)}! ${m.nick ? 'A fine, fine nickname. It suits them perfectly!' : 'No nickname? You can give one from the Party menu anytime! Mons love a good name.'}`, 'Name Enthusiast');
  };
  SC.gym_guide = async (S, ctx) => {
    const id = S.w.map.id;
    const info = {
      fernwick_gym: ['Grass', 'Fire, Flying, Bug, Poison and Ice moves wilt grass. Watch for Leech Seed and Stun Spore!'],
      galvan_gym: ['Electric', 'Ground types are immune to Electric moves! Step on the glowing pads to open the barriers.'],
      cinder_gym: ['Fire', 'Water, Ground and Rock moves douse the flames. Brann\'s ace Resonates, so save a counter!'],
      dusk_gym: ['Ghost', 'Dark and Ghost moves haunt ghosts right back. Normal and Fighting moves pass right through them!'],
      frost_gym: ['Ice', 'Slide carefully! Fire, Fighting, Rock and Steel moves shatter ice. Sigrid fights in snow, which toughens Ice types.'],
      sky_gym: ['Dragon', 'Ice, Dragon and Fairy moves are the dragon slayers. Kaelen\'s Tempestral is the real deal.'],
    }[id] || ['?', 'Good luck!'];
    await S.say(`Yo, future champ! This gym specializes in ${info[0]}-type mons. ${info[1]}`, 'Gym Guide');
    if (id === 'dusk_gym' && !G.bag.has('lantern')) { await S.say('It\'s pitch black in here. Take this Lantern, you\'ll see a lot farther!', 'Gym Guide'); await S.give('lantern'); }
    if (!G.bag.has('ether') && G.chance(.5)) { await S.say('Here, have a little something on the house!', 'Gym Guide'); await S.give('superpotion', 2); }
  };
  const wardenWin = async (S, o) => {
    await S.badge(o.badge);
    S.set(o.flag);
    if (o.tm) { await S.say(o.tmText, o.name); await S.give(o.tm); }
    if (o.extra) await o.extra();
    for (const t of o.gymTrainers || []) G.save.trainers[t] = G.save.trainers[t] || { badges: G.save.badges.length };
    G.persist.write();
  };
  SC.juniper = async (S) => {
    const N = 'Warden Juniper';
    S.facePlayer('juniper_npc');
    if (G.flag('badge1')) { await S.say('The flowers in this gym bloom a little brighter since our battle. Isn\'t that lovely? Whisperwood is east, past Route 2. Please be careful.', N); return; }
    if (G.bag.has('parcel') && !G.flag('parcel_given')) {
      await S.say('Oh! A delivery? For me? From Marisol! Her handwriting is still impossible.', N);
      G.bag.remove('parcel'); S.set('parcel_given');
      await S.say('Field notes on Resonance... "Bond strength correlates with growth, recovery, and courage." How wonderful.', N);
      await S.say('Now, you didn\'t come all this way just to deliver mail, did you? I can see it in your eyes. You want a badge.', N);
    }
    await S.say('I\'m Juniper, Warden of Fernwick. My mons and I grow slowly, the way flowers do. Roots first, then bloom. Show me the bond you\'ve started growing!', N);
    const won = await G.storyBattle('juniper');
    if (!won) return;
    await S.say('What a beautiful battle. Please, accept the Bloom Badge.', N);
    await wardenWin(S, { badge: 'bloom', flag: 'badge1', name: N, tm: 'tm19', tmText: 'And this TM: Giga Drain. It drains a foe\'s HP to heal your own. Grow together!', gymTrainers: ['fg_1', 'fg_2'] });
    await S.say('Now... may I ask a favor too? Rangers say gray-coated strangers are poking around the Heartroot Shrine deep in Whisperwood, east along Route 2. Would you check on it for me? I\'ll let the guard know you\'re coming.', N);
    S.quest('main1', 'done'); S.quest('main2', 'go');
  };
  // ------------------------------------------------------------- ROUTE 2
  SC.berry_lady = async (S) => {
    S.facePlayer('r2_berry');
    const day = Math.floor(G.save.playtime / 2880);
    if (G.getVar('berryday', -1) === day) { await S.say('The bushes need time to regrow. Come back tomorrow! (A day passes about every 48 minutes.)', 'Berry Farmer'); return; }
    G.setVar('berryday', day);
    const b = G.pick(['oranberry', 'sunberry', 'cheriberry', 'chestoberry', 'pechaberry', 'rawstberry', 'lumenberry', 'leppaberry']);
    await S.say('The pondside bushes are heavy with berries today. Have some!', 'Berry Farmer');
    await S.give(b, 2);
  };
  // ------------------------------------------------------------- WHISPERWOOD
  SC.wood_grunts = async (S) => {
    if (G.flag('wood_done')) return;
    const g1 = S.npc('ww_g1'), g2 = S.npc('ww_g2');
    await S.say('"Hurry up and pry the crystal loose!"  "It\'s stuck! These stupid roots won\'t let go!"');
    G.audio && G.audio.music('encounter_villain');
    if (g1) g1.dir = 'down'; if (g2) g2.dir = 'down';
    await S.emote('ww_g1', '!', 30);
    await S.say('Hey! A kid! Beat it! The Hollow has business here!', 'Hollow Grunt');
    let won = await G.storyBattle('ww_grunt1'); if (!won) return;
    await S.say('You beat him?! Then you\'ll have to beat me too!', 'Hollow Grunt');
    won = await G.storyBattle('ww_grunt2'); if (!won) return;
    await S.say('Tch! Whatever! We already chipped off a shard. The Director will be pleased enough. Let\'s go!', 'Hollow Grunt');
    await Promise.all([S.move('ww_g1', 'uu', 2), S.move('ww_g2', 'uu', 2)]); await S.fadeOut(8);
    S.remove('ww_g1'); S.remove('ww_g2'); await S.fadeIn(8);
    S.restoreMusic();
    await S.say(`Thank you, Tamer. They ambushed me at the shrine. I\'m Ash, a Whisperwood Ranger.`, 'Ranger Ash');
    await S.say('They called themselves the Hollow. Gray coats, visors... and Crane Dynamics equipment. Here, take this Trail Knife. Thin saplings block a few paths in Solmere. This clears them right up.', 'Ranger Ash');
    await S.give('trailknife');
    await S.say(`"${P()}! ${P()}!"`);
    await S.approach('wwhale', 'hale', { prefer: ['up', 'left', 'right', 'down'] });
    await S.say(`Oh thank goodness, you\'re alright! Juniper called me the moment you left. I ran the whole way. My legs are not built for running.`, HALE);
    await S.say('Look at the Heartroot... It\'s a Resonance crystal. And it\'s been pulsing in time with your team this whole battle. Your bond is already strong enough to make it sing!', HALE);
    await S.say('I think you\'re ready for this. It\'s a Resonance Band.', HALE);
    await S.give('resonanceband');
    await S.say('Once per battle, a mon that trusts you can {c}Resonate{w}. Its main type\'s moves become devastating, and a Resonant Shield softens the first super-effective hit it takes.\\pIn battle, open FIGHT and press R. Choose the moment wisely!', HALE);
    await S.say('And take this EXP Share too. With it, your whole team grows together, even the ones resting in reserve.', HALE);
    await S.give('expshare');
    await S.say('The Hollow... there are rumors they work for Crane Dynamics in Galvan Harbor, north of here. The Warden there, Ione, might know more. Please, be careful.', HALE);
    await S.fadeOut(10); S.remove('wwhale'); await S.fadeIn(10);
    S.set('wood_done'); S.quest('main2', 'done'); S.quest('main3', 'go');
    G.persist.write();
  };
  SC.ranger_ash = async (S) => {
    S.facePlayer('ww_ash');
    await S.say(G.flag('wood_done') ? 'The Heartroot is healing. I can feel it. Thank you, Tamer. Galvan Harbor is north through the forest.' : 'Please... those Hollow people are at the shrine!', 'Ranger Ash');
  };
  // ------------------------------------------------------------- GALVAN
  SC.crane_speech = async (S) => {
    if (!G.flag('wood_done')) { S.set('crane_speech'); return; }
    S.music('crane');
    const crane = S.spawn({ id: 'gv_crane', x: 17, y: 8, look: 'crane', dir: 'up' });
    const wr = S.spawn({ id: 'gv_wren', x: 15, y: 9, look: 'wren', dir: 'right' });
    const c1 = S.spawn({ id: 'gv_c1', x: 19, y: 9, look: 'worker', dir: 'left' });
    const c2 = S.spawn({ id: 'gv_c2', x: 16, y: 10, look: 'woman', dir: 'up' });
    await S.say('A crowd has gathered by the fountain. A woman in a white coat is speaking.');
    crane.dir = 'down';
    const N = 'Director Crane';
    await S.say('Citizens of Galvan. For twelve years, Crane Dynamics has powered your homes, your ships, your lives. Today, I offer you something greater.', N);
    await S.say('Resonance. The bond between a mon and its Tamer is the most powerful force in Solmere. And yet it is so fragile. Bonds break. Partners are lost.', N);
    await S.say('The Chorus Initiative will change that. Soon every bond in Solmere will be harmonized. Protected. Eternal.', N);
    await S.say('Join the Crane Fellowship, and help us build a world where no one ever loses a partner again.', N);
    await S.say('The crowd applauds politely. Director Crane\'s eyes linger on the horizon, toward the middle of the Mere.');
    await S.move('gv_crane', 'ddd', 1); S.remove('gv_crane');
    S.remove('gv_c1'); S.remove('gv_c2');
    S.remove('gv_wren'); await S.approach('gv_wren', 'wren');
    await S.say(`${P()}! Did you hear that?! The Crane Fellowship! They train you with special equipment, and your mons get super strong!`, WREN());
    await S.say('I\'m going to Ione\'s gym first. But after that... I\'m signing up. Imagine being THAT strong, THAT fast! Sable would have to take me seriously then!', WREN());
    await S.fadeOut(10); S.remove('gv_wren'); await S.fadeIn(10);
    S.restoreMusic(); S.set('crane_speech');
  };
  SC.ione = async (S) => {
    const N = 'Warden Ione';
    S.facePlayer('ione_npc');
    if (G.flag('badge2')) { await S.say('Keep that current flowing, champ! Route 3 is east of the city. Glimmer Cave leads to Cindervale.', N); return; }
    await S.say('Yo yo yo! Welcome to the Galvan Gym, where the voltage is high and the bass is higher!', N);
    await S.say('I\'m Ione. By day I keep this city\'s grid running. By night I DJ at the docks. And right now? I\'m about to turn your world UP!', N);
    const won = await G.storyBattle('ione'); if (!won) return;
    await S.say('Mic drop! You totally rocked the house. The Current Badge is yours!', N);
    await wardenWin(S, { badge: 'current', flag: 'badge2', name: N, tm: 'tm34', tmText: 'Here, take TM34: Volt Dash! Hit hard, then switch out. The perfect remix!', gymTrainers: ['gg_1', 'gg_2', 'gg_3'] });
    await S.say('Hey, real talk... Crane Dynamics sponsors my gym. But those Fellowship kids? Glazed eyes, amped-up mons. Something\'s off.', N);
    await S.say('Head east along Route 3. Glimmer Cave leads to Cindervale. Stay sharp!', N);
    S.quest('main3', 'done'); S.quest('main4', 'go');
  };
  SC.bike_shop = async (S) => {
    S.facePlayer('bikeguy');
    if (G.bag.has('bike')) { await S.say('How\'s the bike? Press F to hop on and off. It\'s way faster than running!', 'Spoke'); return; }
    if (!G.flag('badge2')) { await S.say('Nice shop, right? I only give my prototype bikes to Tamers with two badges or more. Word is, it\'s great advertising!', 'Spoke'); return; }
    await S.say('Whoa, two badges! You\'re exactly who I\'m looking for. Take this folding bike, free! Just tell everybody where you got it!', 'Spoke');
    await S.give('bike', 1, { note: 'Press F to hop on or off. You can also register it in the Bag.' });
    S.set('got_bike');
  };
  SC.old_salt_marv = async (S) => {
    S.facePlayer('gv_marv');
    const N = 'Old Salt Marv';
    if (!G.bag.has('rod')) { await S.say('Ahoy, youngster! Ever fished? Here, take my old rod. Face the water and press Z. When you see the "!", reel it in quick!', N); await S.give('rod'); }
    const q = G.save.quests.side_fish;
    if (q && q.step === 'done') { await S.say('That Riptalon of yours... I dream of it every night. Happy dreams!', N); return; }
    if (G.save.party.some(m => m.sp === 'riptalon')) {
      await S.say('Is that... a RIPTALON?! Evolved from a Flopfin?! I KNEW IT! Fifty years they laughed at me!', N);
      await S.say('Take my Pro Rod, you\'ve earned it! It hooks rarer mons in deeper water.', N);
      await S.give('prorod'); S.quest('side_fish', 'done'); return;
    }
    if (!q) S.quest('side_fish', 'go');
    await S.say('Everyone laughs at Flopfin. But I say one day it\'ll become something magnificent. Show me a Riptalon and I\'ll give you my prized Pro Rod!', N);
  };
  SC.rhoda = async (S) => {
    S.facePlayer('gv_rhoda');
    if (G.flag('bouquet') && G.save.quests.side_petals && G.save.quests.side_petals.step !== 'done') {
      await S.say('A message from Bea? Oh, my silly sister! A birthday bouquet, by boat! She always remembers.', 'Rhoda');
      await S.say('Please, take this. Bea grew it herself, years ago. It makes Grass moves stronger.', 'Rhoda');
      await S.give('miracleseed'); S.quest('side_petals', 'done'); return;
    }
    await S.say('The harbor air is lovely, but I do miss the flowers of Fernwick.', 'Rhoda');
  };
  SC.vsrecorder_npc = async (S) => {
    S.facePlayer('gv_vsr');
    if (!G.bag.has('vsrecorder') && G.flag('badge2')) { await S.say('You look like a Tamer who likes a rematch! This Vs. Recorder lets beaten trainers challenge you again once you\'ve earned another badge.', 'Officer Jenna'); await S.give('vsrecorder'); return; }
    await S.say(G.bag.has('vsrecorder') ? 'Trainers you\'ve beaten want rematches after each new badge. Just talk to them again!' : 'Come see me once you\'ve earned Ione\'s badge. I\'ve got something for you.', 'Officer Jenna');
  };
  SC.ev_trainer = async (S) => {
    S.facePlayer('gh1');
    const N = 'Stat Scholar';
    await S.say('Effort Values! Every mon you defeat trains your team\'s stats a little. I can show you — and reset them, for a fee.', N);
    const k = await G.ask('What would you like?', ['Check lead mon', 'Reset EVs ($2,000)', 'Nothing'], { speaker: N });
    const m = G.party.lead();
    if (k === 0 && m) await S.say(`${G.mon.name(m)}: ${G.STATS.map(s => G.STAT_SHORT[s] + ' ' + m.evs[s]).join(', ')}. Total ${G.mon.totalEVs(m)}/510.`, N);
    if (k === 1) {
      const i = await G.openParty({ mode: 'select', prompt: 'Reset whose EVs?' }); if (i === null || i < 0) return;
      if (G.save.money < 2000) { await S.say('You don\'t have enough money!', N); return; }
      G.save.money -= 2000; for (const s of G.STATS) G.save.party[i].evs[s] = 0; await S.say('Done! A clean slate for training.', N);
    }
  };
  SC.move_tutor = async (S) => {
    S.facePlayer('gh2');
    const N = 'Move Tutor';
    const moves = ['bondstrike', 'helpinghand', 'drainpunch', 'zenstrike', 'heatwave', 'icygust', 'aerialace', 'ironhead', 'seedbomb', 'shadowclaw', 'playrough', 'earthpower'];
    await S.say('I teach special moves for $2,000 each. Pick a mon and I\'ll show you what it can learn.', N);
    const i = await G.openParty({ mode: 'select', prompt: 'Teach which mon?' }); if (i === null || i < 0) return;
    const m = G.save.party[i];
    const ok = moves.filter(mv => (mv === 'bondstrike' || mv === 'helpinghand' || G.canLearnTM(m.sp, mv) || G.SPECIES[m.sp].types.concat(G.SPECIES[m.sp].tmx || []).includes(G.MOVES[mv].type)) && !G.mon.hasMove(m, mv));
    if (!ok.length) { await S.say(`Hmm, I have nothing new for ${G.mon.name(m)}.`, N); return; }
    const k = await G.choose(ok.map(mv => ({ label: G.MOVES[mv].name, right: G.cap(G.MOVES[mv].type) })).concat([{ label: 'Cancel' }]), { x: 150, y: 20, w: 150, cancel: ok.length, title: 'Teach which move?' });
    if (k < 0 || k >= ok.length) return;
    if (G.save.money < 2000) { await S.say('You don\'t have enough money!', N); return; }
    if (await G.learnWithPrompt(m, ok[k])) G.save.money -= 2000;
  };
  const tradeFlow = async (S, id, want, give, nick, lvl, N) => {
    if (G.flag('trade_' + id)) { await S.say(`How\'s ${nick} doing? I bet you two are great friends by now.`, N); return; }
    await S.say(`I\'m looking for a ${G.SPECIES[want].name}. I\'ll trade you my ${G.SPECIES[give].name} "${nick}" for one!`, N);
    if (!await G.yesno(`Trade a ${G.SPECIES[want].name} for ${nick}?`)) return;
    const i = await G.openParty({ mode: 'select', prompt: `Trade which ${G.SPECIES[want].name}?`, filter: m => m.sp === want, filterMsg: `That's not a ${G.SPECIES[want].name}.` });
    if (i === null || i < 0) { await S.say('Aw, maybe next time.', N); return; }
    const old = G.save.party[i];
    const nm = G.mon.create(give, Math.max(lvl, old.lvl), { perfectIVs: 2, ot: N.split(' ').pop(), otId: 12345, nick, met: { loc: S.w.map.name + ' (trade)', lvl } });
    nm.bond = 90; if (old.item) G.bag.add(old.item);
    G.save.party[i] = nm; G.dexMark(give, 'caught');
    G.audio && G.audio.jingle('newmon');
    await S.say(`You traded ${G.mon.name(old)} for ${nick}!\\p(Traded mons earn 1.5× EXP.)`);
    S.set('trade_' + id); S.w.placeFollower();
  };
  SC.trade_npc_galvan = S => { S.facePlayer('gh3'); return tradeFlow(S, 'galvan', 'digmole', 'zipsquee', 'Sparky', 18, 'Grandpa Ott'); };
  SC.trade_npc_frost = S => { S.facePlayer('fh2'); return tradeFlow(S, 'frost', 'rascoon', 'shiftail', 'Fluffles', 30, 'Skier Mika'); };
  SC.crane_reception = async (S) => {
    S.facePlayer('cl_recep');
    await S.say(G.flag('hq_done') ? 'The Director has... stepped down. We\'re all very confused. Would you like a brochure? They\'re all very outdated now.' : 'Welcome to Crane Dynamics! The Director works from headquarters in Skyreach. Would you like a brochure about the Chorus Initiative? It\'s the future!', 'Receptionist');
  };
  SC.dr_orla = async (S) => {
    S.facePlayer('orla');
    const N = 'Dr. Orla';
    const f = ['clawfossil', 'wingfossil'].find(i => G.bag.has(i));
    if (f) {
      const sp = G.ITEMS[f].fossil;
      await S.say(`A ${G.ITEMS[f].name}! Magnificent! Our Revival Lab can bring it back to life. Just a moment...`, N);
      G.bag.remove(f); await S.fadeOut(20); G.audio && G.audio.sfx('pc_on'); await S.wait(60); await S.fadeIn(20);
      await S.say('It worked! Here it is!', N);
      await S.giveMon(sp, 25, { perfectIVs: 2, text: `The ${G.SPECIES[sp].name} blinks at you, then nuzzles your hand!` });
      S.quest('side_fossil', 'done'); return;
    }
    if (!G.save.quests.side_fossil) S.quest('side_fossil', 'go');
    await S.say('I\'m Dr. Orla, curator. Diggers in Glimmer Cave, east of Route 3, keep finding fossils. If you find one, bring it here and I\'ll revive it!', N);
  };
  // ------------------------------------------------------------- GLIMMER CAVE
  SC.lark1 = async (S) => {
    if (G.flag('lark1_done')) return;
    const N = 'Admin Lark';
    S.faceEach('gc_lark', 'player');
    G.audio && G.audio.music('encounter_villain');
    await S.emote('gc_lark', '!');
    await S.say('Well, well, well! If it isn\'t the brat who embarrassed my grunts in the woods!', N);
    await S.say('I\'m Lark, Admin of the Hollow. These pretty singing crystals? OURS. The Director needs every last drop of Resonance they\'ve got.', N);
    await S.say('So be a good little Tamer and get lost. No? Ugh. Fine. I LOVE doing things the hard way!', N);
    const won = await G.storyBattle('lark1'); if (!won) return;
    await S.say('Ugh! Fine! Keep your stupid crystals! The Director doesn\'t even need these anymore. She\'s got WAY bigger fish to fry.', N);
    await S.say('Like, "sleeping under a lighthouse" big. Toodles!', N);
    await S.move('gc_lark', 'lll', 2); S.remove('gc_lark');
    S.set('lark1_done'); S.restoreMusic();
    await S.say('"Hey! Over here! Is it safe?"');
    await SC.rocco_hammer(S);
  };
  SC.rocco_hammer = async (S) => {
    S.facePlayer('gc_rocco');
    const N = 'Hiker Rocco';
    if (!G.flag('lark1_done')) { await S.say('Shh! Those Hollow folks blasted the exit shut and trapped me in here. There\'s a whole gang of them in the crystal chamber!', N); return; }
    if (!G.bag.has('pickhammer')) {
      await S.say('You chased them off! Bless you! They sealed the way to Cindervale with rubble. Take my Pick Hammer and smash right through!', N);
      await S.give('pickhammer', 1, { note: 'Walk up to a cracked rock and press Z to smash it.' });
      return;
    }
    await S.say('Cindervale is just past those rocks. The hot springs there will fix you right up!', N);
  };
  SC.fossil_dig = async (S) => {
    S.facePlayer('gc_dig');
    const N = 'Digger Pim';
    if (G.flag('got_fossil')) { await S.say('Take good care of that fossil! Dr. Orla in Galvan can revive it.', N); return; }
    await S.say('Two fossils in one dig! But my bag only holds one... You found me, so you choose!', N);
    const k = await G.ask('Which fossil will you take?', ['Claw Fossil', 'Wing Fossil'], { speaker: N, cancel: -1 });
    if (k < 0) return;
    await S.give(k === 0 ? 'clawfossil' : 'wingfossil');
    S.set('got_fossil'); S.quest('side_fossil', 'go');
    await S.say('Bring it to Dr. Orla at the Galvan Harbor Museum!', N);
  };
  // ------------------------------------------------------------- CINDERVALE
  SC.rival2 = async (S) => {
    await S.approach('cv_wren', 'wren_crane', { prefer: ['right', 'down', 'up'] });
    await S.emote('cv_wren', '!');
    await S.say(`${P()}! I knew you\'d come through that cave! Check it out — official Crane Fellowship scarf!`, WREN());
    await S.say('The Fellowship trainers are incredible. They have machines that measure Resonance and push it higher. My team\'s never felt so powerful!', WREN());
    await S.say('Let\'s see who\'s stronger now!', WREN());
    const won = await G.storyBattle('rival2');
    S.set('rival2_done');
    if (!won) return;
    await S.say('Tch... Fine. Enjoy your forge badge. I\'m heading to Duskmere. The Fellowship says there\'s something important at the Ruins of Echo.', WREN());
    await S.fadeOut(10); S.remove('cv_wren'); await S.fadeIn(10);
  };
  SC.kiko = async (S) => {
    S.facePlayer('kiko');
    const N = 'Attendant Kiko';
    const q = G.save.quests.side_spring;
    if (q && q.step === 'done') { await S.say('The springs are nice and cozy. Soak as long as you like!', N); await S.heal(); return; }
    if (!q) S.quest('side_spring', 'go');
    const has = t => G.save.party.some(m => G.SPECIES[m.sp].types.includes(t));
    if (has('fire') && has('water') && has('ice')) {
      await S.say('Fire, Water AND Ice, all soaking together?! Steamy, splashy, and chilly! That\'s the dream! Please, take these Leftovers. Fresh from the snack bar!', N);
      await S.give('leftovers'); S.quest('side_spring', 'done'); return;
    }
    await S.say('Welcome to Ember Springs! Our dream is to see a Fire, a Water AND an Ice mon relaxing together. Bring one of each in your party! For now, have a soak on the house.', N);
    await S.heal();
  };
  SC.mint_lady = async (S) => {
    S.facePlayer('ch2');
    await S.say('I grow mints in volcanic soil! A mint changes how a mon\'s stats grow, as if it had a different nature. $5,000 each.', 'Mint Grower');
    const stock = ['mint_adamant', 'mint_jolly', 'mint_modest', 'mint_timid', 'mint_bold', 'mint_impish', 'mint_calm', 'mint_careful', 'mint_brave', 'mint_quiet'];
    await new Promise(res => G.push(new G.ShopScene(stock, res)));
  };
  SC.name_rater_cinder = async (S) => {
    S.facePlayer('ch1');
    const N = 'Old Seer Tomas';
    const m = G.party.lead();
    if (m) { const ab = G.ABILITIES[G.mon.ability(m)]; await S.say(`Your ${G.mon.name(m)}... its ability is ${ab.name}. ${m.abil === 2 ? 'A HIDDEN ability! Rare indeed.' : G.SPECIES[m.sp].abil[2] ? 'It carries a hidden talent too, one that sleeps. Sparkling grass hides mons whose talents are awake.' : ''}`, N); }
    if (G.flag('badge3') && !G.flag('got_capsule')) { await S.say('Take this Ability Capsule. It swaps a mon between its two regular abilities.', N); await S.give('abilitycapsule'); S.set('got_capsule'); }
  };
  SC.brann = async (S) => {
    const N = 'Warden Brann';
    S.facePlayer('brann_npc');
    if (G.flag('badge3')) { await S.say('Duskmere is south along Route 4. And kid... the Hollow was talking about the Ruins of Echo. Watch yourself.', N); return; }
    await S.say('HAH! A new challenger stokes the forge! I\'m Brann. I\'ve shaped steel for forty years and Tamers for twenty.', N);
    await S.say('Heat reveals flaws in metal, and battle reveals flaws in bonds. Let\'s see what YOU\'RE made of!', N);
    const won = await G.storyBattle('brann'); if (!won) return;
    await S.say('HA! You\'ve got fire in you, kid. The good kind. The Forge Badge is yours!', N);
    await wardenWin(S, { badge: 'forge', flag: 'badge3', name: N, tm: 'tm35', tmText: 'Take TM35 too: Flamethrower. Reliable as a good hammer.', gymTrainers: ['cg_1', 'cg_2', 'cg_3'],
      extra: async () => { await S.say('And this. My old Wing Whistle. My Cinderwing\'s getting on in years, but the Sky Taxi still answers it. It\'ll carry you to any town you\'ve visited. Use it from the Map!', N); await S.give('wingwhistle'); } });
    await S.say('News from Duskmere: the Hollow is heading to the Ruins of Echo. Something about a key. Route 4 runs south. Go.', N);
    S.quest('main4', 'done'); S.quest('main5', 'go');
  };
  // ------------------------------------------------------------- DUSKMERE
  SC.dusk_gym_guard = async (S) => { S.facePlayer('dm_gguard'); await S.say('Warden Mireille rushed to the Ruins of Echo, north-east of town. She said intruders were disturbing the spirits.', 'Gym Apprentice'); };
  SC.grey1 = async (S) => {
    if (G.flag('ruins_done')) return;
    const N = 'Admin Grey';
    G.audio && G.audio.music('encounter_villain');
    S.face('ru_grey', 'down');
    await S.say('...', N);
    await S.say('So you are the anomaly Lark keeps complaining about. I am Grey, Admin of the Hollow.', N);
    await S.say('The Tide Key has already been removed from its cradle. Your presence here is statistically irrelevant.', N);
    await S.say('However, I am curious about your Resonance readings. Let us collect some data.', N);
    const won = await G.storyBattle('grey1'); if (!won) return;
    await S.say('Interesting. But irrelevant. The key is already on its way to the Director.', N);
    await S.say('Grey raised a hand. A Nightwing swooped down from the shadows and carried him off into the mist!');
    G.audio && G.audio.sfx('fly');
    S.remove('ru_grey');
    await S.approach('ru_mir', 'mireille', { prefer: ['down', 'left', 'right'] });
    await S.say('Oh dear... the cradle is empty. I came as soon as the spirits began to wail. You fought them off alone? Brave little flame.', 'Warden Mireille');
    await S.say('The Tide Key opens the sea gate beneath the Tidelight. The old songs say Orrelume sleeps behind it. If Crane has the key...', 'Warden Mireille');
    await S.say('Come to my gym when you\'re ready. We have much to discuss... after I see what burns inside you.', 'Warden Mireille');
    await S.fadeOut(10); S.remove('ru_mir'); await S.fadeIn(10);
    S.set('ruins_done'); S.restoreMusic(); S.quest('main5', 'gym');
    G.persist.write();
  };
  G.QUESTS.main5.steps = { go: G.QUESTS.main5.desc, gym: 'Grey escaped with the Tide Key. Challenge Warden Mireille at the Duskmere Gym.' };
  SC.mireille = async (S) => {
    const N = 'Warden Mireille';
    S.facePlayer('mireille_npc');
    if (G.flag('badge4')) { await S.say('Professor Hale is waiting for you at the Duskmere pier. Go, little flame.', N); return; }
    await S.say('Welcome, little flame. In darkness, we see what truly matters. The lantern you carry... and the hearts that follow it.', N);
    await S.say('My mons are the echoes of those who loved too much to leave. Let us see if your bond can shine through them.', N);
    const won = await G.storyBattle('mireille'); if (!won) return;
    await S.say('The candle flickers... and still it burns. As do you. Take the Veil Badge.', N);
    await wardenWin(S, { badge: 'veil', flag: 'badge4', name: N, tm: 'tm58', tmText: 'And TM58: Wisp Flame. A gentle burn that weakens a foe\'s physical attacks.', gymTrainers: ['dg_1', 'dg_2', 'dg_3'] });
    await S.say('Professor Hale arrived while we battled. She is waiting on the pier. She has... a story you need to hear.', N);
  };
  SC.dusk_hale = async (S) => {
    S.facePlayer('dm_hale');
    if (G.flag('got_surf')) { await S.say('Head south across the lake to Frostpeak. I\'ll keep digging into Crane\'s old research here.', HALE); return; }
    await S.say(`${P()}. Mireille told me everything. The Tide Key... Vesper really did it.`, HALE);
    await S.say('Vesper Crane and I worked together at the Tidelight, twelve years ago. We were trying to record Orrelume\'s song for the very first time.', HALE);
    await S.say('Her partner was a Luminelle named Lumi. The sweetest mon you ever met. When the song began, Lumi... sang back. And the Tidelight flared so bright the whole Mere turned white.', HALE);
    await S.say('When the light faded, Lumi was gone. No trace. Just... gone.', HALE);
    await S.say('Vesper never forgave the Tidelight. Or herself. If she wants the sea gate, I\'m afraid she wants to force Orrelume to sing again — loud enough to reach Lumi, wherever she is. No matter what it costs everyone else.', HALE);
    await S.say('I can\'t stop her alone. But you... Take this Tide Board. Face water and press Z to surf.', HALE);
    await S.give('tideboard');
    await S.say('Head south across the lake to Frostpeak Village. Warden Sigrid is a dear friend. And please... be careful.', HALE);
    S.set('got_surf'); S.quest('main5', 'done'); S.quest('main6', 'go');
    G.persist.write();
  };
  SC.lamplighter = async (S) => {
    S.facePlayer('dm_ode');
    const N = 'Lamplighter Ode';
    const lit = [1, 2, 3, 4].filter(i => G.flag('lantern' + i)).length;
    const q = G.save.quests.side_lanterns;
    if (q && q.step === 'done') { await S.say('The spirits rest easy. You have a lamplighter\'s heart.', N); return; }
    if (lit >= 4) {
      await S.say('All four spirit lanterns burn! Can you hear them? The spirits are singing.', N);
      await S.say('Take these. A Spell Tag for your ghostly friends, and a Dusk Stone. Some mons evolve under its dark light.', N);
      await S.give('spelltag'); await S.give('duskstone'); S.quest('side_lanterns', 'done'); return;
    }
    if (!q) S.quest('side_lanterns', 'go');
    await S.say(`Four spirit lanterns stand around Duskmere. They must be lit after dark, between 7 PM and 5 AM, or the spirits can't see them. ${lit} of 4 are lit.`, N);
  };
  SC.spirit_lantern = async (S, ctx) => {
    const n = ctx.ent.lantern;
    if (G.flag('lantern' + n)) { await S.say('The spirit lantern glows with a soft blue flame.'); return; }
    if (!G.save.quests.side_lanterns) { await S.say('An old stone lantern. Its wick is cold. Maybe someone in town knows about it.'); return; }
    if (!G.clock.isNight()) { await S.say('The wick won\'t catch in daylight. The spirits only come out at night. (7 PM - 5 AM)'); return; }
    G.setFlag('lantern' + n); G.audio && G.audio.sfx('ability');
    await S.say('You lit the spirit lantern. A faint voice whispers: "...thank you..."');
    if ([1, 2, 3, 4].every(i => G.flag('lantern' + i))) {
      await S.say('The last lantern flares! A Wispurr drifts out of the light, curious!');
      await G.startWild(null, { species: 'wispurr', lvl: 30, noRandom: true, hidden: true });
    }
  };
  SC.prorod_guy = async (S) => {
    S.facePlayer('dm_rodguy');
    await S.say('The lake is deep. Deep lakes mean big fish. A Pro Rod pulls up the good stuff: Mireel, Riptalon, even Crustank!', 'Fisher Lou');
    if (!G.flag('lou_gift')) { await S.say('Here, take some Net Orbs. They\'re great for Water types.', 'Fisher Lou'); await S.give('netorb', 5); S.set('lou_gift'); }
  };
  SC.fortune_teller = async (S) => {
    S.facePlayer('dh1');
    const m = G.party.lead(); if (!m) return;
    const best = G.STATS.reduce((a, s) => m.ivs[s] > m.ivs[a] ? s : a, 'hp');
    await S.say(`I see... ${G.mon.name(m)}\'s greatest potential lies in its ${G.STAT_NAMES[best]}. ${G.pick(['A shiny will cross your path when you least expect it.', 'Sparkling grass holds mons with awakened talents.', 'The Tidelight will shine again, because of you.', 'Your rival\'s heart is heavier than you know.'])}`, 'Fortune Teller');
  };
  // ------------------------------------------------------------- ROUTE 5
  SC.glowing_scale = async (S) => {
    S.facePlayer('r5_scale');
    if (G.save.quests.side_scale) { await S.say('Did the elder in Frostpeak know what the scale was?', 'Island Girl'); return; }
    await S.say('I found this washed up on my island. It glows, and... it hums, like a song. Could you take it to Frostpeak? Elder Vesna knows all the old stories.', 'Island Girl');
    await S.give('oldamber'); S.quest('side_scale', 'go');
  };
  SC.rival3 = async (S) => {
    await S.approach('r5w', 'wren_crane', { prefer: ['down', 'left', 'right'] });
    await S.emote('r5w', '...', 40);
    await S.say('Took you long enough.', WREN());
    await S.say('Look. The Director gave me a Resonance Amplifier. It forces Resonance, all the time. No waiting for a bond. My team\'s never been stronger!', WREN());
    await S.say('I\'m going to be Champion, {PLAYER}. Before Sable even notices me. Starting by beating YOU!', WREN());
    const won = await G.storyBattle('rival3');
    S.set('rival3_done');
    const st = G.lineAt(G.rivalOf[G.getVar('starter', 'kindlet')], 36);
    await S.say(`${R()}\'s ${G.SPECIES[st].name} is trembling. It lets out a thin, pained cry.`);
    await S.say('Hey... hey, what\'s wrong? You\'re shaking... Is it the Amplifier? Did the Amplifier do this?', WREN());
    await S.say('I... I need to think. Don\'t follow me.', WREN());
    await S.fadeOut(10); S.remove('r5w'); await S.fadeIn(10);
  };
  // ------------------------------------------------------------- FROSTPEAK
  SC.starfall_guard = async (S) => {
    await S.say('Stop right there! Starfall Peak is far too dangerous. Only the Champion of Solmere is allowed to climb it.', 'Mountain Ranger');
    await pushBack(S, 'left');
  };
  SC.grip_boots = async (S) => {
    S.facePlayer('fp_boots');
    const N = 'Old Halvard';
    if (G.bag.has('gripboots')) { await S.say('Mt. Glacia Pass is east of the village. Shove the boulders into the holes to cross.', N); return; }
    if (!G.flag('badge5')) { await S.say('My daughter Sigrid runs the gym. Beat her, and I\'ll give you something you\'ll need for the mountain pass.', N); return; }
    await S.say('Sigrid says you\'re the real deal. These Grip Boots got me across Mt. Glacia a hundred times. Walk into a boulder to push it!', N);
    await S.give('gripboots'); S.set('got_boots');
  };
  SC.elder_vesna = async (S) => {
    S.facePlayer('vesna');
    const N = 'Elder Vesna';
    if (G.bag.has('oldamber')) {
      await S.say('That scale... child, that is a scale of Orrelume itself. It hasn\'t shed one in a hundred years.', N);
      await S.say('The old song says there are two great lights in Solmere: the song of the sea, and the hunger of the stars. The sea sings bonds together. The stars... remember what falls.', N);
      await S.say('If Orrelume is shedding, it is afraid. Take this Frost Stone for your trouble, and keep the scale safe. You may need its song.', N);
      await S.give('froststone'); S.quest('side_scale', 'done'); S.set('scale_read'); return;
    }
    await S.say('Frostpeak remembers the old songs. The sea, the stars, the lighthouse between them.', N);
  };
  SC.sigrid = async (S) => {
    const N = 'Warden Sigrid';
    S.facePlayer('sigrid_npc');
    if (G.flag('badge5')) { await S.say('Mt. Glacia Pass is east of the village. Skyreach City lies beyond. And your friend passed through... looking lost.', N); return; }
    await S.say('Welcome to the summit! I\'m Sigrid, three-time Solmere Games champion on skis, and Warden of Frostpeak!', N);
    await S.say('Balance, speed, and nerves of ice. Let\'s see if you can keep your footing!', N);
    const won = await G.storyBattle('sigrid'); if (!won) return;
    await S.say('Magnificent! Like the first morning after a blizzard. The Rime Badge is yours!', N);
    await wardenWin(S, { badge: 'rime', flag: 'badge5', name: N, tm: 'tm14', tmText: 'Take TM14 too: Blizzard! It never misses in snow.', gymTrainers: ['ig_1', 'ig_2'] });
    await S.say(`My father Halvard will want to meet you. He\'s by the frozen pond. And... ${R()} passed through. They looked like they\'d lost something important. They headed for Skyreach.`, N);
    S.quest('main6', 'done'); S.quest('main7', 'go');
  };
  // ------------------------------------------------------------- SKYREACH
  SC.sky_gym_guard = async (S) => { S.facePlayer('sk_gguard'); await S.say('Warden Kaelen stormed into Crane HQ this morning and never came out! The gym is closed until he\'s back.', 'Dragon Tamer'); };
  SC.sky_sailor = async (S) => { S.facePlayer('sk_sailor'); await S.say(G.flag('badge6') ? 'The Tidelight is straight north across the water. Surf safe!' : 'The sea route north leads to Tidelight Isle. The lighthouse went dark last night. First time in my whole life.', 'Sailor'); };
  SC.hq_wren = async (S) => {
    if (G.flag('hq_started')) return;
    S.faceEach('sk_wren', 'player');
    await S.say(`${P()}. Wait.`, WREN());
    await S.say('I... I was wrong. About Crane, about the Fellowship, about all of it. The Amplifier was hurting my partner. I threw it into the lake.', WREN());
    await S.say('I overheard them. Warden Kaelen is locked up on the Director\'s floor. And Crane is about to move the Chorus Engine core to the Tidelight. Tonight.', WREN());
    await S.say('I swiped this keycard before I quit. The elevator in the lobby needs it. We have to stop her. Together.', WREN());
    await S.give('cranekeycard');
    S.set('hq_started'); S.set('hq_card'); S.quest('main7', 'hq');
    await S.say('I\'ll meet you upstairs. Go!', WREN());
    await S.move('sk_wren', 'u', 2); S.remove('sk_wren');
  };
  G.QUESTS.main7.steps = { go: G.QUESTS.main7.desc, hq: 'Infiltrate Crane Dynamics HQ with Wren and free Warden Kaelen.', gym: 'Crane fled. Challenge Warden Kaelen at the Skyreach Gym.' };
  SC.hq1_enter = async (S) => { if (G.flag('hq_started') && !G.flag('hq_done')) G.toast('The elevator at the back leads to the Director\'s floor.'); };
  SC.hq_elevator_guard = async (S) => { S.facePlayer('hq_lift'); await S.say('No keycard, no elevator! Director\'s orders!', 'Hollow Grunt'); };
  SC.hq_recep = async (S) => { S.facePlayer('hq_recep'); await S.say(G.flag('hq_done') ? 'Everyone\'s being questioned by the police. I just answer phones! I swear!' : 'W-welcome to Crane Dynamics! Please don\'t hurt me, I just answer phones!', 'Receptionist'); };
  SC.hq_admins = async (S) => {
    if (G.flag('hq_admins_done')) return;
    G.audio && G.audio.music('encounter_villain');
    await S.say('YOU again?! Do you ever go HOME?!', 'Admin Lark');
    await S.say('And the defector. How predictable.', 'Admin Grey');
    await S.approach('hqw', 'wren', { prefer: ['down', 'left', 'right'] });
    await S.say(`Two on two. Ready, ${P()}? Let\'s show them what a REAL bond looks like!`, WREN());
    const won = await G.storyBattle('grey2', { withTrainer: 'lark2', ally: 'wren_ally', double: true }); if (!won) { S.remove('hqw'); return; }
    await S.say('...Go, then. The Director is waiting for you.', 'Admin Grey');
    await S.say('Ugh, whatever! Not my problem anymore!', 'Admin Lark');
    S.remove('hq_grey'); S.remove('hq_lark');
    S.set('hq_admins_done');
    await S.say('I\'ll get Kaelen out. You go after Crane!', WREN());
    await S.fadeOut(8); S.remove('hqw'); S.spawn({ id: 'hqw', x: 3, y: 3, look: 'wren', dir: 'left' }); await S.fadeIn(8);
    S.restoreMusic();
  };
  SC.hq_crane = async (S) => {
    if (!G.flag('hq_admins_done')) { await S.say('"Grey. Lark. Remove this child."', 'Director Crane'); return; }
    const N = 'Director Crane';
    S.facePlayer('hq_crane');
    S.music('crane');
    await S.say('So this is the Tamer who keeps unraveling my plans. You look so... young.', N);
    await S.say('Do you know what it is like, to hear the voice of the one you love most in the world... and then silence? Twelve years of silence.', N);
    await S.say('The Chorus Engine will make Orrelume sing again. Louder than ever. Loud enough to reach Lumi, wherever the Tidelight took her.', N);
    await S.say('Every bond in Solmere will be... borrowed. Only for a moment. A small price, for a miracle.', N);
    await S.say('You won\'t understand. Then at least be quiet.', N);
    const won = await G.storyBattle('crane1'); if (!won) return;
    await S.say('...So the bond between you is real. Real enough to hurt me. Enough to...', N);
    await S.say('No. It doesn\'t matter. The core is already on its way to the Tidelight. Goodbye, child.', N);
    G.audio && G.audio.sfx('warp'); await G.flashScreen('#ffffff', 20);
    S.remove('hq_crane');
    await S.say('Crane vanished in a flash of light! A teleporter pad hums beneath where she stood.');
    await SC.hq_kaelen(S);
  };
  SC.hq_kaelen = async (S) => {
    if (!G.flag('hq_admins_done') || G.flag('hq_done')) { if (!G.flag('hq_admins_done')) await S.say('A tall man in a violet coat sits calmly in a glass cell. He nods at you, as if he\'s been expecting you.'); return; }
    S.remove('hq_kaelen'); await S.approach('hq_kaelen', 'kaelen');
    await S.say('You have my thanks, young Tamer. And you, Wren. Crane\'s people ambushed me while I investigated her shipments.', 'Warden Kaelen');
    await S.say('The Tidelight is north across the water. But first, come to my gym. The dragons will want to measure you before you face her again.', 'Warden Kaelen');
    await S.say(`I\'ll help the police lock this place down. ${P()}... thank you. For not giving up on me.`, WREN());
    S.set('hq_done'); S.quest('main7', 'gym');
    G.persist.write();
    await S.fadeOut(20); S.remove('hq_kaelen'); S.remove('hqw'); await S.fadeIn(20);
  };
  SC.kaelen = async (S) => {
    const N = 'Warden Kaelen';
    S.facePlayer('kaelen_npc');
    if (G.flag('badge6')) { await S.say('The sea route north of the city leads to the Tidelight. Go. Save the song.', N); return; }
    await S.say('The storm has cleared from my city because of you. I was Champion once, before Sable. I learned then that strength without purpose is just noise.', N);
    await S.say('Now. Let us see if you can weather my storm.', N);
    const won = await G.storyBattle('kaelen'); if (!won) return;
    await S.say('The storm has passed. You are worthy of the dragons\' respect. Take the Wyrm Badge.', N);
    await wardenWin(S, { badge: 'wyrm', flag: 'badge6', name: N, tm: 'tm50', tmText: 'And TM50: Dragon Pulse. A dragon\'s roar, given shape.', gymTrainers: ['sg_1', 'sg_2', 'sg_3'] });
    await S.say('Six badges. The Conclave will call for you soon. But first... the Tidelight. Surf north from the harbor. Go.', N);
    S.quest('main7', 'done'); S.quest('main8', 'go');
  };
  SC.iv_judge = async (S) => {
    S.facePlayer('skh1');
    const m = G.party.lead(); if (!m) return;
    const tot = G.STATS.reduce((a, s) => a + m.ivs[s], 0);
    await S.say(`${G.mon.name(m)}\'s total potential: ${tot}/186. ${tot >= 170 ? 'Outstanding! A gem among gems!' : tot >= 130 ? 'Relatively superior potential!' : tot >= 90 ? 'Above average!' : 'Decent potential. Bonds matter more anyway!'}`, 'IV Judge');
    if (G.flag('champion') && !G.flag('got_caps')) { await S.say('For a Champion... take these Bottle Caps. Hyper Training maxes out an IV!', 'IV Judge'); await S.give('bottlecap', 3); S.set('got_caps'); }
  };
  SC.hidden_power_guy = async (S) => {
    S.facePlayer('skh2');
    if (!G.flag('got_tm20')) { await S.say('In my day, we made decoys out of straw to fool opponents. Here, take this TM: Decoy!', 'Old Strategist'); await S.give('tm20'); S.set('got_tm20'); return; }
    await S.say('A Decoy blocks status moves and absorbs hits. Pair it with a boosting move and watch the magic happen.', 'Old Strategist');
  };
  // ------------------------------------------------------------- TIDELIGHT
  SC.tl_grunt = async (S, ctx) => {
    S.facePlayer(ctx.ent.id);
    await S.say(G.pick(['The Director is at the very top. We\'re supposed to stop you... but honestly? I don\'t want the song to stop either.', 'Can you hear it? The song is getting quieter. That\'s... that\'s not what she promised us.']), 'Hollow Grunt');
  };
  SC.lh_grey = async (S) => {
    const N = 'Admin Grey';
    S.facePlayer('lh_grey');
    await S.say('I ran the numbers again. And again. Every model predicts the same outcome: when the Engine fires, every bond in Solmere breaks. Including hers.', N);
    await S.say('But I have followed her for twelve years. I will not step aside for a calculation. Only for a result.', N);
    const won = await G.storyBattle('grey3'); if (!won) return;
    await S.say('Calculations complete. We were wrong. I was wrong. The stairs are yours.', N);
    await S.move('lh_grey', 'l', 1); S.face('lh_grey', 'right');
    S.set('lh_grey_done');
  };
  SC.lh_lark = async (S) => {
    const N = 'Admin Lark';
    S.facePlayer('lh_lark');
    await S.say('You know what the worst part is? I LIKED it here. The Hollow was the first place anyone ever gave me a chance.', N);
    await S.say('So I\'m not letting you through without a fight. That\'s... that\'s just who I am!', N);
    const won = await G.storyBattle('lark3'); if (!won) return;
    await S.say('...Go. Stop her. Somebody has to, and it was never gonna be me.', N);
    await S.move('lh_lark', 'r', 1); S.face('lh_lark', 'left');
    S.set('lh_lark_done');
  };
  SC.top_crane = async (S) => {
    if (G.flag('tidelight_done')) return;
    const N = 'Director Crane';
    S.music('crane');
    S.shake(20);
    await S.say('The summit trembles. A deep, sorrowful song rises from below the sea, twisting as the great machine hums.');
    S.face('top_crane', 'down');
    await S.say('You\'re too late. Listen. The song is changing. Soon it will call out to everything that has ever lived and loved in Solmere.', N);
    await S.say('Lumi... I\'m almost there. I can almost hear you.', N);
    await S.say(`It\'s hurting them! Every mon on the Mere is crying! Can\'t you hear it, Director?!`, P());
    await S.say('I hear only one voice. I have for twelve years. Stand aside, or be silenced with the rest.', N);
    const won = await G.storyBattle('crane2'); if (!won) return;
    await S.say('Lumi... I\'m sorry. I couldn\'t even do this right.', N);
    G.audio && G.audio.sfx('thunder'); S.shake(40);
    await G.flashScreen('#ffffff', 30);
    await S.say('The Chorus Engine sparks and groans! With a thunderous crack, it tears itself apart!');
    G.audio && G.audio.stopMusic();
    await S.wait(40);
    S.shake(60); G.audio && G.audio.cry('orrelume');
    await G.flashScreen('#bfffff', 40);
    await S.say('From the depths of the Mere, a vast shape rises, glowing like the dawn. The song pours out, clear and whole again.');
    await S.say('...Vesper...', '???');
    await S.say('...That voice... Lumi?! LUMI!', N);
    await S.say('...It\'s okay... I\'m part of the song now... I always have been... Let go, Vesper... Live...', '???');
    await S.say('Vesper Crane sinks to her knees, weeping. For the first time, she looks her age... and somehow, lighter.', '');
    S.music('legend');
    await S.say('The great leviathan turns its luminous eyes toward you. It seems to want to test the bond that set it free!');
    const r = await G.startWild(null, { species: 'orrelume', lvl: 50, legend: true, noRandom: true, noRun: false });
    if (G.party.allMons().some(m => m.sp === 'orrelume')) S.set('orrelume_caught');
    else { S.set('orrelume_away'); await S.say('Orrelume dives back beneath the waves with a gentle, echoing call. Perhaps it will return someday...'); }
    await S.fadeOut(30);
    S.remove('top_crane');
    const hale = S.spawn({ id: 'toph', x: 5, y: 8, look: 'hale', dir: 'up' });
    const wr = S.spawn({ id: 'topw', x: 7, y: 8, look: 'wren', dir: 'up' });
    const sb = S.spawn({ id: 'tops', x: 6, y: 5, look: 'sable', dir: 'down' });
    await S.fadeIn(30);
    S.music('tidelight_calm');
    await S.say(`${P()}! You did it! Vesper... she turned herself in. She said she heard Lumi. That the song carried her voice.`, HALE);
    await S.say('I believe her. Resonance doesn\'t forget the ones we love. It never did.', HALE);
    await S.say(`${P()}, that was incredible! I mean it! ...Oh. Uh. Hi, Sable.`, WREN());
    await S.say(`So you\'re the one ${R()} never stops talking about.`, 'Champion Sable');
    await S.say('I\'m Sable, Champion of Solmere. I came as soon as the Tidelight went dark. Looks like I arrived just in time to be unnecessary.', 'Champion Sable');
    await S.say('The Tidelight shines again. The Conclave has opened Victory Road, west of Route 1. I\'ll be waiting at the top.', 'Champion Sable');
    await S.say(`And ${R()}... I\'m proud of you. Both of you.`, 'Champion Sable');
    await S.fadeOut(20); S.remove('toph'); S.remove('topw'); S.remove('tops');
    S.set('tidelight_done'); S.quest('main8', 'done'); S.quest('main9', 'go');
    G.persist.write();
    await S.fadeIn(20);
    await S.say('The lighthouse beam sweeps across the Mere once more.\\p{k}(Victory Road is open. Use the Wing Whistle to fly back to Fernwick, then head to Route 1.){w}');
  };
  SC.tl_hale = async (S) => {
    S.facePlayer('tl_hale');
    await S.say('I\'m going to study the Tidelight properly, now. No machines. Just listening. Here, let me heal your team.', HALE);
    await S.heal();
  };
  // ------------------------------------------------------------- VICTORY ROAD
  SC.rival4 = async (S) => {
    await S.approach('vrw', 'wren', { prefer: ['up', 'down', 'left', 'right'] });
    await S.emote('vrw', '!');
    await S.say(`${P()}. I knew you\'d make it.`, WREN());
    await S.say('I\'ve been thinking a lot. About what strength really means. The Amplifier made my team strong... but it made them hurt. That wasn\'t strength. That was me being scared of being left behind.', WREN());
    await S.say('No amplifiers. No shortcuts. Just me and my team, the way it should have been from the start. One last battle before the Conclave. Let\'s go!', WREN());
    const won = await G.storyBattle('rival4'); if (!won) { S.remove('vrw'); return; }
    S.set('rival4_done');
    await S.say('Ha... hahaha! That was the best battle of my life. Go on. Sable\'s waiting. And... thanks. For everything.', WREN());
    await S.fadeOut(10); S.remove('vrw'); await S.fadeIn(10);
  };
  // ------------------------------------------------------------- CONCLAVE
  SC.league_shop = async (S) => { S.facePlayer('cl_shop'); await G.openShop(['ultraorb', 'hyperpotion', 'maxpotion', 'fullrestore', 'revive', 'maxrevive', 'fullheal', 'maxether', 'elixir', 'xattack', 'xspatk', 'xspeed', 'maxrepel'], { greet: 'The last shop before the Conclave. Stock up!' }); };
  SC.league_guard = async (S) => {
    S.facePlayer('cl_guard');
    const N = 'Conclave Guard';
    if (G.save.badges.length < 6) { await S.say('Only Tamers with six badges may enter.', N); return; }
    await S.say('Beyond this door wait the four members of the Conclave, and then the Champion. Once you enter, there is no leaving until you win... or fall.', N);
    if (!await G.yesno('Enter the Conclave?', { speaker: N })) return;
    S.set('league_entered');
    await S.move('cl_guard', 'l', 1); S.face('cl_guard', 'right');
    await S.walkTo('player', 6, 1); await S.move('player', 'u');
  };
  SC.elite_room_enter = async (S) => { G.toast('Save before battling? Open the menu with X.'); };
  SC.elite_battle = async (S, ctx) => {
    const e = ctx.ent, id = G.flag('champion') ? G.eliteRematch(e.elite) : e.elite, T = G.TRAINERS[id];
    if (G.flag(e.flag)) { await S.say('Go on. The next chamber awaits.', T.name); return; }
    S.facePlayer(e.id);
    await S.say(T.intro, T.name);
    const won = await G.storyBattle(id); if (!won) return;
    S.set(e.flag);
    await S.say(T.defeat, T.name);
    await S.move(e.id, 'l', 1); S.face(e.id, 'right');
    G.audio && G.audio.sfx('door');
    await S.say('The door at the back of the chamber rumbles open.');
    if (id === 'ferrum') S.set('elite4_done');
  };
  SC.champion_sable = async (S) => {
    const N = 'Champion Sable';
    S.facePlayer('sable_npc');
    if (G.flag('champion')) return;
    await S.say(`So. You\'ve come.`, N);
    await S.say(`${R()} has been talking about you since the day you both got your first mons. How you always made them want to be better. How you never once gave up on them.`, N);
    await S.say('I\'m Sable, Champion of Solmere. And I\'ve heard every one of your adventures twice. Once from the news, and once from my little sibling at three in the morning.', N);
    await S.say('The Tidelight shines because of you. Now show me the bond that made it possible. Hold nothing back!', N);
    const won = await G.storyBattle('sable'); if (!won) return;
    await S.say('...Magnificent. The Tidelight shines brighter for having you in Solmere.', N);
    await S.say(`From this moment, you are the Champion of Solmere, ${P()}. Come. The Hall of Fame awaits.`, N);
    S.set('champion'); S.set('champion_scene_done');
    await S.move('sable_npc', 'l', 1); S.face('sable_npc', 'right');
    S.quest('main9', 'done');
  };
  SC.hall_of_fame = async (S) => {
    if (G.flag('hof_done') && !G.flag('hof_pending')) { return; }
    G.audio && G.audio.music('halloffame');
    await S.say('Sable leads you into a golden hall. Your partners\' names will be recorded here forever.', '');
    const party = G.save.party.slice();
    const sc = { opaque: true, t: 0, i: 0, parts: new G.Particles(),
      update() { this.t++; this.parts.update(); if (this.t % 3 === 0) this.parts.add({ x: G.rand() * G.W, y: -4, vy: .6 + G.rand(), vx: (G.rand() - .5) * .3, life: 300, size: 1.5, color: G.pick(['#ffe070', '#ffffff', '#ffd0a0']), type: 'star', blend: 'lighter' }); },
      draw(b) { const g = b.createLinearGradient(0, 0, 0, G.H); g.addColorStop(0, '#3a2a10'); g.addColorStop(1, '#1a1008'); b.fillStyle = g; b.fillRect(0, 0, G.W, G.H); this.parts.draw(b); const m = party[this.i]; if (m) { b.drawImage(G.monArt.front(m.sp, m.shiny, Math.floor(this.t / 12) % 4), G.W / 2 - 48, 30); } },
      drawUI() { const U = G.ui, m = party[this.i]; if (!m) return; U.text(G.mon.name(m), G.W / 2, 132, { size: 12, weight: 900, color: '#ffe8a0', align: 'center', outline: 'rgba(0,0,0,.5)' }); U.text(`${G.SPECIES[m.sp].name} · Lv ${m.lvl} · OT ${m.ot || G.save.name}`, G.W / 2, 150, { size: 7, color: '#f4e0c0', align: 'center' }); U.text(`${this.i + 1} / ${party.length}`, G.W / 2, 162, { size: 6, color: '#c8a870', align: 'center' }); },
    };
    G.push(sc);
    for (let i = 0; i < party.length; i++) { sc.i = i; G.audio && G.audio.cry(party[i].sp); await G.wait(110); }
    await G.say(`Congratulations, ${P()}! You and your partners are the Champions of Solmere!\\pYour playtime: ${G.fmtTime(G.save.playtime)}. Dex: ${G.dexCount().caught} caught.`);
    G.pop(sc);
    G.save.hof = (G.save.hof || []).concat([{ t: Date.now(), time: G.save.playtime, party: party.map(m => ({ sp: m.sp, name: G.mon.name(m), lvl: m.lvl, shiny: m.shiny })) }]);
    S.set('hof_done');
    await G.rollCredits(true);
    // epilogue: home
    G.party.healAll();
    for (const f of ['e1_done', 'e2_done', 'e3_done', 'e4_done', 'league_entered']) G.setFlag(f, false);
    G.maps.reset();
    await S.w.warpTo('home2f', 3, 4, 'down');
    G.persist.write();
    await S.say('Home. Your bed has never felt so soft.\\p...\\pBut the adventure isn\'t over. Professor Hale has been asking for you, and strange rumors are coming from Starfall Peak...');
    S.quest('post1', 'start');
    G.toast('Game saved. Post-game unlocked: Battle Spire (Skyreach), Starfall Peak (west of Frostpeak), rematches!', { life: 400 });
  };
  // ------------------------------------------------------------- POST-GAME
  SC.wanderer = async (S) => {
    S.facePlayer('sf_wanderer');
    await S.say('A silent figure stands at the summit, gazing at the stars. A red scarf ripples in the wind.');
    await S.say('...', '???');
    G.audio && G.audio.music('encounter_boss');
    await S.say('...!', '???');
    const won = await G.storyBattle('wanderer'); if (!won) return;
    await S.say('The Wanderer smiles faintly, tips their cap, and presses something into your hand. When you look up, they\'re gone.');
    await S.give('crownorb');
    S.set('wanderer_done'); S.remove('sf_wanderer'); S.restoreMusic();
  };
  SC.nyxalis_encounter = async (S) => {
    await S.say('The stars above the crater flicker... and go out, one by one. A shape of living darkness uncoils where the comet fell.');
    G.audio && G.audio.cry('nyxalis'); S.shake(30);
    await S.say('It opens its eyes. The whole sky seems to hold its breath.');
    await G.startWild(null, { species: 'nyxalis', lvl: 65, legend: true, noRandom: true });
    S.set('nyxalis_done'); S.remove('sf_nyx');
    await S.say('The stars bloom back into the sky above Starfall Peak, brighter than ever.');
    S.quest('post1', 'done');
  };
  SC.orrelume_return = async (S) => {
    await S.say('A soft song drifts up from the water. Orrelume has returned!');
    await G.startWild(null, { species: 'orrelume', lvl: 55, legend: true, noRandom: true });
    if (G.party.allMons().some(m => m.sp === 'orrelume')) { S.set('orrelume_caught'); S.remove('tl_orre'); }
  };
  // ------------------------------------------------------------- BATTLE SPIRE
  SC.spire_recep = async (S) => {
    S.facePlayer('spire_recep');
    const N = 'Spire Host';
    if (!G.flag('champion')) { await S.say('The Battle Spire is open only to Champions of Solmere. Come back when you\'ve conquered the Conclave!', N); return; }
    const sp = G.save.spire; sp.bp = sp.bp || 0;
    await S.say(`Welcome to the Battle Spire! Seven battles in a row, three mons each, all at Level 50. Current streak: ${sp.streak}. Best: ${sp.best}. You have ${sp.bp} BP.`, N);
    if (G.save.party.filter(m => !m.egg).length < 3) { await S.say('The Spire is a three-on-three challenge. Come back with at least three mons in your party!', N); return; }
    if (!await G.yesno('Take on the challenge?', { speaker: N })) return;
    await S.say('Choose three mons. They\'ll battle at Level 50 and be fully healed before every round.', N);
    const picks = [];
    while (picks.length < 3) {
      const i = await G.openParty({ mode: 'select', prompt: `Choose mon ${picks.length + 1} of 3.`, filter: m => !picks.includes(m) && !m.egg, label: m => picks.includes(m) ? 'CHOSEN' : '' });
      if (i === null || i < 0) return;
      picks.push(G.save.party[i]);
    }
    const team = picks.map(m => { const c = G.mon.clone(m); G.mon.setLevel(c, 50); G.mon.healFull(c); c.uid = G.uid(); return c; });
    const pool = G.DEX.filter(id => G.SPECIES[id].final && !G.SPECIES[id].legend);
    const classes = [['Ace Tamer', 'ace'], ['Ace Tamer', 'ace_f'], ['Veteran', 'veteran'], ['Blackbelt', 'blackbelt'], ['Mystic', 'mystic'], ['Dragon Tamer', 'dragontamer'], ['Skier', 'skier'], ['Gentleman', 'gentleman'], ['Lady', 'lady'], ['Punk', 'punk']];
    const names = ['Rhea', 'Ivo', 'Nell', 'Cato', 'Juno', 'Pax', 'Mira', 'Otto', 'Vera', 'Zane', 'Lux', 'Rune'];
    for (let n = sp.streak % 7; n < 7; n++) {
      const [cls, look] = G.pick(classes), boss = n === 6;
      const tid = 'spire_tmp';
      G.TRAINERS[tid] = { cls: boss ? 'Spire Master' : cls, name: boss ? 'Aurel' : G.pick(names), look: boss ? 'wanderer' : look, ai: boss ? 4 : 3, money: 0, boss, resonate: boss, music: boss ? 'champion' : 'spire_battle', noRematch: true, env: 'league',
        party: G.shuffle(pool.slice()).slice(0, 3).map(s => ({ sp: s, lvl: 50, item: G.pick(['leftovers', 'lifegem', 'sunberry', 'lumenberry', 'expertbelt', 'focuslens', 'powerband', null]) })) };
      await S.say(`Battle ${n + 1} of 7${boss ? ' — the Spire Master!' : ''}`, N);
      for (const m of team) G.mon.healFull(m);
      const r = await G.runBattle({ foes: [G.makeTrainerCfg(tid)], format: 'single', music: G.TRAINERS[tid].music, boss, env: 'league', playerParty: team, exp: false, noMoney: true, noPost: true, canLose: true, noRun: true });
      if (!r || r.outcome !== 'win') { sp.streak = 0; await S.say('Your streak has ended. Well fought! Come back anytime.', N); G.persist.write(); return; }
      sp.streak++; sp.best = Math.max(sp.best, sp.streak); sp.bp += boss ? 10 : 1 + Math.floor(sp.streak / 7);
      if (n < 6 && !await G.yesno(`Victory! Streak: ${sp.streak}. Continue to battle ${n + 2}?`, { speaker: N })) { G.persist.write(); return; }
    }
    await S.say(`Incredible! You conquered the Spire! Streak: ${sp.streak}. You now have ${sp.bp} BP. Trade BP at the counter to the right.`, N);
    G.persist.write();
  };
  SC.spire_exchange = async (S) => {
    S.facePlayer('spire_ex');
    const sp = G.save.spire; sp.bp = sp.bp || 0;
    const stock = [['abilitypatch', 40], ['goldcap', 60], ['bottlecap', 20], ['rarecandy', 4], ['lifegem', 16], ['powerband', 16], ['focuslens', 16], ['swiftscarf', 16], ['guardvest', 16], ['mint_adamant', 8], ['mint_timid', 8], ['mint_modest', 8], ['mint_jolly', 8]];
    while (true) {
      const k = await G.choose(stock.map(([id, c]) => ({ label: G.ITEMS[id].name, right: c + ' BP' })).concat([{ label: 'Done' }]), { x: 120, y: 10, w: 180, maxRows: 12, title: `BP: ${sp.bp}`, cancel: stock.length });
      if (k < 0 || k >= stock.length) return;
      const [id, c] = stock[k];
      if (sp.bp < c) { await S.say('You don\'t have enough BP.', 'Exchange'); continue; }
      sp.bp -= c; G.bag.add(id); G.audio && G.audio.sfx('money'); G.toast('Got ' + G.ITEMS[id].name);
    }
  };
  // ------------------------------------------------------------- HAVENS & MARTS
  SC.nurse = async (S) => {
    const e = S.npc('nurse'); if (e) e.dir = 'down';
    const hc = G.save.settings.nuzlocke && G.save.settings.nuzRules.hardcore;
    await S.say(`Welcome to the Tamer Haven! Shall I restore your mons to full health?`, 'Nurse');
    const k = await G.ask('Heal your party?', ['Yes please', 'No thanks'], { speaker: 'Nurse' });
    if (k !== 0) { await S.say('Take care out there!', 'Nurse'); return; }
    await S.say('Okay! I\'ll take your mons for a moment.', 'Nurse');
    if (e) e.dir = 'left';
    await S.heal();
    if (e) e.dir = 'down';
    if (G.save.settings.nuzlocke && G.save.graveyard.length) await S.say('Your team is rested. And... I lit a candle for the ones who didn\'t make it.', 'Nurse');
    await S.say('Your mons are fully rested! We hope to see you again!', 'Nurse');
    const w = S.w; if (w.map.def.isHaven && G.save.returnTo) G.save.lastHeal = { map: w.map.id, x: 7, y: 6, back: { ...G.save.returnTo } };
  };
  SC.haven_board = async (S) => {
    const main = Object.keys(G.QUESTS).find(id => G.QUESTS[id].main && G.save.quests[id] && G.save.quests[id].step !== 'done');
    const Q = main ? G.QUESTS[main] : null;
    const st = Q ? ((Q.steps && Q.steps[G.save.quests[main].step]) || Q.desc) : 'No urgent news! Explore, catch, and train!';
    await S.say(`{c}TAMER BOARD{w} — Current goal:\\n${st}`, 'Haven Aide');
    const side = Object.keys(G.QUESTS).filter(id => !G.QUESTS[id].main && G.save.quests[id] && G.save.quests[id].step !== 'done');
    if (side.length) await S.say(`Open side quests: ${side.map(id => G.QUESTS[id].name).join(', ')}. Check your Journal for details.`, 'Haven Aide');
  };
  SC.haven_tips = async (S) => {
    S.facePlayer('hv1');
    await S.say(G.pick([
      'The PC in every Haven connects to your boxes. You can heal from it too!',
      'Held items like Leftovers or a Sun Berry can turn a losing battle around.',
      'Stat boosts reset when a mon switches out. Status conditions do not!',
      'Critical hits ignore the target\'s defensive boosts and your Attack drops. Handy!',
      'Weather changes everything: rain powers Water moves, sun powers Fire moves, and snow toughens Ice types.',
      'Sparkling tall grass hides rare mons with perfect potential. And a better chance of being shiny!',
      'Your walking buddy shows its mood. Talk to it by facing it and pressing Z!',
      'Tab toggles Turbo mode. Great for grinding, or for impatient Tamers like me.',
      'Q during battle shows every stat change and field effect. Knowledge is power!',
    ]), 'Old Tamer');
  };
  SC.haven_chat = async (S) => {
    S.facePlayer('hv2');
    const b = G.save.badges.length;
    await S.say(G.pick(b < 2 ? ['I want to be a Warden someday! Or a baker. Maybe both.', 'My Pipwing evolved yesterday! It\'s so fluffy now!'] : b < 4 ? ['Have you heard of the Crane Fellowship? My cousin joined. He doesn\'t call anymore.', 'I heard Glimmer Cave\'s crystals sing when the wind blows through them.'] : ['The Tidelight\'s beam looked weaker last night. Is that bad?', 'They say the Champion, Sable, has never lost a battle in Solmere.']), 'Tamer');
  };
  SC.mart_clerk = async (S) => { S.facePlayer('clerk'); await G.openShop(G.martStock()); };
  SC.mart_chat = async (S) => { S.facePlayer('mt1'); await S.say(G.pick(['Buy ten Orbs at once and they throw in a free Heal Orb!', 'Repels are a must for cave exploring. Trust me.', 'The shop carries better stuff as you earn more badges.']), 'Shopper'); };
  SC.mart_special = async (S) => {
    S.facePlayer('clerk2');
    const town = G.save.returnTo ? G.save.returnTo.map : 'fernwick';
    const stock = {
      fernwick: ['oranberry', 'sunberry', 'cheriberry', 'chestoberry', 'pechaberry', 'rawstberry', 'miracleseed'],
      galvan: ['tm17', 'tm16', 'tm33', 'tm12', 'tm05', 'magnet', 'xattack', 'xspeed'],
      cindervale: ['hpup', 'protein', 'iron', 'calcium', 'zinc', 'carbos', 'charcoal', 'flamestone'],
      duskmere: ['duskorb', 'timerorb', 'spelltag', 'duskstone', 'dawnstone', 'tm60', 'tm45'],
      frostpeak: ['iceheal', 'froststone', 'nevermeltice', 'tm07', 'tm61', 'leppaberry', 'lumenberry'],
    }[town] || ['greatorb', 'superpotion', 'repel'];
    await G.openShop(stock, { greet: 'Specialty goods from around here! Take a look.', speaker: 'Clerk' });
  };
  SC.sky_special = async (S) => {
    S.facePlayer('clerk2');
    await G.openShop(['lifegem', 'powerband', 'focuslens', 'swiftscarf', 'leftovers', 'guardvest', 'spikedhelm', 'expertbelt', 'scopelens', 'widelens', 'gritsash', 'linkcord', 'abilitycapsule', 'leafstone', 'tidestone', 'voltstone', 'tm26', 'tm24', 'tm13', 'tm04', 'tm01'], { greet: 'Skyreach Supply carries the finest held items in Solmere!', speaker: 'Clerk' });
  };
  // ------------------------------------------------------ map patches
  // extra NPCs that belong to later story beats
  G.MAPDEFS.duskmere.objs.push({ type: 'npc', id: 'dm_hale', x: 15, y: 20, look: 'hale', dir: 'up', script: 'dusk_hale', cond: ['badge4', '!got_surf'] });
  G.MAPDEFS.tidelight.objs.push({ type: 'npc', id: 'tl_orre', x: 12, y: 22, monSprite: 'orrelume', dir: 'up', script: 'orrelume_return', cond: ['champion', 'orrelume_away', '!orrelume_caught'] });
  G.MAPDEFS.victorygate.objs = [
    { type: 'npc', id: 'gateguard', x: 5, y: 2, look: 'officer', dir: 'down', script: 'gate_guard', cond: '!vr_open' },
    { type: 'npc', id: 'gateguard2', x: 4, y: 2, look: 'officer', dir: 'right', text: 'Victory Road lies beyond. Good luck, Tamer.', cond: 'vr_open' },
  ];
  G.MAPDEFS.route2.objs.forEach(o => { if (o.id === 'r2_i3') o.item = 'tm11'; });
  G.MAPDEFS.lh1.warps[1].cond = 'lh_grey_done';
  G.MAPDEFS.lh1.objs.push({ type: 'trigger', x: 10, y: 3, w: 1, h: 1, script: 'lh_grey', cond: '!lh_grey_done' });
  G.MAPDEFS.lh2.objs.push({ type: 'trigger', x: 2, y: 3, w: 2, h: 1, script: 'lh_lark', cond: '!lh_lark_done' });
  G.MAPDEFS.hof.warps = [{ x: 6, y: 8, to: 'conclave', tx: 9, ty: 13, dir: 'down', cond: 'hof_done' }];
  G.MAPDEFS.champ.objs.push({ type: 'npc', id: 'sable_npc2', x: 5, y: 2, look: 'sable', dir: 'down', script: 'champion_rematch', cond: ['champion_scene_done', 'hof_done'] });
  G.eliteRematch = function (id) {
    const rid = id + '_r'; const T = G.TRAINERS[id];
    if (!G.TRAINERS[rid]) G.TRAINERS[rid] = { ...T, party: T.party.map(p => ({ ...p, lvl: p.lvl + 16 })), intro: 'Welcome back, Champion. This time, I hold nothing back!', defeat: T.defeat };
    return rid;
  };
  SC.champion_rematch = async (S) => {
    S.facePlayer('sable_npc2');
    if (!await G.yesno('Back for another round, Champion? Let\'s see who\'s stronger now!', { speaker: 'Sable' })) return;
    const won = await G.storyBattle('sable_rematch');
    if (won) await S.say('You never stop getting stronger. Solmere is lucky to have you.', 'Sable');
  };
})();
