import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { FPS, IncidentWorld, STATIONS, SWARM_N, swarmDot, type Cam } from "./incidentShared";
import { CAM_B, SPEECH_END_G as CUT2_END, camAt as camB, measureCam } from "./ThreeSwarms";

export { FPS, CAM_B };

// ---------------------------------------------------------------------------
// Noam_Airgapping, film A, EXTRA: `OpenAIInfrastructure` — in 0:22.000, G0 = 323.
// "and then gained control of part of OpenAI's infrastructure directly."
// SRT 22.000 -> 26.480 (speech ends G430). DURATION = 108 + 16 = 124.
//
// Words (G): and 323 · then 334 · gained 342 · control 360 · of 371 · part 383 ·
//   of 390 · openai's 393 · infrastructure 407 · directly 418 · (ends 430)
//
// Butts `ThreeSwarms`: the camera IS the same table (`CAM_B` in global G), so
// f0 here is exactly cut 2's camera at its speech end (G323) — position AND
// velocity. The proof below checks it anyway.
//
// GESTURES — each with the word it serves:
//  1. G326-356 "and then": the camera glides down to JUL: the racks under the
//     OpenAI mark, swarm 3 alive beside its plan-line, and the plan-line's end.
//  2. G326-366 "gained control": swarm 3 flows down along a curve to the left
//     rack and presses against it (contact G333); from the contact point a
//     contiguous third of the units — the left rack — turns orange, unit by
//     unit outward (G340-366), landing before "part of" (383): the other two
//     racks stay white. That is "part of".
//  3. "OpenAI's" (393): the mark stays white and legible above the racks (INK_HI
//     once its station is reached); nothing moves on it.
//  4. G394-416 "infrastructure directly": the camera creeps in on the rack and
//     five orange threads draw from the swarm straight into each converted
//     unit's LED (G400-416, landing 2 f before "directly"); packets run on them.
//  5. tail: hold with life — packets on the threads, dots wandering, the
//     reversed packet on the loop above, the grid drift, the camera's drift.
// ---------------------------------------------------------------------------

export const G0 = 323;
export const DURATION = 124;
export const SPEECH_END_G = 430;

export const camAt = (G: number): Cam => camB(G);

// the join: this cut's f0 camera must equal cut 2's camera at its speech end
(() => {
  const a = camB(CUT2_END);
  const b = camAt(G0);
  const d = Math.max(Math.abs(a.cx - b.cx) / 1080, Math.abs(a.cy - b.cy) / 1920, Math.abs(a.k - b.k) / a.k);
  if (G0 !== CUT2_END || d > 0.003) throw new Error(`OpenAIInfrastructure: join drifts ${(d * 100).toFixed(3)} %`);
})();

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

const OpenAIInfrastructure: React.FC<Props> = ({ backgroundSrc, backgroundBlur, parallax }) => {
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

export default OpenAIInfrastructure;

/** the subject once the glide has brought it in (G350+): swarm 3, the racks, the label */
const subjectB = (G: number) => {
  if (G < 350) return [];
  const ys = [STATIONS[2].labelY + 34];
  for (let i = 0; i < SWARM_N; i += 2) ys.push(swarmDot(2, i, G).y + 8);
  return ys;
};
export const MEASURE = measureCam(G0 + 1, G0 + DURATION, subjectB);
if (MEASURE.lowestSubject > 1400) {
  throw new Error(`OpenAIInfrastructure: subject ink at screen y ${MEASURE.lowestSubject.toFixed(0)} (G${MEASURE.lowestSubjectG})`);
}
