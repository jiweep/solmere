"""Town music (most with day/night arrangements)."""
from mfw import *
from motifs import TIDE, CRANE


# ============================================================================ BRINEHOLLOW (hometown)
# Bb major, 100, gentle 16th swing. Nylon guitar, flute, soft piano; the iv-minor (Ebm6) sigh in
# bar 12 is the "home" feeling that returns in the credits.
BRINE_A = ('f5:4 bb5:4. c6:8 d6:4 | a5:2. f5:4 | g5:4 bb5:4. c6:8 d6:4 | c6:2 a5:2 | f5:4 a5:4. g5:8 f5:4 | d5:2. bb4:4 | eb5:4 g5:4 d5:4 eb5:4 | f5:2 r:4 f5:4 |'
           'f5:4 bb5:4. c6:8 d6:4 | f6:2. ab5:4 | g5:4 bb5:4 eb6:4 d6:4 | gb5:2. c5:4 | f5:4. a5:8 d6:4 c6:4 | b5:4. ab5:8 f5:4 d5:4 | eb5:4 d5:4 a5:4 d6:4 | bb5:2. r:4')
BRINE_CH_A = 'Bbmaj9 | Gm9 | Ebmaj9 | F13sus4 F13 | Dm7 | Gm7 | Cm9 | F7sus4 F7 | Bbmaj9 | Bb7 | Ebmaj7 | Ebm6 | Dm7 | G7b9 | Cm9 F13 | Bb6'


@song('brinehollow', variants=('day', 'night'))
def brinehollow(v):
    night = v == 'night'
    s = Song('brinehollow', bpm=100, swing16=.56, title='Brinehollow', room=1.9)
    s.section('A', 16, BRINE_CH_A)
    s.section('B', 8, 'Ebmaj9 | Dm7 | Cm9 | Bbmaj7 | Ebmaj9 | Dm7 G7 | Cm9 | F7sus4')
    ld = s.part('lead', FLUTE if not night else OCARINA, rev=.34, delay=.12); ld.autovib = True
    ld.write('A', BRINE_A, vel=88)
    gl = s.part('glock', GLOCK if not night else MUSICBOX, rev=.45, role='sparkle')
    gl.write('A', BRINE_A, transpose=12, vel=62)
    cl = s.part('lead2', CLARINET if not night else HORN, rev=.36, role='lead'); cl.autovib = True
    cl.write('B', 'bb5:2. g5:8 bb5:8 | c6:2 a5:4 f5:4 | g5:2. d5:4 | f5:1 | g5:2. bb5:8 d6:8 | c6:4 a5:4 b5:4 f5:4 | eb5:4 g5:4 bb5:4 d6:4 | c6:2. bb5:4', transpose=-12, vel=86)
    band(s, 'A B', night, bass='two', bass_prog=ACBASS, nbass='two', nbass_prog=ACBASS, keys=(PIANO, 'charleston'), nkeys=(EPIANO, 'block'),
         guitar=(NYLON, 'arp'), nguitar=(NYLON, 'arp'), kit=(KIT_BRUSH, 'soft'), nkit=(KIT_BRUSH, 'soft'), fills=8, drum_vel=80)
    return s


# ============================================================================ FERNWICK
@song('fernwick', variants=('day', 'night'))
def fernwick(v):
    night = v == 'night'
    s = Song('fernwick', bpm=116, title='Fernwick Town', room=1.8)
    s.section('A', 16, 'Fmaj9 | Fmaj9 | Gm9 | C13 | Am7 | D7b9 | Gm9 | C7sus4 C7 | Fmaj9 | F7 | Bbmaj7 | Bbm6 | Am7 | Abdim7 | Gm9 C13 | Fmaj9')
    s.section('B', 8, 'Dm9 | G13 | Cmaj9 | A7alt | Dm9 | G13 | Gm9 | C7sus4')
    mA = ('a5:4. g5:8 a5:4 c6:4 | e5:2. g5:4 | bb5:4. a5:8 bb5:4 d6:4 | e5:2. a5:4 | c6:4. b5:8 c6:4 e6:4 | f#5:2. eb6:4 | d6:4. c6:8 bb5:4 a5:4 | f5:2 e5:2 |'
          'a5:4. g5:8 a5:4 c6:4 | eb6:2. c6:4 | d6:4. c6:8 bb5:4 f5:4 | db6:2. g5:4 | c6:4. b5:8 a5:4 e5:4 | f5:2. b5:4 | bb5:4 a5:4 e5:4 g5:4 | f5:2. r:4')
    ld = s.part('lead', FLUTE if not night else VIBES, rev=.32, delay=.1); ld.autovib = True
    ld.write('A', mA, vel=88)
    cl = s.part('lead2', CLARINET if not night else FLUTE, rev=.34, role='lead'); cl.autovib = True
    cl.write('B', 'f5:2. e5:8 f5:8 | e5:2 b4:4 d5:4 | d5:2. e5:4 | c#5:2 bb4:4 g4:4 | a5:2. e5:8 f5:8 | e5:2 f5:4 b5:4 | a5:2 bb5:4 d6:4 | c6:2. bb5:4', vel=86)
    mb = s.part('marimba', MARIMBA, rev=.3, role='arp', pan=.3)
    mb.gen('A', ostinato, pattern='0 . 1 2 . 1 3 .', lo=64, vel=64, rate=.5)
    band(s, 'A B', night, bass='bossa', bass_prog=ACBASS, nbass='bossa', nbass_prog=FRETLESS, keys=(None, None), nkeys=(EPIANO, 'block'),
         guitar=(NYLON, 'bossa'), nguitar=(NYLON, 'bossa'), kit=(KIT_STD, 'bossa'), nkit=(KIT_BRUSH, 'bossa'), fills=8, drum_vel=82)
    return s


# ============================================================================ GALVAN CITY (big band)
@song('galvan', variants=('day', 'night'))
def galvan(v):
    night = v == 'night'
    s = Song('galvan', bpm=152, swing=.64, title='Galvan City', room=1.6)
    A = 'Ebmaj7 C7 | Fm7 Bb7 | Gm7 C7 | Fm7 Bb7 | Ebmaj7 Eb7 | Abmaj7 Db9 | Gm7 C7b9 | Fm7 Bb7'
    A2 = 'Ebmaj7 C7 | Fm7 Bb7 | Gm7 C7 | Fm7 Bb7 | Ebmaj7 Eb7 | Abmaj7 Db9 | Fm7 Bb7 | Eb6'
    s.section('A', 8, A); s.section('A2', 8, A2)
    s.section('B', 8, 'G7 | G7 | C7 | C7 | F7 | F7 | Bb7 | Bb7alt')
    s.section('A3', 8, A2)
    head = ('g5:8 bb5:8 d6:8 bb5:8 g5:4 e5:4 | f5:8 ab5:8 c6:8 ab5:8 d6:4 bb5:4 | bb5:4. g5:8 bb5:4 e5:4 | ab5:2 r:8 f5:8 g5:8 ab5:8 |'
            'bb5:4. g5:8 db6:4 bb5:4 | c6:4. ab5:8 b5:4 eb6:4 | bb5:4 g5:4 db6:4 bb5:4 | ab5:4 f5:4 d5:4 bb4:4')
    head2 = head.rsplit('|', 2)[0] + '| ab5:4 c6:4 d6:4 f6:4 | eb6:2. r:4'
    ld = s.part('lead', TRUMPET if not night else MUTETPT, rev=.24, delay=.06); ld.autovib = True
    ld.write('A', head, vel=100 if not night else 88); ld.write('A2', head2, vel=100 if not night else 88)
    ld.write('B', 'b5:4. d6:8 f6:4 d6:4 | b5:2. r:8 g5:8 | e5:4. g5:8 bb5:4 g5:4 | e5:2. r:8 c6:8 | a5:4. c6:8 eb6:4 c6:4 | a5:2. r:8 f5:8 | d5:4. f5:8 ab5:4 f5:4 | d5:4 cb5:4 ab4:4 gb4:4', vel=96 if not night else 86)
    sx = s.part('sax', ALTOSAX if not night else VIBES, rev=.24, role='counter', pan=-.2); sx.autovib = not night
    sx.write('A2', head2, transpose=-12, vel=84)
    br = s.part('shout', BRASS if not night else HORN, rev=.26, role='brass' if not night else 'counter', layer=[TROMBONE] if not night else [])
    harm(br, s.sec['A3'], 'bb5:8 bb5:8 r:8 bb5:8 r:8 g5:8 bb5:4 | c6:8 c6:8 r:8 c6:8 r:8 ab5:8 d6:4 | d6:4. bb5:8 e6:4 c6:4 | c6:2 ab5:4 f5:4 |'
                         'g5:8 bb5:8 d6:8 g6:8 r:8 f6:8 db6:4 | c6:4. eb6:8 f6:4 cb6:4 | ab5:4 c6:4 d6:4 f6:4 | eb6:2. r:4', n=4, vel=104 if not night else 80)
    ld.write('A3', 'r:1 | r:1 | r:1 | r:1 | r:1 | r:1 | r:1 | r:1', vel=10)
    band(s, 'A A2 B A3', night, bass='walk', bass_prog=ACBASS, nbass='walk', nbass_prog=ACBASS, keys=(PIANO, 'swingcomp'), nkeys=(PIANO, 'swingcomp'),
         guitar=(JAZZGTR, 'pulse4'), nguitar=None, pad=None, npad=WARMPAD, kit=(KIT_JAZZ, 'ride'), nkit=(KIT_BRUSH, 'brush'), fills=8, fill='triplet', drum_vel=92)
    return s


# ============================================================================ CINDERVALE (hot-spring town)
@song('cindervale', variants=('day', 'night'))
def cindervale(v):
    night = v == 'night'
    s = Song('cindervale', bpm=96, swing16=.6, title='Cindervale', room=1.8)
    s.section('A', 16, 'Dbmaj9 | Cm7 | Bbm9 | Ebm9 Ab13 | Dbmaj9 | Cm7 F7b9 | Bbm9 | Eb13sus4 Eb13 | Gbmaj9 | F7alt | Bbm9 | Ab6 | Gbmaj9 | F7alt | Bbm9 Eb13 | Ab13sus4 Ab13')
    s.section('B', 8, 'Gbmaj7 | Fm7 | Ebm9 | Ab13 | Dbmaj7 | Bbm9 | Ebm9 | Ab7sus4')
    mA = ('f5:4. eb5:8 ab5:4 c6:4 | bb5:2. g5:4 | db6:4. c6:8 bb5:4 f5:4 | gb5:4 f5:4 f5:4 c6:4 | ab5:4. f5:8 eb6:4 c6:4 | bb5:4 g5:4 a5:4 gb5:4 | f5:2. db5:4 | ab5:2 g5:2 |'
          'bb5:4. ab5:8 f5:4 db5:4 | a5:4. gb5:8 eb5:4 db5:4 | c6:2. bb5:4 | f5:1 | db6:4. bb5:8 ab5:4 f5:4 | eb5:4. a5:8 gb5:4 db6:4 | db5:4 f5:4 g5:4 c6:4 | db6:2 c6:2')
    ld = s.part('lead', ALTOSAX if not night else FLUTE, rev=.28, delay=.1); ld.autovib = True
    ld.write('A', mA, vel=92 if not night else 84)
    hn = s.part('horns', BRASS if not night else HORN, rev=.3, role='lead', layer=[TROMBONE] if not night else []); hn.autovib = True
    harm(hn, s.sec['B'], 'bb5:2. ab5:8 bb5:8 | ab5:2 f5:2 | gb5:2. f5:4 | f5:2 c5:2 | f5:2. ab5:4 | c6:2 db6:2 | bb5:2. gb5:4 | db6:2. r:4', n=3, vel=88 if not night else 76)
    band(s, 'A B', night, bass='funk', bass_prog=FINGERBASS, nbass='two', nbass_prog=FRETLESS, keys=(EPIANO, 'swingcomp'), nkeys=(EPIANO, 'block'),
         guitar=(MUTEDGTR, 'stabs'), nguitar=None, pad=WARMPAD, npad=WARMPAD, kit=(KIT_STD, 'ballad'), nkit=(KIT_BRUSH, 'soft'), fills=8, drum_vel=82)
    s.parts['bass'].notes = []
    s.parts['bass'].gen('A B', bass_line, style='funk' if not night else 'two', pattern='x...x.x...x..x..', vel=94, lo=28, hi=50)
    return s


# ============================================================================ DUSKMERE (always dusk)
@song('duskmere')
def duskmere(v):
    s = Song('duskmere', bpm=120, bar=3, title='Duskmere', room=2.2, reverb=1.1, loudness=-18.0)
    s.section('A', 16, 'Cm9 | Cm9 | Abmaj7 | Abmaj7 | Fm9 | Fm9 | Dm7b5 | G7b9 | Cm9 | Cm9/Bb | Abmaj7 | Am7b5 | Fm9 | G7alt | Cm9 | Cm9')
    s.section('B', 8, 'Ebmaj7 | Ebmaj7 | Abmaj7 | Abmaj7 | Dm7b5 | G7 | Cm9 | G7alt')
    ld = s.part('lead', CLARINET, rev=.36, delay=.12); ld.autovib = True
    ld.write('A', 'g4:4 c5:4 d5:4 | eb5:2. | c5:4 eb5:4 g5:4 | f5:2 eb5:4 | ab5:4. g5:8 f5:4 | c5:2. | ab5:4 f5:4 d5:4 | b4:2 ab4:4 |'
                  'g4:4 c5:4 d5:4 | eb5:4. f5:8 g5:4 | c6:2 bb5:4 | c6:4 a5:4 eb5:4 | ab5:2 g5:4 | f5:4 eb5:4 b4:4 | c5:2. | r:2.', vel=86)
    vb = s.part('vibes', VIBES, rev=.4, role='lead')
    vb.write('B', 'g5:4 bb5:4 d6:4 | c6:2 bb5:4 | eb6:4 c6:4 g5:4 | bb5:2. | c6:4 ab5:4 f5:4 | b5:2 d6:4 | eb6:4. d6:8 c6:4 | b5:2.', vel=86)
    pn = s.part('piano', PIANO, rev=.32, pan=-.2, role='comp')
    pn.gen('A B', comp, style='waltz', lo=52, hi=72, vel=58)
    bs = s.part('bass', ACBASS, rev=.08); bs.gen('A B', bass_line, style='waltz', vel=84)
    st = s.part('strings', SLOWSTR, rev=.45, role='pad', vol=-3); st.gen('A B', pads, lo=52, hi=74, vel=54)
    dr = s.drums(kit=KIT_BRUSH, rev=.25, vol=-3)
    dr.gen('A B', groove, name='waltz', fills=8, fill='brush', vel=70, crash=False, hat_vel=.4)
    rn = s.part('rain', RAIN, rev=.6, role='fx', vol=-4)
    rn.gen('A B', pads, lo=72, hi=88, n=2, vel=40)
    return s


# ============================================================================ FROSTPEAK (snow town)
@song('frostpeak', variants=('day', 'night'))
def frostpeak(v):
    night = v == 'night'
    s = Song('frostpeak', bpm=92, title='Frostpeak', room=2.4, reverb=1.1)
    s.section('A', 16, 'Emaj9 | C#m9 | Amaj9 | B13sus4 B13 | G#m7 | C#m9 | F#m9 | B7sus4 B7 | Emaj9 | E7 | Amaj7 | Am6 | G#m7 | C#7b9 | F#m9 B13 | E6')
    s.section('B', 8, 'Amaj9 | G#m7 | F#m9 | Emaj7 | Amaj9 | G#m7 C#7 | F#m9 | B7sus4')
    mA = ('b4:4 e5:4. f#5:8 g#5:4 | d#5:2. b4:4 | c#5:4 e5:4. f#5:8 g#5:4 | e5:2 d#5:2 | b5:4. a#5:8 g#5:4 d#5:4 | e5:2. g#5:4 | a5:4 g#5:4 f#5:4 c#5:4 | e5:2 d#5:2 |'
          'b4:4 e5:4. f#5:8 g#5:4 | d6:2. b5:4 | c#6:4 e6:4 g#5:4 a5:4 | c6:2. f#5:4 | b5:4. d#6:8 f#6:4 d#6:4 | e#6:4. d6:8 b5:4 g#5:4 | a5:4 g#5:4 g#5:4 d#5:4 | e5:2. r:4')
    ld = s.part('lead', FLUTE if not night else CELESTA, rev=.4, delay=.12); ld.autovib = True
    ld.write('A', mA, vel=86)
    cl = s.part('celesta', CELESTA if not night else MUSICBOX, rev=.5, role='sparkle')
    cl.write('A', mA, transpose=12, vel=62)
    hn = s.part('lead2', HORN if not night else CLARINET, rev=.42, role='lead', layer=[STRINGS]); hn.autovib = True
    hn.write('B', 'c#6:2. b5:8 c#6:8 | b5:2 f#5:4 d#5:4 | a5:2. g#5:4 | g#5:1 | e6:2. c#6:4 | b5:4 d#6:4 e#6:4 b5:4 | a5:4 c#6:4 e6:4 g#6:4 | f#6:2. r:4', transpose=-12, vel=86)
    band(s, 'A B', night, bass='two', bass_prog=ACBASS, nbass='pedal', nbass_prog=FRETLESS, keys=(HARP, 'arp'), nkeys=(HARP, 'arp'),
         pad=STRINGS, npad=SLOWSTR, kit=(KIT_BRUSH, 'soft'), nkit=(KIT_BRUSH, 'soft'), fills=8, drum_vel=74, keys_range=(52, 76))
    sl = s.drums('bells', kit=KIT_STD, role='perc', rev=.3)
    if not night: sl.gen('A B', groove, name='none', fills=0, crash=False, extra=dict(tam='x-x-x-x-x-x-x-x-', tri='x---------------'), vel=56)
    return s


# ============================================================================ SKYREACH
@song('skyreach', variants=('day', 'night'))
def skyreach(v):
    night = v == 'night'
    s = Song('skyreach', bpm=124, title='Skyreach', room=2.0)
    s.section('intro', 2, 'Fmaj9 | G6', intro=True)
    s.section('A', 16, 'Amaj9 | E/G# | F#m9 | Dmaj9 | Bm11 | E13 | C#m7 | F#m9 | Dmaj9 | E6 | C#m7 | F#m7 | Bm9 | E13 | Dmaj7 E7sus4 | Amaj9')
    s.section('B', 8, 'Fmaj9 | G6 | Amaj9 | Amaj9 | Fmaj9 | G6 | Bm7 | E7sus4 E7')
    ld = s.part('lead', HORN if not night else FLUTE, rev=.34, layer=[TRUMPET] if not night else [VIBES], delay=.1); ld.autovib = True; ld.layer_gain = .6
    ld.write('A', 'e5:4 a5:4. b5:8 c#6:4 | b5:2. g#5:4 | a5:4 c#6:4. b5:8 a5:4 | f#5:2. e5:4 | d5:4 f#5:4 a5:4 e6:4 | d6:2. c#6:4 | b5:4. g#5:8 e5:4 c#5:4 | g#5:2. r:4 |'
                  'f#5:4 a5:4. c#6:8 e6:4 | e6:2 c#6:4 b5:4 | b5:4. c#6:8 e6:4 b5:4 | a5:2. c#6:4 | d6:4. c#6:8 b5:4 f#5:4 | g#5:4 b5:4 c#6:4 d6:4 | c#6:4 a5:4 a5:4 b5:4 | a5:2. r:4', vel=94)
    ld.write('B', 'a5:4. g5:8 a5:4 c6:4 | b5:4. a5:8 b5:4 e6:4 | c#6:1 | b5:2 e6:2 | a5:4. c6:8 f6:4 e6:4 | d6:4. b5:8 g5:4 e5:4 | f#5:4 a5:4 d6:4 f#6:4 | e6:2 d6:4 g#5:4', vel=100)
    br = s.part('brass', BRASS if not night else HORN, rev=.3, role='brass', vol=0 if not night else -4)
    br.write('intro', 'f4+a4+c5+e5:2. f4+a4+c5+g5:4 | g4+b4+d5+e5:2. g4+b4+d5+a5:4', vel=100 if not night else 76)
    sq = s.part('arpsynth', SQUARELEAD if not night else CELESTA, rev=.35, role='arp', delay=.15)
    sq.gen('A B', ostinato, pattern='0 1 2 3 2 1 2 3', lo=64, vel=60, rate=.25 if not night else .5)
    band(s, 'intro A B', night, bass='pop8', bass_prog=FINGERBASS, nbass='two', nbass_prog=FRETLESS, keys=(BRIGHT, 'offbeat'), nkeys=(EPIANO, 'block'),
         kit=(KIT_STD, 'disco'), nkit=(KIT_JAZZ, 'ballad'), fills=8, fill='tom', drum_vel=88)
    return s


# ============================================================================ TIDELIGHT ISLE (the climax)
@song('tidelight')
def tidelight(v):
    s = Song('tidelight', bpm=132, title='Tidelight Isle — The Storm', room=2.2, loudness=-16.0)
    s.section('intro', 2, 'Em | Cmaj7#11', intro=True)
    s.section('A', 16, 'Em | Em | Cmaj7#11 | Cmaj7#11 | Am9 | Am9 | B7sus4 | B7alt | Em | D/E | Cmaj7/E | Bm7/E | Am9 | Cmaj7#11 | F#m7b5 | B7alt')
    s.section('B', 8, 'Cmaj7#11 | D6 | Em9 | Em9 | Cmaj7#11 | D6 | F#m7b5 | B7alt')
    ld = s.part('lead', HORN, rev=.4, layer=[STRINGS, TRUMPET]); ld.autovib = True; ld.layer_gain = .7
    ld.write('A', 'e5:2 b5:2 | a#5:4. b5:8 g5:2 | b5:2 f#5:2 | g5:1 | e5:4 a5:4 b5:4 c6:4 | b5:2. a5:4 | e5:2 a5:2 | d#5:1 |'
                  'e5:2 b5:2 | a5:4. g5:8 f#5:2 | g5:4 e5:4 b5:4 e6:4 | d6:2. b5:4 | c6:4 b5:4 a5:4 e5:4 | f#5:2 g5:2 | a5:2 c6:2 | d#6:2. r:4', transpose=-12, vel=100)
    ch = s.part('choir', CHOIR, rev=.55, role='lead', layer=[VIOLIN]); ch.autovib = True
    ch.write('B', 'e5:2 b5:2 | a5:1 | g5:2 f#5:4 e5:4 | f#5:1 | g5:2 b5:2 | a5:2 f#5:2 | a5:2 c6:2 | d#6:1', vel=96)
    so = s.part('ost', STRINGS, rev=.3, role='comp', pan=-.25, width=1.3)
    so.gen('intro A B', ostinato, pattern='0 1 2 1 0 1 2 3', lo=59, vel=78)
    battle_like = s.part('bass', CONTRABASS, rev=.1, layer=[FINGERBASS])
    battle_like.gen('intro A B', bass_line, style='drive', vel=96, lo=28, hi=50)
    tk = s.part('taiko', TAIKO, rev=.35, role='perc', vol=4)
    for b in range(16): tk.write('A', 'e2:4 r:8 e2:8 e2:4 r:4', at=b * 4, strict=False)
    ti = s.part('timp', TIMPANI, rev=.4, role='perc', vol=2)
    roll(ti, s.sec['intro'], 4, 4, 'b2', 40, 120); roll(ti, s.sec['B'], 28, 4, 'b2', 40, 124)
    dr = s.drums(kit=KIT_ORCH, rev=.3)
    dr.gen('A', groove, name='halftime', fills=4, fill='tom', vel=96, crash_every=4)
    dr.gen('B', groove, name='march', fills=4, fill='roll', vel=96)
    pd = s.part('pad', SLOWSTR, rev=.5, role='pad'); pd.gen('intro A B', pads, lo=50, hi=74, vel=64)
    return s


@song('lighthouse')
def lighthouse(v):
    s = Song('lighthouse', bpm=140, title='The Tidelight — Ascent', room=2.4, loudness=-16.0)
    s.section('A', 8, 'Bm | Bm | G/B | G/B | Em/B | Em/B | F#7/A# | F#7alt')
    s.section('B', 8, 'Gmaj7#11 | A6 | Bm9 | Bm9 | Gmaj7#11 | A6 | C#m7b5 | F#7alt')
    s.section('C', 8, 'Bm | C | Bm | C | Am | Bb | Gmaj7 | F#7')
    cr = s.part('lead', SYNBRASS, rev=.28, layer=[HORN]); cr.autovib = True
    cr.write('A', 'b4:4 a#4:8 b4:8 d5:4 c#5:4 | c5:2 b4:2 | b4:4 a#4:8 b4:8 d5:4 e5:4 | f#5:2 d5:2 | e5:4 d#5:8 e5:8 g5:4 f#5:4 | f5:2 e5:2 | c#5:4. e5:8 g5:4 a#5:4 | c#6:2 a#5:2', vel=98)
    hn = s.part('tide', HORN, rev=.45, role='lead', layer=[CHOIR, STRINGS]); hn.autovib = True
    hn.write('B', 'b4:2 f#5:2 | e#5:1 | d5:2 c#5:4 b4:4 | c#5:1 | b4:2 f#5:2 | a5:2. e5:4 | g5:2 e5:4 c#5:4 | a#4:1', vel=96)
    cr.write('C', 'f#5:8 f#5:8 r:8 f#5:8 b5:8 f#5:8 d6:4 | g5:8 g5:8 r:8 g5:8 c6:8 g5:8 e6:4 | f#5:8 f#5:8 r:8 f#5:8 d6:8 b5:8 f#6:4 | g6:4. e6:8 c6:4 g5:4 |'
                  'e5:8 e5:8 r:8 e5:8 a5:8 e5:8 c6:4 | f5:8 f5:8 r:8 f5:8 bb5:8 f5:8 d6:4 | b5:4 g5:4 d6:4 b5:4 | a#5:4 c#6:4 e6:4 f#6:4', vel=102)
    so = s.part('ost', STRINGS, rev=.3, role='comp', pan=-.25, width=1.3)
    so.gen('A B C', ostinato, pattern='0 1 2 1 3 2 1 2', lo=59, vel=76)
    bs = s.part('bass', SYNBASS, rev=.06, layer=[CONTRABASS]); bs.gen('A B C', bass_line, style='drive', vel=96, lo=28, hi=50)
    dr = s.drums(kit=KIT_ROOM, rev=.22)
    dr.gen('A', groove, name='halftime', fills=4, fill='tom', vel=92)
    dr.gen('B', groove, name='soft', fills=8, fill='roll', vel=86)
    dr.gen('C', groove, name='battle', fills=4, fill='tom', vel=98, crash_every=4)
    pd = s.part('pad', CHOIR, rev=.55, role='pad', vol=-3); pd.gen('A B C', pads, lo=52, hi=74, vel=62)
    return s


@song('tidelight_calm')
def tidelight_calm(v):
    s = Song('tidelight_calm', bpm=84, title='Tidelight Isle — After the Storm', room=2.8, reverb=1.25, loudness=-18.0)
    s.section('A', 8, 'Emaj9 | F#/E | Emaj9 | F#/E | C#m9 | Amaj9 | F#m9 | B13sus4 B13')
    s.section('B', 8, 'Amaj9 | G#m7 | F#m9 | Emaj7/G# | Amaj9 | B6 | C#m9 | B7sus4')
    ld = s.part('lead', FLUTE, rev=.5, delay=.18, layer=[CELESTA]); ld.autovib = True; ld.layer_gain = .5
    ld.write('A', 'e5:2 b5:2 | a#5:1 | g#5:2 f#5:4 e5:4 | f#5:1 | g#5:2 d#6:2 | c#6:2. b5:4 | a5:2 g#5:4 e5:4 | e5:2 d#5:2', vel=84)
    st = s.part('strlead', VIOLIN, rev=.5, role='lead', layer=[STRINGS]); st.autovib = True
    st.write('B', 'c#6:2. b5:8 c#6:8 | b5:2 d#6:2 | a5:2 g#5:4 f#5:4 | g#5:1 | e6:2 c#6:2 | d#6:2 f#6:2 | e6:2. d#6:4 | c#6:2 b5:2', vel=84)
    hp = s.part('harp', HARP, rev=.55, pan=.3); hp.gen('A B', comp, style='arp', arp='updown', lo=52, hi=76, vel=60)
    pd = s.part('pad', CHOIR, rev=.6, role='pad', layer=[SLOWSTR]); pd.gen('A B', pads, lo=50, hi=74, vel=58)
    bs = s.part('bass', FRETLESS, rev=.25); bs.gen('A B', bass_line, style='pedal', vel=78)
    return s
