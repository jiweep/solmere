'use strict';
// ============================================================================
//  Input: keyboard + gamepad, with edge detection and menu key-repeat
// ============================================================================
G.input = (function () {
  const BTN = ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'run', 'bike', 'l', 'r', 'turbo', 'photo', 'debug', 'help'];
  const keymap = {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    KeyZ: 'a', Space: 'a', Enter: 'a', KeyC: 'a', NumpadEnter: 'a',
    KeyX: 'b', Escape: 'b', Backspace: 'b',
    KeyM: 'start',
    ShiftLeft: 'run', ShiftRight: 'run',
    KeyF: 'bike', KeyQ: 'l', KeyE: 'r', KeyR: 'r', Tab: 'turbo', KeyP: 'photo', Backquote: 'debug', F2: 'debug', KeyH: 'help',
  };
  const down = {}, prev = {}, held = {}, pressedQ = {};
  let textListener = null;   // for naming screens: receives raw characters
  const I = {
    down, held, lastDevice: 'kb',
    anyKeyThisFrame: false,
    pressed(b) { return !!pressedQ[b]; },
    released(b) { return !down[b] && prev[b]; },
    isDown(b) { return !!down[b]; },
    // menu-style repeat: true on press and then every N frames while held
    repeat(b, delay = 14, rate = 4) {
      if (pressedQ[b]) return true;
      const h = held[b] || 0; return down[b] && h > delay && (h - delay) % rate === 0;
    },
    consume(b) { pressedQ[b] = false; },
    consumeAll() { for (const b of BTN) pressedQ[b] = false; },
    setTextListener(fn) { textListener = fn; },
    dirHeld() {
      // most recently pressed held direction wins
      let best = null, bt = 1e9;
      for (const d of ['up', 'down', 'left', 'right']) if (down[d] && held[d] < bt) { bt = held[d]; best = d; }
      return best;
    },
  };
  const kbState = {}, padState = {}, tapQ = {};   // tapQ latches keydowns so sub-frame taps still register
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', e => {
      if (textListener && !e.metaKey && !e.ctrlKey) {
        if (textListener(e)) { e.preventDefault(); return; }
      }
      const b = keymap[e.code];
      if (b) { if (!e.repeat) tapQ[b] = true; kbState[b] = true; e.preventDefault(); I.lastDevice = 'kb'; }
      if (G.audio) G.audio.unlock();
    });
    window.addEventListener('keyup', e => { const b = keymap[e.code]; if (b) { kbState[b] = false; e.preventDefault(); } });
    window.addEventListener('blur', () => { for (const k in kbState) kbState[k] = false; });
    window.addEventListener('mousedown', () => G.audio && G.audio.unlock());
    // ---- mouse: position in game units; clicks drive UI hotspots, or confirm/back as a fallback
    const toGame = e => {
      const cv = G.gfx && G.gfx.canvas; if (!cv) return null;
      const r = cv.getBoundingClientRect(), px = (e.clientX - r.left) * cv.width / r.width, py = (e.clientY - r.top) * cv.height / r.height;
      return [(px - G.gfx.ox) / G.gfx.S, (py - G.gfx.oy) / G.gfx.S];
    };
    window.addEventListener('mousemove', e => { const p = toGame(e); if (p) { M.x = p[0]; M.y = p[1]; M.moved = true; M.active = true; I.lastDevice = 'mouse'; } });
    window.addEventListener('mousedown', e => {
      if (e.target && e.target.id === 'ff') return;
      const p = toGame(e); if (!p) return; M.x = p[0]; M.y = p[1]; M.active = true;
      if (e.button === 0) M.click = true; else if (e.button === 2) M.rclick = true;
    });
    window.addEventListener('contextmenu', e => { if (e.target && e.target.tagName === 'CANVAS') e.preventDefault(); });
    window.addEventListener('wheel', e => { M.wheel += Math.sign(e.deltaY); }, { passive: true });
  }
  const M = { x: -1, y: -1, moved: false, click: false, rclick: false, wheel: 0, active: false };
  I.mouse = M;
  I.tap = function (b) { tapQ[b] = true; };
  // hotspots registered while drawing (G.ui.hot); only the top scene's respond
  function dispatchMouse() {
    const hs = (G.ui && G.ui._hot) || [], top = G.top && G.top();
    const mine = hs.filter(h => h.scene === top);
    let hit = null;
    for (let i = mine.length - 1; i >= 0; i--) { const h = mine[i]; if (M.x >= h.x && M.x < h.x + h.w && M.y >= h.y && M.y < h.y + h.h) { hit = h; break; } }
    if (M.moved && hit && hit.hover) hit.hover();
    if (M.click) {
      if (hit && hit.click) hit.click();
      else if (top && !top.isWorld && !top.noClickConfirm && !top.menu) tapQ.a = true;   // click anywhere: advance / confirm
    }
    if (M.rclick) tapQ.b = true;
    if (M.wheel) { tapQ[M.wheel > 0 ? 'down' : 'up'] = true; M.wheel = 0; }
    M.moved = M.click = M.rclick = false;
  }
  I.poll = function () {
    if (typeof window !== 'undefined') dispatchMouse();
    // gamepad
    for (const b of BTN) padState[b] = false;
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    for (const p of pads) {
      if (!p || !p.connected) continue;
      const B = i => p.buttons[i] && p.buttons[i].pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if (B(12) || ay < -.5) padState.up = true;
      if (B(13) || ay > .5) padState.down = true;
      if (B(14) || ax < -.5) padState.left = true;
      if (B(15) || ax > .5) padState.right = true;
      if (B(0)) padState.a = true;
      if (B(1)) padState.b = true;
      if (B(9)) padState.start = true;
      if (B(2)) padState.run = true;
      if (B(3)) padState.bike = true;
      if (B(4)) padState.l = true;
      if (B(5)) padState.r = true;
      if (B(8)) padState.turbo = true;
      for (const k in padState) if (padState[k]) I.lastDevice = 'pad';
    }
    I.anyKeyThisFrame = false;
    for (const b of BTN) {
      prev[b] = down[b];
      down[b] = !!(kbState[b] || padState[b] || tapQ[b]); tapQ[b] = false;
      held[b] = down[b] ? (held[b] || 0) + 1 : 0;
      pressedQ[b] = down[b] && !prev[b];
      if (pressedQ[b]) I.anyKeyThisFrame = true;
    }
  };
  I.BTN = BTN;
  return I;
})();
