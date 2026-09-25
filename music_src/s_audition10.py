"""Auditions, round 10 (SOLMERE_AUDITION=1): retakes of round 9's city pop and solo piano.

Round 9: "33 first 9 seconds before melody SO GOOD, keep that, retry the song after those 9 seconds. voicing
and compositions becomes too cheesy ... melody is again a different melody formula than the song asks for."
"34, cool idea but not good execution and the slamming bass ... that quick succession of notes at 1:19 REALLY
GOOD. perfect execution there."

  36 Neon Pier II      F, 104: aud33's intro note for note, then a city-pop tune read off Castelia's theme
  37 Keepsake Piano II Ab, 72: a new tune, pianist's left hand (no low bass hits), runs like the 1:19 one
"""
from mfw import *


def span(part, sec, src, vel, at=0.0):
    """One continuous line written from `at` beats into `sec` onward, across section lines (ties survive)."""
    s = part.song.sec[sec]
    evs, ln = parse(src, bar=part.song.bar, vel=vel, name=f'{part.song.id}/{part.name}/{sec}')
    for e in evs: part.add(s.at + at + e.t, e.d, e.p, e.v, e.art)
    return part


def tie_over_loop(part, beats):
    """The loop's last note is an anticipation of the loop's first bar: let it ring over the seam."""
    end = part.song.intro_len + part.song.loop_len
    part.notes = [(t, d + beats, p, v, a) if abs(t + d - end) < 1e-6 else (t, d, p, v, a) for (t, d, p, v, a) in part.notes]


# ============================================================================ 36  NEON PIER II (city pop)
# The intro is aud33's, regenerated from aud33's seeds (seed_id) with its mix levels pinned. After it, the
# tune takes the form BW's Castelia theme uses: every long note arrives an eighth early, on the "and" of 4,
# is held about two beats, answered by a shorter note, then the next anticipation. A two-bar breath, a
# 16th pickup into the second phrase, one reach up to the high E, a quick fall to finish the section. B is
# the other half of that idiom: clipped repeated sixteenths, then scale runs up to held high notes over a
# chain of ii-Vs. The loop ends with the intro groove on its own again. One flute, no pad, light drums.
NP2_I = 'Bbmaj7 | Am7 | Gm7 | C7sus4'
NP2_CH_A = 'Bbmaj7 | Am7 | Gm7 | C7sus4 | Bbmaj7 | Am7 | Gm7 | C7sus4'
NP2_CH_A2 = 'Bbmaj7 | Am7 | Gm7 | C7sus4 | Bbmaj7 | Am7 D7b9 | Gm7 C7 | Fmaj7'
NP2_CH_B = 'Dm7 | G7 | Cm7 F7 | Bbmaj7 | Gm7 | A7b9 | Dm7 G7 | C7sus4 C7'
NP2_TUNE = (
    'r:2. r:8 c6:8 |'                                                                        # intro bar 4
    '-:8 d6:2 c6:4 a5:8 | -:2 r:8 g5:16 a5:16 b5:8 c6:8 | -:8 bb5:4. a5:8 g5:4 f5:8 |'        # A
    '-:8 g5:2 r:4 f5:16 g5:16 | a5:4. f5:8 -:4 r:8 d6:8 | -:8 c6:4. a5:8 e6:4 c6:8 |'
    '-:8 d6:16 e6:16 f6:8 d6:8 c6:8 a5:4 g5:8 | -:2. r:8 c6:8 |'
    '-:8 d6:2 c6:4 a5:8 | -:2 r:16 e5:16 g5:16 a5:16 b5:8 c6:8 | -:8 bb5:4. a5:8 g5:4 f5:8 |'  # A2
    '-:8 g5:2 r:8 bb5:16 a5:16 f5:16 g5:16 | a5:4. f5:8 -:4 r:8 d6:8 | -:8 c6:4. a5:8 d6:4 c6:8 |'
    "-:8 d6:16 e6:16 f6:8 d6:8 bb5:8 g5:8 e5:8 f5:8 | -:2. r:4 |"
    "r:8 a5':16 r:8 a5':16 r:8 a5':16 r:16 c6:16 a5:16 g5:16 f5:16 r:16 b5:16 |"               # B
    "-:4. a5:16 b5:16 d6:4. r:16 c6:16 |"
    "-:8 r:8 c6':16 r:8 c6':16 r:16 eb6:16 c6:16 bb5:16 a5:8 r:16 a5:16 |"
    '-:2 g5:16 a5:16 g5:16 f5:16 d5:4 |'
    'r:8 d5:16 e5:16 f5:16 g5:16 a5:16 bb5:16 c6:16 d6:16 f6:4 r:16 e6:16 |'
    '-:4. d6:16 c#6:16 bb5:16 a5:16 c#6:8 e6:8 r:16 f6:16 |'
    '-:4 e6:16 f6:16 e6:16 d6:16 b5:8 g5:8 a5:8 b5:8 |'
    "c6:8 r:16 c6':16 r:8 c6':16 bb5:16 g5:16 e5:16 g5:4 r:8 |"
    'r:1 | r:1 | r:1 | r:2. r:8 c6:8')                                                       # T


@song('aud36')
def aud36(v):
    s = Song('aud36', bpm=104, title='Audition 36 - Neon Pier II', room=1.6, key='F')
    s.seed_id = 'aud33'                                       # the kept intro regenerates note for note
    s.pin_gains = {'guitar': 0.3, 'keys': 5.4, 'bass': -2.8}  # ... at aud33's levels
    s.no_push = True
    s.section('I', 4, NP2_I, intro=True)
    s.section('A', 8, NP2_CH_A); s.section('A2', 8, NP2_CH_A2); s.section('B', 8, NP2_CH_B)
    s.section('T', 4, NP2_I)
    for k in ('A', 'A2', 'B', 'T'): s.sec[k].key = 'F'
    ld = s.part('lead', FLUTE, rev=.3, delay=.1); ld.autovib = True
    span(ld, 'I', NP2_TUNE, vel=88, at=12)
    tie_over_loop(ld, .5)
    gt = s.part('guitar', JAZZGTR, rev=.18, role='comp', pan=-.3)
    gt.gen('I A A2 B', comp, style='offbeat', lo=55, hi=70, n=3, vel=50); gt.copy('I', 'T')
    pn = s.part('keys', EPIANO, rev=.3, role='comp', pan=.3, chorus=.3); pn.chorus_hz = .8
    pn.gen('I A A2 B', comp, style='stabs', pattern='x..x..x...x.x...', lo=52, hi=70, n=4, vel=46); pn.copy('I', 'T')
    bs = s.part('bass', FINGERBASS, rev=.05)
    bs.gen('I A A2 B', bass_line, style='funk', vel=88); bs.copy('I', 'T')
    dr = s.drums(kit=KIT_STD, rev=.12, vol=-5)
    dr.gen('A A2 B', groove, name='city', fills=0, vel=62, crash=False, hat_vel=.4)
    return s


# ============================================================================ 37  KEEPSAKE PIANO II (solo piano)
# Ab, 72. The right hand sings; the left hand is a pianist's pedalled broken chord (bass, fifth, seventh,
# tenth, rising and falling in eighths, everything ringing to the chord change), soft, the lowest note an
# Eb2, never a hammered low octave. The tune: an upward sigh into the tonic, an arpeggio flick up to a held
# note, and a quick run at each cadence (the kind round 9's 1:19 moment had). The second time round the
# first half is an octave up with the long falling run, the second half fills out in thirds and sixths.
KP2_CH = ('Abmaj7 | Fm7 | Dbmaj7 | Eb7sus4 Eb7 | Ab/C | Fm7 Bb7 | Bbm7 Eb7 | Ab6 |'
          'Dbmaj7 | C7 | Fm7 | Ebm7 Ab7 | Dbmaj7 | Dbm6 | Bbm7 Eb7 | Ab6')
KP2_TUNE = (
    'r:2. eb5:8 f5:8 |'                                                                      # intro bar 2
    'g5:4. ab5:8 -:2 | r:4 c5:16 f5:16 ab5:8 c6:4. bb5:8 | -:4 ab5:4. f5:8 eb5:8 db5:8 |'      # A
    'c5:4. db5:8 eb5:4 r:8 g5:16 ab5:16 | bb5:4. c6:8 -:2 | r:4 c5:16 f5:16 ab5:8 c6:4 d6:4 |'
    'eb6:8 f6:16 eb6:16 db6:8 c6:8 bb5:8 ab5:8 g5:8 bb5:8 | ab5:2. c5:8 eb5:8 |'
    'f5:2 -:8 g5:16 ab5:16 c6:8 bb5:8 | -:4 g5:4 e5:4. f5:8 | -:8 ab5:8 c6:8 f6:8 -:4 eb6:8 db6:8 |'
    'c6:8 db6:16 c6:16 bb5:8 gb5:8 ab5:4 -:8 gb5:8 | f5:4 ab5:8 bb5:8 c6:4. db6:8 |'
    'eb6:2 db6:8 bb5:8 fb5:8 ab5:8 | bb5:16 c6:16 db6:8 c6:8 bb5:8 ab5:4 g5:4 | ab5:2. eb6:8 f6:8 |'
    'g6:4. ab6:8 -:2 | r:4 c6:16 f6:16 ab6:8 c7:4. bb6:8 | -:4 ab6:4. f6:8 eb6:8 db6:8 |'      # A2
    'c6:4. db6:8 eb6:4 r:8 g6:16 ab6:16 | bb6:4. c7:8 -:2 | r:4 c6:16 f6:16 ab6:8 c7:4 bb6:8 ab6:8 |'
    'g6:16 ab6:16 bb6:8 g6:8 f6:8 eb6:8 db6:8 c6:8 bb5:8 | ab5:2. c5:8 eb5:8 |'
    'db5+f5:2 -:8 g5:16 ab5:16 c6:8 bb5:8 | -:4 e5+g5:4 c5+e5:4. f5:8 |'
    '-:8 ab5:8 c6:8 ab5+f6:4. eb6:8 db6:8 | c6:8 db6:16 c6:16 bb5:8 gb5:8 c5+ab5:4. gb5:8 |'
    'db5+f5:4 ab5:8 bb5:8 ab5+c6:4. db6:8 | bb5+eb6:2 db6:8 bb5:8 fb5:8 ab5:8 |'
    'bb5:16 c6:16 db6:8 f6:8 eb6:8 db6:8 c6:8 bb5:8 g5:8 | c5+ab5:2. r:4 |'
    'r:1 | r:2. eb5:8 f5:8')                                                                # T


def piano_lh(part, secs, vel=42, bass_vel=50, lo=39):
    """Pedalled broken chords: bass, then the fifth, the seventh (or sixth, or octave) and the tenth above,
    in eighths up and back; every note rings until the chord changes."""
    for name in secs.split():
        sec = part.song.sec[name]
        for (t, d, c) in sec.chords:
            b = lo + (c.bass - lo) % 12
            up = [c.pc(5) if c.pc(5) is not None else c.root,
                  c.pc(7) if c.pc(7) is not None else c.pc(6) if c.pc(6) is not None else c.root,
                  c.pc(3) if c.pc(3) is not None else c.pc(4)]
            vs = [b]
            for pc in up:
                p = vs[-1] + 1 + (pc - vs[-1] - 1) % 12
                if pc == up[-1] and p - b < 12: p += 12          # the third sits a tenth up, not in the fist
                vs.append(p)
            order = [0, 1, 2, 3, 2, 1, 2, 1] if d >= 4 - 1e-6 else [0, 1, 2, 3][:int(round(d * 2))]
            hits = [(t + k * .5, ix) for k, ix in enumerate(order) if t + k * .5 < t + d - 1e-6]
            for k, (on, ix) in enumerate(hits):
                # rings like a held pedal: until the chord changes or the same key is struck again
                again = [o for (o, j) in hits[k + 1:] if j == ix]
                end = again[0] if again else t + d
                part.add(sec.at + on, end - on, vs[ix], (bass_vel if ix == 0 else vel + (4 if k == 4 else 0)), '')
    return part


@song('aud37')
def aud37(v):
    s = Song('aud37', bpm=72, title='Audition 37 - Keepsake Piano II', room=2.2, key='Ab')
    s.no_push = True
    s.section('I', 2, 'Dbmaj7 | Eb7sus4', intro=True)
    s.section('A', 16, KP2_CH); s.section('A2', 16, KP2_CH)
    s.section('T', 2, 'Dbmaj7 | Eb7sus4')
    ld = s.part('lead', PIANO, rev=.36, delay=.04)
    span(ld, 'I', KP2_TUNE, vel=74, at=4)
    tie_over_loop(ld, 0)
    lh = s.part('left', PIANO, rev=.36, role='comp', pan=-.1)
    piano_lh(lh, 'I A A2 T')
    st = s.part('strings', SLOWSTR, rev=.46, role='pad', width=1.3)
    st.gen('A2', pads, lo=53, hi=70, n=3, vel=24, spread=False)
    return s


# ============================================================================ 38  ROOFTOP II (4/4 swing)
# Round 9: "melody phrasing and accompaniment doesnt fit, cant just be waltz phrasing over it". The old tune
# moved in dotted halves and quarters (a waltz's long-short) over a quarter-note piano. Read first: the 4/4
# town themes with this kind of pulse (Oldale, Petalburg, Goldenrod) talk in short swung motifs of two to
# five notes that land, often off the beat, on a held note, with rests between; the reply climbs a little
# higher; a phrase ends on a long note, the last one after a quick run. The piano plays charleston hits so
# the band swings the same way the tune does.
RT3_CH_A = ('Gmaj7 | Em7 | Am7 | D9sus4 | Bm7 | E7b13 | Am7 D7 | G6 |'
            'Gmaj7 | Em7 | Am7 | D7 | Em7 | A9 | Am7 D7 | G6')
RT3_CH_B = 'Cmaj7 | Cm6 | Bm7 | E7b9 | Am7 | D7 | Gmaj7 E7 | Am7 D7'
RT3_A = ('d5:4 g5:8 a5:8 -:8 b5:8 -:4 | a5:4 g5:8 e5:8 -:4 r:4 | r:4 e5:8 g5:8 c6:4. b5:8 | a5:2. r:4 |'
         'd5:4 f#5:8 a5:8 -:8 b5:8 -:4 | c6:8 b5:8 g#5:4 -:8 e5:8 f#5:8 g#5:8 | a5:4. c6:8 -:8 b5:8 a5:8 f#5:8 | g5:2. r:4 |'
         'd5:4 g5:8 a5:8 -:8 b5:8 -:8 d6:8 | -:8 b5:8 a5:8 g5:8 e5:4 r:4 | r:4 e5:8 g5:8 -:8 c6:8 e6:4 |'
         'd6:4 c6:8 a5:8 -:4 r:8 f#5:8 | g5:4 b5:8 e6:8 -:4 d6:8 b5:8 | c#6:4. b5:8 a5:8 g5:8 e5:8 c#5:8 |'
         'r:8 e5:16 f#5:16 g5:8 a5:8 c6:8 b5:8 a5:8 f#5:8 | g5:2. r:4')
RT3_B = ('g5:4. e5:8 -:2 | eb5:4. d5:8 -:4 c5:8 eb5:8 | d5:2 r:8 f#5:8 b5:4 | -:8 a5:8 g#5:8 f5:8 -:4 e5:4 |'
         'r:8 c5:16 e5:16 a5:4 g5:8 e5:8 c5:4 | d5:4. f#5:8 -:8 a5:8 c6:4 | b5:4. a5:8 g#5:4 b5:4 | c6:4 a5:8 e5:8 f#5:4 d5:4')


@song('aud38')
def aud38(v):
    s = Song('aud38', bpm=104, swing=.6, title='Audition 38 - Rooftop II', room=1.8, key='G')
    s.no_push = True
    s.section('I', 2, 'Cmaj7 | D9sus4', intro=True)
    s.section('A', 16, RT3_CH_A); s.section('B', 8, RT3_CH_B)
    s.section('T', 2, 'Cmaj7 | D9sus4')
    for k in ('A', 'B', 'T'): s.sec[k].key = 'G'
    ld = s.part('lead', CLARINET, rev=.34, delay=.08); ld.autovib = True
    ld.write('A', RT3_A, vel=88); ld.write('B', RT3_B, vel=86)
    pn = s.part('piano', PIANO, rev=.3, role='comp', pan=.15)
    pn.gen('I A T', comp, style='charleston', lo=52, hi=69, n=4, vel=42)
    pn.gen('B', comp, style='swingcomp', lo=52, hi=69, n=4, vel=40)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A T', bass_line, style='two', vel=80); bs.gen('B', bass_line, style='walk', vel=78)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-5)
    dr.gen('A B T', groove, name='brush', fills=8, fill='brush', vel=46, crash=False)
    return s
