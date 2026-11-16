// ---------------------------------------------------------------------------
// NotMuchTime (rsi-stupidest-species, cut 59). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 223 frames.
// One stage inside the misty teal air (AirStage, palette A, mood day) on a londonDepth one-point perspective, from the
// kit kits/dwarkesh-3d/dwarkesh3d; the cast is the clip's stupidestFolk (W2, read only).
//
// CHECK LINE: "Our branch split from the chimps only recently, so evolution had just a short stretch to build the
// skills that make us clever: teaching, working in big groups, planning."
//
// THE LINE: "So evolution hasn't had that much time to optimize us for our ability to learn from each other or
// coordinate in large groups or think through abstract concepts and plan."
// WORD -> FRAME: So 0 · evolution 5 · hasn't 16 · had 25 · that 29 · much 37 · time 44 · to 53 · optimize 61 · us 75 ·
// for 83 · our 89 · ability 92 · to 100 · learn 108 · from 115 · each 119 · other 122 · or 128 · coordinate 140 · in 150
// · large 155 · groups 159 · or 167 · think 173 · through 180 · abstract 186 · concepts 196 · and 208 · plan 213
// DURATION: the slot 59.643 -> 68.944 s = 9.301 s x 23.976 = 223 frames (f0..f222).
//
// THE MOTION: time as distance. ONE camera move, already moving at f0: from high above the far end of the old trail
// of ancestry, looking up and along it as it winds switchback after switchback into the haze, the camera cranes down
// it (eye 2350 -> 1040 units, fastest ~f20) and arrives over the FORK by "time" (fork y ~520 at f43, settled ~f50),
// then creeps. The chimp pair comes down the same trail's last leg and takes the LEFT fork (the chimpanzee sets off at
// the fork during the descent, the bonobo follows and turns at ~f190), knuckle-walking off with planted feet. OUR
// branch from the fork is a SHORT stub toward the camera (fork y ~485 -> today y ~809 settled) ending at a soft
// cream-lit lip (today); the trunk above the fork runs out of the top of the frame. "to optimize us" (f56-91): a faint
// cream trail of footprints walks the stub from the fork to today, fast, then stays faint. Around the lip:
//   1. "learn from each other" (left, just beyond the lip): a woman squats beside a child and knaps a flint core.
//      Idle f0-104: she shows the core, looks to the child and back, nods; the child fidgets and glances up. CAUSE: the
//      stone meets the core on f114, f142, f170, f198 (knapContact; KNAP_HITS); 3 flakes leave the core on each.
//   2. "coordinate in large groups" (right, beyond the lip): six foragers on one rope that runs back into depth haul a
//      log lying beside the lip. Idle before f138 (each man settles his weight, heads look along the line); in step
//      from f138 (first heave peak f156 "large groups"), walking back with planted feet; the log moves with the rope.
//   3. "think through abstract concepts and plan" (right, near): a man squats with a long stick (240 units, the grip
//      sliding along it); idle: the tip taps the sand, he looks up to think (f60-150); the tip lifts f163-172 and draws
//      a DASHED ORANGE plan: a river f172-188, a herd (three rings) f191-201, an arrow to the herd f202-213 (the head
//      lands on "plan" f213). The tip is ON the ground on every drawing frame.
// REV 1 (the camera guides the eye): after the crane ONE continuous camera visits each thing on its words (TOUR keys,
// pchip per channel, solved from a world focus point and its screen place): f61-88 down the stub with the footprints
// to the lip; f88-109 in on the teaching pair (k 1.9, ~60% of the box, first strike f114 close); f121-146 an arc up
// (eye 1040 -> 2150) and across to the haulers (heave peak f156 framed; the high eye drops the planner below the
// caption bands); f163-180 down to the planner (the camera leans in and follows the stick's tip); a small ease back
// after "plan" f213. No text, no numbers.
// Orange = intelligence only: the only orange is the planner's dashed plan. People, chimps, log, rope and ground are in
// muted earthy local colours; the "today" light and the footprints are cream.
//
// DEPTH: londonDepth perspective with the eye height keyed per frame (camState: E, horizon row, zoom; a velocity-bell
// crane f0-56 and a creep), dRef 2000 at kRef 1, dolly 1; fog by the eye's distance from 2500 (vis 4800). The fork at
// Z ~750, today Z 0; the trunk's switchbacks are spaced so r falls ~16% per row (the ribbon never meets itself) out to
// Z ~37000; the teaching pair Z 30 / 20, the haul's front man Z 165 (the rope at 0.72 rad back into depth), the
// planner Z -290. Paths are placed by where they sit in the resolved frame (groundAt).
// CHECKS: keyPoints(frame) gives the screen positions the per-frame keep-in / grip check reads.
//
// SOURCES: none on screen. The human-chimpanzee split ~6-7 million years ago (COMMON.md; the speaker: "a few million
// years"); not shown as a number.
// ---------------------------------------------------------------------------
import React from "react";
import { random, useCurrentFrame } from "remotion";
import { z } from "zod";
import { ACCENT, AirFloor, AirShadow, AirStage, MAT, WorldSvg, airWorldOf, c01, lineOf, mixHex, pchip, swayCam, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  CHIMP_POSES,
  Chimp,
  Forager,
  HAUL,
  HAUL_CYCLE,
  PERSON_POSES,
  Stick,
  knapContact,
  lerpPose,
  mirrorPose,
  personAnchors,
  personGripTo,
  type PersonPose,
} from "./stupidestFolk";

export const FPS = 24000 / 1001;
export const DURATION = 223;
export const schema = z.object({});
export const defaultProps = schema.parse({});

type P2 = [number, number];
/** a ground point (X across, Z depth) */
type G2 = [number, number];

// ===================================================================================================================
// CAMERA: one crane down the long trunk onto the fork, then a creep
// ===================================================================================================================
/** the camera in eye height E, horizon row yH (screen px) and zoom k: from high above the far trunk (looking up and
 *  along it to the haze) down onto the fork; the 2D camera follows (cy from E, yH, k); cx stays */
export const CAM = { E0: 2350, yH0: 250, k0: 0.95, E1: 1040, yH1: -300, k1: 1.06, cx: -2, fEnd: 56, peak: 0.36, width: 0.3 };
/** the crane's progress 0..1 per frame: a velocity bell (already moving at f0, fastest ~f20, at rest by ~f50) */
const CRANE_U: number[] = (() => {
  const vel = (t: number) => Math.exp(-(((t - CAM.peak) / CAM.width) ** 2));
  const N = 400;
  const cum = [0];
  for (let i = 1; i <= N; i++) cum.push(cum[i - 1] + vel((i - 0.5) / N));
  const tot = cum[N];
  return Array.from({ length: DURATION + 1 }, (_, f) => {
    const x = Math.min(N, (f / CAM.fEnd) * N);
    const i = Math.floor(x);
    const a = cum[Math.min(N, i)];
    const b = cum[Math.min(N, i + 1)];
    return (a + (b - a) * (x - i)) / tot;
  });
})();
const craneU = (f: number) => {
  const i = Math.max(0, Math.min(DURATION - 1, Math.floor(f)));
  return CRANE_U[i] + (CRANE_U[i + 1] - CRANE_U[i]) * (f - i);
};
/** the crane alone (f0 ~50): eye height E, horizon row, zoom */
const craneState = (f: number) => {
  const u = craneU(f);
  const k = Math.exp(Math.log(CAM.k0) + (Math.log(CAM.k1) - Math.log(CAM.k0)) * u);
  const E = CAM.E0 + (CAM.E1 - CAM.E0) * u;
  const yH = CAM.yH0 + (CAM.yH1 - CAM.yH0) * u;
  return { cam: { k, cx: CAM.cx, cy: -E - (yH - 960) / k }, E };
};

// ===================================================================================================================
// THE PATHS (ground polylines, Catmull-Rom smoothed). Placed by where they sit in the RESOLVED frame (E1, yH1, k1).
// ===================================================================================================================
const catmull = (pts: G2[], per = 10): G2[] => {
  const out: G2[] = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
type Poly = { pts: G2[]; cum: number[]; len: number };
const polyOf = (pts: G2[]): Poly => {
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
};
/** the point and unit tangent at arc length s */
const along = (P: Poly, s: number): { p: G2; t: G2 } => {
  const L = Math.max(0, Math.min(P.len, s));
  let i = 1;
  while (i < P.pts.length - 1 && P.cum[i] < L) i++;
  const a = P.pts[i - 1];
  const b = P.pts[i];
  const seg = Math.max(1e-6, P.cum[i] - P.cum[i - 1]);
  const u = (L - P.cum[i - 1]) / seg;
  const tx = (b[0] - a[0]) / seg;
  const tz = (b[1] - a[1]) / seg;
  return { p: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], t: [tx, tz] };
};
/** the ground point that sits at screen (sx, sy) in the resolved frame */
const DC1 = 2000 / CAM.k1;
const groundAt = (sx: number, sy: number): G2 => {
  const r = (sy - CAM.yH1) / (CAM.E1 * CAM.k1);
  const Z = DC1 / r - DC1;
  return [CAM.cx + (sx - 540) / (CAM.k1 * r), Z];
};
const groundAtR = (sx: number, r: number): G2 => [CAM.cx + (sx - 540) / (CAM.k1 * r), DC1 / r - DC1];

export const FORK: G2 = groundAt(345, 485);
/** the long old trunk: from the fork back into the haze, switchback after switchback (rows spaced so the ribbon
 *  never meets itself: r falls by ~16% a row; each swing ~150 px on screen, a little less far away) */
const TRUNK_R = [0.64, 0.54, 0.455, 0.385, 0.325, 0.275, 0.232, 0.196, 0.166, 0.14, 0.118, 0.1, 0.084, 0.071, 0.06, 0.051];
const TRUNK = polyOf(catmull([FORK, ...TRUNK_R.map((r, i) => groundAtR(400 + (i % 2 ? -1 : 1) * 158 * Math.pow(0.95, i), r)), groundAtR(400, 0.044)], 16));
/** OUR path: from the fork toward the camera, short; it ends at today (Z_TODAY, y ~800 resolved) */
export const Z_TODAY = 0;
const OURS = polyOf(catmull([FORK, groundAt(372, 560), groundAt(402, 650), groundAt(430, 730), [groundAt(446, 802)[0], Z_TODAY]], 14));
/** the chimps' fork: off to the left at about the fork's depth, out of the frame's left edge */
const LEFT = polyOf(catmull([FORK, groundAt(275, 468), groundAt(190, 452), groundAt(110, 438), groundAt(30, 425), groundAt(-80, 410), groundAt(-250, 395)], 14));

// ===================================================================================================================
// THE TOUR (rev 1): after the crane one continuous camera visits each thing ON its words. Each key says where a world
// FOCUS point sits on screen (S) at zoom k and eye height E; the 2D camera (cx = the eye's X, cy) is solved from it, and
// every channel runs on a pchip through the keys (eased, monotone between stops, still where a channel turns back)
// ===================================================================================================================
type CamSt = { cam: Cam; E: number };
type TourKey = { f: number; k: number; E: number; F: [number, number, number]; S: P2 };
const camFromFocus = (k: number, E: number, F: [number, number, number], S: P2): CamSt => {
  const Dc = 2000 / k;
  const r = Dc / (Dc + F[2]);
  const cx = F[0] - (S[0] - 540) / (k * r);
  const wy = -E + (F[1] + E) * r;
  return { cam: { k, cx, cy: wy - (S[1] - 960) / k }, E };
};
/** where world (X, Y, Z) lands on screen under a camera state */
const screenUnder = (st: CamSt, X: number, Y: number, Z: number): P2 => {
  const Dc = 2000 / st.cam.k;
  const r = Dc / (Dc + Z);
  const wx = st.cam.cx + (X - st.cam.cx) * r;
  const wy = -st.E + (Y + st.E) * r;
  return [540 + (wx - st.cam.cx) * st.cam.k, 960 + (wy - st.cam.cy) * st.cam.k];
};
export const TOUR_START = 50;
/** the eye's height while the haul is visited */
const E_HAUL = 2150;
const TOUR: TourKey[] = (() => {
  const c0 = craneState(TOUR_START);
  const forkF: [number, number, number] = [FORK[0], 0, FORK[1]];
  const k0 = c0.cam.k;
  const E = c0.E;
  const lip = OURS.pts[OURS.pts.length - 1];
  return [
    // the crane's end: the fork where the crane leaves it
    { f: TOUR_START, k: k0, E, F: forkF, S: screenUnder(c0, ...forkF) },
    { f: 61, k: k0 * 1.015, E, F: forkF, S: [screenUnder(c0, ...forkF)[0], screenUnder(c0, ...forkF)[1] + 6] },
    // "optimize us for our ability": down the short lit stub with the footprints, to the lip
    { f: 88, k: 1.45, E, F: [lip[0], 0, lip[1] + 60], S: [560, 705] },
    // "to learn from each other": in on the teaching pair (landed ~f108, the first strike f114 close)
    { f: 109, k: 1.9, E, F: [-278, -80, 25], S: [540, 740] },
    { f: 121, k: 1.96, E, F: [-274, -83, 25], S: [540, 742] },
    // "or coordinate in large groups": an arc up and across to the haulers (landed ~f145, the heave peak f156 framed):
    // the eye rises so the planner in front drops below the caption bands while the band is visited
    { f: 146, k: 1.32, E: E_HAUL, F: [205, -150, 250], S: [540, 640] },
    { f: 163, k: 1.36, E: E_HAUL, F: [220, -150, 260], S: [540, 642] },
    // "or think through abstract concepts and plan": down to the planner (landed ~f179), the plan drawn close
    { f: 180, k: 1.33, E, F: [140, -70, -295], S: [540, 790] },
    // the camera leans in and follows the stick's tip a little as the plan grows across the sand
    { f: 206, k: 1.37, E, F: [110, -70, -295], S: [540, 794] },
    // a small ease back after "plan" (f213): the arrowhead stays in frame
    { f: DURATION - 1, k: 1.32, E, F: [110, -70, -295], S: [540, 785] },
  ];
})();
const tourCh = (get: (q: TourKey) => number) => pchip(TOUR.map((q) => [q.f, get(q)] as [number, number]), true);
const TOUR_CH = {
  lk: tourCh((q) => Math.log(q.k)),
  E: tourCh((q) => q.E),
  X: tourCh((q) => q.F[0]),
  Y: tourCh((q) => q.F[1]),
  Z: tourCh((q) => q.F[2]),
  sx: tourCh((q) => q.S[0]),
  sy: tourCh((q) => q.S[1]),
};
export const camState = (f: number): CamSt => {
  if (f <= TOUR_START) return craneState(f);
  const C = TOUR_CH;
  return camFromFocus(Math.exp(C.lk(f)), C.E(f), [C.X(f), C.Y(f), C.Z(f)], [C.sx(f), C.sy(f)]);
};
/** the air: fog by the eye's distance from 2500 (vis 4800): the stage stays clear and the trunk sinks into haze */
const SCENE = { fogNear: 2500, fogVis: 4800 };
/** the people's fog by stage depth: the whole stage keeps its local colour, only the chimps up the fork sink a little */
const FIG = { near: 700, vis: 3000, max: 0.75 };
const REST = swayCam(camState(0).cam, 0);
/** the medium of one frame (also read by the checks) */
export const worldAt = (frame: number) => {
  const st = camState(frame);
  const cam = swayCam(st.cam, frame);
  const depth: DepthOpts = { eyeY: -st.E, dRef: 2000, kRef: 1, dolly: 1 };
  return airWorldOf({ cam, rest: REST, depth, frame, scene: SCENE, figFog: FIG });
};

/** the chimps' route: down the trunk's last leg to the fork, then off along the left fork (both lineages came down the
 *  same old trail; the chimps take the other branch) */
const CHIMP_FROM = 300;
const CHIMP_ROUTE = polyOf([...TRUNK.pts.filter((_, i) => TRUNK.cum[i] <= CHIMP_FROM).reverse(), ...LEFT.pts.slice(1)]);

const W_TRUNK = 120;
const W_OURS = 100;
const W_LEFT = 100;
const TRAIL = { lit: "#B3A27E", mid: "#A08F6E" };

/** a trail as a ribbon of ground quads, each in the trail colour fogged by its own depth; a soft shoulder under it */
const Trail: React.FC<{ A: AirWorld; P: Poly; w: number; core?: number }> = ({ A, P, w, core = 0.55 }) => {
  const els: React.ReactNode[] = [];
  const n = P.pts.length;
  const side = (i: number, k: number): [P2, P2] => {
    const a = P.pts[Math.max(0, i - 1)];
    const b = P.pts[Math.min(n - 1, i + 1)];
    const L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / L;
    const nz = (b[0] - a[0]) / L;
    const c = P.pts[i];
    const h = (w * k) / 2;
    return [A.P.p(c[0] + nx * h, 0, c[1] + nz * h), A.P.p(c[0] - nx * h, 0, c[1] - nz * h)];
  };
  for (const [k, col, op] of [
    [1.45, mixHex(TRAIL.mid, MAT.ground.lit, 0.55), 0.7],
    [1, TRAIL.mid, 1],
    [0.55, TRAIL.lit, core],
  ] as const) {
    for (let i = 0; i < n - 1; i++) {
      const zm = (P.pts[i][1] + P.pts[i + 1][1]) / 2;
      if (zm + A.Dc < 60) continue;
      const [l0, r0] = side(i, k);
      const [l1, r1] = side(i + 1, k);
      const fill = A.tone(col, zm, 0);
      const d = `M${l0[0].toFixed(2)},${l0[1].toFixed(2)}L${l1[0].toFixed(2)},${l1[1].toFixed(2)}L${r1[0].toFixed(2)},${r1[1].toFixed(2)}L${r0[0].toFixed(2)},${r0[1].toFixed(2)}Z`;
      els.push(<path key={`${k}-${i}`} d={d} fill={fill} stroke={fill} strokeWidth={0.6 / A.k} fillOpacity={op} strokeOpacity={op} strokeLinejoin="round" />);
    }
  }
  return <g>{els}</g>;
};

// ===================================================================================================================
// FOOTPRINTS ("to optimize us"): a faint cream trail of prints walks from the fork down our short path to today, fast
// ===================================================================================================================
const PRINT = { f0: 62, every: 2.4, stride: 56, side: 13, len: 25, w: 10, cream: "#F3EBDD" };
const PRINTS = (() => {
  const out: { X: number; Z: number; t: G2; f: number; s: number }[] = [];
  for (let j = 0, d = 30; d < OURS.len - 20; j++, d += PRINT.stride) {
    const { p, t } = along(OURS, d);
    const s = j % 2 ? 1 : -1;
    // the side normal (to the walker's left / right)
    out.push({ X: p[0] - t[1] * PRINT.side * s, Z: p[1] + t[0] * PRINT.side * s, t, f: PRINT.f0 + j * PRINT.every, s });
  }
  return out;
})();
const Footprints: React.FC<{ A: AirWorld; frame: number }> = ({ A, frame }) => (
  <g>
    {PRINTS.map((q, i) => {
      const a = c01((frame - q.f) / 3);
      if (a <= 0) return null;
      const op = a * (0.62 - 0.22 * c01((frame - q.f - 6) / 24));
      // a foot: the ball (front) and the heel, each a small ellipse on the ground along the walking direction
      const blob = (c: number, rl: number, rw: number) => {
        const pts: string[] = [];
        for (let k = 0; k < 14; k++) {
          const u = (k / 14) * Math.PI * 2;
          const l = c + Math.cos(u) * rl;
          const w = Math.sin(u) * rw;
          const g = A.P.p(q.X + q.t[0] * l - q.t[1] * w, 0, q.Z + q.t[1] * l + q.t[0] * w);
          pts.push(`${g[0].toFixed(2)},${g[1].toFixed(2)}`);
        }
        return `M${pts.join("L")}Z`;
      };
      // the walk runs toward the camera: "front" is along the path's tangent (decreasing Z)
      return <path key={i} d={blob(PRINT.len * 0.18, PRINT.len * 0.32, PRINT.w * 0.55) + blob(-PRINT.len * 0.3, PRINT.len * 0.2, PRINT.w * 0.42)} fill={PRINT.cream} fillOpacity={op} />;
    })}
  </g>
);

// ===================================================================================================================
// GRASS TUFTS (the savannah's texture: a jittered grid, denser in depth as the screen wants, none on a trail)
// ===================================================================================================================
const distTo = (P: Poly, X: number, Z: number) => {
  let best = 1e9;
  for (let i = 0; i < P.pts.length - 1; i++) {
    const a = P.pts[i];
    const b = P.pts[i + 1];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const L2 = dx * dx + dz * dz || 1;
    const u = c01(((X - a[0]) * dx + (Z - a[1]) * dz) / L2);
    best = Math.min(best, Math.hypot(X - a[0] - u * dx, Z - a[1] - u * dz));
  }
  return best;
};
type Tuft = { X: number; Z: number; h: number; n: number; seed: number };
export const TUFTS: Tuft[] = (() => {
  const out: Tuft[] = [];
  let Z = -900;
  let row = 0;
  while (Z < 9000) {
    const step = 0.075 * (2000 + Z);
    const dx = 0.085 * (2000 + Z);
    for (let X = -0.9 * (2000 + Z); X < 0.9 * (2000 + Z); X += dx) {
      const s = row * 1000 + Math.round(X);
      const x = X + (random(`tx${s}`) - 0.5) * dx * 0.9;
      const zz = Z + (random(`tz${s}`) - 0.5) * step * 0.9;
      if (random(`tk${s}`) < 0.35) continue;
      const clear = Math.min(distTo(TRUNK, x, zz) - W_TRUNK * 0.85, distTo(OURS, x, zz) - W_OURS * 0.85, distTo(LEFT, x, zz) - W_LEFT * 0.85);
      if (clear < 0) continue;
      out.push({ X: x, Z: zz, h: 22 + 18 * random(`th${s}`), n: 3 + Math.floor(3 * random(`tn${s}`)), seed: s });
    }
    Z += step;
    row++;
  }
  return out;
})();
const GRASS = { lit: "#9A9068", mid: "#7E7556", dark: "#5E5843" };
const TuftG: React.FC<{ A: AirWorld; t: Tuft }> = ({ A, t }) => {
  const { at, scale } = A.P.at(t.X, t.Z);
  const blades: React.ReactNode[] = [];
  for (let i = 0; i < t.n; i++) {
    const u = t.n === 1 ? 0 : i / (t.n - 1) - 0.5;
    const lean = u * 0.9 + (random(`tb${t.seed}-${i}`) - 0.5) * 0.3;
    const hh = t.h * (0.7 + 0.3 * (1 - Math.abs(u)) + 0.15 * random(`tl${t.seed}-${i}`));
    const bx = at[0] + u * 10 * scale;
    const by = at[1];
    const tx = bx + Math.sin(lean) * hh * scale;
    const ty = by - Math.cos(lean) * hh * scale;
    const w = 2.6 * scale;
    const col = u < 0 ? GRASS.lit : u > 0.2 ? GRASS.dark : GRASS.mid;
    blades.push(<path key={i} d={`M${(bx - w).toFixed(2)},${by.toFixed(2)}Q${((bx + tx) / 2 - w * 0.5).toFixed(2)},${((by + ty) / 2).toFixed(2)} ${tx.toFixed(2)},${ty.toFixed(2)}Q${((bx + tx) / 2 + w * 0.5).toFixed(2)},${((by + ty) / 2).toFixed(2)} ${(bx + w).toFixed(2)},${by.toFixed(2)}Z`} fill={A.tone(col, t.Z, 10)} />);
  }
  return <g>{blades}</g>;
};

// ===================================================================================================================
// TODAY: the soft cream-lit end of our path
// ===================================================================================================================
const TodayEdge: React.FC<{ A: AirWorld }> = ({ A }) => {
  const end = OURS.pts[OURS.pts.length - 1];
  const c = A.P.p(end[0], 0, end[1] + 30);
  const rx = W_OURS * 1.6 * A.P.r(end[1]);
  const ry = Math.abs(A.P.p(end[0], 0, end[1] - 110)[1] - A.P.p(end[0], 0, end[1] + 170)[1]) / 2;
  const cream = "#F3EBDD";
  // the trail's round end, lit: a soft cream lip (blurred), never a drawn outline
  const arc: P2[] = [];
  for (let i = 0; i <= 16; i++) {
    const a = Math.PI * (i / 16);
    arc.push(A.P.p(end[0] + Math.cos(a) * W_OURS * 0.48, 0, end[1] + 6 - Math.sin(a) * W_OURS * 0.2));
  }
  const r = A.P.r(end[1]);
  return (
    <g>
      <defs>
        <radialGradient id="today-g">
          <stop offset="0" stopColor={cream} stopOpacity={0.5} />
          <stop offset="0.5" stopColor={cream} stopOpacity={0.2} />
          <stop offset="1" stopColor={cream} stopOpacity={0} />
        </radialGradient>
        <filter id="today-b" x="-30%" y="-100%" width="160%" height="300%">
          <feGaussianBlur stdDeviation={(5 * r).toFixed(2)} />
        </filter>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill="url(#today-g)" />
      <path d={`M${arc.map((q) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`).join("L")}`} fill="none" stroke={cream} strokeOpacity={0.8} strokeWidth={9 * r} strokeLinecap="round" filter="url(#today-b)" />
    </g>
  );
};

// ===================================================================================================================
// 1. TEACHING: a woman squats beside a child and knaps a flint core
// ===================================================================================================================
export const TEACH = { X: -377, Z: 30, v: 1, child: { X: -192, Z: 20, v: 2 }, act: 108, off: 16 };
/** idle life before the knapping (f0-104): the woman shows the core, looks from it to the child and back with a small
 *  nod; the child fidgets (a head tilt, glances up at her, a wiggle of the mouth). Head channels only (the grips hold) */
const teachIdle = (f: number) => {
  const w = 1 - c01((f - 98) / 8);
  const toChild = w * (0.5 - 0.5 * Math.cos((2 * Math.PI * (f + 8)) / 52));
  return { yaw: 0.12 * toChild, look: [0.15 * toChild, -0.5 * toChild] as P2, pitch: -8 * toChild + w * 2.5 * Math.sin(f / 7), mouth: 0.06 * toChild };
};
const childIdle = (f: number) => {
  const w = 1 - c01((f - 100) / 8);
  const up = w * Math.pow(0.5 - 0.5 * Math.cos((2 * Math.PI * (f + 30)) / 52), 2);
  return { roll: w * (6 * Math.sin(f / 9) + 3 * Math.sin(f / 4.3)), yaw: w * 0.1 * Math.sin(f / 13), look: [-0.1 * up, -0.55 * up] as P2, pitch: -9 * up, open: w * 0.08 * Math.max(0, Math.sin(f / 6)) };
};
const teachFrame = (f: number) => f + TEACH.off;
const teachAmount = (f: number) => c01((f - 104) / 6);
/** the contact frames (knapContact's first frame) in the cut */
export const KNAP_HITS = Array.from({ length: DURATION }, (_, f) => f).filter((f) => f >= TEACH.act && knapContact(teachFrame(f)) && !knapContact(teachFrame(f - 1))); // 114, 142, 170, 198
const FLAKE = { lit: "#9C978C", mid: "#6F6A62", rim: "#C9C2B2" };
type Flake = { hit: number; vx: number; vy: number; land: number; rot: number; size: number };
const FLAKES: Flake[] = KNAP_HITS.flatMap((hit, h) =>
  [0, 1, 2].map((k) => ({
    hit,
    vx: [1, -0.55, 0.35][k] * (2.2 + 1.6 * random(`fx${h}${k}`)),
    vy: -(2.6 + 1.8 * random(`fy${h}${k}`)),
    land: -6 + 16 * random(`fl${h}${k}`),
    rot: 360 * random(`fr${h}${k}`),
    size: 7 + 3 * random(`fs${h}${k}`),
  })),
);
const G_FLAKE = 0.55;
/** a flake's position (teacher-local units) at frame f, or null before its hit */
const flakeAt = (fl: Flake, core: P2, f: number): { p: P2; flying: boolean } | null => {
  if (f < fl.hit) return null;
  // flight until it reaches its landing row (y = land): solve y(t) = core.y + vy t + g t^2 / 2 = land
  const a = G_FLAKE / 2;
  const b = fl.vy;
  const c = core[1] - fl.land;
  const tLand = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  const t = Math.min(f - fl.hit, tLand);
  return { p: [core[0] + fl.vx * t, core[1] + fl.vy * t + a * t * t], flying: f - fl.hit < tLand };
};

// ===================================================================================================================
// 2. THE HAUL: six foragers on one rope, a big log
// ===================================================================================================================
/** the band stands on one straight rope that runs back and to the right into depth (TH from the X axis): the front
 *  man (nearest the log) at HAUL_F, the others GAP units further back along the rope each */
export const HAUL_F: G2 = [210, 165];
const HAUL_TH = 0.72;
const HAUL_C = Math.cos(HAUL_TH);
const HAUL_S = Math.sin(HAUL_TH);
const HAUL_DIR = -1 as const;
const HAUL_V = [4, 6, 5, 0, 7, 4];
const HAUL_GAP = 60;
const HAUL_START = 138;
const HAUL_STEP = 0.45;
/** the log (lying along X): its right end (the tie) sits SLACK units along the rope ahead of the front man's near fist */
const LOG = { len: 150, R: 36, slack: 45 };
const haulStep = (f: number) => {
  const u = c01((f - HAUL_START) / 12);
  return HAUL_STEP * u * u * (3 - 2 * u);
};
/** units each hauler (and the log) has moved back along the rope by frame f: haulAdvance per frame in X (so the
 *  planted feet hold), divided by the rope's X share */
const HAUL_MOVE: number[] = (() => {
  const out = [0];
  for (let f = 1; f <= DURATION + 2; f++) out.push(out[f - 1] + ((2 * 30 * 0.55) / HAUL_CYCLE / HAUL_C) * haulStep(f - 0.5));
  return out;
})();
const haulMove = (f: number) => {
  const i = Math.max(0, Math.min(HAUL_MOVE.length - 2, Math.floor(f)));
  return HAUL_MOVE[i] + (HAUL_MOVE[i + 1] - HAUL_MOVE[i]) * (f - i);
};
/** the haul pose's frame per man: before the first pull a small idle (each man settles his weight on the rope at his
 *  own pace: a shallow lean back and forth), faded out into the pull at HAUL_START */
const haulFrame = (f: number, i: number) => {
  const idle = 2.6 * (1 - Math.cos((2 * Math.PI * (f + 11 * i)) / (40 + 3 * i))) * c01((HAUL_START - f) / 16);
  return Math.max(0, f - HAUL_START) + 2 * i + idle;
};
/** the haulers' heads: a slow look along the line / at the log before the pull, settling forward for it */
const haulHead = (f: number, i: number) => {
  const w = c01((HAUL_START - 2 - f) / 12);
  return { yaw: w * 0.16 * Math.sin((f + 23 * i) / (13 + i)), pitch: w * 5 * Math.sin((f + 31 * i) / 17), look: w * 0.3 * Math.sin((f + 17 * i) / 11) };
};
/** the six men's feet (world X, Z) at frame f */
const haulMen = (f: number): G2[] => {
  const mv = haulMove(f);
  return HAUL_V.map((_, i) => [HAUL_F[0] + (i * HAUL_GAP + mv) * HAUL_C, HAUL_F[1] + (i * HAUL_GAP + mv) * HAUL_S]);
};
/** the log's tie (its right end) and depth at frame f: SLACK along the rope ahead of the front man's near fist */
const haulLog = (f: number) => {
  const m0 = haulMen(f)[0];
  const X1 = m0[0] - HAUL.near - LOG.slack * HAUL_C;
  const Z = m0[1] - LOG.slack * HAUL_S - 10;
  return { X0: X1 - LOG.len, X1, Z };
};

const Log: React.FC<{ A: AirWorld; X0: number; X1: number; Z: number; R: number }> = ({ A, X0, X1, Z, R }) => {
  // a picture-book log seen from the side: a round-ended bark body, the cut end toward us with its rings, a stub
  const r = A.P.r(Z);
  const a = A.P.p(X0, -R, Z);
  const b = A.P.p(X1, -R, Z);
  const rr = R * r;
  const ex = 0.36 * rr;
  const t = (hex: string) => A.tone(hex, Z, R);
  const ln = t(lineOf(MAT.timber));
  const body = `M${(a[0]).toFixed(2)},${(a[1] - rr).toFixed(2)}L${b[0].toFixed(2)},${(b[1] - rr).toFixed(2)}A${ex.toFixed(2)},${rr.toFixed(2)} 0 0 1 ${b[0].toFixed(2)},${(b[1] + rr).toFixed(2)}L${a[0].toFixed(2)},${(a[1] + rr).toFixed(2)}Z`;
  const stub = A.P.p(X0 + (X1 - X0) * 0.62, -2 * R, Z);
  return (
    <g>
      <defs>
        <linearGradient id="log-g" gradientUnits="userSpaceOnUse" x1="0" y1={(a[1] - rr).toFixed(2)} x2="0" y2={(a[1] + rr).toFixed(2)}>
          <stop offset="0" stopColor={t(MAT.timber.lit)} />
          <stop offset="0.3" stopColor={t(mixHex(MAT.timber.lit, MAT.timber.mid, 0.5))} />
          <stop offset="0.75" stopColor={t(MAT.timber.mid)} />
          <stop offset="1" stopColor={t(MAT.timber.dark)} />
        </linearGradient>
      </defs>
      <path d={`M${(stub[0] - 5 * r).toFixed(2)},${(stub[1] + 3 * r).toFixed(2)}L${(stub[0] + 4 * r).toFixed(2)},${(stub[1] - 16 * r).toFixed(2)}L${(stub[0] + 13 * r).toFixed(2)},${(stub[1] - 14 * r).toFixed(2)}L${(stub[0] + 9 * r).toFixed(2)},${(stub[1] + 3 * r).toFixed(2)}Z`} fill={t(MAT.timber.mid)} stroke={ln} strokeWidth={1 / A.k} strokeLinejoin="round" />
      <path d={body} fill="url(#log-g)" stroke={ln} strokeWidth={1.1 / A.k} strokeLinejoin="round" />
      {[-0.45, 0.05, 0.5].map((y, i) => (
        <path key={i} d={`M${(a[0] + (14 + 22 * i) * r).toFixed(2)},${(a[1] + y * rr).toFixed(2)}L${(b[0] - (20 + 16 * i) * r).toFixed(2)},${(b[1] + y * rr + 0.5).toFixed(2)}`} stroke={t(MAT.timber.dark)} strokeOpacity={0.3} strokeWidth={1.6 * r} strokeLinecap="round" />
      ))}
      <ellipse cx={a[0]} cy={a[1]} rx={ex} ry={rr} fill={t(MAT.hemp.lit)} stroke={ln} strokeWidth={1.1 / A.k} />
      <ellipse cx={a[0]} cy={a[1]} rx={ex * 0.6} ry={rr * 0.6} fill="none" stroke={t(MAT.hemp.dark)} strokeOpacity={0.55} strokeWidth={1.2 * r} />
      <ellipse cx={a[0]} cy={a[1]} rx={ex * 0.22} ry={rr * 0.22} fill={t(MAT.hemp.dark)} fillOpacity={0.55} />
    </g>
  );
};

// ===================================================================================================================
// 3. THE PLAN: a man squats and draws in the sand with a long stick; the line is a dashed orange plan
// ===================================================================================================================
export const PLAN = { X: 262, Z: -290, v: 0 };
/** the stick (units): longer than the pose's own, so the plan can be big enough to read */
const STICK = 240;
/** the stick's tip rests here (plan coords) until he starts, then moves (lifted) to the river's start */
const PLAN_REST: G2 = [175, 8];
const PLAN_LIFT_F = 163;
/** the plan's strokes in (d, dz): d = units ahead of the planner (he faces screen left: X = PLAN.X - d), dz = depth */
const stroke = (fn: (u: number) => [number, number], n = 24): G2[] => Array.from({ length: n + 1 }, (_, i) => fn(i / n));
const RIVER = stroke((u) => [78 + 232 * u, 62 + 13 * Math.sin(u * Math.PI * 2.6) - 12 * u], 48);
const loop = (c: [number, number], r: number) => stroke((u) => [c[0] + r * Math.sin(u * Math.PI * 2), c[1] - r * Math.cos(u * Math.PI * 2)], 18);
const HERD = [loop([250, 22], 11), loop([290, 30], 11), loop([272, -10], 11)];
const bez = (a: G2, b: G2, c: G2) => (u: number): G2 => [(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * b[0] + u * u * c[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * b[1] + u * u * c[1]];
const ARROW_A: G2 = [138, -32];
const ARROW_B: G2 = [236, 2];
const SHAFT = stroke(bez(ARROW_A, [200, -58], ARROW_B), 24);
const HEAD = (() => {
  const t0 = bez(ARROW_A, [200, -58], ARROW_B)(0.94);
  const dir = [ARROW_B[0] - t0[0], ARROW_B[1] - t0[1]];
  const L = Math.hypot(dir[0], dir[1]);
  const ux = dir[0] / L;
  const uz = dir[1] / L;
  const back = 24;
  const rotv = (a: number): G2 => [ARROW_B[0] - back * (ux * Math.cos(a) - uz * Math.sin(a)), ARROW_B[1] - back * (ux * Math.sin(a) + uz * Math.cos(a))];
  return [rotv(0.5), ARROW_B, rotv(-0.5)] as G2[];
})();
/** the drawing timeline: each stroke drawn over [f0, f1] (eased), pen-up moves between */
export const PLAN_STROKES: { pts: G2[]; f0: number; f1: number }[] = [
  { pts: RIVER, f0: 172, f1: 187 },
  { pts: HERD[0], f0: 189.5, f1: 192 },
  { pts: HERD[1], f0: 192.6, f1: 195 },
  { pts: HERD[2], f0: 195.6, f1: 198 },
  { pts: SHAFT, f0: 202, f1: 209 },
  { pts: HEAD, f0: 210, f1: 213 },
];
const ease = (u: number) => u * u * (3 - 2 * u);
const strokePoly = PLAN_STROKES.map((s) => polyOf(s.pts));
/** how much of stroke i is drawn at frame f (0..1) */
const drawnU = (i: number, f: number) => {
  const s = PLAN_STROKES[i];
  return f <= s.f0 ? 0 : f >= s.f1 ? 1 : 0.15 * ((f - s.f0) / (s.f1 - s.f0)) + 0.85 * ease((f - s.f0) / (s.f1 - s.f0));
};
/** before he draws, the tip idly taps the sand (a quick lift and drop every 19 frames, quieter as he looks up to think) */
const planTap = (f: number) => {
  const ph = (((f + 4) / 19) % 1 + 1) % 1;
  const bump = ph < 0.32 ? Math.sin((Math.PI * ph) / 0.32) : 0;
  return 7 * bump * c01((156 - f) / 5);
};
/** his head before the plan: down at the tapping tip, then up and aside (thinking, toward the herd's side), and back
 *  down to the sand as the tip lifts (f155-163) */
const planHead = (f: number) => {
  const think = c01((f - 60) / 14) * (1 - c01((f - 150) / 12)) * (0.6 + 0.4 * Math.sin(f / 15));
  const w = 1 - c01((f - 158) / 8);
  return { yaw: -0.1 * think + w * 0.04 * Math.sin(f / 11), pitch: -14 * think, look: [0.1 * think, -0.75 * think] as P2 };
};
/** the stick tip at frame f: (d, dz) and how far it is lifted (units) */
const tipAt = (f: number): { g: G2; lift: number } => {
  const S = PLAN_STROKES;
  if (f <= PLAN_LIFT_F) return { g: PLAN_REST, lift: planTap(f) };
  if (f <= S[0].f0) {
    const u = ease((f - PLAN_LIFT_F) / (S[0].f0 - PLAN_LIFT_F));
    const b = S[0].pts[0];
    return { g: [PLAN_REST[0] + (b[0] - PLAN_REST[0]) * u, PLAN_REST[1] + (b[1] - PLAN_REST[1]) * u], lift: 10 * Math.sin(Math.PI * u) };
  }
  for (let i = 0; i < S.length; i++) {
    const s = S[i];
    if (f <= s.f1) {
      if (f >= s.f0) return { g: along(strokePoly[i], drawnU(i, f) * strokePoly[i].len).p, lift: 0 };
      // pen up from the end of the previous stroke to the start of this one
      const prev = S[i - 1];
      const u = ease((f - prev.f1) / (s.f0 - prev.f1));
      const a = prev.pts[prev.pts.length - 1];
      const b = s.pts[0];
      return { g: [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u], lift: 9 * Math.sin(Math.PI * u) };
    }
  }
  // after the last stroke: the tip rises a little off the arrowhead's end and rests there
  const last = S[S.length - 1];
  return { g: last.pts[last.pts.length - 1], lift: 7 * ease(c01((f - last.f1) / 10)) };
};
/** the ground point of a plan coordinate */
const planG = (q: G2): G2 => [PLAN.X - q[0], PLAN.Z + q[1]];

/** the planner's pose: drawPlan's squat, the near hand on a long stick whose tip is at `tip` (world px) */
const plannerPose = (A: AirWorld, f: number, tipW: P2) => {
  const { at, scale } = A.P.at(PLAN.X, PLAN.Z);
  // figure-local, in the dir +1 frame (the figure is mirrored to face left afterwards)
  const tipL: P2 = [-(tipW[0] - at[0]) / scale, (tipW[1] - at[1]) / scale];
  // the near hand grips the long stick where it is comfortable (a little toward the tip as the tip moves out) and
  // the grip slides along the stick as the tip comes near or goes far (choking up); the butt runs on past the hand
  const pref: P2 = [58 + 0.3 * (tipL[0] - 180), -72 + 0.3 * tipL[1]];
  const dx = pref[0] - tipL[0];
  const dy = pref[1] - tipL[1];
  const L = Math.hypot(dx, dy) || 1;
  const G = Math.max(60, Math.min(215, L));
  const hand: P2 = [tipL[0] + (dx / L) * G, tipL[1] + (dy / L) * G];
  const buttL: P2 = [tipL[0] + (dx / L) * STICK, tipL[1] + (dy / L) * STICK];
  const base = PERSON_POSES.drawPlan(1, 0.5, f, PLAN.v);
  const q = personGripTo(
    "forager",
    PLAN.v,
    { ...base, holdL: "none", stickTip: undefined, armL: { w: [hand[0] - 6, hand[1] + 4], elbow: [-0.4, 1], fist: 1, hand: 0 } },
    { L: hand },
  );
  const mq = mirrorPose(q) as PersonPose;
  const h = planHead(f);
  const m: PersonPose = { ...mq, holdL: q.holdR, holdR: q.holdL, stickTip: undefined, headYaw: mq.headYaw + h.yaw, pitch: mq.pitch + h.pitch, look: [(mq.look?.[0] ?? 0) - h.look[0], (mq.look?.[1] ?? 0) + h.look[1]] };
  const handW: P2 = [at[0] - hand[0] * scale, at[1] + hand[1] * scale];
  const buttW: P2 = [at[0] - buttL[0] * scale, at[1] + buttL[1] * scale];
  return { pose: m, handW, buttW, at, scale };
};

// ===================================================================================================================
// THE CHIMPS: a chimpanzee and a bonobo knuckle-walk away along the left fork
// ===================================================================================================================
/** the chimps walk at 0.65 of a full stride (knuckleWalk amount; the advance scales with it) */
const CHIMP_AMT = 0.65;
const CHIMP_SPEED = (CHIMP_AMT * 58) / 32; // units per frame (chimpWalkAdvance at scale 1, x amount)
export const CHIMPS = [
  { v: 0, s0: 300, ph: 0 },
  { v: 1, s0: 75, ph: 11 },
];
/** the walk cycle's frame per chimp: it advances with the figure's own screen-x speed (in its own scale, at the
 *  settled camera's distance) so the planted knuckles and feet hold while the path turns away into depth */
const DC_REF = 2000 / 1.06;
const CHIMP_ANIM: number[][] = CHIMPS.map((c) => {
  const sx = (f: number) => {
    const { p } = along(CHIMP_ROUTE, c.s0 + CHIMP_SPEED * f);
    return p[0] * (DC_REF / (DC_REF + p[1]));
  };
  const out = [0];
  for (let f = 1; f <= DURATION + 2; f++) {
    const z = along(CHIMP_ROUTE, c.s0 + CHIMP_SPEED * (f - 0.5)).p[1];
    const r = DC_REF / (DC_REF + z);
    out.push(out[f - 1] + Math.abs(sx(f) - sx(f - 1)) / (CHIMP_SPEED * r));
  }
  return out;
});
const chimpAt = (c: (typeof CHIMPS)[number], f: number) => {
  const s = c.s0 + CHIMP_SPEED * f;
  const { p, t } = along(CHIMP_ROUTE, s);
  const an = CHIMP_ANIM[CHIMPS.indexOf(c)];
  const i = Math.max(0, Math.min(an.length - 2, Math.floor(f)));
  const anim = an[i] + (an[i + 1] - an[i]) * (f - i);
  return { X: p[0], Z: p[1], t, anim: anim + c.ph };
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
/** the ground's depth ranges (overlapping a little) */
const FLOOR_RANGES: [number, number][] = [[-1500, 900], [880, 2200], [2180, 3800], [3780, 6000], [5980, 9500], [9480, 16000], [15980, 46000]];
const pt = (q: P2) => `${q[0].toFixed(2)},${q[1].toFixed(2)}`;

/** the key points of a frame in SCREEN px (for the checks): name -> [x, y] */
export const keyPoints = (frame: number): Record<string, P2> => {
  const A = worldAt(frame);
  const { cam, P } = A;
  const S = (w: P2): P2 => [(w[0] - cam.cx) * cam.k + 540, (w[1] - cam.cy) * cam.k + 960];
  const out: Record<string, P2> = {};
  out.fork = S(P.p(FORK[0], 0, FORK[1]));
  const end = OURS.pts[OURS.pts.length - 1];
  out.today = S(P.p(end[0], 0, end[1]));
  CHIMPS.forEach((c, i) => {
    const s = chimpAt(c, frame);
    out[`chimp${i}.feet`] = S(P.p(s.X, 0, s.Z));
    out[`chimp${i}.top`] = S(P.p(s.X - 64, -156, s.Z));
    out[`chimp${i}.rear`] = S(P.p(s.X + 110, -80, s.Z));
  });
  const men = haulMen(frame);
  const lg = haulLog(frame);
  out["log.l"] = S(P.p(lg.X0, 0, lg.Z));
  out["log.r"] = S(P.p(lg.X1, -2 * LOG.R, lg.Z));
  men.forEach((m, i) => {
    out[`haul${i}.feet`] = S(P.p(m[0], 0, m[1]));
    out[`haul${i}.head`] = S(P.p(m[0] - 10, -312, m[1]));
    out[`haul${i}.fist`] = S(P.p(m[0] - 78, -152, m[1]));
  });
  out["haul.back"] = S(P.p(men[5][0] + 60, -150, men[5][1]));
  out["teach.head"] = S(P.p(TEACH.X + 55, -185, TEACH.Z));
  out["teach.back"] = S(P.p(TEACH.X - 65, -60, TEACH.Z));
  out["child.head"] = S(P.p(TEACH.child.X - 29, -145, TEACH.child.Z));
  out["child.back"] = S(P.p(TEACH.child.X + 60, -60, TEACH.child.Z));
  out["plan.head"] = S(P.p(PLAN.X - 55, -190, PLAN.Z));
  out["plan.back"] = S(P.p(PLAN.X + 70, -60, PLAN.Z));
  out["plan.feet"] = S(P.p(PLAN.X, 0, PLAN.Z));
  for (const q of [...RIVER, ...HERD.flat(), ...SHAFT, ...HEAD]) {
    const g = planG(q);
    const s = S(P.p(g[0], 0, g[1]));
    const lo = out["draw.min"] ?? [1e9, 1e9];
    const hi = out["draw.max"] ?? [-1e9, -1e9];
    out["draw.min"] = [Math.min(lo[0], s[0]), Math.min(lo[1], s[1])];
    out["draw.max"] = [Math.max(hi[0], s[0]), Math.max(hi[1], s[1])];
  }
  const tip = tipAt(frame);
  const tg = planG(tip.g);
  out.tip = S(P.p(tg[0], -tip.lift, tg[1]));
  // the grip: the nearer hand's distance (screen px) from the stick's line, and the hand itself
  const tipW = P.p(tg[0], -tip.lift, tg[1]);
  const pp = plannerPose(A, frame, tipW);
  const an = personAnchors("forager", pp.pose, pp.at, pp.scale, { variant: PLAN.v });
  const segD = (q: P2, a: P2, b: P2) => {
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const u = c01(((q[0] - a[0]) * dx + (q[1] - a[1]) * dy) / (dx * dx + dy * dy || 1));
    return Math.hypot(q[0] - a[0] - u * dx, q[1] - a[1] - u * dy);
  };
  const dL = segD(an.mittenL, pp.buttW, tipW);
  const dR = segD(an.mittenR, pp.buttW, tipW);
  out["plan.gripErr"] = [Math.min(dL, dR) * cam.k, dL < dR ? 0 : 1];
  out["plan.hand"] = S(dL < dR ? an.mittenL : an.mittenR);
  return out;
};

const NotMuchTime: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const A = worldAt(frame);
  const cam = A.cam;
  const P = A.P;
  const k = cam.k;

  // depth-sorted things (far first)
  const items: { z: number; node: React.ReactNode }[] = [];
  const push = (z: number, node: React.ReactNode) => items.push({ z, node });

  // tufts in view only
  const view = { y0: cam.cy - 1000 / k, y1: cam.cy + 1000 / k, x0: cam.cx - 600 / k, x1: cam.cx + 600 / k };
  TUFTS.forEach((t, i) => {
    const g = P.p(t.X, 0, t.Z);
    if (g[0] < view.x0 || g[0] > view.x1 || g[1] < view.y0 || g[1] > view.y1 + 60) return;
    push(t.Z, <TuftG key={`t${i}`} A={A} t={t} />);
  });

  // the chimps
  CHIMPS.forEach((c, i) => {
    const s = chimpAt(c, frame);
    const { at, scale } = P.at(s.X, s.Z);
    push(
      s.Z,
      <g key={`c${i}`}>
        <AirShadow A={A} X={s.X} Z={s.Z} w={70} d={30} uid={`cs${i}`} amt={0.8} />
        <Chimp variant={c.v} pose={CHIMP_POSES.knuckleWalk(-1, s.anim, CHIMP_AMT)} at={at} scale={scale} uid={`ch${i}`} fog={A.folkFog(s.Z)} unitPx={k} />
      </g>,
    );
  });

  // the haul: the log, the six on one rope running back into depth, the rope through every fist
  {
    const men = haulMen(frame);
    const lg = haulLog(frame);
    const Zf = men[0][1];
    const nodes = HAUL_V.map((v, i) => {
      const [X, Z] = men[i];
      const { at, scale } = P.at(X, Z);
      const hp = PERSON_POSES.haul(HAUL_DIR, haulFrame(frame, i), haulStep(frame), v);
      const hh = haulHead(frame, i);
      const pose: PersonPose = { ...hp, headYaw: hp.headYaw + hh.yaw, pitch: hp.pitch + hh.pitch, look: [(hp.look?.[0] ?? 0) + hh.look, hp.look?.[1] ?? 0] };
      return (
        <g key={`h${i}`}>
          <AirShadow A={A} X={X} Z={Z} w={58} d={26} uid={`hs${i}`} amt={0.75} />
          <Forager variant={v} pose={pose} at={at} scale={scale} uid={`hl${i}`} frame={frame} fog={A.folkFog(Z)} unitPx={k} />
        </g>
      );
    });
    // the rope: tie -> each man's near fist -> his far fist -> the next man's near fist ... -> a short tail
    const rope: P2[] = [P.p(lg.X1 - 16, -LOG.R * 1.75, lg.Z)];
    men.forEach(([X, Z]) => {
      rope.push(P.p(X - HAUL.near, HAUL.y, Z));
      rope.push(P.p(X - HAUL.far, HAUL.y + 1, Z));
    });
    const last = men[men.length - 1];
    rope.push(P.p(last[0] - HAUL.far + 26 * HAUL_C, HAUL.y + 1, last[1] + 26 * HAUL_S));
    const ropeCol = A.tone(MAT.hemp.mid, Zf, 150);
    const wrap = [12, 22].map((dx) => `M${pt(P.p(lg.X1 - dx, -2 * LOG.R, lg.Z))}L${pt(P.p(lg.X1 - dx - 3, 0, lg.Z))}`).join("");
    push(
      Zf,
      <g key="haul">
        {nodes.slice().reverse()}
        <AirShadow A={A} X={(lg.X0 + lg.X1) / 2} Z={lg.Z} w={LOG.len * 0.55} d={36} uid="logS" amt={0.7} />
        <Log A={A} X0={lg.X0} X1={lg.X1} Z={lg.Z} R={LOG.R} />
        <path d={wrap} fill="none" stroke={ropeCol} strokeWidth={3 * P.r(Zf)} strokeLinecap="round" />
        <path d={`M${rope.map(pt).join("L")}`} fill="none" stroke={ropeCol} strokeWidth={3 * P.r(Zf)} strokeLinecap="round" strokeLinejoin="round" />
      </g>,
    );
  }

  // the teaching pair and the flakes
  {
    const tf = teachFrame(frame);
    const tp0 = PERSON_POSES.teach(1, tf, teachAmount(frame), TEACH.v);
    const ti = teachIdle(frame);
    const tPose: PersonPose = { ...tp0, headYaw: tp0.headYaw + ti.yaw, pitch: tp0.pitch + ti.pitch, look: [(tp0.look?.[0] ?? 0) + ti.look[0], (tp0.look?.[1] ?? 0) + ti.look[1]], mouth: tp0.mouth + ti.mouth };
    const T = P.at(TEACH.X, TEACH.Z);
    const an = personAnchors("forager", tPose, T.at, T.scale, { variant: TEACH.v });
    const core = an.propL ?? T.at;
    const coreL: P2 = [(core[0] - T.at[0]) / T.scale, (core[1] - T.at[1]) / T.scale];
    const knapOn = c01((frame - 104) / 6);
    const wp0 = lerpPose(PERSON_POSES.watch(-1, tf, TEACH.child.v, false), PERSON_POSES.watch(-1, tf, TEACH.child.v, true), knapOn) as PersonPose;
    const ci = childIdle(frame);
    const wPose: PersonPose = { ...wp0, roll: wp0.roll + ci.roll, headYaw: wp0.headYaw + ci.yaw, pitch: wp0.pitch + ci.pitch, look: [(wp0.look?.[0] ?? 0) + ci.look[0], (wp0.look?.[1] ?? 0) + ci.look[1]], open: (wp0.open ?? 0) + ci.open };
    const C = P.at(TEACH.child.X, TEACH.child.Z);
    push(
      TEACH.Z,
      <g key="teacher">
        <AirShadow A={A} X={TEACH.X + 20} Z={TEACH.Z} w={78} d={34} uid="ts" amt={0.8} />
        <Forager variant={TEACH.v} pose={tPose} at={T.at} scale={T.scale} uid="teach" frame={frame} fog={A.folkFog(TEACH.Z)} unitPx={k} />
      </g>,
    );
    push(
      TEACH.child.Z,
      <g key="child">
        <AirShadow A={A} X={TEACH.child.X - 15} Z={TEACH.child.Z} w={58} d={28} uid="cs" amt={0.8} />
        <Forager variant={TEACH.child.v} pose={wPose} at={C.at} scale={C.scale} uid="child" frame={frame} fog={A.folkFog(TEACH.child.Z)} unitPx={k} />
      </g>,
    );
    const flakes = FLAKES.map((fl, i) => {
      const s = flakeAt(fl, coreL, frame);
      if (!s) return null;
      const w: P2 = [T.at[0] + s.p[0] * T.scale, T.at[1] + s.p[1] * T.scale];
      const r = fl.size * T.scale;
      const a = ((fl.rot + (s.flying ? (frame - fl.hit) * 40 : 0)) * Math.PI) / 180;
      const tri = [0, 2.2, 4.1].map((b, j) => [w[0] + Math.cos(a + b) * r * (j === 1 ? 0.7 : 1), w[1] + Math.sin(a + b) * r * (j === 1 ? 0.55 : 0.6)] as P2);
      return <path key={i} d={`M${tri.map(pt).join("L")}Z`} fill={A.tone(i % 2 ? FLAKE.rim : FLAKE.lit, TEACH.Z, 20)} stroke={A.tone(FLAKE.mid, TEACH.Z, 20)} strokeWidth={0.6 * T.scale} strokeOpacity={0.6} />;
    });
    push(TEACH.child.Z - 1, <g key="flakes">{flakes}</g>);
  }

  // the planner
  const tip = tipAt(frame);
  const tg = planG(tip.g);
  const tipW = P.p(tg[0], -tip.lift, tg[1]);
  {
    const pp = plannerPose(A, frame, tipW);
    push(
      PLAN.Z,
      <g key="planner">
        <AirShadow A={A} X={PLAN.X - 15} Z={PLAN.Z} w={80} d={34} uid="ps" amt={0.8} />
        <Forager variant={PLAN.v} pose={pp.pose} at={pp.at} scale={pp.scale} uid="plan" frame={frame} fog={A.folkFog(PLAN.Z)} unitPx={k} />
        <Stick p0={pp.buttW} p1={tipW} scale={pp.scale} uid="stick" fog={A.folkFog(PLAN.Z)} unitPx={k} />
      </g>,
    );
  }

  // the dashed orange plan on the sand (drawn so far)
  const planPaths = PLAN_STROKES.map((_, i) => {
    const u = drawnU(i, frame);
    if (u <= 0) return null;
    const Pl = strokePoly[i];
    const Lu = u * Pl.len;
    const pts: P2[] = [];
    for (let j = 0; j < Pl.pts.length; j++) {
      if (Pl.cum[j] >= Lu) break;
      const g = planG(Pl.pts[j]);
      pts.push(P.p(g[0], 0, g[1]));
    }
    const e = planG(along(Pl, Lu).p);
    pts.push(P.p(e[0], 0, e[1]));
    return pts.length > 1 ? `M${pts.map(pt).join("L")}` : null;
  }).filter((d): d is string => d !== null);
  const planCol = A.toneO(ACCENT, PLAN.Z, 0);
  const pr = P.r(PLAN.Z);

  items.sort((a, b) => b.z - a.z);

  return (
    <AirStage v={A.v} bloom={0.24} shafts={0.6}>
      <WorldSvg cam={cam}>
        <defs>
          <filter id="plan-glow" x="-20%" y="-50%" width="140%" height="200%">
            <feGaussianBlur stdDeviation={4 * pr} />
          </filter>
        </defs>
        {/* the ground in depth ranges (each AirFloor has 28 bands: fewer ranges step visibly when the eye is high) */}
        {FLOOR_RANGES.map(([z0, z1], i) => (
          <AirFloor key={`fl${i}`} A={A} x0={-12000} x1={12000} z0={z0} z1={z1} mat={MAT.ground} jointAmt={0} melt={i === FLOOR_RANGES.length - 1 ? 0.5 : 0} />
        ))}
        <Trail A={A} P={TRUNK} w={W_TRUNK} />
        <Trail A={A} P={LEFT} w={W_LEFT} />
        <Trail A={A} P={OURS} w={W_OURS} core={0.3} />
        <TodayEdge A={A} />
        <Footprints A={A} frame={frame} />
        {planPaths.map((d, i) => (
          <path key={`pg${i}`} d={d} fill="none" stroke={planCol} strokeOpacity={0.4} strokeWidth={7 * pr} strokeLinecap="round" strokeLinejoin="round" filter="url(#plan-glow)" />
        ))}
        {planPaths.map((d, i) => (
          <path key={`pl${i}`} d={d} fill="none" stroke={planCol} strokeWidth={3.4 * pr} strokeDasharray={`${(7.5 * pr).toFixed(2)} ${(5 * pr).toFixed(2)}`} strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {items.map((it) => it.node)}
      </WorldSvg>
    </AirStage>
  );
};

export default NotMuchTime;
