'use strict';
// ============================================================================
//  Living tides (FUN_PLAN pillar 6). Twice a day the Mere pulls back: from 2 to 5 (AM and PM, game clock,
//  so 6 real minutes in every 24) tidal flats ('%' cells) are sand you can walk on, with things washed up
//  on them and Echoes that only come out on the flats. The rest of the time they are sea again.
//  A map's tide only turns while it is off screen (or behind a door's fade), so the world never pops or
//  rebuilds while you watch, and you never find yourself standing in the sea.
//  Also here: the old Lodestar keeper's log, six pages left on the flats (read them in the Journal).
// ============================================================================
G.tide = {
  low(h) {
    const f = G.save && G.save.vars.forceTide; if (f) return f === 'low';
    if (h === undefined) h = G.clock ? G.clock.hourF() : 12;
    const t = ((h % 12) + 12) % 12; return t >= 2 && t < 5;
  },
  label() { return this.low() ? 'Low tide' : 'High tide'; },
  // game hours until the tide turns
  turnIn() { const t = ((G.clock.hourF() % 12) + 12) % 12; return this.low() ? 5 - t : (t < 2 ? 2 - t : 14 - t); },
  set(map, low) {
    if (!map.tidalCells || !map.tidalCells.length || map.tideLow === low) return false;
    for (const c of map.tidalCells) { c.g = low ? 'sand' : 'water'; c.water = !low; c.enc = low ? null : 'surf'; }
    map.tideLow = low; return true;
  },
  // entering by warp (nothing is on screen): every loaded map. Crossing a seam: only maps you can't see
  refresh(w, how) {
    const low = this.low(), cur = w.map, near = new Set([cur.id, ...cur.conns.map(c => c.id)]), p = w.player;
    for (const m of Object.values(G.maps.loaded)) {
      if (!m.tidalCells.length || (how === 'cross' && near.has(m.id))) continue;
      if (m === cur && p) { const c = m.cell(p.x, p.y); if (c && c.tidal) continue; }
      if (!this.set(m, low)) continue;
      m.computeMasks();
      if (G.terrain) G.terrain.invalidate(m.id);
      if (G.W3 && G.W3.invalidate) G.W3.invalidate(m.id);
    }
    // arriving where the flats are out: say so (at most every few minutes)
    if (cur.tidalCells.length && cur.tideLow && G.tutorial && G.realTime - (this.saidAt || -1e9) > 240) {
      this.saidAt = G.realTime;
      const s0 = p ? p.stepN : 0;
      G.tutorial.setNudge('Low tide: the flats are out. Things wash up on them.', () => p && p.stepN - s0 >= 8);
    }
  },
};

(function () {
  // tidal flats per map: rows of '%' drawn over the grid from (x0, y0). Only sea cells ('~') turn tidal
  const FLATS = {
    // the home beach: a tongue of sand out past the rocks, where the keeper's first page washed up
    brinehollow: [3, 29, [
      ' %%%%%%%%',
      '  %%%%%%%%',
      '   %%%%%%%%',
      '    %%%%%%',
      '     %%%%']],
    // Duskmere's lake shore, both sides of the causeway
    duskmere: [2, 21, [
      '%%%%%%%%            %%%%%%%',
      ' %%%%%%              %%%%%']],
    // Route 5: a sandbar joining the north isle to the middle one
    route5: [7, 11, [
      '  %%',
      ' %%%',
      ' %%%%',
      '  %%%',
      '  %%%',
      ' %%%',
      ' %%']],
    // Route 6: a long crescent from the eastern isle to the southern one
    route6: [10, 21, [
      '          %%%',
      '         %%%%',
      '       %%%%',
      '      %%%%',
      '    %%%%',
      '  %%%%',
      ' %%%%']],
    // Lodestar Isle: the west flats, and the east shore under the lighthouse
    tidelight: [[0, 8, [
      '  %',
      ' %%%',
      '%%%%',
      '%%%',
      '%%%',
      '%%%',
      ' %%']], [23, 9, [
      '%%',
      '%%%',
      '%%%',
      '%%%',
      '%%',
      '%']]],
  };
  // low-tide Echoes, one table per map (the flats' own)
  const TIDE_ENC = {
    brinehollow: { lv: [4, 6], list: [['clawdle', 60], ['flopfin', 40]] },
    duskmere: { lv: [27, 31], list: [['clawdle', 40], ['mireel', 35], ['crustank', 25]] },
    route5: { lv: [29, 33], list: [['clawdle', 35], ['crustank', 35], ['mireel', 30]] },
    route6: { lv: [39, 44], list: [['crustank', 45], ['mireel', 30], ['bogmaw', 25]] },
    tidelight: { lv: [40, 45], list: [['crustank', 50], ['bogmaw', 30], ['riptalon', 20]] },
  };
  // things washed up on the flats (only there while the tide is out)
  const FINDS = {
    brinehollow: [{ id: 'tide_bh1', x: 10, y: 32, page: 1 }, { id: 'tide_bh2', x: 6, y: 30, item: 'pearl', hidden: true }],
    duskmere: [{ id: 'tide_dm1', x: 5, y: 22, page: 2 }, { id: 'tide_dm2', x: 25, y: 21, item: 'superpotion', qty: 2 }],
    route5: [{ id: 'tide_r51', x: 10, y: 14, page: 3 }, { id: 'tide_r52', x: 9, y: 16, item: 'nugget', hidden: true }],
    route6: [{ id: 'tide_r61', x: 18, y: 23, page: 4 }, { id: 'tide_r62', x: 14, y: 25, item: 'ppup' }],
    tidelight: [{ id: 'tide_tl1', x: 1, y: 11, page: 5 }, { id: 'tide_tl2', x: 24, y: 12, page: 6 }],
  };
  for (const id in FLATS) {
    const d = G.MAPDEFS[id]; if (!d) continue;
    const g = d.grid.map(r => r.split('')), blocks = Array.isArray(FLATS[id][0]) ? FLATS[id] : [FLATS[id]];
    for (const [x0, y0, rows] of blocks) rows.forEach((r, dy) => [...r].forEach((ch, dx) => { const row = g[y0 + dy]; if (ch === '%' && row && row[x0 + dx] === '~') row[x0 + dx] = '%'; }));
    d.grid = g.map(r => r.join(''));
    d.enc = d.enc || {}; d.enc.tide = TIDE_ENC[id];
    d.objs = d.objs || [];
    for (const f of FINDS[id] || []) d.objs.push(f.page ? { type: 'item', id: f.id, x: f.x, y: f.y, item: 'keeperpage', page: f.page, tidal: true } : { type: 'item', qty: 1, ...f, tidal: true });
  }
  // the Route 6 swimmer moves out to open water, clear of the crescent
  const sw = G.MAPDEFS.route6 && G.MAPDEFS.route6.objs.find(o => o.id === 'r6_s1'); if (sw) Object.assign(sw, { x: 26, y: 27 });
  // the old man on Brinehollow beach knows the tides
  const bh = G.MAPDEFS.brinehollow, old = bh && bh.objs.find(o => o.id === 'bh_old');
  if (old) { delete old.text; old.script = 'bh_tides'; }
  G.SCRIPTS.bh_tides = async (S) => {
    const N = 'Old Tobin';
    if (G.tide.low()) await S.say('Tide\'s out! See the flats past the rocks? Walk out and have a look. The sea leaves things behind.\\pMy father found a page of the old Lodestar keeper\'s log out there once. Never did find the rest.', N);
    else await S.say('Every spring the Lodestar glows brighter. Last year, it flickered. Old folk like me notice these things.\\pThe tide goes out twice a day, from two o\'clock to five. When it does, the flats past those rocks open up. Worth a look.', N);
  };

  // ---------------------------------------------------------------- the keeper's log
  const PAGES = [
    'The light turned forty times tonight, as it has every night of my life. My mother kept it before me, and her father before her.\\pWhen the tide goes out, the Mere hums. I have never told anyone that. Who would believe a lighthouse keeper?',
    'The humming is louder in autumn. The old songs name the singer Orrelume and say it sleeps under the Lodestar.\\pI think it dreams. I think the light turns to keep its dreams calm.',
    'Two young people from Galvan came asking about the song today. One carried a notebook. The other had a little Luminelle that hummed along with the tide.\\pLumi, she called it. I liked the three of them at once.',
    'They brought machines to record the song. Last night Lumi sang back, and something far below answered.\\pThe light slowed by one turn. I asked them to stop. The one with the notebook asked for thirty seconds more.',
    'The light flared white across the whole Mere. When I could see again, Lumi was gone. No trace on the rocks, none in the water.\\pThe girl will not leave the shore. The one with the notebook has gone very quiet.',
    'My last page. The light turns slower every year now, and I am too old to sit with it through the night.\\pIf it ever goes dark, do not try to force it bright again. The Lodestar is not a machine. It turns because someone keeps it company.',
  ];
  G.QUESTS.keeperlog = {
    name: 'The Keeper\'s Log', giver: 'the flats',
    desc: 'Pages of the old Lodestar keeper\'s log wash up on the tidal flats at low tide (2 to 5 o\'clock).',
    live() {
      const got = PAGES.map((t, i) => G.flag('keeperpage' + (i + 1)) ? i : -1).filter(i => i >= 0);
      const left = PAGES.length - got.length;
      return (left ? `${got.length} of ${PAGES.length} pages. The rest wash up on tidal flats along the Mere at low tide, from 2 to 5 o'clock.` : 'Every page, found and kept.') + (got.length ? '\n\nPress A to read the pages.' : '');
    },
    async open() {
      const got = PAGES.map((t, i) => i).filter(i => G.flag('keeperpage' + (i + 1))); if (!got.length) return;
      while (true) {
        const k = await G.choose(got.map(i => ({ label: 'Page ' + (i + 1) })).concat([{ label: 'Close' }]), { x: 150, y: 30, w: 110, title: 'Keeper\'s Log', cancel: got.length });
        if (k < 0 || k >= got.length) return;
        await G.say(PAGES[got[k]], { speaker: 'Keeper\'s Log' });
      }
    },
    doneText: 'Every page of the keeper\'s log, found. The Lodestar turns because someone keeps it company.',
  };
  G.tide.readPage = async function (n) {
    G.setFlag('keeperpage' + n);
    G.audio && G.audio.sfx('itemget');
    const got = PAGES.filter((_, i) => G.flag('keeperpage' + (i + 1))).length;
    await G.say(`You found a torn page, dry inside a bottle. It's from the Lodestar keeper's log! {c}(${got} of ${PAGES.length}){w}`);
    await G.say(PAGES[n - 1], { speaker: 'Keeper\'s Log' });
    G.S.quest('keeperlog', got >= PAGES.length ? 'done' : 'go', { silent: got > 1 });
  };
})();
