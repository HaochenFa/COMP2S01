# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A monorepo holding all of the owner's COMP2S01 coursework. Each assignment lives in its own top-level folder and is independent of the others; there is no shared tooling at the root.

- `hw1-momo/`: Homework 1, the *Momo Learns to Munch* game and its Remotion intro video. Read `hw1-momo/CLAUDE.md` before changing anything there; its commands are run from `hw1-momo/`.
- `inclass1-math-meteor-defense/`: an in-class assignment, a single-file HTML mini-game for Grade 5/6 pupils (CSS and JS inline, no build, no tests). Open `math-meteor-defense.html` in a browser to play. Its only network use is the Fredoka font from Google Fonts (offline it falls back to a system font). Best score and furthest wave are saved in `localStorage` under `mmd2-` keys. `math-meteor-defense-mvp.html` is the first version, kept unchanged for the before-and-after demo (it uses the `mmd-best` key); don't edit it. Each problem from `GEN` carries its own `hints`, `why` and `traps`, which drive the wrong-answer hints. The folder's `README.md` maps the game to the HW1 brief and records MVP → V1 → V1.1.

## Conventions

- New coursework goes in a new top-level folder (`hwN-<name>/` for assignments, `inclassN-<name>/` for in-class work), with its own `README.md`, and a `CLAUDE.md` if it needs one.
- Versions that must stay recoverable (e.g. for presentations) are marked with annotated git tags named `<prefix>-v<version>`, such as `hw1-v0` and `hw1-v0.1`. Existing tags are listed in the root `README.md`.
- `.gitignore` is shared at the root; ignore entries for one project use that project's folder path.
