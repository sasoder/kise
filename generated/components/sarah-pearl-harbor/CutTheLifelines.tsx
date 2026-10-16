// ---------------------------------------------------------------------------
// CutTheLifelines — Sarah Paine, "How the Depression pushed Japan to Pearl
// Harbor" (Dwarkesh map style, the ASIA world of pearlShared). 1080x1920, 24 fps.
//
// CHECK LINE: "Japan moved south to cut the roads that fed Nationalist China,
// betting China would then collapse."
//
// THE MOTION: the south-west, Rangoon (lower left) to Chongqing (top) and
// Haiphong (right), the aid alive: convoy wagons run at constant speed up the
// Burma Road (Rangoon -> Lashio -> Kunming -> Chongqing) and the Yunnan railway
// (Haiphong -> Kunming). On "the Japanese decide" Japan's hatch advances out of
// the Gulf of Tonkin up the Red River as one front (the last train has just
// left Haiphong), seizing the railway as it goes (the line turns orange); at
// the border the line is severed and the stretch beyond dies (wagons brake, the
// line drops to 0.35). On "all the foreign aid" a dashed orange bar is drawn
// across the Burma Road past Lashio (the closure Japan forced): the road is
// severed, the convoys behind it pile up, and the stopping runs up the road to
// Chongqing as the camera follows it — nothing arrives; NATIONALISTS lands on
// its word. Then Japan's imagined conquest — a dashed-orange ghost hatch
// carried by an irregular dashed front — leaves the real front line and
// sweeps west over all of free China (past Chongqing on "take over") while the
// camera pulls back to the whole country, and the frame settles.
//
// DURATION: the slot 00:01:13:11 – 00:01:22:13 = frames 1763–1981 = 218 f,
// + 12 f of living tail = 230.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  ACCENT,
  ACCENT_DEEP,
  CityDot,
  HatchPattern,
  INK,
  Label,
  MapPage,
  Packets,
  SHADOW,
  WorldSvg,
  clamp01,
  dOf,
  mixColor,
  cumOf,
  pchip,
  pointAt,
  ramp,
  runCamera,
  slicePts,
  smoothstep,
  type Cam,
  type CamKey,
  type P2,
  type Packet,
} from "./pearlShared";
import {
  BURMA_RAIL,
  BURMA_ROAD,
  BURMA_ROUTE,
  CANTON,
  FREE_CHINA,
  INDOCHINA_NORTH,
  JAPAN_1931,
  MANCHUKUO,
  OCCUPIED_1938,
  PLACES,
  YUNNAN_RAILWAY,
} from "./pearlAsiaMapData";

export const FPS = 24;
export const DURATION = 230;

export const schema = z.object({
  nationalists: z.string(),
  japanese: z.string(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ nationalists: "NATIONALISTS", japanese: "JAPANESE" });

// ---------------------------------------------------------------------------
// GEOMETRY (all world px of the ASIA world)
// ---------------------------------------------------------------------------
type Box = [number, number, number, number];
type Region = { d: string; edge?: string; box: Box };
const YR = YUNNAN_RAILWAY;
const BR = BURMA_ROUTE;
const CQ = PLACES.chongqing;
const nums = (d: string): P2[] => {
  const out: P2[] = [];
  const re = /(-?\d+\.?\d*),(-?\d+\.?\d*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) out.push([+m[1], +m[2]]);
  return out;
};

// -- Tonkin: one straight front out of the Gulf, moving up the Red River (Haiphong -> Lao Cai)
const HP = pointAt(YR.pts, 0);
const LC = pointAt(YR.pts, YR.stations.laoCai);
const TK_DIR: P2 = (() => {
  const dx = LC.x - HP.x;
  const dy = LC.y - HP.y;
  const l = Math.hypot(dx, dy);
  return [dx / l, dy / l];
})();
/** distance of a point along the Tonkin front's direction, from Haiphong */
const tkProj = (x: number, y: number) => (x - HP.x) * TK_DIR[0] + (y - HP.y) * TK_DIR[1];
const TK_PS = nums(INDOCHINA_NORTH.d).map(([x, y]) => tkProj(x, y));
const TK_SMIN = Math.min(...TK_PS);
const TK_SMAX = Math.max(...TK_PS);
/** the railway's arclength where it is severed: just past Lao Cai, on the border */
const RAIL_CUT_S = YR.stations.laoCai + 1;
const RAIL_CUT_P = tkProj(pointAt(YR.pts, RAIL_CUT_S).x, pointAt(YR.pts, RAIL_CUT_S).y);
// the front's position (projection) per frame: constant speed (troops march), in
// from offshore, touching the coast ~f36, reaching the border ~f79
const TK_S = pchip([
  [16, TK_SMIN - 38],
  [36, TK_SMIN],
  [79, RAIL_CUT_P],
  [98, TK_SMAX + 4],
]);
// the railway arclength the front has seized (monotone table)
const RAIL_PROJ: { s: number; p: number }[] = [];
for (let s = 0; s <= RAIL_CUT_S + 0.001; s += 0.5) {
  const q = pointAt(YR.pts, s);
  RAIL_PROJ.push({ s, p: tkProj(q.x, q.y) });
}
const railSeized = (f: number) => {
  const p = TK_S(f);
  if (p <= 0) return 0;
  let s = 0;
  for (const r of RAIL_PROJ) {
    if (r.p > p) break;
    s = r.s;
  }
  return s;
};
const firstFrame = (pred: (f: number) => boolean, f0: number, f1: number) => {
  for (let f = f0; f <= f1; f += 0.25) if (pred(f)) return f;
  return f1;
};
/** the railway is severed: the front has reached the border */
const F_RAIL_CUT = Math.round(firstFrame((f) => TK_S(f) >= RAIL_CUT_P - 0.5, 20, 120));
/** the front first touches land */
const F_TK_LAND = firstFrame((f) => TK_S(f) >= TK_SMIN, 0, 120);

// -- the Burma Road closure: a dashed bar across the road just past Lashio
const ROAD_CUT_S = 10; // on BURMA_ROAD (Lashio = 0)
const ROUTE_CUT_S = BR.stations.lashio + ROAD_CUT_S; // the same point on BURMA_ROUTE
const GATE = pointAt(BURMA_ROAD.pts, ROAD_CUT_S);
const GATE_N: P2 = [-GATE.ty, GATE.tx];
const GATE_HALF = 24; // world px either side of the road
const GATE_A: P2 = [GATE.x - GATE_N[0] * GATE_HALF, GATE.y - GATE_N[1] * GATE_HALF];
const GATE_B: P2 = [GATE.x + GATE_N[0] * GATE_HALF, GATE.y + GATE_N[1] * GATE_HALF];
const [GATE_P0, GATE_P1] = [GATE_A, GATE_B];
/** JAPANESE: start-anchored just above northern Tonkin, east of the railway at every zoom */
const JP_LABEL: P2 = [388.1, 1092.1];

// ---------------------------------------------------------------------------
// THE PLAN: an arrival-time field over free China. The imagined conquest leaves
// Japan's real front (the inland edges of occupied China and Manchukuo) and
// travels outward at one speed, with a slow low-frequency wobble so its front
// is irregular (|grad wobble| < 1: no islands run ahead of it). Per frame the
// front is the contour of the field (marching squares) and the ghost hatch is
// clipped to the part already reached.
// ---------------------------------------------------------------------------
const GX0 = -100;
const GY0 = 470;
const GS = 4.5;
const GNX = Math.ceil((800 - GX0) / GS) + 1;
const GNY = Math.ceil((1200 - GY0) / GS) + 1;
const SOURCES: P2[] = (() => {
  // the real front line (occupied China's and Manchukuo's inland edges), not the
  // Canton pocket: a pocket alone would grow a disc, which reads as a ripple
  const cb = CANTON.box;
  const inCanton = ([x, y]: P2) => x > cb[0] - 6 && x < cb[2] + 6 && y > cb[1] - 6 && y < cb[3] + 6;
  const raw = [...nums(OCCUPIED_1938.edge ?? ""), ...nums(MANCHUKUO.edge ?? "")].filter((p) => !inCanton(p));
  const out: P2[] = [];
  for (const p of raw) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) >= 2.5) out.push(p);
  }
  return out;
})();
const wobble = (x: number, y: number) =>
  Math.sin(x / 83 + 1.3) * Math.cos(y / 71 - 0.4) + 0.5 * Math.sin((0.6 * x - 0.8 * y) / 52 + 2.2);
const WOBBLE = 13;
const FIELD = (() => {
  const t = new Float32Array(GNX * GNY);
  for (let j = 0; j < GNY; j++)
    for (let i = 0; i < GNX; i++) {
      const x = GX0 + i * GS;
      const y = GY0 + j * GS;
      if (i === 0 || j === 0 || i === GNX - 1 || j === GNY - 1) {
        t[j * GNX + i] = 1e6; // a closed border: every contour is a loop
        continue;
      }
      let d2 = Infinity;
      for (const [sx, sy] of SOURCES) {
        const dx = sx - x;
        const dy = sy - y;
        const q = dx * dx + dy * dy;
        if (q < d2) d2 = q;
      }
      t[j * GNX + i] = Math.sqrt(d2) + WOBBLE * wobble(x, y);
    }
  return t;
})();
const fieldAt = (x: number, y: number) => {
  const fi = (x - GX0) / GS;
  const fj = (y - GY0) / GS;
  const i = Math.max(0, Math.min(GNX - 2, Math.floor(fi)));
  const j = Math.max(0, Math.min(GNY - 2, Math.floor(fj)));
  const u = fi - i;
  const v = fj - j;
  const a = FIELD[j * GNX + i];
  const b = FIELD[j * GNX + i + 1];
  const c = FIELD[(j + 1) * GNX + i];
  const d = FIELD[(j + 1) * GNX + i + 1];
  return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
};
const PLAN_CQ = fieldAt(CQ[0], CQ[1]);
const PLAN_MAX = Math.max(...nums(FREE_CHINA.d).map(([x, y]) => fieldAt(x, y)));
/** the front's level (field value reached) per frame */
// the final frame (see CAM_KEYS) holds ~92-122 E: the sweep crosses all of
// free China inside it by ~f195 (and the rest off-frame by ~f200)
const FINAL_VIEW = { x0: 446 - 540 / 1.95 - 10, x1: 446 + 540 / 1.95, y0: 1057 - 960 / 1.95, y1: 1057 + 960 / 1.95 };
const PLAN_VIS = Math.max(
  ...nums(FREE_CHINA.d)
    .filter(([x, y]) => x >= FINAL_VIEW.x0 && x <= FINAL_VIEW.x1 && y >= FINAL_VIEW.y0 && y <= FINAL_VIEW.y1)
    .map(([x, y]) => fieldAt(x, y)),
);
const PLAN_L = pchip([
  [143, -8],
  [149, 6],
  [181, PLAN_CQ],
  [195, PLAN_VIS + 4],
  [204, PLAN_MAX + 6],
]);
const planLevel = (f: number) => (f < 143 ? -8 : Math.min(PLAN_MAX + 6, PLAN_L(f)));

/** marching squares: the closed loops of the field's contour at `level` */
const contourLoops = (level: number): P2[][] => {
  const N = GNX * GNY;
  const adj = new Map<number, number[]>();
  const link = (a: number, b: number) => {
    const la = adj.get(a);
    if (la) la.push(b);
    else adj.set(a, [b]);
    const lb = adj.get(b);
    if (lb) lb.push(a);
    else adj.set(b, [a]);
  };
  const F = FIELD;
  for (let j = 0; j < GNY - 1; j++)
    for (let i = 0; i < GNX - 1; i++) {
      const va = F[j * GNX + i];
      const vb = F[j * GNX + i + 1];
      const vc = F[(j + 1) * GNX + i + 1];
      const vd = F[(j + 1) * GNX + i];
      const c = (va <= level ? 8 : 0) | (vb <= level ? 4 : 0) | (vc <= level ? 2 : 0) | (vd <= level ? 1 : 0);
      if (c === 0 || c === 15) continue;
      const top = j * GNX + i;
      const bottom = (j + 1) * GNX + i;
      const left = N + j * GNX + i;
      const right = N + j * GNX + i + 1;
      switch (c) {
        case 1:
        case 14:
          link(left, bottom);
          break;
        case 2:
        case 13:
          link(bottom, right);
          break;
        case 3:
        case 12:
          link(left, right);
          break;
        case 4:
        case 11:
          link(top, right);
          break;
        case 6:
        case 9:
          link(top, bottom);
          break;
        case 7:
        case 8:
          link(left, top);
          break;
        case 5:
        case 10: {
          const centreIn = (va + vb + vc + vd) / 4 <= level;
          if ((c === 5) === centreIn) {
            link(left, top);
            link(bottom, right);
          } else {
            link(left, bottom);
            link(top, right);
          }
          break;
        }
      }
    }
  const pos = (key: number): P2 => {
    if (key < N) {
      const i = key % GNX;
      const j = (key - i) / GNX;
      const a = F[key];
      const b = F[key + 1];
      const t = (level - a) / (b - a);
      return [GX0 + (i + t) * GS, GY0 + j * GS];
    }
    const k = key - N;
    const i = k % GNX;
    const j = (k - i) / GNX;
    const a = F[k];
    const b = F[k + GNX];
    const t = (level - a) / (b - a);
    return [GX0 + i * GS, GY0 + (j + t) * GS];
  };
  const seen = new Set<number>();
  const loops: P2[][] = [];
  for (const start of adj.keys()) {
    if (seen.has(start)) continue;
    const loop: P2[] = [];
    let prev = -1;
    let cur = start;
    for (let guard = 0; guard < 200000; guard++) {
      seen.add(cur);
      loop.push(pos(cur));
      const nb = adj.get(cur) ?? [];
      const next = nb[0] !== prev ? nb[0] : nb[1];
      if (next === undefined || next === start) break;
      if (seen.has(next)) break;
      prev = cur;
      cur = next;
    }
    if (loop.length > 2) loops.push(loop);
  }
  return loops;
};

// ---------------------------------------------------------------------------
// TIMING (local frames; words: Japanese@38 decide@43 cut@73 off@80 all@86
// foreign@97 aid@106 nationalists@133 surely@151 cave@167 take@181 over@185
// China@192 good@213; cut back to the speaker at 218)
// ---------------------------------------------------------------------------
export const T = {
  tonkinLand: F_TK_LAND, // ~36: Japan's front reaches the Tonkin coast
  haiphongClosed: 40, // ships bound for Haiphong turn back; the last train left ~f35
  railCut: F_RAIL_CUT, // ~79: the line is severed on the border
  railOpen: 6,
  gate: [90, 99] as const, // the closure bar grows out of the road across it
  roadCut: 100, // the road is severed; ships bound for Rangoon turn back
  roadOpen: 6,
  roadArrive: 126, // the stopping reaches Chongqing
  japanese: 30, // JAPANESE slides up on the Tonkin front (word @38)
  nationalists: 125, // label slides up (word @133)
  plan: 143, // the imagined conquest leaves the front; round Chongqing ~f181, across the frame ~f195
  planOut: [201, 214] as const, // "that'll be good": the thought fades, the real map remains
};
const V_RAIL = 2.1; // trains, world px / frame (~7.5 screen px / frame in the opening)
const V_ROAD = 1.45; // lorries (~5 screen px / frame)
const V_SHIP = 2.0; // freighters
const CUT_GAP = 9; // world px either side of a severed line (at least ~26 screen px in the wide)
const cutGap = (k: number) => Math.max(CUT_GAP, 26 / k);

// ---------------------------------------------------------------------------
// CAMERA: the south-west box (95.5-108 E x 16-30.5 N: Rangoon lower left,
// Chongqing top right, Haiphong right, a sliver of Hainan), a slow push through
// both cuts; then it pans with the dying road toward Chongqing and Japan's east
// (occupied China enters the frame as one connected region by the camera's
// move alone); then the pull-back to all of China.
// ---------------------------------------------------------------------------
const CAM_KEYS: CamKey[] = [
  { f: -60, x: 340, y: 1130, k: 3.32 },
  { f: 0, x: 337, y: 1125, k: 3.45 },
  { f: 50, x: 335, y: 1119, k: 3.57 },
  { f: 98, x: 340, y: 1108, k: 3.68 },
  // the push toward Chongqing keeps both breaks in frame (the bar from x ~60, Lao
  // Cai ~y 1030) and NATIONALISTS inside it; k peaks ~f138, x keeps drifting east
  { f: 134, x: 375, y: 1093, k: 3.75 },
  { f: 140, x: 380, y: 1090, k: 3.76 },
  { f: 156, x: 398, y: 1083, k: 3.2 },
  // the final frame: Burma, Chongqing, the occupied east and the coast (~92-122 E),
  // routes >= 16 px, both breaks clear of the caption bands
  { f: 198, x: 446, y: 1057, k: 1.95 },
  { f: 240, x: 450, y: 1054, k: 1.85 },
];
const DASH_K = 3.6; // route chequers fixed in world (no crawl in the zooms)
const K_REF = 3.6;

// ---------------------------------------------------------------------------
// THE AID FROM ABROAD: cream freighters sail in from the sea edge of the frame
// at constant speed, swing round alongside the quay at Rangoon / Haiphong, lie
// there while their cargo comes ashore as a convoy of four wagons, and sail out
// again. When the port is lost (Haiphong) or the road closed (Rangoon), ships
// still inbound turn round where they are and sail back out to sea.
// Lanes checked against the baked coastline (scratch seamap.py).
// ---------------------------------------------------------------------------
type Port = { A: P2; u: P2; n: P2; r: number; lin: number; apex: number; D: P2 };
const makePort = (A: P2, D: P2, r = 3.2): Port => {
  const dx = D[0] - A[0];
  const dy = D[1] - A[1];
  const l = Math.hypot(dx, dy);
  const u: P2 = [dx / l, dy / l];
  return { A, u, n: [-u[1], u[0]], r, lin: l - r, apex: l - r + (Math.PI * r) / 2, D };
};
const RANGOON = makePort([198, 1445], [213, 1226]);
const HAIPHONG = makePort([510, 1340], [441, 1160]);
/** a ship's position and heading at arclength sig on a lane that turns round at centreline distance a */
const shipPose = (p: Port, a: number, sig: number) => {
  const { A, u, n, r } = p;
  if (sig <= a) return { x: A[0] + u[0] * sig + n[0] * r, y: A[1] + u[1] * sig + n[1] * r, hx: u[0], hy: u[1] };
  const cx = A[0] + u[0] * a;
  const cy = A[1] + u[1] * a;
  if (sig <= a + Math.PI * r) {
    const ph = (sig - a) / r;
    return {
      x: cx + n[0] * r * Math.cos(ph) + u[0] * r * Math.sin(ph),
      y: cy + n[1] * r * Math.cos(ph) + u[1] * r * Math.sin(ph),
      hx: u[0] * Math.cos(ph) - n[0] * Math.sin(ph),
      hy: u[1] * Math.cos(ph) - n[1] * Math.sin(ph),
    };
  }
  const b = sig - a - Math.PI * r;
  return { x: cx - n[0] * r - u[0] * b, y: cy - n[1] * r - u[1] * b, hx: -u[0], hy: -u[1] };
};
const SHIP_DB = 8; // braking distance into the quay, world px
type Sailing = { td: number; dwell: number };
/** the ship of a sailing at frame f, or null when it is not on the lanes */
const shipAt = (p: Port, sl: Sailing, closed: number, f: number) => {
  const v = V_SHIP;
  const tb = (2 * SHIP_DB) / v;
  const sigAt = (t: number) => {
    if (t < sl.td - tb) return p.apex - SHIP_DB - v * (sl.td - tb - t);
    if (t < sl.td) return p.apex - SHIP_DB * ((sl.td - t) / tb) ** 2;
    const te = sl.td + sl.dwell;
    if (t < te) return p.apex;
    if (t < te + tb) return p.apex + SHIP_DB * ((t - te) / tb) ** 2;
    return p.apex + SHIP_DB + v * (t - te - tb);
  };
  let a = p.lin;
  let sig = sigAt(f);
  if (closed < sl.td - tb) {
    // still at sea when the port closed: it turns round where it is
    const sc = sigAt(closed);
    if (sc < 0) return null; // never sailed
    if (f > closed) {
      a = Math.max(0, sc);
      sig = sc + v * (f - closed);
    }
  }
  if (sig < 0 || sig > 2 * a + Math.PI * p.r) return null;
  return shipPose(p, a, sig);
};
// the sailings: one every 70 / 75 frames; Haiphong's last ship unloads ~f12-39,
// Rangoon's ~f60-98; the next ones are turned back
const RAIL_SAILINGS: Sailing[] = Array.from({ length: 10 }, (_, i) => ({ td: 12 + 70 * (i - 7), dwell: 27 }));
const ROAD_SAILINGS: Sailing[] = Array.from({ length: 10 }, (_, i) => ({ td: 60 + 75 * (i - 7), dwell: 38 }));

/** the freighter, top view, in world px (15 long), cream with dark casing; heading +x */
const Ship: React.FC<{ x: number; y: number; hx: number; hy: number; cam: Cam }> = ({ x, y, hx, hy, cam }) => {
  const L = 15;
  const B = 4.8;
  const k = cam.k;
  const a = (Math.atan2(hy, hx) * 180) / Math.PI;
  const hull = `M${L / 2},0 C${L / 2 - 1.2},${B * 0.45} ${L / 2 - 3.2},${B / 2} ${L / 2 - 4.6},${B / 2} L${-L / 2 + 0.9},${B / 2} Q${-L / 2},${B / 2} ${-L / 2},0 Q${-L / 2},${-B / 2} ${-L / 2 + 0.9},${-B / 2} L${L / 2 - 4.6},${-B / 2} C${L / 2 - 3.2},${-B / 2} ${L / 2 - 1.2},${-B * 0.45} ${L / 2},0 Z`;
  return (
    <g transform={`translate(${x} ${y}) rotate(${a})`}>
      <path d={hull} fill={INK} stroke={SHADOW} strokeWidth={2.6 / k} strokeLinejoin="round" />
      {/* the bridge aft, three hatches forward */}
      <rect x={-L / 2 + 1.1} y={-B * 0.3} width={2.3} height={B * 0.6} rx={0.3} fill={INK_DEEP_SHIP} stroke={SHADOW} strokeWidth={1.6 / k} />
      {[-1.8, 1.2, 4.2].map((hx0) => (
        <rect key={hx0} x={hx0 - 0.9} y={-B * 0.24} width={1.8} height={B * 0.48} fill="none" stroke={SHADOW} strokeWidth={1.4 / k} />
      ))}
    </g>
  );
};
const INK_DEEP_SHIP = "#C9BB97";

// ---------------------------------------------------------------------------
// PACKETS: convoy wagons at constant speed. Each docked ship puts four wagons
// ashore (14-15 world px apart); they run from the ship's side up the route.
// At the cut: wagons beyond the break brake to a stop when the stopping wave
// (from the break, `waveV`) reaches them and dim; wagons before it brake and
// pile up behind the break (qGap).
// ---------------------------------------------------------------------------
type Stream = {
  pts: P2[];
  len: number;
  v: number;
  em: number[]; // emission frames, ascending
  rank: number[]; // pile-up rank of each emission that is before the break at the cut
  cut: { s: number; f: number; g: number };
  waveV: number;
  decel: number;
  upDecel: number;
  qGap: number;
};
const brake = (s0: number, d: number, t: number, v: number) => {
  if (d <= 0) return s0;
  const D = (2 * d) / v;
  if (t >= D) return s0 + d;
  const u = t / D;
  return s0 + d * (1 - (1 - u) * (1 - u));
};
const makeStream = (
  route: { pts: P2[] },
  port: Port,
  sailings: Sailing[],
  v: number,
  spacing: number,
  lastEmit: number,
  cut: { s: number; f: number; g: number },
  waveV: number,
  upDecel: number,
  qGap: number,
): Stream => {
  const pts: P2[] = [port.D, ...route.pts];
  const len = cumOf(pts)[pts.length - 1];
  const dock = Math.hypot(route.pts[0][0] - port.D[0], route.pts[0][1] - port.D[1]);
  const em: number[] = [];
  for (const sl of sailings) for (let m = 0; m < 4; m++) em.push(sl.td + 3 + (m * spacing) / v);
  const ems = em.filter((t) => t <= lastEmit).sort((p, q) => p - q);
  const c = { ...cut, s: cut.s + dock };
  let r = 0;
  const rank = ems.map((te) => ((c.f - te) * v <= c.s ? r++ : -1));
  return { pts, len, v, em: ems, rank, cut: c, waveV, decel: 10, upDecel, qGap };
};
const streamAt = (st: Stream, f: number, dimTo: number): Packet[] => {
  const out: Packet[] = [];
  for (let i = 0; i < st.em.length; i++) {
    const te = st.em[i];
    if (te > f) break;
    let s = (f - te) * st.v;
    let dim = 0;
    if (f > st.cut.f) {
      const sc = (st.cut.f - te) * st.v; // where it was when the line broke
      if (sc > st.len) continue; // it had already arrived
      if (sc > st.cut.s) {
        // beyond: keeps going until the wave catches it, then brakes and dims
        const fStar = st.cut.f + (sc - st.cut.s) / (st.waveV - st.v);
        if (f <= fStar) s = sc + st.v * (f - st.cut.f);
        else {
          const sStar = sc + st.v * (fStar - st.cut.f);
          s = brake(sStar, (st.v * st.decel) / 2, f - fStar, st.v);
          dim = ramp(f, fStar, fStar + 9);
        }
      } else {
        // before: brake, pile up behind the break
        const slot = st.cut.s - st.cut.g - Math.max(0, st.rank[i]) * st.qGap;
        const target = Math.max(sc, Math.min(sc + (st.v * st.upDecel) / 2, slot));
        s = brake(sc, target - sc, f - st.cut.f, st.v);
      }
    }
    if (s < 0 || s > st.len) continue;
    const op = smoothstep(s / 6) * smoothstep((st.len - s) / 10) * (1 - (1 - dimTo) * dim);
    if (op <= 0.01) continue;
    out.push({ id: i, s, op, beyond: false });
  }
  return out;
};
const RAIL_WAVE = (YR.len - RAIL_CUT_S) / 10; // world px / frame: the rail dies to Kunming in 10 f
const ROAD_WAVE = (BURMA_ROAD.len - ROAD_CUT_S) / (T.roadArrive - T.roadCut);
const RAIL_STREAM = makeStream(YR, HAIPHONG, RAIL_SAILINGS, V_RAIL, 14, T.haiphongClosed, { s: RAIL_CUT_S, f: T.railCut, g: CUT_GAP + 4 }, RAIL_WAVE, 18, 14);
const ROAD_STREAM = makeStream(BR, RANGOON, ROAD_SAILINGS, V_ROAD, 15, T.roadCut, { s: ROUTE_CUT_S, f: T.roadCut, g: CUT_GAP + 5 }, ROAD_WAVE, 28, 15);
const RAIL_EXT = { pts: RAIL_STREAM.pts, len: RAIL_STREAM.len, stations: {} };
const ROAD_EXT = { pts: ROAD_STREAM.pts, len: ROAD_STREAM.len, stations: {} };

// ---------------------------------------------------------------------------
// HELD GROUND: the kit's Hatch (orange wash + octave-stable world hatch +
// dashed inland edge), with the edge's dashes in WORLD units so they do not
// strobe through the 4x pull-back; optional straight reveal front (Tonkin).
// ---------------------------------------------------------------------------
const EDGE_DASH = 7 / 2.6;
const EDGE_GAP = 5 / 2.6;
const HeldHatch: React.FC<{ region: Region; cam: Cam; id: string; reveal?: { from: P2; dir: P2; s: number } }> = ({
  region,
  cam,
  id,
  reveal,
}) => {
  const k = cam.k;
  let clipPoly: P2[] | null = null;
  let frontLine: P2[] | null = null;
  if (reveal) {
    const [ux, uy] = reveal.dir;
    const cx = reveal.from[0] + ux * reveal.s;
    const cy = reveal.from[1] + uy * reveal.s;
    const nx = -uy;
    const ny = ux;
    const B = 4000;
    clipPoly = [
      [cx + nx * B, cy + ny * B],
      [cx - nx * B, cy - ny * B],
      [cx - nx * B - ux * B, cy - ny * B - uy * B],
      [cx + nx * B - ux * B, cy + ny * B - uy * B],
    ];
    frontLine = [
      [cx + nx * B, cy + ny * B],
      [cx - nx * B, cy - ny * B],
    ];
  }
  const ew = Math.max(1.6, 2.4 * Math.pow(k / K_REF, 0.3));
  return (
    <g>
      <defs>
        <HatchPattern id={`${id}-pat`} cam={cam} spacing={10} width={2.1} />
        {clipPoly ? (
          <clipPath id={`${id}-rv`}>
            <path d={dOf(clipPoly, true)} />
          </clipPath>
        ) : null}
        {frontLine ? (
          <clipPath id={`${id}-in`}>
            <path d={region.d} clipRule="evenodd" />
          </clipPath>
        ) : null}
      </defs>
      <g clipPath={clipPoly ? `url(#${id}-rv)` : undefined}>
        <path d={region.d} fill={ACCENT_DEEP} fillOpacity={0.2} fillRule="evenodd" />
        <path d={region.d} fill={`url(#${id}-pat)`} fillRule="evenodd" opacity={0.7} />
        {region.edge ? (
          <path
            d={region.edge}
            fill="none"
            stroke={ACCENT}
            strokeWidth={ew / k}
            strokeDasharray={`${EDGE_DASH} ${EDGE_GAP}`}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}
      </g>
      {frontLine ? (
        <g clipPath={`url(#${id}-in)`}>
          <path d={dOf(frontLine)} fill="none" stroke={SHADOW} strokeOpacity={0.55} strokeWidth={5.5 / k} />
          <path d={dOf(frontLine)} fill="none" stroke={ACCENT} strokeWidth={3.2 / k} />
        </g>
      ) : null}
    </g>
  );
};

/** THE PLAN's hatch: sparse DASHED orange lines, no wash (hope, not holding).
 *  Octave-stable like the kit's (world tile 48 / 2^o, the in-between line
 *  fading in); the dashes (6 on, 6 off, world) divide every tile, so they
 *  stay put through the octaves. */
const PlanHatchPattern: React.FC<{ id: string; cam: Cam }> = ({ id, cam }) => {
  const L2 = Math.log2(cam.k);
  const o = Math.max(0, Math.min(2, Math.floor(L2)));
  const t = clamp01(L2 - o);
  const P = 48 / Math.pow(2, o);
  const sw = 2 / cam.k;
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width={P} height={P} patternTransform="rotate(45)">
      <line x1={0} y1={0} x2={0} y2={P} stroke={ACCENT} strokeWidth={sw} strokeDasharray="6 6" />
      <line x1={P / 2} y1={0} x2={P / 2} y2={P} stroke={ACCENT} strokeWidth={sw} strokeDasharray="6 6" strokeOpacity={t} />
      <line x1={P} y1={0} x2={P} y2={P} stroke={ACCENT} strokeWidth={sw} strokeDasharray="6 6" />
    </pattern>
  );
};

// ---------------------------------------------------------------------------
// ROUTE SYMBOLS (the kit's Route, heavier, drawn in pieces so the dying
// stretch can follow the wave): rail = the chequered symbol; road = a plain
// solid cased cream line, so the two read apart at phone size. They keep
// (and slightly gain) their screen weight as the camera pulls back, so the cut
// lifelines still read in the final wide.
// ---------------------------------------------------------------------------
const routePiece = (
  pts: P2[],
  a: number,
  b: number,
  kind: "rail" | "road",
  cam: Cam,
  op: number,
  key: string,
  tone = 0,
  extra = 0,
) => {
  if (b - a <= 0.05 || op <= 0.002) return null;
  const k = cam.k;
  const wk = Math.pow(K_REF / k, 0.5);
  const d = dOf(slicePts(pts, a, b));
  const ink = mixColor(INK, ACCENT, tone);
  if (kind === "rail") {
    const RW = (12 + extra) * wk;
    const core = RW - 4.6 * wk;
    const dash = 12 / DASH_K;
    return (
      <g key={key} fill="none" strokeLinejoin="round" opacity={op}>
        <path d={d} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={(RW + 4.5 * wk) / k} />
        <path d={d} stroke={ink} strokeWidth={RW / k} />
        <path d={d} stroke="#15120E" strokeWidth={core / k} />
        <path d={d} stroke={ink} strokeWidth={core / k} strokeDasharray={`${dash} ${dash}`} strokeDashoffset={a} />
      </g>
    );
  }
  const RW = (11.5 + extra) * wk;
  return (
    <g key={key} fill="none" strokeLinejoin="round" opacity={op}>
      <path d={d} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={(RW + 4.5 * wk) / k} />
      <path d={d} stroke={ink} strokeWidth={RW / k} />
    </g>
  );
};
/** a severed line: [0, cut - gap] live; beyond the break dims behind the stopping wave */
const cutPieces = (
  pts: P2[],
  len: number,
  kind: "rail" | "road",
  cam: Cam,
  f: number,
  cutS: number,
  fCut: number,
  openF: number,
  waveV: number,
  dimTo: number,
  key: string,
) => {
  const out: React.ReactNode[] = [];
  if (f <= fCut) {
    out.push(routePiece(pts, 0, len, kind, cam, 1, `${key}-all`));
    return out;
  }
  const g = cutGap(cam.k) * smoothstep((f - fCut) / openF);
  out.push(routePiece(pts, 0, cutS - g, kind, cam, 1, `${key}-a`));
  const sw = cutS + (f - fCut) * waveV; // the wave front
  const soft = waveV * 5; // the dimming settles over ~5 frames behind it
  const a0 = cutS + g;
  const s1 = Math.max(a0, Math.min(len, sw - soft));
  const s2 = Math.max(a0, Math.min(len, sw));
  out.push(routePiece(pts, a0, s1, kind, cam, dimTo, `${key}-d`));
  out.push(routePiece(pts, s1, s2, kind, cam, (1 + dimTo) / 2, `${key}-m`));
  out.push(routePiece(pts, s2, len, kind, cam, 1, `${key}-b`));
  return out;
};

// ---------------------------------------------------------------------------
const CutTheLifelines: React.FC<Props> = ({ nationalists, japanese }) => {
  const frame = useCurrentFrame();
  const cam = runCamera(CAM_KEYS, frame);
  const k = cam.k;
  const sk = (v: number, e = 0.3) => v * Math.pow(k / K_REF, e); // screen size easing with zoom
  // the dead stretches sit at 0.35, lifting to 0.5 in the wide so they still read
  const dimTo = 0.35 + 0.15 * ramp(frame, 150, 200);

  // -- Tonkin -----------------------------------------------------------------
  const tkS = TK_S(frame);
  const tkOn = tkS > TK_SMIN - 1;
  const tkDone = tkS >= TK_SMAX + 2;
  const seized = Math.min(railSeized(frame), RAIL_CUT_S - cutGap(k) * smoothstep((frame - T.railCut) / T.railOpen));
  const hpTone = smoothstep((tkS + 1) / 5);

  // -- the plan ---------------------------------------------------------------
  const lvl = planLevel(frame);
  const planOn = lvl > -2;
  const planDone = lvl >= PLAN_MAX + 5;
  const loops = planOn && !planDone ? contourLoops(lvl) : [];
  const planClipD = loops.map((l) => dOf(l, true)).join("");
  const frontOp = ramp(frame, T.plan, T.plan + 6);
  const planOp = 1 - ramp(frame, T.planOut[0], T.planOut[1]);

  // -- ships and packets ----------------------------------------------------------
  const ships = [
    ...RAIL_SAILINGS.map((sl) => shipAt(HAIPHONG, sl, T.haiphongClosed, frame)),
    ...ROAD_SAILINGS.map((sl) => shipAt(RANGOON, sl, T.roadCut, frame)),
  ].filter((q): q is NonNullable<typeof q> => q !== null);
  const railPk = streamAt(RAIL_STREAM, frame, dimTo);
  const roadPk = streamAt(ROAD_STREAM, frame, dimTo);
  const pkSize = sk(32, 0.55);

  // -- the closure bar ----------------------------------------------------------
  const gateU = 1 - Math.pow(1 - clamp01((frame - T.gate[0]) / (T.gate[1] - T.gate[0])), 2.2);
  const gateEnds: [P2, P2] = [
    [GATE.x + (GATE_P0[0] - GATE.x) * gateU, GATE.y + (GATE_P0[1] - GATE.y) * gateU],
    [GATE.x + (GATE_P1[0] - GATE.x) * gateU, GATE.y + (GATE_P1[1] - GATE.y) * gateU],
  ];
  const gateW = 11 * Math.pow(K_REF / k, 0.5);

  // -- Chongqing ----------------------------------------------------------------
  const ringR = sk(30, 0.22);

  // the thought never covers Chongqing: it flows round the cream ring and the
  // NATIONALISTS label (a cartographic knock-out, in world px for this camera)
  const LABEL_CAP = 36;
  const labelDy = -(ringR + 22);
  const labelW = 9.65 * (LABEL_CAP / 0.66);
  const ko = 14; // screen px of clearance
  const koRect = {
    x: CQ[0] - (labelW / 2 + ko) / k,
    y: CQ[1] + (labelDy - LABEL_CAP - ko) / k,
    w: (labelW + 2 * ko) / k,
    h: (LABEL_CAP + 2 * ko) / k,
  };
  const planDefs = (
    <>
      <PlanHatchPattern id="plan-pat" cam={cam} />
      <mask id="plan-ko" maskUnits="userSpaceOnUse" x={-400} y={200} width={1700} height={1500}>
        <rect x={-400} y={200} width={1700} height={1500} fill="#fff" />
        <circle cx={CQ[0]} cy={CQ[1]} r={(ringR + 3) / k} fill="#000" />
        {frame >= T.nationalists ? <rect x={koRect.x} y={koRect.y} width={koRect.w} height={koRect.h} rx={ko / k} fill="#000" /> : null}
      </mask>
      <clipPath id="free-in">
        <path d={FREE_CHINA.d} clipRule="evenodd" />
      </clipPath>
      {planOn && !planDone && planClipD ? (
        <clipPath id="plan-rv">
          <path d={planClipD} clipRule="evenodd" />
        </clipPath>
      ) : null}
    </>
  );

  return (
    <MapPage world="asia" cam={cam}>
      <WorldSvg cam={cam} defs={planDefs}>
        {/* Japan's empire and its conquests: solid orange in the world from frame 0 */}
        <HeldHatch region={JAPAN_1931} cam={cam} id="jp" />
        <HeldHatch region={MANCHUKUO} cam={cam} id="mk" />
        <HeldHatch region={OCCUPIED_1938} cam={cam} id="occ" />
        {/* Tonkin: one front out of the Gulf, up the Red River */}
        {tkOn ? (
          <HeldHatch
            region={INDOCHINA_NORTH}
            cam={cam}
            id="tk"
            reveal={tkDone ? undefined : { from: [HP.x, HP.y], dir: TK_DIR, s: tkS }}
          />
        ) : null}

        {/* the imagined conquest, a THOUGHT: an open dashed hatch behind a firm irregular
            ink front; it flows round Chongqing and fades out on "that'll be good" */}
        {planOn && planOp > 0.002 && (planDone || planClipD) ? (
          <g opacity={planOp} mask="url(#plan-ko)">
            <g clipPath={planDone ? undefined : "url(#plan-rv)"}>
              <path d={FREE_CHINA.d} fill="url(#plan-pat)" fillRule="evenodd" opacity={0.85} />
            </g>
            {!planDone ? (
              <g clipPath="url(#free-in)" opacity={frontOp} fill="none" strokeLinejoin="round" strokeLinecap="round">
                <path d={planClipD} stroke={SHADOW} strokeOpacity={0.6} strokeWidth={sk(6.5, 0.3) / k} />
                <path d={planClipD} stroke={ACCENT} strokeWidth={sk(3.4, 0.3) / k} />
              </g>
            ) : null}
          </g>
        ) : null}

        {/* the Burma route: rail Rangoon -> Lashio (live to the end), road Lashio -> Chongqing */}
        {routePiece(BURMA_RAIL.pts, 0, BURMA_RAIL.len, "rail", cam, 1, "brail")}
        {cutPieces(BURMA_ROAD.pts, BURMA_ROAD.len, "road", cam, frame, ROAD_CUT_S, T.roadCut, T.roadOpen, ROAD_WAVE, dimTo, "broad")}
        {/* the Yunnan railway; the seized stretch in Japan's orange */}
        {cutPieces(YR.pts, YR.len, "rail", cam, frame, RAIL_CUT_S, T.railCut, T.railOpen, RAIL_WAVE, dimTo, "yr")}
        {seized > 0.2 ? routePiece(YR.pts, 0, seized, "rail", cam, 1, "yr-j", 1, 1.5) : null}

        {/* the convoys, then the ships whose cargo they are (the wagons start under the hull) */}
        <Packets route={RAIL_EXT} packets={railPk} cam={cam} size={pkSize} />
        <Packets route={ROAD_EXT} packets={roadPk} cam={cam} size={pkSize} />
        {ships.map((s, i) => (
          <Ship key={`ship-${i}`} x={s.x} y={s.y} hx={s.hx} hy={s.hy} cam={cam} />
        ))}

        {/* the closure Japan forced: a dashed orange bar grows out of the road across it
            (the reference's cut tick), each half's dashes anchored on the road */}
        {gateU > 0.002
          ? gateEnds.map((end, i) => (
              <g key={`gate-${i}`} fill="none" strokeLinecap="butt">
                <path d={dOf([[GATE.x, GATE.y], end])} stroke={SHADOW} strokeOpacity={0.65} strokeWidth={(gateW + 4.5) / k} strokeDasharray="6.5 3.2" strokeDashoffset={3.25} />
                <path d={dOf([[GATE.x, GATE.y], end])} stroke={ACCENT} strokeWidth={gateW / k} strokeDasharray="6.5 3.2" strokeDashoffset={3.25} />
              </g>
            ))
          : null}

        {/* the places on the routes: the two ports, the junction */}
        <CityDot x={BR.pts[0][0]} y={BR.pts[0][1]} cam={cam} r={sk(8.5)} />
        <CityDot x={HP.x} y={HP.y} cam={cam} r={sk(8.5)} color={mixColor(INK, ACCENT, hpTone)} />
        <CityDot x={PLACES.kunming[0]} y={PLACES.kunming[1]} cam={cam} r={sk(8.5)} />

        {/* Chongqing: the Nationalists' capital, ringed; a dark well keeps it clear of any hatch */}
        <circle cx={CQ[0]} cy={CQ[1]} r={ringR / k} fill={SHADOW} fillOpacity={0.55} stroke={SHADOW} strokeOpacity={0.7} strokeWidth={7.5 / k} />
        <circle cx={CQ[0]} cy={CQ[1]} r={ringR / k} fill="none" stroke={INK} strokeWidth={4 / k} />
        <CityDot x={CQ[0]} y={CQ[1]} cam={cam} r={sk(9)} />
        <Label x={CQ[0]} y={CQ[1]} text={nationalists} appear={T.nationalists} frame={frame} cam={cam} cap={LABEL_CAP} dy={labelDy} />
        <Label x={JP_LABEL[0]} y={JP_LABEL[1]} text={japanese} appear={T.japanese} frame={frame} cam={cam} cap={34} color={ACCENT} anchor="start" />
      </WorldSvg>
    </MapPage>
  );
};

export default CutTheLifelines;
