"""Hometown-theme auditions: four melodies written from the sequence study (STYLE_DP.md, "Melody craft II"),
each a different way of making a tune, for the player to steer. Built only with SOLMERE_AUDITION=1.

Rules every one of them keeps (all measured on ~70 RSE/FRLG/DPPt/HGSS town and route leads):
  * a 2-bar unit is motion that ARRIVES: a few shorter notes leading to a long note (1.5-4 beats), often
    anticipated by an eighth; phrases start after a breath (a rest) or on a pickup
  * no 2-bar window repeats exactly: a return keeps the opening and changes the ending (sequence, a new
    target, a higher peak)
  * about 55-65% steps, 8-12% leaps (into or out of the long notes), a few repeated notes as rhythm
  * two octaves across the song: B sits in another register, the peak comes late (A' or the last A)
  * long notes are chord tones or held colour tones (9ths, 13ths, maj7) that the harmony moves under
"""
from mfw import *


# ============================================================================ 1  HYMN
# F major, 92, straight. Singable: half notes and dotted halves, quarter-note pickups. The hook leaps a
# sixth (C up to A) and floats down; its answer is the same shape a step higher (D up to Bb); the second
# half climbs in a dotted rhythm to the D6 peak and settles on F. A' starts the same, then keeps climbing
# instead of holding. B drops an octave to the clarinet over IV-iii-ii with a borrowed Bbm6 (the Db). The
# last A leaps to the song's top F6.
H_A = ('c5:4 a5:2 g5:8 f5:8 | g5:2. r:8 c5:8 | d5:4 bb5:2 a5:8 g5:8 | a5:2. r:4 |'
       'f5:4. g5:8 a5:4 c6:8 d6:8 | -:2 c6:8 bb5:8 a5:4 | g5:4. a5:8 g5:4 e5:4 | f5:2. r:4')
H_A2 = ('c5:4 a5:2 g5:8 f5:8 | g5:2 a5:8 bb5:8 c6:4 | d6:4. c6:8 bb5:4 a5:4 | g5:2 r:8 e5:8 f5:8 g5:8 |'
        'a5:4 c6:2 bb5:8 a5:8 | bb5:4 d6:2 c6:8 bb5:8 | a5:4. g5:8 e5:4 g5:4 | f5:1')
H_B = ('r:4 d4:4 f4:4 a4:4 | g4:2. e4:4 | r:8 d4:8 f4:4 bb4:4 a4:4 | g4:2 f4:2 |'
       'r:4 d4:4 f4:4 c5:4 | db5:2. bb4:4 | c5:4. a4:8 a4:4 f#4:4 | g4:2. e4:4')
H_A3 = 'c5:4 a5:2 g5:8 f5:8 | g5:4 c6:4. d6:8 e6:8 f6:8 | -:2. e6:8 d6:8 | c6:4 a5:4 bb5:4 g5:4'
H_CH_A = 'F | C | Gm7 | Am7 | Dm7 | Bbmaj7 | C7sus4 C7 | F'
H_CH_A2 = 'F | C7 | Bbmaj7 | C7sus4 C7 | F/A | Bb | F/C C7 | F'
H_CH_B = 'Bbmaj7 | Am7 | Gm7 | F/A Bb | Bbmaj7 | Bbm6 | Am7 D7 | Gm7 C7'
H_CH_A3 = 'F | C7 | Dm7 | F/C C7'


@song('aud1')
def aud1(v):
    s = Song('aud1', bpm=92, title='Audition 1 - Hymn', room=1.8, key='F')
    s.no_push = True
    s.section('I', 2, 'Bbmaj7 | C9sus4', intro=True)
    s.no_push = True
    s.section('A', 8, H_CH_A); s.section('A2', 8, H_CH_A2); s.section('B', 8, H_CH_B); s.section('A3', 4, H_CH_A3)
    s.section('T', 2, 'F | Bbmaj7 C7sus4')
    ld = s.part('lead', FLUTE, rev=.36, delay=.08); ld.autovib = True
    ld.write('A', H_A, vel=84); ld.write('A2', H_A2, vel=88); ld.write('A3', H_A3, vel=92); ld.write('T', 'f5:1 | r:1', vel=84)
    cl = s.part('clar', CLARINET, rev=.4, role='lead', pan=-.1); cl.autovib = True
    cl.write('B', H_B, vel=90)
    # A2: a cello line in half notes on guide tones under the tune
    vc = s.part('counter', CELLO, rev=.4, role='counter', pan=-.25); vc.autovib = True
    vc.write('A2', 'a3:2 f3:2 | g3:2 bb3:2 | bb3:2 d4:2 | c4:2 bb3:2 | c4:2 a3:2 | d4:2 f4:2 | c4:2 bb3:2 | a3:1', vel=66)
    gl = s.part('glock', GLOCK, rev=.5, role='sparkle', pan=.3)
    gl.write('I', 'd6:4 f6:4 a6:2 | g6:2. r:4', vel=58); gl.write('A3', H_A3, transpose=12, vel=40)
    pn = s.part('piano', PIANO, rev=.3, role='arp', pan=-.1)
    pn.gen('I A A2 A3 T', comp, style='arp', arp='updown8', lo=50, hi=70, vel=50)
    pn.gen('B', comp, style='block', lo=52, hi=70, vel=46)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('A A2 B A3 T', bass_line, style='two', vel=82, approach=False)
    st = s.part('strings', STRINGS, rev=.45, role='pad', width=1.25)
    st.gen('A2 A3 T', pads, lo=52, hi=72, n=3, vel=48, spread=False)
    st.gen('B', pads, lo=45, hi=61, n=3, vel=46, spread=False)
    dr = s.drums(kit=KIT_BRUSH, rev=.2, vol=-3)
    dr.gen('A2 B A3', groove, name='soft', fills=8, fill='brush', vel=54, crash=False)
    return s


# ============================================================================ 2  HOP
# D major, 126, straight, staccato. The hook is a leap up a fifth into repeated notes, a neighbour and a
# fall to a held F# (5 | 5 5 6 5 3--); the reply breathes, then the whole unit is sequenced a step up
# (6 6 7 6 4--). Bars 5-8 fragment it into one-bar rising figures that climb to E6 and land on D. A'
# diverges upward in its second bar and peaks on A6 before ending open on F#6. B is half-time and legato
# on violin, an octave lower, over IV-iii-ii-V with an F#7 (the A#). The last A leaps to G6.
P_PICK = 'd5:8 a5:8'
P_A = ('a5\':8 a5\':8 b5:8 a5:8 f#5:2 | r:4 e5\':8 f#5\':8 d5:4 e5:8 b5:8 | b5\':8 b5\':8 c#6:8 b5:8 g5:2 | r:4 f#5\':8 g5\':8 e5:2 |'
       'r:8 f#5:8 b5:8 d6:8 c#6:4 b5:4 | r:8 g5:8 b5:8 d6:8 e6:4 d6:4 | b5\':8 c#6\':8 d6\':8 e6:8 -:4 c#6:8 a5:8 | d6:2 r:4 ' + P_PICK)
P_A2 = ('a5\':8 a5\':8 b5:8 a5:8 f#5:2 | r:4 e5\':8 f#5\':8 a5:4 d6:8 c#6:8 | b5\':8 b5\':8 c#6:8 b5:8 g5:2 | r:4 a5\':8 b5\':8 c#6:4 e6:8 a5:8 |'
        'r:8 a5:8 c#6:8 e6:8 f#6:4. e6:8 | d6:4 b5:4 r:8 f#5:8 a5:8 b5:8 | d6:8 e6:8 f#6:8 g6:8 a6:4 g6:8 e6:8 | f#6:2. r:4')
P_B = ('b4:2. c#5:8 d5:8 | c#5:2 a4:2 | b4:4. g4:8 e5:2 | c#5:1 |'
       'b4:2. d5:8 f#5:8 | a#4:2 c#5:4 e5:4 | d5:4. b4:8 b4:4 g#4:4 | g4:2 a4:2')
P_A3 = 'a5\':8 a5\':8 b5:8 a5:8 f#5:2 | r:4 g5\':8 a5\':8 b5:4 d6:8 f#6:8 | g6:4. f#6:8 e6:4 d6:4 | c#6:2 e6:4 g6:4'
P_CH_A = 'D | D | G | A7 | Bm7 | G | Em7 A7 | D'
P_CH_A2 = 'D | D | Gmaj7 | A7sus4 A7 | F#m7 | Bm7 | Em9 A13 | D'
P_CH_B = 'Gmaj7 | F#m7 | Em7 | A7 | Gmaj7 | F#7 | Bm7 E7 | Em7 A7'
P_CH_A3 = 'D | G | Em7 | A7'


@song('aud2')
def aud2(v):
    s = Song('aud2', bpm=126, title='Audition 2 - Hop', room=1.6, key='D')
    s.no_push = True
    s.section('I', 2, 'G | A7sus4', intro=True)
    s.no_push = True
    s.section('A', 8, P_CH_A); s.section('A2', 8, P_CH_A2); s.section('B', 8, P_CH_B); s.section('A3', 4, P_CH_A3)
    s.section('T', 2, 'D | G A7sus4')
    ld = s.part('lead', FLUTE, rev=.3, delay=.1); ld.autovib = True
    ld.write('I', 'r:1 | r:2. ' + P_PICK, vel=84)
    ld.write('A', P_A, vel=86); ld.write('A2', P_A2, vel=90); ld.write('A3', P_A3, vel=94)
    ld.write('T', 'f#6:1 | r:2. ' + P_PICK, vel=88)
    mb = s.part('marimba', MARIMBA, rev=.25, role='counter', pan=.3)   # doubles the tune an octave down
    mb.write('A2', P_A2, transpose=-12, vel=62); mb.write('A3', P_A3, transpose=-12, vel=66)
    vn = s.part('violin', VIOLIN, rev=.42, role='lead', pan=-.1, layer=[STRINGS]); vn.autovib = True; vn.layer_gain = .4
    vn.write('B', P_B, vel=90)
    pz = s.part('pizz', PIZZ, rev=.22, role='comp', pan=-.3)
    pz.gen('A A2 A3 T', comp, style='offbeat', lo=55, hi=69, n=3, vel=54)
    pn = s.part('piano', PIANO, rev=.26, role='comp', pan=.15)
    pn.gen('B', comp, style='pulse4', lo=45, hi=64, n=3, vel=46)
    bs = s.part('bass', FINGERBASS, rev=.05)
    bs.gen('I A A2 B A3 T', bass_line, style='two', vel=88, approach=True)
    st = s.part('strings', STRINGS, rev=.42, role='pad', width=1.25)
    st.gen('A2 A3', pads, lo=53, hi=74, n=3, vel=50, spread=False)
    st.gen('B', pads, lo=45, hi=63, n=3, vel=48, spread=False)
    dr = s.drums(kit=KIT_STD, rev=.14, vol=-2)
    dr.gen('A A2 A3 T', groove, name='pop2', fills=8, fill='snare', vel=80, crash=True)
    dr.gen('B', groove, name='soft', fills=8, fill='brush', vel=62, crash=False)
    return s


# ============================================================================ 3  TIDE (swing)
# Bb major, 100, swung. Each unit runs up in swung eighths and ARRIVES on a long colour tone that the
# harmony moves under: A over Gm9 (its 9th), D over F13 (its 13th), B over G7b9, then home on A over F13.
# The runs vary (a quarter in the middle, a leap of a fourth, a dotted start). A' answers ending on D. B
# lifts to Db major (bIII) on violin an octave lower, legato. The last A climbs to Bb6 over Cm9.
W_A = ('r:8 f5:8 g5:8 bb5:8 d6:4 c6:8 a5:8 | -:2. r:8 g5:8 | bb5:8 eb6:8 g6:8 f6:8 eb6:8 d6:8 c6:8 d6:8 | -:2 r:4 c6\':8 d6\':8 |'
       'f6:4. e6:8 d6:8 c6:8 a5:8 b5:8 | -:2. r:8 ab5:8 | g5:8 bb5:8 d6:8 c6:8 bb5:8 g5:8 f5:8 g5:8 | a5:2. r:4')
W_A2 = ('r:8 f5:8 g5:8 bb5:8 d6:4 c6:8 d6:8 | -:4. r:8 bb5:8 c6:8 d6:8 f6:8 | g6:2 f6:8 eb6:8 d6:8 c6:8 | eb6:2. r:8 c6:8 |'
        'd6:4. c6:8 a5:8 f5:8 g5:8 a5:8 | bb5:4 a5:8 g5:8 r:8 e5:8 g5:8 bb5:8 | c6:4. bb5:8 a5:8 g5:8 f5:8 eb5:8 | d5:2. r:4')
W_B = ('f5:2 eb5:4 db5:4 | c5:2. ab4:4 | bb4:4 db5:4 f5:4 ab5:4 | gb5:2. f5:4 |'
       'f5:4. eb5:8 db5:4 ab4:4 | bb4:2. db5:4 | c5:4 ab4:4 db5:4 f4:4 | eb5:2 a4:2')
W_A3 = 'r:8 f5:8 g5:8 bb5:8 d6:4 c6:8 a5:8 | -:4 bb5:8 d6:8 f6:4 g6:8 a6:8 | bb6:2 g6:4 eb6:4 | f6:2. r:8 c6:8'
W_CH_A = 'Bbmaj9 | Gm9 | Cm9 | F13 | Dm7 | G7b9 | Cm9 | F13'
W_CH_A2 = 'Bbmaj9 | Gm9 | Cm9 | F13 | Dm7 | Gm7 C9 | Cm9 F13 | Bbmaj9'
W_CH_B = 'Dbmaj9 | Bbm9 | Ebm9 | Ab13 | Dbmaj9 | Gbmaj7 | Fm7 Bbm7 | Ebm9 F13'
W_CH_A3 = 'Bbmaj9 | Gm9 | Cm9 | F13'


@song('aud3')
def aud3(v):
    s = Song('aud3', bpm=100, swing=.62, title='Audition 3 - Tide', room=1.9, key='Bb')
    s.no_push = True
    s.section('I', 2, 'Ebmaj9 | F13sus4 F13', intro=True)
    s.no_push = True
    s.section('A', 8, W_CH_A); s.section('A2', 8, W_CH_A2); s.section('B', 8, W_CH_B); s.section('A3', 4, W_CH_A3)
    s.section('T', 2, 'Bbmaj9 | Ebmaj9 F13sus4')
    ld = s.part('lead', FLUTE, rev=.34, delay=.1); ld.autovib = True
    ld.write('A', W_A, vel=86); ld.write('A2', W_A2, vel=88); ld.write('A3', W_A3, vel=94); ld.write('T', 'd6:1 | r:1', vel=86)
    vb = s.part('vibes', VIBES, rev=.4, role='counter', pan=.3)       # answers in the held notes of A2
    vb.write('A2', 'r:1 | r:2 d5:8 f5:8 a5:4 | r:1 | r:4 a4:8 c5:8 eb5:4 g5:4 | r:1 | r:1 | r:1 | r:4 f5:8 bb4:8 d5:2', vel=60)
    vn = s.part('violin', VIOLIN, rev=.45, role='lead', pan=-.1, layer=[STRINGS]); vn.autovib = True; vn.layer_gain = .45
    vn.write('B', W_B, vel=88)
    ep = s.part('keys', EPIANO, rev=.3, role='comp', pan=-.2, chorus=.35)
    ep.gen('I A A2 A3 T', comp, style='swingcomp', lo=52, hi=72, n=3, vel=58)
    ep.gen('B', comp, style='swingcomp', lo=46, hi=65, n=3, vel=54)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('A A2 A3 T', bass_line, style='walk', vel=86)
    bs.gen('B', bass_line, style='two', vel=82)
    st = s.part('strings', SLOWSTR, rev=.45, role='pad', width=1.25)
    st.gen('A2 A3', pads, lo=53, hi=74, n=3, vel=46, spread=False)
    st.gen('B', pads, lo=45, hi=63, n=3, vel=44, spread=False)
    dr = s.drums(kit=KIT_JAZZ, rev=.18, vol=-2)
    dr.gen('A A2 B A3 T', groove, name='ballad', fills=8, fill='brush', vel=64, crash=False, ride=True)
    return s


# ============================================================================ 4  CALL AND ANSWER
# A major, 80, straight, sparse. The ocarina asks in three notes (E A B--, the B a held 9th) and leaves
# the rest of the bar to vibes, which answer with a short falling figure; then the same question a third
# higher (F# A C#--, the C# the maj7). The second half is one continuous answer that sighs down to E.
# A' asks again and climbs to F#6 and A6; B is a cello in F major (bVI) back through E7. The last A lets
# the ocarina answer itself, up to A6.
C_A = ('e5:4 a5:4 b5:2 | r:1 | f#5:4 a5:4 c#6:2 | r:1 |'
       'e6:2. d6:8 c#6:8 | a5:2. g#5:8 f#5:8 | b5:4. a5:8 f#5:4 d5:4 | e5:1')
C_A2 = ('e5:4 a5:4 b5:2 | r:2 r:8 c#6:8 e6:8 f#6:8 | f#6:2. e6:4 | r:1 |'
        'r:8 a6:4. f#6:4 c#6:4 | e6:2. d6:8 c#6:8 | d6:4 b5:4 g#5:4 e5:4 | a5:1')
C_B = ('a3:2. c4:8 e4:8 | d4:2 b3:2 | c4:2. e4:4 | d4:1 |'
       'a3:2. g3:8 a3:8 | c4:2 e4:2 | f4:2. d4:4 | e4:2 d4:4 b3:4')
C_A3 = 'e5:4 a5:4 b5:2 | r:4 c#6:8 e6:8 a6:2 | f#6:4. e6:8 c#6:4 a5:4 | b5:2 g#5:2'
C_ANS_A = 'r:1 | r:4 c#6:8 b5:8 a5:8 f#5:8 e5:4 | r:1 | r:4 e6:8 d6:8 b5:8 a5:8 g#5:4 | r:1 | r:1 | r:1 | r:1'
C_ANS_A2 = 'r:1 | c#6:8 b5:8 f#5:4 r:2 | r:1 | r:4 b5:8 c#6:8 d6:8 e6:8 g#6:4 | r:1 | r:1 | r:1 | r:1'
C_CH_A = 'Amaj9 | F#m9 | Dmaj9 | E13sus4 E13 | C#m7 | F#m9 | Bm9 | E13sus4 E13'
C_CH_A2 = 'Amaj9 | F#m9 | Dmaj9 | E13sus4 E13 | F#m9 | Dmaj9 | Bm9 E13 | Amaj9'
C_CH_B = 'Fmaj9 | Em7 | Dm9 | G13 | Fmaj9 | Am7 | Bbmaj9 | E7sus4 E7'
C_CH_A3 = 'Amaj9 | F#m9 | Dmaj9 | E13sus4 E13'


@song('aud4')
def aud4(v):
    s = Song('aud4', bpm=80, title='Audition 4 - Call and Answer', room=2.0, key='A')
    s.no_push = True
    s.section('I', 2, 'Dmaj9 | E13sus4', intro=True)
    s.no_push = True
    s.section('A', 8, C_CH_A); s.section('A2', 8, C_CH_A2); s.section('B', 8, C_CH_B); s.section('A3', 4, C_CH_A3)
    s.section('T', 2, 'Amaj9 | Dmaj9 E13sus4')
    ld = s.part('lead', OCARINA, rev=.4, delay=.12); ld.autovib = True
    ld.write('A', C_A, vel=86); ld.write('A2', C_A2, vel=88); ld.write('A3', C_A3, vel=92); ld.write('T', 'a5:1 | r:1', vel=84)
    vb = s.part('vibes', VIBES, rev=.45, role='counter', pan=.3)
    vb.write('A', C_ANS_A, vel=70); vb.write('A2', C_ANS_A2, vel=70); vb.write('T', 'r:1 | e6:8 c#6:8 b5:8 a5:8 e5:2', vel=62)
    vc = s.part('cello', CELLO, rev=.42, role='lead', pan=-.1); vc.autovib = True
    vc.write('B', C_B, transpose=12, vel=92)
    hp = s.part('harp', HARP, rev=.4, role='arp', pan=-.25)
    hp.gen('I A A2 A3 T', comp, style='arp', arp='up8', lo=50, hi=74, vel=46)
    pn = s.part('piano', PIANO, rev=.34, role='comp', pan=.1)
    pn.gen('B', comp, style='block', lo=52, hi=72, n=4, vel=46)
    bs = s.part('bass', FRETLESS, rev=.1)
    bs.gen('A A2 B A3 T', bass_line, style='two', vel=80, approach=False)
    st = s.part('strings', WARMPAD, rev=.45, role='pad', width=1.3)
    st.gen('I A A2 B A3 T', pads, lo=52, hi=72, n=3, vel=44, spread=False)
    dr = s.drums(kit=KIT_BRUSH, rev=.22, vol=-4)
    dr.gen('A2 B A3', groove, name='ballad', fills=8, fill='brush', vel=50, crash=False)
    return s
