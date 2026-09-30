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
      ink: '#27245C',        // every outline and every word
      cloth: '#FFD34E',      // the picnic cloth
      clothLight: '#FFE283', // lighter cloth check
      clothDeep: '#FFC229',  // where two cloth stripes cross
      white: '#FFFDF6',      // Momo, plates, speech bubbles
      shade: '#E6E1FB',      // soft shading on white things
      pink: '#FF6FA3',       // Momo's cheeks and spark, hearts, sparkles
      pinkDeep: '#E84F88',
      stink: '#8FA02C',      // stink lines on yucky snacks
      snack: {
        blue: '#3F8CFF',
        green: '#38C172',
        tangerine: '#FF6A3C',
        purple: '#9A6BFF'
      }
    },
    // Line weights, in stage pixels (the stage is 1280 x 720).
    stroke: { thin: 3, base: 4, bold: 5 },
    font: {
      display: "'Bagel Fat One', 'Grandstander', system-ui, sans-serif",
      body: "'Grandstander', 'Trebuchet MS', system-ui, sans-serif"
    },
    stage: { width: 1280, height: 720 }
  };
});
