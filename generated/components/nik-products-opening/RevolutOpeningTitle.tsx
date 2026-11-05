// RevolutOpeningTitle — nik-products-opening, cut 0.
// CHECK: the viewer knows this conversation is about how Revolut builds new products.
// LINE: opening interview question; title copy explicitly requested by Tom.
// WORD -> FRAME: entire title lands f12; no word-by-word animation.
// DURATION: 0–3.920583333s at 24000/1001 = 94 frames, f0..93.
// MOTION: the cream title card slides up 24 px and resolves in one restrained entrance.
// It straddles the camera divider and stays still through Nik's listening shot; the editor cuts it at John's return.
// AMBER: the small lower edge identifies the Cheeky Pint treatment. SOURCES: Tom's supplied title, no factual figures.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { z } from "zod";
import { COLOR, EDGE, ElevationShadow, FONT_NUM, SPACE, TRACK, TYPE } from "../kits/cheeky-pint/stoutShared";

export const FPS = 24000 / 1001;
export const DURATION = 94;
export const schema = z.object({});
export const defaultProps = schema.parse({});
const X = SPACE.CLEAR * 4;
const Y = 848;
const H = 104;
const W1 = 888;
const W2 = 640;
const silhouette = `M${X} ${Y}h${W1}v${H}h${W2-W1}v${H}H${X}Z`;

const RevolutOpeningTitle: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920} viewBox="0 0 1080 1920">
        <g opacity={p} transform={`translate(0 ${(1-p)*SPACE.CLEAR})`}>
          <ElevationShadow silhouette={[{ d: silhouette }]} elevation="lifted" />
          <path d={silhouette} fill={COLOR.cream} />
          <path d={`M${X} ${Y+EDGE.CREAM/2}h${W1}`} stroke={COLOR.edge} strokeWidth={EDGE.CREAM} />
          <path d={`M${X} ${Y+2*H}h${W2}`} stroke={COLOR.amberTop} strokeWidth={EDGE.HOT*2} />
          <g fill={COLOR.inkDark} fontFamily={FONT_NUM} fontWeight={700} fontSize={TYPE.TAG*0.875} letterSpacing={`${TRACK.tag}em`}>
            <text x={X+SPACE.INSET_X} y={Y+76}>How Revolut builds</text>
            <text x={X+SPACE.INSET_X} y={Y+H+76}>new products</text>
          </g>
        </g>
      </svg>
    </AbsoluteFill>
  );
};
export default RevolutOpeningTitle;
