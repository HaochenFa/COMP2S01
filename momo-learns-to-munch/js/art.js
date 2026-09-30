/*
 * Momo Learns to Munch: every drawing in the game.
 *
 * Each function returns SVG markup as text, built from the shared tokens.
 * The game and the intro video both draw from this file, so Momo and the
 * snacks look exactly the same everywhere.
 *
 * House style: one ink colour for every outline, flat fills, one soft shade
 * on the lower right, one highlight on the upper left, a flat oval shadow.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./tokens.js'));
  else root.MomoArt = factory(root.MomoTokens);
})(typeof self !== 'undefined' ? self : this, function (T) {
  var C = T.color;
  var INK = C.ink;

  function n(v) { return Math.round(v * 100) / 100; }

  function mix(hexA, hexB, t) {
    var a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
    var out = [16, 8, 0].map(function (shift) {
      var va = (a >> shift) & 255, vb = (b >> shift) & 255;
      return Math.round(va + (vb - va) * t);
    });
    return '#' + out.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }

  function svg(inner, width, height, viewBox, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height +
      '" viewBox="' + viewBox + '" ' + (extra || '') + ' aria-hidden="true" focusable="false">' + inner + '</svg>';
  }

  var SHADOW = 'fill="' + INK + '" fill-opacity="0.16"';

  /* ------------------------------------------------------------------ */
  /* Snacks                                                              */
  /* ------------------------------------------------------------------ */

  var POINTS = 8;

  // The body radius of a snack, in stage pixels.
  function snackRadius(snack) { return 16 + 16 * snack.size; }

  // A blobby outline. spike 0 is a smooth berry, spike 1 is a sharp burr.
  function snackPath(R, spike) {
    var outer = R * (1 + 0.20 * spike);
    var inner = R * (1 - 0.34 * spike);
    var tipRound = 0.5 - 0.42 * spike; // 0.5 is fully round, near 0 is sharp
    var count = POINTS * 2, pts = [], i;
    for (i = 0; i < count; i++) {
      var angle = -Math.PI / 2 + (Math.PI * 2 * i) / count;
      var r = i % 2 === 0 ? outer : inner;
      pts.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r, t: i % 2 === 0 ? tipRound : 0.5 });
    }
    function toward(p, q, t) { return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }; }
    var first = toward(pts[0], pts[1], pts[0].t);
    var d = 'M' + n(first.x) + ' ' + n(first.y);
    for (i = 1; i <= count; i++) {
      var p = pts[i % count], prev = pts[(i - 1) % count], next = pts[(i + 1) % count];
      var a = toward(p, prev, p.t), b = toward(p, next, p.t);
      d += 'L' + n(a.x) + ' ' + n(a.y) + 'Q' + n(p.x) + ' ' + n(p.y) + ' ' + n(b.x) + ' ' + n(b.y);
    }
    return d + 'Z';
  }

  // One snack, centred on 0,0.
  function snackInner(snack) {
    var R = snackRadius(snack);
    var color = C.snack[snack.color] || snack.color;
    var d = snackPath(R, snack.spike);
    var top = R * (1 + 0.20 * snack.spike);
    var w = T.stroke.base;
    return '<g class="snack-art">' +
      '<ellipse cx="0" cy="' + n(top * 0.98) + '" rx="' + n(R * 0.86) + '" ry="' + n(R * 0.24) + '" ' + SHADOW + '/>' +
      '<path d="M0 ' + n(-R * 0.6) + 'Q' + n(R * 0.02) + ' ' + n(-top - 5) + ' ' + n(R * 0.3 + 3) + ' ' + n(-top - 8) +
        '" fill="none" stroke="' + INK + '" stroke-width="' + w + '" stroke-linecap="round"/>' +
      '<path d="' + d + '" fill="' + mix(color, INK, 0.26) + '"/>' +
      '<path d="' + d + '" fill="' + color + '" transform="translate(' + n(-R * 0.07) + ' ' + n(-R * 0.09) + ') scale(0.88)"/>' +
      '<ellipse cx="' + n(-R * 0.32) + '" cy="' + n(-R * 0.36) + '" rx="' + n(R * 0.2) + '" ry="' + n(R * 0.11) +
        '" fill="#fff" fill-opacity="0.75" transform="rotate(-35 ' + n(-R * 0.32) + ' ' + n(-R * 0.36) + ')"/>' +
      '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + w + '" stroke-linejoin="round"/>' +
      '</g>';
  }

  function sparklePath(size) {
    var s = size, k = size * 0.26;
    return 'M0 ' + n(-s) + 'Q' + n(k) + ' ' + n(-k) + ' ' + n(s) + ' 0Q' + n(k) + ' ' + n(k) + ' 0 ' + n(s) +
      'Q' + n(-k) + ' ' + n(k) + ' ' + n(-s) + ' 0Q' + n(-k) + ' ' + n(-k) + ' 0 ' + n(-s) + 'Z';
  }

  function sparkle(x, y, size, fill) {
    return '<g transform="translate(' + n(x) + ' ' + n(y) + ')"><path class="twinkle" d="' + sparklePath(size) + '" fill="' + (fill || C.white) +
      '" stroke="' + INK + '" stroke-width="' + T.stroke.thin + '" stroke-linejoin="round"/></g>';
  }

  function squiggle(x, y, height) {
    var h = height / 3, a = 4.5;
    var d = 'M' + n(x) + ' ' + n(y) +
      'q' + a + ' ' + n(-h / 2) + ' 0 ' + n(-h) + 'q' + (-a) + ' ' + n(-h / 2) + ' 0 ' + n(-h) + 'q' + a + ' ' + n(-h / 2) + ' 0 ' + n(-h);
    return '<g class="waft"><path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + d + '" fill="none" stroke="' + C.stink + '" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>';
  }

  // The secret only the player can see: sparkles for yum, stink lines for yuck.
  function markInner(kind, R) {
    if (kind === 'yum') {
      return '<g class="mark mark-yum">' +
        sparkle(R * 0.95 + 8, -R * 0.85 - 6, 9) +
        sparkle(-R * 0.95 - 9, -R * 0.35 - 4, 6.5, C.pink) +
        sparkle(R * 0.9 + 14, R * 0.25, 5) +
        '</g>';
    }
    if (kind === 'yuck') {
      var top = -R * 1.2 - 4;
      return '<g class="mark mark-yuck">' +
        squiggle(-R * 0.62 - 4, top + 5, 17) +
        squiggle(R * 0.62 + 6, top + 1, 20) +
        '</g>';
    }
    return '';
  }

  var SNACK_BOX = 116;

  // A snack as a whole picture. mark is 'yum', 'yuck' or nothing.
  function snack(data, mark) {
    var half = SNACK_BOX / 2;
    return svg(snackInner(data) + markInner(mark, snackRadius(data)), SNACK_BOX, SNACK_BOX,
      -half + ' ' + -half + ' ' + SNACK_BOX + ' ' + SNACK_BOX, 'class="snack-svg"');
  }

  /* ------------------------------------------------------------------ */
  /* Momo                                                                */
  /* ------------------------------------------------------------------ */

  var BODY = 'M100 50C146 50 172 92 172 134C172 166 146 180 100 180C54 180 28 166 28 134C28 92 54 50 100 50Z';

  function eye(cx, cy, rx, ry) {
    return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + rx + '" ry="' + ry + '" fill="' + INK + '"/>' +
      '<circle cx="' + n(cx + rx * 0.36) + '" cy="' + n(cy - ry * 0.4) + '" r="' + n(rx * 0.36) + '" fill="#fff"/>';
  }

  function line(d, width) {
    return '<path d="' + d + '" fill="none" stroke="' + INK + '" stroke-width="' + (width || 5) +
      '" stroke-linecap="round" stroke-linejoin="round"/>';
  }

  function openMouth(cx, cy, w, h) {
    // A happy open mouth with a pink tongue.
    var d = 'M' + n(cx - w) + ' ' + n(cy) + 'Q' + n(cx) + ' ' + n(cy - h * 0.18) + ' ' + n(cx + w) + ' ' + n(cy) +
      'Q' + n(cx + w * 0.92) + ' ' + n(cy + h) + ' ' + n(cx) + ' ' + n(cy + h) + 'Q' + n(cx - w * 0.92) + ' ' + n(cy + h) + ' ' + n(cx - w) + ' ' + n(cy) + 'Z';
    return '<path d="' + d + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="4" stroke-linejoin="round"/>' +
      '<ellipse cx="' + n(cx) + '" cy="' + n(cy + h * 0.78) + '" rx="' + n(w * 0.52) + '" ry="' + n(h * 0.3) + '" fill="' + C.pink + '"/>';
  }

  // The faces Momo can make.
  function face(mood, look) {
    var lx = look ? look[0] : 0, ly = look ? look[1] : 0;
    var L = 76, Rr = 124, Y = 112;
    var smile = line('M90 131Q100 141 110 131', 4.5);
    switch (mood) {
      case 'happy':
        return line('M65 115Q76 101 87 115') + line('M113 115Q124 101 135 115') + openMouth(100, 127, 12, 15);
      case 'cheer':
        return line('M64 114Q76 99 88 114') + line('M112 114Q124 99 136 114') + openMouth(100, 124, 15, 21);
      case 'yum':
        return line('M65 115Q76 101 87 115') + line('M113 115Q124 101 135 115') + openMouth(100, 125, 14, 19) +
          '<path d="M0 -5C-3 -10 -10 -7 -8 -1C-7 3 -2 5 0 8C2 5 7 3 8 -1C10 -7 3 -10 0 -5Z" transform="translate(150 78) rotate(14)" fill="' + C.pink +
          '" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
      case 'yuck':
        return line('M66 104L84 113L66 121') + line('M134 104L116 113L134 121') +
          line('M86 134Q93 127 100 134T114 134', 4.5) +
          '<path d="M95 136V146Q95 153 101.5 153Q108 153 108 146V136Z" fill="' + C.pink + '" stroke="' + INK + '" stroke-width="3.5" stroke-linejoin="round"/>';
      case 'think':
        return eye(L + 5, Y - 5, 8, 10) + eye(Rr + 5, Y - 5, 8, 10) +
          line('M66 94Q77 90 88 94', 4) + line('M114 88Q126 81 138 87', 4) +
          '<ellipse cx="105" cy="135" rx="5" ry="5.5" fill="' + INK + '"/>';
      case 'oops':
        return eye(L, Y + 1, 8.5, 10.5) + eye(Rr, Y + 1, 8.5, 10.5) +
          line('M62 98L86 91', 4) + line('M114 91L138 98', 4) +
          line('M87 136Q93.5 128 100 136T113 136', 4.5) +
          '<path d="M0 -11C5 -3 8 1 8 5A8 8 0 0 1 -8 5C-8 1 -5 -3 0 -11Z" transform="translate(160 84)" fill="#9CD4FF" stroke="' + INK + '" stroke-width="3" stroke-linejoin="round"/>';
      case 'wow':
        return eye(L, Y, 9.5, 12.5) + eye(Rr, Y, 9.5, 12.5) +
          '<ellipse cx="100" cy="136" rx="7" ry="9" fill="' + INK + '"/>';
      case 'blink':
        return line('M67 113Q76 118 85 113', 4.5) + line('M115 113Q124 118 133 113', 4.5) + smile;
      default:
        return eye(L + lx, Y + ly, 8.5, 10.5) + eye(Rr + lx, Y + ly, 8.5, 10.5) + smile;
    }
  }

  // Momo inside a 200 x 200 box. Momo stands on y = 180.
  function momoInner(mood, options) {
    options = options || {};
    var shadow = options.shadow === false ? '' : '<ellipse class="momo-shadow" cx="100" cy="182" rx="64" ry="10" ' + SHADOW + '/>';
    return shadow +
      '<g class="momo-body">' +
        '<path d="M100 54Q99 35 113 28" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linecap="round"/>' +
        '<circle class="momo-spark" cx="115" cy="25" r="9.5" fill="' + C.pink + '" stroke="' + INK + '" stroke-width="4.5"/>' +
        '<path d="' + BODY + '" fill="' + C.shade + '"/>' +
        '<path d="' + BODY + '" fill="' + C.white + '" transform="translate(100 115) scale(0.93) translate(-103 -120)"/>' +
        '<path d="' + BODY + '" fill="none" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
        '<ellipse cx="56" cy="134" rx="10.5" ry="6.5" fill="' + C.pink + '" fill-opacity="0.85"/>' +
        '<ellipse cx="144" cy="134" rx="10.5" ry="6.5" fill="' + C.pink + '" fill-opacity="0.85"/>' +
        '<g class="momo-face">' + face(mood || 'idle', options.look) + '</g>' +
      '</g>';
  }

  function momo(mood, size, options) {
    return svg(momoInner(mood, options), size, size, '0 0 200 200', 'class="momo-svg" data-mood="' + (mood || 'idle') + '"');
  }

  /* ------------------------------------------------------------------ */
  /* Things on the picnic cloth                                          */
  /* ------------------------------------------------------------------ */

  // A plate seen from a little above. Returns a picture w x h.
  function plate(w, h) {
    var rx = w / 2 - 6, ry = h / 2 - 14, cx = w / 2, cy = h / 2 - 5;
    return svg(
      '<ellipse cx="' + cx + '" cy="' + (cy + 13) + '" rx="' + rx + '" ry="' + ry + '" ' + SHADOW + '/>' +
      '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + C.white + '" stroke="' + INK + '" stroke-width="5"/>' +
      '<ellipse cx="' + cx + '" cy="' + (cy + 2) + '" rx="' + (rx - 26) + '" ry="' + (ry - 20) + '" fill="none" stroke="' + C.shade + '" stroke-width="5"/>',
      w, h, '0 0 ' + w + ' ' + h, 'class="plate-svg"');
  }

  // A paper tray with a scalloped edge.
  function tray(w, h) {
    var r = 26, x = 6, y = 6, ww = w - 12, hh = h - 22;
    var rect = function (dy, attrs) {
      return '<rect x="' + x + '" y="' + (y + dy) + '" width="' + ww + '" height="' + hh + '" rx="' + r + '" ' + attrs + '/>';
    };
    return svg(
      rect(12, SHADOW) +
      rect(0, 'fill="' + C.white + '" stroke="' + INK + '" stroke-width="5"') +
      '<rect x="' + (x + 14) + '" y="' + (y + 14) + '" width="' + (ww - 28) + '" height="' + (hh - 28) + '" rx="' + (r - 10) +
        '" fill="none" stroke="' + C.shade + '" stroke-width="4" stroke-dasharray="2 12" stroke-linecap="round"/>',
      w, h, '0 0 ' + w + ' ' + h, 'class="tray-svg"');
  }

  // A chunky little computer. Momo lives inside it.
  function computer(w) {
    var h = Math.round(w * 0.86);
    return svg(
      '<ellipse cx="150" cy="246" rx="120" ry="12" ' + SHADOW + '/>' +
      '<path d="M116 196H184L192 236H108Z" fill="' + mix(C.shade, INK, 0.18) + '" stroke="' + INK + '" stroke-width="5" stroke-linejoin="round"/>' +
      '<rect x="78" y="230" width="144" height="16" rx="8" fill="' + C.shade + '" stroke="' + INK + '" stroke-width="5"/>' +
      '<rect x="22" y="14" width="256" height="190" rx="30" fill="' + mix(C.shade, INK, 0.18) + '"/>' +
      '<rect x="22" y="14" width="256" height="182" rx="30" fill="' + C.shade + '"/>' +
      '<rect x="22" y="14" width="256" height="190" rx="30" fill="none" stroke="' + INK + '" stroke-width="5"/>' +
      '<rect x="46" y="36" width="208" height="132" rx="18" fill="' + mix(INK, C.snack.purple, 0.55) + '" stroke="' + INK + '" stroke-width="5"/>' +
      '<path d="M62 60Q66 50 78 48" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="5" stroke-linecap="round"/>' +
      '<circle cx="240" cy="184" r="5.5" fill="' + C.pink + '" stroke="' + INK + '" stroke-width="3"/>' +
      '<path d="M52 184H92" fill="none" stroke="' + INK + '" stroke-width="4" stroke-linecap="round" stroke-opacity="0.45"/>',
      w, h, '0 0 300 258', 'class="computer-svg"');
  }

  // A friendly pointing hand for showing where to drag.
  function hand(size) {
    return svg(
      '<g transform="rotate(-24 32 34)">' +
      '<path d="M25 58V22Q25 14 32 14Q39 14 39 22V38Q40 33 46 34Q51 35 51 41V44Q56 42 58 48V60Q58 76 42 76H36Q22 76 17 62L11 47Q9 40 15 39Q20 38 25 50Z" ' +
        'fill="' + C.white + '" stroke="' + INK + '" stroke-width="4.5" stroke-linejoin="round"/>' +
      '</g>',
      size, size, '0 0 72 84', 'class="hand-svg"');
  }

  /* ------------------------------------------------------------------ */
  /* Small signs                                                         */
  /* ------------------------------------------------------------------ */

  var HEART = 'M12 21C5 15.5 2 12 2 8A5 5 0 0 1 12 6A5 5 0 0 1 22 8C22 12 19 15.5 12 21Z';
  var STAR = 'M12 1.800L15 8.300L22.1 9.100L16.8 13.900L18.3 20.900L12 17.300L5.7 20.900L7.2 13.900L1.9 9.100L9 8.300Z';

  function icon(name, size, options) {
    options = options || {};
    var w = 2.4, body = '';
    var stroke = 'fill="none" stroke="' + (options.color || INK) + '" stroke-width="' + (options.width || 3) + '" stroke-linecap="round" stroke-linejoin="round"';
    switch (name) {
      case 'heart':
        body = '<path d="' + HEART + '" fill="' + C.pink + '" stroke="' + INK + '" stroke-width="' + w + '" stroke-linejoin="round"/>'; break;
      case 'star':
        body = '<path d="' + STAR + '" fill="' + (options.fill || C.pink) + '" stroke="' + INK + '" stroke-width="' + w + '" stroke-linejoin="round"/>'; break;
      case 'star-empty':
        body = '<path d="' + STAR + '" fill="' + INK + '" fill-opacity="0.12" stroke="' + INK + '" stroke-opacity="0.45" stroke-width="' + w + '" stroke-linejoin="round"/>'; break;
      case 'stink':
        body = '<path d="M8 21Q11 18 8 15T8 9T8 3M16 21Q19 18 16 15T16 9T16 3" fill="none" stroke="' + INK + '" stroke-width="5.5" stroke-linecap="round"/>' +
          '<path d="M8 21Q11 18 8 15T8 9T8 3M16 21Q19 18 16 15T16 9T16 3" fill="none" stroke="' + C.stink + '" stroke-width="2.4" stroke-linecap="round"/>'; break;
      case 'sparkle':
        body = '<g transform="translate(12 12)"><path d="' + sparklePath(10) + '" fill="' + C.white + '" stroke="' + INK + '" stroke-width="' + w + '" stroke-linejoin="round"/></g>'; break;
      case 'check':
        body = '<path d="M5 12.500L10 17.500L19.5 7" ' + stroke + '/>'; break;
      case 'cross':
        body = '<path d="M6.5 6.500L17.5 17.500M17.5 6.500L6.5 17.5" ' + stroke + '/>'; break;
      case 'play':
        body = '<path d="M8 5.500V18.500L19 12Z" fill="' + (options.color || INK) + '" stroke="' + (options.color || INK) + '" stroke-width="2.5" stroke-linejoin="round"/>'; break;
      case 'sound-on':
        body = '<path d="M4 9.500H8L13 5.500V18.500L8 14.500H4Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M16.5 9Q18.5 12 16.5 15M19 6.500Q23 12 19 17.5" ' + stroke + '/>'; break;
      case 'sound-off':
        body = '<path d="M4 9.500H8L13 5.500V18.500L8 14.500H4Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>' +
          '<path d="M17 9.500L22 14.500M22 9.500L17 14.5" ' + stroke + '/>'; break;
      case 'help':
        body = '<path d="M8.5 9Q8.5 5 12 5Q15.5 5 15.5 8.500Q15.5 10.8 12 12.500V14.5" ' + stroke + '/><circle cx="12" cy="19" r="1.8" fill="' + INK + '"/>'; break;
      case 'fast':
        body = '<path d="M4 6V18L12 12ZM13 6V18L21 12Z" fill="' + INK + '" stroke="' + INK + '" stroke-width="2" stroke-linejoin="round"/>'; break;
      case 'close':
        body = '<path d="M6 6L18 18M18 6L6 18" ' + stroke + '/>'; break;
    }
    return svg(body, size, size, '0 0 24 24', 'class="icon icon-' + name + '"');
  }

  // The game's name, as big outlined letters.
  function logo() {
    var font = 'font-family="' + T.font.display.replace(/'/g, '') + '"';
    var big = ' x="4" y="158" font-size="188" ' + font + ' stroke="' + INK + '" stroke-width="18" stroke-linejoin="round" paint-order="stroke"';
    return svg(
      '<text' + big + ' fill="' + INK + '" transform="translate(0 11)">Momo</text>' +
      '<text' + big + ' fill="' + C.white + '">Momo</text>' +
      '<text x="8" y="246" font-size="70" ' + font + ' fill="' + INK + '">Learns to Munch</text>',
      640, 262, '0 0 640 262', 'class="logo-svg"');
  }

  // The picnic cloth, as CSS. cell is the size of one check in pixels.
  function cloth(cell) {
    var light = 'rgba(255, 255, 255, 0.24)';
    return {
      backgroundColor: C.cloth,
      backgroundImage:
        'linear-gradient(90deg, ' + light + ' 50%, transparent 50%), ' +
        'linear-gradient(' + light + ' 50%, transparent 50%)',
      backgroundSize: cell * 2 + 'px ' + cell * 2 + 'px'
    };
  }

  return {
    svg: svg, mix: mix,
    snack: snack, snackInner: snackInner, snackRadius: snackRadius, snackPath: snackPath, markInner: markInner, SNACK_BOX: SNACK_BOX,
    momo: momo, momoInner: momoInner, face: face,
    plate: plate, tray: tray, computer: computer, hand: hand, icon: icon, sparkle: sparkle, logo: logo, cloth: cloth
  };
});
