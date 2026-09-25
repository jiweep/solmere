#!/usr/bin/env python3
"""Read the sequences (SSEQ) out of a Nintendo DS sound archive (SDAT) and write them as MIDI files, one
track per sequence track, so the reference melodies can be studied note-exact.

  python3 sdat.py <file.sdat> --list              names of every sequence
  python3 sdat.py <file.sdat> <outdir> [regex]     write <outdir>/<NAME>.mid for matching sequences

SSEQ is a MIDI-like byte stream at 48 ticks per quarter: 0x00-0x7F note (vel, varlen dur), 0x80 rest,
0x81 program, 0x93 open track, 0x94 jump, 0x95 call, 0xFD return, 0xD4/0xFC loop, 0xC7 mono/poly
(note-wait), 0xE1 tempo, 0xC3 transpose, and assorted one/two-byte controls that the study ignores.
The song's loop jump ends a track (the loop body plays once).
"""
import sys, os, re, struct

PPQ = 48


def u8(b, o): return b[o]
def u16(b, o): return struct.unpack_from('<H', b, o)[0]
def u32(b, o): return struct.unpack_from('<I', b, o)[0]
def u24(b, o): return b[o] | (b[o + 1] << 8) | (b[o + 2] << 16)


def varlen(b, o):
    v = 0
    while True:
        c = b[o]; o += 1
        v = (v << 7) | (c & 0x7F)
        if not c & 0x80: return v, o


def sequences(sdat):
    b = open(sdat, 'rb').read()
    assert b[:4] == b'SDAT'
    symb, info, fat = u32(b, 0x10), u32(b, 0x18), u32(b, 0x20)
    names = []
    if symb:
        rec = symb + u32(b, symb + 8)
        n = u32(b, rec)
        for i in range(n):
            so = u32(b, rec + 4 + 4 * i)
            if so == 0: names.append(None); continue
            e = b.index(b'\0', symb + so); names.append(b[symb + so:e].decode('latin1'))
    rec = info + u32(b, info + 8)
    n = u32(b, rec)
    nfat = u32(b, fat + 8)
    out = []
    for i in range(n):
        eo = u32(b, rec + 4 + 4 * i)
        if eo == 0: continue
        fid = u16(b, info + eo)
        if fid >= nfat: continue
        fo, fs = u32(b, fat + 12 + 16 * fid), u32(b, fat + 12 + 16 * fid + 4)
        name = names[i] if i < len(names) and names[i] else f'SEQ_{i:04d}'
        out.append((i, name, b[fo:fo + fs]))
    return out


def parse_sseq(s):
    assert s[:4] == b'SSEQ', s[:4]
    base = u32(s, 0x18)
    d = s[base:]
    tracks = {}      # track number -> list of events
    tempos = []

    def run(tn, pc, t0=0):
        ev = []; t = 0; stack = []; loops = []; wait = True; tr = 0; prog = 0; steps = 0
        seen_jump = set()
        while pc < len(d) and steps < 200000:
            steps += 1
            c = d[pc]; pc += 1
            if c < 0x80:
                vel = d[pc]; pc += 1
                dur, pc = varlen(d, pc)
                ev.append(('n', t, dur, c + tr, vel, prog))
                if wait: t += dur
            elif c == 0x80:
                w, pc = varlen(d, pc); t += w
            elif c == 0x81:
                prog, pc = varlen(d, pc); ev.append(('p', t, prog))
            elif c == 0x93:
                tno = d[pc]; off = u24(d, pc + 1); pc += 4
                tracks.setdefault(tno, None); pending.append((tno, off))
            elif c == 0x94:
                off = u24(d, pc); pc += 3
                if off < pc or off in seen_jump: ev.append(('loop', t, off)); break
                seen_jump.add(off); pc = off
            elif c == 0x95:
                off = u24(d, pc); pc += 3; stack.append(pc); pc = off
            elif c == 0xFD:
                if not stack: break
                pc = stack.pop()
            elif c == 0xD4:
                cnt = d[pc]; pc += 1; loops.append([pc, cnt])
            elif c == 0xFC:
                if loops:
                    L = loops[-1]
                    if L[1] > 1: L[1] -= 1; pc = L[0]
                    else: loops.pop()
            elif c == 0xFE:
                pc += 2
            elif c == 0xFF:
                break
            elif c == 0xC7:
                wait = d[pc] != 0; pc += 1            # 1 = mono: a note waits out its length
            elif c == 0xC3:
                v = d[pc]; tr = v - 256 if v > 127 else v; pc += 1
            elif c == 0xE1:
                tempos.append((t, u16(d, pc))); pc += 2
            elif 0xC0 <= c <= 0xD7:
                pc += 1
            elif c in (0xE0, 0xE3):
                pc += 2
            elif 0xB0 <= c <= 0xBD:
                pc += 3
            elif c == 0xA0:            # random: cmd, its args but the last, s16 min, s16 max
                sub = d[pc]; pc += 1 + _lead(sub) + 4
            elif c == 0xA1:            # variable: cmd, its args but the last, u8 variable
                sub = d[pc]; pc += 1 + _lead(sub) + 1
            elif c == 0xA2:            # if: next command runs if flag set (we always run it)
                pass
            else:
                pass
        return ev

    pending = [(0, 0)]
    done = {}
    while pending:
        tno, off = pending.pop(0)
        if tno in done: continue
        done[tno] = run(tno, off)
    return done, tempos


def _lead(cmd):
    """bytes of a command's arguments before its last one (which a random/variable prefix replaces)"""
    if cmd < 0x80: return 1          # velocity; the duration is replaced
    if 0xB0 <= cmd <= 0xBD: return 1 # variable number; the value is replaced
    return 0


def vlq(n):
    out = [n & 0x7F]; n >>= 7
    while n: out.append(0x80 | (n & 0x7F)); n >>= 7
    return bytes(reversed(out))


def write_midi(path, tracks, tempos):
    chunks = []
    # conductor
    evs = [(t, b'\xff\x51\x03' + int(60e6 / max(1, bpm)).to_bytes(3, 'big')) for t, bpm in (tempos or [(0, 120)])]
    chunks.append(_track(evs))
    for ch, (tno, ev) in enumerate(sorted(tracks.items())):
        c = ch % 16
        if c == 9: c = 15
        out = []
        for e in ev:
            if e[0] == 'p': out.append((e[1], bytes([0xC0 | c, e[2] & 0x7F])))
            elif e[0] == 'n':
                _, t, dur, p, v, pr = e
                if not 0 <= p < 128: continue
                out.append((t, bytes([0x90 | c, p, max(1, v & 0x7F)])))
                out.append((t + max(1, dur), bytes([0x80 | c, p, 0])))
        chunks.append(_track(out, name=f'T{tno}'))
    hdr = b'MThd' + struct.pack('>IHHH', 6, 1, len(chunks), PPQ)
    open(path, 'wb').write(hdr + b''.join(chunks))


def _track(evs, name=None):
    evs = sorted(evs, key=lambda e: (e[0], 0 if e[1][0] & 0xF0 == 0x80 else 1))
    body = b''
    if name: body += b'\x00\xff\x03' + bytes([len(name)]) + name.encode()
    last = 0
    for t, m in evs:
        body += vlq(t - last) + m; last = t
    body += b'\x00\xff\x2f\x00'
    return b'MTrk' + struct.pack('>I', len(body)) + body


if __name__ == '__main__':
    seqs = sequences(sys.argv[1])
    if sys.argv[2] == '--list':
        for i, n, data in seqs: print(i, n, len(data))
        sys.exit()
    outdir = sys.argv[2]; os.makedirs(outdir, exist_ok=True)
    pat = re.compile(sys.argv[3]) if len(sys.argv) > 3 else None
    for i, n, data in seqs:
        if pat and not pat.search(n): continue
        try:
            tracks, tempos = parse_sseq(data)
        except Exception as e:
            print('skip', n, e); continue
        write_midi(os.path.join(outdir, n + '.mid'), {k: v for k, v in tracks.items() if v}, tempos)
