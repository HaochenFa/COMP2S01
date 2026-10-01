/*
 * Everything Momo says, as speech bubbles. The words are in lines.json,
 * which also makes Momo's chirpy voice for each line.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Art, Lines } from "../momo";
import { Bubble, Piece } from "../parts";
import { BEAT, CLAMP, FINALE, HOME, LENGTH, POP } from "../story";

// Just above Momo's sprout.
const ABOVE = HOME.y - HOME.size * 0.9;

export const Speech: React.FC = () => {
  const frame = useCurrentFrame();
  const puzzled = (at: number) =>
    interpolate(frame, [at, at + 14], [0, 1], { ...CLAMP, easing: POP }) * interpolate(frame, [BEAT.show - 4, BEAT.show], [1, 0], CLAMP);
  return (
    <>
      <Bubble from={BEAT.hi} until={BEAT.hiEnd} x={HOME.x} bottom={ABOVE} width={430}>{Lines.hi}</Bubble>
      <Bubble from={BEAT.ooh} until={BEAT.oohEnd} x={HOME.x} bottom={ABOVE - 26}>{Lines.snacks}</Bubble>
      <Bubble from={BEAT.yum1} until={BEAT.yum1End} x={HOME.x} bottom={ABOVE - 26} shout>Yum!</Bubble>
      <Bubble from={BEAT.bleh} until={BEAT.blehEnd} x={HOME.x} bottom={ABOVE} shout>Bleh!</Bubble>
      <Bubble from={BEAT.smell} until={BEAT.smellEnd} x={HOME.x} bottom={ABOVE} width={440}>{Lines.smell}</Bubble>
      <Bubble from={BEAT.show} until={BEAT.showEnd} x={HOME.x} bottom={ABOVE - 26} width={440}>{Lines.show}</Bubble>
      <Bubble from={BEAT.learn + 6} until={BEAT.learnEnd} x={HOME.x} bottom={ABOVE - 26}>{Lines.learning}</Bubble>
      <Bubble from={BEAT.turn} until={BEAT.turnEnd} x={HOME.x} bottom={ABOVE - 12}>{Lines.turn}</Bubble>
      <Bubble from={BEAT.alike} until={BEAT.alikeEnd} x={HOME.x} bottom={ABOVE - 12} width={430}>{Lines.alike}</Bubble>
      <Bubble from={BEAT.bite3 - 6} until={BEAT.yum3 + 30} x={HOME.x} bottom={ABOVE - 12} shout>Yum!</Bubble>
      <Bubble from={BEAT.teach} until={LENGTH + 10} x={FINALE.x - 20} bottom={FINALE.y - FINALE.size * 0.92}>{Lines.teach}</Bubble>

      {/* Momo is puzzled: it cannot tell which snacks are yum. */}
      {frame >= BEAT.smell + 30 && frame < BEAT.show ? (
        <>
          <Piece html={Art.words("?", 120, { id: "puzzle-1" })} left={HOME.x - 262} top={HOME.y - 282} style={{ rotate: "-14deg", scale: String(puzzled(BEAT.smell + 30)), zIndex: 21 }} />
          <Piece html={Art.words("?", 96, { id: "puzzle-2" })} left={HOME.x + 150} top={HOME.y - 268} style={{ rotate: "12deg", scale: String(puzzled(BEAT.smell + 38)), zIndex: 21 }} />
        </>
      ) : null}
    </>
  );
};
