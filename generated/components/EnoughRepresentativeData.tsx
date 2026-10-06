import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  INK,
  INK_HI,
  Label,
  RED,
  RED_DEEP,
  RED_HI,
  RED_WET,
  Stage,
  WET_DRY_F,
  WetLine,
  clamp01,
  cumLen,
  enterU,
  paperShadow,
  smoothstep,
  subPathD,
  sz,
} from "./chinatalkShared";
import {
  CORNER,
  DASH_FRAC,
  DASH_N,
  DORMANT_OP,
  DURATION,
  ENOUGH_F,
  ENOUGH_GONE_F0,
  ENOUGH_GONE_F1,
  ENOUGH_Y,
  FPS,
  HL_BAND,
  HL_F0,
  HL_F1,
  INK_SQUARES,
  MARCH,
  OUT_LEFT,
  OUT_LOOP,
  OUT_PERIM,
  OUT_RIGHT,
  REAL_F,
  REAL_Y,
  REST_CAM,
  SIDE,
  SOLID_F0,
  SOLID_F1,
  SYN_F,
  SYN_MIN,
  TILES,
  TILE_S,
  WAVE_F0,
  WAVE_F1,
  WORD_MIN,
  camAt,
  frameFade,
  hlR,
  inkSqAt,
  solidLen,
  solidTimeAt,
  strokeW,
  synY,
  tileAskew,
  waveR,
} from "./enoughGeom";

export { DURATION, FPS };

// ---------------------------------------------------------------------------
// EnoughRepresentativeData -- Bharat, "Synthetic data needs real data"
// (ChinaTalk), cut C, delivered as 39_EnoughRepresentativeData.mov.
//
// LINE: "So we need to have enough representative data in order for synthetic
// data to actually work."
// IN = 951 (edit frame; local f = S - 951). DURATION = 183 f exactly (S 951 ->
// 1134), 24 fps, 1080x1920, opaque. Local word frames: we 2 · need 9 · to have
// 16-23 · enough 23-31 · representative 31-55 · data 55-68 · in order for
// 68-84 · synthetic 84-99 · data 99-107 · actually 112-121 · work 121-130 ·
// then the hold.
//
// IDEA: the real pattern must be complete before it can be copied. REAL data =
// INK seal squares gathered into a 7x7 block with a hollow diamond and a core
// (41 squares); a DASHED outline marks ENOUGH. Around it stand eight dormant
// synthetic tiles (RED_DEEP 0.35, askew, a third of their squares, some
// misplaced). The block fills to the outline, the outline is written solid, and
// a wet red front runs outward: every tile becomes a complete vermilion replica.
// RED = synthetic data only; all text is ink. Geometry, clocks and the camera
// live in enoughGeom.ts. Five element types: ink squares, red squares, the
// outline, labels, the wet front / highlight.
//
// GESTURES (gesture -> word -> local frames)
// 1. "So we need to have" (0-23): close on the block (k 2.3 -> 2.5 creep from a
//    24 f pre-roll). 16 of 41 ink squares are in on f0 with two more in flight;
//    squares drop in a short way and settle, bottom-up with noise, one every
//    ~3 f. The dashed ENOUGH outline marches round the full extent.
// 2. "enough" (23-31): ENOUGH lands above the outline on 24 (12-24); squares arrive
//    faster (one every 1.4 f, 26-41).
// 3. "representative data" (31-68): REPRESENTATIVE DATA lands under the block
//    on 38 (26-38); the last squares land 44-57 and the core of the diamond on "data"
//    (60.5). Two wet ink tips write the outline SOLID from the top centre down
//    both sides and meet at the bottom centre (54-88): expected -> happened.
//    As the pass completes ENOUGH diffuses like ink (80-92): it has happened.
// 4. "in order for" (68-84): one long pull-back (glide 55-93, k 2.5 -> 0.955);
//    the eight dormant tiles enter round the block (3 x 3, the block in the
//    middle, label bands between the rows), coming up out of the paper as
//    the frame opens (they are faded out of the close-up and the caption band).
// 5. "synthetic data" (84-107): the tips meet (88) and the copy front leaves the
//    outline (87-124, 14.3 world px/f): as it crosses a tile the missing squares
//    are written by the wet front (RED_WET drying to RED over 18 f), dormant
//    ones turn vermilion, misplaced ones slide home and the tile squares up on
//    the grid. Side tiles first, then top / bottom, corners last. SYNTHETIC
//    DATA lands above the grid on 89 (77-89).
// 6. "to actually work" (112-130): the corner tiles complete on "work"
//    (last square reached 123.6). One ink block, eight identical vermilion replicas.
// 7. Hold (130-183): one travelling highlight (#F2604A) sweeps the replicas in
//    the same outward order (136-178) while the camera creeps in (96-200,
//    k -> 1.0); the last tiles finish squaring up (~150).
// ---------------------------------------------------------------------------

export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

type RGB = [number, number, number];
const rgbOf = (hex: string): RGB => {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
};
const C_RED = rgbOf(RED);
const C_DEEP = rgbOf(RED_DEEP);
const C_WET = rgbOf(RED_WET);
const C_HI = rgbOf(RED_HI);
const mix = (a: RGB, b: RGB, t: number): RGB => {
  const u = clamp01(t);
  return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
};
const css = (c: RGB) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

const LOOP_CUM = cumLen(OUT_LOOP);

/** The dashed ENOUGH outline: DASH_N dashes marching clockwise round the loop,
 *  drawn only where the solid tips have not passed (arc [solid, perim - solid]). */
const DashedOutline: React.FC<{ f: number; w: number; solid: number }> = ({ f, w, solid }) => {
  const lo = solid;
  const hi = OUT_PERIM - solid;
  if (hi - lo < 0.5) return null;
  const P = OUT_PERIM / DASH_N;
  const D = P * DASH_FRAC;
  const phase = (MARCH * f) / P;
  const segs: string[] = [];
  const add = (a: number, b: number) => {
    const s0 = Math.max(lo, a);
    const s1 = Math.min(hi, b);
    if (s1 - s0 > 0.4) segs.push(subPathD(OUT_LOOP, LOOP_CUM, s0, s1));
  };
  for (let i = 0; i < DASH_N; i++) {
    const a = ((((i + phase) % DASH_N) + DASH_N) % DASH_N) * P;
    const b = a + D;
    if (b <= OUT_PERIM) add(a, b);
    else {
      add(a, OUT_PERIM);
      add(0, b - OUT_PERIM);
    }
  }
  return <path d={segs.join("")} fill="none" stroke={INK} strokeOpacity={INK_HI} strokeWidth={w.toFixed(3)} strokeLinecap="round" strokeLinejoin="round" />;
};

const sqRect = (key: string, x: number, y: number, fill?: string, opacity?: number) => (
  <rect
    key={key}
    x={(x - SIDE / 2).toFixed(2)}
    y={(y - SIDE / 2).toFixed(2)}
    width={SIDE}
    height={SIDE}
    rx={CORNER}
    fill={fill}
    opacity={opacity !== undefined && opacity < 0.999 ? opacity.toFixed(4) : undefined}
  />
);

const EnoughRepresentativeData: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = camAt(f);
  const k = cam.k;
  const w = strokeW(k);

  // -- the real data: ink squares gathered into the block --------------------------
  const ink: React.ReactNode[] = [];
  for (const s of INK_SQUARES) {
    const st = inkSqAt(s, f);
    if (!st) continue;
    ink.push(sqRect(`i${s.i}-${s.j}`, s.x + st.ox, s.y + st.oy, undefined, st.op));
  }

  // -- the outline: dashed (expected), then written solid (happened) ----------------
  const solid = solidLen(f);
  const tipBead = f >= SOLID_F0 ? 1 - smoothstep((f - (SOLID_F1 - 2)) / 4) : 0;

  // -- the copy front and the synthetic tiles -----------------------------------------
  const R = waveR(f);
  const waving = f >= WAVE_F0 - 1 && f <= WAVE_F1 + 10;
  const frontOp = smoothstep((f - WAVE_F0) / 5) * (1 - smoothstep((f - (WAVE_F1 - 8)) / 12));
  const FEATHER = 26;
  const hlOn = f > HL_F0 && f < HL_F1;
  const Rh = hlR(f);

  const dormantLayer: React.ReactNode[] = [];
  const writtenLayer: React.ReactNode[] = [];
  TILES.forEach((tile, ti) => {
    const a = tileAskew(tile, f);
    const tf = `translate(${(tile.cx + tile.offx * a).toFixed(2)} ${(tile.cy + tile.offy * a).toFixed(2)}) rotate(${(tile.rot * a).toFixed(3)}) scale(${TILE_S})`;
    const there: React.ReactNode[] = [];
    const written: React.ReactNode[] = [];
    tile.squares.forEach((sq, si) => {
      const age = f - sq.arrive;
      const fade = frameFade(cam, tile.cx + sq.x * TILE_S, tile.cy + sq.y * TILE_S);
      if (fade <= 0.003) return;
      const dry = smoothstep((age - 3) / WET_DRY_F);
      let col: RGB;
      if (sq.present) {
        // dormant -> reached by the front -> vermilion (one eased change)
        col = mix(mix(C_DEEP, C_WET, smoothstep(age / 5)), C_RED, dry);
      } else {
        if (age < -4) return;
        col = mix(C_WET, C_RED, dry);
      }
      if (hlOn) {
        const x = (sq.dist - Rh) / HL_BAND;
        if (Math.abs(x) < 1) col = mix(col, C_HI, 0.92 * (1 - x * x) * (1 - x * x));
      }
      if (sq.present) {
        const home = 1 - smoothstep(age / 14); // misplaced squares slide home
        const op = (DORMANT_OP + (1 - DORMANT_OP) * smoothstep(age / 6)) * fade;
        there.push(sqRect(`p${si}`, sq.x + sq.ox * home, sq.y + sq.oy * home, css(col), op));
      } else {
        written.push(sqRect(`w${si}`, sq.x, sq.y, css(col), fade));
      }
    });
    if (there.length) dormantLayer.push(<g key={ti} transform={tf}>{there}</g>);
    if (written.length) writtenLayer.push(<g key={ti} transform={tf}>{written}</g>);
  });

  const maskOn = f < WAVE_F1 + 8;
  const inner = Math.max(0, (R - FEATHER) / Math.max(1, R));

  return (
    <Stage S={f} cam={cam} rest={REST_CAM}>
      <defs>
        <radialGradient id="erd-front" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={Math.max(1, R).toFixed(2)}>
          <stop offset={0} stopColor={RED_WET} stopOpacity={0} />
          <stop offset={clamp01((R - 96) / Math.max(1, R)).toFixed(4)} stopColor={RED_WET} stopOpacity={0} />
          <stop offset={clamp01((R - 34) / Math.max(1, R)).toFixed(4)} stopColor={RED_WET} stopOpacity={0.1} />
          <stop offset={1} stopColor={RED_WET} stopOpacity={0} />
        </radialGradient>
        <radialGradient id="erd-reveal" gradientUnits="userSpaceOnUse" cx={0} cy={0} r={Math.max(1, R).toFixed(2)}>
          <stop offset={0} stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset={inner.toFixed(4)} stopColor="#FFFFFF" stopOpacity={1} />
          <stop offset={1} stopColor="#FFFFFF" stopOpacity={0} />
        </radialGradient>
        <mask id="erd-mask" maskUnits="userSpaceOnUse" x={-1000} y={-1000} width={2000} height={2000}>
          <circle cx={0} cy={0} r={Math.max(1, R).toFixed(2)} fill="url(#erd-reveal)" />
        </mask>
      </defs>

      {/* the wet front on the paper between the tiles */}
      {waving && frontOp > 0.003 ? <circle cx={0} cy={0} r={R.toFixed(2)} fill="url(#erd-front)" opacity={frontOp.toFixed(4)} /> : null}

      {/* synthetic data: dormant echoes, then written complete by the front */}
      <g style={{ filter: paperShadow(k) }}>
        {dormantLayer}
        {writtenLayer.length ? <g mask={maskOn ? "url(#erd-mask)" : undefined}>{writtenLayer}</g> : null}
      </g>

      {/* real data: the ink block, flat as printed */}
      <g fill={INK} opacity={INK_HI}>
        {ink}
      </g>

      {/* the ENOUGH outline */}
      <DashedOutline f={f} w={w} solid={solid} />
      {solid > 0.05
        ? [OUT_RIGHT, OUT_LEFT].map((pts, i) => (
            <WetLine
              key={i}
              id={`erd-tip${i}`}
              points={pts}
              len={solid}
              k={k}
              ink
              rung={INK_HI}
              width={w / sz(k)}
              bead={tipBead}
              ageAt={(s) => f - solidTimeAt(s)}
            />
          ))
        : null}

      {/* labels (all ink) */}
      <Label text="enough" x={0} y={ENOUGH_Y} k={k} size="word" minPx={WORD_MIN} appear={enterU(f, ENOUGH_F)} diffuse={clamp01((f - ENOUGH_GONE_F0) / (ENOUGH_GONE_F1 - ENOUGH_GONE_F0))} />
      <Label text="representative data" x={0} y={REAL_Y} k={k} size="word" minPx={WORD_MIN} appear={enterU(f, REAL_F)} />
      <Label text="synthetic data" x={0} y={synY(k)} k={k} size="word" minPx={SYN_MIN} appear={enterU(f, SYN_F)} />
    </Stage>
  );
};

export default EnoughRepresentativeData;
