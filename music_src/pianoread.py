#!/usr/bin/env python3
"""Read a piano arrangement (or any MIDI) as melody + harmony, bar by bar, to learn how it is composed.

  python3 pianoread.py <file.mid> [bars]

Per bar: the chords (named from what sounds each half bar, root = lowest note), the melody (the top voice
of the upper part, as scale degree:beats; '+n' marks n extra notes sounding with it, i.e. the tune played
in 3rds/6ths or chords) and the bass line (lowest voice). Degrees: 1..7 with b/#, ' and , for octaves
around the tune's middle register."""
import sys, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import midiread
from study import key_of, meter_of, pitched
from groove import quality
DEG = {0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'}
NN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
ROM = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII']
def dur(x):
    for a, s in ((1/3, 't'), (2/3, '2t'), (1/6, 't16')):
        if abs(x - a) < .04: return s
    return '%g' % (round(x * 4) / 4)
def read(path, nbars=40):
    m = midiread.read(path); div = m['div']
    notes = pitched(m['notes'])
    if not notes: return path + ': no pitched notes'
    tracks = collections.defaultdict(list)
    for n in notes: tracks[(n[5], n[2])].append(n)
    ks = sorted(tracks, key=lambda k: -sum(x[3] for x in tracks[k]) / len(tracks[k]))
    # the tune: the top voice of everything above a split (middle C or the lower third of the range,
    # whichever is higher), so it works whether the hands are on separate tracks or one
    allp = sorted(n[3] for n in notes); split = max(60, allp[len(allp) // 3])
    upper = [n for n in notes if n[3] >= split]
    tonic, mode = key_of(notes)
    # melody: top voice of the upper part
    by_on = collections.defaultdict(list)
    for n in upper: by_on[n[0]].append(n)
    mel = []
    for t in sorted(by_on):
        top = max(by_on[t], key=lambda n: n[3]); extra = len(by_on[t]) - 1
        if mel and mel[-1][1] > t: mel[-1] = (mel[-1][0], t) + mel[-1][2:]
        mel.append((t, top[1], top[3], extra))
    bpb = meter_of(m, [(a, b, 0, p) for a, b, p, e in mel]); bar = div * bpb
    med = sorted(p for _, _, p, _ in mel)[len(mel) // 2]
    ref = min(range(36, 96), key=lambda r: abs(r - med) if r % 12 == tonic else 99)
    def dg(p):
        o = (p - ref + 5) // 12
        return DEG[(p - tonic) % 12] + ("'" * o if o > 0 else ',' * -o)
    t0 = min(n[0] for n in notes) // bar * bar
    out = ['%s  key %s %s  %d/4' % (os.path.basename(path), NN[tonic], mode, bpb)]
    half = bar // 2 if bpb == 4 else bar
    for b in range(nbars):
        bs = t0 + b * bar
        if bs > max(n[1] for n in notes): break
        chords = []
        for h in range(bar // half):
            hs = bs + h * half
            snd = [n for n in notes if n[0] < hs + half and n[1] > hs]
            if not snd: chords.append('-'); continue
            root = min(snd, key=lambda n: (n[0] > hs + div // 4, n[3]))[3]
            w = collections.Counter()
            for n in snd: w[(n[3] - root) % 12] += min(n[1], hs + half) - max(n[0], hs)
            tot = sum(w.values()); ivs = [i for i, x in w.items() if x >= tot * .08 and i]
            chords.append(ROM[(root - tonic) % 12] + quality(ivs))
        toks, t = [], bs
        for (a, e, p, x) in mel:
            if e <= bs or a >= bs + bar: continue
            if a < bs: toks.append('~' + dur((min(e, bs + bar) - bs) / div)); t = min(e, bs + bar); continue
            if a - t >= div // 4: toks.append('r:' + dur((a - t) / div))
            toks.append('%s:%s%s' % (dg(p), dur((min(e, bs + bar) - a) / div), '+%d' % x if x else '')); t = min(e, bs + bar)
        low = sorted({(n[0], n[3]) for n in notes if bs <= n[0] < bs + bar})
        bass, seen = [], set()
        for a, p in low:
            if a in seen: continue
            seen.add(a); lo = min(q for (aa, q) in low if aa == a)
            if lo < ref - 7: bass.append(DEG[(lo - tonic) % 12])
        out.append('%2d %-22s %-58s | %s' % (b + 1, ' '.join(chords), ' '.join(toks), ' '.join(bass[:8])))
    return '\n'.join(out)
if __name__ == '__main__':
    print(read(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else 40))
