// ---------------------------------------------------------------------------
// FleetWaitsOnFuel (scott-nolan-fuel, cut 5). Cheeky Pint style (stout) in real 3D (nuclearWorld + fuelShared). RENDER --gl=angle.
// Opaque 1080x1920, 23.976 fps, 133 frames.
//
// CHECK LINE: "However many reactors we want to build, small modular or gigawatt-sized, they are all waiting on one thing: fuel."
//
// THE LINE (after "What is the one thing that could prevent all" on camera): "the reactors from scaling, all the SMRs or gigawatt
// scale light water reactors? And it's fuel."
// WORD -> FRAME: the 5 · reactors 9 · from 18 · scaling 24 · all 32 · the 39 · SMRs 42 · or 56 · gigawatt 62 · scale 74 · light 81 ·
// water 96 · reactors 101 · And 110 · it's 120 · fuel 125 (the edit cuts back to the speaker at f133)
// DURATION: the slot 5.547 -> 11.094 s = 5.547 s x 23.976 = 133 frames (f0..f132).
//
// THE MOTION: one continuous camera move. It opens already dollying along one row of ten small modular reactors (small domed
// buildings) as they rise out of their dark slots one after another, the rising wave running a little ahead of the camera while it
// eases back; by "SMRs" (f42) a long run of them stands in shot. The row ends in a gigawatt light water plant that is already
// standing: the camera lifts and pulls back and the plant comes in from frame right (first edge about f50), its cooling tower's top
// from the frame top, fully in shot by about f90, dwarfing the modules. From f90 the camera tilts down onto the board in front
// of the row: an open zirconium fuel rod (grey metal) lies there, a row of four amber uranium pellets in front of its mouth is
// pushed slowly toward it (the gap closes through the hold) and two loose pellets stand beside the row. They come up from the
// frame's bottom-left (f100), the light pool slides onto them and the whole fleet recedes to board dim (f105-f117). Settled by
// f122: the rod and the pellets in the light, the dimmed fleet and plant whole above them. The label
// URANIUM FUEL comes in over the row f116-f128, readable on "fuel." (f125).
// CAUSE: a module rises out of its slot only when the wave running along the row reaches it; the fleet dims as the pool leaves it;
// the row moves only toward the rod's mouth.
// AMBER = uranium fuel only: the pellets are the only amber in the cut. Reactors cream, dimmed to board.
//
// SOURCES: no figures on screen. SMR: NuScale-like power module (fuelShared). Plant: AP1000-like containment + natural-draught tower.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CAM_DAMP, CAM_STIFF, camEase } from "../kits/cheeky-pint/oceanShared";
import { Label, SPACE } from "../kits/cheeky-pint/stoutShared";
import { NuclearStage, SoftShadows, nuclearProject, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { FuelRod, GigawattPlant, PelletGlow, SmrModule, UraniumPellet, fuelRodShadowItems, gigawattShadowItems, pelletRowPoses, pelletShadowItems, smrShadowItems } from "./fuelShared";

export const FPS = 24000 / 1001;
export const DURATION = 133;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const D2R = Math.PI / 180;
const c01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (a: number, b: number, v: number) => {
  const t = c01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number) => a + (b - a) * t;

// --- the world: one row of modules along X, the plant at its end set a little back, the pellet on the board in front --------
export const ROW_PITCH = 32;
export const ROW_N = 10;
const modAt = (i: number): [number, number] => [i * ROW_PITCH, 0];
export const PLANT_AT: [number, number] = [(ROW_N - 1) * ROW_PITCH + 66, 50];
// the landing: an open zirconium fuel rod lying on the board in front of the fleet, a short row of uranium pellets in front of
// its mouth being pushed slowly toward it (the gap closes during the hold), two loose pellets standing beside the row
export const PEL_H = 10; // a pellet: height = diameter (fuelShared PELLET.ASPECT 1)
const PEL_GAP = 0.6;
const ROD_DIR: [number, number, number] = [-Math.cos(35 * D2R), 0, Math.sin(35 * D2R)]; // into the rod: left and away
const ROD = { len: 110, r: 5.45, bore: 5.15 } as const;
/** the composition's centre at rest */
export const LAND_C: [number, number, number] = [160, PEL_H / 2, -560];
const PEL_N = 4;
const ROW_LEN = PEL_N * (PEL_H + PEL_GAP);
// the gap between the row's leading pellet and the mouth: open as it comes into view, closing slowly through the hold
const gapAt = (f: number) => mix(14, 6, smooth(96, 160, f));
const MOUTH_BACK = 10 + ROW_LEN / 2; // from LAND_C back along ROD_DIR to the mouth
export const ROD_MOUTH: [number, number, number] = [LAND_C[0] + ROD_DIR[0] * MOUTH_BACK, PEL_H / 2, LAND_C[2] + ROD_DIR[2] * MOUTH_BACK];
// two loose pellets standing on the board past the row's free end, apart from it (one a little behind, one a little in front)
const OUT: [number, number] = [-ROD_DIR[0], -ROD_DIR[2]];
const SIDE: [number, number] = [-ROD_DIR[2], ROD_DIR[0]]; // horizontal, perpendicular to the row: toward the camera
const along = (a: number, s: number): [number, number] => [LAND_C[0] + OUT[0] * a + SIDE[0] * s, LAND_C[2] + OUT[1] * a + SIDE[1] * s];
const LOOSE: [number, number][] = [along(27, -7), along(43, 1)];
/** what the camera lands on: the middle of the rod mouth .. the loose pellets */
const AIM: [number, number, number] = [along(12, 0)[0], PEL_H / 2, along(12, 0)[1]];
const LABEL_F0 = 116; // the label's 12-frame entrance, settled on "fuel." (f125)

// --- the camera: an eye and a look point, each on the house damped follower (pre-rolled, so it is moving at f0) ---------------
type Rig = { ex: number; ey: number; ez: number; lx: number; ly: number; lz: number; f: number; cy: number };
type RigGlide = { f0: number; f1: number; to: Partial<Rig>; warp?: number };
const orbit = (l: [number, number, number], d: number, yaw: number, pitch: number) => {
  const sy = Math.sin(yaw * D2R);
  const cyw = Math.cos(yaw * D2R);
  const sp = Math.sin(pitch * D2R);
  const cp = Math.cos(pitch * D2R);
  return { ex: l[0] - sy * cp * d, ey: l[1] + sp * d, ez: l[2] - cyw * cp * d, lx: l[0], ly: l[1], lz: l[2] };
};
const PRE = 40;
const rigTrack = (start: Rig, glides: RigGlide[], frames: number): Rig[] => {
  const keys = Object.keys(start) as (keyof Rig)[];
  const lg = (k: string, v: number) => (k === "f" ? Math.log(v) : v);
  const pos: Record<string, number> = {};
  const vel: Record<string, number> = {};
  for (const k of keys) {
    pos[k] = lg(k, start[k]);
    vel[k] = 0;
  }
  const out: Rig[] = [];
  for (let f = -PRE; f <= frames + 2; f++) {
    const o: Record<string, number> = {};
    for (const k of keys) {
      let v = lg(k, start[k]);
      let prev = v;
      for (const g of glides) {
        const t = g.to[k];
        if (t === undefined) continue;
        v += (lg(k, t) - prev) * camEase((f - g.f0) / (g.f1 - g.f0), g.warp ?? 1);
        prev = lg(k, t);
      }
      vel[k] = vel[k] + (v - pos[k]) * CAM_STIFF - vel[k] * CAM_DAMP;
      pos[k] += vel[k];
      o[k] = k === "f" ? Math.exp(pos[k]) : pos[k];
    }
    if (f >= 0) out.push(o as Rig);
  }
  return out;
};
const START: Rig = { ...orbit([40, 16, 0], 165, 28, 20), f: 2300, cy: 650 };
// the plant phase: the eye stands back and up on nearly the final line of sight, so the crane down brings the pellet straight up
const PLANT_EYE: [number, number, number] = [113, 300, -832];
const lookFrom = (e: [number, number, number], yaw: number, pitch: number, d: number) => ({
  lx: e[0] + Math.sin(yaw * D2R) * Math.cos(pitch * D2R) * d,
  ly: e[1] - Math.sin(pitch * D2R) * d,
  lz: e[2] + Math.cos(yaw * D2R) * Math.cos(pitch * D2R) * d,
});
const FINAL = orbit(AIM, 95, 8, 16);
const RIG = rigTrack(
  START,
  [
    // the dolly along the row, slow while the camera is close, under way before f0 ...
    { f0: -10, f1: 66, to: orbit([190, 16, 0], 165, 27, 20) },
    // ... and the ease back as the run of standing modules grows
    { f0: -8, f1: 64, to: orbit([190, 16, 0], 440, 18, 20) },
    // lift and pull back: the standing plant comes in from frame right, its tower's top from the frame top
    { f0: 46, f1: 98, to: { ...lookFrom(PLANT_EYE, 15, 13, 900), ex: PLANT_EYE[0], ey: PLANT_EYE[1], ez: PLANT_EYE[2], f: 2600, cy: 620 } },
    // crane down and in onto the pellet in front of the row
    { f0: 90, f1: 115, to: { ...FINAL, f: 1000, cy: 890 } },
    // the living hold: a slow creep in
    { f0: 112, f1: 210, to: orbit(AIM, 92, 8.3, 16) },
  ],
  DURATION,
);
export const camAt = (f: number): NuclearCam => {
  const k = RIG[Math.max(0, Math.min(RIG.length - 1, f))];
  const dx = k.lx - k.ex;
  const dy = k.ly - k.ey;
  const dz = k.lz - k.ez;
  const d = Math.hypot(dx, dy, dz);
  return { tx: k.lx, ty: k.ly, tz: k.lz, d, yaw: Math.atan2(dx, dz) / D2R, pitch: Math.asin(-dy / d) / D2R, f: k.f, cy: k.cy, cx: 540 };
};

// --- the rising wave: it runs along the row a little faster than the camera, so the run of standing modules in shot grows ------
const WAVE_X0 = 100; // the wave front at f0 (modules behind it are already up, module 2 is mid-rise)
const WAVE_V = 5.3; // units per frame: the last slot opens about f35
const MOD_RISE = 15;
const modStart = Array.from({ length: ROW_N }, (_, i) => (modAt(i)[0] - WAVE_X0) / WAVE_V);
const modRise = (i: number, f: number) => smooth(0, 1, (f - modStart[i]) / MOD_RISE);
// the fleet recedes to board dim as the pool leaves it for the pellet
// fog fixed in world units from the eye (not in multiples of d): the far fleet stays in shot behind the close pellet
const FOG_UNITS: [number, number] = [1350, 3600];
const DIM_F0 = 105;
const DIM_F1 = 117;

const FleetWaitsOnFuel: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = f + 600;
  const cam = camAt(f);
  const dim = smooth(DIM_F0, DIM_F1, f);
  const row = pelletRowPoses({ mouth: ROD_MOUTH, dir: ROD_DIR, n: PEL_N, h: PEL_H, gap: PEL_GAP, slide: -gapAt(f) });
  const poses = [...row, ...LOOSE.map((q) => ({ c: [q[0], PEL_H / 2, q[1]] as [number, number, number], h: PEL_H }))];
  const shadows = [
    ...Array.from({ length: ROW_N }, (_, i) => smrShadowItems(modAt(i), { rise: modRise(i, f) })).flat(),
    ...gigawattShadowItems(PLANT_AT),
    ...fuelRodShadowItems(ROD_MOUTH, ROD_DIR, ROD.len, ROD.r),
    ...pelletShadowItems(poses),
  ];
  // the pool: over the fleet, then onto the pellet (its screen point)
  const pel = nuclearProject(cam, [AIM[0], PEL_H * 0.55, AIM[2]]);
  const lab = nuclearProject(cam, [AIM[0], PEL_H * 1.5, AIM[2]]); // above the row, clear of the rod rising to the left
  const toPel = smooth(DIM_F0 - 3, DIM_F1, f);
  const pool = { x: mix(470, pel.x, toPel), y: mix(700, pel.y - 30, toPel), strength: 1 };
  return (
    <NuclearStage
      cam={cam}
      S={S}
      boardUnits={170}
      fog={[FOG_UNITS[0] / cam.d, FOG_UNITS[1] / cam.d]}
      pool={pool}
      overlay={
        <>
          <PelletGlow cam={cam} poses={poses} />
          <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", left: 0, top: 0 }}>
            <Label x={lab.x} y={lab.y - SPACE.CLEAR} k={1} px={64} tone="cream" text="Uranium fuel" enter={c01((f - LABEL_F0) / 12)} />
          </svg>
        </>
      }
      world={
        <>
          <SoftShadows items={shadows} />
          {Array.from({ length: ROW_N }, (_, i) => (
            <SmrModule key={i} at={modAt(i)} rise={modRise(i, f)} dim={dim} shadow={false} slot />
          ))}
          <GigawattPlant at={PLANT_AT} dim={dim} S={S} shadow={false} />
          <FuelRod mouth={ROD_MOUTH} dir={ROD_DIR} len={ROD.len} r={ROD.r} bore={ROD.bore} />
          {poses.map((p, i) => (
            <UraniumPellet key={i} pose={p} />
          ))}
        </>
      }
    />
  );
};

export default FleetWaitsOnFuel;
