'use strict';
// =============================================================================
//  Visible wild mons: the grass, water and cave floors are alive with the mons that live there, so every
//  battle is one you walked into on purpose. They have moods: most graze and wander, curious ones come
//  over for a look, bold ones spot you ("!") and charge, and ones far weaker than your lead bolt. Walk into
//  a weak mon of a species you've already caught and it's Swept: a flash, a burst of EXP, no battle
//  screen. Press A on one (or meet anything new, rare or shiny) and it's a real battle. Shinies glitter
//  where they stand, so you can spot one from across the field.
// =============================================================================
G.wilds = (() => {
  const MAX = 4, SWEEP_GAP = 5;
  const pops = [];   // floating "SWEEP +exp" labels, in world pixels
  const on = () => G.settings.encounters !== 'classic' && !(G.save && G.save.god && G.save.god.noEnc);
  const list = w => w.ents.filter(e => e.kind === 'wild');
  function tableAt(w, x, y) {
    const c = w.cellAt(x, y), enc = w.map.def.enc; if (!c || !enc) return null;
    if (c.water && c.g !== 'bridge' && c.g !== 'bridgev') return enc.surf ? 'surf' : null;
    if (c.enc === 'grass' && enc.grass) return 'grass';
    if (c.enc === 'cave' && enc.cave) return 'cave';
    return null;
  }
  const lead = () => G.save.party.find(m => m.hp > 0 && !m.egg) || null;
  const dist = (e, p) => Math.abs(e.x - p.x) + Math.abs(e.y - p.y);
  const free = (w, e, x, y) => {
    const p = w.player, f = w.follower;
    if ((p.x === x && p.y === y) || (p.tx === x && p.ty === y)) return false;
    if (f && ((f.x === x && f.y === y) || (f.tx === x && f.ty === y))) return false;
    if (tableAt(w, x, y) !== e.table || w.entAt(x, y, e)) return false;
    return e.table === 'surf' || !w.blocked(x, y, e);
  };
  function spawn(w) {
    const p = w.player, all = list(w);
    const cand = [];
    for (let y = p.y - 7; y <= p.y + 7; y++) for (let x = p.x - 11; x <= p.x + 11; x++) {
      const d = Math.abs(x - p.x) + Math.abs(y - p.y); if (d < 4) continue;
      const t = tableAt(w, x, y); if (!t) continue;
      if (t === 'surf' && !w.surfing && all.some(e => e.table === 'surf')) continue;   // one swimmer to look at from the shore
      if (w.entAt(x, y) || all.some(e => Math.abs(e.x - x) + Math.abs(e.y - y) < 3)) continue;
      cand.push([x, y, t]);
    }
    if (!cand.length) return;
    const [x, y, t] = G.pick(cand);
    let enc = G.rollEncounter(w.map, t); if (!enc) return;
    const E = w.map.def.enc;
    // a Catch Combo (catches from Great-or-better throws in a row) draws rarer and shinier Echoes out
    const cc = (G.save.vars && G.save.vars.catchCombo) || 0, tier = cc >= 10 ? 3 : cc >= 6 ? 2 : cc >= 3 ? 1 : 0;
    if (t === 'grass' && E.rare && G.rand() < [.07, .12, .18, .25][tier]) enc = { sp: G.pick(E.rare.list)[0], lvl: enc.lvl + 2 };   // the odd rare one, a little tougher
    const L = lead();
    if (G.save.repel > 0 && L && enc.lvl < L.lvl) return;
    const mon = G.makeWild(enc.sp, enc.lvl, { comboMult: [1, 2, 4, 8][tier] });
    const weak = L && L.lvl - mon.lvl >= SWEEP_GAP, r = G.rand();
    const mood = weak ? 'shy' : r < .16 ? 'bold' : r < .4 ? 'curious' : 'calm';
    const e = new G.Ent({ id: 'wild' + (++w._wildN || (w._wildN = 1)), x, y, dir: G.pick(['up', 'down', 'left', 'right']), kind: 'wild', monSprite: mon.sp, shiny: mon.shiny, mon, table: t, mood, life: G.randInt(60 * 35, 60 * 70) });
    e.wanderT = G.randInt(20, 90);
    w.ents.push(e);
    // it pops up out of the grass (or the water) with a rustle
    const col = t === 'surf' ? '#bfe6ff' : t === 'cave' ? '#a89a8a' : '#6ab84a';
    for (let i = 0; i < 6; i++) w.fx.add({ x: x * 16 + 8 + (G.rand() - .5) * 8, y: y * 16 + 6, vx: (G.rand() - .5) * 1.2, vy: -1 - G.rand(), ay: .08, life: 24, type: t === 'grass' ? 'leaf' : 'circle', size: 1.4, rot: G.rand() * 6, vr: .2, color: col });
    if (dist(e, p) < 9) G.audio && G.audio.sfx('rustle');
  }
  function step(w, e, d, speed) {
    const [dx, dy] = G.DIRS[d]; e.dir = d;
    if (!free(w, e, e.x + dx, e.y + dy)) return false;
    e.startMove(d, speed); return true;
  }
  const toward = (e, p) => Math.abs(p.x - e.x) > Math.abs(p.y - e.y) ? (p.x < e.x ? 'left' : 'right') : (p.y < e.y ? 'up' : 'down');
  function think(w, e) {
    const p = w.player, d = dist(e, p);
    if (e.mood === 'shy' && d <= 4) {   // bolt: the step that opens the most distance
      const opts = ['up', 'down', 'left', 'right'].map(k => { const [dx, dy] = G.DIRS[k]; return [k, Math.abs(e.x + dx - p.x) + Math.abs(e.y + dy - p.y)]; }).sort((a, b) => b[1] - a[1]);
      if (!e.emote && !e.fled) { e.emote = 'sweat'; e.emoteT = 0; e.fled = true; }
      for (const [k] of opts) if (step(w, e, k, 2)) break;
      e.wanderT = 4; return;
    }
    if (e.mood === 'bold' && d <= 4 && !w.surfing === (e.table !== 'surf')) {
      if (!e.spotted) { e.spotted = true; e.dir = toward(e, p); e.emote = '!'; e.emoteT = 0; e.emoteLife = 40; G.audio && G.audio.sfx('exclaim'); e.wanderT = 30; return; }
      if (d === 1) { e.dir = toward(e, p); engage(w, e, 'charge'); return; }
      const k = toward(e, p); if (!step(w, e, k, 2)) { const alt = k === 'left' || k === 'right' ? (p.y < e.y ? 'up' : 'down') : (p.x < e.x ? 'left' : 'right'); step(w, e, alt, 2); }
      e.wanderT = 2; return;
    }
    if (e.mood === 'curious' && d <= 6 && d > 2) { step(w, e, toward(e, p), 1); e.wanderT = G.randInt(20, 50); return; }
    if (e.mood === 'curious' && d <= 2) { e.dir = toward(e, p); if (!e.emote && G.rand() < .3) { e.emote = '?'; e.emoteT = 0; } e.wanderT = G.randInt(40, 90); return; }
    // graze: a step now and then, or a look around
    if (G.rand() < .6) step(w, e, G.pick(['up', 'down', 'left', 'right']), 1); else e.dir = G.pick(['up', 'down', 'left', 'right']);
    e.wanderT = G.randInt(50, 150);
  }
  function tick(w, top) {
    // the classic random encounters take over when this is off; either way, clear out anything left behind
    if (!on() || !w.map.def.enc || w.map.type === 'indoor') { if (list(w).length) w.ents = w.ents.filter(e => e.kind !== 'wild'); return; }
    const p = w.player; if (!p) return;
    for (const e of list(w)) {
      if (e.shiny && w.frame % 18 === 0) w.fx.add({ x: e.px + 8 + (G.rand() - .5) * 14, y: e.py + 2 + (G.rand() - .5) * 10, vy: -.25, life: 30, type: 'star', size: 2.2, color: '#fff6a0', blend: 'lighter', vr: .1, glow: true });
      if (w.busy || !top) continue;
      e.life--;
      if (dist(e, p) > 18 || (e.life <= 0 && dist(e, p) > 6)) { e.gone = true; continue; }
      if (!e.moving && --e.wanderT <= 0) think(w, e);
    }
    if (list(w).some(e => e.gone)) w.ents = w.ents.filter(e => !e.gone);
    if (top && !w.busy && w.frame % 45 === 0 && list(w).length < MAX && G.rand() < .7) spawn(w);
  }
  // meeting one: a real battle, or a Sweep when it's far weaker and a species you already have
  function engage(w, e, how) {
    if (w.battling || e.engaged) return; e.engaged = true;
    const L = lead(), m = e.mon;
    const known = G.save.dex && G.save.dex.caught && G.save.dex.caught[m.sp];
    const sweep = how !== 'talk' && L && L.lvl - m.lvl >= SWEEP_GAP && known && !m.shiny;
    w.ents = w.ents.filter(x => x !== e);
    if (sweep) { G.run(() => doSweep(w, e, L)); return; }
    G.run(() => G.startWild(e.table === 'surf' ? 'surf' : e.table, { mon: m }));
  }
  async function doSweep(w, e, L) {
    const m = e.mon, x = e.px + 8, y = e.py + 8;
    // chains: sweeps within a few seconds of each other stack a combo, worth more each time
    const ch = w._sweep = w._sweep && w.frame - w._sweep.t < 60 * 5 ? { n: w._sweep.n + 1, t: w.frame } : { n: 1, t: w.frame };
    G.audio && G.audio.sfx('hit'); if (ch.n >= 2) G.audio && G.audio.sfx('sparkle');
    w.fx.add({ x, y, life: 16, type: 'ring', size: 3, grow: 4, color: '#ffffff', lw: 2, blend: 'lighter', glow: true });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; w.fx.add({ x, y, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 1.6 - .6, drag: .88, life: 26, type: 'star', size: 2, color: i % 2 ? '#ffe070' : '#ffffff', blend: 'lighter', glow: true, vr: .3 }); }
    w.shake = Math.max(w.shake || 0, 4);
    G.dexMark(m.sp, 'seen');
    // EXP as if it had been beaten, halved for the lead and quartered for the rest (with Exp. Share)
    const sp = G.SPECIES[m.sp], Lv = m.lvl, gains = [];
    for (const pm of G.save.party) {
      if (pm.hp <= 0 || pm.egg || pm.dead) continue;
      const part = pm === L; if (!part && !G.save.settings.expShare) continue;
      let exp = (sp.exp * Lv / 5) * Math.pow((2 * Lv + 10) / (Lv + pm.lvl + 10), 2.5) + 1;
      exp = Math.max(1, Math.floor(exp * (part ? .5 : .25) * (1 + .25 * Math.min(8, ch.n - 1)) * (pm.item === 'luckyegg' ? 1.5 : 1)));
      const cap = G.save.settings.levelCap === 'hard' && G.levelCapNow ? G.levelCapNow() : 100;
      if (pm.lvl >= cap) continue;
      const ups = G.mon.addExp(pm, exp, cap); gains.push([pm, exp, ups]);
    }
    const lg = gains.find(g => g[0] === L);
    pops.push({ x, y: e.py, t: 0, text: ch.n > 1 ? `SWEEP x${ch.n}!` : 'SWEEP!', sub: lg ? '+' + lg[1] + ' EXP' : '', col: ch.n >= 5 ? '#ff7ad8' : ch.n >= 3 ? '#7af0ff' : '#ffe070' });
    G.save.stats.bestSweep = Math.max(G.save.stats.bestSweep || 0, ch.n);
    G.save.stats.swept = (G.save.stats.swept || 0) + 1;
    const leveled = gains.filter(g => g[2].length);
    if (!leveled.length) return;
    w.busy++;
    try {
      for (const [pm, , ups] of leveled) {
        G.audio && G.audio.jingle('levelup');
        await G.say(`${G.mon.name(pm)} grew to Lv. ${pm.lvl}!`, { auto: 50 });
        for (const lv of ups) for (const mv of G.mon.movesAt(pm.sp, lv)) if (!G.mon.hasMove(pm, mv)) await G.learnWithPrompt(pm, mv);
        await G.checkEvolution(pm, { trigger: 'level' });
      }
      w.placeFollower();
    } finally { w.busy--; }
  }
  // "SWEEP! +12 EXP" rising from where the mon stood; proj maps world pixels to screen units
  function drawPops(proj) {
    const U = G.ui;
    for (let i = pops.length - 1; i >= 0; i--) {
      const q = pops[i]; q.t++;
      if (q.t > 70) { pops.splice(i, 1); continue; }
      const s = proj(q.x, q.y); if (!s) continue;
      const k = q.t / 70, a = k < .75 ? 1 : 1 - (k - .75) / .25, rise = 10 + 14 * G.ease.outCubic(Math.min(1, q.t / 30)), pop = 1 + .4 * Math.max(0, 1 - q.t / 8);
      U.text(q.text, s.x, s.y - rise, { size: 8.5 * pop, weight: 900, align: 'center', color: q.col, alpha: a, outline: '#2a1a08' });
      if (q.sub) U.text(q.sub, s.x, s.y - rise + 10, { size: 6.4, weight: 800, align: 'center', color: '#ffffff', alpha: a, outline: '#1a2030' });
    }
  }
  return { on, tick, engage, tableAt, drawPops, list };
})();
