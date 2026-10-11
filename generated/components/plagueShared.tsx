// ---------------------------------------------------------------------------
// plagueShared: THE KIT of the plague clip (Dwarkesh Patel with Kyle Harper,
// "Why the plague is so deadly to humans"; Oct 2026). Seven graphics, one
// family: the Dwarkesh map style used as the general history look (umber page,
// cream engraved line, IM Fell type, ONE orange = the plague).
//
// Materials are those of the approved non-map pieces (InterestRatesGoDownV2 /
// PriorYearRecessionV2: the baked umber land backdrop, the soft vignette) with
// the map style's screen-space grain (incaShared's PaperTop). Maths from
// fieldShared, the monotone key track from worldCamera, the damper constants
// from fieldShared's runCamera.
//
// CAMERA CONVENTION: a camera is { x, y, k }: the WORLD point (x, y) lands on
// the frame centre (540, 960) at scale k. Everything inside <WorldSvg> /
// <WorldDiv> is drawn in world px. Author the camera as its own key track:
//   const CAM: CamKey[] = [{ f: 0, x: 540, y: 960, k: 1.4 }, { f: 90, x: 540, y: 900, k: 1 }];
//   const cam = runCamera(CAM, frame);
// The keys are joined by a monotone cubic (no overshoot; k in log space) and
// followed by a damped tracker (it trails the keys by ~5 frames, so key a move
// to land a few frames ahead of its word). A pull-back is just another key.
// A slow creep is two keys far apart. The first key is already in steady
// motion on frame 0 (the damper is pre-rolled), so a hard cut in is not a start
// from rest.
//
// No scene logic lives here. Do not edit after KIT_READY.md is written.
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadFellSC } from "@remotion/google-fonts/IMFellEnglishSC";
import { loadFont as loadFell } from "@remotion/google-fonts/IMFellEnglish";
import { CAM_DAMP, CAM_STIFF, clamp01, hash, smoothstep } from "./fieldShared";
import { FLEA_ROUNDEL, MARMOT_ROUNDEL } from "./plagueSharedData";

export const { fontFamily: fellSC } = loadFellSC("normal", { weights: ["400"], subsets: ["latin"] });
export const { fontFamily: fell } = loadFell("normal", { weights: ["400"], subsets: ["latin"] });
loadFell("italic", { weights: ["400"], subsets: ["latin"] });

export const FPS = 30000 / 1001;
export const FRAME_W = 1080;
export const FRAME_H = 1920;

// ---------------------------------------------------------------------------
// PALETTE. Orange means ONE thing in this clip: the plague.
// ---------------------------------------------------------------------------
export const LAND = "#3F3428"; // the page / land umber
export const SEA = "#1B2226"; // sea / the deepest shade
export const INK = "#E9DDBF"; // cream: every line, figure and letter
export const INK_DEEP = "#C9BB97"; // cream on the shaded side of a form
export const DARK = "#17120D"; // the outline / casing
export const ACCENT = "#FFB000"; // the plague
export const ACCENT_DEEP = "#D98A0C"; // the plague, a shade down
export const DEAD = "#8A7B62"; // a dead / fallen figure, a dead line: lifeless umber-cream

// ---------------------------------------------------------------------------
// MATHS
// ---------------------------------------------------------------------------
export { clamp01, smoothstep, hash };
/** 0..1, eased (smoothstep), between frames a and b */
export const ramp = (f: number, a: number, b: number) => smoothstep((f - a) / (b - a));
const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** mix two #RRGGBB colours, t 0..1 -> "rgb(r,g,b)" */
export const mixColor = (a: string, b: string, t: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const u = clamp01(t);
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * u)).join(",")})`;
};
const mix3 = (a: string, b: string, t: number, c: string, u: number) => {
  const pa = hexRgb(a);
  const pb = hexRgb(b);
  const pc = hexRgb(c);
  const t1 = clamp01(t);
  const u1 = clamp01(u);
  return `rgb(${pa.map((v, i) => Math.round((v + (pb[i] - v) * t1) * (1 - u1) + pc[i] * u1)).join(",")})`;
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
    // pre-roll the damper along the track's run-in so frame 0 is in steady motion
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
/** the soft vignette of the reference pieces (screen space; draw last) */
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
// PERSON: one engraved standing figure (front view, long belted tunic to the
// knee, bare legs). Figure units: feet at (0, 0), 100 units tall, up = -y.
// Cream form, firm dark outline, the shaded (right) side a tone down with a few
// hatch strokes; light from the upper left. Pure paths, no filters.
// ---------------------------------------------------------------------------
const TUNIC =
  "M-4,-83C-8,-82.5 -11.5,-81.5 -13,-79C-13.6,-71 -11.6,-63 -10.4,-58C-12.5,-50 -14.8,-40 -16,-30.5Q-10,-27.6 -5,-29.4Q0,-27.2 6,-29.2Q11,-27.4 16,-30.5C14.8,-40 12.5,-50 10.4,-58C11.6,-63 13.6,-71 13,-79C11.5,-81.5 8,-82.5 4,-83Q0,-79.5 -4,-83Z";
const TUNIC_SHADE = "M6,-82.6C9,-82 11.8,-81.2 13,-79C13.6,-71 11.6,-63 10.4,-58C12.5,-50 14.8,-40 16,-30.5Q11,-27.4 7.4,-28.8C7.6,-40 6.4,-50 5.4,-58C6.6,-66 7,-75 6,-82.6Z";
const LEG_L = "M-9.6,-31C-10,-22 -8.8,-12 -8.2,-5.2L-12.6,-1.8Q-13.4,0 -11.6,0L-3.4,0L-3.8,-5.4C-3.4,-13 -2.2,-22 -2.4,-31Z";
const LEG_R = "M9.6,-31C10,-22 8.8,-12 8.2,-5.2L12.6,-1.8Q13.4,0 11.6,0L3.4,0L3.8,-5.4C3.4,-13 2.2,-22 2.4,-31Z";
const ARM_L =
  "M-12.6,-80C-17,-78.4 -18.6,-70 -18.8,-60C-19.4,-54 -19.6,-49 -19.2,-45.5C-19.6,-42.6 -18.6,-40.2 -17.2,-40.2C-15.6,-40.2 -15,-42.8 -15.2,-45.6C-14.8,-50 -14.4,-55 -14.2,-60C-13.6,-66 -12.8,-71 -11.4,-74Z";
const ARM_R =
  "M12.6,-80C17,-78.4 18.6,-70 18.8,-60C19.4,-54 19.6,-49 19.2,-45.5C19.6,-42.6 18.6,-40.2 17.2,-40.2C15.6,-40.2 15,-42.8 15.2,-45.6C14.8,-50 14.4,-55 14.2,-60C13.6,-66 12.8,-71 11.4,-74Z";
const NECK = "M-3,-87L-3.6,-81.6Q0,-78.8 3.6,-81.6L3,-87Z";
const HEAD = "M-5.8,-92.5C-5.8,-100 5.8,-100 5.8,-92.5C5.8,-88 3,-84.2 0,-84.2C-3,-84.2 -5.8,-88 -5.8,-92.5Z";
const HEAD_SHADE = "M2.8,-97.4C5.6,-96 5.8,-93 5.8,-92.5C5.8,-88.6 3.6,-85.2 1.6,-84.5C3.4,-88 3.8,-93 2.8,-97.4Z";
const HAIR = "M-6.3,-91C-7.6,-102.4 7.6,-102.4 6.3,-91C5.2,-95.6 -2.6,-97 -6.3,-91Z";
const FOLDS =
  "M-10.4,-58Q0,-55.4 10.4,-58M-10.9,-60.6Q0,-58 10.9,-60.6M-18.8,-60L-14.2,-60M18.8,-60L14.2,-60M-6,-55L-8.5,-30.4M2.2,-55.4L3.4,-29.2M-1.6,-50L-2.2,-38M-12.4,-79.4C-12.6,-76 -12,-72 -11.4,-70";
const FACE = "M-3.6,-92.6L-1.3,-92.8M1.2,-92.8L3.5,-92.6M0.2,-92.2L0.8,-89.2L-0.3,-89M-1.5,-86.9L1.6,-86.9";
const HATCH =
  "M12.2,-76.5L7.8,-72M12.6,-72.4L7.6,-67.2M12,-67.6L7.6,-63.2M11.4,-63.2L8,-59.8M12.2,-53L8,-48.4M13.2,-48.4L8.4,-43.2M14.2,-43.6L9,-38M15,-38.6L9.6,-32.8M15.2,-33.4L12,-30M9,-26L5.4,-22.2M9,-21L5,-16.8M8.6,-16L5,-12.2M8.2,-11L5,-7.6M18.2,-71L15,-67.6M18.6,-66L15,-62.2M18.8,-56L15,-52M18.8,-51L15.4,-47.4M-13,-74L-15.6,-71.2M-13,-69.4L-15.8,-66.4";

export type PersonProps = {
  /** world px of the FEET (the point it stands on, and topples about) */
  x: number;
  y: number;
  /** standing height in world px (60-200 reads best) */
  h: number;
  /** 0 = cream, 1 = orange (infected) */
  tone?: number;
  /** 0 = standing, 1 = lying on the ground, dead (pass LINEAR progress; the fall accelerates by itself) */
  fallen?: number;
  /** 1 = falls to screen right, -1 = to screen left */
  facing?: 1 | -1;
  /** small variation in build / height / tilt / hair */
  seed?: number;
  opacity?: number;
};
export const Person: React.FC<PersonProps> = ({ x, y, h, tone = 0, fallen = 0, facing = 1, seed = 0, opacity = 1 }) => {
  const build = 0.9 + 0.24 * hash(seed, 1);
  const tall = 0.94 + 0.12 * hash(seed, 2);
  const tilt = (hash(seed, 3) - 0.5) * 5;
  const hairK = hash(seed, 4);
  const headX = (hash(seed, 5) - 0.5) * 1.6;
  const fl = clamp01(fallen);
  const fall = Math.pow(fl, 2.2); // gravity: slow to tip, fast to land
  const dead = smoothstep((fl - 0.7) / 0.3);
  const s = (h / 100) * tall;
  const ang = tilt * (1 - fall) + facing * 90 * fall;
  const lift = -7.5 * s * build * fall; // lying, the body rests ON the ground line
  const main = mix3(INK, ACCENT, tone, DEAD, dead);
  const deep = mix3(INK_DEEP, ACCENT_DEEP, tone, "#6E624E", dead);
  const hair = mix3(hairK > 0.5 ? "#8C7F60" : "#6F6249", "#A66A0A", tone, "#5C5241", dead);
  const out = { stroke: DARK, strokeWidth: 1.7, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };
  return (
    <g transform={`translate(${x} ${y + lift}) rotate(${ang}) scale(${s * build} ${s})`} opacity={opacity}>
      <path d={LEG_L} fill={main} {...out} />
      <path d={LEG_R} fill={deep} {...out} />
      <path d={TUNIC} fill={main} {...out} />
      <path d={TUNIC_SHADE} fill={deep} />
      <path d={ARM_L} fill={main} {...out} />
      <path d={ARM_R} fill={deep} {...out} />
      <path d={NECK} fill={deep} {...out} strokeWidth={1.3} />
      <g transform={`translate(${headX} 0)`}>
        <path d={HEAD} fill={main} {...out} />
        <path d={HEAD_SHADE} fill={deep} />
        <path d={HAIR} fill={hair} {...out} strokeWidth={1.3} />
        <path d={FACE} fill="none" stroke={DARK} strokeWidth={0.85} strokeOpacity={0.75} strokeLinecap="round" />
      </g>
      <path d={FOLDS} fill="none" stroke={DARK} strokeWidth={1.05} strokeOpacity={0.85} strokeLinecap="round" />
      <path d={HATCH} fill="none" stroke={DARK} strokeWidth={0.8} strokeOpacity={0.72} strokeLinecap="round" />
    </g>
  );
};

// ---------------------------------------------------------------------------
// MEDALLION: an engraved roundel (thin cream ring; the marmot's head and
// shoulders, or Hooke's flea on a LAND disc). Bitmaps are inlined (data URLs).
// ---------------------------------------------------------------------------
let medallionUid = 0;
export const Medallion: React.FC<{ kind: "marmot" | "flea"; cx: number; cy: number; r: number; accent?: boolean; opacity?: number }> = ({ kind, cx, cy, r, accent = false, opacity = 1 }) => {
  const id = React.useMemo(() => `plagueMed${medallionUid++}`, []);
  const ring = accent ? ACCENT : INK;
  const w = Math.max(2.5, r * 0.035);
  return (
    <g opacity={opacity}>
      <clipPath id={id}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <circle cx={cx} cy={cy} r={r + w * 2.6} fill={DARK} fillOpacity={0.55} />
      <circle cx={cx} cy={cy} r={r} fill={LAND} />
      <image href={kind === "marmot" ? MARMOT_ROUNDEL : FLEA_ROUNDEL} x={cx - r} y={cy - r} width={2 * r} height={2 * r} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={DARK} strokeWidth={w * 0.6} />
      <circle cx={cx} cy={cy} r={r + w * 0.8} fill="none" stroke={ring} strokeWidth={w} />
      <circle cx={cx} cy={cy} r={r + w * 2.6} fill="none" stroke={ring} strokeWidth={w * 0.4} strokeOpacity={0.8} />
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
  sc?: boolean; // IM Fell English SC (small caps: places, years)
  italic?: boolean;
  appear: number; // frame the slide starts
  frame: number; // the current frame
  anchor?: "start" | "middle" | "end";
  fill?: string;
  spacing?: number; // letter spacing in em
  children?: React.ReactNode;
};
export const Label: React.FC<LabelProps> = ({ x, y, size = 46, sc = false, italic = false, appear, frame, anchor = "middle", fill = INK, spacing, children }) => {
  const u = clamp01((frame - appear) / 10);
  if (u <= 0) return null;
  const e = 1 - Math.pow(1 - u, 3);
  return (
    <text
      x={x}
      y={y + 24 * (1 - e)}
      opacity={smoothstep(u)}
      textAnchor={anchor}
      fontFamily={sc ? fellSC : fell}
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
// GERM: the plague bacterium mark: a short solid orange capsule at a seeded
// angle. One path for any number of them.
// ---------------------------------------------------------------------------
/** path data of one capsule's axis (stroke it 2r wide, round caps) */
export const germ = (x: number, y: number, r: number, seed = 0) => {
  const a = hash(seed, 7) * Math.PI;
  const l = r * (0.7 + 0.35 * hash(seed, 8));
  const dx = Math.cos(a) * l;
  const dy = Math.sin(a) * l;
  return `M${(x - dx).toFixed(2)},${(y - dy).toFixed(2)}L${(x + dx).toFixed(2)},${(y + dy).toFixed(2)}`;
};
export type GermPoint = { x: number; y: number; seed?: number };
export const Germs: React.FC<{ points: GermPoint[]; r: number; tone?: number; casing?: boolean; opacity?: number }> = ({ points, r, tone = 1, casing = true, opacity = 1 }) => {
  if (!points.length) return null;
  const d = points.map((p, i) => germ(p.x, p.y, r, p.seed ?? i)).join("");
  return (
    <g opacity={opacity} fill="none" strokeLinecap="round">
      {casing ? <path d={d} stroke={DARK} strokeWidth={2 * r + Math.max(1.2, r * 0.5)} strokeOpacity={0.7} /> : null}
      <path d={d} stroke={mixColor(ACCENT_DEEP, ACCENT, tone)} strokeWidth={2 * r} />
    </g>
  );
};
