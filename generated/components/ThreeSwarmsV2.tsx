import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { FPS, IncidentWorld, LABEL_SIZE, STATIONS, SWARM_N, screenOf, swarmDot } from "./incidentSharedV2";
import { CAM_V2, camV2, measureV2 } from "./incidentCameraV2";

export { FPS, CAM_V2 };

// ---------------------------------------------------------------------------
// Noam_Airgapping, film A, cut 2 V2: `ThreeSwarms_V2` — in 0:14.480, G0 = 142.
// "there were three consecutive AI agent swarms, which, like, first subverted
//  the training process, then subverted the evaluation process,"
// SRT 14.480 -> 22.000 (speech ends G323). DURATION = 180 + 16 = 196.
//
// Words (G): there 142 · were 148 · three 152 · consecutive 161 · ai 180 ·
//   agent 195 · swarms 215 · which 234 · like 237 · first 240 · subverted 247 ·
//   the 254 · training 258 · process 263 · then 279 · subverted 282 · the 293 ·
//   evaluation 302 · process 312 · (ends 323)
//
// V2 (the user, 2026-09-23): f0 is cut 1 V2's last frame (a hold: same camera,
// at rest; the caret has written on a little), then the camera PANS RIGHT to
// the stations — one place per frame. The column is out of frame from the pan
// on; each station is framed alone.
//
// GESTURES — each with the word it serves:
//  1. G142-148 the hold on cut 1's column (the caret writing, the grid drift).
//  2. G144-224 "three consecutive AI agent swarms": the three orange plan-lines
//     ignite deep -> ripe ONE AFTER ANOTHER (MAY G144, JUN G160, JUL G176) and
//     each boils out its swarm, dots rising off the line's own bars into a
//     composed blob that hovers just right of the text (MAY done ~G192, JUN
//     ~G208, JUL ~G224). The camera drifts a little right/in (G146-206) so the
//     three blobs sit inside the column framing.
//  3. G194-258 "which, like, first subverted": swarm 1 FLIES RIGHT (launches
//     G204-212, straight at the station, swinging round it late) and the camera
//     pans right WITH it (G194-244, one long follow; the stations come into view
//     on the right as the column leaves on the left), pushing in as it arrives
//     (k 0.97 -> ~1.9): TRAINING, framed alone. The crowd wraps the loop, the
//     loop turns orange from the contact point round, the arrowhead is reached
//     and turns (G236) and the packet reverses; fully orange G248 ("subverted").
//  4. G248-272 "the training process": the reversed packet runs the swarm's way;
//     the wrap lets go and settles beside (G272-298).
//  5. G254-306 "then subverted the evaluation process": the camera glides DOWN
//     to EVALUATION (breathing out a little on the way, k 1.9 -> 1.7 -> 2.0);
//     swarm 2 (launched G249-257 from its line, off frame) flies out to the
//     right and enters from the LEFT, pouring down the checklist's left side:
//     the three X boxes flip to orange ticks one by one as it passes (G288,
//     294, 300 — "evaluation" 302). EVALUATION framed alone from ~G301.
//  6. G306-337 hold with life: the swarm settles beside (G318-344), the camera
//     creeps; from G318 it starts the long glide down (the extra picks it up).
//
// CAMERA: `incidentCameraV2` (one track for cuts 1, 2 and 22, global G).
// ---------------------------------------------------------------------------

export const G0 = 142;
export const DURATION = 196;
export const SPEECH_END_G = 323;

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

const ThreeSwarmsV2: React.FC<Props> = ({ backgroundSrc, backgroundBlur, parallax }) => {
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

export default ThreeSwarmsV2;

// ---------------------------------------------------------------------------
// PROOFS: the subject (the born swarms while they hover; the flying swarm; the
// station once framed, icon + label) stays above the caption band.
// ---------------------------------------------------------------------------
/** a swarm's dots that are in frame (x) at G: their bottoms, world y */
const dotsY = (s: number, G: number, minPhase = 1) => {
  const ys: number[] = [];
  const cam = camV2(G);
  for (let i = 0; i < SWARM_N; i++) {
    const d = swarmDot(s, i, G);
    const x = screenOf(cam, d.x, d.y).x;
    if (d.phase >= minPhase && d.r > 0.5 && x > 0 && x < 1080) ys.push(d.y + d.r);
  }
  return ys;
};
export const subjectB = (G: number) => {
  if (G < 203) return [0, 1, 2].flatMap((s) => dotsY(s, G));
  if (G < 252) return dotsY(0, G);
  if (G < 262) return [...dotsY(0, G), STATIONS[0].labelY + LABEL_SIZE];
  if (G < 300) return dotsY(1, G, 3);
  return [...dotsY(1, G), STATIONS[1].labelY + LABEL_SIZE];
};
export const MEASURE = measureV2(G0 + 1, G0 + DURATION, subjectB);
if (MEASURE.lowestSubject > 1400) {
  throw new Error(`ThreeSwarmsV2: subject ink at screen y ${MEASURE.lowestSubject.toFixed(0)} (G${MEASURE.lowestSubjectG})`);
}
