// ---------------------------------------------------------------------------
// pointsAndLinesState: the constants of PointsAndLines (sarah-insurgency, cut 12) that the clip's later China cut
// (cut 40, HornsOfTheDilemma) opens on. Pure data + small helpers on the CHINA world (world px ~ km; x east, z south).
//
// END STATE (f144, "points and lines"): Japan's cream garrisons stand at GARRISONS (one per held town, Garrison
// size GARRISON_SIZE), the cream Wuhan-front block WUHAN_BLOCK_END (Hinomaru sticker) stands at Wuhan, the held
// railways HELD_LINES (kind "rail") are drawn whole, and the cream hold left on the ground is BANDS
// (pointsAndLinesData.ts: thin bands along the held lines + discs at the towns) over a faint orange wash of the land
// between: END_TERRITORY (pass it as the ground's territory, no front). Orange PAWNS (PAWN_SIZE) stand all through the
// countryside between the lines. The camera at the last frame is END_CAM (the damped track at f144; END_KEY is the
// same as a CamKey to re-key from).
// ---------------------------------------------------------------------------
import { CHINA, blockSpec, camTrack, type BlockSpec, type CamKey, type P2, type TerritoryLayer } from "./insurgencyShared";
import { BANDS, HELD_CITIES, HELD_LINES } from "./pointsAndLinesData";

export { BANDS, HELD_CITIES, HELD_LINES };


// ---- the force arriving -------------------------------------------------------------------------------------------
/** where the Japan block stands on Honshu at f0 (western Honshu, by Yamaguchi, 131.6 E 34.25 N) */
export const HONSHU: P2 = CHINA.project(131.6, 34.25);
/** where it lands in North China: in through the Bohai coast at Tanggu to Tianjin (the North China war opened round
 *  Beiping and Tianjin, July 1937); the occupation spreads from here, and Tianjin's garrison is the piece the block
 *  leaves standing where it stood */
export const LANDING: P2 = CHINA.PLACES.tianjin;
/** the Wuhan-front block's spot (Wuhan, fell Oct 1938, the end of the 1938 advance) */
export const WUHAN_AT: P2 = [CHINA.PLACES.wuhan[0] + 6, CHINA.PLACES.wuhan[1] + 4];
/** the Japan block at sea and the Wuhan-front block it shrinks to as its garrisons leave it */
export const JAPAN_W = 110;
export const WUHAN_W = 72;
/** the pieces face the lens of the end camera (yaw -20): the sticker face points 162 (garrisons 160), fixed on the map */
export const BLOCK_FACE = 162;
export const GARRISON_FACE = 160;
export const WUHAN_BLOCK_END: BlockSpec = blockSpec(WUHAN_AT[0], WUHAN_AT[1], WUHAN_W, BLOCK_FACE);
/** the garrison block's width (Garrison size) */
export const GARRISON_SIZE = 46;
export const GARRISONS: { city: (typeof HELD_CITIES)[number]; at: P2 }[] = HELD_CITIES.filter((c) => c !== "wuhan").map((city) => ({ city, at: CHINA.PLACES[city] }));

// ---- curves (a dense polyline with an arclength table; at(s) by arclength) ---------------------------------------
type Curve = { pts: P2[]; cs: number[]; len: number; at: (s: number) => P2; tan: (s: number) => P2 };
const curveOf = (pts: P2[]): Curve => {
  const cs: number[] = [0];
  for (let i = 1; i < pts.length; i++) cs.push(cs[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const len = cs[cs.length - 1];
  const idx = (s: number) => {
    let lo = 1;
    let hi = pts.length - 1;
    while (lo < hi) {
      const m = (lo + hi) >> 1;
      if (cs[m] < s) lo = m + 1;
      else hi = m;
    }
    return lo;
  };
  const at = (s: number): P2 => {
    const S = Math.max(0, Math.min(len, s));
    const i = idx(S);
    const q = (S - cs[i - 1]) / Math.max(1e-9, cs[i] - cs[i - 1]);
    return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * q, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * q];
  };
  const tan = (s: number): P2 => {
    const i = idx(Math.max(0, Math.min(len, s)));
    const l = cs[i] - cs[i - 1] || 1;
    return [(pts[i][0] - pts[i - 1][0]) / l, (pts[i][1] - pts[i - 1][1]) / l];
  };
  return { pts, cs, len, at, tan };
};
/** a uniform Catmull-Rom through waypoints, sampled n per span */
const catmull = (w: P2[], n = 60): P2[] => {
  const P = [w[0], ...w, w[w.length - 1]];
  const out: P2[] = [];
  for (let i = 1; i < P.length - 2; i++)
    for (let k = 0; k < n; k++) {
      const t = k / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (j: 0 | 1) => 0.5 * (2 * P[i][j] + (-P[i - 1][j] + P[i + 1][j]) * t + (2 * P[i - 1][j] - 5 * P[i][j] + 4 * P[i + 1][j] - P[i + 2][j]) * t2 + (-P[i - 1][j] + 3 * P[i][j] - 3 * P[i + 1][j] + P[i + 2][j]) * t3);
      out.push([f(0), f(1)]);
    }
  out.push(w[w.length - 1]);
  return out;
};
const cubic = (B: P2[], n = 400): P2[] => {
  const out: P2[] = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    const u = 1 - t;
    const w = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t];
    out.push([w.reduce((a, q, i) => a + q * B[i][0], 0), w.reduce((a, q, i) => a + q * B[i][1], 0)]);
  }
  return out;
};

// ---- the sea route: out of the Inland Sea past Shimonoseki, through the Korea Strait south of Tsushima, between
// Korea's south-west corner and Jeju, across the Yellow Sea and through the Bohai Strait to the landing -------------
export const SEA_ROUTE = curveOf(catmull([HONSHU, [1340, 160], [1160, 180], [955, 172], [735, 30], [540, -250], [190, -318], LANDING]));
export const L_SEA = SEA_ROUTE.len;

// ---- timing (frames) ------------------------------------------------------------------------------------------------
export const T_DEP = 12; // the block sets sail from Honshu (it stands there, the camera drifting, f0-12)
export const T_LAND = 52; // it comes ashore at LANDING: the front starts, the garrisons leave it
export const V_FRONT = 23; // the occupation front's march (world px per frame, constant)
const E_IN = 10;
const E_OUT = 8;
/** cruise speed at sea, so the block comes to rest at the landing on T_LAND */
const V_SEA = L_SEA / (E_IN / 2 + (T_LAND - T_DEP - E_IN - E_OUT) + E_OUT / 2);
/** arclength travelled at sea by frame t (accelerate E_IN, cruise, ease to rest over E_OUT) */
export const seaS = (t: number) => {
  const u = t - T_DEP;
  const T = T_LAND - T_DEP;
  if (u <= 0) return 0;
  if (u <= E_IN) return (V_SEA * u * u) / (2 * E_IN);
  const s1 = (V_SEA * E_IN) / 2;
  if (u <= T - E_OUT) return s1 + V_SEA * (u - E_IN);
  const s2 = s1 + V_SEA * (T - E_IN - E_OUT);
  if (u <= T) {
    const w = u - (T - E_OUT);
    return s2 + V_SEA * w - (V_SEA * w * w) / (2 * E_OUT);
  }
  return L_SEA;
};

// ---- the garrisons slide out of the block one by one and march straight to their towns at the front's speed, never
// ahead of the front. The north-western ones leave while it stands at Tianjin (f53-58); the southern and eastern
// ones leave it on its march south (f59-74), each from where it then is. Order and spacing checked so that none
// overtakes, crosses or passes through another (a far town's garrison goes before a near one on its line; >= 45
// world px apart once out of the block). Tianjin's stays under the block and is uncovered as it moves off. -------------
const L0 = T_LAND - 56; // the schedule below was set against a landing at f56
const DEP: Record<(typeof HELD_CITIES)[number], number> = {
  tianjin: T_LAND,
  taiyuan: 57 + L0,
  beiping: 58 + L0,
  baoding: 59.5 + L0,
  qingdao: 61 + L0,
  shijiazhuang: 62 + L0,
  hangzhou: 63 + L0,
  shanghai: 66.5 + L0,
  nanjing: 69 + L0,
  xuzhou: 72.5 + L0,
  kaifeng: 60.5 + L0,
  xinxiang: 68 + L0,
  jinan: 78 + L0,
  wuhan: 0,
};
/** each garrison's departure frame from the block */
export const GARRISON_DEP = GARRISONS.map((g) => DEP[g.city]);
const KICK = 40;
const KICK_F = 7;
/** a garrison's ground point at frame t: inside the block until it leaves (from wherever the block then is), then
 *  straight to its town at the front's speed, never ahead of the front, with a soft stop */
export const garrisonAt = (i: number, t: number): P2 => {
  const to = GARRISONS[i].at;
  const dep = GARRISON_DEP[i];
  if (t <= dep) return coreAt(t);
  const o = coreAt(dep);
  const dx = to[0] - o[0];
  const dz = to[1] - o[1];
  const Lr = Math.hypot(dx, dz) || 1;
  const at = (q: number): P2 => [o[0] + dx * q, o[1] + dz * q];
  // it slides out of the block with a push (KICK world px over its first frames), then marches
  const tau = t - dep;
  const own = tau * V_FRONT + KICK * (1 - Math.pow(1 - Math.min(1, tau / KICK_F), 2));
  let q = softStop(own / Lr, 0.06);
  const reach = reachAt(t);
  if (frontField(at(q)) > reach) {
    let lo = 0;
    let hi = q;
    for (let k = 0; k < 24; k++) {
      const m = (lo + hi) / 2;
      if (frontField(at(m)) < reach) lo = m;
      else hi = m;
    }
    q = lo;
  }
  return at(q);
};

// ---- the Wuhan-front block on land: once its garrisons are out it marches down one smooth curve from the landing
// to Wuhan (gathering speed, constant V_CORE, an even stop) ------------------------------------------------------------
export const LAND_ROUTE = curveOf(cubic([LANDING, [40, -200], [-120, 150], WUHAN_AT]));
export const L_LAND = LAND_ROUTE.len;
const STOP = 60;
/** the block sets off for Wuhan T_CORE_GO (its last garrisons slide out of it on the move; Tianjin's, under it at the
 *  landing, is uncovered as it moves off), and stands at Wuhan on T_AT_WUHAN */
export const T_CORE_GO = T_LAND + 6;
export const T_AT_WUHAN = 105;
const T_START = 6; // it gathers speed over its first frames
/** its cruise speed on land (accelerate T_START, cruise, decelerate evenly over the last STOP world px) */
export const V_CORE = (L_LAND + STOP) / (T_AT_WUHAN - T_CORE_GO - T_START / 2);
/** arclength on land at frame t */
export const landS = (t: number) => {
  const u = t - T_CORE_GO;
  if (u <= 0) return 0;
  if (u <= T_START) return (V_CORE * u * u) / (2 * T_START);
  const s1 = (V_CORE * T_START) / 2;
  const tStop = (2 * STOP) / V_CORE;
  const tCruise = T_AT_WUHAN - T_CORE_GO - T_START - tStop;
  if (u <= T_START + tCruise) return s1 + V_CORE * (u - T_START);
  const w = Math.min(tStop, u - T_START - tCruise);
  return s1 + V_CORE * tCruise + V_CORE * w - (V_CORE * w * w) / (2 * tStop);
};
/** the Japan block / Wuhan-front block's ground point at frame t */
export const coreAt = (t: number): P2 => {
  if (t <= T_LAND) return SEA_ROUTE.at(seaS(t));
  return LAND_ROUTE.at(landS(t));
};

// ---- the camera (one keyed track; it holds on Honshu with a slow drift f0-12, then over the sea the keys follow the
// block, a little ahead of it, so it stays near the frame's middle while the map glides under it) -------------------
const follow = (f: number, dx: number, dz: number, D: number, pitch: number, yaw: number): CamKey => {
  const c = coreAt(f);
  return { f, x: c[0] + dx, z: c[1] + dz, D, pitch, yaw };
};
export const PL_KEYS: CamKey[] = [
  follow(-30, 130, -20, 960, 36, -9),
  follow(0, 128, -20, 960, 36, -9),
  follow(12, 100, -22, 1040, 36.5, -9.5),
  follow(20, -20, 0, 1800, 40, -11),
  follow(30, -50, 20, 2450, 43, -12.5),
  follow(38, -50, 40, 2500, 45, -14),
  follow(50, -10, 90, 2100, 48, -16),
  { f: 68, x: 120, z: -40, D: 1350, pitch: 55, yaw: -18 },
  { f: 100, x: 40, z: 210, D: 1150, pitch: 62, yaw: -20 },
  { f: 150, x: 38, z: 206, D: 1125, pitch: 62.3, yaw: -20.3 },
];
export const plCam = camTrack(PL_KEYS, 200);
/** the camera of the last frame (f144) and the same as a key */
export const END_CAM = plCam(144);
export const END_KEY: Omit<CamKey, "f"> = { x: END_CAM.T[0], z: END_CAM.T[2], D: END_CAM.D, pitch: END_CAM.pitch, yaw: END_CAM.yaw };

// ---- the occupation front (the ground's radial front from LANDING: the SAME field as the shader's) -----------------
export const FRONT_ROUGH = 0.12;
/** the shader's radial front field at a map point (insurgencyGround.tsx `field`, radial) */
export const frontField = (p: P2, at: P2 = LANDING, rough = FRONT_ROUGH) => {
  const dx = p[0] - at[0];
  const dz = p[1] - at[1];
  const r = Math.hypot(dx, dz);
  const L = Math.log(r + 1);
  const a = Math.atan2(dz, dx);
  const n1 = 0.5 * Math.sin(3 * a + 1.7 * L + 0.3) + 0.3 * Math.sin(5 * a - 2.3 * L + 1.1) + 0.2 * Math.sin(8 * a + 3.1 * L + 2.0);
  return r * (1 + rough * n1);
};
/** the front's reach at frame t (constant march from T_LAND) */
export const reachAt = (t: number) => Math.max(0, (t - T_LAND) * V_FRONT);
/** smooth min(q, 1) with a quadratic knee of half-width k */
const softStop = (q: number, k: number) => {
  if (q >= 1 + k) return 1;
  if (q <= 1 - k) return q;
  const x = q - (1 - k);
  return 1 - k + x - (x * x) / (4 * k);
};
/** a piece riding the front edge from LANDING toward `to`, stopping there (a short settle into the stop) */
export const riderAt = (to: P2, reach: number): { p: P2; u: number } => {
  const dx = to[0] - LANDING[0];
  const dz = to[1] - LANDING[1];
  const Lr = Math.hypot(dx, dz) || 1;
  const at = (r: number): P2 => [LANDING[0] + (dx / Lr) * r, LANDING[1] + (dz / Lr) * r];
  let lo = 0;
  let hi = Lr * 1.6;
  for (let i = 0; i < 32; i++) {
    const m = (lo + hi) / 2;
    if (frontField(at(m)) < reach) lo = m;
    else hi = m;
  }
  const u = softStop(lo / Lr, 0.05);
  return { p: at(Lr * u), u };
};

// ---- the guerrillas (orange pawns between the lines, sampled once over the occupied land visible in the wide: up to
// 3 in each base area (115+ apart), then fillers 250+ apart; all 58+ off any held line or town, bases out of the
// caption bands in the wide; R = the radius of hatch each clears, enough to clear its whole share of the land) ----
export const PAWN_SIZE = 62;
export const PAWNS: { at: P2; R: number }[] = [
  { at: [-290, -330], R: 233 }, // Jin-Cha-Ji
  { at: [-150, -390], R: 217 }, // Jin-Cha-Ji
  { at: [-50, -470], R: 202 }, // Jin-Cha-Ji
  { at: [-30, -220], R: 239 }, // Jizhong
  { at: [210, -10], R: 252 }, // Shandong
  { at: [150, 90], R: 249 }, // Shandong
  { at: [-210, -110], R: 253 }, // Jin-Ji-Lu-Yu
  { at: [-320, -30], R: 281 }, // Jin-Ji-Lu-Yu
  { at: [445, 372], R: 358 }, // N4A central Jiangsu (base between caption bands in the end wide)
  { at: [360, 190], R: 379 }, // N4A northern Jiangsu (base above caption band 1 in the end wide)
  { at: [560, -170], R: 219 },
  { at: [-130, -710], R: 240 },
  { at: [50, -1010], R: 242 },
  { at: [-210, -950], R: 188 },
  { at: [-20, 320], R: 315 },
  { at: [-410, -690], R: 216 },
  { at: [-60, 795], R: 380 },
  { at: [210, -480], R: 197 },
  { at: [280, -1190], R: 189 },
];
/** the rising starts in the Taihang (Jin-Cha-Ji, the first base area, 1937-38) and spreads outward */
export const RISE_FROM: P2 = CHINA.BASE_AREAS.jinchaji.c;
export const RISE_T0 = 94;
export const RISE_SPREAD = 14;
export const RISE_LEN = 26;
const maxD = Math.max(...PAWNS.map((p) => Math.hypot(p.at[0] - RISE_FROM[0], p.at[1] - RISE_FROM[1])));
/** each pawn's rise start (frame) */
export const PAWN_START = PAWNS.map((p) => RISE_T0 + RISE_SPREAD * (Math.hypot(p.at[0] - RISE_FROM[0], p.at[1] - RISE_FROM[1]) / maxD));

/** the ground at the end: the faint orange of the land between, then the cream hold left (BANDS) */
export const END_TERRITORY: TerritoryLayer[] = [
  { d: CHINA.OCCUPIED_1939.d, color: "orange", wash: 0.1, hatch: 0 },
  { d: BANDS.d, color: "cream", wash: 0.3, hatch: 0.62, edge: 0 },
];
