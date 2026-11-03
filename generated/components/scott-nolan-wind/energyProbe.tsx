// EnergyProbe: stills that test energyWorld (not a delivered cut). f0 the wide (cut A's resolved frame), f1-f5 a close of
// each plant (coal, gas, nuclear, wind, solar), f6 the data center, f7 the plug seated in nuclear's socket with current.
import React from "react";
import { useCurrentFrame } from "remotion";
import { NuclearStage, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { CUT_A_END_CAM, CUT_A_PLUG_END, cutACamAt, cutAPlugAt } from "./cutAState";
import { LINEUP, PLANTS, PLINTH, socketOf } from "./energyCore";
import { DC_AT, DataCenter, PowerCable } from "./energyDataCenter";
import { Lineup } from "./energyPlants";

export const FPS = 24000 / 1001;
export const DURATION = 9;
const BASE: NuclearCam = { tx: 0, ty: 0, tz: 0, d: 1000, yaw: 0, pitch: 18, f: 2200, cx: 540, cy: 960 };
const EnergyProbe: React.FC = () => {
  const f = useCurrentFrame();
  const S = 600 + f * 17;
  if (f === 0) {
    return (
      <NuclearStage cam={CUT_A_END_CAM} S={S} boardUnits={1000} pool={{ x: 520, y: 900 }} world={<><Lineup S={S} /><DataCenter S={S} /><PowerCable {...CUT_A_PLUG_END} /></>} />
    );
  }
  if (f >= 1 && f <= 5) {
    const k = PLANTS[f - 1];
    const [X, Z] = LINEUP[k];
    const tall = k === "solar" ? 40 : k === "gas" ? 110 : k === "nuclear" ? 150 : 240;
    const cam = { ...BASE, tx: X, ty: PLINTH.H + tall * 0.55, tz: Z, d: k === "solar" ? 760 : 1250 + tall * 2.2, pitch: 22, yaw: -8 };
    return <NuclearStage cam={cam} S={S} boardUnits={600} world={<Lineup S={S} />} />;
  }
  if (f === 6) {
    return (
      <NuclearStage cam={{ ...BASE, tx: DC_AT[0], ty: 40, tz: DC_AT[1], d: 1500, pitch: 26, yaw: -10 }} S={S} boardUnits={600} world={<><DataCenter S={S} /><PowerCable {...CUT_A_PLUG_END} /></>} />
    );
  }
  if (f === 8) {
    return <NuclearStage cam={cutACamAt(0)} S={S} boardUnits={1000} pool={{ x: 520, y: 900 }} world={<><Lineup S={S} /><DataCenter S={S} /><PowerCable {...cutAPlugAt(0)} /></>} />;
  }
  const so = socketOf("nuclear");
  return (
    <NuclearStage
      cam={{ ...BASE, tx: 0, ty: 120, tz: -500, d: 1900, pitch: 16, yaw: -14 }}
      S={S}
      boardUnits={800}
      world={<><Lineup S={S} /><DataCenter S={S} lit={0.6} /><PowerCable end={so.pos} dir={so.dir} current={0.7} /></>}
    />
  );
};
export default EnergyProbe;
