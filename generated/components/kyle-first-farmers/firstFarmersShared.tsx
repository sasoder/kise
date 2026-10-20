// ---------------------------------------------------------------------------
// firstFarmersShared: THE KIT of the first-farmers clip (Dwarkesh Patel with
// Kyle Harper, "Did disease help the first farmers replace hunter-gatherers?";
// Oct 2026). Dwarkesh map style used as the general history look (umber page,
// cream engraved line, IM Fell type). ONE orange = the incoming farmers' side
// (their people, fields, houses, grain, and the germs they carry).
//
// The page half is plagueShared's (Kyle Harper's previous clip, also 29.97):
// the baked umber backdrop, the screen-space grain, the soft vignette, the
// pchip + damped camera, WorldSvg / WorldDiv, the engraver's ink helpers. Colours
// come from firstFarmersTokens (the director's, read-only) and are re-exported.
//
// CAMERA CONVENTION: a camera is { x, y, k }: the WORLD point (x, y) lands on
// the frame centre (540, 960) at scale k. Everything inside <WorldSvg> /
// <WorldDiv> is drawn in world px. Author the camera as its own key track:
//   const CAM: CamKey[] = [{ f: 0, x: 540, y: 960, k: 1.4 }, { f: 90, x: 540, y: 900, k: 1 }];
//   const cam = runCamera(CAM, frame);
// Keys are joined by a monotone cubic (no overshoot; k in log space) and
// followed by a damped tracker (it trails the keys by ~5 frames, so key a move
// to land a few frames ahead of its word). A pull-back is another key. The
// damper is pre-rolled, so frame 0 is already in steady motion.
//
// GERMS (new here): the farmers' disease. See the block comment above <Germs>.
// GroundLine / ContactShadow: the engraved ground every figure scene stands on.
//
// Read-only once animation_source/notes/WORLD_READY.md exists; additions only,
// logged in SHARED_CHANGES.md in the same notes folder.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { loadFont as loadCaslon } from "@remotion/google-fonts/LibreCaslonText";
import { CAM_DAMP, CAM_STIFF, clamp01, hash, smoothstep } from "../kits/dwarkesh/fieldShared";
import { ACCENT, ACCENT_DEEP, CAPTION_BANDS, DARK, DEAD, FPS, FRAME_H, FRAME_W, INK, INK_DEEP, INK_HI, INK_LO, LAND, LAND_RIM, SEA } from "./firstFarmersTokens";

export { ACCENT, ACCENT_DEEP, CAPTION_BANDS, DARK, DEAD, FPS, FRAME_H, FRAME_W, INK, INK_DEEP, INK_HI, INK_LO, LAND, LAND_RIM, SEA };

export const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
export const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
loadFell("italic", { weights: ["400"], subsets: ["latin"] });
/** Libre Caslon Text (lining figures): every number and year on screen (Fell's old-style figures misread) */
export const { fontFamily: caslon } = loadCaslon("normal", { weights: ["400", "700"], subsets: ["latin"] });

// ---------------------------------------------------------------------------
// MATHS
// ---------------------------------------------------------------------------
export { clamp01, smoothstep, hash };
export type P2 = [number, number];
/** 0..1, eased (smoothstep), between frames a and b */
export const ramp = (f: number, a: number, b: number) => smoothstep((f - a) / (b - a));
const hexRgb = (h: string) => {
  const m = h.match(/^#([0-9a-f]{6})$/i);
  if (m) return [0, 2, 4].map((i) => parseInt(m[1].slice(i, i + 2), 16));
  const r = h.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  return r ? [1, 2, 3].map((i) => Number(r[i])) : [0, 0, 0];
};
/** mix two colours (#RRGGBB or rgb()), t 0..1 -> "rgb(r,g,b)" */
export const mixColor = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = clamp01(t);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
};

// ---------------------------------------------------------------------------
// CAMERA
// ---------------------------------------------------------------------------
export type CamKey = { f: number; x: number; y: number; k: number };
export type Cam = { x: number; y: number; k: number };

/** monotone cubic (PCHIP) through keys: C1, no overshoot; linear beyond the ends */
const pchip = (xs: number[], ys: number[]) => {
  const n = xs.length;
  if (n === 1) return () => ys[0];
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};

const PREROLL = 60;
type Track = { target: (f: number) => number[]; s: number[]; v: number[]; out: Cam[] };
const TRACKS = new WeakMap<CamKey[], Track>();
/** the camera at `frame` (integer): keys -> monotone cubic -> damped follow. Pass a module-level keys array (cached per array). */
export const runCamera = (keys: CamKey[], frame: number): Cam => {
  let tr = TRACKS.get(keys);
  if (!tr) {
    const fs = keys.map((q) => q.f);
    const px = pchip(fs, keys.map((q) => q.x));
    const py = pchip(fs, keys.map((q) => q.y));
    const pk = pchip(fs, keys.map((q) => Math.log(q.k)));
    const target = (f: number) => [px(f), py(f), pk(f)];
    let s = target(-PREROLL);
    let v = [0, 0, 0];
    for (let f = -PREROLL + 1; f <= 0; f++) {
      const t = target(f);
      v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
      s = s.map((si, i) => si + v[i]);
    }
    tr = { target, s, v, out: [{ x: s[0], y: s[1], k: Math.exp(s[2]) }] };
    TRACKS.set(keys, tr);
  }
  const n = Math.max(0, Math.round(frame));
  for (let f = tr.out.length; f <= n; f++) {
    const t = tr.target(f);
    const s0 = tr.s;
    tr.v = tr.v.map((vi, i) => vi + (t[i] - s0[i]) * CAM_STIFF - vi * CAM_DAMP);
    const v0 = tr.v;
    tr.s = tr.s.map((si, i) => si + v0[i]);
    tr.out.push({ x: tr.s[0], y: tr.s[1], k: Math.exp(tr.s[2]) });
  }
  return tr.out[n];
};
/** world -> screen, for the odd thing that must be placed in screen px */
export const toScreen = (cam: Cam, x: number, y: number) => ({ x: FRAME_W / 2 + (x - cam.x) * cam.k, y: FRAME_H / 2 + (y - cam.y) * cam.k });
const camCss = (cam: Cam) => `translate(${FRAME_W / 2 - cam.x * cam.k}px, ${FRAME_H / 2 - cam.y * cam.k}px) scale(${cam.k})`;
const camSvg = (cam: Cam) => `translate(${FRAME_W / 2 - cam.x * cam.k} ${FRAME_H / 2 - cam.y * cam.k}) scale(${cam.k})`;

/** a full-frame svg whose children are in world px */
export const WorldSvg: React.FC<{ cam: Cam; children?: React.ReactNode; defs?: React.ReactNode; style?: React.CSSProperties }> = ({ cam, children, defs, style }) => (
  <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "hidden", ...style }}>
    {defs ? <defs>{defs}</defs> : null}
    <g transform={camSvg(cam)}>{children}</g>
  </svg>
);
/** a div whose children (Img, HTML) are positioned in world px; stays registered with WorldSvg */
export const WorldDiv: React.FC<{ cam: Cam; children?: React.ReactNode; style?: React.CSSProperties }> = ({ cam, children, style }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, transformOrigin: "0 0", transform: camCss(cam), ...style }}>{children}</div>
);
/** alias of WorldSvg */
export const World = WorldSvg;

// ---------------------------------------------------------------------------
// PAGE: the opaque backdrop. Baked umber land mottle (screen space), children,
// then the screen-space grain and the soft vignette on top of everything.
// ---------------------------------------------------------------------------
const BACKDROP_SRC = "ww1credit/LandBackdrop_1080x1920_flat.png";
const GRAIN_SRC = "manchuria/grain.png";
/** the screen-space paper grain (put it above a full-bleed image / map) */
export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 1 }) => (
  <Img src={staticFile(GRAIN_SRC)} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, opacity, pointerEvents: "none" }} />
);
/** the soft vignette (screen space; draw last) */
export const Vignette: React.FC<{ amount?: number }> = ({ amount = 0.32 }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 85% 85% at 50% 46%, rgba(8,6,4,0) 55%, rgba(8,6,4,${(amount * 0.5).toFixed(3)}) 82%, rgba(8,6,4,${amount.toFixed(3)}) 100%)`,
    }}
  />
);
export const Page: React.FC<{ vignette?: number; children?: React.ReactNode }> = ({ vignette = 0.32, children }) => (
  <AbsoluteFill style={{ backgroundColor: LAND }}>
    <Img src={staticFile(BACKDROP_SRC)} style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H }} />
    {children}
    <Grain />
    <Vignette amount={vignette} />
  </AbsoluteFill>
);

// ---------------------------------------------------------------------------
// INK: lines with a little life, shade by hatching.
// ---------------------------------------------------------------------------
export type Pt = [number, number];
/** points with a slow seeded wobble (long segments are subdivided; the two ends stay put). amp ~1-2.5 px */
export const roughen = (points: Pt[], seed = 0, amp = 1.6): Pt[] => {
  if (points.length < 2) return points;
  const pts: Pt[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1];
    const [bx, by] = points[i];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 36));
    for (let j = 1; j <= n; j++) pts.push([ax + ((bx - ax) * j) / n, ay + ((by - ay) * j) / n]);
  }
  const s = [0];
  for (let i = 1; i < pts.length; i++) s.push(s[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const total = s[s.length - 1];
  const p1 = hash(seed, 11) * 6.283;
  const p2 = hash(seed, 12) * 6.283;
  return pts.map(([x, y], i): Pt => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const w = (amp * Math.min(1, s[i] / 30, (total - s[i]) / 30) * (Math.sin(s[i] / 55 + p1) + 0.6 * Math.sin(s[i] / 23 + p2))) / 1.6;
    return [x - ((b[1] - a[1]) / len) * w, y + ((b[0] - a[0]) / len) * w];
  });
};
/** a smooth path d through the points (Catmull-Rom) */
export const inkPath = (points: Pt[], closed = false) => {
  const n = points.length;
  if (n < 2) return "";
  const at = (i: number) => (closed ? points[((i % n) + n) % n] : points[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${points[0][0].toFixed(2)},${points[0][1].toFixed(2)}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    d += `C${(p1[0] + (p2[0] - p0[0]) / 6).toFixed(2)},${(p1[1] + (p2[1] - p0[1]) / 6).toFixed(2)} ${(p2[0] - (p3[0] - p1[0]) / 6).toFixed(2)},${(p2[1] - (p3[1] - p1[1]) / 6).toFixed(2)} ${p2[0].toFixed(2)},${p2[1].toFixed(2)}`;
  }
  return closed ? `${d}Z` : d;
};
/** an engraved hatching pattern: put it in <defs> (WorldSvg `defs`), fill with `url(#id)`. World-space by default
 *  (the hatch zooms with the camera); pass `cam` for a screen-space hatch (constant spacing on screen). */
export const Hatch: React.FC<{ id: string; spacing?: number; angle?: number; stroke?: string; width?: number; opacity?: number; cam?: Cam }> = ({ id, spacing = 7, angle = 45, stroke = INK, width = 1.2, opacity = 1, cam }) => (
  <pattern
    id={id}
    patternUnits="userSpaceOnUse"
    width={spacing * 8}
    height={spacing}
    patternTransform={`${cam ? `translate(${cam.x - FRAME_W / 2 / cam.k} ${cam.y - FRAME_H / 2 / cam.k}) scale(${1 / cam.k}) ` : ""}rotate(${angle})`}
  >
    <line x1={-1} y1={spacing / 2} x2={spacing * 8 + 1} y2={spacing / 2} stroke={stroke} strokeWidth={width} strokeOpacity={opacity} />
  </pattern>
);
/** a line as an engraved stroke: dark casing under a cream (tone 0) or orange (tone 1) core, round caps */
export const InkStroke: React.FC<{ d: string; width?: number; tone?: number; casing?: boolean; opacity?: number; dash?: string; color?: string }> = ({ d, width = 3, tone = 0, casing = true, opacity = 1, dash, color }) => (
  <g opacity={opacity} fill="none" strokeLinecap="round" strokeLinejoin="round">
    {casing ? <path d={d} stroke={DARK} strokeWidth={width + Math.max(1.5, width * 0.6)} strokeOpacity={0.75} strokeDasharray={dash} /> : null}
    <path d={d} stroke={color ?? mixColor(INK, ACCENT, tone)} strokeWidth={width} strokeDasharray={dash} />
  </g>
);
/** short diagonal hatch strokes in a flat ellipse: the ground shadow under a figure (path d; stroke it cream at ~0.35) */
export const groundHatch = (cx: number, cy: number, halfW: number, n = 9) => {
  let d = "";
  for (let i = 0; i < n; i++) {
    const u = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;
    const l = halfW * 0.2 * Math.sqrt(Math.max(0.08, 1 - u * u));
    const px = cx + u * halfW;
    d += `M${(px - l).toFixed(2)},${(cy + l * 0.45).toFixed(2)}L${(px + l).toFixed(2)},${(cy - l * 0.45).toFixed(2)}`;
  }
  return d;
};

// ---------------------------------------------------------------------------
// GROUND: the engraved ground line a figure scene stands on, and the soft
// contact shadow under a foot, a hoof or a post. World px.
// ---------------------------------------------------------------------------
/** a ground line from x0 to x1 at y: a cream line with a little life over hatching that thins downward
 *  (no box, no fill: it trails off into the page). depth = how far the hatching reaches below, world px.
 *  weight = the line's width, world px (default 2.4: one weight with the figures at scale ~1.3). */
export const GroundLine: React.FC<{ x0: number; x1: number; y: number; depth?: number; weight?: number; tone?: number; seed?: number; opacity?: number }> = ({ x0, x1, y, depth = 70, weight = 2.4, tone = INK_HI, seed = 3, opacity = 1 }) => {
  const line = roughen(
    [
      [x0, y],
      [x1, y],
    ],
    seed,
    1.4,
  );
  // three ranks of short strokes, sparser and shorter as they go down
  let hatch = "";
  const ranks = [
    { dy: 0.16, gap: 11, len: 14, keep: 1 },
    { dy: 0.42, gap: 15, len: 10, keep: 0.75 },
    { dy: 0.74, gap: 22, len: 7, keep: 0.45 },
  ];
  ranks.forEach((r, ri) => {
    let i = 0;
    for (let x = x0 + r.gap * hash(ri, seed); x < x1; x += r.gap * (0.75 + 0.5 * hash(i, seed + ri * 7)), i++) {
      if (hash(i, seed + 31 + ri) > r.keep) continue;
      const fade = Math.min(1, (x - x0) / 120, (x1 - x) / 120);
      if (fade <= 0.05) continue;
      const l = r.len * (0.6 + 0.6 * hash(i, seed + 17 + ri)) * fade;
      const yy = y + depth * r.dy + (hash(i, seed + 5 + ri) - 0.5) * depth * 0.12;
      hatch += `M${(x - l * 0.5).toFixed(1)},${(yy + l * 0.22).toFixed(1)}L${(x + l * 0.5).toFixed(1)},${(yy - l * 0.22).toFixed(1)}`;
    }
  });
  const ink = mixColor(LAND, INK, tone);
  return (
    <g opacity={opacity} fill="none" strokeLinecap="round">
      <path d={hatch} stroke={ink} strokeWidth={weight * 0.5} strokeOpacity={0.45} />
      <path d={inkPath(line)} stroke={DARK} strokeWidth={weight + 2.2} strokeOpacity={0.6} />
      <path d={inkPath(line)} stroke={ink} strokeWidth={weight} />
    </g>
  );
};
/** the soft contact shadow under something standing at (x, y): a flat dark ellipse plus the engraver's hatch.
 *  halfW world px; amount 0..1 (0 = gone: lift it off the ground, or a body lying flat has its own). */
export const ContactShadow: React.FC<{ x: number; y: number; halfW: number; amount?: number; hatch?: boolean }> = ({ x, y, halfW, amount = 1, hatch = true }) => {
  if (amount <= 0.01) return null;
  return (
    <g opacity={amount}>
      <ellipse cx={x} cy={y + halfW * 0.03} rx={halfW * 1.05} ry={halfW * 0.16} fill={DARK} fillOpacity={0.32} />
      <ellipse cx={x} cy={y + halfW * 0.02} rx={halfW * 0.7} ry={halfW * 0.09} fill={DARK} fillOpacity={0.3} />
      {hatch ? <path d={groundHatch(x, y + halfW * 0.04, halfW * 0.95, 11)} fill="none" stroke={INK} strokeWidth={Math.max(0.8, halfW * 0.018)} strokeOpacity={0.3} strokeLinecap="round" /> : null}
    </g>
  );
};

// ---------------------------------------------------------------------------
// LABEL: cream IM Fell, slides up 24 px while fading in over ~10 frames.
// ---------------------------------------------------------------------------
export type LabelProps = {
  x: number;
  y: number; // baseline, world px
  size?: number;
  sc?: boolean; // IM Fell English SC (small caps: places)
  italic?: boolean;
  /** Libre Caslon Text (numbers and years) */
  numerals?: boolean;
  appear: number; // frame the slide starts
  frame: number; // the current frame
  anchor?: "start" | "middle" | "end";
  fill?: string;
  spacing?: number; // letter spacing in em
  children?: React.ReactNode;
};
export const Label: React.FC<LabelProps> = ({ x, y, size = 46, sc = false, italic = false, numerals = false, appear, frame, anchor = "middle", fill = INK, spacing, children }) => {
  const u = clamp01((frame - appear) / 10);
  if (u <= 0) return null;
  const e = 1 - Math.pow(1 - u, 3);
  return (
    <text
      x={x}
      y={y + 24 * (1 - e)}
      opacity={smoothstep(u)}
      textAnchor={anchor}
      fontFamily={numerals ? caslon : sc ? fellSC : fell}
      fontStyle={italic && !sc ? "italic" : "normal"}
      fontSize={size}
      letterSpacing={`${spacing ?? (sc ? 0.08 : 0.01)}em`}
      fill={fill}
      stroke={DARK}
      strokeOpacity={0.55}
      strokeWidth={size * 0.09}
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ textRendering: "geometricPrecision" }}
    >
      {children}
    </text>
  );
};

// ---------------------------------------------------------------------------
// GERMS: the farmers' disease (cuts A, C, I). ACCENT_DEEP, partly translucent.
//
// What it is, so it reads as disease and not sparks, embers, fireflies, pollen,
// snow or grain: a fine STIPPLE HAZE (tiny round dots, translucent, densest at
// the source, thinning with distance) carrying small cased RODS (bacilli) and a
// few legible ENGRAVED MICROBES at close range: a rod in a dark casing with a lit
// ridge, hatching on its shaded side and two waving flagella, or a short chain
// of round cocci. No glow, no flicker, no rising: motes leave their source,
// spread and slow, wander smoothly, and thin out (each one has its own life, so
// fewer reach far). Every mote is emitted from a source; there is no free
// scatter. A pure function of `frame` (seeded hash), world space.
//
//   <Germs frame={frame} k={cam.k} sources={[{ at: [x, y], rx: 60, ry: 120 }]} />
//
// Sources: a point (or a function of the frame, for a walking farmer or a
// migrating column: a mote leaves from where the source WAS at its birth, so a
// moving source sheds a trail) with an emission ellipse (the body it comes out
// of). Targets: give `targets` and `travel` (0..1) and each mote is pulled, after
// `travelAt` frames of its life, toward one target (nearest-weighted, seeded)
// over `travelTime` frames, gathers round it inside `settle`, and (absorb) sinks
// into it. Sizes in SCREEN px (pass the camera's k), so the stipple reads the
// same in a close-up and on the Europe wide: at a wide set microbe={0}.
// Cost: ~1500 motes -> a handful of <path>s + one <g> per legible microbe.
// ---------------------------------------------------------------------------
export type GermSource = {
  /** where the germs come out (world px), or a function of the frame for a moving source */
  at: P2 | ((f: number) => P2);
  /** the emission ellipse round `at`, world px (default 40 x rx) */
  rx?: number;
  ry?: number;
  /** motes per frame from this source (default: the Germs `rate`) */
  rate?: number;
  /** emission runs from..until (frames; default: already running in steady state before frame 0, never stops) */
  from?: number;
  until?: number;
};
export type GermsProps = {
  frame: number;
  sources: GermSource[];
  /** the camera zoom (screen px per world px), for the screen-px sizes */
  k: number;
  /** motes per frame per source (default 6); density multiplies it */
  rate?: number;
  density?: number;
  /** frames a mote lives at most (default 110); each lives 35-100 % of it */
  life?: number;
  /** outward speed at birth, world px per frame (default 1.6; it slows as it spreads) */
  spread?: number;
  /** a steady flow, world px per frame (default none) */
  drift?: P2;
  /** the slow wander, world px (default 18) */
  wander?: number;
  /** travel: targets the motes are drawn to, 0..1 how many / how strongly (default 0) */
  targets?: P2[];
  travel?: number;
  /** a mote's age (frames) when the pull begins, and how long it takes (defaults 14, 55) */
  travelAt?: number;
  travelTime?: number;
  /** the radius round a target they gather in, world px (default 46) */
  settle?: number;
  /** motes that have arrived sink into the target and go (default true) */
  absorb?: boolean;
  /** stipple dot radius, screen px (default 2.1) */
  mote?: number;
  /** legible microbe length, screen px (default 32; 0 = none, for wides) */
  microbe?: number;
  /** shares of the motes drawn as legible microbes and as small cased rods (defaults 0.012, 0.2) */
  microbeShare?: number;
  rodShare?: number;
  /** cap on motes per frame (default 2400) */
  maxMotes?: number;
  opacity?: number;
  seed?: number;
};

type Mote = { x: number; y: number; a: number; kind: 0 | 1 | 2; ang: number; h: number; age: number };

/** where every mote is at `frame` (exported for cuts that need the cloud's state: e.g. who it has reached) */
export const germMotes = (p: GermsProps): Mote[] => {
  const { frame, sources, rate = 6, density = 1, life = 110, spread = 1.6, drift = [0, 0], wander = 18, targets, travel = 0, travelAt = 14, travelTime = 55, settle = 46, absorb = true, microbeShare = 0.012, rodShare = 0.2, maxMotes = 2400, seed = 0 } = p;
  const out: Mote[] = [];
  const tau = life * 0.42;
  sources.forEach((src, si) => {
    const R = (src.rate ?? rate) * density;
    if (R <= 0) return;
    const from = src.from ?? -1e6;
    const until = src.until ?? 1e9;
    const rx = src.rx ?? 40;
    const ry = src.ry ?? rx;
    const pos = typeof src.at === "function" ? src.at : () => src.at as P2;
    const t0 = Math.max(from, frame - life);
    const t1 = Math.min(until, frame);
    if (t1 < t0) return;
    const iLo = Math.floor(t0 * R) - 1;
    const iHi = Math.ceil(t1 * R);
    for (let i = iLo; i <= iHi; i++) {
      if (out.length >= maxMotes) return;
      const key = i * 1.0001 + si * 7919.3 + seed * 104.7;
      const tb = (i + hash(key, 1)) / R;
      if (tb < from || tb > until) continue;
      const age = frame - tb;
      if (age < 0) continue;
      const L = life * (0.35 + 0.65 * hash(key, 2));
      if (age > L) continue;
      const h3 = hash(key, 3);
      const kind: 0 | 1 | 2 = h3 < microbeShare ? 2 : h3 < microbeShare + rodShare ? 1 : 0;
      // birth: a point inside the source's ellipse (sqrt for an even disc)
      const ba = hash(key, 4) * Math.PI * 2;
      const br = 0.62 + 0.38 * Math.sqrt(hash(key, 5)); // mostly at the rim: it comes OUT of the body
      const s0 = pos(tb);
      const bx = s0[0] + Math.cos(ba) * br * rx;
      const by = s0[1] + Math.sin(ba) * br * ry;
      // outward: mostly away from the source centre, slowing (1 - e^-t)
      const oa = ba + (hash(key, 6) - 0.5) * 1.6;
      const v = spread * (0.35 + 0.65 * hash(key, 7)) * (kind === 2 ? 0.6 : 1);
      const reach = v * tau * (1 - Math.exp(-age / tau));
      // the wander: two slow sines per axis, grown in with the age (smooth, never flicker)
      const wa = wander * Math.min(1, age / 40) * (0.5 + 0.5 * hash(key, 8));
      const w1 = 0.021 + 0.02 * hash(key, 9);
      const w2 = 0.013 + 0.015 * hash(key, 10);
      let x = bx + Math.cos(oa) * reach + drift[0] * age + wa * Math.sin(age * w1 + hash(key, 11) * 6.28);
      let y = by + Math.sin(oa) * reach + drift[1] * age + wa * Math.sin(age * w2 + hash(key, 12) * 6.28);
      let alpha = smoothstep(age / 14) * (1 - smoothstep((age - L * 0.55) / (L * 0.45)));
      // the pull toward a target
      if (targets && targets.length && travel > 0 && hash(key, 13) < travel) {
        // pick a target: nearest-weighted by a seeded draw
        let best = 0;
        let bestScore = Infinity;
        targets.forEach((tg, ti) => {
          const d = Math.hypot(tg[0] - s0[0], tg[1] - s0[1]);
          const sc = d * (0.6 + 0.8 * hash(key + ti * 13.1, 14));
          if (sc < bestScore) {
            bestScore = sc;
            best = ti;
          }
        });
        const tg = targets[best];
        const ga = hash(key, 15) * Math.PI * 2;
        const gr = settle * Math.sqrt(hash(key, 16));
        const gx = tg[0] + Math.cos(ga + age * 0.01) * gr;
        const gy = tg[1] + Math.sin(ga + age * 0.01) * gr * 0.9;
        const delay = travelAt * (0.6 + 0.8 * hash(key, 17));
        const u = smoothstep((age - delay) / (travelTime * (0.75 + 0.5 * hash(key, 18))));
        x = x + (gx - x) * u;
        y = y + (gy - y) * u;
        // a travelling mote lives until it has arrived (and sinks in, if absorb)
        const arrive = delay + travelTime * 1.1;
        const Lt = Math.max(L, arrive + 20);
        if (age > Lt) continue;
        alpha = smoothstep(age / 14) * (absorb ? 1 - smoothstep((age - arrive) / 20) : 1 - smoothstep((age - Lt * 0.8) / (Lt * 0.2)));
      }
      if (alpha <= 0.02) continue;
      out.push({ x, y, a: alpha, kind, ang: hash(key, 19) * 180 + age * (hash(key, 20) - 0.5) * 0.9, h: hash(key, 21), age });
    }
  });
  return out;
};

const dot = (x: number, y: number, r: number) => `M${(x - r).toFixed(1)},${y.toFixed(1)}a${r.toFixed(2)},${r.toFixed(2)} 0 1 0 ${(2 * r).toFixed(2)},0a${r.toFixed(2)},${r.toFixed(2)} 0 1 0 ${(-2 * r).toFixed(2)},0`;

/** one legible engraved microbe, centred at (0, 0), length L (world px), along +x */
const MicrobeArt: React.FC<{ L: number; kind: "rod" | "cocci"; n: number; wave: number; px: number }> = ({ L, kind, n, wave, px }) => {
  const ow = Math.max(1.1 * px, L * 0.055);
  if (kind === "cocci") {
    const r = L * 0.125;
    const cs = Array.from({ length: n }, (_, i) => {
      const u = i - (n - 1) / 2;
      return [u * r * 1.72, u * u * r * 0.32 + Math.sin(u * 1.3 + wave * 0.2) * r * 0.25] as P2;
    });
    return (
      <g>
        {cs.map(([cx, cy], i) => (
          <circle key={`c${i}`} cx={cx} cy={cy} r={r + ow * 1.6} fill={DARK} fillOpacity={0.55} />
        ))}
        {cs.map(([cx, cy], i) => (
          <g key={i}>
            <circle cx={cx} cy={cy} r={r} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={ow} />
            {/* the shaded side: a crescent of hatching low right; the lit point high left */}
            <path d={`M${(cx + r * 0.05).toFixed(2)},${(cy + r * 0.62).toFixed(2)}l${(r * 0.5).toFixed(2)},${(-r * 0.3).toFixed(2)}M${(cx + r * 0.42).toFixed(2)},${(cy + r * 0.32).toFixed(2)}l${(r * 0.32).toFixed(2)},${(-r * 0.36).toFixed(2)}`} stroke={DARK} strokeWidth={ow * 0.7} strokeOpacity={0.7} strokeLinecap="round" fill="none" />
            <circle cx={cx - r * 0.34} cy={cy - r * 0.34} r={r * 0.2} fill={ACCENT} fillOpacity={0.9} />
          </g>
        ))}
      </g>
    );
  }
  const w = L * 0.3;
  const hl = L / 2 - w / 2;
  const body = `M${-hl},${-w / 2}L${hl},${-w / 2}A${w / 2},${w / 2} 0 0 1 ${hl},${w / 2}L${-hl},${w / 2}A${w / 2},${w / 2} 0 0 1 ${-hl},${-w / 2}Z`;
  // two flagella trailing from the rear end, waving
  const flag = (side: number) => {
    let d = `M${(-L / 2 + w * 0.1).toFixed(2)},${(side * w * 0.18).toFixed(2)}`;
    const len = L * 0.85;
    for (let j = 1; j <= 8; j++) {
      const u = j / 8;
      const xx = -L / 2 - u * len;
      const yy = side * w * 0.18 + side * u * w * 0.5 + Math.sin(u * 7 + wave + side) * w * 0.32 * u;
      d += `L${xx.toFixed(2)},${yy.toFixed(2)}`;
    }
    return d;
  };
  const tails = flag(-1) + flag(1);
  return (
    <g>
      <path d={tails} fill="none" stroke={DARK} strokeWidth={ow * 2.6} strokeOpacity={0.55} strokeLinecap="round" strokeLinejoin="round" />
      <path d={tails} fill="none" stroke={ACCENT_DEEP} strokeWidth={ow * 0.95} strokeLinecap="round" strokeLinejoin="round" />
      <path d={body} fill={DARK} fillOpacity={0.55} stroke={DARK} strokeOpacity={0.55} strokeWidth={ow * 3.2} strokeLinejoin="round" />
      <path d={body} fill={ACCENT_DEEP} stroke={DARK} strokeWidth={ow} strokeLinejoin="round" />
      {/* the lit ridge along the upper side, the hatched underside, the septum */}
      <path d={`M${(-hl + w * 0.1).toFixed(2)},${(-w * 0.2).toFixed(2)}L${(hl - w * 0.05).toFixed(2)},${(-w * 0.2).toFixed(2)}`} stroke={ACCENT} strokeWidth={w * 0.2} strokeLinecap="round" />
      <path d={Array.from({ length: 6 }, (_, j) => `M${(-hl + (j + 0.6) * ((2 * hl) / 6)).toFixed(2)},${(w * 0.4).toFixed(2)}l${(w * 0.24).toFixed(2)},${(-w * 0.28).toFixed(2)}`).join("")} stroke={DARK} strokeWidth={ow * 0.75} strokeOpacity={0.7} strokeLinecap="round" />
      {n > 2 ? <path d={`M${(L * 0.06).toFixed(2)},${(-w * 0.42).toFixed(2)}L${(L * 0.06).toFixed(2)},${(w * 0.42).toFixed(2)}`} stroke={DARK} strokeWidth={ow * 0.7} strokeOpacity={0.6} /> : null}
    </g>
  );
};

export const Germs: React.FC<GermsProps> = (props) => {
  const { k, mote = 2.1, microbe = 32, opacity = 1 } = props;
  const motes = germMotes(props);
  const px = 1 / k; // one screen px in world px
  const r = mote * px;
  // stipple, in 5 alpha buckets (one path each)
  const dotB = ["", "", "", "", ""];
  const rodB = ["", "", ""];
  const big: Mote[] = [];
  for (const m of motes) {
    if (m.kind === 2 && microbe > 0) {
      big.push(m);
      continue;
    }
    if (m.kind === 1) {
      const l = r * (1.2 + 0.9 * m.h);
      const a = (m.ang * Math.PI) / 180;
      const dx = Math.cos(a) * l;
      const dy = Math.sin(a) * l;
      rodB[Math.min(2, Math.floor(m.a * 3))] += `M${(m.x - dx).toFixed(1)},${(m.y - dy).toFixed(1)}L${(m.x + dx).toFixed(1)},${(m.y + dy).toFixed(1)}`;
    } else {
      const rr = r * (0.7 + 0.6 * m.h);
      dotB[Math.min(4, Math.floor(m.a * 5))] += dot(m.x, m.y, rr);
    }
  }
  const L = microbe * px;
  return (
    <g opacity={opacity}>
      {dotB.map((d, i) => (d ? <path key={`d${i}`} d={d} fill={ACCENT_DEEP} fillOpacity={0.3 + 0.55 * ((i + 0.5) / 5)} /> : null))}
      {rodB.map((d, i) =>
        d ? (
          <g key={`r${i}`} opacity={0.8 * ((i + 0.5) / 3)} fill="none" strokeLinecap="round">
            <path d={d} stroke={DARK} strokeWidth={r * 1.5 + 1.1 * px} strokeOpacity={0.55} />
            <path d={d} stroke={ACCENT_DEEP} strokeWidth={r * 1.05} />
          </g>
        ) : null,
      )}
      {big.map((m, i) => {
        const kind = m.h < 0.72 ? "rod" : "cocci";
        const n = kind === "cocci" ? 3 + Math.floor(((m.h - 0.72) / 0.28) * 2.99) : m.h < 0.3 ? 3 : 2;
        const s = 0.75 + 0.5 * ((m.h * 7.31) % 1);
        return (
          <g key={i} transform={`translate(${m.x.toFixed(2)} ${m.y.toFixed(2)}) rotate(${m.ang.toFixed(2)})`} opacity={0.93 * m.a}>
            <MicrobeArt L={L * s} kind={kind} n={n} wave={m.age * 0.32} px={px} />
          </g>
        );
      })}
    </g>
  );
};

/** a single legible microbe as a free object (a medallion, a close-up): at = centre, len = length world px, angle deg */
export const Microbe: React.FC<{ at: P2; len: number; angle?: number; kind?: "rod" | "cocci"; n?: number; wave?: number; opacity?: number }> = ({ at, len, angle = 0, kind = "rod", n = 2, wave = 0, opacity = 1 }) => (
  <g transform={`translate(${at[0].toFixed(2)} ${at[1].toFixed(2)}) rotate(${angle.toFixed(2)})`} opacity={opacity}>
    <MicrobeArt L={len} kind={kind} n={n} wave={wave} px={len / 30} />
  </g>
);
