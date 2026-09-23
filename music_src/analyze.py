#!/usr/bin/env python3
"""
Objective checks for rendered tracks (I can't listen, so everything is measured):
  seam    loop seam continuity: audio just after loopEnd vs just after loopStart
  mp3     decode the MP3 and re-check the seam + level
  stems   per-stem loudness in the mix (needs KEEP_STEMS=1 builds)
  pitch   pitch-track a monophonic stem and compare against the score
  png     spectrogram image of the mix (log-frequency), for eyeballing arrangement density
  lint    symbolic harmony lint: long melody notes that clash with the chord

usage: analyze.py <id> [seam|mp3|stems|pitch:<part>|png|lint] ...
"""
import os, sys, json, math, zlib, struct, subprocess, warnings
import numpy as np
import scipy.io.wavfile as wavfile
warnings.filterwarnings('ignore')
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import build, mfw, songs
WORK = build.WORK; SR = build.SR


def load(id):
    fname = id.replace('@', '_')
    meta = json.load(open(os.path.join(WORK, fname + '.json')))
    sr, x = wavfile.read(os.path.join(WORK, fname, 'mix.wav'))
    return meta, x.astype(np.float64) / 32768, os.path.join(WORK, fname)


def db(x): return 20 * math.log10(max(1e-9, x))


def rms(x): return float(np.sqrt((x ** 2).mean())) if len(x) else 0.0


def seam(meta, x, label='wav'):
    ls, le = meta['loopStart'], meta['loopEnd']
    a, b = int(round(le * SR)), int(round(ls * SR))
    w = int(.4 * SR)
    after_end, after_start = x[a:a + w], x[b:b + w]
    n = min(len(after_end), len(after_start))
    err = rms(after_end[:n] - after_start[:n]) / max(1e-9, rms(after_start[:n]))
    wv = int(.08 * SR)
    pre_end, pre_start = x[a - wv:a], x[b - wv:b]
    splice = rms(pre_end - pre_start) / max(1e-9, rms(pre_start))
    print(f'  [{label}] splice: audio blended at the seam differs by {db(splice):6.1f} dB (lower = cleaner)')
    # sample step at the join vs typical step size nearby
    joined = np.concatenate([x[a - 2000:a], x[b:b + 2000]])
    steps = np.abs(np.diff(joined, axis=0)).max(axis=1)
    jump = steps[1999]; typical = np.percentile(steps, 99)
    print(f'  [{label}] seam: continuation mismatch {db(err):6.1f} dB   step at join {jump:.4f} (p99 nearby {typical:.4f})')
    return err, jump, typical


def stems(meta, wdir, song):
    tot = None
    rows = []
    for nm, part in song.parts.items():
        for k, prog in enumerate([part.prog] + list(part.layer)):
            f = os.path.join(wdir, build.safe(nm if k == 0 else f'{nm}~{k}') + '.wav')
            if not os.path.exists(f): continue
            key = nm if k == 0 else f'{nm}~{k}'
            g = meta.get('gains', {}).get(key, 0)
            y = build.read_wav(f) * 10 ** (g / 20)
            rows.append((key, prog, part.role, g, build.active_loudness(y), db(np.abs(y).max())))
    rows.sort(key=lambda r: -r[4])
    for r in rows: print(f'  {r[0]:14s} prog {r[1]:3d} {r[2]:8s} gain {r[3]:+6.1f} dB   active loudness {r[4]:6.1f}   peak {r[5]:6.1f} dB')


def yin(y, sr, fmin=120, fmax=1600, frame=2048, hop=512, thr=.15):
    out = []
    tmax, tmin = int(sr / fmin), int(sr / fmax)
    for i in range(0, len(y) - frame - tmax, hop):
        f = y[i:i + frame + tmax]
        if rms(f[:frame]) < 2e-3: out.append((i / sr, 0)); continue
        d = np.array([((f[:frame] - f[t:t + frame]) ** 2).sum() for t in range(tmax + 1)])
        cm = d[1:] * np.arange(1, len(d)) / np.maximum(1e-12, np.cumsum(d[1:]))
        cm = np.concatenate([[1], cm])
        cands = np.where(cm[tmin:] < thr)[0]
        if not len(cands): out.append((i / sr, 0)); continue
        t = cands[0] + tmin
        while t + 1 < len(cm) and cm[t + 1] < cm[t]: t += 1
        out.append((i / sr, sr / t))
    return out


def pitch(meta, wdir, song, partname):
    part = song.parts[partname]
    f = os.path.join(wdir, build.safe(partname) + '.wav')
    y = build.read_wav(f).mean(axis=1)
    y = y[:int(min(len(y) / SR, (song.intro_len + song.loop_len) * 60 / song.bpm) * SR)]
    tr = yin(y, SR)
    # score notes (onset seconds, midi)
    sc = sorted((build.to_sec(song, t), p) for (t, d, p, v, a) in part.notes if d >= .5)
    ok = bad = 0; bads = []
    for (t, p) in sc:
        fr = [hz for (tt, hz) in tr if t + .06 <= tt <= t + .16 and hz > 0]
        if not fr: continue
        m = 69 + 12 * math.log2(np.median(fr) / 440)
        err = ((m - p + 6) % 12) - 6   # octave-agnostic
        if abs(err) < .5: ok += 1
        else: bad += 1; bads.append((round(t, 2), p, round(m, 1)))
    print(f'  pitch[{partname}]: {ok} notes match the score, {bad} mismatch' + (f'  e.g. {bads[:6]}' if bads else ''))


def png(meta, x, path, secs=None):
    y = x.mean(axis=1)
    if secs: y = y[int(secs[0] * SR):int(secs[1] * SR)]
    n, hop = 4096, 1024
    frames = (len(y) - n) // hop
    W = min(1400, frames); step = frames / W
    H = 300
    freqs = np.fft.rfftfreq(n, 1 / SR)
    fb = np.geomspace(40, 16000, H + 1)
    img = np.zeros((H, W))
    win = np.hanning(n)
    for c in range(W):
        i = int(c * step) * hop
        sp = np.abs(np.fft.rfft(y[i:i + n] * win)) + 1e-9
        idx = np.searchsorted(freqs, fb)
        for r in range(H):
            a, b = idx[r], max(idx[r] + 1, idx[r + 1])
            img[H - 1 - r, c] = 20 * np.log10(sp[a:b].max())
    img = np.clip((img - img.max() + 80) / 80, 0, 1)
    # colour map (dark blue -> teal -> yellow -> white)
    stops = np.array([[8, 10, 30], [30, 60, 140], [30, 170, 170], [240, 220, 80], [255, 255, 255]], float)
    pos = img * (len(stops) - 1); i0 = np.floor(pos).astype(int).clip(0, len(stops) - 2); fr = (pos - i0)[..., None]
    rgb = (stops[i0] * (1 - fr) + stops[i0 + 1] * fr).astype(np.uint8)
    # loop markers
    if meta.get('loop') and not secs:
        for tt in (meta['loopStart'], meta['loopEnd']):
            cx = int(tt * SR / hop / step)
            if 0 <= cx < W: rgb[:, cx] = [255, 60, 60]
    raw = b''.join(b'\x00' + rgb[r].tobytes() for r in range(H))
    def chunk(t, d): return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    data = b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', W, H, 8, 2, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(raw, 9)) + chunk(b'IEND', b'')
    open(path, 'wb').write(data)
    print('  spectrogram ->', path)


AVOID = {  # interval above root that clashes with this chord type when sustained on a strong beat
    'maj': {5: 'natural 11 vs major 3rd', 10: 'b7 over maj', 1: 'b9 over major', 8: 'b13 over natural 5'},
    'min': {1: 'b9 over minor', 4: 'major 3rd over minor', 11: 'maj7 over m7'},
    'dom': {5: 'natural 11 over dominant 3rd', 11: 'maj7 over dominant'},
}


def lint(song):
    issues = 0
    for part in song.parts.values():
        if part.kit or part.name in ('bass',): continue
        for (t, d, p, v, a) in part.notes:
            if d < .9: continue
            sec = song.sec_of(t)
            if not sec.chords: continue
            c = sec.chord(t - sec.at)
            iv = (p - c.root) % 12
            if (p % 12) in c.pcs(): continue
            kind = 'dom' if c.dom else 'min' if c.minor else 'maj'
            allowed = {2, 9, 6} if kind == 'maj' else {2, 5, 9} if kind == 'min' else {2, 9, 1, 3, 6, 8}
            if iv in allowed: continue
            why = AVOID[kind].get(iv, f'non-chord tone ({iv} st)')
            onbeat = abs((t - sec.at) % 1) < 1e-6
            if onbeat:
                issues += 1
                if issues <= 25: print(f'  lint {part.name:8s} bar {int((t - sec.at) // song.bar) + 1:2d} of {sec.name:6s} {mfw.pcname(p)}{p // 12 - 1} over {c.sym:10s} ({why}), {d} beats')
    print(f'  lint: {issues} sustained clashes')


def check_all():
    for f in sorted(os.listdir(WORK)):
        if not f.endswith('.json'): continue
        meta = json.load(open(os.path.join(WORK, f)))
        id = meta['id']; sid, var = (id.split('@') + ['day'])[:2]
        if sid not in songs.SONGS: continue
        song = songs.make(sid, var)
        import io, contextlib
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf): lint(song)
        n = buf.getvalue().strip().splitlines()[-1]
        print(f"{id:24s} {meta['duration']:6.1f}s seam {meta.get('seam_db')} dB  peak {meta['peak']}  L {meta['lufs_approx']}  {n.strip()}")


def main():
    if sys.argv[1] == 'all': return check_all()
    id = sys.argv[1]; cmds = sys.argv[2:] or ['seam', 'mp3', 'lint']
    meta, x, wdir = load(id)
    sid, var = (id.split('@') + ['day'])[:2]
    song = songs.make(sid, var)
    print(f"{id}: {meta['duration']:.1f}s  loop {meta['loopStart']} → {meta['loopEnd']}  peak {meta['peak']}  L {meta['lufs_approx']}")
    for c in cmds:
        if c == 'seam' and meta['loop']: seam(meta, x)
        if c == 'mp3':
            mp3 = os.path.join(build.ROOT, meta['file']); tmp = os.path.join(wdir, 'dec.wav')
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp3, tmp], check=True)
            sr, y = wavfile.read(tmp); y = y.astype(np.float64) / 32768
            # find the decoder offset against the wav by cross-correlation of the first seconds
            a, b = x[:SR * 4, 0], y[:SR * 4, 0]
            cc = np.fft.irfft(np.fft.rfft(b, 2 * len(a)) * np.conj(np.fft.rfft(a, 2 * len(a))))
            off = int(np.argmax(cc[:4000]))
            print(f'  [mp3] {os.path.getsize(mp3) / 1e6:.2f} MB, decoder offset {off} samples ({off / SR * 1000:.1f} ms)')
            if meta['loop']: seam({**meta, 'loopStart': meta['loopStart'] + off / SR, 'loopEnd': meta['loopEnd'] + off / SR}, y, 'mp3')
        if c == 'stems': stems(meta, wdir, song)
        if c.startswith('pitch:'): pitch(meta, wdir, song, c.split(':')[1])
        if c == 'png': png(meta, x, os.path.join(wdir, 'spec.png'))
        if c == 'lint': lint(song)


if __name__ == '__main__':
    main()
