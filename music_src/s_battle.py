"""Battle music."""
from mfw import *


def battle_band(s, secs, bass='drive', groove_name='battle', fills=4, fill='tom', kit=KIT_POWER, stabs=None, ost='0 1 2 1 3 2 1 2',
                piano='pulse8', strings_ost=True, bass_prog=PICKBASS, drum_vel=100, ost_lo=62, extra_drums=None):
    """The shared engine room of a battle theme: driving bass, 16th string ostinato, piano pulse, brass stabs, drums."""
    bs = s.parts.get('bass') or s.part('bass', bass_prog, rev=.03)
    bs.gen(secs, bass_line, style=bass, vel=100, lo=28, hi=52)
    if strings_ost:
        so = s.parts.get('ost') or s.part('ost', STRINGS, rev=.2, pan=-.25, role='comp', width=1.3)
        so.gen(secs, ostinato, pattern=ost, lo=ost_lo, vel=78)
    if piano:
        pn = s.parts.get('piano') or s.part('piano', BRIGHT, rev=.16, pan=.25, role='comp', vol=-2)
        pn.gen(secs, comp, style=piano, lo=52, hi=72, vel=70)
    if stabs:
        br = s.parts.get('stabs') or s.part('stabs', BRASS, rev=.22, pan=.1, role='brass', layer=[SYNBRASS])
        br.gen(secs, comp, style='stabs', pattern=stabs, lo=58, hi=79, n=4, vel=100, rootless=False)
    dr = s.parts.get('drums') or s.drums(kit=kit, rev=.12)
    dr.gen(secs, groove, name=groove_name, fills=fills, fill=fill, vel=drum_vel, crash_every=8, extra=extra_drums)


# ============================================================================ TRAINER BATTLE
@song('trainer')
def trainer(v):
    s = Song('trainer', bpm=172, title='Battle! (Trainer)', room=1.5, reverb=.9, loudness=-15.5)
    s.section('intro', 4, 'Gm | Gm | Gm Cm/G | D7b9', intro=True)
    s.section('A', 16, 'Gm | Gm | Eb/G | Eb/G | Cm/G | Cm/G | D7/F# | D7/F# | Ebmaj7 | F | Dm7 | Gm7 | Ebmaj7 | F | Gsus4 | G')
    s.section('B', 8, 'Ebmaj9 | F6 | Dm7 | Gm9 | Cm9 | F13 | Bbmaj9 | D7alt')
    s.section('C', 8, 'Gm | Ab/G | Gm | Ab/G | Bbm | Cb | C7b9 | D7sus4 D7alt')
    s.section('D', 8, 'Gm | Eb | Cm | D | Gm | Eb | Am7b5 | D7alt')

    lead = s.part('lead', TRUMPET, rev=.2, layer=[SYNBRASS], delay=.06); lead.autovib = True; lead.layer_gain = .7
    lead.write('A', 'g5:8 r:16 g5:16 bb5:8 g5:8 d6:4 c6:8 bb5:8 | a5:8 bb5:8 a5:8 g5:8 f#5:4 d5:4 |'
                    'g5:8 r:16 g5:16 bb5:8 g5:8 eb6:4 d6:8 c6:8 | bb5:8 c6:8 bb5:8 g5:8 eb5:4 g5:4 |'
                    'c6:4. bb5:8 ab5:8 g5:8 f5:8 eb5:8 | g5:2 c5:8 d5:8 eb5:8 f5:8 | f#5:4. a5:8 c6:4 d6:8 eb6:8 | d6^:2 c6:8 a5:8 f#5:8 d5:8 |'
                    'bb5:4 g5:8 bb5:8 d6:4 eb6:4 | c6:4. a5:8 f5:2 | a5:8 c6:8 d6:8 f6:8 e6:4 d6:4 | d6:2. bb5:8 c6:8 |'
                    'd6:4 eb6:8 d6:8 bb5:4 g5:4 | a5:4 c6:8 a5:8 f5:4 c5:4 | c6:2 d6:8 c6:8 bb5:8 a5:8 | b5:2. d6:8 f6:8', vel=104)
    lead.write('C', 'd6:4. d6:8 r:8 d6:8 eb6:4 | eb6:4. eb6:8 r:8 eb6:8 f6:4 | g6:4. f6:8 d6:4 bb5:4 | c6:4. bb5:8 ab5:4 c6:4 |'
                    'db6:4. db6:8 r:8 db6:8 f6:4 | eb6:4. eb6:8 r:8 eb6:8 gb6:4 | e6:4 db6:4 bb5:4 g5:4 | g5:4 a5:4 f#5:4 eb5:4', vel=106)
    # soaring string melody for the lyrical B section
    sl = s.part('strlead', VIOLIN, rev=.34, layer=[STRINGS], role='lead', pan=-.05); sl.autovib = True
    sl.write('B', 'g6:2. f6:8 eb6:8 | f6:2 d6:4 c6:4 | c6:2. d6:8 f6:8 | a6:1 | g6:2. f6:8 eb6:8 | d6:2 eb6:4 f6:4 | f6:2. d6:8 c6:8 | c6:4 bb5:4 f#5:4 eb5:4',
             transpose=-12, vel=100)
    # low brass for the dark interlude
    lo = s.part('lowbrass', TROMBONE, rev=.3, layer=[HORN], role='lead', pan=.1); lo.autovib = True
    lo.write('D', 'd4:2 g4:4 bb4:4 | a4:2 g4:4 eb4:4 | g4:2 c5:4 eb5:4 | d5:2. c5:8 a4:8 | bb4:2 d5:4 g5:4 | f5:2 eb5:4 bb4:4 | c5:2 eb5:4 g5:4 | f#5:2 eb5:4 c5:4', vel=100)

    # intro: the rush + stabs
    run = s.part('run', BRIGHT, rev=.2, role='lead', vol=-3, layer=[STRINGS])
    run.write('intro', 'g6:16 f#6 eb6 d6 c6 bb5 a5 g5 f#5 eb5 d5 c5 bb4 a4 g4 f#4 | g4:16 a4 bb4 c5 d5 eb5 f#5 g5 a5 bb5 c6 d6 eb6:4 | r:1 | r:1', vel=100)
    ib = s.part('stabs', BRASS, rev=.22, pan=.1, role='brass', layer=[SYNBRASS])
    ib.write('intro', 'r:1 | r:1 | g4+bb4+d5+g5:8 r:8 r:4 g4+bb4+d5+g5:8 r:8 g4+c5+eb5+g5:4 | f#4+c5+eb5+a5:2. r:4', vel=112)
    dr = s.drums(kit=KIT_POWER, rev=.12)
    dr.write('intro', 'K+C:4 r:4 r:2 | K:4 r:4 T5:8 T5 T3 T3 | K+C:8 r:8 r:4 K+S:8 r:8 K+S:4 | S:16 S S S S S S S S S S S T1 T2 T3 T5', vel=110)
    ti = s.part('timp', TIMPANI, rev=.3, role='perc', vol=4)
    ti.write('intro', 'g2:4 r:2. | r:1 | g2:4 r:4 g2:8 r:8 c3:4 | r:1')
    roll(ti, s.sec['intro'], 12, 4, 'd3', 50, 118)
    ti.write('A', 'g2:2 r:2')
    ti.write('D', 'g2:2 r:2 | eb2:2 r:2 | c3:2 r:2 | d3:2 r:2 | g2:2 r:2 | eb2:2 r:2 | a2:2 r:2 | d3:2 r:2')
    roll(ti, s.sec['D'], 28, 4, 'd3', 50, 120)

    battle_band(s, 'A C', stabs='x..x..x...x.x...', piano='pulse8')
    battle_band(s, 'B', bass='pop8', groove_name='battle2', piano='offbeat', stabs='x.......x.....x.', ost='0 2 1 3 0 2 1 3')
    battle_band(s, 'D', bass='gallop', groove_name='halftime', fills=8, fill='roll', piano=None, strings_ost=False)
    tr = s.part('trem', TREMSTR, rev=.3, role='pad', pan=0, width=1.4)
    tr.gen('D', pads, lo=50, hi=74, vel=80)
    pd = s.part('strings', STRINGS, rev=.3, role='pad', vol=-2)
    pd.gen('A B C', pads, lo=55, hi=79, vel=70)
    return s


# ============================================================================ WILD BATTLE
# A minor, 176. Syncopated riff, trumpet-thirds break, a funky slap-bass B section.
@song('wild')
def wild(v):
    s = Song('wild', bpm=176, title='Battle! (Wild)', room=1.4, reverb=.85, loudness=-15.5)
    s.section('intro', 2, 'Am | E7b9', intro=True)
    s.section('A', 8, 'Am | F/A | Am | G/A | Am | F/A | Dm/A | E7/G#')
    s.section('A2', 8, 'Fmaj7 | G | Em7 | Am | Fmaj7 | G | E7sus4 | E7')
    s.section('B', 8, 'Dm9 | G13 | Cmaj9 | Fmaj7 | Bm7b5 | E7b9 | Am9 | E7alt')
    s.section('C', 8, 'F | G | Am | Am | F | G | E7b9 | E7b9')
    lead = s.part('lead', TRUMPET, rev=.2, layer=[SYNBRASS], delay=.06); lead.autovib = True; lead.layer_gain = .7
    lead.write('A', 'e5:8 a5:8 r:8 a5:8 c6:8 b5:8 a5:8 e5:8 | f5:8 a5:8 r:8 a5:8 c6:4 a5:4 | e5:8 a5:8 r:8 a5:8 c6:8 d6:8 e6:4 | d6:8 c6:8 b5:8 g5:8 d5:2 |'
                    'e5:8 a5:8 r:8 a5:8 c6:8 b5:8 a5:8 e5:8 | f5:8 a5:8 r:8 a5:8 c6:4 f6:4 | e6:8 d6:8 c6:8 a5:8 f5:4 d5:4 | e5:4 g#5:4 b5:4 d6:4', vel=104)
    lead.write('A2', 'r:8 c6:8 -:8 a5:8 e6:4 c6:8 a5:8 | b5:8 d6:8 -:8 b5:8 g6:4 d6:8 b5:8 | e6:8 d6:8 b5:8 g5:8 -:8 e5:8 g5:8 b5:8 | a5:2 r:8 e5:8 a5:8 c6:8 |'
                     '-:8 f6:8 e6:8 c6:8 a5:4 c6:8 e6:8 | -:8 g6:8 f6:8 d6:8 b5:4 d6:8 e6:8 | -:4 e6:8 d6:8 a5:4 b5:4 | g#5:4 b5:8 d6:8 -:4 e6:8 f6:8', vel=102)
    lead.write('C', 'a5+c6:8 r:8 a5+c6:8 c6+f6:8 r:8 a5+c6:8 g5+c6:4 | b5+d6:8 r:8 b5+d6:8 d6+g6:8 r:8 b5+d6:8 a5+d6:4 |'
                    'c6+e6:4. b5+d6:8 a5+c6:4 e5+a5:4 | c6+e6:8 d6+f6:8 e6+g6:8 c6+e6:8 a5+c6:2 |'
                    'a5+c6:8 r:8 a5+c6:8 c6+f6:8 r:8 a5+c6:8 g5+c6:4 | b5+d6:8 r:8 b5+d6:8 d6+g6:8 r:8 b5+d6:8 a5+d6:4 |'
                    'g#5+b5:4. g#5+b5:8 b5+d6:4 d6+f6:4 | e6+g#6:2 r:2', vel=104)
    sl = s.part('strlead', VIOLIN, rev=.32, layer=[STRINGS], role='lead'); sl.autovib = True
    sl.write('B', 'f5:4. e5:8 a5:2 | e5:4. f5:8 b5:2 | d6:2. c6:8 b5:8 | a5:1 | d6:4. c6:8 a5:4 f5:4 | g#5:4. b5:8 f6:2 | e6:2. b5:8 c6:8 | g#5:4 f5:4 d5:4 c5:4', vel=98)
    run = s.part('run', BRIGHT, rev=.2, role='lead', vol=-3, layer=[STRINGS])
    run.write('intro', 'a4:16 b4 c5 d5 e5 f5 g#5 a5 b5 c6 d6 e6 f6 g#6 a6:8 | r:1', vel=100)
    st = s.part('stabs', BRASS, rev=.22, pan=.1, role='brass', layer=[SYNBRASS])
    st.write('intro', 'r:1 | g#4+b4+d5+f5:8 r:8 g#4+b4+d5+f5:8 r:8 r:8 g#4+b4+d5+f5:8 r:4', vel=112)
    dr = s.drums(kit=KIT_STD, rev=.12)
    dr.write('intro', 'K+C:4 r:4 T1:8 T1 T2 T2 | K+S:8 r:8 K+S:8 r:8 S:16 S S S T3 T3 T5 T5', vel=110)
    battle_band(s, 'A', stabs='x..x..x.......x.', kit=KIT_STD, groove_name='battle')
    battle_band(s, 'A2', stabs='x.......x.x.....', kit=KIT_STD, groove_name='pop2', ost='0 1 2 3 2 1 0 1')
    battle_band(s, 'C', stabs='x..x..x...x.x...', kit=KIT_STD, groove_name='drive', fill='mix')
    sb = s.part('slap', SLAP, rev=.04, role='bass')
    sb.gen('B', bass_line, style='funk', pattern='x..x.ox..x.xo.x.', vel=100, lo=28, hi=50)
    battle_band(s, 'B', bass='pedal', groove_name='city', piano='swingcomp', stabs='....x.......x...', strings_ost=False)
    s.parts['bass'].notes = [n for n in s.parts['bass'].notes if not (s.sec['B'].at <= n[0] < s.sec['B'].at + s.sec['B'].len)]
    ep = s.part('epiano', EPIANO, rev=.25, chorus=.35, role='comp')
    ep.gen('B', comp, style='swingcomp', lo=53, hi=72, vel=70)
    pd = s.part('strings', STRINGS, rev=.3, role='pad', vol=-2)
    pd.gen('A A2 C', pads, lo=55, hi=79, vel=70)
    return s


# ============================================================================ RIVAL BATTLE
# D minor, 170. Wren's motif (a bouncy F-major figure) breaks through as the B section: the
# friendship under the rivalry.
@song('rival')
def rival(v):
    s = Song('rival', bpm=170, title='Battle! (Wren)', room=1.5, reverb=.9, loudness=-15.5)
    s.section('intro', 4, 'F | Bb C | Dm | A7', intro=True)
    s.section('A', 8, 'Dm | Bb | C | Dm | Dm7 | Bb | Gm7 | A7')
    s.section('A2', 8, 'Bb | C | Am7 | Dm | Gm7 | C7 | Fmaj7 | A7alt')
    s.section('B', 8, 'F | Dm7 | Bbmaj7 | C7 | F | Am7 D7 | Gm7 C7 | Fmaj7 A7')
    s.section('C', 8, 'Bb | C | Dm | Dm | Bb | C | Eb | A7')
    lead = s.part('lead', TRUMPET, rev=.2, layer=[SYNBRASS], delay=.06); lead.autovib = True; lead.layer_gain = .7
    lead.write('intro', 'c5:8 f5:8 r:8 g5:8 a5:4 c6:4 | bb5:8 a5:8 f5:4 g5:4 e5:4 | f5:8 a5:8 d6:4 a5:4 f5:4 | e5:4 g5:4 c#6:4 e6:4', vel=104)
    lead.write('A', 'd5:8 f5:8 a5:8 d6:8 r:8 c6:8 a5:4 | bb5:8 a5:8 f5:8 d5:8 f5:4 bb5:4 | c6:8 bb5:8 g5:8 e5:8 g5:4 c6:4 | a5:2. r:8 a5:16 bb5:16 |'
                    'c6:8 a5:8 f5:8 d5:8 r:8 d6:8 c6:4 | d6:8 bb5:8 f5:8 d5:8 f5:4 d6:4 | f6:4. d6:8 bb5:4 g5:4 | c#6:4 a5:4 e5:4 g5:4', vel=104)
    lead.write('A2', 'd6:4. c6:8 bb5:4 f5:4 | e6:4. d6:8 c6:4 g5:4 | c6:4. b5:8 a5:4 e5:4 | d5:8 e5:8 f5:8 a5:8 d6:2 |'
                     'bb5:4. a5:8 g5:4 d5:4 | e5:4. f5:8 g5:4 bb5:4 | a5:4. c6:8 e6:2 | c#6:4 bb5:4 g5:4 f5:4', vel=102)
    lead.write('C', 'f5:8 bb5:8 r:8 d6:8 r:8 f6:8 d6:4 | g5:8 c6:8 r:8 e6:8 r:8 g6:8 e6:4 | f6:4. e6:8 d6:4 a5:4 | d6:2. r:4 |'
                    'f5:8 bb5:8 r:8 d6:8 r:8 f6:8 d6:4 | g5:8 c6:8 r:8 e6:8 r:8 g6:8 e6:4 | g6:4. f6:8 eb6:4 bb5:4 | a5:4 c#6:4 e6:4 g6:4', vel=106)
    # Wren's theme: clarinet + xylophone, bright and cheeky
    wr = s.part('wren', CLARINET, rev=.3, role='lead', layer=[XYLO]); wr.autovib = True; wr.layer_gain = .7
    wr.write('B', 'c5:8 f5:8 r:8 g5:8 a5:4 c6:4 | a5:8 g5:8 f5:4 d5:4 f5:4 | d5:8 f5:8 r:8 g5:8 a5:4 d6:4 | c6:8 bb5:8 g5:4 e5:4 g5:4 |'
                  'c5:8 f5:8 r:8 g5:8 a5:4 c6:4 | e6:8 d6:8 c6:4 f#5:4 a5:4 | bb5:8 a5:8 g5:4 e5:4 bb5:4 | a5:2 c#6:2', vel=100)
    dr = s.drums(kit=KIT_POWER, rev=.12)
    dr.write('intro', 'K+C:4 r:4 K:4 S:4 | K:8 K S:4 K:8 K S:4 | K+C:4 r:4 K:4 S:4 | S:16 S S S S S S S T1 T1 T2 T2 T3 T3 T5 T5', vel=108)
    battle_band(s, 'intro', stabs=None, piano='pulse8', strings_ost=False, groove_name='none')
    battle_band(s, 'A A2 C', stabs='x..x..x...x.x...', ost='0 1 2 1 3 2 1 2')
    battle_band(s, 'B', bass='pop8', groove_name='city', piano='offbeat', stabs='..x...x...x...x.', strings_ost=False)
    s.parts['drums'].notes = [n for n in s.parts['drums'].notes if not (0 <= n[0] < s.sec['A'].at) or n[2] in (36, 38, 49, 50, 48, 47, 43)]
    pd = s.part('strings', STRINGS, rev=.3, role='pad', vol=-2)
    pd.gen('A A2 B C', pads, lo=55, hi=79, vel=70)
    gl = s.part('glock', GLOCK, rev=.4, role='sparkle')
    gl.write('B', 'c6:8 f6:8 r:8 g6:8 a6:4 c7:4 | r:1 | d6:8 f6:8 r:8 g6:8 a6:4 d7:4 | r:1 | c6:8 f6:8 r:8 g6:8 a6:4 c7:4 | r:1 | r:1 | r:1', vel=70)
    return s


# ============================================================================ WARDEN (GYM LEADER) BATTLE
# C minor, 170. Heroic brass over i-bVI-bVII-V, a soaring major B, a Neapolitan (Db) build and a
# timpani/low-brass drum break.
@song('gym_battle')
def gym_battle(v):
    s = Song('gym_battle', bpm=170, title='Battle! (Warden)', room=1.6, reverb=.9, loudness=-15.0)
    s.section('intro', 4, 'Cm | Ab Bb | Cm | G7b9', intro=True)
    s.section('A', 16, 'Cm | Ab | Bb | G | Cm | Ab | Fm7 | G7 | Ebmaj7 | Bb | Ab | Fm7 G7 | Cm | Ab | Dm7b5 | G7alt')
    s.section('B', 8, 'Abmaj7 | Bb6 | Gm7 | Cm9 | Fm9 | Bb13 | Ebmaj9 | G7alt')
    s.section('C', 8, 'Cm | Db | Cm | Db | Bbm | Cb | Ab | G7sus4 G7')
    s.section('D', 8, 'Cm | Cm | Ab | Ab | Fm | Fm | G7 | G7')
    lead = s.part('lead', TRUMPET, rev=.22, layer=[SYNBRASS], delay=.06); lead.autovib = True; lead.layer_gain = .75
    lead.write('A', 'g5:4 c6:8 d6:8 eb6:4 d6:8 c6:8 | c6:4. ab5:8 eb5:2 | f5:4 bb5:8 c6:8 d6:4 c6:8 bb5:8 | b5^:2. g5:4 |'
                    'g5:4 c6:8 d6:8 eb6:4 d6:8 c6:8 | eb6:4. c6:8 ab5:2 | ab5:4 c6:8 eb6:8 f6:4 eb6:8 c6:8 | d6:2 b5:4 g5:4 |'
                    'g5:4. bb5:8 eb6:4 d6:4 | d6:4. c6:8 bb5:4 f5:4 | c6:4. bb5:8 ab5:4 eb5:4 | f5:4 ab5:4 b5:4 d6:4 |'
                    'eb6:2. d6:8 c6:8 | c6:2 ab5:4 eb5:4 | f5:4. ab5:8 c6:4 d6:4 | b5:4 ab5:4 f5:4 eb5:4', vel=106)
    lead.write('C', 'c6:8 c6:8 r:8 c6:8 eb6:8 c6:8 g5:4 | db6:8 db6:8 r:8 db6:8 f6:8 db6:8 ab5:4 | c6:8 c6:8 r:8 c6:8 g6:8 eb6:8 c6:4 | f6:4. db6:8 ab5:4 f5:4 |'
                    'bb5:8 bb5:8 r:8 bb5:8 db6:8 bb5:8 f5:4 | cb6:8 cb6:8 r:8 cb6:8 eb6:8 cb6:8 gb5:4 | c6:4 eb6:4 ab5:4 c6:4 | c6:4 d6:4 b5:4 f5:4', vel=108)
    hn = s.part('horns', HORN, rev=.36, layer=[STRINGS, VIOLIN], role='lead'); hn.autovib = True
    hn.write('B', 'c6:2. bb5:8 c6:8 | d6:2 f6:4 g6:4 | f6:2. d6:8 bb5:8 | d6:1 | c6:2. ab5:8 g5:8 | g5:2 ab5:4 d6:4 | bb5:4. d6:8 f6:2 | f6:4 eb6:4 b5:4 ab5:4',
             transpose=-12, vel=102)
    lo = s.part('lowbrass', TROMBONE, rev=.3, layer=[TUBA], role='lead'); lo.autovib = True
    lo.write('D', 'c4:2 g4:2 | eb4:2. g4:4 | ab4:2 eb4:2 | c4:2 eb4:2 | f4:2 c5:2 | ab4:2 f4:2 | g4:2 b4:2 | d5:2 f5:2', vel=104)
    ib = s.part('stabs', BRASS, rev=.22, pan=.1, role='brass', layer=[SYNBRASS])
    ib.write('intro', 'c5+eb5+g5+c6:8 r:8 c5+eb5+g5+c6:8 r:8 r:2 | c5+eb5+ab5+c6:4. d5+f5+bb5+d6:8 r:2 | c5+eb5+g5+c6:8 r:8 c5+eb5+g5+c6:8 r:8 eb5+g5+c6+eb6:4 r:4 | b4+f5+ab5+d6:1', vel=112)
    dr = s.drums(kit=KIT_POWER, rev=.12)
    dr.write('intro', 'K+C:8 r:8 K+S:8 r:8 T1:8 T1 T2 T2 | K+C:4. K+S:8 T3:8 T3 T5 T5 | K+C:8 r:8 K+S:8 r:8 K+S:4 r:4 | S:16 S S S S S S S S S S S T1 T2 T3 T5', vel=110)
    ti = s.part('timp', TIMPANI, rev=.3, role='perc', vol=4)
    ti.write('intro', 'c3:8 r:8 c3:8 r:8 r:2 | ab2:4. bb2:8 r:2 | c3:8 r:8 c3:8 r:8 c3:4 r:4 | r:1')
    roll(ti, s.sec['intro'], 12, 4, 'g2', 50, 120)
    ti.write('D', 'c3:4 c3:8 c3:8 c3:4 r:4 | c3:4 c3:8 c3:8 c3:4 g2:4 | ab2:4 ab2:8 ab2:8 ab2:4 r:4 | ab2:4 ab2:8 ab2:8 ab2:4 eb2:4 | f2:4 f2:8 f2:8 f2:4 r:4 | f2:4 f2:8 f2:8 f2:4 c3:4 | g2:4 g2:8 g2:8 g2:4 r:4 | r:1')
    roll(ti, s.sec['D'], 28, 4, 'g2', 50, 124)
    battle_band(s, 'A', stabs='x..x..x...x.x...', piano='pulse8')
    battle_band(s, 'B', bass='pop8', groove_name='battle2', piano='offbeat', stabs='x.......x.....x.', ost='0 2 1 3 0 2 1 3')
    battle_band(s, 'C', stabs='x.x.x...x.x.x...', piano='pulse8', groove_name='drive', fill='mix')
    battle_band(s, 'D', bass='gallop', groove_name='tom', fills=8, fill='roll', piano=None, strings_ost=True, ost='0 0 1 0 2 0 1 0', ost_lo=55)
    pd = s.part('strings', STRINGS, rev=.3, role='pad', vol=-2)
    pd.gen('A B C', pads, lo=55, hi=79, vel=70)
    return s


# ============================================================================ CRANE FELLOWSHIP (GRUNT) BATTLE
# F minor, 164. Synth-brass and organ; the Crane motif (a curling chromatic neighbour figure),
# a falsely grand major B, and a chromatic side-slipping C.
@song('villain_battle')
def villain_battle(v):
    return _villain(v, 'villain_battle', 0, 164, 'Battle! (Crane Fellowship)')


@song('admin_battle')
def admin_battle(v):
    return _villain(v, 'admin_battle', 3, 168, 'Battle! (Fellowship Admin)', heavy=True)


def _villain(v, sid, tr, bpm, title, heavy=False):
    s = Song(sid, bpm=bpm, title=title, room=1.4, reverb=.85, loudness=-15.5)
    s.section('intro', 4, 'Fm | Gb | Fm | C7b9', intro=True, transpose=tr)
    s.section('A', 8, 'Fm | Fm | Dbmaj7 | Dbmaj7 | Bbm | Bbm | C7 | C7alt', transpose=tr)
    s.section('A2', 8, 'Fm | Eb | Db | C | Fm | Eb | Db | C7', transpose=tr)
    s.section('B', 8, 'Dbmaj7 | Ebsus4 Eb | Cm7 | Fm9 | Bbm9 | Eb13 | Abmaj7 | C7alt', transpose=tr)
    s.section('C', 8, 'Fm | Gb | Fm7 | Gb | Ebm | E | Db | C7', transpose=tr)
    for sec in s.sec.values():   # transpose the chord charts too
        if tr: sec.chords = [(t, d, Chord(_tr(c.sym, tr))) for (t, d, c) in sec.chords]
    lead = s.part('lead', SYNBRASS, rev=.2, layer=[TRUMPET, SAWLEAD] if heavy else [TRUMPET], delay=.08); lead.autovib = True; lead.layer_gain = .7
    lead.write('intro', 'f5:8 r:8 f5:8 r:8 gb5:4 f5:4 | gb5:8 r:8 gb5:8 r:8 ab5:4 gb5:4 | f5:8 r:8 f5:8 r:8 c6:4 ab5:4 | e5:4 g5:4 bb5:4 db6:4', vel=104)
    lead.write('A', 'f5:4 e5:8 f5:8 ab5:4 g5:4 | gb5:2 f5:2 | f5:4 e5:8 f5:8 ab5:4 bb5:4 | c6:2 ab5:2 |'
                    'bb5:4 a5:8 bb5:8 db6:4 c6:4 | cb6:2 bb5:2 | e5:4 g5:8 bb5:8 c6:4 db6:4 | e6:4 db6:4 bb5:4 ab5:4', vel=104)
    lead.write('A2', 'c6:4. ab5:8 f5:4 c5:4 | bb5:4. g5:8 eb5:4 bb4:4 | ab5:4. f5:8 db5:4 ab4:4 | g5:4 c6:4 e6:4 g6:4 |'
                     'ab5:4. g5:8 f5:4 c5:4 | g5:4. f5:8 eb5:4 bb4:4 | f5:4 ab5:4 db6:4 f6:4 | e6:2 c6:4 bb5:4', vel=104)
    lead.write('C', 'f5:8 f5:8 ab5:8 f5:8 c6:8 f5:8 ab5:4 | gb5:8 gb5:8 bb5:8 gb5:8 db6:8 gb5:8 bb5:4 | f5:8 f5:8 ab5:8 f5:8 c6:8 f5:8 eb6:4 | db6:2. bb5:4 |'
                    'eb5:8 eb5:8 gb5:8 eb5:8 bb5:8 eb5:8 gb5:4 | e5:8 e5:8 g#5:8 e5:8 b5:8 e5:8 g#5:4 | f5:4 ab5:4 db6:4 f6:4 | e6:4 c6:4 g5:4 e5:4', vel=104)
    og = s.part('organ', ROCKORGAN, rev=.3, role='lead', layer=[CHOIR]); og.layer_gain = .8
    og.write('B', 'f5:2. eb5:8 c5:8 | ab5:2 g5:2 | g5:2. f5:8 eb5:8 | g5:1 | c6:2. db6:8 bb5:8 | c6:2 db6:4 g5:4 | g5:4. ab5:8 c6:2 | bb5:4 ab5:4 e5:4 db5:4', vel=98)
    dr = s.drums(kit=KIT_ELEC if not heavy else KIT_POWER, rev=.12)
    dr.write('intro', 'K+C:8 r:8 K+S:8 r:8 K:4 S:4 | K:8 r:8 K+S:8 r:8 K:4 S:4 | K+C:8 r:8 K+S:8 r:8 K:4 S:4 | S:16 S S S S S S S T1 T1 T2 T2 T3 T3 T5 T5', vel=108)
    kw = dict(kit=KIT_ELEC if not heavy else KIT_POWER, bass_prog=SYNBASS)
    battle_band(s, 'A A2 C', stabs='x..x...x..x.x...', piano='pulse8', groove_name='battle2' if heavy else 'battle', **kw)
    battle_band(s, 'B', bass='pop8', groove_name='halftime', piano='block', stabs='x...............', strings_ost=True, ost='0 1 2 3 2 1 2 3', **kw)
    battle_band(s, 'intro', piano=None, strings_ost=False, groove_name='none', **kw)
    s.parts['drums'].notes = [n for n in s.parts['drums'].notes if not (0 <= n[0] < s.sec['A'].at) or n[2] in (36, 38, 49, 50, 48, 47, 43)]
    pd = s.part('strings', SYNSTR, rev=.3, role='pad', vol=-2, layer=[STRINGS])
    pd.gen('A A2 B C', pads, lo=53, hi=77, vel=70)
    return s


def _tr(sym, n):
    import re as _re
    names = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']
    def sub(m):
        pc = (PC[m.group(1).lower()] + {'#': 1, 'b': -1}.get(m.group(2) or '', 0) + n) % 12
        return names[pc]
    head = _re.sub(r'^([A-G])(#|b)?', sub, sym)
    return _re.sub(r'/([A-G])(#|b)?', lambda m: '/' + sub(m), head)


# ============================================================================ V. CRANE (VILLAIN LEADER)
# B minor, 158. Pipe organ and choir; the Crane motif stated in full, a tragic major "vision"
# section (what he believes he is saving), a descending-bass lament, and a driving climax.
@song('crane_battle')
def crane_battle(v):
    s = Song('crane_battle', bpm=158, title='Battle! (V. Crane)', room=2.0, reverb=1.0, loudness=-15.0)
    s.section('intro', 4, 'Bm | G/B | Em/B | F#7alt', intro=True)
    s.section('A', 16, 'Bm | Bm | G | G | Em | Em | F#7 | F#7alt | Bm | D | G | C | Bm/F# | E/G# | Gmaj7 | F#7alt')
    s.section('B', 8, 'Gmaj9 | A6 | F#m7 | Bm9 | Em9 | A13 | Dmaj9 | F#7alt')
    s.section('C', 8, 'Bm | Bm/A | Bm/G# | Gmaj7 | Em/G | F#7sus4 | F#7 | F#7alt')
    s.section('D', 8, 'Bm | G | A | F#m | Bm | G | C | F#7alt')
    og = s.part('organ', 19, rev=.45, role='lead', layer=[CHOIR]); og.layer_gain = .9   # church organ
    og.write('intro', 'b3+d4+f#4+b4:2 a#3+c#4+f#4+a#4:2 | b3+d4+g4+b4:1 | b3+e4+g4+b4:2 c4+e4+g4+c5:2 | a#3+e4+g4+d5:1', vel=96)
    og.write('C', 'f#5:1 | f#5:2 e5:2 | d5:1 | b4:2 d5:2 | e5:2. g5:4 | b5:2 c#6:2 | a#5:2 c#6:2 | e6:2 d6:2', vel=96)
    lead = s.part('lead', TRUMPET, rev=.26, layer=[HORN, SYNBRASS], delay=.06); lead.autovib = True; lead.layer_gain = .75
    lead.write('A', 'b4:4 a#4:8 b4:8 d5:4 c#5:4 | c5:2 b4:2 | d5:4 c#5:8 d5:8 f#5:4 e5:4 | g5:2. f#5:4 |'
                    'e5:4 d#5:8 e5:8 g5:4 f#5:4 | f5:2 e5:2 | a#5:4. c#6:8 e6:4 c#6:4 | d6:4 c#6:4 a#5:4 g5:4 |'
                    'f#5:4. b5:8 d6:4 c#6:4 | d6:4. a5:8 f#5:2 | g5:4. b5:8 d6:4 e6:4 | e6^:2. c6:4 |'
                    'd6:4. c#6:8 b5:4 f#5:4 | g#5:4. b5:8 e6:2 | f#6:2 e6:4 d6:4 | c#6:4 a#5:4 g5:4 e5:4', vel=106)
    lead.write('D', 'f#5:8 b5:8 d6:8 f#6:8 e6:4 d6:4 | d6:8 b5:8 g5:8 b5:8 d6:4 g6:4 | e6:4. c#6:8 a5:4 e5:4 | f#5:2. c#6:4 |'
                    'f#5:8 b5:8 d6:8 f#6:8 e6:4 d6:4 | d6:8 b5:8 g5:8 b5:8 e6:4 g6:4 | g6:4. e6:8 c6:4 g5:4 | a#5:4 c#6:4 e6:4 g6:4', vel=108)
    sv = s.part('vision', VIOLIN, rev=.42, layer=[STRINGS, CHOIR], role='lead'); sv.autovib = True
    sv.write('B', 'b5:2. a5:8 b5:8 | c#6:2 e6:4 f#6:4 | e6:2. c#6:8 a5:8 | c#6:1 | b5:2. g5:8 f#5:8 | f#5:2 g5:4 c#6:4 | a5:4. c#6:8 e6:2 | e6:4 d6:4 a#5:4 g5:4', vel=100)
    dr = s.drums(kit=KIT_POWER, rev=.16)
    dr.write('intro', 'K+C:2 K:2 | K+C:1 | K+C:2 K:2 | S:16 S S S S S S S S S S S T1 T2 T3 T5', vel=108)
    ti = s.part('timp', TIMPANI, rev=.4, role='perc', vol=4)
    ti.write('intro', 'b2:2 f#2:2 | b2:1 | b2:2 c3:2 | r:1')
    roll(ti, s.sec['intro'], 12, 4, 'f#2', 50, 124)
    ti.write('C', 'b2:2 r:2 | a2:2 r:2 | g#2:2 r:2 | g2:2 r:2 | g2:2 r:2 | f#2:2 r:2 | f#2:2 r:2 | f#2:2 r:2')
    roll(ti, s.sec['C'], 28, 4, 'f#2', 50, 124)
    battle_band(s, 'A', stabs='x..x..x...x.x...', piano='pulse8', kit=KIT_POWER)
    battle_band(s, 'B', bass='pop8', groove_name='halftime', piano='block', stabs=None, ost='0 1 2 3 2 1 2 3')
    battle_band(s, 'C', bass='pedal', groove_name='halftime', fills=8, fill='roll', piano=None, strings_ost=True, ost='0 1 2 1 0 1 2 1')
    battle_band(s, 'D', stabs='x.x.x...x.x.x...', piano='pulse8', groove_name='drive', fill='mix')
    pd = s.part('strings', STRINGS, rev=.35, role='pad', vol=-2)
    pd.gen('A B C D', pads, lo=52, hi=77, vel=70)
    ch = s.part('choirpad', CHOIR, rev=.5, role='pad', vol=-3)
    ch.gen('A D', pads, lo=55, hi=74, vel=64)
    return s


# ============================================================================ ELITE FOUR
@song('elite')
def elite(v):
    s = Song('elite', bpm=176, title='Battle! (Elite Four)', room=1.7, reverb=.95, loudness=-15.0)
    s.section('intro', 4, 'Em | C | Am | B7', intro=True)
    s.section('A', 16, 'Em | Em | C | C | Am | Am | B7sus4 | B7 | Em | G | C | Am | F#m7b5 | B7b9 | Em | B7alt')
    s.section('B', 8, 'Cmaj9 | D6 | Bm7 | Em9 | Am9 | D13 | Gmaj9 | B7alt')
    s.section('C', 8, 'Em | F | Em | F | Dm | Eb | C | B7')
    s.section('D', 8, 'Em | Em | C | C | Am | Am | B7 | B7')
    lead = s.part('lead', TRUMPET, rev=.24, layer=[SYNBRASS], delay=.06); lead.autovib = True; lead.layer_gain = .75
    lead.write('intro', 'e5:4. e5:8 e5:4 g5:4 | e5:4. e5:8 e5:4 c6:4 | a5:4. a5:8 a5:4 c6:4 | b5:4 d#6:4 f#6:4 a6:4', vel=106)
    lead.write('A', 'b4:4 e5:4 g5:8 f#5:8 e5:8 g5:8 | b5:2. a5:8 g5:8 | g5:4 e5:4 c6:8 b5:8 a5:8 g5:8 | e5:2. r:4 |'
                    'a4:4 c5:4 e5:8 d5:8 c5:8 e5:8 | a5:2. g5:8 f#5:8 | e5:4. f#5:8 a5:4 e5:4 | d#5:2 f#5:4 a5:4 |'
                    'g5:4 b5:4 e6:8 d6:8 b5:8 g5:8 | d6:2. b5:4 | c6:4 e6:4 g6:8 f#6:8 e6:8 c6:8 | a5:2. c6:4 |'
                    'a5:4. c6:8 e6:4 c6:4 | d#6:4. c6:8 a5:4 f#5:4 | e5:8 f#5:8 g5:8 b5:8 e6:2 | d#6:4 c6:4 a5:4 g5:4', vel=106)
    lead.write('C', 'e5:8 e5:8 r:8 e5:8 g5:8 e5:8 b5:4 | f5:8 f5:8 r:8 f5:8 a5:8 f5:8 c6:4 | e5:8 e5:8 r:8 e5:8 b5:8 g5:8 e6:4 | f6:4. c6:8 a5:4 f5:4 |'
                    'd5:8 d5:8 r:8 d5:8 f5:8 d5:8 a5:4 | eb5:8 eb5:8 r:8 eb5:8 g5:8 eb5:8 bb5:4 | c6:4 e6:4 g6:4 e6:4 | f#5:4 a5:4 b5:4 d#6:4', vel=108)
    hn = s.part('horns', HORN, rev=.36, layer=[STRINGS, VIOLIN], role='lead'); hn.autovib = True
    hn.write('B', 'e6:2. d6:8 e6:8 | f#6:2 a5:4 b5:4 | a5:2. f#5:8 d5:8 | f#5:1 | e6:2. c6:8 b5:8 | b5:2 c6:4 f#6:4 | d6:4. f#6:8 a5:2 | a5:4 g5:4 d#5:4 c5:4',
             transpose=-12, vel=102)
    hn.write('D', 'b4:1 | e5:2 g5:2 | e5:1 | c5:2 e5:2 | a4:1 | c5:2 e5:2 | d#5:1 | f#5:2 a5:2', vel=100)
    dr = s.drums(kit=KIT_POWER, rev=.14)
    dr.write('intro', 'K+C:4. K:8 K+S:4 K:4 | K+C:4. K:8 K+S:4 K:4 | K+C:4. K:8 K+S:4 K:4 | S:16 S S S S S S S T1 T1 T2 T2 T3 T3 T5 T5', vel=110)
    ti = s.part('timp', TIMPANI, rev=.3, role='perc', vol=4)
    ti.write('intro', 'e2:4. e2:8 e2:4 r:4 | c3:4. c3:8 c3:4 r:4 | a2:4. a2:8 a2:4 r:4 | r:1')
    roll(ti, s.sec['intro'], 12, 4, 'b2', 50, 124)
    battle_band(s, 'intro', piano='pulse8', strings_ost=True, groove_name='none')
    battle_band(s, 'A', stabs='x..x..x...x.x...', piano='pulse8', ost='0 1 2 1 3 2 1 2')
    battle_band(s, 'B', bass='pop8', groove_name='battle2', piano='offbeat', stabs='x.......x.....x.', ost='0 2 1 3 0 2 1 3')
    battle_band(s, 'C', stabs='x.x.x...x.x.x...', piano='pulse8', groove_name='drive', fill='mix')
    battle_band(s, 'D', bass='gallop', groove_name='tom', fills=8, fill='roll', piano='pulse8', strings_ost=True, ost='0 0 1 0 2 0 1 0', ost_lo=55)
    s.parts['drums'].notes = [n for n in s.parts['drums'].notes if not (0 <= n[0] < s.sec['A'].at) or n[2] in (36, 38, 49, 50, 48, 47, 43)]
    pd = s.part('strings', STRINGS, rev=.3, role='pad', vol=-2)
    pd.gen('A B C D', pads, lo=55, hi=79, vel=70)
    return s


# ============================================================================ CHAMPION SABLE
# F# minor, 184. A solo-piano ostinato in 3-against-4 opens, the full band crashes in; the
# B section quotes the Solmere main theme in A major (the Champion is the region's pride).
@song('champion')
def champion(v):
    from motifs import MAIN_A
    s = Song('champion', bpm=184, title='Battle! (Champion Sable)', room=1.8, reverb=.95, loudness=-14.8)
    s.section('intro', 8, 'F#m | F#m/E | D | C#7 | F#m | F#m/E | Dmaj7 | C#7alt', intro=True)
    s.section('A', 16, 'F#m | F#m | D | E | F#m | F#m | Bm7 | C#7 | D | E7 | C#m7 | F#m | Bm7 | E7 | Amaj7 | C#7alt')
    s.section('B', 8, 'Amaj9 | F#m11 | Dmaj9 | E13sus4 E13 | Amaj9 | Bm11 | F#m9 | Dmaj7#11')
    s.section('C', 8, 'F#m | G | F#m | G | Em | F | D | C#7')
    s.section('D', 8, 'F#m | F#m/E | D | C#7 | F#m | F#m/E | D | C#7alt')
    pn = s.part('piano', BRIGHT, rev=.22, role='lead', pan=-.1)
    pn.gen('intro', ostinato, pattern='0 1 2 3 2 1', lo=54, vel=96)
    pn.gen('D', ostinato, pattern='0 1 2 3 2 1', lo=54, vel=92)
    pl = s.part('pianolo', PIANO, rev=.2, role='comp', pan=-.15)
    pl.write('intro', 'f#2+f#3:1 | e2+e3:1 | d2+d3:1 | c#2+c#3:1 | f#2+f#3:1 | e2+e3:1 | d2+d3:1 | c#2+c#3:1', vel=100)
    lead = s.part('lead', TRUMPET, rev=.24, layer=[SYNBRASS], delay=.06); lead.autovib = True; lead.layer_gain = .75
    lead.write('A', 'c#5:4 f#5:8 g#5:8 a5:4 g#5:8 f#5:8 | c#6:2. b5:8 a5:8 | a5:4 f#5:8 a5:8 d6:4 c#6:8 a5:8 | b5:2. g#5:4 |'
                    'c#5:4 f#5:8 g#5:8 a5:4 c#6:8 e6:8 | f#6^:2. e6:8 c#6:8 | d6:4. c#6:8 b5:4 f#5:4 | e#5:4 g#5:4 b5:4 c#6:4 |'
                    'd6:4. c#6:8 a5:4 f#5:4 | e6:4. d6:8 b5:4 g#5:4 | e6:4. c#6:8 b5:2 | a5:2. c#6:4 |'
                    'd6:4 f#6:4 e6:8 d6:8 c#6:8 b5:8 | d6:2 b5:4 g#5:4 | c#6:4. e6:8 g#5:2 | e#5:4 d5:4 b4:4 a4:4', vel=108)
    lead.write('C', 'f#5:8 f#5:8 r:8 f#5:8 a5:8 f#5:8 c#6:4 | g5:8 g5:8 r:8 g5:8 b5:8 g5:8 d6:4 | f#5:8 f#5:8 r:8 f#5:8 c#6:8 a5:8 f#6:4 | g6:4. d6:8 b5:4 g5:4 |'
                    'e5:8 e5:8 r:8 e5:8 g5:8 e5:8 b5:4 | f5:8 f5:8 r:8 f5:8 a5:8 f5:8 c6:4 | d6:4 f#6:4 a5:4 d6:4 | e#6:4 c#6:4 g#5:4 e#5:4', vel=110)
    hn = s.part('horns', HORN, rev=.4, layer=[STRINGS, VIOLIN], role='lead'); hn.autovib = True
    hn.write('B', MAIN_A, transpose=-5, vel=104)
    sl = s.part('strlead', VIOLIN, rev=.4, layer=[STRINGS], role='lead'); sl.autovib = True
    sl.write('D', 'c#6:1 | c#6:2 a5:2 | a5:1 | g#5:1 | c#6:1 | e6:2 c#6:2 | c#6:1 | e#6:2 d6:2', vel=98)
    ib = s.part('stabs', BRASS, rev=.22, pan=.1, role='brass', layer=[SYNBRASS])
    ib.write('intro', 'r:1 | r:1 | r:1 | r:1 | f#4+a4+c#5+f#5:8 r:8 r:4 f#4+a4+c#5+f#5:8 r:8 r:4 | e4+a4+c#5+e5:8 r:8 r:4 e4+a4+c#5+e5:8 r:8 r:4 | d4+f#4+a4+c#5:2. r:4 | e#4+b4+d5+a5:1', vel=110)
    dr = s.drums(kit=KIT_POWER, rev=.14)
    dr.write('intro', 'r:1 | r:1 | r:1 | r:2 S:16 S S S S S S S | K+C:4 r:4 K:4 S:4 | K:4 r:4 K:4 S:4 | K+C:4 r:4 K:4 S:4 | S:16 S S S S S S S T1 T1 T2 T2 T3 T3 T5 T5', vel=110)
    ti = s.part('timp', TIMPANI, rev=.3, role='perc', vol=4)
    ti.write('intro', 'r:1 | r:1 | r:1 | r:1 | f#2:4 r:2. | e2:4 r:2. | d2:4 r:2. | r:1')
    roll(ti, s.sec['intro'], 28, 4, 'c#3', 50, 124)
    battle_band(s, 'intro', piano=None, strings_ost=False, groove_name='none')
    s.parts['bass'].notes = [n for n in s.parts['bass'].notes if n[0] >= 16]
    battle_band(s, 'A', stabs='x..x..x...x.x...', piano=None, ost='0 1 2 1 3 2 1 2')
    battle_band(s, 'B', bass='pop8', groove_name='battle2', piano=None, stabs='x.......x.....x.', ost='0 2 1 3 0 2 1 3')
    battle_band(s, 'C', stabs='x.x.x...x.x.x...', piano=None, groove_name='drive', fill='mix')
    battle_band(s, 'D', bass='drive', groove_name='halftime', fills=8, fill='tom', piano=None, strings_ost=False)
    s.parts['drums'].notes = [n for n in s.parts['drums'].notes if not (0 <= n[0] < s.sec['A'].at) or n[2] in (36, 38, 49, 50, 48, 47, 43)]
    cp = s.part('comp', BRIGHT, rev=.18, role='comp', pan=.25)
    cp.gen('A C', comp, style='pulse8', lo=52, hi=72, vel=70)
    cp.gen('B', comp, style='offbeat', lo=52, hi=72, vel=68)
    pd = s.part('strings', STRINGS, rev=.3, role='pad', vol=-2)
    pd.gen('A B C D', pads, lo=55, hi=79, vel=70)
    ch = s.part('choir', CHOIR, rev=.5, role='pad', vol=-4)
    ch.gen('B D', pads, lo=55, hi=74, vel=62)
    return s


# ============================================================================ ORRELUME (LEGENDARY)
# E minor / E lydian, 138. Taiko, choir, harp and the Tide motif; the B section opens into lydian
# major (the leviathan's song), the C section is a phrygian taiko storm.
@song('legend')
def legend(v):
    s = Song('legend', bpm=138, title='Battle! (Orrelume)', room=2.6, reverb=1.1, loudness=-15.5)
    s.section('intro', 4, 'Emaj7#11 | Emaj7#11 | Cmaj7#11 | B7sus4 B7', intro=True)
    s.section('A', 16, 'Em | C/E | Cmaj7#11 | Cmaj7#11 | Em | C/E | Am9 | B7sus4 B7 | Em | D | Cmaj7 | Am7 | Em/G | F#m7b5 | Cmaj7#11 | B7alt')
    s.section('B', 8, 'Emaj9 | F#/E | Emaj9 | F#/E | C#m9 | Amaj9 | F#m9 | B13')
    s.section('C', 8, 'Em | F | Em | F | Dm | Eb | Cmaj7 | B7')
    hn = s.part('horns', HORN, rev=.5, layer=[STRINGS, CHOIR], role='lead'); hn.autovib = True
    hn.write('intro', 'e4:2 b4:2 | a#4:1 | g4:2 f#4:2 | e4:2 d#4:2', vel=90)
    hn.write('A', 'e5:2 b5:2 | c6:2. b5:4 | b5:2 f#5:2 | g5:1 | e5:2 b5:2 | d6:2. c6:4 | b5:2 e5:4 g5:4 | e5:2 d#5:2 |'
                  'g5:4. f#5:8 e5:4 b5:4 | a5:2. f#5:4 | g5:4. e5:8 b5:4 e6:4 | c6:2. a5:4 | b5:4. a5:8 g5:4 e5:4 | a5:2 c6:2 | b5:2 f#6:2 | d#6:4 c6:4 a5:4 g5:4',
             transpose=-12, vel=102)
    ch = s.part('choirlead', CHOIR, rev=.55, role='lead', layer=[VIOLIN, FLUTE]); ch.autovib = True
    ch.write('B', 'e5:2 b5:2 | a#5:1 | g#5:2 f#5:4 e5:4 | f#5:1 | g#5:2 d#6:2 | c#6:2. b5:4 | a5:2 g#5:4 e5:4 | d#5:2 g#5:2', vel=100)
    tp = s.part('trumpet', TRUMPET, rev=.3, role='lead', layer=[SYNBRASS]); tp.autovib = True; tp.layer_gain = .7
    tp.write('C', 'b5:4. b5:8 c6:4 b5:4 | c6:4. c6:8 f6:4 c6:4 | b5:4. b5:8 e6:4 g6:4 | f6:2. c6:4 | a5:4. a5:8 d6:4 a5:4 | bb5:4. bb5:8 eb6:4 bb5:4 | b5:4 g5:4 e5:4 c5:4 | d#5:4 f#5:4 a5:4 b5:4', vel=106)
    hp = s.part('harp', HARP, rev=.5, pan=.35)
    hp.gen('intro A B', comp, style='arp', arp='updown', lo=52, hi=76, vel=66)
    pad = s.part('pad', HALOPAD, rev=.5, role='pad', width=1.5, layer=[SLOWSTR])
    pad.gen('intro A B C', pads, lo=50, hi=74, vel=70)
    bs = s.part('bass', CONTRABASS, rev=.12, layer=[SYNBASS]); bs.layer_gain = .7
    bs.gen('intro', bass_line, style='pedal', vel=90)
    bs.gen('A B', bass_line, style='two', vel=94, approach=False)
    bs.gen('C', bass_line, style='drive', vel=100, lo=28, hi=48)
    tk = s.part('taiko', TAIKO, rev=.3, role='perc', vol=5)
    for sec in ('A', 'C'):
        for b in range(s.sec[sec].bars):
            tk.write(sec, 'e2:4 r:8 e2:8 e2:4 r:4' if b % 2 == 0 else 'e2:4 r:8 e2:8 e2:8 e2:8 e2:8 e2:8', at=b * 4, strict=False)
    ti = s.part('timp', TIMPANI, rev=.4, role='perc', vol=3)
    roll(ti, s.sec['intro'], 8, 8, 'b2', 30, 120)
    roll(ti, s.sec['B'], 28, 4, 'b2', 40, 120)
    dr = s.drums(kit=KIT_ORCH, rev=.3)
    dr.gen('A', groove, name='halftime', fills=4, fill='tom', vel=96, crash_every=4)
    dr.gen('B', groove, name='soft', fills=8, fill='roll', vel=84)
    dr.gen('C', groove, name='battle', fills=4, fill='tom', vel=104, crash_every=4)
    so = s.part('ost', STRINGS, rev=.3, role='comp', pan=-.25, width=1.3)
    so.gen('A C', ostinato, pattern='0 1 2 1 3 2 1 2', lo=60, vel=78)
    return s


# ============================================================================ THE WANDERER (POSTGAME)
# D dorian, 184. Jazz-fusion: tenor sax + trumpet over Rhodes, slap bass and 3+3+2 accents.
@song('wanderer')
def wanderer(v):
    s = Song('wanderer', bpm=184, title='Battle! (The Wanderer)', room=1.4, reverb=.8, loudness=-15.3)
    s.section('intro', 4, 'Dm9 | Bbmaj7#11 | Gm9 C13 | A7alt', intro=True)
    s.section('A', 8, 'Dm9 | Dm9 | Bbmaj7#11 | Bbmaj7#11 | Gm9 | C13 | Fmaj9 | A7alt')
    s.section('A2', 8, 'Dm9 | Em7b5 A7 | Dm9 | Ebmaj7#11 | Gm9 | C13 | Am9 D7alt | Gm9 A7alt')
    s.section('B', 8, 'Bbmaj9 | C/Bb | Am7 | Dm9 | Gm9 | C13 | Fmaj9 | E7alt A7alt')
    s.section('C', 8, 'Dm | Eb | Dm | Eb | Cm | Db | Bb | A7alt')
    sx = s.part('lead', TENORSAX, rev=.24, layer=[TRUMPET], delay=.08); sx.autovib = True; sx.layer_gain = .6
    sx.write('A', 'd5:8. f5:8. a5:8 c6:8. a5:8. e5:8 | f5:4. e5:8 d5:4 a4:4 | bb4:8. d5:8. f5:8 a5:8. f5:8. e5:8 | a5:4. f5:8 d5:4 e5:4 |'
                  'bb5:4 a5:8 g5:8 d5:4 f5:4 | e5:4 g5:8 a5:8 bb5:4 d6:4 | c6:4. a5:8 e5:4 g5:4 | c#6:4 bb5:4 g5:4 f5:4', vel=104)
    sx.write('A2', 'd5:8. f5:8. a5:8 c6:8. d6:8. e6:8 | d6:4 bb5:4 c#6:4 g5:4 | f5:4. e5:8 d5:4 a5:4 | g5:4. a5:8 bb5:4 d6:4 |'
                   'bb5:8. a5:8. g5:8 f5:8. d5:8. bb4:8 | e5:4 a5:4 g5:4 bb5:4 | c6:4 b5:4 f#5:4 c6:4 | bb5:4 a5:4 c#5:4 bb4:4', vel=104)
    sx.write('C', 'd5:8 d5:8 r:8 d5:8 f5:8 d5:8 a5:4 | eb5:8 eb5:8 r:8 eb5:8 g5:8 eb5:8 bb5:4 | d5:8 d5:8 r:8 d5:8 a5:8 f5:8 d6:4 | eb6:4. bb5:8 g5:4 eb5:4 |'
                  'c5:8 c5:8 r:8 c5:8 eb5:8 c5:8 g5:4 | db5:8 db5:8 r:8 db5:8 f5:8 db5:8 ab5:4 | bb5:4 d6:4 f6:4 d6:4 | c#6:4 bb5:4 g5:4 f5:4', vel=106)
    vb = s.part('vibes', VIBES, rev=.3, role='lead', layer=[EPIANO])
    vb.write('B', 'd6:4. c6:8 a5:4 f5:4 | e5:4. g5:8 c6:2 | c6:4. b5:8 a5:4 e5:4 | f5:1 | a5:4. bb5:8 d6:4 f6:4 | e6:4. d6:8 bb5:4 a5:4 | g5:4. a5:8 c6:4 e6:4 | g#5:4 f5:4 c#5:4 bb4:4', vel=100)
    ep = s.part('epiano', EPIANO, rev=.22, chorus=.35, role='comp', pan=-.25)
    ep.gen('intro A A2 C', comp, style='stabs', pattern='x..x..x...x..x..', lo=53, hi=72, vel=74)
    ep.gen('B', comp, style='swingcomp', lo=53, hi=72, vel=70)
    sb = s.part('bass', SLAP, rev=.04)
    sb.gen('intro A A2 C', bass_line, style='funk', pattern='x..x..x.o.x..x.o', vel=102, lo=28, hi=50)
    sb.gen('B', bass_line, style='walk', vel=98, lo=28, hi=52)
    st = s.part('stabs', SYNBRASS, rev=.2, role='brass', layer=[BRASS])
    st.gen('A A2 C', comp, style='stabs', pattern='x.....x.......x.', lo=58, hi=79, vel=100, rootless=False)
    st.write('intro', 'd5+f5+a5+e6:8. d5+f5+a5+e6:8. r:8 d5+f5+a5+e6:8. d5+f5+a5+e6:8. r:8 | d5+f5+a5+e6:8. d5+f5+a5+e6:8. r:8 d5+f5+a5+e6:8. d5+f5+a5+e6:8. r:8 | r:1 | c#5+g5+bb5+f6:1', vel=106)
    dr = s.drums(kit=KIT_STD, rev=.1)
    dr.write('intro', 'K+C:8. K:8. S:8 K:8. K:8. S:8 | K+C:8. K:8. S:8 K:8. K:8. S:8 | K+C:8. K:8. S:8 K:8. K:8. S:8 | S:16 S S S S S S S T1 T1 T2 T2 T3 T3 T5 T5', vel=108)
    dr.gen('A A2 C', groove, name='city', fills=4, fill='mix', vel=100, extra=dict(K='x-----x---x-----', S='----x--o-o--x--o'))
    dr.gen('B', groove, name='city', fills=8, fill='snare', vel=92, ride=True)
    pd = s.part('pad', WARMPAD, rev=.35, role='pad', vol=-2)
    pd.gen('A A2 B C', pads, lo=53, hi=76, vel=64)
    return s


# ============================================================================ BATTLE SPIRE
@song('spire_battle')
def spire_battle(v):
    s = Song('spire_battle', bpm=168, title='Battle! (Battle Spire)', room=1.4, reverb=.85, loudness=-15.3)
    s.section('intro', 2, 'Am | E7', intro=True)
    s.section('A', 8, 'Am | G | F | E7 | Am | G | F | E7')
    s.section('A2', 8, 'Dm9 | G13 | Cmaj9 | Fmaj7 | Bm7b5 | E7 | Am | E7alt')
    s.section('B', 8, 'Fmaj7 | G6 | Em7 | Am9 | Dm9 | G13 | Cmaj7 | E7alt')
    s.section('C', 8, 'Am | Bb | Am | Bb | Gm | Ab | F | E7')
    ld = s.part('lead', SAWLEAD, rev=.2, layer=[SYNBRASS], delay=.1); ld.autovib = True; ld.layer_gain = .7
    ld.write('A', 'a5:8 c6:8 e6:8 a6:8 g6:8 e6:8 c6:8 a5:8 | b5:8 d6:8 g6:8 d6:8 b5:4 g5:4 | a5:8 c6:8 f6:8 c6:8 a5:4 f5:4 | g#5:4 b5:4 d6:4 e6:4 |'
                 'e6:4. d6:8 c6:4 a5:4 | d6:4. c6:8 b5:4 g5:4 | c6:4. a5:8 f5:4 a5:4 | g#5:2 b5:4 d6:4', vel=100)
    ld.write('A2', 'f5:4. e5:8 a5:4 c6:4 | b5:4. a5:8 e5:4 f5:4 | e5:4. d5:8 g5:4 b5:4 | a5:1 | d6:4. c6:8 a5:4 f5:4 | g#5:4. b5:8 d6:4 e6:4 | c6:4 b5:8 a5:8 e5:4 a5:4 | g#5:4 f5:4 d5:4 c5:4', vel=100)
    ld.write('C', 'a5:8 a5:8 r:8 a5:8 c6:8 a5:8 e6:4 | bb5:8 bb5:8 r:8 bb5:8 d6:8 bb5:8 f6:4 | a5:8 a5:8 r:8 a5:8 e6:8 c6:8 a6:4 | bb6:4. f6:8 d6:4 bb5:4 |'
                 'g5:8 g5:8 r:8 g5:8 bb5:8 g5:8 d6:4 | ab5:8 ab5:8 r:8 ab5:8 c6:8 ab5:8 eb6:4 | f6:4 c6:4 a5:4 f5:4 | g#5:4 b5:4 d6:4 e6:4', vel=102)
    tp = s.part('trumpet', TRUMPET, rev=.28, layer=[HORN], role='lead'); tp.autovib = True
    tp.write('B', 'a5:2. g5:8 a5:8 | b5:2 d6:4 e6:4 | d6:2. b5:8 g5:8 | b5:1 | a5:2. f5:8 e5:8 | e5:2 f5:4 b5:4 | g5:4. b5:8 e6:2 | d6:4 c6:4 g#5:4 f5:4', vel=102)
    dr = s.drums(kit=KIT_ELEC, rev=.12)
    dr.write('intro', 'K+C:8 r:8 K+S:8 r:8 K:8 K S:4 | S:16 S S S S S S S T1 T1 T2 T2 T3 T3 T5 T5', vel=108)
    battle_band(s, 'A A2 C', stabs='x..x..x...x.x...', piano='pulse8', kit=KIT_ELEC, bass_prog=SYNBASS2, groove_name='battle2')
    battle_band(s, 'B', bass='pop8', groove_name='disco', piano='offbeat', stabs='x.......x.....x.', ost='0 2 1 3 0 2 1 3', kit=KIT_ELEC)
    pd = s.part('pad', POLYSYNTH, rev=.3, role='pad', vol=-2, layer=[STRINGS])
    pd.gen('A A2 B C', pads, lo=55, hi=79, vel=70)
    return s


# ============================================================================ ENCOUNTERS ("eyes meet")
@song('encounter')
def encounter(v):
    s = Song('encounter', bpm=150, title='Eyes Meet! (Trainer)', room=1.3, reverb=.8, loudness=-15.8)
    s.section('intro', 2, 'E | F#m7 B7', intro=True)
    s.section('A', 8, 'Emaj7 | C#m7 | Amaj7 | B7sus4 B7 | Emaj7 | C#m7 | F#m7 | B7')
    ld = s.part('lead', TRUMPET, rev=.22, layer=[SYNBRASS], delay=.08); ld.autovib = True; ld.layer_gain = .7
    ld.write('intro', 'e5+g#5+b5:8 r:8 e5+g#5+b5:8 r:8 r:2 | f#5+a5+c#6:8 r:8 f#5+a5+c#6:8 r:8 r:8 d#5+f#5+a5+b5:4.', vel=110)
    ld.write('A', 'b4:8 e5:8 g#5:8 b5:8 r:8 g#5:8 b5:4 | c#6:4. b5:8 g#5:4 e5:4 | a4:8 c#5:8 e5:8 a5:8 r:8 g#5:8 a5:4 | b5:2 a5:4 d#5:4 |'
                  'b4:8 e5:8 g#5:8 b5:8 r:8 d#6:8 e6:4 | c#6:4. b5:8 g#5:4 c#6:4 | a5:4. g#5:8 f#5:4 c#5:4 | d#5:4 f#5:4 a5:4 b5:4', vel=102)
    battle_band(s, 'A', bass='pop8', groove_name='pop2', stabs='x..x..x...x.....', kit=KIT_STD, piano='offbeat', ost='0 1 2 3 2 1 2 3')
    dr = s.parts['drums']; dr.write('intro', 'K+C:8 r:8 K+S:8 r:8 r:2 | K+C:8 r:8 K+S:8 r:8 S:16 S S S T1 T2 T3 T5', vel=108)
    return s


@song('encounter_villain')
def encounter_villain(v):
    s = Song('encounter_villain', bpm=140, title='Eyes Meet! (Crane Fellowship)', room=1.3, reverb=.8, loudness=-15.8)
    s.section('intro', 2, 'Cm | G7b9', intro=True)
    s.section('A', 8, 'Cm | Cm | Abmaj7 | G7 | Cm | Cm | Db | G7alt')
    ld = s.part('lead', SYNBRASS, rev=.22, layer=[TRUMPET], delay=.1); ld.autovib = True; ld.layer_gain = .7
    ld.write('intro', 'c5+eb5+g5:8 r:8 c5+eb5+g5:8 r:8 db5+f5+ab5:4 c5+eb5+g5:4 | b4+d5+f5+ab5:2. r:4', vel=108)
    ld.write('A', 'c5:4 b4:8 c5:8 eb5:4 d5:4 | db5:2 c5:2 | c5:4 b4:8 c5:8 eb5:4 f5:4 | g5:2 b4:2 | g5:4 f#5:8 g5:8 bb5:4 ab5:4 | g5:2 eb5:2 | f5:4 ab5:4 db6:4 c6:4 | b5:4 ab5:4 f5:4 d5:4', vel=102)
    battle_band(s, 'A', bass='drive', groove_name='battle', stabs='x..x...x..x.....', kit=KIT_ELEC, bass_prog=SYNBASS, piano='pulse8', ost='0 1 2 1 0 1 2 3')
    dr = s.parts['drums']; dr.write('intro', 'K+C:8 r:8 K+S:8 r:8 K+S:4 K+S:4 | S:16 S S S S S S S T1 T1 T2 T2 T3 T3 T5 T5', vel=108)
    return s


@song('encounter_boss')
def encounter_boss(v):
    s = Song('encounter_boss', bpm=128, title='Eyes Meet! (Warden)', room=1.8, reverb=.95, loudness=-15.8)
    s.section('intro', 2, 'Dm | A7b9', intro=True)
    s.section('A', 8, 'Dm | Bb | Gm | A7 | Dm | Bb | E7 | A7alt')
    ld = s.part('lead', TRUMPET, rev=.3, layer=[HORN, SYNBRASS]); ld.autovib = True; ld.layer_gain = .75
    ld.write('intro', 'd5+f5+a5+d6:4. d5+f5+a5+d6:8 d5+f5+a5+d6:2 | c#5+g5+bb5+e6:1', vel=112)
    ld.write('A', 'a5:4. d6:8 f6:4 e6:4 | d6:2. bb5:4 | bb5:4. g5:8 d6:4 bb5:4 | c#6:2. e6:4 | f6:4. e6:8 d6:4 a5:4 | bb5:2. d6:4 | g#5:4. b5:8 d6:4 e6:4 | c#6:4 bb5:4 g5:4 f5:4', vel=106)
    battle_band(s, 'A', bass='gallop', groove_name='halftime', fills=4, fill='tom', stabs='x.......x.x.....', kit=KIT_POWER, piano='block', ost='0 1 2 1 3 2 1 2')
    dr = s.parts['drums']; dr.write('intro', 'K+C:4. K:8 K+C:2 | S:16 S S S S S S S T1 T1 T2 T2 T3 T3 T5 T5', vel=110)
    ti = s.part('timp', TIMPANI, rev=.35, role='perc', vol=4)
    ti.write('intro', 'd3:4. d3:8 d3:2 | r:1'); roll(ti, s.sec['intro'], 4, 4, 'a2', 50, 124)
    ti.write('A', 'd3:2 r:2 | bb2:2 r:2 | g2:2 r:2 | a2:2 r:2 | d3:2 r:2 | bb2:2 r:2 | e2:2 r:2 | a2:2 r:2')
    return s


# ============================================================================ VICTORY THEMES
def _victory(sid, title, bpm, fan_ch, fan, loop_ch, mel, key_drums=KIT_STD, bass='pop8', groove_name='pop', lead_prog=TRUMPET, counter=None):
    s = Song(sid, bpm=bpm, title=title, room=1.6, reverb=1.0, loudness=-16.5)
    s.section('intro', len(fan_ch.split('|')), fan_ch, intro=True)
    s.section('A', len(loop_ch.split('|')), loop_ch)
    br = s.part('fanfare', BRASS, rev=.3, role='lead', layer=[TRUMPET])
    br.write('intro', fan, vel=112)
    ld = s.part('lead', lead_prog, rev=.3, layer=[HORN] if lead_prog == TRUMPET else [], delay=.08); ld.autovib = True
    ld.write('A', mel, vel=98)
    if counter:
        cn = s.part('counter', FLUTE, rev=.4, role='counter'); cn.autovib = True; cn.write('A', counter, vel=84)
    bs = s.part('bass', FINGERBASS, rev=.05); bs.gen('A', bass_line, style=bass, vel=94)
    bs.gen('intro', bass_line, style='pedal', vel=96)
    pn = s.part('piano', BRIGHT, rev=.2, pan=-.2); pn.gen('A', comp, style='offbeat', lo=55, hi=74, vel=64)
    st = s.part('strings', STRINGS, rev=.4, role='pad'); st.gen('intro A', pads, lo=53, hi=77, vel=66)
    gl = s.part('glock', GLOCK, rev=.45, role='sparkle'); gl.write('A', mel, transpose=12, vel=70)
    dr = s.drums(kit=key_drums, rev=.16)
    dr.gen('A', groove, name=groove_name, fills=4, fill='snare', vel=88, tamb='x-x-x-x-x-x-x-x-')
    ti = s.part('timp', TIMPANI, rev=.4, role='perc', vol=2)
    return s, dr, ti


@song('victory_wild')
def victory_wild(v):
    s, dr, ti = _victory('victory_wild', 'Victory! (Wild)', 140, 'C | G7sus4 G7',
                         'c5+e5+g5+c6:8 r:8 c5+e5+g5+c6:8 r:8 c5+e5+g5+c6:4. r:8 | d5+f5+g5+c6:4 d5+f5+g5+b5:4 d5+f5+b5+d6:2',
                         'Cmaj7 | Am7 | Dm9 | G13 | Cmaj7 | Am7 | Fmaj7 G7 | C6',
                         'e5:8 g5:8 c6:4 b5:8 a5:8 g5:4 | a5:4. c6:8 e6:4 c6:4 | f5:8 a5:8 c6:4 b5:8 a5:8 f5:4 | e5:2. d5:4 |'
                         'e5:8 g5:8 c6:4 b5:8 a5:8 g5:4 | c6:4. e6:8 g6:4 e6:4 | a5:4 c6:4 b5:4 d6:4 | c6:2. r:4')
    dr.write('intro', 'K+C:8 r:8 K+C:8 r:8 K+C:4. r:8 | S:8 S S S S:16 S S S S S S S', vel=104)
    return s


@song('victory_trainer')
def victory_trainer(v):
    s, dr, ti = _victory('victory_trainer', 'Victory! (Trainer)', 132, 'G | D/F# | Em | C D',
                         'g4+b4+d5+g5:8 r:8 g4+b4+d5+g5:8 r:8 g4+b4+d5+g5:2 | f#4+a4+d5+f#5:4. f#4+a4+d5+a5:8 f#4+a4+d5+f#5:2 | e4+g4+b4+e5:4. e4+g4+b4+g5:8 e4+g4+b4+b5:2 | e4+g4+c5+e5:2 f#4+a4+d5+f#5:2',
                         'Gmaj7 | Em7 | Cmaj9 | D13 | Bm7 | Em9 | Am7 D7 | Gmaj7 | Gmaj7 | B7/F# | Em7 | A7 | Cmaj7 | D6 | Bm7 E7 | Am7 D7sus4',
                         'g5:8 b5:8 d6:4 c6:8 b5:8 a5:4 | b5:4. g5:8 e5:2 | e5:8 g5:8 b5:4 a5:8 g5:8 e5:4 | f#5:2. d5:4 |'
                         'd5:8 f#5:8 a5:4 g5:8 f#5:8 d5:4 | g5:4. f#5:8 e5:4 b5:4 | c6:4 a5:4 f#5:4 c6:4 | b5:2. r:4 |'
                         'g5:8 b5:8 d6:4 c6:8 b5:8 a5:4 | a5:4. f#5:8 d#5:2 | e5:8 g5:8 b5:4 d6:4 e6:4 | c#6:2. a5:4 |'
                         'b5:4. c6:8 e6:4 g6:4 | f#6:2 e6:4 d6:4 | d6:4 b5:4 g#5:4 b5:4 | c6:2 a5:4 f#5:4',
                         counter='r:1 | d6:2 b5:2 | r:1 | a5:2 c6:2 | r:1 | b5:2 g5:2 | r:1 | d6:2 f#6:2 | r:1 | f#6:2 d#6:2 | r:1 | e6:2 c#6:2 | r:1 | d6:2 a5:2 | r:1 | e6:2 c6:2')
    dr.write('intro', 'K+C:8 r:8 K+C:8 r:8 K+C:2 | K:4. K:8 S:2 | K:4. K:8 S:2 | S:8 S S S S:16 S S S T1 T2 T3 T5', vel=104)
    return s


@song('victory_gym')
def victory_gym(v):
    s, dr, ti = _victory('victory_gym', 'Victory! (Warden)', 126, 'Eb | Ab | Bb7sus4 | Bb7',
                         'eb4+g4+bb4+eb5:4. eb4+g4+bb4+eb5:8 eb4+g4+bb4+g5:2 | eb4+ab4+c5+ab5:4. eb4+ab4+c5+g5:8 eb4+ab4+c5+ab5:2 | f4+ab4+bb4+eb5:1 | f4+ab4+bb4+d5:2 f4+ab4+d5+f5:2',
                         'Ebmaj7 | Cm9 | Abmaj9 | Bb13 | Gm7 | Cm9 | Fm9 | Bb7sus4 Bb7 | Ebmaj7 | Eb7 | Abmaj7 | Abm6 | Gm7 C7 | Fm9 Bb13 | Ebmaj9 | Bb7sus4',
                         'bb4:8 eb5:8 g5:4 f5:8 eb5:8 d5:4 | eb5:4. g5:8 bb5:2 | c6:8 bb5:8 ab5:4 g5:8 f5:8 eb5:4 | d5:2. f5:4 |'
                         'd5:8 f5:8 bb5:4 a5:8 g5:8 f5:4 | g5:4. eb5:8 c5:2 | ab5:4 g5:4 f5:4 ab5:4 | g5:2 f5:2 |'
                         'bb4:8 eb5:8 g5:4 f5:8 eb5:8 d5:4 | db6:4. bb5:8 g5:2 | c6:8 bb5:8 ab5:4 eb6:4 c6:4 | cb6:2. ab5:4 |'
                         'bb5:4 g5:4 e5:4 bb5:4 | ab5:4 c6:4 d6:4 ab5:4 | g5:1 | f5:2 eb5:2', key_drums=KIT_ORCH, groove_name='halftime')
    dr.write('intro', 'K+C:4. K:8 K+C:2 | K+C:4. K:8 K+C:2 | K+C:1 | S:16 S S S S S S S S S S S T1 T2 T3 T5', vel=106)
    ti.write('intro', 'eb2:4. eb2:8 eb2:2 | ab2:4. ab2:8 ab2:2 | bb2:1 | r:1'); roll(ti, s.sec['intro'], 12, 4, 'bb2', 50, 120)
    return s


@song('victory_champion')
def victory_champion(v):
    from motifs import MAIN_A, MAIN_CHORDS
    s, dr, ti = _victory('victory_champion', 'Victory! (Champion)', 104, 'Bbmaj7 | C6 | Dmaj9 | A13sus4 A13',
                         'bb4+d5+f5+a5:2. bb4+d5+f5+bb5:4 | c5+e5+g5+a5:2. c5+e5+g5+c6:4 | d5+f#5+a5+e6:1 | d5+e5+g5+b5:2 c#5+e5+g5+b5:2',
                         MAIN_CHORDS + ' | Em9 | F#m7 | Gmaj9 | A13 | Bm9 | Gmaj9 | Em9 A13sus4 | Dmaj9',
                         MAIN_A + ' | b5:4. a5:8 g5:4 f#5:4 | e5:2. c#5:8 e5:8 | f#5:4. g5:8 a5:4 b5:4 | c#6:2 e6:4 f#6:4 | d6:4. c#6:8 b5:4 f#5:4 | a5:4. b5:8 d6:4 f#6:4 | g6:4 f#6:4 e6:4 d6:4 | d6:2. r:4',
                         key_drums=KIT_ORCH, groove_name='halftime', bass='two')
    dr.write('intro', 'K+C:1 | K+C:1 | K+C:1 | S:16 S S S S S S S S S S S T1 T2 T3 T5', vel=104)
    ti.write('intro', 'bb2:1 | c3:1 | d3:1 | r:1'); roll(ti, s.sec['intro'], 12, 4, 'a2', 50, 120)
    return s
