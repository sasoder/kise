import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { FPS, IncidentWorld, LABEL_SIZE, MARK_CY, MARK_SIZE, STATIONS, SWARM_N, screenOf, swarmDot } from "./incidentSharedV2";
import { CAM_V2, camV2, camV2Target, measureV2 } from "./incidentCameraV2";

export { FPS, CAM_V2, camV2Target };

// ---------------------------------------------------------------------------
// Noam_Airgapping, film A, EXTRA V2: `OpenAIInfrastructure_V2` — in 0:22.000,
// G0 = 323. "and then gained control of part of OpenAI's infrastructure directly."
// SRT 22.000 -> 26.480 (speech ends G430). DURATION = 108 + 16 = 124.
//
// Words (G): and 323 · then 334 · gained 342 · control 360 · of 371 · part 383 ·
//   of 390 · openai's 393 · infrastructure 407 · directly 418 · (ends 430)
//
// Butts `ThreeSwarmsV2`: the camera IS the same table (`CAM_V2`, global G), so
// f0 is exactly cut 2's camera at G323 — position AND velocity. Station-only
// frames: the column is never in this cut.
//
// GESTURES — each with the word it serves (V1's beats on the V2 layout):
//  1. G318-384 "and then gained control": ONE glide DOWN from EVALUATION to the
//     racks under the OpenAI mark (k 2.0 -> ~1.62 -> 1.75). Swarm 3 (launched
//     G313-321 from JUL's line, off frame) drops down the far left and enters
//     from the LEFT, swinging into the left rack; first contact G358
//     ("control" 360).
//  2. G358-386 "of part of": from the contact point a contiguous third of the
//     units — the LEFT rack — turns orange unit by unit outward (G366-386),
//     around "part" (383). The other two racks stay white: "part of".
//  3. "OpenAI's" (393): the mark stands white and legible above the racks
//     (INK_HI once its station is reached); nothing moves on it.
//  4. G392-416 "infrastructure directly": the camera creeps in on the left rack
//     and five orange threads draw from the swarm straight into each converted
//     unit's LED (G400-416, landing 2 f before "directly"); packets run on them.
//  5. tail G416-446: hold with life — packets on the threads, dots wandering,
//     the grid drift, the camera's slow drift.
//
// 26 V2 picks up at G430: `CAM_V2.at(430)` / `.at(429)` (damper state) and
// `camV2Target(430 / 434)`, as V1's InTheDark did with CAM_B.
// ---------------------------------------------------------------------------

export const G0 = 323;
export const DURATION = 124;
export const SPEECH_END_G = 430;

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

const OpenAIInfrastructureV2: React.FC<Props> = ({ backgroundSrc, backgroundBlur, parallax }) => {
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

export default OpenAIInfrastructureV2;

// ---------------------------------------------------------------------------
// PROOFS: the subject (swarm 3 in flight; then the racks, mark, label and the
// swarm) stays above the caption band; the mark stays below the frame top.
// ---------------------------------------------------------------------------
const INF = STATIONS[2];
export const subjectC = (G: number) => {
  const ys: number[] = [];
  const cam = camV2(G);
  for (let i = 0; i < SWARM_N; i++) {
    const d = swarmDot(2, i, G);
    const x = screenOf(cam, d.x, d.y).x;
    if (d.phase >= 3 && x > 0 && x < 1080) ys.push(d.y + d.r);
  }
  if (G >= 372) ys.push(INF.labelY + LABEL_SIZE);
  return ys;
};
export const MEASURE = measureV2(G0 + 1, G0 + DURATION, subjectC);
if (MEASURE.lowestSubject > 1400) {
  throw new Error(`OpenAIInfrastructureV2: subject ink at screen y ${MEASURE.lowestSubject.toFixed(0)} (G${MEASURE.lowestSubjectG})`);
}
export const MARK_TOP_MIN = (() => {
  let m = Infinity;
  for (let G = 372; G < G0 + DURATION; G++) {
    const c = camV2(G);
    m = Math.min(m, 960 + (MARK_CY - MARK_SIZE / 2 - c.cy) * c.k);
  }
  return m;
})();
if (MARK_TOP_MIN < 150) throw new Error(`OpenAIInfrastructureV2: the mark reaches screen y ${MARK_TOP_MIN.toFixed(0)}`);
