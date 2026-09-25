#!/usr/bin/env python3
"""A lead in compact form for reading many at once: per bar the bass degree(s) in [ ] and the melody as
degree:beats (octave marks ' up , down relative to the tonic nearest middle register; r = rest).
  python3 leads.py <file.mid|ours:id> [bars]"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from study import key_of, choose_lead, mono_line, meter_of, pitched
from craft import load_full
DEG = {0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'}
def dur(x):
    for a, s in ((1/3, 't'), (2/3, '2t'), (1/6, 't16')):
        if abs(x - a) < .04: return s
    x = round(x * 4) / 4
    return ('%g' % x)
def show(path, nbars=32):
    m, forced = load_full(path); div = m['div']
    best, tr, sc = choose_lead(m)
    if forced: best = forced
    lead = mono_line(tr[best], div)
    tonic, mode = key_of(m['notes'])
    bpb = meter_of(m, lead); bar = div * bpb
    ref = min(range(48, 96), key=lambda r: abs(r - sorted(n[3] for n in lead)[len(lead) // 2]) if r % 12 == tonic else 99)
    def dg(p):
        o = (p - ref + 5) // 12   # the octave the note sits in, relative to the tune's middle tonic (5 below .. 6 above)
        return DEG[(p - tonic) % 12] + ("'" * o if o > 0 else ',' * -o)
    band = [n for n in pitched(m['notes']) if (n[5], n[2]) != best]
    t0 = min(n[0] for n in lead) // bar * bar
    out = ['%s  %s %s  %d/4' % (os.path.basename(path), ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'][tonic], mode, bpb)]
    for b in range(nbars):
        bs = t0 + b * bar
        if bs > lead[-1][1]: break
        bass = []
        for h in range(2 if bpb == 4 else 1):
            hs = bs + h * (bar // 2 if bpb == 4 else bar)
            lo = [n for n in band if n[0] < hs + div // 2 and n[1] > hs]
            if lo: bass.append(DEG[(min(lo, key=lambda n: n[3])[3] - tonic) % 12])
        toks, t = [], bs
        for n in lead:
            if n[1] <= bs or n[0] >= bs + bar: continue
            if n[0] < bs: toks.append('~%s' % dur((min(n[1], bs + bar) - bs) / div)); t = min(n[1], bs + bar); continue
            if n[0] - t >= div // 4: toks.append('r:' + dur((n[0] - t) / div))
            toks.append('%s:%s' % (dg(n[3]), dur((min(n[1], bs + bar) - n[0]) / div))); t = min(n[1], bs + bar)
        if bs + bar - t >= div // 4 and t < bs + bar: toks.append('r:' + dur((bs + bar - t) / div))
        out.append('%2d [%s] %s' % (b + 1, ' '.join(bass), ' '.join(toks)))
    return '\n'.join(out)
if __name__ == '__main__':
    n = int(sys.argv[2]) if len(sys.argv) > 2 else 32
    print(show(sys.argv[1], n))
