import React from "react";
import { z } from "zod";
import { Bar, Baseline, INK_LO, KLabel, LevelLine, Slab, Stage, WetStroke, labelDrop } from "./mavenKit";
import type { Cam } from "./mavenKit";

// MavenKitStill -- one still of every mavenKit component at real size (k 1).
export const schema = z.object({});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});
export const DURATION = 2;
export const FPS = 24;

const CAM: Cam = { x: 540, y: 960, k: 1 };
const BY = 900;

const MavenKitStill: React.FC<Props> = () => {
  const k = 1;
  const S = 0;
  return (
    <Stage S={S} cam={CAM} rest={CAM}>
      <Bar id="s-ink" x={175} y={BY} h={640} kind="ink" k={k} S={S} />
      <Bar id="s-red" x={385} y={BY} h={520} kind="red" k={k} S={S} wet={1} />
      <Bar id="s-deep" x={595} y={BY} h={46} kind="deep" k={k} S={S} />
      <Bar id="s-need" x={595} y={BY} h={520} kind="needed" k={k} S={S} />
      <Bar id="s-exp" x={805} y={BY} h={640} kind="expected" k={k} S={S} />
      <Bar id="s-fill" x={805} y={BY} h={640} kind="ink" k={k} S={S} level={180} outline={0} />
      <LevelLine id="s-lvl" x0={480} x1={930} y={BY - 180} k={k} S={S} bead={1} draw={0.93} />
      <LevelLine id="s-lvd" x0={70} x1={480} y={BY - 700} k={k} S={S} dashed />
      <Baseline x0={60} x1={1020} y={BY} k={k} />
      <KLabel text="INK" x={175} y={BY + labelDrop(k)} k={k} />
      <KLabel text="RED" x={385} y={BY + labelDrop(k)} k={k} />
      <KLabel text="NEEDED" x={595} y={BY + labelDrop(k)} k={k} />
      <KLabel text="DEEP" x={595} y={BY + labelDrop(k)} k={k} line={1} rung={INK_LO} />
      <KLabel text="EXPECTED" x={830} y={BY + labelDrop(k)} k={k} rung={INK_LO} />
      <KLabel text="2016" x={385} y={BY - 600} k={k} kind="num" />
      <Slab id="s-s1" x={300} y={1150} w={440} h={120} kind="ink" k={k} S={S} label="MODEL" />
      <Slab id="s-s2" x={780} y={1150} w={440} h={120} kind="red" k={k} S={S} label="RELEVANT" />
      <Slab id="s-s3" x={300} y={1300} w={440} h={120} kind="deep" k={k} S={S} />
      <Slab id="s-s4" x={780} y={1300} w={440} h={120} kind="needed" k={k} S={S} label="DATA" />
      <WetStroke
        id="s-wet"
        points={[
          { x: 90, y: 170 },
          { x: 400, y: 170 },
          { x: 400, y: 100 },
          { x: 760, y: 100 },
        ]}
        k={k}
        wet={1}
        bead={1}
      />
    </Stage>
  );
};
export default MavenKitStill;
