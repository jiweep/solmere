'use strict';
// ============================================================================
//  Graphics: canvas management, low-res world buffer, crisp native-res UI,
//  pixel-art sprite pipeline ("pixelizer"), particles, fades.
// ============================================================================
// UI type: SolPix, Latin subsets of the Galmuri pixel font (OFL, fonts/OFL-Galmuri.txt), one face per pixel grid
// (em 8/10/12/15 px, capitals 7/9/11/14 px). Text is set at a whole multiple of a face's grid, so each font pixel
// is a square block of screen pixels: no smeared or merged letters at any window size.
G.FONT_FALLBACK = '"Avenir Next", "Avenir", "Nunito", "Segoe UI", "Helvetica Neue", Arial, sans-serif';
G.FONT = '"SolPix11", ' + G.FONT_FALLBACK;
G.PIXFACES = [{ fam: 'SolPix7', em: 8, cap: 7 }, { fam: 'SolPix9', em: 10, cap: 9 }, { fam: 'SolPix11', em: 12, cap: 11, bold: 'SolPix11B' }, { fam: 'SolPix14', em: 15, cap: 14 }];
// where the old type sat: the alphabetic baseline below each textBaseline anchor, per unit of size (sizes and
// layouts across the UI were tuned to it); capitals are sized to .68 of the requested size
G.FONT_BASE = { top: .767, hanging: .736, middle: .267, alphabetic: 0, bottom: -.233, ideographic: -.233 };
G.pixFace = function (px, bold) {
  const want = px * .68; let best = null;
  for (const f of G.PIXFACES) for (let m = 1; m <= 12; m++) {
    const cost = Math.abs(Math.log(m * f.cap / want)) + (f.bold ? 0 : .04) + (bold && !f.bold ? .06 : 0);
    if (!best || cost < best.cost) best = { cost, m, fam: bold && f.bold ? f.bold : f.fam, em: f.em };
  }
  return best;
};
// the bundled pixel fonts must be decoded before the first canvas text is drawn
G.loadFonts = function () {
  if (typeof document === 'undefined' || !document.fonts) return Promise.resolve();
  return Promise.all(['SolPix7', 'SolPix9', 'SolPix11', 'SolPix11B', 'SolPix14'].map(f => document.fonts.load(`16px "${f}"`).catch(() => null)));
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
    const mobile = G.touch && G.touch.on;
    let S = Math.min(cw / G.W, ch / G.H);
    if (!this.fill && !mobile) S = Math.max(1, Math.floor(S));   // phones use every pixel of width
    this.S = S; this.ox = Math.floor((cw - G.W * S) / 2); this.oy = Math.floor((ch - G.H * S) / 2);
    // phone held upright: the game is the screen of a handheld (touch.js draws the body), set in from the
    // edges with room for the bezel, near the top; the controls get the space below it
    if (mobile && ch > cw) {
      S = (cw - 44 * dpr) / G.W; this.S = S;
      this.ox = Math.floor((cw - G.W * S) / 2); this.oy = Math.floor(Math.max(62, 44 + (window.visualViewport ? 0 : 0)) * dpr);
    }
    this.shell = !!(mobile && ch > cw);
    if (G.touch && G.touch.place) requestAnimationFrame(G.touch.place);
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
  // list/grid cell: hovering selects it (with the cursor blip), clicking selects then confirms
  pick(x, y, w, h, sel, onSel, onClick) {
    this.hot(x, y, w, h, () => { if (!sel) { onSel(); G.audio && G.audio.sfx('cursor'); } }, () => { onSel(); if (onClick) onClick(); else G.input.tap('a'); });
  },
  X(x) { return G.gfx.ox + x * G.gfx.S; },
  Y(y) { return G.gfx.oy + y * G.gfx.S; },
  // sets the canvas font; the default UI family snaps to a pixel face (this.pm = screen pixels per font pixel)
  font(size, weight = 600, fam = G.FONT) {
    const k = size + '|' + weight + '|' + fam + '|' + G.gfx.S;
    const cache = G.gfx._fontCache || (G.gfx._fontCache = {});
    let f = cache[k];
    if (!f) {
      if (fam === G.FONT) { const p = G.pixFace(size * G.gfx.S, weight >= 700); f = { css: `${p.m * p.em}px "${p.fam}", "SolPix11", ${G.FONT_FALLBACK}`, pm: p.m }; }
      else f = { css: `${weight} ${(size * G.gfx.S).toFixed(1)}px ${fam}`, pm: 0 };
      cache[k] = f;
    }
    this.c.font = f.css; this.pm = f.pm; return f.css;
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
    const pm = this.pm;
    c.textAlign = o.align || 'left';
    let px = this.X(x), py = this.Y(y);
    // pixel type: drawn on its baseline at whole screen pixels, so the font's pixels stay square
    if (pm) { c.textBaseline = 'alphabetic'; px = Math.round(px); py = Math.round(py + (G.FONT_BASE[o.base || 'top'] || 0) * size * S); }
    else c.textBaseline = o.base || 'top';
    if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o.outline) {
      if (pm) {   // a hard outline one font pixel (or the requested width) around every glyph pixel
        const k = Math.max(pm, Math.round((o.outlineW ? o.outlineW * S : S * 1.4) / 2)); c.fillStyle = o.outline;
        for (const [dx, dy] of [[-k, 0], [k, 0], [0, -k], [0, k], [-k, -k], [k, -k], [-k, k], [k, k]]) c.fillText(str, px + dx, py + dy);
      } else { c.lineJoin = 'round'; c.lineWidth = o.outlineW ? o.outlineW * S : S * 1.4; c.strokeStyle = o.outline; c.strokeText(str, px, py); }
    }
    if (o.shadow !== false) {
      // the handheld drop shadow: one font pixel down and to the right
      const d = pm || S * .55;
      c.fillStyle = o.shadow || (o.color && this.isLight(o.color) ? 'rgba(0,0,0,.45)' : 'rgba(0,0,0,.14)');
      c.fillText(str, px + d, py + d);
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
  // screen title: a red skewed slab with a hard black shadow; returns its width
  pHeader(title, x = 6, y = 4, o = {}) {
    const size = o.size || 10, w = this.measure(title, size, 800) + 26;
    this.para(x + 3, y + 3, w, size + 7, 6, '#07060c'); this.para(x, y, w, size + 7, 6, o.color || '#ff3b4e');
    this.text(title, x + 12, y + 3.2, { size, weight: 800, color: '#fff', shadow: '#07060c' });
    if (o.sub) this.text(o.sub, x + w + 8, y + size / 2 + 1, { size: 6, weight: 800, color: 'rgba(255,255,255,.8)' });
    return w;
  },
  // skewed parallelogram (Persona-style slab): top edge shifted right by sk. Smooth, slightly rounded corners;
  // a coloured slab gets a soft top-to-bottom shade and a bright hairline along its top edge
  para(x, y, w, h, sk, fill, o = {}) {
    const k = Math.abs(sk); x = this.snap(x); y = this.snap(y);
    this.pixel(Math.min(x, x + sk), Math.min(y, y + h), Math.abs(w) + k, Math.abs(h), () => this._para(x, y, w, h, sk, fill, o),
      typeof fill === 'string' && ['p', x, y, w, h, sk, fill, o.r, o.shade, o.stroke, o.lw]);
  },
  _para(x, y, w, h, sk, fill, o = {}) {
    const c = this.c, S = G.gfx.S;
    const pts = [[x + sk, y], [x + w + sk, y], [x + w, y + h], [x, y + h]].map(([a, b]) => [this.X(a), this.Y(b)]);
    const rad = Math.min(o.r !== undefined ? o.r * S : S * 1.1, Math.abs(h) * S * .3, Math.abs(w) * S * .3);
    const rows = this._pix ? this.paraRows(pts, rad) : null;
    const path = () => rows ? this.stairPath(rows) : this.polyPath(pts, rad);
    path();
    const hex = typeof fill === 'string' && /^#[0-9a-f]{6}$/i.test(fill);
    const lum = hex ? (() => { const [r, g, b] = G.col.parse(fill); return r * .3 + g * .59 + b * .11; })() : 0;
    if (hex && lum > 45 && h >= 4 && o.shade !== false) {
      const g = c.createLinearGradient(0, this.Y(y), 0, this.Y(y + h)); g.addColorStop(0, G.col.light(fill, .1)); g.addColorStop(1, G.col.dark(fill, .1));
      c.fillStyle = g; c.fill();
      c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.28)'; c.fillRect(Math.floor(Math.min(pts[3][0], pts[0][0])), rows ? rows.y0 : pts[0][1], Math.ceil(Math.abs(pts[1][0] - pts[3][0]) + S * Math.abs(sk)) + 1, rows ? 1 : Math.max(1, S * .35)); c.restore();
    } else { c.fillStyle = fill; c.fill(); }
    if (o.stroke) {
      if (rows) { this.stairRing(rows, Math.max(1, Math.round((o.lw || .5) * S))); c.fillStyle = o.stroke; c.fill('evenodd'); }
      else { this.polyPath(pts, rad); c.lineJoin = 'round'; c.lineWidth = Math.max(1, (o.lw || .5) * S); c.strokeStyle = o.stroke; c.stroke(); }
    }
  },
  // ---- pixel-grid geometry (used on the chrome grid): shapes as runs of whole pixels, one [left, right] per
  // row, so every edge is a hard pixel step: bold and sharp, never a smeared anti-aliased line
  stairPath(rows, fresh = true) {
    const c = this.c; if (fresh) c.beginPath();
    const y0 = rows.y0, n = rows.length; if (!n) return;
    c.moveTo(rows[0][0], y0);
    for (let i = 0; i < n; i++) { c.lineTo(rows[i][0], y0 + i); c.lineTo(rows[i][0], y0 + i + 1); }
    for (let i = n - 1; i >= 0; i--) { c.lineTo(rows[i][1], y0 + i + 1); c.lineTo(rows[i][1], y0 + i); }
    c.closePath();
  },
  // the band of pixels lw thick just inside a shape's edge (fill it with 'evenodd')
  stairRing(rows, lw = 1) {
    this.stairPath(rows);
    const inner = rows.slice(lw, rows.length - lw).map(([l, r]) => [l + lw, r - lw]).filter(([l, r]) => r > l);
    inner.y0 = rows.y0 + lw; if (inner.length) this.stairPath(inner, false);
  },
  rrRows(X0, Y0, X1, Y1, rad) {
    rad = Math.round(rad); const rows = []; rows.y0 = Y0;
    for (let y = Y0; y < Y1; y++) {
      const d = Math.min(y - Y0, Y1 - 1 - y);
      const ins = d < rad ? Math.round(rad - Math.sqrt(Math.max(0, rad * rad - (rad - d - .5) ** 2))) : 0;
      rows.push([X0 + ins, X1 - ins]);
    }
    return rows;
  },
  // a parallelogram's rows: the slanted sides step one pixel at a time; a 1-pixel nick rounds each corner
  paraRows(pts, rad) {
    const [a0, a1, b1, b0] = pts, yA = a0[1], yB = b0[1];
    const Yt = Math.round(Math.min(yA, yB)), Yb = Math.round(Math.max(yA, yB)), rows = []; rows.y0 = Yt;
    for (let y = Yt; y < Yb; y++) {
      const t = yB === yA ? 0 : (y + .5 - yA) / (yB - yA);
      let l = Math.round(a0[0] + (b0[0] - a0[0]) * t), r = Math.round(a1[0] + (b1[0] - a1[0]) * t);
      if (l > r) [l, r] = [r, l];
      rows.push([l, r]);
    }
    if (rad >= .8 && rows.length >= 4) for (const i of [0, rows.length - 1]) if (rows[i][1] - rows[i][0] > 4) rows[i] = [rows[i][0] + 1, rows[i][1] - 1];
    return rows;
  },
  // a closed polygon (screen coords) with every corner rounded by rad
  polyPath(pts, rad) {
    const c = this.c, n = pts.length;
    c.beginPath();
    if (rad <= .5) { c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < n; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); return; }
    c.moveTo((pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.arcTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2, rad); }
    c.closePath();
  },
  // smooth rounded rectangle path (game units)
  rrect(x, y, w, h, r) {
    const c = this.c, S = G.gfx.S;
    const X0 = Math.round(this.X(x)), Y0 = Math.round(this.Y(y)), X1 = Math.round(this.X(x + w)), Y1 = Math.round(this.Y(y + h));
    const rad = Math.max(0, Math.min(r * S, (X1 - X0) / 2, (Y1 - Y0) / 2));
    if (this._pix) return this.stairPath(this.rrRows(X0, Y0, X1, Y1, rad));
    c.beginPath();
    if (c.roundRect) c.roundRect(X0, Y0, X1 - X0, Y1 - Y0, rad);
    else { c.moveTo(X0 + rad, Y0); c.arcTo(X1, Y0, X1, Y1, rad); c.arcTo(X1, Y1, X0, Y1, rad); c.arcTo(X0, Y1, X0, Y0, rad); c.arcTo(X0, Y0, X1, Y0, rad); c.closePath(); }
  },
  fillRect(x, y, w, h, col, a) {
    const c = this.c; if (a !== undefined) c.globalAlpha = a;
    c.fillStyle = col; c.fillRect(this.X(x), this.Y(y), w * G.gfx.S, h * G.gfx.S); c.globalAlpha = 1;
  },
  // themed panel: a bold smooth outline, a soft shadow under it, a gradient body with a gloss sheen and a
  // hairline highlight inside the edge (clean vector shapes against the pixel art)
  panel(x, y, w, h, style = 'light', o = {}) {
    x = this.snap(x); y = this.snap(y);
    this.pixel(x - 6, y - 1, w + 8, h + 7, () => this._panel(x, y, w, h, style, o), ['n', x, y, w, h, style, o.r, o.slab, o.noShadow, o.alpha]);
  },
  _panel(x, y, w, h, style = 'light', o = {}) {
    const c = this.c, S = G.gfx.S, r = o.r !== undefined ? o.r : 4;
    const T = G.ui.THEMES[style] || G.ui.THEMES.light;
    if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    // Persona framing: a leaning black slab behind the sheet
    if (o.slab) this.para(x - 5, y + 4, w + 6, h, 6, '#07060c');
    if (!o.noShadow) {   // a soft shadow from two stacked translucent shapes (a blur costs too much per frame)
      this.rrect(x - .8, y + .4, w + 1.6, h + 1.8, r + 1); c.fillStyle = 'rgba(0,0,0,.12)'; c.fill();
      this.rrect(x - .2, y + .6, w + .4, h + 1, r + .3); c.fillStyle = 'rgba(0,0,0,.22)'; c.fill();
    }
    this.rrect(x, y, w, h, r); c.fillStyle = T.border; c.fill();
    if (w > 3 && h > 3) {
      const bw = this._pix ? 1 : w > 12 && h > 12 ? .9 : .6;   // on the chrome grid: a whole pixel
      const g = c.createLinearGradient(0, this.Y(y), 0, this.Y(y + h)); g.addColorStop(0, T.top); g.addColorStop(1, T.bot);
      this.rrect(x + bw, y + bw, w - bw * 2, h - bw * 2, Math.max(0, r - bw)); c.fillStyle = g; c.fill();
      c.save(); c.clip();
      const gh = Math.min(h * .5, 16), gl = c.createLinearGradient(0, this.Y(y), 0, this.Y(y + gh));
      gl.addColorStop(0, `rgba(255,255,255,${T.gloss !== undefined ? T.gloss : .18})`); gl.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = gl; c.fillRect(this.X(x), this.Y(y), w * S, gh * S);
      c.restore();
      if (this._pix) { this.rrRing(x + bw, y + bw, w - bw * 2, h - bw * 2, Math.max(0, r - bw), 1); c.fillStyle = T.inner; c.fill('evenodd'); }
      else { const k = bw + .45; this.rrect(x + k, y + k, w - k * 2, h - k * 2, Math.max(0, r - k)); c.lineWidth = Math.max(1, S * .33); c.strokeStyle = T.inner; c.stroke(); }
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
  cursor(x, y, col = '#e8484a') { this.pixel(x - 1, y - 4, 7, 9, () => this._cursor(x, y, col)); },
  _cursor(x, y, col = '#e8484a') {
    if (this._pix) return this._pixCursor(x, y, col);
    const c = this.c, S = G.gfx.S, b = Math.sin(G.realTime * 8) * .8;
    const px = this.X(x + b), py = this.Y(y);
    const tri = (dx, dy) => this.polyPath([[px + dx, py - 3 * S + dy], [px + 4.2 * S + dx, py + dy], [px + dx, py + 3 * S + dy]], S * .6);
    tri(S * .3, S * .6); c.fillStyle = 'rgba(0,0,0,.28)'; c.fill();
    tri(0, 0); c.fillStyle = col; c.fill();
    c.lineJoin = 'round'; c.lineWidth = Math.max(1, S * .45); c.strokeStyle = G.col.dark(col, .45); c.stroke();
    tri(0, 0); c.save(); c.clip(); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(px, py - 3 * S, 4.2 * S, 2.2 * S); c.restore();
  },
  // the arrow on the chrome grid: a dark-outlined wedge with a lit upper half and a drop shadow
  _pixCursor(x, y, col) {
    const c = this.c, S = G.gfx.S, b = Math.round(Math.sin(G.realTime * 8) * .8 * S);
    const px = Math.round(this.X(x)) + b, py = Math.round(this.Y(y)), hh = Math.max(3, Math.round(3 * S)), len = Math.max(3, Math.round(4.2 * S));
    const rows = []; rows.y0 = py - hh;
    for (let i = 0; i < hh * 2; i++) { const d = Math.abs(i + .5 - hh) / hh; rows.push([px, px + Math.max(1, Math.round(len * (1 - d)))]); }
    const sh = rows.map(([l, r]) => [l + 1, r + 1]); sh.y0 = rows.y0 + 1;
    this.stairPath(sh); c.fillStyle = 'rgba(0,0,0,.3)'; c.fill();
    this.stairPath(rows); c.fillStyle = G.col.dark(col, .45); c.fill();
    const inner = rows.slice(1, -1).map(([l, r]) => [l + 1, r - 1]).filter(([l, r]) => r > l); inner.y0 = rows.y0 + 1;
    this.stairPath(inner); c.fillStyle = col; c.fill();
    const top = inner.slice(0, Math.ceil(inner.length / 2) - 1); top.y0 = inner.y0;
    if (top.length) { this.stairPath(top); c.fillStyle = 'rgba(255,255,255,.35)'; c.fill(); }
  },
  // pixel mode: the ring lw pixels thick inside a rounded rectangle (fill with 'evenodd')
  rrRing(x, y, w, h, r, lw = 1) {
    const S = G.gfx.S, X0 = Math.round(this.X(x)), Y0 = Math.round(this.Y(y)), X1 = Math.round(this.X(x + w)), Y1 = Math.round(this.Y(y + h));
    this.stairRing(this.rrRows(X0, Y0, X1, Y1, Math.max(0, Math.min(r * S, (X1 - X0) / 2, (Y1 - Y0) / 2))), lw);
  },
  // an outline for a rounded rectangle: a pixel ring on the chrome grid, a stroke otherwise
  rrOutline(x, y, w, h, r, col, lw = .5) {
    const c = this.c;
    if (this._pix) { this.rrRing(x, y, w, h, r, Math.max(1, Math.round(lw * G.gfx.S))); c.fillStyle = col; c.fill('evenodd'); }
    else { this.rrect(x, y, w, h, r); c.lineWidth = Math.max(1, lw * G.gfx.S); c.strokeStyle = col; c.stroke(); }
  },
  // a rounded capsule gauge with a glossy fill
  bar(x, y, w, h, frac, col, bg = '#39414f', o = {}) {
    x = this.snap(x); y = this.snap(y);
    this.pixel(x - 1, y - 1, w + 2, h + 2, () => this._bar(x, y, w, h, frac, col, bg, o), ['b', x, y, w, h, Math.round(frac * w * G.gfx.S), col, bg, o.border]);
  },
  _bar(x, y, w, h, frac, col, bg = '#39414f', o = {}) {
    const c = this.c, S = G.gfx.S, r = h / 2;
    if (o.border !== false) { this.rrect(x - .6, y - .6, w + 1.2, h + 1.2, r + .6); c.fillStyle = 'rgba(14,18,28,.9)'; c.fill(); }
    this.rrect(x, y, w, h, r); c.fillStyle = bg; c.fill();
    if (frac > 0) {
      const fw = Math.max(Math.min(w, h * .8), w * G.clamp(frac, 0, 1));
      c.save(); this.rrect(x, y, w, h, r); c.clip();
      const g = c.createLinearGradient(0, this.Y(y), 0, this.Y(y + h)); g.addColorStop(0, G.col.light(col, .3)); g.addColorStop(.55, col); g.addColorStop(1, G.col.dark(col, .28));
      this.rrect(x, y, fw, h, Math.min(r, fw / 2)); c.fillStyle = g; c.fill();
      if (h >= 2) { const R = this._pix ? Math.round : v => v; c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(R(this.X(x + Math.min(r, fw / 2))), R(this.Y(y + h * .16)), R(Math.max(0, fw - Math.min(r, fw / 2) * 2) * S), Math.max(1, R(h * .18 * S))); }
      c.restore();
    }
  },
  // UI chrome on a pixel grid (Options > Menu Style: Pixel). Shapes (panels, slabs, gauges, badges, the
  // cursor) are traced along whole pixels of the game's own grid into a scratch canvas and scaled up with no
  // smoothing: bold one-pixel borders, stepped corners and slants that sit with the pixel art, instead of
  // hairline vector strokes. bbox is in game units; calls nest (inner shapes join the outer pass).
  chromePx() { return G.settings && G.settings.vectorUI ? 0 : Math.max(1, Math.round(G.gfx.S)); },
  // in pixel mode, positions snap to whole chrome pixels: the shapes step cleanly as they slide, and a
  // shape that sits still is the same shape every frame (so its cached image is reused)
  snap(v) { const P = this._pix ? 0 : this.chromePx(); return P ? Math.round(v * G.gfx.S / P) * P / G.gfx.S : v; },
  _cache: new Map(), _spare: [],
  pixel(bx, by, bw, bh, fn, key) {
    const gx = G.gfx, P = this.chromePx();
    if (this._pix || !P || bw <= 0 || bh <= 0) return fn();
    const S = gx.S, main = gx.cx;
    // align the scratch to one global grid so neighbouring shapes share pixel boundaries
    const sx0 = gx.ox + Math.floor((bx * S - 2 * P) / P) * P, sy0 = gx.oy + Math.floor((by * S - 2 * P) / P) * P;
    const w = Math.ceil((bw * S + 4 * P) / P) + 1, h = Math.ceil((bh * S + 4 * P) / P) + 1;
    const blit = (cv) => {
      const sm = main.imageSmoothingEnabled; main.imageSmoothingEnabled = false;
      main.drawImage(cv, 0, 0, w, h, sx0, sy0, w * P, h * P);
      main.imageSmoothingEnabled = sm;
    };
    // a shape drawn with the same arguments as before is blitted from the cache (least recently used goes)
    const k = key ? key.join('|') + '|' + S + '|' + gx.ox + '|' + gx.oy : null;
    if (k) { const hit = this._cache.get(k); if (hit) { this._cache.delete(k); this._cache.set(k, hit); blit(hit); return; } }
    let cv, sc;
    if (k) {
      cv = this._spare.pop() || G.makeCanvas(w, h);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      sc = cv.getContext('2d');
    } else {
      cv = this._scratch;
      if (!cv) { cv = this._scratch = G.makeCanvas(w, h); this._sx = cv.getContext('2d'); }
      if (cv.width < w || cv.height < h) { cv.width = Math.max(cv.width, w); cv.height = Math.max(cv.height, h); }
      sc = this._sx;
    }
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalAlpha = 1; sc.clearRect(0, 0, w, h);
    const saved = [gx.S, gx.ox, gx.oy];
    gx.S = S / P; gx.ox = (gx.ox - sx0) / P; gx.oy = (gx.oy - sy0) / P; gx.cx = sc; this._pix = true;
    try { fn(); } finally {
      [gx.S, gx.ox, gx.oy] = saved; gx.cx = main; this._pix = false;
      blit(cv);
      if (k) {
        this._cache.set(k, cv);
        if (this._cache.size > 320) { const [old, ocv] = this._cache.entries().next().value; this._cache.delete(old); if (this._spare.length < 32) this._spare.push(ocv); }
      }
    }
  },
  // a filled (and optionally outlined) rounded rectangle on the chrome grid, for screens that draw their own
  shape(x, y, w, h, r, fill, stroke, lw = .5) {
    x = this.snap(x); y = this.snap(y);
    this.pixel(x, y, w, h, () => {
      const c = this.c; this.rrect(x, y, w, h, r);
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) this.rrOutline(x, y, w, h, r, stroke, lw);
    }, ['s', x, y, w, h, r, fill, stroke, lw]);
  },
  hpColor(f) { return f > .5 ? '#3ed16b' : f > .2 ? '#f5c02b' : '#ef4b4b'; },
  // draw a low-res image (canvas) at native scale (nearest-neighbour)
  img(im, x, y, o = {}) {
    if (!im) return;
    const c = this.c, S = G.gfx.S;
    const sc = o.scale || 1, w = (o.w || im.dispW || im.width) * sc, h = (o.h || im.dispH || im.height) * sc;
    c.imageSmoothingEnabled = !!im.dispW; if (im.dispW) c.imageSmoothingQuality = 'high';   // HD icons scale smoothly
    if (o.alpha !== undefined) c.globalAlpha = o.alpha;
    if (o.flip) {
      c.save(); c.translate(this.X(x + w), this.Y(y)); c.scale(-1, 1);
      c.drawImage(im, o.sx || 0, o.sy || 0, o.w || im.width, o.h || im.height, 0, 0, w * S, h * S); c.restore();
    } else c.drawImage(im, o.sx || 0, o.sy || 0, o.w || im.width, o.h || im.height, this.X(x), this.Y(y), w * S, h * S);
    c.globalAlpha = 1;
  },
  typeBadge(type, x, y, w = 30, h = 9, size = 5.6) {
    const col = G.TYPE_COLORS[type] || '#999'; x = this.snap(x); y = this.snap(y);
    this.pixel(x, y, w, h, () => {
      const c = this.c;
      this.rrect(x, y, w, h, 2.5);
      const g = c.createLinearGradient(0, this.Y(y), 0, this.Y(y + h)); g.addColorStop(0, G.col.light(col, .25)); g.addColorStop(1, G.col.dark(col, .12));
      c.fillStyle = g; c.fill(); this.rrOutline(x, y, w, h, 2.5, G.col.dark(col, .5), .5);
    }, ['t', x, y, w, h, col]);
    this.text(type.toUpperCase(), x + w / 2, y + h / 2 + .3, { size, color: '#fff', align: 'center', base: 'middle', weight: 800, shadow: 'rgba(0,0,0,.4)' });
  },
  catBadge(cat, x, y) {
    const cols = { phys: '#e0603a', spec: '#4b73d8', status: '#8c8c9c' }, lbl = { phys: 'PHYS', spec: 'SPEC', status: 'STAT' };
    this.shape(x, y, 22, 9, 2.5, cols[cat]);
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
  // proj(x, y) -> {x, y}: optional mapping from world to screen (the 3D view), used instead of the offset
  draw(c, ox0 = 0, oy0 = 0, proj = null) {
    for (const p of this.list) {
      let ox = ox0, oy = oy0;
      if (proj) { const q = proj(p.x, p.y); if (!q) continue; ox = q.x - p.x; oy = q.y - p.y; }
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
