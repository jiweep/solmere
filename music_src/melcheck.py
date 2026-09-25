#!/usr/bin/env python3
"""Melody checker: does the tune fit its chords and the notes actually played under it?

  python3 melcheck.py brinehollow route1:night ...

Per melody note (lead/solo/counter parts, after finalize):
  STRONG  non-chord tone on a strong beat (1 or 3; 1 in 3/4) or held >= 1 beat
  RUB     a semitone (m2 / M7 / m9) against an accompaniment or bass note sounding with it
  LOOSE   weak-beat non-chord tone neither approached nor left by step
  LEAP    leap larger than a fifth not followed by a step back the other way
and per part: beats per note, longest run of notes shorter than a beat.
Chord tones = every tone the symbol spells (with extensions) plus the voicing template.
"""
import sys, os, bisect
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mfw, songs  # noqa: F401

NN = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
def nm(p): return NN[p % 12] + str(p // 12 - 1)

ACC = ('comp', 'pad', 'arp')


def check(sid, variant='day', verbose=True):
    s = mfw.make(sid, variant)
    bar = s.bar
    mel = [(n, p) for n, p in s.parts.items() if not p.kit and p.role in ('lead', 'solo', 'counter')]
    acc = []
    for n, p in s.parts.items():
        if p.kit or (p.role not in ACC and n != 'bass'): continue
        acc += [(t, t + d, pp, n) for (t, d, pp, v, a) in p.notes]
    acc.sort()
    starts = [a[0] for a in acc]
    report = []
    for name, part in mel:
        ns = sorted(part.notes)
        for i, (t, d, p, v, a) in enumerate(ns):
            c, sec = mfw.chord_at_beat(s, t + 1e-4)
            if c is None: continue
            allowed = set(c.pcs()) | set(c.template()) | {c.bass}
            rel = t - sec.at
            beat = rel % bar
            where = f'{sec.name} bar {int(rel // bar) + 1} beat {beat + 1:g}'
            strong = abs(beat) < 1e-6 or (bar == 4 and abs(beat - 2) < 1e-6)
            nct = p % 12 not in allowed
            prv = ns[i - 1][2] if i > 0 and abs(ns[i - 1][0] + ns[i - 1][1] - t) < .6 else None
            nxt = ns[i + 1][2] if i + 1 < len(ns) and ns[i + 1][0] - (t + d) < .6 else None
            if nct and (strong or d >= 1 - 1e-6):
                report.append((name, 'STRONG', where, f'{nm(p)} over {c.sym} ({d:g} beats)'))
            elif nct:
                step = lambda q: q is not None and 1 <= abs(q - p) <= 2
                if not (step(prv) or step(nxt)): report.append((name, 'LOOSE', where, f'{nm(p)} over {c.sym}'))
            # semitone rubs against what sounds underneath
            j = bisect.bisect_right(starts, t + d)
            for (a0, a1, ap, an) in acc[max(0, j - 80):j]:
                ov = min(a1, t + d) - max(a0, t)
                if ov < .25: continue
                iv = p - ap   # a melody a major 7th over a chord tone is normal; m2 / m9 against it is not
                if iv in (1, 13, 25, 37) or -iv in (1, 11, 13, 23):
                    report.append((name, 'RUB', where, f'{nm(p)} vs {an} {nm(ap)} over {c.sym}')); break
            if nxt is not None and prv is not None and abs(p - prv) > 7:
                back = (nxt - p) * (p - prv) < 0 and abs(nxt - p) <= 2
                if not back: report.append((name, 'LEAP', where, f'{nm(prv)}->{nm(p)}->{nm(nxt)}'))
    stats = []
    for name, part in mel:
        ns = sorted(part.notes)
        if len(ns) < 4: continue
        span = sum(d for (t, d, p, v, a) in ns)
        run = best = 0
        for (t, d, p, v, a) in ns:
            run = run + 1 if d < 1 - 1e-6 else 0; best = max(best, run)
        stats.append(f'{name}: {span / len(ns):.2f} beats/note, longest run of short notes {best}')
    if verbose:
        print(f'== {sid} ({variant})  ' + ' | '.join(stats))
        kinds = {}
        for r in report: kinds[r[1]] = kinds.get(r[1], 0) + 1
        for r in report: print(f'  {r[1]:6s} {r[0]:8s} {r[2]:22s} {r[3]}')
        print('  totals', kinds or 'clean')
    return report, stats


if __name__ == '__main__':
    for arg in sys.argv[1:]:
        sid, _, var = arg.partition(':')
        check(sid, var or 'day')
