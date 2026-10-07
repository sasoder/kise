// A review sheet for breakTurnFigure (not a deliverable): the turn in 10 steps,
// the shared frontal Emperor first for comparison.
import React from "react";
import { AbsoluteFill } from "remotion";
import { Emperor, POSE_HANG, POSE_SLUMP, lerpPose, type EmperorPose } from "./stringsShared";
import { TurnEmperor } from "./breakTurnFigure";

const BACK: EmperorPose = { ...POSE_SLUMP, head: 0, nod: 0, slump: 0.5, lean: 0 };
export const BreakTurnSheet: React.FC<{ row?: number }> = () => {
  const angs = [0, 20, 40, 60, 80, 90, 100, 120, 150, 180];
  return (
    <AbsoluteFill style={{ background: "#3F3428" }}>
      <svg width={3000} height={1500} viewBox="0 0 3000 1500">
        <g transform="translate(-60 0) scale(1.9)">
          <Emperor pose={POSE_SLUMP} at={[100, 370]} uid="s0" />
          {angs.map((a, i) => {
            const t = (a * Math.PI) / 180;
            const u = a / 180;
            return <TurnEmperor key={i} pose={lerpPose(POSE_SLUMP, BACK, u)} turn={{ body: t, head: t, hem: t, flare: 0, look: u > 0.9 ? 1 : 0 }} at={[240 + i * 135, 370]} uid={`a${i}`} />;
          })}
          <Emperor pose={POSE_HANG} at={[100, 760]} uid="s1" />
          {angs.map((a, i) => {
            const t = (a * Math.PI) / 180;
            return <TurnEmperor key={i} pose={POSE_HANG} turn={{ body: t, head: t, hem: t, flare: a > 0 && a < 180 ? 0.1 : 0, look: 0 }} at={[240 + i * 135, 760]} uid={`b${i}`} />;
          })}
        </g>
      </svg>
    </AbsoluteFill>
  );
};
export default BreakTurnSheet;
