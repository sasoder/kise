// FuelProbe: stills that test fuelShared (not a delivered cut). Frames: 0 SMRs rising, 1 the plant beside a row of SMRs,
// 2 the same dimmed behind a lit pellet, 3 miniatures on the map (cut C's use), 4 the plant close.
import React from "react";
import { useCurrentFrame } from "remotion";
import { FuelPellet, NuclearStage, WorldSlab, mapProject, slabTop, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { GigawattPlant, SMR, SmrModule } from "./fuelShared";

export const FPS = 24000 / 1001;
export const DURATION = 5;
const CAM: NuclearCam = { tx: 0, ty: 0, tz: 0, d: 100, yaw: 0, pitch: 0, f: 2200, cy: 960, cx: 540 };
const row = (n: number, rise: (i: number) => number, dim = 0) =>
  Array.from({ length: n }, (_, i) => <SmrModule key={i} at={[i * 34, 0]} rise={rise(i)} dim={dim} />);
const FuelProbe: React.FC = () => {
  const f = useCurrentFrame();
  const S = 400 + f * 13;
  if (f === 0) {
    return <NuclearStage boardUnits={140} cam={{ ...CAM, tx: 34, ty: SMR.H * 0.45, d: 230, yaw: 18, pitch: 24 }} S={S} world={<>{row(4, (i) => [1, 1, 0.55, 0.08][i])}</>} />;
  }
  if (f === 1 || f === 2) {
    const dim = f === 2 ? 1 : 0;
    return (
      <NuclearStage
        boardUnits={500}
        pool={f === 2 ? { x: 540, y: 1000, strength: 1 } : undefined}
        cam={f === 2 ? { ...CAM, tx: 200, ty: 6, tz: -150, d: 160, yaw: 12, pitch: 9, f: 1900, cy: 920 } : { ...CAM, tx: 240, ty: 110, tz: 40, d: 1050, yaw: 14, pitch: 14, f: 2000 }}
        S={S}
        world={
          <>
            {row(8, () => 1, dim)}
            <GigawattPlant at={[360, 10]} S={S} dim={dim} />
            {f === 2 ? <FuelPellet at={[200, -150]} h={12} /> : null}
          </>
        }
      />
    );
  }
  if (f === 3) {
    const US = mapProject(-86, 37);
    const y = slabTop();
    const s = 0.1;
    return (
      <NuclearStage
        cam={{ ...CAM, tx: US[0], ty: y, tz: US[1], d: 260, yaw: 0, pitch: 40, f: 2200 }}
        S={S}
        world={
          <>
            <WorldSlab />
            {[0, 1, 2].map((i) => (
              <SmrModule key={i} at={[US[0] - 14 + i * 4.6, US[1] - 3]} y={y} scale={s} />
            ))}
            <GigawattPlant at={[US[0] + 6, US[1] - 3]} y={y} scale={s} S={S} />
          </>
        }
      />
    );
  }
  return <NuclearStage boardUnits={500} cam={{ ...CAM, tx: 70, ty: 110, tz: 50, d: 820, yaw: -8, pitch: 10, f: 2000 }} S={S} world={<GigawattPlant at={[0, 0]} S={S} />} />;
};
export default FuelProbe;
