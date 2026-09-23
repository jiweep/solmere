'use strict';
// ============================================================================
//  Species art, part 2
// ============================================================================
(function () {
  const M = G.MONDRAW, P = G.MONPAL;
  const def = (id, pal, fn, o = {}) => { P[id] = { c: pal, ...o }; M[id] = fn; };
  const shadow = (d, x, y, rx) => { d.c.fillStyle = 'rgba(0,0,0,.22)'; d.c.beginPath(); d.c.ellipse(x, y, rx, rx * .22, 0, 0, d.TAU); d.c.fill(); };
  const legs4 = (d, col, pts, w) => pts.forEach(([x0, y0, x1, y1], i) => d.limb(x0, y0, x1, y1, w, i % 2 ? G.col.dark(col, .12) : col));

  // ---------------------------------------------------------------- BEETLET
  def('beetlet', { a: '#3a6ad8', b: '#243e8a', c: '#9ac0ff', h: '#e8c030', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 88, 22);
    for (const [x, s] of [[36, -1], [48, 0], [60, 1]]) { d.limb(x, 76, x - 6 + s * 2, 87, 3, '#2a2a34'); d.limb(x + 4, 76, x + 8 + s * 2, 87, 3, '#1e1e28'); }
    d.ell(52, 68 + d.s * .5, 22, 15, C.a);
    d.line(52, 54, 52, 82, C.b, 1.6);
    d.ell(44, 62, 5, 3, C.c, { flat: true, rot: -.4 });
    d.ell(30, 68, 11, 10, '#2a2a3a');
    d.taper([[26, 60], [22, 48], [28, 40]], 6, 3, C.h);
    d.eye(25, 67, 3); d.eye(34, 66, 2.8);
    d.mouth(26, 74, 4, { flat: true });
  }, { shift: 140, ow: 18 });
  // ------------------------------------------------------------- SCARABRUTE
  def('scarabrute', { a: '#2a4aa8', b: '#182a6a', c: '#7aa8ff', h: '#f0c020', k: '#e8e8f0', e: '#e84a4a' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 30);
    d.limb(40, 70, 34, 88, 7, '#1e2238'); d.limb(60, 70, 64, 88, 7, '#1e2238');
    d.ell(34, 89, 6, 2.5, '#141626'); d.ell(64, 89, 6, 2.5, '#141626');
    d.ell(50, 56 - br * .4, 24, 22, C.a);
    d.line(50, 36, 50, 76, C.b, 2);
    d.ell(42, 46, 6, 4, C.c, { flat: true, rot: -.5 });
    // arms (fists)
    d.limb(28, 52, 18, 66, 8, '#1e2238'); d.circ(17, 68, 6.5, '#2a2e48');
    d.limb(72, 52, 80, 64, 8, '#1e2238'); d.circ(81, 66, 6.5, '#2a2e48');
    d.ell(48, 34, 13, 11, '#1e2238');
    // great horn
    d.taper([[46, 26], [40, 12], [30, 4], [24, 6]], 9, 3, C.h);
    d.taper([[40, 12], [44, 5]], 4, 1, C.h);
    d.eye(42, 34, 3.2, { col: C.e, angry: true, skin: '#1e2238' }); d.eye(53, 34, 3, { col: C.e, angry: true, skin: '#1e2238' });
    d.mouth(46, 41, 5, { frown: true, col: '#6a6a80' });
  }, { shift: 150, ow: 26 });
  // ---------------------------------------------------------------- VOLTPUP
  def('voltpup', { a: '#f4d040', b: '#c8982a', c: '#fff8e0', k: '#2a2a34', z: '#6ad0ff', e: '#1e1a24' }, (d, C) => {
    const br = d.s, wag = d.s2 * .25;
    shadow(d, 50, 88, 22);
    d.c.save(); d.c.translate(66, 68); d.c.rotate(wag);
    d.poly([[0, 0], [8, -6], [6, -2], [14, -10], [10, -1], [16, -4], [6, 4]], C.a); d.c.restore();
    legs4(d, C.b, [[40, 74, 38, 86], [46, 75, 46, 87], [58, 75, 60, 86], [64, 74, 66, 86]], 5);
    d.ell(52, 70 - br * .4, 17, 11 + br * .4, C.a);
    d.ell(52, 76, 11, 4, C.c, { flat: true });
    d.ell(38, 54 - br * .5, 14, 13, C.a);
    d.ear(28, 45, 9, 14, -.7, C.a, C.k); d.ear(47, 42, 9, 14, .6, C.b, C.k);
    d.ell(32, 60, 8, 6, C.c);
    d.nose(27, 58, 2.2, C.k);
    d.face(() => { d.circ(28, 62, 2.4, '#ff8a8a', { flat: true }); });
    d.eye(33, 52, 3.6); d.eye(44, 51, 3.4);
    d.mouth(31, 63, 4, { open: .35 });
    d.stroke([[58, 60], [61, 56], [59, 54], [63, 50]], C.z, 1.4);
  }, { shift: 200, ow: 20 });
  // ------------------------------------------------------------- STORMHOUND
  def('stormhound', { a: '#3a3a4a', b: '#24242e', c: '#f4d040', k: '#fff080', z: '#8ae0ff', e: '#f4d040' }, (d, C) => {
    const br = d.s;
    shadow(d, 52, 90, 32);
    d.poly([[74, 56], [88, 44], [84, 52], [94, 46], [86, 60], [76, 64]], C.c);
    legs4(d, C.b, [[38, 64, 34, 88], [45, 66, 45, 89], [64, 66, 67, 88], [71, 64, 75, 87]], 7);
    d.ell(56, 58 - br * .3, 25, 14 + br * .3, C.a);
    // lightning stripes
    for (const x of [50, 60, 70]) d.poly([[x, 46], [x + 4, 52], [x + 1, 53], [x + 5, 60], [x - 2, 52], [x + 1, 51]], C.c);
    // mane of crackling fur
    d.spikes(38, 44, 10, 7, 7, C.a, -2.8, 2.2);
    d.ell(28, 42 - br * .5, 13, 11.5, C.a);
    d.ear(18, 32, 8, 15, -.4, C.a, C.c); d.ear(36, 29, 8, 15, .45, C.b, C.c);
    d.ell(21, 48, 8, 5.5, '#4a4a5c');
    d.nose(16, 46, 2.2, '#101014');
    d.eye(22, 40, 3.4, { col: C.e, angry: true, skin: C.a }); d.eye(32, 39, 3.2, { col: C.e, angry: true, skin: C.a });
    d.mouth(20, 51, 5, { open: .3, fang: 2 });
    d.stroke([[42, 30], [46, 24], [43, 22], [48, 16]], C.z, 1.6); d.stroke([[70, 40], [74, 34], [71, 32], [76, 26]], C.z, 1.4);
    d.glow(40, 36, 14, 'rgba(150,230,255,.25)');
  }, { shift: 210, keep: ['c', 'k'], ow: 28 });
  // ---------------------------------------------------------------- MOSSBUN
  def('mossbun', { a: '#c8b48a', b: '#9a8660', c: '#f4ecd8', g: '#6ab850', h: '#4a9a3a', e: '#2a2018' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 88, 20);
    d.circ(66, 74, 6, C.c);
    d.ell(52, 72 - br * .4, 16, 13 + br * .4, C.a);
    d.blob([[40, 62], [48, 56], [58, 57], [66, 64], [60, 66], [50, 64], [42, 66]], C.g);
    for (let i = 0; i < 5; i++) d.dot(44 + i * 5, 60 + (i % 2), 1.6, C.h);
    d.ell(42, 84, 6, 3, C.a); d.ell(58, 85, 6, 3, C.b);
    d.ell(38, 58 - br * .5, 12, 11, C.a);
    d.ear(32, 48, 7, 22, -.25, C.a, '#f4c8b0'); d.ear(42, 47, 7, 22, .2, C.b, '#e0b098');
    d.leaf(37, 50, 8, 3, -1.9, C.g, { noVein: true });
    d.ell(33, 62, 7, 5, C.c);
    d.nose(29, 61, 1.6, '#e07a8a');
    d.eye(33, 56, 3.2, { col: C.e }); d.eye(42, 55, 3, { col: C.e });
    d.mouth(30, 65, 3, { cat: true }); d.cheek(27, 61, 2);
  }, { shift: 80, ow: 18 });
  // -------------------------------------------------------------- THORNHARE
  def('thornhare', { a: '#b8a070', b: '#8a744c', c: '#f4ecd8', g: '#4aa84a', h: '#2e7a36', k: '#e84a4a', e: '#2a2018' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 24);
    // legs in fighting stance
    d.limb(44, 66, 36, 88, 8, C.b); d.limb(56, 66, 64, 86, 8, C.a);
    d.ell(34, 89, 8, 3, C.b); d.ell(66, 88, 8, 3, C.a);
    d.stroke([[36, 80], [40, 74], [34, 70]], C.g, 1.8); d.stroke([[64, 78], [60, 72], [66, 70]], C.g, 1.8);
    d.ell(50, 56 - br * .4, 14, 16, C.a);
    d.ell(48, 62, 8, 9, C.c, { flat: true });
    // boxing arms wrapped in vines
    d.limb(40, 48, 28, 54, 6, C.a); d.circ(26, 55, 5.5, C.g); d.spikes(26, 55, 5, 4, 2.5, C.h, 0);
    d.limb(60, 48, 66, 40, 6, C.b); d.circ(67, 38, 5.5, C.g);
    d.ell(48, 32 - br * .5, 12, 11, C.a);
    d.ear(42, 22, 7, 20, -.35, C.a, '#f4c8b0'); d.ear(53, 21, 7, 20, .3, C.b, '#e0b098');
    d.rect(38, 26, 22, 3, C.k, { flat: true }); d.taper([[58, 27], [66, 30], [70, 36]], 3, 1.5, C.k);
    d.ell(44, 36, 6.5, 5, C.c);
    d.eye(43, 30, 3, { col: C.e, angry: true, skin: C.a }); d.eye(52, 30, 2.8, { col: C.e, angry: true, skin: C.a });
    d.nose(41, 35, 1.5, '#e07a8a'); d.mouth(43, 39, 3.5, { flat: true });
  }, { shift: 90, ow: 24 });
  // ----------------------------------------------------------------- BLOTCH
  def('blotch', { a: '#8a5ac0', b: '#5a3a88', c: '#c8a8f0', k: '#e8ff8a', e: '#1e1a24' }, (d, C) => {
    const w = d.s * 1.5;
    shadow(d, 50, 88, 22);
    d.blob([[30, 86], [26, 72], [32, 58], [44, 50 - w], [58, 52], [68, 62], [72, 76], [70, 86]], C.a);
    d.dot(24, 84, 4, C.a); d.dot(76, 86, 3, C.b); d.dot(56, 88, 3.5, C.a);
    d.ell(44, 60, 6, 4, C.c, { flat: true, rot: -.4 });
    d.dot(60, 72, 2.5, C.k); d.dot(38, 76, 2, C.k);
    d.eye(42, 66, 3.8); d.eye(55, 66, 3.6);
    d.mouth(48, 76, 6, { open: .3 });
  }, { shift: 100, ow: 18 });
  // ---------------------------------------------------------------- SLUDGOR
  def('sludgor', { a: '#6a3a98', b: '#42206a', c: '#b08ae0', k: '#c8ff5a', e: '#1e1a24' }, (d, C) => {
    const w = d.s * 2;
    shadow(d, 50, 90, 34);
    d.blob([[16, 88], [14, 70], [22, 50], [36, 32 - w], [52, 26 - w], [68, 34], [80, 52], [84, 72], [82, 88]], C.a);
    // drippy arms
    d.taper([[22, 58], [12, 68], [10, 80]], 10, 5, C.a); d.taper([[78, 58], [88, 66], [90, 78]], 10, 5, C.b);
    d.dot(10, 82, 4, C.a); d.dot(90, 80, 4, C.b);
    d.ell(36, 42, 8, 5, C.c, { flat: true, rot: -.5 });
    for (const [x, y, r] of [[60, 60, 3], [28, 70, 2.5], [70, 78, 2], [46, 34, 2]]) { d.dot(x, y, r, C.k); d.dot(x - r * .3, y - r * .3, r * .35, '#ffffff'); }
    d.eye(40, 52, 4.2, { angry: true, skin: C.a }); d.eye(56, 52, 4, { angry: true, skin: C.a });
    d.mouth(48, 66, 12, { open: .35, fang: 2 });
  }, { shift: 100, ow: 26 });
  // ---------------------------------------------------------------- GLIMMER
  def('glimmer', { a: '#ffe8f4', b: '#ffb8d8', c: '#fff8a0', g: '#ffd0e8', e: '#6a2a5a' }, (d, C) => {
    const fl = d.s * 3;
    shadow(d, 48, 90, 14);
    d.glow(48, 52 - fl, 26, 'rgba(255,230,160,.45)');
    d.wing(56, 50 - fl, 12, -.8, C.g, { n: 3, flap: .2 }); d.wing(40, 50 - fl, 12, -2.3, C.g, { n: 3, flap: -.2 });
    d.circ(48, 54 - fl, 14, C.a);
    d.star(48, 36 - fl, 6, C.c); d.stroke([[48, 40 - fl], [48, 44 - fl]], C.c, 1.4);
    d.ell(48, 68 - fl, 5, 4, C.b);
    d.eye(43, 53 - fl, 3.6, { col: C.e }); d.eye(53, 53 - fl, 3.6, { col: C.e });
    d.mouth(48, 60 - fl, 3, { cat: true }); d.cheek(40, 58 - fl, 2.2); d.cheek(56, 58 - fl, 2.2);
    for (let i = 0; i < 4; i++) { const a = d.t * 6.28 + i * 1.57; d.star(48 + Math.cos(a) * 22, 54 - fl + Math.sin(a) * 10, 2, C.c, 4); }
  }, { shift: 180, ow: 18 });
  // -------------------------------------------------------------- LUMINELLE
  def('luminelle', { a: '#fff0f8', b: '#ff9ac8', c: '#fff4a0', g: '#e8c8ff', r: '#8ae8ff', e: '#6a2a5a' }, (d, C) => {
    const fl = d.s * 2.5;
    shadow(d, 48, 90, 18);
    d.glow(48, 44 - fl, 36, 'rgba(255,220,240,.4)');
    // ribbons
    d.taper([[40, 60 - fl], [26, 70], [18, 84], [24, 90]], 5, 2, C.r); d.taper([[56, 60 - fl], [70, 70], [78, 84], [72, 90]], 5, 2, C.b);
    d.wing(58, 40 - fl, 20, -.7, C.g, { n: 4, flap: .15 }); d.wing(38, 40 - fl, 20, -2.4, C.g, { n: 4, flap: -.15 });
    // gown
    d.blob([[36, 52 - fl], [60, 52 - fl], [66, 78 - fl], [48, 84 - fl], [30, 78 - fl]], C.b);
    d.blob([[40, 54 - fl], [56, 54 - fl], [58, 72 - fl], [48, 76 - fl], [38, 72 - fl]], C.a, { flat: true });
    d.circ(48, 38 - fl, 12, C.a);
    d.blob([[36, 34 - fl], [40, 24 - fl], [48, 22 - fl], [56, 24 - fl], [60, 34 - fl], [54, 30 - fl], [42, 30 - fl]], C.b);
    d.star(48, 18 - fl, 6, C.c);
    d.eye(43, 39 - fl, 3.2, { col: C.e }); d.eye(53, 39 - fl, 3.2, { col: C.e });
    d.mouth(48, 45 - fl, 3, { cat: true }); d.cheek(40, 43 - fl, 2); d.cheek(56, 43 - fl, 2);
    for (let i = 0; i < 5; i++) { const a = d.t * 6.28 + i * 1.26; d.star(48 + Math.cos(a) * 30, 50 + Math.sin(a) * 14, 2.2, C.c, 4); }
  }, { shift: 160, ow: 24 });
  // ---------------------------------------------------------------- DIGMOLE
  def('digmole', { a: '#8a6a52', b: '#5a4232', c: '#f0c0b0', k: '#e8e0d0', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 88, 24);
    d.blob([[22, 88], [30, 80], [44, 76], [58, 76], [72, 80], [80, 88]], '#7a5a3a');
    for (const [x, y] of [[26, 84], [74, 84], [40, 80], [62, 80]]) d.dot(x, y, 2.5, '#9a7a5a');
    d.ell(50, 64 + d.s, 16, 17, C.a);
    d.ell(50, 70, 10, 9, '#a88a70', { flat: true });
    d.ell(34, 76, 7, 5, C.c, { rot: -.3 }); d.ell(66, 76, 7, 5, C.c, { rot: .3 });
    for (const x of [30, 34, 38]) d.tri(x - 1.5, 78, x + 1.5, 78, x - 2, 83, C.k);
    for (const x of [62, 66, 70]) d.tri(x - 1.5, 78, x + 1.5, 78, x + 2, 83, C.k);
    d.ell(44, 58, 7, 5, C.c);
    d.nose(40, 57, 3, '#e86a8a');
    d.eye(46, 51, 2, { tall: .6 }); d.eye(55, 51, 2, { tall: .6 });
    d.mouth(44, 62, 3, { cat: true });
  }, { shift: 160, ow: 18 });
  // -------------------------------------------------------------- TERRAMOLE
  def('terramole', { a: '#6a4e3a', b: '#443226', c: '#f0b8a0', k: '#c8ccd8', m: '#8a90a0', e: '#e84a4a' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 30);
    d.limb(40, 72, 36, 88, 9, C.b); d.limb(60, 72, 64, 88, 9, C.b);
    d.ell(50, 58 - br * .4, 22, 24, C.a);
    d.ell(50, 66, 14, 14, '#8a6a52', { flat: true });
    // drill claws
    const drill = (x, y, a) => { d.c.save(); d.c.translate(x, y); d.c.rotate(a); d.poly([[-6, 0], [6, 0], [0, 20]], C.k); for (let i = 1; i < 4; i++) d.line(-6 + i * 1.3, i * 4, 6 - i * 1.3, i * 4 + 3, C.m, 1.3); d.c.restore(); };
    d.limb(30, 54, 20, 60, 8, C.a); drill(18, 60, .5);
    d.limb(70, 54, 80, 58, 8, C.b); drill(82, 58, -.6);
    d.ell(42, 40, 9, 6, C.c);
    d.nose(36, 38, 3.4, '#e86a8a');
    d.face(() => { d.rect(40, 30, 20, 5, '#1e1a24', { r: 2, flat: true }); d.dot(45, 32, 1.4, C.e); d.dot(55, 32, 1.4, C.e); });
    d.mouth(42, 45, 4, { fang: 1 });
  }, { shift: 160, keep: ['k', 'm'], ow: 24 });
  // ---------------------------------------------------------------- PEBBLIN
  def('pebblin', { a: '#a8a49c', b: '#7a766e', c: '#cfcbc2', m: '#8a6a4a', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 88, 18);
    d.ell(50, 74 + d.s * .5, 16, 13, C.a);
    d.ell(44, 68, 5, 3, C.c, { flat: true, rot: -.4 });
    d.line(58, 66, 62, 74, C.b, 1.4); d.line(40, 78, 46, 80, C.b, 1.4);
    d.dot(60, 82, 3, C.m); d.dot(36, 70, 2, C.m);
    d.limb(38, 76, 32, 84, 4, C.b); d.limb(62, 76, 68, 84, 4, C.b);
    d.eye(44, 72, 2.8, { angry: true, skin: C.a }); d.eye(54, 72, 2.6, { angry: true, skin: C.a });
    d.mouth(48, 79, 4, { flat: true });
  }, { shift: 30, ow: 16 });
  // --------------------------------------------------------------- BOULDROK
  def('bouldrok', { a: '#9a9690', b: '#6a6660', c: '#c4c0b8', m: '#8a6a4a', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 90, 28);
    d.limb(36, 76, 30, 88, 7, C.b); d.limb(64, 76, 70, 88, 7, C.b);
    d.circ(50, 62 + d.s * .5, 24, C.a);
    for (const [x, y, r] of [[34, 48, 7], [66, 50, 6], [44, 38, 6], [62, 76, 5]]) d.circ(x, y, r, C.b);
    d.ell(42, 52, 7, 4, C.c, { flat: true, rot: -.4 });
    d.limb(28, 62, 16, 70, 8, C.b); d.circ(14, 72, 6, C.a);
    d.limb(72, 62, 84, 70, 8, C.b); d.circ(86, 72, 6, C.a);
    d.eye(44, 62, 3.2, { angry: true, skin: C.a }); d.eye(56, 62, 3, { angry: true, skin: C.a });
    d.mouth(50, 72, 7, { frown: true });
  }, { shift: 30, ow: 22 });
  // -------------------------------------------------------------- CRAGGOLEM
  def('craggolem', { a: '#8a8680', b: '#5a5650', c: '#b8b4ac', m: '#c89a5a', g: '#6aa84a', e: '#ffb040' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 36);
    d.limb(38, 72, 32, 88, 12, C.b); d.limb(62, 72, 68, 88, 12, C.b);
    d.poly([[20, 36], [40, 22], [62, 24], [80, 38], [84, 62], [72, 80], [28, 80], [16, 60]], C.a);
    for (const [x, y, w, h] of [[26, 40, 14, 10], [60, 34, 16, 10], [44, 60, 16, 12], [66, 60, 12, 10]]) d.poly([[x, y], [x + w, y - 2], [x + w + 2, y + h], [x - 1, y + h + 1]], C.b);
    d.blob([[36, 22], [44, 18], [56, 18], [64, 22], [56, 26], [44, 26]], C.g);
    d.limb(20, 46, 8, 66, 12, C.b); d.circ(8, 70, 9, C.a); d.limb(80, 46, 90, 64, 12, C.b); d.circ(90, 68, 9, C.a);
    d.ell(38, 38, 8, 4, C.c, { flat: true, rot: -.3 });
    d.face(() => { d.rect(34, 40, 30, 10, '#2a2622', { r: 3, flat: true }); });
    d.eye(42, 45, 3, { col: C.e, angry: true, skin: '#2a2622' }); d.eye(56, 45, 3, { col: C.e, angry: true, skin: '#2a2622' });
    d.dot(30, 70, 3, C.m); d.dot(70, 30, 2.5, C.m);
  }, { shift: 30, keep: ['g'], ow: 28 });
  // -------------------------------------------------------------- SCRAPMONK
  def('scrapmonk', { a: '#b87a4a', b: '#8a5230', c: '#f4d8b0', r: '#e84a4a', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 22);
    d.stroke([[60, 74], [72, 70], [78, 58], [74, 50], [68, 52]], C.b, 3);
    d.limb(44, 72, 40, 88, 6, C.b); d.limb(56, 72, 60, 88, 6, C.b);
    d.ell(50, 64 - br * .4, 13, 14, C.a);
    d.ell(48, 68, 8, 9, C.c, { flat: true });
    d.limb(40, 58, 28, 50, 5.5, C.a); d.circ(26, 48, 5, C.r); d.limb(60, 58, 70, 64, 5.5, C.b); d.circ(72, 65, 5, C.r);
    d.circ(48, 42 - br * .5, 13, C.a);
    d.circ(35, 42, 5, C.a); d.circ(35, 42, 3, C.c); d.circ(61, 41, 5, C.b); d.circ(61, 41, 3, C.c);
    d.ell(46, 46, 9, 7, C.c);
    d.rect(36, 32, 24, 3, C.r, { flat: true }); d.taper([[59, 33], [66, 36], [68, 42]], 3, 1.5, C.r);
    d.eye(43, 42, 3, { angry: true, skin: C.c }); d.eye(52, 42, 2.8, { angry: true, skin: C.c });
    d.mouth(46, 50, 5, { open: .25, fang: 1 });
  }, { shift: 150, ow: 20 });
  // -------------------------------------------------------------- GRANDMONK
  def('grandmonk', { a: '#a86a3a', b: '#7a4a26', c: '#f4dcb8', r: '#f4b030', p: '#c85ac8', w: '#f4f4f8', e: '#6a2a8a' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 30);
    d.stroke([[66, 78], [80, 76], [88, 64], [84, 54]], C.b, 3.5);
    d.ell(50, 84, 22, 7, C.r); // meditation cloth
    d.ell(50, 64 - br * .4, 18, 20, C.a);
    d.blob([[34, 54], [50, 50], [66, 54], [62, 80], [38, 80]], C.r, { hl: .2 });
    d.blob([[40, 56], [50, 54], [60, 56], [58, 66], [42, 66]], C.c, { flat: true });
    // prayer beads
    for (let i = 0; i < 9; i++) { const a = Math.PI * .1 + i * Math.PI * .1; d.dot(50 + Math.cos(a) * 14, 52 + Math.sin(a) * 10, 2.2, C.p); }
    d.limb(34, 58, 22, 44, 7, C.a); d.circ(20, 42, 6, C.c); d.limb(66, 58, 76, 42, 7, C.b); d.circ(78, 40, 6, C.c);
    d.circ(50, 36 - br * .5, 14, C.a);
    d.ell(48, 40, 10, 8, C.c);
    d.blob([[36, 26], [50, 20], [64, 26], [60, 30], [40, 30]], C.w);
    d.face(() => { d.dot(48, 28, 2.4, C.p); });
    d.eye(43, 37, 3, { closed: true }); d.eye(54, 37, 2.8, { closed: true });
    d.mouth(48, 45, 5, { flat: true });
    d.glow(50, 36, 26, 'rgba(220,150,255,.2)');
  }, { shift: 150, ow: 26 });
  // ---------------------------------------------------------------- FLOPFIN
  def('flopfin', { a: '#f08a4a', b: '#c85a2a', c: '#fff0d8', k: '#f4d040', e: '#1e1a24' }, (d, C) => {
    const flop = d.s * .25;
    shadow(d, 50, 90, 24);
    d.c.save(); d.c.translate(50, 70); d.c.rotate(flop);
    d.blob([[-26, 0], [-14, -14], [8, -16], [22, -8], [26, 0], [22, 8], [8, 14], [-14, 12]], C.a);
    d.poly([[22, 0], [38, -14], [34, 0], [38, 14]], C.b);
    d.blob([[-6, -14], [4, -26], [12, -14]], C.k);
    d.blob([[-2, 10], [8, 20], [12, 10]], C.k);
    d.ell(-6, 4, 14, 6, C.c, { flat: true });
    for (let i = 0; i < 3; i++) d.stroke([[2 + i * 6, -10], [6 + i * 6, -4], [2 + i * 6, 2]], C.b, 1.2);
    d.eye(-14, -4, 5, { look: .6, lookY: .5 });
    d.mouth(-24, 4, 6, { open: .45 });
    d.c.restore();
  }, { shift: 40, ow: 18 });
  // --------------------------------------------------------------- RIPTALON
  def('riptalon', { a: '#2a5ac8', b: '#18347a', c: '#f4f0d0', k: '#f4d040', f: '#e84a4a', e: '#f4d040' }, (d, C) => {
    const w = d.s * 2;
    // serpentine body coiling behind
    d.taper([[82, 90], [88, 70], [78, 56], [62, 60], [56, 74], [66, 84]], 18, 10, C.a);
    d.poly([[62, 86], [72, 96], [76, 82]], C.b);
    d.taper([[60, 72], [48, 58], [40, 40], [36, 24]], 20, 16, C.a);
    d.blob([[44, 72], [40, 56], [36, 40], [40, 42], [46, 58], [50, 70]], C.c, { flat: true });
    // dorsal fins
    for (let i = 0; i < 5; i++) d.poly([[58 - i * 5, 60 - i * 8], [70 - i * 4, 52 - i * 9 - w], [62 - i * 5, 64 - i * 8]], C.b);
    // head
    d.blob([[18, 20], [30, 10], [46, 12], [54, 22], [48, 32], [30, 34], [14, 30]], C.a);
    d.poly([[28, 10], [36, -2], [40, 12]], C.b); d.poly([[40, 12], [52, 2], [50, 16]], C.b);
    d.taper([[16, 30], [8, 38], [4, 50]], 4, 1, C.k); d.taper([[22, 33], [18, 42], [16, 52]], 3, 1, C.k);
    d.face(() => { d.blob([[12, 26], [30, 30], [44, 30], [30, 38], [14, 34]], '#6a1a2a'); d.spikes(28, 29, 0, 5, 3, '#ffffff', .6, 1.8, { w: .3 }); });
    d.eye(30, 20, 3.6, { col: C.e, angry: true, skin: C.a, slit: true });
  }, { shift: 160, shiny: { a: '#d83a3a', b: '#8a1a1a', c: '#fff0d0' }, ow: 30 });
  // --------------------------------------------------------------- GEARLING
  def('gearling', { a: '#a0a8b8', b: '#6a7284', c: '#e0e6f0', k: '#f4d040', e: '#6ad0ff' }, (d, C) => {
    const rot = d.t * Math.PI / 2;
    shadow(d, 50, 90, 16);
    const gear = (x, y, r, teeth, col, a) => { d.c.save(); d.c.translate(x, y); d.c.rotate(a); for (let i = 0; i < teeth; i++) { const an = i * d.TAU / teeth; d.c.save(); d.c.rotate(an); d.rect(-2.5, -r - 3, 5, 5, col); d.c.restore(); } d.circ(0, 0, r, col); d.circ(0, 0, r * .45, C.b); d.c.restore(); };
    gear(66, 62, 10, 8, C.b, -rot);
    gear(48, 60, 17, 10, C.a, rot);
    d.face(() => { d.circ(48, 60, 9, '#2a303a', { flat: true }); });
    d.eye(48, 60, 5, { col: C.e, sclera: '#2a303a' });
    d.stroke([[34, 44], [30, 38], [34, 34]], C.k, 1.6); d.stroke([[62, 44], [66, 38], [62, 34]], C.k, 1.6);
    d.glow(48, 60, 20, 'rgba(120,220,255,.2)');
  }, { shift: 40, keep: ['e'], ow: 18 });
  // --------------------------------------------------------------- DYNAMECH
  def('dynamech', { a: '#8a94a8', b: '#5a6276', c: '#d0d8e4', k: '#f4d040', e: '#6ad0ff' }, (d, C) => {
    const rot = d.t * Math.PI / 2;
    shadow(d, 50, 90, 26);
    const gear = (x, y, r, teeth, col, a) => { d.c.save(); d.c.translate(x, y); d.c.rotate(a); for (let i = 0; i < teeth; i++) { d.c.save(); d.c.rotate(i * d.TAU / teeth); d.rect(-3, -r - 4, 6, 6, col); d.c.restore(); } d.circ(0, 0, r, col); d.circ(0, 0, r * .4, C.b); d.c.restore(); };
    gear(24, 38, 11, 8, C.b, rot); gear(76, 38, 11, 8, C.b, -rot); gear(50, 78, 10, 8, C.b, rot);
    gear(50, 52, 22, 12, C.a, -rot * .7);
    d.circ(50, 52, 12, '#2a303a', { flat: true });
    d.eye(50, 52, 7, { col: C.e, sclera: '#2a303a' });
    for (const [x0, y0, x1, y1] of [[34, 44, 24, 38], [66, 44, 76, 38], [50, 70, 50, 78]]) d.stroke([[x0, y0], [(x0 + x1) / 2 + 3, (y0 + y1) / 2 - 3], [x1, y1]], C.k, 1.8);
    d.glow(50, 52, 30, 'rgba(120,220,255,.25)');
  }, { shift: 40, keep: ['e'], ow: 26 });
  // ---------------------------------------------------------------- WISPURR
  def('wispurr', { a: '#8a78c0', b: '#5a4a8a', c: '#e0d8ff', f: '#8ae8ff', e: '#f4f4a0' }, (d, C) => {
    const fl = d.s * 2;
    shadow(d, 50, 90, 16);
    d.taper([[56, 74 - fl], [66, 80], [74, 74], [76, 66]], 9, 2, C.a, { hl: .2 });
    d.blob([[36, 62 - fl], [56, 60 - fl], [62, 72 - fl], [58, 84], [52, 80], [46, 86], [40, 80], [34, 84], [32, 72 - fl]], C.a);
    d.ell(46, 48 - fl, 14, 12, C.a);
    d.ear(36, 40 - fl, 8, 12, -.5, C.a, C.b); d.ear(56, 38 - fl, 8, 12, .5, C.b, C.b);
    d.flame(76, 64, 4, C.f, '#ffffff');
    d.eye(41, 47 - fl, 3.6, { col: C.e, slit: true }); d.eye(52, 46 - fl, 3.4, { col: C.e, slit: true });
    d.mouth(45, 54 - fl, 4, { cat: true });
    d.face(() => { for (const s of [-1, 1]) { d.line(36, 53 - fl, 28, 52 - fl + s * 2, C.c, .8); } });
    d.glow(46, 60, 24, 'rgba(150,120,255,.2)');
  }, { shift: 120, ow: 20 });
  // ------------------------------------------------------------- PHANTOMANE
  def('phantomane', { a: '#4a3a6a', b: '#2a1e42', c: '#8a70c0', f: '#8ae8ff', k: '#c8a8ff', e: '#f4f4a0' }, (d, C) => {
    const br = d.s, fl = d.s2 * 2;
    shadow(d, 50, 90, 30);
    d.taper([[74, 58], [86, 50], [90, 40]], 8, 3, C.a); d.flame(90, 36, 6, C.f, '#ffffff');
    legs4(d, C.b, [[38, 64, 34, 86], [45, 66, 45, 87], [64, 66, 67, 86], [71, 64, 75, 85]], 7);
    for (const x of [34, 45, 67, 75]) d.flame(x, 88, 3.5, C.k, C.f);
    d.ell(56, 57 - br * .3, 24, 13 + br * .3, C.a);
    // shadow flame mane
    for (let i = 0; i < 8; i++) { const a = -2.6 + i * .42; d.flame(32 + Math.cos(a) * 16, 40 + Math.sin(a) * 14, 7, C.b, C.c, { ph: i, lean: Math.cos(a) * .3 }); }
    d.ell(28, 38 - br * .5, 12.5, 11, C.a);
    d.ear(18, 29, 7, 12, -.5, C.a, C.b); d.ear(36, 26, 7, 12, .45, C.b, C.b);
    d.eye(23, 38, 3.4, { col: C.e, slit: true, angry: true, skin: C.a }); d.eye(33, 37, 3.2, { col: C.e, slit: true, angry: true, skin: C.a });
    d.mouth(21, 46, 5, { open: .3, fang: 2 });
    d.glow(40, 50, 32, 'rgba(150,120,255,.22)');
  }, { shift: 150, ow: 28 });
  // --------------------------------------------------------------- MASKLING
  def('maskling', { a: '#f4f0e8', b: '#d8d0c0', c: '#e84a4a', k: '#3a8ae0', r: '#8a4ac8', e: '#1e1a24' }, (d, C) => {
    const fl = d.s * 3, tilt = d.s * .06;
    shadow(d, 48, 90, 14);
    d.c.save(); d.c.translate(48, 50 - fl); d.c.rotate(tilt);
    d.taper([[-10, 10], [-18, 26], [-12, 40]], 5, 1, C.r); d.taper([[10, 10], [18, 26], [12, 40]], 5, 1, C.k);
    d.blob([[-18, -18], [0, -24], [18, -18], [20, 4], [10, 18], [0, 22], [-10, 18], [-20, 4]], C.a);
    d.blob([[-14, -6], [-4, -12], [-2, -2], [-12, 0]], '#1e1a24'); d.blob([[14, -6], [4, -12], [2, -2], [12, 0]], '#1e1a24');
    d.dot(-8, -6, 2, '#ffe070'); d.dot(8, -6, 2, '#ffe070');
    d.stroke([[-10, 10], [0, 14], [10, 10]], C.c, 2);
    d.stroke([[-16, -14], [-6, -20]], C.c, 1.8); d.stroke([[16, -14], [6, -20]], C.k, 1.8);
    d.c.restore();
    d.glow(48, 50, 26, 'rgba(200,150,255,.2)');
  }, { shift: 180, keep: ['a', 'b'], ow: 20 });
  // ------------------------------------------------------------- MASQUERAIL
  def('masquerail', { a: '#f4f0e8', b: '#2a1e42', c: '#e84a4a', k: '#3a8ae0', g: '#f4d040', r: '#8a4ac8', e: '#1e1a24' }, (d, C) => {
    const fl = d.s * 2;
    shadow(d, 48, 90, 22);
    // robe of shadow
    d.blob([[30, 40 - fl], [66, 40 - fl], [74, 70], [66, 88], [58, 82], [50, 90], [42, 82], [34, 88], [24, 70]], C.b);
    d.taper([[30, 46 - fl], [16, 60], [10, 76]], 8, 3, C.b); d.taper([[66, 46 - fl], [80, 58], [86, 72]], 8, 3, C.b);
    // orbiting masks
    for (let i = 0; i < 3; i++) {
      const a = d.t * d.TAU + i * 2.1, x = 48 + Math.cos(a) * 34, y = 60 + Math.sin(a) * 10;
      d.c.save(); d.c.translate(x, y); d.blob([[-7, -7], [7, -7], [8, 3], [0, 9], [-8, 3]], C.a); d.dot(-3, -1, 1.6, '#1e1a24'); d.dot(3, -1, 1.6, '#1e1a24');
      d.stroke(i === 0 ? [[-3, 5], [0, 3], [3, 5]] : [[-3, 3], [0, 6], [3, 3]], [C.c, C.k, C.r][i], 1.2); d.c.restore();
    }
    // main mask
    d.blob([[34, 18 - fl], [48, 12 - fl], [62, 18 - fl], [64, 36 - fl], [56, 48 - fl], [48, 50 - fl], [40, 48 - fl], [32, 36 - fl]], C.a);
    d.spikes(48, 16 - fl, 6, 5, 8, C.g, -2.6, 2.1);
    d.blob([[37, 28 - fl], [45, 24 - fl], [46, 32 - fl], [38, 33 - fl]], '#1e1a24'); d.blob([[59, 28 - fl], [51, 24 - fl], [50, 32 - fl], [58, 33 - fl]], '#1e1a24');
    d.dot(42, 29 - fl, 2.2, '#ffe070'); d.dot(54, 29 - fl, 2.2, '#ffe070');
    d.stroke([[40, 40 - fl], [48, 44 - fl], [56, 40 - fl]], C.c, 2);
    d.glow(48, 40, 34, 'rgba(200,150,255,.2)');
  }, { shift: 180, keep: ['a'], ow: 26 });
  // --------------------------------------------------------------- PENGROST
  def('pengrost', { a: '#3a5a8a', b: '#243a5e', c: '#f4f8ff', k: '#f4a030', i: '#a8e8ff', e: '#1e1a24' }, (d, C) => {
    const br = d.s, flap = d.s2 * .2;
    shadow(d, 50, 90, 18);
    d.ell(42, 88, 6, 2.5, C.k); d.ell(56, 88, 6, 2.5, C.k);
    d.ell(50, 66 - br * .4, 17, 22, C.a);
    d.ell(48, 70, 12, 16, C.c, { flat: true });
    d.c.save(); d.c.translate(34, 58); d.c.rotate(.5 + flap); d.ell(0, 10, 5, 13, C.b); d.c.restore();
    d.c.save(); d.c.translate(66, 58); d.c.rotate(-.5 - flap); d.ell(0, 10, 5, 13, C.b); d.c.restore();
    d.circ(48, 42 - br * .5, 13, C.a);
    d.ell(46, 46, 9, 7, C.c);
    d.spikes(48, 32, 5, 3, 5, C.i, -2.2, 1.2);
    d.eye(43, 41, 3, { col: '#2a4a8a' }); d.eye(52, 40, 2.8, { col: '#2a4a8a' });
    d.face(() => { d.tri(42, 46, 50, 46, 44, 51, C.k); });
    d.cheek(39, 46, 2, 'rgba(255,150,180,.5)');
  }, { shift: 150, ow: 20 });
  // ------------------------------------------------------------- FROSTEMPER
  def('frostemper', { a: '#2a4878', b: '#18284a', c: '#f4f8ff', k: '#f4a030', i: '#a8e8ff', g: '#f4d040', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 26);
    d.ell(40, 88, 8, 3, C.k); d.ell(60, 88, 8, 3, C.k);
    d.ell(50, 62 - br * .4, 22, 26, C.a);
    d.ell(48, 66, 15, 20, C.c, { flat: true });
    // ice gauntlets
    d.limb(30, 52, 20, 44, 8, C.b); d.poly([[10, 36], [22, 34], [28, 44], [18, 52], [8, 46]], C.i);
    d.limb(70, 52, 78, 62, 8, C.b); d.poly([[72, 60], [86, 58], [90, 70], [78, 76], [70, 70]], C.i);
    d.circ(48, 32 - br * .5, 15, C.a);
    d.ell(46, 37, 10, 8, C.c);
    // crown of ice
    d.spikes(48, 20, 6, 5, 8, C.i, -2.5, 1.9);
    d.dot(48, 20, 2.4, C.g);
    d.eye(42, 31, 3.1, { col: '#2a4a8a', angry: true, skin: C.a }); d.eye(53, 30, 2.9, { col: '#2a4a8a', angry: true, skin: C.a });
    d.face(() => { d.tri(41, 36, 50, 36, 44, 42, C.k); });
    d.glow(20, 44, 12, 'rgba(180,240,255,.3)');
  }, { shift: 150, keep: ['i'], ow: 26 });
  // ----------------------------------------------------------------- ICICUB
  def('icicub', { a: '#f4f8ff', b: '#c8d8ea', c: '#a8e0f8', n: '#3a4a6a', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 88, 22);
    d.ell(52, 72 - br * .4, 19, 15 + br * .4, C.a);
    d.paw(40, 85, 5.5, C.a); d.paw(58, 85, 5.5, C.b);
    d.circ(40, 52 - br * .5, 15, C.a);
    d.circ(28, 42, 5.5, C.a); d.circ(28, 42, 3, C.b); d.circ(51, 39, 5.5, C.b); d.circ(51, 39, 3, '#b0c4da');
    d.ell(34, 58, 8, 6, C.b);
    d.nose(30, 55, 2.6, C.n);
    d.face(() => { d.taper([[32, 60], [32, 66], [31, 70]], 2.4, .8, C.c); });
    d.eye(34, 50, 3, { col: '#2a4a8a' }); d.eye(45, 49, 2.8, { col: '#2a4a8a' });
    d.mouth(31, 61, 3, { cat: true }); d.cheek(27, 56, 2.2);
    d.spikes(58, 60, 12, 3, 4, C.c, -2, 1.1);
  }, { shift: 30, ow: 20 });
  // -------------------------------------------------------------- GLACIURSA
  def('glaciursa', { a: '#eaf2fc', b: '#b8cce2', c: '#8ad0f0', k: '#5a4a3a', n: '#2a3a5a', e: '#1e1a24' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 90, 38);
    legs4(d, C.b, [[34, 70, 30, 88], [42, 72, 42, 89], [66, 72, 68, 88], [74, 70, 78, 87]], 11);
    d.ell(56, 60 - br * .3, 32, 22 + br * .3, C.a);
    // glacier slab on back
    d.poly([[34, 44], [44, 26], [56, 34], [64, 20], [76, 32], [84, 26], [88, 48], [40, 50]], C.c);
    d.poly([[46, 34], [50, 30], [54, 40]], '#e0f8ff'); d.poly([[68, 30], [72, 26], [74, 36]], '#e0f8ff');
    d.ell(28, 46 - br * .5, 17, 15, C.a);
    d.circ(17, 34, 5, C.a); d.circ(38, 32, 5, C.b);
    d.ell(19, 53, 10, 7, C.b);
    d.nose(13, 50, 3, C.n);
    d.eye(22, 44, 2.8, { col: '#2a4a8a', angry: true, skin: C.a }); d.eye(33, 43, 2.6, { col: '#2a4a8a', angry: true, skin: C.a });
    d.mouth(17, 58, 5, { open: .25, fang: 2 });
    for (const x of [30, 42, 68, 78]) for (let i = -1; i <= 1; i++) d.tri(x + i * 2.5 - 1, 89, x + i * 2.5 + 1, 89, x + i * 2.5, 92, C.k);
  }, { shift: 30, ow: 30 });
  // ---------------------------------------------------------------- SNOWLET
  def('snowlet', { a: '#ffffff', b: '#d8ecfa', c: '#a8d8f8', k: '#e8a8ff', e: '#3a3a8a' }, (d, C) => {
    const fl = d.s * 3;
    shadow(d, 48, 90, 12);
    d.glow(48, 54 - fl, 22, 'rgba(200,240,255,.4)');
    // crystal skirt
    for (let i = 0; i < 6; i++) { const a = Math.PI * .15 + i * Math.PI * .14; d.tri(48, 60 - fl, 48 + Math.cos(a) * 16 - 3, 60 - fl + Math.sin(a) * 16, 48 + Math.cos(a) * 18 + 3, 60 - fl + Math.sin(a) * 18, i % 2 ? C.b : C.c); }
    d.circ(48, 50 - fl, 12, C.a);
    d.star(48, 34 - fl, 6, C.c, 6, .5);
    d.eye(43, 50 - fl, 3.2, { col: C.e }); d.eye(53, 50 - fl, 3.2, { col: C.e });
    d.mouth(48, 57 - fl, 3, { cat: true }); d.cheek(40, 55 - fl, 2, 'rgba(255,150,200,.55)'); d.cheek(56, 55 - fl, 2, 'rgba(255,150,200,.55)');
  }, { shift: 280, ow: 18 });
  // -------------------------------------------------------------- AURORELLE
  def('aurorelle', { a: '#ffffff', b: '#c8e8fa', c: '#8ad8f8', r: '#a8f0d0', p: '#e0a8ff', k: '#fff4a0', e: '#3a3a8a' }, (d, C) => {
    const fl = d.s * 2.5, wv = d.s2;
    shadow(d, 48, 90, 20);
    d.glow(48, 44, 40, 'rgba(180,255,230,.25)');
    // aurora gown ribbons
    for (let i = 0; i < 4; i++) d.taper([[48, 50 - fl], [30 + i * 12 + wv * 3, 70], [20 + i * 18 - wv * 4, 90]], 10, 3, [C.r, C.c, C.p, C.r][i], { hl: .1 });
    d.blob([[38, 44 - fl], [58, 44 - fl], [62, 62 - fl], [48, 68 - fl], [34, 62 - fl]], C.b);
    d.taper([[38, 46 - fl], [24, 54 - fl], [16, 50 - fl]], 5, 2, C.a); d.taper([[58, 46 - fl], [72, 54 - fl], [80, 50 - fl]], 5, 2, C.a);
    d.circ(48, 32 - fl, 12, C.a);
    d.blob([[34, 30 - fl], [40, 18 - fl], [48, 14 - fl], [56, 18 - fl], [62, 30 - fl], [56, 24 - fl], [40, 24 - fl]], C.c);
    d.star(48, 12 - fl, 5, C.k, 6, .5);
    d.eye(43, 32 - fl, 3, { col: C.e }); d.eye(53, 32 - fl, 3, { col: C.e });
    d.mouth(48, 39 - fl, 3, { cat: true });
    for (let i = 0; i < 4; i++) { const a = d.t * 6.28 + i * 1.57; d.star(48 + Math.cos(a) * 32, 52 + Math.sin(a) * 12, 2, C.a, 6); }
  }, { shift: 300, ow: 24 });
  // --------------------------------------------------------------- NIMBLING
  def('nimbling', { a: '#8ab8f8', b: '#5a84d0', c: '#ffffff', k: '#f4f8ff', e: '#1e1a24' }, (d, C) => {
    const fl = d.s * 3;
    shadow(d, 50, 90, 18);
    // cloud base
    for (const [x, y, r] of [[36, 76, 9], [48, 80, 10], [60, 76, 9], [42, 70, 8], [56, 70, 8]]) d.circ(x, y - fl * .5, r, C.k, { hl: .15, sh: .12 });
    d.taper([[58, 60 - fl], [70, 56], [76, 48], [72, 42]], 9, 3, C.a);
    d.ell(50, 58 - fl, 14, 13, C.a);
    d.ell(48, 62 - fl, 8, 7, C.c, { flat: true });
    d.circ(42, 42 - fl, 13, C.a);
    d.taper([[46, 32 - fl], [52, 22 - fl], [56, 18 - fl]], 4, 1.5, C.c); d.taper([[38, 32 - fl], [36, 22 - fl], [38, 16 - fl]], 4, 1.5, C.c);
    d.wing(56, 50 - fl, 10, -1.2, C.b, { n: 3, flap: .2 });
    d.eye(37, 42 - fl, 3.6); d.eye(48, 41 - fl, 3.4);
    d.mouth(38, 49 - fl, 4, { cat: true }); d.cheek(32, 47 - fl, 2.2);
  }, { shift: 200, keep: ['k'], ow: 20 });
  // ------------------------------------------------------------- STRATOWYRM
  def('stratowyrm', { a: '#6a9ae8', b: '#3a64b8', c: '#f4f8ff', k: '#ffffff', g: '#f4d040', e: '#1e1a24' }, (d, C) => {
    const w = d.s * 2;
    // long coiling body in mist
    for (const [x, y, r] of [[18, 82, 10], [34, 86, 11], [60, 86, 11], [80, 82, 10]]) d.circ(x, y, r, C.k, { hl: .1, sh: .1 });
    d.taper([[84, 76], [86, 60], [72, 52], [56, 60], [50, 74], [36, 76], [28, 62], [30, 44], [34, 30]], 8, 16, C.a);
    d.blob([[32, 62], [28, 48], [32, 34], [36, 36], [32, 48], [36, 60]], C.c, { flat: true });
    for (let i = 0; i < 6; i++) { const t = i / 6; d.spikes(G.lerp(80, 36, t), G.lerp(58, 56, t) - Math.sin(t * 6) * 6 - 6, 0, 1, 5, C.c, -1.57, 0, { w: .5 }); }
    d.blob([[18, 26], [28, 16], [42, 16], [48, 26], [40, 34], [22, 34]], C.a);
    d.taper([[36, 16], [42, 4], [48, 0]], 4, 1, C.g); d.taper([[30, 16], [30, 4], [34, -2]], 4, 1, C.g);
    d.taper([[20, 30], [12, 36], [8, 44]], 2.5, 1, C.c);
    d.eye(28, 24, 3.2, { angry: true, skin: C.a }); d.eye(38, 23, 3, { angry: true, skin: C.a });
    d.mouth(22, 31, 4, { flat: true });
  }, { shift: 200, keep: ['k'], ow: 28 });
  // ------------------------------------------------------------- TEMPESTRAL
  def('tempestral', { a: '#4a6ad8', b: '#2a3a8a', c: '#f4f8ff', g: '#f4d040', z: '#a8f0ff', e: '#f4d040' }, (d, C) => {
    const br = d.s;
    shadow(d, 50, 91, 34);
    d.batwing(44, 36, 46, -2.5, C.b, { flap: .12 });
    d.batwing(58, 38, 44, -.55, C.a, { flap: -.12 });
    d.taper([[62, 70], [78, 80], [90, 76], [94, 66]], 14, 4, C.a);
    d.poly([[92, 68], [96, 58], [88, 64]], C.g);
    d.limb(44, 74, 38, 88, 8, C.b); d.limb(58, 74, 62, 88, 8, C.b);
    d.ell(50, 60 - br * .4, 18, 20, C.a);
    d.ell(47, 64, 11, 15, C.c, { flat: true });
    d.taper([[46, 44], [40, 32], [36, 22]], 14, 11, C.a);
    d.blob([[20, 18], [30, 8], [44, 10], [50, 20], [42, 28], [24, 28]], C.a);
    d.taper([[40, 10], [48, -2], [56, -4]], 4.5, 1, C.g); d.taper([[34, 10], [36, -2], [42, -6]], 4.5, 1, C.g);
    d.eye(30, 17, 3.2, { col: C.e, angry: true, skin: C.a, slit: true }); d.eye(40, 16, 3, { col: C.e, angry: true, skin: C.a, slit: true });
    d.mouth(24, 25, 5, { open: .25, fang: 2 });
    d.stroke([[70, 20], [74, 14], [71, 12], [77, 4]], C.z, 1.8); d.stroke([[14, 44], [10, 38], [13, 36], [8, 28]], C.z, 1.6);
    d.glow(50, 40, 40, 'rgba(160,220,255,.18)');
  }, { shift: 150, keep: ['g', 'z'], ow: 32 });
  // ----------------------------------------------------------------- ODDOWL
  def('oddowl', { a: '#b88a5a', b: '#8a6038', c: '#f4e4c8', k: '#f4b030', p: '#c85ac8', e: '#1e1a24' }, (d, C) => {
    const tilt = d.s * .15;
    shadow(d, 50, 90, 18);
    d.stroke([[44, 82], [43, 88]], C.k, 2); d.stroke([[54, 82], [55, 88]], C.k, 2);
    d.ell(50, 68, 17, 16, C.a);
    d.ell(48, 72, 11, 10, C.c, { flat: true });
    for (let i = 0; i < 3; i++) d.stroke([[42 + i * 4, 70], [44 + i * 4, 73], [46 + i * 4, 70]], C.b, 1);
    d.wing(62, 62, 12, .9, C.b, { n: 3 }); d.wing(36, 62, 12, 2.3, C.b, { n: 3 });
    d.c.save(); d.c.translate(48, 46); d.c.rotate(tilt);
    d.circ(0, 0, 15, C.a);
    d.ear(-10, -10, 7, 9, -.5, C.a, C.b); d.ear(10, -10, 7, 9, .5, C.b, C.b);
    d.face(() => { d.circ(-6, 0, 7, C.c, { flat: true }); d.circ(7, 0, 7, C.c, { flat: true }); });
    d.eye(-6, 0, 4.5, { col: C.p }); d.eye(7, 0, 4.5, { col: C.p });
    d.face(() => { d.tri(-2, 5, 3, 5, 0, 10, C.k); });
    d.c.restore();
  }, { shift: 180, ow: 18 });
  // --------------------------------------------------------------- HOOTSAGE
  def('hootsage', { a: '#9a6a44', b: '#6a4430', c: '#f4e4c8', k: '#f4b030', p: '#d85ac8', g: '#f4d040', e: '#1e1a24' }, (d, C) => {
    shadow(d, 50, 90, 24);
    d.stroke([[44, 82], [42, 89]], C.k, 2.6); d.stroke([[56, 82], [58, 89]], C.k, 2.6);
    d.wing(64, 50, 24, .6, C.b, { n: 5, flap: .08 }); d.wing(34, 50, 24, 2.55, C.b, { n: 5, flap: -.08 });
    d.ell(50, 62, 20, 22, C.a);
    d.ell(48, 68, 13, 14, C.c, { flat: true });
    for (let r = 0; r < 3; r++) for (let i = 0; i < 3; i++) d.stroke([[40 + i * 6, 62 + r * 6], [43 + i * 6, 65 + r * 6], [46 + i * 6, 62 + r * 6]], C.b, 1);
    d.circ(48, 32, 17, C.a);
    d.ear(36, 20, 8, 12, -.4, C.a, C.b); d.ear(60, 20, 8, 12, .4, C.b, C.b);
    d.face(() => { d.circ(41, 32, 8, C.c, { flat: true }); d.circ(56, 32, 8, C.c, { flat: true }); d.c.strokeStyle = C.g; d.c.lineWidth = 1.8; d.c.beginPath(); d.c.arc(41, 32, 7.5, 0, d.TAU); d.c.stroke(); d.c.beginPath(); d.c.arc(56, 32, 7.5, 0, d.TAU); d.c.stroke(); d.line(48, 31, 49, 31, C.g, 1.8); });
    d.eye(41, 32, 4.4, { col: C.p }); d.eye(56, 32, 4.4, { col: C.p });
    d.face(() => { d.tri(45, 38, 51, 38, 48, 44, C.k); });
    d.glow(48, 32, 26, 'rgba(255,150,240,.15)');
  }, { shift: 180, ow: 24 });
})();
