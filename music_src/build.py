#!/usr/bin/env python3
"""
Build the Solmere soundtrack:  songs (Python) -> MIDI stems (Swift + Apple GS bank) -> mix (numpy) -> MP3.

  python3 build.py                 build everything that changed
  python3 build.py route1 title    build specific songs (ids or globs)
  python3 build.py --force         rebuild all
  python3 build.py --list          list songs

Loop contract: each looping file is  [intro][loop][first TAIL seconds of the loop again].
Any window of exactly `loop` seconds that starts at or after intro+TAIL is seamless (reverb tails
included), so the manifest uses loopStart = intro + TAIL, loopEnd = loopStart + loop.
"""
import os, sys, json, math, glob, hashlib, subprocess, fnmatch, time, random
from concurrent.futures import ProcessPoolExecutor
import numpy as np
import scipy.io.wavfile as wavfile
import scipy.signal as sig
from scipy.ndimage import minimum_filter1d, uniform_filter1d
import warnings
warnings.filterwarnings('ignore', category=wavfile.WavFileWarning)

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.environ.get('SOLMERE_OUT') or os.path.join(ROOT, 'music')
WORK = os.environ.get('SOLMERE_WORK', os.path.join(HERE, '_work'))
SR = 44100
MAXTAIL = 10.0   # seconds rendered past the first loop pass, to find where both passes converge
RENDER = os.path.join(HERE, 'render') if sys.platform == 'darwin' else os.path.join(HERE, 'render_fs.py')
sys.path.insert(0, HERE)
import mfw
import songs  # registers SONGS


def ds_master(x):
    """Nintendo DS output character: the console mixes at 32768 Hz into a 10-bit DAC. Resample down and
    back up (band-limits the top to ~15 kHz), then add the 10-bit step with light TPDF dither."""
    import scipy.signal as ss
    lo = ss.resample_poly(x, 32768, SR, axis=0)
    q = 2.0 / 1024
    rng = np.random.default_rng(7)
    d = (rng.random(lo.shape) - rng.random(lo.shape)) * q * .5
    lo = np.round((lo + d) / q) * q
    y = ss.resample_poly(lo, SR, 32768, axis=0)
    n = min(len(y), len(x)); out = np.zeros_like(x); out[:n] = y[:n]
    return out


# ------------------------------------------------------------------ compile
def to_sec(song, beat):
    return song.swung(beat) * 60.0 / song.bpm


def compile_song(song):
    """Returns dict of stems: name -> {program, kit, events, part} with times in seconds, covering
    intro + 2 loop passes (for looping songs)."""
    I, L = song.intro_len, song.loop_len
    loop = song.loop and L > 0
    tail = song.tail
    end_beat = I + L + (L if loop else 0)
    spb = 60.0 / song.bpm
    length_sec = (I + L) * spb + (MAXTAIL + 1.0 if loop else tail + 1.5)
    stems = {}
    for part in song.parts.values():
        notes = list(part.notes)
        ccs = list(part.cc)
        if loop:  # second pass of the loop
            notes += [(t + L, d, p, v, a) for (t, d, p, v, a) in part.notes if t >= I]
            ccs += [(t + L, c, v) for (t, c, v) in part.cc if t >= I]
            # controllers must be in the same state at the top of both passes
            default = {1: 0, 7: 100, 10: 64, 11: 127, 64: 0}
            for c in sorted({c for (_, c, _) in part.cc}):
                before = [(t, v) for (t, cc, v) in part.cc if cc == c and t < I]
                val = max(before)[1] if before else default.get(c, 0)
                ccs += [(I - 1e-6, c, val), (I + L - 1e-6, c, val)]
        notes.sort(key=lambda n: (n[0], n[2]))
        ev = []
        # initial controllers
        ev.append([0.0, 0xB0, 7, 100]); ev.append([0.0, 0xB0, 11, 127]); ev.append([0.0, 0xB0, 1, 0]); ev.append([0.0, 0xB0, 64, 0])
        if part.bendrange != 2:
            ev += [[0.0, 0xB0, 101, 0], [0.0, 0xB0, 100, 0], [0.0, 0xB0, 6, part.bendrange], [0.0, 0xB0, 38, 0]]
        last_end = {}
        lag = part.lag / 1000.0
        autovib = getattr(part, 'autovib', False)
        mono_bends = any('^' in n[4] or '/' in n[4] for n in notes)
        flat = []
        for (t, d, p, v, art) in notes:
            if p < 0 or p > 127: continue
            # humanize deterministically from the note's position in the loop, so both passes are identical
            tm = t if (not loop or t < I) else I + ((t - I) % L)
            rnd = random.Random(f'{song.id}|{part.name}|{song.variant}|{tm:.4f}|{p}')
            t0 = to_sec(song, t) + lag
            t1 = to_sec(song, t + d) + lag
            if not part.kit:
                jitter = rnd.gauss(0, .004 * part.human)
                t0 = max(0.0, t0 + jitter)
            else:
                t0 = max(0.0, t0 + rnd.gauss(0, .003 * part.human))
            dur = t1 - t0
            if "'" in art: dur *= .5
            elif '_' in art: dur = dur + .025
            else: dur *= part.legato
            dur = max(.04, dur)
            vv = int(max(1, min(127, v + rnd.randint(-3, 3) * part.human)))
            flat.append([t0, t0 + dur, p, vv, art])
        # avoid same-pitch overlaps (a late note-off would cut the retriggered note)
        flat.sort(key=lambda n: n[0])
        byp = {}
        for n in flat:
            q = byp.get(n[2])
            if q is not None and q[1] > n[0] - .003: q[1] = max(q[0] + .02, n[0] - .004)
            byp[n[2]] = n
        for (t0, t1, p, vv, art) in flat:
            if t0 >= length_sec: continue
            if not part.kit and (mono_bends or '^' in art or '/' in art):
                if '/' in art:
                    ev.append([max(0, t0 - .001), 0xE0, 0, 48])  # start ~1 semitone low (range 2)
                    for k in range(1, 7): ev.append([t0 + .012 * k, 0xE0, 0, int(48 + (64 - 48) * k / 6)])
                else:
                    ev.append([max(0, t0 - .001), 0xE0, 0, 64])
                if '^' in art:
                    fs = t0 + (t1 - t0) * .55
                    for k in range(1, 11): ev.append([fs + (t1 - fs) * k / 10, 0xE0, 0, int(64 - 40 * (k / 10) ** 1.6)])
            if not part.kit and (autovib or '~' in art) and (t1 - t0) > .45:
                ev.append([t0, 0xB0, 1, 0])
                vs = t0 + min(.35, (t1 - t0) * .4)
                depth = 70 if '~' in art else 44
                for k in range(1, 6): ev.append([vs + .06 * k, 0xB0, 1, int(depth * k / 5)])
                ev.append([t1 + .01, 0xB0, 1, 0])
            ev.append([t0, 0x90, p, vv])
            ev.append([t1, 0x80, p, 0])
        for (t, c, v) in ccs:
            ts = to_sec(song, t) + lag
            if ts < length_sec: ev.append([ts, 0xB0, c, v])
        ev.sort(key=lambda e: (e[0], 0 if e[1] == 0x80 else 1))
        progs = [part.prog] + list(part.layer)
        for k, prog in enumerate(progs):
            nm = part.name if k == 0 else f'{part.name}~{k}'
            stems[nm] = dict(program=prog, kit=part.kit, events=ev, part=part.name, layer=k)
    return stems, length_sec


# ------------------------------------------------------------------ DSP helpers
def biquad_hp(x, f, order=2):
    if f <= 0: return x
    sos = sig.butter(order, f / (SR / 2), 'highpass', output='sos'); return sig.sosfilt(sos, x, axis=0)


def biquad_lp(x, f, order=2):
    if f <= 0 or f >= SR / 2: return x
    sos = sig.butter(order, f / (SR / 2), 'lowpass', output='sos'); return sig.sosfilt(sos, x, axis=0)


def shelf(x, f, gain_db, kind='high'):
    """simple shelving EQ (RBJ cookbook)"""
    if abs(gain_db) < .05: return x
    A = 10 ** (gain_db / 40); w0 = 2 * math.pi * f / SR; cw, sw = math.cos(w0), math.sin(w0); al = sw / 2 * math.sqrt(2)
    if kind == 'high':
        b = [A * ((A + 1) + (A - 1) * cw + 2 * math.sqrt(A) * al), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - 2 * math.sqrt(A) * al)]
        a = [(A + 1) - (A - 1) * cw + 2 * math.sqrt(A) * al, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - 2 * math.sqrt(A) * al]
    else:
        b = [A * ((A + 1) - (A - 1) * cw + 2 * math.sqrt(A) * al), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - 2 * math.sqrt(A) * al)]
        a = [(A + 1) + (A - 1) * cw + 2 * math.sqrt(A) * al, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - 2 * math.sqrt(A) * al]
    return sig.lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=0)


def peak_eq(x, f, gain_db, q=1.0):
    if abs(gain_db) < .05: return x
    A = 10 ** (gain_db / 40); w0 = 2 * math.pi * f / SR; al = math.sin(w0) / (2 * q); cw = math.cos(w0)
    b = [1 + al * A, -2 * cw, 1 - al * A]; a = [1 + al / A, -2 * cw, 1 - al / A]
    return sig.lfilter(np.array(b) / a[0], np.array(a) / a[0], x, axis=0)


_IR = {}


def reverb_ir(rt60=1.8, predelay=.018, seed=7):
    key = (round(rt60, 2), predelay)
    if key in _IR: return _IR[key]
    rng = np.random.default_rng(seed)
    n = int(SR * (rt60 * 1.25 + predelay))
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    env = np.exp(-6.9 * np.maximum(0, t - predelay) / rt60)
    env[t < predelay] = 0
    # soft onset of the diffuse tail
    env *= np.clip((t - predelay) / .012, 0, 1)
    for c in range(2):
        noise = rng.standard_normal(n)
        bright = biquad_lp(noise, 9000)
        dark = biquad_lp(noise, 2600)
        mixk = np.clip((t - predelay) / (rt60 * .6), 0, 1)
        ir[:, c] = (bright * (1 - mixk) + dark * mixk) * env
    # early reflections
    for k, (dt, g) in enumerate([(.011, .5), (.019, .38), (.027, .33), (.037, .26), (.049, .2), (.061, .16)]):
        i = int((predelay * .5 + dt) * SR); ir[i, k % 2] += g; ir[i + int(.0023 * SR), (k + 1) % 2] += g * .7
    ir /= np.sqrt((ir ** 2).sum() / 2)
    ir *= .55
    _IR[key] = ir
    return ir


def conv(x, ir):
    return np.stack([sig.fftconvolve(x[:, c], ir[:, c])[:len(x)] for c in range(2)], axis=1)


def pan_width(x, pan, width):
    if width != 1.0:
        m = (x[:, 0] + x[:, 1]) * .5; s = (x[:, 0] - x[:, 1]) * .5 * width
        x = np.stack([m + s, m - s], axis=1)
    if pan:
        a = (pan + 1) * math.pi / 4
        gl, gr = math.cos(a) * math.sqrt(2), math.sin(a) * math.sqrt(2)
        # balance-style so stereo stems keep their image
        x = x * np.array([min(1.0, gl), min(1.0, gr)])
    return x


def chorus(x, depth_ms=3.0, base_ms=14.0, rate=.8, mix=.35):
    n = len(x); t = np.arange(n) / SR
    out = np.copy(x)
    for c, ph in ((0, 0.0), (1, math.pi / 2)):
        d = (base_ms + depth_ms * np.sin(2 * math.pi * rate * t + ph)) * SR / 1000
        idx = np.arange(n) - d
        i0 = np.clip(np.floor(idx).astype(int), 0, n - 1); fr = idx - np.floor(idx)
        i1 = np.clip(i0 + 1, 0, n - 1)
        wet = x[i0, c] * (1 - fr) + x[i1, c] * fr
        out[:, c] = x[:, c] * (1 - mix * .5) + wet * mix
    return out


def delay_fx(x, bpm, fb=.32, mix=1.0, beats=.75):
    """tempo-synced ping-pong delay (dotted eighth by default), darkened repeats"""
    dt = int(SR * 60 / bpm * beats)
    n = len(x); out = np.zeros_like(x)
    src = biquad_lp(biquad_hp(x.mean(axis=1), 300), 4500)
    g = 1.0; pos = dt; ch = 0
    for k in range(6):
        if pos >= n: break
        out[pos:, ch] += src[:n - pos] * g
        g *= fb; pos += dt; ch ^= 1
    return out * mix


def compress(x, thr_db=-16, ratio=2.2, win=.03):
    lvl = np.sqrt(np.maximum(0.0, uniform_filter1d((x ** 2).mean(axis=1), int(SR * win))))
    db = 20 * np.log10(np.maximum(lvl, 1e-7))
    over = np.maximum(0, db - thr_db)
    gr = -over * (1 - 1 / ratio)
    gr = uniform_filter1d(gr, int(SR * .06))
    return x * (10 ** (gr / 20))[:, None]


def limit(x, ceiling=.93, look=.004):
    a = np.abs(x).max(axis=1)
    need = np.minimum(1.0, ceiling / np.maximum(a, 1e-9))
    w = max(3, int(SR * look))
    g = minimum_filter1d(need, size=w * 2 + 1)
    g = uniform_filter1d(g, size=w)
    g = np.minimum(g, need)  # guarantee
    return x * g[:, None]


def loudness(x):
    """approximate loudness: RMS of a K-ish weighted signal, in dBFS"""
    y = shelf(biquad_hp(x, 60), 1500, 4, 'high')
    return 10 * math.log10(max(1e-12, (y ** 2).mean()))


# ------------------------------------------------------------------ mixing
def read_wav(path):
    sr, a = wavfile.read(path)
    a = a.astype(np.float64)
    if a.ndim == 1: a = np.stack([a, a], axis=1)
    return a


DEFAULT_HP = {'bass': 30, 'drums': 30, 'pad': 110, 'comp': 100, 'lead': 120, 'counter': 110, 'brass': 100, 'arp': 140, 'sparkle': 400, 'perc': 60}


def active_loudness(x):
    """K-ish weighted loudness over the passages where the stem is actually playing (400 ms blocks,
    gated 20 dB under the loudest block), so sparse parts are judged by how loud they are when heard."""
    y = shelf(biquad_hp(x, 60), 1500, 4, 'high')
    e = (y ** 2).mean(axis=1)
    blk = int(.4 * SR); nb = len(e) // blk
    if nb == 0: return -120.0
    b = e[:nb * blk].reshape(nb, blk).mean(axis=1)
    top = b.max()
    if top <= 0: return -120.0
    sel = b[b > top * 10 ** (-20 / 10)]
    return 10 * math.log10(sel.mean())


def mix_song(song, stems, length_sec, wdir):
    n = int(length_sec * SR)
    dry = np.zeros((n, 2)); rev = np.zeros((n, 2)); dly = np.zeros((n, 2))
    proc = {}
    for nm, st in stems.items():
        part = song.parts[st['part']]
        x = read_wav(os.path.join(wdir, safe(nm) + '.wav'))[:n]
        if len(x) < n: x = np.vstack([x, np.zeros((n - len(x), 2))])
        hp = part.hp if part.hp else (DEFAULT_HP.get(part.role, 90) if not part.kit else 30)
        x = biquad_hp(x, hp)
        if part.lp: x = biquad_lp(x, part.lp)
        eq = getattr(part, 'eq', None)
        if eq:
            for (kind, f, g, *q) in eq:
                if kind == 'peak': x = peak_eq(x, f, g, q[0] if q else 1.0)
                else: x = shelf(x, f, g, kind)
        if part.chorus:
            # whole number of LFO cycles per loop, so the modulation is identical on every pass
            Ls = song.loop_len * 60 / song.bpm if song.loop else 0
            rate = max(1, round(.8 * Ls)) / Ls if Ls else .8
            x = chorus(x, mix=part.chorus, rate=rate)
        proc[nm] = x
    # auto-mix: set each part so its active loudness sits at its role target relative to the lead
    loud = {nm: active_loudness(x) for nm, x in proc.items()}
    leads = [loud[nm] for nm, st in stems.items() if song.parts[st['part']].role in ('lead', 'solo') and st['layer'] == 0]
    ref = max(leads) if leads else max(loud.values())
    gains = {}
    for nm, st in stems.items():
        part = song.parts[st['part']]
        if getattr(song, 'automix', True):
            tgt = ref + mfw.ROLE_TARGET.get(part.role, -8) + part.vol + (-3.0 if st['layer'] else 0.0)
            g_db = max(-40, min(30, tgt - loud[nm])) if loud[nm] > -110 else 0
        else:
            g_db = part.vol - (2 if st['layer'] else 0)
        gains[nm] = g_db
    song._gains = gains
    for nm, st in stems.items():
        part = song.parts[st['part']]
        x = proc[nm]
        gain = 10 ** (gains[nm] / 20)
        x = pan_width(x * gain, part.pan + (getattr(part, 'layer_pan', 0) if st['layer'] else 0), part.width)
        dry += x
        if part.rev: rev += x * part.rev
        if part.delay: dly += x * part.delay
    out = dry
    if song.reverb and np.abs(rev).max() > 0:
        wet = conv(rev, reverb_ir(song.room))
        wet = biquad_hp(wet, 220); wet = shelf(wet, 6000, -3, 'high')
        out = out + wet * song.reverb
    if np.abs(dly).max() > 0:
        d = delay_fx(dly, song.bpm, beats=getattr(song, 'delay_beats', .75))
        d = d + conv(d * .5, reverb_ir(song.room)) * .5
        out = out + d
    # master: gentle glue, tone, loudness, limit
    out = shelf(out, 110, 1.0, 'low')
    out = shelf(out, 9000, 1.2, 'high')
    out = compress(out, thr_db=-15, ratio=2.0)
    I = song.intro_len * 60 / song.bpm
    region = out[int(I * SR):int((I + song.loop_len * 60 / song.bpm) * SR)] if song.loop else out
    lu = loudness(region if len(region) > SR else out)
    out *= 10 ** ((song.loudness - lu) / 20)
    out = limit(out, .93)
    return out


def safe(nm): return nm.replace('~', '_L').replace('/', '_')


# ------------------------------------------------------------------ build one
def song_hash(song):
    h = hashlib.sha1()
    h.update(open(os.path.join(HERE, 'mfw.py'), 'rb').read())
    h.update(open(os.path.join(HERE, 'build.py'), 'rb').read())
    for p in sorted(song.parts.values(), key=lambda p: p.name):
        h.update(repr((p.name, p.role, p.prog, p.kit, p.vol, p.pan, p.rev, p.hp, p.lp, p.width, p.delay, p.chorus, p.layer, getattr(p, 'eq', None), getattr(p, 'autovib', False), p.human, p.lag, p.legato)).encode())
        h.update(repr(sorted(p.notes)).encode()); h.update(repr(sorted(p.cc)).encode())
    h.update(repr((song.bpm, song.bar, song.swing, song.swing16, song.reverb, song.room, song.intro_len, song.loop_len, song.loop, song.tail, song.loudness)).encode())
    return h.hexdigest()[:16]


def build_one(key):
    try:
        return _build_one(key)
    except Exception as e:
        import traceback
        return {'id': '/'.join(key), 'error': f'{type(e).__name__}: {e}', 'trace': traceback.format_exc()[-600:]}


def _build_one(key):
    sid, variant = key
    song = songs.make(sid, variant)
    if song.loop and song.loop_len > 0:
        # nudge the tempo (by millionths) so the loop is an exact number of samples: both passes then render identically
        n = round(song.loop_len * 60 / song.bpm * SR)
        song.bpm = song.loop_len * 60 * SR / n
    fid = sid if variant == 'day' else f'{sid}@{variant}'
    fname = fid.replace('@', '_')
    mp3 = os.path.join(OUT, fname + '.mp3')
    meta_path = os.path.join(WORK, fname + '.json')
    hsh = song_hash(song)
    if os.path.exists(mp3) and os.path.exists(meta_path) and not os.environ.get('SOLMERE_FORCE'):
        meta = json.load(open(meta_path))
        if meta.get('hash') == hsh: return meta
    t0 = time.time()
    wdir = os.path.join(WORK, fname); os.makedirs(wdir, exist_ok=True)
    stems, length_sec = compile_song(song)
    job = {'sampleRate': SR, 'stems': []}
    for nm, st in stems.items():
        job['stems'].append({'out': os.path.join(wdir, safe(nm) + '.wav'), 'program': st['program'], 'bankMSB': 0, 'bankLSB': 0,
                             'channel': 9 if st['kit'] else 0, 'length': length_sec, 'events': st['events']})
    jp = os.path.join(wdir, 'job.json'); json.dump(job, open(jp, 'w'))
    subprocess.run([RENDER, jp], check=True, capture_output=True)
    out = mix_song(song, stems, length_sec, wdir)
    spb = 60 / song.bpm
    I, L = song.intro_len * spb, song.loop_len * spb
    if song.loop:
        # seam search. Several GS patches have free-running LFOs, so passes never match sample-for-sample;
        # what matters is the splice: pick the point where the audio just before loopEnd best matches the
        # audio just before loopStart (so the crossfade blends near-identical material), after tails settle.
        Ls = int(round(L * SR)); i0 = int(round(I * SR)); w = int(.08 * SR)
        mono = out.mean(axis=1)
        best, bestv = None, 1e9
        lo_k, hi_k = int(2.5 * SR), int((MAXTAIL - .8) * SR)
        for k in range(lo_k, hi_k, int(.005 * SR)):
            a = mono[i0 + k - w:i0 + k]; b = mono[i0 + Ls + k - w:i0 + Ls + k]
            if len(b) < w: break
            r = math.sqrt((a ** 2).mean()) + 1e-9
            m = 20 * math.log10(math.sqrt(((a - b) ** 2).mean()) / r + 1e-12)
            m += (k / SR) * .05   # all else equal, prefer an earlier loop start (smaller file)
            if m < bestv: best, bestv = k, m
        T = best / SR
        ls = I + T; le = ls + L
        # make the seam exact: fade the audio before loopEnd into the audio before loopStart, then make
        # everything after loopEnd a literal copy of what follows loopStart. Players that land a little
        # late or early (MP3 decoder delay differs between browsers) still jump between identical audio.
        post = 1.5
        a, b = int(round(le * SR)), int(round(ls * SR)); n = int(post * SR)
        out = out[:a + n]
        if len(out) < a + n: out = np.concatenate([out, np.zeros((a + n - len(out), out.shape[1]))])
        w = int(.12 * SR)
        f = np.sin(np.linspace(0, math.pi / 2, w)) ** 2
        out[a - w:a] = out[a - w:a] * (1 - f)[:, None] + out[b - w:b] * f[:, None]
        out[a:a + n] = out[b:b + n]
    else:
        # trim trailing silence, short fade
        a = np.abs(out).max(axis=1); idx = np.where(a > 10 ** (-62 / 20))[0]
        endi = min(len(out), (idx[-1] if len(idx) else len(out)) + int(.05 * SR))
        out = out[:endi]; f = min(len(out), int(.06 * SR)); out[-f:] *= np.linspace(1, 0, f)[:, None]
        ls = le = None
    if os.environ.get('SOLMERE_DSFX'): out = ds_master(out)
    wav = os.path.join(wdir, 'mix.wav')
    wavfile.write(wav, SR, (np.clip(out, -1, 1) * 32767).astype(np.int16))
    if not song.loop: bestv = None
    subprocess.run(['lame', '--quiet', '-V', '4', '-q', '2', '--noreplaygain', wav, mp3], check=True)
    peak = float(np.abs(out).max())
    meta = {'id': fid, 'file': 'music/' + fname + '.mp3', 'loop': song.loop, 'loopStart': ls, 'loopEnd': le, 'duration': len(out) / SR,
            'bpm': song.bpm, 'title': song.title, 'hash': hsh, 'seam_db': round(bestv, 1) if song.loop else None, 'peak': round(peak, 3), 'lufs_approx': round(loudness(out), 2),
            'build_sec': round(time.time() - t0, 1), 'intro': I, 'gains': {k: round(v, 1) for k, v in getattr(song, '_gains', {}).items()}}
    json.dump(meta, open(meta_path, 'w'))
    # stems are big; keep only the mix for inspection
    if not os.environ.get('KEEP_STEMS'):
        for f in glob.glob(os.path.join(wdir, '*.wav')):
            if not f.endswith('mix.wav'): os.remove(f)
    return meta


FORCE = False


def main():
    global FORCE
    args = [a for a in sys.argv[1:]]
    FORCE = '--force' in args
    if FORCE: os.environ['SOLMERE_FORCE'] = '1'
    args = [a for a in args if not a.startswith('--')] if '--list' not in sys.argv else args
    if '--list' in sys.argv:
        for sid, s in songs.SONGS.items(): print(sid, s.get('variants', ['day']))
        return
    os.makedirs(OUT, exist_ok=True); os.makedirs(WORK, exist_ok=True)
    keys = []
    for sid, s in songs.SONGS.items():
        if args and not any(fnmatch.fnmatch(sid, a) for a in args): continue
        for v in s.get('variants', ['day']): keys.append((sid, v))
    t0 = time.time()
    metas = []
    with ProcessPoolExecutor(max_workers=int(os.environ.get('JOBS', '8'))) as ex:
        for m in ex.map(build_one, keys):
            if 'error' in m:
                print(f"  !! {m['id']}: {m['error']}", flush=True); continue
            metas.append(m)
            print(f"  {m['id']:24s} {m['duration']:6.1f}s  loop {str(round(m['loopStart'], 2)) if m['loop'] else '-':>6} → {str(round(m['loopEnd'], 2)) if m['loop'] else '-':>6}  peak {m['peak']:.2f}  L {m['lufs_approx']:.1f}  ({m['build_sec']}s)", flush=True)
    if not os.environ.get('SOLMERE_OUT'): write_manifest()
    print(f'built {len(metas)} tracks in {time.time() - t0:.0f}s')


def write_manifest():
    man = {}
    for f in sorted(glob.glob(os.path.join(WORK, '*.json'))):
        m = json.load(open(f))
        if not os.path.exists(os.path.join(ROOT, m['file'])): continue
        if m['id'].split('@')[0] not in songs.SONGS: continue
        man[m['id']] = {k: (round(v, 5) if isinstance(v, float) else v) for k, v in m.items() if k in ('file', 'loop', 'loopStart', 'loopEnd', 'duration', 'title', 'bpm', 'intro')}
    js = '// Generated by music_src/build.py: pre-rendered soundtrack manifest (loop points in seconds).\n'
    js += 'G.MUSIC_FILES = ' + json.dumps(man, indent=0) + ';\n'
    open(os.path.join(ROOT, 'js', 'data', 'music_manifest.js'), 'w').write(js)


if __name__ == '__main__':
    main()
