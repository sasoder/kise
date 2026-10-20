// The jet probe (builder A): both views of the shared jet at a small and a big size on the paper, the hollow
// outline, the airliner and the speed echo. Not a cut; a check still for zachShared.tsx.
//   bunx remotion still scripts/clips/zach-shore-trailer/jet-probe-entry.tsx JetProbe <scratch>/jet-probe.png --frame=0
import React from "react";
import { AbsoluteFill, Composition, registerRoot } from "remotion";
import { PaperGround, OP_MID, ShadowText } from "../../../generated/components/kits/core-memory/cerroShared";
import { Airliner, Jet, JetEcho } from "../../../generated/components/zach-shore-trailer/zachShared";

const W = 2048;
const H = 1080;

const JetProbe: React.FC = () => (
  <AbsoluteFill>
    <PaperGround frame={0} cx={W / 2} cy={H / 2} cxRest={W / 2} cyRest={H / 2} k={1} />
    <svg width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
      {/* small: ~110 px, the size cut A flies it at */}
      <Jet view="top" x={160} y={150} scale={110 / 120} />
      <Jet view="top" x={330} y={150} scale={110 / 120} angle={180} />
      <Airliner x={500} y={150} scale={110 / 120} angle={180} opacity={OP_MID} />
      <Jet view="side" x={680} y={150} scale={110 / 120} />
      <Jet view="side" x={850} y={150} scale={110 / 120} hollow />
      <JetEcho view="top" x={1080} y={150} scale={110 / 120} angle={180} step={14} />
      <ShadowText text="110 PX" x={170} y={260} size={40} weight={800} anchor="start" />
      {/* big: ~420 px, the size cuts B and C fly it at */}
      <Jet view="top" x={330} y={520} scale={420 / 120} />
      <Jet view="side" x={830} y={500} scale={420 / 120} />
      <Jet view="side" x={1340} y={500} scale={420 / 120} hollow />
      <Airliner x={1780} y={500} scale={420 / 120} angle={-90} opacity={OP_MID} />
      <JetEcho view="side" x={830} y={830} scale={420 / 120} step={22} />
      <Jet view="side" x={1400} y={850} scale={420 / 120} angle={25} />
    </svg>
  </AbsoluteFill>
);

const Root = () => (
  <Composition id="JetProbe" component={JetProbe} durationInFrames={1} fps={24000 / 1001} width={W} height={H} />
);
registerRoot(Root);
