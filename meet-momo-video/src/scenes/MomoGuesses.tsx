import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Art, INK, Mood, PINK, SMALL_BERRY, SOFT, Tokens, WHITE } from "../momo";
import { Caption, CLAMP, GLIDE, Momo, POP, Snack, Stage } from "../parts";
import { MOMO_AT, MOVES, Table } from "./ShowExamples";

const TEST = { x: 640, y: 590 };

// A point part of the way along the line from the test snack to an example.
const along = (to: [number, number], startGap: number, endGap: number) => {
  const dx = to[0] - TEST.x;
  const dy = to[1] - TEST.y;
  const length = Math.hypot(dx, dy);
  return {
    x1: TEST.x + (dx / length) * startGap,
    y1: TEST.y + (dy / length) * startGap,
    x2: to[0] - (dx / length) * endGap,
    y2: to[1] - (dy / length) * endGap,
  };
};

// Momo guesses a new snack by finding the example that looks most alike.
export const MomoGuesses: React.FC = () => {
  const frame = useCurrentFrame();
  const mood: Mood = frame < 24 ? "idle" : frame < 88 ? "think" : frame < 118 ? "yum" : "happy";
  const match = along(MOVES[0].to, 50, 46);

  return (
    <Stage>
      <Table />
      <Momo mood={mood} size={210} x={MOMO_AT.x} y={MOMO_AT.y} />
      {MOVES.map((m, i) => (
        <Snack key={i} snack={m.snack} mark={m.mark} x={m.to[0]} y={m.to[1]} />
      ))}

      <div
        style={{
          position: "absolute",
          left: TEST.x - 56,
          top: TEST.y - 46,
          width: 112,
          height: 100,
          borderRadius: "50%",
          border: "4px dashed rgba(39, 36, 92, 0.4)",
        }}
      />

      <svg width={1280} height={720} viewBox="0 0 1280 720" style={{ position: "absolute", left: 0, top: 0 }}>
        {/* First Momo compares the new snack with every example... */}
        {MOVES.map((m, i) => (
          <line
            key={i}
            {...along(m.to, 50, 46)}
            stroke={INK}
            strokeWidth={3}
            strokeDasharray="2 10"
            strokeLinecap="round"
            opacity={interpolate(frame, [30 + i * 6, 36 + i * 6, 60, 66], [0, 0.45, 0.45, 0], CLAMP)}
          />
        ))}
        {/* ...then it picks the one that looks most alike. */}
        <line
          x1={match.x1}
          y1={match.y1}
          x2={interpolate(frame, [64, 78], [match.x1, match.x2], { ...CLAMP, easing: GLIDE })}
          y2={interpolate(frame, [64, 78], [match.y1, match.y2], { ...CLAMP, easing: GLIDE })}
          stroke={INK}
          strokeWidth={12}
          strokeLinecap="round"
          opacity={frame >= 64 ? 1 : 0}
        />
        <line
          x1={match.x1}
          y1={match.y1}
          x2={interpolate(frame, [64, 78], [match.x1, match.x2], { ...CLAMP, easing: GLIDE })}
          y2={interpolate(frame, [64, 78], [match.y1, match.y2], { ...CLAMP, easing: GLIDE })}
          stroke={PINK}
          strokeWidth={6}
          strokeLinecap="round"
          opacity={frame >= 64 ? 1 : 0}
        />
        <circle
          cx={MOVES[0].to[0]}
          cy={MOVES[0].to[1]}
          r={interpolate(frame, [76, 92], [0, 44], { ...CLAMP, easing: POP })}
          fill="none"
          stroke={Tokens.color.pinkDeep}
          strokeWidth={5}
        />
      </svg>

      <Snack
        snack={SMALL_BERRY}
        mark={frame >= 118 ? "yum" : null}
        x={TEST.x}
        y={TEST.y}
        style={{ scale: interpolate(frame, [12, 28], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }) }}
      />
      <div
        style={{
          position: "absolute",
          left: TEST.x + 10,
          top: TEST.y + 10,
          width: 40,
          height: 40,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: `4px solid ${INK}`,
          borderRadius: "50%",
          background: PINK,
          scale: interpolate(frame, [120, 134], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
        }}
        dangerouslySetInnerHTML={{ __html: Art.icon("check", 26) }}
      />

      {/* Momo's speech bubble, like the one in the game. */}
      <div
        style={{
          position: "absolute",
          left: MOMO_AT.x - 100,
          top: 176,
          width: 200,
          display: "flex",
          justifyContent: "center",
          transformOrigin: "50% 130%",
          scale: interpolate(frame, [88, 104], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
        }}
      >
        <div
          style={{
            position: "relative",
            padding: "10px 30px 4px",
            border: `4px solid ${INK}`,
            borderRadius: 28,
            background: WHITE,
            boxShadow: `0 6px 0 ${SOFT}`,
            fontFamily: Tokens.font.display,
            fontWeight: 400,
            fontSize: 44,
            lineHeight: 1.3,
          }}
        >
          Yum!
          <div
            style={{
              position: "absolute",
              left: "50%",
              bottom: -13,
              width: 20,
              height: 20,
              marginLeft: -10,
              background: WHITE,
              borderRight: `4px solid ${INK}`,
              borderBottom: `4px solid ${INK}`,
              borderRadius: "0 0 6px 0",
              rotate: "45deg",
            }}
          />
        </div>
      </div>

      <Caption from={6} until={174}>
        Then Momo guesses by itself!
      </Caption>
    </Stage>
  );
};
