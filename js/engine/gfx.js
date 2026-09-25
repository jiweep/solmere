'use strict';
// ============================================================================
//  Graphics: canvas management, low-res world buffer, crisp native-res UI,
//  pixel-art sprite pipeline ("pixelizer"), particles, fades.
// ============================================================================
G.FONT = '"Pixelify Sans", "Avenir Next", "Avenir", "Nunito", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
// the bundled pixel font must be decoded before the first canvas text is drawn
G.loadFonts = function () {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.all([400, 500, 600, 700].map(w => document.fonts.load(`${w} 16px "Pixelify Sans"`).catch(() => null)));
};
G.MONO = '"SF Mono", Menlo, Consolas, monospace';

G.makeCanvas = function (w, h) {
  if (typeof OffscreenCanvas !== 'undefined' && G.useOffscreen) return new OffscreenCanvas(w, h);
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas'); c.width = w; c.height = h; return c;
};

G.gfx = {
  S: 4, ox: 0, oy: 0, fill: false,
  init() {
    const cv = document.getElementById('game');
    this.canvas = cv; this.cx = cv.getContext('2d', { alpha: true });
    this.buf = G.makeCanvas(G.W, G.H); this.bx = this.buf.getContext('2d');
    this.bx.imageSmoothingEnabled = false;
    window.addEventListener('resize', () => this.resize());
    this.resize();
  },
  resize() {
    const dpr = window.devicePixelRatio || 1;
    const cw = Math.floor(window.innerWidth * dpr), ch = Math.floor(window.innerHeight * dpr);
    this.canvas.width = cw; this.canvas.height = ch;
    this.canvas.style.width = window.innerWidth + 'px'; this.canvas.style.height = window.innerHeight + 'px';
    let S = Math.min(cw / G.W, ch / G.H);
    if (!this.fill) S = Math.max(1, Math.floor(S));
    this.S = S; this.ox = Math.floor((cw - G.W * S) / 2); this.oy = Math.floor((ch - G.H * S) / 2);
    this.cx.imageSmoothingEnabled = false;
    this._fontCache = {};
  },
  // DS-style 2.5D camera: rows near the bottom of the screen are magnified, far rows compressed,
  // as if the camera tilts down over the world. Then depth haze, bloom and time-of-day grading.
  present25(o = {}) {
    const c = this.cx, S = this.S, W = G.W, H = G.H, buf = this.buf;
    c.imageSmoothingEnabled = false; this._persp = true;
    const MAG = o.tilt === undefined ? .14 : o.tilt;
    if (!this._rows || this._rowsKey !== MAG + '|' + S) {
      // destination y/height per source row so the stack fills the screen exactly
      const m = []; let tot = 0;
      // linear in screen y = a flat tilted plane (a curved profile read as a rolling, drum-like floor)
      for (let y = 0; y < H; y++) { const k = 1 + MAG * (y / (H - 1)); m.push(k); tot += k; }
      let acc = 0; this._rows = m.map(k => { const r = { k, y0: acc / tot * H * S }; acc += k; r.y1 = acc / tot * H * S; return r; });
      // inverse map per destination pixel row: source row (fractional) and magnification
      this._dst = [];
      let yi = 0;
      for (let j = 0; j < H * S; j++) {
        while (yi < H - 1 && this._rows[yi].y1 <= j + .5) yi++;
        const r = this._rows[yi], f = (j + .5 - r.y0) / (r.y1 - r.y0);
        this._dst.push({ sy: (yi + Math.max(0, Math.min(1, f))) * S, k: r.k });
      }
      this._rowsKey = MAG + '|' + S;
    }
    if (MAG === 0) { c.drawImage(buf, 0, 0, W, H, this.ox, this.oy, W * S, H * S); }
    else {
      // 1) crisp integer upscale, 2) tilt from the upscaled image with filtering: the slant without pixel shimmer
      if (!this._hi || this._hi.width !== W * S) { this._hi = G.makeCanvas(W * S, H * S); this._hix = this._hi.getContext('2d'); }
      const hx = this._hix; hx.imageSmoothingEnabled = false; hx.drawImage(buf, 0, 0, W, H, 0, 0, W * S, H * S);
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'low';
      const WS = W * S;
      for (let j = 0; j < H * S; j++) {
        const d = this._dst[j], sw = WS / d.k;
        c.drawImage(this._hi, (WS - sw) / 2, Math.min(H * S - 1, d.sy), sw, 1, this.ox, this.oy + j, WS, 1);
      }
      c.imageSmoothingEnabled = false;
    }
    const x0 = this.ox, y0 = this.oy, w = W * S, h = H * S;
    // depth haze toward the far edge
    const tint = o.haze || 'rgba(190,215,255,';
    const g = c.createLinearGradient(0, y0, 0, y0 + h * .3);
    g.addColorStop(0, tint + (o.hazeA === undefined ? .30 : o.hazeA) + ')'); g.addColorStop(1, tint + '0)');
    c.fillStyle = g; c.fillRect(x0, y0, w, h * .3);
    // bloom: tiny blurred copy of the bright parts, screened back on top
    if (o.bloom !== false && this.bloomOK !== false) {
      if (!this._bl) { this._bl = G.makeCanvas(96, 54); this._blx = this._bl.getContext('2d'); }
      const b = this._blx;
      try {
        b.imageSmoothingEnabled = true; b.filter = 'brightness(.85) contrast(3.2) saturate(1.4) blur(2px)';
        b.clearRect(0, 0, 96, 54); b.drawImage(this.canvas, x0, y0, w, h, 0, 0, 96, 54); b.filter = 'none';
        c.save(); c.imageSmoothingEnabled = true; c.globalCompositeOperation = 'screen'; c.globalAlpha = (o.bloomA || .22) * .7;
        c.drawImage(this._bl, 0, 0, 96, 54, x0, y0, w, h); c.restore();
      } catch (e) { this.bloomOK = false; }
    }
    // grading: warm key light from the upper left, cool shade lower right
    if (o.grade !== false) {
      c.save(); c.globalCompositeOperation = 'soft-light';
      const gr = c.createLinearGradient(x0, y0, x0 + w, y0 + h);
      gr.addColorStop(0, o.key || 'rgba(255,220,160,.35)'); gr.addColorStop(.55, 'rgba(128,128,128,0)'); gr.addColorStop(1, o.fill || 'rgba(40,60,120,.45)');
      c.fillStyle = gr; c.fillRect(x0, y0, w, h); c.restore();
    }
    c.imageSmoothingEnabled = false;
  },
  // world-buffer coords -> screen coords under the 2.5D warp (for glows drawn in UI space)
  projX(x, y) { const r = this._persp && this._rows && this._rows[Math.max(0, Math.min(G.H - 1, Math.floor(y)))]; return this.ox + (r ? G.W / 2 + (x - G.W / 2) * r.k : x) * this.S; },
  projY(y) { if (!this._persp || !this._rows) return this.oy + y * this.S; const i = Math.max(0, Math.min(G.H - 1, Math.floor(y))), r = this._rows[i]; return this.oy + r.y0 + (y - i) * (r.y1 - r.y0); },
  // blit low-res buffer to screen
  present(alpha = 1) {
    const c = this.cx; c.imageSmoothingEnabled = false; this._persp = false;
    c.globalAlpha = alpha;
    c.drawImage(this.buf, 0, 0, G.W, G.H, this.ox, this.oy, G.W * this.S, G.H * this.S);
    c.globalAlpha = 1;
  },
};

// ----------------------------------------------------------------- UI -----
// All UI coordinates are in low-res units but rendered at native resolution.
G.ui = {
  get c() { return G.gfx.cx; },
  _hot: [], _hotNext: [], _scene: null,
  // clickable region for the mouse, in game units; registered while drawing, owned by the drawing scene
  hot(x, y, w, h, hover, click) { this._hotNext.push({ x, y, w, h, hover, click, scene: this._scene }); },
  X(x) { return G.gfx.ox + x * G.gfx.S; },
  Y(y) { return G.gfx.oy + y * G.gfx.S; },
  font(size, weight = 600, fam = G.FONT) {
    const k = size + '|' + weight + '|' + fam + '|' + G.gfx.S;
    let f = G.gfx._fontCache && G.gfx._fontCache[k];
    if (!f) { f = `${weight} ${(size * G.gfx.S).toFixed(1)}px ${fam}`; if (G.gfx._fontCache) G.gfx._fontCache[k] = f; }
    this.c.font = f; return f;
  },
  measure(str, size = 8, weight = 600) { this.font(size, weight); return this.c.measureText(str).width / G.gfx.S; },
  COLORS: {
    r: '#e8484a', b: '#3b82e0', g: '#2aa86a', y: '#d99a14', p: '#9b5de5', w: null, o: '#ea7a2a', c: '#1ba7b8', k: '#555a66',
  },
  // text: opts {size, color, align, weight, shadow, alpha, base}
  text(str, x, y, o = {}) {
    const c = this.c, S = G.gfx.S;
    const size = o.size || 8, weight = o.weight || 600;
    this.font(size, weight, o.mono ? G.MONO : G.FONT);
    c.textAlign = o.align || 'left'; c.textBaseline = o.base || 'top';
    const px = this.X(x), py = this.Y(y);
    if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o.outline) {
      c.lineJoin = 'round'; c.lineWidth = o.outlineW ? o.outlineW * S : S * 1.4; c.strokeStyle = o.outline; c.strokeText(str, px, py);
    }
    if (o.shadow !== false) {
      c.fillStyle = o.shadow || (o.color && this.isLight(o.color) ? 'rgba(0,0,0,.45)' : 'rgba(0,0,0,.14)');
      c.fillText(str, px + S * .55, py + S * .55);
    }
    c.fillStyle = o.color || '#283040';
    c.fillText(str, px, py);
    c.globalAlpha = 1;
  },
  isLight(col) { if (typeof col !== 'string' || col[0] !== '#') return true; const [r, g, b] = G.col.parse(col); return (r * .3 + g * .59 + b * .11) > 150; },
  // rich text with {r}..{w} color codes; returns width
  rich(str, x, y, o = {}) {
    const parts = str.split(/(\{[a-z]\})/);
    let cx = x; const base = o.color || '#283040'; let col = base;
    for (const p of parts) {
      const m = p.match(/^\{([a-z])\}$/);
      if (m) { col = this.COLORS[m[1]] || base; if (m[1] === 'w') col = base; continue; }
      if (!p) continue;
      this.text(p, cx, y, { ...o, color: col });
      cx += this.measure(p, o.size || 8, o.weight || 600);
    }
    return cx - x;
  },
  stripCodes: s => s.replace(/\{[a-z]\}/g, ''),
  wrap(str, maxW, size = 8, weight = 600) {
    const out = [];
    for (const para of String(str).split('\n')) {
      const words = para.split(' ');
      let line = '';
      for (const w of words) {
        const test = line ? line + ' ' + w : w;
        if (this.measure(this.stripCodes(test), size, weight) > maxW && line) {
          out.push(line);
          // carry open color code to next line
          const codes = line.match(/\{[a-z]\}/g); const last = codes ? codes[codes.length - 1] : null;
          line = (last && last !== '{w}' ? last : '') + w;
        } else line = test;
      }
      out.push(line);
    }
    return out;
  },
  // skewed parallelogram (Persona-style slab): top edge shifted right by sk
  para(x, y, w, h, sk, fill) {
    const c = this.c; c.fillStyle = fill; c.beginPath();
    c.moveTo(this.X(x + sk), this.Y(y)); c.lineTo(this.X(x + w + sk), this.Y(y)); c.lineTo(this.X(x + w), this.Y(y + h)); c.lineTo(this.X(x), this.Y(y + h)); c.closePath(); c.fill();
  },
  // pixel-art rounded rectangle: world-pixel aligned, corners cut in 1px steps (DS window style)
  rrect(x, y, w, h, r) {
    const c = this.c, S = G.gfx.S;
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const k = r >= 3 ? 2 : r >= 1 ? 1 : 0, steps = k === 2 ? [2, 1] : k === 1 ? [1] : [];
    const P = (px, py) => [this.X(px), this.Y(py)];
    const pts = [];
    // top-left -> top-right -> bottom-right -> bottom-left, stepping around each corner
    pts.push(P(x + (steps[0] || 0), y));
    pts.push(P(x + w - (steps[0] || 0), y));
    steps.forEach((st, i) => { pts.push(P(x + w - st, y + i + 1)); pts.push(P(x + w - (steps[i + 1] || 0), y + i + 1)); });
    pts.push(P(x + w, y + h - steps.length));
    for (let i = steps.length - 1; i >= 0; i--) { pts.push(P(x + w - (steps[i + 1] || 0), y + h - i - 1)); pts.push(P(x + w - steps[i], y + h - i - 1)); }
    pts.push(P(x + w - (steps[0] || 0), y + h)); pts.push(P(x + (steps[0] || 0), y + h));
    steps.forEach((st, i) => { pts.push(P(x + st, y + h - i - 1)); pts.push(P(x + (steps[i + 1] || 0), y + h - i - 1)); });
    pts.push(P(x, y + steps.length));
    for (let i = steps.length - 1; i >= 0; i--) { pts.push(P(x + (steps[i + 1] || 0), y + i + 1)); pts.push(P(x + steps[i], y + i + 1)); }
    c.beginPath(); c.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]);
    c.closePath();
  },
  fillRect(x, y, w, h, col, a) {
    const c = this.c; if (a !== undefined) c.globalAlpha = a;
    c.fillStyle = col; c.fillRect(this.X(x), this.Y(y), w * G.gfx.S, h * G.gfx.S); c.globalAlpha = 1;
  },
  // themed panel
  panel(x, y, w, h, style = 'light', o = {}) {
    const c = this.c, r = o.r !== undefined ? o.r : 4;
    const T = G.ui.THEMES[style] || G.ui.THEMES.light;
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    // hard drop shadow, 1px down-right
    if (!o.noShadow) { this.rrect(x + 1, y + 1, w, h, r); c.fillStyle = 'rgba(0,0,0,.32)'; c.fill(); }
    // dark outline, then a bevel: light top/left edge, shaded bottom/right edge
    this.rrect(x, y, w, h, r); c.fillStyle = T.border; c.fill();
    if (w > 4 && h > 4) {
      this.rrect(x + 1, y + 1, w - 2, h - 2, r - 1); c.fillStyle = T.hi || G.col.light(T.top.startsWith('rgba') ? '#3a4660' : T.top, .5); c.fill();
      this.rrect(x + 2, y + 2, w - 3, h - 3, r - 2); c.fillStyle = T.lo || (T.bot.startsWith('rgba') ? 'rgba(0,0,0,.4)' : G.col.dark(T.bot, .16)); c.fill();
      this.rrect(x + 2, y + 2, w - 4, h - 4, r - 2); c.fillStyle = T.bot; c.fill();
      // flat two-tone body: the upper band a step lighter
      c.save(); this.rrect(x + 2, y + 2, w - 4, h - 4, r - 2); c.clip();
      c.fillStyle = T.top; c.fillRect(this.X(x + 2), this.Y(y + 2), (w - 4) * G.gfx.S, Math.round((h - 4) * .55) * G.gfx.S);
      c.restore();
    }
    c.globalAlpha = 1;
  },
  THEMES: {
    light: { top: '#fdfcf7', bot: '#eae6da', border: '#2a3040', inner: 'rgba(255,255,255,.9)' },
    dark: { top: '#2c3850', bot: '#1a2233', border: '#0b0f18', inner: 'rgba(120,160,220,.35)' },
    teal: { top: '#3fd0bf', bot: '#1e9486', border: '#0e4a44', inner: 'rgba(255,255,255,.5)' },
    red: { top: '#ff7a6b', bot: '#d63d3d', border: '#5a1515', inner: 'rgba(255,255,255,.45)' },
    blue: { top: '#6db4ff', bot: '#2f6fd6', border: '#12305e', inner: 'rgba(255,255,255,.45)' },
    gold: { top: '#ffe38a', bot: '#f0b429', border: '#6b4a0a', inner: 'rgba(255,255,255,.6)' },
    green: { top: '#7be495', bot: '#2ba85a', border: '#0f4a26', inner: 'rgba(255,255,255,.5)' },
    purple: { top: '#b18cff', bot: '#6e44d6', border: '#2a1560', inner: 'rgba(255,255,255,.45)' },
    glass: { top: 'rgba(30,40,60,.82)', bot: 'rgba(14,20,32,.88)', border: 'rgba(0,0,0,.7)', inner: 'rgba(255,255,255,.12)' },
    paper: { top: '#fff8e7', bot: '#f3e6c4', border: '#6b5433', inner: 'rgba(255,255,255,.8)' },
    select: { top: '#fff1b8', bot: '#ffd35c', border: '#8a5d00', inner: 'rgba(255,255,255,.8)' },
  },
  // selection cursor (animated arrow)
  cursor(x, y, col = '#e8484a') {
    const c = this.c, S = G.gfx.S, b = Math.sin(G.realTime * 8) * .8;
    const px = this.X(x + b), py = this.Y(y);
    c.fillStyle = 'rgba(0,0,0,.3)';
    c.beginPath(); c.moveTo(px + S * .5, py - 3 * S + S * .5); c.lineTo(px + 4 * S + S * .5, py + S * .5); c.lineTo(px + S * .5, py + 3 * S + S * .5); c.fill();
    c.fillStyle = col;
    c.beginPath(); c.moveTo(px, py - 3 * S); c.lineTo(px + 4 * S, py); c.lineTo(px, py + 3 * S); c.fill();
  },
  bar(x, y, w, h, frac, col, bg = '#39414f', o = {}) {
    const c = this.c, S = G.gfx.S;
    x = Math.round(x * 2) / 2; y = Math.round(y * 2) / 2;
    if (o.border !== false) { c.fillStyle = 'rgba(20,24,34,.85)'; c.fillRect(this.X(x - .5), this.Y(y - .5), (w + 1) * S, (h + 1) * S); }
    c.fillStyle = bg; c.fillRect(this.X(x), this.Y(y), w * S, h * S);
    if (frac > 0) {
      const fw = Math.max(.5, w * G.clamp(frac, 0, 1));
      c.fillStyle = G.col.dark(col, .22); c.fillRect(this.X(x), this.Y(y), fw * S, h * S);
      c.fillStyle = col; c.fillRect(this.X(x), this.Y(y), fw * S, h * .62 * S);
      c.fillStyle = G.col.light(col, .45); c.fillRect(this.X(x), this.Y(y), fw * S, Math.min(h * .25, .5) * S);
    }
  },
  hpColor(f) { return f > .5 ? '#3ed16b' : f > .2 ? '#f5c02b' : '#ef4b4b'; },
  // draw a low-res image (canvas) at native scale (nearest-neighbour)
  img(im, x, y, o = {}) {
    if (!im) return;
    const c = this.c, S = G.gfx.S;
    const sc = o.scale || 1, w = (o.w || im.width) * sc, h = (o.h || im.height) * sc;
    c.imageSmoothingEnabled = false;
    if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o.flip) {
      c.save(); c.translate(this.X(x + w), this.Y(y)); c.scale(-1, 1);
      c.drawImage(im, o.sx || 0, o.sy || 0, o.w || im.width, o.h || im.height, 0, 0, w * S, h * S); c.restore();
    } else c.drawImage(im, o.sx || 0, o.sy || 0, o.w || im.width, o.h || im.height, this.X(x), this.Y(y), w * S, h * S);
    c.globalAlpha = 1;
  },
  typeBadge(type, x, y, w = 30, h = 9, size = 5.6) {
    const col = G.TYPE_COLORS[type] || '#999';
    const c = this.c;
    this.rrect(x, y, w, h, 2.5);
    const g = c.createLinearGradient(0, this.Y(y), 0, this.Y(y + h)); g.addColorStop(0, G.col.light(col, .25)); g.addColorStop(1, G.col.dark(col, .12));
    c.fillStyle = g; c.fill(); c.lineWidth = G.gfx.S * .5; c.strokeStyle = G.col.dark(col, .5); c.stroke();
    this.text(type.toUpperCase(), x + w / 2, y + h / 2 + .3, { size, color: '#fff', align: 'center', base: 'middle', weight: 800, shadow: 'rgba(0,0,0,.4)' });
  },
  catBadge(cat, x, y) {
    const cols = { phys: '#e0603a', spec: '#4b73d8', status: '#8c8c9c' }, lbl = { phys: 'PHYS', spec: 'SPEC', status: 'STAT' };
    this.rrect(x, y, 22, 9, 2.5); this.c.fillStyle = cols[cat]; this.c.fill();
    this.text(lbl[cat], x + 11, y + 4.8, { size: 5.2, color: '#fff', align: 'center', base: 'middle', weight: 800 });
  },
};

// ------------------------------------------------------ pixel pipeline ----
// Draw vector art into a small canvas, then snap alpha, posterize, add a
// hue-aware outline and rim shading so everything reads as crisp pixel art.
G.pix = {
  make(w, h, draw, o = {}) {
    const cv = G.makeCanvas(w, h); const c = cv.getContext('2d', { willReadFrequently: true });
    c.imageSmoothingEnabled = true;
    draw(c, w, h);
    if (o.raw) return cv;
    const id = c.getImageData(0, 0, w, h), d = id.data;
    const cut = o.alphaCut || 110, step = o.posterize || 0;
    const solid = new Uint8Array(w * h);
    for (let i = 0, p = 0; p < w * h; p++, i += 4) {
      if (d[i + 3] >= cut) {
        solid[p] = 1;
        // un-premultiply feel: boost faint edge pixels to full colour
        d[i + 3] = 255;
        if (step) { d[i] = Math.round(d[i] / step) * step; d[i + 1] = Math.round(d[i + 1] / step) * step; d[i + 2] = Math.round(d[i + 2] / step) * step; }
      } else { d[i + 3] = 0; }
    }
    if (o.shade !== false) {
      // rim light (top-left) and core shadow (bottom-right)
      const out = new Uint8ClampedArray(d);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const p = y * w + x; if (!solid[p]) continue;
        const i = p * 4;
        const up = y > 0 ? solid[p - w] : 0, lf = x > 0 ? solid[p - 1] : 0;
        const dn = y < h - 1 ? solid[p + w] : 0, rt = x < w - 1 ? solid[p + 1] : 0;
        let k = 0;
        if (!up) k += .16; if (!lf) k += .08;
        if (!dn) k -= .14; if (!rt) k -= .07;
        if (k > 0) { out[i] += (255 - out[i]) * k; out[i + 1] += (255 - out[i + 1]) * k; out[i + 2] += (255 - out[i + 2]) * k; }
        else if (k < 0) { out[i] *= 1 + k; out[i + 1] *= 1 + k; out[i + 2] *= 1 + k; }
      }
      d.set(out);
    }
    if (o.outline !== false) {
      const src = new Uint8ClampedArray(d);
      const oc = o.outlineColor ? G.col.parse(o.outlineColor) : null;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const p = y * w + x; if (solid[p]) continue;
        // find a solid neighbour (4-neighbourhood)
        let n = -1;
        if (x > 0 && solid[p - 1]) n = p - 1; else if (x < w - 1 && solid[p + 1]) n = p + 1;
        else if (y > 0 && solid[p - w]) n = p - w; else if (y < h - 1 && solid[p + w]) n = p + w;
        if (n < 0) continue;
        const i = p * 4, j = n * 4;
        if (oc) { d[i] = oc[0]; d[i + 1] = oc[1]; d[i + 2] = oc[2]; }
        else { d[i] = src[j] * .28 + 14; d[i + 1] = src[j + 1] * .24 + 10; d[i + 2] = src[j + 2] * .3 + 22; }
        d[i + 3] = 255;
      }
    }
    c.putImageData(id, 0, 0);
    return cv;
  },
  // tint a sprite to a flat colour (for silhouettes / hit flashes)
  _sil: new WeakMap(),
  silhouette(src, col) {
    let m = this._sil.get(src); if (!m) { m = {}; this._sil.set(src, m); }
    if (m[col]) return m[col];
    const cv = G.makeCanvas(src.width, src.height), c = cv.getContext('2d');
    c.drawImage(src, 0, 0); c.globalCompositeOperation = 'source-in'; c.fillStyle = col; c.fillRect(0, 0, cv.width, cv.height);
    return m[col] = cv;
  },
  flipH(src) {
    const cv = G.makeCanvas(src.width, src.height), c = cv.getContext('2d');
    c.translate(src.width, 0); c.scale(-1, 1); c.drawImage(src, 0, 0); return cv;
  },
  scaleDown(src, w, h) {
    // nearest-ish downscale that keeps outlines: sample with majority alpha
    const cv = G.makeCanvas(w, h), c = cv.getContext('2d', { willReadFrequently: true });
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(src, 0, 0, w, h);
    const id = c.getImageData(0, 0, w, h), d = id.data;
    for (let i = 0; i < d.length; i += 4) { if (d[i + 3] > 90) { const a = d[i + 3] / 255; d[i] /= a; d[i + 1] /= a; d[i + 2] /= a; d[i + 3] = 255; } else d[i + 3] = 0; }
    c.putImageData(id, 0, 0);
    return cv;
  },
};

// -------------------------------------------------------------- particles --
G.Particles = class {
  constructor() { this.list = []; }
  add(p) {
    p.life = p.life || 30; p.t = 0; p.vx = p.vx || 0; p.vy = p.vy || 0; p.ax = p.ax || 0; p.ay = p.ay || 0;
    p.size = p.size || 1; p.alpha = p.alpha === undefined ? 1 : p.alpha; p.rot = p.rot || 0; p.vr = p.vr || 0;
    this.list.push(p); return p;
  }
  burst(n, fn) { for (let i = 0; i < n; i++) this.add(fn(i)); }
  update() {
    const L = this.list;
    for (let i = L.length - 1; i >= 0; i--) {
      const p = L[i];
      p.t++; p.vx += p.ax; p.vy += p.ay; if (p.drag) { p.vx *= p.drag; p.vy *= p.drag; }
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      if (p.upd) p.upd(p);
      if (p.t >= p.life) L.splice(i, 1);
    }
  }
  draw(c, ox = 0, oy = 0) {
    for (const p of this.list) {
      const k = p.t / p.life;
      let a = p.alpha * (p.fade === false ? 1 : (p.fadeIn ? Math.min(1, p.t / p.fadeIn) : 1) * (1 - Math.max(0, (k - (p.fadeStart || .6)) / (1 - (p.fadeStart || .6)))));
      if (a <= 0) continue;
      c.globalAlpha = G.clamp(a, 0, 1);
      if (p.blend) c.globalCompositeOperation = p.blend;
      const s = p.grow ? p.size * (1 + p.grow * k) : p.size;
      const x = p.x + ox, y = p.y + oy;
      c.fillStyle = p.color || '#fff';
      if (p.img) {
        c.save(); c.translate(x, y); c.rotate(p.rot); c.drawImage(p.img, -p.img.width / 2 * s, -p.img.height / 2 * s, p.img.width * s, p.img.height * s); c.restore();
      } else if (p.type === 'circle') {
        c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.fill();
      } else if (p.type === 'ring') {
        c.strokeStyle = p.color; c.lineWidth = p.lw || 1; c.beginPath(); c.arc(x, y, s, 0, Math.PI * 2); c.stroke();
      } else if (p.type === 'line') {
        c.strokeStyle = p.color; c.lineWidth = p.lw || 1; c.beginPath(); c.moveTo(x, y); c.lineTo(x - p.vx * (p.len || 2), y - p.vy * (p.len || 2)); c.stroke();
      } else if (p.type === 'star') {
        c.save(); c.translate(x, y); c.rotate(p.rot);
        c.beginPath(); for (let i = 0; i < 8; i++) { const r = i % 2 ? s * .4 : s; const an = i * Math.PI / 4; c.lineTo(Math.cos(an) * r, Math.sin(an) * r); } c.fill(); c.restore();
      } else if (p.type === 'bfly') {   // two wing pixels that flap
        const up = Math.floor(p.t / 4) % 2, x = Math.round(p.x + ox), y = Math.round(p.y + oy);
        c.fillStyle = 'rgba(40,30,30,.8)'; c.fillRect(x, y, 1, 2);
        c.fillStyle = p.color; if (up) { c.fillRect(x - 2, y - 1, 2, 2); c.fillRect(x + 1, y - 1, 2, 2); } else { c.fillRect(x - 1, y, 1, 2); c.fillRect(x + 1, y, 1, 2); }
      } else if (p.type === 'leaf') {
        c.save(); c.translate(x, y); c.rotate(p.rot); c.beginPath(); c.ellipse(0, 0, s, s * .45, 0, 0, Math.PI * 2); c.fill(); c.restore();
      } else {
        c.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.max(1, Math.round(s)), Math.max(1, Math.round(s)));
      }
      if (p.blend) c.globalCompositeOperation = 'source-over';
    }
    c.globalAlpha = 1;
  }
  clear() { this.list.length = 0; }
};

// ---------------------------------------------------------------- fades ---
G.fade = { a: 0, col: '#000' };
G.fadeTo = function (a, frames = 16, col) { if (col) G.fade.col = col; return G.tween(G.fade, { a }, frames, G.ease.linear); };
G.fadeOut = (f = 16, col = '#000') => G.fadeTo(1, f, col);
G.fadeIn = (f = 16) => G.fadeTo(0, f);
G.flashScreen = async function (col = '#fff', f = 6) { G.fade.col = col; G.fade.a = .8; await G.tween(G.fade, { a: 0 }, f, G.ease.linear); G.fade.col = '#000'; };
