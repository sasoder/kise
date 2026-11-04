// ---------------------------------------------------------------------------
// ranchProbe: probe stills of the robert-johnson-ranch world and cast (src/Root.RanchProbe.tsx).
//   RanchCastSheet   the cast style sheet: both women next to the pandemics Worker in one row (stand, mid-stride, back
//                    view, seated), a second row of the turn and the climb, a walk strip (1080x1920)
//   RanchWalkProbe   a moving walk + stop + turn (every-frame sheets of the hem, feet and shawl)
//   RanchRockProbe   the farm woman rocking (every-frame sheet of the rocker)
//   RanchWorldProbe  stills of both houses, the ridge stack, both women standing on the ground (props.view)
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AirHorizonHazeW, AirStage, PandemicFolk, WorldSvg, airWorldOf, swayCam, type AirWorld, type Cam, type DepthOpts } from "../kits/dwarkesh-3d/dwarkesh3d";
import { FIG_W, FarmWoman, FolkShadowW, Rebekah, RockingChair, elevOf, farmWomanPose, makeWalk, rebekahStand, type RebekahPose } from "./ranchFolk";
import {
  CedarClump,
  DOGRUN,
  DirtRoad,
  DogRunHouse,
  FARM,
  FarmHouse,
  FenceLine,
  HillGround,
  LiveOak,
  RidgeStack,
  Windmill,
  cam3,
  dogRunRanges,
  farmRanges,
  ranchAirOf,
  ridgeSeries,
  rollingTerrain,
  type Item,
  type Terrain,
  type Tufts,
} from "./ranchWorld";

const PROBE_DEPTH: DepthOpts = { eyeY: -356, dRef: 1800, kRef: 1, dolly: 0 };
const PROBE_CAM: Cam = { k: 1, cx: 0, cy: -150 };

/** a straight walk along +X for the sheets */
const SHEET_WALK = makeWalk({ path: [[0, 0], [4000, 0]], sAt: (f) => Math.max(0, f) * 5.6, steps: 40, ground: () => 0 });
export const sheetStride = (frame: number): RebekahPose => SHEET_WALK.walk(frame).pose;

const Label: React.FC<{ x: number; y: number; t: string }> = ({ x, y, t }) => (
  <text x={x} y={y} fill="#F3EBDD" fontFamily="Helvetica, Arial" fontSize={20} textAnchor="middle" opacity={0.8}>
    {t}
  </text>
);
const Floor: React.FC<{ y: number }> = ({ y }) => <rect x={0} y={y} width={1080} height={4} fill="#22180F" opacity={0.15} />;

export const RanchCastSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const A = airWorldOf({ cam: PROBE_CAM, rest: PROBE_CAM, depth: PROBE_DEPTH, frame });
  const sc = 0.5;
  const row1 = 760;
  const row2 = 1320;
  const row3 = 1840;
  const xs = [110, 320, 540, 760, 965];
  const stand = rebekahStand(frame, 30);
  const stride = sheetStride(22);
  const back = rebekahStand(frame, 180);
  const sheet = (pose: RebekahPose, x: number, y: number, s: number, uid: string) => <Rebekah pose={pose} at={[x, y]} scale={s} uid={uid} />;
  return (
    <AirStage v={A.v} shafts={0.4} motes={0} bloom={0.15}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <Floor y={row1} />
          <Floor y={row2} />
          <Floor y={row3} />
          <PandemicFolk.FolkWorker pose={PandemicFolk.breathe(PandemicFolk.stand(0), frame)} x={xs[0]} y={row1} scale={sc} uid="wk" />
          {sheet(stand, xs[1], row1, sc, "r1")}
          {sheet(stride, xs[2], row1, sc, "r2")}
          {sheet(back, xs[3], row1, sc, "r3")}
          <FarmWoman pose={farmWomanPose(frame, { yaw: 35 })} at={[xs[4], row1]} scale={sc} uid="fw1" />
          <Label x={xs[0]} y={row1 + 40} t="Worker (pandemics)" />
          <Label x={xs[1]} y={row1 + 40} t="Rebekah, stand" />
          <Label x={xs[2]} y={row1 + 40} t="mid-stride" />
          <Label x={xs[3]} y={row1 + 40} t="back" />
          <Label x={xs[4]} y={row1 + 40} t="farm woman, seated" />
          {sheet(rebekahStand(frame, 0), xs[0], row2, sc, "q0")}
          {sheet(rebekahStand(frame, 150, { headYaw: -12 }), xs[1], row2, sc, "q1")}
          {sheet({ ...sheetStride(16), lean: 9 }, xs[2], row2, sc, "q2")}
          {sheet(rebekahStand(frame, -60), xs[3], row2, sc, "q3")}
          <FarmWoman pose={farmWomanPose(frame, { yaw: -35, headYaw: 25 })} at={[xs[4], row2]} scale={sc} uid="fw2" />
          <Label x={xs[0]} y={row2 + 40} t="front" />
          <Label x={xs[1]} y={row2 + 40} t="three-quarter back" />
          <Label x={xs[2]} y={row2 + 40} t="climb" />
          <Label x={xs[3]} y={row2 + 40} t="facing left" />
          <Label x={xs[4]} y={row2 + 40} t="head turn" />
          {[0, 4, 8, 12, 16, 20].map((f, i) => sheet(sheetStride(f + 10), 110 + i * 172, row3, 0.42, `w${i}`))}
          <RockingChair at={[1020, row3]} scale={0.3} uid="rc" yaw={60} />
        </svg>
      </AbsoluteFill>
    </AirStage>
  );
};

/** a walking strip in motion: the hem, the feet, the shawl (every frame) */
export const RanchWalkProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const A = airWorldOf({ cam: PROBE_CAM, rest: PROBE_CAM, depth: PROBE_DEPTH, frame });
  const W = SHEET_WALK.walk(frame);
  const cam = swayCam(PROBE_CAM, 0);
  void cam;
  return (
    <AirStage v={A.v} shafts={0.4} motes={0}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <Floor y={1300} />
          <Rebekah pose={W.pose} at={[540, 1300]} scale={1.3} uid="wp" />
        </svg>
      </AbsoluteFill>
    </AirStage>
  );
};

export const RanchRockProbe: React.FC = () => {
  const frame = useCurrentFrame();
  const A = airWorldOf({ cam: PROBE_CAM, rest: PROBE_CAM, depth: PROBE_DEPTH, frame });
  return (
    <AirStage v={A.v} shafts={0.4} motes={0}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <Floor y={1300} />
          <FarmWoman pose={farmWomanPose(frame, { yaw: 35 })} at={[540, 1300]} scale={1.4} uid="rp" />
        </svg>
      </AbsoluteFill>
    </AirStage>
  );
};

// ===================================================================================================================
// THE WORLD PROBE: props.view = "dogrun" | "farm" | "ridges" | "women"
// ===================================================================================================================
const PROBE_TERRAIN = (flatX: number, flatZ: number) => rollingTerrain({ seed: 2, amp: 220, wave: 1700, flats: [{ X: flatX, Z: flatZ, R: 1200, H: 0 }] });
const standAt = (A: AirWorld, X: number, Z: number, H: number, pose: RebekahPose, uid: string) => (
  <g>
    <FolkShadowW A={A} X={X} Z={Z} Y={-H} uid={`${uid}s`} />
    <Rebekah pose={pose} at={A.P.p(X, -H, Z)} scale={A.P.r(Z) * FIG_W} uid={uid} fog={A.folkFog(Z, H)} unitPx={A.k} />
  </g>
);
export const RanchWorldProbe: React.FC<{ view: "dogrun" | "farm" | "ridges" | "women" }> = ({ view }) => {
  const frame = useCurrentFrame();
  const C3 =
    view === "dogrun"
      ? { X: 250, Z: -1500, E: 260, C: 1000, yH: 860 }
      : view === "farm"
        ? { X: -400, Z: -2000, E: 320, C: 1000, yH: 860 }
        : view === "ridges"
          ? { X: 0, Z: -650, E: 970, C: 1000, yH: 350 }
          : { X: 0, Z: -900, E: 230, C: 1000, yH: 900 };
  const { cam, depth } = cam3(C3);
  const A = ranchAirOf({ cam, depth, rest: cam, frame });
  const T = view === "ridges" ? crestTerrain : PROBE_TERRAIN(0, view === "farm" ? 900 : 600);
  const ridges =
    view === "ridges"
      ? ridgeSeries({ n: 11, zNear: 1750, ratio: 1.55, hNear: 0, hFar: 0, seed: 4, tops: [-420, -720, -1020, -1290, -1480, -1550, -1460, -1230, -830, -380, 30] })
      : ridgeSeries({ n: 7, zNear: 3200, ratio: 1.6, hNear: 380, hFar: 1400, seed: 2 });
  const items: Item[] = [];
  if (view === "dogrun") {
    const g = dogRunRanges(0, 400);
    const pose = rebekahStand(frame, 35, { elev: elevOf(C3.E, 12, 520 - C3.Z) });
    items.push({ Z: 400, node: <DogRunHouse A={A} X0={0} Z0={400} inside={standAt(A, 260, 520, DOGRUN.floorH, pose, "rb")} /> });
    void g;
    items.push({ Z: 1700, node: <LiveOak A={A} X={-1700} Z={1700} H={T.H(-1700, 1700)} frame={frame} uid="oak1" seed={2} /> });
    items.push({ Z: 1300, node: <CedarClump A={A} X={1500} Z={1300} H={T.H(1500, 1300)} frame={frame} uid="ced1" seed={3} /> });
    items.push({ Z: 120, node: <FenceLine A={A} T={T} pts={[[-2400, 120], [-1200, 160]]} /> });
  } else if (view === "farm") {
    const g = farmRanges(0, 900);
    const Zc = g.porch[0] + 170;
    const pose = farmWomanPose(frame, { yaw: -30, elev: elevOf(C3.E, FARM.floorH, Zc - C3.Z, 90) });
    const porch = (
      <g>
        <FolkShadowW A={A} X={-450} Z={Zc} Y={-FARM.floorH} kind="seated" uid="fws" />
        <FarmWoman pose={pose} at={A.P.p(-450, -FARM.floorH, Zc)} scale={A.P.r(Zc) * FIG_W} uid="fw" fog={A.folkFog(Zc, FARM.floorH)} unitPx={A.k} />
      </g>
    );
    items.push({ Z: 900, node: <FarmHouse A={A} X0={0} Z0={900} porch={porch} /> });
    items.push({ Z: 1700, node: <Windmill A={A} X={1250} Z={1700} H={T.H(1250, 1700)} frame={frame} /> });
    items.push({ Z: 2300, node: <LiveOak A={A} X={-1500} Z={2300} H={T.H(-1500, 2300)} frame={frame} uid="oak2" seed={5} /> });
    items.push({ Z: -300, node: <DirtRoad A={A} T={T} path={[[-3000, -300], [-1000, -250], [600, -150], [3000, 100]]} uid="road" /> });
    items.push({ Z: 150, node: <FenceLine A={A} T={T} pts={[[-2600, 150], [-900, 200]]} /> });
  } else if (view === "ridges") {
    const H = T.H(0, 300);
    items.push({ Z: 300 - 80, node: standAt(A, 0, 300, H, rebekahStand(frame, 160, { elev: elevOf(C3.E, H, 950) }), "rk") });
  } else {
    items.push({ Z: 200 - 80, node: standAt(A, -260, 200, T.H(-260, 200), rebekahStand(frame, 30, { elev: elevOf(C3.E, 0, 1100) }), "w1") });
    const pose = farmWomanPose(frame, { yaw: -35, elev: elevOf(C3.E, 0, 1200, 90) });
    items.push({
      Z: 300 - 120,
      node: (
        <g>
          <FolkShadowW A={A} X={260} Z={300} Y={-T.H(260, 300)} kind="seated" uid="fws2" />
          <FarmWoman pose={pose} at={A.P.p(260, -T.H(260, 300), 300)} scale={A.P.r(300) * FIG_W} uid="fw2" fog={A.folkFog(300)} unitPx={A.k} />
        </g>
      ),
    });
  }
  const tufts: Tufts[] = [{ x0: -3000, x1: 3000, z0: -1400, z1: 4000, step: 90, seed: 1 }];
  return (
    <AirStage v={A.v} shafts={0.5} motes={0.4} bloom={0.15}>
      <WorldSvg cam={A.cam}>
        <AirHorizonHazeW A={A} id="hz" />
        <RidgeStack A={A} ridges={ridges} uid="rd" />
        <HillGround A={A} T={T} z0={-800} z1={view === "ridges" ? 1200 : 8000} items={items} tufts={tufts} frame={frame} uid="hg" />
      </WorldSvg>
    </AirStage>
  );
};
/** a crest to stand on, falling steeply away beyond Z ~ 400 (the cut-59 ending) */
const crestTerrain: Terrain = {
  H: (X, Z) => 220 - 0.0004 * X * X * 0.2 - (Z > 350 ? Math.pow((Z - 350) / 300, 2) * 260 : 0.00012 * (350 - Z) * (350 - Z)),
  crest: { at: (X) => ({ Z: 350, H: 220 - 0.00008 * X * X }), x0: -2000, x1: 2000 },
};

/** the farm woman seated at cut 26's size (~310 px): front, three-quarter right, three-quarter left */
export const RanchFarmWomanSheet: React.FC = () => {
  const frame = useCurrentFrame();
  const A = airWorldOf({ cam: PROBE_CAM, rest: PROBE_CAM, depth: PROBE_DEPTH, frame });
  const sc = 0.8;
  return (
    <AirStage v={A.v} shafts={0.4} motes={0} bloom={0.15}>
      <AbsoluteFill>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920">
          <Floor y={1000} />
          <FarmWoman pose={farmWomanPose(frame, { yaw: 0, elev: 6 })} at={[190, 1000]} scale={sc} uid="fa" />
          <FarmWoman pose={farmWomanPose(frame, { yaw: 35, elev: 6 })} at={[540, 1000]} scale={sc} uid="fb" />
          <FarmWoman pose={farmWomanPose(frame, { yaw: -35, elev: 6, headYaw: 20 })} at={[890, 1000]} scale={sc} uid="fc" />
          <Label x={190} y={1050} t="front" />
          <Label x={540} y={1050} t="three-quarter (yaw 35)" />
          <Label x={890} y={1050} t="yaw -35, head turn" />
          <Floor y={1780} />
          <FarmWoman pose={farmWomanPose(frame, { yaw: 60, elev: 10 })} at={[300, 1780]} scale={sc} uid="fd" />
          <FarmWoman pose={farmWomanPose(frame + 30, { yaw: 25, elev: 10 })} at={[760, 1780]} scale={sc} uid="fe" />
          <Label x={300} y={1830} t="yaw 60" />
          <Label x={760} y={1830} t="yaw 25, rocked" />
        </svg>
      </AbsoluteFill>
    </AirStage>
  );
};
