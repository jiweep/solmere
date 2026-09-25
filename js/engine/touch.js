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
  const T = { on };
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
