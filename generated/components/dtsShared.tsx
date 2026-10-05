import React, { useId } from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import {
  ALPHA,
  BLOOM_LAYERS,
  COLOR,
  EDGE,
  ELEVATION,
  GEO,
  GRAIN,
  GROUND,
  GROUND_ONLY,
  POOL,
  VIGNETTE,
  AmberGradient,
  FigureMark,
  clamp01,
  easeOutCubic,
  lerp,
  mixHex,
  opticalFit,
  rectPath,
  smoothstep,
  type Elevation,
  type ShadowLayer,
} from "./stoutShared";
import { camJerk, type Cam, type Glide } from "./outgrowShared";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";
import type { SportName } from "./wolffShared";
import {
  DTS_CARD_PX,
  DTS_CARD_URL,
  F1_D,
  F1_VB,
  FERRARI_HORSE,
  FERRARI_LETTERS,
  FERRARI_OPTICAL,
  FERRARI_SHIELD_FIELD,
  FERRARI_SHIELD_OUTER,
  NETFLIX_D,
  NETFLIX_VB,
} from "./dtsAssets";

// ===========================================================================
// dtsShared — THE WORLD of Toto Wolff, "why Drive to Survive worked" (Cheeky Pint S4E01), five cuts in
// the Cheeky Pint S4 stout system (stoutShared, palette B1) re-solved for a LANDSCAPE 1920x1080 frame,
// 24 fps, opaque. Brief: out/dts/briefs/BRIEF.md. Builder W owns this file; the other builders import it.
//
// AMBER = Drive to Survive's LIGHT: the show's screen and whatever its light reaches. A glyph changes
// tone only when a FRONT reaches it (an eased 13 f crossfade, hashed per-glyph offset inside the front).
// Tone ladder: DARK (not reached) -> board (context) -> cream (lit subject) -> amber (lit by the show).
// Logos are cream, never their brand colours. Nothing black anywhere.
//
// UNITS. WORLD px (drawn inside DtsStage under the camera) for geometry and shadows; SCREEN px for type /
// logo sizes, hairlines, edges and bloom (pass the camera k; helpers divide by it).
//
// THE API (each a one-liner here; WORLD_READY.md has the usage)
//   frame:   FRAME, SAFE, CONTENT_Y, DTS_LIFT
//   camera:  camForL, toScreenL, lookOf, dtsCameraTrack, camJerk (re-export), dtsAmberBand, onScreenL
//   stage:   DtsStage({ S, cam, rest?, pool?, lights?, sway?, overlay?, children }), swayAt
//   light:   LightPool type, screenLight(box), lightSpan(x0, x1, cy, ry), TONE_F, hash01, reachFrame,
//            reachTimes, toneAt, frontFromKeys, decelFront
//   screen:  screenBox(x, y, w), Screen({ x, y, w, k, band, on, card, glyph, enter })
//   people:  PERSON_H, DARK, bustD, BUST, Person({ x, y, h, k, base, amber, extra, shadow, opacity })
//   car:     CAR, F1Car({ x, y, len, k, dim })
//   tiles:   DtsTile({ x, y, size, k, figure, dim, amber, dark, band, elevation, lift, enter })
//   logos:   NetflixLogo / F1Logo({ x, y, k, px, enter }), logoBox(mark, px, k)
//   glyphs:  DTS_GLYPHS, LineGlyph({ name, x, y, size, k, color, enter })
//   shadow:  ObjectShadow({ paths, size, elevation, lift, contact, strength })
//   world:   DTS (the shared layout: the screen of cuts A/B, the walkers' ground, the person size)
// ===========================================================================

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const f4 = (v: number) => (Math.round(v * 1e4) / 1e4).toString();
const fx = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
const uidOf = (raw: string) => `dt${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// ===========================================================================
// THE FRAME (landscape)
// ===========================================================================
export const FPS = 24;
export const FRAME = { W: 1920, H: 1080, CX: 960, CY: 540 } as const;
/** 16:9 framing: captions sit at the bottom. Subject ink inside y 90-880, side margins >= 96 px. */
export const SAFE = { top: 90, bottom: 880, side: 96 } as const;
/** The content centre's screen y (the camera's `look` lands here). */
export const CONTENT_Y = 480;
/** camera centre = look + DTS_LIFT / k (so `look` sits on y 480, above the captions). */
export const DTS_LIFT = FRAME.CY - CONTENT_Y;

// ===========================================================================
// THE CAMERA — the house rig (superposed glides + the damped follower), landscape
// ===========================================================================
/** A camera (its CENTRE) that puts world point (wx, wy) at screen point (sx, sy) at zoom k. */
export const camForL = (wx: number, wy: number, sx: number, sy: number, k: number): Cam => ({
  x: wx - (sx - FRAME.CX) / k,
  y: wy - (sy - FRAME.CY) / k,
  k,
});
/** Where a world point lands on screen under camera c (no sway). */
export const toScreenL = (c: Cam, x: number, y: number) => ({ x: FRAME.CX + (x - c.x) * c.k, y: FRAME.CY + (y - c.y) * c.k });
/** The `look` (world y on screen y 480) of a camera centre. */
export const lookOf = (c: Cam) => c.y - DTS_LIFT / c.k;
/** Is world point (x, y) on screen (with margin m px)? */
export const onScreenL = (c: Cam, x: number, y: number, m = 0) => {
  const p = toScreenL(c, x, y);
  return p.x > -m && p.x < FRAME.W + m && p.y > -m && p.y < FRAME.H + m;
};
const camEase = (u: number, warp = 1) => smoothstep(Math.pow(clamp01(u), warp));
/**
 * dtsCameraTrack — outgrowShared's cameraTrack re-solved for 16:9: `start` = { x, y = LOOK (world y that lands
 * on screen y 480), k }; each glide is an eased delta of (x, look, ln k) over [f0, f1]; glides superpose;
 * then the house damped follower (CAM_STIFF / CAM_DAMP). Returns the camera CENTRE per frame 0..frames+2.
 * `pre` runs the follower from f = -pre so glides that start before f0 are already moving on f0.
 */
export const dtsCameraTrack = (start: { x: number; y: number; k: number }, glides: Glide[], frames: number, pre = 0): Cam[] => {
  const T: Cam[] = [];
  for (let f = -pre; f <= frames + 2; f++) {
    let x = start.x;
    let y = start.y;
    let lk = Math.log(start.k);
    let kPrev = start.k;
    for (const g of glides) {
      const e = camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
      x += (g.dx ?? 0) * e;
      y += (g.dy ?? 0) * e;
      if (g.k !== undefined) {
        lk += (Math.log(g.k) - Math.log(kPrev)) * e;
        kPrev = g.k;
      }
    }
    const k = Math.exp(lk);
    T.push({ x, y: y + DTS_LIFT / k, k });
  }
  const out: Cam[] = [];
  let c = { ...T[0] };
  let v = { x: 0, y: 0, k: 0 };
  for (let i = 0; i < T.length; i++) {
    if (i > 0) {
      const t = T[i];
      v = {
        x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP,
        y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP,
        k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP,
      };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    if (i >= pre) out.push({ ...c });
  }
  return out;
};
/** Camera smoothness: max |Δv| (px/f²) and max speed (px/f) of fixed world points (outgrowShared's). */
export { camJerk };
/** The amber light band: every amber body samples ONE gradient locked to the screen (y 90 -> 880, light from above). */
export const dtsAmberBand = (c: Cam, y0: number = SAFE.top, y1: number = SAFE.bottom): [number, number] => [
  c.y + (y0 - FRAME.CY) / c.k,
  c.y + (y1 - FRAME.CY) / c.k,
];

// ===========================================================================
// THE STAGE — StoutStage's look on 1920x1080
// ===========================================================================
// The baked B1 sheet is portrait (GROUND.W 1296 x GROUND.H 2304). Landscape draws it ROTATED a quarter turn:
// 2304 x 1296 over 1920 x 1080 keeps the stout spare (192 / 108 px each side) and the fibres' exact scale.
// Past its edges it continues as MIRRORED copies (StoutStage's GROUND_EDGE grammar), only those the frame
// needs, under the sheet. The grain sheet is turned the same way (it is screen-fixed and travels <= 96 px).
const GW = GROUND.H; // the turned sheet's width
const GH = GROUND.W; // and height
const SHEET_LEFT = (FRAME.W - GW) / 2;
const SHEET_TOP = (FRAME.H - GH) / 2;
const hashG = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
const TurnedSheet: React.FC<{ src: string; style: React.CSSProperties }> = ({ src, style }) => (
  <div style={{ position: "absolute", left: SHEET_LEFT, top: SHEET_TOP, width: GW, height: GH, ...style }}>
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: (GW - GROUND.W) / 2,
        top: (GH - GROUND.H) / 2,
        width: GROUND.W,
        height: GROUND.H,
        transform: "rotate(90deg)",
      }}
    />
  </div>
);
const groundCopiesL = (gx: number, gy: number, s: number) => {
  const odd = (n: number) => Math.abs(n) % 2 === 1;
  const q = (p: number, c: number, g: number, half: number) => (p - c - g) / s + half;
  const i0 = Math.floor(q(-1, FRAME.CX, gx, GW / 2) / GW);
  const i1 = Math.floor(q(FRAME.W + 1, FRAME.CX, gx, GW / 2) / GW);
  const j0 = Math.floor(q(-1, FRAME.CY, gy, GH / 2) / GH);
  const j1 = Math.floor(q(FRAME.H + 1, FRAME.CY, gy, GH / 2) / GH);
  const out: { key: string; matrix: string }[] = [];
  for (let j = j0; j <= j1; j++) {
    for (let i = i0; i <= i1; i++) {
      if (i === 0 && j === 0) continue;
      const ax = odd(i) ? -1 : 1;
      const ay = odd(j) ? -1 : 1;
      const bx = i * GW + (odd(i) ? GW : 0);
      const by = j * GH + (odd(j) ? GH : 0);
      const e = GW / 2 + gx + s * (bx - GW / 2);
      const f = GH / 2 + gy + s * (by - GH / 2);
      out.push({ key: `${i},${j}`, matrix: `matrix(${fx(ax * s)}, 0, 0, ${fx(ay * s)}, ${fx(e)}, ${fx(f)})` });
    }
  }
  return out;
};
/** The stage's cream subject pool (SCREEN px), StoutStage's turned for landscape. */
export const DTS_POOL = { rx: 820, ry: 560 } as const;
/** The house sway on the story clock (screen px). */
export const swayAt = (S: number, on = true) => (on ? { dx: 3 * Math.sin(S / 23), dy: 5 * Math.sin(S / 19) } : { dx: 0, dy: 0 });

/** THE SHOW'S LIGHT on the ground: an amber ellipse in WORLD px (axis-aligned), additive (screen blend), fixed
 *  falloff. `strength` 0..1 scales it (e.g. 0 while the screen is off). The stage draws it between the ground
 *  and the world, so it lights the ground and never washes over a glyph. */
export type LightPool = { cx: number; cy: number; rx: number; ry: number; strength?: number };
export const DTS_LIGHT = { a0: 0.46, a1: 0.2, color: "255,168,36" } as const;

export type Pool = { x: number; y: number; strength?: number } | null;
/**
 * DtsStage — the set: the turned B1 sheet (parallax 0.15 against `rest`, drift on S, a gentle zoom with k,
 * mirrored past its edges), the cream subject pool following `pool` (world point), the show's amber
 * `lights` on the ground, the world under `cam` (its CENTRE, as dtsCameraTrack returns it) with the house
 * sway, `overlay` (SCREEN px), the vignette, then grain on twos. Opaque; nothing black.
 */
export const DtsStage: React.FC<{
  S: number;
  cam: Cam;
  rest?: Cam;
  pool?: Pool;
  lights?: LightPool[];
  sway?: boolean;
  children?: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ S, cam, rest = cam, pool = null, lights = [], sway = true, children, overlay }) => {
  const k = cam.k;
  const sw = swayAt(S, sway);
  const tx = FRAME.CX - cam.x * k + sw.dx;
  const ty = FRAME.CY - cam.y * k + sw.dy;
  const gScale = Math.pow(k / rest.k, GROUND.zoom);
  const gx = -(cam.x - rest.x) * k * GROUND.parallax;
  const gy = -(cam.y - rest.y) * k * GROUND.parallax - S * GROUND.drift;
  const g2 = GRAIN.onTwos ? Math.floor(S / 2) : S;
  const grx = (hashG(g2 + 1) * 2 - 1) * GRAIN.travel;
  const gry = (hashG(g2 + 7) * 2 - 1) * GRAIN.travel;
  const scr = (x: number, y: number) => ({ x: FRAME.CX + (x - cam.x) * k + sw.dx, y: FRAME.CY + (y - cam.y) * k + sw.dy });
  const p = pool ? { ...scr(pool.x, pool.y), s: pool.strength ?? 1 } : null;
  const lit = lights.filter((l) => (l.strength ?? 1) > 0.002 && l.rx > 0.5 && l.ry > 0.5);
  return (
    <AbsoluteFill style={{ backgroundColor: COLOR.ground, overflow: "hidden" }}>
      {groundCopiesL(gx, gy, gScale).map((c) => (
        <TurnedSheet key={c.key} src={GROUND.src} style={{ transformOrigin: "0 0", transform: c.matrix }} />
      ))}
      <TurnedSheet src={GROUND.src} style={{ transform: `translate(${fx(gx)}px, ${fx(gy)}px) scale(${fx(gScale)})` }} />
      {p ? (
        <AbsoluteFill
          style={{
            mixBlendMode: "screen",
            background: `radial-gradient(ellipse ${DTS_POOL.rx}px ${DTS_POOL.ry}px at ${fx(p.x)}px ${fx(p.y)}px, rgba(${POOL.color},${f3(
              POOL.a0 * p.s,
            )}) 0%, rgba(${POOL.color},${f3(POOL.a1 * p.s)}) 45%, rgba(${POOL.color},0) 100%)`,
          }}
        />
      ) : null}
      {GROUND_ONLY
        ? null
        : lit.map((l, i) => {
            const c = scr(l.cx, l.cy);
            const s = l.strength ?? 1;
            return (
              <AbsoluteFill
                key={`l${i}`}
                style={{
                  mixBlendMode: "screen",
                  background: `radial-gradient(ellipse ${fx(l.rx * k)}px ${fx(l.ry * k)}px at ${fx(c.x)}px ${fx(c.y)}px, rgba(${DTS_LIGHT.color},${f3(
                    DTS_LIGHT.a0 * s,
                  )}) 0%, rgba(${DTS_LIGHT.color},${f3(DTS_LIGHT.a1 * s)}) 48%, rgba(${DTS_LIGHT.color},0) 100%)`,
                }}
              />
            );
          })}
      <svg width={FRAME.W} height={FRAME.H} viewBox={`0 0 ${FRAME.W} ${FRAME.H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }}>
        <g transform={`translate(${fx(tx)} ${fx(ty)}) scale(${fx(k)})`}>{GROUND_ONLY ? null : children}</g>
      </svg>
      {GROUND_ONLY ? null : overlay}
      <AbsoluteFill style={{ background: VIGNETTE }} />
      <AbsoluteFill style={{ mixBlendMode: GRAIN.blend, opacity: GRAIN.opacity }}>
        <TurnedSheet src={GROUND.grain} style={{ transform: `translate(${fx(grx)}px, ${fx(gry)}px)` }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ===========================================================================
// THE LIGHT FRONT — what turns a glyph amber
// ===========================================================================
/** Frames a glyph takes to change tone once a front reaches it (an eased crossfade). */
export const TONE_F = 13;
/** Deterministic hash in [0, 1) for glyph i (and a salt per use). */
export const hash01 = (i: number, salt = 0) => {
  const s = Math.sin(i * 91.7 + salt * 37.3 + 13.1) * 43758.5453;
  return s - Math.floor(s);
};
/** A front: the world coordinate (usually x) the light has reached at frame f. Non-decreasing. */
export type Front = (f: number) => number;
/** The first (fractional) frame in [f0, f1] at which gap(f) >= 0, scanning by `step` and refining by
 *  bisection; Infinity if never. Use gap = front(f) - (glyphX + offset) for a moving front, or
 *  gap = walkerX(f) - (frontX + offset) for a glyph walking into a fixed light. */
export const reachFrame = (gap: (f: number) => number, f0 = -240, f1 = 480, step = 1): number => {
  if (gap(f0) >= 0) return f0;
  let a = f0;
  for (let f = f0 + step; f <= f1 + 1e-9; f += step) {
    if (gap(f) >= 0) {
      let lo = a;
      let hi = f;
      for (let it = 0; it < 30; it++) {
        const m = (lo + hi) / 2;
        if (gap(m) >= 0) hi = m;
        else lo = m;
      }
      return hi;
    }
    a = f;
  }
  return Infinity;
};
/** Reach frames of glyphs at positions `xs` (same axis as the front) behind a moving front: each glyph is
 *  reached when the front passes x + a hashed offset in [0, span] (so a front never flips a row in lockstep). */
export const reachTimes = (front: Front, xs: number[], opts: { span?: number; salt?: number; f0?: number; f1?: number } = {}) =>
  xs.map((x, i) => reachFrame((f) => front(f) - (x + (opts.span ?? 24) * hash01(i, opts.salt ?? 0)), opts.f0 ?? -240, opts.f1 ?? 480));
/** Tone 0..1 at frame f of a glyph reached at `reach` (eased, `dur` frames). */
export const toneAt = (reach: number, f: number, dur = TONE_F) => (Number.isFinite(reach) ? smoothstep((f - reach) / dur) : 0);
/** A front through keys [{ f, x }] (f ascending): each segment eased (smoothstep^warp: it starts and lands
 *  softly); holds before the first and after the last key. */
export const frontFromKeys =
  (keys: { f: number; x: number; warp?: number }[]): Front =>
  (f) => {
    if (f <= keys[0].f) return keys[0].x;
    for (let i = 1; i < keys.length; i++) {
      if (f <= keys[i].f) {
        const a = keys[i - 1];
        const b = keys[i];
        return lerp(a.x, b.x, camEase((f - a.f) / (b.f - a.f), b.warp ?? 1));
      }
    }
    return keys[keys.length - 1].x;
  };
/** A front that starts at speed and decelerates INTO x1 (rest at f1): x0 + (x1 - x0)(1 - (1 - u)^p). */
export const decelFront =
  (x0: number, x1: number, f0: number, f1: number, p = 2.4): Front =>
  (f) =>
    x0 + (x1 - x0) * (1 - Math.pow(1 - clamp01((f - f0) / (f1 - f0)), p));

// ===========================================================================
// SHADOWS — one object, one silhouette, the house light, scaled to the object
// ===========================================================================
/**
 * ObjectShadow — the house elevation shadow of ONE object (stoutShared's ElevationShadow recipe, which is for
 * TILE-scale objects) scaled to an object of extent `size` world px (its geometric mean; offsets and blurs
 * scale by size / TILE, capped at 3.2 so big objects stay grounded). Draw it BEFORE the object's body.
 * `paths` = the union silhouette (world). `lift` 0..1 eases toward the next elevation up. `contact` = the
 * foot on a floor { x, y, w } (rest only).
 */
export const ObjectShadow: React.FC<{
  paths: string[];
  size: number;
  elevation?: Elevation;
  lift?: number;
  contact?: { x: number; y: number; w: number } | null;
  strength?: number;
}> = ({ paths, size, elevation = "rest", lift = 0, contact = null, strength = 1 }) => {
  const s = Math.min(3.2, size / GEO.TILE);
  const next: Record<Elevation, Elevation> = { rest: "lifted", lifted: "float", float: "float" };
  const A = ELEVATION[elevation];
  const B = ELEVATION[next[elevation]];
  const t = clamp01(lift);
  const mix = (a: ShadowLayer, b: ShadowLayer): ShadowLayer => ({ dx: lerp(a.dx, b.dx, t), dy: lerp(a.dy, b.dy, t), blur: lerp(a.blur, b.blur, t), a: lerp(a.a, b.a, t) });
  const layers = [mix(A.amb, B.amb), mix(A.key, B.key)];
  const c = A.contact;
  if (strength <= 0.001) return null;
  return (
    <g fill={COLOR.shadow} style={{ pointerEvents: "none" }}>
      {contact && c ? (
        <ellipse
          cx={f3(contact.x + c.dx * s)}
          cy={f3(contact.y)}
          rx={f3(contact.w * 0.58)}
          ry={f3(3 * s)}
          opacity={f3(c.a * (1 - t) * strength)}
          style={{ filter: `blur(${f3(c.blur * s)}px)` }}
        />
      ) : null}
      {layers.map((l, i) => (
        <g key={i} opacity={f3(l.a * strength)} transform={`translate(${fx(l.dx * s)} ${fx(l.dy * s)})`} style={{ filter: `blur(${f3(l.blur * s)}px)` }}>
          {paths.map((d, j) => (
            <path key={j} d={d} />
          ))}
        </g>
      ))}
    </g>
  );
};

/** The hot top edge of an amber body (SCREEN px: a 2 px line + a 12 px falloff), clipped by the caller. */
const HotEdge: React.FC<{ x: number; y: number; w: number; k: number; r: number; id: string }> = ({ x, y, w, k, r, id }) => {
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={rectPath(x, y, w, fall, r, true, false)} fill={`url(#${id})`} />
      <path d={`M${f3(x + r)} ${f3(y + EDGE.HOT / k / 2)}H${f3(x + w - r)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
    </g>
  );
};
/** A cream card's lit top edge (SCREEN px wide line, white at the card's edge alpha). */
const LitEdge: React.FC<{ x0: number; x1: number; y: number; k: number; dim?: number }> = ({ x0, x1, y, k, dim = 0 }) =>
  x1 - x0 <= 0.01 ? null : (
    <path d={`M${f3(x0)} ${f3(y + EDGE.CREAM / k / 2)}H${f3(x1)}`} stroke={COLOR.edge} strokeOpacity={f3(lerp(ALPHA.edge, ALPHA.edgeBoard, dim))} strokeWidth={f3(EDGE.CREAM / k)} />
  );
/** Bloom (amber only, fixed) for an element whose local units are `unit` world px (e.g. a scaled group). */
const bloomIn = (k: number, unit = 1) => BLOOM_LAYERS.map((l) => `drop-shadow(0 0 ${f4(l.blur / (k * unit))}px ${l.color})`).join(" ");

// ===========================================================================
// THE SCREEN — the show itself
// ===========================================================================
/** The bezel's thickness as a fraction of the screen's outer width; the face is 16:9. */
export const BEZEL_FRAC = 0.03;
/** The title card's width as a fraction of the face width (the real "FORMULA 1 / DRIVE TO SURVIVE" card). */
export const CARD_FRAC = 0.74;
/** A screen of outer width w centred on (x, y): its outer box, its face, the bezel b and its corner radii. */
export const screenBox = (x: number, y: number, w: number) => {
  const b = w * BEZEL_FRAC;
  const fw = w - 2 * b;
  const fh = (fw * 9) / 16;
  const h = fh + 2 * b;
  return {
    outer: { x: x - w / 2, y: y - h / 2, w, h },
    face: { x: x - w / 2 + b, y: y - h / 2 + b, w: fw, h: fh },
    b,
    r: b * 0.55,
    rFace: Math.max(1, b * 0.18),
    top: y - h / 2,
    bottom: y + h / 2,
  };
};
/** The show's light in front of a screen (on the ground below it): the default pool of cuts A/B. */
export const screenLight = (x: number, y: number, w: number, strength = 1): LightPool => {
  const s = screenBox(x, y, w);
  return { cx: x, cy: s.bottom + 0.13 * w, rx: 0.8 * w, ry: 0.2 * w, strength };
};
/** A pool spanning [x0, x1] along the ground at cy (for a light that spreads or slides). */
export const lightSpan = (x0: number, x1: number, cy: number, ry: number, strength = 1): LightPool => ({
  cx: (x0 + x1) / 2,
  cy,
  rx: Math.max(0, (x1 - x0) / 2),
  ry,
  strength,
});

export type GlyphName = keyof typeof DTS_GLYPHS;
/**
 * Screen — THE SCREEN: a 16:9 cream-card bezel (one union shadow, lit top edge, key light above left) around
 * its face. (x, y) = centre, w = outer width (world px), k = camera zoom, band = dtsAmberBand(cam).
 *   on    1 = the show is on: the amber band face (fixed bloom, 2 px hot top edge) with the real DTS title
 *         card knocked out of it in ink; 0 = OFF (a board face); between = ONE eased wipe left -> right
 *         (drive `on` 0..1 with your own easing over ~14 f).
 *   card  draw the title card on the lit face (default true).
 *   glyph the COPY screen (cut B): the identical bezel, a board face, this Lucide-grammar glyph knocked out
 *         through it to the ground; never lit (`on` is ignored).
 *   enter the house entrance 0..1 (slide up 24 px + fade), default 1.
 * The screen casts no light by itself: pass screenLight(...) / lightSpan(...) to DtsStage `lights`.
 */
export const Screen: React.FC<{
  x: number;
  y: number;
  w: number;
  k: number;
  band: [number, number];
  on?: number;
  card?: boolean;
  glyph?: GlyphName;
  enter?: number;
}> = ({ x, y, w, k, band, on = 1, card = true, glyph, enter = 1 }) => {
  const uid = uidOf(useId());
  const en = easeOutCubic(enter);
  if (en <= 0.001) return null;
  const s = screenBox(x, y, w);
  const o = s.outer;
  const F = s.face;
  const lit = glyph ? 0 : clamp01(on);
  const soft = F.w * 0.06;
  const e = F.x - soft + lit * (F.w + soft); // the wipe: white (lit) left of e, black right of e + soft
  const pad = 80 / k;
  const cardW = F.w * CARD_FRAC;
  const cardH = (cardW * DTS_CARD_PX.h) / DTS_CARD_PX.w;
  const gSize = F.h * 0.66;
  return (
    <g opacity={en < 1 ? f3(en) : undefined} transform={en < 1 ? `translate(0 ${fx(((1 - en) * 24) / k)})` : undefined}>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(o.y)} x2="0" y2={f3(o.y + o.h)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}b`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(F.y)} x2="0" y2={f3(F.y + F.h)}>
          <stop offset="0" stopColor={COLOR.board} />
          <stop offset="1" stopColor={COLOR.boardFoot} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        {glyph ? (
          <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={f3(o.x - 4)} y={f3(o.y - 4)} width={f3(o.w + 8)} height={f3(o.h + 8)}>
            <rect x={f3(o.x - 4)} y={f3(o.y - 4)} width={f3(o.w + 8)} height={f3(o.h + 8)} fill="#fff" />
            <GlyphPaths name={glyph} cx={x} cy={F.y + F.h / 2} size={gSize} color="#000" />
          </mask>
        ) : null}
        {lit > 0 && lit < 1 ? (
          <>
            <linearGradient id={`${uid}wg`} gradientUnits="userSpaceOnUse" x1={f3(e)} y1="0" x2={f3(e + soft)} y2="0">
              <stop offset="0" stopColor="#fff" />
              <stop offset="1" stopColor="#000" />
            </linearGradient>
            <mask id={`${uid}w`} maskUnits="userSpaceOnUse" x={f3(F.x - pad)} y={f3(F.y - pad)} width={f3(F.w + 2 * pad)} height={f3(F.h + 2 * pad)}>
              <rect x={f3(F.x - pad)} y={f3(F.y - pad)} width={f3(F.w + 2 * pad)} height={f3(F.h + 2 * pad)} fill={`url(#${uid}wg)`} />
            </mask>
          </>
        ) : null}
        {lit > 0 && card ? (
          <mask id={`${uid}t`} maskUnits="userSpaceOnUse" x={f3(x - cardW / 2)} y={f3(F.y + F.h / 2 - cardH / 2)} width={f3(cardW)} height={f3(cardH)}>
            <image href={DTS_CARD_URL} x={f3(x - cardW / 2)} y={f3(F.y + F.h / 2 - cardH / 2)} width={f3(cardW)} height={f3(cardH)} preserveAspectRatio="none" />
          </mask>
        ) : null}
      </defs>
      {/* the one shadow */}
      <ObjectShadow paths={[rectPath(o.x, o.y, o.w, o.h, s.r)]} size={Math.sqrt(o.w * o.h)} elevation="rest" />
      <g mask={glyph ? `url(#${uid}k)` : undefined}>
        {/* the bezel (cream card) and its lit top edge */}
        <path d={rectPath(o.x, o.y, o.w, o.h, s.r)} fill={`url(#${uid}c)`} />
        <LitEdge x0={o.x + s.r} x1={o.x + o.w - s.r} y={o.y} k={k} />
        {/* the face: board (off / copy) */}
        {lit < 1 ? <path d={rectPath(F.x, F.y, F.w, F.h, s.rFace)} fill={`url(#${uid}b)`} /> : null}
        {/* the face: amber (the show), wiping on left -> right */}
        {lit > 0 ? (
          <g mask={lit < 1 ? `url(#${uid}w)` : undefined}>
            <g style={{ filter: bloomIn(k) }}>
              <path d={rectPath(F.x, F.y, F.w, F.h, s.rFace)} fill={`url(#${uid}a)`} />
            </g>
            <HotEdge x={F.x} y={F.y} w={F.w} k={k} r={s.rFace} id={`${uid}h`} />
            {card ? <rect x={f3(x - cardW / 2)} y={f3(F.y + F.h / 2 - cardH / 2)} width={f3(cardW)} height={f3(cardH)} fill={COLOR.inkDark} mask={`url(#${uid}t)`} /> : null}
          </g>
        ) : null}
      </g>
    </g>
  );
};

// ===========================================================================
// PEOPLE — the iceberg bust (person.png as a vector), one shadow each
// ===========================================================================
/** The person size of the A/B world (WORLD px, the bust's height). */
export const PERSON_H = 60;
/** DARK: one tone below board, a barely-there texture — not yet reached by the show (icebergShared's). */
export const DARK = mixHex(COLOR.ground, COLOR.board, 0.15);
// The bust in UNIT space: height 1, bottom-centre at (0, 0), y up is negative (person.png's ink 41..470 of 512).
type Cmd = ["M" | "L", number, number] | ["Q", number, number, number, number] | ["C", number, number, number, number, number, number] | ["Z"];
const KAPPA = 0.5522847498;
const circleCmds = (cx: number, cy: number, r: number): Cmd[] => {
  const c = r * KAPPA;
  return [
    ["M", cx + r, cy],
    ["C", cx + r, cy + c, cx + c, cy + r, cx, cy + r],
    ["C", cx - c, cy + r, cx - r, cy + c, cx - r, cy],
    ["C", cx - r, cy - c, cx - c, cy - r, cx, cy - r],
    ["C", cx + c, cy - r, cx + r, cy - c, cx + r, cy],
    ["Z"],
  ];
};
type Map2 = (x: number, y: number) => [number, number];
const pathOf = (cmds: Cmd[], map: Map2, fmt: (v: number) => string = f3) =>
  cmds
    .map((c) => {
      if (c[0] === "Z") return "Z";
      const pts: string[] = [];
      for (let i = 1; i < c.length; i += 2) {
        const [x, y] = map(c[i] as number, c[i + 1] as number);
        pts.push(`${fmt(x)} ${fmt(y)}`);
      }
      return `${c[0]}${pts.join(" ")}`;
    })
    .join("");
const BUST_CMDS: Cmd[] = [
  ...circleCmds(255.5, 143, 102),
  ["M", 41, 458],
  ["C", 41, 352, 126, 266, 232, 266],
  ["L", 279, 266],
  ["C", 385, 266, 470, 352, 470, 458],
  ["L", 470, 462],
  ["Q", 470, 470, 462, 470],
  ["L", 49, 470],
  ["Q", 41, 470, 41, 462],
  ["Z"],
];
const unitMap: Map2 = (u, v) => [(u - 255.5) / 429, (v - 470) / 429];
/** The bust in unit space (height 1, bottom-centre origin). */
export const BUST_UNIT_D = pathOf(BUST_CMDS, unitMap, f4);
/** Unit-space landmarks: the bust is as wide as it is tall (1 x 1); head centre / radius; the shoulders' top. */
export const BUST = { w: 1, headCy: (143 - 470) / 429, headR: 102 / 429, shoulderY: (266 - 470) / 429 } as const;
/** The bust as one world path: bottom-centre (x, y), height h. */
export const bustD = (x: number, y: number, h: number) => pathOf(BUST_CMDS, (u, v) => [x + ((u - 255.5) / 429) * h, y + ((v - 470) / 429) * h]);
/**
 * Person — one bust (bottom-centre (x, y), height h world px) with its one shadow (the rest recipe scaled
 * to the glyph). `base` = its fill (default DARK; pass COLOR.board / COLOR.cream for the other rungs);
 * `amber` 0..1 crossfades it to the show's amber (the accent's top tone, with the fixed bloom) — drive it
 * with toneAt(reach, f). `extra` = more silhouette in UNIT space (height 1, bottom-centre origin, y up
 * negative), drawn as part of the same glyph and shadow (a ponytail, a bun, glasses knocked out with
 * `knock`). `opacity` only for an entrance. `lift` 0..1 eases its shadow toward the lifted elevation (a
 * person in flight, e.g. rising into a seat; settle it back to 0 on landing).
 */
export const Person: React.FC<{
  x: number;
  y: number;
  h: number;
  k: number;
  base?: string;
  amber?: number;
  extra?: string;
  knock?: string;
  shadow?: boolean;
  opacity?: number;
  lift?: number;
}> = ({ x, y, h, k, base = DARK, amber = 0, extra, knock, shadow = true, opacity = 1, lift = 0 }) => {
  const uid = uidOf(useId());
  if (opacity <= 0.002) return null;
  const t = clamp01(lift);
  const mixL = (a: ShadowLayer, b: ShadowLayer): ShadowLayer => ({ dx: lerp(a.dx, b.dx, t), dy: lerp(a.dy, b.dy, t), blur: lerp(a.blur, b.blur, t), a: lerp(a.a, b.a, t) });
  const E = { amb: mixL(ELEVATION.rest.amb, ELEVATION.lifted.amb), key: mixL(ELEVATION.rest.key, ELEVATION.lifted.key) };
  const s = 1 / GEO.TILE; // the recipe (TILE-scale) per unit of glyph height
  const shapes = (fill?: string) => (
    <>
      <path d={BUST_UNIT_D} fill={fill} />
      {extra ? <path d={extra} fill={fill} /> : null}
    </>
  );
  const a = clamp01(amber);
  return (
    <g transform={`translate(${fx(x)} ${fx(y)}) scale(${fx(h)})`} opacity={opacity < 1 ? f3(opacity) : undefined}>
      {knock ? (
        <defs>
          <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x="-1" y="-1.5" width="2" height="2">
            <rect x="-1" y="-1.5" width="2" height="2" fill="#fff" />
            <path d={knock} fill="#000" />
          </mask>
        </defs>
      ) : null}
      {shadow
        ? [E.amb, E.key].map((l, i) => (
            <g key={i} fill={COLOR.shadow} opacity={f3(l.a)} transform={`translate(${f4(l.dx * s)} ${f4(l.dy * s)})`} style={{ filter: `blur(${f4(l.blur * s)}px)` }}>
              {shapes()}
            </g>
          ))
        : null}
      <g mask={knock ? `url(#${uid}k)` : undefined}>
        <g fill={base}>{shapes()}</g>
        {a > 0.002 ? (
          <g opacity={a < 1 ? f3(a) : undefined} style={{ filter: bloomIn(k, h) }}>
            {shapes(COLOR.amberTop)}
          </g>
        ) : null}
      </g>
    </g>
  );
};

// ===========================================================================
// THE F1 CAR — icebergShared's side profile (cream card, one union shadow), any length
// ===========================================================================
// Metres: x 0 = the tail, 5.5 = the nose; y up from the ground.
const WHEEL_R = 0.36;
const WHEELS: [number, number][] = [
  [0.86, 0.36],
  [4.38, 0.36],
];
const HELMET = { x: 2.98, y: 0.8, r: 0.2 };
const CAR_BODY: Cmd[] = [
  ["M", 0.5, 0.17],
  ["L", 0.5, 0.4],
  ["C", 1.3, 0.47, 1.95, 0.58, 2.22, 0.84],
  ["L", 2.3, 0.96],
  ["Q", 2.33, 1.0, 2.4, 1.0],
  ["L", 2.56, 1.0],
  ["Q", 2.62, 1.0, 2.64, 0.95],
  ["L", 2.7, 0.7],
  ["L", 3.42, 0.68],
  ["C", 4.05, 0.64, 4.8, 0.47, 5.4, 0.28],
  ["Q", 5.48, 0.26, 5.46, 0.21],
  ["L", 4.6, 0.18],
  ["L", 4.06, 0.22],
  ["L", 3.98, 0.07],
  ["L", 1.25, 0.05],
  ["L", 0.95, 0.1],
  ["L", 0.62, 0.16],
  ["Z"],
];
const CAR_WING_R: Cmd[] = [
  ["M", 0.0, 0.62],
  ["L", 0.0, 0.95],
  ["Q", 0.0, 1.0, 0.05, 1.0],
  ["L", 0.66, 0.97],
  ["L", 0.7, 0.92],
  ["L", 0.7, 0.8],
  ["L", 0.16, 0.78],
  ["L", 0.14, 0.62],
  ["Z"],
];
const CAR_PILLAR: Cmd[] = [["M", 0.34, 0.8], ["L", 0.46, 0.8], ["L", 0.6, 0.36], ["L", 0.48, 0.36], ["Z"]];
const CAR_WING_F: Cmd[] = [
  ["M", 4.8, 0.03],
  ["L", 5.6, 0.03],
  ["L", 5.62, 0.26],
  ["Q", 5.62, 0.29, 5.58, 0.29],
  ["L", 5.52, 0.29],
  ["L", 5.49, 0.14],
  ["L", 4.9, 0.13],
  ["Q", 4.82, 0.12, 4.8, 0.08],
  ["Z"],
];
const CAR_INK: Cmd[][] = [
  [["M", 0.03, 0.885], ["L", 0.68, 0.865], ["L", 0.68, 0.895], ["L", 0.03, 0.915], ["Z"]],
  [["M", 3.3, 0.33], ["Q", 3.42, 0.34, 3.43, 0.44], ["L", 3.43, 0.56], ["Q", 3.36, 0.56, 3.32, 0.5], ["Z"]],
  [["M", 2.58, 0.86], ["L", 2.65, 0.86], ["L", 2.63, 0.96], ["L", 2.59, 0.96], ["Z"]],
];
const CAR_HALO: Cmd[] = (() => {
  const seg = (p0: [number, number], p1: [number, number], p2: [number, number], p3: [number, number], n: number) => {
    const out: [number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const a = (1 - t) ** 3;
      const b = 3 * (1 - t) ** 2 * t;
      const c = 3 * (1 - t) * t * t;
      const d = t ** 3;
      out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
    }
    return out;
  };
  const line = [...seg([3.4, 0.66], [3.32, 0.98], [3.12, 1.1], [2.94, 1.1], 14), ...seg([2.94, 1.1], [2.76, 1.1], [2.66, 1.05], [2.6, 0.98], 8).slice(1)];
  const w = 0.035;
  const L: [number, number][] = [];
  const R: [number, number][] = [];
  line.forEach((p, i) => {
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const n = Math.hypot(tx, ty) || 1;
    L.push([p[0] - (ty / n) * w, p[1] + (tx / n) * w]);
    R.push([p[0] + (ty / n) * w, p[1] - (tx / n) * w]);
  });
  const pts = [...L, ...R.reverse()];
  return [["M", pts[0][0], pts[0][1]] as Cmd, ...pts.slice(1).map((p) => ["L", p[0], p[1]] as Cmd), ["Z"] as Cmd];
})();
const VISOR: Cmd[] = [
  ["M", 3.0, 0.8],
  ["L", 3.22, 0.8],
  ["L", 3.22, 0.87],
  ["L", 3.0, 0.87],
  ["Q", 2.97, 0.835, 3.0, 0.8],
  ["Z"],
];
const CAR_SIL: Cmd[][] = [CAR_BODY, CAR_WING_R, CAR_PILLAR, CAR_WING_F, CAR_HALO, circleCmds(HELMET.x, HELMET.y, HELMET.r), ...WHEELS.map(([x, y]) => circleCmds(x, y, WHEEL_R))];
/** The car's proportions: length 5.62 m (wing tip) for 5.5 "units", height 1.14 m (the halo's top). */
export const CAR = { units: 5.5, heightOfLen: 1.14 / 5.5, reachOfLen: 5.62 / 5.5 } as const;
/**
 * F1Car — the side-profile car, nose right: cream card (one gradient), wheels ringed off the body, the helmet
 * with its ink visor, the ink details, ONE union shadow with its contact on the ground. (x, y) = the tail's x
 * and the ground y (world), `len` = the car's length (world px; it is CAR.heightOfLen x len tall), `dim`
 * 0..1 eases cream -> board (context), `lift` 0..1 toward the next elevation (a car in flight).
 */
export const F1Car: React.FC<{ x: number; y: number; len: number; k: number; dim?: number; lift?: number }> = ({ x, y, len, dim = 0, lift = 0 }) => {
  // k is accepted for API symmetry (every world component takes the camera k); the car has no screen-px parts
  const uid = uidOf(useId());
  const m = len / CAR.units;
  const map: Map2 = (u, v) => [x + u * m, y - v * m];
  const H = 1.14 * m;
  const gap = 0.05 * m;
  const d = (c: Cmd[]) => pathOf(c, map);
  return (
    <g>
      <ObjectShadow paths={CAR_SIL.map(d)} size={Math.sqrt(len * H)} lift={lift} contact={{ x: x + len / 2, y, w: len * 0.9 }} />
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y - H)} x2="0" y2={f3(y)}>
          <stop offset="0" stopColor={mixHex(COLOR.cream, COLOR.board, dim)} />
          <stop offset="1" stopColor={mixHex(COLOR.creamFoot, COLOR.boardFoot, dim)} />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(x - 10)} y={f3(y - H - 10)} width={f3(len * 1.05 + 20)} height={f3(H + 20)}>
          <rect x={f3(x - 10)} y={f3(y - H - 10)} width={f3(len * 1.05 + 20)} height={f3(H + 20)} fill="#fff" />
          {WHEELS.map(([u, v], i) => (
            <circle key={i} cx={f3(x + u * m)} cy={f3(y - v * m)} r={f3(WHEEL_R * m + gap)} fill="#000" />
          ))}
        </mask>
        <clipPath id={`${uid}h`}>
          <path d={d(circleCmds(HELMET.x, HELMET.y, HELMET.r))} />
        </clipPath>
      </defs>
      <path d={d(circleCmds(HELMET.x, HELMET.y, HELMET.r))} fill={mixHex(COLOR.cream, COLOR.board, dim)} />
      <g clipPath={`url(#${uid}h)`}>
        <path d={d(VISOR)} fill={COLOR.inkDark} />
      </g>
      <g fill={`url(#${uid}c)`} mask={`url(#${uid}m)`}>
        <path d={d(CAR_BODY)} />
        <path d={d(CAR_PILLAR)} />
        <path d={d(CAR_WING_R)} />
        <path d={d(CAR_WING_F)} />
      </g>
      <path d={d(CAR_HALO)} fill={`url(#${uid}c)`} />
      {WHEELS.map(([u, v], i) => (
        <path key={i} d={d(circleCmds(u, v, WHEEL_R))} fill={`url(#${uid}c)`} />
      ))}
      {WHEELS.map(([u, v], i) => (
        <circle key={`r${i}`} cx={f3(x + u * m)} cy={f3(y - v * m)} r={f3(0.17 * m)} fill="none" stroke={COLOR.inkDark} strokeWidth={f3(0.055 * m)} />
      ))}
      <g fill={COLOR.inkDark}>
        {CAR_INK.map((c, i) => (
          <path key={i} d={d(c)} />
        ))}
      </g>
    </g>
  );
};

// ===========================================================================
// TILES — the house knock-out tile family: Mercedes star, Ferrari shield, the anonymous car, a sport
// ===========================================================================
export type DtsFigure = "mercedes" | "ferrari" | "car" | "none" | { sport: SportName };
/** The car silhouette (one figure) knocked out of a tile: body etc. black, the wheels ringed in white. */
const CAR_BOX = { x0: 0, x1: 5.56, y0: 0.03, y1: 1.14 };
const CarFigure: React.FC<{ size: number }> = ({ size }) => {
  const w = CAR_BOX.x1 - CAR_BOX.x0;
  const h = CAR_BOX.y1 - CAR_BOX.y0;
  const fit = opticalFit(w, h, 0.42, 0, size);
  const ox = fit.cx - (CAR_BOX.x0 + w / 2) * fit.sc;
  const oy = fit.cy + (CAR_BOX.y0 + h / 2) * fit.sc;
  const map: Map2 = (mx, my) => [ox + mx * fit.sc, oy - my * fit.sc];
  const ring = 0.07;
  return (
    <g>
      <g fill="#000">
        {CAR_SIL.slice(0, 6).map((c, i) => (
          <path key={i} d={pathOf(c, map)} />
        ))}
      </g>
      <g fill="#fff">
        {WHEELS.map(([x, y], i) => (
          <path key={i} d={pathOf(circleCmds(x, y, WHEEL_R + ring), map)} />
        ))}
      </g>
      <g fill="#000">
        {WHEELS.map(([x, y], i) => (
          <path key={i} d={pathOf(circleCmds(x, y, WHEEL_R), map)} />
        ))}
      </g>
    </g>
  );
};
/** The Ferrari shield as a knock-out (tile-local box 0..size): the shield's outline as a ring, the prancing
 *  horse and the S F, all to the ground; the field stays tile. Sized by the family's optical rule. */
export const FERRARI_RING = 4.2; // the ring's inward stroke, source units (the outline ~3.5 units: it reads at phone size)
const FerrariFigure: React.FC<{ size: number }> = ({ size }) => {
  const [bx, by, bw, bh] = FERRARI_OPTICAL.box;
  const fit = opticalFit(bw, bh, FERRARI_OPTICAL.fill, FERRARI_OPTICAL.cy, size);
  const ox = fit.cx - (bx + bw / 2) * fit.sc;
  const oy = fit.cy - (by + bh / 2) * fit.sc;
  return (
    <g transform={`translate(${fx(ox)} ${fx(oy)}) scale(${fx(fit.sc)})`}>
      <path d={FERRARI_SHIELD_OUTER} fill="#000" />
      <path d={FERRARI_SHIELD_FIELD} fill="#fff" stroke="#000" strokeWidth={FERRARI_RING} strokeLinejoin="round" />
      <g fill="#000">
        {[...FERRARI_HORSE, ...FERRARI_LETTERS].map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </g>
  );
};
const FigureIn: React.FC<{ figure: DtsFigure; size: number }> = ({ figure, size }) => {
  if (figure === "none") return null;
  if (figure === "mercedes") return <FigureMark figure={{ kind: "mercedes" }} size={size} />;
  if (figure === "ferrari") return <FerrariFigure size={size} />;
  if (figure === "car") return <CarFigure size={size} />;
  return <FigureMark figure={{ kind: "sport", sport: figure.sport }} size={size} />;
};
/**
 * DtsTile — one team tile (stout tile material): a square card of `size` world px, bottom-centre (x, y), its
 * figure knocked out to the ground, one shadow (the rest recipe scaled to the tile, a contact at rest),
 * the lit top edge. Tone (all eased by the caller, 12-14 f, when a front reaches it):
 *   dim   0 = cream (lit subject) .. 1 = board (context / declined)
 *   amber 0..1 the show's light: the amber band face, fixed bloom, the hot top edge
 *   dark  0..1 in the DARK (a plain dark square; the figure fades in as it rises out of it)
 * `band` = dtsAmberBand(cam) (needed only when amber > 0). `elevation` / `lift` / `enter` as stoutShared.
 * Counter-scale a tile used as a headline by passing size = px / k.
 */
export const DtsTile: React.FC<{
  x: number;
  y: number;
  size: number;
  k: number;
  figure: DtsFigure;
  dim?: number;
  amber?: number;
  dark?: number;
  band?: [number, number];
  elevation?: Elevation;
  lift?: number;
  enter?: number;
}> = ({ x, y, size, k, figure, dim = 0, amber = 0, dark = 0, band, elevation = "rest", lift = 0, enter = 1 }) => {
  const uid = uidOf(useId());
  const en = easeOutCubic(enter);
  if (en <= 0.001) return null;
  const T = size;
  const x0 = x - T / 2;
  const y0 = y - T;
  const r = GEO.RADIUS * (T / GEO.TILE);
  const a = clamp01(amber);
  const bd = band ?? [y0, y];
  return (
    <g opacity={en < 1 ? f3(en) : undefined} transform={en < 1 ? `translate(0 ${fx(((1 - en) * 24) / k)})` : undefined}>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y)}>
          <stop offset="0" stopColor={mixHex(mixHex(COLOR.cream, COLOR.board, dim), DARK, dark)} />
          <stop offset="1" stopColor={mixHex(mixHex(COLOR.creamFoot, COLOR.boardFoot, dim), DARK, dark)} />
        </linearGradient>
        <AmberGradient id={`${uid}a`} y0={bd[0]} y1={bd[1]} />
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={f3(x0)} y={f3(y0)} width={f3(T)} height={f3(T)}>
          <rect x={f3(x0)} y={f3(y0)} width={f3(T)} height={f3(T)} fill="#fff" />
          <g opacity={dark > 0 ? f3(1 - dark) : undefined} transform={`translate(${fx(x0)} ${fx(y0)})`}>
            <FigureIn figure={figure} size={T} />
          </g>
        </mask>
        <clipPath id={`${uid}c`}>
          <path d={rectPath(x0, y0, T, T, r)} />
        </clipPath>
      </defs>
      <ObjectShadow
        paths={[rectPath(x0, y0, T, T, r)]}
        size={T}
        elevation={elevation}
        lift={lift}
        contact={elevation === "rest" ? { x, y, w: T } : null}
        strength={1 - dark}
      />
      <path d={rectPath(x0, y0, T, T, r)} fill={`url(#${uid}g)`} mask={`url(#${uid}k)`} />
      {a > 0.002 ? (
        <g opacity={a < 1 ? f3(a) : undefined}>
          <g style={{ filter: bloomIn(k) }}>
            <path d={rectPath(x0, y0, T, T, r)} fill={`url(#${uid}a)`} mask={`url(#${uid}k)`} />
          </g>
          <g clipPath={`url(#${uid}c)`} mask={`url(#${uid}k)`}>
            <HotEdge x={x0} y={y0} w={T} k={k} r={r} id={`${uid}h`} />
          </g>
        </g>
      ) : null}
      {a < 0.999 ? <LitEdge x0={x0 + r} x1={x0 + T - r} y={y0} k={k} dim={Math.max(dim, dark)} /> : null}
    </g>
  );
};

// ===========================================================================
// LOGOS — cream, inlined, counter-scaled (they hold their SCREEN size across zooms), one entrance
// ===========================================================================
export type LogoMark = "netflix" | "f1";
const LOGO = {
  netflix: { d: NETFLIX_D, vb: NETFLIX_VB },
  f1: { d: F1_D, vb: F1_VB },
} as const;
/** The logo's rest heights (SCREEN px): NETFLIX's cap height ~56-64, the F1 mark 64. */
export const LOGO_PX = { netflix: 60, f1: 64 } as const;
/** A logo's world box at camera k: { w, h } for a height of `px` screen px. */
export const logoBox = (mark: LogoMark, px: number, k: number) => ({ w: ((px / k) * LOGO[mark].vb.w) / LOGO[mark].vb.h, h: px / k });
/** The house entrance for type and logos: blur 6 -> 0 px + a 24 px slide-up + fade, ease-out; enter 0..1 (~14 f). */
const LogoBase: React.FC<{ mark: LogoMark; x: number; y: number; k: number; px?: number; enter?: number; color?: string }> = ({
  mark,
  x,
  y,
  k,
  px,
  enter = 1,
  color = COLOR.inkCream,
}) => {
  const a = easeOutCubic(enter);
  if (a <= 0.002) return null;
  const h = (px ?? LOGO_PX[mark]) / k;
  const sc = h / LOGO[mark].vb.h;
  const w = LOGO[mark].vb.w * sc;
  const lift = ((1 - a) * 24) / k;
  const blur = (6 * (1 - a)) / k;
  return (
    <g opacity={a < 1 ? f3(a) : undefined} style={{ filter: blur > 0.01 ? `blur(${f3(blur)}px)` : undefined }}>
      <path d={LOGO[mark].d} fill={color} transform={`translate(${fx(x - w / 2)} ${fx(y - h + lift)}) scale(${fx(sc)})`} />
    </g>
  );
};
/** NETFLIX — the wordmark in cream; (x, y) = its bottom-centre (world), px = its height on screen (default 60). */
export const NetflixLogo: React.FC<{ x: number; y: number; k: number; px?: number; enter?: number }> = (p) => <LogoBase mark="netflix" {...p} />;
/** F1 — the F1 mark (no (R)) in cream; (x, y) = its bottom-centre (world), px = its height on screen (default 64). */
export const F1Logo: React.FC<{ x: number; y: number; k: number; px?: number; enter?: number }> = (p) => <LogoBase mark="f1" {...p} />;

// ===========================================================================
// GLYPHS — Lucide grammar (24-unit box, ONE stroke weight 2.6, square caps, mitre joins), cream
// ===========================================================================
export const GLYPH_STROKE = 2.6;
export const DTS_GLYPHS = {
  // Lucide "bike": two wheels, the rider's head, the frame
  BICYCLE: `<circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/>`,
  // a tennis ball: the ball and its two seams curving in from opposite quarters
  TENNIS: `<circle cx="12" cy="12" r="10"/><path d="M12 2A10 10 0 0 0 22 12"/><path d="M2 12A10 10 0 0 1 12 22"/>`,
  // Lucide "trophy": cup, two handles, stem, base
  TROPHY: `<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>`,
} as const;
/** A glyph's strokes centred on (cx, cy), `size` world px for its 24-unit box. */
const GlyphPaths: React.FC<{ name: GlyphName; cx: number; cy: number; size: number; color: string }> = ({ name, cx, cy, size, color }) => {
  const s = size / 24;
  return (
    <g
      transform={`translate(${fx(cx - size / 2)} ${fx(cy - size / 2)}) scale(${fx(s)})`}
      fill="none"
      stroke={color}
      strokeWidth={GLYPH_STROKE}
      strokeLinecap="square"
      strokeLinejoin="miter"
      dangerouslySetInnerHTML={{ __html: DTS_GLYPHS[name] }}
    />
  );
};
/** LineGlyph — a cream Lucide-grammar glyph on the ground, centred on (x, y), `size` world px (its 24 box). */
export const LineGlyph: React.FC<{ name: GlyphName; x: number; y: number; size: number; k: number; color?: string; enter?: number }> = ({
  name,
  x,
  y,
  size,
  k,
  color = COLOR.inkCream,
  enter = 1,
}) => {
  const a = easeOutCubic(enter);
  if (a <= 0.002) return null;
  return (
    <g opacity={a < 1 ? f3(a) : undefined} transform={a < 1 ? `translate(0 ${fx(((1 - a) * 24) / k)})` : undefined}>
      <GlyphPaths name={name} cx={x} cy={y} size={size} color={color} />
    </g>
  );
};

// ===========================================================================
// THE SHARED LAYOUT (cuts A and B share it; C, D, E place their own screen by these sizes)
// ===========================================================================
export const DTS = {
  /** THE SCREEN of cuts A/B: centre (0, 0), outer width 720 (face 676.8 x 380.7). */
  SCREEN: { x: 0, y: 0, w: 720 },
  /** the walkers' ground (cut A): the bottom of a lane-0 bust; lanes sit +-16 around it */
  PATH_Y: 321,
  /** the person bust height (cuts A-D) */
  PERSON_H,
} as const;
