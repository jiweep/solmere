#!/usr/bin/env python3
"""Phrase architecture of a melody: every bar gets a letter so the form is visible at a glance.

  python3 form.py <file.mid> [track] [bars]      one track (default: the lead study.py picks)
  python3 form.py tracks <file.mid>              list tracks with range/coverage to pick the tune

Labels per bar:  A    a new idea            A    the same bar again exactly
                 A^   the same shape (rhythm + intervals) moved to another pitch (a sequence)
                 A'   the same rhythm, different notes      A~  the same notes, altered rhythm
                 .    rest bar                               -   held over from the bar before
The line under the form prints each bar in scale degrees (octave marks , ') with durations in beats,
so the motif and how it is varied can be read directly.
"""
import sys, os, collections
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import midiread
from study import key_of, choose_lead, mono_line, meter_of, NN

DEG = {0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'}


def deg(p, tonic, ref=72):
    d = DEG[(p - tonic) % 12]
    o = (p - (ref - 6)) // 12
    return d + ("'" * o if o > 0 else ',' * -o)


def load(path):
    """a MIDI file, or 'ours:<song>[:part]' read straight from our song definitions (mfw)"""
    if not path.startswith('ours:'): return midiread.read(path)
    import mfw, songs  # noqa: F401
    bits = path.split(':'); sid = bits[1]; parts = bits[2].split(',') if len(bits) > 2 else None
    s = mfw.make(sid, 'day'); div = 48; notes = []
    for i, (n, p) in enumerate(s.parts.items()):
        if p.kit or (parts and n not in parts) or (not parts and p.role not in ('lead', 'solo')): continue
        for (t, d, pp, v, a) in p.notes: notes.append((int(round(t * div)), int(round((t + d) * div)), i, pp, v, i))
    notes.sort()
    return dict(div=div, notes=notes, progs={}, tempos=[], ccs=[], names={})


def form(path, tk=None, nbars=64, verbose=True):
    m = load(path); div = m['div']
    best, tr, sc = choose_lead(m)
    key = best
    if tk is not None:
        ks = sorted(tr)
        key = ks[int(tk)] if str(tk).isdigit() and int(tk) < len(ks) else best
    lead = mono_line(tr[key], div)
    tonic, mode = key_of(m['notes'])
    bpb = meter_of(m, lead); bar = div * bpb
    t0 = min(n[0] for n in lead) // bar * bar
    nb = min(nbars, (max(n[1] for n in lead) - t0) // bar + 1)
    bars = []
    for b in range(nb):
        bs = t0 + b * bar
        ns = [n for n in lead if bs <= n[0] < bs + bar]
        held = any(n[0] < bs < n[1] for n in lead)
        rh = tuple(round((n[0] - bs) / div * 4) for n in ns)
        du = tuple(round(min(n[1], bs + bar) - n[0]) * 4 // div for n in ns)
        ps = tuple(n[3] for n in ns)
        iv = tuple(ps[i] - ps[i - 1] for i in range(1, len(ps)))
        bars.append(dict(ns=ns, held=held, rh=rh, du=du, ps=ps, iv=iv, bs=bs))
    labels, seen = [], []
    letters = iter('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz')
    for B in bars:
        if not B['ns']: labels.append('-' if B['held'] else '.'); continue
        lab = None
        for (L, S) in seen:
            if S['rh'] == B['rh'] and S['ps'] == B['ps']: lab = L; break
        if lab is None:
            for (L, S) in seen:
                if S['rh'] == B['rh'] and S['iv'] == B['iv'] and len(B['ps']) > 1: lab = L + '^'; break
        if lab is None:
            for (L, S) in seen:
                if S['rh'] == B['rh'] and len(B['ps']) > 1: lab = L + "'"; break
        if lab is None:
            for (L, S) in seen:
                if S['ps'] == B['ps'] and len(B['ps']) > 1: lab = L + '~'; break
        if lab is None:
            L = next(letters); seen.append((L, B)); lab = L
        labels.append(lab)
    # summary numbers: how much of the tune is literal repetition, sequence, rhythmic variation, new
    real = [l for l in labels if l not in ('.', '-')]
    first = set(); rep = seqc = var = new = 0
    for l in real:
        base = l.rstrip("^'~")
        if l == base and base in first: rep += 1
        elif l.endswith('^'): seqc += 1
        elif l.endswith("'") or l.endswith('~'): var += 1
        else: new += 1
        first.add(base)
    n = max(1, len(real))
    summary = dict(bars=nb, rep=rep / n, seq=seqc / n, var=var / n, new=new / n, ideas=len(first), rest=labels.count('.') / max(1, nb), held=labels.count('-') / max(1, nb))
    if verbose:
        print(f"{os.path.basename(path)}  key {NN[tonic]}{'m' if mode == 'min' else ''}  {bpb}/4  track {key}")
        print(f"  repeat {summary['rep'] * 100:.0f}%  sequence {summary['seq'] * 100:.0f}%  varied {summary['var'] * 100:.0f}%  new {summary['new'] * 100:.0f}%  ideas {summary['ideas']}  rest-bars {summary['rest'] * 100:.0f}%")
        for i in range(0, nb, 8):
            print('  ' + ' '.join(f'{l:4s}' for l in labels[i:i + 8]))
        if verbose == 'full':
            for i, B in enumerate(bars):
                if not B['ns']: continue
                print(f'  {i + 1:3d} {labels[i]:4s} ' + ' '.join(f"{deg(n[3], tonic)}:{(min(n[1], B['bs'] + bar) - n[0]) / div:g}" + ('' if (n[0] - B['bs']) % div == 0 else '@' + f"{(n[0] - B['bs']) / div:g}") for n in B['ns']))
    return summary, labels


def tracks(path):
    m = load(path); best, tr, sc = choose_lead(m)
    for i, k in enumerate(sorted(tr)):
        v = tr[k]; ps = [n[3] for n in v]
        print(f'{i:2d} {str(k):9s} n={len(v):4d} mean={sum(ps) / len(ps):5.1f} range={min(ps)}-{max(ps)} prog={m["progs"].get(k[1]) if isinstance(m["progs"], dict) else ""} {"<= lead" if k == best else ""}')


if __name__ == '__main__':
    if sys.argv[1] == 'tracks': tracks(sys.argv[2])
    else:
        a = sys.argv[1:]
        form(a[0], a[1] if len(a) > 1 and a[1] != '-' else None, int(a[2]) if len(a) > 2 else 64, verbose='full' if '--full' in a else True)
