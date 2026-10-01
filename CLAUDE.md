# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A monorepo holding all of the owner's COMP2S01 coursework. Each assignment lives in its own top-level folder and is independent of the others; there is no shared tooling at the root.

- `hw1-momo/`: Assignment 1, the *Momo Learns to Munch* game and its Remotion intro video. Its own `CLAUDE.md` has the details; commands there are run from `hw1-momo/`.
- `inclass1-math-meteor-defense/`: an in-class assignment, a self-contained single HTML file mini-game for Grade 5/6 pupils. Open the HTML file in a browser to play.

## Conventions

- New coursework goes in a new top-level folder (`hwN-<name>/` for assignments, `inclassN-<name>/` for in-class work), with its own `README.md`, and a `CLAUDE.md` if it needs one.
- Versions that must stay recoverable (e.g. for presentations) are marked with annotated git tags named `<prefix>-v<version>`, such as `hw1-v0` and `hw1-v0.1`. Existing tags are listed in the root `README.md`.
- `.gitignore` is shared at the root; ignore entries for one project use that project's folder path.
