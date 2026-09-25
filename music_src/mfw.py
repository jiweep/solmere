"""
Solmere music framework.

Songs are written as Python: hand-composed melodies in a compact notation, chord
charts with jazz extensions, and pattern generators (walking bass, comping,
voice-led pads, drum grooves) that follow the charts. A Song compiles to
per-instrument MIDI event streams that `render` (Swift, Apple GS sound bank)
turns into stems, which build.py mixes into loop-ready MP3s.

Time is measured in beats (quarter notes) until the final conversion to seconds.
"""
import re, math, random, itertools

# ------------------------------------------------------------------ GM programs
PIANO, BRIGHT, EPIANO, EP2, HARPSI, CLAV, CELESTA, GLOCK, MUSICBOX, VIBES, MARIMBA, XYLO, BELLS, DULCIMER = 0, 1, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
ORGAN, PERCORGAN, ROCKORGAN, ACCORDION, HARMONICA, BANDONEON = 16, 17, 18, 21, 22, 23
NYLON, STEEL, JAZZGTR, CLEANGTR, MUTEDGTR, OVERDRIVE, DISTGTR = 24, 25, 26, 27, 28, 29, 30
ACBASS, FINGERBASS, PICKBASS, FRETLESS, SLAP, SLAP2, SYNBASS, SYNBASS2 = 32, 33, 34, 35, 36, 37, 38, 39
VIOLIN, VIOLA, CELLO, CONTRABASS, TREMSTR, PIZZ, HARP, TIMPANI = 40, 41, 42, 43, 44, 45, 46, 47
STRINGS, SLOWSTR, SYNSTR, SYNSTR2, CHOIR, OOHS, SYNVOX, ORCHHIT = 48, 49, 50, 51, 52, 53, 54, 55
TRUMPET, TROMBONE, TUBA, MUTETPT, HORN, BRASS, SYNBRASS, SYNBRASS2 = 56, 57, 58, 59, 60, 61, 62, 63
SOPSAX, ALTOSAX, TENORSAX, BARISAX, OBOE, ENGHORN, BASSOON, CLARINET = 64, 65, 66, 67, 68, 69, 70, 71
PICCOLO, FLUTE, RECORDER, PANFLUTE, BOTTLE, SHAKU, WHISTLE, OCARINA = 72, 73, 74, 75, 76, 77, 78, 79
SQUARELEAD, SAWLEAD, CALLIOPE, CHIFF, CHARANG, VOICELEAD, FIFTHS, BASSLEAD = 80, 81, 82, 83, 84, 85, 86, 87
NEWAGE, WARMPAD, POLYSYNTH, CHOIRPAD, BOWED, METALPAD, HALOPAD, SWEEPPAD = 88, 89, 90, 91, 92, 93, 94, 95
RAIN, SOUNDTRACK, CRYSTAL, ATMOS, BRIGHTNESS, GOBLIN, ECHOES, SCIFI = 96, 97, 98, 99, 100, 101, 102, 103
SITAR, BANJO, SHAMISEN, KOTO, KALIMBA, BAGPIPE, FIDDLE, SHANAI = 104, 105, 106, 107, 108, 109, 110, 111
TINKLE, AGOGO, STEELDRUM, WOODBLOCK, TAIKO, MELOTOM, SYNDRUM, REVCYM = 112, 113, 114, 115, 116, 117, 118, 119
# GS drum kits (program numbers on the percussion channel)
KIT_STD, KIT_ROOM, KIT_POWER, KIT_ELEC, KIT_808, KIT_JAZZ, KIT_BRUSH, KIT_ORCH = 0, 8, 16, 24, 25, 32, 40, 48

DRUM = dict(K=36, K2=35, S=38, S2=40, rim=37, clap=39, H=42, P=44, O=46, R=51, B=53, C=49, C2=57, spl=55, chi=52,
            T1=50, T2=48, T3=47, T4=45, T5=43, T6=41, tam=54, cb=56, sh=70, cab=69, tri=81, trim=80,
            cgh=62, cgo=63, cgl=64, bgh=60, bgl=61, tbh=65, tbl=66, agh=67, agl=68, cl=75, wbh=76, wbl=77,
            gs=73, gl=74, vib=58, whs=71, whl=72)
# brush kit: 38 = brush tap, 39 = brush slap, 40 = brush swirl

# ------------------------------------------------------------------ pitches
PC = {'c': 0, 'd': 2, 'e': 4, 'f': 5, 'g': 7, 'a': 9, 'b': 11}


def note(tok):
    """'c#5' -> 73 (c4 = middle C = 60)."""
    m = re.fullmatch(r'([a-gA-G])(##|#|bb|b)?(-?\d)', tok)
    if not m: raise ValueError('bad pitch ' + tok)
    acc = {'#': 1, '##': 2, 'b': -1, 'bb': -2}.get(m.group(2) or '', 0)
    return PC[m.group(1).lower()] + acc + (int(m.group(3)) + 1) * 12


def pcname(pc):
    return ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'][pc % 12]


# ------------------------------------------------------------------ chords
_Q = {  # quality -> {function: semitones}
    '': {1: 0, 3: 4, 5: 7}, 'maj': {1: 0, 3: 4, 5: 7}, 'm': {1: 0, 3: 3, 5: 7}, 'dim': {1: 0, 3: 3, 5: 6},
    'aug': {1: 0, 3: 4, 5: 8}, '+': {1: 0, 3: 4, 5: 8}, 'sus2': {1: 0, 2: 2, 5: 7}, 'sus4': {1: 0, 4: 5, 5: 7}, 'sus': {1: 0, 4: 5, 5: 7},
    '5': {1: 0, 5: 7},
    '6': {1: 0, 3: 4, 5: 7, 6: 9}, 'm6': {1: 0, 3: 3, 5: 7, 6: 9}, '69': {1: 0, 3: 4, 5: 7, 6: 9, 9: 14}, 'm69': {1: 0, 3: 3, 5: 7, 6: 9, 9: 14},
    '7': {1: 0, 3: 4, 5: 7, 7: 10}, 'maj7': {1: 0, 3: 4, 5: 7, 7: 11}, 'M7': {1: 0, 3: 4, 5: 7, 7: 11}, 'm7': {1: 0, 3: 3, 5: 7, 7: 10},
    'm7b5': {1: 0, 3: 3, 5: 6, 7: 10}, 'dim7': {1: 0, 3: 3, 5: 6, 7: 9}, 'mM7': {1: 0, 3: 3, 5: 7, 7: 11}, 'mmaj7': {1: 0, 3: 3, 5: 7, 7: 11},
    '9': {1: 0, 3: 4, 5: 7, 7: 10, 9: 14}, 'maj9': {1: 0, 3: 4, 5: 7, 7: 11, 9: 14}, 'm9': {1: 0, 3: 3, 5: 7, 7: 10, 9: 14},
    'mM9': {1: 0, 3: 3, 5: 7, 7: 11, 9: 14},
    '11': {1: 0, 4: 5, 5: 7, 7: 10, 9: 14}, 'm11': {1: 0, 3: 3, 5: 7, 7: 10, 9: 14, 11: 17},
    '13': {1: 0, 3: 4, 5: 7, 7: 10, 9: 14, 13: 21}, 'maj13': {1: 0, 3: 4, 5: 7, 7: 11, 9: 14, 13: 21}, 'm13': {1: 0, 3: 3, 5: 7, 7: 10, 9: 14, 13: 21},
    'add9': {1: 0, 3: 4, 5: 7, 9: 14}, 'madd9': {1: 0, 3: 3, 5: 7, 9: 14}, 'add2': {1: 0, 2: 2, 3: 4, 5: 7},
    '7sus4': {1: 0, 4: 5, 5: 7, 7: 10}, '7sus': {1: 0, 4: 5, 5: 7, 7: 10}, '9sus4': {1: 0, 4: 5, 5: 7, 7: 10, 9: 14}, '9sus': {1: 0, 4: 5, 5: 7, 7: 10, 9: 14},
    '13sus4': {1: 0, 4: 5, 5: 7, 7: 10, 9: 14, 13: 21}, '13sus': {1: 0, 4: 5, 5: 7, 7: 10, 9: 14, 13: 21},
    'alt': {1: 0, 3: 4, 7: 10, 9: 13, 'x9': 15, 13: 20}, '7alt': {1: 0, 3: 4, 7: 10, 9: 13, 'x9': 15, 13: 20},
    'maj7#11': {1: 0, 3: 4, 5: 7, 7: 11, 11: 18}, 'maj9#11': {1: 0, 3: 4, 5: 7, 7: 11, 9: 14, 11: 18},
    'm7#5': {1: 0, 3: 3, 5: 8, 7: 10},
}
_QKEYS = sorted(_Q, key=len, reverse=True)


class Chord:
    def __init__(self, sym):
        self.sym = sym
        m = re.fullmatch(r'([A-G])(#|b)?(.*?)(?:/([A-G])(#|b)?)?', sym)
        if not m: raise ValueError('bad chord ' + sym)
        self.root = (PC[m.group(1).lower()] + {'#': 1, 'b': -1}.get(m.group(2) or '', 0)) % 12
        rest = m.group(3)
        q = next(k for k in _QKEYS if rest.startswith(k))
        tones = dict(_Q[q]); rest = rest[len(q):]
        for alt in re.findall(r'\(?(add9|add11|add13|b9|#9|#11|b13|b5|#5|13|9|11)\)?', rest):
            if alt == 'b9': tones[9] = 13
            elif alt == '#9': tones['x9'] = 15
            elif alt == '#11': tones[11] = 18
            elif alt == 'b13': tones[13] = 20
            elif alt == 'b5': tones[5] = 6
            elif alt == '#5': tones[5] = 8
            elif alt in ('9', 'add9'): tones[9] = 14
            elif alt in ('11', 'add11'): tones[11] = 17
            elif alt in ('13', 'add13'): tones[13] = 21
            if alt in ('b9', '#9', '#11', 'b13', '9', '11', '13') and 7 not in tones and q not in ('', 'maj', 'm', 'add9'): tones[7] = 10
        self.tones = tones
        self.bass = (PC[m.group(4).lower()] + {'#': 1, 'b': -1}.get(m.group(5) or '', 0)) % 12 if m.group(4) else self.root
        self.minor = 3 in tones and tones[3] == 3
        self.dom = 7 in tones and tones[7] == 10 and not self.minor and tones.get(3) == 4

    def pcs(self, funcs=None):
        return [(self.root + v) % 12 for k, v in self.tones.items() if funcs is None or k in funcs]

    def pc(self, f):
        return (self.root + self.tones[f]) % 12 if f in self.tones else None

    def color_set(self, n=4):
        """Preferred pitch-class set for an n-note jazz voicing (guide tones first)."""
        t = self.tones
        g = [f for f in (3, 7) if f in t] or [f for f in (4, 2) if f in t]
        ext = [f for f in (9, 'x9', 13, 11, 6) if f in t and not (f == 11 and t.get(3) == 4 and t[11] == 17)]
        fill = [f for f in (5, 1) if f in t]
        order = g + [f for f in (4, 2) if f in t and f not in g] + ext + fill
        if n > len(order): order = order + [1, 5, 3][:n - len(order)]
        return [(self.root + t.get(f, 0)) % 12 for f in order[:n]]

    def template(self):
        """Colour tones for a light 3-voice upper structure over the bass (the root is left to the bass):
        guide tones (3rd + 7th, or 3rd + 6th) plus ONE colour tone, the way DS-era arrangements imply
        extended harmony without stacking every tone. Triads stay triads (+9 if written).
        maj7 -> 3 7 9, m7 -> b3 b7 9, dom -> 3 b7 (13 | alt 9 | 9), sus -> 4 b7 9, 6 -> 3 6 9."""
        t = self.tones
        has = lambda f: f in t
        if has(7) and t[7] == 11 and not self.minor:            # maj7 family
            f = [3, 7, 11] if has(11) and t[11] == 18 else [3, 7, 13] if has(13) else [3, 7, 9]
        elif self.minor and has(7) and t.get(5) == 6: f = [3, 5, 7]                                     # m7b5 / dim7
        elif self.minor and has(7): f = [3, 7, 11] if has(11) else [3, 7, 9] if has(9) or t[7] == 10 else [3, 7, 5]   # m7 / m9 / m11 / mM7
        elif has(7) and t[7] == 10 and has(3):                    # dominant family
            if has('x9'): f = [3, 7, 'x9']
            elif has(9) and t[9] == 13: f = [3, 7, 9]
            elif has(13): f = [3, 7, 13]
            elif has(9): f = [3, 7, 9]
            else: f = [3, 7, 5]
        elif has(4) and not has(3): f = [4, 7, 9] if has(7) else [1, 4, 9] if has(9) else [1, 4, 5]
        elif has(6): f = [3, 6, 9] if has(9) else [3, 5, 6]
        elif self.minor: f = [3, 5, 9] if has(9) else [1, 3, 5]
        elif has(3) and t.get(5) == 8: f = [1, 3, 5]
        else: f = [3, 5, 9] if has(9) else [1, 3, 5]
        out = []
        for k in f:
            v = t.get(k, {9: 14, 5: 7, 1: 0, 13: 21, 3: 4}.get(k, 0))
            pc = (self.root + v) % 12
            if pc not in out: out.append(pc)
        return out

    def guides(self):
        """The two tones that define the chord's quality (3rd/7th, or 3rd/6th, 4th/7th for sus)."""
        t = self.tones
        g = [f for f in (3, 7) if f in t]
        if len(g) < 2: g = [f for f in (3, 4, 6, 7, 2, 5, 1) if f in t][:2]
        return [(self.root + t[f]) % 12 for f in g]

    def scale(self):
        """A chord-scale (7 pcs) for walking lines / arps."""
        t = self.tones; r = self.root
        if 5 in t and t[5] == 6 and t.get(7) == 9: steps = [0, 2, 3, 5, 6, 8, 9, 11]
        elif 5 in t and t[5] == 6: steps = [0, 1, 3, 5, 6, 8, 10]
        elif self.minor: steps = [0, 2, 3, 5, 7, 9 if 6 in t else 8 if t.get(7) == 11 else 9, t.get(7, 10)]
        elif self.dom: steps = [0, 2 if t.get(9, 14) == 14 else 1, 4, 5 if 11 not in t else 6, 7, 9 if t.get(13, 21) == 21 else 8, 10]
        elif 4 in t: steps = [0, 2, 5, 7, 9, 10]
        else: steps = [0, 2, 4, 6 if 11 in t else 5, 7, 9, 11]
        return sorted(set((r + s) % 12 for s in steps))


# ------------------------------------------------------------------ notation
DUR = {'1': 4, '2': 2, '4': 1, '8': .5, '16': .25, '32': .125, '2t': 4 / 3, '4t': 2 / 3, '8t': 1 / 3, '16t': 1 / 6}
DYN = {'ppp': 30, 'pp': 42, 'p': 56, 'mp': 70, 'mf': 84, 'f': 98, 'ff': 112, 'fff': 124}


class Ev:
    __slots__ = ('t', 'd', 'p', 'v', 'art', 'tie')

    def __init__(self, t, d, p, v, art=''):
        self.t, self.d, self.p, self.v, self.art = t, d, p, v, art


def parse(src, bar=4, start=0.0, vel=84, transpose=0, strict=True, name=''):
    """Parse a melody string into events. Returns (events, length_in_beats).

    tokens:  c5 f#4 bb3  pitches (c4 = middle C);  r = rest;  - = extend previous note(s)
             c4+e4+g4    chord;   :8 :4. :8t :16 :b1.5   duration (sticky until changed)
             suffixes    ' staccato  _ legato/tenuto  > accent  ^ fall  / scoop  ~ extra vibrato  * soft ghost
             pp p mp mf f ff   dynamics (sticky);   | bar check;   [ ... ]x2  repeat
    """
    # expand repeats
    while True:
        m = re.search(r'\[([^\[\]]*)\]x(\d+)', src)
        if not m: break
        src = src[:m.start()] + ' '.join([m.group(1)] * int(m.group(2))) + src[m.end():]
    evs, t, dur, last = [], start, 1.0, []
    for tok in src.replace('|', ' | ').split():
        if tok == '|':
            if strict and abs(((t - start) / bar) - round((t - start) / bar)) > 1e-6:
                raise ValueError(f'{name}: bar check failed at beat {t - start:.3f} (bar {(t - start) / bar + 1:.2f})')
            continue
        if tok in DYN: vel = DYN[tok]; continue
        m = re.fullmatch(r"([^:]+?)([\'_>^/~*]*)(?::(b[\d.]+|\d+t?)(\.{0,2}))?", tok)
        if not m: raise ValueError(f'{name}: bad token {tok}')
        body, art, dtok, dots = m.group(1), m.group(2), m.group(3), m.group(4)
        if dtok:
            dur = float(dtok[1:]) if dtok.startswith('b') else DUR[dtok]
            if dots == '.': dur *= 1.5
            if dots == '..': dur *= 1.75
        if body == 'r':
            last = []
        elif body == '-':
            for e in last: e.d += dur
        else:
            last = []
            for p in body.split('+'):
                v = vel + (14 if '>' in art else 0) - (30 if '*' in art else 0)
                pn = DRUM[p] if p in DRUM else note(p) + transpose
                e = Ev(t, dur, pn, max(8, min(127, v)), art)
                evs.append(e); last.append(e)
        t += dur
    return evs, t - start


# ------------------------------------------------------------------ chord charts
def chart(src, bar=4):
    """'Cmaj9 | Am9 D7 | G . . E7 | %' -> list of (start_beat, dur, Chord).
    A bar's chords split it evenly; '.' extends the previous chord a slot; '%' repeats the previous bar;
    'Sym:3' gives an explicit beat length."""
    out, t, prevbar = [], 0.0, None
    for b in [x.strip() for x in src.strip().strip('|').split('|')]:
        toks = b.split()
        if toks == ['%']: toks = prevbar
        prevbar = toks
        explicit = [tk for tk in toks if ':' in tk]
        if explicit:
            for tk in toks:
                sym, d = tk.split(':') if ':' in tk else (tk, None)
                d = float(d) if d else (bar - sum(float(x.split(':')[1]) for x in explicit)) / max(1, len(toks) - len(explicit))
                if sym == '.': out[-1] = (out[-1][0], out[-1][1] + d, out[-1][2])
                else: out.append((t, d, Chord(sym)))
                t += d
        else:
            d = bar / len(toks)
            for sym in toks:
                if sym == '.': out[-1] = (out[-1][0], out[-1][1] + d, out[-1][2])
                else: out.append((t, d, Chord(sym)))
                t += d
    return out, t


def chord_at(ch, t):
    for s, d, c in ch:
        if s <= t + 1e-9 < s + d: return c
    return ch[-1][2]


# ------------------------------------------------------------------ voicings
def _placements(pcs, lo, hi):
    opts = [[p for p in range(lo, hi + 1) if p % 12 == pc] for pc in pcs]
    for combo in itertools.product(*opts):
        if len(set(combo)) == len(combo): yield sorted(combo)


def _rough(v):
    """penalty for muddy / clashing intervals"""
    pen = 0
    for a, b in zip(v, v[1:]):
        iv = b - a
        if iv == 1: pen += 6
        if iv <= 3 and a < 52: pen += 5
        if iv > 9: pen += (iv - 9) * .6
    if v[-1] - v[0] > 19: pen += (v[-1] - v[0] - 19)
    return pen


def voice(chord, prev=None, lo=52, hi=76, n=4, top=None, rootless=True, spread=False):
    """Pick a voicing for chord, voice-led from prev. top: force a melody note on top."""
    pcs = chord.color_set(n) if rootless else ([chord.root] + [p for p in chord.color_set(n) if p != chord.root])[:n]
    best, bs = None, 1e9
    rng = (lo, hi)
    for v in _placements(pcs, *rng):
        if spread and v[-1] - v[0] < 12: continue
        if top is not None and v[-1] >= top: continue
        s = _rough(v)
        if top is not None: s += (top - v[-1]) * .8
        if prev:
            pv = sorted(prev)
            s += sum(min(abs(x - y) for y in pv) for x in v) * 1.0
            s += abs(v[-1] - pv[-1]) * .5
        else:
            s += abs(sum(v) / len(v) - (lo + hi) / 2) * .3
        if s < bs: best, bs = v, s
    if best is None: best = sorted(_placements(pcs, lo - 6, hi + 6).__next__())
    if top is not None: best = best + [top]
    return best


def _melody_parts(song):
    return [p for n, p in song.parts.items() if not p.kit and (p.role in ('lead', 'solo') or n.startswith('lead'))]


def melody_at(song, t0, t1=None):
    """Melody pitches sounding at t0 (or starting before t1)."""
    out = []
    for p in _melody_parts(song):
        for (t, d, pp, v, a) in p.notes:
            if (t <= t0 + 1e-6 < t + d) or (t1 is not None and t0 <= t < t1): out.append(pp)
    return out


def _close(pcs, bottom):
    """Stack pcs upward from the first placement >= bottom (close position)."""
    v = []; cur = bottom - 1
    for pc in pcs:
        n = cur + 1
        while n % 12 != pc: n += 1
        v.append(n); cur = n
    return v


def master_voicing(song, sec, i):
    """One voicing per chord that every harmony part shares: the chord's colour tones in close position
    (3-7 based, tensions on top), voice-led from the previous chord, kept under the melody and free of
    semitone rubs against it. Cached on the song."""
    cache = song.__dict__.setdefault('_mv', {})
    key = (sec.name, i)
    if key in cache: return cache[key]
    t, d, c = sec.chords[i]
    T = sec.at + t
    mel = melody_at(song, T + .01) or melody_at(song, T, T + min(d, 2))
    ceiling = (min(mel) - 3) if mel else 79
    pcs = c.template()
    # never put the pc a semitone under the melody (or the melody's own pc) right below it
    if mel:
        bad = {(m - 1) % 12 for m in mel} | {m % 12 for m in mel}
        keep = [pc for pc in pcs if pc not in bad]
        if len(keep) >= 3 or (len(keep) >= 2 and len(pcs) <= 3): pcs = keep
        elif len(keep) < 3:
            fill = [pc for pc in (c.pc(5) if 5 in c.tones else None, c.root) if pc is not None and pc not in bad and pc not in keep]
            pcs = keep + fill[:3 - len(keep)] if keep else pcs
    prev = song.__dict__.get('_mv_prev')
    best, bs = None, 1e9
    n = len(pcs)
    for order in itertools.permutations(pcs):
        order = list(order)
        for bottom in range(50, 70):
            v = _close(order, bottom)
            if v[0] != bottom: continue
            if v[-1] > min(ceiling, 80) or v[0] < 50: continue
            sc = 0.0
            for a, b, c3 in zip(v, v[1:], v[2:]):
                if b - a in (5, 7) and c3 - b in (5, 7): sc += 12   # stacked 4ths/5ths: hollow, 'lounge' sound
            for a, b in zip(v, v[1:]):
                if b - a == 1: sc += 24         # semitone between adjacent voices
                if b - a == 2 and a < 55: sc += 2
                if b - a > 9: sc += (b - a - 9) * .8   # big gaps in the middle of the voicing
            for x in v:
                for y in v:
                    if y - x == 13: sc += 14   # minor 9th between any two voices
            if v[-1] - v[0] > 16: sc += (v[-1] - v[0] - 16) * .6
            if (c.root + 1) % 12 in [x % 12 for x in v] and not (c.dom and 9 in c.tones and c.tones[9] == 13): sc += 9
            if prev:
                sc += sum(min(abs(x - y) for y in prev) for x in v) * .9 + abs(v[-1] - prev[-1]) * .6
            sc += abs((v[0] + v[-1]) / 2 - 63) * .35
            if sc < bs: best, bs = v, sc
    if best is None:   # melody too low: fall back to a compact voicing well below it
        best = _close(pcs, max(40, ceiling - 14))
    cache[key] = best
    song._mv_prev = best
    return best


def fit(v, lo, hi, n=None, spread=False):
    """Move a master voicing into a part's range by whole octaves (keeping its shape); optionally thin
    it to the top n notes or open it into drop-2 spacing."""
    v = list(v)
    if n and n < len(v): v = v[-n:]
    if spread and len(v) >= 4: v = sorted(v[:-2] + [v[-2] - 12] + v[-1:])
    while v and max(v) > hi and min(v) - 12 >= lo - 5: v = [x - 12 for x in v]
    while v and min(v) < lo and max(v) + 12 <= hi + 5: v = [x + 12 for x in v]
    return sorted(v)


def drop2(chord, top, n=4):
    """Brass-section drop-2 voicing with a given top (melody) note."""
    pcs = [p for p in chord.color_set(5) if p != top % 12]
    close = [top]
    cur = top
    for _ in range(n - 1):
        cands = [p for p in pcs if p not in [c % 12 for c in close]] or pcs
        best = max((cur - ((cur - pc) % 12 or 12) for pc in cands))
        close.append(best); cur = best
    close = sorted(close)
    if len(close) >= 3: close[-2] -= 12
    return sorted(close)


# ------------------------------------------------------------------ parts & song
class Part:
    def __init__(self, song, name, prog, kit=False, vol=0.0, pan=0.0, rev=.18, hp=0, lp=0, width=1.0, delay=0.0, chorus=0.0,
                 octave=0, layer=None, human=1.0, lag=0.0, vel=1.0, legato=.94, bend=2, role=None):
        self.song, self.name, self.prog, self.kit = song, name, prog, kit
        self.role = role or _default_role(name, kit)
        self.vol, self.pan, self.rev, self.hp, self.lp, self.width, self.delay, self.chorus = vol, pan, rev, hp, lp, width, delay, chorus
        self.octave, self.layer, self.human, self.lag, self.velmul, self.legato, self.bendrange = octave, layer or [], human, lag, vel, legato, bend
        self.notes = []   # (t, d, pitch, vel, art)
        self.cc = []      # (t, cc, value)
        self.bends = []   # (t, value -1..1)

    # --- low level
    def add(self, t, d, p, v, art=''):
        self.notes.append((t, d, p + 12 * self.octave, int(max(1, min(127, v * self.velmul))), art)); return self

    def ctl(self, t, cc, val): self.cc.append((t, cc, int(max(0, min(127, val))))); return self

    def ramp(self, t0, t1, cc, v0, v1, steps=None):
        steps = steps or max(2, int((t1 - t0) * 8))
        for i in range(steps + 1): self.ctl(t0 + (t1 - t0) * i / steps, cc, v0 + (v1 - v0) * i / steps)
        return self

    def swell(self, sec, b0, b1, v0, v1):
        s = self.song.sec[sec]
        return self.ramp(s.at + b0, s.at + b1, 11, v0, v1)

    # --- writing
    def write(self, sec, src, transpose=0, vel=None, at=0.0, strict=True):
        s = self.song.sec[sec]
        evs, ln = parse(src, bar=self.song.bar, start=0, vel=vel or 84, transpose=transpose + s.transpose, strict=strict, name=f'{self.song.id}/{self.name}/{sec}')
        if strict and ln - at > s.len + 1e-6: raise ValueError(f'{self.song.id}/{self.name}/{sec}: {ln} beats > section {s.len}')
        for e in evs:
            if e.t + at < s.len - 1e-6: self.add(s.at + at + e.t, min(e.d, s.len - e.t - at), e.p, e.v, e.art)
        return self

    def events(self, sec, evs):
        s = self.song.sec[sec]
        for (t, d, p, v, *a) in evs: self.add(s.at + t, d, p + s.transpose, v, a[0] if a else '')
        return self

    def gen(self, secs, fn, **kw):
        for sname in (secs.split() if isinstance(secs, str) else secs):
            s = self.song.sec[sname]
            fn(self, s, **kw)
        return self

    def copy(self, src_sec, dst_sec, transpose=0):
        a, b = self.song.sec[src_sec], self.song.sec[dst_sec]
        for (t, d, p, v, art) in list(self.notes):
            if a.at <= t < a.at + a.len: self.notes.append((t - a.at + b.at, d, p + transpose, v, art))
        for (t, cc, val) in list(self.cc):
            if a.at <= t < a.at + a.len: self.cc.append((t - a.at + b.at, cc, val))
        return self


# auto-mix targets: loudness of each role relative to the lead (LU), measured on the part's active passages
ROLE_TARGET = {'lead': 0.0, 'counter': -4.0, 'brass': -3.0, 'bass': -6.0, 'drums': -4.5, 'perc': -12.0, 'pad': -9.5,
               'comp': -8.0, 'arp': -10.0, 'sparkle': -13.0, 'fx': -12.0, 'solo': 0.0}


def _default_role(name, kit):
    n = name.lower()
    if kit: return 'drums' if 'perc' not in n else 'perc'
    for key, role in (('lead', 'lead'), ('melody', 'lead'), ('horn', 'lead'), ('bass', 'bass'), ('string', 'pad'), ('pad', 'pad'), ('choir', 'pad'),
                      ('brass', 'brass'), ('stab', 'brass'), ('piano', 'comp'), ('keys', 'comp'), ('epiano', 'comp'), ('guitar', 'comp'), ('organ', 'comp'),
                      ('glock', 'sparkle'), ('bell', 'sparkle'), ('celesta', 'sparkle'), ('harp', 'arp'), ('arp', 'arp'), ('marimba', 'arp'),
                      ('vibes', 'counter'), ('counter', 'counter'), ('timp', 'perc'), ('hit', 'perc')):
        if key in n: return role
    return 'comp'


class Section:
    def __init__(self, name, at, bars, bar, chords, transpose):
        self.name, self.at, self.bars, self.len, self.chords, self.transpose = name, at, bars, bars * bar, chords, transpose

    def chord(self, t): return chord_at(self.chords, t)


class Song:
    def __init__(self, id, bpm, bar=4, swing=0.5, swing16=0.5, key='C', reverb=1.0, room=1.8, title='', seed=None, variant='day',
                 tail=4.5, loudness=-17.0):
        self.id, self.bpm, self.bar, self.swing, self.swing16, self.key = id, bpm, bar, swing, swing16, key
        self.reverb, self.room, self.title, self.variant, self.tail, self.loudness = reverb, room, title, variant, tail, loudness
        self.parts, self.sec, self.order = {}, {}, []
        self.intro_len = 0.0
        self.rng = random.Random(seed if seed is not None else hash(id) & 0xffff)
        self.loop = True
        self.tempo_map = None   # optional list of (beat, bpm) for ritardando endings (jingles)

    # sections are laid out in the order declared; `intro=True` sections precede the loop
    def section(self, name, bars, chords=None, intro=False, transpose=0):
        at = sum(s.len for s in self.sec.values())
        if intro and any(not self.sec[n].intro for n in self.order): raise ValueError('intro sections must come first')
        ch = []
        if chords:
            ch, ln = chart(chords, self.bar)
            if abs(ln - bars * self.bar) > 1e-6: raise ValueError(f'{self.id}/{name}: chart is {ln / self.bar} bars, expected {bars}')
            ch = [(t, d, c) for (t, d, c) in ch]
        s = Section(name, at, bars, self.bar, ch, transpose)
        s.intro = intro
        self.sec[name] = s; self.order.append(name)
        if intro: self.intro_len = at + s.len
        return s

    @property
    def total(self): return sum(s.len for s in self.sec.values())

    @property
    def loop_len(self): return self.total - self.intro_len

    def part(self, name, prog, **kw):
        p = Part(self, name, prog, **kw); self.parts[name] = p; return p

    def drums(self, name='drums', kit=KIT_STD, **kw):
        kw.setdefault('rev', .14)
        p = Part(self, name, kit, kit=True, **kw); self.parts[name] = p; return p

    # swing: remap beat-fraction positions
    def swung(self, t):
        b = math.floor(t + 1e-9); f = t - b
        if self.swing != .5:
            s = self.swing
            f = f / .5 * s if f <= .5 else s + (f - .5) / .5 * (1 - s)
        elif self.swing16 != .5:
            h = math.floor(f / .5 + 1e-9) * .5; g = (f - h) / .5; s = self.swing16
            g = g / .5 * s if g <= .5 else s + (g - .5) / .5 * (1 - s)
            f = h + g * .5
        return b + f

    def sec_of(self, beat):
        for s in self.sec.values():
            if s.at <= beat < s.at + s.len: return s
        return list(self.sec.values())[-1]


# ------------------------------------------------------------------ generators
def _rng(part, sec, salt=''):
    # seed_id lets a retake regenerate a kept passage note for note (it seeds as the song it came from)
    sid = getattr(part.song, 'seed_id', part.song.id)
    return random.Random(f'{sid}|{part.name}|{sec.name}|{salt}|{part.song.variant}')


def bass_line(part, sec, style='walk', lo=31, hi=55, vel=92, octave_pop=True, approach=True, pattern=None, stacc=False):
    """Bass generator following the section's chords."""
    r = _rng(part, sec, style)
    prev = None
    ch = sec.chords
    for i, (t, d, c) in enumerate(ch):
        nxt = ch[i + 1][2] if i + 1 < len(ch) else ch[0][2]
        root = _near(c.bass, prev if prev else (lo + hi) // 2 - 4, lo, hi)
        tgt = _near(nxt.bass, root, lo, hi)
        T = sec.at + t
        if style == 'walk':
            n = int(round(d))
            line = _walk(c, root, tgt, n, r, lo, hi) if n > 0 else [root]
            for k, p in enumerate(line):
                part.add(T + k, .9, p, vel + (6 if k == 0 else 0) - r.randint(0, 8), '')
            prev = line[-1]
        elif style == 'two':
            part.add(T, min(d, 2) * .95, root, vel + 4)
            if d >= 4:
                fifth = _near((c.pc(5) if c.pc(5) is not None else c.root), root + 5, lo, hi)
                if approach and r.random() < .5:
                    part.add(T + 2, 1.4, fifth, vel - 4); part.add(T + 3.5, .45, tgt + r.choice([-1, 1]), vel - 10, "'")
                else: part.add(T + 2, 1.9, fifth, vel - 4)
            prev = root
        elif style == 'bossa':
            fifth = _near(c.pc(5) if c.pc(5) is not None else c.root, root + 7, lo, hi)
            for b0 in range(0, int(d), 2):
                part.add(T + b0, 1.45, root, vel); part.add(T + b0 + 1.5, .45, fifth, vel - 10)
            prev = root
        elif style == 'pop8':
            steps = int(d * 2)
            for k in range(steps):
                p = root
                if octave_pop and k % 4 == 3: p = root + 12 if root + 12 <= hi + 7 else root
                if approach and k == steps - 1 and steps >= 4: p = _near((tgt + r.choice([-1, 2, -2])) % 12, root, lo, hi)
                if approach and k == steps - 2 and steps >= 8 and r.random() < .5: p = _near(c.pc(5) if c.pc(5) is not None else c.root, root, lo, hi)
                part.add(T + k * .5, .42 if stacc else .47, p, vel - (0 if k % 2 == 0 else 12) + r.randint(-3, 3), "'" if stacc else '')
            prev = root
        elif style == 'drive':   # battle: 8ths with octave jumps on offbeats
            steps = int(d * 2)
            for k in range(steps):
                p = root + (12 if k % 2 == 1 and octave_pop else 0)
                if approach and k == steps - 1 and steps >= 4: p = _near((tgt - 1) % 12 if r.random() < .5 else c.pc(5) or c.root, root, lo, hi + 12)
                part.add(T + k * .5, .4, p, vel - (4 if k % 2 else 0) + r.randint(-3, 3), "'")
            prev = root
        elif style == 'gallop':  # 8th + two 16ths
            for b0 in range(int(d)):
                part.add(T + b0, .45, root, vel); part.add(T + b0 + .5, .22, root, vel - 12); part.add(T + b0 + .75, .22, root + (12 if b0 % 2 else 0), vel - 8)
            prev = root
        elif style == 'funk':
            pat = pattern or 'x..x..x.x.x..x.x'
            for k, chx in enumerate(pat[:int(d * 4)]):
                if chx == '.': continue
                p = root + (12 if chx == 'o' else 7 if chx == '5' else 10 if chx == '7' else 0)
                part.add(T + k * .25, .22, p, vel - (0 if chx in 'xX' else 10) + (10 if chx == 'X' else 0), "'")
            prev = root
        elif style == 'pedal':
            part.add(T, d * .98, root, vel - 6); prev = root
        elif style == 'waltz':  # 3/4: root on 1, fifth on 1 of alternate bars handled by d
            fifth = _near(c.pc(5) if c.pc(5) is not None else c.root, root + 7, lo, hi)
            for b0 in range(0, int(d), part.song.bar):
                part.add(T + b0, part.song.bar * .6, root if (b0 // part.song.bar) % 2 == 0 else fifth, vel)
            prev = root
        elif style == 'calypso':
            fifth = _near(c.pc(5) if c.pc(5) is not None else c.root, root + 7, lo, hi)
            third = _near(c.pc(3) if c.pc(3) is not None else c.root, root + 4, lo, hi)
            for b0 in range(0, int(d), 4):
                for (o, p, dd) in [(0, root, 1.4), (1.5, root, .45), (2, fifth, .9), (3, third, .45), (3.5, fifth if b0 + 4 < d else tgt + r.choice([-1, 1]), .45)]:
                    if b0 + o < d: part.add(T + b0 + o, dd, p, vel - (8 if o % 1 else 0))
            prev = root
        elif style == 'custom':
            # pattern: list of (offset, dur, degree) where degree in '1','5','8','3','7','a' (approach)
            for (o, dd, deg) in pattern:
                if o >= d: continue
                p = {'1': root, '8': root + 12, '5': _near(c.pc(5) if c.pc(5) is not None else c.root, root + 7, lo, hi + 7),
                     '3': _near(c.pc(3) if c.pc(3) is not None else c.root, root + 4, lo, hi + 7), '7': _near(c.pc(7) if c.pc(7) is not None else c.root, root + 10, lo, hi + 7),
                     'a': tgt + (-1 if r.random() < .5 else 1), 'l': root - 12 if root - 12 >= 24 else root}[deg]
                part.add(T + o, dd, p, vel - (6 if o % 1 else 0) + r.randint(-3, 3))
            prev = root


def _near(pc, ref, lo, hi):
    cands = [p for p in range(lo, hi + 1) if p % 12 == pc % 12]
    return min(cands, key=lambda p: abs(p - ref)) if cands else ref


def _walk(c, root, tgt, n, r, lo, hi):
    """Jazz walking line: n quarter notes starting on root, leading into tgt."""
    line = [root]
    if n == 1: return line
    scale = c.scale(); tones = c.pcs([1, 3, 5, 7])
    cur = root
    for k in range(1, n):
        remaining = n - k
        if remaining == 1:  # approach note into target
            opts = [tgt - 1, tgt + 1, tgt + 7 - 12 if tgt + 7 - 12 >= lo else tgt + 7, tgt + 2, tgt - 2]
            w = [4, 3, 2, 1.5, 1.5]
            p = r.choices(opts, w)[0]
            if p == cur: p = tgt - 1 if cur != tgt - 1 else tgt + 1
        else:
            direction = 1 if tgt > cur else -1
            if abs(tgt - cur) < 3: direction = r.choice([-1, 1])
            pool = [p for p in range(cur - 5, cur + 6) if lo <= p <= hi and p != cur and (p % 12 in scale)]
            pool.sort(key=lambda p: (0 if (p - cur) * direction > 0 else 1, 0 if p % 12 in tones else 1, abs(p - cur)))
            p = pool[0] if r.random() < .6 else r.choice(pool[:4]) if pool else cur + direction * 2
        p = max(lo, min(hi, p)); line.append(p); cur = p
    return line


def comp(part, sec, style='block', lo=52, hi=74, n=4, vel=66, pattern=None, rootless=True, dur=None, arp=None, strum=0.0, top_follow=None, spread=False):
    """Harmonic comping from the chord chart.
    styles: block (one voicing per chord), charleston, swingcomp, offbeat, waltz, bossa, stabs(pattern), arp, pulse8, pulse4"""
    r = _rng(part, sec, style)
    prev = getattr(part, '_prevv', None)
    bar = part.song.bar
    for i, (t, d, c) in enumerate(sec.chords):
        v = fit(master_voicing(part.song, sec, i), lo, hi, n, spread); prev = v
        T = sec.at + t
        hits = []  # (offset, dur, velocity-offset)
        if style == 'block': hits = [(0, (dur or d) * .98, 0)]
        elif style == 'pulse4': hits = [(k, .8, -4 if k % 2 else 0) for k in range(int(d))]
        elif style == 'pulse8': hits = [(k * .5, .42, -10 if k % 2 else 0) for k in range(int(d * 2))]
        elif style == 'offbeat': hits = [(k + .5, .4, 0) for k in range(int(d))]
        elif style == 'charleston': hits = [(o, dd, dv) for (o, dd, dv) in [(0, .9, 0), (1.5, .45, -6), (2, .9, -2), (3.5, .4, -8)] if o < d]
        elif style == 'swingcomp':
            # randomized jazz comping: anticipations and short stabs
            opts = [[(0, .7, 0), (1.5, .4, -8)], [(.5 if False else 0, 1.8, 0)], [(1, .5, -4), (2.5, .5, -6)], [(0, .45, 0), (2.5, .45, -4)], [(1.5, .5, -2), (3, .8, -6)], [(-.5, .9, 2)]]
            k = 0.0; hits = []
            while k < d - .01:
                pat = r.choice(opts)
                for (o, dd, dv) in pat:
                    if 0 <= k + o < d or (o < 0 and k == 0 and i > 0): hits.append((k + o, dd, dv))
                k += 4 if d >= 4 else d
        elif style == 'waltz': hits = [(o, .8, -6) for o in range(1, int(d)) if o % bar != 0]
        elif style == 'bossa':
            pat = [(0, .4), (1.5, .4), (3, .4), (4.5 if d > 4 else 99, .4), (5.5, .4), (7, .4)]
            hits = [(o, dd, -4) for (o, dd) in pat if o < d]
        elif style == 'stabs':
            pat = pattern or 'x.....x.....x...'
            steps = int(round(d * 4))
            per = len(pat) / (bar * 4)
            for k in range(steps):
                gk = int(((t + k * .25) % bar) * 4 * per) if per != 1 else int(((t + k * .25) * 4) % len(pat))
                ch = pat[gk % len(pat)]
                if ch in 'xX>': hits.append((k * .25, .22 if ch != '>' else .7, 10 if ch in 'X>' else 0))
                elif ch == '-': hits.append((k * .25, .9, 0))
                elif ch == '=': hits.append((k * .25, 1.9, 0))
        elif style == 'arp':
            seq = arp or 'up'
            vv = v if len(v) >= 2 else (v + [v[0] + 7] if v else [60, 64])
            notes = sorted(set(vv + [vv[0] + 12, vv[1] + 12]))
            clean = []
            for q in notes:
                if all(abs(q - x) not in (1, 2, 13) for x in clean): clean.append(q)
            notes = clean if len(clean) >= 3 else notes
            rate = .5 if isinstance(seq, str) and seq.endswith('8') else .25
            order = {'up': notes, 'down': notes[::-1], 'updown': notes + notes[-2:0:-1], 'up8': notes, 'updown8': notes + notes[-2:0:-1],
                     'alberti': [notes[0], notes[2], notes[1], notes[2]]}.get(seq.replace('8', '') if isinstance(seq, str) and seq not in ('up8', 'updown8') else seq, notes)
            if isinstance(seq, str) and seq in ('up8', 'updown8'): order = {'up8': notes, 'updown8': notes + notes[-2:0:-1]}[seq]
            steps = int(round(d / rate))
            for k in range(steps):
                part.add(T + k * rate, rate * (1.6 if part.song.bar else 1), order[k % len(order)], vel - (0 if k % 4 == 0 else 8) + r.randint(-4, 4))
            continue
        for (o, dd, dv) in hits:
            for j, p in enumerate(v):
                part.add(T + o + j * strum, max(.1, min(dd, d - o) if o >= 0 else dd), p, vel + dv + r.randint(-4, 4) + (3 if j == len(v) - 1 else 0), "'" if dd < .5 else '')
    part._prevv = prev


def pads(part, sec, lo=55, hi=79, n=4, vel=62, swell=False, rootless=False, hold=True, top_line=None, spread=True, guides=True):
    """Sustained voice-led string/pad chords. By default only the guide tones of the shared voicing are
    held (the comping part carries the colour tone), which keeps the texture light."""
    prev = getattr(part, '_prevp', None)
    for i, (t, d, c) in enumerate(sec.chords):
        v = fit(master_voicing(part.song, sec, i), lo, hi, n, spread)
        if guides:
            g = set(c.guides()); gv = [p for p in v if p % 12 in g]
            if len(gv) >= 2: v = gv
        prev = v
        T = sec.at + t
        for p in v: part.add(T, d * (1.0 if hold else .9), p, vel + (4 if p == v[-1] else 0), '_')
        if swell:
            part.ramp(T, T + d * .5, 11, 70, 110, 6); part.ramp(T + d * .5, T + d, 11, 110, 80, 6)
    part._prevp = prev


def guide_line(part, sec, lo=58, hi=74, vel=64, rhythm=None):
    """A counter-line on guide tones (3rds/7ths), voice-led: a classic horn/string background."""
    prev = (lo + hi) // 2
    for (t, d, c) in sec.chords:
        cands = [p for p in range(lo, hi + 1) if p % 12 in c.pcs([3, 7]) or (3 not in c.tones and p % 12 in c.pcs([4, 9]))]
        p = min(cands, key=lambda x: abs(x - prev)) if cands else prev
        part.add(sec.at + t, d * .98, p, vel, '_'); prev = p


def ostinato(part, sec, pattern, lo=None, vel=80, rate=.25, degrees=None):
    """Chord-following figure: pattern of chord-tone indices, e.g. '0 1 2 1 3 2 1 2' over a voicing."""
    prev = None
    idx = [int(x) if x not in '.-' else x for x in pattern.split()]
    for i, (t, d, c) in enumerate(sec.chords):
        v = fit(master_voicing(part.song, sec, i), lo or 60, (lo or 60) + 16); prev = v
        tones = sorted(set(v + [x + 12 for x in v]))
        steps = int(round(d / rate))
        for k in range(steps):
            ix = idx[k % len(idx)]
            if ix == '.': continue
            if ix == '-': continue
            part.add(sec.at + t + k * rate, rate * .9, tones[ix % len(tones)], vel - (0 if k % 4 == 0 else 10), "'")


# ------------------------------------------------------------------ drums
GROOVES = {
    # 16 steps per 4/4 bar.  x hit  X accent  o ghost  - rest
    'pop': dict(K='x-------x-x-----', S='----x-------x---', H='x-x-x-x-x-x-x-x-'),
    'pop2': dict(K='x-----x-x-------', S='----x--o----x---', H='x-xxx-x-x-xxx-x-'),
    'city': dict(K='x------x--x-----', S='----x-------x--o', H='x-x-x-x-x-x-x-x-', O='-------------x--'),
    'shuffle': dict(K='x-----x-x-------', S='----x-------x---', H='x--xx--xx--xx--x'),
    'disco': dict(K='x---x---x---x---', S='----x-------x---', H='x-x-x-x-x-x-x-x-', O='--x---x---x---x-'),
    'march': dict(K='x-------x-------', S='--o-x-o---o-x-oo', H='x---x---x---x---'),
    'battle': dict(K='x--x--x-x-x--x--', S='----x-------x---', H='x-x-x-x-x-x-x-x-'),
    'battle2': dict(K='x-x---x-x-x---x-', S='----x--o----x-o-', H='xxxxxxxxxxxxxxxx'),
    'halftime': dict(K='x-----x---x-----', S='--------x-------', H='x-x-x-x-x-x-x-x-'),
    'drive': dict(K='x---x---x---x---', S='----x-------x---', H='x-xxx-xxx-xxx-xx'),
    'bossa': dict(K='x--x x--x x--x x--x'.replace(' ', '')[:16], rim='x--x--x---x--x--', H='xxxxxxxxxxxxxxxx'),
    'soft': dict(K='x-------x-------', rim='----x-------x---', H='--x---x---x---x-'),
    'ballad': dict(K='x-------x-x-----', rim='----x-------x---', H='x-x-x-x-x-x-x-x-'),
    'tom': dict(T5='x--x--x-x--x--x-', K='x-------x-------'),
    'none': dict(),
}
SWING = {  # written on straight 8ths; the song's `swing` setting supplies the lilt
    'ride': dict(R='x---x-x-x---x-x-', P='----x-------x---', K='o-------o-------'),
    'brush': dict(S2='x-------x-------', S='o-o-x-o-o-o-x-o-', K='o-------o-------', P='----x-------x---'),
    'shuffle': dict(K='x-----x-x-------', S='----x-------x---', H='x-x-x-x-x-x-x-x-'),
}
WALTZ = dict(K='x-----------', S='----o---o---', H='x-x-x-x-x-x-')   # 12 steps per 3/4 bar (16ths)


def groove(part, sec, name='pop', vel=92, fills=8, fill='snare', crash=True, crash_every=0, var=True, ride=False, bars=None,
           ghost=.35, open_every=0, tamb=None, extra=None, start=0, end=None, hat_vel=.75, kick_vel=1.0):
    """Drum groove over a section with fills every `fills` bars and a crash on the section downbeat."""
    r = _rng(part, sec, name)
    song = part.song; bar = song.bar
    if name in SWING: pat, steps = SWING[name], 16
    elif bar == 3: pat, steps = (GROOVES[name] if name in GROOVES and len(next(iter(GROOVES[name].values()), '-' * 12)) == 12 else WALTZ), 12
    else: pat, steps = GROOVES[name], 16
    if extra: pat = {**pat, **extra}
    if ride and 'H' in pat: pat = {**pat, 'R': pat['H']}; pat.pop('H')
    step = bar / steps
    nb = sec.bars if end is None else end
    for b in range(start, nb):
        T = sec.at + b * bar
        is_fill = fills and (b + 1) % fills == 0 and b != 0 or (fills and b == nb - 1 and nb >= 2 and fills <= nb)
        for inst, s in pat.items():
            if is_fill and inst in ('S', 'K', 'rim', 'S2') and fill: s = s[:steps // 2] + '-' * (steps - steps // 2)
            for k, chx in enumerate(s[:steps]):
                if chx in '- ': continue
                v = vel * (1.0 if chx == 'x' else 1.15 if chx == 'X' else .45)
                if inst in ('H', 'R', 'P', 'sh', 'tam'): v *= hat_vel
                if inst in ('K', 'K2'): v *= kick_vel
                if var and inst in ('H', 'R') and k % 2 == 1: v *= .82
                part.add(T + k * step, step * .9, DRUM[inst], v + r.randint(-5, 5))
        if var and 'S' in pat and not is_fill and ghost:
            for k in range(steps):
                if r.random() < ghost * .25 and pat['S'][k % len(pat['S'])] == '-': part.add(T + k * step, step * .5, DRUM['S'], vel * .3 + r.randint(-3, 3))
        if open_every and (b + 1) % open_every == 0: part.add(T + bar - .5, .4, DRUM['O'], vel * .7)
        if tamb:
            for k, chx in enumerate(tamb):
                if chx != '-': part.add(T + k * (bar / len(tamb)), .1, DRUM['tam'], vel * (.6 if chx == 'x' else .8))
        if is_fill and fill: drum_fill(part, T + bar / 2, bar / 2, fill, vel, r)
        if (b == 0 and crash) or (crash_every and b % crash_every == 0 and b):
            part.add(T, 2, DRUM['C'], vel * 1.0)


def drum_fill(part, T, length, kind, vel, r):
    if kind == 'snare':
        n = int(length * 4)
        for k in range(n): part.add(T + k * .25, .2, DRUM['S'], vel * (.55 + .5 * k / n) + r.randint(-4, 4))
    elif kind == 'tom':
        seq = ['T1', 'T1', 'T2', 'T2', 'T3', 'T3', 'T5', 'T5']
        n = int(length * 4)
        for k in range(n): part.add(T + k * .25, .2, DRUM[seq[int(k / n * len(seq))]], vel * (.8 + .3 * k / n) + r.randint(-4, 4))
    elif kind == 'mix':
        pat = [('S', 0), ('S', .25), ('T1', .5), ('T2', .75), ('S', 1), ('T3', 1.25), ('T5', 1.5), ('K', 1.5), ('T5', 1.75)]
        for inst, o in pat:
            if o < length: part.add(T + o, .2, DRUM[inst], vel * .95 + r.randint(-4, 4))
    elif kind == 'triplet':
        n = int(length * 3)
        seq = ['S', 'T1', 'T2', 'S', 'T3', 'T5']
        for k in range(n): part.add(T + k / 3, .2, DRUM[seq[k % len(seq)]], vel * (.7 + .3 * k / n))
    elif kind == 'brush':
        for k in range(int(length * 3)): part.add(T + k / 3, .2, 38, vel * (.5 + .3 * k / (length * 3)))
    elif kind == 'roll':
        n = int(length * 8)
        for k in range(n): part.add(T + k * .125, .1, DRUM['S'], vel * (.3 + .7 * k / n))


def hits(part, sec, beats, notes, vel=110, dur=.5):
    """Explicit hits at beat offsets within a section (e.g. orchestra hits, timpani)."""
    for b in beats:
        for n in (notes if isinstance(notes, (list, tuple)) else [notes]):
            part.add(sec.at + b, dur, n if isinstance(n, int) else note(n), vel)


# ------------------------------------------------------------------ section helpers
def harm(part, sec, src, n=4, vel=None, transpose=0, below=True, strict=True):
    """Write a top line and harmonize every note as a brass/string section voicing (close for 3, drop-2 for 4+)."""
    evs, ln = parse(src, bar=part.song.bar, start=0, vel=vel or 90, transpose=transpose + sec.transpose, strict=strict, name=f'{part.song.id}/{part.name}/{sec.name}')
    for e in evs:
        c = sec.chord(e.t)
        if n <= 1: vs = [e.p]
        else:
            pcs = [p for p in c.template() + [(c.root + 7) % 12] if p != e.p % 12 and (e.p - p) % 12 != 1]
            pcs = list(dict.fromkeys(pcs)) or [c.root]
            vs = [e.p]; cur = e.p
            for _ in range(n - 1):
                cands = [p for p in pcs if p not in [x % 12 for x in vs]] or pcs
                cur = max(cur - ((cur - pc) % 12 or 12) for pc in cands); vs.append(cur)
            vs = sorted(vs)
            if n >= 4: vs[-2] -= 12; vs = sorted(vs)
        for j, p in enumerate(vs): part.add(sec.at + e.t, e.d, p, e.v - (0 if p == e.p else 8), e.art)
    return part


# ------------------------------------------------------------------ registry
SONGS = {}


def song(id, variants=('day',)):
    def deco(fn):
        SONGS[id] = {'fn': fn, 'variants': list(variants)}
        return fn
    return deco


def make(id, variant='day'):
    s = SONGS[id]['fn'](variant)
    s.variant = variant
    finalize(s)
    return s


ACC_ROLES = ('comp', 'pad', 'arp')


def chord_at_beat(song, T):
    for sec in song.sec.values():
        if sec.at <= T < sec.at + sec.len and sec.chords: return sec.chord(T - sec.at), sec
    return None, None


def finalize(song):
    """Clean-up and expression pass run on every song:
    1. accompaniment notes that ring into a chord they do not belong to are cut at the change;
    2. accompaniment notes a semitone from a sounding melody note are dropped, unless the melody resolves
       onto that very note next (an appoggiatura or suspension: the rub is kept, it is the expression);
    3. phrase dynamics: melodies shaped by contour and metre, 4-bar swells on sustained parts,
       and a lift into each new section."""
    anticipate(song)
    mel = []
    for p in _melody_parts(song): mel += [(t, t + d, pp) for (t, d, pp, v, a) in p.notes]
    mel.sort()
    # the comping also keeps clear of the countermelodies (harmony voices, ostinatos, answers)
    lines = list(mel)
    for n_, p in song.parts.items():
        if not p.kit and p.role == 'counter': lines += [(t, t + d, pp) for (t, d, pp, v, a) in p.notes]
    lines.sort()
    changes = sorted({sec.at + t for sec in song.sec.values() for (t, d, c) in sec.chords})
    def allowed(T):
        c, _ = chord_at_beat(song, T)
        if c is None: return None
        return set(c.template()) | {c.root, (c.root + 7) % 12, c.bass} | set(c.pcs())
    import bisect
    for part in song.parts.values():
        if part.kit or part.role not in ACC_ROLES: continue
        out = []
        for (t, d, p, v, a) in part.notes:
            # 1. cut at the first chord change where this pitch no longer fits
            i = bisect.bisect_right(changes, t + 1e-6)
            while i < len(changes) and changes[i] < t + d - 1e-6:
                al = allowed(changes[i] + 1e-4)
                if al is not None and p % 12 not in al:
                    d = changes[i] - t; break
                i += 1
            if d < .06: continue
            # 2. minor 2nd / minor 9th against any melody note that sounds while this note rings:
            #    drop it if the rub is there at the onset, otherwise cut it where the melody arrives
            j = bisect.bisect_right(lines, (t + d, 1e9, 1e9))
            rub = False; cut = None
            for (m0, m1, mp) in lines[max(0, j - 60):j]:
                if m1 <= t + 1e-6 or m0 >= t + d - 1e-6: continue
                if abs(mp - p) not in (1, 13, 25): continue
                # an appoggiatura or suspension: a melody note outside the chord leans a semitone off this
                # very chord tone and resolves onto it next; the rub is the point, keep the chord tone
                al = allowed(m0 + 1e-4)
                if al is not None and mp % 12 not in al:
                    k = bisect.bisect_left(mel, (m1 - 1e-6, -1, -1))
                    if k < len(mel) and mel[k][0] <= m1 + .6 and mel[k][2] % 12 == p % 12: continue
                if m0 <= t + 1e-6: rub = True; break
                cut = m0 if cut is None else min(cut, m0)
            if rub: continue
            if cut is not None:
                d = cut - t
                if d < .2: continue
            out.append((t, d, p, v, a))
        part.notes = out
    # 2b. the bass: a passing or approach note (not in the chord) a semitone under a melody note that
    #     sounds with it moves to the nearest chord tone; a tension the chord spells (the b9 of a 7b9)
    #     is left alone, that rub is the chord
    bp = song.parts.get('bass')
    if bp is not None and not bp.kit and mel:
        mstarts = [m[0] for m in mel]
        out = []
        for (t, d, p, v, a) in bp.notes:
            c, _ = chord_at_beat(song, t + 1e-4)
            if c is not None and p % 12 not in set(c.pcs()) | {c.bass}:
                j = bisect.bisect_right(mstarts, t + d * .6)
                hit = [mp for (m0, m1, mp) in mel[max(0, j - 40):j] if m1 > t + 1e-6 and (mp - p) % 12 == 1 and mp > p]
                if hit:
                    cands = [q for q in range(p - 4, p + 5) if q % 12 in {c.bass, c.root, c.pc(5) if c.pc(5) is not None else c.root, c.pc(3) if c.pc(3) is not None else c.root}
                             and all((mp - q) % 12 != 1 for mp in hit)]
                    if cands: p = min(cands, key=lambda q: (abs(q - p), q % 12 != c.bass))
            out.append((t, d, p, v, a))
        bp.notes = out
    rank = {'pad': 0, 'comp': 1, 'arp': 2}
    acc = sorted([p for p in song.parts.values() if not p.kit and p.role in ACC_ROLES], key=lambda p: rank[p.role])
    for k, part in enumerate(acc):
        higher = [(t, t + d, pp) for q in acc[:k] for (t, d, pp, v, a) in q.notes]
        if not higher: continue
        higher.sort()
        starts = [h[0] for h in higher]
        out = []
        for (t, d, p, v, a) in part.notes:
            j = bisect.bisect_right(starts, t + 1e-6)
            clash = False
            for (h0, h1, hp) in higher[max(0, j - 40):j]:
                if h0 <= t + 1e-6 < h1 and abs(hp - p) in (1, 13): clash = True; break
            if not clash: out.append((t, d, p, v, a))
        part.notes = out
    dynamics(song)


def anticipate(song):
    """Phrasing pass: push some strong-beat melody notes an eighth early (tied anticipation), the
    syncopation that makes DS-era and jazz-pop melodies lilt instead of sitting squarely on the beat.
    Only when the note before is held for at least a beat (so the push steals from a sustain, never
    from a run). Deterministic per song; fast battle themes and jingles keep their written rhythm."""
    if song.bar != 4 or song.id.startswith('j_') or song.bpm >= 150 or getattr(song, 'no_push', False): return
    rate = getattr(song, 'push', .22)
    for part in _melody_parts(song):
        ns = sorted(part.notes)
        r = random.Random(f'push|{song.id}|{part.name}')
        for i in range(1, len(ns)):
            t, d, p, v, a = ns[i]; pt, pd, pp, pv, pa = ns[i - 1]
            if abs(pt + pd - t) > 1e-3 or pd < 1.0 - 1e-6 or p == pp: continue
            beat = (t - song.sec_of(t).at) % song.bar
            if beat not in (0, 2) or r.random() > rate: continue
            ns[i - 1] = (pt, pd - .5, pp, pv, pa)
            ns[i] = (t - .5, d + .5, p, v + 4, a)
        part.notes = ns


SECTION_SHAPE = (-10, 0, 5, -5, 6, 0, 7, -3)


def section_offsets(song):
    """Velocity offset per section: the loop opens lighter and each later section lifts or breathes,
    so a track has an arc instead of one level. Songs can override with song.shape = {name: offset}."""
    secs = [sc for sc in song.sec.values()]
    loop = [sc for sc in secs if not getattr(sc, 'intro', False) and sc.at >= song.intro_len - 1e-6]
    off = {}
    for k, sc in enumerate(loop): off[sc.name] = SECTION_SHAPE[k % len(SECTION_SHAPE)] if len(loop) > 1 else 0
    for sc in secs:
        if sc.name not in off: off[sc.name] = -4
    off.update(getattr(song, 'shape', {}) or {})
    return off


def dynamics(song):
    bar = song.bar
    soff = section_offsets(song)
    loop_secs = [sc for sc in song.sec.values() if sc.at >= song.intro_len - 1e-6]
    last = max(loop_secs, key=lambda sc: sc.at) if loop_secs else None
    for part in song.parts.values():
        if not part.notes: continue
        role = part.role
        notes = []
        pitches = [p for (t, d, p, v, a) in part.notes]
        mean = sum(pitches) / len(pitches)
        for (t, d, p, v, a) in part.notes:
            sec = song.sec_of(t)
            rel = t - sec.at
            ph = (rel % (4 * bar)) / (4 * bar)                     # position in a 4-bar phrase
            arc = math.sin(ph * math.pi) * 7 - 2                     # swell toward mid-phrase
            beat = rel % bar
            metre = 4 if abs(beat) < 1e-6 else 1 if abs(beat - bar / 2) < 1e-6 and bar == 4 else -2 if (beat % 1) > 1e-6 else 0
            if part.kit:
                nv = v + arc * .5
            elif role in ('lead', 'solo', 'counter'):
                nv = v + arc + metre + (p - mean) * .5 + (3 if d >= 1.5 else 0)
            elif role in ('pad', 'comp', 'arp', 'brass'):
                nv = v + arc * .8 + metre * .5
            else:
                nv = v + arc * .6 + metre * .5
            # lift: the last bar of a section leans into the next one
            if sec.len - rel <= bar and not part.kit: nv += 3 * (1 - (sec.len - rel) / bar)
            # section arc (drums follow at half strength); the loop's last two bars build back up
            so = soff.get(sec.name, 0)
            if sec is last and sec.len - rel <= 2 * bar and len(loop_secs) > 1: so += 6 * (1 - (sec.len - rel) / (2 * bar))
            nv += so * (.5 if part.kit else 1.0)
            notes.append((t, d, p, int(max(8, min(124, nv))), a))
        part.notes = notes
        # sustained parts breathe with CC11 over each 4-bar phrase (skipped if the part already rides CC11)
        if role in ('pad',) and not any(c == 11 for (_, c, _) in part.cc):
            for sec in song.sec.values():
                for k in range(int(sec.len // (4 * bar))):
                    t0 = sec.at + k * 4 * bar
                    part.ramp(t0, t0 + 2 * bar, 11, 92, 116, 8); part.ramp(t0 + 2 * bar, t0 + 4 * bar - .05, 11, 116, 96, 8)


def roll(part, sec, beat, length, pitch, v0=50, v1=120, rate=.125):
    """Timpani / snare roll with a crescendo (pitch: note name, int, or drum key)."""
    pn = DRUM[pitch] if isinstance(pitch, str) and pitch in DRUM else note(pitch) if isinstance(pitch, str) else pitch
    n = int(length / rate)
    for k in range(n): part.add(sec.at + beat + k * rate, rate * 1.2, pn, v0 + (v1 - v0) * k / max(1, n - 1))
    return part


# ------------------------------------------------------------------ arrangement helper
def band(s, secs, night=False, bass='pop8', bass_prog=FINGERBASS, nbass='two', nbass_prog=FRETLESS,
         keys=(BRIGHT, 'offbeat'), nkeys=(EPIANO, 'swingcomp'), pad=STRINGS, npad=SLOWSTR,
         kit=(KIT_STD, 'pop2'), nkit=(KIT_JAZZ, 'ballad'), fills=4, fill='snare', nfill='brush',
         guitar=None, nguitar=None, arp=None, narp=None, drum_vel=90, keys_vel=62, tamb=None, hat_vel=.75, keys_range=(55, 74), stagger=True):
    """Rhythm section for field/town themes; day and night swap instruments but keep the same parts,
    so both renders line up bar for bar (the game crossfades between them in sync)."""
    bp, bs_ = (nbass_prog, nbass) if night else (bass_prog, bass)
    b = s.parts.get('bass') or s.part('bass', bp, rev=.05)
    b.gen(secs, bass_line, style=bs_, vel=94)
    kp, ks = nkeys if night else keys
    names = secs.split() if isinstance(secs, str) else list(secs)
    g0 = nguitar if night else guitar
    # arrangement arc: with a guitar carrying the harmony, keys and pads join from the second section on
    loopn = [n for n in names if not s.sec[n].intro]
    later = ' '.join(n for n in names if n != loopn[0]) if (g0 and len(loopn) > 1 and stagger) else ' '.join(names)
    if kp is not None:
        k = s.parts.get('keys') or s.part('keys', kp, rev=.24 if not night else .3, pan=-.2, role='comp', chorus=.35 if kp in (EPIANO, EP2) else 0)
        k.gen(later, comp, style=ks, lo=keys_range[0], hi=keys_range[1], vel=keys_vel, n=3)
    g = nguitar if night else guitar
    if g:
        gp, gs = g
        gt = s.parts.get('guitar') or s.part('guitar', gp, rev=.18, pan=.35, role='comp', vol=-2)
        gt.gen(secs, comp, style=gs, lo=52, hi=69, n=3, vel=60)
    a = narp if night else arp
    if a:
        ap, astyle = a
        ar = s.parts.get('arp') or s.part('arp', ap, rev=.4, pan=.3, role='arp')
        ar.gen(secs, comp, style='arp', arp=astyle, lo=55, hi=76, vel=58)
    pp = npad if night else pad
    if pp is not None:
        p = s.parts.get('strings') or s.part('strings', pp, rev=.4, role='pad', width=1.25)
        p.gen(later if kp is not None or g0 else secs, pads, lo=53, hi=79, n=3, spread=False, vel=58 if not night else 52)
    kk, kg = nkit if night else kit
    if kg:
        d = s.parts.get('drums') or s.drums(kit=kk, rev=.16 if not night else .22, vol=0 if not night else -2)
        d.gen(secs, groove, name=kg, fills=fills, fill=nfill if night else fill, vel=drum_vel if not night else drum_vel - 14,
              crash=not night, hat_vel=hat_vel if not night else .55, tamb=None if night else tamb)
