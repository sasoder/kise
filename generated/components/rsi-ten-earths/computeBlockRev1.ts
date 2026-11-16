// ---------------------------------------------------------------------------
// computeBlockRev1 — the shared world of cuts 6 + 7, revision 1 (rsi-ten-earths: ComputePerAIFalls ->
// FreedComputeRunsCopies). Pure TS. Both cuts import it; cut 7 opens on cut 6's last frame exactly. The drawing lives
// in computeBlockRev1Parts.tsx. The old computeBlockState.ts (take 1) is untouched and no longer used.
//
// UNITS: tenEarthsHall's (U = 178 per metre; floor Y = 0, up -Y; X across; Z depth behind the front plane, -Z toward
//   the camera). The robot is 240 units (1.35 m).
//
// THE BLOCK: 81 racks, 9 x 9, in tidy rows. Columns at a 300 pitch (1.7 m: each rack has room for its own work
//   station in front of it), with ONE main aisle (2.5 m) between column 4 and column 5; rows at a 600 pitch (3.4 m:
//   a rack row, then the row of stations in front of it, then a walkway). Rack id = row * 9 + col; row 0 is the front.
//   THE BOT's rack = HERO_ID (row 0, col 4) at X 0, Z 0: the front rack just left of the main aisle.
// THE STATIONS: one per rack, in front of it (the hall Desk, seat "left": the robot in profile facing +X, typing, the
//   desk at its right with the monitor). stationOf(id) gives the desk (X, Z = its near edge) and the robot's floor
//   anchor. In cut 6 only the hero station exists; in cut 7 a station is written in front of each newly lit rack.
// THE CABLE: one thick power + data cable from the hero desk (a riser up its far right leg) along the floor into the
//   main aisle and straight back through the whole block. Its lit core (cream) reaches back as far as the racks THE
//   Bot is using; when they go dark it retracts. CABLE_PATH (floor points), cableLen, cableAt(s).
// THE YEAR: stencilled on the floor of the main aisle beside the hero desk (YEAR_PAINT: the text box on the floor).
// THE LIT SETS (both cuts, mirrored): 81 -> 27 (cols 3-5, the strip along the main aisle) -> 9 (its rows 0-2) ->
//   3 (col 4, rows 0-2) -> 1 (the hero rack).
//
// THE CAMERA: a physical pinhole on the depth kit (dolly only, no lens zoom inside the kit), aimed by a rig:
//   Rig { tx, th, tz: the target (th = its height above the floor), d: the eye's distance to it, el: the elevation
//   (rad), F: the lens (screen px per unit at distance 1), sx, sy: where the target lands on screen }.
//   camOfRig(rig) -> BlockCam { cam, depth, Dc, k, H (the eye's height), ex, yH (the horizon's screen y) }.
//   No pitch: a lens shift puts the horizon at yH = sy - F tan(el), so verticals stay vertical (one-point perspective).
//   Cut 6 runs its rig from HIGH_WIDE to END_RIG in log space; cut 7 starts on END_RIG. Draw with swayCam(cam, wf)
//   where wf = the WORLD frame (cut 6: f; cut 7: END6 + f7), and rest = REST_CAM, so the join is exact.
// AIR: airWorldOf({ cam, rest: REST_CAM, depth, frame: wf, scene: AIR_SCENE, fogBy: "depth" }), <AirStage bloom 0.22>.
// ---------------------------------------------------------------------------
import { pchip, type AirScene, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { DESK, RACK, U, deskAnchors, rackGrid, shiftRacks, type RackSpec } from "./tenEarthsHall";

// ---- the block ------------------------------------------------------------------------------------------------------
export const COLS = 9;
export const ROWS = 9;
export const PITCH_X = 300;
export const ROW_PITCH = 600;
export const MAIN_AISLE_EXTRA = 380;
export const HERO_COL = 4;
export const HERO_ROW = 0;
export const HERO_ID = HERO_ROW * COLS + HERO_COL;
const RAW = rackGrid({ cols: COLS, rows: ROWS, aisle: ROW_PITCH - RACK.d, colGap: { every: 5, gap: MAIN_AISLE_EXTRA }, pitch: PITCH_X, seed0: 820 });
const HERO_RAW = RAW[HERO_ID];
export const RACKS: RackSpec[] = shiftRacks(RAW, -HERO_RAW.X, -HERO_RAW.Z);
export const rackById = (id: number) => RACKS[id];
export const rowZ = (r: number) => r * ROW_PITCH;
/** the block's footprint (racks and stations) */
export const BLOCK_X0 = RACKS[0].X - 115;
export const BLOCK_X1 = RACKS[COLS - 1].X + 115;
export const BLOCK_Z0 = -300;
export const BLOCK_Z1 = rowZ(ROWS - 1) + RACK.d;
/** the main aisle (between the col 4 and col 5 stations) */
export const AISLE = { x0: RACKS[HERO_COL].X + 115, x1: RACKS[HERO_COL + 1].X - 115 };

// ---- the lit sets ---------------------------------------------------------------------------------------------------
const ids = (c0: number, c1: number, r0: number, r1: number) => {
  const out: number[] = [];
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) out.push(r * COLS + c);
  return out;
};
/** the sets of racks THE Bot uses, year by year (cut 6 left to right; cut 7 lights them back in reverse) */
export const LIT_SETS: number[][] = [ids(0, 8, 0, 8), ids(3, 5, 0, 8), ids(3, 5, 0, 2), ids(4, 4, 0, 2), ids(4, 4, 0, 0)];
/** the racks that change at step i (1..4): in cut 6 they go dark, in cut 7 (step 5 - i) they light up again */
export const stepRacks = (i: number) => LIT_SETS[i - 1].filter((id) => !LIT_SETS[i].includes(id));
export const YEARS = ["2022", "2023", "2024", "2025", "2026"];

// ---- the stations ---------------------------------------------------------------------------------------------------
/** the desk sits in front of its rack (its far end 25 units short of the rack's front), seat "left": the desk in
 *  front of the rack's left half, the robot in the aisle to its left (X rack - 150), so from a raised eye every
 *  robot of a row behind is seen down its aisle, not hidden behind the rack in front of it (cut 7's 81 copies) */
export const DESK_GAP = 25;
export const stationOf = (id: number) => {
  const rk = RACKS[id];
  const X = rk.X - 36;
  const Z = rk.Z - DESK_GAP - DESK.w;
  const an = deskAnchors(X, Z, "left");
  return { id, X, Z, an, dir: 1 as const, row: rk.row ?? 0, col: rk.col ?? 0, zNear: Z - 2, zFar: rk.Z - DESK_GAP };
};
export const HERO_STATION = stationOf(HERO_ID);

// ---- the cable ------------------------------------------------------------------------------------------------------
export const CABLE_R = 9;
/** the riser: up the hero desk's far right leg to the desk top */
export const CABLE_RISER = { X: HERO_STATION.X + 70, Z: HERO_STATION.zFar - 18, Y0: 0, Y1: -DESK.h + 4 };
export const CABLE_X = AISLE.x0 + 40;
/** the floor run: from the riser's foot, a rounded turn into the main aisle, then straight back past the last row */
export const CABLE_PATH: [number, number][] = (() => {
  const pts: [number, number][] = [];
  const x0 = CABLE_RISER.X;
  const z0 = CABLE_RISER.Z;
  const R = 40;
  pts.push([x0, z0]);
  // along +X to the turn
  pts.push([CABLE_X - R, z0]);
  for (let i = 1; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    pts.push([CABLE_X - R + R * Math.sin(a), z0 + R - R * Math.cos(a)]);
  }
  pts.push([CABLE_X, BLOCK_Z1 + 260]);
  return pts;
})();
const CUM: number[] = (() => {
  const out = [0];
  for (let i = 1; i < CABLE_PATH.length; i++) out.push(out[i - 1] + Math.hypot(CABLE_PATH[i][0] - CABLE_PATH[i - 1][0], CABLE_PATH[i][1] - CABLE_PATH[i - 1][1]));
  return out;
})();
export const RISER_LEN = CABLE_RISER.Y0 - CABLE_RISER.Y1;
export const cableLen = CUM[CUM.length - 1];
/** the floor point at arc length s along the floor run (0 = the riser's foot) */
export const cableAt = (s: number): [number, number] => {
  const v = Math.max(0, Math.min(cableLen, s));
  let i = 1;
  while (i < CUM.length - 1 && CUM[i] < v) i++;
  const t = (v - CUM[i - 1]) / Math.max(1e-6, CUM[i] - CUM[i - 1]);
  return [CABLE_PATH[i - 1][0] + (CABLE_PATH[i][0] - CABLE_PATH[i - 1][0]) * t, CABLE_PATH[i - 1][1] + (CABLE_PATH[i][1] - CABLE_PATH[i - 1][1]) * t];
};
/** the arc length at which the cable passes depth Z in the aisle */
export const cableSAtZ = (Z: number) => {
  const zTurn = CABLE_PATH[CABLE_PATH.length - 2][1];
  return CUM[CUM.length - 2] + Math.max(0, Z - zTurn);
};
/** the lit end for a row: level with the back of that row's racks */
export const litEndForRow = (r: number) => cableSAtZ(rowZ(r) + RACK.d);

// ---- the year on the floor ------------------------------------------------------------------------------------------
/** the stencil's box on the floor of the main aisle beside the hero desk: X x0..x1 (left to right as read), Z z0 (the
 *  near edge = the digits' foot) .. z1 (their top); elongated along Z like road paint, so it reads from a raised eye */
export const YEAR_PAINT = { x0: CABLE_X + 42, x1: CABLE_X + 42 + 236, z0: -60, z1: 130 };

// ---- the camera -----------------------------------------------------------------------------------------------------
export type Rig = { tx: number; th: number; tz: number; d: number; el: number; F: number; sx: number; sy: number };
export type BlockCam = { cam: Cam; depth: DepthOpts; Dc: number; k: number; H: number; ex: number; yH: number; F: number };
export const camOfRig = (g: Rig): BlockCam => {
  const H = g.th + g.d * Math.sin(g.el);
  const ez = g.tz - g.d * Math.cos(g.el);
  const Dc = -ez;
  const k = g.F / Dc;
  const dz = g.tz + Dc;
  const ex = g.tx - ((g.sx - 540) * dz) / g.F;
  const yH = g.sy - g.F * Math.tan(g.el);
  const eyeY = -H;
  const cam: Cam = { k, cx: ex, cy: eyeY - (yH - 960) / k };
  return { cam, depth: { eyeY, dRef: Dc, kRef: k, dolly: 0 }, Dc, k, H, ex, yH, F: g.F };
};
/** the screen point of a world point (no sway) */
export const screenOf3 = (c: BlockCam, X: number, Y: number, Z: number): [number, number] => {
  const s = c.F / (c.Dc + Z);
  return [540 + (X - c.ex) * s, c.yH + (Y + c.H) * s];
};
/** screen px per unit at depth Z */
export const scaleAt = (c: BlockCam, Z: number) => c.F / (c.Dc + Z);
export const lerpRig = (a: Rig, b: Rig, t: number, tLog = t): Rig => ({
  tx: a.tx + (b.tx - a.tx) * t,
  th: a.th + (b.th - a.th) * t,
  tz: a.tz + (b.tz - a.tz) * t,
  d: Math.exp(Math.log(a.d) + (Math.log(b.d) - Math.log(a.d)) * tLog),
  el: a.el + (b.el - a.el) * t,
  F: Math.exp(Math.log(a.F) + (Math.log(b.F) - Math.log(a.F)) * t),
  sx: a.sx + (b.sx - a.sx) * t,
  sy: a.sy + (b.sy - a.sy) * t,
});

/** cut 6's last frame (world frame) and cut 7's offset onto it */
export const END6 = 141;
/** cut 6 f0: high and wide over the whole lit block, the robot small (~74 px) at its desk in front. The step rigs
 *  are solved (scratch solve.ts) so the robot grows log-evenly (74 -> 108 -> 159 -> 232 -> 340 px), the feet held
 *  near y 1040, while each lit set stays framed: 27 = cols 3-5 (x ~280-800), 9 = their rows 0-2, 3 = col 4. */
const D2R = Math.PI / 180;
export const HIGH_WIDE: Rig = { tx: 190, th: 0, tz: 1800, d: 6583, el: 32 * D2R, F: 1150, sx: 540, sy: 660 };
export const RIG_27: Rig = { tx: 190, th: 0, tz: 1600, d: 4772, el: 27 * D2R, F: 1150, sx: 540, sy: 622 };
export const RIG_9: Rig = { tx: 170, th: 40, tz: 600, d: 2642, el: 22 * D2R, F: 1150, sx: 540, sy: 800 };
export const RIG_3: Rig = { tx: 120, th: 100, tz: 300, d: 1707, el: 19 * D2R, F: 1150, sx: 540, sy: 788 };
/** cut 6's end = cut 7's start: close on the robot (~340 px) at its desk beside its one lit rack, the year beside it */
export const END_RIG: Rig = { tx: HERO_STATION.X + 136, th: 150, tz: -110, d: 873, el: 17 * D2R, F: 1150, sx: 540, sy: 775 };
/** a rig through a list of rigs at a fractional index p (pchip per field; d and F in log space) */
export const rigPath = (rigs: Rig[]) => {
  const keysOf = (fn: (g: Rig) => number) => pchip(rigs.map((g, i) => [i, fn(g)] as [number, number]), true);
  const T = { tx: keysOf((g) => g.tx), th: keysOf((g) => g.th), tz: keysOf((g) => g.tz), d: keysOf((g) => Math.log(g.d)), el: keysOf((g) => g.el), F: keysOf((g) => Math.log(g.F)), sx: keysOf((g) => g.sx), sy: keysOf((g) => g.sy) };
  return (p: number): Rig => ({ tx: T.tx(p), th: T.th(p), tz: T.tz(p), d: Math.exp(T.d(p)), el: T.el(p), F: Math.exp(T.F(p)), sx: T.sx(p), sy: T.sy(p) });
};
export const END_CAM: BlockCam = camOfRig(END_RIG);
/** the motes' and shafts' rest camera (both cuts) */
export const REST_CAM: BlockCam = camOfRig(HIGH_WIDE);

// ---- the air --------------------------------------------------------------------------------------------------------
export const AIR_SCENE: Partial<AirScene> = { mood: "interior", eyeT: 0.17, fogVis: 7000 };
export const AIR_FOG_BY = "depth" as const;
export const STAGE = { bloom: 0.22, shafts: 0.3 };
export const FLOOR = { mat: { lit: "#A8966F", mid: "#8E7C5C", dark: "#5E5242" }, tile: 0.6 * U, jointAmt: 0.6, melt: 0.5, x0: -16000, x1: 16000, z0: -20000, z1: 12000 };
