// ---------------------------------------------------------------------------
// computeCurve: the shared world of the sam-self-replicating clip's curve (cuts A OutOfHand, B AlwaysMoreCompute).
// An unlabelled proxy shape (no data, no axis numbers, no years): the demand for compute, stumbling on its way up.
//
// WORLD. World px; at k = 1 the card is 1000 px wide. The card is a cream sheet lying on the stout board, with one
// ink base rule and an amber line that starts on the rule, climbs up-right through three stumbles and leaves the
// card through its top edge.
//
// EXPORTS
//   CARD                       the card's rect, its base rule
//   CURVE_POINTS               the control polyline { x, y, r } (r = the corner's fillet)
//   CURVE_LEN                  arc length, world px
//   KINK                       arc lengths of the named events (k1Foot, k1Top, k1Low, ... launch, topEdge, end)
//   curveAt(s)                 world point { x, y } at s = 0..1 of the arc length (s > 1 stays on the last point)
//   cardMap(rock)              world -> world under the card's rock (identity at rock 0)
//   ChartCard({ k, rock })     the card with its one shadow, its lit top edge and its base rule
//   AmberCurve({ s, k, band, rock, tip })   the line drawn from 0 to s, its shadow, bloom, hot filament and hot tip
//   GROUND_Y, GroundFloor({ k })   the ground the card-less cuts stand on, its gradient and lit top edge
//   LineStroke({ d, e, k, band })  the wide cuts' line on any path (d to its tip e); holds LINE_HOLD_PX on screen when wide
// Draw ChartCard first, then AmberCurve. Everything is at full precision.
// ---------------------------------------------------------------------------
import React, { useId } from "react";
import { ALPHA, AmberGradient, COLOR, EDGE, bloomFilter, clamp01, lerp, mixHex, smoothstep } from "../kits/cheeky-pint/stoutShared";
import { UnionShadow } from "../kits/cheeky-pint/museShared";

export const CARD = {
  x: 40,
  y: 1000, // the top edge
  w: 1000,
  h: 1190,
  r: 18,
  ruleY: 1975,
  ruleX0: 92,
  ruleX1: 988,
  ruleW: 5,
} as const;
const CARD_BOTTOM = CARD.y + CARD.h;

/** The line's weight in world px at camera k: heavy on a phone at every zoom (43 px on screen at k 2.4, 28 at k 1). */
export const curveWeight = (k: number) => 28 / Math.sqrt(k);

export type CurvePoint = { x: number; y: number; r: number };
/** The control polyline: rule -> stumble 1 -> stumble 2 -> crouch -> launch through the top edge -> the board. */
export const CURVE_POINTS: readonly CurvePoint[] = [
  { x: 110, y: 1975, r: 0 }, // 0 on the rule
  { x: 175, y: 1880, r: 40 },
  { x: 235, y: 1770, r: 40 },
  { x: 295, y: 1695, r: 34 },
  { x: 332, y: 1668, r: 12 }, // 4 stumble 1: foot of the jump
  { x: 364, y: 1498, r: 11 }, // 5 top of the jump
  { x: 414, y: 1562, r: 11 }, // 6 the slump's low
  { x: 462, y: 1472, r: 30 },
  { x: 494, y: 1440, r: 12 }, // 8 stumble 2: foot of the jump
  { x: 524, y: 1316, r: 11 }, // 9 top of the jump
  { x: 568, y: 1372, r: 11 }, // 10 the slump's low
  { x: 604, y: 1304, r: 11 }, // 11 top of the small step
  { x: 634, y: 1332, r: 14 }, // 12 the crouch: stumble 3, where the overshoot leaves from
  { x: 668, y: 1120, r: 60 }, // 13 the launch
  { x: 694, y: 1000, r: 90 }, // 14 the top edge
  { x: 716, y: 760, r: 120 },
  { x: 730, y: 560, r: 120 },
  { x: 738, y: 400, r: 0 }, // 17 the end of the line, on the bare board
];

// --- the arc: dense samples of the filleted polyline, uniform in arc length ---------------------------------------
type P = { x: number; y: number };
const raw: P[] = [];
const vertexAt: number[] = []; // index into raw of each control point's corner apex
(() => {
  const n = CURVE_POINTS.length;
  raw.push({ x: CURVE_POINTS[0].x, y: CURVE_POINTS[0].y });
  vertexAt.push(0);
  for (let i = 1; i < n; i++) {
    const a = CURVE_POINTS[i - 1];
    const b = CURVE_POINTS[i];
    const lenAB = Math.hypot(b.x - a.x, b.y - a.y);
    const ux = (b.x - a.x) / lenAB;
    const uy = (b.y - a.y) / lenAB;
    const rIn = i < n - 1 ? Math.min(b.r, lenAB / 2) : 0;
    raw.push({ x: b.x - ux * rIn, y: b.y - uy * rIn });
    if (i < n - 1) {
      const c = CURVE_POINTS[i + 1];
      const lenBC = Math.hypot(c.x - b.x, c.y - b.y);
      const vx = (c.x - b.x) / lenBC;
      const vy = (c.y - b.y) / lenBC;
      const rOut = Math.min(b.r, lenBC / 2);
      const p0 = { x: b.x - ux * rIn, y: b.y - uy * rIn };
      const p2 = { x: b.x + vx * rOut, y: b.y + vy * rOut };
      const STEPS = 10;
      for (let j = 1; j <= STEPS; j++) {
        const t = j / STEPS;
        const m = 1 - t;
        raw.push({ x: m * m * p0.x + 2 * m * t * b.x + t * t * p2.x, y: m * m * p0.y + 2 * m * t * b.y + t * t * p2.y });
        if (j === STEPS / 2) vertexAt.push(raw.length - 1);
      }
    } else {
      vertexAt.push(raw.length - 1);
    }
  }
})();
const rawArc: number[] = [0];
for (let i = 1; i < raw.length; i++) rawArc.push(rawArc[i - 1] + Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y));

/** Arc length of the curve, world px. */
export const CURVE_LEN = rawArc[rawArc.length - 1];
const pointAtArc = (a: number): P => {
  const L = Math.max(0, Math.min(CURVE_LEN, a));
  let lo = 0;
  let hi = rawArc.length - 1;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (rawArc[m] <= L) lo = m;
    else hi = m;
  }
  const t = (L - rawArc[lo]) / Math.max(1e-9, rawArc[hi] - rawArc[lo]);
  return { x: lerp(raw[lo].x, raw[hi].x, t), y: lerp(raw[lo].y, raw[hi].y, t) };
};
/** World point at s = 0..1 of the arc length. */
export const curveAt = (s: number): P => pointAtArc(clamp01(s) * CURVE_LEN);

const arcOfVertex = (i: number) => rawArc[vertexAt[i]];
/** Arc lengths (world px) of the named events; divide by CURVE_LEN for curveAt's s. */
export const KINK = {
  k1Foot: arcOfVertex(4),
  k1Top: arcOfVertex(5),
  k1Low: arcOfVertex(6),
  k2Foot: arcOfVertex(8),
  k2Top: arcOfVertex(9),
  k2Low: arcOfVertex(10),
  k3Top: arcOfVertex(11),
  crouch: arcOfVertex(12),
  topEdge: arcOfVertex(14),
  end: CURVE_LEN,
} as const;

// --- the rock -------------------------------------------------------------------------------------------------------
// rock 0..1: the card tips back on its shadow, pushed at the tip's side: it turns about its middle (right side up), its
// top edge rides up and narrows a little. The map carries everything drawn on the card; above the top edge its effect
// dies away, so the line on the bare board stays where the tip drew it.
const ROCK = { turn: 0.024, up: 22, narrow: 0.024, die: 420 } as const;
export const cardMap = (rock: number) => {
  const cx = CARD.x + CARD.w / 2;
  const cy = CARD.y + CARD.h / 2;
  const th = -ROCK.turn * rock;
  const cos = Math.cos(th);
  const sin = Math.sin(th);
  return (x: number, y: number): P => {
    if (rock === 0) return { x, y };
    const t = clamp01((CARD_BOTTOM - y) / CARD.h);
    const dx = (x - cx) * (1 - ROCK.narrow * rock * t);
    const dy = y - cy;
    const mx = cx + dx * cos - dy * sin;
    const my = cy + dx * sin + dy * cos - ROCK.up * rock;
    const w = smoothstep((y - (CARD.y - ROCK.die)) / ROCK.die);
    return { x: x + (mx - x) * w, y: y + (my - y) * w };
  };
};

const n6 = (v: number) => (Math.round(v * 1e6) / 1e6).toString();
/** The card's outline under the rock's map. */
const cardOutline = (rock: number) => {
  const M = cardMap(rock);
  const { x, y, w, h, r } = CARD;
  const pts: P[] = [];
  const corner = (cx: number, cy: number, a0: number) => {
    for (let i = 0; i <= 6; i++) {
      const a = a0 + (i / 6) * (Math.PI / 2);
      pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
    }
  };
  corner(x + r, y + r, Math.PI);
  corner(x + w - r, y + r, -Math.PI / 2);
  corner(x + w - r, y + h - r, 0);
  corner(x + r, y + h - r, Math.PI / 2);
  return `${pts
    .map((p, i) => {
      const q = M(p.x, p.y);
      return `${i ? "L" : "M"}${n6(q.x)} ${n6(q.y)}`;
    })
    .join("")}Z`;
};

/** The chart card: one shadow (it grows as the card tips), the cream face, the lit top edge, the ink base rule. */
export const ChartCard: React.FC<{ k: number; rock?: number }> = ({ k, rock = 0 }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const M = cardMap(rock);
  const d = cardOutline(rock);
  const edgeA = M(CARD.x + CARD.r, CARD.y);
  const edgeB = M(CARD.x + CARD.w - CARD.r, CARD.y);
  const ruleA = M(CARD.ruleX0, CARD.ruleY);
  const ruleB = M(CARD.ruleX1, CARD.ruleY);
  return (
    <g>
      <UnionShadow sil={[{ d }]} s={4} elevation="rest" lift={clamp01(rock)} />
      <defs>
        <linearGradient id={`${uid}c`} gradientUnits="userSpaceOnUse" x1="0" y1={CARD.y} x2="0" y2={CARD_BOTTOM}>
          <stop offset="0" stopColor={COLOR.cream} />
          <stop offset="1" stopColor={COLOR.creamFoot} />
        </linearGradient>
      </defs>
      <path d={d} fill={`url(#${uid}c)`} />
      <path
        d={`M${n6(edgeA.x)} ${n6(edgeA.y + EDGE.CREAM / k / 2)}L${n6(edgeB.x)} ${n6(edgeB.y + EDGE.CREAM / k / 2)}`}
        stroke={COLOR.edge}
        strokeOpacity={ALPHA.edge}
        strokeWidth={n6(EDGE.CREAM / k)}
      />
      <path d={`M${n6(ruleA.x)} ${n6(ruleA.y)}L${n6(ruleB.x)} ${n6(ruleB.y)}`} stroke={COLOR.inkDark} strokeWidth={CARD.ruleW} strokeLinecap="round" />
    </g>
  );
};

/** The amber line drawn from its start to s (0..1 of the arc), under the rock's map. `band` = amberBandFor(cam). */
export const AmberCurve: React.FC<{ s: number; k: number; band: [number, number]; rock?: number; tip?: boolean }> = ({ s, k, band, rock = 0, tip = true }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const M = cardMap(rock);
  const end = clamp01(s) * CURVE_LEN;
  // the raw samples up to the end, plus the exact end: nothing ever steps along the line
  const pts: P[] = [];
  for (let i = 0; i < raw.length && rawArc[i] < end; i++) pts.push(M(raw[i].x, raw[i].y));
  const e0 = pointAtArc(end);
  const e = M(e0.x, e0.y);
  pts.push(e);
  const W = curveWeight(k);
  const d = pts.map((p, i) => `${i ? "L" : "M"}${n6(p.x)} ${n6(p.y)}`).join("");
  return (
    <g>
      <UnionShadow sil={[{ d, stroke: W }]} s={1.3} elevation="rest" />
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
      </defs>
      <defs>
        <radialGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" cx={n6(e.x)} cy={n6(e.y)} r={n6(W * 0.5)}>
          <stop offset="0" stopColor={COLOR.amberHot} />
          <stop offset="0.3" stopColor={COLOR.amberHot} stopOpacity={0.9} />
          <stop offset="0.95" stopColor={COLOR.amberTop} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g style={{ filter: bloomFilter(k) }}>
        <path d={d} fill="none" stroke={`url(#${uid}a)`} strokeWidth={n6(W)} strokeLinecap="round" strokeLinejoin="round" />
        {tip ? <circle cx={n6(e.x)} cy={n6(e.y)} r={n6(W * 0.5)} fill={`url(#${uid}t)`} /> : null}
      </g>
      {/* the hot filament down the line's middle: it follows every corner exactly */}
      <path d={d} fill="none" stroke={COLOR.amberHot} strokeOpacity={0.42} strokeWidth={n6(W * 0.16)} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};

// --- the card-less world of AlwaysMoreCompute and OutOfHand: one ground, one line ---------------------------------------
/** The ground's top edge: the same base as the chart card's rule. */
export const GROUND_Y = CARD.ruleY;
const FLOOR = { x: -1600, w: 8000, h: 3600 };
/** The ground, drawn in front of everything still inside it: its gradient and its lit top edge. */
export const GroundFloor: React.FC<{ k: number }> = ({ k }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const floorTop = mixHex(COLOR.ground, COLOR.board, 0.34);
  const floorFoot = mixHex(COLOR.ground, COLOR.board, 0.06);
  return (
    <>
      <defs>
        <linearGradient id={`${uid}g`} gradientUnits="userSpaceOnUse" x1="0" y1={GROUND_Y} x2="0" y2={GROUND_Y + 1250}>
          <stop offset="0" stopColor={floorTop} />
          <stop offset="1" stopColor={floorFoot} />
        </linearGradient>
      </defs>
      <rect x={FLOOR.x} y={GROUND_Y} width={FLOOR.w} height={FLOOR.h} fill={`url(#${uid}g)`} />
      <path d={`M${FLOOR.x} ${n6(GROUND_Y + EDGE.CREAM / k / 2)}H${FLOOR.x + FLOOR.w}`} stroke={COLOR.edge} strokeOpacity={ALPHA.edgeBoard} strokeWidth={n6(EDGE.CREAM / k)} />
    </>
  );
};

export const LINE_HOLD_PX = 32; // the line's on-screen weight at the wide
/** The line's world weight at camera k: the close weight, then held on screen through the wide (the hero of the frame). */
export const lineWeight = (k: number) => Math.pow(Math.pow(LINE_HOLD_PX, 6) + Math.pow(curveWeight(k) * k, 6), 1 / 6) / k;
/** A drawn path `d` ending at its tip `e`, in the recipe of AmberCurve (shadow, bloom, hot filament, hot tip). */
export const LineStroke: React.FC<{ d: string; e: P; k: number; band: [number, number] }> = ({ d, e, k, band }) => {
  const uid = useId().replace(/[^A-Za-z0-9_-]/g, "_");
  const W = lineWeight(k);
  return (
    <g>
      <UnionShadow sil={[{ d, stroke: W }]} s={1.3} elevation="rest" />
      <defs>
        <AmberGradient id={`${uid}a`} y0={band[0]} y1={band[1]} />
        <radialGradient id={`${uid}t`} gradientUnits="userSpaceOnUse" cx={n6(e.x)} cy={n6(e.y)} r={n6(W * 0.62)}>
          <stop offset="0" stopColor={COLOR.amberHot} />
          <stop offset="0.55" stopColor={COLOR.amberHot} />
          <stop offset="1" stopColor={COLOR.amberTop} />
        </radialGradient>
      </defs>
      <g style={{ filter: bloomFilter(k) }}>
        <path d={d} fill="none" stroke={`url(#${uid}a)`} strokeWidth={n6(W)} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={n6(e.x)} cy={n6(e.y)} r={n6(W * 0.62)} fill={`url(#${uid}t)`} />
      </g>
      <path d={d} fill="none" stroke={COLOR.amberHot} strokeOpacity={0.42} strokeWidth={n6(W * 0.16)} strokeLinecap="round" strokeLinejoin="round" />
    </g>
  );
};
