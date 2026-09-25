"""Hometown-theme auditions, round 6 (SOLMERE_AUDITION=1): the tune inside a band that talks back.

Round 5 was "a nursery rhyme ... overdone ... needs to be significantly more sophisticated, in composition,
interplay of harmonies and parts, and melody". craft.py / parts.py / score.py on Platinum, HGSS and Undertale
showed what ours lacked (see the skill's measurements): 2-3 other melodic parts under every tune (a voice in
3rds/6ths, an inner ostinato with chromatic neighbours, a countermelody in the tune's gaps, a bass with its
own line), about two thirds of melody onsets off the beat, chromatic neighbours and slides, appoggiaturas,
and repetition that comes back altered. Every part below is written by hand; the harmony runs on a moving
(often chromatic) bass. Nothing is repeated three times the same way.

  22 Harbor Morning           new; Twinleaf's craft (F, 116, light swing)
  23 Letter Home, arranged    the round-4 melody you liked, with a real band around it (D, 3/4)
  24 Clocktower Lane          new; Eterna's craft (D, swing 120)
"""
from mfw import *

NAMES = ['c', 'c#', 'd', 'eb', 'e', 'f', 'f#', 'g', 'ab', 'a', 'bb', 'b']


def nm(p): return NAMES[p % 12] + str(p // 12 - 1)


def ostinato(pairs, beats=4):
    """an inner figure per bar: the chord note x with its lower chromatic neighbour, then y (another chord
    tone), in eighths: x x-1 x y ...; pairs = [(x, y), ...] as MIDI numbers"""
    bars = []
    for x, y in pairs:
        cell = [x, x - 1, x, y]
        seq = (cell * 2)[:beats * 2]
        bars.append(' '.join(nm(p) + ':8' for p in seq))
    return ' | '.join(bars)


# ============================================================================ 22  HARBOR MORNING
# F major. The bass walks down F-E-D-Db-C by step under the first four bars (a line cliche), so the same
# melody note keeps changing colour. The tune is stepwise and syncopated: it starts after the beat, sits on
# the and-of-2, leans through a chromatic neighbour (the B natural over Dm9) and slips onto Ab ahead of the
# Db chord (an anticipation). Bar 5 is bar 1 a step up, not the same notes. A2 comes back with its rhythm
# moved and a higher reach, and a second voice shadows it in 3rds. The marimba ostinato keeps moving under
# every held note. B: a clarinet line in D minor with an appoggiatura (F over A7, falling to E); the flute
# answers in its gaps.
HM_CH_A = 'Fmaj9 | C13/E | Dm13 | Dbmaj7#11 | Gm9 | C13 | Am7 D7b9 | Gm9 C13'
HM_CH_A2 = 'Fmaj9 | C13/E | Dm13 | Dbmaj7#11 | Gm9 | C13 | Gm9 C13 | Fmaj9'
HM_CH_B = 'Bbmaj9 | A7b13 | Dm9 | G13 | Gm9 | Em7b5 A7b9 | Dm9 G13 | Gm9 C13'
HM_A = ('r:4 a4:8 c5:8 f5:4. e5:8 | -:8 d5:8 e5:8 g5:8 bb5:4 a5:4 | r:8 a5:8 c6:4 b5:8 c6:4 ab5:8 |'
        '-:4 g5:8 f5:8 c5:2 | r:4 bb4:8 d5:8 g5:4. f5:8 | -:8 e5:8 f5:8 a5:8 d6:4 c6:4 |'
        'r:8 e6:8 d6:8 c6:8 a5:8 f#5:8 eb5:4 | d5:2. r:4')
HM_A2 = ('r:4 a4:8 c5:8 f5:4. e5:8 | -:8 d5:8 e5:8 g5:8 bb5:4. a5:8 | r:8 a5:8 c6:4 b5:8 d6:4 ab5:8 |'
         '-:4 g5:8 f5:8 c5:2 | r:4 bb4:8 d5:8 g5:4. f5:8 | -:8 e5:8 f5:8 a5:8 e6:4 d6:4 |'
         'r:8 d6:8 bb5:8 a5:8 g5:8 e5:8 c5:4 | f5/:2. r:4')
HM_HARM_A2 = ('r:4 f4:8 a4:8 d5:4. c5:8 | -:8 bb4:8 c5:8 e5:8 g5:4. f5:8 | r:1 | r:1 |'
              'r:4 g4:8 bb4:8 d5:4. d5:8 | -:8 c5:8 d5:8 f5:8 c6:4 bb5:4 | r:1 | a4:2. r:4')
HM_OST_A = ostinato([(72, 69), (67, 64), (69, 65), (68, 65), (74, 70), (67, 64), (69, 72), (67, 70)])
HM_OST_A2 = ostinato([(72, 69), (67, 64), (69, 65), (68, 65), (74, 70), (67, 64), (67, 70), (72, 69)])
HM_BASS_A = 'f2:2 c3:4. e2:8 | e2:2. d2:4 | d2:2. db2:4 | db2:2. ab2:4 | g2:2 bb2:4 b2:4 | c3:2. bb2:4 | a2:2 d2:2 | g2:2 c2:2'
HM_BASS_A2 = 'f2:2 c3:4. e2:8 | e2:2. d2:4 | d2:2. db2:4 | db2:2. ab2:4 | g2:2 bb2:4 b2:4 | c3:2. bb2:4 | g2:2 c2:2 | f2:2. c2:4'
HM_BASS_B = 'bb1:2. a1:4 | a1:2. c#2:4 | d2:2. c2:4 | b1:2. g1:4 | g1:2. bb1:4 | e2:2 a1:2 | d2:2 g1:2 | g1:2 c2:2'
HM_B = ('d5:2. c5:8 d5:8 | f5:2 e5:2 | a4:2. r:8 a4:8 | b4:4. c5:8 d5:4 e5:4 |'
        'f5:2. e5:8 f5:8 | g5:2 f5:4 e5:4 | d5:2 b4:2 | bb4:2 e5:4 r:4')
HM_B_FL = 'r:1 | r:2. a5:8 g5:8 | f5:4 r:2. | r:1 | r:1 | r:2. c#6:8 bb5:8 | a5:4 r:2. | r:1'


@song('aud22')
def aud22(v):
    s = Song('aud22', bpm=116, swing=.56, title='Audition 22 - Harbor Morning', room=1.8, key='F')
    s.no_push = True
    s.section('I', 2, 'Gm9 | C13sus4 C13', intro=True)
    s.no_push = True
    s.section('A', 8, HM_CH_A); s.section('A2', 8, HM_CH_A2); s.section('B', 8, HM_CH_B)
    s.section('T', 2, 'Gm9 | C13sus4 C13')
    s.sec['B'].key = 'F'
    ld = s.part('lead', FLUTE, rev=.34, delay=.14); ld.autovib = True
    ld.write('A', HM_A, vel=88); ld.write('A2', HM_A2, vel=90); ld.write('B', HM_B_FL, vel=80)
    hv = s.part('harmony', CLARINET, rev=.36, role='counter', pan=-.18)
    hv.write('A2', HM_HARM_A2, vel=64)
    cl = s.part('clarinet', CLARINET, rev=.4, role='lead', pan=-.12); cl.autovib = True
    cl.write('B', HM_B, vel=88)
    # (the marimba ostinato was cut after round-6 feedback: too present, too busy)
    pn = s.part('piano', PIANO, rev=.3, role='comp', pan=.12)
    pn.gen('I A A2 B T', comp, style='charleston', lo=53, hi=70, n=4, vel=46)
    st = s.part('strings', STRINGS, rev=.44, role='pad', width=1.2)
    st.gen('A2 B', pads, lo=55, hi=74, n=3, vel=34, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.write('I', 'g2:2 bb2:4 b2:4 | c3:2 c2:2', vel=82)
    bs.write('A', HM_BASS_A, vel=84); bs.write('A2', HM_BASS_A2, vel=84); bs.write('B', HM_BASS_B, vel=80)
    bs.write('T', 'g2:2 bb2:4 b2:4 | c3:2 c2:2', vel=82)
    dr = s.drums(kit=KIT_BRUSH, rev=.18, vol=-4)
    dr.gen('A A2 B T', groove, name='brush', fills=8, fill='brush', vel=52, crash=False)
    return s


# ============================================================================ 23  LETTER HOME, ARRANGED
# The round-4 melody (the parts that worked), touched only where it helps: an appoggiatura at two arrivals
# (C natural leaning onto B over Gmaj9 and over Em9, the bVII colour), a pickup before the second line. The
# band now answers it: the bass walks D-C#-B-A-G down under the first line and takes a Bb in the minor turn;
# a cello replies in the long notes; the second time a flute shadows the first line a 3rd or 6th below.
LA_CH_A = ('Dmaj9 | Dmaj9/C# | Bm9 | Bm9/A | Gmaj9 | A13 | F#m7 | B7b9 | Em9 | Em9/D | Gm6/Bb | Gm6/A |'
           'F#m11 | B9 | Em9 | A13sus4')
LA_CH_A2 = ('Dmaj9 | Dmaj9/C# | Bm9 | Bm9/A | Gmaj9 | A13 | F#m7 | B7b9 | Em9 | Em9/D | Gm6/Bb | Gm6/A |'
            'F#m11 | B9 | Em9:2 A13:1 | Dmaj9')
LA_CH_B = 'Bbmaj9 | Bbmaj9/A | Gm9 | Gm9/F | Ebmaj9 | Ebmaj9 | Em7b5 | A7b9'
LA_A = ('a5:2 f#5:4 | -:2 e5:4 | b5:2 a5:4 | d6:2 c#6:4 | c6:4 b5:2 | r:4 r:8 d5:8 e5:4 | a5:2 f#5:4 | f#5:2 d#5:4 |'
        'g5:2 f#5:4 | c6:4 b5:2 | r:4 d6:4 d6:4 | d6:2 bb5:8 a5:8 | c#6:2 b5:4 | d#6:2 c#6:4 | e6:2. | -:2 r:4')
LA_A2 = ('a5:2 f#5:4 | -:2 e5:4 | b5:2 a5:4 | d6:2 c#6:4 | c6:4 b5:2 | r:4 r:8 d5:8 e5:4 | a5:2 f#5:4 | f#5:2 d#5:4 |'
         'g5:2 f#5:4 | c6:4 b5:2 | r:4 d6:4 d6:4 | d6:2 bb5:8 a5:8 | c#6:2 b5:4 | d#6:2 c#6:4 | e6:2 c#6:4 | d6:2 r:4')
LA_SHADOW_A2 = ('f#5:2 a4:4 | -:2 c#5:4 | d5:2 c#5:4 | f#5:2 a5:4 | a5:4 g5:2 | r:2. | r:2. | r:2. |'
                'r:2. | r:2. | r:2. | r:2. | r:2. | r:2. | r:2. | r:2.')
LA_CELLO_A = ('r:2. | r:4 a3:4 f#3:4 | r:2. | r:2. | r:4 d4:4 c#4:4 | b3:2 r:4 | r:2. | r:2. |'
              'r:2. | r:4 b3:4 d4:4 | r:2. | r:2. | r:2. | r:2. | r:4 b3:4 d4:4 | e4:2 r:4')
LA_BASS_A = 'd2:2. | c#2:2. | b1:2. | a1:2. | g1:2. | a1:2. | f#1:2. | b1:2. | e2:2. | d2:2. | bb1:2. | a1:2. | f#1:2. | b1:2. | e2:2. | a1:2.'
LA_BASS_A2 = 'd2:2. | c#2:2. | b1:2. | a1:2. | g1:2. | a1:2. | f#1:2. | b1:2. | e2:2. | d2:2. | bb1:2. | a1:2. | f#1:2. | b1:2. | e2:2 a1:4 | d2:2.'
LA_B = 'f4:2 d4:4 | -:2 c4:4 | g4:2 f4:4 | bb4:2 a4:4 | g4:2. | r:4 bb4:4 c5:4 | d5:2 bb4:4 | c#5:2 a4:4'
LA_B_OC = 'r:2. | r:4 e5:4 d5:4 | r:2. | r:4 d5:4 bb4:4 | r:2. | r:2. | r:2. | r:4 r:8 d5:8 e5:4'
LA_BASS_B = 'bb1:2. | a1:2. | g1:2. | f1:2. | eb2:2. | d2:2. | e2:2. | a1:2.'


@song('aud23')
def aud23(v):
    s = Song('aud23', bpm=100, bar=3, title='Audition 23 - Letter Home, arranged', room=2.1, key='D')
    s.no_push = True
    s.section('I', 2, 'Gmaj9 | A13sus4', intro=True)
    s.no_push = True
    s.section('A', 16, LA_CH_A); s.section('A2', 16, LA_CH_A2); s.section('B', 8, LA_CH_B)
    s.section('T', 2, 'Gmaj9 | A13sus4')
    s.sec['B'].key = 'Bb'
    ld = s.part('lead', OCARINA, rev=.4, delay=.1); ld.autovib = True
    ld.write('A', LA_A, vel=86); ld.write('A2', LA_A2, vel=88); ld.write('B', LA_B_OC, vel=76)
    fl = s.part('flute', FLUTE, rev=.4, role='counter', pan=.14)
    fl.write('A2', LA_SHADOW_A2, vel=62)
    vc = s.part('cello', CELLO, rev=.42, role='counter', pan=-.12); vc.autovib = True
    vc.write('A', LA_CELLO_A, vel=70); vc.write('A2', LA_CELLO_A, vel=66)
    vl = s.part('cello_b', CELLO, rev=.42, role='lead', pan=-.1); vl.autovib = True
    vl.write('B', LA_B, vel=90)
    hp = s.part('harp', HARP, rev=.4, role='arp', pan=-.25)
    hp.gen('I A A2 B T', comp, style='arp', arp='up8', lo=52, hi=74, vel=38)
    gt = s.part('guitar', NYLON, rev=.3, role='comp', pan=.25)
    gt.gen('A2 B', comp, style='waltz', lo=52, hi=67, n=3, vel=40)
    st = s.part('strings', SLOWSTR, rev=.45, role='pad', width=1.3)
    st.gen('A2 B T', pads, lo=55, hi=72, n=3, vel=34, spread=False)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.write('I', 'g1:2. | a1:2.', vel=78)
    bs.write('A', LA_BASS_A, vel=78); bs.write('A2', LA_BASS_A2, vel=78); bs.write('B', LA_BASS_B, vel=76)
    bs.write('T', 'g1:2. | a1:2.', vel=78)
    dr = s.drums(kit=KIT_BRUSH, rev=.2, vol=-7)
    dr.gen('A2', groove, name='waltz', fills=16, fill='brush', vel=40, crash=False)
    return s


# ============================================================================ 24  CLOCKTOWER LANE
# D major, swung. Eterna's craft: one busy run that slides (a scoop) onto a long note, and the long note is
# held while a vibes ostinato keeps turning underneath and the chord changes colour under it (F#6 is the
# 5th of Bm9, then the maj7 of Gmaj9). A borrowed Bb over Gm6; the b9 (C over B7b9) leaning onto B. A2
# reaches higher at once and a clarinet joins in 3rds for three bars. B: a muted trumpet takes a lower, slower
# line in Bb; the flute answers only in its holds.
CT_CH_A = 'Dmaj9 | Dmaj9 | F#m7 | Bm9 | Gmaj9 | Gm6 | F#m7 B7b9 | Em9 A13'
CT_CH_A2 = 'Dmaj9 | Dmaj9 | F#m7 | Bm9 | Gmaj9 | Gm6 | Em9 A13 | D6'
CT_CH_B = 'Bbmaj9 | Am7 D7b9 | Gmaj9 | Gm6 | F#m7 | B7b9 | Em9 | A13sus4 A13'
CT_A = ('r:8 f#5:8 a5:8 b5:8 d6:8 e6/:4. | -:2 r:4 r:8 a5:8 | b5:8 c#6:8 e6:4 d6:8 c#6:4. |'
        '-:8 b5:8 c#6:8 d6:8 f#6/:2 | -:4 e6:8 d6:8 b5:4 a5:4 | bb5:4. a5:8 g5:4 r:4 |'
        'r:8 a5:8 c#6:8 e6:8 d#6:8 c6:4. | b5:4 r:4. g5:8 f#5:8 e5:8')
CT_A2 = ('r:8 f#5:8 a5:8 c#6:8 d6:8 f#6/:4. | -:2 r:4 r:8 a5:8 | b5:8 c#6:8 e6:4 d6:8 c#6:4. |'
         '-:8 b5:8 c#6:8 d6:8 f#6/:2 | -:4 e6:8 d6:8 b5:4 a5:4 | bb5:4. a5:8 g5:4 r:4 |'
         'r:8 g5:8 b5:8 d6:8 c#6:8 a5:4. | d6/:2. r:4')
CT_HARM_A2 = ('r:1 | r:1 | g#5:8 a5:8 c#6:4 b5:8 a5:4. | -:8 f#5:8 a5:8 b5:8 d6:2 | -:4 c#6:8 b5:8 g5:4 f#5:4 |'
              'r:1 | r:1 | r:1')
CT_OST_A = ostinato([(69, 66), (69, 66), (73, 69), (66, 62), (74, 71), (74, 70), (69, 66), (67, 64)])
CT_OST_A2 = ostinato([(69, 66), (69, 66), (73, 69), (66, 62), (74, 71), (74, 70), (67, 64), (69, 66)])
CT_B = ('d5:2. c5:8 bb4:8 | a4:4. c5:8 f#5:2 | b4:2. a4:8 b4:8 | bb4:2 g4:4 r:4 |'
        'a4:2. c#5:8 e5:8 | d#5:2 c5:2 | b4:2. r:4 | e5:2 c#5:2')
CT_B_FL = 'r:1 | r:1 | r:2. d6:8 b5:8 | r:1 | r:2. c#6:8 a5:8 | r:1 | r:2 g5:8 b5:8 d6:4 | r:1'


@song('aud24')
def aud24(v):
    s = Song('aud24', bpm=120, swing=.64, title='Audition 24 - Clocktower Lane', room=1.9, key='D')
    s.no_push = True
    s.section('I', 2, 'Em9 | A13sus4 A13', intro=True)
    s.no_push = True
    s.section('A', 8, CT_CH_A); s.section('A2', 8, CT_CH_A2); s.section('B', 8, CT_CH_B)
    s.section('T', 2, 'Em9 | A13sus4 A13')
    s.sec['B'].key = 'Bb'
    ld = s.part('lead', FLUTE, rev=.34, delay=.12, layer=[VIBES]); ld.autovib = True; ld.layer_gain = .28
    ld.write('A', CT_A, vel=90); ld.write('A2', CT_A2, vel=92); ld.write('B', CT_B_FL, vel=78)
    hv = s.part('harmony', CLARINET, rev=.36, role='counter', pan=-.2)
    hv.write('A2', CT_HARM_A2, vel=62)
    tp = s.part('trumpet', MUTETPT, rev=.4, role='lead', pan=-.1); tp.autovib = True
    tp.write('B', CT_B, vel=90)
    vb = s.part('vibes', VIBES, rev=.4, role='counter', pan=.3)
    vb.write('A', CT_OST_A, vel=46); vb.write('A2', CT_OST_A2, vel=42)
    pn = s.part('piano', PIANO, rev=.3, role='comp', pan=.15)
    pn.gen('I A A2 B T', comp, style='swingcomp', lo=52, hi=70, n=4, vel=48)
    bs = s.part('bass', ACBASS, rev=.08)
    bs.gen('I A A2 T', bass_line, style='walk', vel=84)
    bs.gen('B', bass_line, style='two', vel=80)
    dr = s.drums(kit=KIT_JAZZ, rev=.18, vol=-3)
    dr.gen('A A2 T', groove, name='ride', fills=8, fill='brush', vel=60, crash=False)
    dr.gen('B', groove, name='brush', fills=8, fill='brush', vel=52, crash=False)
    return s
