'use strict';
// ============================================================================
//  Scripting: async cutscene helpers used by story scripts (G.SCRIPTS)
// ============================================================================
G.SCRIPTS = {};
G.QUESTS = {};
G.runScript = async function (s, ctx = {}) {
  const fn = typeof s === 'function' ? s : G.SCRIPTS[s];
  if (!fn) { console.warn('Missing script', s); return; }
  const w = G.world.scene; if (w) w.busy++;
  try { await fn(G.S, ctx); }
  catch (e) { G.reportError(e); }
  finally { if (w) w.busy--; }
};
G.S = {
  get w() { return G.world.scene; },
  get p() { return G.world.scene.player; },
  say: (t, sp, o = {}) => G.say(t, { speaker: sp, ...o }),
  ask: (t, opts, sp) => G.ask(t, opts, { speaker: sp }),
  yesno: (t, sp) => G.yesno(t, { speaker: sp }),
  wait: f => G.wait(f),
  flag: n => G.flag(n), set: (n, v = true) => G.setFlag(n, v), unset: n => G.setFlag(n, false),
  npc(id) { return typeof id === 'string' ? G.world.scene.ents.find(e => e.id === id) : id; },
  // spawn a temporary NPC in the current map
  spawn(def) {
    const w = G.world.scene;
    const e = new G.Ent({ kind: 'npc', ...def, look: typeof def.look === 'string' ? G.LOOKS[def.look] : def.look });
    w.ents.push(e); return e;
  },
  remove(id) { const w = G.world.scene, e = this.npc(id); if (e) w.ents = w.ents.filter(x => x !== e); },
  face(id, dir) { const e = id === 'player' ? this.p : this.npc(id); if (e) e.dir = dir; },
  faceEach(a, b) {
    const A = a === 'player' ? this.p : this.npc(a), B = b === 'player' ? this.p : this.npc(b); if (!A || !B) return;
    A.dir = G.dirFrom(B.x - A.x, B.y - A.y); B.dir = G.OPP[A.dir];
  },
  facePlayer(id) { this.faceEach(id, 'player'); },
  // path: string like 'uuullrr' or array of dirs; speed px/frame
  async move(id, path, speed = 1, o = {}) {
    const e = id === 'player' ? this.p : this.npc(id); if (!e) return;
    const map = { u: 'up', d: 'down', l: 'left', r: 'right' };
    const dirs = typeof path === 'string' ? [...path].map(c => map[c]).filter(Boolean) : path;
    e.scripted = true;
    for (const d of dirs) {
      e.startMove(d, speed);
      if (e === this.p) this.w.moveFollower();
      while (e.moving) await G.wait(1);
      if (e === this.p) { G.save.pos.x = e.x; G.save.pos.y = e.y; }
    }
    if (o.face) e.dir = o.face;
    e.scripted = false;
  },
  // move several entities in parallel
  async moveAll(list) { await Promise.all(list.map(([id, path, sp]) => this.move(id, path, sp || 1))); },
  // walk to a tile using straight segments (x first, then y)
  async walkTo(id, x, y, speed = 1) {
    const e = id === 'player' ? this.p : this.npc(id); if (!e) return;
    let path = '';
    const dx = x - e.x, dy = y - e.y;
    path += (dx > 0 ? 'r' : 'l').repeat(Math.abs(dx)); path += (dy > 0 ? 'd' : 'u').repeat(Math.abs(dy));
    await this.move(id, path, speed);
  },
  // spawn an NPC two tiles from the player on a free side and walk it one step closer
  async approach(id, look, o = {}) {
    const w = G.world.scene, p = w.player;
    const order = o.prefer || ['down', 'left', 'right', 'up'];
    for (const d of order) {
      const [dx, dy] = G.DIRS[d];
      const x1 = p.x + dx, y1 = p.y + dy, x2 = p.x + dx * 2, y2 = p.y + dy * 2;
      if (!w.blocked(x1, y1, null, false) && !w.blocked(x2, y2, null, false) && !(w.follower && w.follower.x === x1 && w.follower.y === y1)) {
        const e = this.spawn({ id, x: x2, y: y2, look, dir: G.OPP[d] });
        await this.move(id, [G.OPP[d]], o.speed || 2);
        this.faceEach(id, 'player'); return e;
      }
    }
    const e = this.spawn({ id, x: p.x, y: p.y + 1, look, dir: 'up' }); this.faceEach(id, 'player'); return e;
  },
  async emote(id, kind = '!', f = 40) {
    const e = id === 'player' ? this.p : this.npc(id); if (!e) return;
    e.emote = kind; e.emoteT = 0; e.emoteLife = f;
    if (kind === '!') G.audio && G.audio.sfx('exclaim');
    await G.wait(f);
  },
  async fadeOut(f = 16) { await G.fadeOut(f); }, async fadeIn(f = 16) { await G.fadeIn(f); },
  async warp(map, x, y, dir = 'down', fade = true) { await this.w.warpTo(map, x, y, dir, fade); },
  music(id) { G.audio && G.audio.music(id); }, sfx(id) { G.audio && G.audio.sfx(id); }, jingle(id) { G.audio && G.audio.jingle(id); },
  restoreMusic() { const m = this.w.map.def.music; G.audio && G.audio.music(typeof m === 'function' ? m() : m); },
  shake(f = 20) { this.w.shake = f; },
  async give(item, n = 1, o = {}) {
    const it = G.ITEMS[item]; if (!it) return;
    G.bag.add(item, n);
    G.audio && G.audio.jingle(it.pocket === 'key' || it.pocket === 'tm' ? 'keyitem' : 'itemget');
    if (!o.silent) await G.say(`You received {b}${it.name}{w}${n > 1 ? ' ×' + n : ''}!${o.note ? '\\p' + o.note : ''}`);
    await G.wait(4);
  },
  async giveMoney(n) { G.save.money += n; G.audio && G.audio.sfx('money'); await G.say(`You received $${n.toLocaleString()}!`); },
  async giveMon(sp, lvl, o = {}) {
    sp = o.starter ? G.randomizeSpecies(sp, 'starter') : sp;
    const m = G.mon.create(sp, lvl, { ...o, ot: G.save.name, otId: G.save.otId, met: { loc: this.w ? this.w.map.name : '?', lvl }, ball: o.ball || 'orb' });
    if (o.moves) m.moves = o.moves.map(id => G.mon.newMove(id));
    if (o.bond) m.bond = o.bond;
    G.dexMark(sp, 'caught', m.shiny);
    G.audio && G.audio.jingle('newmon');
    await G.say(o.text || `You received {b}${G.SPECIES[sp].name}{w}!`);
    const force = G.save.settings.nuzlocke;
    if (!o.noNick && (force || await G.yesno(`Give a nickname to ${G.SPECIES[sp].name}?`))) {
      const n = await G.askName({ title: `${G.SPECIES[sp].name}'s nickname?`, start: '', max: 12, def: G.SPECIES[sp].name, allowCancel: !force, icon: () => G.monArt.front(sp, m.shiny, Math.floor(G.realTime * 4) % 4) });
      if (n && n !== G.SPECIES[sp].name) m.nick = n;
    }
    const where = G.party.add(m);
    if (where !== 'party') await G.say(`It was sent to ${G.save.boxNames[where]} in the PC.`);
    if (this.w) this.w.placeFollower();
    return m;
  },
  async heal(msg = true) {
    G.party.healAll();
    G.audio && G.audio.jingle('heal');
    await G.wait(90);
    if (G.world.scene) G.world.scene.placeFollower();
  },
  async battle(id, o) { return G.storyBattle(id, o); },
  async wild(sp, lvl, o = {}) { return G.startWild(null, { species: sp, lvl, noRandom: true, ...o }); },
  async badge(id) {
    if (G.save.badges.includes(id)) return;
    G.save.badges.push(id);
    const B = G.BADGES[id];
    G.audio && G.audio.jingle('badge');
    const sc = { lowres: false, t: 0, update() { this.t++; }, drawUI() { const U = G.ui; const k = Math.min(1, this.t / 30); U.panel(G.W / 2 - 70, 30, 140, 90, 'gold', { r: 10, alpha: k }); G.drawBadge(B, G.W / 2, 68, 22 * G.ease.outBack(k), this.t); U.text(B.name, G.W / 2, 100, { size: 9, weight: 900, align: 'center', color: '#5a3a00', alpha: k }); } };
    G.push(sc);
    await G.wait(30);
    await G.say(`${G.save.name} received the {y}${B.name}{w} from ${B.leader}!`);
    G.pop(sc);
    G.persist.write();
  },
  quest(id, step, o = {}) {
    const Q = G.QUESTS[id]; if (!Q) return;
    const cur = G.save.quests[id];
    if (step === 'done') { G.save.quests[id] = { step: 'done' }; G.toast('✓ Quest complete: ' + Q.name, { col: 'green' }); G.audio && G.audio.sfx('quest'); return; }
    G.save.quests[id] = { step };
    if (!cur) { G.toast('New quest: ' + Q.name, { col: 'teal' }); G.audio && G.audio.sfx('quest'); }
    else if (!o.silent) G.toast('Quest updated: ' + Q.name, { col: 'teal' });
  },
  questStep(id) { const q = G.save.quests[id]; return q ? q.step : null; },
  hasMon(sp) { return G.party.hasSpecies(sp); },
  partyHas(sp) { return G.save.party.some(m => m.sp === sp); },
  money(n) { if (n === undefined) return G.save.money; G.save.money += n; },
  camera: {
    async pan(dx, dy, f = 30) { const w = G.world.scene; w.camOff = w.camOff || { x: 0, y: 0 }; await G.tween(w.camOff, { x: dx, y: dy }, f, G.ease.inOut); },
    async reset(f = 30) { const w = G.world.scene; if (w.camOff) await G.tween(w.camOff, { x: 0, y: 0 }, f, G.ease.inOut); },
  },
};
// camera offset support
(function () {
  const orig = G.WorldScene.prototype.camTarget;
  G.WorldScene.prototype.camTarget = function () { const t = orig.call(this); if (this.camOff) { t.x += this.camOff.x; t.y += this.camOff.y; } return t; };
})();
// badges
G.BADGES = {
  bloom: { name: 'Bloom Badge', leader: 'Warden Juniper', col: '#6ccc52', col2: '#ff9ac8', shape: 'flower' },
  current: { name: 'Current Badge', leader: 'Warden Ione', col: '#f4d040', col2: '#3a3a4a', shape: 'bolt' },
  forge: { name: 'Forge Badge', leader: 'Warden Brann', col: '#ee6030', col2: '#ffd070', shape: 'flame' },
  veil: { name: 'Veil Badge', leader: 'Warden Mireille', col: '#8a5ac8', col2: '#d8c8ff', shape: 'moon' },
  rime: { name: 'Rime Badge', leader: 'Warden Sigrid', col: '#8ad8f8', col2: '#ffffff', shape: 'snow' },
  wyrm: { name: 'Wyrm Badge', leader: 'Warden Kaelen', col: '#6f35fc', col2: '#f4d040', shape: 'scale' },
};
G.BADGE_ORDER = ['bloom', 'current', 'forge', 'veil', 'rime', 'wyrm'];
G.drawBadge = function (B, x, y, r, t = 0) {
  const U = G.ui, c = U.c, S = G.gfx.S; const X = U.X(x), Y = U.Y(y); r *= S;
  c.save(); c.translate(X, Y);
  const g = c.createRadialGradient(-r * .3, -r * .3, 0, 0, 0, r); g.addColorStop(0, G.col.light(B.col, .5)); g.addColorStop(1, G.col.dark(B.col, .2));
  c.fillStyle = g; c.strokeStyle = G.col.dark(B.col, .5); c.lineWidth = S;
  c.beginPath();
  if (B.shape === 'flower') { for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 - Math.PI / 2; c.moveTo(0, 0); c.ellipse(Math.cos(a) * r * .5, Math.sin(a) * r * .5, r * .5, r * .3, a, 0, Math.PI * 2); } }
  else if (B.shape === 'bolt') { c.moveTo(-r * .2, -r); c.lineTo(r * .6, -r * .1); c.lineTo(r * .05, -r * .05); c.lineTo(r * .3, r); c.lineTo(-r * .6, r * .05); c.lineTo(-r * .05, 0); c.closePath(); }
  else if (B.shape === 'flame') { c.moveTo(0, -r); c.quadraticCurveTo(r * .9, -r * .1, r * .6, r * .5); c.quadraticCurveTo(0, r * 1.1, -r * .6, r * .5); c.quadraticCurveTo(-r * .9, -r * .1, 0, -r); }
  else if (B.shape === 'moon') { c.arc(0, 0, r, Math.PI * .3, Math.PI * 1.7); c.arc(r * .4, 0, r * .75, Math.PI * 1.6, Math.PI * .4, true); c.closePath(); }
  else if (B.shape === 'snow') { for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.moveTo(0, 0); c.lineTo(Math.cos(a - .15) * r, Math.sin(a - .15) * r); c.lineTo(Math.cos(a + .15) * r, Math.sin(a + .15) * r); c.closePath(); } }
  else { c.moveTo(0, -r); c.lineTo(r * .85, -r * .3); c.lineTo(r * .6, r * .7); c.lineTo(0, r); c.lineTo(-r * .6, r * .7); c.lineTo(-r * .85, -r * .3); c.closePath(); }
  c.fill(); c.stroke();
  c.fillStyle = B.col2; c.beginPath(); c.arc(0, 0, r * .22, 0, Math.PI * 2); c.fill();
  c.globalCompositeOperation = 'lighter'; c.fillStyle = `rgba(255,255,255,${.25 + .15 * Math.sin(t / 10)})`; c.beginPath(); c.ellipse(-r * .3, -r * .4, r * .25, r * .12, -.6, 0, Math.PI * 2); c.fill();
  c.restore();
};
