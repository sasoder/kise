// ===================================================================================================================
// paulWorldProbe — probe stills of the shared world (paulWorld / paulWorldSets / paulFolk) at typical cut framings,
// and the outsider's style sheet beside the pandemics Worker. probe 0 = folk sheet, 1..7 = the sets of S1..S7,
// 8 = a motion probe (frame-driven: frames 0..47 of the HACKTRON insert, for checking the per-frame update).
// ===================================================================================================================
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { OutsiderOnScreen, Outsider, WorkerOnScreen, outsiderCarry, outsiderReach, outsiderStand, outsiderWalk } from "./paulFolk";
import { makeOutsider3D, outsiderCarry3D, outsiderReach3D, outsiderStand3D, outsiderWalk3D, walkPlan, type OutsiderPose3D } from "./paulOutsider3d";
import { D2R, PaulStage, camTrack, clamp01, ease01, living, mix, orbitCam, type CamDef, type Orbit, type V3, type WorldSpec } from "./paulWorld";
import {
  RULER,
  TOWER,
  VAULT,
  codeRowOfLayer,
  layerY,
  makeCardStream,
  makeContributors,
  makeDashedCase,
  makeDial,
  makeFlagToken,
  makeGapBracket,
  makeGhostRing,
  makeHacktronPanel,
  makeLens,
  makeMonorepo,
  makeNamePlate,
  makeOrangeStack,
  makeOutsiderDoor,
  makeRuler,
  makeSlackStack,
  makeThread,
  makeVault,
  monthZ,
  yawTo,
} from "./paulWorldSets";

export const FPS = 24000 / 1001;
export const schema = z.object({ probe: z.number().int().min(0).max(8) });
export const defaultProps = schema.parse({ probe: 1 });

// ---- folk sheet ---------------------------------------------------------------------------------------------------
const FOLK_CAM = orbitCam({ target: [0, 0.6, 0], dist: 14, yaw: 0, pitch: 8, fov: 30 });
const FOLK_SPEC: WorldSpec = { fog: { near: 14, far: 40 }, build: () => () => {} };
const FolkSheet: React.FC<{ f: number }> = ({ f }) => {
  const s = 0.62;
  const row1 = 760;
  const row2 = 1180;
  return (
    <PaulStage
      spec={FOLK_SPEC}
      cam={FOLK_CAM}
      frame={f}
      air={{ foreground: 0, lowAir: 0.4 }}
      overlay={() => (
        <>
          <WorkerOnScreen x={170} y={row1} scale={s} uid="wk" />
          <OutsiderOnScreen x={420} y={row1} scale={s} pose={outsiderStand({ hood: "up", frame: 30 })} uid="o1" />
          <OutsiderOnScreen x={660} y={row1} scale={s} pose={outsiderCarry(30, "tote", { hood: "down" })} uid="o2" toteCards={3} />
          <OutsiderOnScreen x={900} y={row1} scale={s} pose={outsiderCarry(30, "laptop", { hood: "up" })} uid="o3" />
          <OutsiderOnScreen x={170} y={row2} scale={s} pose={outsiderWalk(3, { yaw: 0 })} uid="o4" />
          <OutsiderOnScreen x={420} y={row2} scale={s} pose={outsiderWalk(9, { yaw: 60, carry: "tote" })} uid="o5" toteCards={2} />
          <OutsiderOnScreen x={660} y={row2} scale={s} pose={outsiderReach(1, { yaw: -35 })} uid="o6" />
          <OutsiderOnScreen x={900} y={row2} scale={s} pose={outsiderStand({ hood: "down", yaw: 30, fumble: 1, frame: 11 })} uid="o7" />
        </>
      )}
    />
  );
};

// ---- S1: the vaults -----------------------------------------------------------------------------------------------
const S1_CAM = orbitCam({ target: [0.3, -0.35, 1.0], dist: 17, yaw: 3, pitch: 12, fov: 26 });
const S1_OUT: [number, number, number] = [1.75, 0, 2.5];
const S1_SPEC: WorldSpec = {
  fog: { near: 10, far: 36 },
  light: { center: [0, 1, 1], span: 6 },
  build: (w) => {
    const A = makeVault(w, { x: VAULT.X_OPENAI, brand: "openai" });
    const B = makeVault(w, { x: VAULT.X_ANTHROPIC, brand: "anthropic" });
    const sA = makeCardStream(w, { path: [...A.rampPath, [-0.4, 0.02, 2.62], [0.6, 0.02, 2.75], [1.42, 0.02, 2.62]], n: 10 });
    const sB = makeCardStream(w, { path: [...B.rampPath, [1.15, 0.02, 2.52], [1.42, 0.02, 2.6]], n: 6, seed: 7 });
    return () => {
      A.update({ hatchOpen: 1, cardsLeft: 3, ghost: 1 });
      B.update({ hatchOpen: 1, cardsLeft: 4.4, ghost: 1 });
      sA.update({ ts: (i) => 0.06 + i * 0.095 });
      sB.update({ ts: (i) => 0.1 + i * 0.16 });
    };
  },
};

// ---- S2 / S3: the monorepo ----------------------------------------------------------------------------------------
const S2_CAM = orbitCam({ target: [0.2, 0.25, 0.6], dist: 25, yaw: 12, pitch: 9, fov: 28 });
const S2_SPEC: WorldSpec = {
  fog: { near: 14, far: 44 },
  light: { center: [0, 1.8, 0], span: 8 },
  build: (w) => {
    const T = makeMonorepo(w);
    const C = makeContributors(w, T, { n: 16, seed: 3 });
    const D = makeOutsiderDoor(w, T);
    const out = makeThread(w, [[5.5, 0.02, 6.5], [3.5, 0.02, 3.8], [1.8, 0.02, 2.1], [0.85, 0.03, 1.3], [0.62, 0.12, 0.98], [0.55, 0.2, 0.86]], { r: 0.02, color: "#6C6964", beads: 1 });
    return () => {
      T.update({ rewrite: [0, 0, 0, 0.5, 0, 0, 0, 0, 0.4, 0, 0, 0] });
      C.update({ lit: C.items.map((_, i) => (i % 3 === 0 ? 1 : 0.15)), beads: C.items.map((_, i) => (i % 3 === 0 ? 0.62 + 0.1 * (i % 2) : -1)) });
      D.update({ glow: 1, open: 1, keyIn: 1, keyTurn: 1 });
      out.update({ draw: 1, lit: 0, beads: [0.7] });
    };
  },
};
const S2_OUT: [number, number, number] = [1.25, 0, 1.5];
const S3_CAM = orbitCam({ target: [0.6, 0.8, 0.3], dist: 17, yaw: 16, pitch: 8, fov: 30 });
const S3_SPEC: WorldSpec = {
  fog: { near: 8, far: 32 },
  light: { center: [0.5, 2, 0], span: 6 },
  build: (w) => {
    const T = makeMonorepo(w);
    makeContributors(w, T, { n: 14, seed: 5 });
    const L = makeLens(w);
    const Hk = makeHacktronPanel(w, T, { gapAt: 6 });
    return () => {
      T.update({ gapAt: 6, gapOpen: 1 });
      L.update({ pos: [-0.25, layerY(9), TOWER.D / 2 + 0.45], read: 1, row: codeRowOfLayer(9) });
      Hk.update({ insert: 0.55, glint: 0 });
    };
  },
};

// ---- S4: dial and Slack -------------------------------------------------------------------------------------------
const S4_CAM = orbitCam({ target: [-0.1, 0.7, 0.7], dist: 17.5, yaw: 5, pitch: 8, fov: 28 });
const S4_OUT: [number, number, number] = [-0.22, 0, 0.6];
const S4_SPEC: WorldSpec = {
  fog: { near: 10, far: 36 },
  light: { center: [0, 1.5, 0.5], span: 7 },
  build: (w) => {
    const D = makeDial(w, { pos: [-1.3, 1.28, 0.7], yaw: 16 });
    const Sl = makeSlackStack(w, { x: 0.95 });
    const P = makeNamePlate(w, { image: { path: "paul-twelve-hours/cathedral_black.png", aspect: 1928 / 268, capFrac: 0.8 }, at: [1.12, 0, 2.1], w: 1.0, yaw: -8, stem: 0.04 });
    return () => {
      D.update({ sweep: 0.82 });
      Sl.update({ open: [0, 1, 0.3, 1, 0, 0.8, 0] });
      P.update({ show: 1 });
    };
  },
};

// ---- S5 / S6 / S7: the ruler --------------------------------------------------------------------------------------
const S5_CAM: CamDef = { pos: [-7.3, 6.9, 11.2], target: [0.45, -0.75, -2.3], fov: 25 };
const S5_SPEC: WorldSpec = {
  fog: { near: 16, far: 42 },
  light: { center: [0, 0.6, -2.5], span: 7, keyDir: [-0.45, 1.0, -0.15] },
  build: (w) => {
    makeRuler(w);
    const sUS = makeOrangeStack(w, { lane: RULER.LANE.us });
    const fUS = makeFlagToken(w, { kind: "us" });
    const fCN = makeFlagToken(w, { kind: "cn" });
    const g8 = makeGhostRing(w, { lane: RULER.LANE.cn });
    const br = makeGapBracket(w, { plateX: 0.1, stem: 0.68, plateW: 1.0 });
    return (f, cam) => {
      sUS.update({ month: 0, cards: 5 });
      fUS.update({ month: 0, y: sUS.topY(), yaw: yawTo(cam, [RULER.LANE.us, 1, 0]) - 18, wave: f + 20 });
      fCN.update({ month: 12, y: RULER.TOP, yaw: yawTo(cam, [RULER.LANE.cn, 1, monthZ(12)]) - 18, wave: f });
      g8.update({ month: 8, show: 1 });
      br.update({ from: 0, to: 12, dashed: false, label: "12 MONTHS?", plateYaw: yawTo(cam, [0, 0.5, monthZ(6)]) });
    };
  },
};
const S6_CAM: CamDef = { pos: [-5.6, 5.0, 9.4], target: [0.15, 0.0, -0.4], fov: 30 };
const S6_SPEC: WorldSpec = {
  fog: { near: 9, far: 32 },
  light: { center: [0, 0.8, -0.3], span: 4, keyDir: [-0.45, 1.0, -0.15] },
  build: (w) => {
    makeRuler(w);
    const sUS = makeOrangeStack(w, { lane: RULER.LANE.us });
    const fUS = makeFlagToken(w, { kind: "us", flyLeft: true });
    const fCN = makeFlagToken(w, { kind: "cn" });
    const br = makeGapBracket(w, { y: 1.0, drop: 0.14, r: 0.026, plateX: 0, plateY: RULER.TOP - 1.0, plateAt: 0.85, stem: 0.06, plateW: 0.9 });
    return (f, cam) => {
      sUS.update({ month: 0, cards: 5 });
      fUS.update({ month: 0, y: sUS.topY(), yaw: yawTo(cam, [RULER.LANE.us, 1, 0]) + 18, wave: f + 20 });
      fCN.update({ month: 0.2, y: RULER.TOP, yaw: yawTo(cam, [RULER.LANE.cn, 1, -0.1]) - 18, wave: f });
      br.update({ from: 0, to: 0.2, label: "12 HOURS", plateYaw: yawTo(cam, [0, RULER.TOP, 0.85]) });
    };
  },
};
const S7_CAM: CamDef = { pos: [-8.2, 7.4, 12.6], target: [0.75, -1.0, -1.6], fov: 24 };
const S7_SPEC: WorldSpec = {
  fog: { near: 16, far: 44 },
  light: { center: [0, 0.6, -1.5], span: 7, keyDir: [-0.45, 1.0, -0.15] },
  build: (w) => {
    makeRuler(w);
    const sUS = makeOrangeStack(w, { lane: RULER.LANE.us });
    const sCN = makeOrangeStack(w, { lane: RULER.LANE.cn });
    const fUS = makeFlagToken(w, { kind: "us", flyLeft: true });
    const fCN = makeFlagToken(w, { kind: "cn" });
    const box = makeDashedCase(w, { center: [RULER.LANE.us, 0.95, 0], size: [1.3, 1.6, 1.1] });
    const br = makeGapBracket(w, {});
    const g8 = makeGhostRing(w, { lane: RULER.LANE.cn });
    const flow = makeCardStream(w, {
      path: [
        [RULER.LANE.us + 0.12, 0.85, 0.2],
        [-0.2, 1.35, 0.25],
        [0.2, 1.35, 0.25],
        [RULER.LANE.cn - 0.12, 0.85, 0.2],
      ],
      n: 5,
      size: [0.3, 0.035, 0.22],
      flat: true,
      shadows: false,
    });
    return (f, cam) => {
      sUS.update({ month: 0, cards: 7, open: 1 });
      sCN.update({ month: 0, cards: 7 });
      fUS.update({ month: 0, y: sUS.topY(), yaw: yawTo(cam, [RULER.LANE.us, 1, 0]) + 18, wave: f + 20 });
      fCN.update({ month: 0, y: sCN.topY(), yaw: yawTo(cam, [RULER.LANE.cn, 1, 0]) - 18, wave: f });
      box.update({ draw: 1 });
      br.update({ from: 0, to: 8, dashed: true, label: "" });
      g8.update({ month: 8, show: 1 });
      flow.update({ ts: (i) => 0.1 + i * 0.2, tumble: 6 });
    };
  },
};

// ---- motion probe: S3's insert, frame-driven (camera track + living drift) ---------------------------------------
const M_START: Orbit = { target: [0.4, 2.1, 0.3], dist: 9.5, yaw: 14, pitch: 6, fov: 30 };
const M_TRACK = camTrack(M_START, [{ from: 6, to: 44, key: { target: [0.55, 1.45, 0.3], dist: 11.5, yaw: 16 } }]);
const M_SPEC: WorldSpec = {
  fog: { near: 8, far: 32 },
  light: { center: [0.5, 2, 0], span: 6 },
  build: (w) => {
    const T = makeMonorepo(w);
    makeContributors(w, T, { n: 14, seed: 5 });
    const Hk = makeHacktronPanel(w, T, { gapAt: 6 });
    return (f) => {
      T.update({ gapAt: 6, gapOpen: ease01(4, 20, f) });
      Hk.update({ insert: ease01(14, 38, f), glint: Math.sin(Math.PI * Math.min(1, Math.max(0, (f - 36) / 10))) });
    };
  },
};

const PaulWorldProbe: React.FC<z.infer<typeof schema> & { frameOverride?: number }> = ({ probe, frameOverride }) => {
  const cur = useCurrentFrame();
  const f = frameOverride ?? cur;
  switch (probe) {
    case 0:
      return <FolkSheet f={f} />;
    case 1:
      return <PaulStage key={1} spec={S1_SPEC} cam={S1_CAM} frame={f} overlay={(P) => <Outsider P={P} at={S1_OUT} heightM={1.45} pose={outsiderCarry(f, "tote", { yaw: -24, hood: "up" })} uid="s1o" toteCards={3} />} />;
    case 2:
      return <PaulStage key={2} spec={S2_SPEC} cam={S2_CAM} frame={f} overlay={(P) => <Outsider P={P} at={S2_OUT} heightM={1.45} pose={outsiderReach(0.85, { yaw: -40, carry: "laptop" })} uid="s2o" />} />;
    case 3:
      return <PaulStage key={3} spec={S3_SPEC} cam={S3_CAM} frame={f} />;
    case 4:
      return <PaulStage key={4} spec={S4_SPEC} cam={S4_CAM} frame={f} overlay={(P) => <Outsider P={P} at={S4_OUT} heightM={1.45} pose={outsiderCarry(f, "laptop", { yaw: 20 })} uid="s4o" />} />;
    case 5:
      return <PaulStage key={5} spec={S5_SPEC} cam={S5_CAM} frame={f} />;
    case 6:
      return <PaulStage key={6} spec={S6_SPEC} cam={S6_CAM} frame={f} />;
    case 7:
      return <PaulStage key={7} spec={S7_SPEC} cam={S7_CAM} frame={f} />;
    default:
      return <PaulStage key={8} spec={M_SPEC} cam={orbitCam(living(M_TRACK(f), f))} frame={f} />;
  }
};
export default PaulWorldProbe;

// ===================================================================================================================
// REV 1 PROBES: the 3D clay outsider, the bank vaults, the black Slack mark, scale beside the sets
// ===================================================================================================================
// ---- the outsider: turnaround, head close-up and a pose sheet (one shot per frame) --------------------------------
type Shot = { pose: OutsiderPose3D; cam: Orbit; at?: V3 };
const TURN_CAM: Orbit = { target: [0, 0.74, 0], dist: 4.6, yaw: 0, pitch: 5, fov: 24 };
const TURN_SHOTS: Shot[] = [
  { pose: outsiderStand3D({ yaw: 0, frame: 30 }), cam: TURN_CAM },
  { pose: outsiderStand3D({ yaw: 42, frame: 30 }), cam: TURN_CAM },
  { pose: outsiderStand3D({ yaw: 90, frame: 30 }), cam: TURN_CAM },
  { pose: outsiderStand3D({ yaw: 180, frame: 30 }), cam: TURN_CAM },
  // S2's opening: tight on the head, the hood and the hand with the key (he faces a door off to screen left)
  { pose: outsiderReach3D(1, { yaw: -60, keyTurn: 0.5, headYaw: -12, headPitch: 6, frame: 30 }), at: [1.641, 0, 0.948], cam: { target: [1.17, 1.16, 1.2], dist: 2.4, yaw: -20, pitch: 3, fov: 30 } },
  // the pose sheet
  { pose: outsiderWalk3D(0, { yaw: 30 }), cam: TURN_CAM },
  { pose: outsiderWalk3D(6, { yaw: 30 }), cam: TURN_CAM },
  { pose: outsiderStand3D({ yaw: 18, whoa: 1, frame: 30 }), cam: TURN_CAM },
  { pose: outsiderCarry3D(30, "laptop", { yaw: 20 }), cam: TURN_CAM },
  { pose: outsiderCarry3D(30, "laptop", { yaw: 20, typing: 1 }), cam: TURN_CAM },
  { pose: outsiderCarry3D(30, "tote", { yaw: -30, toteCards: 3 }), cam: TURN_CAM },
  { pose: outsiderStand3D({ yaw: 15, fumble: 1, frame: 11 }), cam: TURN_CAM },
  { pose: outsiderReach3D(1, { yaw: 0, keyTurn: 1, frame: 30 }), cam: TURN_CAM },
  // 13: S2's opening camera exactly as the cut has it (framed for the rev-1 toy's head)
  { pose: outsiderReach3D(1, { yaw: -60, keyTurn: 0.5, headYaw: -12, headPitch: 6, frame: 30 }), at: [1.641, 0, 0.948], cam: { target: [1.27, 0.8, 1.02], dist: 3.3, yaw: -20, pitch: 3, fov: 30 } },
];
const TURN_SPEC: WorldSpec = {
  fog: { near: 6, far: 30 },
  light: { center: [0, 0.8, 0], span: 2.6 },
  build: (w) => {
    const O = makeOutsider3D(w);
    return (f) => {
      const s = TURN_SHOTS[Math.max(0, Math.min(TURN_SHOTS.length - 1, Math.round(f)))];
      O.update(s.pose, s.at ?? [0, 0, 0]);
    };
  },
};
export const OUTSIDER_SHOTS = TURN_SHOTS.length;
export const PaulOutsiderShots: React.FC = () => {
  const f = useCurrentFrame();
  const s = TURN_SHOTS[Math.min(TURN_SHOTS.length - 1, f)];
  return <PaulStage spec={TURN_SPEC} cam={orbitCam(s.cam)} frame={f} air={{ foreground: 0, lowAir: 0.5 }} />;
};

// ---- the outsider in motion: walk in, ease to a stop, turn, reach + key turn, whoa, fumble; a second figure hugs a
// laptop, stops and opens it to type; a third crosses behind with a tote ------------------------------------------
const LOOP_N = 150;
const WA = walkPlan({ from: [-1.3, 0, 0.6], to: [-0.3, 0, 0.6], f0: 0, f1: 44, rampIn: 0, rampOut: 18 });
const WB = walkPlan({ from: [2.2, 0, -2.7], to: [0.2, 0, -2.6], f0: 6, f1: 58, rampIn: 0, rampOut: 16 });
const WC = walkPlan({ from: [2.6, 0, 2.0], to: [1.1, 0, 2.0], f0: 14, f1: 92, rampIn: 0, rampOut: 18 });
const poseA = (f: number): OutsiderPose3D => {
  const w = WA(f);
  const turn = ease01(40, 60, f);
  const reach = ease01(56, 68, f) * (1 - ease01(84, 96, f));
  const whoa = ease01(90, 102, f) * (1 - ease01(112, 124, f));
  const fum = Math.sin(Math.PI * clamp01((f - 114) / 22));
  return {
    yaw: mix(w.yaw, -30, turn) + 40 * ease01(124, 146, f),
    walk: w.walk + 0.26 * Math.max(0, f - 44),
    walkAmt: w.walkAmt,
    shuffle: Math.sin(Math.PI * clamp01((f - 40) / 20)) * 0.9,
    reach,
    keyTurn: ease01(64, 76, f) * (1 - ease01(86, 96, f)),
    whoa,
    fumble: fum,
    headYaw: -10 * reach + 8 * ease01(126, 146, f),
    headPitch: 2 - 6 * ease01(126, 146, f),
    frame: f,
  };
};
const poseB = (f: number): OutsiderPose3D => {
  const w = WB(f);
  const turn = ease01(56, 76, f);
  return { carry: "laptop", yaw: mix(w.yaw, -28, turn), walk: w.walk + 0.26 * Math.max(0, f - 58), walkAmt: w.walkAmt, shuffle: Math.sin(Math.PI * clamp01((f - 56) / 20)) * 0.8, typing: ease01(80, 104, f), headPitch: 2 + 14 * ease01(84, 104, f), frame: f + 40 };
};
const LOOP_SPEC: WorldSpec = {
  fog: { near: 9, far: 34 },
  light: { center: [0, 0.8, 0], span: 4.5 },
  build: (w) => {
    const A = makeOutsider3D(w);
    const B = makeOutsider3D(w);
    const Cc = makeOutsider3D(w);
    return (f) => {
      A.update(poseA(f), WA(f).at);
      B.update(poseB(f), WB(f).at);
      const c = WC(f);
      const ct = ease01(88, 108, f);
      Cc.update({ carry: "tote", toteCards: 3, yaw: mix(c.yaw, -18, ct), walk: c.walk + 0.26 * Math.max(0, f - 92), walkAmt: c.walkAmt, shuffle: 0.8 * Math.sin(Math.PI * clamp01((f - 88) / 20)), frame: f + 80 }, c.at);
    };
  },
};
const LOOP_CAM: Orbit = { target: [0.2, 0.7, -0.2], dist: 10, yaw: 6, pitch: 7, fov: 31 };
export const PaulOutsiderLoop: React.FC = () => {
  const f = useCurrentFrame();
  return <PaulStage spec={LOOP_SPEC} cam={orbitCam(living(LOOP_CAM, f))} frame={f} />;
};
export const OUTSIDER_LOOP_N = LOOP_N;

// ---- the vaults: closed, unlocking, open (S1 wide); close on the OpenAI door; the open motion -------------------
type VaultState = { wheel: number; bolts: number; open: number };
const V_STATES: VaultState[] = [
  { wheel: 0, bolts: 0, open: 0 },
  { wheel: 2.4, bolts: 0.55, open: 0 },
  { wheel: 4.2, bolts: 1, open: 1 },
  { wheel: 0, bolts: 0, open: 0 },
  { wheel: 4.2, bolts: 1, open: 1 },
];
const V_WIDE = orbitCam({ target: [0.3, -0.35, 1.0], dist: 17, yaw: 3, pitch: 12, fov: 26 });
const V_CLOSE = orbitCam({ target: [VAULT.X_OPENAI + 0.05, 1.0, 0.7], dist: 6.2, yaw: 16, pitch: 7, fov: 28 });
const VAULT_SPEC: WorldSpec = {
  fog: { near: 10, far: 36 },
  light: { center: [0, 1, 1], span: 6 },
  build: (w) => {
    const A = makeVault(w, { x: VAULT.X_OPENAI, brand: "openai" });
    const B = makeVault(w, { x: VAULT.X_ANTHROPIC, brand: "anthropic" });
    const O = makeOutsider3D(w);
    return (f) => {
      const s = V_STATES[Math.max(0, Math.min(V_STATES.length - 1, Math.round(f)))];
      A.update({ ...s, cardsLeft: 10, ghost: 0 });
      B.update({ ...s, cardsLeft: 10, ghost: 0 });
      O.update(outsiderStand3D({ yaw: -24, frame: 30 }), [1.75, 0, 2.5], 1.42);
    };
  },
};
export const PaulVaultStates: React.FC = () => {
  const f = useCurrentFrame();
  return <PaulStage spec={VAULT_SPEC} cam={f >= 3 ? V_CLOSE : V_WIDE} frame={f} />;
};
// the open motion (60 f): the wheel spins a turn and a half, the bolts slide in, the door swings out on the stack
const VO_N = 60;
const VO_SPEC: WorldSpec = {
  fog: { near: 10, far: 36 },
  light: { center: [0, 1, 1], span: 6 },
  build: (w) => {
    const A = makeVault(w, { x: VAULT.X_OPENAI, brand: "openai" });
    makeVault(w, { x: VAULT.X_ANTHROPIC, brand: "anthropic" });
    return (f) => {
      A.update({ wheel: 1.5 * 2 * Math.PI * ease01(2, 28, f), bolts: ease01(20, 32, f), open: ease01(30, 54, f), cardsLeft: 10 });
    };
  },
};
const VO_TRACK = camTrack({ target: [VAULT.X_OPENAI + 0.05, 1.0, 0.7], dist: 5.4, yaw: 12, pitch: 6, fov: 28 }, [{ from: 0, to: 70, key: { dist: 6.6, yaw: 20, pitch: 8, target: [VAULT.X_OPENAI + 0.15, 0.95, 0.8] } }]);
export const PaulVaultOpen: React.FC = () => {
  const f = useCurrentFrame();
  return <PaulStage spec={VO_SPEC} cam={orbitCam(living(VO_TRACK(f), f))} frame={f} />;
};
export const VAULT_OPEN_N = VO_N;

// ---- S4 with the black Slack mark (wide, and close on the cap) --------------------------------------------------
const S4B_SPEC: WorldSpec = {
  fog: { near: 10, far: 36 },
  light: { center: [0, 1.5, 0.5], span: 7 },
  build: (w) => {
    const D = makeDial(w, { pos: [-1.3, 1.28, 0.7], yaw: 16 });
    const Sl = makeSlackStack(w, { x: 0.95, mark: "black" });
    const O = makeOutsider3D(w);
    return (f) => {
      D.update({ sweep: 0.82 });
      Sl.update({ open: [0, 1, 0.3, 1, 0, 0.8, 0] });
      O.update(outsiderCarry3D(f + 30, "laptop", { yaw: 20, typing: 0 }), S4_OUT);
    };
  },
};
export const PaulSlackBlack: React.FC = () => {
  const f = useCurrentFrame();
  const cam = f === 0 ? S4_CAM : orbitCam({ target: [0.95, 2.95, 0.7], dist: 6.5, yaw: 4, pitch: 4, fov: 28 });
  return <PaulStage spec={S4B_SPEC} cam={cam} frame={f} />;
};

// ---- scale (rev 2): the mannequin at S1's end framing beside the open vaults (frame 0), at S2's end framing at the
// tower foot among light contributors (frame 1), and close at the tower foot beside a light contributor (frame 2) ----
const S1_END = orbitCam({ target: [-0.03, -0.02, 1.1], dist: 33.55, yaw: 1, pitch: 18, fov: 16 });
const SCALE_S1_SPEC: WorldSpec = {
  // LeakedSecrets moves the haze back with its camera: fog + (camD - 19.7)
  fog: { near: 12 + 13.85, far: 40 + 13.85 },
  light: { center: [0, 1, 1.1], span: 7 },
  build: (w) => {
    const VO = makeVault(w, { x: -1.25, brand: "openai" });
    const VA = makeVault(w, { x: 1.25, brand: "anthropic" });
    const O = makeOutsider3D(w);
    return () => {
      VO.update({ open: 1, bolts: 1, wheel: 4.2, cardsLeft: 2, ghost: 1 });
      VA.update({ open: 1, bolts: 1, wheel: 4.2, cardsLeft: 2, ghost: 1 });
      O.update(outsiderStand3D({ yaw: yawTo(S1_END, [0, 0, 0.95]) - 6, whoa: 0.85, frame: 30 }), [0, 0, 0.95]);
    };
  },
};
const S2_END = orbitCam({ target: [0.25, 0.3, 0.25], dist: 20.5, yaw: 13, pitch: 8, fov: 30 });
const S2_CLOSE = orbitCam({ target: [1.95, 0.78, 0.9], dist: 5.4, yaw: -8, pitch: 4, fov: 26 });
const S2_OUT_AT: V3 = [1.641, 0, 0.948];
/** S2's contributors (TheMonorepo FEEDERS: at, height) plus one beside him for the close frame */
const STAFF: [number, number, number][] = [
  [-2.03, 1.3, 1.0],
  [-1.7, -0.3, 1.0],
  [-2.94, -2.6, 1.0],
  [1.63, -2.7, 1.0],
  [2.33, -0.7, 1.0],
  [2.9, 1.0, 1.0],
];
const SCALE_S2_SPEC: WorldSpec = {
  fog: { near: 12, far: 40 },
  light: { center: [0.3, 1.6, 0.3], span: 6 },
  build: (w) => {
    const T = makeMonorepo(w);
    const O = makeOutsider3D(w);
    const staff = STAFF.map(([x, z, h]) => {
      const fig = makeOutsider3D(w, { tone: "light" });
      const at: V3 = [x, 0, z];
      const toTower = Math.atan2(-x, -z) / D2R;
      const toCam = yawTo(S2_END, at);
      const yaw = toTower + 0.45 * (((toCam - toTower + 540) % 360) - 180);
      return { fig, at, h, yaw };
    });
    // the close frame's light contributor, beside him at full height
    const near = makeOutsider3D(w, { tone: "light" });
    // frame 3: the rev-1 toy still builds (look "toy") in his place
    const toy = makeOutsider3D(w, { look: "toy" });
    return (f) => {
      T.update({});
      O.group.visible = f !== 3;
      toy.group.visible = f === 3;
      O.update(outsiderReach3D(0.12, { yaw: -60, frame: 40 }), S2_OUT_AT);
      toy.update(outsiderReach3D(0.12, { yaw: -60, frame: 40 }), S2_OUT_AT);
      staff.forEach((s, i) => {
        s.fig.group.visible = f === 1;
        s.fig.update(outsiderCarry3D(30 + 17 * i, "laptop", { yaw: s.yaw, typing: 1, headPitch: 14 }), s.at, s.h);
      });
      near.group.visible = f >= 2;
      near.update(outsiderCarry3D(30, "laptop", { yaw: -30, typing: 1, headPitch: 14 }), [2.45, 0, 1.05]);
    };
  },
};
export const PaulOutsiderScale: React.FC = () => {
  const f = useCurrentFrame();
  if (f === 0) return <PaulStage key={0} spec={SCALE_S1_SPEC} cam={S1_END} frame={f} air={{ motes: 0.035 }} />;
  return <PaulStage key={1} spec={SCALE_S2_SPEC} cam={f === 1 ? S2_END : S2_CLOSE} frame={f} />;
};
export const OUTSIDER_SCALE_N = 4;
