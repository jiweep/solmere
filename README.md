# Solmere: Tidelight

An original monster-taming adventure in the style of the DS-era classics: six Wardens, a villainous
Fellowship, a leviathan under a lighthouse, the Conclave and a postgame.

## Play

- **Mac:** double-click `Play.command`. It starts the local server and opens the game in your browser.
- **Anywhere with Node:** `node server.js`, then open `http://localhost:8080`.
- Opening `index.html` directly works for solo play, but the pre-rendered soundtrack needs the server
  (browsers block loading audio files from `file://`). Without it the game falls back to a built-in synth.

**Controls:** arrows/WASD move · Z/Enter/Space confirm · X/Esc back and menu · Shift run · F bike ·
Q/E switch tabs · R Resonate (in the Fight menu) · Tab turbo · P photo mode · H help. Gamepads work too.

## Modes

New Game → Challenge Setup: **Difficulty** (Easy / Normal / Hard / Master), **Level Caps** (soft/hard),
**Battle Style** (Switch/Set), **Nuzlocke** (permadeath, first encounter per area, forced nicknames, with
dupes/shiny clauses and a Hardcore option), **Randomizer** (wild, trainers, starters), and **God Mode** for testing (the ` or F2 key opens it: invincibility, one-hit KOs,
noclip, chapter jumps, warps, give mons and items).

## Co-op (2 players, separate machines)

1. One player runs the server (`Play.command` or `node server.js`). It prints a LAN address.
2. The other player opens that LAN address (for example `http://192.168.1.20:8080`) on their machine.
3. Both open Menu ▸ **Link** ▸ Join room. Walk up to each other and press Z to team up, trade or battle.

While teamed up on the same map, every wild or trainer battle becomes a 2-vs-2 co-op double battle,
and beaten trainers count for both saves. Link Battles (PvP) run at Level 50. Trades support trade
evolution.

## Soundtrack

Around 70 original tracks and 10 jingles in a jazzy DS-era style: sequenced MIDI rendered through a
sampled Roland GS sound bank, then mixed and mastered with seamless loop points. Routes and towns have
**night arrangements** that crossfade in sync when the in-game clock turns. You can listen to everything
from the title screen's **Music Room**.

To rebuild the music (macOS: needs Xcode command-line tools, Python 3 with numpy/scipy, and `lame`):

```
cd music_src
xcrun swiftc -O render.swift -o render     # once
python3 build.py                            # renders changed songs into ../music and writes the manifest
python3 analyze.py all                      # loop-seam / level / harmony checks
```

Songs are plain Python: `s_field.py`, `s_towns.py`, `s_battle.py`, `s_interior.py`, `s_story.py` and `s_jingles.py`.

## Tests

- `node tests/validate_maps.js` checks map geometry, connections, warps, reachability and references.
- `node tests/battle_sim.js 2000` fuzzes the battle engine with AI-vs-AI battles.
- Browser: open `index.html?mute&bgtick`, then load `tests/browser_helpers.js` and
  `tests/browser_smoke.js` for sweeps of maps, move animations, chapters and trainer battles.
  (`?silent` runs the full audio engine at zero volume.)
