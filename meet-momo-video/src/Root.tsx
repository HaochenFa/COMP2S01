import "./index.css";
import { Composition } from "remotion";
import { MeetMomo } from "./MeetMomo";
import { FPS, LENGTH } from "./story";

export const RemotionRoot: React.FC = () => {
  return <Composition id="MeetMomo" component={MeetMomo} width={1920} height={1080} fps={FPS} durationInFrames={LENGTH} />;
};
