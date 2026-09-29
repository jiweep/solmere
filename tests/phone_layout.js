// The touch controls fit every screen: on a range of phones and tablets, upright and sideways, each control
// is fully on screen with its label fitting inside it, no two controls overlap, upright the controls never cover the game (or its lower
// text screen), and every control is big enough for a thumb.
//   node server.js &   NODE_PATH=/opt/node22/lib/node_modules node tests/phone_layout.js
const { chromium } = require('playwright');
const DEVICES = [
  ['small phone (SE)', 375, 667], ['phone', 390, 844], ['large phone', 430, 932], ['narrow Android', 360, 780],
  ['short wide Android', 412, 732], ['small tablet', 744, 1133], ['tablet', 820, 1180],
];
const MIN = 40;   // smallest comfortable touch target, in CSS pixels (guidelines say 44-48; pills may be wide and short)
(async () => {
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  let fails = 0;
  for (const [name, w0, h0] of DEVICES) for (const land of [false, true]) {
    const [w, h] = land ? [h0, w0] : [w0, h0];
    const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true });
    const pg = await ctx.newPage();
    await pg.goto('http://localhost:8080/?mute&mobile'); await pg.waitForFunction(() => window.G && G.scenes.length > 0 && G.touch && G.touch.place); await pg.waitForTimeout(400);
    const r = await pg.evaluate(() => {
      G.gfx.resize(); G.touch.place();
      const box = el => { const b = el.getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; };
      const ids = ['tpad', 'tA', 'tB', 'tStart', 'tRun'], c = {};
      const clipped = [];
      for (const id of ids) { const e = document.getElementById(id); if (e) { c[id] = box(e); if (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1) clipped.push(id); } }
      for (const id of ['ff', 'sc', 'dim']) { const e = document.getElementById(id); if (e && e.offsetParent !== null) c[id] = box(e); }
      const d = G.gfx.pr(), L = G.gfx.lower;
      const screen = { x: G.gfx.ox / d, y: G.gfx.oy / d, w: G.W * G.gfx.S / d, h: (L ? L.y + L.h - G.gfx.oy : G.H * G.gfx.S) / d };
      return { c, clipped, screen, upright: G.touch.shell(), W: innerWidth, H: innerHeight };
    });
    const out = [], ov = (a, b) => a.x < b.x + b.w - 1 && b.x < a.x + a.w - 1 && a.y < b.y + b.h - 1 && b.y < a.y + a.h - 1;
    const ks = Object.keys(r.c);
    for (const k of ks) {
      const b = r.c[k];
      if (b.x < 0 || b.y < 0 || b.x + b.w > r.W + .5 || b.y + b.h > r.H + .5) out.push(`${k} off screen (${b.x | 0},${b.y | 0} ${b.w | 0}x${b.h | 0})`);
      if (['tpad', 'tA', 'tB', 'tStart', 'tRun'].includes(k) && Math.min(b.w, b.h) < (k === 'tStart' || k === 'tRun' ? 22 : MIN)) out.push(`${k} too small (${b.w | 0}x${b.h | 0})`);
      if (r.upright && ov(b, r.screen)) out.push(`${k} covers the game screen`);
    }
    for (const k of r.clipped) out.push(`${k}: its label doesn't fit`);
    for (let i = 0; i < ks.length; i++) for (let j = i + 1; j < ks.length; j++) if (ov(r.c[ks[i]], r.c[ks[j]])) out.push(`${ks[i]} overlaps ${ks[j]}`);
    if (r.screen.x < -.5 || r.screen.x + r.screen.w > r.W + .5) out.push('game screen wider than the display');
    fails += out.length;
    console.log(`${out.length ? 'FAIL' : 'ok  '} ${(name + (land ? ', sideways' : '')).padEnd(30)} ${w}x${h}${out.length ? '\n   ' + out.join('\n   ') : ''}`);
    await ctx.close();
  }
  console.log(fails ? `${fails} problem(s)` : `ok: the controls fit all ${DEVICES.length * 2} screens`);
  await br.close();
  process.exit(fails ? 1 : 0);
})();
