/*
 * Building blocks shared by every scene.
 * All positions are in the game's own 1280 x 720 stage units.
 */
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Art, INK, Mark, Mood, SnackData, SOFT, Tokens, WHITE } from "./momo";

export const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const POP = Easing.spring({ damping: 11 });
export const GLIDE = Easing.bezier(0.4, 0, 0.2, 1);

// The picnic cloth, with the 1280 x 720 stage scaled up to fill a 1920 x 1080 frame.
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={Art.cloth(96)}>
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 1280,
        height: 720,
        scale: "1.5",
        transformOrigin: "0 0",
        fontFamily: Tokens.font.body,
        fontWeight: 700,
        color: INK,
      }}
    >
      {children}
    </div>
  </AbsoluteFill>
);

// Any drawing from the game's art file, placed by its top left corner.
export const Piece: React.FC<{ html: string; left: number; top: number; style?: React.CSSProperties }> = ({
  html,
  left,
  top,
  style,
}) => <div style={{ position: "absolute", left, top, lineHeight: 0, ...style }} dangerouslySetInnerHTML={{ __html: html }} />;

// A snack, placed by its centre.
export const Snack: React.FC<{ snack: SnackData; mark?: Mark; x: number; y: number; style?: React.CSSProperties }> = ({
  snack,
  mark = null,
  x,
  y,
  style,
}) => <Piece html={Art.snack(snack, mark)} left={x - 58} top={y - 58} style={style} />;

// Momo, placed by the middle of its feet. Momo breathes and blinks by itself.
export const Momo: React.FC<{
  mood: Mood;
  size: number;
  x: number;
  y: number;
  look?: [number, number];
  shadow?: boolean;
  style?: React.CSSProperties;
}> = ({ mood, size, x, y, look, shadow, style }) => {
  const frame = useCurrentFrame();
  const face: Mood = mood === "idle" && frame % 96 >= 91 ? "blink" : mood;
  const breath = Math.sin(frame / 9);
  return (
    <Piece
      html={Art.momo(face, size, { look, shadow })}
      left={x - size / 2}
      top={y - size * 0.9}
      style={{ transformOrigin: "50% 90%", scale: `${1 - 0.012 * breath} ${1 + 0.02 * breath}`, ...style }}
    />
  );
};

// One short line of words at the top of the picture.
export const Caption: React.FC<{ children: string; from: number; until: number }> = ({ children, from, until }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", left: 0, right: 0, top: 44, display: "flex", justifyContent: "center" }}>
      <div
        style={{
          padding: "17px 46px 10px",
          border: `5px solid ${INK}`,
          borderRadius: 48,
          background: WHITE,
          boxShadow: `0 8px 0 ${SOFT}`,
          fontSize: 52,
          fontWeight: 800,
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          opacity: interpolate(frame, [from, from + 5, until - 8, until], [0, 1, 1, 0], CLAMP),
          scale: interpolate(frame, [from, from + 18], [0.6, 1], { ...CLAMP, easing: POP, output: "perceptual-scale" }),
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Big outlined words, drawn the same way as the game's logo.
export const BigWords: React.FC<{ text: string; size: number; width: number; style?: React.CSSProperties }> = ({
  text,
  size,
  width,
  style,
}) => {
  const height = size * 1.3;
  const shared = {
    x: width / 2,
    y: size * 0.98,
    fontSize: size,
    fontFamily: Tokens.font.display,
    textAnchor: "middle" as const,
    stroke: INK,
    strokeWidth: size * 0.1,
    strokeLinejoin: "round" as const,
    paintOrder: "stroke",
  };
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={style}>
      <text {...shared} fill={INK} transform={`translate(0 ${size * 0.06})`}>
        {text}
      </text>
      <text {...shared} fill={WHITE}>
        {text}
      </text>
    </svg>
  );
};

// The name above a plate: "Yum!" with a heart, or "Yuck!" with stink lines.
export const PlateName: React.FC<{ kind: "yum" | "yuck"; x: number; y: number; size?: number; style?: React.CSSProperties }> = ({
  kind,
  x,
  y,
  size = 40,
  style,
}) => (
  <div
    style={{
      position: "absolute",
      left: x - 200,
      top: y,
      width: 400,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: size * 0.2,
      fontFamily: Tokens.font.display,
      fontWeight: 400,
      fontSize: size,
      lineHeight: 1,
      ...style,
    }}
  >
    <span style={{ marginTop: -size * 0.15 }} dangerouslySetInnerHTML={{ __html: Art.icon(kind === "yum" ? "heart" : "stink", size * 0.85) }} />
    {kind === "yum" ? "Yum!" : "Yuck!"}
  </div>
);
