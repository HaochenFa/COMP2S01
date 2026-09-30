import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Art, BERRY, BIG_BERRY, BURR, Mark, Mood, SMALL_BURR, SnackData } from "../momo";
import { Caption, CLAMP, GLIDE, Momo, Piece, PlateName, Snack, Stage } from "../parts";

// The same places the game uses: two plates, Momo between them, a tray below.
export const YUM_PLATE = { x: 235, y: 380 };
export const YUCK_PLATE = { x: 1045, y: 380 };
export const MOMO_AT = { x: 640, y: 450 };

type Move = { snack: SnackData; mark: Mark; from: [number, number]; to: [number, number]; start: number };

export const MOVES: Move[] = [
  { snack: BERRY, mark: "yum", from: [490, 610], to: [191, 386], start: 30 },
  { snack: BURR, mark: "yuck", from: [590, 610], to: [1001, 386], start: 72 },
  { snack: BIG_BERRY, mark: "yum", from: [690, 610], to: [279, 386], start: 114 },
  { snack: SMALL_BURR, mark: "yuck", from: [790, 610], to: [1089, 386], start: 156 },
];
const DRAG = 28; // how many frames one drag takes

export const Table: React.FC = () => (
  <>
    <Piece html={Art.plate(430, 240)} left={YUM_PLATE.x - 215} top={YUM_PLATE.y - 120} />
    <Piece html={Art.plate(430, 240)} left={YUCK_PLATE.x - 215} top={YUCK_PLATE.y - 120} />
    <PlateName kind="yum" x={YUM_PLATE.x} y={YUM_PLATE.y - 170} />
    <PlateName kind="yuck" x={YUCK_PLATE.x} y={YUCK_PLATE.y - 170} />
  </>
);

// You show Momo examples by dragging snacks onto the two plates.
export const ShowExamples: React.FC = () => {
  const frame = useCurrentFrame();
  const justDropped = MOVES.some((m) => frame >= m.start + DRAG && frame < m.start + DRAG + 14);
  const dragging = MOVES.filter((m) => frame >= m.start + 8 && frame < m.start + DRAG + 14).pop();
  const mood: Mood = justDropped ? "happy" : "idle";
  const look: [number, number] | undefined = dragging && !justDropped ? [dragging.to[0] < 640 ? -6 : 6, 1] : undefined;

  return (
    <Stage>
      <Table />
      <Piece html={Art.tray(460, 146)} left={410} top={546} />
      <Momo mood={mood} size={210} x={MOMO_AT.x} y={MOMO_AT.y} look={look} />

      {MOVES.map((m, i) => (
        <Snack
          key={i}
          snack={m.snack}
          mark={m.mark}
          x={m.from[0]}
          y={m.from[1]}
          style={{
            translate: interpolate(
              frame,
              [m.start, m.start + DRAG],
              ["0px 0px", `${m.to[0] - m.from[0]}px ${m.to[1] - m.from[1]}px`],
              { ...CLAMP, easing: GLIDE },
            ),
            scale: interpolate(frame, [m.start - 6, m.start, m.start + DRAG, m.start + DRAG + 6], [1, 1.18, 1.18, 1], CLAMP),
            zIndex: frame >= m.start - 6 && frame < m.start + DRAG + 6 ? 5 : 1,
          }}
        />
      ))}

      {/* The hand picks up each snack in turn and carries it to a plate. */}
      <Piece
        html={Art.hand(84)}
        left={-14}
        top={-4}
        style={{
          zIndex: 10,
          translate: interpolate(
            frame,
            [8, 30, 58, 72, 100, 114, 142, 156, 184, 204],
            [
              "640px 780px",
              "490px 610px",
              "191px 386px",
              "590px 610px",
              "1001px 386px",
              "690px 610px",
              "279px 386px",
              "790px 610px",
              "1089px 386px",
              "1200px 780px",
            ],
            { ...CLAMP, easing: GLIDE },
          ),
        }}
      />

      <Caption from={6} until={204}>
        So show Momo some examples.
      </Caption>
    </Stage>
  );
};
