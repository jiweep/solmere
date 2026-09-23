"""Construct every song (runs all bar checks / chord parsing) without rendering."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import songs
bad = 0
for sid, spec in songs.SONGS.items():
    for v in spec['variants']:
        try:
            s = songs.make(sid, v)
            print(f'  ok  {sid:20s} {v:6s} {s.loop_len * 60 / s.bpm:6.1f}s loop  {len(s.parts)} parts')
        except Exception as e:
            bad += 1; print(f'  ERR {sid:20s} {v:6s} {type(e).__name__}: {e}')
print(f'{len(songs.SONGS)} songs, {bad} errors')
