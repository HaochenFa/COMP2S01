import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BERRY, BURR, GREEN_BERRY, Mark, Mood, PURPLE_BURR, SMALL_BERRY, SMALL_BURR, SnackData } from "../momo";
import { Caption, CLAMP, GLIDE, Momo, POP, Snack, Stage } from "../parts";

const EXAMPLES: { snack: SnackData; mark: Mark; x: number; y: number }[] = [
  { snack: BERRY, mark: "yum", x: 810, y: 320 },
  { snack: BURR, mark: "yuck", x: 970, y: 320 },
  { snack: GREEN_BERRY, mark: "yum", x: 1130, y: 320 },
  { snack: PURPLE_BURR, mark: "yuck", x: 810, y: 510 },
  { snack: SMALL_BERRY, mark: "yum", x: 970, y: 510 },
  { snack: SMALL_BURR, mark: "yuck", x: 1130, y: 510 },
];

// Momo is a tiny AI. It learns by looking at examples.
export const TinyAi: React.FC = () => {
  const frame = useCurrentFrame();
  const mood: Mood = frame < 84 ? "happy" : frame < 132 ? "wow" : "idle";

  return (
    <Stage>
      <Momo
        mood={mood}
        size={400}
        x={640}
        y={650}
        look={frame >= 132 ? [6, -1] : undefined}
        style={{
          translate: interpolate(frame, [80, 104], ["0px 0px", "-270px 0px"], { ...CLAMP, easing: GLIDE }),
        }}
      />
      {EXAMPLES.map((example, i) => (
        <Snack
          key={i}
          snack={example.snack}
          mark={example.mark}
          x={example.x}
          y={example.y}
          style={{
            scale: interpolate(frame, [102 + i * 9, 118 + i * 9], [0, 2], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
          }}
        />
      ))}
      <Caption from={6} until={86}>
        Momo is a tiny AI.
      </Caption>
      <Caption from={92} until={176}>
        It learns from examples.
      </Caption>
    </Stage>
  );
};
