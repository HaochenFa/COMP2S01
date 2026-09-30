/*
 * Momo Learns to Munch: the game itself.
 *
 * What happens on each level:
 *   1. teach    the player drags example snacks onto the Yum and Yuck plates
 *   2. testing  Momo guesses new snacks one by one, by itself
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
  var PLATE = { yum: { x: 235, y: 330 }, yuck: { x: 1045, y: 330 }, rx: 215, ry: 118, max: 8 };
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

  function fit() {
    game.scale = Math.min(window.innerWidth / T.stage.width, window.innerHeight / T.stage.height);
    document.documentElement.style.setProperty('--scale', game.scale);
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
  function at(html, x, y, extra) {
    return '<div style="left:' + x + 'px;top:' + y + 'px;' + (extra || '') + '">' + html + '</div>';
  }

  function describe(snack) {
    var feel = snack.spike < 0.2 ? 'smooth' : snack.spike < 0.5 ? 'bumpy' : 'spiky';
    var color = snack.color === 'tangerine' ? 'orange' : snack.color;
    return feel + ' ' + color;
  }

  /* ------------------------------------------------------------------ */
  /* Momo                                                                */
  /* ------------------------------------------------------------------ */

  function mood(name, look) {
    game.mood = name;
    var svg = $('momo').querySelector('.momo-svg');
    svg.dataset.mood = name;
    svg.querySelector('.momo-face').innerHTML = A.face(name, look);
  }

  function bounce(kind) {
    var el = $('momo');
    el.classList.remove('hop', 'shake');
    void el.offsetWidth;
    el.classList.add(kind);
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

  setInterval(function () {
    if (game.mood !== 'idle' || stage.dataset.screen !== 'play') return;
    var faceEl = $('momo').querySelector('.momo-face');
    faceEl.innerHTML = A.face('blink');
    setTimeout(function () { if (game.mood === 'idle') faceEl.innerHTML = A.face('idle'); }, 140);
  }, 3600);

  /* ------------------------------------------------------------------ */
  /* Snacks: where they are and how they move                            */
  /* ------------------------------------------------------------------ */

  function level() { return LEVELS[game.level]; }

  // The tray has one row of snacks, or two rows when it holds a lot of them.
  function traySize() {
    var capacity = game.capacity;
    var rows = capacity > TRAY.oneRow ? 2 : 1, perRow = Math.ceil(capacity / rows);
    var slot = Math.min(TRAY.slot, (TRAY.right - TRAY.left - TRAY.edge * 2) / perRow);
    var width = perRow * slot + TRAY.edge * 2;
    return {
      rows: rows, perRow: perRow, slot: slot, width: width,
      left: (TRAY.left + TRAY.right) / 2 - width / 2,
      top: rows === 1 ? 546 : 486, height: rows === 1 ? 146 : 212,
      rowY: rows === 1 ? [610] : [550, 642]
    };
  }

  function drawTray() {
    var tray = traySize();
    $('tray').style.left = tray.left + 'px';
    $('tray').style.top = tray.top + 'px';
    $('tray').innerHTML = A.tray(tray.width, tray.height);
  }

  // The first empty place in the tray. The tray grows if it is full.
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
    var y = PLATE[plate].y + (count <= 4 ? 6 : row === 0 ? -34 : 46);
    return { x: PLATE[plate].x + (col - (inRow - 1) / 2) * 88, y: y };
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
    if (sn.mark) label += sn.mark === 'yum' ? ', sparkly, yum' : ', stinky, yuck';
    sn.el.setAttribute('aria-label', label);
  }

  function addSnack(data, where, slot, mark) {
    var el = document.createElement('div');
    el.className = 'snack';
    el.setAttribute('role', 'button');
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
      var dx = (p.x - PLATE[plate].x) / (PLATE.rx + 14), dy = (p.y - PLATE[plate].y) / (PLATE.ry + 22);
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
          sn.el.classList.add('drag');
          unpick();
          S.play('pop');
        }
        if (moved) { setXY(sn, p.x, p.y - 8); highlight(plateAt(p)); }
      }
      function onUp(ev) {
        sn.el.removeEventListener('pointermove', onMove);
        sn.el.removeEventListener('pointerup', onUp);
        sn.el.removeEventListener('pointercancel', onUp);
        sn.el.classList.remove('drag');
        highlight(null);
        if (!moved) return tap(sn);
        var p = point(ev), plate = plateAt(p);
        if (plate) put(sn, plate);
        else if (overTray(p)) put(sn, 'tray');
        else settle(sn);
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
      return;
    }
    var changed = sn.where !== where;
    if (changed && where === 'tray') sn.slot = freeSlot();
    sn.where = where;
    sn.order = ++game.order;
    sn.el.classList.remove('glow', 'wiggle');
    unpick();
    settleAll();
    if (!changed) return;
    S.play('drop');
    if (where !== 'tray') {
      // Momo glances at the plate it is learning from.
      mood('idle', where === 'yum' ? [-6, 2] : [6, 2]);
      clearTimeout(game.glance);
      game.glance = setTimeout(function () { if (game.mood === 'idle') mood('idle'); }, 700);
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
      return;
    }
    var pick = waiting().filter(function (sn) { return B.truth(sn.data) === step; })[0];
    if (!pick) return hideHand();
    pointHand({ x: pick.x, y: pick.y }, { x: PLATE[step].x, y: PLATE[step].y });
    say(step === 'yum' ? 'Drag a sparkly snack onto my Yum plate.' : 'Now drag a stinky one onto my Yuck plate.');
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
      el.innerHTML = (b.icon ? '<span class="btn-icon">' + A.icon(b.icon, 28) + '</span>' : '') + b.label;
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
    $('hud-stars').innerHTML = stars(starsFor(game.level), 40);
    $('hud-stars').setAttribute('aria-label', starsFor(game.level) + ' of 3 stars');
    $('hud-score').textContent = score();
  }

  function startLevel(index) {
    var token = ++game.token;
    game.level = index;
    game.phase = 'intro';
    game.runs = []; game.later = false; game.hints = 0; game.fast = false; game.guideStep = null; game.guideReady = false;
    removeSnacks(function () { return true; });
    unpick(); hideHand(); hush(); clearLines();
    $('veil').classList.remove('show');
    stage.dataset.phase = 'teach';
    show('play');
    updateHud();
    mood('idle');
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
        sn.el.firstChild.style.animationDelay = slot * 60 + 'ms';
      });
      game.phase = 'teach';
      refreshLive();
      teachActions();
      say(level().hello, { mood: 'happy' });
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
    el.setAttribute('x1', from.x + ux * 50); el.setAttribute('y1', from.y + uy * 50);
    el.setAttribute('x2', to.x - ux * 46); el.setAttribute('y2', to.y - uy * 46);
    el.setAttribute('class', className);
    if (delay) el.style.animationDelay = delay + 'ms';
    $('lines').appendChild(el);
  }

  function runTest() {
    if (game.phase !== 'teach') return;
    if (!readyToTest()) {
      say('Put at least one snack on each plate first.', { mood: 'idle', hide: 2600 });
      bounce('shake');
      return;
    }
    var token = ++game.token, shown = examples(), tests = level().test;
    var results = B.test(tests, shown), first = game.level === 0 && game.runs.length === 0;

    game.phase = 'testing';
    game.fast = game.runs.length > 0;
    stage.dataset.phase = 'testing';
    unpick(); hideHand(); refreshLive();
    game.snacks.forEach(function (sn) { sn.el.classList.remove('glow', 'wiggle', 'arrive'); });
    $('results-note').textContent = 'Momo is guessing…';
    setActions(game.fast ? [] : [{ label: 'Faster', icon: 'fast', action: function () { game.fast = true; setActions([]); } }]);
    say('My turn! Let me guess these by myself.', { mood: 'happy' });

    var chain = pause(first ? 1900 : 1300);
    results.forEach(function (result, i) {
      chain = chain.then(function () { return token === game.token ? guessOne(result, i, first && i === 0, token) : null; });
    });
    chain.then(function () { if (token === game.token) afterTest(results); });
  }

  function guessOne(result, index, explain, token) {
    var sn = addSnack(result.snack, 'wait', index, null);
    game.pace = index < 2 ? 1 : 0.75; // Momo speeds up once you have seen how it thinks
    var because = result.guess.because.ref;
    var alive = function () { return token === game.token; };
    hush();
    return wait(30).then(function () {
      sn.where = 'spot'; settle(sn); S.play('pop'); mood('think');
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
      var ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('cx', because.x); ring.setAttribute('cy', because.y); ring.setAttribute('r', 44);
      ring.setAttribute('class', 'ring');
      $('lines').appendChild(ring);
      if (!explain) return pause(340);
      say('It looks most like this one…');
      return wait(1900);
    }).then(function () {
      if (!alive()) return;
      say(result.plate === 'yum' ? 'Yum!' : 'Yuck!', { shout: true, mood: result.plate });
      S.play(result.plate);
      bounce('hop');
      return pause(540);
    }).then(function () {
      if (!alive()) return;
      // Now the secret is shown: was it really yum or yuck?
      sn.mark = B.truth(sn.data);
      sn.badge = '<span class="badge ' + (result.correct ? 'right' : 'wrong') + '">' + A.icon(result.correct ? 'check' : 'cross', 26) + '</span>';
      draw(sn);
      sn.el.classList.add('reveal');
      S.play(result.correct ? 'right' : 'wrong');
      if (!result.correct) { say('Oops!', { shout: true, mood: 'oops' }); bounce('shake'); }
      return pause(result.correct ? 480 : 900);
    }).then(function () {
      if (!alive()) return;
      clearLines();
      sn.where = 'result'; settle(sn);
      return pause(260);
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
    $('hud-score').parentNode.classList.remove('bump'); void $('hud-score').offsetWidth; $('hud-score').parentNode.classList.add('bump');
    if (starsFor(game.level) > starsBefore) {
      S.play('star', 0.25);
      Array.prototype.forEach.call($('hud-stars').children, function (el, i) { if (i >= starsBefore && i < starsFor(game.level)) el.classList.add('pop'); });
    }

    if (passed) {
      var token = game.token;
      say(level().cheer, { mood: 'cheer' });
      bounce('hop');
      S.play('win', 0.2);
      setActions([]);
      wait(2300).then(function () { if (token === game.token) winCard(right, total); });
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
    removeSnacks(function (sn) { return sn.where === 'result' || sn.where === 'spot' || sn.where === 'wait'; });
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
        sn.el.firstChild.style.animationDelay = i * 70 + 'ms';
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

  function winCard(right, total) {
    var lastLevel = game.level === LEVELS.length - 1, perfect = right === total;
    $('card').className = 'card';
    $('card').innerHTML =
      '<div class="card-momo">' + A.momo('cheer', 170, { shadow: false }) + '</div>' +
      '<div class="card-stars" role="img" aria-label="' + starsFor(game.level) + ' of 3 stars">' + stars(starsFor(game.level), 64) + '</div>' +
      '<h2 class="card-title" id="card-title">Momo got ' + right + ' of ' + total + '!</h2>' +
      '<p class="card-found">You discovered<b>' + level().discovery + '</b></p>' +
      (perfect ? '' : '<p class="card-tip">Want all 3 stars? Show Momo more examples.</p>') +
      '<div class="card-buttons"></div>';
    var buttons = $('card').querySelector('.card-buttons');
    if (!perfect) buttons.appendChild(cardButton('Show Momo more', false, backToTeach));
    buttons.appendChild(cardButton(lastLevel ? "See Momo's report card" : 'Next level', true, function () {
      if (lastLevel) showFinal(); else startLevel(game.level + 1);
    }));
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

  function stepsHtml() {
    var blue = { color: 'blue', size: 0.6, spike: 0 }, orange = { color: 'tangerine', size: 0.55, spike: 0.85 };
    var purple = { color: 'purple', size: 0.6, spike: 0.3 }, green = { color: 'green', size: 0.5, spike: 0.05 };
    var small = { color: 'blue', size: 0.3, spike: 0 };
    var show =
      at(A.plate(250, 140), 86, 74) + at(A.icon('heart', 44), 292, 54) + at(A.snack(blue, 'yum'), 178, 70) +
      at(A.snack(small, 'yum'), 22, 10, 'animation:demo-drag 2.6s ease-in-out infinite') +
      at(A.hand(64), 66, 58, 'animation:demo-drag 2.6s ease-in-out infinite');
    var watch =
      at(A.momo('think', 150), 14, 44) + at(A.snack(purple, null), 170, 98) + at(A.snack(purple, 'yum'), 236, 8) +
      at('<svg width="352" height="218" viewBox="0 0 352 218"><line x1="246" y1="128" x2="280" y2="96" stroke="' + T.color.ink +
        '" stroke-width="12" stroke-linecap="round"/><line x1="246" y1="128" x2="280" y2="96" stroke="' + T.color.pink + '" stroke-width="6" stroke-linecap="round"/></svg>', 0, 0);
    var help =
      at(A.momo('oops', 150), 14, 44) +
      at(A.snack(green, 'yum') + '<span class="badge" style="animation:none">' + A.icon('cross', 26) + '</span>', 170, 8, 'width:116px;height:116px') +
      at(A.snack({ color: 'green', size: 0.75, spike: 0 }, 'yum'), 214, 96) + at(A.hand(64), 262, 146);
    function step(number, art, title, text) {
      return '<li class="step"><span class="step-number">' + number + '</span><div class="step-art">' + art + '</div><h3>' + title + '</h3><p>' + text + '</p></li>';
    }
    return step(1, show, 'Show', 'Drag snacks onto the plates. <b>Sparkles</b> mean yum. <b>Stink lines</b> mean yuck.') +
      step(2, watch, 'Watch', "Momo can't smell. It guesses by finding the example that <b>looks most alike</b>.") +
      step(3, help, 'Help', 'Did Momo get mixed up? <b>Show it more examples</b> and test again.');
  }

  function helpCard() {
    $('card').className = 'card card-help';
    $('card').innerHTML = '<h2 class="title" id="card-title">How to play</h2><ol class="steps">' + stepsHtml() + '</ol>' +
      '<button class="round round-close" aria-label="Close">' + A.icon('close', 30) + '</button>';
    $('card').querySelector('.round-close').addEventListener('click', function () { S.play('click'); $('veil').classList.remove('show'); });
    $('veil').classList.add('show');
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
      '<div class="final-words"><h2 class="title">You taught Momo to munch!</h2></div>' +
      '<div class="final-momo">' + A.momo('cheer', 340) + '</div>' +
      '<div class="final-play"><button class="btn btn-primary btn-big" id="btn-again">Play again</button></div>' +
      '<div class="report">' +
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
  }

  /* ------------------------------------------------------------------ */
  /* Start screen and setting everything up                              */
  /* ------------------------------------------------------------------ */

  function startArt() {
    var big = 'transform:scale(1.5);transform-origin:50% 50%';
    return at(A.computer(450), 50, 120) +
      '<div class="start-peek" style="left:119px;top:-40px;width:312px;height:412px">' +
        '<div style="position:absolute;left:-24px;top:95px">' + A.momo('happy', 360, { shadow: false }) + '</div></div>' +
      at(A.snack({ color: 'blue', size: 0.8, spike: 0 }, 'yum'), 6, 410, big) +
      at(A.snack({ color: 'tangerine', size: 0.7, spike: 0.85 }, 'yuck'), 430, 440, big) +
      at(A.snack({ color: 'green', size: 0.45, spike: 0.05 }, 'yum'), 190, 486, big) +
      at(A.snack({ color: 'purple', size: 0.5, spike: 0.6 }, 'yuck'), 440, 10, big);
  }

  function openVideo() {
    var video = $('video');
    $('video-veil').classList.add('show');
    try { video.currentTime = 0; var p = video.play(); if (p && p.catch) p.catch(function () {}); } catch (e) { /* the player still has its own play button */ }
  }

  function closeVideo() {
    $('video').pause();
    $('video-veil').classList.remove('show');
  }

  function setSoundIcon() {
    $('btn-sound').innerHTML = A.icon(S.isMuted() ? 'sound-off' : 'sound-on', 30);
  }

  function setUp() {
    fit();
    window.addEventListener('resize', fit);

    var tabIcon = document.createElement('link');
    tabIcon.rel = 'icon';
    tabIcon.href = 'data:image/svg+xml,' + encodeURIComponent(A.momo('idle', 64, { shadow: false }));
    document.head.appendChild(tabIcon);

    $('logo').innerHTML = A.logo();
    $('start-art').innerHTML = startArt();
    $('steps').innerHTML = stepsHtml();
    $('plate-yum').insertAdjacentHTML('afterbegin', A.plate(430, 240));
    $('plate-yuck').insertAdjacentHTML('afterbegin', A.plate(430, 240));
    $('momo').innerHTML = A.momo('idle', 210);
    $('hand').innerHTML = A.hand(84);
    $('results').insertAdjacentHTML('afterbegin', A.tray(970, 146));
    $('btn-help').innerHTML = A.icon('help', 30);
    $('btn-video-close').innerHTML = A.icon('close', 30);
    setSoundIcon();
    fillIcons(document);

    $('btn-play').addEventListener('click', function () { S.unlock(); S.play('click'); show('how'); });
    $('btn-go').addEventListener('click', function () { S.unlock(); S.play('click'); startLevel(0); });
    $('btn-video').addEventListener('click', function () { S.play('click'); openVideo(); });
    $('btn-video-close').addEventListener('click', closeVideo);
    $('video').addEventListener('error', function () { $('btn-video').style.display = 'none'; });
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
  window.MomoGame = { state: game, startLevel: startLevel, showFinal: showFinal, put: put, runTest: runTest };
})();
