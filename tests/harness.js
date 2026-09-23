// Loads the game's data + logic files into a Node vm context for headless tests.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
function load(files) {
  const ctx = { console, Math, Date, JSON, Promise, setTimeout, Set, Map, Array, Object, String, Number, Error, parseInt, parseFloat, isNaN, Uint8Array, Uint8ClampedArray, Float32Array };
  ctx.globalThis = ctx; ctx.window = undefined;
  vm.createContext(ctx);
  for (const f of files) {
    const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
    try { vm.runInContext(code, ctx, { filename: f }); }
    catch (e) { console.error('Error loading', f); throw e; }
  }
  return ctx.G;
}
const CORE = ['js/engine/core.js', 'js/data/types.js', 'js/data/moves.js', 'js/data/abilities.js', 'js/data/items.js', 'js/data/species.js', 'js/battle/mon.js', 'js/battle/engine.js', 'js/battle/ai.js'];
module.exports = { load, CORE, ROOT };
