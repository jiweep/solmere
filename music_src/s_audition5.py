"""Hometown-theme auditions, round 5 (SOLMERE_AUDITION=1): a statement, then replies.

Round 4 (lyric-first) was "much closer"; still "a sense of rambling ... needs to feel intentional and making a
statement, which then the rest of the phrasing responds to", and some notes felt placed "just to hit" chord
tones. Letter Home had the best parts. So every take here has one fixed architecture per 8 bars (16 in 3/4):

  statement  a complete sung line with a clear shape, ending on a long note, then a breath
  reply      the statement's exact rhythm, new words, a different (answering) ending
  turn       a fragment of the statement developed: repeated and lifted (the rule of three), the peak
  close      the statement's rhythm returns and settles

No note without a syllable; no run-on lines longer than two bars; a breath after every line.

  19 Letter Home II  the round-4 favourite rebuilt this way (waltz, D)
  20 Sunlight        bossa in A
  21 Lamplight       swing in F, muted trumpet
"""
from mfw import *
from s_audition4 import LH_CH_B, LH_B


# ============================================================================ 19  LETTER HOME II (waltz)
#   statement "DEAR-est, the SEA is CALM"           a5 f#5 . e5 | b5 a5 | c#6 (held, open)
#   reply     "DEAR-est, the ROS-es BLOOM"          the same rhythm, closes on the tonic d6
#   turn      "ONE more NIGHT, ONE more DAY, ONE more WEEK, and then"  the DEAR-est figure lifted three times
#   close     "HOME, and the WIND will BRING me"    the statement's rhythm, settling low on d5
LH2_CH = ('Dmaj9 | Bm11 | Gmaj9 | A13 | Dmaj9 | Bm11 | Em9:2 A13:1 | Dmaj9 |'
          'Bm9 | A13 | Bm9 | A13sus4 | Dmaj9 | Bm11 | Em9:2 A13:1 | Dmaj9')
LH2_A = ('a5:2 f#5:4 | -:2 e5:4 | b5:2 a5:4 | c#6:2. |'
         'a5:2 f#5:4 | -:2 e5:4 | b5:2 a5:4 | d6:2 r:4 |'
         'd6:2 b5:4 | e6:2 c#6:4 | f#6:2 d6:4 | e6:2 r:4 |'
         'a5:2 f#5:4 | -:2 e5:4 | g5:2 f#5:4 | d5:2 r:4')


@song('aud19')
def aud19(v):
    s = Song('aud19', bpm=100, bar=3, title='Audition 19 - Letter Home II', room=2.1, key='D')
    s.no_push = True
    s.section('I', 2, 'Gmaj9 | A13sus4', intro=True)
    s.no_push = True
    s.section('A', 16, LH2_CH); s.section('A2', 16, LH2_CH); s.section('B', 8, LH_CH_B)
    s.section('T', 2, 'Gmaj9 | A13sus4')
    s.sec['B'].key = 'Bb'
    ld = s.part('lead', OCARINA, rev=.4, delay=.1); ld.autovib = True
    ld.write('A', LH2_A, vel=86)
    fl = s.part('flute', FLUTE, rev=.4, role='lead', pan=.1); fl.autovib = True
    fl.write('A2', LH2_A, vel=84)
    vc = s.part('cello', CELLO, rev=.42, role='lead', pan=-.1); vc.autovib = True
    vc.write('B', LH_B, vel=90)
    hp = s.part('harp', HARP, rev=.4, role='arp', pan=-.25)
    hp.gen('I A A2 B T', comp, style='arp', arp='up8', lo=50, hi=74, vel=42)
    gt = s.part('guitar', NYLON, rev=.3, role='comp', pan=.25)
    gt.gen('A2 B', comp, style='waltz', lo=50, hi=67, n=3, vel=46)
    st = s.part('strings', SLOWSTR, rev=.45, role='pad', width=1.3)
    st.gen('A2 B T', pads, lo=52, hi=72, n=3, vel=40, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 B T', bass_line, style='custom', pattern=[(0, 2.6, '1'), (3, 2.6, '5')], vel=76)
    dr = s.drums(kit=KIT_BRUSH, rev=.2, vol=-6)
    dr.gen('A2', groove, name='waltz', fills=16, fill='brush', vel=44, crash=False)
    return s


# ============================================================================ 20  SUNLIGHT (bossa)
#   statement "SUN-light on the WA-ter,"   c#6. b5 a5 g#5 a5 | e5 (held)
#   reply     "MOON-light on the HAR-bor."  the same rhythm a step higher over Bm9, ends on the 9th of E
#   turn      "and the WHOLE TOWN | GLOW-ing"  a climb to the peak E6, then two long notes
#   close     "SUN-light on the WA-ter"     the statement again, open (B) the first time, home (A) the second
SL_CH_A = 'Amaj9 | Amaj9 | Bm9 | E13 | C#m7 | F#7 | Bm9 | E13sus4 E13'
SL_CH_A2 = 'Amaj9 | Amaj9 | Bm9 | E13 | C#m7 | F#7 | Bm9 E13 | Amaj9'
SL_CH_B = 'Cmaj9 | Am9 | Dm9 | G13 | Cmaj9 | Fmaj9 | Dm9 | E7#5'
SL_A = ('c#6:4. b5:8 a5:8 g#5:8 a5:4 | e5:2. r:4 | d6:4. c#6:8 b5:8 a5:8 b5:4 | f#5:2. r:4 |'
        'r:8 e5:8 g#5:8 b5:8 e6:2 | c#6:2 a#5:2 | c#6:4. b5:8 a5:8 g#5:8 a5:4 | b5:2. r:4')
SL_A2 = ('c#6:4. b5:8 a5:8 g#5:8 a5:4 | e5:2. r:4 | d6:4. c#6:8 b5:8 a5:8 b5:4 | f#5:2. r:4 |'
         'r:8 e5:8 g#5:8 b5:8 e6:2 | c#6:2 a#5:2 | c#6:4. b5:8 a5:8 g#5:8 b5:4 | a5:2. r:4')
SL_B = 'e5:2 d5:4 c5:4 | g4:2. r:4 | f5:2 e5:4 d5:4 | a4:2. r:4 | e5:2 d5:4 c5:4 | a5:2 g5:2 | f5:2 e5:4 d5:4 | e5:1'


@song('aud20')
def aud20(v):
    s = Song('aud20', bpm=120, title='Audition 20 - Sunlight', room=1.8, key='A')
    s.no_push = True
    s.section('I', 2, 'Bm9 | E13sus4 E13', intro=True)
    s.no_push = True
    s.section('A', 8, SL_CH_A); s.section('A2', 8, SL_CH_A2); s.section('B', 8, SL_CH_B)
    s.section('T', 2, 'Bm9 | E13sus4 E13')
    s.sec['B'].key = 'C'
    ld = s.part('lead', FLUTE, rev=.34, delay=.1, layer=[VIBES]); ld.autovib = True; ld.layer_gain = .3
    ld.write('A', SL_A, vel=88); ld.write('A2', SL_A2, vel=90)
    tp = s.part('trumpet', MUTETPT, rev=.4, role='lead', pan=-.1); tp.autovib = True
    tp.write('B', SL_B, vel=90)
    gt = s.part('guitar', NYLON, rev=.28, role='comp', pan=-.25)
    gt.gen('I A A2 B T', comp, style='bossa', lo=50, hi=69, n=4, vel=60, strum=.012)
    ep = s.part('keys', EPIANO, rev=.4, role='pad', pan=.25, chorus=.35)
    ep.gen('A2 B', pads, lo=55, hi=74, n=3, vel=36, spread=False)
    bs = s.part('bass', ACBASS, rev=.06)
    bs.gen('I A A2 B T', bass_line, style='bossa', vel=84)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-3)
    dr.gen('A A2 B T', groove, name='bossa', fills=0, vel=56, crash=False, hat_vel=.45)
    return s


# ============================================================================ 21  LAMPLIGHT (swing)
#   statement "have you SEEN the LAMP-light?"    a question: lifts onto F#, the 3rd of D7
#   reply     "ev-ery EVE-ning, it GLOWS"        the same rhythm, lower, settles
#   turn      "down by the WA-ter | THERE"       the rhythm a third time, higher, then one held peak
#   close     "THERE by the HAR-bor"             falls home (open the first time)
LL_CH_A = 'Fmaj9 | D7b9 | Gm9 | C13 | Am7 | D7b9 | Gm9 | C13'
LL_CH_A2 = 'Fmaj9 | D7b9 | Gm9 | C13 | Am7 | D7b9 | Gm9 C13 | Fmaj9'
LL_CH_B = 'Dbmaj9 | Bbm9 | Ebm9 | Ab13 | Dbmaj9 | Gbmaj9 | Gm7b5 | C7b9'
LL_A = ('r:4 c5:8 d5:8 f5:4. e5:8 | a5:4 f#5:2 r:4 | r:4 bb4:8 c5:8 d5:4. f5:8 | g5:4 e5:2 r:4 |'
        'r:4 e5:8 g5:8 a5:4. c6:8 | -:2 a5:4 r:4 | bb5:4. a5:8 g5:4 f5:4 | e5:2. r:4')
LL_A2 = ('r:4 c5:8 d5:8 f5:4. e5:8 | a5:4 f#5:2 r:4 | r:4 bb4:8 c5:8 d5:4. f5:8 | g5:4 e5:2 r:4 |'
         'r:4 e5:8 g5:8 a5:4. c6:8 | -:2 a5:4 r:4 | bb5:4. a5:8 g5:4 e5:4 | f5:2. r:4')
LL_B = 'f5:2. r:4 | db5:2 f5:2 | gb5:2. r:4 | f5:2 eb5:2 | ab5:2. r:4 | f5:2 db5:2 | bb4:2 db5:2 | e5:2 r:2'


@song('aud21')
def aud21(v):
    s = Song('aud21', bpm=108, swing=.64, title='Audition 21 - Lamplight', room=1.9, key='F')
    s.no_push = True
    s.section('I', 2, 'Gm9 | C13', intro=True)
    s.no_push = True
    s.section('A', 8, LL_CH_A); s.section('A2', 8, LL_CH_A2); s.section('B', 8, LL_CH_B)
    s.section('T', 2, 'Gm9 | C13')
    s.sec['B'].key = 'Db'
    ld = s.part('lead', MUTETPT, rev=.36, delay=.08); ld.autovib = True
    ld.write('A', LL_A, vel=92); ld.write('A2', LL_A2, vel=94)
    cl = s.part('clarinet', CLARINET, rev=.4, role='lead', pan=-.15); cl.autovib = True
    cl.write('B', LL_B, transpose=-12, vel=88)
    pn = s.part('piano', PIANO, rev=.3, role='comp', pan=.2)
    pn.gen('I A A2 B T', comp, style='swingcomp', lo=52, hi=72, n=4, vel=54)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 T', bass_line, style='walk', vel=86)
    bs.gen('B', bass_line, style='two', vel=82)
    dr = s.drums(kit=KIT_JAZZ, rev=.18, vol=-2)
    dr.gen('A A2 T', groove, name='ride', fills=8, fill='brush', vel=62, crash=False)
    dr.gen('B', groove, name='brush', fills=8, fill='brush', vel=54, crash=False)
    return s
