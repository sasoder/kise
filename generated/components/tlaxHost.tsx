// ---------------------------------------------------------------------------
// tlaxHost: THE ALLIED HOST (builder H), shared by FlockingToHisBanner (cut D)
// and HalfOfOnePercent (cut E) of "Sheppard_Tlaxcalans_thought_they_used_Cortes"
// (Dwarkesh map style, the Tlaxcala world: tlaxShared). Pure maths, the Banner
// glyph, the shared camera runner and the map with the host level.
//
// THE COUNT (SP/FACTS.md, H): 1 dot = 10 men. 900 Spaniards in a force of
// 180,000 = exactly 1 : 200 ("maybe one half of one percent"): N_SPANISH 90
// cream dots (Cortes's own review at Texcoco, Third Letter, 28 Apr 1521: 86
// horse, 118 crossbowmen and arquebusiers, "setecientos y tantos" foot) and
// N_ALLIES 17,910 orange dots (drawn 179,100 allies; Cortes's own figures give
// 75,000+ in the three siege divisions alone, the upper estimates ~200,000).
// Index i < N_SPANISH is a Spaniard, the rest are allies; the same index is the
// same dot in every layout and both cuts.
//
// THE HOST (end state): 18,000 blue-noise slots (best candidate + relaxation)
// inside an organic star-shaped outline round HEART (the banner's foot), the
// density easing to a ragged feathered edge with a few stragglers; on land east
// of Lake Texcoco (>= SHORE_KEEP off LAKE_SMOOTH, the 1519 shore the valley
// levels draw), never on the lake or over Tenochtitlan. Its size is a map-symbol
// convention: E's whole-force framing shows every dot with the host ~70 % of
// the frame width, which fixes it at ~21 world px (~55 km). HEART = [67.0,
// 861.5]: 10 km east of Texcoco, in Acolhua land, >= 2 world px outside
// Tlaxcala's enclave (asserted), the nearest point to Texcoco from which the
// host's body loses <= 16 % of its area to the lake (SP/h/heart_search.ts); the
// lake's lobe at Texcoco bites into the host's west side. The 90 Spaniards are
// the 90 slots nearest the heart, packed looser (CORE_DENSITY within CORE_R) so
// their body is ~120 px across with daylight between the dots at k 80.
//
// THE COLUMNS. One marching column per polity with weight > 0 in P's
// POLITIES (tlaxProvinces): its dots = weight x N_ALLIES (largest remainder);
// its road = P's land route, followed until R_JOIN world px from the heart,
// then bent into it (a polity whose head town lies in the host's footprint, the
// Acolhua, the Chalca, sets out from the rest of its own cell). A column is a
// compact crowd at the host's own packing (columnCrowd: blue noise in a strip
// 1.05-1.55 world px wide, ~32-47 px at k 30, even across its middle, feathered
// at the edges, a rounded head, a thinning tail, gentle density pulses), as long
// as its count packs into, moving as one body along its road at a steady pace:
// V_COLUMN, V_COLUMN_FAR for the far roads, or (the Acolhua, Tlaxcala) the pace
// that lets D's pair framing see them coming. ARRIVE_G times the heads in
// distance order: the Acolhua and Tlaxcala reach the Spaniards on "flocking"
// (D f171); Chalco, Tepeaca, Huexotzinco, Cholula, the lake towns and Huaxtepec
// within D; Cuauhnahuac, Toluca, Malinalco and the Totonac coast are still on the
// road when D ends and arrive in E (all in place by E f66). A column ends where
// it enters the host: each dot keeps its column's pace until it is just outside
// its slot's ring, then turns into its slot on its own Hermite arc (round the
// heart in polar coordinates, or straight in where that would cross the lake;
// <= V_ARC_MAX, <= T_ARC_MAX frames; C1 from the column, at rest in the slot).
// No dot ever stands on the lake (the signed shore field pushes a stray back).
// Slots are assigned backwards in time from the outside in (FILL): the last to
// arrive take the outermost slots facing their way in, each column fills the
// sector facing its road from the inside out, and the host grows round the
// Spaniards as one feathered body.
// THE MARCH (cut D): the 90 leave Tlaxcala on D f1 as a short column on P's
// Tlaxcala - Texcoco road (4 files), brisk over the sierra, walking near the
// banner (marchSpeed), and ease into their slots, farthest first.
//
// API
//   N_HOST N_SPANISH N_ALLIES MEN_PER_DOT; HEART; TEXCOCO; HOST_BOX
//   SLOT_X / SLOT_Y (dot i's slot); boundaryR(theta); polarOf / fromPolar;
//   shoreDist(x, y); STREAMS (the columns: path, pace, t0, L, o, l); ARRIVE_G;
//   V_COLUMN / V_COLUMN_FAR; FIRST_ARRIVAL_G / HOST_COMPLETE_G / SPANISH_SETTLED_G
//   placeDot(i, G, k, out) -> opacity (dot i at clip clock G, world px)
//   hostAt(G, k) -> { spanish, allies: { xy, n, op }[] (binned by OP_BINS) }
//   dotScreenR(k) (>= 1.25 px; world-sized 0.05 k from k 25), dotCasing(r)
//   <Banner x y cam size progress opacity? /> the engraved Spanish standard
//   makeMoveCamera(anchor, start, moves, creeps, makeTrack) -> (f) => Cam;
//     screenPt(p, cam)
//   <HostMapStack cam /> tlaxShared's MapStack + the HOST LEVEL (k 48-52 band,
//     sharp to k ~95; scripts/bake-tlax-host-rasters.mjs -> public/tlax-host,
//     tlaxHostLevels.ts); hostLevelWeight(cam)
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { LEVELS as HOST_LEVELS } from "./tlaxHostLevels";
import { POLITIES, PROVINCES } from "./tlaxProvinces";
import {
  DARK,
  FRAME_H,
  FRAME_W,
  INK,
  INK_FULL,
  LAKE_SMOOTH,
  MapStack,
  camTransform,
  viewRect,
  SITES_T,
  TLAX_RING,
  clamp01,
  landAt,
  smoothstep,
  type Cam,
  type P2,
} from "./tlaxShared";

// ---------------------------------------------------------------------------
// counts
// ---------------------------------------------------------------------------
export const MEN_PER_DOT = 10;
export const N_SPANISH = 90;
export const N_HOST = 18000;
export const N_ALLIES = N_HOST - N_SPANISH; // 17,910

// ---------------------------------------------------------------------------
// small helpers
// ---------------------------------------------------------------------------
/** integer hash -> [0, 1) (deterministic, fast; vastArmyMotion's) */
export const ih = (a: number, b: number, c = 0) => {
  let h = Math.imul(a | 0, 0x27d4eb2d) ^ Math.imul((b | 0) + 0x632be5ab, 0x165667b1) ^ Math.imul((c | 0) + 0x5bd1e995, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
/** smooth value noise in [0, 1] on a unit lattice */
const vnoise = (x: number, y: number, seed: number) => {
  const i = Math.floor(x);
  const j = Math.floor(y);
  const u = x - i;
  const v = y - j;
  const su = u * u * (3 - 2 * u);
  const sv = v * v * (3 - 2 * v);
  const a = ih(i, j, seed);
  const b = ih(i + 1, j, seed);
  const c = ih(i, j + 1, seed);
  const d = ih(i + 1, j + 1, seed);
  return (a + (b - a) * su) * (1 - sv) + (c + (d - c) * su) * sv;
};
/** periodic noise on the circle (theta in radians), [0, 1] */
const cnoise = (th: number, freq: number, seed: number) => vnoise(Math.cos(th) * freq + 17, Math.sin(th) * freq + 31, seed);
const TAU = Math.PI * 2;
const wrapPi = (a: number) => {
  let x = a % TAU;
  if (x > Math.PI) x -= TAU;
  if (x < -Math.PI) x += TAU;
  return x;
};
/** cubic Hermite on [0, 1] with end slopes m0, m1 (per unit u) */
const herm = (p0: number, p1: number, m0: number, m1: number, u: number) => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * m1;
};

// ---------------------------------------------------------------------------
// WATER round the host: Lake Texcoco (1519; the world's SMOOTHED ring, the one
// the valley levels draw) as a raster (scanline, even-odd) and the exact
// distance from every cell to the shore (Felzenszwalb), as toTheCoastMotion does
// ---------------------------------------------------------------------------
const LAKE = LAKE_SMOOTH as P2[];
const WF = { x0: 40, y0: 836, s: 10, w: 620, h: 500 }; // x 40..102, y 836..886 at 10 cells / world px
const LAKE_CELLS = (() => {
  const out = new Uint8Array(WF.w * WF.h);
  for (let j = 0; j < WF.h; j++) {
    const y = WF.y0 + (j + 0.5) / WF.s;
    const xs: number[] = [];
    for (let i = 0, k = LAKE.length - 1; i < LAKE.length; k = i++) {
      const [xi, yi] = LAKE[i];
      const [xk, yk] = LAKE[k];
      if (yi > y !== yk > y) xs.push(xi + ((y - yi) * (xk - xi)) / (yk - yi));
    }
    xs.sort((a, b) => a - b);
    for (let q = 0; q + 1 < xs.length; q += 2) {
      const i0 = Math.max(0, Math.ceil((xs[q] - WF.x0) * WF.s - 0.5));
      const i1 = Math.min(WF.w - 1, Math.floor((xs[q + 1] - WF.x0) * WF.s - 0.5));
      for (let i = i0; i <= i1; i++) out[j * WF.w + i] = 1;
    }
  }
  return out;
})();
/** distance (world px) from each cell to the nearest cell where `isTarget` holds */
const edtField = (isTarget: (q: number) => boolean) => {
  const BIG = 1e12;
  const g = new Float64Array(WF.w * WF.h);
  for (let q = 0; q < g.length; q++) g[q] = isTarget(q) ? 0 : BIG;
  const edt1 = (f: Float64Array, n: number) => {
    const d = new Float64Array(n);
    const v = new Int32Array(n);
    const z = new Float64Array(n + 1);
    let k = 0;
    v[0] = 0;
    z[0] = -Infinity;
    z[1] = Infinity;
    for (let q = 1; q < n; q++) {
      let sct = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      while (sct <= z[k]) {
        k--;
        sct = (f[q] + q * q - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
      }
      k++;
      v[k] = q;
      z[k] = sct;
      z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
      while (z[k + 1] < q) k++;
      d[q] = (q - v[k]) * (q - v[k]) + f[v[k]];
    }
    return d;
  };
  const col = new Float64Array(WF.h);
  for (let i = 0; i < WF.w; i++) {
    for (let j = 0; j < WF.h; j++) col[j] = g[j * WF.w + i];
    const d = edt1(col, WF.h);
    for (let j = 0; j < WF.h; j++) g[j * WF.w + i] = d[j];
  }
  const row = new Float64Array(WF.w);
  const dist = new Float32Array(WF.w * WF.h);
  for (let j = 0; j < WF.h; j++) {
    for (let i = 0; i < WF.w; i++) row[i] = g[j * WF.w + i];
    const d = edt1(row, WF.w);
    for (let i = 0; i < WF.w; i++) dist[j * WF.w + i] = Math.min(60, Math.max(0, Math.sqrt(d[i]) - 0.5) / WF.s);
  }
  return dist;
};
const SHORE_DIST = edtField((q) => LAKE_CELLS[q] === 1);
/** inside the lake: the distance to land */
const WATER_DEPTH = edtField((q) => LAKE_CELLS[q] === 0);
/** signed: + on land (to the shore), - in the lake (to land) */
const signedShore = (x: number, y: number) => {
  const fx = (x - WF.x0) * WF.s - 0.5;
  const fy = (y - WF.y0) * WF.s - 0.5;
  if (fx < 0 || fy < 0 || fx >= WF.w - 1 || fy >= WF.h - 1) return 60;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const u = fx - i;
  const v = fy - j;
  const at = (q: number) => SHORE_DIST[q] - WATER_DEPTH[q];
  const q0 = j * WF.w + i;
  return (at(q0) * (1 - u) + at(q0 + 1) * u) * (1 - v) + (at(q0 + WF.w) * (1 - u) + at(q0 + WF.w + 1) * u) * v;
};
/** distance (world px) from a point to Lake Texcoco's 1519 shore (0 on the lake; 60 outside the raster) */
export const shoreDist = (x: number, y: number) => {
  const fx = (x - WF.x0) * WF.s - 0.5;
  const fy = (y - WF.y0) * WF.s - 0.5;
  if (fx < 0 || fy < 0 || fx >= WF.w - 1 || fy >= WF.h - 1) return 60;
  const i = Math.floor(fx);
  const j = Math.floor(fy);
  const u = fx - i;
  const v = fy - j;
  const d = SHORE_DIST;
  const a = d[j * WF.w + i];
  const b = d[j * WF.w + i + 1];
  const c = d[(j + 1) * WF.w + i];
  const e = d[(j + 1) * WF.w + i + 1];
  return (a * (1 - u) + b * u) * (1 - v) + (c * (1 - u) + e * u) * v;
};

// ---------------------------------------------------------------------------
// THE HOST'S PLACE AND OUTLINE
// ---------------------------------------------------------------------------
/** Texcoco (the world's SITES_T.texcoco, 19.513 N 98.882 W): Cortes's base from 31 Dec 1520 */
export const TEXCOCO: P2 = [SITES_T.texcoco.x, SITES_T.texcoco.y];
/** the host's E-W and N-S half-extents (world px) of its base ellipse */
export const HOST_A = 10.5;
export const HOST_B = 8.6;
/** the host keeps this far off the lake (world px) */
export const SHORE_KEEP = 0.45;
/** a moving dot never comes nearer the lake than this (world px) */
const WET = SHORE_KEEP / 2;
/** the heart (the banner's foot and the Spaniards' body): the point nearest
 *  Texcoco (grid search, SP/h/heart_search.ts) from which the host's base
 *  ellipse loses <= 16 % of its area to the lake and the banner stands >= 2
 *  world px outside Tlaxcala's enclave (W's TLAX_RING): 10 km east of Texcoco,
 *  in Acolhua land; the lake's lobe at Texcoco bites into the host's west side */
export const HEART: P2 = [67.0, 861.5];
{
  const ring = TLAX_RING as P2[];
  let inside = false;
  let dEnc = Infinity;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > HEART[1] !== yj > HEART[1] && HEART[0] < ((xj - xi) * (HEART[1] - yi)) / (yj - yi) + xi) inside = !inside;
    dEnc = Math.min(dEnc, Math.hypot(xi - HEART[0], yi - HEART[1]));
  }
  if (inside || dEnc < 2) throw new Error(`tlaxHost: the heart must stand >= 2 world px outside Tlaxcala (inside ${inside}, ${dEnc.toFixed(2)})`);
  if (shoreDist(HEART[0], HEART[1]) < 3) throw new Error("tlaxHost: the heart is too near the lake");
}
export const HEART_EAST_OF_TEXCOCO_KM = (HEART[0] - TEXCOCO[0]) / 0.38322;
/** the outline's radius from the heart in direction theta (world px): the
 *  base ellipse with low harmonics, cut back where the lake comes near */
const harmR = (th: number) => {
  const c = Math.cos(th);
  const s = Math.sin(th);
  const e = 1 / Math.sqrt((c * c) / (HOST_A * HOST_A) + (s * s) / (HOST_B * HOST_B));
  return e * (1 + 0.045 * Math.sin(2 * th + 0.9) + 0.04 * Math.sin(3 * th + 2.1) + 0.022 * Math.sin(5 * th + 4.0) + 0.012 * Math.sin(7 * th + 1.3));
};
const N_TH = 720;
const RB_TAB = (() => {
  const out = new Float64Array(N_TH + 1);
  for (let q = 0; q <= N_TH; q++) {
    const th = (q / N_TH) * TAU;
    const h = harmR(th);
    // walk out from the heart: stop SHORE_KEEP + a feather margin short of the lake
    let r = 0;
    const step = 0.05;
    const reach = h * 1.18;
    while (r < reach) {
      const x = HEART[0] + Math.cos(th) * r;
      const y = HEART[1] + Math.sin(th) * r;
      if (shoreDist(x, y) < SHORE_KEEP) break;
      r += step;
    }
    out[q] = Math.min(h, r / 1.12); // the feathered edge reaches ~1.12 R: keep it off the lake too
  }
  // smooth round the circle so a cut-back never steps
  const sm = new Float64Array(N_TH + 1);
  const sig = 6;
  for (let q = 0; q < N_TH; q++) {
    let a = 0;
    let w = 0;
    for (let j = -3 * sig; j <= 3 * sig; j++) {
      const g = Math.exp(-(j * j) / (2 * sig * sig));
      a += out[(((q + j) % N_TH) + N_TH) % N_TH] * g;
      w += g;
    }
    sm[q] = Math.min(out[q], a / w);
  }
  sm[N_TH] = sm[0];
  return sm;
})();
/** the outline's radius about HEART in direction theta (world px) */
export const boundaryR = (th: number) => {
  const t = ((((th / TAU) * N_TH) % N_TH) + N_TH) % N_TH;
  const i = Math.floor(t);
  const u = t - i;
  return RB_TAB[i] + (RB_TAB[i + 1] - RB_TAB[i]) * u;
};
/** the outline the arcs round the heart are measured against: boundaryR
 *  smoothed over ~10 deg, so a dot sliding past the lake's bite never jumps */
const ARC_TAB = (() => {
  const out = new Float64Array(N_TH + 1);
  const sig = 20;
  for (let q = 0; q < N_TH; q++) {
    let a = 0;
    let w = 0;
    for (let j = -3 * sig; j <= 3 * sig; j++) {
      const g = Math.exp(-(j * j) / (2 * sig * sig));
      a += RB_TAB[(((q + j) % N_TH) + N_TH) % N_TH] * g;
      w += g;
    }
    out[q] = a / w;
  }
  out[N_TH] = out[0];
  return out;
})();
const arcR = (th: number) => {
  const t = ((((th / TAU) * N_TH) % N_TH) + N_TH) % N_TH;
  const i = Math.floor(t);
  const u = t - i;
  return ARC_TAB[i] + (ARC_TAB[i + 1] - ARC_TAB[i]) * u;
};
const arcPolarOf = (x: number, y: number): [number, number] => {
  const th = Math.atan2(y - HEART[1], x - HEART[0]);
  return [Math.hypot(x - HEART[0], y - HEART[1]) / arcR(th), th];
};
const arcFromPolar = (rho: number, th: number): P2 => {
  const r = rho * arcR(th);
  return [HEART[0] + Math.cos(th) * r, HEART[1] + Math.sin(th) * r];
};
/** normalised polar coordinates about the heart: rho = r / boundaryR(theta) */
export const polarOf = (x: number, y: number): [number, number] => {
  const th = Math.atan2(y - HEART[1], x - HEART[0]);
  return [Math.hypot(x - HEART[0], y - HEART[1]) / boundaryR(th), th];
};
export const fromPolar = (rho: number, th: number): P2 => {
  const r = rho * boundaryR(th);
  return [HEART[0] + Math.cos(th) * r, HEART[1] + Math.sin(th) * r];
};
/** the density of the host at normalised radius rho, direction th: even in the
 *  body, easing to nothing across a ragged feathered edge (0.80 .. ~1.14) */
/** the Spaniards' body round the heart is packed looser (CORE_DENSITY within
 *  CORE_R world px), so the 90 stand apart: a body >= 120 px across, its dots
 *  with daylight between them, at the close framings (k ~80) */
const CORE_R = 0.72;
const CORE_DENSITY = 0.58;
const hostDensity = (rho: number, th: number) => {
  const r = rho * boundaryR(th);
  const core = CORE_DENSITY + (1 - CORE_DENSITY) * smoothstep((r - CORE_R) / 0.3);
  const rag = 1 + 0.07 * (cnoise(th, 3.1, 91) - 0.5) + 0.05 * (cnoise(th, 9.7, 92) - 0.5);
  const q = rho / rag;
  if (q < 0.8) return core;
  return core * Math.pow(1 - smoothstep((q - 0.8) / 0.34), 1.25);
};
export const HOST_BOX = (() => {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (let q = 0; q < N_TH; q++) {
    const p = fromPolar(1.16, (q / N_TH) * TAU);
    x0 = Math.min(x0, p[0]);
    x1 = Math.max(x1, p[0]);
    y0 = Math.min(y0, p[1]);
    y1 = Math.max(y1, p[1]);
  }
  return { x0, x1, y0, y1 };
})();

// ---------------------------------------------------------------------------
// THE SLOTS: N_HOST blue-noise points at the host density (Mitchell's best
// candidate with a local spacing s0 / sqrt(density), then relaxation)
// ---------------------------------------------------------------------------
const RAW = (() => {
  const n = N_HOST;
  // the mean density -> the body's spacing s0 (hex packing)
  let mass = 0;
  const G = 0.05;
  for (let y = HOST_BOX.y0; y < HOST_BOX.y1; y += G)
    for (let x = HOST_BOX.x0; x < HOST_BOX.x1; x += G) {
      const [rho, th] = polarOf(x, y);
      mass += hostDensity(rho, th) * G * G;
    }
  const s0 = Math.sqrt(mass / (n * 0.866));
  const spacing = (x: number, y: number) => {
    const [rho, th] = polarOf(x, y);
    return s0 / Math.sqrt(Math.max(0.12, hostDensity(rho, th)));
  };
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const CELL = s0 * 1.5;
  const key = (a: number, b: number) => (a + 4096) * 8192 + (b + 4096);
  let grid = new Map<number, number[]>();
  const insert = (i: number) => {
    const k2 = key(Math.floor(xs[i] / CELL), Math.floor(ys[i] / CELL));
    const g = grid.get(k2);
    if (g) g.push(i);
    else grid.set(k2, [i]);
  };
  const nearest = (x: number, y: number, cap: number) => {
    const gx = Math.floor(x / CELL);
    const gy = Math.floor(y / CELL);
    const R = Math.ceil(cap / CELL);
    let best = cap;
    for (let a = gx - R; a <= gx + R; a++)
      for (let b = gy - R; b <= gy + R; b++) {
        const g = grid.get(key(a, b));
        if (!g) continue;
        for (const j of g) {
          const d = Math.hypot(xs[j] - x, ys[j] - y);
          if (d < best) best = d;
        }
      }
    return best;
  };
  const K = 9;
  for (let p = 0; p < n; p++) {
    let bs = -1;
    let bx = HEART[0];
    let by = HEART[1];
    for (let c = 0, tries = 0; c < K && tries < 4000; tries++) {
      const x = HOST_BOX.x0 + ih(p, tries, 501) * (HOST_BOX.x1 - HOST_BOX.x0);
      const y = HOST_BOX.y0 + ih(p, tries, 502) * (HOST_BOX.y1 - HOST_BOX.y0);
      const [rho, th] = polarOf(x, y);
      const dn = hostDensity(rho, th);
      if (dn <= 0 || ih(p, tries, 503) > dn) continue;
      if (shoreDist(x, y) < SHORE_KEEP) continue;
      c++;
      const sp = s0 / Math.sqrt(Math.max(0.12, dn));
      const sc = nearest(x, y, 3 * sp) / sp;
      if (sc > bs) [bs, bx, by] = [sc, x, y];
    }
    xs[p] = bx;
    ys[p] = by;
    insert(p);
  }
  // relaxation: push close pairs apart to the local spacing; stay off the lake
  for (let it = 0; it < 6; it++) {
    grid = new Map();
    for (let i = 0; i < n; i++) insert(i);
    const sp = Float64Array.from({ length: n }, (_, i) => spacing(xs[i], ys[i]));
    const dx = new Float64Array(n);
    const dy = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const gx = Math.floor(xs[i] / CELL);
      const gy = Math.floor(ys[i] / CELL);
      for (let a = gx - 2; a <= gx + 2; a++)
        for (let b = gy - 2; b <= gy + 2; b++) {
          const g = grid.get(key(a, b));
          if (!g) continue;
          for (const j of g) {
            if (j <= i) continue;
            const ex = xs[j] - xs[i];
            const ey = ys[j] - ys[i];
            const d = Math.hypot(ex, ey);
            const want = 0.5 * (sp[i] + sp[j]) * 0.95;
            if (d >= want || d < 1e-9) continue;
            const m = (0.5 * (want - d)) / d;
            dx[i] -= ex * m * 0.5;
            dy[i] -= ey * m * 0.5;
            dx[j] += ex * m * 0.5;
            dy[j] += ey * m * 0.5;
          }
        }
    }
    for (let i = 0; i < n; i++) {
      const nx = xs[i] + dx[i];
      const ny = ys[i] + dy[i];
      if (shoreDist(nx, ny) >= SHORE_KEEP && landAt(nx, ny)) [xs[i], ys[i]] = [nx, ny];
    }
  }
  return { xs, ys, s0 };
})();
/** the body's slot spacing (world px) */
export const SLOT_SPACING = RAW.s0;

// The fill order: the Spaniards are the 90 slots nearest the heart; the
// allies' slots are ranked by a ragged normalised radius (so the growing edge
// is organic, never a contour)
const RANKED = (() => {
  const n = N_HOST;
  const idx = Array.from({ length: n }, (_, i) => i);
  const d = Float64Array.from(idx, (i) => Math.hypot(RAW.xs[i] - HEART[0], RAW.ys[i] - HEART[1]));
  idx.sort((a, b) => d[a] - d[b]);
  const spanish = idx.slice(0, N_SPANISH);
  const rest = idx.slice(N_SPANISH);
  const rk = new Float64Array(n);
  for (const i of rest) {
    const [rho, th] = polarOf(RAW.xs[i], RAW.ys[i]);
    rk[i] = rho * (1 + 0.1 * (cnoise(th, 2.3, 71) - 0.5)) + 0.035 * (ih(i, 7, 72) - 0.5);
  }
  rest.sort((a, b) => rk[a] - rk[b]);
  return { spanish, rest, rk };
})();

// ---------------------------------------------------------------------------
// THE COLUMNS' PATHS
// ---------------------------------------------------------------------------
type Path = {
  n: number;
  step: number;
  px: Float64Array;
  py: Float64Array;
  nx: Float64Array;
  ny: Float64Array;
  dh: Float64Array; // distance to the heart
  rho: Float64Array; // normalised polar radius (Infinity far away)
  len: number;
};
const PATH_STEP = 0.05;
/** centripetal Catmull-Rom through waypoints, resampled every PATH_STEP, gaussian-smoothed */
const buildPath = (wpIn: P2[]): Path => {
  const wp = [...wpIn, HEART];
  const dense: P2[] = [];
  const ext = [wp[0], ...wp, wp[wp.length - 1]];
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const tj = (a: P2, b: P2) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-4, 0.5);
    const t0 = 0;
    const t1 = t0 + tj(p0, p1);
    const t2 = t1 + tj(p1, p2);
    const t3 = t2 + tj(p2, p3);
    const segs = Math.max(4, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 0.1));
    for (let q = 0; q < segs; q++) {
      const t = t1 + ((t2 - t1) * q) / segs;
      const L = (a: P2, b: P2, ta: number, tb: number): P2 => [
        ((tb - t) / (tb - ta)) * a[0] + ((t - ta) / (tb - ta)) * b[0],
        ((tb - t) / (tb - ta)) * a[1] + ((t - ta) / (tb - ta)) * b[1],
      ];
      const A1 = L(p0, p1, t0, t1);
      const A2 = L(p1, p2, t1, t2);
      const A3 = L(p2, p3, t2, t3);
      const B1 = L(A1, A2, t0, t2);
      const B2 = L(A2, A3, t1, t3);
      dense.push(L(B1, B2, t1, t2));
    }
  }
  dense.push(wp[wp.length - 1]);
  // resample evenly
  const cum = [0];
  for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const L = cum[cum.length - 1];
  const n = Math.floor(L / PATH_STEP) + 1;
  const rx = new Float64Array(n);
  const ry = new Float64Array(n);
  let j = 0;
  for (let q = 0; q < n; q++) {
    const s = q * PATH_STEP;
    while (j < dense.length - 2 && cum[j + 1] < s) j++;
    const u = (s - cum[j]) / (cum[j + 1] - cum[j] || 1);
    rx[q] = dense[j][0] + (dense[j + 1][0] - dense[j][0]) * u;
    ry[q] = dense[j][1] + (dense[j + 1][1] - dense[j][1]) * u;
  }
  // smoothed normals (gaussian tangent, sigma 1.2 world px)
  const nx = new Float64Array(n);
  const ny = new Float64Array(n);
  const sig = Math.round(1.2 / PATH_STEP);
  for (let q = 0; q < n; q++) {
    let tx = 0;
    let ty = 0;
    for (let k = -3 * sig; k <= 3 * sig; k += 2) {
      const a = Math.max(0, Math.min(n - 2, q + k));
      const g = Math.exp(-(k * k) / (2 * sig * sig));
      tx += (rx[a + 1] - rx[a]) * g;
      ty += (ry[a + 1] - ry[a]) * g;
    }
    const l = Math.hypot(tx, ty) || 1;
    nx[q] = -ty / l;
    ny[q] = tx / l;
  }
  const dh = Float64Array.from({ length: n }, (_, q) => Math.hypot(rx[q] - HEART[0], ry[q] - HEART[1]));
  const rho = Float64Array.from({ length: n }, (_, q) => (dh[q] > 30 ? Infinity : polarOf(rx[q], ry[q])[0]));
  return { n, step: PATH_STEP, px: rx, py: ry, nx, ny, dh, rho, len: (n - 1) * PATH_STEP };
};
const pathIdx = (P: Path, s: number) => {
  const x = Math.max(0, Math.min(P.n - 1.000001, s / P.step));
  return x;
};
const pathPoint = (P: Path, s: number, lat: number, out: number[]) => {
  const x = pathIdx(P, s);
  const i = Math.floor(x);
  const u = x - i;
  const nx = P.nx[i] + (P.nx[i + 1] - P.nx[i]) * u;
  const ny = P.ny[i] + (P.ny[i + 1] - P.ny[i]) * u;
  out[0] = P.px[i] + (P.px[i + 1] - P.px[i]) * u + nx * lat;
  out[1] = P.py[i] + (P.py[i + 1] - P.py[i]) * u + ny * lat;
};
const pathDh = (P: Path, s: number) => {
  const x = pathIdx(P, s);
  const i = Math.floor(x);
  return P.dh[i] + (P.dh[i + 1] - P.dh[i]) * (x - i);
};

/** a distance-time curve along a path (the Spaniards' march): X(tau) (world px
 *  along the path after tau frames), a table at 1/4 frame */
type Kin = { X: Float64Array; dt: number; tMax: number };
const buildKin = (P: Path, speed: (dHeart: number) => number, acc: number, ramp0: number): Kin => {
  const dt = 0.25;
  const out: number[] = [0];
  let s = 0;
  let t = 0;
  while (s < P.len && out.length < 40000) {
    const ramp = ramp0 + (1 - ramp0) * smoothstep(t / acc);
    const v1 = speed(pathDh(P, s)) * ramp;
    const sMid = s + v1 * dt * 0.5;
    const v2 = speed(pathDh(P, sMid)) * (ramp0 + (1 - ramp0) * smoothstep((t + dt / 2) / acc));
    s += v2 * dt;
    t += dt;
    out.push(Math.min(P.len, s));
  }
  return { X: Float64Array.from(out), dt, tMax: t };
};
const kinX = (K: Kin, tau: number) => {
  if (tau <= 0) return 0;
  const x = tau / K.dt;
  if (x >= K.X.length - 1) return K.X[K.X.length - 1];
  const i = Math.floor(x);
  return K.X[i] + (K.X[i + 1] - K.X[i]) * (x - i);
};

// ---------------------------------------------------------------------------
// THE COLUMN TABLE: one marching column per orange polity (tlaxProvinces
// POLITIES with weight > 0: its source, its share of the host, its smoothed
// land route toward Texcoco, followed until it first comes within R_JOIN of
// the heart, then bent into it). Dots per column: the weights, largest
// remainder, so they sum to N_ALLIES exactly.
// ---------------------------------------------------------------------------
const R_JOIN = 13;
const routeToHeart = (route: P2[]): P2[] => {
  const out: P2[] = [];
  for (const p of route) {
    if (Math.hypot(p[0] - HEART[0], p[1] - HEART[1]) < R_JOIN) break;
    out.push(p);
  }
  if (!out.length) out.push(route[0]);
  // thin to ~2.5 world px between waypoints (the build's routes are dense)
  const thin: P2[] = [out[0]];
  for (const p of out.slice(1)) if (Math.hypot(p[0] - thin[thin.length - 1][0], p[1] - thin[thin.length - 1][1]) >= 2.5) thin.push(p);
  if (thin[thin.length - 1] !== out[out.length - 1] && out.length > 1) thin.push(out[out.length - 1]);
  return thin;
};
/** the polities that send men: weight > 0 in P's table (the outer enclaves,
 *  Teotitlan, Metztitlan and Yopitzinco, have no documented alliance or
 *  contingent and weigh 0) */
const POLS = POLITIES.filter((q) => q.weight > 0);
const STREAM_N = (() => {
  const w = POLS.map((q) => q.weight);
  const tot = w.reduce((a, b) => a + b, 0);
  const raw = w.map((x) => (x / tot) * N_ALLIES);
  const n = raw.map(Math.floor);
  let left = N_ALLIES - n.reduce((a, b) => a + b, 0);
  const order = raw.map((x, i) => [x - Math.floor(x), i]).sort((a, b) => b[0] - a[0]);
  for (let q = 0; left > 0; q++, left--) n[order[q][1]]++;
  return n;
})();
/** a polity whose head town lies in (or at the rim of) the host's footprint
 *  (the Acolhua of Acolman, the Chalca) sets out from the rest of its own
 *  cell: the point of the cell outside rho 1.5 nearest that part's centroid */
const SRC_RHO_MIN = 1.5;
const outerSource = (cellId: number): P2 | null => {
  const cell = PROVINCES.find((c) => c.id === cellId);
  if (!cell) return null;
  const pip = (rings: P2[][], x: number, y: number) => {
    let c = false;
    for (const r of rings)
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [xi, yi] = r[i];
        const [xj, yj] = r[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
      }
    return c;
  };
  const pts: P2[] = [];
  for (const poly of cell.polys as P2[][][]) {
    let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
    for (const [x, y] of poly[0]) [x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)];
    for (let y = y0; y <= y1; y += 0.25)
      for (let x = x0; x <= x1; x += 0.25) if (pip(poly, x, y) && polarOf(x, y)[0] >= SRC_RHO_MIN && landAt(x, y)) pts.push([x, y]);
  }
  const dry = pts.filter((p) => shoreDist(p[0], p[1]) >= 1.5);
  if (!dry.length) return null;
  const c: P2 = [dry.reduce((a, p) => a + p[0], 0) / dry.length, dry.reduce((a, p) => a + p[1], 0) / dry.length];
  let best = dry[0];
  for (const p of dry) if (Math.hypot(p[0] - c[0], p[1] - c[1]) < Math.hypot(best[0] - c[0], best[1] - c[1])) best = p;
  return best;
};
/** a straight leg a -> b stays on land (>= 0.6 world px off the lake)? */
const dryLeg = (a: P2, b: P2) => {
  const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 0.1);
  for (let q = 0; q <= n; q++) if (shoreDist(a[0] + ((b[0] - a[0]) * q) / n, a[1] + ((b[1] - a[1]) * q) / n) < 0.6) return false;
  return true;
};
const sourceWaypoints = (q: (typeof POLS)[number]): P2[] => {
  if (polarOf(q.src[0], q.src[1])[0] >= SRC_RHO_MIN || q.cellId == null) return routeToHeart(q.route as P2[]);
  const src = outerSource(q.cellId);
  if (!src) return routeToHeart(q.route as P2[]);
  // straight in when that stays on land, else by the head town (P's route)
  return dryLeg(src, HEART) ? [src] : [src, ...routeToHeart(q.route as P2[])];
};

// ---------------------------------------------------------------------------
// THE CHOREOGRAPHY (clip clock G): when each column's head reaches the ring
// round the Spaniards, in distance order. The Acolhua (local) and Tlaxcala on
// "flocking" (D f171, G 609); then Chalco, Tepeaca, Huexotzinco and Cholula,
// the lake towns, Huaxtepec, inside D; the far ones (Cuauhnahuac, the Totonac
// coast, Toluca, Malinalco) still on the road when D ends, arriving in E.
// A polity not in the table arrives by the length of its road.
// ---------------------------------------------------------------------------
export const ARRIVE_G: Record<string, number> = {
  acolhuacan: 609,
  tlaxcala: 609,
  chalco: 616,
  tepeacac: 624,
  huexotzinco: 632,
  cholula: 638,
  petlacalco: 644,
  huaxtepec: 650,
  cuauhnahuac: 698,
  tollocan: 704,
  malinalco: 708,
  totonacs: 712,
};
/** the marching pace (world px / f): 42 px/f at E's close framing (k 84); the
 *  far columns, which arrive in E into the host's outer ring (off E's close
 *  frame), a little quicker */
export const V_COLUMN = 0.5;
export const V_COLUMN_FAR = 0.65;
const FAR_LEN = 35;
/** the first two columns are timed to be seen coming in D's pair framing: the
 *  Acolhua leave their land (in frame, to the north) on D f128 ("he has" f123);
 *  Tlaxcala's head crosses the frame's right edge (10.4 world px east of the
 *  heart in that framing) on D f141. Each walks at the pace that brings its
 *  head to the Spaniards on "flocking". */
const SEEN_FROM: Record<string, { g: number; edgeX?: number }> = {
  acolhuacan: { g: 438 + 128 },
  tlaxcala: { g: 438 + 141, edgeX: 10.4 },
};
/** the column's width (world px): 1.05 .. 1.55 (~32 .. 47 px at k 30), by its size */
const columnWidth = (n: number) => 1.05 + 0.5 * Math.sqrt(n / 4478);

export type StreamDef = { name: string; wp: P2[]; n: number; arrive: number; w: number };
export const STREAM_DEFS: StreamDef[] = POLS.map((q, i) => ({
  name: q.key,
  wp: sourceWaypoints(q),
  n: STREAM_N[i],
  arrive: NaN,
  w: columnWidth(STREAM_N[i]),
}));

// ---------------------------------------------------------------------------
// A COLUMN'S CROWD: n blue-noise points (best candidate + relaxation) at the
// host's own packing in a strip behind its head: o = world px behind the head,
// l = lateral (world px, + left of the march). Even across its middle 64 %,
// feathered to nothing over the edges, a rounded head, a thinning tail, and
// gentle density pulses along it (its contingents, +-18 %).
// ---------------------------------------------------------------------------
const columnCrowd = (n: number, W: number, seed: number) => {
  const s0 = RAW.s0;
  const a0 = 0.866 * s0 * s0;
  const latD = (l: number) => 1 - smoothstep((Math.abs(l) - 0.32 * W) / (0.3 * W));
  const P = 5.5 + 2 * ih(seed, 1, 81);
  const ph = 6.283 * ih(seed, 2, 81);
  const L = (n * a0) / (0.94 * W) + 1.4;
  const dens = (o: number, l: number) => latD(l) * smoothstep(o / 0.7) * (1 - smoothstep((o - (L - 2.2)) / 2.2)) * (1 + 0.18 * Math.sin((6.283 * o) / P + ph));
  const hw = 0.62 * W;
  const xs = new Float64Array(n);
  const ys = new Float64Array(n);
  const CELL = s0 * 1.5;
  const key = (a: number, b: number) => (a + 4096) * 8192 + (b + 4096);
  let grid = new Map<number, number[]>();
  const insert = (i: number) => {
    const k2 = key(Math.floor(xs[i] / CELL), Math.floor(ys[i] / CELL));
    const g = grid.get(k2);
    if (g) g.push(i);
    else grid.set(k2, [i]);
  };
  const nearest = (x: number, y: number, cap: number) => {
    const gx = Math.floor(x / CELL);
    const gy = Math.floor(y / CELL);
    const R = Math.ceil(cap / CELL);
    let best = cap;
    for (let a = gx - R; a <= gx + R; a++)
      for (let b = gy - R; b <= gy + R; b++) {
        const g = grid.get(key(a, b));
        if (!g) continue;
        for (const j of g) {
          const d = Math.hypot(xs[j] - x, ys[j] - y);
          if (d < best) best = d;
        }
      }
    return best;
  };
  for (let p = 0; p < n; p++) {
    let bs = -1;
    let bx = L / 2;
    let by = 0;
    for (let c = 0, tries = 0; c < 8 && tries < 4000; tries++) {
      const x = ih(p, tries, 900 + seed) * L;
      const y = (ih(p, tries, 901 + seed) * 2 - 1) * hw;
      const dn = dens(x, y);
      if (dn <= 0 || ih(p, tries, 902 + seed) > dn) continue;
      c++;
      const sp = s0 / Math.sqrt(Math.max(0.12, dn));
      const sc = nearest(x, y, 3 * sp) / sp;
      if (sc > bs) [bs, bx, by] = [sc, x, y];
    }
    xs[p] = bx;
    ys[p] = by;
    insert(p);
  }
  for (let it = 0; it < 4; it++) {
    grid = new Map();
    for (let i = 0; i < n; i++) insert(i);
    const sp = Float64Array.from({ length: n }, (_, i) => s0 / Math.sqrt(Math.max(0.12, dens(xs[i], ys[i]))));
    const dx = new Float64Array(n);
    const dy = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      const gx = Math.floor(xs[i] / CELL);
      const gy = Math.floor(ys[i] / CELL);
      for (let a = gx - 2; a <= gx + 2; a++)
        for (let b = gy - 2; b <= gy + 2; b++) {
          const g = grid.get(key(a, b));
          if (!g) continue;
          for (const j of g) {
            if (j <= i) continue;
            const ex = xs[j] - xs[i];
            const ey = ys[j] - ys[i];
            const d = Math.hypot(ex, ey);
            const want = 0.5 * (sp[i] + sp[j]) * 0.95;
            if (d >= want || d < 1e-9) continue;
            const m = (0.5 * (want - d)) / d;
            dx[i] -= ex * m * 0.5;
            dy[i] -= ey * m * 0.5;
            dx[j] += ex * m * 0.5;
            dy[j] += ey * m * 0.5;
          }
        }
    }
    for (let i = 0; i < n; i++) {
      xs[i] = Math.max(0, Math.min(L, xs[i] + dx[i]));
      ys[i] = Math.max(-hw, Math.min(hw, ys[i] + dy[i]));
    }
  }
  // head first
  const idx = Array.from({ length: n }, (_, i) => i).sort((a, b) => xs[a] - xs[b]);
  return { o: Float64Array.from(idx, (i) => xs[i]), l: Float64Array.from(idx, (i) => ys[i]), L };
};

type Stream = StreamDef & { path: Path; pace: number; t0: number; sRim: number; sRing: number; thEntry: number; L: number; o: Float64Array; l: Float64Array };
const buildStream = (d0: StreamDef, si: number): Stream => {
  const path = buildPath(d0.wp);
  // the path's arclength at the host's rim (rho 1) and at the ring round the Spaniards (1 world px from the heart)
  let sRim = path.len;
  let sRing = path.len;
  for (let q = path.n - 1; q >= 0; q--) {
    if (path.dh[q] > 1.0 && sRing === path.len) sRing = q * path.step;
    if (path.rho[q] > 1) {
      sRim = q * path.step;
      break;
    }
  }
  const qRim = Math.min(path.n - 1, Math.round(sRim / path.step));
  const thEntry = Math.atan2(path.py[qRim] - HEART[1], path.px[qRim] - HEART[0]);
  const arrive = ARRIVE_G[d0.name] ?? 620 + 0.6 * path.len;
  const seen = SEEN_FROM[d0.name];
  let pace = path.len > FAR_LEN ? V_COLUMN_FAR : V_COLUMN;
  if (seen && seen.edgeX != null) {
    let sEdge = 0;
    for (let q = 0; q < path.n; q++)
      if (path.px[q] - HEART[0] <= seen.edgeX) {
        sEdge = q * path.step;
        break;
      }
    pace = Math.min(V_COLUMN, (sRing - sEdge) / (arrive - seen.g));
  } else if (seen) pace = Math.min(V_COLUMN, sRing / (arrive - seen.g));
  const t0 = arrive - sRing / pace;
  const crowd = columnCrowd(d0.n, d0.w, si + 1);
  return { ...d0, arrive, path, pace, t0, sRim, sRing, thEntry, L: crowd.L, o: crowd.o, l: crowd.l };
};
export const STREAMS: Stream[] = STREAM_DEFS.map(buildStream);
if (STREAMS.reduce((s, q) => s + q.n, 0) !== N_ALLIES) {
  throw new Error(`tlaxHost: the columns carry ${STREAMS.reduce((s, q) => s + q.n, 0)} dots, not N_ALLIES ${N_ALLIES}`);
}

// ---------------------------------------------------------------------------
// EVERY ALLIED DOT: its column, its place in it, when it steps off its source
// and when it reaches the host's rim
// ---------------------------------------------------------------------------
type Ally = { st: number; o: number; l: number; t0: number; tRim: number };
const ALLIES_RAW: Ally[] = (() => {
  const out: Ally[] = [];
  STREAMS.forEach((S, si) => {
    for (let j = 0; j < S.n; j++) {
      const o = S.o[j];
      out.push({ st: si, o, l: S.l[j], t0: S.t0 + o / S.pace, tRim: S.t0 + (o + S.sRim) / S.pace });
    }
  });
  return out;
})();

// ---------------------------------------------------------------------------
// THE FILL: backwards in time from the outside in, each dot takes the unfilled
// slot that costs least: the arc round the heart from where it comes in (its
// column's way in, its own side of the column spread a little across the
// sector) + a penalty for lying inside the outermost unfilled ring. So the last
// to arrive take the outermost slots facing their way in, each column fills
// the sector facing it from the inside out, and the host grows round the
// Spaniards as one body. A linked list over RANKED.rest keeps the window.
// ---------------------------------------------------------------------------
const FILL = (() => {
  const rest = RANKED.rest;
  const nR = rest.length;
  const next = Int32Array.from({ length: nR }, (_, q) => q + 1);
  const prev = Int32Array.from({ length: nR }, (_, q) => q - 1);
  let tail = nR - 1;
  const rmv = (q: number) => {
    if (prev[q] >= 0) next[prev[q]] = next[q];
    if (next[q] < nR) prev[next[q]] = prev[q];
    else tail = prev[q];
  };
  const pol = rest.map((i) => polarOf(RAW.xs[i], RAW.ys[i]));
  const order = ALLIES_RAW.map((_, a) => a).sort((a, b) => ALLIES_RAW[a].tRim - ALLIES_RAW[b].tRim);
  const slotOf = new Int32Array(ALLIES_RAW.length);
  const WIN = 1600;
  const LAMBDA = 20; // world px of arc worth one unit of normalised radius
  const SPREAD = 5; // a dot's side of the column, spread this much wider across the sector
  const tmp = [0, 0];
  for (let o = order.length - 1; o >= 0; o--) {
    const a = order[o];
    const A = ALLIES_RAW[a];
    const S = STREAMS[A.st];
    // where its own line through the column meets the rim, spread across the sector
    pathPoint(S.path, S.sRim, A.l, tmp);
    const th0 = S.thEntry + SPREAD * wrapPi(Math.atan2(tmp[1] - HEART[1], tmp[0] - HEART[0]) - S.thEntry);
    let best = -1;
    let bc = Infinity;
    let rk0 = -1;
    for (let q = tail, c = 0; q >= 0 && c < WIN; q = prev[q], c++) {
      const i = rest[q];
      if (rk0 < 0) rk0 = RANKED.rk[i];
      const [rho, th] = pol[q];
      const dth = Math.abs(wrapPi(th - th0));
      const arc = dth * rho * boundaryR(th);
      // a wide wrap round the heart is a long slide: make it the last resort
      const cost = arc + (dth > 1.5 ? 60 * (dth - 1.5) : 0) + LAMBDA * (rk0 - RANKED.rk[i]);
      if (cost < bc) [bc, best] = [cost, q];
    }
    slotOf[a] = rest[best];
    rmv(best);
  }
  return { order, slotOf };
})();

// ---------------------------------------------------------------------------
// INDEXING. Dot i < N_SPANISH: a Spaniard (slot RANKED.spanish[i]); dot
// N_SPANISH + r: the r-th ally to reach the host's rim (FILL.order[r]).
// ---------------------------------------------------------------------------
export const SLOT_X = new Float64Array(N_HOST);
export const SLOT_Y = new Float64Array(N_HOST);
RANKED.spanish.forEach((q, i) => {
  SLOT_X[i] = RAW.xs[q];
  SLOT_Y[i] = RAW.ys[q];
});
const A_ST = new Int16Array(N_HOST);
const A_T0 = new Float64Array(N_HOST); // G when it steps off its source (its path position 0)
const A_L = new Float64Array(N_HOST); // lateral place in its column
const A_GP = new Float64Array(N_HOST); // G when it leaves the column for its slot
const A_T = new Float64Array(N_HOST); // the arc's frames
const A_R0 = new Float64Array(N_HOST);
const A_TH0 = new Float64Array(N_HOST);
const A_R1 = new Float64Array(N_HOST);
const A_TH1 = new Float64Array(N_HOST);
const A_MR = new Float64Array(N_HOST);
const A_MT = new Float64Array(N_HOST);
const A_CART = new Uint8Array(N_HOST); // 1 = the straight (Cartesian) arc
const A_P0 = new Float64Array(2 * N_HOST); // the arc's start (world px) and its velocity (world px / f)
const A_V0 = new Float64Array(2 * N_HOST);
/** ally i's arc at u (0..1) into out */
const arcAt = (i: number, u: number, out: number[]) => {
  if (A_CART[i]) {
    out[0] = herm(A_P0[2 * i], SLOT_X[i], A_V0[2 * i] * A_T[i], 0, u);
    out[1] = herm(A_P0[2 * i + 1], SLOT_Y[i], A_V0[2 * i + 1] * A_T[i], 0, u);
    return;
  }
  const P = arcFromPolar(herm(A_R0[i], A_R1[i], A_MR[i], 0, u), herm(A_TH0[i], A_TH1[i], A_MT[i], 0, u));
  out[0] = P[0];
  out[1] = P[1];
};
/** ally i in its column at clip clock g (before it leaves the column): the column moves as one body at its pace */
const flightAt = (i: number, g: number, out: number[]) => {
  const S = STREAMS[A_ST[i]];
  pathPoint(S.path, S.pace * (g - A_T0[i]), A_L[i], out);
};
/** where the column's dot turns off for its slot: just outside its slot's ring (it keeps the column's pace till then) */
const PEEL_LEAD = 0.05;
/** an arc's fastest frame (world px / f) and its longest run (frames) */
const V_ARC_MAX = 0.55;
const T_ARC_MAX = 64;
(() => {
  const tmp = [0, 0];
  const tmp2 = [0, 0];
  FILL.order.forEach((a, r) => {
    const i = N_SPANISH + r;
    const A = ALLIES_RAW[a];
    const S = STREAMS[A.st];
    const q = FILL.slotOf[a];
    SLOT_X[i] = RAW.xs[q];
    SLOT_Y[i] = RAW.ys[q];
    A_ST[i] = A.st;
    A_T0[i] = A.t0;
    A_L[i] = A.l;
    const [rho1, th1] = arcPolarOf(SLOT_X[i], SLOT_Y[i]);
    // the peel: the last point of its own line through the column (lateral
    // offset included) still outside its slot's ring
    let sPeel = 0;
    for (let k = S.path.n - 1; k >= 0; k--) {
      if (S.path.dh[k] > 30) break;
      pathPoint(S.path, k * S.path.step, A.l, tmp);
      if (arcPolarOf(tmp[0], tmp[1])[0] > rho1 + PEEL_LEAD) {
        sPeel = k * S.path.step;
        break;
      }
    }
    const gp = A.t0 + sPeel / S.pace;
    A_GP[i] = gp;
    flightAt(i, gp, tmp);
    flightAt(i, gp + 0.25, tmp2);
    A_P0[2 * i] = tmp[0];
    A_P0[2 * i + 1] = tmp[1];
    A_V0[2 * i] = (tmp2[0] - tmp[0]) / 0.25;
    A_V0[2 * i + 1] = (tmp2[1] - tmp[1]) / 0.25;
    const [r0, t0] = arcPolarOf(tmp[0], tmp[1]);
    const [r0b, t0b] = arcPolarOf(tmp2[0], tmp2[1]);
    A_R0[i] = r0;
    A_TH0[i] = t0;
    A_R1[i] = rho1;
    A_TH1[i] = t0 + wrapPi(th1 - t0);
    // its frames: the arc's length at the column's pace, easing to rest in the slot
    const dTh = Math.abs(wrapPi(th1 - t0));
    const len = dTh * Math.max(0.5, rho1 * arcR(th1)) + Math.abs(r0 - rho1) * arcR(th1) + Math.hypot(tmp[0] - SLOT_X[i], tmp[1] - SLOT_Y[i]) * 0.3;
    // (inside the body a dot may step out a little quicker than a slow column, never past V_ARC_MAX)
    const vArc = Math.max(S.pace, 0.45);
    let T = Math.min(T_ARC_MAX, Math.max(6 + 4 * ih(i, 1, 31), (1.5 * len) / vArc));
    const setSlopes = () => {
      A_T[i] = T;
      A_MR[i] = ((r0b - r0) / 0.25) * T;
      A_MT[i] = (wrapPi(t0b - t0) / 0.25) * T;
      // never let the radial slope overshoot the slot
      if (A_MR[i] < -2.6 * Math.abs(r0 - rho1)) A_MR[i] = -2.6 * Math.abs(r0 - rho1);
    };
    // round the heart (polar) unless that would cross the lake, then straight in;
    // lengthened until its fastest frame stays under V_ARC_MAX
    for (let it = 0; it < 4; it++) {
      setSlopes();
      A_CART[i] = 0;
      const sample = () => {
        let vm = 0;
        let dry = Infinity;
        const P = [0, 0];
        arcAt(i, 0, P);
        let px = P[0];
        let py = P[1];
        for (let u = 0.04; u <= 1.0001; u += 0.04) {
          arcAt(i, u, P);
          vm = Math.max(vm, Math.hypot(P[0] - px, P[1] - py) / (0.04 * T));
          dry = Math.min(dry, signedShore(P[0], P[1]));
          px = P[0];
          py = P[1];
        }
        return { vm, dry };
      };
      let qq = sample();
      if (qq.dry < WET) {
        A_CART[i] = 1;
        const q2 = sample();
        if (q2.dry < qq.dry) A_CART[i] = 0;
        else qq = q2;
      }
      if (qq.vm <= V_ARC_MAX || T >= T_ARC_MAX) break;
      T = Math.min(T_ARC_MAX, T * Math.min(2, (qq.vm / V_ARC_MAX) * 1.05));
    }
  });
})();
/** the G at which every ally is in its slot */
export const HOST_COMPLETE_G = (() => {
  let m = 0;
  for (let i = N_SPANISH; i < N_HOST; i++) m = Math.max(m, A_GP[i] + A_T[i]);
  return m;
})();
export const FIRST_ARRIVAL_G = (() => {
  let m = Infinity;
  for (let i = N_SPANISH; i < N_HOST; i++) m = Math.min(m, A_GP[i]);
  return m;
})();

// ---------------------------------------------------------------------------
// THE SPANIARDS' MARCH (cut D, "builds up"): the 90 leave Tlaxcala as a short
// column on Cortes's road (Tlaxcala - Texmelucan - over the sierra; Third
// Letter: out of Tlaxcala 28 Dec 1520, at Texcoco 31 Dec) and settle round the
// banner. Head-led, three files, ranks RANK apart; each man leaves the road
// near the body and eases into his slot on his own Hermite (farthest slots
// first, so nobody walks through the men already standing).
// ---------------------------------------------------------------------------
/** the Spaniards' road = the Tlaxcalans' route (P's, Tlaxcala -> Texcoco), bent into the heart */
export const SPANISH_ROAD = buildPath(routeToHeart(POLITIES.find((q) => q.key === "tlaxcala")!.route as P2[]));
const RANK = 0.16;
const FILE = 0.13;
const FILES = 4;
export const SPANISH_DEPART_G = 438 + 1; // D f1: out of Tlaxcala as the dive begins, marching on "builds" f29
/** the march: brisk across the sierra, slowing to a walk as it nears the banner
 *  (<= 0.33 world px / f there: ~26 px/f at the close framing, k 80) */
const V_MARCH = 1.25;
const V_MARCH_NEAR = 0.33;
const marchSpeed = (d: number) => V_MARCH_NEAR + (V_MARCH - V_MARCH_NEAR) * smoothstep((d - 3) / 10);
const MARCH_KIN = buildKin(SPANISH_ROAD, marchSpeed, 10, 0.1);
/** the head's distance along the road (it walks on past the road's end at the walking pace, so the rear ranks reach their peel points) */
const spanishHeadS = (g: number) => {
  const tau = g - SPANISH_DEPART_G;
  return tau <= MARCH_KIN.tMax ? kinX(MARCH_KIN, tau) : MARCH_KIN.X[MARCH_KIN.X.length - 1] + V_MARCH_NEAR * (tau - MARCH_KIN.tMax);
};
const SP_PEEL = new Float64Array(N_SPANISH); // road arclength where he leaves it
const SP_GP = new Float64Array(N_SPANISH);
const SP_T = new Float64Array(N_SPANISH);
const SP_OFF = new Float64Array(N_SPANISH); // his place behind the head
const SP_LAT = new Float64Array(N_SPANISH);
const SP_P0 = new Float64Array(2 * N_SPANISH);
const SP_V0 = new Float64Array(2 * N_SPANISH);
(() => {
  const R = SPANISH_ROAD;
  const end = R.len;
  // the road's direction into the body
  const q1 = R.n - 1;
  const q0 = Math.max(0, q1 - Math.round(2 / R.step));
  const dir: P2 = [R.px[q1] - R.px[q0], R.py[q1] - R.py[q0]];
  const dl = Math.hypot(dir[0], dir[1]);
  dir[0] /= dl;
  dir[1] /= dl;
  const lat: P2 = [-dir[1], dir[0]];
  // slots ranked farthest-along first, in ranks of FILES by lateral order
  const slots = Array.from({ length: N_SPANISH }, (_, i) => i).sort(
    (a, b) => SLOT_X[b] * dir[0] + SLOT_Y[b] * dir[1] - (SLOT_X[a] * dir[0] + SLOT_Y[a] * dir[1]),
  );
  const assign = new Int32Array(N_SPANISH); // column place c -> slot (dot index)
  for (let r0 = 0; r0 < N_SPANISH; r0 += FILES) {
    const grp = slots.slice(r0, r0 + FILES).sort((a, b) => SLOT_X[a] * lat[0] + SLOT_Y[a] * lat[1] - (SLOT_X[b] * lat[0] + SLOT_Y[b] * lat[1]));
    grp.forEach((s, f) => (assign[r0 + f] = s));
  }
  const tmp = [0, 0];
  for (let c = 0; c < N_SPANISH; c++) {
    const i = assign[c];
    const rank = Math.floor(c / FILES);
    const file = c % FILES;
    SP_OFF[i] = 0.05 + rank * RANK + (file % 2 ? RANK / 2 : 0) + 0.09 * (ih(i, 1, 41) - 0.5);
    SP_LAT[i] = (file - (FILES - 1) / 2) * FILE * (0.85 + 0.3 * ih(rank, 5, 41)) + 0.07 * (ih(i, 2, 41) - 0.5);
    // he leaves the road ~1.1 world px short of where his slot projects on it
    const along = (SLOT_X[i] - HEART[0]) * dir[0] + (SLOT_Y[i] - HEART[1]) * dir[1];
    const sPeel = Math.max(0, end - 1.1 + along - 0.4 * ih(i, 3, 41));
    SP_PEEL[i] = sPeel;
    // the head reaches s at spanishHeadS(g) = s + off
    let lo = SPANISH_DEPART_G;
    let hi = SPANISH_DEPART_G + 200;
    for (let it = 0; it < 50; it++) {
      const m = (lo + hi) / 2;
      if (spanishHeadS(m) - SP_OFF[i] < sPeel) lo = m;
      else hi = m;
    }
    SP_GP[i] = lo;
    pathPoint(R, sPeel, SP_LAT[i], tmp);
    SP_P0[2 * i] = tmp[0];
    SP_P0[2 * i + 1] = tmp[1];
    const dist = Math.hypot(SLOT_X[i] - tmp[0], SLOT_Y[i] - tmp[1]);
    const v = marchSpeed(Math.hypot(tmp[0] - HEART[0], tmp[1] - HEART[1]));
    const T = Math.max(10 + 6 * ih(i, 4, 41), Math.min((2.6 * dist) / v, 26));
    SP_T[i] = T;
    // tangent at the peel
    const qa = Math.min(R.n - 2, Math.floor(sPeel / R.step));
    const tx = R.px[qa + 1] - R.px[qa];
    const ty = R.py[qa + 1] - R.py[qa];
    const tl = Math.hypot(tx, ty) || 1;
    SP_V0[2 * i] = (tx / tl) * v * T;
    SP_V0[2 * i + 1] = (ty / tl) * v * T;
  }
})();
export const SPANISH_SETTLED_G = (() => {
  let m = 0;
  for (let i = 0; i < N_SPANISH; i++) m = Math.max(m, SP_GP[i] + SP_T[i]);
  return m;
})();

// ---------------------------------------------------------------------------
// THE FRAME: every dot at clip clock G
// ---------------------------------------------------------------------------
/** opacity bins for the allies (emerging out of the source) */
export const OP_BINS = [0.25, 0.5, 0.75, 1];
/** the house micro-drift: ~0.3 screen px, its own phase per dot */
const drift = (i: number, g: number, k: number, out: number[]) => {
  const a = 0.3 / k;
  out[0] += a * Math.sin(g * (0.05 + 0.03 * ih(i, 8, 22)) + 6.28 * ih(i, 9, 22));
  out[1] += a * Math.sin(g * (0.05 + 0.03 * ih(i, 10, 22)) + 6.28 * ih(i, 11, 22));
};
export type DotBin = { xy: Float32Array; n: number; op: number };
export type HostFrame = {
  spanish: DotBin[];
  allies: { xy: Float32Array; n: number; op: number }[];
  settled: number;
};
const BUF_SP = OP_BINS.map(() => new Float32Array(2 * N_SPANISH));
const BUF_AL = OP_BINS.map(() => new Float32Array(2 * N_ALLIES));
/** dot i at clip clock g (world px into out, with the micro-drift for zoom k);
 *  returns its opacity (0 = not on the map yet) */
export const placeDot = (i: number, g: number, k: number, out: number[]): number => {
  let op = 1;
  if (i < N_SPANISH) {
    // the Spaniards: out of Tlaxcala (fading in over their first 0.6 world px), along the road, into their slots
    const s = spanishHeadS(g) - SP_OFF[i];
    if (s <= 0) return 0;
    if (g < SP_GP[i]) {
      pathPoint(SPANISH_ROAD, s, SP_LAT[i], out);
      op = smoothstep(s / 0.6);
    } else if (g < SP_GP[i] + SP_T[i]) {
      const u = (g - SP_GP[i]) / SP_T[i];
      // ease out of the road's speed onto the slot, at rest
      out[0] = herm(SP_P0[2 * i], SLOT_X[i], SP_V0[2 * i], 0, u);
      out[1] = herm(SP_P0[2 * i + 1], SLOT_Y[i], SP_V0[2 * i + 1], 0, u);
    } else {
      out[0] = SLOT_X[i];
      out[1] = SLOT_Y[i];
    }
  } else {
    // the allies: out of their land (fading in over their first 0.9 world px), down the stream, round the heart into their slots
    if (g < A_T0[i]) return 0;
    if (g < A_GP[i]) {
      const S = STREAMS[A_ST[i]];
      const s = S.pace * (g - A_T0[i]);
      pathPoint(S.path, s, A_L[i], out);
      op = smoothstep(s / 0.9);
    } else if (g < A_GP[i] + A_T[i]) {
      arcAt(i, (g - A_GP[i]) / A_T[i], out);
    } else {
      out[0] = SLOT_X[i];
      out[1] = SLOT_Y[i];
    }
  }
  // nobody walks on the lake: a point that strays within SHORE_KEEP / 2 of it is
  // pushed back up the shore-distance field (continuous as the point moves)
  const sd = signedShore(out[0], out[1]);
  if (sd < WET) {
    const gx = signedShore(out[0] + 0.05, out[1]) - signedShore(out[0] - 0.05, out[1]);
    const gy = signedShore(out[0], out[1] + 0.05) - signedShore(out[0], out[1] - 0.05);
    const gl = Math.hypot(gx, gy) || 1;
    out[0] += (gx / gl) * (WET - sd);
    out[1] += (gy / gl) * (WET - sd);
  }
  drift(i, g, k, out);
  return op;
};
/** is dot i in its slot at g? */
export const isSettled = (i: number, g: number) => (i < N_SPANISH ? g >= SP_GP[i] + SP_T[i] && spanishHeadS(g) > SP_OFF[i] : g >= A_GP[i] + A_T[i]);
export const hostAt = (g: number, k: number): HostFrame => {
  const p = [0, 0];
  const ns = OP_BINS.map(() => 0);
  const cnt = OP_BINS.map(() => 0);
  let settled = 0;
  for (let i = 0; i < N_HOST; i++) {
    const op = placeDot(i, g, k, p);
    if (op <= 0.02) continue;
    if (i >= N_SPANISH && g >= A_GP[i] + A_T[i]) settled++;
    let b = 0;
    while (b < OP_BINS.length - 1 && op > OP_BINS[b] + 0.125) b++;
    const sp = i < N_SPANISH;
    const buf = sp ? BUF_SP[b] : BUF_AL[b];
    const c = sp ? ns : cnt;
    buf[2 * c[b]] = p[0];
    buf[2 * c[b] + 1] = p[1];
    c[b]++;
  }
  return {
    spanish: OP_BINS.map((op, b) => ({ xy: BUF_SP[b], n: ns[b], op })),
    allies: OP_BINS.map((op, b) => ({ xy: BUF_AL[b], n: cnt[b], op })),
    settled,
  };
};
/** dot radius in screen px: >= 1.5 at the host's framings, world-sized above */
export const dotScreenR = (k: number) => Math.max(1.35, Math.min(1.6, 0.045 * k)) + Math.max(0, 0.044 * (k - 36));
/** the dark casing round every dot (screen px): it keeps a thread of men legible over orange land */
export const dotCasing = (r: number) => Math.max(0.6, 0.4 * r);
// ---------------------------------------------------------------------------
// THE CAMERA RUNNER shared by D and E. One world ANCHOR (the heart) held at a
// SCREEN point s at zoom k; the channels ln k, s.x, s.y are each a sum of
// cosine-tapered velocity bumps (cortesShared makeTrack: C1, and with taper 1
// the velocity eases from and to rest, so no move starts or lands with a jolt).
// MOVES are sequential and each lands exactly on its target framing at its
// end (its area is solved against everything before it); CREEPS are small
// relative bumps that overlap the moves, so the camera is never parked.
// The frame centre follows: cx = a.x - (s.x - 540) / k.
// ---------------------------------------------------------------------------
type Chan = "lnk" | "sx" | "sy";
const CHANS: Chan[] = ["lnk", "sx", "sy"];
export type Framing = { k: number; s: P2 };
export type Move = { win: [number, number]; taper?: number; to: Framing };
export type Creep = { win: [number, number]; taper?: number; dlnk?: number; dsx?: number; dsy?: number };
export const makeMoveCamera = (
  anchor: P2,
  start: Framing,
  moves: Move[],
  creeps: Creep[],
  makeTrackFn: (bumps: [number, number, number, number][], v0: number, fLo?: number, fHi?: number, sub?: number) => (f: number) => number,
) => {
  const v0: Record<Chan, number> = { lnk: Math.log(start.k), sx: start.s[0], sy: start.s[1] };
  const unit = (w: [number, number], taper: number) => makeTrackFn([[w[0], w[1], 1, taper]], 0, -120, 420);
  const creepOf = (ch: Chan) =>
    makeTrackFn(
      creeps.map((c) => [c.win[0], c.win[1], ch === "lnk" ? c.dlnk ?? 0 : ch === "sx" ? c.dsx ?? 0 : c.dsy ?? 0, c.taper ?? 1] as [number, number, number, number]),
      0,
      -120,
      420,
    );
  const tracks = Object.fromEntries(
    CHANS.map((ch) => {
      const creep = creepOf(ch);
      const units = moves.map((m) => unit(m.win, m.taper ?? 1));
      const areas: number[] = [];
      moves.forEach((m, i) => {
        const target = ch === "lnk" ? Math.log(m.to.k) : ch === "sx" ? m.to.s[0] : m.to.s[1];
        const f2 = m.win[1];
        let at = v0[ch] + creep(f2);
        for (let j = 0; j < i; j++) at += areas[j] * units[j](f2);
        // makeTrack holds every track at 0 on f0, so a window that opens before
        // f0 has already run part of its course there: divide by what is left
        areas.push((target - at) / (units[i](f2) - units[i](0)));
      });
      return [ch, (f: number) => v0[ch] + creep(f) + areas.reduce((acc, A, j) => acc + A * units[j](f), 0)];
    }),
  ) as Record<Chan, (f: number) => number>;
  return (f: number): Cam => {
    const k = Math.exp(tracks.lnk(f));
    return { k, cx: anchor[0] - (tracks.sx(f) - 540) / k, cy: anchor[1] - (tracks.sy(f) - 960) / k };
  };
};
/** where world point p sits on screen under cam */
export const screenPt = (p: P2, cam: Cam): P2 => [540 + (p[0] - cam.cx) * cam.k, 960 + (p[1] - cam.cy) * cam.k];

// ---------------------------------------------------------------------------
// THE BANNER: an engraved Spanish standard on a pole, in the Carrack's line
// manner (cream fill, DARK casing and hatching). A 100-unit frame: the pole's
// foot at (0, 0), its top at y -100, a small cross finial above; a
// swallow-tailed cloth flying east from the pole's head, a small cross on it.
// size = the pole's height in screen px. progress 0..1 raises it: it swings up
// about its foot from lying west to upright (eased, no overshoot), fading in
// over the first third.
// ---------------------------------------------------------------------------
const B_POLE = "M0,0 L0,-100";
const B_FINIAL = "M0,-100 L0,-109 M-3.4,-105.2 L3.4,-105.2";
const B_CLOTH =
  "M0.8,-97 C12,-99.5 24,-94.5 44,-96.5 C40.5,-90 37.5,-85.5 34,-81.5 C38.5,-77 41.5,-72.5 45,-66 C26,-64.5 13,-68 0.8,-65.5 Z";
const B_FOLDS = "M14,-96.3 C14.6,-88 14.2,-76 13.4,-67.4 M26.5,-96 C27.4,-88 27.2,-77 26.4,-66.6";
const B_CROSS = "M21,-88.5 L21,-73.5 M14.6,-82.6 L27.4,-82.6";
export const Banner: React.FC<{ x: number; y: number; cam: Cam; size: number; progress: number; opacity?: number }> = ({
  x,
  y,
  cam,
  size,
  progress,
  opacity = 1,
}) => {
  const p = clamp01(progress);
  const op = opacity * smoothstep(p / 0.34);
  if (op <= 0.002) return null;
  const u = size / 100 / cam.k; // world px per glyph unit
  const sw = 100 / size; // 1 screen px in glyph units
  const e = 1 - Math.pow(1 - p, 3); // ease out
  const rot = -88 * (1 - e);
  return (
    <g opacity={op} transform={`translate(${x} ${y}) scale(${u}) rotate(${rot.toFixed(3)})`} strokeLinejoin="round" strokeLinecap="round">
      {/* dark casing under everything, so it reads over land and over the crowd */}
      <g fill="none" stroke={DARK} strokeOpacity={0.62} strokeWidth={4.2 * sw}>
        <path d={B_POLE} />
        <path d={B_FINIAL} />
        <path d={B_CLOTH} />
      </g>
      <path d={B_POLE} fill="none" stroke={INK} strokeOpacity={INK_FULL} strokeWidth={2.1 * sw} />
      <path d={B_FINIAL} fill="none" stroke={INK} strokeOpacity={INK_FULL} strokeWidth={1.8 * sw} />
      <path d={B_CLOTH} fill={INK} fillOpacity={INK_FULL} stroke={DARK} strokeOpacity={0.55} strokeWidth={0.95 * sw} />
      <g fill="none" stroke={DARK} strokeOpacity={0.5} strokeWidth={0.9 * sw}>
        <path d={B_FOLDS} />
      </g>
      <path d={B_CROSS} fill="none" stroke={DARK} strokeOpacity={0.8} strokeWidth={2.2 * sw} />
    </g>
  );
};
/** check scripts only: dot i's flight parameters */
export const _dotParams = (i: number) => ({
  cart: A_CART[i],
  l: A_L[i],
  st: A_ST[i], t0: A_T0[i], gp: A_GP[i], T: A_T[i], r0: A_R0[i], r1: A_R1[i], th0: A_TH0[i], th1: A_TH1[i], mr: A_MR[i], mt: A_MT[i],
});

// ---------------------------------------------------------------------------
// THE MAP for D and E: tlaxShared's MapStack (the Cortes pyramid + W's valley
// levels) and, on top, the HOST LEVEL (scripts/bake-tlax-host-rasters.mjs ->
// public/tlax-host, tlaxHostLevels.ts; k band 48-52, sharp to k ~95) with its
// own copy of the world-space mottle, crossfaded as one group (so the blend is
// exact). Below the band it draws nothing (D f0 / E f0 are MapStack alone).
// ---------------------------------------------------------------------------
const HOST_COVER_FADE = 48; // screen px (cortesShared's COVER_FADE)
/** the host level's weight for this camera: its k band x how far the frame lies inside its rect */
export const hostLevelWeight = (cam: Cam) => {
  const L = HOST_LEVELS[0];
  const [a, b] = L.band as [number, number];
  const kw = smoothstep(Math.log(cam.k / a) / Math.log(b / a));
  if (kw <= 0) return 0;
  const v = viewRect(cam, 16);
  const inset = Math.min(v.x0 - L.x0, L.x0 + L.w - v.x1, v.y0 - L.y0, L.y0 + L.h - v.y1) * cam.k;
  return kw * smoothstep(inset / HOST_COVER_FADE);
};
export const HostMapStack: React.FC<{ cam: Cam }> = ({ cam }) => {
  const w = hostLevelWeight(cam);
  if (w <= 0.001) return <MapStack cam={cam} />;
  const L = HOST_LEVELS[0];
  const { k } = cam;
  const { tx, ty } = camTransform(cam);
  const v = viewRect(cam, 24);
  const tiles = L.tiles.filter((t) => t.x0 < v.x1 && t.x0 + t.w > v.x0 && t.y0 < v.y1 && t.y0 + t.h > v.y0);
  // the mottle (tlaxShared MapStack's, world space, octaves blended by k)
  const L2m = Math.log2(k);
  const om = Math.floor(L2m);
  const tm = L2m - om;
  const mt: { x: number; y: number; s: number; o: number }[] = [];
  [
    { o: om, op: 1 - tm },
    { o: om + 1, op: tm },
  ].forEach(({ o, op }) => {
    if (op < 0.01) return;
    const S = 640 / Math.pow(2, o);
    const ox = ((((o * 173) % 640) + 640) % 640) - 320;
    const oy = ((((o * 311) % 640) + 640) % 640) - 320;
    const x0 = Math.floor((v.x0 - ox) / S) * S + ox;
    const y0 = Math.floor((v.y0 - oy) / S) * S + oy;
    for (let y = y0; y < v.y1; y += S) for (let x = x0; x < v.x1; x += S) mt.push({ x, y, s: S, o: op });
  });
  return (
    <>
      {w < 0.999 ? <MapStack cam={cam} /> : null}
      <AbsoluteFill style={{ opacity: w }}>
        {tiles.map((t) => (
          <Img
            key={t.f}
            src={staticFile(`tlax-host/${t.f}`)}
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: t.W,
              height: t.H,
              transformOrigin: "0 0",
              transform: `translate(${(tx + t.x0 * k).toFixed(3)}px, ${(ty + t.y0 * k).toFixed(3)}px) scale(${(k / L.s).toFixed(6)})`,
            }}
          />
        ))}
        <div
          style={{ position: "absolute", left: 0, top: 0, width: FRAME_W, height: FRAME_H, transformOrigin: "0 0", transform: `translate(${tx}px, ${ty}px) scale(${k})`, opacity: 0.9 }}
        >
          {mt.map((t, i) => (
            <Img key={`hm-${i}`} src={staticFile("manchuria/mottle.png")} style={{ position: "absolute", left: t.x, top: t.y, width: t.s * 1.002, height: t.s * 1.002, opacity: t.o }} />
          ))}
        </div>
      </AbsoluteFill>
    </>
  );
};
