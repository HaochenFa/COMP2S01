/*
 * The snacks: they roll in, two get eaten (one comes straight back out),
 * and the other four are carried to the plates as examples. Then one new
 * snack arrives for Momo to guess.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Snack } from "../parts";
import { Actor, BEAT, CARRY, CLAMP, GLIDE, GULP, LAND, MOUTH, POP, SNACK_SCALE, SNACKS, SPOT, TEST } from "../story";

type Place = { x: number; y: number; scale: number; turn: number; shown: boolean; front: boolean };

// A hop from one place into Momo's mouth, getting smaller on the way.
const gulp = (frame: number, at: number, from: [number, number]): Place => {
  const t = interpolate(frame, [at, at + GULP], [0, 1], CLAMP);
  return {
    x: from[0] + (MOUTH.x - from[0]) * t,
    y: from[1] + (MOUTH.y - from[1]) * t - 4 * 70 * t * (1 - t),
    scale: SNACK_SCALE * (1 - 0.68 * t),
    turn: 200 * t * (from[0] < MOUTH.x ? 1 : -1),
    shown: frame < at + GULP,
    front: true,
  };
};

// Where one snack is at one moment.
export const snackAt = (actor: Actor, frame: number): Place => {
  const [homeX, homeY] = actor.at;

  if (actor.spat !== undefined && frame >= actor.spat) {
    // Out it comes! It flies off the blanket.
    const t = (frame - actor.spat) / 26;
    return {
      x: MOUTH.x + 820 * t,
      y: MOUTH.y - 4 * 150 * t * (1 - t) + 210 * t * t,
      scale: SNACK_SCALE * interpolate(t, [0, 0.25], [0.35, 1], CLAMP),
      turn: 620 * t,
      shown: t <= 1,
      front: true,
    };
  }
  if (actor.eaten !== undefined && frame >= actor.eaten) return gulp(frame, actor.eaten, actor.at);

  if (actor.plate && actor.carry !== undefined && frame >= actor.carry - 6) {
    // Picked up, carried to a plate, and put down.
    const t = interpolate(frame, [actor.carry, actor.carry + CARRY], [0, 1], { ...CLAMP, easing: GLIDE });
    const held = interpolate(frame, [actor.carry - 6, actor.carry, actor.carry + CARRY, actor.carry + CARRY + 5, actor.carry + CARRY + 11], [1, 1.2, 1.2, 0.9, 1], CLAMP);
    return {
      x: homeX + (actor.plate[0] - homeX) * t,
      y: homeY + (actor.plate[1] - homeY) * t - 46 * Math.sin(Math.PI * t),
      scale: SNACK_SCALE * held,
      turn: -8 * Math.sin(Math.PI * t),
      shown: true,
      front: frame < actor.carry + CARRY + 2,
    };
  }

  // Rolling in from the side, then settling with a little bounce.
  const t = interpolate(frame, [actor.roll, actor.roll + 24], [0, 1], { ...CLAMP, easing: LAND });
  const startX = actor.from < 0 ? -90 : 1370;
  const bounce = interpolate(frame, [actor.roll + 24, actor.roll + 29, actor.roll + 35], [0, -10, 0], CLAMP);
  return {
    x: startX + (homeX - startX) * t,
    y: homeY + bounce,
    scale: SNACK_SCALE,
    turn: (1 - t) * -300 * actor.from,
    shown: frame >= actor.roll,
    front: false,
  };
};

// The player's secret: hearts and stink lines. They fade away while Momo explains
// that it cannot smell, and come back when it asks for help.
const markOpacity = (frame: number) =>
  interpolate(frame, [BEAT.marksOff, BEAT.marksOff + 24, BEAT.marksOn, BEAT.marksOn + 14], [1, 0, 0, 1], CLAMP);

export const SnackActors: React.FC = () => {
  const frame = useCurrentFrame();
  const test = frame >= BEAT.bite3
    ? gulp(frame, BEAT.bite3, [SPOT.x, SPOT.y])
    : {
        x: SPOT.x,
        y: interpolate(frame, [BEAT.test, BEAT.test + 18], [790, SPOT.y], { ...CLAMP, easing: POP }),
        scale: SNACK_SCALE,
        turn: interpolate(frame, [BEAT.test, BEAT.test + 18], [-160, 0], CLAMP),
        shown: frame >= BEAT.test,
        front: true,
      };
  return (
    <>
      {SNACKS.map((actor, i) => {
        const place = snackAt(actor, frame);
        if (!place.shown) return null;
        return (
          <Snack
            key={i}
            snack={actor.snack}
            mark={actor.yum ? "yum" : "yuck"}
            markOpacity={actor.eaten !== undefined && frame >= actor.eaten && !(actor.spat !== undefined && frame >= actor.spat) ? 0 : markOpacity(frame)}
            x={place.x}
            y={place.y}
            scale={place.scale}
            turn={place.turn}
            style={{ zIndex: place.front ? 30 : 5 }}
          />
        );
      })}
      {test.shown ? <Snack snack={TEST} x={test.x} y={test.y} scale={test.scale} turn={test.turn} style={{ zIndex: 30 }} /> : null}
    </>
  );
};
