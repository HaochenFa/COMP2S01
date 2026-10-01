import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Confetti, Ending } from "./actors/Ending";
import { MomoActor } from "./actors/MomoActor";
import { Opening } from "./actors/Opening";
import { SnackActors } from "./actors/SnackActors";
import { Speech } from "./actors/Speech";
import { Table } from "./actors/Table";
import { Thinking } from "./actors/Thinking";
import { Grain, World } from "./parts";
import { BEAT, CARRY, CLAMP, DOWN, GLIDE, GULP, LEAP, SNACKS } from "./story";

const sound = (name: string) => staticFile(`audio/${name}.wav`);
// Every sound is turned down a little, so that sounds playing together never distort.
const LOUD = 0.78;

// The camera follows Momo down the blanket. It comes close while Momo says
// hello, steps back as the snacks and then the plates arrive, and leans in
// while Momo eats.
const camera = (frame: number) => {
  // One long leap: the camera falls with Momo, rises a little with the jump, and bumps as they land.
  const fall = (from: number, until: number) => {
    const t = interpolate(frame, [from, until], [0, 1], CLAMP);
    const bump = interpolate(frame, [until, until + 5, until + 13], [0, 9, 0], CLAMP);
    return { down: t * t, rise: Math.sin(Math.PI * t) ** 2 * LEAP * 0.5 - bump };
  };
  const smooth = (from: number, until: number) => interpolate(frame, [from, until], [0, 1], { ...CLAMP, easing: GLIDE });
  const first = fall(BEAT.leap, BEAT.land);
  const second = fall(BEAT.leap2, BEAT.land2);

  // How close the camera is in the middle of the film, and how far down it looks.
  const snacks = smooth(BEAT.roll - 10, BEAT.roll + 16);
  const plates = smooth(BEAT.show - 2, BEAT.show + 24);
  const close = 1.35 - 0.15 * snacks - 0.1 * plates;
  const lower = 300 + 50 * snacks - 5 * plates - 360;
  const middle = smooth(BEAT.leap + 12, BEAT.land + 8) - smooth(BEAT.leap2, BEAT.land2);
  const lean = interpolate(frame, [BEAT.bite1 - 14, BEAT.bite1 + 6, BEAT.blehEnd + 6, BEAT.smell], [0, 1, 1, 0], { ...CLAMP, easing: GLIDE });
  const settle = 1 - smooth(0, 40);
  return {
    x: 640,
    y: -360 + 720 * first.down - first.rise + DOWN * second.down - second.rise + lower * middle - 14 * lean,
    zoom: 1 + (close - 1) * middle + 0.06 * lean + 0.08 * settle,
  };
};

// Meet Momo: a 41 second introduction to the game, told as one continuous picnic.
export const MeetMomo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      <World {...camera(frame)}>
        <Opening />
        <Table />
        <Thinking />
        <SnackActors />
        <MomoActor />
        <Ending />
        <Speech />
      </World>
      <Confetti />
      <Grain />

      <Audio name="Tune" src={sound("tune")} volume={0.5 * LOUD} />

      {/* Meet Momo */}
      <Audio name="Meet" from={BEAT.meet} src={sound("pop")} volume={0.6 * LOUD} />
      <Audio name="Momo!" from={BEAT.momoWord} src={sound("pop")} volume={0.6 * LOUD} />
      <Audio name="Computer switches on" from={BEAT.screenOn} src={sound("arrive")} volume={LOUD} />
      <Audio name="Momo pops up" from={BEAT.popUp} src={sound("pop")} volume={LOUD} />
      <Audio name="Momo leaps out" from={BEAT.leap} src={sound("pop")} volume={LOUD} />
      <Audio name="Momo lands" from={BEAT.land} src={sound("drop")} volume={LOUD} />
      <Audio name="Hi, I'm Momo" from={BEAT.hi} src={sound("say-hi")} volume={LOUD} />

      {/* Snacks */}
      {SNACKS.map((actor, i) => (
        <Audio key={i} name={`Snack ${i + 1} rolls in`} from={actor.roll + 18} src={sound("drop")} volume={0.45 * LOUD} />
      ))}
      <Audio name="Ooh, snacks" from={BEAT.ooh} src={sound("say-snacks")} volume={LOUD} />
      <Audio name="Munch 1" from={BEAT.bite1 + GULP} src={sound("munch")} volume={LOUD} />
      <Audio name="Yum" from={BEAT.yum1} src={sound("yum")} volume={LOUD} />
      <Audio name="Munch 2" from={BEAT.bite2 + GULP} src={sound("munch")} volume={LOUD} />
      <Audio name="Bleh" from={BEAT.bleh} src={sound("wrong")} volume={LOUD} />
      <Audio name="Spits it out" from={BEAT.bleh} src={sound("pop")} volume={LOUD} />
      <Audio name="I can't smell" from={BEAT.smell} src={sound("say-smell")} volume={LOUD} />

      {/* Examples */}
      <Audio name="But you can" from={BEAT.show} src={sound("say-show")} volume={LOUD} />
      <Audio name="Yum plate lands" from={BEAT.plates + 11} src={sound("drop")} volume={LOUD} />
      <Audio name="Yuck plate lands" from={BEAT.plates + 19} src={sound("drop")} volume={LOUD} />
      {SNACKS.filter((actor) => actor.carry !== undefined).map((actor, i) => (
        <React.Fragment key={i}>
          <Audio name={`Pick up ${i + 1}`} from={actor.carry as number} src={sound("pop")} volume={0.7 * LOUD} />
          <Audio name={`Put down ${i + 1}`} from={(actor.carry as number) + CARRY} src={sound("drop")} volume={LOUD} />
        </React.Fragment>
      ))}
      <Audio name="Sprout grows" from={BEAT.learn} src={sound("star")} volume={LOUD} />
      <Audio name="I'm learning" from={BEAT.learn + 8} src={sound("say-learning")} volume={LOUD} />

      {/* Momo guesses */}
      <Audio name="New snack" from={BEAT.test} src={sound("pop")} volume={LOUD} />
      <Audio name="My turn" from={BEAT.turn} src={sound("say-turn")} volume={LOUD} />
      <Audio name="Momo thinks" from={BEAT.scan} src={sound("think")} volume={LOUD} />
      <Audio name="It looks like this one" from={BEAT.alike} src={sound("say-alike")} volume={LOUD} />
      <Audio name="Yum" from={BEAT.bite3 - 6} src={sound("yum")} volume={LOUD} />
      <Audio name="Munch 3" from={BEAT.bite3 + GULP} src={sound("munch")} volume={LOUD} />
      <Audio name="Right" from={BEAT.yum3} src={sound("right")} volume={LOUD} />
      <Audio name="Sprout grows again" from={BEAT.grow2} src={sound("star")} volume={LOUD} />

      {/* The title */}
      <Audio name="Momo leaps" from={BEAT.leap2} src={sound("pop")} volume={LOUD} />
      <Audio name="Fanfare" from={BEAT.logo} src={sound("win")} volume={0.7 * LOUD} />
      <Audio name="Momo lands" from={BEAT.land2} src={sound("drop")} volume={LOUD} />
      <Audio name="Can you teach me" from={BEAT.teach} src={sound("say-teach")} volume={LOUD} />
    </AbsoluteFill>
  );
};
