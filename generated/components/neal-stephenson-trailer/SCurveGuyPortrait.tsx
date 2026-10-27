// ---------------------------------------------------------------------------
// SCurveGuyPortrait (neal-stephenson-trailer, cut 18, the 9:16 version). Core memory podcast style
// (styles/core-memory.md), the clip's look (nealShared.tsx + nealPortraitShared.tsx). Opaque 1080x1920, 23.976 fps,
// 99 frames. A recomposition of the approved 16:9 rev 3 (SCurveGuy.tsx, untouched): same idea, beats, weights, crown.
//
// CHECK LINE: "The tech crowd sees a curve that goes straight up forever; Neal sees the same curve bend over and
// level off — and you can see exactly where the two part ways."
//
// THE LINE (host, then Neal): "…think we are living in the singularity / NEAL: I mean, I'm more of an S-curve guy."
// WORD -> FRAME: think 5 · we 11 · are 15 · living 20 · in 29 · the 35 · singularity 40 (to ~58) · ("right" cut) ·
//   I mean 60 · I'm 63 · more 67 · of 70 · an 73 · S 76 · curve 81 · guy 90 (ends ~98) · cut 99.
// DURATION: the slot 18.3517 -> 22.4808 s = 4.129 s x 23.976 = 99 frames (sequence f440 -> f539; f0..f98).
//
// THE MOTION: one tall graph on the squared paper (narrower and much taller than the 16:9: x 120-980, baseline y 1070,
// plateau y 370), white ink on its hard shadow. The camera opens CLOSE (k 1.8) on the pen point of the exponential's
// flat first stretch near the bottom-left, already moving, and pulls back continuously to the whole graph by ~f40
// ("singularity"), where the tip reaches the parting point and climbs the tall frame, off the top by ~f55. From f61 a
// second line peels off at the parting point (its inflection) and bends over into a plateau running right, landing
// f85, the exponential dropping to OP_MID; the S-curve's chain copies trail its tip and settle into a crown by f90
// ("guy"). f90-98: a slow creep, film life. The crown tapers from 0 at the parting point to full on the plateau, so no
// colour ever sits on the shared stretch or on the exponential.
// CHAIN = NEAL'S OWN (his take: the S-curve).
// BANDS (1920 tall): 1080-1250, 1360-1460. Only the bare x-axis may enter the first band (asserted every frame).
//
// SOURCES: none (an unlabelled shape, the speaker's own image; no figures).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CHAIN,
  GRAPH_CROWN_STEP,
  GRAPH_SHADOW_OFF,
  GRAPH_STROKE,
  INK,
  Inked,
  OP_MID,
  SHADOW,
  SHADOW_OFF,
  STROKE,
  clamp,
  runCamera2,
} from "./nealShared";
import { CaptionBands9x16, NealFilmLife9x16, NealTallPaper, NealTallPlane, type TallCam } from "./nealPortraitShared";

export const FPS = 24000 / 1001;
export const DURATION = 99;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the graph (world px; at the end camera, k 1, world px = screen px) ------------------------------------------------
// Same construction as the 16:9: E(x) = c + a (e^((x - x0)/s) - 1) passes the parting height hp at xp; the S-curve is
// E up to xp, then hp + (plateau - hp)(1 - e^(-(x - xp)/L)), L = (plateau - hp) / E'(xp): slope-continuous, xp is its
// inflection. Taller and narrower for 9:16: s 95 (16:9: 135), plateau 700 above the baseline (16:9: 378).
const X0 = 120;
const X1 = 980;
const BASE = 1070;
const C0 = 40;
const S_E = 95;
const XP = 500;
const PLATEAU = 700;
const HP = C0 + (PLATEAU - C0) / 2;
const A_E = (HP - C0) / (Math.exp((XP - X0) / S_E) - 1);
const SLOPE_P = (A_E / S_E) * Math.exp((XP - X0) / S_E);
const L_S = (PLATEAU - HP) / SLOPE_P;
const E_TOP = -520; // world y where the exponential's drawing ends (far above the frame)

export const GRAPH_9x16 = {
  x0: X0,
  x1: X1,
  baseY: BASE,
  axisTopY: 300,
  startH: C0,
  partX: XP,
  partY: BASE - HP,
  plateauY: BASE - PLATEAU,
  expScale: S_E,
  expA: A_E,
  sDecay: L_S,
  expTopY: E_TOP,
} as const;

const eH = (x: number) => C0 + A_E * (Math.exp((x - X0) / S_E) - 1);
const sH = (x: number) => (x <= XP ? eH(x) : HP + (PLATEAU - HP) * (1 - Math.exp(-(x - XP) / L_S)));
const crownW = (x: number) => (x <= XP ? 0 : 1 - Math.exp(-(x - XP) / L_S));

type Poly = { x: number[]; y: number[]; s: number[] };
const sample = (fx: (x: number) => number, xa: number, xb: number, stopY = -Infinity): Poly => {
  const P: Poly = { x: [xa], y: [fx(xa)], s: [0] };
  let px = xa;
  let py = fx(xa);
  let acc = 0;
  for (let x = xa + 0.05; x <= xb + 1e-9; x += 0.05) {
    const y = fx(x);
    acc += Math.hypot(x - px, y - py);
    px = x;
    py = y;
    if (acc >= 2.5 || y <= stopY || x + 0.05 > xb) {
      P.x.push(x);
      P.y.push(y);
      P.s.push(P.s[P.s.length - 1] + acc);
      acc = 0;
      if (y <= stopY) break;
    }
  }
  return P;
};
// the curve starts just clear of the y-axis (its round cap touches the axis, never pokes through it)
const SHARED = sample((x) => BASE - eH(x), X0 + 9, XP);
const E_ONLY = sample((x) => BASE - eH(x), XP, 2000, E_TOP);
const S_ONLY = sample((x) => BASE - sH(x), XP, X1);
const SHARED_LEN = SHARED.s[SHARED.s.length - 1];
const E_LEN = E_ONLY.s[E_ONLY.s.length - 1];
const S_LEN = S_ONLY.s[S_ONLY.s.length - 1];

const pathTo = (p: Poly, len: number, lift: (x: number) => number = () => 0) => {
  if (len <= 0) return "";
  const parts: string[] = [];
  for (let i = 0; i < p.s.length; i++) {
    if (p.s[i] > len) {
      const t = (len - p.s[i - 1]) / (p.s[i] - p.s[i - 1]);
      const x = p.x[i - 1] + t * (p.x[i] - p.x[i - 1]);
      const y = p.y[i - 1] + t * (p.y[i] - p.y[i - 1]);
      parts.push(`L${x.toFixed(2)} ${(y - lift(x)).toFixed(2)}`);
      break;
    }
    parts.push(`${i === 0 ? "M" : "L"}${p.x[i].toFixed(2)} ${(p.y[i] - lift(p.x[i])).toFixed(2)}`);
  }
  if (parts.length === 1) parts.push(`L${p.x[0].toFixed(2)} ${(p.y[0] - lift(p.x[0])).toFixed(2)}`);
  return parts.join(" ");
};

// -- timing (the 16:9's beats) -----------------------------------------------------------------------------------------
/** The exponential's tip, arc length from the y-axis: ~100 px along at f0, accelerating like the curve itself; at the
 *  parting point on "singularity" (f40), up the tall frame and off its top by ~f55. */
const eArc = (f: number) => Math.min(SHARED_LEN + E_LEN, 100 + 5 * f + 9.26 * (Math.exp(f / 12) - 1));
const S_F0 = 61;
const S_F1 = 85;
const S_EASE = Easing.bezier(0.45, 0.05, 0.25, 1);
const sProg = (f: number) => interpolate(f, [S_F0, S_F1], [0, 1], { easing: S_EASE, ...clamp });
const CHAIN_LAG = [5, 10 / 3, 5 / 3] as const; // orange, purple, blue: orange lands f90 ("guy")
const CHAIN_N = [3, 2, 1] as const;

type GraphState = { eArc: number; sProg: number; chain: [number, number, number]; eOpacity: number };
const graphState = (f: number): GraphState => {
  const sp = sProg(f);
  return {
    eArc: eArc(f),
    sProg: sp,
    chain: [sProg(f - CHAIN_LAG[0]), sProg(f - CHAIN_LAG[1]), sProg(f - CHAIN_LAG[2])],
    eOpacity: interpolate(sp, [0, 0.35], [1, OP_MID], { easing: Easing.inOut(Easing.cubic), ...clamp }),
  };
};

const lineProps = (stroke: string, width: number = GRAPH_STROKE) => ({
  fill: "none",
  stroke,
  strokeWidth: width,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
});

const Graph: React.FC<GraphState> = ({ eArc: ea, sProg: sp, chain, eOpacity }) => {
  const shared = pathTo(SHARED, Math.min(ea, SHARED_LEN));
  const eOnly = ea > SHARED_LEN ? pathTo(E_ONLY, ea - SHARED_LEN) : "";
  const sOnly = sp > 0 ? pathTo(S_ONLY, sp * S_LEN) : "";
  const sh = (d: string) =>
    d ? <path d={d} transform={`translate(${GRAPH_SHADOW_OFF} ${GRAPH_SHADOW_OFF})`} {...lineProps(SHADOW)} /> : null;
  return (
    <g>
      <Inked
        render={(c) => (
          <path
            d={`M${X0} ${GRAPH_9x16.axisTopY} L${X0} ${BASE} L${X1} ${BASE}`}
            {...lineProps(c, STROKE)}
            strokeLinecap="square"
            strokeLinejoin="miter"
          />
        )}
      />
      {/* paint order as the 16:9: the S-curve's shadow, its chain copies, the exponential's own stretch over both,
          then the S-curve's white in front of everything */}
      {sh(shared)}
      {sh(sOnly)}
      {CHAIN.map((col, i) =>
        chain[i] > 0 ? (
          <path key={col} d={pathTo(S_ONLY, chain[i] * S_LEN, (x) => CHAIN_N[i] * GRAPH_CROWN_STEP * crownW(x))} {...lineProps(col)} />
        ) : null,
      )}
      {eOnly ? (
        <g opacity={eOpacity < 1 ? eOpacity : undefined}>
          {sh(eOnly)}
          <path d={eOnly} {...lineProps(INK)} />
        </g>
      ) : null}
      {shared ? <path d={shared} {...lineProps(INK)} /> : null}
      {sOnly ? <path d={sOnly} {...lineProps(INK)} /> : null}
    </g>
  );
};

// -- the camera --------------------------------------------------------------------------------------------------------
// Linear keys through the damped follow (runCamera2), one continuous camera: CLOSE on the pen point (k 1.8, the flat
// stub low in frame, the bare axis just inside the first band), a continuous pull-back and slide to the whole graph
// by ~f40, a touch wider while the exponential climbs off the top, then a slow creep in to the end framing (k ~1).
// k 1.8 keeps the paper under 1.0x of its source.
const keyed = (keys: [number, number][]) => (f: number) =>
  interpolate(
    f,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    clamp,
  );
const camX = keyed([
  [0, 330],
  [8, 350],
  [38, 540],
  [98, 545],
]);
const camY = keyed([
  [0, 990],
  [38, 966],
  [98, 960],
]);
const camK = keyed([
  [0, 1.8],
  [6, 1.78],
  [38, 1.0],
  [56, 0.97],
  [70, 0.97],
  [98, 1.0],
]);
const CAM_F: number[] = [];
const CAM_CX: number[] = [];
const CAM_CY: number[] = [];
const CAM_K: number[] = [];
for (let f = 0; f <= DURATION; f++) {
  CAM_F.push(f);
  CAM_CX.push(camX(f));
  CAM_CY.push(camY(f));
  CAM_K.push(camK(f));
}
const camAt = (f: number): TallCam => {
  const { cx, cy, k } = runCamera2(f, CAM_F, CAM_CY, CAM_CX, CAM_K);
  return { x: cx, y: cy, k, x0: CAM_CX[0], y0: CAM_CY[0] };
};
export const SCURVE_9x16_END_CAM: TallCam = camAt(DURATION - 1);

// Caption bands along the whole camera path: only the bare baseline may enter the first band (never past it); the
// curve's flat tail (and everything above it) stays above y 1080, the parting point above 1060, the crown in frame.
for (let f = 0; f < DURATION; f++) {
  const c = camAt(f);
  const sy = (y: number) => 960 + (y - c.y) * c.k;
  const yBase = sy(BASE + SHADOW_OFF + STROKE / 2);
  if (yBase >= 1250) throw new Error(`SCurveGuyPortrait: baseline reaches screen y ${yBase.toFixed(1)} at f${f}`);
  const yTail = sy(BASE - C0 + GRAPH_SHADOW_OFF + GRAPH_STROKE / 2);
  if (yTail >= 1080) throw new Error(`SCurveGuyPortrait: flat tail reaches screen y ${yTail.toFixed(1)} at f${f}`);
  const yPart = sy(BASE - HP + GRAPH_SHADOW_OFF + GRAPH_STROKE / 2);
  if (yPart >= 1060) throw new Error(`SCurveGuyPortrait: parting point at screen y ${yPart.toFixed(1)} at f${f}`);
  const yCrown = sy(BASE - PLATEAU - GRAPH_STROKE / 2 - 3 * GRAPH_CROWN_STEP);
  if (f >= 60 && yCrown < 60) throw new Error(`SCurveGuyPortrait: crown top at screen y ${yCrown.toFixed(1)} at f${f}`);
}

const SCurveGuyPortrait: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <AbsoluteFill>
      <NealFilmLife9x16 frame={frame}>
        <NealTallPaper frame={frame} cam={cam} />
        <NealTallPlane cam={cam}>
          <Graph {...graphState(frame)} />
        </NealTallPlane>
      </NealFilmLife9x16>
      <CaptionBands9x16 on={bands} />
    </AbsoluteFill>
  );
};

export default SCurveGuyPortrait;
