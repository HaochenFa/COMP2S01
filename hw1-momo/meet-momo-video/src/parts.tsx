/*
 * Building blocks shared by everything in the video.
 * All positions are in the game's stage units (the camera sees 1280 x 720).
 */
import React from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Art, INK, Mark, Mood, MomoOptions, SnackData, SOFT, Tokens, WHITE } from "./momo";
import { CLAMP, POP } from "./story";

// The shape of a hand-cut piece of paper: no two corners quite the same.
const PAPER = "28px 36px 30px 38px / 36px 28px 38px 30px";

// The meadow, the long picnic blanket lying on it, and a camera looking down at them.
// The camera is centred on (x, y); zoom 1 shows 1280 x 720 stage units.
export const World: React.FC<{ x: number; y: number; zoom: number; children: React.ReactNode }> = ({ x, y, zoom, children }) => {
  const scale = 1.5 * zoom;
  return (
    <AbsoluteFill style={{ backgroundColor: Art.meadow(1).backgroundColor, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 1280,
          height: 720,
          transformOrigin: "0 0",
          transform: `translate(${960 - x * scale}px, ${540 - y * scale}px) scale(${scale})`,
          fontFamily: Tokens.font.body,
          fontWeight: 700,
          color: INK,
        }}
      >
        <div style={{ position: "absolute", left: -600, top: -1400, width: 2480, height: 3600, ...Art.meadow(1) }} />
        <div
          style={{
            position: "absolute",
            left: 9,
            top: -652,
            width: 1262,
            height: 2083,
            borderRadius: "30px 42px 34px 46px / 42px 30px 46px 34px",
            boxShadow: `0 0 0 2px ${INK}, 3px 5px 0 2px ${INK}, 12px 20px 0 2px rgba(40, 86, 24, 0.24)`,
            ...Art.cloth(40),
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 9,
              border: "3px dashed rgba(59, 42, 79, 0.26)",
              borderRadius: "22px 32px 26px 34px / 32px 22px 34px 26px",
            }}
          />
        </div>
        {children}
      </div>
    </AbsoluteFill>
  );
};

// Paper grain over the whole picture, the same as in the game. It is laid
// as tiles of <Img>, which Remotion waits for before taking each frame.
export const Grain: React.FC = () => (
  <AbsoluteFill style={{ display: "flex", flexWrap: "wrap", alignContent: "flex-start", overflow: "hidden" }}>
    {new Array(15).fill(0).map((_, i) => (
      <Img key={i} src={staticFile("img/grain.png")} style={{ width: 384, height: 384 }} />
    ))}
  </AbsoluteFill>
);

// Any drawing from the game's art file, placed by its top left corner.
export const Piece: React.FC<{ html: string; left: number; top: number; style?: React.CSSProperties }> = ({
  html,
  left,
  top,
  style,
}) => <div style={{ position: "absolute", left, top, lineHeight: 0, ...style }} dangerouslySetInnerHTML={{ __html: html }} />;

// A snack, placed by its centre. Its hearts or stink lines bob gently, and can be faded.
export const Snack: React.FC<{
  snack: SnackData;
  mark?: Mark;
  markOpacity?: number;
  x: number;
  y: number;
  scale?: number;
  turn?: number;
  style?: React.CSSProperties;
}> = ({ snack, mark = null, markOpacity = 1, x, y, scale = 1, turn = 0, style }) => {
  const frame = useCurrentFrame();
  const phase = frame / 7 + snack.size * 9;
  return (
    <div style={{ position: "absolute", left: x - 58, top: y - 58, width: 116, height: 116, scale: String(scale), ...style }}>
      <Piece html={Art.snack(snack, null)} left={0} top={0} style={{ rotate: `${turn}deg` }} />
      {mark && markOpacity > 0 ? (
        <Piece html={Art.markOnly(snack, mark, phase)} left={0} top={0} style={{ opacity: markOpacity }} />
      ) : null}
    </div>
  );
};

// Momo, placed by the middle of its feet. squash and stretch bend it; lift raises it off the ground.
export type Pose = {
  x: number;
  y: number;
  size: number;
  mood: Mood;
  lift?: number;
  look?: [number, number];
  arms?: [number, number];
  grow: number;
  squash?: number; // above 0 is flatter and wider, below 0 is taller and thinner
  tilt?: number;
  shadow?: number; // how dark the shadow on the ground is, 0 to 1
};

export const Momo: React.FC<{ pose: Pose }> = ({ pose }) => {
  const frame = useCurrentFrame();
  const { x, y, size, lift = 0, squash = 0, tilt = 0, shadow = 1 } = pose;
  const mood: Mood = pose.mood === "idle" && frame % 97 >= 92 ? "blink" : pose.mood;
  const breath = Math.sin(frame / 9);
  const options: MomoOptions = {
    look: pose.look,
    arms: pose.arms,
    grow: pose.grow,
    shadow: false,
    sway: (pose.mood === "think" ? 7 : 4) * Math.sin(frame / (pose.mood === "think" ? 3 : 11)),
  };
  const near = Math.max(0, 1 - lift / 260);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - size * 0.34 * (0.6 + 0.4 * near),
          top: y + size * 0.03 - size * 0.048,
          width: size * 0.68 * (0.6 + 0.4 * near),
          height: size * 0.096,
          borderRadius: "50%",
          background: INK,
          opacity: 0.15 * near * shadow,
          zIndex: 3,
        }}
      />
      <Piece
        html={Art.momo(mood, size, options)}
        left={x - size / 2}
        top={y - lift - size * 0.9}
        style={{
          transformOrigin: "50% 90%",
          zIndex: 20,
          rotate: `${tilt}deg`,
          scale: `${1 + squash * 0.9 - 0.01 * breath} ${1 - squash + 0.018 * breath}`,
        }}
      />
    </>
  );
};

// Momo's speech bubble, the same as in the game. (x, bottom) is where its tail points from.
export const Bubble: React.FC<{
  children: string;
  from: number;
  until: number;
  x: number;
  bottom: number;
  shout?: boolean;
  width?: number;
}> = ({ children, from, until, x, bottom, shout, width = 520 }) => {
  const frame = useCurrentFrame();
  if (frame < from || frame >= until) return null;
  const grow = interpolate(frame, [from, from + 14], [0, 1], { ...CLAMP, easing: POP });
  const shrink = interpolate(frame, [until - 5, until], [1, 0], CLAMP);
  return (
    <div
      style={{
        position: "absolute",
        left: x - width / 2,
        bottom: 720 - bottom,
        width,
        display: "flex",
        justifyContent: "center",
        transformOrigin: "50% 125%",
        scale: String(grow * shrink),
        zIndex: 40,
      }}
    >
      <div
        style={{
          position: "relative",
          maxWidth: width,
          padding: shout ? "8px 38px 0px" : "15px 30px 11px",
          border: `2px solid ${INK}`,
          borderRadius: PAPER,
          background: WHITE,
          boxShadow: `2px 3px 0 ${INK}, 8px 12px 0 ${SOFT}`,
          fontFamily: shout ? Tokens.font.display : Tokens.font.body,
          fontWeight: shout ? 400 : 700,
          fontSize: shout ? 60 : 35,
          lineHeight: 1.26,
          textAlign: "center",
          textWrap: "balance",
          whiteSpace: "pre-line",
        }}
      >
        {children}
        <Piece html={Art.tail(40)} left={0} top={0} style={{ left: "50%", top: "100%", marginLeft: -38, marginTop: -1 }} />
      </div>
    </div>
  );
};

// A little burst of stars, for when something good happens.
export const Burst: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const frame = useCurrentFrame();
  if (frame < at || frame > at + 22) return null;
  const t = (frame - at) / 22;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = -Math.PI / 2 + (i - 2) * 0.62;
        const reach = 34 + 62 * (1 - (1 - t) * (1 - t));
        return (
          <Piece
            key={i}
            html={Art.icon("star", 30)}
            left={x + Math.cos(angle) * reach - 15}
            top={y + Math.sin(angle) * reach - 15}
            style={{ scale: String(Math.sin(Math.PI * Math.min(1, t * 1.15)) * (i % 2 ? 0.8 : 1.1)), rotate: `${(i - 2) * 14 + t * 40}deg`, zIndex: 45 }}
          />
        );
      })}
    </>
  );
};

// Little hearts that float up from Momo when a snack is yum.
export const Hearts: React.FC<{ x: number; y: number; at: number }> = ({ x, y, at }) => {
  const frame = useCurrentFrame();
  return (
    <>
      {[0, 1, 2].map((i) => {
        const t = (frame - at - i * 5) / 30;
        if (t < 0 || t > 1) return null;
        const side = [-1, 1, 0.2][i];
        return (
          <Piece
            key={i}
            html={Art.icon("heart", 40)}
            left={x + side * (60 + 26 * t) + Math.sin(t * 6 + i) * 8 - 20}
            top={y - 40 - 110 * t - 20}
            style={{ scale: String(Math.sin(Math.PI * Math.min(1, t * 1.1)) * (1 - i * 0.12)), rotate: `${side * 14}deg`, zIndex: 45 }}
          />
        );
      })}
    </>
  );
};
