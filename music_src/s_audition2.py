"""Hometown-theme auditions, round 2 (SOLMERE_AUDITION=1). Steer from round 1: Tide's harmony was liked but
should go jazzier (bossa / bebop, the way Diamond and Pearl lean jazz); Call and Answer's melodies sounded the
most natural because they left space. So every tune here is built on space, and each takes one DP jazz idiom.

What the band does comes from reading the Platinum sequences with groove.py (Jubilife, Canalave, Eterna,
Hearthome, Pastoria, Route 209, the Pokemon Center at night):
  * 70-100% of chords carry a 9th, 11th or 13th; maj9 / m9 / 13 are the default, never plain triads
  * turnarounds through a tritone sub (Hearthome's intro: Dm7 - Db7 - Cmaj9 - G7#5), backdoor cadences
    (iv - bVII - I), passing diminished chords, augmented dominants into the next section
  * Route 209: IVmaj7 - III7 - VIm7 ("Just the Two of Us"); Jubilife night: IVmaj9 - IIIm7 - VIm - VIm(#5)
  * Canalave: a chromatic bass walking down under held chords (lament / line cliche)
  * swing on triplets with the ride's ding, ding-da-ding (Jubilife night, Eterna, the Pokemon Center night);
    Hearthome is straight 8ths with stabbed chords and an octave-jumping bass

Melody (all four): a unit is ONE motion (2-5 notes, often from an off-beat pickup or a chromatic approach)
that arrives on a long colour tone, then a breath of 1-2 beats or more. About 2 notes a bar; the long
notes are 9ths, 13ths, maj7s and b7s that the harmony changes colour under. Hooks carry one fingerprint:
a blue-note scoop (F-F#-G), a chromatic rise across the barline (A - A# - B over IV - III7 - VIm), a note
held while the bass walks down under it.
"""
from mfw import *


# ============================================================================ 5  BOSSA
# F major, 132, straight, a bossa nova. Hook: a lower-neighbour E into F, up to A and settle on a long G
# (the 9th); then the same shape a step up over G13 settling on A (its 9th). The answer is one line that
# sighs down Am7 - D7b9 - Gm9 to a sus4 resolving onto C7b9. A' climbs to E6 and walks down the tritone
# sub (Gm9 - Gb7#11 - Fmaj9) in half notes, Eb - Db - C. B is a muted trumpet in Db (bVI) through a
# backdoor Eb13; the last A peaks on A6.
B_A = ('r:8 e5:8 f5:8 a5:4 g5:8 -:4 | -:2 r:2 | r:8 f#5:8 g5:8 b5:4 a5:8 -:4 | -:2 r:4 e5:4 |'
       'g5:2. e5:4 | f#5:4 a5:4 c6:2 | bb5:2. a5:8 g5:8 | f5:2 e5:4 r:4')
B_A2 = ('r:8 e5:8 f5:8 a5:4 g5:8 -:4 | -:2 r:8 a5:8 c6:8 e6:8 | -:2 d6:8 c6:8 b5:8 a5:8 | -:2 r:2 |'
        'r:8 bb5:8 d6:8 f6:8 -:4 e6:4 | eb6:2 db6:2 | c6:2. a5:4 | g5:2. r:4')
B_B = ('r:4 c5:4 eb5:4 f5:4 | -:2. eb5:4 | db5:2. c5:4 | bb4:4 c5:4 g5:2 |'
       '-:2 r:4 e5:4 | a5:4. f#5:8 -:2 | r:8 f5:8 a5:8 bb5:8 -:2 | ab5:2. r:4')
B_A3 = 'r:8 e5:8 f5:8 a5:4 g5:8 c6:8 e6:8 | -:2 f#6:8 g6:8 a6:4 | -:4 f6:4 eb6:4 db6:4 | c6:2 a5:4 g5:4'
B_CH_A = 'Fmaj9 | Fmaj9 | G13 | G13 | Am7 | D7b9 | Gm9 | C13sus4 C7b9'
B_CH_A2 = 'Fmaj9 | Fmaj9 | G13 | G13 | Gm13 | Gb13#11 | Fmaj9 | Fmaj9'
B_CH_B = 'Dbmaj9 | Gbmaj7#11 | Bbm9 | Eb13 | Am7 | D7b9 | Gm9 | C7#5'
B_CH_A3 = 'Fmaj9 | G13 | Gm9 Gb7#11 | Fmaj9'


@song('aud5')
def aud5(v):
    s = Song('aud5', bpm=132, title='Audition 5 - Bossa', room=1.8, key='F')
    s.no_push = True
    s.section('I', 2, 'Gm9 | Gb7#11', intro=True)
    s.no_push = True
    s.section('A', 8, B_CH_A); s.section('A2', 8, B_CH_A2); s.section('B', 8, B_CH_B); s.section('A3', 4, B_CH_A3)
    s.section('T', 2, 'Fmaj9 | Gm9 Gb7#11')
    s.sec['B'].key = 'Db'
    ld = s.part('lead', FLUTE, rev=.34, delay=.1); ld.autovib = True
    ld.write('A', B_A, vel=86); ld.write('A2', B_A2, vel=88); ld.write('A3', B_A3, vel=92); ld.write('T', 'f5:1 | r:1', vel=84)
    tp = s.part('trumpet', MUTETPT, rev=.4, role='lead', pan=-.1); tp.autovib = True
    tp.write('B', B_B, vel=90)
    gt = s.part('guitar', NYLON, rev=.28, role='comp', pan=-.25)
    gt.gen('I A A2 B A3 T', comp, style='bossa', lo=50, hi=69, n=4, vel=62, strum=.012)
    ep = s.part('keys', EPIANO, rev=.4, role='pad', pan=.25, chorus=.35)
    ep.gen('A2 B A3', pads, lo=55, hi=74, n=3, vel=40, spread=False)
    bs = s.part('bass', ACBASS, rev=.06)
    bs.gen('I A A2 B A3 T', bass_line, style='bossa', vel=84)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-3)
    dr.gen('A A2 B A3 T', groove, name='bossa', fills=0, vel=60, crash=False, hat_vel=.45)
    return s


# ============================================================================ 6  SWING
# Eb major, 120, swung (Jubilife at night). Muted trumpet, sounding an octave below what is written. Hook:
# a blue-note scoop F - F# - G, up to Bb and a long D (the maj7, then the 9th over C13); the same scoop a
# step down lands on C over Fm9 and Bb13. The answer walks down chromatic ii chords (Gm7 - Gb7#11 - Fm9)
# with a long Fb over Gb7 and a long G over the E7#11 tritone sub. A' reaches for the backdoor cadence
# (Abmaj9 - Abm9 Db13 - Ebmaj9), peaking on G. B is a clarinet in Gb (bIII) over a two-feel bass.
S_A = ('r:4 f5:8 f#5:8 g5:8 bb5:8 d6:4 | -:2. r:4 | r:4 eb5:8 e5:8 f5:8 ab5:8 c6:4 | -:2. r:8 d6:8 |'
       '-:4 bb5:8 g5:8 f5:4. d5:8 | e5:2 r:4 r:8 c6:8 | -:4 bb5:8 ab5:8 g5:2 | -:2 r:2')
S_A2 = ('r:4 f5:8 f#5:8 g5:8 bb5:8 d6:4 | -:2 r:8 e6:8 d6:8 c6:8 | -:4 r:8 ab5:8 bb5:8 c6:8 eb6:8 g6:8 | -:2. r:4 |'
        'r:4 g5:8 bb5:8 d6:8 eb6:8 f6:4 | -:4 g6:4. f6:8 eb6:4 | cb6:2 bb5:2 | g5:2. r:4')
S_B = ('r:4 db5:4 f5:4 ab5:4 | -:2 gb5:2 | r:4 bb4:4 cb5:4 eb5:4 | -:2 f5:4 bb5:4 |'
       '-:1 | r:4 ab5:4 g5:4 e5:4 | eb5:1 | r:2 d5:4 gb5:4')
S_A3 = 'r:4 f5:8 f#5:8 g5:8 bb5:8 d6:4 | -:4 e6:8 g6:8 a6:2 | g6:4 f6:4 e6:8 d6:8 -:4 | -:4 bb5:8 g5:8 -:2'
S_CH_A = 'Ebmaj9 | C13 | Fm9 | Bb13 | Gm7 | Gb7#11 | Fm9 | E7#11'
S_CH_A2 = 'Ebmaj9 | C13 | Fm9 | Bb13 | Ebmaj9/G | Abmaj9 | Abm9 Db13 | Ebmaj9'
S_CH_B = 'Gbmaj9 | Ebm9 | Abm9 | Db13 | Bmaj7#11 | Bbm7 Eb7b9 | Abmaj9 | Fm9 Bb7#5'
S_CH_A3 = 'Ebmaj9 | C13 | Fm9 E7#11 | Ebmaj9'


@song('aud6')
def aud6(v):
    s = Song('aud6', bpm=120, swing=.64, title='Audition 6 - Swing', room=1.9, key='Eb')
    s.no_push = True
    s.section('I', 2, 'Fm9 | E7#11', intro=True)
    s.no_push = True
    s.section('A', 8, S_CH_A); s.section('A2', 8, S_CH_A2); s.section('B', 8, S_CH_B); s.section('A3', 4, S_CH_A3)
    s.section('T', 2, 'Ebmaj9 | Fm9 E7#11')
    s.sec['B'].key = 'Gb'
    ld = s.part('lead', MUTETPT, rev=.36, delay=.08); ld.autovib = True
    ld.write('A', S_A, transpose=-12, vel=92); ld.write('A2', S_A2, transpose=-12, vel=94); ld.write('A3', S_A3, transpose=-12, vel=96)
    ld.write('T', 'f5:1 | r:1', transpose=-12, vel=88)
    cl = s.part('clarinet', CLARINET, rev=.4, role='lead', pan=-.15); cl.autovib = True
    cl.write('B', S_B, transpose=-12, vel=90)
    pn = s.part('piano', PIANO, rev=.3, role='comp', pan=.2)
    pn.gen('I A A2 B A3 T', comp, style='swingcomp', lo=52, hi=72, n=4, vel=58)
    gt = s.part('guitar', JAZZGTR, rev=.2, role='comp', pan=-.3)
    gt.gen('A A2 A3', comp, style='pulse4', lo=48, hi=62, n=3, vel=40)
    vb = s.part('vibes', VIBES, rev=.45, role='counter', pan=.35)   # one answer, in A's last held note
    vb.write('A', 'r:1 | r:1 | r:1 | r:1 | r:1 | r:1 | r:1 | r:4 b5:8 g#5:8 e5:8 d5:8 b4:4', vel=58)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 A3 T', bass_line, style='walk', vel=88)
    bs.gen('B', bass_line, style='two', vel=84)
    dr = s.drums(kit=KIT_JAZZ, rev=.18, vol=-2)
    dr.gen('A A2 A3 T', groove, name='ride', fills=8, fill='brush', vel=66, crash=False)
    dr.gen('B', groove, name='brush', fills=8, fill='brush', vel=58, crash=False)
    return s


# ============================================================================ 7  TWO OF US
# D major, 120, straight 8ths: Route 209 and Hearthome. The loop starts on IV (Gmaj9), the J-pop jazz
# float, over IVmaj7 - III7 - VIm7 - Vm7 I7. Hook: the long note rises a semitone as the chord moves
# under it, A (9th of G) to A# (3rd of F#7b9), then the line lands on B (Bm9) and falls D - C - B into
# the D13. A' climbs to F#6 instead and resolves on the tonic for the first time. B moves to F major
# (Bbmaj9 - C9 - Am7 - Dm9) in a 3-3-2 rhythm on strings; the last A runs up the Gmaj9 to A6.
T_A = ('r:4 d5:8 f#5:8 a5:2 | r:8 e5:8 g5:8 a#5:8 -:2 | r:8 f#5:8 a5:8 b5:8 -:4 d6:4 | -:4 c6:4 r:8 b5:8 -:4 |'
       'r:4 b5:8 d6:8 f#6:4. e6:8 | -:2 c#6:4 a5:4 | -:4 b5:8 c#6:8 -:2 | r:4 d6:8 c#6:8 b5:2')
T_A2 = ('r:4 d5:8 f#5:8 a5:2 | r:8 e5:8 g5:8 a#5:8 -:2 | r:8 f#5:8 a5:8 b5:8 -:4 d6:4 | -:4 e6:4 r:8 f#6:8 -:4 |'
        '-:4 g6:8 f#6:8 d6:8 b5:8 -:4 | -:2 c#6:2 | r:8 a5:8 c#6:8 e6:8 -:2 | -:2 r:2')
T_B = ('d5:4. c5:4. a4:4 | bb4:2. r:4 | c5:4. e5:4. g5:4 | f5:2. r:4 |'
       'bb5:4. a5:4. f5:4 | e5:4. g5:4. a5:4 | b5:2 g5:4 f#5:4 | f5:2. r:4')
T_A3 = 'r:4 d5:8 f#5:8 a5:8 d6:8 f#6:8 a6:8 | -:2 g6:4 e6:4 | f#6:4 c#6:4 d#6:4 c6:4 | b5:2 c#6:2'
T_CH_A = 'Gmaj9 | F#7b9 | Bm9 | Am9 D13 | Gmaj9 | A13 | F#m7 | Bm9 E9'
T_CH_A2 = 'Gmaj9 | F#7b9 | Bm9 | Am9 D13 | Gmaj9 | A13sus4 A13 | Dmaj9 | Dmaj9'
T_CH_B = 'Bbmaj9 | C9 | Am7 | Dm9 | Gm9 | C13 | Em9 | A7#5'
T_CH_A3 = 'Gmaj9 | A13 | F#m7 B7b9 | Em9 A13'


@song('aud7')
def aud7(v):
    s = Song('aud7', bpm=120, title='Audition 7 - Two of Us', room=1.7, key='D')
    s.no_push = True
    s.section('I', 4, 'Em9 | Eb7#11 | Dmaj9 | D7#5', intro=True)
    s.no_push = True
    s.section('A', 8, T_CH_A); s.section('A2', 8, T_CH_A2); s.section('B', 8, T_CH_B); s.section('A3', 4, T_CH_A3)
    s.section('T', 2, 'Dmaj9 | D7#5')
    s.sec['B'].key = 'F'
    ld = s.part('lead', EPIANO, rev=.3, delay=.1, layer=[VIBES], chorus=.3); ld.layer_gain = .55
    ld.write('A', T_A, vel=92); ld.write('A2', T_A2, vel=94); ld.write('A3', T_A3, vel=96); ld.write('T', 'd6:1 | r:1', vel=88)
    vn = s.part('strings_lead', VIOLIN, rev=.42, role='lead', pan=-.1, layer=[STRINGS]); vn.autovib = True; vn.layer_gain = .5
    vn.write('B', T_B, vel=90)
    pn = s.part('piano', PIANO, rev=.26, role='comp', pan=.2)
    pn.gen('I A A2 A3 T', comp, style='stabs', pattern='-..x..x...x.x...', lo=54, hi=74, n=4, vel=58)
    pn.gen('B', comp, style='charleston', lo=52, hi=72, n=4, vel=52)
    st = s.part('strings', STRINGS, rev=.44, role='pad', width=1.25)
    st.gen('A2 B A3', pads, lo=55, hi=76, n=3, vel=44, spread=False)
    bs = s.part('bass', FINGERBASS, rev=.06)
    bs.gen('I A A2 B A3 T', bass_line, style='pop8', vel=86, stacc=True)
    dr = s.drums(kit=KIT_STD, rev=.16, vol=-4)
    dr.gen('A A2 B A3 T', groove, name='city', fills=8, fill='snare', vel=70, crash=False, hat_vel=.5)
    return s


# ============================================================================ 8  MUSETTE WALTZ
# C major, 3/4 at 150, a lilting jazz waltz on accordion (a harbour town). The bass walks down C - B -
# Bb - A - Ab - G under the tune (Canalave's lament): the tune holds its G as the chords turn under it,
# steps up to B (the maj7), falls a tritone-flavoured E - Bb over C7/Bb and sighs Bb - A into Am9; then a
# long D, the #11 of Abmaj7. A' climbs to G6 over Fmaj9 and takes the minor iv (Fm9) home. B is a
# clarinet in Eb (bIII), one long note a bar. The last A climbs the chord to the top G.
M_A = ('r:4 d5:4 e5:4 | g5:2. | -:2 f#5:8 g5:8 | b5:2 a5:4 | -:4 g5:4 e5:4 | bb5:2. | a5:2 b5:4 | c6:2. |'
       '-:4 bb5:4 g5:4 | d5:2. | -:4 e5:4 f5:4 | e5:2 r:4 | r:4 f5:4 a5:4 | e6:2. | -:4 d6:4 b5:4 | f5:2 r:4')
M_A2 = ('r:4 d5:4 e5:4 | g5:2. | -:2 f#5:8 g5:8 | b5:2 a5:4 | -:4 g5:4 e5:4 | bb5:2. | a5:2 b5:4 | c6:4 e6:4 f6:4 |'
        'g6:2. | -:4 f6:4 eb6:4 | d6:2. | c#6:4 bb5:4 g5:4 | f5:2. | e5:2 d5:4 | e5:2. | -:2 r:4')
M_B = ('r:4 bb4:4 d5:4 | f5:2. | -:4 eb5:4 g5:4 | d5:2. | r:4 c5:4 eb5:4 | g5:2. | -:4 f5:4 d5:4 | ab5:2. |'
       'g5:2. | -:4 f5:4 eb5:4 | c5:2. | -:4 g5:4 f5:4 | ab5:2. | -:4 f5:4 c5:4 | b4:2. | -:4 d#5:4 f5:4')
M_A3 = 'r:4 d5:4 e5:4 | g5:4 b5:4 d6:4 | e6:2 d6:4 | c6:2 b5:4 | a5:4 c6:4 e6:4 | g6:2. | f6:2 e6:4 | d6:2 b5:4'
M_CH_A = ('Cmaj9 | Cmaj9 | Cmaj7/B | Cmaj7/B | C13/Bb | C13/Bb | Am9 | Am9 | Abmaj9#11 | Abmaj9#11 | G13sus4 | G13 |'
          'Dm9 | Dm9 | G7b9 | G7b9')
M_CH_A2 = ('Cmaj9 | Cmaj9 | Cmaj7/B | Cmaj7/B | C7/Bb | C7/Bb | Am9 | Am9 | Fmaj9 | Fm9 | Em7 | A7b9 |'
           'Dm9 | G13 | Cmaj9 | Cmaj9')
M_CH_B = ('Ebmaj9 | Ebmaj9 | Cm9 | Cm9 | Fm9 | Fm9 | Bb13 | Bb13 | Abmaj9 | Abmaj9 | Dbmaj7#11 | Dbmaj7#11 |'
          'Dm7b5 | Dm7b5 | G7#5 | G7#5')
M_CH_A3 = 'Cmaj9 | Cmaj7/B | C7/Bb | Am9 | Fmaj9 | Fm9 | Dm9 | G13'


@song('aud8')
def aud8(v):
    s = Song('aud8', bpm=150, bar=3, swing=.58, title='Audition 8 - Musette Waltz', room=1.9, key='C')
    s.no_push = True
    s.section('I', 4, 'Dm9 | G13 | Dm9 | G7b9', intro=True)
    s.no_push = True
    s.section('A', 16, M_CH_A); s.section('A2', 16, M_CH_A2); s.section('B', 16, M_CH_B); s.section('A3', 8, M_CH_A3)
    s.section('T', 2, 'Cmaj9 | G13')
    s.sec['B'].key = 'Eb'
    ld = s.part('lead', ACCORDION, rev=.32, delay=.08); ld.autovib = True
    ld.write('A', M_A, vel=84); ld.write('A2', M_A2, vel=86); ld.write('A3', M_A3, vel=90); ld.write('T', 'c6:2. | r:2.', vel=82)
    cl = s.part('clarinet', CLARINET, rev=.42, role='lead', pan=-.15); cl.autovib = True
    cl.write('B', M_B, vel=88)
    gt = s.part('guitar', JAZZGTR, rev=.24, role='comp', pan=.25)
    gt.gen('I A A2 B A3 T', comp, style='waltz', lo=50, hi=66, n=3, vel=50)
    pn = s.part('piano', PIANO, rev=.34, role='pad', pan=-.2)
    pn.gen('A2 B A3', pads, lo=55, hi=76, n=3, vel=38, spread=False)
    bs = s.part('bass', ACBASS, rev=.06)
    bs.gen('I A A2 B A3 T', bass_line, style='custom', pattern=[(0, 2.6, '1'), (3, 2.6, '1')], vel=84)   # the walk-down stays on the line
    dr = s.drums(kit=KIT_BRUSH, rev=.2, vol=-3)
    dr.gen('A2 B A3 T', groove, name='waltz', fills=8, fill='brush', vel=56, crash=False, hat_vel=.45)
    return s
