'use strict';
// ============================================================================
//  Species art, part 3
// ============================================================================
(function () {
  const M = G.MONDRAW, P = G.MONPAL;
  const def = (id, pal, fn, o = {}) => { P[id] = { c: pal, ...o }; M[id] = fn; };
  const shadow = (d, x, y, rx) => { d.c.fillStyle = 'rgba(0,0,0,.22)'; d.c.beginPath(); d.c.ellipse(x, y, rx, rx * .22, 0, 0, d.TAU); d.c.fill(); };
  const legs4 = (d, col, pts, w) => pts.forEach(([x0, y0, x1, y1], i) => d.limb(x0, y0, x1, y1, w, i % 2 ? G.col.dark(col, .12) : col));

  // ---------------------------------------------------------------- RASCOON
  def('rascoon', { a: '#8a8a94', b: '#5a5a64', c: '#f0eef0', k: '#2a2a34', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 88, 22);
    d.taper([[62, 76], [74, 70], [80, 58], [78, 48]], 11, 7, C.a);
    for (let i = 0; i < 3; i++) d.ell(G.lerp(66, 79, i / 2), G.lerp(74, 52, i / 2), 5, 2.2, C.k, { flat: true, rot: -1 + i * .3 });
    d.ell(52, 72 - br * .4, 15, 13 + br * .4, C.a);
    d.ell(50, 77, 9, 7, C.c, { flat: true });
    d.paw(42, 85, 4.5, C.b); d.paw(58, 85, 4.5, C.b);
    d.ell(40, 54 - br * .5, 15, 13, C.a);
    d.ear(30, 44, 8, 11, -.6, C.a, C.k); d.ear(50, 42, 8, 11, .6, C.b, C.k);
    d.face(() => { d.blob([[26, 52], [38, 48], [52, 50], [54, 56], [40, 56], [28, 58]], C.k); });
    d.ell(35, 60, 8, 5.5, C.c);
    d.eye(34, 53, 3.2, { sclera: '#ffffff' }); d.eye(45, 52, 3, { sclera: '#ffffff' });
    d.nose(30, 58, 2, C.k); d.mouth(32, 62, 4, { cat: true, fang: 1 });
  }, { shift: 30, ow: 20 });
  // -------------------------------------------------------------- BANDITOON
  def('banditoon', { a: '#6a6a78', b: '#40404c', c: '#e8e6ea', k: '#1e1e28', r: '#e84a4a', g: '#f4d040', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 26);
    d.taper([[62, 72], [78, 66], [86, 50], [82, 38]], 14, 9, C.a);
    for (let i = 0; i < 4; i++) d.ell(G.lerp(68, 84, i / 3), G.lerp(70, 42, i / 3), 6, 2.5, C.k, { flat: true, rot: -1 + i * .3 });
    d.limb(44, 72, 40, 88, 7, C.b); d.limb(56, 72, 60, 88, 7, C.b);
    d.ell(50, 62 - br * .4, 16, 17, C.a);
    d.ell(48, 66, 10, 11, C.c, { flat: true });
    // loot sack over shoulder
    d.limb(58, 50, 66, 40, 3, '#8a5a34'); d.circ(70, 36, 10, '#c89a5a'); d.dot(70, 34, 2.4, C.g);
    d.limb(40, 56, 30, 64, 6, C.a); d.circ(28, 66, 4.5, C.b);
    d.ell(44, 38 - br * .5, 15, 13, C.a);
    d.ear(34, 28, 8, 11, -.6, C.a, C.k); d.ear(54, 26, 8, 11, .6, C.b, C.k);
    d.face(() => { d.blob([[28, 36], [42, 32], [58, 34], [58, 40], [42, 40], [28, 42]], C.r); d.taper([[58, 37], [68, 40], [72, 46]], 3, 1.5, C.r); });
    d.ell(38, 44, 8, 5.5, C.c);
    d.eye(38, 37, 3, { angry: true, skin: C.r }); d.eye(49, 36, 2.8, { angry: true, skin: C.r });
    d.nose(33, 42, 2, C.k); d.mouth(36, 47, 5, { fang: 1 });
  }, { shift: 30, keep: ['g'], ow: 24 });
  // -------------------------------------------------------------- ARMADRILL
  def('armadrill', { a: '#8a92a4', b: '#5a6274', c: '#c8d0dc', s: '#d8b890', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 30);
    legs4(d, C.s, [[36, 74, 32, 88], [44, 76, 44, 89], [60, 76, 62, 88], [68, 74, 72, 87]], 6);
    d.ell(54, 64 - br * .4, 26, 20 + br * .3, C.a);
    for (let i = 0; i < 5; i++) { d.c.strokeStyle = C.b; d.c.lineWidth = 2; d.c.beginPath(); d.c.ellipse(54, 64, 26 - i * .5, 20, 0, Math.PI * (1.1 + i * .05), Math.PI * (1.9 - i * .05)); d.c.stroke(); }
    for (let i = 0; i < 5; i++) d.line(36 + i * 9, 48 + Math.abs(i - 2) * 2, 34 + i * 9, 80, C.b, 1.6);
    d.ell(46, 52, 7, 4, C.c, { flat: true, rot: -.4 });
    d.taper([[78, 72], [86, 74], [90, 70]], 6, 2, C.b);
    d.ell(28, 62 - br * .5, 12, 10, C.s);
    d.poly([[22, 58], [28, 50], [36, 56]], C.a);
    d.taper([[20, 64], [10, 66], [6, 64]], 5, 2, C.s);
    d.eye(24, 60, 2.6); d.eye(31, 59, 2.4);
    d.mouth(20, 68, 3, { flat: true });
    d.ear(30, 54, 4, 7, .3, C.s, '#f0c0a0');
  }, { shift: 40, ow: 24 });
  // ---------------------------------------------------------------- MAGMITE
  def('magmite', { a: '#5a4a4a', b: '#3a2e2e', c: '#ff8a3a', k: '#ffe070', e: '#ffe070' }, (d, C) => {
    shadow(d, 50, 90, 24);
    d.blob([[20, 88], [24, 76], [40, 66], [62, 64], [78, 72], [82, 88]], C.a);
    for (const [x, y] of [[36, 76], [56, 70], [70, 80], [48, 84]]) d.stroke([[x - 5, y - 2], [x, y + 2], [x + 5, y - 1]], C.c, 1.8);
    d.ell(30, 64 + d.s, 14, 13, C.a);
    d.blob([[18, 58], [26, 50], [36, 50], [42, 58], [34, 60]], C.c);
    d.flame(30, 48, 6, C.c, C.k);
    d.stroke([[24, 58], [18, 46], [16, 42]], C.b, 2); d.stroke([[34, 56], [38, 44], [40, 40]], C.b, 2);
    d.dot(16, 42, 2, C.k); d.dot(40, 40, 2, C.k);
    d.eye(26, 64, 3, { col: '#ff6a2a', sclera: C.k }); d.eye(35, 63, 2.8, { col: '#ff6a2a', sclera: C.k });
    d.mouth(28, 71, 4, { open: .3 });
    d.glow(40, 70, 26, 'rgba(255,140,40,.25)');
  }, { shift: 180, keep: ['k', 'e'], ow: 20 });
  // -------------------------------------------------------------- VOLCANOTH
  def('volcanoth', { a: '#4a3a3a', b: '#2a2020', c: '#ff7a2a', k: '#ffe070', r: '#8a6a5a', e: '#ffe070' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 91, 38);
    legs4(d, C.b, [[30, 76, 26, 89], [40, 78, 40, 90], [62, 78, 64, 89], [72, 76, 76, 88]], 10);
    d.poly([[16, 80], [30, 50], [42, 34], [60, 32], [74, 48], [86, 80]], C.a);
    for (const [x, y] of [[30, 66], [48, 58], [66, 64], [40, 76], [60, 78]]) d.stroke([[x - 6, y - 2], [x, y + 3], [x + 6, y - 1]], C.c, 2.2);
    // crater
    d.ell(51, 33, 12, 4, C.b); d.ell(51, 33, 9, 2.5, C.c);
    for (let i = 0; i < 3; i++) d.flame(46 + i * 5, 28 - Math.abs(i - 1) * 4, 5 + (i === 1 ? 3 : 0), C.c, C.k, { ph: i });
    // head
    d.ell(22, 62 - br * .5, 12, 11, C.a);
    d.eye(18, 60, 2.8, { col: '#ff6a2a', sclera: C.k, angry: true, skin: C.a }); d.eye(26, 59, 2.6, { col: '#ff6a2a', sclera: C.k, angry: true, skin: C.a });
    d.mouth(17, 67, 4, { flat: true, col: C.c });
    d.glow(51, 28, 26, 'rgba(255,140,40,.35)');
  }, { shift: 180, keep: ['k', 'e'], ow: 28 });
  // --------------------------------------------------------------- EMBERJAY
  def('emberjay', { a: '#e85a3a', b: '#a8342a', c: '#ffe0c8', k: '#f4b030', f: '#ffb040', y: '#fff070', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 88, 16);
    d.stroke([[46, 80], [45, 87]], C.k, 2); d.stroke([[54, 80], [55, 87]], C.k, 2);
    d.flame(72, 66, 7, C.f, C.y, { lean: .5 }); d.flame(76, 72, 5, C.f, C.y, { lean: .6, ph: 2 });
    d.taper([[60, 70], [70, 66], [74, 62]], 8, 3, C.b);
    d.ell(50, 68, 15, 13, C.a);
    d.ell(47, 72, 9, 7, C.c, { flat: true });
    d.wing(58, 64, 14, .5, C.b, { n: 3, flap: .12 });
    d.ell(40, 52, 11, 10, C.a);
    d.flame(42, 40, 5, C.f, C.y, { lean: .3 });
    d.eye(36, 51, 3.2); d.eye(45, 50, 3);
    d.face(() => { d.tri(30, 54, 36, 53, 24, 57, C.k); d.tri(30, 56, 36, 56, 26, 58, G.col.dark(C.k, .2)); });
  }, { shift: 200, keep: ['f', 'y'], ow: 18 });
  // ------------------------------------------------------------- CINDERWING
  def('cinderwing', { a: '#d84a2a', b: '#8a2a1e', c: '#ffd8b8', k: '#f4b030', f: '#ff9a30', y: '#fff070', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 90, 26);
    d.wing(46, 46, 36, -2.7, C.b, { n: 6, fan: .22, flap: .12 });
    d.wing(56, 48, 36, -.45, C.a, { n: 6, fan: .22, flap: -.12 });
    for (let i = 0; i < 4; i++) d.flame(72 + i * 5, 74 - i * 2, 6, C.f, C.y, { lean: .6, ph: i });
    d.limb(46, 74, 44, 87, 3, C.k); d.limb(55, 74, 57, 87, 3, C.k);
    d.ell(52, 62, 15, 16, C.a);
    d.ell(48, 66, 9, 10, C.c, { flat: true });
    d.ell(40, 40, 11, 10, C.a);
    for (let i = 0; i < 3; i++) d.flame(44 + i * 5, 30 - i * 2, 5 - i, C.f, C.y, { lean: .4, ph: i });
    d.eye(35, 39, 3, { col: '#f4b030', angry: true, skin: C.a }); d.eye(44, 38, 2.8, { col: '#f4b030', angry: true, skin: C.a });
    d.face(() => { d.blob([[32, 43], [38, 42], [28, 50], [24, 47]], C.k); });
    d.glow(60, 70, 24, 'rgba(255,160,60,.2)');
  }, { shift: 200, keep: ['f', 'y'], ow: 26 });
  // ----------------------------------------------------------------- CLAWDLE
  def('clawdle', { a: '#f07a4a', b: '#c04a2a', c: '#ffd8c0', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 88, 24);
    for (let i = 0; i < 3; i++) { d.limb(40 - i * 4, 76, 30 - i * 5, 86, 2.5, C.b); d.limb(60 + i * 4, 76, 70 + i * 5, 86, 2.5, C.b); }
    d.ell(50, 72 + d.s * .5, 18, 12, C.a);
    d.ell(46, 68, 6, 3.5, C.c, { flat: true, rot: -.3 });
    // big claw + small claw
    d.limb(36, 70, 24, 60, 4, C.b);
    d.blob([[10, 58], [18, 46], [30, 48], [30, 58], [22, 62]], C.a); d.blob([[12, 60], [18, 64], [26, 62], [22, 58]], C.b);
    d.limb(64, 70, 72, 62, 3, C.b); d.blob([[70, 60], [76, 54], [82, 58], [78, 64]], C.a);
    d.stroke([[44, 62], [42, 54]], C.b, 1.8); d.stroke([[54, 62], [56, 54]], C.b, 1.8);
    d.eye(42, 53, 3); d.eye(56, 53, 3);
    d.mouth(49, 74, 4, { flat: true });
  }, { shift: 180, ow: 18 });
  // ---------------------------------------------------------------- CRUSTANK
  def('crustank', { a: '#d85a3a', b: '#8a3424', c: '#e8d0b8', r: '#9a8a7a', m: '#6a5a4a', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 90, 34);
    for (let i = 0; i < 3; i++) { d.limb(36 - i * 5, 74, 22 - i * 6, 88, 4.5, C.b); d.limb(64 + i * 5, 74, 78 + i * 6, 88, 4.5, C.b); }
    d.ell(50, 64, 28, 20, C.a);
    // rock fortress shell
    d.poly([[26, 58], [32, 38], [44, 32], [58, 32], [70, 38], [76, 58], [64, 62], [38, 62]], C.r);
    for (const [x, y] of [[40, 42], [56, 40], [48, 52], [64, 52], [34, 52]]) d.poly([[x - 5, y + 3], [x - 3, y - 4], [x + 4, y - 4], [x + 5, y + 3]], C.m);
    d.limb(30, 66, 16, 54, 7, C.b);
    d.blob([[2, 50], [12, 34], [26, 38], [28, 52], [18, 58]], C.a); d.blob([[4, 54], [12, 60], [22, 58], [16, 52]], C.b);
    d.limb(70, 66, 82, 56, 7, C.b);
    d.blob([[74, 52], [84, 38], [96, 42], [94, 54], [86, 58]], C.a);
    d.eye(40, 66, 3.2, { angry: true, skin: C.a }); d.eye(58, 66, 3, { angry: true, skin: C.a });
    d.mouth(49, 74, 6, { frown: true });
  }, { shift: 180, keep: ['r', 'm'], ow: 26 });
  // ----------------------------------------------------------------- JELLUME
  def('jellume', { a: '#8ad0ff', b: '#4a90e0', c: '#f4fcff', k: '#fff070', e: '#1e1a24' }, (d, C) => {
    const fl = d.s * 3, w = d.s2 * 2;
    d.glow(48, 44 - fl, 36, 'rgba(160,230,255,.35)');
    for (let i = 0; i < 5; i++) d.taper([[34 + i * 7, 50 - fl], [30 + i * 8 + w, 66], [34 + i * 7 - w, 82], [30 + i * 8, 92]], 4, 1.5, i % 2 ? C.b : C.a, { hl: .2 });
    d.blob([[22, 48 - fl], [26, 30 - fl], [38, 20 - fl], [58, 20 - fl], [70, 30 - fl], [74, 48 - fl], [62, 52 - fl], [48, 50 - fl], [34, 52 - fl]], C.a, { hl: .45 });
    d.blob([[30, 40 - fl], [36, 28 - fl], [48, 24 - fl], [60, 28 - fl], [66, 40 - fl], [48, 36 - fl]], C.c, { flat: true });
    d.stroke([[40, 30 - fl], [44, 26 - fl], [42, 22 - fl], [46, 18 - fl]], C.k, 1.4);
    d.eye(40, 42 - fl, 3.2); d.eye(56, 42 - fl, 3.2);
    d.mouth(48, 47 - fl, 3, { cat: true });
  }, { shift: 280, ow: 22 });
  // ----------------------------------------------------------------- DUSKBAT
  def('duskbat', { a: '#5a3a7a', b: '#3a2250', c: '#c8a8e8', k: '#f4d040', e: '#1e1a24' }, (d, C) => {
    const fl = d.s * 3;
    d.batwing(40, 50 - fl, 30, -2.9, C.b, { flap: .3 }); d.batwing(56, 50 - fl, 30, -.25, C.a, { flap: -.3 });
    d.circ(48, 54 - fl, 13, C.a);
    d.ear(40, 44 - fl, 8, 14, -.4, C.a, C.c); d.ear(56, 44 - fl, 8, 14, .4, C.b, C.c);
    d.eye(43, 52 - fl, 3.4, { col: C.k }); d.eye(53, 52 - fl, 3.4, { col: C.k });
    d.mouth(48, 60 - fl, 4, { open: .3, fang: 2 });
    d.limb(44, 66 - fl, 42, 72 - fl, 2, C.b); d.limb(52, 66 - fl, 54, 72 - fl, 2, C.b);
  }, { shift: 160, ow: 20 });
  // --------------------------------------------------------------- NIGHTWING
  def('nightwing', { a: '#3a2458', b: '#22143a', c: '#9a78d0', k: '#f4d040', r: '#e84a6a', e: '#1e1a24' }, (d, C) => {
    const fl = d.s * 2;
    d.batwing(42, 40 - fl, 44, -2.8, C.b, { flap: .2 }); d.batwing(56, 40 - fl, 44, -.35, C.a, { flap: -.2 });
    d.taper([[50, 56 - fl], [52, 72], [48, 84]], 10, 2, C.a);
    d.ell(50, 48 - fl, 13, 15, C.a);
    d.ell(48, 52 - fl, 7, 9, C.c, { flat: true });
    d.circ(46, 30 - fl, 12, C.a);
    d.ear(38, 20 - fl, 7, 14, -.5, C.a, C.r); d.ear(54, 20 - fl, 7, 14, .5, C.b, C.r);
    d.eye(41, 29 - fl, 3, { col: C.k, angry: true, skin: C.a, slit: true }); d.eye(51, 28 - fl, 2.8, { col: C.k, angry: true, skin: C.a, slit: true });
    d.mouth(45, 36 - fl, 4, { open: .25, fang: 2 });
    d.limb(44, 62 - fl, 40, 70 - fl, 2.5, C.b); d.limb(54, 62 - fl, 58, 70 - fl, 2.5, C.b);
  }, { shift: 160, ow: 26 });
  // ---------------------------------------------------------------- SHROOMIE
  def('shroomie', { a: '#e84a4a', b: '#a82a2a', c: '#fff4e8', s: '#f4e8d0', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 88, 18);
    d.ell(50, 76, 11, 12, C.s);
    d.ell(42, 86, 5, 2.5, C.s); d.ell(58, 86, 5, 2.5, C.s);
    d.blob([[24, 64], [28, 48], [40, 40], [60, 40], [72, 48], [76, 64], [62, 66], [38, 66]], C.a);
    for (const [x, y, r] of [[38, 50, 4], [56, 46, 3.5], [66, 56, 3], [32, 60, 2.5], [48, 58, 2.5]]) d.circ(x, y, r, C.c, { flat: true });
    d.eye(45, 74, 3); d.eye(55, 74, 3);
    d.mouth(50, 80, 3.5, { cat: true }); d.cheek(40, 78, 2); d.cheek(60, 78, 2);
  }, { shift: 100, keep: ['c', 's'], ow: 16 });
  // ----------------------------------------------------------------- FUNGORE
  def('fungore', { a: '#c83a4a', b: '#8a2030', c: '#fff4e8', s: '#e8dcc0', g: '#c8ff5a', v: '#5aa04a', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 90, 30);
    d.limb(40, 76, 36, 89, 8, C.s); d.limb(60, 76, 64, 89, 8, C.s);
    d.ell(50, 66, 16, 18, C.s);
    d.limb(36, 62, 22, 72, 6, C.s); d.limb(64, 62, 78, 70, 6, C.s);
    d.leaf(20, 74, 9, 3, 2.4, C.v); d.leaf(80, 72, 9, 3, .6, C.v);
    d.blob([[10, 46], [18, 26], [36, 14], [64, 14], [82, 26], [90, 46], [70, 50], [30, 50]], C.a);
    for (const [x, y, r] of [[30, 30, 5], [52, 22, 4.5], [70, 32, 4], [42, 40, 3], [80, 42, 3], [20, 42, 3]]) { d.circ(x, y, r, C.c, { flat: true }); }
    for (let i = 0; i < 5; i++) d.dot(24 + i * 13, 54 + Math.sin(d.t * 6.28 + i) * 3, 1.5, C.g);
    d.eye(43, 62, 3, { angry: true, skin: C.s }); d.eye(56, 62, 3, { angry: true, skin: C.s });
    d.mouth(50, 70, 5, { fang: 1 });
    d.glow(50, 50, 30, 'rgba(200,255,90,.12)');
  }, { shift: 100, keep: ['c', 's', 'v'], ow: 26 });
  // ---------------------------------------------------------------- LILLIPAD
  def('lillipad', { a: '#6ac85a', b: '#3a9a3a', c: '#f4f8d0', p: '#8ad85a', f: '#ff9ad0', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 88, 20);
    d.ell(38, 84, 7, 3, C.b); d.ell(62, 84, 7, 3, C.b);
    d.ell(50, 72 - br * .5, 17, 13 + br * .5, C.a);
    d.ell(50, 78, 11, 6, C.c, { flat: true });
    // big eyes on top + lily pad hat
    d.circ(40, 56, 7, C.a); d.circ(60, 56, 7, C.a);
    d.eye(40, 56, 4.5); d.eye(60, 56, 4.5);
    d.blob([[26, 50], [34, 42], [50, 38], [66, 42], [74, 50], [62, 50], [50, 44], [38, 50]], C.p);
    d.line(50, 44, 50, 38, C.b, 1.4);
    d.circ(50, 38, 3.5, C.f); d.dot(50, 38, 1.4, '#fff4a0');
    d.mouth(50, 70, 10, { cat: true }); d.cheek(38, 68, 2.5); d.cheek(62, 68, 2.5);
  }, { shift: 120, ow: 18 });
  // ---------------------------------------------------------------- LILYKING
  def('lilyking', { a: '#4aa84a', b: '#2a7a34', c: '#f4f8d0', p: '#7ad05a', f: '#ff8ac0', g: '#f4d040', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 28);
    d.ell(36, 88, 9, 3, C.b); d.ell(64, 88, 9, 3, C.b);
    d.ell(50, 68 - br * .4, 22, 20, C.a);
    d.ell(50, 74, 14, 12, C.c, { flat: true });
    d.limb(30, 62, 18, 70, 6, C.a); d.limb(70, 62, 80, 54, 6, C.b);
    // staff
    d.line(84, 30, 80, 86, '#8a5a34', 2.6); d.circ(84, 28, 5, C.f); d.dot(84, 28, 2, C.g);
    d.circ(40, 44, 8, C.a); d.circ(60, 44, 8, C.a);
    d.eye(40, 44, 4.5, { angry: false }); d.eye(60, 44, 4.5);
    d.blob([[22, 38], [30, 28], [50, 24], [70, 28], [78, 38], [64, 40], [50, 32], [36, 40]], C.p);
    // flower crown
    for (let i = 0; i < 5; i++) { const a = -Math.PI + i * Math.PI / 4; d.ell(50 + Math.cos(a) * 8, 18 + Math.sin(a) * 4, 3.5, 6, C.f, { rot: a + Math.PI / 2 }); }
    d.circ(50, 18, 3, C.g);
    d.mouth(50, 58, 12, { cat: true });
  }, { shift: 120, keep: ['g'], ow: 24 });
  // ----------------------------------------------------------------- SNOOZLE
  def('snoozle', { a: '#8a6a4a', b: '#5a4230', c: '#e8d4b8', e: '#1e1a24' }, (d, C) => {
    const br = d.s * 1.5;
    shadow(d, 50, 88, 26);
    d.ell(50, 70 - br * .3, 26, 17 + br * .5, C.a);
    d.ell(50, 74, 18, 11 + br * .3, C.c, { flat: true });
    d.ell(30, 84, 7, 4, C.b); d.ell(70, 84, 7, 4, C.b);
    d.circ(38, 50, 14, C.a);
    d.circ(27, 40, 5, C.a); d.circ(27, 40, 2.8, C.b); d.circ(48, 38, 5, C.b); d.circ(48, 38, 2.8, '#3a2a1e');
    d.ell(34, 55, 8, 6, C.c);
    d.nose(31, 52, 2.2);
    d.eye(33, 48, 3, { closed: true }); d.eye(44, 47, 3, { closed: true });
    d.mouth(33, 58, 3, { cat: true });
    d.face(() => { d.ell(40, 60, 1.5, 2 + d.s, '#bfe8ff', { flat: true }); });
  }, { shift: 20, ow: 22 });
  // --------------------------------------------------------------- SLUMBRUIN
  def('slumbruin', { a: '#6a4e36', b: '#443224', c: '#e0c8a8', k: '#f4f4f0', e: '#1e1a24' }, (d, C) => {
    const br = d.s * 2;
    shadow(d, 50, 91, 40);
    d.ell(50, 64 - br * .3, 38, 28 + br * .5, C.a);
    d.ell(50, 70, 28, 20 + br * .4, C.c, { flat: true });
    d.ell(22, 86, 11, 6, C.b); d.ell(78, 86, 11, 6, C.b);
    for (const x of [16, 22, 28]) d.tri(x - 1.5, 90, x + 1.5, 90, x, 93, C.k);
    d.limb(16, 60, 10, 76, 12, C.a); d.limb(84, 60, 90, 76, 12, C.b);
    d.circ(50, 30, 18, C.a);
    d.circ(35, 16, 6, C.a); d.circ(35, 16, 3.5, C.b); d.circ(65, 16, 6, C.b); d.circ(65, 16, 3.5, '#3a2a1e');
    d.ell(50, 38, 11, 8, C.c);
    d.nose(50, 34, 3);
    d.eye(42, 28, 3.4, { closed: true }); d.eye(58, 28, 3.4, { closed: true });
    d.mouth(50, 42, 6, { cat: true });
    d.face(() => { d.star(74, 8, 3.2, '#bfe8ff'); d.star(82, 2, 2.2, '#bfe8ff'); });
  }, { shift: 20, ow: 30 });

  // ------------------------------------------------------ SHIFTAIL FAMILY
  const shiftBody = (d, C, o = {}) => {
    const br = d.s, wag = d.s2 * .08;
    shadow(d, 50, 89, o.big ? 28 : 22);
    const k = o.big ? 1.18 : 1;
    // great tail
    d.c.save(); d.c.translate(62, 72); d.c.rotate(wag); d.c.scale(k, k);
    d.blob([[0, 0], [10, -10], [22, -26], [26, -42], [18, -52], [8, -46], [4, -30], [-4, -12]], o.tail || C.a);
    d.blob([[16, -36], [22, -44], [18, -52], [10, -46]], o.tip || C.c, { flat: true });
    if (o.tailFx) o.tailFx(d);
    d.c.restore();
    const S = (x, y) => [50 + (x - 50) * k, 88 - (88 - y) * k];
    legs4(d, C.b, [[...S(40, 74), ...S(38, 87)], [...S(46, 75), ...S(46, 88)], [...S(56, 75), ...S(58, 87)], [...S(62, 74), ...S(64, 86)]], 5 * k);
    d.ell(...S(52, 70 - br * .4), 15 * k, 11 * k + br * .3, C.a);
    d.ell(...S(50, 75), 9 * k, 5 * k, C.c, { flat: true });
    if (o.collar) o.collar(d, S, k);
    d.ell(...S(38, 52 - br * .5), 14 * k, 13 * k, C.a);
    d.ear(...S(28, 42), 8 * k, 17 * k, -.45, C.a, o.earIn || C.c); d.ear(...S(46, 40), 8 * k, 17 * k, .45, C.b, o.earIn || C.c);
    d.ell(...S(33, 58), 8 * k, 6 * k, C.c);
    d.nose(...S(28, 57), 1.9 * k);
    d.eye(...S(33, 51), 3.6 * k, { col: C.e }); d.eye(...S(44, 50), 3.4 * k, { col: C.e });
    d.mouth(...S(30, 61), 3.5 * k, { cat: true }); d.cheek(...S(27, 58), 2.2);
    if (o.head) o.head(d, S, k);
  };
  def('shiftail', { a: '#c8905a', b: '#9a663a', c: '#fff0d8', e: '#4a2a18' }, (d, C) => shiftBody(d, C), { shift: 200, ow: 20 });
  def('emberail', { a: '#f06a3a', b: '#b8402a', c: '#ffe8a0', f: '#ffb040', y: '#fff070', e: '#6a1a10' }, (d, C) => shiftBody(d, C, {
    big: true, tip: C.f,
    tailFx: d => { d.flame(22, -50, 7, C.f, C.y); d.flame(12, -40, 5, C.f, C.y, { ph: 1 }); },
    collar: (d, S, k) => { for (let i = 0; i < 5; i++) d.flame(...S(34 + i * 4, 64 - Math.sin(i) * 2), 4 * k, C.c, '#ffffff', { ph: i }); },
    head: (d, S, k) => { d.flame(...S(38, 38), 5 * k, C.f, C.y); },
  }), { shift: 180, ow: 24 });
  def('tidetail', { a: '#5ab0e8', b: '#2a74b8', c: '#e8f8ff', f: '#8ae8f8', e: '#1a3a6a' }, (d, C) => shiftBody(d, C, {
    big: true, tip: C.f,
    tailFx: d => { d.poly([[14, -44], [30, -58], [26, -40]], C.b); d.poly([[6, -20], [18, -22], [10, -12]], C.b); },
    collar: (d, S, k) => { d.blob([[...S(28, 62)], [...S(38, 58)], [...S(48, 62)], [...S(40, 68)]], C.c); },
    head: (d, S, k) => { d.poly([S(30, 42), S(38, 26), S(44, 42)], C.b); },
    earIn: '#2a74b8',
  }), { shift: 60, ow: 24 });
  def('stormtail', { a: '#f4d040', b: '#c8982a', c: '#ffffff', z: '#6ad0ff', e: '#3a2a10' }, (d, C) => shiftBody(d, C, {
    big: true, tip: C.c,
    tailFx: d => { d.poly([[0, -10], [16, -20], [8, -22], [24, -40], [2, -26], [10, -24]], C.b); },
    collar: (d, S, k) => { d.spikes(...S(38, 64), 8 * k, 7, 6 * k, C.c, 1.2, 2.5); },
    head: (d, S, k) => { d.spikes(...S(38, 42), 9 * k, 5, 6 * k, C.a, -2.6, 1.6); d.stroke([S(60, 60), S(64, 56), S(62, 54), S(66, 50)], C.z, 1.4); },
  }), { shift: 200, ow: 24 });
  def('leaftail', { a: '#e8d8a0', b: '#b8a870', c: '#fff8e0', g: '#5ac04a', h: '#3a8a3a', e: '#3a2a10' }, (d, C) => shiftBody(d, C, {
    big: true, tail: C.g, tip: C.h,
    tailFx: d => { d.stroke([[-2, -10], [8, -22], [14, -36], [16, -48]], C.h, 1.6); },
    collar: (d, S, k) => { for (let i = 0; i < 4; i++) d.leaf(...S(36 + i * 5, 64), 7 * k, 2.5 * k, 1.2 + i * .3, C.g, { noVein: true }); },
    head: (d, S, k) => { d.leaf(...S(38, 42), 12 * k, 4 * k, -1.5, C.g); d.leaf(...S(26, 44), 9 * k, 3 * k, -2.4, C.h); d.leaf(...S(50, 42), 9 * k, 3 * k, -.6, C.h); },
    earIn: C.g,
  }), { shift: 60, ow: 24 });
  def('frosttail', { a: '#c8e8fa', b: '#8ab8e0', c: '#ffffff', i: '#8ad8f8', e: '#1a3a6a' }, (d, C) => shiftBody(d, C, {
    big: true, tip: C.i,
    tailFx: d => { d.spikes(18, -40, 4, 4, 7, C.i, -2.2, 2); },
    collar: (d, S, k) => { d.spikes(...S(38, 64), 6 * k, 6, 6 * k, C.i, .6, 2.2); },
    head: (d, S, k) => { d.spikes(...S(38, 40), 6 * k, 3, 8 * k, C.i, -2.2, 1.2); },
    earIn: C.i,
  }), { shift: 250, ow: 24 });
  def('lumitail', { a: '#f0c8f8', b: '#c898e0', c: '#fff8ff', g: '#ff5a9a', k: '#fff4a0', e: '#6a2a8a' }, (d, C) => shiftBody(d, C, {
    big: true, tip: C.k,
    tailFx: d => { d.glow(16, -46, 14, 'rgba(255,240,180,.5)'); },
    collar: (d, S, k) => { d.dot(...S(38, 66), 3 * k, C.g); },
    head: (d, S, k) => { d.face(() => { d.star(...S(37, 42), 3.4 * k, C.g, 4, .5); d.dot(...S(37, 42), 1, '#ffffff'); }); d.glow(...S(37, 42), 14 * k, 'rgba(255,120,200,.3)'); },
  }), { shift: 120, ow: 24 });
  def('umbratail', { a: '#2a2a3a', b: '#1a1a26', c: '#3a3a4e', r: '#f4d040', e: '#e84a4a' }, (d, C) => shiftBody(d, C, {
    big: true, tip: C.r,
    tailFx: d => { d.c.strokeStyle = C.r; d.c.lineWidth = 2; d.c.beginPath(); d.c.arc(14, -30, 4, 0, d.TAU); d.c.stroke(); },
    collar: (d, S, k) => { d.c.strokeStyle = C.r; d.c.lineWidth = 2; d.c.beginPath(); d.c.arc(...S(56, 66), 3.5 * k, 0, d.TAU); d.c.stroke(); },
    head: (d, S, k) => { d.c.strokeStyle = C.r; d.c.lineWidth = 2; d.c.beginPath(); d.c.arc(...S(36, 42), 3 * k, 0, d.TAU); d.c.stroke(); d.glow(...S(56, 66), 10, 'rgba(255,220,80,.3)'); },
    earIn: '#4a4a60',
  }), { shiny: { r: '#4ab0f4' }, ow: 24 });

  // ---------------------------------------------------------------- PTEROCK
  def('pterock', { a: '#9a90a8', b: '#6a6078', c: '#d8d0e0', k: '#e8e0d0', r: '#a88ab8', e: '#e84a4a' }, (d, C) => {
    shadow(d, 50, 90, 30);
    d.batwing(42, 40, 44, -2.7, C.b, { flap: .15 }); d.batwing(56, 42, 44, -.45, C.a, { flap: -.15 });
    d.taper([[58, 60], [74, 68], [88, 64]], 8, 2, C.a); d.poly([[86, 62], [94, 58], [90, 68]], C.b);
    d.limb(46, 64, 44, 86, 4, C.b); d.limb(54, 64, 56, 86, 4, C.b);
    d.ell(50, 52, 12, 15, C.a);
    d.ell(47, 56, 7, 9, C.c, { flat: true });
    d.taper([[46, 40], [38, 30], [34, 24]], 10, 8, C.a);
    d.blob([[10, 22], [26, 14], [40, 16], [42, 26], [30, 30], [14, 28]], C.a);
    d.poly([[34, 16], [46, 6], [42, 18]], C.r);
    d.face(() => { d.blob([[10, 24], [30, 26], [40, 26], [28, 32], [14, 30]], '#5a2a3a'); d.spikes(24, 26, 0, 4, 2.5, C.k, .6, 1.8, { w: .35 }); });
    d.eye(30, 20, 3, { col: C.e, angry: true, skin: C.a, slit: true });
  }, { shift: 150, ow: 28 });
  // --------------------------------------------------------------- RAPTORIX
  def('raptorix', { a: '#b87a4a', b: '#7a4a2a', c: '#f4d8b0', k: '#f4f0e0', s: '#6a8a3a', e: '#f4d040' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 32);
    d.taper([[62, 66], [78, 72], [92, 64], [96, 56]], 14, 3, C.a);
    for (let i = 0; i < 4; i++) d.tri(66 + i * 7, 64 - i, 70 + i * 7, 64 - i, 68 + i * 7, 58 - i, C.s);
    d.limb(52, 70, 46, 88, 9, C.b); d.limb(60, 70, 64, 88, 9, C.b);
    for (const x of [46, 64]) d.spikes(x, 88, 1, 3, 3, C.k, 2.6, 1.3);
    d.ell(52, 58 - br * .4, 18, 17, C.a);
    d.ell(48, 64, 10, 10, C.c, { flat: true });
    for (let i = 0; i < 4; i++) d.tri(40 + i * 7, 44 - i, 44 + i * 7, 44 - i, 42 + i * 7, 36 - i, C.s);
    d.limb(38, 58, 30, 64, 4, C.b); d.spikes(28, 65, 1, 2, 3, C.k, 1.8, .8);
    d.blob([[8, 38], [20, 26], [38, 26], [46, 36], [40, 46], [22, 48], [10, 46]], C.a);
    d.face(() => { d.blob([[8, 42], [26, 42], [40, 42], [30, 50], [12, 48]], '#5a1a1a'); d.spikes(22, 42, 0, 6, 3, C.k, .5, 2, { w: .3 }); });
    d.eye(28, 34, 3.2, { col: C.e, angry: true, skin: C.a, slit: true });
  }, { shift: 100, ow: 28 });
  // ----------------------------------------------------------------- STINGLE
  def('stingle', { a: '#f4d040', b: '#2a2a34', c: '#fff8d0', w: '#e8f8ff', e: '#1e1a24' }, (d, C) => {
    const fl = d.s * 3;
    shadow(d, 48, 90, 14);
    d.ell(38, 44 - fl, 9, 5, C.w, { rot: -.6 + d.s * .3, hl: .1 }); d.ell(58, 44 - fl, 9, 5, C.w, { rot: .6 - d.s * .3, hl: .1 });
    d.ell(48, 64 - fl, 9, 12, C.a);
    for (let i = 0; i < 3; i++) d.rect(40, 58 + i * 5 - fl, 16, 2.4, C.b, { flat: true });
    d.tri(45, 74 - fl, 51, 74 - fl, 48, 84 - fl, C.b);
    d.circ(48, 46 - fl, 9, C.a);
    d.stroke([[44, 38 - fl], [40, 30 - fl]], C.b, 1.4); d.stroke([[52, 38 - fl], [56, 30 - fl]], C.b, 1.4);
    d.eye(44, 46 - fl, 3, { angry: true, skin: C.a }); d.eye(52, 46 - fl, 3, { angry: true, skin: C.a });
    d.mouth(48, 51 - fl, 3, { flat: true });
  }, { shift: 280, ow: 18 });
  // ----------------------------------------------------------------- WASPEAR
  def('waspear', { a: '#f4c830', b: '#2a2a34', c: '#fff4c0', w: '#e0f4ff', k: '#e8e8f0', e: '#e84a4a' }, (d, C) => {
    const fl = d.s * 2;
    shadow(d, 50, 90, 22);
    d.ell(34, 34 - fl, 14, 7, C.w, { rot: -.7 + d.s * .2, hl: .1 }); d.ell(62, 34 - fl, 14, 7, C.w, { rot: .7 - d.s * .2, hl: .1 });
    d.ell(58, 66 - fl, 11, 15, C.a, { rot: -.5 });
    for (let i = 0; i < 3; i++) d.ell(56 + i * 3, 60 + i * 6 - fl, 10 - i, 2, C.b, { flat: true, rot: -.5 });
    d.taper([[64, 78 - fl], [72, 88], [74, 94]], 5, 1, C.b);
    d.ell(46, 46 - fl, 9, 10, C.a);
    // lance arms
    d.taper([[42, 50 - fl], [26, 44 - fl], [10, 38 - fl]], 5, 1, C.k); d.taper([[50, 52 - fl], [38, 60 - fl], [22, 66 - fl]], 5, 1, C.k);
    d.circ(44, 30 - fl, 9, C.a);
    d.stroke([[40, 22 - fl], [34, 12 - fl]], C.b, 1.6); d.stroke([[48, 22 - fl], [52, 12 - fl]], C.b, 1.6);
    d.eye(40, 30 - fl, 3.2, { col: C.e, angry: true, skin: C.a }); d.eye(48, 30 - fl, 3, { col: C.e, angry: true, skin: C.a });
  }, { shift: 280, ow: 24 });
  // ---------------------------------------------------------------- CHIMELLE
  def('chimelle', { a: '#f4d860', b: '#c8a030', c: '#fff8d8', r: '#ff8ab0', s: '#c8ccd8', e: '#6a3a1a' }, (d, C) => {
    const sw = d.s * .12;
    d.stroke([[48, 0], [48, 18]], C.s, 1.6);
    d.c.save(); d.c.translate(48, 18); d.c.rotate(sw);
    d.circ(0, 2, 4, C.s);
    d.blob([[-16, 40], [-14, 22], [-8, 8], [8, 8], [14, 22], [16, 40], [0, 44]], C.a, { hl: .45 });
    d.ell(0, 40, 16, 4, C.b);
    d.taper([[-10, 30], [-22, 36], [-28, 32]], 4, 2, C.r); d.taper([[10, 30], [22, 36], [28, 32]], 4, 2, C.r);
    d.circ(0, 46 + d.s * 2, 4, C.b);
    d.eye(-6, 24, 3.2, { col: C.e }); d.eye(6, 24, 3.2, { col: C.e });
    d.mouth(0, 31, 3, { cat: true }); d.cheek(-10, 29, 2); d.cheek(10, 29, 2);
    d.c.restore();
    d.face(() => { for (let i = 0; i < 3; i++) d.stroke([[70 + i * 4, 40 - i * 4], [74 + i * 4, 44 - i * 4]], '#fff4a0', 1.2); });
  }, { shift: 200, keep: ['s'], ow: 20 });
  // ------------------------------------------------------------------ MIREEL
  def('mireel', { a: '#5a8ac0', b: '#3a5a8a', c: '#e8e0c8', m: '#8a6a4a', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 90, 24);
    d.blob([[18, 90], [26, 84], [50, 82], [74, 84], [82, 90]], C.m);
    d.taper([[70, 86], [76, 72], [66, 62], [52, 66], [44, 76], [48, 86]], 12, 14, C.a);
    d.taper([[46, 74], [38, 60], [34, 48]], 16, 18, C.a);
    d.blob([[28, 60], [34, 50], [38, 60], [34, 72]], C.c, { flat: true });
    d.ell(34, 44, 13, 11, C.a);
    d.taper([[24, 40], [14, 36], [10, 40]], 3, 1, C.b); d.taper([[44, 38], [52, 32], [56, 36]], 3, 1, C.b);
    d.eye(29, 42, 3.2); d.eye(40, 41, 3);
    d.mouth(32, 50, 9, { cat: true });
  }, { shift: 140, keep: ['m'], ow: 20 });
  // ------------------------------------------------------------------ BOGMAW
  def('bogmaw', { a: '#3a6a9a', b: '#244a70', c: '#d8d0b0', m: '#6a5a3a', g: '#6a9a4a', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 36);
    d.blob([[8, 90], [20, 82], [50, 80], [80, 82], [92, 90]], C.m);
    d.ell(52, 66 - br * .4, 30, 20 + br * .4, C.a);
    d.ell(50, 74, 22, 10, C.c, { flat: true });
    d.ell(28, 84, 9, 4, C.b); d.ell(72, 84, 9, 4, C.b);
    d.blob([[20, 50], [30, 38], [50, 34], [70, 38], [80, 50], [70, 56], [30, 56]], C.a);
    d.blob([[36, 40], [44, 36], [52, 40], [44, 44]], C.g); d.blob([[62, 42], [70, 42], [66, 46]], C.g);
    d.circ(36, 38, 7, C.a); d.circ(62, 36, 7, C.a);
    d.eye(36, 38, 3.6, { tall: .8 }); d.eye(62, 36, 3.6, { tall: .8 });
    d.mouth(50, 52, 26, { cat: true, lw: 1.6 });
  }, { shift: 140, keep: ['m', 'g'], ow: 26 });
  // ---------------------------------------------------------------- ZIPSQUEE
  def('zipsquee', { a: '#f4d860', b: '#c8a030', c: '#fff8e0', m: '#e8c050', z: '#6ad0ff', e: '#1e1a24' }, (d, C) => {
    const fl = d.s * 3;
    shadow(d, 48, 90, 20);
    // gliding membrane
    d.blob([[18, 56 - fl], [30, 48 - fl], [66, 48 - fl], [78, 56 - fl], [66, 62 - fl], [48, 66 - fl], [30, 62 - fl]], C.m);
    d.taper([[58, 60 - fl], [72, 66 - fl], [82, 62 - fl], [88, 54 - fl]], 7, 4, C.a);
    d.ell(48, 56 - fl, 11, 9, C.a);
    d.ell(48, 60 - fl, 7, 5, C.c, { flat: true });
    d.circ(44, 40 - fl, 11, C.a);
    d.ear(36, 32 - fl, 7, 10, -.5, C.a, '#ffb0a0'); d.ear(52, 30 - fl, 7, 10, .5, C.b, '#e0a090');
    d.cheek(38, 45 - fl, 2.6, 'rgba(255,110,90,.8)');
    d.eye(40, 39 - fl, 3.4); d.eye(49, 38 - fl, 3.2);
    d.mouth(42, 46 - fl, 3, { cat: true });
    d.stroke([[70, 40 - fl], [73, 36 - fl], [71, 34 - fl], [75, 30 - fl]], C.z, 1.4);
  }, { shift: 180, ow: 20 });
  // ----------------------------------------------------------------- COFFRET
  def('coffret', { a: '#9a6a3a', b: '#6a4424', c: '#f4d040', k: '#c8ccd8', t: '#f4f0e0', e: '#e84a4a' }, (d, C) => {
    const open = (Math.sin(d.t * d.TAU) + 1) * .08;
    shadow(d, 50, 90, 28);
    d.rect(22, 56, 56, 32, C.a, { r: 3 });
    for (let i = 0; i < 3; i++) d.rect(22, 60 + i * 9, 56, 2, C.b, { flat: true });
    d.rect(24, 56, 4, 32, C.c, { flat: true }); d.rect(72, 56, 4, 32, C.c, { flat: true });
    d.face(() => { d.rect(26, 50, 48, 10, '#3a1020', { flat: true }); d.spikes(50, 55, 0, 7, 4, C.t, -2.9, 2.8, { w: .25 }); d.spikes(50, 55, 0, 7, 4, C.t, .3, 2.6, { w: .25 }); });
    d.c.save(); d.c.translate(22, 52); d.c.rotate(-.35 - open);
    d.blob([[0, 4], [0, -8], [16, -18], [40, -18], [56, -8], [56, 4]], C.a);
    d.rect(-1, 0, 58, 4, C.c, { flat: true }); d.rect(24, -8, 8, 10, C.k);
    d.c.restore();
    d.eye(40, 44, 3.2, { col: C.e, angry: true, skin: C.a, sclera: '#ffe070' }); d.eye(56, 42, 3, { col: C.e, angry: true, skin: C.a, sclera: '#ffe070' });
    d.glow(50, 50, 24, 'rgba(255,220,80,.25)');
  }, { shift: 200, keep: ['k', 't'], ow: 22 });
  // ---------------------------------------------------------------- ORRELUME
  def('orrelume', { a: '#3a6ad8', b: '#1e3a8a', c: '#e8f4ff', g: '#8af0ff', k: '#fff4a0', p: '#c890ff', e: '#fff4a0' }, (d, C) => {
    const w = d.s * 2, fl = d.s * 1.5;
    d.glow(50, 50, 48, 'rgba(120,220,255,.3)');
    // great body arcing across the frame
    d.taper([[92, 70], [84, 56], [70, 48], [52, 46], [34, 50]], 12, 36, C.a);
    d.blob([[80, 64], [70, 58], [50, 58], [34, 62], [40, 68], [60, 68]], C.c, { flat: true });
    // tail fluke
    d.blob([[88, 66], [98, 52], [96, 66], [100, 80], [90, 76]], C.b);
    // fins like auroral sails
    d.c.save(); d.c.translate(56, 58 + fl); d.c.rotate(.5 + d.s * .08);
    d.blob([[0, 0], [16, 12], [34, 30], [22, 34], [6, 20]], C.p, { hl: .5 }); d.c.restore();
    d.c.save(); d.c.translate(58, 42 - fl); d.c.rotate(-.9 - d.s * .08);
    d.blob([[0, 0], [18, -6], [36, -18], [28, -26], [10, -14]], C.g, { hl: .5 }); d.c.restore();
    // luminous spots
    for (const [x, y, r] of [[70, 50, 2.6], [78, 56, 2], [62, 48, 2.2], [54, 50, 1.8], [84, 60, 1.6]]) { d.dot(x, y, r, C.k); d.glow(x, y, r * 3, 'rgba(255,240,160,.4)'); }
    // head
    d.blob([[6, 50], [12, 34], [30, 26], [46, 32], [48, 50], [36, 62], [16, 62]], C.a);
    d.blob([[8, 54], [22, 58], [38, 58], [30, 64], [14, 62]], C.c, { flat: true });
    // crown of light
    for (let i = 0; i < 5; i++) { const a = -2.2 + i * .35; d.taper([[26 + Math.cos(a) * 6, 30 + Math.sin(a) * 6], [26 + Math.cos(a) * 16, 30 + Math.sin(a) * 16 - w]], 4, 1, C.g); }
    d.dot(26, 30, 3.5, C.k); d.glow(26, 30, 14, 'rgba(255,255,200,.5)');
    d.eye(20, 44, 3.4, { col: '#3a8ae0', sclera: C.e });
    d.mouth(12, 54, 8, { cat: true, col: C.b });
    // song notes / orbit lights
    for (let i = 0; i < 4; i++) { const a = d.t * d.TAU + i * 1.57; d.star(50 + Math.cos(a) * 40, 50 + Math.sin(a) * 26, 2.4, C.k, 4); }
  }, { shiny: { a: '#e8c850', b: '#a88020', c: '#fff8e0', g: '#ffd8a0', p: '#ff9ac8' }, ow: 32 });
  // ----------------------------------------------------------------- NYXALIS
  def('nyxalis', { a: '#1e1a34', b: '#0e0a1e', c: '#3a3460', s: '#c8b8ff', k: '#fff4c0', r: '#e84a8a', e: '#e84a8a' }, (d, C) => {
    const br = d.s;
    d.glow(50, 44, 50, 'rgba(120,90,220,.28)');
    // void wings
    d.batwing(42, 34, 50, -2.6, C.b, { flap: .1 }); d.batwing(58, 36, 50, -.5, C.a, { flap: -.1 });
    for (let i = 0; i < 9; i++) d.star(10 + i * 9, 20 + Math.sin(i * 1.7) * 14, 1.4, C.k, 4);
    d.taper([[60, 70], [78, 82], [92, 80], [96, 68]], 14, 3, C.a);
    d.star(96, 66, 4, C.s, 4);
    d.limb(46, 72, 40, 88, 9, C.b); d.limb(58, 72, 62, 88, 9, C.b);
    d.ell(52, 60 - br * .4, 18, 19, C.a);
    d.ell(48, 64, 10, 13, C.c, { flat: true });
    for (let i = 0; i < 4; i++) d.star(46 + i * 3, 56 + i * 5, 1.2, C.k, 4);
    d.taper([[48, 44], [40, 30], [36, 22]], 14, 11, C.a);
    d.blob([[16, 18], [28, 8], [44, 8], [52, 18], [44, 28], [24, 28]], C.a);
    d.taper([[40, 10], [50, -4], [60, -6]], 5, 1, C.s); d.taper([[32, 10], [30, -4], [36, -10]], 5, 1, C.s);
    d.eye(28, 17, 3.2, { col: C.e, angry: true, skin: C.a, slit: true, sclera: C.k }); d.eye(39, 16, 3, { col: C.e, angry: true, skin: C.a, slit: true, sclera: C.k });
    d.mouth(22, 24, 5, { open: .25, fang: 2 });
    d.c.strokeStyle = C.r; d.c.lineWidth = 1.6; d.c.beginPath(); d.c.arc(52, 58, 24 + br, -.6, .9); d.c.stroke();
  }, { shiny: { a: '#e8e4f8', b: '#b8b0d8', c: '#ffffff', s: '#3a3460', r: '#4ab0f4' }, ow: 32 });
})();
