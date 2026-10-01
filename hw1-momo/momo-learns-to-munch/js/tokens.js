/*
 * Momo Learns to Munch: design tokens.
 *
 * The one place colours, line weights and fonts are defined. The game, the
 * intro video and any extra artwork all read from here, so they always match.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MomoTokens = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return {
    color: {
      ink: '#3B2A4F',        // every outline and every word: a soft aubergine, like a brush pen
      cloth: '#FFD460',      // the picnic blanket
      clothLight: '#FFE490', // its lighter stripes
      clothDeep: '#FFC53F',  // where two stripes cross
      white: '#FFFCF2',      // Momo, plates, paper
      shade: '#F2E3C6',      // warm shading on white things
      pink: '#FF8AA8',       // hearts, cheeks, the Yum plate, buttons
      pinkDeep: '#EC5480',
      stink: '#9AA93A',      // stink lines, the Yuck plate
      stinkDeep: '#77852A',
      leaf: '#84C94F',       // Momo's sprout, the meadow
      leafDeep: '#5DA53B',
      meadow: '#A9DA70',
      gold: '#FFB530',       // stars
      basket: '#E7B36C',     // the snack basket
      basketDeep: '#C98B45',
      box: '#8ADBC8',        // the lunchbox
      boxDeep: '#57BCA7',
      snack: {
        blue: '#4A7BF2',      // blueberry
        green: '#3FBF6F',     // green apple
        tangerine: '#FF7A3C', // tangerine
        purple: '#A463E8'     // grape
      }
    },
    // Line weight, in stage pixels (the stage is 1280 x 720). Lines are drawn
    // thin on the upper left and heavy on the lower right, like a brush pen.
    stroke: { thin: 2.4, base: 3.1, bold: 3.6 },
    font: {
      display: "'Bagel Fat One', 'Grandstander', system-ui, sans-serif",
      body: "'Grandstander', 'Trebuchet MS', system-ui, sans-serif"
    },
    stage: { width: 1280, height: 720 }
  };
});
