import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { zColor } from "@remotion/zod-types";
import { z } from "zod";

// The supplied artwork is never redrawn — each moving part is the original PNG
// clipped to its own region and recoloured through a CSS mask, so the pixels
// stay exactly as delivered.
const ART = 512;

export const schema = z.object({
  variant: z.enum(["careHeart", "balanceScale"]),
  color: zColor(),
  /** Rendered size of the 512px artwork inside the square canvas. */
  iconSize: z.number().min(1),
  /** Multiplies every amplitude — 0 freezes the icon, 2 doubles the motion. */
  liveliness: z.number().min(0).max(3),
});

export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  variant: "careHeart",
  color: "#FFC543",
  iconSize: 820,
  liveliness: 1,
});

const SOURCE: Record<Props["variant"], string> = {
  careHeart: "charity.png",
  balanceScale: "balance.png",
};

/** clip-path inset from an x/y box in artwork coordinates. */
const region = (x0: number, y0: number, x1: number, y1: number) =>
  `inset(${y0}px ${ART - x1}px ${ART - y1}px ${x0}px)`;

const Part: React.FC<{
  src: string;
  color: string;
  box: [number, number, number, number];
  transform?: string;
  origin?: string;
}> = ({ src, color, box, transform, origin }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      clipPath: region(...box),
      WebkitMaskImage: `url("${src}")`,
      maskImage: `url("${src}")`,
      WebkitMaskSize: "100% 100%",
      maskSize: "100% 100%",
      WebkitMaskRepeat: "no-repeat",
      maskRepeat: "no-repeat",
      backgroundColor: color,
      transform,
      transformOrigin: origin,
    }}
  />
);

const TAU = Math.PI * 2;

/** The fulcrum knob, in artwork units. */
const PIVOT = [256, 80];

const IconLoops: React.FC<Props> = ({ variant, color, iconSize, liveliness }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const src = staticFile(SOURCE[variant]);

  // One normalised cycle drives everything, so the loop has no seam and a
  // different fps resamples the motion rather than retiming it.
  const cycle = (frame % durationInFrames) / durationInFrames;
  const wave = (turns: number, phase = 0) => Math.sin(TAU * turns * cycle + phase);

  const breathe = 1 + liveliness * 0.012 * wave(1, 0.6);
  const bob = liveliness * 4 * wave(1, 1.2);

  // Two frequencies so the tip reads as a settling balance rather than a metronome.
  const tilt = liveliness * (2 * wave(1) + 0.6 * wave(2, 0.9));

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {/* Blocks the render until the artwork is decoded, so the CSS masks below
          never resolve against a missing image on the first frames. */}
      <Img src={src} style={{ display: "none" }} />

      <div
        style={{
          position: "relative",
          width: ART,
          height: ART,
          transform: `scale(${iconSize / ART}) translateY(${bob}px) scale(${breathe})`,
        }}
      >
        {variant === "careHeart" ? (
          <>
            {/* The hand settles almost imperceptibly, counter to the heart. */}
            <Part
              src={src}
              color={color}
              box={[0, 248, ART, ART]}
              transform={`translateY(${liveliness * 2.5 * wave(1, Math.PI)}px)`}
            />
            <Part
              src={src}
              color={color}
              box={[0, 0, ART, 248]}
              transform={`translateY(${liveliness * 9 * wave(1)}px) scale(${
                1 + liveliness * 0.022 * wave(1, 1.9)
              })`}
              origin="300px 118px"
            />
          </>
        ) : (
          <>
            {/* Beam, arms and pans tip as one rigid piece. Splitting them so the
                pans could hang plumb put a moving cut through solid artwork, and
                the mismatched edges showed. The three boxes below share one
                transform, so the cuts between them never open up — they only
                carve the static post out of the rotating group. */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                transform: `rotate(${tilt}deg)`,
                transformOrigin: `${PIVOT[0]}px ${PIVOT[1]}px`,
              }}
            >
              {/* Boxes overlap by 2px: butted clip edges are each antialiased,
                  and two half-covered edges leave a visible hairline. */}
              <Part src={src} color={color} box={[0, 36, 216, 374]} />
              <Part src={src} color={color} box={[212, 36, 300, 127]} />
              <Part src={src} color={color} box={[296, 36, ART, 374]} />
            </div>
            {/* Post and base stay put and sit on top, hiding the pivot seam. */}
            <Part src={src} color={color} box={[206, 117, 306, 393]} />
            <Part src={src} color={color} box={[112, 386, 400, 478]} />
          </>
        )}
      </div>
    </AbsoluteFill>
  );
};

export default IconLoops;
