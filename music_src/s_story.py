"""Title, story and ceremony music."""
from mfw import *
from motifs import MAIN_A, MAIN_CHORDS, TIDE


# ============================================================================ TITLE
# The main theme. Tremolo strings and harp open on the lydian Tide motif (the lighthouse and the
# leviathan), then horns carry the Solmere theme, strings answer, a flute interlude in B minor,
# and the trumpet takes the theme home over a bVI-bVII-I lift.
@song('title')
def title(v):
    s = Song('title', bpm=100, title='Solmere — Main Theme', room=2.3, reverb=1.1)
    s.section('intro', 4, 'Dmaj7#11 | Dmaj7#11 | Bbmaj7#11 | A13sus4 A13', intro=True)
    s.section('A', 8, MAIN_CHORDS)
    s.section('A2', 8, 'Em9 | F#m7 | Gmaj9 | A13 | Bm9 | Gmaj9 | Em9 A13sus4 | Dmaj9')
    s.section('B', 8, 'Bm9 | Gmaj9 | Em9 | F#7alt | Bm9 | Gmaj9 | Cmaj9 | A7sus4 A13')
    s.section('C', 8, 'Dmaj9 | Bm11 | Gmaj9 | A13sus4 A13 | Bbmaj9 | Cmaj9 | Dmaj9 | Dmaj9')

    hn = s.part('horns', HORN, rev=.4, layer=[STRINGS], role='lead', pan=-.1); hn.autovib = True
    hn.write('intro', TIDE + ' | bb4:2 f5:2 | e5:1', vel=86)
    hn.write('A', MAIN_A, vel=98)
    vl = s.part('violins', VIOLIN, rev=.42, layer=[STRINGS], role='lead', pan=.05); vl.autovib = True
    vl.write('A2', 'b5:4. a5:8 g5:4 f#5:4 | e5:2. c#5:8 e5:8 | f#5:4. g5:8 a5:4 b5:4 | c#6:2 e6:4 f#6:4 |'
                   'd6:4. c#6:8 b5:4 f#5:4 | a5:4. b5:8 d6:4 f#6:4 | g6:4 f#6:4 e6:4 d6:4 | d6:2 r:4 f#5:4', vel=96)
    fl = s.part('flute', FLUTE, rev=.42, role='lead', delay=.12); fl.autovib = True
    fl.write('B', 'b5:4. c#6:8 d6:4 f#6:4 | e6:2. d6:8 c#6:8 | b5:2 g5:4 a5:4 | a#5:2 g5:4 e5:4 |'
                  'f#5:4. b5:8 d6:4 c#6:4 | b5:2. a5:8 f#5:8 | g5:4. e5:8 b5:4 d6:4 | d6:2 c#6:4 e6:4', vel=90)
    tp = s.part('trumpet', TRUMPET, rev=.34, role='lead', layer=[HORN], delay=.08); tp.autovib = True; tp.layer_gain = .8
    tp.write('C', 'a4:4 d5:4. e5:8 f#5:4 | a5:2. g5:8 f#5:8 | e5:4. f#5:8 d5:4 b4:4 | d5:2 c#5:2 |'
                  'bb4:4. c5:8 d5:4 f5:4 | e5:4. f5:8 g5:4 b5:4 | a5:1 | a5:2. r:4', vel=104)
    # high string countermelody over the climax
    cm = s.part('counter', VIOLIN, rev=.45, role='counter', layer=[SLOWSTR])
    cm.gen('C', guide_line, lo=74, hi=88, vel=80)

    # harp + piano colour
    hp = s.part('harp', HARP, rev=.45, pan=.35)
    hp.gen('intro A A2', comp, style='arp', arp='updown8', lo=50, hi=74, vel=64)
    pn = s.part('piano', PIANO, rev=.35, pan=-.3)
    pn.gen('B', comp, style='arp', arp='updown', lo=52, hi=76, vel=62)
    pn.gen('C', comp, style='block', lo=52, hi=76, vel=68)
    cl = s.part('celesta', CELESTA, rev=.5, pan=.4)
    cl.write('B', 'r:2 f#6:8 a6:8 c#7:4 | r:1 | r:2 b6:8 g6:8 e6:4 | r:1 | r:2 f#6:8 b6:8 d7:4 | r:1 | r:2 e6:8 g6:8 b6:4 | r:1', vel=70)

    # strings bed
    tr = s.part('trem', TREMSTR, rev=.4, role='pad', width=1.4)
    tr.gen('intro', pads, lo=50, hi=76, vel=70)
    tr.swell('intro', 0, 16, 60, 120)
    st = s.part('strings', STRINGS, rev=.45, role='pad', width=1.3)
    st.gen('A A2 B C', pads, lo=52, hi=76, vel=66)
    st.swell('C', 16, 24, 90, 127)
    ch = s.part('choir', CHOIR, rev=.5, role='pad', vol=-4)
    ch.gen('C', pads, lo=55, hi=76, vel=60)

    bs = s.part('bass', CONTRABASS, rev=.12, layer=[FINGERBASS]); bs.layer_gain = .6
    bs.gen('intro', bass_line, style='pedal', vel=80)
    bs.gen('A A2 B', bass_line, style='two', vel=86, approach=False)
    bs.gen('C', bass_line, style='pop8', vel=90, octave_pop=False)

    ti = s.part('timp', TIMPANI, rev=.4, role='perc', vol=2)
    roll(ti, s.sec['intro'], 8, 8, 'a2', 30, 110)
    ti.write('A', 'd3:2 r:2 | r:1 | r:1 | a2:2 a2:2 | d3:2 r:2 | r:1 | r:1 | r:1')
    ti.write('C', 'd3:2 r:2 | r:1 | r:1 | a2:2 a2:2 | bb2:2 r:2 | c3:2 r:2 | d3:4 d3:8 d3:8 d3:4 d3:4 | d3:2 r:2')
    dr = s.drums(kit=KIT_ORCH, rev=.3)
    dr.write('intro', 'r:1 | r:1 | r:1 | r:2 S:16 S S S S S S S')
    dr.gen('A A2', groove, name='halftime', fills=8, fill='roll', vel=80, hat_vel=.5)
    dr.gen('B', groove, name='soft', fills=8, fill='brush', vel=70, crash=False)
    dr.gen('C', groove, name='pop', fills=4, fill='tom', vel=92, crash_every=4)
    return s


# ============================================================================ PROFESSOR'S INTRO
@song('intro')
def intro(v):
    s = Song('intro', bpm=84, title='Welcome to Solmere', room=2.6, reverb=1.2, loudness=-18.0)
    s.section('A', 16, 'Dmaj7#11 | Dmaj7#11 | Bm9 | Bm9 | Gmaj9 | Em9 | Gmaj7#11 | A13sus4 A13 | Dmaj9 | F#m7 | Gmaj9 | A6 | Bm9 | Gmaj9 | Em9 | A7sus4')
    ld = s.part('lead', FLUTE, rev=.45, delay=.15); ld.autovib = True
    ld.write('A', 'd5:2 a5:2 | g#5:1 | f#5:2 e5:4 d5:4 | c#5:1 | b4:2 f#5:2 | e5:2. d5:4 | c#5:2 b4:2 | d5:2 c#5:2 |'
                  'a4:4 d5:4. e5:8 f#5:4 | a5:2. e5:4 | f#5:4. g5:8 a5:4 b5:4 | c#6:2 a5:2 | d6:2 c#6:4 b5:4 | a5:2. f#5:4 | g5:2 f#5:4 e5:4 | e5:1', vel=80)
    hp = s.part('harp', HARP, rev=.5, pan=.3); hp.gen('A', comp, style='arp', arp='updown8', lo=50, hi=74, vel=58)
    cl = s.part('celesta', CELESTA, rev=.55, role='sparkle', pan=-.3)
    cl.write('A', 'r:1 | a6:2 g#6:2 | r:1 | f#6:2 c#6:2 | r:1 | r:1 | r:1 | r:1 | r:1 | c#7:2 a6:2 | r:1 | e6:2 c#6:2 | r:1 | r:1 | r:1 | r:1', vel=60)
    st = s.part('strings', SLOWSTR, rev=.55, role='pad', width=1.4); st.gen('A', pads, lo=50, hi=74, vel=56)
    bs = s.part('bass', FRETLESS, rev=.25); bs.gen('A', bass_line, style='pedal', vel=76)
    return s


# ============================================================================ HALL OF FAME
@song('halloffame')
def halloffame(v):
    s = Song('halloffame', bpm=96, title='Hall of Fame', room=2.6, reverb=1.15, loudness=-16.5)
    s.section('intro', 2, 'Bbmaj9 C6 | Dmaj9', intro=True)
    s.section('A', 8, MAIN_CHORDS)
    s.section('A2', 8, 'Em9 | F#m7 | Gmaj9 | A13 | Bm9 | Gmaj9 | Em9 A13sus4 | Dmaj9')
    tp = s.part('lead', TRUMPET, rev=.4, layer=[HORN, STRINGS], delay=.08); tp.autovib = True; tp.layer_gain = .7
    tp.write('intro', 'bb4:4 d5:4 c5:4 e5:4 | f#5:1', vel=104)
    tp.write('A', MAIN_A, vel=104)
    tp.write('A2', 'b5:4. a5:8 g5:4 f#5:4 | e5:2. c#5:8 e5:8 | f#5:4. g5:8 a5:4 b5:4 | c#6:2 e6:4 f#6:4 | d6:4. c#6:8 b5:4 f#5:4 | a5:4. b5:8 d6:4 f#6:4 | g6:4 f#6:4 e6:4 d6:4 | d6:2. r:4', vel=104)
    cm = s.part('counter', VIOLIN, rev=.45, role='counter', layer=[SLOWSTR]); cm.gen('A A2', guide_line, lo=74, hi=88, vel=78)
    ch = s.part('choir', CHOIR, rev=.55, role='pad'); ch.gen('intro A A2', pads, lo=55, hi=76, vel=62)
    hp = s.part('harp', HARP, rev=.5, pan=.35); hp.gen('A A2', comp, style='arp', arp='updown8', lo=50, hi=74, vel=60)
    bs = s.part('bass', CONTRABASS, rev=.15, layer=[FINGERBASS]); bs.gen('intro A A2', bass_line, style='two', vel=88, approach=False)
    ti = s.part('timp', TIMPANI, rev=.45, role='perc', vol=2)
    ti.write('intro', 'bb2:2 c3:2 | d3:4 d3:8 d3:8 d3:4 d3:4')
    ti.write('A', 'd3:2 r:2 | b2:2 r:2 | g2:2 r:2 | a2:2 a2:2 | d3:2 r:2 | e2:2 r:2 | b2:2 r:2 | g2:2 r:2')
    dr = s.drums(kit=KIT_ORCH, rev=.3); dr.gen('A A2', groove, name='march', fills=8, fill='roll', vel=86, crash_every=4)
    return s


# ============================================================================ CREDITS (medley)
# Tide motif -> the main theme on piano -> Brinehollow -> Route 1 -> Wren's motif -> the main theme
# in full, each joined by a one-bar pivot into the next key.
@song('credits')
def credits(v):
    from s_towns import BRINE_A, BRINE_CH_A
    from s_field import R1_A, R1_CH_A
    s = Song('credits', bpm=96, title='Solmere — Ending Theme', room=2.4, reverb=1.1, loudness=-16.5)
    s.section('tide', 4, 'Dmaj7#11 | Dmaj7#11 | Bbmaj7#11 | A13sus4 A13')
    s.section('main', 8, MAIN_CHORDS)
    s.section('p1', 1, 'A7sus4 A7')
    s.section('brine', 16, BRINE_CH_A)
    s.section('p2', 1, 'D7sus4 D7')
    s.section('route', 8, R1_CH_A)
    s.section('p3', 1, 'C7sus4 C7')
    s.section('wren', 8, 'F | Dm7 | Bbmaj7 | C7 | Fmaj7 | Am7 D7 | Gm6 C13 | Fmaj7 A7')
    s.section('finale', 8, 'Dmaj9 | Bm11 | Gmaj13 | A13sus4 A13 | Bbmaj9 | Cmaj9 | Dmaj9 | Dmaj9')
    hn = s.part('horn', HORN, rev=.45, layer=[STRINGS], role='lead'); hn.autovib = True
    hn.write('tide', TIDE + ' | bb4:2 f5:2 | e5:1', vel=86)
    pn = s.part('piano', PIANO, rev=.4, role='lead')
    pn.write('main', MAIN_A, vel=86)
    pn.gen('brine route wren', comp, style='arp', arp='updown8', lo=50, hi=72, vel=54)
    fl = s.part('flute', FLUTE, rev=.4, role='lead', delay=.1); fl.autovib = True
    fl.write('brine', BRINE_A, vel=86)
    tp = s.part('trumpet', TRUMPET, rev=.36, role='lead', layer=[HORN]); tp.autovib = True; tp.layer_gain = .7
    tp.write('route', R1_A, vel=96)
    tp.write('finale', 'a4:4 d5:4. e5:8 f#5:4 | a5:2. g5:8 f#5:8 | e5:4. f#5:8 d5:4 b4:4 | d5:2 c#5:2 | bb4:4. c5:8 d5:4 f5:4 | e5:4. f5:8 g5:4 b5:4 | a5:1 | a5:2. r:4', vel=104)
    cl = s.part('clarinet', CLARINET, rev=.36, role='lead', layer=[XYLO]); cl.autovib = True; cl.layer_gain = .5
    cl.write('wren', 'c5:8 f5:8 r:8 g5:8 a5:4 c6:4 | a5:8 g5:8 f5:4 d5:4 f5:4 | d5:8 f5:8 r:8 g5:8 a5:4 d6:4 | c6:8 bb5:8 g5:4 e5:4 g5:4 |'
                     'c5:8 f5:8 r:8 g5:8 a5:4 c6:4 | e6:8 d6:8 c6:4 f#5:4 a5:4 | bb5:8 a5:8 g5:4 e5:4 bb5:4 | a5:2 c#6:2', vel=90)
    cm = s.part('counter', VIOLIN, rev=.45, role='counter', layer=[SLOWSTR]); cm.gen('finale', guide_line, lo=74, hi=88, vel=80)
    st = s.part('strings', STRINGS, rev=.45, role='pad', width=1.3)
    st.gen('tide main p1 brine p2 route p3 wren finale', pads, lo=52, hi=76, vel=60)
    st.swell('finale', 16, 32, 90, 127)
    hp = s.part('harp', HARP, rev=.5, pan=.35); hp.gen('tide main finale', comp, style='arp', arp='updown8', lo=50, hi=74, vel=58)
    bs = s.part('bass', ACBASS, rev=.12)
    bs.gen('tide', bass_line, style='pedal', vel=80)
    bs.gen('main p1 brine p2 p3', bass_line, style='two', vel=84, approach=False)
    bs.gen('route wren finale', bass_line, style='pop8', vel=88, octave_pop=False, approach=False)
    dr = s.drums(kit=KIT_BRUSH, rev=.25)
    dr.gen('brine', groove, name='soft', fills=8, fill='brush', vel=72, crash=False)
    dr2 = s.drums('drums2', kit=KIT_STD, rev=.18)
    dr2.gen('route wren', groove, name='pop2', fills=4, fill='snare', vel=86)
    dr2.gen('finale', groove, name='pop', fills=4, fill='tom', vel=92, crash_every=4)
    ti = s.part('timp', TIMPANI, rev=.45, role='perc', vol=1)
    roll(ti, s.sec['tide'], 8, 8, 'a2', 30, 100)
    ti.write('finale', 'd3:2 r:2 | r:1 | r:1 | a2:2 a2:2 | bb2:2 r:2 | c3:2 r:2 | d3:4 d3:8 d3:8 d3:4 d3:4 | d3:2 r:2')
    return s


# ============================================================================ EVOLUTION
@song('evolution')
def evolution(v):
    s = Song('evolution', bpm=100, title='What? Something\'s happening!', room=2.0, loudness=-16.5)
    s.section('A', 8, 'Abmaj7#11 | Abmaj7#11 | Amaj7#11 | Amaj7#11 | Bbmaj7#11 | Bbmaj7#11 | Bmaj7#11 | C7sus4')
    ld = s.part('lead', STRINGS, rev=.45, layer=[CHOIR], role='lead')
    ld.write('A', 'eb5:2 d5:2 | c5:2 d5:2 | e5:2 d#5:2 | c#5:2 d#5:2 | f5:2 e5:2 | d5:2 e5:2 | f#5:2 e#5:2 | g5:1', vel=88)
    cl = s.part('celesta', CELESTA, rev=.45, role='arp'); cl.gen('A', ostinato, pattern='0 1 2 3 2 1 2 3', lo=67, vel=66, rate=.5)
    tr = s.part('trem', TREMSTR, rev=.4, role='pad'); tr.gen('A', pads, lo=48, hi=70, vel=66)
    tr.ramp(s.sec['A'].at, s.sec['A'].at + 32, 11, 80, 127)
    bs = s.part('bass', CONTRABASS, rev=.2); bs.gen('A', bass_line, style='pedal', vel=84)
    ti = s.part('timp', TIMPANI, rev=.4, role='perc', vol=2)
    for b in range(8): ti.write('A', 'ab2:8 r:8 ab2:8 r:8 r:2' if b < 2 else 'a2:8 r:8 a2:8 r:8 r:2' if b < 4 else 'bb2:8 r:8 bb2:8 r:8 r:2' if b < 6 else 'b2:8 r:8 b2:8 r:8 r:2', at=b * 4, strict=False)
    return s
