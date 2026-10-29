// cashProbe — a still-only probe of the cash (cashBundle.tsx): a single bundle, a stack and a brick on the desert
// under the air stage's key light, any camera. For CASH_READY.md and look tests; not a cut.
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { AirStage } from "../scott-aircraft-order/aircraftShared";
import { DesertGround } from "./campusWorld";
import { CashBundles, CashShadow, cashBrickItems, cashStackItems, type BundleSize } from "./cashBundle";

export const FPS = 24000 / 1001;
export const DURATION = 1;
export const schema = z.object({
  cam: z.object({ x: z.number(), y: z.number(), z: z.number(), f: z.number(), pitch: z.number(), yaw: z.number(), horizon: z.number() }),
  scale: z.number(),
});
export const defaultProps = schema.parse({ cam: { x: 0, y: 4.2, z: -9, f: 1000, pitch: 20, yaw: 0, horizon: 960 }, scale: 10 });

const CashProbe: React.FC<z.infer<typeof schema>> = ({ cam, scale }) => {
  const S = useCurrentFrame();
  const b: BundleSize = { L: 0.156 * scale, W: 0.066 * scale, H: 0.011 * scale };
  const one = { at: [-2.4, 0, 1.2] as [number, number, number], heading: 18, size: b, seed: 0.4 };
  const stack = cashStackItems([0.1, 0, 1.6], 9, b, -6, 0, 0.05, "probeStack");
  const brick = cashBrickItems([2.6, 0, 3.4], 2, 3, 6, b, 8, 0.02, "probeBrick");
  return (
    <AirStage
      cam={{ mode: "side", near: 0.3, ...cam }}
      S={S}
      ground={null}
      world={
        <>
          <DesertGround S={S} roads={null} />
          <CashShadow
            soft={0.012 * scale}
            rects={[
              { at: [one.at[0], one.at[2]], heading: 18, L: b.L, W: b.W, h: b.H },
              { at: [0.1, 1.6], heading: -6, L: b.L, W: b.W, h: b.H * 9 },
              { at: [2.6, 3.4], heading: 8, L: b.L * 2, W: b.W * 3, h: b.H * 6 },
            ]}
          />
          <CashBundles items={[one, ...stack, ...brick]} size={b} />
        </>
      }
    />
  );
};
export default CashProbe;
