"""Interior and building music."""
from mfw import *


@song('home')
def home(v):
    s = Song('home', bpm=92, swing16=.58, title='Home Sweet Home', room=1.5, loudness=-18.0)
    s.section('A', 16, 'Gmaj9 | Em9 | Cmaj9 | D7sus4 D7 | Bm7 | Em7 | Am9 | D9sus4 D7b9 | Gmaj9 | G7 | Cmaj7 | Cm6 | Bm7 E7b9 | Am9 D13 | Gmaj9 | D7sus4')
    ld = s.part('lead', FLUTE, rev=.3, delay=.1); ld.autovib = True
    ld.write('A', 'd5:4 g5:4. a5:8 b5:4 | f#5:2. d5:4 | e5:4 g5:4. a5:8 b5:4 | g5:2 f#5:2 | d5:4 f#5:4. e5:8 d5:4 | b4:2. g4:4 | c5:4 e5:4 b4:4 c5:4 | d5:2 c5:4 eb5:4 |'
                  'd5:4 g5:4. a5:8 b5:4 | d6:2. f5:4 | e5:4 g5:4 c6:4 b5:4 | eb5:2. a4:4 | d5:4 f#5:4 g#5:4 f5:4 | c5:4 b4:4 b4:4 f#5:4 | g5:2. r:4 | a4:2 c5:4 d5:4', vel=82)
    band(s, 'A', bass='two', bass_prog=ACBASS, keys=(PIANO, 'block'), guitar=(NYLON, 'arp'), kit=(KIT_BRUSH, None), pad=STRINGS, keys_vel=54)
    return s


@song('house')
def house(v):
    s = Song('house', bpm=86, title='A Neighbour\'s House', room=1.4, loudness=-18.5)
    s.section('A', 16, 'Dmaj7 | Bm7 | Gmaj7 | A7sus4 A7 | F#m7 | Bm7 | Em9 | A7sus4 A7 | Dmaj7 | D7 | Gmaj7 | Gm6 | F#m7 B7b9 | Em9 A13 | Dmaj7 | A7sus4')
    ld = s.part('lead', MUSICBOX, rev=.4, layer=[CELESTA]); ld.layer_gain = .5
    ld.write('A', 'a5:4 f#5:4 a5:4 c#6:4 | d6:2. b5:4 | b5:4 g5:4 b5:4 d6:4 | e6:2 c#6:2 | c#6:4 a5:4 f#5:4 e5:4 | d5:2. f#5:4 | g5:4 f#5:4 e5:4 b4:4 | d5:2 c#5:2 |'
                  'a5:4 f#5:4 a5:4 c#6:4 | c6:2. a5:4 | b5:4 d6:4 f#6:4 d6:4 | bb5:2. e5:4 | a5:4 c#6:4 d#6:4 c6:4 | b5:4 g5:4 f#5:4 c#6:4 | d6:2. r:4 | e5:2 g5:4 a5:4', vel=78)
    band(s, 'A', bass='two', bass_prog=FRETLESS, keys=(EPIANO, 'block'), kit=(KIT_BRUSH, None), pad=WARMPAD, keys_vel=52)
    return s


@song('lab')
def lab(v):
    s = Song('lab', bpm=116, title='Professor Hale\'s Lab', room=1.3, loudness=-17.5)
    s.section('A', 16, 'Cmaj7 | A7 | Dm7 | G7 | Em7 | A7b9 | Dm7 | G7sus4 G7 | Fmaj7 | E7 | Am7 | Gm7 C7 | Fmaj7 | Fm6 | Em7 A7 | Dm7 G7')
    ld = s.part('lead', MARIMBA, rev=.25, layer=[CLARINET]); ld.layer_gain = .6
    ld.write('A', 'e5:8 g5:8 c6:8 b5:8 g5:8 e5:8 c5:4 | c#5:8 e5:8 a5:8 g5:8 e5:8 c#5:8 a4:4 | d5:8 f5:8 a5:8 c6:8 a5:8 f5:8 d5:4 | b4:8 d5:8 f5:8 g5:8 b5:2 |'
                  'e5:8 g5:8 b5:8 d6:8 b5:8 g5:8 e5:4 | c#5:8 e5:8 g5:8 bb5:8 g5:8 e5:8 c#5:4 | f5:4 a5:4 c6:4 a5:4 | c6:2 b5:2 |'
                  'a5:8 c6:8 e6:8 c6:8 a5:8 f5:8 e5:4 | g#5:8 b5:8 d6:8 b5:8 g#5:8 e5:8 d5:4 | c6:4. b5:8 a5:4 e5:4 | bb5:4 g5:4 e5:4 bb4:4 |'
                  'a5:8 c6:8 e6:8 c6:8 a5:8 f5:8 c5:4 | ab5:8 c6:8 d6:8 c6:8 ab5:8 f5:8 d5:4 | g5:4 e5:4 c#6:4 e6:4 | f6:4 d6:4 b5:4 g5:4', vel=88)
    bn = s.part('bassoon', BASSOON, rev=.25, role='counter')
    bn.gen('A', guide_line, lo=46, hi=60, vel=76)
    pz = s.part('pizz', PIZZ, rev=.25, role='comp', pan=.3)
    pz.gen('A', comp, style='offbeat', lo=55, hi=72, n=3, vel=66)
    band(s, 'A', bass='walk', bass_prog=ACBASS, keys=(None, None), kit=(KIT_JAZZ, 'soft'), pad=None, drum_vel=78)
    return s


@song('haven')
def haven(v):
    s = Song('haven', bpm=96, swing16=.6, title='Tamer Haven', room=1.6, loudness=-18.0)
    s.section('A', 16, 'Fmaj9 | Dm9 | Gm9 | C13 | Am7 | D7b9 | Gm9 | C9sus4 C7b9 | Fmaj9 | F9 | Bbmaj9 | Bbm6 | Am7 | D7alt | Gm9 C13 | Fmaj9')
    ld = s.part('lead', VIBES, rev=.32, layer=[FLUTE]); ld.layer_gain = .5
    ld.write('A', 'c5:8 f5:8 a5:8 c6:8 e6:2 | d6:4. c6:8 a5:4 e5:4 | bb4:8 d5:8 f5:8 a5:8 bb5:2 | a5:4. g5:8 e5:4 bb4:4 | c5:8 e5:8 g5:8 b5:8 c6:2 | c6:4. a5:8 f#5:4 eb5:4 | d5:4 f5:4 a5:4 bb5:4 | g5:2 e5:4 db5:4 |'
                  'c5:8 f5:8 a5:8 c6:8 e6:2 | eb6:4. c6:8 a5:4 g5:4 | d6:4 c6:4 a5:4 f5:4 | db6:2. g5:4 | c6:4 a5:4 e5:4 g5:4 | f#5:4 eb5:4 c5:4 bb4:4 | a4:4 bb4:4 e5:4 a5:4 | f5:2. r:4', vel=86)
    band(s, 'A', bass='walk', bass_prog=ACBASS, keys=(EPIANO, 'swingcomp'), kit=(KIT_BRUSH, 'soft'), pad=WARMPAD, drum_vel=72, fills=8)
    return s


@song('mart')
def mart(v):
    s = Song('mart', bpm=124, swing=.62, title='Supply Shop', room=1.3, loudness=-17.5)
    s.section('A', 16, 'Bbmaj7 | G7 | Cm7 | F7 | Dm7 | G7 | Cm7 | F7 | Bb7 | Eb7 | Bbmaj7 | G7 | Cm7 | F7 | Bb6 | F7')
    ld = s.part('lead', MUTETPT, rev=.24, delay=.06); ld.autovib = True
    ld.write('A', 'd5:8 f5:8 bb5:8 d6:8 r:8 c6:8 a5:4 | b5:4. g5:8 f5:4 d5:4 | eb5:8 g5:8 c6:8 eb6:8 r:8 d6:8 bb5:4 | a5:4. f5:8 eb5:4 c5:4 |'
                  'f5:8 a5:8 d6:8 f6:8 r:8 e6:8 c6:4 | b5:4 d6:4 f6:4 d6:4 | eb6:4. d6:8 c6:4 g5:4 | a5:2. r:4 |'
                  'ab5:8 f5:8 d5:8 bb4:8 ab4:2 | g5:8 bb5:8 db6:8 bb5:8 g5:2 | f5:4. a5:8 d6:4 f6:4 | f6:4 d6:4 b5:4 g5:4 |'
                  'c6:4 bb5:4 g5:4 eb5:4 | c5:4 eb5:4 a5:4 c6:4 | bb5:2. g5:4 | a5:4 c6:4 eb6:4 f6:4', vel=92)
    band(s, 'A', bass='walk', bass_prog=ACBASS, keys=(ORGAN, 'swingcomp'), kit=(KIT_JAZZ, 'ride'), pad=None, fills=8, fill='triplet', drum_vel=84, keys_vel=58)
    return s


@song('gym')
def gym(v):
    s = Song('gym', bpm=132, title='Warden\'s Hall', room=1.8, loudness=-16.5)
    s.section('A', 16, 'Am | F | G | Am | Am | F | Dm7 | E7 | F | G | Em7 | Am | Dm7 | G | Fmaj7 | E7sus4 E7')
    ld = s.part('lead', TRUMPET, rev=.3, layer=[HORN]); ld.autovib = True
    ld.write('A', 'e5:4. a5:8 c6:4 b5:4 | a5:2. f5:4 | g5:4. b5:8 d6:4 c6:4 | b5:2 a5:2 | e5:4. a5:8 c6:4 e6:4 | f6:2. c6:4 | d6:4 c6:4 a5:4 f5:4 | g#5:2 b5:2 |'
                  'c6:4. a5:8 f5:4 a5:4 | b5:4. d6:8 g6:4 d6:4 | e6:4 d6:4 b5:4 g5:4 | a5:2. e5:4 | f5:4 a5:4 d6:4 c6:4 | b5:2. d6:4 | c6:4 a5:4 e6:4 c6:4 | a5:2 g#5:2', vel=96)
    so = s.part('ost', STRINGS, rev=.3, role='comp', pan=-.25)
    so.gen('A', ostinato, pattern='0 1 2 1 0 1 2 3', lo=57, vel=72, rate=.5)
    band(s, 'A', bass='pop8', bass_prog=PICKBASS, keys=(BRIGHT, 'pulse8'), kit=(KIT_ROOM, 'march'), fill='tom', drum_vel=90)
    return s


@song('spire')
def spire(v):
    s = Song('spire', bpm=110, swing16=.56, title='The Battle Spire', room=1.6, loudness=-17.0)
    s.section('A', 16, 'Em9 | Cmaj9 | Am9 | B7alt | Em9 | Cmaj9 | F#m7b5 | B7b9 | Cmaj9 | D6 | Bm7 | Em9 | Am9 | D13 | Gmaj9 | B7alt')
    ld = s.part('lead', EPIANO, rev=.3, chorus=.3, delay=.12)
    ld.write('A', 'b4:8 e5:8 g5:8 b5:8 f#5:2 | e5:4. d5:8 b4:4 g4:4 | c5:8 e5:8 g5:8 b5:8 c6:2 | a5:4 g5:4 d#5:4 c5:4 | b4:8 e5:8 g5:8 b5:8 d6:2 | b5:4. g5:8 e5:4 d5:4 | e5:4 c5:4 a4:4 c5:4 | d#5:2. r:4 |'
                  'g5:4 b5:4 d6:4 e6:4 | f#6:2 d6:4 b5:4 | a5:4 f#5:4 d5:4 a5:4 | g5:2 f#5:2 | e5:4 g5:4 b5:4 c6:4 | b5:4 a5:4 f#5:4 c6:4 | b5:2 a5:2 | d#5:2. r:4', vel=90)
    band(s, 'A', bass='funk', bass_prog=FINGERBASS, keys=(None, None), kit=(KIT_STD, 'city'), pad=WARMPAD, drum_vel=82, fills=8)
    s.parts['bass'].notes = []
    s.parts['bass'].gen('A', bass_line, style='funk', pattern='x..x..x...x.x...', vel=94, lo=28, hi=50)
    return s


@song('gate')
def gate(v):
    s = Song('gate', bpm=96, title='Victory Gate', room=2.2, loudness=-17.5)
    s.section('A', 8, 'Bbmaj7 | Ebmaj7/Bb | Bbmaj7 | Ebmaj7/Bb | Gm7 | Cm7 | Ebmaj7 | F7sus4 F7')
    ld = s.part('lead', HORN, rev=.42, layer=[TROMBONE]); ld.autovib = True
    ld.write('A', 'f4:2 bb4:2 | g4:2. eb4:4 | d4:2 f4:4 bb4:4 | c5:2 g4:2 | d5:2 bb4:2 | eb5:2 g4:2 | g4:2 bb4:4 d5:4 | c5:2 a4:2', vel=94)
    st = s.part('strings', STRINGS, rev=.45, role='pad'); st.gen('A', pads, lo=53, hi=77, vel=62)
    tr = s.part('trumpets', TRUMPET, rev=.4, role='counter'); tr.gen('A', guide_line, lo=65, hi=79, vel=72)
    bs = s.part('bass', CONTRABASS, rev=.15); bs.gen('A', bass_line, style='two', vel=86, approach=False)
    ti = s.part('timp', TIMPANI, rev=.45, role='perc', vol=2)
    ti.write('A', 'bb2:2 f2:2 | bb2:2 r:2 | bb2:2 f2:2 | bb2:2 r:2 | g2:2 d2:2 | c3:2 g2:2 | eb2:2 bb2:2 | f2:2 f2:8 f2 f2 f2')
    dr = s.drums(kit=KIT_ORCH, rev=.35); dr.gen('A', groove, name='march', fills=8, fill='roll', vel=76)
    return s


@song('conclave')
def conclave(v):
    s = Song('conclave', bpm=88, title='The Conclave', room=2.8, reverb=1.2, loudness=-17.0)
    s.section('A', 16, 'C | G/B | Am | Em/G | F | C/E | Dm7 | G7sus4 G7 | C | E7/B | Am | C7/G | F | Fm/Ab | C/G G7 | C')
    ld = s.part('lead', BRASS, rev=.45, layer=[TRUMPET, HORN]); ld.autovib = True; ld.layer_gain = .7
    ld.write('A', 'e5:2 g5:2 | d5:2 g5:2 | c5:2 e5:4 a5:4 | b5:2 g5:2 | a5:2 c6:2 | g5:2 e5:4 c5:4 | f5:2 a5:4 c6:4 | c6:2 b5:2 |'
                  'g5:2 c6:2 | b5:2 g#5:2 | a5:2 c6:4 e6:4 | bb5:2 g5:2 | a5:2 f5:4 c6:4 | ab5:2 c6:2 | e5:2 d5:4 f5:4 | c5:1', vel=98)
    og = s.part('organ', 19, rev=.5, role='pad'); og.gen('A', pads, lo=48, hi=72, n=4, vel=70)
    ch = s.part('choir', CHOIR, rev=.55, role='pad', vol=-2); ch.gen('A', pads, lo=55, hi=76, vel=62)
    bs = s.part('bass', CONTRABASS, rev=.2, layer=[TUBA]); bs.layer_gain = .7; bs.gen('A', bass_line, style='two', vel=86, approach=False)
    ti = s.part('timp', TIMPANI, rev=.5, role='perc', vol=2)
    ti.write('A', 'c3:2 r:2 | g2:2 r:2 | a2:2 r:2 | g2:2 r:2 | f2:2 r:2 | e2:2 r:2 | d3:2 r:2 | g2:2 g2:2 | c3:2 r:2 | b2:2 r:2 | a2:2 r:2 | g2:2 r:2 | f2:2 r:2 | ab2:2 r:2 | g2:2 g2:2 | c3:2 r:2')
    return s


@song('elite_room')
def elite_room(v):
    s = Song('elite_room', bpm=80, title='Chamber of the Four', room=2.6, reverb=1.2, loudness=-18.0)
    s.section('A', 8, 'C#m | A/C# | C#m | A/C# | F#m/C# | A/C# | G#7/C | G#7alt')
    ld = s.part('lead', HORN, rev=.5, layer=[CELLO]); ld.autovib = True
    ld.write('A', 'g#4:2. c#5:4 | e5:2 c#5:2 | g#4:2. b4:4 | c#5:1 | a4:2. c#5:4 | e5:2 a4:2 | b#4:2 d#5:2 | f#5:2 e5:2', vel=88)
    pl = s.part('pulse', STRINGS, rev=.35, role='comp'); pl.gen('A', comp, style='pulse8', lo=49, hi=68, n=3, vel=64)
    pd = s.part('pad', SLOWSTR, rev=.55, role='pad', layer=[HALOPAD]); pd.gen('A', pads, lo=52, hi=74, vel=58)
    bs = s.part('bass', CONTRABASS, rev=.2); bs.gen('A', bass_line, style='pedal', vel=84)
    ti = s.part('timp', TIMPANI, rev=.45, role='perc', vol=3)
    for b in range(8): ti.write('A', 'c#2:4 r:4 c#2:4 r:4' if b % 2 == 0 else 'c#2:4 r:4 c#2:8 c#2:8 g#2:4', at=b * 4, strict=False)
    return s


@song('champ_room')
def champ_room(v):
    s = Song('champ_room', bpm=72, title='The Champion\'s Hall', room=3.0, reverb=1.25, loudness=-18.0)
    s.section('A', 8, 'Dbmaj7 | Gbmaj7/Db | Dbmaj7 | Gbmaj7/Db | Bbm9 | Ebm9 | Gbmaj7 | Ab7sus4 Ab7')
    ld = s.part('lead', CHOIR, rev=.6, layer=[HORN, STRINGS]); ld.autovib = True; ld.layer_gain = .7
    ld.write('A', 'f5:2 ab5:2 | bb5:2. f5:4 | c6:2 ab5:4 f5:4 | db6:1 | c6:2 ab5:2 | gb5:2 f5:2 | f5:2 bb5:4 db6:4 | eb6:2 c6:2', vel=90)
    hp = s.part('harp', HARP, rev=.6, pan=.3); hp.gen('A', comp, style='arp', arp='updown8', lo=52, hi=76, vel=58)
    pd = s.part('strings', SLOWSTR, rev=.6, role='pad'); pd.gen('A', pads, lo=50, hi=74, vel=58)
    bs = s.part('bass', CONTRABASS, rev=.25); bs.gen('A', bass_line, style='pedal', vel=80)
    return s


@song('hq')
def hq(v):
    s = Song('hq', bpm=124, swing=.62, title='Crane Fellowship HQ', room=1.4, loudness=-17.0)
    s.section('A', 16, 'Fm9 | Fm9 | Db9 | C7alt | Fm9 | Fm9 | Bbm9 | C7b9 | Dbmaj7 | C7 | Fm9 | Ab7 | Dbmaj7 | Gm7b5 C7 | Fm9 | C7alt')
    ld = s.part('lead', MUTETPT, rev=.24, layer=[VIBES], delay=.08); ld.autovib = True; ld.layer_gain = .5
    ld.write('A', 'f5:4 e5:8 f5:8 ab5:4 g5:4 | gb5:2 f5:2 | f5:4 e5:8 f5:8 ab5:4 b5:4 | bb5:2 ab5:4 e5:4 | c6:4 b5:8 c6:8 eb6:4 d6:4 | db6:2 c6:2 | db6:4 c6:4 bb5:4 f5:4 | e5:2 db6:2 |'
                  'c6:4. ab5:8 f5:4 db5:4 | e5:4 g5:4 bb5:4 c6:4 | ab5:2. g5:4 | gb5:2 eb5:2 | f5:4. ab5:8 c6:4 f6:4 | db6:4 bb5:4 e5:4 bb5:4 | ab5:4 g5:4 f5:4 c5:4 | e5:2. r:4', vel=92)
    bs = s.part('bass', ACBASS, rev=.05)
    bs.gen('A', bass_line, style='custom', pattern=[(0, .45, '1'), (.75, .2, '1'), (1.5, .45, '8'), (2, .45, '1'), (2.75, .2, '5'), (3.5, .45, '7')], vel=96)
    pn = s.part('piano', PIANO, rev=.2, role='comp', pan=-.2); pn.gen('A', comp, style='stabs', pattern='x.....x.....x...', lo=52, hi=70, vel=62)
    bg = s.drums('perc', kit=KIT_STD, role='perc', rev=.2)
    bg.gen('A', groove, name='none', fills=0, crash=False, extra=dict(bgh='x--x--x-x--x--x-', bgl='--x-----x-----x-'), vel=80)
    dr = s.drums(kit=KIT_JAZZ, rev=.16); dr.gen('A', groove, name='ride', fills=8, fill='triplet', vel=80)
    pd = s.part('pad', SYNSTR, rev=.4, role='pad', vol=-3); pd.gen('A', pads, lo=52, hi=74, vel=56)
    return s


@song('crane')
def crane(v):
    s = Song('crane', bpm=96, title='V. Crane', room=2.0, loudness=-17.5)
    s.section('A', 16, 'Cm | Cm/B | Cm/Bb | Cm/A | Abmaj7 | G7sus4 | G7 | G7b9 | Cm | Cm/B | Cm/Bb | Am7b5 | Abmaj7 | Fm9 | Dm7b5 G7b9 | Cm')
    ld = s.part('lead', CELLO, rev=.4, layer=[HORN], role='lead'); ld.autovib = True
    ld.write('A', 'c4:4 b3:8 c4:8 eb4:4 d4:4 | db4:2 c4:2 | eb4:4 d4:8 eb4:8 g4:4 f4:4 | a4:2 g4:2 | c5:2. bb4:4 | c5:2 d5:2 | b4:2 f5:2 | ab5:2. g5:4 |'
                  'g4:4 f#4:8 g4:8 bb4:4 ab4:4 | ab4:2 g4:2 | f4:4. eb4:8 d4:4 c4:4 | eb4:2 c4:2 | c5:4. eb5:8 g5:4 ab5:4 | g5:2 ab5:4 c6:4 | ab5:4 f5:4 b4:4 ab4:4 | c5:1', vel=94)
    hc = s.part('harpsi', HARPSI, rev=.3, role='arp', pan=.3); hc.gen('A', comp, style='arp', arp='updown', lo=52, hi=74, vel=64)
    st = s.part('strings', STRINGS, rev=.4, role='pad'); st.gen('A', pads, lo=53, hi=77, vel=60)
    bs = s.part('bass', CONTRABASS, rev=.2); bs.gen('A', bass_line, style='two', vel=86, approach=False)
    ti = s.part('timp', TIMPANI, rev=.45, role='perc', vol=1)
    ti.write('A', 'c3:4 r:2. | r:1 | r:1 | r:1 | ab2:4 r:2. | g2:4 r:2. | g2:4 r:2. | g2:4 g2:4 g2:4 g2:4 | c3:4 r:2. | r:1 | r:1 | r:1 | ab2:4 r:2. | f2:4 r:2. | d3:4 r:4 g2:4 r:4 | c3:4 r:2.')
    return s
