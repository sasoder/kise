// ---------------------------------------------------------------------------
// centuriesHallPlan: the hall of the Roman centuries (cut 125, CenturiesOfLittleScience): its geometry and the one
// camera, pure TS (the cut and its audit scripts read it). Units: METRES. X across (right = +X when looking down the
// hall), Y height (floor 0, up +), Z along the hall (the door at Z -2, the far wall at Z 38.5).
//
// THE HALL: a door wall (Z -2) with a bright doorway, six bays divided by transverse arches at Z 4, 9, 14, 19, 24, 29
// (bay I is a little longer: it holds the door's vestibule), each arch carved I..VI on a plaque over its crown (on
// both faces: walking in you read I, II, III ... receding; from the far end, VI, V, IV ... receding). Each bay: a tall
// timber armarium of pigeonholes on each side wall, a pair of bare stone plinths flanking the aisle, a high window in
// the left wall (the light, from the upper left and a little ahead, falls across the aisle onto the right side's
// floor and the foot of the right armaria). The end chamber (Z 29..38.5): the one plinth that holds something, a
// small orange aeolipile (Hero's steam toy), on the axis; a tall window in the end wall. A flat ceiling at 9 m.
//
// THE CAMERA: a pinhole with yaw only (verticals stay vertical; a vertical lens shift instead of any tilt), focal
// F px, the principal point (PX, PY). Opening: close on bay I's right armarium (yaw +56 deg), pulling back (away
// from it, back toward the door) and up while it turns to look down the hall; then one forward dolly, accelerated
// once (f30-70), at one constant speed down the axis past arches I..VI, slowing in the end chamber as it swings round
// the aeolipile's +X side (looking at it the whole way) to come to rest behind it, looking back down the hall.
// ---------------------------------------------------------------------------

export const FPS = 30000 / 1001;
export const DURATION = 276;

/** focal length, px (HFOV ~71 deg in the 1080 frame) */
export const F = 760;

// ---- the hall --------------------------------------------------------------------------------------------------
export const WALL_X = 3.6; // the side walls' inner faces at X = +-WALL_X
export const DOOR_Z = -2.0;
export const END_Z = 38.5;
export const CEIL_Y = 9.0;
/** the transverse arches: centre Z of each (k = 1..6 -> numeral k), thickness ARCH_T */
export const ARCH_Z = [4, 9, 14, 19, 24, 29] as const;
export const ARCH_T = 0.9;
/** the arch opening: piers' inner faces at +-PIER_X, the springing at IMPOST_Y, a semicircle of radius PIER_X */
export const PIER_X = 2.6;
export const IMPOST_Y = 3.4;
export const CROWN_Y = IMPOST_Y + PIER_X; // 6.0
/** the archivolt band round the opening (a raised moulding on each face) */
export const ARCHIVOLT_W = 0.32;
/** the numeral plaque over the crown, on both faces: centre height, half width, half height; the numeral cap */
export const PLAQUE = { y: 6.98, hw: 0.86, hh: 0.5, out: 0.06, cap: 0.68 };
export const NUMERALS = ["I", "II", "III", "IV", "V", "VI"] as const;

/** bays: [z0, z1] between the arch faces (the door wall for bay I, the end wall for the end chamber) */
export const BAYS: readonly [number, number][] = [
  [DOOR_Z, ARCH_Z[0] - ARCH_T / 2],
  ...ARCH_Z.slice(0, 5).map((z, i): [number, number] => [z + ARCH_T / 2, ARCH_Z[i + 1] - ARCH_T / 2]),
];
export const END_CHAMBER: [number, number] = [ARCH_Z[5] + ARCH_T / 2, END_Z];

// ---- the armaria (pigeonhole cabinets against the side walls) ---------------------------------------------------
export const ARM = {
  front: 3.05, // the front plane at X = +-front (the back against the wall at WALL_X)
  depth: 0.46, // the cubbies' depth (back panel at front + depth)
  y0: 0.0,
  base: 0.34, // a solid base under the first row
  top: 4.05, // the top of the last row
  cornice: 4.38, // the cornice's top
  stile: 0.09, // the outer stiles' width
  bar: 0.07, // the dividers
  rows: 6,
  colW: 0.63, // target cubby width (the count fits the cabinet's width)
};
export type Armarium = { id: string; bay: number; side: -1 | 1; z0: number; z1: number; cols: number };
export const ARMARIA: Armarium[] = [
  ...BAYS.flatMap(([b0, b1], i) => {
    // bay I: from just inside the door's reveal; others centred between the piers
    const z0 = i === 0 ? -1.35 : b0 + 0.2;
    const z1 = b1 - 0.2;
    const cols = Math.max(3, Math.round((z1 - z0 - 2 * ARM.stile + ARM.bar) / (ARM.colW + ARM.bar)));
    return ([-1, 1] as const).map((side): Armarium => ({ id: `a${i}${side < 0 ? "L" : "R"}`, bay: i, side, z0, z1, cols }));
  }),
  // the end chamber: two more (empty) on each side wall, either side of the aeolipile
  ...([
    [END_CHAMBER[0] + 0.2, 33.4],
    [33.8, END_Z - 0.2],
  ] as const).flatMap(([z0, z1], j) =>
    ([-1, 1] as const).map((side): Armarium => ({ id: `a6${side < 0 ? "L" : "R"}${j}`, bay: 6, side, z0, z1, cols: Math.max(3, Math.round((z1 - z0 - 2 * ARM.stile + ARM.bar) / (ARM.colW + ARM.bar))) })),
  ),
];
/** cubby k (col c, row r) of an armarium: its opening on the front plane, Z and Y extents */
export const cubbyOf = (a: Armarium, c: number, r: number) => {
  const cw = (a.z1 - a.z0 - 2 * ARM.stile - (a.cols - 1) * ARM.bar) / a.cols;
  const rh = (ARM.top - ARM.base - (ARM.rows - 1) * ARM.bar) / ARM.rows;
  const z0 = a.z0 + ARM.stile + c * (cw + ARM.bar);
  const y0 = ARM.base + r * (rh + ARM.bar);
  return { z0, z1: z0 + cw, y0, y1: y0 + rh, cw, rh };
};

// ---- the scrolls that exist (orange: knowledge): a handful in the whole hall ------------------------------------
/** [armarium id, col, row, count]: bay II (Galen, Ptolemy; no names on screen; glinting in the big picture and the
 *  dolly's first seconds), one in bay IV ("Roman empire makes") and one in bay VI (ahead on "knowledge") */
export const SCROLLS: readonly { arm: string; col: number; row: number; n: number }[] = [
  { arm: "a1R", col: 3, row: 3, n: 3 },
  { arm: "a1L", col: 4, row: 4, n: 2 },
  { arm: "a3L", col: 2, row: 3, n: 1 },
  { arm: "a5R", col: 3, row: 4, n: 1 },
];

// ---- the plinths (bare) and the one with the aeolipile ----------------------------------------------------------
export const PLINTH = { hw: 0.4, h: 1.3, baseH: 0.14, capH: 0.12, lip: 0.06 };
export const PLINTH_X = 1.72;
export const PLINTHS: { id: string; X: number; Z: number }[] = BAYS.flatMap(([b0, b1], i) => {
  const zc = i === 0 ? (1.0 + b1) / 2 + 0.3 : (b0 + b1) / 2;
  return ([-1, 1] as const).map((s) => ({ id: `p${i}${s < 0 ? "L" : "R"}`, X: s * PLINTH_X, Z: zc }));
});
/** the aeolipile's plinth on the axis of the end chamber; the device's centre height (look-at target) */
/** Rev 1: the plinth stands 2 m past arch VI (the camera is on it by ~f200); the device stands ~1.3 m (fire basin,
 *  cauldron, pivot tubes, the sphere and its jets); cy = its middle (the look-at height) */
export const DEVICE = { X: 0, Z: 31.4, top: PLINTH.h, cy: PLINTH.h + 0.65, h: 1.3 };

// ---- the windows (left wall: the light; right wall: dim panes; the end wall) and the light -------------------------
export const WIN = { y0: 5.0, y1: 8.05, hw: 0.72, depth: 0.55 };
export const WINDOW_Z: number[] = [...BAYS.map(([b0, b1], i) => (i === 0 ? 1.0 : (b0 + b1) / 2)), DEVICE.Z];
export const END_WIN = { y0: 3.4, y1: 7.6, hw: 1.0 };
export const DOORWAY = { hw: 1.5, h: 5.2 };
/** the light's direction of travel (from the upper left and a little ahead, toward the lower right) */
const Lr = [0.9, -0.9, -0.15];
const Ln = Math.hypot(Lr[0], Lr[1], Lr[2]);
export const LIGHT: [number, number, number] = [Lr[0] / Ln, Lr[1] / Ln, Lr[2] / Ln];

// ---- the camera ---------------------------------------------------------------------------------------------------
export type HallCam = { x: number; y: number; z: number; yaw: number; px: number; py: number; f: number };
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const sstep = (u: number) => {
  const v = c01(u);
  return v * v * (3 - 2 * v);
};
const smoother = (u: number) => {
  const v = c01(u);
  return v * v * v * (v * (v * 6 - 15) + 10);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// THE TIMING (frames): the opening's pull-back f0..~32, the forward dolly accelerated once (f30 -> f70) to V, held
// constant down the axis; from f176 the camera turns (one eased yaw, YAW_END over f176-274, peak 2.53 deg/f, ~34 px/f
// on the far hall) while it keeps the aeolipile dead ahead: it rides a line through the device at radius R, and R
// eases from the dolly's closing speed to rest at R_END by f232 (3.7 m at f200: the device is the subject from there).
// The swing round the device's +X side is the turn itself; the total speed never exceeds V and only falls after the
// dolly (the closing speed is capped by the swing). Arch VI's right pier passes 0.31 m clear (camera X <= 2.29 there).
export const T = { turn1: 46, rise1: 48, x1: 54, acc0: 30, acc1: 70, yaw0: 176, yaw1: 274, r1: 232 };
/** the turn: settles ~15 deg short of looking straight back down the hall; the yaw ease's time warp (a later peak) */
export const YAW_END = -165;
const YAW_WARP = 1.0;
/** the radius the camera comes to rest at, behind the aeolipile */
export const R_END = 2.8;
/** the opening: where the camera starts (close on bay I's right armarium) */
const OPEN = { x: 2.05, z: -0.42, y: 1.52, yaw: 56, vBack: 0.042 };
/** the dolly's speed (m / frame) after the one acceleration */
export const V = 0.2;
/** Z velocity of the opening + forward dolly, by frame (back, through zero at acc0, up to V at acc1) */
const vzOpen = (f: number) => (f < T.acc0 ? -OPEN.vBack * (1 - sstep(f / T.acc0)) : V * smoother((f - T.acc0) / (T.acc1 - T.acc0)));
/** integrate the Z velocity of the opening to f (exact sums at 1/8 frame) */
const ZOPEN: number[] = (() => {
  const out = [OPEN.z];
  let z = OPEN.z;
  const sub = 8;
  for (let f = 0; f < DURATION + 2; f++) {
    for (let k = 0; k < sub; k++) z += vzOpen(f + (k + 0.5) / sub) / sub;
    out.push(z);
  }
  return out;
})();
/** the turn's yaw (deg), 0 through the dolly */
const yawTurn = (f: number) => {
  const u = (f - T.yaw0) / (T.yaw1 - T.yaw0);
  return u <= 0 ? 0 : YAW_END * sstep(Math.pow(c01(u), YAW_WARP));
};

/** the camera's distance to the aeolipile after acc1: closing at V, eased to rest at R_END by T.r1 (R0 chosen so) */
const R_ACC1 = DEVICE.Z - ZOPEN[T.acc1];
export const R0_FRAME = (2 * (R_ACC1 - R_END)) / V + 2 * T.acc1 - T.r1;
const RARR: number[] = (() => {
  const out: number[] = [];
  const sub = 8;
  let R = R_ACC1;
  for (let f = 0; f <= DURATION + 2; f++) {
    if (f <= T.acc1) {
      out.push(DEVICE.Z - ZOPEN[f]);
      continue;
    }
    for (let k = 0; k < sub; k++) {
      const ff = f - 1 + (k + 0.5) / sub;
      // the closing speed, capped so the total (closing + the swing R w) never exceeds the dolly's V
      const w = (Math.abs(yawTurn(ff + 0.5 / sub) - yawTurn(ff - 0.5 / sub)) * sub * Math.PI) / 180;
      const cap = Math.sqrt(Math.max(0, V * V - R * w * (R * w)));
      R -= Math.min(V * (1 - smoother((ff - R0_FRAME) / (T.r1 - R0_FRAME))), cap) / sub;
    }
    out.push(Math.max(R_END, R));
  }
  return out;
})();
const interpArr = (arr: number[], f: number) => {
  const i = Math.max(0, Math.min(arr.length - 2, Math.floor(f)));
  const t = f - i;
  return arr[i] + (arr[i + 1] - arr[i]) * t;
};
/** the camera at frame f (pure) */
export const camAt = (f: number): HallCam => {
  let x: number;
  let z: number;
  let yaw: number;
  if (f <= T.acc1) {
    // X eases from the armarium to the axis (moving away from it from f0, at rest on the axis by x1); the opening's
    // turn toward the armarium eases off (moving from f0) to look down the axis at the aeolipile
    const u = c01(f / T.x1);
    const sx = -1.4 * u * u * u + 1.8 * u * u + 0.6 * u;
    x = OPEN.x * (1 - sx);
    z = interpArr(ZOPEN, f);
    const ut = c01(f / T.turn1);
    const turn = 1 - (-1.2 * ut * ut * ut + 1.5 * ut * ut + 0.7 * ut);
    yaw = (Math.atan2(DEVICE.X - x, DEVICE.Z - z) * 180) / Math.PI + OPEN.yaw * turn;
  } else {
    // on the line through the aeolipile at the turn's yaw: the device is always dead ahead
    yaw = yawTurn(f);
    const R = interpArr(RARR, f);
    const a = (yaw * Math.PI) / 180;
    x = DEVICE.X - R * Math.sin(a);
    z = DEVICE.Z - R * Math.cos(a);
  }
  // height: up from the shelf's height to the dolly's (from f0), down a little round the aeolipile
  const ur = c01(f / T.rise1);
  const rise = -1.1 * ur * ur * ur + 1.6 * ur * ur + 0.5 * ur;
  const y = lerp(OPEN.y, 2.6, rise) + lerp(0, -1.05, smoother((f - 200) / 64));
  // the principal point: the eye's row lifted in the dolly (more floor, arches above), then set so the aeolipile
  // sits near the frame's middle as the camera swings round it (a vertical lens shift: verticals stay vertical)
  const dz = Math.hypot(DEVICE.X - x, DEVICE.Z - z);
  // (35 px higher through the orbit, where the camera looks down on it, so its basin stays above y ~1100 and clear of
  // the name tag at y 1140-1280; eased back at rest so arch VI's numeral stays in frame)
  const pyDevice = lerp(875, 910, smoother((f - 238) / 34)) - (F * (y - DEVICE.cy)) / Math.max(0.5, dz);
  const pyDolly = lerp(960, 1000, sstep(f / 50));
  const py = lerp(pyDolly, pyDevice, smoother((f - 140) / 72));
  return { x, y, z, yaw, px: 540, py, f };
};

// ---- projection -----------------------------------------------------------------------------------------------------
export type V3 = [number, number, number];
export const NEAR = 0.08;
/** camera space: [xc (right), yc (up), zc (depth)] */
export const toCam = (c: HallCam, P: V3): V3 => {
  const a = (c.yaw * Math.PI) / 180;
  const sa = Math.sin(a);
  const ca = Math.cos(a);
  const dx = P[0] - c.x;
  const dy = P[1] - c.y;
  const dz = P[2] - c.z;
  return [dx * ca - dz * sa, dy, dx * sa + dz * ca];
};
export const camToScreen = (c: HallCam, q: V3): [number, number] => [c.px + (F * q[0]) / q[2], c.py - (F * q[1]) / q[2]];
export const project = (c: HallCam, P: V3): [number, number] => camToScreen(c, toCam(c, P));
