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
import { FIGURES, FLEA_CUT, FLEA_CUT_ASPECT, MARMOT_ROUNDEL, MARMOT_VIGNETTE, MARMOT_VIGNETTE_ASPECT } from "./plagueSharedData";

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
// INK (kit v2): what a builder draws by hand should look cut by the same
// graver as the woodcuts: lines with a little life, shade by hatching.
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
// PERSON (kit v2): a REAL engraving: six standing figures cut out of Cesare
// Vecellio's woodcuts (Habiti antichi et moderni, Venice 1598; Rijksmuseum
// BI-1938-0066, CC0), toned like Hooke's flea (paper INK, lines DARK), each
// also baked orange and dead (same pixels, so the versions cross-fade in
// place). Inlined bitmaps (plagueSharedData.ts; PNGs in public/plague/figures).
// Variants: 0 Bohemian man, 1 Bohemian woman, 2 English merchant, 3 country
// girl, 4 Netherlandish merchant, 5 Bavarian matron. Width ~0.50-0.56 x height.
// ---------------------------------------------------------------------------
export const PERSON_VARIANTS = FIGURES.length;
/** width / height of a variant's image */
export const personAspect = (variant: number) => FIGURES[((variant % FIGURES.length) + FIGURES.length) % FIGURES.length].w / FIGURES[((variant % FIGURES.length) + FIGURES.length) % FIGURES.length].h;
export type PersonProps = {
  /** world px of the FEET (the point it stands on, and topples about) */
  x: number;
  y: number;
  /** standing height in world px, hat to sole (seed varies it +-5 %) */
  h: number;
  /** 0 = cream, 1 = orange (infected); cross-fades */
  tone?: number;
  /** 0 = standing, 1 = lying on the ground, dead (pass LINEAR progress; the fall accelerates by itself) */
  fallen?: number;
  /** 1 = falls to screen right, -1 = to screen left */
  facing?: 1 | -1;
  /** picks the variant, a +-5 % height and a mirror flip */
  seed?: number;
  /** force a variant 0..5 (otherwise by seed) */
  variant?: number;
  /** false: no ground-shadow hatch */
  shadow?: boolean;
  opacity?: number;
};
export const Person: React.FC<PersonProps> = ({ x, y, h, tone = 0, fallen = 0, facing = 1, seed = 0, variant, shadow = true, opacity = 1 }) => {
  const n = FIGURES.length;
  const fig = FIGURES[(((variant ?? Math.floor(hash(seed, 1) * n)) % n) + n) % n];
  const H = h * (0.95 + 0.1 * hash(seed, 2));
  const W = (H * fig.w) / fig.h;
  const flip = hash(seed, 3) > 0.5 ? -1 : 1;
  const fl = clamp01(fallen);
  const fall = Math.pow(fl, 2.2); // gravity: slow to tip, fast to land
  const dead = smoothstep((fl - 0.7) / 0.3);
  const t = clamp01(tone);
  const img = (href: string, op: number) => <image href={href} x={-W * fig.footX} y={-H} width={W} height={H} opacity={op} preserveAspectRatio="none" />;
  return (
    <g opacity={opacity}>
      {shadow && fall < 1 ? <path d={groundHatch(x, y + H * 0.012, W * 0.42)} fill="none" stroke={INK} strokeWidth={Math.max(0.8, H * 0.008)} strokeOpacity={0.35 * (1 - fall)} strokeLinecap="round" /> : null}
      <g transform={`translate(${x} ${y - W * 0.2 * fall}) rotate(${facing * 90 * fall}) scale(${flip} 1)`}>
        {dead < 1 ? img(t >= 1 ? fig.orange : fig.cream, 1) : null}
        {dead < 1 && t > 0 && t < 1 ? img(fig.orange, t) : null}
        {dead > 0 ? img(fig.dead, dead) : null}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// MEDALLION: an engraved roundel, thin CREAM ring (never orange: orange is the
// plague only). "marmot": the standing marmot's head and shoulders. "flea":
// Hooke's flea as a cut-out on the page tone, a hatch shadow under it.
// ---------------------------------------------------------------------------
let medallionUid = 0;
export const Medallion: React.FC<{ kind: "marmot" | "flea"; cx: number; cy: number; r: number; accent?: boolean; opacity?: number }> = ({ kind, cx, cy, r, opacity = 1 }) => {
  const id = React.useMemo(() => `plagueMed${medallionUid++}`, []);
  const w = Math.max(2.5, r * 0.035);
  const fw = r * 1.74;
  const fh = fw / FLEA_CUT_ASPECT;
  return (
    <g opacity={opacity}>
      <clipPath id={id}>
        <circle cx={cx} cy={cy} r={r} />
      </clipPath>
      <circle cx={cx} cy={cy} r={r + w * 2.6} fill={DARK} fillOpacity={0.55} />
      <circle cx={cx} cy={cy} r={r} fill={LAND} />
      {kind === "marmot" ? (
        <image href={MARMOT_ROUNDEL} x={cx - r} y={cy - r} width={2 * r} height={2 * r} preserveAspectRatio="xMidYMid slice" clipPath={`url(#${id})`} />
      ) : (
        <>
          <path d={groundHatch(cx - r * 0.06, cy + r * 0.6, r * 0.5, 11)} fill="none" stroke={INK} strokeWidth={Math.max(1, r * 0.014)} strokeOpacity={0.4} strokeLinecap="round" />
          <image href={FLEA_CUT} x={cx - fw / 2 + r * 0.02} y={cy - fh / 2 - r * 0.04} width={fw} height={fh} preserveAspectRatio="none" />
        </>
      )}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={DARK} strokeWidth={w * 0.6} />
      <circle cx={cx} cy={cy} r={r + w * 0.8} fill="none" stroke={INK} strokeWidth={w} />
      <circle cx={cx} cy={cy} r={r + w * 2.6} fill="none" stroke={INK} strokeWidth={w * 0.4} strokeOpacity={0.8} />
    </g>
  );
};

// ---------------------------------------------------------------------------
// MARMOT VIGNETTE (kit v2): Muetzel's three bobak marmots and the ground they
// sit on, as a book-illustration vignette: no rectangle, no sky; the engraving
// trails off raggedly into the page. (x, y) = TOP-LEFT in world px, w = width;
// height = w / MARMOT.aspect. MARMOT gives where things are, as FRACTIONS of
// the vignette's own box (fx of w, fy of h); marmotPoint() turns one into
// world px. The standing marmot faces LEFT; the two others sit in front of it.
// ---------------------------------------------------------------------------
export const MARMOT = {
  aspect: MARMOT_VIGNETTE_ASPECT, // w / h (1366 x 1335)
  nose: [0.415, 0.145] as Pt,
  eye: [0.48, 0.13] as Pt,
  head: [0.5, 0.13] as Pt, // middle of the standing marmot's head
  headTop: [0.52, 0.085] as Pt,
  /** back contour, nape -> rump (the right-hand outline) */
  back: [[0.63, 0.15], [0.7, 0.22], [0.8, 0.33], [0.88, 0.45], [0.94, 0.56], [0.97, 0.66]] as Pt[],
  /** front contour, throat -> belly (the left-hand outline) */
  chest: [[0.44, 0.2], [0.5, 0.3], [0.53, 0.42], [0.56, 0.55]] as Pt[],
  shoulder: [0.68, 0.24] as Pt,
  paw: [0.66, 0.49] as Pt,
  /** where its body meets the ground / goes behind the two in front */
  feet: [0.72, 0.6] as Pt,
  /** coarse silhouette of the standing marmot, clockwise from the nose */
  silhouette: [[0.415, 0.15], [0.44, 0.105], [0.52, 0.085], [0.6, 0.11], [0.66, 0.17], [0.76, 0.27], [0.86, 0.42], [0.94, 0.56], [0.97, 0.68], [0.86, 0.62], [0.72, 0.56], [0.56, 0.55], [0.53, 0.42], [0.5, 0.3], [0.45, 0.21], [0.42, 0.175]] as Pt[],
  /** the two marmots in front (rough centres) and the ground line */
  frontLeft: [0.3, 0.63] as Pt,
  frontRight: [0.68, 0.74] as Pt,
  groundY: 0.93,
};
export const marmotPoint = (x: number, y: number, w: number, f: Pt): Pt => [x + f[0] * w, y + (f[1] * w) / MARMOT.aspect];
/** SVG flavour (inside WorldSvg; inlined 820 px bitmap: fine up to ~800 px on screen) */
export const MarmotVignette: React.FC<{ x: number; y: number; w: number; opacity?: number }> = ({ x, y, w, opacity = 1 }) => (
  <image href={MARMOT_VIGNETTE} x={x} y={y} width={w} height={w / MARMOT.aspect} opacity={opacity} preserveAspectRatio="none" />
);
/** HTML flavour (inside WorldDiv; the full 1366 px PNG via staticFile: use when it is drawn large) */
export const MarmotVignetteImg: React.FC<{ x: number; y: number; w: number; opacity?: number }> = ({ x, y, w, opacity = 1 }) => (
  <Img src={staticFile("plague/marmot_vignette.png")} style={{ position: "absolute", left: x, top: y, width: w, height: w / MARMOT.aspect, maxWidth: "none", opacity }} />
);

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
