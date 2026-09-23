import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { IncidentWorld } from "./incidentSharedV2";
import { Humans, dimAt } from "./incidentHumansV2";
import { Collective } from "./incidentCollectiveV2";
import {
  CAM_M,
  EXTRA_DURATION,
  FUTURE,
  G_EXTRA0,
  MonitorBracket,
  MonitorLine,
  drainAt,
  proveWindow,
} from "./incidentMonitorV2";

// ---------------------------------------------------------------------------
// Noam_Airgapping, film A V2, EXTRA `45_MonitoringOff_V2` — in 0:45.159, G0 = 878.
// "like, one, we didn't have chain-of-thought monitoring on for those models."
// SRT 45.159 -> 47.859 (speech 2.700 s). DURATION = round(2.700 * 24) + 16 = 65 + 16 = 81.
// Word -> frame (G - 878): like 0 · one-we 2 · didn't 13 · have 17 · chain 23 ·
//   of 26 · thought 29 · monitoring 32 · on-for 38 · those 52 · models 56 · ends 65.
//
// V1's approved staging on the V2 layout (`incidentSharedV2`: the column alone,
// centred on x 540; the stations far right and spread down the page). The world
// at G878: the whole incident standing — the orange plan-lines in the column,
// three swarms resting beside their converted stations off right, joined into
// one network whose orange threads leave the plan-lines and run out of the
// right edge — the humans above APR, dim 0, the caret writing far below.
//
// GESTURES (a held picture; one camera move, the rest is life):
//  1. f0-81   "we didn't have chain-of-thought monitoring on"  THE MONITOR IS OFF:
//             the reader line lies across the column just under the humans at
//             INK_LO, parked, not moving. Between it and the first orange line
//             (MAY) is a stretch of unread white text.
//  2. f0-81   (camera) ONE SLOW CREEP on the column framing, k 1.03 -> 1.06: the
//             humans' heads ≈ 95 px from the top, the parked reader under them,
//             the column with its three orange lines, the threads running out to
//             the right (where the stations are: established by cuts 14/22).
//             Pre-rolled from G850 so f0 is already moving.
//  3. ambient packets on the network, the humans' drift, the grid's drift.
//  Tail f65-80: the world runs on — the monitor starts to light at G946 (f68),
//  cut 5's first gesture; the editor cuts at f65.
//  `future` = 0 (V2 cut 4 is plain text: nothing past NOW breaks up).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const G0 = G_EXTRA0;
export const DURATION = EXTRA_DURATION;
/** the frame (G) cut 5 picks up from: this cut's speech end */
export const G_SPEECH_END = 943;

/** the camera this cut uses — cut 5 imports it and asserts the join */
export const camAt = (G: number) => CAM_M.at(G);

export const PROOF = proveWindow("MonitoringOffV2", G_EXTRA0, G_EXTRA0 + EXTRA_DURATION - 1, Infinity);

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const MonitoringOffV2: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const G = G0 + frame;
  const cam = camAt(G);
  const drain = drainAt(G);
  return (
    <IncidentWorld
      G={G}
      cam={cam}
      dim={dimAt(G)}
      drain={drain}
      future={FUTURE}
      whiteSvg={<MonitorBracket G={G} k={cam.k} />}
      orangeSvg={<Collective G={G} drain={drain} />}
      overSvg={<MonitorLine G={G} k={cam.k} />}
      overDom={<Humans G={G} k={cam.k} />}
    />
  );
};

export default MonitoringOffV2;
