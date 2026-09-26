'use strict';
// ============================================================================
//  Link play (co-op over LAN/server). Host-authoritative battles: whoever
//  starts a battle runs the engine; the partner streams events & sends actions.
// ============================================================================
G.loadScript = src => new Promise((res, rej) => {
  if (document.querySelector(`script[data-src="${src}"]`)) { res(); return; }
  const el = document.createElement('script'); el.src = src; el.dataset.src = src; el.onload = () => res(); el.onerror = rej; document.head.appendChild(el);
});
G.PartnerEnt = class extends G.Ent {
  constructor(o) { super({ ...o, kind: 'partner' }); this.tx0 = o.x; this.ty0 = o.y; this.visible = true; }
  setTarget(p) {
    this.map = p.map; this.look = p.look || this.look; this.name = p.name;
    if (Math.abs(p.x - this.x) + Math.abs(p.y - this.y) > 3 || p.map !== this.lastMap) { this.x = p.x; this.y = p.y; this.px = p.x * 16; this.py = p.y * 16; this.moving = false; }
    this.goal = { x: p.x, y: p.y, dir: p.dir, speed: p.speed || 1 }; this.surf = p.surf; this.lastMap = p.map;
  }
  updateNet() {
    if (!this.goal) return;
    if (!this.moving && (this.x !== this.goal.x || this.y !== this.goal.y)) {
      const d = G.dirFrom(this.goal.x - this.x, this.goal.y - this.y); this.startMove(d, this.goal.speed);
    }
    if (this.moving) { const done = this.update(); if (done && this.x === this.goal.x && this.y === this.goal.y) this.dir = this.goal.dir; }
    else this.dir = this.goal.dir;
    if (this.emote) { this.emoteT++; if (this.emoteT > (this.emoteLife || 60)) this.emote = null; }
  }
};
G.net = (function () {
  const N = {
    ws: null, connected: false, room: null, myId: null, partner: null, team: false, pending: {}, inbox: [], lastPos: '', lastSend: 0, guestScene: null, chain: Promise.resolve(),
    url() { return (location.protocol === 'https:' ? 'wss://' : 'ws://') + (N.hostOverride || location.host) + '/ws'; },
    tx: null,
    send(m) { if (N.tx) N.tx.send(JSON.stringify(m)); },
    // how to reach the other player: the game's own server when the page came from one (node server.js on a
    // LAN), otherwise a public message relay over secure WebSockets, which works from any network or phone
    async connect(room) {
      N.room = room;
      let local = false;
      if (!/[?&]relay/.test(location.search)) try { const r = await fetch('net-info', { cache: 'no-store' }); local = r.ok && /json/.test(r.headers.get('content-type') || ''); } catch (e) { }
      return local || N.hostOverride ? N.connectWS(room) : N.connectRelay(room);
    },
    connectWS(room) {
      return new Promise((res) => {
        let ws; try { ws = new WebSocket(N.url()); } catch (e) { res(false); return; }
        N.tx = { send: s => { if (ws.readyState === 1) ws.send(s); }, close: () => ws.close() };
        const timer = setTimeout(() => res(false), 4000);
        ws.onopen = () => { N.send({ t: 'join', room, name: G.save.name }); };
        ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } N.onMsg(m, res, timer); };
        ws.onclose = () => { if (N.connected) G.toast('Link disconnected.'); N.connected = false; N.dropPartner(); };
        ws.onerror = () => { clearTimeout(timer); res(false); };
      });
    },
    RELAYS: ['wss://broker.hivemq.com:8884/mqtt', 'wss://broker.emqx.io:8084/mqtt'],
    async connectRelay(room) {
      try { await G.loadScript('js/vendor/mqtt.min.js'); } catch (e) { return 'Could not load the link library. Check your connection.'; }
      for (const url of N.RELAYS) { const r = await N.tryRelay(url, room); if (r !== false) return r; }
      return false;
    },
    tryRelay(url, room) {
      return new Promise(res => {
        const topic = 'solmere/v2/' + room.toLowerCase(), cid = 'c' + Math.floor(Math.random() * 1e9).toString(36);
        let done = false, partner = null;
        const finish = v => { if (!done) { done = true; clearTimeout(timer); res(v); } };
        let cl;
        const timer = setTimeout(() => { try { cl && cl.end(true); } catch (e) { } finish(false); }, 9000);
        try {
          cl = mqtt.connect(url, { clientId: 'solmere_' + cid, clean: true, connectTimeout: 8000, reconnectPeriod: 3000, keepalive: 30,
            will: { topic, payload: JSON.stringify({ cid, t: 'bye' }), qos: 0, retain: false } });
        } catch (e) { finish(false); return; }
        const pub = o => { try { cl.publish(topic, JSON.stringify({ cid, ...o })); } catch (e) { } };
        N.tx = { send: s => pub({ d: s, to: partner && partner.id }), close: () => { pub({ t: 'bye' }); try { cl.end(); } catch (e) { } } };
        cl.on('connect', () => {
          if (done) { pub({ t: 'hello', name: G.save.name }); return; }   // reconnected after a drop: say hello again
          cl.subscribe(topic, err => {
            if (err) { finish(false); return; }
            pub({ t: 'hello', name: G.save.name });
            // anyone already in the room answers within a moment; if nobody does, we're the host
            setTimeout(() => { if (!done) N.onMsg({ t: 'joined', id: cid, room, peers: partner ? [partner] : [], host: !partner }, finish, null); }, 1600);
          });
        });
        cl.on('message', (tp, buf) => {
          let m; try { m = JSON.parse(buf.toString()); } catch (e) { return; }
          if (m.cid === cid || (m.to && m.to !== cid)) return;
          if (m.t === 'hello' || m.t === 'here') {
            if (partner && partner.id !== m.cid) { if (m.t === 'hello') pub({ t: 'full', to: m.cid }); return; }
            const isNew = !partner; partner = { id: m.cid, name: m.name };
            if (m.t === 'hello') pub({ t: 'here', name: G.save.name, to: m.cid });
            if (isNew && done && N.connected) N.onMsg({ t: 'peer_joined', id: m.cid, name: m.name });
            return;
          }
          if (m.t === 'full') { finish('That room already has two players.'); try { cl.end(true); } catch (e) { } return; }
          if (m.t === 'bye') { if (partner && m.cid === partner.id) { partner = null; if (N.connected) N.onMsg({ t: 'peer_left' }); } return; }
          if (m.d && partner && m.cid === partner.id) { let x; try { x = JSON.parse(m.d); } catch (e) { return; } x.from = m.cid; N.onMsg(x); }
        });
        cl.on('error', () => { if (!done) { try { cl.end(true); } catch (e) { } finish(false); } });
      });
    },
    disconnect() { if (N.tx) N.tx.close(); N.tx = null; N.connected = false; N.endTogether(); N.dropPartner(); },
    dropPartner() {
      N.partner = null; N.team = false;
      if (G.world.scene) G.world.scene.partner = null;
      for (const k in N.pending) { const p = N.pending[k]; delete N.pending[k]; p.fallback(); }
    },
    onMsg(m, res, timer) {
      if (m.t === 'joined') { clearTimeout(timer); N.connected = true; N.myId = m.id; N.room = m.room; N.isHost = !!m.host; if (m.peers.length) N.setPartner(m.peers[0]); res(true); N.sendPos(true); return; }
      if (m.t === 'join_fail') { clearTimeout(timer); res(m.reason); return; }
      if (m.t === 'peer_joined') { N.setPartner(m); G.toast(`${m.name} joined your world!`, { col: 'teal' }); G.audio && G.audio.sfx('quest'); N.sendPos(true); if (N.together && N.isHost) { N.team = true; N.sendWorld(true); } return; }
      if (m.t === 'peer_left') { G.toast(`${N.partner ? N.partner.name : 'Partner'} left.`); if (N.together && !N.isHost) N.endTogether(); N.dropPartner(); return; }
      N.inbox.push(m);
    },
    setPartner(p) { N.partner = { id: p.id, name: p.name, state: 'free', pos: null }; },
    // ------------------------------------------------ Together: one shared adventure in the host's world
    // The host's story (flags, badges, beaten trainers, quests) is the world both players live in; the guest
    // keeps their own team, bag and money, follows the host between maps, sees the host's cutscene dialogue,
    // and fights beside them in 2-vs-2. Story progress made together is saved into the guest's game too.
    together: false, isHost: false, own: null, localFlags: {}, sayQ: [], lastHostMap: null, pendingPull: null, lastWorld: '',
    guestTogether() { return N.connected && N.together && !N.isHost; },
    worldState() { const s = G.save; return { flags: s.flags, badges: s.badges, trainers: s.trainers, quests: s.quests, visited: s.visited, hostName: s.name }; },
    sendWorld(force) { const st = N.worldState(), key = JSON.stringify(st); if (!force && key === N.lastWorld) return; N.lastWorld = key; N.send({ t: 'world', ...st }); },
    startTogether() {
      N.together = true; N.team = true; N.sayQ = []; N.lastHostMap = null;
      if (N.isHost) { N.sendWorld(true); return; }
      const s = G.save; N.own = JSON.parse(JSON.stringify({ flags: s.flags, badges: s.badges, trainers: s.trainers, quests: s.quests || {} })); N.localFlags = {};
      N.send({ t: 'world_req' });
    },
    applyWorld(m) {
      const s = G.save; if (!s) return;
      s.flags = Object.assign({}, m.flags, N.localFlags); s.badges = m.badges.slice(); s.trainers = Object.assign({}, m.trainers);
      s.quests = m.quests || s.quests; s.visited = Object.assign({}, s.visited, m.visited); N.hostName = m.hostName;
      if (N.freshTamer) { N.freshTamer = false; N.equipFresh(m.badges.length); }
      const w = G.world.scene; if (w && w.busy === 0 && w.map) w.spawnEnts();
    },
    // a brand-new Tamer joining a friend partway through: bring their partner up to the friend's stage
    equipFresh(badges) {
      const lv = Math.max(5, Math.min(60, 6 + badges * 7)), m = G.save.party[0];
      if (m && m.lvl < lv) { G.mon.setLevel(m, lv); G.mon.healFull(m); }
      G.bag.add('orb', 5 + badges * 2); G.bag.add('potion', 3); if (badges >= 2) G.bag.add('superpotion', 3); if (badges >= 1) G.bag.add('greatorb', 3);
    },
    endTogether() {
      if (!N.together) return;
      N.together = false; N.team = false; N.sayQ = []; N.pendingPull = null;
      if (!N.isHost && N.own && G.save) { N.mergeOwn(); N.own = null; G.persist.write(); }
    },
    // the guest's saved game keeps everything: its own story so far plus what was done together
    mergeOwn() {
      const s = G.save, o = N.own; if (!o) return;
      s.flags = Object.assign({}, o.flags, s.flags); s.badges = [...new Set([...o.badges, ...s.badges])];
      s.trainers = Object.assign({}, o.trainers, s.trainers);
      for (const k in o.quests) if (!s.quests[k]) s.quests[k] = o.quests[k];
    },
    pullTo(m) {
      const w = G.world.scene; if (!w || !m) return;
      if (w.busy > 0 || G.top() !== w || w.player.moving) { N.pendingPull = m; return; }
      N.pendingPull = null;
      G.run(async () => {
        w.busy++;
        try { await G.fadeOut(10); w.enterMap(m.map, m.x, m.y, m.dir, { noScript: true, noBanner: false }); await G.fadeIn(10); }
        finally { w.busy--; }
      });
    },
    sendPos(force) {
      if (!N.connected || !G.world.scene || !G.world.scene.player) return;
      const w = G.world.scene, p = w.player;
      const busy = w.busy > 0 || G.top() !== w;
      const lead = G.party.lead();
      const pos = { t: 'pos', map: w.map.id, x: p.tx, y: p.ty, dir: p.dir, speed: p.speed || 1, surf: w.surfing, look: G.LOOKS[G.save.look], name: G.save.name, state: busy ? 'busy' : 'free', lead: lead ? { sp: lead.sp, lvl: lead.lvl } : null, badges: G.save.badges.length };
      const key = JSON.stringify([pos.map, pos.x, pos.y, pos.dir, pos.state]);
      if (!force && key === N.lastPos && G.realTime - N.lastSend < 2) return;
      N.lastPos = key; N.lastSend = G.realTime; N.send(pos);
    },
    tick() {
      if (!N.connected) return;
      if (G.frame % 20 === 0) N.sendPos();
      if (N.together) {
        const w = G.world.scene, free = w && w.busy === 0 && G.top() === w;
        if (N.isHost && N.partner && G.frame % 45 === 0) N.sendWorld(false);
        if (!N.isHost && N.pendingPull && free) N.pullTo(N.pendingPull);
        else if (!N.isHost && N.sayQ.length && free) {
          const q = N.sayQ.splice(0);
          G.run(async () => { w.busy++; try { for (const l of q) await G.say(l.text, { speaker: l.speaker }); } finally { w.busy--; } });
        }
      }
      while (N.inbox.length) { const m = N.inbox.shift(); try { N.handle(m); } catch (e) { G.reportError(e); } }
    },
    handle(m) {
      const w = G.world.scene;
      switch (m.t) {
        case 'pos': {
          if (!N.partner) N.setPartner({ id: m.from, name: m.name });
          N.partner.pos = m; N.partner.state = m.state; N.partner.name = m.name;
          if (w) {
            if (m.map === w.map.id) { if (!w.partner) w.partner = new G.PartnerEnt({ id: 'partner', x: m.x, y: m.y, dir: m.dir, look: m.look }); w.partner.setTarget(m); }
            else if (w.partner) w.partner.map = m.map;
            // together: when the host changes map, the guest comes along
            if (N.guestTogether() && m.map !== N.lastHostMap) { N.lastHostMap = m.map; if (m.map !== w.map.id) N.pullTo(m); }
          }
          break;
        }
        case 'world_req': if (N.isHost) { N.together = true; N.team = true; N.sendWorld(true); N.sendPos(true); } break;
        case 'world': if (!N.isHost) N.applyWorld(m); break;
        case 'say': if (N.guestTogether()) N.sayQ.push(m); break;
        case 'emote': if (w && w.partner) { w.partner.emote = m.kind; w.partner.emoteT = 0; w.partner.emoteLife = 70; } G.audio && G.audio.sfx('exclaim'); break;
        case 'team_req': G.run(async () => { const ok = w && w.busy === 0 && G.top() === w ? await G.yesno(`${N.partner.name} wants to team up! Your battles will become 2-vs-2 co-op battles while you\'re on the same map. Accept?`) : false; N.send({ t: 'team_resp', ok }); if (ok) { N.team = true; G.toast('Teamed up!', { col: 'teal' }); } }); break;
        case 'team_resp': if (m.ok) { N.team = true; G.toast(`Teamed up with ${N.partner.name}!`, { col: 'teal' }); } else G.toast(`${N.partner.name} declined.`); break;
        case 'team_end': N.team = false; G.toast('Team disbanded.'); break;
        case 'tw': for (const id of m.ids) if (!G.save.trainers[id]) { G.save.trainers[id] = { badges: G.save.badges.length }; if (w) for (const e of w.ents) if (e.trainer === id) e.defeated = true; } break;
        // ---------------- battles (guest side)
        case 'coop_req': G.run(() => N.guestJoin(m)); break;
        case 'pvp_req': G.run(async () => { const ok = w && w.busy === 0 && G.top() === w ? await G.yesno(`${N.partner.name} challenges you to a Link Battle! (Levels set to 50. No EXP.) Accept?`) : false; if (!ok) { N.send({ t: 'pvp_resp', ok: false }); return; } N.send({ t: 'pvp_resp', ok: true, party: N.packParty(true) }); }); break;
        case 'b_start': N.chainIt(() => N.guestStart(m)); break;
        case 'b_ev': N.chainIt(() => N.guestScene ? N.guestScene.play(m.events) : null); break;
        case 'b_req': N.chainIt(async () => { if (!N.guestScene) return; const acts = await N.guestScene.chooseActions(null, m.reqs); N.send({ t: 'b_act', rid: m.rid, actions: acts }); }); break;
        case 'b_sw': N.chainIt(async () => { if (!N.guestScene) return; const idx = await N.guestScene.chooseSwitch(null, m.req); N.send({ t: 'b_swr', rid: m.rid, idx }); }); break;
        case 'b_end': N.chainIt(() => N.guestEnd(m)); break;
        case 'b_act': case 'b_swr': case 'coop_join': case 'pvp_resp': case 'trade_resp': case 'trade_offer': case 'trade_confirm': case 'trade_cancel': {
          const p = N.pending[m.rid || m.t]; if (p) { delete N.pending[m.rid || m.t]; p.resolve(m); } else if (m.t === 'trade_offer' || m.t === 'trade_confirm' || m.t === 'trade_cancel') N.tradeInbox = (N.tradeInbox || []).concat([m]); break;
        }
        case 'trade_req': G.run(() => N.tradeFlow(false)); break;
      }
    },
    chainIt(fn) { N.chain = N.chain.then(fn).catch(e => G.reportError(e)); return N.chain; },
    wait(key, ms, fallback) {
      return new Promise(resolve => {
        const t = ms ? setTimeout(() => { if (N.pending[key]) { delete N.pending[key]; resolve(fallback ? fallback() : null); } }, ms) : null;
        N.pending[key] = { resolve: v => { clearTimeout(t); resolve(v); }, fallback: () => { clearTimeout(t); resolve(fallback ? fallback() : null); } };
      });
    },
    packParty(pvp) { return G.save.party.map(m => { const c = G.mon.clone(m); if (pvp) { G.mon.setLevel(c, 50); G.mon.healFull(c); } return c; }); },
    coopAvailable() {
      const w = G.world.scene;
      return N.connected && N.team && N.partner && N.partner.pos && w && N.partner.pos.map === w.map.id && N.partner.state === 'free';
    },
    // ---------------------------------------------------------- host side
    remoteController(ownerIdx) {
      let rid = 0;
      const ai = G.AI.controller(2);
      return {
        kind: 'remote',
        async chooseActions(bt, reqs) { const id = 'r' + (++rid) + Math.random(); N.send({ t: 'b_req', rid: id, reqs }); const m = await N.wait(id, 0, () => ({ actions: reqs.map(r => ai.decide(bt, r)) })); return m.actions; },
        async chooseSwitch(bt, req) { const id = 's' + (++rid) + Math.random(); N.send({ t: 'b_sw', rid: id, req }); const m = await N.wait(id, 0, () => ({ idx: -1 })); return m.idx; },
        async learnMove() { return -1; },
      };
    },
    remoteDisplay() { return { async play(evs) { N.send({ t: 'b_ev', events: evs.filter(e => e.t !== 'exp' && e.t !== 'levelup') }); } }; },
    async hostCoopBattle(cfg) {
      const w = G.world.scene;
      N.send({ t: 'coop_req', wild: !!cfg.wild, trainer: cfg.coopTrainer || null });
      const m = await N.wait('coop_join', 5000, () => null);
      if (!m || !m.ok) return G.runBattle({ ...cfg, format: cfg.wild ? 'single' : cfg.format, foes: cfg.wild ? [{ ...cfg.foes[0], party: cfg.foes[0].party.slice(0, 1) }] : cfg.foes });
      const partner = { name: N.partner.name, isRemote: true, party: m.party, controller: N.remoteController(1), sprite: m.look, expShare: false };
      N.send({ t: 'b_start', persp: 0, env: G.envForMap(w.map), phase: G.clock.phase(), format: 'double', partnerName: G.save.name });
      const r = await G.runBattle({ ...cfg, format: 'double', allies: [partner], extraDisplays: [N.remoteDisplay()], partnerName: N.partner.name,
        onExpLog: () => { } });
      N.send({ t: 'b_end', outcome: r ? r.outcome : 'draw', party: partner.party, expLog: r ? r.expLog.filter(e => e.owner === 1) : [], money: r && r.outcome === 'win' && !cfg.wild ? 500 + 80 * G.save.badges.length : 0, trainer: cfg.coopTrainer });
      return r;
    },
    // ---------------------------------------------------------- guest side
    async guestJoin(m) {
      const w = G.world.scene;
      const free = w && w.busy === 0 && G.top() === w && G.party.alive().length > 0;
      if (!free) { N.send({ t: 'coop_join', ok: false }); return; }
      N.send({ t: 'coop_join', ok: true, party: N.packParty(false), look: G.LOOKS[G.save.look] });
      w.busy++; N.guestBusy = true;
      G.toast(`${N.partner.name} pulled you into a battle!`, { col: 'teal' });
    },
    async guestStart(m) {
      const w = G.world.scene;
      if (!N.guestBusy && w) { w.busy++; N.guestBusy = true; }
      G.audio && G.audio.music('trainer');
      await G.battleTransition('trainer');
      const sc = new G.BattleScene({ env: m.env, phase: m.phase, persp: m.persp, format: m.format, partnerName: m.partnerName });
      N.guestScene = sc; G.push(sc); await G.fadeIn(10);
    },
    async guestEnd(m) {
      const sc = N.guestScene; N.guestScene = null;
      if (sc) { await sc.wait(20); await G.fadeOut(14); G.pop(sc); }
      const w = G.world.scene;
      if (m.pvp) { await G.fadeIn(10); await G.say(m.outcome === 'lose' ? 'You won the Link Battle!' : m.outcome === 'win' ? `${N.partner ? N.partner.name : 'Your partner'} won the Link Battle!` : 'The Link Battle ended.'); }
      else {
        // apply HP / PP / status changes to our real mons
        for (const pm of m.party || []) { const mine = G.save.party.find(x => x.uid === pm.uid); if (mine) { mine.hp = pm.hp; mine.status = pm.status; mine.moves = pm.moves; mine.item = pm.item; mine.dead = pm.dead; } }
        if (w) await G.fadeIn(10);
        const leveled = [];
        for (const e of m.expLog || []) {
          const mon = G.save.party.find(x => x.uid === e.uid); if (!mon || mon.hp <= 0) continue;
          G.mon.addEVs(mon, e.ev || {}); const ups = G.mon.addExp(mon, e.exp, G.save.settings.levelCap === 'hard' ? G.levelCapNow() : 100);
          if (ups.length) { leveled.push(mon.uid); await G.say(`${G.mon.name(mon)} grew to Lv. ${mon.lvl}!`); for (const lv of ups) for (const mv of G.mon.movesAt(mon.sp, lv)) await G.learnWithPrompt(mon, mv); }
        }
        if (m.money > 0) { G.save.money += m.money; await G.say(`You shared the prize: $${m.money}!`); }
        if (G.save.settings.nuzlocke) G.party.cleanupDead();
        if (m.outcome === 'lose' || G.party.alive().length === 0) { if (!G.party.alive().length) await G.blackout({}); }
        for (const uid of leveled) { const mon = G.save.party.find(x => x.uid === uid); if (mon) await G.checkEvolution(mon, { trigger: 'level' }); }
      }
      if (w) { if (N.guestBusy) { w.busy = Math.max(0, w.busy - 1); N.guestBusy = false; } const mm = w.map.def.music; G.audio && G.audio.music(typeof mm === 'function' ? mm() : mm); w.placeFollower(); }
      await G.fadeIn(10);
    },
    shareTrainerWin(ids) { if (N.connected && N.team) N.send({ t: 'tw', ids }); },
    // ---------------------------------------------------------- menus
    newCode() { const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; let c = ''; for (let i = 0; i < 4; i++) c += A[Math.floor(Math.random() * A.length)]; return c; },
    // open a room in your own world and wait for a friend
    async hostRoom() {
      const code = N.newCode(); G.toast('Opening a room...');
      const ok = await N.connect(code);
      if (ok !== true) { await G.say(typeof ok === 'string' ? ok : 'Could not reach the link service. Check your internet connection and try again.'); return false; }
      N.startTogether();
      await G.say(`Your room code is {y}${code}{w}.\\pAsk your friend to choose Play Together, then Join, and enter ${code}. They'll appear beside you, and you'll adventure together.`);
      return true;
    },
    // join a friend's room: your team comes with you into their world
    async joinRoom(code) {
      code = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
      if (!code) return false;
      G.toast('Connecting...');
      const ok = await N.connect(code);
      if (ok !== true) { await G.say(typeof ok === 'string' ? ok : 'Could not reach the link service. Check your internet connection and try again.'); return false; }
      if (N.isHost || !N.partner) { N.disconnect(); await G.say(`Nobody is hosting room ${code} right now. Check the code with your friend.`); return false; }
      N.startTogether(); G.toast(`Joined ${N.partner.name}'s world!`, { col: 'teal' });
      return true;
    },
    // the title screen's Play Together
    async titleFlow() {
      const k = await G.ask('Play Together: explore Solmere with a friend, in the same world. The host\'s story leads; you each bring your own team and fight side by side.', ['Host: open my world', 'Join a friend', 'How it works', 'Back']);
      if (k === 2) { await G.say(['One player hosts: they continue their saved journey and get a four-letter room code.', 'The other joins with that code, bringing a saved team or starting as a new Tamer. They appear beside the host and follow them from place to place.', 'The host\'s story leads. Both of you see the cutscenes, and when either of you battles near the other, you fight together, two against two.', 'Story progress made together is saved in both games. Works on phones and computers, over any internet connection.'].join('\\p')); return false; }
      if (k === 0) {
        const sl = await G.pickSlot('Host which journey?', true); if (!sl) return false;
        await G.startFromSave(G.persist.read(sl));
        await N.hostRoom(); return true;
      }
      if (k !== 1) return false;
      const code = await G.askName({ title: 'Room code?', start: '', max: 4, def: '', allowCancel: true }); if (!code) return false;
      const hasSave = [1, 2, 3].some(sl => G.persist.summary(sl));
      let save = null;
      const pick = hasSave ? await G.ask('Who will you play as?', ['A saved Tamer and team', 'A new Tamer', 'Back']) : 1;
      if (pick === 2 || pick < 0) return false;
      if (pick === 0) { const sl = await G.pickSlot('Bring which team?', true); if (!sl) return false; save = G.repairSave(G.persist.read(sl)); }
      else {
        const name = await G.askName({ title: 'Your name?', start: '', max: 10, def: 'Robin', allowCancel: true }); if (!name) return false;
        const look = await G.pickLook();
        const st = await G.ask('Choose your partner Echo.', ['Budling (Grass)', 'Kindlet (Fire)', 'Sealet (Water)']);
        const sp = ['budling', 'kindlet', 'sealet'][Math.max(0, st)];
        const free = [1, 2, 3].find(sl => !G.persist.summary(sl)) || 3;
        save = G.repairSave(G.newSave({ slot: free, name, look }));
        save.party = [G.mon.create(sp, 5, { ot: name })]; save.party[0].bond = 120; save.vars.starter = sp; save.vars.tips = false;
        for (const it of ['journal', 'dex']) save.bag[it] = 1;
        N.freshTamer = true;
      }
      G.save = save;
      const ok = await N.joinRoom(code);
      if (!ok) { G.save = null; N.freshTamer = false; return false; }
      await G.startFromSave(G.save);
      return true;
    },
    async openLinkMenu() {
      while (true) {
        if (!N.connected) {
          const k = await G.ask('Play Together: share your world with a friend (or join theirs). Works on phones and computers over the internet.', ['Host: open my world', 'Join a friend', 'Back']);
          if (k === 0) { await N.hostRoom(); return; }
          if (k === 1) {
            const code = await G.askName({ title: 'Room code?', start: '', max: 4, def: '', allowCancel: true }); if (!code) continue;
            await N.joinRoom(code); return;
          }
          return;
        }
        const pn = N.partner ? N.partner.name : null;
        const opts = ['Link Battle (PvP)', 'Trade', 'Wave hello', 'Leave room', 'Back'];
        const k = await G.ask(pn ? `Playing together with ${pn} (room ${N.room}).` : `Room ${N.room} is open. Waiting for a friend to join...`, opts);
        if (k === 4 || k < 0) return;
        if (k === 3) { N.disconnect(); G.toast('Left the room.'); return; }
        if (!pn) { await G.say('Nobody else is here yet. Share your room code: ' + N.room + '.'); continue; }
        if (k === 0) { await N.hostPvP(); return; }
        if (k === 1) { await N.tradeFlow(true); return; }
        if (k === 2) { N.send({ t: 'emote', kind: 'heart' }); const p = G.world.scene.player; p.emote = 'heart'; p.emoteT = 0; p.emoteLife = 60; return; }
      }
    },
    async interactPartner() {
      const opts = [N.team ? 'Leave team' : 'Team up', 'Link Battle', 'Trade', 'Wave', 'Cancel'];
      const k = await G.ask(`It's ${N.partner.name}! (${N.partner.pos ? N.partner.pos.badges + ' badges' : ''})`, opts);
      if (k === 0) { if (N.team) { N.team = false; N.send({ t: 'team_end' }); } else N.send({ t: 'team_req' }); }
      if (k === 1) await N.hostPvP();
      if (k === 2) await N.tradeFlow(true);
      if (k === 3) { N.send({ t: 'emote', kind: 'note' }); const p = G.world.scene.player; p.emote = 'note'; p.emoteT = 0; }
    },
    async hostPvP() {
      if (!N.partner) return;
      N.send({ t: 'pvp_req' }); G.toast('Challenge sent...');
      const m = await N.wait('pvp_resp', 30000, () => null);
      if (!m || !m.ok) { await G.say('The challenge was declined.'); return; }
      const w = G.world.scene;
      const mine = N.packParty(true);
      const foe = { name: N.partner.name, isRemote: true, party: m.party, controller: N.remoteController(0), sprite: N.partner.pos ? N.partner.pos.look : G.LOOKS.ace };
      N.send({ t: 'b_start', persp: 1, env: 'league', phase: 'day', format: 'single' });
      const r = await G.runBattle({ foes: [foe], format: 'single', playerParty: mine, exp: false, noMoney: true, noPost: true, canLose: true, noRun: true, music: 'rival', env: 'league', extraDisplays: [N.remoteDisplay()] });
      N.send({ t: 'b_end', pvp: true, outcome: r ? r.outcome : 'draw' });
      await G.say(r && r.outcome === 'win' ? 'You won the Link Battle!' : r && r.outcome === 'lose' ? `${N.partner.name} won the Link Battle!` : 'The battle ended.');
    },
    async tradeFlow(initiator) {
      if (!N.partner) return;
      const w = G.world.scene; if (w) w.busy++;
      try {
        N.tradeInbox = [];
        if (initiator) { N.send({ t: 'trade_req' }); G.toast('Trade request sent...'); }
        else if (!await G.yesno(`${N.partner.name} wants to trade. Open the trade screen?`)) { N.send({ t: 'trade_cancel' }); return; }
        const i = await G.openParty({ mode: 'select', prompt: 'Choose an Echo to offer.', filter: m => G.save.party.length > 1, filterMsg: 'You need at least two Echoes to trade.' });
        if (i === null || i < 0) { N.send({ t: 'trade_cancel' }); return; }
        const mine = G.save.party[i];
        N.send({ t: 'trade_offer', mon: G.mon.clone(mine) });
        G.toast('Waiting for your partner\'s offer...');
        const offer = await N.nextTrade('trade_offer', 60000);
        if (!offer || offer.t === 'trade_cancel') { await G.say('The trade was cancelled.'); return; }
        const theirs = offer.mon;
        const ok = await G.yesno(`${N.partner.name} offers ${theirs.nick || G.SPECIES[theirs.sp].name} (Lv ${theirs.lvl}${theirs.shiny ? ', shiny!' : ''}) for your ${G.mon.name(mine)}. Trade?`);
        N.send({ t: ok ? 'trade_confirm' : 'trade_cancel' });
        if (!ok) return;
        const conf = await N.nextTrade('trade_confirm', 60000);
        if (!conf || conf.t !== 'trade_confirm') { await G.say('Your partner cancelled the trade.'); return; }
        const idx = G.save.party.findIndex(m => m.uid === mine.uid);
        if (idx < 0) return;
        theirs.uid = theirs.uid || G.uid();
        G.save.party[idx] = theirs; G.dexMark(theirs.sp, 'caught', theirs.shiny);
        await G.fadeOut(12); G.audio && G.audio.jingle('newmon'); await G.wait(30); await G.fadeIn(12);
        await G.say(`You traded ${G.mon.name(mine)} for ${G.mon.name(theirs)}! Take good care of each other.`);
        const sp = G.SPECIES[theirs.sp];
        const tev = sp.evo.find(e => e.item === 'linkcord');
        if (tev && theirs.item !== 'everstone') await G.evolveMon(theirs, tev.to, { item: true });
        G.persist.write();
        if (w) w.placeFollower();
      } finally { if (w) w.busy--; }
    },
    async nextTrade(kind, ms) {
      const t0 = Date.now();
      while (Date.now() - t0 < ms) {
        const k = (N.tradeInbox || []).findIndex(m => m.t === kind || m.t === 'trade_cancel');
        if (k >= 0) return N.tradeInbox.splice(k, 1)[0];
        await G.wait(6);
      }
      return null;
    },
  };
  return N;
})();
// route co-op trainer battles (and, together, story battles) through the host flow when teamed up
(function () {
  const orig = G.runBattle;
  G.runBattle = async function (cfg) {
    if (!cfg.wild && cfg.coopTrainer && !(cfg.allies && cfg.allies.length) && G.net && G.net.coopAvailable() && !cfg._coop) {
      return G.net.hostCoopBattle({ ...cfg, _coop: true });
    }
    return orig(cfg);
  };
})();

// ---------------------------------------------------------------- Together hooks
(function () {
  const N = G.net;
  // the host's cutscene dialogue (and the choices they make) appear on the guest's screen too
  const say0 = G.say;
  G.say = function (text, o = {}) {
    const w = G.world.scene;
    if (N.together && N.isHost && N.partner && N.scriptDepth > 0 && !(G.top() instanceof G.BattleScene) && o.speaker !== 'Tamer\'s Guide') N.send({ t: 'say', text: Array.isArray(text) ? text.join('\\p') : String(text), speaker: o.speaker || null });
    return say0.apply(this, arguments);
  };
  const ask0 = G.ask;
  G.ask = async function (q, opts, o = {}) {
    const k = await ask0.apply(this, arguments);
    const w = G.world.scene;
    if (N.together && N.isHost && N.partner && N.scriptDepth > 0 && opts && opts[k] !== undefined) N.send({ t: 'say', text: `${q}\\p{c}${G.save.name}: "${opts[k]}"{w}`, speaker: o.speaker || null });
    return k;
  };
  // the guest's story follows the host: story scripts, cutscene triggers and trainer sightings run on the
  // host's side; shops, healing and plain chatter still work for the guest
  const SAFE = new Set(['nurse', 'haven_board', 'haven_tips', 'haven_chat', 'mart_clerk', 'mart_chat', 'mart_special', 'sky_special', 'league_shop', 'gym_guide', 'bh_fisher', 'lab_aide', 'wren_mom', 'mom',
    'berry_lady', 'dowsing_man', 'nickname_rater', 'ev_trainer', 'move_tutor', 'mint_lady', 'name_rater_cinder', 'iv_judge', 'hidden_power_guy', 'fortune_teller', 'prorod_guy', 'spire_exchange', 'kiko', 'tl_hale', 'old_salt_marv', 'bike_shop', 'vsrecorder_npc', 'tl_grunt']);
  const run0 = G.runScript;
  G.runScript = async function (sc, ctx = {}) {
    if (N.guestTogether() && typeof sc === 'string' && !SAFE.has(sc)) {
      if (ctx.ent && ctx.ent.kind === 'npc') await G.say(`(${N.hostName || (N.partner && N.partner.name) || 'Your friend'} leads the story here. Stay close and watch together!)`);
      return;
    }
    N.scriptDepth = (N.scriptDepth || 0) + 1;
    try { return await run0.apply(this, arguments); } finally { N.scriptDepth--; }
  };
  const set0 = G.setFlag;
  G.setFlag = function (n, v = true) { if (N.guestTogether()) N.localFlags[n] = v; return set0.apply(this, arguments); };
  // the guest's save keeps both stories: its own and the one played together
  const write0 = G.persist.write.bind(G.persist);
  G.persist.write = function (slot) {
    if (!N.guestTogether() || !N.own) return write0(slot);
    const s = G.save, keep = { flags: s.flags, badges: s.badges, trainers: s.trainers, quests: s.quests };
    s.quests = Object.assign({}, s.quests); N.mergeOwn();
    try { return write0(slot); } finally { Object.assign(s, keep); }
  };
})();
