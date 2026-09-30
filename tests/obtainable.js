// Everything a player can collect has a way into a solo game: every species in the Echodex (wild, gift, fossil,
// scripted encounter, or evolving from one of those, with any evolution item findable too) and every item in
// the bag's pockets (an item ball, a shop, a gift, a prize). It found 40 Skill Discs, 17 held items and Mints,
// and three species (the two starters you didn't pick, the fossil you didn't choose) with no source at all.
// Run: node server.js & NODE_PATH=/opt/node22/lib/node_modules node tests/obtainable.js
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
// Items the game hands out from engine code rather than the story (checked here by name, so a rename fails loudly)
const ENGINE = { healorb: 'js/ui/pcshopdex.js' };
// Key items that are story props only and never go in the bag
const PROPS = new Set(['tidekey', 'spirekey']);
(async () => {
  const root = path.join(__dirname, '..');
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  const storyFiles = fs.readdirSync(path.join(root, 'js/story')).filter(f => f.endsWith('.js') && f !== 'trainers.js').map(f => 'js/story/' + f)
    .concat(['js/ui/dailytide.js', 'js/world/overworld.js']);
  const story = storyFiles.map(read).join('\n');
  const br = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
  const pg = await br.newPage();
  await pg.goto('http://localhost:8080/?mute'); await pg.waitForFunction(() => window.G && G.MAPDEFS && G.scenes.length);
  const data = await pg.evaluate(() => {
    const wild = {};
    for (const d of Object.values(G.MAPDEFS)) if (d.enc) for (const [k, t] of Object.entries(d.enc)) for (const [sp] of (t.list || [])) (wild[sp] = wild[sp] || []).push(d.id + ':' + k);
    const items = {}; for (const [id, it] of Object.entries(G.ITEMS)) items[id] = { pocket: it.pocket || it.cat || it.kind, fossil: it.fossil || null };
    const evo = {}; for (const s of Object.values(G.SPECIES)) for (const e of s.evo || []) (evo[e.to] = evo[e.to] || []).push({ from: s.id, ...e });
    // item balls placed by the map patches at load time count as story sources too
    const balls = new Set(); for (const d of Object.values(G.MAPDEFS)) for (const o of d.objs || []) if (o.type === 'item') balls.add(o.item);
    return { dex: G.DEX.slice(), starters: G.STARTERS.slice(), wild, items, evo, balls: [...balls] };
  });
  await br.close();
  const balls = new Set(data.balls);
  const inStory = id => balls.has(id) || new RegExp(`['"\`]${id}['"\`]`).test(story);
  const out = [];
  // items
  const itemOk = id => inStory(id) || (ENGINE[id] && read(ENGINE[id]).includes(`'${id}'`)) || PROPS.has(id);
  const noItem = Object.keys(data.items).filter(id => !itemOk(id));
  if (noItem.length) out.push(`items with no way into the game (${noItem.length}): ${noItem.join(' ')}`);
  // species: sources first, then evolutions until nothing changes
  const got = new Set();
  for (const sp of data.dex) {
    if (data.wild[sp]) got.add(sp);
    else if (new RegExp(`(giveMon|species:|wild)\\(?\\s*'${sp}'`).test(story)) got.add(sp);
  }
  for (const [id, it] of Object.entries(data.items)) if (it.fossil && itemOk(id)) got.add(it.fossil);
  // the starter you choose, and the two Professor Hale gives the Champion
  if (/hale_starters/.test(story)) for (const sp of data.starters) got.add(sp);
  for (let more = true; more;) {
    more = false;
    for (const sp of data.dex) if (!got.has(sp) && (data.evo[sp] || []).some(e => got.has(e.from) && (!e.item || itemOk(e.item)))) { got.add(sp); more = true; }
  }
  const noMon = data.dex.filter(sp => !got.has(sp));
  if (noMon.length) out.push(`species a solo player can't get (${noMon.length}): ${noMon.join(' ')}`);
  // both fossils in one game: Pim hands over the second once the first is revived
  if (!/got_fossil2/.test(story)) out.push('only one of the two fossils can be had in one game');
  console.log(out.length ? 'FAIL\n' + out.join('\n') : `ok: all ${data.dex.length} species and ${Object.keys(data.items).length} items can be had in a solo game`);
})();
