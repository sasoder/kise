// ===================================================================================================================
// paulWorldProbe — probe stills of the shared world (paulWorld / paulWorldSets / paulFolk) at typical cut framings,
// and the outsider's style sheet beside the pandemics Worker. probe 0 = folk sheet, 1..7 = the sets of S1..S7,
// 8 = a motion probe (frame-driven: frames 0..47 of the HACKTRON insert, for checking the per-frame update).
// ===================================================================================================================
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { OutsiderOnScreen, Outsider, WorkerOnScreen, outsiderCarry, outsiderReach, outsiderStand, outsiderWalk } from "./paulFolk";
import { PaulStage, camTrack, ease01, living, orbitCam, type CamDef, type Orbit, type WorldSpec } from "./paulWorld";
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
