import { CAM_DAMP, CAM_LIFT, CAM_STIFF, FRAME_H, FRAME_W, clamp01, smoothstep, sway } from "./fieldShared";
import {
  COL_X1,
  K_REST,
  K_STATION,
  LABEL_SIZE,
  MARK_CY,
  MARK_SIZE,
  RACK_X0,
  RACK_Y0,
  RACK_BLOCK_H,
  RACK_BLOCK_W,
  REST_BLOBS,
  STATIONS,
  SWARM_N,
  WAIT_CENTRES,
  headYF,
  screenOf,
  seg01,
  swarmDot,
  type Cam,
} from "./incidentSharedV2";

// ---------------------------------------------------------------------------
// incidentCameraV2 — THE camera of film A V2's opening: ONE track in global G
// for `AprilToAugustV2` (G0 0), `ThreeSwarmsV2` (G0 142) and the extra
// `OpenAIInfrastructureV2` (G0 323). One table, so every join is the same
// camera by construction (position AND velocity), and 26 V2 picks it up at G430
// (`CAM_V2.at(430)`, `CAM_V2.at(429)`, `camV2Target`).
//
// Authored as a TARGET (content centre x, y and zoom k; screen y of the content
// centre = 835 via CAM_LIFT), damped by fieldShared's damper (CAM_STIFF /
// CAM_DAMP, the same math as `runCamera`, run incrementally), plus the hand's
// sway, faded to zero across the 1 -> 2 join so cut 1 ends FULLY AT REST and
// cut 2 opens on the same still frame.
//
// THE TRACK
//  cut 1 (V1's approved move, re-centred on the column alone):
//    k    1.70 -> 0.90, G30 -> G100 (the pull-back), warp 0.85
//    y    tracks the writing head (screen y 835 -> 1110 over G30-62), then eases
//         to the whole-period framing G66 -> G106 (Y_REST)
//    x    556 -> 540 (the column's own centre) G40 -> G94
//    at rest from ~G124; sway fades out G98 -> G124 and stays 0 to G146.
//  cut 2:
//    a. G146-206  the births: a slow drift right/in so the swarms beside the
//                 text sit inside the frame (x 540 -> 596, k 0.90 -> 0.97)
//    b. G194-258  THE FOLLOW: the pan right with swarm 1 (and up to MAY's
//                 level, PAN 194-244), the push-in as it arrives (PUSH 222-258,
//                 k -> 2.0, late warp): TRAINING framed alone ~G256-262
//    c. G254-306  the glide DOWN to EVALUATION, breathing out a little (k dips
//                 by 0.3) so no element outruns the speed cap; swarm 2 enters
//                 from the left; EVALUATION framed alone ~G301-324
//    d. G296-332  a slow creep on EVALUATION (continues into the extra)
//  extra 22:
//    e. G318-376  the glide DOWN to the racks (k 2.0 -> 1.75, dip 0.25); swarm 3
//                 falls in from the upper left; INFRASTRUCTURE alone from ~G378
//    f. G392-416  creep in on the threads for "directly"
//    g. G416-480  the hold keeps drifting
// Measured (report): element speed <= 42 screen px/f, camera |dv| <= 2.4 except
// the turn from the push-in into the glide down (3.7 at G259).
// ---------------------------------------------------------------------------

export const CAM_G0 = -40;
export const CAM_G1 = 480;

// --- cut 1 -------------------------------------------------------------------
const K_OPEN = 1.7;
const X_OPEN = 556;
/** the column's composition centre (month labels .. text) */
export const X_REST = 540;
/** whole-period framing: APR's label top lands at screen y ~205 */
export const Y_REST = 680;
const S_OPEN = 835;
const S_RACE = 1110;

const smoothY = (() => {
  const raw: number[] = [];
  for (let G = -30; G <= 200; G++) raw.push(headYF(G));
  const sig = 4;
  const w = 12;
  return (G: number) => {
    let num = 0;
    let den = 0;
    for (let d = -w; d <= w; d++) {
      const g = Math.exp(-(d * d) / (2 * sig * sig));
      const i = Math.max(0, Math.min(raw.length - 1, Math.round(G) + d + 30));
      num += g * raw[i];
      den += g;
    }
    return num / den;
  };
})();

// --- the station framings (content centres) ---------------------------------
/** TRAINING alone: the wrap (left) .. the loop and its label */
export const FRAME_TRN = { x: 1340, y: 352, k: K_STATION[0] };
/** EVALUATION alone */
export const FRAME_EVL = { x: 1340, y: STATIONS[1].cy + 5, k: K_STATION[1] };
/** INFRASTRUCTURE alone: the mark .. the label, swarm 3 on the left */
export const FRAME_INF = { x: 1352, y: STATIONS[2].cy - 12, k: K_STATION[2] };

const bump = (G: number, a: number, b: number) => {
  const u = clamp01((G - a) / (b - a));
  return Math.sin(Math.PI * u) ** 2;
};

const env = (globalThis as { V2CAM?: Record<string, number[]> }).V2CAM ?? {};
/** the follow: pan [g0, g1]; push-in [g0, g1, warp] */
const PAN = env.PAN ?? [194, 244];
const PUSH = env.PUSH ?? [222, 258, 1.3];
/** the glides down: [g0, g1, k dip] */
const GLIDE_E = env.GLIDE_E ?? [254, 306, 0.3];
const GLIDE_I = env.GLIDE_I ?? [318, 376, 0.25];

/** the target: content centre (x, y) and k at global G */
export const camV2Target = (G: number) => {
  // cut 1
  let k = K_OPEN + (K_REST - K_OPEN) * seg01(G, 30, 100, 0.85);
  const S = S_OPEN + (S_RACE - S_OPEN) * seg01(G, 30, 62, 1);
  const track = smoothY(Math.min(G, 140)) - (S - 835) / k;
  let y = track + (Y_REST - track) * seg01(G, 66, 106, 1);
  let x = X_OPEN + (X_REST - X_OPEN) * seg01(G, 40, 94, 1.15);
  // a. the births
  const a = seg01(G, 146, 206, 1.0);
  x += (596 - X_REST) * a;
  y += (650 - Y_REST) * a;
  k += (0.97 - K_REST) * a;
  // b. the follow (pan) and the push-in (late)
  const bp = seg01(G, PAN[0], PAN[1], PAN[2] ?? 1.0);
  x += (FRAME_TRN.x - 596) * bp;
  y += (FRAME_TRN.y - 650) * bp;
  k += (FRAME_TRN.k - 0.97) * seg01(G, PUSH[0], PUSH[1], PUSH[2]);
  // c. down to EVALUATION, breathing out on the way
  const c = seg01(G, GLIDE_E[0], GLIDE_E[1], 1.0);
  x += (FRAME_EVL.x - FRAME_TRN.x) * c;
  y += (FRAME_EVL.y - FRAME_TRN.y) * c;
  k += (FRAME_EVL.k - FRAME_TRN.k) * c - GLIDE_E[2] * bump(G, GLIDE_E[0] - 2, GLIDE_E[1] + 2);
  // d. creep on EVALUATION
  const d = seg01(G, 296, 332, 1.0);
  y += 14 * d;
  k += 0.03 * d;
  // e. (extra) down to the racks
  const e = seg01(G, GLIDE_I[0], GLIDE_I[1], 0.95);
  x += (FRAME_INF.x - FRAME_EVL.x) * e;
  y += (FRAME_INF.y - (FRAME_EVL.y + 14)) * e;
  k += (FRAME_INF.k - (FRAME_EVL.k + 0.03)) * e - GLIDE_I[2] * bump(G, GLIDE_I[0] - 2, GLIDE_I[1] + 2);
  // f. (extra) creep in on the threads
  const f = seg01(G, 392, 416, 0.9);
  x += (1318 - FRAME_INF.x) * f;
  y += 16 * f;
  k += 0.1 * f;
  // g. (extra) the hold keeps drifting
  const g = seg01(G, 416, 480, 1.0);
  y += 8 * g;
  k += 0.02 * g;
  return { x, y, k };
};

/** the hand's sway: out across the 1 -> 2 join (cut 1 ends at rest) */
export const swayAmtV2 = (G: number) => 1 - smoothstep((G - 98) / 26) + smoothstep((G - 146) / 40);

/** the damped camera, one row per G from CAM_G0 */
export const CAM_V2 = (() => {
  const rows: Cam[] = [];
  const t0 = camV2Target(CAM_G0);
  let x = t0.x;
  let y = t0.y + CAM_LIFT / t0.k;
  let k = t0.k;
  let vx = 0;
  let vy = 0;
  let vk = 0;
  for (let G = CAM_G0; G <= CAM_G1; G++) {
    if (G > CAM_G0) {
      const t = camV2Target(G);
      const ty = t.y + CAM_LIFT / t.k;
      vy += (ty - y) * CAM_STIFF - vy * CAM_DAMP;
      y += vy;
      vk += (t.k - k) * CAM_STIFF - vk * CAM_DAMP;
      k += vk;
      vx += (t.x - x) * CAM_STIFF - vx * CAM_DAMP;
      x += vx;
    }
    const s = sway(G);
    const a = swayAmtV2(G);
    rows.push({ cx: x + s.dx * a, cy: y + s.dy * a, k });
  }
  const at = (G: number): Cam => rows[Math.max(0, Math.min(rows.length - 1, Math.round(G) - CAM_G0))];
  return { g0: CAM_G0, at, rows };
})();
export const camV2 = (G: number): Cam => CAM_V2.at(G);

// ---------------------------------------------------------------------------
// PROOFS (module scope, so a bad re-key fails the render)
// ---------------------------------------------------------------------------
/** probes set globalThis.V2PROBE to read the numbers instead of throwing */
export const PROOF_FAILS: string[] = [];
const fail = (m: string) => {
  if ((globalThis as { V2PROBE?: boolean }).V2PROBE) PROOF_FAILS.push(m);
  else throw new Error(m);
};
const rel = (a: Cam, b: Cam) =>
  Math.max(Math.abs(a.cx - b.cx) / FRAME_W, Math.abs(a.cy - b.cy) / FRAME_H, Math.abs(a.k - b.k) / b.k);

/** 1 -> 2 is a HOLD: cut 1's last frame (G130) is cut 2's first (G142) */
export const JOIN_12 = rel(camV2(130), camV2(142));
if (JOIN_12 > 0.0005) fail(`incidentCameraV2: the 1->2 hold drifts ${(JOIN_12 * 100).toFixed(3)} %`);

/** the whole column at rest in cut 1's end framing: no station ink in frame */
const LABEL_HALF = (text: string) => (text.length * 23.4) / 2; // Roboto Condensed Bold caps, 40 px, +0.04em
const stationInk = (s: number) => {
  const st = STATIONS[s];
  const lh = LABEL_HALF(st.key);
  const b = st.box;
  return { x0: Math.min(b.x0, st.cx - lh) - 4, x1: Math.max(b.x1, st.cx + lh) + 4, y0: b.y0 - 4, y1: st.labelY + LABEL_SIZE + 4 };
};
export const STATION_INK = [0, 1, 2].map(stationInk);
const onScreen = (cam: Cam, r: { x0: number; y0: number; x1: number; y1: number }, pad = 0) => {
  const a = screenOf(cam, r.x0, r.y0);
  const b = screenOf(cam, r.x1, r.y1);
  return b.x > -pad && a.x < FRAME_W + pad && b.y > -pad && a.y < FRAME_H + pad;
};
/** the column framings (cut 1's end, the hold, cut 2's births up to the
 *  moment the follow starts): the nearest station ink stays this many screen
 *  px outside the frame (only ink level with the frame counts) */
export const COLUMN_FRAMES_MARGIN = (() => {
  let m = Infinity;
  for (let G = 100; G <= PAN[0] + 4; G++) {
    const cam = camV2(G);
    for (const r of STATION_INK) {
      const a = screenOf(cam, r.x0, r.y0);
      const b = screenOf(cam, r.x1, r.y1);
      if (b.y < 0 || a.y > FRAME_H) continue;
      m = Math.min(m, a.x - FRAME_W);
    }
  }
  return m;
})();
if (COLUMN_FRAMES_MARGIN < 60) fail(`incidentCameraV2: a station is ${COLUMN_FRAMES_MARGIN.toFixed(0)} px from the column framing`);

/** each station ALONE at its close-up (the held frames): no other station in
 *  frame, no column text, no swarm still hovering beside the column */
export const ALONE_WINDOWS: { s: number; g0: number; g1: number }[] = [
  { s: 0, g0: 256, g1: 260 },
  { s: 1, g0: 301, g1: 324 },
  { s: 2, g0: 380, g1: 480 },
];
for (const w of ALONE_WINDOWS) {
  for (let G = w.g0; G <= w.g1; G++) {
    const cam = camV2(G);
    [0, 1, 2].forEach((o) => {
      if (o === w.s) return;
      if (onScreen(cam, STATION_INK[o])) fail(`incidentCameraV2: ${STATIONS[o].key} in ${STATIONS[w.s].key}'s frame at G${G}`);
    });
    if (screenOf(cam, COL_X1 + 4, 0).x > 0) fail(`incidentCameraV2: the column in frame at G${G}`);
    for (let s = 0; s < 3; s++) {
      for (let i = 0; i < SWARM_N; i++) {
        const d = swarmDot(s, i, G);
        if (d.phase !== 2) continue;
        const p = screenOf(cam, d.x + d.r, d.y);
        if (p.x > 0 && p.y > 0 && p.y < FRAME_H) fail(`incidentCameraV2: swarm ${s + 1} hovering in frame at G${G}`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// MEASURES for the report: camera |dv| (three screen points), the fastest
// on-screen swarm dot and fixed world point, the lowest subject ink.
// ---------------------------------------------------------------------------
export const measureV2 = (g0: number, g1: number, subject: (G: number) => number[]) => {
  let dv = 0;
  let dvG = 0;
  let worldMax = 0;
  let worldMaxG = 0;
  let dotMax = 0;
  let dotMaxG = 0;
  let low = 0;
  let lowG = 0;
  const probes = [
    { x: 540, y: 835 },
    { x: 120, y: 260 },
    { x: 960, y: 1400 },
  ];
  for (let G = g0; G < g1; G++) {
    const c0 = camV2(G - 1);
    const c1 = camV2(G);
    const c2 = camV2(G + 1);
    for (const p of probes) {
      // the world point under p at G
      const wx = c1.cx + (p.x - FRAME_W / 2) / c1.k;
      const wy = c1.cy + (p.y - FRAME_H / 2) / c1.k;
      const a = screenOf(c0, wx, wy);
      const b = screenOf(c1, wx, wy);
      const c = screenOf(c2, wx, wy);
      const acc = Math.hypot(c.x - 2 * b.x + a.x, c.y - 2 * b.y + a.y);
      if (acc > dv) {
        dv = acc;
        dvG = G;
      }
    }
    // fixed world ink: station boxes' corners, column right edge
    const pts: { x: number; y: number }[] = [];
    for (const r of STATION_INK) {
      pts.push({ x: r.x0, y: r.y0 }, { x: r.x1, y: r.y1 }, { x: r.x0, y: r.y1 }, { x: r.x1, y: r.y0 });
    }
    for (let yy = 0; yy <= 1400; yy += 200) pts.push({ x: COL_X1, y: yy }, { x: 280, y: yy });
    for (const q of pts) {
      const a = screenOf(c0, q.x, q.y);
      const b = screenOf(c1, q.x, q.y);
      if (b.x < 0 || b.x > FRAME_W || b.y < 0 || b.y > FRAME_H) continue;
      const v = Math.hypot(b.x - a.x, b.y - a.y);
      if (v > worldMax) {
        worldMax = v;
        worldMaxG = G;
      }
    }
    for (let s = 0; s < 3; s++) {
      for (let i = 0; i < SWARM_N; i++) {
        const A = swarmDot(s, i, G - 1);
        const B = swarmDot(s, i, G);
        if (A.phase === 0) continue;
        const pa = screenOf(c0, A.x, A.y);
        const pb = screenOf(c1, B.x, B.y);
        if (pb.y < 0 || pb.y > FRAME_H || pb.x < 0 || pb.x > FRAME_W) continue;
        const v = Math.hypot(pb.x - pa.x, pb.y - pa.y);
        if (v > dotMax) {
          dotMax = v;
          dotMaxG = G;
        }
      }
    }
    for (const wy of subject(G)) {
      const sy = screenOf(c1, 0, wy).y;
      if (sy > low) {
        low = sy;
        lowG = G;
      }
    }
  }
  return { camDv: dv, camDvG: dvG, worldMax, worldMaxG, dotMax, dotMaxG, lowestSubject: low, lowestSubjectG: lowG };
};

/** kept for readers: where things are, for a brief */
export const V2_PLACES = {
  WAIT_CENTRES,
  REST_BLOBS,
  MARK_CY,
  MARK_SIZE,
  RACK_X0,
  RACK_Y0,
  RACK_BLOCK_W,
  RACK_BLOCK_H,
};
