#!/usr/bin/env python3
"""Melody study on exact game sequences (DS SDAT exports from sdat.py, GBA decomp MIDIs): one MIDI track per
instrument, so the lead line is a real track rather than a piano-reduction skyline.

  python3 study.py tracks <file.mid>              per-track stats and the chosen lead
  python3 study.py show <file.mid> [track] [bars] the lead bar by bar: degree(octave):beats, chords under it
  python3 study.py corpus <dir|glob> ...          feature table over many songs (+ averages)
  python3 study.py ours <song_id> ...             the same features for our songs (mfw lead parts)

Features (all per lead line):
  npb      notes per bar            long%   share of notes >= 2 beats       held%   share of time in notes >= 2 beats
  short%   notes <= half a beat     rest%   share of time resting           br      bars with <= 2 onsets (breathing bars)
  sync%    notes that start off the beat and hold across the next beat (anticipations / ties)
  step%/leap%   moves of 1-2 / more than 5 semitones        same%  repeated pitches
  ct_long  long notes (>= 1 beat) that are chord tones of the accompaniment sounding with them
  col      long notes on colour tones (9, 11, 13 / 6, maj7) over the accompaniment
  exact2 / rhy2 / new2   2-bar windows that repeat an earlier window exactly / by rhythm only / are new
  trip%    onsets on a triplet grid (swing/shuffle feel)
"""
import sys, os, glob, math, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import midiread

MAJ = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88]
MIN = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17]
NN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
DEG = {0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'}


def pitched(notes):
    """drop drum / one-pitch percussion tracks (they would skew the key and the chords)"""
    tr = collections.defaultdict(list)
    for n in notes: tr[(n[5], n[2])].append(n)
    keep = set(k for k, v in tr.items() if len(set(x[3] for x in v)) > 6 and k[1] != 9)
    return [n for n in notes if (n[5], n[2]) in keep]


def key_of(notes, w=None):
    notes = pitched(notes)
    h = [0.0] * 12
    for n in notes: h[n[3] % 12] += (n[1] - n[0]) * (w(n) if w else 1)
    # the bass counts again: the lowest pitched note on each beat
    if notes:
        byb = collections.defaultdict(list)
        for n in notes:
            for t in range(n[0] // 24, (n[1] - 1) // 24 + 1): byb[t].append(n)
        for t, ns in byb.items(): h[min(ns, key=lambda n: n[3])[3] % 12] += 12
    # songs open on the tonic chord: the first bass note is a strong hint
    first = None
    if notes:
        t0 = min(n[0] for n in notes); low = [n for n in notes if n[0] <= t0 + 96]
        first = min(low, key=lambda n: n[3])[3] % 12
    best = None
    for t in range(12):
        for prof, mode in ((MAJ, 'maj'), (MIN, 'min')):
            p = prof[-t:] + prof[:-t]
            mx, my = sum(h) / 12, sum(p) / 12
            num = sum((a - mx) * (b - my) for a, b in zip(h, p)); den = math.sqrt(sum((a - mx) ** 2 for a in h) * sum((b - my) ** 2 for b in p)) or 1
            sc = num / den + (.3 if t == first else 0)
            if best is None or sc > best[0]: best = (sc, t, mode)
    return best[1], best[2]


def by_track(m):
    tr = collections.defaultdict(list)
    for n in m['notes']: tr[(n[5], n[2])].append(n)
    return tr


def track_stats(ns, div, song_end):
    ns = sorted(ns)
    if len(ns) < 8: return None
    on = [n[0] for n in ns]
    mono = sum(1 for i in range(1, len(ns)) if ns[i][0] >= ns[i - 1][1] - div // 8 or ns[i][0] != ns[i - 1][0]) / (len(ns) - 1)
    chords = sum(1 for i in range(1, len(ns)) if ns[i][0] == ns[i - 1][0]) / len(ns)
    pitches = [n[3] for n in ns]
    mean = sum(pitches) / len(pitches)
    distinct = len(set(pitches))
    durs = collections.Counter(round((n[1] - n[0]) / div * 4) for n in ns)
    bar = div * 4
    cover = len(set(n[0] // bar for n in ns)) / max(1, song_end // bar + 1)
    # arpeggio-ness: how often the pitch 3 or 4 notes back repeats
    per = max(sum(1 for i in range(k, len(pitches)) if pitches[i] == pitches[i - k]) / max(1, len(pitches) - k) for k in (2, 3, 4))
    uniform = durs.most_common(1)[0][1] / len(ns)
    return dict(n=len(ns), mean=mean, mono=mono, chords=chords, distinct=distinct, cover=cover, per=per, uniform=uniform, ndur=len(durs))


def lead_score(s):
    if s is None: return -99
    if s['distinct'] < 7 or s['chords'] > .25: return -50
    return (s['mean'] - 60) * .12 + s['cover'] * 2 - s['per'] * 3 - s['uniform'] * 2 + min(s['ndur'], 6) * .3 + s['mono'] * 1


def choose_lead(m):
    tr = by_track(m)
    end = max(n[1] for n in m['notes'])
    sc = {k: (lead_score(track_stats(v, m['div'], end)), track_stats(v, m['div'], end)) for k, v in tr.items()}
    best = max(sc, key=lambda k: sc[k][0])
    return best, tr, sc


def mono_line(ns, div=48):
    """one note at a time: at a shared onset keep the highest; clip overlaps. A pitch struck again a
    16th later after a 16th-long note is one note re-articulated (the DS sequences' tremolo/double-tap)"""
    ns = sorted(ns, key=lambda n: (n[0], -n[3]))
    out = []
    for n in ns:
        if out and n[0] == out[-1][0]: continue
        if out and out[-1][1] > n[0]: out[-1] = (out[-1][0], n[0]) + out[-1][2:]
        out.append(n)
    # merge re-articulations only when the track does it habitually (most notes come in such pairs)
    pairs = sum(1 for i in range(1, len(out)) if out[i][3] == out[i - 1][3] and out[i][0] - out[i - 1][0] <= div // 4 and out[i - 1][1] - out[i - 1][0] <= div // 4)
    if pairs > len(out) * .25:
        m = []
        for n in out:
            if m and n[3] == m[-1][3] and n[0] - m[-1][0] <= div // 4 * (m[-1][6] if len(m[-1]) > 6 else 1) and n[0] - m[-1][1] <= div // 8:
                cnt = (m[-1][6] if len(m[-1]) > 6 else 1) + 1
                m[-1] = (m[-1][0], n[1]) + m[-1][2:6] + (cnt,)
            else: m.append(tuple(n[:6]) + (1,))
        out = [tuple(n[:6]) for n in m]
    return out


def meter_of(m, lead):
    """3 or 4 beats per bar: which grid puts the lead's long notes and the bass on downbeats"""
    div = m['div']; best = (0, 4)
    for bpb in (4, 3):
        bar = div * bpb
        s = sum((n[1] - n[0]) for n in lead if n[0] % bar == 0) / max(1, sum(n[1] - n[0] for n in lead))
        low = [n for n in m['notes'] if n[3] < 55]
        s += sum(1 for n in low if n[0] % bar == 0) / max(1, len(low))
        if bpb == 4: s4 = s
        else: s3 = s
    return 3 if s3 > s4 * 1.15 else 4


def chord_pcs(m, lead_key, t0, t1):
    """pitch classes the accompaniment sounds during [t0, t1)"""
    pcs = collections.Counter()
    for n in m.get('pitched') or m['notes']:
        if (n[5], n[2]) == lead_key: continue
        if n[0] < t1 and n[1] > t0:
            pcs[n[3] % 12] += min(n[1], t1) - max(n[0], t0)
    return pcs


def features(m, lead_key, lead, bpb=None):
    m['pitched'] = pitched(m['notes'])
    div = m['div']; bpb = bpb or meter_of(m, lead); bar = div * bpb
    lead = mono_line(lead, div)
    if len(lead) < 16: return None
    t0 = lead[0][0] // bar * bar; t1 = lead[-1][1]
    nbars = max(1, math.ceil((t1 - t0) / bar))
    durs = [(n[1] - n[0]) / div for n in lead]
    # actual time until the next onset (a note's "length" in the line, rests counted apart)
    ioi = [((lead[i + 1][0] if i + 1 < len(lead) else lead[i][1]) - lead[i][0]) / div for i in range(len(lead))]
    tot = (t1 - t0) / div
    iv = [lead[i][3] - lead[i - 1][3] for i in range(1, len(lead))]
    onsets_per_bar = collections.Counter((n[0] - t0) // bar for n in lead)
    br = sum(1 for b in range(nbars) if onsets_per_bar.get(b, 0) <= 2) / nbars
    sync = sum(1 for n in lead if n[0] % div and (n[1] - (n[0] // div + 1) * div) >= div // 4) / len(lead)
    trip = sum(1 for n in lead if (n[0] % div) in (div // 3, 2 * div // 3)) / len(lead)
    tonic, mode = key_of(m['notes'])
    ct = col = nl = 0
    for n in lead:
        if n[1] - n[0] < div: continue
        pcs = chord_pcs(m, lead_key, n[0], min(n[1], n[0] + div))
        if not pcs: continue
        nl += 1
        top = [p for p, _ in pcs.most_common(4)]
        if n[3] % 12 in top[:3]: ct += 1
        else: col += 1
    wins = []
    for b in range(0, nbars - 1, 2):
        w = [n for n in lead if t0 + b * bar <= n[0] < t0 + (b + 2) * bar]
        if len(w) < 2: continue
        rh = tuple((n[0] - t0 - b * bar) * 8 // div for n in w)
        pi = tuple(n[3] for n in w)
        wins.append((rh, pi))
    ex = rh_ = new = 0; seen = set(); seenr = set()
    for rh, pi in wins:
        if (rh, pi) in seen: ex += 1
        elif rh in seenr: rh_ += 1
        else: new += 1
        seen.add((rh, pi)); seenr.add(rh)
    W = max(1, len(wins))
    return dict(bpb=bpb, key=NN[tonic] + ('m' if mode == 'min' else ''), npb=len(lead) / nbars,
                long=sum(1 for d in ioi if d >= 2) / len(lead), held=sum(d for d in ioi if d >= 2) / tot,
                short=sum(1 for d in ioi if d <= .5) / len(lead), rest=1 - sum(durs) / tot, br=br, sync=sync, trip=trip,
                step=sum(1 for d in iv if 1 <= abs(d) <= 2) / len(iv), leap=sum(1 for d in iv if abs(d) > 5) / len(iv),
                same=sum(1 for d in iv if d == 0) / len(iv), ct_long=ct / max(1, nl), col=col / max(1, nl),
                exact2=ex / W, rhy2=rh_ / W, new2=new / W, rng=max(n[3] for n in lead) - min(n[3] for n in lead), bars=nbars)


COLS = ['npb', 'long', 'held', 'short', 'rest', 'br', 'sync', 'trip', 'step', 'leap', 'same', 'ct_long', 'col', 'exact2', 'rhy2', 'new2']


def row(name, f):
    pct = lambda v: f'{v * 100:3.0f}'
    return f"{name[:30]:30s} {f['key']:4s} {f['bpb']}/4 {f['bars']:3d}b  npb {f['npb']:4.1f}  " + '  '.join(f'{c} {pct(f[c])}' for c in COLS[1:]) + f"  rng {f['rng']}"


def show(path, tk=None, b0=1, b1=999, bpb=None):
    m = midiread.read(path); div = m['div']; m['pitched'] = pitched(m['notes'])
    best, tr, sc = choose_lead(m)
    key = best
    if tk is not None:
        key = [k for k in tr if k[0] == tk or f'{k[0]}.{k[1]}' == str(tk)][0]
    lead = mono_line(tr[key], div)
    bpb = bpb or meter_of(m, lead); bar = div * bpb
    tonic, mode = key_of(m['notes'])
    bpm = round(60e6 / m['tempos'][0][1]) if m['tempos'] else '?'
    print(f'{os.path.basename(path)}  key {NN[tonic]} {mode}  bpm {bpm}  {bpb}/4  lead track {key}')
    med = sorted(n[3] for n in lead)[len(lead) // 2]
    base = med - ((med - tonic) % 12)       # the tonic at or below the median: degrees there are plain
    by = collections.defaultdict(list)
    for n in lead: by[n[0] // bar].append(n)
    last_end = None
    for b in range(min(by), max(by) + 1):
        if b + 1 < b0 or b + 1 > b1: continue
        cells = []
        for n in by.get(b, []):
            if last_end is not None and n[0] - last_end >= div // 4: cells.append(f'_{round((n[0] - last_end) / div * 4) / 4:g}')
            nxt = [x for x in lead if x[0] > n[0]]
            span = ((nxt[0][0] if nxt else n[1]) - n[0])
            d = (n[1] - n[0]) / div
            o = (n[3] - base) // 12
            q = round(d * 4) / 4; q = q if q else round(d * 12) / 12
            s = DEG[(n[3] - tonic) % 12] + ("'" * o if o > 0 else ',' * -o) + (f':{q:g}' if q != 1 else '')
            if (n[0] % div): s = '~' + s if (n[0] % div) not in (div // 3, 2 * div // 3) else '³' + s
            cells.append(s); last_end = n[1]
        # chord under the bar (half bars): top 4 pitch classes as degrees
        hs = []
        for h in range(2):
            a = b * bar + h * bar // 2
            pcs = chord_pcs(m, key, a, a + bar // 2)
            bass = [n for n in m['pitched'] if (n[5], n[2]) != key and n[0] < a + bar // 2 and n[1] > a]
            lo = min(bass, key=lambda n: n[3])[3] % 12 if bass else None
            hs.append((DEG[(lo - tonic) % 12] if lo is not None else '-') + '/' + ''.join(DEG[(p - tonic) % 12] + ' ' for p, _ in pcs.most_common(4)).strip().replace(' ', '.'))
        print(f'{b + 1:3d} [{hs[0]:>14s} | {hs[1]:<14s}]  ' + ' '.join(cells))


def corpus(paths):
    rows = []
    for p in paths:
        try:
            m = midiread.read(p)
            if not m['notes']: continue
            best, tr, sc = choose_lead(m)
            f = features(m, best, tr[best], bpb=4)
        except Exception as e:
            print('skip', p, e); continue
        if not f: continue
        rows.append((os.path.basename(p).replace('.mid', ''), f))
        print(row(rows[-1][0], f))
    if rows:
        avg = {c: sum(f[c] for _, f in rows) / len(rows) for c in COLS}
        avg.update(key='--', bpb=4, bars=0, rng=round(sum(f['rng'] for _, f in rows) / len(rows)))
        print(row(f'MEAN of {len(rows)}', avg))
    return rows


def ours(sids):
    import mfw, songs  # noqa: F401
    for a in sids:
        sid, _, var = a.partition(':')
        s = mfw.make(sid, var or 'day')
        for name, part in s.parts.items():
            if part.kit or part.role != 'lead': continue
            div = 48
            notes = [(round(t * div), round((t + d) * div), 0, p, v, 0) for (t, d, p, v, art) in part.notes]
            acc = [(round(t * div), round((t + d) * div), 1, p, v, 1) for nm, pt in s.parts.items() if nm != name and not pt.kit for (t, d, p, v, art) in pt.notes]
            m = dict(div=div, notes=sorted(notes + acc), tempos=[])
            f = features(m, (0, 0), notes, bpb=s.bar)
            if f: print(row(f'{sid}:{name}', f))


def digest(paths, maxbars=48):
    """name, stats of the top candidate tracks, and the lead bar by bar"""
    for p in paths:
        try:
            m = midiread.read(p)
            best, tr, sc = choose_lead(m)
        except Exception as e:
            print('skip', p, e); continue
        top = sorted(sc.items(), key=lambda x: -x[1][0])[:3]
        print('#' * 100)
        print(' | '.join(f"{k[0]}: n{st['n']} mean{st['mean']:.0f} sc{s:.1f}" for k, (s, st) in top if st))
        show(p, None, 1, maxbars, 4)
        print()


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'tracks':
        m = midiread.read(sys.argv[2]); best, tr, sc = choose_lead(m)
        for k, (s, st) in sorted(sc.items(), key=lambda x: -x[1][0]):
            if st: print(k, f'score {s:5.2f}', ' '.join(f'{a}={v:.2f}' if isinstance(v, float) else f'{a}={v}' for a, v in st.items()), '  <== lead' if k == best else '')
    elif cmd == 'show':
        tk = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] != '-' else None
        rng = sys.argv[4].split('-') if len(sys.argv) > 4 else (1, 999)
        show(sys.argv[2], int(tk) if tk and tk.isdigit() else tk, int(rng[0]), int(rng[1]), int(sys.argv[5]) if len(sys.argv) > 5 else None)
    elif cmd == 'corpus':
        ps = []
        for a in sys.argv[2:]: ps += sorted(glob.glob(os.path.join(a, '*.mid'))) if os.path.isdir(a) else sorted(glob.glob(a))
        corpus(ps)
    elif cmd == 'ours':
        ours(sys.argv[2:])
    elif cmd == 'digest':
        ps = []
        for a in sys.argv[2:]: ps += sorted(glob.glob(a))
        digest(ps)
