import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadSourceSans3 } from "@remotion/google-fonts/SourceSans3";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import { BG_OVERSIZE, CAM_DAMP, CAM_LIFT, CAM_STIFF, FRAME_H, FRAME_W, clamp01, smoothstep, squirclePath, sway } from "./fieldShared";

export { CAM_DAMP, CAM_LIFT, CAM_STIFF, FRAME_H, FRAME_W, clamp01, smoothstep, squirclePath };

// ---------------------------------------------------------------------------
// chinatalkShared — the ChinaTalk house kit, clip-agnostic (MEMORY.md
// "ChinaTalk style"). Lifted by COPYING from chinaGrowthTheme.ts /
// chinaGrowthGeom.ts / chinaGrowthShared.tsx / chinaGrowthSeg3.tsx (those files
// are untouched, so the Logan growth set renders exactly as delivered). No clip
// geometry lives here: tokens, the size law, the camera rig (with an exportable
// follower STATE), the paper Stage, Label + Odometer, the wet-ink line with its
// bead, seal squares, ink wash + hatch, the marching dashed path, ink diffusion.
//
// CONVENTIONS: coordinates are WORLD px (y grows down); `k` is the current
// camera zoom, which drives the size law sz(k) (screen size ~ k^0.75 at K_REF
// 1.2) for strokes, radii, label sizes, dash lengths and hatch pitch. `rung` is
// an ABSOLUTE ink opacity (INK_HI 0.90 / INK_LO 0.42; ease between them over
// RUNG_F with rungAt). `appear` / `exit` are raw linear progress 0..1; the
// component applies the house curves. Everything time-dependent takes the master
// clock S, never useCurrentFrame().
// ---------------------------------------------------------------------------

// --- tokens -------------------------------------------------------------------
export const PAPER = "#F8F5EF";
export const INK = "#1C1917";
/** the subject now */
export const INK_HI = 0.9;
/** context */
export const INK_LO = 0.42;
/** the one accent: what the clip is about, and nothing else */
export const RED = "#D0281C";
/** the accent at rest / negative / hidden */
export const RED_DEEP = "#8E1A12";
/** only on the wet stretch of a line or flow being drawn */
export const RED_WET = "#E8452F";
/** a single travelling highlight */
export const RED_HI = "#F2604A";
/** the PRC flag's star yellow (the flag only) */
export const FLAG_YELLOW = "#FFDE00";
/** Warm paper shadow, screen px, for RED elements only; divided by k inside the world group. */
export const paperShadow = (k: number) =>
  `drop-shadow(0 ${(4 / k).toFixed(3)}px ${(8 / k).toFixed(3)}px rgba(70,35,15,0.16))`;

const SERIF = loadSourceSerif4("normal", { weights: ["700"], subsets: ["latin"] });
const SANS = loadSourceSans3("normal", { weights: ["600"], subsets: ["latin"] });
/** numbers: Source Serif 4 Bold, lining figures, no tracking */
export const FONT_SERIF = SERIF.fontFamily;
/** words: Source Sans 3 SemiBold caps, tracked 0.12 em */
export const FONT_SANS = SANS.fontFamily;
export const PAPER_SRC = "china/paper.png";

// --- easing -------------------------------------------------------------------
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const easeOutCubic = (u: number) => 1 - Math.pow(1 - clamp01(u), 3);
export const easeInCubic = (u: number) => Math.pow(clamp01(u), 3);
export const easeInOutCubic = (u: number) => {
  const x = clamp01(u);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
/** "Shoot then settle": velocity 12u(1-u)^2 (zero at both ends, peak 1.78x the
 *  mean at u = 1/3), for a thing that launches fast and decelerates into place. */
export const shootEase = (u: number) => {
  const x = clamp01(u);
  return 1 - Math.pow(1 - x, 3) * (1 + 3 * x);
};
/** A stable hash in [0, 1). */
export const hash01 = (i: number, j = 0) => {
  const s = Math.sin(i * 12.9898 + j * 78.233) * 43758.5453;
  return s - Math.floor(s);
};
/** Mix two #RRGGBB colours in sRGB. */
export const mixHex = (a: string, b: string, t: number) => {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const tt = clamp01(t);
  const ch = (sh: number) => Math.round(((pa >> sh) & 255) + (((pb >> sh) & 255) - ((pa >> sh) & 255)) * tt);
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

// --- the size law -------------------------------------------------------------
export const K_REF = 1.2;
/** world size multiplier at camera k: screen size ~ k^0.75 */
export const sz = (k: number) => Math.pow(k / K_REF, -0.25);
/** the accent line / flow, world px at K_REF */
export const DATA_W = 9;
/** every ink line, world px at K_REF */
export const INK_W = 3.5;
/** a tip / marker radius, world px at K_REF */
export const DOT_R = 11.5;
/** an ink line's bead radius (the red bead's ratio to its stroke, on INK_W) */
export const INK_BEAD_R = (DOT_R / 4.5) * (INK_W / 2);
export const DASH = 16;
export const DASH_GAP = 12;
/** dashes march 0.5 world px per S frame at K_REF */
export const MARCH_W = 0.5;
export const HATCH_PITCH = 15;
export const TICK_HALF = 13;
/** ink wash + hatch absolute opacities (chinaGrowthSeg4 6i) */
export const WASH_FILL = 0.1;
export const WASH_HATCH = 0.35;
export const VALUE_PX = 50;
export const WORD_PX = 36;
export const LABEL_FLOOR = 0.8;
/** World font size of a label class at camera k (k^0.75 law, 80 % floor in wide shots). */
export const labelPx = (size: LabelSize, k: number) => {
  const px = size === "value" ? VALUE_PX : WORD_PX;
  return Math.max((px / K_REF) * sz(k), (LABEL_FLOOR * px) / k);
};

// --- text / rung timing -------------------------------------------------------
export const ENTER_F = 12;
export const ENTER_LEAD = 8;
export const EXIT_F = 10;
export const RISE_PX = 24;
export const RUNG_F = 12;
/** raw entrance progress of a label that LANDS on `wordS` (starts 8 f before it) */
export const enterU = (S: number, wordS: number) => clamp01((S - (wordS - ENTER_LEAD)) / ENTER_F);
/** raw entrance progress of one that STARTS at `startS` */
export const enterFrom = (S: number, startS: number) => clamp01((S - startS) / ENTER_F);
/** raw exit progress of an exit starting at `startS` */
export const exitU = (S: number, startS: number, f = EXIT_F) => clamp01((S - startS) / f);
/** an eased rung change from `from` to `to` starting at `startS` (12 f) */
export const rungAt = (S: number, startS: number, from: number, to: number) =>
  from + (to - from) * smoothstep((S - startS) / RUNG_F);
/** the text blur of an entrance / exit: 6 screen px -> 0 as it lands, and back on exit */
export const textBlurPx = (appear: number, exit: number) =>
  6 * ((1 - easeOutCubic(clamp01(appear))) + easeInCubic(clamp01(exit)));

// --- ink diffusion --------------------------------------------------------------
/** Ink on wet paper (chinaGrowthSeg3 6h): at progress u the thing blurs 0 -> 8
 *  SCREEN px and spreads 20 % about its centre (fast at first, as ink bleeds)
 *  while it fades (late), in place. Never a pop, never a sink. */
export const INK_BLUR = 8;
export const INK_SPREAD = 0.2;
export const inkDiffuse = (u: number) => {
  const x = clamp01(u);
  const b = easeOutCubic(x);
  return { opacity: 1 - smoothstep(x), blur: INK_BLUR * b, spread: INK_SPREAD * b };
};
/** A CSS blur inside the world group (screen px -> world px). */
export const worldBlur = (px: number, k: number) => (px > 0.01 ? `blur(${(px / k).toFixed(3)}px)` : undefined);
/** Wraps world content that diffuses away at progress `u` about (cx, cy). */
export const InkDiffuse: React.FC<{ u: number; k: number; cx: number; cy: number; children: React.ReactNode }> = ({
  u,
  k,
  cx,
  cy,
  children,
}) => {
  if (u <= 0) return <>{children}</>;
  const d = inkDiffuse(u);
  if (d.opacity <= 0.002) return null;
  const s = 1 + d.spread;
  return (
    <g opacity={d.opacity.toFixed(4)} style={{ filter: worldBlur(d.blur, k) }}>
      <g transform={`translate(${cx.toFixed(2)} ${cy.toFixed(2)}) scale(${s.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-cy).toFixed(2)})`}>
        {children}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// THE CAMERA RIG (copied from chinaGrowthGeom / outgrowShared). A camera is its
// own keyed track: GLIDES, each an eased delta of (look x, look y, ln k) over
// [f0, f1], superposed (each has zero velocity at both ends, so the sum is C1),
// then the damped follower (CAM_STIFF / CAM_DAMP). `look` is the content centre;
// the camera centre is look + CAM_LIFT / k, so content lands at screen y 835.
// NEW: the follower's STATE {pos, vel} is exportable at any frame, and a track
// can START from a state (a later builder continues the same follower without
// rebuilding the earlier glide list).
// ---------------------------------------------------------------------------
export type Glide = { f0: number; f1: number; dx?: number; dy?: number; k?: number; warp?: number; even?: number };
export type Cam = { x: number; y: number; k: number };
/** The follower at one frame: camera-centre position and per-frame velocity
 *  (x, y in world px, k in zoom units), plus the LOOK target it is chasing. */
export type FollowerState = { pos: Cam; vel: Cam; target: Cam };
export const camEase = (u: number, warp = 1) => smoothstep(Math.pow(clamp01(u), warp));
/** Position fraction of a trapezoidal-velocity move (ramps take fraction r). */
export const evenEase = (u: number, r: number) => {
  const x = clamp01(u);
  const rr = Math.max(0.01, Math.min(0.5, r));
  const vmax = 1 / (1 - rr);
  if (x < rr) return (vmax * x * x) / (2 * rr);
  if (x > 1 - rr) {
    const y = 1 - x;
    return 1 - (vmax * y * y) / (2 * rr);
  }
  return (vmax * rr) / 2 + vmax * (x - rr);
};
const glideE = (g: Glide, f: number) => {
  const u = (f - g.f0) / (g.f1 - g.f0);
  return g.even !== undefined ? evenEase(u, g.even) : camEase(u, g.warp ?? 1);
};
/** The LOOK target (content centre + k) at frame f of a glide list from `start`. */
export const glideTargetAt = (start: Cam, glides: Glide[], f: number): Cam => {
  let x = start.x;
  let y = start.y;
  let lk = Math.log(start.k);
  let kPrev = start.k;
  for (const g of glides) {
    const e = glideE(g, f);
    x += (g.dx ?? 0) * e;
    y += (g.dy ?? 0) * e;
    if (g.k !== undefined) {
      lk += (Math.log(g.k) - Math.log(kPrev)) * e;
      kPrev = g.k;
    }
  }
  return { x, y, k: Math.exp(lk) };
};
/** A camera centre from a LOOK (content centre) and k. */
export const camFromLook = (x: number, y: number, k: number): Cam => ({ x, y: y + CAM_LIFT / k, k });
/** The LOOK (content centre) of a camera. */
export const lookOf = (c: Cam): Cam => ({ x: c.x, y: c.y - CAM_LIFT / c.k, k: c.k });

/** Run the damped follower over integer frames f0..f1 (inclusive) chasing
 *  `targetAt(f)` (LOOK space). Starts AT REST on the first target unless a
 *  `from` state (the state at frame f0) is given. Returns camera centres and
 *  the follower state per frame, indexed f - f0. */
export const runFollower = (targetAt: (f: number) => Cam, f0: number, f1: number, from?: FollowerState) => {
  const cams: Cam[] = [];
  const states: FollowerState[] = [];
  const t0 = targetAt(f0);
  let c: Cam = from ? { ...from.pos } : camFromLook(t0.x, t0.y, t0.k);
  let v: Cam = from ? { ...from.vel } : { x: 0, y: 0, k: 0 };
  for (let f = f0; f <= f1; f++) {
    const tl = targetAt(f);
    if (f > f0) {
      const t = camFromLook(tl.x, tl.y, tl.k);
      v = {
        x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    cams.push({ ...c });
    states.push({ pos: { ...c }, vel: { ...v }, target: { ...tl } });
  }
  return { cams, states };
};
/** A camera track as a function of fractional S from per-frame cams starting at `f0`. */
export const camFromTrack = (cams: Cam[], f0: number) => (S: number): Cam => {
  const t = Math.max(0, Math.min(cams.length - 1, S - f0));
  const i = Math.min(cams.length - 2, Math.floor(t));
  const u = t - i;
  const a = cams[Math.max(0, i)];
  const b = cams[Math.max(0, i) + 1] ?? a;
  return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, k: a.k + (b.k - a.k) * u };
};
/** Where a world point lands on screen under camera c (no sway). */
export const toScreen = (c: Cam, x: number, y: number) => ({
  x: FRAME_W / 2 + (x - c.x) * c.k,
  y: FRAME_H / 2 + (y - c.y) * c.k,
});
/** Camera smoothness over S0..S1: max |dv| of fixed world points (screen px /
 *  frame^2), where, and the max screen speed. */
export const camJerkAt = (camAt: (S: number) => Cam, S0: number, S1: number, skip: number[] = []) => {
  let maxA = 0;
  let atS = S0;
  let maxV = 0;
  const pts = [
    [-300, -500],
    [300, 500],
    [0, 0],
  ];
  for (let S = S0 + 1; S < S1; S++) {
    const c0 = camAt(S - 1);
    const c1 = camAt(S);
    const c2 = camAt(S + 1);
    for (const [ox, oy] of pts) {
      const wx = c1.x + ox / c1.k;
      const wy = c1.y + oy / c1.k;
      const s0 = toScreen(c0, wx, wy);
      const s1 = toScreen(c1, wx, wy);
      const s2 = toScreen(c2, wx, wy);
      maxV = Math.max(maxV, Math.hypot(s1.x - s0.x, s1.y - s0.y));
      const a = Math.hypot(s2.x - 2 * s1.x + s0.x, s2.y - 2 * s1.y + s0.y);
      if (a > maxA && !skip.some((f) => S >= f && S < f + 3)) {
        maxA = a;
        atS = S;
      }
    }
  }
  return { maxA, atS, maxV };
};

// ---------------------------------------------------------------------------
// THE STAGE: rice paper (#F8F5EF + the baked fibre grain at parallax 0.15 with a
// slow drift), the world group under the camera (with the house sway), and the
// warm vignette (~5 %). The camera reaches world materials through context.
// ---------------------------------------------------------------------------
export type StageView = { cam: Cam; dx: number; dy: number };
const StageViewContext = React.createContext<StageView | null>(null);
export const useStageView = (): StageView | null => React.useContext(StageViewContext);
/** the label edge-fade margin, screen px */
export const EDGE_SAFE = 48;
/** 1 when the world box sits >= EDGE_SAFE screen px inside every frame edge, 0
 *  when any part touches an edge, smoothstep between. */
export const edgeFactor = (view: StageView | null, x0: number, y0: number, x1: number, y1: number) => {
  if (!view) return 1;
  const { cam, dx, dy } = view;
  const sx0 = FRAME_W / 2 + (x0 - cam.x) * cam.k + dx;
  const sx1 = FRAME_W / 2 + (x1 - cam.x) * cam.k + dx;
  const sy0 = FRAME_H / 2 + (y0 - cam.y) * cam.k + dy;
  const sy1 = FRAME_H / 2 + (y1 - cam.y) * cam.k + dy;
  return smoothstep(Math.min(sx0, FRAME_W - sx1, sy0, FRAME_H - sy1) / EDGE_SAFE);
};

const PaperGround: React.FC<{ S: number; cam: Cam; rest: Cam }> = ({ S, cam, rest }) => {
  const k = cam.k;
  const bgY = -(cam.y - rest.y) * k * 0.15 - S * 0.3;
  const bgX = -(cam.x - rest.x) * k * 0.15;
  const bgScale = 1 + (k - 1) * 0.3;
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <Img
        src={staticFile(PAPER_SRC)}
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: FRAME_W * BG_OVERSIZE,
          height: FRAME_H * BG_OVERSIZE,
          objectFit: "cover",
          transform: `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${Math.max(0.6, bgScale).toFixed(4)})`,
        }}
      />
    </AbsoluteFill>
  );
};
const WarmVignette: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      mixBlendMode: "multiply",
      background: "radial-gradient(ellipse 100% 100% at 50% 50%, #FFFFFF 32%, #FCFBF9 52%, #F5F3EF 70.7%, #F3F1ED 100%)",
    }}
  />
);
/** The paper Stage. `rest` is the camera the paper's parallax is measured
 *  against (one fixed camera for the whole clip). */
export const Stage: React.FC<{ S: number; cam: Cam; rest: Cam; children: React.ReactNode }> = ({ S, cam, rest, children }) => {
  const sw = sway(S);
  const k = cam.k;
  const tx = FRAME_W / 2 - cam.x * k + sw.dx;
  const ty = FRAME_H / 2 - cam.y * k + sw.dy;
  return (
    <AbsoluteFill style={{ backgroundColor: PAPER }}>
      <PaperGround S={S} cam={cam} rest={rest} />
      <AbsoluteFill>
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
          <g transform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(6)})`}>
            <StageViewContext.Provider value={{ cam, dx: sw.dx, dy: sw.dy }}>{children}</StageViewContext.Provider>
          </g>
        </svg>
      </AbsoluteFill>
      <WarmVignette />
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// LABELS
// ---------------------------------------------------------------------------
export type Anchor = "start" | "middle" | "end";
export type LabelSize = "value" | "word";
const TYPE = {
  value: { font: FONT_SERIF, weight: 700, track: 0, cap: 0.667, numeric: "lining-nums" as string | undefined },
  word: { font: FONT_SANS, weight: 600, track: 0.12, cap: 0.669, numeric: undefined as string | undefined },
};
const SERIF_EM: Record<string, number> = { "%": 0.9, ".": 0.28, ",": 0.28, "–": 0.52, " ": 0.24, "/": 0.42, $: 0.58 };
const SANS_EM: Record<string, number> = {
  A: 0.58, B: 0.6, C: 0.57, D: 0.64, E: 0.53, F: 0.51, G: 0.64, H: 0.67, I: 0.27, J: 0.47, K: 0.6, L: 0.5, M: 0.76,
  N: 0.67, O: 0.68, P: 0.59, Q: 0.68, R: 0.6, S: 0.55, T: 0.55, U: 0.66, V: 0.57, W: 0.85, X: 0.56, Y: 0.53, Z: 0.55,
  " ": 0.2, "%": 0.82, ".": 0.25, "–": 0.5, "/": 0.4,
};
/** Approximate advance width of a label, world px (slightly generous). */
export const labelWidth = (text: string, size: LabelSize, k: number) => {
  const fs = labelPx(size, k);
  const T = TYPE[size].track;
  let em = 0;
  for (const ch of text.toUpperCase()) {
    if (size === "value") em += SERIF_EM[ch] ?? (ch >= "0" && ch <= "9" ? 0.58 : 0.64);
    else em += SANS_EM[ch] ?? (ch >= "0" && ch <= "9" ? 0.51 : 0.6);
    em += T;
  }
  return (em - T) * fs;
};
/** Cap height of a label class at k, world px. */
export const labelCapH = (size: LabelSize, k: number) => TYPE[size].cap * labelPx(size, k);
const labelBox = (x: number, yCap: number, w: number, fs: number, anchor: Anchor, cap: number) => {
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const capH = cap * fs;
  return { x0, x1: x0 + w, y0: yCap - capH / 2 - 0.06 * fs, y1: yCap + capH / 2 + 0.14 * fs };
};

/** A label (world space). (x, y) = the anchor point of the CAPITALS' box (y is
 *  the caps' vertical centre). Enters sliding up 24 screen px + fade + blur 6 ->
 *  0 over 12 f; exits by the reverse; `diffuse` (0..1) retires it like ink
 *  instead. Fades out within EDGE_SAFE of a frame edge. `minPx` (optional) is a
 *  floor on the SCREEN font size (for a payoff label that must stay readable on a
 *  phone through a pull-back); without it the size law alone applies. */
export const Label: React.FC<{
  text: string;
  x: number;
  y: number;
  k: number;
  size: LabelSize;
  rung?: number;
  appear?: number;
  exit?: number;
  diffuse?: number;
  anchor?: Anchor;
  color?: string;
  minPx?: number;
}> = ({ text, x, y, k, size, rung = INK_HI, appear = 1, exit = 0, diffuse = 0, anchor = "middle", color = INK, minPx }) => {
  const view = useStageView();
  const a = clamp01(appear);
  const e = clamp01(exit);
  const t = TYPE[size];
  const fs0 = labelPx(size, k);
  const fs = minPx === undefined ? fs0 : Math.max(fs0, minPx / k);
  const lift = ((1 - easeOutCubic(a)) + easeInCubic(e)) * (RISE_PX / k);
  const w = labelWidth(text, size, k) * (fs / fs0);
  const box = labelBox(x, y + lift, w, fs, anchor, t.cap);
  const dif = inkDiffuse(diffuse);
  const op = rung * smoothstep(a) * (1 - smoothstep(e)) * dif.opacity * edgeFactor(view, box.x0, box.y0, box.x1, box.y1);
  if (op <= 0.002) return null;
  const comp = anchor === "middle" ? t.track / 2 : anchor === "end" ? t.track : 0;
  const blur = textBlurPx(a, e) + (diffuse > 0 ? dif.blur : 0);
  const cx = (box.x0 + box.x1) / 2;
  const s = 1 + (diffuse > 0 ? dif.spread : 0);
  return (
    <g style={{ filter: worldBlur(blur, k) }} opacity={op.toFixed(4)}>
      <text
        x={(x + comp * fs).toFixed(3)}
        y={(y + lift + (t.cap / 2) * fs).toFixed(3)}
        fontFamily={t.font}
        fontWeight={t.weight}
        fontSize={fs.toFixed(3)}
        letterSpacing={`${t.track}em`}
        textAnchor={anchor}
        fill={color}
        transform={s !== 1 ? `translate(${cx.toFixed(2)} ${(y + lift).toFixed(2)}) scale(${s.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-(y + lift)).toFixed(2)})` : undefined}
        style={t.numeric ? { fontVariantNumeric: t.numeric } : undefined}
      >
        {text.toUpperCase()}
      </text>
    </g>
  );
};

/** A number that rolls like an odometer (Source Serif, value class). `value` is
 *  continuous; each digit wheel turns with the digits below it (a wheel only
 *  moves while every lower wheel passes 9 -> 0, the units wheel always). A
 *  wheel spinning faster than ~0.35 digit/frame is motion-blurred vertically
 *  (`speed` = |dvalue/dS|), so a fast roll reads as a roll, not a flicker.
 *  Entrance / exit / diffuse / edge-fade as Label. */
export const Odometer: React.FC<{
  id: string;
  value: number;
  digits: number;
  x: number;
  y: number;
  k: number;
  speed?: number;
  rung?: number;
  appear?: number;
  exit?: number;
  diffuse?: number;
  anchor?: Anchor;
}> = ({ id, value, digits, x, y, k, speed = 0, rung = INK_HI, appear = 1, exit = 0, diffuse = 0, anchor = "start" }) => {
  const view = useStageView();
  const a = clamp01(appear);
  const e = clamp01(exit);
  const t = TYPE.value;
  const fs = labelPx("value", k);
  const lift = ((1 - easeOutCubic(a)) + easeInCubic(e)) * (RISE_PX / k);
  const dw = 0.58 * fs;
  const w = dw * digits;
  const box = labelBox(x, y + lift, w, fs, anchor, t.cap);
  const dif = inkDiffuse(diffuse);
  const op = rung * smoothstep(a) * (1 - smoothstep(e)) * dif.opacity * edgeFactor(view, box.x0, box.y0, box.x1, box.y1);
  if (op <= 0.002) return null;
  const capH = t.cap * fs;
  const pad = 0.1 * fs;
  const pitch = capH + 2.6 * pad; // one digit of wheel travel
  const yc = y + lift;
  const base = yc + capH / 2;
  const blur = textBlurPx(a, e) + (diffuse > 0 ? dif.blur : 0);
  const v = Math.max(0, value);
  const cols: React.ReactNode[] = [];
  for (let i = 0; i < digits; i++) {
    const p = digits - 1 - i; // power of ten
    const unit = Math.pow(10, p);
    const below = v % unit; // what the lower wheels show
    let pos = Math.floor(v / unit) % 10; // this wheel's resting digit
    // a wheel turns while all lower wheels pass from 9.x to 0 (the last unit of below)
    if (p > 0) {
      const frac = (below - (unit - 1)) / 1;
      if (frac > 0) pos += clamp01(frac);
    } else {
      pos = v % 10;
    }
    const d0 = Math.floor(pos) % 10;
    const f = pos - Math.floor(pos);
    const wheelSpeed = p === 0 ? speed : 0;
    const vb = Math.min(8, Math.max(0, (wheelSpeed - 0.35) * 4)); // screen px
    const xs = box.x0 + i * dw + dw / 2;
    const glyph = (dg: number, dy: number, key: string) => (
      <text key={key} x={xs.toFixed(3)} y={(base + dy).toFixed(3)} textAnchor="middle">
        {String(dg)}
      </text>
    );
    cols.push(
      <g key={i} filter={vb > 0.3 ? `url(#${id}-vblur)` : undefined}>
        {vb > 0.3 ? (
          <defs>
            <filter id={`${id}-vblur`} x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation={`0 ${(vb / k).toFixed(3)}`} />
            </filter>
          </defs>
        ) : null}
        {glyph(d0, -pitch * f, `a${i}`)}
        {f > 0.001 ? glyph((d0 + 1) % 10, pitch * (1 - f), `b${i}`) : null}
      </g>,
    );
  }
  return (
    <g style={{ filter: worldBlur(blur, k) }} opacity={op.toFixed(4)}>
      <defs>
        <clipPath id={`${id}-win`}>
          <rect x={(box.x0 - 0.2 * fs).toFixed(3)} y={(yc - capH / 2 - pad).toFixed(3)} width={(w + 0.4 * fs).toFixed(3)} height={(capH + 2 * pad).toFixed(3)} />
        </clipPath>
      </defs>
      <g
        clipPath={`url(#${id}-win)`}
        fontFamily={t.font}
        fontWeight={t.weight}
        fontSize={fs.toFixed(3)}
        fill={INK}
        style={{ fontVariantNumeric: "lining-nums tabular-nums" }}
      >
        {cols}
      </g>
    </g>
  );
};

// ---------------------------------------------------------------------------
// POLYLINES
// ---------------------------------------------------------------------------
export type Pt = { x: number; y: number };
export const cumLen = (pts: Pt[]) => {
  const c: number[] = [0];
  for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  return c;
};
export const pointAtLen = (pts: Pt[], cum: number[], s: number): Pt => {
  if (pts.length === 1) return pts[0];
  const L = cum[cum.length - 1];
  const t = Math.max(0, Math.min(L, s));
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= t) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo];
  const u = seg > 0 ? (t - cum[lo]) / seg : 0;
  return { x: pts[lo].x + (pts[hi].x - pts[lo].x) * u, y: pts[lo].y + (pts[hi].y - pts[lo].y) * u };
};
/** The sub-polyline [s0, s1] as an SVG path `d`. */
export const subPathD = (pts: Pt[], cum: number[], s0: number, s1: number) => {
  const a = pointAtLen(pts, cum, s0);
  const parts = [`M${a.x.toFixed(2)} ${a.y.toFixed(2)}`];
  for (let i = 1; i < pts.length - 1; i++) {
    if (cum[i] > s0 && cum[i] < s1) parts.push(`L${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`);
  }
  const b = pointAtLen(pts, cum, s1);
  parts.push(`L${b.x.toFixed(2)} ${b.y.toFixed(2)}`);
  return parts.join("");
};
export const polyD = (pts: Pt[], close = false) =>
  pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join("") + (close ? "Z" : "");

// ---------------------------------------------------------------------------
// MATERIALS
// ---------------------------------------------------------------------------
/** The bead: a soft bloom 2.6x its radius at 0.22, the dot, and a small
 *  paper-white specular up-left. `r` is the WORLD radius (already sized). */
export const Bead: React.FC<{ id: string; x: number; y: number; r: number; color?: string; opacity?: number; bloom?: boolean }> = ({
  id,
  x,
  y,
  r,
  color = RED,
  opacity = 1,
  bloom = true,
}) => {
  if (opacity <= 0.002 || r <= 0.01) return null;
  return (
    <g opacity={opacity < 1 ? opacity.toFixed(4) : undefined}>
      {bloom ? (
        <>
          <defs>
            <radialGradient id={`${id}-bloom`}>
              <stop offset={0} stopColor={color} stopOpacity={0.22} />
              <stop offset={0.45} stopColor={color} stopOpacity={0.11} />
              <stop offset={1} stopColor={color} stopOpacity={0} />
            </radialGradient>
          </defs>
          <circle cx={x.toFixed(3)} cy={y.toFixed(3)} r={(2.6 * r).toFixed(3)} fill={`url(#${id}-bloom)`} />
        </>
      ) : null}
      <circle cx={x.toFixed(3)} cy={y.toFixed(3)} r={r.toFixed(3)} fill={color} />
      <circle cx={(x - 0.36 * r).toFixed(3)} cy={(y - 0.36 * r).toFixed(3)} r={(0.28 * r).toFixed(3)} fill={PAPER} opacity={0.5} />
    </g>
  );
};

/** A line written in wet ink along a polyline: drawn [0, len]; the freshest
 *  WET_LEN world px behind the tip are wet (red: RED_WET, ink: full opacity) and
 *  ~15 % thicker, drying over WET_DRY_F frames. `ageAt(s)` = frames since arc
 *  length s was drawn (the caller keys it off its own tip history). The tip is
 *  a bead while `bead` > 0. Red lines carry the paper shadow; ink sits flat. */
export const WET_LEN = 70;
export const WET_DRY_F = 18;
export const WetLine: React.FC<{
  id: string;
  points: Pt[];
  len?: number;
  k: number;
  ageAt?: (s: number) => number;
  ink?: boolean;
  rung?: number;
  width?: number;
  bead?: number;
  wetLen?: number;
}> = ({ id, points, len, k, ageAt, ink = false, rung = INK_HI, width, bead = 0, wetLen = WET_LEN }) => {
  if (points.length < 2) return null;
  const cum = cumLen(points);
  const total = cum[cum.length - 1];
  const L = Math.max(0, Math.min(total, len ?? total));
  if (L <= 0.05) return null;
  const w = (width ?? (ink ? INK_W : DATA_W)) * sz(k);
  const color = ink ? INK : RED;
  const segs: React.ReactNode[] = [];
  if (ageAt) {
    const step = Math.max(2, wetLen / 14);
    for (let s0 = Math.max(0, L - wetLen); s0 < L - 0.05; s0 += step) {
      const s1 = Math.min(L, s0 + step);
      const mid = (s0 + s1) / 2;
      const wet = (1 - smoothstep(ageAt(mid) / WET_DRY_F)) * (1 - smoothstep((L - mid) / wetLen));
      if (wet < 0.02) continue;
      segs.push(
        <path
          key={s0.toFixed(1)}
          d={subPathD(points, cum, s0, s1)}
          fill="none"
          stroke={ink ? INK : mixHex(RED, RED_WET, wet)}
          strokeOpacity={ink ? wet.toFixed(4) : undefined}
          strokeWidth={(w * (1 + 0.15 * wet)).toFixed(3)}
          strokeLinecap={s1 >= L - 0.05 ? "round" : "butt"}
          strokeLinejoin="round"
        />,
      );
    }
  }
  const tip = pointAtLen(points, cum, L);
  const beadR = (ink ? INK_BEAD_R : DOT_R) * sz(k);
  const body = (
    <path d={subPathD(points, cum, 0, L)} fill="none" stroke={color} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
  );
  if (ink) {
    return (
      <g>
        <g opacity={rung.toFixed(4)}>{body}</g>
        {segs.length ? <g opacity={Math.min(1, rung / INK_HI).toFixed(4)}>{segs}</g> : null}
        {bead > 0.002 ? <Bead id={id} x={tip.x} y={tip.y} r={beadR} color={INK} opacity={bead * Math.min(1, rung / INK_HI)} /> : null}
      </g>
    );
  }
  return (
    <g style={{ filter: paperShadow(k) }}>
      {body}
      {segs}
      {bead > 0.002 ? <Bead id={id} x={tip.x} y={tip.y} r={beadR} color={RED} opacity={bead} /> : null}
    </g>
  );
};

/** A chop-seal square marker (corners 2 px), scaled in from 0 over `grow` (raw).
 *  `r` = half its side at K_REF (default DOT_R), sized by sz(k). */
export const Seal: React.FC<{ x: number; y: number; k: number; grow?: number; r?: number; color?: string; opacity?: number }> = ({
  x,
  y,
  k,
  grow = 1,
  r = DOT_R,
  color = RED,
  opacity = 1,
}) => {
  const g = easeOutCubic(grow);
  if (g <= 0.001 || opacity <= 0.002) return null;
  const side = 2 * r * sz(k) * g;
  const rr = Math.min(side / 2, 2 * sz(k) * g);
  return (
    <rect
      x={(x - side / 2).toFixed(3)}
      y={(y - side / 2).toFixed(3)}
      width={side.toFixed(3)}
      height={side.toFixed(3)}
      rx={rr.toFixed(3)}
      fill={color}
      opacity={opacity < 1 ? opacity.toFixed(4) : undefined}
    />
  );
};

/** A world-space hatch (pitch HATCH_PITCH x sz(k), at `angleDeg`) clipped to a
 *  closed region, with an optional flat wash of the same colour under it
 *  (`fill` opacity) and the lines at `lineOpacity`. Anchored at `anchor` so the
 *  lines stay put while the region moves or grows. `id` unique per frame. */
export const HatchFill: React.FC<{
  id: string;
  region: Pt[];
  k: number;
  color?: string;
  opacity?: number;
  pitch?: number;
  angleDeg?: number;
  width?: number;
  anchor?: Pt;
  fill?: number;
  lineOpacity?: number;
}> = ({ id, region, k, color = INK, opacity = 1, pitch = HATCH_PITCH, angleDeg = 45, width = INK_W * 0.6, anchor, fill = 0, lineOpacity = 1 }) => {
  if (region.length < 3 || opacity <= 0.002) return null;
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
  let nMin = Infinity;
  let nMax = -Infinity;
  for (const c of [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: minX, y: maxY },
    { x: maxX, y: maxY },
  ]) {
    const v = (c.x - an.x) * nrm.x + (c.y - an.y) * nrm.y;
    nMin = Math.min(nMin, v);
    nMax = Math.max(nMax, v);
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = Math.hypot(maxX - minX, maxY - minY);
  const segs: string[] = [];
  for (let i = Math.floor(nMin / pw); i <= Math.ceil(nMax / pw); i++) {
    const t = (cx - an.x) * nrm.x + (cy - an.y) * nrm.y - i * pw;
    const px = cx - nrm.x * t;
    const py = cy - nrm.y * t;
    segs.push(
      `M${(px - dir.x * half).toFixed(2)} ${(py - dir.y * half).toFixed(2)}L${(px + dir.x * half).toFixed(2)} ${(py + dir.y * half).toFixed(2)}`,
    );
  }
  const poly = polyD(region, true);
  return (
    <g opacity={opacity < 1 ? opacity.toFixed(4) : undefined}>
      <defs>
        <clipPath id={id}>
          <path d={poly} />
        </clipPath>
      </defs>
      {fill > 0 ? <path d={poly} fill={color} opacity={fill.toFixed(4)} /> : null}
      <path
        d={segs.join("")}
        clipPath={`url(#${id})`}
        stroke={color}
        strokeWidth={(width * s).toFixed(3)}
        strokeLinecap="butt"
        fill="none"
        strokeOpacity={lineOpacity < 1 ? lineOpacity.toFixed(4) : undefined}
      />
    </g>
  );
};

/** A feathered wipe mask (ink soaking in): content inside `box` is revealed
 *  along `dir` ("down" = top -> bottom, "up", "right", "left") up to progress
 *  u (0..1) with a soft front `feather` world px wide. Wrap content in it. */
export const FeatherWipe: React.FC<{
  id: string;
  box: { x0: number; y0: number; x1: number; y1: number };
  u: number;
  feather: number;
  dir?: "down" | "up" | "right" | "left";
  children: React.ReactNode;
}> = ({ id, box, u, feather, dir = "down", children }) => {
  if (u <= 0) return null;
  if (u >= 1) return <>{children}</>;
  const vertical = dir === "down" || dir === "up";
  const len = vertical ? box.y1 - box.y0 : box.x1 - box.x0;
  const front = (len + feather) * clamp01(u); // distance of the clear edge from the start
  const startC = vertical ? (dir === "down" ? box.y0 : box.y1) : dir === "right" ? box.x0 : box.x1;
  const sgn = dir === "down" || dir === "right" ? 1 : -1;
  const a = startC + sgn * (front - feather);
  const b = startC + sgn * front;
  const stops: React.ReactNode[] = [];
  for (let i = 0; i <= 6; i++) {
    const o = i / 6;
    stops.push(<stop key={i} offset={o.toFixed(4)} stopColor="#FFFFFF" stopOpacity={(1 - smoothstep(o)).toFixed(4)} />);
  }
  const g = vertical
    ? { x1: 0, y1: a, x2: 0, y2: b }
    : { x1: a, y1: 0, x2: b, y2: 0 };
  const pad = feather + 4;
  return (
    <g>
      <defs>
        <linearGradient id={`${id}-g`} gradientUnits="userSpaceOnUse" x1={g.x1.toFixed(3)} y1={g.y1.toFixed(3)} x2={g.x2.toFixed(3)} y2={g.y2.toFixed(3)}>
          {stops}
        </linearGradient>
        <mask id={`${id}-m`} maskUnits="userSpaceOnUse" x={(box.x0 - pad).toFixed(2)} y={(box.y0 - pad).toFixed(2)} width={(box.x1 - box.x0 + 2 * pad).toFixed(2)} height={(box.y1 - box.y0 + 2 * pad).toFixed(2)}>
          <rect x={(box.x0 - pad).toFixed(2)} y={(box.y0 - pad).toFixed(2)} width={(box.x1 - box.x0 + 2 * pad).toFixed(2)} height={(box.y1 - box.y0 + 2 * pad).toFixed(2)} fill={`url(#${id}-g)`} />
        </mask>
      </defs>
      <g mask={`url(#${id}-m)`}>{children}</g>
    </g>
  );
};

/** What a DashedPath's per-dash hook may return for one dash. */
export type DashMod = { dx?: number; dy?: number; opacity?: number; blur?: number; spread?: number } | null;
/** A dashed ink line ("dashed = expected / projected") drawn head-first along
 *  `points`, dashes marching toward the head on S (MARCH_W world px / frame at
 *  K_REF). `dashMod(i, sMid, total)` can move / fade / blur / spread dash i. */
export const DashedPath: React.FC<{
  points: Pt[];
  k: number;
  S: number;
  draw?: number;
  rung?: number;
  width?: number;
  color?: string;
  march?: boolean;
  dashMod?: (i: number, sMid: number, total: number) => DashMod;
}> = ({ points, k, S, draw = 1, rung = INK_HI, width = INK_W, color = INK, march = true, dashMod }) => {
  const d = clamp01(draw);
  if (d <= 0.0005 || rung <= 0.002 || points.length < 2) return null;
  const cum = cumLen(points);
  const total = cum[cum.length - 1];
  const L = total * d;
  const s = sz(k);
  const P = (DASH + DASH_GAP) * s;
  const D = DASH * s;
  const w = width * s;
  const phase = march ? (MARCH_W * S) / (DASH + DASH_GAP) : 0;
  const i0 = Math.floor(-phase - 1);
  const i1 = Math.ceil(L / P - phase + 1);
  const dashes: React.ReactNode[] = [];
  for (let i = i0; i <= i1; i++) {
    const a = (i + phase) * P;
    const b = a + D;
    const mod = dashMod ? dashMod(i, (a + b) / 2, total) : null;
    const op = mod && mod.opacity !== undefined ? mod.opacity : 1;
    const spread = mod?.spread ?? 0;
    const grow = (spread * D) / 2;
    const s0 = Math.max(0, a - grow);
    const s1 = Math.min(L, b + grow);
    if (s1 - s0 <= 0.05 || op <= 0.002) continue;
    const blur = mod?.blur ?? 0;
    const sub = subPathD(points, cum, s0, s1);
    dashes.push(
      <path
        key={i}
        d={sub}
        transform={mod?.dx || mod?.dy ? `translate(${(mod?.dx ?? 0).toFixed(2)} ${(mod?.dy ?? 0).toFixed(2)})` : undefined}
        opacity={op < 1 ? op.toFixed(4) : undefined}
        strokeWidth={spread > 0 ? (w * (1 + spread)).toFixed(3) : undefined}
        style={blur > 0.01 ? { filter: worldBlur(blur, k) } : undefined}
      />,
    );
  }
  return (
    <g opacity={rung.toFixed(4)} fill="none" stroke={color} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round">
      {dashes}
    </g>
  );
};

/** A plain ink stroke (INK_W through the size law) drawn head-first [0, draw]. */
export const InkPath: React.FC<{ points: Pt[]; k: number; draw?: number; rung?: number; width?: number; color?: string }> = ({
  points,
  k,
  draw = 1,
  rung = INK_HI,
  width = INK_W,
  color = INK,
}) => {
  const d = clamp01(draw);
  if (d <= 0.0005 || rung <= 0.002 || points.length < 2) return null;
  const cum = cumLen(points);
  return (
    <path
      d={subPathD(points, cum, 0, cum[cum.length - 1] * d)}
      fill="none"
      stroke={color}
      strokeOpacity={rung.toFixed(4)}
      strokeWidth={(width * sz(k)).toFixed(3)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

// --- the PRC flag (drawing copied from chinaGrowthFlag.tsx) ----------------------
const STAR_INNER = 0.382;
const starD = (c: Pt, r: number, a0: number) =>
  Array.from({ length: 10 }, (_, i) => {
    const rr = i % 2 === 0 ? r : r * STAR_INNER;
    const a = a0 + (i * Math.PI) / 5;
    return `${i ? "L" : "M"}${(c.x + rr * Math.cos(a)).toFixed(3)} ${(c.y + rr * Math.sin(a)).toFixed(3)}`;
  }).join("") + "Z";
/** The five stars of a flag w px wide whose top-left is (0, 0). */
export const flagStars = (w: number) => {
  const u = w / 30;
  const at = (ux: number, uy: number): Pt => ({ x: ux * u, y: uy * u });
  return [
    starD(at(5, 5), 3 * u, -Math.PI / 2),
    ...[
      [10, 2],
      [12, 4],
      [12, 7],
      [10, 9],
    ].map(([ux, uy]) => starD(at(ux, uy), u, Math.atan2(5 - uy, 5 - ux))),
  ];
};
/** The PRC flag as a WORLD object: its box (x0, y0) + world width w (3:2), drawn
 *  at its current SCREEN size and scaled by 1/k (2 px squircle corners at every
 *  zoom), paper shadow, entrance blur, Label's edge-fade. */
export const FlagWorld: React.FC<{ id: string; x0: number; y0: number; w: number; k: number; opacity?: number; blurPx?: number }> = ({
  id,
  x0,
  y0,
  w,
  k,
  opacity = 1,
  blurPx = 0,
}) => {
  const view = useStageView();
  const h = (w * 2) / 3;
  const op = opacity * edgeFactor(view, x0, y0, x0 + w, y0 + h);
  if (op <= 0.002) return null;
  const wS = w * k;
  const hS = h * k;
  const outline = squirclePath(wS, hS);
  const filter = (blurPx > 0.01 ? `blur(${(blurPx / k).toFixed(3)}px) ` : "") + paperShadow(k);
  return (
    <g opacity={op.toFixed(4)} style={{ filter }}>
      <g transform={`translate(${x0.toFixed(3)} ${y0.toFixed(3)}) scale(${(1 / k).toFixed(6)})`}>
        <defs>
          <clipPath id={`${id}-clip`}>
            <path d={outline} />
          </clipPath>
        </defs>
        <path d={outline} fill={RED} />
        <g clipPath={`url(#${id}-clip)`}>
          {flagStars(wS).map((d, i) => (
            <path key={i} d={d} fill={FLAG_YELLOW} />
          ))}
        </g>
      </g>
    </g>
  );
};
