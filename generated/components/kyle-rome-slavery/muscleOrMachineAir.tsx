// ---------------------------------------------------------------------------
// muscleOrMachineAir: the V3 MEDIUM of cut 5 (MuscleOrMachine): the pandemics clip's air (kyle-pandemics/pandemicAir.tsx,
// palette A, read only) wrapped round the cut's London-depth stage. Mood `interior` (the denser, darker air of a mill
// room), its light from the upper left as soft diagonal shafts that parallax with the truck (the stage's view is the
// interior air with the day mood's rays: the room has no back wall to hold a window). Every object sits INSIDE the air
// and fogs by its distance from the eye (CAM_D + Z: dolly 0); the people too, each by its own distance.
//
// API
//   MM_AIR_SCENE            the AirScene (world px: a man MAN = 330 = 1.75 m)
//   mmAirAt(cam, frame)     -> MA for one frame: .v (the AirView), .stageV (the same air with the rays for AirStage),
//     .tone(hex, Z, h?)     a local colour fogged by the distance of depth Z at height h (up +, world px)
//     .fog(Z) / .airHex(Z, h?) / .screenAir(worldY)   the fog amount, the air at that distance, the air behind a row
//     .orange(hex, Z, h?)   orange takes only part of the fog (the one glowing material)
//   MAT_*                   the local materials (before fog); lineOf(mat) its outline (a darker local colour)
//   AirFloor                the flags: one continuous tone by distance, joints in a darker local colour fading with the
//                           fog, the far end melting into the air behind it
//   AirShadow               a soft contact shadow in the medium's shadow colour, fading with the fog of its distance
//   FOLK WORKER (the 18th-century side): the pandemics clip's drawn Worker (kyle-pandemics/pandemicFolk FolkWorker,
//     read only) placed on the cut's floor: folkScaleAt(romeScale), workerInks(ma, Z), and solveArms(): both mittens
//     onto world targets by a small regularised Gauss-Newton on a copy of the Worker's arm chain (the same joints and
//     lengths as pandemicFolkWorker's buildArm; checked against buildWorker's anchors in the audit).
// ---------------------------------------------------------------------------
import React from "react";
import { AIR, fogHex, makeAirView, mixHex, rgbHex, type AirScene, type AirView, type Mat } from "../kyle-pandemics/pandemicAir";
import { WORKER_INKS, type ArmPose, type WorkerPose } from "../kyle-pandemics/pandemicFolk";
import type { Persp } from "../kyle-london/londonDepth";
import type { Cam, P2 } from "../kits/maps/incaShared";
import { CAM_D, EYE_Y, MAN, camAt, horizonY } from "./muscleOrMachinePlan";

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const Pt = (v: P2) => `${v[0].toFixed(2)},${v[1].toFixed(2)}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;

export const PAL = AIR.A;
/** the medium (distances are the eye's: CAM_D + Z) */
export const MM_AIR_SCENE: AirScene = { look: "A", mood: "interior", F: 1000, fogNear: 880, fogVis: 1500, fogMax: 0.92, hLow: 0, hHigh: 1100, moteUnit: MAN / 1.75, eyeT: AIR.A.eyeT + 0.06 };
/** AirStage strengths */
export const MM_BLOOM = 0.22;
export const MM_SHAFTS = 0.75;

// ----- local materials (before fog) -----
export const MAT_FLOOR: Mat = { lit: "#81766A", mid: "#6B6153", dark: "#38302A" };
/** Vesuvian lava (the Roman mill): warm grey-umber, a touch darker than the medium's stone */
export const MAT_LAVA: Mat = { lit: "#928472", mid: "#615648", dark: "#2E2822" };
export const MAT_BRICK: Mat = { lit: "#957060", mid: "#735446", dark: "#3C2C25" };
export const MAT_TRAVERTINE: Mat = { lit: "#B4A78D", mid: "#867A66", dark: "#463E33" };
export const MAT_TIMBER: Mat = { lit: "#9A7A55", mid: "#6E5438", dark: "#3A2B1D" };
export const MAT_IRON: Mat = { lit: "#7A8382", mid: "#515A5B", dark: "#282E2F" };
/** the French burr millstones: pale cream-grey */
export const MAT_BURR: Mat = { lit: "#BCB19A", mid: "#8C816D", dark: "#4B4338" };
/** the runner's iron hoop: THE MACHINE (orange) */
export const MAT_HOOP: Mat = { lit: "#FFC64A", mid: "#FFB000", dark: "#D98A0C" };
export const ORANGE_LINE = "#8A4A0E";
export const FLOUR = "#F1E9DA";
export const FLOUR_DK = "#CDBF9F";
export const GRAIN = "#D8C38E";
export const GRAIN_DK = "#A48D5E";
export const GRAIN_EDGE = "#6E5B3C";
export const SACKCLOTH: Mat = { lit: "#E2D6BC", mid: "#C3B08C", dark: "#8C7A5C" };
/** a darker version of a local colour: the outline */
export const lineOf = (m: Mat) => mixHex(m.dark, PAL.shadow, 0.35);

export type MA = {
  v: AirView;
  stageV: AirView;
  cam: Cam;
  Dc: number;
  tone: (hex: string, Z: number, h?: number) => string;
  fog: (Z: number) => number;
  airHex: (Z: number, h?: number) => string;
  screenAir: (worldY: number) => string;
  orange: (hex: string, Z: number, h?: number) => string;
};
const REST = camAt(0);
export const mmAirAt = (cam: Cam, frame: number): MA => {
  const Dc = CAM_D;
  const eyeH = -EYE_Y;
  const v = makeAirView({
    scene: { ...MM_AIR_SCENE, F: Dc * cam.k },
    frame,
    horizon: horizonY(cam),
    cam: { x: cam.cx, y: eyeH, z: -Dc },
    rest: { x: REST.cx, y: eyeH, z: -Dc },
  });
  // the stage: the interior air, lit by soft diagonal rays from the upper left (they parallax with the truck)
  const stageV: AirView = { ...v, mood: { ...v.mood, shafts: "rays", slant: 0.42, sun: { x: 90, y: 60, r: 1150, a: 0.3 } } };
  const toSY = (wy: number) => 960 + (wy - cam.cy) * cam.k;
  const fog = (Z: number) => c01(v.fogAt(Dc + Z));
  const airHex = (Z: number, h = 0) => rgbHex(v.airAt(Dc + Z, h));
  const tone = (hex: string, Z: number, h = 0) => fogHex(v, hex, Dc + Z, h);
  const orange = (hex: string, Z: number, h = 0) => mixHex(hex, airHex(Z, h), 0.45 * fog(Z));
  return { v, stageV, cam, Dc, tone, fog, airHex, screenAir: (wy) => rgbHex(v.airAtScreen(toSY(wy))), orange };
};

// ---------------------------------------------------------------------------
// THE FLOOR
// ---------------------------------------------------------------------------
/** the flags: one continuous tone by distance (a little darker near, the far end melting into the air behind its
 *  row), joints in a darker local colour fading with the fog */
export const AirFloor: React.FC<{ P: Persp; A: MA; x0: number; x1: number; z0: number; z1: number; mat: Mat; course: number; uid: string }> = ({ P, A, x0, x1, z0, z1, mat, course }) => {
  const zA = Math.max(z0, P.zNear);
  const melt = (Z: number) => Math.pow(c01((Z - (z1 - 0.4 * (z1 - z0))) / (0.4 * (z1 - z0))), 1.3);
  const colAt = (Z: number) => {
    const near = c01(1 - (Z + 300) / 900);
    const local = mixHex(mixHex(mat.lit, mat.mid, 0.3), mat.dark, 0.22 * near);
    const fogged = A.tone(local, Z, 0);
    const wy = P.p(0, 0, Z)[1];
    return mixHex(fogged, A.screenAir(wy), melt(Z));
  };
  const N = 30;
  const bands: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const za = mix(zA, z1, Math.pow(i / N, 1.7));
    const zb = mix(zA, z1, Math.pow((i + 1) / N, 1.7));
    const zb2 = i < N - 1 ? zb + (zb - za) * 0.15 : zb;
    bands.push(<path key={i} d={poly([P.p(x0, 0, za), P.p(x1, 0, za), P.p(x1, 0, zb2), P.p(x0, 0, zb2)])} fill={colAt((za + zb) / 2)} />);
  }
  // the joints along Z (to the VP) and across (courses, staggered), by depth pieces
  const step = course;
  const pieces = 18;
  const zAt = (i: number) => mix(zA, z1, Math.pow(i / pieces, 1.6));
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < pieces; i++) {
    const za = zAt(i);
    const zb = zAt(i + 1);
    const zm = (za + zb) / 2;
    const a = (1 - A.fog(zm)) * (1 - melt(zm));
    if (a < 0.03) continue;
    let d = "";
    for (let X = Math.ceil(x0 / step) * step; X <= x1; X += step) if (X > x0 + 1 && X < x1 - 1) d += `M${Pt(P.p(X, 0, za))}L${Pt(P.p(X, 0, zb))}`;
    for (let X = Math.floor(x0 / step) * step; X < x1; X += step) {
      const off = (((Math.round(X / step) % 2) + 2) % 2) * course * 0.5;
      for (let Z = Math.floor((za - off) / course) * course + off; Z < zb; Z += course) {
        if (Z < za) continue;
        const xa = Math.max(x0, X);
        const xb = Math.min(x1, X + step);
        if (xb > xa) d += `M${Pt(P.p(xa, 0, Z))}L${Pt(P.p(xb, 0, Z))}`;
      }
    }
    lines.push(<path key={`j${i}`} d={d} fill="none" stroke={A.tone(lineOf(mat), zm)} strokeWidth={1.4 * P.r(zm)} strokeOpacity={0.36 * a} />);
  }
  return (
    <g>
      {bands}
      {lines}
    </g>
  );
};

/** a soft contact shadow on the floor in the medium's shadow colour, offset to the lower right, fading with the fog */
export const AirShadow: React.FC<{ P: Persp; A: MA; X: number; Z: number; w?: number; d?: number; uid: string; amt?: number; Y?: number }> = ({ P, A, X, Z, w = 74, d = 40, uid, amt = 1, Y = 0 }) => {
  const Xc = X + 0.18 * w;
  const Zc = Z - 0.25 * d;
  const c = P.p(Xc, Y, Zc);
  const rx = w * P.r(Zc);
  const ry = Math.max(1, (P.p(Xc, Y, Zc - d)[1] - P.p(Xc, Y, Zc + d)[1]) / 2);
  const a = amt * (1 - A.fog(Z));
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}-as`}>
          <stop offset="0" stopColor={PAL.shadow} stopOpacity={0.66 * a} />
          <stop offset="0.6" stopColor={PAL.shadow} stopOpacity={0.38 * a} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0} />
        </radialGradient>
      </defs>
      <ellipse cx={c[0]} cy={c[1]} rx={rx} ry={ry} fill={`url(#${uid}-as)`} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE FOLK WORKER on this floor
// ---------------------------------------------------------------------------
/** the drawn Worker is 513 units to his cap; a romeCast man 312 to his skull: the Worker's px per unit from a cast
 *  scale (world px per cast unit), cap included (~1.04 man) */
export const folkScaleAt = (castScale: number) => (castScale * 325) / 513;
/** the Worker's inks fogged into the air at depth Z (his own distance; local colour survives near) */
export const workerInks = (A: MA, Z: number, h = 160) => {
  const air = A.airHex(Z, h);
  const t = A.fog(Z);
  return Object.fromEntries(Object.entries(WORKER_INKS).map(([k, c]) => [k, k === "orange" ? c : mixHex(c, air, t)])) as typeof WORKER_INKS;
};

type V3 = [number, number, number];
const D2R = Math.PI / 180;
const armDir = (side: number, abd: number, flex: number): V3 => {
  const sa = Math.sin(abd * D2R);
  const ca = Math.cos(abd * D2R);
  return [side * sa, ca * Math.cos(flex * D2R), ca * Math.sin(flex * D2R)];
};
const add3 = (a: V3, b: V3, k = 1): V3 => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** the mitten's centre (pandemicFolkWorker buildArm's hMid -> anchors.handL / handR), figure units */
export const folkHand = (pose: WorkerPose, side: 1 | -1, ap: ArmPose): P2 => {
  const lift = -pose.breath * 1.5 + pose.slump;
  const Sh: V3 = [side * 47, -368 + lift + pose.slump * 0.5, 4];
  const E = add3(Sh, armDir(side, ap.abd, ap.flex), 69);
  const Wr = add3(E, armDir(side, ap.abd2, ap.flex2), 56);
  const h = norm3(armDir(side, ap.abd2 * 0.5, ap.flex2 - ap.droop));
  const q = add3(Wr, h, 13);
  const cs = Math.cos(pose.yaw * D2R);
  const sn = Math.sin(pose.yaw * D2R);
  const x = q[0] * cs + q[2] * sn;
  const y = q[1];
  const rot = (pose.bodyRoll * cs + pose.bodyPitch * sn) * D2R;
  const dx = x;
  const dy = y + 232;
  return [dx * Math.cos(rot) - dy * Math.sin(rot), -232 + dx * Math.sin(rot) + dy * Math.cos(rot)];
};
/** solve one arm's four angles so its mitten lands on `target` (figure units), staying near `rest` (a natural reach);
 *  the elbow never bends backward (flex2 >= flex - 10). Deterministic: a fixed start and a fixed iteration count. */
export const solveArm = (pose: WorkerPose, side: 1 | -1, target: P2, rest: ArmPose, lam = 0.05): ArmPose => {
  const keys = ["abd", "flex", "abd2", "flex2"] as const;
  let th = keys.map((k) => rest[k]);
  const r0 = keys.map((k) => rest[k]);
  const mk = (t: number[]): ArmPose => ({ ...rest, abd: t[0], flex: t[1], abd2: t[2], flex2: t[3] });
  const res = (t: number[]) => {
    const h = folkHand(pose, side, mk(t));
    const bend = Math.min(0, t[3] - t[1] + 10);
    return [h[0] - target[0], h[1] - target[1], ...t.map((v, i) => lam * (v - r0[i])), 2 * bend];
  };
  for (let it = 0; it < 40; it++) {
    const r = res(th);
    const J: number[][] = r.map(() => [0, 0, 0, 0]);
    for (let j = 0; j < 4; j++) {
      const t2 = th.slice();
      t2[j] += 0.05;
      const r2 = res(t2);
      for (let i = 0; i < r.length; i++) J[i][j] = (r2[i] - r[i]) / 0.05;
    }
    // (J^T J + mu I) d = -J^T r
    const A = [0, 1, 2, 3].map((a) => [0, 1, 2, 3].map((b) => r.reduce((s, _, i) => s + J[i][a] * J[i][b], 0) + (a === b ? 1e-3 : 0)));
    const g = [0, 1, 2, 3].map((a) => -r.reduce((s, ri, i) => s + J[i][a] * ri, 0));
    // Gaussian elimination
    const M = A.map((row, i) => [...row, g[i]]);
    for (let c = 0; c < 4; c++) {
      let p = c;
      for (let q = c + 1; q < 4; q++) if (Math.abs(M[q][c]) > Math.abs(M[p][c])) p = q;
      [M[c], M[p]] = [M[p], M[c]];
      for (let q = c + 1; q < 4; q++) {
        const fct = M[q][c] / M[c][c];
        for (let k = c; k < 5; k++) M[q][k] -= fct * M[c][k];
      }
    }
    const d = [0, 0, 0, 0];
    for (let c = 3; c >= 0; c--) d[c] = (M[c][4] - [0, 1, 2, 3].slice(c + 1).reduce((s, k) => s + M[c][k] * d[k], 0)) / M[c][c];
    const stepMax = Math.max(...d.map(Math.abs));
    const sc = stepMax > 25 ? 25 / stepMax : 1;
    th = th.map((v, i) => v + d[i] * sc);
  }
  return mk(th);
};
