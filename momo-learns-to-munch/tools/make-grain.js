/*
 * Makes img/grain.png: a small see-through tile of paper grain that is laid
 * over the whole game (and the intro video) so flat colours look like print
 * on paper instead of a screen.
 *
 *   node tools/make-grain.js
 *
 * It needs nothing installed: the PNG is written by hand below.
 */
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');

var SIZE = 256;

// The same dice every time, so the file never changes unless this script does.
var seed = 20260930;
function roll() {
  seed = (seed + 0x6D2B79F5) >>> 0;
  var t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Soft noise: random values on a coarse grid, blended smoothly, that wrap
// around at the edges so the tile repeats without a seam.
function layer(cells) {
  var grid = [];
  for (var i = 0; i < cells * cells; i++) grid.push(roll());
  return function (x, y) {
    var gx = (x / SIZE) * cells, gy = (y / SIZE) * cells;
    var x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0;
    fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
    function at(cx, cy) { return grid[((cy + cells) % cells) * cells + ((cx + cells) % cells)]; }
    var top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * fx;
    var bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * fx;
    return top + (bottom - top) * fy;
  };
}

var blotch = layer(6), mottle = layer(24), fibre = layer(64);
var raw = Buffer.alloc((SIZE * 4 + 1) * SIZE);
for (var y = 0; y < SIZE; y++) {
  raw[y * (SIZE * 4 + 1)] = 0; // no filter on this row
  for (var x = 0; x < SIZE; x++) {
    // v runs from about -1 (a dark fleck) to 1 (a light fleck).
    var v = (blotch(x, y) - 0.5) * 0.8 + (mottle(x, y) - 0.5) * 1.0 + (fibre(x, y) - 0.5) * 0.9 + (roll() - 0.5) * 0.7;
    var dark = v < 0, strength = Math.min(1, Math.abs(v));
    var at = y * (SIZE * 4 + 1) + 1 + x * 4;
    // Dark flecks are the ink colour, light flecks are white. Both are faint;
    // the dark ones fainter still, so white things stay clean.
    raw[at] = dark ? 59 : 255; raw[at + 1] = dark ? 42 : 255; raw[at + 2] = dark ? 79 : 255;
    raw[at + 3] = Math.round(strength * (dark ? 13 : 36));
  }
}

var crcTable = [];
for (var n = 0; n < 256; n++) {
  var c = n;
  for (var k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
  crcTable[n] = c >>> 0;
}
function crc(buffer) {
  var value = 0xFFFFFFFF;
  for (var i = 0; i < buffer.length; i++) value = crcTable[(value ^ buffer[i]) & 255] ^ (value >>> 8);
  return (value ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  var length = Buffer.alloc(4), name = Buffer.from(type), sum = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  sum.writeUInt32BE(crc(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, sum]);
}

var header = Buffer.alloc(13);
header.writeUInt32BE(SIZE, 0); header.writeUInt32BE(SIZE, 4);
header[8] = 8; header[9] = 6; // 8 bits each of red, green, blue and see-through
var png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk('IHDR', header), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
]);
var out = path.join(__dirname, '..', 'img', 'grain.png');
fs.writeFileSync(out, png);
console.log('Wrote ' + out + ' (' + png.length + ' bytes)');
