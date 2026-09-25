'use strict';
// ============================================================================
//  Title screen, new game setup, continue, debug (God Mode) menu
// ============================================================================
// stepped pixel glow: concentric rings in a few discrete strengths (no smooth gradients, so light
// reads as pixel art like the rest of the game)
G.pxGlow = function (b, x, y, r, rgb, a, steps = 4) {
  b.save(); b.globalCompositeOperation = 'lighter';
  for (let i = 0; i < steps; i++) {
    const rr = Math.round(r * (1 - i / steps));
    b.fillStyle = `rgba(${rgb},${(a / steps).toFixed(3)})`; b.beginPath(); b.arc(Math.round(x), Math.round(y), rr, 0, Math.PI * 2); b.fill();
  }
  b.restore();
};
G.TitleScene = class {
  constructor() { this.opaque = true; this.t = 0; this.stage = 'press'; this.parts = new G.Particles(); this.menu = null; }
  enter() { G.audio && G.audio.music('title'); }
  update(top) {
    this.t++; this.parts.update();
    if (this.t % 4 === 0) this.parts.add({ x: G.rand() * G.W, y: 150 + G.rand() * 60, vx: -.1, vy: -.18, life: 220, size: 1, color: G.pick(['#bff8ff', '#ffe0b0']), fadeIn: 60, blend: 'lighter' });
    if (!top) return;
    if (this.stage === 'press' && this.t > 40 && G.input.anyKeyThisFrame) { G.input.consumeAll(); G.audio && G.audio.sfx('select'); this.stage = 'menu'; G.run(() => this.mainMenu()); }
  }
  async mainMenu() {
    while (true) {
      const slots = [1, 2, 3].map(s => G.persist.summary(s));
      const has = slots.some(Boolean);
      const items = [];
      if (has) items.push({ id: 'cont', label: 'Continue' });
      items.push({ id: 'new', label: 'New Game' }, { id: 'showcase', label: 'Showcase' }, { id: 'opts', label: 'Options' }, { id: 'music', label: 'Music Room' }, { id: 'import', label: 'Import Save File' }, { id: 'help', label: 'How to Play' }, { id: 'credits', label: 'Credits' });
      const k = await G.choose(items, { x: G.W / 2 - 50, y: 124, w: 100, cancel: -1 });
      if (k < 0) { this.stage = 'press'; return; }
      const id = items[k].id;
      if (id === 'cont') { const s = await G.pickSlot('Continue which journey?', true); if (s) { await G.startFromSave(G.persist.read(s)); return; } }
      if (id === 'new') { const ok = await G.newGameFlow(); if (ok) return; }
      if (id === 'opts') { const prev = G.save; if (!G.save) G.save = G.newSave(); await G.openOptions(); if (!prev) G.save = null; }
      if (id === 'import') await G.importSave();
      if (id === 'help') await G.howToPlay();
      if (id === 'credits') await G.rollCredits(false);
      if (id === 'showcase') { await G.openShowcase(); if (!G.findScene(G.TitleScene)) return; }
      if (id === 'music') { await G.musicRoom(); G.audio && G.audio.music('title'); }
    }
  }
  // ------------------------------------------------------------------ 3D title scene
  // A slow camera drifts over a perspective ocean at dusk: the sea is rendered per pixel (waves,
  // moon glitter, distance fog), the lighthouse is a lit 3D cylinder the camera orbits, and its beam
  // sweeps in 3D. The opening tilts down from the stars to the horizon.
  draw(b) {
    const t = this.t, W = G.W, H = G.H;
    const tilt = G.ease.outCubic(Math.min(1, t / 170));
    const hz = Math.round(330 - (330 - 120) * tilt);            // horizon line
    const f = 230, camH = 26, camX = Math.sin(t / 700) * 70, camZ = t * .35;
    const orbit = Math.sin(t / 700) * .5;
    if (!this._sky) this._sky = this.buildSky();
    // sky (pre-rendered tall strip, slides as the camera tilts)
    b.drawImage(this._sky, 0, hz - 330, W, 330);
    for (let i = 0; i < 110; i++) {
      const sx = (i * 97 + 13) % W, sy = hz - 330 + (i * 53) % 240;
      if (sy > hz - 40) continue;
      const tw = .35 + .65 * Math.abs(Math.sin(t / 37 + i * 1.7));
      b.fillStyle = `rgba(255,${240 + (i % 3) * 5},${220 + (i % 4) * 10},${tw * (1 - Math.max(0, (sy - (hz - 150)) / 110))})`; b.fillRect(sx, sy, i % 9 === 0 ? 2 : 1, i % 9 === 0 ? 2 : 1);
    }
    // moon + glow
    const mx = 292 - camX * .15, my = hz - 78;
    b.save(); b.globalCompositeOperation = 'lighter';
    b.restore(); G.pxGlow(b, mx, my, 30, '255,236,200', .18, 3); b.save();
    b.restore();
    b.fillStyle = '#fff6dc'; b.beginPath(); b.arc(Math.round(mx), Math.round(my), 11, 0, Math.PI * 2); b.fill();
    b.fillStyle = 'rgba(210,200,170,.55)'; b.fillRect(Math.round(mx) - 4, Math.round(my) - 3, 3, 3); b.fillRect(Math.round(mx) + 3, Math.round(my) + 2, 4, 2);
    // drifting cloud layers (parallax)
    if (!this._clouds) this._clouds = [0, 1, 2, 3, 4].map(i => this.buildCloud(i));
    this._clouds.forEach((c, i) => {
      const depth = .25 + (i % 3) * .2, x = ((i * 131 - camX * depth - t * .06 * (1 + i % 2)) % (W + 160) + W + 160) % (W + 160) - 110;
      b.globalAlpha = .85; b.drawImage(c, Math.round(x), Math.round(hz - 118 + i * 17)); b.globalAlpha = 1;
    });
    // distant islands and mountains on the horizon
    if (!this._ridge) this._ridge = this.buildRidge();
    const rx = -((camX * .5) % 256 + 256) % 256;
    for (let k = -1; k < 3; k++) b.drawImage(this._ridge, Math.round(rx + k * 256), hz - this._ridge.height + 1);
    // the sea, per pixel
    this.drawSea(b, hz, f, camH, camX, camZ, mx, t);
    // lighthouse island (3D): world position, projected
    const LX = -95, LZ = 330, lz = LZ, s = f / lz;
    const bx = W / 2 + (LX - camX) * s, by = hz + camH * s;
    this.drawIsland(b, bx, by, s, orbit, t);
    // Orrelume breaching far out
    const k = this.breachK !== undefined && this.breachK !== null ? this.breachK : (t % 1100) / 1100;
    if (k > .2 && k < .5) {
      const p = (k - .2) / .3, z = this.glowBreach ? 300 : 520, sz = f / z, wx = this.glowBreach ? 60 + p * 50 : 80 + p * 90;
      const x = W / 2 + (wx - camX) * sz, y = hz + camH * sz - Math.sin(p * Math.PI) * (this.glowBreach ? 40 : 26);
      b.save(); b.globalAlpha = Math.sin(p * Math.PI) * .95; b.translate(x, y); b.rotate(-Math.cos(p * Math.PI) * .5); b.scale(this.glowBreach ? 1.1 : .55, this.glowBreach ? 1.1 : .55);
      if (this.glowBreach) {
        // the leviathan itself: dark body with its lighthouse-orbs blazing, and a halo on the water
        b.drawImage(G.pix.silhouette(G.monArt.front('orrelume', false, 0), '#0c1640'), -48, -80);
        b.globalAlpha = Math.min(1, b.globalAlpha * 1.4); b.drawImage(G.monArt.front('orrelume', false, 0), -48, -80); b.globalCompositeOperation = 'lighter'; b.globalAlpha *= .35; b.drawImage(G.monArt.front('orrelume', false, 0), -48, -80);
      } else b.drawImage(G.pix.silhouette(G.monArt.front('orrelume', false, 0), '#101838'), -48, -80);
      b.restore();
      if (this.glowBreach) G.pxGlow(b, x, y - 30, 60 + Math.sin(t / 6) * 4, '120,200,255', .45 * Math.sin(p * Math.PI), 5);
      if ((p > .92 || p < .08) && t % 2 === 0) for (let i = 0; i < 2; i++) this.parts.add({ x, y: hz + camH * sz, vx: (G.rand() - .5) * 1.4, vy: -.6 - G.rand() * 1.2, ay: .05, life: 34, size: 1, color: '#d8f4ff' });
    }
    this.parts.draw(b);
    // vignette
    // stepped vignette: three hard-edged frames
    for (let i = 0; i < 3; i++) { b.fillStyle = 'rgba(0,0,12,.12)'; const m = 4 + i * 5; b.fillRect(0, 0, W, m); b.fillRect(0, H - m, W, m); b.fillRect(0, 0, m, H); b.fillRect(W - m, 0, m, H); }
  }
  buildSky() {
    // banded dusk sky with dithered seams: navy -> violet -> rose -> amber at the horizon
    const W = G.W, Hs = 330, p = new G.Painter(W, Hs);
    const stops = [[0, '#060a1e'], [.45, '#1a1c4a'], [.68, '#4a2e6e'], [.84, '#a0507a'], [.94, '#e88a6a'], [1, '#ffc27a']].map(([k, c]) => [k, G.rgb(c)]);
    const bands = 26;
    const col = (u) => { for (let i = 1; i < stops.length; i++) if (u <= stops[i][0]) { const [k0, c0] = stops[i - 1], [k1, c1] = stops[i]; return G.mixc(c0, c1, (u - k0) / (k1 - k0)); } return stops[stops.length - 1][1]; };
    for (let y = 0; y < Hs; y++) {
      const u = y / (Hs - 1), q = Math.floor(u * bands), fr = u * bands - q;
      const c0 = col(q / bands), c1 = col(Math.min(1, (q + 1) / bands));
      for (let x = 0; x < W; x++) p.set(x, y, fr > .78 && ((x + y) & 1) ? c1 : c0);
    }
    return p.done();
  }
  buildCloud(i) {
    const rng = new G.RNG(900 + i), w = 70 + rng.int(0, 60), p = new G.Painter(w + 10, 26);
    const L = [G.rgb('#3a2c5a'), G.rgb('#6a4a7e'), G.rgb('#b8708a'), G.rgb('#f0a080')];
    const n = 4 + rng.int(0, 3);
    for (let k = 0; k < n; k++) {
      const cx = 8 + (k + .5) * w / n + rng.range(-4, 4), cy = 18 - rng.range(0, 7), r = rng.range(5, 9);
      for (let y = Math.floor(cy - r); y < 24; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
        if ((x - cx) ** 2 + (y - cy) ** 2 > r * r && y < cy) continue;
        if (y > 21) continue;
        const lit = (y - cy) < -r * .4 ? 3 : (y - cy) < 0 ? 2 : y > 19 ? 0 : 1;
        p.set(x, y, L[lit]);
      }
    }
    return p.done();
  }
  buildIsle(w, h) {
    // rocky islet in pixel art: dark outline, lit upper-left faces, a grassy crown with tufts
    const W = w + 8, H = h + 10, p = new G.Painter(W, H), cx = W / 2, cy = h * .62;
    const R = G.ramp(['#0e0c18', '#1e1a2c', '#2e2840', '#433a58', '#5a4e6e']), Gr = G.ramp(['#1a3a2c', '#24503a', '#326a44', '#44844e']);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const nx = (x - cx) / (w * .5), ny = (y - cy) / (h * .62);
      const top = ny < 0 ? nx * nx + (ny * 1.6) ** 2 : nx * nx + (ny * .9) ** 2;
      if (top > 1) continue;
      const lit = -nx * .6 - ny * .8 + (G.h2(x >> 1, y >> 1, 3) - .5) * .5;
      let c = R[lit > .5 ? 4 : lit > .1 ? 3 : lit > -.3 ? 2 : 1];
      if (ny < -.25 && top < .8) c = Gr[lit > .6 ? 3 : lit > .1 ? 2 : 1];
      if (top > .9) c = R[0];
      p.set(x, y, c);
    }
    for (let i = 0; i < 14; i++) { const x = Math.round(cx - w * .3 + i * w * .045), y = Math.round(cy - h * .5 + Math.abs(i - 7) * .35); p.set(x, y - 1, Gr[3]); p.set(x + 1, y - 2, Gr[2]); }
    return p.done();
  }
  buildRidge() {
    const p = new G.Painter(256, 40), A = G.rgb('#1c1838'), B = G.rgb('#2c2450'), C = G.rgb('#4a3060');
    for (let x = 0; x < 256; x++) {
      const h = Math.round(6 + G.fbm(x / 34, 3, 3, 3) * 26 * (x > 60 && x < 190 ? 1 : .45));
      for (let y = 40 - h; y < 40; y++) p.set(x, y, y < 40 - h + 2 ? C : (G.h2(x >> 1, y >> 1, 4) > .75 ? B : A));
    }
    return p.done();
  }
  drawSea(b, hz, f, camH, camX, camZ, mx, t) {
    const W = G.W, H = G.H, top = Math.max(0, hz), rows = H - top;
    if (rows <= 0) return;
    if (!this._seaImg || this._seaImg.height !== rows) { this._seaCv = G.makeCanvas(W, rows); this._seaCx = this._seaCv.getContext('2d'); this._seaImg = this._seaCx.createImageData(W, rows); }
    const d = this._seaImg.data;
    const R = [[10, 18, 48], [14, 30, 74], [22, 48, 104], [36, 72, 136], [60, 104, 168], [96, 144, 196]];
    const fog = [96, 64, 110], glit = [255, 236, 190];
    const tt = t * .045;
    for (let j = 0; j < rows; j++) {
      const y = top + j, dy = y - hz + .5;
      if (dy <= 0) continue;
      const z = f * camH / dy, wz = camZ + z, fogk = Math.min(1, z / 900);
      for (let x = 0; x < W; x++) {
        const wx = camX + (x - W / 2) * z / f;
        // slope of a few crossing swells gives the shading
        const s1 = Math.cos(wz * .31 + wx * .07 - tt * 2), s2 = Math.cos(wz * .52 - wx * .23 + tt * 2.6), s3 = Math.cos(wx * .6 + wz * .17 + tt * 1.4);
        const sl = s1 * .55 + s2 * .3 + s3 * .15;
        let k = Math.max(0, Math.min(5, Math.floor(2.4 + sl * 1.9 + (1 - fogk) * 1.2)));
        let c = R[k];
        // moon glitter: a column under the moon, broken up by the swell crests
        const dxm = Math.abs(x - mx) / (5 + dy * .22);
        const o = (j * W + x) * 4;
        let r = c[0], g = c[1], bl = c[2];
        if (dxm < 1 && sl > .35 + dxm * .5 && ((x + j) % 2 === 0 || dxm < .4)) { r = glit[0]; g = glit[1]; bl = glit[2]; }
        const fk = fogk * .8;
        d[o] = r + (fog[0] - r) * fk; d[o + 1] = g + (fog[1] - g) * fk; d[o + 2] = bl + (fog[2] - bl) * fk; d[o + 3] = 255;
      }
    }
    this._seaCx.putImageData(this._seaImg, 0, 0);
    b.drawImage(this._seaCv, 0, top);
  }
  drawIsland(b, bx, by, s, orbit, t) {
    const sc = s * 1.0;
    const iw = 150 * sc, ih = 28 * sc;
    if (!this._isle) this._isle = this.buildIsle(Math.round(iw), Math.round(ih));
    b.drawImage(this._isle, Math.round(bx - this._isle.width / 2), Math.round(by - ih * .62));
    // shore foam flickers along the waterline
    for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2, fx = bx + Math.cos(a) * iw * .6, fy = by + ih * .32 + Math.sin(a) * ih * .18; if (Math.sin(t / 9 + i * 1.7) > .3) { b.fillStyle = '#d8ecff'; b.fillRect(Math.round(fx), Math.round(fy), 2, 1); } }
    // lighthouse: a lit cylinder with red/white bands; the lit side follows the camera orbit
    const r = 9 * sc, h = 78 * sc, x0 = bx + 6 * sc, yb = by - ih * .35, yt = yb - h;
    const light = -.9 + orbit;   // sun/moon light direction relative to the view
    for (let px = Math.floor(x0 - r); px <= x0 + r; px++) {
      const u = (px + .5 - x0) / r; if (Math.abs(u) > 1) continue;
      const th = Math.asin(u), I = Math.max(0, Math.cos(th - light)) * .75 + .25;
      const taper = 1 - .18 * 0;   // straight tower
      for (let py = Math.floor(yt); py < yb; py++) {
        const v = (py - yt) / h, band = Math.floor(v * 6) % 2;
        const base = band ? [196, 60, 64] : [232, 228, 236];
        const k = I * (1 - v * .15);
        b.fillStyle = `rgb(${base[0] * k | 0},${base[1] * k | 0},${base[2] * k | 0})`; b.fillRect(px, py, 1, 1);
      }
    }
    b.fillStyle = '#12101c'; b.fillRect(Math.floor(x0 - r) - 1, Math.floor(yt), 1, Math.ceil(yb - yt)); b.fillRect(Math.floor(x0 + r) + 1, Math.floor(yt), 1, Math.ceil(yb - yt));
    // gallery and lamp room
    b.fillStyle = '#1e222e'; b.fillRect(Math.round(x0 - r - 2), Math.round(yt - 2), Math.round(r * 2 + 4), 3);
    const lampY = yt - 8 * sc;
    b.fillStyle = '#2a2e3a'; b.fillRect(Math.round(x0 - r * .7), Math.round(lampY - 2), Math.round(r * 1.4), Math.round(8 * sc));
    b.fillStyle = '#fff2a8'; b.fillRect(Math.round(x0 - r * .45), Math.round(lampY), Math.round(r * .9), Math.round(5 * sc));
    b.fillStyle = '#a83a3a'; b.beginPath(); b.moveTo(x0 - r * .9, lampY - 2); b.lineTo(x0, lampY - 9 * sc); b.lineTo(x0 + r * .9, lampY - 2); b.fill();
    // rotating beam, projected: a wedge whose far end sweeps around the tower in 3D
    const lamp = this.lampLevel === undefined ? 1 : this.lampLevel;
    if (lamp <= 0) return;   // the light is out (prologue)
    const phi = t / 55, dirx = Math.cos(phi), dirz = Math.sin(phi);
    const towardCam = Math.max(0, -dirz);
    const L = 260, ex = x0 + dirx * L * (1 - Math.max(0, dirz) * .6), ey = lampY + 3 + dirz * 18;
    b.save(); b.globalCompositeOperation = 'lighter';
    const bw = 10 + 26 * (1 - Math.abs(dirz)) + 30 * towardCam;
    for (let i = 0; i < 3; i++) {
      const wk = 1 - i * .3, lk = 1 - i * .28;
      b.fillStyle = `rgba(255,244,190,${((.1 + towardCam * .1) * lamp).toFixed(3)})`;
      b.beginPath(); b.moveTo(x0, lampY + 2); b.lineTo(x0 + (ex - x0) * lk, lampY + 2 + (ey - lampY - 2) * lk - bw * wk * lk); b.lineTo(x0 + (ex - x0) * lk, lampY + 2 + (ey - lampY - 2) * lk + bw * wk * lk); b.closePath(); b.fill();
    }
    b.restore();
    // flare when the beam faces the camera; the lamp's own halo
    const fl = Math.pow(towardCam, 6);
    if (fl > .02) G.pxGlow(b, x0, lampY + 2, 16 + fl * 22, '255,248,210', .55 * fl * lamp, 4);
    G.pxGlow(b, x0, lampY + 2, 12, '255,240,170', .7 * lamp, 3);
    b.save();
    b.restore();
    // warm windows of the keeper's cottage
    b.fillStyle = '#3a2a2a'; b.fillRect(Math.round(bx - 40 * sc), Math.round(by - ih * .45 - 9 * sc), Math.round(20 * sc), Math.round(10 * sc));
    b.fillStyle = '#ffd27a'; b.fillRect(Math.round(bx - 36 * sc), Math.round(by - ih * .45 - 6 * sc), 2, 2); b.fillRect(Math.round(bx - 28 * sc), Math.round(by - ih * .45 - 6 * sc), 2, 2);
  }
  drawUI() {
    const U = G.ui, t = this.t, k = Math.min(1, t / 60);
    const y = 26 - (1 - G.ease.outCubic(k)) * 30;
    const c = U.c, S = G.gfx.S;
    c.save(); c.globalAlpha = k;
    U.font(38, 900); c.textAlign = 'center'; c.textBaseline = 'top';
    // extruded depth: stacked copies stepping down-right, darkening
    for (let d = 5; d >= 1; d--) { c.fillStyle = d > 3 ? '#0a0e22' : '#3a2448'; c.fillText('SOLMERE', U.X(G.W / 2 + d * .5), U.Y(y + d * .7)); }
    c.lineJoin = 'round'; c.lineWidth = S * 2.4; c.strokeStyle = '#2a1830'; c.strokeText('SOLMERE', U.X(G.W / 2), U.Y(y));
    // face: warm gradient with a light band sweeping across every few seconds
    const sh = ((t % 300) / 300) * 1.6 - .3;
    const g = c.createLinearGradient(U.X(G.W / 2 - 110), U.Y(y), U.X(G.W / 2 + 110), U.Y(y + 38));
    g.addColorStop(0, '#ffe7a8'); g.addColorStop(Math.max(0, Math.min(1, sh - .06)), '#ffd27a'); g.addColorStop(Math.max(0, Math.min(1, sh)), '#fffdf4'); g.addColorStop(Math.max(0, Math.min(1, sh + .06)), '#ffc766'); g.addColorStop(1, '#f59a58');
    c.fillStyle = g; c.fillText('SOLMERE', U.X(G.W / 2), U.Y(y));
    c.restore();
    U.text('— TIDELIGHT —', G.W / 2, y + 44, { size: 9, weight: 800, align: 'center', color: '#8af0e0', alpha: k, outline: 'rgba(0,0,0,.5)' });
    if (this.stage === 'press' && t > 40 && Math.floor(t / 30) % 2 === 0) U.text('Press Enter', G.W / 2, 150, { size: 8, weight: 800, align: 'center', color: '#fff', outline: 'rgba(0,0,0,.6)' });
    U.text('v' + G.VERSION + '  ·  an original monster-taming adventure', G.W - 6, G.H - 9, { size: 4.8, align: 'right', color: 'rgba(255,255,255,.5)' });
  }
};
G.pickSlot = async function (title, mustExist) {
  const items = [1, 2, 3].map(s => { const S = G.persist.summary(s); return { label: S ? `${s}: ${S.name} · ${S.badges}★ · ${S.time} · ${S.loc}` : `${s}: — empty —`, disabled: mustExist && !S, slot: s }; });
  items.push({ label: 'Back' });
  const k = await G.choose(items, { x: 60, y: 96, w: 264, title, cancel: 3 });
  if (k < 0 || k >= 3) return null;
  return items[k].slot;
};
G.importSave = async function () {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  const file = await new Promise(res => { inp.onchange = () => res(inp.files[0]); inp.click(); setTimeout(() => res(null), 60000); });
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!data || !data.party) throw new Error('bad');
    const s = await G.pickSlot('Import into which slot?', false); if (!s) return;
    data.slot = s; localStorage.setItem(G.persist.key(s), JSON.stringify(data));
    await G.say('Save imported!');
  } catch (e) { await G.say('That file doesn\'t look like a Solmere save.'); }
};
// ------------------------------------------------------------- new game --
G.NewGameScene = class {
  constructor(res) {
    this.res = res; this.opaque = true; this.t = 0; this.i = 0;
    this.v = { difficulty: 'normal', nuzlocke: false, dupes: true, shinyc: true, hardcore: false, random: false, rwild: true, rtrain: true, rstart: true, rsimilar: true, levelCap: 'off', setMode: false, god: false, look: 'player_a' };
    this.rows = [
      { k: 'difficulty', label: 'Difficulty', vals: ['easy', 'normal', 'hard', 'master'], names: ['Easy', 'Normal', 'Hard', 'Master'], desc: ['Gentle: +50% EXP, weaker trainers, damage hints on.', 'The classic experience, tuned for players who know type matchups.', 'Smarter AI that switches and heals, stronger trainers with better IVs. Bosses are trained.', 'For veterans: max-IV trained teams, held items, the smartest AI. Bring a plan.'] },
      { k: 'levelCap', label: 'Level Caps', vals: ['off', 'soft', 'hard'], names: ['Off', 'Soft', 'Hard'], desc: ['No level caps.', 'EXP drops to 10% above the next Warden\'s ace level.', 'Mons cannot level past the next Warden\'s ace level (shown in the menu).'] },
      { k: 'setMode', label: 'Battle Style', vals: [false, true], names: ['Switch', 'Set'], desc: ['You may switch when the foe sends a new mon.', 'No free switch when the foe sends a new mon (competitive rules).'] },
      { k: 'nuzlocke', label: 'Nuzlocke Mode', vals: [false, true], names: ['Off', 'On'], desc: ['Standard rules.', 'Only the first encounter per area may be caught. Fainted mons are gone forever. You must nickname everything. Ends if your whole party falls.'] },
      { k: 'dupes', label: '  · Dupes Clause', vals: [true, false], names: ['On', 'Off'], dep: 'nuzlocke', desc: ['Encounters of lines you already own don\'t use up the area.', 'Every first encounter counts.'] },
      { k: 'shinyc', label: '  · Shiny Clause', vals: [true, false], names: ['On', 'Off'], dep: 'nuzlocke', desc: ['Shinies can always be caught.', 'Shinies follow normal rules.'] },
      { k: 'hardcore', label: '  · Hardcore', vals: [false, true], names: ['Off', 'On'], dep: 'nuzlocke', desc: ['Items allowed in battle.', 'No items in battle, Set mode forced, no PC healing.'] },
      { k: 'random', label: 'Randomizer', vals: [false, true], names: ['Off', 'On'], desc: ['Species appear as designed.', 'Shuffle species, seeded per save. A fresh adventure every time!'] },
      { k: 'rwild', label: '  · Wild mons', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Randomize wild encounters.', 'Keep wild encounters.'] },
      { k: 'rtrain', label: '  · Trainers', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Randomize trainer teams.', 'Keep trainer teams.'] },
      { k: 'rstart', label: '  · Starters', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Randomize the starter choices.', 'Keep the classic three.'] },
      { k: 'rsimilar', label: '  · Similar strength', vals: [true, false], names: ['On', 'Off'], dep: 'random', desc: ['Replacements have similar base stat totals.', 'Anything goes. Chaos.'] },
      { k: 'god', label: 'God Mode (testing)', vals: [false, true], names: ['Off', 'On'], desc: ['Off.', 'Adds a God Mode menu (pause menu, or ` key): invincibility, one-hit KOs, noclip, warps, chapter skips, give mons/items and more.'] },
      { k: 'start', label: '▶  BEGIN JOURNEY', start: true, desc: ['All set? Your adventure in Solmere awaits.'] },
    ];
  }
  visible() { return this.rows.filter(r => !r.dep || this.v[r.dep]); }
  update(top) {
    this.t++; if (!top) return;
    const I = G.input, R = this.visible(), n = R.length;
    if (I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
    if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
    const r = R[Math.min(this.i, n - 1)];
    if (r.start) { if (I.pressed('a')) { I.consume('a'); G.audio && G.audio.sfx('select'); G.pop(this); this.res(this.v); } }
    else {
      const vi = r.vals.indexOf(this.v[r.k]);
      if (I.repeat('left')) { this.v[r.k] = r.vals[(vi + r.vals.length - 1) % r.vals.length]; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('right') || I.pressed('a')) { I.consume('a'); this.v[r.k] = r.vals[(vi + 1) % r.vals.length]; G.audio && G.audio.sfx('cursor'); }
    }
    if (this.i >= this.visible().length) this.i = this.visible().length - 1;
    if (I.pressed('b')) { I.consume('b'); G.pop(this); this.res(null); }
  }
  draw(b) { G.menuBG(b, '#1e9486', '#0e3a44', this.t / 60); }
  drawUI() {
    const U = G.ui, R = this.visible();
    U.panel(16, 8, G.W - 32, 150, 'light', { r: 8 });
    U.text('New Journey — Challenge Setup', G.W / 2, 12, { size: 8.4, weight: 900, align: 'center' });
    R.forEach((r, k) => {
      const y = 26 + k * 9.4, sel = k === this.i;
      if (sel) { U.rrect(22, y - 1.4, G.W - 44, 9.2, 3); U.c.fillStyle = r.start ? 'rgba(42,168,106,.3)' : 'rgba(27,167,184,.18)'; U.c.fill(); }
      U.text(r.label, 30, y, { size: 6.4, weight: r.start ? 900 : 700, color: r.start ? '#2a7a4a' : r.dep ? '#5a6070' : '#283040' });
      if (!r.start) { const vi = r.vals.indexOf(this.v[r.k]); U.text('◀ ' + r.names[vi] + ' ▶', G.W - 30, y, { size: 6.4, weight: 800, align: 'right', color: sel ? '#1e9486' : '#4a5060' }); }
    });
    const r = R[this.i];
    U.panel(16, 162, G.W - 32, 46, 'dark', { r: 8 });
    const vi = r.start ? 0 : r.vals.indexOf(this.v[r.k]);
    G.ui.wrap(r.desc[vi] || r.desc[0], G.W - 56, 6.6).slice(0, 4).forEach((l, k) => U.text(l, 26, 168 + k * 9.5, { size: 6.6, color: '#e8f0f8' }));
  }
};
G.newGameFlow = async function () {
  const slot = await G.pickSlot('Save your journey in which slot?', false); if (!slot) return false;
  if (G.persist.exists(slot) && !await G.yesno('There\'s already a journey in that slot. Overwrite it forever?')) return false;
  const v = await new Promise(res => G.push(new G.NewGameScene(res))); if (!v) return false;
  const settings = {
    difficulty: v.difficulty, levelCap: v.levelCap, setMode: v.setMode || (v.nuzlocke && v.hardcore), noItems: v.nuzlocke && v.hardcore,
    nuzlocke: v.nuzlocke, nuzRules: { dupes: v.dupes, shiny: v.shinyc, hardcore: v.hardcore }, god: v.god,
    randomizer: v.random ? { on: true, seed: Math.floor(Math.random() * 1e9), wild: v.rwild, trainers: v.rtrain, starters: v.rstart, similar: v.rsimilar } : null,
    expShare: true,
  };
  if (v.difficulty === 'easy') G.settings.dmgPreview = true;
  G.save = G.newSave({ slot, settings });
  await G.fadeOut(20);
  G.pop(G.findScene(G.TitleScene));
  await G.runScript('intro_professor');
  return true;
};
G.startFromSave = async function (data) {
  if (!data) return;
  G.save = G.repairSave(data);
  if (data.settingsGlobal) Object.assign(G.settings, data.settingsGlobal);
  await G.fadeOut(20);
  const t = G.findScene(G.TitleScene); if (t) G.pop(t);
  G.maps.reset();
  const w = new G.WorldScene(); G.push(w);
  const p = G.save.pos;
  w.enterMap(p.map, p.x, p.y, p.dir);
  await G.fadeIn(20);
  G.toast(`Welcome back, ${G.save.name}!`);
};
G.howToPlay = async function () {
  await G.say([
    'Welcome to Solmere! You\'re a new Tamer setting out to earn the six Warden badges and challenge the Conclave.',
    'Walk into tall grass to meet wild mons. Weaken them, then throw Orbs to catch them. Battle Tamers who spot you to earn money and EXP.',
    'Everything seasoned players expect is here: natures, IVs & EVs (see Summary ▸ Stats), abilities, held items, weather, hazards, doubles, and the physical/special split.',
    'Resonance: once per battle, press R in the Fight menu to let a mon Resonate. Its main type hits much harder and a shield blunts the first super-effective blow.',
    'Quality of life: free move relearner (Party ▸ Moves), no HMs (key items clear obstacles), Always Run and Turbo (Tab), and an encounter list for every area in the menu.',
    'Co-op: run the included server and choose Link in the menu. You and a friend can explore together, team up in double battles, trade, and battle each other.',
    'Press H in the overworld any time for the controls. Good luck, Tamer!',
  ]);
};
G.rollCredits = async function (ending) {
  const lines = ['SOLMERE: TIDELIGHT', '', 'A monster-taming adventure', '', '— Design, Story, Code, Art & Music —', 'Built with care, one pixel at a time', '', '— Starring —', ...G.DEX.map(id => G.SPECIES[id].name), '', '— Special Thanks —', 'Every Tamer who ever talked to their follower', 'Nuzlocke veterans everywhere', 'You, for playing', '', ending ? 'Thank you for playing!' : ''];
  G.audio && G.audio.music(ending ? 'credits' : 'title');
  await new Promise(res => G.push({
    opaque: true, t: 0,
    update(top) { this.t++; if (top && (G.input.pressed('b') || this.t > lines.length * 30 + 400)) { G.input.consume('b'); G.pop(this); res(); } },
    draw(b) { b.fillStyle = '#060a16'; b.fillRect(0, 0, G.W, G.H); for (let i = 0; i < 60; i++) { b.fillStyle = 'rgba(255,255,255,.4)'; b.fillRect((i * 97) % G.W, (i * 41 + this.t * .1) % G.H, 1, 1); } },
    drawUI() {
      const U = G.ui; const y0 = G.H - this.t * .45;
      lines.forEach((l, k) => { const y = y0 + k * 14; if (y < -10 || y > G.H + 10) return; U.text(l, G.W / 2, y, { size: k === 0 ? 11 : 7.4, weight: k === 0 || l.startsWith('—') ? 900 : 600, align: 'center', color: l.startsWith('—') ? '#8af0e0' : '#f0f4ff' }); });
      U.text('X to skip', G.W - 6, G.H - 9, { size: 5, align: 'right', color: 'rgba(255,255,255,.4)' });
    },
  }));
};
// ------------------------------------------------------------ music room -
// The whole soundtrack in story order. Z plays, ◀ ▶ flips day/night arrangements (they crossfade in sync).
G.MUSIC_ORDER = ['title', 'intro', 'home', 'brinehollow', 'lab', 'route1', 'wild', 'encounter', 'trainer', 'victory_wild', 'victory_trainer', 'haven', 'mart',
  'fernwick', 'house', 'route2', 'forest', 'gym', 'encounter_boss', 'gym_battle', 'victory_gym', 'galvan', 'encounter_villain', 'villain_battle', 'hq', 'crane',
  'route3', 'cave', 'cindervale', 'rival', 'route4', 'duskmere', 'ruins', 'evolution', 'surf', 'bike', 'frostpeak', 'icecave', 'skyreach', 'spire', 'spire_battle',
  'admin_battle', 'tidelight', 'lighthouse', 'crane_battle', 'legend', 'tidelight_calm', 'victoryroad', 'gate', 'conclave', 'elite_room', 'elite', 'champ_room',
  'champion', 'victory_champion', 'halloffame', 'credits', 'wanderer', 'starfall'];
G.musicRoom = function () {
  const F = G.MUSIC_FILES || {};
  const list = G.MUSIC_ORDER.filter(id => F[id]);
  if (!list.length) return G.say('The soundtrack files are missing. (Run the game through Play.command so the music can load.)');
  return new Promise(res => G.push({
    opaque: true, i: 0, scroll: 0, t: 0, night: false, playing: null, rows: 12,
    enter() { if (G.audio) G.audio.forceVariant = 'day'; },
    exit() { if (G.audio) G.audio.forceVariant = null; },
    update(top) {
      this.t++; if (!top) return; const I = G.input, n = list.length;
      if (I.repeat('up')) { this.i = (this.i + n - 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (I.repeat('down')) { this.i = (this.i + 1) % n; G.audio && G.audio.sfx('cursor'); }
      if (this.i < this.scroll) this.scroll = this.i;
      if (this.i >= this.scroll + this.rows) this.scroll = this.i - this.rows + 1;
      if (I.pressed('a')) { I.consume('a'); this.playing = list[this.i]; if (G.audio) { G.audio.forceVariant = this.night ? 'night' : 'day'; G.audio.stopMusic(); G.audio.music(this.playing); } }
      if ((I.pressed('left') || I.pressed('right')) && this.playing && F[this.playing + '@night']) {
        this.night = !this.night; if (G.audio) G.audio.forceVariant = this.night ? 'night' : 'day';
        G.audio && G.audio.sfx('cursor');
      }
      if (I.pressed('b')) { I.consume('b'); G.audio && G.audio.sfx('back'); G.pop(this); res(); }
    },
    draw(b) { G.menuBG(b, '#1f5f7a', '#0e2436', this.t / 60); },
    drawUI() {
      const U = G.ui;
      U.panel(10, 8, 200, 200, 'light', { r: 8 });
      U.text('Music Room', 110, 13, { size: 9, weight: 900, align: 'center' });
      list.slice(this.scroll, this.scroll + this.rows).forEach((id, k) => {
        const j = k + this.scroll, y = 28 + k * 14.2, sel = j === this.i, m = F[id];
        if (sel) { U.rrect(16, y - 2, 188, 13, 3); U.c.fillStyle = 'rgba(40,150,180,.2)'; U.c.fill(); }
        U.text(String(j + 1).padStart(2, '0'), 22, y + .5, { size: 6, weight: 700, color: '#8a90a0' });
        U.text(m.title || id, 38, y, { size: 6.8, weight: sel ? 800 : 600, color: id === this.playing ? '#1f8aa8' : '#2a3040' });
        if (F[id + '@night']) U.text('☾', 198, y, { size: 6.5, align: 'right', color: '#6a70a0' });
      });
      if (this.scroll > 0) U.text('▲', 110, 22, { size: 5, align: 'center', color: '#e8484a' });
      if (this.scroll + this.rows < list.length) U.text('▼', 110, 199, { size: 5, align: 'center', color: '#e8484a' });
      // now playing
      U.panel(218, 8, G.W - 226, 110, 'dark', { r: 8 });
      U.text('NOW PLAYING', 218 + (G.W - 226) / 2, 14, { size: 6, weight: 900, align: 'center', color: '#8af0e0' });
      const np = G.audio && G.audio.nowPlaying && G.audio.nowPlaying();
      if (np) {
        const m = F[np.id] || {};
        G.ui.wrap(m.title || np.id, G.W - 240, 8).slice(0, 2).forEach((l, k) => U.text(l, 226, 30 + k * 11, { size: 8, weight: 800, color: '#fff' }));
        U.text(np.id.includes('@night') ? 'Night arrangement' : (F[np.id.split('@')[0] + '@night'] ? 'Day arrangement' : ''), 226, 56, { size: 6, color: '#bcd' });
        const frac = np.loopEnd ? Math.min(1, np.pos / np.loopEnd) : 0;
        U.rrect(226, 72, G.W - 242, 5, 2); U.c.fillStyle = 'rgba(255,255,255,.15)'; U.c.fill();
        U.rrect(226, 72, (G.W - 242) * frac, 5, 2); U.c.fillStyle = '#8af0e0'; U.c.fill();
        const fmt = x => `${Math.floor(x / 60)}:${String(Math.floor(x % 60)).padStart(2, '0')}`;
        U.text(fmt(np.pos), 226, 81, { size: 5.5, color: '#bcd' });
        if (m.bpm) U.text(`${Math.round(m.bpm)} bpm`, G.W - 16, 81, { size: 5.5, align: 'right', color: '#bcd' });
      } else U.text('Press Z to play a track', 218 + (G.W - 226) / 2, 50, { size: 6.5, align: 'center', color: '#bcd' });
      U.text('Z play  ·  ◀ ▶ day / night  ·  X back', 218 + (G.W - 226) / 2, 106, { size: 5.4, align: 'center', color: '#8a90a0' });
      U.panel(218, 124, G.W - 226, 84, 'glass', { r: 8 });
      ['An original soundtrack in the style of the', 'DS era: sequenced MIDI played through a', 'sampled Roland GS sound bank, mixed and', 'mastered for loops that never seam.'].forEach((l, k) => U.text(l, 226, 132 + k * 10, { size: 5.6, color: '#dfe6f2' }));
      U.text(`${list.length} tracks  ·  ${Object.keys(F).filter(k => k.includes('@night')).length} night arrangements`, 226, 178, { size: 5.6, weight: 800, color: '#8af0e0' });
    },
  }));
};
// ------------------------------------------------------------ god mode ---
G.openDebugMenu = async function () {
  const g = G.save.god;
  while (true) {
    const tog = (k, l) => ({ id: 't_' + k, label: `${l}: ${g[k] ? 'ON' : 'off'}` });
    const items = [tog('invincible', 'Invincible'), tog('ohko', 'One-hit KOs'), tog('noclip', 'Walk through walls'), tog('noEnc', 'No encounters'), tog('catch100', '100% catch'), tog('speed', 'Fast walk'),
      { id: 'heal', label: 'Heal party' }, { id: 'chapter', label: 'Jump to chapter…' }, { id: 'warp', label: 'Warp to map…' }, { id: 'mon', label: 'Give mon…' }, { id: 'item', label: 'Give item…' },
      { id: 'kit', label: 'Give key items + TMs + $' }, { id: 'lvl', label: 'Party +10 levels' }, { id: 'dex', label: 'Complete Dex' }, { id: 'time', label: 'Set time of day…' }, { id: 'trainer', label: 'Battle trainer…' }, { id: 'badges', label: 'Give all badges' }, { id: 'close', label: 'Close' }];
    const k = await G.choose(items, { x: 8, y: 8, w: 150, maxRows: 14, title: 'GOD MODE', cancel: items.length - 1 });
    if (k < 0 || items[k].id === 'close') return false;
    const id = items[k].id;
    if (id.startsWith('t_')) { const key = id.slice(2); g[key] = !g[key]; G.toast(`${key}: ${g[key] ? 'ON' : 'off'}`); continue; }
    if (id === 'heal') { G.party.healAll(); G.toast('Party healed'); }
    if (id === 'chapter') { const cs = G.CHAPTERS.map(c => ({ label: c.name })); const j = await G.choose(cs.concat([{ label: 'Cancel' }]), { x: 60, y: 8, w: 250, maxRows: 14, cancel: cs.length }); if (j >= 0 && j < cs.length) { await G.jumpToChapter(G.CHAPTERS[j]); return true; } }
    if (id === 'warp') {
      const ids = Object.keys(G.MAPDEFS).filter(m => G.MAPDEFS[m].spawn);
      const j = await G.choose(ids.map(m => ({ label: G.MAPDEFS[m].name, right: m })).concat([{ label: 'Cancel' }]), { x: 60, y: 8, w: 250, maxRows: 14, cancel: ids.length });
      if (j >= 0 && j < ids.length) { const d = G.MAPDEFS[ids[j]]; await G.world.scene.warpTo(ids[j], d.spawn[0], d.spawn[1], 'down'); return true; }
    }
    if (id === 'mon') {
      const j = await G.choose(G.DEX.map(s => ({ label: G.SPECIES[s].name, right: '#' + G.SPECIES[s].num })).concat([{ label: 'Cancel' }]), { x: 60, y: 8, w: 200, maxRows: 14, cancel: G.DEX.length });
      if (j >= 0 && j < G.DEX.length) { const lv = await G.askNumber({ min: 1, max: 100, start: 30, text: 'Level?' }); if (lv > 0) { const sh = await G.yesno('Shiny?'); const m = G.mon.create(G.DEX[j], lv, { shiny: sh, perfectIVs: 6 }); m.ot = G.save.name; m.otId = G.save.otId; G.party.add(m); G.world.scene.placeFollower(); G.toast('Added ' + G.SPECIES[G.DEX[j]].name); } }
    }
    if (id === 'item') {
      const all = Object.keys(G.ITEMS);
      const j = await G.choose(all.map(i => ({ label: G.ITEMS[i].name, right: G.ITEMS[i].pocket })).concat([{ label: 'Cancel' }]), { x: 60, y: 8, w: 220, maxRows: 14, cancel: all.length });
      if (j >= 0 && j < all.length) { const n = await G.askNumber({ min: 1, max: 99, start: 10, text: 'How many?' }); if (n > 0) { G.bag.add(all[j], n); G.toast('Got ' + G.ITEMS[all[j]].name); } }
    }
    if (id === 'kit') { for (const i of ['dex', 'journal', 'resonanceband', 'bike', 'trailknife', 'pickhammer', 'gripboots', 'tideboard', 'wingwhistle', 'rod', 'prorod', 'expshare', 'vsrecorder', 'lantern', 'dowsing']) G.bag.add(i); for (let i = 1; i <= G.TM_LIST.length; i++) G.bag.add('tm' + String(i).padStart(2, '0')); G.bag.add('rarecandy', 50); G.bag.add('ultraorb', 50); G.bag.add('maxpotion', 30); G.bag.add('fullrestore', 20); G.bag.add('maxrevive', 20); G.save.money += 500000; for (const t of G.TOWNS) G.save.visited[t.id] = true; G.toast('Kit granted'); }
    if (id === 'lvl') { for (const m of G.save.party) { G.mon.setLevel(m, Math.min(100, m.lvl + 10)); m.hp = G.mon.maxHP(m); } G.toast('+10 levels'); }
    if (id === 'dex') { for (const s of G.DEX) { G.save.dex.seen[s] = true; G.save.dex.caught[s] = Date.now(); } G.toast('Dex completed'); }
    if (id === 'time') { const opts = ['Morning (7)', 'Day (12)', 'Dusk (18)', 'Night (22)', 'Normal clock']; const j = await G.choose(opts, { x: 120, y: 60, w: 120, cancel: 4 }); const hs = [7, 12, 18, 22]; if (j >= 0 && j < 4) G.save.vars.forceHour = hs[j]; else delete G.save.vars.forceHour; }
    if (id === 'trainer') {
      const ids = Object.keys(G.TRAINERS);
      const j = await G.choose(ids.map(t => ({ label: (G.TRAINERS[t].cls || '') + ' ' + G.TRAINERS[t].name, right: t })).concat([{ label: 'Cancel' }]), { x: 40, y: 8, w: 290, maxRows: 14, cancel: ids.length });
      if (j >= 0 && j < ids.length) { await G.storyBattle(ids[j]); return true; }
    }
    if (id === 'badges') { for (const b of G.BADGE_ORDER) if (!G.save.badges.includes(b)) G.save.badges.push(b); G.toast('All badges'); }
  }
};
G.jumpToChapter = async function (ch) {
  G.save.flags = {}; for (const f of ch.flags || []) G.save.flags[f] = true;
  G.save.badges = (ch.badges || []).slice();
  for (const it of ch.items || []) G.bag.add(it);
  if (!G.save.party.length || ch.freshParty) {
    G.save.party = [];
    for (const [sp, lv] of ch.party || [['kindlet', 5]]) { const m = G.mon.create(sp, lv, { perfectIVs: 3 }); m.ot = G.save.name; m.otId = G.save.otId; G.save.party.push(m); }
  } else for (const m of G.save.party) { if (m.lvl < ch.lvl) { G.mon.setLevel(m, ch.lvl); m.hp = G.mon.maxHP(m); } }
  for (const t of ch.visited || []) G.save.visited[t] = true;
  G.save.money = Math.max(G.save.money, ch.money || 3000);
  G.party.healAll();
  G.maps.reset();
  await G.world.scene.warpTo(ch.map, ch.x, ch.y, ch.dir || 'down');
  G.toast('Jumped to: ' + ch.name);
};

// ------------------------------------------------------------------ prologue --
// A cold open before the Professor: the night the Tidelight went dark and something in the Mere sang.
G.PrologueScene = class extends G.TitleScene {
  constructor() { super(); this.caption = ''; this.capA = 0; this.lampLevel = 1; this.breachK = 0; this.glowBreach = true; this.skip = false; this.night = 0; }
  enter() { }
  update(top) {
    this.t++; this.parts.update();
    if (top && (G.input.pressed('b') || G.input.pressed('start'))) { G.input.consumeAll(); this.skip = true; }
  }
  draw(b) {
    super.draw(b);
    if (this.night > 0) { b.fillStyle = `rgba(6,8,34,${(.5 * this.night).toFixed(3)})`; b.fillRect(0, 0, G.W, G.H); }
  }
  drawUI() {
    const U = G.ui;
    if (this.capA > 0) U.text(this.caption, G.W / 2, G.H - 40, { size: 8.4, weight: 700, align: 'center', color: '#f4ecd8', alpha: this.capA, outline: 'rgba(0,0,10,.8)', outlineW: 1.6 });
    U.text('X: skip', G.W - 8, G.H - 10, { size: 5, align: 'right', color: 'rgba(255,255,255,.35)' });
  }
};
G.runPrologue = async function () {
  const sc = new G.PrologueScene(); G.push(sc);
  G.audio && G.audio.music('tidelight_calm');
  const SKIP = {};
  const wait = async n => { for (let i = 0; i < n; i++) { if (sc.skip) throw SKIP; await G.wait(1); } };
  const cap = async (text, hold = 170) => { sc.caption = text; for (let i = 0; i <= 20; i++) { sc.capA = i / 20; await wait(1); } await wait(hold); for (let i = 20; i >= 0; i--) { sc.capA = i / 20; await wait(1); } };
  try {
    await G.fadeIn(50);
    await cap('Twelve years ago...', 110);
    for (let i = 0; i <= 60; i++) { sc.night = i / 60; await wait(1); }
    await cap('On the night of the spring tide, the Tidelight went dark.', 40);
    for (let i = 0; i < 70; i++) { sc.lampLevel = i > 55 ? 0 : (G.rand() < .45 ? 0 : .4 + G.rand() * .6); await wait(1); }
    sc.lampLevel = 0; await wait(40);
    const rise = (async () => { for (let i = 0; i <= 260; i++) { sc.breachK = .2 + .3 * i / 260; if (i === 110) { G.audio && G.audio.cry('orrelume'); } await wait(1); } })();
    await cap('And from the black water, something rose... and sang.', 140);
    await rise;
    await cap('Every mon in Solmere heard that song. Every person who loved one felt it.', 170);
    await cap('Some say it was saying goodbye.', 110);
    await cap('Others say... it was calling someone.', 150);
  } catch (e) { if (e !== SKIP) throw e; }
  await G.fadeOut(40, '#eaf6ff');
  G.pop(sc);
};
