import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { loadFont as loadSourceSerif4 } from "@remotion/google-fonts/SourceSerif4";
import {
  CAM_LIFT,
  FONT_SANS,
  FONT_SERIF,
  FRAME_H,
  FRAME_W,
  INK_HI,
  INK_LO,
  K_REF,
  RISE_PX,
  HatchFill as SharedHatchFill,
  camFromTrack,
  clamp01,
  cumLen,
  easeInCubic,
  easeOutCubic,
  edgeFactor,
  glideTargetAt,
  hash01,
  inkDiffuse,
  labelPx as sharedLabelPx,
  labelWidth as sharedLabelWidth,
  mixHex,
  paperShadow,
  pointAtLen,
  runFollower,
  smoothstep,
  subPathD,
  textBlurPx,
  worldBlur,
} from "./chinatalkShared";
import type { Anchor, Cam, DashMod, Glide, LabelSize, Pt, StageView } from "./chinatalkShared";
import { sway } from "./fieldShared";

// ---------------------------------------------------------------------------
// chinatalkVintage — the "ChinaTalk, slightly vintage" kit (Logan Wright,
// "Brezhnev chose decay"), PASS 2 "newsprint". The same ChinaTalk look as
// chinatalkShared, as if it had been printed in a 1960s newspaper, quietly: a
// newsprint page that is ONE object with the drawing (fibre and specks locked
// to the world), newspaper-black ink, one spot colour (vermilion), real
// photographs as halftone clippings with a cutline, rules / kicker / source
// line, a little print grain. No fake body text, mastheads, tears or stains.
// Graphic builders import EVERYTHING from this file (it re-exports what they
// need from chinatalkShared) and hand-set no stroke width, font size or colour
// that is defined here. Contract: out/logan-brezhnev/kit/KIT_READY.md and
// KIT_NEWS_READY.md.
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
/** NEWSPRINT (pass 2): a light, slightly grey page (was the aged ivory #F2EBDB) */
export const V_PAPER = "#EDE7D9";
/** newspaper black that has sunk into the paper (pass 2; was the sepia #241C16); INK_HI 0.90 (the subject) / INK_LO 0.42 (context) */
export const V_INK = "#211D1A";
/** letterpress vermilion: the one accent (a touch deeper than ChinaTalk's #D0281C) */
export const RED = "#C9281C";
/** the accent at rest / negative / hidden */
export const RED_DEEP = "#89190F";
/** only on the wet stretch of a line or fill being drawn */
export const RED_WET = "#E2432D";
/** a single travelling highlight */
export const RED_HI = "#EC5C46";
/** the paper of a clipping (its margin): newsprint a touch lighter than the page */
export const V_PRINT_WHITE = "#F2EDE1";
/** the border of the old warm print (`tone="print"`) */
const PRINT_BORDER_WHITE = "#F8F2E4";

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
/** a word that NAMES the thing on screen (caps, same face and tracking as a word label) */
export const HEAD_PX = 64;
/** newspaper rules: a bold rule's weight and the paper gap of a double rule, SCREEN px at k = 1 (hair = HAIR) */
export const RULE_BOLD = 5;
export const RULE_GAP = 6;
/** a clipping's cutline (WORLD px: it is part of the clipping) and a chart's source line (SCREEN px, a floor) */
export const CUTLINE_PX = 30;
export const SOURCE_PX = 28;
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

/** Source Serif 4 Italic (cutlines and source lines) */
export const FONT_SERIF_ITALIC = loadSourceSerif4("italic", { weights: ["400"], subsets: ["latin"] }).fontFamily;

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

/** edge toning (screen space): the corners go this far toward a grey-brown; the middle stays clean */
export const EDGE_TONE = 0.1;
export const EDGE_BROWN = "#7C6747";
/** print finish strengths: the grain (soft-light, screen space) and the fibre map (hard-light, on the page) */
export const GRAIN_OPACITY = 0.6;
export const FIBRE_OPACITY = 0.62;
/** the print grain changes every this many frames */
export const GRAIN_HOLD = 2;
/** the paper textures (baked tileable) repeat in world space: tile size (1 texel = 1 world px) and the world point
 *  of tile (0, 0)'s top-left (the standard frame sits in the middle of a tile) */
export const PAPER_TILE = { w: 2400, h: 4200 };
export const PAPER_ORIGIN = { x: -660, y: -1140 };

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

/** Where the paper plane sits on screen: paper point P (world px when locked)
 *  lands at (tx + P.x * s, ty + P.y * s). lock 1 = the page IS the world (it
 *  pans, zooms and sways with the drawing); lock 0 = the pass-1 behaviour
 *  (parallax 0.15 against `rest`, 30 % of the zoom, a slow upward drift). */
type PaperPlane = { tx: number; ty: number; s: number };
const paperPlane = (S: number, cam: Cam, rest: Cam, lock: number, sw: { dx: number; dy: number }): PaperPlane => {
  const k = cam.k;
  const p = clamp01(lock);
  const loose = Math.max(0.6, 1 + (k - 1) * 0.3);
  const s = loose + (k - loose) * p;
  const par = (0.15 * k) / loose;
  const f = par + (1 - par) * p;
  const lx = rest.x + (cam.x - rest.x) * f;
  const ly = rest.y + (cam.y - rest.y) * f;
  return {
    tx: FRAME_W / 2 - lx * s + sw.dx * p,
    ty: FRAME_H / 2 - ly * s + sw.dy * p - (1 - p) * 0.3 * S,
    s,
  };
};
/** One (tileable) paper texture repeated over the visible part of the paper
 *  plane, so any camera position is covered without a seam. */
const PaperTiles: React.FC<{ src: string; plane: PaperPlane }> = ({ src, plane }) => {
  const { tx, ty, s } = plane;
  const i0 = Math.floor((-tx / s - PAPER_ORIGIN.x) / PAPER_TILE.w);
  const i1 = Math.floor(((FRAME_W - tx) / s - PAPER_ORIGIN.x) / PAPER_TILE.w);
  const j0 = Math.floor((-ty / s - PAPER_ORIGIN.y) / PAPER_TILE.h);
  const j1 = Math.floor(((FRAME_H - ty) / s - PAPER_ORIGIN.y) / PAPER_TILE.h);
  const tiles: React.ReactNode[] = [];
  for (let j = j0; j <= Math.min(j1, j0 + 3); j++) {
    for (let i = i0; i <= Math.min(i1, i0 + 3); i++) {
      tiles.push(
        <Img
          key={`${i}_${j}`}
          src={staticFile(src)}
          style={{
            position: "absolute",
            left: PAPER_ORIGIN.x + i * PAPER_TILE.w,
            top: PAPER_ORIGIN.y + j * PAPER_TILE.h,
            width: PAPER_TILE.w,
            height: PAPER_TILE.h,
            maxWidth: "none",
          }}
        />,
      );
    }
  }
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        top: 0,
        width: 0,
        height: 0,
        transformOrigin: "0 0",
        transform: `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${s.toFixed(6)})`,
      }}
    >
      {tiles}
    </div>
  );
};

/** The print finish, on top of everything. (1) The page's fibre and fine
 *  specks: a NEUTRAL map (mean 128) in hard-light, locked to the paper plane
 *  (`paperLock`), so the same fibres run through bare paper, paper-coloured
 *  knock-outs, red and ink. (2) A fine monochrome grain in soft-light, screen
 *  space, new every GRAIN_HOLD frames. Neither tints. VStage draws it; only use
 *  it directly on a frame that has no VStage. */
export const PrintFinish: React.FC<{ S: number; cam: Cam; rest: Cam; paperLock?: number; swayOn?: boolean }> = ({
  S,
  cam,
  rest,
  paperLock = 1,
  swayOn = true,
}) => {
  const n = Math.floor(S / GRAIN_HOLD);
  const idx = ((n % GRAIN_SRCS.length) + GRAIN_SRCS.length) % GRAIN_SRCS.length;
  const ox = -Math.round(hash01(n, 3) * 120);
  const oy = -Math.round(hash01(n, 7) * 120);
  const fx = hash01(n, 11) > 0.5 ? -1 : 1;
  const fy = hash01(n, 13) > 0.5 ? -1 : 1;
  const plane = paperPlane(S, cam, rest, paperLock, swayOn ? sway(S) : { dx: 0, dy: 0 });
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "hard-light", opacity: FIBRE_OPACITY }}>
        <PaperTiles src={FIBRE_VINTAGE_SRC} plane={plane} />
      </AbsoluteFill>
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

/** The newsprint stage. Layers, bottom to top: V_PAPER; the baked newsprint
 *  page (tiled, on the paper plane); `photos` (an HTML WORLD layer:
 *  VintagePhoto elements, same camera transform as the drawing); `children`
 *  (the SVG WORLD layer: draw in world px, red ink can run over a photo); the
 *  edge toning (screen space); the print finish (fibre on the paper plane,
 *  grain in screen space).
 *  `cam` is a centre camera: world (cam.x, cam.y) -> screen (540, 960).
 *  `paperLock` (0..1, default 1): 1 = the page is ONE object with the drawing
 *  (the paper texture and fibre pan, zoom and sway with the world); 0 = the
 *  pass-1 paper (parallax 0.15 against `rest`, slow drift). `rest` only matters
 *  below paperLock 1. The house sway (5 / 3 px, very slow) is KEPT and applied
 *  to both world layers (and the locked page); `swayOn={false}` drops it.
 *  `finish={false}` drops the print finish. */
export const VStage: React.FC<{
  S: number;
  cam: Cam;
  /** the camera the paper's parallax is measured against when paperLock < 1; default the frame centre at k = 1 */
  rest?: Cam;
  photos?: React.ReactNode;
  finish?: boolean;
  swayOn?: boolean;
  paperLock?: number;
  children?: React.ReactNode;
}> = ({ S, cam, rest, photos, finish = true, swayOn = true, paperLock = 1, children }) => {
  const sw = swayOn ? sway(S) : { dx: 0, dy: 0 };
  const k = cam.k;
  const tx = FRAME_W / 2 - cam.x * k + sw.dx;
  const ty = FRAME_H / 2 - cam.y * k + sw.dy;
  const r = rest ?? vCam(FRAME_W / 2, FRAME_H / 2, 1);
  const view: StageView = { cam, dx: sw.dx, dy: sw.dy };
  return (
    <AbsoluteFill style={{ backgroundColor: V_PAPER }}>
      <AbsoluteFill style={{ overflow: "hidden" }}>
        <PaperTiles src={PAPER_VINTAGE_SRC} plane={paperPlane(S, cam, r, paperLock, sw)} />
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
      {finish ? <PrintFinish S={S} cam={cam} rest={r} paperLock={paperLock} swayOn={swayOn} /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// THE PHOTOGRAPH (HTML world layer): a newspaper clipping, printed as a black
// halftone (`tone="news"`, the default), or the pass-1 warm print ("print").
// ---------------------------------------------------------------------------
/** the clipping's paper margin, world px */
export const PHOTO_BORDER = 14;
/** how much the bottom margin grows to hold a cutline, world px */
export const CUTLINE_BAND = 44;
/** the duotone of `tone="print"`: blacks on a lifted sepia ink, whites a touch warm */
export const PHOTO_BLACK = "#31271F";
export const PHOTO_WHITE = "#F4EAD5";
/** the halftone of `tone="news"`: dot pitch in WORLD px (the screen is part of the clipping and scales with it), at 45 degrees */
export const HALFTONE_PERIOD = 5.5;
/** neutral black halftone ink */
export const HALFTONE_INK = "#1D1B1A";
/** HALFTONE v2: `tone="news"` is a HYBRID. The picture is a continuous-tone black-and-white photograph (neutral
 *  ink blacks, the clipping's paper as white, its tones unchanged) with the dot screen mixed INTO it at this
 *  strength: 0 = a plain photograph, 1 = a screen that swings a mid-grey from black to white. The photograph
 *  comes first; the dots are a printed texture on it. */
export const HALFTONE_MIX = 0.38;
/** One grating of the screen: a cosine around mid-grey, amplitude HALFTONE_MIX / 2. The screen is the mean of two
 *  (at +-45 degrees), laid over the photograph in OVERLAY: strongest on mid-tones, fading to nothing in solid black
 *  and paper white, and it leaves the local mean alone. It is a pure cosine with no threshold, so there are no hard
 *  dot edges to alias into moire at half resolution. */
const htWave = (t: number) => 0.5 - 0.5 * HALFTONE_MIX * Math.cos(2 * Math.PI * t);
const HT_STEPS = 12;
const grating = (deg: number) =>
  `repeating-linear-gradient(${deg}deg, ${Array.from({ length: HT_STEPS + 1 }, (_, j) => {
    const v = Math.round(255 * htWave(j / HT_STEPS));
    return `rgb(${v},${v},${v}) ${((j / HT_STEPS) * HALFTONE_PERIOD).toFixed(3)}px`;
  }).join(", ")})`;
const fill: React.CSSProperties = { position: "absolute", left: 0, top: 0, width: "100%", height: "100%" };
export type PhotoBox = { x: number; y: number; w: number; h: number };
export type PhotoFocus = { x: number; y: number };
export type PhotoTone = "news" | "print";

/** A photograph on the page. Pass it in VStage's `photos`.
 *  `box` is the PICTURE window in world px (the margin lies outside it, so
 *  switching the border does not move the picture). The image covers the
 *  window (object-fit: cover); `focus` is its object-position as fractions
 *  (0..1; {x: 0.5, y: 0.5} = centred) and chooses the crop; `zoom` (>= 1)
 *  enlarges the image inside the window about the focus point. `src` is a path
 *  under public/ ("brezhnev/x.jpg") or an already resolved staticFile() URL.
 *  `tone`:
 *  - "news" (default): a newspaper clipping. The picture is a continuous-tone
 *    black-and-white photograph in neutral ink on the clipping's own newsprint
 *    with a HALFTONE screen mixed into it (HALFTONE_MIX; a 45-degree dot
 *    screen, HALFTONE_PERIOD world px, soft dots), a thin paper margin, a fine
 *    keyline and a light contact shadow. The screen lives in the clipping's
 *    space: it pans, zooms and rotates with it.
 *  - "print": the pass-1 warm monochrome photographic print.
 *  `cutline`: a one-line caption in the bottom margin (which grows by
 *  CUTLINE_BAND to hold it): Source Serif 4 Italic, CUTLINE_PX, sentence case
 *  as written. Do not add filters of your own. */
export const VintagePhoto: React.FC<{
  src: string;
  box: PhotoBox;
  focus?: PhotoFocus;
  zoom?: number;
  rotate?: number;
  border?: boolean;
  shadow?: boolean;
  tone?: PhotoTone;
  cutline?: string;
}> = ({ src, box, focus = { x: 0.5, y: 0.5 }, zoom = 1, rotate = 0, border = true, shadow = true, tone = "news", cutline }) => {
  const url = /^(\/|https?:|data:|blob:)/.test(src) ? src : staticFile(src);
  const news = tone === "news";
  const b = border ? PHOTO_BORDER : 0;
  const band = cutline ? CUTLINE_BAND : 0;
  const pos = `${(focus.x * 100).toFixed(2)}% ${(focus.y * 100).toFixed(2)}%`;
  const imgStyle: React.CSSProperties = {
    ...fill,
    maxWidth: "none",
    objectFit: "cover",
    objectPosition: pos,
    transform: zoom !== 1 ? `scale(${zoom.toFixed(5)})` : undefined,
    transformOrigin: pos,
  };
  const screen = Math.max(4096, Math.ceil(Math.max(box.w, box.h) / 1024) * 1024);
  const printShadow = "0 10px 26px rgba(70,35,15,0.20), 0 2px 5px rgba(70,35,15,0.22)";
  const newsShadow = "0 4px 11px rgba(45,35,25,0.13), 0 1px 2px rgba(45,35,25,0.15)";
  return (
    <div
      style={{
        position: "absolute",
        left: box.x - b,
        top: box.y - b,
        width: box.w + 2 * b,
        height: box.h + 2 * b + band,
        transform: rotate ? `rotate(${rotate.toFixed(3)}deg)` : undefined,
        transformOrigin: "50% 50%",
        backgroundColor: news ? V_PRINT_WHITE : PRINT_BORDER_WHITE,
        borderRadius: news ? 1 : 3,
        boxShadow: shadow ? (news ? newsShadow : printShadow) : undefined,
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
          borderRadius: news ? 0 : border ? 1 : 3,
          backgroundColor: news ? V_PRINT_WHITE : PHOTO_BLACK,
        }}
      >
        {news ? (
          <>
            <div style={{ ...fill, mixBlendMode: "multiply" }}>
              <Img src={url} style={{ ...imgStyle, filter: "grayscale(1)" }} />
              <div style={{ position: "absolute", left: 0, top: 0, width: screen, height: screen, mixBlendMode: "overlay" }}>
                <div style={{ ...fill, background: grating(45) }} />
                <div style={{ ...fill, background: grating(-45), opacity: 0.5 }} />
              </div>
              <div style={{ ...fill, backgroundColor: HALFTONE_INK, mixBlendMode: "screen" }} />
            </div>
            <div style={{ ...fill, boxShadow: "inset 0 0 0 1.5px rgba(33,29,26,0.5)" }} />
          </>
        ) : (
          <>
            <Img src={url} style={{ ...imgStyle, filter: "grayscale(1) contrast(0.93) brightness(1.04)" }} />
            <div style={{ ...fill, backgroundColor: PHOTO_BLACK, mixBlendMode: "screen" }} />
            <div style={{ ...fill, backgroundColor: PHOTO_WHITE, mixBlendMode: "multiply" }} />
            <div style={{ ...fill, boxShadow: "inset 0 0 0 1px rgba(36,28,22,0.22)" }} />
          </>
        )}
      </div>
      {cutline ? (
        <div
          style={{
            position: "absolute",
            left: b + 2,
            top: b + box.h + 10,
            width: box.w - 4,
            fontFamily: FONT_SERIF_ITALIC,
            fontStyle: "italic",
            fontWeight: 400,
            fontSize: CUTLINE_PX,
            lineHeight: 1.15,
            color: V_INK,
            opacity: INK_HI,
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {cutline}
        </div>
      ) : null}
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
// LABELS: one system. Words 40 px and heads 64 px (Source Sans 3 SemiBold caps,
// tracked), values 60 px (Source Serif 4 Bold).
// ---------------------------------------------------------------------------
/** the kit's label classes: the shared "word" / "value" plus "head" (a word that NAMES the thing on screen) */
export type VLabelSize = LabelSize | "head";
const LABEL_TYPE = {
  value: { font: FONT_SERIF, weight: 700, track: 0, cap: 0.667, numeric: "lining-nums" as string | undefined, px: VALUE_PX },
  word: { font: FONT_SANS, weight: 600, track: 0.12, cap: 0.669, numeric: undefined as string | undefined, px: WORD_PX },
  head: { font: FONT_SANS, weight: 600, track: 0.12, cap: 0.669, numeric: undefined as string | undefined, px: HEAD_PX },
};
/** WORLD font size of a label class at camera k: on screen WORD_PX / VALUE_PX /
 *  HEAD_PX at k <= 1, growing as k^0.75 above. */
export const labelPx = (size: VLabelSize, k: number) => {
  const px = LABEL_TYPE[size].px;
  return Math.max(px * vz(k), px / k);
};
/** Approximate advance width of a label, world px (slightly generous). */
export const labelWidth = (text: string, size: VLabelSize, k: number) => {
  const base: LabelSize = size === "value" ? "value" : "word";
  return sharedLabelWidth(text, base, k) * (labelPx(size, k) / sharedLabelPx(base, k));
};
/** Cap height of a label class at k, world px. */
export const labelCapH = (size: VLabelSize, k: number) => 0.668 * labelPx(size, k);

/** A label (SVG world). (x, y) anchors the CAPITALS' box (y = the caps' vertical
 *  centre). size "word" / "head" (tracked caps) or "value" (serif numbers).
 *  The text is upper-cased unless `transformCase="none"` (for "1950s").
 *  `appear` / `exit` are raw 0..1 progress (enterU / enterFrom / exitU): it
 *  slides up 24 px while it fades and blurs in over 12 f. `diffuse` (0..1)
 *  retires it like ink on wet paper. A label that is part of the scene at frame
 *  0 just leaves appear at 1. Fades out within 48 px of a frame edge. */
export const Label: React.FC<{
  text: string;
  x: number;
  y: number;
  k: number;
  size: VLabelSize;
  rung?: number;
  appear?: number;
  exit?: number;
  diffuse?: number;
  anchor?: Anchor;
  color?: string;
  transformCase?: "upper" | "none";
}> = ({ text, x, y, k, size, rung = INK_HI, appear = 1, exit = 0, diffuse = 0, anchor = "middle", color = V_INK, transformCase = "upper" }) => {
  const view = useVStageView();
  const a = clamp01(appear);
  const e = clamp01(exit);
  const t = LABEL_TYPE[size];
  const fs = labelPx(size, k);
  const w = labelWidth(text, size, k);
  const x0 = anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x;
  const edge = edgeFactor(view, x0, y - 0.45 * fs, x0 + w, y + 0.5 * fs);
  const lift = (1 - easeOutCubic(a) + easeInCubic(e)) * (RISE_PX / k);
  const dif = inkDiffuse(diffuse);
  const op = rung * edge * smoothstep(a) * (1 - smoothstep(e)) * dif.opacity;
  if (op <= 0.002) return null;
  const comp = anchor === "middle" ? t.track / 2 : anchor === "end" ? t.track : 0;
  const blur = textBlurPx(a, e) + (diffuse > 0 ? dif.blur : 0);
  const cx = x0 + w / 2;
  const sc = 1 + (diffuse > 0 ? dif.spread : 0);
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
        transform={
          sc !== 1
            ? `translate(${cx.toFixed(2)} ${(y + lift).toFixed(2)}) scale(${sc.toFixed(4)}) translate(${(-cx).toFixed(2)} ${(-(y + lift)).toFixed(2)})`
            : undefined
        }
        style={t.numeric ? { fontVariantNumeric: t.numeric } : undefined}
      >
        {transformCase === "upper" ? text.toUpperCase() : text}
      </text>
    </g>
  );
};

/** A chart's source line (SVG world): Source Serif 4 Italic, SOURCE_PX on screen
 *  (a floor, like the labels), low rung, sentence case as written. (x, y)
 *  anchors the capitals' box like a Label; same entrance (`appear`) and `exit`. */
export const SourceLine: React.FC<{
  text: string;
  x: number;
  y: number;
  k: number;
  rung?: number;
  appear?: number;
  exit?: number;
  anchor?: Anchor;
  color?: string;
}> = ({ text, x, y, k, rung = INK_LO, appear = 1, exit = 0, anchor = "start", color = V_INK }) => {
  const a = clamp01(appear);
  const e = clamp01(exit);
  const fs = Math.max(SOURCE_PX * vz(k), SOURCE_PX / k);
  const lift = (1 - easeOutCubic(a) + easeInCubic(e)) * (RISE_PX / k);
  const op = rung * smoothstep(a) * (1 - smoothstep(e));
  if (op <= 0.002) return null;
  return (
    <g style={{ filter: worldBlur(textBlurPx(a, e), k) }} opacity={op.toFixed(4)}>
      <text
        x={x.toFixed(3)}
        y={(y + lift + 0.334 * fs).toFixed(3)}
        fontFamily={FONT_SERIF_ITALIC}
        fontStyle="italic"
        fontWeight={400}
        fontSize={fs.toFixed(3)}
        textAnchor={anchor}
        fill={color}
      >
        {text}
      </text>
    </g>
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


// ---------------------------------------------------------------------------
// NEWSPAPER FURNITURE: rules, the kicker, solid pictograms.
// ---------------------------------------------------------------------------
export type RuleKind = "hair" | "bold" | "double";
/** A newspaper rule from `from` to `to` (SVG world), butt ends. "hair" = HAIR;
 *  "bold" = RULE_BOLD; "double" = a bold rule ON the line with a hair rule
 *  RULE_GAP under it (to the right of the direction of travel). `draw` (0..1)
 *  writes it in from `from`. */
export const Rule: React.FC<{
  from: Pt;
  to: Pt;
  k: number;
  kind?: RuleKind;
  rung?: number;
  draw?: number;
  color?: string;
}> = ({ from, to, k, kind = "hair", rung = INK_HI, draw = 1, color = V_INK }) => {
  const d = clamp01(draw);
  const L = Math.hypot(to.x - from.x, to.y - from.y);
  if (d <= 0.0005 || rung <= 0.002 || L <= 0.05) return null;
  const s = vz(k);
  const ux = (to.x - from.x) / L;
  const uy = (to.y - from.y) / L;
  const ex = from.x + (to.x - from.x) * d;
  const ey = from.y + (to.y - from.y) * d;
  const line = (off: number, w: number) => (
    <line
      x1={(from.x - uy * off).toFixed(3)}
      y1={(from.y + ux * off).toFixed(3)}
      x2={(ex - uy * off).toFixed(3)}
      y2={(ey + ux * off).toFixed(3)}
      strokeWidth={(w * s).toFixed(3)}
    />
  );
  return (
    <g stroke={color} opacity={rung.toFixed(4)} fill="none" strokeLinecap="butt">
      {kind === "hair" ? line(0, HAIR) : line(0, RULE_BOLD)}
      {kind === "double" ? line((RULE_BOLD / 2 + RULE_GAP + HAIR / 2) * s, HAIR) : null}
    </g>
  );
};

/** the clear space between a Kicker's caps and its rules, SCREEN px at k = 1 */
export const KICKER_PAD = 20;
/** A chart title set like a newspaper kicker: a "word" label between a bold
 *  rule above and a hair rule below, both `width` world px wide. (x, y) anchors
 *  the label's capitals (y = their vertical centre); `anchor` "start" (default:
 *  the rules run right from x), "middle" or "end". `appear` (raw 0..1) writes
 *  the rules in from the left while the label makes its entrance. */
export const Kicker: React.FC<{
  text: string;
  x: number;
  y: number;
  k: number;
  width: number;
  rung?: number;
  appear?: number;
  anchor?: Anchor;
}> = ({ text, x, y, k, width, rung = INK_HI, appear = 1, anchor = "start" }) => {
  const x0 = anchor === "middle" ? x - width / 2 : anchor === "end" ? x - width : x;
  const half = labelCapH("word", k) / 2 + KICKER_PAD * vz(k);
  const draw = easeOutCubic(clamp01(appear));
  return (
    <g>
      <Rule from={{ x: x0, y: y - half }} to={{ x: x0 + width, y: y - half }} k={k} kind="bold" rung={rung} draw={draw} />
      <Label text={text} x={x} y={y} k={k} size="word" rung={rung} appear={appear} anchor={anchor} />
      <Rule from={{ x: x0, y: y + half }} to={{ x: x0 + width, y: y + half }} k={k} kind="hair" rung={rung} draw={draw} />
    </g>
  );
};

/** Solid pictograms (Phosphor "fill", MIT; 256 box), from out/logan-brezhnev/icons/fill. */
export const PICTOS = {
  barn: "M240,192h-8V130.57l1.49,2.08a8,8,0,1,0,13-9.3l-40-56a8,8,0,0,0-2-1.94L137,18.77l-.1-.07a16,16,0,0,0-17.76,0l-.1.07L51.45,65.42a8,8,0,0,0-2,1.94l-40,56a8,8,0,1,0,13,9.3L24,130.57V192H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16ZM112,80h32a8,8,0,1,1,0,16H112a8,8,0,1,1,0-16Zm52.64,40L128,146.17,91.36,120ZM72,125.83,114.24,156,72,186.17ZM91.36,192,128,165.83,164.64,192ZM184,186.17,141.76,156,184,125.83Z",
  bread: "M200,40H48a40,40,0,0,0-16,76.65V200a16,16,0,0,0,16,16H200a16,16,0,0,0,16-16V116.65A40,40,0,0,0,200,40Zm-56,64a8,8,0,0,0,0,16v80H48V120a8,8,0,0,0,0-16,24,24,0,0,1,0-48h96a24,24,0,0,1,0,48Z",
  buildings: "M239.73,208H224V96a16,16,0,0,0-16-16H164a4,4,0,0,0-4,4V208H144V32.41a16.43,16.43,0,0,0-6.16-13,16,16,0,0,0-18.72-.69L39.12,72A16,16,0,0,0,32,85.34V208H16.27A8.18,8.18,0,0,0,8,215.47,8,8,0,0,0,16,224H240a8,8,0,0,0,8-8.53A8.18,8.18,0,0,0,239.73,208ZM76,184a8,8,0,0,1-8.53,8A8.18,8.18,0,0,1,60,183.72V168.27A8.19,8.19,0,0,1,67.47,160,8,8,0,0,1,76,168Zm0-56a8,8,0,0,1-8.53,8A8.19,8.19,0,0,1,60,127.72V112.27A8.19,8.19,0,0,1,67.47,104,8,8,0,0,1,76,112Zm40,56a8,8,0,0,1-8.53,8,8.18,8.18,0,0,1-7.47-8.26V168.27a8.19,8.19,0,0,1,7.47-8.26,8,8,0,0,1,8.53,8Zm0-56a8,8,0,0,1-8.53,8,8.19,8.19,0,0,1-7.47-8.26V112.27a8.19,8.19,0,0,1,7.47-8.26,8,8,0,0,1,8.53,8Z",
  cpu: "M104,104h48v48H104Zm136,48a8,8,0,0,1-8,8H216v40a16,16,0,0,1-16,16H160v16a8,8,0,0,1-16,0V216H112v16a8,8,0,0,1-16,0V216H56a16,16,0,0,1-16-16V160H24a8,8,0,0,1,0-16H40V112H24a8,8,0,0,1,0-16H40V56A16,16,0,0,1,56,40H96V24a8,8,0,0,1,16,0V40h32V24a8,8,0,0,1,16,0V40h40a16,16,0,0,1,16,16V96h16a8,8,0,0,1,0,16H216v32h16A8,8,0,0,1,240,152ZM168,96a8,8,0,0,0-8-8H96a8,8,0,0,0-8,8v64a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8Z",
  factory: "M232,208h-8V136c0-.05,0-.09,0-.14s0-.29,0-.43,0-.28,0-.41a.76.76,0,0,0,0-.15l-15-105.13A16.08,16.08,0,0,0,193.06,16H174.94A16.08,16.08,0,0,0,159.1,29.74l-11.56,80.91L108.8,81.6A8,8,0,0,0,96,88v32L44.8,81.6A8,8,0,0,0,32,88V208H24a8,8,0,0,0,0,16H232a8,8,0,0,0,0-16ZM108,184H80a8,8,0,0,1,0-16h28a8,8,0,0,1,0,16Zm68,0H148a8,8,0,0,1,0-16h28a8,8,0,0,1,0,16Zm-5.33-56-8.53-6.4L174.94,32h18.12l13.72,96Z",
  gasPump: "M241,69.66,221.66,50.34a8,8,0,0,0-11.32,11.32L229.66,81A8,8,0,0,1,232,86.63V168a8,8,0,0,1-16,0V128a24,24,0,0,0-24-24H176V56a24,24,0,0,0-24-24H72A24,24,0,0,0,48,56V208H32a8,8,0,0,0,0,16H192a8,8,0,0,0,0-16H176V120h16a8,8,0,0,1,8,8v40a24,24,0,0,0,48,0V86.63A23.85,23.85,0,0,0,241,69.66ZM144,120H80a8,8,0,0,1,0-16h64a8,8,0,0,1,0,16Z",
  grains: "M208,56a87.52,87.52,0,0,0-31.84,6c-14.32-29.7-43.25-44.46-44.57-45.13a8,8,0,0,0-7.16,0C123.1,17.51,94.17,32.27,79.85,62A87.52,87.52,0,0,0,48,56a8,8,0,0,0-8,8v80a88.12,88.12,0,0,0,75.48,87.1,4,4,0,0,0,4.52-4V176.27a8.18,8.18,0,0,1,7.47-8.25,8,8,0,0,1,8.53,8v51.14a4,4,0,0,0,4.52,4A88.12,88.12,0,0,0,216,144V64A8,8,0,0,0,208,56Zm-88,93.46a88,88,0,0,0-64-37.09V72.44A72.1,72.1,0,0,1,120,144Zm8-42.1A88.61,88.61,0,0,0,94.16,69.11c9.21-19.21,26.4-31.33,33.84-35.9,7.45,4.58,24.63,16.7,33.84,35.9A88.61,88.61,0,0,0,128,107.36Zm72,5a88,88,0,0,0-64,37.09V144a72.1,72.1,0,0,1,64-71.56Z",
  hammer: "M251.34,112,183.88,44.08a96.1,96.1,0,0,0-135.77,0l-.09.09L34.25,58.4A8,8,0,0,0,45.74,69.53L59.47,55.35a79.92,79.92,0,0,1,18.71-13.9L124.68,88l-96,96a16,16,0,0,0,0,22.63l20.69,20.69a16,16,0,0,0,22.63,0l96-96,32,32a16,16,0,0,0,22.63,0l28.69-28.69A16,16,0,0,0,251.34,112Zm-89,2.33L140,136.67,119.31,116l22.35-22.35a8,8,0,0,0,0-11.32L94.32,35a80,80,0,0,1,78.23,20.41l44.22,44.51L188,128.66l-14.34-14.34A8,8,0,0,0,162.34,114.32Zm49,37.66-12-12L228,111.25l12,12Z",
  hardHat: "M152,152H104V40a16,16,0,0,1,16-16h16a16,16,0,0,1,16,16Zm72,16H32a16,16,0,0,0-16,16v8a16,16,0,0,0,16,16H224a16,16,0,0,0,16-16v-8A16,16,0,0,0,224,168Zm0-20V136a96.44,96.44,0,0,0-50.11-84.31A4,4,0,0,0,168,55.22V152h52A4,4,0,0,0,224,148ZM36,152H88V55.22a4,4,0,0,0-5.89-3.53A96.44,96.44,0,0,0,32,136v12A4,4,0,0,0,36,152Z",
  houseLine: "M240,208H224V136l2.34,2.34A8,8,0,0,0,237.66,127L139.31,28.68a16,16,0,0,0-22.62,0L18.34,127a8,8,0,0,0,11.32,11.31L32,136v72H16a8,8,0,0,0,0,16H240a8,8,0,0,0,0-16Zm-88,0H104V160a4,4,0,0,1,4-4h40a4,4,0,0,1,4,4Z",
  lightning: "M213.85,125.46l-112,120a8,8,0,0,1-13.69-7l14.66-73.33L45.19,143.49a8,8,0,0,1-3-13l112-120a8,8,0,0,1,13.69,7L153.18,90.9l57.63,21.61a8,8,0,0,1,3,12.95Z",
  plant: "M205.41,159.07a60.9,60.9,0,0,1-31.83,8.86,71.71,71.71,0,0,1-27.36-5.66A55.55,55.55,0,0,0,136,194.51V224a8,8,0,0,1-8.53,8,8.18,8.18,0,0,1-7.47-8.25V211.31L81.38,172.69A52.5,52.5,0,0,1,63.44,176a45.82,45.82,0,0,1-23.92-6.67C17.73,156.09,6,125.62,8.27,87.79a8,8,0,0,1,7.52-7.52c37.83-2.23,68.3,9.46,81.5,31.25A46,46,0,0,1,103.74,140a4,4,0,0,1-6.89,2.43l-19.2-20.1a8,8,0,0,0-11.31,11.31l53.88,55.25c.06-.78.13-1.56.21-2.33a68.56,68.56,0,0,1,18.64-39.46l50.59-53.46a8,8,0,0,0-11.31-11.32l-49,51.82a4,4,0,0,1-6.78-1.74c-4.74-17.48-2.65-34.88,6.4-49.82,17.86-29.48,59.42-45.26,111.18-42.22a8,8,0,0,1,7.52,7.52C250.67,99.65,234.89,141.21,205.41,159.07Z",
  rocketLaunch: "M101.85,191.14C97.34,201,82.29,224,40,224a8,8,0,0,1-8-8c0-42.29,23-57.34,32.86-61.85a8,8,0,0,1,6.64,14.56c-6.43,2.93-20.62,12.36-23.12,38.91,26.55-2.5,36-16.69,38.91-23.12a8,8,0,1,1,14.56,6.64Zm122-144a16,16,0,0,0-15-15c-12.58-.75-44.73.4-71.4,27.07h0L88,108.7A8,8,0,0,1,76.67,97.39l26.56-26.57A4,4,0,0,0,100.41,64H74.35A15.9,15.9,0,0,0,63,68.68L28.7,103a16,16,0,0,0,9.07,27.16l38.47,5.37,44.21,44.21,5.37,38.49a15.94,15.94,0,0,0,10.78,12.92,16.11,16.11,0,0,0,5.1.83A15.91,15.91,0,0,0,153,227.3L187.32,193A16,16,0,0,0,192,181.65V155.59a4,4,0,0,0-6.83-2.82l-26.57,26.56a8,8,0,0,1-11.71-.42,8.2,8.2,0,0,1,.6-11.1l49.27-49.27h0C223.45,91.86,224.6,59.71,223.85,47.12Z",
  rocket: "M152,224a8,8,0,0,1-8,8H112a8,8,0,0,1,0-16h32A8,8,0,0,1,152,224Zm71.62-68.17-12.36,55.63a16,16,0,0,1-25.51,9.11L158.51,200h-61L70.25,220.57a16,16,0,0,1-25.51-9.11L32.38,155.83a16.09,16.09,0,0,1,3.32-13.71l28.56-34.26a123.07,123.07,0,0,1,8.57-36.67c12.9-32.34,36-52.63,45.37-59.85a16,16,0,0,1,19.6,0c9.34,7.22,32.47,27.51,45.37,59.85a123.07,123.07,0,0,1,8.57,36.67l28.56,34.26A16.09,16.09,0,0,1,223.62,155.83Zm-139.23,34Q68.28,160.5,64.83,132.16L48,152.36,60.36,208l.18-.13ZM140,100a12,12,0,1,0-12,12A12,12,0,0,0,140,100Zm68,52.36-16.83-20.2q-3.42,28.28-19.56,57.69l23.85,18,.18.13Z",
  tractor: "M80,172a12,12,0,1,1-12-12A12,12,0,0,1,80,172Zm40,0a52,52,0,1,1-52-52A52.06,52.06,0,0,1,120,172Zm-24,0a28,28,0,1,0-28,28A28,28,0,0,0,96,172Zm152,16a36,36,0,0,1-71.77,4H144a8,8,0,0,1-8-8V172a68.07,68.07,0,0,0-68-68H40a8,8,0,0,1,0-16h8V56H40a8,8,0,0,1,0-16H160a8,8,0,0,1,0,16h-8V97.88l24,6.5V72a8,8,0,0,1,16,0v36.71l36.39,9.86.21.06A15.89,15.89,0,0,1,240,134v31.46A35.8,35.8,0,0,1,248,188Zm-20,0a16,16,0,1,0-16,16A16,16,0,0,0,228,188Z",
  trainSimple: "M184,24H72A32,32,0,0,0,40,56V184a32,32,0,0,0,32,32h8L65.6,235.2a8,8,0,1,0,12.8,9.6L100,216h56l21.6,28.8a8,8,0,1,0,12.8-9.6L176,216h8a32,32,0,0,0,32-32V56A32,32,0,0,0,184,24Zm0,176H72a16,16,0,0,1-16-16V136H200v48A16,16,0,0,1,184,200ZM96,172a12,12,0,1,1-12-12A12,12,0,0,1,96,172Zm88,0a12,12,0,1,1-12-12A12,12,0,0,1,184,172Z",
  train: "M184,24H72A32,32,0,0,0,40,56V184a32,32,0,0,0,32,32h8L65.6,235.2a8,8,0,1,0,12.8,9.6L100,216h56l21.6,28.8a8,8,0,1,0,12.8-9.6L176,216h8a32,32,0,0,0,32-32V56A32,32,0,0,0,184,24ZM84,184a12,12,0,1,1,12-12A12,12,0,0,1,84,184Zm36-64H56V80h64Zm52,64a12,12,0,1,1,12-12A12,12,0,0,1,172,184Zm28-64H136V80h64Z",
  truck: "M255.43,117l-14-35A15.93,15.93,0,0,0,226.58,72H192V64a8,8,0,0,0-8-8H32A16,16,0,0,0,16,72V184a16,16,0,0,0,16,16H49a32,32,0,0,0,62,0h50a32,32,0,0,0,62,0h17a16,16,0,0,0,16-16V120A8.13,8.13,0,0,0,255.43,117ZM80,208a16,16,0,1,1,16-16A16,16,0,0,1,80,208ZM32,136V72H176v64Zm160,72a16,16,0,1,1,16-16A16,16,0,0,1,192,208Zm0-96V88h34.58l9.6,24Z",
  wrench: "M232,96a72,72,0,0,1-100.94,66L79,222.22c-.12.14-.26.29-.39.42a32,32,0,0,1-45.26-45.26c.14-.13.28-.27.43-.39L94,124.94a72.07,72.07,0,0,1,83.54-98.78,8,8,0,0,1,3.93,13.19L144,80l5.66,26.35L176,112l40.65-37.52a8,8,0,0,1,13.19,3.93A72.6,72.6,0,0,1,232,96Z",
} as const;
export type PictoName = keyof typeof PICTOS;
/** A SOLID pictogram centred on (x, y), its 256-box `size` world px wide:
 *  `color` RED for the subject, or ink at a `rung` (INK_LO = a solid ink tint).
 *  It has no stroke, so it needs no k. Wrap red ones in a RedGroup if they
 *  should carry the paper shadow. */
export const Pictogram: React.FC<{
  d: string;
  x: number;
  y: number;
  size: number;
  color?: string;
  rung?: number;
  rotate?: number;
}> = ({ d, x, y, size, color = V_INK, rung = INK_HI, rotate = 0 }) => {
  if (rung <= 0.002 || size <= 0.01) return null;
  const sc = size / 256;
  return (
    <path
      d={d}
      fill={color}
      opacity={rung < 1 ? rung.toFixed(4) : undefined}
      transform={`translate(${x.toFixed(3)} ${y.toFixed(3)})${rotate ? ` rotate(${rotate.toFixed(3)})` : ""} scale(${sc.toFixed(5)}) translate(-128 -128)`}
    />
  );
};
