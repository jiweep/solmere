'use strict';
// =============================================================================
//  Daily Tide: a ten-minute run, the same for everyone on the same day. Draft a partner from three, then
//  climb seven tides of battles. After each win, take one of three rewards: a new Echo for the team (up to
//  three), a Tide Rune that bends the rules for the rest of the run, training, or rest. HP carries over;
//  the seventh tide is the Tidewarden. Every day has its own weather. The result is a line of squares you
//  can paste anywhere, and the day's best score is kept.
// =============================================================================
G.dailyTide = (() => {
  const EPOCH = Date.UTC(2026, 8, 1);
  const today = () => { const d = new Date(); return d.getUTCFullYear() + '-' + String(d.getUTCMonth() + 1).padStart(2, '0') + '-' + String(d.getUTCDate()).padStart(2, '0'); };
  const dayNo = () => Math.floor((Date.now() - EPOCH) / 864e5) + 1;
  const FLOORS = 7;
  const WEATHER = [[null, 'Slack Tide', 'Calm water. No weather.'], ['rain', 'Storm Tide', 'Rain in every battle: Water moves surge, Fire fizzles.'], ['sun', 'Sun Tide', 'Harsh sun in every battle: Fire blazes, Water steams off.'], ['sand', 'Dust Tide', 'A sandstorm rages in every battle.'], ['snow', 'Frost Tide', 'Snow in every battle: Ice types dig in.']];
  // Tide Runes: run-wide rules, applied through the damage hook and between battles
  const RUNES = {
    glass: { name: 'Glass Cannon', desc: 'Your hits +30%. Their hits on you +20%.', col: '#ff7a5a' },
    undertow: { name: 'Undertow', desc: 'Super-effective hits +30%.', col: '#3b82e0' },
    laststand: { name: 'Last Stand', desc: '+50% damage while below 1/3 HP.', col: '#e8484a' },
    bulwark: { name: 'Bulwark', desc: 'Take 25% less from super-effective hits.', col: '#8aa0b8' },
    crits: { name: 'Crit Current', desc: 'Your critical hits hit 50% harder.', col: '#ffe070' },
    momentum: { name: 'Momentum', desc: 'Each tide cleared: +5% damage, stacking.', col: '#ff7ad8' },
    secondwind: { name: 'Second Wind', desc: 'Heal 35% HP after every battle.', col: '#3ed16b' },
    typetide: { name: t => G.cap(t) + ' Tide', desc: t => `${G.cap(t)} moves +40%.`, col: t => G.TYPE_COLORS[t] },
  };
  const rname = r => typeof RUNES[r.id].name === 'function' ? RUNES[r.id].name(r.arg) : RUNES[r.id].name;
  const rdesc = r => typeof RUNES[r.id].desc === 'function' ? RUNES[r.id].desc(r.arg) : RUNES[r.id].desc;
  const rcol = r => typeof RUNES[r.id].col === 'function' ? RUNES[r.id].col(r.arg) : RUNES[r.id].col;
  let run = null;
  // damage hook: side 0 is the player
  function dmgHook(b, t, m, eff, crit) {
    if (!run) return 1;
    let k = 1;
    for (const r of run.runes) {
      if (b.side === 0) {
        if (r.id === 'glass') k *= 1.3;
        if (r.id === 'undertow' && eff > 1) k *= 1.3;
        if (r.id === 'laststand' && b.hp / b.maxhp < 1 / 3) k *= 1.5;
        if (r.id === 'crits' && crit) k *= 1.5;
        if (r.id === 'momentum') k *= 1 + .05 * run.floor;
        if (r.id === 'typetide' && m.type === r.arg) k *= 1.4;
      } else {
        if (r.id === 'glass') k *= 1.2;
        if (r.id === 'bulwark' && eff > 1) k *= .75;
      }
    }
    return k;
  }
  // everything random about the day comes from one seeded generator
  function withSeed(rng, fn) { const keep = G.rng; G.rng = rng; try { return fn(); } finally { G.rng = keep; } }
  function pools() {
    const all = G.DEX.map(id => G.SPECIES[id]).filter(s => s && !s.legend && G.monArt.has(s.id));
    return { mid: all.filter(s => s.stage === 2 || (s.final && s.stage !== 3)), fin: all.filter(s => s.final) };
  }
  const LOOKS = [['Ace Tamer', 'ace'], ['Ace Tamer', 'ace_f'], ['Veteran', 'veteran'], ['Blackbelt', 'blackbelt'], ['Mystic', 'mystic'], ['Swimmer', 'swimmer'], ['Hiker', 'hiker'], ['Punk', 'punk'], ['Lady', 'lady'], ['Sailor', 'sailor']];
  const NAMES = ['Rhea', 'Ivo', 'Nell', 'Cato', 'Juno', 'Pax', 'Mira', 'Otto', 'Vera', 'Zane', 'Lux', 'Rune', 'Tamsin', 'Oren', 'Kit', 'Wade'];
  function makeRun() {
    const day = today(), R = new G.RNG('tide|' + day), P = pools();
    const [w, wname, wdesc] = R.pick(WEATHER);
    const drafts = R.shuffle(P.mid.slice()).slice(0, 3).map(s => s.id);
    const floors = [];
    for (let f = 0; f < FLOORS; f++) {
      const boss = f === FLOORS - 1, [cls, look] = boss ? ['Tidewarden', 'wanderer'] : R.pick(LOOKS);
      const n = boss ? 3 : Math.min(3, 1 + Math.floor((f + 1) / 2)), lvl = boss ? 47 : 25 + f * 3;
      const party = R.shuffle((boss || f >= 4 ? P.fin : P.mid).slice()).slice(0, n).map(s => ({ sp: s.id, lvl, item: boss ? R.pick(['leftovers', 'lifegem', 'sunberry', 'expertbelt']) : null }));
      floors.push({ cls, look, name: boss ? 'Maren' : R.pick(NAMES), party, boss });
    }
    const types = Object.keys(G.TYPE_COLORS).filter(t => t !== 'normal');
    const offers = [];
    for (let f = 0; f < FLOORS - 1; f++) {
      const ro = R.shuffle(Object.keys(RUNES).slice()).slice(0, 2).map(id => ({ id, arg: id === 'typetide' ? R.pick(types) : null }));
      offers.push({ echo: R.pick(P.mid).id, runes: ro });
    }
    return { day, no: dayNo(), weather: w, wname, wdesc, drafts, floors, offers, team: [], runes: [], floor: 0, score: 0, marks: [] };
  }
  // ------------------------------------------------------------ card picker
  // three (or four) cards across the screen; ◀ ▶ choose, Z take. Each card: { title, sub, desc, img, col }
  function cards(head, list, o = {}) {
    return new Promise(res => G.push({
      opaque: true, i: 0, t: 0,
      update(top) {
        this.t++; if (!top) return; const I = G.input, n = list.length;
        if (I.repeat('left')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
        if (I.repeat('right')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
        if (I.pressed('a')) { I.consume('a'); G.audio && G.audio.sfx('select'); G.pop(this); res(this.i); }
        if (o.cancel && I.pressed('b')) { I.consume('b'); G.pop(this); res(-1); }
      },
      draw(b) { G.menuBG(b, '#1a5a7a', '#070b1c', this.t / 60); },
      drawUI() {
        const U = G.ui, n = list.length, w = n > 3 ? 86 : 104, gap = 10, x0 = (G.W - (n * w + (n - 1) * gap)) / 2;
        U.text(head, G.W / 2, 12, { size: 10, weight: 900, align: 'center', color: '#ffffff', outline: '#0a1020' });
        if (o.sub) U.text(o.sub, G.W / 2, 27, { size: 6.2, weight: 700, align: 'center', color: '#9fdcf0' });
        list.forEach((c, k) => {
          const sel = k === this.i, e = G.ease.outBack(G.clamp((this.t - k * 3) / 12, 0, 1)), x = x0 + k * (w + gap), y = 44 - (sel ? 6 : 0) + (1 - e) * 60;
          U.pick(x, y, w, 146, sel, () => { this.i = k; }, () => { this.i = k; G.input.tap('a'); });
          U.shape(x + 3, y + 4, w, 146, 6, 'rgba(0,0,0,.45)');
          U.shape(x, y, w, 146, 6, sel ? '#141a2e' : '#0e1222', c.col || '#8af0e0', sel ? 2 : 1);
          U.shape(x, y, w, 20, 6, c.col || '#8af0e0');
          U.text(c.kind || '', x + w / 2, y + 5, { size: 6, weight: 900, align: 'center', color: '#0a0e1a' });
          if (c.img) U.img(c.img, x + w / 2 - c.img.width * .4, y + 22 + (sel ? Math.sin(this.t / 10) * 1.5 : 0), { scale: .8 });
          U.text(c.title, x + w / 2, y + 102, { size: 7.4, weight: 900, align: 'center', color: '#ffffff' });
          if (c.sub) U.text(c.sub, x + w / 2, y + 112, { size: 5.6, weight: 700, align: 'center', color: '#ffe070' });
          U.wrap(c.desc || '', w - 12, 5.6).slice(0, c.img ? 2 : 3).forEach((l, j) => U.text(l, x + w / 2, y + 122 + j * 7.5, { size: 5.6, align: 'center', color: '#c8d4e8' }));
        });
        U.text('◀ ▶ choose · Z take', G.W / 2, 200, { size: 6, align: 'center', color: 'rgba(255,255,255,.6)' });
      },
    }));
  }
  const echoCard = (id, lvl, kind) => { const s = G.SPECIES[id]; return { kind, title: s.name, sub: s.types.map(G.cap).join(' / ') + ' · Lv ' + lvl, desc: s.dex, img: G.monArt.front(id, false, 0), col: G.TYPE_COLORS[s.types[0]] }; };
  // ------------------------------------------------------------ the run
  const hpFrac = () => { const t = run.team; return t.reduce((a, m) => a + m.hp, 0) / Math.max(1, t.reduce((a, m) => a + G.mon.maxHP(m), 0)); };
  async function battle(f) {
    const F = run.floors[f], tid = 'tide_' + f;
    G.TRAINERS[tid] = { cls: F.cls, name: F.name, look: F.look, ai: F.boss ? 4 : 3, money: 0, boss: F.boss, resonate: F.boss, music: F.boss ? 'champion' : 'spire_battle', noRematch: true, env: F.boss ? 'league' : ['grass', 'forest', 'water', 'snow', 'volcano', 'crystal'][f % 6],
      party: F.party, intro: '', defeat: F.boss ? 'The tide goes out. You held.' : '' };
    const r = await G.runBattle({ foes: [G.makeTrainerCfg(tid)], format: 'single', music: G.TRAINERS[tid].music, boss: F.boss, env: G.TRAINERS[tid].env, playerParty: run.team, exp: false, noMoney: true, noPost: true, canLose: true, noRun: true, weather: run.weather, dmgHook, noClips: false });
    return r && r.outcome === 'win';
  }
  async function start() {
    run = makeRun();
    const P = G.save;   // keep whatever save was loaded (the title has none)
    G.showcaseSave(); G.save.settings.god = false; G.save.god.invincible = false; G.save.settings.difficulty = 'normal';
    if (!G.world.scene) { G.maps.reset(); const w = new G.WorldScene(); w.enterMap('brinehollow', 18, 9, 'down', { noScript: true, noBanner: true }); w.hiddenForShowcase = true; G.push(w); }
    try {
      const k = await cards(`Daily Tide #${run.no}`, run.drafts.map(id => echoCard(id, 28, 'PARTNER')), { sub: `${run.wname}: ${run.wdesc}` });
      run.team = [withSeed(new G.RNG('tide-team|' + run.day + k), () => G.mon.create(run.drafts[k], 28, { ivs: Object.fromEntries(G.STATS.map(s => [s, 20])) }))];
      for (let f = 0; f < FLOORS; f++) {
        run.floor = f;
        await G.say(`{c}TIDE ${f + 1} OF ${FLOORS}{w}${run.floors[f].boss ? '  ·  The Tidewarden waits.' : ''}\\n${run.runes.length ? 'Runes: ' + run.runes.map(rname).join(', ') : 'No runes yet.'}`, { auto: 70 });
        const won = await battle(f);
        if (!won) { run.marks.push('🟥'); break; }
        const hf = hpFrac();
        run.marks.push(hf >= .6 ? '🟦' : hf >= .25 ? '🟩' : '🟨');
        run.score += 800 + 100 * f + Math.round(600 * hf) + (run.floors[f].boss ? 2000 : 0);
        if (run.runes.some(r => r.id === 'secondwind')) for (const m of run.team) m.hp = Math.min(G.mon.maxHP(m), m.hp + Math.round(G.mon.maxHP(m) * .35));
        if (f === FLOORS - 1) break;
        // rewards
        const O = run.offers[f], lvl = run.team[0].lvl, list = [];
        if (run.team.length < 3) list.push({ ...echoCard(O.echo, lvl, 'NEW ECHO'), act: 'echo' });
        for (const r of O.runes) list.push({ kind: 'TIDE RUNE', title: rname(r), desc: rdesc(r), col: rcol(r), act: 'rune', r });
        list.push({ kind: 'TRAIN', title: '+4 Levels', desc: 'Your whole team grows four levels (and heals what it gains).', col: '#8af0a0', act: 'train' });
        list.push({ kind: 'REST', title: 'Full Heal', desc: 'Everyone back to full HP and cured.', col: '#ffffff', act: 'rest' });
        const pickL = list.slice(0, 4);
        const c = pickL[await cards('Take one', pickL, { sub: `Tide ${f + 1} cleared · ${run.score.toLocaleString()} pts` })];
        if (c.act === 'echo') run.team.push(G.mon.create(O.echo, lvl, { ivs: Object.fromEntries(G.STATS.map(s => [s, 20])) }));
        if (c.act === 'rune') run.runes.push(c.r);
        if (c.act === 'train') for (const m of run.team) { const before = G.mon.maxHP(m); G.mon.setLevel(m, m.lvl + 4); m.hp += G.mon.maxHP(m) - before; }
        if (c.act === 'rest') for (const m of run.team) G.mon.healFull(m);
      }
      await results();
    } finally {
      const w = G.world.scene; if (w && w.hiddenForShowcase) G.pop(w);
      G.save = P;
      run = null;
    }
  }
  function store() {
    let all = {}; try { all = JSON.parse(localStorage.getItem('solmere_tide') || '{}'); } catch (e) { }
    const prev = all[run.day];
    if (!prev || run.score > prev.score) all[run.day] = { score: run.score, marks: run.marks.join(''), no: run.no };
    try { localStorage.setItem('solmere_tide', JSON.stringify(all)); } catch (e) { }
    return all[run.day];
  }
  function shareText(best) {
    const cleared = run.marks.filter(m => m !== '🟥').length, row = run.marks.join('') + '⬛'.repeat(FLOORS - run.marks.length);
    return `Solmere Daily Tide #${run.no} 🌊\n${row} ${cleared}/${FLOORS}\n${run.score.toLocaleString()} pts · ${run.wname}\njiweep.github.io/solmere`;
  }
  async function results() {
    const best = store(), text = shareText(best), cleared = run.marks.filter(m => m !== '🟥').length;
    G.audio && G.audio.music(cleared === FLOORS ? 'victory_champion' : 'victory_wild');
    const k = await new Promise(res => G.push({
      opaque: true, t: 0, i: 0,
      update(top) { this.t++; if (!top) return; const I = G.input; if (I.repeat('left') || I.repeat('right')) this.i = 1 - this.i; if (I.pressed('a')) { I.consume('a'); G.pop(this); res(this.i); } if (I.pressed('b')) { I.consume('b'); G.pop(this); res(1); } },
      draw(b) { G.menuBG(b, cleared === FLOORS ? '#7a5a1a' : '#1a3a5a', '#070b1c', this.t / 60); },
      drawUI() {
        const U = G.ui;
        U.text(cleared === FLOORS ? 'THE TIDE IS YOURS' : 'THE TIDE TURNED', G.W / 2, 26, { size: 14, weight: 900, align: 'center', color: cleared === FLOORS ? '#ffe070' : '#9fdcf0', outline: '#0a0a14' });
        U.text(`Daily Tide #${run.no} · ${run.wname}`, G.W / 2, 48, { size: 7, weight: 700, align: 'center', color: '#c8d4e8' });
        const sq = 18, x0 = G.W / 2 - (FLOORS * (sq + 4)) / 2;
        for (let i = 0; i < FLOORS; i++) { const m = run.marks[i], col = !m ? '#2a2e40' : m === '🟦' ? '#3b82e0' : m === '🟩' ? '#3ed16b' : m === '🟨' ? '#f2c23b' : '#e8484a'; const e = G.ease.outBack(G.clamp((this.t - i * 5) / 12, 0, 1)); U.shape(x0 + i * (sq + 4), 64 + (1 - e) * 20, sq, sq, 3, col); }
        U.text(run.score.toLocaleString() + ' pts', G.W / 2, 96, { size: 16, weight: 900, align: 'center', color: '#ffffff', outline: '#0a0a14' });
        U.text(`Today's best: ${best.score.toLocaleString()}`, G.W / 2, 118, { size: 6.6, weight: 700, align: 'center', color: '#9fdcf0' });
        U.text('Team: ' + run.team.map(m => `${G.SPECIES[m.sp].name} Lv${m.lvl}`).join(' · '), G.W / 2, 132, { size: 6, align: 'center', color: '#c8d4e8' });
        if (run.runes.length) U.text('Runes: ' + run.runes.map(rname).join(' · '), G.W / 2, 142, { size: 6, align: 'center', color: '#ffb0e0' });
        ['Copy result', 'Done'].forEach((lb, j) => { const x = G.W / 2 - 84 + j * 88, sel = this.i === j; U.shape(x, 162, 80, 16, 4, sel ? '#ff3b4e' : '#141828'); U.text(lb, x + 40, 166, { size: 7, weight: 900, align: 'center', color: '#fff' }); U.hot(x, 162, 80, 16, () => { this.i = j; }, () => { this.i = j; G.input.tap('a'); }); });
        U.text('Come back tomorrow for a new tide.', G.W / 2, 190, { size: 5.8, align: 'center', color: 'rgba(255,255,255,.55)' });
      },
    }));
    if (k === 0) {
      try { await navigator.clipboard.writeText(text); G.toast('Result copied. Paste it anywhere!'); } catch (e) { G.toast('Couldn\'t reach the clipboard here.'); }
      await G.say(text.replace(/\n/g, '\\n'));
    }
  }
  function best() { try { return JSON.parse(localStorage.getItem('solmere_tide') || '{}')[today()] || null; } catch (e) { return null; } }
  return { start, best, today, dayNo, dmgHook };
})();
