// ---------------------------------------------------------------------------
// CordycepsProbe: the probe sheet for cordyceps.tsx (kyle-pandemics). A row of stalks at grow 0.08 / 0.3 / 0.6 /
// 0.85 / 1 on the umber page, one with a different angle / bend / side, and MyceliumThreads at t 0.3 / 0.7 / 1.
// Still: bunx remotion still src/entry.ZombieAnt.ts CordycepsProbe <out>.png --frame=0
// ---------------------------------------------------------------------------
import React from "react";
import { AbsoluteFill } from "remotion";
import { CordycepsStalk, MyceliumThreads, type P2 } from "./cordyceps";

export const CordycepsProbe: React.FC = () => {
  const grows = [0.08, 0.3, 0.6, 0.85, 1];
  const wave = (x0: number, y0: number): P2[] => Array.from({ length: 12 }, (_, i) => [x0 + i * 28, y0 + 18 * Math.sin(i * 0.7)] as P2);
  return (
    <AbsoluteFill style={{ backgroundColor: "#3F3428" }}>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        {grows.map((g, i) => (
          <CordycepsStalk key={i} uid={`p${i}`} base={[120 + i * 200, 900]} angle={-20} bend={40} length={600} width={16} grow={g} />
        ))}
        <CordycepsStalk uid="pb" base={[260, 1700]} angle={-70} bend={95} length={520} width={17} bodySide={1} bodyAt={0.5} grow={1} scale={1.2} />
        <CordycepsStalk uid="pc" base={[760, 1750]} angle={10} bend={-30} length={420} width={14} grow={1} scale={0.8} frame={30} sway={6} />
        {[0.3, 0.7, 1].map((t, i) => (
          <MyceliumThreads key={i} path={wave(560, 1000 + i * 90)} t={t} seed={i + 1} />
        ))}
      </svg>
    </AbsoluteFill>
  );
};
