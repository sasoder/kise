// ---------------------------------------------------------------------------
// waiverMotion: the pure motion model of WaiverRunsOut (scott-nolan-fuel, cut 30): the sea lane, the convoy's timing, the cut-off,
// the drain, the US layout. No React, no fonts, so it also runs under bun for timing printouts. World units as in nuclearWorld.
// ---------------------------------------------------------------------------
// @ts-expect-error untyped module
import { geoProjection } from "d3-geo";

export type V3 = [number, number, number];
export const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const glide = (a: number, b: number, f: number) => {
  const t = c01((f - a) / (b - a));
  return t * t * t * (t * (t * 6 - 15) + 10);
};

/** nuclearWorld's mapProjectTall, restated so this file needs no stage (WaiverRunsOut asserts the two agree at load) */
const projTall = (() => {
  const p = geoProjection((l: number, f: number) => [l, 1.25 * Math.log(Math.tan(Math.PI / 4 + 0.4 * f))]).rotate([-10, 0]).scale(1).translate([0, 0]).precision(0.2);
  const span = p([150, 0])[0] - p([-130, 0])[0];
  p.scale(1000 / span);
  const c = p([10, 16]);
  p.translate([-c[0], -c[1]]);
  return p;
})();
export const projectTall = (lon: number, lat: number): [number, number] => {
  const q = projTall([lon, lat]);
  return [q[0], -q[1]];
};

export const LAND_Y = 3.4; // nuclearWorld's slabTop() (WaiverRunsOut asserts the two agree)

// ===================================================================================================================
// THE US END, laid out square to the camera (yaw US_YAW): R = screen right, F = into the picture, in units of US_M. The empty
// slot sits centre front; the reactors stand round it (two SMRs either side, one behind right, the gigawatt plant behind left).
// The convoy ends at a receiving depot on the water off the Delmarva coast, a twin of St Petersburg's.
// ===================================================================================================================
const D2R = Math.PI / 180;
export const US_YAW = 67;
export const US_R: [number, number] = [Math.cos(US_YAW * D2R), -Math.sin(US_YAW * D2R)];
export const US_F: [number, number] = [Math.sin(US_YAW * D2R), Math.cos(US_YAW * D2R)];
export const US_M = 1.6;
export const SMR_SCALE = 0.24 * US_M;
/** the plant clearly the big one: containment 116 tall, 72 across at scale 1; an SMR 31.3 tall, 25 across */
export const GW_SCALE = 0.43 * SMR_SCALE; // containment ~1.6x a dome's height (1.25x its width), tower ~2.2x the containment
/** the group's centre on the land (world x, Z): the slot */
export const US_C: [number, number] = [-336, 86.5];
export const usAt = (r: number, f: number): [number, number] => [US_C[0] + (US_R[0] * r + US_F[0] * f) * US_M, US_C[1] + (US_R[1] * r + US_F[1] * f) * US_M];
export const SLOT_RF: [number, number] = [0, 0];
export const SLOT_W = 10.5 * US_M; // along R
export const SLOT_D = 7.5 * US_M; // along F
export const SMR_RF: [number, number][] = [
  [12, -4],
  [5, 11],
  [-6, 11],
];
export const GW_RF: [number, number] = [-14, 3];
/** the receiving depot in the mouth of Chesapeake Bay, just right of the group, clear of the domes: the lane's last stretch runs up the coast
 * toward it (screen right to left, so the queue reads nose to tail across the picture); its door faces down the lane, its back
 * to the Delmarva shore */
export const DEPOT_SCALE = 3.6;
export const DEPOT_W = 3.2 * DEPOT_SCALE; // the v1 DEPOT.W, scaled
export const US_DOOR_XZ: [number, number] = usAt(18, 8);
/** the straight run in: from APPROACH units down the lane (south-east, open water) up to the door */
export const APPROACH = 70;
export const usApproach = (k: number): [number, number] => [US_DOOR_XZ[0] + US_R[0] * k, US_DOOR_XZ[1] + US_R[1] * k];

// ===================================================================================================================
// THE SEA LANE. Real waypoints (lon, lat): St Petersburg, out of the Gulf of Finland, the Baltic, the Sound and the Kattegat,
// round Skagen, the North Sea, the Channel, the Atlantic, swinging south and up the US coast to the receiving depot. Smoothed
// (centripetal Catmull-Rom), arc-length tabled.
// ===================================================================================================================
export const LANE_LONLAT: [number, number][] = [
  [27.7, 60.27], // the depot door, St Petersburg (the depot stands on the water at the head of the slab's Gulf, its back to the coast)
  [27.0, 60.27],
  [26.2, 60.2],
  [25.2, 60.0],
  [24.2, 59.78],
  [23.0, 59.48],
  [21.2, 58.9],
  [19.9, 57.9],
  [18.0, 56.3],
  [15.6, 55.25],
  [13.2, 55.35],
  [12.7, 55.95],
  [11.6, 57.05],
  [10.7, 57.85],
  [9.0, 57.7],
  [6.0, 56.4],
  [3.4, 54.0],
  [1.9, 51.4],
  [0.2, 50.3],
  [-3.5, 49.6],
  [-6.5, 48.6],
  [-14, 46.4],
  [-28, 42.0],
  [-44, 36.5],
  [-56, 30.5],
  [-62, 28.2],
];
const catmull = (pts: [number, number][], n: number) => {
  // centripetal Catmull-Rom through the points, n samples
  const P = [pts[0].map((v, i) => 2 * v - pts[1][i]) as [number, number], ...pts, pts[pts.length - 1].map((v, i) => 2 * v - pts[pts.length - 2][i]) as [number, number]];
  const segs = pts.length - 1;
  const out: [number, number][] = [];
  const tj = (ti: number, a: [number, number], b: [number, number]) => ti + Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), 0.5) + 1e-6;
  for (let i = 0; i <= n; i++) {
    const u = (i / n) * segs;
    const k = Math.min(segs - 1, Math.floor(u));
    const tt = u - k;
    const [p0, p1, p2, p3] = [P[k], P[k + 1], P[k + 2], P[k + 3]];
    const t0 = 0;
    const t1 = tj(t0, p0, p1);
    const t2 = tj(t1, p1, p2);
    const t3 = tj(t2, p2, p3);
    const t = t1 + (t2 - t1) * tt;
    const L = (a: [number, number], b: [number, number], ta: number, tb: number) => [((tb - t) / (tb - ta)) * a[0] + ((t - ta) / (tb - ta)) * b[0], ((tb - t) / (tb - ta)) * a[1] + ((t - ta) / (tb - ta)) * b[1]] as [number, number];
    const A1 = L(p0, p1, t0, t1);
    const A2 = L(p1, p2, t1, t2);
    const A3 = L(p2, p3, t2, t3);
    const B1 = L(A1, A2, t0, t2);
    const B2 = L(A2, A3, t1, t3);
    out.push(L(B1, B2, t1, t2));
  }
  return out;
};
const LANE_N = 3000;
export const LANE = (() => {
  const pts = catmull([...LANE_LONLAT.map(([lo, la]) => projectTall(lo, la)), usApproach(APPROACH), usApproach(APPROACH * 0.5), usApproach(18), US_DOOR_XZ], LANE_N);
  const xs = pts.map((p) => p[0]);
  const zs = pts.map((p) => p[1]);
  const ss: number[] = [0];
  for (let i = 1; i <= LANE_N; i++) ss.push(ss[i - 1] + Math.hypot(xs[i] - xs[i - 1], zs[i] - zs[i - 1]));
  return { xs, zs, ss, length: ss[LANE_N], n: LANE_N };
})();
/** arc length -> [x, z] and the unit tangent [tx, tz] (beyond the ends it extends straight) */
export const laneAt = (s: number) => {
  const { xs, zs, ss, length } = LANE;
  const sc = Math.max(0, Math.min(length, s));
  let lo = 0;
  let hi = LANE_N;
  while (hi - lo > 1) {
    const m = (lo + hi) >> 1;
    if (ss[m] <= sc) lo = m;
    else hi = m;
  }
  const t = (sc - ss[lo]) / Math.max(1e-6, ss[hi] - ss[lo]);
  const x = lerp(xs[lo], xs[hi], t);
  const z = lerp(zs[lo], zs[hi], t);
  const a = Math.max(0, lo - 3);
  const b = Math.min(LANE_N, hi + 3);
  const dx = xs[b] - xs[a];
  const dz = zs[b] - zs[a];
  const l = Math.hypot(dx, dz) || 1;
  const over = s - sc;
  return { x: x + (dx / l) * over, z: z + (dz / l) * over, tx: dx / l, tz: dz / l };
};
/** the arc length of the lane point nearest to (x, z) */
export const laneSOf = (x: number, z: number) => {
  let best = 0;
  let bd = 1e9;
  for (let i = 0; i <= LANE_N; i++) {
    const d = (LANE.xs[i] - x) ** 2 + (LANE.zs[i] - z) ** 2;
    if (d < bd) {
      bd = d;
      best = i;
    }
  }
  return LANE.ss[best];
};

// ===================================================================================================================
// THE CONVOY. One size of cylinder (30B, 2.7 : 1), exaggerated so it reads in the wide view. St Petersburg releases one every
// SPACING frames, a steady busy stream; every cylinder runs at one speed V the whole way, on the water, into the US receiving
// depot (cut at its door).
// THE CUT-OFF is at the source, on "that" (f68): the last one leaves at LAST_RELEASE and nothing follows; the depot's warm
// door light goes out as it leaves and the door shutters. The stream's tail pulls away from Russia, the lane behind it drains
// to board dim, and the tail runs into the US depot by ~f120.
// ===================================================================================================================
export const CYL_ASPECT = 2.7;
export const CYL_D = 4.1;
export const CYL_L = CYL_D * CYL_ASPECT;
export const LIFT = 0.35 * US_M; // travelling: one level up off the water
export const L_END = LANE.length;
export const V = 9.5;
export const SPACING = 7; // frames between releases: ~7 on the route at once
export const SP = V * SPACING; // units between cylinders
export const travelY = (moving = 1) => CYL_D / 2 + LIFT * moving;

// --- the beats
export const LAST_RELEASE = 67; // "that" (f68): the last one out of St Petersburg; nothing after it
export const LIGHT_F0 = 67; // the depot's door light goes out as the last one leaves
export const LIGHT_F1 = 72;
export const lightAt = (f: number) => 1 - glide(LIGHT_F0, LIGHT_F1, f);
export const SHUT_F0 = 70; // then the dispatch door shutters
export const SHUT_F1 = 79;
export const shutAt = (f: number) => glide(SHUT_F0, SHUT_F1, f);
export const AHEAD = 19; // the ones released before the last (j < 0); the first of them is already past the US door at f0
export const releaseOf = (j: number) => LAST_RELEASE + j * SPACING; // j = 0 the last, j < 0 ahead of it
/** the frame a cylinder j passes s */
export const passFrame = (j: number, s: number) => releaseOf(j) + s / V;
/** the frame the last one is wholly inside the US depot */
export const LAST_IN = passFrame(0, L_END + CYL_L / 2);

export type Cyl = { s: number; v: number; moving: number };
/** cylinder j: one speed from the St Petersburg door into the US depot */
export const cylAt = (j: number, f: number): Cyl => ({ s: V * (f - releaseOf(j)), v: V, moving: 1 });
/** the drain follows the stream's tail from St Petersburg to the US door */
export const laneLit = (s: number, f: number) => 1 - smooth(0, 12, f - (passFrame(0, s) + 3));
