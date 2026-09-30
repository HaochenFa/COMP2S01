import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Art, BIG_BERRY, BURR, GREEN_BERRY, INK, PINK, PURPLE_BURR } from "../momo";
import { CLAMP, Momo, Piece, POP, Snack, Stage } from "../parts";

// The last picture matches the game's start screen, so the video leads straight into playing.
export const Title: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Stage>
      <Piece
        html={Art.logo()}
        left={84}
        top={150}
        style={{
          transformOrigin: "30% 60%",
          scale: interpolate(frame, [4, 24], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 84,
          top: 444,
          padding: "15px 40px 9px",
          border: `5px solid ${INK}`,
          borderRadius: 48,
          background: PINK,
          boxShadow: `0 8px 0 ${INK}`,
          fontSize: 46,
          fontWeight: 800,
          lineHeight: 1.2,
          transformOrigin: "20% 50%",
          scale: interpolate(frame, [36, 54], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
        }}
      >
        Can you teach Momo?
      </div>

      <Piece html={Art.computer(450)} left={750} top={216} />
      <div style={{ position: "absolute", left: 819, top: 56, width: 312, height: 412, overflow: "hidden" }}>
        <Momo
          mood={frame < 30 ? "wow" : "cheer"}
          size={360}
          x={156}
          y={419}
          shadow={false}
          style={{
            translate: interpolate(frame, [10, 34], ["0px 340px", "0px 0px"], { ...CLAMP, easing: POP }),
          }}
        />
      </div>
      <Snack
        snack={BIG_BERRY}
        mark="yum"
        x={792}
        y={584}
        style={{ scale: interpolate(frame, [22, 38], [0, 1.5], { ...CLAMP, easing: POP, output: "perceptual-scale" }) }}
      />
      <Snack
        snack={BURR}
        mark="yuck"
        x={1188}
        y={594}
        style={{ scale: interpolate(frame, [28, 44], [0, 1.5], { ...CLAMP, easing: POP, output: "perceptual-scale" }) }}
      />
      <Snack
        snack={GREEN_BERRY}
        mark="yum"
        x={948}
        y={640}
        style={{ scale: interpolate(frame, [34, 50], [0, 1.5], { ...CLAMP, easing: POP, output: "perceptual-scale" }) }}
      />
      <Snack
        snack={PURPLE_BURR}
        mark="yuck"
        x={1198}
        y={164}
        style={{ scale: interpolate(frame, [40, 56], [0, 1.5], { ...CLAMP, easing: POP, output: "perceptual-scale" }) }}
      />
    </Stage>
  );
};
