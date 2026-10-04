import React from "react";
import { useCurrentFrame } from "remotion";
import { z } from "zod";
import { INK_FULL } from "./incaShared";
import { DEAD_OP } from "./kdMotion";
import { C2, C2_TO_TAU, FPS, c2Cam, musterAt } from "./pageMotion";
import { PageScene } from "./AgainstAlmostHundredThousand";

export const DURATION = C2.DURATION;
export { FPS };

// ---------------------------------------------------------------------------
// ConquistadorsMuster (C2). Dwarkesh Patel with Si Sheppard, clip
// "Sheppard_Cajamarca_infinite_KD": Pizarro at Cajamarca, 16 Nov 1532.
//   "...he has some 160, 190 conquistadors."
// DWARKESH MAP STYLE, the KdRatioOfInfinity page (see
// AgainstAlmostHundredThousand for the world): the umber page, the engraved
// ground with its plots and ticks, orange = Pizarro's side, 1 dot = 1 man.
// Opaque 1080x1920, 24 fps. Motion: pageMotion.ts (MUSTER, musterAt, c2Cam);
// every layer is AgainstAlmostHundredThousand's PageScene, so C2's last frame
// is A2's opening state one frame early (page time tau = f - 91).
//
// TIMELINE. In-point 3.74 s on the edit timeline; f = round((t - 3.74) * 24):
//   he f0 · has f2 · some f7 · 160 f12 (ends f26) · 190 f36 · CONQUISTADORS f55
//   (ends f76) · "So," f83 · A2's in-point = f91.
// DURATION = round((7.54 - 3.74) * 24) = round(91.2) = 91 frames (f0..f90):
//   C2's frame 91 would be A2's frame 0.
//
// THE GESTURES:
//   1. The muster f0-f58: close (k 3.06 -> 3.02) on the orange plot. Pizarro's
//      168 march in along the ground from the right edge in a loose marching
//      column (three loose files by the height of the ranks they are bound for;
//      hashed gaps, so men bunch and gap; each a little off his file's line,
//      with his own step bob and an easy surge and lag in his pace; never two
//      in one file closer than ~6 px) and take their places in the company
//      block file by file, front file first, the files taking turns: one man
//      every ~0.33 f, steady (it reads as counting; first in f3.6, last f57.9,
//      on "conquistadors"). Each drifts to his rank's height over his last 16
//      px, steps into his slot from his walking speed to rest (C1) and settles
//      2-3 f. Walking 7.5 world px/f (<= 28 screen px/f). The camera starts 95
//      world px right, on the column, and glides left with it onto the block
//      (f-24..f60; <= 6.4 px/f, |dv| <= 0.26 px/f^2).
//   2. "168" ~f62: slides up under the block (f48-f62), A2's exact label
//      (NumeralLabel, IM Fell English roman, 156 px).
//   3. f60-f90: the camera is A2's opening creep (pageOpeningCam(f - 91), C1
//      throughout, asserted from f62); the last frame is A2's opening state at
//      tau = -1 (join test: 0 pixels differ; SP/P/join).
// No other text, no counters, no "160" / "190".
//
// COUNTS AND SOURCES: 168 = 62 horse + 106 foot (Hemming; Lockhart, The Men of
//   Cajamarca); the speaker says "160, 190"; Pedro Pizarro's spy counted ~190.
// ---------------------------------------------------------------------------

export const schema = z.object({ vignette: z.number(), deadOpacity: z.number() });
export type Props = z.infer<typeof schema>;
export const defaultProps: Props = schema.parse({ vignette: 0.55, deadOpacity: DEAD_OP });

const LABEL_F0 = 48; // "168" slides up f48-f62

const ConquistadorsMuster: React.FC<Props> = ({ vignette, deadOpacity }) => {
  const frame = useCurrentFrame();
  const tau = frame + C2_TO_TAU;
  return (
    <PageScene
      tau={tau}
      cam={c2Cam(frame)}
      company={musterAt(frame)}
      label168={{ op: INK_FULL, frame, f0: LABEL_F0 }}
      vignette={vignette}
      deadOpacity={deadOpacity}
    />
  );
};

export default ConquistadorsMuster;
