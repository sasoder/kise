// ---------------------------------------------------------------------------
// KellysProductionRun (zach-kelly-johnson, cut 18; the director's suggestion over the enabled speaker). Core Memory
// podcast, ARCHIVE COLLAGE (footage-matched variant) on the clip's shared module ./archiveShared.
// Opaque 1080x1920, 23.976 fps, 95 frames.
//
// CHECK LINE: "One man, Kelly Johnson, sent plane after plane — the P-38, the Constellation, the U-2, the SR-71 —
// out of one shop into production."
//
// THE LINE: "So you talked about Skunk Works. You know, Kelly Johnson did 41 aircraft into production in 40 years."
// WORD -> FRAME (local onset): Skunk 1 · Works 9 · You 18 · know 20 · Kelly 23 · Johnson 27 · did 32 · 41 39 ·
//   aircraft 46 · into 59 · production 66 · in 74 · 40 78 · years 82 · speech ends ~92 · cut at f95.
// DURATION: the slot 18.81 -> 22.77275 s (sequence frames 451 -> 546) = 3.963 s x 23.976 = 95 frames (f0..f94).
//
// THE MOTION (revision 2): one continuous dolly pull-back from a close-up of Kelly Johnson's face (already moving at
// f0, one acceleration to ~f13, one long deceleration lobe landing at f84, then a creep). One of each of his aircraft,
// in date order, comes out from behind his left shoulder (screen left) every 6 frames (P-38 f4, Constellation f10,
// P-80 f16, F-104 f22, U-2 f28, SR-71 f34; each first seen a few frames later): it climbs straight up beside his head,
// bends right onto its row and flies along it to the row's leading slot. The rest (repeats) fly in from the frame's
// left edge along their own row lines and stop behind the one ahead, each row filling right to left. The result is a
// formation of six rows, one type per row (P-38 lowest, SR-71 highest; 4, 3, 3, 3, 3, 3 = 19 aircraft) within x
// 40-1040, y ~115-620: alternate rows staggered half a column, the whole grid rising 4 deg to the right (the
// direction of flight), each aircraft ~110 (P-80) to ~265 px long, no two overlapping. Nothing ever overlaps in
// flight either (auditFrame): never more than four in the air before f62, five in the last quick run; the last one is
// flying until f84 and settled by f88. To f94: the formation gliding up-right as one, each aircraft bobbing <= 1.6 px,
// the camera creeping back, film life. Below his chest he goes soft and dissolves into the lower frame's grey-brown
// ramp (the clip's lower-frame treatment, as cut 6).
// CHAIN = PRODUCTION (the clip's one meaning): every FLYING aircraft carries its chain trail (orange, purple, blue
// copies of its own silhouette stepped straight behind it, the steps opening with its speed to 13 screen px); the
// trail collapses into the photo core as it settles. Never on Kelly.
// No text: no count, no name (the speaker says them; the burned-in captions carry them).
// BUILD NOTE: the photos face right; only the U-2 photo (nose left, no readable lettering) is flipped.
//
// FIGURE (flag for the director): "41 aircraft into production in 40 years" is the speaker's figure. Lockheed
// credits Johnson with a role in more than 40 aircraft designs; not all of them reached production. Nothing of it is
// on screen.
// SOURCES (details and URLs: <working>/animation_source/refs/D/ASSETS_D_READY.md), all public domain:
//   Kelly Johnson, waist up: USAF photo 1966 (with Francis Gary Powers, removed), via NRO / Wikimedia Commons.
//   P-38J 42-68008 over California c.1944 (USAAF); TWA L-049 Constellation NC86507 c.1945 (ETH-Bibliothek Zuerich);
//   P-80A 44-85299, NACA Ames 1948; USAF F-104 DF-ST-82-06481 (1979); USAF U-2 10337 (Davis-Monthan); NASA SR-71B
//   831, EC91-372-13 (1991). Sky: cumulus congestus over Gaseberg, W.carter, CC0 (cut C's plate, copied to D/).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ArchiveCam,
  ArchiveCamera,
  CaptionBands,
  ChainCutOut,
  CutOut,
  FilmLife,
  H,
  Plate,
  W,
  depthTransform,
} from "./archiveShared";

export const FPS = 24000 / 1001;
export const DURATION = 95;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// ---------------------------------------------------------------------------
// ASSETS (public/zach-kelly-johnson/D/; details and sources in refs/D/ASSETS_D_READY.md)
// ---------------------------------------------------------------------------
const D = "zach-kelly-johnson/D/";
/** `faces` = which way the photo's nose points; `size` = length relative to the row's base length (image width) */
type PlaneType = { key: string; src: string; aspect: number; faces: "left" | "right"; size: number };
/** Kelly's aircraft in date order, one row each (oldest lowest) */
const TYPES: PlaneType[] = [
  { key: "p38", src: `${D}cutout_p38_lightning_side_facing-right.png`, aspect: 1085 / 362, faces: "right", size: 0.95 }, // P-38J, 1939
  { key: "l049", src: `${D}cutout_constellation_l049_twa_3q_facing-right.png`, aspect: 1800 / 767, faces: "right", size: 1.12 }, // L-049, 1943
  { key: "p80", src: `${D}cutout_p80_shooting_star_3q_facing-right.png`, aspect: 1096 / 868, faces: "right", size: 0.7 }, // P-80A, 1944
  { key: "f104", src: `${D}cutout_f104_starfighter_side_facing-right.png`, aspect: 1714 / 352, faces: "right", size: 1.0 }, // F-104, 1954
  { key: "u2", src: `${D}cutout_u2_side_3q_facing-left.png`, aspect: 1800 / 730, faces: "left", size: 1.08 }, // U-2, 1955
  { key: "sr71", src: `${D}cutout_sr71_blackbird_side_facing-right.png`, aspect: 1767 / 323, faces: "right", size: 1.15 }, // SR-71B, 1964
];

// Kelly, waist up (860 x 892: head top at source y ~10, chin ~385, head x 375-650, looking down to camera-right;
// the cut's bottom edge is the canopy rail his hands rest on, y ~775 at the right to ~880 at the left). At rest his
// head is ~375 px tall (y 655 -> ~1030, clear of the first caption band). Below his chest he goes soft and dissolves
// into the lower frame's grey-brown (DISSOLVE, RAMP), so the photo has no bottom edge.
const KELLY_SRC = { w: 860, h: 892, headTop: 10, headCx: 512 };
const KELLY_S = 1.0;
const KELLY = {
  src: `${D}cutout_kelly_johnson_waist_up_closeup.png`,
  w: KELLY_SRC.w * KELLY_S,
  aspect: KELLY_SRC.w / KELLY_SRC.h,
  x: 540 - KELLY_SRC.headCx * KELLY_S,
  y: 655 - KELLY_SRC.headTop * KELLY_S,
};
/** the sky: towering cumulus, grey sky above (copied from cut C's plate) */
const SKY = { src: `${D}plate_sky_cumulus.jpg`, w: 2600, h: 1788 };
const SKY_D = 4;
/** the lower frame: a smooth ramp into deep grey-brown, as cut 6's floor (Kelly plane, behind him); grain from FilmLife */
const RAMP = {
  y0: 1120,
  bg: "linear-gradient(to bottom, rgba(44,38,32,0) 0px, rgba(44,38,32,0.3) 90px, rgba(42,36,30,0.62) 200px, rgba(40,34,28,0.82) 320px, rgba(38,32,27,0.9) 440px, rgba(38,32,27,0.92) 1700px)",
};
/** his lower body: the sharp photo fades out over 1150-1300 (Kelly plane y) onto a soft copy that fades out over
 *  1220-1395, above the cut's bottom edge (lowest point y ~1420 at rest) */
const DISSOLVE = {
  sharp: "linear-gradient(to bottom, #000 0px, #000 1150px, rgba(0,0,0,0) 1300px)",
  soft: "linear-gradient(to bottom, #000 0px, #000 1220px, rgba(0,0,0,0) 1395px)",
  blur: 7,
};
/** a plane-sized gradient mask (a gradient, never an image url, so nothing can fail to load) */
const gradMask = (g: string): React.CSSProperties => ({
  WebkitMaskImage: g,
  maskImage: g,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
});

// ---------------------------------------------------------------------------
// THE CAMERA (an analytic curve: it is already moving at f0, which a damped tracker from rest cannot do).
// log k eases from K0 to 1 on s(u) = 1 - (1-u)^3 (1 + 1.5u), u = f / F_LAND: speed 1.5 at f0, peak at u = 1/6 (f14),
// then ONE deceleration lobe to zero at f84; a small linear creep over the whole cut keeps it moving after the
// landing (no stop). (cx, cy) ride the same s.
// ---------------------------------------------------------------------------
const F_LAND = 84;
const RUN_START = 30; // the repeats may begin
const K0 = 2.0;
const CREEP = 0.0005; // log-k per frame
const CAM0 = { x: 500, y: 800 };
const CAM1 = { x: 540, y: 960 };
const camS = (f: number) => {
  const u = Math.min(1, Math.max(0, f / F_LAND));
  return 1 - Math.pow(1 - u, 3) * (1 + 1.5 * u);
};
export const camAt = (f: number): ArchiveCam => {
  const s = camS(f);
  const lk = Math.log(K0) * (1 - s) + CREEP * (F_LAND - f);
  return {
    x: CAM0.x + (CAM1.x - CAM0.x) * s - 0.25 * Math.max(0, f - F_LAND),
    y: CAM0.y + (CAM1.y - CAM0.y) * s + 0.5 * Math.max(0, f - F_LAND),
    k: Math.exp(lk),
    x0: W / 2,
    y0: H / 2,
  };
};

// ---------------------------------------------------------------------------
// THE FORMATION: a level grid of six rows, one type per row in date order (P-38 lowest, SR-71 highest), each row's
// aircraft evenly spaced on one line across ~90 % of the frame, a clear gap between rows. Coordinates are REST px
// (every plane's world px = screen px at k 1, centred (540, 960)); each row sits on its own depth plane (lowest
// nearest), so the pull-back opens the sky with parallax. The grid is laid out where it stands at GLIDE_REF; it
// glides right as one at GLIDE px a frame.
// ---------------------------------------------------------------------------
type RowSpec = { type: number; n: number; len: number; d: number };
const ROWS: RowSpec[] = [
  { type: 0, n: 4, len: 205, d: 1.16 }, // P-38, side
  { type: 1, n: 3, len: 216, d: 1.22 }, // Constellation, 3/4
  { type: 2, n: 3, len: 112, d: 1.28 }, // P-80, 3/4 from above (taller: fewer, smaller)
  { type: 3, n: 3, len: 262, d: 1.34 }, // F-104, side
  { type: 4, n: 3, len: 216, d: 1.4 }, // U-2, side / slight 3/4
  { type: 5, n: 3, len: 266, d: 1.46 }, // SR-71, side
];
/** the formation's heading: rows rise to the right at TILT (the direction of flight) */
const TILT = (4 * Math.PI) / 180;
const HX = Math.cos(TILT);
const HY = -Math.sin(TILT);
const GRID_L = 40; // the grid stands within x 40 -> 1040 at GLIDE_REF
const GRID_R = 1040;
const GRID_BOTTOM = 640; // the lowest point of the lowest row
const ROW_GAP = 16; // added to 0.8 x the mean height of two neighbouring rows (staggered rows interleave a little)
const GLIDE = 0.4; // rest px per frame along the heading: the formation's slow glide
const GLIDE_REF = 90;
const rowH = (r: number) => ROWS[r].len / TYPES[ROWS[r].type].aspect;
// the lattice: rows 2 and 4 on columns A + c SP, the odd rows staggered half a column (A + SP/2 + c SP); the lead row
// of four P-38s spaced evenly over the lattice's whole span
const LAT_A = GRID_L + Math.max(ROWS[0].len, ROWS[2].len, ROWS[4].len) / 2;
const LAT_SP = (GRID_R - Math.max(ROWS[1].len, ROWS[3].len, ROWS[5].len) / 2 - LAT_A) / 2.5;
/** rest y of row r's line at x */
const rowLineY = (r: number, x: number) => ROW_Y[r] - (x - 540) * Math.tan(TILT);
/** row lines at x 540 (rest y), bottom up */
const ROW_Y: number[] = (() => {
  const ys = [GRID_BOTTOM - rowH(0) / 2 - (540 - (LAT_A - ROWS[0].len / 2)) * Math.tan(TILT)];
  for (let r = 1; r < ROWS.length; r++) ys.push(ys[r - 1] - 0.8 * ((rowH(r - 1) + rowH(r)) / 2) - ROW_GAP);
  return ys;
})();

type Slot = { row: number; i: number; x: number; y: number; d: number; len: number };
/** slot i of row r (0 = leftmost), stored where the glide starts from (moved back along the heading) */
const slotOf = (r: number, i: number): Slot => {
  const { len, d } = ROWS[r];
  const x = r === 0 ? LAT_A + (i * 2.5 * LAT_SP) / 3 : LAT_A + (r % 2 ? 0.5 : 0) * LAT_SP + i * LAT_SP;
  const y = rowLineY(r, x);
  return { row: r, i, x: x - GLIDE * GLIDE_REF * HX, y: y - GLIDE * GLIDE_REF * HY, d, len };
};
export const GRID_INFO = { LAT_A, LAT_SP, ROW_Y, slots: ROWS.map((row, r) => Array.from({ length: row.n }, (_, i) => slotOf(r, i))) };

// ---------------------------------------------------------------------------
// THE FLIGHTS. Each row fills from its leading (rightmost) slot back to the left, so nothing ever flies through a
// settled aircraft.
//  * HEROES, one of each type in date order, come out from behind his left shoulder (screen left): straight up the
//    side of his head, then a smooth bend right onto their row line and along it to the leading slot.
//  * REPEATS fly in from the frame's left edge along their own row line to the next slot, rows in date order; within
//    a row each follows only when the one ahead is clear.
// Every flight: a steady cruise in the direction it points, then a deceleration onto the formation's glide.
// ---------------------------------------------------------------------------
const SHOULDER = { x: 270, y: 1085 }; // hidden behind his shoulder, left of his head; the climb column runs between
// every row's first and second slot, so a climbing hero never crosses a settled aircraft
const SPAWN_D = 1.08;
const BEND_RUN = 190; // rest px: the heroes are on their row line this far right of the climb
const HERO_T = [4, 10, 16, 22, 28, 34];
const HERO_V = 54;
const RUN_V = 62;
/** the most aircraft in the air at once: four, five in the last quick run of repeats */
const maxFlying = (f: number) => (f < 62 ? 4 : 5);
const SETTLING = 8; // rest px a frame: slower than this an aircraft is settling into its slot, not flying

type Flight = {
  type: PlaneType;
  slot: Slot;
  hero: boolean;
  t0: number;
  P: [number, number][]; // the path as a polyline, rest px (before the glide)
  L: number;
  V: number;
  Td: number;
  Tc: number;
  tA: number;
  d0: number;
  seed: number;
};

/** a point at parameter u (0..1) along a path given as a polyline (the points evenly spread in u) */
const bez = (P: [number, number][], u: number): [number, number] => {
  const t = Math.min(1, Math.max(0, u)) * (P.length - 1);
  const i = Math.min(P.length - 2, Math.floor(t));
  const k = t - i;
  return [P[i][0] + (P[i + 1][0] - P[i][0]) * k, P[i][1] + (P[i + 1][1] - P[i][1]) * k];
};
/** a cubic Bezier sampled as a polyline of n + 1 points */
const cubicPts = (A: [number, number], B: [number, number], C: [number, number], D: [number, number], n: number) =>
  Array.from({ length: n + 1 }, (_, i): [number, number] => {
    const u = i / n;
    const v = 1 - u;
    const w = [v * v * v, 3 * v * v * u, 3 * v * u * u, u * u * u];
    return [w[0] * A[0] + w[1] * B[0] + w[2] * C[0] + w[3] * D[0], w[0] * A[1] + w[1] * B[1] + w[2] * C[1] + w[3] * D[1]];
  });
const N_LUT = 240;
const lut = (P: [number, number][]) => {
  const out = [0];
  let prev = bez(P, 0);
  for (let i = 1; i <= N_LUT; i++) {
    const q = bez(P, i / N_LUT);
    out.push(out[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1]));
    prev = q;
  }
  return out;
};
const uAt = (T: number[], s: number) => {
  if (s <= 0) return 0;
  if (s >= T[N_LUT]) return 1;
  let lo = 0;
  let hi = N_LUT;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (T[m] < s) lo = m;
    else hi = m;
  }
  return (lo + (s - T[lo]) / (T[hi] - T[lo])) / N_LUT;
};
const timing = (L: number, V: number, Td0: number) => {
  let Td = Td0;
  let Tc = L / V - Td / 3;
  if (Tc < 0) {
    Td = (3 * L) / V;
    Tc = 0;
  }
  return { Td, Tc };
};
/** distance flown at frame f (cruise V, then v = V (1-u)^2 down to rest over Td) */
const flownAt = (fl: { t0: number; V: number; Tc: number; Td: number }, f: number) => {
  const t = f - fl.t0;
  if (t <= 0) return 0;
  if (t <= fl.Tc) return fl.V * t;
  const u = Math.min(1, (t - fl.Tc) / fl.Td);
  return fl.V * fl.Tc + (fl.V * fl.Td * (1 - Math.pow(1 - u, 3))) / 3;
};
/** rest x of the frame's left edge on a plane at depth d, at frame f */
const leftEdgeX = (f: number, d: number) => {
  const t = depthTransform(camAt(f), d);
  return -t.tx / t.k;
};

type PlaneState = { x: number; y: number; d: number; len: number; rot: number; vx: number; vy: number; speed: number; flying: boolean };
/** where a flight is at frame f */
const stateOf = (fl: Flight, T: number[], f: number): PlaneState => {
  const s = Math.min(fl.L, flownAt(fl, f));
  const prog = s / fl.L;
  const u = uAt(T, s);
  const [px, py] = bez(fl.P, u);
  const ue = Math.min(1, u + 0.002);
  const ub = Math.max(0, ue - 0.004);
  const a = bez(fl.P, ub);
  const b = bez(fl.P, ue);
  const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const tx = (b[0] - a[0]) / tl;
  const ty = (b[1] - a[1]) / tl;
  const speed = Math.max(0, flownAt(fl, f + 0.5) - flownAt(fl, f - 0.5));
  // the glide, taken up as it joins the formation
  const g = GLIDE * f * prog; // along the heading
  // life once settled: a slow bob (<= 1.6 px) and a hair of pitch, each on its own time
  const settle = f > fl.tA ? 1 - Math.exp(-(f - fl.tA) / 8) : 0;
  const ph = fl.seed * 2.39;
  const bob = settle * 1.6 * Math.sin(f / 9.5 + ph);
  const pitch = settle * 0.35 * Math.sin(f / 13 + 1.7 * ph);
  const d = fl.d0 + (fl.slot.d - fl.d0) * Math.min(1, prog * 1.1);
  // a hero shrinks a little as it flies away from his shoulder to its row (the same aircraft, farther off)
  const len = (fl.slot.len * fl.slot.d) / d;
  const rot = (Math.atan2(ty, tx) * 180) / Math.PI + pitch;
  return { x: px + g * HX, y: py + g * HY + bob, d, len, rot, vx: tx * speed, vy: ty * speed, speed, flying: f >= fl.t0 && speed > SETTLING };
};

/** chain step in screen px at full speed (the director's 12-14) */
const TRAIL_SCREEN = 13;

// screen-space boxes (0.8 of the photo's box: generous, the silhouettes fill less than their boxes)
type Box = { cx: number; cy: number; hw: number; hh: number; a: number };
const boxOf = (fl: Flight, T: number[], f: number, tall = false): Box => {
  const st = stateOf(fl, T, f);
  const t = depthTransform(camAt(f), st.d);
  const c = t.toScreen(st.x, st.y);
  const len = st.len * t.k;
  // a flying aircraft's box takes in its chain trail (three steps behind it), half each side so the box stays centred
  const trail = st.flying ? 1.5 * TRAIL_SCREEN : 0;
  // `tall`: its full photo height plus a margin (a 3/4 view's wings reach the corners of its box)
  return { cx: c.x, cy: c.y, hw: 0.4 * len + trail, hh: ((tall && st.flying ? 0.5 : 0.4) * len) / fl.type.aspect, a: (st.rot * Math.PI) / 180 };
};
const overlaps = (p: Box, q: Box) => {
  const axes = [p.a, p.a + Math.PI / 2, q.a, q.a + Math.PI / 2];
  for (const ax of axes) {
    const ux = Math.cos(ax);
    const uy = Math.sin(ax);
    const proj = (bx: Box) => Math.abs(bx.hw * (Math.cos(bx.a) * ux + Math.sin(bx.a) * uy)) + Math.abs(bx.hh * (-Math.sin(bx.a) * ux + Math.cos(bx.a) * uy));
    if (Math.abs((q.cx - p.cx) * ux + (q.cy - p.cy) * uy) > proj(p) + proj(q)) return false;
  }
  return true;
};

const FLIGHTS: Flight[] = (() => {
  const out: Flight[] = [];
  const luts: number[][] = [];
  // heroes: the leading slot of each row
  ROWS.forEach((row, r) => {
    const slot = slotOf(r, row.n - 1);
    const P0: [number, number] = [SHOULDER.x, SHOULDER.y];
    const P3: [number, number] = [slot.x, slot.y];
    // the J: up beside his head, bending onto the row line by x SHOULDER.x + BEND_RUN, then straight along the line
    const qx = SHOULDER.x + BEND_RUN;
    const Q: [number, number] = [qx, slot.y + (slot.x - qx) * Math.tan(TILT)];
    const up = P0[1] - Q[1];
    const J = cubicPts(P0, [P0[0] + 0.04 * up, P0[1] - 0.66 * up], [Q[0] - 130 * HX, Q[1] - 130 * HY], Q, 160);
    const runPts = Array.from({ length: 81 }, (_, i): [number, number] => [Q[0] + ((P3[0] - Q[0]) * (i + 1)) / 81, Q[1] + ((P3[1] - Q[1]) * (i + 1)) / 81]);
    // spread the points evenly by length, so the polyline parameter is close to arc length
    const P: [number, number][] = [...J, ...runPts];
    const T = lut(P);
    const L = T[N_LUT];
    const { Td, Tc } = timing(L, HERO_V, 11);
    const t0 = HERO_T[r];
    out.push({ type: TYPES[row.type], slot, hero: true, t0, P, L, V: HERO_V, Td, Tc, tA: t0 + Tc + Td, d0: SPAWN_D, seed: out.length });
    luts.push(T);
  });
  // repeats: rows in date order, each row right to left, in from the left edge of the frame on the row line. Each
  // leaves at the first quarter frame (from RUN_START) at which, over its whole flight, it overlaps no aircraft
  // already scheduled (flying or settled) and no more than maxFlying aircraft are in the air.
  // "in the air" = still flying faster than SETTLING px a frame (the last frames of a deceleration are settling)
  const airborne = (o: Flight, f: number) => f >= o.t0 && flownAt(o, f + 0.5) - flownAt(o, f - 0.5) > SETTLING;
  const flyingAt = (f: number) => out.filter((o) => airborne(o, f)).length;
  ROWS.forEach((row, r) => {
    let prev = out[r].t0; // within a row, strictly right to left: each leaves after the one before it
    for (let i = row.n - 2; i >= 0; i--) {
      const slot = slotOf(r, i);
      const len = slot.len;
      const make = (t0: number): Flight => {
        const x0 = leftEdgeX(t0, slot.d) - len / 2 - 8;
        const P0: [number, number] = [x0, slot.y + (slot.x - x0) * Math.tan(TILT)]; // on the row line
        const P3: [number, number] = [slot.x, slot.y];
        const P: [number, number][] = [P0, [P0[0] + (P3[0] - P0[0]) / 3, P0[1] + (P3[1] - P0[1]) / 3], [P0[0] + (2 * (P3[0] - P0[0])) / 3, P0[1] + (2 * (P3[1] - P0[1])) / 3], P3];
        const L = Math.hypot(P3[0] - P0[0], P3[1] - P0[1]);
        const { Td, Tc } = timing(L, RUN_V, 10);
        return { type: TYPES[row.type], slot, hero: false, t0, P, L, V: RUN_V, Td, Tc, tA: t0 + Tc + Td, d0: slot.d, seed: out.length };
      };
      const ok = (fl: Flight, T: number[]) => {
        for (let f = Math.ceil(fl.t0); f <= Math.min(DURATION - 1, Math.ceil(fl.tA) + 2); f++) {
          if (airborne(fl, f) && flyingAt(f) >= maxFlying(f)) return false;
          const me = boxOf(fl, T, f);
          const meTall = boxOf(fl, T, f, true);
          for (let k = 0; k < out.length; k++) {
            if (f < out[k].t0) continue;
            // two repeats in the air keep a wider berth (their wings and trails), anything else the plain boxes
            const both = !out[k].hero && stateOf(out[k], luts[k], f).flying;
            if (overlaps(both ? meTall : me, boxOf(out[k], luts[k], f, both))) return false;
          }
        }
        return true;
      };
      let t0 = Math.max(RUN_START, prev + 1);
      let fl = make(t0);
      let T = lut(fl.P);
      while (!ok(fl, T) && t0 < 120) {
        t0 += 0.25;
        fl = make(t0);
        T = lut(fl.P);
      }
      out.push(fl);
      luts.push(T);
      prev = fl.t0;
    }
  });
  return out;
})();
const LUTS = FLIGHTS.map((fl) => lut(fl.P));
const stateAt = (i: number, f: number) => stateOf(FLIGHTS[i], LUTS[i], f);

// paint order: farthest row first, within a row in order of departure
const ORDER = FLIGHTS.map((_, i) => i).sort((a, b) => FLIGHTS[b].slot.d - FLIGHTS[a].slot.d || FLIGHTS[a].t0 - FLIGHTS[b].t0);

// ---------------------------------------------------------------------------
// REVIEW AIDS (not drawn): the schedule, and per frame the aircraft in flight and any two aircraft that overlap.
// ---------------------------------------------------------------------------
export const FLIGHT_TABLE = FLIGHTS.map((fl) => ({ type: fl.type.key, row: fl.slot.row, i: fl.slot.i, hero: fl.hero, x: fl.slot.x, y: fl.slot.y, t0: fl.t0, tA: fl.tA, L: fl.L }));
export const auditFrame = (f: number) => {
  const live = FLIGHTS.map((fl, i) => i).filter((i) => f >= FLIGHTS[i].t0);
  const flying = live.filter((i) => stateAt(i, f).flying);
  const hits: string[] = [];
  for (let a = 0; a < live.length; a++)
    for (let b = a + 1; b < live.length; b++) {
      const i = live[a];
      const j = live[b];
      if (overlaps(boxOf(FLIGHTS[i], LUTS[i], f), boxOf(FLIGHTS[j], LUTS[j], f))) hits.push(`${i}${stateAt(i, f).flying ? "*" : ""}x${j}${stateAt(j, f).flying ? "*" : ""}`);
    }
  return { flying: flying.length, hits };
};


const KellysProductionRun: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <AbsoluteFill style={{ backgroundColor: "#262019" }}>
      <FilmLife frame={frame}>
        {/* the sky behind everything, far, soft */}
        <ArchiveCamera cam={cam} d={SKY_D}>
          <Plate src={SKY.src} x={540 - 1050 * (SKY.w / SKY.h)} y={-120} w={2100 * (SKY.w / SKY.h)} h={2100} air={0.35} blur={0.6} />
        </ArchiveCamera>
        {/* the lower frame sinks into deep grey-brown (the clip's lower-frame treatment, as cut 6's floor), behind him */}
        <ArchiveCamera cam={cam} d={1}>
          <div style={{ position: "absolute", left: -900, top: RAMP.y0, width: 2880, height: 1700, background: RAMP.bg }} />
        </ArchiveCamera>
        {/* the aircraft, farthest row first */}
        {ORDER.map((i) => {
          const fl = FLIGHTS[i];
          if (frame < fl.t0) return null;
          const st = stateAt(i, frame);
          const kd = depthTransform(cam, st.d).k;
          const step = Math.min(TRAIL_SCREEN, (TRAIL_SCREEN * st.speed) / (0.8 * fl.V)) / kd;
          const moving = st.flying && step > 1.2;
          const sp = Math.hypot(st.vx, st.vy) || 1;
          const common = {
            src: fl.type.src,
            x: st.x,
            y: st.y,
            w: st.len,
            aspect: fl.type.aspect,
            anchor: "center" as const,
            rotate: st.rot,
            flipX: fl.type.faces === "left",
          };
          return (
            <ArchiveCamera key={i} cam={cam} d={st.d}>
              {moving ? <ChainCutOut {...common} dir={{ dx: -st.vx / sp, dy: -st.vy / sp }} step={step} progress={1} /> : <CutOut {...common} />}
            </ArchiveCamera>
          );
        })}
        {/* Kelly Johnson, the focus plane. His jacket and hands go out of focus and dissolve into the grey-brown
            (a soft copy under the sharp one, each faded out by a gradient mask: no bottom edge to the photo) */}
        <ArchiveCamera cam={cam} d={1}>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, ...gradMask(DISSOLVE.soft) }}>
            <CutOut src={KELLY.src} x={KELLY.x} y={KELLY.y} w={KELLY.w} aspect={KELLY.aspect} anchor="top-left" blur={DISSOLVE.blur} />
          </div>
          <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, ...gradMask(DISSOLVE.sharp) }}>
            <CutOut src={KELLY.src} x={KELLY.x} y={KELLY.y} w={KELLY.w} aspect={KELLY.aspect} anchor="top-left" />
          </div>
        </ArchiveCamera>
      </FilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default KellysProductionRun;
