# Momo Learns to Munch

A game for Grade 5 and 6 pupils about how machines learn. The player teaches
Momo, a tiny AI, which snacks are yum and which are yuck by showing it
examples. Then Momo guesses new snacks by itself.

Made for Assignment 1 (Digital Product Development and Peer Improvement),
Pair B: the interactive educational AI game.

## Play it

Open `momo-learns-to-munch/index.html` in Chrome, Edge, Safari or Firefox.
It needs no internet and nothing installed.

When presenting, add `?level=2` or `?level=3` to the end of the address to
jump straight to a level.

## What is in this folder

| Folder | What it is |
|---|---|
| `momo-learns-to-munch/` | The game. This is the product. |
| `meet-momo-video/` | The source of the intro video ("Meet Momo" on the start screen). |
| `v1-screenshots/` | Pictures of Version 1.0, for the before-and-after in the presentation. |

Inside the game folder:

| File | What it does |
|---|---|
| `index.html` | The page you open. |
| `js/levels.js` | The levels. **Edit this to change or add a level.** |
| `js/brain.js` | How Momo learns and guesses. |
| `js/game.js` | The screens, dragging, scoring and hints. |
| `js/art.js` | Every drawing: Momo, the snacks, the plates. |
| `js/sound.js` | Every sound. |
| `js/tokens.js` | The colours, line weights and fonts, in one place. |
| `css/game.css` | How everything is laid out. |
| `img/grain.png` | Paper grain laid over the whole game. Made by `tools/make-grain.js`. |
| `media/meet-momo.mp4` | The intro video. `meet-momo.jpg` is the picture shown before it plays. |
| `tools/check-levels.js` | Tests the levels without opening the game. |
| `tools/art-sheet.html` | Shows every drawing on one page. |
| `tools/make-grain.js` | Makes `img/grain.png`. |

## How the game meets the brief

| The brief asks for | Where it is |
|---|---|
| Educational, for Grade 5 or 6, about AI literacy | Three discoveries about machine learning, one per level |
| A clear start screen | Title, Play button and the "Meet Momo" video |
| Instructions | The "How to play" screen, the `?` button, a pointing hand on level 1, and the "Meet Momo" video |
| Multiple stages | Three levels: First bites, Look-alikes, Lopsided lunchbox |
| A scoring system | 10 points for each snack Momo guesses right, and up to 3 stars per level. Momo's sprout grows with each level it learns |
| Hints for incorrect answers | Momo says why it guessed wrong ("It is green, like this one…") and what confused it, then the most helpful snacks glow |
| Difficulty that rises over three levels | Different colours, then look-alikes, then lopsided examples |
| A final screen with feedback | "Momo's report card" with stars, score and what was discovered |
| Simple "AI logic" | Momo really learns: it compares each new snack with the examples it was shown |

## How Momo learns

Momo keeps every example it is shown. To guess a new snack it finds the
example that looks most alike, by colour, size and spikiness, and copies that
example's plate. This is a real method called "nearest neighbour". Nothing is
scripted: if the player puts snacks on the wrong plates, Momo learns the wrong
thing.

The player can smell the snacks (little hearts mean yum, stink lines mean
yuck) but Momo can only look. When Momo guesses "yum" it eats the snack, so a
wrong guess is easy to see: Momo spits a yucky snack straight back out.

## Change or add a level

1. Open `momo-learns-to-munch/js/levels.js`.
2. Copy one level block and change its snacks. The notes at the top of the
   file explain each part.
3. Run the checker to see whether the level can be won:

   ```bash
   node momo-learns-to-munch/tools/check-levels.js
   ```

## Rebuild the intro video

The video is made with Remotion and draws Momo with the game's own art file,
so it always matches the game.

```bash
cd meet-momo-video
npm install
npm run assets
npm run render
```

`npm run dev` opens the video editor for previewing changes.

## Credits

The fonts are Bagel Fat One and Grandstander, both free under the SIL Open
Font License (copies are in `momo-learns-to-munch/fonts/`). All drawings,
sounds and the paper grain are made by the code in this folder.
