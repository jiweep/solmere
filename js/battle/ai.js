'use strict';
// ============================================================================
//  Battle AI. level 0 wild, 1 easy, 2 normal, 3 hard, 4 master
// ============================================================================
G.AI = (function () {
  const noise = [80, 50, 22, 9, 4];
  function pct(bt, b, t, m) { return t.hp > 0 ? bt.estimate(b, t, m) / t.hp : 0; }
  function bestHit(bt, b, t) {
    let best = 0;
    for (const x of b.mon.moves) { const m = G.MOVES[x.id]; if (x.pp <= 0 || m.cat === 'status') continue; best = Math.max(best, bt.estimate(b, t, m)); }
    return best;
  }
  function scoreMove(bt, b, m, t, lvl) {
    const foes = bt.foes(b), allies = bt.allies(b);
    const S = bt.sides[b.side], F = bt.sides[1 - b.side];
    const faster = t ? bt.speed(b) >= bt.speed(t) : true;
    if (m.cat !== 'status') {
      let sc = 0;
      const tg = m.target === 'foes' ? foes : m.target === 'all' ? foes : [t];
      for (const x of tg) {
        if (!x) continue;
        const p = pct(bt, b, x, m);
        sc += Math.min(1, p) * 100 + (p >= 1 ? 60 : 0);
        if (p >= 1 && m.pri > 0 && !faster) sc += 40;
      }
      if (m.target === 'all') for (const a of allies) { const p = pct(bt, b, a, m); sc -= Math.min(1, p) * 120; }
      if (m.recoil) sc -= 8; if (m.self && Object.values(m.self).some(v => v < 0)) sc -= 10;
      if (m.fx === 'recharge' && lvl >= 3) sc -= 25;
      if (m.fx === 'fakeout') sc += b.turnsOut === 0 ? 45 : -200;
      if (m.fx === 'sucker' && lvl >= 3) sc -= 15;
      if (m.fx === 'solar' && bt.weather !== 'sun') sc *= .55;
      if (m.fx === 'pivot' && lvl >= 3 && bt.bench(b.side, b.owner).length) sc += 8;
      if (m.fx === 'rampage' && foes.length > 1) sc -= 10;
      return sc;
    }
    // --------------- status moves
    let sc = 0;
    const hpF = b.hp / b.maxhp;
    const threat = t ? bestHit(bt, t, b) / b.hp : 0;
    if (m.status) {
      if (!t || t.status || !bt.canStatus(t, m.status, b) || (m.powder && t.hasType('grass')) || (m.status === 'par' && m.type === 'electric' && t.hasType('ground'))) return -100;
      sc = { slp: 62, par: faster ? 30 : 55, brn: t.stats.atk > t.stats.spa ? 58 : 25, tox: 44, psn: 30 }[m.status] || 30;
      if (m.status === 'slp' && foes.some(f => f.status === 'slp')) sc -= 30;
    }
    if (m.boost && m.target === 'self') {
      const tot = Object.entries(m.boost).reduce((a, [k, v]) => a + (v > 0 ? v : 0), 0);
      const cur = Object.keys(m.boost).reduce((a, k) => a + Math.max(0, b.stages[k]), 0);
      sc = 26 + tot * 10 - cur * 14;
      if (hpF < .5) sc -= 30; if (threat > .6) sc -= 35; if (threat < .25) sc += 20;
      if (m.boost.spe && faster) sc -= 10;
    }
    if (m.heal || m.fx === 'weatherheal' || m.fx === 'rest') sc = hpF < .35 ? 80 : hpF < .55 ? 50 : hpF < .8 ? 5 : -50;
    if (m.stats && t) { sc = 18; if (m.stats.atk && t.stats.atk < t.stats.spa) sc -= 12; if (m.stats.def && b.stats.atk < b.stats.spa) sc -= 12; if (t.stages[Object.keys(m.stats)[0]] <= -2) sc -= 25; }
    if (m.hazard) { const n = F.hazards[m.hazard]; const left = bt.bench(1 - b.side, 0).length; sc = n ? (m.hazard === 'spikes' && n < 3 ? 25 : -60) : 30 + left * 6; if (bt.wild) sc = -40; }
    if (m.screen) sc = S.cond[m.screen] ? -80 : m.screen === 'veil' && bt.weather !== 'snow' ? -80 : m.screen === 'tailwind' ? 32 : 36;
    if (m.weather) { const good = { sun: 'fire', rain: 'water', sand: 'rock', snow: 'ice' }[m.weather]; sc = bt.weather === m.weather ? -80 : (b.hasType(good) || allies.some(a => a.hasType(good))) ? 42 : 5; }
    switch (m.fx) {
      case 'protect': sc = bt.nSlots > 1 ? 22 : (t && (t.vol.seeded || t.status === 'tox' || t.status === 'psn') ? 30 : 4); if (b.vol.protectN) sc = -50; break;
      case 'substitute': sc = hpF > .5 && !b.vol.sub ? 26 : -60; break;
      case 'leechseed': sc = t && !t.vol.seeded && !t.hasType('grass') ? 42 : -60; break;
      case 'taunt': sc = t && !t.vol.taunt && t.mon.moves.some(x => G.MOVES[x.id].cat === 'status') ? 32 : -30; break;
      case 'confuse': sc = t && !t.vol.confused ? 28 : -60; break;
      case 'trickroom': sc = bt.trickRoom ? -80 : (foes.every(f => bt.speed(f) > bt.speed(b)) ? 55 : -40); break;
      case 'roar': sc = t && Object.values(t.stages).some(v => v >= 2) ? 55 : bt.wild ? -40 : 5; break;
      case 'healbell': sc = bt.partyOf(b.side, b.owner).filter(x => x.status).length * 25 - 10; break;
      case 'bellydrum': sc = hpF > .75 && threat < .4 ? 50 : -60; break;
      case 'focusenergy': sc = b.vol.focus ? -60 : 8; break;
      case 'helpinghand': sc = allies.length ? 26 : -100; break;
      case 'defog': sc = Object.values(S.hazards).some(Boolean) ? 40 : -40; break;
      case 'pivotstatus': sc = 30; break;
      case 'flop': sc = 1; break;
    }
    return sc;
  }
  function pickTarget(bt, b, m) {
    const foes = bt.foes(b);
    if (m.target !== 'normal' || foes.length <= 1) return foes[0] ? foes[0].ref() : null;
    let best = foes[0], bs = -1;
    for (const f of foes) { const s = m.cat === 'status' ? G.rand() : pct(bt, b, f, m) + (f.hp / f.maxhp < .3 ? .2 : 0); if (s > bs) { bs = s; best = f; } }
    return best.ref();
  }
  function matchup(bt, mon, side, owner) {
    // hypothetical: how well does a benched mon fare against current foes
    const fake = new G.Battler(bt, side, 0, owner, mon, 0);
    let off = 0, def = 0;
    for (const f of bt.active(1 - side)) {
      off = Math.max(off, bestHit(bt, fake, f) / Math.max(1, f.hp));
      def = Math.max(def, bestHit(bt, f, fake) / Math.max(1, fake.hp));
    }
    return off - def * 1.1;
  }
  function controller(level = 2, trainer = {}) {
    return {
      kind: 'ai', level,
      async chooseActions(bt, reqs) {
        const out = [];
        for (const req of reqs) out.push(this.decide(bt, req));
        return out;
      },
      decide(bt, req) {
        const b = bt.at(req.ref.s, req.ref.i);
        const tr = bt.trainerOf(b);
        if (req.struggle) return { type: 'move', moveIdx: 0, struggle: true };
        const usable = req.moves.filter(m => !m.dis);
        // wild: random usable move
        if (level === 0) {
          const mv = G.pick(usable); const m = G.MOVES[mv.id];
          return { type: 'move', moveIdx: mv.idx, target: pickTarget(bt, b, m) };
        }
        // items (trainers)
        if (level >= 2 && tr.items && b.hp > 0 && b.hp / b.maxhp < .28 && !bt.wild) {
          const heal = ['fullrestore', 'maxpotion', 'hyperpotion', 'superpotion', 'potion'].find(i => tr.items[i] > 0);
          const lastOne = bt.bench(b.side, b.owner).length === 0;
          if (heal && (lastOne || level >= 3) && G.chance(level >= 3 ? .85 : .5)) {
            const foes = bt.foes(b); const kill = foes.some(f => bestHit(bt, b, f) >= f.hp);
            if (!kill) { tr.items[heal]--; return { type: 'item', item: heal, target: b.partyIdx }; }
          }
        }
        // switching (hard+)
        if (level >= 3 && req.canSwitch && b.turnsOut >= 1 && !b.vol.sub) {
          const cur = matchup(bt, b.mon, b.side, b.owner);
          if (cur < -.55 && G.chance(level >= 4 ? .6 : .38)) {
            let best = null, bs = cur + .5;
            for (const x of bt.bench(b.side, b.owner)) { const s = matchup(bt, x.m, b.side, b.owner); if (s > bs) { bs = s; best = x; } }
            if (best && !b.vol.switchedRecently) { b.vol.switchedRecently = true; return { type: 'switch', to: best.i }; }
          }
        }
        b.vol.switchedRecently = false;
        let best = null, bs = -1e9;
        for (const mv of usable) {
          const m = G.MOVES[mv.id];
          const tref = pickTarget(bt, b, m);
          const t = tref ? bt.at(tref.s, tref.i) : null;
          let s = scoreMove(bt, b, m, t, level) + G.rand() * noise[level];
          if (level === 1 && m.cat === 'status') s -= 15;
          if (s > bs) { bs = s; best = { type: 'move', moveIdx: mv.idx, target: tref }; }
        }
        if (!best) best = { type: 'move', moveIdx: usable[0] ? usable[0].idx : 0, struggle: !usable.length };
        // resonance for aces
        if (req.canResonate && (bt.bench(b.side, b.owner).length === 0 || tr.aceUid === b.mon.uid)) best.resonate = true;
        return best;
      },
      async chooseSwitch(bt, req) {
        const bench = bt.bench(req.side, req.owner);
        if (!bench.length) return -1;
        if (level <= 1) return bench[0].i;
        let best = bench[0], bs = -1e9;
        const tr = bt.sides[req.side].trainers[req.owner];
        for (const x of bench) {
          let s = matchup(bt, x.m, req.side, req.owner) + G.rand() * .15;
          if (tr.aceUid === x.m.uid && bench.length > 1) s -= 5; // save the ace for last
          if (s > bs) { bs = s; best = x; }
        }
        return best.i;
      },
      async learnMove() { return -1; },
    };
  }
  return { controller, scoreMove, bestHit };
})();
