# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A monorepo holding all of the owner's COMP2S01 coursework. Each assignment lives in its own top-level folder and is independent of the others; there is no shared tooling at the root.

- `hw1-momo/`: Homework 1, the *Momo Learns to Munch* game and its Remotion intro video. Read `hw1-momo/CLAUDE.md` before changing anything there; its commands are run from `hw1-momo/`.
- `hw1-math-meteor-defense/`: Homework 1, the *Math Meteor Defense* game shown in the HW1 presentation, a single-file HTML maths game with its MVP kept beside it. Read `hw1-math-meteor-defense/CLAUDE.md` before changing anything there; its commands are run from `hw1-math-meteor-defense/`. It was first filed as in-class work, so commits before the rename (and the `hw1-meteor-*` tags) have it under `inclass1-math-meteor-defense/`.

## Conventions

- New coursework goes in a new top-level folder (`hwN-<name>/` for assignments, `inclassN-<name>/` for in-class work), with its own `README.md`, and a `CLAUDE.md` if it needs one.
- Versions that must stay recoverable (e.g. for presentations) are marked with annotated git tags named `<prefix>-v<version>`, such as `hw1-v0` and `hw1-v0.1` (Momo) or `hw1-meteor-v1` (Math Meteor Defense, which shares the `hw1` prefix). Existing tags are listed in the root `README.md`.
- `.gitignore` is shared at the root; ignore entries for one project use that project's folder path.
