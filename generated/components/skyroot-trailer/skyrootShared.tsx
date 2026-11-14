import React, { useId } from "react";
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from "remotion";
import {
  CAPTION_BANDS,
  CaptionBands,
  FPS,
  H,
  MIKKEL_FILTER,
  type MikkelCam,
  MikkelFilmLife,
  MikkelPaper,
  MikkelPlane,
  MikkelSvg,
  W,
  depthTransform,
  inCaptionBand,
} from "../mikkel-trailer/mikkelShared";
import {
  BLUE,
  CHAIN,
  CHAIN_STAGGER,
  CHAIN_TRAVEL,
  CROWN_STEP,
  ChainEcho,
  ChainPhotoCutOut,
  CutOut,
  EASE_LAND,
  INK,
  Inked,
  OP_FULL,
  OP_LOW,
  OP_MID,
  ORANGE,
  PAPER_BASE,
  PURPLE,
  PhotoCutOut,
  RiseText,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  ShadowText,
  Silhouette,
  camEase,
  chainProgress,
  clamp,
  filmWeave,
  fontFamily,
  runCamera2,
  textRise,
  type,
} from "../neal-stephenson-trailer/nealShared";
import { ISRO_LOGO, type LogoData, SKYROOT_LOGO } from "./skyrootLogos";

// ---------------------------------------------------------------------------
// SKYROOT TRAILER: the clip's shared module (Core Memory trailer, Ashlee Vance with Skyroot Aerospace: Pawan Kumar
// Chandana, CEO; Naga Bharath Daka, co-founder). 16:9, composed at 2048 x 1080, finals --scale 2 (4096 x 2160),
// 23.976 fps. Cut builders import this file and never edit it; additions go through the director.
//
// LEGEND (the approved Pushp / Mikkel ARCHIVE COLLAGE look)
//   * Ground: the Core Memory squared paper (cerroShared PaperGround via MikkelPaper, unrotated, brightness 0.88 blur
//     3 px, parallax 0.15, drift -0.3 px/frame). The paper is the sky. `SkyrootPaper` drives it from a SkyrootCam.
//   * Photos: every real thing is a BLACK-AND-WHITE photo cut-out lying on the paper, graded SKYROOT_FILTER (= the
//     Pushp / Mikkel grade: grayscale, sepia 0.14, a little contrast), with the Core Memory hard shadow: a pure black
//     silhouette at +SHADOW_OFF/+SHADOW_OFF world px (5 for big pieces), zero blur. Never a colour photo with graphics
//     pasted on. The cut-outs are greyscale already; the grade is applied at render.
//   * Drawn things / type: white INK on its hard black copy (Inked, ShadowText); Barlow 900 uppercase, labels only for
//     what the picture cannot identify. No glow, gradient, blend mode or outline.
//   * The CHAIN (orange #FFB765 back, purple #BC37FF, blue #0046FF, white core) means ONE thing in this clip:
//     SKYROOT'S OWN: the two founders and Skyroot's rockets (Vikram-1, the Skyroot mark). Never on ISRO's LVM3, the
//     ISRO mark or anyone else's thing. At most one chain moment per cut, on its payoff word; at rest a CROWN.
//     Photos: ChainPhotoCutOut / RocketCutOut `chain`; drawn shapes and the logo: ChainEcho with LogoPaths.
//   * Caption bands (screen y of 1080): 607-703 and 765-821. Nothing readable (type, faces, logos, the payoff) there
//     on any camera state. CaptionBands on = preview aid only.
//   * Film life over everything: SkyrootFilmLife (grain, gate weave, flicker, vignette; seed "skyroot"). Pass a GLOBAL
//     frame if two cuts ever join.
//
// ASSETS (public/skyroot-trailer/, baked by scripts/clips/skyroot-trailer/bake-cutouts.py from assets-src/skyroot-trailer/,
// themselves copies of the clip's animation_source/assets/; geometry also in public/skyroot-trailer/geometry.json)
//   vikram1.png     Skyroot's Vikram-1, the REAL flight vehicle on the First Launch Pad, SDSC-SHAR Sriharikota,
//                   July 2026 (pre-launch). Source vikram1_on_pad_FLP_sriharikota_2026-07_ISRO.jpg, ISRO, GODL-India
//                   (Commons "Skyroot's Vikram-I on the Launch Pad at SDSC SHAR"). Cut nose to the aft end of the
//                   blue first stage (the nozzle sits inside the launch pedestal, not in the photo); stood upright
//                   (the photo leans 0.3 deg); the umbilical arm is cut off (the hull behind it interpolated).
//   lvm3.png        ISRO's LVM3-M6 (BlueBird Block-2, Dec 2025) on the Second Launch Pad. Source
//                   lvm3_M6_bluebird_on_pad_2025-12_ISRO.jpg, ISRO, GODL-India (Commons "LVM3 M6 at pad"). Core +
//                   fairing + two S200 strap-ons, front-on, "ISRO" / "INDIA" livery as printed; service-tower arms
//                   and lightning masts are not in it. Cut flat at the core's aft shroud lip (the boosters' bottoms
//                   and the engines are behind the pad railing). Shot from below: a slight keystone (the right
//                   booster stands ~1 % wider at the base).
//   earth_india.png NASA DSCOVR EPIC natural colour full disc, 28 Mar 2024 07:20 UTC, India centred, north up (PD,
//                   NASA EPIC Team). Greyscale disc with alpha; EARTH has its centre, radius and Sriharikota's point.
//   logos           skyrootLogos.ts: ISRO logo (Commons, PD) and the current Skyroot Aerospace logo (skyroot.in,
//                   trademark) as inline SVG paths, drawn white through the fill (LogoMark / LogoPaths).
//   no factory.png  Neither factory photo (Infinity Campus aerial, Max-Q exterior) cuts out cleanly (ground, fences,
//                   frame edges): cut 38 draws white factory glyphs.
//
// EXPORTS
//   FPS, W, H, CAPTION_BANDS, inCaptionBand, CaptionBands, SKYROOT_FILTER
//   SkyrootCam (type), depthTransform, SkyrootPlane, SkyrootSvg, SkyrootPaper, SkyrootFilmLife
//   Rocket geometry: RocketGeom (type), VIKRAM1, LVM3, HEIGHT_M, VISIBLE_M, rocketBox, rocketPoint, RocketCutOut
//   EARTH, earthPoint; ISRO_LOGO, SKYROOT_LOGO, LogoData (type), LogoPaths, LogoMark, logoAspect
//   SkyrootProbe, SKYROOT_PROBE_DURATION
//   re-exported: PhotoCutOut, Silhouette, ChainPhotoCutOut, CutOut, chainProgress, filmWeave, ChainEcho, Inked,
//   ShadowText, RiseText, textRise, type, fontFamily, INK, SHADOW, SHADOW_OFF, STROKE, OP_FULL, OP_MID, OP_LOW,
//   ORANGE, PURPLE, BLUE, CHAIN, CROWN_STEP, CHAIN_STAGGER, CHAIN_TRAVEL, EASE_LAND, PAPER_BASE, runCamera2,
//   camEase, clamp
// ---------------------------------------------------------------------------

export { CAPTION_BANDS, CaptionBands, FPS, H, W, depthTransform, inCaptionBand };
export {
  BLUE,
  CHAIN,
  CHAIN_STAGGER,
  CHAIN_TRAVEL,
  CROWN_STEP,
  ChainEcho,
  ChainPhotoCutOut,
  CutOut,
  EASE_LAND,
  INK,
  Inked,
  OP_FULL,
  OP_LOW,
  OP_MID,
  ORANGE,
  PAPER_BASE,
  PURPLE,
  PhotoCutOut,
  RiseText,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  ShadowText,
  Silhouette,
  camEase,
  chainProgress,
  clamp,
  filmWeave,
  fontFamily,
  runCamera2,
  textRise,
  type,
};
export { ISRO_LOGO, SKYROOT_LOGO };
export type { LogoData };

/** The clip's photo grade (the Pushp / Mikkel grade). Photo nodes only, never the chain, the type or the logos. */
export const SKYROOT_FILTER = MIKKEL_FILTER;

// -- camera, planes, paper, film life (mikkelShared at 2048 x 1080) ----------------------------------------------------
/** A dolly camera: (x, y) = the focus-plane world point at the frame centre, k = its scale; (x0, y0) the rest camera. */
export type SkyrootCam = MikkelCam;
export const SkyrootPlane = MikkelPlane;
export const SkyrootSvg = MikkelSvg;
export const SkyrootPaper = MikkelPaper;
/** Old-film life over everything (MikkelFilmLife, seed "skyroot"): <SkyrootFilmLife frame={f}>{scene}</SkyrootFilmLife>. */
export const SkyrootFilmLife: React.FC<React.ComponentProps<typeof MikkelFilmLife>> = ({ seed = "skyroot", ...p }) => (
  <MikkelFilmLife seed={seed} {...p} />
);

// -- the rockets -------------------------------------------------------------------------------------------------------
/**
 * A rocket cut-out's geometry, fractions of its PNG: noseY / baseY (rows of the nose tip and the cut base, 0 = top),
 * axisX (the vehicle's centre line at the base, 0 = left), bodyW (the widest body width / PNG width).
 * comY: the pivot for a turn, the approximate centre of mass as a fraction of the height FROM THE BASE.
 */
export type RocketGeom = { src: string; w: number; h: number; noseY: number; baseY: number; axisX: number; bodyW: number; comY: number };

/** Skyroot's Vikram-1 (SKYROOT'S OWN: it may take the chain). 1.7 m diameter; ~20 m from nose to the cut base. */
export const VIKRAM1: RocketGeom = { src: "skyroot-trailer/vikram1.png", w: 221, h: 2412, noseY: 0.0025, baseY: 0.9975, axisX: 0.5063, bodyW: 0.936, comY: 0.36 };
/** ISRO's LVM3 (core + two S200 strap-ons; never the chain). axisX = the core's centre line; bodyW = booster to booster. */
export const LVM3: RocketGeom = { src: "skyroot-trailer/lvm3.png", w: 774, h: 2612, noseY: 0.0023, baseY: 0.9977, axisX: 0.4766, bodyW: 0.982, comY: 0.3 };

/**
 * Real heights (m). LVM3 43.4 m, ~640 t (FACTS.txt, ISRO / Wikipedia). Vikram-1: sources give 20-24 m (Wikipedia
 * infobox 24, Al Jazeera "22-metre", body ~20 m); NOT confirmed: never print it.
 */
export const HEIGHT_M = { LVM3: 43.4, VIKRAM1: 20 } as const;
/**
 * The height each PNG's nose-to-base span shows (m), for side-by-side scale: Vikram-1 measured off its own 1.7 m
 * diameter (~20 m, the nozzle hidden); LVM3 measured off its 4 m core / 5 m fairing (~40 m: the photo is shot from
 * below and the bottom ~3 m are behind the pad railing). Scale both by VISIBLE_M: the LVM3 stands ~2x the Vikram-1.
 */
export const VISIBLE_M = { LVM3: 40, VIKRAM1: 20 } as const;

/** The PNG box (world px) of a rocket standing with its base centre at (x, y), `height` world px from nose to base. */
export const rocketBox = (r: RocketGeom, x: number, y: number, height: number) => {
  const ph = height / (r.baseY - r.noseY);
  const pw = (ph * r.w) / r.h;
  return { left: x - r.axisX * pw, top: y - r.baseY * ph, w: pw, h: ph, aspect: r.w / r.h };
};

/**
 * A point on the rocket's axis after the turn: t = 0 the base (nozzle exit; attach the flame here), 1 the nose tip,
 * `off` px to the vehicle's right (perpendicular). The rocket stands with its base at (x, y), turned `rot` deg
 * (clockwise) about the point on its axis at `pivot` (fraction of the height from the base; default comY).
 */
export const rocketPoint = (r: RocketGeom, x: number, y: number, height: number, rot: number, t: number, pivot = r.comY, off = 0) => {
  const a = (rot * Math.PI) / 180;
  const px = x;
  const py = y - pivot * height;
  const dx = off;
  const dy = (pivot - t) * height; // down from the pivot along the axis
  return { x: px + dx * Math.cos(a) - dy * Math.sin(a), y: py + dx * Math.sin(a) + dy * Math.cos(a) };
};

/**
 * A chain layer of a cut-out: its alpha filled with `colour` and ERODED by `erode` px (SVG feMorphology), so where
 * the copy sits right under the core (a crown's sides) no antialiased colour fringe peeks past the core's edge.
 * Box in px, top-left (0, 0), `w` x `h` (put it in a positioned wrapper).
 */
export const ChainLayer: React.FC<{ src: string; w: number; h: number; colour: string; erode?: number }> = ({ src, w, h, colour, erode = 1.2 }) => {
  const fid = `skyroot-chain-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: w, height: h }}>
      <svg width={0} height={0} style={{ position: "absolute" }} aria-hidden>
        <defs>
          <filter id={fid} colorInterpolationFilters="sRGB" x="0" y="0" width="100%" height="100%">
            <feMorphology in="SourceAlpha" operator="erode" radius={erode} result="a" />
            <feFlood floodColor={colour} floodOpacity={1} result="flat" />
            <feComposite in="flat" in2="a" operator="in" />
          </filter>
        </defs>
      </svg>
      <Img src={staticFile(src)} style={{ position: "absolute", left: 0, top: 0, width: w, height: h, maxWidth: "none", filter: `url(#${fid})` }} />
    </div>
  );
};

/**
 * A rocket cut-out standing on the paper: base centre (x, y) world px, `height` from nose to base, turned `rot` deg
 * about `pivot` (fraction of the height from the base, default its centre of mass). Graded SKYROOT_FILTER, on its hard
 * shadow (`shadow` world px, NOT turned: the light does not roll). `core` "photo" | "white" (white silhouette) |
 * "none". `chain`: a progress (one number or [orange, purple, blue], chainProgress) for the chain crown, each colour
 * steps[i] * step * progress px along `dir` (screen, default up; point it opposite the travel for a trail, <= ~26 px).
 * Only Skyroot's own rockets take the chain. `mix` 0..1 crossfades the photo to the white silhouette.
 */
export const RocketCutOut: React.FC<{
  rocket: RocketGeom;
  x: number;
  y: number;
  height: number;
  rot?: number;
  pivot?: number;
  shadow?: number;
  core?: "photo" | "white" | "none";
  mix?: number;
  chain?: number | [number, number, number];
  dir?: { dx: number; dy: number };
  step?: number;
  steps?: [number, number, number];
  filter?: string;
}> = ({ rocket, x, y, height, rot = 0, pivot = rocket.comY, shadow = SHADOW_OFF, core = "photo", mix = 0, chain, dir = { dx: 0, dy: -1 }, step = CROWN_STEP, steps = [3, 2, 1], filter = SKYROOT_FILTER }) => {
  const b = rocketBox(rocket, x, y, height);
  const origin = `${x - b.left}px ${y - pivot * height - b.top}px`;
  const at = { src: rocket.src, aspect: b.aspect, x: 0, y: 0, w: b.w, anchor: "top-left" as const };
  const wrap = (key: string, dx: number, dy: number, node: React.ReactNode, opacity = 1) => (
    <div key={key} style={{ position: "absolute", left: b.left + dx, top: b.top + dy, width: b.w, height: b.h, transform: rot ? `rotate(${rot}deg)` : undefined, transformOrigin: origin, opacity }}>
      {node}
    </div>
  );
  const pr = chain === undefined ? null : typeof chain === "number" ? [chain, chain, chain] : chain;
  return (
    <div style={{ position: "absolute", left: 0, top: 0, width: 0, height: 0, isolation: "isolate" }}>
      {shadow > 0 && core !== "none" ? wrap("sh", shadow, shadow, <Silhouette {...at} colour={SHADOW} />) : null}
      {pr
        ? CHAIN.map((c, i) => {
            if (pr[i] <= 0) return null;
            const n = steps[i] * step * pr[i];
            return wrap(c, dir.dx * n, dir.dy * n, <ChainLayer src={rocket.src} w={b.w} h={b.h} colour={c} />);
          })
        : null}
      {core === "photo" && mix < 1 ? wrap("ph", 0, 0, <CutOut {...at} filter={filter} />, 1 - mix) : null}
      {core === "photo" && mix > 0 ? wrap("wm", 0, 0, <Silhouette {...at} colour={INK} />, mix) : null}
      {core === "white" ? wrap("wh", 0, 0, <Silhouette {...at} colour={INK} />) : null}
    </div>
  );
};

// -- the Earth -----------------------------------------------------------------------------------------------------------
/**
 * earth_india.png (square `size` px): the disc's centre (cx, cy) and radius r as fractions of the PNG side, and
 * Sriharikota (13.72 N, 80.23 E; orthographic from the EPIC centroid 11.2 N 74.8 E, north up) as a fraction of the
 * side. Checked against Mumbai, Karachi, Kolkata and Kanyakumari on the colour original (within ~1 % of r).
 */
export const EARTH = {
  src: "skyroot-trailer/earth_india.png",
  size: 1548,
  cx: 0.5,
  cy: 0.5002,
  r: 0.4974,
  sriharikota: { x: 0.5457, y: 0.4779 },
} as const;

/** World position of a fractional point (fx, fy) of the Earth PNG drawn `w` world px wide, centred on (x, y), turned rot deg. */
export const earthPoint = (x: number, y: number, w: number, fx: number, fy: number, rot = 0) => {
  const a = (rot * Math.PI) / 180;
  const dx = (fx - 0.5) * w;
  const dy = (fy - 0.5) * w;
  return { x: x + dx * Math.cos(a) - dy * Math.sin(a), y: y + dx * Math.sin(a) + dy * Math.cos(a) };
};

// -- the logos -------------------------------------------------------------------------------------------------------------
/** A logo's box in its viewBox units (the artwork fills its source viewBox; checked on the probe) and its shadow (fraction of w). */
const LOGO_BOX: Record<string, { x: number; y: number; w: number; h: number; shadow: number }> = {
  ISRO: { x: 0, y: 0, w: 300, h: 290, shadow: 0.018 }, // chunky glyphs: ~1.8 % of the width
  SKYROOT: { x: 0, y: 0, w: 1716, h: 475, shadow: 0.006 }, // thin open line art: well under 1 %
};
const boxOf = (logo: LogoData) => (logo === ISRO_LOGO ? LOGO_BOX.ISRO : LOGO_BOX.SKYROOT);
/** Width / height of a logo's tight box. */
export const logoAspect = (logo: LogoData) => boxOf(logo).w / boxOf(logo).h;

/** The logo's paths in one flat fill, in its own viewBox units (use inside an <svg>, e.g. ChainEcho's render). */
export const LogoPaths: React.FC<{ logo: LogoData; fill: string }> = ({ logo, fill }) => (
  <g transform={logo.groupTransform}>
    {logo.paths.map((p) => (
      <path key={p.part} d={p.d} transform={p.transform} fill={fill} fillRule="evenodd" />
    ))}
  </g>
);

/**
 * A logo as a white mark on its hard shadow, in plane world px: top-left (x, y), `w` world px wide (height from
 * logoAspect). `shadow` world px (default: ISRO ~1.8 % of the width, Skyroot's thin line art ~0.6 %, min 2).
 * `fill` for a black print or a chain layer (Skyroot's mark only: it is SKYROOT'S OWN).
 */
export const LogoMark: React.FC<{ logo: LogoData; x: number; y: number; w: number; shadow?: number; fill?: string; opacity?: number }> = ({
  logo,
  x,
  y,
  w,
  shadow,
  fill = INK,
  opacity = 1,
}) => {
  const bx = boxOf(logo);
  const h = w / (bx.w / bx.h);
  const s = bx.w / w; // viewBox units per world px
  const off = (shadow ?? Math.max(2, bx.shadow * w)) * s;
  return (
    <svg width={w} height={h} viewBox={`${bx.x} ${bx.y} ${bx.w} ${bx.h}`} style={{ position: "absolute", left: x, top: y, overflow: "visible", opacity }}>
      {off > 0 ? (
        <g transform={`translate(${off} ${off})`}>
          <LogoPaths logo={logo} fill={SHADOW} />
        </g>
      ) : null}
      <LogoPaths logo={logo} fill={fill} />
    </svg>
  );
};

// -- the probe -----------------------------------------------------------------------------------------------------------
/**
 * SkyrootProbe: every asset on the paper at a plausible size, film life on, caption bands shown. LVM3 and Vikram-1
 * standing side by side at VISIBLE_M scale (the Vikram-1 with its chain crown rising at f2), the Earth disc with a
 * white dot on Sriharikota, a second Vikram-1 turned 32 deg about its centre of mass with a white flame dot at its
 * nozzle (rocketPoint), the ISRO and Skyroot marks white on their hard shadows. Registered in src/Root.SkyrootProbe.tsx.
 */
export const SKYROOT_PROBE_DURATION = 24;
export const SkyrootProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const g = camEase(frame / SKYROOT_PROBE_DURATION, 1);
  const cam: SkyrootCam = { x: W / 2 + 12 * g, y: H / 2, k: 1 + 0.02 * g };
  const lvH = 900;
  const v1H = (lvH * VISIBLE_M.VIKRAM1) / VISIBLE_M.LVM3;
  const ground = 1010;
  const earthW = 520;
  const ex = 330;
  const ey = 330;
  const sh = earthPoint(ex, ey, earthW, EARTH.sriharikota.x, EARTH.sriharikota.y);
  const tilt = 32;
  const tx = 1640;
  const ty = 560;
  const tH = 380;
  const nz = rocketPoint(VIKRAM1, tx, ty, tH, tilt, 0);
  const pr = chainProgress(frame, 2);
  const flick = interpolate(frame % 4, [0, 2, 4], [1, 0.85, 1]);
  return (
    <AbsoluteFill>
      <SkyrootFilmLife frame={frame}>
        <SkyrootPaper frame={frame} cam={cam} />
        <SkyrootPlane cam={cam}>
          {/* the Earth, Sriharikota marked */}
          <PhotoCutOut src={EARTH.src} x={ex} y={ey} w={earthW} aspect={1} anchor="center" shadowOff={5} filter={SKYROOT_FILTER} />
          <SkyrootSvg>
            <Inked render={(c) => <circle cx={sh.x} cy={sh.y} r={7} fill={c} />} />
          </SkyrootSvg>
          {/* LVM3 and Vikram-1 side by side */}
          <RocketCutOut rocket={LVM3} x={820} y={ground} height={lvH} shadow={5} />
          <RocketCutOut rocket={VIKRAM1} x={1110} y={ground} height={v1H} shadow={5} chain={pr} />
          {/* a turned Vikram-1 with a flame dot at its nozzle */}
          <SkyrootSvg>
            <Inked render={(c) => <ellipse cx={nz.x} cy={nz.y} rx={10 * flick} ry={10 * flick} fill={c} />} />
          </SkyrootSvg>
          <RocketCutOut rocket={VIKRAM1} x={tx} y={ty} height={tH} rot={tilt} shadow={5} />
          {/* the two marks, white */}
          <LogoMark logo={ISRO_LOGO} x={1330} y={70} w={220} />
          <LogoMark logo={SKYROOT_LOGO} x={1620} y={110} w={360} />
        </SkyrootPlane>
      </SkyrootFilmLife>
      <CaptionBands on />
    </AbsoluteFill>
  );
};
