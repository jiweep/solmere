'use strict';
// ============================================================================
//  Species art, part 1: starters, early routes.  (canvas 96x96, ground ~y=90,
//  front view faces LEFT toward the player.)
// ============================================================================
(function () {
  const M = G.MONDRAW, P = G.MONPAL;
  const def = (id, pal, fn, o = {}) => { P[id] = { c: pal, ...o }; M[id] = fn; };
  const shadow = (d, x, y, rx) => { d.c.fillStyle = 'rgba(0,0,0,.22)'; d.c.beginPath(); d.c.ellipse(x, y, rx, rx * .22, 0, 0, d.TAU); d.c.fill(); };
  // generic quadruped legs
  const legs4 = (d, col, pts, w, dark) => { pts.forEach(([x0, y0, x1, y1], i) => d.limb(x0, y0, x1, y1, w, i % 2 ? G.col.dark(col, dark || .12) : col)); };

  // ---------------------------------------------------------------- BUDLING
  def('budling', { a: '#d2a878', b: '#9a7048', c: '#f6ecd6', g: '#6ccc52', h: '#3f9a3a', e: '#3a2618' }, (d, C) => {
    const br = d.s * .8;
    shadow(d, 50, 88, 24);
    legs4(d, C.b, [[40, 70, 38, 86], [48, 72, 48, 87], [60, 72, 62, 86], [66, 70, 69, 85]], 5);
    d.ell(55, 66 - br * .3, 19, 12 + br * .3, C.a);
    d.ell(58, 74, 13, 5, C.c, { flat: true });
    for (const [x, y] of [[54, 58], [62, 61], [68, 57]]) d.ell(x, y, 2.2, 1.6, C.c, { flat: true });
    d.ell(71, 62, 4, 3, C.c); // tail
    d.ell(36, 50 - br * .4, 13, 12, C.a);
    d.ear(26, 44, 7, 13, -1.1, C.a, '#f4c8b0'); d.ear(44, 40, 7, 13, .7, C.b, '#e0b098');
    d.ell(27, 56, 7, 5.5, C.c);
    d.nose(22, 55, 1.8);
    // sprout
    d.stroke([[37, 38], [38, 32], [37, 27]], C.h, 2);
    d.leaf(37, 27, 12, 4, -2.3 + d.s * .1, C.g); d.leaf(37, 28, 11, 4, -.8 - d.s * .1, C.g);
    d.eye(31, 49, 3.6, { col: C.e }); d.eye(41, 48, 3.3, { col: C.e });
    d.mouth(26, 60, 4, { cat: true }); d.cheek(33, 56, 2.5);
  }, { shift: 120, ow: 20 });
  // -------------------------------------------------------------- FAWNBLOOM
  def('fawnbloom', { a: '#c89868', b: '#8a6040', c: '#f6ecd6', g: '#5cbc4a', h: '#3a8a36', f: '#ff9ac8', e: '#3a2618' }, (d, C) => {
    const br = d.s * .8;
    shadow(d, 52, 89, 28);
    legs4(d, C.b, [[40, 64, 36, 88], [47, 66, 47, 89], [64, 66, 67, 88], [71, 63, 75, 87]], 5);
    d.ell(57, 58 - br * .3, 23, 13 + br * .3, C.a);
    d.ell(58, 67, 16, 5, C.c, { flat: true });
    for (const [x, y] of [[52, 50], [60, 52], [68, 49], [56, 56]]) d.ell(x, y, 2.3, 1.7, C.c, { flat: true });
    d.ell(78, 54, 4, 3.5, C.c);
    d.taper([[42, 56], [36, 46], [33, 38]], 13, 10, C.a); // neck
    d.ell(30, 34 - br * .4, 11.5, 10, C.a);
    d.ear(20, 32, 7, 12, -1.3, C.a, '#f4c8b0'); d.ear(39, 26, 7, 12, .9, C.b, '#e0b098');
    d.ell(21, 39, 7, 5, C.c); d.nose(16, 38, 1.8);
    // antlers with blossoms
    d.stroke([[28, 25], [26, 16], [21, 9]], C.h, 2.4); d.stroke([[26, 16], [31, 10]], C.h, 2);
    d.stroke([[34, 24], [38, 14], [44, 9]], C.h, 2.4); d.stroke([[38, 15], [36, 8]], C.h, 2);
    for (const [x, y] of [[21, 9], [31, 10], [44, 9], [36, 8]]) { d.circ(x, y, 3.2, C.f); d.dot(x, y, 1.1, '#fff4a0'); }
    d.leaf(26, 16, 7, 2.6, -2.8, C.g, { noVein: true }); d.leaf(39, 15, 7, 2.6, -.2, C.g, { noVein: true });
    d.eye(25, 33, 3, { col: C.e }); d.eye(34, 32, 2.8, { col: C.e });
    d.mouth(19, 43, 3.5, { cat: true });
  }, { shift: 120, ow: 24 });
  // ------------------------------------------------------------- SYLVANTLER
  def('sylvantler', { a: '#efe4c8', b: '#b8a482', c: '#ffffff', g: '#4cb84a', h: '#2e7a36', f: '#ff8ac0', k: '#fff08a', e: '#2a4a2a' }, (d, C) => {
    const br = d.s * .8;
    shadow(d, 54, 90, 32);
    legs4(d, C.b, [[40, 60, 35, 89], [47, 62, 46, 90], [67, 62, 70, 89], [74, 59, 79, 88]], 6);
    for (const x of [35, 46, 70, 79]) d.ell(x, 89, 3.5, 1.5, '#5a4a3a');
    d.ell(58, 54 - br * .3, 25, 14 + br * .3, C.a);
    // leaf mane along back
    for (let i = 0; i < 6; i++) d.leaf(40 + i * 7, 44 - Math.sin(i) * 2, 10, 3.5, -1.2 + i * .25, i % 2 ? C.g : C.h, { noVein: true });
    d.ell(59, 64, 17, 5, C.c, { flat: true });
    d.taper([[82, 48], [88, 44], [90, 38]], 7, 3, C.g); // leafy tail
    d.taper([[42, 52], [34, 40], [30, 32]], 14, 11, C.a);
    for (let i = 0; i < 4; i++) d.leaf(38 - i * 2, 50 - i * 5, 9, 3, 2.6, C.g, { noVein: true });
    d.ell(27, 28 - br * .4, 11.5, 10, C.a);
    d.ear(17, 27, 6.5, 11, -1.4, C.a, '#f4d0c0'); d.ear(36, 20, 6.5, 11, 1, C.b, '#e8c0b0');
    d.ell(18, 33, 7, 5, C.c); d.nose(13, 32, 1.8, '#3a3a3a');
    // grand antler crown
    const ant = (pts, w) => d.stroke(pts, C.h, w);
    ant([[24, 19], [19, 8], [10, 2]], 3); ant([[20, 10], [26, 1]], 2.4); ant([[15, 5], [8, 10]], 2);
    ant([[31, 18], [37, 7], [47, 2]], 3); ant([[36, 9], [33, 0]], 2.4); ant([[42, 4], [50, 9]], 2);
    for (const [x, y, s] of [[10, 2, 3.4], [26, 1, 3], [8, 10, 2.6], [47, 2, 3.4], [33, 0, 3], [50, 9, 2.6], [19, 8, 2.2], [37, 7, 2.2]]) { d.circ(x, y + 1, s, C.f); d.dot(x, y + 1, s * .35, C.k); }
    for (const [x, y] of [[16, 4], [42, 3], [29, 6]]) d.leaf(x, y, 6, 2.2, -1.6, C.g, { noVein: true });
    d.glow(30, 8, 16, 'rgba(255,240,180,.25)');
    d.eye(22, 27, 2.9, { col: C.e }); d.eye(31, 26, 2.7, { col: C.e });
    d.mouth(16, 37, 3.5, { flat: true });
  }, { shift: 150, keep: ['c'], ow: 28 });

  // ---------------------------------------------------------------- KINDLET
  def('kindlet', { a: '#f07a3a', b: '#c04a24', c: '#fff0d8', f: '#ffb040', k: '#fff070', e: '#3a1a10' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 88, 22);
    // tail with flame tip
    d.taper([[62, 80], [74, 72], [78, 58]], 7, 5, C.a);
    d.flame(78, 55, 7, C.f, C.k, { ph: 1 });
    d.ell(52, 70 - br * .4, 17, 15 + br * .4, C.a);
    d.ell(48, 76, 10, 9, C.c);
    d.paw(40, 86, 5, C.a); d.paw(55, 86, 5, C.a);
    d.ell(42, 48 - br * .6, 16, 14, C.a);
    d.ell(38, 55, 9, 6.5, C.c);
    d.ear(29, 38, 9, 14, -.5, C.a, '#ffc8a0'); d.ear(53, 36, 9, 14, .5, C.b, '#f0a880');
    d.flame(26, 24, 4.5, C.f, C.k, { lean: -.2 }); d.flame(56, 22, 4.5, C.f, C.k, { lean: .2, ph: 2 });
    // stripes
    d.stroke([[54, 40], [58, 44]], C.b, 2); d.stroke([[57, 50], [62, 52]], C.b, 2);
    d.eye(35, 47, 4.2, { col: '#8a4a10' }); d.eye(48, 46, 4, { col: '#8a4a10' });
    d.nose(38, 54, 1.8, '#6a2a1a'); d.mouth(38, 57, 5, { cat: true }); d.cheek(30, 54, 2.6);
  }, { shift: 200, ow: 20 });
  // --------------------------------------------------------------- PYROLYNX
  def('pyrolynx', { a: '#e8642e', b: '#a83a1c', c: '#ffe8cc', f: '#ff9a30', k: '#ffe060', t: '#2a1a14', e: '#3a1a10' }, (d, C) => {
    const br = d.s;
    shadow(d, 52, 89, 30);
    d.taper([[74, 58], [84, 50], [88, 38]], 8, 5, C.a); d.flame(88, 34, 7, C.f, C.k);
    legs4(d, C.b, [[38, 62, 34, 87], [45, 64, 45, 88], [64, 64, 66, 87], [72, 62, 76, 86]], 7);
    for (const x of [34, 45, 66, 76]) d.paw(x, 87, 4, C.a);
    d.ell(56, 57 - br * .3, 25, 12 + br * .3, C.a);
    d.ell(56, 65, 17, 4.5, C.c, { flat: true });
    for (const x of [58, 66, 73]) d.stroke([[x, 47], [x + 3, 52]], C.b, 2.2);
    // flame mane
    for (let i = 0; i < 5; i++) d.flame(40 + Math.cos(i * 1.2) * 10, 42 + Math.sin(i * 1.2) * 8, 6, C.f, C.k, { ph: i });
    d.ell(29, 39 - br * .5, 13, 12, C.a);
    d.ell(25, 45, 8, 5.5, C.c);
    d.ear(19, 30, 8, 14, -.55, C.a, '#ffc8a0'); d.ear(38, 27, 8, 14, .45, C.b, '#f0a880');
    d.stroke([[16, 17], [14, 12]], C.t, 2); d.stroke([[41, 14], [44, 10]], C.t, 2);
    d.eye(24, 38, 3.6, { col: '#e0a020', slit: true, angry: true, skin: C.a }); d.eye(34, 37, 3.3, { col: '#e0a020', slit: true, angry: true, skin: C.a });
    d.nose(21, 44, 1.8, '#5a1a10'); d.mouth(22, 47, 5, { fang: 1 });
  }, { shift: 200, ow: 26 });
  // --------------------------------------------------------------- SOLARYNX
  def('solarynx', { a: '#f0902a', b: '#b85a18', c: '#fff4d8', f: '#ffc040', k: '#fff6a0', g: '#ff5a9a', e: '#3a1a10' }, (d, C) => {
    const br = d.s;
    shadow(d, 54, 90, 32);
    // sun corona
    const rot = d.t * .4;
    d.glow(32, 30, 34, 'rgba(255,210,90,.35)');
    for (let i = 0; i < 12; i++) { const a = rot + i * Math.PI / 6; d.flame(32 + Math.cos(a) * 21, 30 + Math.sin(a) * 21, 5, C.f, C.k, { ph: i }); }
    d.taper([[76, 56], [86, 46], [90, 32]], 9, 5, C.a); d.flame(90, 28, 8, C.f, C.k);
    legs4(d, C.b, [[40, 60, 35, 88], [47, 62, 47, 89], [66, 62, 69, 88], [74, 60, 78, 87]], 7.5);
    for (const x of [35, 47, 69, 78]) d.paw(x, 88, 4.3, C.a);
    d.ell(58, 55 - br * .3, 26, 13 + br * .3, C.a);
    d.ell(58, 63, 18, 5, C.c, { flat: true });
    d.stroke([[62, 45], [66, 50]], C.b, 2.2); d.stroke([[70, 44], [73, 49]], C.b, 2.2);
    d.ell(31, 33 - br * .5, 14, 12.5, C.a);
    d.ell(27, 40, 8.5, 6, C.c);
    d.ear(20, 24, 8, 15, -.55, C.a, '#ffd0a0'); d.ear(41, 21, 8, 15, .45, C.b, '#f0b080');
    d.flame(17, 9, 3.5, C.f, C.k); d.flame(45, 6, 3.5, C.f, C.k);
    d.face(() => { d.star(31, 24, 3.4, C.g, 4, .5); d.dot(31, 24, 1, '#ffffff'); });
    d.eye(26, 33, 3.6, { col: '#d02a6a', angry: true, skin: C.a }); d.eye(37, 32, 3.3, { col: '#d02a6a', angry: true, skin: C.a });
    d.nose(23, 39, 1.8, '#5a1a10'); d.mouth(24, 42, 5, { flat: true });
  }, { shift: 180, ow: 28 });

  // ----------------------------------------------------------------- SEALET
  def('sealet', { a: '#8ab4dc', b: '#5a84b0', c: '#f4f8ff', n: '#2a2a3a', e: '#1a2a4a' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 88, 26);
    d.ell(70, 80, 10, 5, C.b, { rot: .3 }); d.ell(76, 84, 7, 3, C.b, { rot: -.2 }); // tail flippers
    d.ell(54, 70 - br * .5, 22, 16 + br * .5, C.a);
    d.ell(50, 78, 15, 8, C.c, { flat: true });
    d.ell(38, 82, 8, 4, C.b, { rot: -.4 }); d.ell(58, 84, 7, 3.5, C.b, { rot: .3 });
    d.ell(38, 54 - br * .6, 16, 14, C.a);
    for (const [x, y] of [[52, 60], [60, 66], [64, 58]]) d.dot(x, y, 1.6, C.b);
    d.ell(31, 60, 9, 6.5, C.c);
    d.nose(27, 57, 2.4, C.n);
    d.face(() => { for (const s of [-1, 1]) { d.line(24, 61, 16, 59 + s * 2, '#cfd8e8', .9); d.line(36, 61, 43, 59 + s * 2, '#cfd8e8', .9); } });
    d.eye(31, 50, 4.3, { col: C.e }); d.eye(43, 49, 4, { col: C.e });
    d.mouth(29, 62, 4, { cat: true }); d.cheek(24, 57, 2.4);
  }, { shift: 160, ow: 20 });
  // ------------------------------------------------------------- BRINEWHISK
  def('brinewhisk', { a: '#6a9ccc', b: '#3e6c9c', c: '#eef4ff', s: '#c8d0e0', n: '#1e2a3a', e: '#1a2a4a' }, (d, C) => {
    const br = d.s;
    shadow(d, 52, 89, 30);
    d.ell(74, 84, 12, 4.5, C.b, { rot: .15 });
    d.taper([[66, 82], [58, 60], [46, 44]], 30, 22, C.a);
    d.ell(50, 70, 13, 12, C.c, { flat: true });
    d.ell(36, 76, 10, 4, C.b, { rot: -.7 }); d.ell(60, 86, 9, 3.5, C.b);
    d.ell(38, 38 - br * .6, 14, 12.5, C.a);
    d.ell(32, 45, 9, 6.5, C.c);
    // small metal tusks
    d.taper([[29, 49], [28, 55], [30, 59]], 3, 1, C.s); d.taper([[36, 50], [36, 56], [38, 59]], 3, 1, C.s);
    d.nose(28, 42, 2.3, C.n);
    d.face(() => { d.line(24, 46, 15, 44, '#dfe8f4', .9); d.line(24, 47, 15, 48, '#dfe8f4', .9); d.line(40, 46, 47, 44, '#dfe8f4', .9); });
    d.eye(33, 35, 3.6, { col: C.e, angry: true, skin: C.a }); d.eye(44, 34, 3.4, { col: C.e, angry: true, skin: C.a });
    d.mouth(31, 48, 4, { flat: true });
  }, { shift: 160, ow: 24 });
  // --------------------------------------------------------------- TIDALRUS
  def('tidalrus', { a: '#3e6aa8', b: '#284a7a', c: '#dce8f8', s: '#c8d2e4', m: '#8a96ac', n: '#141c2a', e: '#e0f0ff' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 38);
    d.ell(80, 84, 12, 5, C.b, { rot: .2 });
    d.ell(52, 64 - br * .4, 34, 24 + br * .4, C.a);
    d.ell(48, 76, 26, 11, C.c, { flat: true });
    // armor plates on back
    for (let i = 0; i < 4; i++) d.ell(46 + i * 10, 42 + Math.abs(i - 1.5) * 2, 7, 5, C.m, { rot: -.3 + i * .2 });
    for (let i = 0; i < 4; i++) d.dot(46 + i * 10, 41 + Math.abs(i - 1.5) * 2, 1.2, '#e8eef8');
    d.ell(30, 82, 12, 5, C.b, { rot: -.3 }); d.ell(62, 86, 11, 4.5, C.b);
    d.ell(30, 44 - br * .6, 18, 15, C.a);
    d.ell(24, 53, 11, 7.5, C.c);
    // anchor tusks
    d.taper([[18, 57], [16, 70], [20, 80]], 5, 2, C.s); d.taper([[30, 58], [30, 71], [34, 80]], 5, 2, C.s);
    d.ell(20, 80, 4, 2, C.m, { rot: -.4 }); d.ell(35, 80, 4, 2, C.m, { rot: .4 });
    d.nose(19, 49, 2.8, C.n);
    d.face(() => { d.line(14, 54, 5, 52, '#e8eef8', 1); d.line(14, 56, 5, 57, '#e8eef8', 1); });
    d.eye(24, 40, 3.8, { col: '#1a3a6a', angry: true, skin: C.a }); d.eye(36, 38, 3.6, { col: '#1a3a6a', angry: true, skin: C.a });
    d.mouth(22, 57, 5, { frown: true });
  }, { shift: 130, keep: ['s', 'm'], ow: 30 });

  // ---------------------------------------------------------------- PIPWING
  def('pipwing', { a: '#a8764a', b: '#7a5234', c: '#fff0d8', k: '#f0b030', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 88, 18);
    d.stroke([[46, 80], [45, 87]], C.k, 2); d.stroke([[54, 80], [55, 87]], C.k, 2);
    d.taper([[62, 72], [72, 68], [78, 62]], 8, 3, C.b);
    d.ell(50, 68 - br * .5, 16, 15 + br * .5, C.a);
    d.ell(47, 74, 10, 8, C.c, { flat: true });
    d.wing(58, 64, 13, .6, C.b, { n: 3, flap: .08 });
    d.stroke([[46, 52], [44, 44], [48, 40]], C.b, 2.4); d.stroke([[50, 52], [52, 45]], C.b, 2);
    d.eye(42, 61, 3.6); d.eye(53, 60, 3.4);
    d.face(() => { d.tri(44, 66, 49, 66, 44, 71, C.k); d.tri(38, 66, 45, 64, 45, 69, C.k); });
    d.cheek(38, 66, 2.4);
  }, { shift: 180, ow: 18 });
  // --------------------------------------------------------------- GUSTLING
  def('gustling', { a: '#9a6a44', b: '#6a4630', c: '#f8ead0', k: '#f0a830', r: '#d8483a', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 89, 22);
    d.stroke([[46, 76], [44, 88]], C.k, 2.4); d.stroke([[54, 76], [56, 88]], C.k, 2.4);
    d.taper([[60, 66], [76, 64], [86, 58]], 10, 3, C.b); d.taper([[60, 68], [76, 70], [84, 70]], 7, 2, C.a);
    d.ell(52, 62, 16, 14, C.a);
    d.ell(48, 68, 10, 8, C.c, { flat: true });
    d.wing(56, 58, 22, .15, C.b, { n: 4, flap: .12 });
    d.ell(38, 44, 11, 10, C.a);
    d.taper([[42, 36], [50, 28], [58, 26]], 5, 1.5, C.r); d.taper([[42, 38], [52, 34], [58, 34]], 4, 1, C.r);
    d.eye(33, 42, 3.1, { angry: true, skin: C.a }); d.eye(42, 41, 2.9, { angry: true, skin: C.a });
    d.face(() => { d.tri(30, 46, 36, 45, 24, 50, C.k); d.tri(30, 48, 36, 48, 26, 51, G.col.dark(C.k, .2)); });
  }, { shift: 180, ow: 22 });
  // --------------------------------------------------------------- GALECLAW
  def('galeclaw', { a: '#8a5a3a', b: '#5a3a26', c: '#f8ecd8', k: '#f0b020', r: '#c83a2a', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 90, 30);
    // spread wings
    d.wing(50, 48, 42, -2.6, C.b, { n: 6, fan: .22, flap: .1 });
    d.wing(56, 50, 40, -.4, C.a, { n: 6, fan: .22, flap: -.1 });
    d.taper([[58, 70], [72, 80], [80, 86]], 12, 4, C.b);
    d.limb(46, 72, 42, 86, 3.5, C.k); d.limb(55, 72, 57, 86, 3.5, C.k);
    for (const x of [42, 57]) d.spikes(x, 87, 1, 3, 3, '#2a2226', 2.4, 1.6);
    d.ell(52, 60, 15, 16, C.a);
    d.ell(48, 64, 9, 11, C.c, { flat: true });
    d.ell(40, 38, 11, 10, C.a);
    for (let i = 0; i < 3; i++) d.taper([[46, 34 + i * 3], [58, 28 + i * 3], [66, 26 + i * 4]], 4, 1, i === 1 ? C.r : C.b);
    d.eye(34, 37, 3, { col: '#e0a020', angry: true, skin: C.a }); d.eye(43, 36, 2.8, { col: '#e0a020', angry: true, skin: C.a });
    d.face(() => { d.blob([[33, 42], [38, 40], [30, 50], [24, 47]], C.k); });
  }, { shift: 180, ow: 28 });

  // ----------------------------------------------------------------- NIBBIT
  def('nibbit', { a: '#9a78c8', b: '#6a4a98', c: '#f0e4ff', t: '#ffffff', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 48, 88, 18);
    d.stroke([[60, 80], [72, 78], [78, 70], [76, 62]], C.b, 2.6);
    d.ell(50, 72 - br * .4, 15, 13 + br * .4, C.a);
    d.ell(48, 78, 9, 7, C.c, { flat: true });
    d.paw(42, 85, 4, C.a); d.paw(54, 85, 4, C.a);
    d.ell(42, 56 - br * .5, 14, 12, C.a);
    d.circ(30, 46, 7, C.a); d.circ(30, 46, 4, '#f0b0d0'); d.circ(52, 43, 7, C.b); d.circ(52, 43, 4, '#e0a0c0');
    d.eye(37, 54, 3.6); d.eye(48, 53, 3.3);
    d.nose(36, 60, 1.8, '#e06a9a');
    d.face(() => { d.rect(34, 62, 6, 6, C.t, { r: 1, flat: true }); d.line(37, 62, 37, 68, '#c8c8d0', .8); });
    d.cheek(31, 60, 2.4);
  }, { shift: 90, ow: 18 });
  // ---------------------------------------------------------------- GNAWMAW
  def('gnawmaw', { a: '#6a4a98', b: '#402a68', c: '#d8c8f0', t: '#fffae8', e: '#e84a4a' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 89, 26);
    d.stroke([[66, 76], [80, 74], [86, 62], [82, 52]], C.b, 3.2);
    d.ell(54, 68 - br * .4, 20, 16 + br * .4, C.a);
    d.spikes(58, 62, 16, 5, 7, C.b, -2.4, 1.6);
    d.ell(50, 76, 12, 8, C.c, { flat: true });
    d.paw(40, 86, 5, C.a); d.paw(60, 86, 5, C.a);
    d.ell(38, 52 - br * .5, 17, 14, C.a);
    d.ear(28, 42, 9, 11, -.6, C.a, '#e0a0c0'); d.ear(50, 39, 9, 11, .6, C.b, '#c890b0');
    d.eye(31, 50, 3.4, { col: C.e, angry: true, skin: C.a }); d.eye(44, 49, 3.2, { col: C.e, angry: true, skin: C.a });
    d.face(() => { d.blob([[24, 58], [44, 58], [42, 66], [26, 66]], '#3a1a3a'); d.rect(29, 58, 5, 9, C.t, { r: 1, flat: true }); d.rect(35, 58, 5, 9, C.t, { r: 1, flat: true }); });
    d.nose(32, 55, 2, '#1e1a24');
  }, { shift: 100, ow: 24 });

  // ---------------------------------------------------------------- GRUBBIT
  def('grubbit', { a: '#8ad05a', b: '#5aa03a', c: '#ffe070', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 88, 24);
    for (let i = 4; i >= 1; i--) { const x = 42 + i * 9, y = 76 - Math.sin(i * .9 + d.t * 6.28) * 2; d.ell(x, y, 8.5, 8, i % 2 ? C.a : C.b); d.dot(x, y - 5, 1.8, C.c); d.ell(x, y + 7, 2, 1.4, '#3a6a2a'); }
    d.ell(36, 68 - br, 13, 12, C.a);
    d.stroke([[34, 57], [30, 48], [26, 46]], C.b, 1.6); d.stroke([[40, 57], [42, 48], [46, 46]], C.b, 1.6);
    d.dot(26, 46, 2, '#e84a4a'); d.dot(46, 46, 2, '#e84a4a');
    d.eye(31, 66, 3.2); d.eye(41, 66, 3);
    d.mouth(35, 73, 4, { open: .3 });
  }, { shift: 60, ow: 18 });
  // --------------------------------------------------------------- COCOONET
  def('cocoonet', { a: '#f4eef8', b: '#d0c4e0', c: '#b8f0ff', k: '#ffc8e8', e: '#1e1a24' }, (d, C) => {
    shadow(d, 48, 90, 16);
    d.stroke([[48, 0], [48, 20]], '#e8e0f0', 1.4);
    d.blob([[48, 18], [60, 30], [64, 52], [58, 76], [48, 86], [38, 76], [32, 52], [36, 30]], C.a);
    for (let i = 0; i < 6; i++) d.stroke([[34, 30 + i * 9], [48, 34 + i * 9], [62, 30 + i * 9]], C.b, 1.2);
    d.glow(48, 56, 16 + d.s * 3, 'rgba(200,240,255,.35)');
    d.stroke([[42, 48], [46, 52], [44, 58], [50, 62]], C.c, 1.6);
    d.face(() => { d.blob([[38, 40], [58, 40], [56, 48], [40, 48]], '#2a2230'); });
    d.eye(43, 44, 2.4, { tall: .8 }); d.eye(53, 44, 2.4, { tall: .8 });
  }, { shift: 200, ow: 20 });
  // ------------------------------------------------------------- AURORYMOTH
  def('aurorymoth', { a: '#f4e8ff', b: '#c8a8f0', w1: '#8af0e0', w2: '#c890ff', w3: '#ff9ad8', k: '#fff4a0', e: '#2a1a4a' }, (d, C) => {
    const f = d.s * .15;
    shadow(d, 48, 90, 20);
    const wing = (sx, rot, cols) => {
      d.c.save(); d.c.translate(48, 46); d.c.scale(sx, 1); d.c.rotate(rot + f);
      d.blob([[0, 0], [14, -26], [34, -34], [44, -20], [36, -4], [22, 4]], cols[0]);
      d.blob([[4, -2], [16, -20], [30, -26], [36, -16], [28, -4]], cols[1], { flat: true });
      d.dot(26, -16, 4, cols[2]); d.dot(26, -16, 2, C.k);
      d.blob([[0, 4], [20, 8], [30, 22], [22, 32], [8, 24]], cols[0]);
      d.dot(18, 18, 3, cols[2]);
      d.c.restore();
    };
    wing(-1, 0, [C.w2, C.w1, C.w3]); wing(1, 0, [C.w1, C.w2, C.w3]);
    d.ell(48, 58, 7, 16, C.b);
    for (let i = 0; i < 4; i++) d.ell(48, 62 + i * 5, 6.5 - i, 2, C.a, { flat: true });
    d.ell(48, 38, 10, 9, C.a);
    d.stroke([[44, 30], [38, 18], [32, 16]], C.b, 1.6); d.stroke([[52, 30], [58, 18], [64, 16]], C.b, 1.6);
    d.leaf(32, 16, 7, 2.5, 3.6, C.k, { noVein: true }); d.leaf(64, 16, 7, 2.5, -.5, C.k, { noVein: true });
    d.ell(48, 44, 9, 3, '#ffffff', { flat: true });
    d.eye(43, 37, 3.3, { col: C.e }); d.eye(53, 37, 3.3, { col: C.e });
    d.glow(48, 50, 30, 'rgba(200,255,240,.12)');
  }, { shift: 60, ow: 24 });
})();
