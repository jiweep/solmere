'use strict';
// ============================================================================
//  Title scene in real 3D, kept pixel art. One small three.js scene rendered at
//  a pixel grid that divides the screen evenly, then scaled up with no
//  smoothing:
//  - the Tidelight is a model: a faceted octagonal tower with hand-pixelled
//    textures (banded brickwork, plinth, door, windows), a gallery with a
//    railing, a glazed lantern room, a cap with a vane, and a 3D beam sweeping
//    round it;
//  - the scenery is a generated painting cut apart (art_src/build_title.py):
//    the sky, the far islands, the headland with its surf and the two
//    foreground rock clusters stand as cut-outs at their own depths, so the
//    slowly drifting camera gives real parallax;
//  - the sea is a shader surface: the painted sea projected onto the water
//    plane, rippled by travelling swells, with the sun glitter twinkling live.
//  Particles (spray off the rocks, sparkles, gulls) are square pixels that
//  move with the depth they belong to. Without WebGL (or until the pictures
//  load) the flat procedural painting is used.
// ============================================================================
(function () {
  const T = window.THREE; if (!T) return;
  const F = 420, CAMH = 26;   // focal length in art pixels and eye height: the numbers the painting was drawn with
  // the composition is the generated dusk seascape (img/battle/water_dusk.png) cut into layers by
  // art_src/build_title.py: 768x432 art pixels, horizon on row 161, every layer M columns wider each side
  const AW = 768, AH = 432, HZ = 161, M = 72, SUN = [537, 150];
  const D = { sky: 6000, fx: 5800, far: 3000, boat: 1400, mid: 575, breach: 140, rocks: 300 };
  const LIGHT = [742, 294];     // where the Tidelight stands, on the right-hand rocks
  let R = null, glc = null, failed = false, S3 = null, comp = null, cc = null, RW = 0, RH = 0, P = 1, lastT = -1;
  const K = () => ({ AW, HZ });
  function texOf(cv, o = {}) {
    const t = new T.CanvasTexture(cv);
    t.magFilter = T.NearestFilter; t.minFilter = o.nearest ? T.NearestFilter : T.LinearFilter; t.generateMipmaps = false;
    t.colorSpace = o.raw ? T.NoColorSpace : T.SRGBColorSpace;
    if (o.wrap) t.wrapS = T.RepeatWrapping;
    return t;
  }
  // a painted cut-out standing at depth d: art column c0 / row r0 / size cw x ch (art px) lands exactly where
  // the painting had it, seen from the starting camera
  function card(tex, c0, r0, cw, ch, d, order, o = {}) {
    const { AW, HZ } = K(), s = d / F;
    const m = new T.Mesh(new T.PlaneGeometry(cw * s, ch * s), new T.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false, ...(o.mat || {}) }));
    m.position.set((c0 + cw / 2 - AW / 2) * s, CAMH + (HZ - (r0 + ch / 2)) * s, -d); m.renderOrder = order;
    return m;
  }
  const px = (x, y, w, h, col, c) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const canvas = (w, h, fn) => { const cv = G.makeCanvas(w, h), c = cv.getContext('2d'); fn(c, w, h); return cv; };

  // ------------------------------------------------------------- lighthouse
  // tower texture: 8 faces x 12 texels around, one texel per art pixel up the 132-pixel tower
  const FACE = 12, TH = 132;
  function towerTex() {
    return canvas(FACE * 8, TH, (c) => {
      const white = [236, 230, 238], red = [200, 58, 72], stone = [122, 106, 122];
      const put = (x, y, rgb, k = 0) => { const f = 1 + k; c.fillStyle = `rgb(${Math.min(255, rgb[0] * f) | 0},${Math.min(255, rgb[1] * f) | 0},${Math.min(255, rgb[2] * f) | 0})`; c.fillRect(x, y, 1, 1); };
      for (let y = 0; y < TH; y++) for (let x = 0; x < FACE * 8; x++) {
        const u = x % FACE, face = (x / FACE) | 0, t = y / TH, plinth = y >= TH - 12;
        let base = plinth ? stone : (Math.floor(t * 5.5) % 2 === 0 ? white : red), k = 0;
        const course = plinth ? (TH - y) % 4 === 0 : y % 5 === 4;            // mortar courses
        const joint = plinth ? u === ((((TH - y) >> 2) & 1) ? 2 : 8) : u === (((y / 5 | 0) & 1) ? 3 : 9);
        if (course) k -= .1; else if (joint && (plinth || G.h2(x, y >> 2, 3) > .35)) k -= .06;
        if (u === 0) k -= .1; if (u === FACE - 1) k += .06;                       // a bevel on every arris
        if (!plinth && G.h2(x, y, 11) > .93) k -= .05;                             // weathered bricks
        if (!plinth && y > 8 && G.h2(x, 1, 13) > .9 && G.h2(x, y >> 3, 14) > .5) k -= .08;   // rain streaks
        if (!plinth && y < TH - 12 && y >= TH - 15) k -= .18;                      // the plinth's shadow line
        put(x, y, base, k);
      }
      // front face (3): an arched door in the plinth, a lit window over it, two windows up the tower
      const f0 = 3 * FACE;
      for (let y = TH - 14; y < TH; y++) for (let x = f0 + 3; x < f0 + 9; x++) {
        const arch = y === TH - 14 && (x === f0 + 3 || x === f0 + 8);
        if (!arch) px(x, y, 1, 1, (x === f0 + 3 || x === f0 + 8 || y === TH - 13) ? '#2a1a22' : x === f0 + 6 ? '#3e2630' : '#4a2e36', c);
      }
      px(f0 + 7, TH - 7, 1, 1, '#d8b060', c);                                     // latch
      const win = (x, y, w, h) => { px(x - 1, y - 1, w + 2, h + 2, '#3a2430', c); px(x, y, w, h, '#ffd890', c); px(x, y, w, 1, '#fff2c8', c); px(x + (w >> 1), y, 1, h, '#b08050', c); };
      win(f0 + 4, 40, 4, 6); win(f0 + 4, 76, 4, 6); win(f0 + 5, TH - 22, 2, 3);
      win(5 * FACE + 4, 58, 4, 6); win(7 * FACE + 4, 94, 4, 6); win(1 * FACE + 4, 22, 4, 6);
    });
  }
  function glassTex() {
    return canvas(64, 24, (c) => {
      for (let y = 0; y < 24; y++) for (let x = 0; x < 64; x++) {
        const u = x % 8, mull = u === 0 || y === 0 || y === 23 || y === 12;
        const k = 1 - Math.abs(u - 4) / 5;
        c.fillStyle = mull ? '#1c1a26' : `rgb(255,${(214 + 30 * k) | 0},${(120 + 90 * k) | 0})`; c.fillRect(x, y, 1, 1);
      }
    });
  }
  function lighthouse() {
    const g = new T.Group(), lam = (col, o = {}) => new T.MeshLambertMaterial({ color: col, flatShading: true, ...o });
    const tt = texOf(towerTex(), { nearest: true });
    // octagonal tower tapering from 17 to 11 art pixels; face 3 is turned to the camera
    const face3 = Math.atan2(-(LIGHT[0] - AW / 2), F);   // the face turned to the camera
    const tower = new T.Mesh(new T.CylinderGeometry(11, 17, TH, 8, 1, false, face3 - 3.5 * Math.PI / 4), lam(0xffffff, { map: tt }));
    tower.position.y = TH / 2; g.add(tower);
    const add = (geo, mat, y, o = {}) => { const m = new T.Mesh(geo, mat); m.position.y = y; if (o.rot) m.rotation.y = o.rot; g.add(m); return m; };
    const iron = lam(0x2e2c3c), deck = lam(0x5a5a6e);
    add(new T.CylinderGeometry(19.5, 14, 6, 8, 1, false, face3), deck, TH + 3);                        // gallery (corbelled)
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2 + face3; const p = add(new T.BoxGeometry(1, 8, 1), iron, TH + 10); p.position.x = Math.sin(a) * 18.4; p.position.z = Math.cos(a) * 18.4; }
    const rail = add(new T.CylinderGeometry(18.6, 18.6, 1.4, 16, 1, true), iron, TH + 13.6); rail.material = lam(0x3a3848, { side: T.DoubleSide });
    add(new T.CylinderGeometry(12.5, 12.5, 2.4, 8, 1, false, face3), iron, TH + 7.2);                   // lantern plinth
    const glassM = new T.MeshBasicMaterial({ map: texOf(glassTex(), { nearest: true }), toneMapped: false });
    const glass = add(new T.CylinderGeometry(11, 11, 22, 8, 1, true, face3), glassM, TH + 19.4);
    add(new T.CylinderGeometry(14, 14, 1.6, 8, 1, false, face3), iron, TH + 31);                        // lantern roof rim
    const cap = add(new T.ConeGeometry(13.5, 17, 8, 1, false, face3), lam(0xb0404c), TH + 40.3);
    add(new T.SphereGeometry(2.6, 6, 4), iron, TH + 50.5);
    add(new T.BoxGeometry(.9, 12, .9), iron, TH + 58);
    const vane = new T.Group(); vane.position.y = TH + 60;
    const arrow = new T.Mesh(new T.BoxGeometry(12, 1, .6), iron); vane.add(arrow);
    const tip = new T.Mesh(new T.ConeGeometry(1.6, 3.2, 4), iron); tip.rotation.z = -Math.PI / 2; tip.position.x = 7; vane.add(tip);
    const tail = new T.Mesh(new T.BoxGeometry(2.6, 3.4, .5), iron); tail.position.x = -5.6; vane.add(tail);
    g.add(vane);
    // lamp, halo and the beam
    const lampY = TH + 19.4;
    const halo = new T.Sprite(new T.SpriteMaterial({ map: texOf(canvas(64, 64, (c) => {
      for (let i = 0; i < 6; i++) { c.fillStyle = `rgba(255,236,190,${(.16 + i * .02).toFixed(2)})`; c.beginPath(); c.arc(32, 32, 32 - i * 5, 0, 7); c.fill(); }
    })), blending: T.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false }));
    halo.position.y = lampY; halo.renderOrder = 30; g.add(halo);
    const beamMat = new T.ShaderMaterial({
      uniforms: { uA: { value: .4 } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide,
      vertexShader: 'varying float vK; void main(){ vK = uv.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: 'uniform float uA; varying float vK; void main(){ float a = pow(vK, 1.6) * uA; a = floor(a * 14. + .5) / 14.; gl_FragColor = vec4(vec3(1., .93, .74) * a, a); }',
    });
    const beams = new T.Group(); beams.position.y = lampY; g.add(beams);
    for (const [len, rad, k] of [[860, 46, 1], [560, 30, .5]]) {
      const geo = new T.ConeGeometry(rad, len, 24, 1, true); geo.translate(0, -len / 2, 0); geo.rotateZ(Math.PI / 2);
      const m = new T.Mesh(geo, beamMat.clone()); m.userData.k = k; m.renderOrder = 31; if (k < 1) m.rotation.y = Math.PI; beams.add(m);
    }
    g.userData = { beams, halo, glass, vane, cap };
    return g;
  }

  // ------------------------------------------------------------- the sea
  // the painted sea, projected onto the water plane from the starting camera (so it stays in perspective
  // as the camera drifts), rippled by travelling swells, with the sun's glitter twinkling on the wave facets
  function seaMaterial(tex) {
    return new T.ShaderMaterial({
      depthTest: false, depthWrite: false, transparent: true,
      uniforms: {
        uSea: { value: tex }, uCam: { value: new T.Vector3() }, uT: { value: 0 }, uNight: { value: 0 },
        uK: { value: new T.Vector4(AW, AH, HZ, M) }, uF: { value: F }, uCamH: { value: CAMH },
        uSun: { value: new T.Vector3((SUN[0] - AW / 2) / F, (HZ - SUN[1]) / F, -1).normalize() },
      },
      vertexShader: 'varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
      fragmentShader: `
        uniform sampler2D uSea; uniform vec3 uCam, uSun; uniform float uT, uNight, uF, uCamH; uniform vec4 uK;
        varying vec3 vW;
        float bayer(vec2 p) { vec2 q = mod(floor(p), 4.); return (mod(q.x * 2. + q.y * 3., 4.) * 4. + mod(q.x + q.y * 2., 4.)) / 16.; }
        void main() {
          vec3 V = normalize(vW - uCam);
          float z = -vW.z, t = uT * .02;
          vec2 q = vec2(vW.x, z + uT * .5);
          float fd = 1. - smoothstep(250., 2400., z), near = clamp(uF * uCamH / max(z, 1.) / (uK.y - uK.z), 0., 1.);
          float a1 = q.y * .11 + q.x * .03 - t * 2.2, a2 = q.y * .23 - q.x * .09 + t * 2.9, a3 = q.x * .21 + q.y * .07 + t * 1.7, a4 = q.x * .5 - q.y * .31 - t * 3.3;
          float sl = cos(a1) * .45 + cos(a2) * .28 + cos(a3) * .17 + cos(a4) * .1 * fd;
          float gx = -(sin(a1) * .03 * .45 - sin(a2) * .09 * .28 + sin(a3) * .21 * .17 + sin(a4) * .5 * .1 * fd);
          float gz = -(sin(a1) * .11 * .45 + sin(a2) * .23 * .28 + sin(a3) * .07 * .17 - sin(a4) * .31 * .1 * fd);
          // where this point of the water is in the painting, pushed about by the swell
          vec2 cr = vec2(uK.x * .5 + uF * vW.x / z, uK.z + uF * uCamH / z);
          cr += vec2(gx, gz) * (2.5 + near * 9.) + vec2(0., sl * (.4 + near * 1.6));
          vec2 uv = vec2((cr.x + uK.w) / (uK.x + 2. * uK.w), 1. - clamp(cr.y, uK.z + .5, uK.y - .5) / uK.y);
          vec3 col = texture2D(uSea, uv).rgb * (1. + sl * (.05 + near * .06));
          vec3 N = normalize(vec3(-gx * 1.4 * fd, 1., gz * 1.4 * fd)), Rf = reflect(V, N);
          float sp = dot(Rf, uSun), path = smoothstep(.2, .6, dot(col, vec3(.5, .35, .15)));
          // glints: single pixels that flicker, on the painted sun path, fewer up close where the facets are big
          float h = fract(sin(dot(floor(cr) + floor(uT / 5.) * vec2(3.1, 1.7), vec2(12.9898, 78.233))) * 43758.5453);
          col += vec3(1., .92, .7) * smoothstep(.996, .9993, sp) * path * step(.62, h) * (1. - near * .75) * (1. - uNight * .8);
          col = floor(col * 40. + bayer(gl_FragCoord.xy) * .9) / 40.;
          gl_FragColor = vec4(clamp(col, 0., 1.), 1.);
        }`,
    });
  }
  // the sky card sways its high clouds a little, the horizon (and the sun on it) stays put
  function skyMaterial(tex) {
    return new T.ShaderMaterial({
      depthTest: false, depthWrite: false, transparent: true, uniforms: { uMap: { value: tex }, uT: { value: 0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: `uniform sampler2D uMap; uniform float uT; varying vec2 vUv;
        void main(){ float hi = smoothstep(.55, 1., vUv.y); vec2 uv = vUv + vec2((sin(uT / 900.) * 5. + sin(uT / 377.) * 1.5) * hi / 912., 0.);
          vec4 c = texture2D(uMap, uv); gl_FragColor = c; }`,
    });
  }

  // ------------------------------------------------------------- build
  const IMGS = ['sky', 'far', 'mid', 'sea', 'rocks_l', 'rocks_r'];
  let pics = null, picsReady = false;
  function loadPics() {
    if (pics) return;
    pics = {}; let n = 0;
    for (const k of IMGS) { const im = new Image(); im.onload = () => { if (++n === IMGS.length) picsReady = true; }; im.onerror = () => { failed = true; }; im.src = 'img/title/' + k + '.png'; pics[k] = im; }
  }
  function build() {
    const scene = new T.Scene(), fore = new T.Scene();
    const cam = new T.PerspectiveCamera(40, AW / AH, 4, 20000);
    // off-centre frustum: the horizon sits at art row HZ, as in the painting
    const n = 4; cam.projectionMatrix.makePerspective(-AW / 2 / F * n, AW / 2 / F * n, HZ / F * n, -(AH - HZ) / F * n, n, 20000);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    const W2 = AW + 2 * M, tx = k => texOf(pics[k]);
    const skyM = skyMaterial(texOf(pics.sky, { raw: true }));   // (a raw texture: this shader writes what it reads)
    const sky = card(null, -M, 0, W2, AH, D.sky, 0); sky.material = skyM; scene.add(sky);
    // sun glow breathing and the odd shooting star: a small canvas redrawn every other frame
    const fxCv = G.makeCanvas(AW / 2, AH / 2), fxTex = texOf(fxCv);
    scene.add(card(fxTex, 0, 0, AW, AH, D.fx, 1, { mat: { blending: T.AdditiveBlending } }));
    scene.add(card(tx('far'), -M, 0, W2, AH, D.far, 3));
    const boatCv = canvas(26, 30, (c) => {
      c.fillStyle = '#1a1428'; c.beginPath(); c.moveTo(1, 26); c.lineTo(25, 26); c.lineTo(21, 30); c.lineTo(4, 30); c.fill();
      c.fillStyle = '#f2c6a8'; c.beginPath(); c.moveTo(13, 0); c.lineTo(13, 24); c.lineTo(24, 23); c.fill();
      c.fillStyle = '#9a6a8a'; c.beginPath(); c.moveTo(12, 4); c.lineTo(12, 24); c.lineTo(4, 23); c.fill();
      c.fillStyle = '#ffdc96'; c.fillRect(2, 23, 2, 2);
    });
    const boat = card(texOf(boatCv, { nearest: true }), 0, HZ - 22, 26, 30, D.boat, 4); scene.add(boat);
    const seaM = seaMaterial(texOf(pics.sea, { raw: true }));
    const sea = new T.Mesh(new T.PlaneGeometry(24000, 14000), seaM); sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0, -7010); sea.renderOrder = 5; scene.add(sea);
    // Orrelume, clipped at the waterline
    const water = new T.Plane(new T.Vector3(0, 1, 0), 0);
    const orrM = new T.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false, clippingPlanes: [water] });
    const orr = new T.Mesh(new T.PlaneGeometry(1, 1), orrM); orr.renderOrder = 6; orr.visible = false; scene.add(orr);
    const orrGlow = new T.Mesh(orr.geometry, new T.MeshBasicMaterial({ transparent: true, depthTest: false, depthWrite: false, toneMapped: false, clippingPlanes: [water], blending: T.AdditiveBlending, opacity: .45 }));
    orrGlow.renderOrder = 7; orrGlow.visible = false; scene.add(orrGlow);
    scene.add(card(tx('mid'), -M, 0, W2, AH, D.mid, 8));
    // the foreground (second pass): the rocks, and the Tidelight standing on the right-hand ones
    fore.add(card(tx('rocks_l'), -M, 0, W2, AH, D.rocks, 0));
    fore.add(card(tx('rocks_r'), -M, 0, W2, AH, D.rocks, 1));
    const lh = lighthouse(), s = D.rocks / F;
    lh.scale.setScalar(s); lh.position.set((LIGHT[0] - AW / 2) * s, CAMH + (HZ - LIGHT[1]) * s, -D.rocks + 3);
    // everything goes through the transparent pass, which three sorts by renderOrder (the opaque pass would
    // draw first, under the painted cut-outs)
    lh.traverse(o => { if (o.isMesh && o.renderOrder < 30) { o.renderOrder = 20; o.material.transparent = true; } });
    fore.add(lh);
    // dusk light: a violet sky, the low sun ahead-left raking the faces turned to it orange, a cool fill
    fore.add(new T.HemisphereLight(0xb090d0, 0x2a1a34, 1.15));
    const sun = new T.DirectionalLight(0xffa070, 3.4); sun.position.set(-.55, .2, -1); fore.add(sun);
    const fill = new T.DirectionalLight(0x7078d0, .75); fill.position.set(.5, .35, .9); fore.add(fill);
    return { scene, fore, cam, fxCv, fxTex, skyM, boat, seaM, lh, orr, orrM, orrGlow };
  }

  function init() {
    if (R || failed) return !!R;
    loadPics();
    if (!picsReady) return false;
    try {
      glc = document.createElement('canvas');
      R = new T.WebGLRenderer({ canvas: glc, antialias: false, alpha: true, premultipliedAlpha: true, powerPreference: 'high-performance' });
      R.setPixelRatio(1); R.outputColorSpace = T.SRGBColorSpace; R.localClippingEnabled = true; R.setClearColor(0x000000, 0);
      S3 = build();
      comp = G.makeCanvas(2, 2); cc = comp.getContext('2d');
      return true;
    } catch (e) { console.warn('3D title unavailable', e); failed = true; R = null; return false; }
  }

  // ------------------------------------------------------------- pixel particles
  const parts = [];
  function spawn(p) { parts.push(Object.assign({ t: 0, vx: 0, vy: 0, size: 1, a: 1 }, p)); }
  function sq(x, y, s, col, a) { cc.globalAlpha = a; cc.fillStyle = col; cc.fillRect(Math.round(x - s / 2), Math.round(y - s / 2), Math.max(1, Math.round(s)), Math.max(1, Math.round(s))); }
  // where surf bursts off the rocks (art px, on the rocks' plane), each with its own rhythm
  const SURF = [[40, 300, 0], [118, 330, 1.3], [178, 350, 2.9], [236, 368, 4.1], [300, 404, 5.3], [560, 406, .7], [604, 386, 2.2], [652, 346, 3.6], [700, 344, 4.8]];

  // ------------------------------------------------------------- frame
  function frame(st) {
    const t = st.t, gx = G.gfx;
    // render grid: whole screen pixels per render pixel, about one per art pixel
    P = Math.max(1, Math.round(G.W * gx.S / AW));
    const w = Math.max(64, Math.round(G.W * gx.S / P)), h = Math.max(36, Math.round(G.H * gx.S / P));
    if (w !== RW || h !== RH) { RW = w; RH = h; R.setSize(RW, RH, false); comp.width = RW; comp.height = RH; }
    // camera: craning down onto the scene as it fades in, then a slow drift left and right
    const intro = G.ease.outCubic(Math.min(1, t / 170));
    const camX = Math.sin(t / 760) * 22 + Math.sin(t / 297) * 4, dy = (1 - intro) * 30 + 3 + Math.sin(t / 530) * 3;
    S3.cam.position.set(camX, CAMH + dy, 0); S3.cam.updateMatrixWorld();
    const off = (d) => [-F * camX / d, F * dy / d];                 // where a thing at depth d appears to move, art px
    const fx = S3.fxCv.getContext('2d');
    if (t !== lastT && t % 2 === 0) {
      fx.clearRect(0, 0, AW / 2, AH / 2); fx.save(); fx.scale(.5, .5); fx.globalCompositeOperation = 'lighter';
      const gl = fx.createRadialGradient(SUN[0], SUN[1], 4, SUN[0], SUN[1], 170); gl.addColorStop(0, `rgba(255,214,150,${.2 + .06 * Math.sin(t / 40)})`); gl.addColorStop(1, 'rgba(255,150,110,0)');
      fx.fillStyle = gl; fx.fillRect(SUN[0] - 180, SUN[1] - 180, 360, 190);
      const ss = t % 700; if (ss < 34) { const q = ss / 34; for (let k = 0; k < 16; k++) { const f2 = k / 16; fx.fillStyle = `rgba(255,255,240,${((1 - q) * f2 * .9).toFixed(3)})`; fx.fillRect(Math.round(250 + q * 200 - (1 - f2) * 40), Math.round(22 + q * 50 - (1 - f2) * 11), 2, 2); } }
      fx.restore(); S3.fxTex.needsUpdate = true;
    }
    S3.skyM.uniforms.uT.value = t;
    { const s = D.boat / F, bx = ((t * .08) % (AW + 200)) - 100; S3.boat.position.x = (bx - AW / 2) * s; }
    const U = S3.seaM.uniforms; U.uCam.value.copy(S3.cam.position); U.uT.value = t; U.uNight.value = st.night || 0;
    // the lamp: two opposed beams turning, the halo swelling as the main one swings round toward you
    const lamp = st.lamp === undefined ? 1 : st.lamp, ud = S3.lh.userData, phi = t / 70;
    ud.beams.rotation.y = phi;
    const toCam = new T.Vector3().subVectors(S3.cam.position, S3.lh.position).setY(0).normalize(), dir = new T.Vector3(Math.cos(phi), 0, -Math.sin(phi));
    const toward = Math.max(0, dir.dot(toCam));
    for (const b of ud.beams.children) { b.visible = lamp > 0; b.material.uniforms.uA.value = .62 * lamp * b.userData.k * (1 - toward * .6); }
    ud.halo.scale.setScalar((22 + toward * 48) * (lamp > 0 ? 1 : 0) + .001); ud.halo.material.opacity = lamp;
    ud.glass.material.color.setScalar(.35 + .65 * lamp);
    ud.vane.rotation.y = Math.sin(t / 400) * .8 + .4;
    // Orrelume breaching: rises nearly upright through the surface, hangs, slides back
    const b = st.breach;
    S3.orr.visible = S3.orrGlow.visible = false;
    let bInfo = null;
    if (b) {
      const img = G.monArt.front('orrelume', false, 0), sc = b.glow ? 1.7 : 1.25, dd = D.breach, s = dd / F;
      if (S3.orrM.map !== S3._orrTex) { S3._orrTex = texOf(img, { nearest: true }); S3.orrM.map = S3.orrGlow.material.map = S3._orrTex; S3.orrM.needsUpdate = S3.orrGlow.material.needsUpdate = true; }
      const x0 = b.glow ? 420 : 452, Hh = img.height * sc, p = b.p, rise = Math.pow(Math.sin(p * Math.PI), .6);
      const yw = HZ + F * CAMH / dd;
      const x = x0 + (p - .5) * 26, y = yw + Hh * .5 - rise * Hh * (b.glow ? .95 : .8);
      S3.orr.scale.set(img.width * sc * s, img.height * sc * s, 1);
      S3.orr.position.set((x - AW / 2) * s, CAMH + (HZ - y) * s, -dd); S3.orr.rotation.z = -((p - .5) * .5 + Math.sin(t / 20) * .02);
      S3.orr.visible = true;
      if (b.glow) { S3.orrGlow.visible = true; S3.orrGlow.position.copy(S3.orr.position); S3.orrGlow.scale.copy(S3.orr.scale); S3.orrGlow.rotation.copy(S3.orr.rotation); }
      bInfo = { x, yw, w: img.width * sc * .45, rise, Hh, p, glow: b.glow };
    }
    // ---- pass 1: sky, islands, sea, headland
    R.render(S3.scene, S3.cam);
    cc.setTransform(1, 0, 0, 1, 0, 0); cc.globalAlpha = 1; cc.globalCompositeOperation = 'source-over'; cc.imageSmoothingEnabled = false;
    cc.clearRect(0, 0, RW, RH); cc.drawImage(glc, 0, 0);
    const kx = RW / AW, ky = RH / AH;
    // spawn: sparkles on the sun's path, surf bursting off the rocks
    if (t !== lastT) {
      if (t % 2 === 0) { const y = HZ + 4 + Math.pow(G.rand(), 1.6) * 250, sp = 8 + (y - HZ) * .45; spawn({ x: SUN[0] + (G.rand() - .5) * 2 * sp, y, life: 22, col: '#fff2c8', star: true, d: F * CAMH / (y - HZ) }); }
      for (const [sx, sy, ph] of SURF) {
        const k = (t / 90 + ph) % 6.2;
        if (k < .5 && t % 2 === 0) for (let i = 0; i < 3; i++) spawn({ spray: true, x: sx + (G.rand() - .5) * 22, y: sy + G.rand() * 4, vx: (G.rand() - .5) * 1.4, vy: -1.2 - G.rand() * 2.4, ay: .08, life: 38, size: 1 + G.rand() * 1.6, col: G.rand() < .7 ? '#f4f0ff' : '#ffd6c8', d: D.rocks, top: true });
      }
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.t++;
        p.vy += p.ay || 0; p.x += p.vx; p.y += p.vy;
        if (p.t > p.life) parts.splice(i, 1);
      }
    }
    for (const p of parts) {
      if (p.top) continue;
      const [ox, oy] = off(p.d), life = p.t / p.life, X = (p.x + ox) * kx, Y = (p.y + oy) * ky;
      if (p.star) { const a = Math.sin(life * Math.PI); sq(X, Y, 1, p.col, a); if (a > .6) { sq(X - 1, Y, 1, p.col, a * .5); sq(X + 1, Y, 1, p.col, a * .5); sq(X, Y - 1, 1, p.col, a * .5); sq(X, Y + 1, 1, p.col, a * .5); } }
      else if (p.spray) { if (p.y > HZ + F * CAMH / p.d + 1) continue; sq(X, Y, p.size * kx, p.col, Math.min(1, (1 - life) * 2)); }
    }
    // gulls: pixel wings flapping
    for (const gu of G.titleHD.gulls) {
      const [ox, oy] = off(900);
      const x = ((gu.x + t * gu.v) % (AW + 80)) - 40 + ox, y = gu.y * .55 + 20 + Math.sin(t / 60 + gu.ph) * 8 + oy, up = Math.sin(t / 7 + gu.ph) > 0, s = Math.round(2 + gu.s * 2);
      cc.globalAlpha = 1; cc.fillStyle = '#2a1a30';
      const X = Math.round(x * kx), Y = Math.round(y * ky);
      cc.fillRect(X, Y, 1, 1);
      for (let k = 1; k <= s; k++) { const lift = up ? Math.round(k * .8) : Math.round(k * .3); cc.fillRect(X - k, Y - lift, 1, 1); cc.fillRect(X + k, Y - lift, 1, 1); }
    }
    // breach: churned water and rings on its plane
    if (bInfo) {
      const [ox, oy] = off(D.breach), B = bInfo, X = (B.x + ox) * kx, Y = (B.yw + oy) * ky;
      cc.globalAlpha = .35 + .25 * B.rise; cc.fillStyle = '#ebf4ff';
      const ew = B.w * (.8 + .3 * B.rise) * kx, eh = (3 + 2 * B.rise) * ky;
      for (let yy = -Math.ceil(eh); yy <= Math.ceil(eh); yy++) { const hw = Math.round(ew * Math.sqrt(Math.max(0, 1 - (yy / eh) ** 2))); cc.fillRect(Math.round(X - hw), Math.round(Y + yy), hw * 2, 1); }
      for (let r = 0; r < 3; r++) {
        const q = ((t / 55 + r / 3) % 1), rw = (B.w + q * 80) * kx, rh = (3 + q * 11) * ky; cc.globalAlpha = (1 - q) * .4 * (.4 + B.rise); cc.fillStyle = '#e6f0ff';
        const nn = Math.round(rw * 2.4); for (let i = 0; i < nn; i++) { const a = i / nn * Math.PI * 2; cc.fillRect(Math.round(X + Math.cos(a) * rw), Math.round(Y + 2 * ky + Math.sin(a) * rh), 1, 1); }
      }
      if (t !== lastT) {
        if ((B.p < .22 || B.p > .8) && t % 2 === 0) for (let i = 0; i < 5; i++) spawn({ spray: true, x: B.x + (G.rand() - .5) * B.w * 2, y: B.yw, vx: (G.rand() - .5) * 2, vy: -1.6 - G.rand() * 2.8, ay: .09, life: 44, size: 1 + G.rand() * 1.5, col: '#eef6ff', d: D.breach });
        if (B.rise > .3 && t % 2 === 0) spawn({ spray: true, x: B.x + (G.rand() - .5) * B.w * 1.6, y: B.yw - B.rise * B.Hh * .5 + G.rand() * B.rise * B.Hh * .4, vy: .6, ay: .14, life: 26, size: 1, col: '#d8ecff', d: D.breach });
      }
      if (B.glow) { cc.globalCompositeOperation = 'lighter'; for (let i = 0; i < 5; i++) { cc.globalAlpha = .06 * B.rise; cc.fillStyle = '#78c8ff'; const r = (140 - i * 26) * kx; cc.beginPath(); cc.arc(X, (B.yw - 40 + oy) * ky, r, 0, Math.PI * 2); cc.fill(); } cc.globalCompositeOperation = 'source-over'; }
    }
    // ---- pass 2: the rocks and the Tidelight
    R.render(S3.fore, S3.cam);
    cc.globalAlpha = 1; cc.drawImage(glc, 0, 0);
    // surf spray in front of the rocks
    for (const p of parts) if (p.top) { const [ox, oy] = off(p.d); sq((p.x + ox) * kx, (p.y + oy) * ky, p.size * kx, p.col, Math.min(1, (1 - p.t / p.life) * 2.2)); }
    // vignette (in stepped rings) and the fade in
    for (let i = 0; i < 5; i++) {
      cc.globalAlpha = .08; cc.fillStyle = '#00000c'; const inset = (i + 1) * .05;
      cc.beginPath(); cc.rect(0, 0, RW, RH); cc.ellipse(RW / 2, RH / 2, RW * (.8 - inset), RH * (.88 - inset), 0, 0, Math.PI * 2); cc.fill('evenodd');
    }
    cc.globalAlpha = 1;
    if (intro < 1) { cc.fillStyle = `rgba(0,0,0,${(1 - intro).toFixed(3)})`; cc.fillRect(0, 0, RW, RH); }
    lastT = t;
  }

  G.title3d = {
    prewarm() { loadPics(); },
    // draws the scene into the game viewport; false when WebGL is unavailable or the pictures are still
    // loading (the flat painting is used)
    draw(c, st) {
      if (!init()) return false;
      try { frame(st); } catch (e) { console.warn('3D title failed', e); failed = true; return false; }
      const gx = G.gfx, sm = c.imageSmoothingEnabled;
      c.imageSmoothingEnabled = false;
      c.drawImage(comp, 0, 0, RW, RH, gx.ox, gx.oy, RW * P, RH * P);
      c.imageSmoothingEnabled = sm;
      return true;
    },
  };
})();
