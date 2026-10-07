# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in `hw1-math-meteor-defense/`, part of Assignment 1 inside the COMP2S01 monorepo.

## What this is

*Math Meteor Defense* is the maths game the owner's group presents for Assignment 1 (brief: `../hw1-momo/HW1_Digital-Product-Dev.docx`, Pair B: an interactive educational game for Grade 5/6 pupils, ages 9–12). The class presentation is a live demo, not slides: it shows the first version and the improved version side by side, so earlier versions must stay recoverable.

- `math-meteor-defense.html` is the game (currently V1.1). It is one file: HTML, CSS and JavaScript inline, with no build, no dependencies and no tests.
- `math-meteor-defense-mvp.html` is the first version (MVP), made with the `/playground` skill. It is kept unchanged for the before-and-after demo, so do not edit it. It stores only its best score, under the `mmd-best` key, so it doesn't clash with the game's `mmd2-` keys.
- `README.md` maps every requirement in the brief to where it lives in the game, and records what changed from MVP → V1 → V1.1. Update it when a change affects either.
- `presentation-script.docx` is the script for the class demo, with screenshots of each step. It describes the game as it is now, so if the menu, hints or final screen change, its steps and screenshots go out of date.
- Versions are annotated git tags: `hw1-meteor-v1` (the polished game) and `hw1-meteor-v1.1` (hints for wrong answers). The `hw1-v*` tags belong to Momo (`../hw1-momo/`). The folder was renamed from `inclass1-math-meteor-defense/`, and at the `hw1-meteor-*` tags it still has that old name.

## Commands

Run from `hw1-math-meteor-defense/`:

```bash
open math-meteor-defense.html                       # play; works straight from the file
python3 -m http.server 8766 --bind 127.0.0.1        # only needed for browser automation
```

There are no unit tests. Changes are checked by playing in a browser and looking at screenshots, plus the generator fuzz below.

Every function and top-level `const` is reachable from the console (`game`, `GEN`, `WAVES`, `startRun`, `beginWave`, `submit`, `update`, `updateFx`, `render`, ...), which is how scripted tests drive the game:

```js
// fuzz every generator: whole-number answers, two hints, no broken strings, no trap equal to the answer
for (const k of Object.keys(GEN)) for (const t of [0, 1, 2]) for (let i = 0; i < 3000; i++) {
  const p = GEN[k](t);
  if (!Number.isInteger(p.a) || p.a < 0 || p.hints.length !== 2 || p.traps[p.a] ||
      [p.q, ...p.hints, p.why, ...Object.values(p.traps)].some(s => /undefined|NaN/.test(s))) console.log(p);
}
```

Browser-testing gotchas:
- The Claude browser pane can show a local file as a `data:` URL snapshot that does not update after an edit. Serve the folder over HTTP and add `?v=N` to the URL to bust the cache.
- A hidden or backgrounded pane pauses `requestAnimationFrame`, so meteors stop moving. Step the game yourself (`update(0.05); updateFx(0.05);` in a loop, then `render(performance.now() / 1000)`).
- The stage size `W`/`H` is 0 until the `ResizeObserver` fires after load. Meteors spawned while `W` is 0 get a `NaN` position and draw in odd places. Wait a moment after loading before stepping the game.
- To make a wrong answer from a script, set `answer.value` and call `submit()`; the hint is then in `feedback.textContent`.
- Starting waves from a script unlocks them and can set a best score. Afterwards, remove the `mmd2-` keys from `localStorage` on that origin.

## Architecture

The script in `math-meteor-defense.html` runs top to bottom in these sections (each starts with a `// ============` banner):

1. **Waves.** `WAVES` holds 7 entries, each with `topics` (repeats make a topic more likely), `tier` (0–2, how big the numbers get), `count`, `speed`, `spawn` and a `skill` card (title, text, worked example) shown before the wave. `waveInfo(i)` returns the wave; after wave 7 it builds endless "Meteor storm N" waves that grow faster.
2. **Problems.** `GEN[topic](tier)` makes one problem for `mult`, `div`, `frac`, `dec`, `pct` or `ops`. Each returns `P(q, a, hints, why, traps)`:
   - `q` is the text on the meteor and `a` the answer.
   - `hints` is `[nudge, bigger step]`.
   - `why` is the reason shown after a miss; it is empty for times tables.
   - `traps` lists common wrong answers, each with its own message.
   - `P()` drops any trap that is not a whole number of 0 or more, or that equals the answer.
3. **Setup.** DOM handles, colour constants (`INK`, `PAPER`, `SUN`, `CORAL`, `TEAL`, matching the CSS variables), `isCoarse` (a touch screen: the on-screen keypad replaces the phone keyboard), and `store`, a `localStorage` wrapper that adds the `mmd2-` prefix and ignores errors. `opts` holds speed and sound.
4. **Sound.** `tone()` synthesises every sound effect through Web Audio. There are no audio files.
5. **Game state.** `game` holds everything about the current run. `HINT_TIME` and `HINT_SLOW` control how long a hint lasts and how much its meteor slows.
6. **Scenery.** `buildScene()` draws the sky (`bgLayer`) and the city (`cityLayer`) onto offscreen canvases once per resize. Meteors are drawn between the two layers, so the city sits in front of them. `S` shrinks meteors on narrow screens.
7. **Meteors.** `m.p` is progress from 0 (top) to 1 (hits the city) and `m.fx` is the x position as a fraction of `W`; `meteorPos(m)` turns these into pixels. `spawnMeteor()` makes up to 30 problems until it finds an answer no meteor on screen already has, then places it in the spot with the most room.
8. **Effects and HUD.** Comic bursts (`pow`), debris, floating text, `say()` for the feedback line, and the hearts, wave bar, score and combo display.
9. **Flow.** `game.state` moves through `menu` → `intro` (the skill card) → `playing` ⇄ `paused` → `cleared` (2 s banner) → the next `intro`, ending in `over` when the hearts run out. Screens are HTML cards shown in `#overlay` by `showCard()`. Enter presses the card's `[data-primary]` button, but only 700 ms after the card opens, so a pupil's last Enter from play does not skip it.
10. **Answers.**
    - `submit()` zaps the lowest meteor with that answer, or calls `giveHint(n)`.
    - `hintTarget(n)` picks the meteor the pupil meant: one whose trap matches `n`, else one whose answer is within 30%, else the lowest.
    - `giveHint` shows a trap message, or the next hint in order (a trap does not use up a hint). Only one meteor shows a hint at a time.
    - `zap()` scores the meteor; `miss()` costs a heart and says `why`.
11. **Update and render.** `update(dt)` moves meteors, counting down any hint and the freeze. The wave is cleared once `spawned === count` and no meteors are left. `render(t)` draws, in order: sky, sparkles, shield, meteors, city, cannon, the hint bubble (`drawHint`), lasers, debris, bursts, text, freeze tint, banner.
12. **Input.** Typing anywhere goes into the answer box (at most 4 digits). Esc pauses, and the game also pauses when the tab is hidden.

Rules that other parts depend on:
- Scoring: each zap is worth `10 × multiplier()`, where the multiplier is ×1 to ×4, going up one step for every 5 correct answers in a row. Clearing wave n gives `20 × n` points, plus 50 for a perfect wave, and a heart back (up to `MAX_HEARTS`, 5).
- Gold meteors (not in wave 1) freeze time for 4 s, unless they are the last meteor of the wave.
- At most 5 meteors are on screen at once (4 when `W` < 500).

## Project constraints

From the brief, the game must keep: a clear start screen, instructions, multiple stages, a scoring system, hints for incorrect answers, difficulty that rises across at least three levels, and a final screen with feedback. `README.md` shows where each one is.

From the owner's direction (the four requests that turned the MVP into V1, and the hints in V1.1):

- The game is for pupils, not developers: no settings dashboard and no "Ask Claude" or prompt tools.
- No "Grade 5" / "Grade 6" labels. Difficulty grows through waves, and each wave teaches one skill with a worked example.
- Keep the maths friendly: every answer a whole number of 0 or more, 144 at most (12 × 12), with friendly fractions, decimals (0.5, 0.1, 0.25) and percents (10, 20, 25, 50, 75, 100). Re-run the fuzz after changing `GEN`.
- Keep the cartoon look and avoid generic "AI slop" UI: thick ink outlines, hard offset shadows, the Fredoka font, and the existing colours.
- Hints must point at a specific meteor and help the pupil get there without giving the answer away. `countIn()` stops counting before the answer for this reason. Keep hint text short (about 50 characters at most) so the canvas bubble, which wraps at 270 px, stays small.
- Text is short and friendly for 9–12 year olds, in the tone of the existing lines ("Oops!", "Nice!").
- Keep it a single file that runs when double-clicked. Its only network use is the Google Fonts link for Fredoka, which falls back to a system rounded font offline. Don't add CDNs.
- Check phone width (about 375 px) as well as desktop after any layout or canvas change.
