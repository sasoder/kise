// ---------------------------------------------------------------------------
// PricedLikeTheLakers (toto-worth-twelve, cut 29). Cheeky Pint style (stout) (styles/cheeky-pint.md), the stout
// board, palette B1. Opaque 1080x1920, 25 fps, 151 frames. Builder A. World + scales: ./worthShared.
//
// CHECK LINE: "Measured by the Lakers' $10B sale, Mercedes would be worth $10-12 billion: about twice what it sold
// a stake at a year earlier." (The viewer leaves knowing the number and that it is pegged to the Lakers.)
//
// THE LINE: "[So I] would value us at 10, 12 billion if you look at the Lakers sale, for example. | that's not the point"
// WORD -> FRAME (from comp start): would 7 · value 12 · us 19 · at 24 · "10," 29 · 12 45 · billion 52 · if 62 · you 70 ·
//   look 72 · at 76 · the 79 · Lakers 83 · sale 103 · for 120 · example 128 · (that's 142).
// DURATION: the slot 29.760 -> 35.800 s = 6.04 s x 25 = 151 frames (f0..f150). Back to Toto at 35.80.
//
// THE MOTION: one continuous pull-back and pan. Close on the Mercedes tile and its empty glass column; on "at 10" the
// amber fills it from the slot up while a HERO odometer over its top rolls to "$10B" (lands f32); on "12 billion"
// glass and fill stretch up together one more step, the odometer riding the top to "$12B" (lands f52). The camera,
// easing back since f0, pans right through the breath; on "Lakers" the Lakers crest tile slides in from the right
// edge (lifted while it travels, settling on its contact shadow), its cream-filled glass rises to the $10B rung, level
// with Mercedes' fifth rung, a step below Mercedes' top, and "$10B" (SECONDARY, cream) lands over it on "sale". The
// click: one LightSweep across Mercedes' amber (f106-116). f116-150: both pillars, both numerals, the camera creeping
// into its rest, sway, grain.
//   Gestures -> word -> frames:
//     empty glass + tile, camera already pulling back           -> "would value us"      f0-
//     amber fill 0 -> $10B (rest to rest), "$10B" odometer in    -> "at 10,"              fill f16-32, numeral in f16-28
//     glass hairline lo -> hi as the glass fills                 ->                        f30-42
//     glass + fill $10B -> $12B; ONE drum turn "$10B" -> "$12B"  -> "12 billion"          f40-52
//     breath: pull-back decays, the pan right begins             -> "if you look at the"  f52-83
//     Lakers tile slides in off the right edge, lifted, settles  -> "the Lakers"          f74-92 (contact f92)
//     Lakers cream glass rises out of its slot to $10B           -> "Lakers"              f90-102
//     "$10B" SECONDARY cream over the Lakers                     -> "sale"                in f92-103
//     THE CLICK: LightSweep across Mercedes' amber               -> "sale, for"           f106-116
//     resolved, living: the camera creeps into REST29            -> "for example"         f116-150
// AMBER = Mercedes' value (the clip: Mercedes' money). cream = the Lakers (the yardstick the line names). No other
// numerals than "$10B" -> "$12B" (Mercedes) and "$10B" (Lakers).
//
// SOURCES: Mercedes "10, 12 billion" = Toto in this clip. LA Lakers $10B = Mark Walter's purchase, June 2025 (Forbes
// value $10.0B). Data and scale: worthShared.tsx (VALUE 12.5 world px per $1B; a rung every $2B). Logos: the
// Mercedes-AMG PETRONAS F1 lockup (kits/cheeky-pint/mercedesF1Logo.ts) and the Lakers crest (kits/cheeky-pint/wolffLogos.ts).
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, GEO, LightSweep, STROKE, StoutStage, TYPE, amberBandFor, clamp01, lerp, snapLen } from "../kits/cheeky-pint/stoutShared";
import { makeClockCam, makePoolTrack, restToRest, travel, type Cam } from "../kits/cheeky-pint/museShared";
import {
  DATA,
  DY,
  FIG,
  KEEP,
  MoneyOdometer,
  DRUM_PITCH,
  FLOOR,
  MoneyDrum,
  REST29_TALL_T,
  TILE_TALL,
  VALUE_TALL_RUNG,
  ValueColumn,
  X_LAKERS_TALL,
  X_MERC,
  keepInMiss,
  moneyWidth,
  restCam,
  rollBlurLinear,
  valueHTall,
  wAt,
  sxOf,
  syOf,
} from "./worthShared";
import { METRIC, SPACE } from "../kits/cheeky-pint/stoutShared";

export const FPS = 25;
export const DURATION = 151;
export const schema = z.object({
  // the faint level line from the Lakers' top across to Mercedes' $10B rung (director's trial, Nov 18)
  levelLine: z.boolean().default(true),
});
export const defaultProps = schema.parse({});

// --- beats (frames) ------------------------------------------------------------------------------
const FILL1 = [16, 32] as const; // amber 0 -> $10B
const NUM_IN = [16, 28] as const; // the HERO odometer's entrance
const GLASS_HI = [30, 42] as const; // glass hairline lo -> hi
const FILL2 = [40, 52] as const; // glass + fill $10B -> $12B
const LAKERS_TRAVEL = [74, 92] as const; // the tile slides in, settles on its contact shadow
const LAKERS_COL = [90, 102] as const; // its cream glass rises
const LAKERS_NUM = [92, 103] as const; // "$10B" over it
const SWEEP = [106, 116] as const; // the click
const LEVEL = [100, 109] as const; // the level line draws leftward from the Lakers' top to Mercedes

// --- heights (world) ---------------------------------------------------------------------------------
const REST29 = REST29_TALL_T;
/** The tall-scale tile (15 % larger, director's review 2): columns leave its top edge. */
const TILE_TOP = FLOOR - TILE_TALL;
const X_LAKERS = X_LAKERS_TALL;
const valueH = valueHTall;
const K_REST = REST29.k;
const H10 = snapLen(valueH(DATA.MERC_VALUE_LO), K_REST); // ~210
const H12 = snapLen(valueH(DATA.MERC_VALUE_HI), K_REST); // ~252
const HL = snapLen(valueH(DATA.LAKERS_VALUE), K_REST); // the Lakers' top = Mercedes' $10B rung
const fill1 = (f: number) => H10 * restToRest(clamp01((f - FILL1[0]) / (FILL1[1] - FILL1[0])), 2.5);
const stretch = (f: number) => restToRest(clamp01((f - FILL2[0]) / (FILL2[1] - FILL2[0])), 2.5);
const mercGlass = (f: number) => H10 + (H12 - H10) * stretch(f);
const mercFill = (f: number) => (f < FILL2[0] ? fill1(f) : mercGlass(f));
/** The odometer's value: what the amber has reached ($B), never below $1B once it shows. */
const mercValue = (f: number) =>
  f < FILL2[0]
    ? Math.max(1, (fill1(f) / H10) * DATA.MERC_VALUE_LO)
    : DATA.MERC_VALUE_LO + (DATA.MERC_VALUE_HI - DATA.MERC_VALUE_LO) * stretch(f);
const lakersCol = (f: number) => HL * restToRest(clamp01((f - LAKERS_COL[0]) / (LAKERS_COL[1] - LAKERS_COL[0])), 2.5);

// --- camera: one pull-back from Mercedes alone, then the pan onto the pair, creeping into REST29 ----------------
const K_OPEN = 2.15;
const CAM_OPEN = restCam(X_MERC, 540, 1050, K_OPEN); // tile + empty glass, the room above for the numeral
const K_MID = 1.648;
const CAM_MID = restCam(X_MERC, 540, 1062, K_MID); // Mercedes alone at $12B, the HERO numeral inside the box
const CAM_END = REST29.cam;
const PAN_LEAD = 0.93; // the share of the pan done by the main move; the rest is the closing creep
const K_PAN = 1.655;
const CAM = makeClockCam(
  { x: CAM_OPEN.x, y: CAM_OPEN.y, k: K_OPEN },
  [
    { f0: -16, f1: 46, k: K_MID, dy: CAM_MID.y - CAM_OPEN.y, warp: 0.85 },
    { f0: 47, f1: 99, k: K_PAN, dx: PAN_LEAD * (CAM_END.x - CAM_MID.x), dy: PAN_LEAD * (CAM_END.y - CAM_MID.y), warp: 1.1 },
    { f0: 92, f1: 200, k: K_REST, dx: (1 - PAN_LEAD) * (CAM_END.x - CAM_MID.x), dy: (1 - PAN_LEAD) * (CAM_END.y - CAM_MID.y) },
  ],
  DURATION,
);
export const camAt = (f: number): Cam => CAM.at(f);

// --- the Lakers' slide: in from beyond the right edge (fully off at its start) --------------------------------
const LAKERS_FROM = (() => {
  const c = camAt(LAKERS_TRAVEL[0]);
  return c.x + 540 / c.k + TILE_TALL / 2 + 24 / c.k + 70;
})();
const lakersPose = (f: number) => travel({ x: LAKERS_FROM, y: 0 }, { x: X_LAKERS, y: 0 }, f, LAKERS_TRAVEL[0], LAKERS_TRAVEL[1], { p: 2.6, settleFrom: 0.75 });

// --- the light pool: on Mercedes' column, then on the pair as the Lakers arrive ------------------------------
const POOL = makePoolTrack(
  { x: X_MERC, y: TILE_TOP - 50 },
  [
    { f0: 14, f1: 54, x: X_MERC, y: TILE_TOP - 80 },
    { f0: 70, f1: 120, x: (X_MERC + X_LAKERS) / 2, y: TILE_TOP - 70 },
  ],
  DURATION,
);

// --- type layout (SCREEN px at the current camera) ------------------------------------------------------------
const heroPx = TYPE.HERO;
const secPx = TYPE.SECONDARY;
/** baseline screen y of a numeral standing on a column whose top is world y */
const baseOn = (c: Cam, topWorld: number) => syOf(c, topWorld) - SPACE.CLEAR;

/** Screen boxes of everything at frame f (pre-dy), for the keep-in check. */
export const boxesAt = (f: number) => {
  const c = camAt(f);
  const out: { name: string; x0: number; x1: number; y0: number; y1: number }[] = [];
  const tileBox = (x: number, h: number) => ({ x0: sxOf(c, x - TILE_TALL / 2), x1: sxOf(c, x + TILE_TALL / 2), y0: syOf(c, TILE_TOP - h), y1: syOf(c, FLOOR) + 4 });
  out.push({ name: "merc", ...tileBox(X_MERC, mercGlass(f)) });
  if (f >= NUM_IN[0] + 4) {
    const b = baseOn(c, TILE_TOP - mercGlass(f));
    const w = moneyWidth(f >= FILL2[0] ? "$12B" : "$10B", heroPx);
    out.push({ name: "hero", x0: sxOf(c, X_MERC) - w / 2, x1: sxOf(c, X_MERC) + w / 2, y0: b - heroPx * METRIC.dollarTop, y1: b + heroPx * METRIC.dollarDesc });
  }
  const lx = lakersPose(f).x;
  if (f >= LAKERS_TRAVEL[1]) out.push({ name: "lakers", ...tileBox(lx, lakersCol(f)) });
  if (f >= LAKERS_NUM[0] + 4) {
    const b = baseOn(c, TILE_TOP - lakersCol(f));
    const w = moneyWidth("$10B", secPx);
    out.push({ name: "lakersNum", x0: sxOf(c, lx) - w / 2, x1: sxOf(c, lx) + w / 2, y0: b - secPx * METRIC.dollarTop, y1: b + secPx * METRIC.dollarDesc });
  }
  return out;
};

/** Every frame where an element leaves the keep-in box by more than 2 px (pre-dy). */
export const keepInMisses = () => {
  const out: string[] = [];
  for (let f = 0; f < DURATION; f++) {
    for (const b of boxesAt(f)) {
      const miss = keepInMiss(b);
      if (miss > 2) out.push(`f${f} ${b.name} out by ${miss.toFixed(1)} px`);
    }
  }
  return out;
};

const PricedLikeTheLakers: React.FC<z.infer<typeof schema>> = ({ levelLine }) => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = amberBandFor(cam);

  const mG = mercGlass(f);
  const mF = mercFill(f);
  const v = mercValue(f);
  const dv = mercValue(f + 0.5) - mercValue(f - 0.5);
  const mBase = baseOn(cam, TILE_TOP - mG);

  const lp = lakersPose(f);
  const lH = lakersCol(f);
  const lOn = f >= LAKERS_TRAVEL[0];
  const lBase = baseOn(cam, TILE_TOP - lH);

  return (
    <StoutStage S={f} cam={cam} rest={CAM.rest} pool={POOL(f)} dy={DY}>
      <ValueColumn
        x={X_MERC}
        tile={TILE_TALL}
        k={k}
        figure={FIG.MERC}
        rung={VALUE_TALL_RUNG}
        glass={mG}
        fill={mF}
        glassHi={clamp01((f - GLASS_HI[0]) / (GLASS_HI[1] - GLASS_HI[0]))}
        amberBand={band}
      />
      <LightSweep x={X_MERC - GEO.BAR / 2} y={TILE_TOP - mF} w={GEO.BAR} h={mF} k={k} t={(f - SWEEP[0]) / (SWEEP[1] - SWEEP[0])} on="amber" />
      {lOn ? (
        <ValueColumn x={lp.x} tile={TILE_TALL} k={k} figure={FIG.LAKERS} rung={VALUE_TALL_RUNG} glass={lH} fill={lH} fillTone="cream" glassHi={1} lift={lp.lift} amberBand={band} />
      ) : null}
      {levelLine && f >= LEVEL[0] ? (() => {
        // a dashed hairline at the Lakers' top, drawn by a moving tip from its column's left edge to Mercedes'
        // column's right edge: the measurement "level with $10B"
        const xR = lp.x - GEO.BAR / 2 - 6 / k;
        const xL = X_MERC + GEO.BAR / 2 + 6 / k;
        const tip = lerp(xR, xL, restToRest(clamp01((f - LEVEL[0]) / (LEVEL[1] - LEVEL[0])), 2.2));
        const y = TILE_TOP - lH;
        return (
          <line x1={xR} x2={tip} y1={y} y2={y} stroke={COLOR.inkCreamLo} strokeWidth={STROKE.HAIRLINE / k} strokeDasharray={`${6 / k} ${6 / k}`} />
        );
      })() : null}
      {f < FILL2[0] ? (
        // the count $1B .. $10B: linear steps (no dwell), the drum window feathered
        <MoneyOdometer
          {...wAt(cam, sxOf(cam, X_MERC), mBase)}
          k={k}
          px={heroPx}
          value={v}
          rollBlur={rollBlurLinear(dv, heroPx)}
          tone="amber"
          glow
          linear
          feather
          enter={clamp01((f - NUM_IN[0]) / (NUM_IN[1] - NUM_IN[0]))}
        />
      ) : (
        // "10, 12": ONE drum turn between the whole strings, riding the stretching top
        <MoneyDrum
          {...wAt(cam, sxOf(cam, X_MERC), mBase)}
          k={k}
          px={heroPx}
          from="$10B"
          to="$12B"
          t={stretch(f)}
          rollBlur={Math.min(heroPx / 10, 0.15 * heroPx * DRUM_PITCH * Math.abs(stretch(f + 0.5) - stretch(f - 0.5)))}
          tone="amber"
          glow
        />
      )}
      {f >= LAKERS_NUM[0] ? (
        <MoneyOdometer
          {...wAt(cam, sxOf(cam, lp.x), lBase)}
          k={k}
          px={secPx}
          value={DATA.LAKERS_VALUE}
          tone="cream"
          enter={clamp01((f - LAKERS_NUM[0]) / (LAKERS_NUM[1] - LAKERS_NUM[0]))}
        />
      ) : null}
    </StoutStage>
  );
};

export default PricedLikeTheLakers;

// --- load-time checks ------------------------------------------------------------------------------------
{
  const fail = (m: string) => {
    throw new Error(`PricedLikeTheLakers: ${m}`);
  };
  if (Math.abs(HL - H10) > 1e-9) fail("the Lakers' top must sit level with Mercedes' $10B");
  if (Math.abs(mercValue(FILL1[1]) - 10) > 1e-6 || Math.abs(mercValue(FILL2[1]) - 12) > 1e-6) fail("the odometer does not land on 10 / 12");
  const misses = keepInMisses();
  if (misses.length && !(globalThis as { __WORTH_PROBE__?: boolean }).__WORTH_PROBE__) fail(`${misses[0]} (+${misses.length - 1} more; KEEP ${JSON.stringify(KEEP)})`);
}
