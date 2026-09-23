import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_LIFT, CAM_STIFF, FRAME_H, FRAME_W, camEase, sway } from "./fieldShared";
import { IncidentWorld, SCOPE, caretAt, screenOf, type Cam } from "./incidentSharedV2";
import { Collective } from "./incidentCollectiveV2";
import { HUMANS_INK, HUMANS_WINDOW, Humans, dimAt } from "./incidentHumansV2";
import { CAM_V2, camV2Target } from "./incidentCameraV2";

// ---------------------------------------------------------------------------
// Noam_Airgapping, FILM A, cut 3 V2 — `26_InTheDark_V2`
// "All of this while humans remained more or less in the dark about the scope
//  of what this collective was doing, this agent swarming was doing."
// SRT 26.480s -> 33.100s ("that" onset). Global G = round((t - 8.560) * 24):
// in G430, speech ends G589. DURATION = round(6.620 * 24) + 16 = 159 + 16 = 175.
//
// V1's approved staging (`InTheDark.tsx`) on the V2 layout (`incidentSharedV2`):
// the column is centred on its own at x 540 and the stations stand far right
// (x 1420) at their own heights (TRAINING 359, EVALUATION 1019, racks 1764).
//
// Butts the extra `22_OpenAIInfrastructure_V2` (v2w): at f0 this camera IS
// `CAM_V2` at G430 — position AND velocity (the damper's state is rebuilt from
// its rows G429/G430 and carried on), asserted at module scope.
//
// GESTURES (each with the word it serves):
//  1. G430-496  "All of this" (430-450) -> "while humans" (457-461): ONE glide
//               from the rack close-up up and left across the whole incident —
//               past EVALUATION and TRAINING burning orange, the three swarms,
//               the long orange threads, the plan-lines — to the top of the
//               page, where the humans rise into place above APR as they come
//               into frame (G461-479, `incidentHumansV2`). The camera arrives
//               on them. The glide breathes out (k 1.85 -> ~1.0) so nothing on
//               screen outruns the speed cap, and y leads x (up first, then the
//               sweep left along the top), so it reads as one curve.
//  2. G468-492  "remained more or less in the dark" (469-497): `dim` 0 -> 1 on
//               the world. The grid and the white text go dark; ORANGE stays
//               full; the humans stay white (the subject); one soft lit window
//               stays over the first two APR lines — all they can see. The MAY
//               plan-line burns just below it. The camera creeps in on the
//               window (held breath, G492-507).
//  3. G507-557  "about the scope of what this collective was doing" (502-553):
//               THE move — the one moment the whole scene is in frame: one long
//               pull-back from the humans' window to humans + column + all three
//               stations (k 1.35 -> 0.59, the largest k that holds all of it
//               in the y 110-1400 band with side air): the lit window shrinks
//               to a sliver at the top of a dark page whose plan-lines, swarms
//               and stations burn orange.
//  4. G516-538  "collective" (539): orange threads join each plan-line to its
//               swarm and each swarm to the next — ONE network — with packets
//               circulating (`incidentCollectiveV2`), landing on the word,
//               mid pull-back.
//  5. G557-605  "this agent swarming was doing" (566-581) + tail: packets
//               circulate, dots wander, the caret writes on; the camera keeps a
//               slow decaying drift out (k 0.59 -> 0.585) — never parked.
// Camera: two glides (1, 3) and the creep between them. Nothing else is added.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const WIDTH = FRAME_W;
export const HEIGHT = FRAME_H;
export const G0 = 430;
/** round((33.100 - 26.480) * 24) + 16 */
export const DURATION = 175;
const G_END = G0 + DURATION + 2;

// --- the join: CAM_V2's damper state at G430 --------------------------------------
const unsway = (c: Cam, G: number) => {
  const s = sway(G);
  return { x: c.cx - s.dx, cy: c.cy - s.dy, k: c.k };
};
const J1 = unsway(CAM_V2.at(G0), G0);
const J0 = unsway(CAM_V2.at(G0 - 1), G0 - 1);

// --- the wide: humans + column + all three stations -------------------------------
/** subject extents in the wide (world px): humans' ink top .. INFRASTRUCTURE label bottom */
export const WIDE_BOX = { x0: SCOPE.x0, x1: SCOPE.x1, y0: HUMANS_INK.y0, y1: SCOPE.y1 };
/** the screen band the wide fills: humans' heads at y 112, the rack label at 1390 (sway margin) */
const BAND = { top: 112, bottom: 1390 };
export const K_WIDE = (BAND.bottom - BAND.top) / (WIDE_BOX.y1 - WIDE_BOX.y0);
/** content centre (target y) that puts WIDE_BOX.y0 at BAND.top at K_WIDE:
 *  screen = 960 + (wy - (y + LIFT/k)) k  ->  y = wy - (screen - 835) / k */
const WIDE = {
  x: (WIDE_BOX.x0 + WIDE_BOX.x1) / 2,
  y: WIDE_BOX.y0 - (BAND.top - 835) / K_WIDE,
  k: K_WIDE,
};
const K_TAIL = K_WIDE * 0.992;

// --- the target track (content centre, global G) -----------------------------------
// Each axis is a chain of eased segments (fieldShared camEase: zero velocity at
// both ends), damped below. It leaves from the extra's own target at G430.
// The glide's zoom-out leads its travel (k is down to 0.9 before the climb is at
// full speed) and y leads x (the climb, then the sweep left along the top), so
// the fastest travel happens at the widest k and nothing outruns the cap.
const B0 = camV2Target(430);
/** the humans' window framing (V1: content centre on the humans, y 120 / 104) */
const HUM_X = (HUMANS_INK.x0 + HUMANS_INK.x1) / 2;
type Seg = { a: number; b: number; d: number; w?: number };
const chain = (v0: number, segs: Seg[]) => (G: number) =>
  segs.reduce((v, s) => v + s.d * camEase((G - s.a) / (s.b - s.a), s.w ?? 1), v0);
/** the glide (1), the held breath (2), the pull-back (3), the tail drift (5) */
export const T = { glide: [432, 506], breath: [506, 514], pull: [514, 572], tail: [572, 622] } as const;
const K_FLY = 0.85;
const ty0 = chain(B0.y, [
  { a: 446, b: T.glide[1], d: 120 - B0.y, w: 1.0 },
  { a: T.breath[0], b: T.breath[1], d: -16 },
  { a: T.pull[0], b: T.pull[1], d: WIDE.y - 104 },
  { a: T.tail[0], b: T.tail[1], d: 14 },
]);
const tx0 = chain(B0.x, [
  { a: 448, b: 510, d: HUM_X - B0.x },
  { a: T.pull[0], b: T.pull[1], d: WIDE.x - HUM_X },
  { a: T.tail[0], b: T.tail[1], d: 6 },
]);
const tk0 = chain(B0.k, [
  { a: T.glide[0], b: 468, d: K_FLY - B0.k, w: 0.72 },
  { a: 484, b: T.breath[1], d: 1.35 - K_FLY, w: 1.15 },
  { a: T.pull[0], b: T.pull[1], d: K_WIDE - 1.35 },
  { a: T.tail[0], b: T.tail[1], d: K_TAIL - K_WIDE },
]);
const hx = tx0;
const hy = ty0;
const hk = tk0;

/** fieldShared's damper, continued from CAM_V2's state at G430 instead of from rest. */
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

// THE JOIN PROOF: f0 is the extra's frame at G430 (position within 0.3 %).
(() => {
  const a = CAM_C.at(G0);
  const b = CAM_V2.at(G0);
  const rel = Math.max(
    Math.abs(a.cx - b.cx) / Math.abs(b.cx),
    Math.abs(a.cy - b.cy) / Math.abs(b.cy),
    Math.abs(a.k - b.k) / b.k,
  );
  if (!(rel <= 0.003)) throw new Error(`InTheDarkV2: camera join at G430 drifts ${(rel * 100).toFixed(3)} %`);
})();

// THE WIDE PROOF, from the pull-back's landing on (WIDE_FROM-605): the whole scene —
// humans, column (+ caret), all three stations with their labels — in frame,
// humans' heads >= y 60, lowest subject ink (the rack label, the caret) <= 1400,
// side air >= 60.
export const WIDE_FROM = 580;
export const WIDE_MEASURE = (() => {
  let top = 1e9;
  let low = 0;
  let air = 1e9;
  for (let G = WIDE_FROM; G < G0 + DURATION; G++) {
    const cam = CAM_C.at(G);
    const c = caretAt(G);
    const t = screenOf(cam, 0, WIDE_BOX.y0).y;
    const lo = Math.max(screenOf(cam, 0, WIDE_BOX.y1).y, screenOf(cam, c.x, c.y + 23).y);
    const l = screenOf(cam, WIDE_BOX.x0, 0).x;
    const r = FRAME_W - screenOf(cam, WIDE_BOX.x1, 0).x;
    top = Math.min(top, t);
    low = Math.max(low, lo);
    air = Math.min(air, l, r);
    if (lo > 1400 || t < 60 || l < 60 || r < 60) {
      throw new Error(`InTheDarkV2: wide G${G} top ${t.toFixed(0)} lowest ${lo.toFixed(0)} air ${l.toFixed(0)}/${r.toFixed(0)}`);
    }
  }
  return { top, low, air, kWide: K_WIDE };
})();

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const InTheDarkV2: React.FC<Props> = () => {
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

export default InTheDarkV2;
