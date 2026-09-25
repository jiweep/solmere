"""Hometown-theme auditions, round 3 (SOLMERE_AUDITION=1). The melody is built the way Undertale builds its
tunes, on Pokemon-DP jazz harmony and the round-2 grooves (which were liked). See STYLE_DP.md, "Melody craft
III", for the measurements behind this.

  * ONE hook cell (1 bar) with a fingerprint: a knock of repeated notes, a leap then a fall, a chromatic step
    onto the barline. 4-7 ideas per song (Undertale averages ~8, its best tunes 2-6; our rounds 1-2 had 11-20)
  * the rule of three: cell, cell again (sequenced or with a new ending), the third time breaks the pattern
    (higher, or a leap), then an arrival bar with a long colour tone and a breath
  * an 8-bar period: the first half ends open, the second starts the same and closes; then the whole A plays
    twice before B, so the hook is heard four times a loop (Undertale repeats whole phrases verbatim)
  * a common arch contour with one unusual interval (earworm study: familiar shape + an unexpected leap or
    repetition); space after every arrival (Call and Answer)
  * B contrasts (register, longer values, another key) but is made from a fragment of the cell (leitmotif)
"""
from mfw import *


# ============================================================================ 9  KEEPSAKE (ostinato)
# F major, 88. A celesta ostinato in eighths (like Once Upon a Time's) over a bass walking down the scale.
# Hook: a sixth leap up and a fall (C - A-G-F); sequenced a step down (Bb - G-F-E); the third time climbs the
# chord instead (A F A C) and rests on G. The second half recolours the same notes over Bbmaj9 and climbs
# higher (to D). B is a cello playing the sixth leap in half notes in Db.
K_A = ('c5:4 a5:4. g5:8 f5:4 | bb4:4 g5:4. f5:8 e5:4 | a4:4 f5:4 a5:4 c6:4 | g5:2 r:2 |'
       'c5:4 a5:4. g5:8 f5:4 | bb4:4 g5:4. f5:8 e5:4 | a4:4 f5:4 bb5:4 d6:4 | c6:2 r:2')
K_A2 = ('c5:4 a5:4. g5:8 f5:4 | bb4:4 g5:4. f5:8 e5:4 | a4:4 f5:4 a5:4 c6:4 | g5:2 r:2 |'
        'c5:4 a5:4. g5:8 f5:4 | bb4:4 g5:4. f5:8 e5:4 | a4:4 f5:4 a5:4 g5:4 | f5:2 r:2')
K_B = ('ab3:2 f4:2 | eb4:2. db4:4 | bb3:2 gb4:2 | f4:2 eb4:2 |'
       'ab3:2 f4:2 | db4:2 ab4:2 | bb4:2 a4:2 | g4:2. r:4')
K_A3 = 'c5:4 a5:4. g5:8 f5:4 | bb4:4 g5:4. f5:8 e5:4 | a4:4 f5:4 a5:4 g5:4 | f5:2 r:2'
K_CH_A = 'Fmaj9 | C7/E | Dm9 | C9sus4 | Bbmaj9 | C9/E | Gm9 | C13sus4 C13'
K_CH_A2 = 'Fmaj9 | C7/E | Dm9 | C9sus4 | Bbmaj9 | C9/E | Gm9 C13 | Fmaj9'
K_CH_B = 'Dbmaj9 | Gbmaj7#11 | Ebm9 | Ab13sus4 Ab13 | Dbmaj9 | Bbm9 | Gm9 | C13sus4 C7#5'
K_CH_A3 = 'Fmaj9 | C7/E | Gm9 C13 | Fmaj9'


@song('aud9')
def aud9(v):
    s = Song('aud9', bpm=88, title='Audition 9 - Keepsake', room=2.0, key='F')
    s.no_push = True
    s.section('I', 2, 'Fmaj9 | C7/E', intro=True)
    s.no_push = True
    s.section('A', 8, K_CH_A); s.section('A2', 8, K_CH_A2); s.section('B', 8, K_CH_B); s.section('A3', 4, K_CH_A3)
    s.section('T', 2, 'Bbmaj9 | C13sus4 C13')
    s.sec['B'].key = 'Db'
    ld = s.part('lead', OCARINA, rev=.38, delay=.12, layer=[GLOCK]); ld.autovib = True; ld.layer_gain = .22
    ld.write('A', K_A, vel=86); ld.write('A2', K_A2, vel=88); ld.write('A3', K_A3, vel=90); ld.write('T', 'r:1 | r:1', vel=80)
    vc = s.part('cello', CELLO, rev=.42, role='lead', pan=-.1); vc.autovib = True
    vc.write('B', K_B, vel=92)
    cel = s.part('celesta', CELESTA, rev=.36, role='arp', pan=.25)
    cel.gen('I A A2 A3 T', comp, style='arp', arp='alberti8', lo=60, hi=79, vel=52)
    hp = s.part('harp', HARP, rev=.4, role='arp', pan=-.25)
    hp.gen('B', comp, style='arp', arp='up8', lo=48, hi=72, vel=44)
    pn = s.part('piano', PIANO, rev=.34, role='pad', pan=.05)
    pn.gen('A2 B A3', pads, lo=52, hi=70, n=3, vel=40, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 B A3 T', bass_line, style='two', vel=80, approach=False)
    dr = s.drums(kit=KIT_BRUSH, rev=.22, vol=-4)
    dr.gen('A2 B A3', groove, name='ballad', fills=8, fill='brush', vel=48, crash=False)
    return s


# ============================================================================ 10  TIDEWALK (bossa)
# A major, 128, bossa. Hook: a knock of three repeated notes off the beat, then a step down onto a long 9th
# (E E E - D - B). Sequenced a step up (F# F# F# - E - C#, a long 9th over Bm9); the third time jumps (G# G# B)
# and lands on a held G over F#7b9, the b9, the song's one sharp colour. B moves to C major and slows the
# knock to quarter notes, three times down a step, then leaps a seventh.
T_A = ('r:8 e5:8 e5:8 e5:4 c#5:4 b4:8 | -:2. r:4 | r:8 f#5:8 f#5:8 f#5:4 d5:4 c#5:8 | -:2. r:4 |'
       'r:8 g#5:8 g#5:8 b5:4 a5:8 g#5:8 e5:8 | g5:2. r:4 | r:8 d5:8 d5:8 d5:4 c#5:4 b4:8 | -:2 r:2')
T_A2 = ('r:8 e5:8 e5:8 e5:4 c#5:4 b4:8 | -:2. r:4 | r:8 f#5:8 f#5:8 f#5:4 d5:4 c#5:8 | -:2. r:4 |'
        'r:8 g#5:8 g#5:8 b5:4 a5:8 g#5:8 e5:8 | g5:2. r:4 | r:8 d5:8 d5:8 d5:4 c#5:4 a4:8 | -:2. r:4')
T_B = ('e5:4 e5:4 e5:4 d5:4 | c5:2. r:4 | b4:4 b4:4 b4:4 a4:4 | g4:2. r:4 |'
       'a4:4 a4:4 a4:4 g4:4 | f4:2 e5:2 | d5:4 c#5:4 b4:4 a4:4 | g#4:2 c5:2')
T_A3 = 'r:8 e5:8 e5:8 e5:4 c#5:4 b4:8 | -:2. r:4 | r:8 d5:8 d5:8 d5:4 c#5:4 a4:8 | -:2. r:4'
T_CH_A = 'Amaj9 | Amaj9 | Bm9 | E13 | C#m7 | F#7b9 | Bm9 | E13sus4 E13'
T_CH_A2 = 'Amaj9 | Amaj9 | Bm9 | E13 | C#m7 | F#7b9 | Bm9 E13 | Amaj9'
T_CH_B = 'Cmaj9 | F13 | Em9 | A13 | Dm9 | G13 | Bm9 | E7#5'
T_CH_A3 = 'Amaj9 | Amaj9 | Bm9 E13 | Amaj9'


@song('aud10')
def aud10(v):
    s = Song('aud10', bpm=128, title='Audition 10 - Tidewalk', room=1.8, key='A')
    s.no_push = True
    s.section('I', 2, 'Bm9 | E13sus4 E13', intro=True)
    s.no_push = True
    s.section('A', 8, T_CH_A); s.section('A2', 8, T_CH_A2); s.section('B', 8, T_CH_B); s.section('A3', 4, T_CH_A3)
    s.section('T', 2, 'Bm9 | E13sus4 E13')
    s.sec['B'].key = 'C'
    ld = s.part('lead', FLUTE, rev=.34, delay=.1, layer=[VIBES]); ld.autovib = True; ld.layer_gain = .35
    ld.write('A', T_A, vel=88); ld.write('A2', T_A2, vel=90); ld.write('A3', T_A3, vel=90); ld.write('T', 'r:1 | r:1', vel=80)
    tp = s.part('trumpet', MUTETPT, rev=.4, role='lead', pan=-.1); tp.autovib = True
    tp.write('B', T_B, vel=92)
    gt = s.part('guitar', NYLON, rev=.28, role='comp', pan=-.25)
    gt.gen('I A A2 B A3 T', comp, style='bossa', lo=50, hi=69, n=4, vel=62, strum=.012)
    ep = s.part('keys', EPIANO, rev=.4, role='pad', pan=.25, chorus=.35)
    ep.gen('A2 B A3', pads, lo=55, hi=74, n=3, vel=38, spread=False)
    bs = s.part('bass', ACBASS, rev=.06)
    bs.gen('I A A2 B A3 T', bass_line, style='bossa', vel=84)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-3)
    dr.gen('A A2 B A3 T', groove, name='bossa', fills=0, vel=58, crash=False, hat_vel=.45)
    return s


# ============================================================================ 11  PORCHLIGHT (swing)
# Eb major, 116, swung. Hook: a knock on the 3rd, then a chromatic slide down to the root (G G Gb F Eb),
# held over Cm9. Sequenced a step up (Ab Ab G Gb F) and held over Bb13; the third time turns round and climbs
# (Bb Bb C D F) to a long F. B (clarinet) stretches the slide into half notes and resolves Gb -> G into A.
P_A = ('r:4 g5:8 g5:8 gb5:8 f5:8 eb5:4 | -:2. r:4 | r:4 ab5:8 ab5:8 g5:8 gb5:8 f5:4 | -:2. r:4 |'
       'r:4 bb5:8 bb5:8 c6:8 d6:8 f6:4 | -:2. r:4 | r:4 eb5:8 f5:8 g5:4 ab5:4 | g5:2. r:4')
P_A2 = ('r:4 g5:8 g5:8 gb5:8 f5:8 eb5:4 | -:2. r:4 | r:4 ab5:8 ab5:8 g5:8 gb5:8 f5:4 | -:2. r:4 |'
        'r:4 bb5:8 bb5:8 c6:8 d6:8 f6:4 | -:2. r:4 | r:4 f5:8 g5:8 ab5:4 f5:4 | eb5:2. r:4')
P_B = ('c5:2. b4:4 | bb4:2 r:2 | bb4:1 | r:4 bb4:4 db5:4 e5:4 |'
       'f5:2. r:4 | g5:2 f5:2 | g5:2 a5:2 | ab5:2 gb5:2')
P_A3 = 'r:4 g5:8 g5:8 gb5:8 f5:8 eb5:4 | -:2. r:4 | r:4 f5:8 g5:8 ab5:4 f5:4 | eb5:2. r:4'
P_CH_A = 'Ebmaj9 | Cm9 | Fm9 | Bb13 | Gm7 | Cm9 | Fm9 Bb13 | Ebmaj9'
P_CH_A2 = 'Ebmaj9 | Cm9 | Fm9 | Bb13 | Gm7 | Cm9 | Abm9 Db13 | Ebmaj9'
P_CH_B = 'Abmaj9 | Abm9 Db13 | Gm9 | C7b9 | Fm9 | Bb13 | Ebmaj9/G Gbdim7 | Fm9 Bb7#5'
P_CH_A3 = 'Ebmaj9 | Cm9 | Fm9 Bb13 | Ebmaj9'


@song('aud11')
def aud11(v):
    s = Song('aud11', bpm=116, swing=.64, title='Audition 11 - Porchlight', room=1.9, key='Eb')
    s.no_push = True
    s.section('I', 2, 'Fm9 | E7#11', intro=True)
    s.no_push = True
    s.section('A', 8, P_CH_A); s.section('A2', 8, P_CH_A2); s.section('B', 8, P_CH_B); s.section('A3', 4, P_CH_A3)
    s.section('T', 2, 'Fm9 | E7#11')
    s.sec['B'].key = 'Ab'
    ld = s.part('lead', MUTETPT, rev=.36, delay=.08); ld.autovib = True
    ld.write('A', P_A, transpose=-12, vel=92); ld.write('A2', P_A2, transpose=-12, vel=94); ld.write('A3', P_A3, transpose=-12, vel=94)
    ld.write('T', 'r:1 | r:1', vel=80)
    cl = s.part('clarinet', CLARINET, rev=.4, role='lead', pan=-.15); cl.autovib = True
    cl.write('B', P_B, transpose=-12, vel=90)
    pn = s.part('piano', PIANO, rev=.3, role='comp', pan=.2)
    pn.gen('I A A2 B A3 T', comp, style='swingcomp', lo=52, hi=72, n=4, vel=56)
    vb = s.part('vibes', VIBES, rev=.45, role='counter', pan=.35)   # fills the held bars of A2 with the slide, softly
    vb.write('A2', 'r:1 | r:4 g5:8 f5:8 eb5:4 r:4 | r:1 | r:4 d6:8 c6:8 bb5:4 r:4 | r:1 | r:4 bb5:8 a5:8 g5:4 r:4 | r:1 | r:1', vel=54)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 A3 T', bass_line, style='walk', vel=86)
    bs.gen('B', bass_line, style='two', vel=82)
    dr = s.drums(kit=KIT_JAZZ, rev=.18, vol=-2)
    dr.gen('A A2 A3 T', groove, name='ride', fills=8, fill='brush', vel=64, crash=False)
    dr.gen('B', groove, name='brush', fills=8, fill='brush', vel=56, crash=False)
    return s


# ============================================================================ 12  HARBOR HOP (J-pop jazz)
# D major, 122, straight eighths over IVmaj7 - III7 - VIm7. Hook: a knock and a run up the Gmaj9 (B B D E F# A)
# whose top note rises a semitone onto the next downbeat (A -> A#, the 3rd of F#7b9); sequenced a step up
# (C# C# E F# G# B -> C over Am9/D13, the same chromatic step); the third time climbs to D6 and peaks on E6.
# B (strings, F major) keeps the knock and the chromatic step in half notes.
H_A = ('b4:8 b4:8 d5:4 e5:8 f#5:8 a5:4 | a#5:2. r:4 | c#5:8 c#5:8 e5:4 f#5:8 g#5:8 b5:4 | c6:2. r:4 |'
       'd5:8 d5:8 f#5:4 a5:8 b5:8 d6:4 | e6:2 c#6:4 a5:4 | f#5:4 e5:4 d#5:4 c6:4 | b5:2 g5:4 e5:4')
H_A2 = ('b4:8 b4:8 d5:4 e5:8 f#5:8 a5:4 | a#5:2. r:4 | c#5:8 c#5:8 e5:4 f#5:8 g#5:8 b5:4 | c6:2. r:4 |'
        'd5:8 d5:8 f#5:4 a5:8 b5:8 d6:4 | e6:2 c#6:4 a5:4 | b5:4 a5:4 g5:4 e5:4 | d5:2. r:4')
H_B = ('d5:4 d5:4 f5:2 | e5:2. r:4 | c5:4 c5:4 e5:2 | f5:2. r:4 |'
       'bb4:4 bb4:4 d5:2 | e5:2. r:4 | g5:4 f#5:4 e5:4 d5:4 | c#5:2 f5:2')
H_A3 = 'b4:8 b4:8 d5:4 e5:8 f#5:8 a5:4 | a#5:2. r:4 | b5:4 a5:4 g5:4 e5:4 | d5:2. r:4'
H_CH_A = 'Gmaj9 | F#7b9 | Bm9 | Am9 D13 | Gmaj9 | A13 | F#m7 B7b9 | Em9 A13'
H_CH_A2 = 'Gmaj9 | F#7b9 | Bm9 | Am9 D13 | Gmaj9 | A13 | Em9 A13 | Dmaj9'
H_CH_B = 'Bbmaj9 | C9 | Am7 | Dm9 | Gm9 | C13 | Em9 | A7#5'
H_CH_A3 = 'Gmaj9 | F#7b9 | Em9 A13 | Dmaj9'


@song('aud12')
def aud12(v):
    s = Song('aud12', bpm=122, title='Audition 12 - Harbor Hop', room=1.7, key='D')
    s.no_push = True
    s.section('I', 4, 'Em9 | Eb7#11 | Dmaj9 | D7#5', intro=True)
    s.no_push = True
    s.section('A', 8, H_CH_A); s.section('A2', 8, H_CH_A2); s.section('B', 8, H_CH_B); s.section('A3', 4, H_CH_A3)
    s.section('T', 2, 'Dmaj9 | D7#5')
    s.sec['B'].key = 'F'
    ld = s.part('lead', EPIANO, rev=.3, delay=.1, layer=[VIBES], chorus=.3); ld.layer_gain = .55
    ld.write('A', H_A, vel=94); ld.write('A2', H_A2, vel=96); ld.write('A3', H_A3, vel=96); ld.write('T', 'r:1 | r:1', vel=80)
    vn = s.part('strings_lead', VIOLIN, rev=.42, role='lead', pan=-.1, layer=[STRINGS]); vn.autovib = True; vn.layer_gain = .5
    vn.write('B', H_B, vel=90)
    pn = s.part('piano', PIANO, rev=.26, role='comp', pan=.2)
    pn.gen('I A A2 A3 T', comp, style='stabs', pattern='-..x..x...x.x...', lo=54, hi=74, n=4, vel=56)
    pn.gen('B', comp, style='charleston', lo=52, hi=72, n=4, vel=50)
    st = s.part('strings', STRINGS, rev=.44, role='pad', width=1.25)
    st.gen('A2 B A3', pads, lo=55, hi=76, n=3, vel=42, spread=False)
    bs = s.part('bass', FINGERBASS, rev=.06)
    bs.gen('I A A2 B A3 T', bass_line, style='pop8', vel=86, stacc=True)
    dr = s.drums(kit=KIT_STD, rev=.16, vol=-4)
    dr.gen('A A2 B A3 T', groove, name='city', fills=8, fill='snare', vel=70, crash=False, hat_vel=.5)
    return s


# ============================================================================ 13  LANTERN (3/4 lullaby)
# G major, 3/4 at 96, piano and strings. Fallen Down's shape: a line that sighs down with a turn up and
# settles on a long note (D-B-A | G-F#-A | B held). Sequenced a step up over Am9 / D13; the third time starts
# high (E6) and climbs to a held F#6, the peak; the fourth closes. B is a cello in Eb (bVI), long notes.
L_A = ('d6:4 b5:4 a5:4 | g5:4 f#5:4 a5:4 | b5:2. | -:2 r:4 |'
       'e6:4 c6:4 b5:4 | a5:4 g5:4 b5:4 | c6:2. | -:2 r:4 |'
       'e6:4 d6:4 b5:4 | c#6:4 d6:4 e6:4 | f#6:2. | -:2 r:4 |'
       'e6:4 d6:4 b5:4 | a5:4 g5:4 f#5:4 | g5:2. | -:2 r:4')
L_B = ('bb4:2 g4:4 | f5:2. | eb5:2 c5:4 | d5:2. | c5:2 ab4:4 | g4:2. | a4:2. | c5:2 f#4:4')
L_CH_A = ('Gmaj9 | Em9 | Cmaj9 | Cmaj9 | Am9 | D13 | Cmaj9 | D13sus4 | Em9 | A13 | Bm9 | D13 |'
          'Am9 | D13 | Gmaj9 | Gmaj9')
L_CH_B = 'Ebmaj9 | Ebmaj9 | Cm9 | Cm9 | Abmaj9 | Abmaj9 | D13sus4 | D7b9'


@song('aud13')
def aud13(v):
    s = Song('aud13', bpm=96, bar=3, title='Audition 13 - Lantern', room=2.1, key='G')
    s.no_push = True
    s.section('I', 2, 'Cmaj9 | D13sus4', intro=True)
    s.no_push = True
    s.section('A', 16, L_CH_A); s.section('A2', 16, L_CH_A); s.section('B', 8, L_CH_B)
    s.section('T', 2, 'Cmaj9 | D13sus4')
    s.sec['B'].key = 'Eb'
    ld = s.part('lead', PIANO, rev=.34, delay=.06); ld.write('A', L_A, vel=84)
    fl = s.part('flute', FLUTE, rev=.38, role='lead', pan=.1); fl.autovib = True
    fl.write('A2', L_A, vel=80)
    vc = s.part('cello', CELLO, rev=.42, role='lead', pan=-.1); vc.autovib = True
    vc.write('B', L_B, vel=90)
    hp = s.part('harp', HARP, rev=.4, role='arp', pan=-.25)
    hp.gen('I A A2 T', comp, style='arp', arp='up8', lo=48, hi=72, vel=42)
    st = s.part('strings', SLOWSTR, rev=.45, role='pad', width=1.3)
    st.gen('A2 B T', pads, lo=52, hi=72, n=3, vel=42, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 B T', bass_line, style='custom', pattern=[(0, 2.6, '1'), (3, 2.6, '5')], vel=76)
    return s
