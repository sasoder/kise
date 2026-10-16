// ---------------------------------------------------------------------------
// OverwhelmingNumbers (cut C of "Sheppard_Conquistador_Advantages"; Dwarkesh
// Patel with Si Sheppard). Dwarkesh map style, "beyond maps" umber page, the
// engraved CHARACTERS of SteelAndHorses (the dot version is kept as
// OverwhelmingNumbersDots). Opaque 1080x1920, 23.976 fps, 89 frames.
//
// CHECK LINE: After this cut the viewer can say: "the Spaniards were one small
// company at the head of an enormous army of native allies - the numbers were
// the allies'."
//
// THE LINE: "[...] without the support of those indigenous allies. So those
// overwhelming numbers."
// WORD -> FRAME: without -6 · the 3 · support 12 · of 20 · those 23 ·
//   indigenous 26 · allies 31-39 · So 50 · those 50 · overwhelming 62-75 ·
//   numbers 75-83 · cut back to the speaker at 89.
//
// THE MOTION (one move): the frame opens tight on the orange horse and its
// rider, pikemen behind him, marching to screen left and seemingly alone. One
// eased log-space pull-back (already moving on f0, landing on f60) lets the
// cream warriors come in over every frame edge ("support"), row after row of
// them, side-on and stacked up the page like a battle engraving, all marching
// the same way, until the Spaniards are one small orange knot in a clearing in
// the middle of several hundred allies who run off the frame on all four sides
// ("overwhelming"). The hold creeps out while the march goes on. Nothing fades
// in: every figure is there from frame 0 and only the camera reveals them.
//
// Colour: ORANGE = the Spaniards' steel and horse; every ally is CREAM.
// No text, no numbers, no banners.
// ---------------------------------------------------------------------------
import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { PlanPage } from "../kits/maps/incaShared";
import { Host, SpanishKnot, groundCam, useSprites, viewAt } from "./overwhelmingFigures";

export const FPS = 24000 / 1001;
export const DURATION = 89;
export const schema = z.object({});
export const defaultProps = schema.parse({});

const OverwhelmingNumbers: React.FC<z.infer<typeof schema>> = () => {
  const frame = useCurrentFrame();
  const ready = useSprites();
  const view = viewAt(frame);
  return (
    <PlanPage cam={groundCam(view, frame)} vignette={0.5}>
      {/* the rows behind the knot, the knot, the rows level with it and in front */}
      <Host view={view} frame={frame} layer={0} ready={ready} />
      <SpanishKnot view={view} frame={frame} />
      <Host view={view} frame={frame} layer={1} ready={ready} />
    </PlanPage>
  );
};

export default OverwhelmingNumbers;
