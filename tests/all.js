// Every 1.0 check in one run, with a pass/fail table (ROADMAP.md, "The goal: Solmere 1.0").
//   node server.js &   NODE_PATH=/opt/node22/lib/node_modules node tests/all.js [--quick]
// --quick skips the slow ones (the full golden path and the balance run). Exit code 1 if anything fails.
const { execFile } = require('child_process');
const path = require('path');
const quick = process.argv.includes('--quick');
const root = path.join(__dirname, '..');
// [name, script, args, pass(output) -> true | failure note, slow?]
const CHECKS = [
  ['Text lint', 'tools/textlint.js', [], o => /ok: /.test(o) || 'findings'],
  ['Doors, items, people reachable', 'tests/doors_reachable.js', [], o => /^ok:/m.test(o) || 'unreachable things'],
  ['Boulder puzzles solvable', 'tests/boulders.js', [], o => !/FAIL/.test(o) || 'unsolvable'],
  ['Saves at every chapter', 'tests/save_roundtrip.js', [], o => /ok: saving/.test(o) || 'save problems'],
  ['Tides', 'tests/tides.js', [], o => !/FAIL|ERRORS/.test(o) || 'failures'],
  ['Nemesis trainers', 'tests/nemesis.js', [], o => !/FAIL|ERRORS/.test(o) || 'failures'],
  ['Quick Battle', 'tests/quickbattle.js', [], o => !/FAIL|ERRORS/.test(o) || 'failures'],
  // the teams a player naturally has: Juniper with Mira's Emberjay; Ione with the Digmole a Ranger points to
  // (two Flying types into the Electric gym is meant to be hard; the design target with Digmole is 64-84%)
  ['Early gym balance', 'tests/early_balance.js', [], o => { const bad = [...o.matchAll(/competent (Juniper natural|Ione natural\+Digmole)[^:]*:\s+(\d+)% win/g)].filter(m => +m[2] < 50); return !bad.length || bad.map(m => m[0]).join('; '); }],
  ['Touch controls fit every screen', 'tests/phone_layout.js', [], o => /^ok: the controls fit/m.test(o) || 'layout problems'],
  ['Phone budget on every map', 'tools/phonebudget.js', ['--views', '3'], o => /^ok: all/m.test(o) || 'maps over budget', true],
  ['Golden path: New Game to Champion', 'tools/goldenpath.js', ['new', '--max', '6000'], o => /"champion": true/.test(o) || 'did not reach the Champion', true],
  ['Whole-story balance (no walls)', 'tools/difficulty.js', ['30'], o => { const walls = (o.match(/\(wall\)/g) || []).length; return !walls || walls + ' wall(s)'; }, true],
];
const run = ([name, script, args]) => new Promise(res => {
  const t0 = Date.now();
  execFile('node', [path.join(root, script), ...args], { cwd: root, env: process.env, maxBuffer: 64 << 20, timeout: 60 * 60 * 1000 }, (err, stdout, stderr) => res({ out: (stdout || '') + (stderr || ''), err, s: Math.round((Date.now() - t0) / 1000) }));
});
(async () => {
  const rows = []; let fail = 0;
  for (const c of CHECKS) {
    const [name, , , pass, slow] = c;
    if (slow && quick) { rows.push([name, 'skipped', '']); continue; }
    process.stdout.write(`${name}... `);
    const r = await run(c), v = pass(r.out);
    const ok = v === true && !(r.err && r.err.killed);
    if (!ok) fail++;
    rows.push([name, ok ? 'pass' : 'FAIL', (ok ? '' : (r.err && r.err.killed ? 'timed out' : v)) + `  (${r.s}s)`]);
    console.log(ok ? 'pass' : 'FAIL');
  }
  console.log('\n' + rows.map(([n, s, note]) => `${s.padEnd(8)} ${n.padEnd(36)} ${note}`).join('\n'));
  console.log(fail ? `\n${fail} check(s) failing` : '\nall checks pass');
  process.exit(fail ? 1 : 0);
})();
