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
  if (r && r._born !== undefined && !r.opaque && r.drawUI && G.realTime - r._born > .05) G.ghosts.push({ s: r, t0: G.realTime });
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
  if (G.banner && ++G.banner.t > 200) G.banner = null;
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
    if (s.draw && s.lowres !== false && !(w3 && i === start)) {
      const b = gx.bx;
      b.setTransform(1, 0, 0, 1, 0, 0); b.globalAlpha = 1; b.globalCompositeOperation = 'source-over';
      b.clearRect(0, 0, G.W, G.H);
      s.draw(b);
      if (s.isWorld && G.settings.fancy !== false) gx.present25(s.lookFX ? s.lookFX() : {});
      else if (s.fx25 && G.settings.fancy !== false) gx.present25(s.fx25());
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
  // area banner
  if (G.banner) {
    const b = G.banner, k = b.t < 20 ? b.t / 20 : b.t > 170 ? (200 - b.t) / 30 : 1;
    const y = -30 + 38 * G.ease.outCubic(G.clamp(k, 0, 1));
    const w = Math.max(110, U.measure(b.text, 9, 800) + 40);
    U.panel(G.W / 2 - w / 2, y, w, 26, 'paper', { r: 6, alpha: G.clamp(k * 1.2, 0, 1) });
    U.text(b.text, G.W / 2, y + 5, { size: 9, weight: 800, align: 'center', color: '#4a3a20', alpha: G.clamp(k, 0, 1) });
    if (b.sub) U.text(b.sub, G.W / 2, y + 16, { size: 5.5, weight: 600, align: 'center', color: '#8a7550', alpha: G.clamp(k, 0, 1) });
  }
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
    const e = G.errors[G.errors.length - 1];
    U.panel(10, 10, G.W - 20, 30, 'red', { alpha: .95 });
    U.text('Something went wrong (the game kept running): ' + String(e).slice(0, 110), 16, 15, { size: 5.5, color: '#fff' });
    U.text('Press X to dismiss. If stuck, open the menu and Save, then reload.', 16, 27, { size: 5.5, color: '#fff' });
    if (G.input.pressed('b')) G.errors.length = 0;
  }
};
G.reportError = function (e) {
  console.error(e); G.errors.push(e && e.message ? e.message : String(e));
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
