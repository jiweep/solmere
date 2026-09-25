#!/usr/bin/env python3
"""Harmony and groove study of a game sequence: what the band does under the tune.

  python3 groove.py <file.mid> [bars]      chords in roman numerals with extensions, bass line, comping
                                           rhythm and lead per bar, plus the swing ratio and track roles
  python3 groove.py summary <glob> ...     per song: swing, chord-quality mix, root motion, bass/comp habits

Chords are read per half bar from everything but the lead and the drums: the root is the lowest note
sounding at the start (the bass), the quality from the other pitch classes weighted by duration.
Rhythms are written on an 8th grid ('1 & 2 & ...'), with 'a' for the swung/triplet third of a beat.
"""
import sys, os, glob, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import midiread
from study import pitched, key_of, choose_lead, meter_of, mono_line, NN

ROMAN = ['I', 'bII', 'II', 'bIII', 'III', 'IV', '#IV', 'V', 'bVI', 'VI', 'bVII', 'VII']


def quality(ivs):
    """name a chord from the set of intervals above its root (0 excluded)"""
    s = set(ivs)
    third = 'm' if 3 in s and 4 not in s else ''
    if 3 not in s and 4 not in s: third = 'sus' if 5 in s else ('5' if 7 in s else '')
    dim = third == 'm' and 6 in s and 7 not in s
    sev = 'maj7' if 11 in s else ('7' if 10 in s else ('6' if 9 in s and 10 not in s and 11 not in s else ''))
    if dim: return 'm7b5' if 10 in s else ('dim7' if 9 in s else 'dim')
    ext = []
    if 2 in s: ext.append('9')
    if 1 in s: ext.append('b9')
    if 3 in s and 4 in s: ext.append('#9')
    if 6 in s and 7 in s: ext.append('#11')
    if 5 in s and third not in ('sus',) and sev: ext.append('11')
    if 9 in s and sev and sev != '6': ext.append('13')
    if 8 in s and 7 not in s: ext.append('#5')
    elif 8 in s and sev == '7': ext.append('b13')
    return third + sev + ('(' + ','.join(ext) + ')' if ext else '')


def analyse(path, nbars=None, verbose=True):
    m = midiread.read(path); div = m['div']
    lead_key, tr, sc = choose_lead(m)
    pit = pitched(m['notes'])
    pit_keys = set((n[5], n[2]) for n in pit)
    tonic, mode = key_of(m['notes'])
    lead = mono_line(tr[lead_key], div)
    bpb = meter_of(m, lead); bar = div * bpb
    # roles: bass = the pitched track with the lowest mean pitch that plays mostly one note at a time
    stats = {}
    for k, v in tr.items():
        if k not in pit_keys or k == lead_key: continue
        mean = sum(n[3] for n in v) / len(v); chords = sum(1 for i in range(1, len(v)) if v[i][0] == v[i - 1][0]) / len(v)
        stats[k] = (mean, chords, len(v))
    # echo/doubling copies of the lead (DS songs often delay a second copy for a chorus/echo)
    lead_on = collections.defaultdict(set)
    for n in tr[lead_key]: lead_on[n[3]].add(n[0] // (div // 4))
    for k in list(stats):
        v = tr[k]; hit = sum(1 for n in v if any(q in lead_on[n[3]] for q in (n[0] // (div // 4) - 1, n[0] // (div // 4), n[0] // (div // 4) + 1)))
        if hit > .7 * len(v): del stats[k]; pit_keys.discard(k)
    # drum kits on an ordinary channel: few distinct 'pitches', struck in clusters
    for k in list(stats):
        if stats[k][1] > .3 and len(set(n[3] for n in tr[k])) <= 10: del stats[k]; pit_keys.discard(k)
    pit = [n for n in pit if (n[5], n[2]) in pit_keys]
    bass_key = min((k for k in stats if stats[k][1] < .3 and stats[k][2] > 16), key=lambda k: stats[k][0], default=None)
    acc = [n for n in pit if (n[5], n[2]) != lead_key and n[1] - n[0] >= div // 3]
    comp_keys = [k for k in stats if k != bass_key]
    # swing: where off-beat onsets fall inside the beat (accompaniment and lead together)
    offs = collections.Counter()
    for n in pit:
        p = n[0] % div
        if p: offs[round(p / div * 12)] += 1
    tot_off = sum(offs.values()) or 1
    even8 = offs[6] / tot_off; trip = (offs[4] + offs[8]) / tot_off; six = (offs[3] + offs[9]) / tot_off
    t0 = min(n[0] for n in pit) // bar * bar; t_end = max(n[1] for n in pit)
    total_bars = (t_end - t0) // bar + 1
    if nbars: total_bars = min(total_bars, nbars)
    out_chords = []
    lines = []
    for b in range(total_bars):
        bs = t0 + b * bar
        halves = [(bs, bs + bar // 2), (bs + bar // 2, bs + bar)] if bpb == 4 else [(bs, bs + bar)]
        names = []
        for h0, h1 in halves:
            sound = [n for n in acc if n[0] < h1 and n[1] > h0]
            if not sound: names.append('-'); continue
            low_start = [n for n in sound if n[0] <= h0 + div // 2]
            root_n = min(low_start or sound, key=lambda n: n[3])
            if bass_key:
                bn = [n for n in sound if (n[5], n[2]) == bass_key and n[0] <= h0 + div // 2]
                if bn: root_n = min(bn, key=lambda n: n[3])
            r = root_n[3] % 12
            w = collections.Counter()
            for n in sound: w[(n[3] - r) % 12] += min(n[1], h1) - max(n[0], h0)
            thr = max(w.values()) * .22
            ivs = [i for i, v in w.items() if v >= thr and i]
            q = quality(ivs)
            names.append(ROMAN[(r - tonic) % 12] + q)
            out_chords.append((ROMAN[(r - tonic) % 12], q, (r - tonic) % 12))
        grid = lambda ns: ' '.join(sorted(set(pos(n[0] - bs, div) for n in ns if bs <= n[0] < bs + bar), key=lambda s: order(s, bpb)))
        bass_ns = [n for n in tr.get(bass_key, []) if bs <= n[0] < bs + bar] if bass_key else []
        bass_s = ' '.join(f"{pos(n[0] - bs, div)}:{deg(n[3], tonic)}" for n in sorted(bass_ns))
        comp_ns = [n for k in comp_keys for n in tr[k] if bs <= n[0] < bs + bar]
        lead_ns = [n for n in lead if bs <= n[0] < bs + bar]
        lead_s = ' '.join(f"{pos(n[0] - bs, div)}:{deg(n[3], tonic)}{'~' if n[1] - n[0] >= div * 1.5 else ''}" for n in lead_ns)
        lines.append(f"{b + 1:3d} {' | '.join(names):28s} B[{bass_s}]\n    comp[{grid(comp_ns)}]  lead[{lead_s}]")
    head = (f"{os.path.basename(path)}  key {NN[tonic]}{'m' if mode == 'min' else ''}  {bpb}/4  "
            f"offbeats: even8 {even8 * 100:.0f}%  triplet {trip * 100:.0f}%  16ths {six * 100:.0f}%  "
            f"lead {lead_key} bass {bass_key} comps {comp_keys}")
    if verbose:
        print(head)
        for l in lines: print(l)
    return dict(head=head, chords=out_chords, even8=even8, trip=trip, six=six, bpb=bpb)


def pos(t, div):
    beat, r = divmod(t, div)
    f = round(r / div * 12)
    tag = {0: '', 3: 'e', 4: 't', 6: '&', 8: 'a', 9: 'u'}.get(f, f'.{f}')
    return f"{beat + 1}{tag}"


def order(s, bpb):
    num = int(''.join(c for c in s if c.isdigit()) or 0)
    tag = s[len(str(num)):]
    return (num, {'': 0, 'e': 3, 't': 4, '&': 6, 'a': 8, 'u': 9}.get(tag, 5))


def deg(p, tonic):
    return {0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'}[(p - tonic) % 12]


def summary(paths):
    for p in paths:
        try: r = analyse(p, verbose=False)
        except Exception as e: print(os.path.basename(p), 'ERR', e); continue
        ch = r['chords']
        qs = collections.Counter()
        for rn, q, _ in ch:
            base = 'maj7/6' if q.startswith(('maj7', '6')) else 'dom7' if q.startswith('7') else 'm7' if q.startswith(('m7', 'm6')) and not q.startswith('m7b5') else 'm7b5/dim' if 'dim' in q or 'b5' in q else 'triad' if q in ('', 'm') else 'sus' if 'sus' in q else 'other'
            qs[base] += 1
            if '(' in q: qs['+ext'] += 1
        n = max(1, len(ch))
        motion = collections.Counter()
        for a, b in zip(ch, ch[1:]):
            if a[2] == b[2]: continue
            iv = (b[2] - a[2]) % 12
            motion[{5: 'up4', 7: 'up5', 1: 'up-semi', 11: 'down-semi', 2: 'up-step', 10: 'down-step', 3: 'up-m3', 9: 'down-m3', 4: 'up-M3', 8: 'down-M3', 6: 'tritone'}[iv]] += 1
        mt = max(1, sum(motion.values()))
        print(f"{os.path.basename(p)[:34]:34s} {r['bpb']}/4 even8 {r['even8'] * 100:3.0f} trip {r['trip'] * 100:3.0f} 16th {r['six'] * 100:3.0f} | "
              + ' '.join(f"{k} {v * 100 / n:.0f}" for k, v in qs.most_common()) + ' | ' + ' '.join(f"{k} {v * 100 / mt:.0f}" for k, v in motion.most_common(5)))


if __name__ == '__main__':
    if sys.argv[1] == 'summary':
        ps = []
        for a in sys.argv[2:]: ps += sorted(glob.glob(a))
        summary(ps)
    else:
        analyse(sys.argv[1], int(sys.argv[2]) if len(sys.argv) > 2 else None)
