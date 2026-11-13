// ---------------------------------------------------------------------------
// NinetyNineYes (nik-any-idea, cut 34). Cheeky Pint style, the stout board (styles/cheeky-pint.md).
// Opaque 1080x1920, 23.976 fps, 95 frames. Palette B1 (the stoutShared default).
//
// CHECK LINE: "Nik backs nearly every new idea: 99 out of 100."
//
// THE LINE (Nik Storonsky): "(to) be honest, in 99% of cases, I'm always up for new ideas."
// WORD -> FRAME (from the composition start): be 3 · honest 5 · in 6 · 99 12 · % of 27 · cases 37 · I'm 45 ·
// always 51 · up 58 · for 66 · new 77 · ideas 83.
// DURATION: the slot 34.826 -> 38.789 s (sequence frames 835-930) = 3.963 s x 23.976 = 95 frames (f0..f94).
//
// THE MOTION: a 10 x 10 grid of idea bulbs (ideaBulb.tsx) on the board. The cut opens on ONE bulb in the bottom row
// already lighting amber (f0-6) among ~30 cream ones, mid-pull: the camera pulls back on one deceleration (f0-14,
// k 2.1 -> 1.0, fastest at f0) while an amber wave fills the grid from that bulb: each bulb lights when the wavefront
// reaches it (start = the wave's arrival at its distance, 8 f to light), the last two (the top corners, reached on the
// same frame) full at f27. One bulb (row 3, column 8) is passed by and stays cream. A cream counter above the grid
// counts the lit bulbs (lit / 100 = %) in whole numbers, one per frame, locked to the fill: it slides up from f9 (on
// screen for "99", f12) and lands on "99%" at f27 ("% of"), with the wave. f27-94: the camera creeps in about the unlit
// bulb (k 1.0 -> ~1.04); on "new ideas" (f77-83) one gentle swell of warmth rises through the lit bulbs, bottom to top.
// FRAMING: the pull-back pivots on the grid's bottom edge (screen y 1045), so no camera state carries a bulb into the
// caption bands (y 1080-1250, 1360-1460); the creep about the unlit bulb takes the bottom edge to ~1066 at f94.
// AMBER = the ideas Nik says yes to (the clip's amber: what gets backed); cream = the one he does not; board = base.
//
// SOURCES: "99%" is Nik's own figure (the line); no other data.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, ElevationShadow, Label, Numeral, SPACE, StoutStage, TYPE, bloomFilter, camFor, clamp01, lerp, smoothstep } from "../kits/cheeky-pint/stoutShared";
import type { Cam } from "../kits/dwarkesh/outgrowShared";
import { BULB, IdeaBulb, bulbGlassPath, bulbSilhouette } from "./ideaBulb";

export const FPS = 24000 / 1001;
export const DURATION = 95;
export const schema = z.object({ probe: z.boolean().default(false) });
export const defaultProps = schema.parse({});

// --- the world (world px = screen px at the end of the pull-back, k 1) ---------------------------------
const N = 10;
const PITCH_X = 94;
const PITCH_Y = 82;
const SIZE = 74; // bulb height (box 56 x 74)
const BOTTOM = 1045; // the grid's bottom edge (world y), pinned at screen y BOTTOM through the pull-back
const colX = (c: number) => 540 + (c - (N - 1) / 2) * PITCH_X;
const rowY = (r: number) => BOTTOM - SIZE / 2 - (N - 1 - r) * PITCH_Y;
const GRID_TOP = rowY(0) - SIZE / 2; // 231
const ORIGIN = { r: 9, c: 4 }; // the first bulb: bottom row, left of centre
const UNLIT = { r: 2, c: 7 }; // the one that stays cream: upper right, off-centre, off the corners
const OX = colX(ORIGIN.c);
const OY = rowY(ORIGIN.r);
const UX = colX(UNLIT.c);
const UY = rowY(UNLIT.r);

// --- the wave -------------------------------------------------------------------------------------------
const WAVE = { f0: 0, f1: 19, ease: 1.1 } as const; // radius = D_MAX x (1 - (1 - u)^ease), u over f0..f1
const LIGHT_F = 8; // frames a bulb takes to light once the wavefront reaches it
const ORIGIN_T = -6; // the first bulb is already lighting on f0 (lit 0.5), full on f6
type Cell = { r: number; c: number; x: number; y: number; d: number; t: number; unlit: boolean };
/** The wave's distance: the first bulb sits left of the axis, so the wave runs a touch slower to the left (by the
 *  sides' widths) and reaches both top corners on the same frame: no lone last bulb, no held 98 %. */
const SIDE_L = (colX(N - 1) - OX) / (OX - colX(0)); // 470 / 376
const waveDist = (x: number, y: number) => Math.hypot((x - OX) * (x < OX ? SIDE_L : 1), y - OY);
const D_MAX = Math.max(...Array.from({ length: N * N }, (_, i) => waveDist(colX(i % N), rowY(Math.floor(i / N)))));
const waveRadius = (f: number) => D_MAX * (1 - Math.pow(1 - clamp01((f - WAVE.f0) / (WAVE.f1 - WAVE.f0)), WAVE.ease));
/** The frame the wavefront reaches distance d (the wave's inverse). */
const arrival = (d: number) => WAVE.f0 + (WAVE.f1 - WAVE.f0) * (1 - Math.pow(1 - clamp01(d / D_MAX), 1 / WAVE.ease));
const CELLS: Cell[] = Array.from({ length: N * N }, (_, i) => {
  const r = Math.floor(i / N);
  const c = i % N;
  const x = colX(c);
  const y = rowY(r);
  const d = waveDist(x, y);
  const isO = r === ORIGIN.r && c === ORIGIN.c;
  return { r, c, x, y, d, t: isO ? ORIGIN_T : arrival(d), unlit: r === UNLIT.r && c === UNLIT.c };
});
const litAt = (cell: Cell, f: number) => (cell.unlit ? 0 : clamp01((f - cell.t) / (cell.r === ORIGIN.r && cell.c === ORIGIN.c ? 12 : LIGHT_F)));
/** The counter: each bulb counts while it lights (from lit ~0.25, over 6 f: in step with its glass), so the count rides the wave. */
const countAt = (f: number) => CELLS.reduce((a, cell) => a + (cell.unlit ? 0 : smoothstep((f - cell.t - 2) / 6)), 0);

// --- the camera -----------------------------------------------------------------------------------------
const K0 = 2.1; // the opening: the first bulb ~155 px tall at y ~967, about 30 cream bulbs round it
const K1 = 1.0; // the grid ~84 % of the width, y 231-1045
const PULL = { f0: 0, f1: 14, pow: 2 } as const; // one deceleration: fastest at f0 (the cut opens mid-pull, ~10 %/f), k 1.1 at f9, still at f14
const CREEP = { f0: 12, f1: 130, k: 1.055 } as const; // runs on past the last frame: still moving at f94
const pullP = (f: number) => 1 - Math.pow(1 - clamp01((f - PULL.f0) / (PULL.f1 - PULL.f0)), PULL.pow);
const camAt = (f: number): Cam => {
  const p = pullP(f);
  const kp = Math.exp(lerp(Math.log(K0), Math.log(K1), p));
  const k = kp * Math.exp(Math.log(CREEP.k) * smoothstep((f - CREEP.f0) / (CREEP.f1 - CREEP.f0)));
  // the pull-back: world (xl, BOTTOM) sits at screen (540, BOTTOM); x glides from the first bulb to the grid's axis
  const xl = lerp(OX, 540, p);
  // the creep: zoom about the unlit bulb, held where the pull-back camera puts it
  const sux = 540 + (UX - xl) * kp;
  const suy = BOTTOM + (UY - BOTTOM) * kp;
  return camFor(UX, UY, sux, suy, k);
};

// --- the counter ----------------------------------------------------------------------------------------
const COUNTER_Y = GRID_TOP - SPACE.CLEAR - 4; // baseline, world (cap top ~ y 105 at k 1)
const COUNTER_IN = 9; // the house entrance as the pull-back frames it (k 1.1), 12 f: on screen for "99" (f12)
// --- the living frame -----------------------------------------------------------------------------------
/** On "new ideas": one gentle swell of warmth rises through the lit bulbs, bottom row to top row (f68 -> f92, the
 *  crest mid-grid ~f80); each bulb warms and cools over ~12 f. The unlit bulb is never touched. */
const RIPPLE = { f0: 68, f1: 92, amp: 0.2, w: 5 } as const;
const rippleAt = (y: number, f: number) => {
  const fc = RIPPLE.f0 + ((BOTTOM - y) / (BOTTOM - GRID_TOP)) * (RIPPLE.f1 - RIPPLE.f0);
  return RIPPLE.amp * Math.exp(-Math.pow((f - fc) / RIPPLE.w, 2));
};

const NinetyNineYes: React.FC<z.infer<typeof schema>> = ({ probe }) => {
  const S = useCurrentFrame();
  if (probe) return <BulbProbe />;
  const cam = camAt(S);
  const k = cam.k;
  const bulbs = CELLS.map((cell) => ({ ...cell, lit: litAt(cell, S) }));
  const v = countAt(S);
  const settle = smoothstep(S / 20);
  const swell = S > RIPPLE.f0 - 3 * RIPPLE.w && S < RIPPLE.f1 + 3 * RIPPLE.w;
  return (
    <StoutStage S={S} cam={cam} rest={camAt(0)} pool={{ x: lerp(OX, 540, settle), y: lerp(OY, 640, settle), strength: lerp(1.2, 1.6, settle) }}>
      {/* one shadow layer for the whole grid */}
      <ElevationShadow silhouette={bulbs.flatMap((b) => bulbSilhouette(b.x, b.y, SIZE))} />
      {bulbs.map((b, i) => (
        <IdeaBulb key={`b${i}`} x={b.x} y={b.y} size={SIZE} k={k} lit={b.lit} part="body" />
      ))}
      {/* all the amber, one bloom */}
      <g style={{ filter: bloomFilter(k) }}>
        {bulbs.map((b, i) => (b.lit > 0.001 ? <IdeaBulb key={`a${i}`} x={b.x} y={b.y} size={SIZE} k={k} lit={b.lit} part="amber" bloom={false} /> : null))}
      </g>
      {/* "new ideas": a swell of warmth rising through the lit glass */}
      {swell ? (
        <g fill={COLOR.amberHot}>
          {bulbs.map((b, i) =>
            b.lit >= 0.999 ? (
              <path
                key={`h${i}`}
                d={bulbGlassPath(b.x, b.y, SIZE)}
                opacity={rippleAt(b.y, S).toFixed(4)}
              />
            ) : null,
          )}
        </g>
      ) : null}
      {bulbs.map((b, i) => (
        <IdeaBulb key={`t${i}`} x={b.x} y={b.y} size={SIZE} k={k} lit={b.lit} part="top" />
      ))}
      {/* the count of lit bulbs, out of 100: the percentage */}
      <Numeral
        x={540}
        y={COUNTER_Y}
        k={k}
        px={TYPE.SECONDARY}
        // whole numbers, one per frame (no half-rolled digits); each value is passed a hair under the whole number so
        // the kit draws it in its odometer's tabular layout: the string never shifts as digits change or as it lands
        value={Math.min(Math.round(v), 99) - 1e-6}
        format={(n) => `${n}%`}
        rollBlur={0}
        tone="cream"
        enter={clamp01((S - COUNTER_IN) / 12)}
      />
    </StoutStage>
  );
};

/** The bulb probe (--props '{"probe":true}'): unlit / half-lit / lit at 60 / 92 / 180 screen px, k = 1. */
const BulbProbe: React.FC = () => {
  const S = useCurrentFrame();
  const cam = { x: 540, y: 960, k: 1 };
  const rows = [
    { size: 60, y: 520 },
    { size: 92, y: 760 },
    { size: 180, y: 1120 },
  ];
  const cols = [
    { lit: 0, x: 220 },
    { lit: 0.5, x: 540 },
    { lit: 1, x: 860 },
  ];
  return (
    <StoutStage S={S} cam={cam} pool={{ x: 540, y: 900 }} sway={false}>
      {rows.flatMap((r) => cols.map((c) => <IdeaBulb key={`${r.size}-${c.lit}`} x={c.x} y={r.y} size={r.size} k={1} lit={c.lit} />))}
      {cols.map((c) => (
        <Label key={c.lit} x={c.x} y={1340} k={1} text={`lit ${c.lit}`} tone="cream" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <IdeaBulb key={`g${i}`} x={126 + i * 92} y={1560} size={74} k={1} lit={i < 6 ? 1 : i === 6 ? 0.6 : i === 7 ? 0.25 : 0} />
      ))}
    </StoutStage>
  );
};

// exported for the sheets / checks
export const NINETY_NINE = { camAt, CELLS, countAt, waveRadius, BOTTOM, SIZE, BULB };

export default NinetyNineYes;
