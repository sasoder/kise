// ---------------------------------------------------------------------------
// tenEarthsGenius — THE GENIUS of rsi-ten-earths: one AI, drawn as a person in the house orange, in the picture-book
// gouache hand of the approved casts (covidFolk / pandemicFolk / romeFolk): the SAME rig, proportions and paint as
// covidFolk (imported, never edited: the officer build in shirtsleeves, a man ~312 units = 1.75 m, ~4.4 heads, dot
// eyes, blush dot, small nose, mitten hands, small feet, ONE soft crescent shadow per part, pandemicFolkPaint's gouache
// filter, no outline), re-inked: shirt, collar, trousers, belt, shoes and tie all in the ACCENT family (#FFB000 cloth,
// its crescent shadow toward a deep orange, not the cast's grey-teal), the face and hands a light orange-cream
// (#FBDCB0) so the dot eyes read. The genius cue: ROUND GLASSES (v0, the hero) / a swept HAIR TUFT; tidy side-parted
// hair in a deep amber. He is the ONLY orange thing in the clip; the medium's bloom (<AirStage bloom={0.22}>) makes
// him glow faintly through the air. Geometry and poses: tenEarthsGeniusBody.ts. Contract: <notes>/GENIUS_READY.md.
//
// UNITS: rig units, feet at (0, 0), up -y, a Genius 312 units = 1.75 m (U = 178 per metre; the hall's units).
//   `at` = the feet in world px, `scale` = world px per unit. On the depth kit: const { at, scale } = A.P.at(X, Z);
//   screen px per unit = scale * cam.k (WorldSvg). geniusScaleForPx(px) = px / 312 for flat sheets.
//   On a phone (1080 x 1920): HERO 350-600 px tall (scale*k 1.1-1.9): glasses, tuft, eyes, tie, pencil all read.
//   MID 120-200 px (0.38-0.64): the glasses read as two rings, the tuft as a curl, the tie as a stripe; the face is dots.
//   CROWD 8-40 px: sprites from ~14 px up, the dot LOD below (a soft orange bean with a head bump), crossfaded.
//
// THE FIGURE
//   <Genius variant pose at scale uid frame? fog? unitPx? tone? texture? aura? />
//     variant 0..4 (GENIUS_LOOKS): v0 THE Genius (round glasses + tie: the hero, use it whenever ONE Genius is meant),
//       v1 swept tuft + tie, v2 glasses + open collar + tuft, v3 open collar + honey hair, v4 glasses + open collar +
//       dark hair. Same species: one build, the same clothes, only these small things differ.
//     pose: a GeniusPose (covidFolk's CovidPose + `pencil`) from GENIUS_POSES (or any covidFolk POSES pose).
//     fog: A.folkFog(Z) (FolkFog {rgb, amount}): the ORANGE cloth takes half the fog (it glows), the face all of it.
//     aura 0..1 (default 0): an extra faint orange haze behind him for a hero moment; the bloom usually suffices.
//     unitPx: cam.k in a WorldSvg (keeps the gouache grain in screen px). texture false: no per-figure filter.
//   Contact shadow: the kit's <AirShadow A X Z w={62} d={30} amt={0.8} /> at his feet (seated: at the chair).
//   Live SVG figures: ~8-12 per frame are cheap (one gouache filter each); for more, the crowd sprites.
//
// POSES (GENIUS_POSES; pure, frame-driven, seek-safe; dir 1 = facing screen right; frames at 23.976 fps)
//   stand(dir, frame, seed?)    three-quarter, a slow breath (~4.2 s), a small smile
//   front(frame, seed?)         facing us, breathing.   turnTo(yaw, frame, seed?): any yaw (0 front .. PI back)
//   walk(dir, frame, amount?)   planted feet: GENIUS_WALK_CYCLE = 24 frames per two steps (~1 s); move `at` by
//                               geniusWalkAdvance(scale) px per frame in dir. Walkers cross the frame (yaw ~0.9);
//                               never walk toward / away from the camera (the rig's feet move sideways).
//   stepOut(dir, t)             out of a rack door / a crowd: t 0..1 over STEP_OUT_FRAMES (44): three steps from a
//                               standstill in dir (t 0..0.8), then he turns three-quarter toward us (0.68..1, the
//                               trailing foot lifts and sets down beside the other). Move `at` by
//                               stepOutShift(dir, t) * scale px (signed, integrated from the rig's own stance ankle,
//                               so the planted foot stays put to ~3 units).
//   typeAtDesk(dir, frame, seed?)  seated on a chair, hands on the keys, tapping in bursts, a slow breath. `at` = the
//                               floor under his hips. The desk is W2's: GENIUS_DESK (units from `at`, facing right):
//                               seatH 84 (0.47 m), deskH 132 (0.74 m), keys [[64,-136],[70,-139]] (the hands land
//                               there exactly), knees reach x ~85 under the desk (desk front edge <= x 50, apron above
//                               y -112), eyes at ~[48, -228] (monitor centre ~[150..170, -215]); chair seat x -26..24,
//                               back at x -30. Mirror x for dir -1.
//   writeTick(dir, t, frame?)   the pencil comes up and draws a tick on a sheet beside him: t 0..0.3 raise,
//                               0.3..0.44 the short down stroke, 0.44..0.72 the long up stroke, 0.72..1 lowered a
//                               little + a nod. The sheet is the cut's, in the screen plane at GENIUS_TICK
//                               (p0 [72,-226] -> p1 [82,-213] -> p2 [106,-240], units from `at`, facing right).
//                               tickDrawn(dir, t) = the drawn polyline (units: at + p * scale); the anchors'
//                               pencilTip is exactly on it while drawing. Give it ~40-48 frames.
//   cheer(frame, amount, yaw?)  a small happy arms-up in a V with a bounce (18-frame loop) and the laugh face; ramp
//                               amount 0 -> 1 over 14+ frames (the wrists swing up on an arc around the shoulders,
//                               passing through arms-wide around amount 0.4-0.6).
//   + covidFolk's breathe, lerpPose, mirrorPose work on these poses (re-exported).
//
// ANCHORS: geniusAnchors(variant, pose, at, scale) -> world px: headC headR headTop mouth eyes chest shoulderL/R
//   wristL/R handL/R (grips) mittenL/R hip kneeL/R ankleL/R toeL/R heelL/R pencilTip (+ covidFolk's others).
//
// CROWDS (1,000-10,000 instances; all in SCREEN px inside <FolkCanvas draw /> (pandemicFolkPaint's, re-exported))
//   const reqs = useMemo(() => geniusCrowdReqs(), []);  const get = useGeniusSprites(reqs);
//   blitGenius(ctx, get, x, y, hPx, { variant, view, walkFrame, alpha, fog, shadow })  x, y = screen px of the
//     feet, hPx = the screen height of a Genius there (312 * scale * cam.k). It picks the LOD: the smallest baked size
//     >= hPx (GENIUS_CROWD_SIZES 24 / 48 / 96 px, drawn down, never up past 1.15x), and under ~15 px crossfades to the
//     DOT (dot only under 11 px). fog = { rgb, amount } (A.folkFog(Z)): applied at half strength (orange glows),
//     cached per sprite x fog step. shadow: a soft contact shadow under the feet (fades with the fog).
//   views: front | left | right (three-quarter) | back | walkLeft | walkRight (walkFrame 0..3: phase = frame /
//     GENIUS_WALK_CYCLE * 4) | cheer. Pass the instance's own seed % 5 as the variant (not clones).
//   drawGeniusDot(ctx, x, y, hPx, alpha?, fog?)   the dot LOD on its own.
//   Cost: geniusCrowdReqs() = 195 sprites, baked once per render process (~45 ms a pose build, ~10 s in all, under
//     delayRender); pass fewer views / sizes / variants to bake less. Drawing: the GeniusCrowd probe (2,010
//     instances, ~1,000 sprites near + ~1,000 dots far, every one fogged) measures ~30 ms per frame on this Mac.
// Probes: tenEarthsGeniusProbe.tsx (src/Root.TenEarthsGenius.tsx + src/entry.TenEarthsGenius.ts).
// ---------------------------------------------------------------------------
import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
// @ts-expect-error react-dom ships no types for its server entry here (nothing may be installed); typed below
import * as ReactDomServer from "react-dom/server";
import { PAINT, folkTexDefs, mixC, type Sprite } from "../kyle-pandemics/pandemicFolkPaint";
import { FU } from "../kyle-covid/covidFolkBody";
import { ACCENT, GENIUS_LOOKS, GENIUS_POSES, GENIUS_UNITS, GENIUS_VARIANTS, GENIUS_WALK_CYCLE, ORANGE_SHADE, buildGenius, type CShape, type GeniusAnchors, type GeniusPose, type P2 } from "./tenEarthsGeniusBody";

const renderToStaticMarkup = (ReactDomServer as { renderToStaticMarkup: (el: React.ReactElement) => string }).renderToStaticMarkup;

export {
  ACCENT,
  ACCENT_DEEP,
  GENIUS_DESK,
  GENIUS_FPS,
  GENIUS_HIP_SEATED,
  GENIUS_LOOKS,
  GENIUS_POSES,
  GENIUS_SKIN,
  GENIUS_TICK,
  GENIUS_UNITS,
  GENIUS_VARIANTS,
  GENIUS_WALK_CYCLE,
  ORANGE_SHADE,
  PENCIL_TIP,
  STEP_OUT_FRAMES,
  U,
  buildGenius,
  geniusInks,
  geniusScaleForPx,
  geniusWalkAdvance,
  stepOutShift,
  tickDrawn,
  type GeniusAnchors,
  type GeniusBuild,
  type GeniusLook,
  type GeniusPose,
} from "./tenEarthsGeniusBody";
export { breathe, lerpPose, mirrorPose } from "../kyle-covid/covidFolkBody";
export { blitFolk, FolkCanvas, type Sprite } from "../kyle-pandemics/pandemicFolkPaint";

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===================================================================================================================
// FOG AND THE WARM SHADE
// ===================================================================================================================
export type FolkFog = { rgb: [number, number, number] | string; amount: number };
const toHex = (c: number[]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const hexRgb = (h: string) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const fogHexOf = (f: FolkFog) => (typeof f.rgb === "string" ? f.rgb : toHex(f.rgb));
/** an ORANGE cloth colour (saturated, hue ~20-50 deg): takes half the fog and a warm crescent shadow */
const hsv = (h: string) => {
  const [r, g, b] = hexRgb(h).map((v) => v / 255);
  const mx = Math.max(r, g, b);
  const mn = Math.min(r, g, b);
  const d = mx - mn;
  let hue = 0;
  if (d > 1e-6) {
    if (mx === r) hue = 60 * (((g - b) / d) % 6);
    else if (mx === g) hue = 60 * ((b - r) / d + 2);
    else hue = 60 * ((r - g) / d + 4);
  }
  if (hue < 0) hue += 360;
  return { h: hue, s: mx > 0 ? d / mx : 0, v: mx };
};
const isOrange = (c: string) => {
  const o = hsv(c);
  return o.h >= 18 && o.h <= 52 && o.s >= 0.55 && o.v >= 0.35;
};
const isWarmLight = (c: string) => {
  const o = hsv(c);
  return o.h >= 15 && o.h <= 50 && o.s < 0.55 && o.v > 0.7;
};
/** the crescent shadow: orange cloth toward the deep orange; the cream face toward a warm tan; else the cast's */
export const geniusShade = (c: string) => (isOrange(c) ? mixC(c, ORANGE_SHADE, 0.4) : isWarmLight(c) ? mixC(c, "#C27E48", 0.32) : mixC(c, "#2C3433", 0.4));
const applyFog = (shapes: CShape[], fog: FolkFog | null | undefined): CShape[] => {
  if (!fog || fog.amount <= 0.001) return shapes;
  const to = fogHexOf(fog);
  const t = c01(fog.amount);
  return shapes.map((s) => {
    const k = isOrange(s.fill) || s.glow ? 0.5 * t : t;
    return { ...s, fill: mixC(s.fill, to, k), shadeFrom: s.fill } as CShape & { shadeFrom: string };
  });
};

// ===================================================================================================================
// THE PAINT (covidFolk's CovidPaint shape for shape, with the warm shade and the half fog of the orange)
// ===================================================================================================================
const TexCtx = createContext<{ shared: boolean }>({ shared: false });
/** one gouache texture filter over a tight group of Geniuses (texture={false} figures inside) */
export const GeniusLayer: React.FC<{ uid: string; px?: number; unitPx?: number; children?: React.ReactNode }> = ({ uid, px = 0.4, unitPx = 1, children }) => (
  <TexCtx.Provider value={{ shared: true }}>
    <defs>{folkTexDefs(uid, px, unitPx)}</defs>
    <g filter={`url(#${uid}tx)`}>{children}</g>
  </TexCtx.Provider>
);
const boxOf = (d: string): [number, number, number, number] => {
  const v = (d.match(/-?\d*\.?\d+(?:e-?\d+)?/g) ?? []).map(Number);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0; i + 1 < v.length; i += 2) {
    if (v[i] < x0) x0 = v[i];
    if (v[i] > x1) x1 = v[i];
    if (v[i + 1] < y0) y0 = v[i + 1];
    if (v[i + 1] > y1) y1 = v[i + 1];
  }
  return [x0, y0, x1, y1];
};
export const GeniusPaint: React.FC<{ shapes: CShape[]; at: P2; scale: number; uid: string; tone?: number; fog?: FolkFog | null; unitPx?: number; texture?: boolean }> = ({ shapes, at, scale: sc0, uid, tone = 1, fog = null, unitPx = 1, texture }) => {
  const ctx = useContext(TexCtx);
  const tex = texture ?? !ctx.shared;
  const scale = sc0 / FU;
  const S = applyFog(shapes, fog) as (CShape & { shadeFrom?: string })[];
  const pxf = (scale * unitPx * 512) / 860;
  const blurU = PAINT.shadeBlur / (scale * unitPx);
  // the shade is chosen by the shape's own (unfogged) colour, then fogged the same way
  const shadeOfS = (s: CShape & { shadeFrom?: string }) => {
    if (!s.shadeFrom || !fog) return geniusShade(s.fill);
    const k = isOrange(s.shadeFrom) ? 0.5 * c01(fog.amount) : c01(fog.amount);
    return mixC(geniusShade(s.shadeFrom), fogHexOf(fog), k);
  };
  const off = PAINT.shadeOff;
  const pad = off * 1.2 + blurU * 3 + 2;
  const blurs = Array.from(new Set(S.filter((s) => s.blur !== undefined).map((s) => Math.round((s.blur ?? 0) * 10) / 10)));
  const blurId = (b: number) => `${uid}gb${blurs.indexOf(Math.round(b * 10) / 10)}`;
  return (
    <g opacity={tone}>
      <defs>
        {tex ? folkTexDefs(uid, pxf, unitPx) : null}
        <filter id={`${uid}su`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU).toFixed(3)} />
        </filter>
        <filter id={`${uid}cu`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation={Math.max(0.01, blurU * 2.2).toFixed(3)} />
        </filter>
        {blurs.map((b, i) => (
          <filter key={i} id={`${uid}gb${i}`} x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur stdDeviation={Math.max(0.01, b * FU).toFixed(3)} />
          </filter>
        ))}
      </defs>
      <g filter={tex ? `url(#${uid}tx)` : undefined}>
        <g transform={`translate(${n3(at[0])} ${n3(at[1])}) scale(${n3(scale)})`}>
          {S.map((s, i) => {
            const op = s.op ?? 1;
            if (op <= 0.002) return null;
            const clipId = s.clip ? `${uid}c${i}` : undefined;
            const wrap = (el: React.ReactNode) =>
              clipId ? (
                <g key={i}>
                  <clipPath id={clipId}>
                    <path d={s.clip} />
                  </clipPath>
                  <g clipPath={`url(#${clipId})`}>{el}</g>
                </g>
              ) : (
                <g key={i}>{el}</g>
              );
            if (s.glow || s.blur !== undefined)
              return wrap(<path d={s.d} fill={s.fill} opacity={op} filter={s.blur !== undefined && s.blur > 0.05 ? `url(#${blurId(s.blur)})` : undefined} />);
            if (s.det !== undefined)
              return wrap(
                <path
                  d={s.d}
                  fill="none"
                  stroke={s.keep ? s.fill : mixC(s.fill, "#1E1611", 0.32)}
                  strokeWidth={(s.det * Math.max(0.45, Math.min(1.3, pxf))).toFixed(2)}
                  vectorEffect="non-scaling-stroke"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={s.op ?? 0.55}
                />,
              );
            if (s.cast) return wrap(<path d={s.d} fill={shadeOfS(s)} opacity={s.op ?? 0.8} filter={`url(#${uid}cu)`} />);
            const sh = s.sh ?? 1;
            if (sh <= 0) return wrap(<path d={s.d} fill={s.fill} opacity={op} />);
            const [bx0, by0, bx1, by1] = boxOf(s.d);
            const mx = bx0 - pad;
            const my = by0 - pad;
            const mw = bx1 - bx0 + 2 * pad;
            const mh = by1 - by0 + 2 * pad;
            const mid = `${uid}m${i}`;
            return wrap(
              <>
                <path d={s.d} fill={s.fill} opacity={op} />
                <mask id={mid} maskUnits="userSpaceOnUse" x={n3(mx)} y={n3(my)} width={n3(mw)} height={n3(mh)}>
                  <path d={s.d} fill="#fff" />
                  <path d={s.d} fill="#000" transform={`translate(${n3(-off * sh)} ${n3(-off * sh * 1.05)})`} filter={`url(#${uid}su)`} />
                </mask>
                <rect x={n3(mx)} y={n3(my)} width={n3(mw)} height={n3(mh)} mask={`url(#${mid})`} fill={shadeOfS(s)} opacity={op} />
              </>,
            );
          })}
        </g>
      </g>
    </g>
  );
};

// ===================================================================================================================
// THE GENIUS
// ===================================================================================================================
export type GeniusProps = {
  variant?: number;
  pose: GeniusPose;
  at: P2;
  scale: number;
  /** unique per figure per frame */
  uid: string;
  frame?: number;
  fog?: FolkFog;
  drain?: number;
  tone?: number;
  unitPx?: number;
  texture?: boolean;
  /** 0..1 a faint orange haze behind him (a hero moment; the medium's bloom usually suffices) */
  aura?: number;
};
export const Genius: React.FC<GeniusProps> = ({ variant = 0, pose, at, scale, uid, frame, fog, drain, tone, unitPx, texture, aura = 0 }) => {
  const b = buildGenius(variant, pose, { frame, drain });
  const a = c01(aura) * (1 - 0.5 * c01(fog?.amount ?? 0));
  const cx = at[0] + b.anchors.chest[0] * scale;
  const cy = at[1] + (b.anchors.chest[1] - 20) * scale;
  return (
    <g>
      {a > 0.005 ? (
        <g>
          <defs>
            <radialGradient id={`${uid}au`}>
              <stop offset="0" stopColor={ACCENT} stopOpacity={0.32 * a} />
              <stop offset="0.5" stopColor={ACCENT} stopOpacity={0.12 * a} />
              <stop offset="1" stopColor={ACCENT} stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={cx} cy={cy} rx={150 * scale} ry={230 * scale} fill={`url(#${uid}au)`} />
        </g>
      ) : null}
      <GeniusPaint shapes={b.shapes} at={at} scale={scale} uid={uid} tone={tone} fog={fog} unitPx={unitPx} texture={texture} />
    </g>
  );
};

/** the anchors in WORLD px of a Genius in a pose */
export const geniusAnchors = (variant: number, pose: GeniusPose, at: P2, scale: number): GeniusAnchors => {
  const a = buildGenius(variant, pose).anchors;
  const out = {} as Record<string, unknown>;
  for (const [key, v] of Object.entries(a)) {
    if (key === "mouthDir") out[key] = v;
    else if (key === "headR") out[key] = (v as number) * scale;
    else if (key === "eyes") out[key] = (v as P2[]).map((e) => [at[0] + e[0] * scale, at[1] + e[1] * scale]);
    else out[key] = [at[0] + (v as P2)[0] * scale, at[1] + (v as P2)[1] * scale];
  }
  return out as GeniusAnchors;
};

// ===================================================================================================================
// CROWD SPRITES (the gouache filter baked in, once per render tab) AND THE DOT LOD
// ===================================================================================================================
export type GeniusView = "front" | "left" | "right" | "back" | "walkLeft" | "walkRight" | "cheer";
export const GENIUS_VIEWS: GeniusView[] = ["front", "left", "right", "back", "walkLeft", "walkRight", "cheer"];
/** the baked heights (px of a Genius): blitGenius picks the smallest >= the screen height */
export const GENIUS_CROWD_SIZES = [24, 48, 96];
/** a sprite request (the shapes are built lazily, once per pose, while baking: building is ~45 ms a pose) */
export type GeniusSpriteReq = { key: string; variant: number; view: GeniusView; walkFrame: number; hPx: number; scale: number; wUnits: number; hUnits: number };
const crowdPose = (view: GeniusView, walkFrame: number): GeniusPose => {
  switch (view) {
    case "left":
      return GENIUS_POSES.stand(-1, 0);
    case "right":
      return GENIUS_POSES.stand(1, 0);
    case "back":
      return GENIUS_POSES.turnTo(Math.PI, 0);
    case "walkLeft":
      return GENIUS_POSES.walk(-1, ((walkFrame % 4) / 4 + 0.05) * GENIUS_WALK_CYCLE);
    case "walkRight":
      return GENIUS_POSES.walk(1, ((walkFrame % 4) / 4 + 0.05) * GENIUS_WALK_CYCLE);
    case "cheer":
      return GENIUS_POSES.cheer(9, 1);
    default:
      return GENIUS_POSES.front(0);
  }
};
export const geniusSpriteReq = (variant: number, view: GeniusView, hPx: number, walkFrame = 0): GeniusSpriteReq => {
  const v = ((Math.round(variant) % GENIUS_VARIANTS) + GENIUS_VARIANTS) % GENIUS_VARIANTS;
  const wf = view === "walkLeft" || view === "walkRight" ? ((walkFrame % 4) + 4) % 4 : 0;
  return { key: `ge|${v}|${view}|${wf}|${Math.round(hPx)}`, variant: v, view, walkFrame: wf, hPx, scale: hPx / GENIUS_UNITS, wUnits: 135, hUnits: 385 };
};
const SHAPES = new Map<string, CShape[]>();
const spriteShapes = (r: GeniusSpriteReq) => {
  const k = `${r.variant}|${r.view}|${r.walkFrame}`;
  let sh = SHAPES.get(k);
  if (!sh) {
    sh = buildGenius(r.variant, crowdPose(r.view, r.walkFrame)).shapes;
    SHAPES.set(k, sh);
  }
  return sh;
};
/** every sprite a crowd may ask for: views x variants x walk frames x sizes (memoise it: useMemo(..., [])) */
export const geniusCrowdReqs = (views: GeniusView[] = GENIUS_VIEWS, sizes: number[] = GENIUS_CROWD_SIZES, variants = GENIUS_VARIANTS): GeniusSpriteReq[] => {
  const out: GeniusSpriteReq[] = [];
  for (const hPx of sizes)
    for (let v = 0; v < variants; v++)
      for (const view of views) {
        const nwf = view === "walkLeft" || view === "walkRight" ? 4 : 1;
        for (let wf = 0; wf < nwf; wf++) out.push(geniusSpriteReq(v, view, hPx, wf));
      }
  return out;
};
const SPRITES = new Map<string, Sprite>();
const PENDING = new Map<string, Promise<Sprite>>();
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
};
const yieldTick = () => new Promise<void>((res) => setTimeout(res, 0));
const bakeNow = (r: GeniusSpriteReq): Promise<Sprite> => {
  const shapes = spriteShapes(r);
  const halfW = r.wUnits * r.scale;
  const pad = Math.ceil(10 + r.hPx * 0.05);
  const W = Math.ceil(halfW * 2 + pad * 2);
  const H = Math.ceil(r.hUnits * r.scale + pad * 2);
  const ax = W / 2;
  const ay = H - pad;
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <GeniusPaint shapes={shapes} at={[ax, ay]} scale={r.scale} uid={`gs${Math.abs(hashStr(r.key))}`} />
    </svg>,
  );
  return new Promise<Sprite>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d") as CanvasRenderingContext2D;
      ctx.drawImage(img, 0, 0);
      const sp: Sprite = { c, ax, ay, px: r.hPx, unitsPerPx: 1 / r.scale };
      SPRITES.set(r.key, sp);
      PENDING.delete(r.key);
      resolve(sp);
    };
    img.onerror = (e) => reject(e);
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
};
/** bake one sprite (cached by key; the build yields to the page first so a big batch never blocks it in one piece) */
const bake = (r: GeniusSpriteReq): Promise<Sprite> => {
  const hit = SPRITES.get(r.key);
  if (hit) return Promise.resolve(hit);
  const pend = PENDING.get(r.key);
  if (pend) return pend;
  const p = yieldTick().then(() => bakeNow(r));
  PENDING.set(r.key, p);
  return p;
};
/** bake the requested sprites once per render tab (delayRender until ready, one at a time) and return a lookup */
export const useGeniusSprites = (reqs: GeniusSpriteReq[]) => {
  const allReady = reqs.every((r) => SPRITES.has(r.key));
  const [handle] = useState(() => (allReady ? null : delayRender("baking genius sprites", { timeoutInMilliseconds: 240000 })));
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    if (handle === null) return;
    let alive = true;
    (async () => {
      for (const r of reqs) await bake(r);
    })().then(
      () => {
        if (alive) setTick((t) => t + 1);
        continueRender(handle);
      },
      () => continueRender(handle),
    );
    return () => {
      alive = false;
    };
  }, [handle, reqs]);
  return useMemo(() => (key: string) => SPRITES.get(key), []);
};

// ---- fogged copies of a sprite (cached by sprite x fog step; deterministic: the same inputs give the same pixels) ----
const FOGGED = new Map<string, HTMLCanvasElement>();
const qRgb = (f: FolkFog) => {
  const c = typeof f.rgb === "string" ? hexRgb(f.rgb) : f.rgb;
  return c.map((v) => Math.round(v / 6) * 6);
};
const fogged = (key: string, src: HTMLCanvasElement, fog: FolkFog | undefined, strength: number): HTMLCanvasElement => {
  const amt = Math.round(c01((fog?.amount ?? 0) * strength) * 32) / 32;
  if (!fog || amt <= 0) return src;
  const rgb = qRgb(fog);
  const k = `${key}|${amt}|${rgb.join(",")}`;
  const hit = FOGGED.get(k);
  if (hit) return hit;
  if (FOGGED.size > 6000) FOGGED.clear();
  const c = document.createElement("canvas");
  c.width = src.width;
  c.height = src.height;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  g.drawImage(src, 0, 0);
  g.globalCompositeOperation = "source-atop";
  g.fillStyle = `rgba(${rgb.join(",")},${amt})`;
  g.fillRect(0, 0, c.width, c.height);
  FOGGED.set(k, c);
  return c;
};

// ---- the dot LOD: a soft orange bean with a head bump (baked once, drawn down) -------------------------------------------
const DOT_PX = 40;
let DOT: { c: HTMLCanvasElement; ax: number; ay: number } | null = null;
const dotSprite = () => {
  if (DOT) return DOT;
  const W = 32;
  const H = 52;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const ax = W / 2;
  const ay = H - 4;
  const s = DOT_PX / 40;
  // the body: a bean from the feet to the shoulders, a little narrower at the foot
  g.fillStyle = ACCENT;
  g.beginPath();
  g.moveTo(ax - 6.2 * s, ay);
  g.bezierCurveTo(ax - 9.5 * s, ay - 10 * s, ax - 9.8 * s, ay - 22 * s, ax - 7 * s, ay - 27 * s);
  g.bezierCurveTo(ax - 4 * s, ay - 30.5 * s, ax + 4 * s, ay - 30.5 * s, ax + 7 * s, ay - 27 * s);
  g.bezierCurveTo(ax + 9.8 * s, ay - 22 * s, ax + 9.5 * s, ay - 10 * s, ax + 6.2 * s, ay);
  g.closePath();
  g.fill();
  // its soft shade toward the lower right
  const sh = g.createLinearGradient(ax - 8 * s, ay - 28 * s, ax + 9 * s, ay);
  sh.addColorStop(0, "rgba(168,90,8,0)");
  sh.addColorStop(0.55, "rgba(168,90,8,0.0)");
  sh.addColorStop(1, "rgba(168,90,8,0.55)");
  g.fillStyle = sh;
  g.globalCompositeOperation = "source-atop";
  g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = "source-over";
  // the head bump: the face's orange-cream with hair over its top
  g.fillStyle = "#FBDCB0";
  g.beginPath();
  g.arc(ax + 0.3 * s, ay - 34.5 * s, 5.4 * s, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#9A520E";
  g.beginPath();
  g.arc(ax + 0.3 * s, ay - 35.6 * s, 5.5 * s, Math.PI * 1.02, Math.PI * 1.98);
  g.fill();
  DOT = { c, ax, ay };
  return DOT;
};
/** the dot LOD at screen (x, y) = the feet, hPx tall */
export const drawGeniusDot = (ctx: CanvasRenderingContext2D, x: number, y: number, hPx: number, alpha = 1, fog?: FolkFog) => {
  if (alpha <= 0.003) return;
  const d = dotSprite();
  const src = fogged("dot", d.c, fog, 0.5);
  const f = hPx / DOT_PX;
  ctx.globalAlpha = alpha;
  ctx.drawImage(src, x - d.ax * f, y - d.ay * f, d.c.width * f, d.c.height * f);
  ctx.globalAlpha = 1;
};
// ---- the contact shadow for blits (a soft ellipse, baked once) ----
let SHADOW: HTMLCanvasElement | null = null;
const shadowSprite = () => {
  if (SHADOW) return SHADOW;
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 20;
  const g = c.getContext("2d") as CanvasRenderingContext2D;
  const gr = g.createRadialGradient(32, 10, 0, 32, 10, 32);
  gr.addColorStop(0, "rgba(34,24,15,0.55)");
  gr.addColorStop(0.6, "rgba(34,24,15,0.3)");
  gr.addColorStop(1, "rgba(34,24,15,0)");
  g.fillStyle = gr;
  g.save();
  g.scale(1, 10 / 32);
  g.beginPath();
  g.arc(32, 32, 32, 0, Math.PI * 2);
  g.fill();
  g.restore();
  SHADOW = c;
  return c;
};

export type BlitGeniusOpts = { variant?: number; view?: GeniusView; walkFrame?: number; alpha?: number; fog?: FolkFog; shadow?: boolean };
/** draw one crowd Genius at screen (x, y) = his feet, hPx tall on screen; picks the sprite size or the dot */
export const blitGenius = (ctx: CanvasRenderingContext2D, get: (key: string) => Sprite | undefined, x: number, y: number, hPx: number, o: BlitGeniusOpts = {}) => {
  const alpha = o.alpha ?? 1;
  if (alpha <= 0.003 || hPx <= 0.5) return;
  const fogAmt = c01(o.fog?.amount ?? 0);
  if (o.shadow) {
    const s = shadowSprite();
    const w = hPx * 0.42;
    ctx.globalAlpha = alpha * (1 - fogAmt);
    ctx.drawImage(s, x - w * 0.38, y - w * 0.12, w, w * (20 / 64));
    ctx.globalAlpha = 1;
  }
  const spriteA = sst(11, 15, hPx);
  const dotA = 1 - sst(13, 16, hPx);
  if (dotA > 0.003) drawGeniusDot(ctx, x, y, hPx, alpha * dotA, o.fog);
  if (spriteA <= 0.003) return;
  const view = o.view ?? "front";
  const v = ((Math.round(o.variant ?? 0) % GENIUS_VARIANTS) + GENIUS_VARIANTS) % GENIUS_VARIANTS;
  const wf = view === "walkLeft" || view === "walkRight" ? (((o.walkFrame ?? 0) % 4) + 4) % 4 : 0;
  const size = GENIUS_CROWD_SIZES.find((s) => s >= hPx / 1.15) ?? GENIUS_CROWD_SIZES[GENIUS_CROWD_SIZES.length - 1];
  const key = `ge|${v}|${view}|${wf}|${size}`;
  const sp = get(key);
  if (!sp) return;
  const src = fogged(key, sp.c, o.fog, 0.5);
  const f = hPx / sp.px;
  ctx.globalAlpha = alpha * spriteA;
  ctx.drawImage(src, x - sp.ax * f, y - sp.ay * f, sp.c.width * f, sp.c.height * f);
  ctx.globalAlpha = 1;
};
/** the look list (for sheets) */
export const geniusLookName = (v: number) => GENIUS_LOOKS[((v % GENIUS_VARIANTS) + GENIUS_VARIANTS) % GENIUS_VARIANTS].name;
