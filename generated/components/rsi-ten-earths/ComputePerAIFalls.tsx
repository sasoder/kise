// ---------------------------------------------------------------------------
// ComputePerAIFalls (rsi-ten-earths, cut 64), REVISION 1. Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 142 frames. The world is shared with cut 7 (FreedComputeRunsCopies), which opens on
// this cut's last frame: layout, camera and air in ./computeBlockRev1.ts, the drawing in ./computeBlockRev1Parts.tsx.
// Read-only modules: ./tenEarthsHall (RackField, Desk, PLATE_FONT), ./tenEarthsBot (THE Bot, typeAtDesk).
//
// CHECK LINE: "The same AI needs a third of the machine every year: a whole hall in 2022, a single rack by 2026."
//
// THE LINE: "compute that it takes, takes to run an AI at a given level of capability has fallen by more than 3x
//   every single year. You"
// WORD -> FRAME (the director's onsets): compute 1 · run 26 · AI 37 · given 53 · capability 66 · has 70 · fallen 84 ·
//   more 96 · 3x 104 · every 116 · single 126 · year 134
// DURATION: the slot 64.6479 -> 70.5705 s = 5.923 s x 23.976 = 142 frames (f0..f141).
//
// THE MOTION: one orange robot (THE Bot, v0) types at its desk in front of a block of 81 racks (9 x 9, one main
//   aisle); one thick cable runs from its desk (a riser up the desk leg) into the main aisle and straight back through
//   the whole block, a cream core and data pulses running along it: every lit rack (warm cream glow, light on its
//   front) is compute the robot is using; a dark rack (lights off, veiled, melting into the air) is not. Its work never
//   changes (the same level of capability). All 81 stay lit through "capability"; then each year the racks it needs
//   fall to a third, each step ONE crisp wave of lights going off (~12 frames), the farthest racks first, inward toward
//   the robot; the cable's lit core retracts behind the last lit row and the year stencilled on the aisle floor beside
//   the desk turns over with each wave:
//     2022 -> 2023  f68-f80 ("has"):     the six outer columns: 81 -> 27 (the strip of cols 3-5 along the main aisle)
//     2023 -> 2024  f84-f95 ("fallen"):  the strip's back six rows: 27 -> 9; the cable's core retracts to row 2
//     2024 -> 2025  f96-f106 ("more"):   the two side columns: 9 -> 3 (the robot's column, rows 0-2)
//     2025 -> 2026  f106-f116 ("3x"):    the two behind its own rack: 3 -> 1; the core retracts to it
//   THE CAMERA: a medium-wide hold over the whole block (the robot ~116 px, the stencil ~80 px tall, the outer columns
//   running off the frame edges), drifting in slowly to f108 (~130 px) so every step is seen whole; then the big
//   log-space push on "every single year" (f110-f141), through a mid rig that keeps the robot's feet above the caption
//   band, easing out onto END_RIG: close on the robot (~340 px) beside its ONE lit rack, 2026 on the floor (cut 7 f0).
// CAUSE: a step's year swap starts 2 frames after its first rack's wave (the racks go dark, the year turns); the
//   cable's lit end is derived from the racks' power (the last row with any lit rack), never a parallel timer.
// Orange = the AIs only (COMMON.md): the robot is the one orange thing; racks slate, lights, cable core, paint cream.
//
// CHECKS: scratch rev1_cut6_7/check_*.ts (keep-in, caption bands, sizes per camera state; collision of the moving
//   camera against nothing: only lights, the cable core and the robot's hands move).
//
// SOURCES: Epoch AI, algorithmic progress in language models (Ho et al. 2024): the compute to reach a given
//   performance halves ~every 8 months (~3x per year), and Epoch's inference price per capability trend; the speaker:
//   "fallen by more than 3x every single year". On screen only the years 2022-2026; the rack counts (81, 27, 9, 3, 1)
//   are a picture of a third per year, not a census.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, airWorldOf, pchip, swayCam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { powerWave } from "./tenEarthsHall";
import { AIR_FOG_BY, AIR_SCENE, END6, END_RIG, HERO_ID, LIT_SETS, REST_CAM, STAGE, YEARS, camOfRig, litEndForRow, RACKS, RISER_LEN, ROWS, rigPath, stepRacks, type Rig } from "./computeBlockRev1";

const D2R = Math.PI / 180;
import { BlockWorld, type WorldState } from "./computeBlockRev1Parts";
/** take 1's rack helpers, still imported through this file by cut 5 (SmallerDoesTheSameJob) and an old check script */
export { BlockGlints, BlockTopShade, FeetPool, GLOW, RackHalo, RackPools, RackWash, Threads, litThreads, racksAt, threadDraw, threadHead } from "./computePerAIFallsTake1Parts";

export const FPS = 24000 / 1001;
export const DURATION = 142;
export const schema = z.object({});
export const defaultProps = schema.parse({});

// ---- the steps --------------------------------------------------------------------------------------------------------
/** when each rack's lights start going off (its 8-frame top-to-bottom wave), per step: all 81 lit through
 *  "capability" (f66); each step one crisp wave (~12 frames), the farthest racks first, inward toward the robot */
const OFF_AT = new Map<number, number>();
// 81 -> 27 on "has" (f68-f80): the six outer columns, outermost first, the back of each column a touch earlier
for (const id of stepRacks(1)) {
  const rk = RACKS[id];
  OFF_AT.set(id, 68 + (4 - Math.abs((rk.col ?? 0) - 4)) * 1.3 + (8 - (rk.row ?? 0)) * 0.15);
}
// 27 -> 9 on "fallen" (f84-f95): the strip's back six rows, back row first; the cable's lit end retracts with them
for (const id of stepRacks(2)) OFF_AT.set(id, 84 + (8 - (RACKS[id].row ?? 0)) * 0.7);
// 9 -> 3 on "more" (f96-f106): the two side columns of the front three rows, back first
for (const id of stepRacks(3)) OFF_AT.set(id, 96 + (2 - (RACKS[id].row ?? 0)) * 1.0);
// 3 -> 1 on "3x" (f106-f116): the two behind its own rack, back first
for (const id of stepRacks(4)) OFF_AT.set(id, 106 + (2 - (RACKS[id].row ?? 0)) * 1.5);
/** the year turns 2 frames after its step's first wave */
const SWAP_AT = [1, 2, 3, 4].map((i) => Math.min(...stepRacks(i).map((id) => OFF_AT.get(id) ?? 0)) + 2);
const SWAP_W = 10;
export const yearAt = (f: number) => {
  let i = 0;
  while (i < 4 && f >= SWAP_AT[i]) i++;
  // i = the number of swaps started; the latest one may still be crossfading
  if (i === 0) return { from: YEARS[0], to: YEARS[0], t: 1 };
  return { from: YEARS[i - 1], to: YEARS[i], t: Math.min(1, (f - SWAP_AT[i - 1]) / SWAP_W) };
};
export const powerAt = (f: number) => {
  const m = new Map<number, { power: number; relight: boolean }>();
  for (const [id, f0] of OFF_AT) m.set(id, powerWave(f, f0, "off"));
  return m;
};
/** the cable's lit length (riser + floor) from the racks' power: it reaches the back of the last row with any light */
export const litSOf = (power: Map<number, { power: number; relight: boolean }>) => {
  let s = 0;
  for (let r = 0; r < ROWS; r++) {
    let pw = 0;
    for (let c = 0; c < 9; c++) {
      const p = power.get(r * 9 + c);
      pw = Math.max(pw, p ? p.power : 1);
    }
    if (pw <= 0) continue;
    const s0 = r === 0 ? 0 : litEndForRow(r - 1);
    s = Math.max(s, s0 + (litEndForRow(r) - s0) * pw);
  }
  return RISER_LEN + s;
};

// ---- the camera -------------------------------------------------------------------------------------------------------
/** a medium-wide hold over the whole block (robot ~116 px, the stencil ~80 px tall), a slow drift in while it darkens
 *  (robot ~130 px at f108), then the big log-space push to the close-up on "every single year" (f110-f141), easing out
 *  onto END_RIG (cut 7's f0) */
const HOLD0: Rig = { tx: 170, th: 0, tz: 1200, d: 4339, el: 32 * D2R, F: 1150, sx: 540, sy: 619 };
const HOLD1: Rig = { tx: 170, th: 0, tz: 1050, d: 3866, el: 32 * D2R, F: 1150, sx: 540, sy: 620 };
/** halfway in (the robot ~257 px), its feet held at y ~1030 so the push never drops them toward the caption band */
const PUSH_MID: Rig = { tx: 135, th: 75, tz: 470, d: 1837, el: 24.5 * D2R, F: 1150, sx: 540, sy: 639 };
const PATH = rigPath([HOLD0, HOLD1, PUSH_MID, END_RIG]);
const PROG = pchip([
  [0, 0],
  [54, 0.5],
  [108, 1.0],
  [114, 1.12],
  [124, 1.95],
  [133, 2.68],
  [138, 2.96],
  [END6, 3.0],
]);
export const rigAt6 = (f: number) => PATH(Math.min(3, PROG(f)));
export const camAt6 = (f: number) => camOfRig(rigAt6(f));

export const worldState6 = (f: number): WorldState => {
  const power = powerAt(f);
  return {
    wf: f,
    power,
    stations: [{ id: HERO_ID, appear: 1, glow: 0, boot: 1, poseFrame: f, seed: 0, variant: 0 }],
    litS: litSOf(power),
    pulse: 1,
    year: yearAt(f),
  };
};

/** sanity: the last lit set is the hero rack alone */
if (LIT_SETS[4].length !== 1 || LIT_SETS[4][0] !== HERO_ID) throw new Error("ComputePerAIFalls: the last lit set must be the hero rack");

const ComputePerAIFalls: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const C = camAt6(frame);
  const cam = swayCam(C.cam, frame);
  const rest = swayCam(REST_CAM.cam, 0);
  const A = airWorldOf({ cam, rest, depth: C.depth, frame, scene: AIR_SCENE, fogBy: AIR_FOG_BY });
  return (
    <AirStage v={A.v} bloom={STAGE.bloom} shafts={STAGE.shafts}>
      <WorldSvg cam={cam}>
        <BlockWorld A={A} cam={cam} st={worldState6(frame)} uid="cb6" />
      </WorldSvg>
    </AirStage>
  );
};

export default ComputePerAIFalls;
