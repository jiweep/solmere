'use strict';
// ============================================================================
//  Audio: WebAudio chiptune synth, song sequencer, jingles, SFX, cries.
//  All music is original and generated from note data at runtime.
// ============================================================================
G.audio = (function () {
  let ctx = null, master, musicBus, sfxBus, reverb, revSend, noiseBuf, comp;
  let cur = null, curId = null, nextTime = 0, step = 0, jingleUntil = 0, musicVolTarget = 1;
  const waves = {};
  const NOTE = { c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11 };
  const freq = n => 440 * Math.pow(2, (n - 69) / 12);
  function parseNote(tok) {
    const m = tok.match(/^([a-g])(#|b)?(\d)$/i); if (!m) return null;
    let n = NOTE[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0);
    return n + (+m[3] + 1) * 12;
  }
  function parseSeq(str) {
    const out = []; let t = 0;
    for (const tok of str.trim().split(/\s+/)) {
      const [n, d] = tok.split(':'); const dur = +(d || 2);
      if (n !== 'r') out.push({ t, dur, notes: n.split('+').map(parseNote).filter(x => x !== null) });
      t += dur;
    }
    return { events: out, len: t };
  }
  // ------------------------------------------------------------- chords
  function chordNotes(sym, oct = 3) {
    const m = sym.match(/^([A-G])(#|b)?(m|dim|sus|7|maj7|m7)?$/); if (!m) return [48, 52, 55];
    const root = NOTE[m[1].toLowerCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (oct + 1) * 12;
    const q = m[3] || '';
    const iv = q === 'm' ? [0, 3, 7] : q === 'dim' ? [0, 3, 6] : q === 'sus' ? [0, 5, 7] : q === '7' ? [0, 4, 7, 10] : q === 'maj7' ? [0, 4, 7, 11] : q === 'm7' ? [0, 3, 7, 10] : [0, 4, 7];
    return iv.map(i => root + i);
  }
  const DRUMS = {
    battle: { k: [0, 4, 8, 10, 12], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] },
    march: { k: [0, 8], s: [4, 12], h: [2, 6, 10, 14] },
    soft: { k: [0, 8], s: [], h: [4, 12] },
    fast: { k: [0, 3, 6, 8, 11, 14], s: [4, 12], h: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15] },
    shuffle: { k: [0, 10], s: [4, 12], h: [0, 3, 6, 8, 11, 14] },
    heavy: { k: [0, 2, 8, 10, 11], s: [4, 12], h: [0, 2, 4, 6, 8, 10, 12, 14] },
    none: { k: [], s: [], h: [] },
  };
  // build a song from a compact spec
  function buildSong(sp) {
    const tr = sp.transpose || 0;
    const bars = sp.chords.length, total = bars * 16;
    const tracks = [];
    const mel = parseSeq(sp.melody);
    tracks.push({ role: 'lead', wave: sp.lead || 'sq25', vol: sp.leadVol || .11, events: mel.events.map(e => ({ ...e, notes: e.notes.map(n => n + tr) })), vib: sp.vib !== false, env: sp.leadEnv || [.01, .08, .7, .08] });
    if (sp.harmony) { const h = parseSeq(sp.harmony); tracks.push({ role: 'harm', wave: sp.harmWave || 'sq50', vol: .05, events: h.events.map(e => ({ ...e, notes: e.notes.map(n => n + tr) })), env: [.01, .1, .6, .1] }); }
    else if (sp.echo !== false) tracks.push({ role: 'echo', wave: sp.lead || 'sq25', vol: .035, events: mel.events.map(e => ({ ...e, t: e.t + 3, notes: e.notes.map(n => n + tr) })), env: [.01, .08, .5, .08], pan: .4 });
    const bass = [], arp = [], drum = [];
    sp.chords.forEach((c, bi) => {
      const b0 = bi * 16; const ch = chordNotes(c, 2).map(n => n + tr); const root = ch[0];
      switch (sp.bass || 'root8') {
        case 'root4': for (let s = 0; s < 16; s += 4) bass.push({ t: b0 + s, dur: 3, notes: [root] }); break;
        case 'walk': [[0, root], [4, ch[2]], [8, root + 12], [12, ch[2]]].forEach(([s, n]) => bass.push({ t: b0 + s, dur: 3, notes: [n] })); break;
        case 'pulse': [0, 2, 3, 6, 8, 10, 11, 14].forEach(s => bass.push({ t: b0 + s, dur: 1, notes: [root + (s % 8 === 6 ? 12 : 0)] })); break;
        case 'long': bass.push({ t: b0, dur: 15, notes: [root] }); break;
        case 'octave': for (let s = 0; s < 16; s += 2) bass.push({ t: b0 + s, dur: 1.5, notes: [root + (s % 4 ? 12 : 0)] }); break;
        default: for (let s = 0; s < 16; s += 2) bass.push({ t: b0 + s, dur: 1.6, notes: [s % 4 ? root + 12 : root] });
      }
      const up = chordNotes(c, sp.arpOct || 4).map(n => n + tr);
      switch (sp.arp || 'up') {
        case 'up': for (let s = 0; s < 16; s++) arp.push({ t: b0 + s, dur: 1, notes: [up[s % up.length]] }); break;
        case 'updown': { const seq = [...up, ...up.slice(1, -1).reverse()]; for (let s = 0; s < 16; s++) arp.push({ t: b0 + s, dur: 1, notes: [seq[s % seq.length]] }); break; }
        case 'eighth': for (let s = 0; s < 16; s += 2) arp.push({ t: b0 + s, dur: 2, notes: [up[(s / 2) % up.length]] }); break;
        case 'strum': arp.push({ t: b0, dur: 6, notes: up }); arp.push({ t: b0 + 8, dur: 6, notes: up }); break;
        case 'pad': arp.push({ t: b0, dur: 16, notes: up }); break;
        case 'offbeat': for (let s = 2; s < 16; s += 4) arp.push({ t: b0 + s, dur: 2, notes: up }); break;
      }
      const D = DRUMS[sp.drums || 'soft'];
      for (const s of D.k) drum.push({ t: b0 + s, kind: 'k' }); for (const s of D.s) drum.push({ t: b0 + s, kind: 's' }); for (const s of D.h) drum.push({ t: b0 + s, kind: 'h' });
    });
    tracks.push({ role: 'bass', wave: sp.bassWave || 'tri', vol: sp.bassVol || .16, events: bass, env: [.005, .05, .8, .05] });
    if (sp.arp !== 'none') tracks.push({ role: 'arp', wave: sp.arpWave || (sp.arp === 'pad' ? 'sine' : 'sq12'), vol: sp.arpVol || (sp.arp === 'pad' ? .045 : .03), events: arp, env: sp.arp === 'pad' ? [.3, .3, .8, .4] : [.005, .05, .4, .05], pan: -.3 });
    tracks.push({ role: 'drum', events: drum, vol: sp.drumVol || 1 });
    return { bpm: sp.bpm, len: Math.max(total, mel.len), tracks, loop: sp.loop !== false, name: sp.name };
  }
  // ------------------------------------------------------------- songs
  const S = {};
  const song = (id, sp) => { S[id] = sp; };
  song('title', { bpm: 96, chords: ['D', 'A', 'Bm', 'G', 'D', 'A', 'G', 'A', 'Bm', 'F#m', 'G', 'D', 'Em', 'A', 'D', 'D'], arp: 'updown', bass: 'walk', drums: 'march', lead: 'sq25',
    melody: 'f#5:4 a5:4 d6:6 c#6:2 b5:4 a5:4 e5:8 f#5:4 b5:4 d6:4 c#6:4 b5:6 a5:2 g5:8 a5:4 f#5:4 d5:4 f#5:4 e5:4 a5:4 c#6:8 d6:4 b5:4 g5:4 b5:4 a5:12 r:4 b5:4 d6:4 f#6:6 e6:2 c#6:4 a5:4 f#5:8 g5:4 b5:4 d6:4 g6:4 f#6:6 e6:2 d6:8 e6:4 d6:4 b5:4 g5:4 a5:4 c#6:4 e6:8 d6:4 a5:4 f#5:4 a5:4 d6:12 r:4' });
  song('route1', { bpm: 132, chords: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'D', 'Em', 'Bm', 'C', 'G', 'Am', 'D', 'G', 'G'], arp: 'eighth', bass: 'root8', drums: 'shuffle',
    melody: 'd5:2 g5:2 b5:4 a5:2 g5:2 a5:4 f#5:4 a5:4 d6:6 r:2 e5:2 g5:2 b5:4 c6:2 b5:2 a5:4 g5:6 e5:2 c5:8 b4:2 d5:2 g5:4 b5:2 a5:2 g5:4 a5:4 f#5:4 d5:8 e5:2 g5:2 c6:4 b5:2 a5:2 g5:4 a5:12 r:4 b5:4 g5:4 e5:4 g5:4 f#5:4 d5:4 b4:4 d5:4 e5:2 g5:2 c6:4 e6:4 d6:4 b5:6 a5:2 g5:8 c6:4 b5:4 a5:4 e5:4 f#5:4 a5:4 d6:4 c6:4 b5:4 d6:4 g6:4 d6:4 g5:12 r:4' });
  song('route2', { ...S.route1, bpm: 126, transpose: 2, arp: 'updown', drums: 'march', lead: 'sq50' });
  song('route3', { bpm: 116, chords: ['A', 'F#m', 'D', 'E', 'A', 'C#m', 'D', 'E'], arp: 'eighth', bass: 'walk', drums: 'shuffle', lead: 'sq25',
    melody: 'c#6:4 e6:4 a6:6 g#6:2 f#6:4 c#6:4 a5:8 d6:4 f#6:4 a6:4 f#6:4 e6:12 r:4 a5:2 b5:2 c#6:4 e6:4 c#6:4 g#5:2 a5:2 b5:4 e6:4 c#6:4 f#6:4 d6:4 a5:4 d6:4 e6:8 g#6:4 b6:4' });
  song('route4', { bpm: 112, chords: ['D', 'C', 'G', 'D', 'D', 'C', 'Am', 'D'], arp: 'eighth', bass: 'root8', drums: 'march', lead: 'sq50', transpose: -2,
    melody: 'd5:4 f#5:4 a5:4 d6:4 c6:4 g5:4 e5:4 g5:4 b5:4 d6:4 g6:4 f#6:4 a5:12 r:4 f#5:2 a5:2 d6:4 e6:2 f#6:2 d6:4 e6:2 c6:2 g5:4 a5:2 c6:2 e6:4 e6:4 c6:4 a5:4 c6:4 d6:12 r:4' });
  song('brinehollow', { bpm: 104, chords: ['C', 'Am', 'F', 'G', 'C', 'Am', 'Dm', 'G', 'F', 'G', 'Em', 'Am', 'F', 'G', 'C', 'C'], arp: 'eighth', bass: 'walk', drums: 'soft', lead: 'sq25',
    melody: 'e5:4 g5:4 c6:6 b5:2 a5:4 e5:4 c5:8 f5:4 a5:4 c6:4 a5:4 g5:12 r:4 e5:2 f5:2 g5:4 e5:4 c5:4 c5:2 d5:2 e5:4 c5:4 a4:4 d5:4 f5:4 a5:4 f5:4 g5:8 b4:4 d5:4 a5:4 c6:4 f6:6 e6:2 d6:4 b5:4 g5:8 e6:4 d6:4 b5:4 g5:4 c6:6 b5:2 a5:8 a5:4 f5:4 c5:4 f5:4 g5:4 b5:4 d6:8 c6:4 g5:4 e5:4 g5:4 c6:12 r:4' });
  song('fernwick', { bpm: 104, chords: ['F', 'Dm', 'Bb', 'C', 'F', 'Am', 'Bb', 'C'], arp: 'updown', bass: 'walk', drums: 'soft', lead: 'sq12', arpOct: 5,
    melody: 'c6:4 a5:2 f5:2 a5:4 c6:4 d6:4 a5:4 f5:8 bb5:4 d6:4 f6:6 e6:2 e6:4 c6:4 g5:8 a5:2 bb5:2 c6:4 a5:4 f5:4 e5:2 f5:2 g5:4 e5:4 c5:4 d5:4 f5:4 bb5:4 d6:4 c6:12 r:4' });
  song('galvan', { bpm: 120, chords: ['Bb', 'Gm', 'Eb', 'F', 'Bb', 'Gm', 'Cm', 'F'], arp: 'offbeat', bass: 'octave', drums: 'battle', lead: 'sq50', drumVol: .7,
    melody: 'f5:2 r:2 bb5:2 d6:2 r:2 c6:2 bb5:4 g5:2 r:2 d5:2 g5:2 r:2 bb5:2 a5:4 g5:2 r:2 eb5:2 g5:2 bb5:4 g5:4 a5:4 c6:4 f6:4 r:4 d6:2 c6:2 bb5:2 f5:2 d5:4 f5:4 bb5:2 a5:2 g5:2 d5:2 bb4:4 d5:4 c5:2 eb5:2 g5:2 c6:2 eb6:4 d6:4 c6:8 a5:4 f5:4' });
  song('cindervale', { bpm: 108, chords: ['D', 'C', 'G', 'D', 'D', 'C', 'Am', 'D'], arp: 'strum', bass: 'root4', drums: 'march', lead: 'saw', leadVol: .08,
    melody: 'd5:4 f#5:4 a5:4 d6:4 c6:4 g5:4 e5:4 g5:4 b5:4 d6:4 g6:4 f#6:4 a5:12 r:4 f#5:2 a5:2 d6:4 e6:2 f#6:2 d6:4 e6:2 c6:2 g5:4 a5:2 c6:2 e6:4 e6:4 c6:4 a5:4 c6:4 d6:12 r:4' });
  song('duskmere', { bpm: 84, chords: ['Am', 'F', 'C', 'G', 'Am', 'F', 'E', 'E'], arp: 'pad', bass: 'long', drums: 'none', lead: 'sine', leadVol: .12,
    melody: 'e5:6 a5:2 c6:8 a5:6 f5:2 c5:8 e5:4 g5:4 c6:4 b5:4 b5:8 d6:8 c6:4 b5:4 a5:4 e5:4 f5:4 a5:4 c6:8 b5:4 g#5:4 e5:4 g#5:4 b5:12 r:4' });
  song('frostpeak', { bpm: 96, chords: ['Eb', 'Cm', 'Ab', 'Bb', 'Eb', 'Gm', 'Ab', 'Bb'], arp: 'updown', bass: 'walk', drums: 'soft', lead: 'tri', leadVol: .15, arpWave: 'sine', arpVol: .04, arpOct: 5,
    melody: 'g5:4 bb5:4 eb6:6 d6:2 c6:4 g5:4 eb5:8 ab5:4 c6:4 eb6:4 c6:4 bb5:12 r:4 eb6:2 d6:2 bb5:4 g5:4 eb5:4 d5:2 eb5:2 g5:4 bb5:4 d6:4 c6:4 ab5:4 eb5:4 ab5:4 bb5:8 d6:4 f6:4' });
  song('skyreach', { bpm: 118, chords: ['G', 'Bm', 'C', 'D', 'Em', 'C', 'A', 'D'], arp: 'eighth', bass: 'octave', drums: 'march', lead: 'sq25',
    melody: 'b5:4 d6:4 g6:6 f#6:2 f#6:4 d6:4 b5:8 c6:4 e6:4 g6:4 e6:4 d6:4 f#6:4 a6:8 g6:4 f#6:4 e6:4 b5:4 c6:4 e6:4 g6:8 a6:4 e6:4 c#6:4 e6:4 d6:12 r:4' });
  song('forest', { bpm: 100, chords: ['Em', 'D', 'C', 'D', 'Em', 'G', 'Am', 'B'], arp: 'updown', bass: 'root4', drums: 'soft', lead: 'sq12',
    melody: 'b4:4 e5:4 g5:4 f#5:4 a5:4 f#5:4 d5:8 e5:4 g5:4 c6:6 b5:2 a5:12 r:4 g5:2 a5:2 b5:4 e6:4 d6:4 b5:4 g5:4 d5:8 c6:4 b5:4 a5:4 e5:4 f#5:12 r:4' });
  song('cave', { bpm: 88, chords: ['Dm', 'C', 'Bb', 'A', 'Dm', 'C', 'Bb', 'A'], arp: 'pad', bass: 'long', drums: 'none', lead: 'tri', leadVol: .13,
    melody: 'd5:4 r:4 a5:4 r:4 g5:4 r:4 e5:8 f5:4 r:4 d5:4 f5:4 e5:12 r:4 a5:4 r:2 f5:2 d5:8 c5:4 e5:4 g5:8 bb5:4 a5:4 f5:4 d5:4 c#5:12 r:4' });
  song('icecave', { ...S.cave, transpose: 3, lead: 'sine', arpWave: 'tri' });
  song('ruins', { ...S.duskmere, transpose: -3, bpm: 76, lead: 'tri' });
  song('surf', { bpm: 108, chords: ['A', 'F#m', 'D', 'E', 'A', 'C#m', 'D', 'E'], arp: 'updown', bass: 'walk', drums: 'shuffle', lead: 'sq25', arpOct: 5,
    melody: 'c#6:4 e6:4 a6:6 g#6:2 f#6:4 c#6:4 a5:8 d6:4 f#6:4 a6:4 f#6:4 e6:12 r:4 a5:2 b5:2 c#6:4 e6:4 c#6:4 g#5:2 a5:2 b5:4 e6:4 c#6:4 f#6:4 d6:4 a5:4 d6:4 e6:8 g#6:4 b6:4' });
  song('bike', { ...S.route1, bpm: 150, transpose: 5, drums: 'fast', arp: 'up' });
  song('haven', { bpm: 92, chords: ['C', 'G', 'Am', 'F', 'C', 'G', 'F', 'C'], arp: 'eighth', bass: 'root4', drums: 'none', lead: 'tri', leadVol: .15, arpWave: 'sine',
    melody: 'g5:4 e5:4 c5:4 e5:4 d5:4 g5:4 b5:8 c6:4 a5:4 e5:4 a5:4 f5:12 r:4 e5:2 f5:2 g5:4 c6:4 g5:4 b5:4 d6:4 g5:8 a5:4 c6:4 f5:4 a5:4 c6:12 r:4' });
  song('mart', { bpm: 128, chords: ['F', 'Bb', 'C', 'F', 'Dm', 'Gm', 'C', 'F'], arp: 'offbeat', bass: 'walk', drums: 'shuffle', lead: 'sq50', drumVol: .6,
    melody: 'a5:2 c6:2 a5:2 f5:2 c6:4 a5:4 bb5:2 d6:2 bb5:2 f5:2 d6:4 bb5:4 g5:2 c6:2 e6:2 c6:2 g5:4 e5:4 f5:8 a5:4 c6:4 d6:2 f6:2 d6:2 a5:2 f5:4 a5:4 g5:2 bb5:2 d6:2 bb5:2 g5:4 d5:4 e5:2 g5:2 c6:2 e6:2 g6:4 e6:4 f6:8 c6:4 a5:4' });
  song('home', { bpm: 96, chords: ['G', 'C', 'D', 'G', 'Em', 'C', 'D', 'G'], arp: 'eighth', bass: 'walk', drums: 'none', lead: 'sq12', arpWave: 'tri',
    melody: 'd5:4 g5:4 b5:6 a5:2 g5:4 e5:4 c5:8 d5:4 f#5:4 a5:4 c6:4 b5:12 r:4 g5:4 b5:4 e6:6 d6:2 c6:4 g5:4 e5:8 f#5:4 a5:4 d6:4 c6:4 b5:12 r:4' });
  song('lab', { ...S.home, bpm: 112, arp: 'up', lead: 'sq25', transpose: 2 });
  song('house', { ...S.home, bpm: 90, transpose: -2, lead: 'tri' });
  song('gym', { bpm: 138, chords: ['D', 'G', 'A', 'D', 'Bm', 'G', 'A', 'A'], arp: 'up', bass: 'octave', drums: 'battle', lead: 'sq25',
    melody: 'a5:2 d6:2 f#6:4 e6:2 d6:2 a5:4 b5:2 d6:2 g6:4 f#6:2 e6:2 d6:4 c#6:2 e6:2 a6:4 g6:2 f#6:2 e6:4 f#6:8 d6:8 d6:4 b5:4 f#5:4 b5:4 g5:4 b5:4 d6:8 e6:4 c#6:4 a5:4 c#6:4 e6:12 r:4' });
  song('crane', { bpm: 96, chords: ['Cm', 'Ab', 'Fm', 'G', 'Cm', 'Ab', 'Bb', 'G'], arp: 'pad', bass: 'long', drums: 'soft', lead: 'sine', leadVol: .12, arpWave: 'saw', arpVol: .03,
    melody: 'g5:6 ab5:2 g5:8 eb5:6 f5:2 eb5:8 c5:4 f5:4 ab5:4 c6:4 b5:12 r:4 c6:4 bb5:4 g5:4 eb5:4 ab5:4 c6:4 eb6:8 d6:4 bb5:4 f5:4 d5:4 b4:12 r:4' });
  song('hq', { bpm: 124, chords: ['Cm', 'Cm', 'Ab', 'G', 'Cm', 'Cm', 'Fm', 'G'], arp: 'up', bass: 'pulse', drums: 'march', lead: 'sq50',
    melody: 'c5:2 c5:2 r:2 c5:2 eb5:4 g5:4 f5:2 eb5:2 d5:2 c5:2 g4:8 ab4:2 c5:2 eb5:4 ab5:4 g5:4 g5:4 f5:4 d5:4 b4:4 c6:4 bb5:2 ab5:2 g5:4 eb5:4 c5:4 eb5:4 g5:8 ab5:4 f5:4 c5:4 f5:4 b4:4 d5:4 g5:8' });
  song('tidelight', { ...S.crane, transpose: 2, bpm: 104, drums: 'march' });
  song('lighthouse', { ...S.hq, transpose: 2, bpm: 132 });
  song('tidelight_calm', { bpm: 88, chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'], arp: 'pad', bass: 'long', drums: 'none', lead: 'sine', leadVol: .13, arpWave: 'sine',
    melody: 'b5:8 e6:8 g6:8 e6:8 d6:8 b5:4 d6:4 a5:12 r:4 e6:4 f#6:4 g6:8 e6:8 c6:8 a5:4 c6:4 e6:8 d#6:12 r:4' });
  song('victoryroad', { bpm: 120, chords: ['Am', 'G', 'F', 'E', 'Am', 'G', 'F', 'G'], arp: 'eighth', bass: 'root8', drums: 'march', lead: 'sq25',
    melody: 'a5:4 c6:4 e6:4 a6:4 g6:4 d6:4 b5:4 d6:4 c6:4 a5:4 f5:4 a5:4 b5:4 g#5:4 e5:8 e6:2 d6:2 c6:4 b5:2 a5:2 e5:4 d6:2 c6:2 b5:4 a5:2 g5:2 d5:4 f5:4 a5:4 c6:4 f6:4 g6:12 r:4' });
  song('conclave', { bpm: 100, chords: ['Bb', 'F', 'Gm', 'Eb', 'Bb', 'F', 'Eb', 'F'], arp: 'strum', bass: 'walk', drums: 'march', lead: 'sq25',
    melody: 'f5:4 bb5:4 d6:6 c6:2 c6:4 a5:4 f5:8 g5:4 bb5:4 d6:4 g6:4 f6:6 eb6:2 bb5:8 d6:4 f6:4 bb6:6 a6:2 a6:4 f6:4 c6:8 eb6:4 g6:4 bb6:4 g6:4 f6:12 r:4' });
  song('elite_room', { ...S.conclave, bpm: 80, drums: 'soft', arp: 'pad', transpose: -1 });
  song('champ_room', { ...S.conclave, bpm: 72, arp: 'pad', drums: 'none', lead: 'sine' });
  song('halloffame', { bpm: 90, chords: ['C', 'F', 'G', 'C', 'Am', 'F', 'G', 'C'], arp: 'updown', bass: 'walk', drums: 'march', lead: 'sq25', arpOct: 5,
    melody: 'c6:4 e6:4 g6:6 f6:2 a6:4 f6:4 c6:8 b5:4 d6:4 g6:4 d6:4 e6:12 r:4 c6:4 e6:4 a6:6 g6:2 f6:4 c6:4 a5:8 g6:4 f6:4 d6:4 b5:4 c6:12 r:4' });
  song('credits', { ...S.brinehollow, bpm: 100, drums: 'march', arp: 'updown' });
  song('starfall', { bpm: 84, chords: ['F#m', 'D', 'A', 'E', 'F#m', 'D', 'Bm', 'C#'], arp: 'pad', bass: 'long', drums: 'none', lead: 'sine', leadVol: .13,
    melody: 'c#6:8 f#6:8 a6:8 f#6:8 e6:4 c#6:4 a5:8 b5:12 r:4 f#6:4 e6:4 c#6:8 d6:4 f#6:4 a6:8 b6:4 a6:4 f#6:8 f6:12 r:4' });
  song('spire', { ...S.gym, bpm: 110, transpose: -3, drums: 'soft' });
  song('gate', { ...S.conclave, bpm: 90, drums: 'none', arp: 'pad' });
  song('evolution', { bpm: 100, chords: ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'F', 'G'], arp: 'up', bass: 'root8', drums: 'soft', lead: 'sq25', arpOct: 5,
    melody: 'c5:4 e5:4 g5:4 c6:4 d5:4 f5:4 a5:4 d6:4 e5:4 g5:4 b5:4 e6:4 f5:4 a5:4 c6:4 f6:4 g5:4 b5:4 d6:4 g6:4 a5:4 c6:4 e6:4 a6:4 f6:4 e6:4 d6:4 c6:4 b5:8 d6:8' });
  song('intro', { ...S.title, bpm: 84, drums: 'none', arp: 'pad', lead: 'sine' });
  // battles
  song('wild', { bpm: 160, chords: ['Am', 'F', 'G', 'E', 'Am', 'F', 'G', 'Am', 'Dm', 'Am', 'E', 'Am', 'F', 'G', 'E', 'E'], arp: 'up', bass: 'pulse', drums: 'battle', lead: 'sq25', arpOct: 4,
    melody: 'e5:2 a5:2 c6:2 e6:2 d6:2 c6:2 b5:2 a5:2 c6:4 a5:4 f5:6 r:2 d5:2 g5:2 b5:2 d6:2 c6:2 b5:2 a5:2 g5:2 g#5:4 b5:4 e6:6 r:2 a5:2 c6:2 e6:4 d6:2 c6:2 a5:4 f5:2 a5:2 c6:4 a5:2 f5:2 c5:4 g5:4 b5:4 d6:4 b5:4 a5:12 r:4 d6:2 f6:2 a6:4 f6:2 d6:2 a5:4 c6:2 e6:2 a6:4 e6:2 c6:2 a5:4 b5:2 e6:2 g#6:4 f6:2 e6:2 d6:4 c6:4 b5:4 a5:8 a5:2 c6:2 f6:4 e6:2 d6:2 c6:4 b5:2 d6:2 g6:4 f6:2 e6:2 d6:4 e6:4 b5:4 g#5:4 b5:4 e6:8 d6:4 b5:4' });
  song('trainer', { bpm: 168, chords: ['Em', 'C', 'D', 'B', 'Em', 'C', 'Am', 'B', 'G', 'D', 'C', 'Am', 'C', 'D', 'B', 'B'], arp: 'up', bass: 'pulse', drums: 'battle', lead: 'sq25',
    melody: 'b4:2 e5:2 g5:2 b5:2 a5:2 g5:2 f#5:2 e5:2 g5:4 e5:4 c5:4 e5:4 f#5:2 a5:2 d6:2 f#6:2 e6:2 d6:2 c6:2 a5:2 d#6:4 b5:4 f#5:4 b5:4 e6:4 d6:2 b5:2 g5:4 b5:4 c6:4 b5:2 g5:2 e5:4 g5:4 a5:2 c6:2 e6:4 d6:2 c6:2 a5:4 b5:12 r:4 d6:4 b5:4 g5:4 b5:4 a5:4 f#5:4 d5:4 f#5:4 e5:2 g5:2 c6:4 e6:4 c6:4 a5:4 e5:4 c5:4 e5:4 g5:2 c6:2 e6:4 g6:4 e6:4 f#6:2 d6:2 a5:4 d6:4 f#6:4 d#6:4 f#6:4 b6:4 a6:4 b6:8 f#6:4 d#6:4' });
  song('gym_battle', { bpm: 172, chords: ['Cm', 'Ab', 'Bb', 'G', 'Cm', 'Ab', 'Fm', 'G', 'Eb', 'Bb', 'Ab', 'G', 'Fm', 'Ab', 'G', 'G'], arp: 'up', bass: 'pulse', drums: 'heavy', lead: 'sq25', harmWave: 'sq50',
    melody: 'c5:2 eb5:2 g5:4 c6:4 bb5:2 g5:2 ab5:4 eb5:4 c5:4 eb5:4 d5:2 f5:2 bb5:4 d6:4 c6:2 bb5:2 b5:4 g5:4 d5:4 g5:4 g5:2 c6:2 eb6:4 d6:2 c6:2 g5:4 ab5:2 c6:2 eb6:4 c6:2 ab5:2 eb5:4 f5:4 ab5:4 c6:4 f6:4 d6:8 b5:4 g5:4 eb6:4 bb5:4 g5:4 bb5:4 d6:4 bb5:4 f5:4 bb5:4 c6:4 ab5:4 eb5:4 ab5:4 b5:4 d6:4 g6:8 ab6:4 f6:4 c6:4 f6:4 eb6:4 c6:4 ab5:4 c6:4 d6:4 f6:4 g6:4 b6:4 g6:8 d6:4 b5:4' });
  song('rival', { bpm: 164, chords: ['F', 'C', 'Dm', 'Bb', 'F', 'C', 'Bb', 'C', 'Dm', 'Am', 'Bb', 'F', 'Gm', 'C', 'F', 'F'], arp: 'up', bass: 'pulse', drums: 'battle', lead: 'sq25',
    melody: 'c5:2 f5:2 a5:2 c6:2 a5:2 f5:2 c6:4 e6:4 c6:4 g5:4 c6:4 d6:2 a5:2 f5:2 a5:2 d6:2 f6:2 e6:2 d6:2 d6:4 bb5:4 f5:8 a5:2 c6:2 f6:4 e6:2 d6:2 c6:4 g5:2 c6:2 e6:4 d6:2 c6:2 g5:4 f5:4 bb5:4 d6:4 f6:4 e6:12 r:4 f6:4 e6:4 d6:4 a5:4 e6:4 c6:4 a5:4 e5:4 f5:2 bb5:2 d6:4 f6:4 d6:4 c6:6 a5:2 f5:8 g5:2 bb5:2 d6:4 g6:4 f6:4 e6:4 g6:4 c7:4 bb6:4 a6:4 f6:4 c6:4 a5:4 f6:12 r:4' });
  song('villain_battle', { ...S.hq, bpm: 164, drums: 'battle', bass: 'pulse', arp: 'up' });
  song('admin_battle', { ...S.gym_battle, transpose: -2, bpm: 166 });
  song('crane_battle', { ...S.gym_battle, transpose: 2, bpm: 156, lead: 'saw', leadVol: .09 });
  song('elite', { ...S.gym_battle, transpose: 3, bpm: 176 });
  song('champion', { bpm: 176, chords: ['Dm', 'Bb', 'C', 'A', 'Dm', 'Bb', 'Gm', 'A', 'F', 'C', 'Bb', 'Gm', 'Bb', 'C', 'A', 'A'], arp: 'up', bass: 'pulse', drums: 'heavy', lead: 'sq25',
    melody: 'd5:2 f5:2 a5:2 d6:2 f6:4 e6:2 d6:2 d6:4 bb5:4 f5:4 bb5:4 e6:2 c6:2 g5:2 c6:2 e6:4 g6:4 c#6:8 a5:4 e5:4 a5:2 d6:2 f6:4 a6:4 g6:2 f6:2 f6:4 d6:4 bb5:4 d6:4 g6:4 bb6:4 d7:4 bb6:4 a6:12 r:4 c6:4 f6:4 a6:4 f6:4 g6:4 e6:4 c6:4 e6:4 f6:4 d6:4 bb5:4 d6:4 g6:6 f6:2 d6:8 bb6:4 a6:4 g6:4 f6:4 e6:4 g6:4 c7:8 c#7:4 a6:4 e6:4 c#6:4 a6:8 e6:4 c#6:4' });
  song('wanderer', { ...S.trainer, transpose: 3, bpm: 184, drums: 'heavy' });
  song('spire_battle', { ...S.trainer, transpose: -2, bpm: 164 });
  song('legend', { bpm: 112, chords: ['Em', 'C', 'G', 'D', 'Em', 'C', 'Am', 'B'], arp: 'up', arpWave: 'sine', bass: 'octave', drums: 'heavy', lead: 'sine', leadVol: .14,
    melody: 'b5:8 e6:8 g6:8 e6:8 d6:8 b5:4 d6:4 a5:12 r:4 e6:4 f#6:4 g6:8 e6:8 c6:8 a5:4 c6:4 e6:8 d#6:12 r:4' });
  // short loops
  song('encounter', { bpm: 150, chords: ['Em', 'C'], arp: 'up', bass: 'pulse', drums: 'fast', lead: 'sq25', melody: 'e5:2 g5:2 b5:2 e6:2 d6:2 b5:2 g5:4 c6:2 e6:2 g6:4 f#6:2 e6:2 b5:4' });
  song('encounter_villain', { bpm: 140, chords: ['Cm', 'Ab'], arp: 'up', bass: 'pulse', drums: 'march', lead: 'sq50', melody: 'c5:2 c5:2 eb5:4 g5:2 f5:2 eb5:4 ab4:2 c5:2 eb5:4 d5:4 b4:4' });
  song('encounter_boss', { bpm: 130, chords: ['Dm', 'A'], arp: 'pad', bass: 'octave', drums: 'march', lead: 'saw', leadVol: .08, melody: 'd5:4 f5:4 a5:8 c#6:4 e6:4 a6:8' });
  song('victory_wild', { bpm: 140, chords: ['C', 'G', 'F', 'G'], arp: 'eighth', bass: 'walk', drums: 'soft', lead: 'sq25', melody: 'c6:2 e6:2 g6:4 e6:4 d6:4 b5:4 g5:8 a5:2 c6:2 f6:4 e6:2 d6:2 c6:4 d6:8 g5:8' });
  song('victory_trainer', { bpm: 132, chords: ['G', 'C', 'D', 'G', 'Em', 'C', 'D', 'G'], arp: 'eighth', bass: 'walk', drums: 'soft', lead: 'sq25', melody: 'g5:2 b5:2 d6:4 g6:4 f#6:2 e6:2 e6:4 c6:4 g5:8 f#5:2 a5:2 d6:4 a5:4 f#5:4 g5:12 r:4 b5:4 e6:4 g6:4 e6:4 c6:4 e6:4 g6:8 a6:4 f#6:4 d6:4 a5:4 g5:12 r:4' });
  song('victory_gym', { ...S.victory_trainer, transpose: 2, lead: 'sq50', drums: 'march' });
  song('victory_champion', { ...S.halloffame, bpm: 110 });
  const ALIAS = { route5: 'surf', route6: 'surf', glimmercave: 'cave', glaciapass: 'icecave' };
  // jingles (non-looping)
  const J = {
    heal: { bpm: 140, seq: 'c6:2 e6:2 g6:2 c7:4 r:2 g6:2 c7:8', wave: 'sq25' },
    caught: { bpm: 150, seq: 'g5:2 c6:2 e6:2 g6:4 e6:2 g6:2 c7:8 r:2 b6:2 c7:8', wave: 'sq25' },
    levelup: { bpm: 170, seq: 'c6:2 e6:2 g6:2 c7:6', wave: 'sq25' },
    itemget: { bpm: 150, seq: 'g5:2 b5:2 d6:2 g6:6', wave: 'sq25' },
    keyitem: { bpm: 140, seq: 'd6:2 f#6:2 a6:2 d7:4 r:2 a6:2 d7:8', wave: 'sq25' },
    badge: { bpm: 130, seq: 'c6:3 c6:1 c6:2 e6:2 g6:4 e6:2 g6:2 c7:8 r:2 g6:2 c7:2 e7:10', wave: 'sq25' },
    newmon: { bpm: 140, seq: 'e6:2 g6:2 c7:4 b6:2 g6:2 c7:8', wave: 'sq25' },
    dex: { bpm: 150, seq: 'c6:2 g6:2 e6:2 c7:6', wave: 'tri' },
    evolved: { bpm: 130, seq: 'g5:2 c6:2 e6:2 g6:4 f6:2 a6:2 c7:4 b6:2 d7:2 g7:8', wave: 'sq25' },
    learn: { bpm: 170, seq: 'e6:2 g6:2 c7:6', wave: 'sq25' },
  };
  // ------------------------------------------------------------- engine
  function initWaves() {
    const pulse = duty => { const n = 64, re = new Float32Array(n), im = new Float32Array(n); for (let k = 1; k < n; k++) { re[k] = 0; im[k] = 2 / (k * Math.PI) * Math.sin(k * Math.PI * duty); } return ctx.createPeriodicWave(re, im); };
    waves.sq12 = pulse(.125); waves.sq25 = pulse(.25); waves.sq50 = pulse(.5);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const len = ctx.sampleRate * 1.6, ir = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const ch = ir.getChannelData(c); for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    reverb = ctx.createConvolver(); reverb.buffer = ir;
  }
  function osc(wave, f, t) {
    const o = ctx.createOscillator();
    if (waves[wave]) o.setPeriodicWave(waves[wave]); else o.type = wave === 'tri' ? 'triangle' : wave === 'saw' ? 'sawtooth' : wave === 'sine' ? 'sine' : 'square';
    o.frequency.setValueAtTime(f, t); return o;
  }
  function playNote(bus, wave, f, t, dur, vol, env, o = {}) {
    const [a, d, s, r] = env; const g = ctx.createGain(); const O = osc(wave, f, t);
    let node = O;
    if (wave === 'saw') { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; O.connect(lp); node = lp; }
    node.connect(g);
    if (o.pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = o.pan; g.connect(p); p.connect(bus); } else g.connect(bus);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + a); g.gain.linearRampToValueAtTime(vol * s, t + a + d);
    const end = t + Math.max(dur, a + d); g.gain.setValueAtTime(vol * s, end); g.gain.linearRampToValueAtTime(0, end + r);
    if (o.vib && dur > .2) { const l = ctx.createOscillator(), lg = ctx.createGain(); l.frequency.value = 5.5; lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .012, t + .25); l.connect(lg); lg.connect(O.frequency); l.start(t); l.stop(end + r + .05); }
    if (o.slide) O.frequency.exponentialRampToValueAtTime(Math.max(20, o.slide), end);
    O.start(t); O.stop(end + r + .05);
    return g;
  }
  function drum(kind, t, bus, vol = 1) {
    if (kind === 'k') { const O = ctx.createOscillator(), g = ctx.createGain(); O.frequency.setValueAtTime(150, t); O.frequency.exponentialRampToValueAtTime(42, t + .12); g.gain.setValueAtTime(.32 * vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); O.connect(g); g.connect(bus); O.start(t); O.stop(t + .2); return; }
    const src = ctx.createBufferSource(); src.buffer = noiseBuf; const f = ctx.createBiquadFilter(); const g = ctx.createGain();
    if (kind === 's') { f.type = 'bandpass'; f.frequency.value = 1900; f.Q.value = .8; g.gain.setValueAtTime(.2 * vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); }
    else { f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(.05 * vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .04); }
    src.connect(f); f.connect(g); g.connect(bus); src.start(t, Math.random() * .5); src.stop(t + .2);
  }
  function schedule() {
    if (!ctx || !cur) return;
    const sd = 60 / cur.bpm / 4; const ahead = ctx.currentTime + .25;
    while (nextTime < ahead) {
      if (step >= cur.len) { if (!cur.loop) { cur = null; return; } step = 0; }
      if (nextTime >= jingleUntil - .02) for (const tr of cur.tracks) {
        for (const e of tr.evIndex[step] || []) {
          if (tr.role === 'drum') drum(e.kind, nextTime, synthBus, tr.vol);
          else for (const n of e.notes) playNote(synthBus, tr.wave, freq(n), nextTime, e.dur * sd * .95, tr.vol, tr.env, { vib: tr.vib, pan: tr.pan });
        }
      }
      step++; nextTime += sd;
    }
  }
  function prep(songDef) {
    const s = buildSong(songDef);
    for (const tr of s.tracks) { tr.evIndex = {}; for (const e of tr.events) { const k = Math.round(e.t); (tr.evIndex[k] = tr.evIndex[k] || []).push(e); } }
    return s;
  }

  // ------------------------------------------------------------- streamed soundtrack (pre-rendered MP3s)
  let duckNode = null, jingleBus = null, synthBus = null, track = null, pending = null, musicTicket = 0, varTick = 0;
  const MF = () => (typeof G !== 'undefined' && G.MUSIC_FILES) || {};
  const buffers = new Map(), loading = new Map(), failed = new Set();
  const PREWARM = ['wild', 'trainer', 'encounter', 'victory_wild', 'victory_trainer', 'haven', 'mart'];
  const CACHE_SECONDS = 420;   // keep roughly this much decoded audio around (LRU)
  function touch(id) { const b = buffers.get(id); buffers.delete(id); buffers.set(id, b); return b; }
  function load(id) {
    if (buffers.has(id)) return Promise.resolve(touch(id));
    if (loading.has(id)) return loading.get(id);
    const m = MF()[id]; if (!m) return Promise.reject(new Error('no track ' + id));
    const p = fetch(m.file).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(ab => new Promise((res, rej) => ctx.decodeAudioData(ab, res, rej)))
      .then(buf => { loading.delete(id); buffers.set(id, buf); trimCache(); return buf; })
      .catch(e => { loading.delete(id); failed.add(id); console.warn('music file unavailable, using synth fallback:', id, e && e.message); throw e; });
    loading.set(id, p); return p;
  }
  function trimCache() {
    let total = 0;
    for (const k of [...buffers.keys()].reverse()) {
      const keep = k.startsWith('j_') || (track && track.id === k) || k === pending;
      total += keep ? 0 : buffers.get(k).duration;
      if (!keep && total > CACHE_SECONDS) buffers.delete(k);
    }
  }
  function variantFor(id) {
    const n = id + '@night';
    if (!MF()[n]) return id;
    if (A.forceVariant) return A.forceVariant === 'night' ? n : id;
    return G.clock && G.clock.isNight && G.save && G.clock.isNight() ? n : id;
  }
  let paused = null;   // { id, pos, meta } while the Music Room has the track paused
  function startTrack(id, buf, offset, fade) {
    const m = MF()[id], now = ctx.currentTime, t0 = now + .02;
    const src = ctx.createBufferSource(); src.buffer = buf;
    if (m.loop) { src.loop = true; src.loopStart = m.loopStart; src.loopEnd = m.loopEnd; }
    const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(1, t0 + fade);
    src.connect(g); g.connect(musicBus);
    src.start(t0, Math.max(0, Math.min(offset, buf.duration - .05)));
    if (track) fadeOutTrack(track, fade);
    track = { id, src, gain: g, t0, off: offset, meta: m };
    src.onended = () => { if (track && track.src === src) track = null; };
  }
  function fadeOutTrack(tr, fade) {
    const now = ctx.currentTime;
    try { tr.gain.gain.cancelScheduledValues(now); tr.gain.gain.setValueAtTime(tr.gain.gain.value, now); tr.gain.gain.linearRampToValueAtTime(0, now + fade); tr.src.stop(now + fade + .05); } catch (e) { }
  }
  function position(tr) {
    const m = tr.meta; let p = tr.off + Math.max(0, ctx.currentTime - tr.t0);
    if (m.loop && p >= m.loopEnd) p = m.loopStart + ((p - m.loopStart) % (m.loopEnd - m.loopStart));
    return p;
  }
  // both arrangements share the same score, so map the musical position across and crossfade slowly
  function syncSwitch(newId, fade = 3.0) {
    if (!buffers.has(newId)) { load(newId).then(() => { if (fade < 1 && track && variantFor(curId) === newId) syncSwitch(newId, fade); }).catch(() => { }); return; }
    const m1 = track.meta, m2 = MF()[newId];
    const p = position(track) + .02, I = m1.intro || 0, L = m1.loopEnd - m1.loopStart;
    const q = p < I ? p : (m2.intro || 0) + ((p - I) % L);
    startTrack(newId, touch(newId), q, fade);
  }
  function playJingle(buf) {
    const t = ctx.currentTime + .02, d = buf.duration;
    const src = ctx.createBufferSource(); src.buffer = buf; src.connect(jingleBus); src.start(t);
    // duck the music under the jingle, then bring it back
    const gn = duckNode.gain; gn.cancelScheduledValues(t); gn.setValueAtTime(gn.value, t); gn.linearRampToValueAtTime(0, t + .08);
    gn.setValueAtTime(0, t + Math.max(.2, d - 1.1)); gn.linearRampToValueAtTime(1, t + d + .4);
  }
  function stopSynth() { cur = null; }
  function synthMusic(id) {
    const def = S[id] || S.route1;
    cache[id] = cache[id] || prep(def);
    const now = ctx.currentTime;
    cur = cache[id]; step = 0; nextTime = now + .16;
  }
  function synthJingle(id) {
    const j = J[id]; if (!j) return;
    const p = parseSeq(j.seq), sd = 60 / j.bpm / 4, t0 = ctx.currentTime + .03;
    for (const e of p.events) for (const n of e.notes) { playNote(sfxBus, j.wave, freq(n), t0 + e.t * sd, e.dur * sd * .9, .13, [.005, .05, .7, .08], { vib: true }); playNote(sfxBus, 'tri', freq(n - 12), t0 + e.t * sd, e.dur * sd * .9, .09, [.005, .05, .7, .08]); }
    jingleUntil = t0 + p.len * sd + .15;
    const gn = duckNode.gain; gn.cancelScheduledValues(ctx.currentTime); gn.setValueAtTime(gn.value, ctx.currentTime); gn.linearRampToValueAtTime(0, ctx.currentTime + .05);
    gn.setValueAtTime(0, jingleUntil); gn.linearRampToValueAtTime(1, jingleUntil + .3);
  }
  function setup() {
    if (ctx) return;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      comp = ctx.createDynamicsCompressor(); comp.threshold.value = -10; comp.ratio.value = 2.5;
      master = ctx.createGain(); master.gain.value = A.silent ? 0 : 1; master.connect(comp); comp.connect(ctx.destination);
      musicBus = ctx.createGain(); sfxBus = ctx.createGain(); sfxBus.connect(master);
      duckNode = ctx.createGain(); musicBus.connect(duckNode); duckNode.connect(master);
      jingleBus = ctx.createGain(); jingleBus.connect(master);
      initWaves();
      revSend = ctx.createGain(); revSend.gain.value = .22; synthBus = ctx.createGain(); synthBus.connect(musicBus); synthBus.connect(revSend); revSend.connect(reverb); reverb.connect(musicBus);
      A.setVolumes();
      // jingles are tiny; decode them up front so they fire exactly on cue
      for (const k of Object.keys(MF())) if (k.startsWith('j_')) load(k).catch(() => { });
      if (curId) { const id = curId; curId = null; A.music(id); }
      setTimeout(() => { for (const k of PREWARM) if (MF()[k]) load(k).catch(() => { }); }, 4000);
    } catch (e) { ctx = null; console.warn('audio unavailable', e); }
  }
  const cache = {};
  const A = {
    muted: typeof location !== 'undefined' && /[?&]mute\b/.test(location.search),
    silent: typeof location !== 'undefined' && /[?&]silent\b/.test(location.search),   // full engine, zero output
    forceVariant: null,   // 'day' | 'night' pins the arrangement (Music Room)
    // The audio graph is built at boot, suspended (browsers only let sound start after a click or key
    // press). The title music is fetched and decoded meanwhile and scheduled at time zero, so the very
    // first input resumes the context and the music is simply there, from its first note.
    init() { if (!A.muted) setup(); },
    unlock() {
      if (A.muted) return;   // index.html?mute : silent test runs
      if (!ctx) setup();
      if (ctx && ctx.state === 'suspended') { const p = ctx.resume(); if (p && p.catch) p.catch(() => { }); }
    },
    suspended: () => !A.muted && (!ctx || ctx.state !== 'running'),
    setVolumes() {
      if (!ctx) return;
      musicBus.gain.setTargetAtTime(G.settings.music * .9, ctx.currentTime, .05);
      jingleBus.gain.setTargetAtTime(G.settings.music * .9, ctx.currentTime, .05);
      sfxBus.gain.setTargetAtTime(G.settings.sfx, ctx.currentTime, .02);
    },
    music(id) {
      if (!id) return;
      id = ALIAS[id] || id;
      if (paused && paused.id.split('@')[0] !== id) paused = null;
      if (id === curId && (track || cur || pending)) return;
      curId = id;
      if (!ctx) return;
      const want = variantFor(id);
      const ticket = ++musicTicket;
      if (MF()[want] && !failed.has(want)) {
        stopSynth();
        if (buffers.has(want)) { startTrack(want, touch(want), 0, .3); return; }
        if (track) { fadeOutTrack(track, .35); track = null; }
        pending = want;
        const other = want.endsWith('@night') ? id : id + '@night';
        if (MF()[other] && A.forceVariant) load(other).catch(() => { });
        load(want).then(buf => { if (ticket !== musicTicket) return; pending = null; startTrack(want, buf, 0, .25); })
          .catch(() => { if (ticket !== musicTicket) return; pending = null; synthMusic(id); });
        return;
      }
      if (track) { fadeOutTrack(track, .35); track = null; }
      synthMusic(id);
    },
    // swap day/night arrangements right now (Music Room), same bar and beat, with a short crossfade
    switchVariantNow() {
      if (!ctx || !track || !curId) return;
      const want = variantFor(curId);
      if (want !== track.id) syncSwitch(want, .25);
    },
    stopMusic() { musicTicket++; pending = null; paused = null; if (track) { fadeOutTrack(track, .5); track = null; } stopSynth(); curId = null; },
    // music-player controls (Music Room): jump to a time, pause and pick up again where it stopped
    seek(t) {
      if (paused) { paused.pos = Math.max(0, Math.min(t, (paused.meta.loopEnd || paused.meta.duration) - .05)); return; }
      if (!ctx || !track || !buffers.has(track.id)) return;
      const m = track.meta; t = Math.max(0, Math.min(t, (m.loopEnd || m.duration) - .05));
      startTrack(track.id, touch(track.id), t, .04);
    },
    pause() { if (!ctx || !track || paused) return; paused = { id: track.id, pos: position(track), meta: track.meta }; fadeOutTrack(track, .06); track = null; },
    resume() { if (!ctx || !paused) return; const p = paused; paused = null; if (buffers.has(p.id)) startTrack(p.id, touch(p.id), p.pos, .06); else load(p.id).then(buf => startTrack(p.id, buf, p.pos, .06)).catch(() => { }); },
    isPaused: () => !!paused,
    currentMusic: () => curId,
    // what is playing right now, for the sound test / debugging
    nowPlaying() { if (paused) { const m = paused.meta; return { id: paused.id, title: m.title, pos: paused.pos, loopStart: m.loopStart, loopEnd: m.loopEnd, paused: true }; } if (!track) return null; const m = track.meta; return { id: track.id, title: m.title, pos: position(track), loopStart: m.loopStart, loopEnd: m.loopEnd }; },
    jingle(id) {
      if (!ctx) return;
      const jid = 'j_' + id;
      if (MF()[jid] && !failed.has(jid)) {
        if (buffers.has(jid)) { playJingle(touch(jid)); return; }
        load(jid).then(playJingle).catch(() => synthJingle(id));
        return;
      }
      synthJingle(id);
    },
    // ambient beds (procedural): waves, birds, wind, cave drips; crossfade on change
    ambience(kind) {
      if (!ctx || A._ambKind === kind) return;
      A._ambKind = kind;
      const old = A._amb; A._amb = null;
      if (old) { old.g.gain.setTargetAtTime(0, ctx.currentTime, .6); setTimeout(() => { try { old.stop(); } catch (e) { } }, 3000); }
      if (!kind || A.muted || A.silent) return;
      const g = ctx.createGain(); g.gain.value = 0; g.connect(sfxBus); g.gain.setTargetAtTime(1, ctx.currentTime, .8);
      const nodes = [], timers = [];
      const loopNoise = (type, f, q, v) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; s.loop = true; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.value = f; fl.Q.value = q; const gg = ctx.createGain(); gg.gain.value = v; s.connect(fl); fl.connect(gg); gg.connect(g); s.start(); nodes.push(s); return { s, fl, gg }; };
      const lfo = (param, rate, depth, base) => { const o = ctx.createOscillator(); o.frequency.value = rate; const d = ctx.createGain(); d.gain.value = depth; o.connect(d); d.connect(param); param.value = base; o.start(); nodes.push(o); };
      if (kind === 'coast') { const w = loopNoise('lowpass', 500, .7, .05); lfo(w.gg.gain, .11, .035, .045); lfo(w.fl.frequency, .11, 260, 520); }
      if (kind === 'wind' || kind === 'coast') { const w = loopNoise('bandpass', 700, 1.2, .018); lfo(w.fl.frequency, .07, 300, 700); }
      if (kind === 'birds') {
        const chirp = () => { if (!A._amb || A._amb.kind !== 'birds') return; const t0 = ctx.currentTime + .02, n = 2 + Math.floor(Math.random() * 3), f0 = 2600 + Math.random() * 1400;
          for (let i = 0; i < n; i++) playNote(g, 'sine', f0 * (1 + (i % 2) * .12), t0 + i * .09, .06, .012, [.004, .02, .5, .03], { slide: f0 * 1.25 });
          timers.push(setTimeout(chirp, 1500 + Math.random() * 5000)); };
        timers.push(setTimeout(chirp, 800));
        const w = loopNoise('bandpass', 900, .8, .006); lfo(w.fl.frequency, .05, 300, 900);
      }
      if (kind === 'cave') {
        const drip = () => { if (!A._amb || A._amb.kind !== 'cave') return; const t0 = ctx.currentTime + .02, f = 900 + Math.random() * 900; playNote(g, 'sine', f, t0, .09, .03, [.001, .02, .3, .08], { slide: f * 1.6 }); timers.push(setTimeout(drip, 900 + Math.random() * 3500)); };
        timers.push(setTimeout(drip, 500));
        const w = loopNoise('lowpass', 200, .5, .02);
      }
      A._amb = { kind, g, stop() { for (const n of nodes) try { n.stop(); } catch (e) { } for (const t of timers) clearTimeout(t); g.disconnect(); } };
    },
    update() {
      if (!ctx) return;
      schedule();
      // day/night: when the clock turns, crossfade to the other arrangement at the same bar
      if (++varTick % 90 === 0 && track && curId && !pending) {
        const want = variantFor(curId);
        if (want !== track.id && (track.id === curId || track.id === curId + '@night')) syncSwitch(want);
      }
    },
    // ------------------------------------------------------------- sfx
    sfx(id) {
      if (!ctx) return;
      const t = ctx.currentTime + .005, B = sfxBus;
      const tone = (f, d, w = 'sq25', v = .12, o = {}) => playNote(B, w, f, t + (o.at || 0), d, v, o.env || [.002, .02, .6, .04], o);
      const noise = (d, fType, fq, v = .2, o = {}) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; const f = ctx.createBiquadFilter(); f.type = fType; f.frequency.setValueAtTime(fq, t + (o.at || 0)); if (o.to) f.frequency.exponentialRampToValueAtTime(o.to, t + (o.at || 0) + d); const g = ctx.createGain(); g.gain.setValueAtTime(v, t + (o.at || 0)); g.gain.exponentialRampToValueAtTime(.001, t + (o.at || 0) + d); s.connect(f); f.connect(g); g.connect(B); s.start(t + (o.at || 0), Math.random() * .3); s.stop(t + (o.at || 0) + d + .05); };
      switch (id) {
        case 'cursor': tone(1320, .03, 'sq50', .06); break;
        case 'shatter': noise(.35, 'highpass', 5000, .22, { to: 9000 }); for (let i = 0; i < 5; i++) tone(2200 + Math.random() * 2000, .05, 'sine', .04, { at: i * .03 }); break;
        // footsteps by surface (kept very quiet: felt more than heard)
        case 'fs_grass': noise(.07, 'bandpass', 2600, .035); break;
        case 'fs_sand': noise(.09, 'lowpass', 1400, .045); break;
        case 'fs_wood': tone(170, .05, 'tri', .07, { slide: 120 }); noise(.03, 'bandpass', 1200, .03); break;
        case 'fs_stone': tone(420, .025, 'tri', .035); noise(.03, 'highpass', 3500, .025); break;
        case 'fs_snow': noise(.12, 'lowpass', 900, .05, { to: 400 }); break;
        case 'fs_water': noise(.16, 'bandpass', 900, .05, { to: 2400 }); noise(.08, 'highpass', 4000, .02, { at: .05 }); break;   // a swimming stroke
        case 'rustle': noise(.18, 'bandpass', 3200, .09, { to: 1800 }); noise(.1, 'highpass', 5000, .04, { at: .06 }); break;
        case 'select': tone(990, .04, 'sq25', .08); tone(1480, .06, 'sq25', .08, { at: .04 }); break;
        case 'back': tone(880, .04, 'sq25', .07); tone(660, .06, 'sq25', .07, { at: .04 }); break;
        case 'buzz': tone(140, .12, 'sq50', .09); break;
        case 'bump': tone(90, .08, 'tri', .18, { slide: 60 }); break;
        case 'page': noise(.06, 'highpass', 3000, .08); break;
        case 'text': tone(880 + Math.random() * 120, .025, 'sq25', .025); break;
        case 'menu_open': tone(660, .04, 'sq25', .06); tone(990, .05, 'sq25', .06, { at: .035 }); noise(.05, 'highpass', 4000, .04); break;
        case 'menu_close': tone(990, .04, 'sq25', .05); tone(660, .05, 'sq25', .05, { at: .035 }); break;
        case 'door': noise(.25, 'lowpass', 2000, .15, { to: 300 }); tone(220, .1, 'tri', .08); break;
        case 'stairs': for (let i = 0; i < 3; i++) tone(300 - i * 40, .05, 'tri', .1, { at: i * .08 }); break;
        case 'jump': tone(400, .15, 'sq25', .08, { slide: 900 }); break;
        case 'hit': noise(.12, 'lowpass', 3000, .3); tone(180, .1, 'tri', .18, { slide: 60 }); break;
        case 'hit_super': noise(.2, 'lowpass', 5000, .38); tone(240, .16, 'sq50', .14, { slide: 50 }); tone(120, .2, 'tri', .2, { slide: 40 }); break;
        case 'hit_weak': noise(.08, 'lowpass', 1500, .18); tone(140, .06, 'tri', .1); break;
        case 'faint': tone(600, .5, 'sq25', .1, { slide: 80 }); break;
        case 'heal': [0, 4, 7, 12].forEach((n, i) => tone(freq(72 + n), .08, 'sq25', .07, { at: i * .06 })); break;
        case 'statup': for (let i = 0; i < 6; i++) tone(500 + i * 120, .05, 'sq25', .06, { at: i * .04 }); break;
        case 'statdown': for (let i = 0; i < 6; i++) tone(1100 - i * 120, .05, 'sq25', .06, { at: i * .04 }); break;
        case 'throw': noise(.25, 'bandpass', 800, .12, { to: 3000 }); break;
        case 'pop': tone(700, .06, 'sq50', .12, { slide: 1400 }); noise(.08, 'highpass', 2000, .12); break;
        case 'shake': tone(300, .04, 'tri', .12); noise(.04, 'highpass', 4000, .08); break;
        case 'click': tone(1200, .03, 'sq50', .12); tone(1800, .04, 'sq50', .1, { at: .05 }); break;
        case 'land': tone(160, .06, 'tri', .15, { slide: 90 }); break;
        case 'recall': tone(300, .2, 'sq25', .08, { slide: 1500 }); break;
        case 'exp': for (let i = 0; i < 8; i++) tone(900 + i * 60, .03, 'sq50', .03, { at: i * .03 }); break;
        case 'money': tone(1568, .05, 'sq25', .08); tone(2093, .12, 'sq25', .08, { at: .06 }); break;
        case 'item': case 'ability': [0, 7, 12].forEach((n, i) => tone(freq(84 + n), .08, 'sine', .08, { at: i * .05 })); break;
        case 'exclaim': tone(1400, .05, 'sq25', .1); tone(1800, .1, 'sq25', .1, { at: .05 }); break;
        case 'sparkle': case 'shiny': [0, 4, 7, 12, 16].forEach((n, i) => tone(freq(88 + n), .06, 'sine', .07, { at: i * .05 })); break;
        case 'cut': noise(.15, 'highpass', 2500, .2); break;
        case 'smash': noise(.35, 'lowpass', 1200, .35, { to: 200 }); tone(100, .2, 'tri', .2, { slide: 40 }); break;
        case 'push': noise(.4, 'lowpass', 300, .25); break;
        case 'surf': noise(.4, 'bandpass', 900, .2, { to: 300 }); break;
        case 'bike': tone(2000, .05, 'sine', .08); tone(2600, .1, 'sine', .08, { at: .07 }); break;
        case 'thunder': noise(1.2, 'lowpass', 800, .4, { to: 60 }); break;
        case 'fly': case 'battle_start': noise(.5, 'bandpass', 400, .18, { to: 3000 }); break;
        case 'warp': tone(200, .4, 'sine', .1, { slide: 1600 }); tone(1600, .4, 'sine', .06, { slide: 200 }); break;
        case 'save': [0, 4, 7, 12].forEach((n, i) => tone(freq(76 + n), .1, 'tri', .1, { at: i * .08 })); break;
        case 'pc_on': tone(600, .06, 'sq50', .06); tone(900, .08, 'sq50', .06, { at: .07 }); break;
        case 'pc_off': tone(900, .06, 'sq50', .06); tone(600, .08, 'sq50', .06, { at: .07 }); break;
        case 'cast': noise(.2, 'highpass', 1500, .12, { to: 5000 }); break;
        case 'switch': tone(500, .05, 'sq50', .1); tone(1000, .08, 'sq50', .1, { at: .06 }); break;
        case 'shatter': noise(.4, 'highpass', 3000, .3); for (let i = 0; i < 5; i++) tone(2000 + Math.random() * 2000, .05, 'sine', .05, { at: i * .05 }); break;
        case 'protect': tone(800, .3, 'sine', .08, { slide: 1200 }); break;
        case 'charge': tone(200, .5, 'sq25', .06, { slide: 800 }); break;
        case 'resonate': tone(220, 1, 'saw', .08, { slide: 880 }); [0, 7, 12, 19, 24].forEach((n, i) => tone(freq(72 + n), .3, 'sine', .07, { at: .2 + i * .08 })); break;
        case 'resonate_on': tone(660, .08, 'sine', .08); tone(990, .12, 'sine', .08, { at: .06 }); break;
        case 'quest': [0, 5, 9].forEach((n, i) => tone(freq(79 + n), .1, 'tri', .1, { at: i * .07 })); break;
        case 'toss': noise(.1, 'lowpass', 800, .1); break;
        case 'swap': tone(700, .04, 'sq25', .07); tone(500, .04, 'sq25', .07, { at: .05 }); break;
        case 'learn': tone(1046, .06, 'sq25', .08); tone(1568, .1, 'sq25', .08, { at: .07 }); break;
        case 'evo_pulse': tone(440, .12, 'sine', .08, { slide: 660 }); break;
        case 'evo_done': noise(.6, 'highpass', 2000, .2); [0, 4, 7, 12].forEach((n, i) => tone(freq(72 + n), .2, 'sine', .08, { at: i * .06 })); break;
        case 'weather': noise(.8, 'bandpass', 600, .12, { to: 2000 }); break;
        case 'lowhp': tone(1000, .08, 'sq50', .05); tone(1000, .08, 'sq50', .05, { at: .16 }); break;
        case 'run': for (let i = 0; i < 4; i++) noise(.04, 'lowpass', 600, .12, { at: i * .09 }); break;
        case 'status_brn': noise(.3, 'bandpass', 1200, .15, { to: 400 }); break;
        case 'status_par': tone(300, .2, 'sq50', .08, { slide: 900 }); break;
        case 'status_psn': case 'status_tox': for (let i = 0; i < 3; i++) tone(300 + i * 80, .06, 'sine', .08, { at: i * .08 }); break;
        case 'status_slp': tone(600, .4, 'sine', .07, { slide: 300 }); break;
        case 'status_frz': tone(2000, .3, 'tri', .06, { slide: 3000 }); break;
        default: tone(800, .03, 'sq50', .04);
      }
    },
    moveSfx(m) {
      if (!ctx || !m) return;
      const t = ctx.currentTime + .01, B = sfxBus;
      const n = (d, type, f, v, to) => { const s = ctx.createBufferSource(); s.buffer = noiseBuf; const fl = ctx.createBiquadFilter(); fl.type = type; fl.frequency.setValueAtTime(f, t); if (to) fl.frequency.exponentialRampToValueAtTime(to, t + d); const g = ctx.createGain(); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.001, t + d); s.connect(fl); fl.connect(g); g.connect(B); s.start(t); s.stop(t + d + .05); };
      const tn = (f, d, w, v, slide) => playNote(B, w, f, t, d, v, [.005, .05, .7, .05], { slide });
      switch (m.type) {
        case 'fire': n(.5, 'lowpass', 1500, .2, 300); break;
        case 'water': for (let i = 0; i < 4; i++) playNote(B, 'sine', 300 + Math.random() * 400, t + i * .06, .08, .07, [.005, .03, .6, .04], { slide: 900 }); n(.3, 'bandpass', 800, .1); break;
        case 'electric': tn(80, .4, 'sq50', .08); n(.4, 'highpass', 3000, .12); break;
        case 'ice': for (let i = 0; i < 4; i++) playNote(B, 'tri', 1800 + i * 400, t + i * .05, .08, .05, [.002, .03, .5, .05]); break;
        case 'grass': n(.3, 'bandpass', 2500, .12); break;
        case 'psychic': tn(500, .5, 'sine', .08, 900); tn(750, .5, 'sine', .05, 400); break;
        case 'ghost': tn(300, .6, 'sine', .08, 150); break;
        case 'dark': tn(120, .4, 'saw', .08, 60); break;
        case 'dragon': tn(150, .5, 'saw', .09, 400); n(.4, 'lowpass', 900, .12); break;
        case 'fairy': for (let i = 0; i < 5; i++) playNote(B, 'sine', freq(84 + [0, 4, 7, 11, 14][i]), t + i * .05, .06, .05, [.003, .02, .5, .05]); break;
        case 'steel': tn(1200, .2, 'sq50', .06, 600); break;
        case 'ground': case 'rock': n(.4, 'lowpass', 600, .25, 100); break;
        case 'flying': n(.35, 'bandpass', 1200, .14, 3500); break;
        case 'poison': for (let i = 0; i < 3; i++) playNote(B, 'sine', 200 + i * 60, t + i * .07, .1, .07, [.005, .03, .6, .04], { slide: 500 }); break;
        case 'bug': tn(220, .3, 'sq25', .05); break;
        case 'fighting': n(.15, 'lowpass', 2500, .2); break;
        default: if (m.cat === 'status') tn(600, .2, 'sine', .06, 900); else n(.12, 'lowpass', 2500, .15);
      }
    },
    cry(sp, o = {}) {
      if (!ctx || !G.SPECIES[sp]) return;
      const s = G.SPECIES[sp], r = new G.RNG('cry' + sp), t = ctx.currentTime + .01;
      const big = G.clamp(Math.log(s.w + 1) / 6.3, 0, 1);
      let f0 = G.lerp(1100, 180, big) * (0.85 + r.next() * .3) * (o.faint ? .7 : 1);
      const dur = (.28 + big * .45 + r.next() * .15) * (o.faint ? 1.4 : 1);
      const wave = ['sq25', 'sq50', 'saw', 'tri', 'sq12'][r.int(0, 4)];
      const shape = r.int(0, 3);
      const O = ctx.createOscillator(), g = ctx.createGain();
      if (waves[wave]) O.setPeriodicWave(waves[wave]); else O.type = wave === 'saw' ? 'sawtooth' : 'triangle';
      const fr = O.frequency;
      fr.setValueAtTime(f0, t);
      if (shape === 0) { fr.linearRampToValueAtTime(f0 * 1.6, t + dur * .3); fr.linearRampToValueAtTime(f0 * .8, t + dur); }
      else if (shape === 1) { fr.linearRampToValueAtTime(f0 * .7, t + dur * .5); fr.linearRampToValueAtTime(f0 * 1.2, t + dur); }
      else if (shape === 2) { for (let k = 0; k < 6; k++) fr.linearRampToValueAtTime(f0 * (k % 2 ? 1.3 : .9), t + dur * (k + 1) / 6); }
      else { fr.exponentialRampToValueAtTime(f0 * 2, t + dur * .15); fr.exponentialRampToValueAtTime(f0 * .5, t + dur); }
      if (o.faint) fr.exponentialRampToValueAtTime(f0 * .35, t + dur);
      const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 18 + r.next() * 20; lg.gain.value = f0 * .06; lfo.connect(lg); lg.connect(fr);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3500;
      O.connect(lp); lp.connect(g); g.connect(sfxBus);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.16, t + .02); g.gain.setValueAtTime(.14, t + dur * .7); g.gain.linearRampToValueAtTime(0, t + dur);
      O.start(t); O.stop(t + dur + .05); lfo.start(t); lfo.stop(t + dur + .05);
      if (s.types.some(x => ['rock', 'ground', 'dark', 'dragon', 'poison', 'steel'].includes(x))) {
        const src = ctx.createBufferSource(); src.buffer = noiseBuf; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f0 * 2; const ng = ctx.createGain();
        ng.gain.setValueAtTime(.08, t); ng.gain.linearRampToValueAtTime(0, t + dur); src.connect(bp); bp.connect(ng); ng.connect(sfxBus); src.start(t); src.stop(t + dur);
      }
    },
  };
  return A;
})();
