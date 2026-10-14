import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { z } from "zod";
import {
  DepthGroup,
  DynamicCable,
  Dolphin,
  FloatingPlatform,
  GhostLine,
  LockBracket,
  NavalMine,
  OceanStage,
  SCENE_A,
  SCENE_BC,
  SonarFan,
  UlyssesVehicle,
  Whale,
  cableHangOff,
  cableWidths,
  cameraTrack,
  makeCable,
  makeView,
  mineGeometry,
  unproject,
  useOcean,
  vehicleGeometry,
  type Cam,
} from "./oceanShared";

/**
 * OceanFrames — style frames of the Ulysses underwater world (oceanShared.tsx), Cheeky Pint S4E02.
 * 1080x1920, 24000/1001 fps. Four stills by frame range (or the `still` prop):
 *   F1  f0-23   open water, mid-depth: rays, snow, the surface far above
 *   F2  f24-47  cut A: the vehicle's sonar fan near the seabed reveals a moored mine; bracket closed
 *   F3  f48-71  cut B: the floating platform from below, its export cable descending in a lazy wave
 *   F4  f72-95  cut B/C: the cable's hump, ghost gear wrapped round it, a dolphin caught, a whale behind
 * OceanMotion — 72 f: F1 -> F3, one slow camera move (judge the snow / rays / surface motion).
 */
export const FPS = 24000 / 1001;
export const DURATION = 96;
export const MOTION_DURATION = 72;
export const schema = z.object({ still: z.enum(["auto", "F1", "F2", "F3", "F4"]) });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ still: "auto" });

// ---- the B/C world --------------------------------------------------------------------------
const PLAT = { x: 0, y: 0 };
const bcView0 = makeView({ frame: 0, cam: { x: 0, y: 0, k: 1 }, scene: SCENE_BC });
const HANG = cableHangOff(bcView0, PLAT);
export const CABLE = makeCable({ hang: { x: HANG.x, y: HANG.y }, z: HANG.z, seabedY: SCENE_BC.seabedY ?? 800, span: -700, sag: 330, hump: 95, tail: 500, collars: 9 });
const CAM_F1: Cam = { x: -1300, y: 300 - (1060 - 960) / 0.8, k: 0.8 };
const HOR_F1 = 1060;
const CAM_F3: Cam = { x: 40, y: 450 - (1250 - 960) / 0.8, k: 0.8 };
const HOR_F3 = 1250;

const BCWorld: React.FC<{ frame: number }> = ({ frame }) => (
  <>
    <FloatingPlatform at={PLAT} frame={frame} />
    <DepthGroup z={CABLE.z}>
      <DynamicCable cable={CABLE} />
    </DepthGroup>
  </>
);

const F1: React.FC<{ t: number }> = ({ t }) => (
  <OceanStage frame={t} cam={CAM_F1} scene={SCENE_BC} horizon={HOR_F1}>
    <BCWorld frame={t} />
  </OceanStage>
);

const F3: React.FC<{ t: number }> = ({ t }) => (
  <OceanStage frame={t} cam={CAM_F3} scene={SCENE_BC} horizon={HOR_F3}>
    <BCWorld frame={t} />
  </OceanStage>
);

// ---- F2: cut A ----------------------------------------------------------------------------------
const MINE = { x: 0, y: 0, d: 120 };
const mg = mineGeometry(MINE);
const CAM_A: Cam = { x: mg.centre.x + 10, y: mg.centre.y, k: 3 };
const HOR_A = 930;
const VEH_Z = -120;
const F2Inner: React.FC<{ t: number }> = ({ t }) => {
  const o = useOcean();
  // the Mako above and left of the mine, nose right, its pod's fan down onto the mine
  const vpos = unproject(o, 370, 440, VEH_Z);
  const vp = { x: vpos.x, y: vpos.y, L: 240, facing: 1 as const, tilt: 0.07, frame: t };
  const vg = vehicleGeometry(vp);
  // aim the fan at the mine's screen position, expressed in the vehicle's depth plane
  const mScr = { x: o.a * mg.centre.x + o.bx, y: o.a * mg.centre.y + o.by };
  const mInV = unproject(o, mScr.x, mScr.y, VEH_Z);
  const ang = Math.atan2(mInV.y - vg.emitter.y, mInV.x - vg.emitter.x);
  const range = Math.hypot(mInV.x - vg.emitter.x, mInV.y - vg.emitter.y) * 1.5;
  return (
    <>
      <DepthGroup z={VEH_Z}>
        <SonarFan x={vg.emitter.x} y={vg.emitter.y} angle={ang - 0.03} spread={1.2} range={range} sweep={0.5 + 0.35 * Math.sin(t / 9)} />
        <UlyssesVehicle {...vp} light={1} />
      </DepthGroup>
      <NavalMine {...MINE} lit={1} litFrom={{ x: mg.centre.x - 30, y: mg.centre.y - 400 }} />
      <LockBracket x={mg.centre.x} y={mg.centre.y - 4} w={mg.R * 2 * 1.42} h={mg.R * 2 * 1.42} t={1} />
    </>
  );
};
const F2: React.FC<{ t: number }> = ({ t }) => (
  <OceanStage frame={t} cam={CAM_A} scene={SCENE_A} horizon={HOR_A}>
    <F2Inner t={t} />
  </OceanStage>
);

// ---- F4: the snag ---------------------------------------------------------------------------
const S_SNAG = CABLE.sHog + 0.035;
const SNAG = CABLE.at(S_SNAG);
const K4 = 11;
// the snag a little above the true middle (the cable plane is at z = CABLE.z)
const CAM_F4: Cam = { x: SNAG.x + 6, y: SNAG.y + 24, k: K4 };
const HOR_F4 = 1180;
const F4Inner: React.FC<{ t: number }> = ({ t }) => {
  const o = useOcean();
  const W = SNAG;
  // dolphin below-right of the snag, caught by its tail stock, nose up and struggling
  const dol = { x: W.x + 9, y: W.y + 44, L: 28, facing: -1 as const, tilt: -0.42, frame: t, period: 14, amp: 0.06, bend: 0.18 };
  // its peduncle (u .86) in local coords, mirrored for facing -1
  const pedLocal = { x: (0.5 - 0.86) * dol.L, y: 0 };
  const c = Math.cos(dol.tilt * dol.facing);
  const s = Math.sin(dol.tilt * dol.facing);
  const ped = { x: dol.x + (pedLocal.x * dol.facing) * c - pedLocal.y * s, y: dol.y + (pedLocal.x * dol.facing) * s + pedLocal.y * c };
  const ghost = {
    anchor: { x: W.x, y: W.y },
    tangent: { x: W.tx, y: W.ty },
    wrap: 1,
    frame: t,
    seed: 3,
    length: 34,
    strands: 3,
    net: { w: 13, h: 12 },
    netAt: 0.86,
    to: ped,
    tie: 0.95,
    current: { x: 1, y: 0.25 },
  };
  // the whale far behind, upper left, trailing line
  const wz = -1600;
  const wp = unproject(o, 600, 1440, wz);
  const whale = { x: wp.x, y: wp.y, L: 150, facing: -1 as const, tilt: -0.05, frame: t };
  const wtail = { x: whale.x + 0.4 * whale.L, y: whale.y + 0.01 * whale.L };
  const cw = cableWidths({ ...o }, CABLE).w;
  return (
    <>
      <DepthGroup z={wz}>
        <Whale {...whale} />
        <GhostLine anchor={wtail} wrap={0} frame={t} seed={9} length={80} strands={2} net={null} current={{ x: 1, y: -0.15 }} cableW={0} />
      </DepthGroup>
      <DepthGroup z={CABLE.z}>
        <GhostLine {...ghost} cableW={cw} layer="back" />
        <DynamicCable cable={CABLE} />
        <Dolphin {...dol} />
        <GhostLine {...ghost} cableW={cw} layer="front" />
      </DepthGroup>
    </>
  );
};
const F4: React.FC<{ t: number }> = ({ t }) => (
  <OceanStage frame={t} cam={CAM_F4} scene={SCENE_BC} horizon={HOR_F4}>
    <F4Inner t={t} />
  </OceanStage>
);

const OceanFrames: React.FC<Props> = ({ still }) => {
  const f = useCurrentFrame();
  const which = still === "auto" ? (["F1", "F2", "F3", "F4"] as const)[Math.min(3, Math.floor(f / 24))] : still;
  const t = 100 + (f % 24);
  return (
    <AbsoluteFill>
      {which === "F1" ? <F1 t={t} /> : which === "F2" ? <F2 t={t} /> : which === "F3" ? <F3 t={t} /> : <F4 t={t} />}
    </AbsoluteFill>
  );
};
export default OceanFrames;

// ---- the motion test: F1 -> F3 ------------------------------------------------------------------
const MOTION = cameraTrack(CAM_F1, [{ f0: 6, f1: 66, dx: CAM_F3.x - CAM_F1.x, dy: CAM_F3.y - CAM_F1.y, warp: 1 }], MOTION_DURATION);
export const OceanMotion: React.FC<Props> = () => {
  const f = useCurrentFrame();
  const cam = MOTION[Math.min(MOTION.length - 1, f)];
  const u = (cam.x - CAM_F1.x) / (CAM_F3.x - CAM_F1.x);
  const hor = HOR_F1 + (HOR_F3 - HOR_F1) * u;
  return (
    <AbsoluteFill>
      <OceanStage frame={100 + f} cam={cam} scene={SCENE_BC} horizon={hor} rest={CAM_F1} sway>
        <BCWorld frame={100 + f} />
      </OceanStage>
    </AbsoluteFill>
  );
};
