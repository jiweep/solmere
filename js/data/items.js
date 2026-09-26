'use strict';
// ============================================================================
//  Items. pockets: med, orb, battle, hold, berry, tm, key, misc
// ============================================================================
G.ITEMS = {};
G.POCKETS = [
  { id: 'med', name: 'Medicine', col: '#ef6b73' }, { id: 'orb', name: 'Orbs', col: '#3b82e0' },
  { id: 'battle', name: 'Battle', col: '#ea7a2a' }, { id: 'berry', name: 'Berries', col: '#2aa86a' },
  { id: 'hold', name: 'Held Items', col: '#9b5de5' }, { id: 'misc', name: 'Other', col: '#b0892a' },
  { id: 'tm', name: 'TMs', col: '#1ba7b8' }, { id: 'key', name: 'Key Items', col: '#555a66' },
];
(function () {
  const I = (id, name, pocket, price, desc, o = {}) => { G.ITEMS[id] = { id, name, pocket, price, desc, sell: Math.floor(price / 2), ...o }; };
  // ---------------------------------------------------------- medicine
  I('potion', 'Potion', 'med', 200, 'Restores 20 HP to one Echo.', { heal: 20, icon: 'potion', ic: '#9b6be8' });
  I('superpotion', 'Super Potion', 'med', 600, 'Restores 60 HP to one Echo.', { heal: 60, icon: 'potion', ic: '#e8a23b' });
  I('hyperpotion', 'Hyper Potion', 'med', 1200, 'Restores 120 HP to one Echo.', { heal: 120, icon: 'potion', ic: '#e85c9b' });
  I('maxpotion', 'Max Potion', 'med', 2400, 'Fully restores the HP of one Echo.', { heal: 9999, icon: 'potion', ic: '#3bb3e8' });
  I('fullrestore', 'Full Restore', 'med', 3000, 'Fully restores HP and cures all status conditions.', { heal: 9999, cure: 'all', icon: 'potion', ic: '#f2d23b' });
  I('antidote', 'Antidote', 'med', 150, 'Cures poison.', { cure: ['psn', 'tox'], icon: 'spray', ic: '#a33ea1' });
  I('parlyzheal', 'Paralyze Heal', 'med', 250, 'Cures paralysis.', { cure: ['par'], icon: 'spray', ic: '#e8c020' });
  I('awakening', 'Awakening', 'med', 250, 'Wakes up a sleeping Echo.', { cure: ['slp'], icon: 'spray', ic: '#6390f0' });
  I('burnheal', 'Burn Heal', 'med', 250, 'Heals a burn.', { cure: ['brn'], icon: 'spray', ic: '#ee8130' });
  I('iceheal', 'Ice Heal', 'med', 250, 'Thaws a frozen Echo.', { cure: ['frz'], icon: 'spray', ic: '#78d0d0' });
  I('fullheal', 'Full Heal', 'med', 500, 'Cures all status conditions.', { cure: 'all', icon: 'spray', ic: '#f2d23b' });
  I('revive', 'Revive', 'med', 1500, 'Revives a fainted Echo with half its HP.', { revive: .5, icon: 'revive', ic: '#f2d23b' });
  I('maxrevive', 'Max Revive', 'med', 4000, 'Revives a fainted Echo with full HP.', { revive: 1, icon: 'revive', ic: '#3bb3e8' });
  I('ether', 'Ether', 'med', 1200, 'Restores 10 PP to one move.', { pp: 10, icon: 'bottle', ic: '#6be8c5' });
  I('maxether', 'Max Ether', 'med', 2000, 'Fully restores the PP of one move.', { pp: 99, icon: 'bottle', ic: '#3b82e0' });
  I('elixir', 'Elixir', 'med', 3000, 'Restores 10 PP to every move of one Echo.', { pp: 10, ppAll: true, icon: 'bottle', ic: '#e8a23b' });
  I('rarecandy', 'Rare Candy', 'med', 4800, 'Raises an Echo\'s level by 1.', { level: 1, icon: 'candy', ic: '#6be8e8' });
  I('expcandy', 'EXP Candy', 'med', 1000, 'Grants a hearty helping of EXP (enough for a level or two early on).', { expc: 1, icon: 'candy', ic: '#f2d23b' });
  I('hpup', 'HP Up', 'med', 5000, 'Raises the HP effort (EV) of an Echo by 10.', { ev: 'hp', icon: 'vitamin', ic: '#3ed16b' });
  I('protein', 'Protein', 'med', 5000, 'Raises the Attack effort (EV) of an Echo by 10.', { ev: 'atk', icon: 'vitamin', ic: '#ef4b4b' });
  I('iron', 'Iron', 'med', 5000, 'Raises the Defense effort (EV) of an Echo by 10.', { ev: 'def', icon: 'vitamin', ic: '#e8a23b' });
  I('calcium', 'Calcium', 'med', 5000, 'Raises the Sp. Atk effort (EV) of an Echo by 10.', { ev: 'spa', icon: 'vitamin', ic: '#3b82e0' });
  I('zinc', 'Zinc', 'med', 5000, 'Raises the Sp. Def effort (EV) of an Echo by 10.', { ev: 'spd', icon: 'vitamin', ic: '#9b5de5' });
  I('carbos', 'Carbos', 'med', 5000, 'Raises the Speed effort (EV) of an Echo by 10.', { ev: 'spe', icon: 'vitamin', ic: '#e85c9b' });
  I('ppup', 'PP Up', 'med', 9800, 'Raises the max PP of one move.', { ppup: 1, icon: 'bottle', ic: '#e8e03b' });
  I('resetbrew', 'Reset Brew', 'med', 3000, 'A bitter tea that resets all of an Echo\'s effort values (EVs) to zero.', { evreset: true, icon: 'bottle', ic: '#7a6a4a' });

  // ---------------------------------------------------------------- orbs
  I('orb', 'Orb', 'orb', 200, 'A standard capture orb.', { ball: 1, icon: 'orb', ic: '#e8484a' });
  I('greatorb', 'Great Orb', 'orb', 600, 'A well-made orb with a better catch rate.', { ball: 1.5, icon: 'orb', ic: '#3b82e0' });
  I('ultraorb', 'Ultra Orb', 'orb', 1200, 'A high-performance orb with an excellent catch rate.', { ball: 2, icon: 'orb', ic: '#2c2c34' });
  I('netorb', 'Net Orb', 'orb', 1000, 'Works especially well on Water and Bug Echoes.', { ball: 'net', icon: 'orb', ic: '#2aa8a0' });
  I('duskorb', 'Dusk Orb', 'orb', 1000, 'Works especially well at night or in caves.', { ball: 'dusk', icon: 'orb', ic: '#3a8a3a' });
  I('quickorb', 'Quick Orb', 'orb', 1000, 'Works especially well if thrown on the first turn.', { ball: 'quick', icon: 'orb', ic: '#e8c020' });
  I('timerorb', 'Timer Orb', 'orb', 1000, 'Grows stronger the longer the battle lasts.', { ball: 'timer', icon: 'orb', ic: '#f0f0f0' });
  I('healorb', 'Heal Orb', 'orb', 300, 'Fully heals the Echo it catches.', { ball: 1, healBall: true, icon: 'orb', ic: '#f58fb8' });
  I('bondorb', 'Bond Orb', 'orb', 1000, 'A cozy orb. Echoes caught in it bond with you faster.', { ball: 1, friendBall: true, icon: 'orb', ic: '#b05ae0' });
  I('crownorb', 'Crown Orb', 'orb', 0, 'The ultimate orb. It never fails.', { ball: 255, icon: 'orb', ic: '#9b3ed8' });

  // -------------------------------------------------------------- battle
  I('xattack', 'X Attack', 'battle', 1000, 'Sharply raises Attack in battle.', { xstat: 'atk', icon: 'x', ic: '#ef4b4b' });
  I('xdefense', 'X Defense', 'battle', 1000, 'Sharply raises Defense in battle.', { xstat: 'def', icon: 'x', ic: '#e8a23b' });
  I('xspatk', 'X Sp. Atk', 'battle', 1000, 'Sharply raises Sp. Atk in battle.', { xstat: 'spa', icon: 'x', ic: '#3b82e0' });
  I('xspdef', 'X Sp. Def', 'battle', 1000, 'Sharply raises Sp. Def in battle.', { xstat: 'spd', icon: 'x', ic: '#9b5de5' });
  I('xspeed', 'X Speed', 'battle', 1000, 'Sharply raises Speed in battle.', { xstat: 'spe', icon: 'x', ic: '#e85c9b' });
  I('pokedoll', 'Fluff Doll', 'battle', 800, 'Throw it to distract a wild Echo and escape for sure.', { flee: true, icon: 'doll', ic: '#e8b07a' });

  // ------------------------------------------------------------- berries
  I('oranberry', 'Oran Berry', 'berry', 80, 'Held: restores 10 HP when HP drops below half.', { heal: 10, berry: 'hp', icon: 'berry', ic: '#3b82e0', holdable: true });
  I('sunberry', 'Sun Berry', 'berry', 250, 'Held: restores 1/4 of max HP when HP drops below half.', { healPct: .25, berry: 'hp', icon: 'berry', ic: '#f2d23b', holdable: true });
  I('lumenberry', 'Lumen Berry', 'berry', 400, 'Held: cures any status condition or confusion once.', { cure: 'all', berry: 'status', icon: 'berry', ic: '#3ed16b', holdable: true });
  I('cheriberry', 'Cheri Berry', 'berry', 100, 'Held: cures paralysis.', { cure: ['par'], berry: 'status', icon: 'berry', ic: '#ef4b4b', holdable: true });
  I('chestoberry', 'Chesto Berry', 'berry', 100, 'Held: wakes the holder from sleep.', { cure: ['slp'], berry: 'status', icon: 'berry', ic: '#6e44d6', holdable: true });
  I('rawstberry', 'Rawst Berry', 'berry', 100, 'Held: heals a burn.', { cure: ['brn'], berry: 'status', icon: 'berry', ic: '#6be8c5', holdable: true });
  I('pechaberry', 'Pecha Berry', 'berry', 100, 'Held: cures poison.', { cure: ['psn', 'tox'], berry: 'status', icon: 'berry', ic: '#f58fb8', holdable: true });
  I('leppaberry', 'Leppa Berry', 'berry', 300, 'Held: restores 10 PP to a move that runs out.', { berry: 'pp', icon: 'berry', ic: '#e8484a', holdable: true });

  // ------------------------------------------------------------ hold items
  const H = (id, name, price, desc, o) => I(id, name, 'hold', price, desc, { holdable: true, icon: o.icon || 'gem', ic: o.ic || '#9b5de5', ...o });
  H('leftovers', 'Leftovers', 4000, 'Restores 1/16 of max HP at the end of each turn.', { icon: 'food', ic: '#e8b07a' });
  H('blacksludge', 'Black Sludge', 4000, 'Heals Poison types 1/16 each turn. Hurts anyone else.', { icon: 'food', ic: '#3a3040' });
  H('lifegem', 'Life Gem', 4000, 'Boosts move power by 30%, but the holder loses 1/10 HP per attack.', { ic: '#e8484a' });
  H('powerband', 'Power Band', 4000, 'Boosts Attack by 50%, but locks the holder into its first move.', { icon: 'band', ic: '#e8a23b' });
  H('focuslens', 'Focus Lens', 4000, 'Boosts Sp. Atk by 50%, but locks the holder into its first move.', { icon: 'lens', ic: '#3b82e0' });
  H('swiftscarf', 'Swift Scarf', 4000, 'Boosts Speed by 50%, but locks the holder into its first move.', { icon: 'band', ic: '#3ed16b' });
  H('gritsash', 'Grit Sash', 3000, 'If the holder has full HP, it survives one KO hit with 1 HP. Single use.', { icon: 'band', ic: '#ef6b3b' });
  H('guardvest', 'Guard Vest', 4000, 'Boosts Sp. Def by 50%, but the holder can only use attacks.', { icon: 'vest', ic: '#5a7a3a' });
  H('spikedhelm', 'Spiked Helm', 4000, 'Attackers that make contact lose 1/6 of their max HP.', { icon: 'helm', ic: '#8a8aa0' });
  H('evocrystal', 'Evo Crystal', 4000, 'Boosts Def and Sp. Def by 50% if the holder can still evolve.', { ic: '#e890c8' });
  H('expertbelt', 'Expert Belt', 3000, 'Boosts super-effective moves by 20%.', { icon: 'band', ic: '#2c2c34' });
  H('scopelens', 'Scope Lens', 3000, 'Raises the holder\'s critical-hit ratio.', { icon: 'lens', ic: '#e8c020' });
  H('widelens', 'Wide Lens', 3000, 'Boosts the holder\'s accuracy by 10%.', { icon: 'lens', ic: '#78d0d0' });
  H('quickclaw', 'Quick Claw', 3000, 'Sometimes (20%) lets the holder move first.', { icon: 'claw', ic: '#e8c020' });
  H('shellbell', 'Shell Bell', 3000, 'Restores HP equal to 1/8 of the damage the holder deals.', { icon: 'bell', ic: '#f58fb8' });
  H('luckyegg', 'Lucky Egg', 10000, 'Held: the holder earns 50% more EXP.', { icon: 'egg', ic: '#f5f0e0' });
  H('amuletcoin', 'Amulet Coin', 10000, 'Held: doubles prize money from battles.', { icon: 'coin', ic: '#f2d23b' });
  H('soothebell', 'Soothe Bell', 3000, 'Held: the holder\'s bond grows faster.', { icon: 'bell', ic: '#b0c8f0' });
  H('everstone', 'Everstone', 1000, 'Held: prevents the holder from evolving.', { icon: 'stone', ic: '#a0a0a0' });
  const tb = (id, name, type, desc) => H(id, name, 3000, `Boosts ${G.cap(type)} moves by 20%. ${desc || ''}`.trim(), { boostType: type, ic: G.TYPE_COLORS[type] });
  tb('charcoal', 'Charcoal', 'fire'); tb('mysticwater', 'Mystic Water', 'water'); tb('miracleseed', 'Miracle Seed', 'grass');
  tb('magnet', 'Magnet', 'electric'); tb('nevermeltice', 'Never-Melt Ice', 'ice'); tb('blackbelt', 'Black Belt', 'fighting');
  tb('poisonbarb', 'Poison Barb', 'poison'); tb('softsand', 'Soft Sand', 'ground'); tb('sharpbeak', 'Sharp Beak', 'flying');
  tb('twistedspoon', 'Twisted Spoon', 'psychic'); tb('silverpowder', 'Silver Powder', 'bug'); tb('hardstone', 'Hard Stone', 'rock');
  tb('spelltag', 'Spell Tag', 'ghost'); tb('dragonfang', 'Dragon Fang', 'dragon'); tb('blackglasses', 'Black Glasses', 'dark');
  tb('metalcoat', 'Metal Coat', 'steel'); tb('fairyribbon', 'Fairy Ribbon', 'fairy'); tb('silkscarf', 'Silk Scarf', 'normal');

  // ---------------------------------------------------------------- misc
  const stone = (id, name, desc, ic) => I(id, name, 'misc', 3000, desc, { stone: id, icon: 'stone', ic });
  stone('flamestone', 'Flame Stone', 'A stone that glows with inner heat. Makes certain Echoes evolve.', '#ee6030');
  stone('tidestone', 'Tide Stone', 'A stone with a wave trapped inside. Makes certain Echoes evolve.', '#3b82e0');
  stone('voltstone', 'Volt Stone', 'A crackling stone. Makes certain Echoes evolve.', '#e8c020');
  stone('leafstone', 'Leaf Stone', 'A stone with a leaf pattern. Makes certain Echoes evolve.', '#3ed16b');
  stone('froststone', 'Frost Stone', 'A stone that never warms. Makes certain Echoes evolve.', '#9be0f0');
  stone('duskstone', 'Dusk Stone', 'A stone as dark as a moonless night. Makes certain Echoes evolve.', '#4a3a5a');
  stone('dawnstone', 'Dawn Stone', 'A stone that sparkles like first light. Makes certain Echoes evolve.', '#f5c0e0');
  I('linkcord', 'Link Cord', 'misc', 3000, 'A strange cord that coaxes "trade evolution" Echoes to evolve without a trade.', { stone: 'linkcord', icon: 'cord', ic: '#8a8aa0' });
  const natures = ['Adamant', 'Jolly', 'Modest', 'Timid', 'Bold', 'Impish', 'Calm', 'Careful', 'Brave', 'Quiet', 'Relaxed', 'Sassy', 'Hasty', 'Naive', 'Serious'];
  for (const n of natures) I('mint_' + n.toLowerCase(), n + ' Mint', 'misc', 5000, `Changes an Echo's stat growth to match a ${n} nature. (Its listed nature stays the same.)`, { mint: n.toLowerCase(), icon: 'leaf', ic: '#6be8a0' });
  I('abilitycapsule', 'Ability Capsule', 'misc', 8000, 'Swaps an Echo between its two regular Abilities.', { capsule: true, icon: 'capsule', ic: '#e85c9b' });
  I('abilitypatch', 'Ability Patch', 'misc', 20000, 'Awakens an Echo\'s Hidden Ability.', { patch: true, icon: 'capsule', ic: '#9b3ed8' });
  I('bottlecap', 'Bottle Cap', 'misc', 15000, 'Maximizes one of an Echo\'s Individual Values (IVs).', { cap: 1, icon: 'cap', ic: '#c0c0c0' });
  I('goldcap', 'Gold Bottle Cap', 'misc', 50000, 'Maximizes all of an Echo\'s Individual Values (IVs).', { cap: 6, icon: 'cap', ic: '#f2d23b' });
  I('repel', 'Repel', 'misc', 350, 'Keeps weaker wild Echoes away for 100 steps.', { repel: 100, icon: 'spray', ic: '#3ed16b' });
  I('superrepel', 'Super Repel', 'misc', 500, 'Keeps weaker wild Echoes away for 200 steps.', { repel: 200, icon: 'spray', ic: '#e8a23b' });
  I('maxrepel', 'Max Repel', 'misc', 700, 'Keeps weaker wild Echoes away for 250 steps.', { repel: 250, icon: 'spray', ic: '#3b82e0' });
  I('escaperope', 'Escape Rope', 'misc', 550, 'Returns you to the last entrance of a cave or building.', { escape: true, icon: 'rope', ic: '#b0892a' });
  I('nugget', 'Nugget', 'misc', 10000, 'A nugget of pure gold. Sells for a high price.', { icon: 'coin', ic: '#f2d23b' });
  I('pearl', 'Pearl', 'misc', 2800, 'A lustrous pearl. Sells for a good price.', { icon: 'pearl', ic: '#f5f0f0' });
  I('stardust', 'Stardust', 'misc', 3000, 'Lovely red sand that sparkles. Sells well.', { icon: 'dust', ic: '#ef8b8b' });
  I('clawfossil', 'Claw Fossil', 'misc', 0, 'A fossil of an ancient Echo\'s claw. Can be revived in Galvan Harbor.', { icon: 'fossil', ic: '#b0905a', fossil: 'raptorix' });
  I('wingfossil', 'Wing Fossil', 'misc', 0, 'A fossil of an ancient Echo\'s wing. Can be revived in Galvan Harbor.', { icon: 'fossil', ic: '#a0806a', fossil: 'pterock' });

  // ----------------------------------------------------------------- key
  const K = (id, name, desc, o = {}) => I(id, name, 'key', 0, desc, { icon: o.icon || 'key', ic: o.ic || '#555a66', ...o });
  K('dex', 'Echodex', 'A high-tech encyclopedia that records every Echo you see or catch.', { icon: 'dex', ic: '#e8484a' });
  K('journal', 'Tamer\'s Journal', 'Your mother\'s gift: a journal that tracks quests and notes.', { icon: 'book', ic: '#b0892a' });
  K('resonanceband', 'Resonance Band', 'A band that lets a strongly bonded Echo Resonate once per battle. Press R in the Fight menu.', { icon: 'band', ic: '#3fd0bf' });
  K('bike', 'Bike', 'A folding bike for fast travel. Press F to ride or register it.', { icon: 'bike', ic: '#e8484a', field: 'bike' });
  K('trailknife', 'Trail Knife', 'A sturdy knife for clearing thin trees. Walk into one to use it.', { icon: 'knife', ic: '#8a8aa0' });
  K('pickhammer', 'Pick Hammer', 'A hammer that shatters cracked boulders. Walk into one to use it.', { icon: 'hammer', ic: '#b0892a' });
  K('gripboots', 'Grip Boots', 'Heavy boots that let you push large boulders.', { icon: 'boots', ic: '#7a5a3a' });
  K('tideboard', 'Tide Board', 'A surfboard that lets you ride across water. Face water and press A.', { icon: 'board', ic: '#3b82e0' });
  K('wingwhistle', 'Wing Whistle', 'Summons a Sky Taxi to any town you\'ve visited. Use it from the Town Map.', { icon: 'whistle', ic: '#a98ff3' });
  K('rod', 'Fishing Rod', 'Face water and press A to fish.', { icon: 'rod', ic: '#b0892a', field: 'rod' });
  K('prorod', 'Pro Rod', 'An expert\'s rod that hooks rarer Echoes.', { icon: 'rod', ic: '#3b82e0', field: 'rod' });
  K('expshare', 'EXP Share', 'Shares battle EXP with your whole party. Toggle in the Options menu.', { icon: 'share', ic: '#3ed16b' });
  K('dowsing', 'Dowsing Rod', 'Beeps faster as you near hidden items. Toggle it with F while not biking... or just watch for sparkles.', { icon: 'rod', ic: '#e8c020' });
  K('vsrecorder', 'Vs. Recorder', 'Lets trainers you\'ve beaten challenge you again after gym progress.', { icon: 'dex', ic: '#3b82e0' });
  K('shinycharm', 'Shiny Charm', 'A charm that triples your odds of meeting a shiny Echo.', { icon: 'charm', ic: '#f2d23b' });
  K('tidekey', 'Tide Key', 'An ancient key humming with the song of the sea.', { icon: 'key', ic: '#3fd0bf' });
  K('cranekeycard', 'Crane Keycard', 'A keycard for restricted floors of Crane Dynamics.', { icon: 'card', ic: '#e8484a' });
  K('parcel', 'Lab Parcel', 'A parcel from Professor Hale for Warden Juniper.', { icon: 'box', ic: '#b0892a' });
  K('lantern', 'Lantern', 'A warm lantern that lights up dark places.', { icon: 'lantern', ic: '#f2d23b' });
  K('spirekey', 'Spire Pass', 'A pass to the Battle Spire.', { icon: 'card', ic: '#9b5de5' });
  K('oldamber', 'Glowing Scale', 'A scale that glows faintly. Someone in Frostpeak might want it.', { icon: 'pearl', ic: '#78d0d0' });

  // ----------------------------------------------------------------- TMs
  G.TM_LIST = ['wardance', 'dragonclaw', 'psystrike', 'calmmind', 'roar', 'toxic', 'snowfall', 'braceup', 'bulletseed', 'bondstrike',
    'sunshine', 'taunt', 'icebeam', 'blizzard', 'hyperbeam', 'lightscreen', 'protect', 'raincall', 'gigadrain', 'decoy',
    'facade', 'solarbeam', 'shardtrap', 'thunderbolt', 'thunder', 'earthquake', 'surf', 'hitandrun', 'psychic', 'shadowball',
    'wallbreaker', 'knockaway', 'reflect', 'voltdash', 'flamethrower', 'sludgebomb', 'sandstorm', 'fireblast', 'rockslide', 'aerialace',
    'rest', 'scald', 'flipturn', 'radiantflash', 'darkpulse', 'energyball', 'flashcannon', 'stoneedge', 'poisonjab', 'dragonpulse',
    'crosscut', 'focusblast', 'earthpower', 'playrough', 'ironhead', 'moonblast', 'tailwind', 'wispflame', 'staticwave', 'scheme',
    'agility', 'heatwave', 'bodyslam', 'drainpunch', 'airslash', 'bugbuzz', 'hypervoice', 'gigaimpact', 'icefang', 'spikes'];
  G.TM_LIST.forEach((mv, i) => {
    const n = String(i + 1).padStart(2, '0'); const m = G.MOVES[mv];
    if (!m) throw new Error('TM move missing ' + mv);
    I('tm' + n, 'TM' + n + ' ' + m.name, 'tm', 3000 + (m.pow >= 100 ? 2000 : 0), `Teaches ${m.name}. TMs can be used again and again.`, { tm: mv, icon: 'tm', ic: G.TYPE_COLORS[m.type] });
  });
  G.tmItemFor = mv => 'tm' + String(G.TM_LIST.indexOf(mv) + 1).padStart(2, '0');
})();
