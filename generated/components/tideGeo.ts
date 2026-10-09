// ClosedWorldsTide: the chart's projection and the sea routes, hand-written (no
// generated data), so the camera, the build script and the motion all share it.
// North-up Mercator, 9 world px per degree of longitude, the SAME world as
// texcocoAtlanticMapData (Tenochtitlan at (130, 980)), carried on east to New
// Zealand: world px == screen px at camera k 1.
export type P2 = [number, number];

export const PROJ = { scale: 515.662015617741, translate: [1022.1970000000001, 1158.3691146749165] as P2 };
export const P = (lon: number, lat: number): P2 => [
  PROJ.translate[0] + (PROJ.scale * lon * Math.PI) / 180,
  PROJ.translate[1] - PROJ.scale * Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)),
];
export const lonLatOf = ([x, y]: P2): P2 => [
  (((x - PROJ.translate[0]) / PROJ.scale) * 180) / Math.PI,
  ((2 * Math.atan(Math.exp((PROJ.translate[1] - y) / PROJ.scale)) - Math.PI / 2) * 180) / Math.PI,
];

/** the ring of their world: Tenochtitlan, radius 5.11 deg */
export const RING_C: P2 = [130, 980];
export const RING_R = 46;
/** phase 1 is a pure zoom about this screen point, from K0 */
export const PIVOT: P2 = [78.75, 988.75];
export const K0 = 9;
export const VERACRUZ: P2 = P(-96.13, 19.2);

export const PORTS_LL = {
  sydney: [151.3, -33.86],
  hobart: [147.42, -43.02],
  melbourne: [144.9, -38.1],
  brisbane: [153.3, -27.35],
  adelaide: [138.35, -34.95],
  perth: [115.68, -32.05],
  auckland: [174.95, -36.75],
  christchurch: [172.85, -43.6],
} as const;
export type PortKey = keyof typeof PORTS_LL;
export const PORTS = Object.fromEntries(Object.entries(PORTS_LL).map(([k, ll]) => [k, P(ll[0], ll[1])])) as Record<PortKey, P2>;

// ---- routes: Catmull-Rom through waypoints, with arclength --------------------------
export type Route = { pts: P2[]; cum: number[]; len: number };
export const routeOf = (way: P2[], step = 3): Route => {
  const ext: P2[] = [[2 * way[0][0] - way[1][0], 2 * way[0][1] - way[1][1]], ...way, [2 * way[way.length - 1][0] - way[way.length - 2][0], 2 * way[way.length - 1][1] - way[way.length - 2][1]]];
  const pts: P2[] = [way[0]];
  const knot = (p: P2, q: P2) => Math.pow(Math.hypot(q[0] - p[0], q[1] - p[1]), 0.5) || 1e-6;
  for (let i = 1; i < ext.length - 2; i++) {
    const [p0, p1, p2, p3] = [ext[i - 1], ext[i], ext[i + 1], ext[i + 2]];
    const n = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    const t1 = knot(p0, p1);
    const t2 = t1 + knot(p1, p2);
    const t3 = t2 + knot(p2, p3);
    for (let s = 1; s <= n; s++) {
      const t = t1 + ((t2 - t1) * s) / n;
      const lerp = (A: P2, B: P2, ta: number, tb: number): P2 => [((tb - t) / (tb - ta)) * A[0] + ((t - ta) / (tb - ta)) * B[0], ((tb - t) / (tb - ta)) * A[1] + ((t - ta) / (tb - ta)) * B[1]];
      const A1 = lerp(p0, p1, 0, t1);
      const A2 = lerp(p1, p2, t1, t2);
      const A3 = lerp(p2, p3, t2, t3);
      const B1 = lerp(A1, A2, 0, t2);
      const B2 = lerp(A2, A3, t1, t3);
      pts.push(lerp(B1, B2, t1, t2));
    }
  }
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  return { pts, cum, len: cum[cum.length - 1] };
};
/** the point at arclength s, pushed `lat` px to the left of travel; beyond either end the route runs on straight */
export const routeAt = (r: Route, s: number, lat: number, out: number[]) => {
  const t = Math.max(0, Math.min(r.len, s));
  let lo = 0;
  let hi = r.cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (r.cum[mid] <= t) lo = mid;
    else hi = mid;
  }
  const seg = r.cum[hi] - r.cum[lo] || 1;
  const u = (t - r.cum[lo]) / seg;
  // a smoothed tangent so a column does not kink
  const a = r.pts[Math.max(0, lo - 3)];
  const b = r.pts[Math.min(r.pts.length - 1, hi + 3)];
  const tl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const nx = (b[1] - a[1]) / tl;
  const ny = -(b[0] - a[0]) / tl;
  const over = Math.min(0, s);
  const p0 = r.pts[0];
  const p1 = r.pts[1];
  const d0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1;
  out[0] = r.pts[lo][0] + (r.pts[hi][0] - r.pts[lo][0]) * u + nx * lat + ((p1[0] - p0[0]) / d0) * over;
  out[1] = r.pts[lo][1] + (r.pts[hi][1] - r.pts[lo][1]) * u + ny * lat + ((p1[1] - p0[1]) / d0) * over;
};

// ---- the emigrant route (lon, lat): the Channel, down the African coast, round the
// Cape of Good Hope, east along 40 S across the Indian Ocean to Cape Leeuwin -----------
const TRUNK_LL: P2[] = [
  [-4.2, 50.1], // Plymouth
  [-7.4, 48.0],
  [-13.0, 43.0], // off Finisterre
  [-15.5, 37.0],
  [-21.5, 28.0], // west of the Canaries
  [-23.0, 16.5], // the Cape Verde islands
  [-20.0, 7.0],
  [-11.5, -1.0],
  [-1.0, -13.0],
  [8.0, -26.5],
  [14.6, -35.2],
  [20.5, -38.6], // south of Cape Agulhas
  [40.0, -40.5],
  [70.0, -40.5],
  [98.0, -39.6],
  [110.5, -38.2], // south-west of Cape Leeuwin
];
/** each port's own approach from the end of the trunk (the port itself is appended) */
const BRANCH_LL: Record<PortKey, P2[]> = {
  perth: [[113.6, -35.2], [114.6, -33.2]],
  adelaide: [[120, -37.0], [130, -36.4], [135.6, -36.3], [137.7, -35.6]],
  melbourne: [[120, -38.0], [133, -38.4], [141, -39.2], [144.2, -39.2]],
  hobart: [[120, -39.6], [135, -42.4], [144, -44.4], [147.7, -44.2]],
  sydney: [[120, -38.7], [134, -40.2], [143.6, -39.85], [148.6, -39.3], [150.7, -37.0], [151.75, -35.0]],
  brisbane: [[120, -39.1], [134, -40.7], [143.6, -40.2], [149.2, -39.6], [151.5, -37.0], [153.0, -33.6], [154.1, -29.6]],
  auckland: [[120, -40.4], [135, -43.4], [147, -45.2], [158, -42.0], [168, -36.6], [172.2, -33.9], [174.1, -34.5], [175.45, -35.8]],
  christchurch: [[120, -41.0], [135, -44.2], [147, -46.0], [160, -47.4], [167, -48.0], [169.8, -47.6], [172.0, -46.0], [173.5, -44.3]],
};
export const TRUNK_WAY: P2[] = TRUNK_LL.map(([a, b]) => P(a, b));
export const TRUNK = routeOf(TRUNK_WAY);
export const PORT_ROUTE = Object.fromEntries(
  (Object.keys(BRANCH_LL) as PortKey[]).map((k) => [k, routeOf([...TRUNK_WAY, ...BRANCH_LL[k].map(([a, b]) => P(a, b)), PORTS[k]])]),
) as Record<PortKey, Route>;
