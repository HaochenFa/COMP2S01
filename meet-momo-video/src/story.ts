/*
 * The story of the video in one place: where things are, and when things happen.
 *
 * The whole film is one long picnic blanket. The camera starts at the top of
 * it (where Momo's computer sits), follows Momo down to the middle (where the
 * snacks and plates are), and at the end follows Momo down again to the title.
 *
 * Places are in the game's stage units: the camera sees 1280 x 720 of them.
 * Times are frame numbers, at 30 frames a second.
 */
import { Easing } from "remotion";
import { SnackData } from "./momo";

export const FPS = 30;
export const LENGTH = 1230;

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const POP = Easing.spring({ damping: 11 });
export const GLIDE = Easing.bezier(0.4, 0, 0.2, 1);
export const LAND = Easing.bezier(0.2, 0.8, 0.3, 1);

/* ---- Places ---- */

// The computer, at the top of the blanket.
export const COMPUTER = { left: 640, top: -540, width: 540 };
export const SCREEN = { x: 910, bottom: -245 }; // the middle and the bottom edge of its screen
export const IN_SCREEN = { x: 910, y: -212, size: 370 }; // Momo, peeking out of the screen

// Where Momo stands for most of the film, and where things are around it.
export const HOME = { x: 640, y: 470, size: 300 };
export const MOUTH = { x: 641, y: 407 };
export const SPOT = { x: 640, y: 600 }; // where a snack waits to be guessed
export const PLATE = { yum: { x: 250, y: 330 }, yuck: { x: 1030, y: 330 } };

// The title, further down the blanket. It is laid out like the game's start screen.
export const DOWN = 720;
export const FINALE = { x: 1017, y: DOWN + 523, size: 410 };

/* ---- Times ---- */

export const BEAT = {
  // Meet Momo
  meet: 10, momoWord: 24, screenOn: 44, popUp: 52, wave: 72, crouch: 100, leap: 106, land: 146,
  // "Hi! I'm Momo. I'm a tiny AI."
  hi: 158, hiEnd: 248,
  // Snacks roll in. Momo eats a yummy one, then a yucky one.
  roll: 252, ooh: 266, oohEnd: 298, bite1: 304, yum1: 342, yum1End: 378, bite2: 384, bleh: 422, blehEnd: 462,
  // "I can't smell. I can only look!"
  smell: 500, marksOff: 520, smellEnd: 592,
  // "But you can! Show me examples."
  show: 600, marksOn: 606, plates: 612, showEnd: 694, hand: 646, learn: 822, learnEnd: 856,
  // Momo guesses a new snack by itself.
  test: 862, turn: 868, turnEnd: 900, scan: 902, match: 934, alike: 938, alikeEnd: 990, bite3: 1000, yum3: 1036, grow2: 1046,
  // The title
  crouch2: 1080, leap2: 1086, logo: 1112, land2: 1124, teach: 1142,
};

// How high Momo's two long leaps down the blanket go.
export const LEAP = 200;
// How long a snack takes to be carried to a plate, or to hop into Momo's mouth.
export const CARRY = 27;
export const GULP = 14;

/* ---- The snacks ---- */

export type Actor = {
  snack: SnackData;
  yum: boolean;
  at: [number, number]; // where it comes to rest on the blanket
  from: number; // which side it rolls in from: -1 left, 1 right
  roll: number; // when it starts rolling in
  plate?: [number, number]; // where it is put on a plate...
  carry?: number; // ...and when
  eaten?: number; // or when Momo eats it
  spat?: number; // and when Momo spits it back out
};

const blue = (size: number): SnackData => ({ color: "blue", size, spike: 0 });
const burr = (size: number, spike: number): SnackData => ({ color: "tangerine", size, spike });

export const SNACKS: Actor[] = [
  { snack: blue(0.85), yum: true, at: [210, 525], from: -1, roll: BEAT.roll + 10, plate: [196, 338], carry: 660 },
  { snack: burr(0.6, 0.85), yum: false, at: [322, 512], from: -1, roll: BEAT.roll + 5, plate: [966, 340], carry: 700 },
  { snack: blue(0.35), yum: true, at: [426, 530], from: -1, roll: BEAT.roll, eaten: BEAT.bite1 },
  { snack: burr(0.4, 0.9), yum: false, at: [858, 530], from: 1, roll: BEAT.roll + 2, eaten: BEAT.bite2, spat: BEAT.bleh },
  { snack: blue(0.55), yum: true, at: [964, 514], from: 1, roll: BEAT.roll + 7, plate: [306, 330], carry: 744 },
  { snack: burr(0.85, 0.8), yum: false, at: [1074, 525], from: 1, roll: BEAT.roll + 12, plate: [1090, 334], carry: 788 },
];

// The examples Momo has been shown, once they are on the plates.
export const EXAMPLES = SNACKS.filter((actor) => actor.plate);
// The new snack Momo guesses, and the example it looks most like.
export const TEST: SnackData = blue(0.5);
export const MATCH = SNACKS[4];

// How big snacks are drawn on the blanket.
export const SNACK_SCALE = 1.4;
