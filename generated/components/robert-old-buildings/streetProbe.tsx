// streetProbe (robert-old-buildings): a still-probe of streetWorld for the builders (not a delivered cut). Props pick
// the camera, the lamp and the crown's glow.
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { StreetStage } from "./streetWorld";

export const FPS = 24000 / 1001;
export const DURATION = 1;
export const schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
  yaw: z.number(),
  pitch: z.number(),
  f: z.number(),
  lamp: z.number(),
  glow: z.number(),
  sweepY: z.number(),
  sweepAmt: z.number(),
});
export const defaultProps = schema.parse({ x: 0, y: 47.2, z: -2.6, yaw: 180, pitch: 6, f: 1250, lamp: 1, glow: 0, sweepY: 0, sweepAmt: 0 });

const StreetProbe: React.FC<z.infer<typeof schema>> = (p) => {
  const frame = useCurrentFrame();
  const cam = { x: p.x, y: p.y, z: p.z, yaw: p.yaw, pitch: p.pitch, f: p.f };
  return <StreetStage cam={cam} rest={cam} frame={frame + 40} lamp={p.lamp} glow={p.glow} bloom={p.glow > 0 ? 0.22 : 0} sweep={{ y: p.sweepY, amt: p.sweepAmt }} />;
};
export default StreetProbe;
