// ---------------------------------------------------------------------------
// itsHomeState: the world and camera of cut 91 ItsHome (sarah-insurgency), pure data (no React), exported for cut 96
// FurtherAwayLower, which opens on ItsHome's END STATE (same world, picture and heights; not a pixel join).
//
// THE PLACE: a colonial farm on the west bank of the Hudson near Kingston / Hurley, NY (41.93 N, 74.02 W on the
// insurgency-atlantic map: world (44, -127)); the camera looks along YAW 79 = the map's straight line from here to
// London (yawToward(farm, PLACES.london) = 79.3), i.e. "east" toward the Atlantic and Britain. The coast (New England)
// lies ~290 world px (~290 km) ahead, deep in the haze (the 10m coast is never close: WORLD_READY caveat).
//
// END STATE (f82): the farmhouse (HOUSE) at the foot of the risen orange value column (COLUMN, full height, standing
// on the map, its tear closed), chimney smoke drifting; the camera END_KEY (the tracked camera at f82 written as a
// CamKey: feed it to camOfKey or use it as cut 96's first key) and END_CAM (the Cam itself).
// ---------------------------------------------------------------------------
import { ATLANTIC, camTrack, dirOfYaw, toScreen, type Cam, type CamKey, type P2 } from "./insurgencyShared";

/** the cut's view yaw: the map's straight line from the farm toward London */
export const YAW = 79;
const FWD = dirOfYaw(YAW); // [x, 0, z]
/** the camera's right on the ground at YAW */
const RIGHT: P2 = [Math.cos((YAW * Math.PI) / 180), Math.sin((YAW * Math.PI) / 180)];
/** a ground point `f` world units ahead (along YAW) and `r` to the right of `p` */
export const offsetFrom = (p: P2, f: number, r: number): P2 => [p[0] + FWD[0] * f + RIGHT[0] * r, p[1] + FWD[2] * f + RIGHT[1] * r];

/** the farmhouse: map position, size (its width, world units) and the yaw its front faces (toward the lens, turned
 *  28 deg so a gable end shows) */
export const HOUSE = { x: 44, z: -127, size: 26, face: YAW + 180 + 28 } as const;
/** the orange value column: right behind the house and to its left (its foot and tear clear of the roof), r and the
 *  full height (world units; the house ridge is 0.7 x 26 = 18.2, the chimney top 21.3) */
const COL_AT = offsetFrom([HOUSE.x, HOUSE.z], 15, -24);
export const COLUMN = { x: COL_AT[0], z: COL_AT[1], r: 5.4, height: 112 } as const;
/** the yaw the column's SQUARE parts (abacus, plinth) face: square with the house (ValueColumn `face`; additive,
 *  pass it in cut 96 so the column matches) */
export const COLUMN_FACE = HOUSE.face;
/** the column's rise: drive 0 -> 1 from RISE.f0 to RISE.f1 (the tear opens at f0, the capital breaks the surface
 *  ~1 f later, fully up and the tear closed under the plinth at f1) */
export const RISE = { f0: 43, f1: 70 } as const;
/** the hearth: the window warms over f27 -> f37 ("it's HOME" 37); the chimney smoke starts at f31 */
export const HEARTH = { f0: 27, f1: 37, smoke0: 31 } as const;

/** the Hudson (the map's hand-traced course, APPROXIMATE), the stretch round the farm */
export const HUDSON: P2[] = ATLANTIC.RIVER_HUDSON.pts.filter((p) => p[1] < -60 && p[1] > -260);

// ---- the camera ------------------------------------------------------------------------------------------------------
const H: P2 = [HOUSE.x, HOUSE.z];
const at = (f: number, r: number) => {
  const p = offsetFrom(H, f, r);
  return { x: p[0], z: p[1] };
};
/** one continuous camera: a low slow push toward the house (f0-40), then a pull-back and tilt up with the rising
 *  column (f42-68: the frame follows the column's top up), then a slow living creep */
export const KEYS: CamKey[] = [
  { f: 0, ...at(3, 1), ty: 0, D: 126, pitch: 15, yaw: YAW - 5 },
  { f: 40, ...at(3, 0), ty: 1, D: 103, pitch: 14, yaw: YAW - 2 },
  { f: 68, ...at(8, -5), ty: 11, D: 172, pitch: 7.5, yaw: YAW },
  { f: 82, ...at(8.3, -5.2), ty: 11.4, D: 177, pitch: 7.3, yaw: YAW + 0.5 },
  { f: 110, ...at(8.8, -5.5), ty: 12, D: 185, pitch: 7, yaw: YAW + 1.3 },
];
export const camAt = camTrack(KEYS, 120);
export const LAST = 82;
/** the tracked camera at ItsHome's last frame (f82) */
export const END_CAM: Cam = camAt(LAST);
/** the same, as a CamKey (target on the ground (x, z), ty, D, pitch, yaw, F): cut 96's opening key (f 0) */
export const END_KEY: CamKey = { f: 0, x: END_CAM.T[0], z: END_CAM.T[2], ty: END_CAM.T[1], D: END_CAM.D, pitch: END_CAM.pitch, yaw: END_CAM.yaw, F: END_CAM.F };
/** the camera's velocity at f82 per frame (cut 96 may ease out of it): d(target), dD, dpitch, dyaw */
const PREV = camAt(LAST - 1);
export const END_VEL = { x: END_CAM.T[0] - PREV.T[0], z: END_CAM.T[2] - PREV.T[2], ty: END_CAM.T[1] - PREV.T[1], D: END_CAM.D - PREV.D, pitch: END_CAM.pitch - PREV.pitch, yaw: END_CAM.yaw - PREV.yaw };
/** where the end state sits on screen at f82 (for checks): the house foot, the column's foot and top */
export const END_SCREEN = {
  houseFoot: toScreen(END_CAM, HOUSE.x, 0, HOUSE.z),
  columnFoot: toScreen(END_CAM, COLUMN.x, 0, COLUMN.z),
  columnTop: toScreen(END_CAM, COLUMN.x, COLUMN.height, COLUMN.z),
};
