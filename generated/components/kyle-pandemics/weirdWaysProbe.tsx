// Probe (cut 74, WeirdWaysToExploit): the 3D man (weirdWaysMan) at body / head yaws round the back.
import React from "react";
import { AbsoluteFill } from "remotion";
import { perspective } from "../kyle-london/londonDepth";
import { HANG_L, HANG_R, Man, rigOf, viewOf, type ManPose } from "./weirdWaysMan";

const base = (yaw: number, headYaw: number): ManPose => ({
  X: 0,
  Z: 0,
  hipY: -148,
  yaw,
  chestYaw: yaw,
  headYaw,
  lean: 4,
  roll: 0,
  slump: 0.5,
  headPitch: 6,
  headRoll: 0,
  footL: [Math.cos(yaw) * 13, 0, Math.sin(yaw) * 13],
  footR: [-Math.cos(yaw) * 13, 0, -Math.sin(yaw) * 13],
  footYawL: yaw + 0.15,
  footYawR: yaw - 0.15,
  heelL: 0,
  heelR: 0,
  armL: HANG_L,
  armR: { ...HANG_R },
  mouth: 0.5,
  lids: 0.3,
});
const Fig: React.FC<{ q: ManPose; sx: number; sy: number; s: number; uid: string }> = ({ q, sx, sy, s, uid }) => {
  const P = perspective({ k: 1, cx: 0, cy: 0 }, { eyeY: -215, dRef: 700, kRef: 1, dolly: 0 });
  const V = viewOf(P);
  return (
    <g transform={`translate(${sx} ${sy}) scale(${s})`}>
      <Man V={V} R={rigOf(q)} uid={uid} />
    </g>
  );
};
export const WeirdWaysProbe: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: "#3F3428" }}>
    <svg width={1080} height={1920} viewBox="0 0 1080 1920">
      {[-Math.PI + 0.02, -2.3, -1.4].map((y, i) => (
        <Fig key={i} q={{ ...base(y, y), headPitch: 10, headRoll: 9 }} sx={200 + i * 340} sy={2900} s={9} uid={`c${i}`} />
      ))}
      {[-0.6, 0, 0.3].map((y, i) => (
        <Fig key={i} q={{ ...base(y, y), headPitch: 4, headRoll: -6, mouth: 0.6, lids: 0.25 }} sx={200 + i * 340} sy={3900} s={9} uid={`d${i}`} />
      ))}
    </svg>
  </AbsoluteFill>
);
