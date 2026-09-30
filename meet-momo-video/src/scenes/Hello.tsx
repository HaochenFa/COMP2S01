import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Art, Mood } from "../momo";
import { BigWords, CLAMP, Momo, Piece, POP, Stage } from "../parts";

// Momo pops out of its computer and says hello.
export const Hello: React.FC = () => {
  const frame = useCurrentFrame();
  const mood: Mood = frame < 46 ? "wow" : frame < 92 ? "happy" : "idle";

  return (
    <Stage>
      <Piece html={Art.computer(500)} left={390} top={195} />
      {/* Momo is hidden below the bottom edge of the screen until it pops up. */}
      <div style={{ position: "absolute", left: 466.7, top: -80, width: 346.7, height: 555, overflow: "hidden" }}>
        <Momo
          mood={mood}
          size={380}
          x={173.3}
          y={562}
          shadow={false}
          style={{
            translate: interpolate(frame, [18, 46], ["0px 360px", "0px 0px"], { ...CLAMP, easing: POP }),
          }}
        />
      </div>
      <BigWords
        text="Meet Momo!"
        size={112}
        width={900}
        style={{
          position: "absolute",
          left: 190,
          top: 36,
          scale: interpolate(frame, [50, 70], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
        }}
      />
    </Stage>
  );
};
