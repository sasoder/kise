// ---------------------------------------------------------------------------
// HairRippedForScience (acorn-hair-ripped, title). Core memory podcast style (styles/core-memory.md).
// Transparent overlay 1080x1920, 23.976 fps, 120 frames.
// The text-only sting: copies of the title in the chain colours slide up into place behind the white core
// (orange f0, purple f2, blue f4, core f6; 130 px over 22 f on EASE_LAND; nothing fades). Ref
// DesertSunlightCoreMemory (multi-line title) and VastLogoChannelSplit.
//
// CHECK LINE: "this clip is about getting my hair ripped out for science"
//
// THE LINE: the clip's title, "getting my hair ripped out for science" (not a spoken line; placement is the editor's).
// WORD -> FRAME: none, the whole lockup lands as one.
// DURATION: 120 frames = 5.005 s at 23.976, a long hold the editor trims in Premiere.
//
// THE MOTION: three lines of Barlow 900 (GETTING MY HAIR / RIPPED OUT / FOR SCIENCE) set as one node per layer, so
// the stagger is one slide per colour. The lockup sits above the caption bands (its bottom at about y 1000). The colour
// layers stop rendering once blue lands (f26), so the long rest shows only white on the hard shadow, no fringe.
// CHAIN = the entrance itself (the sting), nothing else.
//
// SOURCES: none.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";

const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin"] });

export const FPS = 24000 / 1001;
export const DURATION = 120;

export const schema = z.object({
  lines: z.array(z.string()),
  fontSize: z.number().min(40).max(400),
  letterSpacing: z.number().min(-20).max(40),
  centerY: z.number(),
  shadowOffset: z.number().min(0).max(48),
  rise: z.number().min(0).max(400),
  staggerFrames: z.number().min(0).max(24),
});

export type HairRippedForScienceProps = z.infer<typeof schema>;

export const defaultProps: HairRippedForScienceProps = schema.parse({
  lines: ["GETTING MY HAIR", "RIPPED OUT", "FOR SCIENCE"],
  fontSize: 124,
  letterSpacing: -2,
  // Centre of the lockup; with three lines at 124 px its bottom sits near y 1000, clear of the y 1080 caption band.
  centerY: 820,
  // Barlow 900 is chunky: ~1.8% of a ~300 px artwork-height line block reads as solid; 5 px matches the OUT NOW weight.
  shadowOffset: 5,
  rise: 130,
  staggerFrames: 2,
});

// The CORE MEMORY chain colours from public/core.png, raw. Orange at the back, blue directly under the core.
const TRAIL_COLORS = ["#FFB765", "#BC37FF", "#0046FF"];
const TRAVEL_FRAMES = 22;
const EASE_LAND = Easing.bezier(0.16, 1, 0.3, 1);

const HairRippedForScience: React.FC<HairRippedForScienceProps> = ({
  lines,
  fontSize,
  letterSpacing,
  centerY,
  shadowOffset,
  rise,
  staggerFrames,
}) => {
  const frame = useCurrentFrame();

  const offsetAt = (delay: number) => {
    const t = interpolate(frame, [delay, delay + TRAVEL_FRAMES], [0, 1], {
      easing: EASE_LAND,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (1 - t) * rise;
  };

  const coreDelay = TRAIL_COLORS.length * staggerFrames;
  const coreOffset = offsetAt(coreDelay);
  // Once blue is home the colours sit exactly under the core; drop them so the antialiased edges leave no fringe.
  const lastColorLand = (TRAIL_COLORS.length - 1) * staggerFrames + TRAVEL_FRAMES;
  const showColors = frame <= lastColorLand;

  const blockH = fontSize * 0.95 * lines.length + fontSize;

  const typeStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily,
    fontWeight: 900,
    fontSize,
    letterSpacing,
    lineHeight: 0.95,
    whiteSpace: "pre",
    textAlign: "center",
  };

  const lockup = lines.map((l) => <div key={l}>{l}</div>);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          left: 0,
          width: "100%",
          top: centerY - blockH / 2,
          height: blockH,
        }}
      >
        {showColors
          ? TRAIL_COLORS.map((color, i) =>
              frame >= i * staggerFrames ? (
                <div
                  key={color}
                  style={{ ...typeStyle, zIndex: i + 1, translate: `0px ${offsetAt(i * staggerFrames)}px`, color }}
                >
                  {lockup}
                </div>
              ) : null,
            )
          : null}

        {frame >= coreDelay ? (
          <>
            {/* Hard shadow at the very back, zero blur, riding with the core. */}
            <div
              style={{
                ...typeStyle,
                zIndex: 0,
                translate: `${shadowOffset}px ${coreOffset + shadowOffset}px`,
                color: "#000000",
              }}
            >
              {lockup}
            </div>
            <div
              style={{
                ...typeStyle,
                zIndex: TRAIL_COLORS.length + 1,
                translate: `0px ${coreOffset}px`,
                color: "#FFFFFF",
              }}
            >
              {lockup}
            </div>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default HairRippedForScience;
