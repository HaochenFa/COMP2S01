/*
 * Momo Learns to Munch: the game itself.
 *
 * What happens on each level:
 *   1. teach    the player drags example snacks onto the Yum and Yuck plates
 *   2. testing  Momo guesses new snacks one by one, by itself, and eats the
 *               ones it thinks are yum
 *   3. tested   Momo's score is shown; the player moves on or shows more examples
 *
 * Momo's guessing is in brain.js, the levels are in levels.js, the drawings
 * are in art.js and the sounds are in sound.js.
 */
(function () {
  'use strict';

  var T = MomoTokens, A = MomoArt, B = MomoBrain, LEVELS = MomoLevels, S = MomoSound;

  var PASS = 0.75;        // Momo must get three quarters right to finish a level
  var POINTS = 10;        // points for each snack Momo gets right

  // Where things sit on the 1280 x 720 stage.
  var PLATE = { yum: { x: 235, y: 326 }, yuck: { x: 1045, y: 326 }, rx: 206, ry: 104, max: 8 };
  var MOMO = { x: 640, top: 178, size: 236 };
  var MOUTH = { x: 641, y: 338 };
  var SPOT = { x: 640, y: 474 };
  var TRAY = { left: 30, right: 1000, slot: 110, edge: 34, oneRow: 8 };

  var stage = document.getElementById('stage');
  function $(id) { return document.getElementById(id); }

  var game = {
    scale: 1, level: 0, phase: 'idle', snacks: [], picked: null,
    best: LEVELS.map(function () { return 0; }),
    runs: [], later: false, hints: 0, fast: false, token: 0, order: 0, mood: 'idle', capacity: 6, pace: 1
  };

  /* ------------------------------------------------------------------ */
  /* Small helpers                                                       */
  /* ------------------------------------------------------------------ */

  var grass = A.meadow(1);

  function fit() {
    game.scale = Math.min(window.innerWidth / T.stage.width, window.innerHeight / T.stage.height);
    document.documentElement.style.setProperty('--scale', game.scale);
    document.body.style.backgroundSize = A.meadow(game.scale).backgroundSize;
  }

  function wait(ms) { return new Promise(function (done) { setTimeout(done, ms); }); }
  function pause(ms) { return wait(ms * (game.fast ? 0.4 : game.pace)); }

  function show(screen) { stage.dataset.screen = screen; }

  function fillIcons(rootEl) {
    Array.prototype.forEach.call(rootEl.querySelectorAll('[data-icon]'), function (el) {
      el.innerHTML = A.icon(el.dataset.icon, Number(el.dataset.size) || 34);
    });
  }

  function stars(count, size) {
    var out = '';
    for (var i = 0; i < 3; i++) out += A.icon(i < count ? 'star' : 'star-empty', size);
    return out;
  }

  function starsFor(levelIndex) {
    var total = LEVELS[levelIndex].test.length, right = game.best[levelIndex];
    if (right / total < PASS) return 0;
    var missed = total - right;
    return missed === 0 ? 3 : missed === 1 ? 2 : 1;
  }

  function score() {
    return game.best.reduce(function (sum, right) { return sum + right * POINTS; }, 0);
  }

  // A drawing placed at x, y inside a picture made of several drawings.
  function at(html, x, y, extra, className) {
    return '<div' + (className ? ' class="' + className + '"' : '') + ' style="left:' + x + 'px;top:' + y + 'px;' + (extra || '') + '">' + html + '</div>';
  }

  function replay(el, className) {
    el.classList.remove(className);
    void el.offsetWidth;
    el.classList.add(className);
  }

  // Words for what Momo can see.
  function feel(snack) { return snack.spike < 0.2 ? 'smooth' : snack.spike < 0.5 ? 'bumpy' : 'spiky'; }
  function colorName(snack) { return snack.color === 'tangerine' ? 'orange' : snack.color; }
  function describe(snack) { return feel(snack) + ' ' + colorName(snack); }

  /* ------------------------------------------------------------------ */
  /* Momo                                                                */
  /* ------------------------------------------------------------------ */

  // Momo's sprout grows a little for every level it has learned.
  function growth() {
    var passed = LEVELS.filter(function (lv, i) { return starsFor(i) > 0; }).length;
    return Math.min(3, Math.max(passed, game.level));
  }

  function drawMomo() {
    $('momo').innerHTML = A.momo(game.mood, MOMO.size, { grow: growth() });
    game.grown = growth();
  }

  function mood(name, look) {
    game.mood = name;
    var svg = $('momo').querySelector('.momo-svg'), lift = A.arms(name);
    svg.dataset.mood = name;
    svg.querySelector('.momo-face').innerHTML = A.face(name, look);
    svg.querySelector('.momo-arm-left').style.transform = 'rotate(' + lift[0] + 'deg)';
    svg.querySelector('.momo-arm-right').style.transform = 'rotate(' + -lift[1] + 'deg)';
  }

  function bounce(kind) { replay($('momo'), kind); }

  // Momo's eyes follow a point on the stage. No point means look straight ahead.
  function watch(p) {
    var eyes = $('momo').querySelector('.momo-eyes');
    if (!eyes) return;
    if (!p) { eyes.style.transform = ''; return; }
    var dx = p.x - MOMO.x, dy = p.y - (MOMO.top + MOMO.size * 0.55), len = Math.hypot(dx, dy) || 1, reach = Math.min(1, len / 150);
    eyes.style.transform = 'translate(' + (dx / len * 7 * reach).toFixed(1) + 'px,' + (dy / len * 4.5 * reach).toFixed(1) + 'px)';
  }

  function glance(p, ms) {
    watch(p);
    clearTimeout(game.glance);
    game.glance = setTimeout(function () { watch(null); }, ms || 800);
  }

  function say(text, options) {
    options = options || {};
    var bubble = $('bubble');
    clearTimeout(game.sayTimer);
    bubble.classList.remove('show');
    void bubble.offsetWidth;
    bubble.classList.toggle('shout', !!options.shout);
    $('bubble-text').textContent = text;
    bubble.classList.add('show');
    if (options.mood) mood(options.mood);
    S.talk(text);
    if (options.hide) game.sayTimer = setTimeout(hush, options.hide);
  }

  function hush() { $('bubble').classList.remove('show'); }

  // While nothing else is happening, Momo blinks and looks around.
  var idleTicks = 0;
  setInterval(function () {
    if (game.mood !== 'idle' || stage.dataset.screen !== 'play' || game.dragging) return;
    idleTicks++;
    if (idleTicks % 3 === 0 && game.phase === 'teach') {
      var list = waiting();
      if (list.length) glance(list[(idleTicks / 3) % list.length], 1100);
      return;
    }
    var faceEl = $('momo').querySelector('.momo-face');
    faceEl.innerHTML = A.face('blink');
    setTimeout(function () { if (game.mood === 'idle') faceEl.innerHTML = A.face('idle'); }, 140);
  }, 2800);

  /* ------------------------------------------------------------------ */
  /* Snacks: where they are and how they move                            */
  /* ------------------------------------------------------------------ */

  function level() { return LEVELS[game.level]; }

  // The basket has one row of snacks, or two rows when it holds a lot of them.
  function traySize() {
    var capacity = game.capacity;
    var rows = capacity > TRAY.oneRow ? 2 : 1, perRow = Math.ceil(capacity / rows);
    var slot = Math.min(TRAY.slot, (TRAY.right - TRAY.left - TRAY.edge * 2) / perRow);
    var width = perRow * slot + TRAY.edge * 2;
    return {
      rows: rows, perRow: perRow, slot: slot, width: width,
      left: (TRAY.left + TRAY.right) / 2 - width / 2,
      top: rows === 1 ? 546 : 486, height: rows === 1 ? 146 : 212,
      rowY: rows === 1 ? [612] : [552, 644]
    };
  }

  function drawTray() {
    var tray = traySize();
    $('tray').style.left = tray.left + 'px';
    $('tray').style.top = tray.top + 'px';
    // Some levels start with a lunchbox; extra snacks always come in the basket.
    $('tray').innerHTML = A.tray(tray.width, tray.height, game.later ? null : level().box);
  }

  // The first empty place in the basket. The basket grows if it is full.
  function freeSlot() {
    var used = waiting().map(function (sn) { return sn.slot; });
    for (var i = 0; i < game.capacity; i++) if (used.indexOf(i) === -1) return i;
    game.capacity++;
    drawTray();
    return game.capacity - 1;
  }

  function onPlate(plate) {
    return game.snacks
      .filter(function (sn) { return sn.where === plate; })
      .sort(function (a, b) { return a.order - b.order; });
  }

  function platePlace(plate, index, count) {
    var top = count <= 4 ? count : Math.ceil(count / 2);
    var row = index < top ? 0 : 1;
    var inRow = row === 0 ? top : count - top;
    var col = row === 0 ? index : index - top;
    var y = PLATE[plate].y + (count <= 4 ? 8 : row === 0 ? -32 : 46);
    return { x: PLATE[plate].x + (col - (inRow - 1) / 2) * 86 + (row ? 10 : 0), y: y + (col % 2 ? 5 : -3) };
  }

  function placeOf(sn) {
    if (sn.where === 'tray') {
      var tray = traySize();
      return { x: tray.left + TRAY.edge + tray.slot * (sn.slot % tray.perRow + 0.5), y: tray.rowY[Math.floor(sn.slot / tray.perRow)] };
    }
    if (sn.where === 'yum' || sn.where === 'yuck') {
      var list = onPlate(sn.where);
      return platePlace(sn.where, list.indexOf(sn), list.length);
    }
    if (sn.where === 'spot') return { x: SPOT.x, y: SPOT.y };
    if (sn.where === 'mouth') return { x: MOUTH.x, y: MOUTH.y };
    if (sn.where === 'aside') return { x: SPOT.x + 150, y: SPOT.y + 8 };
    if (sn.where === 'result') {
      var count = level().test.length, gap = Math.min(108, 880 / count);
      return { x: 515 + (sn.slot - (count - 1) / 2) * gap, y: 614 };
    }
    return { x: SPOT.x, y: 800 }; // waiting below the stage
  }

  function setXY(sn, x, y) {
    sn.x = x; sn.y = y;
    sn.el.style.setProperty('--x', x + 'px');
    sn.el.style.setProperty('--y', y + 'px');
    sn.el.style.zIndex = Math.round(y);
  }

  function settle(sn) { var p = placeOf(sn); setXY(sn, p.x, p.y); sn.el.dataset.where = sn.where; }
  function settleAll() { game.snacks.forEach(settle); }

  function draw(sn) {
    sn.el.innerHTML = A.snack(sn.data, sn.mark) + (sn.badge || '');
    var label = describe(sn.data) + ' snack';
    if (sn.mark) label += sn.mark === 'yum' ? ', smells sweet, yum' : ', stinky, yuck';
    sn.el.setAttribute('aria-label', label);
  }

  function addSnack(data, where, slot, mark) {
    var el = document.createElement('div');
    el.className = 'snack';
    el.setAttribute('role', 'button');
    // Each snack lies at its own small tilt. The tilt comes from the snack, so it never changes.
    var tilt = Math.round((((data.size * 7.3 + data.spike * 3.7) % 1) - 0.5) * 18);
    el.style.setProperty('--tilt', tilt + 'deg');
    var sn = { data: data, el: el, where: where, slot: slot, mark: mark, order: 0 };
    draw(sn);
    $('snacks').appendChild(el);
    game.snacks.push(sn);
    settle(sn);
    bind(sn);
    return sn;
  }

  function removeSnacks(test) {
    game.snacks = game.snacks.filter(function (sn) {
      if (!test(sn)) return true;
      sn.el.remove();
      return false;
    });
  }

  // Snacks can only be moved while the player is teaching.
  function refreshLive() {
    game.snacks.forEach(function (sn) {
      var live = game.phase === 'teach' && (sn.where === 'tray' || sn.where === 'yum' || sn.where === 'yuck');
      sn.el.classList.toggle('live', live);
      if (live) sn.el.setAttribute('tabindex', '0'); else sn.el.removeAttribute('tabindex');
    });
  }

  function examples() {
    return game.snacks
      .filter(function (sn) { return sn.where === 'yum' || sn.where === 'yuck'; })
      .map(function (sn) { return { snack: sn.data, plate: sn.where, ref: sn }; });
  }

  function waiting() {
    return game.snacks.filter(function (sn) { return sn.where === 'tray'; });
  }

  /* ------------------------------------------------------------------ */
  /* Dragging, or tapping a snack and then a plate                       */
  /* ------------------------------------------------------------------ */

  function point(e) {
    var r = stage.getBoundingClientRect();
    return { x: (e.clientX - r.left) / game.scale, y: (e.clientY - r.top) / game.scale };
  }

  function plateAt(p) {
    var found = null;
    ['yum', 'yuck'].forEach(function (plate) {
      var dx = (p.x - PLATE[plate].x) / (PLATE.rx + 16), dy = (p.y - PLATE[plate].y) / (PLATE.ry + 26);
      if (dx * dx + dy * dy <= 1) found = plate;
    });
    return found;
  }

  function overTray(p) { return p.y > traySize().top - 12 && p.x < TRAY.right + 8; }

  function highlight(plate) {
    $('plate-yum').classList.toggle('over', plate === 'yum');
    $('plate-yuck').classList.toggle('over', plate === 'yuck');
  }

  function bind(sn) {
    sn.el.addEventListener('pointerdown', function (e) {
      if (!sn.el.classList.contains('live')) return;
      e.preventDefault();
      S.unlock();
      var start = point(e), moved = false;
      try { sn.el.setPointerCapture(e.pointerId); } catch (err) { /* older browsers */ }

      function onMove(ev) {
        var p = point(ev);
        if (!moved && Math.hypot(p.x - start.x, p.y - start.y) > 8) {
          moved = true;
          game.dragging = true;
          sn.el.classList.add('drag');
          unpick();
          S.play('pop');
        }
        if (moved) { setXY(sn, p.x, p.y - 8); highlight(plateAt(p)); clearTimeout(game.glance); watch(p); }
      }
      function onUp(ev) {
        sn.el.removeEventListener('pointermove', onMove);
        sn.el.removeEventListener('pointerup', onUp);
        sn.el.removeEventListener('pointercancel', onUp);
        sn.el.classList.remove('drag');
        game.dragging = false;
        highlight(null);
        if (!moved) return tap(sn);
        var p = point(ev), plate = plateAt(p);
        if (plate) put(sn, plate);
        else if (overTray(p)) put(sn, 'tray');
        else { settle(sn); watch(null); }
      }
      sn.el.addEventListener('pointermove', onMove);
      sn.el.addEventListener('pointerup', onUp);
      sn.el.addEventListener('pointercancel', onUp);
    });
    sn.el.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      if (sn.el.classList.contains('live')) tap(sn);
    });
  }

  function tap(sn) {
    S.play('click');
    if (game.picked === sn) return unpick();
    unpick();
    game.picked = sn;
    sn.el.classList.add('picked');
    $('plate-yum').classList.add('target');
    $('plate-yuck').classList.add('target');
    glance(sn, 1200);
  }

  function unpick() {
    if (game.picked) game.picked.el.classList.remove('picked');
    game.picked = null;
    $('plate-yum').classList.remove('target');
    $('plate-yuck').classList.remove('target');
  }

  function put(sn, where) {
    if (where !== 'tray' && sn.where !== where && onPlate(where).length >= PLATE.max) {
      say('That plate is full!', { hide: 2200 });
      settle(sn);
      watch(null);
      return;
    }
    var changed = sn.where !== where;
    if (changed && where === 'tray') sn.slot = freeSlot();
    sn.where = where;
    sn.order = ++game.order;
    sn.el.classList.remove('glow', 'wiggle', 'arrive');
    unpick();
    settleAll();
    if (!changed) { watch(null); return; }
    S.play('drop');
    replay(sn.el, 'land');
    if (where === 'tray') watch(null);
    else {
      // Momo leans over to look at the example it is learning from.
      glance(sn, 900);
      if (game.mood === 'idle') bounce(where === 'yum' ? 'lean-left' : 'lean-right');
    }
    teachChanged();
  }

  function readyToTest() {
    return onPlate('yum').length > 0 && onPlate('yuck').length > 0;
  }

  function teachChanged() {
    var button = $('btn-test');
    if (button) {
      button.setAttribute('aria-disabled', readyToTest() ? 'false' : 'true');
      button.classList.toggle('ready', readyToTest());
    }
    guide();
  }

  /* ------------------------------------------------------------------ */
  /* The pointing hand that teaches the very first moves                 */
  /* ------------------------------------------------------------------ */

  function pointHand(from, to) {
    var hand = $('hand');
    if (game.handMove) game.handMove.cancel();
    hand.classList.add('show');
    var a = 'translate(' + from.x + 'px,' + from.y + 'px)', b = 'translate(' + to.x + 'px,' + to.y + 'px)';
    game.handMove = hand.animate(
      [{ transform: a, offset: 0 }, { transform: a, offset: 0.15 }, { transform: b, offset: 0.7 }, { transform: b, offset: 1 }],
      { duration: from === to ? 1 : 1900, iterations: Infinity, easing: 'ease-in-out', fill: 'both' });
  }

  function hideHand() {
    $('hand').classList.remove('show');
    if (game.handMove) { game.handMove.cancel(); game.handMove = null; }
  }

  // Only on level 1, and only until Momo has been tested once.
  function guide() {
    if (game.level !== 0 || game.runs.length || game.phase !== 'teach' || !game.guideReady) return hideHand();
    var yums = onPlate('yum').length, yucks = onPlate('yuck').length, step;
    if (!yums) step = 'yum'; else if (!yucks) step = 'yuck'; else step = 'test';
    if (step === game.guideStep) return;
    game.guideStep = step;
    if (step === 'test') {
      pointHand({ x: 1196, y: 668 }, { x: 1196, y: 654 });
      say('Show me more if you like. Then press Test Momo!', { mood: 'happy' });
      setTimeout(function () { if (game.mood === 'happy' && game.phase === 'teach') mood('idle'); }, 1600);
      return;
    }
    var pick = waiting().filter(function (sn) { return B.truth(sn.data) === step; })[0];
    if (!pick) return hideHand();
    pointHand({ x: pick.x, y: pick.y }, { x: PLATE[step].x, y: PLATE[step].y });
    say(step === 'yum' ? 'Drag a snack with hearts onto my Yum plate.' : 'Now drag a stinky one onto my Yuck plate.');
  }

  /* ------------------------------------------------------------------ */
  /* Buttons at the bottom right                                         */
  /* ------------------------------------------------------------------ */

  function setActions(buttons) {
    var box = $('actions');
    box.innerHTML = '';
    buttons.forEach(function (b) {
      var el = document.createElement('button');
      el.className = 'btn' + (b.primary ? ' btn-primary' : '') + (b.className ? ' ' + b.className : '');
      if (b.id) el.id = b.id;
      el.innerHTML = (b.icon ? '<span class="btn-icon">' + A.icon(b.icon, 26) + '</span>' : '') + b.label;
      el.addEventListener('click', function () { S.unlock(); S.play('click'); b.action(el); });
      box.appendChild(el);
    });
  }

  function teachActions() {
    setActions([{ label: 'Test Momo!', primary: true, id: 'btn-test', className: 'btn-test', action: runTest }]);
    teachChanged();
  }

  /* ------------------------------------------------------------------ */
  /* Starting a level                                                    */
  /* ------------------------------------------------------------------ */

  function updateHud() {
    $('hud-number').textContent = game.level + 1;
    $('hud-name').textContent = level().name;
    $('hud-stars').innerHTML = stars(starsFor(game.level), 34);
    $('hud-stars').setAttribute('aria-label', starsFor(game.level) + ' of 3 stars');
    $('hud-score').textContent = score();
  }

  function startLevel(index) {
    var token = ++game.token;
    game.level = index;
    game.phase = 'intro';
    game.runs = []; game.later = false; game.hints = 0; game.fast = false; game.guideStep = null; game.guideReady = false;
    game.mood = 'idle';
    removeSnacks(function () { return true; });
    unpick(); hideHand(); hush(); clearLines();
    $('veil').classList.remove('show');
    stage.dataset.phase = 'teach';
    show('play');
    updateHud();
    drawMomo();
    setActions([]);

    game.capacity = level().tray.length;
    drawTray();

    $('banner').innerHTML = '<div class="banner-inner"><div class="banner-level">Level ' + (index + 1) +
      '</div><div class="banner-name">' + level().name + '</div></div>';
    $('banner').classList.add('show');
    S.play('arrive');

    return wait(1500).then(function () {
      if (token !== game.token) return;
      $('banner').classList.remove('show');
      level().tray.forEach(function (data, slot) {
        var sn = addSnack(data, 'tray', slot, B.truth(data));
        sn.el.classList.add('arrive');
        sn.el.firstChild.style.animationDelay = 40 + slot * 70 + (slot % 2) * 30 + 'ms';
      });
      game.phase = 'teach';
      refreshLive();
      teachActions();
      say(level().hello, { mood: 'happy' });
      bounce('hop');
      // On the first level, a pointing hand shows the first moves.
      if (game.level === 0) wait(2800).then(function () { if (token === game.token) { game.guideReady = true; guide(); } });
      setTimeout(function () { if (token === game.token && game.mood === 'happy') mood('idle'); }, 1800);
    });
  }

  /* ------------------------------------------------------------------ */
  /* Testing Momo                                                        */
  /* ------------------------------------------------------------------ */

  var NS = 'http://www.w3.org/2000/svg';

  function clearLines() { $('lines').innerHTML = ''; }

  function lineBetween(from, to, className, delay) {
    var dx = to.x - from.x, dy = to.y - from.y, len = Math.hypot(dx, dy) || 1;
    var ux = dx / len, uy = dy / len, el = document.createElementNS(NS, 'line');
    el.setAttribute('x1', from.x + ux * 52); el.setAttribute('y1', from.y + uy * 52);
    el.setAttribute('x2', to.x - ux * 50); el.setAttribute('y2', to.y - uy * 50);
    el.setAttribute('class', className);
    if (delay) el.style.animationDelay = delay + 'ms';
    $('lines').appendChild(el);
  }

  // A loop drawn around one snack, a little wobbly, as if circled with a crayon.
  function loopAround(p) {
    var pts = [], r = 46;
    for (var i = 0; i <= 26; i++) {
      var a = -2.2 + (i / 24) * Math.PI * 2, wobble = 1 + 0.05 * Math.sin(a * 2 + 1) + 0.0035 * i;
      pts.push([p.x + Math.cos(a) * r * wobble, p.y + Math.sin(a) * r * 0.92 * wobble]);
    }
    var el = document.createElementNS(NS, 'path');
    el.setAttribute('d', A.smooth(pts, false));
    el.setAttribute('class', 'loop');
    $('lines').appendChild(el);
  }

  // Why Momo guessed what it guessed: what the new snack shares with the
  // example that looks most like it.
  function reason(snack, example) {
    var manyColors = examples().some(function (ex) { return ex.snack.color !== snack.color; });
    var same = [];
    if (manyColors && snack.color === example.color) same.push(colorName(snack));
    if (feel(snack) === feel(example)) same.push(feel(snack));
    return same.length ? 'It is ' + same.join(' and ') + ', like this one…' : 'It looks most like this one…';
  }

  function runTest() {
    if (game.phase !== 'teach') return;
    if (!readyToTest()) {
      say('Put at least one snack on each plate first.', { mood: 'idle', hide: 2600 });
      bounce('shake');
      return;
    }
    var token = ++game.token, shown = examples(), tests = level().test;
    var results = B.test(tests, shown), firstRun = game.runs.length === 0;
    var firstMiss = -1;
    results.forEach(function (r, i) { if (!r.correct && firstMiss < 0) firstMiss = i; });

    game.phase = 'testing';
    game.fast = game.runs.length > 0;
    stage.dataset.phase = 'testing';
    unpick(); hideHand(); refreshLive(); watch(null);
    game.snacks.forEach(function (sn) { sn.el.classList.remove('glow', 'wiggle', 'arrive', 'land'); });
    $('results-note').textContent = 'Momo is guessing…';
    setActions(game.fast ? [] : [{ label: 'Faster', icon: 'fast', action: function () { game.fast = true; setActions([]); } }]);
    say('My turn! Let me guess these by myself.', { mood: 'happy' });

    var chain = pause(firstRun && game.level === 0 ? 1900 : 1300);
    results.forEach(function (result, i) {
      // Momo says why on its very first guess of a level, and the first time it gets one wrong.
      var explain = (firstRun && i === 0) || i === firstMiss;
      chain = chain.then(function () { return token === game.token ? guessOne(result, i, explain, token) : null; });
    });
    chain.then(function () { if (token === game.token) afterTest(results); });
  }

  function guessOne(result, index, explain, token) {
    var sn = addSnack(result.snack, 'wait', index, null);
    game.pace = index < 2 ? 1 : 0.75; // Momo speeds up once you have seen how it thinks
    var because = result.guess.because.ref, truth = B.truth(sn.data);
    var alive = function () { return token === game.token; };
    var badge = '<span class="badge ' + (result.correct ? 'right' : 'wrong') + '">' + A.icon(result.correct ? 'check' : 'cross', 26) + '</span>';
    hush();
    return wait(30).then(function () {
      sn.where = 'spot'; settle(sn); S.play('pop'); mood('think', [0, 5]);
      return pause(360);
    }).then(function () {
      if (!alive()) return;
      // Momo compares the new snack with every example it was shown...
      result.guess.ranked.forEach(function (r, n) { lineBetween(SPOT, r.example.ref, 'scan', n * 45); });
      S.play('think');
      return pause(580);
    }).then(function () {
      if (!alive()) return;
      // ...and picks the one that looks most alike.
      clearLines();
      lineBetween(SPOT, because, 'match-back');
      lineBetween(SPOT, because, 'match');
      loopAround(because);
      mood('think', because.x < MOMO.x ? [-6, 1] : [6, 1]);
      if (!explain) return pause(380);
      say(reason(sn.data, because.data));
      return wait(game.fast ? 1500 : 2100);
    }).then(function () {
      if (!alive()) return;
      if (result.plate === 'yum') {
        // Momo thinks it is yum, so Momo eats it.
        say('Yum!', { shout: true, mood: 'aah' });
        S.play('yum');
        return pause(240).then(function () {
          if (!alive()) return;
          clearLines();
          sn.el.style.setProperty('--s', 0.3);
          sn.where = 'mouth'; settle(sn); sn.el.classList.add('eaten');
          return pause(300);
        }).then(function () {
          if (!alive()) return;
          mood('chew'); S.play('munch');
          return pause(520);
        }).then(function () {
          if (!alive()) return;
          sn.mark = truth; sn.badge = badge; draw(sn);
          if (result.correct) {
            mood('yum'); bounce('hop'); S.play('right');
            return pause(420);
          }
          // It was yuck after all. Out it comes!
          say('Bleh!', { shout: true, mood: 'bleh' }); bounce('shake'); S.play('wrong');
          sn.el.classList.remove('eaten'); sn.el.classList.add('spat');
          sn.el.style.setProperty('--s', 1);
          sn.where = 'aside'; settle(sn);
          return pause(950);
        });
      }
      // Momo thinks it is yuck, so Momo leaves it alone.
      say('Yuck!', { shout: true, mood: 'yuck' });
      S.play('yuck');
      bounce('shake');
      return pause(560).then(function () {
        if (!alive()) return;
        // Now the secret is shown: was it really yum or yuck?
        clearLines();
        sn.mark = truth; sn.badge = badge; draw(sn);
        sn.el.classList.add('reveal');
        S.play(result.correct ? 'right' : 'wrong');
        if (result.correct) { hush(); mood('happy'); return pause(440); }
        say('Aww, it was yum!', { mood: 'sad' });
        glance(SPOT, 1200);
        return pause(1100);
      });
    }).then(function () {
      if (!alive()) return;
      clearLines();
      if (sn.el.classList.contains('eaten')) {
        // Momo ate this one, so it pops up on the strip instead of flying out of Momo's mouth.
        sn.el.style.transition = 'none';
        sn.el.style.setProperty('--s', 1);
        sn.where = 'result'; settle(sn);
        void sn.el.offsetWidth;
        sn.el.style.transition = '';
        sn.el.classList.remove('eaten');
        replay(sn.el, 'arrive');
      } else {
        sn.where = 'result'; settle(sn);
      }
      return pause(280);
    }).then(function () {
      sn.el.classList.remove('spat');
    });
  }

  function afterTest(results) {
    var right = B.countCorrect(results), total = results.length, passed = right / total >= PASS;
    var last = game.runs.length ? game.runs[game.runs.length - 1] : null;
    var starsBefore = starsFor(game.level);

    game.runs.push(right);
    game.best[game.level] = Math.max(game.best[game.level], right);
    game.phase = 'tested';
    stage.dataset.phase = 'tested';
    game.fast = false;
    game.lastResults = results;

    $('results-note').textContent = 'Momo got ' + right + ' of ' + total + '.' + (last === null ? '' : ' Last time it got ' + last + '.');
    updateHud();
    replay($('hud-score').parentNode.parentNode, 'bump');
    if (starsFor(game.level) > starsBefore) {
      S.play('star', 0.25);
      Array.prototype.forEach.call($('hud-stars').children, function (el, i) { if (i >= starsBefore && i < starsFor(game.level)) el.classList.add('pop'); });
    }

    if (passed) {
      var token = game.token, grew = growth() > game.grown;
      say(level().cheer, { mood: 'cheer' });
      bounce('hop');
      S.play('win', 0.2);
      setActions([]);
      if (right === total) confetti(36);
      wait(1300).then(function () {
        if (token !== game.token || !grew) return;
        // Learning something new makes Momo's sprout grow.
        game.mood = 'cheer';
        drawMomo();
        replay($('momo'), 'grew');
        S.play('star');
      });
      wait(2700).then(function () { if (token === game.token) winCard(right, total, grew); });
      return;
    }

    var mixed = B.mixedUp(examples()).length > 0;
    say(stuckLine(results), { mood: 'oops' });
    setActions([{ label: mixed ? 'Fix the plates' : 'Show Momo more', primary: true, className: 'ready', action: backToTeach }]);
  }

  // What Momo says when it did not pass. This is the hint.
  function stuckLine(results) {
    if (B.mixedUp(examples()).length) return 'Hmm. Look at my plates. Is every snack on the right one?';
    if (level().later && !game.later) return level().stuck;
    game.hints++;
    var missed = results.filter(function (r) { return !r.correct; })[0];
    if (game.hints === 1 || !helpfulSnacks().length) {
      return 'I still mix up the ' + describe(missed.snack) + ' ones. Show me more like that!';
    }
    return 'Try the glowing snacks. They will help me the most!';
  }

  function helpfulSnacks() {
    var list = waiting();
    var good = B.helpful(level().test, examples(), list.map(function (sn) { return sn.data; })).slice(0, 3);
    return list.filter(function (sn) { return good.indexOf(sn.data) !== -1; });
  }

  function backToTeach() {
    $('veil').classList.remove('show');
    removeSnacks(function (sn) { return sn.where !== 'tray' && sn.where !== 'yum' && sn.where !== 'yuck'; });
    clearLines();
    game.phase = 'teach';
    stage.dataset.phase = 'teach';
    mood('idle');

    if (level().later && !game.later) {
      game.later = true;
      // Tidy the snacks still waiting, then make room for the new ones.
      var still = waiting().sort(function (p, q) { return p.slot - q.slot; });
      still.forEach(function (sn, i) { sn.slot = i; });
      var startSlot = still.length;
      game.capacity = startSlot + level().later.snacks.length;
      drawTray();
      settleAll();
      level().later.snacks.forEach(function (data, i) {
        var sn = addSnack(data, 'tray', startSlot + i, B.truth(data));
        sn.el.classList.add('arrive');
        sn.el.firstChild.style.animationDelay = 40 + i * 70 + (i % 2) * 30 + 'ms';
      });
      S.play('arrive');
      say(level().later.say, { mood: 'wow' });
      setTimeout(function () { if (game.mood === 'wow') mood('idle'); }, 2200);
    } else {
      B.mixedUp(examples()).forEach(function (ex) { ex.ref.el.classList.add('wiggle'); });
      if (game.hints >= 2) helpfulSnacks().forEach(function (sn) { sn.el.classList.add('glow'); });
    }
    refreshLive();
    teachActions();
  }

  /* ------------------------------------------------------------------ */
  /* Cards                                                               */
  /* ------------------------------------------------------------------ */

  var GREW = ['', "Momo's sprout grew a leaf!", "Momo's sprout grew another leaf!", "Momo's sprout is in flower!"];

  function winCard(right, total, grew) {
    var lastLevel = game.level === LEVELS.length - 1, perfect = right === total;
    $('card').className = 'card tape';
    $('card').innerHTML =
      '<div class="card-momo">' + A.momo('cheer', 176, { shadow: false, grow: growth() }) + '</div>' +
      '<div class="card-stars" role="img" aria-label="' + starsFor(game.level) + ' of 3 stars">' + stars(starsFor(game.level), 64) + '</div>' +
      '<h2 class="card-title" id="card-title">Momo got ' + right + ' of ' + total + '!</h2>' +
      '<p class="card-found">You discovered<b><span class="swipe">' + level().discovery + '</span></b></p>' +
      (grew ? '<p class="card-grew">' + A.icon('leaf', 30) + GREW[growth()] + '</p>' : '') +
      (perfect ? '' : '<p class="card-tip">Want all 3 stars? Show Momo more examples.</p>') +
      '<div class="card-buttons"></div>';
    var buttons = $('card').querySelector('.card-buttons');
    if (!perfect) buttons.appendChild(cardButton('Show Momo more', false, backToTeach));
    buttons.appendChild(cardButton(lastLevel ? "See Momo's report card" : 'Next level', true, function () {
      if (lastLevel) showFinal(); else startLevel(game.level + 1);
    }));
    hush();
    $('veil').classList.add('show');
    S.play('star', 0.15); S.play('star', 0.4);
    buttons.lastChild.focus({ preventScroll: true });
  }

  function cardButton(label, primary, action) {
    var el = document.createElement('button');
    el.className = 'btn' + (primary ? ' btn-primary' : '');
    el.textContent = label;
    el.addEventListener('click', function () { S.play('click'); action(); });
    return el;
  }

  // The three pictures that explain the game.
  function stepsHtml() {
    var berry = { color: 'blue', size: 0.62, spike: 0 }, small = { color: 'blue', size: 0.3, spike: 0 };
    var purple = { color: 'purple', size: 0.6, spike: 0.3 }, green = { color: 'green', size: 0.5, spike: 0.05 };
    var cloth = A.cloth(26), picture = 'background-color:' + cloth.backgroundColor + ';background-image:' + cloth.backgroundImage + ';background-size:' + cloth.backgroundSize;
    var show =
      at(A.plate(236, 132, 'yum'), 74, 78) + at(A.snack(berry, 'yum'), 150, 72) +
      at(A.snack(small, 'yum'), 10, 4, 'animation:demo-drag 2.6s ease-in-out infinite;--dx:74px;--dy:58px') +
      at(A.hand(64), 54, 52, 'animation:demo-drag 2.6s ease-in-out infinite;--dx:74px;--dy:58px');
    var watchArt =
      at(A.momo('think', 156, { grow: 1 }), 4, 50) + at(A.snack(purple, null), 150, 106) + at(A.snack(purple, 'yum'), 204, 8) +
      at('<svg width="326" height="222" viewBox="0 0 326 222"><line x1="226" y1="134" x2="250" y2="98" stroke="' + T.color.ink +
        '" stroke-width="11" stroke-linecap="round"/><line x1="226" y1="134" x2="250" y2="98" stroke="' + T.color.pink + '" stroke-width="6" stroke-linecap="round"/></svg>', 0, 0);
    var help =
      at(A.momo('oops', 156, { grow: 1 }), 4, 50) +
      at(A.snack(green, 'yum') + '<span class="badge" style="animation:none">' + A.icon('cross', 26) + '</span>', 152, 6, 'width:116px;height:116px') +
      at(A.snack({ color: 'green', size: 0.75, spike: 0 }, 'yum'), 196, 96) + at(A.hand(64), 244, 148);
    function step(number, art, title, text) {
      return '<li class="step"><span class="step-number">' + number + '</span><div class="step-art" style="' + picture + '">' + art + '</div><h3>' + title + '</h3><p>' + text + '</p></li>';
    }
    return step(1, show, 'Show', 'Drag snacks onto the plates. <b>Hearts</b> mean yum. <b>Stink lines</b> mean yuck.') +
      step(2, watchArt, 'Watch', "Momo can't smell. It guesses by finding the example that <b>looks most alike</b>.") +
      step(3, help, 'Help', 'Did Momo get mixed up? <b>Show it more examples</b> and test again.');
  }

  function helpCard() {
    $('card').className = 'card card-help';
    $('card').innerHTML = '<h2 class="title" id="card-title">How to play</h2><ol class="steps">' + stepsHtml() + '</ol>' +
      '<button class="round round-close" aria-label="Close">' + A.icon('close', 28) + '</button>';
    $('card').querySelector('.round-close').addEventListener('click', function () { S.play('click'); $('veil').classList.remove('show'); });
    $('veil').classList.add('show');
  }

  /* ------------------------------------------------------------------ */
  /* Confetti                                                            */
  /* ------------------------------------------------------------------ */

  function confetti(count) {
    var box = $('confetti'), c = T.color;
    var colors = [c.pink, c.gold, c.snack.blue, c.snack.green, c.snack.purple, c.snack.tangerine, c.white];
    for (var i = 0; i < count; i++) {
      var bit = document.createElement('i'), wide = 9 + Math.random() * 9;
      bit.style.left = Math.random() * 100 + '%';
      bit.style.width = wide + 'px';
      bit.style.height = wide * (0.8 + Math.random() * 0.9) + 'px';
      bit.style.background = colors[i % colors.length];
      bit.style.border = '2px solid ' + c.ink;
      bit.style.setProperty('--delay', Math.random() * 0.7 + 's');
      bit.style.setProperty('--time', 2.1 + Math.random() * 1.5 + 's');
      bit.style.setProperty('--drift', (Math.random() - 0.5) * 260 + 'px');
      bit.style.setProperty('--spin', (Math.random() * 900 - 450) + 'deg');
      box.appendChild(bit);
    }
    setTimeout(function () { box.innerHTML = ''; }, 4600);
  }

  /* ------------------------------------------------------------------ */
  /* The end                                                             */
  /* ------------------------------------------------------------------ */

  function showFinal() {
    game.token++;
    $('veil').classList.remove('show');
    var total = LEVELS.reduce(function (sum, lv, i) { return sum + starsFor(i); }, 0), most = LEVELS.length * 3;
    var praise = total === most ? 'Every star! Momo is a super muncher, and you are a super teacher.'
      : total >= most * 0.6 ? 'Great teaching! Momo learned a lot from you. Can you win every star?'
      : 'Good start! Show Momo more examples next time to win more stars.';
    var rows = LEVELS.map(function (lv, i) {
      return '<li class="report-row"><span class="hud-number">' + (i + 1) + '</span>' +
        '<span class="report-found">' + lv.discovery + '<span class="report-name">' + lv.name + '</span></span>' +
        '<span class="report-stars" role="img" aria-label="' + starsFor(i) + ' of 3 stars">' + stars(starsFor(i), 38) + '</span></li>';
    }).join('');
    $('screen-final').innerHTML =
      '<div class="final-bunting">' + A.bunting(1220, 15) + '</div>' +
      '<div class="final-words"><h2 class="title">You taught Momo to munch!</h2></div>' +
      '<div class="final-momo">' + A.momo('cheer', 330, { grow: Math.max(growth(), LEVELS.filter(function (lv, i) { return starsFor(i) > 0; }).length) }) + '</div>' +
      '<div class="final-play"><button class="btn btn-primary btn-big" id="btn-again">Play again</button></div>' +
      '<div class="report tape">' +
        '<div class="report-head"><span class="report-title">Momo\'s report card</span><span class="report-score">Score<b>' + score() + '</b></span></div>' +
        '<ol class="report-rows">' + rows + '</ol>' +
        '<p class="report-say">' + praise + '</p>' +
        '<p class="report-real">Real AI learns the same way: from examples that people give it. Plenty of fair examples make AI that is fair to everyone.</p>' +
      '</div>';
    $('btn-again').addEventListener('click', function () {
      S.play('click');
      game.best = LEVELS.map(function () { return 0; });
      startLevel(0);
    });
    show('final');
    S.play('win');
    confetti(total === most ? 60 : 30);
  }

  /* ------------------------------------------------------------------ */
  /* Start screen and setting everything up                              */
  /* ------------------------------------------------------------------ */

  function startArt() {
    var big = function (k) { return 'transform:scale(' + k + ');transform-origin:50% 50%'; };
    return at(A.momo('aah', 410, { look: [-5, -5] }), 112, 84, '', 'start-momo') +
      at(A.plate(336, 188, 'yum'), 6, 410) +
      at(A.snack({ color: 'green', size: 0.55, spike: 0 }, 'yum'), 74, 412, big(1.5)) +
      at(A.snack({ color: 'blue', size: 0.35, spike: 0 }, 'yum'), 186, 436, big(1.5)) +
      at(A.snack({ color: 'blue', size: 0.85, spike: 0 }, 'yum'), 46, 66, big(1.7), 'start-treat') +
      at(A.snack({ color: 'tangerine', size: 0.7, spike: 0.85 }, 'yuck'), 440, 462, big(1.6)) +
      at(A.fly(44), 392, 40, '', 'start-fly') +
      at(A.snack({ color: 'purple', size: 0.5, spike: 0.6 }, 'yuck'), 452, 8, big(1.4));
  }

  function openVideo() {
    var video = $('video');
    $('video-veil').classList.add('show');
    document.body.classList.add('watching');
    try { video.currentTime = 0; var p = video.play(); if (p && p.catch) p.catch(function () {}); } catch (e) { /* the player still has its own play button */ }
  }

  function closeVideo() {
    $('video').pause();
    $('video-veil').classList.remove('show');
    document.body.classList.remove('watching');
  }

  function setSoundIcon() {
    $('btn-sound').innerHTML = A.icon(S.isMuted() ? 'sound-off' : 'sound-on', 28);
  }

  function setUp() {
    document.body.style.backgroundImage = grass.backgroundImage;
    fit();
    window.addEventListener('resize', fit);

    var tabIcon = document.createElement('link');
    tabIcon.rel = 'icon';
    tabIcon.href = 'data:image/svg+xml,' + encodeURIComponent(A.momo('idle', 64, { shadow: false }));
    document.head.appendChild(tabIcon);

    var cloth = A.cloth(40), blanket = $('blanket');
    blanket.style.backgroundColor = cloth.backgroundColor;
    blanket.style.backgroundImage = cloth.backgroundImage;
    blanket.style.backgroundSize = cloth.backgroundSize;

    $('logo').innerHTML = A.logo();
    $('start-art').innerHTML = startArt();
    $('steps').innerHTML = stepsHtml();
    ['yum', 'yuck'].forEach(function (plate) {
      $('plate-' + plate).innerHTML = '<span class="plate-flag">' + A.flag(plate, 1.12) + '</span>' + A.plate(430, 240, plate);
    });
    drawMomo();
    $('bubble-tail').innerHTML = A.tail(34);
    $('hand').innerHTML = A.hand(84);
    $('results').insertAdjacentHTML('afterbegin', A.strip(970, 146));
    $('btn-help').innerHTML = A.icon('help', 28);
    $('btn-video-close').innerHTML = A.icon('close', 28);
    setSoundIcon();
    fillIcons(document);

    $('btn-play').addEventListener('click', function () { S.unlock(); S.play('click'); show('how'); });
    $('btn-go').addEventListener('click', function () { S.unlock(); S.play('click'); startLevel(0); });
    $('btn-video').addEventListener('click', function () { S.play('click'); openVideo(); });
    $('btn-video-close').addEventListener('click', closeVideo);
    // The video only starts loading when it is opened, so a missing file shows up then.
    $('video').addEventListener('error', function () { closeVideo(); $('btn-video').style.display = 'none'; });
    $('btn-help').addEventListener('click', function () { S.play('click'); helpCard(); });
    $('btn-sound').addEventListener('click', function () { S.mute(!S.isMuted()); setSoundIcon(); S.play('click'); });

    ['yum', 'yuck'].forEach(function (plate) {
      $('plate-' + plate).addEventListener('click', function () { if (game.picked && game.phase === 'teach') put(game.picked, plate); });
    });
    $('tray').addEventListener('click', function () { if (game.picked && game.phase === 'teach') put(game.picked, 'tray'); });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if ($('video-veil').classList.contains('show')) closeVideo();
      else if ($('card').classList.contains('card-help')) $('veil').classList.remove('show');
      else unpick();
    });

    // Jump straight to a level with index.html?level=2 (handy when presenting).
    var jump = /[?&]level=(\d)/.exec(window.location.search);
    if (jump && LEVELS[jump[1] - 1]) startLevel(jump[1] - 1);
  }

  setUp();

  // For checking the game from the browser console.
  window.MomoGame = { state: game, startLevel: startLevel, showFinal: showFinal, put: put, runTest: runTest, confetti: confetti };
})();
