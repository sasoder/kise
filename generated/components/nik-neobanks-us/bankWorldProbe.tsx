// BankWorldProbe: stills that test bankWorld (not a delivered cut). Frames: 0 bank, 1 phone, 2 phone on a bank's roof, 3 the US
// slab with a field of banks and phones (cut A's opening), 4 the same field close (cut A's landing).
import React from "react";
import { useCurrentFrame } from "remotion";
import { NuclearStage, type NuclearCam } from "../scott-nolan-uranium/nuclearWorld";
import { BankField, LegacyBank, NeobankPhone, UsSlab, bankRoofOf, usBankSites, usProject, usSlabTop } from "./bankWorld";

export const FPS = 24000 / 1001;
export const DURATION = 6;
const CAM: NuclearCam = { tx: 0, ty: 0, tz: 0, d: 100, yaw: 0, pitch: 0, f: 2200, cy: 960, cx: 540 };
const PH = [usProject(-96.2, 38.6), usProject(-122.1, 37.5), usProject(-74.6, 40.6), usProject(-84.6, 33.9)];
const SITES = usBankSites({ pitchX: 46, pitchZ: 42, jitter: 6, north: 6, small: 0.7, clear: PH.map((at) => ({ at, r: 22 })) });
const BankWorldProbe: React.FC = () => {
  const f = useCurrentFrame();
  const S = f * 7 + 40;
  if (f === 0) {
    return <NuclearStage boardUnits={110} cam={{ ...CAM, ty: 9, d: 96, yaw: 26, pitch: 12 }} S={S} world={<LegacyBank at={[0, 0]} />} />;
  }
  if (f === 1) {
    return <NuclearStage boardUnits={110} cam={{ ...CAM, ty: 25, d: 92, yaw: -22, pitch: 6 }} S={S} world={<NeobankPhone at={[0, 0]} />} />;
  }
  if (f === 2) {
    const roof = bankRoofOf([0, 0]);
    return (
      <NuclearStage
        boardUnits={140}
        cam={{ ...CAM, ty: 22, d: 120, yaw: -24, pitch: 10 }}
        S={S}
        world={
          <>
            <LegacyBank at={[0, 0]} />
            <NeobankPhone at={[roof[0], roof[2]]} y={roof[1]} scale={0.55} />
          </>
        }
      />
    );
  }
  const T = usSlabTop();
  if (f === 5) {
    const pts = [usProject(-95.4, 29.8), usProject(-80.2, 25.8), usProject(-122.3, 47.6), usProject(-68, 46.5), usProject(-98, 39)];
    return <NuclearStage cam={{ ...CAM, tx: 0, ty: 0, tz: 20, d: 1750, yaw: -4, pitch: 52, f: 1800, cy: 800 }} S={S} world={<><UsSlab /><BankField items={pts.map((at) => ({ at, scale: 2 }))} y={T} /></>} />;
  }
  const world = (
    <>
      <UsSlab />
      <BankField items={SITES.map((b, i) => ({ at: b.at, scale: b.scale * (0.94 + (0.12 * ((i * 7919) % 13)) / 12) }))} y={T} />
      {PH.map((at, i) => (
        <NeobankPhone key={i} at={at} y={T} rise={f === 3 ? 0.12 : 0.4} />
      ))}
    </>
  );
  if (f === 3) return <NuclearStage cam={{ ...CAM, tx: 0, ty: 0, tz: 20, d: 1750, yaw: -4, pitch: 52, f: 1800, cy: 800 }} S={S} world={world} />;
  return <NuclearStage boardUnits={300} cam={{ ...CAM, tx: PH[0][0], ty: 8, tz: PH[0][1], d: 300, yaw: -6, pitch: 36, f: 1800, cy: 920 }} S={S} world={world} />;
};
export default BankWorldProbe;
