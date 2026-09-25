#!/usr/bin/env python3
"""What every part of an arrangement does relative to the tune.

  python3 parts.py <file.mid|ours:id>

Per part: notes a bar, register, share of steps, and how it relates to the lead:
  with   share of its notes that start together with a lead note (homorhythm: harmonising the tune)
  gaps   share of its notes that start while the lead holds or rests (answering, filling)
  iv     the commonest interval to the lead when both sound (3rds/6ths = a harmony line, 8ve = doubling)
  contra share of contrary motion against the lead
"""
import sys, os, collections, statistics as st
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from study import choose_lead, mono_line, meter_of, pitched, NN
from craft import load_full

path = sys.argv[1]
m, forced = load_full(path); div = m['div']
best, tr, sc = choose_lead(m)
if forced: best = forced
lead = mono_line(tr[best], div)
bpb = meter_of(m, lead); bar = div * bpb
t0 = min(n[0] for n in lead) // bar * bar; t1 = max(n[1] for n in lead)
nb = max(1, (t1 - t0) / bar)
lon = {n[0] for n in lead}
def lead_at(t):
    for n in lead:
        if n[0] <= t < n[1]: return n
    return None
IVN = {0: '8ve', 1: 'b2', 2: '2', 3: 'm3', 4: 'M3', 5: '4', 6: 'tt', 7: '5', 8: 'm6', 9: 'M6', 10: 'm7', 11: 'M7'}
print('%s  lead %s  %d/%d  %.0f bars' % (os.path.basename(path), best, bpb, 4, nb))
print('%-10s %6s %9s %6s %6s %6s %6s %6s' % ('part', 'n/bar', 'range', 'steps', 'with', 'gaps', 'iv', 'contra'))
keep = {(n[5], n[2]) for n in pitched(m['notes'])}
for k, v in sorted(tr.items(), key=lambda kv: -st.mean(x[3] for x in kv[1])):
    v = [n for n in v if t0 <= n[0] < t1]
    if len(v) < 4 or k not in keep: continue
    ml = mono_line(v, div)
    ivs = [abs(b[3] - a[3]) for a, b in zip(ml, ml[1:])]
    steps = st.mean(1 if 0 < x <= 2 else 0 for x in ivs) if ivs else 0
    with_ = st.mean(1 if n[0] in lon else 0 for n in ml)
    gaps = 0; ivc = collections.Counter(); con = par = 0; prev = None
    for n in ml:
        L = lead_at(n[0])
        if L is None or L[0] < n[0] - div // 2: gaps += 1
        if L: ivc[(L[3] - n[3]) % 12] += 1
        if L and prev and prev[1] and n[3] != prev[0][3] and L[3] != prev[1][3]:
            if (n[3] - prev[0][3]) * (L[3] - prev[1][3]) < 0: con += 1
            else: par += 1
        prev = (n, L)
    iv = IVN[ivc.most_common(1)[0][0]] if ivc else '-'
    lo, hi = min(n[3] for n in v), max(n[3] for n in v)
    tag = 'LEAD' if k == best else str(k)
    print('%-10s %6.1f %4s-%-4s %6.2f %6.2f %6.2f %6s %6.2f' % (tag, len(ml) / nb, NN[lo % 12] + str(lo // 12 - 1), NN[hi % 12] + str(hi // 12 - 1), steps, with_, gaps / len(ml), iv, con / max(1, con + par)))
