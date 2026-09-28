'use strict';
// ============================================================================
//  Story scripts. Each is async (S, ctx) => { ... } using the G.S helper API.
//  Voice and cast: STORY_BIBLE.md.
// ============================================================================
(function () {
  const SC = G.SCRIPTS;
  const P = () => G.save.name, R = () => G.save.rival;
  const HALE = 'Prof. Hale', WREN = () => G.save.rival, MOM = 'Mom';
  const pushBack = async (S, dir) => { await S.move('player', { up: 'd', down: 'u', left: 'r', right: 'l' }[dir] || 'd', 1); };
  const starterName = sp => G.SPECIES[sp].name;
  // a choice with personality: options are [heart, chaos, deadpan]; the pick is remembered, and people react to it
  const VIBES = ['heart', 'chaos', 'deadpan'];
  const choose = async (q, opts, speaker) => {
    const k = Math.max(0, Math.min(opts.length - 1, await G.ask(q, opts, speaker ? { speaker } : {})));
    const v = G.save.vars.vibes || (G.save.vars.vibes = { heart: 0, chaos: 0, deadpan: 0 }); v[VIBES[k]] = (v[VIBES[k]] || 0) + 1;
    return k;
  };
  const vibe = () => { const v = G.save.vars.vibes || {}; return VIBES.reduce((a, b) => (v[b] || 0) > (v[a] || 0) ? b : a, 'heart'); };

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
          U.pick(x - 4, 30, 64, 116, sel, () => { this.i = j; });
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
    // Short on purpose: the prologue already told the legend, and the world will show the rest. Only what the
    // player needs to start (who they are, who their friend is, where to go) and one warm first look at an Echo.
    await say(`Hello there! Welcome to Solmere. I'm Marisol Hale, though most people just call me the Professor.`);
    G.audio && G.audio.cry('glimmer');
    await G.tween(bd.show, { mon: 1 }, 24);
    await say(`This is Glimmer. Creatures like it are called Echoes, and when one trusts you, it glows. ...Look at that. It's glowing at you already.`);
    await say(`Now, tell me about yourself.`);
    await G.tween(bd.show, { hale: 0, mon: 0 }, 16);
    G.save.look = await G.pickLook();
    if (G.world.scene) G.world.scene.player = null;
    await G.tween(bd.show, { player: 1 }, 20);
    const name = await G.askName({ title: 'What\'s your name?', start: '', max: 10, def: ['Alex', 'Robin', 'Kai', 'Sky'][['player_a', 'player_b', 'player_c', 'player_d'].indexOf(G.save.look)] || 'Alex', icon: () => G.chars.sheet(G.LOOKS[G.save.look]).down[Math.floor(G.realTime * 4) % 3] });
    G.save.name = name;
    const exp = await G.ask(`${name}. It suits you. Tell me, have you ever travelled with Echoes before?`, ['No, this is all new to me.', 'Yes, I know the basics.'], { speaker: HALE });
    G.save.vars.tips = exp === 0;
    await say(exp === 0 ? `Then I'll make sure you're never left guessing. Whenever something new comes up, a short tip will explain it.` : `Wonderful. Then I won't bore you with the basics. If you ever want a reminder, the Guide in your menu has them all.`);
    await G.tween(bd.show, { player: 0, wren: 1 }, 20);
    const rn = await G.askName({ title: 'Your best friend\'s name?', start: 'Wren', max: 10, def: 'Wren', icon: () => G.chars.sheet(G.LOOKS.wren).down[Math.floor(G.realTime * 4) % 3] });
    G.save.rival = rn;
    await say(`And ${rn}, your best friend next door: loud, brave, and never still for a second. Today, you each receive your first partner Echo.`);
    await G.tween(bd.show, { wren: 0, hale: 1 }, 20);
    await say(`Come and find me at my lab, down on the Brinehollow pier. I'll be waiting!`);
    await G.fadeOut(40);
    G.pop(bd);
    G.setFlag('intro_done');
    G.maps.reset();
    const w = new G.WorldScene(); G.push(w);
    w.enterMap('home2f', 3, 4, 'down');
    G.defineRivals();
    G.persist.write();
    await G.fadeIn(30);
    await G.say('Morning light, and gulls calling over the harbour. Today is the day.');
    // the controls as a hint over the world, not a box to read before you can move: it fades after a few steps
    { const p0 = w.player.stepN; G.tutorial.setNudge(G.tutorial.controlsText(), () => w.player.stepN - p0 >= 6); if (G.save.vars.tipsSeen) G.save.vars.tipsSeen.controls = 1; else G.save.vars.tipsSeen = { controls: 1 }; }
  };
  // ------------------------------------------------------------- HOME
  SC.mom = async (S) => {
    S.facePlayer('mom');
    if (!G.flag('mom_talk')) {
      await S.say(`Good morning, sleepyhead. Professor Hale came by looking for you. So did ${R()}, three times, and then ran past the window shouting your name.`, MOM);
      await S.say(`Here, take this. It's a Tamer's Journal. It keeps track of where you're headed and what you've promised people, in case you forget.`, MOM);
      await S.give('journal');
      S.quest('main1', 'lab');
      const k = await choose('Mom looks at you for a long moment.', ['I\'ll make you proud.', 'I\'ll be back before you know it.', 'Don\'t worry about me.']);
      await S.say([`You already have. Now go on, before I get teary in front of the whole kitchen.`, `I'll hold you to that. There will always be a warm bed for you here.`, `Worrying is my job. Yours is to go and have an adventure.`][k], MOM);
      await S.say(`The lab is down on the pier, past the market. Off you go.`, MOM);
      S.set('mom_talk');
      await G.tutorial.show('menu');   // right when there's something in the menu worth opening
      return;
    }
    const b = G.save.badges.length;
    if (G.flag('champion')) { await S.say(`The Champion of Solmere, sitting at my kitchen table. I'm so proud of you. Now eat your soup before it goes cold.`, MOM); await S.heal(); return; }
    await S.say(G.pick([`You look tired. Sit down and rest a while.`, `${b ? `${b} badge${b > 1 ? 's' : ''}! I keep them on the windowsill where the light catches them. ` : ''}Have something to eat before you go.`, `Are you eating properly out there? And looking after your Echoes?`, `${R()} came by this morning asking if you were home. That child has never once knocked.`]), MOM);
    await S.heal();
    await S.say('There. Everyone\'s rested. Go carefully, and come home soon.', MOM);
  };
  SC.wren_mom = async (S) => {
    S.facePlayer('wrenmom');
    if (G.flag('champion')) { await S.say(`${R()} told me everything. Thank you for looking out for my child. For both of my children, really.`, 'Wren\'s Mom'); return; }
    if (G.flag('rival3_done') && !G.flag('hq_done')) { await S.say(`${R()} hasn't written home in weeks. If you see them, tell them I'm not angry. Tell them to come home.`, 'Wren\'s Mom'); return; }
    await S.say(`${R()} left for the lab at dawn. They want to be Champion like their big sibling so badly. I just hope they remember to enjoy the journey.`, 'Wren\'s Mom');
  };
  // ------------------------------------------------------------- BRINEHOLLOW
  SC.bh_block = async (S) => {
    await S.say(`${P()}, wait! You can't go into the tall grass without an Echo of your own. Wild ones live out there! Come on, the Professor's lab is down on the pier.`, WREN());
    await pushBack(S, 'up');
  };
  SC.bh_fisher = async (S) => {
    S.facePlayer('bh_fisher');
    await S.say('You can fish for Flopfin off this pier. Folk say they\'re good for nothing but flopping. I say every Echo has its day.', 'Fisherman');
    if (G.bag.has('rod')) await S.say('Got a rod? Face the water and press Z. When the {r}!{w} appears, press Z again to reel it in.', 'Fisherman');
  };
  // ------------------------------------------------------------- LAB
  SC.lab_enter = async (S) => {
    if (G.flag('lab_intro') || G.flag('got_starter')) return;
    await G.wait(10);
    await S.emote('wren_lab', '!');
    await S.say(`${P()}! There you are! I've been waiting since sunrise!`, WREN());
    await S.say(`Welcome, welcome! Mind the cables on the floor. This way.`, HALE);
    await S.walkTo('player', 5, 6);
    S.face('player', 'up');
    await S.say('On the table are three Orbs, and inside each is a young Echo looking for a partner.', HALE);
    await S.say('{g}Budling{w}, a Grass fawn with a sapling on its head. {r}Kindlet{w}, a Fire kit whose ears glow like embers. And {b}Sealet{w}, a Water pup, gentle and clever.', HALE);
    await S.say(`${P()}, ${R()} insisted that you choose first. That was kind of them.`, HALE);
    await S.say('Kind? It\'s tactics! If I choose second, I can pick the one that beats yours.', WREN());
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
      U.text(`The ${s.cat} Echo`, 166, 34, { size: 6.4, color: '#6a7080' });
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
      U.img(G.monArt.front(sp, false, Math.floor(this.t / 12) % 4), 55, 22); U.text(s.name, 166, 20, { size: 11, weight: 900 }); U.text(`The ${s.cat} Echo`, 166, 34, { size: 6.4, color: '#6a7080' });
      U.typeBadge(s.types[0], 166, 44, 36, 10); G.ui.wrap(s.dex, 170, 6.2).forEach((l, k) => U.text(l, 166, 60 + k * 9.4, { size: 6.2, color: '#4a5060' }));
      const fin = G.SPECIES[G.evoLine(sp).slice(-1)[0].id]; U.text(`Evolves into ${G.SPECIES[G.evoLine(sp)[1].id].name}, then ${fin.name} (${fin.types.map(G.cap).join('/')}).`, 166, 112, { size: 5.6, weight: 800, color: G.TYPE_COLORS[s.types[0]] });
    } };
    G.push(sc); G.audio && G.audio.cry(sp);
    const shown = G.randomizeSpecies(sp, 'starter');
    const ok = await G.yesno(`${starterName(sp)}, the ${G.cap(G.SPECIES[sp].types[0])}-type Echo. This one?`);
    G.pop(sc);
    if (!ok) return;
    G.setVar('starter', sp);
    G.defineRivals();
    await S.giveMon(sp, 5, { starter: true, bond: 120, ball: 'orb', text: `${starterName(shown)} looks up at you, and doesn't look away.` });
    S.set('got_starter');
    S.w.spawnEnts();
    await G.tutorial.show('partner');
    const rsp = G.rivalOf[sp];
    await S.say(`Then I choose ${starterName(rsp)}! It has the type advantage. Told you!`, WREN());
    await S.say(`${R()} received ${starterName(G.randomizeSpecies(rsp, 'starter'))}!`);
    await S.say(`And these are for you both: an Echodex, which records every Echo you meet and catch, and an EXP Share, so every Echo on your team grows, even the ones waiting their turn.`, HALE);
    await S.give('dex'); await S.give('expshare');
    await S.say(`${P()}, let's battle! Right now! Our very first one!`, WREN());
    await S.say('Here in the lab? ...Oh, very well. Just mind the equipment.', HALE);
    const won = await G.storyBattle('rival1', { canLose: true });
    S.set('rival1_done');
    await S.say(won ? `I lost?! ...That was a warm-up. Next time, ${P()}, I'll win for real.` : `I won! Our first battle, and I won! Don't worry, ${P()}. You'll get me next time.`, WREN());
    await S.say('What a match! And did you see how they listened to you? That bond has a name: Resonance. It only grows from here. Now, let me look after your Echoes.', HALE);
    await S.heal();
    await S.say(`Could I ask a favour? Warden Juniper in Fernwick, north along Route 1, is waiting on my research notes. Would you take them to her?`, HALE);
    await S.give('parcel');
    S.quest('main1', 'parcel');
    await S.say(`And ${P()}... Juniper is also a Warden, and runs Fernwick's gym. Earn six Warden badges, and the road to the Conclave and the Champion opens. It's a long road. It might be yours.`, HALE);
    await S.say(`Six badges! I'm getting there first. See you on Route 1!`, WREN());
    const wr = S.npc('wren_lab');
    if (wr) { await S.move('wren_lab', 'dddr', 2); S.remove('wren_lab'); G.audio && G.audio.sfx('door'); }
  };
  SC.starter_budling = S => chooseStarter(S, 'budling');
  SC.starter_kindlet = S => chooseStarter(S, 'kindlet');
  SC.starter_sealet = S => chooseStarter(S, 'sealet');
  SC.wren_lab = async (S) => { S.facePlayer('wren_lab'); await S.say(G.flag('lab_intro') ? 'Go on, choose! The Orbs are on the table. Take a look at each one.' : `${P()}! Over here!`, WREN()); };
  SC.lab_aide = async (S) => {
    S.facePlayer('aide');
    const lines = ['The Resonance meter jumps whenever an Echo evolves. We still don\'t fully understand why.', 'An Echo\'s nature shapes how its stats grow. On the Summary screen, a red arrow marks the stat it favours and a blue arrow the one it neglects.', 'Every Echo is born with its own hidden potential. The Summary screen shows it, so you can see what each one is best at.', 'Walk with your partner and your bond will grow. Some Echoes only evolve once they trust you completely.'];
    await S.say(G.pick(lines), 'Lab Aide');
  };
  SC.hale = async (S) => {
    S.facePlayer('hale');
    if (!G.flag('got_starter')) { await S.say('The three Orbs are on the table. Take your time, and choose the one that feels right.', HALE); return; }
    const d = G.dexCount();
    if (d.caught >= 40 && !G.flag('dex40')) { await S.say(`${d.caught} species already? That's remarkable work. Please, take these for your trouble.`, HALE); await S.give('expcandy', 5); S.set('dex40'); S.quest('side_dex', 'part2'); }
    if (d.caught >= 70 && !G.flag('dex70')) { await S.say(`${d.caught} species... I never thought I'd see an Echodex this full. Take the Shiny Charm. It makes rare, differently coloured Echoes far more likely to appear.`, HALE); await S.give('shinycharm'); S.set('dex70'); S.quest('side_dex', 'done'); return; }
    if (!G.save.quests.side_dex) S.quest('side_dex', 'part1');
    const tips = G.flag('champion') ? `Champion ${P()}, strange news from Starfall Peak, north-west of Frostpeak. The stars above it are going out, one by one. Would you go and see?` : `${d.caught} of ${d.total} species caught. Different Echoes come out at night, and more live in the water. Stay curious!`;
    await S.say(tips, HALE);
    if (G.flag('champion') && !G.save.quests.post1) S.quest('post1', 'start');
  };
  // ------------------------------------------------------------- ROUTE 1
  SC.route1_tutorial = async (S) => {
    const w = S.w;
    await S.approach('r1w', 'wren', { prefer: ['up', 'left', 'right'] });
    await S.emote('r1w', '!');
    await S.say(`${P()}, wait up! The Professor asked me to give you these.`, WREN());
    await S.give('orb', 5);
    if (G.tutorial.on()) {
      await S.say(`Orbs are for catching wild Echoes. Have you caught one before? Let's try it together. Look, there's a Nibbit in the grass!`, WREN());
      await G.tutorial.show('wild');
      await S.say(`Weaken it with a move first, then throw an Orb from your Bag. I'll watch!`, WREN());
      await G.startWild(null, { species: 'nibbit', lvl: 2, noRandom: true });
      const got = G.party.allMons().some(m => m.sp === 'nibbit');
      await S.say(got ? `You caught it! Your very first catch. That's how it's done!` : `It got away? Don't worry. There are plenty more in the grass. Try again as you go!`, WREN());
      if (!got) G.bag.add('orb', 2);
    }
    await S.say(`Now, I'll race you to Fernwick! Loser buys the Sun Berries. Go!`, WREN());
    await S.fadeOut(10); S.remove('r1w'); await S.fadeIn(10);
    S.set('route1_tut');
    // a real race: the clock only runs while you're walking the route (battles pause it)
    await S.say('{k}RACE! Reach Fernwick, to the north, before the timer runs out. Hold Shift to run. Battles pause the clock.{w}');
    G.setVar('raceLeft', 60 * 22); S.set('race_active');
    G.audio && G.audio.sfx('exclaim');
  };
  SC.race_finish = async (S) => {
    const won = G.flag('race_active');
    S.set('race_done'); G.clearFlag ? G.clearFlag('race_active') : (G.save.flags.race_active = false);
    await S.approach('rw', 'wren', { prefer: ['up', 'left', 'right'] });
    if (won) {
      await S.emote('rw', '!');
      await S.say(`Huff... huff... How are you so fast? I even took a shortcut through a hedge!`, WREN());
      await S.say('A deal\'s a deal. Here are your Sun Berries. Give one to an Echo to hold, and it will eat it when it\'s badly hurt.', WREN());
      await S.give('sunberry', 2);
      G.save.stats.raceWins = (G.save.stats.raceWins || 0) + 1;
    } else {
      await S.say(`Beat you! That makes us even, I think. You owe me Sun Berries!`, WREN());
    }
    await S.say('The gym is at the top of town. Juniper looks gentle, but they say she\'s tough. See you in there!', WREN());
    await S.fadeOut(10); S.remove('rw'); await S.fadeIn(10);
  };
  SC.hollis = async (S) => {
    S.facePlayer('hollis');
    if (!G.flag('lostcub_active')) {
      await S.say('A young Tamer! Could you help an old farmer? My Snoozle has wandered off again. It likes to nap in the tall grass to the north, near the pond.', 'Farmer Hollis');
      S.set('lostcub_active'); S.quest('side_lostcub', 'find'); S.w.spawnEnts(); return;
    }
    if (!G.flag('lostcub_found')) { await S.say('Any sign of Snoozle? Big and fluffy, and it snores. Try the tall grass north of the pond.', 'Farmer Hollis'); return; }
    if (!G.flag('lostcub_done')) {
      await S.say('Snoozle! You found it! It went after the wild berries again, didn\'t it?', 'Farmer Hollis');
      await S.say('Please, take this Soothe Bell. An Echo that holds it grows close to you faster.', 'Farmer Hollis');
      await S.give('soothebell');
      await S.say('And... Snoozle\'s little brother hasn\'t taken his eyes off you. I think he\'d like to travel with you. Would you take him along?', 'Farmer Hollis');
      if (await G.yesno('Take the young Snoozle?')) await S.giveMon('snoozle', 8, { text: 'The little Snoozle yawned, climbed into an Orb, and was asleep before it closed.', bond: 140 });
      else await S.say('That\'s all right. He\'ll be here if you change your mind.', 'Farmer Hollis');
      S.set('lostcub_done'); S.quest('side_lostcub', 'done'); S.w.spawnEnts(); return;
    }
    if (!G.flag('lostcub_gift') && !G.party.hasSpecies('snoozle')) { if (await G.yesno('Snoozle\'s little brother still wants to come with you. Take him?')) { await S.giveMon('snoozle', 10, { bond: 140 }); S.set('lostcub_gift'); } return; }
    await S.say('Snoozle sleeps sixteen hours a day. Some days I envy it.', 'Farmer Hollis');
  };
  SC.lostcub_found = async (S) => {
    await S.say('A big, fluffy Snoozle is fast asleep in the grass, with berry juice on its paws.');
    G.audio && G.audio.cry('snoozle');
    await S.emote('snoozle_lost', 'zzz', 40);
    await S.say('Snoozle wakes, sniffs at you, catches the scent of Hollis\'s farm on the breeze... and waddles off home.');
    S.remove('snoozle_lost'); S.set('lostcub_found'); S.quest('side_lostcub', 'return');
  };
  G.QUESTS.side_lostcub.steps = { find: G.QUESTS.side_lostcub.desc, return: 'Snoozle headed home. Go see Farmer Hollis at his farmhouse on Route 1.' };
  SC.gate_guard = async (S) => {
    S.facePlayer('gateguard');
    const b = G.save.badges.length;
    if (b < 6) { await S.say(`Beyond this gate lies Victory Road. Only Tamers with all six Warden badges may pass. You have ${b}.`, 'Guard'); return; }
    if (!G.flag('tidelight_done')) { await S.say('Six badges. Well done. But the Lodestar has gone dark, and the Conclave has closed the road until its light returns.', 'Guard'); return; }
    await S.say('The Lodestar shines again, and all of Solmere knows who relit it. The road is open. Good luck, Tamer.', 'Guard');
    await S.move('gateguard', 'l', 1); S.face('gateguard', 'right');
    S.set('vr_open');
  };
  // ------------------------------------------------------------- FERNWICK
  SC.fern_guard = async (S) => {
    await S.say('Hold on! Rangers have seen people in grey coats sneaking around Whisperwood. Warden Juniper has asked that nobody go east without her badge.', 'Ranger');
    await pushBack(S, 'right');
  };
  SC.fern_guard_talk = async (S) => { S.facePlayer('fw_guard'); await S.say('Earn Juniper\'s badge and the road east is yours.', 'Ranger'); };
  SC.florist_bea = async (S) => {
    S.facePlayer('fw_bea');
    if (!G.save.quests.side_petals) {
      await S.say('Are you heading to Galvan Harbor? My sister Rhoda lives there. Would you tell her that her birthday bouquet is on its way by boat?', 'Florist Bea');
      await S.say('Here, a little something for the road.', 'Florist Bea');
      await S.give('oranberry', 2); S.quest('side_petals', 'go'); S.set('bouquet'); return;
    }
    if (G.save.quests.side_petals.step === 'done') { await S.say('Rhoda wrote to me! She loved the bouquet. Thank you for passing on the message.', 'Florist Bea'); return; }
    await S.say('Rhoda lives in the south-east corner of Galvan Harbor. Thank you for doing this!', 'Florist Bea');
  };
  SC.dowsing_man = async (S) => {
    S.facePlayer('fw_dowse');
    if (!G.bag.has('dowsing')) { await S.say('There\'s treasure buried all over Solmere! Take my spare Dowsing Rod. Use it from the Bag and it will point you to hidden items nearby.', 'Treasure Hunter'); await S.give('dowsing'); return; }
    await S.say('Dead ends, the backs of trees, the corners nobody bothers to check. That\'s where the best finds are.', 'Treasure Hunter');
  };
  SC.nickname_rater = async (S) => {
    S.facePlayer('fh2');
    const m = G.party.lead(); if (!m) return;
    await S.say(`Ah, ${G.mon.name(m)}! ${m.nick ? 'What a fine name. You can tell it was chosen with care.' : 'No nickname yet? You can give it one from the Party menu. A name makes a partner feel like family.'}`, 'Name Enthusiast');
  };
  // Before the first gym: a Tamer offers an Emberjay (Fire/Flying, strong against Grass), so every starter has a
  // fair way into Juniper's Grass gym (Budling mirrors it, Sealet is weak to it). Measured with the gym-1 bots:
  // with it, disadvantaged starters win about 60-80%; without, almost never (tests/early_balance.js).
  SC.ember_gift = async (S) => {
    const N = 'Tamer Mira'; S.facePlayer('ember_mira');
    if (G.flag('got_ember')) { await S.say('How\'s my Emberjay doing? It never did like standing still. Sounds like it found the right Tamer.', N); return; }
    await S.say('Off to see Juniper? Her Grass team sends a lot of new Tamers home early.', N);
    await S.say('This Emberjay has pecked at that gym door every morning for a week. I think it wants a real challenge. Fire and Flying both beat Grass.', N);
    if (!await G.yesno('Will you take Emberjay along?')) { await S.say('The offer stands, if you change your mind.', N); return; }
    await S.giveMon('emberjay', 10, { ball: 'orb', text: 'Emberjay ruffles its feathers and hops onto your shoulder.' });
    S.set('got_ember');
    await S.say('Look after it. And give Juniper my regards!', N);
  };
  SC.gym_guide = async (S, ctx) => {
    const id = S.w.map.id;
    const info = {
      fernwick_gym: ['Grass', 'Fire, Flying, Bug, Poison and Ice moves are strong against Grass. Watch out for Leech Seed: it drains a little health every turn.'],
      galvan_gym: ['Electric', 'Ground types are immune to Electric moves. Step on the glowing pads to lower the barriers.'],
      cinder_gym: ['Fire', 'Water, Ground and Rock moves put out the fire. Brann\'s last Echo can Resonate, so save something strong for the end.'],
      dusk_gym: ['Ghost', 'Dark and Ghost moves are strong against Ghosts. Normal and Fighting moves pass straight through them.'],
      frost_gym: ['Ice', 'Mind the slippery floor. Fire, Fighting, Rock and Steel moves shatter ice. Sigrid battles in the snow, which makes her Ice types tougher.'],
      sky_gym: ['Dragon', 'Ice, Dragon and Fairy moves are strong against Dragons. Kaelen\'s Tempestral is a formidable Echo. Come prepared.'],
    }[id] || ['?', 'Good luck!'];
    await S.say(`Hello there, challenger! This gym's Warden uses ${info[0]}-type Echoes. ${info[1]}`, 'Gym Guide');
    if (id === 'dusk_gym' && !G.bag.has('lantern')) { await S.say('It\'s pitch black in there. Take this Lantern, so you can see where you\'re going.', 'Gym Guide'); await S.give('lantern'); }
    if (!G.bag.has('ether') && G.chance(.5)) { await S.say('And here, take these. Good luck in there!', 'Gym Guide'); await S.give('superpotion', 2); }
  };
  const wardenWin = async (S, o) => {
    await S.badge(o.badge);
    S.set(o.flag);
    G.tutorial.queue('badge');
    // {tm} is the disc's in-game name ("SD19 Grand Drain"), so the line always matches what you receive
    if (o.tm) { await S.say(o.tmText.replace('{tm}', G.ITEMS[o.tm].name), o.name); await S.give(o.tm); }
    if (o.extra) await o.extra();
    for (const t of o.gymTrainers || []) G.save.trainers[t] = G.save.trainers[t] || { badges: G.save.badges.length };
    G.persist.write();
  };
  SC.juniper = async (S) => {
    const N = 'Warden Juniper';
    S.facePlayer('juniper_npc');
    if (G.flag('badge1')) { await S.say('The flowers seem brighter since our battle. Whisperwood is east, past Route 2. Do be careful, dear.', N); return; }
    if (G.bag.has('parcel') && !G.flag('parcel_given')) {
      await S.say('Oh! Notes from Marisol? How lovely. Thank you for bringing them all this way.', N);
      G.bag.remove('parcel'); S.set('parcel_given');
      await S.say('"The stronger the bond, the faster an Echo grows, heals and finds its courage." She always did put it beautifully.', N);
      await S.say('But you didn\'t come all this way just to deliver a letter, did you? I can see it in your eyes. You want a badge.', N);
    }
    await S.say('I\'m Juniper, Warden of Fernwick. People think a gardener must be gentle. But a garden only thrives if you are patient, and stubborn, and you never give up.', N);
    await S.say('Show me what you\'ve been growing, dear.', N);
    const won = await G.storyBattle('juniper');
    if (!won) return;
    await S.say('...My, my. It has been a long time since I lost. You have earned this: the Bloom Badge.', N);
    await wardenWin(S, { badge: 'bloom', flag: 'badge1', name: N, tm: 'tm19', tmText: 'And this is {tm}. It drains the foe\'s health to restore your own.', gymTrainers: ['fg_1', 'fg_2'] });
    await S.say('May I ask a favour? Strangers in grey coats have been seen at the Heartroot Shrine, deep in Whisperwood, east along Route 2. Would you find out what they want? I\'ll let the guard know you may pass.', N);
    S.quest('main1', 'done'); S.quest('main2', 'go');
  };
  // ------------------------------------------------------------- ROUTE 2
  SC.berry_lady = async (S) => {
    S.facePlayer('r2_berry');
    const day = Math.floor(G.save.playtime / 2880);
    if (G.getVar('berryday', -1) === day) { await S.say('The bushes need a day to grow back. Come again tomorrow! (A day here is about 48 minutes.)', 'Berry Farmer'); return; }
    G.setVar('berryday', day);
    const b = G.pick(['oranberry', 'sunberry', 'cheriberry', 'chestoberry', 'pechaberry', 'rawstberry', 'lumenberry', 'leppaberry']);
    await S.say('The bushes are heavy with fruit today! Please, take some.', 'Berry Farmer');
    await S.give(b, 2);
  };
  // ------------------------------------------------------------- WHISPERWOOD
  SC.wood_grunts = async (S) => {
    if (G.flag('wood_done')) return;
    const g1 = S.npc('ww_g1'), g2 = S.npc('ww_g2');
    await S.say('"Get it loose!" "I\'m trying! The roots won\'t let go. It\'s like they\'re holding on to it!"');
    G.audio && G.audio.music('encounter_villain');
    if (g1) g1.dir = 'down'; if (g2) g2.dir = 'down';
    await S.emote('ww_g1', '!', 30);
    await S.say('Who are you? This is Hollow business. Turn around and forget you saw us.', 'Hollow Grunt');
    let won = await G.storyBattle('ww_grunt1'); if (!won) return;
    await S.say('You beat him? Then you\'ll deal with me!', 'Hollow Grunt');
    won = await G.storyBattle('ww_grunt2'); if (!won) return;
    await S.say('Tch! Doesn\'t matter. We already broke off a shard. The Director will have to make do. Let\'s go!', 'Hollow Grunt');
    await Promise.all([S.move('ww_g1', 'uu', 2), S.move('ww_g2', 'uu', 2)]); await S.fadeOut(8);
    S.remove('ww_g1'); S.remove('ww_g2'); await S.fadeIn(8);
    S.restoreMusic();
    await S.say(`You're not hurt? Good. I'm Ash, the Whisperwood Ranger. They caught me off guard at the shrine. Thank you for stepping in.`, 'Ranger Ash');
    await S.say('Grey coats, and every tool they carried was stamped with the mark of Crane Dynamics. Here, take this Trail Knife. It clears the thin saplings that block paths around Solmere.', 'Ranger Ash');
    await S.give('trailknife');
    await S.say(`"${P()}! ${P()}!"`);
    await S.approach('wwhale', 'hale', { prefer: ['up', 'left', 'right', 'down'] });
    await S.say(`You're all right! Juniper sent word, and I came as fast as I could.`, HALE);
    await S.say('Look at the Heartroot. It\'s a Resonance crystal, and it was pulsing in time with your team through the whole battle. That doesn\'t happen for just anyone.', HALE);
    await S.say('I think you\'re ready for this. A Resonance Band.', HALE);
    await S.give('resonanceband');
    await S.say('Once per battle, an Echo that trusts you can {c}Resonate{w}. Moves of its main type hit far harder, and a Resonant Shield softens the first super-effective hit it takes.\\pIn battle, open FIGHT and press R. Save it for the moment that matters.', HALE);
    await S.say('And these EXP Candies. If an Echo ever falls behind the rest of your team, one of these will help it catch up.', HALE);
    await S.give('expcandy', 3);
    await S.say('Crane Dynamics tools in the hands of the Hollow... I don\'t like it. Galvan Harbor is to the north. Warden Ione may know something.', HALE);
    await S.fadeOut(10); S.remove('wwhale'); await S.fadeIn(10);
    S.set('wood_done'); S.quest('main2', 'done'); S.quest('main3', 'go');
    G.persist.write();
  };
  SC.ranger_ash = async (S) => {
    S.facePlayer('ww_ash');
    await S.say(G.flag('wood_done') ? 'The Heartroot is healing. I can hear it humming. Galvan Harbor is north, through the trees.' : 'The shrine! The grey coats are at the shrine!', 'Ranger Ash');
  };
  // ------------------------------------------------------------- GALVAN
  SC.crane_speech = async (S) => {
    if (!G.flag('wood_done')) { S.set('crane_speech'); return; }
    S.music('crane');
    const crane = S.spawn({ id: 'gv_crane', x: 22, y: 10, look: 'crane', dir: 'up' });
    const wr = S.spawn({ id: 'gv_wren', x: 20, y: 11, look: 'wren', dir: 'right' });
    const c1 = S.spawn({ id: 'gv_c1', x: 24, y: 11, look: 'worker', dir: 'left' });
    const c2 = S.spawn({ id: 'gv_c2', x: 21, y: 12, look: 'woman', dir: 'up' });
    await S.say('A crowd has filled the fountain square. A woman in a white coat steps up onto the fountain\'s edge, and the square falls quiet.');
    crane.dir = 'down';
    const N = 'Director Crane';
    await S.say('People of Galvan. For twelve years, Crane Dynamics has kept the lights of this harbour burning. Today, I want to offer you something more.', N);
    await S.say('Your bond with your Echo is the truest thing you have. And yet you have never been able to see it, or to know how strong it truly is.', N);
    await S.say('The Chorus band changes that. It measures your Resonance, and with its Amplifier, it makes that bond stronger than time alone ever could.', N);
    await S.say('Join the Crane Fellowship, and become the Tamer you were always meant to be.', N);
    await S.say('The crowd erupts in applause. But Director Crane isn\'t looking at them. Her eyes are on the far middle of the Mere.');
    await S.move('gv_crane', 'ddd', 1); S.remove('gv_crane');
    S.remove('gv_c1'); S.remove('gv_c2');
    S.remove('gv_wren'); await S.approach('gv_wren', 'wren');
    await S.say(`${P()}! Did you hear that? The Fellowship! Fellows are the best Tamers in Solmere. Everyone knows their names.`, WREN());
    const k = await choose(`${R()}'s eyes are shining.`, ['Just be careful, all right?', 'I\'ll race you to the top.', 'Forcing a bond seems wrong.'], WREN());
    await S.say([`Careful? It's a band, not a dragon. ...But all right. I'll be careful.`, `You're on! Whoever ranks higher buys dinner.`, `It's not forcing, it's... helping. That's all. Right?`][k], WREN());
    await S.say('Ione\'s gym first. Then I\'m joining. If I become a Fellow, Sable will have to notice me.', WREN());
    await S.fadeOut(10); S.remove('gv_wren'); await S.fadeIn(10);
    S.restoreMusic(); S.set('crane_speech');
  };
  SC.ione = async (S) => {
    const N = 'Warden Ione';
    S.facePlayer('ione_npc');
    if (G.flag('badge2')) { await S.say('Route 3 is to the east. Glimmer Cave runs beneath the cliffs to Cindervale. It\'s a long cave, so stock up first.', N); return; }
    await S.say('Welcome to the Galvan Gym!', N);
    await S.say('I\'m Ione. I keep the harbour\'s lights burning, every lamp and every beacon. Let\'s see if you can keep up with the current!', N);
    const won = await G.storyBattle('ione'); if (!won) return;
    await S.say('Well done! You didn\'t just keep up, you outpaced me. The Current Badge is yours.', N);
    await wardenWin(S, { badge: 'current', flag: 'badge2', name: N, tm: 'tm34', tmText: 'And {tm}. Strike, then switch out in the same move.', gymTrainers: ['gg_1', 'gg_2', 'gg_3'] });
    await S.say('Can I be honest with you? Crane Dynamics built half the machines in this city. But those new Fellows... their Echoes look strained, like they\'re being pushed too hard. Something isn\'t right.', N);
    await S.say('Head east along Route 3. Glimmer Cave will take you through to Cindervale. Good luck.', N);
    S.quest('main3', 'done'); S.quest('main4', 'go');
  };
  SC.bike_shop = async (S) => {
    S.facePlayer('bikeguy');
    if (G.bag.has('bike')) { await S.say('How\'s the bike treating you? Press F to hop on and off.', 'Spoke'); return; }
    if (!G.flag('badge2')) { await S.say('I build folding bikes, and I give my best one to any Tamer with two badges. Come back when you\'ve earned them!', 'Spoke'); return; }
    await S.say('Two badges! Then this folding bike is yours, as promised. It\'s the finest I\'ve ever made.', 'Spoke');
    await S.give('bike', 1, { note: 'Press F to hop on or off. You can also register it in the Bag.' });
    S.set('got_bike');
  };
  SC.old_salt_marv = async (S) => {
    S.facePlayer('gv_marv');
    const N = 'Old Salt Marv';
    if (!G.bag.has('rod')) { await S.say('Ahoy there, youngster. Ever tried fishing? Take my old rod. Face the water, press Z, and reel in when the "!" appears.', N); await S.give('rod'); }
    const q = G.save.quests.side_fish;
    if (q && q.step === 'done') { await S.say('I still think about your Riptalon. Fifty years I waited to see one. Thank you, youngster.', N); return; }
    if (G.save.party.some(m => m.sp === 'riptalon')) {
      await S.say('Is that... a Riptalon? Raised from a Flopfin? Fifty years they laughed at me, and I was right all along!', N);
      await S.say('Take my Pro Rod. You\'ve earned it. It hooks rarer Echoes in deep water.', N);
      await S.give('prorod'); S.quest('side_fish', 'done'); return;
    }
    if (!q) S.quest('side_fish', 'go');
    await S.say('Everyone laughs at Flopfin. But I know that, with patience, it becomes something magnificent. Show me a Riptalon, and my Pro Rod is yours.', N);
  };
  SC.rhoda = async (S) => {
    S.facePlayer('gv_rhoda');
    if (G.flag('bouquet') && G.save.quests.side_petals && G.save.quests.side_petals.step !== 'done') {
      await S.say('A bouquet, coming by boat? From Bea? She remembered my birthday!', 'Rhoda');
      await S.say('Thank you for bringing the news. Please, take this. It powers up Grass moves.', 'Rhoda');
      await S.give('miracleseed'); S.quest('side_petals', 'done'); return;
    }
    await S.say('I like the harbour, but I do miss Fernwick\'s flowers.', 'Rhoda');
  };
  SC.vsrecorder_npc = async (S) => {
    S.facePlayer('gv_vsr');
    if (!G.bag.has('vsrecorder') && G.flag('badge2')) { await S.say('You look like someone who enjoys a rematch. With this Vs. Recorder, trainers you\'ve beaten can challenge you again after each new badge.', 'Officer Jenna'); await S.give('vsrecorder'); return; }
    await S.say(G.bag.has('vsrecorder') ? 'After each new badge, trainers you\'ve beaten will want a rematch. Just talk to them again.' : 'Come back once you have Ione\'s badge. I\'ll have something for you.', 'Officer Jenna');
  };
  SC.ev_trainer = async (S) => {
    S.facePlayer('gh1');
    const N = 'Stat Scholar';
    await S.say('Every Echo you defeat trains your team a little, in its own way. These are Effort Values. I can show you them, or clear them for a fee.', N);
    const k = await G.ask('What would you like?', ['Check lead Echo', 'Reset EVs ($2,000)', 'Nothing'], { speaker: N });
    const m = G.party.lead();
    if (k === 0 && m) await S.say(`${G.mon.name(m)}: ${G.STATS.map(s => G.STAT_SHORT[s] + ' ' + m.evs[s]).join(', ')}. Total ${G.mon.totalEVs(m)}/510.`, N);
    if (k === 1) {
      const i = await G.openParty({ mode: 'select', prompt: 'Reset whose EVs?' }); if (i === null || i < 0) return;
      if (G.save.money < 2000) { await S.say('I\'m afraid you don\'t have enough money.', N); return; }
      G.save.money -= 2000; for (const s of G.STATS) G.save.party[i].evs[s] = 0; await S.say('Done! A clean slate.', N);
    }
  };
  SC.move_tutor = async (S) => {
    S.facePlayer('gh2');
    const N = 'Move Tutor';
    const moves = ['bondstrike', 'helpinghand', 'drainpunch', 'zenstrike', 'heatwave', 'icygust', 'aerialace', 'ironhead', 'seedbomb', 'shadowclaw', 'playrough', 'earthpower'];
    await S.say('I teach special moves, for $2,000 each. Choose an Echo, and I\'ll show you what it can learn.', N);
    const i = await G.openParty({ mode: 'select', prompt: 'Teach which Echo?' }); if (i === null || i < 0) return;
    const m = G.save.party[i];
    const ok = moves.filter(mv => (mv === 'bondstrike' || mv === 'helpinghand' || G.canLearnTM(m.sp, mv) || G.SPECIES[m.sp].types.concat(G.SPECIES[m.sp].tmx || []).includes(G.MOVES[mv].type)) && !G.mon.hasMove(m, mv));
    if (!ok.length) { await S.say(`${G.mon.name(m)} already knows everything I could teach it.`, N); return; }
    const k = await G.choose(ok.map(mv => ({ label: G.MOVES[mv].name, right: G.cap(G.MOVES[mv].type) })).concat([{ label: 'Cancel' }]), { x: 150, y: 20, w: 150, cancel: ok.length, title: 'Teach which move?' });
    if (k < 0 || k >= ok.length) return;
    if (G.save.money < 2000) { await S.say('I\'m afraid you don\'t have enough money. Each lesson is $2,000.', N); return; }
    if (await G.learnWithPrompt(m, ok[k])) G.save.money -= 2000;
  };
  const tradeFlow = async (S, id, want, give, nick, lvl, N) => {
    if (G.flag('trade_' + id)) { await S.say(`How is ${nick} doing? I hope you two are getting along.`, N); return; }
    await S.say(`I'm looking for a ${G.SPECIES[want].name}. Would you trade me one for my ${G.SPECIES[give].name}, ${nick}?`, N);
    if (!await G.yesno(`Trade a ${G.SPECIES[want].name} for ${nick}?`)) return;
    const i = await G.openParty({ mode: 'select', prompt: `Trade which ${G.SPECIES[want].name}?`, filter: m => m.sp === want, filterMsg: `That's not a ${G.SPECIES[want].name}.` });
    if (i === null || i < 0) { await S.say('That\'s all right. Maybe another time.', N); return; }
    const old = G.save.party[i];
    const nm = G.mon.create(give, Math.max(lvl, old.lvl), { perfectIVs: 2, ot: N.split(' ').pop(), otId: 12345, nick, met: { loc: S.w.map.name + ' (trade)', lvl } });
    nm.bond = 90; if (old.item) G.bag.add(old.item);
    G.save.party[i] = nm; G.dexMark(give, 'caught');
    G.audio && G.audio.jingle('newmon');
    await S.say(`You traded ${G.mon.name(old)} for ${nick}!\\p(Traded Echoes earn 1.5× EXP.)`);
    S.set('trade_' + id); S.w.placeFollower();
  };
  SC.trade_npc_galvan = S => { S.facePlayer('gh3'); return tradeFlow(S, 'galvan', 'digmole', 'zipsquee', 'Sparky', 18, 'Grandpa Ott'); };
  SC.trade_npc_frost = S => { S.facePlayer('fh2'); return tradeFlow(S, 'frost', 'rascoon', 'shiftail', 'Fluffles', 30, 'Skier Mika'); };
  SC.crane_reception = async (S) => {
    S.facePlayer('cl_recep');
    await S.say(G.flag('hq_done') ? 'The Director has stepped down, and the Chorus bands have all been recalled. It\'s very quiet here now.' : 'Welcome to Crane Dynamics! The Director works from our tower in Skyreach. Would you like to hear about the Chorus band and the Crane Fellowship?', 'Receptionist');
  };
  SC.dr_orla = async (S) => {
    S.facePlayer('orla');
    const N = 'Dr. Orla';
    const f = ['clawfossil', 'wingfossil'].find(i => G.bag.has(i));
    if (f) {
      const sp = G.ITEMS[f].fossil;
      await S.say(`A ${G.ITEMS[f].name}! Wonderful. Our Revival Lab can bring it back to life. Give me just a moment.`, N);
      G.bag.remove(f); await S.fadeOut(20); G.audio && G.audio.sfx('pc_on'); await S.wait(60); await S.fadeIn(20);
      await S.say('It worked! Here it is!', N);
      await S.giveMon(sp, 25, { perfectIVs: 2, text: `The ${G.SPECIES[sp].name} blinks at a world it has never seen, then nuzzles your hand.` });
      S.quest('side_fossil', 'done'); return;
    }
    if (!G.save.quests.side_fossil) S.quest('side_fossil', 'go');
    await S.say('I\'m Dr. Orla, the curator. Diggers in Glimmer Cave, east of Route 3, keep finding fossils. Bring me one, and I\'ll bring it back to life.', N);
  };
  // ------------------------------------------------------------- GLIMMER CAVE
  SC.lark1 = async (S) => {
    if (G.flag('lark1_done')) return;
    const N = 'Admin Lark';
    S.faceEach('gc_lark', 'player');
    G.audio && G.audio.music('encounter_villain');
    await S.emote('gc_lark', '!');
    await S.say('Well, well. You\'re the one who sent my people running from Whisperwood.', N);
    await S.say('I\'m Lark, an Admin of the Hollow. These singing crystals belong to us now. The Director needs every drop of Resonance in them. Don\'t ask me why. I never do.', N);
    const k = await choose('Lark watches you with a crooked smile.', ['Leave the crystals alone.', 'I\'m not scared of you.', 'Why do you work for them?'], N);
    await S.say([`A hero, then. How sweet. Let's see how long that lasts.`, `You will be.`, `...Because they wanted me. Nobody else ever did. Enough talking!`][k], N);
    const won = await G.storyBattle('lark1'); if (!won) return;
    await S.say('Tch! Fine, keep your glowing rocks. The Director won\'t need them soon anyway. She\'s after something far bigger.', N);
    await S.say('Something that sleeps beneath a lighthouse. See you around, hero.', N);
    await S.move('gc_lark', 'lll', 2); S.remove('gc_lark');
    S.set('lark1_done'); S.restoreMusic();
    await S.say('"Hello? Is someone there? Have they gone?"');
    await SC.rocco_hammer(S);
  };
  SC.rocco_hammer = async (S) => {
    S.facePlayer('gc_rocco');
    const N = 'Hiker Rocco';
    if (!G.flag('lark1_done')) { await S.say('Psst! The Hollow blasted the exit shut and trapped me in here! There\'s a whole gang of them in the crystal chamber!', N); return; }
    if (!G.bag.has('pickhammer')) {
      await S.say('You chased them off! Thank you! They blocked the way to Cindervale with rubble. Take my Pick Hammer and break right through.', N);
      await S.give('pickhammer', 1, { note: 'Walk up to a cracked rock and press Z to smash it.' });
      return;
    }
    await S.say('Cindervale is just past those rocks. Its hot springs are the best place in Solmere to rest.', N);
  };
  SC.fossil_dig = async (S) => {
    S.facePlayer('gc_dig');
    const N = 'Digger Pim';
    if (G.flag('got_fossil')) { await S.say('Take good care of that fossil! Dr. Orla at the Galvan Harbor Museum can revive it.', N); return; }
    await S.say('Two fossils in one dig! But my bag only has room for one. You found me, so you choose.', N);
    const k = await G.ask('Which fossil will you take?', ['Claw Fossil', 'Wing Fossil'], { speaker: N, cancel: -1 });
    if (k < 0) return;
    await S.give(k === 0 ? 'clawfossil' : 'wingfossil');
    S.set('got_fossil'); S.quest('side_fossil', 'go');
    await S.say('Take it to Dr. Orla at the Galvan Harbor Museum. She can bring it back to life!', N);
  };
  // ------------------------------------------------------------- CINDERVALE
  SC.rival2 = async (S) => {
    await S.approach('cv_wren', 'wren_crane', { prefer: ['right', 'down', 'up'] });
    await S.emote('cv_wren', '!');
    await S.say(`${P()}! Look, a Fellowship scarf! And the Chorus band! I'm ranked twentieth of all the Fellows. Twentieth, after just a few weeks!`, WREN());
    await S.say('The band\'s Amplifier pushes our bond higher than it\'s ever been. My team has never been this strong.', WREN());
    await S.say('Come on. Let\'s see how you measure up!', WREN());
    const won = await G.storyBattle('rival2');
    S.set('rival2_done');
    if (!won) return;
    await S.say('Tch. That\'ll cost me my rank... Whatever. The Fellowship says something important is happening at the Ruins of Echo, near Duskmere. I\'m going.', WREN());
    await S.fadeOut(10); S.remove('cv_wren'); await S.fadeIn(10);
  };
  SC.kiko = async (S) => {
    S.facePlayer('kiko');
    const N = 'Attendant Kiko';
    const q = G.save.quests.side_spring;
    if (q && q.step === 'done') { await S.say('Soak as long as you like. The springs will ease every ache.', N); await S.heal(); return; }
    if (!q) S.quest('side_spring', 'go');
    const has = t => G.save.party.some(m => G.SPECIES[m.sp].types.includes(t));
    if (has('fire') && has('water') && has('ice')) {
      await S.say('Fire, Water and Ice Echoes, all resting in the springs together! I\'ve dreamed of this for years. Please, take these Leftovers as thanks.', N);
      await S.give('leftovers'); S.quest('side_spring', 'done'); return;
    }
    await S.say('Welcome to Ember Springs! My dream is to see a Fire, a Water and an Ice Echo resting in the springs together. Bring one of each! Until then, soak for free.', N);
    await S.heal();
  };
  SC.mint_lady = async (S) => {
    S.facePlayer('ch2');
    await S.say('These mints are grown in volcanic soil. A mint changes how an Echo\'s stats grow, just like a new nature. $5,000 each.', 'Mint Grower');
    const stock = ['mint_adamant', 'mint_jolly', 'mint_modest', 'mint_timid', 'mint_bold', 'mint_impish', 'mint_calm', 'mint_careful', 'mint_brave', 'mint_quiet'];
    await new Promise(res => G.push(new G.ShopScene(stock, res)));
  };
  SC.name_rater_cinder = async (S) => {
    S.facePlayer('ch1');
    const N = 'Old Seer Tomas';
    const m = G.party.lead();
    if (m) { const ab = G.ABILITIES[G.mon.ability(m)]; await S.say(`Your ${G.mon.name(m)}... its ability is ${ab.name}. ${m.abil === 2 ? 'A hidden ability! That\'s rare indeed.' : G.SPECIES[m.sp].abil[2] ? 'It has a hidden talent, still sleeping. Echoes found in sparkling grass sometimes have theirs already awake.' : ''}`, N); }
    if (G.flag('badge3') && !G.flag('got_capsule')) { await S.say('Take this Ability Capsule. It switches an Echo between its two regular abilities. I had a feeling you would need it.', N); await S.give('abilitycapsule'); S.set('got_capsule'); }
  };
  SC.brann = async (S) => {
    const N = 'Warden Brann';
    S.facePlayer('brann_npc');
    if (G.flag('badge3')) { await S.say('Duskmere is south, along Route 4! And watch yourself. The Hollow has been sniffing around the Ruins of Echo!', N); return; }
    await S.say('HAH! A challenger! I\'m Brann! Forty years shaping steel, and twenty shaping Tamers!', N);
    await S.say('Heat reveals the flaws in metal, and battle reveals the flaws in a bond! Let\'s see what you\'re made of!', N);
    const won = await G.storyBattle('brann'); if (!won) return;
    await S.say('HAAA! There\'s real fire in you! The Forge Badge is yours!', N);
    await wardenWin(S, { badge: 'forge', flag: 'badge3', name: N, tm: 'tm35', tmText: 'And {tm}! As reliable as a good hammer!', gymTrainers: ['cg_1', 'cg_2', 'cg_3'],
      extra: async () => { await S.say('And take this, my old Wing Whistle! Blow it, and the Sky Taxi will fly you to any town you\'ve visited. Use it from the Map!', N); await S.give('wingwhistle'); } });
    await S.say('Word from Duskmere: the Hollow is heading for the Ruins of Echo, after some kind of key! Take Route 4, south. Hurry!', N);
    S.quest('main4', 'done'); S.quest('main5', 'go');
  };
  // ------------------------------------------------------------- DUSKMERE
  SC.dusk_gym_guard = async (S) => { S.facePlayer('dm_gguard'); await S.say('Warden Mireille hurried to the Ruins of Echo, north-east of town. She said intruders were disturbing the spirits.', 'Gym Apprentice'); };
  SC.grey1 = async (S) => {
    if (G.flag('ruins_done')) return;
    const N = 'Admin Grey';
    G.audio && G.audio.music('encounter_villain');
    S.face('ru_grey', 'down');
    await S.say('...', N);
    await S.say('You are the one Lark keeps complaining about. I am Grey, an Admin of the Hollow.', N);
    await S.say('The Tide Key has already left its cradle. The probability that you change anything here is four percent.', N);
    await S.say('I would like to see the four percent.', N);
    const won = await G.storyBattle('grey1'); if (!won) return;
    await S.say('Interesting. I will revise the model to six percent. The key is already on its way to the Director.', N);
    await S.say('Grey raises a hand. A Nightwing swoops down out of the dark and carries him off into the mist.');
    G.audio && G.audio.sfx('fly');
    S.remove('ru_grey');
    await S.approach('ru_mir', 'mireille', { prefer: ['down', 'left', 'right'] });
    await S.say('The cradle is empty. I came the moment the spirits began to wail. You faced them alone? Brave little flame.', 'Warden Mireille');
    await S.say('The Tide Key opens the sea gate beneath the Lodestar. The old songs say Orrelume sleeps behind it. If Crane has the key...', 'Warden Mireille');
    await S.say('Come to my gym when you are ready. We have much to discuss, once I have seen what burns in you.', 'Warden Mireille');
    await S.fadeOut(10); S.remove('ru_mir'); await S.fadeIn(10);
    S.set('ruins_done'); S.restoreMusic(); S.quest('main5', 'gym');
    G.persist.write();
  };
  G.QUESTS.main5.steps = { go: G.QUESTS.main5.desc, gym: 'Grey escaped with the Tide Key. Challenge Warden Mireille at the Duskmere Gym.' };
  SC.mireille = async (S) => {
    const N = 'Warden Mireille';
    S.facePlayer('mireille_npc');
    if (G.flag('badge4')) { await S.say('Professor Hale is waiting for you on the Duskmere pier. Go, little flame.', N); return; }
    await S.say('Welcome, little flame. It is in darkness that we see what truly matters.', N);
    await S.say('My Echoes are the whispers of those who loved too much to leave. Let us see if your bond can shine through them.', N);
    const won = await G.storyBattle('mireille'); if (!won) return;
    await S.say('The candle flickers... and still it burns. As do you. The Veil Badge is yours.', N);
    await wardenWin(S, { badge: 'veil', flag: 'badge4', name: N, tm: 'tm58', tmText: 'And {tm}. A ghostly burn that weakens the foe\'s physical attacks.', gymTrainers: ['dg_1', 'dg_2', 'dg_3'] });
    await S.say('Professor Hale arrived while we fought. She waits on the pier. She has a story you need to hear, one she has kept for twelve years.', N);
  };
  SC.dusk_hale = async (S) => {
    S.facePlayer('dm_hale');
    if (G.flag('got_surf')) { await S.say('Frostpeak is south, across the lake. I\'ll stay here and go through Vesper\'s old research. It\'s the least I can do.', HALE); return; }
    await S.say(`${P()}. Mireille told me. The Tide Key. Vesper actually did it.`, HALE);
    await S.say('Twelve years ago, Vesper Crane and I worked at the Lodestar together. We wanted to record Orrelume\'s song. The first recording, ever.', HALE);
    await S.say('Her partner was a Luminelle named Lumi. The sweetest Echo you ever met. When the song started, Lumi... sang back.', HALE);
    await S.say('And here\'s the part I\'ve never said out loud. Vesper wanted to stop. Lumi was shaking. And I said, "Thirty more seconds. We\'ll never get this again."', HALE);
    await S.say('The Lodestar flared so bright the whole Mere went white. When it faded, Lumi was gone. No trace. Gone.', HALE);
    const k = await choose('Hale can\'t quite look at you.', ['You couldn\'t have known.', 'Why are you telling me this?', 'Does Vesper blame you?'], HALE);
    await S.say([`That's kind of you. I've had twelve years to decide whether it's true.`, `Because you keep turning up where it matters. You deserve the truth.`, `She's never said so. She's never had to.`][k], HALE);
    await S.say('If Vesper wants the sea gate, she wants to force Orrelume to sing again. Loud enough to reach Lumi, wherever she is. And she won\'t care what it costs anyone else. I taught her that.', HALE);
    await S.say('I can\'t stop her. But you can reach places I can\'t. Take this Tide Board. Face the water and press Z to surf.', HALE);
    await S.give('tideboard');
    await S.say('Head south across the lake to Frostpeak Village. Warden Sigrid is a dear friend. She\'ll look after you.', HALE);
    S.set('got_surf'); S.quest('main5', 'done'); S.quest('main6', 'go');
    G.persist.write();
  };
  SC.lamplighter = async (S) => {
    S.facePlayer('dm_ode');
    const N = 'Lamplighter Ode';
    const lit = [1, 2, 3, 4].filter(i => G.flag('lantern' + i)).length;
    const q = G.save.quests.side_lanterns;
    if (q && q.step === 'done') { await S.say('The spirits rest easy now. You have a lamplighter\'s heart.', N); return; }
    if (lit >= 4) {
      await S.say('All four spirit lanterns are burning! Can you hear that? The spirits are singing.', N);
      await S.say('Take these. A Spell Tag for your ghostly friends, and a Dusk Stone. Some Echoes evolve under its dark light.', N);
      await S.give('spelltag'); await S.give('duskstone'); S.quest('side_lanterns', 'done'); return;
    }
    if (!q) S.quest('side_lanterns', 'go');
    await S.say(`Four spirit lanterns stand around Duskmere. They only catch after dark, 7 PM to 5 AM, or the spirits can't see them. ${lit} of 4 lit.`, N);
  };
  SC.spirit_lantern = async (S, ctx) => {
    const n = ctx.ent.lantern;
    if (G.flag('lantern' + n)) { await S.say('The spirit lantern glows with a soft blue flame.'); return; }
    if (!G.save.quests.side_lanterns) { await S.say('An old stone lantern. Its wick is cold. Someone in town probably knows about it.'); return; }
    if (!G.clock.isNight()) { await S.say('The wick won\'t catch in daylight. The spirits only come out at night. (7 PM - 5 AM)'); return; }
    G.setFlag('lantern' + n); G.audio && G.audio.sfx('ability');
    await S.say('You light the spirit lantern. A faint voice whispers: "...thank you..."');
    if ([1, 2, 3, 4].every(i => G.flag('lantern' + i))) {
      await S.say('The last lantern flares! A Wispurr drifts out of the light to see who did that!');
      await G.startWild(null, { species: 'wispurr', lvl: 30, noRandom: true, hidden: true });
    }
  };
  SC.prorod_guy = async (S) => {
    S.facePlayer('dm_rodguy');
    await S.say('Deep lake, big fish. With a Pro Rod you can hook Mireel, Riptalon, even Crustank.', 'Fisher Lou');
    if (!G.flag('lou_gift')) { await S.say('Here, take some Net Orbs. They work especially well on Water and Bug types.', 'Fisher Lou'); await S.give('netorb', 5); S.set('lou_gift'); }
  };
  SC.fortune_teller = async (S) => {
    S.facePlayer('dh1');
    const m = G.party.lead(); if (!m) return;
    const best = G.STATS.reduce((a, s) => m.ivs[s] > m.ivs[a] ? s : a, 'hp');
    await S.say(`I see... ${G.mon.name(m)}'s greatest gift is its ${G.STAT_NAMES[best]}. ${G.pick(['A rare, shining Echo will cross your path when you least expect it.', 'Sparkling grass holds Echoes with awakened talents.', 'The Lodestar will shine again, and you will have a hand in it.', 'Your friend\'s heart is heavier than their smile suggests.'])}`, 'Fortune Teller');
  };
  // ------------------------------------------------------------- ROUTE 5
  SC.glowing_scale = async (S) => {
    S.facePlayer('r5_scale');
    if (G.save.quests.side_scale) { await S.say('Did Elder Vesna know what the scale is? I\'ve been wondering ever since.', 'Island Girl'); return; }
    await S.say('This washed up on my island. It glows, and it hums, as if it\'s singing. Could you take it to Elder Vesna in Frostpeak? She knows all the old stories.', 'Island Girl');
    await S.give('oldamber'); S.quest('side_scale', 'go');
  };
  SC.rival3 = async (S) => {
    await S.approach('r5w', 'wren_crane', { prefer: ['down', 'left', 'right'] });
    await S.emote('r5w', '...', 40);
    await S.say('Took you long enough.', WREN());
    await S.say('I\'m ranked fourth of all the Fellows now. The Director fitted my band with a new Amplifier. It forces Resonance, every moment of every battle. No waiting for a bond to grow. No waiting at all.', WREN());
    await S.say(`I'm going to be Champion, ${P()}, and Sable will have to look at me. Starting with you.`, WREN());
    const won = await G.storyBattle('rival3');
    S.set('rival3_done');
    const st = G.lineAt(G.rivalOf[G.getVar('starter', 'kindlet')], 36);
    await S.say(`${R()}'s ${G.SPECIES[st].name} is trembling. It lets out a thin, tired cry. It sounds like it's been crying for a while.`);
    await S.say('Hey. Hey, what\'s wrong? You\'re shaking. Is it the Amplifier? Did the Amplifier do this? ...How long has it been like this?', WREN());
    const k = await choose(`${R()} is staring at their partner.`, ['Take the band off. Right now.', 'It\'s not too late to stop.', 'It\'s been like this since Cindervale.'], WREN());
    await S.say([`...Yeah. Yeah. I... I need to think. Don't follow me. Please.`, `I hope you're right. I... I need to think. Don't follow me.`, `You saw it? You saw it, and I didn't? ...I need to think. Don't follow me.`][k], WREN());
    await S.fadeOut(10); S.remove('r5w'); await S.fadeIn(10);
  };
  // ------------------------------------------------------------- FROSTPEAK
  SC.starfall_guard = async (S) => {
    await S.say('I\'m sorry, but Starfall Peak is far too dangerous. Only the Champion of Solmere may climb it.', 'Mountain Ranger');
    await pushBack(S, 'left');
  };
  SC.grip_boots = async (S) => {
    S.facePlayer('fp_boots');
    const N = 'Old Halvard';
    if (G.bag.has('gripboots')) { await S.say('Mt. Glacia Pass is to the east. Push the boulders into the holes to make a way across.', N); return; }
    if (!G.flag('badge5')) { await S.say('My daughter Sigrid runs the gym. Beat her, and I\'ll give you what you need to cross the pass.', N); return; }
    await S.say('Sigrid says you\'re the real thing. These Grip Boots carried me over Mt. Glacia a hundred times. Walk into a boulder to push it.', N);
    await S.give('gripboots'); S.set('got_boots');
  };
  SC.elder_vesna = async (S) => {
    S.facePlayer('vesna');
    const N = 'Elder Vesna';
    if (G.bag.has('oldamber')) {
      await S.say('That scale... child, that is a scale of Orrelume itself. It hasn\'t shed one in a hundred years.', N);
      await S.say('The old song says Solmere has two great lights. The song of the sea, and the hunger of the stars. The sea sings bonds together. The stars... remember whatever falls.', N);
      await S.say('If Orrelume is shedding, it is afraid. Keep the scale close. You may need its song. And take this Frost Stone. I have kept it a long time, waiting for the right person.', N);
      await S.give('froststone'); S.quest('side_scale', 'done'); S.set('scale_read'); return;
    }
    await S.say('Frostpeak remembers the old songs: the sea, the stars, and the lighthouse that stands between them.', N);
  };
  SC.sigrid = async (S) => {
    const N = 'Warden Sigrid';
    S.facePlayer('sigrid_npc');
    if (G.flag('badge5')) { await S.say(`Mt. Glacia Pass is east of the village, and Skyreach City lies beyond it. ${R()} came through here, too... looking lost. Not the kind of lost a map can fix.`, N); return; }
    await S.say('Welcome to the summit! I\'m Sigrid, Warden of Frostpeak. I\'ve climbed every peak in Solmere, and I\'ve never once turned back!', N);
    await S.say('Balance, speed, and nerves of ice! Let\'s see you keep your footing!', N);
    const won = await G.storyBattle('sigrid'); if (!won) return;
    await S.say('Incredible! Like the first clear morning after a blizzard! The Rime Badge is yours!', N);
    await wardenWin(S, { badge: 'rime', flag: 'badge5', name: N, tm: 'tm14', tmText: 'And {tm}! In the snow, it never misses.', gymTrainers: ['ig_1', 'ig_2'] });
    await S.say(`My father, Halvard, will want to meet you. He's by the frozen pond. And ${R()}... they headed for Skyreach. They wouldn't say a word to anyone. That worried me more than anything.`, N);
    S.quest('main6', 'done'); S.quest('main7', 'go');
  };
  // ------------------------------------------------------------- SKYREACH
  SC.sky_gym_guard = async (S) => { S.facePlayer('sk_gguard'); await S.say('Warden Kaelen went into the Crane tower this morning to have a word with the Director, and never came out. The gym is closed until he returns.', 'Dragon Tamer'); };
  SC.sky_sailor = async (S) => { S.facePlayer('sk_sailor'); await S.say(G.flag('badge6') ? 'The Lodestar is straight north across the water. Surf safely.' : 'The sea route north leads to the Lodestar. It went dark last night, for the first time in my whole life. It felt like the sky had blinked.', 'Sailor'); };
  SC.hq_wren = async (S) => {
    if (G.flag('hq_started')) return;
    S.faceEach('sk_wren', 'player');
    await S.say(`${P()}. Wait. Please.`, WREN());
    await S.say('I was wrong. About Crane, about the Fellowship, about my rank. All of it. The Amplifier was hurting my partner, and all I cared about was climbing higher.', WREN());
    await S.say('I threw the band into the lake. I\'m not a Fellow any more. It feels strange... like I can finally breathe.', WREN());
    await S.say('I overheard them. Warden Kaelen is locked up on the Director\'s floor. And Crane is moving the Chorus Engine\'s core to the Lodestar. Tonight.', WREN());
    await S.say('I took a keycard on my way out. The lobby elevator needs it. We stop her. Together, like we always used to do everything.', WREN());
    await S.give('cranekeycard');
    S.set('hq_started'); S.set('hq_card'); S.quest('main7', 'hq');
    await S.say('I\'ll meet you upstairs. And... thank you for not saying "I told you so."', WREN());
    await S.move('sk_wren', 'u', 2); S.remove('sk_wren');
  };
  G.QUESTS.main7.steps = { go: G.QUESTS.main7.desc, hq: 'Infiltrate Crane Dynamics HQ with Wren and free Warden Kaelen.', gym: 'Crane fled. Challenge Warden Kaelen at the Skyreach Gym.' };
  SC.hq1_enter = async (S) => { if (G.flag('hq_started') && !G.flag('hq_done')) G.toast('The elevator at the back leads to the Director\'s floor.'); };
  SC.hq_elevator_guard = async (S) => { S.facePlayer('hq_lift'); await S.say('No keycard, no elevator! Director\'s orders!', 'Hollow Grunt'); };
  SC.hq_recep = async (S) => { S.facePlayer('hq_recep'); await S.say(G.flag('hq_done') ? 'Everyone here is being questioned. I only worked the front desk. I never knew what they were doing upstairs.' : 'W-welcome to Crane Dynamics! Please, I only work the front desk!', 'Receptionist'); };
  SC.hq_admins = async (S) => {
    if (G.flag('hq_admins_done')) return;
    G.audio && G.audio.music('encounter_villain');
    await S.say('You again?! Don\'t you ever give up?', 'Admin Lark');
    await S.say('And the Fellow who left us. Ranked fourth, and threw it all away. I did not predict that.', 'Admin Grey');
    await S.approach('hqw', 'wren', { prefer: ['down', 'left', 'right'] });
    await S.say(`Two on two. Ready, ${P()}? Let's show them what a real bond looks like!`, WREN());
    const won = await G.storyBattle('grey2', { withTrainer: 'lark2', ally: 'wren_ally', double: true }); if (!won) { S.remove('hqw'); return; }
    await S.say('...Go. The Director is waiting. I estimate a twelve percent chance that you change her mind. I find that I am hoping for the twelve.', 'Admin Grey');
    await S.say('Tch. Go on, then. Before I change my mind.', 'Admin Lark');
    S.remove('hq_grey'); S.remove('hq_lark');
    S.set('hq_admins_done');
    await S.say('I\'ll get Kaelen out. You go after Crane. Hurry!', WREN());
    await S.fadeOut(8); S.remove('hqw'); S.spawn({ id: 'hqw', x: 3, y: 3, look: 'wren', dir: 'left' }); await S.fadeIn(8);
    S.restoreMusic();
  };
  SC.hq_crane = async (S) => {
    if (!G.flag('hq_admins_done')) { await S.say('"Grey. Lark. Please see our young guest out."', 'Director Crane'); return; }
    const N = 'Director Crane';
    S.facePlayer('hq_crane');
    S.music('crane');
    await S.say('So this is the Tamer who keeps unravelling my plans. You look so young.', N);
    await S.say('Have you ever heard the voice of the one you love most... and then nothing? Twelve years of nothing.', N);
    await S.say('Every Chorus band in Solmere draws a little of its bond into my Engine. The Fellows never asked where their strength was going.', N);
    await S.say('When I fire it, Orrelume will sing louder than it ever has. Loud enough to reach Lumi. Every bond in Solmere, borrowed for a single moment. A small price for a miracle.', N);
    const k = await choose('Crane waits, curious what you will say.', ['You\'re hurting everyone to ease your own pain.', 'Those bonds aren\'t yours to take.', 'Hale told me what happened.'], N);
    await S.say([`Yes. I've weighed it, and I've made my peace with it.`, `Nothing is ever given. Everything is taken by someone. I've simply chosen what to take.`, `...Did she? Then Marisol has finally told someone the truth. It changes nothing.`][k], N);
    const won = await G.storyBattle('crane1'); if (!won) return;
    await S.say('...So your bond is real. Real enough to hurt me. Real enough to...', N);
    await S.say('No. It doesn\'t matter. The core is already on its way to the Lodestar. Goodbye, child.', N);
    G.audio && G.audio.sfx('warp'); await G.flashScreen('#ffffff', 20);
    S.remove('hq_crane');
    await S.say('Crane vanishes in a flash of white light. A teleporter pad hums softly where she stood.');
    await SC.hq_kaelen(S);
  };
  SC.hq_kaelen = async (S) => {
    if (!G.flag('hq_admins_done') || G.flag('hq_done')) { if (!G.flag('hq_admins_done')) await S.say('A tall man in a violet coat sits calmly in a glass cell, reading. He nods at you like you\'re late.'); return; }
    S.remove('hq_kaelen'); await S.approach('hq_kaelen', 'kaelen');
    await S.say('Thank you, both of you. Crane\'s people took me while I was looking into her shipments.', 'Warden Kaelen');
    await S.say('The Lodestar is north across the water. But first, my gym. The dragons will want to measure you before you face her again.', 'Warden Kaelen');
    await S.say(`I'll help the police secure the tower. ${P()}... thank you for not giving up on me, even when I gave you every reason to.`, WREN());
    S.set('hq_done'); S.quest('main7', 'gym');
    G.persist.write();
    await S.fadeOut(20); S.remove('hq_kaelen'); S.remove('hqw'); await S.fadeIn(20);
  };
  SC.kaelen = async (S) => {
    const N = 'Warden Kaelen';
    S.facePlayer('kaelen_npc');
    if (G.flag('badge6')) { await S.say('North of the city, the sea route leads to the Lodestar. Go, and save the song.', N); return; }
    await S.say('I was Champion once, before Sable. It taught me that strength without a reason is only noise.', N);
    await S.say('Now. Let\'s see if you can weather my storm.', N);
    const won = await G.storyBattle('kaelen'); if (!won) return;
    await S.say('The storm has passed. The dragons respect you, and so do I. The Wyrm Badge is yours.', N);
    await wardenWin(S, { badge: 'wyrm', flag: 'badge6', name: N, tm: 'tm50', tmText: 'And {tm}. A dragon\'s roar, given shape.', gymTrainers: ['sg_1', 'sg_2', 'sg_3'] });
    await S.say('Six badges. The Conclave will call for you soon. But first, the Lodestar. Surf north from the harbour.', N);
    S.quest('main7', 'done'); S.quest('main8', 'go');
  };
  SC.iv_judge = async (S) => {
    S.facePlayer('skh1');
    const m = G.party.lead(); if (!m) return;
    const tot = G.STATS.reduce((a, s) => a + m.ivs[s], 0);
    await S.say(`${G.mon.name(m)}'s total potential: ${tot}/186. ${tot >= 170 ? 'Outstanding! A gem among gems.' : tot >= 130 ? 'Very good potential indeed.' : tot >= 90 ? 'Above average. A fine Echo.' : 'Decent potential. And a strong bond matters more than any number.'}`, 'IV Judge');
    if (G.flag('champion') && !G.flag('got_caps')) { await S.say('For the Champion, these Bottle Caps. Each one raises one of an Echo\'s hidden potentials to its peak.', 'IV Judge'); await S.give('bottlecap', 3); S.set('got_caps'); }
  };
  SC.hidden_power_guy = async (S) => {
    S.facePlayer('skh2');
    if (!G.flag('got_tm20')) { await S.say('In my day, we made decoys out of straw to fool our opponents. This Skill Disc works far better. Decoy!', 'Old Strategist'); await S.give('tm20'); S.set('got_tm20'); return; }
    await S.say('A Decoy blocks status moves and takes hits in your Echo\'s place. Pair it with a move that raises your stats.', 'Old Strategist');
  };
  // ------------------------------------------------------------- THE LODESTAR
  SC.tl_grunt = async (S, ctx) => {
    S.facePlayer(ctx.ent.id);
    await S.say(G.pick(['The Director is at the top. We\'re supposed to stop you... but I\'m not sure any more that we should.', 'Can you hear it? The song is getting quieter. That isn\'t what they told us would happen.', 'I used to feel my Echo\'s heart through the band. Now I can\'t feel anything at all.']), 'Hollow Grunt');
  };
  SC.lh_grey = async (S) => {
    const N = 'Admin Grey';
    S.facePlayer('lh_grey');
    await S.say('I ran the numbers again. And again. Every model says the same thing: when the Engine fires, every bond in Solmere breaks. Including hers.', N);
    await S.say('But I have followed her for twelve years. I won\'t step aside for a calculation. Only for a result.', N);
    const won = await G.storyBattle('grey3'); if (!won) return;
    await S.say('Calculations complete. We were wrong. I was wrong. Loyalty was never in the model. The stairs are yours. Ninety-one percent. Go.', N);
    await S.move('lh_grey', 'l', 1); S.face('lh_grey', 'right');
    S.set('lh_grey_done');
  };
  SC.lh_lark = async (S) => {
    const N = 'Admin Lark';
    S.facePlayer('lh_lark');
    await S.say('You know the worst part? I liked it here. The Hollow was the first place that ever chose me. First. Not last.', N);
    await S.say('So I\'m not letting you through without a fight. That\'s just who I am.', N);
    const won = await G.storyBattle('lark3'); if (!won) return;
    await S.say('...Go. Stop her. Somebody has to, and it was never going to be me. ...And, hero? Thanks.', N);
    await S.move('lh_lark', 'r', 1); S.face('lh_lark', 'left');
    S.set('lh_lark_done');
  };
  SC.top_crane = async (S) => {
    if (G.flag('tidelight_done')) return;
    const N = 'Director Crane';
    S.music('crane');
    S.shake(20);
    await S.say('The summit trembles. A vast, sorrowful song rises from under the sea, bending and cracking as the machine hums.');
    S.face('top_crane', 'down');
    await S.say('You\'re too late. Listen. It\'s changing. Soon it will call out to everything that has ever lived, and loved, in Solmere.', N);
    await S.say('Lumi. I\'m almost there. I can almost hear you.', N);
    await S.say(`It's hurting them! Every Echo on the Mere is crying out! Can't you hear it, Director?`, P());
    await S.say('I hear one voice. I have for twelve years. Step aside, or go quiet with the rest.', N);
    const won = await G.storyBattle('crane2'); if (!won) return;
    await S.say('Lumi... I\'m sorry. I couldn\'t even do this right.', N);
    G.audio && G.audio.sfx('thunder'); S.shake(40);
    await G.flashScreen('#ffffff', 30);
    await S.say('The Chorus Engine sparks, groans, and with a crack like the sky splitting, tears itself apart!');
    G.audio && G.audio.stopMusic();
    await S.wait(40);
    S.shake(60); G.audio && G.audio.cry('orrelume');
    await G.flashScreen('#bfffff', 40);
    await S.say('Out of the Mere rises something vast, glowing like the dawn. The song pours out, clear and whole again.');
    await S.say('...Vesper...', '???');
    await S.say('...That voice... Lumi?! LUMI!', N);
    await S.say('...It\'s all right... I\'m part of the song now... I always was... Let go, Vesper... and live...', '???');
    await S.say('Vesper Crane sinks to her knees and weeps. For the first time, she looks her age. And somehow, lighter.', '');
    S.music('legend');
    await S.say('The leviathan turns its luminous eyes on you. It wants to test the bond that set it free!');
    const r = await G.startWild(null, { species: 'orrelume', lvl: 50, legend: true, noRandom: true, noRun: false });
    if (G.party.allMons().some(m => m.sp === 'orrelume')) S.set('orrelume_caught');
    else { S.set('orrelume_away'); await S.say('Orrelume dives beneath the waves with a long, echoing call, as if promising to return.'); }
    await S.fadeOut(30);
    S.remove('top_crane');
    const hale = S.spawn({ id: 'toph', x: 5, y: 8, look: 'hale', dir: 'up' });
    const wr = S.spawn({ id: 'topw', x: 7, y: 8, look: 'wren', dir: 'up' });
    const sb = S.spawn({ id: 'tops', x: 6, y: 5, look: 'sable', dir: 'down' });
    await S.fadeIn(30);
    S.music('tidelight_calm');
    await S.say(`${P()}! You did it! Vesper has turned herself in. She said she heard Lumi, that the song carried her voice.`, HALE);
    await S.say('I told her the truth about that day, to her face. She said, "I know, Marisol. I was there." And then she embraced me.', HALE);
    await S.say(`${P()}, that was incredible! I... oh. Um. Hello, Sable.`, WREN());
    await S.say(`So you're the one ${R()} is always talking about.`, 'Champion Sable');
    await S.say('I\'m Sable, the Champion. I came as fast as I could when the light went out. It seems you didn\'t need me.', 'Champion Sable');
    await S.say('The Lodestar shines again. The Conclave has opened Victory Road, west of Route 1. I\'ll be waiting at the top.', 'Champion Sable');
    await S.say(`And ${R()}... I'm proud of you. I should have told you long before you went looking for it somewhere else.`, 'Champion Sable');
    await S.fadeOut(20); S.remove('toph'); S.remove('topw'); S.remove('tops');
    S.set('tidelight_done'); S.quest('main8', 'done'); S.quest('main9', 'go');
    G.persist.write();
    await S.fadeIn(20);
    await S.say('The Lodestar\'s beam sweeps across the Mere once more.\\p{k}(Victory Road is open. Use the Wing Whistle to fly back to Fernwick, then head to Route 1.){w}');
  };
  SC.tl_hale = async (S) => {
    S.facePlayer('tl_hale');
    await S.say('I\'m going to study the Lodestar properly now. No machines, no deadlines. Just listening. Come here, let me heal your team.', HALE);
    await S.heal();
  };
  // ------------------------------------------------------------- VICTORY ROAD
  SC.rival4 = async (S) => {
    await S.approach('vrw', 'wren', { prefer: ['up', 'down', 'left', 'right'] });
    await S.emote('vrw', '!');
    await S.say(`${P()}. I knew you'd make it.`, WREN());
    await S.say('I\'ve been thinking about what strength really is. The Amplifier made my team strong, and it made them hurt, and I didn\'t care as long as I kept climbing.', WREN());
    await S.say('That wasn\'t strength. That was me being afraid of being left behind. By Sable. By you.', WREN());
    await S.say('No band. No rank. Just me and my team. One last battle before the Conclave. A real one.', WREN());
    const won = await G.storyBattle('rival4'); if (!won) { S.remove('vrw'); return; }
    S.set('rival4_done');
    await S.say(`Ha... hahaha! The best battle of my life, and nobody saw it but us. That's just right. Go on, Sable's waiting. And ${P()}... thank you. For everything.`, WREN());
    await S.fadeOut(10); S.remove('vrw'); await S.fadeIn(10);
  };
  // ------------------------------------------------------------- CONCLAVE
  SC.league_shop = async (S) => { S.facePlayer('cl_shop'); await G.openShop(['ultraorb', 'hyperpotion', 'maxpotion', 'fullrestore', 'revive', 'maxrevive', 'fullheal', 'maxether', 'elixir', 'xattack', 'xspatk', 'xspeed', 'maxrepel'], { greet: 'The last shop before the Conclave. Stock up well.' }); };
  SC.league_guard = async (S) => {
    S.facePlayer('cl_guard');
    const N = 'Conclave Guard';
    if (G.save.badges.length < 6) { await S.say('Only Tamers with six badges may enter the Conclave.', N); return; }
    await S.say('Beyond this door wait the four members of the Conclave, and then the Champion. Once you enter, there is no turning back until it\'s decided.', N);
    if (!await G.yesno('Enter the Conclave?', { speaker: N })) return;
    S.set('league_entered');
    await S.move('cl_guard', 'l', 1); S.face('cl_guard', 'right');
    await S.walkTo('player', 6, 1); await S.move('player', 'u');
  };
  SC.elite_room_enter = async (S) => { G.toast('Save before battling? Open the menu with X.'); };
  SC.elite_battle = async (S, ctx) => {
    const e = ctx.ent, id = G.flag('champion') ? G.eliteRematch(e.elite) : e.elite, T = G.TRAINERS[id];
    if (G.flag(e.flag)) { await S.say('Go on. The next chamber is waiting.', T.name); return; }
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
    await S.say(`So. You came.`, N);
    await S.say(`${R()} has talked about you since the day you both got your first Echoes. How you always made them want to be better. How you never gave up on them.`, N);
    await S.say('I\'ve heard every one of your adventures twice: once from the town criers, and once from my little sibling, late into the night.', N);
    await S.say('All of Solmere is waiting to hear how this ends. I stopped caring about that years ago. But let\'s give them something worth hearing.', N);
    const won = await G.storyBattle('sable'); if (!won) return;
    await S.say('...So that\'s what it feels like. You know, it\'s not so bad.', N);
    await S.say(`From this moment, you are the Champion of Solmere, ${P()}. Come. The Hall of Fame awaits.`, N);
    S.set('champion'); S.set('champion_scene_done');
    await S.move('sable_npc', 'l', 1); S.face('sable_npc', 'right');
    S.quest('main9', 'done');
  };
  SC.hall_of_fame = async (S) => {
    if (G.flag('hof_done') && !G.flag('hof_pending')) { return; }
    G.audio && G.audio.music('halloffame');
    await S.say('Sable leads you into a golden hall. Here, your partners\' names will be remembered forever.', '');
    const party = G.save.party.slice();
    const sc = { opaque: true, t: 0, i: 0, parts: new G.Particles(),
      update() { this.t++; this.parts.update(); if (this.t % 3 === 0) this.parts.add({ x: G.rand() * G.W, y: -4, vy: .6 + G.rand(), vx: (G.rand() - .5) * .3, life: 300, size: 1.5, color: G.pick(['#ffe070', '#ffffff', '#ffd0a0']), type: 'star', blend: 'lighter' }); },
      draw(b) { const g = b.createLinearGradient(0, 0, 0, G.H); g.addColorStop(0, '#3a2a10'); g.addColorStop(1, '#1a1008'); b.fillStyle = g; b.fillRect(0, 0, G.W, G.H); this.parts.draw(b); const m = party[this.i]; if (m) { b.drawImage(G.monArt.front(m.sp, m.shiny, Math.floor(this.t / 12) % 4), G.W / 2 - 48, 30); } },
      drawUI() { const U = G.ui, m = party[this.i]; if (!m) return; U.text(G.mon.name(m), G.W / 2, 132, { size: 12, weight: 900, color: '#ffe8a0', align: 'center', outline: 'rgba(0,0,0,.5)' }); U.text(`${G.SPECIES[m.sp].name} · Lv ${m.lvl} · OT ${m.ot || G.save.name}`, G.W / 2, 150, { size: 7, color: '#f4e0c0', align: 'center' }); U.text(`${this.i + 1} / ${party.length}`, G.W / 2, 162, { size: 6, color: '#c8a870', align: 'center' }); },
    };
    G.push(sc);
    for (let i = 0; i < party.length; i++) { sc.i = i; G.audio && G.audio.cry(party[i].sp); await G.wait(110); }
    await G.say(`Congratulations, ${P()}! You and your partners are the Champions of Solmere!\\pPlaytime: ${G.fmtTime(G.save.playtime)}. Echodex: ${G.dexCount().caught} caught.`);
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
    await S.say('Home. Your bed has never felt so soft. Mom has left a note on the pillow: "So proud of you. There\'s soup on the stove."\\p...\\pBut Professor Hale has sent word, and there are strange rumours about the stars over Starfall Peak...');
    S.quest('post1', 'start');
    G.toast('Game saved. Post-game unlocked: Battle Spire (Skyreach), Starfall Peak (west of Frostpeak), rematches!', { life: 400 });
  };
  // ------------------------------------------------------------- POST-GAME
  SC.wanderer = async (S) => {
    S.facePlayer('sf_wanderer');
    await S.say('A silent figure stands at the summit, gazing at the stars. A red scarf ripples in the wind. They don\'t turn around. They know you\'re there.');
    await S.say('...', '???');
    G.audio && G.audio.music('encounter_boss');
    await S.say('...!', '???');
    const won = await G.storyBattle('wanderer'); if (!won) return;
    await S.say('The Wanderer smiles, tips their cap, and presses something into your hand. When you look up, the summit is empty.');
    await S.give('crownorb');
    S.set('wanderer_done'); S.remove('sf_wanderer'); S.restoreMusic();
  };
  SC.nyxalis_encounter = async (S) => {
    await S.say('The stars over the crater flicker, and go out, one by one. Something made of night uncoils where the comet fell.');
    G.audio && G.audio.cry('nyxalis'); S.shake(30);
    await S.say('It opens its eyes. The whole sky holds its breath.');
    await G.startWild(null, { species: 'nyxalis', lvl: 65, legend: true, noRandom: true });
    S.set('nyxalis_done'); S.remove('sf_nyx');
    await S.say('The stars bloom back over Starfall Peak, brighter than before.');
    S.quest('post1', 'done');
  };
  SC.orrelume_return = async (S) => {
    await S.say('A soft song drifts up from the water. Orrelume has returned. It seems to have been waiting for you.');
    await G.startWild(null, { species: 'orrelume', lvl: 55, legend: true, noRandom: true });
    if (G.party.allMons().some(m => m.sp === 'orrelume')) { S.set('orrelume_caught'); S.remove('tl_orre'); }
  };
  // ------------------------------------------------------------- BATTLE SPIRE
  SC.spire_recep = async (S) => {
    S.facePlayer('spire_recep');
    const N = 'Spire Host';
    if (!G.flag('champion')) { await S.say('The Battle Spire is open only to Champions. Come back once you have conquered the Conclave.', N); return; }
    const sp = G.save.spire; sp.bp = sp.bp || 0;
    await S.say(`Welcome to the Battle Spire! Seven battles in a row, three Echoes each, all at Level 50. Streak: ${sp.streak}. Best: ${sp.best}. BP: ${sp.bp}.`, N);
    if (G.save.party.filter(m => !m.egg).length < 3) { await S.say('Battles here are three against three. Please come back with at least three Echoes.', N); return; }
    if (!await G.yesno('Take on the challenge?', { speaker: N })) return;
    await S.say('Choose three Echoes. They battle at Level 50 and heal fully between rounds.', N);
    const picks = [];
    while (picks.length < 3) {
      const i = await G.openParty({ mode: 'select', prompt: `Choose Echo ${picks.length + 1} of 3.`, filter: m => !picks.includes(m) && !m.egg, label: m => picks.includes(m) ? 'CHOSEN' : '' });
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
      if (!r || r.outcome !== 'win') { sp.streak = 0; await S.say('Your streak has ended. Well fought! We hope to see you again.', N); G.persist.write(); return; }
      sp.streak++; sp.best = Math.max(sp.best, sp.streak); sp.bp += boss ? 10 : 1 + Math.floor(sp.streak / 7);
      if (n < 6 && !await G.yesno(`Victory! Streak: ${sp.streak}. Continue to battle ${n + 2}?`, { speaker: N })) { G.persist.write(); return; }
    }
    await S.say(`You conquered the Spire! Streak: ${sp.streak}. BP: ${sp.bp}. You can spend your BP at the counter on the right.`, N);
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
      if (sp.bp < c) { await S.say('You don\'t have enough BP for that.', 'Exchange'); continue; }
      sp.bp -= c; G.bag.add(id); G.audio && G.audio.sfx('money'); G.toast('Got ' + G.ITEMS[id].name);
    }
  };
  // ------------------------------------------------------------- HAVENS & MARTS
  SC.nurse = async (S) => {
    const e = S.npc('nurse'); if (e) e.dir = 'down';
    const hc = G.save.settings.nuzlocke && G.save.settings.nuzRules.hardcore;
    await S.say(`Welcome to the Tamer Haven! Shall I restore your Echoes to full health?`, 'Nurse');
    const k = await G.ask('Heal your party?', ['Yes please', 'No thanks'], { speaker: 'Nurse' });
    if (k !== 0) { await S.say('All right. Take care out there!', 'Nurse'); return; }
    await S.say('Just a moment, please.', 'Nurse');
    if (e) e.dir = 'left';
    await S.heal();
    if (e) e.dir = 'down';
    if (G.save.settings.nuzlocke && G.save.graveyard.length) await S.say('Your team is rested. And... I lit a candle for the ones who didn\'t make it. I always do.', 'Nurse');
    await S.say(G.pick(['Your Echoes are fully healed. We hope to see you again!', 'All done! Your team is rested and ready.', 'Your Echoes are back to full strength. Take care out there!']), 'Nurse');
    const w = S.w; if (w.map.def.isHaven && G.save.returnTo) G.save.lastHeal = { map: w.map.id, x: 7, y: 6, back: { ...G.save.returnTo } };
  };
  SC.haven_board = async (S) => {
    const main = Object.keys(G.QUESTS).find(id => G.QUESTS[id].main && G.save.quests[id] && G.save.quests[id].step !== 'done');
    const Q = main ? G.QUESTS[main] : null;
    const st = Q ? ((Q.steps && Q.steps[G.save.quests[main].step]) || Q.desc) : 'No urgent news. A fine day for exploring!';
    await S.say(`{c}TAMER BOARD{w} — Current goal:\\n${st}`, 'Haven Aide');
    const side = Object.keys(G.QUESTS).filter(id => !G.QUESTS[id].main && G.save.quests[id] && G.save.quests[id].step !== 'done');
    if (side.length) await S.say(`Open side quests: ${side.map(id => G.QUESTS[id].name).join(', ')}. Your Journal has the details.`, 'Haven Aide');
  };
  SC.haven_tips = async (S) => {
    S.facePlayer('hv1');
    await S.say(G.pick([
      'The PC in every Haven connects to your storage boxes, where Echoes beyond your party of six are kept.',
      'Held items like Leftovers or a Sun Berry can turn a losing battle around.',
      'Stat changes wear off when an Echo switches out. Status conditions like burns and poison stay until healed.',
      'Critical hits ignore the target\'s raised defences, and your own lowered Attack.',
      'Weather changes everything: rain powers Water moves, sun powers Fire moves, and snow toughens Ice types.',
      'Sparkling tall grass hides rare Echoes with exceptional potential.',
      'Walk into a much weaker wild Echo of a kind you already own, and you\'ll Sweep past it without a battle. Chain sweeps for bonus EXP.',
      'Your partner walking behind you has moods of its own. Face it and press Z to see how it\'s feeling.',
      'Tab toggles Turbo, which speeds everything up.',
      'Press Q in battle to see every stat change and field effect.',
    ]), 'Old Tamer');
  };
  SC.haven_chat = async (S) => {
    S.facePlayer('hv2');
    const b = G.save.badges.length;
    await S.say(G.pick(b < 2 ? ['I want to be a Warden someday!', 'My Pipwing evolved yesterday! It\'s so much bigger now.'] : b < 4 ? ['My cousin joined the Crane Fellowship. He\'s become so strong... but he never comes home any more.', 'The crystals in Glimmer Cave sing when the wind blows through them.'] : ['The Lodestar\'s beam looked weaker last night. That can\'t be good.', 'They say Champion Sable has never lost a battle in Solmere.']), 'Tamer');
  };
  SC.mart_clerk = async (S) => { S.facePlayer('clerk'); await G.openShop(G.martStock()); };
  SC.mart_chat = async (S) => { S.facePlayer('mt1'); await S.say(G.pick(['Buy ten Orbs at once, and they\'ll add a free Heal Orb!', 'Repels are a must for long caves.', 'The shops stock better goods as you earn more badges.']), 'Shopper'); };
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
    await G.openShop(stock, { greet: 'Local specialties! Things you won\'t find anywhere else.', speaker: 'Clerk' });
  };
  SC.sky_special = async (S) => {
    S.facePlayer('clerk2');
    await G.openShop(['lifegem', 'powerband', 'focuslens', 'swiftscarf', 'leftovers', 'guardvest', 'spikedhelm', 'expertbelt', 'scopelens', 'widelens', 'gritsash', 'linkcord', 'abilitycapsule', 'leafstone', 'tidestone', 'voltstone', 'tm26', 'tm24', 'tm13', 'tm04', 'tm01'], { greet: 'Welcome to Skyreach Supply, home of the finest held items in Solmere.', speaker: 'Clerk' });
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
    if (!G.TRAINERS[rid]) G.TRAINERS[rid] = { ...T, party: T.party.map(p => ({ ...p, lvl: p.lvl + 16 })), intro: 'Welcome back, Champion. I\'ve been training since our last battle. Let\'s begin.', defeat: T.defeat };
    return rid;
  };
  SC.champion_rematch = async (S) => {
    S.facePlayer('sable_npc2');
    if (!await G.yesno('Back for another battle, Champion? Good. I\'ve been training too.', { speaker: 'Sable' })) return;
    const won = await G.storyBattle('sable_rematch');
    if (won) await S.say('You keep getting stronger. Solmere is lucky to have you.', 'Sable');
  };
  G.vibe = vibe;
})();
