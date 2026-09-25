"""Field music: routes (with day/night arrangements)."""
from mfw import *


# ============================================================================ ROUTE 1
# "First Steps", written to STYLE_DP.md in the Route 203 idiom: G major, 132, straight eighths.
# One motif: a scale run that pushes over the beat into a held note, answered by a short
# arpeggio (x y x' y'). A: I IV7 V42 vi (Ichinose's IV7-V42-vi turn) to a half cadence; A': V7/ii and
# the borrowed minor iv to an authentic close; B jumps up a minor third to Bb for the climax and
# drops home through Eb7-D7.
R1_A = ('d5:8 g5:8 a5:8 b5:8 -:4 a5:8 g5:8 | e5:8 g5:8 c6:4 b5:2 | d5:8 f#5:8 a5:8 c6:8 -:4 b5:8 a5:8 | b5:8 g5:8 e6:4 d6:2 |'
        'c6:8 b5:8 a5:8 e5:8 -:4 c6:4 | d6:8 c6:8 b5:8 f#5:8 -:4 d6:4 | e6:4. d6:8 c6:4 b5:4 | a5:2. r:4')
R1_A2 = ('d5:8 g5:8 a5:8 b5:8 -:4 a5:8 g5:8 | e5:8 g5:8 c6:4 b5:2 | d5:8 f#5:8 a5:8 c6:8 -:4 b5:8 a5:8 | b5:8 d6:8 f#6:4 e6:4 g#5:4 |'
         'a5:8 b5:8 c6:8 e6:8 -:4 d6:8 c6:8 | eb6:4. d6:8 c6:4 g5:4 | b5:4 g5:4 a5:4 f#5:4 | g5:2. r:4')
R1_B = ('g5:4 bb5:4 d6:2 | c6:4. a5:8 -:2 | f5:4 a5:4 c6:2 | d6:4. bb5:8 -:2 |'
        'eb6:4 g6:4 f6:4 eb6:4 | d6:2 c6:4 a5:4 | d6:2 bb5:4 f5:4 | g5:4 bb5:4 c6:4 a5:4')


@song('route1', variants=('day', 'night'))
def route1(v):
    night = v == 'night'
    s = Song('route1', bpm=132, swing=.5, title='Route 1 — First Steps', room=1.7, reverb=1.0, key='G')
    s.no_push = True
    s.section('intro', 2, 'Cmaj7 | D7sus4 D7', intro=True)
    s.section('A', 8, 'G | Cmaj7 | D/C | Em7 | Am7 | Bm7 | Cmaj7 | D7sus4 D7')
    s.section('A2', 8, 'G | Cmaj7 | D/C | Bm7 E7 | Am9 | Cm6 | G/D D7 | G')
    s.section('B', 8, 'Ebmaj7 | F/Eb | Dm7 | Gm7 | Cm9 | F13 | Bbmaj7 | Eb7 D7')
    s.section('A3', 8, 'G | Cmaj7 | D/C | Bm7 E7 | Am9 | Cm6 | G/D D7 | G')
    s.shape = {'A': -4, 'A2': 2, 'B': 6, 'A3': 3}

    lead = s.part('lead', TRUMPET if not night else FLUTE, pan=.05, rev=.26 if not night else .34, delay=.1,
                  layer=[FLUTE] if not night else []); lead.autovib = True; lead.layer_gain = .6
    lead.write('A', R1_A, vel=94 if not night else 84); lead.write('A2', R1_A2, vel=96 if not night else 86); lead.write('A3', R1_A2, vel=96 if not night else 86)
    gl = s.part('glock', GLOCK if not night else VIBES, pan=.3, rev=.4, role='sparkle')
    gl.write('A2', R1_A2, transpose=12 if not night else 0, vel=58)
    hn = s.part('horn', HORN if not night else CLARINET, pan=-.15, rev=.34, layer=[VIOLIN] if not night else [], role='lead'); hn.autovib = True
    hn.write('B', R1_B, vel=92 if not night else 84)
    # last A: the horn answers the tune with a slow guide-tone line
    hn.write('A3', 'b4:2 d5:2 | e5:1 | f#5:2 e5:2 | d5:2 b4:2 | c5:1 | eb5:2 c5:2 | d5:2 c5:2 | b4:2. r:4', vel=72 if not night else 66)
    # intro fanfare in three-part brass
    br = s.part('brass', BRASS if not night else HORN, vol=0 if not night else -3, pan=-.1, rev=.28)
    harm(br, s.sec['intro'], 'g5:8 a5:8 b5:4 c6:8 b5:8 a5:4 | d6:2. r:4', n=3, vel=100 if not night else 74)
    # bouncing staccato strings (the DP route sound) + offbeat piano
    sp = s.part('stacc', STRINGS if not night else PIZZ, pan=.25, rev=.25, role='comp')
    sp.gen('A A2 B A3', comp, style='pulse8', lo=55, hi=72, n=3, vel=56)
    pn = s.part('piano', BRIGHT if not night else EPIANO, pan=-.2, rev=.22, role='comp', chorus=.3 if night else 0)
    pn.gen('intro A A2 A3', comp, style='offbeat', lo=55, hi=74, vel=58)
    st = s.part('strings', SLOWSTR, pan=0, rev=.4, width=1.2, role='pad')
    st.gen('B A3', pads, lo=55, hi=79, vel=60); st.swell('B', 0, 32, 80, 122)
    bs = s.part('bass', FINGERBASS if not night else FRETLESS, rev=.04)
    bs.gen('intro A A2 B A3', bass_line, style='pop8' if not night else 'two', vel=94, octave_pop=False)
    if not night:
        dr = s.drums(kit=KIT_STD, rev=.14)
        dr.gen('intro', groove, name='march', fills=2, fill='tom', vel=90)
        dr.gen('A A2', groove, name='pop', fills=8, fill='snare', vel=90)
        dr.gen('B A3', groove, name='pop2', fills=8, fill='tom', vel=94)
    else:
        dr = s.drums(kit=KIT_BRUSH, vol=-2, rev=.2)
        dr.gen('intro A A2 B A3', groove, name='soft', fills=8, fill='brush', vel=66, crash=False)
    return s


# ============================================================================ ROUTE 2
# "Hedgerow Lane" - G major, 132, a bouncy 16th swing. Accordion and flute (a French-cafe tint)
# over walking acoustic bass; borrowed iv-minor (Cm6) turns for that end-of-summer ache.
@song('route2', variants=('day', 'night'))
def route2(v):
    night = v == 'night'
    s = Song('route2', bpm=132, swing=.58, title='Route 2 — Hedgerow Lane', room=1.6)
    s.section('intro', 2, 'Cmaj7 | D7sus4 D7', intro=True)
    s.section('A', 16, 'Gmaj7 | Bm7 E7 | Am9 | D13 | Gmaj7 | Bm7 E7b9 | Am7 | Cm6 | Bm7 | E7 | Am9 | D7 | Em7 | A13 | Am7 D7 | G6')
    s.section('B', 8, 'Cmaj9 | B7alt | Em9 | A13 | Am9 | D13 | Bm7 E7b9 | Am7 D7sus4')
    mA = ('d5:8 g5:8 b5:4 a5:8 g5:8 f#5:8 g5:8 | a5:4. f#5:8 g#5:4 b5:4 | c6:4. b5:8 a5:4 e5:4 | f#5:2. r:8 d5:8 |'
          'd5:8 g5:8 b5:4 a5:8 g5:8 d6:4 | c#6:4. b5:8 f5:4 g#5:4 | a5:4. g5:8 e5:4 c5:4 | eb5:2. a4:4 |'
          'd5:8 f#5:8 a5:4 g5:8 f#5:8 e5:8 f#5:8 | g#5:4. e5:8 d5:4 b4:4 | c5:8 e5:8 g5:4 b5:4 a5:4 | f#5:2. a5:4 |'
          'g5:8 b5:8 d6:4 c6:8 b5:8 a5:8 g5:8 | f#5:4. e5:8 c#5:4 g5:4 | e5:4 c5:4 f#5:4 a5:4 | g5:2. r:4')
    mB = 'e5:2. d5:8 e5:8 | d#5:2 c5:4 a4:4 | b4:2. f#5:4 | f#5:2 e5:4 c#5:4 | b5:2. a5:8 g5:8 | f#5:2 b5:4 c6:4 | a5:4 f#5:4 g#5:4 f5:4 | e5:4 c5:4 g5:2'
    ld = s.part('lead', ACCORDION if not night else MUTETPT, rev=.24 if not night else .34, delay=.08); ld.autovib = night
    ld.write('A', mA, vel=90)
    fl = s.part('flute', FLUTE if not night else VIBES, rev=.34, role='counter', pan=.25); fl.autovib = not night
    fl.write('A', mA, transpose=12 if not night else 0, vel=70)
    b2 = s.part('lead2', CLARINET if not night else FLUTE, rev=.32, role='lead', pan=-.1); b2.autovib = True
    b2.write('B', mB, vel=88)
    pz = s.part('pizz', PIZZ, rev=.3, role='arp', pan=.3)
    pz.gen('A', ostinato, pattern='0 . 2 . 1 . 3 .', lo=62, vel=70, rate=.5)
    band(s, 'intro A B', night, bass='walk', bass_prog=ACBASS, nbass='walk', nbass_prog=ACBASS, keys=(PIANO, 'charleston'), nkeys=(EPIANO, 'swingcomp'),
         guitar=(STEEL, 'pulse8'), nguitar=(NYLON, 'bossa'), kit=(KIT_JAZZ, 'pop'), nkit=(KIT_BRUSH, 'soft'))
    return s


# ============================================================================ ROUTE 3
# "Ember Road" - A major, 150. The mountain road to Cindervale: trumpet and overdriven guitar in
# unison, then a bVI-bVII-I (F-G-A) heroic climb.
@song('route3', variants=('day', 'night'))
def route3(v):
    night = v == 'night'
    s = Song('route3', bpm=150, title='Route 3 — Ember Road', room=1.5)
    s.section('intro', 2, 'F G | A', intro=True)
    s.section('A', 16, 'A | E/G# | F#m7 | D | A | E/G# | Bm7 | E7sus4 E7 | Dmaj7 | C#m7 | Bm7 | A/C# | Dmaj7 | E | F#m7 B7 | E7sus4 E7')
    s.section('B', 8, 'F | G | A | A | F | G | Bm7 | E7')
    mA = ('e5:8 a5:8 c#6:8 e6:8 r:8 c#6:8 e6:4 | d6:8 c#6:8 b5:8 g#5:8 e5:2 | f#5:8 a5:8 c#6:8 e6:8 r:8 c#6:8 a5:4 | f#5:2. r:4 |'
          'e5:8 a5:8 c#6:8 e6:8 r:8 f#6:8 e6:4 | d6:8 e6:8 b5:8 g#5:8 b5:2 | d6:4. c#6:8 b5:4 f#5:4 | a5:2 g#5:2 |'
          'f#5:4. a5:8 c#6:4 e6:4 | e6:4. d#6:8 c#6:4 g#5:4 | d6:4. c#6:8 b5:4 f#5:4 | e5:2 a5:2 |'
          'a5:4 d6:4 f#6:4 e6:4 | e6:2. b5:4 | a5:4 c#6:4 d#6:4 f#6:4 | e6:2 d6:4 b5:4')
    mB = 'c6:4. a5:8 f5:2 | d6:4. b5:8 g5:2 | e6:4 c#6:4 a5:4 c#6:4 | e6:2. r:4 | a5:4. c6:8 f6:4 c6:4 | b5:4. d6:8 g6:4 d6:4 | f#6:4 d6:4 a5:4 f#5:4 | g#5:4 b5:4 d6:4 e6:4'
    if not night:
        ld = s.part('lead', TRUMPET, rev=.22, layer=[OVERDRIVE], delay=.07); ld.autovib = True; ld.layer_gain = .7
        ld.write('A', mA, vel=98); ld.write('B', mB, vel=102)
        br = s.part('brass', BRASS, rev=.25, role='brass')
        br.write('intro', 'f4+a4+c5+f5:8 r:8 f4+a4+c5+f5:8 r:8 g4+b4+d5+g5:4. r:8 | a4+c#5+e5+a5:2. r:4', vel=108)
        br.gen('B', comp, style='stabs', pattern='x..x..x.........', lo=58, hi=77, vel=96, rootless=False)
    else:
        ld = s.part('lead', FLUTE, rev=.34, delay=.12); ld.autovib = True
        ld.write('A', mA, vel=88); ld.write('B', mB, vel=90)
        br = s.part('brass', HORN, rev=.34, role='brass', vol=-3)
        br.write('intro', 'f4+a4+c5+f5:2 g4+b4+d5+g5:2 | a4+c#5+e5+a5:2. r:4', vel=80)
        br.gen('B', pads, lo=55, hi=74, vel=62)
    band(s, 'intro A B', night, bass='pop8', bass_prog=PICKBASS, nbass='two', nbass_prog=FINGERBASS,
         keys=(BRIGHT, 'pulse8'), nkeys=(EPIANO, 'block'), guitar=(CLEANGTR, 'offbeat'), nguitar=(NYLON, 'arp'),
         kit=(KIT_ROOM, 'drive'), nkit=(KIT_JAZZ, 'ballad'), tamb='x-x-x-x-x-x-x-x-', fill='tom')
    return s


# ============================================================================ ROUTE 4
# "Rainmoor" - D dorian, 116, neo-soul 16th swing: the road into Duskmere's endless dusk.
@song('route4', variants=('day', 'night'))
def route4(v):
    night = v == 'night'
    s = Song('route4', bpm=116, swing=.6, title='Route 4 — Rainmoor', room=1.9)
    s.section('intro', 2, 'Dm9 | G13', intro=True)
    s.section('A', 16, 'Dm9 | G13 | Dm9 | G13 | Bbmaj9 | A7alt | Dm9 | Dm9 | Gm9 | C13 | Fmaj9 | Bbmaj7 | Em7b5 | A7b9 | Dm9 | A7alt')
    s.section('B', 8, 'Bbmaj7#11 | Am7 | Gm9 | C13 | Fmaj9 | Em7b5 A7 | Dm9 | Ebmaj7#11 A7alt')
    mA = ('a4:8 d5:8 f5:8 a5:8 e5:4. f5:8 | e5:2 d5:4 b4:4 | a4:8 d5:8 f5:8 a5:8 c6:4. a5:8 | b5:2 a5:4 f5:4 |'
          'd5:4. f5:8 a5:4 c6:4 | c#6:4. bb5:8 g5:4 f5:4 | e5:1 | r:2 r:8 a4:8 c5:8 d5:8 |'
          'f5:4. d5:8 bb4:4 a4:4 | g4:4 bb4:4 e5:4 a5:4 | g5:2. f5:8 e5:8 | d5:2 f5:4 a5:4 |'
          'g5:4. bb5:8 d6:4 bb5:4 | c#6:4. bb5:8 g5:4 e5:4 | f5:2 e5:4 d5:4 | c#5:2. r:4')
    mB = 'e5:2. d5:8 f5:8 | e5:2 c5:4 a4:4 | a4:2. bb4:8 d5:8 | e5:2 a5:2 | g5:2. a5:8 c6:8 | bb5:4 g5:4 c#6:4 e6:4 | f6:2 e6:2 | d6:4 a5:4 c#6:4 bb5:4'
    ld = s.part('lead', ALTOSAX if not night else FLUTE, rev=.26 if not night else .36, delay=.1); ld.autovib = True
    ld.write('A', mA, vel=94 if not night else 86)
    vb = s.part('vibes', VIBES, rev=.34, role='lead', layer=[EPIANO] if not night else [CELESTA]); vb.layer_gain = .6
    vb.write('B', mB, vel=90)
    band(s, 'intro A B', night, bass='funk', bass_prog=FINGERBASS, nbass='two', nbass_prog=FRETLESS,
         keys=(EPIANO, 'swingcomp'), nkeys=(EPIANO, 'block'), guitar=(MUTEDGTR, 'stabs'), nguitar=None,
         kit=(KIT_STD, 'city'), nkit=(KIT_BRUSH, 'soft'), fill='snare', drum_vel=86)
    s.parts['bass'].notes = []   # funk bass wants its own pattern
    s.parts['bass'].gen('intro A B', bass_line, style='funk' if not night else 'two', pattern='x..x..x.x..o..x.', vel=96, lo=28, hi=50)
    return s


# ============================================================================ SURF (routes 5-6, the Mere)
@song('surf', variants=('day', 'night'))
def surf(v):
    night = v == 'night'
    s = Song('surf', bpm=124, swing=.57, title='Across the Mere', room=1.9)
    s.section('intro', 2, 'Gm7 | C7sus4 C7', intro=True)
    s.section('A', 16, 'Fmaj7 | Gm7 C7 | Fmaj7 | Dm7 | Bbmaj7 | C7 | Am7 | Dm7 | Gm7 | C9 | Am7 | D7b9 | Gm7 | C13 | Fmaj7 | C7sus4')
    s.section('B', 8, 'Bbmaj7 | Bbm6 | Am7 | D7 | Gm7 | C7 | Fmaj7 | Gm7 C7')
    mA = ('c5:8 f5:8 a5:8 c6:8 r:8 a5:8 c6:4 | bb5:4. g5:8 e5:4 c5:4 | c5:8 f5:8 a5:8 c6:8 r:8 e6:8 f6:4 | d6:2. a5:4 |'
          'bb5:8 a5:8 f5:8 d5:8 f5:4 a5:4 | g5:4. bb5:8 e5:2 | c6:4 a5:4 g5:4 e5:4 | f5:2. r:4 |'
          'd5:8 g5:8 bb5:8 d6:8 r:8 bb5:8 d6:4 | d6:4. bb5:8 g5:4 e5:4 | c5:8 e5:8 a5:8 c6:8 r:8 a5:8 e6:4 | d6:4. eb6:8 c6:4 f#5:4 |'
          'bb5:4. a5:8 g5:4 d5:4 | e5:4. g5:8 a5:4 bb5:4 | a5:2 c6:4 e6:4 | f6:2. r:4')
    mB = 'd6:2. c6:8 d6:8 | db6:2 bb5:4 g5:4 | c6:2. a5:8 e5:8 | f#5:2 a5:4 c6:4 | bb5:2. g5:8 d5:8 | e5:2 g5:4 bb5:4 | a5:2 e6:2 | d6:4 bb5:4 g5:4 e5:4'
    ld = s.part('lead', STEELDRUM if not night else VIBES, rev=.3, layer=[FLUTE], delay=.12); ld.layer_gain = .55
    ld.write('A', mA, vel=96 if not night else 86)
    ob = s.part('lead2', OBOE if not night else CLARINET, rev=.34, role='lead'); ob.autovib = True
    ob.write('B', mB, transpose=-12, vel=90)
    pc = s.drums('perc', kit=KIT_STD, role='perc', rev=.2)
    pc.gen('A B', groove, name='none', fills=0, crash=False, extra=dict(cgh='--x--x----x--x--', cgo='x-----x-x-----x-', cgl='----x-------x---', sh='xxxxxxxxxxxxxxxx'), vel=80)
    band(s, 'intro A B', night, bass='calypso', bass_prog=FINGERBASS, nbass='bossa', nbass_prog=FRETLESS,
         keys=(MARIMBA, 'offbeat'), nkeys=(EPIANO, 'swingcomp'), guitar=(NYLON, 'bossa'), nguitar=(NYLON, 'bossa'),
         kit=(KIT_STD, 'soft'), nkit=(KIT_BRUSH, 'soft'), fills=8, drum_vel=84)
    return s


# ============================================================================ BIKE
@song('bike')
def bike(v):
    s = Song('bike', bpm=160, swing=.56, title='Cycling!', room=1.3, loudness=-16.0)
    s.section('A', 16, 'Bbmaj7 | Gm7 | Cm7 | F7 | Bbmaj7 | Gm7 | Ebmaj7 | F7sus4 F7 | Dm7 | Gm7 | Cm7 | F7 | Ebmaj7 | Edim7 | Bb/F | F7sus4 F7')
    ld = s.part('lead', SYNBRASS, rev=.18, layer=[ALTOSAX], delay=.08); ld.autovib = True; ld.layer_gain = .7
    ld.write('A', 'f5:8 bb5:8 d6:8 f6:8 r:8 d6:8 f6:4 | f6:4. d6:8 bb5:4 g5:4 | g5:8 c6:8 eb6:8 g6:8 r:8 eb6:8 g6:4 | f6:4. eb6:8 c6:4 a5:4 |'
                  'd6:8 c6:8 bb5:8 a5:8 bb5:4 d6:4 | f6:2. d6:4 | g5:8 bb5:8 d6:8 g6:8 r:8 f6:8 eb6:4 | bb5:2 a5:2 |'
                  'a5:8 d6:8 f6:8 a6:8 r:8 f6:8 d6:4 | bb5:4. a5:8 g5:4 d5:4 | eb5:8 g5:8 bb5:8 d6:8 r:8 c6:8 bb5:4 | a5:4. c6:8 eb6:4 f6:4 |'
                  'g6:4 f6:4 eb6:4 d6:4 | c#5:4 e5:4 g5:4 bb5:4 | d6:2 bb5:2 | c6:4 bb5:4 a5:4 f5:4', vel=100)
    band(s, 'A', bass='funk', bass_prog=SLAP, keys=(CLAV, 'stabs'), guitar=(MUTEDGTR, 'pulse8'), kit=(KIT_STD, 'disco'),
         tamb='x-x-x-x-x-x-x-x-', fill='mix', drum_vel=96)
    s.parts['bass'].notes = []
    s.parts['bass'].gen('A', bass_line, style='funk', pattern='x.ox..x.x.ox.x.o', vel=100, lo=28, hi=50)
    br = s.part('brass', BRASS, rev=.2, role='brass')
    br.gen('A', comp, style='stabs', pattern='......x.......x.', lo=58, hi=77, vel=96, rootless=False)
    return s


# ============================================================================ WHISPERWOOD (forest)
# E dorian waltz in 3/4, 132. Harp, pizzicato and ocarina; a hush of triangle and shaker.
@song('forest')
def forest(v):
    s = Song('forest', bpm=132, bar=3, title='Whisperwood', room=2.4, reverb=1.15)
    s.section('A', 16, 'Em9 | Em9 | Cmaj7 | Cmaj7 | Am7 | Am7 | Bm7 | B7sus4:2 B7:1 | Em9 | Em9 | Cmaj7#11 | Cmaj7#11 | Am9 | D13 | Gmaj7 | B7alt')
    s.section('B', 8, 'Cmaj9 | Bm7 | Am9 | Em9 | Cmaj9 | Bm7 | F#m7b5 | B7')
    ld = s.part('lead', OCARINA, rev=.42, delay=.14); ld.autovib = True
    ld.write('A', 'b4:4 e5:4 f#5:4 | g5:2. | e5:4 g5:4 b5:4 | c6:2 b5:4 | a5:4. g5:8 e5:4 | c5:2. | d5:4 f#5:4 a5:4 | e5:2 d#5:4 |'
                  'b4:4 e5:4 f#5:4 | g5:4. a5:8 b5:4 | f#5:2 e5:4 | g5:2. | e5:4 a5:4 b5:4 | c6:2 b5:4 | d6:4. b5:8 f#5:4 | d#5:2 r:4', vel=86)
    fl = s.part('flute', FLUTE, rev=.45, role='lead', layer=[VIOLIN]); fl.autovib = True; fl.layer_gain = .6
    fl.write('B', 'e6:2 d6:4 | d6:2 a5:4 | c6:4 b5:4 a5:4 | g5:2 f#5:4 | e6:4. d6:8 b5:4 | f#6:2 d6:4 | c6:4 a5:4 e5:4 | d#5:2.', vel=84)
    hp = s.part('harp', HARP, rev=.45, pan=.3)
    hp.gen('A B', comp, style='arp', arp='up8', lo=52, hi=74, vel=62)
    pz = s.part('pizz', PIZZ, rev=.35, pan=-.3, role='comp')
    pz.gen('A B', comp, style='waltz', lo=55, hi=72, n=3, vel=64)
    st = s.part('strings', SLOWSTR, rev=.45, role='pad', width=1.3)
    st.gen('A B', pads, lo=52, hi=74, vel=58)
    cl = s.part('celesta', CELESTA, rev=.5, role='sparkle', pan=.4)
    cl.write('B', 'r:2 e6:8 g6:8 | b6:2. | r:2 c6:8 e6:8 | g6:2. | r:2 e6:8 g6:8 | b6:2. | r:2 a5:8 c6:8 | f#6:2.', vel=64)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('A B', bass_line, style='waltz', vel=84)
    pc = s.drums('perc', kit=KIT_STD, role='perc', rev=.3)
    for sec in ('A', 'B'):
        for b in range(s.sec[sec].bars): pc.write(sec, 'sh:8 sh sh sh sh sh' if b % 4 != 3 else 'sh:8 sh sh sh tri:4', at=b * 3, strict=False)
    return s


# ============================================================================ CAVES
def _cave(sid, title, key_tr, bpm, lead_prog, sparkle_prog, pad_prog, ice=False):
    s = Song(sid, bpm=bpm, title=title, room=3.0, reverb=1.25, loudness=-18.0)
    if not ice:
        s.section('A', 8, 'Dm9 | Dm9 | Bbmaj7#11 | Bbmaj7#11 | Gm9 | Gm9 | A7sus4 | A7b9')
        s.section('B', 8, 'Fmaj7 | Em7b5 | Dm9 | Cmaj7 | Bbmaj7 | Gm9 | Em7b5 | A7alt')
        mA = 'd4:2 a4:2 | g4:2. f4:8 e4:8 | f4:1 | e4:2 d4:2 | bb4:2 a4:2 | g4:2. d5:4 | e5:2 d5:2 | c#5:1'
        mB = 'a4:2 c5:2 | bb4:2 g4:2 | f4:2. e4:4 | g4:1 | f4:2 a4:2 | bb4:2 d5:2 | d5:2 bb4:2 | c#5:1'
    else:
        s.section('A', 8, 'F#m9 | Dmaj7#11 | Bm9 | C#7sus4 C#7 | F#m9 | Dmaj7#11 | Gmaj7#11 | C#7alt')
        s.section('B', 8, 'Amaj9 | G#m7 | F#m9 | E6 | Dmaj9 | C#m7 | Bm7 E7 | C#7sus4 C#7')
        mA = 'c#6:4. e6:8 g#6:4 f#6:4 | e6:2 c#6:2 | d6:4. c#6:8 a5:4 f#5:4 | g#5:2 e#5:2 | c#6:4. e6:8 a6:4 g#6:4 | e6:2 g#6:2 | f#6:4. e6:8 d6:4 b5:4 | e#5:1'
        mB = 'c#6:2. b5:8 c#6:8 | d#6:2 b5:4 g#5:4 | a5:2. g#5:8 f#5:8 | g#5:1 | a5:4. c#6:8 e6:4 f#6:4 | e6:2 g#5:2 | a5:4 f#5:4 g#5:4 b5:4 | f#5:2 e#5:2'
    ld = s.part('lead', lead_prog, rev=.5, delay=.18); ld.autovib = True
    ld.write('A', mA, vel=86); ld.write('B', mB, vel=88)
    mr = s.part('marimba', MARIMBA if not ice else sparkle_prog, rev=.5, role='arp', pan=-.3)
    mr.gen('A B', ostinato, pattern='0 2 1 3 2 1 3 2', lo=57 if not ice else 69, vel=66, rate=.5)
    pd = s.part('pad', pad_prog, rev=.55, role='pad', width=1.5, layer=[SLOWSTR])
    pd.gen('A B', pads, lo=48, hi=72, vel=64)
    bs = s.part('bass', CONTRABASS if not ice else FRETLESS, rev=.2)
    bs.gen('A B', bass_line, style='pedal', vel=86)
    sp = s.part('drip', sparkle_prog, rev=.6, role='sparkle', pan=.4, delay=.3)
    r = random_notes = [('A', 3.5, 'a6'), ('A', 13.5, 'e6'), ('A', 22, 'f6'), ('A', 29.5, 'd7'), ('B', 5.5, 'c7'), ('B', 14, 'g6'), ('B', 21.5, 'a6'), ('B', 30, 'e7')]
    for (sec, b, n) in random_notes: sp.add(s.sec[sec].at + b, .5, note(n) + (4 if ice else 0), 60)
    dr = s.drums(kit=KIT_ROOM, rev=.45, vol=-4)
    dr.gen('A B', groove, name='tom' if not ice else 'soft', fills=8, fill='brush', vel=62, crash=False, hat_vel=.4)
    return s


@song('cave')
def cave(v): return _cave('cave', 'Glimmer Cave', 0, 88, CLARINET, CELESTA, HALOPAD)


@song('icecave')
def icecave(v): return _cave('icecave', 'Glacia Pass', 0, 92, FLUTE, GLOCK, CRYSTAL, ice=True)


# ============================================================================ VICTORY ROAD
@song('victoryroad')
def victoryroad(v):
    s = Song('victoryroad', bpm=128, title='Victory Road', room=2.0, loudness=-16.5)
    s.section('intro', 2, 'Ab Bb | Cm', intro=True)
    s.section('A', 16, 'Cm | Bb/C | Ab/C | Bb/C | Cm | Bb/C | Abmaj7 | G7sus4 G7 | Fm9 | Bb13 | Ebmaj7 | Abmaj7 | Dm7b5 | G7b9 | Cm9 | G7alt')
    s.section('B', 8, 'Abmaj7 | Bb6 | Gm7 | Cm9 | Abmaj7 | Bb6 | Cm | Cm')
    ld = s.part('lead', TRUMPET, rev=.3, layer=[HORN], delay=.08); ld.autovib = True
    ld.write('A', 'c5:4 g5:4 eb5:8 f5:8 g5:4 | f5:2. d5:4 | eb5:4 c5:4 ab5:4 g5:4 | f5:2 d5:2 | c5:4 g5:4 eb5:8 f5:8 g5:4 | bb5:2. f5:4 | ab5:4. g5:8 eb5:4 c5:4 | d5:2 b4:2 |'
                  'c5:4 f5:4 ab5:4 g5:4 | f5:2. g5:4 | g5:4 bb5:4 d6:4 bb5:4 | c6:2. g5:4 | f5:4 ab5:4 c6:4 ab5:4 | b5:4. ab5:8 f5:4 d5:4 | eb5:4 d5:4 c5:4 g5:4 | b4:2. r:4', vel=98)
    sl = s.part('strlead', VIOLIN, rev=.4, layer=[STRINGS], role='lead'); sl.autovib = True
    sl.write('B', 'c6:2. bb5:8 c6:8 | d6:2 g5:4 bb5:4 | d6:2. bb5:4 | d6:1 | eb6:2. c6:4 | d6:2 f6:4 g6:4 | eb6:1 | c6:2. r:4', vel=96)
    br = s.part('brass', BRASS, rev=.3, role='brass')
    br.write('intro', 'c5+eb5+ab5:4. c5+eb5+ab5:8 d5+f5+bb5:2 | c5+eb5+g5+c6:2. r:4', vel=106)
    br.gen('B', comp, style='stabs', pattern='x.....x.....x...', lo=58, hi=77, vel=92, rootless=False)
    band(s, 'intro A B', bass='pop8', bass_prog=PICKBASS, keys=(BRIGHT, 'pulse8'), guitar=(OVERDRIVE, 'block'), kit=(KIT_ROOM, 'march'), fill='tom', drum_vel=94)
    ti = s.part('timp', TIMPANI, rev=.4, role='perc', vol=2)
    ti.write('A', 'c3:2 r:2 | r:1 | r:1 | r:1 | c3:2 r:2 | r:1 | ab2:2 r:2 | g2:2 g2:2 | f2:2 r:2 | bb2:2 r:2 | eb2:2 r:2 | ab2:2 r:2 | d3:2 r:2 | g2:2 g2:2 | c3:2 r:2 | g2:2 g2:2')
    return s


# ============================================================================ RUINS (Duskmere ruins)
@song('ruins')
def ruins(v):
    s = Song('ruins', bpm=72, title='The Sunken Ruins', room=3.2, reverb=1.3, loudness=-18.5)
    s.section('A', 8, 'Am | Bb/A | Am | Bb/A | Gm/A | Bb/A | Am | E7b9')
    s.section('B', 8, 'Fmaj7 | Gm7 | Am | Am | Dm9 | Bbmaj7 | Gm7 | A7sus4 A7b9')
    ld = s.part('lead', SHAKU, rev=.55, delay=.2); ld.autovib = True
    ld.write('A', 'e5:2 f5:2 | e5:2. d5:4 | c5:2 d5:2 | f5:1 | d5:2 bb4:2 | d5:2 f5:2 | e5:1 | g#4:2 f5:2', vel=86)
    ld.write('B', 'c5:2 e5:2 | d5:2 bb4:2 | a4:2. c5:4 | e5:1 | f5:2 e5:2 | d5:2 f5:2 | bb4:2 d5:2 | d5:2 c#5:2', vel=86)
    kt = s.part('koto', KOTO, rev=.5, role='arp', pan=-.3)
    kt.gen('A B', comp, style='arp', arp='updown8', lo=52, hi=72, vel=64)
    pd = s.part('pad', BOWED, rev=.6, role='pad', width=1.5, layer=[CHOIR])
    pd.gen('A B', pads, lo=48, hi=72, vel=62)
    bs = s.part('bass', CONTRABASS, rev=.2)
    bs.gen('A B', bass_line, style='pedal', vel=84)
    dr = s.drums(kit=KIT_ROOM, rev=.5, vol=-6)
    for sec in ('A', 'B'):
        for b in range(8): dr.write(sec, 'T5:4 r:2 T6:8 T6:8 | ' if b % 2 == 0 else 'T5:4 r:4 T3:8 r:8 T5:4 | ', at=b * 4, strict=False)
    return s


# ============================================================================ STARFALL (postgame)
@song('starfall')
def starfall(v):
    s = Song('starfall', bpm=76, title='Starfall Hollow', room=3.4, reverb=1.3, loudness=-18.5)
    s.section('A', 8, 'F#maj9 | G#/F# | F#maj9 | G#/F# | D#m9 | Bmaj7#11 | G#m9 | C#13sus4 C#13')
    s.section('B', 8, 'Bmaj9 | A#m7 | G#m9 | F#maj7/A# | Bmaj9 | C#6 | D#m9 | C#7sus4')
    ld = s.part('lead', CHOIR, rev=.6, layer=[FLUTE, CELESTA]); ld.autovib = True; ld.layer_gain = .6
    ld.write('A', 'f#5:2 c#6:2 | b#5:1 | a#5:2 g#5:4 f#5:4 | g#5:1 | a#5:2 f#6:2 | d#6:2. c#6:4 | b5:2 a#5:4 f#5:4 | f#5:2 e#5:2', vel=84)
    ld.write('B', 'd#6:2. c#6:8 d#6:8 | c#6:2 a#5:2 | a#5:2 b5:4 d#6:4 | c#6:1 | d#6:2 f#6:2 | e#6:2 c#6:2 | a#5:2. c#6:4 | g#5:1', vel=84)
    hp = s.part('harp', HARP, rev=.6, pan=.3)
    hp.gen('A B', comp, style='arp', arp='updown', lo=54, hi=78, vel=60)
    pd = s.part('pad', HALOPAD, rev=.6, role='pad', width=1.6, layer=[SLOWSTR])
    pd.gen('A B', pads, lo=50, hi=74, vel=62)
    bs = s.part('bass', FRETLESS, rev=.3)
    bs.gen('A B', bass_line, style='pedal', vel=80)
    gl = s.part('bells', BELLS, rev=.7, role='sparkle', delay=.3)
    for (sec, b, n) in [('A', 0, 'f#6'), ('A', 8, 'c#7'), ('A', 16, 'a#6'), ('A', 24, 'g#6'), ('B', 0, 'd#7'), ('B', 8, 'c#7'), ('B', 16, 'f#7'), ('B', 24, 'g#6')]:
        gl.add(s.sec[sec].at + b, 2, note(n), 64)
    return s
