import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_LIFT, CAM_STIFF, FRAME_H, FRAME_W, sway } from "./fieldShared";
import { hermite } from "./alignShared";
import { IncidentWorld, caretAt, screenOf, type Cam } from "./incidentShared";
import { Collective } from "./incidentCollective";
import { HUMANS_INK, HUMANS_WINDOW, Humans, dimAt } from "./incidentHumans";
import { CAM_B } from "./OpenAIInfrastructure";
import { camBTarget } from "./ThreeSwarms";

// ---------------------------------------------------------------------------
// Noam_Airgapping, FILM A, cut 3 — `26_InTheDark`
// "All of this while humans remained more or less in the dark about the scope
//  of what this collective was doing, this agent swarming was doing."
// SRT 26.480s -> 33.100s ("that" onset). Global G = round((t - 8.560) * 24):
// in G430, speech ends G589. DURATION = round(6.620 * 24) + 16 = 159 + 16 = 175.
//
// Butts the extra `22_OpenAIInfrastructure` (A1): at f0 this camera IS A1's
// camera at G430 — position AND velocity (the damper's state is rebuilt from
// CAM_B's last two rows and carried on), asserted at module scope.
//
// GESTURES (each with the word it serves):
//  1. G430-495  "All of this" (430-450) -> "while humans" (457-461): ONE glide
//               from the racks up the whole column (easing out to k 1.0 on the
//               way) — past JUL, JUN, MAY, every converted station, three swarms,
//               the orange plan-lines — to the top of the page, where the humans
//               rise into place above APR as they come into frame (slide up +
//               fade, G461-479: `incidentHumans`). The camera arrives on them.
//  2. G468-492  "remained more or less in the dark" (469-497): `dim` 0 -> 1 on the
//               world. The grid and the white text go dark; ORANGE stays full; the
//               humans stay white (they are the subject); one soft-edged lit window
//               stays over the first two APR lines — all they can see. The MAY
//               plan-line glows just below it. The camera creeps in on the window
//               (held breath, G492-507).
//  3. G507-560  "about the scope of what this collective was doing" (502-553):
//               THE move — one long pull-back from the humans' window to the whole
//               orange shape below it (k 1.34 -> 0.64): the lit window shrinks to a
//               sliver at the top of a column whose plan-lines, swarms and stations
//               burn orange in the dark.
//  4. G516-536  "collective" (539): orange threads join each plan-line to its
//               swarm and each swarm to the next — ONE network — with packets
//               circulating on it (`incidentCollective`), landing 3 f before the
//               word, mid pull-back.
//  5. G556-605  "this agent swarming was doing" (566-581) + tail: packets circulate,
//               dots wander, the caret writes on; the camera drifts down with the
//               caret so the lowest ink stays above the caption band.
// Camera: two glides (1, 3) and the creep between them. Nothing else is added.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const WIDTH = FRAME_W;
export const HEIGHT = FRAME_H;
export const G0 = 430;
/** round((33.100 - 26.480) * 24) + 16 */
export const DURATION = 175;
const G_END = G0 + DURATION + 2;

// --- the join: A1's damper state at G430 ---------------------------------------
const unsway = (c: Cam, G: number) => {
  const s = sway(G);
  return { x: c.cx - s.dx, cy: c.cy - s.dy, k: c.k };
};
const J1 = unsway(CAM_B.at(G0), G0);
const J0 = unsway(CAM_B.at(G0 - 1), G0 - 1);
/** where the camera's CONTENT centre was at the join (cy - CAM_LIFT / k) */
export const JOIN = { x: J1.x, y: J1.cy - CAM_LIFT / J1.k, k: J1.k };

// --- the target track (content centre, global G) --------------------------------
// Knots on a monotone cubic Hermite (no overshoot, C1). The first two knots are
// A1's own target (`camBTarget`) at G430 and G434, so the track leaves from where
// the extra's camera was heading, carrying its drift.
const B0 = camBTarget(430);
const B1 = camBTarget(434);
const KN = [
  { G: 430, x: B0.x, y: B0.y, k: B0.k },
  { G: 434, x: B1.x, y: B1.y, k: B1.k },
  { G: 462, x: 560, y: 600, k: 1.0 },
  { G: 492, x: 392, y: 120, k: 1.3 },
  { G: 507, x: 392, y: 104, k: 1.35 },
  { G: 555, x: 548, y: 816, k: 0.64 },
  { G: 572, x: 548, y: 846, k: 0.64 },
  { G: 610, x: 548, y: 874, k: 0.638 },
];
const hx = hermite(KN.map((n) => n.G), KN.map((n) => n.x));
const hy = hermite(KN.map((n) => n.G), KN.map((n) => n.y));
const hk = hermite(KN.map((n) => n.G), KN.map((n) => n.k));

/** fieldShared's damper, continued from A1's state at G430 instead of from rest. */
export const CAM_C = (() => {
  let x = J1.x;
  let y = J1.cy;
  let k = J1.k;
  let vx = J1.x - J0.x;
  let vy = J1.cy - J0.cy;
  let vk = J1.k - J0.k;
  const rows: Cam[] = [];
  const s0 = sway(G0);
  rows.push({ cx: x + s0.dx, cy: y + s0.dy, k });
  for (let G = G0 + 1; G <= G_END; G++) {
    const tk = hk(G);
    const tx = hx(G);
    const ty = hy(G) + CAM_LIFT / tk;
    vx += (tx - x) * CAM_STIFF - vx * CAM_DAMP;
    x += vx;
    vy += (ty - y) * CAM_STIFF - vy * CAM_DAMP;
    y += vy;
    vk += (tk - k) * CAM_STIFF - vk * CAM_DAMP;
    k += vk;
    const s = sway(G);
    rows.push({ cx: x + s.dx, cy: y + s.dy, k });
  }
  const at = (G: number) => rows[Math.max(0, Math.min(rows.length - 1, Math.round(G) - G0))];
  return { g0: G0, at, rows };
})();

// THE JOIN PROOF: f0 is A1's frame at G430 (position within 0.3 %).
(() => {
  const a = CAM_C.at(G0);
  const b = CAM_B.at(G0);
  const rel = Math.max(Math.abs(a.cx - b.cx) / Math.abs(b.cx), Math.abs(a.cy - b.cy) / Math.abs(b.cy), Math.abs(a.k - b.k) / b.k);
  if (!(rel <= 0.003)) throw new Error(`InTheDark: camera join at G430 drifts ${(rel * 100).toFixed(3)} %`);
})();

// CAPTION BAND + HEAD-ROOM, from the resolved wide on (G556-605): the caret
// (the lowest ink) stays above screen y 1400 and the humans' heads below y 50.
// Measured: caret <= 1394, humans' top >= 126. BEFORE G556 the camera is on the
// upper page (the humans' window, the pull-back in flight) and the column itself
// runs on below the frame — a column cannot be framed close at its top without
// its lower lines crossing the band; that is the one deliberate exception.
(() => {
  for (let G = 556; G < G0 + DURATION; G++) {
    const cam = CAM_C.at(G);
    const c = caretAt(G);
    const low = screenOf(cam, c.x, c.y + 23).y;
    const top = screenOf(cam, 0, HUMANS_INK.y0).y;
    if (low > 1400 || top < 50) throw new Error(`InTheDark: G${G} lowest ${low.toFixed(0)} top ${top.toFixed(0)}`);
  }
})();

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const InTheDark: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const G = G0 + f;
  const cam = CAM_C.at(G);
  return (
    <IncidentWorld
      G={G}
      cam={cam}
      dim={dimAt(G)}
      dimWindow={HUMANS_WINDOW}
      orangeSvg={<Collective G={G} />}
      overDom={<Humans G={G} k={cam.k} />}
    />
  );
};

export default InTheDark;
