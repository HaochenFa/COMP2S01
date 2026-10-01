/*
 * The bridge to the game. Momo, the snacks, the colours and the fonts all
 * come straight from momo-learns-to-munch, so the video always matches it.
 */
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

declare const require: (id: string) => unknown;

export type SnackData = { color: string; size: number; spike: number };
export type Mark = "yum" | "yuck" | null;
export type Mood =
  | "idle"
  | "blink"
  | "happy"
  | "cheer"
  | "yum"
  | "aah"
  | "chew"
  | "yuck"
  | "bleh"
  | "think"
  | "oops"
  | "sad"
  | "wow";

export type MomoOptions = {
  look?: [number, number];
  shadow?: boolean;
  grow?: number; // how much the sprout has grown, 0 to 3
  arms?: [number, number]; // how far each arm is lifted, in degrees
  sway?: number; // how far the sprout leans, in degrees
};

type Css = { backgroundColor: string; backgroundImage: string; backgroundSize: string };

type ArtApi = {
  snack(data: SnackData, mark?: Mark, phase?: number): string;
  markOnly(data: SnackData, mark: Mark, phase?: number): string;
  momo(mood: Mood, size: number, options?: MomoOptions): string;
  arms(mood: Mood): [number, number];
  plate(width: number, height: number, kind?: "yum" | "yuck"): string;
  flag(kind: "yum" | "yuck", size?: number): string;
  logo(): string;
  words(text: string, size: number, options?: { id?: string; pop?: (letter: number) => number }): string;
  computer(width: number): string;
  hand(size: number): string;
  tail(size: number): string;
  fly(size: number): string;
  icon(name: string, size: number): string;
  smooth(points: number[][], closed: boolean): string;
  cloth(cell: number): Css;
  meadow(scale: number): Css;
};

type TokensApi = {
  color: {
    ink: string;
    white: string;
    shade: string;
    pink: string;
    pinkDeep: string;
    gold: string;
    snack: { blue: string; green: string; tangerine: string; purple: string };
  };
  font: { display: string; body: string };
};

export const Tokens = require("../../momo-learns-to-munch/js/tokens.js") as TokensApi;
export const Art = require("../../momo-learns-to-munch/js/art.js") as ArtApi;
export const Lines = require("./lines.json") as Record<
  "hi" | "snacks" | "smell" | "show" | "learning" | "turn" | "alike" | "teach",
  string
>;

export const INK = Tokens.color.ink;
export const WHITE = Tokens.color.white;
export const PINK = Tokens.color.pink;
export const SOFT = "rgba(59, 42, 79, 0.16)";

const font = (family: string, file: string, weight: string) =>
  loadFont({ family, url: staticFile("fonts/" + file), weight });

Promise.all([
  font("Bagel Fat One", "bagel-fat-one-latin-400-normal.woff2", "400"),
  font("Grandstander", "grandstander-latin-500-normal.woff2", "500"),
  font("Grandstander", "grandstander-latin-700-normal.woff2", "700"),
  font("Grandstander", "grandstander-latin-800-normal.woff2", "800"),
]).catch((error) => console.error("Could not load the fonts", error));
