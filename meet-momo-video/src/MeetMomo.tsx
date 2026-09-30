import React from "react";
import { Audio } from "@remotion/media";
import { AbsoluteFill, Series, staticFile } from "remotion";
import { CantSmell } from "./scenes/CantSmell";
import { Hello } from "./scenes/Hello";
import { MomoGuesses } from "./scenes/MomoGuesses";
import { ShowExamples } from "./scenes/ShowExamples";
import { TinyAi } from "./scenes/TinyAi";
import { Title } from "./scenes/Title";

const sound = (name: string) => staticFile(`audio/${name}.wav`);

// Meet Momo: a 34 second introduction to the game.
export const MeetMomo: React.FC = () => (
  <AbsoluteFill>
    <Series>
      <Series.Sequence name="Hello" durationInFrames={120}>
        <Hello />
      </Series.Sequence>
      <Series.Sequence name="A tiny AI" durationInFrames={180} premountFor={30}>
        <TinyAi />
      </Series.Sequence>
      <Series.Sequence name="Momo can't smell" durationInFrames={210} premountFor={30}>
        <CantSmell />
      </Series.Sequence>
      <Series.Sequence name="Show examples" durationInFrames={210} premountFor={30}>
        <ShowExamples />
      </Series.Sequence>
      <Series.Sequence name="Momo guesses" durationInFrames={180} premountFor={30}>
        <MomoGuesses />
      </Series.Sequence>
      <Series.Sequence name="Title" durationInFrames={120} premountFor={30}>
        <Title />
      </Series.Sequence>
    </Series>

    <Audio name="Tune" src={sound("tune")} volume={0.55} />

    {/* Hello (starts at frame 0) */}
    <Audio name="Momo pops up" from={18} src={sound("arrive")} />
    <Audio name="Meet Momo" from={52} src={sound("talk-1")} />

    {/* A tiny AI (starts at frame 120) */}
    <Audio name="Tiny AI" from={128} src={sound("talk-2")} />
    <Audio name="Learns from examples" from={214} src={sound("talk-3")} />
    <Audio name="Example 1" from={222} src={sound("pop")} volume={0.7} />
    <Audio name="Example 2" from={231} src={sound("pop")} volume={0.7} />
    <Audio name="Example 3" from={240} src={sound("pop")} volume={0.7} />
    <Audio name="Example 4" from={249} src={sound("pop")} volume={0.7} />
    <Audio name="Example 5" from={258} src={sound("pop")} volume={0.7} />
    <Audio name="Example 6" from={267} src={sound("pop")} volume={0.7} />

    {/* Momo can't smell (starts at frame 300) */}
    <Audio name="Yum snack" from={308} src={sound("pop")} />
    <Audio name="Yuck snack" from={326} src={sound("pop")} />
    <Audio name="Yum and yuck" from={334} src={sound("talk-1")} />
    <Audio name="Momo arrives" from={404} src={sound("arrive")} />
    <Audio name="Momo is puzzled" from={438} src={sound("wrong")} />

    {/* Show examples (starts at frame 510) */}
    <Audio name="Show Momo" from={518} src={sound("talk-2")} />
    <Audio name="Drop 1" from={568} src={sound("drop")} />
    <Audio name="Drop 2" from={610} src={sound("drop")} />
    <Audio name="Drop 3" from={652} src={sound("drop")} />
    <Audio name="Drop 4" from={694} src={sound("drop")} />

    {/* Momo guesses (starts at frame 720) */}
    <Audio name="New snack" from={732} src={sound("pop")} />
    <Audio name="Momo thinks" from={750} src={sound("think")} />
    <Audio name="Yum" from={808} src={sound("yum")} />
    <Audio name="Right" from={840} src={sound("right")} />

    {/* Title (starts at frame 900) */}
    <Audio name="Fanfare" from={904} src={sound("win")} volume={0.7} />
    <Audio name="Can you teach Momo" from={940} src={sound("talk-3")} />
  </AbsoluteFill>
);
