import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { Stage } from "./chinatalkShared";
import type { Cam } from "./chinatalkShared";
import { ACT1_END, CAM_JOIN_S, CAM_REST, DURATION, FPS, camAct1 } from "./creditGeom";
import { CreditWorld } from "./creditWorld";
import { Act1Layer, Act1Standing } from "./creditAct1";
import { Act2Layer, bankAssetsDiffuse, camAct2, worldOverrideAct2 } from "./creditAct2";

// ---------------------------------------------------------------------------
// CreditBoom — the MASTER of Logan Wright, "the biggest credit boom in history"
// (ChinaTalk style, 1080x1920, 24 fps, opaque, 1347 frames = 56.1 s). ONE film
// in one world on the master clock S = frame (audio time x 24). The eleven
// delivered files are frame ranges of this composition (WORLD.md "Cuts"), so
// every join is continuous by construction.
//   Stage(camera) -> CreditWorld (the standing world) -> Act 1 (S <= 479, A) /
//   Act 2 (S >= 480, B). Act1Standing (labels still up at S 479) is drawn on
//   both sides of the join; Act 2 retires it through its `diffuse` prop.
// Camera: camAct1 for S < CAM_JOIN_S; camAct2 (B, continuing A's follower from
// JOIN_CAM_STATE) from CAM_JOIN_S (B2: 440, the dive starts in the unpicked
// tail). Act 2's world override and the "BANK ASSETS" retirement also start
// there (both are no-ops until the dive begins), so S 0-439 is unchanged.
// ---------------------------------------------------------------------------

export const schema = z.object({});
export const defaultProps = schema.parse({});
export { DURATION, FPS };

export const cameraAt = (S: number): Cam => (S < CAM_JOIN_S ? camAct1(S) : camAct2(S));

export const CreditBoomFrame: React.FC<{ S: number }> = ({ S }) => {
  const cam = cameraAt(S);
  return (
    <Stage S={S} cam={cam} rest={CAM_REST}>
      <CreditWorld S={S} cam={cam} over={S >= CAM_JOIN_S ? worldOverrideAct2(S) : undefined} />
      {S <= ACT1_END ? <Act1Layer S={S} cam={cam} /> : null}
      <Act1Standing S={S} cam={cam} diffuse={{ bankAssets: S >= CAM_JOIN_S ? bankAssetsDiffuse(S) : 0 }} />
      {S > ACT1_END ? <Act2Layer S={S} cam={cam} /> : null}
    </Stage>
  );
};

const CreditBoom: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  return <CreditBoomFrame S={frame} />;
};

export default CreditBoom;
