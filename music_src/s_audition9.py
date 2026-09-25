"""Auditions, round 9 (SOLMERE_AUDITION=1): resolve when the tune asks to, and one genre per take.

Round 8: Evening Waltz and Rooftop avoided a tonic the melody had set up ("it ruins that moment ... if the
melody sets up the resolution naturally always do it"); some reharmonisations did not work; Bossa Street
meandered. Asked for quicker notes where a moment wants them, groovier tracks, a different genre per take,
and a reading of Diamond/Pearl piano arrangements (pianoread.py on VGMusic's piano MIDIs: Twinleaf, Sandgem,
the League, HGSS routes: runs of quick notes that land on a held tonic, the tune doubled in 3rds, colour
carried by the chords under a plain line).

  31 Evening Waltz, resolved   round 8's waltz where its lines lead home, fewer reharmonisations (A/B)
  32 Rooftop, resolved         the leading tone now goes home (A/B)
  33 Neon Pier                 city pop / funk groove, F
  34 Keepsake Piano            solo piano, Ab, 72
  35 Plaza Parade              brass march with a trio, Bb
"""
from mfw import *
from s_audition8 import EW_B, EW_CH_B, RT_B, RT_CH_B, RT_BASS_A, RT_ANS_A2


# ============================================================================ 31  EVENING WALTZ, RESOLVED
EW2_A = ('r:4 g5:2 | f5:8 eb5:8 f5:4 bb4:4 | c5:4. d5:8 eb5:4 | d5:2. |'
         'r:4 ab5:2 | g5:8 f5:8 g5:4 c5:4 | d5:4. eb5:8 f5:4 | g5:2. |'
         'r:4 bb5:4 c6:4 | bb5:4. ab5:8 g5:4 | f5:4 g5:4 ab5:4 | c6:2 bb5:4 |'
         'r:4 g5:4 f5:4 | eb5:4. d5:8 c5:4 | bb4:4 c5:4 d5:4 | eb5:2.')
EW2_CH_A = ('Ebmaj7 | Bb/D | Cm9 | G7 | Abmaj7 | Fm9 | Bb7 | Gm7 |'
            'C7 | Fm7 | Bb13 | Abmaj7 | Cm7 | F7 | Bb7 | Ebmaj7')
EW2_CH_A2 = ('Cm9 | Bb/D | Cm9 | G7 | Abmaj7 | Fm9 | Bb7 | Ebmaj7 |'
             'Gm7:2 C7:1 | Fm7 | Bb13 | Abmaj7 | Cm7 | Cm7:2 F7:1 | Bb7 | Ebmaj7')


@song('aud31')
def aud31(v):
    s = Song('aud31', bpm=96, bar=3, title='Audition 31 - Evening Waltz, resolved', room=2.0, key='Eb')
    s.no_push = True
    s.section('I', 2, 'Abmaj7 | Bb7sus4', intro=True)
    s.no_push = True
    s.section('A', 16, EW2_CH_A); s.section('A2', 16, EW2_CH_A2); s.section('B', 8, EW_CH_B)
    s.section('T', 2, 'Abmaj7 | Bb7sus4')
    s.sec['B'].key = 'Eb'
    ld = s.part('lead', OCARINA, rev=.4, delay=.1); ld.autovib = True
    ld.write('A', EW2_A, vel=86); ld.write('A2', EW2_A, vel=88)
    vc = s.part('cello', CELLO, rev=.42, role='lead', pan=-.12); vc.autovib = True
    vc.write('B', EW_B, vel=88)
    hp = s.part('harp', HARP, rev=.4, role='arp', pan=-.25)
    hp.gen('I A A2 B T', comp, style='arp', arp='up8', lo=51, hi=72, vel=34)
    gt = s.part('guitar', NYLON, rev=.3, role='comp', pan=.25)
    gt.gen('A2 B', comp, style='waltz', lo=51, hi=67, n=3, vel=36)
    st = s.part('strings', SLOWSTR, rev=.45, role='pad', width=1.3)
    st.gen('A2 B', pads, lo=55, hi=72, n=3, vel=28, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 B T', bass_line, style='waltz', vel=74)
    return s


# ============================================================================ 32  ROOFTOP, RESOLVED
RT2_A = ('d5:2. e5:4 | g5:4 f#5:4 d5:2 | b4:4. c5:8 d5:4 e5:4 | a4:2. r:4 |'
         'd5:2. e5:4 | b5:4 a5:4 e5:2 | f#5:4. g5:8 a5:4 d5:4 | e5:2. r:4 |'
         'c6:2 b5:4 a5:4 | g5:4. f#5:8 e5:2 | a5:2 g5:4 e5:4 | f#5:2. r:4 |'
         'd5:2. e5:4 | g5:4 f#5:4 g5:2 | a5:4. g5:8 e5:4 d5:4 | e5:2. r:4')
RT2_CH_A = ('Gmaj7 | D/F# | Em7 | D9sus4 | Bm7 | Cmaj7 | D7 | Em7 |'
            'Am9 | D7sus4 D9 | C6 | B7 | Em7 | Am7 D7 G | Am7 D7 | Cmaj7')
RT2_CH_A = RT2_CH_A.replace('Am7 D7 G |', 'Am7:1 D7:1 G:2 |')


@song('aud32')
def aud32(v):
    s = Song('aud32', bpm=96, swing=.52, title='Audition 32 - Rooftop, resolved', room=1.8, key='G')
    s.no_push = True
    s.section('I', 2, 'Cmaj7 | D9sus4', intro=True)
    s.no_push = True
    s.section('A', 16, RT2_CH_A); s.section('A2', 16, RT2_CH_A); s.section('B', 8, RT_CH_B)
    s.section('T', 2, 'Cmaj7 | D9sus4')
    s.sec['B'].key = 'G'
    ld = s.part('lead', FLUTE, rev=.36, delay=.1); ld.autovib = True
    ld.write('A', RT2_A, vel=86); ld.write('A2', RT2_A, vel=88)
    ct = s.part('counter', CLARINET, rev=.4, role='counter', pan=-.2)
    ct.write('A2', RT_ANS_A2, vel=48)
    cl = s.part('clarinet', CLARINET, rev=.4, role='lead', pan=-.1); cl.autovib = True
    cl.write('B', RT_B, vel=86)
    pn = s.part('piano', PIANO, rev=.32, role='comp', pan=.15)
    pn.gen('I A A2 B T', comp, style='pulse4', lo=52, hi=69, n=4, vel=38)
    st = s.part('strings', STRINGS, rev=.45, role='pad', width=1.2)
    st.gen('A2 B', pads, lo=55, hi=72, n=3, vel=28, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 B T', bass_line, style='two', vel=78)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-6)
    dr.gen('A2 B T', groove, name='brush', fills=8, fill='brush', vel=44, crash=False)
    return s


# ============================================================================ 33  NEON PIER (city pop)
# F major, 104, straight 16ths. A syncopated hook with a quick fall (3 2 1 5), repeated notes, one run up
# into the end of the phrase; the band is funk bass, clean guitar chops, e-piano stabs, disco hats. B moves
# to Ab (bIII) and climbs back through a run. The first A ends open on 2, the second resolves home.
NP_A = ('a5:8. g5:16 f5:8 c5:8 r:8 d5:8 f5:4 | e5:4. f5:8 g5:2 | a5:8. g5:16 f5:8 c5:8 r:8 d5:8 f5:8 a5:8 |'
        'c6:4. bb5:8 a5:4 g5:4 | bb5:8 bb5:8 a5:8 g5:8 a5:4 f5:4 | g5:4. e5:8 c5:2 |'
        'd5:8 e5:8 f5:8 g5:8 a5:8 c6:8 bb5:8 a5:8 | g5:2. r:4')
NP_A2 = ('a5:8. g5:16 f5:8 c5:8 r:8 d5:8 f5:4 | e5:4. f5:8 g5:2 | a5:8. g5:16 f5:8 c5:8 r:8 d5:8 f5:8 a5:8 |'
         'c6:4. bb5:8 a5:4 g5:4 | bb5:8 bb5:8 a5:8 g5:8 a5:4 f5:4 | g5:4. e5:8 c5:2 |'
         'd5:8 e5:8 f5:8 g5:8 a5:8 c6:8 bb5:8 a5:8 | g5:8 e5:8 f5:2 r:4')
NP_CH_A = 'Fmaj7 | Em7 A7 | Dm7 | Am7 D7sus4 | Gm7 | C7 | Bbmaj7 C13 | C7sus4'
NP_CH_A2 = 'Fmaj7 | Em7 A7 | Dm7 | Am7 D7sus4 | Gm7 | C7 | Bbmaj7 C13 | Fmaj7'
NP_B = ('c5:4 eb5:8 f5:8 r:8 ab5:8 g5:8 f5:8 | eb5:2. r:4 | c5:4 eb5:8 f5:8 r:8 bb5:8 ab5:8 g5:8 | f5:2. r:4 |'
        'db5:8 db5:8 c5:8 bb4:8 c5:4 ab4:4 | bb4:8 c5:8 db5:8 eb5:8 f5:4 g5:4 | ab5:4. g5:8 f5:4 e5:4 | g5:2. r:4')
NP_CH_B = 'Abmaj7 | Fm7 | Dbmaj7 | Bbm7 Eb7 | Dbmaj7 | Eb7 | Abmaj7 C7 | C7sus4'


@song('aud33')
def aud33(v):
    s = Song('aud33', bpm=104, title='Audition 33 - Neon Pier', room=1.6, key='F')
    s.no_push = True
    s.section('I', 4, 'Bbmaj7 | Am7 | Gm7 | C7sus4', intro=True)
    s.no_push = True
    s.section('A', 8, NP_CH_A); s.section('A2', 8, NP_CH_A2); s.section('B', 8, NP_CH_B)
    s.section('T', 2, 'Gm7 | C7sus4')
    s.sec['B'].key = 'Ab'
    ld = s.part('lead', EPIANO, rev=.28, delay=.1, layer=[VIBES], chorus=.3); ld.layer_gain = .5
    ld.write('A', NP_A, vel=94); ld.write('A2', NP_A2, vel=96); ld.write('B', NP_B, vel=92)
    gt = s.part('guitar', JAZZGTR, rev=.18, role='comp', pan=-.3)
    gt.gen('I A A2 B T', comp, style='offbeat', lo=55, hi=70, n=3, vel=50)
    pn = s.part('keys', EPIANO, rev=.3, role='comp', pan=.3, chorus=.3)
    pn.gen('I A A2 B T', comp, style='stabs', pattern='x..x..x...x.x...', lo=52, hi=70, n=4, vel=46)
    st = s.part('strings', STRINGS, rev=.44, role='pad', width=1.25)
    st.gen('A2 B', pads, lo=57, hi=76, n=3, vel=30, spread=False)
    bs = s.part('bass', FINGERBASS, rev=.05)
    bs.gen('I A A2 B T', bass_line, style='funk', vel=88)
    dr = s.drums(kit=KIT_STD, rev=.14, vol=-3)
    dr.gen('A A2 B T', groove, name='disco', fills=8, fill='snare', vel=72, crash=False, hat_vel=.5)
    return s


# ============================================================================ 34  KEEPSAKE PIANO (solo piano)
# Ab major, 72. Written as a piano piece: the tune in the right hand, broken chords in the left, a low bass
# note on each chord. Each phrase has one quick run; the second half climbs to the top and the leading tone
# resolves home, held. The second time the tune is an octave higher over fuller strings.
KP_A = ('eb5:4. c5:8 ab4:4 bb4:8 c5:8 | db5:2 c5:4 bb4:4 | c5:4. ab4:8 f4:4 g4:8 ab4:8 | bb4:2. r:4 |'
        'eb5:4. f5:8 g5:4 ab5:8 bb5:8 | c6:2 bb5:4 ab5:4 | g5:16 ab5:16 bb5:8 g5:8 f5:8 eb5:4 db5:4 | c5:2. r:4 |'
        'f5:4. eb5:8 c5:4 db5:8 eb5:8 | f5:2 eb5:4 db5:4 | c5:4. db5:8 eb5:4 ab5:4 | g5:2. r:4 |'
        'ab5:4. bb5:8 c6:4 db6:8 c6:8 | bb5:2 ab5:4 f5:4 | eb5:8 f5:8 g5:8 bb5:8 ab5:4 g5:4 | ab5:2. r:4')
KP_CH = ('Abmaj7 | Dbmaj7 | Fm7 | Eb7sus4 | Cm7 | Ab/C | Bbm7 Eb7 | Abmaj7 |'
         'Fm7 | Dbmaj7 | Ab6 | Eb7 | Db6 | Bbm7 | Eb7 | Ab6')
KP_BASS = ('ab1:1 | db2:1 | f1:1 | eb2:1 | c2:1 | c2:1 | bb1:2 eb2:2 | ab1:1 |'
           'f1:1 | db2:1 | ab1:1 | eb2:1 | db2:1 | bb1:1 | eb2:1 | ab1:1')


@song('aud34')
def aud34(v):
    s = Song('aud34', bpm=72, title='Audition 34 - Keepsake Piano', room=2.2, key='Ab')
    s.no_push = True
    s.section('I', 2, 'Dbmaj7 | Eb7sus4', intro=True)
    s.no_push = True
    s.section('A', 16, KP_CH); s.section('A2', 16, KP_CH)
    s.section('T', 2, 'Dbmaj7 | Eb7sus4')
    ld = s.part('lead', PIANO, rev=.36, delay=.04)
    ld.write('A', KP_A, vel=78); ld.write('A2', KP_A, transpose=12, vel=76)
    lh = s.part('left', PIANO, rev=.36, role='arp', pan=-.1)
    lh.gen('I A A2 T', comp, style='arp', arp='up8', lo=44, hi=62, vel=46)
    bs = s.part('bass', PIANO, rev=.36, pan=-.15)
    bs.write('I', 'db2:1 | eb2:1', vel=62); bs.write('A', KP_BASS, vel=62); bs.write('A2', KP_BASS, vel=62)
    bs.write('T', 'db2:1 | eb2:1', vel=62)
    st = s.part('strings', SLOWSTR, rev=.46, role='pad', width=1.3)
    st.gen('A2', pads, lo=53, hi=70, n=3, vel=26, spread=False)
    return s


# ============================================================================ 35  PLAZA PARADE (march)
# Bb major, 116, a town march: dotted rhythms on the beat, trumpet, snare; the first strain ends open on 2,
# its repeat comes home; the trio (Eb, IV, as marches do) is a lyrical clarinet line that resolves there.
PP_A = ('f4:4. f4:8 bb4:4 d5:4 | c5:4. bb4:8 a4:4 bb4:4 | g4:4. a4:8 bb4:4 c5:4 | d5:2. r:4 |'
        'f5:4. eb5:8 d5:4 bb4:4 | c5:4. d5:8 eb5:4 g5:4 | f5:4. d5:8 c5:4 a4:4 | c5:2. r:4')
PP_A2 = ('f4:4. f4:8 bb4:4 d5:4 | c5:4. bb4:8 a4:4 bb4:4 | g4:4. a4:8 bb4:4 c5:4 | d5:2. r:4 |'
         'f5:4. eb5:8 d5:4 bb4:4 | c5:4. d5:8 eb5:4 g5:4 | f5:4. eb5:8 d5:4 c5:4 | bb4:2. r:4')
PP_CH_A = 'Bb | Cm7 F7 | Gm7 | Bb/D | Bb | Cm7 | F7 | F'
PP_CH_A2 = 'Bb | Cm7 F7 | Gm7 | Bb/D | Bb | Cm7 | Bb/F F7 | Bb'
PP_TRIO = ('bb4:2 g4:4 bb4:4 | eb5:2. d5:4 | c5:4 bb4:4 ab4:4 c5:4 | bb4:2. r:4 |'
           'bb4:2 g4:4 bb4:4 | f5:2. eb5:4 | d5:4 c5:4 bb4:4 d5:4 | eb5:2. r:4')
PP_CH_T = 'Eb | Eb | Ab Fm7 | Bb7 | Eb | Bb7 | Bb7 | Eb'


@song('aud35')
def aud35(v):
    s = Song('aud35', bpm=116, title='Audition 35 - Plaza Parade', room=1.6, key='Bb')
    s.no_push = True
    s.section('I', 2, 'F7 | F7', intro=True)
    s.no_push = True
    s.section('A', 8, PP_CH_A); s.section('A2', 8, PP_CH_A2); s.section('B', 8, PP_CH_T)
    s.section('T', 2, 'F7 | F7')
    s.sec['B'].key = 'Eb'
    ld = s.part('lead', TRUMPET, rev=.3, delay=.05); ld.autovib = True
    ld.write('A', PP_A, vel=92); ld.write('A2', PP_A2, vel=94)
    cl = s.part('clarinet', CLARINET, rev=.36, role='lead', pan=-.1); cl.autovib = True
    cl.write('B', PP_TRIO, vel=88)
    pn = s.part('piano', PIANO, rev=.26, role='comp', pan=.18)
    pn.gen('I A A2 B T', comp, style='offbeat', lo=55, hi=70, n=3, vel=48)
    st = s.part('strings', STRINGS, rev=.4, role='pad', width=1.2)
    st.gen('B', pads, lo=55, hi=72, n=3, vel=32, spread=False)
    bs = s.part('bass', ACBASS, rev=.06)
    bs.gen('I A A2 B T', bass_line, style='two', vel=86)
    dr = s.drums(kit=KIT_STD, rev=.14, vol=-3)
    dr.gen('A A2 B T', groove, name='march', fills=8, fill='snare', vel=70, crash=False)
    return s
