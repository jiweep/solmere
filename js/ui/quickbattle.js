'use strict';
// =============================================================================
//  Quick Battle (title menu): a straight battle at Level 50, no save needed. Bring a random team, build one
//  Echo by Echo, or bring the team from a saved journey; face a bot at one of four skill levels, single or
//  double. Wins are counted per level. (Link Battles against a friend live in Play Together.)
// =============================================================================
G.quickBattle = (() => {
  const LEVELS = [
    { name: 'Novice', ai: 1, desc: 'Picks moves almost at random. A gentle warm-up.', cls: 'Youngster', look: 'boy' },
    { name: 'Tamer', ai: 2, desc: 'Knows its types and uses them.', cls: 'Tamer', look: 'ace' },
    { name: 'Ace', ai: 3, desc: 'Switches, sets up, and punishes mistakes.', cls: 'Ace Tamer', look: 'ace_f' },
    { name: 'Champion', ai: 4, desc: 'Plays to win, with held items. Bring your best.', cls: 'Champion', look: 'veteran' },
  ];
  const TEAMS = ['Random', 'Build', 'From a save'];
  const NAMES = ['Rhea', 'Ivo', 'Nell', 'Cato', 'Juno', 'Pax', 'Otto', 'Vera', 'Zane', 'Lux', 'Rune', 'Tamsin', 'Oren', 'Kit', 'Wade'];
  const ENVS = ['grass', 'forest', 'water', 'snow', 'volcano', 'cave', 'league'];
  const ITEMS = ['leftovers', 'lifegem', 'sunberry', 'focuslens', 'swiftscarf', 'guardvest', 'expertbelt', 'scopelens'];
  const LV = 50;
  const set = { team: 0, level: 1, format: 0, size: 1 };
  const pool = () => G.DEX.map(id => G.SPECIES[id]).filter(s => s && !s.legend && s.final && G.monArt.has(s.id));
  const build = sp => { const m = G.mon.create(sp, LV, { ivs: Object.fromEntries(G.STATS.map(s => [s, 20])) }); m.moves = G.mon.bestMoves(m).map(id => G.mon.newMove(id)); return m; };
  const stats = () => { try { return JSON.parse(localStorage.getItem('solmere_quick') || '{}'); } catch (e) { return {}; } };
  const record = (lvl, won) => { const s = stats(), k = LEVELS[lvl].name; s[k] = s[k] || { w: 0, l: 0 }; s[k][won ? 'w' : 'l']++; try { localStorage.setItem('solmere_quick', JSON.stringify(s)); } catch (e) { } };
  const size = () => [3, 6][set.size];

  function setup() {
    const cyc = (k, n) => d => { set[k] = (set[k] + d + n) % n; };
    const rec = () => { const r = stats()[LEVELS[set.level].name]; return r ? ` Your record: ${r.w} won, ${r.l} lost.` : ''; };
    const rows = () => [
      { label: 'Your team', name: () => TEAMS[set.team], step: cyc('team', 3), desc: () => ['A random team of fully evolved Echoes.', 'Choose each Echo yourself.', 'The team from one of your saved journeys, at Level 50.'][set.team] },
      { label: 'Opponent', name: () => LEVELS[set.level].name, step: cyc('level', 4), desc: () => LEVELS[set.level].desc + rec() },
      { label: 'Format', name: () => ['Single', 'Double'][set.format], step: cyc('format', 2), desc: () => ['One Echo each at a time.', 'Two Echoes each at a time.'][set.format] },
      { label: 'Team size', name: () => String(size()), step: cyc('size', 2), desc: () => 'Echoes on each side. Everyone fights at Level 50.' },
      { label: 'Battle!', start: true, desc: () => 'Link Battles against a friend are in Play Together.' },
    ];
    return new Promise(res => G.push(new G.SideList({ title: 'Quick Battle', rows, y: 78, w: 196, maxRows: 6 }, ok => res(!!ok))));
  }
  async function myTeam() {
    const n = size();
    if (set.team === 0) return G.shuffle(pool().slice()).slice(0, n).map(s => build(s.id));
    if (set.team === 2) {
      const s = await G.pickSlot('Bring which team?', true); if (!s) return null;
      const sv = G.persist.read(s), party = ((sv && sv.party) || []).filter(m => !m.egg).slice(0, n).map(m => G.mon.clone(m));
      if (!party.length) { await G.say('That journey has no Echoes yet.'); return null; }
      for (const m of party) { G.mon.setLevel(m, LV); m.dead = false; G.mon.healFull(m); }
      return party;
    }
    const all = pool().sort((a, b) => a.name.localeCompare(b.name)), team = [];
    while (team.length < n) {
      const items = all.map(s => ({ label: s.name, right: s.types.map(G.cap).join('/') }));
      if (team.length) items.unshift({ label: `Done (${team.length})`, right: '' });
      const k = await G.choose(items, { x: 150, y: 14, w: 180, maxRows: 14, title: `Echo ${team.length + 1} of ${n}`, cancel: -1 });
      if (k < 0) { if (!team.length) return null; team.pop(); continue; }
      if (team.length && k === 0) break;
      team.push(build(all[k - (team.length ? 1 : 0)].id));
    }
    return team;
  }
  function botTrainer() {
    const L = LEVELS[set.level], mons = G.shuffle(pool().slice()).slice(0, size());
    const items = G.shuffle(ITEMS.slice());
    G.TRAINERS.quick_bot = {
      cls: L.cls, name: G.pick(NAMES), look: L.look, ai: L.ai, money: 0, noRematch: true, intro: '', defeat: 'Good battle!', music: set.level === 3 ? 'champion' : 'spire_battle', resonate: set.level === 3,
      party: mons.map((s, i) => ({ sp: s.id, lvl: LV, moves: build(s.id).moves.map(x => x.id), item: set.level >= 3 ? items[i % items.length] : null })),
    };
    return 'quick_bot';
  }
  async function fight(team) {
    for (const m of team) { G.mon.healFull(m); m.status = null; }
    // battles need a world under them (the title has none): a hidden one, made on the first fight
    if (!G.world.scene) { G.maps.reset(); const w = new G.WorldScene(); w.enterMap('brinehollow', 18, 9, 'down', { noScript: true, noBanner: true }); w.hiddenForShowcase = true; G.push(w); }
    const tid = G.TRAINERS.quick_bot ? 'quick_bot' : botTrainer();
    const r = await G.runBattle({ foes: [G.makeTrainerCfg(tid)], format: set.format ? 'double' : 'single', music: G.TRAINERS[tid].music, env: G.pick(ENVS), playerParty: team, exp: false, noMoney: true, noPost: true, canLose: true, noRun: true });
    return r && r.outcome === 'win';
  }
  async function start() {
    const P = G.save;
    G.showcaseSave(); G.save.settings.god = false; G.save.god.invincible = false; G.save.settings.difficulty = 'normal';
    try {
      while (true) {
        if (!await setup()) return;   // the sandbox save stays loaded (the hidden world reads it) until we leave
        const team = await myTeam(); if (!team) continue;
        G.showcaseSave(); G.save.settings.god = false; G.save.god.invincible = false; G.save.settings.difficulty = 'normal';
        delete G.TRAINERS.quick_bot; botTrainer();
        let again = true;
        while (again) {
          const won = await fight(team); record(set.level, won);
          const s = stats()[LEVELS[set.level].name];
          const k = await G.ask(`${won ? 'You won!' : 'You lost.'} Against ${LEVELS[set.level].name} bots: ${s.w} won, ${s.l} lost.`, ['Rematch', 'New battle', 'Back to title']);
          if (k === 2 || k < 0) return;
          again = k === 0;
        }
      }
    } finally {
      const w = G.world.scene; if (w && w.hiddenForShowcase) G.pop(w);
      G.save = P; delete G.TRAINERS.quick_bot;
    }
  }
  return { start, LEVELS, set, _build: build, _bot: botTrainer };
})();
