'use strict';
// =============================================================================
//  Tidemarks: no two Echoes are alike. Every Echo is born with its own slight tint, and it carries its
//  history: whom it knocked out, how often it hung on at a sliver of HP, its critical hits, Resonances,
//  wins after dark, boss Echoes felled, and the miles walked beside you. Deeds past a threshold earn a
//  mark. When a marked Echo evolves it takes a Tide Form: a palette all its own and a small stat edge
//  shaped by that mark. The Mon Card turns any Echo into a shareable image.
// =============================================================================
G.tidemarks = (() => {
  const TYPE_HUE = { fire: 18, water: 210, grass: 110, electric: 50, ice: 190, fighting: 5, poison: 285, ground: 35, flying: 220, psychic: 320, bug: 80, rock: 40, ghost: 265, dragon: 250, dark: 260, steel: 200, fairy: 330, normal: 30 };
  // id, name, what earns it, the stats its Tide Form edges up, and the form's palette (hue target or shift, saturation, value)
  const MARKS = {
    bane: { name: t => G.cap(t) + 'bane', desc: t => `Knocked out 25 ${G.cap(t)}-type Echoes`, stats: ['atk', 'spa'], col: t => G.TYPE_COLORS[t] || '#ffb070', pal: t => ({ toward: TYPE_HUE[t] || 20, k: .35, s: 1.15, v: 1 }) },
    stubborn: { name: () => 'Stubborn', desc: () => 'Hung on at a sliver of HP 3 times', stats: ['def', 'spd'], col: () => '#ff7a5a', pal: () => ({ shift: -14, s: 1.2, v: .92 }) },
    keen: { name: () => 'Keen-Eyed', desc: () => 'Landed 15 critical hits', stats: ['spe'], col: () => '#ffe070', pal: () => ({ toward: 48, k: .3, s: 1.1, v: 1.06 }) },
    resonant: { name: () => 'Resonant', desc: () => 'Resonated 8 times', stats: ['spa', 'spd'], col: () => '#6af0e0', pal: () => ({ toward: 175, k: .4, s: 1.2, v: 1.08 }) },
    moonlit: { name: () => 'Moonlit', desc: () => 'Won 20 battles after dark', stats: ['spe', 'spd'], col: () => '#9a8aff', pal: () => ({ toward: 255, k: .85, s: .8, v: .84 }) },
    trailworn: { name: () => 'Trailworn', desc: () => 'Walked 4,000 steps at your side', stats: ['hp'], col: () => '#c8a070', pal: () => ({ toward: 32, k: .25, s: .78, v: .96 }) },
    giantslayer: { name: () => 'Giantslayer', desc: () => 'Felled 6 Echoes of Wardens, admins or champions', stats: ['atk', 'def'], col: () => '#ff5a8a', pal: () => ({ shift: 180, k: 1, s: 1.05, v: .9 }) },
  };
  const TEST = [
    ['bane', h => { let best = null, n = 0; for (const t in h.ko || {}) if (h.ko[t] > n) { n = h.ko[t]; best = t; } return n >= 25 ? best : null; }],
    ['stubborn', h => (h.survived || 0) >= 3 ? true : null],
    ['keen', h => (h.crits || 0) >= 15 ? true : null],
    ['resonant', h => (h.resonates || 0) >= 8 ? true : null],
    ['moonlit', h => (h.nightWins || 0) >= 20 ? true : null],
    ['trailworn', h => (h.steps || 0) >= 4000 ? true : null],
    ['giantslayer', h => (h.bossKOs || 0) >= 6 ? true : null],
  ];
  const hist = m => m.hist || (m.hist = {});
  // born tint: a small hue / saturation shift of its own (older Echoes get one derived from their id)
  function tint(m) {
    if (!m.tint) { let h = 0; for (const ch of String(m.uid || m.sp)) h = (h * 31 + ch.charCodeAt(0)) >>> 0; m.tint = { h: (h % 21) - 10, s: .92 + ((h >> 5) % 17) / 100 }; }
    return m.tint;
  }
  function earn(m) {   // new marks, if any, as [{ id, arg }]
    const h = hist(m), have = m.marks || (m.marks = []), got = [];
    for (const [id, f] of TEST) { if (have.some(x => x.id === id)) continue; const arg = f(h); if (arg) { const mk = { id, arg: arg === true ? null : arg, t: Date.now() }; have.push(mk); got.push(mk); } }
    return got;
  }
  const label = mk => MARKS[mk.id].name(mk.arg), about = mk => MARKS[mk.id].desc(mk.arg), color = mk => MARKS[mk.id].col(mk.arg);
  const mine = (bt, b) => { try { return bt.trainerOf(b).isPlayer; } catch (e) { return false; } };
  const news = [];   // marks earned this battle, announced after it
  function note(m) { for (const mk of earn(m)) news.push([m, mk]); }
  // K on the Summary screen makes the card
  if (typeof addEventListener === 'function') addEventListener('keydown', e => { if (e.code === 'KeyK' && !e.repeat && G.SummaryScene && G.top && G.top() instanceof G.SummaryScene) api.cardKey = true; });
  const api = {
    MARKS, label, about, color, tint, hist,
    // battle hooks (engine)
    onHit(bt, b, t, m, r, before) {
      if (b && mine(bt, b) && b.side !== t.side) {
        const h = hist(b.mon);
        if (r.crit) h.crits = (h.crits || 0) + 1;
        if (t.hp <= 0) { const ty = t.types && t.types[0]; if (ty) (h.ko || (h.ko = {}))[ty] = (h.ko[ty] || 0) + 1; if (!bt.wild && bt.o && bt.o.boss) h.bossKOs = (h.bossKOs || 0) + 1; }
        note(b.mon);
      }
      if (t && mine(bt, t) && t.hp > 0 && t.hp / t.maxhp <= .1 && before / t.maxhp >= .3) { const h = hist(t.mon); h.survived = (h.survived || 0) + 1; note(t.mon); }
    },
    onResonate(bt, b) { if (mine(bt, b)) { const h = hist(b.mon); h.resonates = (h.resonates || 0) + 1; note(b.mon); } },
    onWin(party, night) { if (!night) return; for (const m of party) if (m.hp > 0) { const h = hist(m); h.nightWins = (h.nightWins || 0) + 1; note(m); } },
    onStep(m) { const h = hist(m); h.steps = (h.steps || 0) + 1; if (h.steps % 100 === 0) note(m); },
    pending() { return news.length; },
    async announce() {
      while (news.length) {
        const [m, mk] = news.shift();
        G.audio && G.audio.jingle('learn');
        await G.say(`${G.mon.name(m)} earned a Tidemark: {y}${label(mk)}{w}!\\p(${about(mk)}.) When it evolves, it will take a Tide Form of its own.`);
      }
    },
    // evolution: the first mark decides the Tide Form
    formFor(m) { return m.marks && m.marks.length ? m.marks[0] : null; },
    // stat edge of a Tide Form: +6% to the mark's stats
    statMult(m, stat) { const f = m.form && MARKS[m.form.id]; return f && f.stats.includes(stat) ? 1.06 : 1; },
    // the Mon Card: a 640x360 image of one Echo, its marks and its story in numbers, stamped with the game
    card(m) {
      const cv = G.makeCanvas(640, 360), c = cv.getContext('2d'), sp = G.SPECIES[m.sp], tc = G.TYPE_COLORS[sp.types[0]] || '#8af0e0';
      c.imageSmoothingEnabled = false;
      const g = c.createLinearGradient(0, 0, 640, 360); g.addColorStop(0, G.col.dark(tc, .55)); g.addColorStop(1, '#0a0b16'); c.fillStyle = g; c.fillRect(0, 0, 640, 360);
      for (let y = 0; y < 360; y += 4) { c.fillStyle = 'rgba(255,255,255,.03)'; c.fillRect(0, y, 640, 2); }
      c.fillStyle = G.col.dark(tc, .25); c.beginPath(); c.moveTo(0, 0); c.lineTo(330, 0); c.lineTo(260, 360); c.lineTo(0, 360); c.fill();
      c.fillStyle = tc; c.beginPath(); c.moveTo(330, 0); c.lineTo(338, 0); c.lineTo(268, 360); c.lineTo(260, 360); c.fill();
      const img = G.monArt.of(m, 'front', 0); c.drawImage(img, 20, 40, 288, 288);
      const T = (txt, x, y, px, col, font = 'SolPix14') => { c.font = px + 'px ' + font; c.fillStyle = '#07060c'; c.fillText(txt, x + 2, y + 2); c.fillStyle = col; c.fillText(txt, x, y); };
      c.textBaseline = 'top';
      T(G.mon.name(m), 350, 26, 28, '#ffffff');
      T(`${sp.name} · Lv ${m.lvl}${m.shiny ? ' · ★ SHINY' : ''}`, 352, 64, 14, '#ffe070', 'SolPix11');
      T(`Tamer ${m.ot || (G.save && G.save.name) || '?'}`, 352, 84, 14, '#b8c8e0', 'SolPix11');
      let y = 116;
      const marks = m.marks || [];
      if (m.form) { T(`TIDE FORM · ${label(m.form)}`, 352, y, 14, '#ff7ad8', 'SolPix11'); y += 22; }
      if (marks.length) for (const k of marks.slice(0, 4)) { c.fillStyle = color(k); c.fillRect(352, y, 8, 14); T(label(k), 368, y, 14, '#ffffff', 'SolPix11'); T(about(k), 368, y + 16, 11, '#9fb0c8', 'SolPix9'); y += 36; }
      else { T('No Tidemarks yet.', 352, y, 14, '#9fb0c8', 'SolPix11'); y += 24; }
      const h = hist(m), ko = Object.values(h.ko || {}).reduce((a, b) => a + b, 0);
      const stat = [['KOs', ko], ['Clutch saves', h.survived || 0], ['Crits', h.crits || 0], ['Steps together', h.steps || 0]];
      stat.forEach(([k, v], i) => { const x = 352 + (i % 2) * 140, yy = Math.max(y + 6, 262) + Math.floor(i / 2) * 26; T(String(v), x, yy, 14, '#ffffff', 'SolPix11'); T(k, x + c.measureText(String(v)).width + 8, yy + 2, 11, '#9fb0c8', 'SolPix9'); });
      c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(0, 334, 640, 26);
      T('SOLMERE · jiweep.github.io/solmere', 14, 340, 11, '#ffe8b0', 'SolPix9');
      T('one of one', 540, 340, 11, '#8af0e0', 'SolPix9');
      return cv;
    },
    saveCard(m) {
      try {
        const cv = this.card(m), a = document.createElement('a');
        a.href = cv.toDataURL('image/png'); a.download = `solmere-${G.mon.name(m).toLowerCase().replace(/[^a-z0-9]+/g, '-')}-card.png`;
        document.body.appendChild(a); a.click(); a.remove();
        G.audio && G.audio.sfx('item'); G.toast('Mon Card saved!');
      } catch (e) { G.toast('Couldn\'t make the card here.'); }
    },
    palette(m) {
      const t = tint(m), f = m.form && MARKS[m.form.id] ? MARKS[m.form.id].pal(m.form.arg) : null;
      return { h: t.h, s: t.s, form: f };
    },
  };
  return api;
})();
