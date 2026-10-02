import React from "react";
import { AbsoluteFill } from "remotion";
import { loadFont } from "@remotion/google-fonts/RobotoCondensed";
import {
  ACCENT,
  ACCENT_DEEP,
  BG_BASE,
  BG_DIM,
  FRAME_H,
  FRAME_W,
  GridBackground,
  SHADOW_BLUR,
  SHADOW_OPACITY,
  SHADOW_Y,
  Vignette,
  clamp01,
  iconShadow,
  smoothstep,
  squirclePath,
  sway,
} from "./fieldShared";
import { arriveEase } from "./levelUp";
import {
  AXIS_END,
  AXIS_X0,
  BAND_LABEL_X,
  BAND_TINT,
  BAND_X0,
  BAND_X1,
  CAP_EM,
  DASH,
  DASH_GAP,
  DATA_W,
  DOT_R,
  HATCH_PITCH,
  HEAD_R,
  INK,
  INK_HI,
  INK_LO,
  INK_W,
  K_REF,
  LEN_P10,
  LEN_P7Z,
  LEN_P8,
  LEN_ZERO,
  MARCH_W,
  P10,
  P7Z,
  P8,
  Q2_X,
  Q3_X,
  RISE_PX,
  S_BREAK,
  TICK_HALF,
  TRACK_EM,
  Y0,
  ZERO_PT,
  ZERO_X,
  cameraTrack,
  easeInCubic,
  easeOutCubic,
  enterFrom,
  enterU,
  exitU,
  labelPx,
  lineYAtX,
  lookOf,
  pathD,
  pathPoint,
  pathPoints,
  rungEase,
  sAtLen,
  sAtX,
  sinkE,
  sz,
  tipAt,
  tipLen,
  yOf,
} from "./chinaGrowthGeom";
import type { Cam, Glide, Pt } from "./chinaGrowthGeom";

// ---------------------------------------------------------------------------
// chinaGrowthShared — the materials, the Stage, the base world (everything
// builder A owns, through S 1087) and camA (the camera for S 0-601). Builder A
// owns this file; B and C import from it and never edit it. Every export below
// that is listed in briefs/WORLD_READY.md keeps its name and signature.
//
// CONVENTIONS for every material:
//   * coordinates are WORLD px; `k` is the current camera zoom (cam.k), which
//     drives the size law sz(k) for strokes, radii, label sizes, dash lengths
//     and hatch pitch, and iconShadow(k).
//   * `appear` / `exit` / `grow` are RAW linear progress 0..1 (use enterU /
//     enterFrom / exitU / a clamp01 ramp); the component applies the house
//     curves (slide ease-out cubic + smoothstep fade; scale-in ease-out cubic).
//   * `draw` is the FINAL drawn fraction 0..1 of a path or ring; the caller
//     picks its ease (arriveEase for a head that lands).
//   * `rung` is the white opacity (INK_HI 1.0 / INK_LO 0.5, eased between by
//     the caller with rungEase over 12 f).
// ---------------------------------------------------------------------------

const ROBOTO = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
export const FONT_LABEL = ROBOTO.fontFamily;

export type Anchor = "start" | "middle" | "end";
export type LabelSize = "value" | "word";

/** What the Stage is looking through right now: the camera and the sway, so a
 *  material can find its own SCREEN position (the label edge-fade). Provided by
 *  Stage; null outside one. */
export type StageView = { cam: Cam; dx: number; dy: number };
const StageViewContext = React.createContext<StageView | null>(null);
/** The label edge-fade margin, screen px. */
export const EDGE_SAFE = 48;
/** 1 when the world box [x0, x1] x [y0, y1] sits >= EDGE_SAFE screen px inside
 *  every frame edge, 0 when any part of it touches an edge, smoothstep between
 *  (director, round 2: no label may ever show clipped by the frame). */
export const edgeFactor = (view: StageView | null, x0: number, y0: number, x1: number, y1: number) => {
  if (!view) return 1;
  const { cam, dx, dy } = view;
  const sx0 = FRAME_W / 2 + (x0 - cam.x) * cam.k + dx;
  const sx1 = FRAME_W / 2 + (x1 - cam.x) * cam.k + dx;
  const sy0 = FRAME_H / 2 + (y0 - cam.y) * cam.k + dy;
  const sy1 = FRAME_H / 2 + (y1 - cam.y) * cam.k + dy;
  return smoothstep(Math.min(sx0, FRAME_W - sx1, sy0, FRAME_H - sy1) / EDGE_SAFE);
};
/** The world box of a label's ink: its advance width by anchor, and the caps
 *  plus a little room for overshoot and Q's tail. */
const labelBox = (x: number, yCap: number, w: number, fs: number, anchor: Anchor) => {
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const capH = CAP_EM * fs;
  return { x0, x1: x0 + w, y0: yCap - capH / 2 - 0.06 * fs, y1: yCap + capH / 2 + 0.14 * fs };
};

/** A label: Roboto Condensed Bold, ALL CAPS, tracked 0.04 em and compensated so
 *  a centred label is truly centred. (x, y): the anchor point of the CAPITALS'
 *  box — y is the vertical centre of the caps. Enters by sliding UP 24 screen px
 *  while fading in (12 f), exits by the reverse (10 f). */
export const Label: React.FC<{
  text: string;
  x: number;
  y: number;
  k: number;
  size: LabelSize;
  rung?: number;
  appear?: number;
  exit?: number;
  anchor?: Anchor;
  color?: string;
}> = ({ text, x, y, k, size, rung = INK_HI, appear = 1, exit = 0, anchor = "middle", color = INK }) => {
  const view = React.useContext(StageViewContext);
  const a = clamp01(appear);
  const e = clamp01(exit);
  const fs = labelPx(size, k);
  const lift = ((1 - easeOutCubic(a)) + easeInCubic(e)) * (RISE_PX / k);
  const box = labelBox(x, y + lift, labelWidth(text, size, k), fs, anchor);
  const op = rung * smoothstep(a) * (1 - smoothstep(e)) * edgeFactor(view, box.x0, box.y0, box.x1, box.y1);
  if (op <= 0.002) return null;
  const comp = anchor === "middle" ? TRACK_EM / 2 : anchor === "end" ? TRACK_EM : 0;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={op.toFixed(4)}>
      <text
        x={(x + comp * fs).toFixed(3)}
        y={(y + lift + (CAP_EM / 2) * fs).toFixed(3)}
        fontFamily={FONT_LABEL}
        fontWeight={700}
        fontSize={fs.toFixed(3)}
        letterSpacing={`${TRACK_EM}em`}
        textAnchor={anchor}
        fill={color}
      >
        {text.toUpperCase()}
      </text>
    </g>
  );
};

/** Approximate advance width of a label, world px (Roboto Condensed Bold caps,
 *  slightly generous), for layout and clearance checks. */
export const labelWidth = (text: string, size: LabelSize, k: number) => {
  const fs = labelPx(size, k);
  let em = 0;
  for (const ch of text.toUpperCase()) {
    if (ch === " ") em += 0.25;
    else if (ch === "%") em += 0.72;
    else if (ch === "." || ch === ",") em += 0.24;
    else if (ch === "–") em += 0.5;
    else if (ch >= "0" && ch <= "9") em += 0.52;
    else if (ch === "I") em += 0.26;
    else if (ch === "M" || ch === "W") em += 0.7;
    else em += 0.55;
    em += TRACK_EM;
  }
  return (em - TRACK_EM) * fs;
};
/** Cap height of a label class at k, world px. */
export const labelCapH = (size: LabelSize, k: number) => CAP_EM * labelPx(size, k);

/** A solid dot (the tip, a vertex). r is the base radius at K_REF. Scales in
 *  from 0 over the caller's 8 f `grow` (raw), ease-out. */
export const Dot: React.FC<{
  x: number;
  y: number;
  k: number;
  grow?: number;
  r?: number;
  color?: string;
  opacity?: number;
}> = ({ x, y, k, grow = 1, r = DOT_R, color = ACCENT, opacity = 1 }) => {
  const g = easeOutCubic(grow);
  if (g <= 0.001 || opacity <= 0.002) return null;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={opacity}>
      <circle cx={x.toFixed(3)} cy={y.toFixed(3)} r={(r * sz(k) * g).toFixed(3)} fill={color} />
    </g>
  );
};

/** A white ring that DRAWS as an arc sweep. r = base radius at K_REF; `draw` is
 *  the final swept fraction; the sweep starts at `startDeg` (-90 = 12 o'clock)
 *  and runs clockwise (dir 1) or anticlockwise (dir -1). */
export const Ring: React.FC<{
  x: number;
  y: number;
  k: number;
  r: number;
  draw?: number;
  rung?: number;
  startDeg?: number;
  dir?: 1 | -1;
  color?: string;
  width?: number;
}> = ({ x, y, k, r, draw = 1, rung = INK_HI, startDeg = -90, dir = 1, color = INK, width = INK_W }) => {
  const d = clamp01(draw);
  if (d <= 0.001 || rung <= 0.002) return null;
  const R = r * sz(k);
  const w = width * sz(k);
  return (
    <g style={{ filter: iconShadow(k) }} opacity={rung.toFixed(4)}>
      <circle
        cx={0}
        cy={0}
        r={R.toFixed(3)}
        fill="none"
        stroke={color}
        strokeWidth={w.toFixed(3)}
        pathLength={1}
        strokeDasharray={d >= 0.9999 ? undefined : `${d.toFixed(5)} 1`}
        strokeLinecap="round"
        transform={`translate(${x.toFixed(3)} ${y.toFixed(3)}) rotate(${startDeg.toFixed(3)}) scale(1 ${dir})`}
      />
    </g>
  );
};

/** A vertical tick centred on (x, y) — on the axis, (x, Y0). Scales in from its
 *  centre over the caller's raw `grow`. half = base half-length at K_REF. */
export const Tick: React.FC<{
  x: number;
  y: number;
  k: number;
  grow?: number;
  rung?: number;
  half?: number;
  color?: string;
}> = ({ x, y, k, grow = 1, rung = INK_HI, half = TICK_HALF, color = INK }) => {
  const g = easeOutCubic(grow);
  if (g <= 0.001 || rung <= 0.002) return null;
  const h = half * sz(k) * g;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={rung.toFixed(4)}>
      <line
        x1={x.toFixed(3)}
        y1={(y - h).toFixed(3)}
        x2={x.toFixed(3)}
        y2={(y + h).toFixed(3)}
        stroke={color}
        strokeWidth={(INK_W * sz(k)).toFixed(3)}
        strokeLinecap="round"
      />
    </g>
  );
};

// --- polyline helpers --------------------------------------------------------
const cumLen = (pts: Pt[]) => {
  const c: number[] = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return c;
};
const pointAt = (pts: Pt[], cum: number[], s: number): Pt => {
  if (pts.length === 1) return pts[0];
  const L = cum[cum.length - 1];
  const t = Math.max(0, Math.min(L, s));
  let i = 0;
  while (i < cum.length - 2 && cum[i + 1] < t) i++;
  const seg = cum[i + 1] - cum[i];
  const u = seg > 0 ? (t - cum[i]) / seg : 0;
  return { x: pts[i].x + (pts[i + 1].x - pts[i].x) * u, y: pts[i].y + (pts[i + 1].y - pts[i].y) * u };
};
/** The sub-polyline [s0, s1] of `pts` as an SVG path `d`. */
const subD = (pts: Pt[], cum: number[], s0: number, s1: number, dx = 0, dy = 0) => {
  const a = pointAt(pts, cum, s0);
  const parts = [`M${(a.x + dx).toFixed(2)} ${(a.y + dy).toFixed(2)}`];
  for (let i = 1; i < pts.length - 1; i++) {
    if (cum[i] > s0 && cum[i] < s1) parts.push(`L${(pts[i].x + dx).toFixed(2)} ${(pts[i].y + dy).toFixed(2)}`);
  }
  const b = pointAt(pts, cum, s1);
  parts.push(`L${(b.x + dx).toFixed(2)} ${(b.y + dy).toFixed(2)}`);
  return parts.join("");
};
/** Polyline length, world px. */
export const polyLen = (pts: Pt[]) => {
  const c = cumLen(pts);
  return c[c.length - 1];
};
/** The point at arc length s along a polyline. */
export const polyPoint = (pts: Pt[], s: number) => pointAt(pts, cumLen(pts), s);

/** Head opacity for a head-led draw: in over the first `inF`, out over the last
 *  `outF` of the draw (fractions). inF 0 = already visible at draw 0. */
const headOpacity = (d: number, inF: number, outF: number) =>
  (inF > 0 ? smoothstep(d / inF) : 1) * (outF > 0 ? 1 - smoothstep((d - (1 - outF)) / outF) : 1);

/** A solid line drawn head-first along `points`: the drawn part is [0, draw],
 *  and a small white head (r = HEAD_R x stroke) rides its end, fading in at
 *  the start and out at the end (headIn / headOut = fractions of the draw). */
export const HeadLedPath: React.FC<{
  points: Pt[];
  k: number;
  draw?: number;
  rung?: number;
  width?: number;
  color?: string;
  head?: boolean;
  headIn?: number;
  headOut?: number;
}> = ({ points, k, draw = 1, rung = INK_HI, width = INK_W, color = INK, head = true, headIn = 0.08, headOut = 0.08 }) => {
  const d = clamp01(draw);
  if (d <= 0.0005 || rung <= 0.002 || points.length < 2) return null;
  const cum = cumLen(points);
  const L = cum[cum.length - 1] * d;
  const w = width * sz(k);
  const hp = pointAt(points, cum, L);
  const ho = head ? headOpacity(d, headIn, headOut) : 0;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={rung.toFixed(4)}>
      <path
        d={subD(points, cum, 0, L)}
        fill="none"
        stroke={color}
        strokeWidth={w.toFixed(3)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {ho > 0.002 ? (
        <circle cx={hp.x.toFixed(3)} cy={hp.y.toFixed(3)} r={(HEAD_R * w).toFixed(3)} fill={INK} opacity={ho.toFixed(4)} />
      ) : null}
    </g>
  );
};

/** What a DashedPath's per-dash hook may return for one dash. */
export type DashMod = { dx?: number; dy?: number; opacity?: number } | null;
/** A dashed white line drawn head-first along `points`, dashes marching toward
 *  the head on S. Dash DASH / gap DASH_GAP world px at K_REF through sz(k); the
 *  pattern is anchored at the path's start and marches MARCH_W world px per S
 *  frame at K_REF. `dashMod(i, sMid, total)` (optional) moves or fades dash i
 *  (a stable identity as it marches; sMid = its centre's arc length): B uses it
 *  to sink and fade dashes one by one. */
export const DashedPath: React.FC<{
  points: Pt[];
  k: number;
  S: number;
  draw?: number;
  rung?: number;
  width?: number;
  color?: string;
  head?: boolean;
  headIn?: number;
  headOut?: number;
  march?: boolean;
  dashMod?: (i: number, sMid: number, total: number) => DashMod;
}> = ({
  points,
  k,
  S,
  draw = 1,
  rung = INK_HI,
  width = INK_W,
  color = INK,
  head = true,
  headIn = 0.08,
  headOut = 0.08,
  march = true,
  dashMod,
}) => {
  const d = clamp01(draw);
  if (d <= 0.0005 || rung <= 0.002 || points.length < 2) return null;
  const cum = cumLen(points);
  const total = cum[cum.length - 1];
  const L = total * d;
  const s = sz(k);
  const P = (DASH + DASH_GAP) * s;
  const D = DASH * s;
  const w = width * s;
  // phase in DASH units: marching MARCH_W world px per frame at K_REF
  const phase = march ? (MARCH_W * S) / (DASH + DASH_GAP) : 0;
  const i0 = Math.floor(-phase - 1);
  const i1 = Math.ceil(L / P - phase + 1);
  const dashes: React.ReactNode[] = [];
  for (let i = i0; i <= i1; i++) {
    const a = (i + phase) * P;
    const b = a + D;
    const s0 = Math.max(0, a);
    const s1 = Math.min(L, b);
    if (s1 - s0 <= 0.05) continue;
    const mod = dashMod ? dashMod(i, (a + b) / 2, total) : null;
    const op = mod && mod.opacity !== undefined ? mod.opacity : 1;
    if (op <= 0.002) continue;
    dashes.push(
      <path
        key={i}
        d={subD(points, cum, s0, s1, mod?.dx ?? 0, mod?.dy ?? 0)}
        opacity={op < 1 ? op.toFixed(4) : undefined}
      />,
    );
  }
  const hp = pointAt(points, cum, L);
  const ho = head ? headOpacity(d, headIn, headOut) : 0;
  return (
    <g style={{ filter: iconShadow(k) }} opacity={rung.toFixed(4)}>
      <g fill="none" stroke={color} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round">
        {dashes}
      </g>
      {ho > 0.002 ? (
        <circle cx={hp.x.toFixed(3)} cy={hp.y.toFixed(3)} r={(HEAD_R * w).toFixed(3)} fill={INK} opacity={ho.toFixed(4)} />
      ) : null}
    </g>
  );
};

/** A world-space hatch (parallel lines at `angleDeg`, pitch HATCH_PITCH at K_REF
 *  through sz(k)) clipped to a closed `region`. The line family is anchored at
 *  `anchor` (world), so the lines stay put while the region grows. `id` must be
 *  unique in the frame. Not opaque-tinted: lines only. */
export const HatchFill: React.FC<{
  id: string;
  region: Pt[];
  k: number;
  color?: string;
  rung?: number;
  pitch?: number;
  angleDeg?: number;
  width?: number;
  anchor?: Pt;
}> = ({ id, region, k, color = ACCENT_DEEP, rung = 1, pitch = HATCH_PITCH, angleDeg = 45, width = INK_W, anchor }) => {
  if (region.length < 3 || rung <= 0.002) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of region) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  if (maxX - minX < 0.5 || maxY - minY < 0.5) return null;
  const s = sz(k);
  const pw = pitch * s;
  const a = (angleDeg * Math.PI) / 180;
  const dir = { x: Math.cos(a), y: Math.sin(a) };
  const nrm = { x: -dir.y, y: dir.x };
  const an = anchor ?? { x: minX, y: minY };
  const corners = [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: minX, y: maxY },
    { x: maxX, y: maxY },
  ];
  let nMin = Infinity;
  let nMax = -Infinity;
  for (const c of corners) {
    const v = (c.x - an.x) * nrm.x + (c.y - an.y) * nrm.y;
    nMin = Math.min(nMin, v);
    nMax = Math.max(nMax, v);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = Math.hypot(maxX - minX, maxY - minY);
  const lines: React.ReactNode[] = [];
  for (let i = Math.floor(nMin / pw); i <= Math.ceil(nMax / pw); i++) {
    const off = i * pw;
    // the point on line i nearest the bbox centre
    const t = (cx - an.x) * nrm.x + (cy - an.y) * nrm.y - off;
    const px = cx - nrm.x * t;
    const py = cy - nrm.y * t;
    lines.push(
      <line
        key={i}
        x1={(px - dir.x * half).toFixed(2)}
        y1={(py - dir.y * half).toFixed(2)}
        x2={(px + dir.x * half).toFixed(2)}
        y2={(py + dir.y * half).toFixed(2)}
      />,
    );
  }
  const poly = region.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("") + "Z";
  return (
    <g opacity={rung < 1 ? rung.toFixed(4) : undefined}>
      <defs>
        <clipPath id={id}>
          <path d={poly} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${id})`} stroke={color} strokeWidth={(width * s).toFixed(3)} strokeLinecap="butt">
        {lines}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// CAMERA A — S 0-601, one track (cut 2 picks up the picture cut 1 left
// standing). Looks (content centres) and zooms, glide by glide; the follower
// lags a target by ~5 f, so a glide ends ~5 f before the framing it lands.
// ---------------------------------------------------------------------------
export const CAM_A_START: Cam = { x: 500, y: 1515, k: 0.95 }; // LOOK at S 0: line entry ~160 px in, axis ~y 1296
/** A glide written as an ABSOLUTE waypoint (look x, look y, k); GLIDES_A turns
 *  them into deltas, so retuning one waypoint never moves the ones after it. */
type Way = { f0: number; f1: number; x: number; y: number; k: number; warp?: number; even?: number };
const WAYS_A: Way[] = [
  // (a) "We had China growing": the establishing frame (line enters high, the
  //     axis draws across low), alive with a slight creep in that the push
  //     picks up
  { f0: 0, f1: 40, x: 497, y: 1505, k: 0.98 },
  // (b) "10, 7, 8 percent": ONE push-in onto the zigzag, landing before "8"
  //     settles; the axis leaves the bottom of the frame
  { f0: 20, f1: 58, x: 430, y: 1160, k: 1.5 },
  // (c) "Things were looking great": follows right along the hump at that zoom
  { f0: 50, f1: 112, x: 650, y: 1168, k: 1.5 },
  // "And now we're in a world where": rides the slide down-right, breathing out
  //     so the axis is back in at the bottom by ~S 200
  { f0: 106, f1: 196, x: 900, y: 1540, k: 1.2 },
  // "what's our latest Rhodium forecast?": looks AHEAD to 2026
  // (fast early, so FORECAST enters inside the frame's right margin; a long
  // settle into S ~222, so the camera hands straight on to the creep)
  { f0: 138, f1: 222, x: 1232, y: 1660, k: 1.28, warp: 0.68 },
  // "At the start of the year ...": creeps in toward the band's top-left corner
  // (down and in, ~0.5-0.8 px/f at the frame corners); starts under the
  // look-ahead's landing so the camera never parks, x does not turn, and the
  // band's right end stays inside x 1020
  { f0: 180, f1: 345, x: 1234, y: 1770, k: 1.37 },
  // "We would argue we're trending": follows down through the band; starts under
  // the creep so the move carries across the cut 1 / cut 2 join
  { f0: 330, f1: 402, x: 1250, y: 1845, k: 1.44 },
  // "at this stage. And we're likely seeing": a long, even creep to the crossing
  { f0: 392, f1: 452, x: 1272, y: 1960, k: 1.65, even: 0.25 },
  // "negative": follows the plunge, ~2 f late, easing out (heavy)
  { f0: 461, f1: 494, x: 1350, y: 2050, k: 1.5, warp: 0.6 },
  // "because investment in China": reframes down to the INVESTMENT bar,
  // continuing the plunge-follow's direction (right, out) as it decays
  { f0: 494, f1: 550, x: 1430, y: 2060, k: 1.38 },
  // tail: the same drift, continuing and decaying past 601
  { f0: 540, f1: 660, x: 1446, y: 2064, k: 1.35 },
];
export const GLIDES_A: Glide[] = (() => {
  let prev: { x: number; y: number } = CAM_A_START;
  return WAYS_A.map((w) => {
    const g: Glide = { f0: w.f0, f1: w.f1, dx: w.x - prev.x, dy: w.y - prev.y, k: w.k, warp: w.warp, even: w.even };
    prev = w;
    return g;
  });
})();
/** THE APPROVED v6 TRACK (CAM_A_START + GLIDES_A through the follower). It IS
 *  camA from S 353 on, bit for bit (cut 2 is approved), and builder B rebuilds its
 *  follower from CAM_A_START + GLIDES_A, so none of the three may change. Its
 *  S 0-352 is superseded by cut 1's round-2 camera below. */
export const CAM_A_TRACK: Cam[] = cameraTrack(CAM_A_START, GLIDES_A, 601);

// --- CUT 1's camera, round 2 ---------------------------------------------------
// Director's round-2 notes: the camera moves from frame 0 (one slow, even push
// from the establishing framing into the zigzag, same landing), and the
// look-ahead is tighter (k ~1.4) and centred between the tip and the band label,
// the tip >= 220 px from the left and FORECAST's right edge >= 60 px inside.
// Its own track with a 30-frame pre-roll (the follower is already moving on S 0),
// then a smoothstep blend over S 318-353 onto the v6 track, which it equals
// exactly from S 353 (the handoff to cut 2) on.
const A1_PRE = 30;
/** Cut 1's LOOK at S -30 (pre-roll): S 0 frames the line's entry ~143 px in, the
 *  axis drawing across at y ~1298, the push already moving. */
export const CAM_A1_START: Cam = { x: 520, y: 1540, k: 0.93 };
export const CAM_A_BLEND0 = 318;
export const CAM_A_HANDOFF = 353;
const A1_HAND = lookOf(CAM_A_TRACK[CAM_A_HANDOFF]);
const WAYS_A1: Way[] = [
  // "We had China growing" -> "10, 7, 8 percent": ONE slow, even push from the
  // establishing framing into the zigzag (k 1.5), moving from frame 0, landing
  // as "8" settles (within 0.5 % of k 1.5 by S 59)
  { f0: -14, f1: 57, x: 430, y: 1160, k: 1.5, even: 0.22 },
  // "Things were looking great": follows right along the hump at that zoom
  { f0: 50, f1: 112, x: 650, y: 1168, k: 1.5 },
  // "And now we're in a world where -- what's our latest Rhodium forecast?":
  // travels down the slide to the year ahead (fast early, so FORECAST is born
  // inside the frame), breathing out to k 1.28 mid-travel ...
  { f0: 96, f1: 204, x: 1175, y: 1600, k: 1.5, warp: 0.8 },
  { f0: 96, f1: 180, x: 1175, y: 1600, k: 1.28 },
  // ... and pushing back in to k 1.4 as the band is born
  { f0: 176, f1: 232, x: 1175, y: 1600, k: 1.4 },
  // "Like somewhere in the one to three? At the start of the year": tracks the
  // midpoint of the tip and the band label, down and right, at k ~1.4
  { f0: 196, f1: 300, x: 1234, y: 1705, k: 1.39, even: 0.3 },
  // "we expected growth in the range of": the corner creep onto the handoff
  { f0: 292, f1: 352, x: A1_HAND.x, y: A1_HAND.y, k: A1_HAND.k },
];
const CAM_A1_TRACK: Cam[] = (() => {
  let prev: { x: number; y: number } = CAM_A1_START;
  const glides = WAYS_A1.map((w) => {
    const g: Glide = { f0: w.f0 + A1_PRE, f1: w.f1 + A1_PRE, dx: w.x - prev.x, dy: w.y - prev.y, k: w.k, warp: w.warp, even: w.even };
    prev = w;
    return g;
  });
  return cameraTrack(CAM_A1_START, glides, CAM_A_HANDOFF + A1_PRE);
})();
/** camA at an integer frame: cut 1's track, the blend, then the v6 track. */
const camAFrame = (i: number): Cam => {
  if (i >= CAM_A_HANDOFF) return CAM_A_TRACK[Math.min(CAM_A_TRACK.length - 1, i)];
  const n = CAM_A1_TRACK[Math.max(0, i) + A1_PRE];
  if (i <= CAM_A_BLEND0) return n;
  const o = CAM_A_TRACK[i];
  const w = smoothstep((i - CAM_A_BLEND0) / (CAM_A_HANDOFF - CAM_A_BLEND0));
  return { x: n.x + (o.x - n.x) * w, y: n.y + (o.y - n.y) * w, k: n.k + (o.k - n.k) * w };
};
/** The camera for S 0-601 (camera centres; fractional S interpolates). */
export const camA = (S: number): Cam => {
  const t = Math.max(0, Math.min(CAM_A_TRACK.length - 1, S));
  const i = Math.min(CAM_A_TRACK.length - 2, Math.floor(t));
  const u = t - i;
  const a = camAFrame(i);
  if (u === 0) return { ...a };
  const b = camAFrame(i + 1);
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, k: a.k + (b.k - a.k) * u };
};
/** Cut 2's last frame = cut 3's first frame. camSeg3(601) must equal it. */
export const JOIN_23: Cam = camA(601);
/** The grid's parallax rest: ONE fixed camera for the whole clip. Frozen at the
 *  v6 opening camera (round 2 moved cut 1's camera, not the grid's rest), so no
 *  frame from S 353 on moves by a pixel. */
export const CAM_REST: Cam = CAM_A_TRACK[0];

// ---------------------------------------------------------------------------
// STAGE: grid backdrop (parallax 0.15 on x and y against CAM_REST, its drift on
// S), the one global drop shadow over the world SVG, the world group under the
// camera (sway on S), the vignette last.
// ---------------------------------------------------------------------------
export const Stage: React.FC<{ S: number; cam: Cam; children: React.ReactNode }> = ({ S, cam, children }) => {
  const sw = sway(S);
  const k = cam.k;
  const tx = FRAME_W / 2 - cam.x * k + sw.dx;
  const ty = FRAME_H / 2 - cam.y * k + sw.dy;
  return (
    <AbsoluteFill style={{ backgroundColor: BG_BASE }}>
      <GridBackground
        src="grid-background.jpg"
        blur={13}
        dim={BG_DIM}
        frame={S}
        cy={cam.y}
        cyRest={CAM_REST.y}
        cx={cam.x}
        cxRest={CAM_REST.x}
        k={k}
        parallax={0.15}
      />
      <AbsoluteFill style={{ filter: `drop-shadow(0 ${SHADOW_Y}px ${SHADOW_BLUR}px rgba(0,0,0,${SHADOW_OPACITY}))` }}>
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
          <g transform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(6)})`}>
            <StageViewContext.Provider value={{ cam, dx: sw.dx, dy: sw.dy }}>{children}</StageViewContext.Provider>
          </g>
        </svg>
      </AbsoluteFill>
      <Vignette strength={0.45} />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// THE BASE WORLD'S SCHEDULE (S frames). Gestures and the words they serve are
// listed in ChinaGrowing.tsx / NegativeGrowth.tsx; the lifecycles after S 601
// are WORLD.md's.
// ---------------------------------------------------------------------------
export const BASE = {
  // the axis: head-led from S 0, fast at first, then ~400-500 px ahead of the
  // tip, resting at AXIS_END from S 330
  axisRest: 330,
  axisDim: 44, // the axis is the subject of the first second; INK_HI -> INK_LO as the numbers take over
  // vertex dots + labels ("10, 7, 8 percent")
  w10: 28.3,
  w7: 46.6,
  w8: 61.4,
  wNow: 110.4,
  // the forecast band
  bandDraw0: 180, // the 2.0 % line draws head-led ("forecast" S 192)
  bandDraw1: 198,
  wForecast: 192.0,
  open0: 226, // opens to 1-3 % ("one to three")
  open1: 242,
  wThree: 237.1,
  narrow0: 318, // narrows to 1-2.5 % ("one to 2.5")
  narrow1: 338,
  rangeX0: 322, // "1-3%" -> "1-2.5%" crossfade, 8 f
  rangeX1: 330,
  bandRecede: 404, // band edges + range -> INK_LO ("well below that")
  // zero
  wave0: 426, // the axis brightens outward from under the tip
  waveV: 26, // world px / S frame (~42 screen px/f at k 1.62)
  waveSoft: 90, // the wave's soft front, world px
  w0pct: 440, // "0%" lands
  // Q2 / Q3 (ticks + labels keyed off the tip passing)
  qRecede: 530,
  // investment
  wInvest: 528,
  axisBack0: 520, // the axis (and "0%") ease back to INK_LO
  axisBack1: 540,
  // exits after cut 2 (WORLD.md lifecycles)
  outInvest: 604,
  outQ3: 606,
  outQ2: 608,
  outBand: 612,
  out7: 836,
  out8: 838,
};
/** The S at which the tip passes each landmark (keyed off tipAt, never a timer). */
export const PASS = {
  p10: sAtLen(LEN_P10),
  p7z: sAtLen(LEN_P7Z),
  p8: sAtLen(LEN_P8),
  q2: sAtX(Q2_X),
  q3: sAtX(Q3_X),
  zero: sAtLen(LEN_ZERO),
};

// --- the axis head: (S, x, speed) Hermite knots ------------------------------
const AXIS_KNOTS = [
  { S: 0, x: 160, v: 38 },
  { S: 24, x: 900, v: 4.2 },
  { S: 110, x: 1190, v: 2.4 },
  { S: BASE.axisRest, x: AXIS_END, v: 0 },
];
/** The axis head's x at S (AXIS_END from S 330). */
export const axisHeadX = (S: number) => {
  if (S >= BASE.axisRest) return AXIS_END;
  if (S <= 0) return AXIS_KNOTS[0].x + AXIS_KNOTS[0].v * S;
  let i = 0;
  while (i < AXIS_KNOTS.length - 2 && S > AXIS_KNOTS[i + 1].S) i++;
  const a = AXIS_KNOTS[i];
  const b = AXIS_KNOTS[i + 1];
  const h = b.S - a.S;
  const t = (S - a.S) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a.x + (t3 - 2 * t2 + t) * h * a.v + (-2 * t3 + 3 * t2) * b.x + (t3 - t2) * h * b.v;
};

// --- the dent: the tip pressing on zero --------------------------------------
export const DENT_HALF = 70; // half-width of the raised-cosine bump, world px
export const DENT_MAX = 10;
const DENT_RELEASE_F = 9;
/** Penetration of the tip's dot into the axis line at S (0 when clear). */
const pressAt = (S: number, k: number) => {
  const t = tipAt(S);
  const s = sz(k);
  const p = Math.max(0, t.y + DOT_R * s - (Y0 - (INK_W * s) / 2));
  // a soft ceiling: ~linear while shallow, never past DENT_MAX, no plateau
  return p / Math.pow(1 + Math.pow(p / DENT_MAX, 4), 0.25);
};
/** The dent's depth and centre at S: it follows the press until the break, then
 *  lets go (ease-out, no overshoot) over S_BREAK..S_BREAK+9. */
export const dentAt = (S: number, k: number) => {
  if (S <= S_BREAK) {
    const t = tipAt(S);
    return { depth: pressAt(S, k), cx: Math.min(t.x, ZERO_X) };
  }
  const d0 = pressAt(S_BREAK, k);
  return { depth: d0 * (1 - easeOutCubic((S - S_BREAK) / DENT_RELEASE_F)), cx: ZERO_X };
};
/** The axis line's y at x under a dent. */
export const axisYAt = (x: number, dent: { depth: number; cx: number }) => {
  const u = (x - dent.cx) / DENT_HALF;
  if (dent.depth <= 0 || Math.abs(u) >= 1) return Y0;
  return Y0 + dent.depth * 0.5 * (1 + Math.cos(Math.PI * u));
};

// --- the axis rung: INK_LO, a wave to INK_HI from under the tip, back to LO ----
const WAVE_X = tipAt(BASE.wave0).x;
const axisStops = (S: number): { x: number; o: number }[] | number => {
  if (S < BASE.wave0) return INK_HI - (INK_HI - INK_LO) * rungEase(S, BASE.axisDim);
  if (S >= BASE.axisBack0) return INK_HI - (INK_HI - INK_LO) * smoothstep((S - BASE.axisBack0) / (BASE.axisBack1 - BASE.axisBack0));
  const r = BASE.waveV * (S - BASE.wave0);
  const W = BASE.waveSoft;
  if (WAVE_X - r <= AXIS_X0 && WAVE_X + r >= AXIS_END) return INK_HI;
  const pts = [
    { x: AXIS_X0, o: 0 },
    { x: WAVE_X - r - W, o: 0 },
    { x: WAVE_X - r, o: 1 },
    { x: WAVE_X + r, o: 1 },
    { x: WAVE_X + r + W, o: 0 },
    { x: AXIS_END, o: 0 },
  ];
  // evaluate the soft front (smoothstep across W) at a set of xs, clamped to the axis
  const out: { x: number; o: number }[] = [];
  const front = (x: number) => {
    const d = Math.abs(x - WAVE_X);
    return smoothstep((r + W - d) / W);
  };
  const xs: number[] = [AXIS_X0, AXIS_END];
  for (const p of pts) xs.push(p.x);
  for (let i = 1; i < 8; i++) {
    xs.push(WAVE_X - r - W + (W * i) / 8, WAVE_X + r + (W * i) / 8);
  }
  const sorted = xs.filter((x) => x >= AXIS_X0 && x <= AXIS_END).sort((a, b) => a - b);
  for (const x of sorted) out.push({ x, o: INK_LO + (INK_HI - INK_LO) * front(x) });
  return out;
};
/** The axis rung at (S, x). */
export const axisRungAt = (S: number, x: number) => {
  const st = axisStops(S);
  if (typeof st === "number") return st;
  for (let i = 0; i < st.length - 1; i++) {
    if (x >= st[i].x && x <= st[i + 1].x) {
      const u = (x - st[i].x) / (st[i + 1].x - st[i].x || 1);
      return st[i].o + (st[i + 1].o - st[i].o) * u;
    }
  }
  return INK_LO;
};

// --- the band ------------------------------------------------------------------
/** The forecast band at S: birth draw of the 2.0 % line, top/bottom values (%),
 *  the tint and the edge rung. */
export const bandAt = (S: number) => {
  const birth = arriveEase(clamp01((S - BASE.bandDraw0) / (BASE.bandDraw1 - BASE.bandDraw0)));
  const open = smoothstep((S - BASE.open0) / (BASE.open1 - BASE.open0));
  const narrow = smoothstep((S - BASE.narrow0) / (BASE.narrow1 - BASE.narrow0));
  const top = 2.0 + 1.0 * open - 0.5 * narrow;
  const bot = 2.0 - 1.0 * open;
  const edgeRung = INK_HI - (INK_HI - INK_LO) * rungEase(S, BASE.bandRecede);
  return { birth, open, narrow, top, bot, tint: BAND_TINT * open, edgeRung };
};

// --- label placement (world, at the current k) -----------------------------------
const VERTEX_GAP = 12; // dot edge -> caps, world px at K_REF
const AXIS_LABEL_GAP = 23; // axis -> caps (clears a tick), world px at K_REF
const STACK_GAP = 14; // FORECAST caps -> range caps
const above = (y: number, gap: number, size: LabelSize, k: number) => y - gap * sz(k) - labelCapH(size, k) / 2;
const below = (y: number, gap: number, size: LabelSize, k: number) => y + gap * sz(k) + labelCapH(size, k) / 2;
export const INVEST_X = 1455;
export const INVEST_Y = yOf(-2.6);
export const INVEST_W0 = 200;
export const INVEST_W1 = 70;
export const INVEST_H = 20;
export const ZERO_LABEL_X = 1200;

/** The band's range label. "1\u2013" stays put while only the upper value
 *  crossfades ("3%" -> "2.5%", 8 f), so the numeral changes in place without two
 *  strings' glyphs muddling; the group re-centres on the band's own narrowing
 *  (`shift`, the same eased variable that lowers the top edge). */
const RangeLabel: React.FC<{
  x: number;
  y: number;
  k: number;
  xf: number;
  shift: number;
  rung: number;
  appear: number;
  exit: number;
}> = ({ x, y, k, xf, shift, rung, appear, exit }) => {
  const view = React.useContext(StageViewContext);
  const a = clamp01(appear);
  const e = clamp01(exit);
  const fs = labelPx("value", k);
  const lift = ((1 - easeOutCubic(a)) + easeInCubic(e)) * (RISE_PX / k);
  const pre = "1\u2013";
  const wA = labelWidth(`${pre}3%`, "value", k);
  const wB = labelWidth(`${pre}2.5%`, "value", k);
  const wNow = wA + (wB - wA) * clamp01(shift);
  const x0 = x - wNow / 2;
  const box = labelBox(x0, y + lift, Math.max(wA, wB), fs, "start");
  const op = rung * smoothstep(a) * (1 - smoothstep(e)) * edgeFactor(view, box.x0, box.y0, box.x1, box.y1);
  if (op <= 0.002) return null;
  const base = y + lift + (CAP_EM / 2) * fs;
  const line = (suffix: string, sufOp: number, preOp: number, key: string) => (
    <text
      key={key}
      x={x0.toFixed(3)}
      y={base.toFixed(3)}
      fontFamily={FONT_LABEL}
      fontWeight={700}
      fontSize={fs.toFixed(3)}
      letterSpacing={`${TRACK_EM}em`}
      textAnchor="start"
      fill={INK}
    >
      <tspan fillOpacity={preOp}>{pre}</tspan>
      <tspan fillOpacity={sufOp.toFixed(4)}>{suffix}</tspan>
    </text>
  );
  return (
    <g style={{ filter: iconShadow(k) }} opacity={op.toFixed(4)}>
      {xf < 1 ? line("3%", 1 - xf, 1, "a") : null}
      {xf > 0 ? line("2.5%", xf, xf < 1 ? 0 : 1, "b") : null}
    </g>
  );
};

export type BasePass = "under" | "line" | "labels" | "all";

/** Everything builder A owns, for any S in 0..1087. `pass` splits it for the
 *  world's z-order: "under" (band tint + edges, hatch, axis, ticks, investment
 *  bar), "line" (the orange line, vertex dots, tip), "labels". */
export const BaseWorld: React.FC<{ S: number; cam: Cam; pass?: BasePass }> = ({ S, cam, pass = "all" }) => {
  const k = cam.k;
  const s = sz(k);
  const doUnder = pass === "all" || pass === "under";
  const doLine = pass === "all" || pass === "line";
  const doLabels = pass === "all" || pass === "labels";
  const L = tipLen(S);
  const tip = pathPoint(L);
  const band = bandAt(S);
  const dent = dentAt(S, k);
  const out: React.ReactNode[] = [];

  if (doUnder) {
    // -- the band: tint, then edges (one 2.0 % line until it opens) --
    if (band.birth > 0) {
      if (band.tint > 0.001) {
        out.push(
          <rect
            key="band-tint"
            x={BAND_X0}
            y={yOf(band.top).toFixed(3)}
            width={BAND_X1 - BAND_X0}
            height={(yOf(band.bot) - yOf(band.top)).toFixed(3)}
            fill={INK}
            opacity={band.tint.toFixed(4)}
          />,
        );
      }
      const edge = (v: number, key: string, draw: number, head: boolean) => (
        <HeadLedPath
          key={key}
          points={[
            { x: BAND_X0, y: yOf(v) },
            { x: BAND_X1, y: yOf(v) },
          ]}
          k={k}
          draw={draw}
          rung={band.edgeRung}
          head={head}
        />
      );
      if (band.open <= 0) {
        out.push(edge(2.0, "band-line", band.birth, true));
      } else {
        out.push(edge(band.top, "band-top", 1, false), edge(band.bot, "band-bot", 1, false));
      }
    }

    // -- the negative-growth hatch: between the axis and the line, zero -> tip --
    if (L > LEN_ZERO + 0.5) {
      const linePts = pathPoints(LEN_ZERO, L, 2);
      const top: Pt[] = [];
      const xs: number[] = [];
      for (let x = tip.x; x > ZERO_X; x -= 3) xs.push(x);
      xs.push(ZERO_X);
      for (const x of xs) top.push({ x, y: Math.min(axisYAt(x, dent), lineYAtX(x)) });
      out.push(
        <HatchFill key="hatch" id="cg-neg-hatch" region={[...linePts, ...top]} k={k} color={ACCENT_DEEP} anchor={ZERO_PT} />,
      );
    }

    // -- the axis = the zero line, head-led, with the dent and the rung wave --
    const head = axisHeadX(S);
    const axisPts: Pt[] = [{ x: AXIS_X0, y: Y0 }];
    if (dent.depth > 0.01) {
      for (let x = dent.cx - DENT_HALF; x <= dent.cx + DENT_HALF; x += 4) {
        if (x > AXIS_X0 && x < head) axisPts.push({ x, y: axisYAt(x, dent) });
      }
    }
    axisPts.push({ x: head, y: Y0 });
    const stops = axisStops(S);
    const uniform = typeof stops === "number";
    const draw = (head - AXIS_X0) / (AXIS_END - AXIS_X0);
    out.push(
      <g key="axis">
        {!uniform ? (
          <defs>
            <linearGradient id="cg-axis-rung" gradientUnits="userSpaceOnUse" x1={AXIS_X0} y1={0} x2={AXIS_END} y2={0}>
              {(stops as { x: number; o: number }[]).map((st, i) => (
                <stop
                  key={i}
                  offset={((st.x - AXIS_X0) / (AXIS_END - AXIS_X0)).toFixed(5)}
                  stopColor={INK}
                  stopOpacity={st.o.toFixed(4)}
                />
              ))}
            </linearGradient>
          </defs>
        ) : null}
        <HeadLedPath
          points={axisPts}
          k={k}
          draw={1}
          rung={uniform ? (stops as number) : 1}
          color={uniform ? INK : "url(#cg-axis-rung)"}
          head={false}
        />
        {S < BASE.axisRest ? (
          <g style={{ filter: iconShadow(k) }} opacity={((uniform ? (stops as number) : INK_LO) * headOpacity(draw, 0, 0.06)).toFixed(4)}>
            <circle cx={head.toFixed(3)} cy={Y0} r={(HEAD_R * INK_W * s).toFixed(3)} fill={INK} />
          </g>
        ) : null}
      </g>,
    );

    // -- Q2 / Q3 ticks: brought by the tip passing --
    const qTick = (x: number, pass0: number, outS: number, key: string) => {
      const g = clamp01((S - pass0) / 8);
      const gone = clamp01((S - outS) / 8);
      const rung = (INK_HI - (INK_HI - INK_LO) * rungEase(S, BASE.qRecede)) * (1 - smoothstep(gone));
      return <Tick key={key} x={x} y={Y0} k={k} grow={g * (1 - gone)} rung={rung} />;
    };
    if (S >= PASS.q2) out.push(qTick(Q2_X, PASS.q2, BASE.outQ2, "q2-tick"));
    if (S >= PASS.q3) out.push(qTick(Q3_X, PASS.q3, BASE.outQ3, "q3-tick"));

    // -- the INVESTMENT bar: slides up with its label, contracts on the sink --
    const ia = enterU(S, BASE.wInvest);
    const ie = exitU(S, BASE.outInvest);
    if (ia > 0 && ie < 1) {
      const w = INVEST_W0 - (INVEST_W0 - INVEST_W1) * sinkE(S);
      const lift = ((1 - easeOutCubic(ia)) + easeInCubic(ie)) * (RISE_PX / k);
      const op = smoothstep(ia) * (1 - smoothstep(ie));
      out.push(
        <g key="invest-bar" style={{ filter: iconShadow(k) }} opacity={op.toFixed(4)}>
          <path
            d={squirclePath(w, INVEST_H)}
            transform={`translate(${(INVEST_X - w / 2).toFixed(3)} ${(INVEST_Y - INVEST_H / 2 + lift).toFixed(3)})`}
            fill={INK}
          />
        </g>,
      );
    }
  }

  if (doLine) {
    // -- the growth line, its vertex dots, its tip --
    out.push(
      <g key="line" style={{ filter: iconShadow(k) }}>
        <path
          d={pathD(0, L)}
          fill="none"
          stroke={ACCENT}
          strokeWidth={(DATA_W * s).toFixed(3)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>,
    );
    const vtx = (p: Pt, pass0: number, key: string) =>
      S >= pass0 ? <Dot key={key} x={p.x} y={p.y} k={k} grow={(S - pass0) / 8} /> : null;
    out.push(vtx(P10, PASS.p10, "d10"), vtx(P7Z, PASS.p7z, "d7"), vtx(P8, PASS.p8, "d8"));
    out.push(<Dot key="tip" x={tip.x} y={tip.y} k={k} />);
  }

  if (doLabels) {
    // -- "10%" "7%" "8%": land on their words; HI, -> LO when the next lands --
    const v10 = INK_HI - (INK_HI - INK_LO) * rungEase(S, BASE.w7);
    const v7 = INK_HI - (INK_HI - INK_LO) * rungEase(S, BASE.w8);
    const v8 = INK_HI - (INK_HI - INK_LO) * rungEase(S, BASE.wNow);
    const vg = VERTEX_GAP + DOT_R;
    out.push(
      <Label key="l10" text="10%" x={P10.x} y={above(P10.y, vg, "value", k)} k={k} size="value" rung={v10} appear={enterU(S, BASE.w10)} />,
      <Label
        key="l7"
        text="7%"
        x={P7Z.x}
        y={below(P7Z.y, vg, "value", k)}
        k={k}
        size="value"
        rung={v7}
        appear={enterU(S, BASE.w7)}
        exit={exitU(S, BASE.out7)}
      />,
      <Label
        key="l8"
        text="8%"
        x={P8.x}
        y={above(P8.y, vg, "value", k)}
        k={k}
        size="value"
        rung={v8}
        appear={enterU(S, BASE.w8)}
        exit={exitU(S, BASE.out8)}
      />,
    );

    // -- FORECAST over the range, centred in the band --
    if (S >= BASE.wForecast - 8) {
      const capW = labelCapH("word", k);
      const capV = labelCapH("value", k);
      const g = STACK_GAP * s;
      const H = capW + g + capV;
      const yc = (yOf(band.top) + yOf(band.bot)) / 2;
      const yStackW = yc - H / 2 + capW / 2;
      const yStackV = yc + H / 2 - capV / 2;
      const yAboveLine = above(yOf(2.0), 16, "word", k);
      const yF = yAboveLine + (yStackW - yAboveLine) * band.open;
      const out0 = exitU(S, BASE.outBand);
      out.push(
        <Label
          key="forecast"
          text="FORECAST"
          x={BAND_LABEL_X}
          y={yF}
          k={k}
          size="word"
          rung={INK_HI - (INK_HI - INK_LO) * rungEase(S, BASE.wThree)}
          appear={enterU(S, BASE.wForecast)}
          exit={out0}
        />,
      );
      const rRung = INK_HI - (INK_HI - INK_LO) * rungEase(S, BASE.bandRecede);
      const xf = smoothstep((S - BASE.rangeX0) / (BASE.rangeX1 - BASE.rangeX0));
      out.push(
        <RangeLabel
          key="range"
          x={BAND_LABEL_X}
          y={yStackV}
          k={k}
          xf={xf}
          shift={band.narrow}
          rung={rRung}
          appear={enterU(S, BASE.wThree)}
          exit={out0}
        />,
      );
    }

    // -- "0%": just below the axis, left of the band --
    const zRung = INK_HI - (INK_HI - INK_LO) * smoothstep((S - BASE.axisBack0) / (BASE.axisBack1 - BASE.axisBack0));
    out.push(
      <Label
        key="l0"
        text="0%"
        x={ZERO_LABEL_X}
        y={below(Y0, AXIS_LABEL_GAP, "value", k)}
        k={k}
        size="value"
        rung={zRung}
        appear={enterU(S, BASE.w0pct)}
      />,
    );

    // -- Q2 / Q3: just above the axis, brought by the tip passing --
    const qRung = INK_HI - (INK_HI - INK_LO) * rungEase(S, BASE.qRecede);
    const yQ = above(Y0, AXIS_LABEL_GAP, "word", k);
    out.push(
      <Label key="q2" text="Q2" x={Q2_X} y={yQ} k={k} size="word" rung={qRung} appear={enterFrom(S, PASS.q2)} exit={exitU(S, BASE.outQ2)} />,
      <Label key="q3" text="Q3" x={Q3_X} y={yQ} k={k} size="word" rung={qRung} appear={enterFrom(S, PASS.q3)} exit={exitU(S, BASE.outQ3)} />,
    );

    // -- INVESTMENT: centred under its bar, caps top at ~yOf(-2.95) --
    const capWI = labelCapH("word", k);
    out.push(
      <Label
        key="invest"
        text="INVESTMENT"
        x={INVEST_X}
        y={yOf(-2.95) + capWI / 2}
        k={k}
        size="word"
        rung={INK_HI}
        appear={enterU(S, BASE.wInvest)}
        exit={exitU(S, BASE.outInvest)}
      />,
    );
  }

  return <>{out}</>;
};

/** The base ink's world bounding box once everything has landed (S ~600 on),
 *  labels included, at camera k: for framing a whole-chart shot. */
export const baseBBox = (k: number) => {
  const vg = VERTEX_GAP + DOT_R;
  const top = above(P10.y, vg, "value", k) - labelCapH("value", k) / 2;
  return { x0: AXIS_X0, x1: AXIS_END, y0: top, y1: yOf(-1.45) + (DATA_W * sz(k)) / 2 };
};

/** Re-exported so a layer needs one import for the house constants. */
export { ACCENT, ACCENT_DEEP, K_REF };
