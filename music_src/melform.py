#!/usr/bin/env python3
"""Melody shape report for our songs, against what the Sinnoh town / route themes do
(Hooktheory data in STYLE_DP.md: about 0.7-1.0 beats per note, ~90% stepwise, ~60% chord tones,
heavy rhythmic repetition, phrases ending on stable degrees, one climax per section past its middle).

  python3 melform.py brinehollow route1 ...

Per melody part and section:
  bpn     beats per note            step    moves of 1-2 semitones      leap   moves > a 4th
  ct      notes that are chord tones (onset, any chord tone incl. written extensions)
  rhy     2-bar windows whose rhythm repeats an earlier window of the section (the motif's identity)
  ends    scale degree of each phrase-final note (held >= 1.5 beats or followed by a rest)
  peak    bar of the section's highest note / section length
"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import mfw, songs  # noqa: F401

NAMES = {0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 6: '#4', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'}
KEYS = {'C': 0, 'Db': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'Gb': 6, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}


def report(sid, variant='day'):
    s = mfw.make(sid, variant)
    bar = s.bar
    secs = [s.sec[n] for n in s.order]
    print(f'== {sid}  bpm {s.bpm}  form: ' + ' '.join(f'{sec.name}({sec.bars})' for sec in secs))
    for name, part in s.parts.items():
        if part.kit or part.role not in ('lead',): continue
        ns = sorted(part.notes)
        for sec in secs:
            a, b = sec.at, sec.at + sec.bars * bar
            sn = [n for n in ns if a <= n[0] < b]
            if len(sn) < 4: continue
            tonic = KEYS.get(getattr(sec, 'key', None) or s.key, 0) + (0 if getattr(sec, 'key', None) else (sec.transpose or 0))
            span = sum(n[1] for n in sn)
            iv = [sn[i][2] - sn[i - 1][2] for i in range(1, len(sn))]
            step = sum(1 for d in iv if 1 <= abs(d) <= 2) / max(1, len(iv)); leap = sum(1 for d in iv if abs(d) > 5) / max(1, len(iv))
            ct = 0
            for (t, d, p, v, art) in sn:
                c, _ = mfw.chord_at_beat(s, t + 1e-4)
                if c and (p % 12) in set(c.pcs()) | set(c.template()) | {c.bass}: ct += 1
            wins, rep, tot = [], 0, 0
            for w0 in range(0, sec.bars, 2):
                r = tuple(round((n[0] - a - w0 * bar) * 4) for n in sn if a + w0 * bar <= n[0] < a + (w0 + 2) * bar)
                if not r: continue
                tot += 1
                if r in wins: rep += 1
                wins.append(r)
            ends = []
            for i, (t, d, p, v, art) in enumerate(sn):
                gap = sn[i + 1][0] - (t + d) if i + 1 < len(sn) else 2
                if d >= 1.5 or gap >= 1: ends.append(NAMES[(p - tonic) % 12])
            top = max(sn, key=lambda n: n[2])
            pk = int((top[0] - a) // bar) + 1
            print(f'  {name:7s} {sec.name:5s} bpn {span / len(sn):.2f}  step {step:.0%} leap {leap:.0%} ct {ct / len(sn):.0%} rhy {rep}/{tot}  peak {pk}/{sec.bars}  ends {" ".join(ends)}')


if __name__ == '__main__':
    for a in sys.argv[1:]:
        sid, _, var = a.partition(':')
        report(sid, var or 'day')
