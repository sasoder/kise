// ---------------------------------------------------------------------------
// covidCarriageProbe — probe stills of the metro carriage set (covidCarriage.tsx) with the modern cast (covidFolk).
// Render entry src/entry.CovidCarriage.ts.
//   CarriageEmpty   the set alone at the default camera (props.bands: draw the caption bands)
//   CarriageCovid   cut 3's staging: seated passengers, the Carrier standing at a pole, infected 1, breathing out
//                   toward a seated neighbour (props.frame, props.bands)
//   CarriageSars    cut 12's staging: the Officer sick and slumped on the bench, his neighbours leaning away
//   CarriageMotion  CarriageCovid animated (the sway, the tunnel lights, the breath): for the frame-difference check
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { AirShadow, AirStage, WorldSvg, type AirWorld } from "../kits/dwarkesh-3d/dwarkesh3d";
import { CarriageStage, NEAR_POLES, carriageAir, carriageCam, carriageSway, polePlace, poleSeat, polesOf, seatNear, swayPose, type StageItem } from "./covidCarriage";
import { CovidFigure, POSES, covidAnchors, covidGripTo, lerpPose, sickenBack, type CovidFigureProps, type CovidKind, type CovidPose } from "./covidFolk";

type FigSpec = { kind: CovidKind; v: number; pose: CovidPose; X: number; Z: number; props?: Partial<CovidFigureProps>; uid: string };
const figItem = (A: AirWorld, f: FigSpec, frame: number, camK: number): StageItem => {
  const { at, scale } = A.P.at(f.X, f.Z);
  return {
    Z: f.Z,
    key: f.uid,
    node: (
      <g>
        <AirShadow A={A} X={f.X} Z={f.Z} w={58} d={34} uid={`${f.uid}sh`} amt={0.75} />
        <CovidFigure kind={f.kind} variant={f.v} pose={f.pose} at={at} scale={scale} uid={f.uid} fog={A.folkFog(f.Z)} unitPx={camK} frame={frame} {...f.props} />
      </g>
    ),
  };
};
const Bands: React.FC = () => (
  <svg width={1080} height={1920} style={{ position: "absolute", left: 0, top: 0 }}>
    <rect x={0} y={1080} width={1080} height={170} fill="#ff2a6d" opacity={0.18} />
    <rect x={0} y={1360} width={1080} height={100} fill="#ff2a6d" opacity={0.18} />
    <line x1={0} x2={1080} y1={960} y2={960} stroke="#ffffff" strokeOpacity={0.35} strokeDasharray="8 8" />
  </svg>
);

const Scene: React.FC<{ frame: number; bands?: boolean; k?: number; hideNear?: boolean; figs: (A: AirWorld, frame: number) => FigSpec[] }> = ({ frame, bands, k = 2.3, hideNear, figs }) => {
  const s = carriageSway(frame);
  const c0 = carriageCam(k);
  const cam = { ...c0, cy: c0.cy + s.bob / c0.k };
  const A = carriageAir(cam, frame, c0);
  const items = figs(A, frame).map((f) => figItem(A, f, frame, cam.k));
  return (
    <AbsoluteFill>
      <AirStage v={A.v} bloom={0.22} shafts={0}>
        <WorldSvg cam={cam}>
          <CarriageStage A={A} frame={frame} items={items} hidePoles={hideNear ? [NEAR_POLES.L, NEAR_POLES.R] : undefined} hideStraps={hideNear ? (st) => st.Z < 150 : undefined} />
        </WorldSvg>
      </AirStage>
      {bands ? <Bands /> : null}
    </AbsoluteFill>
  );
};

// ---------------------------------------------------------------------------
// cut 3: the Carrier at a pole, glowing, breathing out on a seated neighbour
// ---------------------------------------------------------------------------
const covidFigs = (A: AirWorld, frame: number): FigSpec[] => {
  const poleC = polesOf("C")[0];
  const car = polePlace(poleC, 1, "carrier", 0);
  const nb = seatNear("R", 320);
  const nbPose = swayPose({ ...POSES.sit(-1), headYaw: -0.75 }, frame, 0.5, 2);
  const nbAt = A.P.at(nb.X, nb.Z);
  const nbA = covidAnchors("commuter", nbPose, nbAt.at, nbAt.scale, { variant: 2 });
  const s = (side: "L" | "R", z: number) => seatNear(side, z);
  const L1 = s("L", 140);
  const L2 = s("L", 420);
  const L3 = s("L", 1150);
  const R2 = s("R", 870);
  const R3 = s("R", 1060);
  const poleL2 = polesOf("L")[3];
  const stand2 = polePlace(poleL2, -1, "commuter", 1);
  return [
    { kind: "carrier", v: 0, uid: "car", pose: swayPose({ ...POSES.standHold(1, "pole", "far"), headYaw: 0.85, pitch: 4, open: 0.3, look: [0.3, 0.2] }, frame), X: car.X, Z: car.Z, props: { infected: 1, breathOut: 1, breathTarget: nbA.mouth } },
    { kind: "commuter", v: 2, uid: "nb", pose: nbPose, X: nb.X, Z: nb.Z },
    { kind: "commuter", v: 0, uid: "l1", pose: swayPose({ ...POSES.sit(1), pitch: 12 }, frame, 0.5, 11), X: L1.X, Z: L1.Z },
    { kind: "elder", v: 1, uid: "l2", pose: swayPose(POSES.sit(1), frame, 0.5, 13), X: L2.X, Z: L2.Z },
    { kind: "parent", v: 0, uid: "l3", pose: swayPose(POSES.sit(1), frame, 0.5, 9), X: L3.X, Z: L3.Z },
    { kind: "youth", v: 0, uid: "r2", pose: swayPose({ ...POSES.sit(-1), pitch: 14, headYaw: -0.7 }, frame, 0.5, 7), X: R2.X, Z: R2.Z },
    { kind: "commuter", v: 3, uid: "r3", pose: swayPose(POSES.sit(-1), frame, 0.5, 17), X: R3.X, Z: R3.Z },
    { kind: "commuter", v: 1, uid: "st2", pose: swayPose(POSES.standHold(-1, "pole"), frame, 1, 19), X: stand2.X, Z: stand2.Z },
  ];
};
export const CarriageCovid: React.FC<{ frame?: number; bands?: boolean; k?: number; hideNear?: boolean }> = ({ frame = 60, bands = false, k = 2.3, hideNear = false }) => <Scene frame={frame} bands={bands} k={k} hideNear={hideNear} figs={covidFigs} />;
export const CarriageMotion: React.FC = () => {
  const f = useCurrentFrame();
  return <Scene frame={f} figs={covidFigs} />;
};

// ---------------------------------------------------------------------------
// cut 12: the Officer sick and slumped, his neighbours leaning away
// ---------------------------------------------------------------------------
const sarsFigs = (A: AirWorld, frame: number): FigSpec[] => {
  void A;
  const off = seatNear("L", 228);
  const nFar = seatNear("L", 412);
  const s = (side: "L" | "R", z: number) => seatNear(side, z);
  const R1 = s("R", 228);
  const R2 = s("R", 900);
  const L3 = s("L", 1060);
  const poleC = polesOf("C")[0];
  const st = polePlace(poleC, -1, "youth", 0);
  return [
    { kind: "officer", v: 0, uid: "off", pose: POSES.slump(1, frame), X: off.X, Z: off.Z, props: { sick: 1, infected: 1 } },
    { kind: "elder", v: 2, uid: "nf", pose: swayPose(POSES.leanAway(POSES.sit(1), 1, 1), frame, 0.4, 5), X: nFar.X, Z: nFar.Z },
    { kind: "commuter", v: 3, uid: "r1", pose: swayPose(POSES.leanAway({ ...POSES.sit(-1), worry: 0.5 }, 1, 1), frame, 0.4, 7), X: R1.X, Z: R1.Z },
    { kind: "elder", v: 1, uid: "r2", pose: swayPose(POSES.sit(-1), frame, 0.4, 9), X: R2.X, Z: R2.Z },
    { kind: "parent", v: 1, uid: "l3", pose: swayPose(POSES.sit(1), frame, 0.4, 11), X: L3.X, Z: L3.Z },
    { kind: "youth", v: 0, uid: "st", pose: swayPose(POSES.leanAway(POSES.standHold(-1, "pole", "far"), 1, 1, "none"), frame, 1, 13), X: st.X, Z: st.Z },
  ];
};
export const CarriageSars: React.FC<{ frame?: number; bands?: boolean; k?: number }> = ({ frame = 60, bands = false, k = 2.3 }) => <Scene frame={frame} bands={bands} k={k} figs={sarsFigs} />;
export const CarriageEmpty: React.FC<{ bands?: boolean }> = ({ bands = false }) => <Scene frame={0} bands={bands} figs={() => []} />;

// ---------------------------------------------------------------------------
// the side-pole grammar of cut 12: hold the pole (grip), let go, sicken back onto the seat behind (props.frame 0..59)
// ---------------------------------------------------------------------------
const sickenFigs = (A: AirWorld, frame: number, ov = 0): FigSpec[] => {
  const ps = poleSeat(polesOf("L")[0], "officer", ov);
  const t = Math.min(1, frame / 59);
  const X = ps.feet.X - ps.dir * sickenBack(t, "officer", 0);
  const { at, scale } = A.P.at(X, ps.feet.Z);
  const free = POSES.sicken(ps.dir, t);
  const g = A.P.p(ps.grip[0], ps.grip[1], ps.grip[2]);
  const held = covidGripTo("officer", ov, free, ps.dir > 0 ? { L: g } : { R: g }, at, scale);
  const release = Math.min(1, Math.max(0, (t - 0.1) / 0.2));
  const pose = lerpPose(held, free, release * release * (3 - 2 * release));
  const R1 = seatNear("R", 228);
  return [
    { kind: "officer", v: ov, uid: "off", pose, X, Z: ps.feet.Z, props: { infected: 1, sick: Math.min(1, t * 1.6) } },
    { kind: "commuter", v: 3, uid: "r1", pose: swayPose(POSES.leanAway(POSES.sit(-1), Math.max(0, (t - 0.4) / 0.6), 1), frame, 0.4, 7), X: R1.X, Z: R1.Z },
  ];
};
export const CarriageSicken: React.FC<{ frame?: number; k?: number; variant?: number }> = ({ frame = 0, k = 3.0, variant = 0 }) => <Scene frame={frame} bands k={k} figs={(A, f) => sickenFigs(A, f, variant)} />;
