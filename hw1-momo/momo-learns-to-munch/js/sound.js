/*
 * Momo Learns to Munch: every sound in the game.
 *
 * The sounds are made from scratch with a little maths, so there are no
 * sound files to load. The intro video uses the same recipes, which keeps
 * the game and the video sounding alike.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MomoSound = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  var RATE = 44100;

  // Note names to pitches. All tunes use one happy five-note scale.
  var NOTE = { C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.0, A4: 440.0, C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880.0, C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98 };

  // Adds one soft, wooden-sounding note into a buffer.
  function note(out, at, freq, length, volume, options) {
    options = options || {};
    var start = Math.floor(at * RATE), count = Math.floor(length * RATE), phase = 0;
    var slideTo = options.slideTo || freq, decay = options.decay || 9, attack = options.attack || 0.004;
    var wobble = options.wobble || 0, bright = options.bright === undefined ? 0.22 : options.bright;
    for (var i = 0; i < count && start + i < out.length; i++) {
      var t = i / RATE, p = i / count;
      var f = freq + (slideTo - freq) * p;
      if (wobble) f *= 1 + wobble * Math.sin(2 * Math.PI * 11 * t);
      phase += (2 * Math.PI * f) / RATE;
      var env = Math.min(1, t / attack) * Math.exp(-t * decay) * Math.min(1, (count - i) / (0.006 * RATE));
      var tone = Math.sin(phase) + bright * Math.exp(-t * 40) * Math.sin(phase * 4) + 0.12 * Math.sin(phase * 2);
      out[start + i] += tone * env * volume;
    }
  }

  function blank(seconds) { return new Float32Array(Math.ceil(seconds * RATE)); }

  var RECIPES = {
    pop: function () { var o = blank(0.12); note(o, 0, 520, 0.1, 0.5, { slideTo: 1040, decay: 26 }); return o; },
    drop: function () { var o = blank(0.2); note(o, 0, 640, 0.16, 0.5, { slideTo: 300, decay: 20 }); return o; },
    click: function () { var o = blank(0.08); note(o, 0, NOTE.A5, 0.07, 0.35, { decay: 45 }); return o; },
    arrive: function () {
      var o = blank(0.5);
      [NOTE.G4, NOTE.C5, NOTE.E5, NOTE.G5].forEach(function (f, i) { note(o, i * 0.06, f, 0.22, 0.32, { decay: 14 }); });
      return o;
    },
    think: function () {
      var o = blank(0.5);
      [NOTE.C5, NOTE.E5, NOTE.G5].forEach(function (f, i) { note(o, i * 0.11, f, 0.16, 0.26, { decay: 16 }); });
      return o;
    },
    munch: function () {
      var o = blank(0.5);
      [0, 0.14, 0.28].forEach(function (at, i) { note(o, at, 210 - i * 14, 0.1, 0.42, { slideTo: 120, decay: 30, bright: 0.4 }); });
      return o;
    },
    yum: function () {
      var o = blank(0.7);
      [NOTE.E5, NOTE.G5, NOTE.C6].forEach(function (f, i) { note(o, i * 0.08, f, 0.36, 0.36, { decay: 9 }); });
      return o;
    },
    yuck: function () {
      var o = blank(0.5);
      note(o, 0, NOTE.G4, 0.16, 0.42, { slideTo: NOTE.E4, decay: 8, wobble: 0.02 });
      note(o, 0.16, NOTE.E4, 0.26, 0.42, { slideTo: NOTE.C4, decay: 7, wobble: 0.03 });
      return o;
    },
    right: function () {
      var o = blank(0.6);
      note(o, 0, NOTE.G5, 0.3, 0.3, { decay: 10 });
      note(o, 0.08, NOTE.E6, 0.45, 0.34, { decay: 8 });
      return o;
    },
    wrong: function () {
      var o = blank(0.45);
      note(o, 0, 233, 0.38, 0.45, { slideTo: 165, decay: 6, bright: 0.05 });
      return o;
    },
    star: function () {
      var o = blank(0.6);
      [NOTE.C6, NOTE.E6, NOTE.G6].forEach(function (f, i) { note(o, i * 0.055, f, 0.34, 0.26, { decay: 10 }); });
      return o;
    },
    win: function () {
      var o = blank(1.6);
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6].forEach(function (f, i) { note(o, i * 0.1, f, 0.3, 0.3, { decay: 9 }); });
      [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.E6].forEach(function (f) { note(o, 0.46, f, 1.0, 0.2, { decay: 3.5 }); });
      return o;
    }
  };

  // One syllable of Momo's chirpy voice. index picks the pitch.
  var VOICE = [NOTE.E5, NOTE.G5, NOTE.A5, NOTE.C6, NOTE.D6];
  function chirp(index) {
    var o = blank(0.09), f = VOICE[index % VOICE.length];
    note(o, 0, f, 0.075, 0.22, { slideTo: f * 1.06, decay: 22, bright: 0.1 });
    return o;
  }

  // A gentle background tune, used by the intro video.
  function tune(seconds) {
    var o = blank(seconds), beat = 0.3;
    var melody = ['C5', 'E5', 'G5', 'E5', 'A5', 'G5', 'E5', 'D5', 'C5', 'E5', 'G5', 'C6', 'A5', 'G5', 'E5', 'G5'];
    var bass = ['C4', 'C4', 'A4', 'A4', 'C4', 'C4', 'G4', 'G4'];
    for (var step = 0; step * beat < seconds; step++) {
      note(o, step * beat, NOTE[melody[step % melody.length]], 0.5, step % 2 ? 0.1 : 0.14, { decay: 7 });
      if (step % 2 === 0) note(o, step * beat, NOTE[bass[(step / 2) % bass.length]] / 2, 0.55, 0.16, { decay: 5, bright: 0.05 });
    }
    // Fade the last second out.
    var fade = Math.min(o.length, RATE);
    for (var i = 0; i < fade; i++) o[o.length - 1 - i] *= i / fade;
    return o;
  }

  function render(name) { return RECIPES[name](); }

  /* ---- Playing sounds in the browser ---- */

  var context = null, cache = {}, muted = false;

  function ready() {
    if (context) { if (context.state === 'suspended') context.resume(); return true; }
    var Ctor = typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext);
    if (!Ctor) return false;
    try { context = new Ctor(); } catch (e) { return false; }
    return true;
  }

  function toBuffer(key, samples) {
    if (!cache[key]) {
      var b = context.createBuffer(1, samples.length, RATE);
      b.getChannelData(0).set(samples);
      cache[key] = b;
    }
    return cache[key];
  }

  function start(buffer, delay, volume) {
    var source = context.createBufferSource(), gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = volume === undefined ? 0.6 : volume; // quiet enough that overlapping sounds never distort
    source.connect(gain); gain.connect(context.destination);
    source.start(context.currentTime + (delay || 0));
  }

  function play(name, delay) {
    if (muted || !RECIPES[name] || !ready()) return;
    start(toBuffer(name, RECIPES[name]()), delay);
  }

  // Momo "talks" in chirps, one per syllable or so. These are the pitches
  // for one line of speech; the same line always sounds the same.
  var CHIRP_GAP = 0.085;
  function talkPitches(text) {
    var count = Math.max(2, Math.min(9, Math.round(String(text).length / 7)));
    var seed = String(text).length, out = [];
    for (var i = 0; i < count; i++) {
      seed = (seed * 7 + 3) % 11;
      out.push(seed);
    }
    return out;
  }

  function talk(text) {
    if (muted || !ready()) return;
    talkPitches(text).forEach(function (pitch, i) {
      start(toBuffer('chirp' + (pitch % VOICE.length), chirp(pitch)), i * CHIRP_GAP, 0.55);
    });
  }

  return {
    RATE: RATE, names: Object.keys(RECIPES), render: render, chirp: chirp, tune: tune, VOICE: VOICE,
    talkPitches: talkPitches, CHIRP_GAP: CHIRP_GAP,
    play: play, talk: talk, unlock: ready,
    mute: function (on) { muted = !!on; },
    isMuted: function () { return muted; }
  };
});
