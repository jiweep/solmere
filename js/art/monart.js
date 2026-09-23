'use strict';
// ============================================================================
//  Mon art: a vector drawing DSL whose output is run through the pixelizer
//  to produce crisp, shaded pixel sprites. Each species has a draw function
//  (see monart_species.js) called as draw(d, C) with d = DSL, C = palette.
//  Front sprites face left toward the player; back sprites are mirrored and
//  faceless. 4 idle frames each (t = 0..1) give Gen-5-style breathing.
// ============================================================================
G.MONDRAW = {};   // species id -> draw fn
G.MONPAL = {};    // species id -> { base palette object, shiny: overrides or hue shift }
G.monArt = (function () {
  const cache = new Map();
  const TAU = Math.PI * 2;
  function makeDSL(c, back, t, scale) {
    const L = G.col.light, D = G.col.dark;
    const d = {
      c, back, t, TAU, s: Math.sin(t * TAU), s2: Math.sin(t * TAU * 2), cs: Math.cos(t * TAU),
      shade(x, y, rx, ry, col, o = {}) {
        if (o.flat) return col;
        const g = c.createRadialGradient(x - rx * .38, y - ry * .45, 0, x, y, Math.max(rx, ry) * 1.25);
        g.addColorStop(0, L(col, o.hl !== undefined ? o.hl : .3)); g.addColorStop(.55, col); g.addColorStop(1, D(col, o.sh !== undefined ? o.sh : .3));
        return g;
      },
      ell(x, y, rx, ry, col, o = {}) {
        c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot);
        c.beginPath(); c.ellipse(0, 0, Math.max(.1, rx), Math.max(.1, ry), 0, 0, TAU);
        c.fillStyle = d.shade(0, 0, rx, ry, col, o); c.fill();
        if (o.line) { c.lineWidth = o.lw || 1.2; c.strokeStyle = o.line; c.stroke(); }
        c.restore();
      },
      circ(x, y, r, col, o) { d.ell(x, y, r, r, col, o); },
      path(pts, closed = true) {
        c.beginPath();
        if (pts.length < 3) { c.moveTo(pts[0][0], pts[0][1]); for (const p of pts) c.lineTo(p[0], p[1]); return; }
        // smooth closed/open Catmull-Rom curve
        const P = closed ? [pts[pts.length - 1], ...pts, pts[0], pts[1]] : [pts[0], ...pts, pts[pts.length - 1]];
        c.moveTo(P[1][0], P[1][1]);
        for (let i = 1; i < P.length - 2; i++) {
          const p0 = P[i - 1], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2];
          c.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
        }
        if (closed) c.closePath();
      },
      bbox(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const [x, y] of pts) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); } return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, rx: (x1 - x0) / 2, ry: (y1 - y0) / 2 }; },
      blob(pts, col, o = {}) {
        const b = d.bbox(pts); d.path(pts, true);
        c.fillStyle = d.shade(b.cx, b.cy, b.rx, b.ry, col, o); c.fill();
        if (o.line) { c.lineWidth = o.lw || 1.2; c.strokeStyle = o.line; c.stroke(); }
      },
      poly(pts, col, o = {}) {
        const b = d.bbox(pts); c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (const p of pts) c.lineTo(p[0], p[1]); c.closePath();
        c.fillStyle = d.shade(b.cx, b.cy, b.rx, b.ry, col, o); c.fill();
      },
      tri(x1, y1, x2, y2, x3, y3, col, o) { d.poly([[x1, y1], [x2, y2], [x3, y3]], col, o); },
      rect(x, y, w, h, col, o = {}) {
        const r = o.r || 0; c.beginPath();
        if (c.roundRect) c.roundRect(x, y, w, h, r); else c.rect(x, y, w, h);
        c.fillStyle = d.shade(x + w / 2, y + h / 2, w / 2, h / 2, col, o); c.fill();
      },
      stroke(pts, col, w = 2, o = {}) {
        d.path(pts, false); c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = w; c.strokeStyle = col; c.stroke();
      },
      limb(x0, y0, x1, y1, w, col, o = {}) {
        c.lineCap = 'round'; c.lineWidth = w; c.strokeStyle = o.flat ? col : D(col, .08); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
        if (!o.flat) { c.lineWidth = w * .45; c.strokeStyle = L(col, .12); c.beginPath(); c.moveTo(x0 - w * .12, y0 - w * .12); c.lineTo(x1 - w * .12, y1 - w * .12); c.stroke(); }
      },
      // taper: a curved tapering shape (tails, horns, tentacles). pts along spine, widths along spine
      taper(pts, w0, w1, col, o = {}) {
        const n = pts.length; const left = [], right = [];
        for (let i = 0; i < n; i++) {
          const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
          const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
          const w = G.lerp(w0, w1, i / (n - 1)) / 2;
          left.push([pts[i][0] - dy / len * w, pts[i][1] + dx / len * w]); right.push([pts[i][0] + dy / len * w, pts[i][1] - dx / len * w]);
        }
        d.blob([...left, ...right.reverse()], col, o);
      },
      eye(x, y, r, o = {}) {
        if (back) return;
        const ry = r * (o.tall || 1.15);
        if (o.closed) { c.strokeStyle = '#1e1a24'; c.lineWidth = Math.max(1.2, r * .45); c.beginPath(); c.arc(x, y - r * .3, r * .9, .15 * Math.PI, .85 * Math.PI); c.stroke(); return; }
        if (o.happy) { c.strokeStyle = '#1e1a24'; c.lineWidth = Math.max(1.2, r * .5); c.beginPath(); c.arc(x, y + r * .4, r * .9, 1.15 * Math.PI, 1.85 * Math.PI); c.stroke(); return; }
        c.save(); c.translate(x, y); if (o.rot) c.rotate(o.rot);
        c.beginPath(); c.ellipse(0, 0, r, ry, 0, 0, TAU); c.fillStyle = o.sclera || '#ffffff'; c.fill();
        c.lineWidth = Math.max(1, r * .28); c.strokeStyle = '#1e1a24'; c.stroke();
        const lx = o.look !== undefined ? o.look : -.3, ly = o.lookY || 0;
        c.beginPath(); c.ellipse(lx * r * .45, ly * r * .4 + r * .05, r * (o.slit ? .28 : .62), ry * .72, 0, 0, TAU); c.fillStyle = o.col || '#2a2030'; c.fill();
        if (o.col && !o.slit) { c.beginPath(); c.ellipse(lx * r * .45, ly * r * .4 + r * .1, r * .3, ry * .38, 0, 0, TAU); c.fillStyle = '#12101a'; c.fill(); }
        c.beginPath(); c.ellipse(lx * r * .45 - r * .25, -ry * .3, r * .26, r * .3, 0, 0, TAU); c.fillStyle = '#ffffff'; c.fill();
        if (o.angry) { c.fillStyle = o.skin || '#000'; c.beginPath(); c.moveTo(-r * 1.3, -ry * 1.3); c.lineTo(r * 1.3, -ry * (o.angryDir > 0 ? .1 : 1.3) ); c.lineTo(r * 1.3, -ry * 1.6); c.lineTo(-r * 1.3, -ry * 1.6); c.fill(); }
        c.restore();
      },
      mouth(x, y, w, o = {}) {
        if (back) return;
        c.strokeStyle = o.col || '#1e1a24'; c.lineWidth = o.lw || Math.max(1.1, w * .16); c.lineCap = 'round';
        if (o.open) {
          c.beginPath(); c.ellipse(x, y + w * .15, w * .5, w * (o.open === true ? .38 : o.open), 0, 0, Math.PI); c.fillStyle = '#7a2a3a'; c.fill(); c.stroke();
          c.beginPath(); c.ellipse(x, y + w * .3, w * .28, w * .12, 0, 0, Math.PI); c.fillStyle = '#f07a8a'; c.fill();
          if (o.fang) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - w * .35, y); c.lineTo(x - w * .22, y + w * .28); c.lineTo(x - w * .1, y); c.fill(); if (o.fang > 1) { c.beginPath(); c.moveTo(x + w * .35, y); c.lineTo(x + w * .22, y + w * .28); c.lineTo(x + w * .1, y); c.fill(); } }
        } else if (o.cat) {
          c.beginPath(); c.moveTo(x - w * .5, y); c.quadraticCurveTo(x - w * .25, y + w * .3, x, y); c.quadraticCurveTo(x + w * .25, y + w * .3, x + w * .5, y); c.stroke();
        } else if (o.frown) {
          c.beginPath(); c.moveTo(x - w * .5, y + w * .15); c.quadraticCurveTo(x, y - w * .2, x + w * .5, y + w * .15); c.stroke();
        } else if (o.flat) {
          c.beginPath(); c.moveTo(x - w * .5, y); c.lineTo(x + w * .5, y); c.stroke();
        } else {
          c.beginPath(); c.moveTo(x - w * .5, y); c.quadraticCurveTo(x, y + w * .4, x + w * .5, y); c.stroke();
          if (o.fang) { c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(x - w * .3, y + w * .08); c.lineTo(x - w * .2, y + w * .3); c.lineTo(x - w * .1, y + w * .15); c.fill(); }
        }
      },
      cheek(x, y, r, col = 'rgba(255,120,150,.55)') { if (back) return; c.beginPath(); c.ellipse(x, y, r, r * .6, 0, 0, TAU); c.fillStyle = col; c.fill(); },
      nose(x, y, r, col = '#2a2030') { if (back) return; c.beginPath(); c.ellipse(x, y, r, r * .7, 0, 0, TAU); c.fillStyle = col; c.fill(); },
      face(fn) { if (!back) fn(); },
      flame(x, y, s, col1 = '#ff8a2a', col2 = '#ffe070', o = {}) {
        const f = Math.sin(t * TAU * 2 + (o.ph || 0)) * .12;
        const pts = [[x, y - s * (1.25 + f)], [x + s * .38, y - s * .55], [x + s * .5, y], [x + s * .25, y + s * .35], [x - s * .25, y + s * .35], [x - s * .5, y], [x - s * .38, y - s * .55]];
        d.blob(pts.map(([px, py]) => [px + (py - y) * (o.lean || 0), py]), col1, { hl: .2 });
        const k = .55;
        d.blob(pts.map(([px, py]) => [x + (px - x) * k + (py - y) * (o.lean || 0) * k, y + s * .12 + (py - y) * k]), col2, { flat: true });
      },
      leaf(x, y, len, w, ang, col, o = {}) {
        c.save(); c.translate(x, y); c.rotate(ang);
        d.blob([[0, 0], [len * .3, -w], [len * .75, -w * .7], [len, 0], [len * .75, w * .7], [len * .3, w]], col, o);
        if (!o.noVein) { c.strokeStyle = G.col.dark(col, .3); c.lineWidth = 1; c.beginPath(); c.moveTo(1, 0); c.lineTo(len * .92, 0); c.stroke(); }
        c.restore();
      },
      spikes(cx, cy, r, n, len, col, a0 = 0, spread = TAU, o = {}) {
        for (let i = 0; i < n; i++) {
          const a = a0 + (n === 1 ? 0 : spread * i / (spread >= TAU ? n : n - 1)), w = o.w || .22;
          d.tri(cx + Math.cos(a - w) * r, cy + Math.sin(a - w) * r, cx + Math.cos(a + w) * r, cy + Math.sin(a + w) * r, cx + Math.cos(a) * (r + len), cy + Math.sin(a) * (r + len), col, o);
        }
      },
      wing(x, y, span, ang, col, o = {}) {
        // feathered wing: a fan of rounded feathers
        const n = o.n || 5, flap = (o.flap || 0) * Math.sin(t * TAU);
        c.save(); c.translate(x, y); c.rotate(ang + flap);
        for (let i = n - 1; i >= 0; i--) {
          const a = -.2 + i * (o.fan || .28), l = span * (1 - i * .09);
          const fx = Math.cos(a) * l, fy = Math.sin(a) * l;
          d.taper([[0, 0], [fx * .5, fy * .5 - l * .05], [fx, fy]], span * .32, span * .08, i % 2 ? G.col.dark(col, .1) : col, o);
        }
        c.restore();
      },
      batwing(x, y, span, ang, col, o = {}) {
        const flap = (o.flap || 0) * Math.sin(t * TAU);
        c.save(); c.translate(x, y); c.rotate(ang + flap);
        const pts = [[0, 0], [span * .3, -span * .45], [span * .7, -span * .55], [span, -span * .3], [span * .82, -span * .02], [span * .62, -span * .12], [span * .48, span * .12], [span * .3, -span * .02], [span * .14, span * .18]];
        d.blob(pts, col, o);
        c.strokeStyle = G.col.dark(col, .35); c.lineWidth = 1.2;
        for (const q of [[span * .7, -span * .55], [span, -span * .3], [span * .62, -span * .12]]) { c.beginPath(); c.moveTo(0, 0); c.lineTo(q[0], q[1]); c.stroke(); }
        c.restore();
      },
      glow(x, y, r, col) {
        const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
      },
      dot(x, y, r, col) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = col; c.fill(); },
      line(x0, y0, x1, y1, col, w = 1.2) { c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); },
      star(x, y, r, col, n = 5, inner = .45) { const pts = []; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + i * Math.PI / n, rr = i % 2 ? r * inner : r; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr]); } d.poly(pts, col); },
      // helpers for common anatomy
      paw(x, y, r, col) { d.ell(x, y, r * 1.1, r * .75, col); if (!back) { c.strokeStyle = G.col.dark(col, .35); c.lineWidth = .9; c.beginPath(); c.moveTo(x - r * .3, y - r * .1); c.lineTo(x - r * .3, y + r * .5); c.moveTo(x + r * .3, y - r * .1); c.lineTo(x + r * .3, y + r * .5); c.stroke(); } },
      ear(x, y, w, h, ang, col, inner) {
        c.save(); c.translate(x, y); c.rotate(ang);
        d.blob([[-w / 2, 0], [-w * .2, -h * .7], [0, -h], [w * .2, -h * .7], [w / 2, 0]], col);
        if (inner && !back) d.blob([[-w * .28, -h * .05], [-w * .1, -h * .6], [0, -h * .78], [w * .1, -h * .6], [w * .28, -h * .05]], inner, { flat: true });
        c.restore();
      },
    };
    return d;
  }
  function palette(sp, shiny) {
    const p = G.MONPAL[sp] || {};
    const base = p.c || { a: '#a0a0a0', b: '#707070', c: '#ffffff', e: '#2a2030' };
    if (!shiny) return base;
    if (p.shiny) return { ...base, ...p.shiny };
    const shift = p.shift !== undefined ? p.shift : 150; const out = {};
    for (const k in base) out[k] = (k === 'e' || k === 'w' || p.keep && p.keep.includes(k)) ? base[k] : G.col.hue(base[k], shift, 1.05);
    return out;
  }
  function render(sp, shiny, view, frame, size) {
    const key = sp + '|' + (shiny ? 1 : 0) + '|' + view + '|' + frame + '|' + size;
    if (cache.has(key)) return cache.get(key);
    const draw = G.MONDRAW[sp] || G.MONDRAW._missing;
    const C = palette(sp, shiny);
    const back = view === 'back';
    const img = G.pix.make(size, size, (c) => {
      c.save();
      const k = size / 96;
      if (back) { c.translate(size, 0); c.scale(-1, 1); }
      c.scale(k, k);
      const d = makeDSL(c, back, frame / 4, k);
      try { draw(d, C); } catch (e) { console.error('draw error', sp, e); }
      c.restore();
    }, { posterize: 18, alphaCut: 100 });
    cache.set(key, img);
    return img;
  }
  return {
    front(sp, shiny, frame = 0) { return render(sp, shiny, 'front', frame % 4, 96); },
    back(sp, shiny, frame = 0) { return render(sp, shiny, 'back', frame % 4, 104); },
    icon(sp, shiny, frame = 0) { return render(sp, shiny, 'front', (frame % 2) * 2, 36); },
    big(sp, shiny, frame = 0) { return render(sp, shiny, 'front', frame % 4, 96); },
    overworld(sp, shiny, dir, frame) {
      const s = (G.MONPAL[sp] && G.MONPAL[sp].ow) || 24;
      if (dir === 'up') return render(sp, shiny, 'back', frame * 2, s + 2);
      const im = render(sp, shiny, 'front', frame * 2, s);
      if (dir === 'right') { const k = 'owr|' + sp + shiny + frame + s; if (!cache.has(k)) cache.set(k, G.pix.flipH(im)); return cache.get(k); }
      return im;
    },
    palette,
    silhouette(sp, col = '#1a1a24') { const k = 'sil|' + sp + col; if (!cache.has(k)) cache.set(k, G.pix.silhouette(render(sp, false, 'front', 0, 96), col)); return cache.get(k); },
    clearCache() { cache.clear(); },
  };
})();
G.MONDRAW._missing = (d, C) => { d.ell(48, 60, 26, 24, '#a0a0b0'); d.eye(40, 54, 4); d.eye(56, 54, 4); d.mouth(48, 66, 8); };
