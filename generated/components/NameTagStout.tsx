import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { StoutNameTag, TAG_IN } from "./stoutShared";

// ---------------------------------------------------------------------------
// NameTagStout — Toto Wolff's name tag in the STOUT system (Cheeky Pint S4E01,
// "Mercedes F1 financials"). Builder D, brief out/wolff/briefs/STOUT_MOTION.md.
// TRANSPARENT 1080x1920 overlay, 24 fps, 96 f (the house name tag's length),
// free placement over the footage.
//
// THE TAG: the user's chosen structure (NameTagCheekyPint "strips") in stout
// materials — the name on a cream strip, the job on a narrower amber strip
// under it (8 px gap), house position left 84 / bottom 300; Söhne
// Dreiviertelfett 96 for the name, Söhne Kräftig 36 for the job (sentence case,
// as the chosen tag); ONE shadow for the pair (lifted); the amber's bloom; the
// cream's lit top edge and the amber's hot top edge. WCAG contrast: name 16.2:1
// on cream, job 10.2:1 on amber. Everything is stoutShared's StoutNameTag.
//
// MOTION (TAG_IN, from the chosen design), every part on the house ease-out:
//   cream strip   f0-20   slides up 64 px + fades in
//   name          f3-18   slides up 24 px + fades + blurs in (6 -> 0 px)
//   amber strip   f7-27   slides up 64 px + fades in (follows, never leads)
//   job           f12-27  slides up 24 px + fades + blurs in
//   lift          f0-27   the tag's one shadow rises one elevation (lifted ->
//                         float) while a strip travels and settles as it lands
//   f27-95        static hold: no outro, no idle motion
// `backdrop` draws out/wolff/toto_backdrop_9x16.jpg under the tag for review
// renders only; the deliverable is rendered without it (transparent).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 96;
export const SETTLED_F = TAG_IN.hold; // 27

export const schema = z.object({
  name: z.string(),
  job: z.string(),
  /** review only: the footage still under the tag */
  backdrop: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ name: "Toto Wolff", job: "CEO of Mercedes F1 team", backdrop: false });

const NameTagStout: React.FC<Props> = ({ name, job, backdrop }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {backdrop ? (
        <Img src={staticFile("cheekypint2/toto_backdrop_9x16.jpg")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
      ) : null}
      <StoutNameTag name={name} job={job} frame={frame} />
    </AbsoluteFill>
  );
};
export default NameTagStout;
