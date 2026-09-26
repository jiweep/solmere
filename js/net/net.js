'use strict';
// ============================================================================
//  Link play (co-op over LAN/server). Host-authoritative battles: whoever
//  starts a battle runs the engine; the partner streams events & sends actions.
// ============================================================================
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
    send(m) { if (N.ws && N.ws.readyState === 1) N.ws.send(JSON.stringify(m)); },
    connect(room) {
      return new Promise((res) => {
        try { N.ws = new WebSocket(N.url()); } catch (e) { res(false); return; }
        const timer = setTimeout(() => res(false), 4000);
        N.ws.onopen = () => { N.send({ t: 'join', room, name: G.save.name }); };
        N.ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } N.onMsg(m, res, timer); };
        N.ws.onclose = () => { if (N.connected) G.toast('Link disconnected.'); N.connected = false; N.dropPartner(); };
        N.ws.onerror = () => { clearTimeout(timer); res(false); };
      });
    },
    disconnect() { if (N.ws) N.ws.close(); N.connected = false; N.dropPartner(); },
    dropPartner() {
      N.partner = null; N.team = false;
      if (G.world.scene) G.world.scene.partner = null;
      for (const k in N.pending) { const p = N.pending[k]; delete N.pending[k]; p.fallback(); }
    },
    onMsg(m, res, timer) {
      if (m.t === 'joined') { clearTimeout(timer); N.connected = true; N.myId = m.id; N.room = m.room; if (m.peers.length) N.setPartner(m.peers[0]); res(true); N.sendPos(true); return; }
      if (m.t === 'join_fail') { clearTimeout(timer); res(m.reason); return; }
      if (m.t === 'peer_joined') { N.setPartner(m); G.toast(`${m.name} joined the link!`, { col: 'teal' }); G.audio && G.audio.sfx('quest'); N.sendPos(true); return; }
      if (m.t === 'peer_left') { G.toast(`${N.partner ? N.partner.name : 'Partner'} left.`); N.dropPartner(); return; }
      N.inbox.push(m);
    },
    setPartner(p) { N.partner = { id: p.id, name: p.name, state: 'free', pos: null }; },
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
          }
          break;
        }
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
    async openLinkMenu() {
      if (!location.protocol.startsWith('http') && !N.hostOverride) { await G.say('Link play needs the game server. Run "node server.js" in the game folder (or double-click Play.command), then open the address it prints.'); return; }
      while (true) {
        if (!N.connected) {
          const k = await G.ask('Link Play: explore with a friend, team up in 2-vs-2 battles, trade, and battle each other over your network.', ['Join room SOLMERE', 'Join a custom room', 'Help', 'Back']);
          if (k === 0 || k === 1) {
            let room = 'SOLMERE';
            if (k === 1) { room = await G.askName({ title: 'Room code?', start: '', max: 8, def: 'SOLMERE', allowCancel: true }); if (!room) continue; }
            G.toast('Connecting...');
            const ok = await N.connect(room.toUpperCase());
            if (ok === true) { G.toast(`Joined room ${N.room}!`, { col: 'teal' }); await G.say(N.partner ? `${N.partner.name} is here! Walk up to them and press Z to team up, trade, or battle.` : `Room ${N.room} is open. Waiting for a friend to join... They should open this game from their computer at the address the server printed, then choose Link ▸ Join the same room.`); }
            else await G.say(typeof ok === 'string' ? ok : 'Could not connect to the link server.');
            continue;
          }
          if (k === 2) { await G.say(['How to link up:\\n1) On one computer, run the server: open Terminal in the game folder and type  node server.js  (or double-click Play.command).', '2) The server prints two addresses. Play on this machine at localhost. Your friend opens the LAN address (like http://192.168.1.20:8080) on their computer.', '3) Both of you choose Menu ▸ Link ▸ Join room. Then walk up to each other!', 'Each of you keeps your own save and story. When teamed up on the same map, every wild or trainer battle becomes a co-op double battle, and beaten trainers count for both of you.']); continue; }
          return;
        }
        const pn = N.partner ? N.partner.name : null;
        const opts = [N.team ? 'Leave team' : 'Team up', 'Link Battle (PvP)', 'Trade', 'Wave hello', 'Disconnect', 'Back'];
        const k = await G.ask(pn ? `Linked with ${pn} in room ${N.room}.${N.partner.pos ? ' (' + (G.MAPDEFS[N.partner.pos.map] || {}).name + ')' : ''}` : `In room ${N.room}. Waiting for a friend...`, opts);
        if (k === 5 || k < 0) return;
        if (k === 4) { N.disconnect(); G.toast('Disconnected.'); return; }
        if (!pn) { await G.say('Nobody else is here yet.'); continue; }
        if (k === 0) { if (N.team) { N.team = false; N.send({ t: 'team_end' }); G.toast('Left the team.'); } else { N.send({ t: 'team_req' }); G.toast('Team-up request sent.'); } return; }
        if (k === 1) { await N.hostPvP(); return; }
        if (k === 2) { await N.tradeFlow(true); return; }
        if (k === 3) { N.send({ t: 'emote', kind: 'heart' }); const p = G.world.scene.player; p.emote = 'heart'; p.emoteT = 0; p.emoteLife = 60; return; }
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
// route co-op trainer battles through the host flow when teamed up
(function () {
  const orig = G.runBattle;
  G.runBattle = async function (cfg) {
    if (!cfg.wild && cfg.coopTrainer && !cfg.allies && G.net && G.net.coopAvailable() && !cfg._coop) {
      return G.net.hostCoopBattle({ ...cfg, _coop: true });
    }
    return orig(cfg);
  };
})();
