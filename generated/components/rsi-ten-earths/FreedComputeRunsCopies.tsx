// ---------------------------------------------------------------------------
// FreedComputeRunsCopies (rsi-ten-earths, cut 71), REVISION 1. Dwarkesh 3D style (styles/dwarkesh-3d.md).
// Opaque 1080x1920, 23.976 fps, 262 frames. Opens EXACTLY on cut 6's last frame (ComputePerAIFalls f141): the same
// world (./computeBlockRev1.ts layout, camera and air; ./computeBlockRev1Parts.tsx drawing), the world clock running
// on from 141 (wf = 141 + frame: twinkle, typing, sway, motes, pulses continue), the camera starting on END_RIG.
// Read-only modules: ./tenEarthsHall (RackField, Desk, powerWave), ./tenEarthsBot (THE Bot, typeAtDesk, bootUp).
//
// CHECK LINE: "The freed racks don't sit idle: each one now runs another copy of the AI, so the robots multiply until
//   the hall is full of them."
//
// THE LINE: "effectively tripling the population of AIs every single year thanks to software efficiency gains, because
//   the compute that gets freed up thanks to this algorithmic progress can then be used to run more copies. So"
// WORD -> FRAME (the director's onsets): tripling 19 · population 39 · AIs 54 · every 61 · single 68 · year 73 ·
//   efficiency 118 · gains 125 · freed 160 · up 165 · algorithmic 187 · progress 196 · run 236 · more 241 · copies 248
// DURATION: the slot 71.5715 -> 82.4991 s = 10.928 s x 23.976 = 262 frames (f0..f261).
//
// THE MOTION: the dark racks light up again, generation by generation, 1 -> 3 -> 9 -> 27 -> 81, each generation ONE
//   crisp wave (its racks within ~3 frames, its copies all arriving within ~8), then a beat of stillness. Each newly lit
//   rack (the house light wave, its halo, wash and pool coming back) gets its OWN new robot: 3 frames after the wave
//   starts its station (chair, desk, robot) fades up with a small squash on its floor point (6 frames) under a soft
//   cream glow at the rack, booting as it lands (bootUp from half on, 10 frames), then types on its own clock. Every
//   copy is THE Bot v0 (copies of the same AI; confirmed by the director). The floor year turns with each generation:
//     1 -> 3    2027  racks f14, copies f17-f23 ("tripling"):            the two beside it in the front row
//     3 -> 9    2028  racks f57-f60, copies f60-f69 ("every single year"): the two rows behind them (the 3 x 3)
//     9 -> 27   2029  racks f114-f117, copies f117-f126 ("efficiency gains"): the strip's back six rows
//     "freed up" (f157-f170): a clear cream pulse with an outline runs front to back through the 54 idle racks, which
//              then settle dim (a faint residual light) until their own wave fills them
//     27 -> 81  2030  racks f229-f233, copies f232-f242 ("run more copies"): the six outer columns, all rows
//   The camera pulls back IN LOG SPACE in step with the growth, craning up (front robots 340 -> 178 -> 163 -> 152 ->
//   142 px); on "copies" (f248) the whole block is lit and full, the near rows running off both sides and the rows up
//   into the haze. Living hold to the end.
// CAUSE: a station arrives only after its rack's light wave has started; its robot boots as it lands and types once on.
//   The year turns 2 frames after its generation's first wave. The hero robot's cable stays as cut 6 left it.
// Orange = the AIs only (COMMON.md): the robots are the only orange things.
//
// CHECKS: scratch rev1_cut6_7/check7.ts and scripts/clips/rsi-ten-earths/check-freed-compute.ts (every frame: keep-in
//   and caption bands for every visible face, station overlap, f0 = cut 6 f141 state).
//
// SOURCES: Epoch AI, algorithmic progress in language models (Ho et al. 2024): the compute for a given performance
//   falls ~3x per year, so the same hardware runs ~3x the copies (the speaker's mechanism). No figures on screen;
//   1 -> 3 -> 9 -> 27 -> 81 is a picture of tripling, not a census.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage, WorldSvg, airWorldOf, pchip, swayCam } from "../kits/dwarkesh-3d/dwarkesh3d";
import { powerWave } from "./tenEarthsHall";
import { AIR_FOG_BY, AIR_SCENE, END6, END_RIG, HERO_ID, RACKS, REST_CAM, STAGE, camOfRig, rigPath, type Rig } from "./computeBlockRev1";
import { BlockWorld, type StationState, type WorldState } from "./computeBlockRev1Parts";
import { litSOf, powerAt, yearAt } from "./ComputePerAIFalls";

export const FPS = 24000 / 1001;
export const DURATION = 262;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
/** the world clock: cut 6's, running on */
export const wfOf = (f: number) => END6 + f;

// ---- the generations ---------------------------------------------------------------------------------------------------
const colOf = (id: number) => RACKS[id].col ?? 0;
const rowOf = (id: number) => RACKS[id].row ?? 0;
/** when each rack's lights start coming on (its 8-frame top-to-bottom wave) */
export const ON_AT = new Map<number, number>();
/** which generation each rack belongs to (1..4) */
export const GEN_OF = new Map<number, number>();
for (const rk of RACKS) {
  const id = rk.id ?? 0;
  const r = rowOf(id);
  const c = colOf(id);
  const ac = Math.abs(c - 4);
  if (id === HERO_ID) continue;
  // each generation one crisp wave (its racks within ~3 frames, nearest first), then a beat of stillness
  if (r === 0 && ac === 1) {
    ON_AT.set(id, 14);
    GEN_OF.set(id, 1);
  } else if (r <= 2 && ac <= 1) {
    ON_AT.set(id, 57 + (r - 1) * 1.2 + ac * 0.6);
    GEN_OF.set(id, 2);
  } else if (ac <= 1) {
    ON_AT.set(id, 114 + (r - 3) * 0.5 + ac * 0.4);
    GEN_OF.set(id, 3);
  } else {
    ON_AT.set(id, 229 + r * 0.35 + (ac - 2) * 0.6);
    GEN_OF.set(id, 4);
  }
}
/** a station arrives 3 frames after its rack's wave starts (6 frames: fade up with a small squash, a cream glow at the
 *  rack), boots while it lands (bootUp from half on, over 10 frames), then types on its own clock */
const APPEAR_DELAY = 3;
const APPEAR_DUR = 6;
const BOOT_DUR = 10;
/** the boot starts already half on (screen lit, eyes opening): no dark, bowed screen-head on view */
const BOOT_T0 = 0.42;
const powerAt7 = (f: number) => {
  const m = new Map<number, { power: number; relight: boolean }>();
  for (const [id, f0] of ON_AT) m.set(id, f < f0 ? { power: 0, relight: false } : powerWave(f, f0, "on"));
  return m;
};
export const stationAt = (id: number, f: number): StationState => {
  const f0 = (ON_AT.get(id) ?? 0) + APPEAR_DELAY;
  const appear = c01((f - f0) / APPEAR_DUR);
  const fb = f0 + 2;
  const boot = f < fb ? BOOT_T0 : BOOT_T0 + (1 - BOOT_T0) * c01((f - fb) / BOOT_DUR);
  const g = (f - (f0 - 2)) / 14;
  // one glow per new station; the big generations dimmer each, so 18 or 54 together do not white the frame out
  const gk = [0, 0.9, 0.75, 0.45, 0.22][GEN_OF.get(id) ?? 1];
  const glow = g <= 0 || g >= 1 ? 0 : gk * Math.sin(Math.PI * g) ** 1.5;
  const seed = 1 + ((id * 7919) % 97);
  const base = (seed * 13) % 60;
  return { id, appear, glow, boot, poseFrame: base + Math.max(0, f - fb - BOOT_DUR), seed, variant: 0 };
};
/** the year on the floor: one more each generation (2027 .. 2030), the swap 2 frames after its first rack's wave */
const GEN_F0 = [1, 2, 3, 4].map((g) => Math.min(...[...GEN_OF].filter(([, gg]) => gg === g).map(([id]) => ON_AT.get(id) ?? 0)));
const SWAP7 = GEN_F0.map((f) => f + 2);
const YEARS7 = ["2026", "2027", "2028", "2029", "2030"];
const SWAP_W = 10;
export const yearAt7 = (f: number) => {
  let i = 0;
  while (i < 4 && f >= SWAP7[i]) i++;
  if (i === 0) return yearAt(END6);
  return { from: YEARS7[i - 1], to: YEARS7[i], t: Math.min(1, (f - SWAP7[i - 1]) / SWAP_W) };
};

// ---- the freed racks' sheen (f143-f190) -----------------------------------------------------------------------------
/** "freed up" (f158-f172): a clear cream pulse runs through the 54 idle racks, front to back, then they settle dim
 *  (a faint residual light) until their own wave fills them */
const SHEEN_F0 = 157;
const SHEEN_F1 = 167;
export const sheenAt = (f: number) => {
  if (f < 153 || f > 245) return undefined;
  const m = new Map<number, number>();
  for (const [id, g] of GEN_OF) {
    if (g !== 4) continue;
    const tc = SHEEN_F0 + (rowOf(id) / 8) * (SHEEN_F1 - SHEEN_F0) + (Math.abs(colOf(id) - 4) - 2) * 0.4;
    const crest = Math.exp(-(((f - tc) / 3.2) ** 2));
    const after = 0.1 * c01((f - tc) / 5);
    const lit = f < (ON_AT.get(id) ?? 0) ? 0 : powerWave(f, ON_AT.get(id) ?? 0, "on").power;
    m.set(id, Math.max(crest, after) * (1 - lit));
  }
  return m;
};

// ---- the camera ---------------------------------------------------------------------------------------------------------
/** the stage rigs (robots' heights in px for the front-row robot at the stage) */
const RIG7_3: Rig = { tx: 90, th: 100, tz: 0, d: 1775, el: 20 * D2R, F: 1150, sx: 540, sy: 895 }; // 178 px
const RIG7_9: Rig = { tx: 130, th: 60, tz: 400, d: 2381, el: 22 * D2R, F: 1150, sx: 540, sy: 822 }; // 163 px
const RIG7_27: Rig = { tx: 150, th: 20, tz: 1000, d: 3180, el: 23 * D2R, F: 1150, sx: 540, sy: 696 }; // 152 px
export const RIG7_81: Rig = { tx: 110, th: 0, tz: 2500, d: 5023, el: 25 * D2R, F: 1150, sx: 540, sy: 283 }; // 142 px
const PATH7 = rigPath([END_RIG, RIG7_3, RIG7_9, RIG7_27, RIG7_81]);
const PROG7 = pchip([
  [0, 0],
  [6, 0.1],
  [16, 0.62],
  [30, 0.93],
  [56, 1.05],
  [76, 1.75],
  [100, 2.0],
  [114, 2.06],
  [136, 2.85],
  [160, 3.0],
  [228, 3.18],
  [248, 3.94],
  [261, 4.0],
]);
export const rigAt7 = (f: number) => PATH7(Math.min(4, PROG7(f)));
export const camAt7 = (f: number) => camOfRig(rigAt7(f));

// ---- the state ----------------------------------------------------------------------------------------------------------
/** cut 6's last frame's cable and year, held */
const LIT_S = litSOf(powerAt(END6));
export const worldState7 = (f: number): WorldState => {
  const wf = wfOf(f);
  const stations: StationState[] = [{ id: HERO_ID, appear: 1, glow: 0, boot: 1, poseFrame: wf, seed: 0, variant: 0 }];
  for (const id of ON_AT.keys()) {
    const s = stationAt(id, f);
    if (s.appear > 0) stations.push(s);
  }
  return { wf, power: powerAt7(f), stations, litS: LIT_S, pulse: 1, year: yearAt7(f), sheen: sheenAt(f) };
};

const FreedComputeRunsCopies: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const wf = wfOf(frame);
  const C = camAt7(frame);
  const cam = swayCam(C.cam, wf);
  const rest = swayCam(REST_CAM.cam, 0);
  const A = airWorldOf({ cam, rest, depth: C.depth, frame: wf, scene: AIR_SCENE, fogBy: AIR_FOG_BY });
  return (
    <AirStage v={A.v} bloom={STAGE.bloom} shafts={STAGE.shafts}>
      <WorldSvg cam={cam}>
        <BlockWorld A={A} cam={cam} st={worldState7(frame)} uid="cb6" />
      </WorldSvg>
    </AirStage>
  );
};

export default FreedComputeRunsCopies;
