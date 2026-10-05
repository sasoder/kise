import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, GEO, LightSweep, bloomFilter, clamp01, lerp, mixHex, rectPath, smoothstep } from "./stoutShared";
import {
  CARD_FRAC,
  DTS_LIGHT,
  DtsStage,
  DtsTile,
  FPS,
  ObjectShadow,
  SAFE,
  Screen,
  camJerk,
  dtsAmberBand,
  dtsCameraTrack,
  hash01,
  reachFrame,
  screenBox,
  toScreenL,
  toneAt,
  type Front,
} from "./dtsShared";
import type { Glide } from "./outgrowShared";

// ---------------------------------------------------------------------------
// SmallerTeams — cut D of Toto Wolff, "why Drive to Survive worked" (Cheeky Pint S4E01), on the DTS world
// (dtsShared.tsx, Builder W; brief out/dts/briefs/BRIEF.md). Cheeky Pint S4 stout system, palette B1.
// 1920x1080, 24 fps, opaque.
//
// THE LINE: "…because it allowed Drive to Survive to look at smaller teams, and less… it's kind of underdog."
// WINDOW: seq 48.560-54.120 = 5.560 s. DURATION = ceil(5.560 x 24) = ceil(133.44) = 134, no tail.
// ONSETS (f, ±2): because 0 · it 4 · allowed 8 · drive 18 · to 36 · survive 40 · to 50 · look 55 · at 60 ·
//   smaller 64 · teams 76 · and 84 · less 96 · it's 115 · kind 118 · of 120 · underdog 122 · ends 132.
//
// ACCENT RULE: amber = Drive to Survive's light — the screen's face and whatever its light reaches. The
// small teams turn amber only when the travelling light's front reaches them (toneAt, 13 f eased
// crossfade, a hashed offset inside the front). Mercedes and Ferrari (they declined, cut C) stand set back
// on board and the light passes below them. Nothing else is amber; no type.
//
// THE GRID (the 2018 championship, season 1's ten teams): Mercedes and Ferrari (the C tiles, DtsTile, BIG,
// ~1.43x the average small tile) on a raised row set back ABOVE THE MIDDLE of the line, dimmed to board from
// f0; the eight others on one line on the light's path, in championship order, as ANONYMOUS tiles (cut-local
// SmallTeamTile: DtsTile's recipe with a bolder F1-car knock-out: wheels clear of the body, rear wing and halo
// bumps, a tapered nose; dtsShared's "car" figure is too thin to read in a small tile at 480 px), their size
// stepping down 0.78 -> 0.62 of a big tile so the last, smallest-standing team is the smallest: the underdog.
// THE LIGHT is cut C's GroundLight language (AreWeDoingThis.tsx): A's DTS_LIGHT amber, a band on the floor
// from under the screen's foot to a crisp, soft-edged front.
//
// ONE MOTION: the screen's light pours out of its foot, runs along the floor beneath the two dimmed
// front-runners and down the line, slowing, and settles into a spot on the last tile.
// GESTURES (gesture -> word -> frames) — PASS 2
//   1. the screen on (amber, the DTS card) with its light at its foot; the big two above the line; a creep
//      and an easy drift toward the line -> "because it allowed" -> f0-48
//   2. the light pours out of the screen's foot (an even creep + an ease-in, C1 into the line's curve) along
//      the floor -> "allowed Drive to Survive" -> f0-60
//   3. its front travels down the line beneath Mercedes and Ferrari (who stay board), decelerating; each small
//      tile crossfades cream -> amber as it arrives: f60, 65, 70, 76, 81, 88, 95, 104 -> "to look at smaller
//      teams, and less" (f55-104)
//   4. the camera follows the light down the line (one glide, f30-108), ending with the underdog at x ~1400
//      and the big two in frame top-left (x ~360-980), the line leading back off the left edge
//   5. the front settles just past the last tile (f116) and the light narrows onto it: along the line it
//      eases down to 0.3 in a gentle falloff around the last tile, the tiles it leaves a touch deeper amber
//      (f96-120); the end creep -> "and less… it's kind of" -> f96-134
//   6. THE ONE LIGHTSWEEP crosses the last tile -> "underdog" f122 -> f116-128
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 134; // ceil((54.120 - 48.560) x 24)
export const BEATS = { because: 0, allowed: 8, drive: 18, survive: 40, look: 55, smaller: 64, teams: 76, less: 96, its: 115, underdog: 122, ends: 132 } as const;

// --- the F1 car (icebergShared's side profile, metres: x 0 = the tail, 5.5 = the nose; y up) ------------
type P = [number, number];
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
const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const pathOf = (cmds: Cmd[], map: (x: number, y: number) => P) =>
  cmds
    .map((c) => {
      if (c[0] === "Z") return "Z";
      const pts: string[] = [];
      for (let i = 1; i < c.length; i += 2) {
        const [x, y] = map(c[i] as number, c[i + 1] as number);
        pts.push(`${f3(x)} ${f3(y)}`);
      }
      return `${c[0]}${pts.join(" ")}`;
    })
    .join("");
const WHEEL_R = 0.36;
const WHEELS: P[] = [
  [0.86, 0.36],
  [4.38, 0.36],
];
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
const HELMET = { x: 2.98, y: 0.8, r: 0.2 };
/** The halo as a bold band over the cockpit (front post -> roll hoop): its bump reads in the silhouette. */
const HALO: Cmd[] = [
  ["M", 3.46, 0.66],
  ["C", 3.38, 1.02, 3.14, 1.16, 2.94, 1.16],
  ["C", 2.76, 1.16, 2.62, 1.1, 2.56, 0.98],
  ["L", 2.66, 0.94],
  ["C", 2.7, 1.02, 2.8, 1.06, 2.94, 1.06],
  ["C", 3.1, 1.06, 3.28, 0.96, 3.34, 0.66],
  ["Z"],
];
const CAR_SIL: Cmd[][] = [CAR_BODY, CAR_WING_R, CAR_PILLAR, CAR_WING_F, HALO, circleCmds(HELMET.x, HELMET.y, HELMET.r)];
const CHASSIS_BOX = { x0: 0, x1: 5.62, y0: 0.0, y1: 1.16 };
/** The car as one knock-out figure (black) in a tile of `size` at (x, y), placed on the tile's centre. PASS 2
 *  ("a blob"): the bold weight is kept by a height lift and a thin outline, but the wheels stand clear of the
 *  body behind a wide ring of tile, the rear wing and the halo keep their bumps, and the nose tapers (mitred,
 *  no rounding). */
const CAR_W = 0.84; // stoutShared's CREST_MAX: no mark wider than 0.84 of its tile
const CAR_YS = 1.5; // the body's height lifted a touch so the car reads at phone size
const CAR_DILATE = 0.03; // metres: a thin outline (bold without closing the gaps)
const WHEEL_RING = 0.11; // metres of tile between a wheel and the body
const WHEEL_SC = 1.2; // the wheels a touch larger (they carry the read)
const CarFigure: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  const w = CHASSIS_BOX.x1 - CHASSIS_BOX.x0;
  const h = (CHASSIS_BOX.y1 - CHASSIS_BOX.y0) * CAR_YS;
  const sc = (CAR_W * size) / w;
  const ox = x + size / 2 - (CHASSIS_BOX.x0 + w / 2) * sc;
  const oy = y + size / 2 + (h / 2) * sc;
  const map = (mx: number, my: number): P => [ox + mx * sc, oy - my * CAR_YS * sc];
  // a wheel stays round: its centre lifted with the body, its radius in plain metres
  const wheel = (cx: number, cy: number, r: number) => pathOf(circleCmds(cx, cy, r), (mx, my) => [ox + mx * sc, oy - (cy * CAR_YS + (my - cy)) * sc]);
  return (
    <g>
      <g fill="#000" stroke="#000" strokeWidth={f3(CAR_DILATE * sc * 2)} strokeLinejoin="miter" strokeMiterlimit={8}>
        {CAR_SIL.map((c, i) => (
          <path key={i} d={pathOf(c, map)} />
        ))}
      </g>
      <g fill="#fff">
        {WHEELS.map(([cx, cy], i) => (
          <path key={i} d={wheel(cx, cy, WHEEL_R * WHEEL_SC + WHEEL_RING)} />
        ))}
      </g>
      <g fill="#000">
        {WHEELS.map(([cx, cy], i) => (
          <path key={i} d={wheel(cx, cy, WHEEL_R * WHEEL_SC)} />
        ))}
      </g>
    </g>
  );
};

/**
 * SmallTeamTile — an anonymous team: DtsTile's recipe (a square card bottom-centre (x, y), radius scaled with
 * the tile, ObjectShadow at rest with its contact, the lit top edge) with the car knocked out to the ground.
 * `amber` 0..1 = the show's light reaching it: the amber band face with the fixed bloom and the hot top edge,
 * crossfaded over the cream. `deep` 0..1 = how far the tile sits from the light's settled spot: its amber
 * eases a touch deeper (toward the ground, AMBER_DEEP at 1) and its bloom and hot edge soften with it.
 */
const AMBER_DEEP = 0.24;
export const SmallTeamTile: React.FC<{ x: number; y: number; size: number; k: number; amber: number; deep?: number; band: [number, number] }> = ({
  x,
  y,
  size,
  k,
  amber,
  deep = 0,
  band,
}) => {
  const uid = `sq${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const T = size;
  const x0 = x - T / 2;
  const y0 = y - T;
  const r = GEO.RADIUS * (T / GEO.TILE);
  const tile = rectPath(x0, y0, T, T, r);
  const a = clamp01(amber);
  const d = AMBER_DEEP * clamp01(deep);
  const fall = EDGE.HOT_FALL / k;
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(y0)} x2="0" y2={f3(y)}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(band[0])} x2="0" y2={f3(band[1])}>
          <stop offset="0" stopColor={mixHex(COLOR.amberTop, COLOR.ground, d)} />
          <stop offset="1" stopColor={mixHex(COLOR.amberFoot, COLOR.ground, d)} />
        </linearGradient>
        <linearGradient id={`${uid}h`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <mask id={`${uid}k`} maskUnits="userSpaceOnUse" x={f3(x0 - 1)} y={f3(y0 - 1)} width={f3(T + 2)} height={f3(T + 2)}>
          <rect x={f3(x0)} y={f3(y0)} width={f3(T)} height={f3(T)} fill="#fff" />
          <CarFigure x={x0} y={y0} size={T} />
        </mask>
        <clipPath id={`${uid}p`}>
          <path d={tile} />
        </clipPath>
      </defs>
      <ObjectShadow paths={[tile]} size={T} contact={{ x, y, w: T }} />
      <path d={tile} fill={`url(#${uid}c)`} mask={`url(#${uid}k)`} />
      {a > 0.002 ? (
        <g opacity={a < 1 ? f3(a) : undefined}>
          <g style={{ filter: bloomFilter(k) }}>
            <path d={tile} fill={`url(#${uid}a)`} mask={`url(#${uid}k)`} />
          </g>
          <g clipPath={`url(#${uid}p)`} mask={`url(#${uid}k)`} opacity={d > 0 ? f3(1 - (2.5 * d) / AMBER_DEEP / 4) : undefined}>
            <path d={rectPath(x0, y0, T, fall, r, true, false)} fill={`url(#${uid}h)`} />
            <path d={`M${f3(x0 + r)} ${f3(y0 + EDGE.HOT / k / 2)}H${f3(x0 + T - r)}`} stroke={COLOR.amberHot} strokeWidth={f3(EDGE.HOT / k)} />
          </g>
        </g>
      ) : null}
      {a < 0.999 ? (
        <path d={`M${f3(x0 + r)} ${f3(y0 + EDGE.CREAM / k / 2)}H${f3(x0 + T - r)}`} stroke={COLOR.edge} strokeOpacity={f3(lerp(ALPHA.edge, 0, a))} strokeWidth={f3(EDGE.CREAM / k)} />
      ) : null}
    </g>
  );
};

// ===========================================================================
// THE LAYOUT (world px; the line's floor is y 0, its first tile at x 0)
// ===========================================================================
/** The front-runners' tile (Mercedes, Ferrari): ~1.43x the average small tile. */
export const BIG = 190;
/** The line: eight small teams, championship order (3rd .. 10th), one pitch, 0.78 -> 0.62 of a big tile. */
export const PITCH = 172;
export const FLOOR = 0;
export const SMALL = Array.from({ length: 8 }, (_, i) => ({ i, x: i * PITCH, size: Math.round(BIG * lerp(0.78, 0.62, i / 7)) }));
const LAST = SMALL[SMALL.length - 1];
/** The front-runners, set back on a raised row ABOVE THE MIDDLE of the line (the light runs beneath them). */
export const BACK_FLOOR = -222;
export const FRONT_RUNNERS = [
  { figure: "mercedes" as const, x: 2.7 * PITCH },
  { figure: "ferrari" as const, x: 4.5 * PITCH },
];
/** THE SCREEN at the left, facing right, standing above the floor so its light falls on the floor below it.
 *  Its right edge GAP world px before the first tile: the light's runway (see THE FRONT). */
const GAP = 460;
export const SCREEN_W = 480;
const SCREEN_H = screenBox(0, 0, SCREEN_W).outer.h;
export const SCREEN = { x: SMALL[0].x - SMALL[0].size / 2 - GAP - SCREEN_W / 2, y: -150 - SCREEN_H / 2, w: SCREEN_W } as const;
const SB = screenBox(SCREEN.x, SCREEN.y, SCREEN.w);
const SCREEN_R = SB.outer.x + SB.outer.w;

// THE FRONT: the leading edge of the screen's light on the floor. At rest it is the screen's foot glow
// (FOOT world px past its right edge). From f0 it pours out (an even creep + an ease-in, c u + (1 - c) u^n), reaching
// the first tile on f60 at speed V; then ONE decelerating curve down the line (dtsShared decelFront's form, its power
// solved so the last tile is reached on f104), at rest on f116 just past the last tile, the spot settled on
// it. The two phases meet with the same velocity (C1). The runway (GAP) is what the light needs to reach
// that speed with an ease-in no steeper than u^~6.
const FOOT = 24; // the foot glow at f0: the light just past the screen's right edge
const CREEP = 0.2; // the share of the pour-out that is an even creep (so the light is moving from f0)
const REACH_IN = 8; // a tile is reached when the front is this far inside its leading edge
const XR = SMALL.map((t) => t.x - t.size / 2 + REACH_IN);
export const PHASE = { a0: 0, a1: 60, b1: 116, lastReach: 104 } as const;
const XS = SCREEN_R + FOOT;
const XE = LAST.x + LAST.size / 2 + 30;
const P_B = Math.log(1 - (XR[7] - XR[0]) / (XE - XR[0])) / Math.log(1 - (PHASE.lastReach - PHASE.a1) / (PHASE.b1 - PHASE.a1));
const V = (P_B * (XE - XR[0])) / (PHASE.b1 - PHASE.a1);
// phase A: x = XS + (XR0 - XS) (c u + (1 - c) u^n), its slope at u 1 = V
const N_A = ((V * (PHASE.a1 - PHASE.a0)) / (XR[0] - XS) - CREEP) / (1 - CREEP);
export const front: Front = (f) => {
  if (f <= PHASE.a1) {
    const u = clamp01((f - PHASE.a0) / (PHASE.a1 - PHASE.a0));
    return XS + (XR[0] - XS) * (CREEP * u + (1 - CREEP) * Math.pow(u, N_A));
  }
  const u = clamp01((f - PHASE.a1) / (PHASE.b1 - PHASE.a1));
  return XR[0] + (XE - XR[0]) * (1 - Math.pow(1 - u, P_B));
};
/** Reach frames, a hashed offset (0-4 px) inside the front so the line never flips in lockstep. */
export const REACH: number[] = SMALL.map((t, i) => reachFrame((f) => front(f) - (XR[i] + 4 * hash01(i, 4)), 0, DURATION));

// THE SPOT: as the front settles, the light narrows onto the last tile: along the line its strength eases
// down to SPOT.low (a gentle gaussian falloff around the last tile, never a flash), f98 -> f120; the tiles
// it leaves sit a touch deeper amber in step (SmallTeamTile `deep`).
export const SPOT = { f0: 96, f1: 120, low: 0.3, gain: 1.12, sigma: 0.78 * PITCH } as const;
export const focusAt = (f: number) => smoothstep((f - SPOT.f0) / (SPOT.f1 - SPOT.f0));
const bump = (x: number) => Math.exp(-Math.pow((x - LAST.x) / SPOT.sigma, 2));
/** 0 = in the spot .. 1 = far from it, at frame f */
export const deepAt = (x: number, f: number) => focusAt(f) * (1 - bump(x));

// THE LIGHT (cut C's GroundLight language, AreWeDoingThis.tsx, pass 2): A's DTS_LIGHT amber screen-blended on
// the floor under the world, a band from under the screen to a crisp, softly rounded front (edge blur
// EDGE_SOFT screen px). It fades in under the screen (left edge -> right edge), then A's falloff a0 -> toward
// a1 along the run, and (D) the spot's falloff multiplied in. Its band sits on the line's floor: the small
// tiles' feet in its full strength, the raised row above it.
const BAND_Y = { y0: -170, y1: 120, fade: 100 } as const;
const EDGE_SOFT = 9;
const GroundLight: React.FC<{ x1: number; k: number; f: number }> = ({ x1, k, f }) => {
  const uid = `gl${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const xl = SB.outer.x;
  const xr = SCREEN_R;
  if (x1 - xr < 2) return null;
  const pad = (4 * EDGE_SOFT) / k;
  const h = BAND_Y.y1 - BAND_Y.y0;
  const fy = BAND_Y.fade / h;
  const rr = Math.min(150, (x1 - xl) / 2);
  const c = `rgb(${DTS_LIGHT.color})`;
  // A's falloff along the run (P's three stops as a curve), times the spot's falloff
  const base = (x: number) => {
    if (x <= xr) return DTS_LIGHT.a0 * clamp01((x - xl) / (xr - xl));
    const t = clamp01((x - xr) / (x1 - xr));
    const mid = lerp(DTS_LIGHT.a0, DTS_LIGHT.a1, 0.3);
    const end = (DTS_LIGHT.a0 + DTS_LIGHT.a1) / 2;
    return t < 0.65 ? lerp(DTS_LIGHT.a0, mid, t / 0.65) : lerp(mid, end, (t - 0.65) / 0.35);
  };
  const spot = (x: number) => lerp(1, SPOT.low + (SPOT.gain - SPOT.low) * bump(x), focusAt(f));
  const STOPS = 24;
  const stops = Array.from({ length: STOPS + 1 }, (_, i) => {
    const x = lerp(xl, x1, i / STOPS);
    return { o: i / STOPS, a: base(x) * spot(x) };
  });
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${uid}h`} gradientUnits="userSpaceOnUse" x1={f3(xl)} y1="0" x2={f3(x1)} y2="0">
          {stops.map((s, i) => (
            <stop key={i} offset={f3(s.o)} stopColor={c} stopOpacity={f3(s.a)} />
          ))}
        </linearGradient>
        <linearGradient id={`${uid}v`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(BAND_Y.y0)} x2="0" y2={f3(BAND_Y.y1)}>
          <stop offset="0" stopColor="#000" />
          <stop offset={f3(fy)} stopColor="#fff" />
          <stop offset={f3(1 - fy)} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(xl - pad)} y={f3(BAND_Y.y0 - pad)} width={f3(x1 - xl + 2 * pad)} height={f3(h + 2 * pad)}>
          <path d={rectPath(xl - 200, BAND_Y.y0, x1 - xl + 200, h, rr)} fill={`url(#${uid}v)`} style={{ filter: `blur(${f3(EDGE_SOFT / k)}px)` }} />
        </mask>
      </defs>
      <rect x={f3(xl)} y={f3(BAND_Y.y0 - pad)} width={f3(x1 - xl + pad)} height={f3(h + 2 * pad)} fill={`url(#${uid}h)`} mask={`url(#${uid}m)`} />
    </g>
  );
};

// ===========================================================================
// THE CAMERA (dtsShared dtsCameraTrack: look lands on screen y 480)
// ===========================================================================
const CARD_HALF = (SB.face.w * CARD_FRAC) / 2;
const CARD_L = SCREEN.x - CARD_HALF;
const MERC_L = FRONT_RUNNERS[0].x - BIG / 2;
const FERR_R = FRONT_RUNNERS[1].x + BIG / 2;
const CONTENT_TOP = Math.min(SB.top, BACK_FLOOR - BIG);
const LOOK_Y = (CONTENT_TOP + FLOOR) / 2;
/** f0: the screen (its card whole, CARD_IN px in), the big two and the start of the line fill the frame. */
const CARD_IN = 100;
const K0 = (1920 - CARD_IN - 110) / (FERR_R - CARD_L);
const X0 = CARD_L - (CARD_IN - 960) / K0;
/** the end: the underdog right of centre (x 1400), the big two in frame top-left (x ~360-980), the line
 *  leading back off the left edge. */
const UNDERDOG_SX = 1400;
const MERC_SX = 370; // the same end zoom as pass 2 (the span underdog - Mercedes unchanged), the frame shifted
const K_END = (UNDERDOG_SX - MERC_SX) / (LAST.x - MERC_L);
const X_END = LAST.x - (UNDERDOG_SX - 960) / K_END;
export const CAM_START = { x: X0, y: LOOK_Y, k: K0 };
export const GLIDES: Glide[] = [
  // 1. the creep and an easy drift toward the line while the light gathers at the screen's foot
  { f0: -10, f1: 44, k: K0 * 1.02 },
  { f0: 4, f1: 48, dx: 60 / K0 },
  // 4. follow the light down the line, easing out of the first framing as it pours out
  { f0: 30, f1: 108, dx: X_END - X0 - 60 / K0, k: K_END * 0.985, warp: 1.15 },
  // 5. the end creep: in on the settled spot, the big two still in frame
  { f0: 96, f1: 140, k: K_END * 1.012 },
];
export const CAM = dtsCameraTrack(CAM_START, GLIDES, DURATION, 12);
export const camAt = (f: number) => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];
/** THE SWEEP: the one click, across the last tile, its band crossing centre on "underdog". */
export const SWEEP_F = { f0: 116, f1: 128 } as const;

// the cream subject pool: follows the light's front, lagged by the house damper
const POOL: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  let x = SCREEN_R;
  let v = 0;
  for (let f = 0; f < DURATION + 2; f++) {
    v = v + (Math.max(SCREEN_R, front(f) - 80) - x) * 0.09 - v * 0.468;
    x += v;
    out.push({ x, y: LOOK_Y });
  }
  return out;
})();

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const SmallerTeams: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = dtsAmberBand(cam);
  const sweep = clamp01((f - SWEEP_F.f0) / (SWEEP_F.f1 - SWEEP_F.f0));
  const r = GEO.RADIUS * (LAST.size / GEO.TILE);
  return (
    <DtsStage S={f} cam={cam} rest={CAM[0]} pool={POOL[Math.min(POOL.length - 1, f)]}>
      <GroundLight x1={front(f)} k={k} f={f} />
      <Screen x={SCREEN.x} y={SCREEN.y} w={SCREEN.w} k={k} band={band} on={1} />
      {FRONT_RUNNERS.map((t) => (
        <DtsTile key={t.figure} x={t.x} y={BACK_FLOOR} size={BIG} k={k} figure={t.figure} dim={1} />
      ))}
      {SMALL.map((t, i) => (
        <SmallTeamTile key={t.i} x={t.x} y={FLOOR} size={t.size} k={k} amber={toneAt(REACH[i], f)} deep={deepAt(t.x, f)} band={band} />
      ))}
      <LightSweep x={LAST.x - LAST.size / 2} y={FLOOR - LAST.size} w={LAST.size} h={LAST.size} k={k} t={sweep} on="amber" r={r} />
    </DtsStage>
  );
};

export default SmallerTeams;

// ===========================================================================
// LOAD-TIME CHECKS: the rules the cut rests on
// ===========================================================================
{
  const fail = (m: string) => {
    throw new Error(`SmallerTeams: ${m}`);
  };
  // the front: C1 at the hand-over, an ease-in no steeper than u^4.5, monotone
  const vA = (front(PHASE.a1) - front(PHASE.a1 - 0.01)) / 0.01;
  const vB = (front(PHASE.a1 + 0.01) - front(PHASE.a1)) / 0.01;
  if (Math.abs(vA - vB) > 0.3) fail(`the front's hand-over is not smooth (${vA.toFixed(2)} vs ${vB.toFixed(2)})`);
  if (N_A > 6.2 || N_A < 1.5) fail(`the light's pour-out ease is u^${N_A.toFixed(2)}`);
  // the small tiles turn on their words (the pass-1 frames): f60, 65, 70, 75/76, 81, 87/88, 95, 104
  const PLAN = [60, 65, 70, 75.5, 81.5, 87.5, 95, 104];
  REACH.forEach((r, i) => {
    if (Math.abs(r - PLAN[i]) > 1.2) fail(`tile ${i + 1} reached f${r.toFixed(1)} (plan f${PLAN[i]})`);
  });
  // the big two read big: >= 1.4x the average small tile
  const avg = SMALL.reduce((s, t) => s + t.size, 0) / SMALL.length;
  if (BIG / avg < 1.4) fail(`the big two are only ${(BIG / avg).toFixed(2)}x the small tiles`);
  // the light runs beneath the raised row: its band's top stays below the big two's feet
  if (BAND_Y.y0 < BACK_FLOOR + 40) fail("the light's band reaches the raised row");
  // the camera: |dv| <= 2.5, <= 45 px/f; the light's front <= 45 screen px/f relative to the frame
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`camera |dv| ${j.maxA.toFixed(2)} at f${j.at}`);
  if (j.maxV > 45) fail(`camera speed ${j.maxV.toFixed(1)} px/f`);
  for (let f = 1; f < DURATION; f++) {
    const a = toScreenL(camAt(f - 1), front(f - 1), FLOOR).x;
    const b = toScreenL(camAt(f), front(f), FLOOR).x;
    if (Math.abs(b - a) > 45) fail(`the front moves ${Math.abs(b - a).toFixed(1)} screen px on f${f}`);
  }
  // framing: everything inside the band y 90-880 on every frame
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    const top = toScreenL(c, 0, CONTENT_TOP).y;
    const bot = toScreenL(c, 0, FLOOR).y;
    if (top < SAFE.top || bot > SAFE.bottom) fail(`the content leaves the band at f${f} (${top.toFixed(0)}..${bot.toFixed(0)})`);
  }
  // f0-40: the card whole (its left edge >= 16 px in), Ferrari inside the right margin at f0
  const c0 = camAt(0);
  for (let f = 0; f <= 40; f++) if (toScreenL(camAt(f), CARD_L, 0).x < 16) fail(`the DTS card is cut at f${f}`);
  if (toScreenL(c0, FERR_R, 0).x > 1920 - SAFE.side) fail("Ferrari crosses the right margin at f0");
  // the end: the underdog right of centre (1350-1450), the big two inside the frame
  const cE = camAt(DURATION - 1);
  const ux = toScreenL(cE, LAST.x, 0).x;
  if (ux < 1350 || ux > 1450) fail(`the underdog ends at x ${ux.toFixed(0)}`);
  if (toScreenL(cE, MERC_L, 0).x < SAFE.side) fail("Mercedes leaves the frame at the end");
}
