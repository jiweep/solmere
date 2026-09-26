'use strict';
// =============================================================================
//  The Tamer's Guide: short one-time tips shown the first time something happens (your first battle, the
//  first super-effective hit, the first Orb throw...). New players choose them in the intro; anyone can
//  switch them in Options, and every tip can be read again from the menu (Guide).
//  Tips seen are remembered per save in G.save.vars.tipsSeen; G.save.vars.tips turns them on.
// =============================================================================
G.tutorial = (() => {
  const TIPS = {
    controls: ['Getting around', 'Walk with the arrow keys or WASD. Press Z (or Enter) to talk, read and confirm, and X (or Esc) to go back.\\pHold Shift to run. Press H at any time to see every control.'],
    menu: ['The menu', 'Press X to open the menu. From there you can check your Party, open your Bag, read the Echodex and your Journal, and save your game.\\pYour Journal always shows where to go next.'],
    partner: ['Your partner', 'Your Echo travels in your Party and walks along behind you. Choose Party in the menu to see its moves and stats.\\pYou can carry up to six Echoes at once.'],
    battle: ['Battles', 'Choose FIGHT, then one of your Echo\'s moves. The bars show each Echo\'s health (HP). An Echo whose HP reaches zero faints.\\pWinning earns your Echoes experience. As they level up they grow stronger and learn new moves.'],
    types: ['Types', 'Every Echo and every move has a type, and some types are strong against others. Water beats Fire, Fire beats Grass, and Grass beats Water.\\pA super-effective move deals double damage; a not-very-effective one deals half. The FIGHT menu shows a hint for each move.'],
    wild: ['Wild Echoes', 'Wild Echoes roam the tall grass. Walk into one to battle it. Shy ones may run from you, and bold ones may come straight for you.\\pIf one is much weaker than your lead and you already own its kind, you\'ll simply Sweep past it.'],
    catching: ['Catching', 'To catch a wild Echo, weaken it first, then choose BAG and throw an Orb. The lower its HP, the better your chances. Sleeping or paralysed Echoes are easier still.'],
    throw: ['Throwing an Orb', 'A ring shrinks around the Echo. Press Z as it passes over the gold circle. The better your timing, the better your chances: Nice, Great, or Perfect!\\pGreat or Perfect catches in a row build a Catch Combo, which draws rarer Echoes to you.'],
    caught: ['Your new Echo', 'Caught Echoes join your Party if there\'s room. If your Party is full, they\'re sent to storage, which you can reach from the PC in any Tamer Haven.'],
    trainer: ['Tamer battles', 'You can\'t run from a battle against another Tamer. Defeat all of their Echoes to win, and earn prize money.\\pTamers who catch sight of you will walk over to challenge you.'],
    faint: ['Fainting', 'When an Echo faints, choose another to send out. If all of your Echoes faint, you\'ll hurry back to the last place you rested.\\pVisit a Tamer Haven to heal your team for free, or use a Potion from your Bag.'],
    haven: ['Tamer Havens', 'Every town has a Tamer Haven. Talk to the nurse inside to heal your whole team for free.\\pThe Mart sells Orbs, Potions and other supplies.'],
    badge: ['Badges', 'Each Warden badge marks how far you\'ve come. Earn six, and the road to the Conclave will open.\\pYour Journal in the menu always shows your next goal.'],
    sweep: ['Sweeping', 'You swept past a weak wild Echo without a battle. Sweep several in a row to build a chain for bonus experience.'],
  };
  const ORDER = Object.keys(TIPS);
  const q = [];
  const V = () => (G.save && G.save.vars) || {};
  const on = () => !!V().tips;
  const seen = id => !!(V().tipsSeen && V().tipsSeen[id]);
  const mark = id => { const v = V(); (v.tipsSeen || (v.tipsSeen = {}))[id] = 1; };
  const text = id => `{c}${TIPS[id][0]}{w}\\p${TIPS[id][1]}`;
  const api = {
    TIPS, ORDER, on,
    want(id) { return on() && TIPS[id] && !seen(id); },
    // queue a tip to show at the next calm moment (the next battle command, or back in the world)
    queue(id) { if (this.want(id) && !q.includes(id)) q.push(id); },
    pending() { return q.length > 0 && on(); },
    // show a tip now in the world (awaits the dialogue)
    async show(id) { if (!this.want(id)) return; mark(id); const i = q.indexOf(id); if (i >= 0) q.splice(i, 1); await G.say(text(id), { speaker: 'Tamer\'s Guide' }); },
    async flush() { while (q.length) await this.show(q[0]); },
    // in battle: shown in the battle's own message box, a page at a time, each waiting for a press
    async battle(sc, id) {
      if (!this.want(id)) return; mark(id);
      const i = q.indexOf(id); if (i >= 0) q.splice(i, 1);
      const [title, body] = TIPS[id];
      const pages = body.split('\\p');
      for (let k = 0; k < pages.length; k++) await sc.message(`${k === 0 ? '{c}' + title + ':{w} ' : ''}${pages[k]}`, { press: true });
    },
    async battleFlush(sc) { while (q.length && on()) await this.battle(sc, q[0]); },
    // the Guide: every tip, readable again at any time
    async guide() {
      while (true) {
        const k = await G.choose(ORDER.map(id => ({ label: TIPS[id][0], right: seen(id) ? '' : 'new' })).concat([{ label: 'Close' }]), { x: 110, y: 10, w: 200, maxRows: 12, title: 'Tamer\'s Guide', cancel: ORDER.length });
        if (k < 0 || k >= ORDER.length) return;
        mark(ORDER[k]); await G.say(text(ORDER[k]), { speaker: 'Tamer\'s Guide' });
      }
    },
  };
  return api;
})();
