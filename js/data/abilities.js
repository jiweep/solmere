'use strict';
// ============================================================================
//  Abilities — data + battle hooks (see battle/engine.js for the call sites)
// ============================================================================
G.ABILITIES = {};
(function () {
  const A = (id, name, desc, hooks = {}) => { G.ABILITIES[id] = { id, name, desc, ...hooks }; };
  const pinch = (type) => ({ powMod: (bt, b, m) => m.type === type && b.hp <= b.maxhp / 3 ? 1.5 : 1 });
  const weatherSpeed = w => ({ speMod: (bt) => bt.weather === w ? 2 : 1 });
  const setter = (w, label) => ({ onStart(bt, b) { bt.popup(b); bt.setWeather(w, b); } });
  const absorbType = (type, fn) => ({
    tryHit(bt, t, s, m) { if (m.type !== type || t === s) return false; bt.popup(t); fn(bt, t); return true; },
  });
  const contact = (fn) => ({ afterHit(bt, t, s, m) { if (m.contact && s.hp > 0 && !s.fainted) fn(bt, t, s, m); } });
  const immune = (...sts) => ({ statusImmune: (bt, b, s) => sts.includes(s) });

  // -------------------------------------------------- pinch boosters
  A('kindle', 'Kindle', 'Powers up Fire moves by 50% when HP is at 1/3 or less.', pinch('fire'));
  A('riptide', 'Riptide', 'Powers up Water moves by 50% when HP is at 1/3 or less.', pinch('water'));
  A('overgrowth', 'Overgrowth', 'Powers up Grass moves by 50% when HP is at 1/3 or less.', pinch('grass'));
  A('swarm', 'Swarm', 'Powers up Bug moves by 50% when HP is at 1/3 or less.', pinch('bug'));

  // -------------------------------------------------- switch-in
  A('menace', 'Menace', 'Glares at foes on entry, lowering their Attack by one stage.', {
    onStart(bt, b) {
      bt.popup(b);
      for (const f of bt.foes(b)) {
        if (f.abilityHas('menaceImmune')) { bt.popup(f); bt.say('{0} wasn\'t intimidated!', f); continue; }
        bt.boost(f, { atk: -1 }, b);
      }
    },
  });
  A('rainmaker', 'Rainmaker', 'Summons rain when it enters battle.', setter('rain'));
  A('sunbringer', 'Sunbringer', 'Summons harsh sunlight when it enters battle.', setter('sun'));
  A('sandspout', 'Sandspout', 'Whips up a sandstorm when it enters battle.', setter('sand'));
  A('frostcall', 'Frostcall', 'Calls down snow when it enters battle.', setter('snow'));
  A('pressure', 'Pressure', 'Its presence makes foes spend extra PP on moves that target it.', { onStart(bt, b) { bt.popup(b); bt.say('{0} is exerting its Pressure!', b); }, pressure: true });
  A('frisk', 'Frisk', 'Reveals the foes\' held items on entry.', {
    onStart(bt, b) { const f = bt.foes(b).filter(x => x.item); if (!f.length) return; bt.popup(b); for (const x of f) bt.say('{0} frisked {1} and found its ' + G.ITEMS[x.item].name + '!', b, x); },
  });
  A('tidelight', 'Tidelight', 'Summons rain on entry. Its Water moves never miss and it heals 1/16 HP each turn in rain.', {
    onStart(bt, b) { bt.popup(b); bt.setWeather('rain', b); },
    accMod: (bt, b, m) => m.type === 'water' ? 99 : 1,
    onEndTurn(bt, b) { if (bt.weather === 'rain' && b.hp < b.maxhp) bt.heal(b, b.maxhp / 16, '{0} basked in the Tidelight!'); },
  });
  A('voidaura', 'Void Aura', 'Radiates a void that powers up every Dark move on the field by 33%.', {
    onStart(bt, b) { bt.popup(b); bt.say('{0} is radiating a Void Aura!', b); }, fieldAura: 'dark',
  });

  // -------------------------------------------------- stat modifiers
  A('grit', 'Grit', 'Boosts Attack by 50% if it has a status condition. Ignores the burn Attack drop.', {
    atkMod: (bt, b, s) => s === 'atk' && b.status ? 1.5 : 1, gutsBurn: true,
  });
  A('sunfireheart', 'Sunfire Heart', 'Boosts Sp. Atk by 50% in harsh sunlight, but loses HP each turn.', {
    atkMod: (bt, b, s) => s === 'spa' && bt.weather === 'sun' ? 1.5 : 1,
    onEndTurn(bt, b) { if (bt.weather === 'sun') bt.damage(b, b.maxhp / 8, '{0} was hurt by its Sunfire Heart!'); },
  });
  A('mightystrength', 'Mighty Strength', 'Doubles its Attack stat.', { atkMod: (bt, b, s) => s === 'atk' ? 2 : 1 });
  A('thickfur', 'Thick Fur', 'Its thick fur doubles its Defense.', { defMod: (bt, b, s) => s === 'def' ? 2 : 1 });
  A('swiftswim', 'Swift Swim', 'Doubles Speed in rain.', weatherSpeed('rain'));
  A('sunchaser', 'Sunchaser', 'Doubles Speed in harsh sunlight.', weatherSpeed('sun'));
  A('sandrush', 'Sand Rush', 'Doubles Speed in a sandstorm. Immune to sandstorm damage.', { ...weatherSpeed('sand'), sandImmune: true });
  A('slushrush', 'Slush Rush', 'Doubles Speed in snow.', weatherSpeed('snow'));
  A('speedboost', 'Speed Boost', 'Raises Speed by one stage at the end of each turn.', {
    onEndTurn(bt, b) { if (b.turnsOut > 0 && b.stages.spe < 6) { bt.popup(b); bt.boost(b, { spe: 1 }, b); } },
  });

  // -------------------------------------------------- power modifiers
  A('technique', 'Technique', 'Powers up weak moves (60 power or less) by 50%.', { powMod: (bt, b, m, t, pow) => pow <= 60 ? 1.5 : 1 });
  A('ironfist', 'Iron Fist', 'Powers up punching moves by 20%.', { powMod: (bt, b, m) => m.punch ? 1.2 : 1 });
  A('strongjaw', 'Strong Jaw', 'Powers up biting moves by 50%.', { powMod: (bt, b, m) => m.bite ? 1.5 : 1 });
  A('keenedge', 'Keen Edge', 'Powers up slicing moves by 50%.', { powMod: (bt, b, m) => m.slice ? 1.5 : 1 });
  A('reckless', 'Reckless', 'Powers up moves that have recoil by 20%.', { powMod: (bt, b, m) => m.recoil ? 1.2 : 1 });
  A('toughclaws', 'Tough Claws', 'Powers up contact moves by 30%.', { powMod: (bt, b, m) => m.contact ? 1.3 : 1 });
  A('pulsemaster', 'Pulse Master', 'Powers up pulse and aura moves by 50%.', { powMod: (bt, b, m) => m.pulse ? 1.5 : 1 });
  A('adaptability', 'Adaptability', 'Same-type attack bonus becomes 2x instead of 1.5x.', { stab: 2 });
  A('tintedlens', 'Tinted Lens', 'Doubles the power of "not very effective" moves.', { dmgDealtMod: (bt, s, t, m, eff) => eff < 1 && eff > 0 ? 2 : 1 });
  A('superluck', 'Super Luck', 'Heightens the critical-hit ratio of its moves.', { critBonus: 1 });
  A('skilllink', 'Skill Link', 'Multi-hit moves always hit the maximum number of times.', { skillLink: true });
  A('serenegrace', 'Serene Grace', 'Doubles the chance of moves\' added effects.', { secMult: 2 });
  A('compoundeyes', 'Compound Eyes', 'Boosts accuracy by 30%.', { accMod: () => 1.3 });
  A('scrappy', 'Scrappy', 'Normal and Fighting moves can hit Ghost types. Can\'t be Menaced.', { scrappy: true, menaceImmune: true });
  A('prankster', 'Prankster', 'Gives status moves +1 priority. (Dark types are immune to them.)', { priMod: (bt, b, m) => m.cat === 'status' ? 1 : 0, prankster: true });
  A('momentum', 'Momentum', 'Knocking out a foe boosts its Attack by one stage.', { onKO(bt, s) { if (s.stages.atk < 6) { bt.popup(s); bt.boost(s, { atk: 1 }, s); } } });
  A('unaware', 'Unaware', 'Ignores the foe\'s stat changes when attacking or being attacked.', { unaware: true });

  // -------------------------------------------------- defensive
  A('hover', 'Hover', 'Floats above the ground, gaining immunity to Ground moves.', { levitate: true });
  A('absorbent', 'Absorbent', 'Water moves heal it instead of dealing damage.', absorbType('water', (bt, t) => { if (!bt.heal(t, t.maxhp / 4, '{0} soaked up the water!')) bt.say('It doesn\'t affect {0}...', t); }));
  A('voltsponge', 'Volt Sponge', 'Electric moves heal it instead of dealing damage.', absorbType('electric', (bt, t) => { if (!bt.heal(t, t.maxhp / 4, '{0} absorbed the current!')) bt.say('It doesn\'t affect {0}...', t); }));
  A('flashfire', 'Flash Fire', 'Absorbs Fire moves, powering up its own Fire moves.', {
    ...absorbType('fire', (bt, t) => { t.vol.flashFire = true; bt.say('{0}\'s Fire moves were powered up!', t); }),
    powMod: (bt, b, m) => b.vol.flashFire && m.type === 'fire' ? 1.5 : 1,
  });
  A('herbivore', 'Herbivore', 'Eats Grass moves, raising Attack instead of taking damage.', absorbType('grass', (bt, t) => { if (!bt.boost(t, { atk: 1 }, t)) bt.say('It doesn\'t affect {0}...', t); }));
  A('lightningrod', 'Lightning Rod', 'Draws in Electric moves, raising Sp. Atk instead of taking damage.', absorbType('electric', (bt, t) => { if (!bt.boost(t, { spa: 1 }, t)) bt.say('It doesn\'t affect {0}...', t); }));
  A('soundproof', 'Soundproof', 'Immune to sound-based moves.', { tryHit(bt, t, s, m) { if (!m.sound || t === s) return false; bt.popup(t); bt.say('It doesn\'t affect {0}...', t); return true; } });
  A('bulletproof', 'Bulletproof', 'Immune to ball and bomb moves.', { tryHit(bt, t, s, m) { if (!m.ball) return false; bt.popup(t); bt.say('It doesn\'t affect {0}...', t); return true; } });
  A('thickfat', 'Thick Fat', 'Halves damage from Fire and Ice moves.', { dmgTakenMod: (bt, t, s, m) => m.type === 'fire' || m.type === 'ice' ? .5 : 1 });
  A('hardshell', 'Hard Shell', 'Reduces damage from super-effective moves by 25%.', { dmgTakenMod: (bt, t, s, m, eff) => eff > 1 ? .75 : 1 });
  A('multiscale', 'Multiscale', 'Halves damage taken while at full HP.', { dmgTakenMod: (bt, t) => t.hp >= t.maxhp ? .5 : 1 });
  A('frostscales', 'Frost Scales', 'Halves damage from special moves.', { dmgTakenMod: (bt, t, s, m) => m.cat === 'spec' ? .5 : 1 });
  A('sturdy', 'Sturdy', 'Survives any single hit from full HP with 1 HP left.', { sturdy: true });
  A('shellarmor', 'Shell Armor', 'Protected from critical hits.', { critImmune: true });
  A('magicguard', 'Magic Guard', 'Only takes damage from direct attacks.', { magicGuard: true });
  A('clearbody', 'Clear Body', 'Prevents other mons from lowering its stats.', { statDropBlock: () => true });
  A('keeneye', 'Keen Eye', 'Its accuracy can\'t be lowered.', { statDropBlock: (bt, b, st) => st === 'acc' });
  A('hypercutter', 'Hyper Cutter', 'Its Attack can\'t be lowered by others.', { statDropBlock: (bt, b, st) => st === 'atk' });
  A('defiant', 'Defiant', 'Sharply raises Attack when a foe lowers its stats.', { onStatDropped(bt, b) { bt.popup(b); bt.boost(b, { atk: 2 }, b); } });
  A('competitive', 'Competitive', 'Sharply raises Sp. Atk when a foe lowers its stats.', { onStatDropped(bt, b) { bt.popup(b); bt.boost(b, { spa: 2 }, b); } });
  A('stamina', 'Stamina', 'Raises Defense by one stage whenever it\'s hit.', { afterHit(bt, t) { if (t.hp > 0 && t.stages.def < 6) { bt.popup(t); bt.boost(t, { def: 1 }, t); } } });

  // -------------------------------------------------- contact punish
  A('static', 'Static', 'Contact with it may cause paralysis (30%).', contact((bt, t, s) => { if (G.chance(.3) && bt.canStatus(s, 'par')) { bt.popup(t); bt.setStatus(s, 'par', t); } }));
  A('flamebody', 'Flame Body', 'Contact with it may cause a burn (30%).', contact((bt, t, s) => { if (G.chance(.3) && bt.canStatus(s, 'brn')) { bt.popup(t); bt.setStatus(s, 'brn', t); } }));
  A('poisonpoint', 'Poison Point', 'Contact with it may poison the attacker (30%).', contact((bt, t, s) => { if (G.chance(.3) && bt.canStatus(s, 'psn')) { bt.popup(t); bt.setStatus(s, 'psn', t); } }));
  A('roughskin', 'Rough Skin', 'Attackers that make contact take 1/8 of their max HP in damage.', contact((bt, t, s) => { bt.popup(t); bt.damage(s, s.maxhp / 8, '{0} was hurt!'); }));
  A('ironbarbs', 'Iron Barbs', 'Attackers that make contact take 1/8 of their max HP in damage.', contact((bt, t, s) => { bt.popup(t); bt.damage(s, s.maxhp / 8, '{0} was hurt!'); }));

  // -------------------------------------------------- status immunity
  A('limber', 'Limber', 'Can\'t be paralyzed.', immune('par'));
  A('insomnia', 'Insomnia', 'Can\'t fall asleep.', immune('slp'));
  A('immunity', 'Immunity', 'Can\'t be poisoned.', immune('psn', 'tox'));
  A('waterveil', 'Water Veil', 'Can\'t be burned.', immune('brn'));
  A('magmaarmor', 'Magma Armor', 'Can\'t be frozen.', immune('frz'));
  A('owntempo', 'Own Tempo', 'Can\'t be confused. Can\'t be Menaced.', { confImmune: true, menaceImmune: true });
  A('innerfocus', 'Inner Focus', 'Never flinches. Can\'t be Menaced.', { flinchImmune: true, menaceImmune: true });

  // -------------------------------------------------- recovery / misc
  A('naturalcure', 'Natural Cure', 'Its status conditions heal when it switches out.', { onSwitchOut(bt, b) { b.status = null; b.mon.status = null; } });
  A('regenerator', 'Regenerator', 'Restores 1/3 of its max HP when it switches out.', { onSwitchOut(bt, b) { if (b.hp > 0) { b.hp = Math.min(b.maxhp, b.hp + Math.floor(b.maxhp / 3)); b.mon.hp = b.hp; } } });
  A('shedskin', 'Shed Skin', 'Has a 1-in-3 chance of shedding status conditions each turn.', {
    onEndTurn(bt, b) { if (b.status && G.chance(1 / 3)) { bt.popup(b); bt.cureStatus(b, '{0} shed its skin and was cured!'); } },
  });
  A('raindish', 'Rain Dish', 'Gradually regains HP in rain.', { onEndTurn(bt, b) { if (bt.weather === 'rain' && b.hp < b.maxhp) { bt.popup(b); bt.heal(b, b.maxhp / 16); } } });
  A('icebody', 'Ice Body', 'Gradually regains HP in snow.', { onEndTurn(bt, b) { if (bt.weather === 'snow' && b.hp < b.maxhp) { bt.popup(b); bt.heal(b, b.maxhp / 16); } } });
  A('runaway', 'Run Away', 'Can always escape from wild battles.', { runAway: true });
  A('pickup', 'Pickup', 'May pick up an item after battle if it isn\'t holding one.', { pickup: true });
  A('cutecharm', 'Cute Charm', 'Contact may leave the attacker infatuated... or at least very distracted (30% to lower its Attack).', contact((bt, t, s) => { if (G.chance(.3) && s.stages.atk > -6) { bt.popup(t); bt.boost(s, { atk: -1 }, t); } }));
  A('illuminate', 'Illuminate', 'Its glow draws in wild mons (raises encounter rate when leading). In battle, raises accuracy slightly.', { accMod: () => 1.1, lure: true });
  A('synchronize', 'Synchronize', 'Passes burn, poison or paralysis back to whoever inflicted it.', { synchronize: true });
  A('levitate_steel', 'Magnet Float', 'Floats on magnetism, gaining immunity to Ground moves.', { levitate: true });
})();
