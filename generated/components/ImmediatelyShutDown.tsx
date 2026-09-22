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
  CUT5_DURATION,
  G_CUT5_0,
  MonitorBracket,
  MonitorLine,
  drainAt,
  proveWindow,
} from "./incidentMonitor";
import { G_SPEECH_END as EXTRA_END, camAt as extraCamAt } from "./MonitoringOff";

// ---------------------------------------------------------------------------
// Noam_Airgapping, film A, cut 5 `47_ImmediatelyShutDown` — in 0:47.859, G0 = 943.
// "Like, if we had chain-of-thought monitoring on for those models, it would
//  have just, like, immediately shut it down."
// SRT 47.859 -> 51.799 (speech 3.940 s). DURATION = round(3.940 * 24) + 16 = 95 + 16 = 111.
// Word -> frame (G - 943): like 0 · if-we 3 · had 7 · chain 10 · of 14 · thought 16 ·
//   monitoring 18 · on-for 24 · those 33 · models 36 · it 47 · would 49 · have 52 ·
//   just 54 · like 59 · immediately 64 · shut 74 · it 88 · down 90 · ends 95.
//
// Butts the extra `45_MonitoringOff`: both read ONE camera table (`CAM_M`) and one
// monitor state in global G, so f0 here is the extra's frame at its speech end
// (G943) exactly; asserted below against the extra's own export.
//
// GESTURES (one film: the reader runs, finds, and the find drains everything):
//  1. G946-958  "if we had chain-of-thought monitoring on" (G946-967)
//               THE MONITOR TURNS ON: the reader line brightens INK_LO -> INK_HI
//               in place under the humans, landing 9 f before "on".
//  2. G956-1004 "on for those models, it would have just" (G967-997)
//               IT READS: the line runs down the column at a CONSTANT rate
//               (sine ramps in and out; plateau `READ_V` ≈ 11.4 world px/f) over
//               the white APR text — nothing to find there.
//  3. G995-1001 "like, immediately" (G1002-1007)
//               IT FINDS, IMMEDIATELY: the first orange thing in the text is
//               MAY's plan-line; the frame the reader's own y crosses it the white
//               bracket starts drawing round it from its left end, closed G1001.
//               The reader eases to rest in the gap under it.
//  4. G1001-1047 "shut it down" (G1017-1033)
//               SHUT DOWN: from that bracket the world's drain wave runs down the
//               whole column — the network's threads retract, each swarm's dots
//               fly back into the line they boiled out of and go out, the stations
//               turn white again (the loop's packet runs forward), the white
//               brackets close round JUN and JUL, and every plan-line un-types
//               right to left, leaving empty brackets. One continuous wave, MAY
//               first, JUL last; the column is white by ≈ G1047.
//  5. camera    glide 1 G950-996: in on the reader as it runs (k 0.93 -> 1.34),
//               cresting on the find. glide 2 G994-1036 (no dead stop): THE PULL-BACK that takes
//               in the whole incident turning white (k -> 0.82), then a slow creep
//               to the tail.
//  Tail: hold with life — the humans' drift, the loop's packet, the last lines
//  un-typing, the camera's creep and sway. The caret keeps writing at y ≈ 2.3k,
//  below this framing (it is the world's; nothing stops it).
//  Carried from cut 4: `future` = A2's curve (FUTURE_G 699-711) and its FUTURE label, so the
//  lines past NOW (world y ≥ 1787, at the frame's bottom edge) stay degraded.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const G0 = G_CUT5_0;
export const DURATION = CUT5_DURATION;

// THE JOIN: f0 here must be the extra's camera at its speech end.
(() => {
  if (EXTRA_END !== G0) throw new Error(`ImmediatelyShutDown: the extra ends at G${EXTRA_END}, not G${G0}`);
  const a = extraCamAt(EXTRA_END);
  const b = CAM_M.at(G0);
  const drift = Math.max(Math.abs(a.k - b.k) / a.k, Math.abs(a.cx - b.cx) / 1080, Math.abs(a.cy - b.cy) / 1920);
  if (drift > 0.003) throw new Error(`ImmediatelyShutDown: the join drifts ${(drift * 100).toFixed(3)} %`);
})();

/** caption band, head-room, edge air, reader speed, camera smoothness — throws.
 *  From G1036 (the pull-back has landed) every station and plan-line is subject. */
export const PROOF = proveWindow("ImmediatelyShutDown", G0, G0 + DURATION - 1, 1036);

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const ImmediatelyShutDown: React.FC<Props> = () => {
  const frame = useCurrentFrame();
  const G = G0 + frame;
  const cam = CAM_M.at(G);
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

export default ImmediatelyShutDown;
