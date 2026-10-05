import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import {
  F1_ANCHOR,
  MercJobWorld,
  PAIR_LOOK,
  REST_STATE_B,
  ROW_X,
  TOTO_ON_MERC,
  CAM_LIFT,
  type WorldState,
} from "./mercJobShared";

// MercJobProbe — a still of the mercJob world for checks (not a cut): Act B's rest state (cut 4 f0's
// world) at the pair framing, or Act B's end state (Toto on the Mercedes tile, the F1 mark) at a wide
// framing that shows the industry row. Renders with S 0, no sway.
export const schema = z.object({
  view: z.enum(["restPair", "endWide"]).default("restPair"),
  k: z.number().default(0.78),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({});

const MercJobProbe: React.FC<Props> = ({ view, k }) => {
  if (view === "restPair") {
    const cam = { x: PAIR_LOOK.x, y: PAIR_LOOK.y + CAM_LIFT / PAIR_LOOK.k, k: PAIR_LOOK.k };
    return (
      <AbsoluteFill>
        <MercJobWorld S={0} cam={cam} rest={cam} pool={{ x: PAIR_LOOK.x, y: PAIR_LOOK.y }} state={REST_STATE_B} sway={false} />
      </AbsoluteFill>
    );
  }
  const state: WorldState = { ...REST_STATE_B, toto: { x: TOTO_ON_MERC.x, feetY: TOTO_ON_MERC.feetY, lift: 0 }, row: { dim: 1, reveal: ROW_X.map(() => 1) }, f1: 1 };
  const cam = { x: F1_ANCHOR.x, y: 470 + CAM_LIFT / k, k };
  return (
    <AbsoluteFill>
      <MercJobWorld S={0} cam={cam} rest={cam} pool={{ x: TOTO_ON_MERC.x, y: TOTO_ON_MERC.feetY }} state={state} sway={false} />
    </AbsoluteFill>
  );
};

export default MercJobProbe;
