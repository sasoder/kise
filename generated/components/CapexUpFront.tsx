import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import type { Cam } from "./outgrowShared";
import { Label, LightSweep, METRIC, Numeral, StoutStage, amberBandFor, camFor, clamp01, lerp, smoothstep } from "./stoutShared";
import { BASE, Cluster, CostColumn, CostReadout, FLOOR, clusterW, costH } from "./aiBetShared";

// ---------------------------------------------------------------------------
// CapexUpFront — cut 1 of the "what frontier AI training costs" clip (Cheeky Pint S4E03, Meta; Mark
// Zuckerberg), Cheeky Pint S4 "stout" style (stoutShared.tsx, palette B1; world: aiBetShared.tsx).
// 1080x1920, 23.976 fps, opaque, 147 frames.
//
// CHECK LINE: Running a gigawatt cluster is $15B a year, but building one is $50–60B, and all of it
// is paid before it runs.
//
// THE LINE (frames from composition start): "if you're talking about building(13) the CapEx(21),
// it's(38) probably closer(46) to(57), and you(73) pay(80) for it up(92) front(95), so it's
// probably(107) 50(~112) or(117) 60(120) billion(126) dollars(134)."
// Just before the cut he says on camera: "...call it on the order of $15 billion to operate a
// gigawatt cluster for a year". Every figure shown is the speaker's own spoken estimate.
//
// COLOUR: amber = money committed / compute that is live. Cream = hardware. Nothing black.
//
// ONE SENTENCE OF MOTION: beside the dark cluster and its short yearly bar, a glass column rises and
// fills with amber, four times as high, and only when it is full do the racks come on.
//
// LAYOUT: cluster | yearly bar | build column on one floor; all identification UNDER the floor
// (1 GW CLUSTER; $15B / A YEAR / TO RUN), so nothing readable sits in the caption strip at either rest.
//
// FRAME TABLE (see T)
//   f 0        settled and alive: the 6x2 cluster, clearly unlit, the short amber bar, true to scale,
//              and the empty tile, whole and inside the frame. The camera is creeping.
//   f 8-14     its slot opens; f 12-54 the glass column rises out of it to the 60 level -> "building the CapEx"
//   f 21-112   amber fills it on one curve (soft start, long landing): 0 -> $50B; rungs every $15B
//   f 52-64    as the fill passes the yearly bar's top the count blurs in beside it and rides the top;
//              f 62-74 TO BUILD under it
//   f 9-120    the camera travels up with the fill
//   f 112      "$50B" lands on "50"
//   f 113-124  the lighter band extends 50 -> 60; on the same frames "–60" comes out from behind the
//              "B" and counts with it
//   f 122-133  the one light sweep, across the full column
//   f 126-141  ONLY NOW the racks come on, a wave from the column outward (money first, power second)
//   f 141-146  settled: column top ~y 380, tiles ~y 1485; slow creep, sway, grain
// ---------------------------------------------------------------------------

export const FPS = 24000 / 1001;
export const DURATION = 147;
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

// --- the world (WORLD px): cluster | yearly bar | build column -----------------------------------------
const COLS = 6;
const ROWS = 2;
export const X_CLUSTER = 400;
export const X_RUN = X_CLUSTER + clusterW(COLS) / 2 + 32 + BASE.TILE_W / 2; // 656
export const X_COLUMN = X_RUN + BASE.TILE_W + 48; // 784
const TILE_TOP = FLOOR - BASE.H;
const RUN_H = costH(15);
const LO_H = costH(50);
const HI_H = costH(60);

// --- the frame table ----------------------------------------------------------------------------------
const T = {
  slot: [8, 14],
  glass: [12, 54],
  fill: [21, 112],
  count: 52, // the fill has just passed the yearly bar's top
  build: 62,
  cam: [9, 120],
  range: [113, 124], // the "–60" opens on the band's own frames
  band: [113, 124],
  sweep: [122, 133],
  wave: 126,
  waveStep: 1.6,
  waveF: 7,
} as const;
const ENTER_F = 12;
const smoother = (v: number) => {
  const u = clamp01(v);
  return u * u * u * (u * (u * 6 - 15) + 10);
};
const win = (f: number, a: readonly [number, number] | readonly number[]) => (f - a[0]) / (a[1] - a[0]);

/** The fill's progress 0..1: steady, with a soft start and a soft landing on "50". */
const fillP = (f: number) => {
  const u = clamp01(win(f, T.fill));
  return lerp(u, smoothstep(u), 0.65);
};
const bandP = (f: number) => smoothstep(win(f, T.band));

// --- the camera: the whole floor line in frame from f 0, then up with the fill; a slow creep that never stops ------------
const camAt = (f: number): Cam => {
  const e = smoother(win(f, T.cam));
  const k = Math.exp(Math.log(1.66) + Math.log(1.585 / 1.66) * e) * (1 + 0.012 * (f / (DURATION - 1)));
  return camFor(520, FLOOR, 540, lerp(1226, 1546, e), k);
};

const LABEL_PX = 64; // legible at 270 px wide
const RUN_LABEL_PX = 52;
const COUNT_PX = 160;
const RUN_PX = 104; // about two thirds of the build numeral

const CapexUpFront: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const band = amberBandFor(cam);

  const glass = HI_H * smoothstep(win(f, T.glass));
  const p = fillP(f);
  const fill = LO_H * p;
  const bp = bandP(f);
  const value = 50 * p;
  const speed = Math.abs(50 * fillP(f + 0.5) - 50 * fillP(f - 0.5)) + Math.abs(10 * bandP(f + 0.5) - 10 * bandP(f - 0.5));

  // --- the count rides the fill's top, left of the column; settled, its caps are centred on the 50-60 band
  const capH = (METRIC.fig * COUNT_PX) / k; // world
  const lockDrop = (24 + METRIC.cap * LABEL_PX) / k; // numeral baseline -> TO BUILD baseline
  const countX = X_COLUMN - BASE.BAR_W / 2 - 28 / k;
  const countY = TILE_TOP - (fill + (HI_H - LO_H) / 2 - capH / 2);

  // --- identification lives UNDER the floor (clear of the caption strip at both rests)
  const clusterLabelY = FLOOR + (26 + METRIC.cap * LABEL_PX) / k;
  const runNumY = FLOOR + (26 + METRIC.fig * RUN_PX) / k;
  const runL1 = runNumY + (22 + METRIC.cap * RUN_LABEL_PX) / k;
  const runL2 = runL1 + (RUN_LABEL_PX * 1.1) / k;

  const sweep = win(f, T.sweep);
  const lit = (col: number) => smoothstep((f - (T.wave + (COLS - 1 - col) * T.waveStep)) / T.waveF);
  const g = { x: X_COLUMN - BASE.BAR_W / 2, y: TILE_TOP - fill - (HI_H - LO_H) * bp, w: BASE.BAR_W, h: fill + (HI_H - LO_H) * bp };
  const poolE = smoother(win(f, T.cam));
  return (
    <StoutStage S={f} cam={cam} rest={camAt(0)} pool={{ x: lerp(480, 560, poolE), y: lerp(TILE_TOP - 120, TILE_TOP - 420, poolE) }}>
      <Cluster x={X_CLUSTER} k={k} cols={COLS} rows={ROWS} lit={(col) => lit(col)} amberBand={band} />
      <CostColumn x={X_RUN} k={k} bar={RUN_H} amberBand={band} />
      <CostColumn
        x={X_COLUMN}
        k={k}
        glass={glass}
        fill={fill}
        band={(HI_H - LO_H) * bp}
        rung={RUN_H}
        slot={smoothstep(win(f, T.slot))}
        glassHi={smoothstep((f - T.fill[1]) / 12)}
        amberBand={band}
      />
      <LightSweep x={g.x} y={g.y} w={g.w} h={g.h} k={k} t={sweep} on="amber" />

      <Label x={X_CLUSTER - clusterW(COLS) / 2 + BASE.OVER} y={clusterLabelY} k={k} text="1 GW CLUSTER" px={LABEL_PX} anchor="start" />
      <Numeral x={X_RUN} y={runNumY} k={k} px={RUN_PX} text="$15B" />
      <Label x={X_RUN} y={runL1} k={k} text="A YEAR" px={RUN_LABEL_PX} />
      <Label x={X_RUN} y={runL2} k={k} text="TO RUN" px={RUN_LABEL_PX} />

      <CostReadout
        x={countX}
        y={countY}
        k={k}
        px={COUNT_PX}
        value={value}
        hi={50 + 10 * bp}
        reveal={bp > 0 ? smoothstep(win(f, T.range)) : 0}
        rollBlur={Math.min(9, 7 * speed)}
        enter={clamp01((f - T.count) / ENTER_F)}
      />
      <Label x={countX} y={countY + lockDrop} k={k} text="TO BUILD" px={LABEL_PX} anchor="end" enter={clamp01((f - T.build) / ENTER_F)} />
    </StoutStage>
  );
};

export default CapexUpFront;
