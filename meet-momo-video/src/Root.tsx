import "./index.css";
import { Composition, Folder } from "remotion";
import { MeetMomo } from "./MeetMomo";
import { CantSmell } from "./scenes/CantSmell";
import { Hello } from "./scenes/Hello";
import { MomoGuesses } from "./scenes/MomoGuesses";
import { ShowExamples } from "./scenes/ShowExamples";
import { TinyAi } from "./scenes/TinyAi";
import { Title } from "./scenes/Title";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="MeetMomo" component={MeetMomo} width={1920} height={1080} fps={30} durationInFrames={1020} />
      <Folder name="MeetMomo-Scenes">
        <Composition id="Hello" component={Hello} width={1920} height={1080} fps={30} durationInFrames={120} />
        <Composition id="TinyAi" component={TinyAi} width={1920} height={1080} fps={30} durationInFrames={180} />
        <Composition id="CantSmell" component={CantSmell} width={1920} height={1080} fps={30} durationInFrames={210} />
        <Composition id="ShowExamples" component={ShowExamples} width={1920} height={1080} fps={30} durationInFrames={210} />
        <Composition id="MomoGuesses" component={MomoGuesses} width={1920} height={1080} fps={30} durationInFrames={180} />
        <Composition id="Title" component={Title} width={1920} height={1080} fps={30} durationInFrames={120} />
      </Folder>
    </>
  );
};
