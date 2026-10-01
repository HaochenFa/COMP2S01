/*
 * The top of the blanket: Momo's computer, and the words "Meet Momo!".
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Art, Tokens } from "../momo";
import { Piece } from "../parts";
import { BEAT, CLAMP, COMPUTER, POP } from "../story";

// Each letter pops in a moment after the one before it.
const letters = (frame: number, from: number) => (letter: number) =>
  interpolate(frame, [from + letter * 3, from + letter * 3 + 14], [0, 1], { ...CLAMP, easing: POP });

export const Opening: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame > BEAT.land + 10) return null;
  // The computer gives a little jump as it switches on, and as Momo leaps out of it.
  const jolt =
    interpolate(frame, [BEAT.screenOn, BEAT.screenOn + 4, BEAT.screenOn + 10], [0, -10, 0], CLAMP) +
    interpolate(frame, [BEAT.leap, BEAT.leap + 4, BEAT.leap + 12], [0, 12, 0], CLAMP);
  const glow = interpolate(frame, [BEAT.screenOn, BEAT.screenOn + 8], [0, 1], CLAMP);
  const k = COMPUTER.width / 300; // the computer is drawn 300 units wide
  return (
    <>
      <Piece html={Art.words("Meet", 164, { id: "meet", pop: letters(frame, BEAT.meet) })} left={146} top={-512} style={{ rotate: "-5deg" }} />
      <Piece html={Art.words("Momo!", 164, { id: "name", pop: letters(frame, BEAT.momoWord) })} left={62} top={-360} style={{ rotate: "-3deg" }} />
      <Piece html={Art.computer(COMPUTER.width)} left={COMPUTER.left} top={COMPUTER.top + jolt} style={{ zIndex: 6 }} />
      {/* The screen lights up just before Momo appears. */}
      <div
        style={{
          position: "absolute",
          left: COMPUTER.left + 49 * k,
          top: COMPUTER.top + jolt + 39 * k,
          width: 202 * k,
          height: 124 * k,
          borderRadius: 30,
          background: `radial-gradient(ellipse at 50% 70%, ${Tokens.color.white}, ${Tokens.color.snack.purple})`,
          opacity: 0.5 * glow,
          zIndex: 7,
        }}
      />
    </>
  );
};
