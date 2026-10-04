import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CLAIM_D,
  DURATIONS,
  EmpireHatch,
  EmpireLayer,
  FPS as WORLD_FPS,
  G,
  INK_FULL,
  MapLabel,
  MapStack,
  PEN,
  PEN_ARC_LEN,
  PEN_LEN,
  PaperTop,
  PenNib,
  SEA,
  TENOCH,
  TlaxcalaClaims,
  WorldSvg,
  clamp01,
  fortressNib,
  fortressSize,
  camFor,
  makeTrack,
  smootherstep,
  smoothstep,
  swayCam,
  type Cam,
  type P2,
} from "./tlaxShared";

// ---------------------------------------------------------------------------
// CarvedOutOfTheAztecs: cut A of Si Sheppard on Dwarkesh,
// "Sheppard_Tlaxcalans_thought_they_used_Cortes" (71.9 s edit; SP/clip.srt is
// the edit timeline). One continuous map film of five cuts on THE TLAXCALA
// WORLD (tlaxShared.tsx); this is the first. Clip clock G = f (CLIP_G0.A 0).
// "we want territory carved out of the Aztecs. We want our own fortress in
//  Tenochtitlan after this is over."
//
// TIMELINE. In-point 15.40 s = f0; f = round((t - 15.40) * 24) (SP/frames.txt):
//   we f0 · want f3 · territory f10 · carved f22 · out of f30 · the f35 ·
//   Aztecs f37 · we f48 · want f49 · our f53 · own f58 · fortress f65 · in f75 ·
//   Tenoch- f81 · -titlan f85 · after f92 · this f97 · is f106 · over f108.
// DURATION: the last word ends 20.239 s: round((20.239 - 15.400) * 24) =
//   round(116.1) = 116, + the 16-frame house tail = 132 frames (f0..f131).
//
// DWARKESH MAP STYLE on the Tlaxcala world: navy sea, umber land + rim, cream
// IM Fell ink, engraved line work, baked paper grain, vignette; no grid,
// compass, cartouche, legend or title. Opaque 1080x1920, 24 fps.
// PALETTE RULE: orange = THE AZTECS' ENEMIES ONLY (here Tlaxcala, its claim,
// its tie, its fortress); the Aztec empire is cream (context-rung hatch, fine
// dashed cream border). The one label: TENOCHTITLAN.
//
// THE GESTURES (one continuous orange pen stroke that never lifts), each with
// its word and frames:
//   1. "we want territory" f0-10. Open close on Tlaxcala at k 13.0 (its
//      centroid at (540, 775), a touch above y 835 so the claim's border is in
//      the frame; cream hatch all round, Tlaxcala orange with its orange
//      border; Tenochtitlan off frame to the west), the camera already creeping
//      down toward Tlaxcala's south border, where the claim will be. The orange
//      nib fades in on that border at P1 (f4-9; at y ~1040).
//   2. "territory carved out of the Aztecs" f10-51. The pen cuts the claim's
//      outline out of the cream empire, from P1 round the south and back up to
//      the border at P2 (f10-40, landing just after "Aztecs" f37, at
//      (528, 866)); the camera rides down with it (k 13.0 -> 14.9 at f31). As
//      the loop closes the carved piece turns cream -> orange, the hatch
//      sweeping in from the cut line (f37-51; the claim one rung under
//      Tlaxcala: claimed, not held).
//   3. "we want our own fortress" f41-59. Without lifting, the pen leaves the
//      loop at P2 and runs west across the empire to Tenochtitlan as a dashed
//      orange tie, south of Tlaxcala and past the volcanoes (nib <= 38 px/f);
//      the camera glides with it in one long move (f29-71, <= 31 px/f) and
//      opens out to k 9.0, landing ~f68 with Tenochtitlan at (380, 785): Lake
//      Texcoco enters from the left, Tlaxcala holds the right half.
//   4. "fortress" f59-76. On the island the same pen draws the Fortress: its
//      outline without lifting (f59-72), then the gate, slits, courses and
//      hatching (to f76); the nib fades at the east tower's foot (f71-75).
//   5. "Tenochtitlan" f73-87. TENOCHTITLAN slides up above the fortress
//      (starts f73, opaque f82, settled f87), clear of the tie.
//   6. "after this is over" f71-131. The held breath: the camera creeps ~3 %
//      toward the fortress (k 9.0 -> 9.27 by f131, still moving: cut B
//      continues it). Nothing else.
//
// SOURCES (and SP/FACTS.md, cut A). Tlaxcala's terms: Wikipedia "Fall of
// Tenochtitlan" ("to have the city of Cholula, an equal share of any of the
// spoils, the right to build a citadel in Tenochtitlan, and ... to be exempted
// from any future tribute"; Hassig, Mexico and the Spanish Conquest). The
// map: the georeferenced "Aztec Empire 1519 map-fr.svg" (Wikimedia Commons;
// after Atlas del Mexico prehispanico, Arqueologia Mexicana 2000;
// scripts/cortes-geo.json) - it draws Cholula INSIDE the independent
// Tlaxcala region, so the carved piece is a PROXY: the empire land round the
// source's Tepeyacac (Tepeaca) marker on Tlaxcala's south border, the
// tributary the alliance took first (Aug-Sep 1520, with Tlaxcalan warriors;
// Wikipedia "Tepeaca": a centre of Aztec tribute collection; Cortes founded
// Segura de la Frontera there). Its name never shows. Tenochtitlan
// 19.435 N 99.133 W; Lake Texcoco 1519 (same source, smoothed); Natural
// Earth 10m land.
// ---------------------------------------------------------------------------

export const DURATION = DURATIONS.A; // 132
export const FPS = WORLD_FPS;
export const LAST = DURATION - 1;

export const schema = z.object({
  vignette: z.number(),
  label: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, label: "TENOCHTITLAN" });

// -- timing (frames) -----------------------------------------------------------
export const T = {
  nibIn: [4, 9] as [number, number],
  arc: [10, 40] as [number, number],
  sweep: [37, 51] as [number, number],
  tie: [41, 59] as [number, number],
  fortress: [59, 76] as [number, number],
  outlineEnd: 72,
  nibOut: [71, 75] as [number, number],
  label: 73,
};

// -- the camera: its own keyed track. Four framings (each = a world point at a
// screen point at a zoom) joined by three overlapping velocity bumps
// (cortesShared makeTrack: raised-cosine velocity, so every move starts and
// lands with zero acceleration and the camera is never at rest):
//   F0 f0     Tlaxcala, its centroid at (540, 775), k 13.0 (already creeping)
//   F1        the claim, its middle at (610, 865), k 15.0 (move 1, f-8..40)
//   F2        Tenochtitlan at (380, 785), k 9.0 (move 2, the glide, f29..71)
//   F3 f131   Tenochtitlan at (378, 783), k 9.27 (move 3, the creep, f56..230,
//             still moving at the cut: cut B continues it)
const TLAX_C: P2 = [97.75, 868.5]; // Tlaxcala's area centroid (world px)
const CLAIM_M: P2 = [103.0, 896.0]; // the claim's middle
const frameOf = (p: P2, k: number, sx: number, sy: number) => {
  const c = camFor(p, k, sx, sy);
  return [Math.log(k), c.cx, c.cy];
};
export const FRAMINGS = {
  F0: frameOf(TLAX_C, 13.0, 540, 775),
  F1: frameOf(CLAIM_M, 15.0, 610, 865),
  F2: frameOf(TENOCH, 9.0, 380, 785),
  F3: frameOf(TENOCH, 9.27, 378, 783),
};
const MOVES = { m1: [-8, 40, 1] as const, m2: [29, 71, 0.6] as const, m3: [56, 230, 0.5] as const };
// the creep's area is set so the camera reaches F3 exactly on f131
const CREEP_FRAC = makeTrack([[MOVES.m3[0], MOVES.m3[1], 1, MOVES.m3[2]]], 0, -80, 480)(131);
// move 1 began before f0: the part still to come after f0
const M1_REST = 1 + makeTrack([[MOVES.m1[0], MOVES.m1[1], 1, MOVES.m1[2]]], 0, -80, 480)(-80);
const channel = (c: number) =>
  makeTrack(
    [
      [MOVES.m1[0], MOVES.m1[1], (FRAMINGS.F1[c] - FRAMINGS.F0[c]) / M1_REST, MOVES.m1[2]],
      [MOVES.m2[0], MOVES.m2[1], FRAMINGS.F2[c] - FRAMINGS.F1[c], MOVES.m2[2]],
      [MOVES.m3[0], MOVES.m3[1], (FRAMINGS.F3[c] - FRAMINGS.F2[c]) / CREEP_FRAC, MOVES.m3[2]],
    ],
    FRAMINGS.F0[c],
    -80,
    480,
  );
const LNK = channel(0);
const CX = channel(1);
const CY = channel(2);
/** the authored camera at frame f (no sway) */
export const camAt = (f: number): Cam => ({ k: Math.exp(LNK(f)), cx: CX(f), cy: CY(f) });
/** the camera as rendered (the house sway on the clip clock) */
export const camShown = (f: number): Cam => swayCam(camAt(f), G("A", f));

// -- the pen ---------------------------------------------------------------------
// the arc: eased in and out (it lands on the border at P2 on f40); the tie:
// eased out of the rest at P2 and into the rest at Tenochtitlan
const easeIO = (f: number, a: number, b: number) => {
  // a gentler profile than smootherstep for long strokes: sine in-out
  const u = clamp01((f - a) / (b - a));
  return 0.5 - 0.5 * Math.cos(Math.PI * u);
};
/** the pen head (arclength on PEN) at frame f */
export const penSAt = (f: number) => {
  if (f <= T.arc[0]) return 0;
  if (f <= T.arc[1]) return PEN_ARC_LEN * easeIO(f, T.arc[0], T.arc[1]);
  if (f <= T.tie[0]) return PEN_ARC_LEN;
  return PEN_ARC_LEN + (PEN_LEN - PEN_ARC_LEN) * easeIO(f, T.tie[0], T.tie[1]);
};
/** the fortress's progress: the outline at a near-constant pen speed (2-frame ramps), then the details */
export const fortressAt = (f: number) => {
  const [a, b] = T.fortress;
  if (f <= a) return 0;
  if (f >= b) return 1;
  const OUT_END = T.outlineEnd;
  if (f <= OUT_END) {
    // trapezoid speed: ramps of R frames
    const L = OUT_END - a;
    const R = 2;
    const t = f - a;
    const v = 1 / (L - R); // plateau speed (outline fraction per frame)
    let q: number;
    if (t < R) q = (v * t * t) / (2 * R);
    else if (t > L - R) q = 1 - (v * (L - t) * (L - t)) / (2 * R);
    else q = (v * R) / 2 + v * (t - R);
    return 0.75 * q;
  }
  return 0.75 + 0.25 * smoothstep((f - OUT_END) / (b - OUT_END));
};
/** the cream -> orange sweep of the claim (0..1) */
export const sweepAt = (f: number) => clamp01((f - T.sweep[0]) / (T.sweep[1] - T.sweep[0]));
const SWEEP_R = 8.6; // world px: past the claim's deepest point from its cut line
const SWEEP_FEATHER = 3.2; // world px: the soft edge of the front
const SWEEP_STEPS = 7;

// -- the label -------------------------------------------------------------------
export const LABEL = { size: 40, spacing: 0.26, anchor: "middle" as const, dx: -12, dy: -112 }; // above the fortress (screen px from Tenochtitlan)

/** the state cut B opens on (asserted there) */
export const A_END = {
  f: LAST,
  g: G("A", LAST),
  cam: camAt(LAST),
  camVel: (() => {
    const a = camAt(LAST - 0.5);
    const b = camAt(LAST + 0.5);
    return { lnk: Math.log(b.k) - Math.log(a.k), cx: b.cx - a.cx, cy: b.cy - a.cy };
  })(),
  penS: penSAt(LAST),
  sweep: sweepAt(LAST),
  fortress: fortressAt(LAST),
  labelF0: T.label,
};
if (A_END.penS !== PEN_LEN || A_END.sweep !== 1 || A_END.fortress !== 1) throw new Error("cut A must end with the pen, sweep and fortress complete");

const CarvedOutOfTheAztecs: React.FC<Props> = ({ vignette, label }) => {
  const frame = useCurrentFrame();
  const cam = camShown(frame);
  const k = cam.k;

  const s = penSAt(frame);
  const sw = sweepAt(frame);
  const fp = fortressAt(frame);

  // the nib: on the pen head while the arc and the tie draw, on the fortress outline after
  const nibIn = smoothstep((frame - T.nibIn[0]) / (T.nibIn[1] - T.nibIn[0]));
  const nibOut = 1 - smoothstep((frame - T.nibOut[0]) / (T.nibOut[1] - T.nibOut[0]));
  let nib: P2 = PEN.pointAt(s);
  const fortSize = fortressSize(k);
  if (frame > T.fortress[0]) {
    const q = fortressNib(fp);
    const u = fortSize / 100 / k;
    nib = q ? [TENOCH[0] + q[0] * u, TENOCH[1] + q[1] * u] : [TENOCH[0] + 45 * u, TENOCH[1]]; // the outline ends at the east tower's foot
  }

  // the sweep: graded strokes along the cut line grow inward over the claim
  const sweeping = sw > 0 && sw < 1;
  const r = (SWEEP_R + SWEEP_FEATHER) * smootherstep(sw);
  const arcD = PEN.partialD(0, PEN_ARC_LEN);
  const sweepStrokes = (color: string) =>
    Array.from({ length: SWEEP_STEPS }, (_, i) => {
      const rr = r - (SWEEP_FEATHER * i) / (SWEEP_STEPS - 1);
      return rr > 0.01 ? (
        <path key={`sw-${i}`} d={arcD} fill="none" stroke={color} strokeOpacity={1 / (SWEEP_STEPS - i)} strokeWidth={2 * rr} strokeLinecap="round" strokeLinejoin="round" />
      ) : null;
    });
  const MASK = { x: 80, y: 880, w: 45, h: 30 };

  return (
    <AbsoluteFill style={{ backgroundColor: SEA }}>
      <MapStack cam={cam} />
      <WorldSvg cam={cam}>
        {sweeping ? (
          <defs>
            <mask id="aSweepIn" maskUnits="userSpaceOnUse" x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h}>
              <rect x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h} fill="#000" />
              {sweepStrokes("#fff")}
            </mask>
            <mask id="aSweepOut" maskUnits="userSpaceOnUse" x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h}>
              <rect x={MASK.x} y={MASK.y} width={MASK.w} height={MASK.h} fill="#fff" />
              {sweepStrokes("#000")}
            </mask>
          </defs>
        ) : null}
        {/* the cream empire, Tlaxcala in orange, the borders */}
        <EmpireLayer cam={cam} solidity={0} />
        {/* the claim's ground: cream until the sweep turns it */}
        {sw < 1 ? (
          <g mask={sweeping ? "url(#aSweepOut)" : undefined}>
            <EmpireHatch d={CLAIM_D} cam={cam} solidity={0} />
          </g>
        ) : null}
        {/* the claim, the pen's line, the tie, the fortress */}
        <TlaxcalaClaims cam={cam} penS={s} sweep={sw} sweepMask={sweeping ? "aSweepIn" : undefined} fortress={fp} />
        {/* the nib */}
        <PenNib x={nib[0]} y={nib[1]} cam={cam} opacity={nibIn * nibOut} />
      </WorldSvg>
      <MapLabel
        text={label}
        x={TENOCH[0]}
        y={TENOCH[1]}
        cam={cam}
        frame={frame}
        f0={T.label}
        size={LABEL.size}
        spacing={LABEL.spacing}
        anchor={LABEL.anchor}
        dx={LABEL.dx}
        dy={LABEL.dy}
        opacity={INK_FULL}
      />
      <PaperTop vignette={vignette} />
    </AbsoluteFill>
  );
};

export default CarvedOutOfTheAztecs;
