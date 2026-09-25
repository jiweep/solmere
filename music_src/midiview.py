import midiread, sys, collections
NN = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B']
def nm(p): return NN[p % 12] + str(p // 12 - 1)
def view(path, bars=(0, 999), beats_per_bar=4, split=60):
    m = midiread.read(path); div = m['div']; n = m['notes']
    bar = div * beats_per_bar
    by = collections.defaultdict(list)
    for x in n: by[x[0] // bar].append(x)
    for b in sorted(by):
        if b < bars[0] or b > bars[1]: continue
        L = by[b]
        # per beat: pitches sounding at onset slices
        out = []
        for beat in range(beats_per_bar * 2):
            t0 = b * bar + beat * div // 2
            on = sorted(set(x[3] for x in L if x[0] == t0 or (x[0] < t0 < x[1] and False)))
            st = [x for x in L if t0 <= x[0] < t0 + div // 2]
            if not st: out.append('.'); continue
            lo = sorted(x[3] for x in st if x[3] < split); hi = sorted(x[3] for x in st if x[3] >= split)
            out.append(('[' + ' '.join(nm(p) for p in lo) + ']' if lo else '') + ' '.join(nm(p) for p in hi))
        vel = [x[4] for x in L]
        print(f'{b+1:3d} v{min(vel):3d}-{max(vel):3d} | ' + ' | '.join(out))
if __name__ == '__main__':
    view(sys.argv[1], (int(sys.argv[2]), int(sys.argv[3])), split=int(sys.argv[4]) if len(sys.argv) > 4 else 60)
