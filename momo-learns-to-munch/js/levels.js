/*
 * Momo Learns to Munch: the levels.
 *
 * To add a level, copy one of the blocks below and change the snacks.
 * Then run `node tools/check-levels.js` to see how Momo does on it.
 *
 * A snack is described by what Momo can see, plus the secret Momo can't see:
 *   color   'blue', 'green', 'tangerine' or 'purple'
 *   size    0 (small) to 1 (big)
 *   spike   0 (smooth) to 1 (very spiky)
 *   yum     true or false, the secret (shown to the player as sparkles or stink lines)
 *
 * Each level has:
 *   tray    snacks the player can show Momo straight away
 *   later   (optional) more snacks that arrive after Momo's first test
 *   stuck   (optional) what Momo says when it fails before those snacks arrive
 *   test    new snacks Momo has to guess by itself
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MomoLevels = factory();
})(typeof self !== 'undefined' ? self : this, function () {

  function s(color, size, spike, yum) {
    return { color: color, size: size, spike: spike, yum: yum };
  }
  var YUM = true, YUCK = false;

  return [
    {
      id: 'first-bites',
      name: 'First bites',
      hello: "I've never seen a snack before. Show me which are yum and which are yuck!",
      tray: [
        s('blue', 0.30, 0.00, YUM), s('tangerine', 0.35, 0.85, YUCK),
        s('blue', 0.80, 0.00, YUM), s('tangerine', 0.85, 0.80, YUCK),
        s('blue', 0.55, 0.00, YUM), s('tangerine', 0.60, 0.90, YUCK)
      ],
      test: [
        s('blue', 0.45, 0.00, YUM), s('tangerine', 0.50, 0.85, YUCK),
        s('tangerine', 0.25, 0.90, YUCK), s('blue', 0.70, 0.00, YUM),
        s('blue', 0.20, 0.00, YUM), s('tangerine', 0.75, 0.80, YUCK)
      ],
      cheer: 'I learned that from your examples!',
      discovery: 'Momo learns from examples.'
    },
    {
      id: 'look-alikes',
      name: 'Look-alikes',
      hello: 'Uh-oh. These snacks all look alike! Show me what you have.',
      tray: [
        s('purple', 0.15, 0.12, YUM), s('purple', 0.90, 0.80, YUCK),
        s('purple', 0.35, 0.30, YUM), s('purple', 0.70, 0.62, YUCK)
      ],
      stuck: 'They all look alike! I need more examples to tell them apart.',
      later: {
        say: 'More snacks have arrived. More examples will help me!',
        snacks: [
          s('purple', 0.60, 0.20, YUM), s('purple', 0.20, 0.60, YUCK),
          s('purple', 0.85, 0.35, YUM), s('purple', 0.40, 0.70, YUCK),
          s('purple', 0.95, 0.10, YUM), s('purple', 0.10, 0.85, YUCK),
          s('purple', 0.50, 0.38, YUM), s('purple', 0.55, 0.58, YUCK)
        ]
      },
      test: [
        s('purple', 0.25, 0.15, YUM), s('purple', 0.85, 0.70, YUCK),
        s('purple', 0.80, 0.30, YUM), s('purple', 0.30, 0.62, YUCK),
        s('purple', 0.95, 0.25, YUM), s('purple', 0.15, 0.80, YUCK),
        s('purple', 0.55, 0.36, YUM), s('purple', 0.45, 0.57, YUCK)
      ],
      cheer: 'The more examples you show me, the better I guess!',
      discovery: 'More examples make better guesses.'
    },
    {
      id: 'lopsided-lunchbox',
      name: 'Lopsided lunchbox',
      hello: 'A lunchbox! Show me what is inside.',
      tray: [
        s('blue', 0.25, 0.00, YUM), s('green', 0.30, 0.75, YUCK),
        s('blue', 0.65, 0.05, YUM), s('green', 0.50, 0.85, YUCK),
        s('blue', 0.45, 0.00, YUM), s('green', 0.75, 0.80, YUCK),
        s('blue', 0.85, 0.05, YUM), s('green', 0.15, 0.90, YUCK)
      ],
      stuck: 'Every green snack in the lunchbox was yuck. So I said yuck to all the green ones!',
      later: {
        say: 'Look, a basket from the garden. Green ones that are yum!',
        snacks: [
          s('green', 0.20, 0.00, YUM), s('green', 0.45, 0.05, YUM),
          s('green', 0.70, 0.00, YUM), s('green', 0.90, 0.05, YUM)
        ]
      },
      test: [
        s('blue', 0.55, 0.00, YUM), s('green', 0.60, 0.80, YUCK),
        s('green', 0.35, 0.00, YUM), s('green', 0.40, 0.90, YUCK),
        s('green', 0.60, 0.05, YUM), s('blue', 0.30, 0.05, YUM),
        s('green', 0.80, 0.00, YUM), s('green', 0.20, 0.80, YUCK)
      ],
      cheer: 'Yum snacks can be green too. I only knew blue ones!',
      discovery: 'Lopsided examples make unfair guesses.'
    }
  ];
});
