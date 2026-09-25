#!/usr/bin/env python3
"""Linux/any-platform stem renderer (drop-in for the macOS `render` binary).

Reads the same job.json (sampleRate, stems[{out, program, channel, length, events}]) and renders each
stem with FluidSynth through a GS-capable SoundFont, writing a float32 stereo WAV of exactly
`length` seconds. Reverb/chorus are disabled: the mixer in build.py applies its own.

usage: render_fs.py job.json            env SOLMERE_SF2 overrides the SoundFont
"""
import json, os, sys, subprocess, tempfile
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import mido
import scipy.io.wavfile as wavfile

SF_CANDIDATES = [os.environ.get('SOLMERE_SF2', ''), os.path.join(os.path.dirname(os.path.abspath(__file__)), 'sf2', 'GeneralUser-GS.sf2'),
                 '/home/user/mrbumpy409/generaluser-gs/GeneralUser-GS.sf2', '/usr/share/sounds/sf2/MuseScore_General_Full.sf2',
                 '/usr/share/sounds/sf2/FluidR3_GM.sf2']
SF2 = next(p for p in SF_CANDIDATES if p and os.path.exists(p))
TPB, TEMPO = 9600, 500000          # 9600 ticks per 0.5 s beat: ~52 us resolution
SEC2TICK = TPB * 1e6 / TEMPO


def stem_midi(st, path):
    ch = st['channel']
    mid = mido.MidiFile(ticks_per_beat=TPB); tr = mido.MidiTrack(); mid.tracks.append(tr)
    tr.append(mido.MetaMessage('set_tempo', tempo=TEMPO, time=0))
    tr.append(mido.Message('control_change', channel=ch, control=0, value=st.get('bankMSB', 0), time=0))
    tr.append(mido.Message('control_change', channel=ch, control=32, value=st.get('bankLSB', 0), time=0))
    tr.append(mido.Message('program_change', channel=ch, program=st['program'], time=0))
    tr.append(mido.Message('control_change', channel=ch, control=91, value=0, time=0))
    tr.append(mido.Message('control_change', channel=ch, control=93, value=0, time=0))
    # stable sort: note-offs before note-ons at the same instant
    evs = sorted(st['events'], key=lambda e: (e[0], 0 if e[1] == 0x80 else 1))
    last = 0
    for e in evs:
        t, s = e[0], int(e[1])
        tick = max(0, int(round(t * SEC2TICK)))
        dt = tick - last; last = tick
        kind = s & 0xF0
        if kind == 0x90: msg = mido.Message('note_on', channel=ch, note=int(e[2]), velocity=int(e[3]), time=dt)
        elif kind == 0x80: msg = mido.Message('note_off', channel=ch, note=int(e[2]), velocity=0, time=dt)
        elif kind == 0xB0:
            if int(e[2]) in (91, 93): continue
            msg = mido.Message('control_change', channel=ch, control=int(e[2]), value=int(e[3]), time=dt)
        elif kind == 0xE0: msg = mido.Message('pitchwheel', channel=ch, pitch=int((int(e[3]) << 7 | int(e[2])) - 8192), time=dt)
        else: continue
        tr.append(msg)
    end = int(round(st['length'] * SEC2TICK))
    tr.append(mido.MetaMessage('end_of_track', time=max(0, end - last)))
    mid.save(path)


def render(st, sr):
    with tempfile.TemporaryDirectory() as td:
        mp, wp = os.path.join(td, 's.mid'), os.path.join(td, 's.wav')
        stem_midi(st, mp)
        subprocess.run(['fluidsynth', '-ni', '-q', '-R', '0', '-C', '0', '-g', '1.0', '-r', str(int(sr)), '-O', 'float', '-T', 'wav',
                        '-o', 'synth.polyphony=512', '-o', 'synth.midi-bank-select=gs', '-F', wp, SF2, mp],
                       check=True, capture_output=True)
        r, a = wavfile.read(wp)
    a = a.astype(np.float32)
    if a.ndim == 1: a = np.stack([a, a], 1)
    n = int(round(st['length'] * sr))
    if len(a) < n: a = np.concatenate([a, np.zeros((n - len(a), 2), np.float32)])
    wavfile.write(st['out'], int(sr), a[:n])


def main():
    job = json.load(open(sys.argv[1]))
    sr = job['sampleRate']
    with ThreadPoolExecutor(max_workers=min(4, os.cpu_count() or 2)) as ex:
        list(ex.map(lambda st: render(st, sr), job['stems']))


if __name__ == '__main__':
    main()
