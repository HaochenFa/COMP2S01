# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in `hw1-momo/`, Assignment 1 inside the COMP2S01 monorepo.

## What this is

Coursework for Assignment 1 (brief: `HW1_Digital-Product-Dev.docx`). The repository owner is in Pair B, which builds an interactive educational AI game for Grade 5/6 pupils (ages 9–12). Another pair later tests it and adds a level or feature, and both the first version and the final version are shown in a class presentation, so earlier versions must stay recoverable.

- `momo-learns-to-munch/` is the game (the product). Plain HTML, CSS and JavaScript with no build step and no dependencies.
- `meet-momo-video/` is a Remotion project that renders the intro video into `momo-learns-to-munch/media/meet-momo.mp4` (and its poster frame, `meet-momo.jpg`).
- Versions are git tags: `hw1-v0` is the first implementation, `hw1-v0.1` the picture-book redesign. Screenshots of v0 exist only in those tags (`v1-screenshots/` at the repo root; the name is old, the pictures show v0). Check out a tag to show an earlier version; don't label anything "v1".

## Commands

Game (run from `hw1-momo/`):

```bash
open momo-learns-to-munch/index.html                 # play; works straight from the file, no server
node momo-learns-to-munch/tools/check-levels.js      # the only automated check; exits 1 if a level cannot be won
python3 -m http.server 8765 --directory momo-learns-to-munch   # only needed for browser automation that blocks file:// URLs
```

- `index.html?level=2` (or `3`) jumps straight to a level.
- `momo-learns-to-munch/tools/art-sheet.html` shows every drawing on one page; open it after changing `js/art.js`.
- `node momo-learns-to-munch/tools/make-grain.js` regenerates `img/grain.png`.
- `window.MomoGame` (`state`, `startLevel`, `showFinal`, `put`, `runTest`, `confetti`) is exposed for driving the game from the console or a test script.

Video (run inside `meet-momo-video/`):

```bash
npm install
npm run assets    # copies fonts and grain from the game and generates public/audio/*.wav from the game's sound recipes
npm run dev       # Remotion Studio
npm run lint      # eslint + tsc
npm run render    # writes ../momo-learns-to-munch/media/meet-momo.mp4, then the poster meet-momo.jpg (npm run poster)
npx remotion render MeetMomo out/frames --frames=30,400,1010 --image-format=png --scale=0.5   # spot-check single frames
```

There are no unit tests. Visual and behavioural changes are verified by playing the game in a browser and looking at screenshots.

Browser-testing gotchas:
- `python3 -m http.server` lets Chrome cache JS/CSS heuristically, so edits may not show. Serve with a `Cache-Control: no-store` header or hard-reload.
- The intro `<video>` is `preload="none"` with a poster on purpose. With `preload="metadata"`, a server without Range support (like `http.server`) keeps the video request open and the page's `load` event never fires. If the file is missing, the `error` handler closes the player and hides the "Meet Momo" button.
- In an automated browser with no audio output, the video sits at 0:00. Set `video.muted = true` to check that it plays.

## Architecture

### One source of truth shared by the game, Node tools and the video

Every file in `momo-learns-to-munch/js/` except `game.js` uses a small UMD wrapper: in the browser it attaches a global (`MomoTokens`, `MomoArt`, `MomoBrain`, `MomoLevels`, `MomoSound`), and under Node or a bundler it is a CommonJS module. This is deliberate:

- The game loads them as classic `<script>` tags so it runs from `file://`. Do not convert them to ES modules; module scripts are blocked on `file://`.
- `tools/check-levels.js` and `meet-momo-video/scripts/prepare-assets.cjs` `require()` them from Node.
- `meet-momo-video/src/momo.ts` `require()`s `tokens.js` and `art.js` so the video draws Momo and the snacks with the game's own code.

Script order in `index.html` matters: `tokens.js` (head) → `art.js` → `brain.js` → `levels.js` → `sound.js` → `game.js`. An inline script in the head copies token colours into CSS variables, which `css/game.css` relies on.

`css/fonts.css` is the two font families base64-embedded from `fonts/*.woff2` so the game needs no network. There is no script for it: each `@font-face` rule holds one woff2 file as a base64 data URL, so if a font file changes, re-encode it (`base64 -i fonts/<file>.woff2`) into that rule.

### Game modules

- `tokens.js`: colours, line weights, fonts, stage size.
- `art.js`: every drawing as a function returning an SVG string, in stage pixels. The house style is "brush pen and paper": shapes are slightly wobbly (`oval`, `softBox`, `smooth`), outlines are a filled copy of the shape slipped down and to the right (`ink` + `paint`, so lines are thin upper left and heavy lower right), loose lines are tapered `brush` strokes, and shading is one flat shade on the lower right (`shaded`). All wobble is seeded from the thing being drawn (`dice`, `snackSeed`), never `Math.random()`: snacks are redrawn during play and the video renders every frame separately, so unseeded randomness would make them flicker.
  - `css/game.css` animates parts by class name (`.momo-body`, `.momo-face`, `.momo-eyes`, `.momo-arm`, `.momo-sprout`, `.momo-shadow`, `.snack-art`, `.floaty`, `.waft`, `.mark`), so keep those hooks when editing drawings.
  - CSS animations do not run in the video, so the same drawings take explicit poses there: `momo(mood, size, { arms, sway, grow, look })` and `snack(data, mark, phase)`.
  - `lettering()` / `words()` draw the bouncy outlined letters used by the logo and the video title from a table of glyph widths (`ADVANCE`, measured for Bagel Fat One). They emit `<clipPath>`/`<mask>` ids, so give each one on a page its own `id` option.
  - Snack size (`SNACK_BOX`, 116) and Momo's 200-unit box are assumed by `.snack` in the CSS, by `MOUTH`/`MOMO` in `game.js`, and by `Snack`/`Momo` in the video's `parts.tsx`.
- `brain.js`: Momo's model, a 1-nearest-neighbour classifier. A snack's features are its colour (OKLab of the token hex, scaled by `WEIGHT.color`), `size` and `spike`. Momo never sees `yum`. Also provides `helpful()` and `mixedUp()`, which power the hints.
- `levels.js`: level data only. Each level has `tray` (examples available at once), optional `later` (examples that arrive after the first failed test), optional `stuck` (what Momo says on that first failure), optional `box` (`'lunchbox'` draws the first tray as a lunchbox), and `test` (snacks Momo must guess).
- `sound.js`: sounds synthesised sample-by-sample from recipes; played through Web Audio in the browser and written to WAV for the video. `talkPitches(text)` gives Momo's chirps for a line and is shared with the video.
- `game.js`: screens, drag and tap input, the test sequence, scoring, hints, cards.
- `img/grain.png`: a paper-grain tile laid over everything by `body::after`. It is generated by `tools/make-grain.js`; do not edit it by hand.

### How `game.js` is organised

- Everything is laid out on a fixed 1280 × 720 stage that is scaled to the window through the `--scale` CSS variable. Coordinates in `game.js` and `art.js` are stage pixels; pointer positions are converted with `point()`. The `.blanket` sits just inside the stage and the meadow (`A.meadow()`, set on `body`) shows around it.
- A level moves through phases `intro` → `teach` → `testing` → `tested`. The phase is mirrored to `stage.dataset.phase`, and CSS uses it to show the tray or the results strip.
- Each snack is one absolutely positioned element with a `where` of `tray`, `yum`, `yuck`, `wait`, `spot`, `mouth`, `aside` or `result`; `placeOf()` turns that into a position and `settle()` applies it. The tray resizes to `game.capacity`.
- `guessOne()` is the heart of the game's teaching: Momo compares (dotted lines), picks the nearest example (pink line and loop), says why (`reason()`), then either eats the snack (guess yum) or leaves it (guess yuck). A wrong "yum" is spat out ("Bleh!"); a wrong "yuck" makes Momo sad.
- Momo's face and arms change through `mood()`; its eyes follow things through `watch()`; its sprout shows progress through `growth()` (one step per level passed) and is redrawn by `drawMomo()`.
- Async sequences (level intro, the test run) capture `game.token` and stop if it changes, which is how starting another level cancels them.
- Passing needs 75% (`PASS`). Stars come from the best run: 0 misses = 3, 1 miss = 2, otherwise 1. Score is 10 points per correct guess in the best run of each level.

### Level design depends on the model's weights

The three levels each stage one discovery, and the learning is real, not scripted:

1. First bites: any example on each plate is enough.
2. Look-alikes: the first tray cannot pass; the `later` snacks make it winnable ("more examples make better guesses").
3. Lopsided lunchbox: the tray has only blue yum and green yuck snacks, so green yum test snacks fail until the `later` green yum snacks are shown ("lopsided examples make unfair guesses"). This only works because `WEIGHT.color` makes colour outweigh spikiness.

After changing `levels.js`, `WEIGHT` in `brain.js`, or the snack colours in `tokens.js`, run `tools/check-levels.js`. For levels with `later`, its output should say the first tray alone is "not enough to win, as intended" and that everything shown scores full marks.

### Video project

- The film is one continuous shot of a long picnic blanket; there are no scenes or cuts. `src/story.ts` holds every position (in the game's stage units) and every time (`BEAT`, in frames). Actors in `src/actors/` each read the global frame and work out their own state; `src/MeetMomo.tsx` holds the camera, the draw order and all the sounds, keyed to `BEAT`.
- `src/parts.tsx` has the shared pieces. `World` draws the meadow and blanket and applies the camera (centre and zoom); at zoom 1 it shows 1280 × 720 stage units scaled 1.5× to 1920 × 1080.
- Motion must be driven by `useCurrentFrame()` and `interpolate()`. The CSS animations that move things in the game do not render in Remotion, which is why `art.js` accepts explicit poses.
- What Momo says is in `src/lines.json`; `npm run assets` turns each line into a `say-<key>.wav`.
- `public/audio`, `public/fonts` and `public/img` are produced by `npm run assets`; do not edit them by hand. Run it again after changing `sound.js`, `lines.json` or the grain.
- To review a change without a full render, render a frame every half second and look at them: `npx remotion render MeetMomo out/frames --sequence --every-nth-frame=15 --image-format=jpeg --scale=0.4`.
- A full render takes several minutes. The mp4 ships inside the game folder, so `Config.setCrf(24)` in `remotion.config.ts` keeps it around 12 MB, and every `<Audio>` in `MeetMomo.tsx` is scaled by `LOUD` so the mix peaks below 0 dB (check with `ffmpeg -i <mp4> -af volumedetect -f null -`).

## Project constraints

From the brief, the game must keep: a clear start screen, instructions, multiple stages, a scoring system, hints for incorrect answers, difficulty that rises across at least three levels, and a final screen with feedback. `README.md` maps each of these to where it lives.

From the owner's design direction:

- It must not become a quiz. Learning comes from hands-on play and visuals; the player teaches, watches and fixes.
- It is about machine learning, not robotics. Avoid robot framing in names and copy.
- Text is short, friendly and mostly Momo speaking, written for 9–12 year olds.
- All artwork stays in the one house style and comes from `art.js` and `tokens.js`; new assets (including video) should reuse them rather than introduce a second style. It should look made by hand for children: nothing perfectly round, straight or evenly spaced, and no generic UI chrome (pills, grey drop shadows, identical cards).
- The game must keep working offline from a double-clicked `index.html`: no CDNs, no network fonts, no build step.
- Momo narrates in its own speech bubbles, in the game and in the video. Avoid caption boxes and narrator text.
