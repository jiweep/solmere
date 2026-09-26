'use strict';
// ============================================================================
//  Overworld: entities, player control, camera, interaction, encounters,
//  lighting, weather, followers, and the WorldScene itself.
// ============================================================================
G.Ent = class {
  constructor(o) {
    Object.assign(this, o);
    this.px = this.x * 16; this.py = this.y * 16;
    this.dir = o.dir || 'down'; this.moving = false; this.frame = 0; this.stepN = 0; this.speed = o.speed || 1;
    this.hop = 0; this.emote = null; this.emoteT = 0; this.visible = o.visible !== false; this.alpha = 1;
    this.wanderT = G.randInt(60, 200); this.homeX = this.x; this.homeY = this.y; this.jump = null; this.queue = [];
  }
  get tx() { return this.moving ? this.nx : this.x; }
  get ty() { return this.moving ? this.ny : this.y; }
  startMove(dir, speed) {
    const [dx, dy] = G.DIRS[dir]; this.dir = dir; this.nx = this.x + dx; this.ny = this.y + dy; this.moving = true;
    this.speed = speed || this.speed || 1; this.stepN++; this.prog = 0;
  }
  startJump(dir, dist = 2) {
    const [dx, dy] = G.DIRS[dir]; this.dir = dir; this.nx = this.x + dx * dist; this.ny = this.y + dy * dist; this.moving = true; this.jump = { d: dist, t: 0, n: dist * 12 }; this.speed = 16 * dist / this.jump.n; this.stepN++; this.prog = 0;
  }
  update() {
    if (this.emote) { this.emoteT++; if (this.emoteT > (this.emoteLife || 60)) this.emote = null; }
    if (!this.moving) return false;
    const [dx, dy] = [G.sign(this.nx - this.x), G.sign(this.ny - this.y)];
    this.px += dx * this.speed; this.py += dy * this.speed; this.prog += this.speed;
    if (this.jump) { this.jump.t++; const k = this.jump.t / this.jump.n; this.hop = Math.sin(k * Math.PI) * 10; }
    const total = this.jump ? this.jump.d * 16 : 16;
    if (this.prog >= total - 1e-6) {
      this.x = this.nx; this.y = this.ny; this.px = this.x * 16; this.py = this.y * 16; this.moving = false; this.hop = 0;
      if (this.jump) { this.jump = null; this.landed = true; }
      return true; // arrived
    }
    return false;
  }
  animFrame() {
    if (!this.moving) return 0;
    const t = this.prog / (this.jump ? this.jump.d * 16 : 16);
    // DS cycle: each tile shows one stride (alternating feet) framed by the standing pose;
    // running and biking hold the stride longer so the legs read as a quicker gait
    // walking: stand, stride, stand each tile (BW). Running and cycling hold one stride for the whole tile and
    // alternate feet tile by tile, without flashing the standing frame between strides (that doubled the
    // leg flicker at run speed)
    if (this.speed >= 2) return this.stepN % 2 ? 1 : 2;
    return t > .22 && t < .72 ? (this.stepN % 2 ? 1 : 2) : 0;
  }
};

G.EMOTES = (() => {
  const cache = {};
  return (kind) => {
    if (cache[kind]) return cache[kind];
    const p = new G.Painter(13, 14), W = G.col.parse('#ffffff'), O = G.col.parse('#2a2230'), R = G.col.parse('#e8484a');
    p.rect(1, 1, 11, 10, W); p.rect(2, 0, 9, 1, W); p.rect(2, 11, 9, 1, W); p.rect(5, 12, 3, 1, W); p.set(6, 13, W);
    const C = { '!': R, '?': G.col.parse('#3b82e0'), 'heart': G.col.parse('#ff5a8a'), '...': O, 'note': G.col.parse('#2aa86a'), 'anger': R, 'sweat': G.col.parse('#3b82e0'), 'zzz': G.col.parse('#6a4ab0') }[kind] || O;
    if (kind === '!') { p.rect(6, 2, 2, 5, C); p.rect(6, 8, 2, 2, C); }
    else if (kind === '?') { p.rect(5, 2, 4, 1, C); p.rect(8, 3, 1, 2, C); p.rect(6, 5, 2, 1, C); p.rect(6, 6, 1, 1, C); p.rect(6, 8, 2, 2, C); p.rect(4, 3, 1, 1, C); }
    else if (kind === 'heart') { p.rect(3, 3, 3, 3, C); p.rect(7, 3, 3, 3, C); p.rect(4, 6, 5, 2, C); p.rect(5, 8, 3, 1, C); p.set(6, 9, C); p.set(4, 3, W); }
    else if (kind === '...') { p.rect(3, 6, 2, 2, C); p.rect(6, 6, 2, 2, C); p.rect(9, 6, 2, 2, C); }
    else if (kind === 'note') { p.rect(7, 2, 1, 6, C); p.rect(7, 2, 3, 1, C); p.rect(5, 7, 3, 2, C); }
    else if (kind === 'anger') { p.rect(3, 3, 2, 2, C); p.rect(8, 3, 2, 2, C); p.rect(3, 7, 2, 2, C); p.rect(8, 7, 2, 2, C); p.rect(5, 5, 3, 1, C); }
    else if (kind === 'sweat') { p.rect(6, 3, 2, 2, C); p.rect(5, 5, 4, 3, C); p.set(6, 5, W); }
    else if (kind === 'zzz') { p.rect(3, 3, 4, 1, C); p.set(5, 4, C); p.rect(3, 5, 4, 1, C); p.rect(8, 6, 3, 1, C); p.set(9, 7, C); p.rect(8, 8, 3, 1, C); }
    p.outline(O);
    return cache[kind] = p.done();
  };
})();

G.WorldScene = class {
  constructor() {
    this.opaque = true; this.isWorld = true;
    this.map = null; this.ents = []; this.player = null; this.follower = null; this.partner = null;
    this.cam = { x: 0, y: 0 }; this.busy = 0; this.frame = 0; this.parts = new G.Particles(); this.fx = new G.Particles();
    this.surfing = false; this.biking = false; this.turnHold = 0; this.stepsSinceEnc = 0; this.footprints = [];
    this.sparkle = null; this.shake = 0; this.weatherT = 0; this.lightning = 0;
    G.world.scene = this;
  }
  // ---------------------------------------------------------- map loading
  enterMap(id, x, y, dir, o = {}) {
    const prev = this.map;
    const m = G.maps.get(id);
    this.map = m;
    if (G.audio && G.audio.ambience) G.audio.ambience(this.ambienceFor(m));
    G.save.pos = { map: id, x, y, dir: dir || (this.player ? this.player.dir : 'down') };
    if (m.type === 'outdoor') { G.save.lastOutdoor = { map: id, x, y }; if (m.def.town) G.save.visited[m.def.town] = true; }
    if (!this.player) this.player = new G.Ent({ id: 'player', x, y, dir: dir || 'down', look: G.LOOKS[G.save.look] || G.LOOKS.player_a, kind: 'player' });
    const p = this.player; p.x = x; p.y = y; p.px = x * 16; p.py = y * 16; p.moving = false; p.jump = null; p.hop = 0; if (dir) p.dir = dir;
    this.spawnEnts();
    { const pc = m.cell(x, y); this.surfing = !!(pc && pc.water); }
    this.placeFollower();
    if (m.type === 'indoor') this.biking = false;
    this.snapCamera();
    // audio + banner
    const mus = typeof m.def.music === 'function' ? m.def.music() : m.def.music;
    if (mus && G.audio) G.audio.music(mus);
    if (!o.noBanner && (!prev || prev.def.area !== m.def.area || prev.name !== m.name) && m.def.banner !== false && m.type !== 'indoor') G.showBanner(m.name, m.def.subtitle);
    this.weather = m.def.weather ? (typeof m.def.weather === 'function' ? m.def.weather() : m.def.weather) : null;
    this.parts.clear();
    this.sparkle = null;
    if (G.net) G.net.sendPos(true);
    this.autosaveIn = 40;
    if (m.def.onEnter && !o.noScript) G.runScript(m.def.onEnter);
  }
  // quietly save after each map change once the player is idle (never mid-cutscene)
  tickAutosave(top) {
    if (this.saveIcon > 0) this.saveIcon--;
    if (!(this.autosaveIn > 0) || !top || this.busy || this.player.moving) return;
    if (--this.autosaveIn > 0) return;
    if (G.settings.autosave === false || !G.save || !G.flag('intro_done')) return;
    if (G.persist.write()) this.saveIcon = 80;
  }
  spawnEnts() {
    const m = this.map; this.ents = [];
    for (const o of m.objs) {
      if (o.type === 'building' || o.type === 'trigger' || o.type === 'warp') continue;
      if (!G.checkCond(o.cond)) continue;
      if (o.type === 'item' && G.save.items[m.id + ':' + o.id]) continue;
      const e = new G.Ent({ ...o, kind: o.type, look: o.look ? (typeof o.look === 'string' ? G.LOOKS[o.look] : o.look) : null });
      if (o.type === 'trainer' && G.save.trainers[o.trainer]) e.defeated = true;
      if (o.type === 'item') e.hidden = !!o.hidden;
      this.ents.push(e);
    }
    // restore pushed boulders? (they reset on re-entry, like the classics)
    m.boulders = {};
  }
  placeFollower() {
    const lead = G.save.follower ? G.party.lead() : null;
    if (!lead || this.surfing || this.map.def.noFollower) { this.follower = null; return; }
    const p = this.player; const back = G.OPP[p.dir]; const [dx, dy] = G.DIRS[back];
    let fx = p.x + dx, fy = p.y + dy;
    if (this.blocked(fx, fy, null, true)) { fx = p.x; fy = p.y; }
    this.follower = new G.Ent({ id: 'follower', x: fx, y: fy, dir: p.dir, kind: 'follower', mon: lead });
    this.follower.hidden = fx === p.x && fy === p.y;
  }
  snapCamera() { const t = this.camTarget(); this.cam.x = t.x; this.cam.y = t.y; }
  camTarget() {
    const p = this.player, m = this.map;
    let x = p.px + 8 - G.W / 2, y = p.py + 8 - G.H / 2 - 6;
    const has = d => m.conns.some(c => c.dir === d);
    const MW = m.w * 16, MH = m.h * 16;
    if (MW <= G.W) x = (MW - G.W) / 2; else { if (!has('w')) x = Math.max(x, 0); if (!has('e')) x = Math.min(x, MW - G.W); }
    if (MH <= G.H) y = (MH - G.H) / 2; else { if (!has('n')) y = Math.max(y, 0); if (!has('s')) y = Math.min(y, MH - G.H); }
    return { x, y };
  }
  // ---------------------------------------------------------- queries
  entAt(x, y, except) { return this.ents.find(e => e !== except && e.visible && !e.hidden && e.kind !== 'trigger' && ((e.x === x && e.y === y) || (e.moving && e.nx === x && e.ny === y))); }
  cellAt(x, y) { const r = this.map.resolve(x, y); return r ? r.map.cells[r.y * r.map.w + r.x] : null; }
  isCleared(mapId, x, y) { return !!G.save.cleared[mapId + ':' + x + ':' + y]; }
  boulderAt(x, y) { return this.map.boulders && this.map.boulders[x + ',' + y]; }
  blocked(x, y, ent, ignoreEnts) {
    const r = this.map.resolve(x, y); if (!r) return true;
    const c = r.map.cells[r.y * r.map.w + r.x];
    if (G.save.god.noclip && ent === this.player) return false;
    if (this.boulderAt(x, y) === 'moved') return true;
    if (c.push && this.map.boulders && this.map.boulders[x + ',' + y] === 'gone') { /* moved away */ }
    else if (c.solid) {
      if ((c.cut || c.smash) && this.isCleared(r.map.id, r.x, r.y)) { /* cleared */ }
      else if (c.push && this.map.boulders && this.map.boulders[x + ',' + y] === 'gone') { }
      else return true;
    }
    if (c.water && !(ent === this.player && this.surfing) && !(ent && ent.kind === 'partner')) return true;
    if (c.g === 'hole' && !(this.map.boulders && this.map.boulders[x + ',' + y] === 'filled')) return true;
    if (c.solidIf && G.checkCond(c.solidIf)) return true;
    if (!ignoreEnts) { const e = this.entAt(x, y, ent); if (e && e.kind !== 'follower' && !(e.kind === 'wild' && ent === this.player && this.busy)) return true; }
    if (this.blockedTiles && this.blockedTiles.has(x + ',' + y)) return true;
    return false;
  }
  // ---------------------------------------------------------- update
  // render interpolation: moving things are drawn between their last two tick positions (G.alpha of the
  // way), so a 60 Hz simulation looks even on 120 Hz screens and through vsync jitter. Only while this
  // scene is ticking; teleports and warps (a jump of more than half a tile) are never smeared.
  lerpBegin(a) {
    if (this._tick !== G.frame || a >= 1) return null;
    const saved = [];
    for (const e of [...this.ents, this.player, this.follower]) {
      if (!e || e._lx === undefined) continue;
      const dx = e.px - e._lx, dy = e.py - e._ly;
      if ((!dx && !dy) || Math.abs(dx) > 8 || Math.abs(dy) > 8) continue;
      saved.push(e, e.px, e.py); e.px = e._lx + dx * a; e.py = e._ly + dy * a;
    }
    const cx = this.cam.x, cy = this.cam.y, lx = this._lcx, ly = this._lcy;
    if (lx !== undefined && Math.abs(cx - lx) < 8 && Math.abs(cy - ly) < 8) { this.cam.x = lx + (cx - lx) * a; this.cam.y = ly + (cy - ly) * a; }
    return () => { for (let i = 0; i < saved.length; i += 3) { saved[i].px = saved[i + 1]; saved[i].py = saved[i + 2]; } this.cam.x = cx; this.cam.y = cy; };
  }
  update(top) {
    for (const e of [...this.ents, this.player, this.follower]) if (e) { e._lx = e.px; e._ly = e.py; }
    this._lcx = this.cam.x; this._lcy = this.cam.y; this._tick = G.frame;
    this.frame++;
    if (G.save) G.save.playtime += 1 / 60;
    this.parts.update(); this.fx.update();
    for (let i = this.footprints.length - 1; i >= 0; i--) if (++this.footprints[i].t > 240) this.footprints.splice(i, 1);
    for (const e of this.ents) { this.updateNPC(e, top); e.update(); }
    G.wilds.tick(this, top);
    if (this.surfing && this.player) this.swimFx(this.player);
    if (this.follower) {
      const f = this.follower; f.update();
      // the follower's two-frame hop: a lazy sway at rest, one hop a half-tile when walking, twice that running
      f.animT = (f.animT || 0) + (f.moving ? f.speed : .45); f.animF = Math.floor(f.animT / 12) % 2;
    }
    if (this.partner) this.partner.updateNet();
    const p = this.player;
    const arrived = p.update();
    if (arrived) this.afterStep();
    if (this.pendingTrigger && !this.busy && !p.moving) {
      const q = this.pendingTrigger; this.pendingTrigger = null;
      if (q.map === this.map.id && p.x === q.x && p.y === q.y && G.checkCond(q.t.cond)) { this.lockRun(() => G.runScript(q.t.script, { trigger: q.t })); return; }
    }
    if (top && !this.busy && !p.moving) this.control();
    else if (top && !this.busy && p.moving && p.prog >= 16 - p.speed && !p.jump) { /* chain handled in afterStep */ }
    if (!top || this.busy) this.turnHold = 0;
    // camera smoothing
    const t = this.camTarget(); this.cam.x = t.x; this.cam.y = t.y;
    if (this.shake > 0) this.shake--;
    if (G.audio && G.audio.ambience && this.frame % 60 === 0) G.audio.ambience(this.ambienceFor(this.map));   // after audio unlocks; follows day/night
    this.updateWeather();
    // race clock (Route 1): ticks only while the world is in control
    if (G.flag('race_active') && top && !this.busy) {
      const v = (G.save.vars.raceLeft || 0) - 1; G.save.vars.raceLeft = v;
      if (v === 60 * 5) G.audio && G.audio.sfx('exclaim');
      if (v <= 0) { G.save.flags.race_active = false; G.toast(`${G.save.rival || 'Wren'} got to Fernwick first!`); G.audio && G.audio.sfx('buzz'); }
    }
    if (G.net) G.net.tick();
    this.tickAutosave(top);
  }
  control() {
    const I = G.input, p = this.player;
    if (G.showcase && (I.pressed('start') || I.pressed('b'))) { I.consume('b'); I.consume('start'); this.lockRun(() => G.openShowcase()); return; }
    if (G.showcase && I.pressed('noclip')) { I.consume('noclip'); G.save.god.noclip = !G.save.god.noclip; G.toast('Noclip ' + (G.save.god.noclip ? 'on' : 'off')); }
    if (I.pressed('start') || I.pressed('b')) { I.consume('b'); I.consume('start'); G.run(() => G.openPauseMenu()); return; }
    if (I.pressed('a')) { I.consume('a'); G.run(() => this.interact()); return; }
    if (I.pressed('bike')) { I.consume('bike'); G.run(() => this.toggleBike()); return; }
    if (I.pressed('debug') && G.save.settings.god) { I.consume('debug'); G.run(() => G.openDebugMenu()); return; }
    if (I.pressed('help')) { I.consume('help'); G.run(() => G.showControls()); return; }
    const d = I.dirHeld();
    if (!d) { this.turnHold = 0; return; }
    if (p.dir !== d && this.turnHold === 0 && !this.lastMoved) { p.dir = d; this.turnHold = 1; return; }
    if (this.turnHold > 0 && this.turnHold < 3) { this.turnHold++; p.dir = d; return; }
    this.tryStep(d);
  }
  moveSpeed() {
    // BW pacing (the same as DP/HGSS) at 60 fps: walk 16 frames a tile (3.75 tiles/s), run 8, bike 6;
    // swimming is an unhurried 12, and holding run swims fast (8)
    const run = G.settings.autoRun ? !G.input.isDown('run') : G.input.isDown('run');
    if (this.surfing) return run ? 2 : 16 / 12;
    if (this.biking) return 16 / 6;
    if (run && this.map.type !== 'indoor' || run && this.map.def.canRun) return 2;
    return G.save.god.speed ? 8 : 1;
  }
  tryStep(d) {
    const p = this.player; const [dx, dy] = G.DIRS[d]; const nx = p.x + dx, ny = p.y + dy;
    p.dir = d;
    const c = this.cellAt(nx, ny);
    // ledge jump
    if (c && c.ledge && !this.surfing && !G.save.god.noclip) {
      if ((c.ledge === 'down' && d === 'down') || (c.ledge === 'left' && d === 'left') || (c.ledge === 'right' && d === 'right')) {
        const lx = nx + dx, ly = ny + dy;
        if (!this.blocked(lx, ly, p)) { p.startJump(d, 2); G.audio && G.audio.sfx('jump'); if (this.follower) this.follower.hidden = true; this.lastMoved = true; return true; }
      }
      this.bump(); return false;
    }
    // boulder push
    if (c && c.push && !this.boulderGone(nx, ny) && G.bag.has('gripboots') && !G.save.god.noclip) { G.run(() => this.pushBoulder(nx, ny, d)); return false; }
    // surf dismount onto land
    if (this.surfing && c && !c.water && !this.blocked(nx, ny, p, false)) {
      const isFollowerTile = this.follower && this.follower.x === nx && this.follower.y === ny;
      this.surfing = false; p.startMove(d, 1); this.lastMoved = true; G.audio && G.audio.sfx('step');
      G.run(async () => { await G.wait(16); this.placeFollower(); });
      return true;
    }
    if (this.blocked(nx, ny, p)) {
      // walking into a door warp? (doors are non-solid cells so handled by afterStep)
      const e = this.entAt(nx, ny, p);
      if (e && e.kind === 'wild') { G.wilds.engage(this, e, 'bump'); return false; }
      if (e && e.kind === 'partner' && G.net) { /* bump */ }
      this.bump(); return false;
    }
    p.startMove(d, this.moveSpeed()); this.lastMoved = true;
    this.moveFollower();
    return true;
  }
  boulderGone(x, y) { return this.map.boulders && this.map.boulders[x + ',' + y] === 'gone'; }
  bump() {
    if (this.frame - (this.lastBump || 0) > 18) { G.audio && G.audio.sfx('bump'); this.lastBump = this.frame; }
    this.lastMoved = false;
  }
  moveFollower() {
    const f = this.follower, p = this.player; if (!f) return;
    if (f.hidden) { f.hidden = false; f.x = p.x; f.y = p.y; f.px = p.px; f.py = p.py; }
    const d = G.dirFrom(p.x - f.x, p.y - f.y);
    if (f.x === p.x && f.y === p.y) return;
    if (Math.abs(p.x - f.x) + Math.abs(p.y - f.y) > 1) { f.x = p.x; f.y = p.y; f.px = p.px; f.py = p.py; return; }
    f.startMove(d, p.jump ? p.speed : p.speed);
    if (p.jump) { f.startJump(d, 1); f.nx = p.x; f.ny = p.y; }
  }
  afterStep() {
    { const L = G.party.lead(); if (L && G.tidemarks && !this.surfing) { G.tidemarks.onStep(L); if (G.tidemarks.pending() && !this.busy) G.run(() => G.tidemarks.announce()); } }
    const p = this.player, m = this.map;
    this.lastMoved = true;
    G.save.stats.steps++;
    this.stepFeel(p);
    // map edge -> neighbour map (seamless)
    if (p.x < 0 || p.y < 0 || p.x >= m.w || p.y >= m.h) {
      const r = m.resolve(p.x, p.y);
      if (r && r.cn) {
        const cn = r.cn; const ox = cn.ox, oy = cn.oy;
        const f = this.follower;
        this.map = r.map; p.x = r.x; p.y = r.y; p.px = p.x * 16; p.py = p.y * 16;
        if (f) { f.x -= ox; f.y -= oy; f.px -= ox * 16; f.py -= oy * 16; if (f.moving) { f.nx -= ox; f.ny -= oy; } }
        for (const pt of this.footprints) { pt.x -= ox; pt.y -= oy; }
        this.spawnEnts();
        G.save.pos = { map: r.map.id, x: p.x, y: p.y, dir: p.dir };
        if (r.map.type === 'outdoor') { G.save.lastOutdoor = { map: r.map.id, x: p.x, y: p.y }; if (r.map.def.town) G.save.visited[r.map.def.town] = true; }
        const mus = typeof r.map.def.music === 'function' ? r.map.def.music() : r.map.def.music;
        if (mus && G.audio) G.audio.music(mus);
        if (G.audio && G.audio.ambience) G.audio.ambience(this.ambienceFor(r.map));
        if (r.map.def.banner !== false) G.showBanner(r.map.name, r.map.def.subtitle);
        this.weather = r.map.def.weather ? (typeof r.map.def.weather === 'function' ? r.map.def.weather() : r.map.def.weather) : null;
        if (G.net) G.net.sendPos(true);
        this.autosaveIn = 40;
        if (r.map.def.onEnter) G.run(() => G.runScript(r.map.def.onEnter));
      }
    }
    G.save.pos.x = p.x; G.save.pos.y = p.y; G.save.pos.dir = p.dir;
    const c = this.cellAt(p.x, p.y);
    if (G.net) G.net.sendPos();
    // footprints in sand / snow
    if (c && (c.g === 'sand' || c.g === 'snow') && !this.biking) this.footprints.push({ x: p.x, y: p.y, dir: p.dir, t: 0 });
    if (p.landed) { p.landed = false; for (let i = 0; i < 6; i++) this.fx.add({ x: p.px + 8, y: p.py + 15, vx: (G.rand() - .5) * 1.2, vy: -G.rand() * .6, life: 18, size: 2, color: '#e8e0c8' }); }
    // bond grows as you walk together
    if (G.save.stats.steps % 128 === 0) for (const mm of G.save.party) if (mm.hp > 0) mm.bond = Math.min(255, mm.bond + (mm.item === 'soothebell' ? 2 : 1));
    // repel countdown
    if (G.save.repel > 0) { G.save.repel--; if (G.save.repel === 0) { G.run(() => this.repelOut()); return; } }
    // warps
    const w = m.warps.find(w => w.x === p.x && w.y === p.y && G.checkCond(w.cond));
    if (w && this.map === m) { this.lockRun(() => this.doWarp(w)); return; }
    if (this.busy) {
      // a trigger stepped on while a script is finishing must not be skipped (that let players slip
      // past story blockers): remember it and fire once the world is free, if still standing on it
      const tp = m.objs.find(o => o.type === 'trigger' && p.x >= o.x && p.x < o.x + (o.w || 1) && p.y >= o.y && p.y < o.y + (o.h || 1) && G.checkCond(o.cond));
      if (tp) this.pendingTrigger = { t: tp, x: p.x, y: p.y, map: m.id };
      this.lastMoved = false; return;
    }
    // triggers
    for (const t of m.objs.filter(o => o.type === 'trigger')) {
      if (p.x >= t.x && p.x < t.x + (t.w || 1) && p.y >= t.y && p.y < t.y + (t.h || 1) && G.checkCond(t.cond)) { this.lockRun(() => G.runScript(t.script, { trigger: t })); return; }
    }
    // gym switches
    if (c && c.sw && !G.flag(c.sw)) { G.setFlag(c.sw); G.audio && G.audio.sfx('switch'); this.shake = 6; G.toast('Click! Something powered up...'); }
    // ice sliding
    if (c && c.ice && !G.save.god.noclip) {
      const [dx, dy] = G.DIRS[p.dir];
      if (!this.blocked(p.x + dx, p.y + dy, p)) { p.startMove(p.dir, 2); p.stepN = 0; this.sliding = true; return; }
    }
    this.sliding = false;
    // trainers
    if (this.checkTrainers()) return;
    // encounters
    if (this.checkEncounter(c)) return;
    // rustling grass stepped on: a guaranteed, livelier encounter
    const ri = (this.rustles || []).findIndex(r => r.x === p.x && r.y === p.y && r.map === m.id);
    if (ri >= 0) { this.rustles.splice(ri, 1); G.run(() => G.startWild('grass', { rustle: true })); return; }
    // echo sparkle stepped on
    if (this.sparkle && this.sparkle.x === p.x && this.sparkle.y === p.y && this.sparkle.map === m.id) { const sp = this.sparkle; this.sparkle = null; G.run(() => G.startWild(null, { echo: true, table: sp.table })); return; }
    this.maybeSpawnSparkle();
    // continue walking if direction still held
    if (!this.busy && G.top() === this) {
      const d = G.input.dirHeld();
      if (d) { this.tryStep(d); }
      else this.lastMoved = false;
    }
  }
  async repelOut() {
    this.busy++;
    const has = ['maxrepel', 'superrepel', 'repel'].find(i => G.bag.has(i));
    if (has && await G.yesno(`The repellent wore off! Use another ${G.ITEMS[has].name}?`)) { G.bag.remove(has); G.save.repel = G.ITEMS[has].repel; G.audio && G.audio.sfx('item'); }
    else if (!has) await G.say('The repellent wore off!');
    this.busy--;
  }
  // visible encounters: a couple of tall-grass patches near the player shake now and then; stepping
  // into one always starts a battle, and the mon in it is stronger and more often a rare one
  updateRustles() {
    const m = this.map;
    this.rustles = (this.rustles || []).filter(r => r.map === m.id && ++r.t < 1500);
    if (m.type === 'indoor' || !m.def.enc || !m.def.enc.grass || this.frame % 90 !== 0 || this.rustles.length >= 2 || G.wilds.on()) return;
    if (G.rand() > .5) return;
    const p = this.player, cand = [];
    for (let y = p.y - 5; y <= p.y + 5; y++) for (let x = p.x - 8; x <= p.x + 8; x++) { const c = m.cell(x, y); if (c && c.g === 'tall' && Math.abs(x - p.x) + Math.abs(y - p.y) > 2 && !this.rustles.some(r => r.x === x && r.y === y)) cand.push([x, y]); }
    if (!cand.length) return;
    const [x, y] = G.pick(cand); this.rustles.push({ x, y, map: m.id, t: 0 });
  }
  drawRustles(b, ox, oy) {
    for (const r of this.rustles || []) {
      if (r.map !== this.map.id) continue;
      if (Math.sin(this.frame / 16 + r.x * 1.7) < .1) continue;   // bursts of shaking every second or so
      const x = r.x * 16 - ox, y = r.y * 16 - oy, j = (this.frame >> 2) % 2 ? 1 : -1;
      const c = this.map.cell(r.x, r.y), lt = c && G.liveTile(this.map, c, 0);
      if (lt && lt.img) { b.drawImage(lt.img, x + j, y + lt.oy - 1); b.drawImage(lt.img, x - j, y + lt.oy + 1); }
      b.fillStyle = 'rgba(255,255,220,.55)'; b.fillRect(x + 4 + j, y + 1, 1, 3); b.fillRect(x + 10 - j, y + 2, 1, 3);
      if (this.frame % 20 === 0) { this.fx.add({ x: r.x * 16 + 8 + (G.rand() - .5) * 8, y: r.y * 16 + 4, vx: (G.rand() - .5), vy: -1.1, ay: .07, life: 22, type: 'leaf', size: 1.5, rot: G.rand() * 6, vr: .2, color: '#6ab84a' }); if (Math.abs(r.x - this.player.x) + Math.abs(r.y - this.player.y) < 7) G.audio && G.audio.sfx('rustle'); }
    }
  }
  maybeSpawnSparkle() {
    if (this.sparkle || this.map.type === 'indoor' || !this.map.def.enc || !this.map.def.enc.grass) return;
    if (G.rand() > 1 / 180) return;
    const p = this.player; const cand = [];
    for (let y = p.y - 6; y <= p.y + 6; y++) for (let x = p.x - 9; x <= p.x + 9; x++) { const c = this.map.cell(x, y); if (c && c.g === 'tall' && Math.abs(x - p.x) + Math.abs(y - p.y) > 3) cand.push([x, y]); }
    if (!cand.length) return;
    const [x, y] = G.pick(cand); this.sparkle = { x, y, map: this.map.id, t: 0, table: 'grass' };
    G.audio && G.audio.sfx('sparkle');
  }
  checkEncounter(c) {
    if (!c || G.save.god.noEnc || G.wilds.on()) return false;
    const enc = this.map.def.enc; if (!enc) return false;
    let table = null;
    if (this.surfing && c.water && enc.surf) table = 'surf';
    else if (c.enc === 'grass' && enc.grass) table = 'grass';
    else if (c.enc === 'cave' && enc.cave) table = 'cave';
    if (!table) return false;
    this.stepsSinceEnc++;
    const rate = (table === 'grass' ? .1 : table === 'cave' ? .075 : .085) * (c.rare ? 1.4 : 1) * (G.party.lead() && G.mon.ability(G.party.lead()) === 'illuminate' ? 1.5 : 1);
    if (this.stepsSinceEnc < 3 || G.rand() > rate) return false;
    this.stepsSinceEnc = 0;
    G.run(() => G.startWild(table, { rare: c.rare }));
    return true;
  }
  checkTrainers() {
    const p = this.player;
    for (const e of this.ents) {
      if (e.kind !== 'trainer' || e.defeated || !e.sight || this.busy) continue;
      const [dx, dy] = G.DIRS[e.dir];
      for (let k = 1; k <= e.sight; k++) {
        const x = e.x + dx * k, y = e.y + dy * k;
        if (x === p.x && y === p.y) { G.run(() => G.trainerSpotted(e, k)); return true; }
        const cc = this.cellAt(x, y); if (!cc || (cc.solid && !cc.ledge) || this.entAt(x, y, e)) break;
      }
    }
    return false;
  }
  // UI layer over the 3D world: emotes above heads and the race clock
  drawUI3d(c) {
    const U = G.ui;
    G.wilds.drawPops((x, y) => G.W3.project(x, y, 1.2));
    for (const e of [...this.ents, this.player, this.follower].filter(Boolean)) if (e.emote) {
      const q = G.W3.project(e.px + 8, e.py + 16, 3.6); if (!q) continue;   // just above a 32-px head on the pixel grid
      const k = Math.min(1, e.emoteT / 6); U.img(G.EMOTES(e.emote), q.x - 6.5, q.y - 12 - k * 4);
    }
    if (G.flag('race_active')) {
      const v = Math.max(0, G.save.vars.raceLeft || 0), low = v < 60 * 5;
      U.panel(G.W / 2 - 34, 4, 68, 16, low ? 'red' : 'dark', { r: 4 });
      U.text('RACE  ' + (v / 60).toFixed(1) + 's', G.W / 2, 7.5, { size: 7.4, weight: 800, align: 'center', color: '#fff' });
    }
  }
  // start a script and hold the world still from this very frame (G.run starts it a tick later,
  // which let a running player take one more step past story blockers)
  lockRun(fn) { this.busy++; G.run(async () => { try { await fn(); } finally { this.busy--; } }); }
  // physical feedback for each step: surface footsteps, grass rustle and blades, running dust
  stepFeel(p) {
    const c = this.cellAt(p.x, p.y); if (!c) return;
    const g = c.g, A = G.audio;
    const fs = g === 'tall' ? 'rustle' : g === 'grass' || g === 'flowers' ? 'fs_grass' : g === 'sand' || g === 'path' || g === 'ash' ? 'fs_sand' : g === 'bridge' || g === 'bridgev' || g === 'wood' ? 'fs_wood' : g === 'pave' || g === 'tilefloor' || g === 'gymfloor' || g === 'metal' ? 'fs_stone' : g === 'snow' ? 'fs_snow' : null;
    if (A && fs && !this.surfing) A.sfx(fs);
    const fx = p.px + 8, fy = p.py + 14;
    if (g === 'tall') for (let i = 0; i < 5; i++) this.fx.add({ x: fx + (G.rand() - .5) * 10, y: fy - 4, vx: (G.rand() - .5) * 1.2, vy: -.8 - G.rand() * .8, ay: .08, life: 22, type: 'leaf', size: 1.4, rot: G.rand() * 6, vr: .2, color: G.pick(['#3a8a3a', '#5aa84a', '#2a6a30']) });
    if (p.speed >= 2 && !this.surfing && (g === 'path' || g === 'sand' || g === 'ash' || g === 'snow'))
      for (let i = 0; i < 2; i++) this.fx.add({ x: fx - G.DIRS[p.dir][0] * 6 + (G.rand() - .5) * 4, y: fy + 1, vx: -G.DIRS[p.dir][0] * .3 + (G.rand() - .5) * .3, vy: -.25, life: 18, type: 'circle', size: 2 + G.rand() * 1.5, grow: .06, color: g === 'snow' ? 'rgba(255,255,255,1)' : 'rgba(214,190,150,1)', alpha: .5 });
  }
  // swimming: ripples spread from you, a foam wake trails behind while you move and each stroke splashes
  // (fast swimming churns more). Spawned here so the 2D and 3D views show the same water.
  swimFx(p) {
    const cx = p.px + 8, cy = p.py + 13, fast = p.moving && p.speed >= 2, f = this.frame;
    if (f % (p.moving ? (fast ? 9 : 14) : 26) === 0) this.fx.add({ x: cx, y: cy, life: 30, type: 'ring', size: 3, grow: 2.6, color: 'rgba(235,250,255,.7)', lw: .8, water: true });
    if (!p.moving) return;
    const [dx, dy] = G.DIRS[p.dir], sx = -dy, sy = dx;   // sideways, for the two arms of the wake
    if (f % (fast ? 2 : 4) === 0) for (const side of [-1, 1]) this.fx.add({ x: cx - dx * 5 + sx * side * 3, y: cy - dy * 4 + sy * side * 2, vx: -dx * .15 + sx * side * .35, vy: -dy * .1 + sy * side * .25, life: fast ? 26 : 34, type: 'square', size: 1 + (G.rand() < .4 ? 1 : 0), color: 'rgba(240,252,255,1)', alpha: fast ? .85 : .7, water: true });
    if (f % (fast ? 8 : 16) === 0) for (let i = 0; i < (fast ? 5 : 3); i++) this.fx.add({ x: cx + (G.rand() - .5) * 8 + dx * 3, y: cy - 2, vx: (G.rand() - .5) * .8 + dx * .3, vy: -1.1 - G.rand() * .9, ay: .12, life: 20, type: 'square', size: 1, color: 'rgba(255,255,255,1)', alpha: .9, water: true });
    if (f % (fast ? 16 : 24) === 4 && G.audio) G.audio.sfx('fs_water');
  }
  ambienceFor(m) {
    if (m.type === 'cave') return 'cave';
    if (m.type !== 'outdoor') return null;
    if (m.theme === 'snow') return 'wind';
    if (m.theme === 'beach' || m.cells.filter(c => c.water).length > m.cells.length * .15) return 'coast';
    return G.clock.isNight() ? null : 'birds';
  }
  updateNPC(e, top) {
    if (e.kind !== 'npc' && e.kind !== 'trainer') return;
    // townsfolk notice you: a glance when you walk up close
    if (e.kind === 'npc' && (e.move === 'wander' || e.move === 'look') && !e.moving && !e.scripted) {
      const p = this.player, d = Math.abs(p.x - e.x) + Math.abs(p.y - e.y);
      if (d <= 2 && !e.glanced && !this.busy) { e.glanced = true; e.dir = Math.abs(p.x - e.x) > Math.abs(p.y - e.y) ? (p.x < e.x ? 'left' : 'right') : (p.y < e.y ? 'up' : 'down'); e.wanderT = 120; }
      else if (d > 3) e.glanced = false;
    }
    if (this.busy || e.moving || e.scripted) return;
    if (!e.move || e.move === 'static') return;
    if (--e.wanderT > 0) return;
    e.wanderT = G.randInt(80, 220);
    if (e.move === 'look' || (e.kind === 'trainer' && !e.defeated)) { e.dir = G.pick(e.looks || ['up', 'down', 'left', 'right']); return; }
    if (e.move === 'wander') {
      const d = G.pick(['up', 'down', 'left', 'right']); const [dx, dy] = G.DIRS[d];
      const nx = e.x + dx, ny = e.y + dy;
      e.dir = d;
      if (Math.abs(nx - e.homeX) > (e.radius || 2) || Math.abs(ny - e.homeY) > (e.radius || 2)) return;
      const p = this.player;
      if (this.blocked(nx, ny, e) || (p.x === nx && p.y === ny) || (p.tx === nx && p.ty === ny)) return;
      if (this.follower && this.follower.x === nx && this.follower.y === ny) return;
      e.startMove(d, 1);
    }
  }
  // ---------------------------------------------------------- actions
  async doWarp(w) {
    this.busy++;
    const p = this.player;
    if (w.locked && !G.checkCond(w.unlock)) { await G.say(w.lockedMsg || 'It\'s locked.'); p.startMove(G.OPP[p.dir] || 'down', 1); this.busy--; return; }
    G.audio && G.audio.sfx(w.kind === 'door' ? 'door' : w.kind === 'cave' ? 'stairs' : 'stairs');
    const outdoorDoor = w.kind === 'door' && this.map.type === 'outdoor';
    if (outdoorDoor) {
      // the door swings open, warm light spills out, and you step inside
      this.doorFx = { x: w.x, y: w.y, t: 0, mode: 'open' };
      await G.wait(9);
      const f = G.fadeOut(14);
      for (let i = 0; i < 10; i++) { p.py -= .8; await G.wait(1); }
      await f;
    } else await G.fadeOut(12);
    this.doorFx = null;
    let to = w.to, tx = w.tx, ty = w.ty, dir = w.dir || p.dir;
    if (to === '_back') { const r = G.save.returnTo || G.save.lastOutdoor; to = r.map; tx = r.x; ty = r.y; dir = 'down'; }
    const src = this.map;
    if (w.kind === 'door' && src.type === 'outdoor') G.save.returnTo = { map: src.id, x: w.x, y: w.y + 1 };
    if (G.MAPDEFS[to] && G.MAPDEFS[to].isHaven) G.save.lastHeal = { map: to, x: 7, y: 6, back: { map: src.id, x: w.x, y: w.y + 1 } };
    this.enterMap(to, tx, ty, dir);
    // stepping back outside: the door you came through closes behind you
    const back = this.map.type === 'outdoor' && src.type !== 'outdoor' && G.save.returnTo && to === G.save.returnTo.map;
    if (back) this.doorFx = { x: tx, y: ty - 1, t: 0, mode: 'close' };
    await G.wait(4);
    await G.fadeIn(12);
    if (back) { await G.wait(12); this.doorFx = null; }
    this.busy--;
  }
  drawDoorFx(b, ox, oy) {
    const d = this.doorFx; if (!d) return;
    d.t++;
    const k = d.mode === 'open' ? Math.min(1, d.t / 8) : Math.max(0, 1 - d.t / 10);
    if (k <= 0) return;
    const cx = d.x * 16 + 8 - ox, by = d.y * 16 + 14 - oy, w = Math.round(12 * k), h = 15;
    b.fillStyle = '#14101c'; b.fillRect(Math.round(cx - w / 2), by - h, w, h);
    b.fillStyle = 'rgba(255,196,110,.55)'; b.fillRect(Math.round(cx - w / 2) + 1, by - h + 2, Math.max(0, w - 2), h - 2);
    b.fillStyle = 'rgba(255,226,160,.35)'; b.beginPath(); b.moveTo(cx - w / 2, by); b.lineTo(cx + w / 2, by); b.lineTo(cx + w / 2 + 4 * k, by + 5 * k); b.lineTo(cx - w / 2 - 4 * k, by + 5 * k); b.closePath(); b.fill();
  }
  async warpTo(map, x, y, dir, fade = true) {
    this.busy++;
    if (fade) await G.fadeOut(12);
    this.enterMap(map, x, y, dir);
    if (fade) { await G.wait(4); await G.fadeIn(12); }
    this.busy--;
  }
  facing() { const p = this.player, [dx, dy] = G.DIRS[p.dir]; return { x: p.x + dx, y: p.y + dy }; }
  async interact() {
    const p = this.player; const f = this.facing();
    this.busy++;
    try {
      let e = this.entAt(f.x, f.y, p);
      const c = this.cellAt(f.x, f.y);
      if (!e && c && (c.counter || c.o === 'table')) { const [dx, dy] = G.DIRS[p.dir]; e = this.entAt(f.x + dx, f.y + dy, p); }
      if (e) { await this.talkTo(e); return; }
      // hidden items (invisible entities)
      const hid = this.ents.find(x => x.kind === 'item' && x.hidden && x.x === f.x && x.y === f.y);
      if (hid) { await this.pickItem(hid); return; }
      if (this.partner && this.partner.x === f.x && this.partner.y === f.y) { await G.net.interactPartner(); return; }
      if (this.follower && !this.follower.hidden && this.follower.x === f.x && this.follower.y === f.y) { await this.talkFollower(); return; }
      if (!c) return;
      if (c.pc) { await G.openPC(); return; }
      if (c.lockedDoor) { await G.say(c.lockedDoor); return; }
      if (c.cut && !this.isCleared(this.map.id, f.x, f.y)) {
        if (G.bag.has('trailknife')) { if (await G.yesno('This thin tree looks like it can be cut down. Use the Trail Knife?')) await this.clearObstacle(f.x, f.y, 'cut'); }
        else await G.say('This thin tree looks like it could be cut down with the right tool.');
        return;
      }
      if (c.smash && !this.isCleared(this.map.id, f.x, f.y)) {
        if (G.bag.has('pickhammer')) { if (await G.yesno('This rock looks cracked. Smash it with the Pick Hammer?')) await this.clearObstacle(f.x, f.y, 'smash'); }
        else await G.say('A cracked boulder. A good hammer could shatter it.');
        return;
      }
      if (c.push && !this.boulderGone(f.x, f.y)) { await G.say(G.bag.has('gripboots') ? 'A big boulder. Walk into it to push it with your Grip Boots.' : 'A huge boulder. It won\'t budge without proper footing.'); return; }
      if (c.water && !this.surfing) {
        const opts = []; if (G.bag.has('tideboard')) opts.push('Surf'); if (G.bag.has('rod') || G.bag.has('prorod')) opts.push('Fish'); opts.push('Cancel');
        if (opts.length === 1) { await G.say('The water is a deep blue...'); return; }
        const i = await G.ask('The water is calm and deep. What will you do?', opts);
        if (opts[i] === 'Surf') await this.startSurf(f);
        if (opts[i] === 'Fish') await G.fish();
        return;
      }
      if (c.water && this.surfing && (G.bag.has('rod') || G.bag.has('prorod'))) { await G.fish(); return; }
      if (c.o === 'tv') { await G.say(G.pick(['A cooking show is on. Today: "Seven Ways to Cook a Sunberry."', 'It\'s a documentary about the Lodestar. The narrator sounds very serious.', 'A commercial: "Crane Dynamics — Bonds Built to Last!"', 'The weather channel: "Rain expected over Duskmere. As always."'])); return; }
      if (c.o === 'shelf') { await G.say(G.pick(['Books about Echo habitats, neatly arranged.', '"Resonance: Fact or Folklore?" It\'s dog-eared from rereading.', 'A cookbook. The berry tart page is stained with juice.', '"Advanced Type Matchups, Vol. 3." The margins are full of notes.'])); return; }
      if (c.o === 'healer' || c.o === 'machine') { await G.say('It\'s humming softly.'); return; }
    } finally { this.busy--; }
  }
  async talkTo(e) {
    const p = this.player;
    if (e.kind === 'item') { await this.pickItem(e); return; }
    if (e.kind === 'wild') { e.dir = G.OPP[p.dir]; G.wilds.engage(this, e, 'talk'); return; }
    if (e.kind === 'sign') { if (e.script) await G.runScript(e.script, { ent: e }); else await G.say(e.text); return; }
    if (e.kind === 'npc' || e.kind === 'trainer') {
      if (!e.noTurn) e.dir = G.OPP[p.dir];
      if (e.kind === 'trainer' && !e.defeated) { await G.trainerBattleFromEnt(e); return; }
      if (e.kind === 'trainer' && e.defeated) {
        const tr = G.TRAINERS[e.trainer];
        if (G.canRematch(e.trainer)) { if (await G.yesno((tr.rematchLine || 'Want a rematch? I\'ve been training!') + '\\p(Rematch this trainer?)')) { await G.trainerBattleFromEnt(e, true); return; } }
        await G.say(tr && tr.after ? tr.after : '...', { speaker: tr ? tr.name : null, look: e.look }); return;
      }
      if (e.script) await G.runScript(e.script, { ent: e });
      else if (e.text) await G.say(e.text, { speaker: e.name, look: e.look });
    }
  }
  async pickItem(e) {
    const it = G.ITEMS[e.item]; if (!it) return;
    G.save.items[this.map.id + ':' + e.id] = true;
    this.ents = this.ents.filter(x => x !== e);
    if (e.monTrap) { await G.say('Huh? The item ball is... moving?!'); await G.startWild(null, { species: e.monTrap, lvl: e.lvl || 20 }); return; }
    G.bag.add(e.item, e.qty || 1);
    G.audio && G.audio.sfx('itemget');
    await G.say(`${e.hidden ? 'You found a hidden' : 'You found'} {b}${it.name}{w}${(e.qty || 1) > 1 ? ' ×' + e.qty : ''}!\\pYou put it in the ${G.POCKETS.find(p => p.id === it.pocket).name} pocket.`);
  }
  async clearObstacle(x, y, kind) {
    G.audio && G.audio.sfx(kind === 'cut' ? 'cut' : 'smash');
    const col = kind === 'cut' ? '#5ab04a' : '#a8a49c';
    for (let i = 0; i < 14; i++) this.fx.add({ x: x * 16 + 8, y: y * 16 + 8, vx: (G.rand() - .5) * 3, vy: -G.rand() * 2.5, ay: .15, life: 30, size: 2 + G.rand() * 2, color: col });
    this.shake = kind === 'smash' ? 10 : 0;
    const r = this.map.resolve(x, y);
    G.save.cleared[r.map.id + ':' + r.x + ':' + r.y] = true;
    await G.wait(16);
    if (kind === 'smash' && this.map.def.enc && this.map.def.enc.rock && G.chance(.35)) await G.startWild('rock');
  }
  async pushBoulder(x, y, d) {
    const [dx, dy] = G.DIRS[d]; const nx = x + dx, ny = y + dy;
    const c = this.cellAt(nx, ny);
    if (!c || (c.solid && !(c.push && this.boulderGone(nx, ny))) || c.water || this.entAt(nx, ny) || this.boulderAt(nx, ny) === 'moved' || (c.ice && false)) {
      if (c && c.g === 'hole') { /* drop in handled below */ } else { this.bump(); return; }
    }
    this.busy++;
    G.audio && G.audio.sfx('push');
    if (!this.map.boulders) this.map.boulders = {};
    this.map.boulders[x + ',' + y] = 'gone';
    const anim = { x: x * 16, y: y * 16, tx: nx * 16, ty: ny * 16 };
    this.movingBoulder = anim;
    await G.tween(anim, { x: nx * 16, y: ny * 16 }, 14, G.ease.linear);
    this.movingBoulder = null;
    if (c && c.g === 'hole') { this.map.boulders[nx + ',' + ny] = 'filled'; G.audio && G.audio.sfx('smash'); this.shake = 8; if (this.map.def.onBoulderHole) await G.runScript(this.map.def.onBoulderHole, { x: nx, y: ny }); }
    else this.map.boulders[nx + ',' + ny] = 'moved';
    this.busy--;
  }
  async startSurf(f) {
    if (this.follower) { this.follower = null; }
    G.audio && G.audio.sfx('surf');
    this.surfing = true; this.biking = false;
    this.player.startJump(this.player.dir, 1);
    await G.wait(12);
  }
  async toggleBike() {
    if (!G.bag.has('bike')) { await G.say('You don\'t have anything registered to use.'); return; }
    if (this.map.type === 'indoor' && !this.map.def.canBike) { await G.say('You can\'t ride your Bike in here.'); return; }
    if (this.surfing) return;
    this.biking = !this.biking; G.audio && G.audio.sfx(this.biking ? 'bike' : 'select');
    if (G.audio) G.audio.music(this.biking ? 'bike' : (typeof this.map.def.music === 'function' ? this.map.def.music() : this.map.def.music));
  }
  async talkFollower() {
    const f = this.follower, m = f.mon, sp = G.SPECIES[m.sp], n = G.mon.name(m);
    f.dir = G.OPP[this.player.dir];
    const lines = [];
    if (m.hp < G.mon.maxHP(m) / 3) lines.push(`${n} looks exhausted... It could use some rest.`);
    if (m.status) lines.push(`${n} is shivering. It doesn't look well.`);
    if (m.bond >= 220) lines.push(`${n} nuzzles you affectionately. Your bond is unbreakable.`, `${n} is looking at you with total trust.`);
    else if (m.bond >= 150) lines.push(`${n} is humming happily beside you.`, `${n} bumps into you playfully.`);
    else lines.push(`${n} is looking around curiously.`, `${n} seems to be sizing you up.`);
    const w = this.weather;
    if (w === 'rain') lines.push(sp.types.includes('water') ? `${n} is splashing in the puddles with glee!` : `${n} shakes the rain off. It's not a fan.`);
    if (w === 'snow') lines.push(sp.types.includes('ice') ? `${n} is making tiny snow angels!` : `${n} is catching snowflakes on its nose.`);
    if (G.clock.isNight()) lines.push(`${n} is getting sleepy...`);
    if (this.map.def.town) lines.push(`${n} seems to like this town.`);
    if (sp.types.includes('fire') && w === 'rain') lines.push(`${n}'s flames are sputtering in the rain.`);
    const e = m.bond >= 150 ? 'heart' : m.hp < G.mon.maxHP(m) / 3 ? 'sweat' : G.clock.isNight() ? 'zzz' : 'note';
    f.emote = e; f.emoteT = 0; f.emoteLife = 70;
    G.audio && G.audio.cry(m.sp);
    await G.wait(20);
    await G.say(G.pick(lines));
  }
  // sunbeams: a few soft diagonal shafts from the upper left in daylight, in stepped (pixel) bands,
  // drifting slowly and parallaxing a little with the camera; stronger under forest canopy
  drawRays(b, ox, oy) {
    const m = this.map;
    if (m.type !== 'outdoor' || G.settings.fancy === false) return;
    if (this.weather && this.weather !== 'petals' && this.weather !== 'leaves') return;
    const h = G.clock.hourF();
    const day = h >= 7 && h <= 17 ? 1 : h > 17 && h < 19 ? (19 - h) / 2 : h > 6 && h < 7 ? h - 6 : 0;
    if (day <= 0) return;
    const forest = m.id.includes('wood') || m.id.includes('forest');
    const warm = h > 16 ? '255,196,120' : '255,244,200', base = (forest ? .11 : .065) * day;
    const t = this.frame;
    b.save(); b.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 5; i++) {
      const phase = t / (520 + i * 90) + i * 1.9, life = Math.max(0, Math.sin(phase));   // each shaft fades in and out on its own
      if (life < .05) continue;
      const x = ((i * 97 - ox * .15 + t * .04) % (G.W + 140) + G.W + 140) % (G.W + 140) - 60, w = 14 + (i % 3) * 10, lean = 70;
      for (let k = 0; k < 2; k++) {   // two nested bands: wide faint, narrow brighter
        const ww = w * (1 - k * .5);
        b.fillStyle = `rgba(${warm},${(base * life * (k ? 1 : .6)).toFixed(3)})`;
        b.beginPath(); b.moveTo(x - ww / 2, -4); b.lineTo(x + ww / 2, -4); b.lineTo(x + ww / 2 + lean, G.H + 4); b.lineTo(x - ww / 2 + lean, G.H + 4); b.closePath(); b.fill();
      }
    }
    b.restore();
  }
  // ---------------------------------------------------------- weather
  updateWeather() {
    const w = this.weather; this.weatherT++;
    const P = this.parts, cx = this.cam.x, cy = this.cam.y;
    if (w === 'rain' || w === 'storm') {
      for (let i = 0; i < (w === 'storm' ? 5 : 3); i++) P.add({ x: cx + G.rand() * (G.W + 60) - 30, y: cy - 10, vx: -1.3, vy: 6.5, life: 30 + G.randInt(0, 10), type: 'line', len: 1.2, color: 'rgba(200,220,255,.6)', lw: 1, world: true, upd: p => { if (p.t === p.life - 1) this.fx.add({ x: p.x, y: p.y, life: 10, type: 'ring', size: 1, grow: 2, color: 'rgba(220,235,255,.6)', lw: .6 }); } });
      if (w === 'storm' && G.chance(1 / 400)) { this.lightning = 12; G.audio && G.audio.sfx('thunder'); }
    } else if (w === 'snow' || w === 'blizzard') {
      for (let i = 0; i < (w === 'blizzard' ? 4 : 1.2); i++) if (G.rand() < (w === 'blizzard' ? 1 : .6)) P.add({ x: cx + G.rand() * (G.W + 80) - 40, y: cy - 6, vx: w === 'blizzard' ? -2.2 : -.3, vy: w === 'blizzard' ? 1.6 : .55 + G.rand() * .4, life: 400, size: G.rand() < .3 ? 2 : 1, color: '#ffffff', upd: p => { p.vx += Math.sin((p.t + p.y) / 30) * .02; } });
    } else if (w === 'ash') {
      if (G.rand() < .5) P.add({ x: cx + G.rand() * (G.W + 80), y: cy - 6, vx: -.4 - G.rand() * .3, vy: .35 + G.rand() * .3, life: 450, size: G.rand() < .3 ? 2 : 1, color: G.rand() < .15 ? '#ffb070' : '#8a8078', upd: p => { p.vx += Math.sin((p.t + p.x) / 25) * .015; } });
    } else if (w === 'petals') {
      if (G.rand() < .18) P.add({ x: cx + G.rand() * (G.W + 80), y: cy - 6, vx: -.5, vy: .45 + G.rand() * .3, life: 450, type: 'leaf', size: 1.8, rot: G.rand() * 6, vr: .06, color: G.pick(['#ffc0d8', '#ffd8e8', '#ff9ac0']), upd: p => { p.vx += Math.sin((p.t) / 20) * .03; } });
    } else if (w === 'leaves') {
      if (G.rand() < .1) P.add({ x: cx + G.rand() * (G.W + 80), y: cy - 6, vx: -.4, vy: .5 + G.rand() * .3, life: 450, type: 'leaf', size: 2, rot: G.rand() * 6, vr: .05, color: G.pick(['#6ab04a', '#e8a83a', '#c86a3a']), upd: p => { p.vx += Math.sin((p.t) / 22) * .03; } });
    } else if (w === 'sand') {
      for (let i = 0; i < 3; i++) P.add({ x: cx + G.W + 10, y: cy + G.rand() * G.H, vx: -5 - G.rand() * 3, vy: .6, life: 90, type: 'line', len: 1.4, color: 'rgba(220,190,130,.55)', lw: 1 });
    } else if (w === 'fog' || w === 'mist') {
      if (G.rand() < .03) P.add({ x: cx + G.W + 40, y: cy + G.rand() * G.H, vx: -.25 - G.rand() * .2, vy: 0, life: 1800, type: 'circle', size: 30 + G.rand() * 30, color: 'rgba(230,235,245,1)', alpha: .09, fadeIn: 200, fadeStart: .8 });
    }
    // ambient life on calm outdoor maps: wind-borne leaves / petals / pollen, sparse and slow
    const m = this.map;
    if (m.type === 'outdoor' && !w && G.settings.fancy !== false) {
      const wind = G.wind(this.frame), day = !G.clock.isNight();
      const green = m.theme === 'grass' || !m.theme, spawnX = () => cx + G.rand() * (G.W + 120) - 20;
      if (green && G.rand() < .022) P.add({ x: spawnX(), y: cy - 6, vx: -.2, vy: .32 + G.rand() * .2, life: 700, type: 'leaf', size: 1.6 + G.rand() * .5, rot: G.rand() * 6, vr: .05, color: G.pick(['#5a9a3a', '#7ab84a', '#c8b04a', '#d88a3a']), upd: p => { p.vx = -.15 - G.wind(this.frame) * .9 + Math.sin(p.t / 24) * .25; p.vr = .03 + G.wind(this.frame) * .08; } });
      if (m.theme === 'dusk' && G.rand() < .03) P.add({ x: spawnX(), y: cy - 6, vx: -.3, vy: .3 + G.rand() * .2, life: 700, type: 'leaf', size: 1.5, rot: G.rand() * 6, vr: .06, color: G.pick(['#ffc0d8', '#ffd8e8', '#ff9ac0']), upd: p => { p.vx = -.2 - G.wind(this.frame) + Math.sin(p.t / 20) * .3; } });
      if (m.theme === 'snow' && G.rand() < .12) P.add({ x: spawnX(), y: cy - 6, vx: -.2, vy: .35 + G.rand() * .25, life: 600, size: G.rand() < .25 ? 2 : 1, color: '#ffffff', upd: p => { p.vx = -.1 - G.wind(this.frame) * .8 + Math.sin((p.t + p.y) / 30) * .2; } });
      // 3D view: leaves let go of the trees near the player and spiral down; flocks of birds cross
      // high overhead; chimneys smoke; now and then a fish jumps in nearby water
      if (G.in3d) {
        const p0 = this.player;
        if (green && this.frame % 18 === 0) {
          const tx = p0.x + G.randInt(-10, 10), ty = p0.y + G.randInt(-7, 6), tc = this.cellAt(tx, ty);
          if (tc && (tc.o === 'tree' || tc.o === 'smalltree')) P.add({ x: tx * 16 + 8 + (G.rand() - .5) * 10, y: ty * 16 + 4, h3: 2 + G.rand() * 1.2, vx: 0, vy: .02, life: 420, type: 'leaf', size: 1.7, rot: G.rand() * 6, vr: .08, fadeIn: 20, color: G.pick(['#6aa83a', '#8ac04a', '#d8b84a', '#e0903a']),
            upd: p => { p.h3 -= .007; p.vx = -.12 - G.wind(this.frame) * .5 + Math.sin(p.t / 18) * .3; if (p.h3 < .05) p.t = Math.max(p.t, p.life - 30), p.h3 = .05; } });
        }
        if (day && this.frame % 900 === 450 && G.rand() < .8) {
          const y0 = p0.py - 60 - G.rand() * 80, dir = G.rand() < .5 ? 1 : -1, x0 = p0.px - dir * 260;
          for (let i = 0; i < 5 + G.randInt(0, 4); i++) P.add({ x: x0 - dir * (i % 3) * 14 - dir * i * 6, y: y0 + (i % 2 ? 10 : -6) + i * 4, h3: 5.5 + (i % 3) * .4, vx: dir * 1.3, vy: -.05, life: 480, type: 'bfly', size: 2.4, color: '#2c2a36', rot: i });
        }
        // smoke curls up out of each real 3D chimney
        if (this.frame % 30 === 0 && G.W3 && G.W3.chimneys) for (const ch of G.W3.chimneys()) {
          if (Math.abs(ch.x - p0.x) > 16 || Math.abs(ch.z - p0.y) > 12) continue;
          P.add({ x: ch.x * 16, y: ch.z * 16, abs: { y: ch.y, z: ch.z }, h3: 0, vx: 0, vy: 0, life: 170, size: 1.6, grow: 2.6, color: 'rgba(220,220,228,1)', alpha: .36, fadeIn: 18, type: 'circle',
            upd: p => { p.h3 += .014; p.vx = -.08 - G.wind(this.frame) * .35; p.vy = 0; } });
        }
        // hot springs steam
        if (m.def.hotspring && this.frame % 4 === 0) {
          if (!m._springs) m._springs = m.cells.filter(c => c.g === 'water');
          const c = m._springs.length && m._springs[G.randInt(0, m._springs.length - 1)];
          if (c && Math.abs(c.x - p0.x) < 14 && Math.abs(c.y - p0.y) < 10) P.add({ x: c.x * 16 + 4 + G.rand() * 8, y: c.y * 16 + 8, h3: .15, vx: 0, vy: 0, life: 150, size: 2.4, grow: 2.8, color: 'rgba(240,236,236,1)', alpha: .3, fadeIn: 30, type: 'circle',
            upd: p => { p.h3 += .016; p.vx = Math.sin(p.t / 30 + p.x) * .12 - G.wind(this.frame) * .2; } });
        }
        // fountains play
        if (this.frame % 3 === 0) {
          if (!m._fountains) { const seen = new Set(); m._fountains = []; for (const c of m.cells) if (c.o === 'fountain') { const F = G.fountainOf(m, c.x, c.y); if (!seen.has(F)) { seen.add(F); m._fountains.push({ x: F.x0 + F.w / 2, y: F.y0 + F.h / 2, k: F.w === 1 && F.h === 1 ? 1 : (Math.min(F.w, F.h) / 2 + .1) / 1.32 }); } } }
          for (const c of m._fountains) {   // one jet per fountain, from its top bowl
            if (Math.abs(c.x - p0.x) > 12 || Math.abs(c.y - p0.y) > 9) continue;
            const a = G.rand() * Math.PI * 2, sp = (.35 + G.rand() * .35) * c.k;
            this.fx.add({ x: c.x * 16, y: c.y * 16 - 30 * c.k, z0: c.y * 16, vx: Math.cos(a) * sp * .8, vy: -.7 - G.rand() * .4, ay: .05, life: 34, size: 1, color: 'rgba(220,240,255,1)', alpha: .85, type: 'square' });
            if (this.frame % 30 === 0) this.fx.add({ x: c.x * 16, y: c.y * 16 + 3, life: 40, type: 'ring', size: 3 * c.k, grow: 1.6, color: 'rgba(255,255,255,.5)', lw: .8 });
          }
        }
        if (this.frame % 240 === 120 && G.rand() < .6) {
          const wx = p0.x + G.randInt(-9, 9), wy = p0.y + G.randInt(-6, 7), wc = this.cellAt(wx, wy);
          if (wc && wc.water && wc.g === 'water') {
            const fx = wx * 16 + 8, fy = wy * 16 + 10;
            for (let i = 0; i < 10; i++) this.fx.add({ x: fx + (G.rand() - .5) * 6, y: fy, vx: (G.rand() - .5) * .9, vy: -1.3 - G.rand() * 1.2, ay: .09, life: 30, size: 1.2, color: 'rgba(235,248,255,1)', type: 'circle' });
            for (let i = 0; i < 2; i++) this.fx.add({ x: fx, y: fy + 2, life: 40 + i * 14, type: 'ring', size: 3 + i * 2, grow: 3, color: 'rgba(255,255,255,.55)', lw: .8 });
          }
        }
      }
      // butterflies flutter over grassy places by day
      if (day && green && G.rand() < .006 && this.parts.list.filter(q => q.bfly).length < 4) {
        const col = G.pick(['#fff4a0', '#ffffff', '#ffb0d0', '#a8d8ff']), bx = cx + G.rand() * G.W, by = cy + G.rand() * G.H;
        P.add({ x: bx, y: by, vx: 0, vy: 0, life: 900, size: 2, color: col, bfly: true, fadeIn: 40, type: 'bfly',
          upd: p => { p.vx = Math.sin(p.t / 40 + p.y * .1) * .45 - G.wind(this.frame) * .3; p.vy = Math.cos(p.t / 23) * .3 + Math.sin(p.t / 7) * .15; } });
      }
      // pollen / dust motes drifting in the sunlight
      if (day && (green || m.theme === 'beach') && G.rand() < .04) P.add({ x: cx + G.rand() * G.W, y: cy + G.rand() * G.H, vx: 0, vy: -.05, life: 260, size: 1, color: '#fff6c8', alpha: .7, fadeIn: 60, blend: 'lighter', upd: p => { p.vx = -G.wind(this.frame) * .5 + Math.sin(p.t / 30 + p.y) * .12; } });
    }
    // fireflies at night in green areas
    if (this.map.type === 'outdoor' && G.clock.isNight() && (this.map.theme === 'grass' || this.map.theme === 'dusk') && !w && G.rand() < .05) {
      P.add({ x: cx + G.rand() * G.W, y: cy + G.rand() * G.H, vx: 0, vy: 0, life: 160, size: 1, color: '#e8ff8a', glow: true, fadeIn: 40, upd: p => { p.vx = Math.sin(p.t / 17 + p.y) * .25; p.vy = Math.cos(p.t / 23 + p.x) * .2; } });
    }
    if (this.lightning > 0) this.lightning--;
    if (this.sparkle) this.sparkle.t++;
    this.updateRustles();
  }
  // ---------------------------------------------------------- drawing
  draw(b) {
    const m = this.map, cam = this.cam;
    const shx = this.shake ? (G.rand() - .5) * 4 : 0, shy = this.shake ? (G.rand() - .5) * 3 : 0;
    const ox = Math.round(cam.x + shx), oy = Math.round(cam.y + shy);
    const fW = Math.floor(this.frame / 14), fT = Math.floor(this.frame / 22), fF = Math.floor(this.frame / 40), fL = Math.floor(this.frame / 12);
    const x0 = Math.floor(ox / 16) - 2, y0 = Math.floor(oy / 16) - 1, x1 = x0 + Math.ceil(G.W / 16) + 4, y1 = y0 + Math.ceil(G.H / 16) + 4;
    b.imageSmoothingEnabled = false;
    b.fillStyle = m.type === 'indoor' ? '#06060c' : '#000'; b.fillRect(0, 0, G.W, G.H);
    // baked terrain (+ animated water glints and shore foam)
    const chunks = G.terrain.drawGround(b, m, ox, oy, this.frame);
    G.terrain.prefetch(m, ox, oy, 1);
    const sprites = [];
    // live ground (tall grass, flowers, lava, switches) and props
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
      const r = m.resolve(tx, ty);
      let c, mm;
      if (r) { mm = r.map; c = mm.cells[r.y * mm.w + r.x]; } else { mm = m; c = G.borderCell(m, tx, ty); }
      const dx = tx * 16 - ox, dy = ty * 16 - oy;
      if (c.g === 'tall' || c.g === 'flowers' || c.g === 'lava' || c.g === 'switch') {
        const fr = c.g === 'tall' ? fT : c.g === 'lava' ? fL : fF;
        const lt = G.liveTile(mm, c, fr);
        if (lt && lt.img) b.drawImage(lt.img, dx, dy + lt.oy);
      }
      if (c.g === 'hedge') { const hs = G.tiles.hedgeSprite(mm, c); sprites.push({ y: ty * 16 + 15, d: () => b.drawImage(hs.img, dx, dy + hs.oy) }); }
      if (c.o) {
        let skip = false;
        if ((c.cut || c.smash) && r && this.isCleared(mm.id, r.x, r.y)) skip = true;
        if (c.push && mm === m && m.boulders && m.boulders[tx + ',' + ty] === 'gone') skip = true;
        if (c.solidIf && !G.checkCond(c.solidIf)) skip = true;
        if (!skip) {
          const oi = G.objImg(mm, c, fW);
          if (!oi || !oi.img) { /* part of a bigger prop drawn from another cell */ }
          else if (oi.flat) b.drawImage(oi.img, dx, dy);
          else {
            // props that can disappear (cut, smashed, pushed) are not baked: give them a live contact shadow
            const live = c.cut || c.smash || c.push || c.solidIf;
            sprites.push({ y: ty * 16 + 15, d: () => { if (live) this.contactShadow(b, dx + 8, dy + 14, 6); G.leanDraw(b, oi.img, dx + (oi.ox || 0), dy + (oi.oy || 0), dy + 16, { sway: ['tree', 'pine', 'palm', 'smalltree'].includes(c.o) ? (c.o === 'palm' ? 1.4 : 1) : 0 }); } });
          }
        }
      }
    }
    // cast shadows, strongest in daylight
    G.terrain.drawShadows(b, chunks, ox, oy, this.shadowStrength());
    // moved boulders
    if (m.boulders) for (const k in m.boulders) if (m.boulders[k] === 'moved' || m.boulders[k] === 'filled') {
      const [bx, by] = k.split(',').map(Number);
      if (m.boulders[k] === 'filled') { b.drawImage(G.tiles.get('filledhole', 16, 16, p => { const K = G.ramp(['#3a2c22', '#5a4636', '#7a624c']); p.ell(8, 8.5, 6.5, 5.5, K[1]); p.ell(8, 8, 5, 4, K[2]); p.outline(K[0]); }), bx * 16 - ox, by * 16 - oy); continue; }
      const oi = G.objImg(m, { o: 'boulder', v: 0 }, 0); sprites.push({ y: by * 16 + 15, d: () => { this.contactShadow(b, bx * 16 - ox + 8, by * 16 - oy + 14, 7); b.drawImage(oi.img, bx * 16 - ox + oi.ox, by * 16 - oy + oi.oy); } });
    }
    if (this.movingBoulder) { const mb = this.movingBoulder; const oi = G.objImg(m, { o: 'boulder', v: 0 }, 0); sprites.push({ y: mb.y + 15, d: () => b.drawImage(oi.img, Math.round(mb.x - ox) + oi.ox, Math.round(mb.y - oy) + oi.oy) }); }
    // footprints
    for (const f of this.footprints) {
      b.globalAlpha = .35 * (1 - f.t / 240); b.fillStyle = m.theme === 'snow' ? '#8aa0bc' : '#8a6a40';
      const fx = f.x * 16 - ox, fy = f.y * 16 - oy;
      if (f.dir === 'up' || f.dir === 'down') { b.fillRect(fx + 5, fy + 5, 2, 3); b.fillRect(fx + 9, fy + 9, 2, 3); } else { b.fillRect(fx + 4, fy + 6, 3, 2); b.fillRect(fx + 9, fy + 10, 3, 2); }
      b.globalAlpha = 1;
    }
    // buildings (current + neighbours)
    const drawBld = (mm, bo, offx, offy) => {
      const bi = G.tiles.building(bo.kind, bo.w, bo.h, { roof: bo.roof, door: bo.door, accent: bo.accent, label: bo.label });
      const dx = (bo.x + offx) * 16 - ox + (bi.atlas ? G.bldAlign(bo) : 0), dy = (bo.y + offy) * 16 - oy - bi.oy;
      if (dx > G.W + 32 || dy > G.H + 32 || dx + bi.img.width < -32 || dy + bi.img.height < -32) return;
      const base = (bo.y + offy + bo.h) * 16 - oy;
      sprites.push({ y: (bo.y + offy + bo.h) * 16 - 1, d: () => G.leanDraw(b, bi.img, dx, dy, base, { side: !bi.atlas }) });
    };
    for (const bo of m.buildings) drawBld(m, bo, 0, 0);
    for (const cn of m.conns) { const nm = cn.map; if (nm) for (const bo of nm.buildings) drawBld(nm, bo, cn.ox, cn.oy); }
    // entities
    const ents = this.ents.filter(e => e.visible && !e.hidden);
    for (const e of ents) sprites.push({ y: e.py + 15 + (e.kind === 'item' ? -1 : 0), d: () => this.drawEnt(b, e, ox, oy) });
    if (this.follower && !this.follower.hidden) { const f = this.follower; sprites.push({ y: f.py + 14, d: () => this.drawFollower(b, f, ox, oy) }); }
    if (this.partner && this.partner.map === m.id && this.partner.visible) { const e = this.partner; sprites.push({ y: e.py + 15, d: () => { this.drawEnt(b, e, ox, oy); if (e.followerMon) this.drawFollower(b, e.fol, ox, oy); } }); }
    if (this.doorFx) sprites.push({ y: (this.doorFx.y + 1) * 16 - .75, d: () => this.drawDoorFx(b, ox, oy) });
    sprites.push({ y: this.player.py + 15.5, d: () => this.drawEnt(b, this.player, ox, oy) });
    sprites.sort((a, c) => a.y - c.y);
    for (const s of sprites) s.d();
    this.drawRustles(b, ox, oy);
    // sparkle
    if (this.sparkle && this.sparkle.map === m.id) {
      const s = this.sparkle, k = (s.t % 40) / 40;
      b.fillStyle = '#ffffff'; const sx = s.x * 16 - ox + 8, sy = s.y * 16 - oy + 6;
      b.globalAlpha = .6 + .4 * Math.sin(s.t / 5);
      b.fillRect(sx - 3 - k * 2, sy, 2, 1); b.fillRect(sx + 2 + k * 2, sy, 2, 1); b.fillRect(sx, sy - 3 - k * 2, 1, 2); b.fillRect(sx, sy + 2 + k * 2, 1, 2); b.fillRect(sx - 1, sy - 1, 3, 3);
      b.globalAlpha = 1;
    }
    this.fx.draw(b, -ox, -oy);
    // emotes
    for (const e of [...ents, this.player, this.follower, this.partner].filter(Boolean)) if (e.emote) {
      const k = Math.min(1, e.emoteT / 6);
      b.drawImage(G.EMOTES(e.emote), Math.round(e.px - ox + 1.5), Math.round(e.py - oy - 26 - k * 4 - (e.hop || 0)));
    }
    // weather particles (world space)
    this.parts.draw(b, -ox, -oy);
    this.drawRays(b, ox, oy);
    if (m.type === 'indoor' && m.decor && G.settings.fancy !== false) this.drawInterior(b, ox, oy);
    this.drawLighting(b, ox, oy);
    this.ox = ox; this.oy = oy;
  }
  // rooms: soft occlusion where floor meets wall, daylight (or moonlight) falling in through each
  // window as a slanted shaft with dust motes, and warm pools under every lamp and sconce
  drawInterior(b, ox, oy) {
    const m = this.map, D = m.decor, t = this.frame, h = G.clock.hourF();
    const day = h >= 7 && h <= 17 ? 1 : h > 17 && h < 19.5 ? 1 - (h - 17) / 2.5 : h > 5 && h < 7 ? (h - 5) / 2 : 0;
    b.save();
    for (let x = 0; x < m.w; x++) {
      const yb = D.wb[x]; if (yb === undefined) continue;
      const X = x * 16 - ox, Y = (yb + 1) * 16 - oy;
      const g = b.createLinearGradient(0, Y, 0, Y + 12); g.addColorStop(0, 'rgba(30,14,30,.32)'); g.addColorStop(1, 'rgba(30,14,30,0)');
      b.fillStyle = g; b.fillRect(X, Y, 16, 12);
    }
    const top = Math.min(...D.wb.filter(v => v !== undefined)) + 1, L0 = -ox, R0 = m.w * 16 - ox, T0 = top * 16 - oy, B0 = m.h * 16 - oy;
    for (const [x0, dir] of [[L0, 1], [R0, -1]]) { const g = b.createLinearGradient(x0, 0, x0 + dir * 12, 0); g.addColorStop(0, 'rgba(30,14,30,.28)'); g.addColorStop(1, 'rgba(30,14,30,0)'); b.fillStyle = g; b.fillRect(Math.min(x0, x0 + dir * 12), T0, 12, B0 - T0); }
    b.beginPath(); b.rect(-ox, -oy, m.w * 16, m.h * 16); b.clip();
    b.globalCompositeOperation = 'lighter';
    const col = day > .3 ? (h > 16 ? '255,200,140' : '255,240,200') : '140,170,255', a = day > .3 ? .24 * day : .08;
    for (const w of D.windows) {
      const yb = D.wb[w.x]; if (yb === undefined) continue;
      const wx = w.x * 16 - ox + 8, wy = (yb + 1) * 16 - oy, len = 46;
      const g = b.createLinearGradient(0, wy - 12, 0, wy + len); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`);
      b.fillStyle = g; b.beginPath(); b.moveTo(wx - 6, wy - 12); b.lineTo(wx + 6, wy - 12); b.lineTo(wx + 24, wy + len); b.lineTo(wx + 2, wy + len); b.closePath(); b.fill();
      // the bright patch where it lands
      b.fillStyle = `rgba(${col},${(a * .8).toFixed(3)})`; b.beginPath(); b.moveTo(wx + 2, wy + 10); b.lineTo(wx + 14, wy + 10); b.lineTo(wx + 20, wy + 26); b.lineTo(wx + 8, wy + 26); b.closePath(); b.fill();
      if (day > .3 && t % 20 === (w.x * 7) % 20) this.parts.add({ x: w.x * 16 + 8 + G.rand() * 18, y: (yb + 1) * 16 + G.rand() * 34, life: 220, size: 1, color: '#fff6d8', blend: 'lighter', alpha: .75, fadeIn: 50, upd: p => { p.vx = Math.sin(p.t / 40 + p.y) * .07; p.vy = -.02; } });
    }
    for (const l of D.lamps) {
      const lx = l.x * 16 - ox + 8, ly = l.kind === 'sconce' ? l.y * 16 - oy + 6 : l.y * 16 - oy - (l.kind === 'floorlamp' ? 10 : 4);
      const k = (.14 + .22 * (1 - day)) * (.94 + .06 * Math.sin(t / 9 + l.x));
      const g = b.createRadialGradient(lx, ly, 1, lx, ly, 34); g.addColorStop(0, `rgba(255,214,150,${k.toFixed(3)})`); g.addColorStop(1, 'rgba(255,190,120,0)');
      b.fillStyle = g; b.fillRect(lx - 34, ly - 34, 68, 68);
    }
    b.restore();
    // the room's shell: thick side walls and a front lip, so it reads as a box rather than a floating floor
    const X0 = -ox, X1 = m.w * 16 - ox, Y1 = m.h * 16 - oy, Yt = -oy;
    b.fillStyle = '#2a1c24'; b.fillRect(X0 - 4, Yt, 4, Y1 - Yt + 5); b.fillRect(X1, Yt, 4, Y1 - Yt + 5); b.fillRect(X0 - 4, Y1, X1 - X0 + 8, 5);
    b.fillStyle = '#4a3440'; b.fillRect(X0 - 4, Yt, 1, Y1 - Yt + 5); b.fillRect(X1 + 3, Yt, 1, Y1 - Yt + 5); b.fillRect(X0 - 4, Y1, X1 - X0 + 8, 1);
    b.fillStyle = '#6a5060'; b.fillRect(X0 - 4, Yt, X1 - X0 + 8, 1);
  }
  // 3D mode: the scene itself is WebGL; this draws the 2D effects over it, projected into the view
  draw3d(b) {
    const W3 = G.W3, ground = (x, y) => W3.project(x, y, 0), flat = (x, y) => W3.projectFlat(x, y);
    b.imageSmoothingEnabled = false;
    // rustling grass: the tuft shakes where it stands, throwing blades and leaves
    for (const r of this.rustles || []) {
      if (r.map !== this.map.id) continue;
      if (Math.sin(this.frame / 16 + r.x * 1.7) < .1) continue;
      // the tuft itself shakes in the 3D grass (world3d feeds these to the grass shader), so trees in front hide it
      if (this.frame % 20 === 0) { this.fx.add({ x: r.x * 16 + 8 + (G.rand() - .5) * 8, y: r.y * 16 + 4, vx: (G.rand() - .5), vy: -1.1, ay: .07, life: 22, type: 'leaf', size: 1.5, rot: G.rand() * 6, vr: .2, color: '#6ab84a' }); if (Math.abs(r.x - this.player.x) + Math.abs(r.y - this.player.y) < 7) G.audio && G.audio.sfx('rustle'); }
    }
    // ripples around swimmers
    for (const e of this.ents) {
      if (!e.visible || e.hidden || !e.look) continue;
      const c = this.map.cell(e.x, e.y); if (!c || !c.water || c.g === 'bridge' || c.g === 'bridgev') continue;
      const q = ground(e.px + 8, e.py + 12); if (!q) continue;
      b.strokeStyle = 'rgba(230,248,255,.55)'; b.lineWidth = 1; b.beginPath(); b.ellipse(q.x, q.y, 8 + Math.sin(this.frame / 10) * 1, 2.6, 0, 0, Math.PI * 2); b.stroke();
      if (this.frame % 26 === 0) this.fx.add({ x: e.px + 8, y: e.py + 12, life: 26, type: 'ring', size: 4, grow: 2.2, color: 'rgba(255,255,255,.5)', lw: .8 });
    }
    // hidden-item sparkle
    if (this.sparkle && this.sparkle.map === this.map.id) {
      const sp = this.sparkle, k = (sp.t % 40) / 40, q = ground(sp.x * 16 + 8, sp.y * 16 + 10);
      if (q) { b.fillStyle = '#ffffff'; b.globalAlpha = .6 + .4 * Math.sin(sp.t / 5); const sx = Math.round(q.x), sy = Math.round(q.y - 6);
        b.fillRect(sx - 3 - k * 2, sy, 2, 1); b.fillRect(sx + 2 + k * 2, sy, 2, 1); b.fillRect(sx, sy - 3 - k * 2, 1, 2); b.fillRect(sx, sy + 2 + k * 2, 1, 2); b.fillRect(sx - 1, sy - 1, 3, 3); b.globalAlpha = 1; }
    }
    // dust, leaves, motes and light shafts live in the 3D scene (depth-tested); only rain streaks stay here
    const all = this.parts.list, rain = all.filter(p => p.type === 'line');
    if (rain.length) { this.parts.list = rain; this.parts.draw(b, 0, 0, flat); this.parts.list = all; }
  }
  // how strongly cast shadows show: full in daylight, fading through dusk, faint at night
  shadowStrength() {
    const m = this.map;
    if (m.def.dark) return 0;
    if (m.type !== 'outdoor') return .22;
    const h = G.clock.hourF();
    const day = h >= 7 && h <= 17 ? 1 : h > 17 && h < 19.5 ? 1 - (h - 17) / 2.5 : h > 5 && h < 7 ? (h - 5) / 2 : 0;
    let a = .12 + .2 * day;
    if (this.weather === 'rain' || this.weather === 'storm' || this.weather === 'fog' || this.weather === 'mist') a *= .45;
    return a;
  }
  contactShadow(b, x, y, r) { b.fillStyle = 'rgba(12,16,36,.28)'; b.beginPath(); b.ellipse(x, y, r, r * .36, 0, 0, Math.PI * 2); b.fill(); }
  // project a character's silhouette onto the ground like the baked prop shadows
  castShadow(b, img, x, y, baseY) {
    const a = this.shadowStrength(); if (a <= .02) return;
    b.save(); b.globalAlpha = a * .9;
    G.terrain.castShadow(b, img, x, y, baseY);
    b.restore();
  }
  drawEnt(b, e, ox, oy) {
    const m = this.map;
    if (e.kind === 'item') {
      if (e.hidden) return;
      const img = G.orbArt('orb', 14);
      b.drawImage(img, e.px - ox, e.py - oy + Math.sin(this.frame / 20) * .5); return;
    }
    if (e.kind === 'sign') {
      if (e.deco) { // decorative prop drawn on a surface, e.g. the starter Orbs on the lab table
        const [kind, col] = e.deco.split(':');
        const img = kind === 'orbball' ? G.orbArt('orb', 12, col) : G.tiles.get(`deco|${e.deco}`, 16, 16, p => G.tiles.furniture(p, kind, 0));
        const glint = Math.floor(this.frame / 8 + e.x * 5) % 24 === 0;
        b.drawImage(img, e.px - ox, e.py - oy - 4);
        if (glint) { b.fillStyle = '#ffffff'; b.fillRect(e.px - ox + 5, e.py - oy - 1, 1, 1); }
        return;
      }
      if (e.invisible) return;
      const at = G.tiles.atlas && G.tiles.atlas('sign');
      if (at) { b.drawImage(at, Math.round(e.px - ox + 8 - at.width / 2), Math.round(e.py - oy + 17 - at.height)); return; }
      const img = G.tiles.prop('sign', 0).img; b.drawImage(img, e.px - ox, e.py - oy - 2); return;
    }
    if (e.monSprite) {
      const im = G.monArt.overworld(e.monSprite, !!e.shiny, e.dir, Math.floor(this.frame / 16) % 2);
      b.fillStyle = 'rgba(0,0,0,.25)'; b.beginPath(); b.ellipse(e.px - ox + 8, e.py - oy + 14.5, 5, 1.8, 0, 0, Math.PI * 2); b.fill();
      b.drawImage(im, Math.round(e.px - ox + 8 - im.width / 2), Math.round(e.py - oy + 16 - im.height - (e.hop || 0)));
      const gc = e.kind === 'wild' && this.cellAt(e.tx, e.ty);
      if (gc && gc.g === 'tall') { const fr = Math.floor(this.frame / 22) % 4, front = G.tiles.get(`tgf|${fr}|${this.map.theme}`, 16, 20, p => G.tiles.tallgrass(p, fr, this.map.theme, 0, true)); b.drawImage(front, Math.round(e.tx * 16 - ox), Math.round(e.ty * 16 - oy) - 4); }
      return;
    }
    if (!e.look) return;
    const sh = G.chars.sheet(e.look);
    const surf = e === this.player && this.surfing;
    if (!surf) {   // soft contact shadow, shrinking while hopping
      const hk = 1 - Math.min(.5, (e.hop || 0) / 16);
      b.fillStyle = 'rgba(20,20,40,.30)'; b.beginPath(); b.ellipse(Math.round(e.px - ox) + 8, Math.round(e.py - oy) + 14.5, 5.5 * hk, 2.2 * hk, 0, 0, Math.PI * 2); b.fill();
    }
    const set = sh[e.dir + (surf ? '_surf' : '')] || sh.down;
    const fr = surf ? 0 : e.animFrame();
    const img = set[Math.min(fr, set.length - 1)];
    // feet on the tile's bottom edge, centred on the tile; walking steps bob up a pixel
    const step = !surf && e.moving && fr > 0 ? 1 : 0;
    let x = Math.round(e.px - ox + 8 - img.width / 2), y = Math.round(e.py - oy + 16 - img.height - (e.hop || 0)) - step;
    if (surf) y = Math.round(e.py - oy + 16 - 22);
    const c = this.cellAt(e.x, e.y);
    // swimmers (anyone standing on open water): only the upper body shows, bobbing, with ripples
    if (!surf && e !== this.player && c && c.water && c.g !== 'bridge' && c.g !== 'bridgev') {
      const bob = Math.sin(this.frame / 14 + e.x) * 1;
      const cut = Math.round(img.height * .52);
      b.drawImage(img, 0, 0, img.width, cut, x, y + 7 + bob, img.width, cut);
      const wy = y + 7 + cut + bob;
      b.fillStyle = 'rgba(210,240,255,.55)'; b.fillRect(x + 2, wy - 1, img.width - 4, 1);
      b.strokeStyle = 'rgba(230,248,255,.5)'; b.lineWidth = 1; b.beginPath(); b.ellipse(x + img.width / 2, wy, 8 + Math.sin(this.frame / 10) * 1, 2.4, 0, 0, Math.PI * 2); b.stroke();
      if (this.frame % 26 === 0) this.fx.add({ x: e.px + 8, y: e.py + 12, life: 26, type: 'ring', size: 4, grow: 2.2, color: 'rgba(255,255,255,.5)', lw: .8 });
      return;
    }
    // reflection in water / ice directly below
    const below = this.cellAt(e.tx, e.ty + 1);
    if (below && (below.water || below.ice) && !surf) {
      b.save(); b.globalAlpha = .28; b.translate(x, y + img.height * 2 - 2); b.scale(1, -1); b.drawImage(img, 0, 0); b.restore();
    }
    if (surf) {
      // board + bob
      const bob = Math.sin(this.frame / 12) * 1;
      const bw = G.tiles.get('surfboard|' + e.dir, 16, 16, p => { const cb = G.col.parse('#f4f0e8'), cd = G.col.parse('#3a82e0'); if (e.dir === 'left' || e.dir === 'right') { p.ell(8, 10, 8, 3.2, cd); p.ell(8, 9.5, 7, 2.2, cb); } else { p.ell(8, 9, 4, 7, cd); p.ell(8, 8.5, 3, 6, cb); } p.outline(G.col.parse('#1e3a6a')); });
      b.drawImage(bw, Math.round(e.px - ox), Math.round(e.py - oy) + 4 + bob);
      b.drawImage(img, x, y + bob);
      return;
    }
    if (e === this.player && this.biking) {
      const bk = G.tiles.get('bike|' + e.dir, 16, 16, p => { const R = G.col.parse('#e84a4a'), K = G.col.parse('#2a2a30'); if (e.dir === 'left' || e.dir === 'right') { p.circ(3.5, 12, 3, K); p.circ(12.5, 12, 3, K); p.line(3, 12, 8, 8, R); p.line(8, 8, 12, 12, R); p.line(8, 8, 10, 5, R); } else { p.rect(7, 4, 2, 11, K); p.rect(4, 5, 8, 1, R); p.rect(7, 8, 2, 4, R); } });
      b.drawImage(bk, Math.round(e.px - ox), Math.round(e.py - oy) + 1);
    }
    if (!surf) this.castShadow(b, img, x, y, Math.round(e.py - oy) + 15 - (e.hop || 0) * 0);
    b.drawImage(img, x, y);
    // tall grass overlay
    if (c && c.g === 'tall' && !e.moving || (c && c.g === 'tall' && e.moving && e.prog > 8)) {
      const front = G.tiles.get(`tgf|${Math.floor(this.frame / 22) % 4}|${m.theme}`, 16, 20, p => G.tiles.tallgrass(p, Math.floor(this.frame / 22) % 4, m.theme, 0, true));
      b.drawImage(front, Math.round(e.tx * 16 - ox), Math.round(e.ty * 16 - oy) - 4);
    }
  }
  drawFollower(b, f, ox, oy) {
    const img = G.monArt ? G.monArt.of(f.mon, 'overworld', f.animF || 0, f.dir) : null;
    if (!img) return;
    const hop = f.moving ? Math.abs(Math.sin(f.prog / 16 * Math.PI)) * 2 : 0;
    const x = Math.round(f.px - ox + 8 - img.width / 2), y = Math.round(f.py - oy + 16 - img.height - hop - (f.hop || 0));
    b.fillStyle = 'rgba(12,16,36,.28)'; b.beginPath(); b.ellipse(f.px - ox + 8, f.py - oy + 14.5, Math.min(7, img.width / 3), 2, 0, 0, Math.PI * 2); b.fill();
    this.castShadow(b, img, x, y + hop, Math.round(f.py - oy) + 15);
    b.drawImage(img, x, y);
    const c = this.cellAt(f.tx, f.ty);
    if (c && c.g === 'tall') { const front = G.tiles.get(`tgf|${Math.floor(this.frame / 22) % 4}|${this.map.theme}`, 16, 20, p => G.tiles.tallgrass(p, Math.floor(this.frame / 22) % 4, this.map.theme, 0, true)); b.drawImage(front, Math.round(f.tx * 16 - ox), Math.round(f.ty * 16 - oy) - 4); }
  }
  ambient() {
    const m = this.map;
    if (m.def.dark) return { col: '#1a1a2a', a: G.bag.has('lantern') ? .55 : .8 };
    if (m.type === 'cave') return { col: '#4a4a66', a: .35 };
    if (m.type === 'indoor') return null;
    const h = G.clock.hourF();
    // keyframes: hour -> [color, strength]
    const K = [[0, '#26306a', .62], [4.5, '#26306a', .6], [6, '#ff9a7a', .28], [7.5, '#ffffff', 0], [16.5, '#ffffff', 0], [18, '#ff8a5a', .26], [19.5, '#5a3a8a', .42], [21, '#26306a', .6], [24, '#26306a', .62]];
    let i = 0; while (i < K.length - 1 && h >= K[i + 1][0]) i++;
    const a = K[i], bb = K[Math.min(K.length - 1, i + 1)]; const t = (h - a[0]) / Math.max(.001, bb[0] - a[0]);
    let col = G.col.mix(a[1], bb[1], t), str = G.lerp(a[2], bb[2], t);
    if (this.weather === 'rain' || this.weather === 'storm') { str = Math.max(str, .22); col = G.col.mix(col, '#4a5a7a', .5); }
    if (this.weather === 'fog' || this.weather === 'mist') { str = Math.max(str, .12); col = G.col.mix(col, '#8a9ab0', .5); }
    if (this.weather === 'ash') { str = Math.max(str, .18); col = G.col.mix(col, '#8a5a4a', .5); }
    return str > .01 ? { col, a: str } : null;
  }
  drawLighting(b, ox, oy) {
    const amb = this.ambient();
    this.curAmb = amb;
    if (amb) {
      b.globalCompositeOperation = 'multiply'; b.globalAlpha = 1;
      b.fillStyle = G.col.mix('#ffffff', amb.col, amb.a * 1.25 > 1 ? 1 : amb.a * 1.25); b.fillRect(0, 0, G.W, G.H);
      b.globalCompositeOperation = 'source-over';
    }
    if (this.weather === 'fog' || this.weather === 'mist') { b.fillStyle = 'rgba(220,228,240,.16)'; b.fillRect(0, 0, G.W, G.H); }
    if (this.lightning > 0) { b.fillStyle = `rgba(255,255,255,${this.lightning / 14})`; b.fillRect(0, 0, G.W, G.H); }
  }
  lightSources() {
    const L = [], m = this.map, ox = this.ox, oy = this.oy;
    const night = m.type === 'outdoor' ? (this.curAmb ? this.curAmb.a : 0) : m.type === 'cave' ? .7 : 0;
    if (night < .15 && !m.def.dark) return L;
    const x0 = Math.floor(ox / 16) - 2, y0 = Math.floor(oy / 16) - 2;
    for (let ty = y0; ty < y0 + 18; ty++) for (let tx = x0; tx < x0 + 28; tx++) {
      const c = this.cellAt(tx, ty); if (!c || !c.light) continue;
      const px = tx * 16 - ox + 8, py = ty * 16 - oy;
      if (c.light === 'lamp') L.push({ x: px, y: py - 15, r: 44, col: 'rgba(255,220,140,', a: .5 * night });
      if (c.light === 'lantern') L.push({ x: px, y: py + 4, r: 30, col: 'rgba(255,170,90,', a: .55 * night });
      if (c.light === 'crystal') L.push({ x: px, y: py + 8, r: 26, col: c.v % 2 ? 'rgba(140,230,255,' : 'rgba(200,160,255,', a: .45 });
      if (c.light === 'lava') L.push({ x: px, y: py + 8, r: 22, col: 'rgba(255,120,40,', a: .35 });
      if (c.light === 'screen') L.push({ x: px, y: py + 6, r: 16, col: 'rgba(120,220,255,', a: .3 });
    }
    // lit windows
    if (m.type === 'outdoor' && night > .25) {
      const addB = (bo, offx, offy) => { for (let i = 0; i < bo.w; i++) { if (i === (bo.door !== undefined ? bo.door : Math.floor(bo.w / 2))) continue; L.push({ x: (bo.x + offx + i) * 16 - ox + 8, y: (bo.y + offy + bo.h) * 16 - oy - 13, r: 20, col: 'rgba(255,210,130,', a: .5 * night }); } L.push({ x: (bo.x + offx + (bo.door !== undefined ? bo.door : Math.floor(bo.w / 2))) * 16 - ox + 8, y: (bo.y + offy + bo.h) * 16 - oy - 4, r: 16, col: 'rgba(255,200,120,', a: .35 * night }); };
      for (const bo of m.buildings) addB(bo, 0, 0);
      for (const cn of m.conns) if (cn.map) for (const bo of cn.map.buildings) addB(bo, cn.ox, cn.oy);
    }
    // player aura in dark places / at night
    const p = this.player;
    if (m.def.dark || m.type === 'cave' || night > .3) L.push({ x: p.px - ox + 8, y: p.py - oy + 4, r: m.def.dark ? (G.bag.has('lantern') ? 70 : 34) : 38, col: 'rgba(255,240,210,', a: m.def.dark ? .9 : .28 });
    if (this.follower && !this.follower.hidden) { const sp = G.SPECIES[this.follower.mon.sp]; if (sp.types.includes('fire') || sp.types.includes('electric') || this.follower.mon.sp === 'glimmer' || this.follower.mon.sp === 'luminelle' || this.follower.mon.sp === 'jellume') L.push({ x: this.follower.px - ox + 8, y: this.follower.py - oy + 6, r: 30, col: sp.types.includes('fire') ? 'rgba(255,150,60,' : 'rgba(180,220,255,', a: .45 }); }
    for (const pt of this.parts.list) if (pt.glow) L.push({ x: pt.x - ox, y: pt.y - oy, r: 6, col: 'rgba(230,255,140,', a: .6 * Math.min(1, pt.t / 40) * (1 - pt.t / pt.life) });
    return L;
  }
  // camera/lighting look for the 2.5D presenter, by place and time of day
  lookFX() {
    const m = this.map, d = m.def;
    if (d.dark) return { hazeA: 0, bloomA: .3, key: 'rgba(255,200,140,.35)', fill: 'rgba(10,10,30,.6)' };
    if (m.type === 'indoor' || m.type === 'cave') return { hazeA: 0, bloomA: .16, key: 'rgba(255,232,190,.45)', fill: 'rgba(40,40,90,.4)' };
    const ph = G.clock.phase();
    if (ph === 'night') return { haze: 'rgba(40,60,130,', hazeA: .38, bloomA: .32, key: 'rgba(140,160,255,.35)', fill: 'rgba(10,15,50,.65)' };
    if (ph === 'dusk') return { haze: 'rgba(255,170,130,', hazeA: .34, bloomA: .26, key: 'rgba(255,160,90,.6)', fill: 'rgba(70,40,110,.5)' };
    if (ph === 'dawn') return { haze: 'rgba(255,210,190,', hazeA: .3, bloomA: .24, key: 'rgba(255,200,160,.55)', fill: 'rgba(60,70,130,.45)' };
    if (d.weather === 'snow' || m.theme === 'snow') return { haze: 'rgba(235,245,255,', hazeA: .26, bloomA: .2 };
    return { haze: 'rgba(214,232,255,', hazeA: .12, bloomA: .2, key: 'rgba(255,208,140,.72)', fill: 'rgba(24,40,110,.5)' };
  }
  drawUI(c) {
    const S = G.gfx.S, U = G.ui;
    if (G.in3d) return this.drawUI3d(c);
    G.wilds.drawPops((x, y) => ({ x: G.gfx.projX(x - this.ox, y - this.oy) / S, y: G.gfx.projY(y - this.oy) / S }));
    if (G.flag('race_active')) {
      const v = Math.max(0, G.save.vars.raceLeft || 0), sec = (v / 60).toFixed(1), low = v < 60 * 5;
      U.panel(G.W / 2 - 34, 4, 68, 16, low ? 'red' : 'dark', { r: 4 });
      U.text('RACE  ' + sec + 's', G.W / 2, 7.5, { size: 7.4, weight: 800, align: 'center', color: '#fff', alpha: low && Math.floor(G.realTime * 6) % 2 ? .6 : 1 });
    }
    const L = this.lightSources();
    if (L.length) {
      c.save(); c.globalCompositeOperation = 'lighter';
      for (const l of L) {
        const x = G.gfx.projX(l.x, l.y), y = G.gfx.projY(l.y), r = l.r * S;
        const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, l.col + l.a + ')'); g.addColorStop(.5, l.col + (l.a * .35) + ')'); g.addColorStop(1, l.col + '0)');
        c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
      }
      c.restore();
    }
    // dark cave vignette beyond the light radius
    if (this.map.def.dark) {
      const p = this.player; const x = G.gfx.projX(p.px - this.ox + 8, p.py - this.oy + 4), y = G.gfx.projY(p.py - this.oy + 4), r = (G.bag.has('lantern') ? 110 : 52) * S;
      const g = c.createRadialGradient(x, y, r * .3, x, y, r); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(4,4,10,.94)');
      c.fillStyle = g; c.fillRect(G.gfx.ox, G.gfx.oy, G.W * S, G.H * S);
    }
    // subtle vignette for polish
    const vg = c.createRadialGradient(U.X(G.W / 2), U.Y(G.H / 2), G.H * S * .45, U.X(G.W / 2), U.Y(G.H / 2), G.W * S * .62);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.22)');
    c.fillStyle = vg; c.fillRect(G.gfx.ox, G.gfx.oy, G.W * S, G.H * S);
    if (this.saveIcon > 0) {
      const a = Math.min(1, this.saveIcon / 20), sp = G.realTime * 6;
      U.text('●', G.W - 10, G.H - 14, { size: 6, align: 'center', color: '#7cf29a', alpha: a * (.55 + .45 * Math.sin(sp)), outline: 'rgba(0,0,0,.5)' });
      U.text('Saved', G.W - 16, G.H - 13, { size: 5.2, align: 'right', color: '#fff', alpha: a * .75, weight: 700, outline: 'rgba(0,0,0,.5)' });
    }
    if (G.photoMode && G.input.pressed('a')) { G.input.consume('a'); try { const a = document.createElement('a'); a.href = G.gfx.canvas.toDataURL('image/png'); a.download = 'solmere_photo.png'; a.click(); G.toast('Screenshot saved!'); } catch (e) { } }
  }
};
G.world = { scene: null };

// ---------------------------------------------------------------- 2.5D lean --
// DS-style 3D feel for tall objects: a camera above the screen centre sees the tops of buildings,
// trees and lamps pushed away from the centre in proportion to their height, and the side wall that
// faces the centre. Shearing each object about its base line reproduces that for the cost of one
// transform; it shifts continuously as the camera scrolls, which is what reads as depth.
G.LEAN = .0009;
// wind: a slow base breeze with gusts every few seconds (0..1)
G.wind = function (f) { const g = Math.max(0, Math.sin(f / 260) * Math.sin(f / 97 + 1.3)); return .25 + .75 * g * g; };
G._sideCol = new WeakMap();
G.leanDraw = function (b, img, x, y, baseY, o = {}) {
  if (G.settings && G.settings.fancy === false) { b.drawImage(img, x, y); return; }
  let k = (x + img.width / 2 - G.W / 2) * G.LEAN;
  // trees and bushes sway with the wind (each at its own phase), anchored at the base
  if (o.sway) { const ws = G.world && G.world.scene ? G.world.scene.frame : 0; k -= (Math.sin(ws / 38 + x * .13) * .5 + .5) * G.wind(ws) * .045 * o.sway; }
  if (Math.abs(k) < .002) { b.drawImage(img, x, y); return; }
  if (o.side) {
    // side wall wedge between the upright corner line and the leaning one, in the facade's wall tone
    let col = G._sideCol.get(img);
    if (!col) {
      try {
        const c = img.getContext ? img.getContext('2d') : null, h = img.height;
        const d = c ? c.getImageData(2, Math.max(0, h - 14), 1, 8).data : null;
        let r = 0, g = 0, bb = 0, n = 0;
        if (d) for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 200) { r += d[i]; g += d[i + 1]; bb += d[i + 2]; n++; }
        col = n ? `rgb(${r / n * .55 | 0},${g / n * .55 | 0},${bb / n * .62 | 0})` : 'rgb(60,56,70)';
      } catch (e) { col = 'rgb(60,56,70)'; }
      G._sideCol.set(img, col);
    }
    const H = Math.min(baseY - y, 40), ex = k > 0 ? x : x + img.width;
    b.fillStyle = col; b.beginPath();
    b.moveTo(ex, baseY); b.lineTo(ex, baseY - H); b.lineTo(ex + k * H, baseY - H); b.lineTo(ex + k * 2, baseY); b.closePath(); b.fill();
  }
  b.save();
  b.transform(1, 0, -k, 1, k * baseY, 0);
  b.drawImage(img, x, y);
  b.restore();
};
