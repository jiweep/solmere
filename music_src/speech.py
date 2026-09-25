#!/usr/bin/env python3
"""How much a melody talks: phrase-level traits that speech and sung melody share.

  python3 speech.py <file.mid|ours:id> [...]        one row per song
  python3 speech.py corpus '<glob>' [...]           means over a set of files (label = the glob)

A phrase ends at a note of >= 1.5 beats or before a rest of >= .75 beat. Per song:
  len     mean phrase length in beats          lvar  its variation (std/mean): speech mixes short and long
  pick    share of phrases that start off the downbeat (an upbeat, like an unstressed "and, so, the")
  fin     final-note lengthening (last note / median note of the phrase): the full stop
  q>a     share of phrase pairs where one stops on an open degree (2 4 6 7) and the next closes (1 3 5):
          a question and its answer
  rise    share of phrases whose last move is upward (a question's lilt); fall = the rest
  decl    pitch slope over a phrase in semitones per beat (speech drifts down: declination)
  peak    where the highest note sits, as a fraction of the phrase (speech peaks early, on the key word)
  rep     repeated-note share inside phrases (reciting on one pitch, like syllables)
  npvi    rhythmic contrast between neighbouring notes (Patel's nPVI; spoken English ~57, even 8ths 0)
  gap     mean jump in semitones from a phrase's last note to the next one's first (a reply picks up nearby)
"""
import sys, os, glob, statistics as st
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from study import key_of, choose_lead, mono_line, meter_of
from form import load

OPEN = {2, 5, 9, 11}          # 2 4 6 7 above the tonic
CLOSED = {0, 4, 7}            # 1 3 5


def phrases(lead, div):
    out, cur = [], []
    for i, n in enumerate(lead):
        cur.append(n)
        dur = (n[1] - n[0]) / div
        rest = (lead[i + 1][0] - n[1]) / div if i + 1 < len(lead) else 9
        if dur >= 1.5 or rest >= .75:
            out.append(cur); cur = []
    if cur: out.append(cur)
    # a fragment of 1-2 notes joins the phrase that follows it (a pickup) or precedes it
    merged = []
    for p in out:
        if merged and len(merged[-1]) < 3: merged[-1] = merged[-1] + p
        else: merged.append(p)
    return [p for p in merged if len(p) >= 3]


def npvi(durs):
    if len(durs) < 2: return 0
    return 100 * st.mean(abs(a - b) / ((a + b) / 2) for a, b in zip(durs, durs[1:]))


def analyse(path, nbars=64):
    m = load(path); div = m['div']
    best, tr, sc = choose_lead(m)
    lead = mono_line(tr[best], div)
    if len(lead) < 12: return None
    tonic, mode = key_of(m['notes'])
    bpb = meter_of(m, lead); bar = div * bpb
    t0 = min(n[0] for n in lead) // bar * bar
    lead = [n for n in lead if n[0] < t0 + nbars * bar]
    ph = phrases(lead, div)
    if len(ph) < 3: return None
    R = dict(n=len(ph))
    lens = [(p[-1][1] - p[0][0]) / div for p in ph]
    R['len'] = st.mean(lens); R['lvar'] = st.pstdev(lens) / R['len']
    R['pick'] = st.mean(1 if ((p[0][0] - t0) % bar) > div * .25 else 0 for p in ph)
    fins = []
    for p in ph:
        ds = [(n[1] - n[0]) / div for n in p]
        fins.append(ds[-1] / max(.125, st.median(ds[:-1])))
    R['fin'] = st.median(fins)
    ends = [(p[-1][3] - tonic) % 12 for p in ph]
    pairs = list(zip(ends, ends[1:]))
    R['q>a'] = st.mean(1 if a in OPEN and b in CLOSED else 0 for a, b in pairs)
    R['rise'] = st.mean(1 if p[-1][3] > p[-2][3] else 0 for p in ph)
    slopes, peaks = [], []
    for p in ph:
        ts = [(n[0] - p[0][0]) / div for n in p]; ps = [n[3] for n in p]
        if ts[-1] > 0:
            mt, mp = st.mean(ts), st.mean(ps)
            den = sum((t - mt) ** 2 for t in ts)
            slopes.append(sum((t - mt) * (q - mp) for t, q in zip(ts, ps)) / den if den else 0)
        hi = max(ps); k = ps.index(hi)
        peaks.append(ts[k] / ((p[-1][1] - p[0][0]) / div))
    R['decl'] = st.mean(slopes); R['peak'] = st.mean(peaks)
    R['rep'] = st.mean(st.mean(1 if b[3] == a[3] else 0 for a, b in zip(p, p[1:])) for p in ph)
    R['npvi'] = st.mean(npvi([(n[1] - n[0]) / div for n in p]) for p in ph)
    R['gap'] = st.mean(abs(b[0][3] - a[-1][3]) for a, b in zip(ph, ph[1:]))
    return R


COLS = ['n', 'len', 'lvar', 'pick', 'fin', 'q>a', 'rise', 'decl', 'peak', 'rep', 'npvi', 'gap']


def row(name, R):
    f = {'n': '%3d', 'len': '%5.1f', 'npvi': '%5.0f', 'gap': '%4.1f', 'decl': '%+5.2f'}
    return '%-34s ' % name[:34] + ' '.join((f.get(c, '%5.2f') % R[c]).rjust(5) for c in COLS)


if __name__ == '__main__':
    args = sys.argv[1:]
    print('%-34s ' % 'song' + ' '.join(c.rjust(5) for c in COLS))
    if args and args[0] == 'corpus':
        for g in args[1:]:
            rs = []
            for f in sorted(glob.glob(g)):
                try:
                    r = analyse(f)
                    if r: rs.append(r)
                except Exception: pass
            if rs: print(row('%s (%d)' % (g, len(rs)), {c: st.mean(r[c] for r in rs) for c in COLS}))
    else:
        for a in args:
            try:
                r = analyse(a)
                print(row(os.path.basename(a), r) if r else a + ': too short')
            except Exception as e: print(a, 'ERR', e)
