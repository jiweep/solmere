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
  }
  I.poll = function () {
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
