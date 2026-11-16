// ---------------------------------------------------------------------------
// IntelligenceDiluted (rsi-stupidest-species, cut 74), REVISION 1 (a new idea; notes/rev1_H.md). Dwarkesh 3D style
// (styles/dwarkesh-3d.md). Opaque 1080x1920, 23.976 fps, 101 frames.
// The clip's shared BRAIN (./brainShared, W3, read-only) and PELVIS; the stomach and the white blood cell are copies
// of cut I2's drawings (./TwentyWatts.tsx, read-only), so cuts I1 and I2 pick up the same three pressures.
//
// CHECK LINE: "Whatever push evolution gave our brains upward, other needs of the body grabbed hold and pulled it back
//   down."
//
// THE LINE: "been diluted by the selection pressures that have opposed greater intelligence. For"
// WORD -> FRAME: been 1 · diluted 6 · by 19 · the 27 · selection 29 · pressures 35 · that 50 · have 57 · opposed 60 ·
//   greater 71 · intelligence 85 · For 98
// DURATION: the slot 74.658 -> 78.870 s (sequence frames 1790-1891) = 101 frames at 24000/1001 (f0..f100).
//
// THE MOTION (revision 1, final): one continuous camera. f0-19 ("been diluted"): close on the brain (~650 px, k 2.1),
// glowing orange from inside, pushed up by an UPDRAFT with no body of its own: separate comets of orange light rising
// under it (a bright head at the TOP tapering to nothing below) and a few small upward chevrons, fanning out a little;
// the camera rises with it. f27-41 ("the selection pressures"): three cream-tan ropes shoot up from below, one after
// another, each tip carrying a small cream BONE CLIP that bites the brain's lower edge on its hook frame (f35 / f38 /
// f41); the last one taut arrests the rise and the ropes yank the brain down to a hang (damped, settled ~f52) while the
// camera pulls back and down (k 1.7 -> 0.88 over f33-52) to show each rope running down to a weight on a low stone
// block: the STOMACH, the PELVIS, an IMMUNE CELL (pale and lumpy, pseudopod bumps, a lobed purple nucleus); each >= 220
// px wide from f50, the brain >= 265 px. f56-61 ("opposed"): the brain jerks UP against them (a stretch, the updraft
// flares, glow and halo swell). f63-71 ("greater"): the first tug down, tilting toward the stomach rope (squash ~14%,
// tilt ~9 deg); a small give back up; f75-83 ("intelligence"): the second tug wins, tilting toward the cell rope, a
// damped settle. Over the two tugs the inner glow drops 1.0 -> 0.30 and the halo to half: a dimmer brain held down,
// still faintly lit. The camera follows down and in a little (k 0.88 -> 0.98). f85-100: living hold: breathing, the
// ropes quivering; the updraft, squeezed, fades out above the weights.
// CAUSE BEFORE EFFECT: each rope's tip leaves its weight and travels to its clip point (contact = hook frame, then a
// damped snap straight); the rise is arrested only when the last rope is taut; each drop follows a tug (the ropes'
// quiver, the strain and the tilt toward the pulling side run with it).
// Orange = INTELLIGENCE (the clip rule): only the brain's inner glow and its updraft. Ropes hemp, weights in their
// earthy local colours (cream bone, muted red-brown stomach, ivory cell with a slate nucleus), plinths stone. No text.
//
// DEPTH: a sand floor (Y = 0) receding to a soft horizon; everything that matters on the front plane (Z = 0): the
// brain, the ropes, the weights (each on a low stone block, top Y -110, Z -70..70, at x -272 / 0 / 272). Eye at Y -480 (above the weights), dRef 2200
// at kRef 1, dolly 0.4, fog by depth. World X = resolved screen x - 540, floor Y = 0.
//
// SOURCES: none (no figures on screen). The pressures as the speaker names them next (cuts I1, I2): the birth canal
//   (pelvis), the brain's energy budget against digestion and immunity.
// ---------------------------------------------------------------------------
import React from "react";
import { Easing, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  AIR,
  AirBox,
  AirFloor,
  AirHorizonHazeW,
  AirShadow,
  AirStage,
  MAT,
  Paint,
  WorldSvg,
  airWorldOf,
  c01,
  lerp,
  makeCamera,
  swayCam,
  type AirWorld,
  type Cam,
  type DepthOpts,
  type P2,
} from "../kits/dwarkesh-3d/dwarkesh3d";
import { Brain, Pelvis, brainBox } from "./brainShared";

export const FPS = 24000 / 1001;
export const DURATION = 101;
export const schema = z.object({
  /** probe only: hold the camera at this frame (-1 = the cut's camera) */
  camFrame: z.number().default(-1),
});
export const defaultProps = schema.parse({});

const PAL = AIR.A;
const n2 = (v: number) => v.toFixed(2);
const sstep = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};

// ===================================================================================================================
// THE WORLD
// ===================================================================================================================
export const DEPTH: DepthOpts = { eyeY: -480, dRef: 2200, kRef: 1, dolly: 0.4 };
export const PLINTH = { top: -110, hw: 100, z: 70 };
export const BRAIN_SIZE = 310;
const BB = brainBox(BRAIN_SIZE);
/** the three weights (centre x, and what sits on the plinth): each ~250 units wide, so >= 220 px from the reveal on */
export const WEIGHTS = { stomach: -272, pelvis: 0, cell: 272 };
const STOM_SCALE = 0.333;
const STOM_LOCAL_CX = -63;
const STOM_BOTTOM = 322;
const PELVIS_W = 262;
const CELL_SIZE = 325;
/** where each rope is tied on its weight (world) */
export const TIE: Record<keyof typeof WEIGHTS, P2> = {
  stomach: [WEIGHTS.stomach + (92 - STOM_LOCAL_CX) * STOM_SCALE * 0.55, PLINTH.top - STOM_BOTTOM * STOM_SCALE + -360 * STOM_SCALE],
  pelvis: [WEIGHTS.pelvis, PLINTH.top - 0.44 * PELVIS_W - 0.478 * PELVIS_W + 26],
  cell: [WEIGHTS.cell, PLINTH.top - 0.94 * 0.37 * CELL_SIZE - 8 - 0.94 * 0.37 * CELL_SIZE + 14],
};

// ===================================================================================================================
// TIMING (frames)
// ===================================================================================================================
export const T = {
  ropes: [
    { key: "stomach" as const, launch: 27, hook: 35 },
    { key: "pelvis" as const, launch: 30, hook: 38 },
    { key: "cell" as const, launch: 33, hook: 41 },
  ],
  caught: 41, // the last rope is taut: the rise is arrested and the ropes yank the brain down to a hang
  resist: [56, 61] as const, // "opposed": the brain jerks UP against them, the updraft flares
  tug1: [63, 71] as const, // "greater": the first pull
  recover: [71, 75] as const, // a small give back up
  tug2: [75, 83] as const, // "intelligence": the second pull wins
};

// ===================================================================================================================
// THE BRAIN'S PATH (its box centre, world)
// ===================================================================================================================
const Y0 = -895;
const Y_PEAK = -965;
const Y_C = -850; // hanging on the taut ropes
const Y_RES = -866;
const Y_MID = -705;
const Y_REC = -716;
export const Y_HELD = -550;
const tugEase = Easing.bezier(0.55, 0, 0.25, 1);
const seg = (f: number, [a, b]: readonly [number, number], ease: (u: number) => number = sstep) => ease(c01((f - a) / (b - a)));
const hump = (f: number, a: number, b: number) => Math.sin(Math.PI * c01((f - a) / (b - a)));
export const brainAt = (f: number) => {
  let y: number;
  if (f <= T.caught) y = Y0 + (Y_PEAK - Y0) * (1 - Math.pow(1 - c01(f / T.caught), 1.45));
  else {
    const t = f - T.caught;
    const pr = 1 - Math.exp(-t / 2.6) * (Math.cos(0.75 * t) + 0.35 * Math.sin(0.75 * t));
    y = Y_PEAK + (Y_C - Y_PEAK) * pr;
  }
  y += (Y_RES - Y_C) * seg(f, T.resist);
  y += (Y_MID - Y_RES) * seg(f, T.tug1, tugEase);
  y += (Y_REC - Y_MID) * seg(f, T.recover);
  y += (Y_HELD - Y_REC) * seg(f, T.tug2, tugEase);
  const tb = f - T.tug2[1];
  if (tb > 0) y += 9 * Math.exp(-tb / 3) * Math.sin(tb * 0.9);
  if (f > 86) y += 4 * Math.sin((f - 86) / 5.5) * c01((f - 86) / 6);
  // the fight: a stretch up while it resists, a squash and a tilt toward the pulling side on each tug, part of it kept
  const rs = hump(f, 55, 64);
  const s1 = hump(f, 63, 74);
  const s2 = hump(f, 75, 87);
  const rest = sstep((f - 80) / 7);
  const strain = Math.max(s1, s2, 0.4 * rest);
  const sqY = 1 - 0.14 * strain + 0.06 * rs;
  const sqX = 1 + 0.09 * strain - 0.03 * rs;
  const rot = 2.5 * rs - 9 * s1 + 8 * s2 * (1 - 0.5 * rest) - 2.5 * rest + 0.8 * Math.sin(f / 9) * rest;
  const glow = 0.92 + 0.08 * hump(f, 55, 68) - 0.3 * sstep((f - 64) / 8) - 0.32 * sstep((f - 75) / 9);
  const halo = 1 + 0.9 * hump(f, 55, 68) - 0.25 * sstep((f - 64) / 8) - 0.25 * sstep((f - 75) / 9);
  const x = -3 * s1 + 3 * s2;
  return { x, y, strain, glow, halo, rot, sqX, sqY, rs };
};
/** where each rope's bone clip bites the brain's lower edge (brain-local, about its centre: x in brain widths, y in
 *  brain heights), and the clip's lean along the edge's outward normal (deg) */
const EDGE: Record<keyof typeof WEIGHTS, { p: P2; lean: number }> = {
  stomach: { p: [-0.27, 0.27], lean: 24 },
  pelvis: { p: [0.02, 0.36], lean: 0 },
  cell: { p: [0.27, 0.26], lean: -20 },
};
const CLIP = { half: 13, ring: 21 };
const toWorld = (b: ReturnType<typeof brainAt>, [lx, ly]: P2): P2 => {
  const px = lx * b.sqX;
  const py = ly * b.sqY;
  const a = (b.rot * Math.PI) / 180;
  return [b.x + px * Math.cos(a) - py * Math.sin(a), b.y + px * Math.sin(a) + py * Math.cos(a)];
};
const edgeLocal = (key: keyof typeof WEIGHTS): P2 => [EDGE[key].p[0] * BRAIN_SIZE, EDGE[key].p[1] * BB.h];
/** the clip on the edge (world) and the angle it hangs at */
export const clipAt = (key: keyof typeof WEIGHTS, f: number) => {
  const b = brainAt(f);
  const e = edgeLocal(key);
  return { p: toWorld(b, e), ang: b.rot + EDGE[key].lean };
};
/** the rope's end: the ring under the clip */
export const hookAt = (key: keyof typeof WEIGHTS, f: number): P2 => {
  const c = clipAt(key, f);
  const a = (c.ang * Math.PI) / 180;
  return [c.p[0] - Math.sin(a) * CLIP.ring, c.p[1] + Math.cos(a) * CLIP.ring];
};

// ===================================================================================================================
// THE CAMERA: close on the rising brain, pull back and down to the weights, then follow the fight down and in
// ===================================================================================================================
const K = (f: number, k: number, wy: number, sy: number) => ({ f, k, wx: 0, wy, sx: 540, sy });
export const camAt = makeCamera(
  [
    K(0, 2.1, Y0, 812),
    K(19, 1.95, -942, 814),
    K(33, 1.72, -952, 820),
    K(52, 0.88, -226, 960),
    K(62, 0.885, -230, 960),
    K(85, 0.98, -197, 960),
    K(100, 0.99, -195, 960),
  ],
  false,
);
export const camOf = (f: number): Cam => swayCam(camAt(f), f);
const REST = camOf(0);

// ===================================================================================================================
// GEOMETRY HELPERS (copies of cut I2's)
// ===================================================================================================================
const pt3 = (p: P2) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
const smoothClosed = (q: P2[], t = 1 / 6) => {
  const n = q.length;
  let d = `M${pt3(q[0])}`;
  for (let i = 0; i < n; i++) {
    const p0 = q[(i - 1 + n) % n];
    const p1 = q[i];
    const p2 = q[(i + 1) % n];
    const p3 = q[(i + 2) % n];
    d += `C${pt3([p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t])} ${pt3([p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t])} ${pt3(p2)}`;
  }
  return `${d}Z`;
};
const crSample = (q: P2[], N = 60): P2[] => {
  const n = q.length;
  return Array.from({ length: N + 1 }, (_, j) => {
    const s = Math.min(n - 1.0001, (j / N) * (n - 1));
    const i = Math.floor(s);
    const t = s - i;
    const p0 = q[Math.max(0, i - 1)];
    const p1 = q[i];
    const p2 = q[i + 1];
    const p3 = q[Math.min(n - 1, i + 2)];
    const t2 = t * t;
    const t3 = t2 * t;
    const c = (a: number, b: number, cc: number, d: number) => 0.5 * (2 * b + (-a + cc) * t + (2 * a - 5 * b + 4 * cc - d) * t2 + (-a + 3 * b - 3 * cc + d) * t3);
    return [c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])] as P2;
  });
};
const tubeD = (q: P2[], w: (u: number) => number, N = 60, round = true) => {
  const pts = crSample(q, N);
  const L: P2[] = [];
  const R: P2[] = [];
  pts.forEach((p, i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(N, i + 1)];
    const dx = b[0] - a[0];
    const dy = b[1] - a[1];
    const l = Math.hypot(dx, dy) || 1;
    const hw = w(i / N) / 2;
    L.push([p[0] - (dy / l) * hw, p[1] + (dx / l) * hw]);
    R.push([p[0] + (dy / l) * hw, p[1] - (dx / l) * hw]);
  });
  const r0 = w(0) / 2;
  const r1 = w(1) / 2;
  const Rr = [...R].reverse();
  if (!round) return `M${[...L, ...Rr].map(pt3).join("L")}Z`;
  return `M${L.map(pt3).join("L")}A${n2(r1)},${n2(r1)} 0 0 0 ${pt3(Rr[0])}L${Rr.map(pt3).join("L")}A${n2(r0)},${n2(r0)} 0 0 0 ${pt3(L[0])}Z`;
};

// ===================================================================================================================
// THE STOMACH (a copy of cut I2's drawing, unlit, a slow living churn)
// ===================================================================================================================
const STOM_OUT: P2[] = [
  [-40, -300],
  [-60, -205],
  [-112, -95],
  [-195, -15],
  [-292, 26],
  [-372, 40],
  [-405, 74],
  [-398, 132],
  [-300, 172],
  [-150, 202],
  [20, 192],
  [172, 132],
  [272, 22],
  [312, -118],
  [292, -250],
  [212, -340],
  [92, -372],
  [16, -340],
];
const ESO: P2[] = [
  [-14, -312],
  [-22, -380],
  [-40, -440],
];
const GUT: P2[] = [
  [-388, 112],
  [-438, 214],
  [-352, 300],
  [-150, 322],
  [60, 300],
  [176, 238],
  [150, 150],
];
const RUGAE: P2[][] = [
  [
    [-300, 120],
    [-150, 150],
    [20, 140],
    [160, 80],
    [240, -30],
  ],
  [
    [-200, 60],
    [-60, 90],
    [90, 60],
    [190, -40],
    [220, -150],
  ],
];
const STOM_INK = { body: "#B07463", eso: "#A0675A", gut: "#C29A84", ruga: "#8E5648", rim: "#F3EBDD" };
const Stomach: React.FC<{ x: number; y: number; scale: number; uid: string; unitPx: number; f: number; tug: number }> = ({ x, y, scale, uid, unitPx, f, tug }) => {
  const ch = 0.012 * Math.sin((2 * Math.PI * f) / 26);
  // a slight lift toward the rope while it pulls
  const sq = (p: P2): P2 => [p[0] * (1 + ch), p[1] * (1 - ch * 0.8) - tug * 10 * c01((-p[1] - 100) / 300)];
  const shapes: Paint.Shape[] = [
    { d: tubeD(ESO.map(sq), () => 78, 20), fill: STOM_INK.eso, sh: 2.4 },
    { d: tubeD(GUT, (u) => 74 - 8 * u, 90), fill: STOM_INK.gut, sh: 3 },
    { d: smoothClosed(STOM_OUT.map(sq)), fill: STOM_INK.body, sh: 4 },
  ];
  for (const r of RUGAE) shapes.push({ d: tubeD(r.map(sq), (u) => 15 * Math.pow(Math.sin(Math.PI * u), 0.6) + 0.5, 40, false), fill: STOM_INK.ruga, sh: 0, op: 0.45 });
  shapes.push({ d: tubeD([[264, -120], [262, -236], [200, -320], [100, -350]].map((p) => sq(p as P2)), (u) => 13 * Math.pow(Math.sin(Math.PI * u), 0.6) + 0.5, 30, false), fill: STOM_INK.rim, sh: 0, op: 0.45 });
  const px = Math.max(0.2, (900 * scale * unitPx) / 520);
  return <Paint.FolkPaint shapes={shapes} x={x} y={y} scale={scale} uid={uid} px={px} unitPx={unitPx} />;
};

// ===================================================================================================================
// THE WHITE BLOOD CELL (a copy of cut I2's drawing, unlit, living lobes)
// ===================================================================================================================
const CELL_INK = { body: "#DDD6C8", nucleus: "#8C7FAA", rim: "#F6EEDC" };
const cellOutline = (f: number, reach: number): P2[] => {
  const N = 64;
  const out: P2[] = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 2 * Math.PI;
    const lobes = 0.025 * Math.sin(2 * a + 0.9 + f / 17) + (0.03 + 0.03 * reach) * Math.sin(7 * a + 2.1 - f / 13) + 0.015 * Math.sin(11 * a - f / 9);
    const pod = (c: number, wd: number) => Math.exp(-Math.pow(Math.atan2(Math.sin(a - c), Math.cos(a - c)) / wd, 2));
    const live = (ph: number) => 1 + 0.12 * Math.sin(f / 10 + ph);
    const pods = (0.05 + 0.09 * reach) * live(0) * pod(-0.8, 0.3) + (0.04 + 0.08 * reach) * live(2) * pod(1.4, 0.3) + (0.05 + 0.08 * reach) * live(4) * pod(3.6, 0.32);
    const r = 370 * (1 + lobes + pods);
    out.push([r * Math.cos(a), r * Math.sin(a) * 0.94]);
  }
  return out;
};
const nucleusD = (f: number) => {
  const run: P2[] = [
    [-175, 95],
    [-120, -40],
    [10, -120],
    [160, -110],
  ];
  const wob = (q: P2[]) => q.map((p, i) => [p[0] + 5 * Math.sin(f / 15 + i), p[1] + 5 * Math.cos(f / 19 + i)] as P2);
  return tubeD(wob(run), (u) => 72 + 118 * Math.pow(Math.abs(Math.sin(3 * Math.PI * (0.05 + 0.9 * u))), 0.7), 90);
};
const Cell: React.FC<{ x: number; y: number; size: number; uid: string; unitPx: number; f: number }> = ({ x, y, size, uid, unitPx, f }) => {
  const scale = size / 1000;
  const outline = cellOutline(f, 0.75);
  const bodyD = smoothClosed(outline);
  const shapes: Paint.Shape[] = [{ d: bodyD, fill: CELL_INK.body, sh: 4 }];
  shapes.push({ d: nucleusD(f), fill: CELL_INK.nucleus, sh: 1.4 });
  const rimRun = outline.slice(Math.round(outline.length * 0.53), Math.round(outline.length * 0.8)).map((p) => [p[0] * 0.965, p[1] * 0.965] as P2);
  shapes.push({ d: tubeD(rimRun, (u) => 16 * Math.pow(Math.sin(Math.PI * u), 0.6) + 0.5, 40, false), fill: CELL_INK.rim, sh: 0, op: 0.6 });
  const px = Math.max(0.2, (size * unitPx) / 520);
  return <Paint.FolkPaint shapes={shapes} x={x} y={y} scale={scale} uid={uid} px={px} unitPx={unitPx} />;
};

// ===================================================================================================================
// THE ROPES: hemp cords from each weight's tie to a hook under the brain
// ===================================================================================================================
const HEMP = { edge: "#6E5E44", body: "#CDBB92", lit: "#EDE2C6" };
const ROPE_W = 13;
/** the rope's run at frame f: null before launch; the tip travels from the tie to the hook, then it snaps taut */
export const ropeAt = (i: number, f: number): P2[] | null => {
  const r = T.ropes[i];
  if (f < r.launch) return null;
  const tie = TIE[r.key];
  const hook = hookAt(r.key, f);
  const u = c01((f - r.launch) / (r.hook - r.launch));
  const e = 1 - Math.pow(1 - u, 2.2);
  const tip: P2 = [lerp(tie[0], hook[0], e), lerp(tie[1], hook[1], e)];
  // slack while flying (bellied sideways), then a damped snap to straight; a quiver under tension
  const since = f - r.hook;
  const slack = since < 0 ? 0.07 * Math.sin(Math.PI * Math.min(1, u * 1.3)) + 0.02 : 0.07 * Math.exp(-since / 3.2) * Math.cos(since * 1.9);
  const pulling = Math.max(hump(f, 54, 66), hump(f, 62, 74), hump(f, 74, 86), 0.4 * sstep((f - 80) / 6));
  const quiver = since < 0 ? 0 : (1.2 + 2.2 * pulling) * Math.sin(f * 1.15 + i * 1.7);
  const dx = tip[0] - tie[0];
  const dy = tip[1] - tie[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L;
  const ny = dx / L;
  const side = i === 1 ? 1 : i === 0 ? -1 : 1;
  const N = 24;
  return Array.from({ length: N + 1 }, (_, j) => {
    const s = j / N;
    const off = side * slack * L * Math.sin(Math.PI * s) + quiver * Math.sin(Math.PI * s);
    return [tie[0] + dx * s + nx * off, tie[1] + dy * s + ny * off] as P2;
  });
};
/** the strand grooves: short slanted strokes every ~0.7 cord widths, measured from the tie (so they do not crawl) */
const layD = (q: P2[], w = ROPE_W) => {
  const step = w * 0.72;
  const hw = w * 0.42;
  let d = "";
  let next = step * 0.5;
  let acc = 0;
  for (let i = 1; i < q.length; i++) {
    const [ax, ay] = q[i - 1];
    const [bx, by] = q[i];
    const l = Math.hypot(bx - ax, by - ay);
    if (l < 1e-6) continue;
    const tx = (bx - ax) / l;
    const ty = (by - ay) / l;
    while (next <= acc + l) {
      const s = next - acc;
      const px = ax + tx * s;
      const py = ay + ty * s;
      d += `M${n2(px - ty * hw - tx * hw * 0.8)},${n2(py + tx * hw - ty * hw * 0.8)}L${n2(px + ty * hw + tx * hw * 0.8)},${n2(py - tx * hw + ty * hw * 0.8)}`;
      next += step;
    }
    acc += l;
  }
  return d || "M0,0";
};
const Rope: React.FC<{ q: P2[]; lw: number }> = ({ q, lw }) => {
  const d = `M${q.map(pt3).join("L")}`;
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke={HEMP.edge} strokeWidth={ROPE_W + lw * 1.6} />
      <path d={d} stroke={HEMP.body} strokeWidth={ROPE_W} />
      {/* the lay of the strands: slanted grooves along the cord */}
      <path d={layD(q)} stroke={HEMP.edge} strokeWidth={ROPE_W * 0.16} strokeOpacity={0.5} />
      <path d={d} stroke={HEMP.lit} strokeWidth={ROPE_W * 0.3} strokeOpacity={0.7} transform={`translate(${n2(-ROPE_W * 0.18)} ${n2(-ROPE_W * 0.2)})`} />
    </g>
  );
};
/** the knot where a rope is tied on its weight */
const Knot: React.FC<{ p: P2 }> = ({ p }) => {
  const r = 1;
  return (
    <g>
      <ellipse cx={p[0]} cy={p[1]} rx={9 * r} ry={7 * r} fill={HEMP.body} stroke={HEMP.edge} strokeWidth={2} />
      <path d={`M${n2(p[0] - 5 * r)},${n2(p[1] - 2 * r)}Q${n2(p[0])},${n2(p[1] - 6 * r)} ${n2(p[0] + 5 * r)},${n2(p[1] - r)}`} stroke={HEMP.lit} strokeWidth={1.6} fill="none" strokeOpacity={0.8} />
    </g>
  );
};
/** the bone clip pinching the brain's lower edge, a ring under it for the rope */
const BONE = { fill: "#EFE5CF", edge: "#9C8D70", lit: "#FBF7EC", slot: "#B8AA8C" };
const Clip: React.FC<{ p: P2; ang: number; lw: number }> = ({ p, ang, lw }) => (
  <g transform={`translate(${n2(p[0])} ${n2(p[1])}) rotate(${n2(ang)})`}>
    <circle cx={0} cy={CLIP.ring} r={6.5} fill="none" stroke={BONE.edge} strokeWidth={5 + lw} />
    <circle cx={0} cy={CLIP.ring} r={6.5} fill="none" stroke={BONE.fill} strokeWidth={4} />
    <rect x={-10} y={-CLIP.half} width={20} height={CLIP.half * 2 + 2} rx={8} fill={BONE.fill} stroke={BONE.edge} strokeWidth={1.6 + lw} />
    <path d={`M-6,-2L6,-2`} stroke={BONE.slot} strokeWidth={2.6} strokeLinecap="round" />
    <path d={`M-5,${-CLIP.half + 4}Q0,${-CLIP.half + 1.5} 5,${-CLIP.half + 4}`} stroke={BONE.lit} strokeWidth={2} fill="none" strokeLinecap="round" />
  </g>
);

// ===================================================================================================================
// THE UPDRAFT: no body of its own, only separate streaks of orange light rising under the brain and fanning out as
// they go (a push upward, not a thing the brain sits on); it flares when the brain resists
// ===================================================================================================================
const UP_L = 230;
/** world Y above the weights' tops where the updraft has faded out */
const UP_FLOOR = PLINTH.top - 270;
const hash = (x: number) => {
  const h = Math.sin(x * 12.9898 + 4.1) * 43758.5453;
  return h - Math.floor(h);
};
const Updraft: React.FC<{ x: number; base: number; f: number; strength: number }> = ({ x, base, f, strength }) => {
  const halfW = 0.55 * BB.w;
  const heads: React.ReactNode[] = [];
  const tails: React.ReactNode[] = [];
  const N = 32;
  for (let i = 0; i < N; i++) {
    // decorrelated per-streak lane, speed and phase (so they never bunch)
    const lane = (i + 0.5) / N * 2 - 1 + 0.06 * Math.sin(i * 7.3);
    const v = 9 + 4 * hash(i * 3.1);
    const s = (hash(i * 1.7 + 0.4) * UP_L + f * v) % UP_L; // risen from the foot
    const u = s / UP_L;
    const spread = 0.72 + 0.28 * u;
    const xx = x + lane * halfW * spread + 2.5 * Math.sin(f / 7 + i * 1.3);
    const yy = base + UP_L + 14 - s;
    const dx = lane * halfW * 0.28;
    const L = Math.hypot(dx, UP_L);
    const tx = dx / L;
    const ty = -UP_L / L;
    const extra = i % 3 === 2 ? c01((strength - 1) / 0.4) : 1;
    // the column never reaches down among the weights (it fades out above their tops)
    const a = Math.pow(Math.sin(Math.PI * u), 0.8) * Math.min(1, 0.8 * strength) * extra * c01((UP_FLOOR - (base + UP_L + 14 - s)) / 50);
    if (a < 0.01) continue;
    const len = (46 + 30 * hash(i * 5.3)) * (0.7 + 0.35 * strength);
    // a comet pointing UP: a round bright head at the top, tapering to nothing below it
    const r = 3.6;
    const hx = xx + tx * len * 0.5;
    const hy = yy + ty * len * 0.5;
    const ex = xx - tx * len * 0.5;
    const ey = yy - ty * len * 0.5;
    const nx = -ty;
    const ny = tx;
    const col = i % 3 === 0 ? "#FFD27A" : ACCENT;
    tails.push(
      <path key={i} d={`M${n2(hx + nx * r)},${n2(hy + ny * r)}L${n2(ex)},${n2(ey)}L${n2(hx - nx * r)},${n2(hy - ny * r)}Z`} fill={col} fillOpacity={(0.75 * a).toFixed(3)} stroke="none" />,
    );
    heads.push(<circle key={i} cx={n2(hx)} cy={n2(hy)} r={r * 1.15} fill="#FFE2A2" fillOpacity={a.toFixed(3)} stroke="none" />);
  }
  // a few small upward chevrons rising in the column
  const chev: React.ReactNode[] = [];
  const CH_LANES = [-0.32, 0.08, 0.36, -0.06, -0.42];
  for (let j = 0; j < CH_LANES.length; j++) {
    const s = (hash(j * 2.3 + 9) * UP_L + f * 6.5) % UP_L;
    const u = s / UP_L;
    const a = Math.pow(Math.sin(Math.PI * u), 1.2) * Math.min(1, 0.8 * strength) * 0.9 * c01((UP_FLOOR - (base + UP_L + 14 - s)) / 50);
    if (a < 0.01) continue;
    const cx = x + CH_LANES[j] * halfW * (0.72 + 0.28 * u);
    const cy = base + UP_L + 14 - s;
    chev.push(<path key={j} d={`M${n2(cx - 13)},${n2(cy + 6)}L${n2(cx)},${n2(cy - 6)}L${n2(cx + 13)},${n2(cy + 6)}`} stroke={ACCENT} strokeOpacity={a.toFixed(3)} strokeWidth={4.5} strokeLinejoin="round" />);
  }
  return (
    <g fill="none" strokeLinecap="round">
      <defs>
        <filter id="updraft-b" filterUnits="userSpaceOnUse" x={x - 800} y={base - 400} width={1600} height={UP_L + 800}>
          <feGaussianBlur stdDeviation={6} />
        </filter>
      </defs>
      <g filter="url(#updraft-b)" opacity={0.7}>
        {heads.map((h, i) => React.cloneElement(h as React.ReactElement<{ r: number }>, { key: `g${i}`, r: 9 }))}
      </g>
      {tails}
      {heads}
      {chev}
    </g>
  );
};

// ===================================================================================================================
// THE CUT
// ===================================================================================================================
const Plinth: React.FC<{ A: AirWorld; x: number; uid: string }> = ({ A, x, uid }) => (
  <g>
    <AirShadow A={A} X={x} Z={0} w={PLINTH.hw * 1.15} d={PLINTH.z * 1.3} amt={0.8} uid={`${uid}s`} />
    <AirBox A={A} X0={x - PLINTH.hw} X1={x + PLINTH.hw} Y0={PLINTH.top} Y1={0} Z0={-PLINTH.z} Z1={PLINTH.z} mat={MAT.stone} uid={uid} />
    <AirShadow A={A} X={x} Z={0} w={PLINTH.hw * 0.8} d={PLINTH.z * 0.7} Y={PLINTH.top} amt={0.7} uid={`${uid}t`} />
  </g>
);

const IntelligenceDiluted: React.FC<z.infer<typeof schema>> = ({ camFrame }) => {
  const frame = useCurrentFrame();
  const cf = camFrame >= 0 ? camFrame : frame;
  const cam = camOf(cf);
  const A = airWorldOf({ cam, rest: REST, depth: DEPTH, frame, fogBy: "depth" });
  const f = frame;
  const k = cam.k;
  const lw = A.lw(1.2);
  const b = brainAt(f);
  const anchorY = b.y - BB.cy;
  const updraftStrength = 0.92 + 0.75 * hump(f, 55, 70) - 0.17 * sstep((f - 66) / 16) + 0.07 * Math.sin(f / 4) * sstep((f - 70) / 10);
  const tug = Math.max(hump(f, 62, 74), hump(f, 74, 86), 0.3 * sstep((f - 80) / 6));
  const ropes = T.ropes.map((_, i) => ropeAt(i, f));

  const stomY = PLINTH.top - STOM_BOTTOM * STOM_SCALE;
  const pelvisY = PLINTH.top - 0.44 * PELVIS_W;
  const cellY = PLINTH.top - 0.94 * 0.37 * CELL_SIZE - 8;

  return (
    <AirStage v={A.v} bloom={0.22}>
      <WorldSvg cam={cam}>
        <AirFloor A={A} x0={-3600} x1={3600} z0={-3000} z1={6000} mat={MAT.ground} course={190} />
        <AirHorizonHazeW A={A} id="haze" />

        {/* the updraft under the brain */}
        <Updraft x={b.x} base={b.y + BB.h / 2} f={f} strength={updraftStrength} />

        {/* the weights on their plinths (in front of the updraft) */}
        {(["stomach", "pelvis", "cell"] as const).map((key) => (
          <Plinth key={key} A={A} x={WEIGHTS[key]} uid={`pl-${key}`} />
        ))}
        <Stomach x={WEIGHTS.stomach - STOM_LOCAL_CX * STOM_SCALE} y={stomY} scale={STOM_SCALE} uid="stom" unitPx={k} f={f} tug={ropes[0] && f >= T.ropes[0].hook ? tug : 0} />
        <Pelvis x={WEIGHTS.pelvis} y={pelvisY} size={PELVIS_W} uid="pelv" unitPx={k} />
        <Cell x={WEIGHTS.cell} y={cellY} size={CELL_SIZE} uid="cell" unitPx={k} f={f} />

        <Brain x={b.x} y={anchorY} size={BRAIN_SIZE} uid="brain" unitPx={k} glow={b.glow} halo={b.halo} rot={b.rot} squashX={b.sqX} squashY={b.sqY} pivot="center" />

        {/* the ropes, each ending in a bone clip on the brain's lower edge; a knot at each weight */}
        {ropes.map((q, i) => (q ? <Rope key={i} q={q} lw={lw} /> : null))}
        {ropes.map((q, i) => (q ? <Knot key={`t${i}`} p={TIE[T.ropes[i].key]} /> : null))}
        {ropes.map((q, i) => {
          if (!q) return null;
          const r = T.ropes[i];
          // the clip rides on the rope's tip while it flies, and bites the edge on the hook frame
          const c = clipAt(r.key, f);
          const tip = q[q.length - 1];
          const end = hookAt(r.key, f);
          const off: P2 = [tip[0] - end[0], tip[1] - end[1]];
          return <Clip key={`c${i}`} p={[c.p[0] + off[0], c.p[1] + off[1]]} ang={c.ang} lw={lw} />;
        })}
      </WorldSvg>
    </AirStage>
  );
};

export default IntelligenceDiluted;

export { PAL };
