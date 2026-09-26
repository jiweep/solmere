'use strict';
// ============================================================================
//  Battle animations: move effects by type & style, status effects, shiny
//  sparkle, orb throw / shake / capture.
// ============================================================================
(function () {
  const TC = G.TYPE_COLORS;
  const center = s => ({ x: s.x + s.offx, y: s.y - 30 * (s.sc || 1) + s.offy });
  // --------------------------------------------------- particle palettes
  function burst(sc, type, x, y, n = 12, power = 2.2, o = {}) {
    const P = sc.fxp;
    for (let i = 0; i < n; i++) {
      const a = G.rand() * Math.PI * 2, v = power * (.4 + G.rand() * .8);
      const base = { x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 18 + G.randInt(0, 12), drag: .92 };
      switch (type) {
        case 'fire': P.add({ ...base, vy: base.vy - 1, ay: -.05, size: 2.5 + G.rand() * 2, type: 'circle', color: G.pick(['#ff7a2a', '#ffb040', '#ffe070']), blend: 'lighter' }); break;
        case 'water': P.add({ ...base, ay: .12, size: 1.5 + G.rand() * 1.5, type: G.chance(.5) ? 'ring' : 'circle', lw: .8, color: G.pick(['#8ac8ff', '#ffffff', '#4a90e8']) }); break;
        case 'grass': P.add({ ...base, size: 2.2, type: 'leaf', rot: G.rand() * 6, vr: .2, color: G.pick(['#5ac04a', '#8ae060', '#3a9a3a']) }); break;
        case 'electric': P.add({ ...base, size: 1.6, type: 'line', len: 3, lw: 1.2, color: G.pick(['#fff070', '#ffffff', '#f4d040']), blend: 'lighter' }); break;
        case 'ice': P.add({ ...base, size: 2, type: 'star', rot: G.rand() * 6, color: G.pick(['#c8f4ff', '#ffffff', '#8ad8f8']) }); break;
        case 'fighting': P.add({ ...base, size: 3, type: 'star', color: G.pick(['#ff9a3a', '#ffe070', '#ff5a3a']) }); break;
        case 'poison': P.add({ ...base, vy: base.vy - .6, size: 2 + G.rand() * 2, type: 'circle', color: G.pick(['#b85ad8', '#8a3ab0', '#d88af0']) }); break;
        case 'ground': P.add({ ...base, vy: -Math.abs(base.vy) - 1.5, ay: .2, size: 2 + G.rand() * 2, color: G.pick(['#b89060', '#8a6a44', '#d8b080']) }); break;
        case 'flying': P.add({ ...base, size: 1.4, type: 'line', len: 5, lw: 1, color: 'rgba(255,255,255,.9)' }); break;
        case 'psychic': P.add({ ...base, size: 2 + G.rand() * 4, grow: 2, type: 'ring', lw: 1, color: G.pick(['#ff7ab0', '#ffb0d8', '#d87aff']) }); break;
        case 'bug': P.add({ ...base, size: 1.5, color: G.pick(['#b8d040', '#8aa820', '#e0f070']) }); break;
        case 'rock': P.add({ ...base, ay: .2, size: 2.5 + G.rand() * 2, color: G.pick(['#a89a80', '#7a6c58', '#c8b898']) }); break;
        case 'ghost': P.add({ ...base, size: 2.5 + G.rand() * 2, type: 'circle', color: G.pick(['#8a6ac8', '#4a3a7a', '#b89aff']), alpha: .8 }); break;
        case 'dragon': P.add({ ...base, size: 2.2, type: 'star', rot: G.rand() * 6, vr: .2, color: G.pick(['#8a5aff', '#5a8aff', '#c8a0ff']), blend: 'lighter' }); break;
        case 'dark': P.add({ ...base, size: 3 + G.rand() * 3, grow: 1.2, type: 'ring', lw: 1.5, color: G.pick(['#2a2030', '#5a4a6a', '#1a1420']) }); break;
        case 'steel': P.add({ ...base, size: 2, type: 'star', color: G.pick(['#ffffff', '#c8d0e0', '#9aa4b8']), blend: 'lighter' }); break;
        case 'fairy': P.add({ ...base, size: 2.2, type: 'star', rot: G.rand() * 6, color: G.pick(['#ffb0d8', '#fff0f8', '#ff8ac8']), blend: 'lighter' }); break;
        default: P.add({ ...base, size: 2.5, type: 'star', color: G.pick(['#ffffff', '#ffe8a0']) });
      }
    }
  }
  G.fxBurst = burst;
  function impact(sc, x, y, col, size = 16) {
    sc.fxp.add({ x, y, life: 10, type: 'star', size, color: '#ffffff', blend: 'lighter', fadeStart: .2 });
    sc.fxp.add({ x, y, life: 12, type: 'ring', size: 4, grow: 4, lw: 2, color: col || '#ffffff' });
  }
  async function lunge(sc, user, target, dist = 22) {
    const u = center(user), t = center(target);
    const dx = t.x - u.x, dy = t.y - u.y, L = Math.hypot(dx, dy) || 1;
    await G.tween(user, { offx: dx / L * dist, offy: dy / L * dist * .6 }, 6, G.ease.outQuad);
    const p = G.tween(user, { offx: 0, offy: 0 }, 10, G.ease.outQuad);
    return p;
  }
  async function shakeTarget(sc, s, n = 6) { for (let i = 0; i < n; i++) { s.offx = (i % 2 ? -3 : 3); await sc.wait(2); } s.offx = 0; }
  async function projectile(sc, type, from, to, frames = 18, o = {}) {
    const col = TC[type] || '#fff';
    for (let f = 0; f <= frames; f++) {
      const k = f / frames, x = G.lerp(from.x, to.x, k), y = G.lerp(from.y, to.y, k) - Math.sin(k * Math.PI) * (o.arc || 0);
      if (f % 1 === 0) burst(sc, type, x, y, o.density || 2, .6);
      if (o.core !== false) sc.fxp.add({ x, y, life: 6, type: 'circle', size: o.size || 4, color: col, blend: 'lighter' });
      await sc.wait(1);
    }
  }
  async function beam(sc, type, from, to, frames = 26, width = 5) {
    const col = TC[type] || '#fff';
    let t = 0;
    sc.animLayer = (b) => {
      const k = Math.min(1, t / 6), w = width * (t < frames - 6 ? 1 : (frames - t) / 6);
      const ex = G.lerp(from.x, to.x, k), ey = G.lerp(from.y, to.y, k);
      b.save(); b.globalCompositeOperation = 'lighter';
      b.strokeStyle = G.col.rgba(col, .55); b.lineWidth = w * 2.2; b.lineCap = 'round'; b.beginPath(); b.moveTo(from.x, from.y); b.lineTo(ex, ey); b.stroke();
      b.strokeStyle = 'rgba(255,255,255,.9)'; b.lineWidth = w * .8; b.beginPath(); b.moveTo(from.x, from.y); b.lineTo(ex, ey); b.stroke();
      b.restore();
    };
    for (; t < frames; t++) { if (t > 5) burst(sc, type, to.x + (G.rand() - .5) * 10, to.y + (G.rand() - .5) * 10, 2, 1.5); await sc.wait(1); }
    sc.animLayer = null;
  }
  async function bolt(sc, from, to, n = 3) {
    for (let r = 0; r < n; r++) {
      const pts = []; const seg = 7;
      for (let i = 0; i <= seg; i++) { const k = i / seg; pts.push([G.lerp(from.x, to.x, k) + (i && i < seg ? (G.rand() - .5) * 16 : 0), G.lerp(from.y, to.y, k) + (i && i < seg ? (G.rand() - .5) * 10 : 0)]); }
      sc.animLayer = (b) => { b.save(); b.globalCompositeOperation = 'lighter'; for (const [lw, col] of [[4, 'rgba(255,240,120,.5)'], [1.5, '#ffffff']]) { b.strokeStyle = col; b.lineWidth = lw; b.beginPath(); pts.forEach(([x, y], i) => i ? b.lineTo(x, y) : b.moveTo(x, y)); b.stroke(); } b.restore(); };
      sc.flash = 4; sc.flashCol = '#fff8c0';
      await sc.wait(5);
    }
    sc.animLayer = null;
  }
  async function slash(sc, s, col = '#ffffff', n = 3) {
    const c = center(s);
    for (let i = 0; i < n; i++) {
      const a = -.8 + i * .5, x0 = c.x - 18 + i * 8, y0 = c.y - 16;
      let t = 0;
      sc.animLayer = (b) => { const k = Math.min(1, t / 5); b.save(); b.globalCompositeOperation = 'lighter'; b.strokeStyle = col; b.lineWidth = 2.2 * (1 - t / 10); b.beginPath(); b.moveTo(x0, y0); b.lineTo(x0 + 22 * k, y0 + 30 * k); b.stroke(); b.restore(); };
      for (t = 0; t < 8; t++) await sc.wait(1);
    }
    sc.animLayer = null;
  }
  async function bite(sc, s, col = '#ffffff') {
    const c = center(s); let t = 0;
    sc.animLayer = (b) => {
      const k = Math.min(1, t / 7), gap = 22 * (1 - k) + 2;
      b.fillStyle = col; b.strokeStyle = '#2a2030'; b.lineWidth = 1;
      for (const dir of [-1, 1]) { b.beginPath(); const yy = c.y + dir * gap; b.moveTo(c.x - 16, yy); for (let i = 0; i <= 4; i++) b.lineTo(c.x - 16 + i * 8, yy + (i % 2 ? dir * -6 : 0)); b.lineTo(c.x + 16, yy + dir * 4); b.lineTo(c.x - 16, yy + dir * 4); b.fill(); b.stroke(); }
    };
    for (t = 0; t < 10; t++) await sc.wait(1);
    sc.animLayer = null;
  }
  async function rainDown(sc, type, targets, n = 10) {
    for (let i = 0; i < n; i++) {
      for (const s of targets) {
        const c = center(s), x = c.x + (G.rand() - .5) * 40;
        const col = type === 'rock' ? '#a89a80' : type === 'ice' ? '#c8f4ff' : TC[type];
        sc.fxp.add({ x, y: c.y - 70, vx: 0, vy: 6, life: 11, size: 4 + G.rand() * 2, color: col, type: type === 'ice' ? 'star' : undefined, upd: p => { if (p.t === p.life - 1) burst(sc, type, p.x, p.y, 3, 1.4); } });
      }
      await sc.wait(3);
    }
    await sc.wait(10);
  }
  async function aura(sc, s, col, rings = 3) {
    const c = center(s);
    for (let r = 0; r < rings; r++) {
      sc.fxp.add({ x: c.x, y: c.y + 20, life: 24, type: 'ring', size: 20, grow: .2, lw: 2, color: col, upd: p => { p.y -= 1.4; } });
      for (let i = 0; i < 6; i++) sc.fxp.add({ x: c.x + (G.rand() - .5) * 40, y: c.y + 20, vy: -1.5 - G.rand(), life: 24, size: 2, color: col, blend: 'lighter' });
      await sc.wait(8);
    }
  }
  async function sparkle(sc, s, col = '#bfffd8', n = 18) {
    const c = center(s);
    for (let i = 0; i < n; i++) { sc.fxp.add({ x: c.x + (G.rand() - .5) * 44, y: c.y + (G.rand() - .5) * 44, vy: -.4, life: 26, size: 2, type: 'star', color: col, blend: 'lighter' }); if (i % 3 === 0) await sc.wait(2); }
    await sc.wait(10);
  }
  async function waves(sc, type, from, to, n = 4) {
    const col = TC[type];
    for (let i = 0; i < n; i++) {
      sc.fxp.add({ x: from.x, y: from.y, vx: (to.x - from.x) / 20, vy: (to.y - from.y) / 20, life: 20, type: 'ring', size: 5, grow: 3, lw: 1.6, color: col, blend: 'lighter' });
      await sc.wait(4);
    }
    await sc.wait(14);
  }
  // ------------------------------------------------------------ dispatcher
  G.battleAnim = async function (sc, e) {
    const m = G.MOVES[e.move]; const user = sc.slot(e.ref); if (!user || !m) return;
    const targets = (e.targets || []).map(r => sc.slot(r)).filter(Boolean);
    const T = targets.filter(t => t !== user);
    const u = center(user); const t0 = T[0] ? center(T[0]) : { x: user.side === sc.persp ? 282 : 96, y: user.side === sc.persp ? 76 : 150 };
    const type = m.type, col = TC[type];
    G.audio && G.audio.moveSfx(m);
    // ---------------- status / self moves
    if (m.cat === 'status') {
      if (m.fx === 'protect') return;  // protectAnim event handles it
      if (m.weather) { const w = { sun: 'fire', rain: 'water', sand: 'rock', snow: 'ice' }[m.weather]; sc.flash = 12; sc.flashCol = G.col.rgba(TC[w], 1); await aura(sc, user, TC[w], 2); return; }
      if (m.heal || m.fx === 'weatherheal' || m.fx === 'rest' || m.fx === 'healbell') { await sparkle(sc, user, m.fx === 'rest' ? '#c8d8ff' : '#bfffd8'); return; }
      if (m.boost || m.fx === 'focusenergy' || m.fx === 'bellydrum') { await aura(sc, user, m.boost && (m.boost.spa || m.boost.spd) ? '#8ab8ff' : '#ff9a5a', 3); return; }
      if (m.screen) { sc.flash = 10; sc.flashCol = m.screen === 'reflect' ? '#ffd0a0' : m.screen === 'lightscreen' ? '#ffd0ff' : '#c8f0ff'; await aura(sc, user, '#fff8c8', 2); return; }
      if (m.hazard) { for (let i = 0; i < 6; i++) { const tx = t0.x + (G.rand() - .5) * 60; await projectile(sc, type, u, { x: tx, y: t0.y + 30 }, 10, { arc: 20, density: 1, size: 3 }); } return; }
      if (m.fx === 'trickroom') { sc.flash = 14; sc.flashCol = '#c8a0ff'; await sc.wait(20); return; }
      if (m.fx === 'substitute') { await sc.wait(10); return; }
      if (m.fx === 'leechseed') { await projectile(sc, 'grass', u, t0, 14, { arc: 26 }); burst(sc, 'grass', t0.x, t0.y, 10); await sc.wait(12); return; }
      if (m.fx === 'defog') { for (let i = 0; i < 20; i++) { sc.fxp.add({ x: -10, y: 40 + G.rand() * 120, vx: 8, vy: 0, life: 50, type: 'line', len: 4, lw: 1.2, color: 'rgba(255,255,255,.8)' }); await sc.wait(1); } await sc.wait(14); return; }
      if (m.fx === 'flop') { for (let i = 0; i < 3; i++) { await G.tween(user, { offy: -10 }, 6, G.ease.outQuad); await G.tween(user, { offy: 0 }, 6, G.ease.inQuad); } return; }
      if (m.fx === 'roar' || m.sound) { await waves(sc, 'normal', u, t0, 4); return; }
      // targeted status effects
      if (T.length) {
        if (m.powder) { for (let i = 0; i < 20; i++) { sc.fxp.add({ x: t0.x + (G.rand() - .5) * 50, y: t0.y - 40, vy: .9 + G.rand(), vx: (G.rand() - .5) * .4, life: 45, size: 1.5, color: m.status === 'slp' ? '#b8e0ff' : m.status === 'par' ? '#fff070' : '#d88af0' }); if (i % 3 === 0) await sc.wait(1); } await sc.wait(24); return; }
        if (m.stats) { await waves(sc, type, u, t0, 3); return; }
        await projectile(sc, type, u, t0, 14); burst(sc, type, t0.x, t0.y, 10, 1.5); await sc.wait(10); return;
      }
      await aura(sc, user, col, 2); return;
    }
    // ---------------- damaging moves
    const spread = m.target === 'foes' || m.target === 'all';
    if (m.fx === 'recharge' || m.id === 'dracometeor' || m.id === 'tidalhymn' || m.id === 'solarflare' || m.id === 'voidrend') {
      // signature/heavy: charge glow + big effect
      for (let i = 0; i < 14; i++) { const a = G.rand() * 6.28; sc.fxp.add({ x: u.x + Math.cos(a) * 36, y: u.y + Math.sin(a) * 30, vx: -Math.cos(a) * 2.4, vy: -Math.sin(a) * 2, life: 15, size: 2, color: col, blend: 'lighter' }); await sc.wait(1); }
      if (m.id === 'dracometeor') { sc.flash = 8; sc.flashCol = '#c8a0ff'; await rainDown(sc, 'dragon', T.length ? T : [user], 8); }
      else if (m.id === 'tidalhymn') { await waves(sc, 'water', u, t0, 6); for (const s of T) burst(sc, 'water', center(s).x, center(s).y, 16, 2.4); }
      else await beam(sc, type, u, t0, 30, 7);
      sc.shake = 14; for (const s of T) { impact(sc, center(s).x, center(s).y, col, 22); burst(sc, type, center(s).x, center(s).y, 18, 3); }
      await sc.wait(12); return;
    }
    if (m.id === 'earthquake' || m.id === 'bulldoze' || m.id === 'earthpower') {
      sc.shake = m.id === 'earthquake' ? 30 : 18;
      for (let i = 0; i < 8; i++) { for (const s of T) burst(sc, 'ground', center(s).x + (G.rand() - .5) * 30, center(s).y + 28, 3, 2); await sc.wait(3); }
      await sc.wait(8); return;
    }
    if (m.id === 'rockslide' || m.id === 'stoneedge' || m.id === 'blizzard' || m.id === 'icicledrop' || m.id === 'rocktomb' || m.id === 'rockthrow' || m.id === 'hurricane' && false) { await rainDown(sc, type, T, m.id === 'rockslide' || m.id === 'blizzard' ? 12 : 6); sc.shake = 10; return; }
    if (spread && (m.cat === 'spec' || !m.contact)) {
      if (m.sound) await waves(sc, type, u, t0, 5);
      else if (type === 'fire' || type === 'water' || type === 'electric' || type === 'ice' || type === 'fairy' || type === 'psychic' || type === 'normal') {
        for (let i = 0; i < 12; i++) { for (const s of T) burst(sc, type, center(s).x + (G.rand() - .5) * 30, center(s).y + (G.rand() - .5) * 26, 2, 1.8); await sc.wait(2); }
      } else for (const s of T) await projectile(sc, type, u, center(s), 12, { density: 2 });
      for (const s of T) impact(sc, center(s).x, center(s).y, col);
      await sc.wait(8); return;
    }
    if (m.contact) {
      if (m.bite) { await lunge(sc, user, T[0] || user, 16); await bite(sc, T[0] || user, type === 'fire' ? '#ffb040' : type === 'ice' ? '#c8f4ff' : type === 'electric' ? '#fff070' : '#ffffff'); burst(sc, type, t0.x, t0.y, 10, 2); await sc.wait(6); return; }
      if (m.slice || m.id === 'crosscut' || m.id === 'slash') { await lunge(sc, user, T[0] || user, 18); await slash(sc, T[0] || user, type === 'normal' ? '#ffffff' : G.col.light(col, .4), m.id === 'crosscut' ? 2 : 3); burst(sc, type, t0.x, t0.y, 8, 2); return; }
      const d = m.pri > 0 ? 36 : 24;
      await lunge(sc, user, T[0] || user, d);
      impact(sc, t0.x, t0.y, col, m.pow >= 90 ? 22 : 16);
      burst(sc, type, t0.x, t0.y, m.pow >= 90 ? 18 : 12, m.pow >= 90 ? 3 : 2.2);
      if (m.pow >= 100) sc.shake = 12;
      await sc.wait(10); return;
    }
    // special single-target: pick by type
    switch (type) {
      case 'electric': if (m.pow >= 90) { await bolt(sc, { x: t0.x + 10, y: 0 }, t0, 3); } else await bolt(sc, u, t0, 2); burst(sc, type, t0.x, t0.y, 14, 2.4); break;
      case 'psychic': case 'dark': case 'ghost': if (m.pulse || type !== 'ghost') await waves(sc, type, u, t0, 4); else await projectile(sc, type, u, t0, 16, { size: 6 }); burst(sc, type, t0.x, t0.y, 12, 2); break;
      case 'fire': case 'water': case 'ice': case 'grass': case 'poison': case 'fairy': case 'dragon': case 'steel':
        if (m.pow >= 90 && m.acc !== true && !m.ball) await beam(sc, type, u, t0, 22, 4);
        else await projectile(sc, type, u, t0, 16, { arc: m.ball ? 20 : 0, density: 3, size: m.ball ? 6 : 4 });
        impact(sc, t0.x, t0.y, col); burst(sc, type, t0.x, t0.y, 14, 2.2); break;
      default: await projectile(sc, type, u, t0, 14, { density: 2 }); impact(sc, t0.x, t0.y, col); burst(sc, type, t0.x, t0.y, 10, 2);
    }
    if (m.drain) { for (let i = 0; i < 8; i++) { sc.fxp.add({ x: t0.x, y: t0.y, vx: (u.x - t0.x) / 22, vy: (u.y - t0.y) / 22, life: 22, size: 2.5, type: 'circle', color: '#8aff9a', blend: 'lighter' }); await sc.wait(2); } }
    await sc.wait(8);
  };
  // ------------------------------------------------------------ statuses
  G.statusAnim = async function (sc, ref, st) {
    const s = sc.slot(ref); if (!s) return; const c = center(s);
    if (st === 'brn') { for (let i = 0; i < 10; i++) { burst(sc, 'fire', c.x + (G.rand() - .5) * 30, c.y + 10, 2, 1); await sc.wait(2); } }
    else if (st === 'par') { await bolt(sc, { x: c.x - 16, y: c.y - 16 }, { x: c.x + 16, y: c.y + 16 }, 2); }
    else if (st === 'psn' || st === 'tox') { for (let i = 0; i < 10; i++) { burst(sc, 'poison', c.x + (G.rand() - .5) * 30, c.y + 14, 1, .8); await sc.wait(2); } }
    else if (st === 'slp') { for (let i = 0; i < 3; i++) { sc.fxp.add({ x: c.x + 14 + i * 4, y: c.y - 16, vx: .4, vy: -.6, life: 36, type: 'star', size: 2.5 - i * .4, color: '#c8d8ff' }); await sc.wait(8); } }
    else if (st === 'frz') { for (let i = 0; i < 10; i++) { burst(sc, 'ice', c.x + (G.rand() - .5) * 30, c.y + (G.rand() - .5) * 30, 1, .6); await sc.wait(1); } }
    else if (st === 'conf') { for (let i = 0; i < 16; i++) { const a = i / 16 * 6.28 * 2; sc.fxp.add({ x: c.x + Math.cos(a) * 18, y: c.y - 30 + Math.sin(a) * 5, life: 10, type: 'star', size: 2, color: '#fff070' }); await sc.wait(1); } }
    await sc.wait(8);
  };
  G.shinyAnim = async function (sc, s) {
    G.audio && G.audio.sfx('shiny');
    const c = center(s);
    for (let i = 0; i < 3; i++) { for (let k = 0; k < 6; k++) { const a = k / 6 * 6.28 + i; sc.fxp.add({ x: c.x + Math.cos(a) * 20, y: c.y + Math.sin(a) * 20, vx: Math.cos(a) * .8, vy: Math.sin(a) * .8, life: 22, type: 'star', size: 3, color: '#fff8b0', blend: 'lighter' }); } await sc.wait(8); }
    await sc.wait(14);
  };
  // ------------------------------------------------------------ catching
  // The throw ring: a ring closes in on the target; release (A) as it shrinks into the target zone.
  // Inside the zone: Nice, deeper: Great, near the centre: Perfect. The zone is smaller for Echoes that
  // are hard to catch. Resolves to 0-3 (miss/nice/great/perfect), or -1 when backed out with B.
  G.throwRing = function (sc, t) {
    return new Promise(res => {
      let a = 60; try { a = t.bt.catchChance(t, { ball: 1 }).a; } catch (e) { }
      const zone = 7 + 13 * Math.min(1, Math.max(0, a / 255)), R0 = 46, PER = 62;
      const s = sc.slot(t.ref()), NAMES = ['MISS', 'NICE!', 'GREAT!', 'PERFECT!'], COLS = ['#a0a8c0', '#8af0a0', '#7ad8ff', '#ffe070'];
      const pos = () => { const C = sc.cam, z = C ? C.z : 1, x = s.x + s.offx, y = s.y - 30 * (s.sc || 1) + s.offy;
        return C ? { x: (x - C.cx + C.x) * z + C.cx, y: (y - C.cy + C.y) * z + C.cy } : { x, y }; };
      G.push({
        lowres: false, t: 0, done: null, dt: 0,
        radius() { const k = (this.t % PER) / PER; return R0 * (1 - k * k * (3 - 2 * k) * 1.02) + 1; },
        update(top) {
          this.t++;
          if (this.done !== null) { if (++this.dt > 34) { G.pop(this); res(this.done); } return; }
          if (!top) return;
          const I = G.input;
          if (I.pressed('b')) { I.consume('b'); G.audio && G.audio.sfx('back'); G.pop(this); res(-1); return; }
          if (I.pressed('a')) {
            I.consume('a');
            const r = this.radius(), q = r > zone ? 0 : r > zone * .62 ? 1 : r > zone * .3 ? 2 : 3;
            this.done = q; this.hitR = r;
            G.audio && G.audio.sfx(q === 3 ? 'shiny' : q ? 'select' : 'buzz');
            if (q >= 2) for (let i = 0; i < (q === 3 ? 16 : 8); i++) { const an = i / (q === 3 ? 16 : 8) * Math.PI * 2, p = pos(); sc.fxp.add({ x: p.x, y: p.y, vx: Math.cos(an) * 2.4, vy: Math.sin(an) * 2.4, drag: .9, life: 24, type: 'star', size: q === 3 ? 3 : 2, color: COLS[q], blend: 'lighter' }); }
          }
        },
        drawUI() {
          const U = G.ui, c = U.c, S = G.gfx.S, p = pos();
          const ring = (r, col, w, al) => { c.save(); c.globalAlpha = al; c.strokeStyle = col; c.lineWidth = w * S; c.beginPath(); c.arc(U.X(p.x), U.Y(p.y), r * S, 0, Math.PI * 2); c.stroke(); c.restore(); };
          // the zone, banded: nice, great, perfect
          c.save(); c.globalAlpha = .22; c.fillStyle = '#8af0a0'; c.beginPath(); c.arc(U.X(p.x), U.Y(p.y), zone * S, 0, Math.PI * 2); c.fill();
          c.fillStyle = '#7ad8ff'; c.beginPath(); c.arc(U.X(p.x), U.Y(p.y), zone * .62 * S, 0, Math.PI * 2); c.fill();
          c.globalAlpha = .35; c.fillStyle = '#ffe070'; c.beginPath(); c.arc(U.X(p.x), U.Y(p.y), zone * .3 * S, 0, Math.PI * 2); c.fill(); c.restore();
          ring(zone, '#ffffff', 1, .7);
          if (this.done === null) {
            const r = this.radius(), inZ = r <= zone;
            ring(r, inZ ? (r <= zone * .3 ? '#ffe070' : r <= zone * .62 ? '#7ad8ff' : '#8af0a0') : '#ff6a7a', 2.2, 1);
            U.text('Z throw · X back', p.x, p.y - R0 - 12, { size: 6, weight: 800, align: 'center', color: '#ffffff', outline: 'rgba(0,0,0,.6)' });
          } else {
            const k = Math.min(1, this.dt / 6), q = this.done;
            ring(this.hitR + this.dt * 1.5, COLS[q], 2, 1 - this.dt / 34);
            U.text(NAMES[q], p.x, p.y - 34 - k * 6, { size: 8 + (q === 3 ? 6 : q * 2) * (1.3 - .3 * k), weight: 900, align: 'center', color: COLS[q], outline: '#1a0a20', alpha: 1 - Math.max(0, this.dt - 24) / 10 });
          }
        },
      });
    });
  };
  G.throwAnim = async function (sc, e) {
    const s = sc.slot(e.ref); if (!s) return;
    const c = center(s);
    const ic = G.ITEMS[e.ball] ? G.ITEMS[e.ball].ic : '#e8484a';
    const orb = { x: 40, y: 170, rot: 0, ball: e.ball };
    sc.thrown = orb;
    G.audio && G.audio.sfx('throw');
    const tx = c.x, ty = c.y - 6;
    for (let f = 0; f <= 26; f++) { const k = f / 26; orb.x = G.lerp(40, tx, k); orb.y = G.lerp(170, ty, k) - Math.sin(k * Math.PI) * 60; orb.rot += .45; await sc.wait(1); }
    if (e.blocked) { for (let f = 0; f < 18; f++) { orb.x -= 4; orb.y += f * .4; orb.rot -= .3; await sc.wait(1); } sc.thrown = null; G.audio && G.audio.sfx('bump'); return; }
    if (e.deflect) { for (let f = 0; f < 18; f++) { orb.x += 3; orb.y -= 2 - f * .3; await sc.wait(1); } sc.thrown = null; return; }
    G.audio && G.audio.sfx('pop');
    s.flash = 1; s.flashCol = '#ff8a8a';
    await G.tween(s, { scale: 0 }, 12, G.ease.inQuad);
    s.visible = false;
    // fall to ground
    const gy = s.y - 6;
    for (let f = 0; f < 10; f++) { orb.y = G.lerp(ty, gy, f / 10); await sc.wait(1); }
    G.audio && G.audio.sfx('land');
    await sc.wait(20);
    for (let i = 0; i < e.shakes; i++) {
      G.audio && G.audio.sfx('shake');
      for (let f = 0; f < 16; f++) { orb.rot = Math.sin(f / 16 * Math.PI * 2) * .5; orb.x = tx + Math.sin(f / 16 * Math.PI * 2) * 2; await sc.wait(1); }
      orb.rot = 0; await sc.wait(22);
    }
    if (e.caught) {
      G.audio && G.audio.sfx('click');
      for (let i = 0; i < 3; i++) sc.fxp.add({ x: orb.x, y: orb.y - 4, vx: (i - 1) * 1.2, vy: -1.5, ay: .05, life: 30, type: 'star', size: 3, color: '#fff8b0' });
      await sc.wait(20);
      orb.dim = true;
      s.caughtOrb = orb;
      return;
    }
    // break free
    G.audio && G.audio.sfx('pop');
    sc.thrown = null;
    for (let i = 0; i < 12; i++) sc.fxp.add({ x: orb.x, y: orb.y, vx: Math.cos(i) * 2, vy: Math.sin(i) * 2, life: 16, type: 'star', size: 2, color: '#ffffff' });
    s.visible = true; s.flash = 1;
    await G.tween(s, { scale: 1 }, 12, G.ease.outBack);
    s.flash = 0; s.flashCol = null;
    G.audio && G.audio.cry(s.sp);
    await sc.wait(10);
  };
})();
