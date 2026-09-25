#!/usr/bin/env python3
"""Print several parts of a song bar by bar as note names with beat positions, to read how they interlock.
  python3 score.py <file.mid|ours:id> <bar0> <bar1> [part keys like 1,0 4,3 ...]   (lead first by default)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from study import choose_lead, mono_line, meter_of, NN
from craft import load_full
path, b0, b1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
m, forced = load_full(path); div = m['div']
best, tr, sc = choose_lead(m)
if forced: best = forced
keys = [best] + [tuple(int(x) for x in a.split(',')) for a in sys.argv[4:]]
lead = mono_line(tr[best], div); bpb = meter_of(m, lead); bar = div * bpb
t0 = min(n[0] for n in lead) // bar * bar
def nm(p): return NN[p % 12] + str(p // 12 - 1)
for b in range(b0 - 1, b1):
    bs = t0 + b * bar
    print('bar %d' % (b + 1))
    for k in keys:
        ns = [n for n in mono_line(tr[k], div) if bs <= n[0] < bs + bar]
        print('   %-7s %s' % ('lead' if k == best else '%d,%d' % k, '  '.join('%s@%g(%g)' % (nm(n[3]), (n[0] - bs) / div + 1, round((n[1] - n[0]) / div, 2)) for n in ns)))
