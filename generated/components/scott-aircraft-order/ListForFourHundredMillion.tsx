// ---------------------------------------------------------------------------
// ListForFourHundredMillion (scott-aircraft-order, cut 30). Cheeky Pint "at sea" look carried into the air
// (styles/cheeky-pint.md § Realistic ocean variant, on the clip's world aircraftShared.tsx). Opaque 1080x1920,
// 23.976 fps, 71 frames. Render with --gl=angle.
//
// CHECK LINE: "each one of those jets costs a mountain of cash."
//
// THE LINE: "those are airplanes that list for $400 million."
// WORD -> FRAME: those f1 · are f4 · airplanes f7-17 · that f17 · list f23 · for f32-44 · $400 f46-54 ·
// million f55-60 (notes/word_frames.txt, S4).
// DURATION: the slot 30.530 -> 33.492 s = 2.962 s x 23.976 = 71 frames (f0..f70).
//
// THE MOTION (REVISION 1, Oct 22): one United 787-10 side-on on the golden-hour apron, seen from a low camera (eye
// 3 m, long lens): the camera is already walking on f0 (the jet glides right ~8-9 px a frame, from the amber fin toward
// the nose; the near cash a little faster, parallax) and eases out into the hero framing by ~f56, then creeps in.
// From f0 bricks of 2-3 banknote bundles (ShipDayRate's bundle: cream-sage notes, an amber bank strap) drop in from
// above the frame, several in the air at once, landing f13 -> f41 in a quickening then easing rhythm, and pile up in
// front of the forward fuselage into a wide stepped heap, set a little askew (the steps' shaded right sides show):
// 8 stacks of 4-6-8-10-10-8-6-4 bundles, the right stacks first, the peak on f30, the fill running on leftward behind
// the walk; the heap is whole on f41, before "$400". Then "$400M" as real 3D type (fourHundredType.tsx: Söhne
// Dreiviertelfett's outlines extruded, stout amber face with a hot top edge, amber-to-umber sides lit by the clip's key
// light, its shadow and contact on the apron) rises out of the apron in front of the heap on "$400" (under the apron on
// f46, first showing f47, settled f58 inside "million"), turned a little like the heap, then lives with the creep.
// Payoff: jet ~1005 px (nose x 30, tail 1035), heap peak y ~701 (the fin's top ~723); the word x ~182-904 (~67 % of
// the width), y ~866-1051, covering the heap's lower half; heap top, nose and fin clear. AMBER = UNITED: its fin, the
// bundles' straps, the price.
// NUMBER ON SCREEN: the user asked for "$400M" in this cut (Oct 22), overriding COMMON.md's no-number decision for cut
// 4 only. It is the speaker's list-price figure; the 787's own list is lower ($292.5M -9, $338.4M -10: notes/FACTS.md).
//
// CONTACT FRAMES (DROPS below): f13 15 17 18 19 20 21 22 22 23 24 25 26 27 28 29 30 32 33 35 37 39 41. Each brick
// falls ~3.6 m a frame up high and slows into its stack (under ~65 px a frame over its last 3 frames), touches on its
// landing frame and rests (no bounce, no click). The word: first above the apron f47, settled f58. Asserted at load:
// every brick sits on its stack and the heap is whole by f42, every brick enters from above the frame top and falls
// wholly inside the frame's width, no two bricks of a stack overlap, the heap's foot stays out of the caption bands;
// the word is hidden on f46, settled on f58, 60-75 % wide, centred, inside y 560-1060.
//
// SOURCES: none on screen. The jet, the apron, the light and the haze are aircraftShared's (787-10, United).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, bloomFilter, clamp01, mixHex } from "../kits/cheeky-pint/stoutShared";
import { AIR_COLOR, AirStage, Jet, LIGHT, airCamAt, airProject, airTrack, fogAmount, type SideCam } from "./aircraftShared";
import { TYPE3D, TYPE_TOP_M, TypeShadow, TypeWord, WORD_RINGS, typeToWorld, type TypePlace } from "./fourHundredType";

export const FPS = 24000 / 1001;
export const DURATION = 71;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
type V3 = [number, number, number];
const D2R = Math.PI / 180;

// ===========================================================================
// THE WORLD: the jet (probe d's placement) and the cash block in front of it
// ===========================================================================
const JET_AT: [number, number] = [0, 98];
/** The heap: COLS stacks of HEIGHTS bundles (a stepped mound, highest in the middle); a bundle's note face is BW x BH
 *  m (ShipDayRate's 140:58), DEEP bundles of BD m stand behind each front one. Its front face is centred on [CX, CZ]
 *  and turned by TURN deg (its right end a little nearer the camera, so the steps' shaded right sides show).
 *  Symbolic size: no count is implied. */
export const PILE = { cols: 8, heights: [4, 6, 8, 10, 10, 8, 6, 4], bw: 2.7, bh: 1.12, deep: 10, bd: 0.6, cx: -2.1, cz: 21, turn: -28 } as const;
const PILE_D = PILE.deep * PILE.bd;
const PILE_W = PILE.cols * PILE.bw;
/** the block's axes: U along its front (left -> right), WD into it (away from the camera) */
const U: [number, number] = [Math.cos(PILE.turn * D2R), Math.sin(PILE.turn * D2R)];
const WD: [number, number] = [-Math.sin(PILE.turn * D2R), Math.cos(PILE.turn * D2R)];
const ORIGIN: [number, number] = [PILE.cx - (U[0] * PILE_W) / 2, PILE.cz - (U[1] * PILE_W) / 2];
/** block-local (u along the front, v up, w back) -> world [X, Y, Z] */
const W3 = (u: number, v: number, w: number): V3 => [ORIGIN[0] + u * U[0] + w * WD[0], v, ORIGIN[1] + u * U[1] + w * WD[1]];

// ===========================================================================
// THE SCHEDULE: 23 bricks of 2-3 bundles, f13 -> f41, spread over the stacks so the heap grows up and outward.
// [landing frame, stack (0 = left), rows from, to]
// ===========================================================================
/** REVISION 1 (user: "put down even faster ... the money is all the way down when he's about to say 400 million"):
 *  the same 23 bricks building the same heap, landing f13 -> f41 (before "$400" at f46): every 2 frames, then every
 *  frame and two on f22, easing out over the last bricks. The heap grows from the right as before, the peak (stack 3)
 *  lands on f30 and the fill runs on leftward behind the walk: a left stack can only land once the walk has brought
 *  its whole fall inside the frame (stack 0 from f39, stack 1 from f32, stack 2 from f26: asserted below). */
const DROPS: [number, number, number, number][] = [
  [13, 6, 0, 3], [15, 5, 0, 3], [17, 7, 0, 2], [18, 4, 0, 3], [19, 6, 3, 6], [20, 5, 3, 6], [21, 3, 0, 3], [22, 7, 2, 4],
  [22, 4, 3, 6], [23, 5, 6, 8], [24, 3, 3, 6], [25, 4, 6, 8], [26, 2, 0, 3], [27, 3, 6, 8], [28, 4, 8, 10], [29, 2, 3, 6],
  [30, 3, 8, 10], [32, 1, 0, 2], [33, 2, 6, 8], [35, 1, 2, 4], [37, 1, 4, 6], [39, 0, 0, 2], [41, 0, 2, 4],
];
/** one falling unit: stack c, bundle rows r0..r1-1 (from the ground), landing on frame L */
type Unit = { c: number; r0: number; r1: number; L: number };
export const UNITS: Unit[] = DROPS.map(([L, c, r0, r1]) => ({ L, c, r0, r1 }));
/** the fall: up high a steady VT m a frame (a heavy drop seen late in its fall), slowing into its stack over the
 *  last frames (TS: under ~60 px a frame near contact) so it touches on L exactly and rests there: no bounce, no
 *  click. Drawn from LIFT_MAX m up, which is above the frame top (asserted below). */
const VT = 3.6;
const TS = 2.5;
const LIFT_MAX = 52;
/** the unit's lift above its landing (m) at frame t (Infinity while it is still above LIFT_MAX: not drawn) */
const liftAt = (u: Unit, t: number) => {
  const tau = u.L - t;
  if (tau <= 0) return 0;
  const lift = VT * (tau + TS * (Math.exp(-tau / TS) - 1));
  return lift > LIFT_MAX ? Infinity : lift;
};

// ===========================================================================
// THE CAMERA: low (3 m) on a long lens, already walking at f0: it slides toward the tail while turning to look
// toward the nose, so the jet glides right past the cash (the near block a little faster: parallax) and the walk
// eases out into the hero framing; a slow creep in to the end
// ===========================================================================
/** frames of walk before f0, so the walk is already moving on f0 */
const PRE = 26;
const CAM0: SideCam = { mode: "side", x: 9.5, y: 3, z: -66, f: 2400, horizon: 930, yaw: 7.5 };
const TRACK_PRE = airTrack(
  CAM0,
  [
    { f0: 0, f1: PRE + 54, to: { x: 0.6, yaw: 0 } },
    { f0: PRE + 30, f1: PRE + 120, to: { f: 2490 } },
  ],
  DURATION + PRE,
);
export const TRACK = TRACK_PRE.slice(PRE);
const camAt = (f: number) => airCamAt(TRACK, f) as SideCam;

// ===========================================================================
// THE BUNDLES (overlay, screen px, pinned to the world with airProject; lit card volumes)
// ===========================================================================
/** ShipDayRate's bundle (local 140 x 58): the notes, the engraving and the strap */
const B = { w: 140, h: 58, strap: 0.2, r: 3, edge: 9 } as const;
const NOTE = { hi: "#DCDFC6", mid: "#C3CAAC", lo: "#9AA287", edgeHi: "#EEEBDA", strapLo: "#C98600", strapInk: "#6E4A10", print: "#4F6250" } as const;
/** the paper-edge faces (top, sides) toned by the key light; the underside; the seams */
const FACE = { lit: "#EEEAD6", shade: "#4C4535", under: "#5A4A38", seam: "#3A2A1C" } as const;
const toneOf = (n: V3) => {
  const l = n[0] * LIGHT.side[0] + n[1] * LIGHT.side[1] + n[2] * LIGHT.side[2];
  return mixHex(FACE.shade, FACE.lit, clamp01((l + 0.5) / 1.3));
};

const P = (cam: SideCam, p: V3) => airProject(cam, p);
const poly = (cam: SideCam, pts: V3[]) =>
  pts
    .map((p, i) => {
      const q = P(cam, p);
      return `${i ? "L" : "M"}${f3(q.x)} ${f3(q.y)}`;
    })
    .join(" ") + "Z";
/** does a face with outward normal n through world point p face the camera */
const faces = (cam: SideCam, n: V3, p: V3) => n[0] * (cam.x - p[0]) + n[1] * (cam.y - p[1]) + n[2] * (cam.z - p[2]) > 0;

/** a box of bundles in block-local metres: stack c (u), rows from v0, `rows` high, the full depth */
type Box = { c: number; v0: number; rows: number };
const N_RIGHT: V3 = [U[0], 0, U[1]];
const N_LEFT: V3 = [-U[0], 0, -U[1]];

/** the faces of a box that are not its front: the side toward the camera (paper edges, a seam per bundle), the top
 *  below the eye (the notes' edges, the straps running back over it) or the underside above it */
const BoxBack: React.FC<{ cam: SideCam; b: Box }> = ({ cam, b }) => {
  const out: React.ReactNode[] = [];
  const u0 = b.c * PILE.bw;
  const u1 = u0 + PILE.bw;
  const v0 = b.v0;
  const v1 = b.v0 + b.rows * PILE.bh;
  const D = PILE_D;
  for (const [u, n, key] of [
    [u1, N_RIGHT, "r"],
    [u0, N_LEFT, "l"],
  ] as const) {
    if (!faces(cam, n, W3(u, (v0 + v1) / 2, D / 2))) continue;
    out.push(<path key={key} d={poly(cam, [W3(u, v0, 0), W3(u, v1, 0), W3(u, v1, D), W3(u, v0, D)])} fill={toneOf(n)} />);
    for (let i = 1; i < PILE.deep; i++) {
      out.push(<path key={`${key}z${i}`} d={poly(cam, [W3(u, v0, i * PILE.bd), W3(u, v1, i * PILE.bd)])} stroke={FACE.seam} strokeOpacity={0.2} strokeWidth={1} fill="none" />);
    }
    for (let r = 1; r < b.rows; r++) {
      out.push(<path key={`${key}y${r}`} d={poly(cam, [W3(u, v0 + r * PILE.bh, 0), W3(u, v0 + r * PILE.bh, D)])} stroke={FACE.seam} strokeOpacity={0.32} strokeWidth={1.1} fill="none" />);
    }
  }
  if (v1 < cam.y - 0.01) {
    const um = (u0 + u1) / 2;
    const sw = PILE.bw * B.strap;
    out.push(<path key="t" d={poly(cam, [W3(u0, v1, 0), W3(u1, v1, 0), W3(u1, v1, D), W3(u0, v1, D)])} fill={toneOf([0, 1, 0])} />);
    for (let i = 1; i < PILE.deep; i++) {
      out.push(<path key={`tz${i}`} d={poly(cam, [W3(u0, v1, i * PILE.bd), W3(u1, v1, i * PILE.bd)])} stroke={FACE.seam} strokeOpacity={0.2} strokeWidth={1} fill="none" />);
    }
    out.push(<path key="ts" d={poly(cam, [W3(um - sw / 2, v1, 0), W3(um + sw / 2, v1, 0), W3(um + sw / 2, v1, D), W3(um - sw / 2, v1, D)])} fill={COLOR.amberTop} />);
  } else if (v0 > cam.y + 0.01) {
    out.push(<path key="u" d={poly(cam, [W3(u0, v0, 0), W3(u1, v0, 0), W3(u1, v0, D), W3(u0, v0, D)])} fill={FACE.under} />);
  }
  return <>{out}</>;
};

/** the affine map of a bundle's front (local 140 x 58) onto its projected face: exact enough for a 2.4 m face */
const frontMatrix = (cam: SideCam, c: number, v: number) => {
  const u0 = c * PILE.bw;
  const tl = P(cam, W3(u0, v + PILE.bh, 0));
  const tr = P(cam, W3(u0 + PILE.bw, v + PILE.bh, 0));
  const bl = P(cam, W3(u0, v, 0));
  const m = [(tr.x - tl.x) / B.w, (tr.y - tl.y) / B.w, (bl.x - tl.x) / B.h, (bl.y - tl.y) / B.h, tl.x, tl.y];
  return `matrix(${m.map((x) => x.toFixed(6)).join(" ")})`;
};

/** the front of each bundle in a box: ShipDayRate's note face, its engraving and the notes' edges */
const BoxFront: React.FC<{ cam: SideCam; b: Box; gid: string }> = ({ cam, b, gid }) => {
  const out: React.ReactNode[] = [];
  const fh = B.h - B.edge;
  const bx = 5;
  const bw = B.w - 10;
  for (let r = 0; r < b.rows; r++) {
    out.push(
      <g key={r} transform={frontMatrix(cam, b.c, b.v0 + r * PILE.bh)}>
        <rect x={0} y={0} width={B.w} height={B.h} rx={B.r} fill={NOTE.lo} />
        <rect x={0} y={0} width={B.w} height={fh} rx={B.r} fill={`url(#${gid}n)`} />
        <rect x={bx} y={4} width={bw} height={fh - 8} rx={2} fill="none" stroke={NOTE.print} strokeWidth={1.6} opacity={0.75} />
        <rect x={bx + 3} y={7} width={bw - 6} height={fh - 14} rx={1.5} fill="none" stroke={NOTE.print} strokeWidth={0.8} opacity={0.45} />
        <ellipse cx={B.w * 0.24} cy={fh / 2} rx={11} ry={fh * 0.32} fill={NOTE.print} opacity={0.32} />
        <ellipse cx={B.w * 0.24} cy={fh / 2} rx={11} ry={fh * 0.32} fill="none" stroke={NOTE.print} strokeWidth={1.2} opacity={0.7} />
        <circle cx={B.w * 0.8} cy={fh / 2} r={fh * 0.2} fill="none" stroke={NOTE.print} strokeWidth={1.1} opacity={0.6} />
        {[
          [bx + 6, 9],
          [bx + bw - 15, 9],
          [bx + 6, fh - 14],
          [bx + bw - 15, fh - 14],
        ].map(([cx, cy], j) => (
          <rect key={j} x={cx} y={cy} width={9} height={5} rx={1} fill={NOTE.print} opacity={0.55} />
        ))}
        <g stroke={NOTE.edgeHi} strokeWidth={0.9} opacity={0.7}>
          {[1.6, 3.6, 5.6].map((ly) => (
            <line key={ly} x1={2} x2={B.w - 2} y1={fh + ly} y2={fh + ly} />
          ))}
        </g>
        <rect x={0} y={0} width={B.w} height={B.h} rx={B.r} fill={`url(#${gid}side)`} />
        <rect x={2} y={0} width={B.w - 4} height={1.4} fill="#FFFBEE" opacity={0.8} />
        <rect x={0} y={B.h - 1.6} width={B.w} height={1.6} fill={FACE.seam} opacity={0.4} />
      </g>,
    );
  }
  return <>{out}</>;
};

/** the amber bank strap round each bundle's front (drawn above every front, under one fixed bloom: the fronts are
 *  coplanar and never overlap, so nothing in front of a strap is skipped) */
const BoxStraps: React.FC<{ cam: SideCam; b: Box; gid: string }> = ({ cam, b, gid }) => {
  const out: React.ReactNode[] = [];
  const sw = B.w * B.strap;
  const fh = B.h - B.edge;
  for (let r = 0; r < b.rows; r++) {
    out.push(
      <g key={r} transform={frontMatrix(cam, b.c, b.v0 + r * PILE.bh)}>
        <rect x={(B.w - sw) / 2} y={-0.6} width={sw} height={B.h + 1.2} fill={`url(#${gid}s)`} />
        <rect x={(B.w - sw) / 2} y={-0.6} width={sw} height={1.6} fill={COLOR.amberHot} opacity={0.9} />
        <rect x={(B.w - sw) / 2 + 4} y={fh / 2 - 2.5} width={sw - 8} height={5} rx={1} fill={NOTE.strapInk} opacity={0.55} />
      </g>,
    );
  }
  return <>{out}</>;
};

/** every box on frame f, in paint order: stacks in the order that lets a nearer neighbour cover a side face; inside a
 *  stack, the box farthest above or below the eye first */
export const boxesAt = (f: number, cam: SideCam) => {
  const top = new Array(PILE.cols).fill(0) as number[];
  for (const u of UNITS) if (f >= u.L) top[u.c] = Math.max(top[u.c], u.r1);
  const per: Box[][] = Array.from({ length: PILE.cols }, () => []);
  for (let c = 0; c < PILE.cols; c++) if (top[c] > 0) per[c].push({ c, v0: 0, rows: top[c] });
  for (const u of UNITS) {
    if (f >= u.L) continue;
    const lift = liftAt(u, f);
    if (!Number.isFinite(lift)) continue;
    per[u.c].push({ c: u.c, v0: u.r0 * PILE.bh + lift, rows: u.r1 - u.r0 });
  }
  const off = (b: Box) => {
    const v1 = b.v0 + b.rows * PILE.bh;
    return cam.y > v1 ? cam.y - v1 : cam.y < b.v0 ? b.v0 - cam.y : 0;
  };
  for (const list of per) list.sort((a, b) => off(b) - off(a));
  // the camera sees the right sides: paint left to right (else right to left)
  const rightSeen = faces(cam, N_RIGHT, W3(PILE_W, 6, PILE_D / 2));
  const order = rightSeen ? per : [...per].reverse();
  return { boxes: order.flat(), top };
};

/** the block's one shadow on the apron: each stack's footprint swept along the sun (it falls right and away) */
const SUN_STEP = { x: -LIGHT.side[0] / LIGHT.side[1], z: -LIGHT.side[2] / LIGHT.side[1] };
const hull = (pts: [number, number][]) => {
  const p = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo: [number, number][] = [];
  for (const q of p) {
    while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop();
    lo.push(q);
  }
  const hi: [number, number][] = [];
  for (const q of [...p].reverse()) {
    while (hi.length >= 2 && cross(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop();
    hi.push(q);
  }
  return [...lo.slice(0, -1), ...hi.slice(0, -1)];
};
const PileShadow: React.FC<{ cam: SideCam; top: number[] }> = ({ cam, top }) => {
  const parts: string[] = [];
  const foot: string[] = [];
  for (let c = 0; c < PILE.cols; c++) {
    if (top[c] <= 0) continue;
    const h = top[c] * PILE.bh;
    const u0 = c * PILE.bw;
    const u1 = u0 + PILE.bw;
    const base = [W3(u0, 0, 0), W3(u1, 0, 0), W3(u1, 0, PILE_D), W3(u0, 0, PILE_D)].map((p) => [p[0], p[2]] as [number, number]);
    const swept = base.map(([x, z]) => [x + SUN_STEP.x * h, z + SUN_STEP.z * h] as [number, number]);
    parts.push(poly(cam, hull([...base, ...swept]).map(([x, z]) => [x, 0, z] as V3)));
    // the contact shadow: the footprint a little larger, dark and tight
    foot.push(poly(cam, [W3(u0 - 0.15, 0, -0.35), W3(u1 + 0.15, 0, -0.35), W3(u1 + 0.15, 0, PILE_D), W3(u0 - 0.15, 0, PILE_D)]));
  }
  if (!parts.length) return null;
  const s = P(cam, [PILE.cx, 0, PILE.cz]).s;
  return (
    <>
      <g style={{ filter: `blur(${f3(Math.max(1, s * 0.16))}px)` }} opacity={0.4}>
        <path d={parts.join(" ")} fill={COLOR.shadow} />
      </g>
      <g style={{ filter: `blur(${f3(Math.max(1, s * 0.07))}px)` }} opacity={0.42}>
        <path d={foot.join(" ")} fill={COLOR.shadow} />
      </g>
    </>
  );
};

/** the overlay (pure: AirStage mounts it twice, once for the amber pass) */
const Cash: React.FC<{ cam: SideCam; f: number }> = ({ cam, f }) => {
  const gid = `lfm${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const { boxes, top } = boxesAt(f, cam);
  // fog by the block's own distance (it stands in the near air: next to none)
  const fog = fogAmount(P(cam, [PILE.cx, 6, PILE.cz]).d);
  return (
    <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
      <defs>
        <linearGradient id={`${gid}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={NOTE.hi} />
          <stop offset="0.5" stopColor={NOTE.mid} />
          <stop offset="1" stopColor={NOTE.lo} />
        </linearGradient>
        <linearGradient id={`${gid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={NOTE.strapLo} />
        </linearGradient>
        <linearGradient id={`${gid}side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.14" />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#3A2A1C" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      <PileShadow cam={cam} top={top} />
      {boxes.map((b, i) => (
        <g key={i}>
          <BoxBack cam={cam} b={b} />
          <BoxFront cam={cam} b={b} gid={gid} />
        </g>
      ))}
      <g style={{ filter: bloomFilter(1.8) }}>
        {boxes.map((b, i) => (
          <BoxStraps key={i} cam={cam} b={b} gid={gid} />
        ))}
      </g>
      {fog > 0.002 ? <rect x={0} y={0} width={1080} height={1920} fill={mixHex(AIR_COLOR.haze, AIR_COLOR.glow, 0.5)} opacity={f3(fog)} /> : null}
    </svg>
  );
};

// ===========================================================================
// THE WORD (REVISION 1, user: "text comes up over or in front of the money, 3D type text in the stripe font ...
// $400M"): extruded Söhne Dreiviertelfett standing on the apron in front of the heap, turned a little like it; it
// rises out of the apron on "$400" (f46: under the apron, first showing on f47) and is settled before "million"
// ends (f58), then lives with the creep. fourHundredType.tsx draws it.
// ===========================================================================
export const WORD = { at: [0.35, -3] as [number, number], turn: -16, rise0: 46, rise1: 58 } as const;
export const wordAt = (f: number): TypePlace => {
  const t = interpolate(f, [WORD.rise0, WORD.rise1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.2, 0.55, 0.25, 1) });
  return { at: WORD.at, turn: WORD.turn, rise: -TYPE_TOP_M * (1 - t) };
};

// ===========================================================================
// THE CUT
// ===========================================================================
/** the overlay (pure: AirStage mounts it twice): the cash, the word's shadow on the apron, the word */
const Overlay: React.FC<{ cam: SideCam; f: number }> = ({ cam, f }) => {
  const w = wordAt(f);
  return (
    <>
      <Cash cam={cam} f={f} />
      <TypeShadow cam={cam} p={w} />
      <TypeWord cam={cam} p={w} />
    </>
  );
};

const ListForFourHundredMillion: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  return (
    <AbsoluteFill>
      <AirStage cam={cam} S={f + 400} rest={TRACK[0]} world={<Jet type="B787_10" airline="united" at={JET_AT} heading={-90} />} overlay={<Overlay cam={cam} f={f} />} />
    </AbsoluteFill>
  );
};

export default ListForFourHundredMillion;

// ---------------------------------------------------------------------------
// Load-time checks: the rules the cut rests on.
// ---------------------------------------------------------------------------
{
  // (a bun probe of the numbers sets globalThis.__lfmProbe to list every failure instead of stopping on the first)
  const probe = (globalThis as { __lfmProbe?: boolean }).__lfmProbe === true;
  const fail = (m: string) => {
    if (probe) console.log(`FAIL ${m}`);
    else throw new Error(`ListForFourHundredMillion: ${m}`);
  };
  // the bricks fill the block exactly, each on top of the last in its stack, and it is whole inside "million"
  {
    const h = new Array(PILE.cols).fill(0) as number[];
    for (const u of UNITS) {
      if (u.r0 !== h[u.c] || u.r1 - u.r0 < 2 || u.r1 - u.r0 > 3) fail(`a brick of stack ${u.c} landing f${u.L} does not sit on its stack`);
      h[u.c] = u.r1;
    }
    if (h.some((v, c) => v !== PILE.heights[c])) fail(`the heap is not whole at the end (${h.join(",")})`);
    if (UNITS[UNITS.length - 1].L > 42) fail("the block completes after f42 (before \"$400\" at f46)");
  }
  // each unit enters from above the frame (wholly above y 0 on its first drawn frame)
  for (const u of UNITS) {
    let t0 = u.L - 40;
    while (!Number.isFinite(liftAt(u, t0))) t0++;
    const cam = camAt(t0);
    const v = u.r0 * PILE.bh + liftAt(u, t0);
    for (const p of [W3(u.c * PILE.bw, v, 0), W3((u.c + 1) * PILE.bw, v, PILE_D)]) {
      const q = airProject(cam, p);
      if (q.y > -2) fail(`a unit of stack ${u.c} landing on f${u.L} is already in frame (y ${q.y.toFixed(0)}) on its first frame`);
    }
  }
  // every unit falls wholly inside the frame's width, on every frame it is drawn
  for (const u of UNITS) {
    for (let t = u.L - 40; t <= u.L; t++) {
      if (!Number.isFinite(liftAt(u, t))) continue;
      const cam = camAt(t);
      const v = u.r0 * PILE.bh + liftAt(u, t);
      if (airProject(cam, W3((u.c + 1) * PILE.bw, v, 0)).y < 0) continue; // still above the frame
      const xs = [W3(u.c * PILE.bw, v, 0), W3((u.c + 1) * PILE.bw, v, 0), W3((u.c + 1) * PILE.bw, v, PILE_D)].map((p) => airProject(cam, p).x);
      if (Math.min(...xs) < 24 || Math.max(...xs) > 1056) fail(`stack ${u.c} (landing f${u.L}) is cut by the frame edge on f${t}`);
    }
  }
  // no two units of a stack ever overlap (quarter frames)
  for (let t = 0; t <= DURATION; t += 0.25) {
    for (let c = 0; c < PILE.cols; c++) {
      const us = UNITS.filter((u) => u.c === c);
      for (let i = 1; i < us.length; i++) {
        const lo = us[i - 1];
        const hi = us[i];
        const loTop = lo.r1 * PILE.bh + (t >= lo.L ? 0 : liftAt(lo, t));
        const hiBot = hi.r0 * PILE.bh + (t >= hi.L ? 0 : liftAt(hi, t));
        if (Number.isFinite(loTop) && Number.isFinite(hiBot) && hiBot < loTop - 1e-6) fail(`stack ${c}: units landing f${lo.L}/f${hi.L} overlap at t ${t}`);
      }
    }
  }
  // the block's foot stays above the first caption band from its first landing on
  for (let f = UNITS[0].L; f < DURATION; f++) {
    const cam = camAt(f);
    for (const p of [W3(0, 0, 0), W3(PILE_W, 0, 0)]) {
      const y = airProject(cam, p).y;
      if (y > 1078) fail(`the block's foot is at y ${y.toFixed(0)} on f${f} (caption band)`);
    }
  }
  // the word: wholly under the apron on f46 (it comes UP on "$400", no pop before it), settled by f58; at rest
  // 60-75 % of the frame wide, centred, all of it inside y 560-1060 (above the first caption band)
  {
    const box = (f: number) => {
      const cam = camAt(f);
      const p = wordAt(f);
      let x0 = 1e9;
      let x1 = -1e9;
      let y0 = 1e9;
      let y1 = -1e9;
      for (const g of WORD_RINGS)
        for (const r of g)
          for (const [x, y] of r)
            for (const z of [0, -TYPE3D.depth]) {
              const w = typeToWorld(p, x, y, z);
              if (w[1] < 0) continue;
              const q = airProject(cam, w);
              x0 = Math.min(x0, q.x);
              x1 = Math.max(x1, q.x);
              y0 = Math.min(y0, q.y);
              y1 = Math.max(y1, q.y);
            }
      return { x0, x1, y0, y1 };
    };
    if (wordAt(WORD.rise0).rise > -TYPE_TOP_M + 1e-6) fail("the word shows before f46");
    if (Math.abs(wordAt(WORD.rise1).rise) > 1e-6) fail("the word is not settled by f58");
    for (let f = WORD.rise0 + 1; f < DURATION; f++) {
      const b = box(f);
      if (b.y1 > 1060 || b.y0 < 560) fail(`the word spans y ${b.y0.toFixed(0)}-${b.y1.toFixed(0)} on f${f}`);
      if (f >= WORD.rise1) {
        const w = b.x1 - b.x0;
        if (w < 0.6 * 1080 || w > 0.75 * 1080) fail(`the word is ${w.toFixed(0)} px wide on f${f}`);
        if (Math.abs((b.x0 + b.x1) / 2 - 540) > 40) fail(`the word is off centre on f${f}`);
      }
    }
  }
}
