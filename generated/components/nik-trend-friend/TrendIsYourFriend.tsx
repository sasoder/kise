// ---------------------------------------------------------------------------
// TrendIsYourFriend (nik-trend-friend, cut 18). Cheeky Pint style (stout board) (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 113 frames. Palette B1 (the stoutShared default).
// World: the clip's chart, betCurves.tsx (builder A's; imported, never edited). Same chart as cuts A and B.
//
// CHECK LINE: "The slope a product shows in its first two months is the slope it keeps: project the early line
// forward and the product runs straight along it."
//
// THE LINE (Nik Storonsky): "The thing is growing [in, uh] very quickly first [couple] of months, it will continue to
// grow very quickly."
// WORD -> FRAME: The 0 · thing 3 · is 8 · growing 11 · very 33 · quickly 44 · first 52 · of 66 · months 71 · it 78 ·
// will 83 · continue 85 · to 92 · grow 95 · very 98 · quickly 102.
// DURATION: the slot 18.018 -> 22.731 s = 4.713 s x 23.976 = 113 frames (f0..f112).
//
// THE MOTION (rev 1): the 40 earlier bets are fully drawn and dimmed (months 0..12). Revolut's product (the R tile,
// amber from the start: it is the signal) climbs out of the origin on one straight, steep line (revenue = SLOPE x
// month) at one constant speed for the whole cut (month 0.8 at f0, 2 at f28, ~5.6 at f112). As its tile passes month 1
// (lit f1-9) and month 2 (lit f24-33) that numeral lifts from the lo tone to cream (derived from the tile's month; both
// in frame and lit through "first couple of months", f52-71; tracking phase f50 -> f112). From the pass of
// month 2 (starting f23 at the tile's top edge) a thin dashed cream projection of its own months-0-2 slope shoots
// ahead of it, drawn by a moving tip ~2.3x the tile's speed (off the top of frame ~f45, ends at month 9, never caught);
// the tile runs on exactly along it, its amber line covering the dashes. Camera, one move in two phases: f0 -> ~f60 a
// pull-back around the origin (k ~1.17 -> 0.53) to the frame of "first couple of months" (lit 1 and 2, the short
// steep line, the tile, a long run of dashes); then the zoom settles and the camera tracks the tile up the dashed line
// (~15 px/f): the axis sinks out of the bottom after f71, the pack lines sweep down-left past the tile, the dashes
// stream into it. The tile holds ~x 640, y 480-490 on screen, ~100 px, still running at the last frame.
// AMBER = the signal that a bet is working (traction); cream = the product / the projection; board = the pack.
//
// NO DATA: proxy shapes only (the pack and the product are unlabelled shapes). SOURCES: none. No numbers on screen;
// the only text is the chart's own axis (month numerals, MONTHS SINCE LAUNCH). Revolut's R: revolutMark.ts
// (Wikimedia Commons, PD).
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { ALPHA, COLOR, EDGE, FONT_NUM, GEO, SPACE, StoutStage, amberBandFor, bloomFilter, clamp01, mixHex, rectPath, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow } from "../kits/cheeky-pint/museShared";
import { camEase, type Cam, type Glide } from "../kits/dwarkesh/outgrowShared";
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { AXIS_Y, Axis, PackFan, axisPx, lineWeight, monthX, pathTo, samplerOf } from "./betCurves";
import { REVOLUT_R_BOX, REVOLUT_R_D } from "./revolutMark";

export const FPS = 24000 / 1001;
export const DURATION = 113;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const n6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();

// --- the product: one straight line out of the origin, steeper than the whole pack ---------------------------------
/** Revenue per month (world px). The pack's front line averages ~420 over months 0-2, its body ~180. */
export const SLOPE = 650;
export const PRODUCT = (m: number) => SLOPE * m;
const PRODUCT_AT = samplerOf(PRODUCT);

// --- the month clock: one constant speed for the whole cut ----------------------------------------------------------
export const M0 = 0.8; // f0: already off the origin and climbing
export const F_M2 = 28; // the tile reaches month 2 (f28); month 1 at ~f5; month ~5.6 at f112
export const RATE = (2 - M0) / F_M2;
export const monthAt = (f: number) => M0 + RATE * f;

// --- the projection: the dashed trend of months 0-2, drawn ahead by a moving tip ------------------------------------
export const PROJ_M0 = 2;
export const PROJ_M1 = 9; // far past the frame's top at every frame: the tile never catches its end
const PROJ_F0 = F_M2 - 5; // starts at the tile's top edge, so its first dash clears the tile on the pass of month 2
const PROJ_RATE = 0.1; // months per frame at full speed (~45 px/f on screen at k 0.7)
const PROJ_RAMP = 5; // frames of ease-in from the tile
/** The projection's tip month: eases in from the tile, then runs at constant speed to PROJ_M1. */
export const projTip = (f: number) => {
  const t = f - PROJ_F0;
  if (t <= 0) return PROJ_M0;
  const run = t < PROJ_RAMP ? (t * t) / (2 * PROJ_RAMP) : t - PROJ_RAMP / 2;
  return Math.min(PROJ_M1, PROJ_M0 + PROJ_RATE * run);
};
/** Dash pattern in world px (fixed in the world, so the dashes never crawl). */
const DASH = [46, 34];

// --- the camera: one continuous move in two phases -------------------------------------------------------------
// Phase 1 (f0 -> ~f60): two overlapping glides pull back around the origin (k ~1.17 -> 0.53) until the frame holds
// the lit 1 and 2, the short steep line, the tile and a long stretch of dashes. Phase 2 (~f50 -> f112): the zoom
// eases out to a constant k 0.53 and a tracking term (its velocity eased in over TRACK_F0..TRACK_F1, then constant)
// carries the look up and right with the tile, a touch slower in y than the tile so it keeps climbing a little on
// screen. All of it through the house damped follower (CAM_STIFF / CAM_DAMP). Keyed, not derived from the tile.
const GLIDES: Glide[] = [
  { f0: -30, f1: 55, dx: 150, dy: -405, k: 0.75 },
  { f0: 5, f1: 75, dx: 70, dy: -600, k: 0.53 },
];
const START = { x: 130, y: -475, k: 1.32 };
const TRACK_F0 = 50;
const TRACK_F1 = 76;
/** World px per frame of the tracking term: the tile moves (6.43, -27.9) per frame. */
const TRACK_V = { x: 6.3, y: -27.2 };
const PRE = 40;
const CAM_TRACK: Cam[] = (() => {
  const T: Cam[] = [];
  let ox = 0;
  let oy = 0;
  for (let f = -PRE; f <= DURATION + 4; f++) {
    let x = START.x;
    let y = START.y;
    let lk = Math.log(START.k);
    let kPrev = START.k;
    for (const g of GLIDES) {
      const e = camEase((f - g.f0) / (g.f1 - g.f0));
      x += (g.dx ?? 0) * e;
      y += (g.dy ?? 0) * e;
      if (g.k !== undefined) {
        lk += (Math.log(g.k) - Math.log(kPrev)) * e;
        kPrev = g.k;
      }
    }
    const r = smoothstep((f - TRACK_F0) / (TRACK_F1 - TRACK_F0));
    ox += TRACK_V.x * r;
    oy += TRACK_V.y * r;
    T.push({ x: x + ox, y: y + oy, k: Math.exp(lk) });
  }
  const out: Cam[] = [];
  let c = { ...T[0] };
  let v = { x: 0, y: 0, k: 0 };
  for (let i = 0; i < T.length; i++) {
    if (i > 0) {
      const t = T[i];
      v = { x: v.x + (t.x - c.x) * CAM_STIFF - v.x * CAM_DAMP, y: v.y + (t.y - c.y) * CAM_STIFF - v.y * CAM_DAMP, k: v.k + (t.k - c.k) * CAM_STIFF - v.k * CAM_DAMP };
      c = { x: c.x + v.x, y: c.y + v.y, k: c.k + v.k };
    }
    out.push({ ...c });
  }
  return out.slice(PRE);
})();
export const CAM = {
  at: (f: number): Cam => {
    const a = Math.max(0, Math.min(CAM_TRACK.length - 2, Math.floor(f)));
    const t = Math.max(0, Math.min(1, f - a));
    const A = CAM_TRACK[a];
    const B = CAM_TRACK[a + 1];
    return { x: A.x + (B.x - A.x) * t, y: A.y + (B.y - A.y) * t, k: A.k + (B.k - A.k) * t };
  },
  rest: CAM_TRACK[0],
};

/** The product tile, tracked on screen (world size = TILE_PX / k). */
const TILE_PX = 100;

// --- a lit numeral: drawn over the axis's own numeral, same font and place -----------------------------------------
const TICK_PX = 12; // betCurves' Axis: tick length (screen px)
const LitNumeral: React.FC<{ n: number; k: number; lit: number }> = ({ n, k, lit }) => {
  if (lit <= 0.002) return null;
  const px = axisPx(k);
  const base = AXIS_Y + (TICK_PX + SPACE.AXIS + 0.729 * px) / k;
  return (
    <text
      x={n6(monthX(n))}
      y={n6(base)}
      fontFamily={FONT_NUM}
      fontWeight={700}
      fontSize={n6(px / k)}
      textAnchor="middle"
      fill={mixHex(COLOR.inkCreamLo, COLOR.cream, clamp01(lit))}
      style={{ fontFeatureSettings: '"lnum" 1, "tnum" 1' }}
    >
      {n}
    </text>
  );
};
/** A numeral lifts to cream as the tile's centre passes over its month (~5 f either side of the pass). */
const litFor = (n: number, m: number) => smoothstep((m - n + 0.2) / 0.4);

// --- the projection ------------------------------------------------------------------------------------------------
const Projection: React.FC<{ tip: number; k: number }> = ({ tip, k }) => {
  if (tip <= PROJ_M0 + 1e-4) return null;
  const a = PRODUCT_AT(PROJ_M0);
  const b = PRODUCT_AT(tip);
  const d = `M${n6(a.x)} ${n6(a.y)}L${n6(b.x)} ${n6(b.y)}`;
  const w = 6 / k;
  return (
    <g>
      <UnionShadow sil={[{ d, stroke: w }]} s={0.3} elevation="rest" strength={0.8} />
      <path d={d} fill="none" stroke={COLOR.cream} strokeWidth={n6(w)} strokeLinecap="round" strokeDasharray={DASH.join(" ")} />
    </g>
  );
};

// --- the product: its amber line from the origin and the R tile at its tip (BetLine's paint, a tracked tile) -------
const Product: React.FC<{ month: number; k: number; band: [number, number]; lift?: number }> = ({ month, k, band, lift = 0 }) => {
  const uid = `ty${useId().replace(/[^A-Za-z0-9_-]/g, "_")}`;
  const d = pathTo(PRODUCT_AT, month, 0.05);
  const e = PRODUCT_AT(month);
  const W = lineWeight(k);
  const T = TILE_PX / k;
  const R = (GEO.RADIUS * T) / GEO.TILE;
  const tx = e.x - T / 2;
  const ty = e.y - T / 2;
  const tileD = rectPath(tx, ty, T, T, R);
  const markH = 0.54 * T;
  const sc = markH / REVOLUT_R_BOX.h;
  const bandAt = (y: number) => clamp01((y - band[0]) / (band[1] - band[0]));
  return (
    <g>
      <UnionShadow sil={[{ d, stroke: W }, { d: tileD }]} s={(1.1 * T) / 120} elevation="rest" lift={lift} />
      <defs>
        <linearGradient id={`${uid}a`} gradientUnits="userSpaceOnUse" x1="0" y1={n6(band[0])} x2="0" y2={n6(band[1])}>
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={COLOR.amberFoot} />
        </linearGradient>
        <linearGradient id={`${uid}c`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mixHex(COLOR.amberTop, COLOR.amberFoot, bandAt(ty))} />
          <stop offset="1" stopColor={mixHex(COLOR.amberTop, COLOR.amberFoot, bandAt(ty + T))} />
        </linearGradient>
        <linearGradient id={`${uid}hf`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
      </defs>
      <g style={{ filter: bloomFilter(k) }}>
        <path d={d} fill="none" stroke={COLOR.amberTop} strokeWidth={n6(W)} strokeLinecap="round" strokeLinejoin="round" />
        <path d={tileD} fill={COLOR.amberTop} />
      </g>
      <path d={d} fill="none" stroke={`url(#${uid}a)`} strokeWidth={n6(W)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={d} fill="none" stroke={COLOR.amberHot} strokeOpacity={0.42} strokeWidth={n6(W * 0.16)} strokeLinecap="round" strokeLinejoin="round" />
      <path d={tileD} fill={`url(#${uid}c)`} />
      <path d={rectPath(tx, ty, T, EDGE.HOT_FALL / k, R, true, false)} fill={`url(#${uid}hf)`} />
      <path d={`M${n6(tx + R)} ${n6(ty + EDGE.HOT / k / 2)}H${n6(tx + T - R)}`} stroke={COLOR.amberHot} strokeWidth={n6(EDGE.HOT / k)} />
      <path d={REVOLUT_R_D} fill={COLOR.inkDark} fillRule="evenodd" transform={`translate(${n6(e.x - (REVOLUT_R_BOX.w * sc) / 2)} ${n6(e.y - markH / 2)}) scale(${n6(sc)})`} />
    </g>
  );
};

/** The pack's dim: context, sunk toward the ground by tone (never opacity). */
const PACK_DIM = 0.45;

const TrendIsYourFriend: React.FC<z.infer<typeof schema>> = () => {
  const S = useCurrentFrame();
  const cam = CAM.at(S);
  const k = cam.k;
  const m = monthAt(S);
  const tip = PRODUCT_AT(m);
  return (
    <StoutStage S={S} cam={cam} rest={CAM.rest} pool={{ x: tip.x - 40, y: tip.y + 260, strength: 1.4 }}>
      {/* no REVENUE up the origin (as in cut A): it would stand in the lower caption band */}
      <Axis k={k} yTitle={false} />
      <LitNumeral n={1} k={k} lit={litFor(1, m)} />
      <LitNumeral n={2} k={k} lit={litFor(2, m)} />
      <PackFan month={12} k={k} dim={PACK_DIM} />
      <Projection tip={projTip(S)} k={k} />
      <Product month={m} k={k} band={amberBandFor(cam)} lift={0.5} />
    </StoutStage>
  );
};

export default TrendIsYourFriend;
