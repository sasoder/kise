import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { BG_DIM } from "./fieldShared";
import { AirgapFrame, assertJoin, camOf, dampTrack, glideTarget, type Glide } from "./airgapShared";
import * as C6 from "./VeryHighBar";

// ---------------------------------------------------------------------------
// Noam_Airgapping, film B, EXTRA — `64_NotSufficient`, in 1:04.659 (G0 = 146).
// "and I'm not convinced that would be sufficient,"
// SRT span 64.659 -> 66.079 s. DURATION = round(1.420 * 24) = 34 speech + 16
// tail = 50. Global G = 146 + frame.
// Words (G): and 146 · i'm 149 · not 152 · convinced 154 · that 159 · would 161 ·
// be 164 · sufficient 166.
//
// GESTURES:
//  1. f0-50    camera: the slow creep into the gap — cut 6's long tilt down onto
//              the chip axis (G138-330), continued exactly from cut 6's damped
//              state (position AND velocity) at G146.
//  2. f4-60    "not convinced ... sufficient": a faint heat shimmer — three thin
//              ACCENT_DEEP strands wavering off the left tower's inner wall into
//              the gap at chip height (G150-206), drawn on from the bottom and
//              withdrawn from the bottom. The gap is not as empty as it looks.
// ---------------------------------------------------------------------------

export const FPS = 24;
export const G0 = 146;
export const DURATION = 50; // 34 + 16
export const SPEECH_END = 180;

export const GLIDES: Glide[] = [
];
export const TARGET = glideTarget(C6.TARGET(G0), GLIDES, C6.TARGET);
export const TABLE = dampTrack(TARGET, G0, G0 + DURATION + 2, C6.TABLE[G0 - C6.G0]);
export const CAM = camOf(TABLE, G0);
export const REST = C6.REST;

assertJoin("NotSufficient", C6.CAM(C6.SPEECH_END), CAM(G0));

export const schema = z.object({
  backgroundSrc: z.string(),
  backgroundBlur: z.number(),
  backgroundDim: z.number(),
  parallax: z.number(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({
  backgroundSrc: "grid-background.jpg",
  backgroundBlur: 13,
  backgroundDim: BG_DIM,
  parallax: 0.15,
});

const NotSufficient: React.FC<Props> = (p) => {
  const frame = useCurrentFrame();
  const G = G0 + frame;
  return <AirgapFrame G={G} cam={CAM(G)} rest={REST} {...p} />;
};

export default NotSufficient;
