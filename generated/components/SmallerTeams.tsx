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
  SAFE_P,
  Screen,
  camForP,
  camJerk,
  dtsAmberBandP,
  dtsCameraTrackP,
  hash01,
  lookOfP,
  reachFrame,
  screenBox,
  toScreenP,
  toneAt,
  type Front,
} from "./dtsShared";
import { DTS_CARD_PX } from "./dtsAssets";
import type { Glide } from "./outgrowShared";

// ---------------------------------------------------------------------------
// SmallerTeams — cut D of Toto Wolff, "why Drive to Survive worked" (Cheeky Pint S4E01), on the DTS world
// (dtsShared.tsx, Builder W; briefs out/dts/briefs/BRIEF.md + BRIEF_9x16.md). Cheeky Pint S4 stout system,
// palette B1. PASS 3: 9:16, 1080x1920, 24 fps, opaque (the 16:9 pass-2 source, delivered, is kept in
// out/dts/Q/landscape/).
//
// THE LINE: "…because it allowed Drive to Survive to look at smaller teams, and less… it's kind of underdog."
// WINDOW: seq 48.560-54.120 = 5.560 s. DURATION = ceil(5.560 x 24) = ceil(133.44) = 134, no tail.
// ONSETS (f, ±2): because 0 · it 4 · allowed 8 · drive 18 · to 36 · survive 40 · to 50 · look 55 · at 60 ·
//   smaller 64 · teams 76 · and 84 · less 96 · it's 115 · kind 118 · of 120 · underdog 122 · ends 132.
//
// ACCENT RULE: amber = Drive to Survive's light — the screen's face and whatever its light reaches. The
// small teams turn amber only when the light's front reaches them (toneAt, 13 f eased crossfade, a hashed
// offset inside the front). Mercedes and Ferrari (they declined, cut C) stay board. Nothing else is amber.
//
// THE GRID, from above: the 2018 starting grid, front at the TOP, the classic staggered two-column formation
// (the right column half a slot behind the left). Front row: Mercedes (pole, left) and Ferrari (right), big
// DtsTiles dimmed to board from f0, set aside from the racing line so the light passes between them. Then
// the eight smaller teams in championship order (3rd .. 10th) in four staggered rows going DOWN, as anonymous
// tiles (cut-local SmallTeamTile: DtsTile's recipe with a TOP-DOWN F1-car knock-out pointing up the grid:
// front wing, nose, four wheels clear of the body, sidepods, cockpit, rear wing), 0.78 -> 0.62 of a big tile,
// so the last, 10th on the grid's back row, is the smallest: the underdog. THE SCREEN stands above the front
// row; its light is cut C's GroundLight language (A's amber, a soft rounded front) re-aimed as a band falling
// DOWN the grid.
//
// ONE MOTION: the screen's light pours out of its foot, falls down the grid between the two dimmed
// front-runners and down the staggered rows, slowing, and narrows into a spot on the back of the grid.
// GESTURES (gesture -> word -> frames)
//   1. the screen on (amber, the DTS card) with its light at its foot; the grid below; a creep
//      -> "because it" -> f0-30
//   2. the light pours out of the screen's foot (an even creep + an ease-in, C1 into the grid's curve) and
//      falls between Mercedes and Ferrari, who stay board -> "allowed Drive to Survive" -> f0-60
//   3. its front falls down the grid, decelerating; each small tile crossfades cream -> amber as it arrives,
//      in grid order -> "to look at smaller teams, and less" -> f60-104 (frames in REACH_PLAN)
//   4. the camera tilts down with the light (one glide, f30-108) and pulls back a touch, so the dim big two
//      stay readable at the top while the back of the grid comes up
//   5. the front settles just past the last tile (f116) and the light narrows onto it (the band eases down
//      to 0.3 while a spot gathers on the underdog; the tiles it leaves a touch deeper amber), f96-120, with
//      the end creep -> "and less… it's kind of" -> f96-134
//   6. THE ONE LIGHTSWEEP crosses the last tile -> "underdog" f122 -> f116-128
// Nothing else.
// ---------------------------------------------------------------------------

export { FPS };
export const DURATION = 134; // ceil((54.120 - 48.560) x 24)
export const BEATS = { because: 0, allowed: 8, drive: 18, survive: 40, look: 55, smaller: 64, teams: 76, less: 96, its: 115, underdog: 122, ends: 132 } as const;

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();

// --- the top-down F1 car (nose UP). Metres: x across (0 = the axis), y down from the front wing's edge ------
const TOPCAR = {
  box: { y0: 0, y1: 5.42 },
  black: [
    // front wing (main plane + endplates)
    "M-0.98 0.06Q-0.98 0 -0.92 0H0.92Q0.98 0 0.98 0.06V0.3H0.84V0.2H-0.84V0.3H-0.98Z",
    // the nose, tapering from the wing to the cockpit
    "M-0.11 0.2H0.11L0.3 1.7H-0.3Z",
    // the body and sidepods: widest at the sidepods, waisting to the gearbox
    "M-0.3 1.66L0.3 1.66L0.42 2.28L0.74 2.62Q0.78 2.66 0.78 2.72L0.76 3.5L0.5 4.34L0.3 4.92H-0.3L-0.5 4.34L-0.76 3.5L-0.78 2.72Q-0.78 2.66 -0.74 2.62L-0.42 2.28Z",
    // the rear wing on its pillar
    "M-0.08 4.9H0.08V5.1H-0.08Z",
    "M-0.82 5.08H0.82Q0.86 5.08 0.86 5.12V5.38Q0.86 5.42 0.82 5.42H-0.82Q-0.86 5.42 -0.86 5.38V5.12Q-0.86 5.08 -0.82 5.08Z",
    // the wheels, clear of the body: front narrower, rear wider
    "M0.56 0.74H0.92Q0.96 0.74 0.96 0.78V1.42Q0.96 1.46 0.92 1.46H0.56Q0.52 1.46 0.52 1.42V0.78Q0.52 0.74 0.56 0.74Z",
    "M-0.56 0.74H-0.92Q-0.96 0.74 -0.96 0.78V1.42Q-0.96 1.46 -0.92 1.46H-0.56Q-0.52 1.46 -0.52 1.42V0.78Q-0.52 0.74 -0.56 0.74Z",
    "M0.7 3.96H1.04Q1.08 3.96 1.08 4V4.84Q1.08 4.88 1.04 4.88H0.7Q0.66 4.88 0.66 4.84V4Q0.66 3.96 0.7 3.96Z",
    "M-0.7 3.96H-1.04Q-1.08 3.96 -1.08 4V4.84Q-1.08 4.88 -1.04 4.88H-0.7Q-0.66 4.88 -0.66 4.84V4Q-0.66 3.96 -0.7 3.96Z",
  ],
  /** the cockpit opening (the tile shows through it), the helmet inside it */
  cockpit: "M0 2.06C0.16 2.06 0.22 2.2 0.22 2.4V2.86H-0.22V2.4C-0.22 2.2 -0.16 2.06 0 2.06Z",
  helmet: { cx: 0, cy: 2.5, r: 0.13 },
} as const;
const CAR_H = 0.84; // the car's length / the tile (stoutShared's CREST_MAX: no mark taller than 0.84 of its tile)
const CAR_DILATE = 0.025; // metres: a thin outline (bold, the gaps kept)
/** The car knocked out (black) of a tile of `size` at (x, y), nose up, centred. */
const CarFigure: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  const sc = (CAR_H * size) / (TOPCAR.box.y1 - TOPCAR.box.y0);
  const ox = x + size / 2;
  const oy = y + size / 2 - ((TOPCAR.box.y0 + TOPCAR.box.y1) / 2) * sc;
  return (
    <g transform={`translate(${f3(ox)} ${f3(oy)}) scale(${f3(sc)})`}>
      <g fill="#000" stroke="#000" strokeWidth={CAR_DILATE * 2} strokeLinejoin="miter">
        {TOPCAR.black.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
      <path d={TOPCAR.cockpit} fill="#fff" />
      <circle cx={TOPCAR.helmet.cx} cy={TOPCAR.helmet.cy} r={TOPCAR.helmet.r} fill="#000" />
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
// THE GRID (world px; x 0 = the frame's axis, y 0 = the pole tile's centre; y grows DOWN the grid)
// ===========================================================================
/** The front-runners' tile (Mercedes, Ferrari): ~1.43x the average small tile. */
export const BIG = 210;
/** One grid slot down a column; the right column sits half a slot behind the left. */
export const PITCH = 210;
/** The small teams' columns (the racing line between them is the light's path). */
export const COL_X = 108;
/** The front row, set aside from the racing line: the light passes between them. */
export const FRONT_X = 330;
const slotY = (pos: number) => Math.floor((pos - 1) / 2) * PITCH + ((pos - 1) % 2) * (PITCH / 2); // grid position 1..10
const slotSide = (pos: number) => ((pos - 1) % 2 === 0 ? -1 : 1);
export const FRONT_RUNNERS = [
  { figure: "mercedes" as const, x: -FRONT_X, y: slotY(1) },
  { figure: "ferrari" as const, x: FRONT_X, y: slotY(2) },
];
/** The eight smaller teams, grid positions 3 .. 10 (2018 championship order), 0.78 -> 0.62 of a big tile. */
export const SMALL = Array.from({ length: 8 }, (_, i) => {
  const pos = i + 3;
  return { i, pos, x: slotSide(pos) * COL_X, y: slotY(pos), size: Math.round(BIG * lerp(0.78, 0.62, i / 7)) };
});
const LAST = SMALL[SMALL.length - 1];
/** THE SCREEN above the front row, centred, its foot GAP above the pole tile's top edge (far enough that the
 *  end framing, which keeps the big two at the top, has the screen wholly out of frame above). */
const GAP = 300;
export const SCREEN_W = 720;
const SCREEN_H = screenBox(0, 0, SCREEN_W).outer.h;
export const SCREEN = { x: 0, y: slotY(1) - BIG / 2 - GAP - SCREEN_H / 2, w: SCREEN_W } as const;
const SB = screenBox(SCREEN.x, SCREEN.y, SCREEN.w);

// THE FRONT: the y the light has reached down the grid. At rest it is the screen's foot glow (FOOT world px
// below its bottom edge). From f0 it pours out (an even creep + an ease-in, c u + (1 - c) u^n), reaching the
// first small tile on f60 at speed V; then down the grid ONE monotone, decelerating C1 curve (a Fritsch-Carlson
// cubic) through each tile's top edge on its pass-1 frame (REACH_PLAN, the frames the words were cut to) and
// on to rest on f116 just past the last tile. (The grid's slots are evenly spaced, so the 16:9 cut's power
// curve no longer lands the plan; the spline does, exactly.) The two phases meet with the same velocity.
const FOOT = 24;
const CREEP = 0.2;
const REACH_IN = 8; // a tile is reached when the front is this far inside its top edge
const HASH = SMALL.map((_, i) => 4 * hash01(i, 4)); // a hashed offset (0-4 px) inside the front
const YR = SMALL.map((t, i) => t.y - t.size / 2 + REACH_IN + HASH[i]);
export const REACH_PLAN = [60, 65, 70, 75.5, 81.5, 87.5, 95, 104];
export const PHASE = { a0: 0, a1: 60, rest: 116 } as const;
const YS = SB.bottom + FOOT;
const YE = LAST.y + LAST.size / 2 + 30;
const KEYS: [number, number][] = [...REACH_PLAN.map((t, i) => [t, YR[i]] as [number, number]), [PHASE.rest, YE]];
const SLOPES: number[] = (() => {
  const n = KEYS.length;
  const d = KEYS.slice(1).map(([t, y], i) => (y - KEYS[i][1]) / (t - KEYS[i][0]));
  const m = KEYS.map((_, i) => (i === 0 ? d[0] : i === n - 1 ? 0 : d[i - 1] * d[i] <= 0 ? 0 : (2 * d[i - 1] * d[i]) / (d[i - 1] + d[i])));
  return m;
})();
const V = SLOPES[0];
const N_A = ((V * (PHASE.a1 - PHASE.a0)) / (YR[0] - YS) - CREEP) / (1 - CREEP);
export const front: Front = (f) => {
  if (f <= PHASE.a1) {
    const u = clamp01((f - PHASE.a0) / (PHASE.a1 - PHASE.a0));
    return YS + (YR[0] - YS) * (CREEP * u + (1 - CREEP) * Math.pow(u, N_A));
  }
  if (f >= PHASE.rest) return YE;
  let i = 0;
  while (i < KEYS.length - 2 && f > KEYS[i + 1][0]) i++;
  const [t0, y0] = KEYS[i];
  const [t1, y1] = KEYS[i + 1];
  const h = t1 - t0;
  const u = (f - t0) / h;
  const h00 = 2 * u ** 3 - 3 * u ** 2 + 1;
  const h10 = u ** 3 - 2 * u ** 2 + u;
  const h01 = -2 * u ** 3 + 3 * u ** 2;
  const h11 = u ** 3 - u ** 2;
  return h00 * y0 + h10 * h * SLOPES[i] + h01 * y1 + h11 * h * SLOPES[i + 1];
};
/** Reach frames (= REACH_PLAN, to bisection precision). */
export const REACH: number[] = SMALL.map((_, i) => reachFrame((f) => front(f) - YR[i], 0, DURATION));

// THE SPOT: as the front settles, the light narrows onto the last tile: the band eases down to SPOT.low
// while a round spot gathers on the underdog (f96 -> f120, never a flash); the tiles the band leaves sit a
// touch deeper amber in step (SmallTeamTile `deep`, a gentle falloff with distance from the underdog).
export const SPOT = { f0: 96, f1: 120, low: 0.3, r: 1.25 * LAST.size, sigma: 0.75 * PITCH } as const;
export const focusAt = (f: number) => smoothstep((f - SPOT.f0) / (SPOT.f1 - SPOT.f0));
export const deepAt = (x: number, y: number, f: number) => focusAt(f) * (1 - Math.exp(-(Math.pow(x - LAST.x, 2) + Math.pow(y - LAST.y, 2)) / Math.pow(SPOT.sigma, 2)));

// THE LIGHT (cut C's GroundLight, AreWeDoingThis.tsx, re-aimed as a FALLING band): A's DTS_LIGHT amber
// screen-blended on the floor under the world, from under the screen (fading in from its centre to its foot)
// down the racing line to a crisp, softly rounded front (edge blur EDGE_SOFT screen px), A's falloff a0 ->
// toward a1 along it. Its width covers both columns of small teams and falls off before the front row.
const BAND_X = { x0: -250, x1: 250, fade: 60 } as const;
const EDGE_SOFT = 9;
const FallingLight: React.FC<{ y1: number; k: number; f: number }> = ({ y1, k, f }) => {
  const uid = `fl${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const yl = SCREEN.y;
  const yr = SB.bottom;
  if (y1 - yr < 2) return null;
  const pad = (4 * EDGE_SOFT) / k;
  const w = BAND_X.x1 - BAND_X.x0;
  const fxs = BAND_X.fade / w;
  const rr = Math.min(150, (y1 - yl) / 2);
  const at = (y: number) => f3(clamp01((y - yl) / (y1 - yl)));
  const c = `rgb(${DTS_LIGHT.color})`;
  const s = lerp(1, SPOT.low, focusAt(f));
  const spot = focusAt(f);
  return (
    <g style={{ mixBlendMode: "screen" }}>
      <defs>
        <linearGradient id={`${uid}v`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(yl)} x2="0" y2={f3(y1)}>
          <stop offset="0" stopColor={c} stopOpacity="0" />
          <stop offset={at(yr)} stopColor={c} stopOpacity={f3(DTS_LIGHT.a0 * s)} />
          <stop offset={at(lerp(yr, y1, 0.65))} stopColor={c} stopOpacity={f3(lerp(DTS_LIGHT.a0, DTS_LIGHT.a1, 0.3) * s)} />
          <stop offset="1" stopColor={c} stopOpacity={f3(((DTS_LIGHT.a0 + DTS_LIGHT.a1) / 2) * s)} />
        </linearGradient>
        <linearGradient id={`${uid}h`} gradientUnits="userSpaceOnUse" x1={f3(BAND_X.x0)} y1="0" x2={f3(BAND_X.x1)} y2="0">
          <stop offset="0" stopColor="#000" />
          <stop offset={f3(fxs)} stopColor="#fff" />
          <stop offset={f3(1 - fxs)} stopColor="#fff" />
          <stop offset="1" stopColor="#000" />
        </linearGradient>
        <mask id={`${uid}m`} maskUnits="userSpaceOnUse" x={f3(BAND_X.x0 - pad)} y={f3(yl - pad)} width={f3(w + 2 * pad)} height={f3(y1 - yl + 2 * pad)}>
          <path d={rectPath(BAND_X.x0, yl - 200, w, y1 - yl + 200, rr)} fill={`url(#${uid}h)`} style={{ filter: `blur(${f3(EDGE_SOFT / k)}px)` }} />
        </mask>
        <radialGradient id={`${uid}s`} gradientUnits="userSpaceOnUse" cx={f3(LAST.x)} cy={f3(LAST.y)} r={f3(SPOT.r)}>
          <stop offset="0" stopColor={c} stopOpacity={f3(DTS_LIGHT.a0 * spot)} />
          <stop offset="0.6" stopColor={c} stopOpacity={f3(DTS_LIGHT.a0 * 0.75 * spot)} />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={f3(BAND_X.x0 - pad)} y={f3(yl)} width={f3(w + 2 * pad)} height={f3(y1 - yl + pad)} fill={`url(#${uid}v)`} mask={`url(#${uid}m)`} />
      {spot > 0.002 ? <circle cx={f3(LAST.x)} cy={f3(LAST.y)} r={f3(SPOT.r)} fill={`url(#${uid}s)`} /> : null}
    </g>
  );
};

// ===========================================================================
// THE CAMERA (dtsShared dtsCameraTrackP: look lands on screen y 835)
// ===========================================================================
const CARD_HALF = (SB.face.w * CARD_FRAC) / 2;
const BIG_TOP = slotY(1) - BIG / 2;
/** f0: the screen at the top of the frame (its top at y 215), the front row and the first rows below. */
const K0 = 1.06;
const CAM_0 = camForP(0, SB.top, 540, 215, K0);
/** the end: the underdog at y 1175, the dim big two still readable at the top (their top at y 215). */
const UNDERDOG_SY = 1175;
const BIG_TOP_SY = 215;
const K_END = (UNDERDOG_SY - BIG_TOP_SY) / (LAST.y - BIG_TOP);
const CAM_END = camForP(0, LAST.y, 540, UNDERDOG_SY, K_END);
export const CAM_START = { x: 0, y: lookOfP(CAM_0), k: K0 };
export const GLIDES: Glide[] = [
  // 1. the creep on the screen while its light gathers
  { f0: -10, f1: 40, k: K0 * 1.015 },
  // 4. tilt down with the falling light, pulling back a touch
  { f0: 30, f1: 108, dy: lookOfP(CAM_END) - CAM_START.y, k: K_END * 0.985, warp: 1.15 },
  // 5. the end creep on the settled spot, the big two still in frame
  { f0: 96, f1: 140, k: K_END * 1.012 },
];
export const CAM = dtsCameraTrackP(CAM_START, GLIDES, DURATION, 12);
export const camAt = (f: number) => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];
/** THE SWEEP: the one click, across the last tile, its band crossing centre on "underdog". */
export const SWEEP_F = { f0: 116, f1: 128 } as const;

// the cream subject pool: follows the light's front down the grid, lagged by the house damper
const POOL: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  let y = SB.bottom;
  let v = 0;
  for (let f = 0; f < DURATION + 2; f++) {
    v = v + (Math.max(SB.bottom, front(f) - 80) - y) * 0.09 - v * 0.468;
    y += v;
    out.push({ x: 0, y });
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
  const band = dtsAmberBandP(cam);
  const sweep = clamp01((f - SWEEP_F.f0) / (SWEEP_F.f1 - SWEEP_F.f0));
  const r = GEO.RADIUS * (LAST.size / GEO.TILE);
  return (
    <DtsStage orientation="portrait" S={f} cam={cam} rest={CAM[0]} pool={POOL[Math.min(POOL.length - 1, f)]}>
      <FallingLight y1={front(f)} k={k} f={f} />
      <Screen x={SCREEN.x} y={SCREEN.y} w={SCREEN.w} k={k} band={band} on={1} />
      {FRONT_RUNNERS.map((t) => (
        <DtsTile key={t.figure} x={t.x} y={t.y + BIG / 2} size={BIG} k={k} figure={t.figure} dim={1} />
      ))}
      {SMALL.map((t, i) => (
        <SmallTeamTile key={t.i} x={t.x} y={t.y + t.size / 2} size={t.size} k={k} amber={toneAt(REACH[i], f)} deep={deepAt(t.x, t.y, f)} band={band} />
      ))}
      <LightSweep x={LAST.x - LAST.size / 2} y={LAST.y - LAST.size / 2} w={LAST.size} h={LAST.size} k={k} t={sweep} on="amber" r={r} />
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
  // the front: C1 at the hand-over, an ease-in no steeper than u^6.2, monotone
  const vA = (front(PHASE.a1) - front(PHASE.a1 - 0.01)) / 0.01;
  const vB = (front(PHASE.a1 + 0.01) - front(PHASE.a1)) / 0.01;
  if (Math.abs(vA - vB) > 0.3) fail(`the front's hand-over is not smooth (${vA.toFixed(2)} vs ${vB.toFixed(2)})`);
  if (N_A > 6.2 || N_A < 1.5) fail(`the light's pour-out ease is u^${N_A.toFixed(2)}`);
  // the small tiles turn on their words (the pass-1 frames), the front monotone and decelerating down the grid
  REACH.forEach((rch, i) => {
    if (Math.abs(rch - REACH_PLAN[i]) > 0.1) fail(`tile ${i + 1} reached f${rch.toFixed(1)} (plan f${REACH_PLAN[i]})`);
  });
  for (let f = 1; f <= PHASE.rest; f++) if (front(f) < front(f - 1) - 1e-6) fail(`the front goes back on f${f}`);
  if (V > 36) fail(`the front reaches the grid at ${V.toFixed(1)} px/f`);
  // the big two read big; they stand clear of the light's band; the grid's tiles never touch
  const avg = SMALL.reduce((sum, t) => sum + t.size, 0) / SMALL.length;
  if (BIG / avg < 1.4) fail(`the big two are only ${(BIG / avg).toFixed(2)}x the small tiles`);
  if (FRONT_X - BIG / 2 < BAND_X.x1 - BAND_X.fade / 2) fail("the light's band reaches the front row");
  if (COL_X + SMALL[0].size / 2 > BAND_X.x1 - BAND_X.fade) fail("a small tile stands outside the light's full band");
  if (PITCH < BIG / 2 + SMALL[0].size / 2 + 16) fail("the left column's tiles touch");
  // the camera: |dv| <= 2.5, <= 45 px/f; the front <= 45 screen px/f relative to the frame
  const j = camJerk(CAM, DURATION);
  if (j.maxA > 2.5) fail(`camera |dv| ${j.maxA.toFixed(2)} at f${j.at}`);
  if (j.maxV > 45) fail(`camera speed ${j.maxV.toFixed(1)} px/f`);
  for (let f = 1; f < DURATION; f++) {
    const a = toScreenP(camAt(f - 1), 0, front(f - 1)).y;
    const b = toScreenP(camAt(f), 0, front(f)).y;
    if (Math.abs(b - a) > 45) fail(`the front moves ${Math.abs(b - a).toFixed(1)} screen px on f${f}`);
  }
  // framing on every frame: the big two inside the side margins and the band's top; the last tile above
  // y 1400; f0-30 the screen inside the band, f0-40 the DTS card wholly in frame
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    if (toScreenP(c, FRONT_X + BIG / 2, 0).x > 1080 - SAFE_P.side) fail(`Ferrari crosses the side margin at f${f}`);
    if (toScreenP(c, 0, BIG_TOP).y < SAFE_P.top - 1) fail(`the big two leave the band at f${f}`);
    if (toScreenP(c, 0, LAST.y + LAST.size / 2).y > SAFE_P.bottom && f >= 100) fail(`the last tile is below y 1400 at f${f}`); // from f100 (it is reached f104)
    if (f <= 40 && toScreenP(c, -CARD_HALF, 0).x < SAFE_P.side) fail(`the DTS card is cut at f${f}`);
    if (f <= 30 && toScreenP(c, 0, SB.top).y < SAFE_P.top - 1) fail(`the screen's top leaves the band at f${f}`);
    // f0-40: the card wholly in frame while the camera starts to tilt down (DTS readable on "Drive to Survive")
    if (f <= 40 && toScreenP(c, 0, SCREEN.y - (CARD_HALF * DTS_CARD_PX.h) / DTS_CARD_PX.w).y < 24) fail(`the DTS card leaves the frame at f${f}`);
  }
  const cE = camAt(DURATION - 1);
  const uy = toScreenP(cE, 0, LAST.y).y;
  if (uy < 1100 || uy > 1250) fail(`the underdog ends at y ${uy.toFixed(0)}`);
}
