// ---------------------------------------------------------------------------
// timelineDcWorld — the pure world of TimelineToTheDataCenter (rsi-ten-earths, cut 17, rev 1): the camera (one
// continuous flight), the road and its painted years, the building's loading door, the hall's layout and the robots'
// places and paths. No React here (the cut and scripts/clips/rsi-ten-earths/check-timeline-to-dc.ts both import it).
//
// UNITS: the cast's (U = 178 per metre; the robot 240 = 1.35 m). X across (+ = right), Y height (floor 0, up -), Z
//   depth (+ = away). THE WORLD: the loading door's centre line is X = 0 (the camera flies along it); the building is
//   cut 2's HALL_COMPACT shifted left by XD so its roll-up door sits on X = 0; its front wall's outer face is at
//   Z = EZ0 (-53.4), the interior's front face at Z = 0. The hall behind the door is HALL_IN (30.9 x 48 m, 6.4 m
//   ceiling): bigger than the compact shell seen from the road (the shell is only ever seen from the front, the inside
//   only from inside; flagged to the director).
//
// THE CAMERA: a real eye on a shift lens (verticals stay vertical), at (X 0, height He, depth Ze), focal F px, its
//   horizon at screen row Hy. Mapped per frame onto a londonDepth perspective whose front plane rides DREF ahead of the
//   eye (Dc = DREF always, k = F / DREF), so the depth kit never sees the eye pass its front plane: every world Z is
//   handed to the kit as kitZ = Z - Ze - DREF (the cut does this through zk()). Fog by the eye's distance is unchanged.
// ---------------------------------------------------------------------------
import { HALL_COMPACT, RACK, type HallGeom, type RackSpec } from "./tenEarthsHall";
import { pchip } from "../kits/maps/incaShared";
import { BOT_POSES, type BotPose } from "./tenEarthsBotBody";

export const U = 178;
export const FPS = 24000 / 1001;
export const DURATION = 173;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
/** smootherstep on [a, b] */
export const sm = (a: number, b: number, v: number) => {
  const u = c01((v - a) / (b - a));
  return u * u * u * (u * (u * 6 - 15) + 10);
};

// ===================================================================================================================
// THE BUILDING (cut 2's HALL_COMPACT, its loading door on X = 0)
// ===================================================================================================================
const W_C = HALL_COMPACT.x1 - HALL_COMPACT.x0;
/** tenEarthsHall's DataCenter lays the loading door out from the geometry: these are its numbers */
const LX1 = HALL_COMPACT.x1 - 0.08 * W_C;
const LX0 = LX1 - Math.min(750, 0.28 * W_C);
/** the door's centre in the module's own X: the shell is shifted left by this much */
export const XD = (LX0 + LX1) / 2;
export const EXT: HallGeom = { ...HALL_COMPACT, x0: HALL_COMPACT.x0 - XD, x1: HALL_COMPACT.x1 - XD };
export const EZ0 = HALL_COMPACT.z0 - HALL_COMPACT.wall;
/** the opening (outer face Z = EZ0, inner face Z = 0): X -DOOR.w2..+DOOR.w2, Y 0..-DOOR.h */
export const DOOR = { w2: (LX1 - LX0) / 2, h: Math.min(4.4 * U, 0.62 * HALL_COMPACT.Hc) };
/** the roll-up door: its bottom edge rises 0 -> h (eased), slats rolling into the drum behind the lintel */
export const DOOR_F0 = 76;
export const DOOR_F1 = 97;
export const doorOpen = (f: number) => sm(DOOR_F0, DOOR_F1, f);

// ===================================================================================================================
// THE HALL INSIDE: rows of rack columns with desk pairs between them, robots typing; cross aisles between the rows
// ===================================================================================================================
export const HALL_IN: HallGeom = { x0: -9000, x1: 9000, z0: 0, z1: 30000, Hc: 6.4 * U, wall: 0.3 * U, roof: 0.6 * U, parapet: 0.5 * U };
/** row k's band: Z_k .. Z_k + 249 (the profile desks' length); a 1.3 m cross aisle behind it */
export const ROW_Z0 = 1150;
export const ROW_PITCH = 470;
export const ROWS = 61;
export const rowZ = (k: number) => ROW_Z0 + k * ROW_PITCH;
/** desk pairs (two profile desks back to back, the robots facing each other) and rack columns (3 racks) alternate */
/** 19 pairs across (X 0, +-904 .. +-8136) and 18 rack columns between and beside them: 61 rows x 38 = 2,318 robots */
export const PAIR_X = [0, ...Array.from({ length: 9 }, (_, i) => [-(i + 1) * 904, (i + 1) * 904]).flat()];
export const RACK_COL_X = Array.from({ length: 9 }, (_, i) => [-(452 + i * 904), 452 + i * 904]).flat();
/** the pair's desks: centre +-75 (each 0.7 m deep along X), the robots at +-189.5 (the module's profile seat) */
export const DESK_DX = 75;
export const RACK_DZ = 36;
export const RACKS_IN: RackSpec[] = (() => {
  const out: RackSpec[] = [];
  let id = 0;
  for (let k = 0; k < ROWS; k++)
    RACK_COL_X.forEach((cx, c) => {
      for (let j = -1; j <= 1; j++) out.push({ X: cx + j * RACK.w, Z: rowZ(k) + RACK_DZ, seed: 900 + k * 37 + c * 11 + j * 3, row: k, col: c, id: id++ });
    });
  return out;
})();
export type DeskSpot = { k: number; pair: number; side: -1 | 1; deskX: number; Z: number; botX: number; botZ: number; variant: number; seed: number };
/** every desk: side -1 = the left robot (seat "left", facing +X), side +1 = the right robot (seat "right", facing -X) */
export const DESKS: DeskSpot[] = (() => {
  const out: DeskSpot[] = [];
  for (let k = 0; k < ROWS; k++)
    PAIR_X.forEach((px, p) => {
      for (const side of [-1, 1] as const) {
        const i = out.length;
        out.push({ k, pair: p, side, deskX: px + side * DESK_DX, Z: rowZ(k), botX: px + side * (DESK_DX + 125 / 2 + 52), botZ: rowZ(k) + 249 / 2, variant: 1 + ((i * 7 + k * 3 + p) % 4), seed: 11 + i * 13 });
      }
    });
  return out;
})();
/** a desk robot's pose: typing; the nearest pair is not a mirror image (the right one types on a different phase and
 *  looks up from its screen toward the camera through the widest reveal, f128-166, then back to work) */
export const deskPose = (d: DeskSpot, frame: number): BotPose => {
  const near = d.k === 0 && d.pair === 0;
  const q = BOT_POSES.typeAtDesk(d.side < 0 ? 1 : -1, frame + (near && d.side > 0 ? 7 : 0), d.seed);
  if (!(near && d.side > 0)) return q;
  const u = sm(128, 140, frame) * (1 - sm(154, 166, frame));
  return { ...q, headYaw: lerp(q.headYaw ?? 0.9, 0.2, u), look: [lerp(0.35, -0.2, u), lerp(0.05, 0.15, u)], pitch: (q.pitch ?? 0) - 4 * u };
};
/** the cross aisle behind row k (Z_k + 249 .. Z_{k+1}): its centre line */
export const aisleZ = (k: number) => rowZ(k) + 249 + (ROW_PITCH - 249) / 2;
/** walkers cross an aisle at a steady planted-feet pace (they are mid-walk from f0; nothing appears) */
export type Walker = { k: number; dir: 1 | -1; X0: number; variant: number; phase: number };
export const WALKERS: Walker[] = [
  { k: 0, dir: 1, X0: -1150, variant: 3, phase: 5 },
  { k: 2, dir: -1, X0: 1260, variant: 2, phase: 13 },
  { k: 4, dir: 1, X0: -760, variant: 4, phase: 2 },
  { k: 7, dir: -1, X0: 1500, variant: 1, phase: 17 },
];
/** robots working at a rack: standing in the aisle in front of rack column `col` of row k+1, a mitten on its front */
export type RackHand = { k: number; colX: number; dX: number; variant: number; seed: number };
export const RACK_HANDS: RackHand[] = [
  { k: 1, colX: 452, dX: -40, variant: 2, seed: 41 },
  { k: 3, colX: -452, dX: 50, variant: 4, seed: 43 },
  { k: 5, colX: 1356, dX: -30, variant: 1, seed: 47 },
];
/** a rack-hand stands this far in front of the rack's front face */
export const RACK_HAND_GAP = 62;

// ===================================================================================================================
// THE ROAD AND ITS PAINTED YEARS
// ===================================================================================================================
/** the data center's access road (X -560..560) runs straight into the loading door, the camera over its middle; two
 *  solid cream edge lines (12 wide, their centres at X -+500) run its whole length */
export const ROAD_X0 = -560;
export const ROAD_X1 = 560;
export const EDGE_LINE = { X: 500, w: 6 };

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
/** the kit's front plane rides this far ahead of the eye */
export const DREF = 1500;
export type Eye = { Ze: number; He: number; Hy: number; F: number; X: number };
/** the eye's forward speed (units per frame): a slow glide from f0 easing into the run (~10 f), the run accelerating
 *  past the painted years (peak ~f74), decelerating on "but what happens" as the door rolls up, through the door at
 *  ~f110 ("get" 111), on into the hall slowing to zero at ~f128, then the crane's swing back (~-14 at f138) and a
 *  slow drift back to the end. One acceleration lobe, one deceleration lobe, then the arc. */
const V_KEYS: [number, number][] = [
  [0, 30],
  [10, 40],
  [22, 50],
  [34, 62],
  [44, 92],
  [54, 118],
  [64, 136],
  [72, 158],
  [80, 170],
  [86, 160],
  [92, 128],
  [98, 90],
  [104, 58],
  [110, 37],
  [116, 26],
  [122, 15],
  [128, 5],
  [132, 0],
  [140, -7],
  [150, -5],
  [160, -2.4],
  [176, -1.2],
];
const V = pchip(V_KEYS, false);
const SUB = 8;
/** the frame the eye crosses the door's outer face (EZ0) */
export const F_DOOR = 110;
const ZE_TAB: number[] = (() => {
  const out: number[] = new Array(DURATION + 8).fill(0);
  const integ = (a: number, b: number) => {
    let s = 0;
    const n = Math.max(1, Math.round(Math.abs(b - a) * SUB));
    const h = (b - a) / n;
    for (let i = 0; i < n; i++) s += 0.5 * h * (V(a + i * h) + V(a + (i + 1) * h));
    return s;
  };
  for (let f = 0; f < out.length; f++) out[f] = EZ0 + integ(F_DOOR, f);
  return out;
})();
export const eyeZ = (f: number) => {
  const i = Math.max(0, Math.min(ZE_TAB.length - 2, Math.floor(f)));
  return lerp(ZE_TAB[i], ZE_TAB[i + 1], f - i);
};
/** THE CRANE (from f132, where the run inside has slowed to zero): up and back in LOG space, ln(height) and
 *  ln(distance to the first desk row) interpolated by pchip, so each doubling reads as the same step; it eases out of
 *  the run's stop (no kink) and settles into a slow drift by ~f162 */
export const CRANE_F0 = 132;
const ROW0_BOT_Z = ROW_Z0 + 249 / 2;
const DIST_KEYS: [number, number][] = [
  [128, 958],
  [CRANE_F0, 949],
  [136, 990],
  [140, 1150],
  [144, 1450],
  [148, 1840],
  [152, 2080],
  [156, 2260],
  [162, 2400],
  [172, 2490],
  [180, 2520],
];
const LN_DIST = pchip(
  DIST_KEYS.map(([f, d]) => [f, Math.log(d)] as [number, number]),
  false,
);
const eyeZRaw = (f: number) => (f <= CRANE_F0 ? eyeZ(f) : ROW0_BOT_Z - Math.exp(LN_DIST(f)));
/** a curve smoothed by a gaussian (sigma 3.5 frames, tabulated at quarter frames), blended in from frame `from` (the
 *  key frames of the crane then carry no corners: its speed and climb change gently) */
const smoothed = (raw: (f: number) => number, from: number) => {
  const step = 0.25;
  const f0 = from - 20;
  const n = Math.round((DURATION + 30 - f0) / step);
  const sig = 3.5;
  const R = Math.ceil((3 * sig) / step);
  const tab = Array.from({ length: n + 1 }, (_, i) => {
    let a = 0;
    let w = 0;
    for (let j = -R; j <= R; j++) {
      const g = Math.exp(-0.5 * ((j * step) / sig) ** 2);
      a += g * raw(f0 + (i + j) * step);
      w += g;
    }
    return a / w;
  });
  return (f: number) => {
    const b = sm(from, from + 8, f);
    if (b <= 0) return raw(f);
    const u = Math.max(0, Math.min(n - 1e-6, (f - f0) / step));
    const i = Math.floor(u);
    const v = lerp(tab[i], tab[i + 1], u - i);
    return lerp(raw(f), v, b);
  };
};
const eyeZAll = smoothed(eyeZRaw, 116);
/** the eye's forward speed (units per frame; negative = moving back) */
export const speedAt = (f: number) => (f < 112 ? V(f) : eyeZAll(f + 0.5) - eyeZAll(f - 0.5));
/** the camera's height: a drone over the road (~4.3 m, looking down onto the painted years), easing down to doorway
 *  height (1.6 m) on the approach, through the door at ~1.6 m, then the crane up and back inside (4 m by ~f148,
 *  a slow creep after). The rise starts as soon as the eye is through, front-loaded so the first desk pair grows and
 *  drops into the frame at once. */
const HE_KEYS: [number, number][] = [
  [0, 760],
  [50, 770],
  [76, 740],
  [88, 560],
  [98, 345],
  [105, 285],
  [111, 292],
  [117, 380],
  [125, 520],
  [132, 612],
  [136, 680],
  [140, 820],
  [145, 1020],
  [150, 1180],
  [156, 1400],
  [162, 1530],
  [172, 1620],
  [180, 1640],
];
/** the horizon's screen row: high on the road (the camera pitched down onto the asphalt), lowering as the eye drops
 *  to the door (the door framed straight on), then rising again as the crane looks down over the hall */
const HY_KEYS: [number, number][] = [
  [0, 340],
  [70, 346],
  [86, 420],
  [100, 560],
  [108, 585],
  [114, 540],
  [124, 430],
  [132, 368],
  [140, 310],
  [150, 245],
  [160, 210],
  [172, 195],
  [180, 192],
];
/** the lens: 1586 px on the road, widening through the crane (1250 at the top) */
const F_KEYS: [number, number][] = [
  [0, 1586],
  [110, 1586],
  [128, 1490],
  [140, 1400],
  [150, 1320],
  [160, 1270],
  [172, 1255],
  [180, 1250],
];
const HE_LN = pchip(
  HE_KEYS.map(([f, h]) => [f, Math.log(h)] as [number, number]),
  false,
);
const HE = smoothed((f: number) => Math.exp(HE_LN(f)), 90);
const FL = pchip(F_KEYS, false);
const HY = pchip(HY_KEYS, false);
export const eyeAt = (f: number): Eye => ({
  Ze: eyeZAll(f),
  He: HE(f),
  Hy: HY(f),
  F: FL(f),
  X: 0,
});
/** a world point on screen (no sway): x, y and the px per unit there; null behind the eye */
export const toScreen = (e: Eye, X: number, Y: number, Z: number) => {
  const d = Z - e.Ze;
  if (d < 1) return null;
  const s = e.F / d;
  return { x: 540 + (X - e.X) * s, y: e.Hy + (Y + e.He) * s, s, d };
};

/** the painted years: on its beat frame each one's near edge sits at screen row ~YEAR_NEAR (seen from the drone the
 *  type is then ~200 px tall), so a year is readable for the ~10-20 frames before its beat, then slides down and out
 *  of the bottom edge; 2028-2030 come faster and smaller as the run peaks */
export type Year = { text: string; beat: number; scale: number; Z: number; W: number; L: number; gap: number };
const YEAR_W = 170;
const YEAR_L = 640;
const YEAR_GAP = 32;
const YEAR_NEAR = 1050;
/** the clear road between two painted years (units) */
const YEAR_SPACE = 300;
export const YEARS: Year[] = [
  { text: "2026", beat: 34, scale: 1 },
  { text: "2027", beat: 64, scale: 1 },
  { text: "2028", beat: 71, scale: 0.84 },
  { text: "2029", beat: 77, scale: 0.7 },
  { text: "2030", beat: 82, scale: 0.6 },
].reduce<Year[]>((acc, y) => {
  const L = YEAR_L * y.scale;
  const e = eyeAt(y.beat);
  const want = e.Ze + (e.F * e.He) / (YEAR_NEAR - e.Hy);
  const prev = acc[acc.length - 1];
  const Z = prev ? Math.max(want, prev.Z + prev.L + YEAR_SPACE) : want;
  acc.push({ ...y, Z, W: YEAR_W * y.scale, L, gap: YEAR_GAP * y.scale });
  return acc;
}, []);
/** the paint's strength on screen: it eases off as soon as the figure starts down into the caption bands (its near
 *  edge past y 1070), ~35 % by the time its middle reaches y 1080, fainter still as it slides out of the frame */
export const yearFade = (e: Eye, y: Year) => {
  const near = toScreen(e, 0, 0, y.Z);
  const mid = toScreen(e, 0, 0, y.Z + y.L / 2);
  if (!near || !mid) return 0.2;
  const u = Math.max(sm(1070, 1250, near.y), sm(990, 1080, mid.y));
  return (1 - 0.65 * u) * (1 - 0.45 * sm(1300, 1800, mid.y));
};
/** a year's total width */
export const yearWidth = (y: Year) => 4 * y.W + 3 * y.gap;

// ===================================================================================================================
// THE ROAD STENCIL FIGURES: worn cream road paint, drawn as ground polygons (each vertex projected, so the figures lie
// IN the road and foreshorten with it). A figure is 1 wide x 1.6 long in glyph units (x across, y AWAY from the
// driver: the bottom of a figure is its near end), stroked 0.21 thick; it is stretched to W x L on the road.
// ===================================================================================================================
type G2 = [number, number];
type Stroke = { pts: G2[]; closed: boolean };
const GT = 0.21;
const D2R = Math.PI / 180;
const arcPts = (cx: number, cy: number, r: number, a0: number, a1: number, n = 22): G2[] => Array.from({ length: n + 1 }, (_, i) => {
  const a = (a0 + ((a1 - a0) * i) / n) * D2R;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as G2;
});
const linePts = (a: G2, b: G2, n = 4): G2[] => Array.from({ length: n + 1 }, (_, i) => [lerp(a[0], b[0], i / n), lerp(a[1], b[1], i / n)] as G2);
const join = (...parts: G2[][]) => parts.reduce<G2[]>((acc, p) => acc.concat(acc.length ? p.slice(1) : p), []);
const SIX: Stroke[] = [
  { pts: arcPts(0.5, 0.47, 0.36, 0, 360, 40).slice(0, -1), closed: true },
  { pts: join(linePts([0.14, 0.47], [0.14, 0.9]), arcPts(0.56, 0.9, 0.42, 180, 52)), closed: false },
];
export const GLYPHS: Record<string, Stroke[]> = {
  "0": [{ pts: join(linePts([0.89, 0.5], [0.89, 1.1]), arcPts(0.5, 1.1, 0.39, 0, 180), linePts([0.11, 1.1], [0.11, 0.5]), arcPts(0.5, 0.5, 0.39, 180, 360)).slice(0, -1), closed: true }],
  "1": [
    { pts: linePts([0.22, 1.2], [0.56, 1.49], 2), closed: false },
    { pts: linePts([0.56, 1.49], [0.56, 0.11]), closed: false },
  ],
  "2": [
    { pts: join(arcPts(0.5, 1.1, 0.39, 158, -38), linePts([0.5 + 0.39 * Math.cos(-38 * D2R), 1.1 + 0.39 * Math.sin(-38 * D2R)], [0.12, 0.11])), closed: false },
    { pts: linePts([0.11, 0.11], [0.89, 0.11], 2), closed: false },
  ],
  "3": [
    { pts: arcPts(0.5, 1.15, 0.34, 152, -90), closed: false },
    { pts: arcPts(0.5, 0.47, 0.36, 90, -152), closed: false },
  ],
  "6": SIX,
  "7": [
    { pts: linePts([0.11, 1.49], [0.89, 1.49], 2), closed: false },
    { pts: linePts([0.89, 1.49], [0.15, 0.11]), closed: false },
  ],
  "8": [
    { pts: arcPts(0.5, 1.17, 0.3, 0, 360, 36).slice(0, -1), closed: true },
    { pts: arcPts(0.5, 0.47, 0.36, 0, 360, 40).slice(0, -1), closed: true },
  ],
  "9": SIX.map((s) => ({ closed: s.closed, pts: s.pts.map(([x, y]) => [1 - x, 1.6 - y] as G2) })),
};
const norm2 = (v: G2): G2 => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};
/** a stroke's outline in glyph units: open strokes -> one polygon (square caps half a stroke long, so corners close);
 *  closed strokes -> two rings (outer, inner: fill them evenodd) */
export const strokeOutline = (s: Stroke): G2[][] => {
  const h = GT / 2;
  const n = s.pts.length;
  const tan = (i: number): G2 => {
    const a = s.closed ? s.pts[(i - 1 + n) % n] : s.pts[Math.max(0, i - 1)];
    const b = s.closed ? s.pts[(i + 1) % n] : s.pts[Math.min(n - 1, i + 1)];
    return norm2([b[0] - a[0], b[1] - a[1]]);
  };
  const L: G2[] = [];
  const R: G2[] = [];
  for (let i = 0; i < n; i++) {
    const t = tan(i);
    const nn: G2 = [-t[1], t[0]];
    let p = s.pts[i];
    if (!s.closed && i === 0) p = [p[0] - t[0] * h, p[1] - t[1] * h];
    if (!s.closed && i === n - 1) p = [p[0] + t[0] * h, p[1] + t[1] * h];
    L.push([p[0] + nn[0] * h, p[1] + nn[1] * h]);
    R.push([p[0] - nn[0] * h, p[1] - nn[1] * h]);
  }
  return s.closed ? [L, R] : [[...L, ...R.reverse()]];
};
/** a year's figures as ground polygons (world X, Z) with their fill rule */
export const yearPolys = (y: Year): { rings: [number, number][][]; evenodd: boolean }[] => {
  const x0 = -yearWidth(y) / 2;
  const out: { rings: [number, number][][]; evenodd: boolean }[] = [];
  [...y.text].forEach((ch, i) => {
    const gx = x0 + i * (y.W + y.gap);
    for (const s of GLYPHS[ch] ?? []) out.push({ evenodd: s.closed, rings: strokeOutline(s).map((r) => r.map(([u, v]) => [gx + u * y.W, y.Z + (v / 1.6) * y.L] as [number, number])) });
  });
  return out;
};
