// ---------------------------------------------------------------------------
// MessyProbe (wip-entertainment): a scratch probe of messyShared.tsx, not a cut. One page with every piece of the
// messy variant on it: the sheet, a baked hand-cut print dealt in on twos and taped down, a rectangular print with its
// hand-cut border, the red marker (underline, ring, arrow, dashed line) drawing on, and two scrawls.
// Opaque 1080x1920, 24 fps, 48 frames. Render a still at f47 (everything drawn) and f20 (mid-draw).
// The probe prints: public/wip-entertainment/probe_roughcut.png (pl_tub re-cut by bake-roughcut.py), wip-victorians/tw_map.jpg.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { CaptionBandsDebug, WipPlane, runWipCamera } from "../kits/works-in-progress/wipShared";
import {
  HAND_FONT,
  MarkerStroke,
  MessyFilmLife,
  MessyPaper,
  PEN_INK,
  RoughCutPrint,
  Scrawl,
  Tape,
  dealIn,
  drawT,
  handArrow,
  handLine,
  handLoop,
  stickOn,
} from "./messyShared";

export const FPS = 24;
export const DURATION = 48;
export const schema = z.object({ bands: z.boolean() });
export const defaultProps = schema.parse({ bands: false });

const camAt = runWipCamera(
  [
    { f: -24, x: 540, y: 960, k: 1 },
    { f: DURATION, x: 540, y: 960, k: 1.02, ease: "linear" },
  ],
  DURATION,
);

const MessyProbe: React.FC<z.infer<typeof schema>> = ({ bands }) => {
  const frame = useCurrentFrame();
  const cam = camAt(frame);
  const deal = dealIn(frame, { start: 0, dur: 12, from: { x: 0, y: -900 }, rot: -6 });
  const arrow = handArrow({ x: 760, y: 1560 }, { x: 600, y: 1680 }, "arrow");
  return (
    <>
      <MessyFilmLife frame={frame}>
        <MessyPaper cam={cam} />
        <WipPlane cam={cam}>
          <RoughCutPrint src="wip-entertainment/probe_roughcut.png" x={560 + deal.dx} y={420 + deal.dy} w={760} aspect={1.4327} rotate={-2.2 + deal.rot} lift={deal.lift} seed="probe-tub" />
          <Tape x={250} y={225} w={170} h={48} rotate={-38} press={stickOn(frame, 16)} seed="probe-t1" />
          <RoughCutPrint src="wip-victorians/tw_map.jpg" rect x={330} y={1000} w={380} aspect={0.8} position="40% 40%" seed="probe-map" />
          <Tape x={330} y={760} w={140} h={46} rotate={4} press={stickOn(frame, 20)} seed="probe-t2" />
        </WipPlane>
        <WipPlane cam={cam} ink>
          <MarkerStroke points={handLine({ x: 150, y: 730 }, { x: 940, y: 742 }, "cut")} progress={drawT(frame, 4, 16)} frame={frame} seed="cut" />
          <MarkerStroke points={handLoop(330, 1000, 240, 290, "ring")} progress={drawT(frame, 14, 30)} frame={frame} seed="ring" />
          <MarkerStroke
            points={[
              { x: 640, y: 830 },
              { x: 980, y: 830 },
              { x: 980, y: 1060 },
              { x: 640, y: 1060 },
            ]}
            closed
            dash={[22, 18]}
            width={9}
            opacity={0.7}
            progress={drawT(frame, 20, 40)}
            frame={frame}
            seed="ghost"
          />
          {arrow.map((pts, i) => (
            <MarkerStroke key={i} points={pts} progress={drawT(frame, 24 + i * 5 + (i ? 6 : 0), 32 + i * 5 + (i ? 4 : 0))} frame={frame} seed={`arrow${i}`} />
          ))}
          <Scrawl text="2000" x={690} y={950} size={110} frame={frame} start={8} seed="y2k" />
          <Scrawl text="today" x={650} y={1560} size={120} frame={frame} start={30} font="hand" rotate={-5} seed="today" />
          <Scrawl text="half" x={170} y={1600} size={90} frame={frame} start={34} font="hand" color={PEN_INK} rotate={2} seed="pen" />
        </WipPlane>
      </MessyFilmLife>
      <CaptionBandsDebug on={bands} />
      <div style={{ display: "none", fontFamily: HAND_FONT }} />
    </>
  );
};

export default MessyProbe;
