// workOfBillionsWorld: the pure world and camera of cut 45 WorkOfBillions (rsi-ten-earths, revision 1). No React, so
// the check script (scripts/clips/rsi-ten-earths/check-work-of-billions.ts) imports it under bun.
//
// UNITS: the cast's (U = 178 per metre). X across (the vanishing point's column is X = 0), Y height (the street and the
// ground storey's floor are Y = 0, up is -Y), Z depth (the hero's row is Z = 0; toward the camera is -Z).
// THE CAMERA: a shift-lens eye (verticals stay vertical, as the kit's one-point stage): focal F px, the eye at
// (0, -He, -Dr); a point projects to x = 540 + X F / d, y = yh + (Y + He) F / d with d = Dr + Z, yh the horizon row.
// The whole climb is ONE log zoom lambda(f) (lnDr = lnDr0 + lambda): every x10 reads as the same jump.
export const FPS = 24000 / 1001;
export const DURATION = 149;
export const F = 1100;
export const U = 178;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const sst = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * (3 - 2 * u);
};
export const hash01 = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};
/** monotone cubic through keys (one-sided end slopes) */
export const pchipOf = (keys: [number, number][]) => {
  const xs = keys.map((q) => q[0]);
  const ys = keys.map((q) => q[1]);
  const n = xs.length;
  const d = xs.slice(0, -1).map((_, i) => (ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = xs.map((_, i) => {
    if (i === 0) return d[0];
    if (i === n - 1) return d[n - 2];
    if (d[i - 1] * d[i] <= 0) return 0;
    const w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1]);
    const w2 = xs[i + 1] - xs[i] + 2 * (xs[i] - xs[i - 1]);
    return (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  });
  return (x: number) => {
    if (x <= xs[0]) return ys[0] + m[0] * (x - xs[0]);
    if (x >= xs[n - 1]) return ys[n - 1] + m[n - 1] * (x - xs[n - 1]);
    let i = 0;
    while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i];
    const t = (x - xs[i]) / h;
    const t2 = t * t;
    const t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
};

// ===================================================================================================================
// THE OFFICE (the ground storey of the hero's building)
// ===================================================================================================================
/** the hero robot's hips over the floor at (HERO_X, 0): seat "left" (it faces +X), its desk at HERO_X + 114.5 */
export const HERO_X = 61;
export const PITCH_X = 520;
export const PITCH_Z = 320;
export const NROWS = 14;
export const COL0 = -7;
export const COL1 = 6;
/** odd rows are staggered by half a pitch, so no robot sits straight behind another */
export const rowZ = (j: number) => j * PITCH_Z;
export const colX = (c: number, j: number) => HERO_X + c * PITCH_X + (j % 2 === 1 ? PITCH_X / 2 : 0);
/** the desk's centre from the robot (Desk seat "left": X = at + DESK.d / 2 + 52) */
export const DESK_DX = 125 / 2 + 52;
/** structural pillars (0.95 m square) in the gaps between columns, every third gap, every fourth row */
export const PILLAR_W = 190;
export const pillarX = (m: number) => HERO_X - 112 - PILLAR_W / 2 + 1560 * m;
export const PILLAR_M = [-2, -1, 0, 1, 2];
export const PILLAR_ROWS = [0, 4, 8, 12];
/** the hero's pillar, the wall planner on its face toward the window */
export const HERO_PILLAR = { x0: pillarX(0) - PILLAR_W / 2, x1: pillarX(0) + PILLAR_W / 2, z0: -PILLAR_W / 2, z1: PILLAR_W / 2 };
export const PLANNER = { x0: HERO_PILLAR.x0 + 10, x1: HERO_PILLAR.x1 - 10, y0: -350, y1: -142, z: HERO_PILLAR.z0 - 1, font: 64, yText: -284 };
/** the live columns of the hero's row (the module's Desk + live robots); the rest of the office is the canvas tier */
export const LIVE_COLS = [-2, -1, 0, 1, 2];

// ---- the building ----------------------------------------------------------------------------------------------------
export const Z_GLASS = -320;
export const Z_FACADE = -340;
export const X_B0 = -3800;
export const X_B1 = 3800;
export const X_I0 = -3720;
export const X_I1 = 3720;
export const Z_BACK = 4500;
export const Z_BB = 4580;
/** storeys, numbered from the hero's (0): its floor a double-height office (7 m floor to floor, 6.4 m to the
 *  ceiling) on the 5th floor; four storeys of 4.4 m below it down to the street, nine above it to the roof */
export const SP0 = 1246;
export const SP = 783;
export const CH0 = 1140;
export const CH = 641;
export const STOREY_MIN = -4;
export const STOREY_MAX = 9;
export const NSTOREYS = STOREY_MAX + 1;
export const storeyFloor = (i: number) => (i === 0 ? 0 : i < 0 ? -i * SP : -(SP0 + (i - 1) * SP));
export const storeyCeil = (i: number) => storeyFloor(i) - (i === 0 ? CH0 : CH);
/** the roof's Y (up is -Y, from the hero's floor) */
export const H_BLD = SP0 + (NSTOREYS - 1) * SP;
/** the street (and every other building's base): Y = YS, below the hero's floor */
export const YS = storeyFloor(STOREY_MIN);
/** the street-level storey's glass starts over a low plinth */
export const SILL0 = YS - 36;
/** the glass of storey i: from its ceiling down to its floor (the street storey's to the plinth) */
export const glassBottom = (i: number) => (i === STOREY_MIN ? SILL0 : storeyFloor(i));
/** mullions every 3 m, none straight in front of the hero at f0 */
export const MULLION_PITCH = 534;
export const mullionXs = () => {
  const out: number[] = [];
  for (let x = -267 - MULLION_PITCH * 7; x <= X_B1; x += MULLION_PITCH) if (x > X_B0 + 40 && x < X_B1 - 40) out.push(x);
  return out;
};

// ===================================================================================================================
// THE CITY (blocks of 3 x 3 lots; the hero's building is the front-centre lot of block (0, 0))
// ===================================================================================================================
export const LOT = 8010;
export const STREET = 3560;
export const BLOCK = 3 * LOT;
export const BPITCH = BLOCK + STREET;
/** block (0, 0) starts at the facade line; lot columns 0..2 left to right, lot rows 0..2 front to back */
export const blockX0 = (bx: number) => bx * BPITCH - BLOCK / 2;
export const blockZ0 = (bz: number) => Z_FACADE + bz * BPITCH;
export const CITY_R = 15000 * U;
/** a lot's building: footprint, height (units), storey height, look seed; null = an empty lot (a square, a yard) */
export type Bld = { x0: number; x1: number; z0: number; z1: number; h: number; sh: number; seed: number };
const centreDist = (x: number, z: number) => Math.hypot(x, z - 2400 * U * 0);
/** is block (bx, bz) part of the city (an irregular disc thinning out at its edge) */
export const blockAlive = (bx: number, bz: number) => {
  const x = bx * BPITCH;
  const z = blockZ0(bz) + BLOCK / 2;
  const r = centreDist(x, z);
  const a = Math.atan2(z, x);
  const edge = CITY_R * (0.82 + 0.12 * Math.sin(3 * a + 1.3) + 0.08 * Math.sin(7 * a + 0.4));
  if (r > edge * 1.12) return false;
  const p = sst(edge * 0.72, edge * 1.12, r);
  return hash01(bx * 71.3 + bz * 13.7 + 5.1) > p * 0.92;
};
/** the eye height over the ground when the eye is at distance Dr (for the clearance cap of the blocks in front) */
let heAt: ((Dr: number) => number) | null = null;
export const lotBuilding = (bx: number, bz: number, lx: number, lz: number): Bld | null => {
  if (bx === 0 && bz === 0 && lx === 1 && lz === 0) return null; // the hero's building, drawn on its own
  const seed = bx * 1013.1 + bz * 377.7 + lx * 31.3 + lz * 7.9;
  const x0l = blockX0(bx) + lx * LOT;
  const z0l = blockZ0(bz) + lz * LOT;
  const xc = x0l + LOT / 2;
  const zc = z0l + LOT / 2;
  const r = centreDist(xc, zc);
  if (hash01(seed + 0.7) < 0.07 + 0.25 * sst(0.5 * CITY_R, CITY_R, r)) return null;
  // the frontage: setbacks 2-6 m, sometimes the whole lot
  const sx0 = (0.4 + 0.6 * hash01(seed + 1.1)) * 900;
  const sx1 = (0.4 + 0.6 * hash01(seed + 2.3)) * 900;
  const sz0 = bx === 0 && bz === 0 && lz === 0 ? 0 : (0.3 + 0.7 * hash01(seed + 3.7)) * 1000;
  const sz1 = (0.3 + 0.7 * hash01(seed + 4.9)) * 1300;
  // the height: a downtown round the hero's district thinning out to low suburbs, a few towers
  const base = 3200 + 9500 * Math.exp(-Math.pow(r / (3200 * U), 2)) + 2400 * Math.exp(-Math.pow(r / (8000 * U), 2));
  let h = base * (0.55 + 0.9 * hash01(seed + 5.3));
  if (hash01(seed + 6.1) > 0.94 && r < 4500 * U) h *= 2.2 + hash01(seed + 7.7);
  // the blocks in front of the hero's building stay under the camera's climb. The cap loosens with distance from the
  // hero: along the eye's line from 0.55 of the eye's height (where it passes the lot's back edge, lowest) at the
  // hero's street to 0.95 three rows out, and across, away from the line it flies (x 0), to no cap at all two lots out
  // (the eye never passes over those) -- so the front rows ramp up into the city behind instead of a squat band
  // meeting the hero's row at one line
  if (bz < 0 && heAt) {
    const Dr = -(z0l + LOT - sz1) - 400; // the camera passes over the lot's back edge first, lower
    if (Dr > 0) {
      const q = (Z_FACADE - STREET - (z0l + LOT - sz1)) / BPITCH; // rows out from the hero's street (row -1's back ~0)
      const bx0 = x0l + sx0;
      const bx1 = x0l + LOT - sx1;
      const gap = bx0 > 0 ? bx0 : bx1 < 0 ? -bx1 : 0; // the lot's clearance from the eye's line
      const capH = (0.55 + 0.4 * sst(0, 2.6, q)) * (heAt(Dr) + YS);
      const wLat = sst(0.5 * LOT, 2 * LOT, gap);
      if (h > capH) h = capH + (h - capH) * wLat;
    }
  }
  if (bz === 0 && Math.abs(bx) <= 0) h = Math.min(h, 1.15 * (H_BLD + YS));
  h = Math.max(1800, h);
  return { x0: x0l + sx0, x1: x0l + LOT - sx1, z0: z0l + sz0, z1: z0l + LOT - sz1, h, sh: hash01(seed + 8.3) > 0.5 ? 712 : 640, seed };
};

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
export const DR0 = 660;
/** the log-zoom speed (d lambda / d frame): eases in from f0, peaks through the city (~f80), decelerates over the globe
 *  reveal (~f88-104), then a creep to the last frame */
const V_KEYS: [number, number][] = [
  [0, 0.012],
  [8, 0.03],
  [20, 0.058],
  [34, 0.08],
  [48, 0.098],
  [60, 0.13],
  [70, 0.18],
  [79, 0.235],
  [85, 0.24],
  [88, 0.215],
  [91, 0.17],
  [95, 0.095],
  [100, 0.022],
  [104, 0.0045],
  [112, 0.0022],
  [148, 0.0018],
];
const vAt = pchipOf(V_KEYS);
const LAMBDA: number[] = (() => {
  const out = [0];
  const N = 16;
  let acc = 0;
  for (let f = 0; f < DURATION + 2; f++) {
    for (let i = 0; i < N; i++) acc += Math.max(0, vAt(f + (i + 0.5) / N)) / N;
    out.push(acc);
  }
  return out;
})();
/** the log zoom at frame f (continuous, fractional frames interpolated) */
export const lambdaAt = (f: number) => {
  const g = Math.max(0, Math.min(DURATION + 1, f));
  const i = Math.floor(g);
  return LAMBDA[i] + (LAMBDA[i + 1] - LAMBDA[i]) * (g - i);
};
/** the swap under the cloud (the air layer hides it: the city below, the planet after) */
export const F_SWAP = 84;
export const LAMBDA_SWAP = lambdaAt(F_SWAP);

/** the eye's height over the street, by lambda: at eye level outside the window, a crane up inside the double-height
 *  opening (the floor of robots), up past the storeys to over the roof, then the city from ~half the distance up */
const LN_HE = pchipOf([
  [0, Math.log(285)],
  [0.45, Math.log(310)],
  [0.95, Math.log(560)],
  [1.5, Math.log(930)],
  [2.05, Math.log(1600)],
  [2.65, Math.log(4300)],
  [3.25, Math.log(DR0 * Math.exp(3.25) * 0.5)],
  [3.8, Math.log(DR0 * Math.exp(3.8) * 0.6)],
  [4.6, Math.log(DR0 * Math.exp(4.6) * 0.6)],
  [6.0, Math.log(DR0 * Math.exp(6.0) * 0.55)],
  [9.0, Math.log(DR0 * Math.exp(9.0) * 0.5)],
]);
/** the zoom's fixed point (world Y, Z and its screen row): the hero's face, then the facade's middle, then the ground of
 *  the hero's block */
const AY = pchipOf([
  [0, -226],
  [1.2, -226],
  [2.2, -420],
  [3.0, -1600],
  [3.7, -2600],
  [4.6, -500],
  [5.6, YS],
  [9, YS],
]);
const AZ = pchipOf([
  [0, 0],
  [1.2, 0],
  [2.2, -120],
  [3.0, -340],
  [3.7, -340],
  [4.6, 2000],
  [5.6, 9000],
  [9, 9000],
]);
const AYS = pchipOf([
  [0, 700],
  [1.0, 712],
  [2.0, 760],
  [3.0, 800],
  [3.7, 790],
  [5.0, 800],
  [9, 800],
]);
export type Eye = { He: number; Dr: number; yh: number; lam: number };
export const eyeAtLambda = (lam: number): Eye => {
  const Dr = DR0 * Math.exp(lam);
  const He = Math.exp(LN_HE(lam));
  const Ya = AY(lam);
  const Za = AZ(lam);
  const ya = AYS(lam);
  const yh = ya - ((Ya + He) * F) / (Dr + Za);
  return { He, Dr, yh, lam };
};
heAt = (Dr: number) => Math.exp(LN_HE(Math.log(Dr / DR0)));
export const eyeAt = (f: number): Eye => eyeAtLambda(Math.min(lambdaAt(f), lambdaAt(F_SWAP + 4)));
/** a world point on screen: [x, y, s (px per unit)] or null behind the near plane */
export const project = (e: Eye, X: number, Y: number, Z: number): [number, number, number] | null => {
  const d = e.Dr + Z;
  if (d < 1) return null;
  const s = F / d;
  return [540 + X * s, e.yh + (Y + e.He) * s, s];
};

// ===================================================================================================================
// THE GLOBE (after the swap): the same zoom carries on, the planet shrinking to its rest size
// ===================================================================================================================
/** the globe's radius: the same zoom carries on; 335 px at f100 (its bottom held at y 1040, clear of the caption
 *  bands, the plate above it), then a slow pull-back to the end */
export const R_100 = 335;
export const lam148 = lambdaAt(DURATION - 1);
export const globeR = (f: number) => R_100 * Math.exp(lambdaAt(100) - lambdaAt(f));
export const R_END = globeR(DURATION - 1);
/** the globe's lowest row on screen (held there from the swap on: above the caption bands) */
export const GLOBE_BOTTOM = 1040;
/** the city under the climb (Chongqing, ~30 M) under the anchor at the swap; the planet turns to its rest face */
export const CITY_LONLAT: [number, number] = [106.55, 29.56];
export const FACE_END = { lon: 99, lat: 24 };
/** the slow turn (deg per frame) */
export const SPIN = 0.11;
const D2R = Math.PI / 180;
/** the planet on screen at frame f (a GlobeSpec for tenEarthsGlobe's drawGlobe) */
export const globeAt = (f: number) => {
  const u = sst(F_SWAP, 106, f);
  const r = globeR(f);
  const cy = GLOBE_BOTTOM - r;
  // at the swap the city we left sits near the anchor row (y 800): the face is turned north of it, by as much as fits
  const th = Math.asin(Math.max(-0.95, Math.min(0.95, (800 - cy) / r))) / D2R;
  const lat0 = Math.min(72, CITY_LONLAT[1] + th);
  return {
    cx: 540,
    cy,
    r,
    lon: CITY_LONLAT[0] + (FACE_END.lon - CITY_LONLAT[0]) * u + SPIN * (f - F_SWAP),
    lat: lat0 + (FACE_END.lat - lat0) * u,
  };
};
/** the plate "2.5 billion": its centre row rides just above the globe (never above y 328: its text stays in the keep-in) */
export const PLATE_SIZE = 104;
export const plateY = (f: number) => Math.max(328, GLOBE_BOTTOM - 2 * globeR(Math.max(f, PLATE_F0 + PLATE_DUR)) - 64);

// ===================================================================================================================
// THE WORDS
// ===================================================================================================================
export const WORDS: [string, number][] = [
  ["2030", 0],
  ["there", 14],
  ["will", 22],
  ["be", 24],
  ["enough", 27],
  ["compute", 35],
  ["for", 44],
  ["AIs", 52],
  ["to", 63],
  ["do", 67],
  ["the", 69],
  ["work", 73],
  ["of", 79],
  ["about", 83],
  ["2", 90],
  [".5", 95],
  ["billion", 105],
  ["full", 115],
  ["-time", 125],
  ["human", 131],
  ["workers", 138],
];
/** "2.5 billion": the plate's entrance (slides up while fading in), landed before "billion" */
export const PLATE_F0 = 97;
export const PLATE_DUR = 12;
