// ---------------------------------------------------------------------------
// propertyContractsPlan: the world layout, camera and timelines of PropertyAndContracts (kyle-rome-industrial,
// cut 86). Pure maths, no React. World units = the cast's (a man ~312 = 1.75 m): U = 178 per metre. X across, Y height
// (ground Y = 0, up is - Y), Z depth (londonDepth's model; the front plane Z = 0 sits just in front of the table).
//
// THE LAND (centuriation): a lattice of 10 m cells. Boundaries along Z (at X = 5.3 + 10 i) are roads for even i and
// low dry-stone walls for odd i; boundaries along X (at Z = 2 + 10 j) are roads for even j, walls for odd j. Each plot
// fills its cell inside its roads and walls, with a boundary stone (terminus) standing at each corner.
//   plot P (i -1, j 0): X -4.4 .. 4.1, Z 3.2 .. 11.7 (stubble). Its near-right corner S (4.1, 3.2) is the stone being
//     set, at the crossroads; the surveyor and his groma stand at its far-right corner (4.1, 11.7) sighting down the
//     boundary.
//   the farmyard (i -1, j -1): the farmhouse and the owner's table at its back edge by the road.
//   the court (i -1, j 1): a paved square beyond P's back wall with the magistrate's tribunal.
// THE CAMERA: a real eye (ex, eh, ez) with a focal length F (px) and the horizon's screen row yh (a vertical lens
// shift), keyed and run through the kit's damped follow (CAM_STIFF / CAM_DAMP, a lead of 5 frames, as
// kyle-rome-slavery/slavesTurnTheCranePlan). Converted per frame to the depth kit's 2D camera: Dc = -ez,
// k = F / Dc, cx = ex, eyeY = -eh, cy = eyeY - (yh - 960) / k (perspective(cam, { eyeY, dRef: Dc, kRef: 1,
// dolly: 0 })).
// ---------------------------------------------------------------------------
import { CAM_DAMP, CAM_STIFF } from "../kits/dwarkesh/fieldShared";
import { pchip, type Cam } from "../kits/dwarkesh-3d/dwarkesh3d";

export const FPS = 30000 / 1001;
export const DURATION = 259;
export const U = 178;
/** metres -> units */
export const m = (v: number) => v * U;

const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const ease = (v: number) => {
  const t = c01(v);
  return t * t * (3 - 2 * t);
};
export const ease5 = (v: number) => {
  const t = c01(v);
  return t * t * t * (t * (6 * t - 15) + 10);
};
/** 0..1 over frames a..b, smoothstep */
export const span = (f: number, a: number, b: number) => ease((f - a) / (b - a));
export const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

// ===================================================================================================================
// THE LAND
// ===================================================================================================================
export const PITCH = 10;
export const XB0 = 5.3;
export const ZB0 = 2.6;
export const ROAD_HW = 1.2;
export const WALL_HW = 0.3;
export const WALL_H = 0.55;
/** boundary along Z number i (at X = XB0 + PITCH i): road for even i, wall for odd i */
export const xIsRoad = (i: number) => ((i % 2) + 2) % 2 === 0;
export const zIsRoad = (j: number) => ((j % 2) + 2) % 2 === 1;
export const XB = (i: number) => XB0 + PITCH * i;
export const ZB = (j: number) => ZB0 + PITCH * j;
export const xHW = (i: number) => (xIsRoad(i) ? ROAD_HW : WALL_HW);
export const zHW = (j: number) => (zIsRoad(j) ? ROAD_HW : WALL_HW);
/** the plot of cell (i, j): between boundaries i and i + 1 (X) and j and j + 1 (Z), metres */
export const plotOf = (i: number, j: number) => ({ x0: XB(i) + xHW(i), x1: XB(i + 1) - xHW(i + 1), z0: ZB(j) + zHW(j), z1: ZB(j + 1) - zHW(j + 1) });

export type PlotKind = "wheat" | "stubble" | "plough" | "olive" | "vines" | "meadow" | "yard" | "court";
const hashN = (a: number, b: number) => {
  const s = Math.sin(a * 127.1 + b * 311.7 + 17.3) * 43758.5453;
  return s - Math.floor(s);
};
export const hashIJ = hashN;
const KINDS: PlotKind[] = ["wheat", "stubble", "plough", "olive", "wheat", "vines", "meadow", "olive", "plough", "stubble"];
export const plotKind = (i: number, j: number): PlotKind => {
  if (i === -1 && j === 0) return "stubble";
  if (i === -1 && j === -1) return "yard";
  if (i === -1 && j === 1) return "wheat";
  if (i === 0 && j === 0) return "wheat";
  if (i === -2 && j === 0) return "olive";
  if (i === 0 && j === 1) return "plough";
  if (i === -2 && j === 1) return "vines";
  if (i === 0 && j === -1) return "olive";
  if (i === -2 && j === -1) return "plough";
  const k = KINDS[Math.floor(hashN(i, j) * KINDS.length) % KINDS.length];
  // no tall groves in the near cells the crane starts over (they would wall off the low frame)
  if (k === "olive" && j <= -2 && i >= -3 && i <= 1) return j % 2 === 0 ? "plough" : "wheat";
  return k;
};
/** rows run along Z (true) or along X */
export const rowsAlongZ = (i: number, j: number) => hashN(i + 7, j - 3) > 0.45;

// ---- the stone being set (S, the near-right corner of plot P) ------------------------------------------------------
export const PLOT_P = plotOf(-1, 0);
export const S = { x: PLOT_P.x1, z: PLOT_P.z0 };
/** the stone: square 0.3 m, 1.35 m long; 0.35 m of it goes into the hole (1 m stands, as every terminus) */
export const STONE = { T: 0.3, L: 1.35, sink: 0.35 };
/** the pivot (the stone's foot, lower left edge) and the hole's centre */
export const PIVOT = { x: S.x - 0.2, z: S.z + 0.05 };
export const HOLE = { x: PIVOT.x + STONE.T / 2, z: PIVOT.z };
/** the raising: lying flat (top end to the left) until RAISE_A, upright at RAISE_B, sliding into the hole RAISE_B..SET */
export const GRIP_F = 96;
export const RAISE_A = 104;
export const RAISE_B = 138;
export const SET_F = 150;
export const stoneTheta = (f: number) => (Math.PI / 2) * ease5((f - RAISE_A) / (RAISE_B - RAISE_A));
/** how far the stone has sunk into its hole (metres) */
export const stoneSink = (f: number) => {
  const u = c01((f - RAISE_B) / (SET_F - RAISE_B));
  // falls under its weight, eased only at the very end (it settles on the hole's floor)
  return STONE.sink * (u < 0.85 ? Math.pow(u / 0.85, 2) * 0.96 : 0.96 + 0.04 * ease((u - 0.85) / 0.15));
};
/** the surveyor at P's far-right corner, the groma beside him */
export const SURVEYOR = { x: S.x + 1.0, z: S.z + 1.15 };
export const GROMA = { x: S.x + 0.52, z: S.z + 1.3 };

// ---- the farmyard: table, people, house ----------------------------------------------------------------------------
export const TABLE = { x0: -0.47, x1: 0.5, z0: 0.27, z1: 0.92, top: 0.76, th: 0.06 };
/** the wax tablets: two leaves, near and far, hinged along X at Z zc, each 0.46 x 0.27 m; written on the far leaf,
 *  which the buyer turns over toward us onto the near one */
export const TAB = { w: 0.46, d: 0.27, t: 0.03, zc: 0.62 };
export const DOM = { x: -0.7, z: 0.99 };
export const FRE = { x: 0.72, z: 0.99 };
export const WIT = { x: 0.12, z: 2.35, zSeal: 1.62 };
/** the witness stands a step back, steps up to the table edge for his seal and back again (his legs are behind the
 *  table; only his upper body travels) */
export const witZ = (f: number) => lerpN(lerpN(WIT.z, WIT.zSeal, span(f, 202, 213)), WIT.z, span(f, 224, 239));
/** the yard is the left part of its cell (house, table); the right part is a vineyard */
export const YARD_X1 = 1.3;
export const HOUSE = { x0: -4.0, x1: -1.6, z0: -3.2, z1: 0.2, h: 2.9, ridge: 3.9 };
export const TRIBUNAL = { x: 1.25, z: 10.0, w: 2.8, d: 1.6, h: 1.15 };

// ---- the timelines (frames) ----------------------------------------------------------------------------------------
/** the Freeman writes on the right leaf until WRITE_END, lays the stylus down at STYLUS_DOWN */
export const WRITE_END = 152;
export const STYLUS_DOWN = 160;
/** the fold: his hand on the right leaf's free edge at FOLD_GRIP, lifting it to upright at FOLD_UP, letting it fall:
 *  it lands on the left leaf at FOLD_LAND (contact) */
export const FOLD_GRIP = 187;
export const FOLD_UP = 197;
export const FOLD_LAND = 204;
export const foldAngle = (f: number) => {
  if (f <= FOLD_GRIP) return 0;
  if (f <= FOLD_UP) return (Math.PI / 2) * ease((f - FOLD_GRIP) / (FOLD_UP - FOLD_GRIP)) * 1.0;
  // past upright it falls: accelerating, landing at FOLD_LAND
  const u = c01((f - FOLD_UP) / (FOLD_LAND - FOLD_UP));
  return Math.PI / 2 + (Math.PI / 2) * (0.25 * u + 0.75 * u * u);
};
/** the three seals along the cord: who, where along X (metres), the contact frame */
export const SEALS = [
  { who: "dom" as const, x: -0.1, f: 211 },
  { who: "wit" as const, x: 0.0, f: 219 },
  { who: "fre" as const, x: 0.1, f: 227 },
];
export const SEAL_DOWN = 7;
export const SEAL_HOLD = 3;
export const SEAL_UP = 7;
/** a press: 0 = hand at rest .. 1 = pressing on the wax */
export const pressAt = (f: number, contact: number) => {
  if (f < contact - SEAL_DOWN || f > contact + SEAL_HOLD + SEAL_UP) return 0;
  if (f <= contact) return ease((f - (contact - SEAL_DOWN)) / SEAL_DOWN);
  if (f <= contact + SEAL_HOLD) return 1;
  return 1 - ease((f - contact - SEAL_HOLD) / SEAL_UP);
};
/** the magistrate lifts his open hand on "enforcement" */
export const MAG_A = 228;
export const MAG_B = 240;
/** the handshake: the near hands reach from SHAKE_A, meet at SHAKE_MEET, shake to the end */
export const SHAKE_A = 236;
export const SHAKE_MEET = 247;

// ===================================================================================================================
// THE CAMERA
// ===================================================================================================================
export type Eye = { ex: number; eh: number; ez: number; F: number; yh: number };
/** each axis keyed on its own (metres for ex / eh / ez, px for F / yh), so each moves in one smooth lobe:
 *  the push forward and the sink run from f0 and settle at the end; the slide left to the table is one bell
 *  centred on "There's relatively" (f120 -> f232); the horizon row dips while looking down on the stone and rises
 *  as the crane levels at the table */
const KEYS = {
  ez: [[0, -25.0], [70, -14.2], [145, -4.3], [212, -2.35], [258, -2.0]] as [number, number][],
  eh: [[0, 16.5], [70, 10.8], [145, 5.2], [212, 2.45], [258, 2.2]] as [number, number][],
  F: [[0, 1250], [258, 1300]] as [number, number][],
  yh: [[0, 175], [70, 128], [145, 90], [212, 218], [258, 244]] as [number, number][],
};
const EX0 = 3.75;
const EX_A = 118;
const EX_B = 234;
export const EYE_KEYS = KEYS;
const EYE_PATH: Eye[] = (() => {
  const tz = pchip(KEYS.ez.map(([f, v]) => [f, -Math.log(-v)] as [number, number]));
  const th = pchip(KEYS.eh.map(([f, v]) => [f, Math.log(v)] as [number, number]));
  const tF = pchip(KEYS.F.map(([f, v]) => [f, Math.log(v)] as [number, number]));
  const ty = pchip(KEYS.yh);
  const tx = (f: number) => (EX0 - 0.12 * ease((f - 20) / 120)) * (1 - ease5((f - EX_A) / (EX_B - EX_A)));
  const target = (f: number) => [tx(f), th(f), tz(f), tF(f), ty(f)];
  const PRE = 60;
  const LEAD = 5;
  let s = target(-PRE + LEAD);
  let v = s.map(() => 0);
  const out: Eye[] = [];
  for (let f = -PRE + 1; f <= DURATION + 2; f++) {
    const t = target(f + LEAD);
    v = v.map((vi, i) => vi + (t[i] - s[i]) * CAM_STIFF - vi * CAM_DAMP);
    s = s.map((si, i) => si + v[i]);
    if (f >= 0) out.push({ ex: m(s[0]), eh: m(Math.exp(s[1])), ez: -m(Math.exp(-s[2])), F: Math.exp(s[3]), yh: s[4] });
  }
  return out;
})();
export const eyeAt = (f: number): Eye => {
  const i = Math.max(0, Math.min(EYE_PATH.length - 2, Math.floor(f)));
  const t = Math.max(0, Math.min(1, f - i));
  const a = EYE_PATH[i];
  const b = EYE_PATH[i + 1];
  return { ex: lerpN(a.ex, b.ex, t), eh: lerpN(a.eh, b.eh, t), ez: lerpN(a.ez, b.ez, t), F: lerpN(a.F, b.F, t), yh: lerpN(a.yh, b.yh, t) };
};
/** the depth kit's 2D camera and depth options for an eye */
export const kitCamOf = (e: Eye): { cam: Cam; eyeY: number; Dc: number } => {
  const Dc = -e.ez;
  const k = e.F / Dc;
  const eyeY = -e.eh;
  return { cam: { k, cx: e.ex, cy: eyeY - (e.yh - 960) / k }, eyeY, Dc };
};
/** screen point of a world point under an eye (no sway): for checks and culling */
export const screenOfEye = (e: Eye, X: number, Y: number, Z: number): [number, number] => {
  const d = Z - e.ez;
  return [540 + ((X - e.ex) * e.F) / d, e.yh + ((Y + e.eh) * e.F) / d];
};
