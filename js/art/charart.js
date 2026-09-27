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
      // front/back stride: lowest pixel under the left half vs the right half (both feet planted = level)
      const mid = Math.round(sn ? sx / sn : fw / 2); let lL = 0, lR = 0;
      for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (d[(y * fw + x) * 4 + 3] > 0) { if (x < mid) lL = y; else lR = y; }
      return { feet: n ? feet / n : 0, head: hn ? head / hn : fw / 2, mass: sn ? sx / sn : fw / 2, n: sn, level: Math.abs(lL - lR) };
    };
    const shift = (cv, dx) => { if (!dx) return cv; const o = G.makeCanvas(fw, fh); o.getContext('2d').drawImage(cv, dx, 0); return o; };
    dirs.forEach((d, i) => {
      let F = [fr(i * 3), fr(i * 3 + 1), fr(i * 3 + 2)];
      try {
        let M = F.map(metrics);
        // frames the extractor lost (nearly empty) are replaced by the fullest frame
        const full = M.reduce((bi, m, k) => m.n > M[bi].n ? k : bi, 0);
        F = F.map((f, k) => M[k].n < M[full].n * .4 ? F[full] : f); M = F.map(metrics);
        const side = d === 'left' || d === 'right';
        // the sheets keep the standing pose first and the two strides after it (guessing the stance from
        // the pixels picked a stride for most characters, so they stood mid-step and walked on one leg)
        // side views align on the head; front/back views on the whole body, so both strides swing evenly
        const key = side ? 'head' : 'mass';
        const hx = M[0][key];
        F = F.map((f, k) => shift(f, Math.round(hx - M[k][key])));
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
    // no painted art yet (the mother, the nurse, townsfolk): a clean placeholder, a slate silhouette with a
    // hint of their hair and clothes, until their portraits are drawn (prompts: art_src, group J)
    const W = 72, H = 88, cv = G.makeCanvas(W, H), c = cv.getContext('2d');
    const mix = (col, k) => { const A = G.col.parse(col), B = [52, 58, 88]; return `rgb(${B.map((b, i) => Math.round(b + (A[i] - b) * k)).join(",")})`; };
    const body = () => { c.beginPath(); c.moveTo(9, 88); c.bezierCurveTo(9, 50, 18, 38, 36, 38); c.bezierCurveTo(54, 38, 63, 50, 63, 88); c.closePath(); };
    const head = () => { c.beginPath(); c.ellipse(36, 22, 11, 12.5, 0, 0, Math.PI * 2); };
    c.fillStyle = '#343a58'; body(); c.fill(); c.fillRect(31, 30, 10, 10); head(); c.fill();
    c.save(); body(); c.clip(); c.fillStyle = mix(a.top || '#8090b0', .5); c.fillRect(0, 0, W, H); c.restore();
    c.save(); head(); c.clip(); c.fillStyle = mix(a.hair || '#5a4a40', .6); c.fillRect(0, 0, W, 19); c.restore();
    // a rim of light from the upper left
    c.strokeStyle = 'rgba(190,200,240,.5)'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(36, 22, 10.5, 12, 0, Math.PI * .95, Math.PI * 1.6); c.stroke();
    c.beginPath(); c.moveTo(10.5, 70); c.bezierCurveTo(10.5, 50, 19, 39.5, 31, 39); c.stroke();
    // hard pixel edges, like the rest of the art
    const d = c.getImageData(0, 0, W, H); for (let i = 3; i < d.data.length; i += 4) d.data[i] = d.data[i] > 110 ? 255 : 0; c.putImageData(d, 0, 0);
    cv.placeholder = true;
    cache.set(key, cv);
    return cv;
  }
  // feet-centre x of a battle sprite frame (animation frames are anchored there so they don't drift)
  function battleFeet(a, k) { const r = hasBattle(a, k) && G.TRAINER_ATLAS.rects[a.id][k]; return r ? (r[4] !== undefined ? r[4] : r[2] / 2) : 0; }
  return { walker, sheet, portrait, battleSprite, battleFeet, hasBattle, load, SKIN, HAIR };
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
