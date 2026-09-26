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
    await say(`Oh! You're awake. You're awake, right? Blink twice. Great. Hi!`);
    await say(`I'm Marisol Hale. Professor Hale. I study Resonance: the actual, measurable song between people and Echoes.\\pI have the graphs. Mostly!`);
    G.audio && G.audio.cry('glimmer');
    await G.tween(bd.show, { mon: 1 }, 24);
    await say(`This is Glimmer. It glows when it trusts someone. It's glowing at you. It does not glow at me. We're working on it.`);
    await say(`This is Solmere: a ring of towns around a great inland sea, the Mere. In the middle stands the Lodestar, the oldest lighthouse in the world.`);
    await say(`Something enormous sleeps under it. Its song is why Echoes exist at all. That's the legend. I'm trying to make it a footnote.`);
    await say(`Right. Paperwork! Tell me about yourself.`);
    await G.tween(bd.show, { hale: 0, mon: 0 }, 16);
    G.save.look = await G.pickLook();
    if (G.world.scene) G.world.scene.player = null;
    await G.tween(bd.show, { player: 1 }, 20);
    const name = await G.askName({ title: 'What\'s your name?', start: '', max: 10, def: ['Alex', 'Robin', 'Kai', 'Sky'][['player_a', 'player_b', 'player_c', 'player_d'].indexOf(G.save.look)] || 'Alex', icon: () => G.chars.sheet(G.LOOKS[G.save.look]).down[Math.floor(G.realTime * 4) % 3] });
    G.save.name = name;
    await say(`${name}. Good name. Strong vowels.`);
    const k = await choose(`So, ${name}... how do you feel about today?`, ['Ready. So ready.', 'I was told there\'d be snacks.', 'I overslept and I\'m still in it.'], HALE);
    await say([`Ooh, I like that. Hold onto it, it's going to get tested.`, `There are snacks. There are always snacks. I respect the priorities.`, `Honestly? Same. I've been awake for thirty hours. We'll get through this together.`][k]);
    await G.tween(bd.show, { player: 0, wren: 1 }, 20);
    await say(`And this is your neighbor and best friend since forever. They already filmed three "day one" intros this morning. What's their name?`);
    const rn = await G.askName({ title: 'Your best friend\'s name?', start: 'Wren', max: 10, def: 'Wren', icon: () => G.chars.sheet(G.LOOKS.wren).down[Math.floor(G.realTime * 4) % 3] });
    G.save.rival = rn;
    await say(`${rn}! Yes. The two of you have been counting down to this day since you could count.`);
    await G.tween(bd.show, { wren: 0, hale: 1 }, 20);
    await say(`Today you each get your first partner Echo. Come find me at my lab on the Brinehollow pier. It's the building with the smoke. The good kind of smoke!`);
    await say(`One more thing. Out there, the bond is the whole game. Take care of your partner, and it'll take care of you. That one's not a joke.`);
    await G.fadeOut(40);
    G.pop(bd);
    G.setFlag('intro_done');
    G.maps.reset();
    const w = new G.WorldScene(); G.push(w);
    w.enterMap('home2f', 3, 4, 'down');
    G.defineRivals();
    G.persist.write();
    await G.fadeIn(30);
    await G.say('Sunlight. Birds. A phone buzzing with forty messages from ' + rn + '. Today\'s the day.\\p{k}(X or Esc opens the menu. H shows the controls.){w}');
  };
  // ------------------------------------------------------------- HOME
  SC.mom = async (S) => {
    S.facePlayer('mom');
    if (!G.flag('mom_talk')) {
      await S.say(`Morning. You're up before noon. Mark the calendar.`, MOM);
      await S.say(`Professor Hale called. Twice. Then ${R()} called. Eleven times. Then ${R()} ran past the window yelling your name, which was a choice.`, MOM);
      await S.say(`Here. A Tamer's Journal. It tracks what you're doing so you don't have to remember, which, respectfully, you won't.`, MOM);
      await S.give('journal');
      S.quest('main1', 'lab');
      const k = await choose('Mom looks at you for a long second.', ['I\'ll make you proud.', 'Can I have the car?', 'Don\'t make it weird.'], MOM);
      await S.say([`You already do. Now go before I get emotional in front of the toaster.`, `We don't have a car. We have a bike with a basket. You can't have that either.`, `I'm your mother. It's my job to make it weird. Go. Hold Shift to run. I love you. Go.`][k], MOM);
      S.set('mom_talk'); return;
    }
    const b = G.save.badges.length;
    if (G.flag('champion')) { await S.say(`The Champion. In my kitchen. The neighbors have been "dropping by" all week. I told them you're busy. You're eating soup.`, MOM); await S.heal(); return; }
    await S.say(G.pick([`You look tired. Sit. Soup first, destiny second.`, `${b ? `${b} badge${b > 1 ? 's' : ''}. I put them on the fridge. Next to your drawing of a horse from when you were four. ` : ''}Eat something.`, `Did you change your socks? Don't answer. Change your socks. And heal your Echoes.`, `I listened to my answering machine today. It was just ${R()} asking if you were home. For nine minutes.`]), MOM);
    await S.heal();
    await S.say('There. Everyone\'s fixed. Go be brave. Text me.', MOM);
  };
  SC.wren_mom = async (S) => {
    S.facePlayer('wrenmom');
    if (G.flag('champion')) { await S.say(`${R()} told me everything. Twice. With diagrams. Thank you for looking out for my kid. Both of them, actually.`, 'Wren\'s Mom'); return; }
    if (G.flag('rival3_done') && !G.flag('hq_done')) { await S.say(`${R()} stopped posting. That kid posts when they sneeze. If you see them, tell them I'm not mad. I'm just... here.`, 'Wren\'s Mom'); return; }
    await S.say(`${R()} left for the lab at dawn. With a ring light. That kid wants to be Champion like their big sibling so badly it hurts to watch. I hope they remember to have fun.`, 'Wren\'s Mom');
  };
  // ------------------------------------------------------------- BRINEHOLLOW
  SC.bh_block = async (S) => {
    await S.say(`"${P()}! You can't go out there with no partner! That's literally how people end up on the news! LAB! PIER! NOW!"`, WREN());
    await pushBack(S, 'up');
  };
  SC.bh_fisher = async (S) => {
    S.facePlayer('bh_fisher');
    await S.say('You can fish Flopfin off this pier. Nobody wants a Flopfin. It flops. That\'s the whole thing.', 'Fisherman');
    if (G.bag.has('rod')) await S.say('Got a rod? Face the water, press Z. When the {r}!{w} pops, reel it in. Don\'t overthink it. Flopfin doesn\'t.', 'Fisherman');
  };
  // ------------------------------------------------------------- LAB
  SC.lab_enter = async (S) => {
    if (G.flag('lab_intro') || G.flag('got_starter')) return;
    await G.wait(10);
    await S.emote('wren_lab', '!');
    await S.say(`${P()}! FINALLY. Chat, they're here. There's no chat. I'm practicing.`, WREN());
    await S.say(`You made it! Mind the cables. And the puddle. I was measuring how far a Sealet can sneeze.`, HALE);
    await S.walkTo('player', 5, 6);
    S.face('player', 'up');
    await S.say('Three Orbs. Three young Echoes. Each one has been waiting for somebody specific. Let\'s find out if it\'s you.', HALE);
    await S.say('{g}Budling{w}, a Grass fawn with a sapling on its head. {r}Kindlet{w}, a Fire kit with its ears literally on fire. And {b}Sealet{w}, a Water pup with the best whiskers in Solmere. It knows.', HALE);
    await S.say(`${P()}, you got here second, but ${R()} insisted you pick first. Which was very sweet.`, HALE);
    await S.say('It\'s not sweet! It\'s strategy! I pick after, so I pick the one that BEATS yours. Content!', WREN());
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
    await S.giveMon(sp, 5, { starter: true, bond: 120, ball: 'orb', text: `${starterName(shown)} looks at you like you're the most interesting thing it has ever seen.` });
    S.set('got_starter');
    S.w.spawnEnts();
    const rsp = G.rivalOf[sp];
    await S.say(`Then I'm taking ${starterName(rsp)}. Type advantage. Called it. Clip that.`, WREN());
    await S.say(`${R()} received ${starterName(G.randomizeSpecies(rsp, 'starter'))}! It immediately tries to eat the ring light.`);
    await S.say(`Oh! Before I forget: an Echodex. It records every Echo you see and catch. I built it myself. Mostly! Don't drop it in water. Or near water.`, HALE);
    await S.give('dex');
    await S.say(`${P()}. You and me. Right now. First battle. For the archive.`, WREN());
    await S.say('In my LAB? ...Fine. Do not knock over the Resonance meter. It cost more than this building.', HALE);
    const won = await G.storyBattle('rival1', { canLose: true });
    S.set('rival1_done');
    await S.say(won ? `No. No no no. That was a warm-up. That was a WARM-UP, ${P()}. I'm deleting the footage.` : `YES! Did you see that?! First win ever! I'm framing this. Don't worry, you'll catch up. Probably!`, WREN());
    await S.say('Nobody broke anything. I\'m calling that a triumph. Let me patch your Echoes up.', HALE);
    await S.heal();
    await S.say(`Favor time! Warden Juniper in Fernwick, north up Route 1, has been waiting on my research notes. Could you run them over? The mail is... slow. The mail is a Flopfin.`, HALE);
    await S.give('parcel');
    S.quest('main1', 'parcel');
    await S.say(`And ${P()}... Juniper runs a gym. Six Wardens, six badges, then the Conclave, then the Champion. I'm not saying do it. I'm saying it's right there.`, HALE);
    await S.say(`Race you. Loser posts an apology video. See you on Route 1!`, WREN());
    const wr = S.npc('wren_lab');
    if (wr) { await S.move('wren_lab', 'dddr', 2); S.remove('wren_lab'); G.audio && G.audio.sfx('door'); }
  };
  SC.starter_budling = S => chooseStarter(S, 'budling');
  SC.starter_kindlet = S => chooseStarter(S, 'kindlet');
  SC.starter_sealet = S => chooseStarter(S, 'sealet');
  SC.wren_lab = async (S) => { S.facePlayer('wren_lab'); await S.say(G.flag('lab_intro') ? 'Pick one! I\'ve been standing here since sunrise! My legs are asleep! Both of them!' : `${P()}! Over here! This is history!`, WREN()); };
  SC.lab_aide = async (S) => {
    S.facePlayer('aide');
    const lines = ['The Resonance meter spikes whenever an Echo evolves. Also when the Professor finds her coffee. Same reading, weirdly.', 'An Echo\'s nature changes how its stats grow. Summary screen: red arrow up, blue arrow down. Science!', 'Every Echo has hidden potential called IVs. The summary shows them plainly. We don\'t do secrets here. Except the Professor\'s password. It\'s "password".', 'Walk with your partner. It builds bond. Some Echoes evolve from bond alone. Friendship, but with numbers.'];
    await S.say(G.pick(lines), 'Lab Aide');
  };
  SC.hale = async (S) => {
    S.facePlayer('hale');
    if (!G.flag('got_starter')) { await S.say('Three Orbs on the table. Go on. One of them is already looking at you.', HALE); return; }
    const d = G.dexCount();
    if (d.caught >= 40 && !G.flag('dex40')) { await S.say(`${d.caught} species?! You're doing my job better than me. Please take this before I get insecure.`, HALE); await S.give('expcandy', 5); S.set('dex40'); S.quest('side_dex', 'part2'); }
    if (d.caught >= 70 && !G.flag('dex70')) { await S.say(`${d.caught} species. I'm genuinely emotional. Take the Shiny Charm. It triples your odds of a shiny Echo. Don't tell the other researchers I have it.`, HALE); await S.give('shinycharm'); S.set('dex70'); S.quest('side_dex', 'done'); return; }
    if (!G.save.quests.side_dex) S.quest('side_dex', 'part1');
    const tips = G.flag('champion') ? `Champion ${P()}. Weird news from Starfall Peak, north-west of Frostpeak. The stars over it are going out. One. By. One. I'd go look, but I'm afraid of heights. And stars.` : `${d.caught} of ${d.total} species caught. Night brings different Echoes. So does water, and fishing. Go! Be curious! Bring me data!`;
    await S.say(tips, HALE);
    if (G.flag('champion') && !G.save.quests.post1) S.quest('post1', 'start');
  };
  // ------------------------------------------------------------- ROUTE 1
  SC.route1_tutorial = async (S) => {
    const w = S.w;
    await S.approach('r1w', 'wren', { prefer: ['up', 'left', 'right'] });
    await S.emote('r1w', '!');
    await S.say(`Wait wait wait. Before you sprint into the grass like a gremlin, tutorial time. I've been rehearsing.`, WREN());
    await S.say('See the wild Echoes wandering around? Bump into one to battle. Weaken it, then throw an Orb. Sleepy or paralyzed ones are way easier to catch.', WREN());
    await S.say('And if one\'s WAY weaker than your lead and you already have it? Just walk through it. Sweep. Don\'t waste your life.', WREN());
    await S.give('orb', 5);
    await S.say(`Your Echodex tracks what lives in every area. "Encounters" in the menu. Okay. Tutorial over. Race to Fernwick. Loser buys Sun Berries. GO!`, WREN());
    await S.fadeOut(10); S.remove('r1w'); await S.fadeIn(10);
    S.set('route1_tut');
    // a real race: the clock only runs while you're walking the route (battles pause it)
    await S.say('{k}RACE! Reach Fernwick before the timer runs out. Hold Shift to run. Battles pause the clock!{w}');
    G.setVar('raceLeft', 60 * 22); S.set('race_active');
    G.audio && G.audio.sfx('exclaim');
  };
  SC.race_finish = async (S) => {
    const won = G.flag('race_active');
    S.set('race_done'); G.clearFlag ? G.clearFlag('race_active') : (G.save.flags.race_active = false);
    await S.approach('rw', 'wren', { prefer: ['up', 'left', 'right'] });
    if (won) {
      await S.emote('rw', '!');
      await S.say(`Huff... huff... HOW. I took a shortcut! Through a HEDGE! I have leaves in places!`, WREN());
      await S.say('Fine. A deal\'s a deal. Sun Berries. Give one to your partner to hold; it eats it when it\'s hurting. Unlike me, who is hurting and has nothing.', WREN());
      await S.give('sunberry', 2);
      G.save.stats.raceWins = (G.save.stats.raceWins || 0) + 1;
    } else {
      await S.say(`TOO SLOW! Undefeated! Well. One win, one loss. The narrative is complicated. You owe me Sun Berries.`, WREN());
    }
    await S.say('Gym\'s at the top of town. Juniper looks gentle. She is not gentle. See you in there!', WREN());
    await S.fadeOut(10); S.remove('rw'); await S.fadeIn(10);
  };
  SC.hollis = async (S) => {
    S.facePlayer('hollis');
    if (!G.flag('lostcub_active')) {
      await S.say('A young Tamer! Could you help an old farmer? My Snoozle wandered off again. It naps in tall grass up north on Route 1. Follows its nose. Its nose is an idiot.', 'Farmer Hollis');
      S.set('lostcub_active'); S.quest('side_lostcub', 'find'); S.w.spawnEnts(); return;
    }
    if (!G.flag('lostcub_found')) { await S.say('Any sign of Snoozle? Big, fluffy, snoring like a tractor. You can\'t miss it. People do, somehow.', 'Farmer Hollis'); return; }
    if (!G.flag('lostcub_done')) {
      await S.say('SNOOZLE! You found it! It followed the berries again, didn\'t it. Of course it did.', 'Farmer Hollis');
      await S.say('Take this Soothe Bell. An Echo holding it bonds with you faster. Snoozle used to wear it. Snoozle ate the ribbon.', 'Farmer Hollis');
      await S.give('soothebell');
      await S.say('And... Snoozle\'s little brother has been staring at you this whole time. I think he\'s decided you\'re his person. Would you take him?', 'Farmer Hollis');
      if (await G.yesno('Take the young Snoozle?')) await S.giveMon('snoozle', 8, { text: 'The little Snoozle yawned, climbed into an Orb, and was asleep before it closed.', bond: 140 });
      else await S.say('No worries. He\'ll wait. He\'s very good at waiting. It\'s mostly napping.', 'Farmer Hollis');
      S.set('lostcub_done'); S.quest('side_lostcub', 'done'); S.w.spawnEnts(); return;
    }
    if (!G.flag('lostcub_gift') && !G.party.hasSpecies('snoozle')) { if (await G.yesno('Snoozle\'s little brother still wants to come with you. Take him?')) { await S.giveMon('snoozle', 10, { bond: 140 }); S.set('lostcub_gift'); } return; }
    await S.say('Snoozle sleeps sixteen hours a day. I\'m not jealous. I\'m extremely jealous.', 'Farmer Hollis');
  };
  SC.lostcub_found = async (S) => {
    await S.say('A huge, fluffy Snoozle is snoring in the grass. It smells like berries and bad decisions.');
    G.audio && G.audio.cry('snoozle');
    await S.emote('snoozle_lost', 'zzz', 40);
    await S.say('Snoozle wakes up, sniffs you, smells Hollis\'s farm... and waddles off toward home at a very dignified speed.');
    S.remove('snoozle_lost'); S.set('lostcub_found'); S.quest('side_lostcub', 'return');
  };
  G.QUESTS.side_lostcub.steps = { find: G.QUESTS.side_lostcub.desc, return: 'Snoozle headed home. Go see Farmer Hollis at his farmhouse on Route 1.' };
  SC.gate_guard = async (S) => {
    S.facePlayer('gateguard');
    const b = G.save.badges.length;
    if (b < 6) { await S.say(`Victory Road. Six Warden badges or no entry. You have ${b}. I don't make the rules. I just enjoy them.`, 'Guard'); return; }
    if (!G.flag('tidelight_done')) { await S.say('Six badges. Nice. But the Lodestar has gone dark, and the Conclave sealed the road until it shines again. Very dramatic. Not my call.', 'Guard'); return; }
    await S.say('The Lodestar\'s burning again, and everybody knows who lit it. Road\'s open. Go get famous.', 'Guard');
    await S.move('gateguard', 'l', 1); S.face('gateguard', 'right');
    S.set('vr_open');
  };
  // ------------------------------------------------------------- FERNWICK
  SC.fern_guard = async (S) => {
    await S.say('Hold it! Rangers saw people in gray coats sneaking around Whisperwood. Nobody goes east without a Warden\'s badge. Juniper\'s orders. She was very polite about it. It was terrifying.', 'Ranger');
    await pushBack(S, 'right');
  };
  SC.fern_guard_talk = async (S) => { S.facePlayer('fw_guard'); await S.say('Earn Juniper\'s badge and the road east is yours.', 'Ranger'); };
  SC.florist_bea = async (S) => {
    S.facePlayer('fw_bea');
    if (!G.save.quests.side_petals) {
      await S.say('Headed to Galvan Harbor? My sister Rhoda lives there. Tell her the birthday bouquet is coming by boat. She thinks I forgot. I DID forget. It\'s coming now.', 'Florist Bea');
      await S.say('Here, something for the road. It\'s a seed. Think of it as a flower with potential.', 'Florist Bea');
      await S.give('oranberry', 2); S.quest('side_petals', 'go'); S.set('bouquet'); return;
    }
    if (G.save.quests.side_petals.step === 'done') { await S.say('Rhoda wrote! She loved the bouquet and does not know I forgot. We take this to the grave.', 'Florist Bea'); return; }
    await S.say('Rhoda lives in the south-east corner of Galvan Harbor. Bouquet. Boat. You\'ve got it.', 'Florist Bea');
  };
  SC.dowsing_man = async (S) => {
    S.facePlayer('fw_dowse');
    if (!G.bag.has('dowsing')) { await S.say('Treasure! Buried everywhere! Take my spare Dowsing Rod. Use it from the Bag and it\'ll sniff out hidden items. I\'ve found eleven coins and one tooth. Not mine.', 'Treasure Hunter'); await S.give('dowsing'); return; }
    await S.say('Dead ends. Behind trees. The corner nobody checks. That\'s where the good stuff lives. Also, the tooth.', 'Treasure Hunter');
  };
  SC.nickname_rater = async (S) => {
    S.facePlayer('fh2');
    const m = G.party.lead(); if (!m) return;
    await S.say(`Ah, ${G.mon.name(m)}! ${m.nick ? 'Now THAT is a name. It has weight. It has flavor. Ten out of ten.' : 'No nickname?! Give it one from the Party menu. Echoes deserve names. I named my kettle.'}`, 'Name Enthusiast');
  };
  SC.gym_guide = async (S, ctx) => {
    const id = S.w.map.id;
    const info = {
      fernwick_gym: ['Grass', 'Fire, Flying, Bug, Poison and Ice all wilt grass. Watch out for Leech Seed. It\'s rude and it adds up.'],
      galvan_gym: ['Electric', 'Ground types don\'t even notice Electric moves. Step on the glowing pads to drop the barriers.'],
      cinder_gym: ['Fire', 'Water, Ground and Rock put the fire out. Brann\'s ace Resonates, so save something strong for the end.'],
      dusk_gym: ['Ghost', 'Dark and Ghost moves haunt ghosts right back. Normal and Fighting moves go straight through them. Awkward.'],
      frost_gym: ['Ice', 'Slide carefully. Fire, Fighting, Rock and Steel shatter ice. Sigrid fights in snow, which makes Ice types tougher.'],
      sky_gym: ['Dragon', 'Ice, Dragon and Fairy are how you handle dragons. Kaelen\'s Tempestral is the real deal. Bring a plan. Bring two.'],
    }[id] || ['?', 'Good luck!'];
    await S.say(`Hey, future champ! This gym runs ${info[0]} types. ${info[1]}`, 'Gym Guide');
    if (id === 'dusk_gym' && !G.bag.has('lantern')) { await S.say('It\'s pitch black in there. Take this Lantern. Mireille says the dark "builds character." It builds bruises.', 'Gym Guide'); await S.give('lantern'); }
    if (!G.bag.has('ether') && G.chance(.5)) { await S.say('Here, on the house. Don\'t tell my manager. I am the manager.', 'Gym Guide'); await S.give('superpotion', 2); }
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
    if (G.flag('badge1')) { await S.say('The flowers bloomed brighter after our battle. I\'m choosing to take that personally. Whisperwood is east, past Route 2. Be careful, sweet pea.', N); return; }
    if (G.bag.has('parcel') && !G.flag('parcel_given')) {
      await S.say('Oh! Mail? From Marisol! Her handwriting is still a crime scene.', N);
      G.bag.remove('parcel'); S.set('parcel_given');
      await S.say('"Bond strength correlates with growth, recovery, and courage." Lovely. There\'s also a coffee ring shaped like a heart. Also lovely.', N);
      await S.say('But you didn\'t walk all this way to be a mail carrier, did you? You want a badge. I can see it. It\'s all over your face.', N);
    }
    await S.say('I\'m Juniper, Warden of Fernwick. People think gardening is gentle. Gardening is ripping out everything that isn\'t winning.', N);
    await S.say('Show me what you\'ve been growing, dear.', N);
    const won = await G.storyBattle('juniper');
    if (!won) return;
    await S.say('...Oh, I haven\'t lost in a while. It feels awful. Here! The Bloom Badge! I\'m fine!', N);
    await wardenWin(S, { badge: 'bloom', flag: 'badge1', name: N, tm: 'tm19', tmText: 'And TM19: Giga Drain. Drain their HP, heal your own. Very efficient. Very me.', gymTrainers: ['fg_1', 'fg_2'] });
    await S.say('A favor, since you\'re so capable. Gray-coated strangers are poking at the Heartroot Shrine deep in Whisperwood, east on Route 2. Go see what they want. I\'ll tell the guard you\'re allowed. I\'ll tell them nicely.', N);
    S.quest('main1', 'done'); S.quest('main2', 'go');
  };
  // ------------------------------------------------------------- ROUTE 2
  SC.berry_lady = async (S) => {
    S.facePlayer('r2_berry');
    const day = Math.floor(G.save.playtime / 2880);
    if (G.getVar('berryday', -1) === day) { await S.say('The bushes need a day to grow back. Plants have boundaries. (A day here is about 48 minutes.)', 'Berry Farmer'); return; }
    G.setVar('berryday', day);
    const b = G.pick(['oranberry', 'sunberry', 'cheriberry', 'chestoberry', 'pechaberry', 'rawstberry', 'lumenberry', 'leppaberry']);
    await S.say('The bushes are heavy today! Take some before the Nibbits find out.', 'Berry Farmer');
    await S.give(b, 2);
  };
  // ------------------------------------------------------------- WHISPERWOOD
  SC.wood_grunts = async (S) => {
    if (G.flag('wood_done')) return;
    const g1 = S.npc('ww_g1'), g2 = S.npc('ww_g2');
    await S.say('"Pry it LOOSE." "I AM prying! The roots are holding on! Is that normal?! Are roots allowed to do that?!"');
    G.audio && G.audio.music('encounter_villain');
    if (g1) g1.dir = 'down'; if (g2) g2.dir = 'down';
    await S.emote('ww_g1', '!', 30);
    await S.say('Uh. A kid. Okay. Official Hollow business. Nothing to see. Please leave. Please?', 'Hollow Grunt');
    let won = await G.storyBattle('ww_grunt1'); if (!won) return;
    await S.say('Seriously?! Okay, my turn. I have a MUCH scarier Echo. It\'s the same Echo. I\'m just more confident.', 'Hollow Grunt');
    won = await G.storyBattle('ww_grunt2'); if (!won) return;
    await S.say('Tch! We already chipped off a shard anyway. The Director will be... fine with that. Probably. Run!', 'Hollow Grunt');
    await Promise.all([S.move('ww_g1', 'uu', 2), S.move('ww_g2', 'uu', 2)]); await S.fadeOut(8);
    S.remove('ww_g1'); S.remove('ww_g2'); await S.fadeIn(8);
    S.restoreMusic();
    await S.say(`You're not hurt? Good. I'm Ash, Whisperwood Ranger. They jumped me at the shrine. Two of them. I'm counting it as a draw.`, 'Ranger Ash');
    await S.say('Gray coats, visors, and every gadget stamped with a Crane Dynamics logo. Here: a Trail Knife. Clears the thin saplings blocking paths around Solmere.', 'Ranger Ash');
    await S.give('trailknife');
    await S.say(`"${P()}! ${P()}!"`);
    await S.approach('wwhale', 'hale', { prefer: ['up', 'left', 'right', 'down'] });
    await S.say(`You're okay! Juniper called. I ran here. I do not run. My body is filing a complaint.`, HALE);
    await S.say('Look at the Heartroot. It\'s a Resonance crystal. It was pulsing in time with your team the whole battle. That\'s... that\'s not a small thing, you know.', HALE);
    await S.say('I think you\'re ready for this. A Resonance Band.', HALE);
    await S.give('resonanceband');
    await S.say('Once per battle, an Echo that trusts you can {c}Resonate{w}. Its main type hits ridiculously hard, and a Resonant Shield softens the first super-effective hit.\\pIn battle, open FIGHT and press R. Save it for the moment that matters.', HALE);
    await S.say('And an EXP Share, so your whole team grows together. Even the ones napping in the back.', HALE);
    await S.give('expshare');
    await S.say('Crane Dynamics gear on the Hollow... Galvan Harbor is north. Warden Ione might know something. And if anyone offers you a "free trial" of anything? Run.', HALE);
    await S.fadeOut(10); S.remove('wwhale'); await S.fadeIn(10);
    S.set('wood_done'); S.quest('main2', 'done'); S.quest('main3', 'go');
    G.persist.write();
  };
  SC.ranger_ash = async (S) => {
    S.facePlayer('ww_ash');
    await S.say(G.flag('wood_done') ? 'The Heartroot is healing. I can hear it humming. Galvan Harbor is north through the trees.' : 'The shrine! The gray coats are at the shrine!', 'Ranger Ash');
  };
  // ------------------------------------------------------------- GALVAN
  SC.crane_speech = async (S) => {
    if (!G.flag('wood_done')) { S.set('crane_speech'); return; }
    S.music('crane');
    const crane = S.spawn({ id: 'gv_crane', x: 22, y: 10, look: 'crane', dir: 'up' });
    const wr = S.spawn({ id: 'gv_wren', x: 20, y: 11, look: 'wren', dir: 'right' });
    const c1 = S.spawn({ id: 'gv_c1', x: 24, y: 11, look: 'worker', dir: 'left' });
    const c2 = S.spawn({ id: 'gv_c2', x: 21, y: 12, look: 'woman', dir: 'up' });
    await S.say('A crowd has packed the fountain square. Phones up. A woman in a white coat steps onto the fountain\'s edge like she owns it. She does.');
    crane.dir = 'down';
    const N = 'Director Crane';
    await S.say('Hi, Galvan. For twelve years Crane Dynamics has kept your lights on. Today I want to keep something else on.', N);
    await S.say('Your bond. The thing between you and your Echo. It\'s the realest thing any of us have. And you\'ve never once been able to see it.', N);
    await S.say('Chorus changes that. One band. Your Resonance, measured, live. Your score. Your streak. The leaderboard. And for the top of it... Boosts.', N);
    await S.say('Join the Crane Fellowship, and be seen. Everyone deserves to be seen.', N);
    await S.say('The crowd goes wild. A kid faints. Director Crane isn\'t watching them, though. She\'s watching the middle of the Mere.');
    await S.move('gv_crane', 'ddd', 1); S.remove('gv_crane');
    S.remove('gv_c1'); S.remove('gv_c2');
    S.remove('gv_wren'); await S.approach('gv_wren', 'wren');
    await S.say(`${P()}. ${P()}. Did you HEAR that?! A LEADERBOARD. For BONDS. My whole life has been building to this sentence.`, WREN());
    const k = await choose(`${R()} is vibrating slightly.`, ['Just be careful, okay?', 'Race you to the top of it.', 'You said "free trial" wrong.'], WREN());
    await S.say([`Careful is for people who aren't about to be famous. ...I'll be careful. Ish.`, `Oh, it's ON. First place gets bragging rights. Second place gets content.`, `I didn't say "free trial." ...Why is your face like that. What do you know.`][k], WREN());
    await S.say('Ione\'s gym first. Then I\'m signing up. Sable will HAVE to notice me when my score is on a screen.', WREN());
    await S.fadeOut(10); S.remove('gv_wren'); await S.fadeIn(10);
    S.restoreMusic(); S.set('crane_speech');
  };
  SC.ione = async (S) => {
    const N = 'Warden Ione';
    S.facePlayer('ione_npc');
    if (G.flag('badge2')) { await S.say('Keep the current flowing! Route 3 is east. Glimmer Cave goes through to Cindervale. Bring snacks. The cave is long and the acoustics are incredible.', N); return; }
    await S.say('WELCOME to the Galvan Gym, where the voltage is high and the bass is HIGHER!', N);
    await S.say('I\'m Ione. Days, I keep the city grid alive. Nights, I DJ at the docks. Right now? I\'m about to drop the beat. On you.', N);
    const won = await G.storyBattle('ione'); if (!won) return;
    await S.say('Okay! OKAY! You didn\'t just keep up, you remixed me. Current Badge. It\'s yours. Wear it loud.', N);
    await wardenWin(S, { badge: 'current', flag: 'badge2', name: N, tm: 'tm34', tmText: 'TM34: Volt Dash. Hit hard, switch out, leave them confused. The perfect transition.', gymTrainers: ['gg_1', 'gg_2', 'gg_3'] });
    await S.say('Real talk? Crane Dynamics sponsors my gym. But those Fellowship kids... glassy eyes, Echoes wired way too tight. Something\'s off in the mix.', N);
    await S.say('East along Route 3. Glimmer Cave leads to Cindervale. Stay loud.', N);
    S.quest('main3', 'done'); S.quest('main4', 'go');
  };
  SC.bike_shop = async (S) => {
    S.facePlayer('bikeguy');
    if (G.bag.has('bike')) { await S.say('How\'s the bike? F to hop on and off. Tell people where you got it. Tell them LOUDLY.', 'Spoke'); return; }
    if (!G.flag('badge2')) { await S.say('I only give my prototype bikes to Tamers with two badges. Free advertising. If you\'re cool. Are you cool? Two badges and we\'ll know.', 'Spoke'); return; }
    await S.say('TWO badges. You\'re exactly my demographic. Folding bike, free. Just ride it past as many people as possible.', 'Spoke');
    await S.give('bike', 1, { note: 'Press F to hop on or off. You can also register it in the Bag.' });
    S.set('got_bike');
  };
  SC.old_salt_marv = async (S) => {
    S.facePlayer('gv_marv');
    const N = 'Old Salt Marv';
    if (!G.bag.has('rod')) { await S.say('Ahoy, youngster. You fish? You do now. Take my old rod. Face the water, press Z, reel when the "!" shows.', N); await S.give('rod'); }
    const q = G.save.quests.side_fish;
    if (q && q.step === 'done') { await S.say('I dream about your Riptalon. They\'re good dreams. Mostly screaming. Good screaming.', N); return; }
    if (G.save.party.some(m => m.sp === 'riptalon')) {
      await S.say('Is that... a RIPTALON?! From a FLOPFIN?! FIFTY YEARS! FIFTY YEARS THEY LAUGHED AT ME!', N);
      await S.say('Take my Pro Rod. You earned it. You earned it for both of us. It hooks rarer Echoes in deep water.', N);
      await S.give('prorod'); S.quest('side_fish', 'done'); return;
    }
    if (!q) S.quest('side_fish', 'go');
    await S.say('Everyone laughs at Flopfin. Flops, flops, flops. But I KNOW it becomes something terrifying. Show me a Riptalon and my Pro Rod is yours.', N);
  };
  SC.rhoda = async (S) => {
    S.facePlayer('gv_rhoda');
    if (G.flag('bouquet') && G.save.quests.side_petals && G.save.quests.side_petals.step !== 'done') {
      await S.say('A bouquet? By BOAT? From Bea? She remembered! ...She forgot, didn\'t she. It\'s fine. It\'s very Bea.', 'Rhoda');
      await S.say('Take this. Bea grew it years ago. It powers up Grass moves. She\'ll never know it was regifted.', 'Rhoda');
      await S.give('miracleseed'); S.quest('side_petals', 'done'); return;
    }
    await S.say('The harbor\'s nice. The air smells like diesel and ambition. I miss Fernwick\'s flowers.', 'Rhoda');
  };
  SC.vsrecorder_npc = async (S) => {
    S.facePlayer('gv_vsr');
    if (!G.bag.has('vsrecorder') && G.flag('badge2')) { await S.say('You look like someone who enjoys a rematch. This Vs. Recorder lets trainers you\'ve beaten challenge you again after each new badge. Revenge, organized.', 'Officer Jenna'); await S.give('vsrecorder'); return; }
    await S.say(G.bag.has('vsrecorder') ? 'Beaten trainers want rematches after each new badge. Just talk to them again. They\'ve been practicing. Out of spite.' : 'Come back with Ione\'s badge. I\'ve got something for you. It\'s not a ticket. Probably.', 'Officer Jenna');
  };
  SC.ev_trainer = async (S) => {
    S.facePlayer('gh1');
    const N = 'Stat Scholar';
    await S.say('Effort Values! Every Echo you beat trains your team a little. Like the gym, but you never have to go. I can show you them, or wipe them. For a fee.', N);
    const k = await G.ask('What would you like?', ['Check lead Echo', 'Reset EVs ($2,000)', 'Nothing'], { speaker: N });
    const m = G.party.lead();
    if (k === 0 && m) await S.say(`${G.mon.name(m)}: ${G.STATS.map(s => G.STAT_SHORT[s] + ' ' + m.evs[s]).join(', ')}. Total ${G.mon.totalEVs(m)}/510.`, N);
    if (k === 1) {
      const i = await G.openParty({ mode: 'select', prompt: 'Reset whose EVs?' }); if (i === null || i < 0) return;
      if (G.save.money < 2000) { await S.say('You can\'t afford a fresh start. Relatable.', N); return; }
      G.save.money -= 2000; for (const s of G.STATS) G.save.party[i].evs[s] = 0; await S.say('Done! A clean slate. Like it never went to the gym at all.', N);
    }
  };
  SC.move_tutor = async (S) => {
    S.facePlayer('gh2');
    const N = 'Move Tutor';
    const moves = ['bondstrike', 'helpinghand', 'drainpunch', 'zenstrike', 'heatwave', 'icygust', 'aerialace', 'ironhead', 'seedbomb', 'shadowclaw', 'playrough', 'earthpower'];
    await S.say('I teach special moves. $2,000 each. No refunds. No crying. Pick an Echo and I\'ll show you what it can learn.', N);
    const i = await G.openParty({ mode: 'select', prompt: 'Teach which Echo?' }); if (i === null || i < 0) return;
    const m = G.save.party[i];
    const ok = moves.filter(mv => (mv === 'bondstrike' || mv === 'helpinghand' || G.canLearnTM(m.sp, mv) || G.SPECIES[m.sp].types.concat(G.SPECIES[m.sp].tmx || []).includes(G.MOVES[mv].type)) && !G.mon.hasMove(m, mv));
    if (!ok.length) { await S.say(`${G.mon.name(m)} already knows everything I'd teach it. Honestly, it should be teaching me.`, N); return; }
    const k = await G.choose(ok.map(mv => ({ label: G.MOVES[mv].name, right: G.cap(G.MOVES[mv].type) })).concat([{ label: 'Cancel' }]), { x: 150, y: 20, w: 150, cancel: ok.length, title: 'Teach which move?' });
    if (k < 0 || k >= ok.length) return;
    if (G.save.money < 2000) { await S.say('You don\'t have enough money. Knowledge isn\'t free. It\'s two thousand.', N); return; }
    if (await G.learnWithPrompt(m, ok[k])) G.save.money -= 2000;
  };
  const tradeFlow = async (S, id, want, give, nick, lvl, N) => {
    if (G.flag('trade_' + id)) { await S.say(`How's ${nick}? Be honest. Do they talk about me? ...Don't answer.`, N); return; }
    await S.say(`I'm looking for a ${G.SPECIES[want].name}. I'll trade you my ${G.SPECIES[give].name}, "${nick}." They're a lot. You'll love them.`, N);
    if (!await G.yesno(`Trade a ${G.SPECIES[want].name} for ${nick}?`)) return;
    const i = await G.openParty({ mode: 'select', prompt: `Trade which ${G.SPECIES[want].name}?`, filter: m => m.sp === want, filterMsg: `That's not a ${G.SPECIES[want].name}.` });
    if (i === null || i < 0) { await S.say('Aw. Maybe next time. I\'ll be here. With my feelings.', N); return; }
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
    await S.say(G.flag('hq_done') ? 'The Director has... stepped down. The app is "under maintenance." I\'m "under maintenance." Brochure? They\'re collectors\' items now.' : 'Welcome to Crane Dynamics! The Director works out of HQ in Skyreach. Can I interest you in Chorus? Free trial! Just sync your band and agree to the terms. All of them.', 'Receptionist');
  };
  SC.dr_orla = async (S) => {
    S.facePlayer('orla');
    const N = 'Dr. Orla';
    const f = ['clawfossil', 'wingfossil'].find(i => G.bag.has(i));
    if (f) {
      const sp = G.ITEMS[f].fossil;
      await S.say(`A ${G.ITEMS[f].name}! Oh, oh, OH. The Revival Lab can bring it back. Give me one moment and absolutely no questions.`, N);
      G.bag.remove(f); await S.fadeOut(20); G.audio && G.audio.sfx('pc_on'); await S.wait(60); await S.fadeIn(20);
      await S.say('IT\'S ALIVE! Ahem. It worked! Here!', N);
      await S.giveMon(sp, 25, { perfectIVs: 2, text: `The ${G.SPECIES[sp].name} blinks at the modern world, decides it's fine, and nuzzles your hand.` });
      S.quest('side_fossil', 'done'); return;
    }
    if (!G.save.quests.side_fossil) S.quest('side_fossil', 'go');
    await S.say('Dr. Orla, curator. Diggers in Glimmer Cave, east of Route 3, keep turning up fossils. Bring me one and I\'ll wake it up. Ethically! Mostly!', N);
  };
  // ------------------------------------------------------------- GLIMMER CAVE
  SC.lark1 = async (S) => {
    if (G.flag('lark1_done')) return;
    const N = 'Admin Lark';
    S.faceEach('gc_lark', 'player');
    G.audio && G.audio.music('encounter_villain');
    await S.emote('gc_lark', '!');
    await S.say('Oh, it\'s YOU. The kid who made my grunts cry in the woods. They wrote a group message about you. It had eleven voice notes.', N);
    await S.say('I\'m Lark. Admin of the Hollow. These singing crystals? Ours now. The Director needs every drop of Resonance they\'ve got. Don\'t ask why. I didn\'t.', N);
    const k = await choose('Lark is inspecting her nails, which are chipped from crystal-prying.', ['Leave the crystals alone.', 'Nice coat. Is it a costume?', 'Okay. Anyway.'], N);
    await S.say([`Aww, a hero. That's adorable. I'm gonna flatten you, but it's adorable.`, `It is NOT a costume. It's a UNIFORM. It has a hood. ...It's a little bit of a costume.`, `"Okay, anyway"?! Nobody "okay anyway"s me! I'm the "okay anyway"-er!`][k], N);
    const won = await G.storyBattle('lark1'); if (!won) return;
    await S.say('UGH! Fine! Keep your stupid glowing rocks! The Director doesn\'t even need them anymore. She\'s got bigger fish.', N);
    await S.say('Like, "sleeping under a lighthouse" big. Toodles, nerd!', N);
    await S.move('gc_lark', 'lll', 2); S.remove('gc_lark');
    S.set('lark1_done'); S.restoreMusic();
    await S.say('"Hello?! Is the scary lady gone?! Asking for me!"');
    await SC.rocco_hammer(S);
  };
  SC.rocco_hammer = async (S) => {
    S.facePlayer('gc_rocco');
    const N = 'Hiker Rocco';
    if (!G.flag('lark1_done')) { await S.say('Psst! The Hollow blasted the exit shut and trapped me in here! There\'s a whole gang of them in the crystal chamber! I\'m hiding! Badly!', N); return; }
    if (!G.bag.has('pickhammer')) {
      await S.say('You chased them off! Bless you! They sealed the way to Cindervale with rubble. Take my Pick Hammer and smash right through. It\'s very therapeutic.', N);
      await S.give('pickhammer', 1, { note: 'Walk up to a cracked rock and press Z to smash it.' });
      return;
    }
    await S.say('Cindervale is just past those rocks. The hot springs there will fix everything. Your back. Your team. Your soul.', N);
  };
  SC.fossil_dig = async (S) => {
    S.facePlayer('gc_dig');
    const N = 'Digger Pim';
    if (G.flag('got_fossil')) { await S.say('Take care of that fossil! Dr. Orla in Galvan can revive it. She gets very excited. Stand back when she does.', N); return; }
    await S.say('Two fossils in one dig! My bag holds one. You found me, so you choose. Choose wisely. Or quickly. Quickly is also fine.', N);
    const k = await G.ask('Which fossil will you take?', ['Claw Fossil', 'Wing Fossil'], { speaker: N, cancel: -1 });
    if (k < 0) return;
    await S.give(k === 0 ? 'clawfossil' : 'wingfossil');
    S.set('got_fossil'); S.quest('side_fossil', 'go');
    await S.say('Dr. Orla! Galvan Harbor Museum! Go!', N);
  };
  // ------------------------------------------------------------- CINDERVALE
  SC.rival2 = async (S) => {
    await S.approach('cv_wren', 'wren_crane', { prefer: ['right', 'down', 'up'] });
    await S.emote('cv_wren', '!');
    await S.say(`${P()}! Look! Official Fellowship scarf! And the band! Resonance score: 1,204. Top twenty in the region. TOP. TWENTY.`, WREN());
    await S.say('They have machines that measure your bond and push it higher. My team has never hit this hard. I feel like the main character.', WREN());
    await S.say('Let\'s see your number.', WREN());
    const won = await G.storyBattle('rival2');
    S.set('rival2_done');
    if (!won) return;
    await S.say('Tch. My score dropped nine points. NINE. Do you know how that looks?! ...Whatever. The Fellowship says there\'s something big at the Ruins of Echo in Duskmere. I\'m going.', WREN());
    await S.fadeOut(10); S.remove('cv_wren'); await S.fadeIn(10);
  };
  SC.kiko = async (S) => {
    S.facePlayer('kiko');
    const N = 'Attendant Kiko';
    const q = G.save.quests.side_spring;
    if (q && q.step === 'done') { await S.say('The springs are cozy. Soak as long as you like. Your problems will still be there. But warmer.', N); await S.heal(); return; }
    if (!q) S.quest('side_spring', 'go');
    const has = t => G.save.party.some(m => G.SPECIES[m.sp].types.includes(t));
    if (has('fire') && has('water') && has('ice')) {
      await S.say('Fire, Water AND Ice, soaking TOGETHER?! Steamy! Splashy! Chilly! It\'s the dream! Take these Leftovers. Straight from the snack bar. Mostly fresh.', N);
      await S.give('leftovers'); S.quest('side_spring', 'done'); return;
    }
    await S.say('Welcome to Ember Springs! My life\'s dream: a Fire, a Water AND an Ice Echo relaxing together. Bring one of each. Meanwhile, soak free.', N);
    await S.heal();
  };
  SC.mint_lady = async (S) => {
    S.facePlayer('ch2');
    await S.say('Mints! Grown in volcanic soil. A mint changes how an Echo\'s stats grow, like a new nature. $5,000. They\'re very strong mints.', 'Mint Grower');
    const stock = ['mint_adamant', 'mint_jolly', 'mint_modest', 'mint_timid', 'mint_bold', 'mint_impish', 'mint_calm', 'mint_careful', 'mint_brave', 'mint_quiet'];
    await new Promise(res => G.push(new G.ShopScene(stock, res)));
  };
  SC.name_rater_cinder = async (S) => {
    S.facePlayer('ch1');
    const N = 'Old Seer Tomas';
    const m = G.party.lead();
    if (m) { const ab = G.ABILITIES[G.mon.ability(m)]; await S.say(`Your ${G.mon.name(m)}... its ability is ${ab.name}. ${m.abil === 2 ? 'A HIDDEN ability! Rare. I have goosebumps. I always have goosebumps, it\'s a volcano town, but still.' : G.SPECIES[m.sp].abil[2] ? 'It has a hidden talent, sleeping. Sparkling grass hides Echoes whose talents are already awake.' : ''}`, N); }
    if (G.flag('badge3') && !G.flag('got_capsule')) { await S.say('Take this Ability Capsule. It swaps an Echo between its two regular abilities. I foresaw you needing it. I also foresaw lunch.', N); await S.give('abilitycapsule'); S.set('got_capsule'); }
  };
  SC.brann = async (S) => {
    const N = 'Warden Brann';
    S.facePlayer('brann_npc');
    if (G.flag('badge3')) { await S.say('DUSKMERE is SOUTH along ROUTE 4! And the Hollow was talking about the Ruins of Echo! WATCH YOURSELF! That\'s my indoor voice!', N); return; }
    await S.say('HAH! A CHALLENGER! I\'m BRANN! Forty years shaping steel! Twenty shaping Tamers! Zero years speaking quietly!', N);
    await S.say('Heat shows the flaws in metal! Battle shows the flaws in bonds! Let\'s see what YOU\'RE MADE OF!', N);
    const won = await G.storyBattle('brann'); if (!won) return;
    await S.say('HAAA! You\'ve got fire in you, kid! The GOOD kind! The Forge Badge is YOURS!', N);
    await wardenWin(S, { badge: 'forge', flag: 'badge3', name: N, tm: 'tm35', tmText: 'And TM35: FLAMETHROWER! Reliable as a good hammer! LOUDER than a good hammer!', gymTrainers: ['cg_1', 'cg_2', 'cg_3'],
      extra: async () => { await S.say('And THIS! My old Wing Whistle! My Cinderwing\'s getting old, but the Sky Taxi still answers it! Flies you to any town you\'ve visited! Use it from the Map!', N); await S.give('wingwhistle'); } });
    await S.say('NEWS from Duskmere! The Hollow is heading for the Ruins of Echo! Something about a KEY! Route 4, SOUTH! GO!', N);
    S.quest('main4', 'done'); S.quest('main5', 'go');
  };
  // ------------------------------------------------------------- DUSKMERE
  SC.dusk_gym_guard = async (S) => { S.facePlayer('dm_gguard'); await S.say('Warden Mireille ran to the Ruins of Echo, north-east of town. She said intruders were "upsetting the spirits." She says that a lot. This time she ran.', 'Gym Apprentice'); };
  SC.grey1 = async (S) => {
    if (G.flag('ruins_done')) return;
    const N = 'Admin Grey';
    G.audio && G.audio.music('encounter_villain');
    S.face('ru_grey', 'down');
    await S.say('...', N);
    await S.say('You are the anomaly Lark keeps sending voice notes about. I am Grey. Admin. Hollow. Analytics.', N);
    await S.say('The Tide Key has already left its cradle. The probability that you change anything here is four percent.', N);
    await S.say('I would like to see the four percent.', N);
    const won = await G.storyBattle('grey1'); if (!won) return;
    await S.say('Interesting. I will revise the model to six percent. The key is already on its way to the Director.', N);
    await S.say('Grey raises a hand. A Nightwing drops out of the dark and carries him off into the mist, very efficiently.');
    G.audio && G.audio.sfx('fly');
    S.remove('ru_grey');
    await S.approach('ru_mir', 'mireille', { prefer: ['down', 'left', 'right'] });
    await S.say('The cradle is empty. I came the moment the spirits began to wail. You faced them alone? Brave little flame. Stupid, but brave.', 'Warden Mireille');
    await S.say('The Tide Key opens the sea gate beneath the Lodestar. The old songs say Orrelume sleeps behind it. If Crane has the key...', 'Warden Mireille');
    await S.say('Come to my gym when you\'re ready. We have much to discuss. After I see what burns in you. It\'s a whole ritual. There are candles.', 'Warden Mireille');
    await S.fadeOut(10); S.remove('ru_mir'); await S.fadeIn(10);
    S.set('ruins_done'); S.restoreMusic(); S.quest('main5', 'gym');
    G.persist.write();
  };
  G.QUESTS.main5.steps = { go: G.QUESTS.main5.desc, gym: 'Grey escaped with the Tide Key. Challenge Warden Mireille at the Duskmere Gym.' };
  SC.mireille = async (S) => {
    const N = 'Warden Mireille';
    S.facePlayer('mireille_npc');
    if (G.flag('badge4')) { await S.say('Professor Hale waits for you on the Duskmere pier. She has been pacing. Pacing is very un-goth. Go, little flame.', N); return; }
    await S.say('Welcome, little flame. In darkness we see what truly matters. Also, the lights are off on purpose. It\'s an aesthetic.', N);
    await S.say('My Echoes are the whispers of those who loved too much to leave. Yes, I know how that sounds. Let us see if your bond shines through them anyway.', N);
    const won = await G.storyBattle('mireille'); if (!won) return;
    await S.say('The candle flickers... and still it burns. As do you. The Veil Badge. I\'m moved. I\'ll be writing a poem about this. You can\'t stop me.', N);
    await wardenWin(S, { badge: 'veil', flag: 'badge4', name: N, tm: 'tm58', tmText: 'TM58: Wisp Flame. A gentle burn that weakens a foe\'s physical attacks. Gentle. Like me.', gymTrainers: ['dg_1', 'dg_2', 'dg_3'] });
    await S.say('Professor Hale arrived while we fought. She\'s on the pier. She has a story you need to hear. She\'s been rehearsing it for twelve years.', N);
  };
  SC.dusk_hale = async (S) => {
    S.facePlayer('dm_hale');
    if (G.flag('got_surf')) { await S.say('South across the lake to Frostpeak. I\'ll stay and dig through Vesper\'s old research. It\'s the least I can do. It is, genuinely, the least.', HALE); return; }
    await S.say(`${P()}. Mireille told me. The Tide Key. Vesper actually did it.`, HALE);
    await S.say('Twelve years ago, Vesper Crane and I worked at the Lodestar together. We wanted to record Orrelume\'s song. The first recording, ever.', HALE);
    await S.say('Her partner was a Luminelle named Lumi. The sweetest Echo you ever met. When the song started, Lumi... sang back.', HALE);
    await S.say('And here\'s the part I\'ve never said out loud. Vesper wanted to stop. Lumi was shaking. And I said, "Thirty more seconds. We\'ll never get this again."', HALE);
    await S.say('The Lodestar flared so bright the whole Mere went white. When it faded, Lumi was gone. No trace. Gone.', HALE);
    const k = await choose('Hale can\'t quite look at you.', ['You didn\'t know. It wasn\'t your fault.', 'That\'s... a lot to drop on a kid.', 'Thirty seconds. Wow.'], HALE);
    await S.say([`That's kind of you. It's also not entirely true. I've had twelve years to decide which.`, `It is. I'm sorry. You're the only one who keeps showing up, so you get the truth. That's the deal, apparently.`, `Yeah. Thirty seconds. I've done the math on those thirty seconds every night since.`][k], HALE);
    await S.say('If Vesper wants the sea gate, she wants to force Orrelume to sing again. Loud enough to reach Lumi, wherever she is. And she won\'t care what it costs anyone else. I taught her that.', HALE);
    await S.say('I can\'t stop her. But you can reach places I can\'t. Take this Tide Board. Face the water and press Z to surf.', HALE);
    await S.give('tideboard');
    await S.say('South across the lake to Frostpeak Village. Warden Sigrid is a dear friend. She\'ll look after you. Loudly.', HALE);
    S.set('got_surf'); S.quest('main5', 'done'); S.quest('main6', 'go');
    G.persist.write();
  };
  SC.lamplighter = async (S) => {
    S.facePlayer('dm_ode');
    const N = 'Lamplighter Ode';
    const lit = [1, 2, 3, 4].filter(i => G.flag('lantern' + i)).length;
    const q = G.save.quests.side_lanterns;
    if (q && q.step === 'done') { await S.say('The spirits rest easy. You\'ve a lamplighter\'s heart. The pay is terrible, but you\'ve got the heart.', N); return; }
    if (lit >= 4) {
      await S.say('All four spirit lanterns burn! Hear that? The spirits are singing. Slightly off-key. It\'s tradition.', N);
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
    await S.say('You light the spirit lantern. A tiny voice whispers: "...thank you... also, hi..."');
    if ([1, 2, 3, 4].every(i => G.flag('lantern' + i))) {
      await S.say('The last lantern flares! A Wispurr drifts out of the light to see who did that!');
      await G.startWild(null, { species: 'wispurr', lvl: 30, noRandom: true, hidden: true });
    }
  };
  SC.prorod_guy = async (S) => {
    S.facePlayer('dm_rodguy');
    await S.say('Deep lake, big fish. A Pro Rod pulls up the good stuff: Mireel, Riptalon, even Crustank. Crustank bit me once. I respect it.', 'Fisher Lou');
    if (!G.flag('lou_gift')) { await S.say('Take some Net Orbs. Great for Water types. Terrible for hats. Long story.', 'Fisher Lou'); await S.give('netorb', 5); S.set('lou_gift'); }
  };
  SC.fortune_teller = async (S) => {
    S.facePlayer('dh1');
    const m = G.party.lead(); if (!m) return;
    const best = G.STATS.reduce((a, s) => m.ivs[s] > m.ivs[a] ? s : a, 'hp');
    await S.say(`I see... ${G.mon.name(m)}'s greatest gift is its ${G.STAT_NAMES[best]}. ${G.pick(['A shiny will cross your path when you least expect it. Probably while you\'re looking at your phone.', 'Sparkling grass holds Echoes with awakened talents.', 'The Lodestar will shine again. Because of you. No pressure.', 'Your rival\'s heart is heavier than their posts suggest.'])}`, 'Fortune Teller');
  };
  // ------------------------------------------------------------- ROUTE 5
  SC.glowing_scale = async (S) => {
    S.facePlayer('r5_scale');
    if (G.save.quests.side_scale) { await S.say('Did the elder in Frostpeak know what the scale is? Is it cursed? Please say it\'s cursed. That would be so cool.', 'Island Girl'); return; }
    await S.say('This washed up on my island. It glows. It HUMS. Like it\'s singing. Could you take it to Elder Vesna in Frostpeak? She knows all the old stories.', 'Island Girl');
    await S.give('oldamber'); S.quest('side_scale', 'go');
  };
  SC.rival3 = async (S) => {
    await S.approach('r5w', 'wren_crane', { prefer: ['down', 'left', 'right'] });
    await S.emote('r5w', '...', 40);
    await S.say('Took you long enough.', WREN());
    await S.say('Score\'s 3,880. Number four in Solmere. The Director gave me a Boost. It forces Resonance. All the time. No waiting for a bond. No waiting for anything.', WREN());
    await S.say(`I'm going to be Champion, ${P()}. Before Sable even looks up. Starting with you.`, WREN());
    const won = await G.storyBattle('rival3');
    S.set('rival3_done');
    const st = G.lineAt(G.rivalOf[G.getVar('starter', 'kindlet')], 36);
    await S.say(`${R()}'s ${G.SPECIES[st].name} is trembling. It lets out a thin, tired cry. It sounds like it's been crying for a while.`);
    await S.say('Hey. Hey, what\'s wrong? You\'re shaking. Is it the Boost? Did the Boost do this? ...How long has it been doing this?', WREN());
    const k = await choose(`${R()} is staring at their partner.`, ['Take the band off. Right now.', 'Your score\'s gonna tank. Worth it.', 'It\'s been doing it since Cindervale.'], WREN());
    await S.say([`...Yeah. Yeah. I— I need to think. Don't follow me. Please.`, `Don't. Don't make it a joke. Not this one. ...Don't follow me.`, `You saw it? You saw it and I didn't? ...I need to think. Don't follow me.`][k], WREN());
    await S.fadeOut(10); S.remove('r5w'); await S.fadeIn(10);
  };
  // ------------------------------------------------------------- FROSTPEAK
  SC.starfall_guard = async (S) => {
    await S.say('Nope! Starfall Peak is far too dangerous. Only the Champion of Solmere may climb it. Those are the rules. I wrote them. They\'re good rules.', 'Mountain Ranger');
    await pushBack(S, 'left');
  };
  SC.grip_boots = async (S) => {
    S.facePlayer('fp_boots');
    const N = 'Old Halvard';
    if (G.bag.has('gripboots')) { await S.say('Mt. Glacia Pass is east. Shove the boulders into the holes to cross. Lift with your legs. Or your Echo\'s legs.', N); return; }
    if (!G.flag('badge5')) { await S.say('My daughter Sigrid runs the gym. Beat her and I\'ll give you what you need for the pass. She won\'t let you. But try.', N); return; }
    await S.say('Sigrid says you\'re the real thing. These Grip Boots got me over Mt. Glacia a hundred times. Walk into a boulder to push it. Feel powerful.', N);
    await S.give('gripboots'); S.set('got_boots');
  };
  SC.elder_vesna = async (S) => {
    S.facePlayer('vesna');
    const N = 'Elder Vesna';
    if (G.bag.has('oldamber')) {
      await S.say('That scale... child, that is a scale of Orrelume itself. It hasn\'t shed one in a hundred years.', N);
      await S.say('The old song says Solmere has two great lights. The song of the sea, and the hunger of the stars. The sea sings bonds together. The stars... remember whatever falls.', N);
      await S.say('If Orrelume is shedding, it is afraid. Keep the scale close. You may need its song. And take this Frost Stone. I\'ve been holding it for someone interesting. You\'ll do.', N);
      await S.give('froststone'); S.quest('side_scale', 'done'); S.set('scale_read'); return;
    }
    await S.say('Frostpeak remembers the old songs. The sea. The stars. And the lighthouse standing between them, pretending it isn\'t nervous.', N);
  };
  SC.sigrid = async (S) => {
    const N = 'Warden Sigrid';
    S.facePlayer('sigrid_npc');
    if (G.flag('badge5')) { await S.say(`Mt. Glacia Pass, east of the village. Skyreach City is past it. And ${R()} came through... looking lost. Like, actually lost. Not map-lost.`, N); return; }
    await S.say('WELCOME TO THE SUMMIT! I\'m Sigrid! Three-time Solmere Games champion! On skis! Also a Warden! Mostly skis!', N);
    await S.say('Balance! Speed! Nerves of ICE! Let\'s see you keep your footing! Let\'s GOOO!', N);
    const won = await G.storyBattle('sigrid'); if (!won) return;
    await S.say('INCREDIBLE! Like the first morning after a blizzard! Personal best! Yours, not mine! The Rime Badge!', N);
    await wardenWin(S, { badge: 'rime', flag: 'badge5', name: N, tm: 'tm14', tmText: 'TM14: Blizzard! It never misses in snow. Like me. On skis.', gymTrainers: ['ig_1', 'ig_2'] });
    await S.say(`Dad, Halvard, will want to meet you. He's by the frozen pond. And ${R()}... they headed for Skyreach. They didn't post. That scared me more than anything.`, N);
    S.quest('main6', 'done'); S.quest('main7', 'go');
  };
  // ------------------------------------------------------------- SKYREACH
  SC.sky_gym_guard = async (S) => { S.facePlayer('sk_gguard'); await S.say('Warden Kaelen walked into Crane HQ this morning to "have a word" and never came out. The gym is closed. Nobody\'s calm about it.', 'Dragon Tamer'); };
  SC.sky_sailor = async (S) => { S.facePlayer('sk_sailor'); await S.say(G.flag('badge6') ? 'The Lodestar is straight north across the water. Surf safe. Wave at it for me.' : 'The sea route north leads to the Lodestar. It went dark last night. First time in my whole life. Felt like the sky blinked.', 'Sailor'); };
  SC.hq_wren = async (S) => {
    if (G.flag('hq_started')) return;
    S.faceEach('sk_wren', 'player');
    await S.say(`${P()}. Wait. Please.`, WREN());
    await S.say('I was wrong. About Crane, about the Fellowship, about the score. All of it. The Boost was hurting my partner and I kept refreshing my number.', WREN());
    await S.say('I threw the band in the lake. My score\'s zero now. It feels weird. It feels like I can breathe.', WREN());
    await S.say('I overheard them. Warden Kaelen is locked up on the Director\'s floor. And Crane\'s moving the Chorus Engine core to the Lodestar. Tonight.', WREN());
    await S.say('I swiped a keycard on my way out. The lobby elevator needs it. We stop her. Together. Like we used to do everything.', WREN());
    await S.give('cranekeycard');
    S.set('hq_started'); S.set('hq_card'); S.quest('main7', 'hq');
    await S.say('Meet you upstairs. And... thanks for not saying "I told you so." You\'re saying it with your face, but thanks.', WREN());
    await S.move('sk_wren', 'u', 2); S.remove('sk_wren');
  };
  G.QUESTS.main7.steps = { go: G.QUESTS.main7.desc, hq: 'Infiltrate Crane Dynamics HQ with Wren and free Warden Kaelen.', gym: 'Crane fled. Challenge Warden Kaelen at the Skyreach Gym.' };
  SC.hq1_enter = async (S) => { if (G.flag('hq_started') && !G.flag('hq_done')) G.toast('The elevator at the back leads to the Director\'s floor.'); };
  SC.hq_elevator_guard = async (S) => { S.facePlayer('hq_lift'); await S.say('No keycard, no elevator! Director\'s orders! I\'ve never been in the elevator either!', 'Hollow Grunt'); };
  SC.hq_recep = async (S) => { S.facePlayer('hq_recep'); await S.say(G.flag('hq_done') ? 'Everyone\'s being questioned. I just answer phones. I have answered a LOT of phones today.' : 'W-welcome to Crane Dynamics! Please don\'t hurt me! I just answer phones! Have you tried Chorus?! Sorry! Reflex!', 'Receptionist'); };
  SC.hq_admins = async (S) => {
    if (G.flag('hq_admins_done')) return;
    G.audio && G.audio.music('encounter_villain');
    await S.say('YOU?! AGAIN?! Do you ever go HOME?! Do you even HAVE a home?!', 'Admin Lark');
    await S.say('And the defector. Their score went from 3,880 to zero. Statistically, the most interesting thing that has ever happened on our platform.', 'Admin Grey');
    await S.approach('hqw', 'wren', { prefer: ['down', 'left', 'right'] });
    await S.say(`Two on two. Ready, ${P()}? Let's show them what a bond looks like when nobody's counting!`, WREN());
    const won = await G.storyBattle('grey2', { withTrainer: 'lark2', ally: 'wren_ally', double: true }); if (!won) { S.remove('hqw'); return; }
    await S.say('...Go. The Director is waiting. I estimate a twelve percent chance you change her mind. I\'m... rooting for twelve.', 'Admin Grey');
    await S.say('Ugh, fine! Not my problem! It is a LITTLE bit my problem! Whatever!', 'Admin Lark');
    S.remove('hq_grey'); S.remove('hq_lark');
    S.set('hq_admins_done');
    await S.say('I\'ll get Kaelen out. You go after Crane. Go go go!', WREN());
    await S.fadeOut(8); S.remove('hqw'); S.spawn({ id: 'hqw', x: 3, y: 3, look: 'wren', dir: 'left' }); await S.fadeIn(8);
    S.restoreMusic();
  };
  SC.hq_crane = async (S) => {
    if (!G.flag('hq_admins_done')) { await S.say('"Grey. Lark. Please remove the child. Gently. They\'re trending."', 'Director Crane'); return; }
    const N = 'Director Crane';
    S.facePlayer('hq_crane');
    S.music('crane');
    await S.say('So this is the Tamer who keeps unravelling my plans. You look so... young. I was young once. It was awful.', N);
    await S.say('Have you ever heard the voice of the one you love most... and then nothing? Twelve years of nothing.', N);
    await S.say('Every Chorus band in Solmere feeds its bond into my Engine. It\'s in the terms of service. Page four hundred. Nobody reads page four hundred.', N);
    await S.say('When I fire it, Orrelume will sing louder than it ever has. Loud enough to reach Lumi. Every bond in Solmere, borrowed for a moment. A small price for a miracle.', N);
    const k = await choose('Crane waits, genuinely curious what you\'ll say.', ['You\'re hurting everyone to fix your own pain.', 'Page four hundred?! That\'s evil. That\'s so evil.', 'Hale told me about the thirty seconds.'], N);
    await S.say([`Yes. I've done the math. I'm at peace with it. Mostly.`, `It's not evil. It's legal. Those are very different departments.`, `...Did she. Then she finally told someone the truth. Good for Marisol. It changes nothing.`][k], N);
    const won = await G.storyBattle('crane1'); if (!won) return;
    await S.say('...So your bond is real. Real enough to hurt me. Real enough to...', N);
    await S.say('No. It doesn\'t matter. The core is already on its way to the Lodestar. Goodbye, child. Log off.', N);
    G.audio && G.audio.sfx('warp'); await G.flashScreen('#ffffff', 20);
    S.remove('hq_crane');
    await S.say('Crane vanishes in a flash of white. A teleporter pad hums where she stood. Of course she has a teleporter.');
    await SC.hq_kaelen(S);
  };
  SC.hq_kaelen = async (S) => {
    if (!G.flag('hq_admins_done') || G.flag('hq_done')) { if (!G.flag('hq_admins_done')) await S.say('A tall man in a violet coat sits calmly in a glass cell, reading. He nods at you like you\'re late.'); return; }
    S.remove('hq_kaelen'); await S.approach('hq_kaelen', 'kaelen');
    await S.say('Thank you, both of you. Crane\'s people ambushed me while I was looking into her shipments. Very rude. I didn\'t get to finish my book.', 'Warden Kaelen');
    await S.say('The Lodestar is north across the water. But first, my gym. The dragons will want to measure you before you face her again.', 'Warden Kaelen');
    await S.say(`I'll help the police lock this place down. ${P()}... thanks. For not giving up on me. Even when I made it really easy.`, WREN());
    S.set('hq_done'); S.quest('main7', 'gym');
    G.persist.write();
    await S.fadeOut(20); S.remove('hq_kaelen'); S.remove('hqw'); await S.fadeIn(20);
  };
  SC.kaelen = async (S) => {
    const N = 'Warden Kaelen';
    S.facePlayer('kaelen_npc');
    if (G.flag('badge6')) { await S.say('North of the city, the sea route leads to the Lodestar. Go. Save the song. I\'d come, but I get seasick. Dragons don\'t help.', N); return; }
    await S.say('I was Champion once, before Sable. I learned that strength without a reason is just noise. Very loud noise. I was very loud.', N);
    await S.say('Now. Let\'s see if you can weather my storm.', N);
    const won = await G.storyBattle('kaelen'); if (!won) return;
    await S.say('The storm passes. The dragons respect you. So do I, which is rarer. The Wyrm Badge.', N);
    await wardenWin(S, { badge: 'wyrm', flag: 'badge6', name: N, tm: 'tm50', tmText: 'TM50: Dragon Pulse. A dragon\'s roar, given shape.', gymTrainers: ['sg_1', 'sg_2', 'sg_3'] });
    await S.say('Six badges. The Conclave will call. But first... the Lodestar. Surf north from the harbor. Go.', N);
    S.quest('main7', 'done'); S.quest('main8', 'go');
  };
  SC.iv_judge = async (S) => {
    S.facePlayer('skh1');
    const m = G.party.lead(); if (!m) return;
    const tot = G.STATS.reduce((a, s) => a + m.ivs[s], 0);
    await S.say(`${G.mon.name(m)}'s total potential: ${tot}/186. ${tot >= 170 ? 'OUTSTANDING. A gem among gems. I need to sit down.' : tot >= 130 ? 'Relatively superior! Tell your friends!' : tot >= 90 ? 'Above average! Like most people think they are!' : 'Decent potential. Bonds matter more anyway. That\'s what I tell myself.'}`, 'IV Judge');
    if (G.flag('champion') && !G.flag('got_caps')) { await S.say('For a Champion... Bottle Caps. Hyper Training maxes out an IV. Don\'t tell the purists.', 'IV Judge'); await S.give('bottlecap', 3); S.set('got_caps'); }
  };
  SC.hidden_power_guy = async (S) => {
    S.facePlayer('skh2');
    if (!G.flag('got_tm20')) { await S.say('In my day we made decoys out of straw to fool opponents. It never worked. This TM does. Decoy!', 'Old Strategist'); await S.give('tm20'); S.set('got_tm20'); return; }
    await S.say('A Decoy blocks status moves and soaks up hits. Pair it with a boosting move and watch your opponent get very quiet.', 'Old Strategist');
  };
  // ------------------------------------------------------------- THE LODESTAR
  SC.tl_grunt = async (S, ctx) => {
    S.facePlayer(ctx.ent.id);
    await S.say(G.pick(['The Director\'s at the top. We\'re supposed to stop you. But honestly? I just joined for the free hoodie.', 'Can you hear it? The song\'s getting quieter. That\'s not what the onboarding video said.', 'My score used to be 900. Now I can\'t feel my Echo. Is that... is that the Boost?']), 'Hollow Grunt');
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
    await S.say('You know the worst part? I LIKED it here. The Hollow was the first place that ever picked me. First. Not last. First.', N);
    await S.say('So I\'m not letting you through without a fight. That\'s just... who I am. I\'m a lot. I know.', N);
    const won = await G.storyBattle('lark3'); if (!won) return;
    await S.say('...Go. Stop her. Somebody has to, and it was never gonna be me. ...You\'re not a nerd. I take it back. You\'re a big nerd.', N);
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
    await S.say(`It's hurting them! Every Echo on the Mere is crying! Can't you hear it, Director?!`, P());
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
    await S.say('...It\'s okay... I\'m part of the song now... I always was... Let go, Vesper... and live...', '???');
    await S.say('Vesper Crane sinks to her knees and cries. For the first time she looks her age. And, somehow, lighter.', '');
    S.music('legend');
    await S.say('The leviathan turns its luminous eyes on you. It wants to test the bond that set it free!');
    const r = await G.startWild(null, { species: 'orrelume', lvl: 50, legend: true, noRandom: true, noRun: false });
    if (G.party.allMons().some(m => m.sp === 'orrelume')) S.set('orrelume_caught');
    else { S.set('orrelume_away'); await S.say('Orrelume dives beneath the waves with a long, echoing call. It sounded a little like "see you later."'); }
    await S.fadeOut(30);
    S.remove('top_crane');
    const hale = S.spawn({ id: 'toph', x: 5, y: 8, look: 'hale', dir: 'up' });
    const wr = S.spawn({ id: 'topw', x: 7, y: 8, look: 'wren', dir: 'up' });
    const sb = S.spawn({ id: 'tops', x: 6, y: 5, look: 'sable', dir: 'down' });
    await S.fadeIn(30);
    S.music('tidelight_calm');
    await S.say(`${P()}! You did it! Vesper turned herself in. She said she heard Lumi. That the song carried her voice.`, HALE);
    await S.say('I told her about the thirty seconds. To her face. She said, "I know, Marisol. I was there." Then she hugged me. I\'m still processing.', HALE);
    await S.say(`${P()}, that was UNREAL. I didn't film any of it. First time in my life. ...Oh. Uh. Hi, Sable.`, WREN());
    await S.say(`So you're the one ${R()} never shuts up about.`, 'Champion Sable');
    await S.say('I\'m Sable. Champion. I got here as fast as I could when the light went out. Looks like I arrived just in time to be completely unnecessary.', 'Champion Sable');
    await S.say('The Lodestar\'s shining. The Conclave\'s opened Victory Road, west of Route 1. I\'ll be waiting at the top. Don\'t make it easy.', 'Champion Sable');
    await S.say(`And ${R()}... I'm proud of you. I should've said it before you needed a leaderboard to hear it.`, 'Champion Sable');
    await S.fadeOut(20); S.remove('toph'); S.remove('topw'); S.remove('tops');
    S.set('tidelight_done'); S.quest('main8', 'done'); S.quest('main9', 'go');
    G.persist.write();
    await S.fadeIn(20);
    await S.say('The Lodestar\'s beam sweeps across the Mere once more.\\p{k}(Victory Road is open. Use the Wing Whistle to fly back to Fernwick, then head to Route 1.){w}');
  };
  SC.tl_hale = async (S) => {
    S.facePlayer('tl_hale');
    await S.say('I\'m going to study the Lodestar properly now. No machines. No deadlines. Just listening. Come here, let me heal your team.', HALE);
    await S.heal();
  };
  // ------------------------------------------------------------- VICTORY ROAD
  SC.rival4 = async (S) => {
    await S.approach('vrw', 'wren', { prefer: ['up', 'down', 'left', 'right'] });
    await S.emote('vrw', '!');
    await S.say(`${P()}. Knew you'd make it.`, WREN());
    await S.say('I\'ve been thinking. About what strength actually is. The Boost made my team strong, and it made them hurt, and I didn\'t care as long as the number went up.', WREN());
    await S.say('That wasn\'t strength. That was me being scared of getting left behind. By Sable. By you.', WREN());
    await S.say('No Boosts. No score. No camera. Just me and my team. One last battle before the Conclave. The real one.', WREN());
    const won = await G.storyBattle('rival4'); if (!won) { S.remove('vrw'); return; }
    S.set('rival4_done');
    await S.say(`Ha... hahaha! Best battle of my life, and nobody saw it but us. That's kind of perfect. Go on. Sable's waiting. And ${P()}... thanks. For everything.`, WREN());
    await S.fadeOut(10); S.remove('vrw'); await S.fadeIn(10);
  };
  // ------------------------------------------------------------- CONCLAVE
  SC.league_shop = async (S) => { S.facePlayer('cl_shop'); await G.openShop(['ultraorb', 'hyperpotion', 'maxpotion', 'fullrestore', 'revive', 'maxrevive', 'fullheal', 'maxether', 'elixir', 'xattack', 'xspatk', 'xspeed', 'maxrepel'], { greet: 'Last shop before the Conclave. Prices reflect that. Sorry. Not sorry.' }); };
  SC.league_guard = async (S) => {
    S.facePlayer('cl_guard');
    const N = 'Conclave Guard';
    if (G.save.badges.length < 6) { await S.say('Six badges to enter. That\'s the rule. It\'s a very old rule. It\'s on a plaque.', N); return; }
    await S.say('Beyond this door: the four members of the Conclave, then the Champion. Once you go in, there\'s no leaving until you win. Or lose. Mostly win, we hope.', N);
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
    await S.say(`${R()} has talked about you since the day you both got your first Echoes. How you always made them want to be better. How you never once gave up on them. Even when they made it really easy.`, N);
    await S.say('I\'ve heard every one of your adventures twice. Once on the news, and once from my little sibling at three in the morning.', N);
    await S.say('Everyone in Solmere is watching this. I stopped caring about that years ago. Let\'s make it worth watching anyway.', N);
    const won = await G.storyBattle('sable'); if (!won) return;
    await S.say('...Oh. So that\'s what it feels like. Huh. It\'s kind of great, actually.', N);
    await S.say(`From this moment, you're the Champion of Solmere, ${P()}. Welcome to the part where everyone wants a photo. Come on. The Hall of Fame.`, N);
    S.set('champion'); S.set('champion_scene_done');
    await S.move('sable_npc', 'l', 1); S.face('sable_npc', 'right');
    S.quest('main9', 'done');
  };
  SC.hall_of_fame = async (S) => {
    if (G.flag('hof_done') && !G.flag('hof_pending')) { return; }
    G.audio && G.audio.music('halloffame');
    await S.say('Sable leads you into a golden hall. Your partners\' names will be written here forever. Or until the building is renovated.', '');
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
    await S.say('Home. Your bed has never been this soft. Mom left a note on the pillow: "Proud of you. Soup in the fridge. Change your socks."\\p...\\pBut Professor Hale keeps calling, and there are strange rumors about the stars over Starfall Peak...');
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
    await S.say('The Wanderer smiles, tips their cap, and presses something into your hand. When you look up, the summit is empty. Show-off.');
    await S.give('crownorb');
    S.set('wanderer_done'); S.remove('sf_wanderer'); S.restoreMusic();
  };
  SC.nyxalis_encounter = async (S) => {
    await S.say('The stars over the crater flicker, and go out, one by one. Something made of night uncoils where the comet fell.');
    G.audio && G.audio.cry('nyxalis'); S.shake(30);
    await S.say('It opens its eyes. The whole sky holds its breath.');
    await G.startWild(null, { species: 'nyxalis', lvl: 65, legend: true, noRandom: true });
    S.set('nyxalis_done'); S.remove('sf_nyx');
    await S.say('The stars bloom back over Starfall Peak, brighter than before. Somewhere, Professor Hale just felt a disturbance in her graphs.');
    S.quest('post1', 'done');
  };
  SC.orrelume_return = async (S) => {
    await S.say('A soft song drifts up from the water. Orrelume came back. It looks like it\'s been waiting for you.');
    await G.startWild(null, { species: 'orrelume', lvl: 55, legend: true, noRandom: true });
    if (G.party.allMons().some(m => m.sp === 'orrelume')) { S.set('orrelume_caught'); S.remove('tl_orre'); }
  };
  // ------------------------------------------------------------- BATTLE SPIRE
  SC.spire_recep = async (S) => {
    S.facePlayer('spire_recep');
    const N = 'Spire Host';
    if (!G.flag('champion')) { await S.say('The Battle Spire is for Champions only. Come back when you\'ve conquered the Conclave. We\'ll be here. Being exclusive.', N); return; }
    const sp = G.save.spire; sp.bp = sp.bp || 0;
    await S.say(`Welcome to the Battle Spire! Seven battles in a row, three Echoes each, all at Level 50. Streak: ${sp.streak}. Best: ${sp.best}. BP: ${sp.bp}.`, N);
    if (G.save.party.filter(m => !m.egg).length < 3) { await S.say('It\'s three-on-three. Come back with at least three Echoes. Math is the first test.', N); return; }
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
      if (!r || r.outcome !== 'win') { sp.streak = 0; await S.say('Your streak has ended. Well fought! The Spire remembers. The Spire is petty.', N); G.persist.write(); return; }
      sp.streak++; sp.best = Math.max(sp.best, sp.streak); sp.bp += boss ? 10 : 1 + Math.floor(sp.streak / 7);
      if (n < 6 && !await G.yesno(`Victory! Streak: ${sp.streak}. Continue to battle ${n + 2}?`, { speaker: N })) { G.persist.write(); return; }
    }
    await S.say(`You conquered the Spire! Streak: ${sp.streak}. BP: ${sp.bp}. Spend it at the counter on the right. You've earned a little shopping.`, N);
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
      if (sp.bp < c) { await S.say('Not enough BP. Win more. That\'s the whole business model.', 'Exchange'); continue; }
      sp.bp -= c; G.bag.add(id); G.audio && G.audio.sfx('money'); G.toast('Got ' + G.ITEMS[id].name);
    }
  };
  // ------------------------------------------------------------- HAVENS & MARTS
  SC.nurse = async (S) => {
    const e = S.npc('nurse'); if (e) e.dir = 'down';
    const hc = G.save.settings.nuzlocke && G.save.settings.nuzRules.hardcore;
    await S.say(`Welcome to the Tamer Haven! Want me to fix your Echoes up?`, 'Nurse');
    const k = await G.ask('Heal your party?', ['Yes please', 'No thanks'], { speaker: 'Nurse' });
    if (k !== 0) { await S.say('Okay! Stay safe. Hydrate. Both of you.', 'Nurse'); return; }
    await S.say('One sec. Don\'t touch the machine. It bites.', 'Nurse');
    if (e) e.dir = 'left';
    await S.heal();
    if (e) e.dir = 'down';
    if (G.save.settings.nuzlocke && G.save.graveyard.length) await S.say('Your team is rested. And... I lit a candle for the ones who didn\'t make it. I always do.', 'Nurse');
    await S.say(G.pick(['All fixed! Good as new. Better, maybe. I\'m very good.', 'Done! They\'re rested, fed, and one of them winked at me.', 'Fully healed! Please stop fighting things that are bigger than you. You won\'t. But please.']), 'Nurse');
    const w = S.w; if (w.map.def.isHaven && G.save.returnTo) G.save.lastHeal = { map: w.map.id, x: 7, y: 6, back: { ...G.save.returnTo } };
  };
  SC.haven_board = async (S) => {
    const main = Object.keys(G.QUESTS).find(id => G.QUESTS[id].main && G.save.quests[id] && G.save.quests[id].step !== 'done');
    const Q = main ? G.QUESTS[main] : null;
    const st = Q ? ((Q.steps && Q.steps[G.save.quests[main].step]) || Q.desc) : 'No urgent news! Go catch something weird.';
    await S.say(`{c}TAMER BOARD{w} — Current goal:\\n${st}`, 'Haven Aide');
    const side = Object.keys(G.QUESTS).filter(id => !G.QUESTS[id].main && G.save.quests[id] && G.save.quests[id].step !== 'done');
    if (side.length) await S.say(`Open side quests: ${side.map(id => G.QUESTS[id].name).join(', ')}. Your Journal has the details.`, 'Haven Aide');
  };
  SC.haven_tips = async (S) => {
    S.facePlayer('hv1');
    await S.say(G.pick([
      'The PC in every Haven connects to your boxes. You can heal from it too. Nobody knows how. Don\'t ask.',
      'Held items like Leftovers or a Sun Berry turn losing battles around. Snacks win wars.',
      'Stat boosts reset when an Echo switches out. Status conditions don\'t. Burns are forever. Well, until you heal.',
      'Critical hits ignore the target\'s defense boosts and your Attack drops. Handy!',
      'Weather changes everything: rain powers Water, sun powers Fire, snow toughens Ice.',
      'Sparkling tall grass hides rare Echoes with perfect potential. And better shiny odds!',
      'Walk into weak wild Echoes you already own and you Sweep them. Chain sweeps for bonus EXP.',
      'Your walking buddy has moods. Face it and press Z. It has opinions.',
      'Tab toggles Turbo. Great for grinding. Or for impatient people. Like me.',
      'Q in battle shows every stat change and field effect. Knowledge is power. Power is also power.',
    ]), 'Old Tamer');
  };
  SC.haven_chat = async (S) => {
    S.facePlayer('hv2');
    const b = G.save.badges.length;
    await S.say(G.pick(b < 2 ? ['I want to be a Warden someday! Or a baker. Why not both. A baking Warden.', 'My Pipwing evolved yesterday! It\'s SO fluffy now. I can\'t find it half the time.'] : b < 4 ? ['My cousin joined the Crane Fellowship. His score is 2,000. He doesn\'t call anymore. He posts, though.', 'Glimmer Cave\'s crystals sing when the wind blows through them. Or when Admins yell in them.'] : ['The Lodestar\'s beam looked weaker last night. That\'s bad, right? That feels bad.', 'They say Champion Sable has never lost a battle in Solmere. Must be exhausting.']), 'Tamer');
  };
  SC.mart_clerk = async (S) => { S.facePlayer('clerk'); await G.openShop(G.martStock()); };
  SC.mart_chat = async (S) => { S.facePlayer('mt1'); await S.say(G.pick(['Buy ten Orbs at once and they throw in a free Heal Orb! Capitalism, but nice.', 'Repels are a must for caves. Trust me. I\'ve seen things.', 'The shop gets better stuff as you earn badges. Loyalty program. It\'s just badges.']), 'Shopper'); };
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
    await G.openShop(stock, { greet: 'Local specialties! Things you can only get here. Or online. But here!', speaker: 'Clerk' });
  };
  SC.sky_special = async (S) => {
    S.facePlayer('clerk2');
    await G.openShop(['lifegem', 'powerband', 'focuslens', 'swiftscarf', 'leftovers', 'guardvest', 'spikedhelm', 'expertbelt', 'scopelens', 'widelens', 'gritsash', 'linkcord', 'abilitycapsule', 'leafstone', 'tidestone', 'voltstone', 'tm26', 'tm24', 'tm13', 'tm04', 'tm01'], { greet: 'Skyreach Supply. The finest held items in Solmere. Priced accordingly.', speaker: 'Clerk' });
  };
  // ------------------------------------------------------ map patches
  // extra NPCs that belong to later story beats
  G.MAPDEFS.duskmere.objs.push({ type: 'npc', id: 'dm_hale', x: 15, y: 20, look: 'hale', dir: 'up', script: 'dusk_hale', cond: ['badge4', '!got_surf'] });
  G.MAPDEFS.tidelight.objs.push({ type: 'npc', id: 'tl_orre', x: 12, y: 22, monSprite: 'orrelume', dir: 'up', script: 'orrelume_return', cond: ['champion', 'orrelume_away', '!orrelume_caught'] });
  G.MAPDEFS.victorygate.objs = [
    { type: 'npc', id: 'gateguard', x: 5, y: 2, look: 'officer', dir: 'down', script: 'gate_guard', cond: '!vr_open' },
    { type: 'npc', id: 'gateguard2', x: 4, y: 2, look: 'officer', dir: 'right', text: 'Victory Road lies beyond. Good luck, Tamer. Hydrate.', cond: 'vr_open' },
  ];
  G.MAPDEFS.route2.objs.forEach(o => { if (o.id === 'r2_i3') o.item = 'tm11'; });
  G.MAPDEFS.lh1.warps[1].cond = 'lh_grey_done';
  G.MAPDEFS.lh1.objs.push({ type: 'trigger', x: 10, y: 3, w: 1, h: 1, script: 'lh_grey', cond: '!lh_grey_done' });
  G.MAPDEFS.lh2.objs.push({ type: 'trigger', x: 2, y: 3, w: 2, h: 1, script: 'lh_lark', cond: '!lh_lark_done' });
  G.MAPDEFS.hof.warps = [{ x: 6, y: 8, to: 'conclave', tx: 9, ty: 13, dir: 'down', cond: 'hof_done' }];
  G.MAPDEFS.champ.objs.push({ type: 'npc', id: 'sable_npc2', x: 5, y: 2, look: 'sable', dir: 'down', script: 'champion_rematch', cond: ['champion_scene_done', 'hof_done'] });
  G.eliteRematch = function (id) {
    const rid = id + '_r'; const T = G.TRAINERS[id];
    if (!G.TRAINERS[rid]) G.TRAINERS[rid] = { ...T, party: T.party.map(p => ({ ...p, lvl: p.lvl + 16 })), intro: 'Welcome back, Champion. I\'ve been practicing. Out of spite. Let\'s go.', defeat: T.defeat };
    return rid;
  };
  SC.champion_rematch = async (S) => {
    S.facePlayer('sable_npc2');
    if (!await G.yesno('Back for another round, Champion? Fine. But I\'ve been training too.', { speaker: 'Sable' })) return;
    const won = await G.storyBattle('sable_rematch');
    if (won) await S.say('You keep getting stronger. It\'s honestly annoying. Solmere\'s lucky to have you.', 'Sable');
  };
  G.vibe = vibe;
})();
