import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { IncidentWorld } from "./incidentSharedV2";
import { Humans, dimAt } from "./incidentHumansV2";
import { Collective } from "./incidentCollectiveV2";
import {
  CAM_KEYS,
  CAM_M,
  CUT5_DURATION,
  FUTURE,
  G_CUT5_0,
  MonitorBracket,
  MonitorLine,
  drainAt,
  proveWindow,
} from "./incidentMonitorV2";
import { G_SPEECH_END as EXTRA_END, camAt as extraCamAt } from "./MonitoringOffV2";

// ---------------------------------------------------------------------------
// Noam_Airgapping, film A V2, cut 5 `47_ImmediatelyShutDown_V2` — in 0:47.859, G0 = 943.
// "Like, if we had chain-of-thought monitoring on for those models, it would
//  have just, like, immediately shut it down."
// SRT 47.859 -> 51.799 (speech 3.940 s). DURATION = round(3.940 * 24) + 16 = 95 + 16 = 111.
// Word -> frame (G - 943): like 0 · if-we 3 · had 7 · chain 10 · of 14 · thought 16 ·
//   monitoring 18 · on-for 24 · those 33 · models 36 · it 47 · would 49 · have 52 ·
//   just 54 · like 59 · immediately 64 · shut 74 · it 88 · down 90 · ends 95.
//
// Butts `45_MonitoringOff_V2`: one camera table and one monitor state in global
// G (`incidentMonitorV2`), so f0 here is the extra's frame at its speech end
// (G943) exactly; asserted below against the extra's own export.
//
// V1's approved staging on the V2 layout. GESTURES:
//  1. G946-958  "if we had chain-of-thought monitoring on" (G946-967)
//               THE MONITOR TURNS ON: the reader brightens INK_LO -> INK_HI in
//               place under the humans, landing 9 f before "on".
//  2. G956-1001 "on for those models, it would have just" (G967-997)
//               IT READS: the line runs down the column at a CONSTANT rate over
//               the white APR text — nothing to find there.
//  3. G995-1001 "like, immediately" (G1002-1007)
//               IT FINDS, IMMEDIATELY: MAY's plan-line is the first orange thing;
//               the frame the reader crosses it the white bracket draws round it
//               from its left end, closed ≈ G1001; the reader eases to rest under it.
//  4. G1009-1053 "immediately shut it down" (G1007-1033)
//               SHUT DOWN: from that bracket ONE drain wave runs down the page —
//               the network's threads retract, each swarm lifts off its station
//               and streams home across the frame into the line it boiled out of
//               and goes out; the stations turn white as their swarms leave
//               (TRAINING 1014-1029, EVALUATION 1017-1032, INFRASTRUCTURE
//               1021-1036: "shut ... down"); white brackets close round JUN and
//               JUL; every plan-line un-types right to left, leaving empty
//               brackets. MAY first, JUL last.
//  5. camera    a lean in on the reader as it lights (G948-966, k ≈ 1.07).
//               G966-1020: THE PULL-BACK, starting mid-read, out and right to the SCOPE wide
//               (k 0.585): the column, the humans and all three stations whole,
//               with side air — the stations enter still orange and turn white
//               in frame; then a slow creep continuing it through the tail.
//  Tail: the last dots landing, JUL un-typing, the humans' drift, the loop's
//  packet, the caret writing far below, the camera's creep and sway.
//  `future` = 0 (V2 cut 4 is plain text): the lines past NOW are plain text.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const G0 = G_CUT5_0;
export const DURATION = CUT5_DURATION;

// THE JOIN: f0 here must be the extra's camera at its speech end.
(() => {
  if (EXTRA_END !== G0) throw new Error(`ImmediatelyShutDownV2: the extra ends at G${EXTRA_END}, not G${G0}`);
  const a = extraCamAt(EXTRA_END);
  const b = CAM_M.at(G0);
  const drift = Math.max(Math.abs(a.k - b.k) / a.k, Math.abs(a.cx - b.cx) / 1080, Math.abs(a.cy - b.cy) / 1920);
  if (drift > 0.003) throw new Error(`ImmediatelyShutDownV2: the join drifts ${(drift * 100).toFixed(3)} %`);
})();

/** From the pull-back's landing every station and plan-line is subject. */
export const WIDE_FROM = CAM_KEYS.glide2.g1 + 6;
export const PROOF = proveWindow("ImmediatelyShutDownV2", G0, G0 + DURATION - 1, WIDE_FROM);

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const ImmediatelyShutDownV2: React.FC<Props> = () => {
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
      overDom={<Humans G={G} k={cam.k} />}
    />
  );
};

export default ImmediatelyShutDownV2;
