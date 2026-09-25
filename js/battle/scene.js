'use strict';
// ============================================================================
//  Battle scene: backgrounds, sprites, HUD, event playback, command menus.
//  Acts as both a display (play(events)) and the local player's controller.
// ============================================================================
G.BattleScene = class {
  constructor(o) {
    this.o = o; this.opaque = true; this.persp = o.persp || 0; this.env = o.env || 'grass';
    this.slots = {}; this.parts = new G.Particles(); this.fxp = new G.Particles(); this.box = new G.TextBox({ x: 10, y: G.H - 31, w: G.W - 20, h: 26, style: 'hd', size: 7, lh: 9.4, lines: 2 });
    this.box.pages = []; this.t = 0; this.menu = null; this.shake = 0; this.flash = 0; this.flashCol = '#fff';
    this.weather = null; this.popups = []; this.overlays = []; this.intro = 1; this.trainers = []; this.cmdIndex = 0; this.moveIndex = 0;
    this.hudShow = { 0: 0, 1: 0 }; this.balls = null; this.resonateOn = false; this.screens = { 0: {}, 1: {} }; this.hazards = { 0: {}, 1: {} };
    this.speed = () => (G.settings.battleSpeed || 1) * (G.input.isDown('b') || G.input.isDown('a') && this.fastAdvance ? 2 : 1);
    this.dim = 0; this.bgT = 0; this.ended = false;
  }
  fx25() { if (this._hd) return null; return { tilt: 0, hazeA: .1, bloomA: .2, key: 'rgba(255,225,180,.45)', fill: 'rgba(50,60,120,.4)' }; }
  // -------------------------------------------------------------- layout
  pos(s, i, n) {
    const mine = s === this.persp;
    // the foe stands well into the meadow (a third of the way down from the horizon), not on the horizon
    // line, so the ground between the two sides reads as depth
    if (n === 1) return mine ? { x: 112, y: 180, sc: .84, back: true } : { x: 268, y: 150, sc: .92, back: false };
    if (mine) return i === 0 ? { x: 88, y: 180, sc: .72, back: true } : { x: 166, y: 186, sc: .72, back: true };
    return i === 0 ? { x: 236, y: 154, sc: .84, back: false } : { x: 306, y: 147, sc: .8, back: false };
  }
  key(r) { return r.s + ':' + r.i; }
  slot(r) { return this.slots[this.key(r)]; }
  nSlots() { return this.bt ? this.bt.nSlots : (this.o.format === 'double' ? 2 : 1); }
  // -------------------------------------------------------------- text
  fmt(e) {
    let s = e.f;
    (e.r || []).forEach((r, k) => {
      const token = '{' + k + '}';
      let idx;
      while ((idx = s.indexOf(token)) >= 0) {
        const start = idx === 0 || /[.!?]\s$/.test(s.slice(0, idx));
        let name = r.name;
        if (r.s !== this.persp) name = (r.wild ? 'the wild ' : 'the opposing ') + name;
        if (start) name = G.cap(name);
        s = s.slice(0, idx) + name + s.slice(idx + token.length);
      }
    });
    return s;
  }
  async message(text, o = {}) {
    this.box.set(text); this.box.state = 'typing';
    this.showBox = true;
    const auto = o.wait !== undefined ? o.wait : 36;
    while (this.box.state === 'typing') { this.box.update(true, false); await G.nextFrame(); }
    if (o.noWait) return;
    let t = 0;
    while (true) {
      await G.nextFrame(); t += this.speed();
      if (o.press) { if (G.input.pressed('a') || G.input.pressed('b')) { G.input.consume('a'); G.input.consume('b'); break; } }
      else if (t >= auto || G.input.pressed('a') || G.input.pressed('b') || G.turbo) { G.input.consume('a'); G.input.consume('b'); break; }
    }
  }
  async wait(f) { let t = 0; while (t < f) { await G.nextFrame(); t += this.speed(); } }
  // ------------------------------------------------------- display API
  async play(events, bt) {
    this.bt = bt || this.bt;
    for (const e of events) {
      try { await this.playOne(e); } catch (err) { G.reportError(err); }
    }
  }
  async playOne(e) {
    const anims = G.settings.battleAnims !== false;
    switch (e.t) {
      case 'intro': return this.playIntro(e);
      case 'msg': return this.message(this.fmt(e));
      case 'send': return this.playSend(e);
      case 'withdraw': return this.playWithdraw(e);
      case 'move': {
        // the commanding trainer strikes their action pose as the move goes off
        const r = e.user || e.ref || e.src; if (r) for (const t of this.trainers) if (t.side === r.s && !t.back) t.act = 40;
        if (r) this.camFocus(this.slot(r), 1.07, 34);
        if (anims) await G.battleAnim(this, e); else await this.wait(6); return;
      }
      case 'hit': return this.playHit(e);
      case 'hp': return this.playHP(e);
      case 'faint': return this.playFaint(e);
      case 'status': { const s = this.slot(e.ref); if (s) s.status = e.status; if (e.status) { G.audio && G.audio.sfx('status_' + e.status); if (anims && s) await G.statusAnim(this, e.ref, e.status); } return; }
      case 'statusAnim': if (anims) await G.statusAnim(this, e.ref, e.status); return;
      case 'stat': return this.playStat(e);
      case 'weather': this.weather = e.w; if (!e.tick && e.w) { G.audio && G.audio.sfx('weather'); await this.wait(20); } return;
      case 'popup': return this.playPopup(e);
      case 'item': { const s = this.slot(e.ref); if (s) { G.audio && G.audio.sfx('item'); for (let i = 0; i < 12; i++) this.fxp.add({ x: s.x, y: s.y - 30, vx: Math.cos(i / 12 * 6.28) * 1.5, vy: Math.sin(i / 12 * 6.28) * 1.5, life: 20, size: 1.5, color: '#fff8b0', type: 'star' }); await this.wait(16); } return; }
      case 'exp': return this.playExp(e);
      case 'levelup': return this.playLevelUp(e);
      case 'throw': return G.throwAnim(this, e);
      case 'caught': { const s = this.slot(e.ref); if (s) s.visible = false; if (G.audio) { G.audio.stopMusic(); G.audio.jingle('caught'); } await this.wait(160); return; }
      case 'resonate': return this.playResonate(e);
      case 'screen': if (e.kind === 'none') this.screens[e.side] = {}; else this.screens[e.side][e.kind] = !e.off; if (!e.off && e.kind !== 'none') await this.wait(14); return;
      case 'hazard': if (e.kind === 'clear') this.hazards[e.side] = {}; else this.hazards[e.side][e.kind] = e.n; await this.wait(10); return;
      case 'protectAnim': { const s = this.slot(e.ref); if (s) { G.audio && G.audio.sfx('protect'); s.shield = 30; await this.wait(24); } return; }
      case 'subMake': { const s = this.slot(e.ref); if (s) { s.sub = true; G.audio && G.audio.sfx('pop'); await this.wait(16); } return; }
      case 'subBreak': { const s = this.slot(e.ref); if (s) { s.sub = false; G.audio && G.audio.sfx('pop'); await this.wait(12); } return; }
      case 'shieldBreak': { const s = this.slot(e.ref); if (s) { G.audio && G.audio.sfx('shatter'); for (let i = 0; i < 18; i++) this.fxp.add({ x: s.x, y: s.y - 34, vx: (G.rand() - .5) * 5, vy: (G.rand() - .7) * 4, ay: .15, life: 36, size: 2 + G.rand() * 2, color: G.pick(['#bff8ff', '#ffffff', '#8ad8ff']), type: 'star' }); await this.wait(20); } return; }
      case 'charge': { const s = this.slot(e.ref); if (s) { G.audio && G.audio.sfx('charge'); for (let i = 0; i < 16; i++) this.fxp.add({ x: s.x + Math.cos(i) * 40, y: s.y - 30 + Math.sin(i) * 30, vx: -Math.cos(i) * 1.8, vy: -Math.sin(i) * 1.4, life: 22, size: 2, color: '#fff8a0', blend: 'lighter' }); await this.wait(22); } return; }
      case 'field': this.flash = 10; this.flashCol = '#c8a0ff'; G.audio && G.audio.sfx('warp'); await this.wait(20); return;
      case 'state': this.applyState(e.snap); return;
      case 'sfx': G.audio && G.audio.sfx(e.id); return;
      case 'partyUpdate': return;
      case 'end': this.ended = true; return;
    }
  }
  applyState(snap) {
    if (!snap) return;
    this.weather = snap.weather;
    for (const s of snap.slots) { const d = this.slots[s.s + ':' + s.i]; if (d && d.uid === s.uid) { d.hp = s.hp; d.dispHp = s.hp; d.maxhp = s.max; d.status = s.status; if (s.fainted) d.visible = false; } }
  }
  // ------------------------------------------------------- intro
  async playIntro(e) {
    this.introInfo = e;
    const foeTr = e.sides[1 - this.persp].trainers.filter(t => t.name);
    const myTr = e.sides[this.persp].trainers;
    this.trainers = [];
    foeTr.forEach((t, k) => this.trainers.push({ side: 1 - this.persp, look: t.sprite, x: foeTr.length > 1 ? 262 + k * 52 : 292, y: 149, alpha: 1, off: 0, name: t.name, cls: t.cls }));
    myTr.forEach((t, k) => this.trainers.push({ side: this.persp, look: t.sprite, x: myTr.length > 1 ? 44 + k * 60 : 64, y: 206, alpha: 1, off: 0, back: true, name: t.name }));
    this.balls = e.wild ? null : e.sides.map(s => s.trainers.reduce((a, t) => ({ count: a.count + t.count, alive: a.alive + t.alive }), { count: 0, alive: 0 }));
    // slide in
    this.intro = 1;
    await G.tween(this, { intro: 0 }, 38, G.ease.outCubic);
    if (!e.wild) {
      const names = foeTr.map(t => (t.cls ? t.cls + ' ' : '') + t.name);
      await this.message(names.length > 1 ? `${names.join(' and ')} would like to battle!` : `${names[0]} would like to battle!`, { wait: 50 });
    }
  }
  async playSend(e) {
    const P = this.pos(e.ref.s, e.ref.i, this.nSlots());
    const s = { ...e.mon, ...P, dispHp: e.mon.hp, visible: true, scale: 0, alpha: 1, offx: 0, offy: 0, flash: 0, shake: 0, frame: G.randInt(0, 3), side: e.ref.s, slot: e.ref.i, anim: 0, uid: e.mon.uid, status: e.mon.status };
    this.slots[this.key(e.ref)] = s;
    const mine = e.ref.s === this.persp;
    if (!mine && G.dexMark) G.dexMark(e.mon.sp, 'seen');   // every mon you face registers as seen, trainers' included
    // trainers step off
    // the player's back sprite leaves the frame; the opponent steps back behind their mon and stays in view
    for (const t of this.trainers) if (t.side === e.ref.s && t.alpha > 0) {
      if (mine) G.tween(t, { off: -120, alpha: 0 }, 22, G.ease.inQuad);
      else if (!t.backed) { t.backed = true; t.act = 24; const two = this.trainers.filter(q => !q.back).length > 1; G.tween(t, { off: two ? 34 : 42, y: t.y - 6 }, 30, G.ease.outCubic); }
    }
    this.hudShow[e.ref.s] = 1;
    if (e.wild && e.initial) {
      s.scale = 1; s.flash = 1;
      G.audio && G.audio.cry(e.mon.sp);
      await G.tween(s, { flash: 0 }, 24, G.ease.linear);
      if (e.mon.shiny) await G.shinyAnim(this, s);
      await this.message(`A wild ${e.mon.name} appeared!`, { wait: 40 });
      return;
    }
    const tr = e.trainer;
    let txt;
    if (mine) txt = tr && !tr.isPlayer && this.o.partnerName !== tr.name ? `${tr.name} sent out ${e.mon.name}!` : G.pick(['Go! ' + e.mon.name + '!', 'You\'re up, ' + e.mon.name + '!', 'Let\'s do this, ' + e.mon.name + '!']);
    else if (e.wild) txt = `A wild ${e.mon.name} appeared!`;
    else txt = `${tr ? (tr.cls ? tr.cls + ' ' : '') + tr.name : 'The foe'} sent out ${e.mon.name}!`;
    this.message(txt, { noWait: true });
    // orb arc
    const orb = { x: mine ? P.x - 60 : P.x + 70, y: P.y - (mine ? 20 : 60), t: 0 };
    const tx = P.x, ty = P.y - 26;
    const sx = orb.x, sy = orb.y;
    this.thrown = { x: sx, y: sy, rot: 0, ball: e.mon.ball || 'orb' };
    G.audio && G.audio.sfx('throw');
    for (let f = 0; f <= 22; f++) { const k = f / 22; this.thrown.x = G.lerp(sx, tx, k); this.thrown.y = G.lerp(sy, ty, k) - Math.sin(k * Math.PI) * 30; this.thrown.rot += .5; await G.nextFrame(); }
    this.thrown = null;
    G.audio && G.audio.sfx('pop');
    for (let i = 0; i < 16; i++) this.fxp.add({ x: tx, y: ty, vx: Math.cos(i / 16 * 6.28) * 2.2, vy: Math.sin(i / 16 * 6.28) * 2.2, life: 22, size: 2, color: '#ffffff', blend: 'lighter', type: 'star' });
    s.flash = 1;
    await G.tween(s, { scale: 1 }, 12, G.ease.outBack);
    G.audio && G.audio.cry(e.mon.sp);
    await G.tween(s, { flash: 0 }, 14, G.ease.linear);
    if (e.mon.shiny) await G.shinyAnim(this, s);
    await this.wait(18);
  }
  async playWithdraw(e) {
    const s = this.slot(e.ref); if (!s) return;
    G.audio && G.audio.sfx('recall');
    s.flash = 1; s.flashCol = '#ff6a6a';
    await G.tween(s, { scale: 0 }, 14, G.ease.inQuad);
    s.visible = false; s.flashCol = null;
    delete this.slots[this.key(e.ref)];
  }
  async playHit(e) {
    const s = this.slot(e.ref); if (!s) return;
    G.audio && G.audio.sfx(e.eff > 1 ? 'hit_super' : e.eff < 1 ? 'hit_weak' : 'hit');
    if (e.eff > 1 || e.crit) { this.shake = 10; this.punch = { x: s.x, y: s.y - 30, t: 18 }; }
    this.camFocus(s, e.eff > 1 || e.crit ? 1.1 : 1.07, 30);
    for (let k = 0; k < 4; k++) { s.blink = k % 2 === 0; await this.wait(4); }
    s.blink = false;
  }
  async playHP(e) {
    const s = this.slot(e.ref); if (!s) return;
    const from = s.dispHp, to = e.hp; s.maxhp = e.max; s.hp = to;
    if (e.silent) { s.dispHp = to; return; }
    const diff = Math.abs(to - from); const n = G.clamp(Math.round(diff / e.max * 50), 6, 44);
    if (e.heal) G.audio && G.audio.sfx('heal');
    for (let f = 1; f <= n; f++) { s.dispHp = Math.round(G.lerp(from, to, G.ease.outQuad(f / n))); await this.wait(1); }
    s.dispHp = to;
    if (to > 0 && to / e.max <= .2 && from / e.max > .2 && s.side === this.persp) G.audio && G.audio.sfx('lowhp');
  }
  async playFaint(e) {
    const s = this.slot(e.ref); if (!s) return;
    G.audio && G.audio.cry(s.sp, { faint: true });
    await this.wait(16);
    G.audio && G.audio.sfx('faint');
    await G.tween(s, { offy: 60, alpha: 0 }, 22, G.ease.inQuad);
    s.visible = false;
    if (this.balls && this.balls[s.side]) this.balls[s.side].alive = Math.max(0, this.balls[s.side].alive - 1);
  }
  async playStat(e) {
    const s = this.slot(e.ref); if (!s) return;
    const up = e.d > 0; G.audio && G.audio.sfx(up ? 'statup' : 'statdown');
    this.overlays.push({ kind: 'stat', s, up, t: 0, life: 40, col: up ? (e.d >= 2 ? '#ff5a3a' : '#ff9a3a') : '#4a8ae8' });
    await this.wait(34);
  }
  async playPopup(e) {
    const mine = e.side === this.persp;
    const p = { text: e.ability, name: e.name, mine, t: 0, x: 0 };
    this.popups.push(p);
    G.audio && G.audio.sfx('ability');
    await this.wait(52);
    this.popups.splice(this.popups.indexOf(p), 1);
  }
  async playExp(e) {
    const s = e.ref ? this.slot(e.ref) : null;
    if (!s || s.side !== this.persp || s.uid !== e.uid) return;
    G.audio && G.audio.sfx('exp');
    const from = e.from.frac, levels = e.ups;
    s.expFrac = from;
    if (levels > 0) { await G.tween(s, { expFrac: 1 }, 26 * (1 - from) + 6, G.ease.linear); s.expFrac = 0; s.lvl = e.lvl; }
    await G.tween(s, { expFrac: e.frac }, Math.max(6, 26 * (e.frac - (levels ? 0 : from))), G.ease.linear);
  }
  async playLevelUp(e) {
    const s = e.ref ? this.slot(e.ref) : null;
    if (s) { s.lvl = e.lvl; s.maxhp = e.stats.hp; s.flash = 1; s.flashCol = '#fff6a0'; G.tween(s, { flash: 0 }, 20); }
    G.audio && G.audio.jingle('levelup');
    this.levelPanel = { name: e.name, lvl: e.lvl, old: e.old, stats: e.stats, stage: 0 };
    await this.message(`${e.name} grew to Lv. ${e.lvl}!`, { noWait: true });
    await this.waitPress(); this.levelPanel.stage = 1; await this.waitPress();
    this.levelPanel = null;
  }
  async waitPress() { await G.nextFrame(); while (!(G.input.pressed('a') || G.input.pressed('b') || G.turbo)) await G.nextFrame(); G.input.consume('a'); G.input.consume('b'); }
  async playResonate(e) {
    const s = this.slot(e.ref); if (!s) return;
    G.audio && G.audio.sfx('resonate');
    this.dim = 0; await G.tween(this, { dim: .6 }, 14);
    s.resonant = G.TYPE_COLORS[e.type] || '#8af0ff';
    for (let r = 0; r < 3; r++) { for (let i = 0; i < 24; i++) { const a = i / 24 * 6.28; this.fxp.add({ x: s.x, y: s.y - 32, vx: Math.cos(a) * (2 + r), vy: Math.sin(a) * (2 + r) * .7, life: 30, size: 2.4, color: s.resonant, blend: 'lighter', type: 'star' }); } await this.wait(8); }
    this.flash = 14; this.flashCol = s.resonant; s.flash = 1; s.flashCol = '#ffffff';
    G.audio && G.audio.cry(s.sp);
    await G.tween(s, { flash: 0 }, 24);
    await G.tween(this, { dim: 0 }, 16);
  }
  // ------------------------------------------------------- update/draw
  // battle camera: pans, dollies in and eases back like the DS's roaming camera; the backdrop moves at
  // half the rate (parallax), so the field reads as a deep space rather than a flat card
  camFocus(s, z, frames) { if (!s) return; this.camF = { x: s.x, y: s.y - 30 * (s.sc || 1), z, until: this.t + frames }; }
  updateCam() {
    const C = this.cam || (this.cam = { x: 0, y: 0, z: 1.075, cx: G.W / 2, cy: G.H * .56 });
    let tx, ty, tz, tcx, tcy;
    const F = this.camF && this.t < this.camF.until ? this.camF : null;
    if (F) { tcx = F.x; tcy = F.y; tz = F.z + .04; tx = (G.W / 2 - F.x) * .18; ty = (G.H * .5 - F.y) * .12; }
    else {
      const t = this.t, calm = this.menu ? .5 : 1;
      tcx = G.W / 2 + Math.sin(t / 520) * 40 * calm; tcy = G.H * .56; tz = 1.075 + Math.sin(t / 330) * .018 * calm;
      tx = Math.sin(t / 260) * 7 * calm; ty = Math.sin(t / 410) * 2 * calm;
    }
    const k = F ? .09 : .035;
    C.x += (tx - C.x) * k; C.y += (ty - C.y) * k; C.z += (tz - C.z) * k; C.cx += (tcx - C.cx) * k; C.cy += (tcy - C.cy) * k;
  }
  applyCam(c, depth) {
    const C = this.cam; if (!C) return;
    const z = 1 + (C.z - 1) * depth;
    c.translate(C.cx, C.cy); c.scale(z, z); c.translate(-C.cx + C.x * depth, -C.cy + C.y * depth);
  }
  update(top) {
    this.t++; this.bgT++;
    this.updateCam();
    this.parts.update(); this.fxp.update();
    for (const k in this.slots) { const s = this.slots[k]; if (this.t % 14 === 0) s.frame = (s.frame + 1) % 4; if (s.shield > 0) s.shield--; }
    for (const o of this.overlays) o.t++;
    this.overlays = this.overlays.filter(o => o.t < o.life);
    if (this.shake > 0) this.shake--; if (this.flash > 0) this.flash--;
    for (const p of this.popups) p.t++;
    // weather particles
    const w = this.weather;
    if (w === 'rain') for (let i = 0; i < 3; i++) this.parts.add({ x: G.rand() * (G.W + 60), y: -8, vx: -2, vy: 8, life: 30, type: 'line', len: 1.2, color: 'rgba(200,220,255,.55)', lw: 1 });
    if (w === 'snow') if (G.rand() < .6) this.parts.add({ x: G.rand() * (G.W + 60), y: -4, vx: -.6, vy: 1 + G.rand(), life: 240, size: G.rand() < .3 ? 2 : 1, color: '#ffffff' });
    if (w === 'sand') for (let i = 0; i < 3; i++) this.parts.add({ x: G.W + 10, y: G.rand() * G.H, vx: -6 - G.rand() * 3, vy: .8, life: 80, type: 'line', len: 1.4, color: 'rgba(220,180,110,.6)', lw: 1 });
    if (this.menu && top) this.menu.update && this.menu.update();
  }
  draw(b) {
    const shx = this.shake ? (G.rand() - .5) * this.shake * .6 : 0, shy = this.shake ? (G.rand() - .5) * this.shake * .4 : 0;
    b.save(); b.translate(Math.round(shx), Math.round(shy));
    // intro camera: opens pushed in toward the foe's side and pulls back as the field slides in
    const zi = G.ease.inOutQuad ? G.ease.inOutQuad(Math.min(1, this.intro)) : this.intro;
    if (zi > .002) { const z = 1 + .18 * zi, cx = G.W / 2 + 70 * zi, cy = G.H * .45; b.translate(cx, cy); b.scale(z, z); b.translate(-cx, -cy); }
    // impact punch: a quick push toward the target on big hits
    if (this.punch && this.punch.t > 0) { const k = Math.sin(this.punch.t / 18 * Math.PI) * .05, px = this.punch.x, py = this.punch.y; b.translate(px, py); b.scale(1 + k, 1 + k); b.translate(-px, -py); this.punch.t--; }
    this.applyCam(b, 1);
    if (!this._hd) b.drawImage(G.battleBG(this.env, this.o.phase || 'day'), 0, 0);
    this.drawAmbience(b);
    // platforms
    const n = this.nSlots(), ioff = this.intro * 260;
    const E0 = G.BATTLE_ENVS[this.env] || {};
    const plat = (x, y, w, mine) => {
      // outdoors there is no platform at all: the mons stand in the field with a soft contact shadow
      if (!E0.indoor) { if (!Object.values(this.slots).some(q => q.visible && q.scale > .05 && (q.side === this.persp) === mine)) return; const ox2 = mine ? ioff : -ioff; for (let i = 0; i < 3; i++) { b.fillStyle = `rgba(10,20,10,${.1 + i * .05})`; b.beginPath(); b.ellipse(x + ox2, y + 2, w * .32 * (1 - i * .22), w * .07 * (1 - i * .22), 0, 0, Math.PI * 2); b.fill(); } return; }
      const img = G.battlePlatform(this.env, w, mine);
      b.drawImage(img, Math.round(x - img.width / 2 + (mine ? ioff : -ioff)), Math.round(y - img.height / 2 + 2));
    };
    { const F = this.pos(1 - this.persp, 0, 1), M = this.pos(this.persp, 0, 1); plat(F.x, F.y - 2, 124, false); plat(M.x, M.y - 2, 150, true); }
    // hazards (rocks float near foe platform)
    for (const side of [0, 1]) {
      const h = this.hazards[side]; const mine = side === this.persp; const bx = mine ? 96 : 282, by = mine ? 166 : 106;
      if (h.rocks) for (let i = 0; i < 4; i++) { b.fillStyle = '#a89878'; const x = bx - 40 + i * 26, y = by - 8 + Math.sin(this.t / 20 + i) * 2; b.fillRect(x, y, 4, 4); b.fillStyle = '#6a5a48'; b.fillRect(x + 2, y + 2, 2, 2); }
      if (h.spikes) for (let i = 0; i < h.spikes * 3; i++) { b.fillStyle = '#5a5a64'; const x = bx - 36 + i * 9, y = by + 4; b.beginPath(); b.moveTo(x, y + 3); b.lineTo(x + 2, y - 2); b.lineTo(x + 4, y + 3); b.fill(); }
      if (h.tspikes) for (let i = 0; i < h.tspikes * 3; i++) { b.fillStyle = '#9a4ac8'; const x = bx - 30 + i * 10, y = by + 8; b.fillRect(x, y, 3, 2); }
      if (h.web) { b.strokeStyle = 'rgba(255,255,255,.35)'; b.lineWidth = 1; for (let i = 0; i < 5; i++) { b.beginPath(); b.moveTo(bx - 40 + i * 20, by - 4); b.lineTo(bx - 30 + i * 20, by + 8); b.stroke(); } }
    }
    // trainers
    for (const t of this.trainers) {
      if (t.alpha <= 0 || !t.look) continue;
      b.globalAlpha = t.alpha;
      const sx = t.x + t.off + (t.back ? ioff : -ioff);
      // generated sprites: idle breathing, action pose while sending out, 4-frame throw for the player
      const lk = typeof t.look === 'string' ? G.LOOKS[t.look] : t.look;
      const going = Math.abs(t.off) > .5, prog = Math.min(1, Math.abs(t.off) / 60);
      // animated trainers: an idle loop (breathing, a blink now and then) and a signature emote when
      // they first appear; the ready pose of the emote doubles as the send-out pose
      if (!t.back && G.chars.hasBattle(lk, 'n0')) {
        if (t.emoteAt === undefined) t.emoteAt = this.t + 24;
        const et = this.t - t.emoteAt, SEQ = [0, 1, 1, 0, 3, 3, 0, 0, 1, 1, 0, 3, 3, 0, 2, 0];
        let k = et >= 0 && et < 48 ? 'e' + Math.floor(et / 8) : t.act > 0 ? 'e5' : 'n' + SEQ[Math.floor(this.t / 12) % SEQ.length];
        if (!G.chars.hasBattle(lk, k)) k = 'n0';
        const spr = G.chars.battleSprite(lk, k);
        b.drawImage(spr, Math.round(sx - G.chars.battleFeet(lk, k)), Math.round(t.y - spr.height));
        if (t.act > 0) t.act--;
        b.globalAlpha = 1; continue;
      }
      const spr = t.back ? G.chars.battleSprite(lk, 'b' + (going ? 1 + Math.min(2, Math.floor(prog * 3)) : 0)) || G.chars.battleSprite(lk, 'b0')
                         : G.chars.battleSprite(lk, t.act > 0 ? 'a' : 'i') || G.chars.battleSprite(lk, 'i');
      if (spr) {
        const idle = G.chars.battleSprite(lk, t.back ? 'b0' : 'i') || spr;
        const breathe = (t.back && going) ? 0 : Math.round(Math.sin((this.t + (t.back ? 20 : 0)) / 22) * .6 + .4);
        const x = Math.round(sx - idle.width / 2 + (spr.width !== idle.width && !t.back ? (idle.width - spr.width) / 2 : 0));
        if (t.back) b.drawImage(spr, x, Math.round(t.y + 12 - spr.height + breathe));
        else {
          // one-pixel squash from the top reads as breathing without warping the pixels
          b.drawImage(spr, 0, 0, spr.width, spr.height - breathe, x, Math.round(t.y - spr.height + breathe), spr.width, spr.height - breathe);
        }
        if (t.act > 0) t.act--;
      } else {
        const img = G.chars.portrait(t.look, t.back ? 'throw' : 'stand', !!t.back);
        if (t.back) b.drawImage(img, Math.round(sx - 36 * 1.1), Math.round(t.y - 88 * 1.1 + 10), 72 * 1.1, 88 * 1.1);
        else { b.save(); b.translate(Math.round(sx + 36), Math.round(t.y - 88)); b.scale(-1, 1); b.drawImage(img, 0, 0); b.restore(); }
      }
      b.globalAlpha = 1;
    }
    // mons: draw foes first then mine
    const keys = Object.keys(this.slots).sort((a, c) => (this.slots[a].side === this.persp) - (this.slots[c].side === this.persp));
    for (const k of keys) this.drawMon(b, this.slots[k], ioff);
    if (this.thrown) { const th = this.thrown; b.save(); b.translate(th.x, th.y); b.rotate(th.rot); b.drawImage(G.tiles.itemIcon('orb', G.ITEMS[th.ball] ? G.ITEMS[th.ball].ic : '#e8484a'), -8, -8); b.restore(); }
    this.parts.draw(b); this.fxp.draw(b);
    if (this.animLayer) this.animLayer(b);
    // stat overlays
    for (const o of this.overlays) if (o.kind === 'stat') {
      const s = o.s, k = o.t / o.life, img = G.monImgFor(this, s); if (!img) continue;
      const sil = G.pix.silhouette(img.img, o.col);
      b.globalAlpha = .45 * Math.sin(k * Math.PI);
      b.drawImage(sil, Math.round(img.x), Math.round(img.y));
      b.globalAlpha = 1;
      for (let i = 0; i < 5; i++) { const x = s.x - 24 + i * 12, y = s.y - 20 - ((o.t * 2 + i * 13) % 50) * (o.up ? 1 : -1) + (o.up ? 0 : -60); b.fillStyle = o.col; b.fillRect(x, y, 3, 6); b.beginPath(); if (o.up) { b.moveTo(x - 2, y); b.lineTo(x + 1.5, y - 4); b.lineTo(x + 5, y); } else { b.moveTo(x - 2, y + 6); b.lineTo(x + 1.5, y + 10); b.lineTo(x + 5, y + 6); } b.fill(); }
    }
    // weather tint
    if (this.weather === 'sun') { b.fillStyle = 'rgba(255,200,90,.12)'; b.fillRect(0, 0, G.W, G.H); }
    if (this.weather === 'rain') { b.fillStyle = 'rgba(40,60,110,.15)'; b.fillRect(0, 0, G.W, G.H); }
    if (this.weather === 'sand') { b.fillStyle = 'rgba(200,160,90,.16)'; b.fillRect(0, 0, G.W, G.H); }
    if (this.weather === 'snow') { b.fillStyle = 'rgba(210,230,255,.12)'; b.fillRect(0, 0, G.W, G.H); }
    if (this.dim > 0) { b.fillStyle = `rgba(0,0,10,${this.dim})`; b.fillRect(0, 0, G.W, G.H); for (const k in this.slots) { const s = this.slots[k]; if (s.resonant && s.flash > 0) this.drawMon(b, s, 0); } }
    b.restore();
    if (this.flash > 0) { b.globalAlpha = this.flash / 16; b.fillStyle = this.flashCol; b.fillRect(0, 0, G.W, G.H); b.globalAlpha = 1; }
  }
  // living backdrop: drifting clouds, sun shafts, and particles that suit the setting
  // HD backdrop straight onto the screen canvas at native resolution, following the same camera
  // (intro push-in, impact punch, shake) as the pixel layer drawn over it
  drawBack(c) {
    const hd = G.battleHD && G.battleHD(this.env, this.o.phase || 'day');
    this._hd = !!hd; if (!hd) return;
    const gx = G.gfx, S = gx.S;
    c.save(); c.beginPath(); c.rect(gx.ox, gx.oy, G.W * S, G.H * S); c.clip();
    c.translate(gx.ox, gx.oy); c.scale(S, S);
    if (this.shake) c.translate((G.rand() - .5) * this.shake * .6, (G.rand() - .5) * this.shake * .4);
    const zi = G.ease.inOutQuad ? G.ease.inOutQuad(Math.min(1, this.intro)) : this.intro;
    if (zi > .002) { const z = 1 + .18 * zi, cx = G.W / 2 + 70 * zi, cy = G.H * .45; c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy); }
    if (this.punch && this.punch.t > 0) { const k = Math.sin(this.punch.t / 18 * Math.PI) * .05, px = this.punch.x, py = this.punch.y; c.translate(px, py); c.scale(1 + k, 1 + k); c.translate(-px, -py); }
    // the backdrop sits deeper than the battlefield: it follows the camera at half the rate (parallax),
    // and softens a touch when the camera closes in on a mon (a shallow depth of field)
    this.applyCam(c, .5);
    const dx = Math.sin(this.t / 700) * 6, dy = Math.sin(this.t / 900) * 2, sc = 1.08;
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    const blur = this.cam ? Math.max(0, (this.cam.z - 1.02) * 26) : 0;
    if (blur > .15) c.filter = `blur(${(blur * S / 3).toFixed(2)}px)`;
    c.drawImage(hd, -G.W * (sc - 1) / 2 + dx, -G.H * (sc - 1) / 2 + dy, G.W * sc, G.H * sc);
    c.filter = 'none';
    c.restore(); c.imageSmoothingEnabled = false;
  }
  drawAmbience(b) {
    const E = G.BATTLE_ENVS[this.env] || G.BATTLE_ENVS.grass, ph = this.o.phase || 'day', night = ph === 'night', t = this.t;
    if (!E.indoor && E.clouds && !this._hd) {
      if (!G._bclouds) G._bclouds = [0, 1, 2].map(i => {
        const rng = new G.RNG(300 + i), w = 50 + rng.int(0, 40), p = new G.Painter(w + 10, 18);
        const L = [G.rgb('#b8c8e0'), G.rgb('#e4ecf8'), G.rgb('#ffffff')];
        const nk = 5; for (let k = 0; k < nk; k++) { const cx = 6 + (k + .5) * w / nk, cy = 12 - (k > 0 && k < nk - 1 ? rng.range(2, 6) : 0), r = rng.range(6, 9);
          for (let y = Math.floor(cy - r); y < 16; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) { if ((x - cx) ** 2 + (y - cy) ** 2 > r * r && y < cy) continue; if (y > 14) continue; p.set(x, y, L[y > 13 ? 0 : (y - cy) < -r * .3 ? 2 : 1]); } }
        return p.done(); });
      b.globalAlpha = night ? .25 : .9;
      G._bclouds.forEach((c, i) => { const x = ((i * 150 - t * (.08 + i * .03)) % (G.W + 120) + G.W + 120) % (G.W + 120) - 90; b.drawImage(c, Math.round(x), 14 + i * 16); });
      b.globalAlpha = 1;
    }
    if (!E.indoor && !night && E.sun && !this._hd) {
      b.save(); b.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 4; i++) {
        const life = Math.max(0, Math.sin(t / (300 + i * 70) + i * 2.1)); if (life < .05) continue;
        const x = 250 + i * 34 + Math.sin(t / 400 + i) * 8, w = 10 + (i % 2) * 10;
        for (let k = 0; k < 2; k++) { const ww = w * (1 - k * .5); b.fillStyle = `rgba(255,246,210,${(.05 * life * (k ? 1 : .6)).toFixed(3)})`; b.beginPath(); b.moveTo(x - ww / 2, 0); b.lineTo(x + ww / 2, 0); b.lineTo(x + ww / 2 - 90, G.H); b.lineTo(x - ww / 2 - 90, G.H); b.closePath(); b.fill(); }
      }
      b.restore();
    }
    if (!this.weather && G.settings.fancy !== false) {
      const env = this.env;
      if ((env === 'grass' || env === 'forest') && G.rand() < .03) this.parts.add({ x: G.W + 6, y: G.rand() * 120, vx: -.7 - G.rand() * .5, vy: .25 + G.rand() * .2, life: 700, type: 'leaf', size: 1.7, rot: G.rand() * 6, vr: .06, color: G.pick(['#5a9a3a', '#7ab84a', '#c8b04a']), upd: p => { p.vy += Math.sin(p.t / 18) * .01; } });
      if ((env === 'cave' || env === 'crystal' || env === 'ruins' || env === 'gym' || env === 'league') && G.rand() < .05) this.parts.add({ x: G.rand() * G.W, y: G.rand() * G.H, vx: (G.rand() - .5) * .1, vy: -.06, life: 260, size: 1, color: env === 'crystal' ? '#c8f0ff' : '#fff0c8', alpha: .6, fadeIn: 60, blend: 'lighter' });
      if (env === 'snow' && G.rand() < .25) this.parts.add({ x: G.rand() * (G.W + 60), y: -4, vx: -.4, vy: .6 + G.rand() * .5, life: 360, size: G.rand() < .3 ? 2 : 1, color: '#ffffff' });
    }
  }
  drawMon(b, s, ioff) {
    if (!s.visible) return;
    const mine = s.side === this.persp;
    const r = G.monImgFor(this, s); if (!r) return;
    let { img, x, y, w, h } = r;
    if (s.blink) return;
    b.save();
    b.globalAlpha = s.alpha;
    // shadow
    b.fillStyle = 'rgba(0,0,0,.2)'; b.beginPath(); b.ellipse(s.x + s.offx, s.y - 2, 26 * s.sc * s.scale, 6 * s.sc * s.scale, 0, 0, Math.PI * 2); b.fill();
    if (s.resonant) {
      const pulse = .5 + .5 * Math.sin(this.t / 8);
      b.globalCompositeOperation = 'lighter';
      const sil = G.pix.silhouette(img, s.resonant);
      b.globalAlpha = .35 + .25 * pulse;
      for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) b.drawImage(sil, x + dx, y + dy, w, h);
      b.globalCompositeOperation = 'source-over'; b.globalAlpha = s.alpha;
      if (this.t % 6 === 0) this.fxp.add({ x: s.x + (G.rand() - .5) * 40 * s.sc, y: s.y - G.rand() * 60 * s.sc, vx: 0, vy: -.8, life: 30, size: 1.5, color: s.resonant, blend: 'lighter' });
    }
    if (s.sub) {
      const doll = G.tiles.get('decoy', 32, 32, p => { const c = G.col.parse('#e8d8b0'), d = G.col.parse('#b89a60'); p.circ(16, 12, 7, c); p.ell(16, 24, 8, 7, c); p.circ(9, 5, 3, d); p.circ(23, 5, 3, d); p.set(13, 11, G.col.parse('#2a2020')); p.set(19, 11, G.col.parse('#2a2020')); p.rect(14, 20, 4, 1, d); p.outline(G.col.parse('#3a2a20')); });
      b.drawImage(doll, s.x - 16 + s.offx, s.y - 32 + s.offy);
    } else b.drawImage(img, x, y, w, h);
    if (s.flash > 0) { b.globalAlpha = s.flash * s.alpha; b.drawImage(G.pix.silhouette(img, s.flashCol || '#ffffff'), x, y, w, h); }
    if (s.shield > 0) { b.globalAlpha = Math.min(1, s.shield / 10) * .6; b.strokeStyle = '#8ae8ff'; b.lineWidth = 2; b.beginPath(); b.ellipse(s.x, s.y - 34 * s.sc, 36 * s.sc, 38 * s.sc, 0, 0, Math.PI * 2); b.stroke(); b.fillStyle = 'rgba(160,240,255,.18)'; b.fill(); }
    b.restore();
  }
  drawUI(c) {
    const U = G.ui;
    const n = this.nSlots();
    // HP boxes
    for (const k in this.slots) {
      const s = this.slots[k]; if (!s.visible && s.alpha <= 0) continue;
      if (!s.visible) continue;
      this.drawHUD(s, n);
    }
    // party balls
    if (this.balls && this.intro < .5 && Object.keys(this.slots).length < 2 * n) {
      for (const side of [0, 1]) {
        const mine = side === this.persp, B = this.balls[side]; if (!B) continue;
        const x0 = mine ? 12 : G.W - 70, y0 = mine ? 38 : 32;
        for (let i = 0; i < Math.min(6, B.count); i++) U.img(G.tiles.itemIcon('orb', i < B.alive ? '#e8484a' : '#606070'), x0 + i * 10, y0, { scale: .6 });
      }
    }
    // screens/field indicators
    for (const side of [0, 1]) {
      const sc = this.screens[side], mine = side === this.persp; let i = 0;
      for (const kk of ['reflect', 'lightscreen', 'veil', 'tailwind']) if (sc[kk]) { const sx = mine ? 112 + i * 16 : G.W - 126 - i * 16, sy = 10; U.panel(sx, sy, 14, 8, 'glass', { r: 2, noShadow: true }); U.text({ reflect: 'RF', lightscreen: 'LS', veil: 'AV', tailwind: 'TW' }[kk], sx + 7, sy + 1.4, { size: 4.6, align: 'center', color: '#bff', weight: 800 }); i++; }
    }
    // ability popups
    for (const p of this.popups) {
      const k = Math.min(1, p.t / 8) * (p.t > 44 ? Math.max(0, 1 - (p.t - 44) / 8) : 1);
      const w = 104, x = p.mine ? -w + w * k + 4 : G.W - w * k - 4, y = p.mine ? 118 : 50;
      U.panel(x, y, w, 20, p.mine ? 'blue' : 'red', { r: 4 });
      U.text(p.name + '\'s', x + (p.mine ? 8 : w - 8), y + 2.5, { size: 5.5, color: '#fff', weight: 700, align: p.mine ? 'left' : 'right' });
      U.text(p.text, x + (p.mine ? 8 : w - 8), y + 9.5, { size: 7.5, color: '#fff', weight: 800, align: p.mine ? 'left' : 'right' });
    }
    // text box / menus
    if (this.menu) this.menu.draw();
    else if (this.showBox && this.box.pages.length) this.box.draw(false);
    if (this.levelPanel) this.drawLevelPanel();
  }
  drawHUD(s, n) {
    // compact glass card: translucent slab, a colour edge, white type; the HP bar carries the colour
    const U = G.ui, mine = s.side === this.persp, i = s.slot;
    const slide = this.hudShow[s.side] ? 0 : 1;
    const w = 100, h = mine ? 25 : 18;
    let x = mine ? 8 : G.W - w - 8, y = mine ? (n === 1 ? 8 : (i === 0 ? 6 : 34)) : (n === 1 ? 8 : (i === 0 ? 6 : 28));
    x += (mine ? -1 : 1) * slide * 150;
    const acc = mine ? '#3b82e0' : '#ff3b4e';
    U.c.globalAlpha = .55; U.para(x - 1, y + 2, w + 2, h, 5, '#000000'); U.c.globalAlpha = .86; U.para(x, y, w, h, 5, '#0e1019'); U.c.globalAlpha = 1;
    U.para(mine ? x : x + w - 2.5, y, 2.5, h, 5, acc);
    const name = s.name;
    U.text(name, x + 8, y + 2, { size: 6.3, weight: 800, color: '#ffffff', shadow: false });
    const nw = U.measure(name, 6.3, 800);
    if (s.gender) U.text(s.gender === 'm' ? '♂' : '♀', x + 10 + nw, y + 2, { size: 6, weight: 800, color: s.gender === 'm' ? '#6ab0ff' : '#ff7aa0', shadow: false });
    U.text('Lv' + s.lvl, x + w - 7, y + 2.4, { size: 5.4, weight: 800, align: 'right', color: '#ffd35c', shadow: false });
    if (!mine && this.bt && this.bt.wild && G.save && G.save.dex.caught[s.sp]) U.img(G.tiles.itemIcon('orb', '#e8484a'), x + w - 30, y + 2.2, { scale: .42 });
    const f = s.maxhp ? s.dispHp / s.maxhp : 0;
    U.para(x + 8, y + 11, w - 17, 3.4, 1.2, 'rgba(255,255,255,.12)');
    U.para(x + 8, y + 11, (w - 17) * Math.max(0, f), 3.4, 1.2, U.hpColor(f));
    if (s.status) { const col = { brn: '#ee8130', par: '#e8c020', psn: '#a33ea1', tox: '#7a2a78', slp: '#8a8a9a', frz: '#78d0d0' }[s.status]; U.para(x + 8, y + (mine ? 16.5 : 14.8), 15, 5.2, 1.5, col); U.text({ brn: 'BRN', par: 'PAR', psn: 'PSN', tox: 'TOX', slp: 'SLP', frz: 'FRZ' }[s.status], x + 16, y + (mine ? 16.9 : 15.2), { size: 3.9, weight: 800, color: '#fff', align: 'center', shadow: false }); }
    if (mine) {
      U.text(`${Math.max(0, s.dispHp)} / ${s.maxhp}`, x + w - 8, y + 15.6, { size: 5.2, weight: 800, align: 'right', color: '#d8dde8', shadow: false });
      const ef = s.expFrac !== undefined ? s.expFrac : this.expFracOf(s);
      U.para(x + 8, y + h - 3, w - 17, 1.3, .5, 'rgba(255,255,255,.1)'); U.para(x + 8, y + h - 3, (w - 17) * ef, 1.3, .5, '#4ab0f4');
    }
    if (s.resonant) U.text('✦', x + w - 12, y + (mine ? 15 : 10), { size: 6, color: s.resonant, weight: 800, outline: 'rgba(0,0,0,.6)' });
  }
  expFracOf(s) { const m = this.findMon(s.uid); return m ? G.mon.expProgress(m) : 0; }
  findMon(uid) { return G.save ? G.party.allMons().find(m => m.uid === uid) : null; }
  drawLevelPanel() {
    const U = G.ui, L = this.levelPanel;
    const x = 6, y = 38, w = 104, h = 86;
    U.panel(x, y, w, h, 'light');
    const rows = [['hp', 'Max HP'], ['atk', 'Attack'], ['def', 'Defense'], ['spa', 'Sp. Atk'], ['spd', 'Sp. Def'], ['spe', 'Speed']];
    rows.forEach(([k, lbl], i) => {
      const yy = y + 6 + i * 13;
      U.text(lbl, x + 8, yy, { size: 6.8, weight: 700 });
      const v = L.stage === 0 ? '+' + (L.stats[k] - L.old[k]) : L.stats[k];
      U.text(String(v), x + w - 8, yy, { size: 6.8, weight: 800, align: 'right', color: L.stage === 0 ? '#2aa86a' : '#283040' });
    });
  }
};

// ---------------------------------------------------------------- helpers --
G.monImgFor = function (sc, s) {
  const mine = s.side === sc.persp, back = !!(s.back || mine);
  // pixel sprites breathe and sway through a cached idle loop; the vector fallback uses its 4 frames
  const lt = sc.t * (s.status === 'slp' || s.status === 'frz' ? .35 : 1) + s.slot * 37 + (mine ? 0 : 61);
  const live = G.monArt.live && G.monArt.live(s.sp, s.shiny, back, lt);
  const img = live || (back ? G.monArt.back(s.sp, s.shiny, s.frame) : G.monArt.front(s.sp, s.shiny, s.frame));
  if (!img) return null;
  const scale = (s.sc || 1) * (s.scale === undefined ? 1 : s.scale);
  const w = img.width * scale, h = img.height * scale;
  const bob = live ? G.monArt.hover(s.sp, lt) * scale : Math.sin((sc.t + (s.slot * 17)) / 18) * .8;
  const x = Math.round(s.x - w / 2 + s.offx), y = Math.round(s.y - h + (mine ? (live ? 8 : 22) : 8) * scale + s.offy + bob);
  return { img, x, y, w, h };
};
G._bgCache = {};
G.battleBG = function (env, phase) {
  const key = env + '|' + phase;
  if (G._bgCache[key]) return G._bgCache[key];
  const cv = G.makeCanvas(G.W, G.H), b = cv.getContext('2d');
  const E = G.BATTLE_ENVS[env] || G.BATTLE_ENVS.grass;
  const night = phase === 'night', dusk = phase === 'dusk' || phase === 'dawn';
  const sky = b.createLinearGradient(0, 0, 0, 120);
  const s0 = night ? E.nsky[0] : dusk ? '#ff9a7a' : E.sky[0], s1 = night ? E.nsky[1] : dusk ? '#ffd8a8' : E.sky[1];
  sky.addColorStop(0, s0); sky.addColorStop(1, s1); b.fillStyle = sky; b.fillRect(0, 0, G.W, 130);
  const rng = new G.RNG(env);
  if (E.stars || night) for (let i = 0; i < 60; i++) { b.fillStyle = `rgba(255,255,255,${.3 + rng.next() * .6})`; b.fillRect(rng.int(0, G.W), rng.int(0, 90), 1, 1); }
  if (E.sun && !night) { const g = b.createRadialGradient(320, 30, 0, 320, 30, 50); g.addColorStop(0, 'rgba(255,250,220,.9)'); g.addColorStop(1, 'rgba(255,250,220,0)'); b.fillStyle = g; b.fillRect(260, 0, 124, 90); }
  if (night && !E.indoor) { b.fillStyle = '#f4f0dc'; b.beginPath(); b.arc(310, 30, 10, 0, Math.PI * 2); b.fill(); b.fillStyle = s0; b.beginPath(); b.arc(314, 27, 9, 0, Math.PI * 2); b.fill(); }
  // clouds
  if (E.clouds && !night) for (let i = 0; i < 5; i++) { const x = rng.int(0, G.W), y = rng.int(10, 60); b.fillStyle = 'rgba(255,255,255,.75)'; for (let j = 0; j < 4; j++) { b.beginPath(); b.ellipse(x + j * 9, y + (j % 2) * 2, 9, 5, 0, 0, Math.PI * 2); b.fill(); } }
  // far layers
  const layer = (col, base, amp, freq, seed, jag) => { b.fillStyle = night ? G.col.dark(col, .45) : col; b.beginPath(); b.moveTo(0, 140); for (let x = 0; x <= G.W; x += 4) { const n = G.smoothNoise(x / freq, seed, seed) * amp; b.lineTo(x, base - n - (jag ? (x % 12 < 6 ? 3 : 0) : 0)); } b.lineTo(G.W, 140); b.fill(); };
  for (const L of E.layers) layer(L[0], L[1], L[2], L[3], L[4], L[5]);
  if (E.build) for (let i = 0; i < 14; i++) { const x = i * 28 + rng.int(-4, 4), h = rng.int(20, 60); b.fillStyle = night ? '#2a3044' : E.build; b.fillRect(x, 110 - h, 22, h); for (let wy = 110 - h + 4; wy < 106; wy += 7) for (let wx = x + 3; wx < x + 20; wx += 6) { b.fillStyle = night ? (rng.chance(.6) ? '#ffe08a' : '#3a4054') : 'rgba(200,230,255,.6)'; b.fillRect(wx, wy, 3, 4); } }
  // ground
  const gg = b.createLinearGradient(0, 100, 0, G.H); gg.addColorStop(0, night ? G.col.dark(E.ground[0], .4) : E.ground[0]); gg.addColorStop(1, night ? G.col.dark(E.ground[1], .4) : E.ground[1]);
  b.fillStyle = gg; b.fillRect(0, E.horizon || 104, G.W, G.H);
  for (let i = 0; i < 260; i++) { b.fillStyle = `rgba(${E.speck || '0,0,0'},${.05 + rng.next() * .08})`; const y = (E.horizon || 104) + Math.pow(rng.next(), 1.3) * 112; b.fillRect(rng.int(0, G.W), y, 1 + (y > 160 ? 1 : 0), 1); }
  if (E.indoor) { b.fillStyle = 'rgba(255,255,255,.06)'; for (let x = -200; x < G.W; x += 24) { b.beginPath(); b.moveTo(x, 216); b.lineTo(x + 120, 104); b.lineTo(x + 132, 104); b.lineTo(x + 12, 216); b.fill(); } }
  G._bgCache[key] = cv;
  return cv;
};
G._platCache = {};
G.battlePlatform = function (env, w, mine) {
  const key = env + w + mine; if (G._platCache[key]) return G._platCache[key];
  const E = G.BATTLE_ENVS[env] || G.BATTLE_ENVS.grass;
  const h = w * .26, cv = G.makeCanvas(w + 4, h + 8), b = cv.getContext('2d');
  b.fillStyle = 'rgba(0,0,0,.25)'; b.beginPath(); b.ellipse(w / 2 + 2, h / 2 + 5, w / 2, h / 2, 0, 0, Math.PI * 2); b.fill();
  b.fillStyle = E.plat[1]; b.beginPath(); b.ellipse(w / 2 + 2, h / 2 + 3, w / 2, h / 2, 0, 0, Math.PI * 2); b.fill();
  const g = b.createRadialGradient(w / 2 - w * .1, h / 2 - h * .2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, G.col.light(E.plat[0], .2)); g.addColorStop(1, E.plat[0]);
  b.fillStyle = g; b.beginPath(); b.ellipse(w / 2 + 2, h / 2, w / 2 - 2, h / 2 - 2, 0, 0, Math.PI * 2); b.fill();
  if (E.platDetail) { b.strokeStyle = 'rgba(255,255,255,.25)'; b.lineWidth = 1; b.beginPath(); b.ellipse(w / 2 + 2, h / 2, w / 2 - 10, h / 2 - 6, 0, 0, Math.PI * 2); b.stroke(); }
  if (E.tufts) for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2, x = w / 2 + 2 + Math.cos(a) * (w / 2 - 4), y = h / 2 + Math.sin(a) * (h / 2 - 2); b.fillStyle = E.tufts; b.fillRect(x - 1, y - 3, 2, 3); b.fillRect(x + 1, y - 2, 1, 2); }
  G._platCache[key] = cv; return cv;
};
G.BATTLE_ENVS = {
  grass: { sky: ['#7ec4f4', '#d8f0ff'], nsky: ['#101838', '#2a3a6a'], sun: true, clouds: true, layers: [['#8ac6a0', 108, 26, 60, 2], ['#5fa86a', 112, 16, 30, 5]], ground: ['#8ed06a', '#5aa446'], plat: ['#a8e07a', '#6aa84a'], tufts: '#4a9a3a', speck: '20,60,20' },
  forest: { sky: ['#6ab09a', '#c8e8c8'], nsky: ['#0c1a1a', '#1a3a34'], clouds: false, layers: [['#3a7a5a', 110, 50, 16, 3, true], ['#2a5a42', 114, 30, 10, 7, true]], ground: ['#6ab050', '#3a7a36'], plat: ['#8ac860', '#4a8a3a'], tufts: '#2a6a2a', speck: '10,40,10' },
  beach: { sky: ['#5ab4f4', '#e0f4ff'], nsky: ['#101838', '#2a4a7a'], sun: true, clouds: true, layers: [['#3a8ae0', 104, 3, 40, 1], ['#78c0f8', 106, 2, 20, 2]], ground: ['#f4e0a8', '#e0c080'], plat: ['#fff0c0', '#d8bc80'], speck: '120,90,40', horizon: 106 },
  water: { sky: ['#5ab4f4', '#e0f4ff'], nsky: ['#0a1430', '#1a3060'], sun: true, clouds: true, layers: [['#3a7ad0', 104, 3, 40, 1]], ground: ['#4a90e0', '#2a60b0'], plat: ['#78b8f8', '#3a78c8'], platDetail: true, speck: '255,255,255' },
  cave: { sky: ['#3a3040', '#5a4a4a'], nsky: ['#2a2030', '#3a3040'], stars: false, indoor: true, layers: [['#4a3e3a', 112, 40, 12, 4, true], ['#3a302c', 116, 24, 8, 9, true]], ground: ['#8a7a68', '#5a4c40'], plat: ['#a8967e', '#6a5a4a'], speck: '0,0,0' },
  crystal: { sky: ['#2a2848', '#4a4070'], nsky: ['#1a1830', '#2a2848'], indoor: true, stars: true, layers: [['#5a5690', 110, 36, 10, 4, true], ['#3a3868', 116, 22, 7, 8, true]], ground: ['#6c6a90', '#44426a'], plat: ['#9a98c8', '#5a588a'], platDetail: true, speck: '200,240,255' },
  snow: { sky: ['#a8c8e8', '#eef6ff'], nsky: ['#141c38', '#2a3a60'], clouds: true, layers: [['#d8e6f4', 104, 44, 40, 6], ['#b8cce0', 112, 24, 22, 9]], ground: ['#f4f8ff', '#c8d8ea'], plat: ['#ffffff', '#b8cce0'], speck: '80,110,160' },
  volcano: { sky: ['#6a3a3a', '#c86a4a'], nsky: ['#2a1418', '#5a2a24'], layers: [['#5a3a3a', 104, 50, 50, 4], ['#3a2626', 112, 26, 24, 8]], ground: ['#8a6a5a', '#5a4038'], plat: ['#a88070', '#6a4a40'], speck: '255,120,40' },
  city: { sky: ['#8ac0f0', '#e0f0ff'], nsky: ['#101838', '#2a3060'], sun: true, clouds: true, build: '#8aa0c0', layers: [], ground: ['#b8bcc8', '#8a90a0'], plat: ['#d0d4de', '#8a90a0'], platDetail: true, speck: '0,0,0' },
  dusk: { sky: ['#8a7aa8', '#e0c8d8'], nsky: ['#141030', '#302850'], clouds: true, layers: [['#7a6a8a', 106, 30, 50, 2], ['#5a4a6a', 112, 20, 22, 6, true]], ground: ['#7aa88a', '#4a7a5a'], plat: ['#9ac8a8', '#5a8a6a'], tufts: '#3a6a4a', speck: '20,40,30' },
  ruins: { sky: ['#6a6a88', '#b8b0c8'], nsky: ['#141428', '#2a2840'], indoor: true, layers: [['#5a5670', 110, 30, 12, 4, true]], ground: ['#8a8698', '#5a566a'], plat: ['#a8a4b8', '#6a667a'], platDetail: true, speck: '0,0,0' },
  gym: { sky: ['#2a3450', '#4a5a80'], nsky: ['#2a3450', '#4a5a80'], indoor: true, layers: [], ground: ['#5a6a8a', '#3a4460'], plat: ['#8aa0c8', '#4a5a80'], platDetail: true, speck: '255,255,255' },
  hq: { sky: ['#1e2838', '#34445c'], nsky: ['#1e2838', '#34445c'], indoor: true, layers: [], ground: ['#4a5670', '#2a3244'], plat: ['#6ad0d0', '#2a7a80'], platDetail: true, speck: '120,220,255' },
  sky: { sky: ['#4a8ae8', '#c8e8ff'], nsky: ['#0a1030', '#2a3a70'], sun: true, clouds: true, layers: [['#ffffff', 112, 12, 30, 3]], ground: ['#e8f4ff', '#a8c8f0'], plat: ['#ffffff', '#a8c0e0'], platDetail: true, speck: '255,255,255' },
  league: { sky: ['#1a1440', '#4a3a8a'], nsky: ['#1a1440', '#4a3a8a'], indoor: true, stars: true, layers: [], ground: ['#3a3068', '#1e183a'], plat: ['#f4d060', '#a8802a'], platDetail: true, speck: '255,220,120' },
  lighthouse: { sky: ['#1a2848', '#4a6a98'], nsky: ['#0a1428', '#1a2a48'], stars: true, layers: [['#2a4a78', 106, 4, 30, 1]], ground: ['#8a8e9a', '#5a5e6a'], plat: ['#c8ccd8', '#7a7e8a'], platDetail: true, speck: '255,255,255' },
};
