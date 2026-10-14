import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF } from "./fieldShared";
import type { Cam, Glide } from "./outgrowShared";
import {
  ALPHA,
  AmberGradient,
  COLOR,
  EDGE,
  GEO,
  Label,
  LightSweep,
  SPACE,
  StoutStage,
  METRIC,
  amberBandFor,
  bloomFilter,
  labelWidth,
  clamp01,
  lerp,
  mixHex,
  rectPath,
  smoothstep,
  toScreen,
} from "./stoutShared";

import { AFRAME, CUT1_DURATION, CUT1_SETTLED_CAM, DECK_SLOT, SHIP, SHIP_STATION, Sea, SurveyShip, bobAt, shipToWorld, trackCentred } from "./droneShipShared";

// ===========================================================================
// ShipDayRate — cut 2 of the Cheeky Pint S4E02 clip "will - $50k drone vs $5m navy drone" (Will O'Brien,
// Ulysses), delivered as 14_ShipDayRate.mov. Stout system (stoutShared.tsx), the clip's ship
// (droneShipShared.tsx, imported, never redrawn). 1080x1920, 23.976 fps, opaque, palette B1.
//
// CHECK LINE: "Once you have the ship, every single day it's out at sea runs up a huge bill."
//
// THE LINE: "[Once you even get the ship,] you're chartering it at an order of maybe a few hundred thousand
// dollars a day." Sequence 14.973-18.518 s: slot 85 f + a 16-f living tail = 101.
// ONSETS (f): chartering 1 · it 16 · at 17 · an 24 · order 33 · of 37 · maybe 41 · a 44 · few 48 · hundred 51 ·
// thousand 56 · dollars 62 · a 71 · day 77. Slot ends f85.
//
// ONE MOTION: one day passes over the same ship on the same sea (cut 1's settled framing, without its tiles):
// a flat cream sun rises from behind the horizon on the left and crosses the sky on one arc, setting behind
// the horizon on the right on "day". Locked to it, an amber column climbs at a constant rate out of a slot in
// the ship's aft deck — the bill running up — easing only into its top on "day", when the one light sweep runs
// up it. It ends about as tall as the ship is long (twice the ship's height). The camera barely moves (the
// director's framing: the whole ship stays above the caption bands, y < 1060, on every frame): it opens on cut
// 1's settled framing leaned 50 px toward the sunrise, then drifts 100 px with the sun toward its set (the bow
// ends ~30 px off the left edge), follows the top up a touch and creeps. Dusk: the
// column stands glowing over the ship. One label identifies the unit ("$ / DAY"); no numerals (the speaker's figure
// is an unverified estimate).
//
//   f -1..8   the sun (a flat cream disc with eight stubby rays) rises straight up from behind the horizon left
//             of the bow, wholly in frame; it crosses the sky on one arch at one constant speed
//   f 0..2    the slot is cut into the aft work deck; the column leaves it at speed on f1
//   f 1..67   the column climbs at one constant rate (the sun's arc is constant too)
//   f 49..55  the sun passes BEHIND the column, below its top
//   f 67..77  the column eases into its top (at screen y ~275); the sun sinks straight down behind the horizon
//             right of the stern's A-frame, wholly in frame (centre on the waterline f76), gone by ~f78
//   f 10..22  "$ / DAY" (46 px, cream) blurs in standing on the column's top, and rides it up all the way
//   f 75..89  THE ONE CLICK: the light sweep runs up the column
//   f 56..90  dusk: the ground's tone falls a touch (tone, never opacity on the subject)
//   f 77..100 the living frame: the camera's slow creep and drift, the bob, the pool resting on the column, grain
// ===========================================================================

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 85;
export const TAIL = 16;
export const DURATION = SLOT_FRAMES + TAIL; // 101

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f2 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `sd${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;

// --- the ship (cut 1's station) ------------------------------------------------------------------------
/** The story clock: cut 1's bob phase continues (the ship never stopped bobbing while the speaker talked). */
const clockOf = (f: number) => f + CUT1_DURATION;
const SX = SHIP_STATION.x;
const WL = SHIP_STATION.wl;

// --- the column (SHIP-LOCAL px: x from the bow tip, y up from the waterline = negative) -----------------
/** The column stands in the deck slot, the slot's width; it ends ~0.76 x the ship's length tall (~1.85 x its
 *  height), its top on screen y ~275 (the director's framing). */
const COL = { x: DECK_SLOT.x, w: DECK_SLOT.w, foot: DECK_SLOT.y, H: 680 } as const;
const RISE = { f0: 1, fd: 67, f1: 77 } as const; // leaves the slot at speed / starts easing / tops out
const EASE_D = RISE.f1 - RISE.fd;
/** The constant climb rate (world px / f): the whole height = v x (fd - f0) + v x EASE_D / 2. */
const V = COL.H / (RISE.fd - RISE.f0 + EASE_D / 2);
/** The column's height at frame f: a constant climb from f0, then a velocity that falls on a smoothstep to 0
 *  on f1 (C1: the acceleration starts and ends at 0). */
export const colH = (f: number) => {
  if (f <= RISE.f0) return 0;
  if (f <= RISE.fd) return V * (f - RISE.f0);
  const s = clamp01((f - RISE.fd) / EASE_D);
  return V * (RISE.fd - RISE.f0) + V * EASE_D * (s - (s * s * s - (s * s * s * s) / 2));
};
const SLOT_OPEN: [number, number] = [0, 2];

// --- the sun (WORLD px): one arch across the sky at ONE constant speed, from the horizon left of the bow to the
// horizon right of the stern's A-frame. Its path is a rounded arch (a superellipse: it leaves and meets the horizon
// vertically, so it rises clear of the bow and sinks clear of the A-frame, and it crosses the sky over the
// superstructure), walked by arc length so its speed never changes. Clipped at the waterline: it sinks behind the
// horizon, never fades. Wholly in frame on every frame (the camera's lean and drift make the room at each end). --
const SUN = {
  r: 26, // the disc
  xRise: SX - 90, // left of the bow's overhang: it clears the bow (rays included)
  xSet: SX + 982, // right of the stern's A-frame (its beam ends at local 910): it clears it
  ry: 440, // the arch's height above the waterline: over the radome, under the column's top when it passes it
  p: 0.4, // the arch's squareness: |cos|^p across, |sin|^q up (1 = an ellipse)
  q: 0.5,
  tRise: 3, // the centre crosses the waterline (rising)
  tSet: 76, // ... and (setting), on "day"
} as const;
/** The arch, sampled, with its cumulative length (one walk at constant speed). */
const SUN_PATH = (() => {
  const cx = (SUN.xRise + SUN.xSet) / 2;
  const rx = (SUN.xSet - SUN.xRise) / 2;
  const n = 2400;
  const pts: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const th = (Math.PI * i) / n;
    const c = Math.cos(th);
    const p = { x: cx - rx * Math.sign(c) * Math.pow(Math.abs(c), SUN.p), y: WL - SUN.ry * Math.pow(Math.sin(th), SUN.q) };
    const prev = pts[i - 1];
    pts.push({ ...p, s: prev ? prev.s + Math.hypot(p.x - prev.x, p.y - prev.y) : 0 });
  }
  return pts;
})();
const SUN_LEN = SUN_PATH[SUN_PATH.length - 1].s;
export const sunAt = (f: number) => {
  const d = (SUN_LEN * (f - SUN.tRise)) / (SUN.tSet - SUN.tRise);
  // before the rise and after the set it carries on straight down, under the horizon (the arch's own tangent)
  if (d <= 0) return { x: SUN.xRise, y: WL - d };
  if (d >= SUN_LEN) return { x: SUN.xSet, y: WL + (d - SUN_LEN) };
  let lo = 0;
  let hi = SUN_PATH.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (SUN_PATH[m].s < d) lo = m;
    else hi = m;
  }
  const A = SUN_PATH[lo];
  const B = SUN_PATH[hi];
  const t = (d - A.s) / Math.max(1e-9, B.s - A.s);
  return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t) };
};
const SUN_FILL = mixHex(COLOR.cream, COLOR.amberHot, 0.4); // warm cream: lit, never amber
const SUN_HALO = { r: 3.2, a: 0.16, color: "255,214,170" } as const; // the pool's warm light, gentler
/** Eight short stubby rays, round caps, static, the disc's flat cream: so it reads as the SUN (not a coin or a
 *  moon). Radii in disc radii; RAY.out is the sun's whole reach (its clearances use it). */
const RAY = { n: 8, in: 1.3, out: 1.74, w: 0.22 } as const;
const SUN_REACH = SUN.r * RAY.out;

// --- dusk: the ground's tone falls a touch as the sun goes down ----------------------------------------------
const DUSK = { f0: 56, f1: 90, a: 0.2 } as const;
const duskAt = (f: number) => smoothstep((f - DUSK.f0) / (DUSK.f1 - DUSK.f0));

// --- the click and the label ----------------------------------------------------------------------------------
const SWEEP_F: [number, number] = [75, 89];
const LABEL_IN: [number, number] = [10, 22]; // early: the unit is known while the bill climbs
const LABEL_TEXT = "$ / DAY";
/** The label's size (SCREEN px): above the LABEL token, by the director's note (it must read on a phone). */
const LABEL_PX = 46;
/** The label stands on the column's top like a chart's value label (SPACE.VALUE over it), centred on it, nudged
 *  NUDGE world px toward the bow so it clears the A-frame while the column is still short. */
const LABEL_NUDGE = 22;

// --- the camera: nearly static. Cut 1's settled framing leaned left, then one gentle drift with the sun --------
/** Cut 1's settled framing leaned LEAN px left (the picture sits LEAN px right on screen: room for the sunrise left
 *  of the bow); then one slow drift of DRIFT px the other way as the sun crosses (room for its set right of the
 *  stern; the bow ends ~30 px off the frame's left edge). */
const LEAN = 50;
const DRIFT = 100;
const CAM0: Cam = { ...CUT1_SETTLED_CAM, x: CUT1_SETTLED_CAM.x - LEAN };
/** A touch of upward follow with the rising top (world px: the picture slides DOWN this much on screen). */
const FOLLOW_UP = 12;
/** The creep: a slow zoom about a point between the ship and the column (it barely moves the waterline). */
const CREEP_K = 1.014;
const CREEP_AT = { x: SX + SHIP.L / 2, y: WL - 160 };
const GLIDES: Glide[] = [
  { f0: -6, f1: 86, dy: -FOLLOW_UP, warp: 0.9 },
  { f0: 14, f1: 64, dx: DRIFT },
  { f0: 30, f1: 160, k: CAM0.k * CREEP_K, dx: (CREEP_AT.x - CAM0.x) * (1 - 1 / CREEP_K), dy: (CREEP_AT.y - CAM0.y) * (1 - 1 / CREEP_K), warp: 1 },
];
export const CAM: Cam[] = trackCentred(CAM0, GLIDES, DURATION, 30);
export const camAt = (f: number): Cam => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];

/** The column's top centre (WORLD, bobbing) and its foot. */
const colTopWorld = (f: number) => shipToWorld(SX, WL, clockOf(f), COL.x, COL.foot - colH(f));
const colMidWorld = (f: number) => shipToWorld(SX, WL, clockOf(f), COL.x, COL.foot - colH(f) / 2);

// --- the light pool: on the ship and the column, drawn a little toward the sun; a damped follow ---------------
const poolTarget = (f: number) => {
  const m = colMidWorld(Math.max(0, f));
  const s = sunAt(Math.max(0, Math.min(SUN.tSet, f)));
  const base = { x: lerp(CAM0.x, m.x, 0.6), y: lerp(WL - 200, m.y, clamp01(colH(f) / 500)) };
  const toSun = 0.22 * (1 - duskAt(f));
  return { x: lerp(base.x, s.x, toSun), y: lerp(base.y, s.y, toSun) };
};
const POOL: { x: number; y: number }[] = (() => {
  const out: { x: number; y: number }[] = [];
  let p = poolTarget(-20);
  let v = { x: 0, y: 0 };
  for (let f = -20; f < DURATION + 2; f++) {
    const t = poolTarget(f);
    v = { x: v.x + (t.x - p.x) * CAM_STIFF - v.x * CAM_DAMP, y: v.y + (t.y - p.y) * CAM_STIFF - v.y * CAM_DAMP };
    p = { x: p.x + v.x, y: p.y + v.y };
    if (f >= 0) out.push({ ...p });
  }
  return out;
})();

// ===========================================================================
// PARTS
// ===========================================================================
/** The sun: a flat warm-cream disc with a soft halo of the pool's light, clipped at the horizon. */
const Sun: React.FC<{ f: number }> = ({ f }) => {
  const uid = uidOf(useId());
  const s = sunAt(f);
  if (s.y - SUN_REACH >= WL) return null;
  const R = SUN.r * SUN_HALO.r;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}h`}>
          <rect x={-4000} y={-6000} width={9000} height={f2(6000 + WL)} />
        </clipPath>
        <radialGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" cx={f2(s.x)} cy={f2(s.y)} r={f2(R)}>
          <stop offset={f2(SUN.r / R)} stopColor={`rgb(${SUN_HALO.color})`} stopOpacity={SUN_HALO.a} />
          <stop offset="0.6" stopColor={`rgb(${SUN_HALO.color})`} stopOpacity={SUN_HALO.a * 0.3} />
          <stop offset="1" stopColor={`rgb(${SUN_HALO.color})`} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${uid}h)`}>
        <circle cx={f2(s.x)} cy={f2(s.y)} r={f2(R)} fill={`url(#${uid}g)`} style={{ mixBlendMode: "screen" }} />
        <circle cx={f2(s.x)} cy={f2(s.y)} r={SUN.r} fill={SUN_FILL} />
        <g stroke={SUN_FILL} strokeWidth={f2(SUN.r * RAY.w)} strokeLinecap="round">
          {Array.from({ length: RAY.n }, (_, i) => {
            const a = (i * 2 * Math.PI) / RAY.n;
            // the round caps sit inside [in, out]
            const r0 = SUN.r * RAY.in + (SUN.r * RAY.w) / 2;
            const r1 = SUN_REACH - (SUN.r * RAY.w) / 2;
            return <line key={i} x1={f2(s.x + Math.cos(a) * r0)} y1={f2(s.y + Math.sin(a) * r0)} x2={f2(s.x + Math.cos(a) * r1)} y2={f2(s.y + Math.sin(a) * r1)} />;
          })}
        </g>
      </g>
    </g>
  );
};

/** The column (SHIP-LOCAL, drawn in SurveyShip's `front`): amber on the band gradient, the fixed bloom, the hot
 *  top edge, the foot occlusion, the slot line across the joint, and the one sweep running up it. */
const Column: React.FC<{ f: number; k: number; band: [number, number] }> = ({ f, k, band }) => {
  const uid = uidOf(useId());
  const h = colH(f);
  if (h <= 0.05) return null;
  const x0 = COL.x - COL.w / 2;
  const y0 = COL.foot - h;
  const r = Math.min(GEO.RADIUS, h / 2);
  const fall = Math.min(EDGE.HOT_FALL / k, h);
  const hot = EDGE.HOT / k;
  const ao = Math.min(h, EDGE.FOOT_AO / k);
  const sweep = (f - SWEEP_F[0]) / (SWEEP_F[1] - SWEEP_F[0]);
  const cx = COL.x;
  const cy = y0 + h / 2;
  return (
    <g>
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <linearGradient id={`${uid}hf`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(y0)} x2="0" y2={f2(y0 + fall)}>
          <stop offset="0" stopColor={COLOR.amberHot} stopOpacity={ALPHA.hotFall} />
          <stop offset="1" stopColor={COLOR.amberHot} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`${uid}ao`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(COL.foot - ao)} x2="0" y2={f2(COL.foot)}>
          <stop offset="0" stopColor={COLOR.shadow} stopOpacity="0" />
          <stop offset="1" stopColor={COLOR.shadow} stopOpacity={ALPHA.footAO} />
        </linearGradient>
      </defs>
      <g style={{ filter: bloomFilter(k) }}>
        <path d={rectPath(x0, y0, COL.w, h, r, true, false)} fill={`url(#${uid}a)`} />
      </g>
      <path d={rectPath(x0, y0, COL.w, fall, r, true, false)} fill={`url(#${uid}hf)`} />
      <path d={`M${f2(x0 + r)} ${f2(y0 + hot / 2)}H${f2(x0 + COL.w - r)}`} stroke={COLOR.amberHot} strokeWidth={f2(hot)} />
      {/* THE ONE CLICK: the house sweep turned a quarter, running UP the column (its band scaled with it) */}
      {sweep > 0 && sweep < 1 ? (
        <g transform={`rotate(-90 ${f2(cx)} ${f2(cy)})`}>
          <LightSweep x={cx - h / 2} y={cy - COL.w / 2} w={h} h={COL.w} k={k / 3} t={sweep} on="amber" r={0} />
        </g>
      ) : null}
      {/* the joint: the foot's occlusion and the slot line across it (the ship draws the lips either side) */}
      <rect x={f2(x0)} y={f2(COL.foot - ao)} width={COL.w} height={f2(ao)} fill={`url(#${uid}ao)`} />
      <rect x={f2(x0)} y={f2(COL.foot - EDGE.SLOT / k / 2)} width={COL.w} height={f2(EDGE.SLOT / k)} fill={COLOR.inkDark} fillOpacity={ALPHA.slot} />
    </g>
  );
};

// ===========================================================================
// THE CUT
// ===========================================================================
const ShipDayRate: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = amberBandFor(cam);
  const S = clockOf(f);
  const b = bobAt(S);
  // the amber band in ship-local y (the column is drawn inside the ship's bob transform)
  const bandLocal: [number, number] = [band[0] - WL - b.dy, band[1] - WL - b.dy];
  const h = colH(f);
  const sil = h > 0.05 ? [{ d: rectPath(COL.x - COL.w / 2, COL.foot - h, COL.w, h + GEO.RADIUS, Math.min(GEO.RADIUS, h / 2), true, false) }] : [];
  const dusk = duskAt(f);
  const top = colTopWorld(f);
  const labelEnter = clamp01((f - LABEL_IN[0]) / (LABEL_IN[1] - LABEL_IN[0]));
  const pool = POOL[Math.max(0, Math.min(POOL.length - 1, f))];
  return (
    <AbsoluteFill>
      <StoutStage S={S} cam={cam} rest={CAM[0]} pool={{ x: pool.x, y: pool.y, strength: lerp(1, 1.25, dusk) }}>
        {/* dusk: the ground's tone falls (the sea's own recipe: the shadow tone laid over the kraft) */}
        {dusk > 0.001 ? <rect x={-4000} y={-6000} width={9000} height={12000} fill={COLOR.shadow} fillOpacity={f2(DUSK.a * dusk)} /> : null}
        <Sun f={f} />
        <Sea wl={WL} k={k} S={S} />
        <SurveyShip
          x={SX}
          wl={WL}
          k={k}
          S={S}
          deckSlot={smoothstep((f - SLOT_OPEN[0]) / (SLOT_OPEN[1] - SLOT_OPEN[0]))}
          extraSilhouette={sil}
          front={<Column f={f} k={k} band={bandLocal} />}
        />
        {labelEnter > 0 ? (
          <Label
            x={top.x - LABEL_NUDGE}
            y={top.y - SPACE.VALUE / k}
            k={k}
            px={LABEL_PX}
            text={LABEL_TEXT}
            tone="cream"
            anchor="middle"
            enter={labelEnter}
          />
        ) : null}
      </StoutStage>
    </AbsoluteFill>
  );
};

export default ShipDayRate;

// ---------------------------------------------------------------------------
// Load-time checks: the rules the cut rests on.
// ---------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`ShipDayRate: ${m}`);
  };
  if (Math.abs(colH(RISE.f1) - COL.H) > 0.01) fail("the column does not top out at its height");
  // the sun passes BEHIND the column (the bill crosses the day) under its top: never across the hot edge
  for (let f = 0; f < DURATION; f += 0.25) {
    const s = sunAt(f);
    const t = colTopWorld(f);
    const colX0 = SX + COL.x - COL.w / 2 - 6;
    const colX1 = SX + COL.x + COL.w / 2 + 6;
    if (s.x + SUN_REACH > colX0 && s.x - SUN_REACH < colX1 && s.y - SUN_REACH < WL && s.y - SUN_REACH < t.y + 16) fail(`the sun meets the column's top on f${f}`);
  }
  // the sun never slips behind the ship: it clears the bow, the superstructure and the stern's A-frame
  const stem = (t: number) => {
    const u = 1 - t;
    return { x: 3 * u * u * t * 16 + 3 * u * t * t * 36 + t * t * t * SHIP.STEM_WL, y: u * u * u * SHIP.BOW_DECK + 3 * u * u * t * -84 + 3 * u * t * t * -28 };
  };
  const shipPts = [
    ...Array.from({ length: 21 }, (_, i) => stem(i / 20)),
    { x: 60, y: SHIP.BOW_DECK + 8 },
    { x: 120, y: -140 },
    // the superstructure's tops: the sun passes over them, never behind
    { x: SHIP.BRIDGE.x0t, y: SHIP.BRIDGE.top - 6 },
    { x: SHIP.BRIDGE.x1, y: SHIP.BRIDGE.top - 6 },
    { x: SHIP.RADOME.x, y: SHIP.RADOME.y - SHIP.RADOME.r },
    { x: SHIP.RADOME.x - SHIP.RADOME.r, y: SHIP.RADOME.y },
    { x: SHIP.RADOME.x + SHIP.RADOME.r, y: SHIP.RADOME.y },
    { x: SHIP.STACK.x0t, y: SHIP.STACK.top },
    { x: SHIP.STACK.x1t, y: SHIP.STACK.top },
    { x: SHIP.LEVEL1.x1, y: SHIP.LEVEL1.top },
    // the stern A-frame's head beam, its sheave block, the aft leg and the transom's top (droneShipShared AFRAME)
    { x: AFRAME.beam.x0, y: AFRAME.beam.y0 },
    { x: AFRAME.beam.x1, y: AFRAME.beam.y0 },
    { x: AFRAME.beam.x1, y: AFRAME.beam.y1 + 17 },
    { x: AFRAME.feet[1] + AFRAME.lean + AFRAME.leg / 2, y: AFRAME.top },
    { x: AFRAME.feet[1] + AFRAME.leg / 2 + AFRAME.pedestal.base / 2, y: SHIP.AFT_DECK - AFRAME.pedestal.h },
    { x: SHIP.L, y: SHIP.AFT_DECK },
    { x: SHIP.STERN_WL, y: -10 },
  ];
  for (let f = 0; f < DURATION; f += 0.25) {
    const s = sunAt(f);
    if (s.y - SUN_REACH >= WL) continue;
    for (const q of shipPts) {
      const w = shipToWorld(SX, WL, clockOf(f), q.x, q.y);
      if (Math.hypot(w.x - s.x, w.y - s.y) < SUN_REACH + 4) fail(`the sun slips behind the ship on f${f}`);
    }
  }
  // the column's top, the sun (while up) and the label stay in frame; the label clear of the caption bands
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    const tp = toScreen(c, colTopWorld(f).x, colTopWorld(f).y);
    if (tp.y < 200) fail(`the column's top leaves the frame on f${f} (y ${tp.y.toFixed(0)})`);
    // the director's framing: the whole ship (its waterline) stays above the caption bands on every frame
    const wl = Math.max(toScreen(c, SX + SHIP.STEM_WL, WL + 3).y, toScreen(c, SX + SHIP.STERN_WL, WL + 3).y);
    if (wl > 1050) fail(`the waterline drops to y ${wl.toFixed(0)} on f${f}`);
    // the bow keeps >= 30 px off the frame's left edge, the stern inside the right one
    if (toScreen(c, SX, WL).x < 30 || toScreen(c, SX + SHIP.L, WL).x > 1050) fail(`the ship nears the frame's edge on f${f}`);
    const s = sunAt(f);
    if (s.y - SUN_REACH < WL) {
      const ss = toScreen(c, s.x, s.y);
      // wholly in frame on every frame, rays included
      if (ss.y - SUN_REACH * c.k < 40 || ss.x - SUN_REACH * c.k < 4 || ss.x + SUN_REACH * c.k > 1076) fail(`the sun is cut by the frame's edge on f${f}`);
    }
    if (f >= LABEL_IN[0]) {
      const y = tp.y - SPACE.VALUE + (f < LABEL_IN[1] ? 24 : 6); // the baseline (+ the slide of its entrance)
      const yTop = tp.y - SPACE.VALUE - LABEL_PX * METRIC.cap - 4;
      const inBand = (a: number, b: number) => y > a && yTop < b;
      if (inBand(1080, 1250) || inBand(1360, 1460)) fail(`the label is in a caption band on f${f}`);
      const lw = labelWidth(LABEL_TEXT, LABEL_PX);
      const x0 = tp.x - LABEL_NUDGE * c.k - lw / 2;
      const x1 = x0 + lw;
      // the label never lies over the ship (its superstructure, the deck step, the A-frame)
      for (const q of [
        { x: SHIP.LEVEL1.x1, y: SHIP.LEVEL1.top },
        { x: SHIP.STACK.x1t, y: SHIP.STACK.top },
        { x: SHIP.STEP.x0, y: SHIP.AFT_DECK },
        { x: AFRAME.feet[0] - AFRAME.leg / 2 + AFRAME.lean, y: AFRAME.top },
        { x: AFRAME.feet[0] - AFRAME.leg / 2 + AFRAME.lean * 0.4, y: -120 },
        { x: AFRAME.beam.x0, y: AFRAME.beam.y0 },
      ]) {
        const w = toScreen(c, shipToWorld(SX, WL, clockOf(f), q.x, q.y).x, shipToWorld(SX, WL, clockOf(f), q.x, q.y).y);
        if (w.x > x0 - 6 && w.x < x1 + 6 && w.y > yTop - 6 && w.y < y + 6) fail(`the label lies over the ship on f${f}`);
      }
      if (s.y < WL) {
        const ss = toScreen(c, s.x, s.y);
        const R = SUN_REACH * c.k + 8;
        if (ss.x + R > x0 && ss.x - R < x1 && ss.y + R > yTop && ss.y - R < y) fail(`the label meets the sun on f${f}`);
      }
    }
  }
  // the camera: |dv| <= 2.5 screen px/f^2 on fixed world points
  for (let f = 1; f < DURATION - 1; f++) {
    for (const [ox, oy] of [
      [-500, -900],
      [500, 900],
      [0, 0],
    ]) {
      const w = { x: CAM[f].x + ox / CAM[f].k, y: CAM[f].y + oy / CAM[f].k };
      const a = toScreen(CAM[f - 1], w.x, w.y);
      const m = toScreen(CAM[f], w.x, w.y);
      const n = toScreen(CAM[f + 1], w.x, w.y);
      const acc = Math.hypot(n.x - 2 * m.x + a.x, n.y - 2 * m.y + a.y);
      if (acc > 2.5) fail(`camera |dv| ${acc.toFixed(2)} on f${f}`);
    }
  }
  // the column's top and the sun move under 45 screen px/f
  for (let f = 1; f < DURATION; f++) {
    const p = (g: number) => toScreen(camAt(g), colTopWorld(g).x, colTopWorld(g).y);
    const q = (g: number) => toScreen(camAt(g), sunAt(g).x, sunAt(g).y);
    if (Math.hypot(p(f).x - p(f - 1).x, p(f).y - p(f - 1).y) > 45) fail(`the column's top moves > 45 px on f${f}`);
    if (Math.hypot(q(f).x - q(f - 1).x, q(f).y - q(f - 1).y) > 45) fail(`the sun moves > 45 px on f${f}`);
  }
}
