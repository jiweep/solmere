'use strict';
// ============================================================================
//  Mobile mode: on-screen D-pad, A / B, Start and a Run toggle for touch screens. They press the same
//  buttons as the keyboard (G.input.touchState); taps on the game itself still act as mouse clicks.
//  Turns on for coarse pointers (phones, tablets); ?mobile forces it, ?desktop turns it off.
// ============================================================================
G.touch = (function () {
  if (typeof window === 'undefined') return { on: false };
  const q = location.search;
  const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const on = !/[?&]desktop/.test(q) && (/[?&]mobile/.test(q) || coarse || (navigator.maxTouchPoints > 0 && 'ontouchstart' in window && innerWidth < 1100));
  const T = { on, shell: () => on && innerHeight > innerWidth };   // upright phone: the handheld look
  if (!on) return T;
  document.documentElement.classList.add('mobile');
  const css = `
  html.mobile, html.mobile body { touch-action: none; overscroll-behavior: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
  #touch { position: fixed; inset: 0; z-index: 6; pointer-events: none; }
  #touch > div { position: absolute; pointer-events: auto; touch-action: none; -webkit-tap-highlight-color: transparent; }
  #tpad { left: calc(env(safe-area-inset-left, 0px) + 14px); bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
    width: min(38vmin, 170px); height: min(38vmin, 170px); border-radius: 50%;
    background: radial-gradient(circle, rgba(20,26,40,.42) 0 58%, rgba(20,26,40,.22) 59%); border: 2px solid rgba(255,255,255,.22); }
  #tpad i { position: absolute; background: rgba(255,255,255,.2); border-radius: 7px; }
  #tpad i.h { left: 14%; right: 14%; top: 39%; height: 22%; } #tpad i.v { top: 14%; bottom: 14%; left: 39%; width: 22%; }
  #tpad b { position: absolute; width: 0; height: 0; border: 9px solid transparent; opacity: .75; }
  #tpad b.u { left: calc(50% - 9px); top: 6%; border-bottom: 12px solid #fff; border-top: 0; }
  #tpad b.d { left: calc(50% - 9px); bottom: 6%; border-top: 12px solid #fff; border-bottom: 0; }
  #tpad b.l { top: calc(50% - 9px); left: 6%; border-right: 12px solid #fff; border-left: 0; }
  #tpad b.r { top: calc(50% - 9px); right: 6%; border-left: 12px solid #fff; border-right: 0; }
  #tpad.act-up b.u, #tpad.act-down b.d, #tpad.act-left b.l, #tpad.act-right b.r { opacity: 1; filter: drop-shadow(0 0 5px #8af0e0); }
  #touch .tb { display: flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff;
    font: 800 min(6vmin, 26px)/1 "SolPix11B", "Avenir Next", sans-serif; border: 2px solid rgba(255,255,255,.3);
    box-shadow: 0 3px 0 rgba(0,0,0,.35); text-shadow: 0 2px 0 rgba(0,0,0,.4); }
  #touch .tb.down { transform: translateY(2px) scale(.95); box-shadow: 0 1px 0 rgba(0,0,0,.35); filter: brightness(1.25); }
  #tA { right: calc(env(safe-area-inset-right, 0px) + 16px); bottom: calc(env(safe-area-inset-bottom, 0px) + min(20vmin, 92px));
    width: min(18vmin, 76px); height: min(18vmin, 76px); background: rgba(232,72,74,.62); }
  #tB { right: calc(env(safe-area-inset-right, 0px) + min(22vmin, 100px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
    width: min(18vmin, 76px); height: min(18vmin, 76px); background: rgba(59,130,224,.58); }
  #touch .pill { border-radius: 14px; width: min(17vmin, 74px); height: min(7vmin, 30px); background: rgba(20,26,40,.55);
    font-size: min(3.4vmin, 13px); letter-spacing: .08em; }
  #tStart { right: calc(env(safe-area-inset-right, 0px) + 16px); bottom: calc(env(safe-area-inset-bottom, 0px) + min(42vmin, 186px)); }
  #tRun { right: calc(env(safe-area-inset-right, 0px) + min(22vmin, 100px)); bottom: calc(env(safe-area-inset-bottom, 0px) + min(24vmin, 104px)); }
  #tRun.on { background: rgba(42,168,106,.75); }
  /* upright phone: a handheld console body around the game (original design) */
  #shell { position: fixed; inset: 0; z-index: -1; display: none; overflow: hidden;
    background: radial-gradient(130% 70% at 25% 8%, #6a5ce0 0%, #4436b0 40%, #2b2178 100%); }
  html.shellon #shell { display: block; }
  html.shellon, html.shellon body { background: transparent; }
  #shell::before { content: ''; position: absolute; inset: 0; background: linear-gradient(115deg, rgba(255,255,255,.14) 0 18%, rgba(255,255,255,0) 32%); }
  #shell .bezel { position: absolute; border-radius: 12px 12px 42px 12px; background: linear-gradient(#3a3c52, #232432);
    box-shadow: 0 2px 0 rgba(255,255,255,.22), 0 -1px 0 rgba(0,0,0,.4), inset 0 3px 10px rgba(0,0,0,.55); }
  #shell .led { position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #ff5a6a; box-shadow: 0 0 9px #ff5a6a; }
  #shell .ledl { position: absolute; font: 700 8px/1 "SolPix7", sans-serif; color: rgba(255,255,255,.5); letter-spacing: .1em; }
  #shell .brand { position: absolute; left: 0; right: 0; text-align: center; font: 800 17px/1 "SolPix11B", sans-serif; letter-spacing: .28em;
    color: rgba(255,255,255,.88); text-shadow: 0 1px 0 rgba(0,0,0,.45); }
  #shell .brand small { display: block; margin-top: 5px; font: 700 9px/1 "SolPix9", sans-serif; letter-spacing: .5em; color: #9fe8e0; }
  #shell .grille { position: absolute; right: 7%; bottom: 3.5%; width: 26vmin; height: 12vmin;
    background: repeating-linear-gradient(-60deg, rgba(0,0,0,.38) 0 5px, transparent 5px 13px); border-radius: 6px; opacity: .8; }
  html.shellon #tpad { background: none; border: none; width: min(40vmin, 170px); height: min(40vmin, 170px); left: 8%; bottom: 24vh; }
  html.shellon #tpad i { background: linear-gradient(#2c2c36, #17171e); border-radius: 8px; box-shadow: 0 4px 0 rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.15); }
  html.shellon #tpad i.h { left: 4%; right: 4%; top: 35%; height: 30%; } html.shellon #tpad i.v { top: 4%; bottom: 4%; left: 35%; width: 30%; }
  html.shellon #tpad b { opacity: .35; border-width: 7px; }
  html.shellon #tA, html.shellon #tB { border: none; width: min(18vmin, 74px); height: min(18vmin, 74px); color: rgba(255,255,255,.85);
    background: radial-gradient(circle at 36% 30%, #f07aa0, #b23a64 55%, #7e1f44); box-shadow: 0 5px 0 #1d1450, inset 0 -3px 6px rgba(0,0,0,.35); }
  html.shellon #tA { right: 7%; bottom: 31vh; } html.shellon #tB { right: calc(7% + min(22vmin, 94px)); bottom: 25vh; }
  html.shellon #tStart, html.shellon #tRun { background: linear-gradient(#3a3a48, #22222c); border: none; transform: rotate(-22deg);
    box-shadow: 0 3px 0 rgba(0,0,0,.45); width: min(16vmin, 66px); height: min(5.5vmin, 22px); font-size: min(3vmin, 11px); }
  html.shellon #tStart { right: auto; left: 52%; bottom: 11vh; } html.shellon #tRun { right: auto; left: 30%; bottom: 11vh; }
  html.shellon #tRun.on { background: linear-gradient(#3ec08a, #1f8a5a); }
  html.shellon #tStart.down, html.shellon #tRun.down { transform: rotate(-22deg) translateY(2px); }
  @media (orientation: landscape) { #touch > div { opacity: .55; } #touch > div.down, #tpad[class^=act] { opacity: .8; } }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  const mk = () => {
    if (document.getElementById('touch')) return;
    const root = document.createElement('div'); root.id = 'touch';
    root.innerHTML = '<div id="tpad"><i class="h"></i><i class="v"></i><b class="u"></b><b class="d"></b><b class="l"></b><b class="r"></b></div>' +
      '<div id="tA" class="tb">A</div><div id="tB" class="tb">B</div>' +
      '<div id="tStart" class="tb pill">START</div><div id="tRun" class="tb pill">RUN</div>';
    document.body.appendChild(root);
    // the handheld body (shown only when the phone is upright), laid around the game's screen
    const sh = document.createElement('div'); sh.id = 'shell';
    sh.innerHTML = '<div class="bezel"><div class="led"></div><div class="ledl">POWER</div></div><div class="brand">SOLMERE<small>TIDELIGHT</small></div><div class="grille"></div>';
    document.body.insertBefore(sh, document.body.firstChild);
    const place = () => {
      const upright = T.shell(); document.documentElement.classList.toggle('shellon', upright);
      if (!upright || !G.gfx || !G.gfx.S) return;
      const d = window.devicePixelRatio || 1, x = G.gfx.ox / d, y = G.gfx.oy / d, w = G.W * G.gfx.S / d, h = G.H * G.gfx.S / d;
      const bz = sh.querySelector('.bezel'), pad = 14, padB = 30;
      Object.assign(bz.style, { left: (x - pad) + 'px', top: (y - pad) + 'px', width: (w + pad * 2) + 'px', height: (h + pad + padB) + 'px' });
      Object.assign(sh.querySelector('.led').style, { left: '7px', top: (h + pad + 10) + 'px' });
      Object.assign(sh.querySelector('.ledl').style, { left: '19px', top: (h + pad + 10) + 'px' });
      sh.querySelector('.brand').style.top = (y + h + padB + 10) + 'px';
    };
    T.place = place;
    window.addEventListener('resize', () => requestAnimationFrame(place)); setInterval(place, 1000); requestAnimationFrame(place);
    const I = G.input, S = I.touchState, buzz = () => { try { navigator.vibrate && navigator.vibrate(8); } catch (e) { } };
    const unlock = () => { if (G.audio) G.audio.unlock(); };
    // D-pad: the thumb's angle from the centre picks one of four directions; it can slide between them
    const pad = root.querySelector('#tpad'), DIRS = ['up', 'down', 'left', 'right'];
    let cur = null;
    const setDir = d => {
      if (d === cur) return;
      for (const k of DIRS) S[k] = false;
      pad.className = d ? 'act-' + d : '';
      if (d) { S[d] = true; I.tap(d); buzz(); }
      cur = d;
    };
    const padMove = e => {
      e.preventDefault(); unlock();
      const t = e.targetTouches[0]; if (!t) { setDir(null); return; }
      const r = pad.getBoundingClientRect(), dx = t.clientX - (r.left + r.width / 2), dy = t.clientY - (r.top + r.height / 2);
      if (Math.hypot(dx, dy) < r.width * .1) { setDir(null); return; }
      setDir(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down'));
    };
    for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) pad.addEventListener(ev, padMove, { passive: false });
    // buttons: held while touched
    const button = (id, b) => {
      const el = root.querySelector(id);
      el.addEventListener('touchstart', e => { e.preventDefault(); unlock(); S[b] = true; I.tap(b); el.classList.add('down'); buzz(); }, { passive: false });
      const up = e => { e.preventDefault(); if (!e.targetTouches.length) { S[b] = false; el.classList.remove('down'); } };
      el.addEventListener('touchend', up, { passive: false }); el.addEventListener('touchcancel', up, { passive: false });
    };
    button('#tA', 'a'); button('#tB', 'b'); button('#tStart', 'start');
    // Run is a toggle (thumbs are busy with the D-pad)
    const run = root.querySelector('#tRun');
    run.addEventListener('touchstart', e => { e.preventDefault(); unlock(); S.run = !S.run; run.classList.toggle('on', S.run); buzz(); }, { passive: false });
    // no pinch zoom or double-tap zoom on the page
    document.addEventListener('gesturestart', e => e.preventDefault());
    document.addEventListener('dblclick', e => e.preventDefault());
  };
  if (document.body) mk(); else document.addEventListener('DOMContentLoaded', mk);
  return T;
})();
