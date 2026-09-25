"""Hometown-theme auditions, round 8 (SOLMERE_AUDITION=1): melody first, harmony after.

Round 7: Little Waltz "sounds like a human melody ... solid phrasing!" Bossa Lane "a little more off": its
melody notes had been picked as colour tones to fit the chords. "The melody should direct the harmony ...
colour notes are more than welcome, they just can't be chosen to fit." Also: no 8th-rest + three-8ths starts,
fewer phrases landing on the tonic (without bending a stock line to avoid it), and more sophistication in the
composition as a whole.

So each tune below was written alone, by ear, as a line (none of its phrases end on 1); the chords were found
under it afterwards; and when the tune comes round again (A2) the same melody sits on new chords, a
reharmonisation led by the tune. The bass lines move (a line cliche in Rooftop), the answers in the holds
are soft, and the middle sections are new lines in other keys.

  28 Evening Waltz  Eb, 3/4        the waltz again, new tune; A2 reharmonised (Cm9, Dbmaj7...), B in C minor
  29 Rooftop        G, 4/4, 96     over a bass that walks down G-F#-E-D; A2 reharmonised; B in E minor
  30 Bossa Street   Bb, bossa      melody first this time; A2 on a backdoor turnaround; B in Gb
"""
from mfw import *


# ============================================================================ 28  EVENING WALTZ
EW_A = ('r:4 g5:2 | f5:8 eb5:8 f5:4 bb4:4 | c5:4. d5:8 eb5:4 | d5:2. |'
        'r:4 ab5:2 | g5:8 f5:8 g5:4 c5:4 | d5:4. eb5:8 f5:4 | g5:2. |'
        'r:4 bb5:4 c6:4 | bb5:4. ab5:8 g5:4 | f5:4 g5:4 ab5:4 | c6:2 bb5:4 |'
        'r:4 g5:4 f5:4 | eb5:4. d5:8 c5:4 | bb4:4 c5:4 d5:4 | f5:2.')
EW_CH_A = ('Ebmaj7 | Bb/D | Cm9 | G7 | Abmaj7 | Fm9 | Bb7 | Gm7 |'
           'C7 | Fm7 | Bb13 | Abmaj7 | Cm7 | F7 | Bb7 | Abm6')
EW_CH_A2 = ('Cm9 | Fm7 | Abmaj7 | Bb13 | Dbmaj7 | Cm7 | Bb7 | Ebmaj7 |'
            'Gm7:2 C7:1 | Fm9 | Bb13 | Abmaj9 | Gm7 | Cm7:2 F7:1 | Bb7 | Abm6')
EW_B = 'c4:2 d4:4 | eb4:2. | f4:4 eb4:4 d4:4 | g3:2. | c4:2 d4:4 | eb4:4 f4:4 g4:4 | ab4:2 g4:4 | f4:2.'
EW_CH_B = 'Cm9 | Abmaj7 | Bb7sus4:2 Bb7:1 | G7 | Cm9 | Fm9 | Abmaj7 | Bb7sus4'
EW_ANS_A2 = ('r:2. | r:2. | r:2. | r:4 f5:4 ab5:4 | r:2. | r:2. | r:2. | r:4 bb4:4 d5:4 |'
             'r:2. | r:2. | r:2. | r:2. | r:2. | r:2. | r:2. | r:4 cb5:4 eb5:4')


@song('aud28')
def aud28(v):
    s = Song('aud28', bpm=96, bar=3, title='Audition 28 - Evening Waltz', room=2.0, key='Eb')
    s.no_push = True
    s.section('I', 2, 'Abmaj7 | Bb7sus4', intro=True)
    s.no_push = True
    s.section('A', 16, EW_CH_A); s.section('A2', 16, EW_CH_A2); s.section('B', 8, EW_CH_B)
    s.section('T', 2, 'Abmaj7 | Bb7sus4')
    s.sec['B'].key = 'Eb'
    ld = s.part('lead', OCARINA, rev=.4, delay=.1); ld.autovib = True
    ld.write('A', EW_A, vel=86); ld.write('A2', EW_A, vel=88)
    fl = s.part('flute', FLUTE, rev=.42, role='counter', pan=.18)
    fl.write('A2', EW_ANS_A2, vel=52)
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


# ============================================================================ 29  ROOFTOP
RT_A = ('d5:2. e5:4 | g5:4 f#5:4 d5:2 | b4:4. c5:8 d5:4 e5:4 | a4:2. r:4 |'
        'd5:2. e5:4 | b5:4 a5:4 e5:2 | f#5:4. g5:8 a5:4 d5:4 | e5:2. r:4 |'
        'c6:2 b5:4 a5:4 | g5:4. f#5:8 e5:2 | a5:2 g5:4 e5:4 | f#5:2. r:4 |'
        'd5:2. e5:4 | g5:4 f#5:4 b5:2 | a5:4. g5:8 e5:4 d5:4 | e5:2. r:4')
RT_CH_A = ('Gmaj7 | D/F# | Em7 | D9sus4 | Bm7 | Cmaj7 | D7 | Em7 |'
           'Am9 | D7sus4 D9 | C6 | B7 | Em7 | Cmaj7 | Am7 D7 | Cmaj7')
RT_CH_A2 = ('Gmaj7 | D/F# | Em7 | D9sus4 | G/B | Am9 | D7 | C#m7b5 |'
            'Am9 | D7sus4 D9 | C6 | F#7 | Em7 | Cmaj7 | Am7 D7 | Am7')
RT_BASS_A = ('g2:2. f#2:4 | f#2:2. e2:4 | e2:2. d2:4 | d2:1 | b1:2. b1:4 | c2:2. c2:4 | d2:2. d2:4 | e2:2. e2:4 |'
             'a1:2. a1:4 | d2:2 d2:2 | c2:2. c2:4 | b1:2. b1:4 | e2:2. e2:4 | c2:2. c2:4 | a1:2 d2:2 | c2:2. d2:4')
RT_BASS_A2 = ('g2:2. f#2:4 | f#2:2. e2:4 | e2:2. d2:4 | d2:1 | b1:2. b1:4 | a1:2. a1:4 | d2:2. d2:4 | c#2:2. c#2:4 |'
              'a1:2. a1:4 | d2:2 d2:2 | c2:2. c2:4 | f#1:2. f#1:4 | e2:2. e2:4 | c2:2. c2:4 | a1:2 d2:2 | a1:2. d2:4')
RT_B = ('b4:2 c5:4 d5:4 | e5:2. d5:4 | c5:4 b4:4 a4:4 g4:4 | f#4:2. r:4 |'
        'b4:2 c5:4 d5:4 | f5:2. e5:4 | d5:4 c5:4 b4:4 a4:4 | b4:2. r:4')
RT_CH_B = 'Em7 | Cmaj7 | Am7 | B7 | Em7 | Dm9 | G7 | B7'
RT_ANS_A2 = 'r:1 | r:1 | r:1 | r:2 e4:4 g4:4 | r:1 | r:1 | r:1 | r:2 g4:4 b4:4 | r:1 | r:1 | r:1 | r:2 e4:4 f#4:4 | r:1 | r:1 | r:1 | r:1'


@song('aud29')
def aud29(v):
    s = Song('aud29', bpm=96, swing=.52, title='Audition 29 - Rooftop', room=1.8, key='G')
    s.no_push = True
    s.section('I', 2, 'Cmaj7 | D9sus4', intro=True)
    s.no_push = True
    s.section('A', 16, RT_CH_A); s.section('A2', 16, RT_CH_A2); s.section('B', 8, RT_CH_B)
    s.section('T', 2, 'Cmaj7 | D9sus4')
    s.sec['B'].key = 'G'
    ld = s.part('lead', FLUTE, rev=.36, delay=.1); ld.autovib = True
    ld.write('A', RT_A, vel=86); ld.write('A2', RT_A, vel=88)
    ct = s.part('counter', CLARINET, rev=.4, role='counter', pan=-.2)
    ct.write('A2', RT_ANS_A2, vel=48)
    cl = s.part('clarinet', CLARINET, rev=.4, role='lead', pan=-.1); cl.autovib = True
    cl.write('B', RT_B, vel=86)
    pn = s.part('piano', PIANO, rev=.32, role='comp', pan=.15)
    pn.gen('I A A2 B T', comp, style='pulse4', lo=52, hi=69, n=4, vel=38)
    st = s.part('strings', STRINGS, rev=.45, role='pad', width=1.2)
    st.gen('A2 B', pads, lo=55, hi=72, n=3, vel=28, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.write('I', 'c2:2. c2:4 | d2:1', vel=78)
    bs.write('A', RT_BASS_A, vel=80); bs.write('A2', RT_BASS_A2, vel=80)
    bs.gen('B', bass_line, style='two', vel=78)
    bs.write('T', 'c2:2. c2:4 | d2:1', vel=78)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-6)
    dr.gen('A2 B T', groove, name='brush', fills=8, fill='brush', vel=44, crash=False)
    return s


# ============================================================================ 30  BOSSA STREET
BS_A = ('f5:2. g5:4 | a5:2 g5:2 | f5:4 d5:4 c5:2 | d5:1 |'
        'r:4 bb4:4 c5:4 d5:4 | f5:2 eb5:4 d5:4 | c5:2. bb4:4 | c5:1 |'
        'f5:2. g5:4 | a5:2 c6:2 | bb5:4 a5:4 g5:2 | f5:1 |'
        'r:4 d5:4 eb5:4 f5:4 | g5:2 f5:4 eb5:4 | d5:2 eb5:2 | c5:1')
BS_CH_A = ('Bbmaj7 | Gm9 | Dm7 | G7 | Cm7 | F7 | Cm7 | F7sus4 |'
           'Bbmaj7 | Dm7 | Gm7 | Bb6/F | Bb7 | Ebmaj7 | Bb/D Ebm6 | F7sus4')
BS_CH_A2 = ('Bbmaj7 | Gm9 | Dm7 | Dm7 G7 | Cm7 | F7 | Cm7 | Cm7 F7 |'
            'Bbmaj7 | Dm7 | Gm7 | Dm7 | Bb7 | Ebmaj7 | Bb/D Ebm6 | Ab7')
BS_B = 'bb4:2. ab4:4 | gb4:1 | ab4:2 bb4:2 | db5:1 | eb5:2. db5:4 | bb4:1 | c5:2 d5:2 | f5:1'
BS_CH_B = 'Gbmaj7 | Ebm7 | Abm7 | Db7 | Cbmaj7 | Bbm7 | Cm7 F13 | F7sus4'


@song('aud30')
def aud30(v):
    s = Song('aud30', bpm=120, title='Audition 30 - Bossa Street', room=1.8, key='Bb')
    s.no_push = True
    s.section('I', 2, 'Cm7 | F7sus4', intro=True)
    s.no_push = True
    s.section('A', 16, BS_CH_A); s.section('A2', 16, BS_CH_A2); s.section('B', 8, BS_CH_B)
    s.section('T', 2, 'Cm7 | F7sus4')
    s.sec['B'].key = 'Gb'
    ld = s.part('lead', FLUTE, rev=.34, delay=.1); ld.autovib = True
    ld.write('A', BS_A, vel=86); ld.write('A2', BS_A, vel=88)
    tp = s.part('trumpet', MUTETPT, rev=.4, role='lead', pan=-.1); tp.autovib = True
    tp.write('B', BS_B, vel=88)
    gt = s.part('guitar', NYLON, rev=.28, role='comp', pan=-.25)
    gt.gen('I A A2 B T', comp, style='bossa', lo=50, hi=67, n=4, vel=56, strum=.012)
    ep = s.part('keys', EPIANO, rev=.4, role='pad', pan=.25, chorus=.35)
    ep.gen('A2 B', pads, lo=55, hi=72, n=3, vel=28, spread=False)
    bs = s.part('bass', ACBASS, rev=.06)
    bs.gen('I A A2 B T', bass_line, style='bossa', vel=80)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-4)
    dr.gen('A A2 B T', groove, name='bossa', fills=0, vel=52, crash=False, hat_vel=.42)
    return s
