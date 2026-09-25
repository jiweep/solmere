#!/usr/bin/env python3
"""How the tune and the band interact: the craft between melody, harmony and the other parts.

  python3 craft.py <file.mid|ours:id> ...         one row per song
  python3 craft.py corpus '<glob>' ...            means over a set

Chords are what the accompaniment actually sounds (every pitched track but the lead), not chord symbols.
  strongNCT  share of strong-beat melody notes (>= .5 beat) that are NOT sounding in the band: the
             expressive dissonances (appoggiatura, suspension, anticipation, unresolved colour)
  app        of those, share resolving by step to a band tone (appoggiaturas and suspensions)
  antic      share of melody notes that arrive up to half a beat BEFORE a chord change and belong to the new
             chord (the melody leans ahead of the band)
  offb       share of melody onsets off the beat (syncopation)
  contra     melody vs bass between successive beats where both move: share moving in contrary motion
  hr         chord changes per bar (harmonic rhythm)
  fill       share of the melody's holds (>= 1.5 beats) and rests (>= 1 beat) in which another pitched part
             starts at least two notes (answers, fills, countermelody)
  voices     number of non-lead pitched parts that move melodically (>= 30% steps, > 1 note/bar)
  tens       share of melody time sitting on 7ths, 9ths, 11ths, 13ths above the bass (colour held)
"""
import sys, os, glob, collections, statistics as st
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from study import key_of, choose_lead, mono_line, meter_of, pitched, by_track
from form import load


def load_full(path):
    """a MIDI file, or ours:<id> with every part: the lead parts on track 0, drums on channel 9"""
    if not path.startswith('ours:'): return load(path), None
    import mfw, songs  # noqa: F401
    s = mfw.make(path.split(':')[1], 'day'); div = 48; notes = []
    for i, (n, p) in enumerate(s.parts.items()):
        lead = p.role in ('lead', 'solo') and not p.kit
        ch = 9 if p.kit else (0 if lead else i + 1)
        for (t, d, pp, v, a) in p.notes: notes.append((int(round(t * div)), int(round((t + d) * div)), ch, pp, v, 0 if lead else i + 1))
    notes.sort()
    return dict(div=div, notes=notes, progs={}, tempos=[], ccs=[], names={}), (0, 0)


def analyse(path, nbars=64):
    m, forced = load_full(path); div = m['div']
    best, tr, sc = choose_lead(m)
    if forced: best = forced
    lead = mono_line(tr[best], div)
    if len(lead) < 16: return None
    notes = pitched(m['notes'])
    band = [n for n in notes if (n[5], n[2]) != best]
    if not band: return None
    bpb = meter_of(m, lead); bar = div * bpb
    t0 = min(n[0] for n in lead) // bar * bar
    tend = t0 + nbars * bar
    lead = [n for n in lead if n[0] < tend]
    band = [n for n in band if n[0] < tend]

    slot = div * 2 if bpb == 4 else bar
    def sounding(t, w=None):
        """the band's chord at time t: every pitch class it sounds in the half bar (a bar in 3/4) holding t,
        so arpeggiated and comped harmony counts, not just what happens to ring at that instant"""
        s0 = t0 + (t - t0) // slot * slot
        return {n[3] % 12 for n in band if n[0] < s0 + slot and n[1] > s0 and (n[1] - max(n[0], s0)) >= div // 4}

    def bass_at(t):
        ns = [n for n in band if n[0] <= t + div // 8 and n[1] > t]
        return min(ns, key=lambda n: n[3])[3] if ns else None

    strong = [n for n in lead if (n[0] - t0) % (bar if bpb == 3 else div * 2) == 0 and n[1] - n[0] >= div // 2]
    nct = [n for n in strong if n[3] % 12 not in sounding(n[0])]
    app = 0
    for n in nct:
        i = lead.index(n)
        if i + 1 < len(lead):
            nx = lead[i + 1]
            if 0 < abs(nx[3] - n[3]) <= 2 and nx[3] % 12 in sounding(nx[0]): app += 1
    # anticipations: onset within half a beat before a bar/half-bar boundary where the band changes
    antic = 0
    for n in lead:
        k = (n[0] - t0) % (div * 2 if bpb == 4 else bar)
        span = div * 2 if bpb == 4 else bar
        if span - div // 2 <= k < span:
            nb = n[0] - k + span
            before, after = sounding(n[0] - div // 8), sounding(nb + div // 8)
            if after and before != after and n[3] % 12 in after and n[3] % 12 not in before: antic += 1
    offb = st.mean(1 if (n[0] - t0) % div else 0 for n in lead)
    # contrary motion, beat by beat
    beats = list(range(t0, max(n[1] for n in lead), div))
    def mel_at(t):
        for n in lead:
            if n[0] <= t < n[1]: return n[3]
        return None
    pairs = [(mel_at(b), bass_at(b)) for b in beats]
    con = par = 0
    for (m1, b1), (m2, b2) in zip(pairs, pairs[1:]):
        if None in (m1, b1, m2, b2) or m1 == m2 or b1 == b2: continue
        if (m2 - m1) * (b2 - b1) < 0: con += 1
        else: par += 1
    # harmonic rhythm: distinct band pc-sets per half bar
    sets = []
    for t in range(t0, tend, bar // 2 if bpb == 4 else bar):
        s = frozenset(p for p in sounding(t))
        if s: sets.append(s)
    changes = sum(1 for a, b in zip(sets, sets[1:]) if len(a ^ b) >= 2)
    nb = max(1, (max(n[1] for n in lead) - t0) / bar)
    # fills: other parts moving while the melody holds or rests
    gaps = []
    for i, n in enumerate(lead):
        if n[1] - n[0] >= div * 1.5: gaps.append((n[0] + div // 2, n[1]))
        if i + 1 < len(lead) and lead[i + 1][0] - n[1] >= div: gaps.append((n[1], lead[i + 1][0]))
    tracks = collections.defaultdict(list)
    for n in band: tracks[(n[5], n[2])].append(n)
    lows = {k for k, v in tracks.items() if st.mean(x[3] for x in v) < 52}
    filled = 0
    for a, b in gaps:
        for k, v in tracks.items():
            if k in lows: continue
            ons = sorted({x[0] for x in v if a <= x[0] < b})
            if len(ons) >= 2 and len({x[3] for x in v if a <= x[0] < b}) >= 2: filled += 1; break
    voices = 0
    for k, v in tracks.items():
        if k in lows or len(v) < nb: continue
        ml = mono_line(v, div)
        ivs = [abs(b[3] - a[3]) for a, b in zip(ml, ml[1:])]
        if ivs and st.mean(1 if 0 < x <= 2 else 0 for x in ivs) >= .3: voices += 1
    tens_t = tot_t = 0
    for n in lead:
        b = bass_at(n[0])
        if b is None: continue
        d = n[1] - n[0]; tot_t += d
        if (n[3] - b) % 12 in (10, 11, 2, 1, 3, 5, 6, 9, 8): tens_t += d
    return dict(strongNCT=len(nct) / max(1, len(strong)), app=app / max(1, len(nct)), antic=antic / len(lead),
                offb=offb, contra=con / max(1, con + par), hr=changes / nb, fill=filled / max(1, len(gaps)),
                voices=voices, tens=tens_t / max(1, tot_t))


COLS = ['strongNCT', 'app', 'antic', 'offb', 'contra', 'hr', 'fill', 'voices', 'tens']


def row(name, R):
    return '%-34s ' % name[:34] + ' '.join(('%d' % R[c] if c == 'voices' and float(R[c]).is_integer() else '%.2f' % R[c]).rjust(9) for c in COLS)


if __name__ == '__main__':
    args = sys.argv[1:]
    print('%-34s ' % 'song' + ' '.join(c.rjust(9) for c in COLS))
    if args and args[0] == 'corpus':
        for g in args[1:]:
            rs = []
            for f in sorted(glob.glob(g)):
                try:
                    r = analyse(f)
                    if r: rs.append(r)
                except Exception: pass
            if rs: print(row('%s (%d)' % (os.path.basename(os.path.dirname(g)) + '/' + os.path.basename(g), len(rs)), {c: st.mean(r[c] for r in rs) for c in COLS}))
    else:
        for a in args:
            try:
                r = analyse(a)
                print(row(os.path.basename(a), r) if r else a + ': too short')
            except Exception as e: print(a, 'ERR', e)
