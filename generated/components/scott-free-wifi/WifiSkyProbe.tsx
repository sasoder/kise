// ---------------------------------------------------------------------------
// WifiSkyProbe (scott-free-wifi world builder's probe stills; not a cut). One still per frame, 1080x1920, 23.976 fps.
// RENDER WITH --gl=angle.
//   f0  a_wide        the cruise sky wide: a United 787-9 (radome, linked), a British Airways 777 and a Delta A330
//                     cruising over the deck, the satellite train overhead, one link
//   f1  b_radome      close on the radome (connected glow) on United's crown, the link arriving from above
//   f2  c_contrail    a jet with its contrails drawn out behind it over the deck
//   f3  d_train_up    cut 1's opening look: tilted up into the dusk at the passing train
//   f4  e_link_close  cut 1's end look: the 787 linked to a satellite in the upper frame
//   f5  f_sat_close   a close of one satellite (its wings, cells, earth-face tiles)
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Jet, type SideCam, type V3 } from "../scott-aircraft-order/aircraftShared";
import {
  CAM_CRUISE_WIDE,
  CAM_LINK_CLOSE,
  CAM_TRAIN_UP,
  CRUISE,
  CRUISE_JET,
  Contrail,
  CruiseStage,
  Radome,
  SAT,
  SatTrain,
  StarlinkLink,
  StarlinkSat,
  TRAIN_CUT1,
  radomePoint,
  satLinkPoint,
  trainSat,
  type TrainSpec,
} from "./wifiSky";

export const FPS = 24000 / 1001;
export const DURATION = 6;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const J = CRUISE_JET;
const UnitedLinked: React.FC<{ from: V3; glow?: number; S: number; at?: [number, number] }> = ({ from, glow = 1, S, at = J.at }) => {
  const to = radomePoint(J.type, at, J.heading, J.alt, J.pitch);
  return (
    <>
      <Jet type={J.type} airline="united" at={at} heading={J.heading} alt={J.alt} pitch={J.pitch} shadow={0} />
      <Radome type={J.type} at={at} heading={J.heading} alt={J.alt} pitch={J.pitch} glow={glow} />
      <StarlinkLink from={from} to={to} progress={1} S={S} />
    </>
  );
};

const WIDE_TRAIN: TrainSpec = { origin: [380, SAT.y + 60, 1150], dir: [-0.8, 0, 0.6], speed: SAT.speed, spacing: SAT.spacing, count: 10, scale: SAT.scale, roll: 22 };

const WifiSkyProbe: React.FC<z.infer<typeof schema>> = () => {
  const f = useCurrentFrame();
  const S = 30;
  if (f === 0) {
    const cam = CAM_CRUISE_WIDE;
    const uAt: [number, number] = [20, 480];
    const sat = trainSat(WIDE_TRAIN, 2, S);
    return (
      <CruiseStage
        cam={cam}
        S={S}
        world={
          <>
            <SatTrain train={WIDE_TRAIN} />
            <Jet type="B777" airline="britishAirways" at={[-170, 820]} heading={-90} alt={CRUISE - 70} pitch={1.5} shadow={0} />
            <Jet type="A330" airline="delta" at={[240, 1050]} heading={-90} alt={CRUISE - 170} pitch={1.5} shadow={0} />
            <UnitedLinked from={satLinkPoint(sat)} S={S} at={uAt} />
            <Contrail type={J.type} path={() => ({ at: uAt, alt: J.alt, heading: J.heading, pitch: J.pitch })} S={S} />
          </>
        }
      />
    );
  }
  if (f === 1) {
    const cam: SideCam = { mode: "side", x: 6, y: CRUISE + 9, z: 120, f: 1700, horizon: 1100, pitch: 2 };
    const sat = trainSat(TRAIN_CUT1, 5, 44);
    return <CruiseStage cam={cam} S={S} world={<UnitedLinked from={satLinkPoint(sat)} S={S} />} />;
  }
  if (f === 2) {
    const cam: SideCam = { mode: "side", x: 40, y: CRUISE + 25, z: -60, f: 1400, horizon: 1020, pitch: 2, yaw: 8 };
    return (
      <CruiseStage
        cam={cam}
        S={S}
        world={
          <>
            <Jet type="B787_10" airline="united" at={[0, 230]} heading={-90} alt={CRUISE} pitch={1.5} shadow={0} />
            <Contrail type="B787_10" path={() => ({ at: [0, 230], alt: CRUISE, heading: -90, pitch: 1.5 })} S={S} age={90} />
          </>
        }
      />
    );
  }
  if (f === 3) {
    return <CruiseStage cam={CAM_TRAIN_UP} S={0} world={<SatTrain train={TRAIN_CUT1} />} />;
  }
  if (f === 4) {
    const sat = trainSat(TRAIN_CUT1, 5, 52);
    return (
      <CruiseStage
        cam={CAM_LINK_CLOSE}
        S={52}
        world={
          <>
            <SatTrain train={TRAIN_CUT1} />
            <UnitedLinked from={satLinkPoint(sat)} S={52} />
          </>
        }
      />
    );
  }
  const cam: SideCam = { mode: "side", x: 0, y: CRUISE, z: 0, f: 1500, horizon: 960, pitch: -30 };
  return <CruiseStage cam={cam} S={S} world={<StarlinkSat at={[0, CRUISE + 140, 240]} heading={[-0.4, 0.92]} roll={22} />} />;
};

export default WifiSkyProbe;
