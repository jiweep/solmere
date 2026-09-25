# Inspect the combined harmony of a song: at each chord onset list every sounding pitched note by part,
# and flag clashes (minor 2nds/9ths between accompaniment parts, clashes with the melody), stacked
# fourths/fifths, low-register mud and duplicated tensions across parts.
import sys, collections
import mfw, songs
NN = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
def nm(p): return NN[p % 12] + str(p // 12 - 1)
def check(sid, variant='day', show=12, verbose=True):
    s = mfw.make(sid, variant)
    melody_parts = {n for n, p in s.parts.items() if getattr(p, 'role', '') in ('lead',) or n.startswith('lead')}
    issues = collections.Counter(); shown = 0
    for sec in s.sec.values():
        for (t, d, c) in sec.chords:
            T = sec.at + t + .02
            snd = []
            for n, p in s.parts.items():
                if p.kit: continue
                for (t0, dd, pp, v, a) in p.notes:
                    if t0 <= T < t0 + dd: snd.append((pp, n))
            acc = sorted(set(pp for pp, n in snd if n not in melody_parts))
            mel = sorted(set(pp for pp, n in snd if n in melody_parts))
            flags = []
            for i, a in enumerate(acc):
                for b in acc[i + 1:]:
                    iv = (b - a) % 12
                    if b - a in (1, 13) and a >= 48: flags.append(f'm2/m9 {nm(a)}-{nm(b)}')
            for m in mel:
                for a in acc:
                    if 0 < m - a <= 2 and (m - a) == 1: flags.append(f'melody {nm(m)} rubs {nm(a)}')
            # stacked perfect intervals (3+ notes in a row of 4ths/5ths) in the mid register
            up = [p for p in acc if p >= 50]
            for i in range(len(up) - 2):
                if (up[i + 1] - up[i]) in (5, 7) and (up[i + 2] - up[i + 1]) in (5, 7): flags.append(f'stacked 4/5 {nm(up[i])}-{nm(up[i+1])}-{nm(up[i+2])}'); break
            low = [p for p in acc if p < 52]
            for i in range(len(low) - 1):
                if low[i + 1] - low[i] in (3, 4) and low[i] < 48: flags.append(f'mud {nm(low[i])}-{nm(low[i+1])}')
            for f in flags: issues[f.split(' ')[0] + ' ' + f.split(' ')[1] if f.startswith('stacked') else f.split(' ')[0]] += 1
            if verbose and flags and shown < show:
                shown += 1
                by = collections.defaultdict(list)
                for pp, n in snd: by[n].append(nm(pp))
                print(f'  {sec.name}+{t:5.1f} {c.sym:10s} ' + ' | '.join(f'{n}:{" ".join(sorted(set(v), key=lambda x: mfw.note(x.lower()) if False else 0))}' for n, v in by.items()))
                print('     ->', '; '.join(flags[:6]))
    return issues
if __name__ == '__main__':
    for sid in sys.argv[1:]:
        print('==', sid, dict(check(sid)))
