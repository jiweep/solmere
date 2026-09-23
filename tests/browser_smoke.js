// Browser smoke tests (load after browser_helpers.js). Each sweep returns a report and records any
// runtime error the game catches (G.errors) or that escapes as an exception.
(function () {
  const T = window.T;
  const errs = () => G.errors.slice();
  const frames = async (n) => { const f = G.frame + n, t0 = performance.now(); while (G.frame < f && performance.now() - t0 < 20000) await T.sleep(10); };

  // every map: enter it (no scripts), simulate a few frames at day and at night, render
  T.mapSweep = async function () {
    const bad = [], w = G.world.scene;
    const ids = Object.keys(G.MAPDEFS);
    for (const id of ids) {
      const d = G.MAPDEFS[id];
      const m = G.maps.get(id);
      const sp = d.spawn || (m.warps[0] ? [m.warps[0].x, m.warps[0].y] : [1, 1]);
      G.errors.length = 0;
      try {
        for (const hour of [12, 22]) {
          G.save.vars.forceHour = hour;
          w.enterMap(id, sp[0], sp[1], 'down', { noScript: true, noBanner: true });
          await frames(3); G.render();
        }
      } catch (e) { bad.push([id, String(e && e.message || e)]); }
      if (G.errors.length) bad.push([id, errs().join(' | ')]);
    }
    delete G.save.vars.forceHour;
    return { maps: ids.length, bad };
  };

  // every move animation + status animation + the other display events, on a real BattleScene
  T.animSweep = async function (only) {
    const bad = [];
    const sc = new G.BattleScene({ format: 'single', env: 'grass' });
    G.push(sc); sc.intro = 0;
    const mk = (sp, s) => { const mon = G.mon.create(sp, 50); const P = sc.pos(s, 0, 1); return { ...mon, ...P, dispHp: mon.hp, maxhp: G.mon.maxHP(mon), hp: G.mon.maxHP(mon), visible: true, scale: 1, alpha: 1, offx: 0, offy: 0, flash: 0, shake: 0, frame: 0, side: s, slot: 0, anim: 0, uid: mon.uid, status: null }; };
    sc.slots['0:0'] = mk('kindlet', 0); sc.slots['1:0'] = mk('sealet', 1);
    const prevSpeed = G.settings.battleSpeed; G.settings.battleSpeed = 3; G.turbo = true;
    const ids = only || Object.keys(G.MOVES);
    for (const id of ids) {
      G.errors.length = 0;
      try {
        for (const [a, b] of [[0, 1], [1, 0]]) {
          await Promise.race([G.battleAnim(sc, { t: 'move', ref: { s: a, i: 0 }, move: id, targets: [{ s: b, i: 0 }] }), T.sleep(6000).then(() => { throw new Error('anim timeout'); })]);
          sc.animLayer = null; sc.dim = 0;
          for (const s of Object.values(sc.slots)) { s.visible = true; s.alpha = 1; s.scale = 1; s.offx = 0; s.offy = 0; s.blink = false; }
        }
        G.render();
      } catch (e) { bad.push([id, String(e && e.message || e)]); }
      if (G.errors.length) bad.push([id, errs().join(' | ')]);
    }
    for (const st of ['brn', 'par', 'psn', 'tox', 'slp', 'frz']) {
      G.errors.length = 0;
      try { await G.statusAnim(sc, { s: 1, i: 0 }, st); } catch (e) { bad.push(['status:' + st, String(e.message || e)]); }
      if (G.errors.length) bad.push(['status:' + st, errs().join(' | ')]);
    }
    G.settings.battleSpeed = prevSpeed; G.turbo = false;
    G.pop(sc);
    return { moves: ids.length, bad };
  };

  // every God-mode chapter: jump, let its scripts settle, render
  T.chapterSweep = async function () {
    const bad = [];
    for (const ch of G.CHAPTERS) {
      G.errors.length = 0;
      try {
        await G.jumpToChapter(ch);
        await T.talkThrough(30); await frames(5); G.render();
        if (!T.idle()) bad.push([ch.name, 'not idle after jump: ' + T.scenes().slice(-1)[0]]);
      } catch (e) { bad.push([ch.name, String(e && e.message || e)]); }
      if (G.errors.length) bad.push([ch.name, errs().join(' | ')]);
    }
    return { chapters: G.CHAPTERS.length, bad };
  };

  // real trainer battles through the full UI, choosing "Fight → first usable move" each turn
  T.battle = async function (id, o = {}) {
    G.errors.length = 0;
    const B = () => G.scenes.find(s => s instanceof G.BattleScene);
    const god = G.save.god; const prev = { ...god }; G.save.settings.god = true;
    if (o.ohko) god.ohko = true; if (o.invincible !== false) god.invincible = true;
    let result, turns = 0;
    const run = G.storyBattle(id, { canLose: true }).then(r => { result = r; });
    const t0 = performance.now();
    while (result === undefined && performance.now() - t0 < (o.timeout || 90000)) {
      const b = B(), top = G.top();
      if (top && top.party && top.o && !top.sub && B()) {   // any in-battle party prompt: pick a healthy benched mon
        const bt = B().bt, active = bt ? bt.sides[0].slots.filter(Boolean).map(x => x.mon.uid) : [];
        const k = top.party.findIndex(m => m.hp > 0 && !m.dead && !(top.o.activeUids || active).includes(m.uid));
        if (k >= 0) top.i = k;
        await T.press('a', 150); continue;
      }
      if (top && top.party && top.sub) { await T.press('a', 150); continue; }   // "Switch" is the first option
      if (b && b.menu) {
        const mm = b.menu;
        if (mm.constructor.name === 'CmdMenu' && b.bt) { for (const x of b.bt.sides[0].slots.filter(Boolean)) for (const mv of x.mon.moves) mv.pp = G.mon.maxPP(mv); }   // test cheat: never run dry
        if (mm.constructor.name === 'MoveMenu' && mm.req && mm.req.moves) {   // move menu: aim at the strongest usable damaging move
          let best = 0, bp = -1;
          mm.req.moves.forEach((mv, k) => { const m = G.MOVES[mv.id]; const p = mv.dis || !mv.pp ? -2 : m.cat === 'status' ? -1 : (m.pow || 1); if (p > bp) { bp = p; best = k; } });
          mm.i = best; await T.press('a', 120); turns++;
        } else await T.press('a', 120);
      }
      else await T.press('a', 90);
    }
    const timedOut = result === undefined;
    if (timedOut) {   // keep nudging for a grace period so the next battle starts from a clean state
      const t1 = performance.now(); while (result === undefined && performance.now() - t1 < 20000) await T.press('a', 90);
    }
    Object.assign(god, prev);
    await T.talkThrough(20);
    return { id, result, turns, timedOut, errors: errs(), stuckAt: timedOut ? T.scenes().slice(-1)[0] : undefined };
  };
  console.log('[smoke tests ready]');
})();
