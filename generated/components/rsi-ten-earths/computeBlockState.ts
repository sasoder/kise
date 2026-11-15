// ---------------------------------------------------------------------------
// computeBlockState — the hand-over of cut 6 (ComputePerAIFalls) to cut 7 (FreedComputeRunsCopies), rsi-ten-earths.
// Pure TS, no JSX. Cut 7 opens on cut 6's LAST state: import these names read-only. Changes after BLOCK_READY.md
// only ADD names (logged in animation_source/notes/SHARED_CHANGES.md).
//
// THE WORLD (tenEarthsHall units: U = 178 per metre, floor Y = 0, up -Y, Z depth behind the front plane)
//   BLOCK_RACKS        = BLOCK_27 as is (9 across at a 1.2 m pitch x 3 deep, front row Z 0 / 463 / 926), seeds kept.
//   LIT_RACK           = BLOCK_27_LAST (4): the front-centre rack, the one left lit at the end of cut 6.
//   BLOCK_END_POWER    id -> power at cut 6's last frame (1 for LIT_RACK, 0 for the other 26).
//   GENIUS             the one Genius: v0, standing three-quarter facing screen right (GENIUS_POSES.stand(1, f)),
//                      feet at (X, Z) on the floor IN FRONT of the block, off-centre to the left of the lit rack so
//                      the rack shows whole beside him. geniusPoseFrame(f6) = the frame passed to stand() in cut 6;
//                      cut 7 continues the breath with stand(1, GENIUS_END_POSE_FRAME + f7 + gap) or simply
//                      stand(1, f7 + GENIUS_END_POSE_FRAME) (the speaker's 1 s sits between, so the breath phase
//                      is free).
//   THREADS            the cream floor threads from a lit rack's foot to the Genius's feet: threadEnds(id) -> the
//                      world start (rack foot) and end (beside his feet), THREAD_STYLE their look. SUPERSEDED in cut 6
//                      (kept): threadEndsPool / THREAD_STRIP / POOL / poolStrength = the threads as floor strips running
//                      into a soft cream pool at his feet (what cut 6 draws).
//   PLATE              the year plate (YearPlate) on the floor at the Genius's right: world X, Y, Z and size.
//
// THE CAMERA: a physical camera on one lens (F_LENS world px), the vanishing point on the block's axis (cx 0), the eye
//   EYE_H up (5.6 m: the three rows read as three rows), a pure DOLLY creep straight in from Dc 1325 to 1250 (front
//   row 6 % larger), the floor point (0, 0, ANCHOR_Z) held at screen y ANCHOR_SY so the picture grows about the gap
//   between the block and the Genius. camState(f) -> { cam, depth, Dc, k }; draw with swayCam(cam, f) as the cut
//   does (CAM_SWAY = true; swayCam from the kit). END_FRAME = 141 (cut 6's last frame): camState(END_FRAME) is the
//   END camera. Cut 7 opens on it: camState7(f7) may continue the same dolly (DC_SPEED units per frame) or hold.
//   AIR: airWorldOf({ cam, rest: swayCam(camState(0).cam, 0), depth, frame, scene: AIR_SCENE, fogBy: AIR_FOG_BY })
//   inside <AirStage v bloom={STAGE.bloom} shafts={STAGE.shafts}>. Floor: AirFloor with FLOOR (mat, tiles, melt).
// ---------------------------------------------------------------------------
import type { AirScene, Cam, DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { BLOCK_27, BLOCK_27_LAST, U, type RackSpec } from "./tenEarthsHall";

// ---- the block ------------------------------------------------------------------------------------------------------
export const BLOCK_RACKS: RackSpec[] = BLOCK_27.map((rk) => ({ ...rk }));
export const LIT_RACK = BLOCK_27_LAST;
export const BLOCK_END_POWER: Record<number, number> = Object.fromEntries(BLOCK_RACKS.map((rk) => [rk.id ?? 0, rk.id === LIT_RACK ? 1 : 0]));

// ---- the camera -----------------------------------------------------------------------------------------------------
export const END_FRAME = 141;
/** the lens: screen px per world unit at distance 1 (F / distance = the screen scale at that depth) */
export const F_LENS = 640;
/** the eye's height above the floor (world units; 5.6 m) */
export const EYE_H = 1000;
/** the dolly: the eye's distance to the block's front plane, f0 -> END_FRAME (linear: a constant creep) */
export const DC0 = 1325;
export const DC1 = 1250;
export const DC_SPEED = (DC1 - DC0) / END_FRAME;
/** the floor point (X 0, Z ANCHOR_Z) held at screen y ANCHOR_SY on every frame */
export const ANCHOR_Z = -150;
export const ANCHOR_SY = 892;
export const CAM_SWAY = true;

export type BlockCam = { cam: Cam; depth: DepthOpts; Dc: number; k: number; yH: number };
export const camAtDc = (Dc: number): BlockCam => {
  const k = F_LENS / Dc;
  const yH = ANCHOR_SY - (EYE_H * F_LENS) / (Dc + ANCHOR_Z);
  const eyeY = -EYE_H;
  const cam: Cam = { k, cx: 0, cy: eyeY - (yH - 960) / k };
  return { cam, depth: { eyeY, dRef: Dc, kRef: k, dolly: 0 }, Dc, k, yH };
};
export const camState = (f: number): BlockCam => camAtDc(DC0 + DC_SPEED * f);
export const END_CAM: BlockCam = camState(END_FRAME);
/** screen point of a world point under camState (no sway) */
export const screenAt = (c: BlockCam, X: number, Y: number, Z: number): [number, number] => {
  const s = F_LENS / (c.Dc + Z);
  return [540 + (X - c.cam.cx) * s, c.yH + (Y + EYE_H) * s];
};

// ---- the air --------------------------------------------------------------------------------------------------------
export const AIR_SCENE: Partial<AirScene> = { mood: "interior", eyeT: 0.17, fogVis: 6000 };
export const AIR_FOG_BY = "depth" as const;
export const STAGE = { bloom: 0.22, shafts: 0.3 };
/** the floor: the style's sand-umber one step lighter (cut 3's), 0.6 m tiles, melting into the haze */
export const FLOOR = { mat: { lit: "#A8966F", mid: "#8E7C5C", dark: "#5E5242" }, tile: 0.6 * U, jointAmt: 0.6, melt: 0.5, x0: -14000, x1: 14000, z0: -20000, z1: 9000 };

// ---- the Genius -----------------------------------------------------------------------------------------------------
/** feet on the floor: screen ~ (415, 1060) at the end camera, ~234 px tall */
export const GENIUS = { variant: 0, X: -167, Z: -397, dir: 1 as const, pose: "stand" as const };
/** the frame cut 6 passes to GENIUS_POSES.stand on its frame f */
export const geniusPoseFrame = (f6: number) => f6;
export const GENIUS_END_POSE_FRAME = geniusPoseFrame(END_FRAME);
export const GENIUS_SHADOW = { w: 62, d: 30, amt: 0.8 };

// ---- the threads ----------------------------------------------------------------------------------------------------
export const THREAD_STYLE = { px: 1.7, opacity: 0.62, glowPx: 5, glowOpacity: 0.12, side: 38, spread: 22 };
/** a rack's thread: from its front foot (a hair in front of the face) to the floor beside the Genius's shoes: racks
 *  to his left plug in at his left shoe, racks to his right at his right shoe (never behind his body, so no thread
 *  reads as a stick he holds), the ends fanned a little by distance so they never meet in one knot */
export const threadEnds = (rk: RackSpec): { a: [number, number, number]; b: [number, number, number] } => {
  const d = rk.X - GENIUS.X;
  // the column right behind him (X -214, just right of his feet on screen) plugs in at his RIGHT shoe: to the left
  // shoe its thread would show as a stick down his left leg
  const side = d >= -100 ? 1 : -1;
  const off = THREAD_STYLE.side + THREAD_STYLE.spread * Math.min(1, Math.abs(d) / 900);
  return { a: [rk.X, 0, rk.Z - 3], b: [GENIUS.X + side * off, 0, GENIUS.Z + 2] };
};

/** ADDED after BLOCK_READY (director review 1): THE FEET POOL. The threads no longer plug into his shoes (a lone
 *  thread read as a cane leaning on his leg); each is a line of light ON THE FLOOR (a floor-plane strip, THREAD_STRIP)
 *  running into a soft cream pool on the floor at his feet. POOL: centre (X, Z), floor radii rx / rz (world units;
 *  ~88 px wide at the end camera), its strength poolStrength(n) for n lit threads (summed thread heads, 0..27). */
export const POOL = { X: GENIUS.X, Z: GENIUS.Z - 4, rx: 70, rz: 44, rim: 0.8, maxAngle: 0.62, bendX: 0.2, bendZ: 0.25, bendFar: 620 };
export const poolStrength = (n: number) => (n <= 0.001 ? 0 : Math.min(1, 0.8 + 0.2 * Math.sqrt(Math.min(27, n) / 27)) * Math.min(1, n * 2));
/** floor-strip half widths (world units): the core line and its soft glow edge */
export const THREAD_STRIP = { core: 3.2, glow: 9, coreOpacity: 0.7, glowOpacity: 0.16, pulse: 4.4 };
/** a rack's thread into the pool: from its front foot to the pool's SIDE rim (his left side for racks to his left,
 *  his right side for the rest, as threadEnds), on the floor beside his shoes and clear of his legs on screen: far
 *  racks enter at the side (angle 0), the racks behind him further round toward the back (up to maxAngle rad) */
export const threadEndsPool = (rk: RackSpec): { a: [number, number, number]; b: [number, number, number] } => {
  const d = rk.X - GENIUS.X;
  const side = d >= -100 ? 1 : -1;
  const th = POOL.maxAngle * (1 - Math.min(1, Math.abs(d) / 1000));
  return { a: [rk.X, 0, rk.Z - 3], b: [POOL.X + side * POOL.rim * POOL.rx * Math.cos(th), 0, POOL.Z + POOL.rim * POOL.rz * Math.sin(th)] };
};

/** the thread's floor PATH into the pool (what cut 6 draws): a quadratic curve on the floor plane that leaves the rack
 *  heading straight toward the camera and turns into the pool's side rim, so on screen it arcs away from his legs
 *  (a straight line from a rack behind him read as a stick leaning on him). Point at u 0..1 (world, Y 0). */
export const threadPathPool = (rk: RackSpec): { a: [number, number, number]; c: [number, number, number]; b: [number, number, number] } => {
  const { a, b } = threadEndsPool(rk);
  // the bend fades out for the racks far to the side (their straight lines already slant clear of him, and the plate
  // sits under the right-hand fan): w 1 right behind him -> 0 from |dX| POOL.bendFar
  const w = 1 - Math.min(1, Math.abs(rk.X - GENIUS.X) / POOL.bendFar);
  const bent: [number, number] = [a[0] + (b[0] - a[0]) * POOL.bendX, b[2] + (a[2] - b[2]) * POOL.bendZ];
  const mid: [number, number] = [(a[0] + b[0]) / 2, (a[2] + b[2]) / 2];
  const c: [number, number, number] = [mid[0] + (bent[0] - mid[0]) * w, 0, mid[1] + (bent[1] - mid[1]) * w];
  return { a, c, b };
};
export const threadPointPool = (path: ReturnType<typeof threadPathPool>, u: number): [number, number] => {
  const { a, c, b } = path;
  const v = 1 - u;
  return [v * v * a[0] + 2 * v * u * c[0] + u * u * b[0], v * v * a[2] + 2 * v * u * c[2] + u * u * b[2]];
};

// ---- the plate ------------------------------------------------------------------------------------------------------
/** the year plate on the floor at the Genius's right, in front of the block (YearPlate's X, Y (text centre), Z, size) */
export const PLATE = { X: 399, Y: -35, Z: -355, size: 118 };
export const PLATE_YEARS = ["2023", "2024", "2025", "2026"];
export const PLATE_END_TEXT = "2026";
