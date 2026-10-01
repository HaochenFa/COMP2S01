/*
 * Momo's performance: where Momo is, how it feels and how it moves at every
 * moment of the film.
 */
import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { Mood } from "../momo";
import { Burst, Hearts, Momo, Pose } from "../parts";
import { BEAT, CARRY, CLAMP, FINALE, GLIDE, HOME, IN_SCREEN, LEAP, POP, SCREEN, SNACKS } from "../story";
import { snackAt } from "./SnackActors";

const lerp = (from: number, to: number, t: number) => from + (to - from) * t;
const within = (frame: number, from: number, until: number) => frame >= from && frame < until;

// A small hop on the spot: returns how high Momo is, and how stretched.
const hop = (frame: number, at: number, length: number, height: number) => {
  const t = (frame - at) / length;
  if (t < 0 || t > 1) return { lift: 0, squash: 0 };
  return { lift: 4 * height * t * (1 - t), squash: -0.07 * Math.sin(Math.PI * t) };
};

// The squash as Momo lands, or crouches before a jump.
const bend = (frame: number, at: number, length: number, amount: number) => {
  const t = (frame - at) / length;
  return t < 0 || t > 1 ? 0 : amount * Math.sin(Math.PI * t);
};

// A long leap from one place to another. Momo takes off upwards and comes down in an arc.
const leap = (frame: number, at: number, length: number, from: { x: number; y: number; size: number }, to: { x: number; y: number; size: number }, height: number) => {
  const t = Math.min(1, Math.max(0, (frame - at) / length));
  return {
    x: lerp(from.x, to.x, interpolate(t, [0, 1], [0, 1], { easing: GLIDE })),
    y: lerp(from.y, to.y, t * t),
    lift: 4 * height * t * (1 - t),
    size: lerp(from.size, to.size, t),
    squash: -0.09 * Math.sin(Math.PI * t),
  };
};

// Where Momo's eyes go when it watches a point on the blanket.
const watch = (x: number, y: number): [number, number] => {
  const dx = x - HOME.x;
  const dy = y - (HOME.y - 110);
  const far = Math.hypot(dx, dy) || 1;
  const reach = Math.min(1, far / 160);
  return [(dx / far) * 7 * reach, (dy / far) * 4.5 * reach];
};

export const momoPose = (frame: number): Pose => {
  const grow = frame < BEAT.learn ? 0 : frame < BEAT.grow2 ? 1 : 2;
  const talk = (from: number, until: number) => (within(frame, from, until - 8) ? 0.012 * Math.sin(frame / 1.6) : 0);

  /* Inside the computer, then out of it */
  if (frame < BEAT.leap) {
    const rise = interpolate(frame, [BEAT.popUp, BEAT.popUp + 20], [380, 0], { ...CLAMP, easing: POP });
    const waving = within(frame, BEAT.wave, BEAT.crouch);
    return {
      ...IN_SCREEN,
      y: IN_SCREEN.y + rise,
      mood: frame < BEAT.popUp + 16 ? "wow" : "happy",
      arms: waving ? [38, 118 + 24 * Math.sin((frame - BEAT.wave) / 1.9)] : undefined,
      tilt: waving ? 3 * Math.sin((frame - BEAT.wave) / 3.8) : 0,
      squash: bend(frame, BEAT.crouch, 12, 0.12),
      grow,
      shadow: 0,
    };
  }
  if (frame < BEAT.land) {
    const jump = leap(frame, BEAT.leap, BEAT.land - BEAT.leap, IN_SCREEN, HOME, LEAP);
    return { ...jump, mood: "cheer", grow, shadow: interpolate(frame, [BEAT.land - 12, BEAT.land], [0, 1], CLAMP) };
  }

  /* The title: down the blanket */
  if (frame >= BEAT.leap2) {
    if (frame < BEAT.land2) {
      const jump = leap(frame, BEAT.leap2, BEAT.land2 - BEAT.leap2, HOME, FINALE, LEAP);
      return { ...jump, mood: "cheer", grow, shadow: interpolate(frame, [BEAT.land2 - 12, BEAT.land2], [0, 1], CLAMP) };
    }
    const bounce = hop(frame, BEAT.teach - 2, 14, 30);
    const cheering = frame < BEAT.teach - 4 || frame > BEAT.teach + 62;
    const dance = cheering ? Math.abs(Math.sin((frame - BEAT.land2) / 5.5)) : 0;
    return {
      ...FINALE,
      mood: cheering ? "cheer" : "happy",
      lift: bounce.lift + dance * 16,
      squash: bend(frame, BEAT.land2, 12, 0.15) + bounce.squash - dance * 0.04 + talk(BEAT.teach, BEAT.teach + 66),
      grow,
    };
  }

  /* Everything in the middle happens with Momo standing at home */
  let mood: Mood = "idle";
  let look: [number, number] | undefined;
  let arms: [number, number] | undefined;
  let lift = 0;
  let squash = bend(frame, BEAT.land, 12, 0.16);
  let tilt = 0;
  let x = HOME.x;
  const jump = (at: number, length = 13, height = 30) => {
    const h = hop(frame, at, length, height);
    lift += h.lift;
    squash += h.squash;
  };

  if (frame < BEAT.hi) mood = "happy";
  else if (frame < BEAT.hiEnd) {
    mood = "happy";
    if (frame < BEAT.hi + 44) arms = [38, 118 + 24 * Math.sin((frame - BEAT.hi) / 1.9)];
    squash += talk(BEAT.hi, BEAT.hiEnd);
  } else if (frame < BEAT.roll) mood = "idle";
  else if (frame < BEAT.bite1 - 4) {
    // Snacks roll in from both sides.
    mood = frame < BEAT.ooh ? "wow" : "cheer";
    jump(BEAT.ooh, 14, 34);
    look = frame < BEAT.roll + 8 ? [-6, 3] : [6, 3];
  } else if (frame < BEAT.bite1 + 14) {
    mood = "aah";
    look = [-5, 4];
  } else if (frame < BEAT.yum1) {
    mood = "chew";
    squash += 0.035 * Math.sin((frame - BEAT.bite1) * 1.15);
  } else if (frame < BEAT.bite2 - 4) {
    mood = "yum";
    jump(BEAT.yum1, 14, 32);
  } else if (frame < BEAT.bite2 + 14) {
    mood = "aah";
    look = [5, 4];
  } else if (frame < BEAT.bleh - 8) {
    mood = "chew";
    squash += 0.035 * Math.sin((frame - BEAT.bite2) * 1.15);
  } else if (frame < BEAT.bleh) {
    mood = "oops"; // uh-oh
    squash += bend(frame, BEAT.bleh - 8, 8, 0.08);
  } else if (frame < BEAT.blehEnd + 4) {
    mood = "bleh";
    const fade = Math.max(0, 1 - (frame - BEAT.bleh) / 26);
    x += 10 * Math.sin((frame - BEAT.bleh) * 1.5) * fade;
    tilt = 4 * Math.sin((frame - BEAT.bleh) * 1.5) * fade;
    squash -= bend(frame, BEAT.bleh, 9, 0.08);
  } else if (frame < BEAT.smell + 46) {
    mood = "sad";
    squash += talk(BEAT.smell, BEAT.smell + 46);
  } else if (frame < BEAT.show) {
    // "I can only look!" Momo looks at the snacks on one side, then the other.
    mood = "sad";
    look = frame < BEAT.smell + 72 ? [-7, 0] : [7, 0];
    squash += talk(BEAT.smell + 46, BEAT.smellEnd);
  } else if (frame < BEAT.hand) {
    mood = frame < BEAT.show + 26 ? "cheer" : "happy";
    jump(BEAT.show, 14, 36);
    squash += talk(BEAT.show + 14, BEAT.hand);
  } else if (frame < BEAT.learn) {
    // Momo watches every example it is shown, and nods when it lands.
    const carried = SNACKS.find((actor) => actor.carry !== undefined && within(frame, actor.carry - 8, actor.carry + CARRY + 14));
    if (carried && carried.carry !== undefined) {
      const at = snackAt(carried, frame);
      look = watch(at.x, at.y);
      if (frame >= carried.carry + CARRY) {
        mood = "happy";
        look = undefined;
        squash += bend(frame, carried.carry + CARRY, 10, 0.06);
      }
    }
  } else if (frame < BEAT.test) {
    mood = frame < BEAT.learn + 18 ? "cheer" : "happy";
    jump(BEAT.learn, 14, 34);
    squash += talk(BEAT.learn + 6, BEAT.learnEnd);
  } else if (frame < BEAT.scan) {
    mood = "happy";
    look = undefined;
    squash += talk(BEAT.turn, BEAT.turnEnd);
  } else if (frame < BEAT.match) {
    mood = "think";
    look = [0, 5];
  } else if (frame < BEAT.bite3 - 8) {
    mood = "think";
    look = [-6, 1];
  } else if (frame < BEAT.bite3 + 14) {
    mood = "aah";
    look = [0, 5];
  } else if (frame < BEAT.yum3) {
    mood = "chew";
    squash += 0.035 * Math.sin((frame - BEAT.bite3) * 1.15);
  } else if (frame < BEAT.grow2 + 6) {
    mood = "yum";
    jump(BEAT.yum3, 13, 30);
  } else {
    mood = "cheer";
    jump(BEAT.grow2 + 6, 13, 34);
    squash += bend(frame, BEAT.crouch2, 12, 0.13);
  }

  return { x, y: HOME.y, size: HOME.size, mood, look, arms, lift, squash, tilt, grow };
};

export const MomoActor: React.FC = () => {
  const frame = useCurrentFrame();
  const pose = momoPose(frame);
  const top = pose.y - (pose.lift ?? 0) - pose.size * 0.72;
  // While Momo is inside the computer, everything below the bottom edge of the screen is hidden.
  if (frame < BEAT.leap) {
    return (
      <div style={{ position: "absolute", left: SCREEN.x - 300, top: SCREEN.bottom - 700, width: 600, height: 700, overflow: "hidden", zIndex: 8 }}>
        <Momo pose={{ ...pose, x: 300, y: pose.y - (SCREEN.bottom - 700) }} />
      </div>
    );
  }
  return (
    <>
      <Momo pose={pose} />
      <Hearts x={pose.x} y={top + 40} at={BEAT.yum1 + 2} />
      <Hearts x={pose.x} y={top + 40} at={BEAT.yum3 + 2} />
      <Burst x={pose.x + 4} y={top - 6} at={BEAT.learn} />
      <Burst x={pose.x + 4} y={top - 6} at={BEAT.grow2} />
    </>
  );
};
