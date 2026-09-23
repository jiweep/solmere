"""Short non-looping jingles (fanfares for items, healing, catching, levels, badges...)."""
from mfw import *


def jingle(id, bpm, bars, chords, top, harm_line=None, lead=TRUMPET, bells=True, harp=False, timp=None, title='', kit=KIT_ORCH, drums=None):
    s = Song(id, bpm=bpm, title=title or id, room=2.0, reverb=1.1, loudness=-15.5, tail=2.2)
    s.loop = False
    s.section('A', bars, chords)
    ld = s.part('lead', lead, rev=.35, layer=[BRASS] if lead == TRUMPET else []); ld.autovib = True; ld.layer_gain = .6
    ld.write('A', top, vel=104)
    if harm_line:
        hm = s.part('harm', HORN, rev=.4, role='counter'); hm.write('A', harm_line, vel=90)
    st = s.part('strings', STRINGS, rev=.45, role='pad'); st.gen('A', pads, lo=55, hi=79, vel=70)
    bs = s.part('bass', CONTRABASS, rev=.2); bs.gen('A', bass_line, style='pedal', vel=86)
    if bells:
        gl = s.part('glock', GLOCK, rev=.5, role='sparkle'); gl.write('A', top, transpose=12, vel=74)
    if harp:
        hp = s.part('harp', HARP, rev=.5, role='arp'); hp.gen('A', comp, style='arp', arp='up', lo=55, hi=84, vel=66)
    if timp:
        ti = s.part('timp', TIMPANI, rev=.45, role='perc', vol=3); ti.write('A', timp)
    if drums:
        dr = s.drums(kit=kit, rev=.3); dr.write('A', drums, vel=100)
    return s


@song('j_heal')
def j_heal(v):
    return jingle('j_heal', 112, 2, 'Cmaj9 | Fmaj7/C Cmaj9', 'c6:8 e6:8 g6:8 c7:8 r:8 g6:8 c7:4 | a6:4 g6:4 e7:2', lead=VIBES, harp=True, title='Healed!')


@song('j_caught')
def j_caught(v):
    return jingle('j_caught', 138, 3, 'C | G7sus4 G7 | C', 'g5:8 c6:8 e6:8 g6:8 e6:8 g6:8 c7:4 | b6:8 g6:8 d7:4 d7:8 b6:8 g6:4 | c7:2. r:4',
                  harm_line='e5:8 g5:8 c6:8 e6:8 c6:8 e6:8 g6:4 | g6:8 d6:8 b6:4 b6:8 g6:8 d6:4 | e6:2. r:4', timp='c3:4 r:2. | g2:4 r:4 g2:4 g2:4 | c3:2. r:4',
                  drums='K+C:4 r:2. | r:2 S:8 S S S | K+C:2. r:4', title='Caught!')


@song('j_levelup')
def j_levelup(v):
    return jingle('j_levelup', 150, 1, 'Cmaj9', 'c6:16 e6:16 g6:16 c7:16 e7:4 d7:8 e7:8 g7:4', lead=VIBES, harp=True, title='Level up!')


@song('j_itemget')
def j_itemget(v):
    return jingle('j_itemget', 140, 2, 'G | D7sus4 G', 'g5:8 b5:8 d6:8 g6:8 r:8 d6:8 g6:4 | a6:4 c7:8 a6:8 b6:2', title='Got an item!')


@song('j_keyitem')
def j_keyitem(v):
    return jingle('j_keyitem', 120, 2, 'D | Bbmaj7 C6 D', 'd6:8 f#6:8 a6:8 d7:8 r:8 a6:8 d7:4 | bb6:4 c7:4 d7:2', harm_line='a5:8 d6:8 f#6:8 a6:8 r:8 f#6:8 a6:4 | f6:4 g6:4 a6:2',
                  timp='d3:4 r:2. | bb2:4 c3:4 d3:2', title='Key item!')


@song('j_badge')
def j_badge(v):
    return jingle('j_badge', 112, 4, 'C | F | Ab Bb | C', 'c6:4. c6:8 c6:4 e6:4 | a6:2 f6:4 a6:4 | ab6:4 c7:4 bb6:4 d7:4 | c7:1',
                  harm_line='g5:4. g5:8 g5:4 c6:4 | f6:2 c6:4 f6:4 | eb6:4 ab6:4 f6:4 bb6:4 | g6:1', timp='c3:4 r:4 c3:4 r:4 | f2:4 r:4 f2:4 r:4 | ab2:4 r:4 bb2:4 r:4 | c3:1',
                  drums='K+C:4 r:4 S:4 r:4 | K+C:4 r:4 S:4 r:4 | K:4 S:4 K:4 S:8 S | K+C:1', title='Badge get!')


@song('j_newmon')
def j_newmon(v):
    return jingle('j_newmon', 130, 2, 'Fmaj9 | Bbmaj7 C7sus4 Fmaj9', 'c6:8 f6:8 a6:8 c7:8 r:8 a6:8 c7:4 | d7:4 bb6:8 g6:8 a6:2', harp=True, title='A new partner!')


@song('j_dex')
def j_dex(v):
    return jingle('j_dex', 150, 1, 'Emaj9', 'b5:8 e6:8 g#6:8 b6:8 d#7:2', lead=VIBES, title='Registered!')


@song('j_evolved')
def j_evolved(v):
    return jingle('j_evolved', 118, 3, 'Ab | Bb | Cmaj9', 'eb6:8 ab6:8 c7:8 eb7:8 c7:4 ab6:4 | f6:8 bb6:8 d7:8 f7:8 d7:4 bb6:4 | g6:8 c7:8 e7:4 g7:2',
                  harm_line='c6:8 eb6:8 ab6:8 c7:8 ab6:4 eb6:4 | d6:8 f6:8 bb6:8 d7:8 bb6:4 f6:4 | e6:8 g6:8 c7:4 e7:2', harp=True, timp='ab2:4 r:2. | bb2:4 r:2. | c3:2. r:4',
                  drums='K+C:4 r:2. | K+C:4 r:2 S:16 S S S | K+C:2. r:4', title='Evolved!')


@song('j_learn')
def j_learn(v):
    return jingle('j_learn', 160, 1, 'Gmaj9', 'd6:8 g6:8 b6:8 d7:8 f#7:2', lead=VIBES, title='Learned a move!')
