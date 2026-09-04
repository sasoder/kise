import { useEffect, useState } from "react";
import {
  AbsoluteFill,
  Easing,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { BULL_HEAVY_1_DATA_URL } from "../assets/bull-heavy1";

// No spaces or leading digits: the name is used raw in a CSS font-family value.
const FONT_FAMILY = "BullHeavy1";

// Started once at module scope, awaited inside the component: a delayRender()
// out here would run during bundling, which Remotion rejects.
const fontPromise = new FontFace(
  FONT_FAMILY,
  `url(${BULL_HEAVY_1_DATA_URL}) format('opentype')`,
  { weight: "900", display: "block" },
)
  .load()
  .then((font) => {
    document.fonts.add(font);
  });

export const schema = z.object({
  totalSeconds: z.number().int().positive(),
  fontSize: z.number().positive(),
  color: z.string(),
  letterSpacing: z.number(),
  // Scale overshoot on each tick, as a fraction. 0 disables the pulse.
  pulse: z.number().min(0).max(0.2),
});

export const defaultProps = schema.parse({
  totalSeconds: 300,
  fontSize: 255,
  color: "#FFFFFF",
  letterSpacing: -0.02,
  pulse: 0.02,
});

const format = (secondsRemaining: number) => {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  return `${minutes}m${seconds < 10 ? "0" : ""}${seconds}s`;
};

const CountdownTimer: React.FC<z.infer<typeof schema>> = ({
  totalSeconds,
  fontSize,
  color,
  letterSpacing,
  pulse,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Hold every frame until Bull Heavy 1 is ready, so nothing renders in a fallback face.
  const [fontHandle] = useState(() => delayRender("Loading Bull Heavy 1"));
  const [fontReady, setFontReady] = useState(false);
  useEffect(() => {
    fontPromise
      .then(() => {
        setFontReady(true);
        continueRender(fontHandle);
      })
      .catch((err) => cancelRender(err));
  }, [fontHandle]);

  // ceil() keeps the full label on screen for its whole second: "5m00s" shows
  // for the first second, "0m00s" only once the clock has actually run out.
  const remaining = Math.min(
    totalSeconds,
    Math.max(0, Math.ceil(totalSeconds - frame / fps)),
  );

  // Frames since the label last changed, so the pop is driven by the value and
  // not by the frame counter.
  const framesIntoTick = Math.max(
    0,
    frame - Math.ceil((totalSeconds - remaining) * fps),
  );
  const scale = interpolate(framesIntoTick, [0, fps * 0.22], [1 + pulse, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        style={{
          fontFamily: FONT_FAMILY,
          fontSize,
          lineHeight: 1,
          color,
          letterSpacing: `${letterSpacing}em`,
          // Tabular figures so the digits never reflow the line as they change.
          fontVariantNumeric: "tabular-nums",
          fontFeatureSettings: '"tnum" 1',
          transform: `scale(${scale})`,
          whiteSpace: "nowrap",
        }}
      >
        {fontReady ? format(remaining) : null}
      </div>
    </AbsoluteFill>
  );
};

export default CountdownTimer;
