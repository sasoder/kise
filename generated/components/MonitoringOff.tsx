import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { IncidentWorld } from "./incidentShared";
import { Humans, dimAt } from "./incidentHumans";
import { Collective } from "./incidentCollective";
import {
  CAM_M,
  FUTURE,
  FutureLabel,
  EXTRA_DURATION,
  G_EXTRA0,
  MonitorBracket,
  MonitorLine,
  drainAt,
  proveWindow,
} from "./incidentMonitor";

// ---------------------------------------------------------------------------
// Noam_Airgapping, film A, EXTRA `45_MonitoringOff` — in 0:45.159, G0 = 878.
// "like, one, we didn't have chain-of-thought monitoring on for those models."
// SRT 45.159 -> 47.859 (speech 2.700 s). DURATION = round(2.700 * 24) + 16 = 65 + 16 = 81.
// Word -> frame (G - 878): like 0 · one-we 2 · didn't 13 · have 17 · chain 23 ·
//   of 26 · thought 29 · monitoring 32 · on-for 38 · those 52 · models 56 · ends 65.
//
// The world at G878 (incidentShared + incidentHumans + incidentCollective): the
// whole incident standing — three converted stations, three swarms alive and
// joined into one network, orange plan-lines in the column — the humans above
// APR, dim 0, the caret writing far below (y ≈ 2150, off frame).
//
// GESTURES (the extra is a held picture; one camera move, the rest is life):
//  1. f0-81   "we didn't have chain-of-thought monitoring on"  THE MONITOR IS OFF:
//             the reader line lies across the column just under the humans at
//             INK_LO, parked, not moving. Between it and the first orange line
//             (MAY) is a stretch of unread white text — the distance the viewer
//             is meant to see. (It is the world's; nothing about it is keyed.)
//  2. f0-81   (camera) ONE SLOW CREEP, k ≈ 0.92 -> 0.93, the whole incident in
//             frame, centred on its true bbox: the humans' heads ≈ 85 px from the
//             top, the parked reader under them, MAY and swarm 1 below, the
//             INFRASTRUCTURE label above the caption band; the creep leans in
//             toward the reader / MAY. Pre-rolled so f0 is already moving.
//  3. ambient swarms wandering, packets on the network and the rack threads, the
//             reversed packet on the loop, the humans' drift, the grid's drift.
//  Tail f65-80: the world runs on — the monitor starts to light at G946 (f68),
//  which is cut 5's first gesture; the editor cuts at f65.
//  Carried from cut 4: `future` = A2's curve (FUTURE_G 699-711) and its FUTURE label, so the
//  lines past NOW (world y ≥ 1787, at the frame's bottom edge) stay degraded.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const G0 = G_EXTRA0;
export const DURATION = EXTRA_DURATION;
/** the frame (G) cut 5 picks up from: this cut's speech end */
export const G_SPEECH_END = 943;

/** the camera this cut uses — cut 5 imports it and asserts the join */
export const camAt = (G: number) => CAM_M.at(G);

/** caption band (incl. every station and label), head-room, side air, reader speed,
 *  camera smoothness — throws */
export const PROOF = proveWindow("MonitoringOff", G_EXTRA0, G_EXTRA0 + EXTRA_DURATION - 1, G_EXTRA0);

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const MonitoringOff: React.FC<Props> = () => {
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
      overDom={
        <>
          <Humans G={G} k={cam.k} />
          <FutureLabel k={cam.k} />
        </>
      }
    />
  );
};

export default MonitoringOff;
