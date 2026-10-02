import React from "react";
import {
  COVID_PT,
  FALL_X,
  HEAD_R,
  INK,
  INK_HI,
  INK_LO,
  INK_W,
  JOIN_34,
  Y0,
  cameraTrack,
  camEq,
  clamp01,
  enterU,
  evenEase,
  exitU,
  rungEase,
  smoothstep,
  sz,
  yOf,
} from "./chinaGrowthGeom";
import type { Cam, Glide, Pt } from "./chinaGrowthGeom";
import { CAM_A_START, DashedPath, Dot, GLIDES_A, JOIN_23, Label, Ring, Tick, labelCapH } from "./chinaGrowthShared";
import type { DashMod } from "./chinaGrowthShared";
import { arriveEase } from "./levelUp";

// ---------------------------------------------------------------------------
// chinaGrowthSeg3 — builder B's layer and camera for cut 3, CovidExcuse,
// S 601-829: "And we had this excuse, sort of, of COVID, that things were going
// to come back. And it's the fall of 2026, and they haven't."
// The gesture list (word -> S frames) is in CovidExcuse.tsx's header.
// Everything is a function of the story clock S. The layer draws nothing for
// S <= 601 (cuts 1-2), and from S 827 on only the FALL 2026 tick + label, which
// stay on the axis to the end of the clip (INK_HI -> INK_LO at S 840-852).
// ---------------------------------------------------------------------------

// --- the schedule (S frames) ---------------------------------------------------
/** Ring arc sweep round COVID_PT (arriveEase): the camera has landed. */
export const RING_S0 = 666;
export const RING_F = 12;
const RING_TAIL = 0.15;
/** The drop-line leaves the ring's bottom when the sweep passes 6 o'clock. */
export const DROP_S0 = RING_S0 + RING_F * (0.5 / (1 + 2 * RING_TAIL));
export const DROP_F = 21;
export const DROP_S1 = DROP_S0 + DROP_F;
/** "COVID" (S 676.9-689.4) lands on its word. */
export const COVID_LAND = 686;
/** Once the promise has "come back" (7.9 % at PROM_S1) the excuse is context: the
 *  ring, drop-line, tick and label ease INK_HI -> INK_LO over 12 f. */
export const COVID_RECEDE = 718;
/** The promise: born at the ring, 7.9 % at "back" (714.8), FALL_X on "fall" (748.9). */
export const PROM_S0 = 692;
export const PROM_S1 = 716;
export const PROM_S2 = 752;
/** FALL 2026: the tick drops as the head arrives; the label lands on "2026" (760.9). */
export const FALL_TICK_F = 6;
export const FALL_LAND = 761;
export const FALL_RECEDE = 840;
/** "they" (794.5): the dissolve wave runs from the head back to the ring (14 f, so it
 *  reaches the ring while the dive still has it in frame). */
export const DIS_S0 = 794;
export const DIS_F = 14;
export const DASH_FADE_F = 8;
export const DIS_SINK = 10;
/** The excuse goes with it as the wave reaches the ring: ring, drop-line (top to
 *  bottom), COVID tick, COVID label (standard exit) — all gone by S 820. */
export const RING_OUT = 806;
export const DROP_OUT0 = 807;
export const DROP_OUT_F = 4;
export const CTICK_OUT = 808;
export const CLABEL_OUT = 805;
const EXCUSE_FADE_F = 8;
const EXCUSE_END = DROP_OUT0 + DROP_OUT_F + EXCUSE_FADE_F + 1;

// --- geometry (world px) -----------------------------------------------------
/** The marker ring round COVID_PT (base radius at K_REF; clears DOT_R 11.5). */
export const RING_R = 26;
/** The axis -> label caps gap, as A's Q2/Q3 and "0%" use. */
const AXIS_LABEL_GAP = 23;
const FALL_DROP = 26; // the tick's fall onto the axis, world px at K_REF
export const PROMISE_Y = yOf(7.9); // "back to where growth used to ride": the SHOULDER level
export const RISE_END: Pt = { x: 1080, y: PROMISE_Y };
export const PROMISE_END: Pt = { x: FALL_X, y: PROMISE_Y };
const RISE_DEG = 60; // the promise leaves the ring heading up-right
const RISE_ARM0 = 95;
const RISE_ARM1 = 70;

const bez = (p0: Pt, p1: Pt, p2: Pt, p3: Pt, t: number): Pt => {
  const u = 1 - t;
  return {
    x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
    y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y,
  };
};

/** The promise: out of the ring up to 7.9 % by x 1080, flat to FALL_X. Starts
 *  on the ring (distance RING_R from COVID_PT). */
export const PROMISE: { pts: Pt[]; cum: number[]; len: number; riseLen: number } = (() => {
  const a = (RISE_DEG * Math.PI) / 180;
  const p0: Pt = { x: COVID_PT.x, y: COVID_PT.y };
  const p1: Pt = { x: p0.x + RISE_ARM0 * Math.cos(a), y: p0.y - RISE_ARM0 * Math.sin(a) };
  const p2: Pt = { x: RISE_END.x - RISE_ARM1, y: RISE_END.y };
  const raw: Pt[] = [];
  for (let i = 0; i <= 600; i++) raw.push(bez(p0, p1, p2, RISE_END, i / 600));
  const nRise = raw.length - 1;
  for (let x = RISE_END.x + 2; x < PROMISE_END.x; x += 2) raw.push({ x, y: PROMISE_Y });
  raw.push({ ...PROMISE_END });
  // trim at the ring
  let j = 0;
  while (Math.hypot(raw[j + 1].x - p0.x, raw[j + 1].y - p0.y) < RING_R) j++;
  const d0 = Math.hypot(raw[j].x - p0.x, raw[j].y - p0.y);
  const d1 = Math.hypot(raw[j + 1].x - p0.x, raw[j + 1].y - p0.y);
  const u = (RING_R - d0) / (d1 - d0);
  const start: Pt = { x: raw[j].x + (raw[j + 1].x - raw[j].x) * u, y: raw[j].y + (raw[j + 1].y - raw[j].y) * u };
  const pts: Pt[] = [start, ...raw.slice(j + 1)];
  const cum: number[] = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const riseLen = cum[nRise - j];
  return { pts, cum, len: cum[cum.length - 1], riseLen };
})();

const promisePoint = (s: number): Pt => {
  const { pts, cum, len } = PROMISE;
  const t = Math.max(0, Math.min(len, s));
  let lo = 0;
  let hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= t) lo = mid;
    else hi = mid;
  }
  const seg = cum[hi] - cum[lo];
  const u = seg > 0 ? (t - cum[lo]) / seg : 0;
  return { x: pts[lo].x + (pts[hi].x - pts[lo].x) * u, y: pts[lo].y + (pts[hi].y - pts[lo].y) * u };
};

/** The promise head's arc length at S: one C1 Hermite through (S, s, speed):
 *  out of the ring from rest, 7.9 % at PROM_S1, decelerating onto FALL_X. */
const V_MID = 13;
const HEAD_KNOTS = [
  { S: PROM_S0, s: 0, v: 0 },
  { S: PROM_S1, s: PROMISE.riseLen, v: V_MID },
  { S: PROM_S2, s: PROMISE.len, v: 0 },
];
export const promiseHeadLen = (S: number): number => {
  if (S <= HEAD_KNOTS[0].S) return 0;
  if (S >= HEAD_KNOTS[2].S) return PROMISE.len;
  const i = S <= HEAD_KNOTS[1].S ? 0 : 1;
  const a = HEAD_KNOTS[i];
  const b = HEAD_KNOTS[i + 1];
  const h = b.S - a.S;
  const t = (S - a.S) / h;
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a.s + (t3 - 2 * t2 + t) * h * a.v + (-2 * t3 + 3 * t2) * b.s + (t3 - t2) * h * b.v;
};
export const promiseHead = (S: number): Pt => promisePoint(promiseHeadLen(S));

/** The drop-line: from the ring's bottom straight down to the axis. */
export const DROP_PTS: Pt[] = [
  { x: COVID_PT.x, y: COVID_PT.y + RING_R },
  { x: COVID_PT.x, y: Y0 },
];
export const dropDraw = (S: number) => evenEase(clamp01((S - DROP_S0) / DROP_F), 0.2);

// --- the camera ----------------------------------------------------------------
// ONE track with camA: A's glides, then these, through the same follower from
// S 0, so the camera is bit-identical to camA through S 601 (JOIN_23 by
// construction) and A's decaying tail carries into this cut. Waypoints are
// absolute LOOKS (content centre) + k; each becomes a delta from the previous.
export type Way = { f0: number; f1: number; x: number; y: number; k?: number; warp?: number; even?: number };
const A_END = (() => {
  let x = CAM_A_START.x;
  let y = CAM_A_START.y;
  let k = CAM_A_START.k;
  for (const g of GLIDES_A) {
    x += g.dx ?? 0;
    y += g.dy ?? 0;
    if (g.k !== undefined) k = g.k;
  }
  return { x, y, k };
})();
export const WAYS_3: Way[] = [
  // "And we had this excuse, sort of, of": back up the line to the Covid moment
  { f0: 602, f1: 664, x: 965, y: 1700, k: 1.2, warp: 0.8 },
  // the hold-drift: the same pull up and out, continuing and decaying under the ring + drop
  { f0: 648, f1: 712, x: 963, y: 1680, k: 1.165 },
  // "that things were going to come back. And it's the fall of 2026": rises and widens with
  // the promise, then follows it right to COVID .. FALL 2026; its long tail is the hold-drift
  { f0: 694, f1: 795, x: 1230, y: 1680, k: 1.03, warp: 0.8 },
  // "and they haven't": down and in to the tip and FALL 2026 (JOIN_34's look), a slow arrival
  { f0: 790, f1: 821, x: 1440, y: yOf(0.2), k: 1.3, warp: 0.9 },
];
const S_IN = 601;
const S_OUT = 829;
/** A final correction blend lands the track EXACTLY on JOIN_34 at S 829. */
const FIX_S0 = 809;
/** Builds the cut-3 camera from absolute waypoints (also used by the review probes). */
export const makeCam3 = (ways: Way[]) => {
  let prev = { x: A_END.x, y: A_END.y };
  const glides: Glide[] = ways.map((w) => {
    const g: Glide = { f0: w.f0, f1: w.f1, dx: w.x - prev.x, dy: w.y - prev.y, k: w.k, warp: w.warp, even: w.even };
    prev = { x: w.x, y: w.y };
    return g;
  });
  const raw: Cam[] = cameraTrack(CAM_A_START, [...GLIDES_A, ...glides], S_OUT);
  const rawAt = (S: number): Cam => {
    const t = Math.max(0, Math.min(raw.length - 1, S));
    const i = Math.min(raw.length - 2, Math.floor(t));
    const u = t - i;
    const a = raw[i];
    const b = raw[i + 1];
    return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, k: a.k + (b.k - a.k) * u };
  };
  const end = rawAt(S_OUT);
  const fix = { x: JOIN_34.x - end.x, y: JOIN_34.y - end.y, k: JOIN_34.k - end.k };
  const cam = (S: number): Cam => {
    if (S <= S_IN) return { ...JOIN_23 };
    if (S >= S_OUT) return { ...JOIN_34 };
    const c = rawAt(S);
    const w = smoothstep((S - FIX_S0) / (S_OUT - FIX_S0));
    return { x: c.x + fix.x * w, y: c.y + fix.y * w, k: c.k + fix.k * w };
  };
  return { cam, fix, inOk: camEq(rawAt(S_IN), JOIN_23) };
};
const CAM_3 = makeCam3(WAYS_3);
/** The camera for S 601-829 (camera centre + zoom). */
export const camSeg3 = CAM_3.cam;
/** The residual the blend absorbs (for the report). */
export const CAM3_FIX = CAM_3.fix;
if (!CAM_3.inOk) {
  throw new Error("chinaGrowthSeg3: the camera track left camA before S 601");
}
if (!camEq(camSeg3(S_OUT), JOIN_34) || !camEq(camSeg3(S_IN), JOIN_23)) {
  throw new Error("chinaGrowthSeg3: camSeg3 misses JOIN_23 / JOIN_34");
}

// --- the layer -----------------------------------------------------------------
/** FALL 2026's rung: INK_HI through cut 3, INK_LO from S 852 to the end. */
const fallRung = (S: number) => INK_HI - (INK_HI - INK_LO) * rungEase(S, FALL_RECEDE);
/** The excuse's rung: INK_HI while it is the subject, INK_LO once the promise has come back. */
const covidRung = (S: number) => INK_HI - (INK_HI - INK_LO) * rungEase(S, COVID_RECEDE);

export const Seg3Layer: React.FC<{ S: number; cam: Cam }> = ({ S, cam }) => {
  if (S <= S_IN) return null;
  const k = cam.k;
  const s = sz(k);
  const out: React.ReactNode[] = [];

  // -- the excuse: ring, drop-line, COVID tick + label (all gone by S 826) --
  if (S < EXCUSE_END) {
    const cr = covidRung(S);
    // ring: arc sweep from 12 o'clock; sinks + fades as the wave reaches it
    const ringU = clamp01((S - RING_OUT) / EXCUSE_FADE_F);
    const ringDraw = arriveEase(clamp01((S - RING_S0) / RING_F), RING_TAIL);
    if (ringDraw > 0 && ringU < 1) {
      const e = smoothstep(ringU);
      out.push(
        <g key="ring" transform={`translate(0 ${(DIS_SINK * s * e).toFixed(3)})`}>
          <Ring x={COVID_PT.x} y={COVID_PT.y} k={k} r={RING_R} draw={ringDraw} rung={cr * (1 - e)} />
        </g>,
      );
    }
    // drop-line: dashed, head-led down to the axis; dissolves top to bottom
    const dd = dropDraw(S);
    if (dd > 0) {
      const mod = (_i: number, sMid: number, total: number): DashMod => {
        const t0 = DROP_OUT0 + DROP_OUT_F * clamp01(sMid / total);
        const u = clamp01((S - t0) / EXCUSE_FADE_F);
        if (u <= 0) return null;
        const e = smoothstep(u);
        return { dy: DIS_SINK * s * e, opacity: 1 - e };
      };
      out.push(<DashedPath key="drop" points={DROP_PTS} k={k} S={S} draw={dd} rung={cr} dashMod={mod} />);
    }
    // the COVID tick: scales in where the drop-line lands; sinks + fades out
    if (S >= DROP_S1) {
      const u = clamp01((S - CTICK_OUT) / EXCUSE_FADE_F);
      const e = smoothstep(u);
      if (e < 1) {
        out.push(
          <g key="ctick" transform={`translate(0 ${(DIS_SINK * s * e).toFixed(3)})`}>
            <Tick x={COVID_PT.x} y={Y0} k={k} grow={clamp01((S - DROP_S1) / 8)} rung={cr * (1 - e)} />
          </g>,
        );
      }
    }
    // "COVID": just below the axis, lands on its word, standard exit
    out.push(
      <Label
        key="clabel"
        text="COVID"
        x={COVID_PT.x}
        y={Y0 + AXIS_LABEL_GAP * s + labelCapH("word", k) / 2}
        k={k}
        size="word"
        rung={cr}
        appear={enterU(S, COVID_LAND)}
        exit={exitU(S, CLABEL_OUT)}
      />,
    );
  }

  // -- the promise: dashed, out of the ring, up to 7.9 %, flat to FALL_X --
  if (S > PROM_S0 && S < DIS_S0 + DIS_F + DASH_FADE_F) {
    const hl = promiseHeadLen(S);
    const mod = (_i: number, sMid: number, total: number): DashMod => {
      const t0 = DIS_S0 + DIS_F * (1 - clamp01(sMid / total));
      const u = clamp01((S - t0) / DASH_FADE_F);
      if (u <= 0) return null;
      const e = smoothstep(u);
      return { dy: DIS_SINK * s * e, opacity: 1 - e };
    };
    out.push(
      <DashedPath
        key="promise"
        points={PROMISE.pts}
        k={k}
        S={S}
        draw={hl / PROMISE.len}
        rung={INK_HI}
        head={false}
        dashMod={mod}
      />,
    );
    // its white head: in over 6 f at the ring, out over 8 f once it has landed
    const ho = smoothstep((S - PROM_S0) / 6) * (1 - smoothstep((S - PROM_S2) / 8));
    if (ho > 0.002) {
      const hp = promisePoint(hl);
      out.push(<Dot key="phead" x={hp.x} y={hp.y} k={k} r={HEAD_R * INK_W} color={INK} opacity={ho} />);
    }
  }

  // -- FALL 2026: THE CLICK. The tick falls (ease-in) under the head and stops on the
  //    axis; the label lands on "2026" --
  if (S >= PROM_S2) {
    const g = clamp01((S - PROM_S2) / FALL_TICK_F);
    const rung = fallRung(S);
    out.push(
      <Tick key="ftick" x={FALL_X} y={Y0 - FALL_DROP * s * (1 - g * g)} k={k} grow={g} rung={rung} />,
      <Label
        key="flabel"
        text="FALL 2026"
        x={FALL_X}
        y={Y0 - AXIS_LABEL_GAP * s - labelCapH("word", k) / 2}
        k={k}
        size="word"
        rung={rung}
        appear={enterU(S, FALL_LAND)}
      />,
    );
  }

  return <>{out}</>;
};
