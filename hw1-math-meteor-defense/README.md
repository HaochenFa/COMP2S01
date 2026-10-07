# Math Meteor Defense

Homework 1 (Digital Product Development and Peer Improvement): a maths game
for pupils aged 9 to 12. Meteors with sums on them fall
towards a city. Type the answer and press Enter to zap the meteor before
it hits.

## Play it

Double-click a file to open it in Chrome, Edge, Safari or Firefox. Nothing
needs installing.

| File | What it is |
|---|---|
| `math-meteor-defense.html` | The game (V1.1). |
| `math-meteor-defense-mvp.html` | The first version (MVP), kept for the before-and-after. |
| `presentation-script.docx` | The script for the live demo: what to do, what to say, and screenshots of each step. |
| `CLAUDE.md` | Notes for working on the code with Claude Code. |

The game loads its font, Fredoka, from Google Fonts. Without internet it
uses a system rounded font and still plays. The MVP needs no network.

Best score, furthest wave and unlocked waves are saved in the browser
(`localStorage`, keys starting `mmd2-`). The MVP saves only its best score
(`mmd-best`).

## How the game meets the brief

Checked against the Pair B list in
[`HW1_Digital-Product-Dev.docx`](../hw1-momo/HW1_Digital-Product-Dev.docx).

| The brief asks for | Where it is |
|---|---|
| Educational, for Grade 5 or 6 (English, Science, Maths or AI literacy) | Maths: times tables, division, fractions, decimals, percents, order of operations |
| Scoring for correct answers | 10 points a zap, a streak multiplier (×2 after 5 in a row, up to ×4), and a bonus for each cleared wave |
| Hints for incorrect answers | A wrong answer puts a hint bubble on the meteor the player meant and slows that meteor down (see V1.1 below) |
| Difficulty that rises over at least three levels | 7 waves, each adding one skill and falling a little faster, then an endless storm that speeds up |
| A clear start screen | Logo, Play button, wave picker, speed (Relaxed / Normal / Fast) and sound |
| Instructions | One line on the start screen, a "New skill" card with a worked example before every wave, and a line at the bottom of the page about typing and pausing |
| Multiple stages | Waves; clearing one unlocks the next on the start screen |
| A final screen with feedback | "Bonk!": points, meteors zapped, % right, best score, and "Remember these" with the last three missed sums and why |

## From MVP to V1.1

| | MVP | V1 | V1.1 |
|---|---|---|---|
| How it was made | With Claude's `/playground` skill | Four follow-up requests from the team | Adds the brief's "hints for incorrect answers" |
| Where to find it | `math-meteor-defense-mvp.html` | git tag `hw1-meteor-v1` | `math-meteor-defense.html` (git tag `hw1-meteor-v1.1`) |

### MVP: a settings playground

- A dark dashboard: a sidebar of presets, topic chips, speed, spawn-rate,
  shield and timer sliders, and number size.
- Presets named by grade: "Grade 5 Mix", "Grade 6 Challenge".
- An "Ask Claude to tweak this game" box that turned the settings into a
  prompt to copy. This was for the developer, not the pupil.
- Levels went up every 8 zaps, but only got faster; no new content.
- How hard the sums were came from a "number size" setting, not from
  progress. "Big" gave sums that are too hard for the age group, like
  27 × 9 or 75% of 280.
- A wrong answer said only "No meteor has the answer N. Try again!"

### V1: the polished game

The team asked for four things. What changed for each:

1. **Remove "Ask Claude".** The prompt box and the whole settings sidebar
   are gone. The only choices left are the start wave, the speed and the sound.
2. **No Grade 5 / Grade 6 labels; difficulty grows with levels.** 7 named
   waves, each teaching one skill with a "New skill" card and a worked
   example before it starts:
   Warm-up (times tables) → Share it out (division) → Slice it up
   (fractions) → Point power (decimals) → Percent party (percents) →
   Order up! (order of operations) → Meteor storm (everything mixed, then
   endless). Clearing a wave unlocks it, so pupils can go back and
   practise one topic.
3. **Easier sums.** Numbers start small and grow only in later waves.
   Times tables go up to 12 × 12, with friendly fractions
   ("3/4 of 20"), decimals (0.5, 0.1, 0.25) and percents (10%, 25%, 50%,
   75%). Every answer is a whole number, 144 at most.
4. **Less "AI slop", keep the cartoon feel.** A hand-drawn cartoon look:
   one "game console" frame with thick ink outlines and hard shadows, the
   Fredoka font, a sunset sky with a ringed planet, a colourful city,
   rocky meteors with flame tails and answer stickers that turn red and
   wobble near the city, a googly-eyed laser turret that watches the
   lowest meteor, and comic "ZAP!" / "BONK!" bursts.

Also in V1:

- Hearts instead of shields; clearing a wave gives one back, and a perfect
  wave earns +50 bonus.
- A gold meteor freezes time for 4 seconds.
- Each missed meteor shows its answer, and the game-over screen lists the
  last three under "Remember these".
- Works on phones: an on-screen number pad, a two-row top bar, and
  meteors that shrink to fit.

### V1.1: hints for wrong answers

V1's wrong-answer message ("No meteor has the answer N. Check again!") was
not a hint, so V1.1 adds real ones:

- **It picks the meteor you meant.** First it looks for a common mistake
  it recognises, then for a close answer (54 for 56), and otherwise it
  takes the lowest meteor.
- **That meteor gets a hint bubble and falls at half speed for 5 seconds**,
  giving the pupil time to think. Only one hint shows at a time. Its
  sticker turns mint so it is easy to spot.
- **The help grows on each try:** first a nudge, then a bigger step.
  For example, for 81 ÷ 9:
  1. "What times 9 makes 81?"
  2. "Count in 9s: 9, 18, 27… until you reach 81."

  For (3 + 4) × 2:
  1. "Brackets first: what is 3 + 4?"
  2. "3 + 4 = 7. Now times 2."
- **It names common mistakes:**
  - 11 for 9 × 2: "That's 9 + 2. This one is times (×)!"
  - 20 for 8 + 2 × 2: "You did + first. Do × first!"
  - 7 for 2/5 of 35: "That's just 1/5. You need 2 parts!"
- **Misses explain why.** A meteor that hits the city now says, for
  example, "Oops! 6 − 12 ÷ 4 = 3, 12 ÷ 4 = 3 first." The "Remember these"
  list shows the same reason. Times-table misses still show only the
  answer.
- The start screen says: "Got one wrong? The meteor slows down and shows
  you a hint."

## Suggested demo order

The brief does not ask for this; it is a suggested order for a no-slides
demo.

1. Open `math-meteor-defense-mvp.html`: the dashboard, the grade presets,
   the "Ask Claude" box, a hard sum, and a wrong answer that only says
   "Try again!".
2. Open `math-meteor-defense.html`: the start screen, then the wave 1
   "New skill" card.
3. Play a little, then type a wrong answer on purpose. The hint bubble
   appears and the meteor slows. Type another wrong answer to get the
   bigger hint.
4. Type a common mistake (e.g. the sum instead of the product) to show
   the matching message.
5. Let meteors hit the city to reach the "Bonk!" screen and its
   "Remember these" list.

To show the game exactly as it was at V1:

```bash
git checkout hw1-meteor-v1
```

At that tag the folder still has its old name, `inclass1-math-meteor-defense/`.
Come back with `git checkout main`.
