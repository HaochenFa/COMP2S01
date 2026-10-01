/*
 * Momo Learns to Munch: every drawing in the game.
 *
 * Each function returns SVG markup as text, built from the shared tokens.
 * The game and the intro video both draw from this file, so Momo and the
 * snacks look exactly the same everywhere.
 *
 * House style, as if drawn with a brush pen and coloured in by hand:
 *   - shapes are a little wobbly and lopsided, never perfect circles
 *   - outlines are thin on the upper left and heavy on the lower right
 *     (the ink sits a little down and right of the colour)
 *   - loose lines (smiles, stems, stink lines) swell in the middle and thin
 *     at the ends, like a brush stroke
 *   - flat colour, one warm shade on the lower right, one brushed highlight
 *
 * Nothing here is random from one drawing to the next: the wobble of a snack
 * is worked out from its colour, size and spikiness, so the same snack always
 * looks the same.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./tokens.js'));
  else root.MomoArt = factory(root.MomoTokens);
})(typeof self !== 'undefined' ? self : this, function (T) {
  var C = T.color;
  var INK = C.ink;
  var TAU = Math.PI * 2;

  /* ------------------------------------------------------------------ */
  /* Small tools                                                         */
  /* ------------------------------------------------------------------ */

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

  // The same "dice" every time for the same seed, so drawings never change by themselves.
  function dice(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seedFrom(text) {
    var h = 2166136261;
    for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }

  // A smooth line through a list of [x, y] points.
  function smooth(pts, closed) {
    var len = pts.length, d = 'M' + n(pts[0][0]) + ' ' + n(pts[0][1]);
    var count = closed ? len : len - 1;
    for (var i = 0; i < count; i++) {
      var p0 = closed ? pts[(i - 1 + len) % len] : pts[Math.max(i - 1, 0)];
      var p1 = pts[i % len], p2 = pts[(i + 1) % len];
      var p3 = closed ? pts[(i + 2) % len] : pts[Math.min(i + 2, len - 1)];
      d += 'C' + n(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + n(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
        n(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + n(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n(p2[0]) + ' ' + n(p2[1]);
    }
    return d + (closed ? 'Z' : '');
  }

  // Points along a curve that bends towards one control point.
  function bend(from, control, to, steps) {
    var out = [];
    for (var i = 0; i <= (steps || 8); i++) {
      var t = i / (steps || 8), u = 1 - t;
      out.push([u * u * from[0] + 2 * u * t * control[0] + t * t * to[0], u * u * from[1] + 2 * u * t * control[1] + t * t * to[1]]);
    }
    return out;
  }

  // Points along a smooth line through a few hand-placed points.
  function flow(pts, per) {
    var out = [], last = pts.length - 1;
    for (var i = 0; i < last; i++) {
      var p0 = pts[Math.max(i - 1, 0)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(i + 2, last)];
      for (var s = 0; s < (per || 5); s++) {
        var t = s / (per || 5), t2 = t * t, t3 = t2 * t;
        out.push([0, 1].map(function (k) {
          return 0.5 * (2 * p1[k] + (p2[k] - p0[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t3);
        }));
      }
    }
    out.push(pts[last]);
    return out;
  }

  // The outline of a brush stroke along some points: it swells in the middle
  // and thins towards both ends. start and end are the end thicknesses, as a
  // share of the full width.
  function brushPath(pts, width, start, end) {
    start = start === undefined ? 0.4 : start;
    end = end === undefined ? 0.4 : end;
    var left = [], right = [], last = pts.length - 1;
    function side(i) {
      var a = pts[Math.max(i - 1, 0)], b = pts[Math.min(i + 1, last)];
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
      var t = i / last, edge = start + (end - start) * t;
      var half = width * (edge + (1 - edge) * Math.sin(Math.PI * t)) / 2;
      return { tx: dx / len, ty: dy / len, half: half };
    }
    for (var i = 0; i <= last; i++) {
      var s = side(i);
      left.push([pts[i][0] - s.ty * s.half, pts[i][1] + s.tx * s.half]);
      right.push([pts[i][0] + s.ty * s.half, pts[i][1] - s.tx * s.half]);
    }
    var first = side(0), final = side(last);
    var headCap = [pts[0][0] - first.tx * first.half, pts[0][1] - first.ty * first.half];
    var tailCap = [pts[last][0] + final.tx * final.half, pts[last][1] + final.ty * final.half];
    return smooth([headCap].concat(left, [tailCap], right.reverse()), true);
  }

  function brush(pts, width, color, start, end, attrs) {
    return '<path d="' + brushPath(pts, width, start, end) + '" fill="' + (color || INK) + '"' + (attrs || '') + '/>';
  }

  // The brush-pen outline. The ink is the same shape as the colour, a little
  // bigger and slipped down and to the right, so the line comes out thin on
  // the upper left and heavy on the lower right.
  function ink(d, weight, attrs) {
    return '<path d="' + d + '" fill="' + INK + '" stroke="' + INK + '" stroke-width="' + n(weight * 2) +
      '" stroke-linejoin="round" stroke-linecap="round" transform="translate(' + n(weight * 0.34) + ' ' + n(weight * 0.5) + ')"' + (attrs || '') + '/>';
  }

  function paint(d, fill, attrs) { return '<path d="' + d + '" fill="' + fill + '"' + (attrs || '') + '/>'; }

  function inked(d, fill, weight) { return ink(d, weight) + paint(d, fill); }

  // Shading for a box-like shape: first the whole shape in its shade colour,
  // then the lit colour on top, pulled in from the lower right by `depth`.
  function shaded(d, lit, shade, x, y, w, h, depth) {
    var cx = x + w / 2, cy = y + h / 2;
    return paint(d, shade) + paint(d, lit, ' transform="translate(' + n(cx - depth / 2) + ' ' + n(cy - depth / 2) + ') scale(' + n(1 - depth / w) + ' ' + n(1 - depth / h) + ') translate(' + n(-cx) + ' ' + n(-cy) + ')"');
  }

  // A wobbly oval.
  function ovalPoints(cx, cy, rx, ry, seed, wobble, count) {
    var roll = dice(seed || 1), p1 = roll() * TAU, p2 = roll() * TAU, pts = [];
    wobble = wobble === undefined ? 0.02 : wobble;
    count = count || 14;
    for (var i = 0; i < count; i++) {
      var a = -Math.PI / 2 + (i / count) * TAU;
      var f = 1 + wobble * Math.sin(2 * a + p1) + wobble * 0.7 * Math.sin(3 * a + p2);
      pts.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]);
    }
    return pts;
  }

  function oval(cx, cy, rx, ry, seed, wobble, count) { return smooth(ovalPoints(cx, cy, rx, ry, seed, wobble, count), true); }

  // A rounded box whose sides are not quite straight, as if cut with scissors.
  function softBox(x, y, w, h, r, seed, wobble) {
    var roll = dice(seed || 7), pts = [];
    wobble = wobble === undefined ? 1.2 : wobble;
    r = Math.min(r, w / 2, h / 2);
    function jig() { return (roll() - 0.5) * 2 * wobble; }
    function edge(x1, y1, x2, y2) {
      var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1)), parts = Math.max(1, Math.round(len / 110));
      var nx = -(y2 - y1) / (len || 1), ny = (x2 - x1) / (len || 1);
      for (var i = 0; i <= parts; i++) {
        var t = i / parts, j = i === 0 || i === parts ? 0 : jig();
        pts.push([x1 + (x2 - x1) * t + nx * j, y1 + (y2 - y1) * t + ny * j]);
      }
    }
    function corner(cx, cy, from) {
      var a = from + Math.PI / 4;
      pts.push([cx + Math.cos(a) * (r + jig() * 0.4), cy + Math.sin(a) * (r + jig() * 0.4)]);
    }
    edge(x + r, y, x + w - r, y); corner(x + w - r, y + r, -Math.PI / 2);
    edge(x + w, y + r, x + w, y + h - r); corner(x + w - r, y + h - r, 0);
    edge(x + w - r, y + h, x + r, y + h); corner(x + r, y + h - r, Math.PI / 2);
    edge(x, y + h - r, x, y + r); corner(x + r, y + r, Math.PI);
    return smooth(pts, true);
  }

  // A shape with straight sides and softly rounded corners.
  function roundedShape(pts, radius) {
    var len = pts.length, d = '';
    for (var i = 0; i < len; i++) {
      var prev = pts[(i - 1 + len) % len], p = pts[i], next = pts[(i + 1) % len];
      var a = toward(p, prev, radius), b = toward(p, next, radius);
      d += (i ? 'L' : 'M') + n(a[0]) + ' ' + n(a[1]) + 'Q' + n(p[0]) + ' ' + n(p[1]) + ' ' + n(b[0]) + ' ' + n(b[1]);
    }
    return d + 'Z';
  }

  function toward(p, q, distance) {
    var dx = q[0] - p[0], dy = q[1] - p[1], len = Math.sqrt(dx * dx + dy * dy) || 1;
    var t = Math.min(0.5, distance / len);
    return [p[0] + dx * t, p[1] + dy * t];
  }

  var SHADOW = 'fill="' + INK + '" fill-opacity="0.15"';

  /* ------------------------------------------------------------------ */
  /* Little signs used in many drawings                                  */
  /* ------------------------------------------------------------------ */

  // Hand-drawn, so a little lopsided. Both fit a 24 x 24 box.
  var HEART = 'M12.1 20.6C6.4 16.4 2.5 12.9 2.5 8.6C2.5 5.5 4.8 3.3 7.5 3.3C9.4 3.3 11 4.3 12 6C13.1 4.2 14.9 3.4 16.7 3.4C19.5 3.4 21.6 5.7 21.6 8.7C21.6 13 17.9 16.3 12.1 20.6Z';

  function starPath() {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 - 0.05 + i * Math.PI / 5, r = i % 2 ? 4.9 : 10.4 - (i === 4 ? 0.5 : 0) + (i === 8 ? 0.3 : 0);
      pts.push([12 + Math.cos(a) * r, 12.4 + Math.sin(a) * r]);
    }
    return roundedShape(pts, 1.5);
  }
  var STAR = starPath();

  // phase (optional) makes it bob: the game does this with CSS instead, the intro video passes a number.
  function heart(x, y, size, turn, fill, phase) {
    var k = size / 10;
    var bob = phase === undefined ? '' : ' transform="translate(0 ' + n(-1.5 - 2.5 * Math.sin(phase)) + ') rotate(' + n(4.5 * Math.sin(phase)) + ')"';
    return '<g transform="translate(' + n(x) + ' ' + n(y) + ') rotate(' + (turn || 0) + ')"><g class="floaty"' + bob + '>' +
      '<g transform="scale(' + n(k) + ') translate(-12 -12)">' + inked(HEART, fill || C.pink, 1.9 / Math.sqrt(k)) +
      '<path d="M6.2 8.6Q6.4 6 8.6 5.8" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="1.7" stroke-linecap="round"/>' +
      '</g></g></g>';
  }

  // A wavy stink line rising from x, y.
  function squiggle(x, y, height, sway, phase) {
    var a = sway || 4.2, pts = [];
    var rise = phase === undefined ? '' : ' transform="translate(0 ' + n(-1.5 - 2.5 * Math.sin(phase)) + ')"';
    for (var i = 0; i <= 12; i++) {
      var t = i / 12;
      pts.push([x + Math.sin(t * Math.PI * 3) * a * (0.55 + 0.45 * t), y - t * height]);
    }
    return '<g class="waft"' + rise + '>' +
      '<path d="' + brushPath(pts, 8.4, 0.75, 0.6) + '" fill="' + INK + '" transform="translate(0.7 1)"/>' +
      '<path d="' + brushPath(pts, 4.6, 0.7, 0.45) + '" fill="' + C.stink + '"/></g>';
  }

  /* ------------------------------------------------------------------ */
  /* Snacks                                                              */
  /* ------------------------------------------------------------------ */

  var SNACK_BOX = 116;
  var THORNS = 9;

  // The overall radius of a snack, in stage pixels.
  function snackRadius(snack) { return 17 + 17 * snack.size; }

  function snackSeed(snack) { return seedFrom(snack.color + '|' + n(snack.size) + '|' + n(snack.spike)); }

  // One made-up garden fruit, centred on 0,0. Smooth ones are plump berries.
  // The spikier a snack is, the longer and sharper its thorns.
  function snackInner(snack) {
    var R = snackRadius(snack), spike = Math.max(0, Math.min(1, snack.spike));
    var color = C.snack[snack.color] || snack.color;
    var dark = mix(color, INK, 0.25), roll = dice(snackSeed(snack));
    var body = R * (1 - 0.15 * spike);
    var w = T.stroke.base;
    var p1 = roll() * TAU, p2 = roll() * TAU;

    function edge(a, r) {
      var y = Math.sin(a) * r * 0.95;
      return [Math.cos(a) * r * 1.05, y > 0 ? y * 0.93 : y]; // wider than tall, and sitting a little flat
    }

    // The body: a berry with a small dip at the top where the stem grows.
    var pts = [], count = 18, i;
    for (i = 0; i < count; i++) {
      var a = -Math.PI / 2 + (i / count) * TAU;
      var fromTop = Math.abs(Math.atan2(Math.sin(a + Math.PI / 2), Math.cos(a + Math.PI / 2)));
      var f = 1 + 0.022 * Math.sin(2 * a + p1) + 0.016 * Math.sin(3 * a + p2) - 0.11 * Math.exp(-(fromTop * fromTop) / 0.2);
      pts.push(edge(a, body * f));
    }
    var bodyPath = smooth(pts, true);

    // The thorns. Drawn as separate shapes, inked first and coloured after, so they join the body without a seam.
    var thornInk = '', thornPaint = '';
    if (spike >= 0.06) {
      var first = -Math.PI / 2 + Math.PI / THORNS;
      for (i = 0; i < THORNS; i++) {
        var ta = first + (i / THORNS) * TAU + (roll() - 0.5) * 0.16;
        var ox = Math.cos(ta), oy = Math.sin(ta), sx = -oy, sy = ox;
        var len = R * 0.56 * spike * (i % 2 ? 0.74 : 1.06) * (0.88 + 0.24 * roll());
        var lean = (roll() - 0.5) * 0.6 * len;
        var hw = R * (0.27 - 0.11 * spike), tip = Math.max(0.9, 2.5 - 2 * spike), bulge = hw * (0.3 - 0.55 * spike);
        var e = edge(ta, body), inX = e[0] - ox * R * 0.14, inY = e[1] - oy * R * 0.14;
        var tx = e[0] + ox * len + sx * lean, ty = e[1] + oy * len + sy * lean;
        var bL = [inX - sx * hw, inY - sy * hw], bR = [inX + sx * hw, inY + sy * hw];
        var tL = [tx - sx * tip - ox * tip * 0.5, ty - sy * tip - oy * tip * 0.5], tR = [tx + sx * tip - ox * tip * 0.5, ty + sy * tip - oy * tip * 0.5];
        var cL = [(bL[0] + tL[0]) / 2 - sx * bulge, (bL[1] + tL[1]) / 2 - sy * bulge];
        var cR = [(bR[0] + tR[0]) / 2 + sx * bulge, (bR[1] + tR[1]) / 2 + sy * bulge];
        var d = 'M' + n(bL[0]) + ' ' + n(bL[1]) + 'Q' + n(cL[0]) + ' ' + n(cL[1]) + ' ' + n(tL[0]) + ' ' + n(tL[1]) +
          'Q' + n(tx + ox * tip * 0.8) + ' ' + n(ty + oy * tip * 0.8) + ' ' + n(tR[0]) + ' ' + n(tR[1]) +
          'Q' + n(cR[0]) + ' ' + n(cR[1]) + ' ' + n(bR[0]) + ' ' + n(bR[1]) + 'Z';
        thornInk += ink(d, w);
        thornPaint += paint(d, ox * 0.6 + oy * 0.8 > 0.35 ? dark : color); // thorns on the lower right are in shade
      }
    }

    // A brushed highlight on the upper left.
    var shine = [];
    for (i = 0; i <= 6; i++) {
      var ha = (196 + i * 10.5) * Math.PI / 180;
      shine.push([Math.cos(ha) * body * 0.67, Math.sin(ha) * body * 0.6]);
    }
    // Spiky snacks have a few thorns pointing out of the picture too.
    var front = '';
    if (spike >= 0.25) {
      [[0.3, -0.22, -0.5], [-0.2, 0.3, 2.4], [0.42, 0.34, 0.9]].forEach(function (f) {
        var fx = f[0] * body, fy = f[1] * body, fl = body * (0.1 + 0.16 * spike), fc = Math.cos(f[2]), fs = Math.sin(f[2]);
        front += paint(roundedShape([[fx - fs * fl * 0.55, fy + fc * fl * 0.55], [fx + fc * fl * 1.5, fy + fs * fl * 1.5], [fx + fs * fl * 0.55, fy - fc * fl * 0.55]], 1), mix(color, INK, 0.36));
      });
    }

    // Stem and leaf, the same on every snack.
    var top = -body * 0.84;
    var stem = flow([[R * 0.02, top + 1], [R * 0.05, top - 5 - R * 0.06], [R * 0.2 + 2, top - 9 - R * 0.12]], 5);
    var lx = -R * 0.04, ly = top - 1.5, ll = 8 + R * 0.34;
    var leaf = smooth([[lx, ly], [lx - ll * 0.34, ly - ll * 0.5], [lx - ll, ly - ll * 0.36], [lx - ll * 0.56, ly + ll * 0.08]], true);

    return '<g class="snack-art">' +
      '<ellipse cx="' + n(R * 0.04) + '" cy="' + n(body * 0.9 + 2) + '" rx="' + n(body * 0.92 + R * 0.2 * spike) + '" ry="' + n(body * 0.24) + '" ' + SHADOW + '/>' +
      thornInk + ink(bodyPath, w) + thornPaint +
      paint(bodyPath, dark) +
      paint(bodyPath, color, ' transform="translate(' + n(-body * 0.075) + ' ' + n(-body * 0.095) + ') scale(0.885)"') +
      front +
      brush(shine, Math.max(2.4, body * 0.17), '#fff', 0.3, 0.55, ' fill-opacity="0.72"') +
      ink(leaf, w * 0.72) + paint(leaf, mix(C.leafDeep, INK, 0.3)) +
      brush(stem, w * 1.25, INK, 0.9, 0.55) +
      '</g>';
  }

  // The secret only the player can see, because only the player can smell:
  // little hearts for yum, stink lines for yuck.
  function markInner(kind, R, phase) {
    var other = phase === undefined ? undefined : phase + Math.PI;
    if (kind === 'yum') {
      return '<g class="mark mark-yum">' +
        heart(R * 0.74 + 13, -R * 0.62 - 9, 9.4, 14, null, phase) +
        heart(R * 0.74 + 25, -R * 0.62 - 28, 6, -12, null, other) +
        '</g>';
    }
    if (kind === 'yuck') {
      var top = -R * 1.04 - 7;
      return '<g class="mark mark-yuck">' +
        squiggle(R * 0.3 + 5, top + 1, 17, 3.6, phase) +
        squiggle(R * 0.86 + 11, top + 6, 21, 4.2, other) +
        '</g>';
    }
    return '';
  }

  function snackBox(inner) {
    var half = SNACK_BOX / 2;
    return svg(inner, SNACK_BOX, SNACK_BOX, -half + ' ' + -half + ' ' + SNACK_BOX + ' ' + SNACK_BOX, 'class="snack-svg"');
  }

  // A snack as a whole picture. mark is 'yum', 'yuck' or nothing.
  function snack(data, mark, phase) {
    return snackBox(snackInner(data) + markInner(mark, snackRadius(data), phase));
  }

  // Only a snack's hearts or stink lines, placed to sit over the same snack.
  function markOnly(data, mark, phase) {
    return snackBox(markInner(mark, snackRadius(data), phase));
  }

  /* ------------------------------------------------------------------ */
  /* Momo                                                                */
  /* ------------------------------------------------------------------ */

  // Momo is drawn in a 200 x 200 box and stands on y = 180.
  var BODY = smooth([
    [104, 46], [131, 53], [155, 75], [170, 105], [175.5, 137], [167, 163], [141, 178],
    [100, 181.5], [57, 178], [31, 163], [24, 136], [31, 103], [48, 74], [75, 53]
  ], true);
  var MOMO_W = 3.4;

  // How far each arm is lifted, in degrees, for each mood. [left, right]
  var ARMS = {
    idle: [0, 0], blink: [0, 0], happy: [38, 38], cheer: [132, 132], yum: [96, 70], yuck: [20, 64],
    think: [0, 84], oops: [52, 52], wow: [104, 104], aah: [74, 74], chew: [30, 30], bleh: [118, 100], sad: [-4, -4]
  };

  function arms(mood) { return ARMS[mood] || ARMS.idle; }

  function eye(cx, cy, rx, ry) {
    return '<ellipse cx="' + n(cx) + '" cy="' + n(cy) + '" rx="' + rx + '" ry="' + ry + '" fill="' + INK + '" transform="rotate(' + (cx < 100 ? -5 : 5) + ' ' + n(cx) + ' ' + n(cy) + ')"/>' +
      '<circle cx="' + n(cx + rx * 0.3) + '" cy="' + n(cy - ry * 0.42) + '" r="' + n(rx * 0.34) + '" fill="#fff"/>';
  }

  // Happy eyes: two little hills.
  function hill(cx, cy, w, h) { return brush(bend([cx - w, cy + h * 0.5], [cx, cy - h * 1.5], [cx + w, cy + h * 0.5], 8), 5.6, INK, 0.5, 0.5); }

  function openMouth(cx, cy, w, h) {
    var d = smooth([[cx - w, cy - h * 0.06], [cx - w * 0.5, cy + h * 0.04], [cx + w * 0.5, cy + h * 0.04], [cx + w, cy - h * 0.06],
      [cx + w * 0.86, cy + h * 0.66], [cx + w * 0.3, cy + h], [cx - w * 0.3, cy + h], [cx - w * 0.86, cy + h * 0.66]], true);
    var tongue = oval(cx + w * 0.05, cy + h * 0.76, w * 0.5, h * 0.23, 5, 0.04, 10);
    var outline = ' stroke="' + INK + '" stroke-width="3.6" stroke-linejoin="round"';
    return '<path d="' + d + '" fill="' + INK + '"' + outline + '/>' + paint(tongue, C.pink) + '<path d="' + d + '" fill="none"' + outline + '/>';
  }

  function cheeks(dx) {
    function hatch(x, y) {
      var d = '';
      for (var i = 0; i < 3; i++) d += 'M' + n(x - 7 + i * 6.5) + ' ' + n(y + 4.5) + 'l3.6 -8.4';
      return '<path d="' + d + '" fill="none" stroke="' + C.pink + '" stroke-width="3.1" stroke-linecap="round"/>';
    }
    return hatch(51 - (dx || 0), 131) + hatch(151 + (dx || 0), 131);
  }

  // The faces Momo can make.
  function face(mood, look) {
    var lx = look ? look[0] : 0, ly = look ? look[1] : 0;
    var L = 71, R = 132, Y = 110;
    var smile = brush(bend([90, 128], [100, 140], [113, 127], 8), 5.2, INK, 0.45, 0.45);
    var wavy = function (y, width) { return brush(flow([[87, y + 1], [93, y - 3], [100, y + 1.5], [107, y - 3], [114, y + 1]], 4), width || 4.8, INK, 0.5, 0.5); };
    var brow = function (x1, y1, x2, y2, arch) { return brush(bend([x1, y1], [(x1 + x2) / 2, (y1 + y2) / 2 - (arch || 2.8)], [x2, y2], 6), 4.4, INK, 0.5, 0.5); };
    var squeeze = brush([[62, 103], [82, 111], [63, 119]], 5.4, INK, 0.5, 0.5) + brush([[141, 103], [121, 111], [140, 119]], 5.4, INK, 0.5, 0.5);
    var tongueOut = function (x, y, w, h, turn) {
      var d = 'M' + n(x - w) + ' ' + n(y) + 'V' + n(y + h - w) + 'Q' + n(x - w) + ' ' + n(y + h) + ' ' + n(x) + ' ' + n(y + h) + 'Q' + n(x + w) + ' ' + n(y + h) + ' ' + n(x + w) + ' ' + n(y + h - w) + 'V' + n(y) + 'Z';
      return '<g transform="rotate(' + (turn || 0) + ' ' + n(x) + ' ' + n(y) + ')">' + inked(d, C.pink, 2.2) +
        '<path d="M' + n(x) + ' ' + n(y + 2) + 'V' + n(y + h * 0.55) + '" stroke="' + C.pinkDeep + '" stroke-width="1.8" stroke-linecap="round"/></g>';
    };
    switch (mood) {
      case 'happy':
        return cheeks() + hill(L, Y + 2, 10, 5) + hill(R, Y + 2, 10, 5) + openMouth(101, 125, 13, 17);
      case 'cheer':
        return cheeks() + hill(L, Y + 1, 11, 6) + hill(R, Y + 1, 11, 6) + openMouth(101, 122, 17, 25);
      case 'yum':
        return cheeks() + hill(L, Y + 2, 10, 5) + hill(R, Y + 2, 10, 5) + smile + tongueOut(112, 130, 5.6, 12, -28) +
          '<g transform="translate(151 84) rotate(14) scale(0.95) translate(-12 -12)">' + inked(HEART, C.pink, 2) + '</g>';
      case 'yuck':
        return cheeks() + squeeze + wavy(133) + tongueOut(101, 135, 6.4, 17, 0);
      case 'bleh':
        return squeeze + brow(60, 95, 82, 99) + brow(142, 95, 120, 99) + openMouth(101, 124, 15, 17) + tongueOut(101, 132, 8.5, 26, 4) +
          '<path d="M44 132q5 -4 10 0t10 0M138 132q5 -4 10 0t10 0" fill="none" stroke="' + C.stink + '" stroke-width="3.1" stroke-linecap="round"/>';
      case 'think':
        return cheeks() + eye(L + (look ? lx : 5), Y + (look ? ly : -5), 7.6, 9.8) + eye(R + (look ? lx : 5), Y + (look ? ly : -5), 7.6, 9.8) +
          brow(59, 94, 81, 93, 8) + brow(121, 86, 145, 85, 12) + paint(oval(106, 134, 5, 5.6, 3, 0.04, 9), INK);
      case 'oops':
        return cheeks() + eye(L, Y + 2, 7.6, 9.6) + eye(R, Y + 2, 7.6, 9.6) + brow(58, 99, 80, 93) + brow(124, 93, 146, 99) + wavy(134) +
          '<g transform="translate(160 82)">' + inked('M0 -11C5 -3 8 1 8 5A8 8 0 0 1 -8 5C-8 1 -5 -3 0 -11Z', '#A9DCFF', 2) + '</g>';
      case 'sad':
        return cheeks() + eye(L + lx, Y + 4 + ly, 7.4, 9) + eye(R + lx, Y + 4 + ly, 7.4, 9) + brow(58, 100, 80, 95) + brow(124, 95, 146, 100) +
          brush(bend([92, 136], [101, 128], [111, 136], 8), 4.8, INK, 0.5, 0.5);
      case 'wow':
        return cheeks() + eye(L, Y - 1, 9, 11.6) + eye(R, Y - 1, 9, 11.6) + paint(oval(101, 135, 6.6, 8.4, 3, 0.03, 10), INK);
      case 'aah':
        return cheeks(4) + eye(L - 2 + lx, Y - 6 + ly, 7.6, 9.8) + eye(R + 2 + lx, Y - 6 + ly, 7.6, 9.8) + openMouth(101, 120, 24, 36);
      case 'chew':
        return cheeks(5) + hill(L - 2, Y, 10, 5) + hill(R + 2, Y, 10, 5) + wavy(131, 5.4) +
          '<path d="M38 118q-5 8 -2 17M164 118q5 8 2 17" fill="none" stroke="' + INK + '" stroke-width="2.6" stroke-linecap="round" stroke-opacity="0.55"/>';
      case 'blink':
        return cheeks() + brush(bend([L - 9, Y + 1], [L, Y + 7], [L + 9, Y + 1], 6), 4.8, INK, 0.5, 0.5) + brush(bend([R - 9, Y + 1], [R, Y + 7], [R + 9, Y + 1], 6), 4.8, INK, 0.5, 0.5) + smile;
      default:
        return cheeks() + '<g class="momo-eyes">' + eye(L + lx, Y + ly, 7.6, 9.8) + eye(R + lx, Y + ly, 7.6, 9.8) + '</g>' + smile;
    }
  }

  // The sprout on Momo's head. It grows as Momo learns:
  // 0 a bud, 1 one leaf, 2 two leaves, 3 a flower.
  function sprout(grow, sway) {
    grow = grow === undefined ? 2 : grow;
    var tall = grow === 3 ? 12 : grow === 0 ? -9 : 0;
    var tip = [104.5, 29 - tall];
    var stem = brush(flow([[102.5, 51], [101, 41 - tall * 0.4], tip], 5), 5.2, INK, 0.9, 0.7);
    function leaf(sign, size, y) {
      var bx = 103 + sign * 0.5, by = 32 - tall * 0.5 + (y || 0);
      var pts = [[bx, by], [bx + sign * 8 * size, by - 12 * size], [bx + sign * 21 * size, by - 17 * size], [bx + sign * 30 * size, by - 14.5 * size],
        [bx + sign * 23 * size, by - 5 * size], [bx + sign * 11 * size, by + 0.5 * size]];
      var d = smooth(pts, true);
      return ink(d, 2.9) + paint(d, C.leaf) +
        brush(bend([bx + sign * 3, by - 3 * size], [bx + sign * 14 * size, by - 9 * size], [bx + sign * 25 * size, by - 13.5 * size], 6), 2.1, C.leafDeep, 0.6, 0.3);
    }
    var leaves = '';
    if (grow === 0) leaves = leaf(1, 0.5, 9);
    if (grow >= 1) leaves += leaf(1, 1, grow === 3 ? 12 : 0);
    if (grow >= 2) leaves += leaf(-1, 0.78, grow === 3 ? 14 : 2);
    var flower = '';
    if (grow === 3) {
      for (var i = 0; i < 5; i++) {
        var a = -Math.PI / 2 + i * TAU / 5 + 0.2, px = tip[0] + Math.cos(a) * 9.5, py = tip[1] - 3 + Math.sin(a) * 9.5;
        flower += ink(oval(px, py, 7.2, 7.2, 11 + i, 0.05, 9), 2.6);
      }
      for (i = 0; i < 5; i++) {
        a = -Math.PI / 2 + i * TAU / 5 + 0.2; px = tip[0] + Math.cos(a) * 9.5; py = tip[1] - 3 + Math.sin(a) * 9.5;
        flower += paint(oval(px, py, 7.2, 7.2, 11 + i, 0.05, 9), C.pink);
      }
      flower += paint(oval(tip[0], tip[1] - 3, 5.6, 5.6, 4, 0.04, 9), C.gold) +
        '<circle cx="' + n(tip[0] - 1.6) + '" cy="' + n(tip[1] - 4.8) + '" r="1.5" fill="#fff" fill-opacity="0.7"/>';
    }
    return '<g class="momo-sprout" data-grow="' + grow + '"><g transform="translate(102.5 51) rotate(' + n(sway || 0) + ') scale(1.16) translate(-102.5 -51)">' + stem + leaves + flower + '</g></g>';
  }

  // Momo inside a 200 x 200 box. Momo stands on y = 180.
  // options: look [x, y] moves the eyes, shadow false hides the ground shadow,
  // grow 0 to 3 is how much the sprout has grown. The intro video also poses
  // Momo by hand: arms [left, right] in degrees, sway tilts the sprout.
  function momoInner(mood, options) {
    options = options || {};
    mood = mood || 'idle';
    var lift = options.arms || arms(mood);
    var shadow = options.shadow === false ? '' : '<ellipse class="momo-shadow" cx="101" cy="186" rx="68" ry="9.5" ' + SHADOW + '/>';
    var foot = function (cx) { var d = oval(cx, 181, 17, 8.5, cx, 0.03, 10); return ink(d, MOMO_W) + paint(d, C.shade); };
    var arm = function (side, degrees) {
      var px = side < 0 ? 26 : 174, py = 133, cx = px - side * 1, cy = py + 11.5, d = oval(cx, cy, 10, 16, 20 + side, 0.03, 10);
      return '<g class="momo-arm momo-arm-' + (side < 0 ? 'left' : 'right') + '" style="transform-origin:' + px + 'px ' + py + 'px;transform:rotate(' + n(-side * degrees) + 'deg)">' +
        '<g transform="rotate(' + (side < 0 ? 14 : -14) + ' ' + px + ' ' + py + ')">' + ink(d, MOMO_W) + paint(d, side < 0 ? C.white : C.shade) + '</g></g>';
    };
    var hatch = brush(bend([150, 160], [160, 150], [164, 136], 6), 3, mix(C.shade, INK, 0.12), 0.3, 0.3) +
      brush(bend([137, 168], [148, 162], [155, 152], 6), 2.6, mix(C.shade, INK, 0.12), 0.3, 0.3);
    return shadow +
      '<g class="momo-body">' +
        foot(71) + foot(131) + arm(-1, lift[0]) + arm(1, lift[1]) +
        sprout(options.grow, options.sway) +
        ink(BODY, MOMO_W) + paint(BODY, C.shade) +
        paint(BODY, C.white, ' transform="translate(100 115) scale(0.925) translate(-103.5 -120.5)"') +
        hatch +
        '<g class="momo-face">' + face(mood, options.look) + '</g>' +
      '</g>';
  }

  function momo(mood, size, options) {
    return svg(momoInner(mood, options), size, size, '0 0 200 200', 'class="momo-svg" data-mood="' + (mood || 'idle') + '"');
  }

  /* ------------------------------------------------------------------ */
  /* Things on the picnic blanket                                        */
  /* ------------------------------------------------------------------ */

  // A paper plate with a fluted rim, seen from a little above.
  // kind 'yum' or 'yuck' prints a coloured ring on it.
  function plate(w, h, kind) {
    var cx = w / 2, cy = h / 2 - 6, rx = w / 2 - 9, ry = h / 2 - 16;
    var accent = kind === 'yuck' ? C.stink : kind === 'yum' ? C.pink : C.shade;
    var flutes = 46, pts = [], ridges = '', i, a;
    for (i = 0; i < flutes * 2; i++) {
      a = (i / (flutes * 2)) * TAU;
      var f = 1 + (i % 2 ? -0.011 : 0.011);
      pts.push([cx + Math.cos(a) * rx * f, cy + Math.sin(a) * ry * f]);
    }
    var rim = smooth(pts, true);
    for (i = 0; i < flutes; i++) {
      a = ((i + 0.5) / flutes) * TAU;
      ridges += 'M' + n(cx + Math.cos(a) * rx * 0.9) + ' ' + n(cy + Math.sin(a) * ry * 0.9) + 'L' + n(cx + Math.cos(a) * rx * 0.965) + ' ' + n(cy + Math.sin(a) * ry * 0.965);
    }
    var lowerRight = [];
    for (i = 0; i <= 10; i++) { a = (-8 + i * 12.5) * Math.PI / 180; lowerRight.push([cx + Math.cos(a) * rx * 0.655, cy + 1 + Math.sin(a) * ry * 0.64]); }
    return svg(
      '<ellipse cx="' + (cx + 3) + '" cy="' + (cy + 13) + '" rx="' + rx + '" ry="' + ry + '" ' + SHADOW + '/>' +
      ink(rim, 3.5) + paint(rim, C.shade) +
      paint(oval(cx - 1.5, cy - 2, rx * 0.972, ry * 0.955, 3, 0.002, 28), C.white) +
      '<path d="' + ridges + '" stroke="' + C.shade + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
      '<path d="' + oval(cx, cy, rx * 0.835, ry * 0.825, 9, 0.004, 28) + '" fill="none" stroke="' + accent + '" stroke-width="5.5"/>' +
      '<path d="' + oval(cx, cy + 1, rx * 0.69, ry * 0.675, 5, 0.004, 28) + '" fill="none" stroke="' + C.shade + '" stroke-width="3"/>' +
      brush(lowerRight, 9, C.shade, 0.15, 0.15),
      w, h, '0 0 ' + w + ' ' + h, 'class="plate-svg"');
  }

  // The little flag that names a plate: 'yum' or 'yuck'.
  function flag(kind, size) {
    size = size || 1;
    var yum = kind === 'yum', fill = yum ? C.pink : C.stink;
    var mx = function (x) { return yum ? x : 182 - x; }; // the Yuck flag flies the other way
    var banner = smooth([[24, 12], [72, 8], [122, 13], [170, 9], [155, 34], [171, 58], [120, 62], [70, 58], [25, 62]].map(function (p) { return [mx(p[0]), p[1]]; }), true);
    var stick = 'M' + mx(21) + ' 5L' + mx(27) + ' 120';
    var font = 'font-family="' + T.font.display.replace(/'/g, '') + '" font-size="33"';
    var white = function (markup) { return markup.replace('class="waft"', '').split(C.stink).join(C.white); };
    var sign = yum
      ? '<g transform="translate(34 24) scale(0.88)">' + inked(HEART, C.white, 1.9) + '</g>'
      : '<g transform="translate(26 47) scale(0.92)">' + white(squiggle(7, 0, 19, 2.6)) + white(squiggle(16, -1, 19, 2.6)) + '</g>';
    return svg(
      '<path d="' + stick + '" stroke="' + INK + '" stroke-width="7.4" stroke-linecap="round" transform="translate(1 1.4)"/>' +
      '<path d="' + stick + '" stroke="' + C.basket + '" stroke-width="4.2" stroke-linecap="round"/>' +
      ink(banner, 3.2) + shaded(banner, fill, mix(fill, INK, 0.2), yum ? 24 : 11, 8, 147, 54, 5) +
      '<text x="' + (yum ? 60 : 56) + '" y="47" ' + font + ' fill="' + INK + '" transform="rotate(' + (yum ? 1.2 : -1.2) + ' 90 40)">' + (yum ? 'Yum!' : 'Yuck!') + '</text>' +
      sign,
      Math.round(182 * size), Math.round(126 * size), '0 0 182 126', 'class="flag-svg flag-' + kind + '"');
  }

  // A lunchbox seen from above, with its lid off.
  function lunchbox(w, h) {
    var x = 7, y = 6, ww = w - 16, hh = h - 22, r = 30, cx = x + ww / 2;
    var outer = softBox(x, y, ww, hh, r, w + h + 3, 0.9), inner = softBox(x + 14, y + 13, ww - 28, hh - 26, r - 11, w * 2 + h, 0.7);
    var handle = 'M' + (cx - 46) + ' ' + (y + 6) + 'Q' + (cx - 46) + ' ' + (y - 15) + ' ' + (cx - 24) + ' ' + (y - 15) + 'H' + (cx + 24) + 'Q' + (cx + 46) + ' ' + (y - 15) + ' ' + (cx + 46) + ' ' + (y + 6);
    function latch(at) {
      var d = softBox(at - 18, y + hh - 10, 36, 20, 7, at, 0.3);
      return ink(d, 2.6) + shaded(d, C.gold, mix(C.gold, INK, 0.22), at - 18, y + hh - 10, 36, 20, 4);
    }
    var rim = [];
    for (var i = 0; i <= 8; i++) rim.push([x + r * 0.7 + (ww * 0.4 * i) / 8, y + 6.5 + Math.sin(i * 1.3) * 0.5]);
    return svg(
      '<path d="' + outer + '" ' + SHADOW + ' transform="translate(4 12)"/>' +
      '<path d="' + handle + '" fill="none" stroke="' + INK + '" stroke-width="12" stroke-linecap="round" transform="translate(1 1.4)"/>' +
      '<path d="' + handle + '" fill="none" stroke="' + C.boxDeep + '" stroke-width="6.4" stroke-linecap="round"/>' +
      ink(outer, 3.5) + shaded(outer, C.box, C.boxDeep, x, y, ww, hh, 6) +
      brush(rim, 3.4, '#fff', 0.3, 0.3, ' fill-opacity="0.55"') +
      ink(inner, 2.4) + shaded(inner, C.white, C.shade, x + 14, y + 13, ww - 28, hh - 26, 5) +
      latch(x + ww * 0.27) + latch(x + ww * 0.73),
      w, h, '0 0 ' + w + ' ' + h, 'class="tray-svg tray-lunchbox"');
  }

  // What the snacks arrive in, seen from above: a basket lined with a napkin,
  // or (kind 'lunchbox') a lunchbox.
  function tray(w, h, kind) {
    if (kind === 'lunchbox') return lunchbox(w, h);
    var x = 7, y = 6, ww = w - 16, hh = h - 22, r = 34;
    var outer = softBox(x, y, ww, hh, r, w + h, 1.1), inner = softBox(x + 17, y + 15, ww - 34, hh - 30, r - 13, w * 3 + h, 0.9);
    // The woven rim: short strokes leaning one way then the other.
    var weave = '', step = 15.5, inset = 8.5, i, count;
    function strands(x1, y1, x2, y2) {
      var len = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
      count = Math.max(1, Math.round(len / step));
      var ux = (x2 - x1) / len, uy = (y2 - y1) / len;
      for (i = 0; i < count; i++) {
        var t = (i + 0.5) / count, px = x1 + (x2 - x1) * t, py = y1 + (y2 - y1) * t, lean = i % 2 ? 1 : -1;
        var ax = ux * 3.4 * lean - uy * 4.6, ay = uy * 3.4 * lean + ux * 4.6;
        weave += 'M' + n(px - ax) + ' ' + n(py - ay) + 'L' + n(px + ax) + ' ' + n(py + ay);
      }
    }
    strands(x + r, y + inset, x + ww - r, y + inset);
    strands(x + ww - inset, y + r, x + ww - inset, y + hh - r);
    strands(x + ww - r, y + hh - inset, x + r, y + hh - inset);
    strands(x + inset, y + hh - r, x + inset, y + r);
    [[x + r, y + r, Math.PI], [x + ww - r, y + r, -Math.PI / 2], [x + ww - r, y + hh - r, 0], [x + r, y + hh - r, Math.PI / 2]].forEach(function (c) {
      for (i = 0; i < 3; i++) {
        var a = c[2] + (i + 0.5) * Math.PI / 6, px = c[0] + Math.cos(a) * (r - inset), py = c[1] + Math.sin(a) * (r - inset), lean = i % 2 ? 1 : -1;
        var ux = -Math.sin(a), uy = Math.cos(a), ax = ux * 3.4 * lean - uy * 4.6, ay = uy * 3.4 * lean + ux * 4.6;
        weave += 'M' + n(px - ax) + ' ' + n(py - ay) + 'L' + n(px + ax) + ' ' + n(py + ay);
      }
    });
    return svg(
      '<path d="' + outer + '" ' + SHADOW + ' transform="translate(4 12)"/>' +
      ink(outer, 3.5) + shaded(outer, C.basket, C.basketDeep, x, y, ww, hh, 5) +
      '<path d="' + weave + '" stroke="' + C.basketDeep + '" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      ink(inner, 2.4) + shaded(inner, C.white, C.shade, x + 17, y + 15, ww - 34, hh - 30, 5) +
      '<path d="' + softBox(x + 27, y + 25, ww - 54, hh - 50, r - 22, 5, 0.6) + '" fill="none" stroke="' + C.shade + '" stroke-width="2.6" stroke-dasharray="7 9" stroke-linecap="round"/>',
      w, h, '0 0 ' + w + ' ' + h, 'class="tray-svg"');
  }

  // A strip of paper with zigzag ends, for Momo's test results.
  function strip(w, h) {
    var x = 8, y = 8, ww = w - 18, hh = h - 24, teeth = Math.max(4, Math.round(hh / 17)), pts = [], i;
    pts.push([x + 6, y]); pts.push([x + ww * 0.33, y - 0.8]); pts.push([x + ww * 0.66, y + 0.7]); pts.push([x + ww - 6, y]);
    for (i = 0; i <= teeth * 2; i++) pts.push([x + ww - (i % 2 ? 9 : 0), y + (hh * i) / (teeth * 2)]);
    pts.push([x + ww * 0.66, y + hh + 0.8]); pts.push([x + ww * 0.33, y + hh - 0.7]);
    for (i = teeth * 2; i >= 0; i--) pts.push([x + (i % 2 ? 9 : 0), y + (hh * i) / (teeth * 2)]);
    var d = roundedShape(pts, 2.5);
    return svg(
      '<path d="' + d + '" ' + SHADOW + ' transform="translate(4 11)"/>' +
      ink(d, 3.3) + shaded(d, C.white, C.shade, x, y, ww, hh, 5) +
      '<path d="M' + (x + 30) + ' ' + (y + hh - 17) + 'H' + (x + ww - 30) + '" stroke="' + C.shade + '" stroke-width="2.6" stroke-dasharray="7 9" stroke-linecap="round"/>',
      w, h, '0 0 ' + w + ' ' + h, 'class="strip-svg"');
  }

  // A friendly little computer. Momo lives inside it.
  function computer(w) {
    var h = Math.round(w * 0.86);
    var box = softBox(22, 14, 256, 188, 34, 3, 1.4), screen = softBox(46, 36, 208, 130, 20, 8, 1);
    var neck = roundedShape([[118, 196], [182, 196], [192, 236], [108, 236]], 4), base = softBox(76, 230, 148, 17, 8.5, 12, 0.5);
    return svg(
      '<ellipse cx="152" cy="247" rx="118" ry="11" ' + SHADOW + '/>' +
      ink(neck, 3.4) + paint(neck, mix(C.shade, INK, 0.16)) +
      ink(base, 3.4) + paint(base, C.shade) +
      ink(box, 3.6) + shaded(box, C.shade, mix(C.shade, INK, 0.14), 22, 14, 256, 188, 8) +
      ink(screen, 2.8) + paint(screen, mix(INK, C.snack.purple, 0.42)) +
      brush(bend([62, 64], [64, 50], [80, 47], 6), 5, '#fff', 0.4, 0.3, ' fill-opacity="0.38"') +
      '<circle cx="240" cy="184" r="5.5" fill="' + INK + '" transform="translate(0.9 1.2)"/><circle cx="240" cy="184" r="4.4" fill="' + C.pink + '"/>' +
      '<path d="M54 184H88" fill="none" stroke="' + INK + '" stroke-width="3.6" stroke-linecap="round" stroke-opacity="0.4"/>',
      w, h, '0 0 300 258', 'class="computer-svg"');
  }

  // A pointing hand for showing where to drag.
  function hand(size) {
    var d = 'M25 58V22Q25 14 32 14Q39 14 39 22V38Q40 33 46 34Q51 35 51 41V44Q56 42 58 48V60Q58 76 42 76H36Q22 76 17 62L11 47Q9 40 15 39Q20 38 25 50Z';
    return svg(
      '<g transform="rotate(-24 32 34)">' + ink(d, 3) + shaded(d, C.white, C.shade, 10, 14, 48, 62, 4.5) +
      '<path d="M39 40V47M51 45V51" stroke="' + INK + '" stroke-width="2.4" stroke-linecap="round" stroke-opacity="0.5"/></g>',
      size, size, '0 0 72 84', 'class="hand-svg"');
  }

  // The tail of Momo's speech bubble, pointing down.
  function tail(size) {
    var d = 'M3 2Q9 17 20 27Q19 14 29 2Z';
    return svg(ink(d, 3.1) + paint(d, C.white) + '<path d="M0 -2H34V3.4H0Z" fill="' + C.white + '"/>', size, size, '0 0 34 34', 'class="tail-svg"');
  }

  // A brushed arrow that curves from left to right.
  function arrow(w, h) {
    var line = bend([6, h * 0.62], [w * 0.5, h * 0.08], [w - 16, h * 0.5], 10);
    return svg(brush(line, 6, INK, 0.35, 0.7) + brush([[w - 30, h * 0.5 - 17], [w - 10, h * 0.5 + 1], [w - 34, h * 0.5 + 14]], 6, INK, 0.5, 0.5),
      w, h, '0 0 ' + w + ' ' + h, 'class="arrow-svg"');
  }

  // A tiny fly, buzzing around something stinky.
  function fly(size) {
    return svg(
      '<g class="fly-wings">' + ink(oval(8.4, 8, 5.2, 3.6, 2, 0.03, 9), 1.3) + paint(oval(8.4, 8, 5.2, 3.6, 2, 0.03, 9), C.white) +
      ink(oval(15.6, 7.4, 5.2, 3.6, 4, 0.03, 9), 1.3) + paint(oval(15.6, 7.4, 5.2, 3.6, 4, 0.03, 9), C.white) + '</g>' +
      paint(oval(12, 13.4, 5, 5.6, 6, 0.03, 9), INK) + '<circle cx="10.4" cy="11.6" r="1.2" fill="#fff"/>',
      size, size, '0 0 24 24', 'class="fly-svg"');
  }

  // A string of paper flags for celebrating.
  function bunting(w, flags) {
    flags = flags || Math.max(5, Math.round(w / 86));
    var colors = [C.pink, C.snack.blue, C.gold, C.snack.green, C.snack.purple, C.snack.tangerine, C.white];
    var sag = 26, cord = [], out = '', i;
    function at(t) { return [8 + (w - 16) * t, 10 + sag * 4 * t * (1 - t)]; }
    for (i = 0; i <= 24; i++) cord.push(at(i / 24));
    for (i = 0; i < flags; i++) {
      var p = at((i + 0.5) / flags), half = Math.min(24, (w - 16) / flags * 0.36), tilt = (0.5 - (i + 0.5) / flags) * -16;
      var d = roundedShape([[-half, -1], [half, -1], [i % 2 ? 2.5 : -2, half * 2.1]], 2.4);
      out += '<g transform="translate(' + n(p[0]) + ' ' + n(p[1]) + ') rotate(' + n(tilt + (i % 2 ? 3 : -3)) + ')">' + ink(d, 2.8) + paint(d, colors[i % colors.length]) + '</g>';
    }
    return svg('<path d="' + smooth(cord, false) + '" fill="none" stroke="' + INK + '" stroke-width="3.2" stroke-linecap="round"/>' + out,
      w, sag + 66, '0 0 ' + w + ' ' + (sag + 66), 'class="bunting-svg"');
  }

  /* ------------------------------------------------------------------ */
  /* Small signs                                                         */
  /* ------------------------------------------------------------------ */

  function icon(name, size, options) {
    options = options || {};
    var color = options.color || INK, body = '';
    var line = function (pts, width) { return brush(pts, width || 3.6, color, 0.55, 0.55); };
    switch (name) {
      case 'heart':
        body = inked(HEART, options.fill || C.pink, 1.7) + '<path d="M6.2 8.6Q6.4 6 8.6 5.8" fill="none" stroke="#fff" stroke-opacity="0.7" stroke-width="1.7" stroke-linecap="round"/>'; break;
      case 'star':
        body = inked(STAR, options.fill || C.gold, 1.7) + '<path d="M8.4 9.4Q9.6 7.4 11.2 6.4" fill="none" stroke="#fff" stroke-opacity="0.75" stroke-width="1.7" stroke-linecap="round"/>'; break;
      case 'star-empty':
        body = '<path d="' + STAR + '" fill="' + INK + '" fill-opacity="0.13" stroke="' + INK + '" stroke-opacity="0.34" stroke-width="1.6" stroke-linejoin="round"/>'; break;
      case 'stink':
        body = '<g transform="translate(0 22)">' + squiggle(7.5, 0, 19, 2.6).replace('class="waft"', '') + squiggle(16.5, -1, 19, 2.6).replace('class="waft"', '') + '</g>'; break;
      case 'check':
        body = line(flow([[4.6, 12.6], [9.6, 17.6], [19.6, 6.4]], 4), 4.2); break;
      case 'cross':
        body = line([[6.4, 6.4], [12, 12.2], [17.6, 17.6]], 4) + line([[17.6, 6.4], [12, 11.8], [6.4, 17.6]], 4); break;
      case 'close':
        body = line([[6, 6], [12, 12.2], [18, 18]], 4) + line([[18, 6], [12, 11.8], [6, 18]], 4); break;
      case 'play':
        body = paint(roundedShape([[7.4, 5], [19.6, 12], [7.4, 19]], 2.2), color); break;
      case 'fast':
        body = paint(roundedShape([[3.6, 6], [12, 12], [3.6, 18]], 1.8), color) + paint(roundedShape([[12.4, 6], [20.8, 12], [12.4, 18]], 1.8), color); break;
      case 'sound-on':
      case 'sound-off':
        body = paint(roundedShape([[3.6, 9.4], [7.8, 9.4], [13, 5.2], [13, 18.8], [7.8, 14.6], [3.6, 14.6]], 1.6), color) +
          (name === 'sound-on'
            ? line(bend([16.4, 9], [18.6, 12], [16.4, 15], 5), 2.8) + line(bend([19, 6.2], [23.4, 12], [19, 17.8], 6), 2.8)
            : line([[16.8, 9.4], [19.4, 12.1], [22, 14.6]], 2.8) + line([[22, 9.4], [19.4, 11.9], [16.8, 14.6]], 2.8));
        break;
      case 'help':
        body = line(flow([[8.2, 8.8], [9.2, 5.4], [12.4, 4.6], [15.6, 6.2], [15.4, 9.4], [12.2, 12], [12, 14.8]], 4), 3.8) + '<circle cx="12" cy="19.2" r="2" fill="' + color + '"/>'; break;
      case 'leaf':
        body = '<g transform="translate(12 12.5) scale(0.5) translate(-119 -29)">' + sprout(1).replace('class="momo-sprout"', '') + '</g>'; break;
      case 'again':
        body = line(flow([[18.6, 8.4], [15, 5.2], [10, 5], [6, 8.4], [5.4, 13.4], [8.6, 17.8], [13.6, 18.6], [17.8, 16]], 4), 3.4) +
          paint(roundedShape([[15.2, 9.6], [20.6, 3.6], [21.2, 11.4]], 1.4), color); break;
    }
    return svg(body, size, size, '0 0 24 24', 'class="icon icon-' + name + '"');
  }

  // How wide each letter of the display font is, as a share of the font size.
  var ADVANCE = {
    A: 0.709, B: 0.644, C: 0.662, D: 0.661, E: 0.614, F: 0.593, G: 0.707, H: 0.672, I: 0.275, J: 0.582, K: 0.645, L: 0.595, M: 0.83,
    N: 0.686, O: 0.706, P: 0.629, Q: 0.709, R: 0.643, S: 0.644, T: 0.675, U: 0.664, V: 0.703, W: 0.93, X: 0.679, Y: 0.7, Z: 0.617,
    a: 0.551, b: 0.569, c: 0.518, d: 0.581, e: 0.526, f: 0.44, g: 0.554, h: 0.547, i: 0.245, j: 0.255, k: 0.596, l: 0.236, m: 0.804,
    n: 0.547, o: 0.558, p: 0.586, q: 0.569, r: 0.482, s: 0.54, t: 0.519, u: 0.548, v: 0.537, w: 0.819, x: 0.558, y: 0.554, z: 0.526,
    '!': 0.432, '?': 0.522, '.': 0.297, ',': 0.297, "'": 0.27, '-': 0.522, ' ': 0.3
  };
  // How each letter in turn is tilted (degrees) and nudged up or down.
  var BOUNCE = [[-3, 2], [3.5, -5], [-2.5, 3], [4, -3], [-3.5, 1], [2.5, -4]];

  // Big hand-lettered words: fat white letters with a brush-pen outline, each
  // one tilted a little differently. Returns the drawing and its size.
  // options: id (needed when two are on one page), bite (which letter has a
  // bite taken out), pop (a function giving each letter's size from 0 to 1).
  function lettering(text, size, options) {
    options = options || {};
    var id = 'momo-' + (options.id || 'word'), k = size / 186, weight = 8.4 * k, gap = 3 * k;
    var font = 'font-family="' + T.font.display.replace(/'/g, '') + '"';
    var x = 10 * k, y = 164 * k, inkLayer = '', paintLayer = '', masks = '';
    text.split('').forEach(function (ch, i) {
      var w = (ADVANCE[ch] || 0.6) * size;
      if (ch === ' ') { x += w + gap; return; }
      var b = BOUNCE[i % BOUNCE.length], grown = options.pop ? options.pop(i) : 1, bite = options.bite === i;
      var where = 'transform="translate(' + n(x + w / 2) + ' ' + n(y + b[1] * k) + ') rotate(' + b[0] + ')' + (grown === 1 ? '' : ' translate(0 ' + n(-size * 0.3) + ') scale(' + n(grown) + ') translate(0 ' + n(size * 0.3) + ')') + '"';
      var letter = '<text x="' + n(-w / 2) + '" y="0" font-size="' + size + '" ' + font;
      inkLayer += '<g ' + where + (bite ? ' mask="url(#' + id + '-bite-ink)"' : '') + '><g transform="translate(' + n(weight * 0.34) + ' ' + n(weight * 0.5) + ')">' +
        letter + ' fill="' + INK + '" stroke="' + INK + '" stroke-width="' + n(weight * 2) + '" stroke-linejoin="round">' + ch + '</text></g></g>';
      paintLayer += '<g ' + where + (bite ? ' mask="url(#' + id + '-bite)"' : '') + '><clipPath id="' + id + '-' + i + '">' + letter + '>' + ch + '</text></clipPath>' +
        '<g clip-path="url(#' + id + '-' + i + ')">' + letter + ' fill="' + C.shade + '">' + ch + '</text>' +
        '<g transform="translate(' + n(-4.5 * k) + ' ' + n(-6.5 * k) + ')">' + letter + ' fill="' + C.white + '">' + ch + '</text></g></g></g>';
      x += w + gap;
    });
    if (options.bite !== undefined) {
      // The bite: three overlapping nibbles on the upper right of the letter.
      var holes = function (shrink) {
        return [[20, -103, 20], [42, -88, 23], [55, -65, 20]].map(function (c) {
          return '<circle cx="' + n(c[0] * k) + '" cy="' + n(c[1] * k) + '" r="' + n(c[2] * k - shrink) + '" fill="#000"/>';
        }).join('');
      };
      var area = 'maskUnits="userSpaceOnUse" x="' + n(-120 * k) + '" y="' + n(-220 * k) + '" width="' + n(300 * k) + '" height="' + n(320 * k) + '"';
      var sheet = '<rect x="' + n(-120 * k) + '" y="' + n(-220 * k) + '" width="' + n(300 * k) + '" height="' + n(320 * k) + '" fill="#fff"/>';
      masks = '<defs><mask id="' + id + '-bite" ' + area + '>' + sheet + holes(0) + '</mask>' +
        '<mask id="' + id + '-bite-ink" ' + area + '>' + sheet + holes(weight * 1.05) + '</mask></defs>';
    }
    return { inner: masks + inkLayer + paintLayer, width: Math.ceil(x + 14 * k), height: Math.ceil(200 * k) };
  }

  // Words on their own, as a picture.
  function words(text, size, options) {
    var made = lettering(text, size, options);
    return svg(made.inner, made.width, made.height, '0 0 ' + made.width + ' ' + made.height, 'class="words-svg"');
  }

  // The game's name. Somebody has taken a bite out of the last letter.
  function logo() {
    var font = 'font-family="' + T.font.display.replace(/'/g, '') + '"';
    var crumb = function (cx, cy, r, seed) {
      var roll = dice(seed), pts = [];
      for (var k = 0; k < 5; k++) { var a = k * TAU / 5 + roll(), rr = r * (0.7 + 0.5 * roll()); pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
      var d = roundedShape(pts, r * 0.35);
      return ink(d, 2.8) + paint(d, C.white);
    };
    var sub = '<text x="14" y="252" font-size="69" ' + font + ' fill="' + INK + '" transform="rotate(-1.6 14 252)" dy="0 2 -3 1 2 -2 0 0 -3 2 0 1 -3 2 1">Learns to Munch</text>';
    return svg(lettering('Momo', 186, { id: 'logo', bite: 3 }).inner +
      crumb(551, 50, 8, 3) + crumb(576, 72, 5, 5) + crumb(569, 27, 4.4, 8) + sub,
      640, 276, '0 0 640 276', 'class="logo-svg"');
  }

  /* ------------------------------------------------------------------ */
  /* The ground                                                          */
  /* ------------------------------------------------------------------ */

  // The picnic blanket, as CSS. cell is the width of one stripe in pixels.
  function cloth(cell) {
    cell = cell || 40;
    var stripe = 'rgba(255, 178, 26, 0.3)', thread = 'rgba(255, 255, 255, 0.12)';
    return {
      backgroundColor: C.clothLight,
      backgroundImage:
        'repeating-linear-gradient(45deg, ' + thread + ' 0, ' + thread + ' 1.5px, transparent 1.5px, transparent 5px), ' +
        'linear-gradient(90deg, ' + stripe + ' 50%, transparent 50%), ' +
        'linear-gradient(' + stripe + ' 50%, transparent 50%)',
      backgroundSize: 'auto, ' + cell * 2 + 'px ' + cell * 2 + 'px, ' + cell * 2 + 'px ' + cell * 2 + 'px'
    };
  }

  // The meadow the blanket lies on, as CSS. scale makes the grass bigger or smaller.
  function meadow(scale) {
    scale = scale || 1;
    var deep = mix(C.meadow, C.leafDeep, 0.5), tile = 260, out = '', roll = dice(42), i;
    function tuft(x, y, s) {
      return '<path d="M' + n(x - 5 * s) + ' ' + n(y) + 'q1 -7 ' + n(-2 * s) + ' ' + n(-11 * s) + 'M' + n(x) + ' ' + n(y) + 'q0 -9 ' + n(1 * s) + ' ' + n(-15 * s) + 'M' + n(x + 5 * s) + ' ' + n(y) + 'q0 -7 ' + n(4 * s) + ' ' + n(-10 * s) +
        '" fill="none" stroke="' + deep + '" stroke-width="' + n(2.6 * s) + '" stroke-linecap="round"/>';
    }
    function daisy(x, y, s) {
      var petals = '';
      for (var k = 0; k < 6; k++) { var a = k * TAU / 6; petals += '<ellipse cx="' + n(x + Math.cos(a) * 5.4 * s) + '" cy="' + n(y + Math.sin(a) * 5.4 * s) + '" rx="' + n(3.6 * s) + '" ry="' + n(3.6 * s) + '" fill="' + C.white + '"/>'; }
      return petals + '<circle cx="' + x + '" cy="' + y + '" r="' + n(3.4 * s) + '" fill="' + C.gold + '"/>';
    }
    for (i = 0; i < 9; i++) out += tuft(20 + roll() * (tile - 40), 24 + roll() * (tile - 40), 0.8 + roll() * 0.5);
    out += daisy(62, 70, 1) + daisy(196, 178, 0.8) + daisy(150, 34, 0.7);
    var image = svg(out, tile, tile, '0 0 ' + tile + ' ' + tile);
    return {
      backgroundColor: C.meadow,
      backgroundImage: 'url("data:image/svg+xml,' + encodeURIComponent(image) + '")',
      backgroundSize: n(tile * scale) + 'px ' + n(tile * scale) + 'px'
    };
  }

  return {
    svg: svg, mix: mix, smooth: smooth, brush: brush, ink: ink, paint: paint, inked: inked, softBox: softBox, oval: oval,
    snack: snack, markOnly: markOnly, snackInner: snackInner, snackRadius: snackRadius, markInner: markInner, SNACK_BOX: SNACK_BOX,
    momo: momo, momoInner: momoInner, face: face, arms: arms, sprout: sprout,
    plate: plate, flag: flag, tray: tray, strip: strip, computer: computer, hand: hand, tail: tail, arrow: arrow, fly: fly, bunting: bunting,
    icon: icon, heart: heart, logo: logo, words: words, lettering: lettering, cloth: cloth, meadow: meadow
  };
});
