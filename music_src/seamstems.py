import os, sys, json, glob, math
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build
W = build.WORK; SR = build.SR
id = sys.argv[1]; fn = id.replace('@', '_')
meta = json.load(open(f'{W}/{fn}.json'))
ls, le = meta['loopStart'], meta['loopEnd']
L = int(round((le - ls) * SR)); b = int(round(ls * SR))
for f in sorted(glob.glob(f'{W}/{fn}/*.wav')):
    if f.endswith(('mix.wav', 'dec.wav')): continue
    x = build.read_wav(f)
    n = min(len(x) - (b + L), int(.9 * SR))
    p1, p2 = x[b:b + n], x[b + L:b + L + n]
    r = np.sqrt((p1 ** 2).mean()) + 1e-12
    d = np.abs(p1 - p2).max(axis=1); idx = np.where(d > 1e-3)[0]
    print(f'{os.path.basename(f):16s} mismatch {20 * math.log10(np.sqrt(((p1 - p2) ** 2).mean()) / r + 1e-12):7.1f} dB   rms {20 * math.log10(r):6.1f}  first>1e-3 at +{idx[0] / SR if len(idx) else "-"}')
