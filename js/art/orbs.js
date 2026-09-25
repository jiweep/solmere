'use strict';
// ============================================================================
//  Orbs: Solmere's capture devices. A glass sphere with a light inside, girdled by a tilted metal ring
//  like a tiny planet; each kind has its own glass, ring metal and a small motif glowing in the core.
//  Painted per pixel at any size (48 for HD bag icons, 12-16 in the world and in battle), lit from the
//  top-left like every other sprite, crisp with a dark outline.
// ============================================================================
G.ORB_STYLE = {
  orb: { glass: '#2fb8c8', deep: '#0e4a66', ring: 'brass', motif: 'spark' },
  greatorb: { glass: '#4a7cf0', deep: '#16266e', ring: 'silver', motif: 'twin' },
  ultraorb: { glass: '#8a4ae0', deep: '#2a0e5a', ring: 'gold', motif: 'gem' },
  netorb: { glass: '#3ac88a', deep: '#0c4a3a', ring: 'vine', motif: 'weave' },
  duskorb: { glass: '#3a3a8a', deep: '#0a0a26', ring: 'silver', motif: 'moon' },
  quickorb: { glass: '#f0a830', deep: '#6a2a08', ring: 'silver', motif: 'comet' },
  timerorb: { glass: '#e8e0cc', deep: '#6a5a44', ring: 'brass', motif: 'hourglass' },
  healorb: { glass: '#f07aa8', deep: '#6a1a3a', ring: 'gold', motif: 'leaf' },
  bondorb: { glass: '#ff8ab8', deep: '#7a1a48', ring: 'gold', motif: 'heart' },
  crownorb: { glass: '#f4cc4a', deep: '#6a4a08', ring: 'gold', motif: 'crown' },
};
G.orbArt = (function () {
  const cache = {};
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const RING = { brass: ['#6a4a1a', '#b8862e', '#f0c860'], silver: ['#4a4e5e', '#9aa2b4', '#eef2fa'], gold: ['#7a5208', '#d8a020', '#fff0a0'], vine: ['#1e4a1a', '#3a8a2a', '#9ae06a'] };
  // motifs as tiny masks in core space (-1..1)
  const MOTIF = {
    spark: (x, y) => Math.abs(x) + Math.abs(y) * 2.2 < .5 || Math.abs(y) + Math.abs(x) * 2.2 < .5,
    twin: (x, y) => (Math.abs(x + .28) + Math.abs(y) * 1.8 < .3) || (Math.abs(x - .3) + Math.abs(y + .1) * 1.8 < .24),
    gem: (x, y) => Math.abs(x) * 1.2 + Math.abs(y) < .5,
    weave: (x, y) => (Math.abs(((x + y) * 2.2 % 1 + 1) % 1 - .5) < .14 || Math.abs(((x - y) * 2.2 % 1 + 1) % 1 - .5) < .14) && x * x + y * y < .5,
    moon: (x, y) => x * x + y * y < .3 && (x + .22) ** 2 + (y + .12) ** 2 > .2,
    comet: (x, y) => (x - .18) ** 2 + (y + .18) ** 2 < .06 || (Math.abs((x + y) * .7) < .1 && x < .1 && x > -.55 && y > -.1),
    hourglass: (x, y) => Math.abs(y) < .5 && Math.abs(x) < Math.abs(y) * .9 + .06,
    leaf: (x, y) => { const u = (x + y) * .7, v = (y - x) * .7; return u * u / .22 + v * v / .06 < 1; },
    heart: (x, y) => { const yy = -y + .1; return (x * x + yy * yy - .12) ** 3 - x * x * yy ** 3 * .9 < 0 && x * x + y * y < .4; },
    crown: (x, y) => y > -.1 && y < .3 && Math.abs(x) < .45 || (y <= -.1 && y > -.4 && Math.abs(Math.abs(x) - (Math.abs(x) > .2 ? .4 : 0)) < .09),
  };
  function paint(id, size, tint) {
    const st = G.ORB_STYLE[id] || G.ORB_STYLE.orb;
    const cv = G.makeCanvas(size, size), c = cv.getContext('2d'), im = c.createImageData(size, size), d = im.data;
    const glass = hex(tint || st.glass), deep = hex(st.deep), R = RING[st.ring].map(hex), out = [20, 18, 30];
    const cx = size / 2, cy = size / 2 + size * .02, r = size * .4, L = [-.55, -.6, .58];
    const tilt = -.32, ringR = r * 1.18, ringT = Math.max(1, size * .07), ringFlat = .34;
    const set = (x, y, col, a = 255) => { if (x < 0 || y < 0 || x >= size || y >= size) return; const i = (y * size + x) * 4; d[i] = col[0]; d[i + 1] = col[1]; d[i + 2] = col[2]; d[i + 3] = a; };
    const inRing = (x, y) => {   // a flattened ellipse band, rotated by the tilt
      const dx = x - cx, dy = y - cy, u = dx * Math.cos(tilt) + dy * Math.sin(tilt), v = -dx * Math.sin(tilt) + dy * Math.cos(tilt);
      const e = Math.sqrt((u / ringR) ** 2 + (v / (ringR * ringFlat)) ** 2);
      return Math.abs(e - 1) * ringR < ringT * .6 ? { front: v > 0, u } : null;
    };
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const px = x + .5, py = y + .5, nx = (px - cx) / r, ny = (py - cy) / r, dd = nx * nx + ny * ny;
      const rg = inRing(px, py);
      if (rg && rg.front) {   // the ring's near half passes in front of the glass
        const k = .5 + .5 * Math.cos((rg.u / ringR) * 1.6 + .5); set(x, y, R[k > .78 ? 2 : k > .35 ? 1 : 0]); continue;
      }
      if (dd <= 1) {
        const nz = Math.sqrt(1 - dd), lit = Math.max(0, -(nx * L[0] + ny * L[1]) * .8 + nz * L[2]);
        let col = mix(deep, glass, Math.min(1, .25 + lit * .95));
        // the glowing core and its motif
        const core = Math.sqrt(dd); if (core < .62) col = mix(col, [255, 250, 230], (1 - core / .62) * .35);
        if (MOTIF[st.motif](nx / .62, ny / .62)) col = mix([255, 255, 245], hex(st.ring === 'vine' ? '#d8ffb0' : '#fff6d0'), .3);
        // glass highlights: a bright window top-left, a rim glint bottom-right
        if ((nx + .42) ** 2 + (ny + .45) ** 2 < .05) col = [255, 255, 255];
        else if (dd > .78 && nx > .2 && ny > .2) col = mix(col, [255, 255, 255], .35);
        // quantise to a few tones so it reads as pixel art
        col = col.map(v => Math.round(v / 24) * 24);
        set(x, y, dd > .86 && size >= 20 ? mix(col, out, .35) : col); continue;
      }
      if (rg) { const k = .5 + .5 * Math.cos((rg.u / ringR) * 1.6 + .5); set(x, y, R[k > .6 ? 1 : 0]); continue; }   // far half, beside the glass
    }
    // one-pixel dark outline around everything
    const a = i => d[i * 4 + 3];
    const src = new Uint8ClampedArray(d);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const i = y * size + x; if (src[i * 4 + 3]) continue;
      if ((x > 0 && src[(i - 1) * 4 + 3]) || (x < size - 1 && src[(i + 1) * 4 + 3]) || (y > 0 && src[(i - size) * 4 + 3]) || (y < size - 1 && src[(i + size) * 4 + 3])) set(x, y, out);
    }
    c.putImageData(im, 0, 0);
    return cv;
  }
  return function (id, size = 16, tint) {
    const k = id + '|' + size + '|' + (tint || '');
    return cache[k] || (cache[k] = paint(id, size, tint));
  };
})();
