import React, { useId } from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame } from "remotion";
import {
  BLUE,
  CHAIN,
  CHAIN_STAGGER,
  CHAIN_TRAVEL,
  CROWN_STEP,
  ChainEcho,
  EASE_LAND,
  INK,
  Inked,
  OP_FULL,
  OP_LOW,
  OP_MID,
  ORANGE,
  PAPER_BASE,
  PURPLE,
  PaperGround,
  RiseText,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  ShadowText,
  camEase,
  clamp,
  fontFamily,
  runCamera2,
  textRise,
  type,
} from "../kits/core-memory/cerroShared";
import {
  ARCHIVE_FILTER,
  type ContactShadow,
  CutOut,
  Plate,
  archiveFilter,
  chainProgress,
  filmWeave,
} from "../zach-kelly-johnson/archiveShared";

// ---------------------------------------------------------------------------
// NEAL STEPHENSON TRAILER — the clip's shared module (owner: builder A).
//
// Core Memory podcast trailer (Ashlee Vance x Neal Stephenson), the "archive collage" at 16:9: the Core Memory real
// squared paper, white ink on its hard shadow, real photographs as graded cut-outs lying on/over the paper in 2.5D,
// old-film life over everything. 1920 x 1080, 24000/1001 fps; finals render --scale 2 (3840 x 2160).
// A cut decides what happens; this file decides what it is made of.
//
// LEGEND
//   * Ground: cerroShared's PaperGround (real squared paper, unrotated at 16:9, brightness 0.88 blur 3 px, parallax
//     0.15, drift -0.3 px/frame). `NealPaper` drives it from a NealCam.
//   * Drawn things (axes, graph lines, glyphs): INK #FFFFFF, one STROKE (6 world px), on a pure black copy at +4/+4
//     world px (SHADOW_OFF), zero blur, drawn as an SVG copy (`Inked`). No outline, glow, gradient or blend mode.
//   * Photographs: one grade, NEAL_FILTER (= archiveShared's ARCHIVE_FILTER: near-monochrome warm-neutral) on every
//     photo node, never on the chain or the type. A cut-out lies on the paper with the Core Memory hard shadow: a
//     pure black silhouette of itself at +4/+4 world px (`PhotoCutOut`), optionally a soft contact shadow where it
//     stands on something.
//   * Depth: a dolly camera NealCam {x, y, k, x0?, y0?}. (x, y) = the focus-plane (d = 1) world point at the frame's
//     centre, k = the focus plane's scale. A plane at depth d (> 1 farther, < 1 nearer) scales and slides less/more.
//     At d = 1 the transform equals cerroShared's worldTransform169. The paper parallaxes at its own 0.15.
//   * The CHAIN (orange #FFB765 back, purple #BC37FF, blue #0046FF front, the core on top) has ONE meaning in this
//     clip: NEAL'S OWN — his take (the S-curve he prefers) and his work (his books). Flat silhouette copies of the
//     shape, never faded (a layer exists or it does not); at most one chain moment per cut, at its payoff; at rest a
//     CROWN (copies stepped along `dir`, up by default) or collapsed into the core. Never on other people's things
//     (the exponential, the CO2 curve, the research subjects). For photos: `ChainPhotoCutOut` (SVG feFlood +
//     feComposite "in", one node per layer; never a CSS mask-image). For drawn shapes: `ChainEcho` (cerroShared).
//   * Type (only where a brief asks): Barlow 800/900 uppercase, white on its hard shadow (ShadowText / RiseText).
//   * Film life, screen space, over everything (`NealFilmLife`): grain new every frame, gate weave <= ~1 px, exposure
//     flicker <= +-1.5 %, a soft vignette. Pass a GLOBAL frame (local + the cut's offset) when two cuts join, so the
//     weave and drift are continuous across the join.
//   * Caption bands (screen y of 1080): 607-703 and 765-821. Nothing readable in them; the focus at the middle or above.
//
// EXPORTS (see <notes>/NEAL_READY.md; later additions are logged in <notes>/SHARED_CHANGES.md)
//   FPS, W, H, CAPTION_BANDS, inCaptionBand(y0, y1), CaptionBands
//   NealCam (type), depthScale(k, d), depthTransform(cam, d), NealPlane, NealSvg, NealPaper
//   NEAL_FILTER, nealFilter({air, blur}), PhotoCutOut, ChainPhotoCutOut, Silhouette, Plate, CutOut,
//   ContactShadow (type), chainProgress
//   NealFilmLife, filmWeave
//   NealProbe, NEAL_PROBE_DURATION
//   re-exported Core Memory base: INK, SHADOW, SHADOW_OFF, STROKE, OP_FULL, OP_MID, OP_LOW, ORANGE, PURPLE, BLUE,
//   CHAIN, CROWN_STEP, CHAIN_STAGGER, CHAIN_TRAVEL, EASE_LAND, PAPER_BASE, Inked, ChainEcho, ShadowText, RiseText,
//   textRise, type, fontFamily, runCamera2, clamp, camEase, PaperGround
// ---------------------------------------------------------------------------

export {
  BLUE,
  CHAIN,
  CHAIN_STAGGER,
  CHAIN_TRAVEL,
  CROWN_STEP,
  ChainEcho,
  EASE_LAND,
  INK,
  Inked,
  OP_FULL,
  OP_LOW,
  OP_MID,
  ORANGE,
  PAPER_BASE,
  PURPLE,
  PaperGround,
  RiseText,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  ShadowText,
  camEase,
  clamp,
  fontFamily,
  runCamera2,
  textRise,
  type,
};
export { CutOut, Plate, chainProgress, filmWeave };
export type { ContactShadow };

export const FPS = 24000 / 1001;
export const W = 1920;
export const H = 1080;

// -- graph ink (added after NEAL_READY; logged in SHARED_CHANGES.md) ---------------------------------------------------
/** The weight of a graph's data curves in this clip (2 x STROKE): bold enough to read white at phone size.
 *  Axes stay at STROKE. Every cut that draws a curve (18 SCurveGuy, 22 TooMuchCarbon) uses these. */
export const GRAPH_STROKE = 12;
/** The hard shadow under a GRAPH_STROKE curve: a black copy at +GRAPH_SHADOW_OFF/+GRAPH_SHADOW_OFF world px. */
export const GRAPH_SHADOW_OFF = 6;
/** The crown step on a GRAPH_STROKE curve: each chain copy peeks this far past the one in front (touching stripes). */
export const GRAPH_CROWN_STEP = 9;

/** The user's burned-in captions sit in these SCREEN y ranges (of 1080): nothing readable there. */
export const CAPTION_BANDS: readonly (readonly [number, number])[] = [
  [607, 703],
  [765, 821],
];
/** True when the screen span y0..y1 touches a caption band. */
export const inCaptionBand = (y0: number, y1: number) => CAPTION_BANDS.some(([a, b]) => y1 > a && y0 < b);

/** Preview aid: the caption bands as translucent red strips (screen space). Never on in a final. */
export const CaptionBands: React.FC<{ on?: boolean }> = ({ on = false }) =>
  on ? (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {CAPTION_BANDS.map(([a, b]) => (
        <div key={a} style={{ position: "absolute", left: 0, top: a, width: W, height: b - a, background: "rgba(255,0,0,0.22)" }} />
      ))}
    </AbsoluteFill>
  ) : null;

// -- the grade ---------------------------------------------------------------
/** The clip's photo grade: warm-neutral near-monochrome (archiveShared's ARCHIVE_FILTER). Photo nodes only. */
export const NEAL_FILTER = ARCHIVE_FILTER;
/** NEAL_FILTER plus AIR for farther planes (0 = none, 1 = a lot): lighter, flatter, optionally soft. */
export const nealFilter = archiveFilter;

// -- the camera --------------------------------------------------------------
/**
 * A dolly camera. (x, y) = the focus-plane (d = 1) world point at the frame's centre; k = the focus plane's scale.
 * (x0, y0) = the rest camera at which every plane's world px equal screen px (default the frame centre); put it at
 * the camera's opening position so nothing jumps at f0. At d = 1 this is cerroShared's worldTransform169.
 */
export type NealCam = { x: number; y: number; k: number; x0?: number; y0?: number };

/** The scale of a plane at depth d when the focus plane is at k (a dolly: near planes grow faster). */
export const depthScale = (k: number, d: number) => {
  if (d === 1) return k;
  const den = d - (1 - 1 / k);
  if (den <= 0.02) throw new Error(`depthScale: the camera (k ${k}) has passed the plane at depth ${d}`);
  return d / den;
};

/** The transform of a plane at depth d: scale, translation, CSS transform (origin 0 0), toScreen(x, y). */
export const depthTransform = (cam: NealCam, d = 1) => {
  const x0 = cam.x0 ?? W / 2;
  const y0 = cam.y0 ?? H / 2;
  const kd = depthScale(cam.k, d);
  const xd = d === 1 ? cam.x : x0 + (cam.x - x0) / d;
  const yd = d === 1 ? cam.y : y0 + (cam.y - y0) / d;
  const tx = W / 2 - xd * kd;
  const ty = H / 2 - yd * kd;
  return {
    k: kd,
    tx,
    ty,
    transform: `translate(${tx}px, ${ty}px) scale(${kd})`,
    toScreen: (x: number, y: number) => ({ x: tx + x * kd, y: ty + y * kd }),
  };
};

/** A plane at depth d: children are absolutely positioned in that plane's world px (top-left origin). */
export const NealPlane: React.FC<{ cam: NealCam; d?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  cam,
  d = 1,
  children,
  style,
}) => {
  const t = depthTransform(cam, d);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: t.transform, ...style }}>
      {children}
    </div>
  );
};

/** An SVG in plane world px (W x H viewBox, overflow visible): put it inside a NealPlane for drawn ink. */
export const NealSvg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
    {children}
  </svg>
);

/** The squared paper under a NealCam (PaperGround: parallax 0.15 off the rest camera, drift -0.3 px/frame). */
export const NealPaper: React.FC<{ frame: number; cam: NealCam }> = ({ frame, cam }) => (
  <PaperGround frame={frame} cx={cam.x} cy={cam.y} cxRest={cam.x0 ?? W / 2} cyRest={cam.y0 ?? H / 2} k={cam.k} />
);

// -- photographs ---------------------------------------------------------------
type Anchor = "bottom" | "center" | "top-left";
const boxAt = (x: number, y: number, w: number, h: number, anchor: Anchor) => {
  if (anchor === "top-left") return { left: x, top: y, ax: x + w / 2, ay: y + h };
  if (anchor === "center") return { left: x - w / 2, top: y - h / 2, ax: x, ay: y + h / 2 };
  return { left: x - w / 2, top: y - h, ax: x, ay: y };
};

type Placement = {
  src: string;
  x: number;
  y: number;
  w: number;
  aspect: number;
  anchor?: Anchor;
  rotate?: number;
  flipX?: boolean;
};

/**
 * A flat-colour silhouette of a cut-out PNG (its alpha, filled with `colour`), offset (dx, dy) world px. Built with
 * an SVG feFlood + feComposite "in" filter on the <Img> (one node, loads with the image; never a CSS mask-image).
 */
export const Silhouette: React.FC<Placement & { colour: string; dx?: number; dy?: number }> = ({
  src,
  x,
  y,
  w,
  aspect,
  anchor = "bottom",
  rotate = 0,
  flipX = false,
  colour,
  dx = 0,
  dy = 0,
}) => {
  const h = w / aspect;
  const url = src.startsWith("data:") ? src : staticFile(src);
  const b = boxAt(x, y, w, h, anchor);
  const turn = rotate || flipX ? `rotate(${rotate}deg) scaleX(${flipX ? -1 : 1})` : undefined;
  const fid = `neal-sil-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0 }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={fid} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feFlood floodColor={colour} floodOpacity={1} result="flat" />
            <feComposite in="flat" in2="SourceAlpha" operator="in" />
          </filter>
        </defs>
      </svg>
      <div
        style={{
          position: "absolute",
          left: b.left + dx,
          top: b.top + dy,
          width: w,
          height: h,
          transform: turn,
          transformOrigin: `${b.ax - b.left}px ${b.ay - b.top}px`,
        }}
      >
        <Img src={url} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none", filter: `url(#${fid})` }} />
      </div>
    </div>
  );
};

/**
 * A cut-out photograph (PNG with alpha) in plane world px, graded NEAL_FILTER, lying on the paper with the Core
 * Memory hard shadow: a pure black silhouette at +SHADOW_OFF/+SHADOW_OFF world px, zero blur (`hardShadow`, default
 * on). `anchor` "bottom" (default): (x, y) = bottom centre; "center"; "top-left". `w` world px wide, `aspect` = PNG
 * width / height. `contact`: optional soft contact shadow(s) where it stands on something (archiveShared's
 * ContactShadow). `air`/`blur`/`filter` as archiveShared's CutOut. Never faded in: it enters from behind
 * something or a frame edge.
 */
export const PhotoCutOut: React.FC<
  Placement & {
    hardShadow?: boolean;
    shadowOff?: number;
    contact?: ContactShadow | ContactShadow[];
    air?: number;
    blur?: number;
    filter?: string;
    shade?: string;
  }
> = ({ hardShadow = true, shadowOff = SHADOW_OFF, contact, air, blur, filter, shade, ...p }) => (
  <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, isolation: "isolate" }}>
    {hardShadow ? <Silhouette {...p} colour={SHADOW} dx={shadowOff} dy={shadowOff} /> : null}
    <CutOut {...p} air={air} blur={blur} filter={filter} shadow={contact} shade={shade} />
  </div>
);

/**
 * The chain echo of a photo cut-out (Neal's own: his photo, his books). Back to front: the hard shadow (the core's,
 * on the core's timing: always there), ORANGE, PURPLE, BLUE flat silhouettes, then the graded photo core. Each
 * colour sits `steps[i] * step * progress[i]` world px along `dir` (unit vector, default straight up) from the core:
 * defaults steps [3, 2, 1], step CROWN_STEP 12 = the crown at progress 1. `progress`: one number or [orange,
 * purple, blue] (archiveShared's chainProgress(frame, start)); a layer at progress 0 is not rendered. For a trail
 * behind a mover, point `dir` opposite its travel and keep the steps a crown (<= ~26 px), never wide stripes.
 * `core` "photo" (default) | "white" (white silhouette on its hard shadow) | "none" (draw your own core on top).
 */
export const ChainPhotoCutOut: React.FC<
  Placement & {
    progress: number | [number, number, number];
    dir?: { dx: number; dy: number };
    step?: number;
    steps?: [number, number, number];
    core?: "photo" | "white" | "none";
    contact?: ContactShadow | ContactShadow[];
    air?: number;
    shade?: string;
  }
> = ({ progress, dir = { dx: 0, dy: -1 }, step = CROWN_STEP, steps = [3, 2, 1], core = "photo", contact, air, shade, ...p }) => {
  const pr = typeof progress === "number" ? [progress, progress, progress] : progress;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, isolation: "isolate" }}>
      {core !== "none" ? <Silhouette {...p} colour={SHADOW} dx={SHADOW_OFF} dy={SHADOW_OFF} /> : null}
      {CHAIN.map((c, i) => {
        if (pr[i] <= 0) return null;
        const n = steps[i] * step * pr[i];
        return <Silhouette key={c} {...p} colour={c} dx={dir.dx * n} dy={dir.dy * n} />;
      })}
      {core === "photo" ? <CutOut {...p} air={air} shadow={contact} shade={shade} /> : null}
      {core === "white" ? <Silhouette {...p} colour={INK} /> : null}
    </div>
  );
};

// -- film life -----------------------------------------------------------------
// The DownTheShaft grain tile is 1216 x 2048 portrait; at 16:9 it is turned 90 degrees (2048 x 1216 > 1920 x 1080)
// and moved to a new random offset and flip every frame.
const GRAIN = "cerro/shaft/grain_tile.png";
const GRAIN_W = 1216;
const GRAIN_H = 2048;

/**
 * Old-film life in screen space, over everything: <NealFilmLife frame={frame}>{scene}</NealFilmLife>. The children get
 * the gate weave (a smooth sub-pixel drift, scaled 0.25 % so no edge shows); over them an exposure flicker (a black
 * veil 0..2*flicker), a soft vignette and fine grain (overlay). Deterministic per frame. Joined cuts: pass the
 * GLOBAL frame (local + offset) so the weave is continuous.
 */
export const NealFilmLife: React.FC<{
  frame: number;
  children?: React.ReactNode;
  grain?: number;
  weave?: number;
  flicker?: number;
  vignette?: number;
  seed?: string;
}> = ({ frame, children, grain = 0.16, weave = 0.8, flicker = 0.015, vignette = 0.3, seed = "neal" }) => {
  const f = Math.floor(frame);
  const wv = filmWeave(frame, weave);
  // the turned tile is GRAIN_H wide x GRAIN_W tall
  const gx = Math.floor(random(`${seed}-gx-${f}`) * (GRAIN_H - W));
  const gy = Math.floor(random(`${seed}-gy-${f}`) * (GRAIN_W - H));
  const fx = random(`${seed}-gfx-${f}`) < 0.5 ? -1 : 1;
  const fy = random(`${seed}-gfy-${f}`) < 0.5 ? -1 : 1;
  const n = Math.max(-1, Math.min(1, 0.45 * Math.sin((2 * Math.PI * frame) / 9.3 + 0.4) + 0.55 * (2 * random(`${seed}-fl-${f}`) - 1)));
  const veil = flicker * (1 + n);
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: PAPER_BASE }}>
      {children ? (
        <AbsoluteFill style={{ transform: `translate(${wv.dx}px, ${wv.dy}px) scale(1.0025)`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: `rgba(0,0,0,${veil})` }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse farthest-corner at 50% 48%, rgba(0,0,0,0) 46%, rgba(0,0,0,${0.35 * vignette}) 72%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: grain }}>
        <div
          style={{
            position: "absolute",
            left: -gx,
            top: -gy,
            width: GRAIN_H,
            height: GRAIN_W,
            transform: `scale(${fx}, ${fy})`,
          }}
        >
          <Img
            src={staticFile(GRAIN)}
            style={{
              position: "absolute",
              left: (GRAIN_H - GRAIN_W) / 2,
              top: (GRAIN_W - GRAIN_H) / 2,
              width: GRAIN_W,
              height: GRAIN_H,
              maxWidth: "none",
              transform: "rotate(90deg)",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// -- the probe -------------------------------------------------------------------
/**
 * NealProbe: every part on stand-ins. Paper + a slow dolly; a white ink curve on its hard shadow; a test photo
 * cut-out (public/heads/bret.png) lying on the paper with its hard shadow and a contact shadow; a second cut-out with
 * its chain crown rising at f6; a white ink bar with ChainEcho's crown; film life over all; caption bands shown.
 * Registered in src/Root.SCurveGuy.tsx (composition "NealProbe").
 */
export const NEAL_PROBE_DURATION = 48;
export const NealProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const g = camEase(frame / NEAL_PROBE_DURATION, 1);
  const cam: NealCam = { x: W / 2 + 20 * g, y: H / 2, k: 1 + 0.05 * g };
  const pr = chainProgress(frame, 6);
  const curve = "M240 560 C 700 560, 820 200, 1180 180";
  return (
    <AbsoluteFill>
      <NealFilmLife frame={frame}>
        <NealPaper frame={frame} cam={cam} />
        <NealPlane cam={cam}>
          <NealSvg>
            <Inked render={(c) => <path d="M240 140 L240 560 L1240 560" fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />} />
            <Inked render={(c) => <path d={curve} fill="none" stroke={c} strokeWidth={STROKE} strokeLinecap="round" />} />
            <ChainEcho
              frame={frame}
              start={10}
              from={{ dx: 0, dy: 60 }}
              render={(c) => <rect x={1000} y={300} width={140} height={STROKE * 4} fill={c} />}
            />
          </NealSvg>
          <PhotoCutOut src="heads/bret.png" x={1440} y={540} w={300} aspect={474 / 643} contact={{ w: 260, h: 40, dy: 2, opacity: 0.5 }} />
          <ChainPhotoCutOut src="heads/bret.png" x={1740} y={480} w={200} aspect={474 / 643} progress={pr} />
        </NealPlane>
      </NealFilmLife>
      <CaptionBands on />
    </AbsoluteFill>
  );
};
