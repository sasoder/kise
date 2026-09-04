import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";

const { fontFamily } = loadFont("normal", {
  weights: ["800"],
  subsets: ["latin"],
});

export const schema = z.object({
  text: z.string(),
});

export const defaultProps = schema.parse({
  text: "4500 year old bread",
});

// ---- Layout (1080x1920 transparent overlay, horizontally centered) ----
const BOTTOM = 300;

// "core memory podcast style" channel split.
// All offsets positive: copies start BELOW and rise up into the core.
const SPLIT_LAYERS = [
  { color: "#FF5E1A", mult: 1.7 }, // orange (furthest below)
  { color: "#D6189E", mult: 0.9 }, // magenta
  { color: "#3A1FE0", mult: 1.3 }, // indigo
  { color: "#6A5BFF", mult: 0.55 }, // periwinkle (closest)
];
const MAX_SPLIT = 64;

/**
 * Renders its children with the "core memory podcast style" entrance: a vertical
 * channel-split that rises bottom-to-up and converges to a SINGLE clean core as
 * `enter` goes 0 -> 1. The colored fringes bloom in then fade fully to 0.
 * Children set their color to "inherit" so the copies tint.
 */
const ChannelSplit: React.FC<{
  enter: number;
  coreColor: string;
  children: React.ReactNode;
}> = ({ enter, coreColor, children }) => {
  const split = interpolate(enter, [0, 1], [MAX_SPLIT, 0], {
    extrapolateRight: "clamp",
  });
  const fringeOpacity = interpolate(enter, [0, 0.45, 1], [0, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bloom = interpolate(enter, [0, 0.45, 1], [8, 10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ position: "relative", filter: "saturate(1.6)" }}>
      {SPLIT_LAYERS.map((l, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            inset: 0,
            color: l.color,
            opacity: fringeOpacity,
            mixBlendMode: "screen",
            transform: `translateY(${split * l.mult}px)`,
            filter: `drop-shadow(0 0 ${bloom}px ${l.color})`,
          }}
        >
          {children}
        </div>
      ))}
      <div style={{ position: "relative", color: coreColor }}>{children}</div>
    </div>
  );
};

const Line: React.FC<{
  delay: number;
  fontSize: number;
  fontWeight: number;
  shadow: number;
  text: string;
}> = ({ delay, fontSize, fontWeight, shadow, text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const enter = spring({
    frame: frame - delay,
    fps,
    config: { damping: 28, stiffness: 90, mass: 0.9 },
  });
  const slide = interpolate(enter, [0, 1], [70, 0], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(enter, [0, 0.4], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <div style={{ opacity, transform: `translateY(${slide}px)` }}>
      <ChannelSplit enter={enter} coreColor="#FFFFFF">
        <div
          style={{
            fontFamily,
            fontSize,
            fontWeight,
            lineHeight: 1.08,
            letterSpacing: -1,
            whiteSpace: "nowrap",
            textAlign: "center",
            color: "inherit",
            // Sharp offset shadow purely for readability over footage.
            textShadow: `${shadow}px ${shadow}px 0 #000`,
          }}
        >
          {text}
        </div>
      </ChannelSplit>
    </div>
  );
};

const NameTagCentered: React.FC<z.infer<typeof schema>> = ({ text }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Bar slides up + fades in; the text enters at roughly the same time.
  const barEnter = spring({
    frame,
    fps,
    config: { damping: 30, stiffness: 95, mass: 1 },
  });
  const barSlide = interpolate(barEnter, [0, 1], [64, 0], {
    extrapolateRight: "clamp",
  });
  const barOpacity = interpolate(barEnter, [0, 0.45], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: BOTTOM,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div style={{ position: "relative", display: "inline-block" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              borderRadius: 10,
              opacity: barOpacity,
              transform: `translateY(${barSlide}px)`,
            }}
          />
          <div
            style={{
              position: "relative",
              padding: "30px 52px 34px 52px",
            }}
          >
            <Line
              delay={2}
              fontSize={88}
              fontWeight={800}
              shadow={3}
              text={text}
            />
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export default NameTagCentered;
