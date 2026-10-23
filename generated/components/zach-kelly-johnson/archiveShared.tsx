import React from "react";
import { AbsoluteFill, Img, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import {
  BLUE,
  CHAIN,
  CHAIN_STAGGER,
  CHAIN_TRAVEL,
  CROWN_STEP,
  EASE_LAND,
  INK,
  ORANGE,
  PURPLE,
  SHADOW,
  SHADOW_OFF,
  camEase,
  clamp,
  fontFamily,
  runCamera2,
  textRise,
  type,
} from "../kits/core-memory/cerroShared";

// ---------------------------------------------------------------------------
// ZACH SHORE "KELLY JOHNSON 41 AIRCRAFT" — the clip's shared module (owner: builder A).
//
// Core Memory podcast, footage-matched variant: an ARCHIVE COLLAGE. Every cut is a full-bleed photographic world
// built from real archive photographs (plates and cut-outs in public/zach-kelly-johnson/<A|B|C|D>/), moved in 2.5D
// by one camera, graded to one warm-neutral black-and-white, with old-film life over everything. 1080 x 1920,
// 24000/1001 fps. A cut decides what happens; this file decides what it is made of.
//
// LEGEND
//   * Photographs: every photo node carries ARCHIVE_FILTER (or archiveFilter({air}) for farther, hazier planes).
//     The grade is NEVER applied to the chain layers or the type.
//   * Depth: a plane at depth d (1 = the camera's focus plane, > 1 farther, < 1 nearer) under a DOLLY camera
//     {x, y, k}: (x, y) = the focus-plane world point at the frame's centre, k = the focus plane's scale. A plane's
//     world px equal screen px at the rest camera (x0, y0, k 1); farther planes scale and slide less (parallax).
//   * The CHAIN (orange #FFB765 back, purple #BC37FF, blue #0046FF front, the photo core on top) has ONE meaning in
//     this clip: PRODUCTION, copies coming off the line. Flat colour silhouettes of a cut-out (its alpha as a CSS
//     mask over a flat colour, one node per layer), no glow, no gradient, never faded: a layer exists or it does not.
//     At most one chain moment per cut, at its payoff.
//   * Type (only where a brief asks): Barlow 800/900 uppercase, white on its hard black copy at +4/+4 world px.
//   * Film life, screen space, over everything: grain new every frame, a smooth gate weave <= ~1 px, exposure
//     flicker <= +-1.5 %, a soft vignette.
//
// EXPORTS (see <notes>/ARCHIVE_READY.md; later additions are logged in <notes>/SHARED_CHANGES.md)
//   FPS, W, H, CAPTION_BANDS, inCaptionBand(y0, y1)
//   ARCHIVE_FILTER, archiveFilter({ air, blur })
//   ArchiveCam (type), depthScale(k, d), depthTransform(cam, d), ArchiveCamera (a plane at depth d), CaptionBands
//   CutOut, Plate, ContactShadow (type)
//   ChainCutOut, chainProgress(frame, start, opts)
//   ArchiveText
//   FilmLife, filmWeave(frame), DustMotes
//   ArchiveProbe (the probe composition: test plate + cut-out + chain + type + film life)
//   re-exported from the Core Memory base: INK, SHADOW, SHADOW_OFF, ORANGE, PURPLE, BLUE, CHAIN, CROWN_STEP,
//   CHAIN_STAGGER, CHAIN_TRAVEL, EASE_LAND, camEase, clamp, runCamera2, fontFamily, type, textRise
// ---------------------------------------------------------------------------

export {
  BLUE,
  CHAIN,
  CHAIN_STAGGER,
  CHAIN_TRAVEL,
  CROWN_STEP,
  EASE_LAND,
  INK,
  ORANGE,
  PURPLE,
  SHADOW,
  SHADOW_OFF,
  camEase,
  clamp,
  fontFamily,
  runCamera2,
  textRise,
  type,
};

export const FPS = 24000 / 1001;
export const W = 1080;
export const H = 1920;

/** The user's burned-in captions sit in these SCREEN y ranges (of 1920): nothing readable there. 1270-1340 is tight. */
export const CAPTION_BANDS: readonly (readonly [number, number])[] = [
  [1080, 1250],
  [1360, 1460],
];
/** True when the screen span y0..y1 touches a caption band. */
export const inCaptionBand = (y0: number, y1: number) => CAPTION_BANDS.some(([a, b]) => y1 > a && y0 < b);

// -- the grade ---------------------------------------------------------------
/**
 * Warm-neutral black-and-white for every PHOTO node (never the chain, never the type). grayscale, a touch of sepia
 * (R:G:B about 1.05 : 1.03 : 0.99 on the mids), contrast 0.9 lifts the blacks to ~5 % and keeps whites off the clip
 * (~98 %), brightness 1.04 puts the mids back.
 */
export const ARCHIVE_FILTER = "grayscale(1) sepia(0.14) contrast(0.9) brightness(1.04)";

/** ARCHIVE_FILTER plus AIR for farther planes (0 = none, 1 = a lot): a little lighter and flatter, optionally soft. */
export const archiveFilter = ({ air = 0, blur = 0 }: { air?: number; blur?: number } = {}) => {
  const parts = [ARCHIVE_FILTER];
  if (air > 0) parts.push(`contrast(${1 - 0.3 * air}) brightness(${1 + 0.1 * air})`);
  const b = blur + 1.2 * air;
  if (b > 0.05) parts.push(`blur(${b}px)`);
  return parts.join(" ");
};

// -- the camera --------------------------------------------------------------
/**
 * A dolly camera. (x, y) = the focus-plane (d = 1) world point at the frame's centre; k = the focus plane's scale.
 * (x0, y0) = the rest camera at which every plane's world px equal screen px (default the frame centre): put it at
 * the camera's opening position so nothing jumps at f0.
 */
export type ArchiveCam = { x: number; y: number; k: number; x0?: number; y0?: number };

/** The scale of a plane at depth d when the focus plane is at k (a dolly: near planes grow faster). */
export const depthScale = (k: number, d: number) => {
  if (d === 1) return k;
  const den = d - (1 - 1 / k);
  if (den <= 0.02) throw new Error(`depthScale: the camera (k ${k}) has passed the plane at depth ${d}`);
  return d / den;
};

/**
 * The transform of a plane at depth d. Returns its scale, translation, the CSS transform (origin 0 0) and
 * `toScreen(x, y)` (plane world px -> screen px), for the caption-band checks.
 */
export const depthTransform = (cam: ArchiveCam, d = 1) => {
  const x0 = cam.x0 ?? W / 2;
  const y0 = cam.y0 ?? H / 2;
  const kd = depthScale(cam.k, d);
  const xd = x0 + (cam.x - x0) / d;
  const yd = y0 + (cam.y - y0) / d;
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

/** A plane at depth d: children are positioned in that plane's world px (absolute, top-left origin). */
export const ArchiveCamera: React.FC<{
  cam: ArchiveCam;
  d?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ cam, d = 1, children, style }) => {
  const t = depthTransform(cam, d);
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transformOrigin: "0 0", transform: t.transform, ...style }}>
      {children}
    </div>
  );
};

/** Preview aid: the caption bands as translucent red strips (screen space). Never on in a final. */
export const CaptionBands: React.FC<{ on?: boolean }> = ({ on = false }) =>
  on ? (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {CAPTION_BANDS.map(([a, b]) => (
        <div key={a} style={{ position: "absolute", left: 0, top: a, width: W, height: b - a, background: "rgba(255,0,0,0.22)" }} />
      ))}
    </AbsoluteFill>
  ) : null;

// -- photographs ---------------------------------------------------------------
/**
 * A soft photographic contact shadow where a subject meets the floor: an ellipse centred `x` world px right of the
 * cut-out's anchor (bottom centre) and `dy` below it. Two layers: a broad soft pool and a tight dark core.
 */
export type ContactShadow = { x?: number; dy?: number; w: number; h: number; opacity?: number };

const ContactShadows: React.FC<{ shadows: ContactShadow[]; ax: number; ay: number }> = ({ shadows, ax, ay }) => (
  <>
    {shadows.map((s, i) => {
      const o = s.opacity ?? 0.55;
      const cx = ax + (s.x ?? 0);
      const cy = ay + (s.dy ?? 0);
      return (
        <React.Fragment key={i}>
          <div
            style={{
              position: "absolute",
              left: cx - s.w / 2,
              top: cy - s.h / 2,
              width: s.w,
              height: s.h,
              background: `radial-gradient(closest-side, rgba(0,0,0,${0.62 * o}) 0%, rgba(0,0,0,${0.36 * o}) 45%, rgba(0,0,0,${0.1 * o}) 75%, rgba(0,0,0,0) 100%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: cx - 0.36 * s.w,
              top: cy - 0.18 * s.h,
              width: 0.72 * s.w,
              height: 0.36 * s.h,
              background: `radial-gradient(closest-side, rgba(0,0,0,${o}) 0%, rgba(0,0,0,${0.55 * o}) 50%, rgba(0,0,0,0) 100%)`,
            }}
          />
        </React.Fragment>
      );
    })}
  </>
);

type Anchor = "bottom" | "center" | "top-left";
/** The top-left of a w x h box anchored at (x, y). "bottom" = bottom centre (where the contact shadow sits). */
const boxAt = (x: number, y: number, w: number, h: number, anchor: Anchor) => {
  if (anchor === "top-left") return { left: x, top: y, ax: x + w / 2, ay: y + h };
  if (anchor === "center") return { left: x - w / 2, top: y - h / 2, ax: x, ay: y + h / 2 };
  return { left: x - w / 2, top: y - h, ax: x, ay: y };
};

const maskStyle = (url: string): React.CSSProperties => ({
  WebkitMaskImage: `url("${url}")`,
  maskImage: `url("${url}")`,
  WebkitMaskSize: "100% 100%",
  maskSize: "100% 100%",
  WebkitMaskRepeat: "no-repeat",
  maskRepeat: "no-repeat",
});

/**
 * A cut-out photograph (PNG with alpha) in plane world px, graded. `src` is a path under public/ (or a data URL).
 * `w` = width in world px, `aspect` = the PNG's width / height. `anchor` "bottom" (default): (x, y) is the bottom
 * centre, where it meets the floor. `rotate` (deg) and `flipX` turn it about the anchor. `shadow`: contact
 * shadow(s) under it, drawn behind it in the scene's light. `shade`: a CSS background (e.g. a linear-gradient of
 * rgba(0,0,0,a) for falloff, or of warm white for a window's light) laid over the cut-out through its own alpha.
 * Never faded in: it enters from behind something or a frame edge.
 */
export const CutOut: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  aspect: number;
  anchor?: Anchor;
  rotate?: number;
  flipX?: boolean;
  air?: number;
  blur?: number;
  filter?: string;
  shadow?: ContactShadow | ContactShadow[];
  shade?: string;
  zIndex?: number;
}> = ({ src, x, y, w, aspect, anchor = "bottom", rotate = 0, flipX = false, air = 0, blur = 0, filter, shadow, shade, zIndex }) => {
  const h = w / aspect;
  const url = src.startsWith("data:") ? src : staticFile(src);
  const b = boxAt(x, y, w, h, anchor);
  const turn = rotate || flipX ? `rotate(${rotate}deg) scaleX(${flipX ? -1 : 1})` : undefined;
  const shadows = shadow ? (Array.isArray(shadow) ? shadow : [shadow]) : [];
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, zIndex, isolation: "isolate" }}>
      {shadows.length ? <ContactShadows shadows={shadows} ax={b.ax} ay={b.ay} /> : null}
      <div
        style={{
          position: "absolute",
          left: b.left,
          top: b.top,
          width: w,
          height: h,
          transform: turn,
          transformOrigin: `${b.ax - b.left}px ${b.ay - b.top}px`,
        }}
      >
        <Img src={url} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none", filter: filter ?? archiveFilter({ air, blur }) }} />
        {shade ? <div style={{ position: "absolute", inset: 0, background: shade, ...maskStyle(url) }} /> : null}
      </div>
    </div>
  );
};

/** A rectangular photograph (a plate) at (x, y) top-left in plane world px, w x h, graded. objectFit cover. */
export const Plate: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  h: number;
  air?: number;
  blur?: number;
  filter?: string;
  objectPosition?: string;
}> = ({ src, x, y, w, h, air = 0, blur = 0, filter, objectPosition }) => (
  <Img
    src={src.startsWith("data:") ? src : staticFile(src)}
    style={{
      position: "absolute",
      left: x,
      top: y,
      width: w,
      height: h,
      maxWidth: "none",
      objectFit: "cover",
      objectPosition,
      filter: filter ?? archiveFilter({ air, blur }),
    }}
  />
);

// -- the chain echo of a cut-out ----------------------------------------------
/**
 * The three chain layers' progress at `frame` (0 = hidden behind the core, 1 = at rest), [orange, purple, blue].
 * Each travels `travel` frames on EASE_LAND from its own start; `order` "outerFirst" (default: orange at `start`,
 * purple +stagger, blue +2*stagger) or "innerFirst" (blue first). A layer with progress 0 is not rendered.
 */
export const chainProgress = (
  frame: number,
  start: number,
  { stagger = CHAIN_STAGGER, travel = CHAIN_TRAVEL, order = "outerFirst" }: { stagger?: number; travel?: number; order?: "outerFirst" | "innerFirst" } = {},
): [number, number, number] => {
  const p = (i: number) => {
    const s = start + (order === "outerFirst" ? i : 2 - i) * stagger;
    return interpolate(frame, [s, s + travel], [0, 1], { easing: EASE_LAND, ...clamp });
  };
  return [p(0), p(1), p(2)];
};

/**
 * The chain echo of a cut-out: flat ORANGE / PURPLE / BLUE copies of its silhouette (its alpha as a CSS mask over a
 * flat colour, one node per layer), BEHIND the core, each stepped out along `dir` (unit vector, default straight up)
 * by `steps[i] * step` world px at progress 1 (default steps [3, 2, 1], step CROWN_STEP 12: the crown). Use a big
 * `step` (e.g. a fraction of the subject's length) for copies stepping out of the subject; a small one for a crown or
 * a fast mover's trail. `progress` = one number for all three or [orange, purple, blue] (see chainProgress).
 * `core`: "photo" (default: the graded cut-out itself, with its contact shadow), "white" (a white silhouette on its
 * hard black copy at +4/+4, the graphic standard), or "none" (draw your own core on top). Placement props as CutOut.
 */
export const ChainCutOut: React.FC<{
  src: string;
  x: number;
  y: number;
  w: number;
  aspect: number;
  anchor?: Anchor;
  rotate?: number;
  flipX?: boolean;
  dir?: { dx: number; dy: number };
  step?: number;
  steps?: [number, number, number];
  progress: number | [number, number, number];
  core?: "photo" | "white" | "none";
  air?: number;
  shadow?: ContactShadow | ContactShadow[];
  shade?: string;
}> = ({
  src,
  x,
  y,
  w,
  aspect,
  anchor = "bottom",
  rotate = 0,
  flipX = false,
  dir = { dx: 0, dy: -1 },
  step = CROWN_STEP,
  steps = [3, 2, 1],
  progress,
  core = "photo",
  air = 0,
  shadow,
  shade,
}) => {
  const h = w / aspect;
  const url = src.startsWith("data:") ? src : staticFile(src);
  const b = boxAt(x, y, w, h, anchor);
  const turn = rotate || flipX ? `rotate(${rotate}deg) scaleX(${flipX ? -1 : 1})` : undefined;
  const pr = typeof progress === "number" ? [progress, progress, progress] : progress;
  const silhouette = (key: string, fill: string, dx: number, dy: number, z: number) => (
    <div
      key={key}
      style={{
        position: "absolute",
        left: b.left + dx,
        top: b.top + dy,
        width: w,
        height: h,
        zIndex: z,
        transform: turn,
        transformOrigin: `${b.ax - b.left}px ${b.ay - b.top}px`,
        backgroundColor: fill,
        ...maskStyle(url),
      }}
    />
  );
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, isolation: "isolate" }}>
      {/* keeps the render waiting until the PNG is loaded, so the masks never miss a frame */}
      {core === "photo" ? null : <Img src={url} style={{ position: "absolute", left: b.left, top: b.top, width: 1, height: 1, opacity: 0 }} />}
      {CHAIN.map((c, i) => {
        if (pr[i] <= 0) return null;
        const n = steps[i] * step * pr[i];
        return silhouette(`chain-${i}`, c, dir.dx * n, dir.dy * n, i + 1);
      })}
      {core === "white" ? (
        <>
          {silhouette("shadow", SHADOW, SHADOW_OFF, SHADOW_OFF, 0)}
          {silhouette("core", INK, 0, 0, 5)}
        </>
      ) : null}
      {core === "photo" ? (
        <div style={{ position: "absolute", left: 0, top: 0, zIndex: 5 }}>
          <CutOut src={src} x={x} y={y} w={w} aspect={aspect} anchor={anchor} rotate={rotate} flipX={flipX} air={air} shadow={shadow} shade={shade} />
        </div>
      ) : null}
    </div>
  );
};

// -- type ----------------------------------------------------------------------
/**
 * Barlow 800/900 uppercase, white on its hard black copy at +4/+4 world px, in plane world px. `y` is the BASELINE.
 * With `f0` it rises in (24 SCREEN px up while fading 0 -> 1 over 12 frames; pass the plane's scale as `k`); it is
 * not rendered before f0. Without `f0` it simply sits there.
 */
export const ArchiveText: React.FC<{
  text: string;
  x: number;
  y: number;
  size: number;
  frame: number;
  f0?: number;
  k?: number;
  weight?: 800 | 900;
  anchor?: "start" | "middle" | "end";
  tracking?: number;
  ink?: string;
  shadow?: string | null;
}> = ({ text, x, y, size, frame, f0, k = 1, weight = 900, anchor = "middle", tracking = 0, ink = INK, shadow = SHADOW }) => {
  const r = f0 === undefined ? { dy: 0, opacity: 1 } : textRise(frame, f0, k);
  if (r.opacity <= 0) return null;
  const comp = tracking && anchor === "middle" ? (-tracking * size) / 2 : 0;
  const t = (fill: string, off: number) => (
    <text x={x + comp + off} y={y + r.dy + off} textAnchor={anchor} fill={fill} style={type(size, weight, tracking)}>
      {text}
    </text>
  );
  return (
    <svg width={1} height={1} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
      <g opacity={r.opacity === 1 ? undefined : r.opacity}>
        {shadow ? t(shadow, SHADOW_OFF) : null}
        {t(ink, 0)}
      </g>
    </svg>
  );
};

// -- film life -----------------------------------------------------------------
const GRAIN = "cerro/shaft/grain_tile.png"; // 1216 x 2048 grayscale, the DownTheShaft tile
const GRAIN_W = 1216;
const GRAIN_H = 2048;

/** The gate weave at `frame`: a smooth whole-frame drift, |dx|, |dy| <= `amp` px. */
export const filmWeave = (frame: number, amp = 0.8) => {
  const t = (2 * Math.PI * frame) / 24;
  return {
    dx: amp * (0.62 * Math.sin(t * 0.83 + 1.3) + 0.38 * Math.sin(t * 2.11 + 0.2)),
    dy: amp * (0.55 * Math.sin(t * 1.04 + 2.1) + 0.45 * Math.sin(t * 2.76 + 0.9)),
  };
};

/**
 * Old-film life in screen space, over everything. Wrap the whole scene: <FilmLife frame={frame}>{scene}</FilmLife>.
 * The children get the gate weave (a smooth sub-pixel drift, scaled 0.25 % so no edge shows); over them: fine grain
 * (the tile at a new random offset and flip every frame, overlay), an exposure flicker (a black veil 0..2*flicker:
 * +-flicker around its mean) and a soft vignette. Deterministic per frame. Without children it is only the overlay.
 */
export const FilmLife: React.FC<{
  frame: number;
  children?: React.ReactNode;
  grain?: number;
  weave?: number;
  flicker?: number;
  vignette?: number;
  seed?: string;
}> = ({ frame, children, grain = 0.16, weave = 0.8, flicker = 0.015, vignette = 0.34, seed = "zkj" }) => {
  const f = Math.floor(frame);
  const wv = filmWeave(frame, weave);
  const gx = Math.floor(random(`${seed}-gx-${f}`) * (GRAIN_W - W));
  const gy = Math.floor(random(`${seed}-gy-${f}`) * (GRAIN_H - H));
  const fx = random(`${seed}-gfx-${f}`) < 0.5 ? -1 : 1;
  const fy = random(`${seed}-gfy-${f}`) < 0.5 ? -1 : 1;
  // flicker: a slow swing and a per-frame flutter, n in [-1, 1]
  const n = Math.max(-1, Math.min(1, 0.45 * Math.sin((2 * Math.PI * frame) / 9.3 + 0.4) + 0.55 * (2 * random(`${seed}-fl-${f}`) - 1)));
  const veil = flicker * (1 + n);
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      {children ? (
        <AbsoluteFill style={{ transform: `translate(${wv.dx}px, ${wv.dy}px) scale(1.0025)`, transformOrigin: "50% 50%" }}>{children}</AbsoluteFill>
      ) : null}
      <AbsoluteFill style={{ background: `rgba(0,0,0,${veil})` }} />
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse farthest-corner at 50% 48%, rgba(0,0,0,0) 42%, rgba(0,0,0,${0.35 * vignette}) 68%, rgba(0,0,0,${vignette}) 100%)`,
        }}
      />
      <AbsoluteFill style={{ overflow: "hidden", mixBlendMode: "overlay", opacity: grain }}>
        <Img
          src={staticFile(GRAIN)}
          style={{ position: "absolute", left: -gx, top: -gy, width: GRAIN_W, height: GRAIN_H, maxWidth: "none", transform: `scale(${fx}, ${fy})` }}
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/**
 * Dust in the light, in plane world px: `count` soft specks drifting slowly inside a box (they wrap, so they never
 * run out), twinkling a little. `light` = their brightest opacity. Put it on the plane of the light it floats in.
 */
export const DustMotes: React.FC<{
  frame: number;
  x: number;
  y: number;
  w: number;
  h: number;
  count?: number;
  size?: number;
  light?: number;
  seed?: string;
}> = ({ frame, x, y, w, h, count = 40, size = 3, light = 0.55, seed = "dust" }) => {
  const wrap = (v: number, m: number) => ((v % m) + m) % m;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const r = size * (0.6 + 0.9 * random(`${seed}-r-${i}`));
        const vx = (random(`${seed}-vx-${i}`) - 0.5) * 0.9;
        const vy = (random(`${seed}-vy-${i}`) - 0.62) * 0.6;
        const ph = random(`${seed}-ph-${i}`) * Math.PI * 2;
        const px = wrap(random(`${seed}-x-${i}`) * w + vx * frame + 6 * Math.sin(ph + frame * 0.05), w);
        const py = wrap(random(`${seed}-y-${i}`) * h + vy * frame + 4 * Math.sin(ph * 1.7 + frame * 0.07), h);
        const edge = Math.sin((Math.PI * px) / w) * Math.sin((Math.PI * py) / h);
        const tw = 0.55 + 0.45 * Math.sin(ph * 3 + frame * 0.3);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x + px - r,
              top: y + py - r,
              width: 2 * r,
              height: 2 * r,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,248,236,1) 0%, rgba(255,246,230,0.5) 45%, rgba(255,246,230,0) 100%)",
              opacity: light * Math.sqrt(Math.max(0, edge)) * tw,
            }}
          />
        );
      })}
    </>
  );
};

// -- the probe -------------------------------------------------------------------
/**
 * ArchiveProbe: a test of every part on stand-in pictures (a mine-station photo as the plate, a head cut-out as
 * the subject): two planes under a slow dolly, the subject with a contact shadow, its chain copies stepping out at
 * f6, a line of type rising in at f4, film life over all. Rendered through src/entry.TwentyYearsOnePlane.ts
 * (composition "ArchiveProbe", 48 frames).
 */
export const PROBE_DURATION = 48;
export const ArchiveProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const g = camEase(frame / PROBE_DURATION, 1);
  const cam: ArchiveCam = { x: W / 2 + 30 * g, y: H / 2, k: 1 + 0.12 * g };
  const pr = chainProgress(frame, 6);
  return (
    <AbsoluteFill style={{ backgroundColor: "#1b1a18" }}>
      <FilmLife frame={frame}>
        <ArchiveCamera cam={cam} d={2.2}>
          <Plate src="cerro/shaft/fd_station_on.jpg" x={-260} y={-120} w={1600} h={2180} air={0.4} />
        </ArchiveCamera>
        <ArchiveCamera cam={cam} d={1}>
          <ChainCutOut
            src="heads/bret.png"
            x={540}
            y={1020}
            w={430}
            aspect={474 / 643}
            dir={{ dx: 0.6, dy: -0.8 }}
            step={46}
            progress={pr}
            shadow={{ w: 380, h: 60, dy: 4, opacity: 0.6 }}
            shade="linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,0.3) 100%)"
          />
          <ArchiveText text="1958" x={540} y={300} size={150} frame={frame} f0={4} k={cam.k} />
        </ArchiveCamera>
      </FilmLife>
      <CaptionBands on />
    </AbsoluteFill>
  );
};
