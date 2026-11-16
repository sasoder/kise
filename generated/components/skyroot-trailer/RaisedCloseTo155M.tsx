// ---------------------------------------------------------------------------
// RaisedCloseTo155M (skyroot-trailer, cut 13). Core memory podcast style (styles/core-memory.md).
// Transparent overlay 2048x1080, 23.976 fps, 50 frames, over news card B.
// The text-only sting: copies of the word's silhouette in the chain colours slide up into place behind the white core
// (orange f0, purple f2, blue f4, core f6; 130 px over 22 f on EASE_LAND; nothing fades). Ref VastLogoChannelSplit,
// OutNowCoreMemory (a word).
//
// CHECK LINE: "Skyroot has raised about $155M of its own money."
//
// THE LINE: "Have you raised $100 million to date?" — "We've raised close to $155 million." — "$155 million."
// WORD -> FRAME (from the overlay's start, sequence f318 = 13.263 s): "$155" began at -7 · "million." 12-17 ·
//   the host's repeat "$155" 26 · "million." 37-41.
// DURATION: the slot 13.263 -> 15.349 s (the end of news card B under it) = 2.086 s x 23.976 = 50 frames (f0..f49).
//
// THE MOTION: "$155M" arrives as the house sting, orange first, the white core last, all stacked by f28, so the
// figure is up and readable as the first "$155 million" finishes and through the host's repeat. The colour layers
// stop rendering once blue lands (LAST_COLOR_LAND, f26) so the long rest has no coloured fringe; then a static hold
// to f49 (an overlay keeps a static camera).
// CHAIN = SKYROOT'S OWN (COMMON.md): $155M is Skyroot's own money raised, so the chain colours fit.
//
// SOURCES: "$155M" is the speaker's own figure (Skyroot co-founder, on the podcast), set at the user's request.
// FACT FLAG (not changed): press reports put Skyroot's total raised at ~$160M, at a ~$1.1B valuation.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { loadFont } from "@remotion/google-fonts/Barlow";
import { z } from "zod";
import { EASE_LAND } from "../kits/core-memory/cerroShared";
import {
  CHAIN_COLORS,
  CORE_COLOR,
  CORE_DELAY,
  LAST_COLOR_LAND,
  RISE,
  STAGGER_FRAMES,
  TRAVEL_FRAMES,
} from "../kits/core-memory/coreMemoryIcon";

const { fontFamily } = loadFont("normal", { weights: ["900"], subsets: ["latin"] });

export const FPS = 24000 / 1001;
export const DURATION = 50;

export const schema = z.object({
  text: z.string(),
  fontSize: z.number().min(40).max(500),
  letterSpacing: z.number().min(-40).max(40),
  shadowOffset: z.number().min(0).max(48),
  centreY: z.number().min(0).max(1080),
});
export type RaisedCloseTo155MProps = z.infer<typeof schema>;

export const defaultProps: RaisedCloseTo155MProps = schema.parse({
  text: "$155M",
  fontSize: 300,
  letterSpacing: -6,
  // Barlow 900 is a chunky glyph: the hard shadow at ~1.8% of the artwork's size (the type's em).
  shadowOffset: 6,
  // The middle of the cap block (M: 209 px cap height): just above the frame's middle, clear of where the
  // user's captions may sit in the lower third.
  centreY: 522,
});

const W = 2048;

const RaisedCloseTo155M: React.FC<RaisedCloseTo155MProps> = ({
  text,
  fontSize,
  letterSpacing,
  shadowOffset,
  centreY,
}) => {
  const frame = useCurrentFrame();

  // One shared slide, sampled at each layer's own start frame: quick off the mark, a long ease into place.
  const offsetAt = (delay: number) => {
    const t = interpolate(frame, [delay, delay + TRAVEL_FRAMES], [0, 1], {
      easing: EASE_LAND,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    return (1 - t) * RISE;
  };
  // Nothing fades: a layer is not rendered before its start frame.
  const hasStarted = (delay: number) => frame >= delay;
  // Long rest: the colours go once blue is home, so no antialiased colour fringe sits round the core.
  const showColors = frame <= LAST_COLOR_LAND;
  const coreOffset = offsetAt(CORE_DELAY);

  // In a lineHeight-1 flex box Barlow 900's cap block sits 0.048 em below the box's middle (measured on the
  // render: 14.5 px at 300), so the box is lifted by that to put the caps' middle on centreY.
  const CAP_DROP_EM = 0.048;
  const boxH = fontSize * 1.4;
  const typeStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily,
    fontWeight: 900,
    fontSize,
    letterSpacing,
    lineHeight: 1,
    whiteSpace: "pre",
    textTransform: "uppercase",
  };

  return (
    <AbsoluteFill>
      <div style={{ position: "absolute", left: 0, top: centreY - boxH / 2 - CAP_DROP_EM * fontSize, width: W, height: boxH }}>
        {/* Arrival order is stacking order: orange at the back, then purple, then blue, the core on top. */}
        {showColors
          ? CHAIN_COLORS.map((color, i) =>
              hasStarted(i * STAGGER_FRAMES) ? (
                <div
                  key={color}
                  style={{ ...typeStyle, zIndex: i + 1, translate: `0px ${offsetAt(i * STAGGER_FRAMES)}px`, color }}
                >
                  {text}
                </div>
              ) : null,
            )
          : null}
        {hasStarted(CORE_DELAY) ? (
          <>
            {/* Hard shadow at the very back, zero blur, riding with the core, so it never darkens the colours. */}
            <div
              style={{
                ...typeStyle,
                zIndex: 0,
                translate: `${shadowOffset}px ${coreOffset + shadowOffset}px`,
                color: "#000000",
              }}
            >
              {text}
            </div>
            <div
              style={{
                ...typeStyle,
                zIndex: CHAIN_COLORS.length + 1,
                translate: `0px ${coreOffset}px`,
                color: CORE_COLOR,
              }}
            >
              {text}
            </div>
          </>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};

export default RaisedCloseTo155M;
