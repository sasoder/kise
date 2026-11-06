import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { HOME, OrgStage, OrgWorld, POOL_AT, RECAP, WORLD_DONE } from "./orgWorld";

// ---------------------------------------------------------------------------
// OrgWorldProbe — stills of the shared world of "toto-twenty-person" (orgWorld.tsx), fully resolved
// (WORLD_DONE), at RECAP and at each team's HOME framing. Probe only: never delivered.
// ---------------------------------------------------------------------------
export const FPS = 25;
export const DURATION = 1;
export const VIEWS = ["recap", "ferrari", "redbull", "audi"] as const;
export const schema = z.object({ view: z.enum(VIEWS) });
export const defaultProps = schema.parse({ view: "recap" });

const OrgWorldProbe: React.FC<z.infer<typeof schema>> = ({ view }) => {
  const cam = view === "recap" ? RECAP : HOME[view];
  const pool = POOL_AT[view];
  return (
    <AbsoluteFill>
      <OrgStage S={0} cam={cam} pool={pool} sway={false}>
        <OrgWorld cam={cam} w={WORLD_DONE} />
      </OrgStage>
    </AbsoluteFill>
  );
};
export default OrgWorldProbe;
