'use strict';
// ============================================================================
//  Characters: 16x24 overworld walkers (4 dirs x 3 frames, run, bike, surf)
//  and 72x88 battle portraits, generated from an appearance description.
// ============================================================================
G.chars = (function () {
  const P = c => G.col.parse(c);
  const cache = new Map();
  const SKIN = ['#ffe0c4', '#f6cfa6', '#e2ae82', '#c68a5e', '#9a643e', '#6e4428'];
  const HAIR = ['#2a2226', '#4a3226', '#7a4a2a', '#b8742e', '#e8c060', '#f0e0b0', '#c8c8d0', '#d84a3a', '#3a64c8', '#2aa89a', '#8a4ac8', '#f08ab0', '#ffffff'];
  // --------------------------------------------------- overworld sprite
  function walker(a, dir, frame, mode = 'walk') {
    const p = new G.Painter(16, 24);
    const skin = P(a.skin || SKIN[1]), skinD = P(G.col.dark(a.skin || SKIN[1], .15));
    const hair = P(a.hair || HAIR[1]), hairD = P(G.col.dark(a.hair || HAIR[1], .3)), hairL = P(G.col.light(a.hair || HAIR[1], .3));
    const top = P(a.top || '#e84a4a'), topD = P(G.col.dark(a.top || '#e84a4a', .25)), topL = P(G.col.light(a.top || '#e84a4a', .25));
    const acc = P(a.acc || '#ffffff');
    const bot = P(a.bottom || '#3a4a6a'), botD = P(G.col.dark(a.bottom || '#3a4a6a', .25));
    const shoe = P(a.shoes || '#2a2a30'), eye = P('#1e1a24'), white = P('#ffffff');
    const hat = a.hat ? P(a.hat) : null, hatD = a.hat ? P(G.col.dark(a.hat, .3)) : null;
    const step = frame === 1 ? 1 : frame === 2 ? -1 : 0;
    const bob = frame ? 1 : 0;
    const side = dir === 'left' || dir === 'right';
    const oy = bob; // body moves down 1 on step frames? (classic: up) use -
    const Y = y => y - bob + 1;
    // shadow
    p.ell(8, 22.5, 5, 1.6, P('#000000'), 70);
    if (mode === 'surf') {
      // sitting on a board: just upper body
      drawHead(); drawTorso(true);
      p.outline(P('#1e1a24'));
      return p.done();
    }
    // legs
    if (!a.dress) {
      if (side) {
        const f = dir === 'left' ? -1 : 1;
        if (frame === 0) { p.rect(6, Y(17), 4, 4, bot); p.rect(6, Y(21), 4, 1, shoe); p.rect(6, Y(20), 1, 1, botD); }
        else { p.rect(5 + (step > 0 ? 2 * f : 0), Y(17), 3, 4, bot); p.rect(8 - (step > 0 ? 2 * f : 0), Y(17), 3, 4, botD); p.rect(4 + (step > 0 ? 3 * f : 0) + (f < 0 ? 0 : 1), Y(21), 3, 1, shoe); p.rect(8 - (step > 0 ? 3 * f : 0), Y(21), 3, 1, shoe); }
      } else {
        const lL = step > 0 ? -1 : 0, rL = step < 0 ? -1 : 0;
        p.rect(5, Y(17), 3, 4 + lL, bot); p.rect(8, Y(17), 3, 4 + rL, bot);
        p.rect(8, Y(17), 1, 4 + rL, botD);
        p.rect(5, Y(21 + lL), 3, 1, shoe); p.rect(8, Y(21 + rL), 3, 1, shoe);
      }
    } else {
      p.rect(4, Y(16), 8, 5, top); p.rect(4, Y(20), 8, 1, topD);
      p.rect(5, Y(21), 2, 1, shoe); p.rect(9, Y(21), 2, 1, shoe);
      if (step) { p.rect(step > 0 ? 5 : 9, Y(21), 2, 1, skin); }
    }
    drawTorso(false);
    drawHead();
    if (a.backpack && dir === 'up') { p.rect(4, Y(11), 8, 6, P(a.backpack)); p.rect(4, Y(11), 8, 1, P(G.col.light(a.backpack, .3))); p.rect(5, Y(13), 6, 1, P(G.col.dark(a.backpack, .3))); }
    if (a.backpack && side) { const bx = dir === 'left' ? 10 : 2; p.rect(bx, Y(11), 4, 6, P(a.backpack)); }
    p.outline(P('#1e1a24'));
    return p.done();

    function drawTorso(surf) {
      const ty = surf ? 12 : 10;
      if (a.coat) { p.rect(4, Y(ty), 8, surf ? 6 : 9, P(a.coat)); p.rect(4, Y(ty), 1, surf ? 6 : 9, P(G.col.dark(a.coat, .12))); }
      p.rect(4, Y(ty), 8, 7, a.coat ? top : top);
      if (a.coat) { p.rect(4, Y(ty), 2, 8, P(a.coat)); p.rect(10, Y(ty), 2, 8, P(a.coat)); if (!side && dir === 'down') p.rect(7, Y(ty), 2, 2, white); }
      p.rect(4, Y(ty + 6), 8, 1, topD);
      if (a.stripe) p.rect(4, Y(ty + 3), 8, 1, acc);
      if (a.emblem && dir === 'down') { p.rect(7, Y(ty + 2), 2, 2, acc); }
      if (a.scarf) { p.rect(4, Y(ty), 8, 2, P(a.scarf)); if (dir !== 'up') p.rect(side ? (dir === 'left' ? 10 : 4) : 9, Y(ty + 1), 2, 3, P(a.scarf)); }
      // arms
      const swing = step;
      if (side) {
        const f = dir === 'left' ? -1 : 1;
        p.rect(7 - swing * f, Y(ty + 1), 2, 5, topD); p.rect(7 - swing * f, Y(ty + 5), 2, 1, skin);
      } else {
        p.rect(3, Y(ty + 1 + (swing > 0 ? -1 : 0)), 1, 5, topD); p.rect(12, Y(ty + 1 + (swing < 0 ? -1 : 0)), 1, 5, topD);
        p.rect(3, Y(ty + 6 + (swing > 0 ? -1 : 0)), 1, 1, skin); p.rect(12, Y(ty + 6 + (swing < 0 ? -1 : 0)), 1, 1, skin);
        p.rect(4, Y(ty), 8, 1, topL);
      }
      if (a.belt) p.rect(4, Y(ty + 6), 8, 1, P(a.belt));
    }
    function drawHead() {
      const hy = 1;
      // face
      p.rect(4, Y(hy + 2), 8, 7, skin);
      p.rect(4, Y(hy + 8), 8, 1, skinD);
      const style = a.hairStyle || 'short';
      // hair back / sides
      if (dir === 'up') {
        p.rect(3, Y(hy), 10, 9, hair); p.rect(3, Y(hy + 8), 10, 1, hairD);
        if (style === 'long' || style === 'pony') p.rect(4, Y(hy + 8), 8, 4, hair);
        if (style === 'pony') p.rect(7, Y(hy + 9), 2, 5, hairD);
        if (style === 'bun') p.rect(6, Y(hy - 2), 4, 3, hair);
      } else {
        p.rect(3, Y(hy), 10, 3, hair); p.rect(4, Y(hy - 1), 8, 1, hair);
        if (side) {
          const f = dir === 'left' ? 1 : -1; // back of head side
          const bx = f > 0 ? 9 : 3;
          p.rect(bx, Y(hy + 2), 4, 5, hair);
          if (style === 'long') p.rect(bx, Y(hy + 5), 4, 6, hair);
          if (style === 'pony') p.rect(f > 0 ? 12 : 1, Y(hy + 3), 3, 5, hair);
          // face details
          const ex = dir === 'left' ? 5 : 10;
          p.rect(ex, Y(hy + 4), 1, 2, eye);
          p.set(dir === 'left' ? 3 : 12, Y(hy + 6), skin);
          if (a.glasses) p.rect(dir === 'left' ? 4 : 9, Y(hy + 4), 3, 1, P('#3a3a44'));
        } else {
          p.rect(3, Y(hy + 2), 1, 4, hair); p.rect(12, Y(hy + 2), 1, 4, hair);
          if (style === 'long') { p.rect(3, Y(hy + 2), 2, 8, hair); p.rect(11, Y(hy + 2), 2, 8, hair); }
          if (style === 'pony') { p.rect(12, Y(hy + 2), 2, 6, hair); }
          if (style === 'bob') { p.rect(3, Y(hy + 2), 2, 5, hair); p.rect(11, Y(hy + 2), 2, 5, hair); }
          // fringe
          for (let x = 4; x < 12; x++) if (x % 2 || style === 'spiky') p.set(x, Y(hy + 3), hair);
          p.rect(5, Y(hy + 5), 1, 2, eye); p.rect(10, Y(hy + 5), 1, 2, eye);
          p.set(5, Y(hy + 5), white);
          if (a.glasses) { p.rect(4, Y(hy + 5), 3, 1, P('#3a3a44')); p.rect(9, Y(hy + 5), 3, 1, P('#3a3a44')); p.set(7, Y(hy + 5), P('#3a3a44')); p.set(8, Y(hy + 5), P('#3a3a44')); }
          if (a.blush) { p.set(4, Y(hy + 7), P('#ff9aa0')); p.set(11, Y(hy + 7), P('#ff9aa0')); }
        }
        if (style === 'spiky') { p.set(4, Y(hy - 2), hair); p.set(7, Y(hy - 2), hair); p.set(10, Y(hy - 2), hair); p.rect(3, Y(hy - 1), 10, 1, hair); }
        if (style === 'bun') p.rect(6, Y(hy - 3), 4, 3, hair);
        if (style === 'mohawk') { p.rect(7, Y(hy - 3), 2, 4, hair); }
        p.rect(4, Y(hy), 5, 1, hairL);
      }
      if (style === 'bald') { p.rect(3, Y(hy), 10, 3, skin); p.rect(4, Y(hy - 1), 8, 1, skin); if (dir === 'up') p.rect(3, Y(hy), 10, 8, skin); }
      if (hat) {
        const cap = a.hatStyle || 'cap';
        if (cap === 'cap') { p.rect(3, Y(hy - 1), 10, 3, hat); p.rect(3, Y(hy + 1), 10, 1, hatD); if (dir === 'down') p.rect(4, Y(hy + 2), 8, 1, hatD); if (side) p.rect(dir === 'left' ? 1 : 11, Y(hy + 1), 4, 1, hatD); if (a.hatMark) p.rect(7, Y(hy - 1), 2, 2, P(a.hatMark)); }
        else if (cap === 'beanie') { p.rect(3, Y(hy - 2), 10, 4, hat); p.rect(3, Y(hy + 1), 10, 1, hatD); p.rect(7, Y(hy - 3), 2, 1, P('#ffffff')); }
        else if (cap === 'wide') { p.rect(1, Y(hy + 1), 14, 1, hatD); p.rect(4, Y(hy - 2), 8, 3, hat); }
        else if (cap === 'visor') { p.rect(3, Y(hy - 1), 10, 3, hat); if (dir !== 'up') p.rect(4, Y(hy + 3), 8, 2, P('#3ad0e8')); }
        else if (cap === 'hood') { p.rect(2, Y(hy - 1), 12, 5, hat); if (dir !== 'up') { p.rect(2, Y(hy + 3), 2, 5, hat); p.rect(12, Y(hy + 3), 2, 5, hat); } else p.rect(2, Y(hy + 3), 12, 6, hat); }
        else if (cap === 'band') { p.rect(3, Y(hy + 1), 10, 1, hat); }
      }
    }
  }
  // pixel walkers from the walker atlas (12 frames: down, left, right, up x stand/step/step)
  const WA = { img: null };
  const TA = { img: null };
  const loadImg = (atlas, into) => new Promise(res => {
    if (!atlas || typeof Image === 'undefined') return res();
    const im = new Image(); im.onload = () => { into.img = im; res(); }; im.onerror = () => res(); im.src = atlas.src;
  });
  function load() { return Promise.all([loadImg(G.WALK_ATLAS, WA), loadImg(G.TRAINER_ATLAS, TA)]); }
  // generated trainer battle sprites (art_src/build_trainers.py): idle 'i', action 'a', player back throw 'b0'..'b3'
  function hasBattle(a, k) { return !!(a && a.id && TA.img && G.TRAINER_ATLAS.rects[a.id] && G.TRAINER_ATLAS.rects[a.id][k]); }
  function battleSprite(a, k) {
    if (!hasBattle(a, k)) return null;
    const key = 'tb|' + a.id + '|' + k;
    if (!cache.has(key)) {
      const [x, y, w, h] = G.TRAINER_ATLAS.rects[a.id][k];
      const cv = G.makeCanvas(w, h), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
      c.drawImage(TA.img, x, y, w, h, 0, 0, w, h); cache.set(key, cv);
    }
    return cache.get(key);
  }
  function atlasSheet(id) {
    const A = G.WALK_ATLAS, [x0, y0] = A.rects[id], fw = A.fw, fh = A.fh;
    const fr = k => { const cv = G.makeCanvas(fw, fh); cv.getContext('2d').drawImage(WA.img, x0 + k * fw, y0, fw, fh, 0, 0, fw, fh); return cv; };
    const S = {}, dirs = ['down', 'left', 'right', 'up'];
    // generated sheets are not perfectly consistent: pick the true standing pose (narrowest stance at
    // the feet) and align every frame on the head so the body doesn't wobble while walking
    const metrics = cv => {
      const d = cv.getContext('2d').getImageData(0, 0, fw, fh).data, rows = [];
      for (let y = 0; y < fh; y++) { let a = -1, b = -1; for (let x = 0; x < fw; x++) if (d[(y * fw + x) * 4 + 3] > 0) { if (a < 0) a = x; b = x; } rows.push([a, b]); }
      const filled = rows.map((r, y) => r[0] >= 0 ? y : -1).filter(y => y >= 0);
      const top = filled[0] || 0, bot = filled[filled.length - 1] || fh - 1;
      let feet = 0, n = 0; for (let y = bot - 3; y <= bot; y++) if (rows[y] && rows[y][0] >= 0) { feet += rows[y][1] - rows[y][0]; n++; }
      let head = 0, hn = 0; for (let y = top; y < top + 8 && y < fh; y++) if (rows[y][0] >= 0) { head += (rows[y][0] + rows[y][1]) / 2; hn++; }
      let sx = 0, sn = 0; for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (d[(y * fw + x) * 4 + 3] > 0) { sx += x; sn++; }
      return { feet: n ? feet / n : 0, head: hn ? head / hn : fw / 2, mass: sn ? sx / sn : fw / 2 };
    };
    const shift = (cv, dx) => { if (!dx) return cv; const o = G.makeCanvas(fw, fh); o.getContext('2d').drawImage(cv, dx, 0); return o; };
    dirs.forEach((d, i) => {
      let F = [fr(i * 3), fr(i * 3 + 1), fr(i * 3 + 2)];
      try {
        const M = F.map(metrics);
        const si = d === 'left' || d === 'right' ? M.reduce((bi, m, k) => m.feet < M[bi].feet ? k : bi, 0) : 0;
        const order = [si, ...[0, 1, 2].filter(k => k !== si)];
        // side views align on the head; front/back views on the whole body, so both strides swing evenly
        const key = d === 'left' || d === 'right' ? 'head' : 'mass';
        const hx = M[si][key];
        F = order.map(k => shift(F[k], Math.round(hx - M[k][key])));
      } catch (e) { /* keep sheet order */ }
      S[d] = F;
      // surfing: upper body only, from the standing frame
      const cv = G.makeCanvas(fw, fh - 10); cv.getContext('2d').drawImage(S[d][0], 0, 0, fw, fh - 10, 0, 0, fw, fh - 10); S[d + '_surf'] = [cv];
    });
    return S;
  }
  function sheet(a) {
    if (a && a.id && WA.img && G.WALK_ATLAS.rects[a.id]) { const k = 'atlas|' + a.id; if (!cache.has(k)) cache.set(k, atlasSheet(a.id)); return cache.get(k); }
    const key = JSON.stringify(a);
    if (cache.has(key)) return cache.get(key);
    const S = {};
    for (const d of ['down', 'up', 'left']) {
      S[d] = [0, 1, 2].map(f => walker(a, d, f));
      S[d + '_surf'] = [walker(a, d, 0, 'surf')];
    }
    S.right = S.left.map(c => G.pix.flipH(c));
    S.right_surf = S.left_surf.map(c => G.pix.flipH(c));
    cache.set(key, S);
    return S;
  }
  // ----------------------------------------------------- battle portrait
  function portrait(a, pose = 'stand', back = false) {
    const key = 'por|' + JSON.stringify(a) + pose + back;
    if (cache.has(key)) return cache.get(key);
    // generated sprite: framed bottom-centre in a 96x88 box (idle and action poses share the anchor)
    const k = back ? 'b0' : (pose === 'point' || pose === 'throw') ? 'a' : 'i';
    const spr = battleSprite(a, k) || (k === 'a' ? battleSprite(a, 'i') : null);
    if (spr) {
      const cv = G.makeCanvas(96, 88), c = cv.getContext('2d'); c.imageSmoothingEnabled = false;
      const idle = battleSprite(a, 'i') || spr;
      c.drawImage(spr, Math.round(48 - idle.width / 2 + (k === 'a' ? (idle.width - spr.width) / 2 : 0)), 88 - spr.height);
      cv.atlas = true; cache.set(key, cv); return cv;
    }
    const W = 72, H = 88;
    const cv = G.pix.make(W, H, (c) => {
      const sh = (col, t) => G.col.dark(col, t), lt = (col, t) => G.col.light(col, t);
      const skin = a.skin || SKIN[1], hair = a.hair || HAIR[1], top = a.top || '#e84a4a', bot = a.bottom || '#3a4a6a';
      const grad = (x0, y0, x1, y1, col) => { const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, lt(col, .18)); g.addColorStop(1, sh(col, .18)); return g; };
      const blob = (pts, col) => { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); c.fillStyle = col; c.fill(); };
      const ell = (x, y, rx, ry, col, rot = 0) => { c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); c.fillStyle = col; c.fill(); };
      const cx = 36;
      // legs
      if (a.dress) blob([[cx - 13, 50], [cx + 13, 50], [cx + 17, 78], [cx - 17, 78]], grad(cx - 15, 50, cx + 15, 78, top));
      else {
        blob([[cx - 11, 54], [cx - 1, 54], [cx - 2, 82], [cx - 10, 82]], grad(cx - 11, 54, cx, 82, bot));
        blob([[cx + 1, 54], [cx + 11, 54], [cx + 10, 82], [cx + 2, 82]], grad(cx, 54, cx + 11, 82, sh(bot, .08)));
      }
      ell(cx - 7, 84, 6, 3, a.shoes || '#2a2a30'); ell(cx + 7, 84, 6, 3, a.shoes || '#2a2a30');
      // torso
      if (a.coat) blob([[cx - 16, 30], [cx + 16, 30], [cx + 19, 70], [cx - 19, 70]], grad(cx - 18, 30, cx + 18, 70, a.coat));
      blob([[cx - 14, 30], [cx + 14, 30], [cx + 13, 58], [cx - 13, 58]], grad(cx - 14, 30, cx + 14, 58, top));
      if (a.coat) { blob([[cx - 16, 30], [cx - 7, 30], [cx - 9, 70], [cx - 19, 70]], grad(cx - 18, 30, cx - 8, 70, a.coat)); blob([[cx + 7, 30], [cx + 16, 30], [cx + 19, 70], [cx + 9, 70]], grad(cx + 8, 30, cx + 18, 70, sh(a.coat, .06))); }
      if (a.stripe) { c.fillStyle = a.acc || '#fff'; c.fillRect(cx - 14, 42, 28, 3); }
      if (a.emblem) { c.fillStyle = a.acc || '#fff'; c.beginPath(); c.arc(cx, 40, 4, 0, Math.PI * 2); c.fill(); c.fillStyle = top; c.fillRect(cx - 1, 37, 2, 6); }
      if (a.belt) { c.fillStyle = a.belt; c.fillRect(cx - 13, 54, 26, 3); }
      if (a.scarf) { blob([[cx - 11, 27], [cx + 11, 27], [cx + 12, 34], [cx - 12, 34]], a.scarf); blob([[cx + 4, 32], [cx + 11, 32], [cx + 14, 50], [cx + 7, 50]], sh(a.scarf, .1)); }
      // arms by pose
      const arm = (x0, y0, x1, y1, col) => { c.lineCap = 'round'; c.strokeStyle = col; c.lineWidth = 8; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); };
      const sleeve = a.coat || top;
      if (pose === 'point') { arm(cx - 13, 34, cx - 17, 56, sh(sleeve, .1)); ell(cx - 17, 58, 4, 4, skin); arm(cx + 13, 34, cx + 30, 26, sleeve); ell(cx + 32, 25, 4.5, 4, skin); }
      else if (pose === 'hip') { arm(cx - 13, 34, cx - 21, 46, sh(sleeve, .1)); arm(cx - 21, 46, cx - 13, 54, sh(sleeve, .1)); ell(cx - 13, 54, 4, 4, skin); arm(cx + 13, 34, cx + 21, 46, sleeve); arm(cx + 21, 46, cx + 13, 54, sleeve); ell(cx + 13, 54, 4, 4, skin); }
      else if (pose === 'cross') { arm(cx - 13, 34, cx + 8, 46, sh(sleeve, .1)); arm(cx + 13, 34, cx - 8, 44, sleeve); ell(cx + 9, 46, 3.5, 3.5, skin); ell(cx - 9, 44, 3.5, 3.5, skin); }
      else if (pose === 'throw') { arm(cx - 13, 34, cx - 26, 22, sh(sleeve, .1)); ell(cx - 27, 20, 5, 5, '#e8484a'); arm(cx + 13, 34, cx + 17, 56, sleeve); ell(cx + 17, 58, 4, 4, skin); }
      else { arm(cx - 13, 34, cx - 17, 57, sh(sleeve, .1)); ell(cx - 17, 59, 4, 4, skin); arm(cx + 13, 34, cx + 17, 57, sleeve); ell(cx + 17, 59, 4, 4, skin); }
      // neck + head
      c.fillStyle = sh(skin, .1); c.fillRect(cx - 4, 22, 8, 9);
      const style = a.hairStyle || 'short';
      if (style === 'long' || style === 'pony' && back) blob([[cx - 14, 8], [cx + 14, 8], [cx + 15, 38], [cx - 15, 38]], sh(hair, .1));
      if (style === 'pony' && !back) blob([[cx + 10, 6], [cx + 20, 10], [cx + 22, 30], [cx + 14, 26]], sh(hair, .1));
      ell(cx, 14, 11.5, 12.5, back ? hair : skin);
      if (!back) {
        // hair cap
        c.beginPath(); c.ellipse(cx, 11, 12.5, 11, 0, Math.PI * .95, Math.PI * 2.05); c.fillStyle = hair; c.fill();
        if (style === 'spiky') for (let i = -2; i <= 2; i++) blob([[cx + i * 5 - 4, 6], [cx + i * 5 + 1, -3 + Math.abs(i)], [cx + i * 5 + 4, 6]], hair);
        if (style === 'long' || style === 'bob') { blob([[cx - 12, 8], [cx - 7, 8], [cx - 8, style === 'bob' ? 24 : 32], [cx - 14, style === 'bob' ? 24 : 32]], hair); blob([[cx + 7, 8], [cx + 12, 8], [cx + 14, style === 'bob' ? 24 : 32], [cx + 8, style === 'bob' ? 24 : 32]], hair); }
        if (style === 'bun') ell(cx, -1, 6, 5, hair);
        if (style === 'mohawk') blob([[cx - 3, 4], [cx, -6], [cx + 3, 4]], hair);
        if (style === 'bald') { c.beginPath(); c.ellipse(cx, 11, 12.5, 11, 0, Math.PI, Math.PI * 2); c.fillStyle = skin; c.fill(); }
        // fringe
        blob([[cx - 11, 8], [cx + 11, 8], [cx + 9, 13], [cx + 4, 10], [cx, 13], [cx - 5, 10], [cx - 10, 13]], hair);
        // face
        c.fillStyle = '#1e1a24';
        c.fillRect(cx - 7, 15, 3, 4); c.fillRect(cx + 4, 15, 3, 4);
        c.fillStyle = '#ffffff'; c.fillRect(cx - 7, 15, 1, 1); c.fillRect(cx + 4, 15, 1, 1);
        c.fillStyle = sh(skin, .35); c.fillRect(cx - 2, 23, 4, 1);
        if (a.blush) { c.fillStyle = 'rgba(255,120,140,.5)'; c.fillRect(cx - 10, 20, 3, 2); c.fillRect(cx + 7, 20, 3, 2); }
        if (a.glasses) { c.strokeStyle = '#2a2a34'; c.lineWidth = 1.2; c.strokeRect(cx - 9, 14, 6, 5); c.strokeRect(cx + 3, 14, 6, 5); c.beginPath(); c.moveTo(cx - 3, 16); c.lineTo(cx + 3, 16); c.stroke(); }
        if (a.beard) blob([[cx - 9, 19], [cx + 9, 19], [cx + 6, 27], [cx, 29], [cx - 6, 27]], a.beard);
      } else {
        if (style === 'pony') blob([[cx - 3, 18], [cx + 3, 18], [cx + 4, 34], [cx - 4, 34]], sh(hair, .15));
      }
      // hats
      if (a.hat) {
        const hs = a.hatStyle || 'cap';
        if (hs === 'cap') { c.beginPath(); c.ellipse(cx, 6, 12.5, 7, 0, Math.PI, Math.PI * 2); c.fillStyle = a.hat; c.fill(); if (!back) blob([[cx - 12, 6], [cx + 16, 6], [cx + 18, 9], [cx - 10, 9]], sh(a.hat, .25)); if (a.hatMark) { c.fillStyle = a.hatMark; c.fillRect(cx - 3, 0, 6, 4); } }
        else if (hs === 'beanie') { c.beginPath(); c.ellipse(cx, 8, 13, 10, 0, Math.PI, Math.PI * 2); c.fillStyle = a.hat; c.fill(); c.fillStyle = sh(a.hat, .2); c.fillRect(cx - 13, 6, 26, 4); ell(cx, -3, 3.5, 3.5, '#ffffff'); }
        else if (hs === 'wide') { ell(cx, 5, 20, 4, sh(a.hat, .15)); c.beginPath(); c.ellipse(cx, 4, 10, 8, 0, Math.PI, Math.PI * 2); c.fillStyle = a.hat; c.fill(); }
        else if (hs === 'visor') { c.beginPath(); c.ellipse(cx, 7, 12.5, 9, 0, Math.PI, Math.PI * 2); c.fillStyle = a.hat; c.fill(); if (!back) { c.fillStyle = 'rgba(58,208,232,.9)'; c.fillRect(cx - 10, 12, 20, 6); c.fillStyle = 'rgba(255,255,255,.7)'; c.fillRect(cx - 8, 13, 6, 2); } }
        else if (hs === 'hood') { c.beginPath(); c.ellipse(cx, 11, 15, 15, 0, Math.PI * .85, Math.PI * 2.15); c.fillStyle = a.hat; c.fill(); }
        else if (hs === 'band') { c.fillStyle = a.hat; c.fillRect(cx - 12, 6, 24, 3); }
      }
      if (a.prop === 'staff') { c.strokeStyle = '#7a5030'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + 24, 14); c.lineTo(cx + 22, 86); c.stroke(); ell(cx + 24, 12, 5, 5, a.propCol || '#a8f0ff'); }
      if (a.prop === 'hammer') { c.strokeStyle = '#7a5030'; c.lineWidth = 3; c.beginPath(); c.moveTo(cx + 22, 30); c.lineTo(cx + 28, 70); c.stroke(); c.fillStyle = '#6a6e78'; c.fillRect(cx + 16, 22, 16, 10); }
      if (a.prop === 'book') { c.fillStyle = a.propCol || '#6a4ab0'; c.fillRect(cx - 24, 44, 12, 15); c.fillStyle = '#f0e8d0'; c.fillRect(cx - 23, 45, 2, 13); }
      if (a.prop === 'bag') { c.fillStyle = a.propCol || '#a86a3a'; c.fillRect(cx + 12, 38, 10, 14); }
      if (a.prop === 'rod') { c.strokeStyle = '#8a5a34'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx + 18, 60); c.lineTo(cx + 34, 2); c.stroke(); }
      if (a.prop === 'clipboard') { c.fillStyle = '#c89058'; c.fillRect(cx - 26, 40, 12, 16); c.fillStyle = '#ffffff'; c.fillRect(cx - 25, 42, 10, 12); }
      if (a.cape) { c.globalCompositeOperation = 'destination-over'; blob([[cx - 16, 28], [cx + 16, 28], [cx + 24, 84], [cx - 24, 84]], a.cape); c.globalCompositeOperation = 'source-over'; }
    }, { posterize: 0 });
    cache.set(key, cv);
    return cv;
  }
  return { walker, sheet, portrait, battleSprite, hasBattle, load, SKIN, HAIR };
})();

// ----------------------------------------------------------- appearances --
// Trainer class presets and named characters.
G.LOOKS = {
  player_a: { skin: '#f6cfa6', hair: '#4a3226', hairStyle: 'short', top: '#e84a4a', bottom: '#2a3a5a', hat: '#ffffff', hatStyle: 'cap', hatMark: '#e84a4a', backpack: '#ffd166', shoes: '#2a2a30' },
  player_b: { skin: '#f6cfa6', hair: '#3a2226', hairStyle: 'long', top: '#2bb3a3', bottom: '#3a3a4a', hat: '#f4f4f4', hatStyle: 'beanie', backpack: '#ff8ab0', shoes: '#e84a4a', blush: true },
  player_c: { skin: '#c68a5e', hair: '#1e1a1e', hairStyle: 'spiky', top: '#3a64c8', bottom: '#2a2a30', backpack: '#e88a3a', shoes: '#f0f0f0' },
  player_d: { skin: '#9a643e', hair: '#e8c060', hairStyle: 'pony', top: '#ffd166', bottom: '#6a3a8a', hat: '#6a3a8a', hatStyle: 'cap', hatMark: '#ffd166', backpack: '#2bb3a3', shoes: '#2a2a30' },
  wren: { skin: '#ffe0c4', hair: '#b8742e', hairStyle: 'spiky', top: '#2f6fd6', bottom: '#2a2a30', scarf: '#ffd84a', shoes: '#e84a4a', backpack: '#3a3a44' },
  wren_crane: { skin: '#ffe0c4', hair: '#b8742e', hairStyle: 'spiky', top: '#2a2e3a', bottom: '#2a2a30', scarf: '#3fd0bf', shoes: '#2a2a30', stripe: true, acc: '#3fd0bf' },
  hale: { skin: '#e2ae82', hair: '#2a2226', hairStyle: 'bun', top: '#5a7a9a', bottom: '#3a4a5a', coat: '#f4f6fa', glasses: true, shoes: '#6a4428', prop: 'clipboard' },
  mom: { skin: '#f6cfa6', hair: '#7a4a2a', hairStyle: 'long', top: '#f08ab0', bottom: '#5a6a8a', dress: true, shoes: '#8a5a34' },
  sable: { skin: '#ffe0c4', hair: '#b8742e', hairStyle: 'long', top: '#1e2a44', bottom: '#1e2a44', coat: '#2f6fd6', scarf: '#ffd84a', shoes: '#2a2a30', cape: '#1a2a5a' },
  crane: { skin: '#f6cfa6', hair: '#c8c8d0', hairStyle: 'bob', top: '#2a2e3a', bottom: '#2a2e3a', coat: '#f4f6fa', scarf: '#3fd0bf', shoes: '#1e1a24', glasses: true },
  grey: { skin: '#e2ae82', hair: '#5a5e6a', hairStyle: 'short', top: '#3a3e4a', bottom: '#2a2e38', coat: '#6a707e', shoes: '#1e1a24', glasses: true },
  lark: { skin: '#ffe0c4', hair: '#8a4ac8', hairStyle: 'mohawk', top: '#2a2e3a', bottom: '#3a2a4a', scarf: '#e84a8a', shoes: '#e84a8a', stripe: true, acc: '#3fd0bf' },
  grunt: { skin: '#f6cfa6', hair: '#3a3a44', hairStyle: 'short', top: '#4a5060', bottom: '#2e323c', hat: '#4a5060', hatStyle: 'visor', stripe: true, acc: '#3fd0bf', shoes: '#1e1a24' },
  grunt_f: { skin: '#e2ae82', hair: '#3a3a44', hairStyle: 'pony', top: '#4a5060', bottom: '#2e323c', hat: '#4a5060', hatStyle: 'visor', stripe: true, acc: '#3fd0bf', shoes: '#1e1a24' },
  scientist: { skin: '#f6cfa6', hair: '#6a6a70', hairStyle: 'short', top: '#6a8aaa', bottom: '#3a4a5a', coat: '#f4f6fa', glasses: true, shoes: '#3a3a44' },
  // gym wardens
  juniper: { skin: '#f6cfa6', hair: '#3a8a4a', hairStyle: 'long', top: '#f4e8cc', bottom: '#5a8a4a', dress: true, hat: '#e8c088', hatStyle: 'wide', shoes: '#6a4428', blush: true },
  ione: { skin: '#9a643e', hair: '#f0e0b0', hairStyle: 'spiky', top: '#2a2a34', bottom: '#2a2a34', coat: '#ffd84a', shoes: '#ffd84a', glasses: true },
  brann: { skin: '#c68a5e', hair: '#d84a3a', hairStyle: 'bald', top: '#5a3a2a', bottom: '#3a2a20', beard: '#d84a3a', shoes: '#2a2020', prop: 'hammer', belt: '#2a2a30' },
  mireille: { skin: '#ffe0c4', hair: '#e8e0f8', hairStyle: 'long', top: '#4a2a6a', bottom: '#2a1a3a', dress: true, hat: '#2a1a3a', hatStyle: 'wide', shoes: '#1e1a24', prop: 'book', propCol: '#8a4ac8' },
  sigrid: { skin: '#ffe0c4', hair: '#f0e0b0', hairStyle: 'pony', top: '#3a8ae0', bottom: '#f4f4f8', scarf: '#ffffff', hat: '#3a8ae0', hatStyle: 'beanie', shoes: '#3a8ae0' },
  kaelen: { skin: '#e2ae82', hair: '#1e1a24', hairStyle: 'long', top: '#3a2a5a', bottom: '#2a1e3a', coat: '#6f35fc', shoes: '#1e1a24', cape: '#2a1a4a' },
  // elite
  rook: { skin: '#9a643e', hair: '#1e1a24', hairStyle: 'short', top: '#f4f4f8', bottom: '#f4f4f8', belt: '#1e1a24', shoes: '#9a643e', hat: '#e84a4a', hatStyle: 'band' },
  seraphine: { skin: '#ffe0c4', hair: '#f08ab0', hairStyle: 'bun', top: '#f95587', bottom: '#f4f4f8', dress: true, shoes: '#f4f4f8', prop: 'staff', propCol: '#ffd0e8' },
  nyx: { skin: '#e2ae82', hair: '#2a2226', hairStyle: 'bob', top: '#2a2226', bottom: '#2a2226', coat: '#705746', hat: '#2a2226', hatStyle: 'hood', shoes: '#1e1a24' },
  ferrum: { skin: '#c68a5e', hair: '#c8c8d0', hairStyle: 'short', top: '#8a8ea0', bottom: '#5a5e6a', coat: '#a0a0c0', shoes: '#3a3a44', beard: '#c8c8d0', glasses: true },
  wanderer: { skin: '#f6cfa6', hair: '#1e1a1e', hairStyle: 'short', top: '#3a3a44', bottom: '#2a2a30', coat: '#6a2a2a', scarf: '#e84a4a', hat: '#e84a4a', hatStyle: 'cap', shoes: '#1e1a24' },
  // classes
  kid: { skin: '#f6cfa6', hair: '#4a3226', hairStyle: 'short', top: '#ff8a3a', bottom: '#3a6ac8', hat: '#3a6ac8', hatStyle: 'cap', shoes: '#e84a4a' },
  lass: { skin: '#ffe0c4', hair: '#b8742e', hairStyle: 'pony', top: '#f08ab0', bottom: '#f4f4f8', dress: true, shoes: '#e84a4a', blush: true },
  bugmaniac: { skin: '#f6cfa6', hair: '#2a2226', hairStyle: 'short', top: '#8ac84a', bottom: '#8a6a3a', hat: '#f4e8a8', hatStyle: 'wide', shoes: '#6a4428', prop: 'rod' },
  hiker: { skin: '#c68a5e', hair: '#4a3226', hairStyle: 'short', top: '#a86a3a', bottom: '#5a4a3a', hat: '#7a5a3a', hatStyle: 'wide', beard: '#4a3226', backpack: '#5a7a3a', shoes: '#4a3a2a', prop: 'bag', propCol: '#5a7a3a' },
  fisher: { skin: '#e2ae82', hair: '#6a6a70', hairStyle: 'short', top: '#e8c040', bottom: '#3a4a6a', hat: '#e8c040', hatStyle: 'wide', shoes: '#3a3a44', prop: 'rod' },
  swimmer: { skin: '#e2ae82', hair: '#2a2226', hairStyle: 'short', top: '#3a8ae0', bottom: '#3a8ae0', shoes: '#e2ae82', hat: '#e8484a', hatStyle: 'band' },
  swimmer_f: { skin: '#f6cfa6', hair: '#e8c060', hairStyle: 'long', top: '#e84a8a', bottom: '#e84a8a', shoes: '#f6cfa6' },
  ace: { skin: '#f6cfa6', hair: '#2a2226', hairStyle: 'spiky', top: '#f4f4f8', bottom: '#2a2a30', coat: '#3a64c8', shoes: '#2a2a30', scarf: '#e84a4a' },
  ace_f: { skin: '#ffe0c4', hair: '#8a4ac8', hairStyle: 'long', top: '#f4f4f8', bottom: '#2a2a30', coat: '#e84a8a', shoes: '#2a2a30' },
  ranger: { skin: '#c68a5e', hair: '#4a3226', hairStyle: 'short', top: '#4a7a3a', bottom: '#5a4a3a', hat: '#6a8a4a', hatStyle: 'wide', shoes: '#4a3a2a', belt: '#8a5a34' },
  blackbelt: { skin: '#e2ae82', hair: '#1e1a1e', hairStyle: 'bald', top: '#f4f4f8', bottom: '#f4f4f8', belt: '#1e1a24', shoes: '#e2ae82', hat: '#e84a4a', hatStyle: 'band' },
  mystic: { skin: '#ffe0c4', hair: '#6a3a8a', hairStyle: 'long', top: '#3a2a4a', bottom: '#2a1a3a', dress: true, hat: '#3a2a4a', hatStyle: 'hood', shoes: '#1e1a24' },
  skier: { skin: '#ffe0c4', hair: '#e8c060', hairStyle: 'short', top: '#e84a4a', bottom: '#2a2a30', hat: '#e84a4a', hatStyle: 'beanie', scarf: '#ffffff', shoes: '#2a2a30' },
  dragontamer: { skin: '#e2ae82', hair: '#2a2226', hairStyle: 'spiky', top: '#6f35fc', bottom: '#2a1e3a', cape: '#3a1a5a', shoes: '#1e1a24' },
  veteran: { skin: '#e2ae82', hair: '#c8c8d0', hairStyle: 'short', top: '#5a6a4a', bottom: '#3a4a3a', beard: '#c8c8d0', shoes: '#3a2a20', belt: '#8a5a34' },
  gentleman: { skin: '#f6cfa6', hair: '#6a6a70', hairStyle: 'short', top: '#3a3a44', bottom: '#2a2a30', coat: '#3a3a44', hat: '#2a2a30', hatStyle: 'wide', shoes: '#1e1a24', beard: '#8a8a90' },
  lady: { skin: '#ffe0c4', hair: '#e8c060', hairStyle: 'bun', top: '#8a4ac8', bottom: '#8a4ac8', dress: true, hat: '#f4f4f8', hatStyle: 'wide', shoes: '#f4f4f8' },
  sailor: { skin: '#c68a5e', hair: '#2a2226', hairStyle: 'short', top: '#f4f4f8', bottom: '#2a3a6a', hat: '#f4f4f8', hatStyle: 'cap', stripe: true, acc: '#2a3a6a', shoes: '#1e1a24' },
  worker: { skin: '#c68a5e', hair: '#4a3226', hairStyle: 'short', top: '#ff8a3a', bottom: '#3a4a6a', hat: '#ffd84a', hatStyle: 'cap', shoes: '#4a3a2a', stripe: true, acc: '#ffffff' },
  punk: { skin: '#f6cfa6', hair: '#e84a8a', hairStyle: 'mohawk', top: '#2a2a30', bottom: '#3a3a44', shoes: '#e84a4a', stripe: true, acc: '#c0c0c0' },
  artist: { skin: '#ffe0c4', hair: '#d84a3a', hairStyle: 'bob', top: '#f4e8cc', bottom: '#3a6ac8', hat: '#d84a3a', hatStyle: 'beanie', shoes: '#6a4428' },
  twins: { skin: '#ffe0c4', hair: '#f08ab0', hairStyle: 'pony', top: '#ffd84a', bottom: '#f4f4f8', dress: true, shoes: '#e84a4a', blush: true },
  oldman: { skin: '#e2ae82', hair: '#f4f4f8', hairStyle: 'bald', top: '#8a6a4a', bottom: '#5a4a3a', beard: '#f4f4f8', shoes: '#3a2a20' },
  oldwoman: { skin: '#f6cfa6', hair: '#d8d8e0', hairStyle: 'bun', top: '#8a5aa8', bottom: '#5a4a6a', dress: true, shoes: '#3a2a20' },
  nurse: { skin: '#ffe0c4', hair: '#f08ab0', hairStyle: 'bun', top: '#f4f4f8', bottom: '#f4f4f8', dress: true, hat: '#f4f4f8', hatStyle: 'band', shoes: '#f4f4f8', blush: true },
  clerk: { skin: '#f6cfa6', hair: '#4a3226', hairStyle: 'short', top: '#3a64c8', bottom: '#2a2a30', stripe: true, acc: '#ffffff', shoes: '#1e1a24' },
  girl: { skin: '#e2ae82', hair: '#2a2226', hairStyle: 'bob', top: '#2bb3a3', bottom: '#f4f4f8', dress: true, shoes: '#e84a4a' },
  boy: { skin: '#c68a5e', hair: '#1e1a1e', hairStyle: 'spiky', top: '#e8c040', bottom: '#3a4a6a', shoes: '#2a2a30' },
  woman: { skin: '#f6cfa6', hair: '#b8742e', hairStyle: 'long', top: '#6a9ae0', bottom: '#3a3a4a', shoes: '#6a4428' },
  man: { skin: '#e2ae82', hair: '#4a3226', hairStyle: 'short', top: '#5a8a4a', bottom: '#3a3a4a', shoes: '#3a2a20' },
  farmer: { skin: '#c68a5e', hair: '#7a4a2a', hairStyle: 'short', top: '#e8484a', bottom: '#3a5a9a', hat: '#e8c088', hatStyle: 'wide', shoes: '#4a3a2a' },
  officer: { skin: '#e2ae82', hair: '#2a2226', hairStyle: 'short', top: '#2a3a6a', bottom: '#2a3a6a', hat: '#2a3a6a', hatStyle: 'cap', hatMark: '#ffd84a', shoes: '#1e1a24', belt: '#1e1a24' },
};
for (const k in G.LOOKS) G.LOOKS[k].id = k;
