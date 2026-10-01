/*
 * Checks every level against Momo's brain, without opening the game.
 *
 *   node tools/check-levels.js
 *
 * For each level it shows how many test snacks Momo gets right when the
 * player shows a few, some or all of the examples. Run it after editing
 * js/levels.js to make sure a level can be won.
 */
var Brain = require('../js/brain.js');
var levels = require('../js/levels.js');

var PASS = 0.75;

function label(snacks) {
  return snacks.map(function (snack) { return { snack: snack, plate: Brain.truth(snack) }; });
}

function subsets(items) {
  var out = [];
  for (var mask = 1; mask < (1 << items.length); mask++) {
    var pick = [];
    for (var i = 0; i < items.length; i++) if (mask & (1 << i)) pick.push(items[i]);
    out.push(pick);
  }
  return out;
}

function hasBoth(examples) {
  return examples.some(function (e) { return e.plate === 'yum'; }) &&
         examples.some(function (e) { return e.plate === 'yuck'; });
}

function summarise(name, pool, tests, fixed) {
  var byCount = {};
  subsets(pool).forEach(function (pick) {
    var examples = label((fixed || []).concat(pick));
    if (!hasBoth(examples)) return;
    var right = Brain.countCorrect(Brain.test(tests, examples));
    var k = pick.length;
    byCount[k] = byCount[k] || { min: 99, max: 0, sum: 0, n: 0, pass: 0 };
    var b = byCount[k];
    b.min = Math.min(b.min, right); b.max = Math.max(b.max, right);
    b.sum += right; b.n++; if (right / tests.length >= PASS) b.pass++;
  });
  console.log('  ' + name);
  Object.keys(byCount).forEach(function (k) {
    var b = byCount[k];
    console.log('    ' + String(k).padStart(2) + ' shown: ' +
      'worst ' + b.min + '/' + tests.length + ', average ' + (b.sum / b.n).toFixed(1) +
      ', best ' + b.max + ', wins ' + Math.round(100 * b.pass / b.n) + '%');
  });
}

var ok = true;
levels.forEach(function (level, i) {
  console.log('\nLevel ' + (i + 1) + ': ' + level.name);
  summarise('from the first tray', level.tray, level.test);
  var firstBest = Brain.countCorrect(Brain.test(level.test, label(level.tray)));
  var all = level.tray.concat(level.later ? level.later.snacks : []);
  var finalBest = Brain.countCorrect(Brain.test(level.test, label(all)));
  if (level.later) {
    summarise('after the extra snacks arrive (whole first tray already shown)', level.later.snacks, level.test, level.tray);
    var canWinEarly = firstBest / level.test.length >= PASS;
    console.log('  first tray only: ' + firstBest + '/' + level.test.length + (canWinEarly ? '  (level can be won before the extra snacks!)' : '  (not enough to win, as intended)'));
  }
  console.log('  everything shown: ' + finalBest + '/' + level.test.length);
  if (finalBest !== level.test.length) { ok = false; console.log('  PROBLEM: Momo cannot get full marks on this level.'); }
  Brain.test(level.test, label(all)).forEach(function (r, n) {
    if (!r.correct) console.log('    misses test snack ' + (n + 1) + ': ' + JSON.stringify(r.snack));
  });
});
console.log(ok ? '\nAll levels can be won.' : '\nSome levels need fixing.');
process.exit(ok ? 0 : 1);
