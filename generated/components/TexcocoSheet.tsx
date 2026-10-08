// The review sheet of texcocoFigures (frame = page): 0 the cast, 1 the heads,
// 2 the passed-over brother's turn, 3 Moctezuma's turn, 4 brother 0's turn,
// 5 the walk, 6 the diadem at every yaw + the Spaniards.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PlanPage, WorldSvg, type Cam, type P2 } from "./incaShared";
import { walkPose } from "./texcocoShared";
import { Brother, Diadem, Moctezuma, SPANIARD_STAND, STAND, Spaniard, type FigPose } from "./texcocoFigures";

const CAM: Cam = { k: 1, cx: 540, cy: 960 };
const pose = (yaw: number, o: Partial<FigPose> = {}): FigPose => ({ ...STAND, yaw, headYaw: yaw, ...o });
const TexcocoSheet: React.FC = () => {
  const page = useCurrentFrame();
  const row = (y: number, n: number, f: (i: number, x: number) => React.ReactNode) => Array.from({ length: n }, (_, i) => <g key={`${y}-${i}`}>{f(i, 1080 * ((i + 0.5) / n))}</g>);
  const yaws = [-1.35, -0.9, -0.45, 0, 0.45, 0.9, 1.35];
  let body: React.ReactNode = null;
  if (page === 0)
    body = (
      <>
        <Brother variant={0} pose={pose(1.0, { armR: { w: [70, -300], elbow: [0, 1], fist: 0, hand: 0 } })} at={[220, 1300]} scale={2.3} />
        <Moctezuma pose={pose(0)} at={[540, 1300]} scale={2.55} />
        <Brother variant={1} pose={pose(-1.0, { armL: { w: [-70, -300], elbow: [0, 1], fist: 0, hand: 0 } })} at={[860, 1300]} scale={2.3} />
        <Diadem at={[540, 330]} scale={2.6} />
      </>
    );
  else if (page === 1)
    body = (
      <>
        {row(0, 3, (i, x) => (
          <>
            <Moctezuma pose={pose([0, -0.5, -1.0][i])} at={[x, 1340]} scale={4.2} uid={`m${i}`} />
            <Brother variant={0} pose={pose([1.0, 0.5, 0][i])} at={[x, 2020]} scale={4.2} uid={`a${i}`} crowned={i === 0 ? 1 : 0} />
            <Brother variant={1} pose={pose([-1.0, -0.4, 0.35][i], i === 2 ? { pitch: 16, brow: 1, lids: 0.45, mouth: -1 } : {})} at={[x, 2700]} scale={4.2} uid={`b${i}`} />
          </>
        ))}
      </>
    );
  else if (page >= 2 && page <= 4)
    body = (
      <>
        {row(0, 4, (i, x) => {
          const at: P2 = [x, 900];
          const p = pose(yaws[i]);
          return page === 2 ? <Brother variant={1} pose={p} at={at} scale={1.7} uid={`t${i}`} /> : page === 3 ? <Moctezuma pose={p} at={at} scale={1.7} uid={`t${i}`} /> : <Brother variant={0} pose={p} at={at} scale={1.7} uid={`t${i}`} />;
        })}
        {row(1, 3, (i, x) => {
          const at: P2 = [x, 1750];
          const p = pose(yaws[i + 4]);
          return page === 2 ? <Brother variant={1} pose={p} at={at} scale={1.7} uid={`u${i}`} /> : page === 3 ? <Moctezuma pose={p} at={at} scale={1.7} uid={`u${i}`} /> : <Brother variant={0} pose={p} at={at} scale={1.7} uid={`u${i}`} />;
        })}
      </>
    );
  else if (page === 5)
    body = (
      <>
        {row(0, 4, (i, x) => (
          <Brother variant={1} pose={walkPose(pose(1.25, { armL: { w: [-6, -152], elbow: [-0.6, 1], fist: 0.5, hand: 0 }, armR: { w: [10, -152], elbow: [-0.6, 1], fist: 0.5, hand: 0 } }), i / 8)} at={[x, 900]} scale={1.7} uid={`w${i}`} />
        ))}
        {row(1, 4, (i, x) => (
          <Brother variant={1} pose={walkPose(pose(1.25, { armL: { w: [-6, -152], elbow: [-0.6, 1], fist: 0.5, hand: 0 }, armR: { w: [10, -152], elbow: [-0.6, 1], fist: 0.5, hand: 0 } }), (i + 4) / 8)} at={[x, 1750]} scale={1.7} uid={`x${i}`} />
        ))}
      </>
    );
  else if (page === 6)
    body = (
      <>
        {row(0, 5, (i, x) => (
          <Diadem at={[x, 300]} scale={3} yaw={[-1.4, -0.7, 0, 0.7, 1.4][i]} uid={`d${i}`} />
        ))}
        <Spaniard variant={0} at={[280, 1500]} scale={2.3} />
        <Spaniard variant={1} at={[700, 1500]} scale={2.3} pose={{ ...SPANIARD_STAND[1], headYaw: -0.6 }} />
      </>
    );
  return (
    <AbsoluteFill>
      <PlanPage cam={CAM}>
        <WorldSvg cam={CAM}>{body}</WorldSvg>
      </PlanPage>
    </AbsoluteFill>
  );
};
export default TexcocoSheet;
