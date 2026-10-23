// ---------------------------------------------------------------------------
// covidFolk — THE MODERN CAST of the Kyle Harper clip "Why COVID was impossible to contain" (kyle-covid): present-day
// city people (2003-2020: metro commuters, office workers, passers-by) in the picture-book GOUACHE hand of the
// approved casts (pandemicFolk, romeFolk): flat matte shapes, no outline, ONE soft crescent shadow per part from the
// upper-left light, pandemicFolkPaint's gouache filter (grain, dry-brush mottling, hand-wobbly edges), a small round
// head on a pear body (~4.4 heads), dot eyes, a small nose, a blush dot, mitten hands, small feet; muted earthy local
// colours. People are NEVER orange: orange (#FFB000 / #D98A0C) is THE VIRUS (the clip's ORANGE RULE).
// Built on the texcoco rig with romeFolk's skeleton and proportions (a man ~312 units = 1.75 m), so it stands beside
// the Rome and pandemics figures as one hand. Geometry: covidFolkBody.ts. Contract for cut builders:
// <notes>/COVID_FOLK_READY.md.
//
// UNITS: rig units, feet at (0, 0), up is -y, a man ~312 to the top of the skull (scaleForPx(px) = px / 312);
// `at` = the feet in world px, `scale` = world px per unit (a depth camera: const { at, scale } = A.P.at(X, Z)).
// Draw inside the cut's svg (WorldSvg). unitPx = screen px per svg unit (WorldSvg: cam.k).
//
// KINDS (variant v; v0 is the hero look where there is one):
//   Carrier   THE COVID man (cuts 3, 21): a young man, muted red-brown BEANIE, oatmeal-cream PUFFER, slate trousers,
//             white sneakers, an umber BACKPACK. v0 warm skin (THE Carrier), v1 olive, v2 deep (same outfit).
//   Officer   THE SARS-1 man (cut 12): grey SUIT, white shirt, muted dark-teal TIE, dark shoes, short side-parted hair.
//             v0 (THE Officer), v1 older charcoal suit, v2 tan skin.
//   Commuter  v0 man, khaki parka + shoulder bag; v1 man, charcoal long coat + scarf, phone; v2 woman, oatmeal long
//             coat, long hair, boots, shoulder bag; v3 woman, dusty-teal puffer, bob, a paper coffee cup.
//   Elder     v0 man, flat cap, cardigan over a shirt, glasses; v1 woman, short white curls, red-brown coat, glasses,
//             handbag; v2 man, slate coat, oatmeal scarf.
//   Youth     hoodies + earbuds: v0 dusty-teal hoodie, phone; v1 oatmeal hoodie, curly hair; v2 girl, khaki hoodie,
//             ponytail, phone.
//   Parent    v0 woman (khaki puffer, ponytail, boots); v1 man (slate parka, stubble).   Child v0 (teal puffer, cream
//             bobble hat), v1 girl (red-brown puffer, bob).
//   Medic     a health worker: white protective coverall, hood up, face mask, teal-grey gloves, boot covers (v0 man,
//             v1 woman). Any figure takes a mask with inks={{ mask: "#F2EFE7" }}.
//   <CovidFigure kind variant pose at scale uid ... />  or  <Carrier .../> <Officer .../> <Commuter .../> <Elder .../>
//   <Youth .../> <Parent .../> <Child .../>. Props:
//     pose: CovidPose       a texcoco FigPose + the cast's fields (look, open, worry, sit/seatH, handTo, hunch)
//     grip?: { L?, R? }     world points the hand grips land on (a pole, a strap): the arms are solved to them
//     infected?: 0..1       THE INFECTION: LIGHT from inside the chest (glowStyle "v3", the default): two lungs in the
//                           classic silhouette (inner edge concave toward the heart, a dark gap at the sternum), each a
//                           bright core falling off to a nearly transparent edge, a soft halo into the cloth, a faint
//                           luminous windpipe rising into the neck and splitting into the bronchi (the lungs-icon Y),
//                           tiny brighter specks inside; the straps / scarf crossing the chest lit from behind; the far
//                           lobe narrows as he turns, visible to yaw ~1. At crowd size (~150 px) a warm chest glow.
//                           glowStyle?: "v3" | "v2" (round 2) | "v1" (the first): v1 / v2 for comparison sheets only.
//     breathOut?: 0..1      a soft cone of tiny orange specks leaving the mouth, drifting with the air a figure-width
//                           or two, thinning (drawn after the figure, outside its paint). breathTarget?: a world point
//                           the specks steer to (a neighbour's mouth); breathReach?, breathSeed?
//     sick?: 0..1           VISIBLY ILL (separate from infected): skin paled toward grey-green, a feverish flush,
//                           droopy half-closed lids, worried brows (never a frown), a sweat drop, the shoulders hunched
//     frame?                the cut's frame: drives the lung specks, the breath specks, the ponytail
//     fog?: { rgb, amount } sink into the medium (A.folkFog(Z)); orange takes half the fog (it glows)
//     drain?, inks?, hold?: { L?, R?: "phone" | "cup" | "handbag" | "none" }, carry?: "backpack" | "shoulderBag" |
//     "none", tone?, unitPx?, texture? (false = no per-figure gouache filter)
//   POSES (pure; dir 1 = facing screen right; L = the arm on screen left facing us = the NEAR arm facing right):
//     front() stand(dir) turnTo(yaw) back() walk(dir, phase, amount) standHold(dir, "pole" | "strap", "near" | "far")
//     sit(dir, seatH?) chat(base, frame, toward, gesture?, seed?) nod(base, t) wave(dir, frame, amount)
//     leanAway(base, t, away, "auto" | "none")
//     cough(base, t, n?, "fist" | "elbow") coughLoop(base, frame, period?, how?) sicken(dir, t, seatH?)
//     slump(dir, frame, seatH?)  + breathe(q, frame), walkPose, lerpPose, mirrorPose, idle (texcoco)
//     walk: phase = frames / WALK_CYCLE (30), advance the feet walkAdvance(scale) px per frame (planted feet).
//     sit: the hips on a seat seatH units high (SEAT.h = 82 = a 46 cm bench), the feet forward seatFootX(kind, v)
//       units (on the floor, or dangling for a child): stand the figure's `at` UNDER ITS HIPS (the seat's front edge
//       + ~10 units).  sicken(dir, t): t 0..0.45 standing hold -> doubled over, 0.45..1 sinks back onto the seat behind:
//       the feet stay planted if `at` moves back sickenBack(t, kind, v) units against dir.  sitDown(dir, t) + sitBack.
//     standHold: the near wrist at HOLD.pole (a vertical pole HOLD.poleDX = 61 units in front of the feet, same depth)
//       or HOLD.strap (overhead); pass grip for an exact hand on a world point.
//     laugh(base, frame, amount): a real LAUGH (the `laugh` field 0..1: a wide open smile with the corners up and a
//       tongue, the eyes squeezed into happy arcs, the cheeks lifted; the head tipped back with a soft bounce); it
//       crossfades from `open` / the smile line, so it can be ramped in.
//     Expression fields: laugh 0..1, look [x, y] (the pupils, -1..1), open 0..1 (talk, cough), worry 0..1 (inner brow ends up),
//       lids 0..1, mouth >= 0.15 (a small smile), hunch 0..1,
//       handTo { L?|R?: { to: mouth|elbowMouth|chest|forehead|lap|knee, amt (used as given: ease it) } }.
//   ANCHORS: covidAnchors(kind, pose, at, scale, { variant, grip }) -> world px: headC headR headTop mouth mouthDir
//     eyes lungL lungR chest shoulderL/R wristL/R handL/R (grips) mittenL/R hip kneeL/R ankleL/R toeL/R heelL/R hemL/R.
//   BREATH: breathSpecks({ mouth, dir, scale, frame, amount | amountAt(birthFrame), target?, reach?, ... }) -> specks
//     in WORLD px (steer them to a neighbour with target); <BreathSpecks specks uid fog? /> draws them.
//   CROWDS (cut 39: hundreds from a high camera; cut 21: background passers-by): sprites with the gouache filter baked
//     in, once per render tab. covidCrowdSpriteReq(kind, view, state, seed, hPx, walkFrame?) -> CovidSpriteReq;
//     view: front | back | left | right (three-quarter) | walkLeft | walkRight (walkFrame 0..3) ; state: well |
//     infected-lo | infected | infected-hi (the chest glow baked in at 0.35 / 0.6 / 1) | sick (pale, hunched, a hand at
//     the mouth) | sick-sit (pale, slumped on a low seat). hPx = the px height of a MAN (a child comes out smaller).
//     useCovidSprites(reqs) -> lookup(key); blitFolk(ctx, sprite, x, y, hPx, { alpha, rot, pivot, sx, sy }) inside
//     <FolkCanvas draw /> (pandemicFolkPaint's, re-exported).
//   <CovidContactShadow at scale w? amount? uid /> for flat sheets; in a perspective use the kit's AirShadow.
// Probes: covidFolkProbe.tsx (src/Root.CovidFolk.tsx, src/entry.CovidFolk.ts).
// ---------------------------------------------------------------------------
import React, { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
// @ts-expect-error react-dom ships no types for its server entry here (nothing may be installed); typed below
import * as ReactDomServer from "react-dom/server";
import { hash } from "../kits/maps/incaShared";
import { PAINT, folkTexDefs, mixC, type Sprite } from "../kyle-pandemics/pandemicFolkPaint";
import {
  COVID_VARIANTS,
  FU,
  POSES,
  SEAT,
  buildCovidFolk,
  covidGripTo,
  lerpPose,
  lookOf,
  mirrorPose,
  type BuildOpts,
  type CShape,
  type Carry,
  type CovidAnchors,
  type CovidInks,
  type CovidKind,
  type CovidPose,
  type HandProp,
  type P2,
} from "./covidFolkBody";

const renderToStaticMarkup = (ReactDomServer as { renderToStaticMarkup: (el: React.ReactElement) => string }).renderToStaticMarkup;

export {
  COVID_KINDS,
  COVID_VARIANTS,
  FU,
  HEAD_R,
  HOLD,
  MAN,
  POSES,
  SEAT,
  SKIN,
  HAIR,
  WALK_CYCLE,
  breathe,
  buildCovidFolk,
  covidGripTo,
  covidRig,
  covidSpec,
  isFemale,
  lerpPose,
  lookOf,
  mirrorPose,
  rigPose,
  seatFootX,
  sickenBack,
  sitBack,
  sitDown,
  standAt,
  walkAdvance,
  walkPose,
} from "./covidFolkBody";
export type { BuildOpts, CShape, Carry, CovidAnchors, CovidInks, CovidKind, CovidPose, HairKind, HandProp, HandTarget, HandTo, P2 } from "./covidFolkBody";
export { idle } from "../kits/maps/texcocoShared";
export { blitFolk, FolkCanvas, type Sprite } from "../kyle-pandemics/pandemicFolkPaint";

/** the clip's sequence rate */
export const FPS = 30000 / 1001;
export const ORANGE = "#FFB000";
export const ORANGE_DEEP = "#D98A0C";
export const ORANGE_HOT = "#FFE7A8";
export const DEAD = "#8A7B62";
/** palette A's shadow colour (contact shadows in the air) */
export const AIR_SHADOW = "#22180F";
/** a man's height in rig units (soles to the top of the skull) */
export const MAN_UNITS = 312;
export const scaleForPx = (px: number) => px / MAN_UNITS;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const n3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// ===================================================================================================================
// FOG
// ===================================================================================================================
export type FolkFog = { rgb: [number, number, number] | string; amount: number };
const rgbHex = (c: [number, number, number]) => `#${c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const fogHexOf = (f: FolkFog) => (typeof f.rgb === "string" ? f.rgb : rgbHex(f.rgb));
const applyFog = (shapes: CShape[], fog: FolkFog | null | undefined): CShape[] => {
  if (!fog || fog.amount <= 0.001) return shapes;
  const to = fogHexOf(fog);
  const t = c01(fog.amount);
  // orange is the one glowing material: it takes half the fog
  return shapes.map((s) => {
    const k = s.glow ? 0.5 * t : t;
    return { ...s, fill: mixC(s.fill, to, k), grad: s.grad ? { ...s.grad, stops: s.grad.stops.map(([o, c, a]) => [o, mixC(c, to, k), a] as [number, string, number]) } : undefined };
  });
};

// ===================================================================================================================
// THE PAINT: romeFolk's Paint (pandemicFolkPaint's FolkPaint shape for shape, each crescent's mask on the shape's own
// box), plus soft-blurred GLOW shapes (the infection) on per-figure blur filters
// ===================================================================================================================
/** the crescent shadow (romeFolk's FOLK_SHADE: a little stronger than PAINT's default) */
export const FOLK_SHADE = { amt: 0.4, to: "#2C3433" };
const TexCtx = createContext<{ shared: boolean }>({ shared: false });
/** one gouache texture filter over a group of figures (romeFolk's RomeFolkLayer): only for a tight cluster */
export const CovidFolkLayer: React.FC<{ uid: string; px?: number; unitPx?: number; children?: React.ReactNode }> = ({ uid, px = 0.4, unitPx = 1, children }) => (
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
export const CovidPaint: React.FC<{ shapes: CShape[]; at: P2; scale: number; uid: string; tone?: number; fog?: FolkFog | null; unitPx?: number; texture?: boolean }> = ({ shapes, at, scale: sc0, uid, tone = 1, fog = null, unitPx = 1, texture }) => {
  const ctx = useContext(TexCtx);
  const tex = texture ?? !ctx.shared;
  const scale = sc0 / FU;
  const S = applyFog(shapes, fog);
  const pxf = (scale * unitPx * 512) / 860;
  const blurU = PAINT.shadeBlur / (scale * unitPx);
  const shade = (c: string) => mixC(c, FOLK_SHADE.to, FOLK_SHADE.amt);
  const off = PAINT.shadeOff;
  const pad = off * 1.2 + blurU * 3 + 2;
  // the glow blurs (rig units -> folk units), one filter per distinct radius
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
            if (s.glow || s.blur !== undefined) {
              const gid = s.grad ? `${uid}rg${i}` : undefined;
              return wrap(
                <>
                  {s.grad ? (
                    <defs>
                      <radialGradient id={gid} cx={s.grad.cx ?? 0.5} cy={s.grad.cy ?? 0.5} r={s.grad.r ?? 0.5}>
                        {s.grad.stops.map(([o, c, a], j) => (
                          <stop key={j} offset={o} stopColor={c} stopOpacity={a} />
                        ))}
                      </radialGradient>
                    </defs>
                  ) : null}
                  <path d={s.d} fill={gid ? `url(#${gid})` : s.fill} opacity={op} filter={s.blur !== undefined && s.blur > 0.05 ? `url(#${blurId(s.blur)})` : undefined} style={s.blend === "screen" ? { mixBlendMode: "screen" } : undefined} />
                </>,
              );
            }
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
            if (s.cast) return wrap(<path d={s.d} fill={shade(s.fill)} opacity={s.op ?? 0.8} filter={`url(#${uid}cu)`} />);
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
                <rect x={n3(mx)} y={n3(my)} width={n3(mw)} height={n3(mh)} mask={`url(#${mid})`} fill={shade(s.fill)} opacity={op} />
              </>,
            );
          })}
        </g>
      </g>
    </g>
  );
};

// ===================================================================================================================
// THE BREATH: a soft cone of tiny orange specks leaving the mouth (a pure function of the frame, in WORLD px)
// ===================================================================================================================
export type Speck = { p: P2; r: number; a: number };
export type BreathOpts = {
  /** the mouth (world px) and the way the breath leaves it (a unit vector: covidAnchors(...).mouthDir) */
  mouth: P2;
  dir: P2;
  /** the figure's scale (world px per rig unit): speck sizes and travel are in the figure's units */
  scale: number;
  frame: number;
  /** 0..1 now, or as a function of the frame a speck was born (so a cone thins out instead of vanishing) */
  amount?: number;
  amountAt?: (birthFrame: number) => number;
  /** rig units a speck travels (default 170: a figure-width or two); its life in frames (default 60) */
  reach?: number;
  life?: number;
  /** specks born per frame (default 1.3) and the cone's half-angle (rad, default 0.3) */
  rate?: number;
  spread?: number;
  /** a world point the specks steer to (a neighbour's mouth / nose); steer 0..1 (default 1 with a target) */
  target?: P2;
  steer?: number;
  seed?: number;
  /** breathing out in puffs (~3.4 s, the exhale half thicker) */
  puffs?: boolean;
};
export const breathSpecks = (o: BreathOpts): Speck[] => {
  const rate = o.rate ?? 1.3;
  const life = o.life ?? 60;
  const reach = (o.reach ?? 170) * o.scale;
  const spread = o.spread ?? 0.3;
  const seed = o.seed ?? 0;
  const amtAt = o.amountAt ?? (() => o.amount ?? 1);
  const puffs = o.puffs ?? true;
  const d0 = o.dir;
  const nrm: P2 = [-d0[1], d0[0]];
  const out: Speck[] = [];
  const i0 = Math.floor((o.frame - life) * rate);
  const i1 = Math.floor(o.frame * rate);
  const T = o.target;
  const steer = T ? (o.steer ?? 1) : 0;
  const tLen = T ? Math.hypot(T[0] - o.mouth[0], T[1] - o.mouth[1]) : 0;
  for (let i = i0; i <= i1; i++) {
    const birth = i / rate;
    const age = o.frame - birth;
    if (age < 0 || age > life) continue;
    const h1 = hash(i + 7.3, 31 + seed);
    const h2 = hash(i + 1.9, 47 + seed);
    const h3 = hash(i + 4.1, 59 + seed);
    const amt = c01(amtAt(birth));
    if (amt <= 0.003) continue;
    // the exhale rhythm: more specks on the out-breath
    const puff = puffs ? 0.3 + 0.7 * Math.max(0, Math.sin((birth / (3.4 * 29.97)) * 2 * Math.PI + seed)) ** 0.6 : 1;
    if (h3 > 0.25 + 0.75 * puff) continue;
    const u = age / life;
    const s = reach * (0.82 + 0.36 * h2) * (1 - (1 - u) ** 1.7);
    const th = spread * (2 * h1 - 1) * (0.55 + 0.45 * u);
    // free drift: along the cone, a slow rise and a sway with the air
    const sway = 6 * o.scale * Math.sin(age * 0.05 + h1 * 6.28) * u;
    const free: P2 = [o.mouth[0] + d0[0] * s * Math.cos(th) + nrm[0] * s * Math.sin(th) + sway * nrm[0], o.mouth[1] + d0[1] * s * Math.cos(th) + nrm[1] * s * Math.sin(th) - 8 * o.scale * u * u + sway * nrm[1]];
    let p = free;
    if (T && steer > 0) {
      // along a curve from the mouth to the target: out along dir, then onto the target (the cone narrows onto it)
      const v = Math.min(1, (s / Math.max(1, tLen)) * 1.05);
      const C: P2 = [o.mouth[0] + d0[0] * tLen * 0.45, o.mouth[1] + d0[1] * tLen * 0.45];
      const bz: P2 = [(1 - v) * (1 - v) * o.mouth[0] + 2 * (1 - v) * v * C[0] + v * v * T[0], (1 - v) * (1 - v) * o.mouth[1] + 2 * (1 - v) * v * C[1] + v * v * T[1]];
      const lat = s * Math.sin(th) * (1 - v) * 0.9;
      const path: P2 = [bz[0] + nrm[0] * lat + sway * nrm[0] * (1 - v), bz[1] + nrm[1] * lat + sway * nrm[1] * (1 - v)];
      const w = steer * sst(0, 0.35, u);
      p = [free[0] + (path[0] - free[0]) * w, free[1] + (path[1] - free[1]) * w];
    }
    const r = Math.max(0.9, (1.0 + 1.1 * h2) * o.scale * (1 - 0.3 * u));
    const a = amt * sst(0, 0.06, u) * (1 - u) ** 0.9 * (0.65 + 0.35 * h1);
    if (a > 0.01) out.push({ p, r, a });
  }
  return out;
};
/** draw specks (world px) as soft glowing orange dots */
export const BreathSpecks: React.FC<{ specks: Speck[]; uid: string; fog?: FolkFog | null }> = ({ specks, uid, fog }) => {
  const f = fog ? 0.5 * c01(fog.amount) : 0;
  const halo = f > 0 ? mixC(ORANGE, fogHexOf(fog as FolkFog), f) : ORANGE;
  const core = f > 0 ? mixC("#FFD27A", fogHexOf(fog as FolkFog), f) : "#FFD27A";
  return (
    <g>
      <defs>
        <radialGradient id={`${uid}bs`}>
          <stop offset="0" stopColor={halo} stopOpacity={0.55} />
          <stop offset="1" stopColor={halo} stopOpacity={0} />
        </radialGradient>
      </defs>
      {specks.map((s, i) => (
        <g key={i} opacity={n3(s.a)}>
          <circle cx={n3(s.p[0])} cy={n3(s.p[1])} r={n3(s.r * 2.6)} fill={`url(#${uid}bs)`} />
          <circle cx={n3(s.p[0])} cy={n3(s.p[1])} r={n3(s.r)} fill={core} />
        </g>
      ))}
    </g>
  );
};

// ===================================================================================================================
// THE CAST MEMBER
// ===================================================================================================================
export type CovidFigureProps = {
  kind: CovidKind;
  pose: CovidPose;
  at: P2;
  scale: number;
  /** unique per figure per frame */
  uid: string;
  variant?: number;
  grip?: { L?: P2; R?: P2 };
  infected?: number;
  sick?: number;
  breathOut?: number;
  breathTarget?: P2;
  breathReach?: number;
  breathSeed?: number;
  /** the breath's amount by the frame a speck was born (overrides breathOut for the specks) */
  breathAmountAt?: (birthFrame: number) => number;
  frame?: number;
  fog?: FolkFog;
  drain?: number;
  inks?: Partial<CovidInks>;
  hold?: { L?: HandProp; R?: HandProp };
  carry?: Carry;
  /** "v3" (default: light with a windpipe) | "v2" (round 2) | "v1" (the first glow): v1 / v2 for comparisons only */
  glowStyle?: "v1" | "v2" | "v3";
  tone?: number;
  unitPx?: number;
  texture?: boolean;
};
const buildFor = (p: CovidFigureProps) => {
  const variant = p.variant ?? 0;
  const q = p.grip ? covidGripTo(p.kind, variant, p.pose, p.grip, p.at, p.scale) : p.pose;
  const o: BuildOpts = { inks: p.inks, hold: p.hold, carry: p.carry, infected: p.infected, sick: p.sick, drain: p.drain, frame: p.frame, glowStyle: p.glowStyle };
  return buildCovidFolk(p.kind, variant, q, o);
};
export const CovidFigure: React.FC<CovidFigureProps> = (p) => {
  const b = buildFor(p);
  const bo = c01(p.breathOut ?? 0);
  const w = (v: P2): P2 => [p.at[0] + v[0] * p.scale, p.at[1] + v[1] * p.scale];
  const specks =
    bo > 0.002 || p.breathAmountAt
      ? breathSpecks({ mouth: w(b.anchors.mouth), dir: b.anchors.mouthDir, scale: p.scale, frame: p.frame ?? 0, amount: bo, amountAt: p.breathAmountAt, target: p.breathTarget, reach: p.breathReach, seed: p.breathSeed })
      : [];
  return (
    <g>
      <CovidPaint shapes={b.shapes} at={p.at} scale={p.scale} uid={p.uid} tone={p.tone} fog={p.fog} unitPx={p.unitPx} texture={p.texture} />
      {specks.length ? <BreathSpecks specks={specks} uid={`${p.uid}br`} fog={p.fog} /> : null}
    </g>
  );
};
type CastProps = Omit<CovidFigureProps, "kind" | "uid"> & { uid?: string };
/** THE COVID man (cuts 3, 21): beanie, oatmeal puffer, slate trousers, white sneakers, backpack */
export const Carrier: React.FC<CastProps> = ({ uid = "car", ...p }) => <CovidFigure kind="carrier" uid={uid} {...p} />;
/** THE SARS-1 man (cut 12): grey suit, white shirt, dark-teal tie */
export const Officer: React.FC<CastProps> = ({ uid = "off", ...p }) => <CovidFigure kind="officer" uid={uid} {...p} />;
export const Commuter: React.FC<CastProps> = ({ uid = "com", ...p }) => <CovidFigure kind="commuter" uid={uid} {...p} />;
export const Elder: React.FC<CastProps> = ({ uid = "eld", ...p }) => <CovidFigure kind="elder" uid={uid} {...p} />;
export const Youth: React.FC<CastProps> = ({ uid = "yth", ...p }) => <CovidFigure kind="youth" uid={uid} {...p} />;
export const Parent: React.FC<CastProps> = ({ uid = "par", ...p }) => <CovidFigure kind="parent" uid={uid} {...p} />;
export const Child: React.FC<CastProps> = ({ uid = "chd", ...p }) => <CovidFigure kind="child" uid={uid} {...p} />;

/** the anchors in WORLD px of a cast member in a pose (pass the same variant / grip the figure gets) */
export const covidAnchors = (kind: CovidKind, pose: CovidPose, at: P2, scale: number, opts: { variant?: number; grip?: { L?: P2; R?: P2 } } = {}): CovidAnchors => {
  const variant = opts.variant ?? 0;
  const q = opts.grip ? covidGripTo(kind, variant, pose, opts.grip, at, scale) : pose;
  const a = buildCovidFolk(kind, variant, q, {}).anchors;
  const out = {} as Record<string, unknown>;
  for (const [key, v] of Object.entries(a)) {
    if (key === "mouthDir") out[key] = v;
    else if (key === "headR") out[key] = (v as number) * scale;
    else if (key === "eyes") out[key] = (v as P2[]).map((e) => [at[0] + e[0] * scale, at[1] + e[1] * scale]);
    else out[key] = [at[0] + (v as P2)[0] * scale, at[1] + (v as P2)[1] * scale];
  }
  return out as CovidAnchors;
};

/** a soft contact shadow under a figure on a flat sheet, in the air's shadow colour */
export const CovidContactShadow: React.FC<{ at: P2; scale: number; w?: number; amount?: number; uid: string; color?: string }> = ({ at, scale, w = 62, amount = 1, uid, color = AIR_SHADOW }) => (
  <g>
    <defs>
      <radialGradient id={`${uid}cs`}>
        <stop offset="0" stopColor={color} stopOpacity={0.7 * amount} />
        <stop offset="0.55" stopColor={color} stopOpacity={0.4 * amount} />
        <stop offset="1" stopColor={color} stopOpacity={0} />
      </radialGradient>
    </defs>
    <ellipse cx={at[0] + 8 * scale} cy={at[1] + 1 * scale} rx={w * scale} ry={w * 0.16 * scale} fill={`url(#${uid}cs)`} />
  </g>
);

// ===================================================================================================================
// CROWD SPRITES (pandemicFolkPaint's baking, with this cast's paint: the glow baked in)
// ===================================================================================================================
export type CrowdView = "front" | "back" | "left" | "right" | "walkLeft" | "walkRight";
export type CrowdState = "well" | "infected-lo" | "infected" | "infected-hi" | "sick" | "sick-sit";
export const CROWD_VIEWS: CrowdView[] = ["front", "back", "left", "right", "walkLeft", "walkRight"];
export const CROWD_STATES: CrowdState[] = ["well", "infected-lo", "infected", "infected-hi", "sick", "sick-sit"];
export type CovidSpriteReq = { key: string; shapes: CShape[]; hPx: number; scale: number; wUnits: number; hUnits: number };
/** the pose of a crowd sprite (a little variety by seed) */
export const crowdPose = (kind: CovidKind, view: CrowdView, state: CrowdState, seed: number, walkFrame = 0): CovidPose => {
  const h = (k: number) => hash(seed + 0.37 * k, 913);
  let q: CovidPose;
  if (state === "sick-sit") q = { ...POSES.slump(view === "left" || view === "walkLeft" ? -1 : 1, seed * 7, 46), yaw: view === "front" || view === "back" ? 0.35 * (h(1) > 0.5 ? 1 : -1) : view === "left" || view === "walkLeft" ? -0.8 : 0.8 };
  else if (view === "walkLeft" || view === "walkRight") q = POSES.walk(view === "walkLeft" ? -1 : 1, (walkFrame % 4) / 4 + 0.05, 1);
  else if (view === "left" || view === "right") q = POSES.stand(view === "left" ? -1 : 1);
  else if (view === "back") {
    const f = POSES.back();
    q = { ...f, headYaw: Math.PI + 0.2 * (h(2) - 0.5) };
  } else q = { ...POSES.front(), headYaw: 0.25 * (h(3) - 0.5), yaw: 0.12 * (h(4) - 0.5) };
  if (state === "sick" && view !== "back") q = POSES.cough(q, 0.5, 3);
  if (state === "sick") q = { ...q, hunch: 0.8, pitch: q.pitch + 10, worry: 1 };
  return { ...q, roll: q.roll + 3 * (h(5) - 0.5) };
};
const STATE_OPTS: Record<CrowdState, BuildOpts> = {
  well: {},
  "infected-lo": { infected: 0.35 },
  infected: { infected: 0.6 },
  "infected-hi": { infected: 1 },
  sick: { infected: 0.8, sick: 1 },
  "sick-sit": { infected: 0.8, sick: 1 },
};
/** a crowd sprite request: kind, view, state, seed (picks the variant and a little pose variety), hPx = the px
 *  height of a MAN at this size (kinds keep their relative heights), walkFrame 0..3 for the walking views */
export const covidCrowdSpriteReq = (kind: CovidKind, view: CrowdView, state: CrowdState, seed: number, hPx: number, walkFrame = 0): CovidSpriteReq => {
  const nv = COVID_VARIANTS[kind];
  const variant = ((Math.floor(seed) % nv) + nv) % nv;
  const wf = view === "walkLeft" || view === "walkRight" ? ((walkFrame % 4) + 4) % 4 : 0;
  const q = crowdPose(kind, view, state, Math.floor(seed / nv), wf);
  const b = buildCovidFolk(kind, variant, q, { ...STATE_OPTS[state], frame: 20 + (seed % 7) * 9 });
  const scale = hPx / MAN_UNITS;
  return { key: `cv|${kind}|${variant}|${view}|${state}|${wf}|${Math.floor(seed / nv) % 4}|${Math.round(hPx)}`, shapes: b.shapes, hPx, scale, wUnits: 135, hUnits: Math.max(MAN_UNITS * 1.12, b.heightUnits + 20) };
};
const SPRITES = new Map<string, Sprite>();
const PENDING = new Map<string, Promise<Sprite>>();
const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
};
const bake = (r: CovidSpriteReq): Promise<Sprite> => {
  const hit = SPRITES.get(r.key);
  if (hit) return Promise.resolve(hit);
  const pend = PENDING.get(r.key);
  if (pend) return pend;
  const halfW = r.wUnits * r.scale;
  const pad = Math.ceil(10 + r.hPx * 0.05);
  const W = Math.ceil(halfW * 2 + pad * 2);
  const H = Math.ceil(r.hUnits * r.scale + pad * 2);
  const ax = W / 2;
  const ay = H - pad;
  const svg = renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <CovidPaint shapes={r.shapes} at={[ax, ay]} scale={r.scale} uid={`cs${Math.abs(hashStr(r.key))}`} />
    </svg>,
  );
  const p = new Promise<Sprite>((resolve, reject) => {
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
  PENDING.set(r.key, p);
  return p;
};
/** bake the requested sprites once per render tab and return a lookup by key; `reqs` must be stable (useMemo) */
export const useCovidSprites = (reqs: CovidSpriteReq[]) => {
  const allReady = reqs.every((r) => SPRITES.has(r.key));
  const [handle] = useState(() => (allReady ? null : delayRender("baking covid folk sprites", { timeoutInMilliseconds: 180000 })));
  const [, setTick] = useState(0);
  useLayoutEffect(() => {
    if (handle === null) return;
    let alive = true;
    Promise.all(reqs.map(bake)).then(
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

// small helpers the cuts use
/** a pose blended toward another over t with a smooth ease (lerpPose eased) */
export const blendPose = (a: CovidPose, b: CovidPose, t: number) => lerpPose(a, b, sst(0, 1, t));
/** the facing direction of a pose (+1 = screen right) */
export const facingOf = (q: CovidPose): 1 | -1 => (Math.sin(q.yaw) >= 0 ? 1 : -1);
/** turn the head toward a world point (yaw only; the pupils follow by `look`) */
export const lookToward = (q: CovidPose, from: P2, to: P2, amount = 1): CovidPose => {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  const want = Math.max(-1.3, Math.min(1.3, Math.atan2(dx, Math.abs(dy) + Math.abs(dx) * 0.4 + 1e-6) * 1.2));
  return { ...q, headYaw: q.headYaw + (want - q.headYaw) * amount, look: [Math.max(-1, Math.min(1, dx / 300)) * amount, Math.max(-1, Math.min(1, dy / 300)) * amount] };
};
export const lookKind = (kind: CovidKind, variant = 0) => lookOf(kind, variant);
export const SEAT_DEFAULT = SEAT;
export const mirror = mirrorPose;
