import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { FPS, IncidentWorld, WORD_H, caretAt, lineTop, screenOf } from "./incidentSharedV2";
import { CAM_V2, camV2, measureV2 } from "./incidentCameraV2";

export { FPS, CAM_V2 };

// ---------------------------------------------------------------------------
// Noam_Airgapping, film A, cut 1 V2: `AprilToAugust_V2` — in 0:08.560, G0 = 0.
// "that you did have chain of thought from, like, April to August,"
// SRT 8.560 -> 13.339 (speech ends at "the", G115).
// DURATION = round((13.339 - 8.560) * 24) + 16 = 115 + 16 = 131.
//
// Words (G): that 0 · you 7 · did 10 · have 15 · chain 21 · of 25 · thought 28 ·
//   for 35 · from 43 · like 60 · april 65 · to 76 · august 93 · (ends 115)
//
// V2 (the user, 2026-09-23): "just the chain of thought text + months" — the
// approved V1 cut with NO stations: the column (rail + months + text) alone,
// centred. The stations exist in the V2 world (`incidentSharedV2`) far to the
// right, out of this frame with margin (asserted in `incidentCameraV2`).
//
// GESTURES — each with the word it serves (V1's, unchanged but for the framing):
//  1. G0-28   "you did have chain of thought": CLOSE (k 1.7) on a page being
//             written: APR's first two lines stand, the white caret is mid-way
//             through the third at a legible pace, the writing line at screen
//             y ~835; fresh words INK_HI settling to INK_LO. The camera creeps
//             down with the writing line.
//  2. G24-40  "for, from": the rail draws down from APR (APR lands G34) and the
//             caret steps off the text onto the rail's head as the rate climbs.
//  3. G35-93  "from, like, April to August": THE ONE LONG GLIDE. The time-lapse:
//             the caret races down the rail, lines roll out to its right,
//             MAY/JUN/JUL/AUG slide up as it reaches them (G45, 59, 70, 87);
//             the three plan-lines are written on the way in deep orange,
//             unremarked (G36, 48, 60). The camera pulls back k 1.7 -> 0.9
//             while tracking the caret; AUG lands 6 f before "August".
//  4. G77-106 the caret eases back onto the text (AUG's first line) at the
//             normal pace and keeps writing; the camera settles on the whole
//             APR -> AUG column, centred on its own axis (x 540).
//  5. G106-130 THE REST: the camera comes to a full stop (the hand's sway fades
//             out G98-124), the caret writes on slowly, the grid drifts. The
//             last frame IS cut 2's first frame (asserted: < 0.05 %).
//
// CAMERA: `incidentCameraV2` (one track for cuts 1, 2 and 22, global G).
// ---------------------------------------------------------------------------

export const G0 = 0;
export const DURATION = 131;
export const SPEECH_END_G = 115;

export const schema = z.object({
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  parallax: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  parallax: 0.15,
});

const AprilToAugustV2: React.FC<Props> = ({ backgroundSrc, backgroundBlur, parallax }) => {
  const frame = useCurrentFrame();
  const G = G0 + frame;
  return (
    <IncidentWorld
      G={G}
      cam={camV2(G)}
      backgroundSrc={backgroundSrc}
      backgroundBlur={backgroundBlur}
      parallax={parallax}
    />
  );
};

export default AprilToAugustV2;

// ---------------------------------------------------------------------------
// PROOFS: the lowest ink (the caret and the line being written) stays above
// the caption band; the camera is at rest at the end.
// ---------------------------------------------------------------------------
export const MEASURE = (() => {
  const m = measureV2(G0 + 1, G0 + DURATION, (G) => {
    const c = caretAt(G);
    return [c.y + 23, Math.max(c.y + 23, lineTop(0) + WORD_H)];
  });
  const a = camV2(G0 + DURATION - 1);
  const b = camV2(G0 + DURATION - 2);
  const endV = Math.hypot(screenOf(a, 540, 700).x - screenOf(b, 540, 700).x, screenOf(a, 540, 700).y - screenOf(b, 540, 700).y);
  return { ...m, endV };
})();
if (MEASURE.lowestSubject > 1400) {
  throw new Error(`AprilToAugustV2: lowest ink at screen y ${MEASURE.lowestSubject.toFixed(1)} (G${MEASURE.lowestSubjectG})`);
}
if (MEASURE.endV > 0.05) throw new Error(`AprilToAugustV2: the camera still moves ${MEASURE.endV.toFixed(3)} px/f at the end`);
