/*
 * How Momo guesses: it compares the new snack with every example it was
 * shown, and picks the one that looks most alike.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Art, INK, PINK, Tokens } from "../momo";
import { BEAT, CLAMP, EXAMPLES, GLIDE, MATCH, SPOT } from "../story";

// The line from the new snack to an example, stopping short of both.
const between = (to: [number, number]) => {
  const dx = to[0] - SPOT.x;
  const dy = to[1] - SPOT.y;
  const length = Math.hypot(dx, dy);
  return {
    x1: SPOT.x + (dx / length) * 62,
    y1: SPOT.y + (dy / length) * 62,
    x2: to[0] - (dx / length) * 62,
    y2: to[1] - (dy / length) * 62,
  };
};

// A loop around the chosen example, a little wobbly, as if drawn with a crayon.
const loop = (centre: [number, number]) => {
  const points: number[][] = [];
  for (let i = 0; i <= 26; i++) {
    const angle = -2.2 + (i / 24) * Math.PI * 2;
    const wobble = 1 + 0.05 * Math.sin(angle * 2 + 1) + 0.0035 * i;
    points.push([centre[0] + Math.cos(angle) * 58 * wobble, centre[1] + Math.sin(angle) * 53 * wobble]);
  }
  return Art.smooth(points, false);
};

export const Thinking: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame < BEAT.test || frame > BEAT.bite3 + 4) return null;
  const chosen = MATCH.plate as [number, number];
  const match = between(chosen);
  const reach = interpolate(frame, [BEAT.match, BEAT.match + 12], [0, 1], { ...CLAMP, easing: GLIDE });
  const end = { x: match.x1 + (match.x2 - match.x1) * reach, y: match.y1 + (match.y2 - match.y1) * reach };
  const fade = interpolate(frame, [BEAT.bite3 - 4, BEAT.bite3 + 4], [1, 0], CLAMP);
  return (
    <>
      {/* The little mat the new snack waits on. */}
      <div
        style={{
          position: "absolute",
          left: SPOT.x - 78,
          top: SPOT.y - 40,
          width: 156,
          height: 108,
          border: "3px dashed rgba(59, 42, 79, 0.42)",
          borderRadius: "50% 50% 48% 52% / 52% 48% 52% 48%",
          background: "rgba(255, 252, 242, 0.55)",
          opacity: fade,
          scale: String(interpolate(frame, [BEAT.test, BEAT.test + 10], [0.6, 1], { ...CLAMP, easing: GLIDE })),
          zIndex: 4,
        }}
      />
      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: "absolute", left: 0, top: 0, zIndex: 25, opacity: fade }}>
        {EXAMPLES.map((example, i) => (
          <line
            key={i}
            {...between(example.plate as [number, number])}
            stroke={INK}
            strokeWidth={3.4}
            strokeDasharray="1 11"
            strokeLinecap="round"
            opacity={interpolate(frame, [BEAT.scan + i * 6, BEAT.scan + i * 6 + 6, BEAT.match - 4, BEAT.match + 2], [0, 0.5, 0.5, 0], CLAMP)}
          />
        ))}
        {frame >= BEAT.match ? (
          <>
            <line x1={match.x1} y1={match.y1} x2={end.x} y2={end.y} stroke={INK} strokeWidth={12} strokeLinecap="round" />
            <line x1={match.x1} y1={match.y1} x2={end.x} y2={end.y} stroke={PINK} strokeWidth={6.5} strokeLinecap="round" />
          </>
        ) : null}
        <path
          d={loop(chosen)}
          fill="none"
          stroke={Tokens.color.pinkDeep}
          strokeWidth={5.5}
          strokeLinecap="round"
          strokeDasharray={460}
          strokeDashoffset={interpolate(frame, [BEAT.match + 10, BEAT.match + 24], [460, 0], { ...CLAMP, easing: GLIDE })}
          opacity={frame >= BEAT.match + 10 ? 1 : 0}
        />
      </svg>
    </>
  );
};
