#!/usr/bin/env python3
"""Study the melodies of reference tracks (piano-reduction MIDIs in ref/) to learn what makes them work.

  python3 melstudy.py ref/<file>.mid [bars]      print the melody bar by bar (scale degrees + beats)
  python3 melstudy.py --all                      metrics table for every reference

The melody is the skyline of the piano reduction: at each onset the highest new note, unless a higher
melody note is still sounding (then the accompaniment moved under a held note). Metrics:
  bpn      beats per note                     rest%    share of time the melody rests
  step%    moves of 1-2 semitones             leap%    moves larger than a 4th
  rep2     2-bar windows whose rhythm repeats an earlier window exactly
  seq2     2-bar windows whose interval pattern repeats an earlier one (exact or transposed)
  ends     scale degrees of phrase-final notes (notes >= 1.5 beats or before a rest)
  climax   where each 8-bar block peaks (bar 1-8)
"""
import sys, os, glob, collections, math
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import midiread

MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
NN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
DEG = {0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'}


def key_of(notes):
    w = [0.0] * 12
    for n in notes: w[n[3] % 12] += n[1] - n[0]
    best = None
    for t in range(12):
        for prof, mode in ((MAJ, 'maj'), (MIN, 'min')):
            p = prof[-t:] + prof[:-t]
            mx, my = sum(w) / 12, sum(p) / 12
            num = sum((a - mx) * (b - my) for a, b in zip(w, p)); den = math.sqrt(sum((a - mx) ** 2 for a in w) * sum((b - my) ** 2 for b in p))
            r = num / den if den else 0
            if best is None or r > best[0]: best = (r, t, mode)
    return best[1], best[2]


def skyline(notes, div):
    q = div // 8
    by = collections.defaultdict(list)
    for n in notes:
        if n[2] == 9: continue
        by[round(n[0] / q) * q].append(n)
    mel = []
    for t in sorted(by):
        top = max(by[t], key=lambda n: n[3])
        if mel:
            p = mel[-1]
            # accompaniment moving under a held melody note: skip
            if p[1] > t + q and p[3] > top[3] + 2: continue
            if p[1] > t: mel[-1] = (p[0], t, p[2], p[3], p[4], p[5])
        mel.append((t, top[1], top[2], top[3], top[4], top[5]))
    return mel


def load(path):
    m = midiread.read(path); div = m['div']
    mel = skyline(m['notes'], div)
    tonic, mode = key_of(m['notes'])
    return m, div, mel, tonic, mode


def show(path, b0=0, b1=999):
    m, div, mel, tonic, mode = load(path)
    bar = div * 4
    print(os.path.basename(path), 'key', NN[tonic], mode, 'bpm', round(60e6 / m['tempos'][0][1]) if m['tempos'] else '?')
    by = collections.defaultdict(list)
    for n in mel: by[n[0] // bar].append(n)
    for b in sorted(by):
        if b < b0 or b > b1: continue
        cells = []
        for n in by[b]:
            d = (n[1] - n[0]) / div; pos = (n[0] - b * bar) / div
            oc = (n[3] - tonic) // 12 - 5
            cells.append(f"{DEG[(n[3] - tonic) % 12]}{'^' * max(0, oc) + ',' * max(0, -oc)}:{d:g}@{pos:g}")
        print(f'{b + 1:3d} | ' + '  '.join(cells))


def metrics(path):
    m, div, mel, tonic, mode = load(path)
    bar = div * 4
    if len(mel) < 20: return None
    durs = [(n[1] - n[0]) / div for n in mel]
    span = (mel[-1][1] - mel[0][0]) / div
    bpn = sum(durs) / len(durs); rest = 1 - sum(durs) / span
    iv = [mel[i][3] - mel[i - 1][3] for i in range(1, len(mel))]
    step = sum(1 for d in iv if 1 <= abs(d) <= 2) / len(iv); leap = sum(1 for d in iv if abs(d) > 5) / len(iv); same = sum(1 for d in iv if d == 0) / len(iv)
    # 2-bar windows
    nb = int(mel[-1][1] // bar) + 1
    wins = []
    for b in range(0, nb - 1):
        ns = [n for n in mel if b * bar <= n[0] < (b + 2) * bar]
        if len(ns) < 2: wins.append(None); continue
        rh = tuple(round((n[0] - b * bar) / (div / 4)) for n in ns)
        ivs = tuple(ns[i][3] - ns[i - 1][3] for i in range(1, len(ns)))
        wins.append((rh, ivs))
    seenr, seeni, rep, seq, tot = set(), set(), 0, 0, 0
    for w in wins[::2]:
        if not w: continue
        tot += 1
        if w[0] in seenr: rep += 1
        if w[1] in seeni: seq += 1
        seenr.add(w[0]); seeni.add(w[1])
    # phrase ends
    ends = collections.Counter()
    for i, n in enumerate(mel):
        d = (n[1] - n[0]) / div; gap = ((mel[i + 1][0] - n[1]) / div) if i + 1 < len(mel) else 2
        if d >= 1.5 or gap >= 1: ends[DEG[(n[3] - tonic) % 12]] += 1
    # climax positions per 8 bars
    cl = []
    for b8 in range(0, nb, 8):
        ns = [n for n in mel if b8 * bar <= n[0] < (b8 + 8) * bar]
        if ns: top = max(ns, key=lambda n: n[3]); cl.append(int((top[0] - b8 * bar) // bar) + 1)
    # rhythm vocabulary: most common 1-beat onset patterns
    beats = collections.Counter()
    for b in range(nb * 4):
        on = tuple(round((n[0] - b * div) / (div / 4)) for n in mel if b * div <= n[0] < (b + 1) * div)
        beats[on] += 1
    return dict(name=os.path.basename(path).split(' - ')[-1][:26], key=NN[tonic] + ' ' + mode, bpn=bpn, rest=rest, step=step, leap=leap, same=same,
                rep2=rep / max(1, tot), seq2=seq / max(1, tot), ends=ends.most_common(4), climax=cl, rng=max(n[3] for n in mel) - min(n[3] for n in mel),
                beats=beats.most_common(5))


if __name__ == '__main__':
    if sys.argv[1] == '--all':
        for p in sorted(glob.glob(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ref', '*.mid'))):
            r = metrics(p)
            if not r: continue
            print(f"{r['name']:26s} {r['key']:7s} bpn {r['bpn']:.2f} rest {r['rest']:.0%} step {r['step']:.0%} leap {r['leap']:.0%} same {r['same']:.0%} rng {r['rng']:2d} rep2 {r['rep2']:.0%} seq2 {r['seq2']:.0%} ends {r['ends']} climax {r['climax']}")
            print(' ' * 35, 'beat rhythms (16ths within the beat):', r['beats'])
    else:
        rng = sys.argv[2].split('-') if len(sys.argv) > 2 else (1, 999)
        show(sys.argv[1], int(rng[0]) - 1, int(rng[1]) - 1)
