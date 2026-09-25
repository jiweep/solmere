"""Hometown-theme auditions, round 4 (SOLMERE_AUDITION=1): melodies that talk.

Round 3 (hook-first, rule of three) moved "in the right direction ... like 40% there"; the user added that good
melodies have "a kind of conversational quality". speech.py measured why ours didn't: every round-3 phrase
was the same length (variation 0.00-0.14; Undertale 0.44, Platinum towns 0.62-0.75), phrases were half as
long (6-7 beats against 11-14), rhythms were evener (nPVI 22-44; Platinum towns 46-65) and almost nothing was
recited on one pitch.

Method for every take: write a line of dummy lyric first (quoted above each part), say it, and set it
syllable by syllable: stressed syllables on strong beats or held, unstressed ones short, on upbeats and often
on the same pitch; a question lifts at the end to an open note (2, 6, 7 or a chromatic tone), a statement
peaks on its key word and falls to a long final note; the answer quotes the question's rhythm. Sentences
come in different lengths. Each take then tests one more idea (one hunch per audition):

  14 Tidewalk, retold  the round-3 Tidewalk band and chords unchanged, only the melody rewritten this way (A/B)
  15 Porch Talk        two voices converse: the flute asks, the muted trumpet answers by quoting it (swing)
  16 Errand Day        the "sentence": two short remarks, then one long run-on line (J-pop jazz, straight 8ths)
  17 Letter Home       a sung waltz, the melody of a letter (Undertale's "Home" / folk-song phrasing)
  18 Market Chatter    DP-style: keeps talking, denser, recited notes, phrases end on short holds (swing)
"""
from mfw import *
from s_audition3 import T_CH_A, T_CH_A2, T_CH_B, T_CH_A3


# ============================================================================ 14  TIDEWALK, RETOLD (bossa)
# "so WHERE you GO-ing, EAR-ly in the MOR-ning?"  (the question rises to F#, the 6th)
# "DOWN to the HAR-bor."                          (the answer starts high and falls to a long 5th)
# "WHAT will you FIND there?"                     (the answer's rhythm again; FIND on the b9 over F#7b9, lifts)
# "MAY-be the SEA wind, MAY-be a FRIEND."  / A2: "MAY-be the SEA wind will BRING you HOME."
# B, the muted trumpet: the reply in C, quoting the hook's knock-and-leap rhythm.
TR_A = ('c#5:4 c#5:8 f#5:4. e5:8 r:8 | e5:4 c#5:8 b4:8 c#5:8 e5:4. | f#5:2. r:4 |'
        'b5:4 a5:8 g#5:8 f#5:4. e5:8 | -:2 r:2 | c#6:4 b5:8 a#5:8 g5:4. a#5:8 |'
        'b5:4 a5:8 f#5:8 d6:4 c#6:4 | b5:8 a5:8 f#5:8 e5:4. r:8 b4:8')
TR_A2 = ('c#5:4 c#5:8 f#5:4. e5:8 r:8 | e5:4 c#5:8 b4:8 c#5:8 e5:4. | f#5:2. r:4 |'
         'b5:4 a5:8 g#5:8 f#5:4. e5:8 | -:2 r:2 | c#6:4 b5:8 a#5:8 g5:4. a#5:8 |'
         'b5:4 a5:8 f#5:8 d6:4 c#6:8 b5:8 | c#6:4 b5:8 a5:4. r:4')
TR_B = ('e5:4 e5:8 a5:4. g5:8 r:8 | a5:4 g5:8 f5:8 d5:2 | r:4 d5:8 e5:8 g5:4 b5:4 | a5:2 r:2 |'
        'f5:4 f5:8 c6:4. a5:8 r:8 | b5:4 a5:8 g5:8 e5:2 | r:8 d5:8 f#5:8 a5:8 c#6:4. b5:8 | c6:2 g#5:4 r:4')
TR_A3 = ('c#5:4 c#5:8 f#5:4. e5:8 r:8 | e5:4 c#5:8 b4:8 c#5:8 e5:4. | f#5:4 r:4 d6:4 c#6:8 b5:8 |'
         'c#6:4 b5:8 a5:4. r:4')
PICK_B4 = 'r:1 | r:2. r:8 b4:8'


@song('aud14')
def aud14(v):
    s = Song('aud14', bpm=128, title='Audition 14 - Tidewalk, retold', room=1.8, key='A')
    s.no_push = True
    s.section('I', 2, 'Bm9 | E13sus4 E13', intro=True)
    s.no_push = True
    s.section('A', 8, T_CH_A); s.section('A2', 8, T_CH_A2); s.section('B', 8, T_CH_B); s.section('A3', 4, T_CH_A3)
    s.section('T', 2, 'Bm9 | E13sus4 E13')
    s.sec['B'].key = 'C'
    ld = s.part('lead', FLUTE, rev=.34, delay=.1, layer=[VIBES]); ld.autovib = True; ld.layer_gain = .35
    ld.write('I', PICK_B4, vel=84)
    ld.write('A', TR_A, vel=88); ld.write('A2', TR_A2, vel=90); ld.write('A3', TR_A3, vel=90); ld.write('T', PICK_B4, vel=84)
    ld.write('B', 'r:1 | r:1 | r:1 | r:1 | r:1 | r:1 | r:1 | r:2. r:8 b4:8', vel=84)
    tp = s.part('trumpet', MUTETPT, rev=.4, role='lead', pan=-.1); tp.autovib = True
    tp.write('B', TR_B, vel=92)
    gt = s.part('guitar', NYLON, rev=.28, role='comp', pan=-.25)
    gt.gen('I A A2 B A3 T', comp, style='bossa', lo=50, hi=69, n=4, vel=62, strum=.012)
    ep = s.part('keys', EPIANO, rev=.4, role='pad', pan=.25, chorus=.35)
    ep.gen('A2 B A3', pads, lo=55, hi=74, n=3, vel=38, spread=False)
    bs = s.part('bass', ACBASS, rev=.06)
    bs.gen('I A A2 B A3 T', bass_line, style='bossa', vel=84)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-3)
    dr.gen('A A2 B A3 T', groove, name='bossa', fills=0, vel=58, crash=False, hat_vel=.45)
    return s


# ============================================================================ 15  PORCH TALK (swing duet)
# F major, 112, swung. The flute asks, the muted trumpet answers; the answers run longer than the questions.
#   flute:   "did you HEAR the NEWS to-DAY?"          (lifts to a held G, the 2nd, over A7)
#   trumpet: "HEARD it from the BA-ker, SHE heard it from the MAY-or."   (recited on one note, then down)
#   flute:   "is it TRUE?"                            (short; a held F over A7b13, the sharp colour)
#   trumpet: "WELL, you KNOW how the STO-ries GO."    (falls to the 5th; in A2 to the tonic)
# B: both together in Db, the flute on the question's rhythm (knock, leap of a 4th), the trumpet under it.
PT_CH_A = 'Bbmaj13 | A7b9 | Dm9 | Cm9 F13 | Bbmaj9 | A7b13 | Dm9 G13 | Gm9 C13'
PT_CH_A2 = 'Bbmaj13 | A7b9 | Dm9 | Cm9 F13 | Bbmaj9 | A7b13 | Gm9 C13 | Fmaj9'
PT_CH_B = 'Dbmaj9 | Gb13 | Fm9 | Bbm9 Eb13 | Abmaj9 | Dbmaj9 | Gm7b5 | C7b9'
PT_CH_A3 = 'Bbmaj13 | A7b9 | Gm9 C13 | Fmaj9'
PT_FL_A = ('d5:4 c5:8 f5:4. e5:8 g5:8 | -:4 r:2. | r:1 | r:1 |'
           'r:2 r:8 c5:8 c5:8 f5:8 | -:4. e5:8 r:2 | r:1 | r:2. c5:8 c5:8')
PT_FL_A2 = ('d5:4 c5:8 f5:4. e5:8 g5:8 | -:4 r:2. | r:1 | r:1 |'
            'r:2 r:8 c5:8 c5:8 f5:8 | -:4. e5:8 r:2 | r:1 | r:1')
PT_FL_B = ('f5:4 f5:8 bb5:4. ab5:8 r:8 | ab5:2 eb5:2 | r:8 c5:8 eb5:8 f5:8 ab5:4. g5:8 | f5:2 eb5:4 r:4 |'
           'c5:4 c5:8 f5:4. eb5:8 r:8 | f5:2. r:4 | r:8 bb4:8 db5:8 f5:8 g5:2 | e5:4 db5:4 bb4:4 c5:8 c5:8')
PT_FL_A3 = 'd5:4 c5:8 f5:4. e5:8 g5:8 | -:4 r:2. | r:1 | r:1'
PT_TP_A = ('r:1 | r:1 | a4:4 a4:8 a4:8 a4:8 c5:4. | bb4:8 r:8 g4:4 g4:8 g4:8 a4:8 bb4:8 |'
           'c5:2 a4:4 r:4 | r:1 | d5:4 r:8 c5:8 d5:4 b4:8 a4:8 | bb4:4. a4:8 g4:4 r:4')
PT_TP_A2 = ('r:1 | r:1 | a4:4 a4:8 a4:8 a4:8 c5:4. | bb4:8 r:8 g4:4 g4:8 g4:8 a4:8 bb4:8 |'
            'c5:2 a4:4 r:4 | r:1 | d5:4 r:8 c5:8 d5:4 bb4:8 g4:8 | a4:4. g4:8 f4:2')
PT_TP_B = 'ab4:1 | bb4:2 gb4:2 | ab4:2 c5:2 | db5:2 bb4:2 | ab4:1 | ab4:2. r:4 | bb4:2 db5:2 | bb4:2 r:2'
PT_TP_A3 = 'r:1 | r:1 | d5:4 r:8 c5:8 d5:4 bb4:8 g4:8 | a4:4. g4:8 f4:2'


@song('aud15')
def aud15(v):
    s = Song('aud15', bpm=112, swing=.64, title='Audition 15 - Porch Talk', room=1.9, key='F')
    s.no_push = True
    s.section('I', 2, 'Gm9 | C13', intro=True)
    s.no_push = True
    s.section('A', 8, PT_CH_A); s.section('A2', 8, PT_CH_A2); s.section('B', 8, PT_CH_B); s.section('A3', 4, PT_CH_A3)
    s.section('T', 2, 'Gm9 | C13')
    s.sec['B'].key = 'Db'
    fl = s.part('lead', FLUTE, rev=.36, delay=.08, pan=.12); fl.autovib = True
    fl.write('I', 'r:1 | r:2. c5:8 c5:8', vel=86)
    fl.write('A', PT_FL_A, vel=88); fl.write('A2', PT_FL_A2, vel=90); fl.write('B', PT_FL_B, vel=90)
    fl.write('A3', PT_FL_A3, vel=90); fl.write('T', 'r:1 | r:2. c5:8 c5:8', vel=86)
    tp = s.part('trumpet', MUTETPT, rev=.36, role='lead', pan=-.14); tp.autovib = True
    tp.write('A', PT_TP_A, vel=94); tp.write('A2', PT_TP_A2, vel=94); tp.write('B', PT_TP_B, vel=78); tp.write('A3', PT_TP_A3, vel=94)
    pn = s.part('piano', PIANO, rev=.3, role='comp', pan=.2)
    pn.gen('I A A2 B A3 T', comp, style='swingcomp', lo=52, hi=72, n=4, vel=54)
    vb = s.part('vibes', VIBES, rev=.45, role='pad', pan=.35)
    vb.gen('B', pads, lo=60, hi=77, n=3, vel=34, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 A3 T', bass_line, style='walk', vel=86)
    bs.gen('B', bass_line, style='two', vel=82)
    dr = s.drums(kit=KIT_JAZZ, rev=.18, vol=-2)
    dr.gen('A A2 A3 T', groove, name='ride', fills=8, fill='brush', vel=62, crash=False)
    dr.gen('B', groove, name='brush', fills=8, fill='brush', vel=54, crash=False)
    return s


# ============================================================================ 16  ERRAND DAY (J-pop jazz)
# Bb major, 126, straight eighths. A child's list, as a sentence: two short remarks, then one long run-on line.
#   "GOT to GET the BREAD,"  "GOT to GET the MILK,"       (the knock; the second slips down a semitone)
#   "then I'll RUN a-ROUND to the HAR-bor and BACK a-GAIN be-FORE the BELL rings at NOON,"  (4 bars, no stop)
#   "SO I'd BET-ter HUR-ry!"                              (A2: "SO I'd BET-ter GO!" onto the tonic)
# B (violin, Gb): the afternoon slows down; the knock in quarter notes.
ED_CH_A = 'Ebmaj9 | D9 | Gm9 | Fm9 Bb13 | Ebmaj9 | Ebm9 Ab13 | Dm7 G7b9 | Cm9 F13'
ED_CH_A2 = 'Ebmaj9 | D9 | Gm9 | Fm9 Bb13 | Ebmaj9 | Ebm9 Ab13 | Cm9 F13 | Bbmaj9'
ED_CH_B = 'Gbmaj9 | Fm7 Bb7#5 | Ebm9 | Ab13 | Dbmaj9 | Gbmaj9 | Cm9 | F13sus4 F13'
ED_CH_A3 = 'Ebmaj9 | D9 | Cm9 F13 | Bbmaj9'
ED_A = ('g5:8 g5:8 f5:8 g5:8 r:8 bb5:4. | f#5:8 f#5:8 e5:8 f#5:8 r:8 a5:4. |'
        'r:8 bb5:8 a5:8 bb5:4 d6:8 c6:8 a5:8 | c6:4. ab5:8 g5:4 f5:8 g5:8 |'
        'bb5:4 r:8 g5:8 bb5:8 c6:8 d6:4 | eb6:4 db6:8 bb5:8 c6:2 |'
        'd6:8 d6:8 c6:8 a5:8 b5:4. ab5:8 | g5:2 r:2')
ED_A2 = ('g5:8 g5:8 f5:8 g5:8 r:8 bb5:4. | f#5:8 f#5:8 e5:8 f#5:8 r:8 a5:4. |'
         'r:8 bb5:8 a5:8 bb5:4 d6:8 c6:8 a5:8 | c6:4. ab5:8 g5:4 f5:8 g5:8 |'
         'bb5:4 r:8 g5:8 bb5:8 c6:8 d6:4 | eb6:4 db6:8 bb5:8 c6:2 |'
         'eb6:8 eb6:8 d6:8 bb5:8 c6:4. a5:8 | bb5:2. r:4')
ED_B = ('bb4:4 bb4:4 ab4:4 bb4:4 | c5:2 d5:2 | gb4:4 gb4:4 f4:4 gb4:4 | f4:2. r:4 |'
        'ab4:4 ab4:4 f4:4 ab4:4 | db5:2. r:4 | eb5:4 d5:4 c5:4 bb4:4 | bb4:2 a4:2')
ED_A3 = ('g5:8 g5:8 f5:8 g5:8 r:8 bb5:4. | f#5:8 f#5:8 e5:8 f#5:8 r:8 a5:4. |'
         'eb6:8 eb6:8 d6:8 bb5:8 c6:4. a5:8 | bb5:2. r:4')


@song('aud16')
def aud16(v):
    s = Song('aud16', bpm=126, title='Audition 16 - Errand Day', room=1.7, key='Bb')
    s.no_push = True
    s.section('I', 4, 'Ebmaj9 | D9 | Cm9 | F13sus4 F13', intro=True)
    s.no_push = True
    s.section('A', 8, ED_CH_A); s.section('A2', 8, ED_CH_A2); s.section('B', 8, ED_CH_B); s.section('A3', 4, ED_CH_A3)
    s.section('T', 2, 'Cm9 | F13sus4 F13')
    s.sec['B'].key = 'Gb'
    ld = s.part('lead', OCARINA, rev=.32, delay=.1, layer=[GLOCK]); ld.autovib = True; ld.layer_gain = .25
    ld.write('A', ED_A, vel=92); ld.write('A2', ED_A2, vel=94); ld.write('A3', ED_A3, vel=94)
    vn = s.part('strings_lead', VIOLIN, rev=.42, role='lead', pan=-.1, layer=[STRINGS]); vn.autovib = True; vn.layer_gain = .5
    vn.write('B', ED_B, vel=88)
    pn = s.part('piano', PIANO, rev=.26, role='comp', pan=.2)
    pn.gen('I A A2 A3 T', comp, style='stabs', pattern='-..x..x...x.x...', lo=54, hi=74, n=4, vel=56)
    pn.gen('B', comp, style='charleston', lo=52, hi=72, n=4, vel=50)
    st = s.part('strings', STRINGS, rev=.44, role='pad', width=1.25)
    st.gen('A2 B A3', pads, lo=55, hi=76, n=3, vel=40, spread=False)
    bs = s.part('bass', FINGERBASS, rev=.06)
    bs.gen('I A A2 B A3 T', bass_line, style='pop8', vel=86, stacc=True)
    dr = s.drums(kit=KIT_STD, rev=.16, vol=-4)
    dr.gen('A A2 B A3 T', groove, name='city', fills=8, fill='snare', vel=70, crash=False, hat_vel=.5)
    return s


# ============================================================================ 17  LETTER HOME (waltz)
# D major, 3/4 at 100. The melody of a letter; each stressed syllable on a downbeat, the last syllable of a
# line held (a full stop), a breath at each comma.
#   "DEAR-est, the SEA is CALM to-DAY"              (a short call, a pause, then a line that climbs and settles)
#   "and ARE the ROS-es BLOOM-ing YET?"              (a question: lifts a 4th to a held B)
#   "I'll be HOME, when the WIND is WARM a-GAIN."    (recited on D, a borrowed Bb, peaks on D#6, settles)
# B (cello, Bb): the reply from home, long notes from "DEAR-est" (a 5th falling to a 3rd).
LH_CH_A = ('Dmaj9 | Dmaj9 | Bm9 | Bm9 | Gmaj9 | A13 | F#m7 | B7b9 | Em9 | Em9 | Gm6 | Gm6 | F#m11 | B9 |'
           'Em9 | A13sus4')
LH_CH_A2 = ('Dmaj9 | Dmaj9 | Bm9 | Bm9 | Gmaj9 | A13 | F#m7 | B7b9 | Em9 | Em9 | Gm6 | Gm6 | F#m11 | B9 |'
            'Em9:2 A13:1 | Dmaj9')
LH_CH_B = 'Bbmaj9 | Bbmaj9 | Gm9 | Gm9 | Ebmaj9 | Ebmaj9 | Em7b5 | A7b9'
LH_A = ('a5:2 f#5:4 | -:2 e5:4 | b5:2 a5:4 | d6:2 c#6:4 | b5:2. | r:2 e5:4 | a5:2 f#5:4 | f#5:2 d#5:4 |'
        'g5:2 f#5:4 | b5:2. | r:4 d6:4 d6:4 | d6:2 bb5:8 a5:8 | c#6:2 b5:4 | d#6:2 c#6:4 | e6:2. | -:2 r:4')
LH_A2 = ('a5:2 f#5:4 | -:2 e5:4 | b5:2 a5:4 | d6:2 c#6:4 | b5:2. | r:2 e5:4 | a5:2 f#5:4 | f#5:2 d#5:4 |'
         'g5:2 f#5:4 | b5:2. | r:4 d6:4 d6:4 | d6:2 bb5:8 a5:8 | c#6:2 b5:4 | d#6:2 c#6:4 | e6:2 c#6:4 | d6:2 r:4')
LH_B = 'f4:2 d4:4 | -:2 c4:4 | g4:2 f4:4 | bb4:2 a4:4 | g4:2. | r:4 bb4:4 c5:4 | d5:2 bb4:4 | c#5:2 a4:4'


@song('aud17')
def aud17(v):
    s = Song('aud17', bpm=100, bar=3, title='Audition 17 - Letter Home', room=2.1, key='D')
    s.no_push = True
    s.section('I', 2, 'Gmaj9 | A13sus4', intro=True)
    s.no_push = True
    s.section('A', 16, LH_CH_A); s.section('A2', 16, LH_CH_A2); s.section('B', 8, LH_CH_B)
    s.section('T', 2, 'Gmaj9 | A13sus4')
    s.sec['B'].key = 'Bb'
    ld = s.part('lead', OCARINA, rev=.4, delay=.1); ld.autovib = True
    ld.write('A', LH_A, vel=86); ld.write('A2', LH_A2, vel=88)
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


# ============================================================================ 18  MARKET CHATTER (swing)
# G major, 138, swung; the clarinet is a stallholder who never stops talking (Jubilife-style density,
# phrases end on short holds, notes recited on one pitch):
#   "FRESH-ly PICKED from the ORCH-ard, APP-les, PEACH-es, PEARS,"
#   "and a BAS-ket of BER-ries for a FRIEND of MINE!"  "WHO wants SOME, now?"
#   "a PEN-ny a PIECE, a DIME for the LOT, come and GET it!"   (A2 ends on a held tonic)
# B: the vibes take a slower turn in Eb; the clarinet chips in between their lines.
MC_CH_A = 'Gmaj9 | E7b9 | Am9 | D13 | Bm7 E7b9 | Am9 D13 | Gmaj9 E7#9 | Am9 D7b9'
MC_CH_A2 = 'Gmaj9 | E7b9 | Am9 | D13 | Bm7 E7b9 | Am9 D13 | Am9 D13 | G6'
MC_CH_B = 'Ebmaj9 | Ab13 | Gm9 | C13 | Fm11 | Bb13 | Am7b5 | D7#9'
MC_CH_A3 = 'Gmaj9 | E7b9 | Am9 D13 | G6'
MC_A = ('b5:4 a5:8 d6:4. b5:8 a5:8 | g#5:4 f5:8 e5:8 e5:8 d5:8 e5:4 | c6:4 b5:8 g5:8 a5:4 r:4 |'
        'r:8 f#5:8 f#5:8 a5:4 f#5:8 e5:8 f#5:8 | b5:4 a5:8 b5:4. d6:8 b5:8 | c6:4 r:4 b5:8 a5:8 f#5:8 d5:8 |'
        'e5:8 d5:8 e5:8 g5:8 b5:4 g5:8 g5:8 | a5:4. f#5:8 eb5:4 d5:4')
MC_A2 = ('b5:4 a5:8 d6:4. b5:8 a5:8 | g#5:4 f5:8 e5:8 e5:8 d5:8 e5:4 | c6:4 b5:8 g5:8 a5:4 r:4 |'
         'r:8 f#5:8 f#5:8 a5:4 f#5:8 e5:8 f#5:8 | b5:4 a5:8 b5:4. d6:8 b5:8 | c6:4 r:4 b5:8 a5:8 f#5:8 d5:8 |'
         'e5:8 d5:8 e5:8 g5:8 b5:4 a5:8 f#5:8 | g5:2. r:4')
MC_B_VB = 'g5:2 f5:4 bb5:4 | bb5:2 f5:2 | f5:2 d5:4 a5:4 | g5:2. r:4 | eb5:2 c5:4 g5:4 | f5:2. r:4 | eb5:2 c5:4 a4:4 | f5:2 f#5:2'
MC_B_CL = 'r:1 | r:1 | r:1 | r:2. g5:8 a5:8 | bb5:4 r:2. | r:2. d5:8 f5:8 | g5:4 r:2. | r:1'
MC_A3 = ('b5:4 a5:8 d6:4. b5:8 a5:8 | g#5:4 f5:8 e5:8 e5:8 d5:8 e5:4 |'
         'e5:8 d5:8 e5:8 g5:8 b5:4 a5:8 f#5:8 | g5:2. r:4')


@song('aud18')
def aud18(v):
    s = Song('aud18', bpm=138, swing=.62, title='Audition 18 - Market Chatter', room=1.8, key='G')
    s.no_push = True
    s.section('I', 2, 'Am9 | D13', intro=True)
    s.no_push = True
    s.section('A', 8, MC_CH_A); s.section('A2', 8, MC_CH_A2); s.section('B', 8, MC_CH_B); s.section('A3', 4, MC_CH_A3)
    s.section('T', 2, 'Am9 | D13')
    s.sec['B'].key = 'Eb'
    ld = s.part('lead', CLARINET, rev=.3, delay=.06, pan=.08); ld.autovib = True
    ld.write('A', MC_A, vel=92); ld.write('A2', MC_A2, vel=94); ld.write('B', MC_B_CL, vel=84); ld.write('A3', MC_A3, vel=94)
    vb = s.part('vibes', VIBES, rev=.42, role='lead', pan=-.15)
    vb.write('B', MC_B_VB, vel=88)
    pn = s.part('piano', PIANO, rev=.28, role='comp', pan=.2)
    pn.gen('I A A2 B A3 T', comp, style='swingcomp', lo=52, hi=72, n=4, vel=54)
    gt = s.part('guitar', JAZZGTR, rev=.2, role='comp', pan=-.3)
    gt.gen('A2 A3', comp, style='pulse4', lo=48, hi=64, n=3, vel=40)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 B A3 T', bass_line, style='walk', vel=88)
    dr = s.drums(kit=KIT_JAZZ, rev=.16, vol=-2)
    dr.gen('A A2 B A3 T', groove, name='ride', fills=8, fill='snare', vel=66, crash=False)
    return s
