// ---------------------------------------------------------------------------
// SCurveGuy (neal-stephenson-trailer, cut 18). Core memory podcast style (styles/core-memory.md), the clip's
// archive-collage look (nealShared.tsx). Opaque 1920x1080, 23.976 fps, 99 frames.
//
// CHECK LINE: "The tech crowd sees a curve that goes straight up forever; Neal sees the same curve bend over and
// level off — and you can see exactly where the two part ways."
//
// THE LINE (host, then Neal): "…think we are living in the singularity / NEAL: I mean, I'm more of an S-curve guy."
// WORD -> FRAME: think 5 · we 11 · are 15 · living 20 · in 29 · the 35 · singularity 40 (to ~58) · ("right" cut) ·
//   I mean 60 · I'm 63 · more 67 · of 70 · an 73 · S 76 · curve 81 · guy 90 (ends ~98) · cut 99.
// DURATION: the slot 18.3517 -> 22.4808 s = 4.129 s x 23.976 = 99 frames (sequence f440 -> f539; f0..f98).
//
// THE MOTION: one graph on the squared paper, white ink on its hard shadow, a y-axis and a baseline, no numbers.
// From f0 the exponential is already drawing along its flat first stretch; it steepens through "living in the" and on
// "singularity" (f40) rockets up and off the top (gone by ~f54) while the camera tilts up a little and settles back.
// From f61 (just after "I mean") a second line peels off the exponential at the parting point (its inflection, GRAPH.xp) and
// bends over into a plateau running right to the end of the baseline, landing f85; the exponential drops to OP_MID
// as the S-curve peels, still clearly there. The S-curve wears the chain: its copies trail the peeling tip (2/4/6
// frames behind) and settle into a touching crown on the plateau by f90 ("guy"). f90-98: a slow creep, film life.
// The crown offset tapers from 0 at the parting point to full on the plateau, so no colour ever sits on the
// shared stretch or on the exponential.
// CHAIN = NEAL'S OWN (his take: the S-curve).
//
// JOIN: cut 22 (A2) opens on this cut's last frame (f98). It imports SCURVE_END_CAM, SCURVE_END_STATE, GRAPH and
// `SCurveGraph` from here, and passes frame + SCURVE_JOIN_FRAME to NealPaper and NealFilmLife.
//
// SOURCES: none (an unlabelled shape, the speaker's own image; no figures).
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  CHAIN,
  CaptionBands,
  INK,
  Inked,
  type NealCam,
  NealFilmLife,
  NealPaper,
  NealPlane,
  NealSvg,
  OP_MID,
  SHADOW,
  GRAPH_CROWN_STEP,
  GRAPH_SHADOW_OFF,
  GRAPH_STROKE,
  SHADOW_OFF,
  STROKE,
  clamp,
  runCamera2,
} from "./nealShared";

export const FPS = 24000 / 1001;
export const DURATION = 99;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

// -- the graph (world px; at the rest camera world px ~ screen px) ---------------------------------------------------
// Heights are measured UP from the baseline. The exponential E(x) = c + a (e^((x - x0)/s) - 1) starts c above the
// baseline (so it never lies on the axis) and passes the parting height hp at x = xp. The S-curve is E up to xp and
// then bends over: S(x) = hp + (plateau - hp)(1 - e^(-(x - xp)/L)), L = (plateau - hp) / E'(xp), so slope matches
// at the parting (no kink) and xp is its inflection.
const X0 = 220;
const X1 = 1720;
const BASE = 568;
const C0 = 38;
const S_E = 135;
const XP = 900;
const PLATEAU = 378;
const HP = C0 + (PLATEAU - C0) / 2;
const A_E = (HP - C0) / (Math.exp((XP - X0) / S_E) - 1);
const SLOPE_P = (A_E / S_E) * Math.exp((XP - X0) / S_E);
const L_S = (PLATEAU - HP) / SLOPE_P;
const E_TOP = -420; // world y where the exponential's drawing ends (far above the frame)

export const GRAPH = {
  x0: X0,
  x1: X1,
  baseY: BASE,
  axisTopY: 110,
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
/** The crown's taper along the S-curve: 0 at the parting point, 1 on the plateau. */
const crownW = (x: number) => (x <= XP ? 0 : 1 - Math.exp(-(x - XP) / L_S));

type Poly = { x: number[]; y: number[]; s: number[] };
/** A polyline sampled finely in x, kept at ~2.5 px arc spacing, with cumulative arc length. */
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

/** The path of `p` from its start to arc length `len`, each point lifted `lift(x)` world px. */
const pathTo = (p: Poly, len: number, lift: (x: number) => number = () => 0) => {
  if (len <= 0) return "";
  const parts: string[] = [];
  const n = p.s.length;
  for (let i = 0; i < n; i++) {
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

// -- timing -----------------------------------------------------------------------------------------------------------
/** The exponential's tip: arc length from the y-axis. Already ~160 px along at f0; it accelerates like the curve
 *  itself (a steady part plus an exponential part): ~8 px/f at f0, at the parting point on "singularity" (f40),
 *  ~40 px/f up and off the top of the frame by ~f54. */
const E_ARC0 = 160;
const eArc = (f: number) => Math.min(SHARED_LEN + E_LEN, E_ARC0 + 4.5 * f + 80 * (Math.exp(f / 23) - 1));
/** The S-curve's own stretch (after the parting point): f61 -> f85, easing off the parting (so the split is seen
 *  opening), then a long ease into the plateau. */
const S_F0 = 61;
const S_F1 = 85;
const S_EASE = Easing.bezier(0.45, 0.05, 0.25, 1);
const sProg = (f: number) => interpolate(f, [S_F0, S_F1], [0, 1], { easing: S_EASE, ...clamp });
/** The chain copies trail the core: blue 1.7, purple 3.3, orange 5 frames behind (orange lands f90, "guy"). */
const CHAIN_LAG = [5, 10 / 3, 5 / 3] as const; // orange, purple, blue
const CHAIN_N = [3, 2, 1] as const; // crown steps, orange at the top
const CHAIN_STEP = GRAPH_CROWN_STEP; // touching stripes on the GRAPH_STROKE curve

export type SCurveGraphState = {
  /** exponential tip, arc length from the y-axis (world px) */
  eArc: number;
  /** S-curve's own stretch drawn, 0..1 */
  sProg: number;
  /** each chain copy's drawn fraction of the S-curve's own stretch [orange, purple, blue] */
  chain: [number, number, number];
  /** the exponential-only stretch's opacity */
  eOpacity: number;
};

export const graphState = (f: number): SCurveGraphState => {
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

/** The whole graph in world px (draw inside a NealSvg on the d = 1 plane). */
export const SCurveGraph: React.FC<SCurveGraphState> = ({ eArc: ea, sProg: sp, chain, eOpacity }) => {
  const shared = pathTo(SHARED, Math.min(ea, SHARED_LEN));
  const eOnly = ea > SHARED_LEN ? pathTo(E_ONLY, ea - SHARED_LEN) : "";
  const sOnly = sp > 0 ? pathTo(S_ONLY, sp * S_LEN) : "";
  const sh = (d: string) =>
    d ? <path d={d} transform={`translate(${GRAPH_SHADOW_OFF} ${GRAPH_SHADOW_OFF})`} {...lineProps(SHADOW)} /> : null;
  return (
    <g>
      <Inked
        render={(c) => <path d={`M${X0} ${GRAPH.axisTopY} L${X0} ${BASE} L${X1} ${BASE}`} {...lineProps(c, STROKE)} strokeLinecap="square" strokeLinejoin="miter" />}
      />
      {/* paint order: the S-curve's shadow, its chain copies, then the exponential's own stretch on top of both (so
          no colour or S-shadow ever lands on the exponential), then the S-curve's white in front of everything */}
      {sh(shared)}
      {sh(sOnly)}
      {CHAIN.map((col, i) =>
        chain[i] > 0 ? (
          <path key={col} d={pathTo(S_ONLY, chain[i] * S_LEN, (x) => CHAIN_N[i] * CHAIN_STEP * crownW(x))} {...lineProps(col)} />
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

// -- the camera ---------------------------------------------------------------------------------------------------------
// Linear keys through the damped follow (runCamera2), one continuous camera: it opens CLOSE on the pen point near the
// bottom-left (k 1.8, the tip already running in from screen x ~650 and settling near the centre), pulls back and slides right as the curve steepens, reaching the
// full-graph framing (k ~1.0) by ~f44 ("singularity") so the rocket off the top is seen in the wide; a small tilt up as
// it rockets (baseline stays above screen y 607), back down as the S-curve peels, then a slow creep in.
// k 1.8 keeps the paper under 1.0x of its source (PaperGround's limit is k 1.84).
const keyed = (keys: [number, number][]) => (f: number) =>
  interpolate(
    f,
    keys.map((k) => k[0]),
    keys.map((k) => k[1]),
    clamp,
  );
const camX = keyed([
  [0, 560],
  [10, 580],
  [38, 955],
  [84, 990],
  [98, 1000],
]);
const camY = keyed([
  [0, 541],
  [36, 541],
  [52, 518],
  [62, 518],
  [82, 540],
  [98, 540],
]);
const camK = keyed([
  [0, 1.8],
  [6, 1.78],
  [36, 1.0],
  [70, 1.0],
  [98, 1.035],
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
const camAt = (f: number): NealCam => {
  const { cx, cy, k } = runCamera2(f, CAM_F, CAM_CY, CAM_CX, CAM_K);
  return { x: cx, y: cy, k, x0: CAM_CX[0], y0: CAM_CY[0] };
};

/** The frame cut 22 opens on, and its exact state: pass `frame + SCURVE_JOIN_FRAME` to NealPaper / NealFilmLife. */
export const SCURVE_JOIN_FRAME = DURATION - 1;
export const SCURVE_END_CAM: NealCam = camAt(SCURVE_JOIN_FRAME);
export const SCURVE_END_STATE: SCurveGraphState = graphState(SCURVE_JOIN_FRAME);

// the baseline must stay clear of the first caption band along the whole camera path
for (let f = 0; f < DURATION; f++) {
  const c = camAt(f);
  const yBase = 540 + (BASE + SHADOW_OFF + STROKE / 2 - c.y) * c.k;
  if (yBase >= 607) throw new Error(`SCurveGuy: baseline reaches screen y ${yBase.toFixed(1)} at f${f}`);
}

const SCurveGuy: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  return (
    <AbsoluteFill>
      <NealFilmLife frame={frame}>
        <NealPaper frame={frame} cam={cam} />
        <NealPlane cam={cam}>
          <NealSvg>
            <SCurveGraph {...graphState(frame)} />
          </NealSvg>
        </NealPlane>
      </NealFilmLife>
      <CaptionBands on={bands} />
    </AbsoluteFill>
  );
};

export default SCurveGuy;
