"""Texture metrics: compare rendered songs (_work/<id>/job.json) with reference MIDIs.

For every eighth-note slice (by time), collect the pitched notes sounding across all
non-drum stems and report:
  dens   average number of distinct pitch classes sounding
  notes  average number of simultaneous pitched notes
  q45    share of slices containing a stack of 3+ notes in consecutive 4ths/5ths
  low    share of slices with a close interval (< P5) below C3 (mud)
  clash  share of slices where two parts a semitone / minor 9th apart sound together
  dyn    spread of 4-bar average velocity (max - min): dynamics across the song

usage: python3 texture.py [song ids...]    (no args: all songs + refs)
"""
import json, sys, os, glob, statistics
import mido

HERE = os.path.dirname(os.path.abspath(__file__))


def slices_from_notes(notes, step):
    """notes: list of (t0, t1, pitch, vel, part)"""
    if not notes: return []
    end = max(n[1] for n in notes)
    out = []
    notes = sorted(notes)
    t = 0.0; i = 0; active = []
    while t < end:
        while i < len(notes) and notes[i][0] <= t + 1e-6: active.append(notes[i]); i += 1
        active = [n for n in active if n[1] > t + step * .25]
        out.append((t, [(n[2], n[3], n[4]) for n in active]))
        t += step
    return out


def metrics(sl, bar):
    dens = []; nn = []; q45 = 0; low = 0; clash = 0; cnt = 0; vbars = {}
    for t, act in sl:
        if not act: continue
        cnt += 1
        ps = sorted(set(p for p, _, _ in act))
        dens.append(len(set(p % 12 for p in ps))); nn.append(len(ps))
        run = 1
        for a, b in zip(ps, ps[1:]):
            if b - a in (5, 7): run += 1
            else: run = 1
            if run >= 3: q45 += 1; break
        for a, b in zip(ps, ps[1:]):
            if a < 48 and b - a < 7: low += 1; break
        parts = {}
        for p, v, part in act: parts.setdefault(part, set()).add(p)
        keys = list(parts)
        hit = False
        for x in range(len(keys)):
            for y in range(x + 1, len(keys)):
                for p in parts[keys[x]]:
                    for q in parts[keys[y]]:
                        if abs(p - q) in (1, 13): hit = True
        clash += hit
        for p, v, _ in act: vbars.setdefault(int(t / (bar * 4)), []).append(v)
    if not cnt: return None
    vb = [statistics.mean(v) for v in vbars.values() if v]
    return dict(dens=statistics.mean(dens), notes=statistics.mean(nn), q45=q45 / cnt, low=low / cnt, clash=clash / cnt, dyn=(max(vb) - min(vb)) if vb else 0)


def song_notes(sid):
    j = json.load(open(os.path.join(HERE, '_work', sid, 'job.json')))
    notes = []
    for st in j['stems']:
        if st.get('channel') == 9 or st.get('kit'): continue
        name = os.path.basename(st['out'])[:-4]
        on = {}
        for e in st['events']:
            t, typ = e[0], e[1]
            if typ == 0x90 and e[3] > 0: on[e[2]] = (t, e[3])
            elif typ in (0x80, 0x90) and e[2] in on:
                t0, v = on.pop(e[2]); notes.append((t0, t, e[2], v, name))
    return notes


def midi_notes(path):
    m = mido.MidiFile(path); notes = []; t = 0.0; on = {}; tempo = None
    for msg in m:
        t += msg.time
        if msg.type == 'note_on' and msg.velocity and msg.channel != 9: on[(msg.channel, msg.note)] = (t, msg.velocity)
        elif msg.type in ('note_off', 'note_on') and getattr(msg, 'channel', 9) != 9 and (msg.channel, msg.note) in on:
            t0, v = on.pop((msg.channel, msg.note)); notes.append((t0, t, msg.note, v, 'ch%d' % msg.channel))
    return notes


def row(name, m):
    print(f"{name[:34]:34} dens {m['dens']:.2f} notes {m['notes']:.2f} q45 {m['q45']:.2f} low {m['low']:.2f} clash {m['clash']:.2f} dyn {m['dyn']:5.1f}")


if __name__ == '__main__':
    ids = sys.argv[1:]
    if not ids or ids == ['refs']:
        for f in sorted(glob.glob(os.path.join(HERE, 'ref', '*.mid'))):
            if '(1)' in f: continue
            n = midi_notes(f); row('REF ' + f.split(' - ')[-1], metrics(slices_from_notes(n, .25), .5))
        if ids == ['refs']: sys.exit()
        ids = sorted(d for d in os.listdir(os.path.join(HERE, '_work')) if os.path.exists(os.path.join(HERE, '_work', d, 'job.json')))
    for sid in ids:
        try: n = song_notes(sid)
        except FileNotFoundError: print(sid, 'no job'); continue
        m = metrics(slices_from_notes(n, .25), .5)
        if m: row(sid, m)
