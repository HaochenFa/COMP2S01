import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BERRY, BURR } from "../momo";
import { BigWords, Caption, CLAMP, Momo, PlateName, POP, Snack, Stage } from "../parts";

// Some snacks are yum and some are yuck, but Momo can't smell the difference.
export const CantSmell: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Stage>
      {/* Each snack is drawn twice: plain underneath, and with its sparkles or stink lines on top.
          The top copy fades away to show what Momo sees. */}
      <Snack
        snack={BERRY}
        x={300}
        y={430}
        style={{ scale: interpolate(frame, [8, 26], [0, 2.6], { ...CLAMP, easing: POP, output: "perceptual-scale" }) }}
      />
      <Snack
        snack={BERRY}
        mark="yum"
        x={300}
        y={430}
        style={{
          scale: interpolate(frame, [8, 26], [0, 2.6], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
          opacity: interpolate(frame, [132, 156], [1, 0], CLAMP),
        }}
      />
      <Snack
        snack={BURR}
        x={980}
        y={430}
        style={{ scale: interpolate(frame, [26, 44], [0, 2.6], { ...CLAMP, easing: POP, output: "perceptual-scale" }) }}
      />
      <Snack
        snack={BURR}
        mark="yuck"
        x={980}
        y={430}
        style={{
          scale: interpolate(frame, [26, 44], [0, 2.6], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
          opacity: interpolate(frame, [132, 156], [1, 0], CLAMP),
        }}
      />
      <PlateName
        kind="yum"
        x={300}
        y={176}
        size={66}
        style={{
          scale: interpolate(frame, [18, 34], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
          opacity: interpolate(frame, [132, 156], [1, 0], CLAMP),
        }}
      />
      <PlateName
        kind="yuck"
        x={980}
        y={176}
        size={66}
        style={{
          scale: interpolate(frame, [36, 52], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
          opacity: interpolate(frame, [132, 156], [1, 0], CLAMP),
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          transformOrigin: "640px 672px",
          scale: interpolate(frame, [104, 124], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
        }}
      >
        <Momo mood={frame < 136 ? "wow" : "oops"} size={380} x={640} y={672} />
      </div>
      <BigWords
        text="?"
        size={110}
        width={130}
        style={{
          position: "absolute",
          left: 420,
          top: 300,
          rotate: "-14deg",
          scale: interpolate(frame, [140, 156], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
        }}
      />
      <BigWords
        text="?"
        size={84}
        width={110}
        style={{
          position: "absolute",
          left: 760,
          top: 286,
          rotate: "12deg",
          scale: interpolate(frame, [148, 164], [0, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
        }}
      />

      <Caption from={6} until={98}>
        Some snacks are yum. Some are yuck.
      </Caption>
      <Caption from={104} until={206}>
        Momo can't smell. It can only look!
      </Caption>
    </Stage>
  );
};
