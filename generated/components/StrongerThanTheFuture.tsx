import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { FRAME_H, FRAME_W, clamp01, smoothstep } from "./fieldShared";
import { LABEL_IN, hermite } from "./alignShared";
import {
  IncidentWorld,
  LABEL_SIZE,
  headAt,
  lineTop,
  screenOf,
  MONTH_LABEL_R,
  NOW_LINE,
  buildCamTable,
  lineCY,
} from "./incidentShared";
import { WLabel } from "./incidentShared";
import { Collective } from "./incidentCollective";
import { dimAt } from "./incidentHumans";

// ---------------------------------------------------------------------------
// Noam_Airgapping, FILM A, cut 4 — `35_StrongerThanTheFuture`
// "while we had chain of thought that was, like, stronger than it's going to be
//  in the future"
// SRT 35.719s -> 38.840s ("historically" onset). Global G = round((t - 8.560) * 24):
// in G652, speech ends G727. DURATION = round(3.121 * 24) + 16 = 75 + 16 = 91.
//
// The world (`incidentShared`, A1) at G652: the whole incident standing, the
// dark lifted (dimAt = 0 from G640), the humans standing above APR (off frame),
// the collective network joined (incidentCollective, from cut 3), the caret
// writing line 25 slowly (R_SLOW) far below AUG. The world's future burst eases
// the writing rate up over G684-702 and the first line past NOW starts G702.
//
// GESTURES (each with the word it serves):
//  1. G652-690  "while we had chain of thought" (652-673): the camera RIDES the
//               written column — the last lines of AUG and after, big and legible
//               (k 1.80, a 400 px measure ~720 px wide), the caret writing at
//               screen y ~1090 — one slow downward creep. The legible column is
//               the subject.
//  2. G690-702  "stronger than" (690-702): the breath — the creep decays to a
//               near-hold on the legible text.
//  3. G699-740  "it's going to be in the future" (707-719): the world's future
//               TIME-LAPSE (A1, 2026-09-23): the caret steps onto the rail and
//               races down past the NOW tick, writing 8 lines by G737, each more
//               broken than the last (`future` rises G699-711, evaluated per word
//               at its emission). ONE glide FOLLOWS it down and pulls back
//               (G697-729 target, k 1.80 -> 1.36, centre x 359 -> 279 as the FUTURE label joins
//               the column's bbox), landing ~G740 on: AUG's last legible lines at
//               the top, the dashed NOW + FUTURE, the whole degrading gradient
//               below it. The caret leads the frame down.
//  4. G710-720  "future" (719): the FUTURE label slides up beside the rail at NOW,
//               landing G720, as soon as the pan (G697-713, leading the zoom) has
//               room for it.
//  5. G740-743  tail: the glide's own settle, the caret writing on.
// FRAMING RULES (asserted below, every frame): the column's visible bbox (rail +
// text, + FUTURE once it is in) is centred on screen x 540 (the camera x
// IS its centre); everything right of the column — swarms, stations, their
// labels, the rack threads — is WHOLLY OUT (the frame's top edge stays below the
// INFRASTRUCTURE label); the lowest ink except the caret's own line <= y 1400.
// Nothing else is added.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const WIDTH = FRAME_W;
export const HEIGHT = FRAME_H;
export const G0 = 652;
/** round((38.840 - 35.719) * 24) + 16 */
export const DURATION = 91;

// --- the future ---------------------------------------------------------------
export const FUTURE_G: [number, number] = [699, 711];
export const futureAt = (g: number) => smoothstep(clamp01((g - FUTURE_G[0]) / (FUTURE_G[1] - FUTURE_G[0])));
/** the FUTURE label: starts sliding up at G710, lands G720 on "future" (719) — the
 *  first frame the pan has room for it beside the rail (its left edge is ~0 at
 *  G710 while it is still transparent, 28 px at G712 at 10 % opacity, > 50 px
 *  from G714 on). */
export const FUTURE_LABEL_G = 710;

// --- the camera (content centre, global G) --------------------------------------
// Knots are a monotone cubic Hermite (no overshoot), then fieldShared's damper
// via buildCamTable (+ sway), all in global G. `y` is the CONTENT centre
// (buildCamTable adds CAM_LIFT / k).
/** the column's VISIBLE bbox centre in the opening: rail (156) .. text (562). No
 *  month label is in frame there — AUG sits above the top edge, which has to
 *  stay below the INFRASTRUCTURE label for the right-hand world to be out. */
export const CX_COLUMN = 359;
/** ... and once FUTURE (left edge ~-4) stands beside the rail */
export const CX_FUTURE = 279;
const KN = [
  { G: 652, x: CX_COLUMN, y: 1636, k: 1.8 },
  { G: 690, x: CX_COLUMN, y: 1656, k: 1.81 },
  { G: 697, x: CX_COLUMN, y: 1660, k: 1.81 },
  { G: 729, x: CX_FUTURE, y: 1906, k: 1.36 },
  { G: 770, x: CX_FUTURE, y: 1924, k: 1.36 },
];
// x has its own, earlier ramp: the pan to the FUTURE-inclusive centre leads the
// pull-back, so the label has room beside the rail as it slides in.
const KX = [
  { G: 652, x: CX_COLUMN },
  { G: 697, x: CX_COLUMN },
  { G: 713, x: CX_FUTURE },
  { G: 770, x: CX_FUTURE },
];
const hx = hermite(KX.map((n) => n.G), KX.map((n) => n.x));
const hy = hermite(KN.map((n) => n.G), KN.map((n) => n.y));
const hk = hermite(KN.map((n) => n.G), KN.map((n) => n.k));
export const CAM = buildCamTable(G0, G0 + DURATION + 2, (G) => ({ x: hx(G), y: hy(G), k: hk(G) }));

// THE FRAMING PROOFS, every frame.
//  - caption band: the lowest ink that is not the caret's own line (i.e. every
//    line above the one being written) <= screen y 1400;
//  - head-room: nothing is cut at the top except column text running on above;
//  - WHOLLY OUT: the right-hand world (swarm 2/3 boxes, the stations, the
//    INFRASTRUCTURE label, the swarm->rack threads) never touches the frame.
export const RIGHT_WORLD = [
  { x0: 600, y0: 0, x1: 1100, y1: 1170 }, // swarms 0-2, stations, labels, threads (x >= 605, y <= 1163)
];
export const MEASURE = (() => {
  let lowest = 0;
  let lowestF = 0;
  for (let f = 0; f < DURATION; f++) {
    const G = G0 + f;
    const cam = CAM.at(G);
    const line = headAt(G).line;
    const y = screenOf(cam, 0, lineTop(line - 1) + 22).y;
    if (y > lowest) {
      lowest = y;
      lowestF = f;
    }
    if (y > 1400) throw new Error(`StrongerThanTheFuture: ink at screen y ${y.toFixed(0)} on f${f}`);
    for (const r of RIGHT_WORLD) {
      const a = screenOf(cam, r.x0, r.y0);
      const b = screenOf(cam, r.x1, r.y1);
      const out = a.x >= FRAME_W || b.x <= 0 || a.y >= FRAME_H || b.y <= 0;
      if (!out) throw new Error(`StrongerThanTheFuture: the right-hand world is in frame on f${f}`);
    }
  }
  return { lowest, lowestF };
})();

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const StrongerThanTheFuture: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const G = G0 + f;
  const cam = CAM.at(G);
  const labelIn = (G - FUTURE_LABEL_G) / LABEL_IN;
  return (
    <IncidentWorld
      G={G}
      cam={cam}
      dim={dimAt(G)}
      future={futureAt}
      orangeSvg={<Collective G={G} />}
      overDom={
        <WLabel
          x={MONTH_LABEL_R}
          y={lineCY(NOW_LINE) - LABEL_SIZE * 0.5}
          text="FUTURE"
          inT={labelIn}
          k={cam.k}
          align="right"
        />
      }
    />
  );
};

export default StrongerThanTheFuture;
