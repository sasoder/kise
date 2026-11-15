// ---------------------------------------------------------------------------
// sinceWritingCalendar — THE CALENDAR BOARD of rsi-since-writing (built by cut 3 YearIntoAWeek, reused by cut 9
// SixMonthsInFourDays; COMMON.md). Dwarkesh 3D (styles/dwarkesh-3d.md) on the kit kits/dwarkesh-3d/dwarkesh3d and the
// clip's world (sinceWritingWorld: WorkSheet, SheetStack, stackTop, SHEET). Read-only for cut builders once
// CALENDAR_READY.md exists in the notes folder (changes keep the old names and are logged in SHARED_CHANGES.md).
//
// UNITS: the cast's (U = 178 per metre). X across, Y height (floor Y = 0, up is -Y), Z depth (toward the camera -Z).
//   Draw inside the cut's <WorldSvg cam>; every component takes the cut's AirWorld A. Nothing here is orange.
//
// ---- THE BOARD -----------------------------------------------------------------------------------------------------
//   A slate calendar board lying on the floor: `rows` week rows of 7 day cells (MON..SUN across X, week 0 the FRONT
//   row at Z = 0, later weeks running back into the haze), a slab CAL.slabH thick whose FRONT FACE carries the day
//   names (cream Caslon, the plate font; the face is parallel to the image plane, so they read without
//   foreshortening). Each cell is a slightly lighter inset panel (weekend panels a step darker); the slab shows between
//   them as the grid. A row can DIM (its panels sink toward the slab and the air: the emptied weeks, "the many still
//   there, dimmed").
//   CAL = { cols 7, cellW 48 (X pitch), cellD 64 (Z pitch, one week row), slabH 20, marginX 6, marginFront 14,
//     marginBack 14, inset 3 }: a sheet (38 x 53) sits in a 48 x 64 cell with 5 / 5.5 units clear.
//   calGeom(rows, over?) -> CalGeom { rows, cols, cellW, cellD, slabH, inset, x0, x1, z0, z1, top (= -slabH) }:
//     x0..x1 the slab across (centred on X = 0), z0 = the front face, z1 = the back end.
//   cellX(g, c) / rowZ(g, r)       the centre of day column c (0 = MON) / of week row r (0 = the front week)
//   cellPanel(g, r, c) -> [X0, X1, Z0, Z1]   a cell's panel rectangle on the slab top
//   DAY_NAMES = ["MON", ..., "SUN"];  WEEKEND = [5, 6]
//   restPose(g, r, c) -> SheetPose  a WorkSheet resting on cell (r, c) (row 0 = exactly stackTop(cellX, 0, 1, top,
//     0, stackSeed(c)), so the front week's sheets ARE the first sheet of the stacks that grow there)
//   stackSeed(c)                    the SheetStack seed of column c's stack
//   <CalendarBoard A g uid dim? labels? labelOn? panel? />   the slab top (in depth bands, fogged by depth, the far end
//     melting into the air), the panels (per row, fogged), the front face with its cream rim and the labels.
//     dim(r) -> 0..1 per row (default none); labels = string[] per column (default DAY_NAMES; null = none);
//     labelOn(c) -> 0..1 per label (default 1: slides up while fading in for 0..1, so a cut can bring some in).
//
// ---- THE COMPRESS MOTION (pure functions of p 0..1; the cut maps its frames onto p) --------------------------------
//   compressPlan({ g, rows?, src?, dst, span?, ... }) -> CompressPlan   which sheet goes where and when. The weekday
//     sheets (src columns, default MON..FRI = [0..4]) of every week row slide forward along their own column toward the
//     front week and hop onto stacks standing on the dst cells of the FRONT row (cut 3: all seven, [0..6]; cut 9:
//     MON..THU, [0, 1, 2, 3]). The front week's own sheets that already sit on a dst cell stay put (they are the
//     stacks' first sheets); the others hop sideways onto a stack at p = 0.
//     ASSIGNMENT: row by row, each row's sheets map in order (non-crossing) onto dst stacks, chosen to keep the stacks
//       even at every moment (balanced to the sheet: cut 3's 260 = 38 + 6 x 37) with the smallest sideways shift;
//       when dst has >= 5 stacks no two sheets of a row share one. plan.counts = the final stack heights.
//     TIMING (one continuous flow, no stalls): a release WAVE runs from the front row back (row r starts at
//       rel(r), accelerating: rows behind follow ever faster); released rows FLOW forward in log-depth
//       (ln(Dz + Z) falls at a common accelerating rate), so the rows keep their order, BUNCH UP like a fanned deck as
//       they near the front (the year crammed together: the gap between rows shrinks with their depth) and arrive at
//       the front in an accelerating stream (cut 3: row hop starts ~2.5 frames apart at first, ~0.75 at the end);
//       at the LAUNCH LINE (zL, default week 3's place, Z 192; rows 1-3 hop from where they are) each row HOPS in two
//       phases: LIFT (still behind the stacks: rising to HOP_CLEAR 6 over its stack's new top and stepping sideways
//       onto its column, the apex HOP_BEHIND 40 behind the stack's centre) then OVER (forward and down, settling flat
//       onto the stack: exactly stackTop at landing). Depth runs on one monotone Hermite whose start slope is the
//       slide's speed (no jolt); height and the sideways step are smoothsteps (zero vertical speed at the start, apex
//       and landing); a little pitch/roll/yaw flutter and curl, with the lowest corner kept on the path. A hop takes
//       hop(r) frames (span-based: ~10 frames early, ~6.5 late). p = 0 the first release, p = 1 the last landing.
//     Options (defaults = cut 3): span 81 (frames the cut maps p over: durations below are in those frames),
//       relEnd 0.6 (raw time of the last release), relGamma 0.75, a0 3, a1 4, aPow 1.5 (the flow rate a(t) = a0 + a1
//       t^aPow, log-units per raw time), ramp 0.05 (each row's start ramp), Dz 400, hop [10, 6.5] frames, zL.
//   compressAt(plan, p) -> CompressState   the state at p: stacks [{ col, X, n }] (n = sheets landed), resting
//     PlanSheet[] (still on their cells), moving [{ s, pose, phase "slide" | "hop" }], rowDim(r) 0..1 (a row dims once
//     its sheets have left, over ~10 frames), rowGone(r) (all its sheets left).
//   sheetPoseAt(plan, s, p) -> SheetPose | null   one sheet's pose (null once it has landed: it is then part of
//     its stack, at exactly stackTop(cellX(dst), 0, n, top, 0, stackSeed(dst)).
//   PlanSheet = { id, r, c (source column), t (dst column), n (its index in that stack, 1-based), stay, rel, hop,
//     land (p) }; CompressPlan = { g, sheets, counts, dst, rowRel[], rowHop[], rowLand[], ... }
//   landPose(plan, s) -> SheetPose   the sheet's landing pose (its stack's top at its index).
//   <CalStack A X Z n uid Y? seed? drain? />   a stack of n WorkSheets, the world SheetStack's look and per-sheet jitter
//     (stackTop), drawn sheet by sheet from the bottom with only the sides that FACE the camera (use this, not the
//     world's SheetStack, wherever a stack is seen from above: SheetStack draws its back-facing sides).
//   <CalendarSheets A plan p uid extras? drain? />   every sheet of the plan at p in painter's order: ON THE BOARD (the
//     resting sheets, the sliding deck and the extras) far to near by depth; then IN THE AIR (the hopping sheets and
//     the stacks) by airOrder. extras = [{ Z, node }]: anything standing on the floor beside the board, drawn at depth Z
//     before everything in the air (keep figures off the stacks' and flyers' screen area, or behind them).
//   airOrder(items, cam, geom?) -> index[]   back-to-front order of AirItems seen from cam = [X, Y, Z] (the eye:
//     [A.P.vp[0], A.P.horizonY, -A.P.Dc]): for every pair whose screen boxes meet, rays through each one's own surface
//     samples vote on which is nearer; a topological sort of the votes, ties and cycles by the fallback key (larger =
//     farther = first). geom(i, j) = false orders that pair by key alone. sheetItem(pose, key) / stackItem(X, Z, Y, n,
//     cam, key) build AirItems; airItemsAt(plan, state, cam, make) gives a state's air items (for a cut's own checks).
//   sheetHeightAt(pose, X, Z) -> Y | null   a (curled, tilted) sheet's surface height over a floor point.
//   KNOWN LIMIT: in the dense late stream a sheet can pass through the sheet just ahead of it for a frame or two (the
//     next row rises from under the one ahead and lands on top of it); they are then drawn in the order the rays'
//     majority says, so the pair's overlap swaps order once (cut 3: ~190 such swaps over the stream, typically
//     300-1,000 px, worst ~2,000 px, cream on cream; not seen on the every-frame sheets). Sheets never pass through a
//     stack, and a landing never changes the order (0 swaps).
//
// ---- COST (cut 3: 52 rows, 260 sheets): the plan ~10 ms once; per frame ~2 ms of state and <1 ms of air order; ~260 WorkSheets + 7 stacks + the board ~ 1,100 paths.
// Probe: none of its own; cut 3 (YearIntoAWeek.tsx) is the reference picture, its check script lives in its notes.
// ---------------------------------------------------------------------------
import React from "react";
import { random } from "remotion";
import { AIR, c01, mixHex, type AirWorld, type Mat, type P2 } from "../kits/dwarkesh-3d/dwarkesh3d";
import { AirShadow } from "../kits/dwarkesh-3d/dwarkesh3d";
import { DEAD, PLATE_FONT, SHEET, WorkSheet, stackTop, type SheetPose } from "./sinceWritingWorld";

const PAL = AIR.A;
const f2 = (v: number) => v.toFixed(2);
const Pt = (v: P2) => `${f2(v[0])},${f2(v[1])}`;
const poly = (q: P2[]) => `M${q.map(Pt).join("L")}Z`;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
const easeOut = (v: number) => 1 - Math.pow(1 - c01(v), 3);
const h01 = (s: string) => random(`swc-${s}`);

// ===================================================================================================================
// GEOMETRY
// ===================================================================================================================
export const CAL = { cols: 7, cellW: 48, cellD: 64, slabH: 20, marginX: 6, marginFront: 14, marginBack: 14, inset: 3 } as const;
export const DAY_NAMES = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
export const WEEKEND = [5, 6];
export type CalGeom = { rows: number; cols: number; cellW: number; cellD: number; slabH: number; inset: number; x0: number; x1: number; z0: number; z1: number; top: number };
export const calGeom = (rows: number, over: Partial<{ cols: number; cellW: number; cellD: number; slabH: number; marginX: number; marginFront: number; marginBack: number; inset: number }> = {}): CalGeom => {
  const o = { ...CAL, ...over };
  const half = (o.cols * o.cellW) / 2 + o.marginX;
  return {
    rows,
    cols: o.cols,
    cellW: o.cellW,
    cellD: o.cellD,
    slabH: o.slabH,
    inset: o.inset,
    x0: -half,
    x1: half,
    z0: -o.cellD / 2 - o.marginFront,
    z1: (rows - 1) * o.cellD + o.cellD / 2 + o.marginBack,
    top: -o.slabH,
  };
};
export const cellX = (g: CalGeom, c: number) => (c - (g.cols - 1) / 2) * g.cellW;
export const rowZ = (g: CalGeom, r: number) => r * g.cellD;
export const cellPanel = (g: CalGeom, r: number, c: number): [number, number, number, number] => {
  const X = cellX(g, c);
  const Z = rowZ(g, r);
  return [X - g.cellW / 2 + g.inset, X + g.cellW / 2 - g.inset, Z - g.cellD / 2 + g.inset, Z + g.cellD / 2 - g.inset];
};
export const stackSeed = (c: number) => 31 + c * 7;
/** a sheet resting on a cell: row 0 is exactly the first sheet of the column's stack */
export const restPose = (g: CalGeom, r: number, c: number): SheetPose => {
  if (r === 0) return stackTop(cellX(g, c), 0, 1, g.top, 0, stackSeed(c));
  const k = `${r}-${c}`;
  return { X: cellX(g, c) + (h01(`rx${k}`) - 0.5) * 3, Y: g.top - 1, Z: rowZ(g, r) + (h01(`rz${k}`) - 0.5) * 3, yaw: (h01(`ry${k}`) - 0.5) * 3, pitch: 0, roll: 0, curl: 0 };
};

// ===================================================================================================================
// THE BOARD
// ===================================================================================================================
/** the slab (slate) and its panels: weekday panels a little lighter than the slab, weekend panels a step darker */
export const MAT_SLAB: Mat = { lit: "#5C6467", mid: "#465053", dark: "#2B3134" };
const PANEL_DAY = "#7E8789";
const PANEL_END = "#6A7376";
const PANEL_DIM = "#5F686B";

export const CalendarBoard: React.FC<{ A: AirWorld; g: CalGeom; uid: string; dim?: (r: number) => number; labels?: string[] | null; labelOn?: (c: number) => number; melt?: number }> = ({
  A,
  g,
  uid,
  dim,
  labels = DAY_NAMES,
  labelOn,
  melt = 0.3,
}) => {
  const P = A.P;
  const h = g.slabH;
  const mf = melt * (g.z1 - g.z0);
  const meltAt = (Z: number) => (melt <= 0 ? 0 : Math.pow(c01((Z - (g.z1 - mf)) / mf), 1.3));
  const toneAt = (hex: string, Z: number) => mixHex(A.tone(hex, Z, h), A.screenAir(P.p(0, g.top, Z)[1]), meltAt(Z));
  const els: React.ReactNode[] = [];
  // the slab top in depth bands (one tone by distance)
  const zA = Math.max(g.z0, P.zNear);
  const N = 30;
  for (let i = 0; i < N; i++) {
    const za = lerp(zA, g.z1, Math.pow(i / N, 1.5));
    const zb = lerp(zA, g.z1, Math.pow((i + 1) / N, 1.5));
    const zb2 = i < N - 1 ? zb + (zb - za) * 0.12 : zb;
    els.push(<path key={`t${i}`} d={poly([P.p(g.x0, g.top, za), P.p(g.x1, g.top, za), P.p(g.x1, g.top, zb2), P.p(g.x0, g.top, zb2)])} fill={toneAt(mixHex(MAT_SLAB.lit, MAT_SLAB.mid, 0.55), (za + zb) / 2)} />);
  }
  // the panels, per row (fogged by the row's depth, dimmed by the cut)
  for (let r = 0; r < g.rows; r++) {
    const Z = rowZ(g, r);
    if (Z + g.cellD / 2 < zA) continue;
    const dm = dim ? c01(dim(r)) : 0;
    let dDay = "";
    let dEnd = "";
    for (let c = 0; c < g.cols; c++) {
      const [X0, X1, Z0, Z1] = cellPanel(g, r, c);
      const q = poly([P.p(X0, g.top, Math.max(Z0, zA)), P.p(X1, g.top, Math.max(Z0, zA)), P.p(X1, g.top, Z1), P.p(X0, g.top, Z1)]);
      if (WEEKEND.includes(c)) dEnd += q;
      else dDay += q;
    }
    const day = mixHex(PANEL_DAY, PANEL_DIM, 0.55 * dm);
    const end = mixHex(PANEL_END, PANEL_DIM, 0.35 * dm);
    els.push(<path key={`pd${r}`} d={dDay} fill={toneAt(day, Z)} />);
    els.push(<path key={`pe${r}`} d={dEnd} fill={toneAt(end, Z)} />);
  }
  // the front face (parallel to the image plane): slate, a soft darkening to its foot, a cream rim along its top edge
  const fz = A.fog(g.z0);
  const fr: P2[] = [P.p(g.x0, g.top, g.z0), P.p(g.x1, g.top, g.z0), P.p(g.x1, 0, g.z0), P.p(g.x0, 0, g.z0)];
  els.push(<path key="ff" d={poly(fr)} fill={A.tone(MAT_SLAB.mid, g.z0, h / 2)} />);
  els.push(
    <g key="ffg">
      <defs>
        <linearGradient id={`${uid}-ff`} gradientUnits="userSpaceOnUse" x1="0" y1={f2(fr[0][1])} x2="0" y2={f2(fr[2][1])}>
          <stop offset="0" stopColor={PAL.cream} stopOpacity={0.08 * (1 - fz)} />
          <stop offset="0.4" stopColor={PAL.shadow} stopOpacity={0} />
          <stop offset="1" stopColor={PAL.shadow} stopOpacity={0.3 * (1 - fz)} />
        </linearGradient>
      </defs>
      <path d={poly(fr)} fill={`url(#${uid}-ff)`} />
    </g>,
  );
  els.push(<path key="rim" d={`M${Pt(fr[0])}L${Pt(fr[1])}`} stroke={PAL.cream} strokeOpacity={0.55 * (1 - fz)} strokeWidth={f2(A.lw(1.3))} strokeLinecap="round" fill="none" />);
  // the day names on the front face
  if (labels) {
    const r0 = P.r(g.z0);
    const size = 0.62 * h * r0;
    labels.forEach((t, c) => {
      if (!t) return;
      const on = labelOn ? c01(labelOn(c)) : 1;
      if (on <= 0) return;
      const e = easeOut(on);
      const [x, y] = P.p(cellX(g, c), g.top / 2, g.z0);
      els.push(
        <text
          key={`l${c}`}
          x={f2(x)}
          y={f2(y + size * 0.36 + 0.45 * size * (1 - e))}
          textAnchor="middle"
          fill={A.tone(PAL.cream, g.z0, h / 2)}
          opacity={sst(0, 1, on)}
          style={{ fontFamily: PLATE_FONT, fontWeight: 700, fontSize: size, letterSpacing: 0.08 * size }}
        >
          {t}
        </text>,
      );
    });
  }
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE COMPRESS PLAN
// ===================================================================================================================
export type PlanSheet = { id: number; r: number; c: number; t: number; n: number; stay: boolean; rel: number; hop: number; land: number; hopDur: number };
export type CompressOpts = {
  g: CalGeom;
  rows?: number;
  src?: number[];
  dst: number[];
  span?: number;
  relEnd?: number;
  relGamma?: number;
  a0?: number;
  a1?: number;
  aPow?: number;
  ramp?: number;
  Dz?: number;
  hop?: [number, number];
  zL?: number;
};
export type CompressPlan = {
  g: CalGeom;
  rows: number;
  src: number[];
  dst: number[];
  sheets: PlanSheet[];
  counts: number[];
  rowRel: number[];
  rowHop: number[];
  rowLand: number[];
  /** raw time -> p: p = raw / T */
  T: number;
  Dz: number;
  zL: number;
  span: number;
  /** a row's accumulated log-flow at p (tabulated) */
  flow: (r: number, p: number) => number;
  /** a row's log-depth speed at p (for the hop's start velocity) */
  flowRate: (r: number, p: number) => number;
};

/** every non-decreasing map of n sheets (sorted columns) onto K stacks */
const monotoneMaps = (n: number, K: number): number[][] => {
  const out: number[][] = [];
  const rec = (i: number, lo: number, acc: number[]) => {
    if (i === n) {
      out.push(acc.slice());
      return;
    }
    for (let k = lo; k < K; k++) {
      acc.push(k);
      rec(i + 1, k, acc);
      acc.pop();
    }
  };
  rec(0, 0, []);
  return out;
};

export const compressPlan = (o: CompressOpts): CompressPlan => {
  const g = o.g;
  const rows = o.rows ?? g.rows;
  const src = o.src ?? [0, 1, 2, 3, 4];
  const dst = o.dst;
  const K = dst.length;
  const span = o.span ?? 81;
  const relEnd = o.relEnd ?? 0.6;
  const relGamma = o.relGamma ?? 0.75;
  const a0 = o.a0 ?? 3;
  const a1 = o.a1 ?? 4;
  const aPow = o.aPow ?? 1.5;
  const ramp = o.ramp ?? 0.05;
  const Dz = o.Dz ?? 400;
  const [hop0, hop1] = o.hop ?? [10, 6.5];
  const zL = o.zL ?? rowZ(g, 3);
  // ---- the assignment (row by row, balanced, non-crossing, smallest shift) ----
  const counts = new Array(K).fill(0);
  const assign: number[][] = [];
  const maps = monotoneMaps(src.length, K);
  let placed = 0;
  for (let r = 0; r < rows; r++) {
    placed += src.length;
    const ideal = placed / K;
    let best: number[] = maps[0];
    let bestCost = Infinity;
    for (const m of maps) {
      const cnt = counts.slice();
      let dup = 0;
      let shift = 0;
      for (let j = 0; j < m.length; j++) {
        if (j > 0 && m[j] === m[j - 1]) dup++;
        cnt[m[j]]++;
        shift += Math.abs(dst[m[j]] - src[j]);
      }
      const bal = cnt.reduce((a, v) => a + (v - ideal) * (v - ideal), 0);
      const cost = bal * 10 + (K >= src.length ? dup * 1000 : dup * 2) + shift * 0.3 + (r === 0 ? shift * 5 : 0);
      if (cost < bestCost - 1e-9) {
        bestCost = cost;
        best = m;
      }
    }
    best.forEach((k) => counts[k]++);
    assign.push(best);
  }
  // ---- the release wave and the flow (raw time) ----
  const lamL = Math.log(Dz + zL);
  const rel = (r: number) => (r <= 1 ? 0 : relEnd * Math.pow((r - 1) / Math.max(1, rows - 2), relGamma));
  const aAt = (t: number) => a0 + a1 * Math.pow(Math.max(0, t), aPow);
  const rampAt = (u: number) => sst(0, 1, u);
  const NT = 3000;
  const tMax = 2.5;
  const dt = tMax / NT;
  const tab: Float64Array[] = [];
  const rowRelRaw: number[] = [];
  const rowHopRaw: number[] = [];
  for (let r = 0; r < rows; r++) {
    const s = rel(r);
    rowRelRaw.push(s);
    const L = Math.log(Dz + rowZ(g, r)) - lamL;
    const A = new Float64Array(NT + 1);
    const Lr = Math.log(Dz + rowZ(g, r)) - lamL;
    let hit = r <= 1 || Lr <= 0 ? s : NaN;
    for (let i = 1; i <= NT; i++) {
      const tm = (i - 0.5) * dt;
      A[i] = A[i - 1] + aAt(tm) * rampAt((tm - s) / ramp) * dt;
      if (Number.isNaN(hit) && A[i] >= L) hit = i * dt - ((A[i] - L) / Math.max(1e-9, A[i] - A[i - 1])) * dt;
    }
    tab.push(A);
    rowHopRaw.push(Number.isNaN(hit) ? tMax : hit);
  }
  // hop durations (frames of the span -> raw time after normalising: solve T with the last landing at p = 1)
  const lastHop = Math.max(...rowHopRaw.slice(1));
  const hopFr = (r: number) => lerp(hop0, hop1, c01((rowHopRaw[r] - rowHopRaw[1]) / Math.max(1e-9, lastHop - rowHopRaw[1])));
  // T: raw time of the last landing; hop duration raw = frames / span * T  =>  T = lastHop + hop1 / span * T
  const T = lastHop / (1 - hop1 / span);
  const rowRel = rowRelRaw.map((v) => v / T);
  const rowHop = rowHopRaw.map((v) => v / T);
  const rowLand = rowHop.map((v, r) => v + hopFr(r) / span);
  // ---- the sheets ----
  const sheets: PlanSheet[] = [];
  const stackN = new Array(K).fill(0);
  // land order: by landing time, then column
  const pending: { r: number; j: number; land: number }[] = [];
  for (let r = 0; r < rows; r++) for (let j = 0; j < src.length; j++) pending.push({ r, j, land: r === 0 ? -1 : rowLand[r] + j * 0.0001 });
  pending.sort((a, b) => a.land - b.land || a.r - b.r || a.j - b.j);
  for (const q of pending) {
    const k = assign[q.r][q.j];
    const t = dst[k];
    const c = src[q.j];
    const stay = q.r === 0 && t === c;
    stackN[k]++;
    const r0 = q.r === 0;
    const hd = r0 ? hop0 / span : rowLand[q.r] - rowHop[q.r];
    sheets.push({ id: q.r * src.length + q.j, r: q.r, c, t, n: stackN[k], stay, rel: r0 ? 0 : rowRel[q.r], hop: r0 ? 0 : rowHop[q.r], land: stay ? -1 : r0 ? hd : rowLand[q.r], hopDur: hd });
  }
  // a stay sheet must be the first of its stack
  sheets.forEach((s) => {
    if (s.stay && s.n !== 1) throw new Error("calendar: a staying front sheet is not its stack's first");
  });
  sheets.sort((a, b) => a.id - b.id);
  const flow = (r: number, p: number) => {
    const x = (p * T) / dt;
    const i = Math.max(0, Math.min(NT - 1, Math.floor(x)));
    const u = c01(x - i);
    const A = tab[r];
    return A[i] + (A[i + 1] - A[i]) * u;
  };
  const flowRate = (r: number, p: number) => aAt(p * T) * rampAt((p * T - rowRelRaw[r]) / ramp) * T;
  const plan: CompressPlan = { g, rows, src, dst, sheets, counts, rowRel, rowHop, rowLand, T, Dz, zL, span, flow, flowRate };
  return plan;
};

// ---- the sheet surface (for the air order and for checks) ----
const D2R = Math.PI / 180;
/** the world's sheet surface point (the same math as sinceWritingWorld's WorkSheet) */
const sheetPt = (q: SheetPose, u: number, v: number): [number, number, number] => {
  let x = (u * SHEET.w) / 2;
  let y = -c01(q.curl) * 9 * u * u + c01(q.curl) * 3 * v * v;
  let z = (v * SHEET.l) / 2;
  const cr = Math.cos(q.roll * D2R);
  const sr = Math.sin(q.roll * D2R);
  [x, y] = [x * cr - y * sr, x * sr + y * cr];
  const cp = Math.cos(q.pitch * D2R);
  const sp = Math.sin(q.pitch * D2R);
  [y, z] = [y * cp - z * sp, y * sp + z * cp];
  const cy = Math.cos(q.yaw * D2R);
  const sy = Math.sin(q.yaw * D2R);
  [x, z] = [x * cy + z * sy, -x * sy + z * cy];
  return [q.X + x, q.Y + y, q.Z + z];
};
/** a sheet's surface height over the floor point (X, Z), or null outside it (Newton on the curled surface) */
export const sheetHeightAt = (q: SheetPose, X: number, Z: number): number | null => {
  const a = q.yaw * D2R;
  const dx = X - q.X;
  const dz = Z - q.Z;
  let u = (dx * Math.cos(a) - dz * Math.sin(a)) / (SHEET.w / 2);
  let v = (dx * Math.sin(a) + dz * Math.cos(a)) / (SHEET.l / 2);
  if (Math.abs(u) > 1.3 || Math.abs(v) > 1.3) return null;
  for (let it = 0; it < 4; it++) {
    const p = sheetPt(q, u, v);
    const pu = sheetPt(q, u + 1e-3, v);
    const pv = sheetPt(q, u, v + 1e-3);
    const A = (pu[0] - p[0]) / 1e-3;
    const B = (pv[0] - p[0]) / 1e-3;
    const C = (pu[2] - p[2]) / 1e-3;
    const D = (pv[2] - p[2]) / 1e-3;
    const det = A * D - B * C;
    const ex = X - p[0];
    const ez = Z - p[2];
    u += (D * ex - B * ez) / det;
    v += (-C * ex + A * ez) / det;
  }
  if (Math.abs(u) > 1 || Math.abs(v) > 1) return null;
  return sheetPt(q, u, v)[1];
};
/** the target pose of a sheet: the top of its stack at its index */
export const landPose = (plan: CompressPlan, s: PlanSheet): SheetPose => stackTop(cellX(plan.g, s.t), 0, s.n, plan.g.top, 0, stackSeed(s.t));

/** the slide height: nearer rows ride a hair higher (the fanned deck overlaps near-over-far) */
const slideY = (plan: CompressPlan, r: number) => plan.g.top - 1.2 - 0.06 * (plan.rows - r);

/** cubic Hermite from a to b with end slopes ma, mb (per unit t) */
const herm = (a: number, b: number, ma: number, mb: number, t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * a + (t3 - 2 * t2 + t) * ma + (-2 * t3 + 3 * t2) * b + (t3 - t2) * mb;
};
/** the hop's apex: this far behind its stack's centre (the sheet's front edge just clear of the stacks' backs) and
 *  this far over the stack's new top */
const HOP_BEHIND = 40;
const HOP_CLEAR = 6;

/** one sheet's pose at p (null once landed; the rest pose before it moves) */
export const sheetPoseAt = (plan: CompressPlan, s: PlanSheet, p: number): SheetPose | null => {
  const g = plan.g;
  if (s.stay) return null;
  if (p >= s.land) return null;
  const rest = restPose(g, s.r, s.c);
  if (p < s.hop) {
    // the slide: log-depth flow, the sheet lifting a hair off its cell as it starts
    if (p <= s.rel) return rest;
    const lam0 = Math.log(plan.Dz + rowZ(g, s.r));
    const lam = lam0 - plan.flow(s.r, p);
    const Zc = Math.exp(lam) - plan.Dz;
    const up = sst(s.rel, s.rel + 4 / plan.span, p);
    return { ...rest, Z: rest.Z + (Zc - rowZ(g, s.r)), Y: lerp(rest.Y, slideY(plan, s.r), up) };
  }
  // the hop: LIFT (still behind the stacks: rising to just over its stack's top and stepping sideways onto its
  // column) then OVER (forward and down, settling flat onto the stack). Depth runs on one monotone Hermite through
  // (0, z0) (sA, zA) (1, zT) whose start slope is the slide's speed (no jolt), ending at rest; height and the sideways
  // step are smoothsteps per phase (zero vertical speed at the start, at the apex and at landing).
  const u = c01((p - s.hop) / (s.land - s.hop));
  const to = landPose(plan, s);
  if (u >= 1) return to;
  const x0 = rest.X;
  const z0 = s.r === 0 ? rest.Z : rest.Z + Math.min(0, plan.zL - rowZ(g, s.r));
  const y0 = s.r === 0 ? rest.Y : lerp(rest.Y, slideY(plan, s.r), sst(s.rel, s.rel + 4 / plan.span, s.hop));
  const zA = Math.max(to.Z + HOP_BEHIND, Math.min(z0, to.Z + HOP_BEHIND));
  const yA = Math.min(to.Y - SHEET.t - HOP_CLEAR, y0 - 6);
  const d1 = Math.max(0, z0 - zA) + Math.abs(y0 - yA) + Math.abs(to.X - x0);
  const d2 = zA - to.Z + Math.abs(to.Y - yA);
  const sA = Math.max(0.3, Math.min(0.72, d1 / Math.max(1e-6, d1 + d2)));
  const dur = s.land - s.hop;
  const vZ = rowZ(g, s.r) > plan.zL ? plan.flowRate(s.r, s.hop) * (plan.Dz + plan.zL) : 0;
  const D1 = (zA - z0) / sA;
  const D2 = (to.Z - zA) / (1 - sA);
  const m0 = Math.max(3 * Math.min(D1, -1e-6), -vZ * dur);
  const mA = D1 < 0 && D2 < 0 ? 2 / (1 / D1 + 1 / D2) : 0;
  let Z: number;
  let Y: number;
  let X: number;
  if (u < sA) {
    const t = u / sA;
    Z = herm(z0, zA, m0 * sA, mA * sA, t);
    Y = lerp(y0, yA, sst(0, 0.8, t));
    X = lerp(x0, to.X, sst(0, 0.85, t));
  } else {
    const t = (u - sA) / (1 - sA);
    Z = herm(zA, to.Z, mA * (1 - sA), 0, t);
    Y = lerp(yA, to.Y, sst(0, 1, t));
    X = to.X;
  }
  const t1 = c01(u / sA);
  const t2 = c01((u - sA) / (1 - sA));
  const ph = h01(`ph${s.id}`) * Math.PI * 2;
  const settle = 1 - sst(0, 1, t2);
  const pitch = (7 * Math.sin(Math.PI * t1) * (u < sA ? 1 : 0) - 5 * Math.sin(Math.PI * t2)) * (u < sA ? 1 : settle) + 3 * Math.sin(ph + 2 * Math.PI * u) * Math.sin(Math.PI * u) * settle;
  const roll = (-5 * ((to.X - x0) / g.cellW) * Math.sin(Math.PI * t1) * (u < sA ? 1 : 0) + 3 * Math.cos(ph) * Math.sin(Math.PI * u)) * settle;
  // the lowest corner rides the path (a tilted sheet is lifted by its tilt)
  const dip = Math.abs(Math.sin((pitch * Math.PI) / 180)) * (SHEET.l / 2) + Math.abs(Math.sin((roll * Math.PI) / 180)) * (SHEET.w / 2);
  return {
    X,
    Y: Y - dip,
    Z,
    yaw: lerp(rest.yaw, to.yaw, sst(0, 1, u)) + 7 * Math.sin(Math.PI * u) * Math.sin(ph) * settle,
    pitch,
    roll,
    curl: 0.3 * Math.sin(Math.PI * u) * settle,
  };
};

export type CompressState = {
  stacks: { col: number; X: number; n: number }[];
  resting: PlanSheet[];
  moving: { s: PlanSheet; pose: SheetPose; phase: "slide" | "hop" }[];
  rowDim: (r: number) => number;
  rowGone: (r: number) => boolean;
};
export const compressAt = (plan: CompressPlan, p: number): CompressState => {
  const g = plan.g;
  const n = new Map<number, number>();
  plan.dst.forEach((c) => n.set(c, 0));
  const resting: PlanSheet[] = [];
  const moving: CompressState["moving"] = [];
  for (const s of plan.sheets) {
    if (s.stay || p >= s.land) {
      n.set(s.t, Math.max(n.get(s.t) ?? 0, s.n));
      continue;
    }
    if (p <= s.rel && s.r > 0) {
      resting.push(s);
      continue;
    }
    const pose = sheetPoseAt(plan, s, p);
    if (pose) moving.push({ s, pose, phase: p < s.hop ? "slide" : "hop" });
  }
  // a stack's count = the highest index landed (sheets land in order on each stack)
  const stacks = plan.dst.map((c) => ({ col: c, X: cellX(g, c), n: n.get(c) ?? 0 }));
  const dimFr = 10 / plan.span;
  return {
    stacks,
    resting,
    moving,
    rowDim: (r: number) => (r === 0 ? 0 : sst(plan.rowRel[r] + 2 / plan.span, plan.rowRel[r] + 2 / plan.span + dimFr, p)),
    rowGone: (r: number) => r > 0 && p > plan.rowRel[r],
  };
};

// ===================================================================================================================
// THE STACK (the world's SheetStack geometry: the same per-sheet jitter through stackTop, so a sheet landing at
// stackTop(n) is exactly the new top; drawn sheet by sheet from the bottom with the sides that FACE the camera)
// ===================================================================================================================
const PAPER = { front: "#E4DAC6", lit: "#EFE7D5", shade: "#CBBDA2", line: "#A4957A" };
export const CalStack: React.FC<{ A: AirWorld; X: number; Z: number; n: number; uid: string; Y?: number; seed?: number; drain?: number }> = ({ A, X, Z, n, uid, Y = 0, seed = 0, drain = 0 }) => {
  const P = A.P;
  const N = Math.max(0, Math.round(n));
  if (N <= 0) return null;
  const camX = P.vp[0];
  const camZ = -P.Dc;
  const dr = c01(drain);
  const hM = -(Y - (N * SHEET.t) / 2);
  const tone = (hex: string) => A.tone(mixHex(hex, DEAD, dr), Z, hM);
  const cols = { f: tone(PAPER.front), l: tone(PAPER.lit), r: tone(PAPER.shade), ln: tone(PAPER.line) };
  const hw = SHEET.w / 2;
  const hl = SHEET.l / 2;
  const lw = f2(0.45 * P.r(Z));
  const els: React.ReactNode[] = [<AirShadow key="sh" A={A} X={X} Z={Z} w={SHEET.w * 0.95} d={SHEET.l * 0.6} Y={Y} uid={`${uid}-sh`} amt={0.75} />];
  for (let i = 0; i < N; i++) {
    const q = stackTop(X, Z, i + 1, Y, 0, seed);
    const a = (q.yaw * Math.PI) / 180;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const corner = (u: number, v: number): [number, number] => [q.X + u * hw * ca + v * hl * sa, q.Z - u * hw * sa + v * hl * ca];
    const cs = [corner(-1, -1), corner(1, -1), corner(1, 1), corner(-1, 1)];
    const yT = q.Y;
    const yB = q.Y + SHEET.t;
    let dF = "";
    let dS = "";
    let sideLit = true;
    for (let k = 0; k < 4; k++) {
      const pa = cs[k];
      const pb = cs[(k + 1) % 4];
      // outward normal of this side (for the corner order above: front edge first, then right, back, left)
      const nx = pb[1] - pa[1];
      const nz = -(pb[0] - pa[0]);
      const mx = (pa[0] + pb[0]) / 2;
      const mz = (pa[1] + pb[1]) / 2;
      if (nx * (camX - mx) + nz * (camZ - mz) <= 0) continue;
      const quad = poly([P.p(pa[0], yB, pa[1]), P.p(pb[0], yB, pb[1]), P.p(pb[0], yT, pb[1]), P.p(pa[0], yT, pa[1])]);
      if (Math.abs(nz) > Math.abs(nx)) dF += quad;
      else {
        dS += quad;
        sideLit = nx < 0;
      }
    }
    if (dS) els.push(<path key={`s${i}`} d={dS} fill={sideLit ? cols.l : cols.r} stroke={cols.ln} strokeWidth={lw} strokeOpacity={0.5} strokeLinejoin="round" />);
    if (dF) els.push(<path key={`f${i}`} d={dF} fill={cols.f} stroke={cols.ln} strokeWidth={lw} strokeOpacity={0.5} strokeLinejoin="round" />);
  }
  const top = stackTop(X, Z, N, Y, 0, seed);
  if (top.Y > P.horizonY) els.push(<WorkSheet key="top" A={A} pose={top} uid={`${uid}-top`} drain={dr} />);
  return <g>{els}</g>;
};

// ===================================================================================================================
// THE ORDER OF WHAT IS IN THE AIR (flyers and stacks): who covers whom along the eye's rays
// ===================================================================================================================
type V3 = [number, number, number];
/** a thing in the air for the ordering: its own visible surface samples, a ray test, and a fallback key (far first) */
export type AirItem = { pts: V3[]; hit: (o: V3, d: V3) => number | null; key: number };
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
/** a sheet as an AirItem: the ray meets its tilted plane, refined onto the curled surface */
export const sheetItem = (q: SheetPose, key: number): AirItem => {
  const c = sheetPt(q, 0, 0);
  const eu = sub(sheetPt(q, 1, 0), sheetPt(q, -1, 0));
  const ev = sub(sheetPt(q, 0, 1), sheetPt(q, 0, -1));
  const nrm: V3 = [eu[1] * ev[2] - eu[2] * ev[1], eu[2] * ev[0] - eu[0] * ev[2], eu[0] * ev[1] - eu[1] * ev[0]];
  const pts: V3[] = [];
  for (const u of [-1, -0.5, 0, 0.5, 1]) for (const v of [-1, -2 / 3, -1 / 3, 0, 1 / 3, 2 / 3, 1]) pts.push(sheetPt(q, u, v));
  const uu = dot(eu, eu);
  const vv = dot(ev, ev);
  const hit = (o: V3, d: V3) => {
    const dn = dot(d, nrm);
    if (Math.abs(dn) < 1e-9) return null;
    let t = dot(sub(c, o), nrm) / dn;
    let u = 0;
    let v = 0;
    for (let it = 0; it < 3; it++) {
      const h: V3 = [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t];
      const r = sub(h, c);
      u = (2 * dot(r, eu)) / uu;
      v = (2 * dot(r, ev)) / vv;
      if (Math.abs(u) > 1.05 || Math.abs(v) > 1.05) return null;
      const S = sheetPt(q, u, v);
      t += dot(sub(S, h), nrm) / dn;
    }
    return Math.abs(u) <= 1 && Math.abs(v) <= 1 ? t : null;
  };
  return { pts, hit, key };
};
/** a stack as an AirItem: a box X +-w/2, Z +-l/2 from its foot Y up n sheets */
export const stackItem = (X: number, Z: number, Y: number, n: number, cam: V3, key: number): AirItem => {
  const x0 = X - SHEET.w / 2;
  const x1 = X + SHEET.w / 2;
  const z0 = Z - SHEET.l / 2;
  const z1 = Z + SHEET.l / 2;
  const y0 = Y - n * SHEET.t;
  const y1 = Y;
  const pts: V3[] = [];
  const g3 = [0, 0.25, 0.5, 0.75, 1];
  for (const a of g3) for (const b of g3) pts.push([lerp(x0, x1, a), y0, lerp(z0, z1, b)]);
  for (const a of g3) for (const b of g3) pts.push([lerp(x0, x1, a), lerp(y0, y1, b), z0]);
  const xs = cam[0] < x0 ? x0 : cam[0] > x1 ? x1 : null;
  if (xs !== null) for (const a of g3) for (const b of g3) pts.push([xs, lerp(y0, y1, b), lerp(z0, z1, a)]);
  const hit = (o: V3, d: V3) => {
    let tn = -Infinity;
    let tf = Infinity;
    const lo = [x0, y0, z0];
    const hi = [x1, y1, z1];
    for (let k = 0; k < 3; k++) {
      if (Math.abs(d[k]) < 1e-12) {
        if (o[k] < lo[k] || o[k] > hi[k]) return null;
        continue;
      }
      const ta = (lo[k] - o[k]) / d[k];
      const tb = (hi[k] - o[k]) / d[k];
      tn = Math.max(tn, Math.min(ta, tb));
      tf = Math.min(tf, Math.max(ta, tb));
    }
    return tn <= tf && tf > 0 ? tn : null;
  };
  return { pts, hit, key };
};
/** the drawing order (back to front) of things in the air seen from cam: for every pair, the eye's rays through each
 *  one's own samples vote on which is nearer where they cover each other; a topological sort of those votes, ties and
 *  cycles broken by the fallback key (larger key = farther = earlier) */
export const airOrder = (items: AirItem[], cam: V3, geom: (i: number, j: number) => boolean = () => true): number[] => {
  const n = items.length;
  const over: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Array(n).fill(0);
  // a quick reject: the items' sample directions as unit rays, compared by angular boxes
  const dirs = items.map((it) =>
    it.pts.map((q) => {
      const d = sub(q, cam);
      return [d[0] / d[2], d[1] / d[2]] as [number, number];
    }),
  );
  const box = dirs.map((ds) => {
    let a = Infinity;
    let b = -Infinity;
    let c = Infinity;
    let e = -Infinity;
    for (const [x, y] of ds) {
      a = Math.min(a, x);
      b = Math.max(b, x);
      c = Math.min(c, y);
      e = Math.max(e, y);
    }
    const pad = 0.02;
    return [a - pad, b + pad, c - pad, e + pad];
  });
  for (let i = 0; i < n; i++)
    for (let j = i + 1; j < n; j++) {
      const A = box[i];
      const B = box[j];
      if (A[1] < B[0] || B[1] < A[0] || A[3] < B[2] || B[3] < A[2]) continue;
      let vi = 0;
      let vj = 0;
      if (!geom(i, j)) {
        if (items[i].key > items[j].key) {
          over[i].push(j);
          indeg[j]++;
        } else {
          over[j].push(i);
          indeg[i]++;
        }
        continue;
      }
      const vote = (a: number, b: number) => {
        for (const q of items[a].pts) {
          const d = sub(q, cam);
          const t = items[b].hit(cam, d);
          if (t === null) continue;
          if (t < 1 - 1e-4) {
            if (a === i) vj++;
            else vi++;
          } else {
            if (a === i) vi++;
            else vj++;
          }
        }
      };
      vote(i, j);
      vote(j, i);
      if (vi === vj) continue;
      // the nearer one is drawn after the farther one
      if (vi > vj) {
        over[j].push(i);
        indeg[i]++;
      } else {
        over[i].push(j);
        indeg[j]++;
      }
    }
  const out: number[] = [];
  const used = new Array(n).fill(false);
  for (let step = 0; step < n; step++) {
    let pick = -1;
    for (let i = 0; i < n; i++) if (!used[i] && indeg[i] === 0 && (pick < 0 || items[i].key > items[pick].key)) pick = i;
    if (pick < 0) for (let i = 0; i < n; i++) if (!used[i] && (pick < 0 || items[i].key > items[pick].key)) pick = i; // a cycle: the farthest key goes first
    used[pick] = true;
    out.push(pick);
    for (const j of over[pick]) indeg[j]--;
  }
  return out;
};

// ===================================================================================================================
// THE SHEETS IN PAINTER'S ORDER
// ===================================================================================================================
/** the calendar's sheets and stacks in painter's order. On the board (resting and sliding sheets, and the extras)
 *  by depth; then everything in the air (the hopping sheets and the stacks) by airOrder. */
export const CalendarSheets: React.FC<{ A: AirWorld; plan: CompressPlan; p: number; uid: string; extras?: { Z: number; node: React.ReactNode }[]; drain?: number }> = ({ A, plan, p, uid, extras = [], drain = 0 }) => {
  const g = plan.g;
  const st = compressAt(plan, p);
  type Item = { key: number; node: React.ReactNode };
  const base: Item[] = [];
  st.resting.forEach((s) => base.push({ key: rowZ(g, s.r) + 0.001 * s.c, node: <WorkSheet key={`r${s.id}`} A={A} pose={restPose(g, s.r, s.c)} uid={`${uid}r${s.id}`} drain={drain} /> }));
  st.moving.forEach(({ s, pose, phase }) => {
    if (phase === "slide") base.push({ key: pose.Z, node: <WorkSheet key={`m${s.id}`} A={A} pose={pose} uid={`${uid}m${s.id}`} drain={drain} /> });
  });
  extras.forEach((e, i) => base.push({ key: e.Z + 0.0001 * i, node: <g key={`x${i}`}>{e.node}</g> }));
  base.sort((a, b) => b.key - a.key);
  const cam: V3 = [A.P.vp[0], A.P.horizonY, -A.P.Dc];
  const { items, nodes } = airItemsAt(plan, st, cam, (kind, i) =>
    kind === "sheet" ? (
      <WorkSheet key={`m${st.moving[i].s.id}`} A={A} pose={st.moving[i].pose} uid={`${uid}m${st.moving[i].s.id}`} drain={drain} />
    ) : (
      <CalStack key={`s${st.stacks[i].col}`} A={A} X={st.stacks[i].X} Z={0} n={st.stacks[i].n} Y={g.top} seed={stackSeed(st.stacks[i].col)} uid={`${uid}s${st.stacks[i].col}`} drain={drain} />
    ),
  );
  const order = airOrder(items, cam);
  return (
    <g>
      {base.map((it) => it.node)}
      {order.map((i) => nodes[i])}
    </g>
  );
};
/** the things in the air at a state, as AirItems (exported so a cut's checks can audit the order frame by frame) */
export const airItemsAt = <T,>(plan: CompressPlan, st: CompressState, cam: V3, make: (kind: "sheet" | "stack", i: number) => T) => {
  const g = plan.g;
  const items: AirItem[] = [];
  const nodes: T[] = [];
  const ids: string[] = [];
  st.moving.forEach(({ s, pose, phase }, i) => {
    if (phase !== "hop") return;
    items.push(sheetItem(pose, pose.Z));
    nodes.push(make("sheet", i));
    ids.push(`m${s.id}`);
  });
  st.stacks.forEach((k, i) => {
    if (k.n <= 0) return;
    items.push(stackItem(k.X, 0, g.top, k.n, cam, -100 + 0.01 * Math.abs(k.X - cam[0])));
    nodes.push(make("stack", i));
    ids.push(`s${k.col}`);
  });
  return { items, nodes, ids };
};
