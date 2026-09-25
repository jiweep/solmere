'use strict';
// ============================================================================
//  Main loop, scene stack, toasts, global hotkeys, crash guard
// ============================================================================
G.scenes = [];
// UI motion: menus snap in with a skewed slide and sweep out when closed; full-screen screens open
// with a diagonal wipe. Decided per scene: worlds, battles, cut-ins and dialogue boxes are left alone.
G.uiAnim = s => s && !s.isWorld && !s.noAnim && !(G.BattleScene && s instanceof G.BattleScene) && !(G.DialogScene && s instanceof G.DialogScene) && !(G.TitleScene && s instanceof G.TitleScene) && !(G.IntroBackdrop && s instanceof G.IntroBackdrop) && (s.drawUI || s.draw);
G.ghosts = [];
G.push = function (s) { G.scenes.push(s); if (G.uiAnim(s)) s._born = G.realTime; if (s.enter) s.enter(); return s; };
G.pop = function (s) {
  const i = s ? G.scenes.lastIndexOf(s) : G.scenes.length - 1;
  if (i < 0) return null;
  const [r] = G.scenes.splice(i, 1); if (r && r.exit) r.exit();
  if (r && r._born !== undefined && !r.opaque && !r.noGhost && r.drawUI && G.realTime - r._born > .05) G.ghosts.push({ s: r, t0: G.realTime });
  return r;
};
G.top = () => G.scenes[G.scenes.length - 1];
G.findScene = cls => G.scenes.find(s => s instanceof cls);
G.turbo = false;
G.ffSpeed = () => G.settings.ffSpeed || 3;
G.setTurbo = function (on, quiet) {
  G.turbo = !!on; G.ffButton = false;
  if (!quiet) G.toast(G.turbo ? `Fast-forward ${G.ffSpeed()}x  (Tab)` : 'Normal speed', { life: 60 });
  const b = typeof document !== 'undefined' && document.getElementById('ff');
  if (b) { b.classList.toggle('on', G.turbo); b.textContent = G.turbo ? '▶▶ ' + G.ffSpeed() + 'x' : '▶▶'; }
};
G.toasts = [];
G.toast = function (text, o = {}) { G.toasts.push({ text, t: 0, life: o.life || 150, col: o.col || 'dark', icon: o.icon }); };
G.banner = null; // area name banner
G.showBanner = function (text, sub) { G.banner = { text, sub, t: 0 }; };
G.errors = [];

G.update = function () {
  G.input.poll();
  if (G.errors.length) {
    if (G.input.pressed('b')) { G.dismissErrors(); G.input.consume('b'); }
    else if (++G.errT > 60 * 12) G.dismissErrors();
  }
  G.frame++; G.time += 1 / 60;
  // emulator-style fast-forward: Tab toggles it (or runs it while held, per Options); the on-screen button toggles
  const blocked = G.top() && G.top().noTurbo;
  if (G.settings.ffMode === 'hold') { const on = G.input.isDown('turbo') && !blocked; if (on !== G.turbo && !G.ffButton) G.setTurbo(on, true); }
  else if (G.input.pressed('turbo') && !blocked) G.setTurbo(!G.turbo);
  if (G.input.pressed('photo') && G.world && G.top() === G.world.scene) { G.photoMode = !G.photoMode; G.toast(G.photoMode ? 'Photo mode: UI hidden. Press P to exit, Z to save a screenshot.' : 'Photo mode off', { life: 120 }); }
  G.updateTimers();
  const top = G.top();
  const list = G.scenes.slice();
  for (const s of list) { if (s.update) s.update(s === top); }
  for (let i = G.toasts.length - 1; i >= 0; i--) if (++G.toasts[i].t > G.toasts[i].life) G.toasts.splice(i, 1);
  if (G.banner && ++G.banner.t > 230) G.banner = null;
  if (G.audio) G.audio.update();
};

G.render = function () {
  const gx = G.gfx, c = gx.cx, S = gx.S;
  c.fillStyle = '#000'; c.fillRect(0, 0, gx.canvas.width, gx.canvas.height);
  // find lowest opaque scene
  let start = 0;
  for (let i = G.scenes.length - 1; i >= 0; i--) if (G.scenes[i].opaque) { start = i; break; }
  G.ui._hotNext = [];
  // 3D world: the WebGL canvas sits under this one; leave the viewport transparent over it
  const w3 = G.W3 && G.W3.active(G.scenes[start]);
  if (w3) { if (G.W3.render(G.scenes[start])) c.clearRect(gx.ox, gx.oy, G.W * S, G.H * S); } else if (G.W3) G.W3.hide();
  G.in3d = !!w3;
  for (let i = start; i < G.scenes.length; i++) {
    const s = G.scenes[i];
    if (w3 && i === start && s.draw3d) {
      const b = gx.bx;
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
      b.clearRect(0, 0, G.W, G.H);
      s.draw3d(b); gx.present();
    }
    if (s.drawBack) s.drawBack(c);   // native-resolution backdrop under the scene's pixel layer
    if (s.draw && s.lowres !== false && !(w3 && i === start)) {
      const b = gx.bx;
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
      b.clearRect(0, 0, G.W, G.H);
      s.draw(b);
      if (s.isWorld && G.settings.fancy !== false) gx.present25(s.lookFX ? s.lookFX() : {});
      else if (s.fx25 && G.settings.fancy !== false && s.fx25()) gx.present25(s.fx25());
      else gx.present();
    }
    G.ui._scene = s;
    const age = s._born !== undefined ? G.realTime - s._born : 9;
    if (s.opaque && age < .26 && i > 0) {
      // diagonal wipe revealing the new screen over the old one
      const k = G.ease.outCubic(age / .26), X0 = gx.ox, Y0 = gx.oy, Wd = G.W * S, Hd = G.H * S, sk = Hd * .45, e = (Wd + sk) * k;
      c.save(); c.beginPath(); c.moveTo(X0 - sk, Y0 + Hd); c.lineTo(X0 - sk + e, Y0 + Hd); c.lineTo(X0 + e, Y0); c.lineTo(X0, Y0); c.closePath(); c.clip();
      if (s.draw && s.lowres !== false) { gx.bx.setTransform(1, 0, 0, 1, 0, 0); gx.bx.clearRect(0, 0, G.W, G.H); s.draw(gx.bx); gx.present(); }
      if (s.drawUI) s.drawUI(c);
      c.restore();
      c.save(); c.fillStyle = '#ff3b4e'; c.beginPath(); c.moveTo(X0 - sk + e, Y0 + Hd); c.lineTo(X0 - sk + e + 6 * S, Y0 + Hd); c.lineTo(X0 + e + 6 * S, Y0); c.lineTo(X0 + e, Y0); c.closePath(); c.fill(); c.restore();
      continue;
    }
    if (s.drawUI && !(G.photoMode && s.isWorld)) {
      c.save();
      if (age < .16 && !s.opaque) { const k = G.ease.outBack(Math.min(1, age / .16)); c.globalAlpha = Math.min(1, age / .08); c.translate((1 - k) * 40 * S, 0); c.transform(1, 0, (1 - k) * -.25, 1, 0, 0); }
      s.drawUI(c); c.restore();
    }
  }
  // closing menus sweep off to the right
  for (let i = G.ghosts.length - 1; i >= 0; i--) {
    const g = G.ghosts[i], age = G.realTime - g.t0;
    if (age > .12) { G.ghosts.splice(i, 1); continue; }
    const k = G.ease.inQuad(age / .12);
    c.save(); c.globalAlpha = 1 - k; c.translate(k * 60 * S, 0); c.transform(1, 0, k * .3, 1, 0, 0); G.ui._scene = null;
    try { g.s.drawUI(c); } catch (e) { } c.restore();
  }
  G.ui._hot = G.ui._hotNext; G.ui._hotNext = []; G.ui._scene = null;
  // clip letterbox
  c.fillStyle = '#000';
  if (gx.ox > 0) { c.fillRect(0, 0, gx.ox, gx.canvas.height); c.fillRect(gx.ox + G.W * S, 0, gx.canvas.width, gx.canvas.height); }
  if (gx.oy > 0) { c.fillRect(0, 0, gx.canvas.width, gx.oy); c.fillRect(0, gx.oy + G.H * S, gx.canvas.width, gx.canvas.height); }
  // fade
  if (G.fade.a > 0) { c.globalAlpha = G.clamp(G.fade.a, 0, 1); c.fillStyle = G.fade.col; c.fillRect(gx.ox, gx.oy, G.W * S, G.H * S); c.globalAlpha = 1; }
  if (!G.photoMode) G.drawOverlays();
};
G.drawOverlays = function () {
  const U = G.ui;
  // area sign: a wooden board on two chains drops in from the top, bounces to a stop and swings on its
  // chains (a damped pendulum with a little lingering sway), then is hauled back up
  if (G.banner) G.drawAreaSign(G.banner);
  // toasts
  // toasts stack down from the top-right so they never cover the dialogue box
  let ty = G.net && G.net.connected ? 30 : 18;
  for (let i = G.toasts.length - 1; i >= 0; i--) {
    const t = G.toasts[i]; const a = G.clamp(Math.min(t.t / 10, (t.life - t.t) / 20), 0, 1);
    const w = U.measure(t.text, 6.5, 700) + 16;
    U.panel(G.W - w - 6, ty - 12, w, 12, t.col === 'dark' ? 'glass' : t.col, { r: 4, alpha: a, noShadow: true });
    U.text(t.text, G.W - w / 2 - 6, ty - 9.6, { size: 6.5, weight: 700, color: '#fff', align: 'center', alpha: a });
    ty += 15;
  }
  if (G.turbo && !document.getElementById('ff')) U.text('▶▶ ' + G.ffSpeed() + 'x', 6, 5, { size: 7, color: '#ffe066', weight: 800, outline: 'rgba(0,0,0,.6)' });
  if (G.net && G.net.connected) {
    const on = G.net.partner;
    U.text(on ? '● Link: ' + on.name : '● Link: waiting…', G.W - 6, 5, { size: 5.5, align: 'right', color: on ? '#7cf29a' : '#ffd166', weight: 800, outline: 'rgba(0,0,0,.6)' });
  }
  if (G.errors.length) {
    const e = G.errors[G.errors.length - 1], R = G.ERR_BOX;
    U.panel(R.x, R.y, R.w, R.h, 'red', { alpha: .95 });
    U.text('Something went wrong (the game kept running): ' + String(e).slice(0, 104), R.x + 6, R.y + 5, { size: 5.5, color: '#fff' });
    U.text('X, Esc or click to dismiss. If stuck, open the menu and Save, then reload.', R.x + 6, R.y + 17, { size: 5.5, color: '#fff' });
    U.text('✕', R.x + R.w - 8, R.y + 4, { size: 7, color: '#fff', weight: 800, align: 'center' });
  }
};
// the error box is dismissed in update (before any scene can swallow the key) or by a click on it; it
// also fades on its own, and a message that was already shown once is only logged after that
G.ERR_BOX = { x: 10, y: 10, w: 364, h: 28 };
G.errSeen = new Set(); G.errT = 0;
G.dismissErrors = function () { G.errors.length = 0; };
G.drawAreaSign = function (b) {
  const U = G.ui, c = U.c, t = b.t, S = G.gfx.S, X = v => U.X(v), Y = v => U.Y(v);
  const w = Math.max(128, U.measure(b.text, 9.5, 900) + 48), h = b.sub ? 32 : 25, cx = G.W / 2, pivot = -2;
  // vertical: a spring drop onto its chains, then out
  const rest = 12, fall = t < 60 ? rest - (rest + h + 16) * Math.exp(-t / 7) * Math.cos(t * .32) : rest;
  const y = t > 196 ? rest - Math.pow((t - 196) / 34, 2) * (rest + h + 30) : fall;
  // angle: a pendulum knocked by the stop, dying away into a slow breeze sway
  const ang = .2 * Math.exp(-t / 38) * Math.sin(t * .17 + .5) + .012 * Math.sin(t * .05) + (t > 196 ? (t - 196) * .003 : 0);
  c.save();
  c.translate(X(cx), Y(pivot)); c.rotate(ang); c.translate(-X(cx), -Y(pivot));
  // chains
  const chain = (x0) => {
    for (let yy = pivot; yy < y + 3; yy += 3) {
      c.fillStyle = (yy / 3) % 2 < 1 ? '#3a3a44' : '#6a6a78';
      c.fillRect(X(x0 - .9), Y(yy), .9 * 2 * S, 2.4 * S);
    }
  };
  chain(cx - w / 2 + 12); chain(cx + w / 2 - 12);
  // board: planks with grain, a darker frame, nails, a soft shadow
  const bx = cx - w / 2, by = y + 2;
  c.fillStyle = 'rgba(0,0,0,.28)'; c.fillRect(X(bx + 2), Y(by + 3), w * S, h * S);
  c.fillStyle = '#5a3a22'; c.fillRect(X(bx - 1.5), Y(by - 1.5), (w + 3) * S, (h + 3) * S);
  const planks = b.sub ? 3 : 2, ph = h / planks;
  for (let i = 0; i < planks; i++) {
    const py = by + i * ph, g = c.createLinearGradient(0, Y(py), 0, Y(py + ph));
    g.addColorStop(0, i % 2 ? '#c89058' : '#d49c62'); g.addColorStop(1, i % 2 ? '#a8733f' : '#b57f48');
    c.fillStyle = g; c.fillRect(X(bx), Y(py), w * S, ph * S);
    c.fillStyle = 'rgba(90,56,30,.35)'; for (let k = 0; k < 5; k++) { const gx = bx + ((i * 37 + k * 29) % Math.floor(w - 10)) + 5; c.fillRect(X(gx), Y(py + ph * .35 + (k % 3)), (8 + k * 3) * S, .5 * S); }
    c.fillStyle = 'rgba(40,24,12,.6)'; c.fillRect(X(bx), Y(py + ph - .6), w * S, .6 * S);
  }
  c.fillStyle = 'rgba(255,236,200,.35)'; c.fillRect(X(bx), Y(by), w * S, .7 * S);
  for (const nx of [bx + 12, bx + w - 12]) { c.fillStyle = '#2a2a30'; c.beginPath(); c.arc(X(nx), Y(by + 3), 1.3 * S, 0, 7); c.fill(); c.fillStyle = '#9a9aa8'; c.beginPath(); c.arc(X(nx - .3), Y(by + 2.7), .5 * S, 0, 7); c.fill(); }
  U.text(b.text, cx, by + 4.5, { size: 9.5, weight: 900, align: 'center', color: '#fff6e4', outline: '#4a2a14' });
  if (b.sub) U.text(b.sub, cx, by + 19, { size: 5.8, weight: 700, align: 'center', color: '#fff0d4', outline: 'rgba(60,36,18,.8)' });
  c.restore();
};
G.reportError = function (e) {
  let msg = e && e.message ? e.message : String(e);
  // where it came from (file:line of the first frame), so a screenshot of the box is enough to fix it
  const at = e && e.stack && (String(e.stack).split('\n').find(l => /\.js:\d+/.test(l)) || '').match(/([\w.-]+\.js):(\d+)/);
  if (at) msg += '  [' + at[1] + ':' + at[2] + ']';
  console.error(e);
  if (G.errSeen.has(msg)) return;
  G.errSeen.add(msg); G.errors.push(msg); G.errT = 0;
  if (G.errors.length > 5) G.errors.shift();
};
G.boot = function () {
  G.gfx.init();
  if (G.audio) G.audio.init();
  let last = performance.now(), acc = 0;
  const step = 1 / 60;
  const bgWanted = () => (G.net && G.net.connected) || /[?&]bgtick\b/.test(location.search);
  // A macrotask yield (MessageChannel: fast, unthrottled). Between batched updates it lets script
  // continuations run, so a button press seen by one tick is still visible to the script waiting on it.
  // Without this, Turbo (3 ticks per frame) could swallow presses in "press to continue" prompts.
  const yieldTask = (() => { const ch = new MessageChannel(), q = []; ch.port1.onmessage = () => { const r = q.shift(); if (r) r(); }; return () => new Promise(r => { q.push(r); ch.port2.postMessage(0); }); })();
  let stepping = false;
  const runUpdates = async (count) => {
    stepping = true;
    try { for (let k = 0; k < count; k++) { G.update(); if (k < count - 1) await yieldTask(); } }
    finally { stepping = false; }
  };
  const reps = () => (G.turbo ? G.ffSpeed() : 1) * (G.simSpeed || 1);   // simSpeed: automated tests fast-forward
  const loop = async (now) => {
    if (stepping) { requestAnimationFrame(loop); return; }
    if (document.hidden && bgWanted()) { last = now; acc = 0; requestAnimationFrame(loop); return; }   // the worker clock is driving
    const dt = Math.min(.1, (now - last) / 1000); last = now; acc += dt; G.realTime += dt;
    let n = 0, count = 0;
    while (acc >= step && n < 4) { count += reps(); acc -= step; n++; }
    if (n >= 4) acc = 0;
    try { if (count) await runUpdates(count); G.render(); } catch (e) { G.reportError(e); }
    requestAnimationFrame(loop);
  };
  window.addEventListener('unhandledrejection', ev => G.reportError(ev.reason));
  window.addEventListener('error', ev => G.reportError(ev.error || ev.message));
  requestAnimationFrame(loop);
  // Hidden tabs get no requestAnimationFrame. During co-op (so a partner's battle never stalls) or with
  // ?bgtick (automated tests) keep simulating from a worker clock; solo play simply pauses in the background.
  try {
    const wk = new Worker(URL.createObjectURL(new Blob(['setInterval(() => postMessage(0), 16)'], { type: 'text/javascript' })));
    let bgLast = performance.now(), bgAcc = 0;
    wk.onmessage = async () => {
      const now = performance.now();
      if (!document.hidden || !bgWanted()) { bgLast = now; bgAcc = 0; return; }
      if (stepping) return;
      bgAcc += Math.min(.25, (now - bgLast) / 1000); bgLast = now; last = now;
      let n = 0, count = 0;
      while (bgAcc >= step && n < 8) { count += reps(); G.realTime += step; bgAcc -= step; n++; }
      if (n >= 8) bgAcc = 0;
      try { if (count) await runUpdates(count); } catch (e) { G.reportError(e); }
    };
  } catch (e) { /* workers unavailable: background ticking just stays off */ }
};
// run an async flow safely (errors reported instead of hanging silently)
G.run = function (fn) { return Promise.resolve().then(fn).catch(e => G.reportError(e)); };
