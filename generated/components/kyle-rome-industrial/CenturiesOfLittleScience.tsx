// ---------------------------------------------------------------------------
// CenturiesOfLittleScience (kyle-rome-industrial, cut 125). Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 29.97 fps, 276 frames. The hall, the light and the camera: ./centuriesHallPlan.ts.
// The medium is the kit's (kits/dwarkesh-3d/dwarkesh3d: AirStage, makeAirView, palette A, mood interior); the hall is
// drawn by its own yaw camera (a pinhole that turns, verticals vertical), because the camera turns round at the end.
//
// CHECK LINE: "over five or six centuries the Roman Empire added almost nothing to the knowledge of how nature works,
// and next to nothing in technology came out of it: a vast hall of its centuries stands nearly empty."
//
// THE LINE: "[If] you look in the big picture, the contribution that the Roman empire makes to our knowledge of how
// nature works and then the applied technology that comes out of that is [really pathetic for five, six hundred years.]"
// WORD -> FRAME (Whisper, ~6 f early): you 1 · look 4 · in 11 · the 15 · big 16 · picture 20 · the 35 · contribution 42
// · that 56 · the 68 · Roman 74 · empire 92 · makes 114 · to 128 · our 141 · knowledge 158 · of 168 · how 174 ·
// nature 177 · works 188 · and 199 · then 209 · the 213 · applied 217 · technology 226 · that 243 · comes 253 · out 258
// · of 264 · that 267 · is 271 (cut at 276; on camera after: "really pathetic for five, six hundred years").
// DURATION: the slot 125.759 -> 134.968 s = 9.209 s x 29.97 = 276 frames (f0..f275).
//
// THE MOTION: one camera through the hall of the Roman centuries: six bays under arches carved I..VI, every bay lined
// with tall pigeonhole armaria and a pair of stone plinths, all bare. f0 close on bay I's right armarium (empty
// cubbies, a shaft of window light and dust across its foot); f0-35 ("you look in the big picture") it pulls back
// (away from it and toward the door) and up while turning to look down the hall: the empty hall, arch I's numeral over
// the middle, II..VI receding, a speck of orange at the very end. f30-70 the one acceleration, then f70-~200 one
// constant dolly (0.2 m/f) down the axis: the arches pass overhead (I f76, II f101, III f126, IV f151, V f176, VI
// f201), empty cubby after empty cubby and bare plinth after bare plinth slide by; the only orange is a handful of
// scrolls, each with a faint warm glow in its cubby's mouth and a glint as the view swings ~62 deg off its end: bay
// II's five (Galen, Ptolemy; on screen f9-72, through the big picture to "the Roman"), one in bay IV (to f115,
// "empire makes"), one in bay VI (on screen to f169: it glints and passes on "knowledge", f158). f172-274 ("and then
// the applied technology that comes out of that is") the dolly drifts right and slows into the end chamber, where the
// one plinth that holds anything stands: a small orange aeolipile (Hero's steam toy: firebox, bowl, two pipes holding
// the turning ball with its jets, a breath of steam); keeping it dead ahead the whole way, the camera turns 165 deg
// in one ease (f172-274, peak 2.61 deg/f = ~35 px/f on the far hall; speed never above the dolly's) round its right
// side and comes to rest 2.7 m behind it, settled 15 deg short of straight back down the hall: VI, V, IV ... receding to the
// bright door, shelves and plinths nearly empty, the aeolipile small in the foreground turning slowly. Settled, living
// last frames: dust drifting through the shafts, the device's slow spin, a faint flicker on the few scrolls.
// Orange = knowledge and technology (the clip rule): the five scrolls and the one device, nothing else. Stone cream,
// timber umber, paving sand-umber, all inside the teal air; no people; the only text is the numerals.
//
// DEPTH: metres. F 760 px, a yaw-only pinhole with a vertical lens shift (the eye's row 960 -> 1000 in the dolly, then
// set so the device sits at y ~945 round the orbit). Eye 1.5 m (f0) -> 2.6 m (dolly) -> 2.0 m (rest). Fog by camera
// depth (eye mode): fogNear 2.5, fogVis 22, fogMax 0.9; a little extra veil by height (the ceiling at 9 m lightens
// into the high air). Painter's order: the enclosing room (floor, ceiling, walls, windows, doors), then the hall's Z
// slabs (bays and arches) from the farthest to the camera's own, inside a bay: beams, armaria, plinths, device, shaft,
// dust. Every big face is painted with ONE gradient of its local colour fogged by depth (vertical faces by screen
// column, horizontal faces by screen row: exact for a yaw-only camera), so nothing bands.
//
// SOURCES (illustrative; no figures on screen): Roman libraries kept scrolls in wooden armaria of pigeonholes (the
// Villa of the Papyri, Herculaneum; Trajan's Forum libraries); the bays are the empire's centuries AD I-VI. Galen
// (c. 129-216) and Ptolemy (c. 100-170) are the second-century high points (bay II). Hero of Alexandria's aeolipile
// (Pneumatica, 1st c. AD) is the famous steam toy that led nowhere.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { loadFont as loadCinzel } from "@remotion/google-fonts/Cinzel";
import { ACCENT, AirStage, ORANGE_LINE, c01, hash01, lerp, makeAirView, mixHex, rgbHex, smoothstep, type AirScene, type AirView } from "../kits/dwarkesh-3d/dwarkesh3d";
import {
  ARCH_T,
  ARCH_Z,
  ARCHIVOLT_W,
  ARM,
  ARMARIA,
  BAYS,
  CEIL_Y,
  DEVICE,
  DOOR_Z,
  DOORWAY,
  DURATION,
  END_CHAMBER,
  END_WIN,
  END_Z,
  F,
  FPS,
  IMPOST_Y,
  LIGHT,
  NEAR,
  NUMERALS,
  PIER_X,
  PLAQUE,
  PLINTH,
  PLINTHS,
  SCROLLS,
  WALL_X,
  WIN,
  WINDOW_Z,
  camAt,
  camToScreen,
  cubbyOf,
  project,
  toCam,
  type Armarium,
  type HallCam,
  type V3,
} from "./centuriesHallPlan";

export { DURATION, FPS };
export const schema = z.object({});
export const defaultProps = schema.parse({});

const { fontFamily: cinzel } = loadCinzel("normal", { weights: ["700"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// THE MEDIUM AND THE MATERIALS
// ---------------------------------------------------------------------------
export const SCENE: AirScene = { look: "A", mood: "interior", F, fogNear: 1.0, fogVis: 10, fogMax: 1.16, hLow: 0, hHigh: 9, moteUnit: 1, eyeT: 0.0 };
type Mat = { lit: string; mid: string; dark: string };
const STONE: Mat = { lit: "#DDD0B6", mid: "#C2B395", dark: "#827565" };
const WALLM: Mat = { lit: "#A89884", mid: "#8A7B68", dark: "#5A4F42" };
const PLINTH_M: Mat = { lit: "#BBAB8B", mid: "#978869", dark: "#625645" };
const TIMBER: Mat = { lit: "#A9845C", mid: "#7E5F40", dark: "#46331F" };
const BEAM_M: Mat = { lit: "#93714E", mid: "#6E5237", dark: "#3E2D1E" };
const CUBBY = { back: "#57412C", floor: "#86684A", top: "#3F2F20", side: "#654B33" };
const FLOOR_C = "#8F8064";
const JOINT_C = "#5C503D";
const CEIL_C = "#9C8D76";
const PANE_SUN = "#F4F0E0";
const PANE_SKY = "#C3D5C6";
const DOOR_OUT = "#F1E8D2";
const CREAM = "#F3EBDD";
const SHADOW = "#22180F";
const ORANGE: Mat = { lit: "#FFB000", mid: "#D98A0C", dark: "#9A5C07" };

// ---------------------------------------------------------------------------
// HELPERS: clipping, projection, fog, shading, the one-gradient fills
// ---------------------------------------------------------------------------
type P2 = [number, number];
type Ctx = { c: HallCam; v: AirView; f: number; defs: React.ReactNode[]; n: { i: number } };
const fx = (v: number) => (Number.isFinite(v) ? v.toFixed(2) : "0");
const dPoly = (q: P2[]) => (q.length < 3 ? "" : `M${q.map((p) => `${fx(p[0])},${fx(p[1])}`).join("L")}Z`);
const uidOf = (ctx: Ctx, p: string) => `cl${p}${ctx.n.i++}`;
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot3 = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm3 = (a: V3): V3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** clip a camera-space polygon to z >= NEAR */
const clipNear = (q: V3[]): V3[] => {
  const out: V3[] = [];
  for (let i = 0; i < q.length; i++) {
    const a = q[i];
    const b = q[(i + 1) % q.length];
    const ina = a[2] >= NEAR;
    const inb = b[2] >= NEAR;
    if (ina) out.push(a);
    if (ina !== inb) {
      const t = (NEAR - a[2]) / (b[2] - a[2]);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
    }
  }
  return out;
};
const projPoly = (c: HallCam, P: V3[]): P2[] => clipNear(P.map((p) => toCam(c, p))).map((q) => camToScreen(c, q));
/** clip a 2D polygon by a convex 2D polygon (Sutherland-Hodgman) */
const clip2 = (subject: P2[], clip: P2[]): P2[] => {
  if (subject.length < 3 || clip.length < 3) return [];
  let area = 0;
  for (let i = 0; i < clip.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const sg = area >= 0 ? 1 : -1;
  let out = subject;
  for (let i = 0; i < clip.length && out.length; i++) {
    const a = clip[i];
    const b = clip[(i + 1) % clip.length];
    const side = (p: P2) => sg * ((b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]));
    const inp = out;
    out = [];
    for (let j = 0; j < inp.length; j++) {
      const p = inp[j];
      const q = inp[(j + 1) % inp.length];
      const sp = side(p);
      const sq = side(q);
      if (sp >= 0) out.push(p);
      if (sp >= 0 !== sq >= 0) {
        const t = sp / (sp - sq);
        out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]);
      }
    }
  }
  return out;
};
/** 2D convex hull (monotone chain) */
const hull2 = (pts: P2[]): P2[] => {
  const p = pts.slice().sort((a, b) => (a[0] === b[0] ? a[1] - b[1] : a[0] - b[0]));
  if (p.length < 3) return p;
  const cr = (o: P2, a: P2, b: P2) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: P2[] = [];
  for (const q of p) {
    while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const up: P2[] = [];
  for (let i = p.length - 1; i >= 0; i--) {
    const q = p[i];
    while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop();
    up.push(q);
  }
  lo.pop();
  up.pop();
  return lo.concat(up);
};

/** the medium: fog by camera depth, plus a light veil by height (the high air) */
const fogOf = (ctx: Ctx, d: number) => c01(ctx.v.fogAt(d));
const hVeil = (h: number) => 0.32 * smoothstep(4.5, 9.2, h);
const tone = (ctx: Ctx, hex: string, d: number, h: number) => {
  const fz = 1 - (1 - fogOf(ctx, d)) * (1 - hVeil(h));
  return mixHex(hex, rgbHex(ctx.v.airAt(d, h)), fz);
};
/** orange takes about half the fog (the one glowing material) */
const toneO = (ctx: Ctx, hex: string, d: number, h: number) => mixHex(hex, rgbHex(ctx.v.airAt(d, h)), 0.45 * fogOf(ctx, d));
/** 1 near .. 0 lost in the air (for rims and fine lines) */
const visOf = (ctx: Ctx, d: number) => 1 - fogOf(ctx, d);
/** the light's lambert on a face of normal n, as a local colour between dark and lit */
const shadeN = (m: Mat, n: V3) => {
  const k = -dot3(n, LIGHT);
  return k >= 0 ? mixHex(m.mid, m.lit, Math.min(1, k / 0.7)) : mixHex(m.mid, m.dark, Math.min(1, -k / 0.7) * 0.55);
};
const faceNormal = (P: V3[]) => norm3(cross3(sub3(P[1], P[0]), sub3(P[2], P[0])));
const facing = (c: HallCam, P: V3[], n: V3) => dot3(sub3([c.x, c.y, c.z], P[0]), n) > 0;
const depthAt = (c: HallCam, P: V3) => toCam(c, P)[2];
const centroid = (P: V3[]): V3 => {
  const s: V3 = [0, 0, 0];
  for (const p of P) {
    s[0] += p[0];
    s[1] += p[1];
    s[2] += p[2];
  }
  return [s[0] / P.length, s[1] / P.length, s[2] / P.length];
};

/** a VERTICAL face's fill: one gradient by screen column of its local colour fogged by depth (exact: on a vertical
 *  plane under a yaw-only camera, depth is a function of the screen column) */
const vFill = (ctx: Ctx, P: V3[], local: string | ((d: number) => string), h: number, orange = false): string => {
  const c = ctx.c;
  const n = faceNormal(P);
  const D = norm3([-n[2], 0, n[0]]);
  const P0 = P[0];
  let s0 = Infinity;
  let s1 = -Infinity;
  for (const p of P) {
    const s = (p[0] - P0[0]) * D[0] + (p[2] - P0[2]) * D[2];
    s0 = Math.min(s0, s);
    s1 = Math.max(s1, s);
  }
  const A = toCam(c, [P0[0], h, P0[2]]);
  const B = toCam(c, [P0[0] + D[0], h, P0[2] + D[2]]);
  const ax = A[0];
  const bx = B[0] - A[0];
  const az = A[2];
  const bz = B[2] - A[2];
  const col = (d: number) => {
    const lc = typeof local === "string" ? local : local(d);
    return orange ? toneO(ctx, lc, d, h) : tone(ctx, lc, d, h);
  };
  let lo = s0;
  let hi = s1;
  if (Math.abs(bz) > 1e-9) {
    const sN = (NEAR - az) / bz;
    if (bz > 0) lo = Math.max(lo, sN);
    else hi = Math.min(hi, sN);
  }
  const mid = (lo + hi) / 2;
  const dMid = Math.max(NEAR, az + bz * mid);
  if (hi <= lo) return col(dMid);
  const sxOf = (s: number) => c.px + (F * (ax + bx * s)) / Math.max(1e-6, az + bz * s);
  const xa = sxOf(lo);
  const xb = sxOf(hi);
  const cl = (x: number) => Math.max(-300, Math.min(1380, x));
  const xA = cl(Math.min(xa, xb));
  const xB = cl(Math.max(xa, xb));
  if (xB - xA < 2) return col(dMid);
  const N = 12;
  const stops: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    const x = xA + ((xB - xA) * i) / (N - 1);
    const u = x - c.px;
    const den = u * bz - F * bx;
    const s = Math.abs(den) < 1e-9 ? mid : (F * ax - u * az) / den;
    const d = Math.max(NEAR, az + bz * Math.max(lo, Math.min(hi, s)));
    stops.push(<stop key={i} offset={fx(i / (N - 1))} stopColor={col(d)} />);
  }
  const id = uidOf(ctx, "v");
  ctx.defs.push(
    <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={fx(xA)} y1="0" x2={fx(xB)} y2="0">
      {stops}
    </linearGradient>,
  );
  return `url(#${id})`;
};
/** a HORIZONTAL face's fill at height Y: one gradient by screen row (depth = F (eye - Y) / (row - eye's row)) */
const hFill = (ctx: Ctx, Y: number, q: P2[], local: string | ((d: number) => string)): string => {
  const c = ctx.c;
  const e = c.y - Y;
  const col = (d: number) => tone(ctx, typeof local === "string" ? local : local(d), d, Y);
  let ya = Infinity;
  let yb = -Infinity;
  for (const p of q) {
    ya = Math.min(ya, p[1]);
    yb = Math.max(yb, p[1]);
  }
  const dOf = (y: number) => {
    const dy = y - c.py;
    const d = Math.abs(dy) < 0.5 ? 400 : (F * e) / dy;
    return d > 0 ? Math.min(400, d) : 400;
  };
  const yA = Math.max(-200, ya);
  const yB = Math.min(2120, yb);
  if (yB - yA < 2) return col(dOf((yA + yB) / 2));
  const N = 14;
  const stops: React.ReactNode[] = [];
  for (let i = 0; i < N; i++) {
    // denser stops toward the eye's row, where depth changes fastest
    const t = i / (N - 1);
    const y = e > 0 ? yA + (yB - yA) * Math.pow(t, 2) : yB - (yB - yA) * Math.pow(1 - t, 2);
    stops.push(<stop key={i} offset={fx((y - yA) / (yB - yA))} stopColor={col(dOf(y))} />);
  }
  const id = uidOf(ctx, "h");
  ctx.defs.push(
    <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1="0" y1={fx(yA)} x2="0" y2={fx(yB)}>
      {stops}
    </linearGradient>,
  );
  return `url(#${id})`;
};
/** a flat face: its shade toned at its centroid's depth */
const flatTone = (ctx: Ctx, P: V3[], local: string) => {
  const cc = centroid(P);
  return tone(ctx, local, Math.max(NEAR, depthAt(ctx.c, cc)), cc[1]);
};
/** a world line clipped at the near plane, projected */
const projSeg = (c: HallCam, a: V3, b: V3): [P2, P2] | null => {
  let qa = toCam(c, a);
  let qb = toCam(c, b);
  if (qa[2] < NEAR && qb[2] < NEAR) return null;
  if (qa[2] < NEAR) {
    const t = (NEAR - qa[2]) / (qb[2] - qa[2]);
    qa = [qa[0] + (qb[0] - qa[0]) * t, qa[1] + (qb[1] - qa[1]) * t, NEAR];
  } else if (qb[2] < NEAR) {
    const t = (NEAR - qb[2]) / (qa[2] - qb[2]);
    qb = [qb[0] + (qa[0] - qb[0]) * t, qb[1] + (qa[1] - qb[1]) * t, NEAR];
  }
  return [camToScreen(c, qa), camToScreen(c, qb)];
};
/** a line width (px) for a world width w (m) at depth d, kept within a readable range */
const lwAt = (w: number, d: number, lo = 0.5, hi = 3.2) => Math.max(lo, Math.min(hi, (F * w) / Math.max(0.3, d)));

/** a box's visible faces, flat-shaded by the light and toned at each face's depth (small boxes: plinths, mouldings) */
const boxFaces = (ctx: Ctx, X0: number, X1: number, Y0: number, Y1: number, Z0: number, Z1: number, m: Mat, key: string, rim = 0.5): React.ReactNode[] => {
  const c = ctx.c;
  const out: React.ReactNode[] = [];
  const faces: { P: V3[]; n: V3 }[] = [
    { P: [[X0, Y1, Z0], [X1, Y1, Z0], [X1, Y1, Z1], [X0, Y1, Z1]], n: [0, 1, 0] },
    { P: [[X0, Y0, Z0], [X0, Y0, Z1], [X1, Y0, Z1], [X1, Y0, Z0]], n: [0, -1, 0] },
    { P: [[X0, Y0, Z0], [X1, Y0, Z0], [X1, Y1, Z0], [X0, Y1, Z0]], n: [0, 0, -1] },
    { P: [[X1, Y0, Z1], [X0, Y0, Z1], [X0, Y1, Z1], [X1, Y1, Z1]], n: [0, 0, 1] },
    { P: [[X0, Y0, Z1], [X0, Y0, Z0], [X0, Y1, Z0], [X0, Y1, Z1]], n: [-1, 0, 0] },
    { P: [[X1, Y0, Z0], [X1, Y0, Z1], [X1, Y1, Z1], [X1, Y1, Z0]], n: [1, 0, 0] },
  ];
  faces.forEach((fc, i) => {
    if (!facing(c, fc.P, fc.n)) return;
    const q = projPoly(c, fc.P);
    if (q.length < 3) return;
    const lc = fc.n[1] < -0.5 ? mixHex(m.dark, SHADOW, 0.15) : shadeN(m, fc.n);
    const fill = flatTone(ctx, fc.P, lc);
    out.push(<path key={`${key}f${i}`} d={dPoly(q)} fill={fill} stroke={fill} strokeWidth={0.6} strokeLinejoin="round" />);
  });
  // the cream rim: the top's near edges (where the light catches)
  if (rim > 0 && c.y > Y1) {
    const cc: V3 = [(X0 + X1) / 2, Y1, (Z0 + Z1) / 2];
    const d = Math.max(NEAR, depthAt(c, cc));
    const a = rim * visOf(ctx, d);
    const edges: [V3, V3][] = [];
    if (c.z < Z0) edges.push([[X0, Y1, Z0], [X1, Y1, Z0]]);
    if (c.z > Z1) edges.push([[X0, Y1, Z1], [X1, Y1, Z1]]);
    if (c.x < X0) edges.push([[X0, Y1, Z0], [X0, Y1, Z1]]);
    if (c.x > X1) edges.push([[X1, Y1, Z0], [X1, Y1, Z1]]);
    let dd = "";
    for (const [a3, b3] of edges) {
      const s = projSeg(c, a3, b3);
      if (s) dd += `M${fx(s[0][0])},${fx(s[0][1])}L${fx(s[1][0])},${fx(s[1][1])}`;
    }
    if (dd && a > 0.02) out.push(<path key={`${key}rim`} d={dd} stroke={CREAM} strokeOpacity={a} strokeWidth={lwAt(0.018, d, 0.6, 2.4)} strokeLinecap="round" fill="none" />);
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE LIGHT: the left windows' shafts, the pools they leave on the floor and the patches on the right armaria
// ---------------------------------------------------------------------------
/** a window's opening outline on a wall plane (u along the wall, y up): a rectangle under a semicircle */
const archOutline = (u0: number, hw: number, y0: number, y1: number, nArc = 12): [number, number][] => {
  const yc = y1 - hw;
  const pts: [number, number][] = [
    [u0 - hw, y0],
    [u0 + hw, y0],
  ];
  for (let i = 0; i <= nArc; i++) {
    const a = (i / nArc) * Math.PI;
    pts.push([u0 + hw * Math.cos(a), yc + hw * Math.sin(a)]);
  }
  return pts;
};
/** a left window's four corners (the light's aperture, a rectangle round the arched opening) */
const winCorners = (zw: number): V3[] => [
  [-WALL_X, WIN.y0, zw - WIN.hw],
  [-WALL_X, WIN.y0, zw + WIN.hw],
  [-WALL_X, WIN.y1 - 0.25, zw + WIN.hw],
  [-WALL_X, WIN.y1 - 0.25, zw - WIN.hw],
];
/** where a ray from a window point lands: on the floor or on the right armaria's front plane, whichever first */
const landOf = (p: V3): V3 => {
  const tF = -p[1] / LIGHT[1];
  const tW = (ARM.front - p[0]) / LIGHT[0];
  const t = Math.min(tF, tW);
  return [p[0] + LIGHT[0] * t, p[1] + LIGHT[1] * t, p[2] + LIGHT[2] * t];
};
/** the pool on the floor (Y 0) of a window: its corners carried along the light to Y = 0, clipped to the aisle */
const poolOf = (zw: number): V3[] => {
  const q = winCorners(zw).map((p) => {
    const t = -p[1] / LIGHT[1];
    return [p[0] + LIGHT[0] * t, p[2] + LIGHT[2] * t] as P2;
  });
  const cl = clip2(q, [
    [-ARM.front, -5],
    [ARM.front, -5],
    [ARM.front, 50],
    [-ARM.front, 50],
  ]);
  return cl.map((p): V3 => [p[0], 0, p[1]]);
};
/** the patch on the right armaria's front plane: corners carried to X = ARM.front, clipped to Y >= 0 */
const patchOf = (zw: number): V3[] => {
  const q = winCorners(zw).map((p) => {
    const t = (ARM.front - p[0]) / LIGHT[0];
    return [p[2] + LIGHT[2] * t, p[1] + LIGHT[1] * t] as P2;
  });
  const cl = clip2(q, [
    [-5, 0],
    [50, 0],
    [50, ARM.cornice],
    [-5, ARM.cornice],
  ]);
  return cl.map((p): V3 => [ARM.front, p[1], p[0]]);
};
/** is a world point inside a left window's shaft? (trace it back along the light to the wall) */
const inShaft = (p: V3) => {
  const t = (p[0] + WALL_X) / LIGHT[0];
  if (t < 0) return 0;
  const y = p[1] - LIGHT[1] * t;
  const zq = p[2] - LIGHT[2] * t;
  if (y < WIN.y0 || y > WIN.y1 - 0.25) return 0;
  // the landing (floor / armaria) ends the shaft
  if (p[1] < 0 || p[0] > ARM.front) return 0;
  let best = 0;
  for (const zw of WINDOW_Z) {
    const u = Math.abs(zq - zw) / WIN.hw;
    if (u < 1) best = Math.max(best, 1 - Math.pow(u, 4));
  }
  return best * smoothstep(WIN.y0, WIN.y0 + 0.4, y) * (1 - smoothstep(WIN.y1 - 0.65, WIN.y1 - 0.25, y));
};
/** soft-edged light on a planar polygon: nested insets toward its centroid, each faint */
const softPatch = (c: HallCam, P: V3[], color: string, alpha: number, key: string) => {
  if (P.length < 3) return null;
  const cc = centroid(P);
  const out: React.ReactNode[] = [];
  [1.12, 1.04, 0.96, 0.88, 0.8, 0.72, 0.64, 0.56, 0.48].forEach((s, i) => {
    const Q = P.map((p): V3 => [cc[0] + (p[0] - cc[0]) * s, cc[1] + (p[1] - cc[1]) * s, cc[2] + (p[2] - cc[2]) * s]);
    const q = projPoly(c, Q);
    if (q.length >= 3) out.push(<path key={`${key}${i}`} d={dPoly(q)} fill={color} fillOpacity={alpha * 0.45} />);
  });
  return <g key={key}>{out}</g>;
};

/** a window's shaft through the air: the convex hull of its prism (clipped at the lens), a cream veil fading from
 *  the window to the floor, and faded out as the camera comes close to it (it passes through every shaft) */
const Shaft = (ctx: Ctx, zw: number, key: string): React.ReactNode => {
  const c = ctx.c;
  const W = winCorners(zw);
  const Lp = W.map(landOf);
  const all = [...W, ...Lp].map((p) => toCam(c, p));
  const pts: V3[] = all.filter((q) => q[2] >= NEAR);
  const edges: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 0],
    [4, 5],
    [5, 6],
    [6, 7],
    [7, 4],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ];
  for (const [i, j] of edges) {
    const a = all[i];
    const b = all[j];
    if (a[2] >= NEAR !== b[2] >= NEAR) {
      const t = (NEAR - a[2]) / (b[2] - a[2]);
      pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, NEAR]);
    }
  }
  if (pts.length < 3) return null;
  const hq = hull2(pts.map((q) => camToScreen(c, q)));
  if (hq.length < 3) return null;
  // the camera's distance to the shaft's axis (window centre -> landing centre)
  const A = centroid(W);
  const B = centroid(Lp);
  const AB = sub3(B, A);
  const t = c01(dot3(sub3([c.x, c.y, c.z], A), AB) / dot3(AB, AB));
  const Q: V3 = [A[0] + AB[0] * t, A[1] + AB[1] * t, A[2] + AB[2] * t];
  const dist = Math.hypot(c.x - Q[0], c.y - Q[1], c.z - Q[2]);
  const dA = Math.max(NEAR, depthAt(c, centroid([...W, ...Lp])));
  // fade as any corner of the prism comes near the lens plane (its clipped hull would wash the frame)
  const minZ = Math.min(...all.map((q) => q[2]));
  const a = smoothstep(0.7, 3.0, dist) * smoothstep(0.0, 2.2, minZ) * (0.35 + 0.65 * visOf(ctx, dA)) * (0.92 + 0.08 * Math.sin(ctx.f * 0.031 + zw));
  if (a < 0.01) return null;
  const sa = project(c, A);
  const sb = project(c, B);
  const okA = toCam(c, A)[2] > NEAR;
  const okB = toCam(c, B)[2] > NEAR;
  const g0 = okA ? sa : hq[0];
  const g1 = okB ? sb : hq[Math.floor(hq.length / 2)];
  const id = uidOf(ctx, "sh");
  ctx.defs.push(
    <linearGradient key={id} id={id} gradientUnits="userSpaceOnUse" x1={fx(g0[0])} y1={fx(g0[1])} x2={fx(g1[0])} y2={fx(g1[1])}>
      <stop offset="0" stopColor={CREAM} stopOpacity={0.3 * a} />
      <stop offset="0.5" stopColor={CREAM} stopOpacity={0.15 * a} />
      <stop offset="1" stopColor={CREAM} stopOpacity={0.05 * a} />
    </linearGradient>,
  );
  const bid = uidOf(ctx, "sb");
  ctx.defs.push(
    <filter key={bid} id={bid} x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation={9} />
    </filter>,
  );
  return <path key={key} d={dPoly(hq)} fill={`url(#${id})`} filter={`url(#${bid})`} style={{ mixBlendMode: "screen" }} />;
};

// ---------------------------------------------------------------------------
// THE ROOM: floor (paving, pools, contact shade), ceiling, the side walls with their windows, the door and end walls
// ---------------------------------------------------------------------------
const STRING_Y = 4.62;
const Room = (ctx: Ctx): React.ReactNode[] => {
  const c = ctx.c;
  const out: React.ReactNode[] = [];
  // the floor: one plane, one gradient (a little darker near), the paving joints fading with the fog
  const floorP: V3[] = [
    [-WALL_X, 0, DOOR_Z],
    [WALL_X, 0, DOOR_Z],
    [WALL_X, 0, END_Z],
    [-WALL_X, 0, END_Z],
  ];
  const fq = projPoly(c, floorP);
  out.push(<path key="floor" d={dPoly(fq)} fill={hFill(ctx, 0, fq, (d) => mixHex(FLOOR_C, SHADOW, 0.2 * c01((4.5 - d) / 3.5)))} />);
  // joints: lines along the hall (every 1.2 m across) and across it (every 1.2 m, staggered by course)
  const bins: Record<number, string> = {};
  const add = (a: V3, b: V3) => {
    const s = projSeg(c, a, b);
    if (!s) return;
    const dm = Math.max(NEAR, depthAt(c, [(a[0] + b[0]) / 2, 0, (a[2] + b[2]) / 2]));
    const fb = Math.round(c01(1.25 * fogOf(ctx, dm)) * 10);
    if (fb >= 10) return;
    const wb = Math.round(Math.min(3, Math.max(0, (F * 0.022) / dm)) * 4);
    const k = fb * 100 + wb;
    bins[k] = (bins[k] ?? "") + `M${fx(s[0][0])},${fx(s[0][1])}L${fx(s[1][0])},${fx(s[1][1])}`;
  };
  const STEP = 1.2;
  for (let X = -WALL_X + STEP; X < WALL_X - 0.01; X += STEP) {
    for (let Z = DOOR_Z; Z < END_Z; Z += 2.4) add([X, 0, Z], [X, 0, Math.min(END_Z, Z + 2.4)]);
  }
  for (let j = 0; DOOR_Z + j * STEP < END_Z; j++) {
    const Z = DOOR_Z + j * STEP;
    for (let X = -WALL_X; X < WALL_X - 0.01; X += STEP) {
      // stagger: alternate courses offset half a slab (drawn as half-slab pieces)
      const off = j % 2 === 0 ? 0 : STEP / 2;
      const xa = Math.max(-WALL_X, X - off);
      const xb = Math.min(WALL_X, X - off + STEP);
      if (xb > xa) add([xa, 0, Z], [xb, 0, Z]);
    }
  }
  // each near slab its own faint tint (stone paving, not one flat slab); by fog bins, light and dark
  const tints: Record<string, string> = {};
  for (let j = 0; DOOR_Z + j * STEP < END_Z; j++) {
    const Za = DOOR_Z + j * STEP;
    const Zb = Math.min(END_Z, Za + STEP);
    const off = j % 2 === 0 ? 0 : STEP / 2;
    for (let i = -1; i < 7; i++) {
      const xa = Math.max(-WALL_X, -WALL_X + i * STEP - off);
      const xb = Math.min(WALL_X, -WALL_X + (i + 1) * STEP - off);
      if (xb <= xa) continue;
      const P: V3[] = [
        [xa, 0, Za],
        [xb, 0, Za],
        [xb, 0, Zb],
        [xa, 0, Zb],
      ];
      const dm = depthAt(c, centroid(P));
      if (dm < -1 || dm > 14) continue;
      const q = projPoly(c, P);
      if (q.length < 3) continue;
      const r = hash01(j * 31.7 + i * 7.1 + 3.3);
      const light = r > 0.5;
      const amt = Math.round((Math.abs(r - 0.5) * 2) * 3);
      if (amt === 0) continue;
      const k = `${light ? "l" : "d"}${amt}${Math.round(c01(fogOf(ctx, Math.max(NEAR, dm)) * 1.4) * 4)}`;
      tints[k] = (tints[k] ?? "") + dPoly(q);
    }
  }
  Object.entries(tints).forEach(([k, d]) => {
    const amt = Number(k[1]);
    const fb = Number(k[2]) / 4;
    out.push(<path key={`tn${k}`} d={d} fill={k[0] === "l" ? "#B8A684" : "#4A3E2E"} fillOpacity={0.07 * amt * (1 - fb)} />);
  });
  Object.entries(bins).forEach(([k, d]) => {
    const fb = Math.floor(Number(k) / 100) / 10;
    const w = (Number(k) % 100) / 4;
    out.push(<path key={`jt${k}`} d={d} stroke={tone(ctx, JOINT_C, 6 + 30 * fb, 0)} strokeOpacity={0.62 * (1 - fb)} strokeWidth={Math.max(0.6, w)} fill="none" strokeLinecap="round" />);
  });
  // contact shade along the armaria's feet and the piers' feet (soft, two steps)
  for (const a of ARMARIA) {
    const X = a.side * ARM.front;
    for (const [wd, al] of [
      [0.42, 0.1],
      [0.18, 0.16],
    ] as const) {
      const P: V3[] = [
        [X, 0, a.z0],
        [X, 0, a.z1],
        [X - a.side * wd, 0, a.z1],
        [X - a.side * wd, 0, a.z0],
      ];
      const q = projPoly(c, P);
      if (q.length >= 3) out.push(<path key={`ao${a.id}${wd}`} d={dPoly(q)} fill={SHADOW} fillOpacity={al * visOf(ctx, Math.max(NEAR, depthAt(c, centroid(P))))} />);
    }
  }
  // the pools of window light on the floor
  WINDOW_Z.forEach((zw, i) => {
    const P = poolOf(zw);
    const d = Math.max(NEAR, depthAt(c, centroid(P)));
    const el = softPatch(c, P, CREAM, 0.12 * (0.4 + 0.6 * visOf(ctx, d)), `pool${i}`);
    if (el) out.push(el);
  });
  // the ceiling (a plaster plane high in the light air)
  const ceilP: V3[] = [
    [-WALL_X, CEIL_Y, DOOR_Z],
    [-WALL_X, CEIL_Y, END_Z],
    [WALL_X, CEIL_Y, END_Z],
    [WALL_X, CEIL_Y, DOOR_Z],
  ];
  const cq = projPoly(c, ceilP);
  out.push(<path key="ceil" d={dPoly(cq)} fill={hFill(ctx, CEIL_Y, cq, CEIL_C)} />);
  // the side walls: a lower and an upper band (a string course between), the upper one pierced by the windows
  for (const s of [-1, 1] as const) {
    const X = s * WALL_X;
    const n: V3 = [-s, 0, 0];
    const wallMat = mixHex(shadeN(WALLM, n), WALLM.mid, 0.25);
    const lower: V3[] =
      s < 0
        ? [
            [X, 0, END_Z],
            [X, 0, DOOR_Z],
            [X, STRING_Y, DOOR_Z],
            [X, STRING_Y, END_Z],
          ]
        : [
            [X, 0, DOOR_Z],
            [X, 0, END_Z],
            [X, STRING_Y, END_Z],
            [X, STRING_Y, DOOR_Z],
          ];
    const upper: V3[] = lower.map((p): V3 => [p[0], p[1] < 1 ? STRING_Y : CEIL_Y, p[2]]);
    const lq = projPoly(c, lower);
    out.push(<path key={`wl${s}`} d={dPoly(lq)} fill={vFill(ctx, lower, wallMat, 2.2)} />);
    // the upper band with the windows as holes
    let holes = "";
    const wins: { reveal: P2[]; pane: P2[]; zw: number; d: number }[] = [];
    WINDOW_Z.forEach((zw) => {
      const ol = archOutline(zw, WIN.hw, WIN.y0, WIN.y1);
      const inner = projPoly(
        c,
        ol.map(([u, y]): V3 => [X, y, u]),
      );
      if (inner.length < 3) return;
      holes += dPoly(inner);
      const outer = projPoly(
        c,
        ol.map(([u, y]): V3 => [X + s * WIN.depth, y, u]),
      );
      wins.push({ reveal: inner, pane: clip2(outer, inner), zw, d: Math.max(NEAR, depthAt(c, [X, 6.5, zw])) });
    });
    const uq = projPoly(c, upper);
    out.push(<path key={`wu${s}`} d={dPoly(uq) + holes} fillRule="evenodd" fill={vFill(ctx, upper, mixHex(wallMat, WALLM.lit, 0.12), 6.8)} />);
    // the string course (a lit upper edge, a shadow line under it)
    const sc = projSeg(c, [X, STRING_Y, DOOR_Z], [X, STRING_Y, END_Z]);
    if (sc) {
      const dd = `M${fx(sc[0][0])},${fx(sc[0][1])}L${fx(sc[1][0])},${fx(sc[1][1])}`;
      out.push(<path key={`sc${s}`} d={dd} stroke={tone(ctx, WALLM.dark, 8, STRING_Y)} strokeOpacity={0.5} strokeWidth={2} fill="none" />);
    }
    // the windows: the reveal (the wall's thickness, lit stone), the pane of outside light, a soft glow round it
    wins.forEach((w, i) => {
      const fz = fogOf(ctx, w.d);
      out.push(<path key={`rv${s}${i}`} d={dPoly(w.reveal)} fill={tone(ctx, s < 0 ? WALLM.mid : WALLM.lit, w.d, 6.5)} />);
      if (w.pane.length >= 3) out.push(<path key={`pn${s}${i}`} d={dPoly(w.pane)} fill={mixHex(s < 0 ? PANE_SUN : PANE_SKY, rgbHex(ctx.v.airAt(w.d, 7)), 0.55 * fz)} />);
      const cq2 = project(c, [X, 6.6, w.zw]);
      const r = (F * 1.9) / w.d;
      const zg = toCam(c, [X, 6.6, w.zw])[2];
      if (zg > 0.8 && r > 4) {
        const gid = uidOf(ctx, "wg");
        ctx.defs.push(
          <radialGradient key={gid} id={gid}>
            <stop offset="0" stopColor={CREAM} stopOpacity={(s < 0 ? 0.2 : 0.08) * (1 - 0.6 * fz) * smoothstep(0.8, 4.5, zg)} />
            <stop offset="1" stopColor={CREAM} stopOpacity={0} />
          </radialGradient>,
        );
        out.push(<ellipse key={`wgl${s}${i}`} cx={fx(cq2[0])} cy={fx(cq2[1])} rx={fx(r)} ry={fx(r * 1.4)} fill={`url(#${gid})`} style={{ mixBlendMode: "screen" }} />);
      }
    });
  }
  // the door wall (bright doorway) and the end wall (a tall window)
  for (const [Z, nz] of [
    [DOOR_Z, 1],
    [END_Z, -1],
  ] as const) {
    const P: V3[] =
      nz > 0
        ? [
            [WALL_X, 0, Z],
            [-WALL_X, 0, Z],
            [-WALL_X, CEIL_Y, Z],
            [WALL_X, CEIL_Y, Z],
          ]
        : [
            [-WALL_X, 0, Z],
            [WALL_X, 0, Z],
            [WALL_X, CEIL_Y, Z],
            [-WALL_X, CEIL_Y, Z],
          ];
    if (!facing(c, P, [0, 0, nz])) continue;
    const q = projPoly(c, P);
    if (q.length < 3) continue;
    const ol = nz > 0 ? archOutline(0, DOORWAY.hw, 0, DOORWAY.h + DOORWAY.hw, 10) : archOutline(0, END_WIN.hw, END_WIN.y0, END_WIN.y1, 12);
    const hole = projPoly(
      c,
      ol.map(([u, y]): V3 => [u, y, Z]),
    );
    const d = Math.max(NEAR, depthAt(c, [0, 4, Z]));
    out.push(<path key={`ew${Z}`} d={dPoly(q) + dPoly(hole)} fillRule="evenodd" fill={vFill(ctx, P, WALLM.mid, 4)} />);
    if (hole.length >= 3) {
      const outside = nz > 0 ? DOOR_OUT : PANE_SUN;
      out.push(<path key={`eh${Z}`} d={dPoly(hole)} fill={mixHex(outside, rgbHex(ctx.v.airAt(d, 3)), 0.5 * fogOf(ctx, d))} />);
      const hz3 = toCam(c, [0, nz > 0 ? 2.8 : 5.5, Z]);
      const hc = camToScreen(c, hz3);
      const r = (F * 3.6) / Math.max(1, hz3[2]);
      const ga = smoothstep(1.5, 5, hz3[2]);
      const gid = uidOf(ctx, "dg");
      ctx.defs.push(
        <radialGradient key={gid} id={gid}>
          <stop offset="0" stopColor={CREAM} stopOpacity={0.16 * ga} />
          <stop offset="1" stopColor={CREAM} stopOpacity={0} />
        </radialGradient>,
      );
      out.push(<ellipse key={`egl${Z}`} cx={fx(hc[0])} cy={fx(hc[1])} rx={fx(r)} ry={fx(r * 1.2)} fill={`url(#${gid})`} style={{ mixBlendMode: "screen" }} />);
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE ARCHES: piers, the arch ring (voussoirs seen from below), the archivolt, the numeral plaque on each face
// ---------------------------------------------------------------------------
const NA = 20;
const openingXY = (): [number, number][] => {
  const pts: [number, number][] = [[-PIER_X, 0]];
  for (let i = 0; i <= NA; i++) {
    const a = Math.PI - (i / NA) * Math.PI;
    pts.push([PIER_X * Math.cos(a), IMPOST_Y + PIER_X * Math.sin(a)]);
  }
  pts.push([PIER_X, 0]);
  return pts;
};
const OPENING = openingXY();
const Arch = (ctx: Ctx, k: number): React.ReactNode[] => {
  const c = ctx.c;
  const Za = ARCH_Z[k];
  const zf = Za - ARCH_T / 2;
  const zb = Za + ARCH_T / 2;
  const out: React.ReactNode[] = [];
  const dA = Math.max(NEAR, depthAt(c, [0, 4, Za]));
  // the soffit: the piers' inner faces and the ring's voussoirs (flat, shaded by their normals)
  for (const s of [-1, 1] as const) {
    const X = s * PIER_X;
    const n: V3 = [-s, 0, 0];
    const P: V3[] = s < 0 ? [[X, 0, zb], [X, 0, zf], [X, IMPOST_Y, zf], [X, IMPOST_Y, zb]] : [[X, 0, zf], [X, 0, zb], [X, IMPOST_Y, zb], [X, IMPOST_Y, zf]];
    if (!facing(c, P, n)) continue;
    const q = projPoly(c, P);
    if (q.length >= 3) out.push(<path key={`pi${s}`} d={dPoly(q)} fill={vFill(ctx, P, shadeN(STONE, n), 1.7)} />);
  }
  let joints = "";
  for (let i = 0; i < NA; i++) {
    const a0 = Math.PI - (i / NA) * Math.PI;
    const a1 = Math.PI - ((i + 1) / NA) * Math.PI;
    const p0: [number, number] = [PIER_X * Math.cos(a0), IMPOST_Y + PIER_X * Math.sin(a0)];
    const p1: [number, number] = [PIER_X * Math.cos(a1), IMPOST_Y + PIER_X * Math.sin(a1)];
    const am = (a0 + a1) / 2;
    const n: V3 = [-Math.cos(am), -Math.sin(am), 0];
    const P: V3[] = [
      [p0[0], p0[1], zf],
      [p1[0], p1[1], zf],
      [p1[0], p1[1], zb],
      [p0[0], p0[1], zb],
    ];
    if (!facing(c, P, n)) continue;
    const q = projPoly(c, P);
    if (q.length < 3) continue;
    const lc = mixHex(shadeN(STONE, n), STONE.dark, 0.18);
    const fill = flatTone(ctx, P, lc);
    out.push(<path key={`vs${i}`} d={dPoly(q)} fill={fill} stroke={fill} strokeWidth={0.7} />);
    if (i % 2 === 1) {
      const sj = projSeg(c, [p1[0], p1[1], zf], [p1[0], p1[1], zb]);
      if (sj) joints += `M${fx(sj[0][0])},${fx(sj[0][1])}L${fx(sj[1][0])},${fx(sj[1][1])}`;
    }
  }
  if (joints) out.push(<path key="vj" d={joints} stroke={tone(ctx, STONE.dark, dA, 5)} strokeOpacity={0.4} strokeWidth={lwAt(0.02, dA, 0.5, 2)} fill="none" />);
  // the face toward the camera (the one seen), with the opening as a hole
  const front = c.z < zf;
  const back = c.z > zb;
  if (!front && !back) return out;
  const zF = front ? zf : zb;
  const nz = front ? -1 : 1;
  const sgn = front ? 1 : -1; // the viewer's right on this face is +X (front) or -X (back)
  const outer: V3[] = [
    [-WALL_X, 0, zF],
    [WALL_X, 0, zF],
    [WALL_X, CEIL_Y, zF],
    [-WALL_X, CEIL_Y, zF],
  ];
  const oq = projPoly(c, outer);
  const hq = projPoly(
    c,
    OPENING.map(([x, y]): V3 => [x, y, zF]),
  );
  const faceCol = shadeN(STONE, [0, 0, nz]);
  out.push(<path key="face" d={dPoly(oq) + dPoly(hq)} fillRule="evenodd" fill={vFill(ctx, outer, faceCol, 4.5)} />);
  // the archivolt: a raised band round the opening (lit above, a shadow line inside), and the impost blocks
  const zr = zF + nz * 0.05;
  const ring: V3[] = [];
  for (let i = 0; i <= NA; i++) {
    const a = Math.PI - (i / NA) * Math.PI;
    ring.push([(PIER_X + ARCHIVOLT_W) * Math.cos(a), IMPOST_Y + (PIER_X + ARCHIVOLT_W) * Math.sin(a), zr]);
  }
  for (let i = NA; i >= 0; i--) {
    const a = Math.PI - (i / NA) * Math.PI;
    ring.push([PIER_X * Math.cos(a), IMPOST_Y + PIER_X * Math.sin(a), zr]);
  }
  const rq = projPoly(c, ring);
  if (rq.length >= 3) out.push(<path key="avf" d={dPoly(rq)} fill={tone(ctx, mixHex(faceCol, STONE.lit, 0.45), dA, 5)} />);
  const vis = visOf(ctx, dA);
  let rimD = "";
  for (let i = 0; i < NA; i++) {
    const a0 = Math.PI - (i / NA) * Math.PI;
    const a1 = Math.PI - ((i + 1) / NA) * Math.PI;
    const R = PIER_X + ARCHIVOLT_W;
    const sg = projSeg(c, [R * Math.cos(a0), IMPOST_Y + R * Math.sin(a0), zr], [R * Math.cos(a1), IMPOST_Y + R * Math.sin(a1), zr]);
    if (sg) rimD += `M${fx(sg[0][0])},${fx(sg[0][1])}L${fx(sg[1][0])},${fx(sg[1][1])}`;
  }
  if (rimD) out.push(<path key="avr" d={rimD} stroke={CREAM} strokeOpacity={0.55 * vis} strokeWidth={lwAt(0.03, dA, 0.7, 3)} fill="none" strokeLinecap="round" />);
  for (const s of [-1, 1] as const) {
    const x0 = s * PIER_X;
    const x1 = s * (PIER_X + 0.42);
    const ib: V3[] = [
      [Math.min(x0, x1), IMPOST_Y - 0.22, zr],
      [Math.max(x0, x1), IMPOST_Y - 0.22, zr],
      [Math.max(x0, x1), IMPOST_Y, zr],
      [Math.min(x0, x1), IMPOST_Y, zr],
    ];
    const iq = projPoly(c, ib);
    if (iq.length >= 3) out.push(<path key={`ib${s}`} d={dPoly(iq)} fill={tone(ctx, mixHex(faceCol, STONE.lit, 0.4), dA, IMPOST_Y)} />);
    const tl = projSeg(c, [Math.min(x0, x1), IMPOST_Y, zr], [Math.max(x0, x1), IMPOST_Y, zr]);
    if (tl) out.push(<path key={`ibr${s}`} d={`M${fx(tl[0][0])},${fx(tl[0][1])}L${fx(tl[1][0])},${fx(tl[1][1])}`} stroke={CREAM} strokeOpacity={0.5 * vis} strokeWidth={lwAt(0.025, dA, 0.6, 2.5)} />);
  }
  // the plaque with its numeral (carved: a deep shade in the cut, a lit lower edge), on the seen face
  const zp = zF + nz * PLAQUE.out;
  const pl: V3[] = [
    [-PLAQUE.hw, PLAQUE.y - PLAQUE.hh, zp],
    [PLAQUE.hw, PLAQUE.y - PLAQUE.hh, zp],
    [PLAQUE.hw, PLAQUE.y + PLAQUE.hh, zp],
    [-PLAQUE.hw, PLAQUE.y + PLAQUE.hh, zp],
  ];
  const pq = projPoly(c, pl);
  const dP = Math.max(NEAR, depthAt(c, [0, PLAQUE.y, zp]));
  if (pq.length >= 3) {
    // its underside (seen from below: a thin shadow) and its face
    const under: V3[] = [
      [-PLAQUE.hw, PLAQUE.y - PLAQUE.hh, zF],
      [PLAQUE.hw, PLAQUE.y - PLAQUE.hh, zF],
      [PLAQUE.hw, PLAQUE.y - PLAQUE.hh, zp],
      [-PLAQUE.hw, PLAQUE.y - PLAQUE.hh, zp],
    ];
    const uq = projPoly(c, under);
    if (uq.length >= 3) out.push(<path key="plu" d={dPoly(uq)} fill={tone(ctx, STONE.dark, dP, PLAQUE.y)} />);
    out.push(<path key="plf" d={dPoly(pq)} fill={tone(ctx, mixHex(faceCol, STONE.lit, 0.5), dP, PLAQUE.y)} />);
    const inset = pl.map((p): V3 => [p[0] * 0.9, PLAQUE.y + (p[1] - PLAQUE.y) * 0.84, zp]);
    const iq = projPoly(c, inset);
    if (iq.length >= 3) out.push(<path key="pli" d={dPoly(iq)} fill="none" stroke={tone(ctx, STONE.dark, dP, PLAQUE.y)} strokeOpacity={0.55} strokeWidth={lwAt(0.022, dP, 0.6, 2.4)} />);
    const top = projSeg(c, pl[3], pl[2]);
    if (top) out.push(<path key="plr" d={`M${fx(top[0][0])},${fx(top[0][1])}L${fx(top[1][0])},${fx(top[1][1])}`} stroke={CREAM} strokeOpacity={0.6 * visOf(ctx, dP)} strokeWidth={lwAt(0.03, dP, 0.7, 3)} />);
    // the numeral: an affine map of the plaque's local frame (cm) at its centre
    const O: V3 = [0, PLAQUE.y, zp];
    const qO = toCam(c, O);
    if (qO[2] > 0.6) {
      const so = project(c, O);
      const sr = project(c, [sgn * 0.5, PLAQUE.y, zp]);
      const sd = project(c, [0, PLAQUE.y - 0.5, zp]);
      const a = (sr[0] - so[0]) / 50;
      const b = (sr[1] - so[1]) / 50;
      const cc = (sd[0] - so[0]) / 50;
      const dd = (sd[1] - so[1]) / 50;
      const fs = (PLAQUE.cap * 100) / 0.7;
      const tr = `matrix(${a.toFixed(5)},${b.toFixed(5)},${cc.toFixed(5)},${dd.toFixed(5)},${fx(so[0])},${fx(so[1])})`;
      const txt = NUMERALS[k];
      const ty = (PLAQUE.cap * 100) / 2;
      out.push(
        <g key="num" transform={tr}>
          <text x={0} y={ty + 2.4} textAnchor="middle" fontFamily={cinzel} fontWeight={700} fontSize={fs} fill={CREAM} fillOpacity={0.55 * visOf(ctx, dP)} letterSpacing={6}>
            {txt}
          </text>
          <text x={0} y={ty} textAnchor="middle" fontFamily={cinzel} fontWeight={700} fontSize={fs} fill={tone(ctx, mixHex(STONE.dark, SHADOW, 0.35), dP, PLAQUE.y)} letterSpacing={6}>
            {txt}
          </text>
        </g>,
      );
    }
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE ARMARIA: the cubbies (each one's visible inner faces, clipped to its opening), the few scrolls, the frame,
// the cornice, the window light's patch (right side)
// ---------------------------------------------------------------------------
const SCROLL_R = 0.1;
const Armarium_ = (ctx: Ctx, a: Armarium): React.ReactNode[] => {
  const c = ctx.c;
  const out: React.ReactNode[] = [];
  const s = a.side;
  const Xf = s * ARM.front;
  const Xb = s * (ARM.front + ARM.depth);
  const nF: V3 = [-s, 0, 0];
  // the cabinet's ends (seen when the camera is beyond them)
  for (const [Z, nz] of [
    [a.z0, -1],
    [a.z1, 1],
  ] as const) {
    if ((nz < 0 && c.z < Z) || (nz > 0 && c.z > Z)) {
      const P: V3[] = [
        [Xf, 0, Z],
        [s * WALL_X, 0, Z],
        [s * WALL_X, ARM.cornice, Z],
        [Xf, ARM.cornice, Z],
      ];
      const q = projPoly(c, P);
      if (q.length >= 3) out.push(<path key={`end${Z}`} d={dPoly(q)} fill={flatTone(ctx, P, mixHex(TIMBER.mid, TIMBER.dark, 0.25))} />);
    }
  }
  const frontP: V3[] =
    s > 0
      ? [
          [Xf, 0, a.z0],
          [Xf, 0, a.z1],
          [Xf, ARM.top, a.z1],
          [Xf, ARM.top, a.z0],
        ]
      : [
          [Xf, 0, a.z1],
          [Xf, 0, a.z0],
          [Xf, ARM.top, a.z0],
          [Xf, ARM.top, a.z1],
        ];
  const fq = projPoly(c, frontP);
  if (fq.length < 3) return out;
  // the cubbies' interiors, accumulated by face class
  const cls: Record<"back" | "floor" | "top" | "side", string> = { back: "", floor: "", top: "", side: "" };
  const openings: string[] = [];
  const scrollEls: React.ReactNode[] = [];
  for (let col = 0; col < a.cols; col++) {
    for (let row = 0; row < ARM.rows; row++) {
      const cb = cubbyOf(a, col, row);
      const op: V3[] = [
        [Xf, cb.y0, cb.z0],
        [Xf, cb.y0, cb.z1],
        [Xf, cb.y1, cb.z1],
        [Xf, cb.y1, cb.z0],
      ];
      const oq = projPoly(c, op);
      if (oq.length < 3) continue;
      openings.push(dPoly(oq));
      const faces: { k: "back" | "floor" | "top" | "side"; P: V3[]; vis: boolean }[] = [
        { k: "back", P: op.map((p): V3 => [Xb, p[1], p[2]]), vis: true },
        { k: "floor", P: [[Xf, cb.y0, cb.z0], [Xf, cb.y0, cb.z1], [Xb, cb.y0, cb.z1], [Xb, cb.y0, cb.z0]], vis: c.y > cb.y0 },
        { k: "top", P: [[Xf, cb.y1, cb.z0], [Xf, cb.y1, cb.z1], [Xb, cb.y1, cb.z1], [Xb, cb.y1, cb.z0]], vis: c.y < cb.y1 },
        { k: "side", P: [[Xf, cb.y0, cb.z0], [Xb, cb.y0, cb.z0], [Xb, cb.y1, cb.z0], [Xf, cb.y1, cb.z0]], vis: c.z > cb.z0 },
        { k: "side", P: [[Xf, cb.y0, cb.z1], [Xb, cb.y0, cb.z1], [Xb, cb.y1, cb.z1], [Xf, cb.y1, cb.z1]], vis: c.z < cb.z1 },
      ];
      for (const fc of faces) {
        if (!fc.vis) continue;
        const q = clip2(projPoly(c, fc.P), oq);
        if (q.length >= 3) cls[fc.k] += dPoly(q);
      }
      // the scrolls that exist (a handful in the hall)
      const sc = SCROLLS.find((x) => x.arm === a.id && x.col === col && x.row === row);
      if (sc) scrollEls.push(...ScrollPile(ctx, a, cb, sc.n, oq, `${a.id}${col}${row}`));
    }
  }
  const fill = (lc: string) => vFill(ctx, frontP, lc, 2);
  out.push(<path key="cb" d={cls.back} fill={fill(CUBBY.back)} />);
  out.push(<path key="cf" d={cls.floor} fill={fill(CUBBY.floor)} />);
  out.push(<path key="ct" d={cls.top} fill={fill(CUBBY.top)} />);
  out.push(<path key="cs" d={cls.side} fill={fill(CUBBY.side)} />);
  out.push(...scrollEls);
  // the frame: the front with every opening as a hole
  out.push(<path key="fr" d={dPoly(fq) + openings.join("")} fillRule="evenodd" fill={fill(shadeN(TIMBER, nF))} />);
  // the frame's lit edges: the tops of the dividers catch the light (fine cream lines, fading with the fog)
  const dA = Math.max(NEAR, depthAt(c, centroid(frontP)));
  let rims = "";
  for (let row = 0; row <= ARM.rows; row++) {
    const y = row === ARM.rows ? ARM.top : cubbyOf(a, 0, row).y0;
    const sg = projSeg(c, [Xf, y, a.z0], [Xf, y, a.z1]);
    if (sg) rims += `M${fx(sg[0][0])},${fx(sg[0][1])}L${fx(sg[1][0])},${fx(sg[1][1])}`;
  }
  if (rims) out.push(<path key="rims" d={rims} stroke={CREAM} strokeOpacity={(s > 0 ? 0.2 : 0.1) * visOf(ctx, dA)} strokeWidth={lwAt(0.012, dA, 0.5, 1.6)} fill="none" />);
  // the cornice (a moulded box projecting over the front)
  out.push(...boxFaces(ctx, s > 0 ? ARM.front - 0.12 : -WALL_X, s > 0 ? WALL_X : -(ARM.front - 0.12), ARM.top, ARM.cornice, a.z0 - 0.08, a.z1 + 0.08, TIMBER, `${a.id}cor`, 0.45));
  // the window light falling on the right armaria (soft patches on the front)
  if (s > 0) {
    WINDOW_Z.forEach((zw, i) => {
      const P = patchOf(zw);
      const cl = clip2(
        P.map((p): P2 => [p[2], p[1]]),
        [
          [a.z0, 0],
          [a.z1, 0],
          [a.z1, ARM.top],
          [a.z0, ARM.top],
        ],
      ).map((p): V3 => [Xf - 0.01, p[1], p[0]]);
      if (cl.length >= 3) {
        const el = softPatch(c, cl, CREAM, 0.16, `pt${a.id}${i}`);
        if (el) out.push(el);
      }
    });
  }
  return out;
};

/** a pile of n scrolls lying in a cubby, their ends toward the aisle: orange (knowledge), glinting as the camera
 *  passes their angle, a faint slow flicker */
const ScrollPile = (ctx: Ctx, a: Armarium, cb: ReturnType<typeof cubbyOf>, n: number, clipQ: P2[], key: string): React.ReactNode[] => {
  const c = ctx.c;
  const s = a.side;
  const zc = (cb.z0 + cb.z1) / 2;
  const R = SCROLL_R;
  const spots: [number, number][] = n >= 3 ? [[zc - 0.108, cb.y0 + R], [zc + 0.108, cb.y0 + R], [zc, cb.y0 + R + 0.186]] : n === 2 ? [[zc - 0.104, cb.y0 + R], [zc + 0.106, cb.y0 + R]] : [[zc + 0.02, cb.y0 + R]];
  const out: React.ReactNode[] = [];
  // the pile's glint: brightest as the view swings ~62 deg off the scrolls' ends (as the camera passes them)
  const toP = norm3([c.x - s * ARM.front, c.y - (cb.y0 + 0.16), c.z - zc]);
  const angP = (Math.acos(Math.max(-1, Math.min(1, -s * toP[0]))) * 180) / Math.PI;
  const gP = Math.exp(-Math.pow((angP - 62) / 13, 2));
  {
    const hc: V3 = [s * ARM.front, cb.y0 + 0.16, zc];
    const q = toCam(c, hc);
    if (q[2] > 0.3) {
      const hs = camToScreen(c, q);
      const d = q[2];
      const rr = Math.min(150, (F * 0.55 * (1 + 0.35 * gP)) / d);
      const gid = uidOf(ctx, "sh");
      ctx.defs.push(
        <radialGradient key={gid} id={gid}>
          <stop offset="0" stopColor={ACCENT} stopOpacity={(0.42 + 0.4 * gP) * (1 - 0.5 * fogOf(ctx, d)) * (0.85 + 0.15 * Math.sin(ctx.f * 0.11 + zc))} />
          <stop offset="0.45" stopColor={ACCENT} stopOpacity={(0.1 + 0.12 * gP) * (1 - 0.5 * fogOf(ctx, d))} />
          <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
        </radialGradient>,
      );
      out.push(<circle key={`${key}halo`} cx={fx(hs[0])} cy={fx(hs[1])} r={fx(rr)} fill={`url(#${gid})`} style={{ mixBlendMode: "screen" }} />);
    }
  }
  spots.forEach(([zs, ys], i) => {
    const xF = s * (ARM.front + 0.035 + 0.02 * i);
    const xB = s * (ARM.front + ARM.depth - 0.03);
    const disc = (X: number) =>
      Array.from({ length: 18 }, (_, j): V3 => {
        const t = (j / 18) * Math.PI * 2;
        return [X, ys + R * Math.sin(t), zs + R * Math.cos(t)];
      });
    const df = disc(xF);
    const db = disc(xB);
    const qf = projPoly(c, df);
    const qb = projPoly(c, db);
    if (qf.length < 3) return;
    const d = Math.max(NEAR, depthAt(c, [xF, ys, zs]));
    // the glint: the end catches the light as the view swings past ~35 deg off its axis
    const toC = norm3([c.x - xF, c.y - ys, c.z - zs]);
    const ang = (Math.acos(Math.max(-1, Math.min(1, -s * toC[0]))) * 180) / Math.PI;
    const glint = Math.exp(-Math.pow((ang - 62) / 13, 2)) + 0.12 * (0.5 + 0.5 * Math.sin(ctx.f * 0.09 + i * 2 + zs));
    const body = clip2(hull2([...qf, ...qb]), clipQ);
    if (body.length >= 3) out.push(<path key={`${key}b${i}`} d={dPoly(body)} fill={toneO(ctx, ORANGE.mid, d, ys)} />);
    const face = clip2(qf, clipQ);
    if (face.length >= 3) {
      out.push(<path key={`${key}f${i}`} d={dPoly(face)} fill={toneO(ctx, mixHex(ORANGE.lit, "#FFE7A8", 0.8 * c01(glint)), d, ys)} stroke={toneO(ctx, ORANGE_LINE, d, ys)} strokeWidth={lwAt(0.008, d, 0.4, 1.4)} />);
      // the rolled papyrus: an inner ring and the core
      const ring = projPoly(
        c,
        df.map((p): V3 => [p[0] - s * 0.002, ys + (p[1] - ys) * 0.55, zs + (p[2] - zs) * 0.55]),
      );
      if (ring.length >= 3) out.push(<path key={`${key}r${i}`} d={dPoly(ring)} fill="none" stroke={toneO(ctx, ORANGE.dark, d, ys)} strokeOpacity={0.55} strokeWidth={lwAt(0.008, d, 0.4, 1.4)} />);
      const core = projPoly(
        c,
        df.map((p): V3 => [p[0] - s * 0.003, ys + (p[1] - ys) * 0.16, zs + (p[2] - zs) * 0.16]),
      );
      if (core.length >= 3) out.push(<path key={`${key}c${i}`} d={dPoly(core)} fill={toneO(ctx, ORANGE.dark, d, ys)} />);
    }
  });
  return out;
};

// ---------------------------------------------------------------------------
// THE PLINTHS (bare), THE CEILING BEAMS, THE AEOLIPILE
// ---------------------------------------------------------------------------
const Plinth = (ctx: Ctx, X: number, Z: number, key: string): React.ReactNode[] => {
  const c = ctx.c;
  const out: React.ReactNode[] = [];
  const { hw, h, baseH, capH, lip } = PLINTH;
  // the contact shadow, cast a little toward the light's travel (+X, -Z)
  const sp: V3[] = Array.from({ length: 20 }, (_, i) => {
    const t = (i / 20) * Math.PI * 2;
    return [X + 0.16 + (hw + 0.34) * Math.cos(t), 0, Z - 0.05 + (hw + 0.3) * Math.sin(t)];
  });
  const sq = projPoly(c, sp);
  if (sq.length >= 3) {
    const d = Math.max(NEAR, depthAt(c, [X, 0, Z]));
    const gid = uidOf(ctx, "ps");
    ctx.defs.push(
      <radialGradient key={gid} id={gid}>
        <stop offset="0" stopColor={SHADOW} stopOpacity={0.5 * visOf(ctx, d)} />
        <stop offset="0.65" stopColor={SHADOW} stopOpacity={0.22 * visOf(ctx, d)} />
        <stop offset="1" stopColor={SHADOW} stopOpacity={0} />
      </radialGradient>,
    );
    out.push(<path key={`${key}s`} d={dPoly(sq)} fill={`url(#${gid})`} />);
  }
  out.push(...boxFaces(ctx, X - hw - lip, X + hw + lip, 0, baseH, Z - hw - lip, Z + hw + lip, PLINTH_M, `${key}b`, 0.3));
  out.push(...boxFaces(ctx, X - hw, X + hw, baseH, h - capH, Z - hw, Z + hw, PLINTH_M, `${key}m`, 0));
  // a sunk panel on each seen face of the die (a darker inset line, a lit lower edge)
  {
    const y0 = baseH + 0.13;
    const y1 = h - capH - 0.13;
    const e = hw - 0.11;
    const faces: { P: V3[]; n: V3 }[] = [
      { P: [[X - e, y0, Z - hw], [X + e, y0, Z - hw], [X + e, y1, Z - hw], [X - e, y1, Z - hw]], n: [0, 0, -1] },
      { P: [[X + e, y0, Z + hw], [X - e, y0, Z + hw], [X - e, y1, Z + hw], [X + e, y1, Z + hw]], n: [0, 0, 1] },
      { P: [[X - hw, y0, Z + e], [X - hw, y0, Z - e], [X - hw, y1, Z - e], [X - hw, y1, Z + e]], n: [-1, 0, 0] },
      { P: [[X + hw, y0, Z - e], [X + hw, y0, Z + e], [X + hw, y1, Z + e], [X + hw, y1, Z - e]], n: [1, 0, 0] },
    ];
    const d = Math.max(NEAR, depthAt(c, [X, 0.7, Z]));
    for (const [i, fc] of faces.entries()) {
      if (!facing(c, fc.P, fc.n)) continue;
      const q = projPoly(c, fc.P);
      if (q.length < 3) continue;
      out.push(<path key={`${key}pn${i}`} d={dPoly(q)} fill={tone(ctx, mixHex(shadeN(PLINTH_M, fc.n), PLINTH_M.dark, 0.12), d, 0.7)} stroke={tone(ctx, PLINTH_M.dark, d, 0.7)} strokeOpacity={0.45} strokeWidth={lwAt(0.014, d, 0.5, 2)} />);
    }
  }
  out.push(...boxFaces(ctx, X - hw - lip, X + hw + lip, h - capH, h, Z - hw - lip, Z + hw + lip, PLINTH_M, `${key}c`, 0.55));
  return out;
};
const Beams = (ctx: Ctx, z0: number, z1: number, key: string): React.ReactNode[] => {
  const out: React.ReactNode[] = [];
  const n = 2;
  for (let i = 0; i < n; i++) {
    const zc = z0 + ((i + 1) * (z1 - z0)) / (n + 1);
    out.push(...boxFaces(ctx, -WALL_X, WALL_X, CEIL_Y - 0.34, CEIL_Y, zc - 0.17, zc + 0.17, BEAM_M, `${key}${i}`, 0.25));
  }
  return out;
};

/** Hero's aeolipile: a square firebox, a wide low cauldron on it, two pipes rising from its lid and turning in to
 *  carry the sphere on a horizontal axis, two bent jets on the sphere breathing faint steam. Orange (technology),
 *  turning slowly: the one machine, a toy. (Silhouette: a box, a bowl, a goalpost holding a ball; no legs, no arms.) */
const Aeolipile = (ctx: Ctx): React.ReactNode[] => {
  const c = ctx.c;
  const out: React.ReactNode[] = [];
  const X = DEVICE.X;
  const Z = DEVICE.Z;
  const Y = DEVICE.top;
  /** the device's scale (it stands ~0.65 m) */
  const K = 1.25;
  const d = Math.max(NEAR, depthAt(c, [X, Y + 0.25, Z]));
  const o = (hex: string) => toneO(ctx, hex, d, Y + 0.25);
  const ln = o(ORANGE_LINE);
  const w = lwAt(0.006, d, 0.5, 1.6);
  const ring = (y: number, r: number, n = 28) => Array.from({ length: n }, (_, i): V3 => [X + r * Math.cos((i / n) * Math.PI * 2), y, Z + r * Math.sin((i / n) * Math.PI * 2)]);
  // the firebox (a low square box) with its dark mouth on the side toward the camera
  const FB = 0.15 * K;
  const yF = Y + 0.1 * K;
  out.push(...boxFaces(ctx, X - FB, X + FB, Y, yF, Z - FB, Z + FB, { lit: ORANGE.mid, mid: ORANGE.dark, dark: "#6E4106" }, "fb", 0.3));
  // the cauldron: a wide, low bowl (hull of its rims) with a horizontal form gradient, its lid
  const yb = yF;
  const yt = yF + 0.12 * K;
  const rb = projPoly(c, ring(yb, 0.13 * K));
  const rt = projPoly(c, ring(yt, 0.17 * K));
  if (rb.length >= 3 && rt.length >= 3) {
    const body = hull2([...rb, ...rt]);
    const xs = body.map((p) => p[0]);
    const gid = uidOf(ctx, "cg");
    ctx.defs.push(
      <linearGradient key={gid} id={gid} gradientUnits="userSpaceOnUse" x1={fx(Math.min(...xs))} y1="0" x2={fx(Math.max(...xs))} y2="0">
        <stop offset="0" stopColor={o(ORANGE.mid)} />
        <stop offset="0.3" stopColor={o(ORANGE.lit)} />
        <stop offset="0.75" stopColor={o(ORANGE.mid)} />
        <stop offset="1" stopColor={o(ORANGE.dark)} />
      </linearGradient>,
    );
    out.push(<path key="cb" d={dPoly(body)} fill={`url(#${gid})`} stroke={ln} strokeWidth={w} />);
    if (c.y > yt) out.push(<path key="ct" d={dPoly(rt)} fill={o(mixHex(ORANGE.lit, "#FFE7A8", 0.25))} stroke={ln} strokeWidth={w} />);
  }
  // the sphere on its horizontal axis (along X), carried by two pipes rising from the lid and turning in
  const sc: V3 = [X, yt + 0.27 * K, Z];
  const R = 0.072 * K;
  const qs = toCam(c, sc);
  if (qs[2] > NEAR) {
    const ssc = camToScreen(c, qs);
    const sr = (F * R) / qs[2];
    let pipes = "";
    for (const sx of [-1, 1]) {
      const pts: V3[] = [
        [X + sx * 0.13 * K, yt, Z],
        [X + sx * 0.13 * K, sc[1], Z],
        [X + sx * (R + 0.006), sc[1], Z],
      ];
      const s1 = projSeg(c, pts[0], pts[1]);
      const s2 = projSeg(c, pts[1], pts[2]);
      if (s1) pipes += `M${fx(s1[0][0])},${fx(s1[0][1])}L${fx(s1[1][0])},${fx(s1[1][1])}`;
      if (s2) pipes += `L${fx(s2[1][0])},${fx(s2[1][1])}`;
    }
    out.push(<path key="pp" d={pipes} stroke={o(ORANGE.mid)} strokeWidth={lwAt(0.026 * K, d, 1.4, 8)} strokeLinecap="round" strokeLinejoin="round" fill="none" />);
    // the jets: two bent tubes on the sphere's equator, turning about X; a faint breath of steam from each tip
    const phi = ctx.f * 0.05;
    const backJ: React.ReactNode[] = [];
    const frontJ: React.ReactNode[] = [];
    const steam: React.ReactNode[] = [];
    for (const k of [0, 1]) {
      const a = phi + k * Math.PI;
      const rx: V3 = [0, Math.cos(a), Math.sin(a)];
      const tx: V3 = [0, -Math.sin(a), Math.cos(a)];
      const p0: V3 = [sc[0], sc[1] + rx[1] * R, sc[2] + rx[2] * R];
      const p1: V3 = [sc[0], sc[1] + rx[1] * (R + 0.055 * K), sc[2] + rx[2] * (R + 0.055 * K)];
      const p2: V3 = [p1[0], p1[1] + tx[1] * 0.05 * K, p1[2] + tx[2] * 0.05 * K];
      const s1 = projSeg(c, p0, p1);
      const s2 = projSeg(c, p1, p2);
      if (!s1 || !s2) continue;
      const dd = `M${fx(s1[0][0])},${fx(s1[0][1])}L${fx(s1[1][0])},${fx(s1[1][1])}L${fx(s2[1][0])},${fx(s2[1][1])}`;
      const behind = toCam(c, p1)[2] > qs[2];
      const el = <path key={`jet${k}`} d={dd} stroke={o(behind ? ORANGE.dark : ORANGE.mid)} strokeWidth={lwAt(0.02 * K, d, 1.2, 6.5)} strokeLinecap="round" strokeLinejoin="round" fill="none" />;
      (behind ? backJ : frontJ).push(el);
      // steam: three small puffs leaving the tip backward along the jet, growing and fading
      for (let j = 0; j < 3; j++) {
        const u = (ctx.f * 0.045 + j / 3 + k * 0.5) % 1;
        const P: V3 = [p2[0], p2[1] + tx[1] * 0.12 * u + 0.05 * u * u, p2[2] + tx[2] * 0.12 * u];
        const q = toCam(c, P);
        if (q[2] < NEAR) continue;
        const sp = camToScreen(c, q);
        steam.push(<circle key={`st${k}${j}`} cx={fx(sp[0])} cy={fx(sp[1])} r={fx((F * (0.012 + 0.03 * u)) / q[2])} fill={CREAM} opacity={(0.32 * (1 - u) * u * 4 * visOf(ctx, d)).toFixed(3)} />);
      }
    }
    out.push(...backJ);
    const gid = uidOf(ctx, "sg");
    ctx.defs.push(
      <radialGradient key={gid} id={gid} cx="0.36" cy="0.32" r="0.75">
        <stop offset="0" stopColor={o("#FFE3A0")} />
        <stop offset="0.45" stopColor={o(ORANGE.lit)} />
        <stop offset="0.85" stopColor={o(ORANGE.mid)} />
        <stop offset="1" stopColor={o(ORANGE.dark)} />
      </radialGradient>,
    );
    out.push(<circle key="sph" cx={fx(ssc[0])} cy={fx(ssc[1])} r={fx(sr)} fill={`url(#${gid})`} stroke={ln} strokeWidth={w} />);
    // the axis pivots (small bosses where the pipes meet the sphere)
    out.push(...frontJ, ...steam);
  }
  return out;
};

// ---------------------------------------------------------------------------
// THE DUST: motes fixed in the hall (drifting slowly), bright where they float in a shaft
// ---------------------------------------------------------------------------
const MOTE_HALL = 2600;
const MOTE_N = MOTE_HALL + 320;
const MOTES = Array.from({ length: MOTE_N }, (_, i) =>
  i >= MOTE_HALL
    ? {
        x: lerp(0.9, 3.0, hash01(i * 3.17 + 1.1)),
        y: lerp(0.15, 3.2, hash01(i * 5.71 + 2.3)),
        z: lerp(-1.6, 1.4, hash01(i * 7.33 + 3.7)),
        r: lerp(0.004, 0.009, hash01(i * 9.13 + 4.9)),
        ph: hash01(i * 11.3 + 5.3) * 6.283,
        a: lerp(0.5, 1, hash01(i * 13.7 + 6.1)),
      }
    : {
  x: lerp(-3.0, 3.0, hash01(i * 3.17 + 1.1)),
  y: lerp(0.25, 8.4, hash01(i * 5.71 + 2.3)),
  z: lerp(DOOR_Z + 0.3, END_Z - 0.3, hash01(i * 7.33 + 3.7)),
  r: lerp(0.006, 0.014, hash01(i * 9.13 + 4.9)),
  ph: hash01(i * 11.3 + 5.3) * 6.283,
        a: lerp(0.5, 1, hash01(i * 13.7 + 6.1)),
      },
);
/** the motes in [z0, z1) at frame f (world positions) */
const moteAt = (m: (typeof MOTES)[number], f: number): V3 => [m.x + 0.22 * Math.sin(f * 0.011 + m.ph), m.y + 0.16 * Math.sin(f * 0.014 + m.ph * 1.7) + 0.0006 * f, m.z + 0.2 * Math.sin(f * 0.009 + m.ph * 2.3)];
const Dust = (ctx: Ctx, z0: number, z1: number, gid: string, key: string): React.ReactNode => {
  const c = ctx.c;
  const els: React.ReactNode[] = [];
  for (let i = 0; i < MOTE_N; i++) {
    const m = MOTES[i];
    if (m.z < z0 || m.z >= z1) continue;
    const p = moteAt(m, ctx.f);
    const q = toCam(c, p);
    if (q[2] < 0.35 || q[2] > 22) continue;
    const s = camToScreen(c, q);
    if (s[0] < -10 || s[0] > 1090 || s[1] < -10 || s[1] > 1930) continue;
    const lit = inShaft(p);
    const near = smoothstep(0.35, 1.2, q[2]) * (1 - smoothstep(12, 22, q[2]));
    const a = m.a * near * (0.1 + 0.85 * lit) * (0.85 + 0.15 * Math.sin(ctx.f * 0.07 + m.ph * 3));
    if (a < 0.02) continue;
    const r = Math.max(0.6, Math.min(8, (F * m.r) / q[2]));
    els.push(<circle key={i} cx={fx(s[0])} cy={fx(s[1])} r={fx(r)} fill={`url(#${gid})`} opacity={a.toFixed(3)} />);
  }
  return <g key={key}>{els}</g>;
};

// ---------------------------------------------------------------------------
// THE CUT: the room, then the hall's Z slabs (bays and arches) from the farthest to the camera's own
// ---------------------------------------------------------------------------
type Slab = { kind: "bay" | "arch"; i: number; z0: number; z1: number };
const SLABS: Slab[] = (() => {
  const out: Slab[] = [];
  BAYS.forEach(([b0, b1], i) => {
    out.push({ kind: "bay", i, z0: b0, z1: b1 });
    out.push({ kind: "arch", i, z0: ARCH_Z[i] - ARCH_T / 2, z1: ARCH_Z[i] + ARCH_T / 2 });
  });
  out.push({ kind: "bay", i: 6, z0: END_CHAMBER[0], z1: END_CHAMBER[1] });
  return out;
})();

export const sceneAt = (f: number) => {
  const c = camAt(f);
  const base = makeAirView({ scene: SCENE, frame: f, horizon: c.py, cam: { x: c.x, y: c.y, z: c.z }, rest: { x: c.x, y: c.y, z: c.z } });
  // the light's glow sits where the left (sunlit) windows are on screen, swinging with the turn
  const sunP: V3 = [c.x - 5, c.y + 4.5, c.z + 3];
  const qs = toCam(c, sunP);
  const ss = camToScreen(c, qs);
  const sunA = qs[2] > 0.5 ? 0.14 * smoothstep(0.5, 2.5, qs[2]) : 0;
  const v: AirView = { ...base, mood: { ...base.mood, sun: { x: Math.max(-200, Math.min(1280, ss[0])), y: Math.max(-200, Math.min(900, ss[1])), r: 900, a: sunA } } };
  const ctx: Ctx = { c, v, f, defs: [], n: { i: 0 } };
  const room = Room(ctx);
  const dist = (s: Slab) => (c.z < s.z0 ? s.z0 - c.z : c.z > s.z1 ? c.z - s.z1 : 0);
  const order = SLABS.slice().sort((a, b) => dist(b) - dist(a));
  const moteG = "clmote";
  const slabs: React.ReactNode[] = order.map((s) => {
    const key = `${s.kind}${s.i}`;
    if (s.kind === "arch") return <g key={key}>{Arch(ctx, s.i)}</g>;
    const els: React.ReactNode[] = [];
    els.push(...Beams(ctx, s.z0, s.z1, `bm${s.i}`));
    const arms = ARMARIA.filter((a) => a.bay === s.i).sort((a, b) => Math.abs(b.side * ARM.front - c.x) - Math.abs(a.side * ARM.front - c.x));
    for (const a of arms) els.push(<g key={a.id}>{Armarium_(ctx, a)}</g>);
    const pls = PLINTHS.filter((p) => p.id.startsWith(`p${s.i}`)).sort((a, b) => Math.hypot(b.X - c.x, b.Z - c.z) - Math.hypot(a.X - c.x, a.Z - c.z));
    for (const p of pls) els.push(<g key={p.id}>{Plinth(ctx, p.X, p.Z, p.id)}</g>);
    if (s.i === 6) {
      els.push(<g key="dp">{Plinth(ctx, DEVICE.X, DEVICE.Z, "dp")}</g>);
      els.push(<g key="dev">{Aeolipile(ctx)}</g>);
    }
    const zw = WINDOW_Z[s.i];
    const sh = Shaft(ctx, zw, `sh${s.i}`);
    if (sh) els.push(sh);
    els.push(Dust(ctx, s.z0, s.z1, moteG, `du${s.i}`));
    return <g key={key}>{els}</g>;
  });
  // dust inside the arches' thickness belongs to their slabs too (thin; drawn with the arch's neighbours above)
  return { c, v, ctx, room, slabs, moteG };
};

const CenturiesOfLittleScience: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const { v, ctx, room, slabs, moteG } = sceneAt(f);
  return (
    <AirStage v={v} shafts={0} motes={0} bloom={0.22}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
        <defs>
          <radialGradient id={moteG}>
            <stop offset="0" stopColor={CREAM} stopOpacity={1} />
            <stop offset="0.5" stopColor={CREAM} stopOpacity={0.7} />
            <stop offset="1" stopColor={CREAM} stopOpacity={0} />
          </radialGradient>
          <linearGradient id="cl-low" x1="0" y1="1320" x2="0" y2="1920" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor={SHADOW} stopOpacity={0} />
            <stop offset="1" stopColor={SHADOW} stopOpacity={0.2} />
          </linearGradient>
        </defs>
        {room}
        {slabs}
        {/* the low air: the bottom of the frame sinks a little toward the dense, darker air near the floor */}
        <rect x={0} y={1320} width={1080} height={600} fill="url(#cl-low)" />
        <defs>{ctx.defs}</defs>
      </svg>
    </AirStage>
  );
};

export default CenturiesOfLittleScience;
