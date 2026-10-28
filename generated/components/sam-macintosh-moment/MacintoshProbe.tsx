// MacintoshProbe — the shared world's probe still (never delivered): the CROWD (10 busts in two rows, facing as
// specced), the three mark tiles, and the speech bubble in its three states (empty, mark, mark + heart).
import React from "react";
import { z } from "zod";
import { StoutStage } from "../kits/cheeky-pint/stoutShared";
import { Bust, ChatGPTMark, CodexMark, CROWD, CrowdShadow, DotsMark, SpeechBubble } from "./macintoshShared";

export const FPS = 24000 / 1001;
export const DURATION = 1;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const CAM = { x: 540, y: 960, k: 1 };
const R = 80;
const rowA = CROWD.slice(0, 5).map((s, i) => ({ x: 130 + i * 205, y: 1420, r: R, facing: s.facing, spec: s }));
const rowB = CROWD.slice(5).map((s, i) => ({ x: 130 + i * 205, y: 1720, r: R, facing: s.facing, spec: s }));

const MacintoshProbe: React.FC = () => (
  <StoutStage S={0} cam={CAM} rest={CAM} pool={{ x: 540, y: 900 }} sway={false}>
    <CodexMark x={220} floor={330} size={180} k={1} />
    <ChatGPTMark x={540} floor={330} size={180} k={1} />
    <DotsMark x={860} floor={330} size={180} k={1} />
    <SpeechBubble x={190} y={560} w={270} h={176} tail={{ root: -30, tip: [150, 720] }} k={1} />
    <SpeechBubble x={540} y={560} w={270} h={176} tail={{ root: 0, tip: [520, 720] }} k={1} mark="codex" markIn={1} />
    <SpeechBubble x={890} y={560} w={270} h={176} tail={{ root: 30, tip: [930, 720] }} k={1} mark="chatgpt" markIn={1} heartIn={1} />
    <SpeechBubble x={360} y={880} w={270} h={176} tail={{ root: 0, tip: [330, 1040] }} k={1} mark="codex" markIn={1} heartIn={1} />
    <SpeechBubble x={720} y={880} w={270} h={176} tail={{ root: 0, tip: [750, 1040] }} k={1} mark="chatgpt" markIn={1} />
    {/* a short-bodied bust (bodyLen 200: the body ends above the arm creases' foot) */}
    <CrowdShadow busts={[{ x: 960, y: 860, r: R, facing: -1, bodyLen: 200 }]} />
    <Bust x={960} y={860} r={R} spec={CROWD[3]} bodyLen={200} />
    <CrowdShadow busts={rowA} />
    {rowA.map((b, i) => (
      <Bust key={i} x={b.x} y={b.y} r={b.r} spec={b.spec} pose={{ smile: i % 2 ? 0.8 : 0, content: i === 2 ? 1 : 0 }} />
    ))}
    <CrowdShadow busts={rowB} />
    {rowB.map((b, i) => (
      <Bust key={i} x={b.x} y={b.y} r={b.r} spec={b.spec} />
    ))}
  </StoutStage>
);
export default MacintoshProbe;
