import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import countriesJson from "../../public/machina06/countries.json";

// ---------------------------------------------------------------------------
// "CAME TO THE US" — Hadrian Machina 06. A photograph with one core-memory
// element over it (white ink on a hard black shadow, the orange / purple / blue
// chain used once, as the entrance).
//
// CHECK LINE (what the viewer can say after this cut): "This founder is the one
// who came to America."
//
// DURATION. The slot is sequence 8.000 - 11.458 s at 24 fps:
// round(3.458 * 24) = 83 frames, hard cut in and out. Spoken: "That is
// precisely why this young Australian entrepreneur came to the US." Word
// onsets: that 1, precisely 6, why 16, this 23, young 28, Australian 33,
// entrepreneur 42, came 52, to 64, the 67, US 70.
//
// THE MOTION. Frame 0 has Chris Power's face centred in the frame; ONE pan,
// x only, runs from f0 to f82 on a very strong ease in and out (it is moving
// from the first frame but barely reads for the first second and a quarter,
// travels fast through "came", and dies to a creep), carrying the camera left
// across the photo until the American flag on the wall fills the frame. As it
// arrives (f54 - f70) the photo dims and blurs and the contiguous-US silhouette
// slides up as the core-memory stack, fixed to the screen, the white core
// landing on "US" (f70).
//
// THE PHOTO is 929 x 523, cover-scaled to the 1920 height times `overscan`, so
// it is soft; that is accepted. The overscan leaves a margin above, below and
// left of the frame that is wider than the blur's reach, so no edge fringe.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 83;

const FRAME_W = 1080;
const FRAME_H = 1920;

type Country = { w: number; h: number; d: string };
const us = (countriesJson as { us: Country }).us;

export const schema = z.object({
  photo: z.string(),
  photoW: z.number(),
  photoH: z.number(),
  overscan: z.number(), // times exact cover
  faceX: z.number(), // photo px
  faceY: z.number(), // photo px
  faceScreenY: z.number(),
  endLeft: z.number(), // the photo's left edge on screen at the last frame (<= -3 * blur)
  panEase: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  dimFrom: z.number(),
  dimTo: z.number(),
  dim: z.number(),
  blur: z.number(),
  ink: z.string(),
  shadow: z.string(),
  chain: z.array(z.string()),
  shadowOffset: z.number(),
  usWidth: z.number(),
  usCenterY: z.number(),
  rise: z.number(),
  travelFrames: z.number(),
  staggerFrames: z.number(),
  shapeStart: z.number(), // the first colour's frame
});
export type Props = z.infer<typeof schema>;

export const defaultProps: Props = schema.parse({
  photo: "machina06/chris-power.jpg",
  photoW: 929,
  photoH: 523,
  overscan: 1.06,
  faceX: 507,
  faceY: 240,
  faceScreenY: 872,
  endLeft: -95,
  panEase: [0.9, 0, 0.4, 1],
  dimFrom: 54,
  dimTo: 70,
  dim: 0.62,
  blur: 9,
  ink: "#FFFFFF",
  shadow: "#000000",
  chain: ["#FFB765", "#BC37FF", "#0046FF"],
  shadowOffset: 5,
  usWidth: 820,
  usCenterY: 792,
  rise: 130,
  travelFrames: 18,
  staggerFrames: 2,
  shapeStart: 53,
});

// The photo's left edge on screen: one eased move over the whole cut.
export const panAt = (frame: number, p: Props) => {
  const k = (FRAME_H / p.photoH) * p.overscan;
  const startLeft = FRAME_W / 2 - p.faceX * k;
  const e = interpolate(frame, [0, DURATION - 1], [0, 1], {
    easing: Easing.bezier(...p.panEase),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { k, left: startLeft + (p.endLeft - startLeft) * e };
};

const CameToTheUS: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const { k, left } = panAt(frame, p);
  const top = p.faceScreenY - p.faceY * k;

  // the photo knocks back as the shape arrives
  const g = interpolate(frame, [p.dimFrom, p.dimTo], [0, 1], {
    easing: Easing.inOut(Easing.cubic),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const brightness = 1 + (p.dim - 1) * g;
  const blur = p.blur * g;

  // the core-memory stack: every layer makes the same slide up, just later
  const s = p.usWidth / us.w;
  const cx = FRAME_W / 2;
  const offsetAt = (delay: number) =>
    (1 -
      interpolate(frame, [delay, delay + p.travelFrames], [0, 1], {
        easing: Easing.bezier(0.16, 1, 0.3, 1),
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })) *
    p.rise;
  const coreDelay = p.shapeStart + p.chain.length * p.staggerFrames;
  const coreY = p.usCenterY + offsetAt(coreDelay);
  const so = p.shadowOffset;

  return (
    <AbsoluteFill style={{ backgroundColor: "#D8D8D6", overflow: "hidden" }}>
      <Img
        src={staticFile(p.photo)}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: p.photoW * k,
          height: p.photoH * k,
          maxWidth: "none",
          transform: `translate3d(${left.toFixed(3)}px, ${top.toFixed(3)}px, 0)`,
          filter: g > 0 ? `brightness(${brightness.toFixed(4)}) blur(${blur.toFixed(3)}px)` : undefined,
        }}
      />
      <svg
        width={FRAME_W}
        height={FRAME_H}
        viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}
        style={{ position: "absolute", left: 0, top: 0 }}
      >
        {frame >= coreDelay ? (
          <path d={us.d} transform={`translate(${cx + so} ${(coreY + so).toFixed(2)}) scale(${s})`} fill={p.shadow} />
        ) : null}
        {p.chain.map((color, i) => {
          const delay = p.shapeStart + i * p.staggerFrames;
          return frame >= delay ? (
            <path
              key={color}
              d={us.d}
              transform={`translate(${cx} ${(p.usCenterY + offsetAt(delay)).toFixed(2)}) scale(${s})`}
              fill={color}
            />
          ) : null;
        })}
        {frame >= coreDelay ? (
          <path d={us.d} transform={`translate(${cx} ${coreY.toFixed(2)}) scale(${s})`} fill={p.ink} />
        ) : null}
      </svg>
    </AbsoluteFill>
  );
};

export default CameToTheUS;
