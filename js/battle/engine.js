'use strict';
// ============================================================================
//  Battle engine. Pure rules + async controller requests. Emits declarative
//  events that any number of displays (local scene, network guest) animate.
// ============================================================================
(function () {
  const stageMult = s => s >= 0 ? (2 + s) / 2 : 2 / (2 - s);
  const accMult = s => s >= 0 ? (3 + s) / 3 : 3 / (3 - s);
  const CRIT = [1 / 24, 1 / 8, 1 / 2, 1];
  const STATUS_MSG = { brn: '{0} was burned!', par: '{0} is paralyzed! It may be unable to move!', psn: '{0} was poisoned!', tox: '{0} was badly poisoned!', slp: '{0} fell asleep!', frz: '{0} was frozen solid!' };
  const STATUS_HAS = { brn: '{0} is already burned.', par: '{0} is already paralyzed.', psn: '{0} is already poisoned.', tox: '{0} is already poisoned.', slp: '{0} is already asleep.', frz: '{0} is already frozen.' };
  const WEATHER_MSG = {
    sun: ['The sunlight turned harsh!', 'The sunlight is strong.', 'The harsh sunlight faded.'],
    rain: ['It started to rain!', 'Rain continues to fall.', 'The rain stopped.'],
    sand: ['A sandstorm kicked up!', 'The sandstorm is raging.', 'The sandstorm subsided.'],
    snow: ['It started to snow!', 'Snow continues to fall.', 'The snow stopped.'],
  };

  class Battler {
    constructor(bt, side, slot, owner, mon, partyIdx) {
      this.bt = bt; this.side = side; this.slot = slot; this.owner = owner; this.mon = mon; this.partyIdx = partyIdx;
      this.stats = G.mon.stats(mon);
      this.stages = { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, acc: 0, eva: 0 };
      this.vol = {}; this.types = G.SPECIES[mon.sp].types.slice();
      this.ability = G.mon.ability(mon);
      this.turnsOut = 0; this.active = true; this.fainted = mon.hp <= 0;
      this.lastMove = null; this.movedThisTurn = false; this.resonant = false;
    }
    get hp() { return this.mon.hp; } set hp(v) { this.mon.hp = Math.max(0, Math.min(this.maxhp, Math.round(v))); }
    get maxhp() { return this.stats.hp; }
    get status() { return this.mon.status; } set status(v) { this.mon.status = v; }
    get item() { return this.mon.item; } set item(v) { this.mon.item = v; }
    get name() { return G.mon.name(this.mon); }
    get ab() { return G.ABILITIES[this.ability] || {}; }
    get it() { return this.item ? G.ITEMS[this.item] : null; }
    get sp() { return G.SPECIES[this.mon.sp]; }
    get lvl() { return this.mon.lvl; }
    abilityHas(flag) { return !!this.ab[flag]; }
    ref() { return { s: this.side, i: this.slot }; }
    refreshStats() { const f = this.hp; this.stats = G.mon.stats(this.mon); this.hp = f; }
    hasType(t) { return this.types.includes(t); }
  }
  G.Battler = Battler;

  G.Battle = class Battle {
    constructor(o) {
      this.o = o;
      this.format = o.format || 'single';
      this.nSlots = this.format === 'double' ? 2 : 1;
      this.wild = !!o.wild;
      this.rules = o.rules || {};
      this.env = o.env || 'grass';
      this.sides = [0, 1].map(i => {
        const trainers = o.sides[i].trainers;
        const owners = trainers.length >= 2 ? [0, 1] : new Array(this.nSlots).fill(0);
        return { idx: i, trainers, owners, slots: new Array(this.nSlots).fill(null), cond: {}, hazards: { rocks: 0, spikes: 0, tspikes: 0, web: 0 }, resUsed: {} };
      });
      this.weather = o.weather || null; this.weatherTurns = o.weather ? -1 : 0;
      this.trickRoom = 0; this.turn = 0; this.events = []; this.displays = o.displays || [];
      this.ended = false; this.result = null; this.participants = {};
      this.expLog = []; this.runAttempts = 0; this.caught = null; this.faintOrder = [];
      this.leveled = new Set(); this.faintedUids = new Set(); this.knocked = [];
      this.moveOrder = [];
    }
    // ---------------------------------------------------------- utilities
    emit(e) { this.events.push(e); }
    async flush() {
      if (!this.events.length) return;
      const ev = this.events; this.events = [];
      await Promise.all(this.displays.map(d => d.play(ev, this)));
    }
    nref(b) { return { s: b.side, name: b.name, wild: this.wild && b.side === 1 && !this.sides[1].trainers[0].name }; }
    say(f, ...bs) { this.emit({ t: 'msg', f, r: bs.map(b => this.nref(b)) }); }
    raw(text) { this.emit({ t: 'msg', f: text, r: [] }); }
    trainerOf(b) { return this.sides[b.side].trainers[b.owner]; }
    tname(tr) { return tr.cls ? tr.cls + ' ' + tr.name : tr.name; }
    popup(b) { this.emit({ t: 'popup', ref: b.ref(), side: b.side, name: b.name, ability: G.ABILITIES[b.ability] ? G.ABILITIES[b.ability].name : b.ability }); }
    active(side) { return this.sides[side].slots.filter(b => b && !b.fainted); }
    allActive() { return [...this.active(0), ...this.active(1)]; }
    foes(b) { return this.active(1 - b.side); }
    allies(b) { return this.active(b.side).filter(x => x !== b); }
    at(s, i) { const b = this.sides[s].slots[i]; return b && !b.fainted ? b : null; }
    abHook(b, hook, ...args) { const a = b.ab; return a[hook] ? a[hook](this, ...args) : undefined; }
    partyOf(side, owner) { return this.sides[side].trainers[owner].party; }
    bench(side, owner) {
      const party = this.partyOf(side, owner);
      const act = this.sides[side].slots.filter(Boolean).map(b => b.mon);
      return party.map((m, i) => ({ m, i })).filter(x => x.m.hp > 0 && !x.m.dead && !act.includes(x.m) && !x.m.egg);
    }
    ableCount(side) {
      let n = 0; const S = this.sides[side];
      for (const t of S.trainers) for (const m of t.party) if (m.hp > 0 && !m.dead) n++;
      return n;
    }
    fieldAura(type) { return this.allActive().some(b => b.ab.fieldAura === type); }
    grounded(b) { return !b.hasType('flying') && !b.abilityHas('levitate'); }
    speed(b) {
      let s = b.stats.spe * stageMult(b.stages.spe);
      const am = this.abHook(b, 'speMod', b); if (am) s *= am;
      if (b.item === 'swiftscarf') s *= 1.5;
      if (b.status === 'par') s *= .5;
      if (this.sides[b.side].cond.tailwind) s *= 2;
      return s;
    }
    // --------------------------------------------------- HP / status API
    heal(b, amt, msg, ...extra) {
      if (b.fainted || b.hp >= b.maxhp) return false;
      const before = b.hp; b.hp = b.hp + Math.max(1, Math.floor(amt));
      this.emit({ t: 'hp', ref: b.ref(), hp: b.hp, max: b.maxhp, heal: true });
      if (msg) this.say(msg, b, ...extra); else if (msg !== false) this.say('{0} had its HP restored.', b);
      return b.hp > before;
    }
    damage(b, amt, msg) {
      if (b.fainted || b.abilityHas('magicGuard')) return 0;
      if (this.o.godPlayer && b.side === 0) return 0;
      const d = Math.min(b.hp, Math.max(1, Math.floor(amt)));
      if (msg) this.say(msg, b);
      b.hp = b.hp - d;
      this.emit({ t: 'hp', ref: b.ref(), hp: b.hp, max: b.maxhp });
      return d;
    }
    canStatus(t, st, src) {
      if (!t || t.fainted || t.status) return false;
      if (st === 'brn' && t.hasType('fire')) return false;
      if (st === 'par' && t.hasType('electric')) return false;
      if ((st === 'psn' || st === 'tox') && (t.hasType('poison') || t.hasType('steel'))) return false;
      if (st === 'frz' && (t.hasType('ice') || this.weather === 'sun')) return false;
      if (this.abHook(t, 'statusImmune', t, st)) return false;
      if (src && src !== t && t.vol.sub) return false;
      return true;
    }
    setStatus(t, st, src) {
      t.status = st; t.vol.toxN = 0;
      if (st === 'slp') t.mon.slp = G.randInt(1, 3);
      this.emit({ t: 'status', ref: t.ref(), status: st });
      this.say(STATUS_MSG[st], t);
      if (st === 'par' && t.abilityHas('menaceImmune')) { /* no-op */ }
      if (t.abilityHas('synchronize') && src && src !== t && ['brn', 'par', 'psn', 'tox'].includes(st) && this.canStatus(src, st === 'tox' ? 'psn' : st)) {
        this.popup(t); this.setStatus(src, st === 'tox' ? 'psn' : st, null);
      }
      this.checkBerry(t);
    }
    cureStatus(b, msg) {
      if (!b.status) return;
      b.status = null; b.mon.slp = 0;
      this.emit({ t: 'status', ref: b.ref(), status: null });
      if (msg) this.say(msg, b);
    }
    boost(b, ch, src, o = {}) {
      let any = false, dropped = false;
      for (const k in ch) {
        const v = ch[k]; if (!v) continue;
        if (v < 0 && src && src.side !== b.side) {
          const blk = this.abHook(b, 'statDropBlock', b, k, src);
          if (blk) { this.popup(b); this.say(`{0}'s ${G.STAT_NAMES[k]} was not lowered!`, b); continue; }
        }
        const cur = b.stages[k], nv = G.clamp(cur + v, -6, 6);
        if (nv === cur) { this.say(`{0}'s ${G.STAT_NAMES[k]} won't go any ${v > 0 ? 'higher' : 'lower'}!`, b); continue; }
        b.stages[k] = nv; any = true;
        const d = nv - cur;
        this.emit({ t: 'stat', ref: b.ref(), stat: k, d });
        const word = d > 0 ? (d >= 3 ? 'rose drastically' : d === 2 ? 'rose sharply' : 'rose') : (d <= -3 ? 'severely fell' : d === -2 ? 'harshly fell' : 'fell');
        this.say(`{0}'s ${G.STAT_NAMES[k]} ${word}!`, b);
        if (d < 0 && src && src.side !== b.side) dropped = true;
      }
      if (dropped && b.ab.onStatDropped && !b.fainted) b.ab.onStatDropped(this, b);
      return any;
    }
    setWeather(w, src, turns = 5) {
      if (this.weather === w) return false;
      this.weather = w; this.weatherTurns = turns;
      this.emit({ t: 'weather', w });
      this.raw(WEATHER_MSG[w][0]);
      return true;
    }
    checkBerry(b) {
      const it = b.it; if (!it || !it.berry || b.fainted) return;
      if (it.berry === 'hp' && b.hp > 0 && b.hp <= b.maxhp / 2) {
        this.emit({ t: 'item', ref: b.ref(), item: it.id });
        b.item = null; this.heal(b, it.healPct ? b.maxhp * it.healPct : it.heal, `{0} restored HP using its ${it.name}!`);
      } else if (it.berry === 'status' && (b.status || b.vol.confused)) {
        const cure = it.cure === 'all' || (b.status && it.cure.includes(b.status));
        if (cure) {
          this.emit({ t: 'item', ref: b.ref(), item: it.id }); b.item = null;
          if (it.cure === 'all' && b.vol.confused) b.vol.confused = 0;
          this.cureStatus(b, `{0}'s ${it.name} cured its condition!`);
        }
      }
    }
    // ------------------------------------------------------ effectiveness
    effectiveness(m, b, t) {
      if (m.fx === 'struggle') return 1;
      if (m.type === 'ground' && !this.grounded(t) && t.hasType('flying') === false) return 0; // levitate
      let mult = 1;
      for (const ty of t.types) {
        let e = G.typeEff(m.type, ty);
        if (e === 0 && ty === 'ghost' && (m.type === 'normal' || m.type === 'fighting') && b && b.abilityHas('scrappy')) e = 1;
        if (m.fx === 'freezedry' && ty === 'water') e = 2;
        mult *= e;
      }
      return mult;
    }
    // ------------------------------------------------------ damage calc
    basePower(b, t, m) {
      let p = m.pow;
      switch (m.fx) {
        case 'facade': if (b.status && b.status !== 'slp' && b.status !== 'frz') p *= 2; break;
        case 'hex': if (t.status) p *= 2; break;
        case 'venoshock': if (t.status === 'psn' || t.status === 'tox') p *= 2; break;
        case 'acrobatics': if (!b.item) p *= 2; break;
        case 'payback': if (t.movedThisTurn) p *= 2; break;
        case 'bond': p = G.clamp(Math.floor(b.mon.bond / 2.5), 1, 102); break;
        case 'storedpower': p = 20 + 20 * Object.values(b.stages).reduce((a, s) => a + Math.max(0, s), 0); break;
        case 'knockoff': if (t.item && !t.vol.sub) p *= 1.5; break;
        case 'solar': if (this.weather && this.weather !== 'sun') p /= 2; break;
      }
      const it = b.it;
      if (it && it.boostType === m.type) p *= 1.2;
      const am = this.abHook(b, 'powMod', b, m, t, p); if (am) p *= am;
      if (b.vol.helped) p *= 1.5;
      if (m.type === 'dark' && this.fieldAura('dark')) p *= 1.33;
      return p;
    }
    critRoll(b, t, m) {
      if (t.abilityHas('critImmune')) return false;
      let st = (m.crit || 0) + (b.vol.focus || 0) + (b.ab.critBonus || 0) + (b.item === 'scopelens' ? 1 : 0);
      return G.rand() < CRIT[Math.min(3, st)];
    }
    calcDamage(b, t, m, o = {}) {
      if (m.fx === 'level') return { dmg: b.lvl, crit: false, eff: this.effectiveness(m, b, t) };
      const eff = o.eff !== undefined ? o.eff : this.effectiveness(m, b, t);
      if (eff === 0) return { dmg: 0, eff, crit: false };
      const pow = this.basePower(b, t, m);
      const phys = m.cat === 'phys' || m.fx === 'struggle';
      const aStat = phys ? 'atk' : 'spa';
      const dStat = phys || m.fx === 'psyshock' ? 'def' : 'spd';
      const crit = o.crit !== undefined ? o.crit : this.critRoll(b, t, m);
      const src = m.fx === 'foulplay' ? t : b;
      let aSt = src.stages[aStat], dSt = t.stages[dStat];
      if (t.abilityHas('unaware')) aSt = 0;
      if (b.abilityHas('unaware')) dSt = 0;
      if (crit) { aSt = Math.max(0, aSt); dSt = Math.min(0, dSt); }
      let A = src.stats[aStat] * stageMult(aSt);
      let D = t.stats[dStat] * stageMult(dSt);
      const am = this.abHook(src, 'atkMod', src, aStat, m); if (am) A *= am;
      if (src.item === 'powerband' && aStat === 'atk') A *= 1.5;
      if (src.item === 'focuslens' && aStat === 'spa') A *= 1.5;
      const dm = this.abHook(t, 'defMod', t, dStat, m); if (dm) D *= dm;
      if (this.weather === 'sand' && t.hasType('rock') && dStat === 'spd') D *= 1.5;
      if (this.weather === 'snow' && t.hasType('ice') && dStat === 'def') D *= 1.5;
      if (t.item === 'guardvest' && dStat === 'spd') D *= 1.5;
      if (t.item === 'evocrystal' && t.sp.evo.length) D *= 1.5;
      let dmg = Math.floor(Math.floor(Math.floor(2 * b.lvl / 5 + 2) * pow * A / D) / 50) + 2;
      if (o.spread) dmg *= .75;
      if (this.weather === 'sun') { if (m.type === 'fire') dmg *= 1.5; else if (m.type === 'water') dmg *= .5; }
      if (this.weather === 'rain') { if (m.type === 'water') dmg *= 1.5; else if (m.type === 'fire') dmg *= .5; }
      if (crit) dmg *= 1.5;
      dmg *= o.roll !== undefined ? o.roll : (85 + G.randInt(0, 15)) / 100;
      if (m.fx !== 'struggle' && b.hasType(m.type)) {
        let stab = b.ab.stab || 1.5;
        if (b.resonant && m.type === b.types[0]) stab = stab >= 2 ? 2.25 : 2;
        dmg *= stab;
      }
      dmg *= eff;
      if (phys && b.status === 'brn' && !b.abilityHas('gutsBurn') && m.fx !== 'facade') dmg *= .5;
      const sc = this.sides[t.side].cond;
      if (!crit && m.fx !== 'brickbreak') {
        const scr = (phys && (sc.reflect || sc.veil)) || (!phys && (sc.lightscreen || sc.veil));
        if (scr) dmg *= this.nSlots > 1 ? 2 / 3 : .5;
      }
      const tm = this.abHook(t, 'dmgTakenMod', t, b, m, eff); if (tm) dmg *= tm;
      const sm = this.abHook(b, 'dmgDealtMod', b, t, m, eff); if (sm) dmg *= sm;
      if (b.item === 'lifegem') dmg *= 1.3;
      if (b.item === 'expertbelt' && eff > 1) dmg *= 1.2;
      let shield = false;
      if (t.resonant && t.vol.resShield && eff > 1) { dmg *= .5; shield = true; }
      return { dmg: Math.max(1, Math.floor(dmg)), crit, eff, shield };
    }
    // for AI: expected damage (no randomness, no crit)
    estimate(b, t, m) {
      if (m.cat === 'status') return 0;
      if (t.ab.tryHit && m.type && ['absorbent', 'voltsponge', 'flashfire', 'herbivore', 'lightningrod'].includes(t.ability)) {
        const map = { absorbent: 'water', voltsponge: 'electric', flashfire: 'fire', herbivore: 'grass', lightningrod: 'electric' };
        if (map[t.ability] === m.type) return 0;
      }
      if (m.sound && t.ability === 'soundproof') return 0;
      if (m.fx === 'level') return this.effectiveness(m, b, t) ? b.lvl : 0;
      const r = this.calcDamage(b, t, m, { crit: false, roll: .925 });
      let d = r.dmg * (m.multi ? (m.multi[0] + m.multi[1]) / 2 : 1);
      const acc = m.acc === true ? 1 : m.acc / 100;
      return d * acc;
    }
    // -------------------------------------------------------- lifecycle
    async run() {
      await this.start();
      while (!this.ended) {
        this.turn++;
        for (const b of this.allActive()) { b.movedThisTurn = false; }
        this.markParticipants();
        const actions = await this.collectActions();
        if (this.ended) break;
        await this.resolveTurn(actions);
        if (this.ended) break;
        await this.endOfTurn();
        if (this.ended) break;
        await this.replaceFainted();
        this.emit({ t: 'state', snap: this.snapshot() });
      }
      await this.flush();
      return this.result;
    }
    snapshot() {
      const out = [];
      for (const S of this.sides) S.slots.forEach((b, i) => { if (b) out.push({ s: S.idx, i, hp: b.hp, max: b.maxhp, status: b.status, fainted: b.fainted, uid: b.mon.uid }); });
      return { weather: this.weather, slots: out };
    }
    async start() {
      this.emit({ t: 'intro', wild: this.wild, sides: this.sides.map(S => ({ trainers: S.trainers.map(t => ({ name: t.name, cls: t.cls, sprite: t.sprite, count: t.party.length, alive: t.party.filter(m => m.hp > 0 && !m.dead).length })) })) });
      // send out: foes first (wild appear), then player
      for (const side of [1, 0]) {
        const S = this.sides[side];
        for (let i = 0; i < this.nSlots; i++) {
          const owner = S.owners[i];
          const b = this.bench(side, owner)[0];
          if (!b) continue;
          await this.switchIn(side, i, owner, b.i, { initial: true });
        }
      }
      if (this.weather && this.weatherTurns === -1) { this.emit({ t: 'weather', w: this.weather }); this.raw(WEATHER_MSG[this.weather][1]); }
      await this.flush();
      // entry abilities in speed order
      const order = this.allActive().sort((a, b) => this.speed(b) - this.speed(a));
      for (const b of order) if (!b.fainted) this.abHook(b, 'onStart', b);
      this.markParticipants();
      await this.flush();
    }
    markParticipants() {
      const mine = this.active(0), theirs = this.active(1);
      for (const f of theirs) {
        const set = this.participants[f.mon.uid] || (this.participants[f.mon.uid] = new Set());
        for (const p of mine) set.add(p.mon.uid);
      }
    }
    async switchIn(side, slot, owner, partyIdx, o = {}) {
      const S = this.sides[side], tr = S.trainers[owner];
      const mon = tr.party[partyIdx];
      const b = new Battler(this, side, slot, owner, mon, partyIdx);
      S.slots[slot] = b;
      this.emit({ t: 'send', ref: b.ref(), mon: G.mon.info(mon), owner, trainer: tr.name ? { name: tr.name, cls: tr.cls, isPlayer: tr.isPlayer } : null, wild: this.wild && side === 1, initial: !!o.initial });
      if (!o.initial) {
        this.applyHazards(b);
        if (!b.fainted) this.abHook(b, 'onStart', b);
        this.markParticipants();
      }
      return b;
    }
    applyHazards(b) {
      const H = this.sides[b.side].hazards;
      if (H.rocks) {
        const eff = G.typeEffMulti('rock', b.types);
        this.damage(b, b.maxhp * eff / 8, 'Pointed shards dug into {0}!');
      }
      if (this.grounded(b)) {
        if (H.spikes) this.damage(b, b.maxhp * [0, 1 / 8, 1 / 6, 1 / 4][H.spikes], '{0} was hurt by the spikes!');
        if (H.tspikes) {
          if (b.hasType('poison')) { H.tspikes = 0; this.say('{0} absorbed the venom spikes!', b); this.emit({ t: 'hazard', side: b.side, kind: 'tspikes', n: 0 }); }
          else if (this.canStatus(b, 'psn')) this.setStatus(b, H.tspikes >= 2 ? 'tox' : 'psn', null);
        }
        if (H.web) { this.say('{0} was caught in a sticky web!', b); this.boost(b, { spe: -1 }, null); }
      }
      if (b.hp <= 0) b.pendingFaint = true;
    }
    async withdraw(b, msg = true) {
      if (b.ab.onSwitchOut && !b.fainted) b.ab.onSwitchOut(this, b);
      const tr = this.trainerOf(b);
      if (msg) {
        if (tr.isPlayer) this.say('{0}, come back!', b);
        else if (tr.name) this.say(`${this.tname(tr)} withdrew {0}!`, b);
      }
      this.emit({ t: 'withdraw', ref: b.ref() });
      b.active = false;
      this.sides[b.side].slots[b.slot] = null;
    }
    async doSwitch(b, partyIdx) {
      const { side, slot, owner } = b;
      await this.withdraw(b);
      const nb = await this.switchIn(side, slot, owner, partyIdx);
      await this.processFaints();
      return nb;
    }
    // ------------------------------------------------------ requests
    ctrlOf(side, owner) { return this.sides[side].trainers[owner].controller; }
    moveOptions(b) {
      const mv = b.mon.moves.map((x, i) => {
        const m = G.MOVES[x.id]; let dis = null;
        if (x.pp <= 0) dis = 'No PP left!';
        else if (b.vol.taunt && m.cat === 'status') dis = 'It can\'t use that move after the taunt!';
        else if (b.item === 'guardvest' && m.cat === 'status') dis = 'The Guard Vest prevents status moves!';
        else if (b.vol.choice && b.vol.choice !== x.id && b.mon.moves.some(y => y.id === b.vol.choice)) dis = 'It\'s locked into its move!';
        return { id: x.id, pp: x.pp, maxpp: G.mon.maxPP(x), dis, idx: i };
      });
      return mv;
    }
    buildRequest(b) {
      const tr = this.trainerOf(b);
      const moves = this.moveOptions(b);
      const struggle = moves.every(m => m.dis);
      return {
        ref: b.ref(), uid: b.mon.uid, side: b.side, owner: b.owner, moves, struggle,
        canSwitch: this.bench(b.side, b.owner).length > 0 && !b.vol.trapped,
        canRun: this.wild && b.side === 0, canItem: !(this.rules.noItems && !this.wild) && b.side === 0 && !tr.isRemote,
        canResonate: !!tr.resonance && !this.sides[b.side].resUsed[b.owner] && !b.resonant,
        doubles: this.nSlots > 1, turn: this.turn,
      };
    }
    forcedAction(b) {
      if (b.vol.recharge) return { type: 'recharge' };
      if (b.vol.charging) return { type: 'move', moveIdx: b.vol.charging.idx, target: b.vol.charging.target, charged: true };
      if (b.vol.rampage) return { type: 'move', moveIdx: b.vol.rampage.idx, target: null, rampage: true };
      return null;
    }
    async collectActions() {
      await this.flush();
      const groups = new Map(); const acts = [];
      for (const S of this.sides) for (const b of S.slots) {
        if (!b || b.fainted) continue;
        const f = this.forcedAction(b);
        if (f) { acts.push({ ...f, b }); continue; }
        const ctrl = this.ctrlOf(b.side, b.owner);
        if (!groups.has(ctrl)) groups.set(ctrl, []);
        groups.get(ctrl).push({ b, req: this.buildRequest(b) });
      }
      const entries = [...groups.entries()];
      const res = await Promise.all(entries.map(([ctrl, list]) => ctrl.chooseActions(this, list.map(x => x.req))));
      const claimed = new Set();
      entries.forEach(([, list], gi) => list.forEach((x, k) => acts.push({ ...this.sanitize((res[gi] || [])[k], x.b, x.req, claimed), b: x.b })));
      return acts;
    }
    // Never trust a controller blindly (a remote partner's client, a stale menu): anything illegal becomes the
    // first usable move, and two slots can't both switch to the same benched mon.
    sanitize(a, b, req, claimed) {
      const first = () => { const k = req.moves.findIndex(m => !m.dis); return k < 0 ? { type: 'move', moveIdx: 0, struggle: true } : { type: 'move', moveIdx: k, target: null }; };
      if (!a || typeof a !== 'object') return first();
      switch (a.type) {
        case 'switch': {
          const key = b.side + ':' + b.owner + ':' + a.to;
          if (!req.canSwitch || claimed.has(key) || !this.bench(b.side, b.owner).some(x => x.i === a.to)) return first();
          claimed.add(key); return a;
        }
        case 'run': return req.canRun ? a : first();
        case 'item': { const tr = this.trainerOf(b); return req.canItem || a.skip || (!tr.isPlayer && !tr.isRemote) ? a : first(); }   // AI trainers heal from their own stock
        case 'move': {
          if (a.skip) return a;
          if (req.struggle) return { type: 'move', moveIdx: 0, struggle: true };
          const mv = req.moves[a.moveIdx];
          if (!mv || mv.dis) return first();
          return a.resonate && !req.canResonate ? { ...a, resonate: false } : a;
        }
        default: return first();
      }
    }
    // ------------------------------------------------------ turn
    priorityOf(a) {
      if (a.type !== 'move') return 99;
      const b = a.b, req = b.mon.moves[a.moveIdx];
      const m = a.struggle || !req ? G.MOVES.struggle : G.MOVES[req.id];
      let p = m.pri || 0;
      const pm = this.abHook(b, 'priMod', b, m); if (pm) p += pm;
      return p;
    }
    async resolveTurn(actions) {
      // --- run
      for (const a of actions.filter(a => a.type === 'run')) {
        if (await this.tryRun(a.b)) return;
      }
      // --- switches (fastest first)
      const sw = actions.filter(a => a.type === 'switch').sort((x, y) => this.speed(y.b) - this.speed(x.b));
      for (const a of sw) {
        if (!a.b.active) continue;
        await this.doSwitch(a.b, a.to);
        if (this.checkEnd()) return;
      }
      // --- items
      for (const a of actions.filter(a => a.type === 'item')) {
        await this.useItem(a);
        if (this.ended || this.checkEnd()) return;
      }
      await this.flush();
      // --- resonance
      for (const a of actions.filter(a => a.type === 'move' && a.resonate)) {
        const b = a.b; if (!b.active || b.fainted) continue;
        const tr = this.trainerOf(b);
        if (this.sides[b.side].resUsed[b.owner]) continue;
        this.sides[b.side].resUsed[b.owner] = true;
        b.resonant = true; b.vol.resShield = true;
        this.emit({ t: 'resonate', ref: b.ref(), type: b.types[0] });
        this.say(`{0} is Resonating with ${tr.name || 'its Tamer'}! Its ${G.cap(b.types[0])} power surges!`, b);
      }
      // --- moves
      const mv = actions.filter(a => a.type === 'move' || a.type === 'recharge');
      for (const a of mv) { a.pri = a.type === 'recharge' ? 0 : this.priorityOf(a); a.spd = this.speed(a.b) * (this.trickRoom ? -1 : 1); a.tie = G.rand(); a.qc = a.b.item === 'quickclaw' && G.chance(.2); }
      mv.sort((x, y) => (y.pri - x.pri) || ((y.qc ? 1 : 0) - (x.qc ? 1 : 0)) || (y.spd - x.spd) || (y.tie - x.tie));
      this.moveOrder = mv;
      for (const a of mv) {
        const b = a.b;
        if (!b.active || b.fainted) continue;
        if (a.qc && a.type === 'move') { this.emit({ t: 'item', ref: b.ref(), item: 'quickclaw' }); this.say('{0}\'s Quick Claw let it move first!', b); }
        if (a.type === 'recharge') { this.say('{0} must recharge!', b); b.vol.recharge = false; b.movedThisTurn = true; continue; }
        await this.useMove(b, a);
        b.movedThisTurn = true;
        await this.processFaints();
        if (this.ended || this.checkEnd()) return;
      }
    }
    async tryRun(b) {
      if (!this.wild) { this.raw('No! There\'s no running from a trainer battle!'); return false; }
      this.runAttempts++;
      const foe = this.active(1)[0];
      let ok = true;
      if (b.abilityHas('runAway') || (foe && this.speed(b) >= this.speed(foe))) ok = true;
      else if (foe) ok = G.rand() * 256 < (this.speed(b) * 128 / Math.max(1, this.speed(foe)) + 30 * this.runAttempts);
      if (this.o.noRun) ok = false;
      if (ok) { this.emit({ t: 'sfx', id: 'run' }); this.raw('You got away safely!'); this.end('ran'); return true; }
      this.raw(this.o.noRun ? 'You can\'t escape!' : 'You couldn\'t get away!');
      return false;
    }
    // ------------------------------------------------------ items
    async useItem(a) {
      const b = a.b, it = G.ITEMS[a.item], tr = this.trainerOf(b);
      if (!it) return;
      const who = tr.isPlayer ? 'You' : this.tname(tr);
      if (it.ball) return this.throwBall(b, it, a.targetRef);
      if (it.flee) { this.raw(`${who} threw the ${it.name}...`); if (this.wild) { this.raw('The wild mon was distracted! You got away!'); this.end('ran'); } else this.raw('But it had no effect on a trainer\'s mon!'); return; }
      const party = this.partyOf(b.side, b.owner);
      if (it.xstat) {
        this.raw(`${who} used an ${it.name}!`);
        this.emit({ t: 'sfx', id: 'item' });
        this.boost(b, { [it.xstat]: 2 }, b);
        return;
      }
      const m = party[a.target !== undefined ? a.target : b.partyIdx];
      if (!m) return;
      const act = this.sides[b.side].slots.find(x => x && x.mon === m);
      this.raw(`${who} used ${/^[AEIOU]/.test(it.name) ? 'an' : 'a'} ${it.name}${tr.isPlayer ? '' : ' on ' + G.mon.name(m)}!`);
      this.emit({ t: 'sfx', id: 'heal' });
      if (it.revive && m.hp <= 0 && !m.dead) {
        m.hp = Math.max(1, Math.floor(G.mon.maxHP(m) * it.revive)); m.status = null;
        this.raw(`${G.mon.name(m)} was revived!`); this.emit({ t: 'partyUpdate', side: b.side, owner: b.owner }); return;
      }
      if (it.heal && m.hp > 0) {
        const max = G.mon.maxHP(m), before = m.hp;
        m.hp = Math.min(max, m.hp + it.heal);
        if (act) this.emit({ t: 'hp', ref: act.ref(), hp: m.hp, max, heal: true });
        this.raw(`${G.mon.name(m)}'s HP was restored${m.hp - before < 9999 ? ' by ' + (m.hp - before) + ' points' : ''}.`);
      }
      if (it.cure && m.hp > 0) {
        if (m.status && (it.cure === 'all' || it.cure.includes(m.status))) {
          m.status = null; m.slp = 0;
          if (act) { this.emit({ t: 'status', ref: act.ref(), status: null }); act.vol.confused = it.cure === 'all' ? 0 : act.vol.confused; }
          this.raw(`${G.mon.name(m)} was cured of its condition!`);
        }
      }
      if (it.pp) {
        const list = it.ppAll ? m.moves : [m.moves[a.moveIdx || 0]];
        for (const mv of list) if (mv) mv.pp = Math.min(G.mon.maxPP(mv), mv.pp + it.pp);
        this.raw(`${G.mon.name(m)}'s PP was restored.`);
      }
      this.emit({ t: 'partyUpdate', side: b.side, owner: b.owner });
    }
    catchChance(t, it) {
      const sp = t.sp; let bm = it.ball;
      if (bm === 255) return { a: 999, shakes: 4 };
      if (bm === 'net') bm = t.hasType('water') || t.hasType('bug') ? 3.5 : 1;
      else if (bm === 'dusk') bm = (this.o.night || this.env === 'cave') ? 3 : 1;
      else if (bm === 'quick') bm = this.turn <= 1 ? 5 : 1;
      else if (bm === 'timer') bm = Math.min(4, 1 + this.turn * 1229 / 4096);
      let a = (3 * t.maxhp - 2 * t.hp) * sp.catch * bm / (3 * t.maxhp);
      if (t.status === 'slp' || t.status === 'frz') a *= 2.5; else if (t.status) a *= 1.5;
      if (t.lvl < 13) a *= Math.max(1, (36 - 2 * t.lvl) / 10);
      a *= (this.o.catchMult || 1);
      if (this.o.godCatch) a = 999;
      if (a >= 255) return { a, shakes: 4 };
      const bb = 65536 / Math.pow(255 / a, .25);
      let shakes = 0; for (let i = 0; i < 4; i++) { if (G.rand() * 65536 < bb) shakes++; else break; }
      return { a, shakes };
    }
    async throwBall(b, it, targetRef) {
      const tr = this.trainerOf(b);
      if (!this.wild) {
        this.emit({ t: 'throw', ball: it.id, ref: this.active(1)[0].ref(), blocked: true });
        this.raw('The trainer blocked the Orb! Don\'t be a thief!'); return;
      }
      const foes = this.active(1);
      if (foes.length > 1 && !targetRef) { this.raw('There are two wild mons! You can\'t aim properly!'); return; }
      const t = targetRef ? this.at(targetRef.s, targetRef.i) : foes[0];
      if (!t) return;
      this.raw(`${tr.isPlayer ? 'You' : tr.name} threw ${/^[AEIOU]/.test(it.name) ? 'an' : 'a'} ${it.name}!`);
      if (this.rules.noCatch) {
        this.emit({ t: 'throw', ball: it.id, ref: t.ref(), shakes: 0, caught: false, deflect: true });
        this.raw(this.rules.noCatchMsg || 'The Orb was deflected! You can\'t catch this one.'); return;
      }
      const { shakes } = this.catchChance(t, it);
      const caught = shakes >= 4;
      this.emit({ t: 'throw', ball: it.id, ref: t.ref(), shakes: Math.min(3, shakes), caught });
      if (caught) {
        this.say('Gotcha! {0} was caught!', t);
        t.mon.ball = it.id;
        this.caught = { mon: t.mon, ball: it.id, by: b.owner };
        this.sides[1].slots[t.slot] = null; t.active = false;
        this.emit({ t: 'caught', ref: t.ref() });
        await this.flush();
        if (this.active(1).length === 0) this.end('caught');
      } else {
        this.raw(['Oh no! It broke free!', 'Aww! It appeared to be caught!', 'Aargh! Almost had it!', 'Gah! It was so close, too!'][Math.min(3, shakes)]);
      }
    }
    // ------------------------------------------------------ moves
    resolveTargets(b, m, target) {
      const foes = this.foes(b), allies = this.allies(b);
      switch (m.target) {
        case 'self': case 'allySide': case 'foeSide': case 'field': return [b];
        case 'ally': return allies.length ? [allies[0]] : [];
        case 'foes': return foes;
        case 'all': return [...foes, ...allies];
        case 'random': return foes.length ? [G.pick(foes)] : [];
        default: {
          if (target) {
            const t = this.at(target.s, target.i);
            if (t && t !== b) return [t];
            if (target.s === b.side && allies.length) return [allies[0]];
          }
          return foes.length ? [foes.length > 1 ? G.pick(foes) : foes[0]] : [];
        }
      }
    }
    accCheck(b, t, m) {
      if (m.acc === true || b === t) return true;
      if ((m.fx === 'rainsure' && this.weather === 'rain') || (m.fx === 'snowsure' && this.weather === 'snow') || (m.fx === 'sunsure' && this.weather === 'sun')) return true;
      if (m.fx === 'toxic' && b.hasType('poison')) return true;
      let acc = m.acc;
      if (m.fx === 'rainsure' && this.weather === 'sun') acc = 50;
      const st = G.clamp((t.abilityHas('unaware') ? 0 : b.stages.acc) - (b.abilityHas('unaware') ? 0 : t.stages.eva), -6, 6);
      acc *= accMult(st);
      const am = this.abHook(b, 'accMod', b, m); if (am) acc *= am;
      if (b.item === 'widelens') acc *= 1.1;
      if ((this.o.godPlayer || this.o.godOHKO) && b.side === 0) return true;
      return G.rand() * 100 < acc;
    }
    async useMove(b, a) {
      // status gates
      if (b.status === 'slp') {
        b.mon.slp--;
        if (b.mon.slp <= 0) { this.cureStatus(b, '{0} woke up!'); }
        else { this.emit({ t: 'statusAnim', ref: b.ref(), status: 'slp' }); this.say('{0} is fast asleep.', b); b.vol.rampage = null; b.vol.charging = null; return; }
      }
      const slot = b.mon.moves[a.moveIdx];
      let m = (a.struggle || !slot) ? G.MOVES.struggle : G.MOVES[slot.id];
      if (b.status === 'frz') {
        if (['scald', 'blazecharge', 'flamerush', 'emberdash'].includes(m.id) || G.chance(.2)) this.cureStatus(b, '{0} thawed out!');
        else { this.emit({ t: 'statusAnim', ref: b.ref(), status: 'frz' }); this.say('{0} is frozen solid!', b); return; }
      }
      if (b.vol.flinch) { this.say('{0} flinched and couldn\'t move!', b); b.vol.rampage = null; return; }
      if (b.vol.confused) {
        b.vol.confused--;
        if (b.vol.confused <= 0) this.say('{0} snapped out of its confusion!', b);
        else {
          this.emit({ t: 'statusAnim', ref: b.ref(), status: 'conf' });
          this.say('{0} is confused!', b);
          if (G.chance(1 / 3)) {
            const d = Math.max(1, Math.floor((Math.floor(Math.floor(2 * b.lvl / 5 + 2) * 40 * b.stats.atk * stageMult(b.stages.atk) / (b.stats.def * stageMult(b.stages.def))) / 50 + 2) * (85 + G.randInt(0, 15)) / 100));
            this.raw('It hurt itself in its confusion!');
            this.emit({ t: 'hit', ref: b.ref(), eff: 1 });
            this.damage(b, d); b.vol.rampage = null; b.vol.charging = null;
            return;
          }
        }
      }
      if (b.status === 'par' && G.chance(.25)) { this.emit({ t: 'statusAnim', ref: b.ref(), status: 'par' }); this.say('{0} is paralyzed! It can\'t move!', b); b.vol.rampage = null; b.vol.charging = null; return; }
      if (b.vol.taunt && m.cat === 'status') { this.say(`{0} can't use ${m.name} after the taunt!`, b); return; }
      // PP
      if (slot && !a.charged && !a.rampage && !a.struggle) {
        let cost = 1;
        const tgts = this.foes(b); if (tgts.some(t => t.abilityHas('pressure')) && m.target !== 'self') cost = 2;
        slot.pp = Math.max(0, slot.pp - cost);
        if (slot.pp === 0 && b.item === 'leppaberry') { this.emit({ t: 'item', ref: b.ref(), item: 'leppaberry' }); b.item = null; slot.pp = Math.min(G.mon.maxPP(slot), 10); this.say(`{0} restored ${m.name}'s PP using its Leppa Berry!`, b); }
      }
      if ((b.item === 'powerband' || b.item === 'focuslens' || b.item === 'swiftscarf') && slot) b.vol.choice = slot.id;
      // protect chain bookkeeping
      if (m.fx !== 'protect') b.vol.protectN = 0;
      // charge turn
      if (m.fx === 'solar' && !a.charged && this.weather !== 'sun') {
        this.say(`{0} used ${m.name}!`, b);
        this.emit({ t: 'charge', ref: b.ref(), move: m.id });
        this.say('{0} absorbed light!', b);
        b.vol.charging = { idx: a.moveIdx, target: a.target };
        return;
      }
      if (a.charged) b.vol.charging = null;
      this.say(`{0} used ${m.name}!`, b);
      b.lastMove = m.id;
      // ambush / fakeout gates
      let targets = this.resolveTargets(b, m, a.target);
      if (m.fx === 'fakeout' && b.turnsOut > 0) { this.raw('But it failed!'); return; }
      if (m.fx === 'sucker') {
        const t = targets[0];
        const ta = t && this.moveOrder.find(x => x.b === t);
        const tm = ta && ta.type === 'move' ? (ta.b.mon.moves[ta.moveIdx] ? G.MOVES[ta.b.mon.moves[ta.moveIdx].id] : G.MOVES.struggle) : null;
        if (!t || !tm || tm.cat === 'status' || t.movedThisTurn) { this.raw('But it failed!'); return; }
      }
      if (!targets.length) { this.raw('But there was no target...'); return; }
      if (m.fx === 'rampage' && !b.vol.rampage) b.vol.rampage = { idx: a.moveIdx, n: G.randInt(2, 3) };
      if (m.cat === 'status') await this.statusMove(b, m, targets);
      else await this.attack(b, m, targets);
      // rampage wind-down
      if (b.vol.rampage && m.fx === 'rampage') {
        b.vol.rampage.n--;
        if (b.vol.rampage.n <= 0 && !b.fainted) {
          b.vol.rampage = null;
          if (!b.abilityHas('confImmune')) { b.vol.confused = G.randInt(2, 5); this.say('{0} became confused due to fatigue!', b); }
        }
      }
    }
    async attack(b, m, targets) {
      const spread = targets.length > 1;
      this.emit({ t: 'move', ref: b.ref(), move: m.id, targets: targets.map(t => t.ref()) });
      let totalDmg = 0, anyHit = false, pivotAfter = false;
      if (m.fx === 'brickbreak') {
        const sc = this.sides[targets[0].side].cond;
        if (sc.reflect || sc.lightscreen || sc.veil) { sc.reflect = sc.lightscreen = sc.veil = 0; this.raw('It shattered the barrier!'); this.emit({ t: 'screen', side: targets[0].side, kind: 'none' }); }
      }
      for (const t of targets) {
        if (!t.active || t.fainted) continue;
        if (t !== b && t.vol.protect) { this.say('{0} protected itself!', t); this.emit({ t: 'protectAnim', ref: t.ref() }); continue; }
        if (t !== b && t.ab.tryHit && t.ab.tryHit(this, t, b, m)) continue;
        const eff = this.effectiveness(m, b, t);
        if (eff === 0) { this.say('It doesn\'t affect {0}...', t); continue; }
        if (!this.accCheck(b, t, m)) { this.say(spread ? '{0} avoided the attack!' : '{0} avoided the attack!', t); if (m.fx === 'rampage') b.vol.rampage = null; continue; }
        anyHit = true;
        let hits = 1;
        if (m.multi) hits = b.abilityHas('skillLink') ? m.multi[1] : m.multi[0] === m.multi[1] ? m.multi[0] : G.pick([2, 2, 2, 3, 3, 3, 4, 5].filter(n => n >= m.multi[0] && n <= m.multi[1]));
        let done = 0, dealt = 0, lastCrit = false, lastShield = false;
        for (let h = 0; h < hits; h++) {
          if (t.fainted || b.fainted) break;
          let r = this.calcDamage(b, t, m, { spread, eff });
          if (this.o.godOHKO && b.side === 0) r = { ...r, dmg: Math.max(r.dmg, t.hp) };
          if (this.o.godPlayer && t.side === 0) r = { ...r, dmg: 0 };
          done++;
          dealt += await this.applyHit(b, t, m, r);
          lastCrit = r.crit; lastShield = r.shield;
          if (r.crit) { if (spread) this.say('A critical hit on {0}!', t); else this.raw('A critical hit!'); }
          if (m.multi && t.hp <= 0) break;
        }
        if (m.multi) this.raw(`The mon was hit ${done} time${done > 1 ? 's' : ''}!`);
        if (lastShield) { t.vol.resShield = false; this.emit({ t: 'shieldBreak', ref: t.ref() }); this.say('{0}\'s Resonant Shield absorbed the blow and shattered!', t); }
        if (eff > 1) { if (spread) this.say('It\'s super effective on {0}!', t); else this.raw('It\'s super effective!'); }
        else if (eff < 1) { if (spread) this.say('It\'s not very effective on {0}...', t); else this.raw('It\'s not very effective...'); }
        totalDmg += dealt;
        // after-hit triggers on target
        if (t.hp > 0 && !t.vol.subHit) {
          this.secondary(b, t, m);
          if (t.ab.afterHit) t.ab.afterHit(this, t, b, m, dealt);
          if (m.contact && t.item === 'spikedhelm' && b.hp > 0) { this.emit({ t: 'item', ref: t.ref(), item: 'spikedhelm' }); this.damage(b, b.maxhp / 6, '{0} was hurt by the Spiked Helm!'); }
          this.checkBerry(t);
        } else if (t.hp <= 0) {
          if (t.ab.afterHit && m.contact && ['roughskin', 'ironbarbs', 'static', 'flamebody', 'poisonpoint'].includes(t.ability)) t.ab.afterHit(this, t, b, m, dealt);
          if (m.contact && t.item === 'spikedhelm' && b.hp > 0) this.damage(b, b.maxhp / 6, '{0} was hurt by the Spiked Helm!');
        }
        t.vol.subHit = false;
        if (m.fx === 'knockoff' && t.item && !t.vol.sub && t.hp >= 0 && b.hp > 0) {
          const it = G.ITEMS[t.item];
          this.knocked.push({ mon: t.mon, item: t.item, side: t.side });
          t.item = null; this.say(`{0} knocked away {1}'s ${it.name}!`, b, t);
        }
        if (t.hp <= 0 && b.ab.onKO && !b.fainted) b.ab.onKO(this, b, t);
      }
      if (!anyHit) { if (m.fx === 'rampage') b.vol.rampage = null; return; }
      // user effects
      if (m.self && b.hp > 0) this.boost(b, m.self, b);
      if (m.recoil && totalDmg > 0 && b.hp > 0 && !b.abilityHas('magicGuard')) this.damage(b, totalDmg * m.recoil, '{0} was damaged by the recoil!');
      if (m.fx === 'struggle' && b.hp > 0) this.damage(b, b.maxhp / 4, '{0} was damaged by the recoil!');
      if (m.drain && totalDmg > 0 && b.hp > 0) this.heal(b, totalDmg * m.drain, '{1} had its energy drained!', targets[0]);
      if (m.fx === 'recharge' && b.hp > 0) b.vol.recharge = true;
      if (m.fx === 'rapidspin' && b.hp > 0) {
        const H = this.sides[b.side].hazards; if (H.rocks || H.spikes || H.tspikes || H.web) { this.sides[b.side].hazards = { rocks: 0, spikes: 0, tspikes: 0, web: 0 }; this.say('{0} blew away the hazards!', b); this.emit({ t: 'hazard', side: b.side, kind: 'clear' }); }
        if (b.vol.seeded) { b.vol.seeded = null; this.say('{0} was freed from Leech Seed!', b); }
        this.boost(b, { spe: 1 }, b);
      }
      if (b.item === 'lifegem' && totalDmg > 0 && b.hp > 0 && !b.abilityHas('magicGuard')) { this.damage(b, b.maxhp / 10, '{0} lost some of its HP!'); }
      if (b.item === 'shellbell' && totalDmg > 0 && b.hp > 0) this.heal(b, totalDmg / 8, '{0} restored a little HP using its Shell Bell!');
      await this.processFaints();
      if (m.fx === 'pivot' && b.hp > 0 && b.active && !this.ended && !this.checkEnd()) await this.pivot(b);
    }
    nameFor(t) { return (t.side === 1 ? (this.wild ? 'the wild ' : 'the opposing ') : '') + t.name; }
    async applyHit(b, t, m, r) {
      let dmg = r.dmg;
      if (t.vol.sub && !m.sound && b !== t) {
        const d = Math.min(t.vol.sub, dmg);
        t.vol.sub -= d; t.vol.subHit = true;
        this.emit({ t: 'hit', ref: t.ref(), eff: r.eff, crit: r.crit, sub: true });
        this.say('The decoy took the hit for {0}!', t);
        if (t.vol.sub <= 0) { t.vol.sub = 0; this.emit({ t: 'subBreak', ref: t.ref() }); this.say('{0}\'s decoy faded!', t); }
        return d;
      }
      let endured = null;
      if (dmg >= t.hp && t.hp === t.maxhp && t.maxhp > 1) {
        if (t.abilityHas('sturdy')) { dmg = t.hp - 1; endured = 'sturdy'; }
        else if (t.item === 'gritsash') { dmg = t.hp - 1; endured = 'sash'; }
      }
      dmg = Math.min(dmg, t.hp);
      this.emit({ t: 'hit', ref: t.ref(), eff: r.eff, crit: r.crit });
      t.hp = t.hp - dmg;
      this.emit({ t: 'hp', ref: t.ref(), hp: t.hp, max: t.maxhp });
      if (endured === 'sturdy') { this.popup(t); this.say('{0} endured the hit!', t); }
      if (endured === 'sash') { this.emit({ t: 'item', ref: t.ref(), item: 'gritsash' }); t.item = null; this.say('{0} hung on using its Grit Sash!', t); }
      if (t.status === 'frz' && m.type === 'fire' && t.hp > 0) this.cureStatus(t, '{0} thawed out!');
      return dmg;
    }
    secondary(b, t, m) {
      const s = m.sec; if (!s || t.fainted) return;
      const chance = s.chance * (b.ab.secMult || 1);
      if (G.rand() * 100 >= chance) return;
      if (m.fx === 'triattack') { const st = G.pick(['brn', 'par', 'frz']); if (this.canStatus(t, st, b)) this.setStatus(t, st, b); return; }
      if (s.status && this.canStatus(t, s.status, b)) this.setStatus(t, s.status, b);
      if (s.flinch && !t.movedThisTurn && !t.abilityHas('flinchImmune')) t.vol.flinch = true;
      if (s.conf && !t.vol.confused && !t.abilityHas('confImmune')) { t.vol.confused = G.randInt(2, 5); this.emit({ t: 'statusAnim', ref: t.ref(), status: 'conf' }); this.say('{0} became confused!', t); }
      if (s.stats && t.hp > 0) this.boost(t, s.stats, b);
      if (s.selfStats && b.hp > 0) this.boost(b, s.selfStats, b);
    }
    async pivot(b) {
      const bench = this.bench(b.side, b.owner);
      if (!bench.length) return;
      await this.flush();
      const ctrl = this.ctrlOf(b.side, b.owner);
      const idx = await ctrl.chooseSwitch(this, { ref: b.ref(), side: b.side, owner: b.owner, forced: true, reason: 'pivot' });
      if (idx === undefined || idx === null || idx < 0) return;
      await this.doSwitch(b, idx);
    }
    async statusMove(b, m, targets) {
      this.emit({ t: 'move', ref: b.ref(), move: m.id, targets: targets.map(t => t.ref()) });
      const S = this.sides[b.side], F = this.sides[1 - b.side];
      // field / side
      if (m.weather) { if (!this.setWeather(m.weather, b)) this.raw('But it failed!'); return; }
      if (m.screen) {
        if (m.screen === 'veil' && this.weather !== 'snow') { this.raw('But it failed!'); return; }
        if (S.cond[m.screen]) { this.raw('But it failed!'); return; }
        const turns = m.screen === 'tailwind' ? 4 : 5;
        S.cond[m.screen] = turns;
        this.emit({ t: 'screen', side: b.side, kind: m.screen });
        this.raw({ reflect: 'Reflect made your side stronger against physical moves!', lightscreen: 'Light Screen made your side stronger against special moves!', tailwind: 'The Tailwind blew from behind your team!', veil: 'Aurora Veil made your team stronger against all moves!' }[m.screen].replace('your', b.side === 0 ? 'your' : 'the opposing').replace('your team', b.side === 0 ? 'your team' : 'the opposing team'));
        return;
      }
      if (m.hazard) {
        const H = F.hazards; const max = { rocks: 1, spikes: 3, tspikes: 2, web: 1 }[m.hazard];
        if (H[m.hazard] >= max) { this.raw('But it failed!'); return; }
        H[m.hazard]++;
        this.emit({ t: 'hazard', side: 1 - b.side, kind: m.hazard, n: H[m.hazard] });
        this.raw({ rocks: 'Pointed shards float in the air around ', spikes: 'Spikes were scattered on the ground around ', tspikes: 'Venom spikes were scattered around ', web: 'A sticky web spreads out around ' }[m.hazard] + (b.side === 0 ? 'the opposing team!' : 'your team!'));
        return;
      }
      switch (m.fx) {
        case 'protect': {
          const n = b.vol.protectN || 0;
          if (G.rand() < 1 / Math.pow(3, n) && this.moveOrder[this.moveOrder.length - 1].b !== b) { b.vol.protect = true; b.vol.protectN = n + 1; this.emit({ t: 'protectAnim', ref: b.ref() }); this.say('{0} protected itself!', b); }
          else { b.vol.protectN = 0; this.raw('But it failed!'); }
          return;
        }
        case 'substitute':
          if (b.vol.sub) { this.say('{0} already has a decoy!', b); return; }
          if (b.hp <= b.maxhp / 4) { this.raw('But it does not have enough HP left to make a decoy!'); return; }
          this.damage(b, b.maxhp / 4); b.vol.sub = Math.floor(b.maxhp / 4) + 1;
          this.emit({ t: 'subMake', ref: b.ref() }); this.say('{0} put up a decoy!', b); return;
        case 'rest':
          if (b.hp >= b.maxhp || b.abilityHas('statusImmune') && this.abHook(b, 'statusImmune', b, 'slp')) { this.raw('But it failed!'); return; }
          b.status = 'slp'; b.mon.slp = 3; this.emit({ t: 'status', ref: b.ref(), status: 'slp' });
          this.heal(b, b.maxhp, '{0} slept and became healthy!'); return;
        case 'trickroom':
          if (this.trickRoom) { this.trickRoom = 0; this.raw('The twisted dimensions returned to normal!'); }
          else { this.trickRoom = 5; this.emit({ t: 'field', kind: 'trickroom' }); this.say('{0} twisted the dimensions!', b); }
          return;
        case 'defog': {
          for (const X of this.sides) X.hazards = { rocks: 0, spikes: 0, tspikes: 0, web: 0 };
          F.cond.reflect = F.cond.lightscreen = F.cond.veil = 0;
          this.emit({ t: 'hazard', side: 0, kind: 'clear' }); this.emit({ t: 'hazard', side: 1, kind: 'clear' });
          this.raw('A great wind cleared the battlefield!'); return;
        }
        case 'healbell': {
          const party = this.partyOf(b.side, b.owner);
          for (const x of party) if (x.hp > 0) { x.status = null; x.slp = 0; }
          for (const x of this.active(b.side)) this.emit({ t: 'status', ref: x.ref(), status: null });
          this.raw('A soothing chime rang out! The party was cured of all status conditions!'); return;
        }
        case 'bellydrum':
          if (b.hp <= b.maxhp / 2 || b.stages.atk >= 6) { this.raw('But it failed!'); return; }
          this.damage(b, b.maxhp / 2); b.stages.atk = 6; this.emit({ t: 'stat', ref: b.ref(), stat: 'atk', d: 6 });
          this.say('{0} cut its own HP and maximized its Attack!', b); return;
        case 'focusenergy':
          if (b.vol.focus) { this.raw('But it failed!'); return; }
          b.vol.focus = 2; this.say('{0} is getting pumped!', b); return;
        case 'weatherheal': {
          const f = this.weather === 'sun' ? 2 / 3 : this.weather ? 1 / 4 : 1 / 2;
          if (!this.heal(b, b.maxhp * f)) this.say('{0}\'s HP is full!', b); return;
        }
        case 'flop': this.raw('But nothing happened!'); return;
        case 'helpinghand': {
          const t = targets[0]; if (!t || t === b || t.movedThisTurn) { this.raw('But it failed!'); return; }
          t.vol.helped = true; this.say('{0} is ready to help {1}!', b, t); return;
        }
      }
      if (m.heal) { if (!this.heal(b, b.maxhp * m.heal)) this.say('{0}\'s HP is full!', b); return; }
      if (m.boost && m.target === 'self') { if (!this.boost(b, m.boost, b) && !Object.values(m.boost).some(v => v < 0)) { /* messages already */ } return; }
      // targeted status moves
      for (const t of targets) {
        if (!t.active || t.fainted) continue;
        if (t !== b && t.vol.protect) { this.say('{0} protected itself!', t); continue; }
        if (t !== b && t.ab.tryHit && t.ab.tryHit(this, t, b, m)) continue;
        if (b.abilityHas('prankster') && t.hasType('dark') && t.side !== b.side) { this.say('It doesn\'t affect {0}...', t); continue; }
        if (m.powder && t.hasType('grass')) { this.say('It doesn\'t affect {0}...', t); continue; }
        if (t.vol.sub && t !== b && !m.sound) { this.raw('But it failed!'); continue; }
        if (!this.accCheck(b, t, m)) { this.say('{0} avoided the attack!', t); continue; }
        if (m.status) {
          if (m.status === 'par' && m.type === 'electric' && t.hasType('ground')) { this.say('It doesn\'t affect {0}...', t); continue; }
          if (t.status) { this.say(STATUS_HAS[t.status], t); continue; }
          if (!this.canStatus(t, m.status, b)) { this.say('It doesn\'t affect {0}...', t); continue; }
          this.setStatus(t, m.status, b);
        }
        if (m.stats) this.boost(t, m.stats, b);
        switch (m.fx) {
          case 'confuse':
            if (t.vol.confused) { this.say('{0} is already confused!', t); break; }
            if (t.abilityHas('confImmune')) { this.popup(t); this.say('{0} doesn\'t become confused!', t); break; }
            t.vol.confused = G.randInt(2, 5); this.emit({ t: 'statusAnim', ref: t.ref(), status: 'conf' }); this.say('{0} became confused!', t); break;
          case 'leechseed':
            if (t.hasType('grass')) { this.say('It doesn\'t affect {0}...', t); break; }
            if (t.vol.seeded) { this.say('{0} is already seeded!', t); break; }
            t.vol.seeded = { s: b.side, i: b.slot }; this.say('{0} was seeded!', t); break;
          case 'taunt':
            if (t.vol.taunt) { this.raw('But it failed!'); break; }
            t.vol.taunt = 3; this.say('{0} fell for the taunt!', t); break;
          case 'roar': {
            if (this.wild) {
              if (b.lvl >= t.lvl || G.chance(.5)) { this.say('{0} fled in fear!', t); this.end('ran'); }
              else this.raw('But it failed!');
              break;
            }
            const bench = this.bench(t.side, t.owner);
            if (!bench.length) { this.raw('But it failed!'); break; }
            const pick = G.pick(bench);
            await this.withdraw(t, false);
            this.say('{0} was dragged out!', { name: G.mon.name(pick.m), side: t.side });
            await this.switchIn(t.side, t.slot, t.owner, pick.i);
            break;
          }
          case 'pivotstatus':
            if (b.hp > 0) { await this.processFaints(); await this.pivot(b); }
            break;
        }
      }
    }
    // ------------------------------------------------------ fainting / exp
    async processFaints() {
      for (const S of this.sides) for (const b of S.slots) {
        if (!b || b.fainted || b.hp > 0) continue;
        b.fainted = true;
        this.emit({ t: 'faint', ref: b.ref() });
        this.say('{0} fainted!', b);
        this.faintOrder.push(b.side);
        this.faintedUids.add(b.mon.uid);
        b.mon.status = null;
        if (b.side === 0) b.mon.bond = Math.max(0, b.mon.bond - 1);
        if (this.rules.nuzlocke && b.side === 0 && this.trainerOf(b).isPlayer) { b.mon.dead = true; this.say('{0} has fallen... Rest well, friend.', b); }
        if (b.side === 1 && this.o.exp) await this.awardExp(b);
      }
      await this.flush();
    }
    async awardExp(foe) {
      const parts = this.participants[foe.mon.uid] || new Set();
      const S0 = this.sides[0];
      const trainerMult = this.wild ? 1 : 1.5;
      const L = foe.lvl, bexp = foe.sp.exp;
      for (let ti = 0; ti < S0.trainers.length; ti++) {
        const tr = S0.trainers[ti];
        if (!tr.isPlayer && !tr.isRemote) continue;
        for (const m of tr.party) {
          if (m.hp <= 0 || m.dead) continue;
          const part = parts.has(m.uid);
          if (!part && !tr.expShare) continue;
          const Lp = m.lvl;
          let exp = (bexp * L / 5) * Math.pow((2 * L + 10) / (L + Lp + 10), 2.5) + 1;
          exp *= trainerMult * (part ? 1 : .5) * (m.item === 'luckyegg' ? 1.5 : 1) * (tr.expMult || 1);
          if (m.ot && tr.otId && m.otId !== tr.otId) exp *= 1.5;
          exp = Math.max(1, Math.floor(exp));
          const cap = tr.levelCap || 100;
          if (tr.softCap && m.lvl >= tr.softCap) exp = Math.max(1, Math.floor(exp * .1));
          if (tr.isRemote) { this.expLog.push({ owner: ti, uid: m.uid, exp, ev: foe.sp.ev }); continue; }
          G.mon.addEVs(m, foe.sp.ev, 1);
          const before = { lvl: m.lvl, frac: G.mon.expProgress(m) };
          if (m.lvl >= cap) { if (part) this.raw(`${G.mon.name(m)} is at the level cap and can't gain EXP.`); continue; }
          const oldStats = G.mon.stats(m);
          const ups = G.mon.addExp(m, exp, cap);
          const act = S0.slots.find(b => b && b.mon === m);
          this.raw(`${G.mon.name(m)} gained ${exp} EXP. Points!`);
          this.emit({ t: 'exp', uid: m.uid, ref: act ? act.ref() : null, from: before, lvl: m.lvl, frac: G.mon.expProgress(m), ups: ups.length });
          if (ups.length) {
            this.leveled.add(m.uid);
            if (act) act.refreshStats();
            const ns = G.mon.stats(m);
            if (act) this.emit({ t: 'hp', ref: act.ref(), hp: m.hp, max: ns.hp, silent: true });
            this.emit({ t: 'levelup', uid: m.uid, name: G.mon.name(m), lvl: m.lvl, old: oldStats, stats: ns, ref: act ? act.ref() : null });
            this.raw(`${G.mon.name(m)} grew to Lv. ${m.lvl}!`);
            await this.flush();
            for (const lv of ups) for (const mv of G.mon.movesAt(m.sp, lv)) await this.teach(tr, m, mv);
          }
        }
      }
    }
    async teach(tr, m, mv) {
      if (G.mon.hasMove(m, mv)) return;
      const name = G.MOVES[mv].name;
      if (m.moves.length < 4) { m.moves.push(G.mon.newMove(mv)); this.emit({ t: 'sfx', id: 'learn' }); this.raw(`${G.mon.name(m)} learned ${name}!`); await this.flush(); return; }
      await this.flush();
      const slot = tr.controller.learnMove ? await tr.controller.learnMove(this, m, mv) : -1;
      if (slot >= 0 && slot < 4) {
        const old = G.MOVES[m.moves[slot].id].name;
        m.moves[slot] = G.mon.newMove(mv);
        this.raw(`1, 2, and... Poof! ${G.mon.name(m)} forgot ${old}, and learned ${name}!`);
      } else this.raw(`${G.mon.name(m)} did not learn ${name}.`);
      await this.flush();
    }
    // ------------------------------------------------------ end of turn
    async endOfTurn() {
      // weather
      if (this.weather) {
        if (this.weatherTurns > 0) this.weatherTurns--;
        if (this.weatherTurns === 0) { this.raw(WEATHER_MSG[this.weather][2]); this.weather = null; this.emit({ t: 'weather', w: null }); }
        else {
          this.emit({ t: 'weather', w: this.weather, tick: true });
          if (this.weather === 'sand') for (const b of this.allActive().sort((a, c) => this.speed(c) - this.speed(a))) {
            if (b.hasType('rock') || b.hasType('ground') || b.hasType('steel') || b.abilityHas('sandImmune')) continue;
            this.damage(b, b.maxhp / 16, '{0} is buffeted by the sandstorm!');
          }
        }
        await this.processFaints(); if (this.checkEnd()) return;
      }
      const order = this.allActive().sort((a, c) => this.speed(c) - this.speed(a));
      for (const b of order) {
        if (b.fainted) continue;
        if (b.item === 'leftovers' && b.hp < b.maxhp) this.heal(b, b.maxhp / 16, '{0} restored a little HP using its Leftovers!');
        if (b.item === 'blacksludge') { if (b.hasType('poison')) { if (b.hp < b.maxhp) this.heal(b, b.maxhp / 16, '{0} restored a little HP using its Black Sludge!'); } else this.damage(b, b.maxhp / 8, '{0} was hurt by its Black Sludge!'); }
        if (b.ab.onEndTurn) b.ab.onEndTurn(this, b);
        if (b.vol.seeded && b.hp > 0 && !b.abilityHas('magicGuard')) {
          const src = this.at(b.vol.seeded.s, b.vol.seeded.i);
          const d = this.damage(b, b.maxhp / 8, '{0}\'s health is sapped by Leech Seed!');
          if (src && d) this.heal(src, d, false);
        }
        if (b.hp > 0 && (!this.o.godPlayer || b.side === 1)) {
          if (b.status === 'brn') this.damage(b, b.maxhp / 16, '{0} was hurt by its burn!');
          else if (b.status === 'psn') this.damage(b, b.maxhp / 8, '{0} was hurt by poison!');
          else if (b.status === 'tox') { b.vol.toxN = (b.vol.toxN || 0) + 1; this.damage(b, b.maxhp * Math.min(15, b.vol.toxN) / 16, '{0} was hurt by poison!'); }
        }
        if (b.vol.taunt) { b.vol.taunt--; if (!b.vol.taunt) this.say('{0} shook off the taunt!', b); }
        this.checkBerry(b);
        await this.processFaints(); if (this.checkEnd()) return;
      }
      for (const S of this.sides) for (const k of ['reflect', 'lightscreen', 'tailwind', 'veil']) {
        if (S.cond[k]) { S.cond[k]--; if (!S.cond[k]) { this.raw(`${S.idx === 0 ? 'Your' : 'The opposing'} team's ${{ reflect: 'Reflect', lightscreen: 'Light Screen', tailwind: 'Tailwind', veil: 'Aurora Veil' }[k]} wore off!`); this.emit({ t: 'screen', side: S.idx, kind: k, off: true }); } }
      }
      if (this.trickRoom) { this.trickRoom--; if (!this.trickRoom) this.raw('The twisted dimensions returned to normal!'); }
      for (const b of this.allActive()) { b.vol.protect = false; b.vol.flinch = false; b.vol.helped = false; b.turnsOut++; }
      await this.flush();
    }
    async replaceFainted() {
      if (this.ended) return;
      const needs = [];
      for (const S of this.sides) S.slots.forEach((b, i) => {
        if (b && !b.fainted) return;
        const owner = S.owners[i];
        if (this.bench(S.idx, owner).length === 0) { if (b) S.slots[i] = null; return; }
        if (this.wild && S.idx === 1) { if (b) S.slots[i] = null; return; }
        needs.push({ side: S.idx, slot: i, owner });
      });
      if (!needs.length) return;
      await this.flush();
      // player side chooses simultaneously; AI picks
      const picks = await Promise.all(needs.map(async n => {
        const ctrl = this.ctrlOf(n.side, n.owner);
        const idx = await ctrl.chooseSwitch(this, { side: n.side, owner: n.owner, slot: n.slot, forced: true, reason: 'faint', taken: [] });
        return { ...n, idx };
      }));
      // avoid double-picks in doubles for same owner
      const used = new Set();
      // foe side replacements first (so player can react in switch mode)
      picks.sort((a, b) => b.side - a.side);
      for (const p of picks) {
        let idx = p.idx;
        const key = p.side + ':' + p.owner + ':' + idx;
        if (idx === undefined || idx === null || idx < 0 || used.has(key) || !this.bench(p.side, p.owner).some(x => x.i === idx)) {
          const alt = this.bench(p.side, p.owner).find(x => !used.has(p.side + ':' + p.owner + ':' + x.i));
          if (!alt) continue; idx = alt.i;
        }
        used.add(p.side + ':' + p.owner + ':' + idx);
        const S = this.sides[p.side];
        const old = S.slots[p.slot]; if (old) { old.active = false; S.slots[p.slot] = null; }
        const tr = S.trainers[p.owner];
        if (p.side === 1 && tr.name) this.say(`${this.tname(tr)} is about to send out {0}.`, { name: G.mon.name(tr.party[idx]), side: 1 });
        // switch-mode offer to player (singles only)
        if (p.side === 1 && this.nSlots === 1 && !this.rules.setMode && !picks.some(q => q.side === 0)) {
          const mine = this.active(0)[0];
          if (mine && this.bench(0, mine.owner).length && this.ctrlOf(0, mine.owner).offerSwitch) {
            await this.flush();
            const sw = await this.ctrlOf(0, mine.owner).offerSwitch(this, { side: 0, owner: mine.owner, foe: G.mon.name(tr.party[idx]) });
            if (sw !== null && sw !== undefined && sw >= 0) await this.doSwitch(mine, sw);
          }
        }
        await this.switchIn(p.side, p.slot, p.owner, idx);
        await this.processFaints();
      }
      await this.flush();
    }
    checkEnd() {
      if (this.ended) return true;
      const out0 = this.ableCount(0) === 0, out1 = this.wild ? this.active(1).length === 0 && this.ableCount(1) === 0 : this.ableCount(1) === 0;
      if (!out0 && !out1) return false;
      if (out0 && out1) {
        const first = this.faintOrder.filter(s => true);
        // side whose last mon fainted first loses: find last faint of each
        const last0 = this.faintOrder.lastIndexOf(0), last1 = this.faintOrder.lastIndexOf(1);
        this.end(last0 < last1 ? 'lose' : 'win');
      } else this.end(out1 ? 'win' : 'lose');
      return true;
    }
    end(outcome) {
      if (this.ended) return;
      this.ended = true;
      // restore knocked-off items for the player's side
      for (const k of this.knocked) if (k.side === 0 && !k.mon.item) k.mon.item = k.item;
      this.result = { outcome, caught: this.caught, turns: this.turn, leveled: [...this.leveled], fainted: [...this.faintedUids], expLog: this.expLog };
      this.emit({ t: 'end', outcome });
    }
  };
})();
