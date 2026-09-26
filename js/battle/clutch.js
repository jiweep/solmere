'use strict';
// =============================================================================
//  Clutch moments and clips. The battle watches for the plays people scream at: surviving on a sliver of
//  HP, a critical-hit knockout, a one-shot on a boss, winning with your last Echo standing, a Perfect
//  catch of something rare. When one lands, time slows, a banner slams in, and the game keeps the clip.
//
//  Recording: while a battle runs, two MediaRecorders take turns on the game canvas (and the game's
//  audio), each restarting every 16 s, 8 s apart, so one of them always holds the last 8-16 seconds.
//  After a moment (plus a beat of aftermath) that one is stopped and its file kept. Clips are offered with
//  C (or the button on the toast) and download as a video stamped with the game's URL.
// =============================================================================
G.clutch = (() => {
  const clips = [];            // { url, blob, label, t, ext }
  let recs = [], sc = null, want = false, pending = null;
  const supported = () => typeof MediaRecorder !== 'undefined' && !!document.getElementById('game').captureStream;
  const on = () => G.settings.clips !== false && supported();
  const mime = () => ['video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4', 'video/webm;codecs=vp9,opus'].find(m => { try { return MediaRecorder.isTypeSupported(m); } catch (e) { return false; } });
  // recorders watch a 960x540 mirror of the game view (cheap to encode, whatever the screen's size),
  // refreshed every frame while a battle is being recorded
  let mirror = null, mctx = null;
  function pump() {
    if (!want && !pending) return;
    const g = G.gfx, src = document.getElementById('game');
    mctx.imageSmoothingEnabled = false;
    try { mctx.drawImage(src, g.ox, g.oy, G.W * g.S, G.H * g.S, 0, 0, 960, 540); } catch (e) { }
    requestAnimationFrame(pump);
  }
  function stream() {
    if (!mirror) { mirror = document.createElement('canvas'); mirror.width = 960; mirror.height = 540; mctx = mirror.getContext('2d'); }
    const s = mirror.captureStream(30);
    try { const a = G.audio && G.audio.stream && G.audio.stream(); if (a) for (const tr of a.getAudioTracks()) s.addTrack(tr); } catch (e) { }
    return s;
  }
  function startRec(slot) {
    const m = mime(); if (!m) return;
    let r; try { r = new MediaRecorder(stream(), { mimeType: m, videoBitsPerSecond: 3e6 }); } catch (e) { return; }
    const rec = { r, chunks: [], t0: performance.now(), slot, mime: m };
    r.ondataavailable = ev => { if (ev.data && ev.data.size) rec.chunks.push(ev.data); };
    r.onstop = () => { if (rec.keep) rec.keep(new Blob(rec.chunks, { type: m.split(';')[0] })); };
    r.start(500);
    recs[slot] = rec;
  }
  function cycle() {   // restart whichever recorder is older than 16 s (it has nothing the other one lacks)
    if (!want || pending) return;
    for (const k of [0, 1]) { const q = recs[k]; if (q && performance.now() - q.t0 > 16000) { q.keep = null; try { q.r.stop(); } catch (e) { } recs[k] = null; startRec(k); } }
  }
  let timer = null;
  function begin(scene) {
    sc = scene; want = on(); if (!want) return;
    recs = []; startRec(0); requestAnimationFrame(pump);
    setTimeout(() => { if (want && !recs[1]) startRec(1); }, 8000);
    clearInterval(timer); timer = setInterval(cycle, 1000);
  }
  function end() {
    want = false; clearInterval(timer);
    if (!pending) for (const q of recs) if (q) { q.keep = null; try { q.r.stop(); } catch (e) { } }
    recs = [];
  }
  function save(label) {
    const q = recs.filter(Boolean).sort((a, b) => a.t0 - b.t0)[0]; if (!q) return;
    pending = true;
    q.keep = blob => {
      pending = null;
      const ext = q.mime.includes('mp4') ? 'mp4' : 'webm';
      clips.unshift({ blob, url: URL.createObjectURL(blob), label, t: Date.now(), ext });
      while (clips.length > 5) URL.revokeObjectURL(clips.pop().url);
      G.toast(`Clip saved: ${label}  ·  press C to download`, { life: 360, col: 'gold' });
      if (want) startRec(recs.indexOf(q) >= 0 ? recs.indexOf(q) : 0);
    };
    const i = recs.indexOf(q); recs[i] = null;
    try { q.r.stop(); } catch (e) { pending = null; }
  }
  function download(i = 0) {
    const c = clips[i]; if (!c) { G.toast('No clips yet. Pull off something clutch!'); return; }
    const a = document.createElement('a'); a.href = c.url;
    a.download = `solmere-${c.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '')}-${new Date(c.t).toISOString().slice(0, 19).replace(/[:T]/g, '')}.${c.ext}`;
    document.body.appendChild(a); a.click(); a.remove();
  }
  // ---------------------------------------------------------------- the moments
  const mine = (s) => sc && s && s.side === sc.persp;
  let lastHit = {}, moments = 0;
  function moment(label, sub, col = '#ffe070') {
    if (!sc) return;
    moments++;
    sc.clutchFx = { t: 0, label, sub, col };
    sc.slowT = 70;
    sc.flash = 8; sc.flashCol = '#ffffff';
    G.audio && G.audio.sfx('shiny');
    G.save && (G.save.stats.clutches = (G.save.stats.clutches || 0) + 1);
    if (want) setTimeout(() => save(label), 2200);
  }
  // C downloads the newest clip, from anywhere (not while typing a name)
  addEventListener('keydown', e => { if (e.code === 'KeyC' && !e.repeat && clips.length && !(G.input && G.input.typing)) { e.preventDefault(); download(0); } });
  return {
    clips, on, supported, download,
    begin(scene) { lastHit = {}; moments = 0; begin(scene); },
    end(scene, result) {
      // the comeback: a win with one Echo left standing, after the rest of a full team went down
      if (scene && result && result.outcome === 'win' && G.save) {
        const party = G.save.party.filter(m => !m.egg), alive = party.filter(m => m.hp > 0);
        if (party.length >= 3 && alive.length === 1 && !moments) { sc = scene; moment('COMEBACK!', `${G.mon.name(alive[0])} carried the whole team`, '#ff7ad8'); return new Promise(r => setTimeout(() => { end(); r(); }, 2600)); }
      }
      end();
    },
    hit(scene, e) { lastHit[e.ref.s + ':' + e.ref.i] = { crit: !!e.crit, eff: e.eff || 1 }; },
    hp(scene, e, from) {
      const s = scene.slot(e.ref); if (!s || e.heal || e.silent) return;
      if (mine(s) && e.hp > 0 && e.hp / e.max <= .08 && from / e.max >= .3) moment('CLUTCH!', `${s.name || 'It'} hung on with ${e.hp} HP`);
    },
    faint(scene, e) {
      const s = scene.slot(e.ref), h = lastHit[e.ref.s + ':' + e.ref.i]; if (!s || mine(s) || !h) return;
      if (s.maxhp && s._hpBefore === s.maxhp && scene.bt && !scene.bt.wild) moment('ONE SHOT!', 'Full HP to zero in one hit', '#ff7a5a');
      else if (h.crit) moment('CRIT KO!', 'A critical hit to finish it', '#7ad8ff');
    },
    caught(scene, q, mon) { if (q === 3 && mon && (mon.shiny || (G.SPECIES[mon.sp] && G.SPECIES[mon.sp].catch <= 90))) { sc = scene; moment('PERFECT CATCH!', mon.shiny ? 'A shiny, first try' : 'Right in the center', '#ffe070'); } },
    // the banner, drawn over the battle UI
    draw(scene) {
      if (want) G.ui.text('SOLMERE · jiweep.github.io/solmere', G.W / 2, G.H - 7, { size: 4.6, weight: 700, align: 'center', color: 'rgba(255,255,255,.4)' });   // clips carry the way back
      const f = scene.clutchFx; if (!f) return;
      f.t++; if (f.t > 110) { scene.clutchFx = null; return; }
      const U = G.ui, k = Math.min(1, f.t / 8), out = Math.max(0, (f.t - 90) / 20), y = 58;
      U.c.save(); U.c.globalAlpha = 1 - out;
      const w = 250 * G.ease.outBack(k), x = G.W / 2 - w / 2;
      U.para(x + 4, y + 4, w, 34, 8, 'rgba(0,0,0,.5)'); U.para(x, y, w, 34, 8, '#10121e'); U.para(x, y, w, 3, 8, f.col); U.para(x, y + 31, w, 3, 8, f.col);
      if (k >= 1) {
        const j = f.t < 20 ? (G.rand() - .5) * 3 : 0;
        U.text(f.label, G.W / 2 + j, y + 4, { size: 16, weight: 900, align: 'center', color: f.col, outline: '#1a0a20' });
        U.text(f.sub, G.W / 2, y + 23, { size: 6.2, weight: 700, align: 'center', color: '#ffffff' });
      }
      U.c.restore();
    },
  };
})();
