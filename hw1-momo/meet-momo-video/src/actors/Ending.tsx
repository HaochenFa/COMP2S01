/*
 * Further down the blanket: the game's name, laid out like the game's start
 * screen so that the video leads straight into playing.
 */
import React from "react";
import { interpolate, random, useCurrentFrame } from "remotion";
import { Art, INK, Tokens } from "../momo";
import { Piece, Snack } from "../parts";
import { BEAT, CLAMP, DOWN, POP } from "../story";

const pop = (frame: number, at: number) => interpolate(frame, [at, at + 16], [0, 1], { ...CLAMP, easing: POP });

export const Ending: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < BEAT.leap2 - 10) return null;
  return (
    <>
      <Piece html={Art.logo()} left={78} top={DOWN + 96} style={{ transformOrigin: "30% 60%", scale: String(pop(frame, BEAT.logo)), rotate: "-1deg" }} />
      <div
        style={{
          position: "absolute",
          left: 78,
          top: DOWN + 396,
          width: 540,
          fontSize: 31,
          lineHeight: 1.3,
          opacity: interpolate(frame, [BEAT.logo + 14, BEAT.logo + 24], [0, 1], CLAMP),
          translate: `0px ${interpolate(frame, [BEAT.logo + 14, BEAT.logo + 26], [14, 0], CLAMP)}px`,
        }}
      >
        Teach a tiny AI which snacks are yum and which are yuck.
      </div>
      <Piece html={Art.plate(336, 188, "yum")} left={706} top={DOWN + 480} style={{ zIndex: 22 }} />
      <Snack snack={{ color: "green", size: 0.55, spike: 0 }} mark="yum" x={832} y={DOWN + 540} scale={1.5} style={{ zIndex: 23 }} />
      <Snack snack={{ color: "blue", size: 0.35, spike: 0 }} mark="yum" x={944} y={DOWN + 564} scale={1.5} style={{ zIndex: 23 }} />
      <Snack snack={{ color: "tangerine", size: 0.7, spike: 0.85 }} mark="yuck" x={1198} y={DOWN + 590} scale={1.6} style={{ zIndex: 23 }} />
    </>
  );
};

// Confetti for the ending. It falls in front of everything and does not move with the camera.
const COLORS = [
  Tokens.color.pink,
  Tokens.color.gold,
  Tokens.color.snack.blue,
  Tokens.color.snack.green,
  Tokens.color.snack.purple,
  Tokens.color.snack.tangerine,
  Tokens.color.white,
];

export const Confetti: React.FC = () => {
  const frame = useCurrentFrame();
  const start = BEAT.land2 - 4;
  if (frame < start) return null;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 1280, height: 720, scale: "1.5", transformOrigin: "0 0" }}>
      {new Array(56).fill(0).map((_, i) => {
        const delay = random(`delay-${i}`) * 28;
        const time = 54 + random(`time-${i}`) * 30;
        const t = (frame - start - delay) / time;
        if (t < 0 || t > 1) return null;
        const wide = 10 + random(`size-${i}`) * 10;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: random(`x-${i}`) * 1280 + (random(`drift-${i}`) - 0.5) * 240 * t + Math.sin(t * 9 + i) * 10,
              top: -30 + 790 * t * (0.55 + 0.45 * t),
              width: wide,
              height: wide * (0.8 + random(`tall-${i}`) * 0.9),
              background: COLORS[i % COLORS.length],
              border: `2px solid ${INK}`,
              borderRadius: "4px 7px 5px 8px",
              rotate: `${(random(`spin-${i}`) - 0.5) * 900 * t}deg`,
            }}
          />
        );
      })}
    </div>
  );
};
