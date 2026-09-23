'use strict';
// ============================================================================
//  Types & effectiveness chart (modern 18-type chart)
// ============================================================================
G.TYPES = ['normal', 'fire', 'water', 'grass', 'electric', 'ice', 'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug', 'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'];
G.TYPE_COLORS = {
  normal: '#a8a77a', fire: '#ee8130', water: '#6390f0', grass: '#58b847', electric: '#e8c020', ice: '#78d0d0',
  fighting: '#c22e28', poison: '#a33ea1', ground: '#d8a848', flying: '#a98ff3', psychic: '#f95587', bug: '#a6b91a',
  rock: '#b6a136', ghost: '#735797', dragon: '#6f35fc', dark: '#705746', steel: '#a0a0c0', fairy: '#e890c8',
};
(function () {
  // attacking type -> {defending type: multiplier}
  const se = {
    normal: { rock: .5, ghost: 0, steel: .5 },
    fire: { fire: .5, water: .5, grass: 2, ice: 2, bug: 2, rock: .5, dragon: .5, steel: 2 },
    water: { fire: 2, water: .5, grass: .5, ground: 2, rock: 2, dragon: .5 },
    grass: { fire: .5, water: 2, grass: .5, poison: .5, ground: 2, flying: .5, bug: .5, rock: 2, dragon: .5, steel: .5 },
    electric: { water: 2, grass: .5, electric: .5, ground: 0, flying: 2, dragon: .5 },
    ice: { fire: .5, water: .5, grass: 2, ice: .5, ground: 2, flying: 2, dragon: 2, steel: .5 },
    fighting: { normal: 2, ice: 2, poison: .5, flying: .5, psychic: .5, bug: .5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: .5 },
    poison: { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0, fairy: 2 },
    ground: { fire: 2, grass: .5, electric: 2, poison: 2, flying: 0, bug: .5, rock: 2, steel: 2 },
    flying: { grass: 2, electric: .5, fighting: 2, bug: 2, rock: .5, steel: .5 },
    psychic: { fighting: 2, poison: 2, psychic: .5, dark: 0, steel: .5 },
    bug: { fire: .5, grass: 2, fighting: .5, poison: .5, flying: .5, psychic: 2, ghost: .5, dark: 2, steel: .5, fairy: .5 },
    rock: { fire: 2, ice: 2, fighting: .5, ground: .5, flying: 2, bug: 2, steel: .5 },
    ghost: { normal: 0, psychic: 2, ghost: 2, dark: .5 },
    dragon: { dragon: 2, steel: .5, fairy: 0 },
    dark: { fighting: .5, psychic: 2, ghost: 2, dark: .5, fairy: .5 },
    steel: { fire: .5, water: .5, electric: .5, ice: 2, rock: 2, steel: .5, fairy: 2 },
    fairy: { fire: .5, fighting: 2, poison: .5, dragon: 2, dark: 2, steel: .5 },
  };
  G.typeEff = function (atk, def) { const r = se[atk]; return r && r[def] !== undefined ? r[def] : 1; };
  G.typeEffMulti = function (atk, defTypes) { let m = 1; for (const t of defTypes) if (t) m *= G.typeEff(atk, t); return m; };
  G.effLabel = function (m) {
    if (m === 0) return 'No effect'; if (m >= 4) return 'Extremely effective'; if (m >= 2) return 'Super effective';
    if (m <= .25) return 'Mostly ineffective'; if (m < 1) return 'Not very effective'; return 'Effective';
  };
  // defensive profile of a type combo: {type: mult}
  G.defProfile = function (types) { const o = {}; for (const a of G.TYPES) o[a] = G.typeEffMulti(a, types); return o; };
})();
