/*
 * Momo Learns to Munch: Momo's brain.
 *
 * This is real machine learning, just a very small one. Momo keeps every
 * example it has been shown. To guess a new snack, it finds the example that
 * looks most like it (its "nearest neighbour") and copies that example's plate.
 *
 * Momo can only look. It sees three things about a snack:
 *   colour, size and spikiness.
 * It never sees whether the snack is really yum or yuck.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./tokens.js'));
  else root.MomoBrain = factory(root.MomoTokens);
})(typeof self !== 'undefined' ? self : this, function (T) {

  // How much Momo cares about each thing it sees. Colour is the first thing
  // Momo notices, which is exactly why lopsided examples can fool it.
  var WEIGHT = { color: 4.5, size: 1.0, spike: 1.0 };

  function hexToOklab(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    var rgb = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) {
      v /= 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    var l = Math.cbrt(0.4122214708 * rgb[0] + 0.5363325363 * rgb[1] + 0.0514459929 * rgb[2]);
    var m = Math.cbrt(0.2119034982 * rgb[0] + 0.6806995451 * rgb[1] + 0.1073969566 * rgb[2]);
    var s = Math.cbrt(0.0883024619 * rgb[0] + 0.2817188376 * rgb[1] + 0.6299787005 * rgb[2]);
    return [
      0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s
    ];
  }

  function colorHex(name) {
    return T.color.snack[name] || name;
  }

  // What Momo sees: a short list of numbers for one snack.
  function look(snack) {
    var lab = hexToOklab(colorHex(snack.color));
    return [
      lab[0] * WEIGHT.color, lab[1] * WEIGHT.color, lab[2] * WEIGHT.color,
      snack.size * WEIGHT.size,
      snack.spike * WEIGHT.spike
    ];
  }

  // How different two snacks look to Momo. 0 means identical.
  function difference(a, b) {
    var fa = look(a), fb = look(b), sum = 0;
    for (var i = 0; i < fa.length; i++) sum += (fa[i] - fb[i]) * (fa[i] - fb[i]);
    return Math.sqrt(sum);
  }

  // examples: [{ snack, plate }] where plate is 'yum' or 'yuck'.
  // Returns the examples sorted from most alike to least alike.
  function compare(snack, examples) {
    return examples
      .map(function (ex) { return { example: ex, difference: difference(snack, ex.snack) }; })
      .sort(function (p, q) { return p.difference - q.difference; });
  }

  function guess(snack, examples) {
    var ranked = compare(snack, examples);
    if (!ranked.length) return null;
    return { plate: ranked[0].example.plate, because: ranked[0].example, ranked: ranked };
  }

  function truth(snack) {
    return snack.yum ? 'yum' : 'yuck';
  }

  // Let Momo try every test snack. Returns one result per snack.
  function test(tests, examples) {
    return tests.map(function (snack) {
      var g = guess(snack, examples);
      return { snack: snack, guess: g, plate: g && g.plate, correct: !!g && g.plate === truth(snack) };
    });
  }

  function countCorrect(results) {
    return results.filter(function (r) { return r.correct; }).length;
  }

  // Which snacks still waiting in the tray would make Momo better if shown?
  // The most helpful ones come first.
  function helpful(tests, examples, waiting) {
    var now = countCorrect(test(tests, examples));
    return waiting
      .map(function (snack) {
        var more = examples.concat([{ snack: snack, plate: truth(snack) }]);
        return { snack: snack, gain: countCorrect(test(tests, more)) - now };
      })
      .filter(function (item) { return item.gain > 0; })
      .sort(function (p, q) { return q.gain - p.gain; })
      .map(function (item) { return item.snack; });
  }

  // Examples sitting on the wrong plate.
  function mixedUp(examples) {
    return examples.filter(function (ex) { return ex.plate !== truth(ex.snack); });
  }

  return {
    WEIGHT: WEIGHT, look: look, difference: difference, compare: compare, guess: guess,
    truth: truth, test: test, countCorrect: countCorrect, helpful: helpful, mixedUp: mixedUp,
    hexToOklab: hexToOklab
  };
});
