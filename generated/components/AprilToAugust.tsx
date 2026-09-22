import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  FPS,
  IncidentWorld,
  K_REST,
  WORD_H,
  buildCamTable,
  caretAt,
  headYF,
  STATIONS,
  lineTop,
  screenOf,
  stationIn,
  seg01,
  type Cam,
} from "./incidentShared";

export { FPS };

// ---------------------------------------------------------------------------
// Noam_Airgapping, film A, cut 1: `AprilToAugust` — in 0:08.560, G0 = 0.
// "that you did have chain of thought from, like, April to August,"
// SRT 8.560 -> 13.339 (speech ends at "the", G115).
// DURATION = round((13.339 - 8.560) * 24) + 16 = 115 + 16 = 131.
//
// Words (G): that 0 · you 7 · did 10 · have 15 · chain 21 · of 25 · thought 28 ·
//   for 35 · from 43 · like 60 · april 65 · to 76 · august 93 · (ends 115)
//
// THE WORLD: `incidentShared` (one global clock; this cut is G0..130 with its
// own camera). Nothing here is keyed to the cut but the camera.
//
// GESTURES — each with the word it serves:
//  1. G0-28   "you did have chain of thought": CLOSE (k 1.7) on a page being
//             written: APR's first two lines stand, the white caret is mid-way
//             through the third at a legible pace, the writing line at screen
//             y ~835; freshly written words
//             are INK_HI and settle to INK_LO behind the caret. The writing IS the
//             subject. The camera creeps down with the writing line.
//  2. G24-40  "for, from": the time axis arrives. The rail draws down from APR
//             (APR label lands G34) and the caret steps off the text onto the
//             rail's head (G27-37) as the rate starts climbing.
//  3. G35-93  "from, like, April to August": THE ONE LONG GLIDE. The writing
//             becomes a time-lapse (rate x8): the caret races down the rail, lines
//             roll out to its right, MAY/JUN/JUL/AUG slide up as it reaches them
//             (G45, 59, 70, 87). The three plan-lines are written on the way in
//             deep orange, unremarked (G36, 48, 60). The camera pulls back from
//             k 1.7 to 0.9 WHILE tracking the caret, so the caret never outruns
//             the frame and the column grows up into view behind it. AUG lands
//             6 f before "August".
//  4. G77-115 the caret eases back onto the text (AUG's first line) at the normal
//             pace and keeps writing; the camera settles on the whole APR->AUG
//             period with the three stations faint (INK_LO) on the right: the
//             picture cut 2 picks up.
//  5. tail    the caret writes on (slowing), sway and grid drift; the camera's
//             last creep is still settling.
//
// CAMERA: one track, damped (fieldShared runCamera) + sway(G).
//   k    1.70 -> 0.90, G30 -> G104, warp 0.85 (the pull-back)
//   y    tracks the writing head (screen y 835 -> 1110 over G30-62) then eases to
//        the whole-period framing G66 -> G112
//   x    340 (column + rail labels) -> composition axis (550), G40 -> G94
// Measured (see the proofs at the bottom): lowest ink, caret screen speed, camera
// |dv|.
// ---------------------------------------------------------------------------

export const G0 = 0;
export const DURATION = 131;
export const SPEECH_END_G = 115;

const K_OPEN = 1.7;
const K_END = K_REST;
const X_OPEN = 340;
const X_END = 550;
/** whole-period framing: APR's label top (-9) lands at screen y ~205 */
const Y_END = 680;

const S_OPEN = 835;
const S_RACE = 1110;

const smoothY = (() => {
  const raw: number[] = [];
  for (let G = -30; G <= 200; G++) raw.push(headYF(G));
  const sig = 4;
  const w = 12;
  return (G: number) => {
    let num = 0;
    let den = 0;
    for (let d = -w; d <= w; d++) {
      const g = Math.exp(-(d * d) / (2 * sig * sig));
      const i = Math.max(0, Math.min(raw.length - 1, Math.round(G) + d + 30));
      num += g * raw[i];
      den += g;
    }
    return num / den;
  };
})();

const kOf = (G: number) => K_OPEN + (K_END - K_OPEN) * seg01(G, 30, 104, 0.85);

const target = (G: number) => {
  const k = kOf(G);
  const S = S_OPEN + (S_RACE - S_OPEN) * seg01(G, 30, 62, 1);
  // content centre that puts the caret at screen S: caretY - (S - 835)/k
  const track = smoothY(G) - (S - 835) / k;
  const b = seg01(G, 66, 112, 1);
  const y = track + (Y_END - track) * b;
  const x = X_OPEN + (X_END - X_OPEN) * seg01(G, 40, 94, 1.15);
  return { x, y, k };
};

export const CAM_A = buildCamTable(G0 - 40, G0 + DURATION + 30, target);
export const camAt = (G: number): Cam => CAM_A.at(G);

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

const AprilToAugust: React.FC<Props> = ({ backgroundSrc, backgroundBlur, parallax }) => {
  const frame = useCurrentFrame();
  const G = G0 + frame;
  return (
    <IncidentWorld
      G={G}
      cam={camAt(G)}
      backgroundSrc={backgroundSrc}
      backgroundBlur={backgroundBlur}
      parallax={parallax}
    />
  );
};

export default AprilToAugust;

// ---------------------------------------------------------------------------
// PROOFS
// ---------------------------------------------------------------------------
/** lowest ink on screen per frame: the caret, the line being written, the
 *  INFRASTRUCTURE label once in frame */
export const MEASURE = (() => {
  let lowest = 0;
  let lowestG = 0;
  let caretMax = 0;
  let caretMaxG = 0;
  let prev: { x: number; y: number } | null = null;
  let prevLine = -1;
  const vs: number[] = [];
  for (let G = G0; G < G0 + DURATION; G++) {
    const cam = camAt(G);
    const c = caretAt(G);
    const sc = screenOf(cam, c.x, c.y + 23);
    const lineB = screenOf(cam, 0, Math.max(c.y + 23, lineTop(0) + WORD_H)).y;
    let st = 0;
    STATIONS.forEach((S, i) => {
      if (stationIn(i, G) > 0.01) st = Math.max(st, screenOf(cam, 0, S.labelY + 34).y);
    });
    const low = Math.max(sc.y, lineB, st);
    if (low > lowest) {
      lowest = low;
      lowestG = G;
    }
    const s = screenOf(cam, c.x, c.y);
    const line = Math.round(c.y);
    if (prev && Math.abs(line - prevLine) < 40) {
      const v = Math.hypot(s.x - prev.x, s.y - prev.y);
      if (v > caretMax) {
        caretMax = v;
        caretMaxG = G;
      }
    }
    prev = s;
    prevLine = line;
    const p = screenOf(cam, 400, 600);
    vs.push(p.y);
  }
  let dv = 0;
  for (let i = 2; i < vs.length; i++) dv = Math.max(dv, Math.abs(vs[i] - 2 * vs[i - 1] + vs[i - 2]));
  return { lowest, lowestG, caretMax, caretMaxG, camDv: dv };
})();
if (MEASURE.lowest > 1400) {
  throw new Error(`AprilToAugust: lowest ink at screen y ${MEASURE.lowest.toFixed(1)} (G${MEASURE.lowestG})`);
}
