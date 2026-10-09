import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  CAM_LIFT,
  FRAME_H,
  FRAME_W,
  INK_HI,
  K_REF,
  HatchFill as SharedHatchFill,
  Label as SharedLabel,
  camFromTrack,
  clamp01,
  cumLen,
  easeOutCubic,
  edgeFactor,
  glideTargetAt,
  hash01,
  labelPx as sharedLabelPx,
  labelWidth as sharedLabelWidth,
  mixHex,
  paperShadow,
  pointAtLen,
  runFollower,
  smoothstep,
  subPathD,
  worldBlur,
} from "./chinatalkShared";
import type { Anchor, Cam, DashMod, Glide, LabelSize, Pt, StageView } from "./chinatalkShared";
import { BG_OVERSIZE, sway } from "./fieldShared";

// ---------------------------------------------------------------------------
// chinatalkVintage — the "ChinaTalk, slightly vintage" kit (Logan Wright,
// "Brezhnev chose decay"). The same ChinaTalk look as chinatalkShared, as if
// it had been printed in the 1960s: aged rice paper, sepia-black ink,
// letterpress vermilion, real photographs as warm monochrome prints, a little
// print grain. Graphic builders import EVERYTHING from this file (it re-exports
// what they need from chinatalkShared) and hand-set no stroke width, font size
// or colour that is defined here.
//
// CONVENTIONS
// - Coordinates are WORLD px (y down). The camera is a plain CENTRE camera
//   {x, y, k}: world (cam.x, cam.y) lands at the true centre of the frame
//   (540, 960). No CAM_LIFT anywhere in this kit.
// - Weights and sizes are named in SCREEN px at k = 1 and go through the size
//   law vz(k) = k^-0.25 (chinatalkShared's sz(k), re-based at k = 1): on
//   screen a weight is px * k^0.75. lineW(k) / redW(k) / hairW(k) / wpx(px, k)
//   return the WORLD size to draw at camera zoom k.
// - `rung` is an absolute ink opacity (INK_HI 0.90 / INK_LO 0.42).
// - Everything time-dependent takes the master clock S, never useCurrentFrame().
// ---------------------------------------------------------------------------

export {
  CAM_DAMP,
  CAM_STIFF,
  EDGE_SAFE,
  ENTER_F,
  ENTER_LEAD,
  EXIT_F,
  FONT_SANS,
  FONT_SERIF,
  FRAME_H,
  FRAME_W,
  FeatherWipe,
  INK_HI,
  INK_LO,
  InkDiffuse,
  RISE_PX,
  RUNG_F,
  camEase,
  camFromTrack,
  camJerkAt,
  clamp01,
  cumLen,
  easeInCubic,
  easeInOutCubic,
  easeOutCubic,
  enterFrom,
  enterU,
  evenEase,
  exitU,
  hash01,
  inkDiffuse,
  lerp,
  mixHex,
  paperShadow,
  pointAtLen,
  polyD,
  rungAt,
  shootEase,
  smoothstep,
  subPathD,
  toScreen,
  worldBlur,
} from "./chinatalkShared";
export type { Anchor, Cam, DashMod, FollowerState, Glide, LabelSize, Pt, StageView } from "./chinatalkShared";

// --- tokens ---------------------------------------------------------------------
/** aged rice paper: a light warm ivory (the ChinaTalk #F8F5EF, aged) */
export const V_PAPER = "#F2EBDB";
/** sepia-leaning warm black; used at INK_HI 0.90 (the subject) / INK_LO 0.42 (context) */
export const V_INK = "#241C16";
/** letterpress vermilion: the one accent (a touch deeper than ChinaTalk's #D0281C) */
export const RED = "#C9281C";
/** the accent at rest / negative / hidden */
export const RED_DEEP = "#89190F";
/** only on the wet stretch of a line or fill being drawn */
export const RED_WET = "#E2432D";
/** a single travelling highlight */
export const RED_HI = "#EC5C46";
/** the paper-white of a photographic print's border (a touch lighter than the sheet) */
export const V_PRINT_WHITE = "#F8F2E4";

/** every ink outline, SCREEN px at k = 1 */
export const LINE = 6;
/** a red data line, SCREEN px at k = 1 */
export const RED_LINE = 14;
/** the only thin line allowed (axis hairlines), SCREEN px at k = 1 */
export const HAIR = 2;
/** dashed ink (planned / expected / the road not taken): dash, gap and weight */
export const DASH = 22;
export const GAP = 16;
export const DASH_LINE = LINE - 1;
/** dashes march this many px per S frame (toward the head) */
export const MARCH = 0.5;
/** label sizes, SCREEN px (a floor: they grow as k^0.75 above k = 1, never shrink below) */
export const WORD_PX = 40;
export const VALUE_PX = 60;
/** corner grammar: pills fully round; containers 18; seal squares 5 */
export const CORNER = 18;
export const SEAL_R = 5;
/** one resource unit (a seal square), side in SCREEN px at k = 1 */
export const UNIT_PX = 26;
/** an icon is never smaller than this on screen */
export const ICON_MIN_PX = 96;
/** the bead at a wet line's tip: radius = 1.28 x the line weight */
export const BEAD_RATIO = 1.28;
/** the seams that count a RedBar into units, SCREEN px at k = 1 */
export const SEAM = 3;
/** the client's caption strip (screen y); nothing to READ may sit in it */
export const CAPTION_Y0 = 1080;
export const CAPTION_Y1 = 1250;
/** clear margin at the frame's sides, screen px */
export const SIDE_SAFE = 60;

export const PAPER_VINTAGE_SRC = "china/paper_vintage.png";
export const FIBRE_VINTAGE_SRC = "china/fibre_vintage.png";
export const GRAIN_SRCS = ["china/grain_0.png", "china/grain_1.png", "china/grain_2.png", "china/grain_3.png"];

// --- the size law -----------------------------------------------------------------
/** World multiplier at camera k for a size named in screen px at k = 1 (screen size ~ k^0.75). */
export const vz = (k: number) => Math.pow(k, -0.25);
/** World size of something that is `px` on screen at k = 1, under the size law. */
export const wpx = (px: number, k: number) => px * vz(k);
/** World size of something that must be EXACTLY `px` on screen at every zoom. */
export const constPx = (px: number, k: number) => px / k;
/** World stroke width of every ink outline at camera k. */
export const lineW = (k: number) => LINE * vz(k);
/** World stroke width of a red data line at camera k. */
export const redW = (k: number) => RED_LINE * vz(k);
/** World stroke width of a hairline at camera k. */
export const hairW = (k: number) => HAIR * vz(k);
/** converts a kit weight (screen px at k = 1) to a chinatalkShared `width` (world px at K_REF) */
const TO_SHARED = Math.pow(K_REF, -0.25);

// ---------------------------------------------------------------------------
// THE CAMERA. A plain centre camera; the damped follower of chinatalkShared,
// with CAM_LIFT cancelled.
// ---------------------------------------------------------------------------
/** The camera that puts world (lookX, lookY) at the true centre of the frame at zoom k. */
export const vCam = (lookX: number, lookY: number, k: number): Cam => ({ x: lookX, y: lookY, k });
/** A camera key: at frame f the camera LOOKS at world (x, y) with zoom k. `ease`
 *  shapes the segment ARRIVING at this key: "smooth" (default: eases out of the
 *  previous key and into this one) or "linear" (a steady push / drift). */
export type VCamKey = { f: number; x: number; y: number; k: number; ease?: "smooth" | "linear" };
/** The un-damped keyed target at frame f (holds before the first and after the last key). */
export const vTargetAt = (keys: VCamKey[], f: number): Cam => {
  if (f <= keys[0].f) return { x: keys[0].x, y: keys[0].y, k: keys[0].k };
  for (let i = 1; i < keys.length; i++) {
    const a = keys[i - 1];
    const b = keys[i];
    if (f <= b.f) {
      const u = (f - a.f) / Math.max(1e-6, b.f - a.f);
      const e = b.ease === "linear" ? u : smoothstep(u);
      return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, k: Math.exp(Math.log(a.k) + (Math.log(b.k) - Math.log(a.k)) * e) };
    }
  }
  const z = keys[keys.length - 1];
  return { x: z.x, y: z.y, k: z.k };
};
const unlift = (t: Cam): Cam => ({ x: t.x, y: t.y - CAM_LIFT / t.k, k: t.k });
/** The camera track for a cut: `keys` (sorted by f) are chased by the house
 *  damped follower (CAM_STIFF / CAM_DAMP), starting AT REST on the first key at
 *  its frame. Returns camAt(S) for fractional S. The follower rounds every
 *  corner, so "linear" segments make steady pushes with soft starts. To be
 *  already moving on frame 0, put the first key at a negative frame (f: -24).
 *  To keep a settled frame alive, end with a slow "linear" key at the last
 *  frame of the tail. `lastFrame` extends the track past the last key. */
export const runVCamera = (keys: VCamKey[], lastFrame?: number) => {
  const ks = [...keys].sort((a, b) => a.f - b.f);
  const f0 = Math.floor(ks[0].f);
  const f1 = Math.max(Math.ceil(ks[ks.length - 1].f), lastFrame ?? 0, f0 + 1);
  const { cams } = runFollower((f) => unlift(vTargetAt(ks, f)), f0, f1);
  return camFromTrack(cams, f0);
};
/** The same follower over a chinatalkShared glide list (superposed eased deltas from `start`). */
export const runVGlides = (start: Cam, glides: Glide[], f0: number, f1: number) => {
  const { cams } = runFollower((f) => unlift(glideTargetAt(start, glides, f)), f0, f1);
  return camFromTrack(cams, f0);
};
/** The world point under a screen point (no sway). */
export const toWorld = (c: Cam, sx: number, sy: number): Pt => ({
  x: c.x + (sx - FRAME_W / 2) / c.k,
  y: c.y + (sy - FRAME_H / 2) / c.k,
});

// ---------------------------------------------------------------------------
// THE STAGE
// ---------------------------------------------------------------------------
const VStageViewContext = React.createContext<StageView | null>(null);
/** The camera + sway of the VStage this element is drawn in (null outside one). */
export const useVStageView = (): StageView | null => React.useContext(VStageViewContext);

/** edge toning: the corners go this far toward a warm brown; the middle stays clean */
export const EDGE_TONE = 0.11;
export const EDGE_BROWN = "#8A5A2B";
/** print finish strengths (soft-light layer opacities) */
export const GRAIN_OPACITY = 0.6;
export const FIBRE_OPACITY = 0.45;
/** the print grain changes every this many frames */
export const GRAIN_HOLD = 2;

const hexRgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
/** the multiply colour that moves V_PAPER a fraction t toward EDGE_BROWN */
const toneAt = (t: number) => {
  const p = hexRgb(V_PAPER);
  const b = hexRgb(EDGE_BROWN);
  const c = p.map((pv, i) => Math.round(255 * (1 - t * (1 - b[i] / pv))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
};
// the frame's corners sit at 70.7 % of this ellipse, the middle of the long edges at 50 %
const EDGE_GRADIENT = `radial-gradient(ellipse 100% 100% at 50% 50%, #FFFFFF 28%, ${toneAt(0.14 * EDGE_TONE)} 42%, ${toneAt(
  0.42 * EDGE_TONE,
)} 55%, ${toneAt(0.74 * EDGE_TONE)} 64%, ${toneAt(EDGE_TONE)} 70.7%, ${toneAt(1.2 * EDGE_TONE)} 100%)`;

const groundTransform = (S: number, cam: Cam, rest: Cam) => {
  const k = cam.k;
  const bgY = -(cam.y - rest.y) * k * 0.15 - S * 0.3;
  const bgX = -(cam.x - rest.x) * k * 0.15;
  const bgScale = Math.max(0.6, 1 + (k - 1) * 0.3);
  return `translate(-50%, -50%) translate(${bgX.toFixed(2)}px, ${bgY.toFixed(2)}px) scale(${bgScale.toFixed(4)})`;
};
const groundStyle = (transform: string): React.CSSProperties => ({
  position: "absolute",
  left: "50%",
  top: "50%",
  width: FRAME_W * BG_OVERSIZE,
  height: FRAME_H * BG_OVERSIZE,
  objectFit: "cover",
  transform,
});

/** The print finish (screen space, on top of everything): the paper's fibre
 *  showing faintly through flat ink and red, and a fine monochrome grain that
 *  changes every GRAIN_HOLD frames. Both are NEUTRAL soft-light layers (mean
 *  128), so they do not tint: strongest on mid-tones (about 4-6 % on a flat
 *  red), under 1 % on bare paper. VStage draws it; only use it directly on a
 *  frame that has no VStage. */
export const PrintFinish: React.FC<{ S: number; cam: Cam; rest: Cam }> = ({ S, cam, rest }) => {
  const n = Math.floor(S / GRAIN_HOLD);
  const idx = ((n % GRAIN_SRCS.length) + GRAIN_SRCS.length) % GRAIN_SRCS.length;
  const ox = -Math.round(hash01(n, 3) * 120);
  const oy = -Math.round(hash01(n, 7) * 120);
  const fx = hash01(n, 11) > 0.5 ? -1 : 1;
  const fy = hash01(n, 13) > 0.5 ? -1 : 1;
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <Img
        src={staticFile(FIBRE_VINTAGE_SRC)}
        style={{ ...groundStyle(groundTransform(S, cam, rest)), mixBlendMode: "soft-light", opacity: FIBRE_OPACITY }}
      />
      {GRAIN_SRCS.map((src, i) => (
        <Img
          key={src}
          src={staticFile(src)}
          style={{
            position: "absolute",
            left: ox,
            top: oy,
            width: 1200,
            height: 2040,
            maxWidth: "none",
            transform: `scale(${fx}, ${fy})`,
            mixBlendMode: "soft-light",
            opacity: GRAIN_OPACITY,
            display: i === idx ? "block" : "none",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/** The paper stage. Layers, bottom to top: V_PAPER; the baked aged paper
 *  (oversized, parallax 0.15 against `rest`, slow drift on S); `photos` (an
 *  HTML WORLD layer: VintagePhoto elements, same camera transform as the
 *  drawing); `children` (the SVG WORLD layer: draw in world px, red ink can
 *  run over a photo); the aged-sheet edge toning; the print finish.
 *  `cam` is a centre camera: world (cam.x, cam.y) -> screen (540, 960).
 *  The house sway (5 / 3 px, very slow) is KEPT and applied to both world
 *  layers; `swayOn={false}` drops it. `finish={false}` drops the print finish. */
export const VStage: React.FC<{
  S: number;
  cam: Cam;
  /** the camera the paper's parallax is measured against (one fixed camera for the whole cut); default the frame centre at k = 1 */
  rest?: Cam;
  photos?: React.ReactNode;
  finish?: boolean;
  swayOn?: boolean;
  children?: React.ReactNode;
}> = ({ S, cam, rest, photos, finish = true, swayOn = true, children }) => {
  const sw = swayOn ? sway(S) : { dx: 0, dy: 0 };
  const k = cam.k;
  const tx = FRAME_W / 2 - cam.x * k + sw.dx;
  const ty = FRAME_H / 2 - cam.y * k + sw.dy;
  const r = rest ?? vCam(FRAME_W / 2, FRAME_H / 2, 1);
  const view: StageView = { cam, dx: sw.dx, dy: sw.dy };
  return (
    <AbsoluteFill style={{ backgroundColor: V_PAPER }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <Img src={staticFile(PAPER_VINTAGE_SRC)} style={groundStyle(groundTransform(S, cam, r))} />
      </AbsoluteFill>
      {photos ? (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: 0,
              height: 0,
              transformOrigin: "0 0",
              transform: `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${k.toFixed(6)})`,
            }}
          >
            <VStageViewContext.Provider value={view}>{photos}</VStageViewContext.Provider>
          </div>
        </AbsoluteFill>
      ) : null}
      <AbsoluteFill>
        <svg width={FRAME_W} height={FRAME_H} viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
          <g transform={`translate(${tx.toFixed(3)} ${ty.toFixed(3)}) scale(${k.toFixed(6)})`}>
            <VStageViewContext.Provider value={view}>{children}</VStageViewContext.Provider>
          </g>
        </svg>
      </AbsoluteFill>
      <AbsoluteFill style={{ pointerEvents: "none", mixBlendMode: "multiply", background: EDGE_GRADIENT }} />
      {finish ? <PrintFinish S={S} cam={cam} rest={r} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// THE PHOTOGRAPH: a real photograph as a period print (HTML world layer).
// ---------------------------------------------------------------------------
/** the print's border, world px */
export const PHOTO_BORDER = 14;
/** the duotone: blacks land on (slightly lifted) V_INK, whites a touch warmer than V_PAPER */
export const PHOTO_BLACK = "#31271F";
export const PHOTO_WHITE = "#F4EAD5";
export type PhotoBox = { x: number; y: number; w: number; h: number };
export type PhotoFocus = { x: number; y: number };

/** A photograph as a warm monochrome print. Pass it in VStage's `photos`.
 *  `box` is the PICTURE window in world px (the border lies outside it, so
 *  switching the border does not move the picture). The image covers the
 *  window (object-fit: cover); `focus` is its object-position as fractions
 *  (0..1; {x: 0.5, y: 0.5} = centred) and chooses the crop; `zoom` (>= 1)
 *  enlarges the image inside the window about the focus point. `src` is a path
 *  under public/ ("logan-brezhnev/x.jpg") or an already resolved staticFile()
 *  URL. Treatment: grayscale, gentle contrast, a sepia duotone (PHOTO_BLACK ..
 *  PHOTO_WHITE), a paper-white border, 3 px corners, a soft warm contact
 *  shadow; the stage's print grain lies over it. No halftone, vignette or blur. */
export const VintagePhoto: React.FC<{
  src: string;
  box: PhotoBox;
  focus?: PhotoFocus;
  zoom?: number;
  rotate?: number;
  border?: boolean;
  shadow?: boolean;
}> = ({ src, box, focus = { x: 0.5, y: 0.5 }, zoom = 1, rotate = 0, border = true, shadow = true }) => {
  const url = /^(\/|https?:|data:|blob:)/.test(src) ? src : staticFile(src);
  const b = border ? PHOTO_BORDER : 0;
  const pos = `${(focus.x * 100).toFixed(2)}% ${(focus.y * 100).toFixed(2)}%`;
  return (
    <div
      style={{
        position: "absolute",
        left: box.x - b,
        top: box.y - b,
        width: box.w + 2 * b,
        height: box.h + 2 * b,
        transform: rotate ? `rotate(${rotate.toFixed(3)}deg)` : undefined,
        transformOrigin: "50% 50%",
        backgroundColor: V_PRINT_WHITE,
        borderRadius: 3,
        boxShadow: shadow ? "0 10px 26px rgba(70,35,15,0.20), 0 2px 5px rgba(70,35,15,0.22)" : undefined,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: b,
          top: b,
          width: box.w,
          height: box.h,
          overflow: "hidden",
          isolation: "isolate",
          borderRadius: border ? 1 : 3,
          backgroundColor: PHOTO_BLACK,
        }}
      >
        <Img
          src={url}
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            maxWidth: "none",
            objectFit: "cover",
            objectPosition: pos,
            transform: zoom !== 1 ? `scale(${zoom.toFixed(5)})` : undefined,
            transformOrigin: pos,
            filter: "grayscale(1) contrast(0.93) brightness(1.04)",
          }}
        />
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", backgroundColor: PHOTO_BLACK, mixBlendMode: "screen" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", backgroundColor: PHOTO_WHITE, mixBlendMode: "multiply" }} />
        <div style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", boxShadow: "inset 0 0 0 1px rgba(36,28,22,0.22)" }} />
      </div>
    </div>
  );
};
/** Where a point of the photograph lands in the world: (u, v) are fractions of
 *  the SOURCE image (0..1 from its top-left), `natural` its pixel size. Use the
 *  same box / focus / zoom as the VintagePhoto (rotate must be 0). */
export const photoPoint = (
  box: PhotoBox,
  natural: { w: number; h: number },
  u: number,
  v: number,
  focus: PhotoFocus = { x: 0.5, y: 0.5 },
  zoom = 1,
): Pt => {
  const s = Math.max(box.w / natural.w, box.h / natural.h);
  const dw = natural.w * s;
  const dh = natural.h * s;
  const x0 = box.x + (box.w - dw) * focus.x + u * dw;
  const y0 = box.y + (box.h - dh) * focus.y + v * dh;
  const ox = box.x + focus.x * box.w;
  const oy = box.y + focus.y * box.h;
  return { x: ox + (x0 - ox) * zoom, y: oy + (y0 - oy) * zoom };
};

// ---------------------------------------------------------------------------
// LABELS: one system. Words 40 px (Source Sans 3 SemiBold caps, tracked),
// values 60 px (Source Serif 4 Bold), through the shared Label.
// ---------------------------------------------------------------------------
/** WORLD font size of a label class at camera k: on screen WORD_PX / VALUE_PX
 *  at k <= 1, growing as k^0.75 above. */
export const labelPx = (size: LabelSize, k: number) => {
  const px = size === "value" ? VALUE_PX : WORD_PX;
  return Math.max(px * vz(k), px / k);
};
/** Approximate advance width of a label, world px (slightly generous). */
export const labelWidth = (text: string, size: LabelSize, k: number) =>
  sharedLabelWidth(text, size, k) * (labelPx(size, k) / sharedLabelPx(size, k));
/** Cap height of a label class at k, world px. */
export const labelCapH = (size: LabelSize, k: number) => 0.668 * labelPx(size, k);

/** A label (SVG world). (x, y) anchors the CAPITALS' box (y = the caps' vertical
 *  centre). size "word" (caps, tracked; text is upper-cased) or "value" (serif
 *  numbers). `appear` / `exit` are raw 0..1 progress (enterU / enterFrom /
 *  exitU): it slides up 24 px while it fades and blurs in over 12 f. `diffuse`
 *  (0..1) retires it like ink on wet paper. A label that is part of the scene at
 *  frame 0 just leaves appear at 1. Fades out within 48 px of a frame edge. */
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
}> = ({ text, x, y, k, size, rung = INK_HI, appear = 1, exit = 0, diffuse = 0, anchor = "middle", color = V_INK }) => {
  const view = useVStageView();
  const fs = labelPx(size, k);
  const w = labelWidth(text, size, k);
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const edge = edgeFactor(view, x0, y - 0.45 * fs, x0 + w, y + 0.5 * fs);
  return (
    <SharedLabel
      text={text}
      x={x}
      y={y}
      k={k}
      size={size}
      rung={rung * edge}
      appear={appear}
      exit={exit}
      diffuse={diffuse}
      anchor={anchor}
      color={color}
      minPx={fs * k}
    />
  );
};

// ---------------------------------------------------------------------------
// INK AND RED MATERIALS
// ---------------------------------------------------------------------------
/** A `<g>` that gives its RED children the warm paper shadow (one filter for
 *  the whole group: wrap many Units / bars in ONE of these). Ink sits flat. */
export const RedGroup: React.FC<{ k: number; children: React.ReactNode }> = ({ k, children }) => (
  <g style={{ filter: paperShadow(k) }}>{children}</g>
);

/** The bead at a wet tip: a soft bloom, the dot, a small paper specular.
 *  `r` is the WORLD radius (default: the red line's bead at k). */
export const Bead: React.FC<{ id: string; x: number; y: number; k: number; r?: number; color?: string; opacity?: number; bloom?: boolean }> = ({
  id,
  x,
  y,
  k,
  r,
  color = RED,
  opacity = 1,
  bloom = true,
}) => {
  const rr = r ?? BEAD_RATIO * redW(k);
  if (opacity <= 0.002 || rr <= 0.01) return null;
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
          <circle cx={x.toFixed(3)} cy={y.toFixed(3)} r={(2.4 * rr).toFixed(3)} fill={`url(#${id}-bloom)`} />
        </>
      ) : null}
      <circle cx={x.toFixed(3)} cy={y.toFixed(3)} r={rr.toFixed(3)} fill={color} />
      <circle cx={(x - 0.36 * rr).toFixed(3)} cy={(y - 0.36 * rr).toFixed(3)} r={(0.26 * rr).toFixed(3)} fill={V_PAPER} opacity={0.5} />
    </g>
  );
};

/** wet stretch behind a drawing tip, world px, and how long it takes to dry */
export const WET_LEN = 90;
export const WET_DRY_F = 18;
/** A line WRITTEN in wet ink along a polyline, drawn [0, len] (world px of arc
 *  length). Red by default (RED_LINE, paper shadow); `ink` makes it an ink line
 *  (LINE, flat, at `rung`). The freshest WET_LEN behind the tip is wet (red:
 *  RED_WET, ink: full opacity; ~15 % thicker) and dries over WET_DRY_F frames:
 *  pass `ageAt(s)` = frames since arc length s was drawn. `bead` (0..1) shows
 *  the bead at the tip. `width` overrides the weight (SCREEN px at k = 1). */
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
  shadow?: boolean;
}> = ({ id, points, len, k, ageAt, ink = false, rung = INK_HI, width, bead = 0, wetLen = WET_LEN, shadow = true }) => {
  if (points.length < 2) return null;
  const cum = cumLen(points);
  const total = cum[cum.length - 1];
  const L = Math.max(0, Math.min(total, len ?? total));
  if (L <= 0.05) return null;
  const px = width ?? (ink ? LINE : RED_LINE);
  const w = px * vz(k);
  const color = ink ? V_INK : RED;
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
          stroke={ink ? V_INK : mixHex(RED, RED_WET, wet)}
          strokeOpacity={ink ? wet.toFixed(4) : undefined}
          strokeWidth={(w * (1 + 0.15 * wet)).toFixed(3)}
          strokeLinecap={s1 >= L - 0.05 ? "round" : "butt"}
          strokeLinejoin="round"
        />,
      );
    }
  }
  const tip = pointAtLen(points, cum, L);
  const beadR = BEAD_RATIO * w;
  const body = (
    <path d={subPathD(points, cum, 0, L)} fill="none" stroke={color} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />
  );
  if (ink) {
    return (
      <g>
        <g opacity={rung.toFixed(4)}>{body}</g>
        {segs.length ? <g opacity={Math.min(1, rung / INK_HI).toFixed(4)}>{segs}</g> : null}
        {bead > 0.002 ? <Bead id={id} x={tip.x} y={tip.y} k={k} r={beadR} color={V_INK} opacity={bead * Math.min(1, rung / INK_HI)} /> : null}
      </g>
    );
  }
  return (
    <g style={shadow ? { filter: paperShadow(k) } : undefined}>
      {body}
      {segs}
      {bead > 0.002 ? <Bead id={id} x={tip.x} y={tip.y} k={k} r={beadR} color={RED} opacity={bead} /> : null}
    </g>
  );
};

/** A plain ink stroke along a polyline, drawn head-first [0, draw]. `width` is
 *  a kit weight in SCREEN px at k = 1 (LINE by default; HAIR for an axis). */
export const InkPath: React.FC<{ points: Pt[]; k: number; draw?: number; rung?: number; width?: number; color?: string; close?: boolean }> = ({
  points,
  k,
  draw = 1,
  rung = INK_HI,
  width = LINE,
  color = V_INK,
  close = false,
}) => {
  const d = clamp01(draw);
  if (d <= 0.0005 || rung <= 0.002 || points.length < 2) return null;
  const pts = close ? [...points, points[0]] : points;
  const cum = cumLen(pts);
  return (
    <path
      d={subPathD(pts, cum, 0, cum[cum.length - 1] * d) + (close && d >= 1 ? "Z" : "")}
      fill="none"
      stroke={color}
      strokeOpacity={rung.toFixed(4)}
      strokeWidth={(width * vz(k)).toFixed(3)}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
};

/** A dashed ink line (dashed = planned / expected / the road not taken) along a
 *  polyline, drawn head-first [0, draw]; DASH / GAP at DASH_LINE, round caps.
 *  The dashes march toward the head on S (`march={false}` holds them still).
 *  `dashMod(i, sMid, total)` can move / fade / blur / spread dash i. */
export const DashedPath: React.FC<{
  points: Pt[];
  k: number;
  S?: number;
  draw?: number;
  rung?: number;
  width?: number;
  color?: string;
  march?: boolean;
  dashMod?: (i: number, sMid: number, total: number) => DashMod;
}> = ({ points, k, S = 0, draw = 1, rung = INK_HI, width = DASH_LINE, color = V_INK, march = true, dashMod }) => {
  const d = clamp01(draw);
  if (d <= 0.0005 || rung <= 0.002 || points.length < 2) return null;
  const cum = cumLen(points);
  const total = cum[cum.length - 1];
  const L = total * d;
  const s = vz(k);
  const P = (DASH + GAP) * s;
  const D = DASH * s;
  const w = width * s;
  const phase = march ? (MARCH * S) / (DASH + GAP) : 0;
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
    dashes.push(
      <path
        key={i}
        d={subPathD(points, cum, s0, s1)}
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

/** An ink hatch (with an optional flat wash under it) clipped to a closed
 *  region: the ChinaTalk area fill. `pitch` and `width` in SCREEN px at k = 1.
 *  House values: wash `fill` 0.10 under hatch `lineOpacity` 0.35. */
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
}> = ({ pitch = 20, width = LINE / 2, color = V_INK, ...rest }) => (
  <SharedHatchFill {...rest} color={color} pitch={pitch * TO_SHARED} width={width * TO_SHARED} />
);

// ---------------------------------------------------------------------------
// SHARED SHAPES: the red bar, its slot, the plan mark, the unit, the icon.
// ---------------------------------------------------------------------------
const axisOf = (from: Pt, to: Pt) => {
  const L = Math.hypot(to.x - from.x, to.y - from.y);
  const deg = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  return { L, deg, frame: `translate(${from.x.toFixed(3)} ${from.y.toFixed(3)}) rotate(${deg.toFixed(4)})` };
};
/** the gap between a Slot's outline centre and the bar it holds, world px */
const slotPad = (k: number) => lineW(k) / 2 - 0.5 / k;

/** A thick red bar from `from` toward `to`, `width` world px thick, drawn from
 *  its start to `len` world px (default: all of it). On its own it is a PILL
 *  with a round head (it emerges from its start cap). With `slot` it is the
 *  fill of a `Slot` with the same from / to / width: container corners and a
 *  flat front (a level). `seam` (world px pitch) counts it into units with
 *  fine paper seams. `wet` (0..1) wets the stretch behind the head while it is
 *  being drawn. Warm paper shadow unless `shadow={false}`. `id` unique. */
export const RedBar: React.FC<{
  id: string;
  from: Pt;
  to: Pt;
  width: number;
  k: number;
  len?: number;
  seam?: number;
  slot?: boolean;
  head?: "round" | "flat";
  radius?: number;
  color?: string;
  wet?: number;
  shadow?: boolean;
  opacity?: number;
}> = ({ id, from, to, width, k, len, seam = 0, slot = false, head, radius, color = RED, wet = 0, shadow = true, opacity = 1 }) => {
  const { L, frame } = axisOf(from, to);
  const ln = Math.max(0, Math.min(L, len ?? L));
  if (ln <= 0.05 || L <= 0.05 || opacity <= 0.002) return null;
  const h = width;
  const r = Math.max(0, Math.min(radius ?? (slot ? CORNER * vz(k) - slotPad(k) : h / 2), h / 2, L / 2));
  const hd = head ?? (slot ? "flat" : "round");
  const bodyW = hd === "round" ? Math.max(ln, 2 * r) : ln;
  const seams: string[] = [];
  if (seam > 0.5) {
    for (let x = seam; x < ln - 0.25 * seam; x += seam) seams.push(`M${x.toFixed(2)} ${(-h / 2 - 1).toFixed(2)}V${(h / 2 + 1).toFixed(2)}`);
  }
  const wetLen = Math.min(ln, WET_LEN);
  return (
    <g transform={frame} opacity={opacity < 1 ? opacity.toFixed(4) : undefined} style={shadow ? { filter: paperShadow(k) } : undefined}>
      <defs>
        <clipPath id={`${id}-pill`}>
          <rect x={0} y={(-h / 2).toFixed(3)} width={L.toFixed(3)} height={h.toFixed(3)} rx={r.toFixed(3)} />
        </clipPath>
        <clipPath id={`${id}-head`}>
          <rect x={(ln - bodyW).toFixed(3)} y={(-h / 2).toFixed(3)} width={bodyW.toFixed(3)} height={h.toFixed(3)} rx={hd === "round" ? r.toFixed(3) : 0} />
        </clipPath>
        {wet > 0.01 ? (
          <linearGradient id={`${id}-wet`} gradientUnits="userSpaceOnUse" x1={(ln - wetLen).toFixed(3)} y1={0} x2={ln.toFixed(3)} y2={0}>
            <stop offset={0} stopColor={RED_WET} stopOpacity={0} />
            <stop offset={1} stopColor={RED_WET} stopOpacity={clamp01(wet).toFixed(4)} />
          </linearGradient>
        ) : null}
      </defs>
      <g clipPath={`url(#${id}-pill)`}>
        <g clipPath={`url(#${id}-head)`}>
          <rect x={-1} y={(-h / 2 - 1).toFixed(3)} width={(ln + 2).toFixed(3)} height={(h + 2).toFixed(3)} fill={color} />
          {wet > 0.01 ? (
            <rect x={(ln - wetLen).toFixed(3)} y={(-h / 2 - 1).toFixed(3)} width={(wetLen + 1).toFixed(3)} height={(h + 2).toFixed(3)} fill={`url(#${id}-wet)`} />
          ) : null}
          {seams.length ? <path d={seams.join("")} fill="none" stroke={V_PAPER} strokeOpacity={0.82} strokeWidth={(SEAM * vz(k)).toFixed(3)} /> : null}
        </g>
      </g>
    </g>
  );
};

/** The ink outline a RedBar fills (same from / to / width as the bar with
 *  `slot`): rounded (CORNER; `radius` in world px overrides, e.g. width / 2 for
 *  a pill slot), LINE, at a rung. Draw it AFTER its bar. `dashed` = a planned
 *  slot. `wash` (0..0.10) tints the inside with ink. */
export const Slot: React.FC<{
  from: Pt;
  to: Pt;
  width: number;
  k: number;
  rung?: number;
  radius?: number;
  dashed?: boolean;
  wash?: number;
  color?: string;
}> = ({ from, to, width, k, rung = INK_HI, radius, dashed = false, wash = 0, color = V_INK }) => {
  const { L, frame } = axisOf(from, to);
  if (L <= 0.05 || rung <= 0.002) return null;
  const pad = slotPad(k);
  const lw = lineW(k);
  const r = Math.min(radius !== undefined ? radius + pad : CORNER * vz(k), width / 2 + pad);
  const s = vz(k);
  const box = {
    x: (-pad).toFixed(3),
    y: (-width / 2 - pad).toFixed(3),
    width: (L + 2 * pad).toFixed(3),
    height: (width + 2 * pad).toFixed(3),
    rx: r.toFixed(3),
  };
  return (
    <g transform={frame}>
      {wash > 0.002 ? <rect {...box} fill={color} opacity={Math.min(0.1, wash).toFixed(4)} /> : null}
      <rect
        {...box}
        fill="none"
        stroke={color}
        strokeOpacity={rung.toFixed(4)}
        strokeWidth={(dashed ? DASH_LINE * s : lw).toFixed(3)}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? `${(DASH * s).toFixed(2)} ${(GAP * s).toFixed(2)}` : undefined}
      />
    </g>
  );
};

/** The two ends of a mark that crosses a bar / slot at `at` world px from its
 *  start, overhanging it by `over` world px on each side. */
export const barCross = (from: Pt, to: Pt, width: number, at: number, over = 18): { from: Pt; to: Pt } => {
  const L = Math.max(1e-6, Math.hypot(to.x - from.x, to.y - from.y));
  const ux = (to.x - from.x) / L;
  const uy = (to.y - from.y) / L;
  const cx = from.x + ux * at;
  const cy = from.y + uy * at;
  const hw = width / 2 + over;
  return { from: { x: cx + uy * hw, y: cy - ux * hw }, to: { x: cx - uy * hw, y: cy + ux * hw } };
};

/** The PLAN: a dashed ink line from `from` to `to` (across a slot with
 *  barCross, or along a level), drawn [0, draw]. `solid` (0..1) writes a solid
 *  LINE over it from `from`: the plan became what happened. The dashes are
 *  still unless `march`. */
export const PlanMark: React.FC<{
  from: Pt;
  to: Pt;
  k: number;
  S?: number;
  rung?: number;
  draw?: number;
  solid?: number;
  march?: boolean;
  color?: string;
}> = ({ from, to, k, S = 0, rung = INK_HI, draw = 1, solid = 0, march = false, color = V_INK }) => {
  const pts = [from, to];
  const sd = clamp01(solid) * clamp01(draw);
  return (
    <g>
      {sd < 0.999 ? <DashedPath points={pts} k={k} S={S} draw={draw} rung={rung} march={march} color={color} /> : null}
      {sd > 0.0005 ? <InkPath points={pts} k={k} draw={sd} rung={rung} color={color} /> : null}
    </g>
  );
};

/** One resource unit: a seal square (UNIT_PX on screen at k = 1, corners
 *  SEAL_R), centred on (x, y). Red by default; `hollow` draws it as an ink-
 *  weight outline of the same outer size (an empty place for a unit). No
 *  shadow of its own: wrap a set of red units in ONE <RedGroup>. */
export const Unit: React.FC<{
  x: number;
  y: number;
  k: number;
  size?: number;
  color?: string;
  rotate?: number;
  opacity?: number;
  hollow?: boolean;
}> = ({ x, y, k, size = UNIT_PX, color, rotate = 0, opacity = 1, hollow = false }) => {
  if (opacity <= 0.002) return null;
  const s = vz(k);
  const side = size * s;
  const lw = lineW(k);
  const inset = hollow ? lw / 2 : 0;
  const c = color ?? (hollow ? V_INK : RED);
  return (
    <rect
      x={(x - side / 2 + inset).toFixed(3)}
      y={(y - side / 2 + inset).toFixed(3)}
      width={(side - 2 * inset).toFixed(3)}
      height={(side - 2 * inset).toFixed(3)}
      rx={Math.max(0, SEAL_R * s - inset).toFixed(3)}
      fill={hollow ? "none" : c}
      stroke={hollow ? c : undefined}
      strokeWidth={hollow ? lw.toFixed(3) : undefined}
      opacity={opacity < 1 ? opacity.toFixed(4) : undefined}
      transform={rotate ? `rotate(${rotate.toFixed(3)} ${x.toFixed(3)} ${y.toFixed(3)})` : undefined}
    />
  );
};

/** A chop-seal marker (a data point): a red square, corners SEAL_R, grown from
 *  its place over `grow` (raw 0..1). `size` = its side in SCREEN px at k = 1. */
export const Seal: React.FC<{ x: number; y: number; k: number; grow?: number; size?: number; color?: string; opacity?: number }> = ({
  x,
  y,
  k,
  grow = 1,
  size = UNIT_PX,
  color = RED,
  opacity = 1,
}) => {
  const g = easeOutCubic(grow);
  if (g <= 0.001) return null;
  return <Unit x={x} y={y} k={k} size={size * g} color={color} opacity={opacity} />;
};

/** Lucide path data (24 grid, ISC) of the icons in out/logan-brezhnev/icons,
 *  with rects and circles converted to paths. One string per sub-path. */
export const ICONS = {
  building2: [
    "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z",
    "M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2",
    "M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2",
    "M10 6h4",
    "M10 10h4",
    "M10 14h4",
    "M10 18h4",
  ],
  cpu: [
    "M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    "M10 9h4a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1z",
    "M15 2v2",
    "M15 20v2",
    "M2 15h2",
    "M2 9h2",
    "M20 15h2",
    "M20 9h2",
    "M9 2v2",
    "M9 20v2",
  ],
  factory: ["M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z", "M17 18h1", "M12 18h1", "M7 18h1"],
  house: [
    "M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8",
    "M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z",
  ],
  rocket: [
    "M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z",
    "m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z",
    "M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0",
    "M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5",
  ],
  tractor: [
    "m10 11 11 .9a1 1 0 0 1 .8 1.1l-.665 4.158a1 1 0 0 1-.988.842H20",
    "M16 18h-5",
    "M18 5a1 1 0 0 0-1 1v5.573",
    "M3 4h8.129a1 1 0 0 1 .99.863L13 11.246",
    "M4 11V4",
    "M7 15h.01",
    "M8 10.1V4",
    "M16 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0z",
    "M2 15a5 5 0 1 0 10 0a5 5 0 1 0-10 0z",
  ],
  trainFront: [
    "M8 3.1V7a4 4 0 0 0 8 0V3.1",
    "m9 15-1-1",
    "m15 15 1-1",
    "M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z",
    "m8 19-2 3",
    "m16 19 2 3",
  ],
  utilityPole: ["M12 2v20", "M2 5h20", "M3 3v2", "M7 3v2", "M17 3v2", "M21 3v2", "m19 5-7 7-7-7"],
  wheat: [
    "M2 22 16 8",
    "M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z",
    "M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z",
    "M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z",
    "M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z",
    "M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z",
    "M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z",
    "M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z",
  ],
  zap: ["M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"],
} as const;
export type IconName = keyof typeof ICONS;

/** An inline Lucide icon (24 grid, round caps and joins, no fill) centred on
 *  (x, y), its 24-box `size` world px wide (never under ICON_MIN_PX on
 *  screen), stroked at the kit's LINE weight ON SCREEN whatever its size.
 *  `d`: an ICONS entry, or your own 24-grid path data (one string per
 *  sub-path). `draw` (0..1) writes every stroke in from its start. */
export const Icon: React.FC<{
  d: readonly string[] | string;
  x: number;
  y: number;
  size: number;
  k: number;
  rung?: number;
  color?: string;
  rotate?: number;
  draw?: number;
}> = ({ d, x, y, size, k, rung = INK_HI, color = V_INK, rotate = 0, draw = 1 }) => {
  const dr = clamp01(draw);
  if (rung <= 0.002 || dr <= 0.0005) return null;
  const sc = Math.max(size, ICON_MIN_PX / k) / 24;
  const paths = typeof d === "string" ? [d] : d;
  return (
    <g
      transform={`translate(${x.toFixed(3)} ${y.toFixed(3)})${rotate ? ` rotate(${rotate.toFixed(3)})` : ""} scale(${sc.toFixed(5)}) translate(-12 -12)`}
      fill="none"
      stroke={color}
      opacity={rung.toFixed(4)}
      strokeWidth={(lineW(k) / sc).toFixed(4)}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((p, i) =>
        dr < 1 ? <path key={i} d={p} pathLength={1} strokeDasharray="1 1" strokeDashoffset={(1 - dr).toFixed(4)} /> : <path key={i} d={p} />,
      )}
    </g>
  );
};
