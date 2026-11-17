// ---------------------------------------------------------------------------
// NewsCardAimNamanAnim (shruti-trailer, cut 59, the red-labelled clip on the graphics track).
// Core memory podcast style (styles/core-memory.md). Opaque 1920x1080, 23.976 fps, 179 frames, rendered --scale=2
// to 3840x2160. The still NewsCardAimNaman (same picture, same props) under a slow push-in, with film life and a
// highlighter. All the card's design notes, sources and the ₹ font fallback are in NewsCardAimNaman.tsx.
//
// CHECK LINE: the kid Shruti met at 16 is now in the press as a 20-year-old building delivery drones — the "fully
// formed" teenager turned out to be real.
//
// THE LINE (Shruti): "Naman at 16 sounded, it was like he had hatched out of an egg or something. Like he just came
// out as this fully formed person."
// WORD -> FRAME: naman -4 · at 8 · 16 24 · sounded 36 · it 58 · was 67 · like 72 · hatched 82 · egg 99 ·
// something 107 · came 128 · fully 143 · formed 149 · person 157 · ends ~170.
// DURATION: the slot 59.601 -> 67.067 s (seq f1429 -> f1608) = 179 frames (f0..f178).
//
// THE MOTION: f0 the card is already in place (a hard cut in from the previous graphic, on the same paper); one slow
// continuous push-in from f0 to f178 (k 1.00 -> 1.08, an in-out ease blended with a linear share so it never stops,
// drifting a touch up-left; the whole sheet stays in frame). On "16" (f24) a flat chain-orange highlighter wipes on behind
// "20-YEAR-OLD", left to right, f24-f36 (eased out, landed by f36 "sounded"). The crown is there from f0. Film life
// (grain, weave, flicker, vignette) over all, living to the end; nothing fades.
// CHAIN = India's outliers: the crown on the headline sheet (at rest from f0) and the highlighter's orange.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { type NealCam, NealFilmLife, NealPaper, NealPlane } from "../neal-stephenson-trailer/nealShared";
import { NewsCardAimNamanScene, W, H, defaultProps as stillProps, highlightAt, schema as stillSchema } from "./NewsCardAimNaman";

export const FPS = 24000 / 1001;
export const DURATION = 179;

export const schema = stillSchema.omit({ highlight: true });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse(stillProps); // zod strips `highlight`

export const HIGHLIGHT_START = 24; // "16"
export const HIGHLIGHT_LEN = 12;
export const PUSH_K = 0.08;

/** the push: an in-out sine blended with a linear share (never a hold at either end) */
const push = (f: number) => {
  const t = Math.min(1, Math.max(0, f / (DURATION - 1)));
  return 0.3 * t + 0.7 * (0.5 - 0.5 * Math.cos(Math.PI * t));
};

/** the camera aim drifts a little from the middle by the end: A a touch up-left (toward the headline) so the whole
 *  sheet, crown and shadow stay in frame at k 1.08; B a touch toward the slip (the print's far corner crops). */
const AIM: Record<"A" | "B", { x: number; y: number }> = {
  A: { x: W / 2 - 10, y: H / 2 - 10 },
  B: { x: W / 2 + 30, y: H / 2 + 8 },
};

export const camAt = (frame: number, layout: "A" | "B"): NealCam => {
  const g = push(frame);
  const aim = AIM[layout];
  return { x: W / 2 + (aim.x - W / 2) * g, y: H / 2 + (aim.y - H / 2) * g, k: 1 + PUSH_K * g };
};

const NewsCardAimNamanAnim: React.FC<Props> = (props) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame, props.layout);
  const hl = highlightAt(frame, HIGHLIGHT_START, HIGHLIGHT_LEN);
  return (
    <AbsoluteFill>
      <NealFilmLife frame={frame} seed="aim-naman">
        <NealPaper frame={frame} cam={cam} />
        <NealPlane cam={cam}>
          <NewsCardAimNamanScene {...props} highlight={hl} />
        </NealPlane>
      </NealFilmLife>
    </AbsoluteFill>
  );
};

export default NewsCardAimNamanAnim;
