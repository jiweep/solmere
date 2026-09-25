'use strict';
// ============================================================================
//  Battle controller UI for the local player (mixed into BattleScene)
// ============================================================================
(function () {
  const BS = G.BattleScene.prototype;
  const CMDS = [{ id: 'fight', label: 'FIGHT', th: 'red' }, { id: 'bag', label: 'BAG', th: 'gold' }, { id: 'party', label: 'PARTY', th: 'green' }, { id: 'run', label: 'RUN', th: 'blue' }];
  BS.waitMenu = function (menu) { return new Promise(res => { menu.done = v => { this.menu = null; res(v); }; this.menu = menu; }); };
  BS.chooseActions = async function (bt, reqs) {
    const out = []; let i = 0; this.pendingSwitch = new Set();
    while (i < reqs.length) {
      const r = await this.chooseOne(bt, reqs[i], i > 0);
      if (r === 'back') { i = Math.max(0, i - 1); const prev = out.pop(); if (prev && prev.type === 'switch') this.pendingSwitch.delete(prev.to); continue; }
      out.push(r); i++;
      if (r.type === 'switch') this.pendingSwitch.add(r.to);
      if (r.type === 'run') { while (out.length < reqs.length) out.push({ type: 'run' }); break; }
      if (r.type === 'item' && G.ITEMS[r.item].ball) { while (out.length < reqs.length) out.push({ type: 'move', moveIdx: 0, skip: true }); break; }
    }
    this.showBox = false;
    return out;
  };
  BS.chooseOne = async function (bt, req, canBack) {
    const mon = this.findMonByUid(bt, req.uid);
    const name = mon ? G.mon.name(mon) : 'your mon';
    while (true) {
      const cmd = await this.waitMenu(new CmdMenu(this, req, name, canBack, bt));
      if (cmd === 'back') return 'back';
      if (cmd === 'fight') {
        if (req.struggle) return { type: 'move', moveIdx: 0, struggle: true };
        const mv = await this.waitMenu(new MoveMenu(this, req, bt, mon));
        if (mv === null) continue;
        const m = G.MOVES[req.moves[mv.idx].id];
        let target = null;
        if (req.doubles && (m.target === 'normal' || m.target === 'ally')) {
          target = await this.waitMenu(new TargetMenu(this, req, bt, m));
          if (target === null) continue;
        }
        return { type: 'move', moveIdx: mv.idx, target, resonate: mv.resonate };
      }
      if (cmd === 'bag') {
        if (!req.canItem) { await this.message(bt && !bt.wild && bt.rules.noItems ? 'Items can\'t be used in trainer battles under your challenge rules!' : 'You can\'t use items right now.', { wait: 40 }); continue; }
        const r = await G.openBag({ mode: 'battle', wild: bt ? bt.wild : true, req });
        if (!r) continue;
        const it = G.ITEMS[r.item];
        let targetRef = null;
        if (it.ball && bt && bt.active(1).length > 1) { targetRef = await this.waitMenu(new TargetMenu(this, req, bt, { target: 'normal', ball: true })); if (targetRef === null) continue; }
        G.bag.remove(r.item);
        return { type: 'item', item: r.item, target: r.target, moveIdx: r.moveIdx, targetRef };
      }
      if (cmd === 'party') {
        const idx = await G.openParty({ mode: 'battle', canCancel: true, req, exclude: [...this.pendingSwitch], activeUids: this.activeUids(bt) });
        if (idx === null || idx < 0) continue;
        if (!req.canSwitch) { await this.message('It can\'t be switched out!', { wait: 36 }); continue; }
        return { type: 'switch', to: idx };
      }
      if (cmd === 'run') {
        if (!req.canRun) { await this.message('No! There\'s no running from a trainer battle!', { wait: 40 }); continue; }
        return { type: 'run' };
      }
    }
  };
  BS.activeUids = function (bt) { return bt ? bt.active(this.persp).map(b => b.mon.uid) : Object.values(this.slots).filter(s => s.side === this.persp).map(s => s.uid); };
  BS.findMonByUid = function (bt, uid) {
    if (bt) for (const S of bt.sides) for (const t of S.trainers) for (const m of t.party) if (m.uid === uid) return m;
    return G.party.allMons().find(m => m.uid === uid);
  };
  BS.chooseSwitch = async function (bt, req) {
    await this.flushText();
    const idx = await G.openParty({ mode: 'battle', forced: true, canCancel: false, activeUids: this.activeUids(bt), reason: req.reason });
    return idx;
  };
  BS.offerSwitch = async function (bt, req) {
    const yes = await G.yesno(`The foe is about to send in ${req.foe}. Will you switch your mon?`);
    if (!yes) return -1;
    const idx = await G.openParty({ mode: 'battle', canCancel: true, activeUids: this.activeUids(bt) });
    return idx === null ? -1 : idx;
  };
  BS.learnMove = async function (bt, mon, moveId) { return G.teachMoveUI(mon, moveId, { battle: true }); };
  BS.flushText = async function () { await G.nextFrame(); };

  // ------------------------------------------------------------ menus
  class CmdMenu {
    constructor(sc, req, name, canBack, bt) { this.sc = sc; this.req = req; this.name = name; this.canBack = canBack; this.i = sc.cmdIndex || 0; this.t = 0; this.bt = bt; }
    update() {
      const I = G.input; this.t++;
      const i = this.i;
      if (I.repeat('left') || I.repeat('right')) { this.i = i ^ 1; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('up') || I.repeat('down')) { this.i = i ^ 2; G.audio && G.audio.sfx('cursor'); }
      if (I.pressed('l')) { I.consume('l'); G.openBattleInfo(this.sc); return; }
      if (I.pressed('a')) { I.consume('a'); G.audio && G.audio.sfx('select'); this.sc.cmdIndex = this.i; this.done(CMDS[this.i].id); }
      else if (I.pressed('b')) { I.consume('b'); if (this.canBack) { G.audio && G.audio.sfx('back'); this.done('back'); } else if (this.i !== 3 && this.req.canRun) { this.i = 3; G.audio && G.audio.sfx('cursor'); } }
    }
    draw() {
      const U = G.ui;
      U.panel(6, G.H - 50, 214, 45, 'dark', { r: 5 });
      U.text('What will', 16, G.H - 43, { size: 8.4, color: '#dfe8f8', weight: 600 });
      U.text(this.name + ' do?', 16, G.H - 31, { size: 8.4, color: '#ffffff', weight: 800 });
      U.text('Q: Battle info', 212, G.H - 13, { size: 4.8, color: '#8a9ab8', align: 'right' });
      U.hot(150, G.H - 17, 66, 9, null, () => G.input.tap('l'));
      CMDS.forEach((c, k) => {
        const x = 224 + (k % 2) * 78, y = G.H - 50 + Math.floor(k / 2) * 23, sel = this.i === k;
        const dis = (c.id === 'run' && !this.req.canRun) || (c.id === 'bag' && !this.req.canItem);
        U.hot(x, y, 76, 21, () => { if (this.i !== k) { this.i = k; G.audio && G.audio.sfx('cursor'); } }, () => { this.i = k; G.input.tap('a'); });
        U.panel(x, y + (sel ? -1 : 0), 76, 21, dis ? 'dark' : c.th, { r: 5, alpha: dis ? .55 : 1 });
        if (sel) { U.rrect(x - 1, y - 2, 78, 23, 6); U.c.lineWidth = G.gfx.S * 1.2; U.c.strokeStyle = '#ffffff'; U.c.stroke(); }
        U.text(c.label, x + 38, y + 5.5 + (sel ? -1 : 0), { size: 8.6, weight: 900, color: '#fff', align: 'center', shadow: 'rgba(0,0,0,.35)' });
      });
    }
  }
  class MoveMenu {
    constructor(sc, req, bt, mon) { this.sc = sc; this.req = req; this.bt = bt; this.mon = mon; this.i = Math.min(sc.moveIndex || 0, req.moves.length - 1); this.res = false; }
    update() {
      const I = G.input, n = this.req.moves.length;
      const move = (to) => { if (to >= 0 && to < n) { this.i = to; G.audio && G.audio.sfx('cursor'); } };
      if (I.repeat('left')) move(this.i ^ 1); if (I.repeat('right')) move(this.i ^ 1);
      if (I.repeat('up')) move(this.i ^ 2); if (I.repeat('down')) move(this.i ^ 2);
      if (I.pressed('r') && this.req.canResonate) { I.consume('r'); this.res = !this.res; G.audio && G.audio.sfx(this.res ? 'resonate_on' : 'back'); }
      if (I.pressed('l')) { I.consume('l'); G.openBattleInfo(this.sc); return; }
      if (I.pressed('a')) {
        I.consume('a');
        const mv = this.req.moves[this.i];
        if (mv.dis) { G.audio && G.audio.sfx('buzz'); G.toast(mv.dis, { life: 110 }); return; }
        G.audio && G.audio.sfx('select'); this.sc.moveIndex = this.i; this.done({ idx: this.i, resonate: this.res });
      }
      if (I.pressed('b')) { I.consume('b'); G.audio && G.audio.sfx('back'); this.done(null); }
    }
    target() {
      if (!this.bt) return null;
      const foes = this.bt.active(1 - this.sc.persp); return foes.length === 1 ? foes[0] : null;
    }
    draw() {
      const U = G.ui;
      this.req.moves.forEach((mv, k) => {
        const m = G.MOVES[mv.id], x = 6 + (k % 2) * 130, y = G.H - 50 + Math.floor(k / 2) * 23, sel = this.i === k;
        const col = G.TYPE_COLORS[m.type];
        U.hot(x, y, 128, 21, () => { if (this.i !== k) { this.i = k; G.audio && G.audio.sfx('cursor'); } }, () => { this.i = k; G.input.tap('a'); });
        U.rrect(x, y, 128, 21, 5);
        const g = U.c.createLinearGradient(0, U.Y(y), 0, U.Y(y + 21)); g.addColorStop(0, G.col.light(col, sel ? .35 : .2)); g.addColorStop(1, G.col.dark(col, sel ? .05 : .2));
        U.c.fillStyle = g; U.c.fill(); U.c.lineWidth = G.gfx.S * (sel ? 1.3 : .8); U.c.strokeStyle = sel ? '#ffffff' : G.col.dark(col, .5); U.c.stroke();
        U.text(m.name, x + 7, y + 3, { size: 7.6, weight: 800, color: '#fff', shadow: 'rgba(0,0,0,.4)' });
        const ppc = mv.pp === 0 ? '#ffb0b0' : mv.pp <= mv.maxpp / 4 ? '#ffe08a' : '#eef4ff';
        U.text(`PP ${mv.pp}/${mv.maxpp}`, x + 121, y + 12.3, { size: 5.6, weight: 800, color: ppc, align: 'right', shadow: 'rgba(0,0,0,.4)' });
        const t = this.target();
        if (t && m.cat !== 'status' && G.settings.hints && G.save && G.save.dex.seen[t.mon.sp]) {
          const eff = this.bt.effectiveness(m, this.bt.at(this.req.ref.s, this.req.ref.i) || t, t);
          const lbl = eff === 0 ? 'No effect' : eff > 1 ? 'Super effective' : eff < 1 ? 'Not very effective' : '';
          if (lbl) U.text(lbl, x + 7, y + 12.8, { size: 5, weight: 800, color: eff === 0 ? '#d0d0d8' : eff > 1 ? '#c8ffb0' : '#ffd0c0', shadow: 'rgba(0,0,0,.45)' });
        }
        if (mv.dis) { U.rrect(x, y, 128, 21, 5); U.c.fillStyle = 'rgba(20,20,30,.5)'; U.c.fill(); }
      });
      // info panel
      const mv = this.req.moves[this.i], m = G.MOVES[mv.id];
      const px = 266, py = G.H - 50;
      U.panel(px, py, 112, 45, 'light', { r: 5 });
      U.typeBadge(m.type, px + 6, py + 5, 32, 9); U.catBadge(m.cat, px + 41, py + 5);
      U.text('Pow ' + (m.pow > 1 ? m.pow : '—'), px + 6, py + 18, { size: 6.2, weight: 700 });
      U.text('Acc ' + (m.acc === true ? '—' : m.acc), px + 58, py + 18, { size: 6.2, weight: 700 });
      if (m.pri) U.text((m.pri > 0 ? '+' : '') + m.pri + ' priority', px + 6, py + 27, { size: 5.4, weight: 800, color: '#3b82e0' });
      const t = this.target(), user = this.bt ? this.bt.at(this.req.ref.s, this.req.ref.i) : null;
      if (G.settings.dmgPreview && t && user && m.cat !== 'status') {
        const lo = this.bt.calcDamage(user, t, m, { crit: false, roll: .85 }).dmg, hi = this.bt.calcDamage(user, t, m, { crit: false, roll: 1 }).dmg;
        const pl = Math.min(100, Math.round(lo / t.maxhp * 100)), ph = Math.min(100, Math.round(hi / t.maxhp * 100));
        U.text(`≈ ${pl}–${ph}% dmg`, px + 6, py + 35, { size: 5.6, weight: 800, color: ph >= t.hp / t.maxhp * 100 ? '#e8484a' : '#2aa86a' });
      } else U.text(G.ui.wrap(m.desc, 100, 4.6)[0] || '', px + 6, py + 36, { size: 4.6, weight: 600, color: '#5a6070' });
      if (this.req.canResonate) {
        const on = this.res, bx = 266, by = G.H - 66;
        U.hot(bx, by, 112, 13, null, () => G.input.tap('r'));
        U.panel(bx, by, 112, 13, on ? 'teal' : 'dark', { r: 4 });
        if (on) { U.rrect(bx - 1, by - 1, 114, 15, 5); U.c.lineWidth = G.gfx.S * (1 + .5 * Math.sin(G.realTime * 8)); U.c.strokeStyle = '#bffff4'; U.c.stroke(); }
        U.text((on ? '✦ RESONATING ✦' : '✦ Resonate') + '  [R]', bx + 56, by + 3, { size: 5.8, weight: 800, color: '#fff', align: 'center' });
      }
    }
  }
  class TargetMenu {
    constructor(sc, req, bt, m) {
      this.sc = sc; this.req = req; this.bt = bt; this.m = m;
      const foes = bt.active(1 - sc.persp).map(b => b.ref()), allies = bt.active(sc.persp).filter(b => !(b.side === req.ref.s && b.slot === req.ref.i)).map(b => b.ref());
      this.opts = m.target === 'ally' ? allies : m.ball ? foes : [...foes, ...allies];
      if (!this.opts.length) this.opts = foes;
      this.i = 0;
    }
    update() {
      const I = G.input, n = this.opts.length;
      if (I.repeat('left') || I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('right') || I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.pressed('a')) { I.consume('a'); G.audio && G.audio.sfx('select'); this.done(this.opts[this.i]); }
      if (I.pressed('b')) { I.consume('b'); G.audio && G.audio.sfx('back'); this.done(null); }
    }
    draw() {
      const U = G.ui;
      U.panel(6, G.H - 50, G.W - 12, 45, 'dark', { r: 5 });
      const r = this.opts[this.i], s = this.sc.slot(r);
      this.opts.forEach((o, k) => { const q = this.sc.slot(o); if (q) U.hot(q.x - 30, q.y - 70 * q.sc, 60, 70 * q.sc, () => { this.i = k; }, () => { this.i = k; G.input.tap('a'); }); });
      U.text('Choose a target:', 16, G.H - 43, { size: 8, color: '#dfe8f8' });
      if (s) {
        U.text((r.s === this.sc.persp ? 'Ally ' : '') + s.name, 16, G.H - 30, { size: 9, color: '#fff', weight: 800 });
        const bob = Math.sin(G.realTime * 8) * 1.5;
        const x = s.x, y = s.y - 70 * s.sc + bob;
        U.c.fillStyle = '#ffd35c'; U.c.beginPath(); U.c.moveTo(U.X(x - 5), U.Y(y - 6)); U.c.lineTo(U.X(x + 5), U.Y(y - 6)); U.c.lineTo(U.X(x), U.Y(y)); U.c.fill();
      }
    }
  }
  // ------------------------------------------------------------ info panel
  G.openBattleInfo = function (sc) {
    return new Promise(res => G.push({
      lowres: false, t: 0,
      update(top) { if (!top) return; this.t++; if (G.input.pressed('b') || G.input.pressed('l') || G.input.pressed('a')) { G.input.consume('b'); G.input.consume('l'); G.input.consume('a'); G.pop(this); res(); } },
      drawUI() {
        const U = G.ui; U.panel(20, 14, G.W - 40, 150, 'glass', { r: 6 });
        U.text('Battle Info', G.W / 2, 20, { size: 9, color: '#fff', weight: 800, align: 'center' });
        const bt = sc.bt;
        let y = 34;
        if (bt) {
          const w = bt.weather ? G.cap(bt.weather) + (bt.weatherTurns > 0 ? ` (${bt.weatherTurns} turns)` : '') : 'Clear';
          U.text(`Turn ${bt.turn}   ·   Weather: ${w}${bt.trickRoom ? '   ·   Twist Room ' + bt.trickRoom : ''}`, 30, y, { size: 6, color: '#bcd' }); y += 12;
          for (const b of bt.allActive()) {
            const st = Object.entries(b.stages).filter(([, v]) => v).map(([k, v]) => `${G.STAT_SHORT[k] || k} ${v > 0 ? '+' : ''}${v}`).join('  ');
            const tag = b.side === sc.persp ? '' : (bt.wild ? 'Wild ' : 'Foe ');
            U.text(`${tag}${b.name}  Lv${b.lvl}`, 30, y, { size: 6.8, color: b.side === sc.persp ? '#9fd0ff' : '#ffb0a8', weight: 800 });
            const known = b.side === sc.persp || (G.save && G.save.dex.caught[b.mon.sp]);
            U.text(`${b.types.map(G.cap).join('/')}  ·  ${known ? (G.ABILITIES[b.ability] || {}).name : 'Ability ?'}${b.item && b.side === sc.persp ? '  ·  @' + G.ITEMS[b.item].name : ''}`, 130, y + .6, { size: 5.6, color: '#dde' });
            U.text(st || 'No stat changes', 30, y + 9, { size: 5.6, color: st ? '#ffe08a' : '#889' });
            const vol = []; if (b.vol.confused) vol.push('Confused'); if (b.vol.seeded) vol.push('Seeded'); if (b.vol.taunt) vol.push('Taunted'); if (b.vol.sub) vol.push('Decoy'); if (b.resonant) vol.push('Resonating'); if (b.vol.choice) vol.push('Locked: ' + G.MOVES[b.vol.choice].name);
            if (vol.length) U.text(vol.join(' · '), 200, y + 9, { size: 5.6, color: '#bfffd8' });
            y += 22;
          }
          for (const S of bt.sides) {
            const bits = []; for (const [k, v] of Object.entries(S.cond)) if (v) bits.push(`${({ reflect: 'Reflect', lightscreen: 'Light Screen', tailwind: 'Tailwind', veil: 'Aurora Veil' })[k]} ${v}`);
            for (const [k, v] of Object.entries(S.hazards)) if (v) bits.push(({ rocks: 'Shard Trap', spikes: 'Spikes', tspikes: 'Venom Spikes', web: 'Sticky Web' })[k] + (v > 1 ? ' ×' + v : ''));
            if (bits.length) { U.text((S.idx === sc.persp ? 'Your side: ' : 'Foe side: ') + bits.join(', '), 30, y, { size: 5.6, color: '#cde' }); y += 10; }
          }
        } else U.text('Info is shown on the host\'s screen during link battles.', 30, y, { size: 6, color: '#bcd' });
        U.text('Press X to close', G.W / 2, 154, { size: 5.5, color: '#8a9ab8', align: 'center' });
      },
    }));
  };
})();
