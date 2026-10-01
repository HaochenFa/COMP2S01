/*
 * Gets the video's fonts, sounds and paper grain ready.
 *
 *   npm run assets
 *
 * Nothing here is drawn or recorded by hand. The fonts and the paper grain
 * are copied from the game, and every sound is made from the game's own
 * sound recipes (momo-learns-to-munch/js/sound.js), so the video and the
 * game match.
 */
const fs = require('fs');
const path = require('path');

const game = path.join(__dirname, '..', '..', 'momo-learns-to-munch');
const out = path.join(__dirname, '..', 'public');
const Sound = require(path.join(game, 'js', 'sound.js'));
const lines = require(path.join(__dirname, '..', 'src', 'lines.json'));

function writeWav(file, samples) {
  const data = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    const v = Math.max(-1, Math.min(1, samples[i]));
    data.writeInt16LE(Math.round(v * 32767), i * 2);
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + data.length, 4); header.write('WAVE', 8);
  header.write('fmt ', 12); header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(Sound.RATE, 24); header.writeUInt32LE(Sound.RATE * 2, 28); header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34);
  header.write('data', 36); header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, data]));
}

// Momo's chirpy voice saying one line, exactly as the game would chirp it.
function say(text) {
  const pitches = Sound.talkPitches(text), chirpLength = Sound.chirp(0).length;
  const samples = new Float32Array(Math.ceil(Sound.CHIRP_GAP * Sound.RATE * pitches.length) + chirpLength);
  pitches.forEach((pitch, i) => {
    const chirp = Sound.chirp(pitch), start = Math.floor(i * Sound.CHIRP_GAP * Sound.RATE);
    for (let n = 0; n < chirp.length; n++) samples[start + n] += chirp[n] * 0.7;
  });
  return samples;
}

for (const folder of ['audio', 'fonts', 'img']) {
  fs.rmSync(path.join(out, folder), { recursive: true, force: true });
  fs.mkdirSync(path.join(out, folder), { recursive: true });
}

Sound.names.forEach((name) => writeWav(path.join(out, 'audio', name + '.wav'), Sound.render(name)));
Object.keys(lines).forEach((key) => writeWav(path.join(out, 'audio', 'say-' + key + '.wav'), say(lines[key])));
writeWav(path.join(out, 'audio', 'tune.wav'), Sound.tune(42));

fs.readdirSync(path.join(game, 'fonts'))
  .filter((name) => name.endsWith('.woff2'))
  .forEach((name) => fs.copyFileSync(path.join(game, 'fonts', name), path.join(out, 'fonts', name)));
fs.copyFileSync(path.join(game, 'img', 'grain.png'), path.join(out, 'img', 'grain.png'));

console.log('Sounds:', fs.readdirSync(path.join(out, 'audio')).join(', '));
console.log('Fonts: ', fs.readdirSync(path.join(out, 'fonts')).join(', '));
console.log('Images:', fs.readdirSync(path.join(out, 'img')).join(', '));
