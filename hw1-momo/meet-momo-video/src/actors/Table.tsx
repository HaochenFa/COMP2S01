/*
 * The two plates with their flags, and the hand that carries examples to them.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Art } from "../momo";
import { Piece } from "../parts";
import { BEAT, CARRY, CLAMP, GLIDE, LAND, PLATE, POP, SNACKS } from "../story";
import { snackAt } from "./SnackActors";

const WIDTH = 410;
const HEIGHT = 230;

const Plate: React.FC<{ kind: "yum" | "yuck"; at: number }> = ({ kind, at }) => {
  const frame = useCurrentFrame();
  if (frame < at) return null;
  const centre = PLATE[kind];
  // The plate drops onto the blanket and wobbles; then its flag springs up.
  const drop = interpolate(frame, [at, at + 12], [-520, 0], { ...CLAMP, easing: LAND });
  const settle = interpolate(frame, [at + 12, at + 16, at + 22], [1, 0.93, 1], CLAMP);
  const flag = interpolate(frame, [at + 14, at + 30], [0, 1], { ...CLAMP, easing: POP });
  return (
    <>
      <Piece
        html={Art.plate(WIDTH, HEIGHT, kind)}
        left={centre.x - WIDTH / 2}
        top={centre.y - HEIGHT / 2 + drop}
        style={{ zIndex: 2, transformOrigin: "50% 80%", scale: `${2 - settle} ${settle}` }}
      />
      <Piece
        html={Art.flag(kind, 1.12)}
        left={kind === "yum" ? centre.x - WIDTH / 2 + 48 : centre.x + WIDTH / 2 - 48 - 204}
        top={centre.y - HEIGHT / 2 - 92}
        style={{ zIndex: 2, transformOrigin: kind === "yum" ? "14% 96%" : "86% 96%", scale: String(flag), rotate: kind === "yum" ? "-7deg" : "7deg" }}
      />
    </>
  );
};

// The hand goes to each example in turn, carries it to its plate, and leaves.
const Hand: React.FC = () => {
  const frame = useCurrentFrame();
  const examples = SNACKS.filter((actor) => actor.carry !== undefined);
  const first = examples[0].carry as number;
  const last = examples[examples.length - 1].carry as number;
  if (frame < BEAT.hand || frame > last + CARRY + 24) return null;

  let at = { x: 640, y: 800 };
  if (frame < first) {
    const t = interpolate(frame, [BEAT.hand, first], [0, 1], { ...CLAMP, easing: GLIDE });
    at = { x: 640 + (examples[0].at[0] - 640) * t, y: 800 + (examples[0].at[1] - 800) * t };
  }
  examples.forEach((actor, i) => {
    const carry = actor.carry as number;
    const plate = actor.plate as [number, number];
    if (frame >= carry && frame <= carry + CARRY) {
      const held = snackAt(actor, frame);
      at = { x: held.x, y: held.y };
    } else if (frame > carry + CARRY) {
      // On the way to the next example, or off the bottom of the picture.
      const next = examples[i + 1];
      const to = next ? { x: next.at[0], y: next.at[1] } : { x: 1180, y: 820 };
      const until = next ? (next.carry as number) : carry + CARRY + 22;
      const t = interpolate(frame, [carry + CARRY + 2, until], [0, 1], { ...CLAMP, easing: GLIDE });
      at = { x: plate[0] + (to.x - plate[0]) * t, y: plate[1] + (to.y - plate[1]) * t };
    }
  });
  return <Piece html={Art.hand(112)} left={at.x - 18} top={at.y - 4} style={{ zIndex: 35 }} />;
};

export const Table: React.FC = () => (
  <>
    <Plate kind="yum" at={BEAT.plates} />
    <Plate kind="yuck" at={BEAT.plates + 8} />
    <Hand />
  </>
);
