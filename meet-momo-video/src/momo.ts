/*
 * The bridge to the game. Momo, the snacks, the colours and the fonts all
 * come straight from momo-learns-to-munch, so the video always matches it.
 */
import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

declare const require: (id: string) => unknown;

export type SnackData = { color: string; size: number; spike: number };
export type Mark = "yum" | "yuck" | null;
export type Mood = "idle" | "happy" | "cheer" | "yum" | "yuck" | "think" | "oops" | "wow" | "blink";

type ArtApi = {
  snack(data: SnackData, mark?: Mark): string;
  momo(mood: Mood, size: number, options?: { look?: [number, number]; shadow?: boolean }): string;
  plate(width: number, height: number): string;
  tray(width: number, height: number): string;
  logo(): string;
  computer(width: number): string;
  hand(size: number): string;
  icon(name: string, size: number): string;
  cloth(cell: number): { backgroundColor: string; backgroundImage: string; backgroundSize: string };
};

type TokensApi = {
  color: { ink: string; cloth: string; white: string; shade: string; pink: string; pinkDeep: string; stink: string };
  font: { display: string; body: string };
};

export const Tokens = require("../../momo-learns-to-munch/js/tokens.js") as TokensApi;
export const Art = require("../../momo-learns-to-munch/js/art.js") as ArtApi;

export const INK = Tokens.color.ink;
export const WHITE = Tokens.color.white;
export const PINK = Tokens.color.pink;
export const SOFT = "rgba(39, 36, 92, 0.16)";

// The snacks that appear in the video.
export const BERRY: SnackData = { color: "blue", size: 0.55, spike: 0 };
export const BIG_BERRY: SnackData = { color: "blue", size: 0.85, spike: 0 };
export const SMALL_BERRY: SnackData = { color: "blue", size: 0.35, spike: 0 };
export const BURR: SnackData = { color: "tangerine", size: 0.6, spike: 0.85 };
export const SMALL_BURR: SnackData = { color: "tangerine", size: 0.35, spike: 0.9 };
export const GREEN_BERRY: SnackData = { color: "green", size: 0.5, spike: 0.05 };
export const PURPLE_BURR: SnackData = { color: "purple", size: 0.5, spike: 0.6 };

const font = (family: string, file: string, weight: string) =>
  loadFont({ family, url: staticFile("fonts/" + file), weight });

Promise.all([
  font("Bagel Fat One", "bagel-fat-one-latin-400-normal.woff2", "400"),
  font("Grandstander", "grandstander-latin-500-normal.woff2", "500"),
  font("Grandstander", "grandstander-latin-700-normal.woff2", "700"),
  font("Grandstander", "grandstander-latin-800-normal.woff2", "800"),
]).catch((error) => console.error("Could not load the fonts", error));
