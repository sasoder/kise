import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { z } from "zod";
import { CTA_IN, StoutWatchHere } from "./stoutShared";

// ---------------------------------------------------------------------------
// CtaWatchHere — the end-card call to action in the STOUT system (Cheeky Pint
// S4E01, "Mercedes F1 financials"). Builder D, brief out/wolff/briefs/
// STOUT_MOTION.md + the user's note "arrows in watch here next to each other pls".
// TRANSPARENT 1080x1920 overlay, 24 fps, 168 f, placed at the end of the clip
// over the footage, pointing down at the platform's link / UI below it.
//
// THE CARD: a cream card carrying "Watch here" (Söhne Dreiviertelfett 96, the
// name tag's family) centred on the frame's axis at y 1150-1278, and ONE ROW of
// three amber chevrons under it, side by side, each pointing down (pitch 168,
// row 456 px: a touch narrower than the words), centred at y 1360. Amber with
// its bloom is the one glowing thing; the card has the lifted shadow and the
// cream's lit edge. Everything is stoutShared's StoutWatchHere (CTA, CTA_IN).
//
// MOTION (CTA_IN), every part on the house ease-out:
//   card       f0-18   slides up 64 px + fades in; its shadow lifts one level
//                      while it travels and settles as it lands
//   words      f4-18   slide up 24 px + fade + blur in
//   chevrons   f12 / f16 / f20 (10 f each), left to right: each drops in from
//                      24 px above (pointing down) while fading in, its own
//                      shadow lifted while it travels
//   THE LOOP   from f30, period 36 f: a pulse crosses the row left to right in
//                      26 f — each chevron it passes brightens by tone (amber
//                      toward the hot edge) and eases DOWN 6 px and back (cos^2:
//                      no bounce, no overshoot) — then the row rests for 10 f.
//   168 f = the loop 3.8 times; f164-167 rest, identical to the loop's first
//   frame f30, so the editor can hold the last frame or loop f30-165.
// `backdrop` draws out/wolff/toto_backdrop_9x16.jpg under it for review renders
// only; the deliverable is rendered without it (transparent).
// ---------------------------------------------------------------------------

export const FPS = 24;
export const DURATION = 168;
export const LOOP_START = CTA_IN.hold; // 30

export const schema = z.object({
  text: z.string(),
  /** review only: the footage still under the card */
  backdrop: z.boolean(),
});
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ text: "Watch here", backdrop: false });

const CtaWatchHere: React.FC<Props> = ({ text, backdrop }) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill>
      {backdrop ? (
        <Img src={staticFile("cheekypint2/toto_backdrop_9x16.jpg")} style={{ position: "absolute", left: 0, top: 0, width: 1080, height: 1920 }} />
      ) : null}
      <StoutWatchHere text={text} frame={frame} />
    </AbsoluteFill>
  );
};
export default CtaWatchHere;

// The loop's promise, checked at load: the file's last frames rest exactly as the loop starts.
{
  const u = ((DURATION - 1 - LOOP_START) % CTA_IN.loop) / CTA_IN.loop;
  if (u < CTA_IN.sweep) throw new Error(`CtaWatchHere: the last frame is mid-pulse (phase ${u.toFixed(3)}), not at rest`);
}
