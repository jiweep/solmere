// Browser-side test helpers (not loaded by the game). Inject with:
//   const s = document.createElement('script'); s.src = 'tests/browser_helpers.js'; document.head.appendChild(s);
// Drives the game through real keyboard events so input handling is exercised too.
(function () {
  const CODES = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight', a: 'KeyZ', b: 'KeyX', start: 'KeyM', enter: 'Enter', shift: 'ShiftLeft', u: 'ArrowUp', d: 'ArrowDown', l: 'ArrowLeft', r: 'ArrowRight' };
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code === 'Enter' ? 'Enter' : '' }));
  const W = () => G.world.scene;
  const T = window.T = {
    sleep,
    // "a*3 down right" : tap buttons
    async press(seq, gap = 70) {
      for (const k of seq.split(' ')) {
        let [name, n] = k.split('*'); n = +(n || 1);
        for (let i = 0; i < n; i++) { const code = CODES[name] || name; key('keydown', code); await sleep(40); key('keyup', code); await sleep(gap); }
      }
    },
    async hold(name, ms) { const code = CODES[name] || name; key('keydown', code); await sleep(ms); key('keyup', code); },
    async until(pred, btn = 'a', max = 60, gap = 180) {
      for (let i = 0; i < max; i++) { if (pred()) return true; await T.press(btn, gap); }
      return pred();
    },
    idle: () => W() && G.top() === W() && !W().busy && !W().player.moving,
    // advance dialogue until the overworld is idle again
    async talkThrough(max = 80) { return T.until(T.idle, 'a', max, 200); },
    async waitIdle(ms = 8000) { const t0 = performance.now(); while (!T.idle() && performance.now() - t0 < ms) await sleep(50); return T.idle(); },
    // "r5 u2" : walk with real key taps; stops early if a cutscene takes over
    async walk(path) {
      for (const seg of path.split(' ')) {
        const dir = seg[0], n = +seg.slice(1) || 1;
        for (let i = 0; i < n; i++) {
          const p = W().player, sx = p.x, sy = p.y, sm = W().map.id; let tries = 0;
          while (p.x === sx && p.y === sy && W().map.id === sm && tries < 6) { key('keydown', CODES[dir]); await sleep(60); key('keyup', CODES[dir]); await sleep(120); tries++; }
          const t0 = performance.now();
          while (W().player.moving && performance.now() - t0 < 3000) await sleep(30);
          await sleep(60);
          if (W().busy || G.top() !== W()) return `interrupted at ${W().map.id},${W().player.x},${W().player.y}`;
          if (tries >= 6) return `blocked at ${W().map.id},${p.x},${p.y} (${seg} #${i})`;
          if (W().map.id !== sm) break; // warped
        }
      }
      const p = W().player; return `${W().map.id},${p.x},${p.y},${p.dir}`;
    },
    path(tx, ty) {
      const w = W(), p = w.player, m = w.map, k = (x, y) => x + ',' + y, prev = { [k(p.x, p.y)]: null }, q = [[p.x, p.y]];
      const D = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] };
      while (q.length) {
        const [x, y] = q.shift(); if (x === tx && y === ty) break;
        for (const [dk, [dx, dy]] of Object.entries(D)) {
          const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= m.w || ny >= m.h) continue;
          const kk = k(nx, ny); if (kk in prev) continue;
          const c = m.cell(nx, ny), target = nx === tx && ny === ty;
          const trig = m.objs.some(o => o.type === 'trigger' && G.checkCond(o.cond) && nx >= o.x && nx < o.x + (o.w || 1) && ny >= o.y && ny < o.y + (o.h || 1));
          if (!target && (w.blocked(nx, ny, p) || (c && (c.ledge || c.enc)) || trig)) continue;
          prev[kk] = [x, y, dk]; q.push([nx, ny]);
        }
      }
      if (!(k(tx, ty) in prev)) return null;
      const steps = []; let cur = k(tx, ty); while (prev[cur]) { const [x, y, dk] = prev[cur]; steps.unshift(dk); cur = k(x, y); }
      const segs = []; for (const s of steps) { if (segs.length && segs[segs.length - 1][0] === s) segs[segs.length - 1][1]++; else segs.push([s, 1]); }
      return segs.map(([d, n]) => d + n).join(' ');
    },
    // path avoiding tall grass/triggers when possible, falling back to any path
    async go(tx, ty) { let p = T.path(tx, ty); if (!p) return `no path to ${tx},${ty}`; return p + ' => ' + await T.walk(p); },
    scenes: () => G.scenes.map(s => s.constructor.name || (s.drawUI ? String(s.drawUI).slice(0, 40).replace(/\s+/g, ' ') : 'anon')),
    state() { const w = W(); return w ? { map: w.map.id, x: w.player.x, y: w.player.y, busy: w.busy, top: G.top() === w, errors: G.errors.slice() } : { scenes: T.scenes() }; },
    fps(ms = 2000) {
      return new Promise(res => { let n = 0, worst = 0; const t0 = performance.now(); let last = t0; const f = now => { n++; worst = Math.max(worst, now - last); last = now; if (now - t0 < ms) requestAnimationFrame(f); else res({ fps: +(n / ((now - t0) / 1000)).toFixed(1), worstMs: +worst.toFixed(1) }); }; requestAnimationFrame(f); });
    },
    typeText(s) { for (const ch of s) { window.dispatchEvent(new KeyboardEvent('keydown', { key: ch, code: 'Key' + ch.toUpperCase() })); window.dispatchEvent(new KeyboardEvent('keyup', { key: ch, code: 'Key' + ch.toUpperCase() })); } },
    // title -> continue slot 1
    async continueSlot(slot = 1) {
      const ts = () => G.scenes.find(s => s instanceof G.TitleScene), t0 = performance.now();
      while (!(ts() && ts().t > 45) && performance.now() - t0 < 6000) await sleep(50);
      await T.press('a', 500);
      await T.press('a', 500); // Continue
      await T.press('down*' + (slot - 1), 100); await T.press('a', 1500);
      return T.waitIdle(6000);
    },
  };
  console.log('[test helpers ready]');
})();
