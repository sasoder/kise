// ---------------------------------------------------------------------------
// cutTheLifelinesPlanV2: the camera track and JAPAN'S BET (the planned conquest
// closing in on Chongqing) for CutTheLifelinesV2. Pure data + maths (no JSX) so
// the scratch probes can check the caption bands and the plan's growth.
//
// THE BET as a field over free China: T = D_src / (D_src + D_cq), where D_src is
// the distance to the places Japan pushes from (the inland edge of occupied
// China and Manchukuo, the inland edge of Tonkin, the two cut points) and D_cq
// the distance to Chongqing. T = 0 on Japan's front, 1 at Chongqing; its level
// sets are loops that tighten round the city. The plan covers {T <= level}
// with level rising monotonically and stopping short of the city: it closes in,
// never covers it, and never draws back.
// ---------------------------------------------------------------------------
import { pchip, type CamKey, type P2 } from "./pearlShared";
import { CANTON, INDOCHINA_NORTH, MANCHUKUO, OCCUPIED_1938, PLACES } from "./pearlAsiaMapData";

export const nums = (d: string): P2[] => {
  const out: P2[] = [];
  const re = /(-?\d+\.?\d*),(-?\d+\.?\d*)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(d))) out.push([+m[1], +m[2]]);
  return out;
};

// ---------------------------------------------------------------------------
// CAMERA. Caption bands: Hainan's south tip (y 1208.6) and Rangoon (y 1212.6)
// stay above screen y ~1075 on every frame (cy >= 1212.6 - 115 / k), so the
// Tonkin fill, Hainan, Haiphong and Rangoon never enter y 1080-1250 / 1360-1460;
// Chongqing's label stays inside the top (cy <= 966.4 + 810 / k).
// f0-95 a steady push on the south-west while the aid runs and both lines are
// cut; f100-140 a drift east up the dying road as NATIONALISTS lands; f145-192
// the pull-back that brings Japan's real front in as the bet closes in; f192-229
// a slow living push on the ringed city.
// ---------------------------------------------------------------------------
const cyFor = (k: number, margin = 5) => 1212.6 - 115 / k + margin;
const key = (f: number, x: number, k: number, margin = 5): CamKey => ({ f, x, y: cyFor(k, margin), k });
// r2: a stronger push from f0; Chongqing brought in from the right edge before
// NATIONALISTS lands (label fully in frame); the pull-back follows the slow drain
// up the road and settles ~f182, then the push runs on to the last frame.
export const CAM_KEYS_V2: CamKey[] = [
  key(-60, 338, 2.6),
  key(0, 344, 2.95),
  key(40, 351, 3.38),
  key(98, 360, 3.6),
  // r4: a gentle ease-out with the drain up the road so NATIONALISTS (upper-left of
  // the city, clear of the ring) is in frame on its word ...
  key(118, 364, 3.08),
  key(143, 372, 2.9),
  // ... then ONE zoom-out from "And" (143), done by ~160 (near-pure zoom: Japan's held
  // east is revealed by the widening frame); the ring lands on 167 in a calm frame;
  // the plan sweeps from 182; a slow push runs on to the cut, ~12% tighter than r3
  key(156, 372, 2.06),
  key(240, 374, 2.3),
];

/** start each loop at its point nearest the ray east of Chongqing, so dashes along
 *  the moving contour keep a stable phase (a slow crawl, never a flicker) */
export const anchorLoop = (loop: P2[], c: P2): P2[] => {
  let best = 0;
  let bs = Infinity;
  for (let i = 0; i < loop.length; i++) {
    const dx = loop[i][0] - c[0];
    const dy = loop[i][1] - c[1];
    const s = Math.abs(Math.atan2(dy, dx)) * 1000 + Math.hypot(dx, dy) * 0.01;
    if (s < bs) {
      bs = s;
      best = i;
    }
  }
  return [...loop.slice(best), ...loop.slice(0, best)];
};

// ---------------------------------------------------------------------------
// THE BET
// ---------------------------------------------------------------------------
const CQ = PLACES.chongqing;
export const GX0 = -100;
export const GY0 = 470;
export const GS = 4.5;
export const GNX = Math.ceil((800 - GX0) / GS) + 1;
export const GNY = Math.ceil((1220 - GY0) / GS) + 1;

/** where the planned conquest starts: Japan's real front and the two cut points */
export const planSources = (extra: P2[]): P2[] => {
  const cb = CANTON.box;
  const inCanton = ([x, y]: P2) => x > cb[0] - 6 && x < cb[2] + 6 && y > cb[1] - 6 && y < cb[3] + 6;
  const raw = [
    ...nums(OCCUPIED_1938.edge ?? ""),
    ...nums(MANCHUKUO.edge ?? ""),
    ...nums(INDOCHINA_NORTH.edge ?? ""),
  ].filter((p) => !inCanton(p));
  const out: P2[] = [];
  for (const p of raw) {
    const q = out[out.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) >= 2.5) out.push(p);
  }
  return [...out, ...extra];
};

const wobble = (x: number, y: number) =>
  Math.sin(x / 83 + 1.3) * Math.cos(y / 71 - 0.4) + 0.5 * Math.sin((0.6 * x - 0.8 * y) / 52 + 2.2);
const WOBBLE = 0.022;

export const makePlanField = (sources: P2[]) => {
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
      for (const [sx, sy] of sources) {
        const dx = sx - x;
        const dy = sy - y;
        const q = dx * dx + dy * dy;
        if (q < d2) d2 = q;
      }
      const ds = Math.sqrt(d2);
      const dc = Math.hypot(x - CQ[0], y - CQ[1]);
      // the wobble fades near the city so the last loop is a clean ring
      t[j * GNX + i] = ds / (ds + dc + 1e-6) + WOBBLE * wobble(x, y) * Math.min(1, dc / 60);
    }
  return t;
};

export const fieldAtOf = (F: Float32Array) => (x: number, y: number) => {
  const fi = (x - GX0) / GS;
  const fj = (y - GY0) / GS;
  const i = Math.max(0, Math.min(GNX - 2, Math.floor(fi)));
  const j = Math.max(0, Math.min(GNY - 2, Math.floor(fj)));
  const u = fi - i;
  const v = fj - j;
  return (
    F[j * GNX + i] * (1 - u) * (1 - v) + F[j * GNX + i + 1] * u * (1 - v) + F[(j + 1) * GNX + i] * (1 - u) * v + F[(j + 1) * GNX + i + 1] * u * v
  );
};

/** marching squares: the closed loops of the field's contour at `level` */
export const contourLoopsOf = (F: Float32Array, level: number): P2[][] => {
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
  const pos = (k: number): P2 => {
    if (k < N) {
      const i = k % GNX;
      const j = (k - i) / GNX;
      const a = F[k];
      const b = F[k + 1];
      const t = (level - a) / (b - a);
      return [GX0 + (i + t) * GS, GY0 + j * GS];
    }
    const kk = k - N;
    const i = kk % GNX;
    const j = (kk - i) / GNX;
    const a = F[kk];
    const b = F[kk + GNX];
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

/** the bet's level per frame (r2): grows from "take" (182; starts f178 so it is
 *  moving on the word), sweeps "over China" (187-200), closes toward the city by
 *  ~f206 and keeps creeping to the last frame without ever covering the city */
export const PLAN_START = 178;
export const planLevelOf = (lEnd: number, lHold: number) => {
  const L = pchip([
    [PLAN_START, 0],
    [184, 0.1],
    [206, lEnd],
    [229, lHold],
  ]);
  return (f: number) => (f <= PLAN_START ? 0 : Math.min(lHold, L(f)));
};
