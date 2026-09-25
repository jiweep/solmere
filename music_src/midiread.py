# Minimal standard MIDI file reader: notes (abs ticks), programs, tempo, CCs per channel.
import struct
def vlq(d, i):
    v = 0
    while True:
        b = d[i]; i += 1; v = (v << 7) | (b & 0x7f)
        if not b & 0x80: return v, i
def read(path):
    d = open(path, 'rb').read()
    assert d[:4] == b'MThd'
    fmt, ntr, div = struct.unpack('>HHH', d[8:14])
    i = 14; tracks = []
    for _ in range(ntr):
        assert d[i:i + 4] == b'MTrk', d[i:i+4]
        ln = struct.unpack('>I', d[i + 4:i + 8])[0]; tracks.append(d[i + 8:i + 8 + ln]); i += 8 + ln
    notes, progs, tempos, ccs, names = [], {}, [], [], {}
    for ti, t in enumerate(tracks):
        j = 0; tick = 0; run = None; on = {}
        while j < len(t):
            dt, j = vlq(t, j); tick += dt
            st = t[j]
            if st == 0xFF:
                typ = t[j + 1]; ln, k = vlq(t, j + 2); data = t[k:k + ln]; j = k + ln
                if typ == 0x51: tempos.append((tick, struct.unpack('>I', b'\0' + data)[0]))
                if typ == 0x03: names[ti] = data.decode('latin1')
                continue
            if st in (0xF0, 0xF7):
                ln, k = vlq(t, j + 1); j = k + ln; continue
            if st & 0x80: run = st; j += 1
            s = run; ch = s & 0xF; kind = s & 0xF0
            if kind in (0xC0, 0xD0): a = t[j]; j += 1; b = 0
            else: a, b = t[j], t[j + 1]; j += 2
            if kind == 0x90 and b > 0: on.setdefault((ch, a), []).append((tick, b))
            elif kind == 0x80 or (kind == 0x90 and b == 0):
                if on.get((ch, a)):
                    t0, v = on[(ch, a)].pop(0); notes.append((t0, tick, ch, a, v, ti))
            elif kind == 0xC0: progs.setdefault(ch, []).append((tick, a))
            elif kind == 0xB0: ccs.append((tick, ch, a, b))
    notes.sort()
    return dict(div=div, fmt=fmt, notes=notes, progs=progs, tempos=tempos, ccs=ccs, names=names)
