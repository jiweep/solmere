'use strict';
// ============================================================================
//  Move data. Engine reads these generic fields:
//   pri, target (normal|foes|all|self|ally|allySide|foeSide|field|random),
//   contact, sound, punch, bite, slice, pulse, ball, powder, wind,
//   sec {chance,status,flinch,conf,stats,selfStats}, self {stat:stage},
//   recoil, drain, crit, multi [min,max], heal, status (status move),
//   stats (to target), boost (to user), weather, hazard, screen, fx (custom)
// ============================================================================
G.MOVES = {};
(function () {
  const M = (id, name, type, cat, pow, acc, pp, o = {}) => {
    const m = { id, name, type, cat, pow, acc, pp, pri: 0, target: cat === 'status' ? 'self' : 'normal', ...o };
    if (m.contact === undefined) m.contact = cat === 'phys' && !o.nc;
    G.MOVES[id] = m;
  };
  const brn = (c) => ({ chance: c, status: 'brn' }), par = c => ({ chance: c, status: 'par' }), psn = c => ({ chance: c, status: 'psn' });
  const frz = c => ({ chance: c, status: 'frz' }), fl = c => ({ chance: c, flinch: true }), cf = c => ({ chance: c, conf: true });
  const st = (c, s) => ({ chance: c, stats: s }), sst = (c, s) => ({ chance: c, selfStats: s });

  // ------------------------------------------------------------- NORMAL
  M('tackle', 'Tackle', 'normal', 'phys', 40, 100, 35);
  M('scratch', 'Scratch', 'normal', 'phys', 40, 100, 35);
  M('quickstrike', 'Quick Strike', 'normal', 'phys', 40, 100, 30, { pri: 1 });
  M('headbutt', 'Headbutt', 'normal', 'phys', 70, 100, 15, { sec: fl(30) });
  M('bodyslam', 'Body Slam', 'normal', 'phys', 85, 100, 15, { sec: par(30) });
  M('takedown', 'Take Down', 'normal', 'phys', 90, 85, 20, { recoil: 1 / 4 });
  M('doubleedge', 'Double-Edge', 'normal', 'phys', 120, 100, 15, { recoil: 1 / 3 });
  M('slash', 'Slash', 'normal', 'phys', 70, 100, 20, { crit: 1, slice: true });
  M('furyswipes', 'Fury Swipes', 'normal', 'phys', 18, 80, 15, { multi: [2, 5] });
  M('doublehit', 'Double Hit', 'normal', 'phys', 35, 90, 10, { multi: [2, 2] });
  M('hypervoice', 'Hyper Voice', 'normal', 'spec', 90, 100, 10, { sound: true, target: 'foes' });
  M('swift', 'Swift', 'normal', 'spec', 60, true, 20, { target: 'foes' });
  M('hyperbeam', 'Hyper Beam', 'normal', 'spec', 150, 90, 5, { fx: 'recharge' });
  M('gigaimpact', 'Giga Impact', 'normal', 'phys', 150, 90, 5, { fx: 'recharge' });
  M('blitzrush', 'Blitz Rush', 'normal', 'phys', 80, 100, 5, { pri: 2, desc: 'A blindingly fast charge that almost always strikes first.' });
  M('facade', 'Facade', 'normal', 'phys', 70, 100, 20, { fx: 'facade', desc: 'Power doubles if the user is burned, poisoned or paralyzed.' });
  M('bondstrike', 'Bond Strike', 'normal', 'phys', 1, 100, 20, { fx: 'bond', desc: 'The stronger the bond with its Tamer, the stronger the hit (max 102).' });
  M('startle', 'Startle', 'normal', 'phys', 40, 100, 10, { pri: 3, fx: 'fakeout', desc: 'Makes the target flinch. Only works on the user\'s first turn out.' });
  M('rapidspin', 'Rapid Spin', 'normal', 'phys', 50, 100, 40, { fx: 'rapidspin', desc: 'Spins to clear entry hazards and binding, and raises Speed.' });
  M('prismbeam', 'Prism Beam', 'normal', 'spec', 80, 100, 10, { fx: 'triattack', desc: 'A three-colour beam. 20% chance to burn, paralyze or freeze.' });
  M('growl', 'Growl', 'normal', 'status', 0, 100, 40, { target: 'foes', stats: { atk: -1 }, sound: true });
  M('tailwhip', 'Tail Whip', 'normal', 'status', 0, 100, 30, { target: 'foes', stats: { def: -1 } });
  M('leer', 'Leer', 'normal', 'status', 0, 100, 30, { target: 'foes', stats: { def: -1 } });
  M('screech', 'Screech', 'normal', 'status', 0, 85, 40, { target: 'normal', stats: { def: -2 }, sound: true });
  M('wardance', 'War Dance', 'normal', 'status', 0, true, 20, { boost: { atk: 2 }, desc: 'A frenzied dance that sharply raises Attack.' });
  M('recover', 'Recover', 'normal', 'status', 0, true, 5, { heal: .5 });
  M('protect', 'Protect', 'normal', 'status', 0, true, 10, { pri: 4, fx: 'protect', desc: 'Blocks all moves this turn. Fails more often if used in a row.' });
  M('decoy', 'Decoy', 'normal', 'status', 0, true, 10, { fx: 'substitute', desc: 'Spends 1/4 of max HP to make a decoy that absorbs hits.' });
  M('roar', 'Roar', 'normal', 'status', 0, true, 20, { pri: -6, target: 'normal', fx: 'roar', sound: true, desc: 'Forces the target to switch out. Ends wild battles.' });
  M('lullaby', 'Lullaby', 'normal', 'status', 0, 55, 15, { target: 'normal', status: 'slp', sound: true });
  M('focusup', 'Focus Up', 'normal', 'status', 0, true, 30, { fx: 'focusenergy', desc: 'Sharply raises the critical-hit ratio.' });
  M('soothingchime', 'Soothing Chime', 'normal', 'status', 0, true, 5, { fx: 'healbell', sound: true, desc: 'Cures every party member of status conditions.' });
  M('drumup', 'Drum Up', 'normal', 'status', 0, true, 10, { fx: 'bellydrum', desc: 'Sacrifices half its HP to maximize Attack.' });
  M('shellbreak', 'Shell Break', 'normal', 'status', 0, true, 15, { boost: { atk: 2, spa: 2, spe: 2, def: -1, spd: -1 }, desc: 'Breaks its shell: sharply raises Atk, Sp.Atk and Speed; lowers Def and Sp.Def.' });
  M('helpinghand', 'Helping Hand', 'normal', 'status', 0, true, 20, { pri: 5, target: 'ally', fx: 'helpinghand', desc: 'Boosts an ally\'s move power by 50% this turn.' });
  M('struggle', 'Struggle', 'normal', 'phys', 50, true, 1, { fx: 'struggle', desc: 'Used only when out of PP. Hurts the user.' });

  // --------------------------------------------------------------- FIRE
  M('ember', 'Ember', 'fire', 'spec', 40, 100, 25, { sec: brn(10) });
  M('firefang', 'Fire Fang', 'fire', 'phys', 65, 95, 15, { bite: true, sec: { chance: 10, status: 'brn', flinch: true } });
  M('emberdash', 'Ember Dash', 'fire', 'phys', 50, 100, 20, { self: { spe: 1 }, desc: 'Cloaks itself in flame and charges, raising Speed.' });
  M('flamerush', 'Flame Rush', 'fire', 'phys', 60, 100, 25, { sec: brn(10) });
  M('flamethrower', 'Flamethrower', 'fire', 'spec', 90, 100, 15, { sec: brn(10) });
  M('fireblast', 'Fire Blast', 'fire', 'spec', 110, 85, 5, { sec: brn(10) });
  M('blazecharge', 'Blaze Charge', 'fire', 'phys', 120, 100, 15, { recoil: 1 / 3, sec: brn(10) });
  M('heatwave', 'Heat Wave', 'fire', 'spec', 95, 90, 10, { target: 'foes', wind: true, sec: brn(10) });
  M('lavasurge', 'Lava Surge', 'fire', 'spec', 80, 100, 15, { target: 'all', sec: brn(30) });
  M('overheat', 'Overheat', 'fire', 'spec', 130, 90, 5, { self: { spa: -2 } });
  M('wispflame', 'Wisp Flame', 'fire', 'status', 0, 85, 15, { target: 'normal', status: 'brn' });
  M('sunshine', 'Sunshine', 'fire', 'status', 0, true, 5, { target: 'field', weather: 'sun' });
  M('solarflare', 'Solar Flare', 'fire', 'spec', 100, 100, 5, { sec: brn(20), desc: 'Solarynx\'s signature. Unleashes a corona of sunfire. Never misses in harsh sun.', fx: 'sunsure' });

  // -------------------------------------------------------------- WATER
  M('watergun', 'Water Gun', 'water', 'spec', 40, 100, 25);
  M('bubblejet', 'Bubble Jet', 'water', 'spec', 65, 100, 20, { sec: st(10, { spe: -1 }) });
  M('aquadart', 'Aqua Dart', 'water', 'phys', 40, 100, 20, { pri: 1 });
  M('cascade', 'Cascade', 'water', 'phys', 80, 100, 15, { sec: fl(20) });
  M('surf', 'Surf', 'water', 'spec', 90, 100, 15, { target: 'all' });
  M('hydropump', 'Hydro Pump', 'water', 'spec', 110, 80, 5);
  M('scald', 'Scald', 'water', 'spec', 80, 100, 15, { sec: brn(30) });
  M('tidelash', 'Tide Lash', 'water', 'phys', 90, 90, 10);
  M('crushwave', 'Crush Wave', 'water', 'phys', 85, 100, 10, { sec: st(20, { def: -1 }) });
  M('flipturn', 'Flip Turn', 'water', 'phys', 60, 100, 20, { fx: 'pivot', desc: 'Hits, then the user switches out.' });
  M('raincall', 'Rain Call', 'water', 'status', 0, true, 5, { target: 'field', weather: 'rain' });
  M('tidalhymn', 'Tidal Hymn', 'water', 'spec', 110, 100, 5, { target: 'foes', sound: true, sec: st(30, { spe: -1 }), desc: 'Orrelume\'s song of the deep sea. Washes over all foes.' });

  // -------------------------------------------------------------- GRASS
  M('vinewhip', 'Vine Whip', 'grass', 'phys', 45, 100, 25);
  M('absorb', 'Absorb', 'grass', 'spec', 20, 100, 25, { drain: .5 });
  M('megadrain', 'Mega Drain', 'grass', 'spec', 40, 100, 15, { drain: .5 });
  M('gigadrain', 'Giga Drain', 'grass', 'spec', 75, 100, 10, { drain: .5 });
  M('razorleaf', 'Razor Leaf', 'grass', 'phys', 55, 95, 25, { crit: 1, slice: true, target: 'foes', nc: true });
  M('charmleaf', 'Charm Leaf', 'grass', 'spec', 60, true, 20);
  M('bulletseed', 'Bullet Seed', 'grass', 'phys', 25, 100, 30, { multi: [2, 5], ball: true, nc: true });
  M('seedbomb', 'Seed Bomb', 'grass', 'phys', 80, 100, 15, { ball: true, nc: true });
  M('energyball', 'Energy Ball', 'grass', 'spec', 90, 100, 10, { ball: true, sec: st(10, { spd: -1 }) });
  M('leafblade', 'Leaf Blade', 'grass', 'phys', 90, 100, 15, { crit: 1, slice: true });
  M('antlerdrain', 'Antler Drain', 'grass', 'phys', 75, 100, 10, { drain: .5 });
  M('solarbeam', 'Solar Beam', 'grass', 'spec', 120, 100, 10, { fx: 'solar', desc: 'Absorbs light on turn 1, fires on turn 2. Instant in harsh sun.' });
  M('leafstorm', 'Leaf Storm', 'grass', 'spec', 130, 90, 5, { self: { spa: -2 } });
  M('timberslam', 'Timber Slam', 'grass', 'phys', 120, 100, 15, { recoil: 1 / 3 });
  M('verdantbloom', 'Verdant Bloom', 'grass', 'spec', 95, 100, 5, { drain: .5, desc: 'Sylvantler\'s signature. A blossoming burst that restores the user.' });
  M('leechseed', 'Leech Seed', 'grass', 'status', 0, 90, 10, { target: 'normal', fx: 'leechseed', desc: 'Plants a seed that saps HP every turn.' });
  M('sleeppowder', 'Sleep Powder', 'grass', 'status', 0, 75, 15, { target: 'normal', status: 'slp', powder: true });
  M('stunspore', 'Stun Spore', 'grass', 'status', 0, 75, 30, { target: 'normal', status: 'par', powder: true });
  M('photosynth', 'Photosynth', 'grass', 'status', 0, true, 5, { fx: 'weatherheal', desc: 'Restores HP. Heals more in sun, less in other weather.' });

  // ----------------------------------------------------------- ELECTRIC
  M('zap', 'Zap', 'electric', 'spec', 40, 100, 30, { sec: par(10) });
  M('joltnuzzle', 'Jolt Nuzzle', 'electric', 'phys', 20, 100, 20, { sec: par(100) });
  M('spark', 'Spark', 'electric', 'phys', 65, 100, 20, { sec: par(30) });
  M('thunderfang', 'Thunder Fang', 'electric', 'phys', 65, 95, 15, { bite: true, sec: { chance: 10, status: 'par', flinch: true } });
  M('thunderbolt', 'Thunderbolt', 'electric', 'spec', 90, 100, 15, { sec: par(10) });
  M('thunder', 'Thunder', 'electric', 'spec', 110, 70, 10, { sec: par(30), fx: 'rainsure' });
  M('voltdash', 'Volt Dash', 'electric', 'spec', 70, 100, 20, { fx: 'pivot', desc: 'Hits, then the user switches out.' });
  M('surgetackle', 'Surge Tackle', 'electric', 'phys', 90, 100, 15, { recoil: 1 / 4 });
  M('discharge', 'Discharge', 'electric', 'spec', 80, 100, 15, { target: 'all', sec: par(30) });
  M('staticwave', 'Static Wave', 'electric', 'status', 0, 90, 20, { target: 'normal', status: 'par' });

  // ---------------------------------------------------------------- ICE
  M('frostbreath', 'Frost Breath', 'ice', 'spec', 60, 90, 10, { crit: 4, desc: 'Icy breath that always lands a critical hit.' });
  M('iceshard', 'Ice Shard', 'ice', 'phys', 40, 100, 30, { pri: 1, nc: true });
  M('icefang', 'Ice Fang', 'ice', 'phys', 65, 95, 15, { bite: true, sec: { chance: 10, status: 'frz', flinch: true } });
  M('icygust', 'Icy Gust', 'ice', 'spec', 55, 95, 15, { target: 'foes', wind: true, sec: st(100, { spe: -1 }) });
  M('auroraray', 'Aurora Ray', 'ice', 'spec', 65, 100, 20, { sec: st(10, { atk: -1 }) });
  M('icebeam', 'Ice Beam', 'ice', 'spec', 90, 100, 10, { sec: frz(10) });
  M('blizzard', 'Blizzard', 'ice', 'spec', 110, 70, 5, { target: 'foes', wind: true, sec: frz(10), fx: 'snowsure' });
  M('icicledrop', 'Icicle Drop', 'ice', 'phys', 85, 90, 10, { sec: fl(30), nc: true });
  M('iciclebarrage', 'Icicle Barrage', 'ice', 'phys', 25, 100, 30, { multi: [2, 5], nc: true });
  M('flashfreeze', 'Flash Freeze', 'ice', 'spec', 70, 100, 20, { sec: frz(10), fx: 'freezedry', desc: 'Super effective on Water types. 10% chance to freeze.' });
  M('snowfall', 'Snowfall', 'ice', 'status', 0, true, 10, { target: 'field', weather: 'snow' });
  M('auroraveil', 'Aurora Veil', 'ice', 'status', 0, true, 20, { target: 'allySide', screen: 'veil', desc: 'Halves damage from all attacks for 5 turns. Only works in snow.' });

  // ----------------------------------------------------------- FIGHTING
  M('rapidjab', 'Rapid Jab', 'fighting', 'phys', 40, 100, 30, { pri: 1, punch: true });
  M('chop', 'Chop', 'fighting', 'phys', 50, 100, 25, { crit: 1, slice: true });
  M('lowsweep', 'Low Sweep', 'fighting', 'phys', 65, 100, 20, { sec: st(100, { spe: -1 }) });
  M('wallbreaker', 'Wall Breaker', 'fighting', 'phys', 75, 100, 15, { fx: 'brickbreak', desc: 'Shatters screens like Reflect and Light Screen before hitting.' });
  M('drainpunch', 'Drain Punch', 'fighting', 'phys', 75, 100, 10, { punch: true, drain: .5 });
  M('mountaintoss', 'Mountain Toss', 'fighting', 'phys', 1, 100, 20, { fx: 'level', desc: 'Deals damage equal to the user\'s level.' });
  M('closecombat', 'Close Combat', 'fighting', 'phys', 120, 100, 5, { self: { def: -1, spd: -1 } });
  M('auraorb', 'Aura Orb', 'fighting', 'spec', 80, true, 20, { pulse: true, ball: true });
  M('focusblast', 'Focus Blast', 'fighting', 'spec', 120, 70, 5, { ball: true, sec: st(10, { spd: -1 }) });
  M('braceup', 'Brace Up', 'fighting', 'status', 0, true, 20, { boost: { atk: 1, def: 1 } });

  // ------------------------------------------------------------- POISON
  M('poisonsting', 'Poison Sting', 'poison', 'phys', 15, 100, 35, { sec: psn(30), nc: true });
  M('acidspray', 'Acid Spray', 'poison', 'spec', 40, 100, 20, { sec: st(100, { spd: -2 }), ball: true });
  M('sludge', 'Sludge', 'poison', 'spec', 65, 100, 20, { sec: psn(30) });
  M('venomshock', 'Venom Shock', 'poison', 'spec', 65, 100, 10, { fx: 'venoshock', desc: 'Power doubles if the target is poisoned.' });
  M('poisonjab', 'Poison Jab', 'poison', 'phys', 80, 100, 20, { sec: psn(30) });
  M('sludgebomb', 'Sludge Bomb', 'poison', 'spec', 90, 100, 10, { ball: true, sec: psn(30) });
  M('gunkshot', 'Gunk Shot', 'poison', 'phys', 120, 80, 5, { sec: psn(30), nc: true });
  M('toxic', 'Toxic', 'poison', 'status', 0, 90, 10, { target: 'normal', status: 'tox', fx: 'toxic', desc: 'Badly poisons the target; damage worsens each turn. Never misses if used by a Poison type.' });
  M('venomspikes', 'Venom Spikes', 'poison', 'status', 0, true, 20, { target: 'foeSide', hazard: 'tspikes', desc: 'Scatters poison barbs that poison foes that switch in.' });
  M('acidarmor', 'Acid Armor', 'poison', 'status', 0, true, 20, { boost: { def: 2 } });

  // ------------------------------------------------------------- GROUND
  M('mudsplash', 'Mud Splash', 'ground', 'spec', 20, 100, 10, { sec: st(100, { acc: -1 }) });
  M('mudshot', 'Mud Shot', 'ground', 'spec', 55, 95, 15, { sec: st(100, { spe: -1 }) });
  M('bulldoze', 'Bulldoze', 'ground', 'phys', 60, 100, 20, { target: 'all', nc: true, sec: st(100, { spe: -1 }) });
  M('drillrun', 'Drill Run', 'ground', 'phys', 80, 95, 10, { crit: 1 });
  M('earthpower', 'Earth Power', 'ground', 'spec', 90, 100, 10, { sec: st(10, { spd: -1 }) });
  M('earthquake', 'Earthquake', 'ground', 'phys', 100, 100, 10, { target: 'all', nc: true });
  M('spikes', 'Spikes', 'ground', 'status', 0, true, 20, { target: 'foeSide', hazard: 'spikes', desc: 'Lays spikes that hurt foes when they switch in. Stacks 3 times.' });

  // ------------------------------------------------------------- FLYING
  M('peck', 'Peck', 'flying', 'phys', 35, 100, 35);
  M('gust', 'Gust', 'flying', 'spec', 40, 100, 35, { wind: true });
  M('wingslash', 'Wing Slash', 'flying', 'phys', 60, 100, 35, { slice: true });
  M('aerialace', 'Aerial Ace', 'flying', 'phys', 60, true, 20, { slice: true });
  M('acrobatics', 'Acrobatics', 'flying', 'phys', 55, 100, 15, { fx: 'acrobatics', desc: 'Power doubles if the user holds no item.' });
  M('airslash', 'Air Slash', 'flying', 'spec', 75, 95, 15, { slice: true, sec: fl(30) });
  M('drillpeck', 'Drill Peck', 'flying', 'phys', 80, 100, 20);
  M('bravedive', 'Brave Dive', 'flying', 'phys', 120, 100, 15, { recoil: 1 / 3 });
  M('hurricane', 'Hurricane', 'flying', 'spec', 110, 70, 10, { wind: true, sec: cf(30), fx: 'rainsure' });
  M('roost', 'Roost', 'flying', 'status', 0, true, 5, { heal: .5 });
  M('tailwind', 'Tailwind', 'flying', 'status', 0, true, 15, { target: 'allySide', screen: 'tailwind', wind: true, desc: 'Doubles the Speed of your side for 4 turns.' });
  M('clearskies', 'Clear Skies', 'flying', 'status', 0, true, 15, { target: 'field', fx: 'defog', wind: true, desc: 'A great gust that blows away hazards and screens on both sides.' });

  // ------------------------------------------------------------ PSYCHIC
  M('confusion', 'Confusion', 'psychic', 'spec', 50, 100, 25, { sec: cf(10) });
  M('psybeam', 'Psybeam', 'psychic', 'spec', 65, 100, 20, { sec: cf(10) });
  M('mindblade', 'Mind Blade', 'psychic', 'phys', 70, 100, 20, { crit: 1, slice: true, nc: true });
  M('zenstrike', 'Zen Strike', 'psychic', 'phys', 80, 90, 15, { sec: fl(20) });
  M('extrasense', 'Extrasense', 'psychic', 'spec', 80, 100, 20, { sec: fl(10) });
  M('psystrike', 'Psy Strike', 'psychic', 'spec', 80, 100, 10, { fx: 'psyshock', desc: 'A psychic wave that strikes the target\'s Defense instead of Sp. Def.' });
  M('psychic', 'Psychic', 'psychic', 'spec', 90, 100, 10, { sec: st(10, { spd: -1 }) });
  M('storedpower', 'Stored Power', 'psychic', 'spec', 20, 100, 10, { fx: 'storedpower', desc: 'Gains 20 power for every stat boost on the user.' });
  M('calmmind', 'Calm Mind', 'psychic', 'status', 0, true, 20, { boost: { spa: 1, spd: 1 } });
  M('agility', 'Agility', 'psychic', 'status', 0, true, 30, { boost: { spe: 2 } });
  M('blankmind', 'Blank Mind', 'psychic', 'status', 0, true, 20, { boost: { spd: 2 } });
  M('reflect', 'Reflect', 'psychic', 'status', 0, true, 20, { target: 'allySide', screen: 'reflect', desc: 'Halves physical damage to your side for 5 turns.' });
  M('lightscreen', 'Light Screen', 'psychic', 'status', 0, true, 30, { target: 'allySide', screen: 'lightscreen', desc: 'Halves special damage to your side for 5 turns.' });
  M('hypnosis', 'Hypnosis', 'psychic', 'status', 0, 60, 20, { target: 'normal', status: 'slp' });
  M('rest', 'Rest', 'psychic', 'status', 0, true, 5, { fx: 'rest', desc: 'Sleeps for 2 turns to fully restore HP and cure status.' });
  M('twistroom', 'Twist Room', 'psychic', 'status', 0, true, 5, { pri: -7, target: 'field', fx: 'trickroom', desc: 'Twists space for 5 turns so slower Echoes move first.' });

  // ---------------------------------------------------------------- BUG
  M('silkspray', 'Silk Spray', 'bug', 'status', 0, 95, 40, { target: 'foes', stats: { spe: -2 } });
  M('bugbite', 'Bug Bite', 'bug', 'phys', 60, 100, 20);
  M('pinbarrage', 'Pin Barrage', 'bug', 'phys', 25, 95, 20, { multi: [2, 5], nc: true });
  M('strugglebuzz', 'Struggle Buzz', 'bug', 'spec', 50, 100, 20, { target: 'foes', sec: st(100, { spa: -1 }) });
  M('hitandrun', 'Hit & Run', 'bug', 'phys', 70, 100, 20, { fx: 'pivot', desc: 'Hits, then the user switches out.' });
  M('signalbeam', 'Signal Beam', 'bug', 'spec', 75, 100, 15, { sec: cf(10) });
  M('crosscut', 'Cross Cut', 'bug', 'phys', 80, 100, 15, { slice: true });
  M('leechbite', 'Leech Bite', 'bug', 'phys', 80, 100, 10, { drain: .5, bite: true });
  M('bugbuzz', 'Bug Buzz', 'bug', 'spec', 90, 100, 10, { sound: true, sec: st(10, { spd: -1 }) });
  M('megahorn', 'Megahorn', 'bug', 'phys', 120, 85, 10);
  M('flutterdance', 'Flutter Dance', 'bug', 'status', 0, true, 20, { boost: { spa: 1, spd: 1, spe: 1 } });
  M('stickyweb', 'Sticky Web', 'bug', 'status', 0, true, 20, { target: 'foeSide', hazard: 'web', desc: 'Weaves a web that lowers the Speed of foes that switch in.' });

  // --------------------------------------------------------------- ROCK
  M('rockthrow', 'Rock Throw', 'rock', 'phys', 50, 90, 15, { nc: true });
  M('pebbledash', 'Pebble Dash', 'rock', 'phys', 40, 100, 20, { pri: 1 });
  M('rocktomb', 'Rock Tomb', 'rock', 'phys', 60, 95, 15, { nc: true, sec: st(100, { spe: -1 }) });
  M('rockbarrage', 'Rock Barrage', 'rock', 'phys', 25, 90, 10, { multi: [2, 5], nc: true, ball: true });
  M('ancientpower', 'Ancient Power', 'rock', 'spec', 60, 100, 5, { sec: sst(10, { atk: 1, def: 1, spa: 1, spd: 1, spe: 1 }) });
  M('rockslide', 'Rock Slide', 'rock', 'phys', 75, 90, 10, { target: 'foes', nc: true, sec: fl(30) });
  M('powergem', 'Power Gem', 'rock', 'spec', 80, 100, 20);
  M('stoneedge', 'Stone Edge', 'rock', 'phys', 100, 80, 5, { crit: 1, nc: true });
  M('skullcrash', 'Skull Crash', 'rock', 'phys', 150, 80, 5, { recoil: 1 / 2 });
  M('shardtrap', 'Shard Trap', 'rock', 'status', 0, true, 20, { target: 'foeSide', hazard: 'rocks', desc: 'Floats jagged shards around the foes. They hurt anything that switches in, scaled by type.' });
  M('rockpolish', 'Rock Polish', 'rock', 'status', 0, true, 20, { boost: { spe: 2 } });
  M('sandstorm', 'Sandstorm', 'rock', 'status', 0, true, 10, { target: 'field', weather: 'sand', wind: true });

  // -------------------------------------------------------------- GHOST
  M('lick', 'Lick', 'ghost', 'phys', 30, 100, 30, { sec: par(30) });
  M('astonish', 'Astonish', 'ghost', 'phys', 30, 100, 15, { sec: fl(30) });
  M('shadowsneak', 'Shadow Sneak', 'ghost', 'phys', 40, 100, 30, { pri: 1 });
  M('eeriewind', 'Eerie Wind', 'ghost', 'spec', 60, 100, 5, { wind: true, sec: sst(10, { atk: 1, def: 1, spa: 1, spd: 1, spe: 1 }) });
  M('hex', 'Hex', 'ghost', 'spec', 65, 100, 10, { fx: 'hex', desc: 'Power doubles if the target has a status condition.' });
  M('shadowclaw', 'Shadow Claw', 'ghost', 'phys', 70, 100, 15, { crit: 1, slice: true });
  M('soulsiphon', 'Soul Siphon', 'ghost', 'spec', 75, 100, 10, { drain: .5, desc: 'Draws out the target\'s spirit to heal the user.' });
  M('shadowball', 'Shadow Ball', 'ghost', 'spec', 80, 100, 15, { ball: true, sec: st(20, { spd: -1 }) });
  M('nightshade', 'Night Shade', 'ghost', 'spec', 1, 100, 15, { fx: 'level', desc: 'Deals damage equal to the user\'s level.' });
  M('confuseray', 'Confuse Ray', 'ghost', 'status', 0, true, 10, { target: 'normal', fx: 'confuse' });

  // ------------------------------------------------------------- DRAGON
  M('twister', 'Twister', 'dragon', 'spec', 40, 100, 20, { target: 'foes', wind: true, sec: fl(20) });
  M('dragonbreath', 'Dragon Breath', 'dragon', 'spec', 60, 100, 20, { sec: par(30) });
  M('tailsweep', 'Tail Sweep', 'dragon', 'phys', 60, 100, 15, { target: 'foes', sec: st(100, { atk: -1 }) });
  M('dragonclaw', 'Dragon Claw', 'dragon', 'phys', 80, 100, 15, { slice: true });
  M('dragonpulse', 'Dragon Pulse', 'dragon', 'spec', 85, 100, 10, { pulse: true });
  M('dragonrush', 'Dragon Rush', 'dragon', 'phys', 100, 75, 10, { sec: fl(20) });
  M('outrage', 'Outrage', 'dragon', 'phys', 120, 100, 10, { fx: 'rampage', desc: 'Rampages for 2-3 turns, then becomes confused.' });
  M('dracometeor', 'Draco Meteor', 'dragon', 'spec', 130, 90, 5, { self: { spa: -2 } });
  M('wyrmdance', 'Wyrm Dance', 'dragon', 'status', 0, true, 20, { boost: { atk: 1, spe: 1 } });

  // --------------------------------------------------------------- DARK
  M('bite', 'Bite', 'dark', 'phys', 60, 100, 25, { bite: true, sec: fl(30) });
  M('payback', 'Payback', 'dark', 'phys', 50, 100, 10, { fx: 'payback', desc: 'Power doubles if the user moves after the target.' });
  M('snarl', 'Snarl', 'dark', 'spec', 55, 95, 15, { target: 'foes', sound: true, sec: st(100, { spa: -1 }) });
  M('knockaway', 'Knock Away', 'dark', 'phys', 65, 100, 20, { fx: 'knockoff', desc: 'Knocks away the target\'s held item. 50% more power if it had one.' });
  M('nightslash', 'Night Slash', 'dark', 'phys', 70, 100, 15, { crit: 1, slice: true });
  M('ambush', 'Ambush', 'dark', 'phys', 70, 100, 5, { pri: 1, fx: 'sucker', desc: 'Strikes first, but only if the target is readying an attack.' });
  M('crunch', 'Crunch', 'dark', 'phys', 80, 100, 15, { bite: true, sec: st(20, { def: -1 }) });
  M('darkpulse', 'Dark Pulse', 'dark', 'spec', 80, 100, 15, { pulse: true, sec: fl(20) });
  M('foulplay', 'Foul Play', 'dark', 'phys', 95, 100, 15, { fx: 'foulplay', desc: 'Turns the target\'s own Attack against it.' });
  M('scheme', 'Scheme', 'dark', 'status', 0, true, 20, { boost: { spa: 2 }, desc: 'Plots something wicked, sharply raising Sp. Atk.' });
  M('taunt', 'Taunt', 'dark', 'status', 0, 100, 20, { target: 'normal', fx: 'taunt', desc: 'Goads the target into using only attacks for 3 turns.' });
  M('partingtaunt', 'Parting Taunt', 'dark', 'status', 0, 100, 20, { target: 'normal', stats: { atk: -1, spa: -1 }, fx: 'pivotstatus', sound: true, desc: 'Lowers the target\'s Atk and Sp. Atk, then the user switches out.' });
  M('voidrend', 'Void Rend', 'dark', 'phys', 110, 95, 5, { crit: 1, slice: true, desc: 'Nyxalis\'s signature. Tears a slit in the starlight. High critical-hit ratio.' });

  // -------------------------------------------------------------- STEEL
  M('metalclaw', 'Metal Claw', 'steel', 'phys', 50, 95, 35, { sec: sst(10, { atk: 1 }) });
  M('bulletjab', 'Bullet Jab', 'steel', 'phys', 40, 100, 30, { pri: 1, punch: true });
  M('surestrike', 'Sure Strike', 'steel', 'phys', 70, true, 10);
  M('ironhead', 'Iron Head', 'steel', 'phys', 80, 100, 15, { sec: fl(30) });
  M('flashcannon', 'Flash Cannon', 'steel', 'spec', 80, 100, 10, { sec: st(10, { spd: -1 }) });
  M('meteorfist', 'Meteor Fist', 'steel', 'phys', 90, 90, 10, { punch: true, sec: sst(20, { atk: 1 }) });
  M('irontail', 'Iron Tail', 'steel', 'phys', 100, 75, 15, { sec: st(30, { def: -1 }) });
  M('anchorslam', 'Anchor Slam', 'steel', 'phys', 100, 100, 5, { sec: st(30, { def: -1 }), desc: 'Tidalrus\'s signature. Brings its tusks down like a ship\'s anchor.' });
  M('ironwall', 'Iron Wall', 'steel', 'status', 0, true, 15, { boost: { def: 2 } });

  // -------------------------------------------------------------- FAIRY
  M('fairybreeze', 'Fairy Breeze', 'fairy', 'spec', 40, 100, 30, { wind: true });
  M('charmvoice', 'Charm Voice', 'fairy', 'spec', 40, true, 15, { target: 'foes', sound: true });
  M('kissdrain', 'Kiss Drain', 'fairy', 'spec', 50, 100, 10, { drain: .75 });
  M('radiantflash', 'Radiant Flash', 'fairy', 'spec', 80, 100, 10, { target: 'foes' });
  M('playrough', 'Play Rough', 'fairy', 'phys', 90, 90, 10, { sec: st(10, { atk: -1 }) });
  M('moonblast', 'Moonblast', 'fairy', 'spec', 95, 100, 15, { sec: st(30, { spa: -1 }) });
  M('charm', 'Charm', 'fairy', 'status', 0, 100, 20, { target: 'normal', stats: { atk: -2 } });
  M('sweetkiss', 'Sweet Kiss', 'fairy', 'status', 0, 75, 10, { target: 'normal', fx: 'confuse' });
  M('moonlight', 'Moonlight', 'fairy', 'status', 0, true, 5, { fx: 'weatherheal' });

  // ------------------------------------------------ auto descriptions ---
  const statN = { atk: 'Attack', def: 'Defense', spa: 'Sp. Atk', spd: 'Sp. Def', spe: 'Speed', acc: 'accuracy', eva: 'evasion' };
  const stN = { brn: 'burn', par: 'paralyze', psn: 'poison', tox: 'badly poison', slp: 'put to sleep', frz: 'freeze' };
  const stageTxt = (o, who) => Object.entries(o).map(([k, v]) => `${v > 0 ? (v > 1 ? 'sharply raises' : 'raises') : (v < -1 ? 'harshly lowers' : 'lowers')} ${who} ${statN[k]}`).join(', ');
  for (const m of Object.values(G.MOVES)) {
    if (m.desc) continue;
    const s = [];
    if (m.cat === 'status') {
      if (m.stats) s.push(G.cap(stageTxt(m.stats, m.target === 'foes' ? 'foes\'' : 'the target\'s')) + '.');
      if (m.boost) s.push(G.cap(stageTxt(m.boost, 'the user\'s')) + '.');
      if (m.status) s.push(`Tries to ${stN[m.status]} the target.`);
      if (m.heal) s.push('Restores half of the user\'s max HP.');
      if (m.weather) s.push({ sun: 'Summons harsh sunlight for 5 turns.', rain: 'Summons heavy rain for 5 turns.', sand: 'Whips up a sandstorm for 5 turns.', snow: 'Brings snowfall for 5 turns, raising Ice types\' Defense.' }[m.weather]);
      if (m.fx === 'confuse') s.push('Confuses the target.');
    } else {
      if (m.pri > 0) s.push('Always strikes first.');
      s.push(m.target === 'foes' ? 'Hits all foes.' : m.target === 'all' ? 'Hits everything around the user, allies included.' : '');
      if (m.multi) s.push(m.multi[0] === m.multi[1] ? `Hits ${m.multi[0]} times.` : `Hits ${m.multi[0]}-${m.multi[1]} times.`);
      if (m.crit) s.push(m.crit >= 3 ? 'Always a critical hit.' : 'High critical-hit ratio.');
      if (m.recoil) s.push(`The user takes ${m.recoil === 1 / 3 ? '1/3' : m.recoil === 1 / 2 ? '1/2' : '1/4'} of the damage as recoil.`);
      if (m.drain) s.push(`Restores ${Math.round(m.drain * 100)}% of the damage dealt.`);
      if (m.fx === 'recharge') s.push('The user must recharge next turn.');
      if (m.self) s.push(G.cap(stageTxt(m.self, 'the user\'s')) + '.');
      if (m.sec) {
        const c = m.sec.chance, bits = [];
        if (m.sec.status) bits.push(stN[m.sec.status]);
        if (m.sec.flinch) bits.push('make the target flinch');
        if (m.sec.conf) bits.push('confuse');
        if (m.sec.stats) bits.push(c >= 100 ? stageTxt(m.sec.stats, 'the target\'s') : stageTxt(m.sec.stats, 'the target\'s').replace(/lowers/g, 'lower').replace(/raises/g, 'raise'));
        if (m.sec.selfStats) bits.push('raise all of the user\'s stats');
        s.push(c >= 100 ? G.cap(bits.join(' and ')) + '.' : `${c}% chance to ${bits.join(' and ')}.`);
      }
      if (m.acc === true && m.cat !== 'status') s.push('Never misses.');
      if (s.filter(Boolean).length === 0) s.push(m.cat === 'phys' ? 'A straightforward physical attack.' : 'A straightforward special attack.');
    }
    m.desc = s.filter(Boolean).join(' ');
  }
})();
