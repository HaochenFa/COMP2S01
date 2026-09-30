# Meet Momo (intro video)

The 34 second video behind the "Meet Momo" button on the game's start screen.

It is made with [Remotion](https://www.remotion.dev). Momo, the snacks, the
colours, the fonts and the sounds all come from the game's own files in
`../momo-learns-to-munch`, so the video always matches the game.

```bash
npm install
npm run assets   # copies the fonts and makes the sound files
npm run dev      # preview and edit in the browser
npm run render   # writes ../momo-learns-to-munch/media/meet-momo.mp4
```

Each scene is one file in `src/scenes/`. The order, timing and sounds are in
`src/MeetMomo.tsx`.
