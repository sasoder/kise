import { clamp01, makeRoute, pchip, project, smootherstep, type Cam, type P2 } from "./cortesShared";

// ---------------------------------------------------------------------------
// threeYearsMotion: the clocks of ThreeYearsBefore (no React): the route of
// Cortés's fleet, the ship's place on it, the camera, the year.
// ---------------------------------------------------------------------------
export const FPS = 24000 / 1001;
export const DURATION = 52;

// ---- the voyage (lon, lat), February-April 1519, as one smooth line ---------
// Trinidad on Cuba's south coast, west past the Isla de Pinos, round Cabo San
// Antonio, through the Yucatan Channel north of Cabo Catoche, round the
// peninsula, down the Bay of Campeche to the anchorage of San Juan de Ulua.
// (The call at Cozumel and the fight at Potonchan are left out: at this scale
// they are kinks, not legs.)
const WAY: [number, number][] = [
  [-79.98, 21.76],
  [-80.9, 21.42],
  [-82.9, 21.2],
  [-85.15, 21.55],
  [-86.9, 22.2],
  [-89.2, 22.35],
  [-91.5, 21.8],
  [-93.3, 20.35],
  [-94.7, 19.72],
  [-95.72, 19.3],
];
const catmull = (pts: P2[], per = 28): P2[] => {
  const out: P2[] = [];
  const at = (i: number) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  for (let i = 0; i < pts.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([0, 1].map((c) => 0.5 * (2 * p1[c] + (-p0[c] + p2[c]) * t + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * t2 + (-p0[c] + 3 * p1[c] - 3 * p2[c] + p3[c]) * t3)) as P2);
    }
  }
  out.push(pts[pts.length - 1]);
  return out;
};
export const VOYAGE = makeRoute({ pts: catmull(WAY.map(([lon, lat]) => project(lon, lat))), wpS: [], len: 0 });

/** Texcoco, on the east shore of the lake */
export const TEXCOCO = project(-98.88, 19.51);

// ---- the ship: already at sea off Yucatan's north-west corner on frame 0, at anchor by ARRIVE ----
export const ARRIVE = 38;
/** arclength (world px) the ship's bow has behind it on frame 0 */
export const S_START = VOYAGE.len - 205;
const FLAT = 0.58; // the share of the passage at full speed; the rest is the run-out into the anchorage
/** the bow's arclength on the route */
export const shipS = (f: number) => {
  const t = f / ARRIVE;
  const total = FLAT + (1 - FLAT) / 2;
  let g: number;
  if (t <= FLAT) g = t / total; // extrapolates backwards before frame 0 at the same speed
  else if (t >= 1) g = 1;
  else {
    const x = (t - FLAT) / (1 - FLAT);
    g = (FLAT + (1 - FLAT) * (x / 2 + Math.sin(Math.PI * x) / (2 * Math.PI))) / total;
  }
  return S_START + (VOYAGE.len - S_START) * g;
};
/** 1 under way .. 0 at anchor */
export const wayAt = (f: number) => clamp01((shipS(f + 0.5) - shipS(f - 0.5)) / ((VOYAGE.len - S_START) / (ARRIVE * (FLAT + (1 - FLAT) / 2))));

// ---- the camera: tight on the western Gulf; drifts west with the ship and pushes in, never at rest -----
// It follows a share of the ship's own travel (so the ship always gains on the
// frame and both slow together into the anchorage) plus a slow creep that
// carries on through the hold. Zoom stays above the map's 1.36-1.52 crossfade band.
const P0 = VOYAGE.pointAt(S_START);
const P1 = VOYAGE.pointAt(VOYAGE.len);
const K0 = 1.53;
const K1 = 1.72;
const LK = pchip([
  [0, Math.log(K0)],
  [20, Math.log(1.62)],
  [38, Math.log(1.69)],
  [51, Math.log(K1)],
]);
/** the bow's screen position on frame 0 and on the last frame */
const BOW0: P2 = [668, 905];
const BOW1: P2 = [500, 957];
const CREEP: P2 = [-0.25, 0.08]; // world px per frame
const C0: P2 = [P0[0] - (BOW0[0] - 540) / K0, P0[1] - (BOW0[1] - 960) / K0];
const C1: P2 = [P1[0] - (BOW1[0] - 540) / K1, P1[1] - (BOW1[1] - 960) / K1];
const SHARE: P2 = [0, 1].map((c) => (C1[c] - C0[c] - CREEP[c] * (DURATION - 1)) / (P1[c] - P0[c])) as P2;
export const cameraAt = (f: number): Cam => {
  const p = VOYAGE.pointAt(shipS(f));
  return { k: Math.exp(LK(f)), cx: C0[0] + SHARE[0] * (p[0] - P0[0]) + CREEP[0] * f, cy: C0[1] + SHARE[1] * (p[1] - P0[1]) + CREEP[1] * f };
};

// ---- the year: 1516 -> 1519, the units wheel rolling one year at a time -----
// each roll eases out of one year and into the next (a still near a boundary
// reads a whole year); 1519 settles as the ship comes to anchor
const ROLLS: [number, number][] = [
  [4, 13],
  [15, 24],
  [27, 36],
];
export const yearAt = (f: number) => 1516 + ROLLS.reduce((s, [a, b]) => s + smootherstep((f - a) / (b - a)), 0);
/** the four wheels (units first): only the units wheel turns */
export const columnsAt = (f: number) => [yearAt(f) - 1510, 1, 5, 1];
