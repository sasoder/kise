import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  FPS,
  IncidentWorld,
  K_REST,
  STATIONS,
  SWARM_N,
  buildCamTable,
  screenOf,
  seg01,
  swarmDot,
  type Cam,
} from "./incidentShared";

export { FPS };

// ---------------------------------------------------------------------------
// Noam_Airgapping, film A, cut 2: `ThreeSwarms` — in 0:14.480, G0 = 142.
// "there were three consecutive AI agent swarms, which, like, first subverted
//  the training process, then subverted the evaluation process,"
// SRT 14.480 -> 22.000 (speech ends G323). DURATION = 180 + 16 = 196.
//
// Words (G): there 142 · were 148 · three 152 · consecutive 161 · ai 180 ·
//   agent 195 · swarms 215 · which 234 · like 237 · first 240 · subverted 247 ·
//   the 254 · training 258 · process 263 · then 279 · subverted 282 · the 293 ·
//   evaluation 302 · process 312 · (ends 323)
//
// Picks up cut 1's standing column (the unshown gap G115-142 is the world
// running): whole APR->AUG period, stations faint on the right.
//
// GESTURES — each with the word it serves:
//  1. G140-222 "three consecutive AI agent swarms": the three orange plan-lines
//     ignite deep -> ripe ONE AFTER ANOTHER (MAY G140, JUN G158, JUL G176) and
//     each boils out its swarm: the dots rise off the line's own bars on
//     individual arcs and gather into a composed blob beside the column (MAY
//     done ~G188, JUN ~G206, JUL ~G224). Three blobs, born in sequence.
//  2. G236-276 "first subverted the training process": swarm 1 surges onto
//     TRAINING and wraps it; the loop turns orange from the contact point round
//     (the crowd's own front, then the loop carries it); the arrowhead is
//     reached and turns (G245) and the packet reverses: training runs the
//     swarm's way. Fully orange G256 ("the" 254 / "training" 258). The wrap lets
//     go and settles beside the station (G272-305).
//  3. G278-318 "then subverted the evaluation process": swarm 2 pours down the
//     checklist's left side; the three white X boxes flip to orange ticks one by
//     one as it passes (G287, 293, 299 — before "evaluation" 302). It settles
//     beside (G312-345).
//  4. swarm 3 is born and waits beside JUL, alive (the extra's payoff).
//
// CAMERA (CAM_B, shared with the extra `OpenAIInfrastructure`, one table in
// global G, damped + sway):
//   a. G146-182  whole period (k 0.90) -> k 1.00 settling on the births' rows
//   b. G214-250  THE PUSH: onto TRAINING as swarm 1 arrives (k 1.75)
//   c. G262-294  glide down to EVALUATION (k 1.70), landing before "evaluation"
//   d. G292-323  a slow creep (still moving at the speech end, where the extra
//                picks it up)
// ---------------------------------------------------------------------------

export const G0 = 142;
export const DURATION = 196;
export const SPEECH_END_G = 323;

const trn = STATIONS[0];
const evl = STATIONS[1];

/** CAM_B target: content centre (x, y) and k, as a sum of eased segments in
 *  global G. Shared by ThreeSwarms (G142-337) and OpenAIInfrastructure
 *  (G323-446), so their join is the same camera. */
export const camBTarget = (G: number) => {
  // rest (cut 1's end framing)
  let x = 550;
  let y = 680;
  let k = K_REST;
  // a. onto the births
  const a = seg01(G, 146, 182, 0.9);
  x += (556 - 550) * a;
  y += (630 - 680) * a;
  k += (1.0 - K_REST) * a;
  // b. the push onto TRAINING
  const b = seg01(G, 214, 250, 0.9);
  x += (745 - 556) * b;
  y += (trn.cy + 12 - 630) * b;
  k += (1.75 - 1.0) * b;
  // c. down to EVALUATION
  const c = seg01(G, 262, 294, 1.0);
  y += (evl.cy + 8 - (trn.cy + 12)) * c;
  k += (1.7 - 1.75) * c;
  // d. creep toward JUL (continues into the extra)
  const d = seg01(G, 292, 352, 1.0);
  y += 26 * d;
  // e. (extra) the glide down to JUL: racks, mark, swarm 3, its plan-line's end
  const e = seg01(G, 326, 356, 0.85);
  x += (742 - 745) * e;
  y += (975 - (evl.cy + 8 + 26)) * e;
  k += (1.45 - 1.7) * e;
  // f. (extra) creep in on the threads for "directly"
  const f = seg01(G, 394, 416, 0.9);
  x += (762 - 742) * f;
  y += (1004 - 975) * f;
  k += (1.58 - 1.45) * f;
  // g. (extra) the hold keeps drifting
  const g = seg01(G, 416, 480, 1.0);
  y += 10 * g;
  k += 0.02 * g;
  return { x, y, k };
};

export const CAM_B = buildCamTable(G0 - 40, 480, camBTarget);
export const camAt = (G: number): Cam => CAM_B.at(G);

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

const ThreeSwarms: React.FC<Props> = ({ backgroundSrc, backgroundBlur, parallax }) => {
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

export default ThreeSwarms;

// ---------------------------------------------------------------------------
// PROOFS — shared with the extra.
// ---------------------------------------------------------------------------
/** camera smoothness (|dv| of a fixed world point, screen px/f^2), the fastest
 *  swarm dot on screen, and the lowest SUBJECT ink (swarm dots + the station
 *  being acted on + its label) per frame. */
export const measureCam = (g0: number, g1: number, subject: (G: number) => number[]) => {
  const ys: { x: number; y: number }[] = [];
  let dotMax = 0;
  let dotMaxG = 0;
  let low = 0;
  let lowG = 0;
  for (let G = g0; G < g1; G++) {
    const cam = camAt(G);
    ys.push(screenOf(cam, 700, 700));
    for (let s = 0; s < 3; s++) {
      for (let i = 0; i < SWARM_N; i += 3) {
        const a = swarmDot(s, i, G - 1);
        const b = swarmDot(s, i, G);
        if (a.phase === 0) continue;
        const pa = screenOf(camAt(G - 1), a.x, a.y);
        const pb = screenOf(cam, b.x, b.y);
        if (pb.y < 0 || pb.y > 1920 || pb.x < 0 || pb.x > 1080) continue;
        const v = Math.hypot(pb.x - pa.x, pb.y - pa.y);
        if (v > dotMax) {
          dotMax = v;
          dotMaxG = G;
        }
      }
    }
    for (const wy of subject(G)) {
      const sy = screenOf(cam, 0, wy).y;
      if (sy > low) {
        low = sy;
        lowG = G;
      }
    }
  }
  let dv = 0;
  let dvG = 0;
  for (let i = 2; i < ys.length; i++) {
    const ax = ys[i].x - 2 * ys[i - 1].x + ys[i - 2].x;
    const ay = ys[i].y - 2 * ys[i - 1].y + ys[i - 2].y;
    const m = Math.hypot(ax, ay);
    if (m > dv) {
      dv = m;
      dvG = g0 + i;
    }
  }
  return { camDv: dv, camDvG: dvG, dotMax, dotMaxG, lowestSubject: low, lowestSubjectG: lowG };
};

/** the subject at G: the station the swarm is on (icon + label) and its swarm */
const subjectA = (G: number) => {
  const s = G < 286 ? 0 : 1;
  const st = STATIONS[s];
  const ys = [st.labelY + 34];
  for (let i = 0; i < SWARM_N; i += 2) ys.push(swarmDot(s, i, G).y + 8);
  return G < 222 ? [] : ys;
};
export const MEASURE = measureCam(G0 + 1, G0 + DURATION, subjectA);
if (MEASURE.lowestSubject > 1400) {
  throw new Error(`ThreeSwarms: subject ink at screen y ${MEASURE.lowestSubject.toFixed(0)} (G${MEASURE.lowestSubjectG})`);
}
