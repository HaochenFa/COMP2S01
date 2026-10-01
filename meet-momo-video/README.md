# Meet Momo (intro video)

The 41 second video behind the "Meet Momo" button on the game's start screen.

It is made with [Remotion](https://www.remotion.dev). Momo, the snacks, the
colours, the fonts, the paper grain and the sounds all come from the game's
own files in `../momo-learns-to-munch`, so the video always matches the game.

```bash
npm install
npm run assets   # copies the fonts and grain, and makes the sound files
npm run dev      # preview and edit in the browser
npm run render   # writes ../momo-learns-to-munch/media/meet-momo.mp4 and its poster, meet-momo.jpg
```

## How it is put together

The film is one continuous shot of a long picnic blanket. The camera starts at
the top (Momo's computer), follows Momo down to the middle (snacks and plates)
and then down again to the title.

| File | What it holds |
|---|---|
| `src/story.ts` | Where everything is and when everything happens. **Change timing here.** |
| `src/lines.json` | The words Momo says. `npm run assets` makes a chirpy voice for each line. |
| `src/MeetMomo.tsx` | The camera, the order things are drawn in, and every sound. |
| `src/actors/` | One file for each thing in the film: Momo, the snacks, the plates and hand, and so on. |
| `src/parts.tsx` | Shared pieces: the blanket and camera, a snack, Momo, a speech bubble. |
| `src/momo.ts` | The bridge to the game's drawings and colours. |

After changing anything, run `npm run assets` again if you changed
`lines.json` or the game's sounds, then `npm run render`.
