import React, { useId } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam, Glide } from "./outgrowShared";
import {
  COLOR,
  LightSweep,
  Label,
  METRIC,
  Numeral,
  TRACK,
  TYPE,
  bloomFilter,
  clamp01,
  lerp,
  mixHex,
  numeralWidth,
  smoothstep,
} from "./stoutShared";
import { trackCentred } from "./droneShipShared";
import {
  CUT1_SEA_DURATION,
  CUT1_SEA_SETTLED_CAM,
  ResearchShip,
  SEA_BAND,
  SEA_STATION,
  SHIP_GEO,
  SHIP_L,
  SeaStage,
  shipToWorld,
  waterlineScreenY,
} from "./droneSeaShared";

// ===========================================================================
// ShipDayRate — cut 2 of the Cheeky Pint S4E02 clip "will - $50k drone vs $5m navy drone" (Will O'Brien,
// Ulysses), delivered as 14_ShipDayRate.mov. RESTYLE (user, 2026-10-15): "we have to make it clearer that its
// talking about 100s of thousands dollars ... also match the style of the others" — the realistic ocean look of
// the sibling Ulysses clips. The sea, the sky and the ship are droneSeaShared's (imported, never redrawn); the
// money is this cut's. 1080x1920, 23.976 fps, opaque. Amber = money.
//
// CHECK LINE: "Once you have the ship, every single day it's out at sea runs up a bill of hundreds of
// thousands of dollars."
//
// THE LINE: "[Once you even get the ship,] you're chartering it at an order of maybe a few hundred thousand
// dollars a day." Sequence 14.973-18.518 s: slot 85 f + a 16-f living tail = 101.
// ONSETS (f): chartering 1 · it 16 · at 17 · an 24 · order 33 · of 37 · maybe 41 · a 44 · few 48 · hundred 51 ·
// thousand 56 · dollars 62 · a 71 · day 77. Slot ends f85.
//
// ONE MOTION: one day passes over the same ship at sea (cut 1's settled over/under framing, no cards). The sun
// crosses the sky on one arch — morning low on the left, high over the bill, down behind the horizon right of the
// stern on "day" — and the light goes from morning to dusk. Locked to the day, a Söhne odometer in the sky rolls
// up the bill in whole $10,000 steps, "PER DAY" under it, and the money comes up out of the ship: a hatch in the
// aft work deck pushes up a stack of banknote bundles (amber bank straps), one whole bundle per $100,000, so the
// stack is one, two, three bundles as the counter passes $100,000, $200,000 and lands on "~$300,000" (the
// speaker's own "few hundred thousand": the tilde says it is his estimate).
//
//   f 0       cut 1's settled framing; the sun already up, low on the left (morning)
//   f 1..13   "$10,000" and "PER DAY" blur in and slide up in the sky; the hatch opens in the aft deck
//   f 8..60   the counter rolls at one rate; the stack climbs out of the hatch with it
//             ($100,000 + bundle 1 on f25 "an"; $200,000 + bundle 2 on f43 "a few")
//   f 60..77  "$290,000" holds sharp, then one slow drum turn onto "$300,000" as bundle 3 tops out, on "day"
//   f 74..86  the tilde blurs in at its left: "~$300,000"
//   f 0..78   the sun walks the arch at one speed and sinks behind the horizon right of the stern (~f76)
//   f 50..90  dusk: the light warms and falls (the sky, the sea band, the ship; the water darkens a touch)
//   f 77..89  THE ONE CLICK: a light sweep across the three bundles
//   f 77..100 the living hold: the float, the creep, the snow, the grain
// ===========================================================================

export const FPS = 24000 / 1001;
export const SLOT_FRAMES = 85;
export const TAIL = 16;
export const DURATION = SLOT_FRAMES + TAIL; // 101

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const f3 = (v: number) => (Math.round(v * 1000) / 1000).toString();
const uidOf = (raw: string) => `sdr${raw.replace(/[^A-Za-z0-9_-]/g, "_")}`;
type P2 = { x: number; y: number };

/** The story clock: cut 1's float continues (the ship never stopped bobbing while the speaker talked). */
const clockOf = (f: number) => f + CUT1_SEA_DURATION;
const SX = SEA_STATION.x;

// ===========================================================================
// THE MONEY: the counter
// ===========================================================================
/** The counter's value in $10,000 steps: "$10,000" while it enters, one rate from f8 to "$290,000" on f60, a
 *  held beat, then one slow drum turn onto "$300,000" landing on "day" (f77). */
const COUNT = { show: 8, run1: 60, hold: 63, land: 77, v0: 1, v1: 29, v2: 30 } as const;
const smoother = (x: number) => {
  const t = clamp01(x);
  return t * t * t * (t * (t * 6 - 15) + 10);
};
export const countAt = (f: number) => {
  if (f <= COUNT.show) return COUNT.v0;
  if (f <= COUNT.run1) return lerp(COUNT.v0, COUNT.v1, (f - COUNT.show) / (COUNT.run1 - COUNT.show));
  if (f <= COUNT.hold) return COUNT.v1;
  return COUNT.v1 + smoother((f - COUNT.hold) / (COUNT.land - COUNT.hold));
};
const COUNT_PX = TYPE.SECONDARY; // 136 screen px
/** The counter's figures (n = $10,000 steps): "10,000" ... "300,000". The "$" is its own glyph to their left, so
 *  the odometer only ever rolls figures (a new leading figure rolls in from below as the "$" makes room). */
const digits = (n: number) => `${(n * 10).toString()},000`;
/** The odometer's tabular layout width (screen px) of a figure string (stoutShared Numeral's own rule). */
const tabW = (t: string) => [...t].reduce((a, c) => a + numeralWidth(c, COUNT_PX, true) + TRACK.numeral * COUNT_PX, 0) - TRACK.numeral * COUNT_PX;
const DOLLAR_W = numeralWidth("$", COUNT_PX);
const TILDE_W = numeralWidth("~", COUNT_PX);
const GAP = 4; // "$" to the figures, "~" to the "$"
/** The width of the figures at value v (eased across a step that adds a figure). */
const figuresW = (v: number) => {
  const n = Math.floor(v);
  return lerp(tabW(digits(n)), tabW(digits(n + 1)), smoothstep(v - n));
};
const LABEL_PX = 44; // "PER DAY": above the LABEL token so it reads on a phone
const COUNT_IN: [number, number] = [1, 13];
const TILDE_IN: [number, number] = [74, 86];
/** Where the readout sits (SCREEN px): the counter's baseline, and the unit's under it; centred on the frame
 *  the "$300,000" it lands on is centred, the tilde hangs to its left (its right edge is fixed: the counter grows
 *  to the left, as a counter does). */
const READ = { base: 450, right: 540 + (tabW(digits(30)) + GAP + DOLLAR_W) / 2, labelBase: 450 + 46 + Math.round(LABEL_PX * METRIC.cap) } as const;

// ===========================================================================
// THE MONEY: the bundles (SHIP-LOCAL px, inside the ship's float)
// ===========================================================================
/** A $100,000 bundle of banknotes seen side on: the notes' edges, one amber bank strap round its middle. Three
 *  stand in a hatch in the aft work deck (between the step and the A-frame's feet). */
const BUNDLE = { w: 140, h: 58, cx: 736, strap: 0.2, r: 3, edge: 9 } as const;
const HATCH = { w: BUNDLE.w + 8, open: [1, 6] as [number, number] };
const DECK = SHIP_GEO.AFT_DECK;
/** How far the stack has come out of the hatch (local px): one bundle per $100,000. */
const stackH = (f: number) => (BUNDLE.h * countAt(f)) / 10 - (f < COUNT.show ? BUNDLE.h * 0.1 * (1 - smoothstep((f - 1) / 7)) : 0);
const NOTE = { hi: "#DCDFC6", mid: "#C3CAAC", lo: "#9AA287", edgeHi: "#EEEBDA", strapLo: "#C98600", strapInk: "#6E4A10", print: "#4F6250" } as const;

const Bundles: React.FC<{ f: number; k: number }> = ({ f, k }) => {
  const uid = uidOf(useId());
  const h = Math.max(0, stackH(f));
  const open = smoothstep((f - HATCH.open[0]) / (HATCH.open[1] - HATCH.open[0]));
  const x0 = BUNDLE.cx - BUNDLE.w / 2;
  const top = DECK - h;
  const n = Math.ceil(h / BUNDLE.h + 1e-6);
  const sweep = (f - SWEEP_F[0]) / (SWEEP_F[1] - SWEEP_F[0]);
  const sw = BUNDLE.w * BUNDLE.strap;
  return (
    <g>
      <defs>
        {/* the stack is cut at the deck: it comes up out of the hatch */}
        <clipPath id={`${uid}c`}>
          <rect x={x0 - 40} y={DECK - 400} width={BUNDLE.w + 80} height={400} />
        </clipPath>
        <linearGradient id={`${uid}n`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={NOTE.hi} />
          <stop offset="0.5" stopColor={NOTE.mid} />
          <stop offset="1" stopColor={NOTE.lo} />
        </linearGradient>
        <linearGradient id={`${uid}s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={COLOR.amberTop} />
          <stop offset="1" stopColor={NOTE.strapLo} />
        </linearGradient>
        <linearGradient id={`${uid}side`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.14" />
          <stop offset="0.6" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#3A2A1C" stopOpacity="0.22" />
        </linearGradient>
      </defs>
      {/* the hatch: an opening in the deck, its coaming lit along the top */}
      {open > 0.001 ? (
        <g>
          <rect x={f3(BUNDLE.cx - (HATCH.w / 2) * open)} y={f3(DECK - 2)} width={f3(HATCH.w * open)} height={6} fill="#2B241F" opacity={0.9} />
          <rect x={f3(BUNDLE.cx - (HATCH.w / 2) * open - 3)} y={f3(DECK - 4)} width={f3(HATCH.w * open + 6)} height={2.4} fill="#E3DBCB" />
        </g>
      ) : null}
      {h > 0.05 ? (
        <g clipPath={`url(#${uid}c)`}>
          {/* one soft shadow for the stack onto the deck and the hull behind it (the sun is upper left) */}
          <rect x={f3(x0 + 6)} y={f3(top + 6)} width={BUNDLE.w} height={f3(h)} rx={BUNDLE.r} fill="#3A2A1C" opacity={0.28} style={{ filter: "blur(5px)" }} />
          {Array.from({ length: n }, (_, i) => {
            // bundle i from the bottom of what is out (the topmost is the first one up)
            const y = DECK - (i + 1) * BUNDLE.h + (BUNDLE.h * n - h);
            const fh = BUNDLE.h - BUNDLE.edge; // the top note's face; under it the notes' edges
            const bx = x0 + 5;
            const bw = BUNDLE.w - 10;
            return (
              <g key={i}>
                {/* the bundle: banknotes seen from the front, the top note's face and the stack's edges under it */}
                <rect x={x0} y={f3(y)} width={BUNDLE.w} height={BUNDLE.h} rx={BUNDLE.r} fill={NOTE.lo} />
                <rect x={x0} y={f3(y)} width={BUNDLE.w} height={fh} rx={BUNDLE.r} fill={`url(#${uid}n)`} />
                {/* the note's engraving: a border, the portrait oval, the corner figures, a seal */}
                <rect x={f3(bx)} y={f3(y + 4)} width={f3(bw)} height={f3(fh - 8)} rx={2} fill="none" stroke={NOTE.print} strokeWidth={1.6} opacity={0.75} />
                <rect x={f3(bx + 3)} y={f3(y + 7)} width={f3(bw - 6)} height={f3(fh - 14)} rx={1.5} fill="none" stroke={NOTE.print} strokeWidth={0.8} opacity={0.45} />
                <ellipse cx={f3(x0 + BUNDLE.w * 0.24)} cy={f3(y + fh / 2)} rx={11} ry={fh * 0.32} fill={NOTE.print} opacity={0.32} />
                <ellipse cx={f3(x0 + BUNDLE.w * 0.24)} cy={f3(y + fh / 2)} rx={11} ry={fh * 0.32} fill="none" stroke={NOTE.print} strokeWidth={1.2} opacity={0.7} />
                <circle cx={f3(x0 + BUNDLE.w * 0.8)} cy={f3(y + fh / 2)} r={fh * 0.2} fill="none" stroke={NOTE.print} strokeWidth={1.1} opacity={0.6} />
                {[
                  [bx + 6, y + 9],
                  [bx + bw - 15, y + 9],
                  [bx + 6, y + fh - 14],
                  [bx + bw - 15, y + fh - 14],
                ].map(([cx, cy], j) => (
                  <rect key={j} x={f3(cx)} y={f3(cy)} width={9} height={5} rx={1} fill={NOTE.print} opacity={0.55} />
                ))}
                {/* the notes' edges under the face */}
                <g stroke={NOTE.edgeHi} strokeWidth={0.9} opacity={0.7}>
                  {[1.6, 3.6, 5.6].map((ly) => (
                    <line key={ly} x1={x0 + 2} x2={x0 + BUNDLE.w - 2} y1={f3(y + fh + ly)} y2={f3(y + fh + ly)} />
                  ))}
                </g>
                <rect x={x0} y={f3(y)} width={BUNDLE.w} height={BUNDLE.h} rx={BUNDLE.r} fill={`url(#${uid}side)`} />
                {/* the bank strap: amber paper round the middle (money's one glow) */}
                <g style={{ filter: bloomFilter(k * 2.2) }}>
                  <rect x={f3(BUNDLE.cx - sw / 2)} y={f3(y - 0.6)} width={f3(sw)} height={BUNDLE.h + 1.2} fill={`url(#${uid}s)`} />
                </g>
                <rect x={f3(BUNDLE.cx - sw / 2)} y={f3(y - 0.6)} width={f3(sw)} height={1.6} fill={COLOR.amberHot} opacity={0.9} />
                <rect x={f3(BUNDLE.cx - sw / 2 + 4)} y={f3(y + fh / 2 - 2.5)} width={f3(sw - 8)} height={5} rx={1} fill={NOTE.strapInk} opacity={0.55} />
                {/* the lit top of the bundle, and the seam under it */}
                <rect x={x0 + 2} y={f3(y)} width={BUNDLE.w - 4} height={1.4} fill="#FFFBEE" opacity={0.8} />
                <rect x={x0} y={f3(y + BUNDLE.h - 1.6)} width={BUNDLE.w} height={1.6} fill="#3A2A1C" opacity={0.4} />
              </g>
            );
          })}
          {/* THE ONE CLICK: a light sweep across the bundles */}
          {sweep > 0 && sweep < 1 ? <LightSweep x={x0} y={top} w={BUNDLE.w} h={h} k={k} t={sweep} on="cream" r={BUNDLE.r} /> : null}
        </g>
      ) : null}
    </g>
  );
};

// ===========================================================================
// THE DAY: the sun (SCREEN px: the sky is at infinity) and the light
// ===========================================================================
/** The sun's arch (screen px): its feet on the horizon at x0 / x1, its top at y apex; a rounded arch (its sides
 *  near vertical: it keeps clear of the bow, the stern and the readout) walked at ONE speed. At f0 it is already
 *  up, low on the left (morning); its centre meets the horizon right of the stern on f SET. */
const SUN = { r: 24, rayIn: 1.32, rayOut: 1.78, rayW: 0.24, x0: 62, x1: 1018, apex: 120, p: 0.42, q: 0.7, startY: 780, set: 76 } as const;
const SUN_REACH = SUN.r * SUN.rayOut;
const SUN_FILL = "#FFF1CF";
/** The horizon's screen y for the settled framing (the stage's: waterline - SEA_BAND). */
const horizonOf = (cam: Cam) => waterlineScreenY(cam) - SEA_BAND * Math.sqrt(cam.k);
const ARCH = (() => {
  const hz = horizonOf(CUT1_SEA_SETTLED_CAM);
  const cx = (SUN.x0 + SUN.x1) / 2;
  const rx = (SUN.x1 - SUN.x0) / 2;
  const ry = hz - SUN.apex;
  const n = 2400;
  const pts: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i <= n; i++) {
    const th = (Math.PI * i) / n;
    const c = Math.cos(th);
    const p = { x: cx - rx * Math.sign(c) * Math.pow(Math.abs(c), SUN.p), y: hz - ry * Math.pow(Math.sin(th), SUN.q) };
    const prev = pts[i - 1];
    pts.push({ ...p, s: prev ? prev.s + Math.hypot(p.x - prev.x, p.y - prev.y) : 0 });
  }
  // where the walk starts (f0): on the left side at startY
  let s0 = 0;
  for (const q of pts) {
    if (q.y <= SUN.startY) {
      s0 = q.s;
      break;
    }
  }
  return { pts, len: pts[pts.length - 1].s, s0, hz };
})();
export const sunAt = (f: number): P2 => {
  const d = ARCH.s0 + ((ARCH.len - ARCH.s0) * f) / SUN.set;
  if (d >= ARCH.len) return { x: SUN.x1, y: ARCH.hz + (d - ARCH.len) };
  let lo = 0;
  let hi = ARCH.pts.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (ARCH.pts[m].s < d) lo = m;
    else hi = m;
  }
  const A = ARCH.pts[lo];
  const B = ARCH.pts[hi];
  const t = (d - A.s) / Math.max(1e-9, B.s - A.s);
  return { x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t) };
};
/** The time of day 0 (morning) .. 1 (dusk): the sun's walk. */
const dayAt = (f: number) => clamp01(f / SUN.set);
/** Dusk 0..1: the light warms and falls from mid-afternoon on. */
const duskAt = (f: number) => smoothstep((f - 46) / 44);
/** The light over everything above the water (multiply): morning neutral, a touch of gold at noon, then the
 *  dusk's warm fall (a deeper brown overhead, a warm glow low on the horizon). */
const LIGHT = { duskTop: "#8C7266", duskMid: "#D2B096", duskLow: "#F7CFA4", noonA: 0.06 } as const;

/** The sun, drawn in the stage's `above` layer (WORLD coords of its screen place: the sky is at infinity), so the
 *  ship stands in front of it, the light of the hour falls on it and the grade and grain go over it. */
const Sun: React.FC<{ f: number; cam: Cam }> = ({ f, cam }) => {
  const uid = uidOf(useId());
  const sc = sunAt(f);
  const hz = horizonOf(cam);
  if (sc.y - SUN_REACH >= hz) return null;
  const k = cam.k;
  const s = toWorld(cam, sc.x, sc.y);
  const hzW = toWorld(cam, 0, hz).y;
  const r = SUN.r / k;
  const reach = SUN_REACH / k;
  const dusk = duskAt(f);
  const fill = mixHex(SUN_FILL, "#FFC98A", dusk * 0.8);
  const R = reach * 3.4;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}h`}>
          <rect x={f3(s.x - 2000)} y={f3(hzW - 4000)} width={4000} height={4000} />
        </clipPath>
        <radialGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" cx={f3(s.x)} cy={f3(s.y)} r={f3(R)}>
          <stop offset={f3(r / R)} stopColor={fill} stopOpacity="0.42" />
          <stop offset="0.45" stopColor={fill} stopOpacity="0.12" />
          <stop offset="1" stopColor={fill} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g clipPath={`url(#${uid}h)`}>
        <circle cx={f3(s.x)} cy={f3(s.y)} r={f3(R)} fill={`url(#${uid}g)`} style={{ mixBlendMode: "screen" }} />
        <circle cx={f3(s.x)} cy={f3(s.y)} r={f3(r)} fill={fill} />
        <g stroke={fill} strokeWidth={f3(r * SUN.rayW)} strokeLinecap="round">
          {Array.from({ length: 8 }, (_, i) => {
            const a = (i * Math.PI) / 4;
            const r0 = r * SUN.rayIn + (r * SUN.rayW) / 2;
            const r1 = reach - (r * SUN.rayW) / 2;
            return <line key={i} x1={f3(s.x + Math.cos(a) * r0)} y1={f3(s.y + Math.sin(a) * r0)} x2={f3(s.x + Math.cos(a) * r1)} y2={f3(s.y + Math.sin(a) * r1)} />;
          })}
        </g>
      </g>
    </g>
  );
};

// ===========================================================================
// THE CAMERA: cut 1's settled framing, then a gentle drift toward the sunset and a slow creep
// ===========================================================================
const CAM0: Cam = CUT1_SEA_SETTLED_CAM;
/** The drift (world px): room right of the stern for the sun's set; the bow stays >= 30 px off the left edge. */
const DRIFT = 50;
const CREEP_K = 1.015;
const CREEP_AT = { x: 540, y: -150 }; // the creep's anchor (world): above the deck, so the waterline barely moves
const GLIDES: Glide[] = [
  { f0: 18, f1: 74, dx: DRIFT },
  { f0: 24, f1: 150, k: CAM0.k * CREEP_K, dx: (CREEP_AT.x - CAM0.x) * (1 - 1 / CREEP_K), dy: (CREEP_AT.y - CAM0.y) * (1 - 1 / CREEP_K), warp: 1 },
];
export const CAM: Cam[] = trackCentred(CAM0, GLIDES, DURATION, 30);
export const camAt = (f: number): Cam => CAM[Math.max(0, Math.min(CAM.length - 1, Math.round(f)))];
const SWEEP_F: [number, number] = [77, 89];

/** screen -> world under a camera (no sway: the readout is fixed in the sky) */
const toWorld = (cam: Cam, sx: number, sy: number) => ({ x: cam.x + (sx - 540) / cam.k, y: cam.y + (sy - 960) / cam.k });

// ===========================================================================
// THE CUT
// ===========================================================================
const ShipDayRate: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const S = clockOf(f);
  const uid = uidOf(useId());
  const dusk = duskAt(f);
  const noon = Math.sin(Math.PI * dayAt(f)) * (1 - dusk);
  // the readout (world coords of its screen place)
  const v = countAt(f);
  // (the counter is always drawn as an odometer, never "landed": its figures stay tabular, so a resting value
  // and the "$" beside it never jump when the roll stops)
  const landed = f >= COUNT.land;
  const roll = (countAt(f + 0.5) - countAt(f - 0.5)) * 1; // steps per frame
  const enter = clamp01((f - COUNT_IN[0]) / (COUNT_IN[1] - COUNT_IN[0]));
  const tilde = clamp01((f - TILDE_IN[0]) / (TILDE_IN[1] - TILDE_IN[0]));
  const r = toWorld(cam, READ.right, READ.base);
  const lab = toWorld(cam, 540, READ.labelBase);
  const fw = figuresW(landed ? COUNT.v2 : v);
  const dl = toWorld(cam, READ.right - fw - GAP, READ.base);
  const tl = toWorld(cam, READ.right - fw - GAP - DOLLAR_W - GAP, READ.base);
  // the above-water world rect the light covers (world coords of the screen above the waterline)
  const tlW = toWorld(cam, -60, -80);
  const brW = toWorld(cam, 1140, waterlineScreenY(cam) + 20);
  const lightRect = { x: tlW.x, y: tlW.y, w: brW.x - tlW.x, h: Math.max(0, -tlW.y + 20) };
  const water = toWorld(cam, -60, waterlineScreenY(cam));
  const waterBot = toWorld(cam, 1140, 2000);
  return (
    <AbsoluteFill>
      <SeaStage
        S={S}
        cam={cam}
        rest={CAM[0]}
        below={<ResearchShip x={SX} S={S} part="below" k={k} />}
        above={
          <>
            <Sun f={f} cam={cam} />
            <ResearchShip x={SX} S={S} part="above" k={k} front={<Bundles f={f} k={k} />} />
            {/* the light of the hour over the sky, the sea band and the ship (multiply: a change of tone) */}
            <defs>
              <linearGradient id={`${uid}dusk`} gradientUnits="userSpaceOnUse" x1="0" y1={f3(lightRect.y)} x2="0" y2={f3(lightRect.y + lightRect.h)}>
                <stop offset="0" stopColor={mixHex("#FFFFFF", LIGHT.duskTop, dusk)} />
                <stop offset="0.55" stopColor={mixHex("#FFFFFF", LIGHT.duskMid, dusk)} />
                <stop offset="1" stopColor={mixHex("#FFFFFF", LIGHT.duskLow, dusk)} />
              </linearGradient>
            </defs>
            {dusk > 0.002 ? <rect x={f3(lightRect.x)} y={f3(lightRect.y)} width={f3(lightRect.w)} height={f3(lightRect.h)} fill={`url(#${uid}dusk)`} style={{ mixBlendMode: "multiply" }} /> : null}
            {noon > 0.002 ? (
              <rect x={f3(lightRect.x)} y={f3(lightRect.y)} width={f3(lightRect.w)} height={f3(lightRect.h)} fill="#FFF3DA" opacity={f3(LIGHT.noonA * noon)} style={{ mixBlendMode: "screen" }} />
            ) : null}
          </>
        }
        top={
          <>
            {/* dusk under the water: a touch less light comes down */}
            {dusk > 0.002 ? <rect x={f3(water.x)} y={f3(Math.max(0, water.y))} width={f3(waterBot.x - water.x)} height={f3(waterBot.y)} fill="#24170E" opacity={f3(0.16 * dusk)} /> : null}
            {/* the readout: the counter, its tilde, the unit */}
            <g style={{ filter: "drop-shadow(0 2px 6px rgba(46,30,20,0.45))" }}>
              <Numeral
                x={r.x}
                y={r.y}
                k={k}
                px={COUNT_PX}
                value={landed ? COUNT.v2 - 1e-6 : Number.isInteger(v) ? v - 1e-6 : v}
                format={digits}
                rollBlur={landed ? 0 : Math.min(3.2, Math.abs(roll) * 5)}
                tone="amber"
                anchor="end"
                enter={enter}
                glow
              />
              <Numeral x={dl.x} y={dl.y} k={k} px={COUNT_PX} text="$" tone="amber" anchor="end" enter={enter} glow />
              {tilde > 0 ? <Numeral x={tl.x} y={tl.y} k={k} px={COUNT_PX} text="~" tone="amber" anchor="end" enter={tilde} glow /> : null}
              <Label x={lab.x} y={lab.y} k={k} px={LABEL_PX} text="PER DAY" tone="cream" anchor="middle" enter={enter} />
            </g>
          </>
        }
      />
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
  // the counter passes $100,000 / $200,000 as bundles 1 / 2 top out, and lands on $300,000 on "day"
  const passes = (n: number) => {
    for (let f = 0; f < DURATION; f += 0.05) if (countAt(f) >= n) return f;
    return Infinity;
  };
  if (Math.abs(passes(10) - 24.6) > 1.5 || Math.abs(passes(20) - 43.4) > 1.5) fail(`the counter passes $100K / $200K on f${passes(10).toFixed(1)} / f${passes(20).toFixed(1)}`);
  if (Math.abs(countAt(COUNT.land) - COUNT.v2) > 1e-9) fail("the counter does not land on $300,000");
  if (Math.abs(stackH(COUNT.land) - 3 * BUNDLE.h) > 1e-6) fail("the stack is not three bundles when the counter lands");
  for (let f = 0; f < DURATION; f++) {
    const c = camAt(f);
    // the ship stays above the caption bands; the bow off the left edge; the stern inside the right one
    const wl = waterlineScreenY(c) + 5;
    if (wl > 1050) fail(`the waterline drops to y ${wl.toFixed(0)} on f${f}`);
    const bow = 540 + (SX - c.x) * c.k;
    const stern = 540 + (SX + SHIP_L + 16 - c.x) * c.k;
    if (bow < 30 || stern > 1050) fail(`the ship nears the frame's edge on f${f}`);
    // the sun: wholly in frame, never on the readout, never behind the ship
    const s = sunAt(f);
    if (s.y - SUN_REACH < horizonOf(c)) {
      if (s.x - SUN_REACH < 4 || s.x + SUN_REACH > 1076 || s.y - SUN_REACH < 30) fail(`the sun is cut by the frame's edge on f${f}`);
      const text = figuresW(countAt(f)) + GAP + DOLLAR_W;
      const box = { x0: READ.right - (f >= TILDE_IN[0] ? text + GAP + TILDE_W : text) - 10, x1: READ.right + 10, y0: READ.base - COUNT_PX * 0.76 - 30, y1: READ.labelBase + 34 };
      const dx = Math.max(box.x0 - s.x, 0, s.x - box.x1);
      const dy = Math.max(box.y0 - s.y, 0, s.y - box.y1);
      if (Math.hypot(dx, dy) < SUN_REACH + 8) fail(`the sun meets the readout on f${f}`);
      for (const q of [
        { x: 0, y: SHIP_GEO.BOW_DECK },
        { x: 20, y: -100 },
        { x: 40, y: -40 },
        { x: SHIP_GEO.RADOME.x, y: SHIP_GEO.RADOME.y - SHIP_GEO.RADOME.r },
        { x: SHIP_GEO.AFRAME.beam.x1, y: SHIP_GEO.AFRAME.beam.y0 },
        { x: SHIP_GEO.AFRAME.beam.x1, y: SHIP_GEO.AFRAME.beam.y1 + 20 },
        { x: SHIP_GEO.AFRAME.feet[1] + SHIP_GEO.AFRAME.lean + 6, y: -150 },
        { x: SHIP_L, y: SHIP_GEO.AFT_DECK },
        { x: BUNDLE.cx + BUNDLE.w / 2, y: DECK - 3 * BUNDLE.h },
      ]) {
        const w = shipToWorld(SX, clockOf(f), q.x, q.y);
        const sp = { x: 540 + (w.x - c.x) * c.k, y: 960 + (w.y - c.y) * c.k };
        if (Math.hypot(sp.x - s.x, sp.y - s.y) < SUN_REACH + 6) fail(`the sun slips behind the ship on f${f}`);
      }
    }
    // the readout stays out of the caption bands
    if (READ.labelBase > 1080) fail("the readout is in a caption band");
  }
  // the sun and the camera: calm
  for (let f = 1; f < DURATION; f++) {
    const a = sunAt(f - 1);
    const b = sunAt(f);
    if (Math.hypot(b.x - a.x, b.y - a.y) > 45) fail(`the sun moves > 45 px on f${f}`);
  }
}
