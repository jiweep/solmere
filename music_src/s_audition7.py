"""Hometown-theme auditions, round 7 (SOLMERE_AUDITION=1): written by ear.

Round 6: "the marimba movement is too much and cheesy ... scrap that. but the overall composition is
better, the melodies sometimes clash and odd note choice, along with resolving in unnatural ways on the chord
tones ... forced sounding, and sometimes the harmony with itself." Asked to read all the reference leads and
then "fully intuit" the tunes. So these were written after reading ~60 leads whole (leads.py over Platinum,
HGSS, Emerald, FRLG, Undertale), melody and chords together, by feel, and only obvious clashes were
corrected afterwards. The band is quiet: a composed bass, soft comping, a pad, and a low counterline that
speaks only where the tune holds.

  25 Morning Tide   F, 100, light swing, flute
  26 Little Waltz   D, 3/4, ocarina
  27 Bossa Lane     G, bossa, flute
"""
from mfw import *


# ============================================================================ 25  MORNING TIDE
MT_CH_A = 'Fmaj7 | Bbmaj7 | Gm7 | C7 | Fmaj7 | Dm7 | Bbmaj7 C7 | Fmaj7'
MT_CH_B = 'Dm7 | Bbmaj7 | Gm7 | A7 | Dm7 | Bbmaj7 | Gm7 | C7'
MT_A = ('a4:4 c5:8 f5:8 e5:4. c5:8 | d5:2 r:8 c5:8 bb4:8 a4:8 | bb4:4. a4:8 g4:4 d5:4 | c5:2. r:4 |'
        'a4:4 c5:8 f5:8 g5:4. f5:8 | a5:2 r:8 g5:8 f5:8 e5:8 | d5:4. c5:8 bb4:4 e5:4 | f5:2. r:4')
MT_A2 = ('a4:4 c5:8 f5:8 e5:4. c5:8 | d5:2 r:8 c5:8 bb4:8 a4:8 | bb4:4. a4:8 g4:4 d5:4 | c5:2. r:4 |'
         'a4:4 c5:8 f5:8 g5:4. a5:8 | c6:2 r:8 bb5:8 a5:8 g5:8 | f5:4. d5:8 c5:4 e5:4 | f5:2. r:4')
MT_B = ('r:8 a4:8 d5:8 e5:8 f5:4 e5:4 | d5:2. r:4 | r:8 g4:8 bb4:8 c5:8 d5:4 c5:4 | c#5:2. r:4 |'
        'r:8 a4:8 d5:8 e5:8 f5:4 g5:4 | a5:2 g5:4 f5:4 | bb4:4. c5:8 d5:4 f5:4 | e5:2. r:4')
MT_CT_A2 = 'r:1 | r:1 | r:1 | r:4 e4:4 f4:4 g4:4 | r:1 | r:1 | r:1 | r:4 a3:4 c4:4 e4:4'
MT_CT_B = 'r:1 | r:1 | r:1 | r:4 e4:4 g4:4 a4:4 | r:1 | r:1 | r:1 | r:1'
MT_BASS_A = 'f2:2 c3:2 | bb1:2 d2:2 | g1:2 bb1:4 b1:4 | c2:2 e2:2 | f2:2 c3:2 | d2:2 a1:2 | bb1:2 c2:2 | f2:2 c2:2'
MT_BASS_B = 'd2:2 a1:2 | bb1:2 f2:2 | g1:2 d2:2 | a1:2 c#2:2 | d2:2 a1:2 | bb1:2 f2:2 | g1:2 d2:2 | c2:2 e2:2'


@song('aud25')
def aud25(v):
    s = Song('aud25', bpm=100, swing=.56, title='Audition 25 - Morning Tide', room=1.8, key='F')
    s.no_push = True
    s.section('I', 2, 'Gm7 | C7', intro=True)
    s.no_push = True
    s.section('A', 8, MT_CH_A); s.section('A2', 8, MT_CH_A); s.section('B', 8, MT_CH_B)
    s.section('T', 2, 'Gm7 | C7')
    s.sec['B'].key = 'F'
    ld = s.part('lead', FLUTE, rev=.34, delay=.1); ld.autovib = True
    ld.write('A', MT_A, vel=86); ld.write('A2', MT_A2, vel=88); ld.write('B', MT_B, vel=86)
    ct = s.part('counter', CLARINET, rev=.4, role='counter', pan=-.2)
    ct.write('A2', MT_CT_A2, vel=48); ct.write('B', MT_CT_B, vel=48)
    pn = s.part('piano', PIANO, rev=.3, role='comp', pan=.15)
    pn.gen('I A A2 B T', comp, style='pulse4', lo=53, hi=69, n=4, vel=40)
    st = s.part('strings', STRINGS, rev=.45, role='pad', width=1.2)
    st.gen('A2 B', pads, lo=55, hi=72, n=3, vel=30, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.write('I', 'g1:2 d2:2 | c2:2 e2:2', vel=80)
    bs.write('A', MT_BASS_A, vel=82); bs.write('A2', MT_BASS_A, vel=82); bs.write('B', MT_BASS_B, vel=80)
    bs.write('T', 'g1:2 d2:2 | c2:2 e2:2', vel=80)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-5)
    dr.gen('A A2 B T', groove, name='brush', fills=8, fill='brush', vel=48, crash=False)
    return s


# ============================================================================ 26  LITTLE WALTZ
LW_CH_A = ('Dmaj7 | Bm7 | Em7 | A7 | Dmaj7 | Gmaj7 | Em7 | A7sus4:2 A7:1 |'
           'F#m7 | Bm7 | Gmaj7 | Em7:2 A7:1 | Dmaj7 | Bm7 | Em7:2 A7:1 | D6')
LW_CH_B = 'Gmaj7 | F#m7 | Em7 | A7 | Gmaj7 | F#7 | Bm7 | Em7:2 A7:1'
LW_A = ('r:8 a4:8 d5:4. e5:8 | f#5:2 e5:4 | d5:4. b4:8 d5:4 | c#5:2. |'
        'r:8 a4:8 f#5:4. e5:8 | d5:2 b4:4 | g5:4 f#5:4 e5:4 | e5:2. |'
        'r:8 c#5:8 f#5:4. e5:8 | d5:2 c#5:4 | b4:4. a4:8 b4:4 | e5:2 c#5:4 |'
        'r:8 a4:8 d5:4. f#5:8 | a5:2 f#5:4 | g5:4. f#5:8 e5:4 | d5:2.')
LW_A2 = ('r:8 a4:8 d5:4. e5:8 | f#5:2 e5:4 | d5:4. b4:8 d5:4 | c#5:2. |'
         'r:8 a4:8 f#5:4. e5:8 | d5:2 b4:4 | g5:4 f#5:4 e5:4 | e5:2. |'
         'r:8 c#5:8 f#5:4. e5:8 | d5:2 c#5:4 | b4:4. a4:8 b4:4 | e5:2 c#5:4 |'
         'r:8 a4:8 d5:4. f#5:8 | b5:2 a5:4 | g5:4 e5:4 c#5:4 | d5:2.')
LW_B = 'b3:2 d4:4 | c#4:2 a3:4 | g3:2 b3:4 | c#4:2. | d4:2 f#4:4 | e4:2 a#3:4 | b3:2 d4:4 | e4:2 c#4:4'
LW_B_OC = 'r:2. | r:2. | r:2. | r:4 e5:4 g5:4 | r:2. | r:2. | r:2. | r:2.'


@song('aud26')
def aud26(v):
    s = Song('aud26', bpm=104, bar=3, title='Audition 26 - Little Waltz', room=2.0, key='D')
    s.no_push = True
    s.section('I', 2, 'Gmaj7 | A7sus4', intro=True)
    s.no_push = True
    s.section('A', 16, LW_CH_A); s.section('A2', 16, LW_CH_A); s.section('B', 8, LW_CH_B)
    s.section('T', 2, 'Gmaj7 | A7sus4')
    s.sec['B'].key = 'D'
    ld = s.part('lead', OCARINA, rev=.4, delay=.1); ld.autovib = True
    ld.write('A', LW_A, vel=86); ld.write('A2', LW_A2, vel=88); ld.write('B', LW_B_OC, vel=74)
    vc = s.part('cello', CELLO, rev=.42, role='lead', pan=-.12); vc.autovib = True
    vc.write('B', LW_B, vel=88)
    hp = s.part('harp', HARP, rev=.4, role='arp', pan=-.25)
    hp.gen('I A A2 B T', comp, style='arp', arp='up8', lo=52, hi=72, vel=36)
    gt = s.part('guitar', NYLON, rev=.3, role='comp', pan=.25)
    gt.gen('A2 B', comp, style='waltz', lo=52, hi=67, n=3, vel=38)
    st = s.part('strings', SLOWSTR, rev=.45, role='pad', width=1.3)
    st.gen('A2 B', pads, lo=55, hi=72, n=3, vel=30, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 B T', bass_line, style='waltz', vel=76)
    return s


# ============================================================================ 27  BOSSA LANE
BL_CH_A = 'Gmaj7 | G69 | Am7 | D7 | Bm7 | E7 | Am7 D9 | Gmaj7'
BL_CH_B = 'Cmaj7 | Cm6 | Bm7 | E7 | Am7 | D7 | Gmaj7 | Am7 D7'
BL_A = ('b4:4. a4:8 b4:4 d5:4 | e5:2. r:4 | r:8 c5:8 e5:8 g5:8 a5:4. g5:8 | f#5:2. r:4 |'
        'r:8 d5:8 f#5:8 a5:8 b5:4. a5:8 | g#5:2. r:4 | a5:4. g5:8 f#5:4 c5:4 | b4:2. r:4')
BL_A2 = ('b4:4. a4:8 b4:4 d5:4 | e5:2. r:4 | r:8 c5:8 e5:8 g5:8 a5:4. g5:8 | f#5:2. r:4 |'
         'r:8 d5:8 f#5:8 a5:8 d6:4. c#6:8 | b5:2. r:4 | a5:4. g5:8 f#5:4 e5:4 | g5:2. r:4')
BL_B = ('g5:2. e5:4 | eb5:2. r:4 | d5:4. c#5:8 d5:4 f#5:4 | e5:2 d5:4 b4:4 |'
        'c5:4. b4:8 a4:4 e5:4 | f#5:2. r:4 | g5:4. f#5:8 e5:4 d5:4 | c5:4 e5:4 d5:4 c5:4')


@song('aud27')
def aud27(v):
    s = Song('aud27', bpm=124, title='Audition 27 - Bossa Lane', room=1.8, key='G')
    s.no_push = True
    s.section('I', 2, 'Am7 | D7', intro=True)
    s.no_push = True
    s.section('A', 8, BL_CH_A); s.section('A2', 8, BL_CH_A); s.section('B', 8, BL_CH_B)
    s.section('T', 2, 'Am7 | D7')
    s.sec['B'].key = 'G'
    ld = s.part('lead', FLUTE, rev=.34, delay=.1, layer=[VIBES]); ld.autovib = True; ld.layer_gain = .25
    ld.write('A', BL_A, vel=86); ld.write('A2', BL_A2, vel=88)
    tp = s.part('trumpet', MUTETPT, rev=.4, role='lead', pan=-.1); tp.autovib = True
    tp.write('B', BL_B, transpose=-12, vel=90)
    gt = s.part('guitar', NYLON, rev=.28, role='comp', pan=-.25)
    gt.gen('I A A2 B T', comp, style='bossa', lo=50, hi=67, n=4, vel=58, strum=.012)
    ep = s.part('keys', EPIANO, rev=.4, role='pad', pan=.25, chorus=.35)
    ep.gen('A2 B', pads, lo=55, hi=72, n=3, vel=30, spread=False)
    bs = s.part('bass', ACBASS, rev=.06)
    bs.gen('I A A2 B T', bass_line, style='bossa', vel=82)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-4)
    dr.gen('A A2 B T', groove, name='bossa', fills=0, vel=54, crash=False, hat_vel=.42)
    return s
